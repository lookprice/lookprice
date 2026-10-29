import React from 'react';
import { 
  Package, 
  Check, 
  Copy, 
  AlertCircle, 
  AlertTriangle, 
  ExternalLink, 
  Clock, 
  RefreshCw, 
  UploadCloud, 
  StopCircle, 
  Edit3 
} from 'lucide-react';
import { MarketplaceKey, MARKETPLACES } from './marketplaceTypes';

interface MarketplaceProductRowProps {
  product: any;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  selectedMarketplace: MarketplaceKey;
  storeBranding?: any;
  isTr: boolean;
  copiedBarcode: string | null;
  onCopyBarcode: (bc: string) => void;
  onCheckHbStatus: (productId: number) => void;
  onCheckTyStatus?: (productId: number) => void;
  checkingStatusId: number | null;
  publishingId: number | null;
  onPublishSingle: (product: any, mpKey: MarketplaceKey) => void;
  onUnpublishSingle: (product: any, mpKey: MarketplaceKey) => void;
  onEditProduct?: (product: any) => void;
  isProductActive: (p: any, mpKey: MarketplaceKey) => boolean;
  isProductPending: (p: any, mpKey: MarketplaceKey) => boolean;
  getProductError: (p: any, mpKey: MarketplaceKey) => string | null;
}

