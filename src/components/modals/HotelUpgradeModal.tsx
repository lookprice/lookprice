import React from "react";
import { Building2, Sparkles, CheckCircle2, MessageCircle, X, ArrowUpRight, ShieldCheck } from "lucide-react";

interface HotelUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: string;
  storeName?: string;
}

export const HotelUpgradeModal: React.FC<HotelUpgradeModalProps> = ({
  isOpen,
  onClose,
  lang = "tr",
  storeName = ""
}) => {
  if (!isOpen) return null;

  const isTr = lang === "tr";
  const whatsappUrl = `https://wa.me/905488448888?text=${encodeURIComponent(
    isTr 
      ? `Merhaba LookPrice Destek Ekibi, "${storeName || 'İşletmemiz'}" için Otel & Konaklama Konsept Paketi ve üst pakete geçiş hakkında bilgi ve aktivasyon talep ediyorum.`
      : `Hello LookPrice Support, I would like to get information and activate the Hotel & Accommodation Concept Package for "${storeName || 'Our Business'}".`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-amber-500/30 shadow-2xl max-w-lg w-full overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Top Gradient */}
        <div className="h-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-amber-400 shrink-0">
              <Building2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                {isTr ? "Üst Paket & Premium Lisans" : "Package Upgrade Required"}
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {isTr ? "Otel & Konaklama Konsept Paketi" : "Hotel & Accommodation Concept"}
              </h3>
            </div>
          </div>

          {/* Primary Alert Message */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-sm font-semibold leading-relaxed">
            {isTr 
              ? "Bu özellik için bir üst pakete geçmeli veya Otel Konsept Paketi'ne yükseltmelisiniz! Lütfen LookPrice ile iletişime geçin."
              : "To enable this feature, you need to upgrade to a higher tier or the Hotel Concept Package! Please contact LookPrice."}
          </div>

          {/* Included Features */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isTr ? "Paket İçeriğindeki Gelişmiş Özellikler" : "Included Advanced Features"}
            </span>
            <div className="space-y-2">
              {[
                isTr ? "Hızlı POS üzerinden masa adisyonunu doğrudan otele / odaya aktarma" : "Transfer table bills directly to hotel rooms via Fast POS",
                isTr ? "Oda rezervasyonu, doluluk, folio ve misafir kartı yönetimi" : "Room reservations, occupancy, folios, and guest management",
                isTr ? "Oda Kahvaltı (BB), Yarım Pansiyon ve Her Şey Dahil tarifeleri" : "Bed & Breakfast, Half Board, and All-Inclusive pricing boards",
                isTr ? "Oda hesabı termal adisyon ve misafir imza fişi yazdırma" : "Room account thermal receipts and guest signature slips"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2.5 pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20 active:scale-98"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{isTr ? "WhatsApp ile LookPrice'a Ulaşın" : "Contact LookPrice on WhatsApp"}</span>
              <ArrowUpRight className="w-4 h-4 opacity-70" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-xs transition-all cursor-pointer text-center"
            >
              {isTr ? "Vazgeç / Kapat" : "Cancel"}
            </button>
          </div>

          {/* Trust Footer */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>LookPrice HorecaLP Ecosystem Guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
};
