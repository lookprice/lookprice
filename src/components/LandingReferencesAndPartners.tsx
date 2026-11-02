import React, { useState, useEffect } from "react";
import { ArrowUpRight } from "lucide-react";
import { api } from "../services/api";

interface LandingReferencesAndPartnersProps {
  lang: string;
}

const SECTOR_LABELS: Record<string, { tr: string; en: string; color: string }> = {
  product: { tr: "Perakende & E-Ticaret", en: "Retail & E-Commerce", color: "#6366f1" },
  cafe_restaurant: { tr: "Restoran & Kafe", en: "Restaurant & Cafe", color: "#10b981" },
  real_estate: { tr: "Gayrimenkul", en: "Real Estate", color: "#0ea5e9" },
  motor_vehicle: { tr: "Otomotiv", en: "Automotive", color: "#3b82f6" },
  automotive: { tr: "Otomotiv", en: "Automotive", color: "#3b82f6" },
  bookstore: { tr: "Kitabevi & Yayınevi", en: "Bookstore & Publishing", color: "#f59e0b" },
  hotel: { tr: "Otel & Konaklama", en: "Hotel & Hospitality", color: "#14b8a6" },
  corporate_website: { tr: "Kurumsal", en: "Corporate", color: "#8b5cf6" },
};

/**
 * Renders crisp, recognizable vector brand logos for all official partners and integrations
 * so every single item in the list always has a visible, high-contrast logo even without external image dependencies.
 */
