import React, { useEffect, useState } from "react";
import { MoveRight, MapPin, Tag, Car, Home, Package, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

export const Marketplace = () => {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMarketplaceListings()
      .then(res => {
        setListings(res || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-indigo-600 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
           <div>
              <h1 className="text-4xl font-black tracking-tight mb-2">ENRAKİPSİZ.COM</h1>
              <p className="text-indigo-200 font-medium tracking-wide">Türkiye'nin Yeni Nesil E-Ticaret ve İlan Platformu</p>
           </div>
           <Link to="/login" className="px-6 py-2.5 bg-white text-indigo-600 rounded-2xl font-bold border border-white hover:bg-slate-50 shadow-lg shadow-indigo-900/20 active:scale-95 transition-all">
             Mağaza Girişi
           </Link>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading ? (
             <p className="text-slate-500 font-medium">İlanlar yükleniyor...</p>
          ) : (
             (Array.isArray(listings) ? listings : []).map((listing: any, index: number) => (
                <div key={index} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                   <div className="aspect-[4/3] bg-slate-100 rounded-2xl mb-4 overflow-hidden relative">
                      {listing.image_url ? (
                         <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
                      ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                           {listing.listing_type === 'vehicle' ? <Car className="w-8 h-8 opacity-20" /> : 
                            listing.listing_type === 'real_estate' ? <Home className="w-8 h-8 opacity-20" /> :
                            <Package className="w-8 h-8 opacity-20" />}
                         </div>
                      )}
                      
                      <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[9px] font-bold tracking-widest text-slate-900">
                         {listing.category}
                      </div>

                      <div className="absolute top-3 right-3 px-2 py-1 bg-indigo-600/90 text-white backdrop-blur-md rounded-lg text-[9px] font-bold tracking-widest">
                         {listing.listing_type === 'vehicle' ? 'ARAÇ' : listing.listing_type === 'real_estate' ? 'EMLAK' : 'ÜRÜN'}
                      </div>
                   </div>
                   
                   <h3 className="font-bold text-slate-900 leading-snug mb-2 line-clamp-2 min-h-[2.5rem]">
                      {listing.title}
                   </h3>
                   
                   <div className="flex items-center gap-1.5 text-slate-400 mb-4 h-4">
                     {listing.brand && (
                       <>
                         <Tag className="w-3 h-3" />
                         <span className="text-xs font-semibold">{listing.brand}</span>
                       </>
                     )}
                   </div>
                   
                   <div className="flex justify-between items-end mt-auto pt-4 border-t border-slate-50">
                     <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{listing.store_name}</p>
                       <p className="font-black text-indigo-600 text-lg">
                         {(Number(listing.price)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {listing.currency}
                       </p>
                     </div>
                   </div>

                   <Link to={`/store/${listing.store_slug}`} target="_blank" className="mt-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 group">
                      Mağazaya Git
                      <MoveRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                   </Link>
                </div>
             ))
          )}
        </div>
      </main>
    </div>
  );
};
