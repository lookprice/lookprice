import React, { useState, useMemo } from 'react';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  CheckCircle,
  Clock,
  Wrench,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { horecaFaq } from '../../data/horecaFaq';

interface FaqItem {
  id: string;
  q: string;
  a: string;
  category: 'siparis_odeme' | 'menu_masa' | 'stok_recete' | 'guvenlik_yetki' | 'genel';
  status: 'active' | 'in_development' | 'planned';
}

export default function FaqTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'Tümü' },
    { id: 'siparis_odeme', label: 'Sipariş & Ödeme' },
    { id: 'menu_masa', label: 'Menü & Masa Yönetimi' },
    { id: 'stok_recete', label: 'Stok & Reçete (BOM)' },
    { id: 'guvenlik_yetki', label: 'Güvenlik & Yetki' },
    { id: 'genel', label: 'Genel & Altyapı' }
  ];

  const faqItems: FaqItem[] = horecaFaq as FaqItem[];

  // Filter & Search Logic
  const filteredFaq = useMemo(() => {
    return faqItems.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const cleanQuery = searchQuery.toLowerCase().trim();
      const matchesSearch = !cleanQuery || 
        item.q.toLowerCase().includes(cleanQuery) || 
        item.a.toLowerCase().includes(cleanQuery);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const toggleAccordion = (id: string) => {
    setOpenId(prev => prev === id ? null : id);
  };

  const getStatusBadge = (status: 'active' | 'in_development' | 'planned') => {
    switch(status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle className="h-3 w-3" />
            Aktif
          </span>
        );
      case 'in_development':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-600 border border-amber-100 animate-pulse">
            <Clock className="h-3 w-3" />
            Geliştirme Aşamasında
          </span>
        );
      case 'planned':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Wrench className="h-3 w-3" />
            Planlanıyor
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50/30 rounded-3xl p-6 border border-indigo-100/40 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <HelpCircle className="h-48 w-48 text-indigo-600" />
        </div>
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100/60 rounded-full text-xs font-extrabold text-indigo-700 mb-3 border border-indigo-200/50">
            <Sparkles className="h-3.5 w-3.5" />
            LookPrice Profesyonel Bilgi Bankası
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">
            Cafe & Restorasyon Sıkça Sorulan Sorular
          </h2>
          <p className="text-sm text-slate-500 font-semibold leading-relaxed">
            Sistemimizin yetenekleri, özellikleri, devam eden Ar-Ge çalışmaları ve sektörel çözümler hakkında aradığınız tüm profesyonel cevaplar.
          </p>
        </div>
      </div>

      {/* Search & Category Filter Section */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sorularda veya cevaplarda arayın... (Örn: Çevrimdışı, Reçete, QR...)"
            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 rounded-full transition-all text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Categories Tab */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {filteredFaq.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
            <HelpCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-800 font-extrabold text-sm mb-1">Eşleşen soru bulunamadı.</p>
            <p className="text-slate-400 text-xs font-semibold">Arama kelimelerinizi değiştirmeyi veya filtreyi temizlemeyi deneyin.</p>
          </div>
        ) : (
          filteredFaq.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div 
                key={item.id}
                className={`bg-white border rounded-2xl transition-all duration-300 overflow-hidden ${
                  isOpen 
                    ? 'border-indigo-500 shadow-md shadow-indigo-600/5' 
                    : 'border-slate-100 hover:border-slate-200 shadow-xs'
                }`}
              >
                {/* Header / Question Button */}
                <button
                  type="button"
                  onClick={() => toggleAccordion(item.id)}
                  className="w-full text-left p-5 flex items-start justify-between gap-4 cursor-pointer focus:outline-none"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(item.status)}
                      <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                        {categories.find(c => c.id === item.category)?.label}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-slate-800 text-sm sm:text-base leading-snug">
                      {item.q}
                    </h3>
                  </div>
                  <div className={`mt-1 h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    isOpen ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {/* Collapse Body */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="px-5 pb-5 pt-1 border-t border-slate-50">
                        <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-100/80 text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
                          {item.a}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
