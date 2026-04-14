import { pool } from "../../models/db";

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

export const cloudflareService = {
  async addCustomHostname(domain: string) {
    if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID || !CLOUDFLARE_ACCOUNT_ID) {
      throw new Error("Cloudflare configuration missing");
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/zones/${CLOUDFLARE_ZONE_ID}/custom_hostnames`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hostname: domain,
          ssl: {
            method: "http",
            type: "dv",
          },
        }),
      }
    );

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.errors[0].message);
    }
    return data.result;
  },

  async getHostnameStatus(hostnameId: string) {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/zones/${CLOUDFLARE_ZONE_ID}/custom_hostnames/${hostnameId}`,
      {
        headers: {
          "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
      }
    );
    const data = await response.json();
    return data.result;
  },
};
