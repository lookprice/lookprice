import { getEInvoiceService } from "./routes/einvoice";
async function run() {
  try {
     const service = await getEInvoiceService(2); // GAP
     console.log("Service created");
     const result = await service.checkTaxpayer("4840843430");
     console.log("Result:", result);
  } catch (e) {
      console.error(e);
  }
}
run();
