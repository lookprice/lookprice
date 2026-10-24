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
  category: string;
  status: 'active' | 'in_development' | 'planned';
}

interface FaqTabProps {
  branding?: any;
}

const corporateWebsiteFaq: FaqItem[] = [
  {
    id: 'corp-1',
    q: 'Web sitemdeki üst logo altı sloganı ve banner üzerindeki rozet yazılarını nasıl değiştirebilirim veya gizleyebilirim?',
    a: 'Sol menüden "Web Sitesi Stüdyosu" > "1. Hero & Vitrin" sekmesine girerek "Logo Altı Slogan (Header Alt Başlık)" ve "Banner Üstü Rozet Metni (Badge)" alanlarını dilediğiniz gibi değiştirebilirsiniz. Eğer görünmesini istemiyorsanız yanlarındaki "Gizle / Sil" butonuna basıp kaydetmeniz yeterlidir.',
    category: 'tasarim_vitrin',
    status: 'active'
  },
  {
    id: 'corp-2',
    q: 'Banner arka plan fotoğraflarının parlaklığını ve yazıların kalınlığını (Bold/Normal) nasıl ayarlayabilirim?',
    a: '"1. Hero & Vitrin" sekmesinde yer alan "Banner Yazı Karakteristiği" panelinden Yazı Fontu (Inter, Poppins, Montserrat, Playfair Display vb.), Başlık Kalınlığı (İnce/Normal 400, Orta 500, SemiBold 600, Bold 700), Yazı Ölçüsü ve Alt Çizgi stilini seçebilirsiniz. Aynı kutudaki "Banner Resmi Karartma / Kontrast Perdesi" sürgüsünü %0-%15 seviyesine çekerek banner görsellerinizi tam parlak ve canlı gösterebilirsiniz.',
    category: 'tasarim_vitrin',
    status: 'active'
  },
  {
    id: 'corp-3',
    q: 'Hazır renk temaları dışında kendi kurumsal renklerimi (Özel Renk Kombinasyonu) seçebilir miyim?',
    a: 'Evet! "7. Tema & SEO" sekmesinde yer alan "Özel Renk Kombinasyonu Kullan (Serbest Renk Seçici)" kutucuğunu işaretleyerek Ana Kurumsal Renk, İkincil Vurgu Rengi, Manşet Başlık Rengi ve Vurgulu Kelime Rengini renk paletinden veya HEX koduyla tamamen özgürce belirleyebilirsiniz.',
    category: 'tasarim_vitrin',
    status: 'active'
  },
  {
    id: 'corp-4',
    q: 'Hizmet kartlarını, özel sayfaları ve fotoğraf galerisini nasıl ekleyip sıralayabilirim?',
    a: 'Web Sitesi Stüdyosu içindeki "2. Hizmet", "4. Sayfalar" ve "5. Galeri" sekmelerinden sınırsız sayıda hizmet kartı, menüde görünen ek bilgilendirme sayfası ve tesis/hizmet fotoğrafı ekleyebilir; yukarı/aşağı oklarıyla sıralamalarını değiştirebilirsiniz.',
    category: 'icerik_sayfalar',
    status: 'active'
  },
  {
    id: 'corp-5',
    q: '2. Yedek / Sabit Telefon numaram ve Google Harita konumum sitede nerede görünür?',
    a: '"6. İletişim" sekmesine girdiğiniz 1. Ana Telefon, 2. Yedek / Sabit Telefon, WhatsApp hattı, E-posta, Açık Adres ve Çalışma Saatleri hem İletişim bölümünde hem de sitenin en altındaki (Footer) kurumsal iletişim alanında otomatik ve tıklanabilir olarak yayınlanır.',
    category: 'iletisim_harita',
    status: 'active'
  },
  {
    id: 'corp-6',
    q: 'Google Analytics 4 (GA4), Google Tag Manager, Search Console ve Meta Pixel kodlarını nereye eklemeliyim?',
    a: '"7. Tema & SEO" sekmesindeki ilgili kutulara GA4 Ölçüm Kimliğinizi (G-XXXX), GTM kodunuzu, Search Console doğrulama kodunuzu ve Meta Pixel ID bilginizi yapıştırıp kaydettiğinizde tüm izleme kodları canlı web sitenize otomatik entegre edilir.',
    category: 'seo_domain',
    status: 'active'
  },
  {
    id: 'corp-7',
    q: 'Kendi özel alan adımı (Örn: www.firmam.com) kurumsal web siteme nasıl bağlarım?',
    a: 'Sol menüden "Ayarlar" > "Domain" sekmesine giderek özel alan adınızı yazabilir, DNS yönlendirme (A Kaydı veya Cloudflare NS) adımlarını tamamlayarak SSL sertifikalı kendi domaininiz üzerinden yayın yapabilirsiniz.',
    category: 'seo_domain',
    status: 'active'
  }
];

