import axios from 'axios';

const REPLICATE_API_URL = 'https://api.replicate.com/v1';
const REPLICATE_API_TOKEN = process.env.LOOKPRICE_REPLICATE_API;

export const replicateAiService = {
  /**
   * Triggers a new Image-to-Image virtual staging job using Replicate
   * Useful Models: 
   * - jagilley/controlnet-hough (For geometry-preserving architecture)
   * - stability-ai/stable-diffusion (For generic inpainting)
   * Documentation: https://replicate.com/docs
   */
  async triggerVirtualStaging(imageUrl: string, prompt: string, propertyId: string) {
    if (!REPLICATE_API_TOKEN) {
      console.warn("REPLICATE API token missing, running in simulation mode.");
      return { jobId: `mock-repl-job-${propertyId}-${Date.now()}`, status: 'processing', simulated: true };
    }

    try {
      // Example using a ControlNet model that preserves room structure
      const modelVersion = "854e8727697a057c525cdb45ab037f64ecca770a1769cc52287c2e56472a247b"; // Example controlnet version 
      
      const response = await axios.post(
        `${REPLICATE_API_URL}/predictions`,
        {
          version: modelVersion,
          input: {
            image: imageUrl,
            prompt: prompt,
            num_samples: 1,
            // Negative prompt ensures we don't change the underlying structure
            negative_prompt: "low resolution, ugly, changed architecture, different windows, structural changes",
          },
          webhook: `${process.env.PUBLIC_API_URL || 'https://your-domain.com'}/api/ai-jobs/webhook`,
          webhook_events_filter: ["completed", "failed"]
        },
        {
          headers: {
            'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        jobId: response.data.id,
        status: response.data.status, // "starting", "processing"
        simulated: false
      };
    } catch (error: any) {
      console.error("Replicate AI Error:", error.response?.data || error.message);
      throw new Error("Failed to trigger Replicate AI job");
    }
  },

  /**
   * Check status (if webhook is not used or lost)
   */
  async checkJobStatus(jobId: string) {
    if (jobId.startsWith('mock-')) {
      return { status: 'succeeded', output: ['https://example.com/mock-staged-image.jpg'] };
    }

    try {
      const response = await axios.get(`${REPLICATE_API_URL}/predictions/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        },
      });

      return {
        status: response.data.status,
        output: response.data.output // usually an array of image URLs
      };
    } catch (error: any) {
      console.error("Replicate AI Status Error:", error.response?.data || error.message);
      throw new Error("Failed to check Replicate AI job status");
    }
  }
};
