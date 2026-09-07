
const getCfConfig = (manualToken?: string, manualAccount?: string, manualEmail?: string) => {
  const token = (manualToken || 
                process.env.CLOUDFLARE_API_TOKEN || 
                process.env.VITE_CLOUDFLARE_API_TOKEN || 
                process.env.CF_API_TOKEN ||
                process.env.CLOUDFLARE_TOKEN || "").trim();

  const accountId = (manualAccount || 
                    process.env.CLOUDFLARE_ACCOUNT_ID || 
                    process.env.VITE_CLOUDFLARE_ACCOUNT_ID || 
                    process.env.CLOUDFLARE_ACC ||
                    process.env.CF_ACCOUNT_ID || "").trim();

  const email = (manualEmail || 
                 process.env.CLOUDFLARE_EMAIL || 
                 process.env.CF_EMAIL || "").trim();
  
  console.log("getCfConfig Debug:", {
    hasManualToken: !!manualToken,
    hasManualAccount: !!manualAccount,
    hasManualEmail: !!manualEmail,
    envTokenFound: !!process.env.CLOUDFLARE_API_TOKEN,
    envAccountFound: !!process.env.CLOUDFLARE_ACCOUNT_ID,
    envEmailFound: !!process.env.CLOUDFLARE_EMAIL,
    envKeys: Object.keys(process.env).filter(k => k.includes('CLOUD') || k.includes('CF'))
  });

  if (!token || !accountId) {
    throw new Error(`Cloudflare configuration missing. Please ensure you have entered API Token/Key and Account ID.`);
  }

  // Determine headers based on authentication type
  // API Tokens are typically 40 chars, Global Keys are 32 chars.
  // If email is provided, we use the legacy Global Key headers.
  const headers: any = {
    "Content-Type": "application/json"
  };

  if (email) {
    headers["X-Auth-Email"] = email;
    headers["X-Auth-Key"] = token;
  } else {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return { token, accountId, email, headers };
};

async function fetchWithTimeout(url: string, options: any = {}, timeout = 30000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

export const cloudflareService = {
  async createZone(domain: string, manualToken?: string, manualAccount?: string, manualEmail?: string) {
    const { accountId, headers } = getCfConfig(manualToken, manualAccount, manualEmail);

    console.log(`Creating Cloudflare Zone for: ${domain}`);
    const url = `https://api.cloudflare.com/client/v4/zones`;
    const response = await fetchWithTimeout(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        account: { id: accountId },
        name: domain,
        type: "full"
      }),
    });

    const data: any = await response.json();
    if (!response.ok) {
      // If the zone already exists in this account, we can fetch it
      if (data.errors?.[0]?.code === 1061) {
        console.log(`Zone ${domain} already exists, fetching it...`);
        return this.getZoneByName(domain, manualToken, manualAccount, manualEmail);
      }
      console.error("Cloudflare API Error (Create Zone):", data);
      throw new Error(`Failed to create zone: ${data.errors?.[0]?.message || JSON.stringify(data.errors)}`);
    }

    return data.result; // Contains id and name_servers
  },

  async getZoneByName(domain: string, manualToken?: string, manualAccount?: string, manualEmail?: string) {
    const { headers } = getCfConfig(manualToken, manualAccount, manualEmail);
    const url = `https://api.cloudflare.com/client/v4/zones?name=${domain}`;
    const response = await fetchWithTimeout(url, {
      method: "GET",
      headers,
    });
    const data: any = await response.json();
    if (!response.ok || !data.result || data.result.length === 0) {
      throw new Error(`Failed to fetch existing zone for ${domain}`);
    }
    return data.result[0];
  },

  async getDnsRecords(zoneId: string, manualToken?: string, manualAccount?: string, manualEmail?: string) {
    const { headers } = getCfConfig(manualToken, manualAccount, manualEmail);
    const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`;
    const response = await fetchWithTimeout(url, {
      method: "GET",
      headers
    });
    const data: any = await response.json();
    if (!response.ok) {
      throw new Error(`Failed to fetch DNS records: ${data.errors?.[0]?.message || JSON.stringify(data.errors)}`);
    }
    return data.result;
  },

  async updateDnsRecord(zoneId: string, recordId: string, type: string, name: string, content: string, proxied: boolean, manualToken?: string, manualAccount?: string, manualEmail?: string) {
    const { headers } = getCfConfig(manualToken, manualAccount, manualEmail);
    const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${recordId}`;
    const response = await fetchWithTimeout(url, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        type,
        name,
        content,
        proxied,
        ttl: 1
      }),
    });
    const data: any = await response.json();
    if (!response.ok) {
      throw new Error(`Failed to update DNS record: ${data.errors?.[0]?.message || JSON.stringify(data.errors)}`);
    }
    return data.result;
  },

  async ensureDnsRecord(zoneId: string, type: string, name: string, content: string, proxied: boolean, manualToken?: string, manualAccount?: string, manualEmail?: string) {
    const records = await this.getDnsRecords(zoneId, manualToken, manualAccount, manualEmail);
    
    // Normalize name for comparison (Cloudflare returns fully qualified names)
    const searchName = name === "@" ? undefined : name; // We'll check both
    
    const existing = records.find((r: any) => 
      r.type === type && 
      (r.name === name || r.name.startsWith(name + "."))
    );

    if (existing) {
      // Check if it needs update
      if (existing.content !== content || existing.proxied !== proxied) {
        console.log(`Updating existing DNS record ${type} ${name} to match desired state.`);
        return this.updateDnsRecord(zoneId, existing.id, type, name, content, proxied, manualToken, manualAccount, manualEmail);
      }
      console.log(`DNS record ${type} ${name} is already correct.`);
      return existing;
    }

    // Create new
    return this.addDnsRecord(zoneId, type, name, content, proxied, manualToken, manualAccount, manualEmail);
  },

  async addDnsRecord(zoneId: string, type: string, name: string, content: string, proxied: boolean, manualToken?: string, manualAccount?: string, manualEmail?: string) {
    const { headers } = getCfConfig(manualToken, manualAccount, manualEmail);
    const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`;
    const response = await fetchWithTimeout(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        type,
        name,
        content,
        proxied,
        ttl: 1 // Auto
      }),
    });

    const data: any = await response.json();
    if (!response.ok) {
      // Ignore if record already exists (code 81057 or 81058 or message check)
      const errorCode = data.errors?.[0]?.code;
      const errorMessage = data.errors?.[0]?.message || "";
      if (errorCode === 81057 || errorCode === 81058 || errorMessage.toLowerCase().includes("already exists")) {
        console.log(`DNS record ${type} ${name} already exists. Skipping.`);
        return null;
      }
      console.error(`Cloudflare API Error (Add DNS ${type} ${name}):`, data);
      throw new Error(`Failed to add DNS record: ${errorMessage}`);
    }
    return data.result;
  },

  async getZoneStatus(zoneId: string, manualToken?: string, manualAccount?: string, manualEmail?: string) {
    const { headers } = getCfConfig(manualToken, manualAccount, manualEmail);
    const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}`;
    const response = await fetchWithTimeout(url, {
      method: "GET",
      headers,
    });
    const data: any = await response.json();
    if (!response.ok) {
      throw new Error(`Failed to get zone status: ${data.errors?.[0]?.message || JSON.stringify(data.errors)}`);
    }
    return data.result;
  },

  async setupOriginRules(zoneId: string, originHost: string, manualToken?: string, manualAccount?: string, manualEmail?: string) {
    const { headers } = getCfConfig(manualToken, manualAccount, manualEmail);

    console.log(`Setting up Origin Rules for zone ${zoneId} to origin ${originHost}`);

    // 1. Origin Rule (Host Header Override)
    const originRuleUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/rulesets/phases/http_request_origin/entrypoint`;
    const originRuleResponse = await fetchWithTimeout(originRuleUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        rules: [
          {
            action: "route",
            action_parameters: {
              host_header: originHost
            },
            expression: "true",
            description: "Override Host Header to Origin"
          }
        ]
      }),
    });

    const originData: any = await originRuleResponse.json();
    if (!originRuleResponse.ok) {
      console.error("Cloudflare API Error (Origin Rule):", originData);
      // Don't throw if it's just a minor error, but log it
    }

    // 2. Transform Rule (Add X-Custom-Domain header)
    const transformRuleUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/rulesets/phases/http_request_late_transform/entrypoint`;
    const transformRuleResponse = await fetchWithTimeout(transformRuleUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        rules: [
          {
            action: "rewrite",
            action_parameters: {
              headers: {
                "X-Custom-Domain": {
                  operation: "set",
                  expression: "http.host"
                }
              }
            },
            expression: "true",
            description: "Inject X-Custom-Domain Header"
          }
        ]
      }),
    });

    const transformData: any = await transformRuleResponse.json();
    if (!transformRuleResponse.ok) {
      console.error("Cloudflare API Error (Transform Rule):", transformData);
    }

    return { originData, transformData };
  },

  async setZoneSslMode(zoneId: string, mode: "off" | "flexible" | "full" | "strict", manualToken?: string, manualAccount?: string, manualEmail?: string) {
    const { headers } = getCfConfig(manualToken, manualAccount, manualEmail);

    console.log(`Setting SSL mode to ${mode} for zone ${zoneId}`);
    const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/ssl`;
    const response = await fetchWithTimeout(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ value: mode }),
    });

    const data: any = await response.json();
    if (!response.ok) {
      console.error("Cloudflare API Error (SSL Mode):", data);
      // Non-fatal, just log it
    }
    return data.result;
  }
};
