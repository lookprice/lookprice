import React from "react";
import { Link } from "react-router-dom";
import { MapPin, CheckCircle2, ExternalLink } from "lucide-react";
import { ListingCardImage } from "./ListingCardImage";
import { formatLocation, getSquareMeters, getVehicleMileage, getVehicleYear } from "../../utils/marketplace";
import { formatFuelType, formatTransmission } from "../../utils/formatUtils";

export const MarketplaceListingGrid = ({ 
  listings, 
  visibleCount, 
  viewMode, 
  isDarkMode, 
  cardBg, 
  setSelectedListing,
  mainTab,
  rePropertyType
}: {
  listings: any[],
  visibleCount: number,
  viewMode: "rich" | "list",
  isDarkMode: boolean,
  cardBg: string,
  setSelectedListing: (listing: any) => void,
  mainTab: string,
  rePropertyType: string
}) => {
  return (
    <div>
      {viewMode === "rich" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.slice(0, visibleCount).map((listing: any) => (
            <article 
              key={listing.id}
              className={`group ${cardBg} rounded-3xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between`}
            >
              <div>
                <ListingCardImage 
                  listing={listing} 
                  aspect="aspect-[16/10]" 
                  className="rounded-2xl mb-4" 
                  onImageClick={() => setSelectedListing(listing)} 
                />

                <h3 
                  onClick={() => setSelectedListing(listing)}
                  className={`font-extrabold text-base leading-snug mb-2 line-clamp-2 hover:text-blue-400 cursor-pointer transition-colors ${isDarkMode ? "text-white" : "text-slate-900"}`}
                >
                  {listing.title}
                </h3>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {listing.listing_type === "vehicle" && (
                    <>
                      <span className="text-[11px] font-bold text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                        KM: {listing.mileage ? Math.round(Number(listing.mileage)).toLocaleString('tr-TR') : (listing.sector_data?.km ? Number(listing.sector_data.km).toLocaleString('tr-TR') : 'Sıfır')}
                      </span>
                      {listing.brand && (
                        <span className="text-[11px] font-bold text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                          {listing.brand}
                        </span>
                      )}
                      {(() => {
                        const rawFuel = listing.fuel_type || listing.fuel || listing.sector_data?.fuel_type || listing.sector_data?.fuel;
                        if (!rawFuel) return null;
                        return (
                          <span className="text-[11px] font-bold text-amber-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                            {formatFuelType(rawFuel)}
                          </span>
                        );
                      })()}
                      {(() => {
                        const rawTrans = listing.transmission || listing.vites || listing.sector_data?.transmission || listing.sector_data?.vites;
                        if (!rawTrans) return null;
                        return (
                          <span className="text-[11px] font-bold text-blue-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                            {formatTransmission(rawTrans)}
                          </span>
                        );
                      })()}
                    </>
                  )}

                  {listing.listing_type === "real_estate" && (
                    <>
                      {listing.sector_data?.rooms && (
                        <span className="text-[11px] font-bold text-blue-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                          {listing.sector_data.rooms} Oda
                        </span>
                      )}
                      {getSquareMeters(listing) && (
                        <span className="text-[11px] font-bold text-emerald-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                          {getSquareMeters(listing)} m²
                        </span>
                      )}
                      {(listing.sector_data?.city || listing.location) && (
                        <span className="text-[11px] font-bold text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-500" />
                          {listing.sector_data?.city || listing.location}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className={`pt-4 border-t ${isDarkMode ? "border-slate-800/80" : "border-slate-200"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Satıcı Mağaza</span>
                    <span className={`text-xs font-black flex items-center gap-1 ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      {listing.store_name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      {Math.round(Number(listing.price) || 0).toLocaleString('tr-TR')} <span className={`text-xs ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>{listing.currency || 'TRY'}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setSelectedListing(listing)}
                    className="py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold border border-slate-800 transition"
                  >
                    Hızlı İncele
                  </button>
                  <Link 
                    to={`/s/${listing.store_slug}/p/${listing.barcode || listing.id}`}
                    target="_blank"
                    className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold text-center transition flex items-center justify-center gap-1"
                  >
                    <span>Mağazaya Git</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {viewMode === "list" && (
        <div className={`overflow-x-auto rounded-2xl border ${isDarkMode ? "border-slate-800 bg-slate-950/90 shadow-xl" : "border-slate-200 bg-white shadow-md"}`}>
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className={`${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-700"} border-b font-black uppercase text-[11px] tracking-wider`}>
                <th className={`p-3 text-right font-black uppercase text-[11px] tracking-wider text-rose-600 dark:text-rose-400 border-r sticky left-0 z-20 shadow-md ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"} min-w-[130px]`}>
                  Fiyat
                </th>
                <th className={`p-3 w-36 text-center border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>Fotoğraf</th>
                {mainTab === "vehicle" ? (
                  <>
                    <th className={`p-3 border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>Marka</th>
                    <th className={`p-3 border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>Yakıt</th>
                    <th className={`p-3 border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>Model</th>
                    <th className={`p-3 border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"} min-w-[220px]`}>İlan Başlığı</th>
                    <th className={`p-3 text-center border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>Yıl</th>
                    <th className={`p-3 text-right border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>KM</th>
                    <th className={`p-3 text-center border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>Vites Tipi</th>
                    <th className={`p-3 ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>İl / İlçe</th>
                  </>
                ) : (
                  <>
                    <th className={`p-3 border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>Kategori / Tip</th>
                    {rePropertyType === "land" ? (
                      <th className={`p-3 text-center border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>Koçan Tipi</th>
                    ) : (
                      <th className={`p-3 text-center border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>Oda</th>
                    )}
                    <th className={`p-3 text-right border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>{rePropertyType === "land" ? "Arsa Alanı" : "m² (Net)"}</th>
                    <th className={`p-3 border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"} min-w-[220px]`}>İlan Başlığı</th>
                    {rePropertyType === "land" ? (
                      <th className={`p-3 text-center border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>İmar Durumu</th>
                    ) : (
                      <th className={`p-3 text-center border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>Isınma / Kat</th>
                    )}
                    <th className={`p-3 text-center border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>İlan Tarihi</th>
                    <th className={`p-3 ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>İl / İlçe</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-slate-800/60" : "divide-slate-200"}`}>
              {listings.slice(0, visibleCount).map((listing: any) => {
                const price = Math.round(Number(listing.price) || 0).toLocaleString('tr-TR');
                const currency = listing.currency || 'TL';
                const dateStr = listing.created_at 
                  ? new Date(listing.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '12 Ağustos 2026';
                const loc = formatLocation(listing);

                if (mainTab === "vehicle" || listing.listing_type === "vehicle") {
                  const brand = listing.brand || listing.sector_data?.brand || "-";
                  
                  const rawFuel = listing.fuel_type || listing.sector_data?.fuel_type || listing.sector_data?.fuel || listing.fuel;
                  const fuelType = formatFuelType(rawFuel);

                  const rawTrans = listing.transmission || listing.sector_data?.transmission || listing.sector_data?.vites || listing.vites;
                  const transType = formatTransmission(rawTrans);

                  const model = listing.model || listing.sector_data?.model || listing.category || "-";
                  const year = getVehicleYear(listing);
                  const km = getVehicleMileage(listing);

                  return (
                    <tr 
                      key={listing.id} 
                      className={`transition-colors border-b ${isDarkMode ? "hover:bg-blue-950/30 border-slate-800/50" : "hover:bg-slate-50 border-slate-200"} group`}
                    >
                      <td className={`p-3 text-right font-black text-rose-600 dark:text-rose-500 text-sm md:text-base border-r ${isDarkMode ? "border-slate-800/60 bg-slate-950 group-hover:bg-blue-950/40" : "border-slate-200 bg-white group-hover:bg-slate-50"} sticky left-0 z-10 shadow-md align-middle whitespace-nowrap`}>
                        {price} {currency}
                      </td>
                      <td className={`p-2 border-r ${isDarkMode ? "border-slate-800/60" : "border-slate-200"} align-middle`}>
                        <ListingCardImage 
                          listing={listing} 
                          aspect="aspect-[4/3]" 
                          className="w-32 h-20 rounded-xl" 
                          disableBadges={true}
                          disableCarousel={true}
                        />
                      </td>
                      <td className="p-3 border-r text-center font-bold">{brand}</td>
                      <td className="p-3 border-r text-center font-semibold text-amber-600 dark:text-amber-400">{fuelType}</td>
                      <td className="p-3 border-r text-center">{model}</td>
                      <td className="p-3 border-r text-xs font-bold">{listing.title}</td>
                      <td className="p-3 border-r text-center font-bold">{year}</td>
                      <td className="p-3 border-r text-right font-semibold">{km}</td>
                      <td className="p-3 border-r text-center font-bold text-blue-600 dark:text-blue-400">{transType}</td>
                      <td className="p-3 text-center">{loc}</td>
                    </tr>
                  );
                } else {
                  // Real Estate Row
                  const catType = listing.sector_data?.type || listing.category || "-";
                  const rooms = listing.sector_data?.rooms || listing.sector_data?.oda || listing.room_count || "-";
                  const area = getSquareMeters(listing) || "-";

                  const isRent = listing.listing_intent === 'rent' || listing.intent === 'rent' || listing.sector_data?.listing_intent === 'rent' || listing.sector_data?.intent === 'rent' || listing.fihrist_type === 'kiralik';

                  const rawKocan = listing.kocan_type || listing.kktc_title_type || listing.deed_type || listing.sector_data?.kocan_type || listing.sector_data?.kktc_title_type || listing.sector_data?.deed_type || listing.sector_data?.kocan || listing.sector_data?.title_deed;
                  const kocanTipi = isRent ? "-" : (rawKocan || "-");

                  const rawImar = listing.zoning_status || listing.imar_durumu || listing.zoning || listing.sector_data?.zoning_status || listing.sector_data?.imar_durumu || listing.sector_data?.zoning || listing.sector_data?.zoning_type;
                  const imarDurumu = rawImar || "-";

                  const col4Val = rePropertyType === "land" ? kocanTipi : rooms;
                  const col7Val = rePropertyType === "land" ? imarDurumu : (listing.sector_data?.heating || listing.sector_data?.floor || "-");

                  return (
                    <tr key={listing.id} className={`transition-colors border-b ${isDarkMode ? "hover:bg-blue-950/30 border-slate-800/50" : "hover:bg-slate-50 border-slate-200"} group`}>
                      <td className={`p-3 text-right font-black text-rose-600 dark:text-rose-500 text-sm md:text-base border-r ${isDarkMode ? "border-slate-800/60 bg-slate-950 group-hover:bg-blue-950/40" : "border-slate-200 bg-white group-hover:bg-slate-50"} sticky left-0 z-10 shadow-md align-middle whitespace-nowrap`}>
                        {price} {currency}
                      </td>
                      <td className={`p-2 border-r ${isDarkMode ? "border-slate-800/60" : "border-slate-200"} align-middle`}>
                        <ListingCardImage 
                          listing={listing} 
                          aspect="aspect-[4/3]" 
                          className="w-32 h-20 rounded-xl" 
                          disableBadges={true}
                          disableCarousel={true}
                        />
                      </td>
                      <td className="p-3 border-r text-center">{catType}</td>
                      <td className="p-3 border-r text-center font-bold">{col4Val}</td>
                      <td className="p-3 border-r text-right">{area} {area !== "-" && "m²"}</td>
                      <td className="p-3 border-r text-xs font-bold">{listing.title}</td>
                      <td className="p-3 border-r text-center">{col7Val}</td>
                      <td className="p-3 border-r text-center">{dateStr}</td>
                      <td className="p-3 text-center">{loc}</td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
