import React from 'react';
import { 
  Instagram, 
  Facebook, 
  Twitter, 
  MessageCircle, 
  Mail, 
  Phone, 
  MapPin, 
  Navigation,
  ShieldCheck, 
  Clock,
  ExternalLink,
  Youtube,
  Linkedin
} from 'lucide-react';

interface StoreFooterProps {
  store: any;
  lang: string;
  setShowAboutModal?: (show: boolean) => void;
  setShowStoreLocatorModal?: (show: boolean) => void;
  onOpenProfile?: (tab?: string) => void;
  setShowAuthModal?: (show: boolean) => void;
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
    return "Seçkin Kitabevi";
  }
  return rawName;
};

export const StoreFooter: React.FC<StoreFooterProps> = ({
  store,
  lang,
  setShowAboutModal,
  setShowStoreLocatorModal,
  onOpenProfile,
  setShowAuthModal
}) => {
  const isTr = lang === "tr";
  const displayName = getDisplayStoreName(store);

  // Accurate address parsing without any assumed city/country fallbacks
  const rawAddress = (store?.address || store?.branding?.address || store?.branding?.store_address || "").trim();
  const rawDistrict = (store?.district || store?.branding?.district || "").trim();
  const rawCity = (store?.city || store?.branding?.city || "").trim();
  const rawCountry = (store?.country || store?.branding?.country || "").trim();
  
  const addressParts = [rawAddress, rawDistrict, rawCity, rawCountry].filter(Boolean);
  const fullAddress = addressParts.length > 0 ? addressParts.join(", ") : "";
  const displayAddressText = fullAddress || (isTr ? "İletişim kanallarımızdan bize ulaşabilirsiniz." : "Contact us for store address details.");

  const customMapUrl = store?.branding?.google_maps_url || "";
  const mapSearchQuery = fullAddress ? `${displayName} ${fullAddress}` : displayName;
  const mapSearchUrl = customMapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapSearchQuery)}`;

  // Dynamic Working Hours Parsing
  const wh = store?.branding?.working_hours || (store as any)?.working_hours;
  const whCustomText = store?.branding?.working_hours_text || (typeof wh === 'string' ? wh : null);

  const formatWorkingHours = () => {
    if (whCustomText && typeof whCustomText === 'string' && whCustomText.trim()) {
      return { main: whCustomText.trim(), secondary: null, note: null };
    }
    if (wh && typeof wh === 'object') {
      const weekdays = wh.weekdays || "09:00 - 19:00";
      const satText = wh.is_saturday_closed ? (isTr ? "Kapalı" : "Closed") : (wh.saturday || weekdays);
      const sunText = (wh.is_sunday_closed || !wh.sunday || wh.sunday === "Kapalı" || wh.sunday === "Closed") 
        ? (isTr ? "Kapalı" : "Closed") 
        : wh.sunday;
      
      const main = isTr 
        ? `Hafta İçi: ${weekdays}` 
        : `Weekdays: ${weekdays}`;
      const secondary = isTr
        ? `Cts: ${satText} | Pzr: ${sunText}`
        : `Sat: ${satText} | Sun: ${sunText}`;
      const note = wh.note || null;
      return { main, secondary, note };
    }
    return {
      main: isTr ? "Hafta İçi: 09:00 - 18:00" : "Mon - Fri: 09:00 - 18:00",
      secondary: isTr ? "Pazar: Kapalı" : "Sun: Closed",
      note: null
    };
  };

  const hoursInfo = formatWorkingHours();

  // Contact info (no fake dummy numbers if empty)
  const storePhone = (store?.phone || store?.branding?.phone || "").trim();
  const storeEmail = (store?.email || store?.branding?.email || "").trim();
  const rawWhatsapp = (store?.whatsapp_number || store?.branding?.whatsapp_number || storePhone || "").trim();
  const whatsappSanitized = rawWhatsapp.replace(/\D/g, '');
  const whatsappUrl = whatsappSanitized ? `https://wa.me/${whatsappSanitized.startsWith('90') ? whatsappSanitized : `90${whatsappSanitized}`}` : "";

  // Social media links
  const social = store?.branding?.social_media || {};
  const instagramUrl = social.instagram || "https://instagram.com";
  const facebookUrl = social.facebook || "https://facebook.com";
  const twitterUrl = social.twitter || social.x || "https://x.com";
  const youtubeUrl = social.youtube || "https://youtube.com";
  const linkedinUrl = social.linkedin || "https://linkedin.com";

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800/80 pt-8 pb-6 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid - 4 Columns, Compact & Dense */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8 pb-6 border-b border-slate-800/80">
          
          {/* Col 1: Store Brand & About (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center gap-3">
              {store?.logo_url || store?.branding?.logo_url ? (
                <img
                  src={store?.logo_url || store?.branding?.logo_url}
                  alt={displayName}
                  className="h-8 w-auto object-contain brightness-110"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-red-600/30">
                  {displayName.charAt(0)}
                </div>
              )}
              <span className="text-lg font-black tracking-tight text-white">
                {displayName}
              </span>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              {store?.description || store?.branding?.slogan || (isTr 
                ? "Edebiyat, bilim, araştırma ve sanat dünyasının en seçkin eserleri, güvenli ödeme ve hızlı teslimatla kapınızda." 
                : "Curated collection of masterworks in literature, arts, and sciences with fast and secure delivery.")}
            </p>

            {/* Social Media Buttons */}
            <div className="pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                {isTr ? "Bizi Takip Edin" : "Follow Us"}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 hover:border-transparent transition-all shadow-sm"
                  title="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:bg-emerald-600 hover:border-emerald-600 transition-all shadow-sm"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:bg-blue-600 hover:border-blue-600 transition-all shadow-sm"
                  title="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X (Twitter)"
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700 transition-all shadow-sm"
                  title="X (Twitter)"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:bg-red-600 hover:border-red-600 transition-all shadow-sm"
                  title="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:bg-sky-600 hover:border-sky-600 transition-all shadow-sm"
                  title="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Col 2: Adres, Harita ve Çalışma Saatleri (4 cols) */}
          <div className="lg:col-span-4 space-y-2.5">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span>{isTr ? "Adres & Çalışma Saatleri" : "Location & Hours"}</span>
            </h4>

            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800/90 space-y-2">
              <div className="flex items-start gap-2 text-xs">
                <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-200 font-medium leading-snug">{displayAddressText}</p>
                </div>
              </div>

              {/* Dynamic Working Hours */}
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-amber-400/90">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{hoursInfo.main}</span>
                </div>
                {hoursInfo.secondary && (
                  <div className="text-slate-400 pl-5 text-[10px] font-medium">
                    {hoursInfo.secondary}
                  </div>
                )}
                {hoursInfo.note && (
                  <div className="text-slate-500 pl-5 text-[9.5px] italic">
                    {hoursInfo.note}
                  </div>
                )}
              </div>

              {/* Direct Google Maps Action Button (only if address or custom URL is configured) */}
              <a
                href={mapSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 w-full py-1.5 px-3 bg-slate-800 hover:bg-red-600 hover:text-white text-slate-200 text-xs font-bold rounded-lg border border-slate-700/80 hover:border-red-500 transition-all flex items-center justify-center gap-1.5 shadow-sm group"
              >
                <Navigation className="w-3.5 h-3.5 text-red-400 group-hover:text-white transition-colors" />
                <span>{isTr ? "Haritada Göster & Yol Tarifi Al" : "View on Google Maps"}</span>
                <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
              </a>
            </div>
          </div>

          {/* Col 3: İletişim & Hızlı Erişim (4 cols) */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-4">
            {/* Contact */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                {isTr ? "İletişim" : "Contact"}
              </h4>
              <ul className="space-y-2 text-xs">
                {storePhone ? (
                  <li>
                    <a 
                      href={`tel:${storePhone}`} 
                      className="text-slate-300 hover:text-white font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{storePhone}</span>
                    </a>
                  </li>
                ) : null}
                {storeEmail ? (
                  <li>
                    <a 
                      href={`mailto:${storeEmail}`} 
                      className="text-slate-300 hover:text-white font-medium flex items-center gap-1.5 transition-colors truncate max-w-[170px]"
                      title={storeEmail}
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{storeEmail}</span>
                    </a>
                  </li>
                ) : null}
                {whatsappUrl && (
                  <li>
                    <a 
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isTr ? "WhatsApp Destek" : "WhatsApp Chat"}</span>
                    </a>
                  </li>
                )}
                {!storePhone && !storeEmail && !whatsappUrl && (
                  <li className="text-slate-500 text-[11px] italic">
                    {isTr ? "İletişim için mesaj bırakınız." : "Leave a message for support."}
                  </li>
                )}
              </ul>
            </div>

            {/* Quick Links */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                {isTr ? "Hızlı Erişim" : "Quick Links"}
              </h4>
              <ul className="space-y-1.5 text-xs font-medium">
                {setShowAboutModal && (
                  <li>
                    <button
                      type="button"
                      onClick={() => setShowAboutModal(true)}
                      className="text-slate-400 hover:text-white transition-colors text-left cursor-pointer"
                    >
                      {isTr ? "Hakkımızda" : "About Us"}
                    </button>
                  </li>
                )}
                {onOpenProfile && (
                  <>
                    <li>
                      <button
                        type="button"
                        onClick={() => onOpenProfile('orders')}
                        className="text-slate-400 hover:text-white transition-colors text-left cursor-pointer"
                      >
                        {isTr ? "Sipariş Takibi" : "Order Tracking"}
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => onOpenProfile('favorites')}
                        className="text-slate-400 hover:text-white transition-colors text-left cursor-pointer"
                      >
                        {isTr ? "Favori Kitaplarım" : "My Favorites"}
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => onOpenProfile('profile')}
                        className="text-slate-400 hover:text-white transition-colors text-left cursor-pointer"
                      >
                        {isTr ? "Müşteri Hesabı" : "Customer Account"}
                      </button>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Security */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} {displayName}. {isTr ? "Tüm hakları saklıdır." : "All rights reserved."}</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isTr ? "256-Bit SSL Güvenli Alışveriş" : "256-Bit SSL Encrypted"}</span>
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};

