import { pool } from '../../models/db.js';
import { lumaAiService } from './luma_ai.js';
import { replicateAiService } from './replicate_ai.js';

let isWorkerRunning = false;
let isTickRunning = false;
let pollingTimer: NodeJS.Timeout | null = null;
let currentDelayMs = 30000;
const MIN_DELAY_MS = 20000;
const MAX_IDLE_DELAY_MS = 300000; // 5 minutes when idle (cuts 11,520 idle queries/day down to ~288)

export const aiWorkerService = {
  startWorker() {
    if (isWorkerRunning) return;
    isWorkerRunning = true;
    currentDelayMs = 30000;
    console.log("🚀 AI Worker Started (Adaptive Backoff Egress-Safe Mode)");

    const scheduleNext = (delay: number) => {
      if (!isWorkerRunning) return;
      if (pollingTimer) clearTimeout(pollingTimer);
      pollingTimer = setTimeout(async () => {
        if (isTickRunning) {
          scheduleNext(currentDelayMs);
          return;
        }
        isTickRunning = true;
        try {
          // Single lightweight 20-byte check before pulling any rows
          const checkRes = await pool.query(
            "SELECT EXISTS(SELECT 1 FROM ai_jobs WHERE status IN ('pending', 'processing')) AS has_jobs"
          );
          if (checkRes.rows[0]?.has_jobs) {
            await this.processPendingJobs();
            await this.checkProcessingJobs();
            currentDelayMs = MIN_DELAY_MS;
          } else {
            currentDelayMs = Math.min(MAX_IDLE_DELAY_MS, Math.round(currentDelayMs * 2));
          }
        } catch (error) {
          currentDelayMs = MAX_IDLE_DELAY_MS;
        } finally {
          isTickRunning = false;
          scheduleNext(currentDelayMs);
        }
      }, delay);
    };

    scheduleNext(30000);
  },

  wakeWorker() {
    if (!isWorkerRunning) return;
    currentDelayMs = MIN_DELAY_MS;
    if (pollingTimer) {
      clearTimeout(pollingTimer);
      pollingTimer = null;
    }
    this.startWorker();
  },

  stopWorker() {
    if (pollingTimer) clearTimeout(pollingTimer);
    pollingTimer = null;
    isWorkerRunning = false;
    isTickRunning = false;
    console.log("⏹️ AI Worker Stopped");
  },

  async processPendingJobs() {
    // 1. Get pending jobs
    const { rows: pendingJobs } = await pool.query(
      "SELECT * FROM ai_jobs WHERE status = 'pending' LIMIT 5"
    );

    for (const job of pendingJobs) {
      try {
        // Mark as processing immediately to prevent duplicate pickup
        await pool.query("UPDATE ai_jobs SET status = 'processing', updated_at = NOW() WHERE id = $1", [job.id]);
        
        const payload = typeof job.payload === 'string' ? JSON.parse(job.payload) : job.payload;
        let externalJobId = null;

        if (job.job_type === 'virtual_tour_3d') {
          // Trigger Luma AI for 3D Gen
          const lumaJob = await lumaAiService.create3DModelFromImages(payload.images, job.property_id);
          externalJobId = lumaJob.jobId;
        } 
        else if (job.job_type === 'virtual_staging') {
          // Trigger Replicate for Image-to-Image styling
          const repJob = await replicateAiService.triggerVirtualStaging(payload.image, payload.prompt, job.property_id);
          externalJobId = repJob.jobId;
        }

        // Save External Job ID
        await pool.query(
          "UPDATE ai_jobs SET external_job_id = $1 WHERE id = $2",
          [externalJobId, job.id]
        );
        
        console.log(`Job ${job.id} (${job.job_type}) dispatched. External ID: ${externalJobId}`);
      } catch (err) {
        console.error(`Failed to process job ${job.id}`, err);
        await pool.query("UPDATE ai_jobs SET status = 'failed', updated_at = NOW() WHERE id = $1", [job.id]);
      }
    }
  },

  async checkProcessingJobs() {
    // 1. Get processing jobs that have an external_job_id
    const { rows: processingJobs } = await pool.query(
      "SELECT * FROM ai_jobs WHERE status = 'processing' AND external_job_id IS NOT NULL LIMIT 10"
    );

    for (const job of processingJobs) {
      try {
        if (job.job_type === 'virtual_tour_3d') {
          const lumaStatus = await lumaAiService.checkJobStatus(job.external_job_id);
          if (lumaStatus.status === 'completed' || lumaStatus.status === 'succeeded') {
            await this.completeJob(job.id, job.property_id, { type: 'virtual_tour_url', value: lumaStatus.modelUrl });
          } else if (lumaStatus.status === 'failed') {
            await this.failJob(job.id);
          }
        } 
        else if (job.job_type === 'virtual_staging') {
          const repStatus = await replicateAiService.checkJobStatus(job.external_job_id);
          if (repStatus.status === 'succeeded') {
            const outputImage = repStatus.output?.[0]; // Replicate returns an array
            await this.completeJob(job.id, job.property_id, { type: 'staged_image_url', value: outputImage });
          } else if (repStatus.status === 'failed' || repStatus.status === 'canceled') {
            await this.failJob(job.id);
          }
        }
      } catch (err) {
        console.error(`Failed to check status for job ${job.id}`, err);
      }
    }
  },

  async completeJob(jobId: string, propertyId: string, result: { type: string, value: string }) {
    await pool.query("BEGIN");
    try {
      if (result.type === 'virtual_tour_url') {
        // Update property virtual tour URL
        await pool.query(
          "UPDATE real_estate_properties SET virtual_tour_url = $1, updated_at = NOW() WHERE id = $2",
          [result.value, propertyId]
        );
      } else if (result.type === 'staged_image_url') {
        // This would likely go into a separate property_images table or a jsonb update
        // We'll simulate updating the property's metadata for the staged room
        await pool.query(
          "UPDATE real_estate_properties SET virtual_tour_url = $1, updated_at = NOW() WHERE id = $2", 
          [result.value, propertyId]
        );
      }
      
      await pool.query("UPDATE ai_jobs SET status = 'completed', completed_at = NOW(), result_payload = $1 WHERE id = $2", [JSON.stringify(result), jobId]);
      await pool.query("COMMIT");
      console.log(`Job ${jobId} completed successfully!`);
    } catch (err) {
      await pool.query("ROLLBACK");
      throw err;
    }
  },

  async failJob(jobId: string) {
    await pool.query("UPDATE ai_jobs SET status = 'failed', updated_at = NOW() WHERE id = $1", [jobId]);
    console.log(`Job ${jobId} failed upstream.`);
  }
};
