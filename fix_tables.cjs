const fs = require('fs');
let content = fs.readFileSync('routes/store.ts', 'utf8');

content = content.replace(
    'const storeRes = await pool.query("SELECT page_layout_settings FROM stores WHERE id = $1", [storeId]);',
    'const storeRes = await pool.query("SELECT branding FROM stores WHERE id = $1", [storeId]);'
);

content = content.replace(
    'const settings = storeRes.rows[0].page_layout_settings;',
    `let branding = storeRes.rows[0].branding;
            if (typeof branding === 'string') {
                try { branding = JSON.parse(branding); } catch (e) {}
            }
            const settings = branding?.page_layout_settings;`
);

fs.writeFileSync('routes/store.ts', content);
