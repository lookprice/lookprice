import axios from 'axios';

const LUMA_API_URL = 'https://api.lumalabs.ai/dream-machine/v1';
const LUMA_API_KEY = process.env.LOOKPRICE_LUMA_API;

export const lumaAiService = {
  /**
   * Triggers a new 3D model generation job using Luma AI (Gaussian Splatting / NeRF)
   * This is used for creating navigable 3D spaces from a set of images or a video.
   * Documentation: https://docs.lumalabs.ai
   */
  async create3DModelFromImages(imageUrls: string[], propertyId: string) {
    if (!LUMA_API_KEY) {
      console.warn("LUMA AI API key missing, running in simulation mode.");
      // Return a mock job ID
      return { jobId: `mock-luma-job-${propertyId}-${Date.now()}`, status: 'processing', simulated: true };
    }

    try {
      // Create a capture or generation job in Luma AI
      // NOTE: Luma typically takes a video or zip of images to create a splat
      // We assume the payload will be prepared (e.g. zip file on GCP) and passed here.
      // This is the structure for the Dream Machine / Luma API request
      const response = await axios.post(
        `${LUMA_API_URL}/generations`,
        {
          // Adjust payload based on Luma's exact 3D generation API Spec for your use-case
          images: imageUrls,
          type: "3d", 
          metadata: { propertyId }
        },
        {
          headers: {
            'Authorization': `Bearer ${LUMA_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        jobId: response.data.id,
        status: response.data.state, // e.g., "dreaming", "completed", "failed"
        simulated: false
      };
    } catch (error: any) {
      console.error("Luma AI Generation Error:", error.response?.data || error.message);
      throw new Error("Failed to trigger Luma AI job");
    }
  },

  /**
   * Check the status of a Luma AI job
   */
  async checkJobStatus(jobId: string) {
    if (jobId.startsWith('mock-')) {
      // Simulate processing time
      return { status: 'completed', modelUrl: 'https://cdn.example.com/mock-model.splat' };
    }

    try {
      const response = await axios.get(`${LUMA_API_URL}/generations/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${LUMA_API_KEY}`,
        },
      });

      return {
        status: response.data.state,
        modelUrl: response.data.assets?.model_3d // Extract the GLTF/SPLAT URL depending on Luma's response
      };
    } catch (error: any) {
      console.error("Luma AI Status Error:", error.response?.data || error.message);
      throw new Error("Failed to check Luma AI job status");
    }
  }
};