const shopRetailFaq: FaqItem[] = [
  {
    id: 'shop-1',
    q: 'Ürünlerimi barkodlu olarak Hızlı POS ve Web Vitrinine nasıl eklerim?',
    a: 'Ürün Yönetimi sekmesinden "Yeni Ürün Ekle" veya "Excel ile Toplu Yükle" seçeneklerini kullanarak barkod, satış fiyatı, döviz cinsi, KDV oranı ve stok miktarıyla ürünlerinizi saniyeler içinde tanımlayabilirsiniz.',
    category: 'urun_stok',
    status: 'active'
  },
  {
    id: 'shop-2',
    q: 'Trendyol, Hepsiburada, N11 ve Pazarama pazaryeri mağazalarımı nasıl bağlarım?',
    a: 'Ayarlar > e-Mağaza sekmesinden pazaryeri API anahtarlarınızı girerek stok ve fiyat senkronizasyonunu başlatabilir, gelen siparişleri tek panelden takip edebilirsiniz.',
    category: 'pazaryeri_web',
    status: 'active'
  },
  {
    id: 'shop-3',
    q: 'Hızlı POS ekranında parçalı ödeme (Nakit + Kredi Kartı) ve Veresiye/Cari satış yapılabilir mi?',
    a: 'Evet. Hızlı POS ekranında ödeme alırken Nakit, Kredi Kartı veya Cari Hesap (Açık Hesap) seçebilir, müşterinin bakiyesini Cari Hesaplar modülünden takip edebilirsiniz.',
    category: 'pos_fatura',
    status: 'active'
  },
  {
    id: 'shop-4',
    q: 'E-Fatura ve E-Arşiv faturalarını sistem üzerinden nasıl kesebilirim?',
    a: 'Ayarlar > E-Fatura sekmesinden entegratör bilgilerinizi tanımladıktan sonra Satış Faturaları ekranından GİB mükellef sorgulaması (otomatik PK etiketi tespiti) ile saniyeler içinde resmi E-Fatura veya E-Arşiv faturası gönderebilirsiniz.',
    category: 'pos_fatura',
    status: 'active'
  },
  {
    id: 'shop-5',
    q: 'Dövizli ürünlerde TCMB kurları otomatik güncelleniyor mu?',
    a: 'Evet, sistem TCMB Döviz Alış (ForexBuying) kurlarını arka planda otomatik senkronize eder. Ayrıca Ayarlar > Mağaza > Para & Dil sekmesinden anlık TCMB kur eşitlemesi yapabilirsiniz.',
    category: 'urun_stok',
    status: 'active'
  }
];

