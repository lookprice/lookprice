import { formatDateTR, formatDateTimeTR } from "./formatUtils";
import { resolvePrinterPaperWidth, ThermalPaperWidthMm } from "../data/posDevices";

export interface ThermalReceiptItem {
  name: string;
  quantity: number;
  price: number | string;
  note?: string;
}

export interface ThermalReceiptOptions {
  title?: string;
  storeName?: string;
  legalName?: string;
  branchName?: string;
  taxOffice?: string;
  taxNumber?: string;
  mersis?: string;
  storeAddress?: string;
  storePhone?: string;
  currency?: string;
  paperWidthMm?: ThermalPaperWidthMm;
  isCafe?: boolean;
  footerText?: string;
  tableNo?: string;
  waiterName?: string;
  customerName?: string;
  saleId?: string | number;
  date?: string;
  items?: ThermalReceiptItem[];
  totalAmount?: number;
  paymentMethod?: string;
  notes?: string;
  fiscalInfo?: {
    receiptNo?: string;
    zNo?: string;
    brand?: string;
    terminal?: string;
  };
}

export interface ThermalZReportOptions {
  title?: string;
  storeName?: string;
  legalName?: string;
  branchName?: string;
  taxOffice?: string;
  taxNumber?: string;
  mersis?: string;
  storeAddress?: string;
  storePhone?: string;
  currency?: string;
  paperWidthMm?: ThermalPaperWidthMm;
  reportDate?: string;
  isRange?: boolean;
  cashTotal?: number;
  cardTotal?: number;
  otherTotal?: number;
  grandTotal?: number;
  saleCount?: number;
  totalItemsSold?: number;
  products?: Array<{ product_name: string; total_quantity: number; total_revenue: number }>;
  printTime?: string;
}