export const PartnerBrandLogo: React.FC<{
  name: string;
  logoUrl?: string;
  brandColor?: string;
}> = ({ name, logoUrl, brandColor }) => {
  const [imgErr, setImgErr] = useState(false);
  const key = (name || "").toLowerCase().trim();

  if (logoUrl && !imgErr) {
    return (
      <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
        <img
          src={logoUrl}
          alt={name}
          className="max-w-full max-h-full object-contain"
          onError={() => setImgErr(true)}
        />
      </div>
    );
  }

  // MySoft
  if (key.includes("mysoft")) {
    return (
      <div className="w-11 h-11 rounded-xl bg-[#0a192f] border border-sky-500/30 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 64 64" className="w-8 h-8">
          <rect width="64" height="64" rx="12" fill="#0284c7" fillOpacity="0.15" />
          <path
            d="M12 42V22h6l7 11 7-11h6v20h-5.5V30.5L26 40h-2l-6.5-9.5V42H12z"
            fill="#38bdf8"
          />
          <circle cx="48" cy="26" r="5" fill="#f97316" />
          <path d="M43 42c0-4 2.2-6.5 5-6.5s5 2.5 5 6.5H43z" fill="#38bdf8" />
        </svg>
      </div>
    );
  }

  // iyzico
  if (key.includes("iyzico")) {
    return (
      <div className="w-11 h-11 rounded-xl bg-[#0c1a3e] border border-blue-500/30 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 80 32" className="w-9 h-6">
          <circle cx="10" cy="7" r="2.6" fill="#38bdf8" />
          <rect x="7.6" y="11.5" width="4.8" height="14" rx="2" fill="#ffffff" />
          <text
            x="16"
            y="23"
            fill="#ffffff"
            fontFamily="Inter, Arial, sans-serif"
            fontWeight="900"
            fontSize="16"
            letterSpacing="-0.5"
          >
            yzico
          </text>
        </svg>
      </div>
    );
  }

  // PayPal
  if (key.includes("paypal")) {
    return (
      <div className="w-11 h-11 rounded-xl bg-[#071536] border border-blue-400/25 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 48 48" className="w-7 h-7">
          <path
            d="M18.5 10h11c5.2 0 8.5 2.6 7.8 7.5-.8 5.6-4.8 8.5-10.2 8.5H23l-1.6 10h-5.8L18.5 10z"
            fill="#00457C"
          />
          <path
            d="M22.5 15h9.5c4.2 0 6.8 2.2 6.2 6.4-.7 4.7-4 7.1-8.5 7.1h-4.5L23.5 39h-5l4-24z"
            fill="#0079C1"
          />
        </svg>
      </div>
    );
  }

  // PayTR
  if (key.includes("paytr")) {
    return (
      <div className="w-11 h-11 rounded-xl bg-[#082226] border border-teal-500/30 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 84 32" className="w-9 h-6">
          <text
            x="4"
            y="22"
            fill="#ffffff"
            fontFamily="Inter, Arial, sans-serif"
            fontWeight="900"
            fontSize="17"
            letterSpacing="-0.5"
          >
            Pay
          </text>
          <text
            x="38"
            y="22"
            fill="#2dd4bf"
            fontFamily="Inter, Arial, sans-serif"
            fontWeight="900"
            fontSize="17"
            letterSpacing="-0.5"
          >
            TR
          </text>
        </svg>
      </div>
    );
  }

  // Trendyol
  if (key.includes("trendyol")) {
    return (
      <div className="w-11 h-11 rounded-xl bg-[#241207] border border-orange-500/30 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 88 32" className="w-9 h-6">
          <text
            x="4"
            y="21"
            fill="#f27a1a"
            fontFamily="Inter, Arial, sans-serif"
            fontWeight="900"
            fontSize="15.5"
            letterSpacing="-0.4"
          >
            trendyol
          </text>
        </svg>
      </div>
    );
  }

  // Hepsiburada
  if (key.includes("hepsiburada")) {
    return (
      <div className="w-11 h-11 rounded-xl bg-[#261105] border border-orange-500/30 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 64 64" className="w-8 h-8">
          <rect x="8" y="14" width="48" height="36" rx="9" fill="#ff6000" />
          <text
            x="32"
            y="38"
            textAnchor="middle"
            fill="#ffffff"
            fontFamily="Inter, Arial, sans-serif"
            fontWeight="900"
            fontSize="18"
            letterSpacing="-0.5"
          >
            hb
          </text>
        </svg>
      </div>
    );
  }

  // N11
  if (key.includes("n11")) {
    return (
      <div className="w-11 h-11 rounded-xl bg-[#1c0f2e] border border-purple-500/30 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 64 36" className="w-9 h-6">
          <text
            x="8"
            y="26"
            fill="#e11d48"
            fontFamily="Inter, Arial, sans-serif"
            fontWeight="900"
            fontSize="23"
          >
            n
          </text>
          <text
            x="24"
            y="26"
            fill="#a855f7"
            fontFamily="Inter, Arial, sans-serif"
            fontWeight="900"
            fontSize="23"
          >
            11
          </text>
        </svg>
      </div>
    );
  }

  // Pazarama
  if (key.includes("pazarama")) {
    return (
      <div className="w-11 h-11 rounded-xl bg-[#240b18] border border-pink-500/30 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 64 64" className="w-8 h-8">
          <circle cx="32" cy="32" r="22" fill="#e11d48" fillOpacity="0.2" />
          <path
            d="M22 44V20h11c5.5 0 9 3.2 9 8s-3.5 8-9 8h-5v8h-6zm6-13h5c2.2 0 3.5-1.2 3.5-3s-1.3-3-3.5-3h-5v6z"
            fill="#f43f5e"
          />
        </svg>
      </div>
    );
  }

  // Amazon
  if (key.includes("amazon")) {
    return (
      <div className="w-11 h-11 rounded-xl bg-[#1c1608] border border-amber-500/30 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 64 64" className="w-8 h-8">
          <text
            x="32"
            y="36"
            textAnchor="middle"
            fill="#ffffff"
            fontFamily="Inter, Arial, sans-serif"
            fontWeight="900"
            fontSize="24"
          >
            a
          </text>
          <path
            d="M16 43c8 5 22 5 31 0"
            stroke="#ff9900"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M44 40l4 3-2 4"
            stroke="#ff9900"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    );
  }

  // Google
  if (key.includes("google")) {
    return (
      <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 48 48" className="w-6 h-6">
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
          />
          <path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
          />
        </svg>
      </div>
    );
  }

  // Meta
  if (key.includes("meta") || key.includes("facebook") || key.includes("instagram")) {
    return (
      <div className="w-11 h-11 rounded-xl bg-[#071833] border border-blue-500/30 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 64 40" className="w-7 h-5">
          <path
            d="M16 8C9.5 8 5 13.8 5 21.2 5 27.8 9.2 32 14.5 32c4.2 0 7.6-2.8 11.8-9.2l3.7-5.7 3.7 5.7C37.9 29.2 41.3 32 45.5 32 50.8 32 55 27.8 55 21.2 55 13.8 50.5 8 44 8c-4.6 0-8.2 2.9-12 8.6C28.2 10.9 24.6 8 20 8h-4zm0 5.2c2.9 0 5.6 2 8.8 6.8l1.2 1.8-1.5 2.3c-3.3 5-5.7 6.7-8.5 6.7-3.2 0-5.4-2.5-5.4-6.6 0-4.6 2.3-8 5.4-8zm28 0c3.1 0 5.4 3.4 5.4 8 0 4.1-2.2 6.6-5.4 6.6-2.8 0-5.2-1.7-8.5-6.7L34 18.8l1.2-1.8c3.2-4.8 5.9-6.8 8.8-6.8z"
            fill="#0668E1"
          />
        </svg>
      </div>
    );
  }

  // Cloudflare
  if (key.includes("cloudflare")) {
    return (
      <div className="w-11 h-11 rounded-xl bg-[#261405] border border-orange-500/30 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 64 40" className="w-8 h-6">
          <path
            d="M46.5 28H17c-4.4 0-8-3.4-8-7.7 0-3.8 2.8-7 6.5-7.6 1.4-4.5 5.6-7.7 10.6-7.7 5.5 0 10.1 3.9 11 9.1 1-.4 2.1-.6 3.3-.6 4.6 0 8.4 3.6 8.6 8.1.1 3.5-1.2 6.4-2.5 6.4z"
            fill="#f38020"
          />
        </svg>
      </div>
    );
  }

  // TCMB
  if (key.includes("tcmb") || key.includes("merkez")) {
    return (
      <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 64 36" className="w-9 h-6">
          <text
            x="32"
            y="24"
            textAnchor="middle"
            fill="#e2e8f0"
            fontFamily="Inter, Arial, sans-serif"
            fontWeight="900"
            fontSize="16"
            letterSpacing="0.5"
          >
            TCMB
          </text>
        </svg>
      </div>
    );
  }

  // Clean fallback monogram for any custom partner added from SuperAdmin
  return (
    <div
      className="w-11 h-11 rounded-xl border border-white/15 flex items-center justify-center shrink-0 font-black text-xs text-white tracking-tight"
      style={{
        background: `linear-gradient(135deg, ${brandColor || "#4f46e5"}, #0f172a)`,
      }}
    >
      {String(name || "LP")
        .slice(0, 3)
        .toUpperCase()}
    </div>
  );
};

