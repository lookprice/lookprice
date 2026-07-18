import express from "express";
import { pool } from "../../models/db";
import { getAuthorizedStoreId } from "./utils";

const router = express.Router();

// Restaurant Tables handlers
const getTables = async (req: any, res: any) => {
    const storeId = await getAuthorizedStoreId(req, req.query.storeId);
    if (storeId === null) return res.status(403).json({ error: "Store ID unauthorized" });
    try {
        const storeRes = await pool.query("SELECT branding FROM stores WHERE id = $1", [storeId]);
        let targetTableCount = 12; 
        if (storeRes.rows.length > 0) {
            let branding = storeRes.rows[0].branding;
            if (typeof branding === 'string') {
                try { branding = JSON.parse(branding); } catch (e) {}
            }
            const settings = branding?.page_layout_settings;
            if (settings && settings.table_count) {
                targetTableCount = parseInt(settings.table_count);
            }
        }
        
        let result = await pool.query("SELECT * FROM restaurant_tables WHERE store_id = $1 ORDER BY id ASC", [storeId]);
        
        if (result.rows.length !== targetTableCount) {
            if (result.rows.length < targetTableCount) {
                for (let i = result.rows.length + 1; i <= targetTableCount; i++) {
                    const tableNumber = String(i);
                    const existing = result.rows.find((t: any) => t.table_number === tableNumber);
                    if (!existing) {
                       await pool.query("INSERT INTO restaurant_tables (store_id, table_number, status) VALUES ($1, $2, 'empty')", [storeId, tableNumber]);
                    }
                }
            }
            result = await pool.query("SELECT * FROM restaurant_tables WHERE store_id = $1 ORDER BY id ASC", [storeId]);
        }
        
        const pendingSalesRes = await pool.query(
            "SELECT DISTINCT customer_name, restaurant_table_id FROM sales WHERE store_id = $1 AND status = 'pending'",
            [storeId]
        );
        const normalize = (str: string) => str ? str.toLowerCase().replace(/\s+/g, '') : '';
        const pendingTableNames = pendingSalesRes.rows.map((s: any) => normalize(s.customer_name));
        const pendingTableIds = new Set(pendingSalesRes.rows.filter((s: any) => s.restaurant_table_id !== null).map((s: any) => s.restaurant_table_id));

        for (let row of result.rows) {
            const num = row.table_number;
            const isOccupied = pendingTableIds.has(row.id) || pendingTableNames.some(name => {
                if (!name) return false;
                const normNum = normalize(num);
                return name === normNum || name === `masa${normNum}` || name.includes(`masa${normNum}`) || name === `table${normNum}`;
            });
            row.status = isOccupied ? 'occupied' : 'empty';
        }

        const sortedRows = result.rows.sort((a: any, b: any) => {
           const numA = parseInt(a.table_number);
           const numB = parseInt(b.table_number);
           if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
           return a.table_number.localeCompare(b.table_number);
        });
        
        const finalRows = sortedRows.filter((r: any, idx: number) => {
            if (idx < targetTableCount) return true;
            return r.status === 'occupied'; 
        });

        res.json(finalRows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

const postTable = async (req: any, res: any) => {
    const storeId = await getAuthorizedStoreId(req, req.body.storeId);
    if (storeId === null) return res.status(403).json({ error: "Store ID unauthorized" });
    const { tableNumber } = req.body;
    try {
        const result = await pool.query("INSERT INTO restaurant_tables (store_id, table_number) VALUES ($1, $2) RETURNING *", [storeId, tableNumber]);
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

const putTable = async (req: any, res: any) => {
    const { id } = req.params;
    const { status } = req.body;
    const storeId = req.user.store_id; 
    try {
        const result = await pool.query("UPDATE restaurant_tables SET status = $1 WHERE id = $2 AND store_id = $3 RETURNING *", [status, id, storeId]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Table not found" });
        res.json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Mount handlers on both base paths and /tables paths
router.get("/", getTables);
router.get("/tables", getTables);

router.post("/", postTable);
router.post("/tables", postTable);

router.put("/:id", putTable);
router.put("/tables/:id", putTable);

export default router;
