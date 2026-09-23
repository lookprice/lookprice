import React from "react";
import { 
  Edit2, 
  Trash2, 
  Share2, 
  History, 
  Sparkles, 
  MoreVertical, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  Package, 
  FileText,
  Flame,
  Star,
  Award,
  Crown,
  Tag,
  Store
} from "lucide-react";
import { BookstoreBadgePopover } from "./BookstoreBadgePopover";
import { BOOKSTORE_BADGES } from "@/data/bookstoreBadges";

interface ProductTableRowProps {
  product: any;
  isViewer: boolean;
  isCafe: boolean;
  isCafeRestaurant?: boolean;
  isShopLp: boolean;
  isBookstore: boolean;
  showStoreName?: boolean;
  currentStoreId?: number;
  tableManager: any;
  selectedIds: number[];
  toggleSelect: (id: number) => void;
  highlightedProductId: number | null;
  openActionMenuId: number | null;
  setOpenActionMenuId: (id: number | null) => void;
  badgePopoverProductId: number | null;
  setBadgePopoverProductId: (id: number | null) => void;
  handleToggleBookBadge: (e: React.MouseEvent, p: any, badgeId: string) => void;
  hasProductBadgeLocal: (p: any, badgeId: string) => boolean;
  getProductBadgesLocal: (p: any) => string[];
  getIsBestseller: (p: any) => boolean;
  calculateProfitMargin: (p: any) => any;
  getHepsiburadaUrl: (p: any) => string | null;
  isHepsiburadaPending: (p: any) => boolean;
  getTrendyolUrl: (p: any) => string | null;
  getN11Url: (p: any) => string | null;
  getAmazonUrl: (p: any) => string | null;
  getPazaramaUrl: (p: any) => string | null;
  connectedMarketplaces: any;
  setShowMarketplaceListingsModal: (show: boolean) => void;
  setMarketplaceModalTab: (tab: any) => void;
  setMarketplaceModalStatus: (status: any) => void;
  handleAutoFindImages: (params: any) => void;
  onEdit: (product: any) => void;
  onDelete: (id: number) => void;
  setRecipeProduct: (p: any) => void;
  setSharingProduct: (p: any) => void;
  setSelectedProduct: (p: any) => void;
  lang: string;
  t: any;
}

