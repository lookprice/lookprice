import { DomainId } from "./sectorCapability";

export interface HrDocPreset {
  id: string;
  label: string;
  hasExpiry?: boolean;
}

export function getSectorDocumentTypes(domainId?: DomainId): HrDocPreset[] {
  const base: HrDocPreset[] = [
    { id: "id_card", label: "Kimlik Fotokopisi" },
    { id: "employment_contract", label: "İş Sözleşmesi", hasExpiry: true },
    { id: "sgk_entry", label: "SGK İşe Giriş Bildirgesi" },
    { id: "criminal_record", label: "Adli Sicil Kaydı", hasExpiry: true },
    { id: "residence", label: "İkametgah Belgesi" },
    { id: "health_report", label: "Sağlık Raporu", hasExpiry: true },
    { id: "diploma", label: "Diploma / Mesleki Sertifika" },
  ];

  if (domainId === "HORECA" || domainId === "HOTEL") {
    base.splice(2, 0,
      { id: "hygiene_certificate", label: "Hijyen Eğitimi Sertifikası", hasExpiry: true },
      { id: "porter_report", label: "Portör / Gıda Sağlık Raporu", hasExpiry: true }
    );
  } else if (domainId === "REAL_ESTATE" || domainId === "DEVELOPER_PROJECT") {
    base.splice(2, 0,
      { id: "myk_certificate", label: "MYK Seviye 4/5 Emlak Belgesi", hasExpiry: true },
      { id: "re_authority", label: "Taşınmaz Ticareti Yetki Belgesi", hasExpiry: true }
    );
  } else if (domainId === "AUTOMOTIVE") {
    base.splice(2, 0,
      { id: "driver_license", label: "Sürücü Belgesi (Ehliyet)", hasExpiry: true },
      { id: "src_psychotechnic", label: "SRC / Psikoteknik Belgesi", hasExpiry: true }
    );
  } else {
    base.push(
      { id: "driver_license", label: "Sürücü / Kurye Ehliyeti", hasExpiry: true },
      { id: "warehouse_operator", label: "Depo / Forklift Operatör Belgesi", hasExpiry: true }
    );
  }

  base.push({ id: "other", label: "Diğer Resmi Belge", hasExpiry: true });
  return base;
}

function escapeHtml(val?: string | null): string {
  return String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function printHtmlViaIframe(html: string) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 1000);
  };

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      cleanup();
    }
  }, 350);
}

/**
 * Prints a clean A4 Entrance QR Poster (no external CDN scripts, pure inline CSS)
 */
