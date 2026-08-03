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
  Barcode,
  ShoppingBag,
  Layers,
  Receipt,
  FileText,
  TrendingUp,
  Activity,
  RefreshCw,
  Car,
  Truck,
  Users,
  Coins,
  Smartphone,
  QrCode,
  CreditCard,
  Settings,
  Calculator,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { shopFaq } from '../data/shopFaq';
import { useNavigate } from 'react-router-dom';

export default function ShopLanding() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const navigate = useNavigate();

  const toggleAccordion = (id: string) => {
    setOpenId(prev => prev === id ? null : id);
  };

  const categories = [
    { id: 'all', label: 'Tümü' },
    { id: 'stok_perakende', label: 'Stok & Perakende' },
    { id: 'satis_kasa', label: 'Satış & Kasa' },
    { id: 'finans_cari', label: 'Finans & Cari' }
  ];

  const filteredFaq = useMemo(() => {
    return shopFaq.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const cleanQuery = searchQuery.toLowerCase().trim();
      const matchesSearch = !cleanQuery || 
        item.q.toLowerCase().includes(cleanQuery) || 
        item.a.toLowerCase().includes(cleanQuery);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
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
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-transparent to-slate-50/50 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 rounded-full text-xs md:text-sm font-black text-indigo-700 mb-6 border border-indigo-100/50">
            <Sparkles className="h-4 w-4" />
            ShopLP by LookPrice
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-950 tracking-tighter mb-6 leading-[1.1]">
            Bulut Tabanlı Perakende ve <br className="hidden md:inline"/> Akıllı Kasa Satış Sistemi
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-10 font-semibold leading-relaxed">
            Hızlı POS satış ekranı, tam uyumlu barkod okuyucu ve yazıcı entegrasyonu, gelişmiş stok takibi ve resmi e-Fatura / e-Arşiv bağlantısıyla mağazanızı baştan yaratın.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all text-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15 cursor-pointer"
            >
              Ücretsiz Deneyin <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Showcase Visual Section */}
      <section className="py-16 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold uppercase tracking-wider">
              BULUT TABANLI PERAKENDE AKILLI POS
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Hızlı Barkodlu Kasa Satışı ve Varyasyonlu Stok Takibi
            </h2>
            <p className="text-slate-600 font-semibold text-sm md:text-base leading-relaxed">
              ShopLP, butikler, pastaneler, marketler ve tüm perakende satıcılar için iş süreçlerini kolaylaştırır. Dokunmatik ekranlar ve barkod okuyucularla tam entegre çalışarak satış hızınızı zirveye taşır.
            </p>
            <div className="space-y-3">
              {[
                "Hızlı barkodlu/barkodsuz dokunmatik POS satış ekranı",
                "Renk, beden ve dinamik varyasyon bazlı gelişmiş stok takibi",
                "Entegre resmi e-Fatura / e-Arşiv ve çoklu dövizli kasa yönetimi"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-700 text-sm font-bold">
                  <CheckCircle className="h-5 w-5 text-indigo-500 shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200 bg-slate-950 p-2 group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none" />
              <img 
                src="/images/shop_bg_1785752034826.jpg" 
                alt="ShopLP Retail & POS Showcase" 
                referrerPolicy="no-referrer"
                className="w-full h-[320px] md:h-[450px] object-cover rounded-[1.8rem] group-hover:scale-[1.01] transition-transform duration-500"
              />
              <div className="absolute bottom-8 left-8 right-8 z-20 bg-black/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-white">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 mb-2 inline-block">
                  PERAKENDE KASA VİTRİN
                </span>
                <p className="font-black text-lg md:text-xl mb-1">Veresiye ve Cari Hesap Defteri</p>
                <p className="text-white/60 text-xs md:text-sm font-semibold">Tüm müşteri cari bakiyelerini, tahsilatları ve veresiye limitlerini anlık izleyin.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Perakende Mağazanız İçin Eksiksiz Güç
          </h2>
          <p className="text-slate-500 font-semibold text-sm sm:text-base leading-relaxed">
            ShopLP, butikler, pastaneler, marketler ve tüm perakende mağazaları için uçtan uca otomasyon ve finansal yönetim sunar.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { 
              title: 'Hızlı Dokunmatik POS', 
              desc: 'Barkodlu veya barkodsuz tüm ürünlerinizi ister okutarak ister dokunarak saniyeler içinde satın. Yeni nesil entegre yazar kasa/POS cihazları ile tam uyumlu çalışır.',
              icon: ShoppingBag,
              color: 'text-indigo-600 bg-indigo-50 border-indigo-100/50'
            },
            { 
              title: 'Gelişmiş Varyasyon', 
              desc: 'Giyim ve ayakkabı gibi renk, beden, numara kırılımlı ürünleri tek kartta toplayıp stoklarını bağımsız takip edin.',
              icon: Layers,
              color: 'text-blue-600 bg-blue-50 border-blue-100/50'
            },
            { 
              title: 'Entegre e-Fatura Altyapısı', 
              desc: 'Satış anında müşteri bilgileriyle resmi e-Fatura veya e-Arşiv faturası kesin, muhasebe süreçlerinizi hızlandırın.',
              icon: Receipt,
              color: 'text-emerald-600 bg-emerald-50 border-emerald-100/50'
            },
            { 
              title: 'Teknik Servis Yönetimi', 
              desc: 'Müşteri bilgilendirmesi, servis raporu ve fiyat teklifleri süreçlerini dijital olarak takip edin. Onay durumuna göre otomatik taslak satış faturası oluşturun.',
              icon: Wrench,
              color: 'text-orange-600 bg-orange-50 border-orange-100/50'
            },
            { 
              title: 'Akıllı Fiyat Teklif Sistemi', 
              desc: 'Fiyat tekliflerinizi saniyeler içinde hazırlayıp PDF veya interaktif dijital onay linkiyle gönderin. Onaylanan teklifleri otomatik taslak faturaya dönüştürün.',
              icon: FileText,
              color: 'text-sky-600 bg-sky-50 border-sky-100/50'
            },
            { 
              title: 'Stok Hareket Ekstresi', 
              desc: 'Geçmiş dönem ürün hareketlerini, giriş/çıkış sipariş detaylarını, şubeler arası sevkleri ve stokların talep yoğunluk durumlarını anlık analiz edin.',
              icon: Activity,
              color: 'text-violet-600 bg-violet-50 border-violet-100/50'
            },
            { 
              title: 'Otomatik Muhasebe & Kayıt', 
              desc: 'Alış ve satış faturalarından (hem resmi e-fatura hem de manuel faturalardan) otomatik cari ve stok kayıtları oluşturarak manuel iş yükünü sıfırlayın.',
              icon: CheckCircle,
              color: 'text-teal-600 bg-teal-50 border-teal-100/50'
            },
            { 
              title: 'Toplu Fiyat Değişikliği', 
              desc: 'Piyasadaki anlık kur ve maliyet dalgalanmalarına karşı, saniyeler içerisinde binlerce ürünün fiyatına kategori veya marka bazında müdahale edin.',
              icon: RefreshCw,
              color: 'text-pink-600 bg-pink-50 border-pink-100/50'
            },
            { 
              title: 'Gider Merkezleri Analizi', 
              desc: 'Gider yerlerinizi (reklam, kira, kargo vb.) tanımlayarak şirket masraflarınızı ürünlerle ilişkilendirin ve net kâr-zarar raporlarını çıkarın.',
              icon: TrendingUp,
              color: 'text-rose-600 bg-rose-50 border-rose-100/50'
            },
            { 
              title: 'Filo & Araç Yönetim Sistemi', 
              desc: 'Şirket araçlarınızın aktif Sürücü zimmetlerini, Km durumlarını, Servis/Bakım geçmişlerini, lastik değişimlerini ve resmi sigorta/kasko evraklarını takip edin.',
              icon: Car,
              color: 'text-red-600 bg-red-50 border-red-100/50'
            },
            { 
              title: 'Uçtan Uca Tedarik Yönetimi', 
              desc: 'Satın alma taleplerinden tedarikçi teklif toplamalarına, sipariş onayından mal kabule kadar tüm tedarik zincirinizi tek ekrandan yönetin.',
              icon: Truck,
              color: 'text-amber-600 bg-amber-50 border-amber-100/50'
            },
            { 
              title: 'Çok Şubeli Eşgüdümlü Yönetim', 
              desc: 'Sınırsız şube açın. Merkezle tam eşgüdümlü çalışan şubeleriniz arasında hızlı stok transferi yapın ve tüm stoklarınızı tek bir platformdan izleyin.',
              icon: Users,
              color: 'text-slate-600 bg-slate-50 border-slate-100/50'
            },
            { 
              title: 'Dövizli Cari & Dijital Mutabakat', 
              desc: 'Cari hesap ekstrelerinizi dövizli takip edin. Entegre Dijital Mutabakat sistemiyle müşterilerinize online onaylı bakiye mutabakatı gönderin.',
              icon: Coins,
              color: 'text-yellow-600 bg-yellow-50 border-yellow-100/50'
            },
            { 
              title: 'Mağaza içi "Fiyat Gör" QR', 
              desc: 'Müşterileriniz veya personeliniz mağaza içi QR kodu okutarak tüm ürünlerin güncel fiyatlarını mobil cihazları üzerinden saniyeler içinde sorgular.',
              icon: QrCode,
              color: 'text-cyan-600 bg-cyan-50 border-cyan-100/50'
            },
            { 
              title: 'E-Ticaret & Otomatik Kur', 
              desc: 'Sanal POS (Paypal, Iyzico, Havale, Kapıda/Şubede öde) tanımlı, esnek, kurumsal kimliğinize göre kişiselleştirilebilir hazır web siteniz anında kurulur.',
              icon: Globe,
              color: 'text-indigo-600 bg-indigo-50 border-indigo-100/50'
            }
          ].map((f, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-6 border ${f.color}`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-500 font-semibold text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-3 inline-block">
              MAĞAZA BİLGİ BANKASI
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Sıkça Sorulan Sorular
            </h2>
            <p className="text-slate-500 font-semibold text-sm mt-2">
              ShopLP satış, stok ve cari otomasyon sistemimizle ilgili en çok merak edilen detaylar.
            </p>
          </div>

          {/* Search & Category Filter Section */}
          <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 space-y-4 mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Barkod, veresiye borç, dövizli kasa veya e-Fatura hakkında arayın..."
                className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 rounded-full text-slate-400"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ List */}
          <div className="space-y-3">
            {filteredFaq.length === 0 ? (
              <div className="bg-slate-50 rounded-3xl p-12 text-center border border-slate-100">
                <p className="text-slate-800 font-extrabold text-sm">Aramanızla eşleşen soru bulunamadı.</p>
              </div>
            ) : (
              filteredFaq.map((item) => {
                const isOpen = openId === item.id;
                return (
                  <div 
                    key={item.id} 
                    className={`bg-white border rounded-2xl transition-all ${
                      isOpen ? 'border-indigo-500 shadow-md shadow-indigo-600/5' : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <button
                      onClick={() => toggleAccordion(item.id)}
                      className="w-full text-left p-5 flex items-start justify-between gap-4 font-extrabold text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <span className="text-sm md:text-base">{item.q}</span>
                      <div className={`mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                        isOpen ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="px-5 pb-5 pt-1 border-t border-slate-50">
                            <div className="p-4 bg-slate-50 rounded-xl text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
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
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 border-b border-white/10 pb-8 mb-8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black">LP</div>
            <span className="font-black text-lg">ShopLP</span>
          </div>
          <p className="text-sm text-white/50 font-medium">© 2026 LookPrice. Tüm Hakları Saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
