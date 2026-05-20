
import axios from 'axios';

// Integration service for Luma AI / 3D Reconstruction
export const triggerLumaReconstruction = async (imageUrls: string[]) => {
  console.log("Triggering 3D reconstruction with Luma AI for images:", imageUrls);
  
  if (!process.env.LOOKPRICE_LUMA_API) {
    throw new Error("LUMA_API_KEY is not defined");
  }

  const response = await axios.post(
    'https://api.lumalabs.ai/v1/reconstructions',
    {
      capture: {
        images: imageUrls.map(url => ({ uri: url }))
      }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.LOOKPRICE_LUMA_API}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data; // Should contain jobId
};

export const getReconstructionStatus = async (jobId: string) => {
    if (!process.env.LOOKPRICE_LUMA_API) {
      throw new Error("LUMA_API_KEY is not defined");
    }
  
    const response = await axios.get(
      `https://api.lumalabs.ai/v1/reconstructions/${jobId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.LOOKPRICE_LUMA_API}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  };
