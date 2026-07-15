const fs = require('fs');
let content = fs.readFileSync('routes/store.ts', 'utf8');

const replacement = `
// Restaurant Tables
router.get("/restaurant-tables", async (req: any, res) => {
    const storeId = await getAuthorizedStoreId(req, req.query.storeId);
    if (storeId === null) return res.status(403).json({ error: "Store ID unauthorized" });
    try {
        const storeRes = await pool.query("SELECT page_layout_settings FROM stores WHERE id = $1", [storeId]);
        let targetTableCount = 12; // Default
        if (storeRes.rows.length > 0) {
            const settings = storeRes.rows[0].page_layout_settings;
            if (settings && settings.table_count) {
                targetTableCount = parseInt(settings.table_count);
            }
        }
        
        let result = await pool.query("SELECT * FROM restaurant_tables WHERE store_id = $1 ORDER BY id ASC", [storeId]);
        
        if (result.rows.length !== targetTableCount) {
            if (result.rows.length < targetTableCount) {
                // Add missing tables
                for (let i = result.rows.length + 1; i <= targetTableCount; i++) {
                    const tableNumber = \`\${i}\`;
                    const existing = result.rows.find((t: any) => t.table_number === tableNumber);
                    if (!existing) {
                       await pool.query("INSERT INTO restaurant_tables (store_id, table_number, status) VALUES ($1, $2, 'empty')", [storeId, tableNumber]);
                    }
                }
            } else {
                // Don't delete occupied tables, just mark as inactive or something, or perhaps just hide them in UI.
                // For simplicity, let's just delete empty tables that exceed the count.
                // Actually, let's just return the top N tables or let the UI handle it.
                // It's safer to only add missing tables.
            }
            // Fetch again
            result = await pool.query("SELECT * FROM restaurant_tables WHERE store_id = $1 ORDER BY id ASC", [storeId]);
            
            // Limit to targetTableCount in case we have more, but only hide empty ones if possible.
            // Or just return everything and let UI handle, but here we can just return all or slice.
        }
        
        // Sort properly by number
        const sortedRows = result.rows.sort((a: any, b: any) => {
           const numA = parseInt(a.table_number);
           const numB = parseInt(b.table_number);
           if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
           return a.table_number.localeCompare(b.table_number);
        });
        
        // Ensure we only return targetTableCount if it's less, unless occupied
        const finalRows = sortedRows.filter((r: any, idx: number) => {
            if (idx < targetTableCount) return true;
            return r.status === 'occupied'; // Keep occupied tables even if they exceed count
        });

        res.json(finalRows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});
`;

content = content.replace(/\/\/ Restaurant Tables[\s\S]*?res\.status\(500\)\.json\(\{ error: error\.message \}\);\n    \}\n\}\);/, replacement.trim());
fs.writeFileSync('routes/store.ts', content);