export const MarketplaceProductRow: React.FC<MarketplaceProductRowProps> = ({
  product: p,
  isSelected,
  onToggleSelect,
  selectedMarketplace,
  storeBranding,
  isTr,
  copiedBarcode,
  onCopyBarcode,
  onCheckHbStatus,
  onCheckTyStatus,
  checkingStatusId,
  publishingId,
  onPublishSingle,
  onUnpublishSingle,
  onEditProduct,
  isProductActive,
  isProductPending,
  getProductError,
}) => {
  const isHbActive = isProductActive(p, 'hepsiburada');
  const isTyActive = isProductActive(p, 'trendyol');
  const isN11Active = isProductActive(p, 'n11');
  const isAmzActive = isProductActive(p, 'amazon');
  const isPzActive = isProductActive(p, 'pazarama');

  const hbError = getProductError(p, 'hepsiburada');
  const tyError = getProductError(p, 'trendyol');
  const amzError = getProductError(p, 'amazon');
  const n11Error = getProductError(p, 'n11');
  const pzrError = getProductError(p, 'pazarama');

  const displayError = getProductError(p, selectedMarketplace);
  const hasAnyError = Boolean(displayError);

  const isPriceErrorStr = (err: string | null | undefined): boolean => {
    if (!err) return false;
    return /yüksek fiyat|fiyat limiti|fahiş|high pricing|tavan fiyat|aralığın dışında|invalid_price/i.test(err);
  };

  const getErrorDiagnosis = (err: string | null | undefined): { label: string; detail: string } => {
    if (!err) return { label: isTr ? "İlan Hatalı" : "Error", detail: "" };
    const clean = err.replace(/^\[(HB|AMZ|TY|N11|PZR)\]\s*/i, '').trim();

    // 1. Prohibited / Banned Word (e.g. "Apple")
    if (/yasaklı kelime|prohibited word|banned word/i.test(clean)) {
      const wordMatch = clean.match(/"([^"]+)"/);
      const word = wordMatch ? wordMatch[1] : "";
      return {
        label: word ? (isTr ? `Yasak Kelime ("${word}")` : `Banned Word ("${word}")`) : (isTr ? "Yasak Kelime Var" : "Banned Word"),
        detail: word
          ? (isTr
              ? `Başlık veya açıklamada yasaklı "${word}" kelimesi tespit edildi (marka ihlali). Kalem (Düzenle) butonundan "${word}" ibaresini kaldırıp tekrar gönderin.`
              : `Prohibited word "${word}" detected in title or description.`)
          : (isTr
              ? `Ürün başlığında veya açıklamasında pazaryerinin yasakladığı bir kelime tespit edildi. İçeriği düzenleyip tekrar gönderin.`
              : `Prohibited word detected in product content.`)
      };
    }

    // 2. Image Server Access / Firewall Block
    if (/access permission|blocking trendyol|server hosting|cannot be reached|indirilemedi/i.test(clean)) {
      return {
        label: isTr ? "Resim İndirilemedi (Sunucu Engeli)" : "Image Server Blocked",
        detail: isTr
          ? "Görselin bulunduğu sunucu pazaryeri botlarının erişimini engelledi (IP/Firewall kısıtı). Düzenle ekranından görseli doğrudan sisteme yükleyin."
          : "Product image server blocked marketplace download bots."
      };
    }

    // 3. Invalid Image URL / Image Rejected
    if (/görsel hatası|image url|image link|valid url format|resim|görsel/i.test(clean) && !/n11 katalog/i.test(clean)) {
      return {
        label: isTr ? "Resim Kabul Edilmedi" : "Image Rejected",
        detail: isTr
          ? "Ürün görsel linki kabul edilmedi (geçersiz URL formatı veya bozuk HTTPS bağlantısı). Ürün düzenleme ekranından görseli yenileyin."
          : "Product image link was rejected due to invalid URL or format."
      };
    }

    // 4. Brand Mismatch (Selected brand vs title/image)
    if (/marka uyuşmazlığı|selected brand|does not match the brand|wrong brand/i.test(clean)) {
      return {
        label: isTr ? "Marka Uyuşmazlığı" : "Brand Mismatch",
        detail: isTr
          ? "Seçilen marka ile ürün başlığı veya görselindeki marka bilgisi uyuşmuyor. Ürün kartındaki Marka alanını başlıkla birebir aynı yapın."
          : "Selected brand does not match the brand in product title or image."
      };
    }

    // 5. Missing Mandatory Category Attribute (e.g. Menşei)
    if (/zorunlu kategori özellik|eksik özellik|mandatory attribute|menşei/i.test(clean)) {
      const attrMatch = clean.match(/Özellik Adı:\s*([^.,]+)/i);
      const attrName = attrMatch ? attrMatch[1].trim() : "Menşei / Özellik";
      return {
        label: isTr ? `Eksik Özellik (${attrName})` : `Missing Attr (${attrName})`,
        detail: isTr
          ? `Pazaryerinin bu kategoride zorunlu tuttuğu "${attrName}" bilgisi eksik. Kategori özelliklerinden ilgili alanı doldurup tekrar gönderin.`
          : `Mandatory category attribute "${attrName}" is missing.`
      };
    }

    // 6. Invalid / Deprecated Category ID
    if (/kategori bilgisi geçerli değildir|couldn't find any category|category id|kategori eşleş/i.test(clean)) {
      const catIdMatch = clean.match(/(?:id|id:)\s*(\d+)/i);
      const catId = catIdMatch ? catIdMatch[1] : "";
      return {
        label: isTr ? `Kategori Geçersiz${catId ? ` (#${catId})` : ""}` : "Invalid Category",
        detail: isTr
          ? `Eşleştirilen kategori kodu${catId ? ` (${catId})` : ""} pazaryerinde kapatılmış veya güncellenmiş. Üstteki "Kategori Eşleştir" butonundan güncel bir alt kategori seçin.`
          : "Mapped category ID is no longer valid on the marketplace."
      };
    }

    // 7. High Price / Reference Price Alert
    if (isPriceErrorStr(clean)) {
      const refMatch = clean.match(/Ref:\s*([^)]+)/i);
      return {
        label: isTr ? "Yüksek Fiyat Kısıtı" : "High Price Alert",
        detail: isTr
          ? `Pazaryeri rekabetçi tavan fiyat sınırına takıldı${refMatch ? ` (Tavan Ref: ${refMatch[1]})` : ""}. Fiyatı referans değere çekin veya komisyon marjını güncelleyin.`
          : "Listing blocked due to marketplace competitive high-price threshold."
      };
    }

    // 8. Brand Authorization Required (Amazon 5886 / HB Brand Auth)
    if (/marka onay|5886/i.test(clean)) {
      return {
        label: isTr ? "Marka Onayı Gerekli" : "Brand Auth Required",
        detail: isTr
          ? "Pazaryeri bu markanın satışı için yetki belgesi veya fatura onayı talep ediyor (Katalog Marka Kısıtı)."
          : "Marketplace requires brand authorization to list this brand."
      };
    }

    // 9. Restricted ASIN (Amazon 18299)
    if (/kısıtlı asin|18299/i.test(clean)) {
      return {
        label: isTr ? "Kısıtlı ASIN" : "Restricted ASIN",
        detail: isTr
          ? "Bu ASIN kodu Amazon tarafından doğrudan satışa kısıtlanmış (onay başvurusu gerektirir)."
          : "This ASIN is restricted by Amazon."
      };
    }

    // 10. Document / Counterfeit Restriction
    if (/belge kısıt|counterfeit/i.test(clean)) {
      return {
        label: isTr ? "Belge Kısıtı" : "Document Required",
        detail: isTr
          ? "Pazaryeri orijinallik / distribütör faturası belgesi talep ettiği için ilanı askıya aldı."
          : "Marketplace requires authenticity documentation."
      };
    }

    // 11. Hepsiburada Locked Listing
    if (/hb kilitli|kilitli ilan|byhbadmin/i.test(clean)) {
      return {
        label: isTr ? "HB Kilitli İlan" : "HB Admin Locked",
        detail: isTr
          ? "Bu ürün Hepsiburada katalog yönetimi tarafından kilitlenmiş (ByHbAdmin). Satıcı panelinden talep açılmalıdır."
          : "Listing is locked by Hepsiburada catalog administration."
      };
    }

    // 12. N11 Catalog / Image / Attribute Rejection
    if (/n11 katalog onayı reddedildi/i.test(clean)) {
      return {
        label: isTr ? "Resim / Özellik Reddi" : "N11 Catalog Rejected",
        detail: isTr
          ? "N11 katalog ekibi ürün görselini veya özellik bilgilerini standartlara uygun bulmadı. Görseli ve özellikleri kontrol edip tekrar gönderin."
          : "N11 catalog review rejected the product image or attributes."
      };
    }

    // 13. Duplicate Request / Already Submitted
    if (/tekrarlı ürün oluşturma|aynı barkodlu/i.test(clean)) {
      return {
        label: isTr ? "Mükerrer Gönderim Uyarısı" : "Duplicate Request",
        detail: isTr
          ? "Aynı barkod için eşzamanlı mükerrer istek gönderildi. Sağdaki 'Satışa Aç / Güncelle' butonuna tıklayarak durumu tazeleyin."
          : "Duplicate product creation request detected. Click publish/update to refresh."
      };
    }

    // 14. Missing ASIN
    if (/asin kodu tanımlı değil|asin eksik|13013/i.test(clean)) {
      return {
        label: isTr ? "ASIN Kodu Eksik" : "Missing ASIN",
        detail: isTr
          ? "Amazon'da satış için ürün kartında geçerli bir ASIN kodu (B0...) tanımlanmalıdır."
          : "Valid Amazon ASIN is required."
      };
    }

    // 15. API / 404 / Auth Error
    if (/404|401|403|bağlantı hatası|yetkilendirme/i.test(clean)) {
      return {
        label: isTr ? "API / Kategori Bağlantı Hatası" : "API Connection Error",
        detail: clean
      };
    }

    return {
      label: clean.length <= 28 ? clean : `${clean.slice(0, 26)}…`,
      detail: clean
    };
  };

  const getShortErrorLabel = (err: string | null | undefined): string => {
    return getErrorDiagnosis(err).label;
  };

  return (
    <tr 
      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
        isSelected ? 'bg-orange-50/40 dark:bg-orange-950/20' : ''
      }`}
    >
      {/* Checkbox */}
      <td className="py-3 px-4 text-center">
        <input 
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(p.id)}
          aria-label={isTr ? `Seç: ${p.name}` : `Select: ${p.name}`}
          className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
        />
      </td>

      {/* Product info */}
      <td className="py-3 px-4">
        <div className="flex items-start gap-3">
          {/* Product Image */}
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 overflow-hidden relative flex items-center justify-center">
            {p.image_url ? (
              <img 
                src={p.image_url.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(p.image_url)}` : p.image_url}
                alt={p.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e: any) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m21 8-9-4-9 4v8l9 4 9-4V8z'/%3E%3Cpath d='M3.27 6.96 12 12.01l8.73-5.05'/%3E%3Cpath d='M12 22.08V12'/%3E%3C/svg%3E";
                }}
              />
            ) : (
              <Package className="w-5 h-5 text-slate-400" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs truncate max-w-[180px] sm:max-w-[220px] md:max-w-[260px]" title={p.name}>
              {p.name}
            </h4>

            {/* Barcode & Marketplace SKU Badges */}
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {p.barcode ? (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCopyBarcode(p.barcode); }}
                  className="font-mono text-[10px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer"
                  title={isTr ? "Barkodu Kopyala" : "Copy Barcode"}
                >
                  {copiedBarcode === p.barcode ? (
                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-2.5 h-2.5 opacity-60" />
                  )}
                  {p.barcode}
                </button>
              ) : (
                <span className="text-[10px] font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <AlertCircle className="w-2.5 h-2.5" />
                  {isTr ? "Barkodsuz" : "No Barcode"}
                </span>
              )}

              {/* Context-aware SKU / ASIN Badges */}
              {(() => {
                let mpData = p.marketplace_data;
                if (typeof mpData === 'string') {
                  try { mpData = JSON.parse(mpData); } catch(e) { mpData = {}; }
                }

                const showHb = selectedMarketplace === 'all' || selectedMarketplace === 'hepsiburada';
                const showAmz = selectedMarketplace === 'all' || selectedMarketplace === 'amazon';
                const showTy = selectedMarketplace === 'all' || selectedMarketplace === 'trendyol';
                const showN11 = selectedMarketplace === 'all' || selectedMarketplace === 'n11';
                const showPzr = selectedMarketplace === 'all' || selectedMarketplace === 'pazarama';

                const hbSku = p.hepsiburada_sku || 
                  p.hepsiburadaSku || 
                  mpData?.hepsiburada?.hepsiburadaSku || 
                  mpData?.hepsiburada?.hepsiburada_sku ||
                  mpData?.hepsiburada?.hbSku ||
                  (String(p.sku || '').toUpperCase().startsWith('HBCV') ? p.sku : '') ||
                  (String(p.product_code || '').toUpperCase().startsWith('HBCV') ? p.product_code : '');

                const tyId = p.trendyol_id || mpData?.trendyol?.contentId;
                const n11Id = p.n11_id && String(p.n11_id).toUpperCase() !== 'PUBLISHED' && String(p.n11_id).toLowerCase() !== 'null' ? p.n11_id : null;
                const pzrId = p.pazarama_id;

                return (
                  <>
                    {showHb && hbSku && hbSku !== 'null' && (
                      <span className="font-mono text-[10px] text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 px-1.5 py-0.5 rounded flex items-center gap-1" title="Hepsiburada SKU">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                        HB: {hbSku}
                      </span>
                    )}
                    {showAmz && p.amazon_asin && p.amazon_asin !== 'null' && !p.amazon_asin.startsWith('http') && (
                      <span className="font-mono text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded flex items-center gap-1" title="Amazon ASIN">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        ASIN: {p.amazon_asin}
                      </span>
                    )}
                    {showTy && tyId && (
                      <span className="font-mono text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded flex items-center gap-1" title="Trendyol ID">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        TY: {tyId}
                      </span>
                    )}
                    {showN11 && n11Id && (
                      <span className="font-mono text-[10px] text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-1.5 py-0.5 rounded flex items-center gap-1" title="N11 ID">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        N11: {n11Id}
                      </span>
                    )}
                    {showPzr && pzrId && (
                      <span className="font-mono text-[10px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded flex items-center gap-1" title="Pazarama ID">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        PZR: {pzrId}
                      </span>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Net İlan Hatası ve Çözüm Açıklaması Kutusu */}
            {(() => {
              const activeErrors: Array<{ mpLabel: string; err: string }> = [];
              if (selectedMarketplace === 'all') {
                if (hbError) activeErrors.push({ mpLabel: 'HB', err: hbError });
                if (tyError) activeErrors.push({ mpLabel: 'TY', err: tyError });
                if (n11Error) activeErrors.push({ mpLabel: 'N11', err: n11Error });
                if (amzError) activeErrors.push({ mpLabel: 'AMZ', err: amzError });
                if (pzrError) activeErrors.push({ mpLabel: 'PZR', err: pzrError });
              } else if (displayError) {
                const mpTag = selectedMarketplace === 'hepsiburada' ? 'HB'
                  : selectedMarketplace === 'trendyol' ? 'TY'
                  : selectedMarketplace === 'n11' ? 'N11'
                  : selectedMarketplace === 'amazon' ? 'AMZ'
                  : 'PZR';
                activeErrors.push({ mpLabel: mpTag, err: displayError });
              }

              if (activeErrors.length === 0) return null;

              return (
                <div className="mt-1.5 space-y-1 max-w-[360px] sm:max-w-[440px]">
                  {activeErrors.map((item, idx) => {
                    const diag = getErrorDiagnosis(item.err);
                    const isPrice = isPriceErrorStr(item.err);
                    return (
                      <div
                        key={idx}
                        className={`px-2 py-1 rounded-lg border text-[10px] leading-snug ${
                          isPrice
                            ? 'bg-orange-50/90 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/70 text-orange-900 dark:text-orange-200'
                            : 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/70 text-rose-900 dark:text-rose-200'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1">
                          <AlertTriangle className={`w-3 h-3 shrink-0 ${isPrice ? 'text-orange-600' : 'text-rose-600'}`} />
                          <span>[{item.mpLabel}] İlan Hatalı: {diag.label}</span>
                        </div>
                        {diag.detail && (
                          <div className="mt-0.5 text-[10px] opacity-90 font-normal">
                            {diag.detail}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </td>

      {/* Price & Stock */}
      <td className="py-3 px-4 whitespace-nowrap">
        {(() => {
          let mpData = p.marketplace_data;
          if (typeof mpData === 'string') {
            try { mpData = JSON.parse(mpData); } catch(e) { mpData = {}; }
          }

          const targetMp = selectedMarketplace !== 'all' ? selectedMarketplace : (p.is_amazon_active ? 'amazon' : 'hepsiburada');
          const rawPrice = parseFloat(p.price || 0);
          let computedPolicyPrice = 0;

          if (rawPrice > 0 && storeBranding) {
            const rates = storeBranding.currency_rates || {};
            const curr = String(p.currency || 'TRY').toUpperCase().trim();
            let webPriceTry = rawPrice;
            if ((curr === 'USD' || curr === '$') && Number(rates.USD) > 0) webPriceTry = rawPrice * Number(rates.USD);
            else if ((curr === 'EUR' || curr === '€') && Number(rates.EUR) > 0) webPriceTry = rawPrice * Number(rates.EUR);
            else if ((curr === 'GBP' || curr === '£') && Number(rates.GBP) > 0) webPriceTry = rawPrice * Number(rates.GBP);

            const mpSettings = storeBranding[`${targetMp}_settings`] || {};
            const categoryMarkups = mpSettings.categoryMarkups || {};
            let commRate = mpSettings.defaultCommissionRate !== undefined && mpSettings.defaultCommissionRate !== null
              ? Number(mpSettings.defaultCommissionRate)
              : (mpSettings.commissionRate !== undefined ? Number(mpSettings.commissionRate) : 0);
            let fixedFee = mpSettings.defaultFixedFee !== undefined && mpSettings.defaultFixedFee !== null
              ? Number(mpSettings.defaultFixedFee)
              : 0;

            const cat1 = p.category ? String(p.category).trim() : '';
            const sub1 = p.sub_category ? String(p.sub_category).trim() : '';
            const subKey = cat1 && sub1 ? `${cat1} > ${sub1}` : '';

            if (subKey && categoryMarkups[subKey]) {
              const cm = categoryMarkups[subKey];
              if (cm.commissionRate !== undefined && cm.commissionRate !== null && cm.commissionRate !== '') commRate = Number(cm.commissionRate);
              if (cm.fixedFee !== undefined && cm.fixedFee !== null && cm.fixedFee !== '') fixedFee = Number(cm.fixedFee);
            } else if (cat1 && categoryMarkups[cat1]) {
              const cm = categoryMarkups[cat1];
              if (cm.commissionRate !== undefined && cm.commissionRate !== null && cm.commissionRate !== '') commRate = Number(cm.commissionRate);
              if (cm.fixedFee !== undefined && cm.fixedFee !== null && cm.fixedFee !== '') fixedFee = Number(cm.fixedFee);
            }

            const method = mpSettings.priceCalculationMethod || mpSettings.priceCalculation || 'markup';
            if (method === 'margin' && commRate < 100) {
              computedPolicyPrice = Number(((webPriceTry + fixedFee) / (1 - commRate / 100)).toFixed(2));
            } else {
              computedPolicyPrice = Number(((webPriceTry * (1 + commRate / 100)) + fixedFee).toFixed(2));
            }
          }

          const cachedMpPrice = selectedMarketplace !== 'all' 
            ? (mpData?.[selectedMarketplace]?.attributes?.price || mpData?.[selectedMarketplace]?.price)
            : (mpData?.amazon?.attributes?.price || mpData?.hepsiburada?.attributes?.price || mpData?.attributes?.price);

          const mpSpecificPrice = computedPolicyPrice > 0 ? computedPolicyPrice : cachedMpPrice;

          let refPrice = selectedMarketplace !== 'all'
            ? mpData?.[selectedMarketplace]?.referencePrice
            : (mpData?.amazon?.referencePrice || mpData?.hepsiburada?.referencePrice);

          if (!refPrice && displayError) {
            const m = displayError.match(/Ref:\s*([0-9.,]+)/i);
            if (m && m[1]) {
              refPrice = Number(m[1].replace(/\./g, '').replace(',', '.'));
            }
          }
          
          return (
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs font-mono tabular-nums">
                {parseFloat(p.price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {p.currency || 'TL'}
              </div>
              {mpSpecificPrice && Number(mpSpecificPrice) > 0 && (
                <div className="text-[10px] font-bold text-orange-600 dark:text-orange-400 font-mono" title={isTr ? "E-Market Satış Fiyatı" : "Marketplace Selling Price"}>
                  PZ: {Number(mpSpecificPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                </div>
              )}
              {refPrice && Number(refPrice) > 0 && (
                <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 font-mono" title={isTr ? "Pazaryeri Referans / Rekabetçi Tavan Fiyatı" : "Marketplace Reference Price"}>
                  Ref: {Number(refPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                </div>
              )}
              <div className="text-[10px] font-medium text-slate-400 mt-0.5 font-mono">
                {isTr ? "Stok:" : "Stock:"}{" "}
                <span className={`font-semibold ${Number(p.stock_quantity || 0) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                  {p.stock_quantity || 0}
                </span>
              </div>
            </div>
          );
        })()}
      </td>

      {/* Marketplace Status Badges */}
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 flex-wrap">
            {selectedMarketplace === 'all' ? (
              <>
                {/* Hepsiburada Badge */}
                {isHbActive && MARKETPLACES[0].getListingUrl(p) ? (
                  <a
                    href={MARKETPLACES[0].getListingUrl(p)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800 hover:opacity-80 transition-opacity"
                    title={isTr ? "Hepsiburada Canlı İlanına Git" : "Open Hepsiburada Live Listing"}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                    HB
                    <ExternalLink className="w-2.5 h-2.5 opacity-80" />
                  </a>
                ) : isProductPending(p, 'hepsiburada') ? (
                  <button
                    type="button"
                    onClick={() => onCheckHbStatus(p.id)}
                    disabled={checkingStatusId === p.id}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-200 cursor-pointer transition-colors"
                    title={isTr ? "Hepsiburada katalog ve barkod onay incelemesinde. Durumu sorgulamak için tıklayın." : "Pending HB catalog review. Click to refresh status."}
                  >
                    <Clock className={`w-2.5 h-2.5 text-amber-600 ${checkingStatusId === p.id ? 'animate-spin' : ''}`} />
                    HB ONAY
                  </button>
                ) : hbError ? (
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                      isPriceErrorStr(hbError)
                        ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                    }`}
                    title={`Hepsiburada: ${hbError}`}
                  >
                    <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                    HB: {getShortErrorLabel(hbError)}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800" title="HB Pasif">
                    HB
                  </span>
                )}

                {/* Amazon Badge */}
                {isProductActive(p, 'amazon') ? (
                  <a
                    href={MARKETPLACES[3].getListingUrl(p)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:opacity-80 transition-opacity"
                    title={isTr ? "Amazon Canlı İlanına Git" : "Open Amazon Live Listing"}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    AMZ
                    <ExternalLink className="w-2.5 h-2.5 opacity-80" />
                  </a>
                ) : amzError ? (
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                      isPriceErrorStr(amzError)
                        ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                    }`}
                    title={`Amazon: ${amzError}`}
                  >
                    <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                    AMZ: {getShortErrorLabel(amzError)}
                  </span>
                ) : null}

                {/* Trendyol Badge */}
                {isTyActive && MARKETPLACES[1].getListingUrl(p) ? (
                  <a
                    href={MARKETPLACES[1].getListingUrl(p)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:opacity-80 transition-opacity"
                    title={isTr ? "Trendyol Canlı İlanına Git" : "Open Trendyol Live Listing"}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    TY
                    <ExternalLink className="w-2.5 h-2.5 opacity-80" />
                  </a>
                ) : isProductPending(p, 'trendyol') ? (
                  <button
                    type="button"
                    onClick={() => onCheckTyStatus && onCheckTyStatus(p.id)}
                    disabled={checkingStatusId === p.id}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-200 cursor-pointer transition-colors"
                    title={isTr ? "Trendyol katalog incelemesinde. Durumu sorgulamak için tıklayın." : "Pending Trendyol catalog review. Click to refresh status."}
                  >
                    <Clock className={`w-2.5 h-2.5 text-amber-600 ${checkingStatusId === p.id ? 'animate-spin' : ''}`} />
                    TY ONAY
                  </button>
                ) : tyError ? (
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                      isPriceErrorStr(tyError)
                        ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                    }`}
                    title={`Trendyol: ${tyError}`}
                  >
                    <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                    TY: {getShortErrorLabel(tyError)}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800" title="TY Pasif">
                    TY
                  </span>
                )}
                {/* N11 Badge */}
                {isN11Active && MARKETPLACES[2].getListingUrl(p) ? (
                  <a
                    href={MARKETPLACES[2].getListingUrl(p)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800 hover:opacity-80 transition-opacity"
                    title="N11 Canlı İlanına Git"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    N11
                    <ExternalLink className="w-2.5 h-2.5 opacity-80" />
                  </a>
                ) : isProductPending(p, 'n11') ? (
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                    title={isTr ? "N11 katalog onay incelemesinde (InApproval)" : "Pending N11 catalog review"}
                  >
                    <Clock className="w-2.5 h-2.5 text-amber-600" />
                    N11 ONAY
                  </span>
                ) : n11Error ? (
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                    title={`N11: ${n11Error}`}
                  >
                    <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                    N11: {getShortErrorLabel(n11Error)}
                  </span>
                ) : null}
                {/* Pazarama Badge */}
                {isPzActive ? (
                  <a
                    href={MARKETPLACES[4].getListingUrl(p)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:opacity-80 transition-opacity"
                    title="Pazarama Canlı İlanına Git"
                  >
                    PZR
                    <ExternalLink className="w-2.5 h-2.5 opacity-80" />
                  </a>
                ) : pzrError ? (
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                    title={`Pazarama: ${pzrError}`}
                  >
                    <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                    PZR: {getShortErrorLabel(pzrError)}
                  </span>
                ) : null}
              </>
            ) : (() => {
              const isTargetActive = isProductActive(p, selectedMarketplace);
              const isTargetPending = isProductPending(p, selectedMarketplace);
              const targetError = getProductError(p, selectedMarketplace);
              const isPriceErr = isPriceErrorStr(targetError);

              return (
                <>
                  {isTargetActive ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      {isTr ? "Satışta" : "Active"}
                    </span>
                  ) : isTargetPending ? (
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                      title={isTr ? "Katalog ve barkod onay incelemesinde" : "Catalog review in progress"}
                    >
                      <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                      {isTr ? "Onayda" : "Pending"}
                    </span>
                  ) : targetError ? (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold border ${
                        isPriceErr
                          ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                      }`}
                      title={targetError}
                    >
                      <AlertTriangle className={`w-3 h-3 shrink-0 ${isPriceErr ? 'text-orange-600' : 'text-rose-600'}`} />
                      <span>{isTr ? "Hatalı:" : "Error:"} {getShortErrorLabel(targetError)}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {isTr ? "Pasif" : "Inactive"}
                    </span>
                  )}
                </>
              );
            })()}
          </div>

          {/* Last sync time */}
          {p.hepsiburada_last_sync && (
            <div className="text-[9px] text-slate-400 flex items-center gap-1 font-mono">
              <Clock className="w-2.5 h-2.5 opacity-60" />
              {new Date(p.hepsiburada_last_sync).toLocaleString('tr-TR', { 
                day: '2-digit', 
                month: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          )}
        </div>
      </td>

      {/* E-Marketplace Direct Listing Badges & Actions */}
      <td className="py-3 px-4 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5">
          {selectedMarketplace === 'all' ? (
            <>
              {/* DOĞRUDAN HB İLANINA GİT */}
              {isHbActive && MARKETPLACES[0].getListingUrl(p) && (
                <a
                  href={MARKETPLACES[0].getListingUrl(p)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1 shrink-0 active:scale-95 border border-orange-400/30"
                  title={isTr ? "Hepsiburada Canlı İlanına Git" : "Open Live Listing on Hepsiburada"}
                >
                  <span>HB</span>
                  <ExternalLink className="w-3 h-3 opacity-90" />
                </a>
              )}

              {/* HB ONAY BEKLİYOR: HIZLI DURUM KONTROL BUTONU */}
              {!isHbActive && isProductPending(p, 'hepsiburada') && (
                <button
                  type="button"
                  onClick={() => onCheckHbStatus(p.id)}
                  disabled={checkingStatusId === p.id}
                  className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-all shadow-xs flex items-center justify-center shrink-0 active:scale-95 cursor-pointer"
                  title={isTr ? "Hepsiburada Katalog Onay Durumunu Canlı Sorgula" : "Check HB Catalog Approval Status"}
                >
                  <Clock className={`w-3.5 h-3.5 text-amber-600 ${checkingStatusId === p.id ? 'animate-spin' : ''}`} />
                </button>
              )}

              {/* DOĞRUDAN TRENDYOL İLANINA GİT */}
              {isTyActive && MARKETPLACES[1].getListingUrl(p) && (
                <a
                  href={MARKETPLACES[1].getListingUrl(p)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1 shrink-0 active:scale-95 border border-amber-500/30"
                  title={isTr ? "Trendyol Canlı İlanına Git" : "Open Live Listing on Trendyol"}
                >
                  <span>TY</span>
                  <ExternalLink className="w-3 h-3 opacity-90" />
                </a>
              )}

              {/* TY ONAY BEKLİYOR: HIZLI DURUM KONTROL BUTONU */}
              {!isTyActive && isProductPending(p, 'trendyol') && onCheckTyStatus && (
                <button
                  type="button"
                  onClick={() => onCheckTyStatus(p.id)}
                  disabled={checkingStatusId === p.id}
                  className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-all shadow-xs flex items-center justify-center shrink-0 active:scale-95 cursor-pointer"
                  title={isTr ? "Trendyol V2 Katalog Onay Durumunu Canlı Sorgula" : "Check Trendyol Catalog Approval Status"}
                >
                  <Clock className={`w-3.5 h-3.5 text-amber-600 ${checkingStatusId === p.id ? 'animate-spin' : ''}`} />
                </button>
              )}

              {/* DOĞRUDAN N11 İLANINA GİT */}
              {isN11Active && MARKETPLACES[2].getListingUrl(p) && (
                <a
                  href={MARKETPLACES[2].getListingUrl(p)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1 shrink-0 active:scale-95 border border-red-500/30"
                  title={isTr ? "N11 Canlı İlanına Git" : "Open Live Listing on N11"}
                >
                  <span>N11</span>
                  <ExternalLink className="w-3 h-3 opacity-90" />
                </a>
              )}

              {/* DOĞRUDAN AMAZON İLANINA GİT */}
              {isAmzActive && (
                <a
                  href={MARKETPLACES[3].getListingUrl(p)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-black text-amber-400 border border-amber-500/40 font-bold text-xs transition-all shadow-xs flex items-center gap-1 shrink-0 active:scale-95"
                  title={isTr ? "Amazon Canlı İlanına Git" : "Open Live Listing on Amazon"}
                >
                  <span>AMZ</span>
                  <ExternalLink className="w-3 h-3 opacity-90" />
                </a>
              )}

              {/* DOĞRUDAN PAZARAMA İLANINA GİT */}
              {isPzActive && (
                <a
                  href={MARKETPLACES[4].getListingUrl(p)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1 shrink-0 active:scale-95 border border-blue-500/30"
                  title={isTr ? "Pazarama Canlı İlanına Git" : "Open Live Listing on Pazarama"}
                >
                  <span>PZR</span>
                  <ExternalLink className="w-3 h-3 opacity-90" />
                </a>
              )}

              {/* Yeniden Satışa Gönder / Güncelle Button */}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPublishSingle(p, selectedMarketplace); }}
                disabled={publishingId === p.id}
                className={`p-1.5 rounded-lg border transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 ${
                  isHbActive
                    ? 'border-orange-200 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:text-orange-600 hover:bg-orange-50'
                }`}
                title={
                  isHbActive 
                    ? (isTr ? "Fiyat/Stok Güncelle" : "Update Price/Stock")
                    : (isTr ? "Satışa Aç" : "Publish Listing")
                }
              >
                <UploadCloud className={`w-4 h-4 ${publishingId === p.id ? 'animate-bounce text-orange-600' : ''}`} />
              </button>

              {/* Yayından Kaldır / Satıştan Kapat Button */}
              {isHbActive && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUnpublishSingle(p, selectedMarketplace); }}
                  disabled={publishingId === p.id}
                  className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                  title={isTr ? "Yayından Kaldır (Satışa Kapat)" : "Unpublish Listing"}
                >
                  <StopCircle className={`w-4 h-4 ${publishingId === p.id ? 'animate-bounce text-rose-600' : ''}`} />
                </button>
              )}
            </>
          ) : (() => {
            const targetConfig = MARKETPLACES.find(m => m.key === selectedMarketplace) || MARKETPLACES[0];
            const isTargetActive = isProductActive(p, selectedMarketplace);

            return (
              <>
                {/* Single Marketplace Live Listing Icon Link Button */}
                {isTargetActive && targetConfig.getListingUrl(p) && (
                  <a
                    href={targetConfig.getListingUrl(p)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs flex items-center justify-center shrink-0 active:scale-95 border border-emerald-500/30"
                    title={isTr ? `${targetConfig.name} Canlı İlanına Git` : `Open Live Listing on ${targetConfig.name}`}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                {/* Hepsiburada Pending Actions: Canlı Durum Sorgula */}
                {selectedMarketplace === 'hepsiburada' && !isTargetActive && isProductPending(p, 'hepsiburada') && (
                  <button
                    type="button"
                    onClick={() => onCheckHbStatus(p.id)}
                    disabled={checkingStatusId === p.id}
                    className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-all shadow-xs flex items-center justify-center shrink-0 active:scale-95 cursor-pointer"
                    title={isTr ? "Hepsiburada Katalog Durumunu Canlı Sorgula" : "Check Live HB Status"}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-amber-700 ${checkingStatusId === p.id ? 'animate-spin' : ''}`} />
                  </button>
                )}

                {/* Trendyol Pending Actions: Canlı Durum Sorgula */}
                {selectedMarketplace === 'trendyol' && !isTargetActive && isProductPending(p, 'trendyol') && onCheckTyStatus && (
                  <button
                    type="button"
                    onClick={() => onCheckTyStatus(p.id)}
                    disabled={checkingStatusId === p.id}
                    className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-all shadow-xs flex items-center justify-center shrink-0 active:scale-95 cursor-pointer"
                    title={isTr ? "Trendyol V2 Katalog Durumunu Canlı Sorgula" : "Check Live Trendyol Status"}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-amber-700 ${checkingStatusId === p.id ? 'animate-spin' : ''}`} />
                  </button>
                )}

                {/* Marketplace-specific Publish/Update Action */}
                {(() => {
                  const isZeroStock = Number(p.stock_quantity || p.stock || 0) <= 0;
                  return (
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPublishSingle(p, selectedMarketplace); }}
                      disabled={publishingId === p.id || isZeroStock}
                      className={`p-1.5 rounded-lg border transition-all flex items-center justify-center shrink-0 ${
                        isZeroStock
                          ? 'border-gray-200 text-gray-400 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 cursor-not-allowed opacity-60'
                          : isTargetActive
                            ? 'border-indigo-200 text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 active:scale-95 cursor-pointer'
                            : 'border-orange-300 text-orange-700 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 active:scale-95 cursor-pointer'
                      }`}
                      title={
                        isZeroStock
                          ? (isTr ? "Stok Yok (0) - Pazaryerinde Satışa Açılamaz" : "Out of Stock (0) - Cannot Publish")
                          : isTargetActive 
                            ? (isTr ? `${targetConfig.name}'da Fiyat/Stok Güncelle` : `Update Price/Stock on ${targetConfig.name}`)
                            : (isTr ? `${targetConfig.name}'da Satışa Aç` : `Publish on ${targetConfig.name}`)
                      }
                    >
                      <UploadCloud className={`w-4 h-4 ${publishingId === p.id ? 'animate-bounce' : ''}`} />
                    </button>
                  );
                })()}

                {/* Marketplace-specific Unpublish Action */}
                {isTargetActive && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUnpublishSingle(p, selectedMarketplace); }}
                    disabled={publishingId === p.id}
                    className="p-1.5 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                    title={isTr ? `${targetConfig.name}'da Yayından Kaldır (Satışa Kapat)` : `Unpublish from ${targetConfig.name}`}
                  >
                    <StopCircle className={`w-4 h-4 ${publishingId === p.id ? 'animate-bounce text-rose-600' : ''}`} />
                  </button>
                )}
              </>
            );
          })()}

          {/* Düzelt & Pazaryeri Bilgilerini Düzenle */}
          {onEditProduct && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEditProduct(p); }}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 text-slate-500 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 transition-all cursor-pointer"
              title={isTr ? "Ürün & Pazaryeri Bilgilerini Düzenle" : "Edit Product & Attributes"}
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};
