import React from "react";
import { 
  ArrowLeft, 
  ShoppingCart, 
  Coffee, 
  Tag, 
  QrCode, 
  Calendar, 
  Printer, 
  Flame,
  Calculator,
  PauseCircle,
  Zap
} from "lucide-react";

export interface PosHeaderToolbarProps {
  lang: string;
  isCafeRestaurant: boolean;
  selectedTable: string | null;
  activeSaleId: number | null;
  setSelectedTable: (table: string | null) => void;
  setActiveSaleId: (id: number | null) => void;
  setCart: (cart: any[]) => void;
  fetchPendingSales: () => void;
  tableNicknames: Record<string, string>;
  setActiveNicknameModal: (table: string | null) => void;
  setActiveNicknameInput: (input: string) => void;
  branding: any;
  showCafeTools: boolean;
  setShowCafeTools: (show: boolean) => void;
  setShowQrModal: (show: boolean) => void;
  setShowReportModal: (show: boolean) => void;
  setPrinterDiagStep: (step: any) => void;
  setShowPrinterDiagnosticModal: (show: boolean) => void;
  setShowHappyHourModal: (show: boolean) => void;
  isHappyHourActive: boolean;
  bridgeDetected: boolean | null;
  bridgeHealth?: {
    online?: boolean;
    pcMode?: boolean;
    paperOk?: boolean;
    transport?: string;
    simulated?: boolean;
  } | null;
  parkedCount?: number;
  onOpenParkedCarts?: () => void;
  onOpenQuickKeysManager?: () => void;
  touchNumpadEnabled?: boolean;
  onToggleTouchNumpad?: () => void;
}

