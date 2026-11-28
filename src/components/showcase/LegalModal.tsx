import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ShieldCheck, Truck, FileText, Building2, Printer, Phone, Mail, MapPin } from "lucide-react";
import {
  LegalDocType,
  BuyerCheckoutContext,
  resolveLegalDocumentContent,
} from "../../utils/shopLegalGenerator";
import { IyzicoPaymentBadges } from "./IyzicoPaymentBadges";

interface LegalModalProps {
  isOpen: LegalDocType | null;
  onClose: () => void;
  lang: string;
  store?: any;
  legalPages?: any;
  buyerContext?: BuyerCheckoutContext;
  onSwitchTab?: (tab: LegalDocType) => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  lang,
  store,
  legalPages,
  buyerContext,
  onSwitchTab,
}) => {
  const isTr = lang === "tr";
  const normalizedInitial: LegalDocType =
    isOpen === "kvkk" ? "privacy" : (isOpen || "privacy");
  const [activeTab, setActiveTab] = useState<LegalDocType>(normalizedInitial);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(isOpen === "kvkk" ? "privacy" : isOpen);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const mergedStore = store
    ? {
        ...store,
        legal_pages: legalPages || store.legal_pages || store.branding?.legal_pages,
      }
    : { legal_pages: legalPages };

  const { title, content, profile } = resolveLegalDocumentContent(
    activeTab,
    mergedStore,
    lang,
    buyerContext
  );

  const tabs: Array<{ id: LegalDocType; label: string; icon: any }> = [
    {
      id: "privacy",
      label: isTr ? "Gizlilik Politikası" : "Privacy Policy",
      icon: ShieldCheck,
    },
    {
      id: "delivery_return",
      label: isTr ? "Teslimat ve İade" : "Delivery & Return",
      icon: Truck,
    },
    {
      id: "sales",
      label: isTr ? "Mesafeli Satış Sözleşmesi" : "Distance Sales Agreement",
      icon: FileText,
    },
    {
      id: "pre_info",
      label: isTr ? "Ön Bilgilendirme Formu" : "Pre-Info Form",
      icon: Building2,
    },
  ];

  const handleTabChange = (tab: LegalDocType) => {
    setActiveTab(tab);
    if (onSwitchTab) onSwitchTab(tab);
  };

  const handlePrint = () => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    const escapeHtml = (s: string) =>
      String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    doc.open();
    doc.write(`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)} - ${escapeHtml(profile.legalName)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; padding: 24px; line-height: 1.55; font-size: 12px; }
    h1 { font-size: 18px; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
    .meta { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 11px; }
    .body { white-space: pre-wrap; font-size: 12px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="meta">
    <strong>${escapeHtml(profile.legalName)}</strong><br/>
    Adres: ${escapeHtml(profile.address)}<br/>
    Tel: ${escapeHtml(profile.phone)} | E-Posta: ${escapeHtml(profile.email)}
    ${profile.taxOffice || profile.taxNumber ? `<br/>Vergi Dairesi / No: ${escapeHtml([profile.taxOffice, profile.taxNumber].filter(Boolean).join(" / "))}` : ""}
    ${profile.mersisNo ? ` | MERSİS: ${escapeHtml(profile.mersisNo)}` : ""}
  </div>
  <div class="body">${escapeHtml(content)}</div>
</body>
</html>`);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 1000);
    }, 250);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 relative z-10 overflow-hidden max-h-[88vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <h2 className="text-sm sm:text-base font-black text-white truncate">
                    {title}
                  </h2>
                </div>
                <p className="text-[11px] text-slate-300 truncate mt-0.5">
                  {profile.legalName}
                  {profile.taxOffice || profile.taxNumber
                    ? ` · ${[profile.taxOffice ? `${profile.taxOffice} V.D.` : "", profile.taxNumber].filter(Boolean).join(" / ")}`
                    : ""}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title={isTr ? "Yazdır / PDF Kaydet" : "Print / Save PDF"}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isTr ? "Yazdır / PDF" : "Print"}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Legal Tabs Switcher */}
            <div className="px-4 sm:px-6 py-2 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive =
                  activeTab === tab.id || (activeTab === "kvkk" && tab.id === "privacy");
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Official Company Summary Banner */}
            <div className="px-4 sm:px-6 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] shrink-0">
              <div className="flex items-start gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[9.5px] font-bold uppercase text-slate-400 block">
                    {isTr ? "Satıcı / Resmi Ünvan" : "Official Seller Title"}
                  </span>
                  <strong className="text-slate-900 dark:text-white font-bold truncate block">
                    {profile.legalName}
                  </strong>
                  {(profile.taxOffice || profile.taxNumber || profile.mersisNo) && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                      {[
                        profile.taxOffice ? `${profile.taxOffice} V.D.` : "",
                        profile.taxNumber ? `VKN/TCKN: ${profile.taxNumber}` : "",
                        profile.mersisNo ? `MERSİS: ${profile.mersisNo}` : "",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[9.5px] font-bold uppercase text-slate-400 block">
                    {isTr ? "Tebligat & İade Adresi" : "Registered & Return Address"}
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium line-clamp-2">
                    {profile.address}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[9.5px] font-bold uppercase text-slate-400 block">
                    {isTr ? "Resmi İletişim" : "Official Contact"}
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold block truncate">
                    {profile.phone}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] flex items-center gap-1 truncate">
                    <Mail className="w-2.5 h-2.5 shrink-0" />
                    {profile.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Legal Text Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white dark:bg-slate-900">
              <div className="whitespace-pre-wrap text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed font-medium select-text">
                {content}
              </div>
            </div>

            {/* Footer with iyzico / Visa / MasterCard Compliance Badges */}
            <div className="px-4 sm:px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <IyzicoPaymentBadges variant="compact" lang={lang} />
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer ml-auto"
              >
                {isTr ? "Okudum, Kapat" : "Close"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