const escapeHtml = (val: unknown): string => {
  if (val === null || val === undefined) return "";
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

export const getCurrencySymbol = (currency?: string): string => {
  const c = String(currency || "TRY").toUpperCase();
  if (c === "TRY" || c === "TL") return "₺";
  if (c === "USD") return "$";
  if (c === "EUR") return "€";
  if (c === "GBP") return "£";
  return c;
};

export const extractReceiptBrandingOptions = (branding: any) => {
  const storeDisplay =
    branding?.parent_store_name && branding?.parent_id && branding?.name && branding.parent_store_name !== branding.name
      ? `${branding.parent_store_name} - ${branding.name}`
      : (branding?.store_name || branding?.name || branding?.legal_name || "Seçkin Mağaza");

  const legalName = String(branding?.legal_name || "").trim();
  const branchName = branding?.parent_id && branding?.name ? String(branding.name).trim() : "";
  const taxOffice = String(
    branding?.legal_tax_office || branding?.einvoice_settings?.tax_office || ""
  ).trim();
  const taxNumber = String(
    branding?.legal_tax_number || branding?.einvoice_settings?.tax_number || branding?.einvoice_settings?.vkn || ""
  ).trim();
  const mersis = String(branding?.legal_mersis || "").trim();
  const storeAddress = String(branding?.legal_address || branding?.address || "").trim();
  const storePhone = String(branding?.legal_phone || branding?.phone || branding?.whatsapp_number || "").trim();
  const paperWidthMm = resolvePrinterPaperWidth(
    branding?.fiscal_brand,
    branding?.pos_bridge_settings,
    Boolean(branding?.fiscal_active)
  );
  const sector = String(branding?.page_layout_settings?.sector || branding?.store_type || "").toLowerCase();
  const isCafe = sector === "cafe_restaurant" || sector === "horeca" || sector === "horecalp" || sector === "hotel";
  const currency = branding?.default_currency || "TRY";

  return {
    storeName: storeDisplay,
    legalName,
    branchName,
    taxOffice,
    taxNumber,
    mersis,
    storeAddress,
    storePhone,
    paperWidthMm,
    isCafe,
    currency
  };
};

interface ThermalGeometry {
  pageWidthMm: number;
  contentWidthMm: string;
  bodyPadding: string;
  storeTitlePx: number;
  legalTitlePx: number;
  legalMetaPx: number;
  docTitlePx: number;
  infoPx: number;
  itemPx: number;
  itemSubPx: number;
  qtyPx: number;
  qtyColWidth: string;
  totalColWidth: string;
  grandTotalPx: number;
  grandLabelPx: number;
  tableCellPx: number;
  footerPx: number;
}

const getThermalGeometry = (paperWidthMm?: ThermalPaperWidthMm): ThermalGeometry => {
  if (paperWidthMm === 56) {
    return {
      pageWidthMm: 56,
      contentWidthMm: "52mm",
      bodyPadding: "2px 3px 8px 3px",
      storeTitlePx: 13,
      legalTitlePx: 10,
      legalMetaPx: 8.5,
      docTitlePx: 12,
      infoPx: 9.5,
      itemPx: 10.5,
      itemSubPx: 9,
      qtyPx: 11,
      qtyColWidth: "28px",
      totalColWidth: "52px",
      grandTotalPx: 16,
      grandLabelPx: 10,
      tableCellPx: 9.5,
      footerPx: 9
    };
  }
  if (paperWidthMm === 58) {
    return {
      pageWidthMm: 58,
      contentWidthMm: "54mm",
      bodyPadding: "3px 4px 10px 4px",
      storeTitlePx: 14,
      legalTitlePx: 10.5,
      legalMetaPx: 9,
      docTitlePx: 12.5,
      infoPx: 10,
      itemPx: 11,
      itemSubPx: 9.5,
      qtyPx: 11.5,
      qtyColWidth: "30px",
      totalColWidth: "56px",
      grandTotalPx: 17,
      grandLabelPx: 10.5,
      tableCellPx: 10,
      footerPx: 9.5
    };
  }
  return {
    pageWidthMm: 80,
    contentWidthMm: "76mm",
    bodyPadding: "4px 6px 12px 6px",
    storeTitlePx: 17,
    legalTitlePx: 11.5,
    legalMetaPx: 10,
    docTitlePx: 14.5,
    infoPx: 11.5,
    itemPx: 12.5,
    itemSubPx: 10.5,
    qtyPx: 13.5,
    qtyColWidth: "38px",
    totalColWidth: "70px",
    grandTotalPx: 21,
    grandLabelPx: 11.5,
    tableCellPx: 11.5,
    footerPx: 10.5
  };
};

const renderOfficialHeaderHtml = (
  opts: {
    storeName: string;
    legalName?: string;
    taxOffice?: string;
    taxNumber?: string;
    mersis?: string;
    storeAddress?: string;
    storePhone?: string;
  },
  geo: ThermalGeometry
) => {
  const cleanStore = String(opts.storeName || "").trim();
  const cleanLegal = String(opts.legalName || "").trim();
  const showLegalSub = Boolean(cleanLegal) && cleanLegal.toLocaleLowerCase("tr-TR") !== cleanStore.toLocaleLowerCase("tr-TR");
  const taxParts: string[] = [];
  if (opts.taxOffice) taxParts.push(`V.D.: ${escapeHtml(opts.taxOffice)}`);
  if (opts.taxNumber) taxParts.push(`VKN/TCKN: ${escapeHtml(opts.taxNumber)}`);

  return `
    <div style="font-size: ${geo.storeTitlePx}px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 2px; word-break: break-word;">
      ${escapeHtml(cleanStore || "SEÇKİN MAĞAZA")}
    </div>
    ${showLegalSub ? `<div style="font-size: ${geo.legalTitlePx}px; font-weight: 800; text-transform: uppercase; margin-bottom: 2px; word-break: break-word;">${escapeHtml(cleanLegal)}</div>` : ""}
    ${taxParts.length > 0 ? `<div style="font-size: ${geo.legalMetaPx}px; font-weight: 700; margin-bottom: 1px;">${taxParts.join(" | ")}</div>` : ""}
    ${opts.mersis ? `<div style="font-size: ${geo.legalMetaPx}px; font-weight: 700; margin-bottom: 1px;">Mersis: ${escapeHtml(opts.mersis)}</div>` : ""}
    ${opts.storeAddress ? `<div style="font-size: ${geo.legalMetaPx}px; font-weight: 600; margin-bottom: 1px; line-height: 1.25; word-break: break-word;">${escapeHtml(opts.storeAddress)}</div>` : ""}
    ${opts.storePhone ? `<div style="font-size: ${geo.legalMetaPx}px; font-weight: 700; margin-bottom: 2px;">Tel: ${escapeHtml(opts.storePhone)}</div>` : ""}
  `;
};

/**
 * Triggers 56mm / 58mm / 80mm Thermal Printer output with high-contrast, zero-margin readable layout.
 */
export const printThermalReceipt = (options: ThermalReceiptOptions) => {
  const {
    title = "SATIŞ FİŞİ",
    storeName = "Seçkin Mağaza",
    legalName,
    taxOffice,
    taxNumber,
    mersis,
    storeAddress,
    storePhone,
    currency = "TRY",
    paperWidthMm = 80,
    isCafe,
    footerText,
    tableNo,
    waiterName,
    customerName,
    saleId,
    date = formatDateTimeTR(new Date()),
    items = [],
    totalAmount = 0,
    paymentMethod = "NAKİT",
    notes,
    fiscalInfo
  } = options;

  const geo = getThermalGeometry(paperWidthMm);
  const currSymbol = getCurrencySymbol(currency);

  let resolvedWaiter = waiterName;
  if (!resolvedWaiter && notes) {
    const match = notes.match(/\[Garson:\s*([^\]]+)\]/i);
    if (match && match[1]) resolvedWaiter = match[1].trim();
  }

  const resolvedFooterGreeting =
    footerText ||
    (isCafe || String(title).toUpperCase().includes("ADİSYON")
      ? "Afiyet Olsun!"
      : "Bizi Tercih Ettiğiniz İçin Teşekkür Ederiz.");

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "100px";
  iframe.style.height = "100px";
  iframe.style.border = "none";
  iframe.style.opacity = "0.01";
  iframe.style.zIndex = "-999";
  document.body.appendChild(iframe);

  const formattedItemsHtml = items.map(item => {
    const qty = Number(item.quantity) || 1;
    const qtyDisplay = Number.isInteger(qty) ? String(qty) : qty.toFixed(2);
    const price = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0);
    const lineTotal = (qty * price).toFixed(2);
    return `
      <div style="margin-bottom: 4px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; font-size: ${geo.itemPx}px; font-weight: 900; line-height: 1.25; color: #000;">
          <span style="flex: 1; padding-right: 3px; word-break: break-word;">${escapeHtml(item.name)}</span>
          <span style="width: ${geo.qtyColWidth}; text-align: center; font-size: ${geo.qtyPx}px; font-weight: 900; flex-shrink: 0;">x${qtyDisplay}</span>
          <span style="width: ${geo.totalColWidth}; text-align: right; font-size: ${geo.itemPx}px; font-weight: 900; flex-shrink: 0;">${lineTotal} ${currSymbol}</span>
        </div>
        ${item.note ? `<div style="font-size: ${geo.itemSubPx}px; font-weight: bold; padding-left: 6px; color: #333; margin-top: 1px;">➔ Not: ${escapeHtml(item.note)}</div>` : ''}
      </div>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          @media print {
            @page {
              margin: 0mm !important;
              size: ${geo.pageWidthMm}mm auto !important;
            }
            html, body {
              margin: 0mm !important;
              padding: 0mm !important;
              width: ${geo.contentWidthMm} !important;
              background: #ffffff !important;
              color: #000000 !important;
              visibility: visible !important;
              -webkit-print-color-adjust: exact !important;
            }
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
          }
          body {
            font-family: 'Courier New', Courier, monospace, system-ui, sans-serif;
            width: ${geo.contentWidthMm};
            margin: 0;
            padding: ${geo.bodyPadding};
            color: #000000;
            background: #ffffff;
            line-height: 1.25;
          }
        </style>
      </head>
      <body>
        <div style="width: 100%; text-align: center; margin: 0; padding: 0;">
          ${renderOfficialHeaderHtml({ storeName, legalName, taxOffice, taxNumber, mersis, storeAddress, storePhone }, geo)}
          
          <div style="font-size: ${geo.docTitlePx}px; font-weight: 900; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 3px 0; margin: 4px 0 5px 0; text-transform: uppercase; letter-spacing: 0.5px;">
            ${escapeHtml(title)}
          </div>

          <div style="text-align: left; font-size: ${geo.infoPx}px; font-weight: bold; border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 5px;">
            ${tableNo ? `
            <div style="display: flex; justify-content: space-between; font-size: ${geo.infoPx + 1.5}px; font-weight: 900; margin-bottom: 3px; background: #000; color: #fff; padding: 2px 4px; border-radius: 2px;">
              <span>KASA / LOKASYON:</span>
              <span style="font-weight: 900; text-transform: uppercase;">${escapeHtml(tableNo)}</span>
            </div>` : ''}
            ${resolvedWaiter ? `
            <div style="display: flex; justify-content: space-between; font-size: ${geo.infoPx + 1}px; font-weight: 900; margin-bottom: 3px; border: 1px solid #000; padding: 2px 4px; text-transform: uppercase;">
              <span>PERSONEL:</span>
              <span style="font-weight: 900;">${escapeHtml(resolvedWaiter)}</span>
            </div>` : ''}
            ${customerName && customerName !== tableNo ? `
            <div style="display: flex; justify-content: space-between; gap: 4px; margin-bottom: 2px;">
              <span>MÜŞTERİ:</span>
              <span style="text-align: right;">${escapeHtml(customerName)}</span>
            </div>` : ''}
            <div style="display: flex; justify-content: space-between; gap: 4px; margin-bottom: 2px;">
              <span>TARİH:</span>
              <span style="text-align: right;">${escapeHtml(date)}</span>
            </div>
            ${saleId ? `
            <div style="display: flex; justify-content: space-between;">
              <span>İŞLEM NO:</span>
              <span>#${escapeHtml(saleId)}</span>
            </div>` : ''}
          </div>

          <div style="text-align: left; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px;">
            <div style="display: flex; justify-content: space-between; font-size: ${geo.infoPx}px; font-weight: 900; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 5px;">
              <span style="flex: 1;">ÜRÜN</span>
              <span style="width: ${geo.qtyColWidth}; text-align: center;">ADET</span>
              <span style="width: ${geo.totalColWidth}; text-align: right;">TUTAR</span>
            </div>
            ${formattedItemsHtml || `<div style="font-size:${geo.infoPx}px; padding:4px 0; text-align:center;">Ürün seçilmedi</div>`}
          </div>

          ${notes ? `
          <div style="text-align: left; font-size: ${geo.itemSubPx}px; font-weight: 900; border-bottom: 1px dashed #000; padding: 3px 4px; margin-bottom: 5px; background: #f0f0f0;">
            NOT: ${escapeHtml(notes)}
          </div>` : ''}

          <div style="border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 5px 0; margin: 6px 0; text-align: center;">
            <div style="font-size: ${geo.grandLabelPx}px; font-weight: 900; text-transform: uppercase;">ÖDENECEK DİP TOPLAM</div>
            <div style="font-size: ${geo.grandTotalPx}px; font-weight: 900; letter-spacing: -0.5px; margin-top: 2px;">${totalAmount.toFixed(2)} ${currSymbol}</div>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: ${geo.infoPx}px; font-weight: 900; margin-top: 4px; padding: 0 2px;">
            <span>ÖDEME:</span>
            <span style="text-transform: uppercase;">${escapeHtml(paymentMethod)}</span>
          </div>

          ${fiscalInfo ? `
          <div style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed #000; font-size: ${geo.legalMetaPx}px; text-align: center;">
            <p style="margin: 1px 0;">MALİ FİŞ NO: ${escapeHtml(fiscalInfo.receiptNo || '-')}</p>
            <p style="margin: 1px 0;">Z NO: ${escapeHtml(fiscalInfo.zNo || '-')}</p>
            <p style="margin: 1px 0;">CİHAZ: ${escapeHtml(fiscalInfo.brand || '')} ${fiscalInfo.terminal ? `- ${escapeHtml(fiscalInfo.terminal)}` : ''}</p>
            <p style="margin: 2px 0 0 0; font-weight: bold;">MALİ ONAYLI BİLGİ (${geo.pageWidthMm}mm)</p>
          </div>` : ''}

          <div style="margin-top: 8px; font-size: ${geo.footerPx}px; text-align: center; border-top: 1px dashed #000; padding-top: 5px; font-weight: bold;">
            <p style="margin: 0;">${escapeHtml(resolvedFooterGreeting)}</p>
            <p style="margin: 2px 0 0 0; font-size: ${Math.max(8, geo.footerPx - 1)}px; font-weight: normal;">İyi Günler Dileriz.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error("Thermal print error:", e);
      }
      setTimeout(() => {
        try { iframe.remove(); } catch (e) {}
      }, 1000);
    }, 400);
  }
};

/**
 * Triggers 56mm / 58mm / 80mm Thermal Printer output for Daily Z-Report & Period Sales Report.
 */
export const printThermalZReport = (options: ThermalZReportOptions) => {
  const {
    title,
    storeName = "Seçkin Mağaza",
    legalName,
    taxOffice,
    taxNumber,
    mersis,
    storeAddress,
    storePhone,
    currency = "TRY",
    paperWidthMm = 80,
    reportDate = formatDateTR(new Date()),
    isRange = false,
    cashTotal = 0,
    cardTotal = 0,
    otherTotal = 0,
    grandTotal = 0,
    saleCount = 0,
    totalItemsSold,
    products = [],
    printTime = formatDateTimeTR(new Date())
  } = options;

  const geo = getThermalGeometry(paperWidthMm);
  const currSymbol = getCurrencySymbol(currency);

  const reportHeaderTitle = title || (isRange ? "SATIŞ & CİRO DÖNEM RAPORU" : "GÜN SONU Z RAPORU");
  const calculatedItemsSold = totalItemsSold !== undefined
    ? totalItemsSold
    : products.reduce((sum, p) => sum + (Number(p.total_quantity) || 0), 0);

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "100px";
  iframe.style.height = "100px";
  iframe.style.border = "none";
  iframe.style.opacity = "0.01";
  iframe.style.zIndex = "-999";
  document.body.appendChild(iframe);

  const productRowsHtml = products.length > 0 ? products.map(p => `
    <tr style="border-bottom: 1px solid #ddd; font-size: ${geo.tableCellPx}px; font-weight: bold; page-break-inside: avoid;">
      <td style="padding: 3px 2px 3px 0; text-align: left; word-break: break-word;">${escapeHtml(p.product_name)}</td>
      <td style="padding: 3px 2px; text-align: center; font-size: ${geo.tableCellPx + 0.5}px; font-weight: 900; white-space: nowrap;">${p.total_quantity}</td>
      <td style="padding: 3px 0 3px 2px; text-align: right; white-space: nowrap;">${(p.total_revenue || 0).toFixed(2)} ${currSymbol}</td>
    </tr>
  `).join('') : `<tr><td colSpan="3" style="text-align: center; padding: 6px; font-size: ${geo.infoPx}px;">Belirtilen tarihte satılan ürün yok.</td></tr>`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(reportHeaderTitle)}</title>
        <style>
          @media print {
            @page {
              margin: 0mm !important;
              size: ${geo.pageWidthMm}mm auto !important;
            }
            html, body {
              margin: 0mm !important;
              padding: 0mm !important;
              width: ${geo.contentWidthMm} !important;
              background: #ffffff !important;
              color: #000000 !important;
              visibility: visible !important;
              -webkit-print-color-adjust: exact !important;
            }
          }
          * { box-sizing: border-box; }
          body {
            font-family: 'Courier New', Courier, monospace, system-ui, sans-serif;
            width: ${geo.contentWidthMm};
            margin: 0;
            padding: ${geo.bodyPadding};
            color: #000000;
            background: #ffffff;
            line-height: 1.25;
          }
        </style>
      </head>
      <body>
        <div style="width: 100%; text-align: center;">
          ${renderOfficialHeaderHtml({ storeName, legalName, taxOffice, taxNumber, mersis, storeAddress, storePhone }, geo)}
          <div style="font-size: ${geo.docTitlePx - 0.5}px; font-weight: 900; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 4px 0; margin: 4px 0 6px 0;">
            ${escapeHtml(reportHeaderTitle)}
          </div>

          <div style="text-align: left; font-size: ${geo.infoPx}px; font-weight: bold; border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 5px;">
            <div style="display: flex; justify-content: space-between; gap: 4px;">
              <span>${isRange ? 'ARALIK:' : 'TARİH:'}</span>
              <span style="font-weight: 900; text-align: right;">${escapeHtml(reportDate)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 4px; margin-top: 2px;">
              <span>YAZDIRMA:</span>
              <span style="text-align: right;">${escapeHtml(printTime)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 2px;">
              <span>TOPLAM İŞLEM:</span>
              <span>${saleCount} Adet</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 2px;">
              <span>SATILAN ÜRÜN:</span>
              <span style="font-weight: 900;">${calculatedItemsSold} Adet</span>
            </div>
          </div>

          <div style="text-align: left; font-size: ${geo.infoPx}px; font-weight: bold; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px;">
            <div style="font-size: ${geo.infoPx}px; font-weight: 900; margin-bottom: 4px; text-decoration: underline;">ÖDEME TAHSİLAT ÖZETİ</div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span>NAKİT SATIŞ:</span>
              <span style="font-size: ${geo.itemPx}px; font-weight: 900;">${cashTotal.toFixed(2)} ${currSymbol}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span>KREDİ KARTI:</span>
              <span style="font-size: ${geo.itemPx}px; font-weight: 900;">${cardTotal.toFixed(2)} ${currSymbol}</span>
            </div>
            ${otherTotal > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span>DİĞER / DİJİTAL:</span>
              <span style="font-size: ${geo.itemPx}px; font-weight: 900;">${otherTotal.toFixed(2)} ${currSymbol}</span>
            </div>` : ''}

            <div style="border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 5px 0; margin-top: 5px; text-align: center;">
              <div style="font-size: ${geo.grandLabelPx}px; font-weight: 900;">${isRange ? 'DÖNEM TOPLAM CİRO' : 'GÜNLÜK TOPLAM CİRO'}</div>
              <div style="font-size: ${geo.grandTotalPx}px; font-weight: 900;">${grandTotal.toFixed(2)} ${currSymbol}</div>
            </div>
          </div>

          <div style="text-align: left; margin-bottom: 8px;">
            <div style="font-size: ${geo.infoPx}px; font-weight: 900; margin-bottom: 4px; text-decoration: underline;">SATILAN ÜRÜN KALEMLERİ</div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 1px solid #000; font-size: ${geo.tableCellPx - 0.5}px; font-weight: 900;">
                  <th style="text-align: left; padding-bottom: 2px;">Ürün</th>
                  <th style="text-align: center; padding-bottom: 2px;">Adet</th>
                  <th style="text-align: right; padding-bottom: 2px;">Toplam</th>
                </tr>
              </thead>
              <tbody>
                ${productRowsHtml}
              </tbody>
            </table>
          </div>

          <div style="margin-top: 14px; font-size: ${geo.footerPx}px; text-align: center; border-top: 1px dashed #000; padding-top: 6px;">
            <div style="display: flex; justify-content: space-between; font-size: ${Math.max(8, geo.footerPx - 1)}px; font-weight: bold; margin-bottom: 16px;">
              <span>Kasiyer / İmza</span>
              <span>Yetkili / İmza</span>
            </div>
            <p style="margin: 0; font-weight: 900; font-size: ${geo.infoPx}px;">*** RAPOR SONU (${geo.pageWidthMm}mm) ***</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error("Z-Report print error:", e);
      }
      setTimeout(() => {
        try { iframe.remove(); } catch (e) {}
      }, 1000);
    }, 400);
  }
};
