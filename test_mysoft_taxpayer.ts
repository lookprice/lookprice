import axios from "axios";
import { pool } from "./models/db";

async function run() {
  const storeId = 2; // MA Elektronik or Lookprice store id
  const vknTckn = "6090980112";
  
  try {
    const storeRes = await pool.query("SELECT einvoice_settings FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) throw new Error("Store and settings not found!");
    const settings = storeRes.rows[0].einvoice_settings || {};
    
    console.log("Using credentials:", {
      username: settings.username,
      tenantId: settings.tenant_id,
      endpoint: settings.endpoint || "https://edeskapi.mysoft.com.tr/api"
    });
    
    // Auth
    const authUrl = `${settings.endpoint || "https://edeskapi.mysoft.com.tr/api"}/Acount/Login`;
    console.log(`Authenticating at ${authUrl}...`);
    const authRes = await axios.post(authUrl, {
      username: settings.username,
      password: settings.password
    }, {
      headers: { "Content-Type": "application/json" }
    });
    
    const token = authRes.data.Data || authRes.data.data;
    console.log("Auth success, token obtained.");
    
    const config: any = {
      headers: { Authorization: `Bearer ${token}` }
    };
    if (settings.tenant_id) {
      config.headers['TenantId'] = settings.tenant_id;
      config.headers['ApplicationId'] = settings.tenant_id;
    }
    
    const variations = [
      `${settings.endpoint || "https://edeskapi.mysoft.com.tr/api"}/Contact/GetContactByVkn?vkn=${vknTckn}`,
      `${settings.endpoint || "https://edeskapi.mysoft.com.tr/api"}/Contact/GetTaxpayerByVkn?vkn=${vknTckn}`,
      `${settings.endpoint || "https://edeskapi.mysoft.com.tr/api"}/Common/GetTaxpayer?vkn=${vknTckn}`
    ];
    
    for (const url of variations) {
      try {
        console.log(`\nTesting URL: ${url}`);
        const response = await axios.get(url, config);
        console.log("STATUS:", response.status);
        console.log("RESPONSE DATA:");
        console.log(JSON.stringify(response.data, null, 2));
      } catch (err: any) {
        console.error(`Failed: ${err.message}`, err.response?.data);
      }
    }
    
  } catch (err: any) {
    console.error("Test error:", err.message);
  } finally {
    await pool.end();
  }
}

run();
