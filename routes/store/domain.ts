import express from "express";
import { pool } from "../../models/db";

const router = express.Router();

// --- DOMAIN MANAGEMENT ---

router.post("/", async (req: any, res) => {
  const { domain, manualToken, manualAccount, manualEmail } = req.body;
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;

  if (!storeId) return res.status(400).json({ error: "Store ID required" });

  try {
    const { cloudflareService } = await import("../../src/services/cloudflareService");
    
    const zoneResult = await cloudflareService.createZone(domain, manualToken, manualAccount, manualEmail);
    const zoneId = zoneResult.id;
    const nameServers = zoneResult.name_servers;

    await cloudflareService.ensureDnsRecord(zoneId, "A", "@", "216.24.57.1", false, manualToken, manualAccount, manualEmail);
    await cloudflareService.ensureDnsRecord(zoneId, "CNAME", "www", "lookprice-2bpv.onrender.com", false, manualToken, manualAccount, manualEmail);
    await cloudflareService.setZoneSslMode(zoneId, "flexible", manualToken, manualAccount, manualEmail);

    try {
      const { renderService } = await import("../../src/services/renderService");
      await renderService.addCustomDomain(domain);
      if (!domain.startsWith('www.')) {
        await renderService.addCustomDomain(`www.\${domain}`);
      }
    } catch (renderErr: any) {
      console.warn("Render registration warning (non-fatal):", renderErr.message);
    }

    await pool.query(
      "UPDATE stores SET custom_domain = $1, custom_domain_status = $2, cf_zone_id = $3, cf_name_servers = $4, cf_api_token = $5, cf_account_id = $6, cf_api_email = $7 WHERE id = $8",
      [domain, zoneResult.status || 'pending', zoneId, JSON.stringify(nameServers), manualToken || null, manualAccount || null, manualEmail || null, storeId]
    );
    
    res.json({ success: true, name_servers: nameServers, status: zoneResult.status });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.get("/", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  
  if (!storeId) return res.json({ success: true, status: 'none' });

  try {
    const storeRes = await pool.query("SELECT custom_domain, custom_domain_status, cf_zone_id, cf_name_servers, cf_api_token, cf_account_id FROM stores WHERE id = $1", [storeId]);
    const store = storeRes.rows[0];
    
    if (!store) return res.status(404).json({ error: "Store not found" });

    const isConfigured = !!(
      (process.env.CLOUDFLARE_API_TOKEN || process.env.VITE_CLOUDFLARE_API_TOKEN || store.cf_api_token) && 
      (process.env.CLOUDFLARE_ACCOUNT_ID || process.env.VITE_CLOUDFLARE_ACCOUNT_ID || store.cf_account_id)
    );

    if (!store.custom_domain || !store.cf_zone_id) {
      if (store.custom_domain_status === 'manual') {
        return res.json({ success: true, domain: store.custom_domain, status: 'manual', isConfigured });
      }
      return res.json({ success: true, domain: store.custom_domain || null, status: 'none', isConfigured });
    }
    
    const { cloudflareService } = await import("../../src/services/cloudflareService");
    
    let zoneStatus;
    try {
      zoneStatus = await cloudflareService.getZoneStatus(store.cf_zone_id, store.cf_api_token, store.cf_account_id);
    } catch (cfError: any) {
      return res.json({ 
        success: true,
        domain: store.custom_domain, 
        status: store.custom_domain_status,
        name_servers: store.cf_name_servers,
        isConfigured,
        cfError: cfError.message
      });
    }
    
    if (zoneStatus.status !== store.custom_domain_status) {
      await pool.query("UPDATE stores SET custom_domain_status = $1 WHERE id = $2", [zoneStatus.status, storeId]);
      store.custom_domain_status = zoneStatus.status;
    }
    
    res.json({ 
      success: true,
      domain: store.custom_domain, 
      status: store.custom_domain_status,
      name_servers: store.cf_name_servers,
      isConfigured
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/fix", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  if (!storeId) return res.status(400).json({ error: "Store ID required" });

  try {
    const storeRes = await pool.query("SELECT custom_domain, cf_zone_id, cf_api_token, cf_account_id FROM stores WHERE id = $1", [storeId]);
    const store = storeRes.rows[0];
    
    if (!store || !store.cf_zone_id) return res.status(400).json({ error: "No Cloudflare zone found" });

    const { cloudflareService } = await import("../../src/services/cloudflareService");
    
    await cloudflareService.ensureDnsRecord(store.cf_zone_id, "A", "@", "216.24.57.1", false, store.cf_api_token, store.cf_account_id);
    await cloudflareService.ensureDnsRecord(store.cf_zone_id, "CNAME", "www", "lookprice-2bpv.onrender.com", false, store.cf_api_token, store.cf_account_id);
    await cloudflareService.setZoneSslMode(store.cf_zone_id, "flexible", store.cf_api_token, store.cf_account_id);

    try {
      const { renderService } = await import("../../src/services/renderService");
      await renderService.addCustomDomain(store.custom_domain);
      if (!store.custom_domain.startsWith('www.')) {
        await renderService.addCustomDomain(`www.\${store.custom_domain}`);
      }
    } catch (renderErr: any) {
      console.warn("Render fix registration warning:", renderErr.message);
    }

    res.json({ success: true, message: "DNS records fixed and set to Grey Cloud." });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/manual", async (req: any, res) => {
  const { domain } = req.body;
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;

  if (!domain || !storeId) return res.status(400).json({ error: "Missing domain or storeId" });

  try {
    const { renderService } = await import("../../src/services/renderService");
    try {
      await renderService.addCustomDomain(domain);
      if (!domain.startsWith('www.')) {
        await renderService.addCustomDomain(`www.\${domain}`);
      }
    } catch (renderError: any) {
      console.warn("[Render Manual Custom Domain Error]", renderError);
    }

    await pool.query(
      "UPDATE stores SET custom_domain = $1, custom_domain_status = $2 WHERE id = $3",
      [domain, 'manual', storeId]
    );
    res.json({ success: true, message: "Domain saved manually" });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