export const ProductTableRowComponent: React.FC<ProductTableRowProps> = ({
  product: p,
  isViewer,
  isCafe,
  isCafeRestaurant,
  isShopLp,
  isBookstore,
  showStoreName,
  currentStoreId,
  tableManager,
  selectedIds,
  toggleSelect,
  highlightedProductId,
  openActionMenuId,
  setOpenActionMenuId,
  badgePopoverProductId,
  setBadgePopoverProductId,
  handleToggleBookBadge,
  hasProductBadgeLocal,
  getProductBadgesLocal,
  getIsBestseller,
  calculateProfitMargin,
  getHepsiburadaUrl,
  isHepsiburadaPending,
  getTrendyolUrl,
  getN11Url,
  getAmazonUrl,
  getPazaramaUrl,
  connectedMarketplaces,
  setShowMarketplaceListingsModal,
  setMarketplaceModalTab,
  setMarketplaceModalStatus,
  handleAutoFindImages,
  onEdit,
  onDelete,
  setRecipeProduct,
  setSharingProduct,
  setSelectedProduct,
  lang,
  t,
}) => {
  const isRowOpen = tableManager.isRowExpanded(p.id);

  return (
    <React.Fragment>
      <tr 
        id={`product-row-${p.id}`}
        className={`transition-all duration-300 group cursor-default ${
          highlightedProductId === p.id 
            ? 'bg-orange-50/90 ring-2 ring-orange-400 ring-inset shadow-xs' 
            : selectedIds.includes(p.id) 
              ? 'bg-indigo-50/30' 
              : (Array.isArray(p.labels) && p.labels.includes('yeni_fatura_urunu') ? 'bg-amber-50/50' : 'hover:bg-slate-50/70')
        }`}
      >
        {!isViewer && (
          <td className="pl-3 py-1.5">
            <input 
              type="checkbox" 
              className="h-3.5 w-3.5 border-2 border-slate-300 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              checked={selectedIds.includes(p.id)}
              onChange={() => toggleSelect(p.id)}
            />
          </td>
        )}
        {tableManager.metadataMode === 'expandable' && (
          <td className="w-7 py-1.5 px-1 text-center">
            <button
              type="button"
              onClick={() => tableManager.toggleRowExpansion(p.id)}
              className="p-1 rounded hover:bg-slate-200/70 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
              title={isRowOpen ? (lang === 'tr' ? 'Detayları Gizle' : 'Collapse Details') : (lang === 'tr' ? 'Detayları Göster' : 'Expand Details')}
            >
              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-150 ${isRowOpen ? 'rotate-90 text-indigo-600' : ''}`} />
            </button>
          </td>
        )}
        {!isCafe && tableManager.isColumnVisible('barcode') && (
          <td className="px-2.5 py-1.5 whitespace-nowrap">
            <span className="font-mono text-[10px] bg-slate-50 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200 font-medium">
              {p.barcode || '-'}
            </span>
          </td>
        )}
        <td className="px-2.5 py-1.5">
          <div className="flex items-center gap-2.5">
            {tableManager.isColumnVisible('image') && (
              <div className="relative group/img shrink-0">
                {p.image_url ? (
                  <img 
                    src={p.image_url} 
                    alt={p.name} 
                    className="w-8 h-8 rounded-lg object-contain p-0.5 bg-white border border-slate-200 shadow-2xs"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.dataset.fallback && p.image_url?.startsWith('http')) {
                        target.dataset.fallback = '1';
                        target.src = `/api/proxy-image?url=${encodeURIComponent(p.image_url)}`;
                      } else {
                        target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23cbd5e1' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m21 8-9-4-9 4v8l9 4 9-4V8z'/%3E%3Cpath d='M3.27 6.96 12 12.01l8.73-5.05'/%3E%3Cpath d='M12 22.08V12'/%3E%3C/svg%3E";
                      }
                    }}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200">
                    <Package className="w-4 h-4 text-slate-400" />
                    {!isViewer && (
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAutoFindImages({ id: p.id });
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity rounded-lg cursor-pointer"
                        title={lang === 'tr' ? 'Resim bul' : 'Find image'}
                      >
                        <Sparkles className="h-3 w-3 text-white" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="text-xs font-semibold text-slate-900 truncate max-w-[180px] sm:max-w-[240px] md:max-w-[320px] leading-tight" title={p.name}>
                  {p.name || 'İsimsiz Ürün'}
                </div>
                {p.store_name && (showStoreName || (currentStoreId && Number(p.store_id) !== Number(currentStoreId))) && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 shrink-0" title={`Şube / Mağaza: ${p.store_name}`}>
                    <Store className="w-2.5 h-2.5 text-amber-600" />
                    {p.store_name}
                  </span>
                )}
                {p.description && (
                  <div className="group/desc relative hover:z-[60] shrink-0">
                    <div className="p-0.5 text-indigo-500 hover:bg-indigo-50 rounded cursor-help">
                      <FileText className="h-3 w-3" />
                    </div>
                    <div className="invisible group-hover/desc:visible absolute left-0 top-full mt-1 w-64 p-2.5 bg-white border border-slate-200 rounded-lg shadow-lg z-50 text-[11px] text-slate-600 leading-relaxed max-h-40 overflow-y-auto">
                      {p.description}
                    </div>
                  </div>
                )}
              </div>
              {tableManager.metadataMode === 'inline' && (
                <div className="flex overflow-x-auto whitespace-nowrap scrollbar-hide items-center gap-1 mt-0.5 max-w-[200px] sm:max-w-xs md:max-w-md w-full">
                  {(() => {
                    if (!p.updated_at) return null;
                    const date = new Date(p.updated_at);
                    const now = new Date();
                    const diffDays = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
                    if (diffDays < 3) {
                      return (
                        <span className="text-[8px] font-bold text-white bg-indigo-600 px-1 py-0.2 rounded uppercase">
                          {lang === 'tr' ? 'YENİ' : 'NEW'}
                        </span>
                      );
                    }
                    return null;
                  })()}
                  {isShopLp && connectedMarketplaces.hepsiburada && p.is_hepsiburada_active && getHepsiburadaUrl(p) && (
                    <a
                      href={getHepsiburadaUrl(p)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[8px] font-extrabold text-orange-700 bg-orange-100 hover:bg-orange-200 border border-orange-300 px-1.5 py-0.5 rounded uppercase inline-flex items-center gap-0.5 shadow-2xs transition-colors"
                      title={lang === 'tr' ? (p.hepsiburada_sku ? `Hepsiburada İlanı (${p.hepsiburada_sku})` : "Hepsiburada Canlı İlan") : "HB Live"}
                    >
                      <span className="w-1 h-1 rounded-full bg-orange-500 animate-pulse"></span>
                      HB ↗
                    </a>
                  )}
                  {isShopLp && connectedMarketplaces.hepsiburada && isHepsiburadaPending(p) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMarketplaceModalTab('hepsiburada');
                        setMarketplaceModalStatus('pending');
                        setShowMarketplaceListingsModal(true);
                      }}
                      className="text-[8px] font-extrabold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-1.5 py-0.5 rounded uppercase inline-flex items-center gap-0.5 shadow-2xs transition-colors cursor-pointer"
                      title={lang === 'tr' ? 'Hepsiburada katalog ve barkod onay incelemesinde (Tıkla ve İncele)' : 'HB Catalog Pending Review'}
                    >
                      <Clock className="w-2.5 h-2.5 text-amber-600 animate-spin" />
                      HB ONAY
                    </button>
                  )}
                  {isShopLp && connectedMarketplaces.hepsiburada && !p.is_hepsiburada_active && p.hepsiburada_last_error && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMarketplaceModalTab('hepsiburada');
                        setMarketplaceModalStatus('error');
                        setShowMarketplaceListingsModal(true);
                      }}
                      className="text-[8px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-1 py-0.2 rounded uppercase inline-flex items-center gap-0.5 cursor-pointer"
                      title={`Hepsiburada Hatası: ${p.hepsiburada_last_error}`}
                    >
                      <AlertCircle className="w-2.5 h-2.5 text-rose-600" />
                      HB Hatalı
                    </button>
                  )}
                  {isShopLp && connectedMarketplaces.trendyol && p.is_trendyol_active && (
                    <a
                      href={getTrendyolUrl(p) || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[8px] font-extrabold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-1.5 py-0.5 rounded uppercase inline-flex items-center gap-0.5 shadow-2xs transition-colors"
                      title={lang === 'tr' ? "Trendyol Canlı İlan" : "Trendyol Live"}
                    >
                      <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></span>
                      TY ↗
                    </a>
                  )}
                  {isShopLp && connectedMarketplaces.n11 && p.is_n11_active && (
                    <a
                      href={getN11Url(p) || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[8px] font-extrabold text-red-800 bg-red-100 hover:bg-red-200 border border-red-300 px-1.5 py-0.5 rounded uppercase inline-flex items-center gap-0.5 shadow-2xs transition-colors"
                      title={lang === 'tr' ? "N11 Canlı İlan" : "N11 Live"}
                    >
                      <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse"></span>
                      N11 ↗
                    </a>
                  )}
                  {isShopLp && connectedMarketplaces.amazon && p.is_amazon_active && (
                    <a
                      href={getAmazonUrl(p) || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[8px] font-extrabold text-amber-300 bg-slate-900 hover:bg-black border border-amber-500/40 px-1.5 py-0.5 rounded uppercase inline-flex items-center gap-0.5 shadow-2xs transition-colors"
                      title={lang === 'tr' ? "Amazon Canlı İlan" : "Amazon Live"}
                    >
                      <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse"></span>
                      AMZ ↗
                    </a>
                  )}
                  {isShopLp && connectedMarketplaces.pazarama && p.is_pazarama_active && (
                    <a
                      href={getPazaramaUrl(p) || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[8px] font-extrabold text-blue-800 bg-blue-100 hover:bg-blue-200 border border-blue-300 px-1.5 py-0.5 rounded uppercase inline-flex items-center gap-0.5 shadow-2xs transition-colors"
                      title={lang === 'tr' ? "Pazarama Canlı İlan" : "Pazarama Live"}
                    >
                      <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></span>
                      PZR ↗
                    </a>
                  )}
                  {p.category && (
                    <span className="text-[9px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                      {p.category}
                    </span>
                  )}
                  {p.brand && (
                    <span className="text-[9px] font-medium text-slate-400 bg-white border border-slate-200 px-1 py-0.2 rounded">
                      {p.brand}
                    </span>
                  )}
                  {isCafe && getIsBestseller(p) && (
                    <span className="text-[8px] font-bold text-white bg-orange-500 px-1.5 py-0.2 rounded uppercase inline-flex items-center gap-0.5">
                      <Flame className="h-2.5 w-2.5 fill-white text-white" />
                      {lang === 'tr' ? 'ÇOK SATAN' : 'BESTSELLER'}
                    </span>
                  )}
                  {isBookstore && (
                    <>
                      {getProductBadgesLocal(p).map((badgeKey) => {
                        const def = BOOKSTORE_BADGES.find(b => 
                          b.id.toLowerCase() === badgeKey.toLowerCase() || 
                          b.labelTr.toLowerCase() === badgeKey.toLowerCase() || 
                          b.badgeTr.toLowerCase() === badgeKey.toLowerCase()
                        );
                        if (!def) return null;
                        const IconComp = 
                          def.iconName === 'Flame' ? Flame :
                          def.iconName === 'Sparkles' ? Sparkles :
                          def.iconName === 'Star' ? Star :
                          def.iconName === 'Award' ? Award :
                          def.iconName === 'Crown' ? Crown :
                          def.iconName === 'Clock' ? Clock : Tag;
                        return (
                          <span 
                            key={`table-badge-${p.id}-${def.id}`}
                            className={`text-[8px] font-bold px-1.5 py-0.2 rounded inline-flex items-center gap-0.5 shadow-2xs ${def.badgeBgClass}`}
                            title={`${lang === 'tr' ? def.labelTr : def.labelEn} (${lang === 'tr' ? def.gridTitleTr : def.gridTitleEn})`}
                          >
                            <IconComp className="w-2.5 h-2.5 shrink-0" />
                            <span>{lang === 'tr' ? def.badgeTr : def.badgeEn}</span>
                          </span>
                        );
                      })}

                      {/* Quick Rozet/Izgara Secici Popover Trigger */}
                      <div className="relative inline-block book-badge-popover">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBadgePopoverProductId(badgePopoverProductId === p.id ? null : p.id);
                          }}
                          className={`text-[8px] font-bold px-1.5 py-0.2 rounded inline-flex items-center gap-0.5 transition-all cursor-pointer ${
                            badgePopoverProductId === p.id 
                              ? 'bg-indigo-600 text-white shadow-xs' 
                              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80'
                          }`}
                          title={lang === 'tr' ? "Kitap Vitrin Rozetlerini & Izgaralarini Degistir" : "Edit Showcase Badges"}
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{lang === 'tr' ? 'Rozet' : 'Badges'}</span>
                        </button>

                        <BookstoreBadgePopover
                          product={p}
                          isOpen={badgePopoverProductId === p.id}
                          onClose={() => setBadgePopoverProductId(null)}
                          onToggleBadge={handleToggleBookBadge}
                          hasProductBadge={hasProductBadgeLocal}
                          lang={lang}
                        />
                      </div>
                    </>
                  )}
                  {p.is_web_sale === false && (
                    <span className="text-[8px] font-bold text-rose-500 bg-rose-50 border border-rose-100 px-1 py-0.2 rounded uppercase">
                      {lang === 'tr' ? 'KAPALI' : 'OFFLINE'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </td>
        {showStoreName && tableManager.isColumnVisible('branch') && (
          <td className="px-2.5 py-1.5 whitespace-nowrap">
            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              {p.store_name}
            </span>
          </td>
        )}
        {tableManager.isColumnVisible('price') && (
          <td className="px-2.5 py-1.5 whitespace-nowrap">
            {(() => {
              let parsedVars: any[] = [];
              if (p.variants) {
                if (typeof p.variants === 'string') {
                  try { parsedVars = JSON.parse(p.variants); } catch (e) { parsedVars = []; }
                } else if (Array.isArray(p.variants)) {
                  parsedVars = p.variants;
                }
              }
              const varPrices = parsedVars
                .map((v: any) => parseFloat(String(v.price || '').replace(',', '.')))
                .filter((pr: number) => !isNaN(pr) && pr > 0);

              if (varPrices.length > 0) {
                const minP = Math.min(...varPrices);
                const maxP = Math.max(...varPrices);
                return (
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900 tabular-nums">
                      {minP === maxP
                        ? minP.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : `${minP.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - ${maxP.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      }
                      <span className="text-[10px] text-slate-400 font-medium ml-1">{(p.currency || 'TRY').substring(0, 3)}</span>
                    </span>
                    <span className="text-[8px] font-semibold text-indigo-600">
                      {lang === 'tr' ? `${parsedVars.length} Varyant` : `${parsedVars.length} Vars`}
                    </span>
                  </div>
                );
              }
              return (
                <span className="text-xs font-bold text-slate-900 tabular-nums">
                  {Number(p.price).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-slate-400 font-medium ml-0.5">{(p.currency || 'TRY').substring(0, 3)}</span>
                </span>
              );
            })()}
          </td>
        )}
        {tableManager.isColumnVisible('cost') && (
          <td className="px-2.5 py-1.5 whitespace-nowrap">
            {p.cost_price > 0 ? (
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-600 tabular-nums">
                  {Number(p.cost_price).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-slate-400 ml-0.5">{(p.cost_currency || 'TRY').substring(0, 3)}</span>
                </span>
                {(() => {
                  const profit = calculateProfitMargin(p);
                  if (!profit) return null;
                  const isLoss = profit.margin < 0;
                  return (
                    <span className={`text-[8px] font-bold uppercase ${isLoss ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {isLoss ? (lang === 'tr' ? 'DÜŞÜK' : 'LOW') : `%${profit.margin.toFixed(0)} KÂR`}
                    </span>
                  );
                })()}
              </div>
            ) : (
              <span className="text-[10px] text-slate-300">-</span>
            )}
          </td>
        )}
        {tableManager.isColumnVisible('stock') && (
          <td className="px-2.5 py-1.5 whitespace-nowrap">
            {p.product_type === 'service' ? (
              <span className="text-[8px] font-medium text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded uppercase">{lang === 'tr' ? 'HİZMET' : 'SRV'}</span>
            ) : (() => {
              let vars: any[] = [];
              if (p.variants) {
                if (typeof p.variants === 'string') {
                  try { vars = JSON.parse(p.variants); } catch (e) { vars = []; }
                } else if (Array.isArray(p.variants)) {
                  vars = p.variants;
                }
              }
              const hasVariants = vars.length > 0;
              const effectiveStock = hasVariants 
                ? vars.reduce((sum, v) => sum + (Number(v.stock_quantity) || Number(v.stock) || 0), 0)
                : Number(p.stock_quantity) || 0;
              const isLowStock = effectiveStock <= Number(p.min_stock_level || 0);

              return (
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold tabular-nums ${isLowStock ? 'text-rose-600' : 'text-slate-800'}`}>
                    {Math.floor(effectiveStock)}
                  </span>
                  {isLowStock && (
                    <span className="px-1 py-0.2 bg-rose-50 text-[8px] font-bold text-rose-600 border border-rose-100 rounded uppercase">
                      !
                    </span>
                  )}
                </div>
              );
            })()}
          </td>
        )}
        {tableManager.isColumnVisible('actions') && (
          <td className="px-2.5 py-1.5 text-right whitespace-nowrap relative">
            {!isViewer && (
              <div className="flex items-center justify-end gap-1">
                <button 
                  type="button"
                  onClick={() => onEdit(p)}
                  className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all border border-slate-200/60 bg-slate-50/50 hover:border-amber-200 cursor-pointer"
                  title={t.edit}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>

                {/* Collapsible Actions Dropdown Menu Trigger */}
                <div className="relative inline-block text-left">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenActionMenuId(openActionMenuId === p.id ? null : p.id);
                    }}
                    className={`action-menu-trigger p-1.5 rounded-lg transition-all flex items-center gap-1 border cursor-pointer ${
                      openActionMenuId === p.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 bg-white border-slate-200 shadow-2xs'
                    }`}
                    title={lang === 'tr' ? "Tüm İşlemler Menüsü" : "All Actions Menu"}
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold hidden sm:inline-block pr-0.5">{lang === 'tr' ? 'İşlem' : 'More'}</span>
                  </button>

                  {/* Dropdown Popup Menu */}
                  {openActionMenuId === p.id && (
                    <div 
                      className="action-menu-dropdown absolute right-0 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-100 top-full mt-1.5 origin-top-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 truncate max-w-[140px]">
                          {p.name || (lang === 'tr' ? 'Ürün İşlemleri' : 'Product Actions')}
                        </span>
                      </div>

                      <div className="py-1">
                        {isCafeRestaurant && (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionMenuId(null);
                              setRecipeProduct(p);
                            }}
                            className="w-full px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>{lang === 'tr' ? "Ürün Reçetesi" : "Product Recipe"}</span>
                          </button>
                        )}

                        {!isCafeRestaurant && (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionMenuId(null);
                              setSharingProduct(p);
                            }}
                            className="w-full px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>{lang === 'tr' ? "Sosyal Medya Afişi" : "Social Media Poster"}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setOpenActionMenuId(null);
                            setSelectedProduct(p);
                          }}
                          className="w-full px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <History className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{t.movementHistory}</span>
                        </button>

                        <div className="my-1 border-t border-slate-100" />

                        <button
                          type="button"
                          onClick={() => {
                            setOpenActionMenuId(null);
                            if (window.confirm(lang === 'tr' ? "Bu ürünü silmek istediğinize emin misiniz?" : "Are you sure you want to delete this product?")) {
                              onDelete(p.id);
                            }
                          }}
                          className="w-full px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{t.delete}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </td>
        )}
      </tr>

      {/* Nested / Expandable Sub-Row for Grouped Auxiliary Metadata */}
      {(tableManager.metadataMode === 'nested' || (tableManager.metadataMode === 'expandable' && isRowOpen)) && (
        <tr className="bg-slate-50/80 border-b border-slate-100">
          <td colSpan={10} className="px-3 py-1.5 pl-8 sm:pl-10">
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              {p.category && (
                <span className="font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs flex items-center gap-1">
                  <span className="text-slate-400 font-normal">{lang === 'tr' ? 'Kategori:' : 'Category:'}</span>
                  {p.category}
                  {p.sub_category && <span className="text-slate-400">/ {p.sub_category}</span>}
                </span>
              )}
              {p.brand && (
                <span className="font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs flex items-center gap-1">
                  <span className="text-slate-400 font-normal">{lang === 'tr' ? 'Marka:' : 'Brand:'}</span>
                  {p.brand}
                </span>
              )}
              {p.cost_price > 0 && (() => {
                const profit = calculateProfitMargin(p);
                if (!profit) return null;
                return (
                  <span className={`font-bold px-2 py-0.5 rounded border shadow-2xs ${profit.margin < 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                    %{profit.margin.toFixed(1)} {lang === 'tr' ? 'Kâr Marjı' : 'Margin'}
                  </span>
                );
              })()}
              {isShopLp && connectedMarketplaces.hasAnyConnected && (
                <div className="flex overflow-x-auto whitespace-nowrap scrollbar-hide items-center gap-1.5 w-full pb-0.5 max-w-[85vw] sm:max-w-[400px]">
                  {connectedMarketplaces.hepsiburada && p.is_hepsiburada_active && getHepsiburadaUrl(p) && (
                    <a
                      href={getHepsiburadaUrl(p)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-extrabold text-orange-700 bg-orange-100 hover:bg-orange-200 border border-orange-300 px-1.5 py-0.5 rounded uppercase inline-flex items-center gap-1 shadow-2xs transition-colors"
                      title={lang === 'tr' ? (p.hepsiburada_sku ? `Hepsiburada İlanı (${p.hepsiburada_sku})` : "Hepsiburada Canlı İlan") : "HB Live"}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                      HB ↗
                    </a>
                  )}
                  {connectedMarketplaces.hepsiburada && isHepsiburadaPending(p) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMarketplaceModalTab('hepsiburada');
                        setMarketplaceModalStatus('pending');
                        setShowMarketplaceListingsModal(true);
                      }}
                      className="font-extrabold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-1.5 py-0.5 rounded uppercase inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      title={lang === 'tr' ? 'Hepsiburada katalog ve barkod onay incelemesinde' : 'HB Catalog Pending Review'}
                    >
                      <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                      HB ONAY
                    </button>
                  )}
                  {connectedMarketplaces.trendyol && p.is_trendyol_active && (
                    <a
                      href={getTrendyolUrl(p) || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-extrabold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-1.5 py-0.5 rounded uppercase inline-flex items-center gap-1 shadow-2xs transition-colors"
                      title={lang === 'tr' ? "Trendyol Canlı İlan" : "Trendyol Live"}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      TY ↗
                    </a>
                  )}
                  {connectedMarketplaces.n11 && p.is_n11_active && (
                    <a
                      href={getN11Url(p) || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-extrabold text-red-800 bg-red-100 hover:bg-red-200 border border-red-300 px-1.5 py-0.5 rounded uppercase inline-flex items-center gap-1 shadow-2xs transition-colors"
                      title={lang === 'tr' ? "N11 Canlı İlan" : "N11 Live"}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                      N11 ↗
                    </a>
                  )}
                  {connectedMarketplaces.amazon && p.is_amazon_active && (
                    <a
                      href={getAmazonUrl(p) || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-extrabold text-amber-300 bg-slate-900 hover:bg-black border border-amber-500/40 px-1.5 py-0.5 rounded uppercase inline-flex items-center gap-1 shadow-2xs transition-colors"
                      title={lang === 'tr' ? "Amazon Canlı İlan" : "Amazon Live"}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                      AMZ ↗
                    </a>
                  )}
                  {connectedMarketplaces.pazarama && p.is_pazarama_active && (
                    <a
                      href={getPazaramaUrl(p) || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-extrabold text-blue-800 bg-blue-100 hover:bg-blue-200 border border-blue-300 px-1.5 py-0.5 rounded uppercase inline-flex items-center gap-1 shadow-2xs transition-colors"
                      title={lang === 'tr' ? "Pazarama Canlı İlan" : "Pazarama Live"}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                      PZR ↗
                    </a>
                  )}
                </div>
              )}
              {p.description && (
                <span className="text-slate-500 italic truncate max-w-xs sm:max-w-md" title={p.description}>
                  &ldquo;{p.description}&rdquo;
                </span>
              )}
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
};

export const ProductTableRow = React.memo(ProductTableRowComponent, (prevProps, nextProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.updated_at === nextProps.product.updated_at &&
    prevProps.product.stock_quantity === nextProps.product.stock_quantity &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.is_hepsiburada_active === nextProps.product.is_hepsiburada_active &&
    prevProps.product.is_trendyol_active === nextProps.product.is_trendyol_active &&
    prevProps.product.is_n11_active === nextProps.product.is_n11_active &&
    prevProps.product.is_amazon_active === nextProps.product.is_amazon_active &&
    prevProps.product.is_pazarama_active === nextProps.product.is_pazarama_active &&
    prevProps.isViewer === nextProps.isViewer &&
    prevProps.isCafe === nextProps.isCafe &&
    prevProps.isCafeRestaurant === nextProps.isCafeRestaurant &&
    prevProps.isShopLp === nextProps.isShopLp &&
    prevProps.isBookstore === nextProps.isBookstore &&
    prevProps.showStoreName === nextProps.showStoreName &&
    prevProps.currentStoreId === nextProps.currentStoreId &&
    prevProps.lang === nextProps.lang &&
    prevProps.selectedIds.includes(prevProps.product.id) === nextProps.selectedIds.includes(nextProps.product.id) &&
    (prevProps.openActionMenuId === prevProps.product.id) === (nextProps.openActionMenuId === nextProps.product.id) &&
    (prevProps.badgePopoverProductId === prevProps.product.id) === (nextProps.badgePopoverProductId === nextProps.product.id) &&
    (prevProps.highlightedProductId === prevProps.product.id) === (nextProps.highlightedProductId === nextProps.product.id)
  );
});
