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
  X,
  ArrowRight,
  WifiOff,
  RefreshCw,
  Receipt,
  QrCode,
  Layers,
  Send,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { horecaFaq } from '../data/horecaFaq';
import { useNavigate } from 'react-router-dom';

export default function HoReCaLanding() {
  const [openId, setOpenId] = useState<string | null>(null);
  const navigate = useNavigate();

  const toggleAccordion = (id: string) => {
    setOpenId(prev => prev === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-100 py-4 px-6 md:px-12 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg">
              LP
            </div>
            <span className="font-black text-xl tracking-tight text-slate-900">LookPrice</span>
          </div>
          <button 
            onClick={() => navigate('/')} 
            className="text-sm font-extrabold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-xl transition-all"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/40 via-transparent to-slate-50/50 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 rounded-full text-xs md:text-sm font-black text-amber-700 mb-6 border border-amber-100/50">
            <Sparkles className="h-4 w-4" />
            HoReCaLP by LookPrice
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-950 tracking-tighter mb-6 leading-[1.1]">
            Cafe ve Restoran Yönetiminde <br className="hidden md:inline"/> Dijital Devrim
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-10 font-semibold leading-relaxed">
            İnternet bağımlılığı olmadan, anlık senkronizasyonla çalışan, mutfak ve bar yönetimini otomatize eden profesyonel restoran yönetim çözümü.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-amber-600 text-white font-black rounded-2xl hover:bg-amber-700 transition-all text-lg flex items-center justify-center gap-2 shadow-lg shadow-amber-600/15 cursor-pointer"
            >
              Hemen Başlayın <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Showcase Visual Section */}
      <section className="py-16 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider">
              YENİ NESİL AR-GE ALTYAPISI
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Sektörün En Akıllı Restoran Otomasyonu
            </h2>
            <p className="text-slate-600 font-semibold text-sm md:text-base leading-relaxed">
              HoReCaLP, kesintisiz bir hizmet süreci yürütmeniz için tasarlandı. Dijital el terminalleri, mutfak hazırlık panelleri, adisyon kurgusu ve QR entegrasyonu tek bir merkezde, internet kopmalarından etkilenmeksizin çalışır.
            </p>
            <div className="space-y-3">
              {[
                "Çevrimdışı (offline-first) kesintisiz çalışma mimarisi",
                "Masa ve el terminalleri arasında real-time çift yönlü veri transferi",
                "Farklı departmanlara (Mutfak, Bar, Fırın) anlık sipariş yönlendirme"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-700 text-sm font-bold">
                  <CheckCircle className="h-5 w-5 text-amber-500 shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200 bg-slate-950 p-2 group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none" />
              <img 
                src="/src/assets/images/horeca_bg_1785752045736.jpg" 
                alt="HoReCaLP Restaurant Automation Showcase" 
                referrerPolicy="no-referrer"
                className="w-full h-[320px] md:h-[450px] object-cover rounded-[1.8rem] group-hover:scale-[1.01] transition-transform duration-500"
              />
              <div className="absolute bottom-8 left-8 right-8 z-20 bg-black/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-white">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 mb-2 inline-block">
                  PREMIUM VİTRİN
                </span>
                <p className="font-black text-lg md:text-xl mb-1">Masa Adisyon ve Dijital QR Menü Entegrasyonu</p>
                <p className="text-white/60 text-xs md:text-sm font-semibold">Gelişmiş restoran POS arayüzü ile adisyonları anlık bölün, masadan siparişleri yönetin.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Neden HoReCaLP?</h2>
            <p className="text-slate-500 font-semibold text-sm sm:text-base leading-relaxed">
              Restoran, bar ve cafelerin operasyonel zorluklarını çözmek, sipariş hızını artırmak ve kaçakları sıfıra indirmek için tasarlandı.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                title: 'Kesintisiz Çevrimdışı Çalışma', 
                desc: 'İnternet bağlantınız kopsa dahi el terminalleriniz sipariş almaya, adisyon açmaya ve yerel ağda haberleşmeye devam eder. Bağlantı geldiğinde otomatik eşitlenir.',
                icon: WifiOff,
                color: 'text-amber-600 bg-amber-50 border-amber-100/50'
              },
              { 
                title: 'Anlık Masa Senkronizasyonu', 
                desc: 'Tüm terminaller arasında tam zamanlı çift yönlü veri senkronizasyonu. Garsonların girdiği siparişler kasada ve diğer terminallerde anlık güncellenir.',
                icon: RefreshCw,
                color: 'text-indigo-600 bg-indigo-50 border-indigo-100/50'
              },
              { 
                title: 'Gelişmiş Hesap Bölme', 
                desc: 'Kişi sayısına göre eşit hesap bölme veya seçilen spesifik ürün kalemlerine göre parça parça ödeme alma imkanı (Nakit, Kredi Kartı ve Karma).',
                icon: Receipt,
                color: 'text-emerald-600 bg-emerald-50 border-emerald-100/50'
              },
              { 
                title: 'Zengin QR Menü & Sipariş', 
                desc: 'Müşterilerinizin masadaki kodu okutarak porsiyon, alerjen detaylarını görmesini ve doğrudan masadan interaktif sipariş vermesini sağlayın.',
                icon: QrCode,
                color: 'text-rose-600 bg-rose-50 border-rose-100/50'
              },
              { 
                title: 'Akıllı Reçete & Stok Takibi', 
                desc: 'Her yemek ve kokteyl için milimetrik reçeteler (BOM) oluşturun. Satış yapıldıkça un, yağ, et gibi hammaddeler depodan otomatik düşsün.',
                icon: Layers,
                color: 'text-blue-600 bg-blue-50 border-blue-100/50'
              },
              { 
                title: 'Süreli Happy Hour tarifesi', 
                desc: 'Haftanın belirli günlerinde ve saat aralıklarında otomatik devreye giren özel indirim tarifeleri ve Happy Hour kuralları tanımlayın.',
                icon: Clock,
                color: 'text-violet-600 bg-violet-50 border-violet-100/50'
              },
              { 
                title: 'Akıllı Sipariş Yönlendirme', 
                desc: 'Onaylanan adisyondaki yemek siparişleri anında mutfak ekranına, içecekler ise bar yazıcısına departman bazlı ayrılarak saniyeler içinde iletilir.',
                icon: Send,
                color: 'text-cyan-600 bg-cyan-50 border-cyan-100/50'
              },
              { 
                title: 'Güvenlik & Rol Kısıtlamaları', 
                desc: 'İptal, ikram, iskonto ve iade işlemlerini yönetici onayına bağlayın. Personelin sadece iş yeri Wi-Fi ağından sisteme erişebilmesini sağlayın.',
                icon: ShieldAlert,
                color: 'text-red-600 bg-red-50 border-red-100/50'
              }
            ].map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-6 border ${f.color}`}>
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-3">{f.title}</h3>
                  <p className="text-slate-500 font-semibold text-xs md:text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-12">Sıkça Sorulan Sorular</h2>
          <div className="space-y-3">
            {horecaFaq.filter(item => item.status === 'active').map((item) => {
              const isOpen = openId === item.id;
              return (
                <div key={item.id} className="border border-slate-100 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => toggleAccordion(item.id)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-slate-800"
                  >
                    {item.q}
                    {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="px-5 pb-5 pt-1 text-sm text-slate-600 font-semibold leading-relaxed"
                      >
                        {item.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
