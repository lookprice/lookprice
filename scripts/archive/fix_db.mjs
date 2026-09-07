import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:5432/postgres' });
async function fix() {
  const result = await pool.query("SELECT id, branding FROM stores");
  for (const row of result.rows) {
    if (row.branding && typeof row.branding === 'object') {
       let br = { ...row.branding };
       let changed = false;
       while (br.branding) {
         const nested = br.branding;
         delete br.branding;
         br = { ...nested, ...br };
         changed = true;
       }
       // remove db columns from branding
       const colsToRemove = ['id', 'created_at', 'updated_at', 'store_id', 'cf_api_token', 'cf_account_id', 'cf_api_email', 'cf_zone_id', 'custom_domain_status', 'cf_name_servers', 'parent_id', 'hero_title', 'about_text'];
       for (const col of colsToRemove) {
         if (br[col] !== undefined) {
           delete br[col];
           changed = true;
         }
       }
       if (changed) {
         await pool.query("UPDATE stores SET branding = $1 WHERE id = $2", [JSON.stringify(br), row.id]);
         console.log(`Fixed store ${row.id}`);
       }
    }
  }
  process.exit(0);
}
fix();
