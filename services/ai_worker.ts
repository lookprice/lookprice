import { pool } from '../models/db';
import { triggerLumaReconstruction, getReconstructionStatus } from '../src/services/luma_ai';

export const startAiWorker = () => {
  console.log("AI Worker started...");
  
  setInterval(async () => {
    try {
      // 1. Handle Pending Jobs
      const pendingRes = await pool.query(
        "UPDATE ai_jobs SET status = 'processing', updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM ai_jobs WHERE status = 'pending' ORDER BY created_at ASC LIMIT 1) RETURNING *"
      );

      if (pendingRes.rowCount > 0) {
        const job = pendingRes.rows[0];
        console.log(`Initiating Job ${job.id}`);
        const lumaResult = await triggerLumaReconstruction(job.payload.images || []);
        await pool.query(
            "UPDATE ai_jobs SET result = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
            [JSON.stringify({ external_job_id: lumaResult.id }), job.id]
        );
      }

      // 2. Poll Processing Jobs
      const processingRes = await pool.query("SELECT * FROM ai_jobs WHERE status = 'processing'");
      for (const job of processingRes.rows) {
          const lumaJobId = job.result?.external_job_id;
          if (!lumaJobId) continue;

          console.log(`Polling status for job ${job.id}, external: ${lumaJobId}`);
          const statusResult = await getReconstructionStatus(lumaJobId);
          
          if (statusResult.status === 'completed') {
              console.log(`Job ${job.id} finalized.`);
              await pool.query("UPDATE ai_jobs SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [job.id]);
              
              if (job.entity_type === 'real_estate') {
                  const tourUrl = statusResult.render_url || statusResult.mesh_url; // Assuming key
                  await pool.query(
                      "UPDATE real_estate_properties SET virtual_tour_url = $1, ai_processing_status = 'completed' WHERE id = $2",
                      [tourUrl, job.entity_id]
                  );
              }
          }
      }

    } catch (error) {
      console.error("Worker error:", error);
    }
  }, 15000); // Poll every 15 seconds
};