export const LandingReferencesAndPartners: React.FC<LandingReferencesAndPartnersProps> = ({
  lang,
}) => {
  const isTr = lang === "tr";
  const [references, setReferences] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [failedLogoIds, setFailedLogoIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;
    api
      .getPublicReferencesPartners()
      .then((res) => {
        if (!mounted || !res) return;
        if (Array.isArray(res.references)) setReferences(res.references);
        if (Array.isArray(res.partners)) setPartners(res.partners);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Group partners into the 3 clean columns requested:
  // 1) İş Ortaklıklarımız (MySoft, iyzico, PayPal, PayTR, etc.)
  // 2) E-Pazaryeri Entegrasyonları (Trendyol, Hepsiburada, N11, Pazarama, Amazon, etc.)
  // 3) Teknik Entegrasyonlar (Google, Meta, Cloudflare, TCMB, etc.)
  const businessPartners = partners.filter(
    (p) =>
      p.category === "partnership" ||
      p.category === "e_transformation" ||
      p.category === "payment" ||
      p.category === "strategic"
  );

  const marketplaceIntegrations = partners.filter(
    (p) => p.category === "marketplace"
  );

  const technicalIntegrations = partners.filter(
    (p) => p.category === "tech_integration" || p.category === "cloud_tech"
  );

  const filteredReferences =
    selectedSector === "all"
      ? references
      : references.filter((r) => {
          if (selectedSector === "motor_vehicle") {
            return r.sector === "motor_vehicle" || r.sector === "automotive";
          }
          if (selectedSector === "cafe_restaurant") {
            return r.sector === "cafe_restaurant" || r.sector === "hotel";
          }
          return r.sector === selectedSector;
        });

  return (
    <>
      {/* SECTION 1: REFERANSLARIMIZ */}
      <section
        id="referanslarimiz"
        className="py-16 md:py-20 px-6 border-t border-white/5 bg-[#050508]"
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-5 border-b border-white/10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {isTr ? "Referanslarımız" : "References"}
              </h2>
              <p className="text-white/45 text-xs sm:text-sm font-medium mt-1">
                {isTr
                  ? "LookPrice altyapısını kullanan işletmelerin aktif web siteleri ve sektörel dağılımları."
                  : "Active websites and industry breakdown of businesses powered by LookPrice."}
              </p>
            </div>

            {/* Minimal Sector Filter */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {[
                { id: "all", label: isTr ? "Tümü" : "All" },
                { id: "product", label: isTr ? "Perakende" : "Retail" },
                { id: "cafe_restaurant", label: isTr ? "Restoran & Otel" : "HoReCa" },
                { id: "real_estate", label: isTr ? "Gayrimenkul" : "Real Estate" },
                { id: "motor_vehicle", label: isTr ? "Otomotiv" : "Automotive" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedSector(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedSector === tab.id
                      ? "bg-white text-black"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredReferences.length === 0 ? (
            <div className="py-8 text-white/40 text-xs font-medium">
              {isTr
                ? "Bu kategoride görüntülenecek kayıt bulunamadı."
                : "No records found in this category."}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredReferences.map((ref) => {
                const sectorInfo =
                  SECTOR_LABELS[ref.sector] || SECTOR_LABELS.product;
                const logoKey = `ref_${ref.id}`;
                const showFallback = failedLogoIds[logoKey] || !ref.logo_url;
                const cleanUrl = (ref.website_url || "")
                  .replace(/^https?:\/\//, "")
                  .replace(/\/$/, "");

                const Wrapper: any = ref.website_url ? "a" : "div";
                const wrapperProps = ref.website_url
                  ? {
                      href: ref.website_url,
                      target: "_blank",
                      rel: "noopener noreferrer",
                    }
                  : {};

                return (
                  <Wrapper
                    key={ref.id}
                    {...wrapperProps}
                    className="group flex items-center gap-3.5 p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-white/25 transition-all"
                  >
                    {/* Store Logo */}
                    <div className="w-12 h-12 rounded-xl bg-slate-950 border border-white/10 p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                      {!showFallback ? (
                        <img
                          src={ref.logo_url}
                          alt={ref.company_name}
                          className="max-h-full max-w-full object-contain"
                          onError={() =>
                            setFailedLogoIds((prev) => ({
                              ...prev,
                              [logoKey]: true,
                            }))
                          }
                        />
                      ) : (
                        <div
                          className="w-full h-full rounded-lg flex items-center justify-center font-black text-xs text-white"
                          style={{
                            background: `linear-gradient(135deg, ${
                              ref.primary_color || sectorInfo.color
                            }, #0f172a)`,
                          }}
                        >
                          {String(ref.company_name || "LP")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Store Name, Sector & Website */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                          {ref.company_name}
                        </h3>
                        {ref.website_url && (
                          <ArrowUpRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white shrink-0 transition-colors" />
                        )}
                      </div>

                      <div className="text-[11px] text-white/50 font-medium truncate mt-0.5">
                        {isTr ? sectorInfo.tr : sectorInfo.en}
                        {ref.city ? ` · ${ref.city}` : ""}
                      </div>

                      {cleanUrl && (
                        <div className="text-[11px] font-mono text-indigo-400/80 truncate mt-0.5">
                          {cleanUrl.startsWith("/s/")
                            ? `lookprice.net${cleanUrl}`
                            : cleanUrl}
                        </div>
                      )}
                    </div>
                  </Wrapper>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: İŞ ORTAKLIKLARIMIZ & ENTEGRASYON LİSTESİ */}
      <section
        id="is-ortaklarimiz"
        className="py-16 md:py-20 px-6 border-t border-white/5 bg-[#040406]"
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 pb-5 border-b border-white/10">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {isTr ? "İş Ortaklıklarımız" : "Partnerships"}
            </h2>
            <p className="text-white/45 text-xs sm:text-sm font-medium mt-1">
              {isTr
                ? "Finansal e-dönüşüm, ödeme kuruluşları, e-pazaryerleri ve küresel teknoloji entegrasyonlarımız."
                : "Financial e-transformation, payment gateways, e-marketplaces, and technical integrations."}
            </p>
          </div>

          {/* 3 Structured Columns: İş Ortaklıklarımız | E-Pazaryeri Entegrasyonları | Teknik Entegrasyonlar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: İş Ortaklıklarımız (MySoft, iyzico, PayPal, PayTR) */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-5 flex flex-col">
              <div className="pb-3.5 mb-3.5 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-sm font-black text-white tracking-tight">
                  {isTr ? "İş Ortaklıklarımız" : "Business Partnerships"}
                </h3>
                <span className="text-[11px] font-semibold text-white/40">
                  {businessPartners.length}
                </span>
              </div>

              <div className="divide-y divide-white/5">
                {businessPartners.map((pt) => (
                  <div
                    key={pt.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-start gap-3.5"
                  >
                    <PartnerBrandLogo
                      name={pt.partner_name}
                      logoUrl={pt.logo_url}
                      brandColor={pt.brand_color}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-white truncate">
                          {pt.partner_name}
                        </span>
                        {pt.website_url && (
                          <a
                            href={pt.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/30 hover:text-white transition-colors shrink-0"
                            title={pt.partner_name}
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      {pt.announcement_title && (
                        <div className="text-xs font-semibold text-white/70 mt-0.5 leading-snug">
                          {pt.announcement_title}
                        </div>
                      )}
                      {pt.description && (
                        <p className="text-[11px] text-white/45 leading-relaxed mt-1 line-clamp-2">
                          {pt.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: E-Pazaryeri Entegrasyonları (Trendyol, Hepsiburada, N11, Pazarama, Amazon) */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-5 flex flex-col">
              <div className="pb-3.5 mb-3.5 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-sm font-black text-white tracking-tight">
                  {isTr ? "E-Pazaryeri Entegrasyonları" : "E-Marketplace Integrations"}
                </h3>
                <span className="text-[11px] font-semibold text-white/40">
                  {marketplaceIntegrations.length}
                </span>
              </div>

              <div className="divide-y divide-white/5">
                {marketplaceIntegrations.map((pt) => (
                  <div
                    key={pt.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-start gap-3.5"
                  >
                    <PartnerBrandLogo
                      name={pt.partner_name}
                      logoUrl={pt.logo_url}
                      brandColor={pt.brand_color}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-white truncate">
                          {pt.partner_name}
                        </span>
                        {pt.website_url && (
                          <a
                            href={pt.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/30 hover:text-white transition-colors shrink-0"
                            title={pt.partner_name}
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      {pt.announcement_title && (
                        <div className="text-xs font-semibold text-white/70 mt-0.5 leading-snug">
                          {pt.announcement_title}
                        </div>
                      )}
                      {pt.description && (
                        <p className="text-[11px] text-white/45 leading-relaxed mt-1 line-clamp-2">
                          {pt.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Teknik Entegrasyonlar (Google, Meta, Cloudflare, TCMB) */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-5 flex flex-col">
              <div className="pb-3.5 mb-3.5 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-sm font-black text-white tracking-tight">
                  {isTr ? "Teknik Entegrasyonlar" : "Technical Integrations"}
                </h3>
                <span className="text-[11px] font-semibold text-white/40">
                  {technicalIntegrations.length}
                </span>
              </div>

              <div className="divide-y divide-white/5">
                {technicalIntegrations.map((pt) => (
                  <div
                    key={pt.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-start gap-3.5"
                  >
                    <PartnerBrandLogo
                      name={pt.partner_name}
                      logoUrl={pt.logo_url}
                      brandColor={pt.brand_color}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-white truncate">
                          {pt.partner_name}
                        </span>
                        {pt.website_url && (
                          <a
                            href={pt.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/30 hover:text-white transition-colors shrink-0"
                            title={pt.partner_name}
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      {pt.announcement_title && (
                        <div className="text-xs font-semibold text-white/70 mt-0.5 leading-snug">
                          {pt.announcement_title}
                        </div>
                      )}
                      {pt.description && (
                        <p className="text-[11px] text-white/45 leading-relaxed mt-1 line-clamp-2">
                          {pt.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
