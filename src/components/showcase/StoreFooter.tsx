import React from 'react';
import { 
  ShoppingBag, 
  Instagram, 
  Facebook, 
  Twitter, 
  MessageCircle, 
  Mail, 
  Phone, 
  CreditCard, 
  ShieldCheck, 
  Globe 
} from 'lucide-react';
import { Store as StoreInfo } from '../../types';

interface StoreFooterProps {
  store: any;
  lang: string;
  setShowAboutModal: (show: boolean) => void;
  setShowStoreLocatorModal: (show: boolean) => void;
}

const getDisplayStoreName = (store: any) => {
  const rawName = store?.branding?.store_name || store?.branding?.name || store?.name || "";
  if (!rawName || rawName.toLowerCase().includes("lookprice")) {
    const type = store?.store_type || store?.branding?.store_type;
    if (type === 'real_estate') {
      return "Premium VIP Emlak";
    } else if (type === 'motor_vehicle' || type === 'automotive') {
      return "Seçkin Otomotiv";
    }
    return "Seçkin Mağaza";
  }
  return rawName;
};

export const StoreFooter: React.FC<StoreFooterProps> = ({
  store,
  lang,
  setShowAboutModal,
  setShowStoreLocatorModal
}) => {
  const displayName = getDisplayStoreName(store);

  return (
    <footer className="bg-black pt-32 pb-12 overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-4 mb-8">
              {store?.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={displayName}
                  className="h-12 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-blue-600 shadow-xl shadow-blue-500/20">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              )}
              <span className="text-3xl font-bold tracking-tighter text-white">
                {displayName}
              </span>
            </div>
            <p className="text-gray-500 text-lg font-medium max-w-md leading-relaxed mb-10">
              {store?.description ||
                (store?.store_type === "real_estate" || store?.store_type === "motor_vehicle"
                  ? lang === "tr"
                    ? "En seçkin gayrimenkul ve araç ilanlarını en avantajlı fırsatlarla sizlere sunuyoruz. Müşteri memnuniyeti önceliğimizdir."
                    : "We provide the most exclusive real estate and vehicle listings with premium opportunities. Customer satisfaction is our priority."
                  : lang === "tr"
                    ? "En kaliteli ürünleri en uygun fiyatlarla sizlere sunuyoruz. Müşteri memnuniyeti bizim için her zaman önceliklidir."
                    : "We offer you the highest quality products at the most affordable prices. Customer satisfaction is always our priority.")}
            </p>

            <div className="flex items-center gap-4">
              {[
                {
                  id: "instagram_url",
                  icon: Instagram,
                  color: "hover:text-pink-500",
                  bg: "hover:bg-pink-500/10",
                },
                {
                  id: "facebook_url",
                  icon: Facebook,
                  color: "hover:text-blue-500",
                  bg: "hover:bg-blue-500/10",
                },
                {
                  id: "twitter_url",
                  icon: Twitter,
                  color: "hover:text-sky-400",
                  bg: "hover:bg-sky-400/10",
                },
                {
                  id: "whatsapp_number",
                  icon: MessageCircle,
                  color: "hover:text-green-500",
                  bg: "hover:bg-green-500/10",
                },
              ].map((social) => {
                const url = store?.[social.id];
                if (!url) return null;

                let href = String(url);
                if (social.id === "whatsapp_number") {
                  href = `https://wa.me/${href.replace(/[^0-9]/g, "")}`;
                } else if (!href.startsWith("http")) {
                  const base = social.id.split("_")[0];
                  href = `https://${base}.com/${href}`;
                }

                return (
                  <a
                    key={social.id}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 transition-all duration-500 ${social.color} ${social.bg} hover:border-current hover:scale-110 shadow-sm`}
                  >
                    <social.icon className="w-6 h-6" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xss font-semibold uppercase tracking-[0.3em] text-white/40 mb-8">
              {lang === "tr" ? "HIZLI ERİŞİM" : "QUICK LINKS"}
            </h4>
            <ul className="space-y-4">
              {store?.about_text && (
                <li>
                  <button
                    onClick={() => setShowAboutModal(true)}
                    className="text-gray-500 hover:text-white text-sm font-bold transition-colors flex items-center gap-2 group"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 scale-0 group-hover:scale-100 transition-transform" />
                    {lang === "tr" ? "Hakkımızda" : "About Us"}
                  </button>
                </li>
              )}
              {store?.locations && store.locations.length > 0 && (
                <li>
                  <button
                    onClick={() => setShowStoreLocatorModal(true)}
                    className="text-gray-500 hover:text-white text-sm font-bold transition-colors flex items-center gap-2 group"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 scale-0 group-hover:scale-100 transition-transform" />
                    {lang === "tr" ? "Mağazalarımız" : "Our Stores"}
                  </button>
                </li>
              )}
              {(store?.menu_links || []).map((link: any, index: number) => (
                <li key={index}>
                  <a
                    href={link.url}
                    className="text-gray-500 hover:text-white text-sm font-bold transition-colors flex items-center gap-2 group"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 scale-0 group-hover:scale-100 transition-transform" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xss font-semibold uppercase tracking-[0.3em] text-white/40 mb-8">
              {lang === "tr" ? "İLETİŞİM" : "CONTACT US"}
            </h4>
            <ul className="space-y-6">
              {store?.emails && store.emails.some((e: any) => e?.trim()) ? (
                store.emails
                  .filter((e: any) => e?.trim())
                  .map((e: any, idx: number) => (
                    <li
                      key={`email-${idx}`}
                      className="flex items-center gap-4 text-gray-500 text-sm font-bold group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-600 group-hover:bg-blue-600/10 group-hover:text-blue-500 transition-all">
                        <Mail className="w-4 h-4" />
                      </div>
                      <span className="break-all">{e}</span>
                    </li>
                  ))
              ) : (
                <li className="flex items-center gap-4 text-gray-500 text-sm font-bold group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-600 group-hover:bg-blue-600/10 group-hover:text-blue-500 transition-all">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span>{store?.email || "destek@lookprice.net"}</span>
                </li>
              )}

              {store?.phones && store.phones.some((p: any) => p?.trim()) ? (
                store.phones
                  .filter((p: any) => p?.trim())
                  .map((p: any, idx: number) => (
                    <li
                      key={`phone-${idx}`}
                      className="flex items-center gap-4 text-gray-500 text-sm font-bold group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-600 group-hover:bg-green-600/10 group-hover:text-green-500 transition-all">
                        <Phone className="w-4 h-4" />
                      </div>
                      {p}
                    </li>
                  ))
              ) : (
                <li className="flex items-center gap-4 text-gray-500 text-sm font-bold group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-600 group-hover:bg-green-600/10 group-hover:text-green-500 transition-all">
                    <Phone className="w-4 h-4" />
                  </div>
                  {store?.phone || "+90 212 000 00 00"}
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="pt-12 border-t border-white/5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
              <div className="flex items-center gap-6">
                <span className="text-[10px] font-semibold text-white tracking-wide underline underline-offset-8 decoration-blue-600">
                  Secure Payments
                </span>
                <div className="flex items-center gap-4">
                  <CreditCard className="w-5 h-5 text-white" />
                  <ShieldCheck className="w-5 h-5 text-white" />
                  <Globe className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            <p className="text-gray-600 font-bold text-[10px] tracking-wide">
              © {new Date().getFullYear()} {displayName}.{" "}
              {lang === "tr"
                ? "TÜM HAKLARI SAKLIDIR."
                : "ALL RIGHTS RESERVED."}
            </p>

            <div className="flex items-center gap-6">
              {store?.about_text && (
                <button
                  onClick={() => setShowAboutModal(true)}
                  className="text-gray-600 hover:text-white text-[10px] font-semibold tracking-wide transition-colors"
                >
                  {lang === "tr" ? "Hakkımızda" : "Our Story"}
                </button>
              )}
              {(store?.footer_links || []).map(
                (page: any, index: number) => (
                  <a
                    key={index}
                    href={page.url}
                    className="text-gray-600 hover:text-white text-[10px] font-semibold tracking-wide transition-colors"
                  >
                    {page.label}
                  </a>
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Abstract Background Element */}
      <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px]" />
    </footer>
  );
};
