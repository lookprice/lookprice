
import pg from 'pg';
const { Pool } = pg;

async function checkEnvValues() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  
  console.log("CLOUDFLARE_API_TOKEN length:", token ? token.length : 0);
  console.log("CLOUDFLARE_API_TOKEN prefix:", token ? token.substring(0, 4) : "N/A");
  console.log("CLOUDFLARE_ACCOUNT_ID length:", accountId ? accountId.length : 0);
  console.log("CLOUDFLARE_ACCOUNT_ID prefix:", accountId ? accountId.substring(0, 4) : "N/A");
}

checkEnvValues();
