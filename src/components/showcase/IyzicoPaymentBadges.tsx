import React from "react";
import { ShieldCheck, Lock } from "lucide-react";

interface IyzicoPaymentBadgesProps {
  variant?: "footer" | "checkout" | "compact";
  lang?: string;
  className?: string;
}

/**
 * Official-grade vector payment logos required by iyzico compliance audit:
 * - "iyzico ile Öde" official badge
 * - Visa official vector mark
 * - MasterCard official interlocking circles + wordmark
 * - Troy vector mark
 * - 3D Secure & 256-Bit SSL assurance
 */
export const IyzicoPaymentBadges: React.FC<IyzicoPaymentBadgesProps> = ({
  variant = "footer",
  lang = "tr",
  className = "",
}) => {
  const isTr = lang === "tr";

  const iyzicoBadge = (
    <div
      className={`inline-flex items-center gap-2 rounded-lg font-sans select-none shrink-0 ${
        variant === "compact"
          ? "px-2.5 py-1 bg-[#1E64FF] text-white shadow-2xs"
          : "px-3 py-1.5 bg-[#1E64FF] text-white shadow-sm border border-[#3b78ff]"
      }`}
      title={isTr ? "iyzico ile Öde - BDDK Lisanslı Güvenli Ödeme" : "Pay with iyzico"}
      aria-label="iyzico ile Öde"
    >
      {/* iyzico official geometric icon mark */}
      <svg className={variant === "compact" ? "w-4 h-4" : "w-5 h-5"} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="28" height="28" rx="6" fill="white" />
        <circle cx="9.5" cy="8.5" r="2.1" fill="#1E64FF" />
        <rect x="7.6" y="12.2" width="3.8" height="9.2" rx="1.9" fill="#1E64FF" />
        <path
          d="M14.2 12.2H17.8L19.8 16.9L21.6 12.2H25L20.4 22.8C19.6 24.6 18.4 25.3 16.5 25.3H15.2V22.4H16.2C17.1 22.4 17.6 22 18 21L14.2 12.2Z"
          fill="#1E64FF"
        />
      </svg>
      <div className="flex items-baseline gap-1 leading-none">
        <span className={`${variant === "compact" ? "text-xs" : "text-sm"} font-black tracking-tight text-white`}>
          iyzico
        </span>
        <span className={`${variant === "compact" ? "text-[10px]" : "text-xs"} font-bold text-white/95`}>
          {isTr ? "ile Öde" : "Pay"}
        </span>
      </div>
    </div>
  );

  const visaBadge = (
    <div
      className={`inline-flex items-center justify-center bg-white rounded-lg border border-slate-200/90 shrink-0 ${
        variant === "compact" ? "h-6 px-2" : "h-8 px-3 shadow-2xs"
      }`}
      title="Visa"
      aria-label="Visa"
    >
      <svg className={variant === "compact" ? "h-3 w-auto" : "h-3.5 w-auto"} viewBox="0 0 64 21" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M25.3 0.5L21.1 20.5H16L20.2 0.5H25.3ZM46.6 13.4L49.3 6L50.8 13.4H46.6ZM52.3 20.5H57L52.9 0.5H48.6C47.6 0.5 46.8 1.1 46.4 2L38.9 20.5H44.2L45.3 17.5H51.8L52.3 20.5ZM39.1 14C39.1 8.7 31.8 8.4 31.9 6C31.9 5.3 32.6 4.5 34.1 4.3C35.8 4.1 38.2 4.6 39.5 5.2L40.5 0.9C39.1 0.4 37.3 0 35.1 0C30.1 0 26.5 2.7 26.5 6.5C26.5 9.3 29 10.9 30.9 11.8C32.9 12.8 33.6 13.4 33.6 14.3C33.6 15.7 31.9 16.3 30.4 16.3C27.7 16.3 26.1 15.6 24.9 15L23.9 19.5C25.2 20.1 27.6 20.7 30.1 20.7C35.4 20.7 39.1 18.1 39.1 14ZM15.5 0.5L7.4 20.5H2L0 3.2C1.9 4.5 4.4 6.6 5.6 8.3L10.2 0.5H15.5Z"
          fill="#1A1F71"
        />
        <path d="M1.1 0.5H9.1L9.5 2.4C6.8 3.2 2.9 6.3 0 10L1.1 0.5Z" fill="#F7B600" />
      </svg>
    </div>
  );

  const mastercardBadge = (
    <div
      className={`inline-flex items-center justify-center gap-1.5 bg-white rounded-lg border border-slate-200/90 shrink-0 ${
        variant === "compact" ? "h-6 px-2" : "h-8 px-2.5 shadow-2xs"
      }`}
      title="MasterCard"
      aria-label="MasterCard"
    >
      <svg className={variant === "compact" ? "h-3.5 w-auto" : "h-4.5 w-auto"} viewBox="0 0 36 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="13" cy="11" r="10" fill="#EB001B" />
        <circle cx="23" cy="11" r="10" fill="#F79E1B" />
        <path
          d="M18 3.2C20.2 5 21.6 7.8 21.6 11C21.6 14.2 20.2 17 18 18.8C15.8 17 14.4 14.2 14.4 11C14.4 7.8 15.8 5 18 3.2Z"
          fill="#FF5F00"
        />
      </svg>
      <span className={`${variant === "compact" ? "text-[9px]" : "text-[10.5px]"} font-extrabold tracking-tight text-slate-900`}>
        mastercard
      </span>
    </div>
  );

  const troyBadge = (
    <div
      className={`inline-flex items-center justify-center bg-white rounded-lg border border-slate-200/90 shrink-0 ${
        variant === "compact" ? "h-6 px-2" : "h-8 px-2.5 shadow-2xs"
      }`}
      title="Troy"
      aria-label="Troy"
    >
      <span className={`${variant === "compact" ? "text-[10px]" : "text-xs"} font-black tracking-tight text-[#0033A0]`}>
        troy
      </span>
      <span className="w-1.5 h-1.5 rounded-full bg-[#00A3E0] ml-0.5 mb-1.5" />
    </div>
  );

  if (variant === "compact") {
    return (
      <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
        {iyzicoBadge}
        {visaBadge}
        {mastercardBadge}
        {troyBadge}
      </div>
    );
  }

  if (variant === "checkout") {
    return (
      <div className={`p-2.5 rounded-xl bg-slate-100/90 border border-slate-200/90 flex flex-wrap items-center justify-between gap-2 ${className}`}>
        <div className="flex flex-wrap items-center gap-1.5">
          {iyzicoBadge}
          {visaBadge}
          {mastercardBadge}
          {troyBadge}
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
          <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>{isTr ? "256-Bit SSL & 3D Secure Korumalı Ödeme" : "256-Bit SSL & 3D Secure Protected"}</span>
        </div>
      </div>
    );
  }

  // Footer variant
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {iyzicoBadge}
      {visaBadge}
      {mastercardBadge}
      {troyBadge}
      <div className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-bold text-emerald-400">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
        <span>{isTr ? "3D Secure / 256-Bit SSL" : "3D Secure / 256-Bit SSL"}</span>
      </div>
    </div>
  );
};
