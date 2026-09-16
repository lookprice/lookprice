import { Pool } from 'pg';
import { MySoftService } from './src/services/backend/mysoftService';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  console.log("--- STARTING TEST REPRO 506 (ABSOLUTE) ---");
  const invoiceId = 506;
  const invRes = await pool.query("SELECT * FROM sales_invoices WHERE id = $1", [invoiceId]);
  const invoice = invRes.rows[0];
  const storeRes = await pool.query("SELECT einvoice_settings, branding FROM stores WHERE id = $1", [invoice.store_id]);
  const settings = storeRes.rows[0].einvoice_settings;
  const branding = storeRes.rows[0].branding;

  const service = new MySoftService(settings);
  const ettn = require('crypto').randomUUID();
  const docNo = "GEF2026" + String(Date.now()).substring(6);
  
  console.log("GENERATED ETTN:", ettn);

  const ublData: any = {
    tenantIdentifierNumber: settings.vkn,
    ettn: ettn,
    docNo: docNo,
    eDocumentType: "EFATURA",
    profile: "TEMELFATURA",
    invoiceType: "ISTISNA",
    docDate: "2026-09-14",
    docTime: "12:00:00",
    currencyCode: "EUR",
    currencyRate: 35.0,
    pkAlias: "urn:mail:defaultpk@forschnermobilite.com.tr",
    gbAlias: settings.sender_alias,
    supplierAccount: { vknTckn: settings.vkn, accountName: branding.store_name },
    invoiceAccount: { vknTckn: invoice.tax_number, accountName: invoice.customer_name },
    tax: [{
      taxAmount: 0,
      taxSubtotal: [{
        taxableAmount: 2750,
        taxAmount: 0,
        percent: "0",
        taxTypeCode: "0015",
        taxExemptionReasonCode: "301",
        taxExemptionReason: "301-11/1-a Mal İhracatı",
        taxCategory: {
          taxExemptionReasonCode: "301",
          taxExemptionReason: "301-11/1-a Mal İhracatı",
          taxScheme: { taxTypeCode: "0015", taxTypeName: "Katma Değer Vergisi" }
        }
      }]
    }],
    invoiceDetail: [{
      productName: "Test Item",
      qty: "1",
      unitPriceTra: "2750",
      amtTra: "2750",
      vatRate: "0",
      amtVatTra: "0",
      taxableAmtTra: "2750",
      taxTypeCode: "0015",
      taxExemptionReasonCode: "301",
      taxExemptionReason: "301-11/1-a Mal İhracatı",
      taxCategory: {
        taxExemptionReasonCode: "301",
        taxExemptionReason: "301-11/1-a Mal İhracatı",
        taxScheme: { taxTypeCode: "0015", taxTypeName: "Katma Değer Vergisi" }
      }
    }],
    invoiceCalculation: {
      lineExtensionAmount: 2750,
      taxExclusiveAmount: 2750,
      taxInclusiveAmount: 2750,
      payableAmount: 2750,
      grandTotalAmountText: "İki Bin Yediyüz Elli Euro"
    }
  };

  try {
    const res = await service.sendInvoice(ublData);
    console.log("SUCCESS:", res);
  } catch (err: any) {
    console.log("FAILED:", err.message);
  }
  process.exit(0);
}
run();
