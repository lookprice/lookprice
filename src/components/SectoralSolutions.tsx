import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Building2, ShoppingCart, Utensils, ArrowRight } from 'lucide-react';

export const SectoralSolutions = () => {
  const navigate = useNavigate();

  const products = [
    { name: 'AutoLP', sector: 'Otomotiv', icon: Car, link: '/auto-landing', color: 'bg-blue-600' },
    { name: 'REstateLP', sector: 'Gayrimenkul', icon: Building2, link: '/restate-landing', color: 'bg-rose-600' },
    { name: 'ShopLP', sector: 'Perakende', icon: ShoppingCart, link: '/shop-landing', color: 'bg-indigo-600' },
    { name: 'HoReCaLP', sector: 'Cafe & Restoran', icon: Utensils, link: '/horeca-landing', color: 'bg-amber-600' },
  ];

  return (
    <section className="py-24 px-6 md:px-12 lg:px-24 bg-[#050505] text-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-black text-center mb-16 tracking-tighter">
          Ürünlerimiz
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((p) => (
            <div 
              key={p.name}
              className="bg-[#0A0A0E] p-8 rounded-3xl border border-white/10 hover:border-white/20 transition-all flex flex-col items-center text-center cursor-pointer group"
              onClick={() => navigate(p.link)}
            >
              <div className={`p-4 rounded-2xl ${p.color} mb-6`}>
                <p.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-black mb-2">{p.name}</h3>
              <p className="text-white/50 mb-6 font-semibold">{p.sector}</p>
              <button className="mt-auto text-sm font-black flex items-center gap-2 group-hover:gap-3 transition-all text-white/80">
                İncele <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
