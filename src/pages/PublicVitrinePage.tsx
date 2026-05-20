import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { RealEstateProperty, Vehicle } from "../types";
import { MessageCircle, MapPin, Eye, Home, Truck, Check, Star } from "lucide-react";
import { motion } from "motion/react";

export const PublicVitrinePage: React.FC = () => {
  const { storeIdentifier } = useParams<{ storeIdentifier: string }>();
  const [store, setStore] = useState<any>(null);
  const [properties, setProperties] = useState<RealEstateProperty[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storeIdentifier) {
      api.getPublicVitrine(storeIdentifier)
        .then((res: any) => {
          setStore(res.store);
          setProperties(res.properties || []);
          setVehicles(res.vehicles || []);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error loading vitrine:", err);
          setLoading(false);
        });
    }
  }, [storeIdentifier]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-sans">Yükleniyor...</div>;
  if (!store) return <div className="min-h-screen flex items-center justify-center font-sans">Mağaza bulunamadı.</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
            <h1 className="text-3xl font-black tracking-tighter text-slate-950">{store.name}</h1>
            <a href={`https://wa.me/${store.whatsapp_number?.replace(/[^0-9]/g, '')}`} target="_blank" className="bg-emerald-600 text-white px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all active:scale-95">
              <MessageCircle className="w-4 h-4" /> WhatsApp ile İletişim
            </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-16">
          <h2 className="text-4xl font-black mb-10 flex items-center gap-3 text-slate-950"><Home className="text-emerald-600 w-8 h-8" /> Öne Çıkan Gayrimenkuller</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((p, i) => (
              <motion.div 
                key={p.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col"
              >
                <div className="h-64 bg-slate-100 rounded-[1.5rem] mb-5 overflow-hidden relative">
                   <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                   <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-900 shadow-sm flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {p.status}
                   </div>
                </div>
                <h3 className="text-2xl font-black mb-2 tracking-tight text-slate-950 flex-grow">{p.title}</h3>
                <div className="flex items-center text-slate-500 text-sm mb-5 gap-2">
                    <MapPin className="w-4 h-4" /> {p.location}
                </div>
                
                {p.listing_features && p.listing_features.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {p.listing_features.slice(0, 3).map(f => (
                            <span key={f} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{f}</span>
                        ))}
                    </div>
                )}

                <div className="flex justify-between items-center mt-auto">
                    <span className="text-3xl font-black">{p.price.toLocaleString()} <span className="text-lg text-slate-400 font-medium">{p.currency}</span></span>
                    <button className="p-4 bg-slate-950 text-white rounded-full hover:bg-slate-800 transition-colors">
                        <Eye className="w-5 h-5" />
                    </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-4xl font-black mb-10 flex items-center gap-3 text-slate-950"><Truck className="text-indigo-600 w-8 h-8" /> Araç Filosu</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vehicles.map(v => (
              <div key={v.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all">
                <h3 className="text-lg font-bold text-slate-950">{v.brand} {v.model}</h3>
                <p className="text-slate-500 text-sm mb-4">{v.year}</p>
                <div className="text-2xl font-black">{v.selling_price?.toLocaleString()} <span className="text-lg text-slate-400 font-medium">{v.currency}</span></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

