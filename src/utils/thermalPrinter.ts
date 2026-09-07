export interface ThermalReceiptItem {
  name: string;
  quantity: number;
  price: number | string;
  note?: string;
}

export interface ThermalReceiptOptions {
  title?: string;
  storeName?: string;
  storePhone?: string;
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

/**
 * Triggers 80mm Thermal Printer output with high-contrast, zero-margin, large readable text.
 */
export const printThermalReceipt = (options: ThermalReceiptOptions) => {
  const {
    title = "ADİSYON FİŞİ",
    storeName = "TELOCA CAFE",
    storePhone,
    tableNo,
    waiterName,
    customerName,
    saleId,
    date = new Date().toLocaleString('tr-TR'),
    items = [],
    totalAmount = 0,
    paymentMethod = "NAKİT",
    notes,
    fiscalInfo
  } = options;

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
    const qty = Math.floor(Number(item.quantity)) || 1;
    const price = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0);
    const lineTotal = (qty * price).toFixed(2);
    return `
      <div style="margin-bottom: 5px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 900; line-height: 1.25; color: #000;">
          <span style="flex: 1; padding-right: 4px; word-break: break-word;">${item.name}</span>
          <span style="width: 38px; text-align: center; font-size: 14px; font-weight: 900;">x${qty}</span>
          <span style="width: 70px; text-align: right; font-size: 13px; font-weight: 900;">${lineTotal} ₺</span>
        </div>
        ${item.note ? `<div style="font-size: 11px; font-weight: bold; padding-left: 8px; color: #333; margin-top: 1px;">➔ Not: ${item.note}</div>` : ''}
      </div>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          @media print {
            @page {
              margin: 0mm !important;
              size: 80mm auto !important;
            }
            html, body {
              margin: 0mm !important;
              padding: 0mm !important;
              width: 80mm !important;
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
            width: 80mm;
            margin: 0;
            padding: 4px 6px 12px 6px;
            color: #000000;
            background: #ffffff;
            line-height: 1.3;
          }
        </style>
      </head>
      <body>
        <div style="width: 100%; text-align: center; margin: 0; padding: 0;">
          <!-- STORE BRANDING HEADER -->
          <div style="font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">
            ${storeName}
          </div>
          ${storePhone ? `<div style="font-size: 11px; font-weight: bold; margin-bottom: 2px;">Tel: ${storePhone}</div>` : ''}
          
          <div style="font-size: 15px; font-weight: 900; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 3px 0; margin: 4px 0 6px 0; text-transform: uppercase; letter-spacing: 1px;">
            ${title}
          </div>

          <!-- INFO TABLE -->
          <div style="text-align: left; font-size: 12px; font-weight: bold; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 6px;">
            ${tableNo ? `
            <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; margin-bottom: 3px;">
              <span>MASA / BÖLÜM:</span>
              <span style="font-size: 16px; font-weight: 900; text-transform: uppercase;">${tableNo}</span>
            </div>` : ''}
            ${customerName && customerName !== tableNo ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>MÜŞTERİ / CARİ:</span>
              <span>${customerName}</span>
            </div>` : ''}
            ${waiterName ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>GARSON:</span>
              <span>${waiterName}</span>
            </div>` : ''}
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>TARİH & SAAT:</span>
              <span>${date}</span>
            </div>
            ${saleId ? `
            <div style="display: flex; justify-content: space-between;">
              <span>FİŞ NO:</span>
              <span>#${saleId}</span>
            </div>` : ''}
          </div>

          <!-- ITEMS HEADER -->
          <div style="text-align: left; border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 900; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 6px;">
              <span style="flex: 1;">ÜRÜN / AÇIKLAMA</span>
              <span style="width: 38px; text-align: center;">ADET</span>
              <span style="width: 70px; text-align: right;">TUTAR</span>
            </div>
            ${formattedItemsHtml || '<div style="font-size:12px; padding:4px 0; text-align:center;">Ürün seçilmedi</div>'}
          </div>

          ${notes ? `
          <div style="text-align: left; font-size: 11px; font-weight: 900; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 6px; background: #f0f0f0; padding: 4px;">
            SİPARİŞ NOTU: ${notes}
          </div>` : ''}

          <!-- MASSIVE DİP TOPLAM BOX -->
          <div style="border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 6px 0; margin: 8px 0; text-align: center;">
            <div style="font-size: 12px; font-weight: 900; text-transform: uppercase;">ÖDENECEK DİP TOPLAM</div>
            <div style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; margin-top: 2px;">${totalAmount.toFixed(2)} ₺</div>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 900; margin-top: 4px; padding: 0 2px;">
            <span>ÖDEME YÖNTEMİ:</span>
            <span style="text-transform: uppercase;">${paymentMethod}</span>
          </div>

          ${fiscalInfo ? `
          <div style="margin-top: 8px; padding-top: 4px; border-top: 1px dashed #000; font-size: 10px; text-align: center;">
            <p style="margin: 1px 0;">FİŞ NO: ${fiscalInfo.receiptNo || '-'}</p>
            <p style="margin: 1px 0;">Z NO: ${fiscalInfo.zNo || '-'}</p>
            <p style="margin: 1px 0;">CİHAZ: ${fiscalInfo.brand || ''} - ${fiscalInfo.terminal || ''}</p>
            <p style="margin: 3px 0 0 0; font-weight: bold;">MALİ MÜHÜR</p>
          </div>` : ''}

          <!-- FOOTER -->
          <div style="margin-top: 10px; font-size: 11px; text-align: center; border-top: 1px dashed #000; padding-top: 6px; font-weight: bold;">
            <p style="margin: 0;">Afiyet Olsun!</p>
            <p style="margin: 2px 0 0 0; font-size: 10px; font-weight: normal;">Bizi Tercih Ettiğiniz İçin Teşekkür Ederiz.</p>
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
 * Triggers 80mm Thermal Printer output for Daily Z-Report & Period Sales Report.
 */
export const printThermalZReport = (options: ThermalZReportOptions) => {
  const {
    title,
    storeName = "TELOCA CAFE",
    reportDate = new Date().toISOString().split('T')[0],
    isRange = false,
    cashTotal = 0,
    cardTotal = 0,
    otherTotal = 0,
    grandTotal = 0,
    saleCount = 0,
    totalItemsSold,
    products = [],
    printTime = new Date().toLocaleString('tr-TR')
  } = options;

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
    <tr style="border-bottom: 1px solid #ddd; font-size: 12px; font-weight: bold; page-break-inside: avoid;">
      <td style="padding: 3px 0; text-align: left;">${p.product_name}</td>
      <td style="padding: 3px 0; text-align: center; font-size: 13px; font-weight: 900;">${p.total_quantity}</td>
      <td style="padding: 3px 0; text-align: right;">${(p.total_revenue || 0).toFixed(2)} ₺</td>
    </tr>
  `).join('') : `<tr><td colSpan="3" style="text-align: center; padding: 6px; font-size: 11px;">Belirtilen tarihte satılan ürün yok.</td></tr>`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${reportHeaderTitle}</title>
        <style>
          @media print {
            @page {
              margin: 0mm !important;
              size: 80mm auto !important;
            }
            html, body {
              margin: 0mm !important;
              padding: 0mm !important;
              width: 80mm !important;
              background: #ffffff !important;
              color: #000000 !important;
              visibility: visible !important;
              -webkit-print-color-adjust: exact !important;
            }
          }
          * { box-sizing: border-box; }
          body {
            font-family: 'Courier New', Courier, monospace, system-ui, sans-serif;
            width: 80mm;
            margin: 0;
            padding: 4px 6px 12px 6px;
            color: #000000;
            background: #ffffff;
            line-height: 1.3;
          }
        </style>
      </head>
      <body>
        <div style="width: 100%; text-align: center;">
          <div style="font-size: 18px; font-weight: 900; text-transform: uppercase;">
            ${storeName}
          </div>
          <div style="font-size: 14px; font-weight: 900; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 4px 0; margin: 4px 0 8px 0;">
            ${reportHeaderTitle}
          </div>

          <div style="text-align: left; font-size: 11px; font-weight: bold; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 6px;">
            <div style="display: flex; justify-content: space-between;">
              <span>${isRange ? 'TARİH ARALIĞI:' : 'RAPOR TARİHİ:'}</span>
              <span style="font-weight: 900;">${reportDate}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 2px;">
              <span>YAZDIRMA ZAMANI:</span>
              <span>${printTime}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 2px;">
              <span>TOPLAM İŞLEM:</span>
              <span>${saleCount} Adet Satış</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 2px;">
              <span>TOPLAM SATILAN ÜRÜN:</span>
              <span style="font-weight: 900;">${calculatedItemsSold} Adet</span>
            </div>
          </div>

          <!-- FINANCES SUMMARY -->
          <div style="text-align: left; font-size: 12px; font-weight: bold; border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px;">
            <div style="font-size: 12px; font-weight: 900; margin-bottom: 4px; text-decoration: underline;">ÖDEME TAHSİLAT ÖZETİ</div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span>💵 NAKİT SATIŞLAR:</span>
              <span style="font-size: 13px; font-weight: 900;">${cashTotal.toFixed(2)} ₺</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span>💳 KREDİ KARTI SATIŞLAR:</span>
              <span style="font-size: 13px; font-weight: 900;">${cardTotal.toFixed(2)} ₺</span>
            </div>
            ${otherTotal > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span>📝 DİĞER / DİJİTAL:</span>
              <span style="font-size: 13px; font-weight: 900;">${otherTotal.toFixed(2)} ₺</span>
            </div>` : ''}

            <div style="border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 6px 0; margin-top: 6px; text-align: center;">
              <div style="font-size: 12px; font-weight: 900;">${isRange ? 'DÖNEM TOPLAM CİRO' : 'GÜNLÜK TOPLAM CİRO'}</div>
              <div style="font-size: 22px; font-weight: 900;">${grandTotal.toFixed(2)} ₺</div>
            </div>
          </div>

          <!-- PRODUCTS BREAKDOWN -->
          <div style="text-align: left; margin-bottom: 10px;">
            <div style="font-size: 12px; font-weight: 900; margin-bottom: 4px; text-decoration: underline;">SATILAN ÜRÜN KALEMLERİ</div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 1px solid #000; font-size: 11px; font-weight: 900;">
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

          <!-- SIGNATURE & END -->
          <div style="margin-top: 20px; font-size: 11px; text-align: center; border-top: 1px dashed #000; padding-top: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: bold; margin-bottom: 20px;">
              <span>Kasiyer / İmzası</span>
              <span>Yetkili / İmzası</span>
            </div>
            <p style="margin: 0; font-weight: 900; font-size: 12px;">*** RAPOR SONU ***</p>
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
