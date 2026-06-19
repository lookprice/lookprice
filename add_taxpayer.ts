
import { pool } from "./models/db";

(async () => {
    try {
        const vkn = "0730433545";
        const title = "MÜŞTERİ HİZMETLERİ VE BİLİŞİM HİZMETLERİ"; // Or whatever the real title is
        
        await pool.query(`
            INSERT INTO official_taxpayer_cache (vkn, taxpayer_title, last_updated) 
            VALUES ($1, $2, NOW()) 
            ON CONFLICT (vkn) DO UPDATE SET taxpayer_title = EXCLUDED.taxpayer_title, last_updated = NOW()
        `, [vkn, title]);
        
        console.log(`Inserted ${vkn} into official_taxpayer_cache`);
    } catch (err: any) {
        console.error(err);
    }
    await pool.end();
})().catch(console.error);
