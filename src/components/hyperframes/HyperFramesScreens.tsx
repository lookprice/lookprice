import React from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Search, 
  Check, 
  CheckCircle2, 
  Calendar, 
  Wifi, 
  Coffee, 
  Tv, 
  ShieldCheck, 
  Layers, 
  CreditCard, 
  ShoppingBag, 
  Barcode, 
  Printer, 
  ArrowRight,
  Star,
  Flame,
  Clock,
  Send
} from 'lucide-react';

// ==========================================
// 1. SCENARIO: BookNavScreen
// ==========================================
interface BookNavScreenProps {
  activeBookIndex: number;
  highlightBar: boolean;
}

const BOOKS = [
  {
    title: "Kürk Mantolu Madonna",
    author: "Sabahattin Ali",
    publisher: "Yapı Kredi Yayınları",
    price: "185 ₺",
    pages: "160",
    isbn: "9789750800726",
    cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80",
    quote: "Kimi insan vardır, ilk görüşte seversiniz; kimi insan vardır, senelerce tanısanız da bir türlü alışamazsınız...",
    tags: ["Klasik", "Türk Edebiyatı", "Roman"]
  },
  {
    title: "Tutunamayanlar",
    author: "Oğuz Atay",
    publisher: "İletişim Yayınları",
    price: "340 ₺",
    pages: "724",
    isbn: "9789754700114",
    cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80",
    quote: "Ben buradayım sevgili okuyucum, sen neredesin acaba?",
    tags: ["Başyapıt", "Modern Klasik", "Roman"]
  },
  {
    title: "Saatleri Ayarlama Enstitüsü",
    author: "Ahmet Hamdi Tanpınar",
    publisher: "Dergâh Yayınları",
    price: "220 ₺",
    pages: "382",
    isbn: "9789759955755",
    cover: "https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&w=600&q=80",
    quote: "Ne içindeyim zamanın, ne de büsbütün dışında; yekpare, geniş bir anın, parçalanmaz akışında...",
    tags: ["Hiciv", "Felsefi Roman", "Kült"]
  }
];

