import fetch from "node-fetch";

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

export const cloudflareService = {
  async addCustomHostname(hostname: string) {
    if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
      throw new Error("Cloudflare configuration missing (API Token or Zone ID)");
    }

    console.log(`Adding custom hostname to Cloudflare: ${hostname}`);
    const url = `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/custom_hostnames`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        hostname: hostname,
        ssl: {
          method: "http",
          type: "dv",
        },
      }),
    });

    const data: any = await response.json();
    console.log("Cloudflare API Response (Add):", JSON.stringify(data, null, 2));
    if (!response.ok) {
      console.error("Cloudflare API Error (Add):", data);
      throw new Error(`Failed to add custom hostname: ${data.errors?.[0]?.message || JSON.stringify(data.errors)}`);
    }

    return data.result;
  },

  async getCustomHostnameStatus(hostname: string) {
    if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
      throw new Error("Cloudflare configuration missing");
    }

    const url = `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/custom_hostnames?hostname=${hostname}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    const data: any = await response.json();
    if (!response.ok) {
      console.error("Cloudflare API Error (Status):", data);
      throw new Error(`Failed to get custom hostname status: ${data.errors?.[0]?.message || JSON.stringify(data.errors)}`);
    }

    return data.result?.[0] || null;
  },
};