export const PosHeaderToolbar: React.FC<PosHeaderToolbarProps> = ({
  lang,
  isCafeRestaurant,
  selectedTable,
  activeSaleId,
  setSelectedTable,
  setActiveSaleId,
  setCart,
  fetchPendingSales,
  tableNicknames,
  setActiveNicknameModal,
  setActiveNicknameInput,
  branding,
  showCafeTools,
  setShowCafeTools,
  setShowQrModal,
  setShowReportModal,
  setPrinterDiagStep,
  setShowPrinterDiagnosticModal,
  setShowHappyHourModal,
  isHappyHourActive,
  bridgeDetected,
  bridgeHealth,
  parkedCount = 0,
  onOpenParkedCarts,
  onOpenQuickKeysManager,
  touchNumpadEnabled = true,
  onToggleTouchNumpad
}) => {
  return (
    <div className="bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2 shrink-0">
      <div className="flex items-center gap-2.5">
        {isCafeRestaurant && selectedTable !== null && (
          <button
            onClick={() => {
              setSelectedTable(null);
              setActiveSaleId(null);
              setCart([]);
              fetchPendingSales();
            }}
            className="p-1 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-all flex items-center justify-center border border-slate-200 shadow-2xs cursor-pointer"
            title={lang === 'tr' ? "Masalara Geri Dön" : "Back to Tables"}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div className="h-7 w-7 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0">
          {isCafeRestaurant && selectedTable !== null ? (
            <Coffee className="h-3.5 w-3.5 text-rose-500" />
          ) : (
            <ShoppingCart className="h-3.5 w-3.5" />
          )}
        </div>
        <div>
          <h2 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-tight flex items-center gap-2 flex-wrap">
            {isCafeRestaurant && selectedTable !== null ? (
              <>
                <span>{selectedTable} {activeSaleId !== null ? `(${lang === 'tr' ? 'Açık Adisyon' : 'Open Bill'})` : `(${lang === 'tr' ? 'Yeni Sipariş' : 'New Order'})`}</span>
                {(() => {
                  const cleanNum = selectedTable.replace(/^Masa\s+/i, '').trim();
                  const nick = tableNicknames[cleanNum] || tableNicknames[selectedTable];
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveNicknameModal(selectedTable);
                        setActiveNicknameInput(nick || '');
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer ${
                        nick 
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 shadow-2xs' 
                          : 'bg-slate-100 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200'
                      }`}
                      title={lang === 'tr' ? "Masa Takma Adı / Müşteri Notu Düzenle" : "Edit Table Nickname / Note"}
                    >
                      <Tag className="h-2.5 w-2.5 text-amber-600" />
                      <span>{nick ? nick : (lang === 'tr' ? '+ Not / İsim Ekle' : '+ Add Name')}</span>
                    </button>
                  );
                })()}
              </>
            ) : (
              branding?.store_name || branding?.name || (lang === 'tr' ? "Seçkin Mağaza" : "Premium Store")
            )}
          </h2>
          <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
            {isCafeRestaurant && selectedTable !== null ? (
              <span>{branding?.store_name || branding?.name || (lang === 'tr' ? "Seçkin Restoran" : "Premium Restaurant")}</span>
            ) : (
              lang === 'tr' ? "Hızlı Satış & POS Terminali" : "Quick Sales & POS Terminal"
            )}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 flex-wrap">
        {/* Parked / Held Customer Carts Badge */}
        {onOpenParkedCarts && (
          <button
            type="button"
            onClick={onOpenParkedCarts}
            className={`p-1.5 rounded-lg border text-xs font-black transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1 ${
              parkedCount > 0
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title={lang === 'tr' ? "Askıya alınan müşteri sepetlerini aç" : "Open parked carts"}
          >
            <PauseCircle className={`h-3.5 w-3.5 ${parkedCount > 0 ? 'text-amber-700' : 'text-slate-500'}`} />
            <span>{lang === 'tr' ? 'Askıda' : 'Parked'}</span>
            {parkedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-600 text-white text-[10px] font-black leading-tight">
                {parkedCount}
              </span>
            )}
          </button>
        )}

        {/* Quick Keys Manager Button */}
        {onOpenQuickKeysManager && (
          <button
            type="button"
            onClick={onOpenQuickKeysManager}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1"
            title={lang === 'tr' ? "Barkodsuz Hızlı Tuşlar & Yerleşim" : "Quick Keys & Layout"}
          >
            <Zap className="h-3.5 w-3.5 text-amber-600" />
            <span className="hidden sm:inline">{lang === 'tr' ? 'Hızlı Tuşlar' : 'Quick Keys'}</span>
          </button>
        )}

        {/* Touch Numpad Toggle */}
        {onToggleTouchNumpad && (
          <button
            type="button"
            onClick={onToggleTouchNumpad}
            className={`p-1.5 rounded-lg border text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1 ${
              touchNumpadEnabled
                ? 'bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-300'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'
            }`}
            title={
              lang === 'tr'
                ? "Dokunmatik Numpad (Fiyat/Adet/Tutar alanlarına tıklandığında Windows klavye yerine ekran içi Numpad açar)"
                : "Toggle Touch Numpad"
            }
          >
            <Calculator className={`h-3.5 w-3.5 ${touchNumpadEnabled ? 'text-sky-700' : 'text-slate-400'}`} />
            <span className="hidden md:inline">Numpad</span>
          </button>
        )}

        {/* Actions Menu for both Cafe and Retail */}
        <div className="flex items-center gap-2">
          {/* Always visible "Günlük Kasa Raporu" button */}
          <button
            onClick={() => setShowReportModal(true)}
            className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg border border-indigo-500 text-xs font-black transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5"
            title={lang === 'tr' ? "Günlük Kasa Raporu (Z-Raporu)" : "Daily Cash Report (Z-Report)"}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>{lang === 'tr' ? "Günlük Kasa Raporu" : "Daily Cash Report"}</span>
          </button>

          <button
            onClick={() => setShowCafeTools(!showCafeTools)}
            className={`p-1.5 rounded-lg border text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center justify-center ${
              showCafeTools ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title={lang === 'tr' ? "Diğer İşlemler" : "Other Actions"}
          >
            <div className="flex items-center gap-1">
              <span className="px-1">{lang === 'tr' ? "Diğer" : "More"}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showCafeTools ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </button>

          {showCafeTools && (
            <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-200">
              {isCafeRestaurant && (
                <button
                  onClick={() => setShowQrModal(true)}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-all flex items-center justify-center shadow-2xs active:scale-95 cursor-pointer"
                  title={lang === 'tr' ? "Masa QR & Barkod" : "Table QR & Barcodes"}
                >
                  <QrCode className="h-4 w-4" />
                </button>
              )}

              <button
                onClick={() => setShowReportModal(true)}
                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-all flex items-center justify-center shadow-2xs active:scale-95 cursor-pointer"
                title={lang === 'tr' ? "Gün Sonu Raporu" : "End of Day Report"}
              >
                <Calendar className="h-4 w-4" />
              </button>

              <button
                onClick={() => {
                  setPrinterDiagStep('idle');
                  setShowPrinterDiagnosticModal(true);
                }}
                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg transition-all flex items-center justify-center shadow-2xs active:scale-95 cursor-pointer"
                title={lang === 'tr' ? "Yazıcı & ÖKC Tanısı" : "Printer & OKC Diagnosis"}
              >
                <Printer className="h-4 w-4" />
              </button>

              {isCafeRestaurant && (
                <button
                  onClick={() => setShowHappyHourModal(true)}
                  className={`p-1.5 rounded-lg transition-all flex items-center justify-center shadow-2xs active:scale-95 cursor-pointer border ${
                    isHappyHourActive
                      ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-600 animate-pulse'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                  }`}
                  title={lang === 'tr' ? "Happy Hour" : "Happy Hour"}
                >
                  <Flame className={`h-4 w-4 ${isHappyHourActive ? 'text-white' : ''}`} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bridge / OKC Status Indicator */}
        {(branding?.pos_bridge_enabled || branding?.fiscal_active) && (() => {
          const isPaperOut = bridgeHealth?.paperOk === false;
          const isSim = Boolean(branding?.pos_bridge_settings?.allow_simulation && !bridgeDetected && !bridgeHealth?.online);
          const isReady = Boolean(bridgeDetected || bridgeHealth?.online) && !isPaperOut;
          const cardMode = branding?.pos_bridge_settings?.card_okc_mode ||
            (branding?.pos_bridge_settings?.fiscal_on_card === false ? 'no_fiscal_on_card' : 'integrated_eft_pos');
          return (
            <button
              type="button"
              onClick={() => {
                setPrinterDiagStep('idle');
                setShowPrinterDiagnosticModal(true);
              }}
              className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                isPaperOut
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : isReady
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : isSim
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
              title={lang === 'tr' ? "ÖKC & Köprü Tanı Ekranını Aç" : "Open OKC & Bridge Diagnostics"}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${
                isPaperOut ? 'bg-amber-500 animate-ping' : isReady ? 'bg-emerald-500 animate-pulse' : isSim ? 'bg-indigo-500' : 'bg-rose-500'
              }`}></span>
              {isPaperOut
                ? (lang === 'tr' ? 'ÖKC Kağıt Bitti' : 'Paper Out')
                : isReady
                ? (lang === 'tr' ? 'ÖKC Köprüsü Hazır' : 'OKC Ready')
                : isSim
                ? (lang === 'tr' ? 'ÖKC Simülasyon' : 'OKC Sim')
                : (lang === 'tr' ? 'Köprü Yok' : 'Disconnected')}
              {cardMode === 'fiscal_only_external_card' && (
                <span className="px-1 py-0.2 bg-sky-100 text-sky-900 border border-sky-300 rounded text-[9px] font-black">
                  Sadece Yazarkasa
                </span>
              )}
              {cardMode === 'no_fiscal_on_card' && (
                <span className="px-1 py-0.2 bg-slate-200 text-slate-900 border border-slate-300 rounded text-[9px] font-black">
                  Kartta ÖKC Yok
                </span>
              )}
            </button>
          );
        })()}
      </div>
    </div>
  );
};
