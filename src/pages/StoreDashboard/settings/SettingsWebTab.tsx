import React from "react";
import { motion } from "motion/react";
import {
  Palette,
  RefreshCw,
  Image as ImageIcon,
  ShoppingBag,
  User,
  Mail,
  Smartphone,
  Star,
  ShieldCheck,
  Upload,
  Plus,
  X,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  Tag,
  Lock,
} from "lucide-react";

interface SettingsWebTabProps {
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  lang: string;
  isPortfolio: boolean;
  currentUser: any;
  emails: string[];
  phones: string[];
  updateEmail: (index: number, value: string) => void;
  removeEmail: (index: number) => void;
  addEmail: () => void;
  updatePhone: (index: number, value: string) => void;
  removePhone: (index: number) => void;
  addPhone: () => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFaviconUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  users: any[];
  onAddUser: () => void;
  onDeleteUser: (id: number) => void;
}

export const SettingsWebTab = ({
  branding,
  onBrandingChange,
  lang,
  isPortfolio,
  currentUser,
  emails,
  phones,
  updateEmail,
  removeEmail,
  addEmail,
  updatePhone,
  removePhone,
  addPhone,
  onLogoUpload,
  onFaviconUpload,
  onBannerUpload,
  users,
  onAddUser,
  onDeleteUser,
}: SettingsWebTabProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-6 pb-20"
    >
      {/* Main Visual Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Showcase & Layout Controls */}
        {!isPortfolio && (
          <div className="lg:col-span-2 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-500" />
                {lang === "tr" ? "VİTRİN VE TASARIM" : "SHOWCASE & DESIGN"}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[
                {
                  key: "show_announcement",
                  label: lang === "tr" ? "Duyuru Bandı" : "Announcement Bar",
                  icon: <RefreshCw className="w-3.5 h-3.5" />,
                },
                {
                  key: "show_stories",
                  label: lang === "tr" ? "Hikayeler" : "Stories",
                  icon: <ImageIcon className="w-3.5 h-3.5" />,
                },
                {
                  key: "show_campaigns",
                  label: lang === "tr" ? "Kampanyalar" : "Campaigns",
                  icon: <ShoppingBag className="w-3.5 h-3.5" />,
                },
                {
                  key: "show_testimonials",
                  label: lang === "tr" ? "Müşteri Yorumları" : "Testimonials",
                  icon: <User className="w-3.5 h-3.5" />,
                },
                {
                  key: "show_newsletter",
                  label: lang === "tr" ? "Haber Bülteni" : "Newsletter",
                  icon: <Mail className="w-3.5 h-3.5" />,
                },
                {
                  key: "enable_live_activity",
                  label: lang === "tr" ? "Canlı Aktivite" : "Live Activity",
                  icon: <Smartphone className="w-3.5 h-3.5" />,
                },
                {
                  key: "show_featured_only",
                  label: lang === "tr" ? "Fiyatı Düşenler (Fırsat)" : "Featured Deals",
                  icon: <Star className="w-3.5 h-3.5" />,
                  color: "text-amber-500",
                },
              ].map((section) => (
                <div
                  key={section.key}
                  className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 bg-white rounded-lg shadow-sm border border-slate-100 ${
                        section.color || "text-slate-400"
                      }`}
                    >
                      {section.icon}
                    </div>
                    <span className="text-xs font-bold text-slate-600">{section.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const currentLayout = branding?.page_layout_settings || {};
                      onBrandingChange("page_layout_settings", {
                        ...currentLayout,
                        [section.key]: currentLayout[section.key as keyof typeof currentLayout] === false ? true : false,
                      });
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      branding?.page_layout_settings?.[section.key] !== false
                        ? section.color
                          ? "bg-amber-500"
                          : "bg-indigo-600"
                        : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        branding?.page_layout_settings?.[section.key] !== false ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            {branding?.page_layout_settings?.show_announcement !== false && (
              <div className="mb-6 p-4 bg-white border border-slate-200 rounded-2xl">
                <label className="text-xs font-bold text-slate-500 mb-2 block">
                  {lang === "tr" ? "Duyuru Metni" : "Announcement Text"}
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900"
                  placeholder={lang === "tr" ? "Duyuru metnini buraya yazın..." : "Enter announcement text here..."}
                  value={branding?.page_layout_settings?.announcement_text || ""}
                  onChange={(e) =>
                    onBrandingChange("page_layout_settings", {
                      ...branding?.page_layout_settings,
                      announcement_text: e.target.value,
                    })
                  }
                />
              </div>
            )}

            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                {lang === "tr" ? "TEMA KONSEPTİ" : "THEME CONCEPT"}
              </p>
              <div className="flex gap-2">
                {["modern", "minimal", "bold", "luxury"].map((theme) => (
                  <button
                    key={theme}
                    onClick={() =>
                      onBrandingChange("page_layout_settings", {
                        ...(branding?.page_layout_settings || {}),
                        theme_variety: theme,
                      })
                    }
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      branding?.page_layout_settings?.theme_variety === theme
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 mt-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                {lang === "tr" ? "SEKTÖR MODU" : "SECTOR MODE"}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {["general", "fashion", "automotive", "tech", "real_estate"].map((sect) => (
                  <button
                    key={sect}
                    onClick={() =>
                      onBrandingChange("page_layout_settings", {
                        ...(branding?.page_layout_settings || {}),
                        sector: sect,
                      })
                    }
                    className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      branding?.page_layout_settings?.sector === sect
                        ? "bg-amber-500 text-white shadow-lg"
                        : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                    }`}
                  >
                    {sect === "general"
                      ? lang === "tr"
                        ? "Genel"
                        : "General"
                      : sect === "fashion"
                      ? lang === "tr"
                        ? "Moda / Lüks"
                        : "Fashion / Luxury"
                      : sect === "automotive"
                      ? lang === "tr"
                        ? "Otomotiv"
                        : "Automotive"
                      : sect === "tech"
                      ? lang === "tr"
                        ? "Teknoloji"
                        : "Tech"
                      : lang === "tr"
                      ? "Gayrimenkul"
                      : "Real Estate"}
                  </button>
                ))}
              </div>
            </div>

            {/* AMİRAL GEMİSİ KAPTAN KÖŞKÜ COMMAND DECK */}
            <div className="mt-6 pt-6 border-t border-slate-150">
              <div className="flex items-center gap-2 mb-4 bg-slate-900/5 p-3.5 rounded-2xl border border-slate-200">
                <div className="p-2 bg-gradient-to-r from-rose-500 to-amber-500 text-white rounded-xl shadow-md">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-1.5">
                    {lang === "tr" ? "AMİRAL GEMİSİ KAPTAN KÖŞKÜ" : "FLAGSHIP CAPTAIN'S CABIN"}
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold text-white bg-rose-500 uppercase tracking-widest animate-pulse">
                      Pro Live
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {lang === "tr"
                      ? "Web sitenizin görsel lüks şablonlarını ve marka hissini tek tıkla özelleştirin."
                      : "Instantly command your showcase template, font family, and premium accent flare."}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {currentUser?.role === "superadmin" ? (
                  <>
                    {/* Premium Layout Templates Selector */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        {lang === "tr" ? "1. ULTRA-LÜKS VİTRİN ŞABLONU" : "1. ULTRA-LUX SHOWCASE TEMPLATE"}
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          {
                            id: "modern_bento",
                            label: lang === "tr" ? "Futuristic Bento Grid" : "Futuristic Bento Grid",
                            color: "bg-rose-500",
                          },
                          {
                            id: "royal_classic",
                            label: lang === "tr" ? "Royal Gilded (Lüks)" : "Royal Gilded (Luxe)",
                            color: "bg-emerald-500",
                          },
                          {
                            id: "cyberpunk_accent",
                            label: lang === "tr" ? "Cyber Neon Pulse" : "Cyber Neon Pulse",
                            color: "bg-cyan-500",
                          },
                          {
                            id: "alabaster",
                            label: lang === "tr" ? "Alabaster Minimalist" : "Alabaster Minimalist",
                            color: "bg-slate-500",
                          },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() =>
                              onBrandingChange("page_layout_settings", {
                                ...(branding?.page_layout_settings || {}),
                                showcase_layout_style: item.id,
                              })
                            }
                            className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                              branding?.page_layout_settings?.showcase_layout_style === item.id
                                ? "bg-slate-900 text-white border-slate-900 shadow-md scale-[1.01]"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <span>{item.label}</span>
                            <span className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font pairings selection */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        {lang === "tr" ? "2. AMİRAL TIPOGRAFİ EŞLEŞTİRMESİ" : "2. FLAGSHIP TYPOGRAPHY DECK"}
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "modern_edge", title: "Space + Inter", desc: "Futuristic" },
                          { id: "elite_heritage", title: "Playfair + Inter", desc: "Editorial" },
                          { id: "brutalist", title: "Mono Pair", desc: "Technical" },
                        ].map((font) => (
                          <button
                            key={font.id}
                            type="button"
                            onClick={() =>
                              onBrandingChange("page_layout_settings", {
                                ...(branding?.page_layout_settings || {}),
                                font_theme: font.id,
                              })
                            }
                            className={`p-2.5 rounded-xl border text-center transition-all ${
                              branding?.page_layout_settings?.font_theme === font.id
                                ? "bg-slate-900 border-slate-900 text-white shadow-md"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <div className="text-[11px] font-black uppercase tracking-tight">{font.title}</div>
                            <div className="text-[9px] text-slate-500 font-bold">{font.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Accent Gradient Color palette selection */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        {lang === "tr" ? "3. PRESTİJ GLOW IŞIMA AKSANI" : "3. PRESTIGE GLOW ACCENT FLARE"}
                      </span>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          {
                            id: "rose_amber",
                            label: lang === "tr" ? "Gül & Turuncu" : "Rose Amber",
                            fill: "from-rose-500 to-amber-500",
                          },
                          {
                            id: "gold_emerald",
                            label: lang === "tr" ? "Altın & Zümrüt" : "Royal Gold",
                            fill: "from-amber-400 to-emerald-500",
                          },
                          {
                            id: "violet_indigo",
                            label: lang === "tr" ? "Mor & Saks" : "Cosmic Iris",
                            fill: "from-violet-500 to-indigo-500",
                          },
                          {
                            id: "obsidian_mono",
                            label: lang === "tr" ? "Kömür & Gümüş" : "Obsidian Mono",
                            fill: "from-slate-800 to-slate-400",
                          },
                        ].map((palette) => (
                          <button
                            key={palette.id}
                            type="button"
                            onClick={() =>
                              onBrandingChange("page_layout_settings", {
                                ...(branding?.page_layout_settings || {}),
                                accent_gradient_style: palette.id,
                              })
                            }
                            className={`p-2 rounded-xl border transition-all flex flex-col items-center gap-1.5 ${
                              branding?.page_layout_settings?.accent_gradient_style === palette.id
                                ? "bg-slate-900 border-slate-900 text-white shadow-md scale-[1.02]"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-white"
                            }`}
                          >
                            <span className={`w-full h-2.5 rounded bg-gradient-to-r ${palette.fill}`} />
                            <span className="text-[9px] font-black uppercase tracking-tighter truncate w-full text-center">
                              {palette.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Border radius sharpness element */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        {lang === "tr" ? "4. KÖŞE KESKİNLİĞİ HASSASİYETİ" : "4. BORDER RADIUS SHARPNESS"}
                      </span>
                      <div className="flex gap-2">
                        {[
                          {
                            id: "extreme",
                            label: lang === "tr" ? "Ultra Yumuşak (Kavisli)" : "Ultra Rounded",
                            radius: "rounded-[2.5rem]",
                          },
                          { id: "sleek", label: lang === "tr" ? "Dengeli Modern" : "Balanced Sleek", radius: "rounded-xl" },
                          { id: "tech_sharp", label: lang === "tr" ? "Keskin / Köşeli" : "Tech Sharp", radius: "rounded-none" },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() =>
                              onBrandingChange("page_layout_settings", {
                                ...(branding?.page_layout_settings || {}),
                                border_radius: item.id,
                              })
                            }
                            className={`flex-1 p-2 border rounded-xl text-[9px] font-extrabold uppercase transition-all ${
                              branding?.page_layout_settings?.border_radius === item.id
                                ? "bg-slate-900 border-slate-900 text-white shadow-md"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Locked premium branding deck notification for non-superadmins */
                  <div className="p-5 rounded-[2rem] bg-indigo-950/5 border border-indigo-150 text-indigo-950 space-y-3">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-md shrink-0">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-indigo-950">
                          {lang === "tr" ? "VİTRİN VE MARKA TEMALARI KİLİTLİDİR" : "PREMIUM OUTLOOK IS MANAGED BY HQ"}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1.5">
                          {lang === "tr"
                            ? "Amiral Gemisi Kaptan Köşkü görsel şablonları, lüks vitrin ızgaraları ve tipografi entegrasyonları yalnızca LookPrice Prime Merkez Yönetici Yetkileri (Super Admin) tarafından kontrol edilmektedir. Tasarım güncellemeleri veya şablon talepleriniz için lütfen destek birimiyle iletişime geçin."
                            : "Flagship layouts, bento grids, prestige accents, and custom border sharpness are locked and fully isolated under centralized Super Admin authority. Contact support for template upgrades."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* LIVE INTERACTIVE PREVIEW CARD SANDBOX */}
                <div className="p-4 bg-slate-950 rounded-[2rem] border border-slate-800 text-slate-200 relative overflow-hidden">
                  <div className="absolute right-4 top-4 px-2 py-0.5 rounded text-[8px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 active:animate-ping uppercase font-mono tracking-widest">
                    Live Sandbox Play
                  </div>

                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-3">
                    {lang === "tr" ? "CANLI SANDBOX ÖNİZLEMESİ (MOCKUP CARD)" : "KAPTAN KÖŞKÜ REAL-TIME SIMULATOR"}
                  </span>

                  {/* Highly responsive simulated mock card utilizing selected properties */}
                  <div
                    className={`p-4 bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-4 max-w-md mx-auto hover:bg-slate-850 transition-all ${
                      branding?.page_layout_settings?.border_radius === "extreme"
                        ? "rounded-[1.8rem]"
                        : branding?.page_layout_settings?.border_radius === "tech_sharp"
                        ? "rounded-none"
                        : "rounded-2xl"
                    } ${
                      branding?.page_layout_settings?.showcase_layout_style === "royal_classic"
                        ? "border-amber-400/20 shadow-[0_0_15px_rgba(251,191,36,0.05)]"
                        : branding?.page_layout_settings?.showcase_layout_style === "cyberpunk_accent"
                        ? "border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                        : ""
                    }`}
                  >
                    <div className="w-full md:w-2/5 aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden relative border border-slate-800">
                      <img
                        src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=300&q=80"
                        alt="Mock vehicle"
                        className="w-full h-full object-cover opacity-80"
                      />
                      <span
                        className={`absolute top-2 left-2 px-1.5 py-0.5 text-[8px] font-black tracking-widest uppercase rounded text-white bg-gradient-to-r ${
                          branding?.page_layout_settings?.accent_gradient_style === "gold_emerald"
                            ? "from-amber-400 to-emerald-500"
                            : branding?.page_layout_settings?.accent_gradient_style === "violet_indigo"
                            ? "from-violet-500 to-indigo-500"
                            : branding?.page_layout_settings?.accent_gradient_style === "obsidian_mono"
                            ? "from-slate-700 to-slate-400"
                            : "from-rose-500 to-amber-500"
                        }`}
                      >
                        Premium
                      </span>
                    </div>

                    <div className="w-full md:w-3/5 flex flex-col justify-between">
                      <div>
                        <p
                          className={`text-[8px] font-black uppercase tracking-widest ${
                            branding?.page_layout_settings?.accent_gradient_style === "gold_emerald"
                              ? "text-amber-400"
                              : branding?.page_layout_settings?.accent_gradient_style === "violet_indigo"
                              ? "text-indigo-400"
                              : branding?.page_layout_settings?.accent_gradient_style === "obsidian_mono"
                              ? "text-slate-400"
                              : "text-rose-400"
                          }`}
                        >
                          {branding?.name || "Enrakipsiz Premium Store"}
                        </p>
                        <h5
                          className={`font-black leading-tight text-white mt-1 text-xs ${
                            branding?.page_layout_settings?.font_theme === "elite_heritage"
                              ? "font-serif"
                              : branding?.page_layout_settings?.font_theme === "brutalist"
                              ? "font-mono"
                              : "font-sans"
                          }`}
                        >
                          Aston Martin Vantage V8
                        </h5>
                        <p className="text-[10px] text-slate-400 leading-snug mt-1.5 line-clamp-2 font-medium">
                          Kaptan Köşkü ayarlarının simüle edilmiş lüks kart önizlemesi.
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800">
                        <span className="font-extrabold text-white text-[11px]">
                          12.850.000{" "}
                          <span
                            className="text-[9px]"
                            style={{
                              color:
                                branding?.page_layout_settings?.accent_gradient_style === "gold_emerald"
                                  ? "#fbbf24"
                                  : branding?.page_layout_settings?.accent_gradient_style === "violet_indigo"
                                  ? "#818cf8"
                                  : branding?.page_layout_settings?.accent_gradient_style === "obsidian_mono"
                                  ? "#94a3b8"
                                  : "#f43f5e",
                            }}
                          >
                            TRY
                          </span>
                        </span>
                        <span className="text-[8px] uppercase font-black text-rose-400 font-mono tracking-wide animate-pulse">
                          ACTIVE
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Logo & Favicon (Compact Side-by-Side) */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50 flex flex-col">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-amber-500" />
            {lang === "tr" ? "MARKA KİMLİĞİ" : "BRAND ASSETS"}
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Logo Upload */}
            <div className="relative group aspect-square bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 hover:border-indigo-400 hover:bg-white transition-all cursor-pointer">
              {branding?.logo_url ? (
                <img src={branding.logo_url} alt="Logo" className="max-h-full max-w-full object-contain mb-1" />
              ) : (
                <Plus className="w-6 h-6 text-slate-300" />
              )}
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">LOGO</span>
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={onLogoUpload} />
            </div>

            {/* Favicon Upload */}
            <div className="relative group aspect-square bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 hover:border-amber-400 hover:bg-white transition-all cursor-pointer">
              {branding?.favicon_url ? (
                <img src={branding.favicon_url} alt="Favicon" className="w-10 h-10 object-contain mb-1" />
              ) : (
                <Plus className="w-6 h-6 text-slate-300" />
              )}
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">FAVICON</span>
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={onFaviconUpload} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 uppercase tracking-widest">
              <p className="text-[8px] font-black text-slate-400 mb-1">LOGO URL</p>
              <input
                className="w-full bg-transparent text-[10px] text-slate-600 outline-none font-mono"
                value={branding?.logo_url || ""}
                onChange={(e) => onBrandingChange("logo_url", e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 uppercase tracking-widest">
              <p className="text-[8px] font-black text-slate-400 mb-1">FAVICON URL</p>
              <input
                className="w-full bg-transparent text-[10px] text-slate-600 outline-none font-mono"
                value={branding?.favicon_url || ""}
                onChange={(e) => onBrandingChange("favicon_url", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Banner & Text Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">
            {lang === "tr" ? "AFİŞ VE BAŞLIKLAR" : "BANNER & TITLES"}
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  {lang === "tr" ? "MAĞAZA ADI" : "STORE NAME"}
                </label>
                <input
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold"
                  value={branding?.name || ""}
                  onChange={(e) => onBrandingChange("name", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  {lang === "tr" ? "HERO BAŞLIK" : "HERO TITLE"}
                </label>
                <input
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold"
                  value={branding?.hero_title || ""}
                  onChange={(e) => onBrandingChange("hero_title", e.target.value)}
                />
              </div>
            </div>

            <div className="relative group w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center">
              {branding?.hero_image_url ? (
                <img
                  src={branding.hero_image_url}
                  alt="Banner"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="w-6 h-6 text-slate-300 mb-1" />
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">BANNER</span>
                </div>
              )}
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={onBannerUpload} />
            </div>
            <input
              className="w-full px-4 py-2 bg-slate-100/50 border-none rounded-lg text-[10px] font-mono text-slate-400"
              value={branding?.hero_image_url || ""}
              onChange={(e) => onBrandingChange("hero_image_url", e.target.value)}
              placeholder="Banner URL..."
            />
          </div>
        </div>

        {/* Label Customization */}
        {!isPortfolio && (
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                {lang === "tr" ? "ÖZEL ETİKETLER" : "CUSTOM LABELS"}
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onBrandingChange("brand_label", lang === "tr" ? "Yazarlar" : "Authors");
                    onBrandingChange("category_label", lang === "tr" ? "Kitap Türleri" : "Book Types");
                    onBrandingChange("product_label", lang === "tr" ? "Kitap" : "Book");
                    onBrandingChange("stock_label", lang === "tr" ? "Stoktaki Kitap Sayısı" : "Books in Stock");
                    onBrandingChange("hero_title", lang === "tr" ? "Okumayı Seviyoruz" : "We Love Reading");
                  }}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-tight hover:bg-indigo-100 transition-colors"
                >
                  {lang === "tr" ? "Kitapçı Konsepti Uygula" : "Apply Bookstore Concept"}
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {lang === "tr" ? "MARKA ETİKETİ" : "BRAND LABEL"}
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold"
                    placeholder={lang === "tr" ? "Örn: Yazarlar" : "e.g. Authors"}
                    value={branding?.brand_label || ""}
                    onChange={(e) => onBrandingChange("brand_label", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {lang === "tr" ? "KATEGORİ ETİKETİ" : "CATEGORY LABEL"}
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold"
                    placeholder={lang === "tr" ? "Örn: Koleksiyon" : "e.g. Collections"}
                    value={branding?.category_label || ""}
                    onChange={(e) => onBrandingChange("category_label", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {lang === "tr" ? "ÜRÜN ADLANDIRMA" : "PRODUCT LABEL"}
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold"
                    placeholder={lang === "tr" ? "Örn: Kitap" : "e.g. Book"}
                    value={branding?.product_label || ""}
                    onChange={(e) => onBrandingChange("product_label", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {lang === "tr" ? "STOK ETİKETİ" : "STOCK LABEL"}
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold"
                    placeholder={lang === "tr" ? "Örn: Kalan Adet" : "e.g. Remaining"}
                    value={branding?.stock_label || ""}
                    onChange={(e) => onBrandingChange("stock_label", e.target.value)}
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
                {lang === "tr"
                  ? "* Bu ayarlar web sitenizdeki filtreleme ve ürün detaylarındaki başlıkları değiştirir."
                  : "* These settings change the titles in filtering and product details on your website."}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">
            {lang === "tr" ? "HAKKIMIZDA METNİ" : "ABOUT TEXT"}
          </h3>
          <textarea
            className="w-full h-[180px] p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all resize-none mb-4"
            value={branding?.about_text || ""}
            onChange={(e) => onBrandingChange("about_text", e.target.value)}
            placeholder={lang === "tr" ? "Mağazanız hakkında kısa bir bilgi yazın..." : "Write some info about your store..."}
          />
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {lang === "tr" ? "SAYFA LİNKİ (Google Merchant İçin)" : "PAGE LINK (For Google Merchant)"}
            </p>
            <code className="text-[10px] text-blue-600 font-mono break-all font-bold">
              {window.location.origin}/store/{branding?.slug}/about-us
            </code>
          </div>
        </div>
      </div>

      {/* Legal Policies Section */}
      {!isPortfolio && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">
              {lang === "tr" ? "İADE POLİTİKASI" : "RETURN POLICY"}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium mb-4">
              {lang === "tr" ? "Google Merchant Center için zorunludur." : "Required for Google Merchant Center."}
            </p>
            <textarea
              className="w-full h-[180px] p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all resize-none mb-4"
              value={branding?.legal_pages?.return_policy || ""}
              onChange={(e) =>
                onBrandingChange("legal_pages", { ...branding?.legal_pages, return_policy: e.target.value })
              }
              placeholder={lang === "tr" ? "İade şartlarınızı yazın..." : "Write your return conditions..."}
            />
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {lang === "tr" ? "SAYFA LİNKİ" : "PAGE LINK"}
              </p>
              <code className="text-[10px] text-blue-600 font-mono break-all font-bold">
                {window.location.origin}/store/{branding?.slug}/return-policy
              </code>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">
              {lang === "tr" ? "KARGO POLİTİKASI" : "SHIPPING POLICY"}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium mb-4">
              {lang === "tr" ? "Google Merchant Center için zorunludur." : "Required for Google Merchant Center."}
            </p>
            <textarea
              className="w-full h-[180px] p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all resize-none mb-4"
              value={branding?.legal_pages?.shipping_policy || ""}
              onChange={(e) =>
                onBrandingChange("legal_pages", { ...branding?.legal_pages, shipping_policy: e.target.value })
              }
              placeholder={lang === "tr" ? "Kargo ve teslimat şartlarınızı yazın..." : "Write your shipping and delivery conditions..."}
            />
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {lang === "tr" ? "SAYFA LİNKİ" : "PAGE LINK"}
              </p>
              <code className="text-[10px] text-blue-600 font-mono break-all font-bold">
                {window.location.origin}/store/{branding?.slug}/shipping-policy
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Contact & Social Compact */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-100/50">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Contact */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">
              {lang === "tr" ? "İLETİŞİM BİLGİLERİ" : "CONTACT INFO"}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  {lang === "tr" ? "E-POSTALARI YÖNET" : "MANAGE EMAILS"}
                </p>
                {emails.map((email, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs"
                      value={email}
                      onChange={(e) => updateEmail(idx, e.target.value)}
                    />
                    {emails.length > 1 && (
                      <button onClick={() => removeEmail(idx)} className="text-rose-500">
                        <X />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addEmail} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                  + {lang === "tr" ? "EKLE" : "ADD"}
                </button>
              </div>
              <div className="space-y-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  {lang === "tr" ? "TELEFONLARI YÖNET" : "MANAGE PHONES"}
                </p>
                {phones.map((phone, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs"
                      value={phone}
                      onChange={(e) => updatePhone(idx, e.target.value)}
                    />
                    {phones.length > 1 && (
                      <button onClick={() => removePhone(idx)} className="text-rose-500">
                        <X />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addPhone} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                  + {lang === "tr" ? "EKLE" : "ADD"}
                </button>
              </div>
            </div>
          </div>

          {/* Social */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-pink-500 uppercase tracking-[0.2em]">
              {lang === "tr" ? "SOSYAL MEDYA" : "SOCIAL MEDIA"}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Instagram className="w-4 h-4" />, key: "instagram_url", placeholder: "@username" },
                { icon: <Facebook className="w-4 h-4" />, key: "facebook_url", placeholder: "facebook.com/..." },
                { icon: <Twitter className="w-4 h-4" />, key: "twitter_url", placeholder: "@twitter" },
                { icon: <MessageCircle className="w-4 h-4" />, key: "whatsapp_number", placeholder: "+90..." },
              ].map((social) => (
                <div key={social.key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-slate-400">{social.icon}</div>
                  <input
                    className="w-full bg-transparent text-xs font-bold outline-none placeholder:text-slate-300"
                    placeholder={social.placeholder}
                    value={branding?.[social.key as keyof typeof branding] || ""}
                    onChange={(e) => onBrandingChange(social.key as any, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tracking & Analytics */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Tag className="w-4 h-4 text-emerald-500" />
          {lang === "tr" ? "İZLEME VE ANALİTİK" : "TRACKING & ANALYTICS"}
        </h3>
        <p className="text-xs text-slate-500 mb-6 font-medium">
          {lang === "tr"
            ? "Google Analytics veya Google Tag Manager (GTM) aracılığıyla mağazanızı dijital olarak analiz edin."
            : "Analyze your store digitally through Google Analytics or Google Tag Manager (GTM)."}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Google Analytics (gtag) ID
            </label>
            <input
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold font-mono placeholder:text-slate-300"
              placeholder="G-XXXXXXXXXX"
              value={
                branding?.meta_settings &&
                typeof branding.meta_settings === "object" &&
                !Array.isArray(branding.meta_settings)
                  ? branding.meta_settings.ga_measurement_id || ""
                  : ""
              }
              onChange={(e) => {
                const newSettings = { ...(branding?.meta_settings || {}) };
                newSettings.ga_measurement_id = e.target.value;
                onBrandingChange("meta_settings", newSettings);
              }}
            />
            <p className="text-[10px] text-slate-400 mt-1 ml-1 leading-relaxed">Örn: G-XXXXXXXXXX. Sadece ID'yi girin.</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Google Tag Manager (GTM) ID
            </label>
            <input
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold font-mono placeholder:text-slate-300"
              placeholder="GTM-XXXXXXX"
              value={
                branding?.meta_settings &&
                typeof branding.meta_settings === "object" &&
                !Array.isArray(branding.meta_settings)
                  ? branding.meta_settings.gtm_id || ""
                  : ""
              }
              onChange={(e) => {
                const newSettings = { ...(branding?.meta_settings || {}) };
                newSettings.gtm_id = e.target.value;
                onBrandingChange("meta_settings", newSettings);
              }}
            />
            <p className="text-[10px] text-slate-400 mt-1 ml-1 leading-relaxed">Örn: GTM-XXXXXXX. Sadece ID'yi girin.</p>
          </div>
        </div>
      </div>

      {/* User Management Section (Keep it simple here) */}
      <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:bg-white/10 transition-all duration-1000"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-white tracking-widest uppercase mb-1">
                {lang === "tr" ? "EKİP YÖNETİMİ" : "TEAM MANAGEMENT"}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">
                {lang === "tr" ? "MAĞAZA ERİŞİM YETKİLERİ" : "STORE ACCESS CONTROL"}
              </p>
            </div>
            {(currentUser?.role === "admin" ||
              currentUser?.role === "storeadmin" ||
              currentUser?.role === "superadmin") && (
              <button
                onClick={onAddUser}
                className="px-6 py-3 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-xl shadow-black/20"
              >
                + {lang === "tr" ? "YENİ ÜYE" : "NEW MEMBER"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-5 bg-slate-800/50 rounded-3xl border border-slate-700/50 flex items-center justify-between group/user hover:bg-slate-800 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-700 rounded-2xl flex items-center justify-center text-white font-black">
                    {u.email?.[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-none mb-1">{u.email.split("@")[0]}</p>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{u.role}</p>
                  </div>
                </div>
                {((currentUser?.role === "admin" ||
                  currentUser?.role === "storeadmin" ||
                  currentUser?.role === "superadmin") &&
                  u.id !== currentUser?.id) && (
                  <button onClick={() => onDeleteUser(u.id)} className="p-2 text-slate-500 hover:text-rose-500 transition-colors">
                    <Lock className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