export default function FaqTab({ branding }: FaqTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const isCorporateWebsite = Boolean(
    branding?.store_type === 'corporate_website' ||
    branding?.store_type === 'corporate' ||
    branding?.store_type === 'website' ||
    branding?.store_type === 'weblp' ||
    branding?.page_layout_settings?.sector === 'corporate_website' ||
    branding?.page_layout_settings?.sector === 'corporate' ||
    branding?.page_layout_settings?.sector === 'weblp' ||
    branding?.sector === 'corporate_website'
  );

  const isHoreca = Boolean(
    !isCorporateWebsite && (
      branding?.store_type === 'cafe_restaurant' ||
      branding?.store_type === 'horeca' ||
      branding?.store_type === 'restaurant' ||
      branding?.store_type === 'cafe' ||
      branding?.store_type === 'hotel' ||
      branding?.page_layout_settings?.sector === 'cafe_restaurant' ||
      branding?.page_layout_settings?.sector === 'horeca' ||
      branding?.page_layout_settings?.sector === 'hotel'
    )
  );

  const categories = useMemo(() => {
    if (isCorporateWebsite) {
      return [
        { id: 'all', label: 'Tümü' },
        { id: 'tasarim_vitrin', label: 'Vitrin, Renk & Yazı Tipi' },
        { id: 'icerik_sayfalar', label: 'Hizmetler, Sayfalar & Galeri' },
        { id: 'iletisim_harita', label: 'İletişim & Google Harita' },
        { id: 'seo_domain', label: 'SEO, Analitik & Domain' }
      ];
    }
    if (isHoreca) {
      return [
        { id: 'all', label: 'Tümü' },
        { id: 'siparis_odeme', label: 'Sipariş & Ödeme' },
        { id: 'menu_masa', label: 'Menü & Masa Yönetimi' },
        { id: 'stok_recete', label: 'Stok & Reçete (BOM)' },
        { id: 'guvenlik_yetki', label: 'Güvenlik & Yetki' },
        { id: 'genel', label: 'Genel & Altyapı' }
      ];
    }
    return [
      { id: 'all', label: 'Tümü' },
      { id: 'urun_stok', label: 'Ürün, Barkod & Stok' },
      { id: 'pos_fatura', label: 'Hızlı POS & E-Fatura' },
      { id: 'pazaryeri_web', label: 'E-Mağaza & Pazaryeri' }
    ];
  }, [isCorporateWebsite, isHoreca]);

  const faqItems: FaqItem[] = useMemo(() => {
    if (isCorporateWebsite) return corporateWebsiteFaq;
    if (isHoreca) return horecaFaq as FaqItem[];
    return shopRetailFaq;
  }, [isCorporateWebsite, isHoreca]);

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
  }, [faqItems, searchQuery, selectedCategory]);

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

  const headerTitle = isCorporateWebsite
    ? 'Kurumsal Web Sitesi (webLP) Sıkça Sorulan Sorular'
    : isHoreca
      ? 'Cafe & Restoran (horecaLP) Sıkça Sorulan Sorular'
      : 'Perakende & E-Mağaza (shopLP) Sıkça Sorulan Sorular';

  const headerSubtitle = isCorporateWebsite
    ? 'Kurumsal web sitenizin vitrin tasarımı, banner parlaklığı, yazı karakteristiği, renk paleti, özel sayfalar ve Google/Meta entegrasyonları hakkında hızlı rehber.'
    : isHoreca
      ? 'Sistemimizin yetenekleri, özellikleri, devam eden Ar-Ge çalışmaları ve sektörel çözümler hakkında aradığınız tüm profesyonel cevaplar.'
      : 'Ürün yönetimi, Hızlı POS, E-Fatura/E-Arşiv ve Pazaryeri entegrasyonları hakkında aradığınız tüm pratik cevaplar.';

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 rounded-3xl p-6 border border-indigo-100/40 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <HelpCircle className="h-48 w-48 text-indigo-600" />
        </div>
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100/60 dark:bg-indigo-950/60 rounded-full text-xs font-extrabold text-indigo-700 dark:text-indigo-300 mb-3 border border-indigo-200/50 dark:border-indigo-800/50">
            <Sparkles className="h-3.5 w-3.5" />
            Profesyonel Bilgi Bankası
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">
            {headerTitle}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
            {headerSubtitle}
          </p>
        </div>
      </div>

      {/* Search & Category Filter Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sorularda veya cevaplarda arayın..."
            className="w-full pl-11 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl text-sm font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-all text-slate-400 hover:text-slate-600"
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
                  : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-800">
            <HelpCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-800 dark:text-white font-extrabold text-sm mb-1">Eşleşen soru bulunamadı.</p>
            <p className="text-slate-400 text-xs font-semibold">Arama kelimelerinizi değiştirmeyi veya filtreyi temizlemeyi deneyin.</p>
          </div>
        ) : (
          filteredFaq.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div 
                key={item.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl transition-all duration-300 overflow-hidden ${
                  isOpen 
                    ? 'border-indigo-500 shadow-md shadow-indigo-600/5' 
                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 shadow-xs'
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
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-sm sm:text-base leading-snug">
                      {item.q}
                    </h3>
                  </div>
                  <div className={`mt-1 h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    isOpen ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100'
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
                      <div className="px-5 pb-5 pt-1 border-t border-slate-50 dark:border-slate-800">
                        <div className="p-4 bg-slate-50/60 dark:bg-slate-800/60 rounded-xl border border-slate-100/80 dark:border-slate-700 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
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