export function BookNavScreen({ activeBookIndex, highlightBar }: BookNavScreenProps) {
  const current = BOOKS[Math.min(activeBookIndex, BOOKS.length - 1)];

  return (
    <div className="w-full h-full bg-[#0c0a14] text-white flex flex-col justify-between p-4 sm:p-6 select-none relative overflow-hidden font-sans">
      {/* Background ambient gradient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar Simulation */}
      <div className="flex items-center justify-between pb-3 border-b border-purple-500/10 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white tracking-wide">LOOKPRICE <span className="text-purple-400">BookLP</span></span>
            <span className="text-[10px] text-purple-300/60 block leading-tight">Sinematik Kitapçı & Yayınevi</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/70">
            <Search className="w-3 h-3 text-purple-400" />
            <span>ISBN veya Eser Ara...</span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            CANLI VİTRİN
          </span>
        </div>
      </div>

      {/* Main Book Detail Area */}
      <div className="flex-1 flex flex-col md:flex-row items-center gap-4 md:gap-8 py-4 z-10">
        {/* Book Cover with 3D shadow */}
        <div className="relative group shrink-0">
          <div className="w-32 h-44 sm:w-40 sm:h-56 rounded-xl overflow-hidden shadow-2xl shadow-purple-950/60 border border-white/10 transition-all duration-500 transform group-hover:scale-105">
            <img 
              src={current.cover} 
              alt={current.title} 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-black shadow-lg">
            {current.pages} Sayfa
          </div>
        </div>

        {/* Book Information */}
        <div className="flex-1 space-y-2.5 text-left min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {current.tags.map((t, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                {t}
              </span>
            ))}
            <span className="text-[10px] text-white/40 font-mono ml-auto">ISBN: {current.isbn}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
            {current.title}
          </h2>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-purple-400 font-semibold">{current.author}</span>
            <span className="text-white/30">•</span>
            <span className="text-white/60">{current.publisher}</span>
          </div>

          <p className="text-xs text-white/70 italic bg-purple-950/30 p-2.5 rounded-lg border border-purple-500/20 line-clamp-2 leading-relaxed">
            "{current.quote}"
          </p>

          <div className="flex items-center gap-4 pt-1">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-purple-300 font-bold block">ÖZEL FİYAT</span>
              <span className="text-2xl font-black text-white">{current.price}</span>
            </div>
            <button className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition-all">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Sepete Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contemporary Floating Catalog Switcher */}
      <div className={`mt-auto pt-2 transition-all duration-500 ${highlightBar ? 'scale-[1.02]' : ''}`}>
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[11px] font-bold text-white/90 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Öne Çıkan Diğer Eserler
          </span>
          <span className="text-[10px] text-purple-300/80 font-medium">Hızlı Geçiş</span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 bg-white/[0.03] backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl">
          {BOOKS.map((b, idx) => {
            const isSelected = activeBookIndex === idx;
            return (
              <div 
                key={idx}
                className={`flex items-center gap-2.5 p-2 rounded-xl transition-all duration-300 cursor-pointer ${
                  isSelected 
                    ? 'bg-gradient-to-r from-purple-600/40 to-indigo-600/30 border border-purple-400 text-white shadow-lg shadow-purple-500/20' 
                    : 'bg-white/[0.02] border border-white/5 text-white/70 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                <img src={b.cover} alt={b.title} className="w-8 h-10 object-cover rounded-lg shadow-md shrink-0 ring-1 ring-white/10" />
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-[11px] font-bold truncate leading-tight">{b.title}</p>
                  <p className="text-[10px] font-mono text-purple-300 truncate mt-0.5">{b.price}</p>
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-purple-400 shadow-sm shadow-purple-400 shrink-0 mr-1 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. SCENARIO: BookIsbnScreen
// ==========================================
interface BookIsbnScreenProps {
  isbnValue: string;
  isScanning: boolean;
  isAutoFilled: boolean;
  priceValue?: string;
  isSaved: boolean;
}

export function BookIsbnScreen({ 
  isbnValue, 
  isScanning, 
  isAutoFilled, 
  priceValue, 
  isSaved 
}: BookIsbnScreenProps) {
  return (
    <div className="w-full h-full bg-[#0a0c16] text-white flex flex-col p-4 sm:p-6 select-none relative overflow-hidden font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-purple-500/10 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center">
            <Barcode className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-white tracking-wide">Kitap Kataloğu & ISBN Yönetimi</span>
            <span className="text-[10px] text-purple-300/60 block leading-tight">Akıllı Barkod Çözümleme</span>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
          OPERATÖR PANELİ
        </span>
      </div>

      {/* ISBN Input & Scan Bar */}
      <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full relative">
          <label className="text-[10px] uppercase tracking-wider font-bold text-purple-300 mb-1 block text-left">
            ISBN / BARKOD OKUT
          </label>
          <div className="relative">
            <input 
              readOnly 
              value={isbnValue} 
              className="w-full px-3 py-2 bg-black/60 border border-purple-500/40 rounded-lg text-sm font-mono text-purple-200 focus:outline-none"
              placeholder="978..."
            />
            <Barcode className="w-4 h-4 text-purple-400 absolute right-3 top-2.5" />
          </div>
        </div>

        <button 
          className={`w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all mt-3 sm:mt-5 ${
            isScanning 
              ? 'bg-purple-500 text-white animate-pulse shadow-lg shadow-purple-500/40' 
              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'Katalog Taranıyor...' : 'Akıllı ISBN Çözümle'}</span>
        </button>
      </div>

      {/* Auto-filled Form Fields */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 overflow-hidden">
        {/* Left 2 Cols: Form Data */}
        <div className="md:col-span-2 space-y-2.5 text-left">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-white/50 block">Eser Adı</span>
              <div className={`p-2 rounded bg-black/40 border text-xs font-semibold truncate transition-all ${isAutoFilled ? 'border-emerald-500/50 text-white bg-emerald-950/20' : 'border-white/10 text-white/30'}`}>
                {isAutoFilled ? 'Kürk Mantolu Madonna' : '—'}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-white/50 block">Yazar</span>
              <div className={`p-2 rounded bg-black/40 border text-xs font-semibold truncate transition-all ${isAutoFilled ? 'border-emerald-500/50 text-purple-300 bg-emerald-950/20' : 'border-white/10 text-white/30'}`}>
                {isAutoFilled ? 'Sabahattin Ali' : '—'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="text-[10px] text-white/50 block">Yayınevi</span>
              <div className={`p-2 rounded bg-black/40 border text-xs font-semibold truncate transition-all ${isAutoFilled ? 'border-emerald-500/50 text-white bg-emerald-950/20' : 'border-white/10 text-white/30'}`}>
                {isAutoFilled ? 'Yapı Kredi Yayınları' : '—'}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-white/50 block">Sayfa Sayısı</span>
              <div className={`p-2 rounded bg-black/40 border text-xs font-semibold truncate transition-all ${isAutoFilled ? 'border-emerald-500/50 text-white bg-emerald-950/20' : 'border-white/10 text-white/30'}`}>
                {isAutoFilled ? '160 Sayfa' : '—'}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-white/50 block">Basım Yılı</span>
              <div className={`p-2 rounded bg-black/40 border text-xs font-semibold truncate transition-all ${isAutoFilled ? 'border-emerald-500/50 text-white bg-emerald-950/20' : 'border-white/10 text-white/30'}`}>
                {isAutoFilled ? '2024 (82. Baskı)' : '—'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-white/50 block">Kategori</span>
              <div className={`p-2 rounded bg-black/40 border text-xs font-semibold truncate transition-all ${isAutoFilled ? 'border-emerald-500/50 text-white bg-emerald-950/20' : 'border-white/10 text-white/30'}`}>
                {isAutoFilled ? 'Türk Klasikleri / Roman' : '—'}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 font-bold block">Satış Fiyatı</span>
              <div className={`p-2 rounded bg-black/40 border text-xs font-black truncate transition-all ${priceValue ? 'border-emerald-500 text-emerald-300 bg-emerald-950/40' : 'border-white/10 text-white/30'}`}>
                {priceValue || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Live Card Preview */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-3 flex flex-col items-center justify-center text-center relative">
          {isAutoFilled ? (
            <div className="space-y-2 animate-fadeIn">
              <img 
                src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80" 
                alt="Book" 
                className="w-20 h-28 object-cover rounded-lg shadow-lg border border-purple-500/40 mx-auto" 
              />
              <p className="text-xs font-bold text-white truncate">Kürk Mantolu Madonna</p>
              <p className="text-[10px] text-purple-300">Sabahattin Ali • {priceValue || '185 ₺'}</p>
              <div className="flex items-center justify-center gap-1 text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                <span>Katalog Doğrulandı</span>
              </div>
            </div>
          ) : (
            <div className="text-white/30 space-y-1">
              <BookOpen className="w-8 h-8 mx-auto" />
              <p className="text-[10px]">ISBN çözümlenince önizleme açılır</p>
            </div>
          )}

          {isSaved && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md rounded-xl flex flex-col items-center justify-center p-3 text-center animate-fadeIn">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center mb-1">
                <Check className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-xs font-bold text-white">Vitrinde Yayında!</p>
              <p className="text-[9px] text-emerald-300 mt-0.5">Ana sayfaya eklendi</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="mt-auto pt-3 flex items-center justify-between border-t border-white/10">
        <span className="text-[10px] text-white/50">LookPrice Uluslararası ISBN Entegrasyonu</span>
        <button 
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
            isAutoFilled 
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30' 
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          <span>Kaydet & Vitrinde Yayınla</span>
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 3. SCENARIO: HotelBookingScreen
// ==========================================
interface HotelBookingScreenProps {
  activeTab: 'details' | 'amenities' | 'calendar';
  selectedDates: string | null;
  totalPrice?: string;
  isBooked: boolean;
  bookingRef?: string;
}

export function HotelBookingScreen({
  activeTab,
  selectedDates,
  totalPrice,
  isBooked,
  bookingRef
}: HotelBookingScreenProps) {
  const amenities = [
    { name: "Jakuzi & Deniz Manzarası", icon: Sparkles, active: true },
    { name: "Özel Geniş Teras", icon: Tv, active: true },
    { name: "Yüksek Hızlı Wi-Fi", icon: Wifi, active: true },
    { name: "Serpme Köy Kahvaltısı", icon: Coffee, active: true },
    { name: "King Size Ortopedik Yatak", icon: Layers, active: true }
  ];

  return (
    <div className="w-full h-full bg-[#061210] text-white flex flex-col p-4 sm:p-6 select-none relative overflow-hidden font-sans">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-emerald-500/10 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-white tracking-wide">LOOKPRICE <span className="text-emerald-400">HotelLP</span></span>
            <span className="text-[10px] text-emerald-300/60 block leading-tight">Butik Otel & Rezervasyon Motoru</span>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          DELUXE SÜİT
        </span>
      </div>

      {/* Main Room & Calendar Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 overflow-hidden">
        {/* Left Column: Room Presentation */}
        <div className="space-y-3 text-left">
          <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 h-36">
            <img 
              src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80" 
              alt="Deluxe Suite" 
              className="w-full h-full object-cover" 
            />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
              45 m² • 2+1 Yetişkin
            </div>
            <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-black shadow-lg">
              4.500 ₺ <span className="text-[9px] font-normal">/ Gece</span>
            </div>
          </div>

          {/* Amenities Chips */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">
              Süit Olanakları & Hizmetler
            </span>
            <div className="flex flex-wrap gap-1.5">
              {amenities.map((am, idx) => {
                const Icon = am.icon;
                const isHighlighted = activeTab === 'amenities' || activeTab === 'calendar';
                return (
                  <div 
                    key={idx} 
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-all duration-300 ${
                      isHighlighted 
                        ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-sm' 
                        : 'bg-white/5 text-white/60 border border-white/5'
                    }`}
                  >
                    <Icon className="w-3 h-3 text-emerald-400" />
                    <span>{am.name}</span>
                    <Check className="w-2.5 h-2.5 text-emerald-400 ml-0.5" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Booking Calendar */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-3 flex flex-col justify-between text-left">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Eylül 2026 Doluluk Takvimi
              </span>
              <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                Müsait Günler
              </span>
            </div>

            {/* Calendar Mini-Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono">
              {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => (
                <div key={d} className="text-white/40 font-sans text-[9px] py-0.5">{d}</div>
              ))}
              {Array.from({ length: 28 }).map((_, i) => {
                const day = i + 1;
                const isSelected = day >= 14 && day <= 18;
                const isBookedOut = day === 8 || day === 9;
                return (
                  <div 
                    key={day} 
                    className={`py-1 rounded text-[10px] transition-all duration-300 font-semibold ${
                      isSelected 
                        ? 'bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/30' 
                        : isBookedOut 
                        ? 'bg-red-500/20 text-red-300/40 line-through' 
                        : 'bg-black/30 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing & Booking Summary */}
          <div className="mt-3 pt-2.5 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60 text-[11px]">{selectedDates || 'Tarih Seçiniz'}</span>
              <span className="font-black text-emerald-300 text-sm">{totalPrice || '—'}</span>
            </div>

            {isBooked ? (
              <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500 flex items-center justify-between animate-fadeIn">
                <div>
                  <p className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Rezervasyon Onaylandı!
                  </p>
                  <p className="text-[9px] text-white/60 font-mono">Kod: {bookingRef}</p>
                </div>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                  WhatsApp Gönderildi
                </span>
              </div>
            ) : (
              <button className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all">
                <Check className="w-3.5 h-3.5" />
                <span>Rezervasyonu Onayla & Kupon Üret</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. SCENARIO: ShopPosScreen
// ==========================================
interface ShopPosScreenProps {
  screen: 'matrix' | 'pos';
  matrixCount: number;
  priceApplied: boolean;
  cartItems: Array<{ name: string; qty: number; price: number }>;
  paid?: boolean;
  receiptNo?: string;
}

export function ShopPosScreen({
  screen,
  matrixCount,
  priceApplied,
  cartItems,
  paid,
  receiptNo
}: ShopPosScreenProps) {
  return (
    <div className="w-full h-full bg-[#0a0f1d] text-white flex flex-col p-4 sm:p-6 select-none relative overflow-hidden font-sans">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-blue-500/10 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-white tracking-wide">LOOKPRICE <span className="text-blue-400">ShopLP</span></span>
            <span className="text-[10px] text-blue-300/60 block leading-tight">Perakende & Hızlı POS Terminali</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${screen === 'matrix' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/50'}`}>
            1. Varyant Matrisi
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${screen === 'pos' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/50'}`}>
            2. Hızlı POS
          </span>
        </div>
      </div>

      {screen === 'matrix' ? (
        /* Variant Matrix Screen */
        <div className="flex-1 flex flex-col justify-between mt-3 text-left">
          <div className="space-y-3">
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-white">Oversize Pamuklu Tişört</h3>
                <p className="text-[10px] text-blue-300">Ana Kategori: Giyim • Barkod Kökü: 86901234</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                12 Varyant Aktif
              </span>
            </div>

            {/* Matrix Options */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/40 p-2.5 rounded-lg border border-white/10 space-y-1.5">
                <span className="text-[10px] font-bold text-white/60 uppercase">Renkler</span>
                <div className="flex gap-1.5">
                  {['Siyah', 'Beyaz', 'Haki'].map(c => (
                    <span key={c} className="px-2 py-1 rounded bg-blue-600/30 border border-blue-500 text-[10px] font-bold text-white">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-black/40 p-2.5 rounded-lg border border-white/10 space-y-1.5">
                <span className="text-[10px] font-bold text-white/60 uppercase">Bedenler</span>
                <div className="flex gap-1.5">
                  {['S', 'M', 'L', 'XL'].map(s => (
                    <span key={s} className="px-2 py-1 rounded bg-blue-600/30 border border-blue-500 text-[10px] font-bold text-white">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Combinations preview */}
            <div className="bg-black/30 p-2.5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between mb-1.5 text-[10px] text-white/50">
                <span>Otomatik Üretilen Alt Barkodlar (12 SKU)</span>
                <span className="text-emerald-400 font-bold">{priceApplied ? '450 ₺ ve 25 Adet Stok Tanımlandı' : 'Fiyat Bekleniyor'}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                {['Siyah / S', 'Siyah / M', 'Siyah / L', 'Beyaz / S', 'Beyaz / M', 'Haki / L'].map((item, i) => (
                  <div key={i} className="p-1.5 rounded bg-white/5 border border-white/10 flex items-center justify-between">
                    <span className="font-sans text-[9px] text-white">{item}</span>
                    <span className="text-emerald-400 font-bold">{priceApplied ? '450 ₺' : '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <span className="text-[10px] text-white/40">Tek tıkla tüm varyantlara barkod ve stok ata</span>
            <button className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs shadow-md flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Toplu Fiyat & Stok Uygula</span>
            </button>
          </div>
        </div>
      ) : (
        /* POS Checkout Screen */
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-left overflow-hidden">
          {/* Left 2 Cols: Cart */}
          <div className="md:col-span-2 bg-black/40 rounded-xl border border-white/10 p-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                <Barcode className="w-4 h-4 text-emerald-400" />
                <input 
                  readOnly 
                  value="869012345678 (Okundu)" 
                  className="bg-transparent text-xs font-mono text-emerald-300 focus:outline-none flex-1" 
                />
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                  Bip! Barkod Algılandı
                </span>
              </div>

              {cartItems.map((item, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">{item.name}</p>
                    <p className="text-[10px] text-white/50">Miktar: {item.qty} Adet</p>
                  </div>
                  <span className="text-sm font-black text-emerald-400">{item.price} ₺</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-white/60">Genel Toplam (KDV Dahil)</span>
              <span className="text-xl font-black text-white">450,00 ₺</span>
            </div>
          </div>

          {/* Right Col: Payment Action & Receipt */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-3 flex flex-col justify-between relative">
            <div>
              <span className="text-[10px] font-bold text-white/60 uppercase block mb-2">Tahsilat Türü</span>
              <div className="space-y-1.5">
                <button className="w-full py-2 px-3 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-emerald-600/30">
                  <span>Nakit 450 ₺</span>
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button className="w-full py-2 px-3 rounded-lg bg-white/10 text-white/70 font-semibold text-xs flex items-center justify-between">
                  <span>Kredi Kartı</span>
                  <CreditCard className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {paid && (
              <div className="mt-2 p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-500 text-center animate-fadeIn">
                <Printer className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-[11px] font-bold text-white">E-Arşiv Fişi Kesildi!</p>
                <p className="text-[9px] text-emerald-300 font-mono mt-0.5">{receiptNo}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 5. SCENARIO: HotelWhatsappScreen
// ==========================================
interface HotelWhatsappScreenProps {
  stage: 'preview' | 'voucher_ready' | 'delivered';
  guestName: string;
  phone: string;
  room: string;
  dates: string;
  isSent: boolean;
}

export function HotelWhatsappScreen({
  stage,
  guestName,
  phone,
  room,
  dates,
  isSent
}: HotelWhatsappScreenProps) {
  return (
    <div className="w-full h-full bg-[#071712] text-white flex flex-col p-4 sm:p-6 select-none relative overflow-hidden font-sans">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-emerald-500/15 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
            <Send className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <span className="font-bold text-white tracking-wide">HotelLP • WhatsApp Rezervasyon Entegratörü</span>
            <span className="text-[10px] text-emerald-300/70 block leading-tight">Otomatik Misafir Karşılama & QR Voucher</span>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          WHATSAPP BUSINESS API
        </span>
      </div>

      {/* Main Split Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 overflow-hidden text-left">
        {/* Left Col: Reservation & Voucher Preview */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-3.5 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Misafir Rezervasyon Kartı</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">VIP Konuk</span>
            </div>

            <div className="p-2.5 bg-black/40 rounded-lg border border-white/10 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-white/50 text-[11px]">Misafir Adı:</span>
                <span className="font-bold text-white">{guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50 text-[11px]">Telefon:</span>
                <span className="font-mono text-emerald-300">{phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50 text-[11px]">Oda Tipi:</span>
                <span className="font-semibold text-white">{room}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50 text-[11px]">Tarihler:</span>
                <span className="text-emerald-400 font-bold">{dates}</span>
              </div>
            </div>

            {/* Generated QR Voucher Card */}
            <div className={`p-3 rounded-xl border transition-all duration-300 flex items-center gap-3 ${
              stage !== 'preview'
                ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md'
                : 'bg-white/5 border-white/10 opacity-70'
            }`}>
              {/* QR Icon simulation */}
              <div className="w-14 h-14 bg-white p-1 rounded-lg flex flex-col justify-between shrink-0 shadow">
                <div className="flex justify-between">
                  <div className="w-3 h-3 bg-black rounded-xs" />
                  <div className="w-3 h-3 bg-black rounded-xs" />
                </div>
                <div className="flex justify-center">
                  <div className="w-2.5 h-2.5 bg-emerald-700 rounded-full" />
                </div>
                <div className="flex justify-between">
                  <div className="w-3 h-3 bg-black rounded-xs" />
                  <div className="w-1.5 h-1.5 bg-black" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-white leading-tight">Dijital Rezervasyon Kuponu (PDF)</p>
                <p className="text-[10px] text-emerald-300/80 mt-0.5">Kapı Temassız Giriş Kodu: <span className="font-mono font-bold">#LP-9941</span></p>
                <p className="text-[9px] text-white/50 mt-0.5">Wi-Fi: <span className="font-mono text-white/70">GrandPalace_Guest</span></p>
              </div>
            </div>
          </div>

          <button className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            isSent 
              ? 'bg-emerald-700 text-white' 
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
          }`}>
            <Send className="w-3.5 h-3.5" />
            <span>{isSent ? 'WhatsApp ile İletildi ✓' : 'WhatsApp ile Kuponu Gönder'}</span>
          </button>
        </div>

        {/* Right Col: Phone Mockup / WhatsApp Chat Simulation */}
        <div className="bg-[#0b141a] rounded-xl border border-emerald-500/20 p-3 flex flex-col justify-between relative overflow-hidden">
          {/* WhatsApp Header */}
          <div className="bg-[#202c33] -mx-3 -mt-3 p-2.5 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold">
                HTL
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">LookPrice Grand Hotel</p>
                <p className="text-[9px] text-emerald-400">Çevrimiçi • Resmi İşletme Hesabı</p>
              </div>
            </div>
            <span className="text-[9px] text-white/40 font-mono">14:28</span>
          </div>

          {/* Chat Messages Body */}
          <div className="space-y-2 py-3">
            <div className="bg-[#202c33] p-2.5 rounded-lg text-[11px] text-white/90 max-w-[90%] border-l-4 border-emerald-500 space-y-1 shadow">
              <p className="font-bold text-emerald-300">Değerli Misafirimiz {guestName},</p>
              <p className="text-[10px] text-white/80 leading-relaxed">
                LookPrice Grand Hotel rezervasyonunuz başarıyla tamamlandı! 18 Eylül günü sizi ağırlamaktan onur duyarız.
              </p>
              <p className="text-[10px] text-emerald-400 font-semibold pt-1">
                📍 Konum Haritası ve Temassız QR Giriş Kuponunuz ektedir.
              </p>
              <div className="flex items-center justify-end gap-1 pt-1 text-[9px] text-white/40">
                <span>14:28</span>
                <span className={isSent ? "text-sky-400 font-bold" : "text-white/40"}>✓✓</span>
              </div>
            </div>

            {isSent && (
              <div className="bg-[#1f2c34] p-2 rounded-lg border border-emerald-500/40 max-w-[85%] flex items-center gap-2.5 animate-fadeIn">
                <div className="w-8 h-8 rounded bg-emerald-600/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-white truncate">Rezervasyon_Kuponu_LP9941.pdf</p>
                  <p className="text-[9px] text-emerald-300">240 KB • İndirildi</p>
                </div>
              </div>
            )}
          </div>

          {/* Delivery Status Toast */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
            <span className="text-white/50">İletim Durumu:</span>
            <span className={`font-bold flex items-center gap-1 ${
              isSent ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              <Check className="w-3 h-3" />
              {isSent ? 'Teslim Edildi & Okundu (Çift Mavi Tik)' : 'Kuyrukta Bekliyor'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. SCENARIO: HotelCleaningScreen
// ==========================================
interface HotelCleaningScreenProps {
  highlightRoom: number | null;
  staffAssigned: boolean;
  roomStatus: 'dirty' | 'cleaning' | 'inspected' | 'ready';
}

export function HotelCleaningScreen({
  highlightRoom,
  staffAssigned,
  roomStatus
}: HotelCleaningScreenProps) {
  const rooms = [
    { num: 101, type: "Standart", status: "ready", guest: "Dolu" },
    { num: 102, type: "Standart", status: "ready", guest: "Dolu" },
    { num: 103, type: "Deluxe", status: "dirty", guest: "Çıkış Yapıldı" },
    { num: 201, type: "Süit", status: "ready", guest: "Dolu" },
    { num: 202, type: "Standart", status: "cleaning", guest: "Temizlikte" },
    { num: 203, type: "Deluxe", status: "ready", guest: "Boş (Temiz)" },
    { num: 204, type: "Deniz Süit", status: roomStatus, guest: staffAssigned ? "Fatma H. (Atandı)" : "Çıkış Yapıldı" },
    { num: 301, type: "Kral Dairesi", status: "ready", guest: "Dolu" },
    { num: 302, type: "Deluxe", status: "ready", guest: "Boş (Temiz)" },
    { num: 303, type: "Standart", status: "dirty", guest: "Çıkış Yapıldı" },
    { num: 304, type: "Balayı Süiti", status: "ready", guest: "Giriş Bekleniyor" },
    { num: 305, type: "Deluxe", status: "ready", guest: "Dolu" }
  ];

  return (
    <div className="w-full h-full bg-[#071318] text-white flex flex-col p-4 sm:p-6 select-none relative overflow-hidden font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-cyan-500/15 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-600 flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <span className="font-bold text-white tracking-wide">HotelLP • Kat Hizmetleri & Housekeeping</span>
            <span className="text-[10px] text-cyan-300/70 block leading-tight">Canlı Kat Planı & Oda Temizlik Matrisi</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            2. KAT PLANI
          </span>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-4 gap-2 mt-3 text-left">
        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
          <span className="text-[9px] text-white/50 block">Toplam Oda</span>
          <span className="text-sm font-black text-white">12 Oda</span>
        </div>
        <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
          <span className="text-[9px] text-emerald-400 block">Temiz & Hazır</span>
          <span className="text-sm font-black text-emerald-300">8 Oda</span>
        </div>
        <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30">
          <span className="text-[9px] text-amber-400 block">Temizlikte</span>
          <span className="text-sm font-black text-amber-300">2 Oda</span>
        </div>
        <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30">
          <span className="text-[9px] text-rose-400 block">Kirli (Bekleyen)</span>
          <span className="text-sm font-black text-rose-300">2 Oda</span>
        </div>
      </div>

      {/* Rooms Floor Grid */}
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-3 overflow-hidden text-left">
        {rooms.map((r) => {
          const isTarget = r.num === 204;
          const statusBg = 
            r.status === 'ready' ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' :
            r.status === 'cleaning' ? 'bg-amber-950/40 border-amber-500/50 text-amber-200 animate-pulse' :
            r.status === 'inspected' ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200' :
            'bg-rose-950/30 border-rose-500/40 text-rose-200';

          return (
            <div 
              key={r.num}
              className={`p-2.5 rounded-xl border transition-all duration-300 flex flex-col justify-between ${statusBg} ${
                isTarget ? 'ring-2 ring-cyan-400 shadow-lg scale-105' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black">#{r.num}</span>
                  <span className="text-[8px] font-bold px-1 rounded uppercase tracking-wider bg-black/40">
                    {r.status === 'ready' ? 'HAZIR' : r.status === 'cleaning' ? 'TEMİZLİK' : 'KİRLİ'}
                  </span>
                </div>
                <p className="text-[9px] text-white/60 mt-0.5 truncate">{r.type}</p>
              </div>

              <div className="mt-2 pt-1 border-t border-white/10">
                <p className="text-[9px] font-bold truncate leading-tight">{r.guest}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Assignment / Status Bar */}
      <div className="mt-auto pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-left">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-[11px] text-white/80">
            {highlightRoom === 204 
              ? roomStatus === 'ready' 
                ? 'Oda #204 Hazırlandı & Resepsiyona Bildirildi!'
                : 'Oda #204 Temizlik Görevlisi: Fatma Hanım (Öncelikli)'
              : 'Kat görevlileri tablet üzerinden odaları anlık günceller.'}
          </span>
        </div>

        <button className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] flex items-center gap-1">
          <Check className="w-3.5 h-3.5" />
          <span>Tüm Katı Onayla</span>
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 7. SCENARIO: HotelChannelScreen
// ==========================================
interface HotelChannelScreenProps {
  multiplier: number;
  seasonName: string;
  applied: boolean;
  liveSync?: boolean;
}

export function HotelChannelScreen({
  multiplier,
  seasonName,
  applied,
  liveSync
}: HotelChannelScreenProps) {
  const rooms = [
    { name: "Standart Bahçe Manzaralı", base: 3000, capacity: "2 Kişilik" },
    { name: "Deluxe Deniz Manzaralı Süit", base: 4500, capacity: "2+1 Kişilik" },
    { name: "Panoramik Kral Dairesi", base: 9000, capacity: "4 Kişilik" }
  ];

  return (
    <div className="w-full h-full bg-[#171107] text-white flex flex-col p-4 sm:p-6 select-none relative overflow-hidden font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-amber-500/15 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <span className="font-bold text-white tracking-wide">HotelLP • Dinamik Fiyat Matrisi & Sezon Yönetimi</span>
            <span className="text-[10px] text-amber-300/70 block leading-tight">Otomatik Hafta Sonu Çarpanı & Vitrin Senkronizasyonu</span>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          GELİR MAKSİMİZASYONU
        </span>
      </div>

      {/* Dynamic Rule Banner */}
      <div className="mt-3 p-3 bg-white/5 rounded-xl border border-amber-500/30 flex items-center justify-between text-left">
        <div>
          <span className="text-[9px] uppercase tracking-wider font-bold text-amber-400 block">Aktif Fiyatlandırma Politikası</span>
          <p className="text-xs font-bold text-white mt-0.5">{seasonName}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/40">
            Çarpan: x{multiplier.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Pricing Comparison Table */}
      <div className="flex-1 mt-3 space-y-2 text-left overflow-hidden">
        {rooms.map((r, idx) => {
          const currentPrice = applied ? Math.round(r.base * multiplier) : r.base;
          return (
            <div 
              key={idx} 
              className={`p-3 rounded-xl border flex items-center justify-between transition-all duration-300 ${
                applied 
                  ? 'bg-amber-950/30 border-amber-500/50 shadow-md' 
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div>
                <p className="text-xs font-bold text-white">{r.name}</p>
                <p className="text-[10px] text-white/50">{r.capacity} • Kahvaltı Dahil</p>
              </div>

              <div className="flex items-center gap-3">
                {applied && (
                  <span className="text-xs text-white/40 line-through font-mono">
                    {r.base.toLocaleString('tr-TR')} ₺
                  </span>
                )}
                <div className="text-right">
                  <span className={`text-base font-black font-mono ${
                    applied ? 'text-amber-400' : 'text-white'
                  }`}>
                    {currentPrice.toLocaleString('tr-TR')} ₺
                  </span>
                  <span className="text-[9px] text-white/50 block">/ Gece</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Live Sync Status */}
      <div className="mt-auto pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
        <span className="text-[10px] text-white/50">
          {liveSync 
            ? '✓ lookprice.net vitrini ve tüm online takvimler senkronize edildi.' 
            : 'Fiyat kuralları tanımlandıktan sonra tek tıkla vitrinde aktifleşir.'}
        </span>
        <button className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 flex items-center gap-1">
          <Check className="w-3.5 h-3.5" />
          <span>Fiyatları Vitrine Bas</span>
        </button>
      </div>
    </div>
  );
}
