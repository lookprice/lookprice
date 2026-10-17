import React from "react";
import { X, ShieldAlert, PhoneOff, CheckCircle2, Copy } from "lucide-react";

interface DemoWhatsAppInterceptModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName?: string;
  recipientPhone?: string;
  message?: string;
  listingTitle?: string;
}

export const DemoWhatsAppInterceptModal: React.FC<DemoWhatsAppInterceptModalProps> = ({
  isOpen,
  onClose,
  recipientName = "Demo Portföy Danışmanı",
  recipientPhone = "+90 (500) 000 00 00",
  message = "Merhaba, ilanınız hakkında bilgi almak istiyorum.",
  listingTitle
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50">
                  Demo Simülasyon Koruması
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                Canlı WhatsApp Bağlantısı Engellendi
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Security Text */}
        <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/40 rounded-2xl border border-amber-200/80 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
            <PhoneOff className="w-4 h-4 shrink-0 text-amber-600" />
            Neden Canlı WhatsApp Açılmadı?
          </p>
          <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 font-medium">
            Bu vitrin potansiyel müşterilerin sistemi inceleyebilmesi için hazırlanmış <strong>resmi restateLP demo hesabıdır</strong>. Bilinmeyen kişi veya kurumlarla yanlışlıkla irtibata girilmesini önlemek amacıyla canlı WhatsApp yönlendirmesi engellenmiştir.
          </p>
        </div>

        {/* Simulated Message Card (WhatsApp UI Look) */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Simüle Edilen WhatsApp Mesajı
          </label>
          <div className="bg-[#EFEAE2] dark:bg-slate-950/70 p-3.5 rounded-2xl border border-emerald-500/20 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 border-b border-black/5 dark:border-white/5 pb-2">
              <span className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {recipientName}
              </span>
              <span className="font-mono text-[10px] bg-white/70 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-black/5">
                {recipientPhone}
              </span>
            </div>

            {listingTitle && (
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
                Portföy: {listingTitle}
              </p>
            )}

            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-black/5 text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-medium">
              {message}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleCopy}
                className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Mesaj Kopyalandı" : "Metni Kopyala"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          type="button"
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg active:scale-[0.99]"
        >
          Tamam, Anladım
        </button>
      </div>
    </div>
  );
};
