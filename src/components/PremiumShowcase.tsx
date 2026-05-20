import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface PremiumShowcaseProps {
  property: any; // RealEstateProperty or Vehicle
  store: any;
}

export const PremiumShowcase: React.FC<PremiumShowcaseProps> = ({ property, store }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = property.images || [];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Gallery */}
      <div className="relative h-[60vh] bg-slate-900">
        {images.length > 0 ? (
          <motion.img
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            key={currentImageIndex}
            src={images[currentImageIndex]}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-700">
            Görsel Yok
          </div>
        )}
        
        {/* Navigation */}
        <div className="absolute inset-x-0 bottom-6 flex justify-center gap-2">
            {images.map((_: any, idx: number) => (
                <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'}`}
                />
            ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-4 tracking-tighter">{property.title}</h1>
        <p className="text-xl text-slate-500 font-medium mb-12">{property.location}</p>
        
        <div className="grid md:grid-cols-3 gap-12">
            <div className="md:col-span-2">
                <h2 className="text-2xl font-black mb-6">Detaylar</h2>
                <p className="text-lg text-slate-700 leading-relaxed">{property.description}</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 self-start">
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Fiyat</span>
                <div className="text-4xl font-black text-indigo-600 mb-6">
                    {property.currency === 'GBP' ? '£' : ''}{property.price.toLocaleString()}
                </div>
                <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                    İletişime Geç
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