export function printCheckpointQrPoster(params: {
  storeName: string;
  checkpointLabel: string;
  branchType: string;
  portalUrl: string;
  qrSvgMarkup: string;
  radiusMeters: number;
  hasGps: boolean;
  workStart?: string;
  workEnd?: string;
}) {
  const typeLabel = params.branchType === "WAREHOUSE" ? "DEPO GİRİŞ NOKTASI" : "MAĞAZA / ŞUBE GİRİŞ NOKTASI";
  const gpsText = params.hasGps
    ? `GPS Konum Doğrulaması Aktif (${params.radiusMeters} m yarıçap)`
    : "QR Kod Doğrulaması Aktif";

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <title>Personel Giriş-Çıkış QR Afişi - ${escapeHtml(params.checkpointLabel)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; background: #fff; }
    .sheet {
      width: 186mm; min-height: 270mm; margin: 0 auto;
      border: 2px solid #0f172a; border-radius: 12px; padding: 14mm 12mm;
      display: flex; flex-direction: column; justify-content: space-between; align-items: center; text-align: center;
    }
    .kicker { font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #475569; margin-bottom: 6px; }
    .store-name { font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
    .branch-title { font-size: 20px; font-weight: 700; color: #1e293b; padding: 8px 20px; border: 1.5px solid #cbd5e1; border-radius: 8px; display: inline-block; margin-top: 4px; }
    .qr-wrap {
      margin: 10mm 0 6mm; padding: 10mm; border: 2px solid #0f172a; border-radius: 16px;
      background: #ffffff; display: inline-flex; align-items: center; justify-content: center;
    }
    .qr-wrap svg { width: 88mm; height: 88mm; display: block; }
    .headline { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
    .steps { width: 100%; max-width: 145mm; text-align: left; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 14px 4px; margin: 12px 0; }
    .step { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; font-size: 14px; line-height: 1.45; color: #1e293b; }
    .step:last-child { margin-bottom: 0; }
    .num { width: 24px; height: 24px; border-radius: 50%; background: #0f172a; color: #fff; font-weight: 700; font-size: 12px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .meta { font-size: 12px; color: #475569; margin-top: 8px; }
    .url-box { font-family: monospace; font-size: 10px; color: #64748b; word-break: break-all; margin-top: 8px; padding: 6px 10px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; }
    .footer { width: 100%; border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="sheet">
    <div>
      <div class="kicker">${escapeHtml(typeLabel)}</div>
      <div class="store-name">${escapeHtml(params.storeName)}</div>
      <div class="branch-title">${escapeHtml(params.checkpointLabel)}</div>
    </div>

    <div>
      <div class="qr-wrap">${params.qrSvgMarkup}</div>
      <div class="headline">PERSONEL GİRİŞ / ÇIKIŞ QR KODU</div>
      <div class="meta">${escapeHtml(gpsText)}${params.workStart && params.workEnd ? ` · Mesai: ${escapeHtml(params.workStart)} – ${escapeHtml(params.workEnd)}` : ""}</div>
    </div>

    <div class="steps">
      <div class="step"><span class="num">1</span><span>Telefonunuzun kamerasını açın ve yukarıdaki QR kodu okutun.</span></div>
      <div class="step"><span class="num">2</span><span>Açılan personel ekranında kayıtlı <strong>telefon numaranız</strong> ve <strong>4 haneli PIN</strong> kodunuzla giriş yapın.</span></div>
      <div class="step"><span class="num">3</span><span>Konum (GPS) iznini onaylayıp <strong>Giriş Yap</strong> veya <strong>Çıkış Yap</strong> butonuna dokunun.</span></div>
      <div class="url-box">${escapeHtml(params.portalUrl)}</div>
    </div>

    <div class="footer">
      <span>${escapeHtml(params.storeName)} · Personel Puantaj Sistemi</span>
      <span>Tarih: ${new Date().toLocaleDateString("tr-TR")}</span>
    </div>
  </div>
</body>
</html>`;

  printHtmlViaIframe(html);
}

/**
 * Prints an A4 Asset Custody (Zimmet Teslim / İade Tutanağı)
 */
export function printAssetCustodyReceipt(params: {
  storeName: string;
  employeeName: string;
  employeeRole?: string;
  employeeTc?: string;
  employeePhone?: string;
  assets: Array<{
    asset_name: string;
    category: string;
    serial_no?: string;
    assigned_date?: string;
    return_date?: string;
    status: string;
    condition_note?: string;
  }>;
}) {
  const categoryMap: Record<string, string> = {
    phone: "Telefon / Hat",
    pos: "POS / El Terminali",
    key: "Anahtar / Kart",
    vehicle: "Araç / Motor",
    computer: "Bilgisayar / Tablet",
    uniform: "Üniforma / Ekipman",
    other: "Diğer",
  };

  const rowsHtml = params.assets
    .map(
      (a, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${escapeHtml(a.asset_name)}</strong></td>
        <td>${escapeHtml(categoryMap[a.category] || a.category)}</td>
        <td style="font-family:monospace;">${escapeHtml(a.serial_no || "-")}</td>
        <td>${a.assigned_date ? new Date(a.assigned_date).toLocaleDateString("tr-TR") : "-"}</td>
        <td>${a.status === "returned" ? `İade (${a.return_date ? new Date(a.return_date).toLocaleDateString("tr-TR") : "-"})` : a.status === "damaged" ? "Hasarlı" : "Zimmetli"}</td>
        <td>${escapeHtml(a.condition_note || "-")}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <title>Zimmet Tutanağı - ${escapeHtml(params.employeeName)}</title>
  <style>
    @page { size: A4 portrait; margin: 16mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; font-size: 12px; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 16px; }
    .store { font-size: 20px; font-weight: 800; }
    .doc-title { font-size: 14px; font-weight: 700; color: #334155; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 18px; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 16px; background: #f8fafc; }
    .info-item span { display: block; font-size: 10px; color: #64748b; text-transform: uppercase; }
    .info-item strong { font-size: 13px; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
    th, td { border: 1px solid #cbd5e1; padding: 7px 8px; text-align: left; font-size: 11px; }
    th { background: #f1f5f9; font-weight: 700; color: #0f172a; }
    .clause { padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11px; color: #334155; margin-bottom: 28px; }
    .signs { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 24px; }
    .sign-box { border-top: 1px solid #94a3b8; padding-top: 8px; text-align: center; }
    .sign-box small { display: block; color: #64748b; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="store">${escapeHtml(params.storeName)}</div>
      <div class="doc-title">DEMİRBAŞ VE ZİMMET TESLİM / İADE TUTANAĞI</div>
    </div>
    <div style="text-align:right; font-size:11px; color:#475569;">
      Düzenleme Tarihi: <strong>${new Date().toLocaleDateString("tr-TR")}</strong>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-item"><span>Personel Adı Soyadı</span><strong>${escapeHtml(params.employeeName)}</strong></div>
    <div class="info-item"><span>Görevi / Unvanı</span><strong>${escapeHtml(params.employeeRole || "Personel")}</strong></div>
    <div class="info-item"><span>T.C. Kimlik / Pasaport No</span><strong>${escapeHtml(params.employeeTc || "-")}</strong></div>
    <div class="info-item"><span>Telefon</span><strong>${escapeHtml(params.employeePhone || "-")}</strong></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:28px;">#</th>
        <th>Demirbaş / Eşya</th>
        <th>Kategori</th>
        <th>Seri / Plaka No</th>
        <th>Teslim Tarihi</th>
        <th>Durum</th>
        <th>Not / Durum Açıklaması</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || '<tr><td colspan="7" style="text-align:center;">Kayıt bulunamadı.</td></tr>'}
    </tbody>
  </table>

  <div class="clause">
    Yukarıda dökümü yapılan firma demirbaşlarını çalışır, eksiksiz ve sağlam durumda teslim aldım. İşbu ekipmanları yalnızca iş amaçlı ve özenle kullanacağımı, görev değişikliği veya işten ayrılma halinde firmaya eksiksiz iade edeceğimi kabul ve taahhüt ederim.
  </div>

  <div class="signs">
    <div class="sign-box">
      <strong>TESLİM EDEN (YÖNETİCİ / FİRMA)</strong>
      <small>${escapeHtml(params.storeName)}</small>
      <div style="height:48px;"></div>
      <small>İmza / Kaşe</small>
    </div>
    <div class="sign-box">
      <strong>TESLİM ALAN (PERSONEL)</strong>
      <small>${escapeHtml(params.employeeName)}</small>
      <div style="height:48px;"></div>
      <small>Ad Soyad / İmza</small>
    </div>
  </div>
</body>
</html>`;

  printHtmlViaIframe(html);
}
