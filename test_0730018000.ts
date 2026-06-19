
import { getEInvoiceService } from "./routes/einvoice";
import axios from "axios";

(async () => {
    // Assuming storeId 2 is where we test
    const service = await getEInvoiceService(2);
    const vkn = "0730018000";
    
    // We need to simulate the call that happens in checkTaxpayer
    // The service has authenticate() method but it's private? 
    // Wait, the service has access to credentials.
    
    // Actually, I can just call checkTaxpayer but log the response in the service if I edit it.
    // Or I can copy the auth logic to this test file.
    
    // Let's copy the auth logic
    const baseUrl = "https://edocumentapi.mysoft.com.tr/api";
    // I need credentials. They are in the service.
    // I'll just temporarily log raw response inside the file and run it.
    
    console.log("Edit src/services/backend/mysoftService.ts to log more.");
})().catch(console.error);
