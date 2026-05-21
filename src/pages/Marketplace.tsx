import React, { useEffect, useState } from "react";
import { 
  MoveRight, 
  MapPin, 
  Tag, 
  Car, 
  Home, 
  Package, 
  Search, 
  Filter, 
  Building2, 
  ChevronRight,
  Sparkles,
  ArrowRight,
  LayoutGrid,
  Menu,
  Phone,
  MessageSquare
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { motion, AnimatePresence } from "motion/react";

export const Marketplace = () => {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    api.getMarketplaceListings()
      .then(res => {
        setListings(res || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredListings = (Array.isArray(listings) ? listings : []).filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.store_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "all" || item.listing_type === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: "all", label: "Tümü", icon: LayoutGrid },
    { id: "real_estate", label: "Gayrimenkul", icon: Home },
    { id: "vehicle", label: "Vasıta", icon: Car },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-black tracking-tighter text-slate-900">ENRAKİPSİZ<span className="text-indigo-600">.COM</span></span>
            </Link>
            
            <div className="hidden lg:flex items-center gap-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    activeCategory === cat.id 
                    ? 'bg-indigo-50 text-indigo-600' 
                    : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
             <Link to="/login" className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-[13px] font-bold shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95">
               Mağaza Paneli
             </Link>
             <button className="lg:hidden p-2.5 bg-slate-100 rounded-xl text-slate-600">
               <Menu className="w-5 h-5" />
             </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-indigo-500/10 to-transparent blur-[120px] rounded-full opacity-50" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[12px] font-black uppercase tracking-widest mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Türkiye'nin Yeni Nesil Portalı
            </span>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
              Aradığın Her Şey <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Tek Bir Çatı Altında.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-slate-500 text-lg font-medium mb-12">
              Gayrimenkulden vasıtaya, binlerce mağazanın ilanlarını enrakipsiz.com güvencesiyle keşfedin.
            </p>
          </motion.div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-600/10 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative flex items-center bg-white p-2 rounded-[28px] border border-slate-200 shadow-2xl shadow-slate-200/50">
                <div className="flex-1 flex items-center px-6">
                  <Search className="w-5 h-5 text-slate-400 mr-4" />
                  <input 
                    type="text"
                    placeholder="Ev, ilan veya araç ara..."
                    className="w-full bg-transparent border-none outline-none text-slate-900 font-medium placeholder:text-slate-400 h-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button className="hidden sm:flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white rounded-[22px] font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/20">
                  İlanları Bul
                </button>
                <button className="sm:hidden p-3.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/20">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <main className="max-w-7xl mx-auto px-6 pb-24">
        {/* Category Header */}
        <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
               {categories.find(c => c.id === activeCategory)?.icon && React.createElement(categories.find(c => c.id === activeCategory)!.icon, { className: "w-5 h-5 text-indigo-600" })}
             </div>
             <h3 className="text-xl font-black text-slate-900 tracking-tight">
               {categories.find(c => c.id === activeCategory)?.label} İlanları
             </h3>
          </div>
          <div className="text-[12px] font-bold text-slate-400">
            {filteredListings.length} Sonuç Listelendi
          </div>
        </div>

        {loading ? (
           <div className="flex flex-col items-center justify-center py-24">
             <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mb-4" />
             <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">İlanlar Yükleniyor...</p>
           </div>
        ) : filteredListings.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-24 bg-white border border-dashed border-slate-200 rounded-[32px] text-center px-6">
             <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                <Search className="w-8 h-8 text-slate-300" />
             </div>
             <h4 className="text-xl font-bold text-slate-900 mb-2">Henüz ilan bulunamadı</h4>
             <p className="text-slate-500 max-w-sm">Arama kriterlerinize uygun ilan bulunmuyor. Farklı bir arama yapmayı deneyin veya daha sonra tekrar kontrol edin.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
            {filteredListings.map((listing: any, index: number) => (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: index * 0.05 }}
                 key={listing.id} 
                 className="group bg-white rounded-[32px] p-4 border border-slate-150 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all duration-500 flex flex-col h-full overflow-hidden"
               >
                  {/* Image Container */}
                  <div className="aspect-[4/3] bg-slate-50 rounded-[24px] mb-5 overflow-hidden relative border border-slate-50">
                     {listing.image_url ? (
                        <img 
                          src={listing.image_url} 
                          alt={listing.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                          referrerPolicy="no-referrer"
                        />
                     ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-100/50">
                          {listing.listing_type === 'vehicle' ? <Car className="w-12 h-12 opacity-20" /> : 
                           listing.listing_type === 'real_estate' ? <Home className="w-12 h-12 opacity-20" /> :
                           <Package className="w-12 h-12 opacity-20" />}
                        </div>
                     )}
                     
                     <div className="absolute top-4 left-4">
                        <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl text-[10px] font-black uppercase text-slate-900 shadow-sm">
                           {listing.category}
                        </span>
                     </div>

                     <div className="absolute top-4 right-4">
                        <span className={`px-3 py-1.5 backdrop-blur-md rounded-xl text-[10px] font-black uppercase text-white shadow-sm transition-all ${
                          listing.listing_type === 'vehicle' ? 'bg-amber-500/90' : 
                          listing.listing_type === 'real_estate' ? 'bg-emerald-500/90' : 
                          'bg-indigo-600/90'
                        }`}>
                           {listing.listing_type === 'vehicle' ? 'VASITA' : listing.listing_type === 'real_estate' ? 'EMLAK' : 'ÜRÜN'}
                        </span>
                     </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 flex flex-col px-1">
                    <div className="mb-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
                          {listing.store_name}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-slate-900 leading-tight mb-2 line-clamp-2 min-h-[2.5rem] group-hover:text-indigo-600 transition-colors">
                        {listing.title}
                      </h3>
                      <div className="flex items-center gap-3 text-slate-500 text-xs font-bold">
                        {listing.listing_type === 'vehicle' && (
                           <>
                             <span className="flex items-center gap-1"><Car className="w-3 h-3"/> {listing.brand}</span>
                             {listing.mileage && <span className="flex items-center gap-1">📍 {listing.mileage} km</span>}
                           </>
                        )}
                        {listing.listing_type === 'real_estate' && (
                           <div className="flex flex-col gap-2 w-full">
                             <div className="flex items-center gap-3">
                               <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {listing.brand}</span>
                             </div>
                             {listing.sector_data && (
                               <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                 {listing.sector_data.room_count && (
                                   <div className="flex flex-col">
                                     <span className="text-[8px] text-slate-400 uppercase">Oda</span>
                                     <span className="text-slate-900">{listing.sector_data.room_count}</span>
                                   </div>
                                 )}
                                 {listing.sector_data.square_meters && (
                                   <div className="flex flex-col border-l border-slate-200 pl-4">
                                     <span className="text-[8px] text-slate-400 uppercase">m²</span>
                                     <span className="text-slate-900">{listing.sector_data.square_meters}</span>
                                   </div>
                                 )}
                               </div>
                             )}
                           </div>
                        )}
                        {listing.listing_type === 'product' && listing.brand && (
                           <span className="flex items-center gap-1"><Tag className="w-3 h-3"/> {listing.brand}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-5 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Fiyat</p>
                          <p className="font-black text-indigo-600 text-xl tracking-tight">
                            {(Number(listing.price)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            <span className="text-sm ml-1">{listing.currency}</span>
                          </p>
                        </div>
                        <Link to={`/store/${listing.store_slug}`} className="p-2.5 bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-2xl text-slate-400 transition-all duration-300 shadow-sm border border-slate-100">
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  </div>
               </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-black tracking-tighter text-slate-900">ENRAKİPSİZ<span className="text-indigo-600">.COM</span></span>
            </Link>
            <p className="text-slate-500 font-medium max-w-sm mb-8 leading-relaxed">
              Türkiye'nin her yerinden binlerce mağaza ve bireysel satıcıyı bir araya getiren, yeni nesil dijital ticaret platformu.
            </p>
            <div className="flex gap-4">
              <button className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-indigo-600 hover:text-white transition-all">
                <Phone className="w-4 h-4" />
              </button>
              <button className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-indigo-600 hover:text-white transition-all">
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div>
            <h4 className="text-[12px] font-black uppercase text-slate-900 tracking-widest mb-6">Kurumsal</h4>
            <ul className="space-y-4 text-sm font-bold text-slate-500">
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Hakkımızda</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Üyelik Sözleşmesi</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Kullanım Koşulları</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">KVKK Aydınlatma</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-[12px] font-black uppercase text-slate-900 tracking-widest mb-6">Mağaza</h4>
            <ul className="space-y-4 text-sm font-bold text-slate-500">
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Mağaza Aç</a></li>
              <li><Link to="/login" className="hover:text-indigo-600 transition-colors">Yönetici Paneli</Link></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Reklam ve İş Birliği</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Bize Ulaşın</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">
           <p>© 2026 ENRAKİPSİZ.COM - TÜM HAKLARI SAKLIDIR.</p>
           <div className="flex gap-8">
             <a href="#" className="hover:text-slate-900">YARDIM MERKEZİ</a>
             <a href="#" className="hover:text-slate-900">MAĞAZA PORTALI</a>
           </div>
        </div>
      </footer>
    </div>
  );
};
