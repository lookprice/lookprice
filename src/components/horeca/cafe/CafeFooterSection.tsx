import React from "react";
import {
  Clock,
  Phone,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Award
} from "lucide-react";
import { Store } from "../../../types";

interface CafeFooterSectionProps {
  store: Store;
  isTr: boolean;
  isLightTheme: boolean;
  isAmberTheme: boolean;
  isEmeraldTheme: boolean;
  isHotelModuleActive: boolean;
  totalTables: number;
  isStoreCurrentlyOpen: boolean;
  hoursNote?: string;
  weekdayHours: string;
  satHours: string;
  sunHours: string;
  isSatClosed: boolean;
  isSunClosed: boolean;
  setActiveMode: (mode: 'menu' | 'hotel') => void;
}

export const CafeFooterSection: React.FC<CafeFooterSectionProps> = ({
  store,
  isTr,
  isLightTheme,
  isAmberTheme,
  isEmeraldTheme,
  isHotelModuleActive,
  totalTables,
  isStoreCurrentlyOpen,
  hoursNote,
  weekdayHours,
  satHours,
  sunHours,
  isSatClosed,
  isSunClosed,
  setActiveMode
}) => {
  return (
    <>
      {/* Story Section */}
      <section id="story" className={`py-16 border-t ${
        isLightTheme ? "bg-slate-100/70 text-slate-900 border-slate-200" :
        isAmberTheme ? "bg-amber-900/10 text-stone-900 border-amber-200/50" :
        isEmeraldTheme ? "bg-emerald-950/10 text-slate-900 border-emerald-100" :
        "bg-slate-950 text-slate-200 border-slate-900"
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4 lg:max-w-xl">
            <span className={`text-[10px] font-black uppercase tracking-widest ${
              isLightTheme ? "text-slate-500" : isAmberTheme ? "text-amber-700" : isEmeraldTheme ? "text-emerald-700" : "text-slate-400"
            }`}>{isTr ? "HİKAYEMİZ & TUTKUMUZ" : "OUR HERITAGE"}</span>
            <h2 className={`text-2xl md:text-3xl font-black tracking-tight leading-tight ${
              isLightTheme ? "text-slate-900" : "text-white"
            }`}>
              {isTr ? "Her Lokmada Bir Lezzet Öyküsü" : "A Taste Built on Pure Culinary Love"}
            </h2>
            <p className={`leading-relaxed text-xs sm:text-sm font-medium ${
              isLightTheme ? "text-slate-600" : "text-slate-400"
            }`}>
              {store.about_text || (isTr 
                ? "Sizlere sadece yemek sunmakla kalmıyoruz; keyifle paylaşılan anlara, sıcacık sohbetlere ve unutulmaz anılara ev sahipliği yapıyoruz. En kaliteli yerel malzemeleri seçiyor, usta ellerin vizyonuyla harmanlayıp masanıza getiriyoruz."
                : "We do not just offer gourmet food; we host warm conversations, shared laughter, and beautiful memories.")}
            </p>
            <div className={`grid grid-cols-3 gap-4 pt-3 border-t ${
              isLightTheme ? "border-slate-200" : "border-slate-900"
            }`}>
              <div>
                <span className={`block text-xl font-black ${isLightTheme ? "text-slate-900" : "text-white"}`}>%100</span>
                <span className={`text-[9px] uppercase tracking-wider font-bold block ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>{isTr ? "Taze Ürün" : "Fresh Daily"}</span>
              </div>
              <div>
                <span className={`block text-xl font-black ${isLightTheme ? "text-slate-900" : "text-white"}`}>{totalTables}</span>
                <span className={`text-[9px] uppercase tracking-wider font-bold block ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>{isTr ? "Masa Servisi" : "Tables"}</span>
              </div>
              <div>
                <span className={`block text-xl font-black ${isLightTheme ? "text-slate-900" : "text-white"}`}>A+</span>
                <span className={`text-[9px] uppercase tracking-wider font-bold block ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>{isTr ? "Kalite Hizmet" : "Service Rate"}</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000"
              alt="Atmospheric Table Setup"
              className={`w-full h-64 md:h-80 object-cover rounded-2xl shadow-xl border opacity-95 filter brightness-100 ${
                isLightTheme ? "border-slate-200" : "border-slate-800"
              }`}
            />
          </div>
        </div>
      </section>

      {/* Opening Hours & Contact */}
      <section id="hours" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          <div className={`p-6 rounded-2xl border shadow-xs flex flex-col justify-between ${
            isLightTheme ? "bg-white border-slate-200 text-slate-900" :
            isAmberTheme ? "bg-white border-amber-200 text-stone-900" :
            isEmeraldTheme ? "bg-white border-emerald-100 text-slate-900" :
            "bg-slate-900 border-slate-800 text-white"
          }`}>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl border ${
                  isLightTheme ? "bg-slate-100 text-slate-700 border-slate-200" : "bg-slate-950 text-slate-300 border-slate-800"
                }`}>
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-base font-black leading-none ${isLightTheme ? "text-slate-900" : "text-white"}`}>{isTr ? "Çalışma Saatleri" : "Opening Hours"}</h3>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border flex items-center gap-1 ${
                      isStoreCurrentlyOpen 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800" 
                        : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isStoreCurrentlyOpen ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}></span>
                      {isStoreCurrentlyOpen ? (isTr ? "Şu An Açık" : "Open") : (isTr ? "Şu An Kapalı" : "Closed")}
                    </span>
                  </div>
                  <span className={`text-[9px] uppercase tracking-wider font-bold mt-1 block ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>
                    {hoursNote || (isTr ? "Haftanın 7 Günü Hizmetinizdeyiz" : "Open 7 Days a Week")}
                  </span>
                </div>
              </div>
              
              <div className={`space-y-2.5 border-t pt-4 ${isLightTheme ? "border-slate-100" : "border-slate-800/80"}`}>
                {[
                  { days: isTr ? "Hafta İçi (Pzt - Cuma)" : "Weekdays (Mon - Fri)", hours: weekdayHours, closed: false },
                  { days: isTr ? "Cumartesi" : "Saturday", hours: satHours, closed: isSatClosed },
                  { days: isTr ? "Pazar" : "Sunday", hours: sunHours, closed: isSunClosed },
                ].map((schedule, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-bold">
                    <span className={isLightTheme ? "text-slate-600" : "text-slate-400"}>{schedule.days}</span>
                    <span className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                      schedule.closed 
                        ? (isLightTheme ? "bg-red-50 text-red-700 border border-red-200" : "bg-red-950/50 text-red-300 border border-red-900")
                        : (isLightTheme ? "bg-slate-100 text-slate-900" : "bg-slate-950 text-white border border-slate-800")
                    }`}>
                      {schedule.hours}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {store.phone && (
              <div className={`mt-6 pt-4 border-t flex items-center justify-between ${isLightTheme ? "border-slate-100" : "border-slate-800/80"}`}>
                <div>
                  <span className={`block text-[9px] font-bold uppercase tracking-wider ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>{isTr ? "REZERVASYON VE TELEFON" : "TELEPHONE & BOOKING"}</span>
                  <span className={`block text-sm font-black mt-0.5 ${isLightTheme ? "text-slate-900" : "text-white"}`}>{store.phone}</span>
                </div>
                <a
                  href={`tel:${store.phone}`}
                  className={`p-2.5 rounded-xl border transition-colors ${
                    isLightTheme ? "bg-slate-900 hover:bg-slate-800 text-white border-slate-900" : "bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
                  }`}
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>

          <div className={`p-6 rounded-2xl border shadow-xs flex flex-col justify-between ${
            isLightTheme ? "bg-white border-slate-200 text-slate-900" :
            isAmberTheme ? "bg-white border-amber-200 text-stone-900" :
            isEmeraldTheme ? "bg-white border-emerald-100 text-slate-900" :
            "bg-slate-900 border-slate-800 text-white"
          }`}>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl border ${
                  isLightTheme ? "bg-slate-100 text-slate-700 border-slate-200" : "bg-slate-950 text-slate-300 border-slate-800"
                }`}>
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`text-base font-black leading-none ${isLightTheme ? "text-slate-900" : "text-white"}`}>{isTr ? "Temassız Masa Servisi" : "Contactless Ordering"}</h3>
                  <span className={`text-[9px] uppercase tracking-wider font-bold mt-1 block ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>{isTr ? "Masa Kodunu Taratın" : "Scan & Order"}</span>
                </div>
              </div>
              
              <h4 className={`text-lg font-bold mb-2 leading-tight ${isLightTheme ? "text-slate-900" : "text-white"}`}>
                {isTr ? "Sıra beklemeden, yerinizden sipariş verin!" : "No lines. Just sit down, scan and enjoy!"}
              </h4>
              <p className={`text-xs leading-relaxed font-medium ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
                {isTr 
                  ? "Masalarımızda yer alan QR kodları taratarak doğrudan masanıza servis talebi gönderebilirsiniz." 
                  : "Simply scan the QR code at your table to quickly request service."}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Footer & Contact */}
      <footer id="contact" className="bg-slate-950 text-slate-400 pt-12 pb-8 border-t border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            <div className="space-y-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">{store.name}</h3>
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                {isTr ? "Her damak tadına hitap eden kaliteli malzemelerle bezenmiş lezzet ve konaklama reçeteleri." : "A sensory showcase of delicious culinary delights made with love."}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{isTr ? "HIZLI LİNKLER" : "QUICK LINKS"}</h4>
              <ul className="space-y-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {isHotelModuleActive && (
                  <li><a href="#rooms" onClick={() => setActiveMode('hotel')} className="hover:text-white transition-colors">{isTr ? "Otel Odaları" : "Rooms & Suites"}</a></li>
                )}
                <li><a href="#menu" onClick={() => setActiveMode('menu')} className="hover:text-white transition-colors">{isTr ? "Menümüz" : "Our Menu"}</a></li>
                <li><a href="#story" className="hover:text-white transition-colors">{isTr ? "Hikayemiz" : "Our Story"}</a></li>
                <li><a href="#hours" className="hover:text-white transition-colors">{isTr ? "Çalışma Saatleri" : "Opening Hours"}</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{isTr ? "İLETİŞİM BİLGİLERİ" : "CONTACT US"}</h4>
              <ul className="space-y-2 text-xs font-medium">
                {store.phone && (
                  <li className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{store.phone}</span>
                  </li>
                )}
                {store.address && (
                  <li className="flex items-start gap-2 leading-relaxed text-slate-300 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{store.address}</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{isTr ? "KONUMUMUZ" : "LOCATION"}</h4>
              {(() => {
                const mapsUrl = (store as any).google_maps_url || store.branding?.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address || store.name)}`;
                const rawEmbed = (store as any).google_maps_embed || store.branding?.google_maps_embed || "";
                let embedSrc = "";
                if (rawEmbed) {
                  const match = rawEmbed.match(/src=["']([^"']+)["']/);
                  if (match && match[1]) {
                    embedSrc = match[1];
                  } else if (rawEmbed.startsWith("http")) {
                    embedSrc = rawEmbed;
                  }
                }

                if (embedSrc) {
                  return (
                    <div className="space-y-2">
                      <div className="h-36 w-full rounded-2xl overflow-hidden border border-stone-800 bg-stone-900 shadow-inner relative">
                        <iframe
                          src={embedSrc}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title="Google Maps Location"
                          className="w-full h-full"
                        />
                      </div>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-amber-500 font-bold hover:underline flex items-center justify-end gap-1.5 pt-0.5"
                      >
                        <span>{isTr ? "Google Haritalar'da Aç / Yol Tarifi Al" : "Open in Google Maps / Directions"}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  );
                }

                return (
                  <div className="h-28 w-full bg-stone-900 rounded-2xl overflow-hidden border border-stone-800">
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                      <MapPin className="w-6 h-6 text-amber-500 mb-1.5 animate-bounce" />
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-amber-500 font-bold hover:underline flex items-center gap-1"
                      >
                        {isTr ? "Haritada Göster & Yol Tarifi" : "Show on Google Maps & Directions"} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })()}
            </div>

          </div>

          <div className="pt-10 border-t border-stone-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-stone-600">
            <p>© 2026 {store.name}. {isTr ? "Tüm Hakları Saklıdır." : "All Rights Reserved."}</p>
            <div className="flex items-center gap-2 text-stone-400 font-bold">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>{isTr ? "LookPrice Horeca LP Güvencesiyle Sağlanmaktadır" : "Powered by LookPrice Horeca LP"}</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};
