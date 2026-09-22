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
  isTr: boolean;
  copiedBarcode: string | null;
  onCopyBarcode: (bc: string) => void;
  onCheckHbStatus: (productId: number) => void;
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
  isTr,
  copiedBarcode,
  onCopyBarcode,
  onCheckHbStatus,
  checkingStatusId,
  publishingId,
  onPublishSingle,
  onUnpublishSingle,
  onEditProduct,
  isProductActive,
  isProductPending,
  getProductError,
}) => {
  const isHbActive = p.is_hepsiburada_active;
  const isTyActive = p.is_trendyol_active;
  const isN11Active = p.is_n11_active;
  const isAmzActive = p.is_amazon_active;
  const isPzActive = p.is_pazarama_active;

  const hbError = p.hepsiburada_last_error;
  const tyError = p.trendyol_last_error;
  const n11Error = p.n11_last_error;
  const amzError = p.amazon_last_error;
  const pzError = p.pazarama_last_error;

  const hasAnyError = Boolean(hbError || tyError || n11Error || amzError || pzError);

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
                const n11Id = p.n11_id;
                const pzrId = p.pazarama_id;

                return (
                  <>
                    {showHb && hbSku && (
                      <span className="font-mono text-[10px] text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 px-1.5 py-0.5 rounded flex items-center gap-1" title="Hepsiburada SKU">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                        HB: {hbSku}
                      </span>
                    )}
                    {showAmz && p.amazon_asin && (
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

            {/* Error Box if any error occurred */}
            {hasAnyError && (
              <div className="mt-1.5 p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-[10px] text-rose-700 dark:text-rose-300 flex items-start gap-1 max-w-sm">
                <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 truncate">
                  <span className="font-semibold">{isTr ? "Hata:" : "Error:"} </span>
                  {hbError || tyError || n11Error || amzError || pzError}
                </div>
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Price & Stock */}
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs font-mono tabular-nums">
          {parseFloat(p.price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {p.currency || 'TL'}
        </div>
        <div className="text-[10px] font-medium text-slate-400 mt-0.5 font-mono">
          {isTr ? "Stok:" : "Stock:"}{" "}
          <span className={`font-semibold ${Number(p.stock_quantity || 0) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
            {p.stock_quantity || 0}
          </span>
        </div>
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
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                    title={hbError}
                  >
                    <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                    HB
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800" title="HB Pasif">
                    HB
                  </span>
                )}

                {/* Amazon Badge */}
                {isAmzActive ? (
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
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                    title={amzError}
                  >
                    <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                    AMZ
                  </span>
                ) : null}

                {/* Trendyol Badge */}
                {isTyActive && (
                  <a
                    href={MARKETPLACES[1].getListingUrl(p)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:opacity-80 transition-opacity"
                    title="Trendyol Canlı İlanına Git"
                  >
                    TY
                    <ExternalLink className="w-2.5 h-2.5 opacity-80" />
                  </a>
                )}
                {/* N11 Badge */}
                {isN11Active && (
                  <a
                    href={MARKETPLACES[2].getListingUrl(p)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800 hover:opacity-80 transition-opacity"
                    title="N11 Canlı İlanına Git"
                  >
                    N11
                    <ExternalLink className="w-2.5 h-2.5 opacity-80" />
                  </a>
                )}
                {/* Pazarama Badge */}
                {isPzActive && (
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
                )}
              </>
            ) : (() => {
              const isTargetActive = isProductActive(p, selectedMarketplace);
              const isTargetPending = isProductPending(p, selectedMarketplace);
              const targetError = getProductError(p, selectedMarketplace);

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
                      {isTr ? "Onay Bekliyor" : "Pending Review"}
                    </span>
                  ) : targetError ? (
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                      title={targetError}
                    >
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      {isTr ? "Hatalı" : "Error"}
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
              {isTyActive && (
                <a
                  href={MARKETPLACES[1].getListingUrl(p)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1 shrink-0 active:scale-95 border border-amber-500/30"
                  title={isTr ? "Trendyol Canlı İlanına Git" : "Open Live Listing on Trendyol"}
                >
                  <span>TY</span>
                  <ExternalLink className="w-3 h-3 opacity-90" />
                </a>
              )}

              {/* DOĞRUDAN N11 İLANINA GİT */}
              {isN11Active && (
                <a
                  href={MARKETPLACES[2].getListingUrl(p)}
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
