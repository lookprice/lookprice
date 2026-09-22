import { toast } from "sonner";

export const formatNumberVal = (val: any) => {
  if (val === undefined || val === null || val === '') return '0';
  const cleanVal = val.toString().replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleanVal);
  if (isNaN(parsed)) return val;
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(parsed));
};

export const unescapeEntities = (str: string) => {
  if (!str) return '';
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
};

export const unescapeHtmlManual = (html: string) => {
  if (!html) return '';
  return unescapeEntities(html).replace(/<[^>]*>?/gm, '');
};

export const handlePrintProperty = (property: any, branding: any) => {
  const primaryColor = branding?.page_layout_settings?.primary_color || "#0F172A";
  const accentColor = branding?.page_layout_settings?.accent_color || "#4f46e5";
  const storeName = branding?.store_name || branding?.name || 'SEÇKİN EMLAK';
  const referenceNo = property.reference_no || property.id;
  const dateStr = new Date(property.created_at || Date.now()).toLocaleDateString('tr-TR');
  
  const isRent = property.listing_intent === 'rent';
  const titleText = property.type === 'residence' ? '🏠 KONUT PORTFÖYÜ' : property.type === 'commercial' ? '🏢 TİCARİ PORTFÖY' : '🌿 ARSA PORTFÖYÜ';
  const priceCurrency = property.currency === 'GBP' ? '£' : property.currency === 'USD' ? '$' : property.currency === 'EUR' ? '€' : '₺';
  const priceText = `${priceCurrency}${formatNumberVal(property.price)}`;
  const imageUrl = property.images && property.images[0] ? property.images[0] : '';
  
  const roomCount = property.room_count || 'Belirtilmedi';
  const netArea = property.square_meters ? `${formatNumberVal(property.square_meters)} m²` : 'Belirtilmedi';
  const heating = property.heating || 'Klima';
  const deedType = isRent ? (property.furnished ? 'Eşyalı' : 'Eşyasız') : (property.kktc_title_type || 'Eşdeğer Koçan');
  const deedLabel = isRent ? 'EŞYA DURUMU' : 'KOÇAN / TAPU';
  const deedSubLabel = isRent ? 'FURNITURE' : 'DEED TYPE';
  
  const descContent = property.description ? unescapeEntities(property.description) : 'Bu gayrimenkul portföyü için detaylı teknik açıklama girilmemiştir. Lütfen yetkili danışmanımız ile irtibata geçiniz.';
  const agentName = property.responsible_agent || 'Sorumlu Şube Temsilcisi';
  const branchName = property.branch_name || 'Merkez Ofis';
  const phoneInfo = branding?.phone ? `📞 ${branding.phone}` : '';
  const addressInfo = branding?.address ? `📍 ${branding.address}` : '';

  const printWin = window.open('', '_blank');
  if (!printWin) {
    toast.error("Tarayıcınızın yeni sekme açmasını engelleyen pop-up engelleyicisini kapatıp tekrar deneyiniz.");
    return;
  }

  printWin.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${property.title} - A4 Afiş</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
          
          * {
            box-sizing: border-box;
          }

          body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            color: #1e293b;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          @page {
            size: A4 portrait;
            margin: 0;
          }

          .poster-page {
            width: 210mm;
            height: 297mm;
            padding: 10mm;
            box-sizing: border-box;
            background: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            overflow: hidden;
          }

          .double-border {
            border: 10px double ${primaryColor};
            height: 277mm;
            padding: 8mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
          }

          /* Header Section */
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 20mm;
            overflow: hidden;
          }

          .brand-section {
            display: flex;
            flex-direction: column;
          }

          .store-title {
            font-size: 24px;
            font-weight: 900;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin: 0;
            line-height: 1.1;
            color: ${primaryColor};
          }

          .brand-eyebrow {
            font-size: 8.5px;
            font-weight: 800;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin-top: 5px;
            margin-bottom: 0;
            color: ${accentColor};
          }

          .ref-section {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            justify-content: center;
          }

          .ref-badge {
            display: inline-block;
            color: #ffffff;
            font-family: monospace;
            font-size: 11px;
            font-weight: 900;
            padding: 4px 10px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
            background-color: ${primaryColor};
          }

          .date-text {
            font-size: 9px;
            color: #64748b;
            font-weight: 700;
            margin-top: 6px;
            margin-bottom: 0;
          }

          /* Title & Location Section */
          .title-container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            height: 22mm;
            overflow: hidden;
          }

          .intent-tag {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: ${accentColor};
            margin-bottom: 4px;
          }

          .property-title {
            font-size: 20px;
            font-weight: 900;
            letter-spacing: -0.5px;
            line-height: 1.2;
            text-transform: uppercase;
            margin: 0 0 6px 0;
            color: ${primaryColor};
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .location-pills {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .pill-loc {
            font-size: 10px;
            font-weight: 700;
            color: #334155;
            background-color: #f1f5f9;
            padding: 4px 10px;
            border-radius: 9999px;
            border: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .pill-country {
            font-size: 10px;
            font-weight: 700;
            color: #b45309;
            background-color: #fef3c7;
            padding: 4px 10px;
            border-radius: 9999px;
            border: 1px solid #fde68a;
          }

          /* Image Section */
          .image-container {
            width: 100%;
            height: 108mm;
            border-radius: 12px;
            overflow: hidden;
            background-color: #f1f5f9;
            border: 1px solid #e2e8f0;
            position: relative;
          }

          .property-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .no-img-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #94a3b8;
          }

          .price-badge-container {
            position: absolute;
            bottom: 16px;
            right: 16px;
            border-radius: 8px;
            padding: 8px 16px;
            color: #ffffff;
            background-color: ${primaryColor};
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
            text-align: right;
          }

          .price-label {
            display: block;
            font-size: 8px;
            font-weight: 900;
            letter-spacing: 1px;
            color: #cbd5e1;
            text-transform: uppercase;
            margin-bottom: 2px;
          }

          .price-val {
            font-size: 24px;
            font-weight: 900;
            color: #34d399;
            line-height: 1;
          }

          /* Bento Specs Grid */
          .specs-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            height: 22mm;
            overflow: hidden;
          }

          .spec-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 8px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
          }

          .spec-card-title {
            font-size: 8px;
            font-weight: 900;
            text-transform: uppercase;
            color: #94a3b8;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }

          .spec-card-val {
            font-size: 13px;
            font-weight: 900;
            color: #1e293b;
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
          }

          .spec-card-sub {
            font-size: 7px;
            color: #94a3b8;
            font-weight: 700;
            text-transform: uppercase;
          }

          /* Description Section */
          .description-section {
            border-left: 4px solid ${accentColor};
            padding-left: 12px;
            height: 26mm;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          .desc-title {
            display: block;
            font-weight: 900;
            letter-spacing: 1px;
            text-transform: uppercase;
            font-size: 9px;
            margin-bottom: 6px;
            color: ${primaryColor};
          }

          .desc-body {
            font-size: 10px;
            line-height: 1.5;
            color: #475569;
            font-weight: 500;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          /* Footer Section */
          .footer-section {
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            height: 22mm;
            overflow: hidden;
          }

          .agent-info {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            justify-content: flex-end;
          }

          .agent-label {
            font-size: 8px;
            font-weight: 900;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1px;
            line-height: 1;
          }

          .agent-name {
            font-size: 15px;
            font-weight: 900;
            color: ${primaryColor};
            margin: 4px 0 2px 0;
            line-height: 1.2;
          }

          .branch-name {
            font-size: 9px;
            color: #64748b;
            font-weight: 700;
            margin: 0 0 6px 0;
          }

          .contact-info {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .phone-span {
            font-size: 10px;
            color: #1e293b;
            font-weight: 900;
          }

          .address-span {
            font-size: 9px;
            color: #94a3b8;
            font-weight: 700;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 280px;
          }

          .footer-right {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            justify-content: flex-end;
          }

          .badge-secure {
            display: flex;
            align-items: center;
            gap: 4px;
            background-color: #0f172a;
            color: #ffffff;
            font-weight: 900;
            text-transform: uppercase;
            font-size: 8px;
            letter-spacing: 1px;
            padding: 4px 8px;
            border-radius: 4px;
            margin-bottom: 4px;
          }

          .footer-desc {
            font-size: 8px;
            color: #94a3b8;
            font-weight: 700;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="poster-page">
          <div class="double-border">
            
            <!-- Header -->
            <div class="header-container">
              <div class="brand-section">
                <h1 class="store-title">${storeName}</h1>
                <p class="brand-eyebrow">PREMIUM REAL ESTATE SOLUTIONS</p>
              </div>
              <div class="ref-section">
                <span class="ref-badge">REF: LP-${referenceNo}</span>
                <p class="date-text">İlan Tarihi: ${dateStr}</p>
              </div>
            </div>

            <!-- Title & Location -->
            <div class="title-container">
              <div class="intent-tag">${titleText}</div>
              <h2 class="property-title">${property.title}</h2>
              <div class="location-pills">
                <span class="pill-loc">📍 ${property.location}</span>
                <span class="pill-country">
                  ${property.country === 'KKTC' ? `KKTC • ${property.kktc_region || 'Girne'}` : `${property.country || 'Türkiye'}`}
                </span>
              </div>
            </div>

            <!-- Main Image -->
            <div class="image-container">
              ${imageUrl ? `
                <img src="${imageUrl}" alt="${property.title}" class="property-img" />
              ` : `
                <div class="no-img-placeholder">
                  <span style="font-size: 40px;">🏢</span>
                  <span style="font-size: 11px; font-weight: bold; margin-top: 8px;">Görsel Bulunmuyor</span>
                </div>
              `}
              <div class="price-badge-container">
                <span class="price-label">${isRent ? 'AYLIK KİRA BEDELİ' : 'SATIŞ BEDELİ'}</span>
                <span class="price-val">${priceText}</span>
              </div>
            </div>

            <!-- Bento Specs -->
            <div class="specs-grid">
              <div class="spec-card">
                <span class="spec-card-title">ODA SAYISI</span>
                <span class="spec-card-val">${roomCount}</span>
                <span class="spec-card-sub">ROOMS</span>
              </div>
              <div class="spec-card">
                <span class="spec-card-title">NET ALAN</span>
                <span class="spec-card-val">${netArea}</span>
                <span class="spec-card-sub">NET AREA</span>
              </div>
              <div class="spec-card">
                <span class="spec-card-title">ISITMA SİSTEMİ</span>
                <span class="spec-card-val">${heating}</span>
                <span class="spec-card-sub">HEATING</span>
              </div>
              <div class="spec-card">
                <span class="spec-card-title">${deedLabel}</span>
                <span class="spec-card-val" style="color: #92400e;">${deedType}</span>
                <span class="spec-card-sub">${deedSubLabel}</span>
              </div>
            </div>

            <!-- Description Summary Module -->
            <div class="description-section">
              <span class="desc-title">AÇIKLAMA VE PORTFÖY DETAYLARI • DESCRIPTION</span>
              <div class="desc-body">${descContent}</div>
            </div>

            <!-- Footer -->
            <div class="footer-section">
              <div class="agent-info">
                <span class="agent-label">YETKİLİ GAYRİMENKUL DANIŞMANI</span>
                <h4 class="agent-name">${agentName}</h4>
                <p class="branch-name">Şube: ${branchName}</p>
                <div class="contact-info">
                  ${phoneInfo ? `<span class="phone-span">${phoneInfo}</span>` : ''}
                  ${addressInfo ? `<span class="address-span">${addressInfo}</span>` : ''}
                </div>
              </div>
              <div class="footer-right">
                <div class="badge-secure">🛡️ LOOKPRICE SECURE</div>
                <p class="footer-desc">Sektörün En Güçlü CRM & Emlak Entegrasyon Altyapısı</p>
              </div>
            </div>

          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
              setTimeout(() => { window.close(); }, 1500);
            }, 600);
          };
        </script>
      </body>
    </html>
  `);
  printWin.document.close();
};
