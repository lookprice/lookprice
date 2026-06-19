
import { getEInvoiceService } from "./routes/einvoice";
import { pool } from "./models/db";

(async () => {
    const service = await getEInvoiceService(2);
    const vkn = "0730018000";
    
    try {
        console.log(`\n--- Testing checkTaxpayer for VKN: ${vkn} ---`);
        const result = await service.checkTaxpayer(vkn);
        console.log("Check result:", result);
    } catch (err: any) {
        console.log("Error:", err.message);
    }
    await pool.end();
})().catch(console.error);
