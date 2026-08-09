import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  Car, 
  MapPin, 
  Search, 
  Bed,
  Maximize,
  Gauge,
  Calendar,
  Fuel,
  ArrowRight,
  LayoutGrid,
  List as ListIcon,
  Tag,
  Key
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../services/api";
import SEO from "./SEO";
import { IDXSplitMapView } from "./IDXSplitMapView";

export const LandingPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"real_estate" | "vehicle">("real_estate");
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // General Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Vehicle Filters
  const [vehCategory, setVehCategory] = useState("all");
  const [vehBrand, setVehBrand] = useState("all");

  useEffect(() => {
    document.title = "enrakipsiz.com | Zarif ve Kolay Bul";
    api.getMarketplaceListings()
      .then(res => setListings(res || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredVehicleListings = useMemo(() => {
    return listings.filter(item => {
      if (item.status && item.status !== 'active') return false;
      if (item.listing_type !== 'vehicle') return false;
      
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const title = String(item.name || "").toLowerCase();
        if (!title.includes(q)) return false;
      }

      if (vehCategory !== "all") {
        const itemCat = String(item.sector_data?.category || item.category || "").toLowerCase();
        if (itemCat !== vehCategory.toLowerCase()) return false;
      }
      if (vehBrand !== "all") {
        const itemBrand = String(item.brand || item.sector_data?.brand || item.sector_data?.brand_name || "").toLowerCase();
        if (itemBrand !== vehBrand.toLowerCase()) return false;
      }
      return true;
    });
  }, [listings, searchQuery, vehCategory, vehBrand]);

  const realEstateListings = useMemo(() => {
    return listings.filter(item => {
      if (item.status && item.status !== 'active') return false;
      if (item.listing_type === 'real_estate' || item.sector === 'real_estate') return true;
      return false;
    });
  }, [listings]);

  const vehCategories = useMemo(() => Array.from(new Set(
    listings.filter(l => l.listing_type === 'vehicle').map(l => l.sector_data?.category || l.category).filter(Boolean)
  )), [listings]);

  const vehBrands = useMemo(() => Array.from(new Set(
    listings.filter(l => l.listing_type === 'vehicle').map(l => l.brand || l.sector_data?.brand || l.sector_data?.brand_name).filter(Boolean)
  )), [listings]);

  const formatPrice = (price: number, currency: string = "TRY") => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: currency || "TRY",
      maximumFractionDigits: 0
    }).format(price || 0);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans selection:bg-pink-200">
      <SEO 
        title="enrakipsiz.com | Zarif ve Kolay Bul" 
        description="Emlak ve Otomotiv dünyasında aradığınızı en zarif şekilde bulun."
      />

      {/* Header / Fihrist Tab */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-rose-50 shadow-[0_4px_30px_-10px_rgba(251,113,133,0.08)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between py-5 gap-6">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-300 to-rose-300 flex items-center justify-center text-white shadow-lg shadow-pink-200/50">
                <SparklesIcon className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                en<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">rakipsiz</span>
              </h1>
            </div>

            <div className="flex bg-slate-50 p-1.5 rounded-full border border-slate-100">
              <button
                onClick={() => { setActiveTab("real_estate"); setSearchQuery(""); }}
                className={`relative flex items-center gap-2 px-8 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                  activeTab === "real_estate" 
                    ? "text-rose-600 bg-white shadow-sm ring-1 ring-rose-100" 
                    : "text-slate-500 hover:text-rose-500 hover:bg-rose-50"
                }`}
              >
                <Building2 className="w-4 h-4" />
                Emlak
              </button>
              <button
                onClick={() => { setActiveTab("vehicle"); setSearchQuery(""); }}
                className={`relative flex items-center gap-2 px-8 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                  activeTab === "vehicle" 
                    ? "text-sky-600 bg-white shadow-sm ring-1 ring-sky-100" 
                    : "text-slate-500 hover:text-sky-500 hover:bg-sky-50"
                }`}
              >
                <Car className="w-4 h-4" />
                Otomotiv
              </button>
            </div>

            {activeTab === "vehicle" && (
              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                <button 
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-sky-100 text-sky-600" : "text-slate-400 hover:bg-slate-100"}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-sky-100 text-sky-600" : "text-slate-400 hover:bg-slate-100"}`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {activeTab === "real_estate" && (
              <div className="w-[84px]"></div> // spacer to keep center aligned
            )}

          </div>
        </div>
      </header>

      {activeTab === "real_estate" ? (
        <div className="w-full relative">
          {loading ? (
             <div className="flex justify-center items-center py-32">
               <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin border-rose-300"></div>
             </div>
          ) : (
            <IDXSplitMapView
              products={realEstateListings as any[]}
              store={{
                id: "marketplace",
                name: "enrakipsiz.com",
                phone: "+905550000000",
                whatsapp_number: "+905550000000",
                currency: "TRY",
                consultants: [],
                branding: {
                    store_name: "enrakipsiz.com Emlak"
                }
              } as any}
              lang="tr"
              onViewProduct={(p) => {
                navigate(`/s/${p.store_slug}/p/${p.db_id}`);
              }}
              formatPrice={formatPrice}
            />
          )}
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Dynamic Filters Section */}
          <div className="mb-10 space-y-6">
            
            {/* Main Search Bar */}
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-sky-300" />
              <input 
                type="text" 
                placeholder="Hayalindeki aracı ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-4 py-4 rounded-[2rem] bg-white border-2 outline-none transition-colors border-sky-100 focus:border-sky-300 text-sky-900 placeholder-sky-200 font-medium text-lg shadow-sm"
              />
            </div>

            {/* Vehicle Specific Filters */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex-1 min-w-[200px]">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Araç Sınıfı</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setVehCategory("all")} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${vehCategory === 'all' ? 'bg-sky-100 text-sky-700' : 'bg-slate-50 text-slate-600 hover:bg-sky-50 hover:text-sky-600'}`}>
                    Tümü
                  </button>
                  {vehCategories.map(cat => (
                    <button key={String(cat)} onClick={() => setVehCategory(String(cat))} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${vehCategory === String(cat) ? 'bg-sky-100 text-sky-700' : 'bg-slate-50 text-slate-600 hover:bg-sky-50 hover:text-sky-600'}`}>
                      {String(cat)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-px h-12 bg-slate-100 hidden md:block"></div>

              <div className="flex-1 min-w-[200px]">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Marka</p>
                <select
                  value={vehBrand}
                  onChange={(e) => setVehBrand(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 border-none outline-none text-slate-700 font-bold text-sm focus:ring-2 focus:ring-sky-200 transition-shadow appearance-none"
                >
                  <option value="all">Tüm Markalar</option>
                  {vehBrands.map(b => (
                    <option key={String(b)} value={String(b)}>{String(b)}</option>
                  ))}
                </select>
              </div>
            </motion.div>
          </div>

          {/* Listings Result */}
          {loading ? (
            <div className="flex justify-center items-center py-32">
              <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin border-sky-300"></div>
            </div>
          ) : filteredVehicleListings.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-[2rem] border border-dashed border-slate-200 shadow-sm">
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 bg-sky-50 text-sky-300">
                <Search className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-700">Sonuç Bulunamadı</h3>
              <p className="text-slate-400 mt-2">Başka kelimelerle veya filtrelerle tekrar deneyin.</p>
            </div>
          ) : (
            <motion.div 
              layout
              className={viewMode === "grid" 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "flex flex-col gap-4"
              }
            >
              <AnimatePresence mode="popLayout">
                {filteredVehicleListings.map(listing => {
                  const intentBadgeColor = 'bg-sky-100 text-sky-700';

                  if (viewMode === "list") {
                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        key={listing.id}
                        className="group bg-white rounded-3xl p-4 border border-slate-100 hover:border-transparent hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row gap-6 cursor-pointer"
                        onClick={() => navigate(`/s/${listing.store_slug}/p/${listing.db_id}`)}
                      >
                        <div className="w-full md:w-64 h-48 rounded-2xl overflow-hidden relative bg-slate-50 shrink-0">
                          <img 
                            src={listing.image_url || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000"} 
                            alt={listing.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute top-3 left-3">
                            <div className={`px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider shadow-sm ${intentBadgeColor}`}>
                              Otomotiv
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="flex justify-between items-start mb-2 gap-4">
                            <h3 className="font-black text-slate-800 text-xl leading-tight line-clamp-2">
                              {listing.name}
                            </h3>
                            <p className="text-2xl font-black shrink-0 text-sky-600">
                              {formatPrice(listing.price, listing.currency)}
                            </p>
                          </div>
                          <p className="text-sm text-slate-500 mb-6 flex items-center gap-1 font-bold">
                            <MapPin className="w-4 h-4" />
                            {listing.sector_data?.kktc_region || listing.sector_data?.city || listing.location}
                          </p>

                          <div className="flex gap-6 mt-auto">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-400"><Calendar className="w-4 h-4" /></div>
                              <span className="text-sm font-bold text-slate-600">{listing.sector_data?.year || "-"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-400"><Gauge className="w-4 h-4" /></div>
                              <span className="text-sm font-bold text-slate-600">{listing.sector_data?.mileage ? `${listing.sector_data.mileage} km` : "-"}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  }

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      key={listing.id}
                      className="group bg-white rounded-[2rem] p-4 border border-slate-100 hover:border-transparent hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 flex flex-col cursor-pointer"
                      onClick={() => navigate(`/s/${listing.store_slug}/p/${listing.db_id}`)}
                    >
                      <div className="aspect-[4/3] rounded-2xl mb-5 overflow-hidden relative bg-slate-50">
                        <img 
                          src={listing.image_url || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000"} 
                          alt={listing.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute top-3 left-3">
                          <div className={`px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider shadow-sm ${intentBadgeColor}`}>
                            Otomotiv
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col px-2">
                        <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1 line-clamp-2">
                          {listing.name}
                        </h3>
                        <p className="text-sm text-slate-500 mb-4 flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5" />
                          {listing.sector_data?.kktc_region || listing.sector_data?.city || listing.location}
                        </p>

                        {/* Specs Bento */}
                        <div className="grid grid-cols-3 gap-2 mb-6 p-3 rounded-2xl bg-sky-50/50">
                          <div className="flex flex-col items-center justify-center text-center">
                            <Calendar className="w-4 h-4 mb-1 text-sky-400" />
                            <span className="text-xs font-bold text-slate-600">{listing.sector_data?.year || "-"}</span>
                          </div>
                          <div className="flex flex-col items-center justify-center text-center border-x border-slate-200/50">
                            <Gauge className="w-4 h-4 mb-1 text-sky-400" />
                            <span className="text-xs font-bold text-slate-600">{listing.sector_data?.mileage ? `${listing.sector_data.mileage} km` : "-"}</span>
                          </div>
                          <div className="flex flex-col items-center justify-center text-center">
                            <Fuel className="w-4 h-4 mb-1 text-sky-400" />
                            <span className="text-xs font-bold text-slate-600 truncate w-full px-1">{listing.sector_data?.fuel_type || "-"}</span>
                          </div>
                        </div>

                        <div className="mt-auto flex items-end justify-between pt-4 border-t border-slate-100">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Fiyat</p>
                            <p className="text-xl font-black text-sky-600">
                              {formatPrice(listing.price, listing.currency)}
                            </p>
                          </div>
                          <button className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors bg-sky-100 text-sky-600 group-hover:bg-sky-600 group-hover:text-white">
                            <ArrowRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </main>
      )}
    </div>
  );
};

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}
