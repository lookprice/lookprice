import { pool } from '../../models/db.js';
import { lumaAiService } from './luma_ai.js';
import { replicateAiService } from './replicate_ai.js';

let isWorkerRunning = false;
let pollingInterval: NodeJS.Timeout | null = null;

export const aiWorkerService = {
  /**
   * Start the AI Worker to process pending jobs in the "ai_jobs" table
   * Steps:
   * 1. Finds 'pending' jobs
   * 2. Calls Luma or Replicate API
   * 3. Sets job to 'processing' and saves external_job_id
   * 4. Finds 'processing' jobs and checks their status
   * 5. When done, updates property and sets to 'completed'
   */
  startWorker() {
    if (isWorkerRunning) return;
    isWorkerRunning = true;
    console.log("🚀 AI Worker Started - Processing AI Jobs (3D Virtual Tours & Staging)");

    // NOTE: This polling structure is Phase 1. 
    // In Phase 2 (Scale phase), we will use BullMQ + Redis for event-driven job handling.
    pollingInterval = setInterval(async () => {
      try {
        await this.processPendingJobs();
        await this.checkProcessingJobs();
      } catch (error) {
        console.error("AI Worker Error:", error);
      }
    }, 15000); // Check every 15 seconds
  },

  stopWorker() {
    if (pollingInterval) clearInterval(pollingInterval);
    isWorkerRunning = false;
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
