
const RENDER_API_KEY = process.env.RENDER_API_KEY;
const RENDER_SERVICE_ID = process.env.RENDER_SERVICE_ID;

export const renderService = {
  async addCustomDomain(domain: string) {
    if (!RENDER_API_KEY || !RENDER_SERVICE_ID) {
      console.warn("Render API Key or Service ID missing. Skipping Render domain registration.");
      return null;
    }

    console.log(`[RenderService] Attempting to add custom domain: ${domain} to service: ${RENDER_SERVICE_ID}`);
    
    const url = `https://api.render.com/v1/services/${RENDER_SERVICE_ID}/custom-domains`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ name: domain })
    });

    const data: any = await response.json();
    if (!response.ok) {
      // If already exists, that's fine
      if (response.status === 409 || JSON.stringify(data).includes("already exists")) {
        console.log(`[RenderService] Domain ${domain} already exists on Render.`);
        return data;
      }
      console.error("[RenderService] API Error:", data);
      throw new Error(`Render API Error: ${data.message || JSON.stringify(data)}`);
    }

    console.log(`[RenderService] Successfully added domain ${domain} to Render.`);
    return data;
  }
};
