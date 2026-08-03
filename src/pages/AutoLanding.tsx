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
  Car,
  TrendingUp,
  FileText,
  Globe,
  Layers,
  Smartphone,
  Database,
  BarChart3,
  Users,
  Send,
  Radio,
  Calculator,
  PenTool,
  Image,
  RefreshCw,
  Share2,
  Cloud,
  BookOpen,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { autoFaq } from '../data/autoFaq';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function AutoLanding() {
  const { lang, setLang } = useLanguage();
  const txt = (trText: string, enText: string, elText: string) => {
    if (lang === 'tr') return trText;
    if (lang === 'el') return elText;
    return enText;
  };

  const [openId, setOpenId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const navigate = useNavigate();

  const toggleAccordion = (id: string) => {
    setOpenId(prev => prev === id ? null : id);
  };

  const categories = [
    { id: 'all', label: txt('Tümü', 'All', 'Όλα') },
    { id: 'galeri_yonetim', label: txt('Galeri Yönetimi', 'Gallery Management', 'Διαχείριση Γκαλερί') },
    { id: 'finans_satis', label: txt('Finans & Satış', 'Finance & Sales', 'Χρηματοοικονομικά & Πωλήσεις') },
    { id: 'pazarlama', label: txt('Pazarlama & Web', 'Marketing & Web', 'Μάρκετινγκ & Διαδίκτυο') }
  ];

  const localizedFaq = useMemo(() => {
    return autoFaq.map(item => {
      let q = item.q;
      let a = item.a;
      if (lang === 'en') {
        if (item.id === 'fleet_management') {
          q = "Can we track fleet drivers, mileage, and maintenance history?";
          a = "Yes! With the Advanced Fleet Management Module, you can digitally store driver assignments, active mileage status, service and periodic maintenance history, tire change periods, assignment records, and accident reports.";
        } else if (item.id === 'digital_contract_sign') {
          q = "Can we digitally sign and store vehicle sales and consignment contracts?";
          a = "Yes! You can instantly sign contracts digitally right next to your customer from your mobile device or directly via WhatsApp. Signed agreements are stored on secure cloud servers and can be downloaded as PDF anytime.";
        } else if (item.id === 'realtime_banner_system') {
          q = "Does it generate automatic banners, collages, and 'Sold' banner images for social media?";
          a = "Yes! With the Realtime Banner System, all technical specs are automatically rendered onto template styles. You can generate single vehicle images or beautiful collages. Professional, share-ready graphics are ready in seconds.";
        } else if (item.id === 'auto_instagram_share') {
          q = "Are cars automatically shared on our Instagram accounts?";
          a = "Yes! Every vehicle you add is automatically and simultaneously shared on your corporate Instagram account and on our shared system enrakipsiz.com. Any price or detail updates are auto-synced and updated.";
        } else if (item.id === 'website_builder_auto') {
          q = "Is the corporate website created automatically and is it customizable?";
          a = "Yes! The moment you subscribe, your ultra-fast, modern corporate website is live automatically. You can customize colors, logo, and info with drag-and-drop ease.";
        } else if (item.id === 'enrakipsiz_integration') {
          q = "Are vehicles automatically listed on enrakipsiz.com?";
          a = "Yes! All vehicles are published on your own corporate website and on our global network enrakipsiz.com simultaneously without any manual action.";
        } else if (item.id === 'mobile_first_upload') {
          q = "Can we take photos from mobile and upload directly to the system?";
          a = "Yes! Forget transferring files to computers. Take photos of the vehicle from your phone, enter details and prices, and publish instantly on your website and enrakipsiz.com.";
        } else if (item.id === 'cost_profit_tracking') {
          q = "Can we view car expenses, purchase costs, and net profit/loss reports?";
          a = "Yes! You can track all expenses (customs, port, maintenance, grooming, accessories, etc.) and original purchase cost. Analyze profitability by vehicle or period.";
        } else if (item.id === 'one_glance_inventory') {
          q = "Can we view the entire fleet inventory, mileage, and price on a single screen?";
          a = "Yes! With the Inventory Dashboard, you can see critical data like brand, model, mileage, and price at a glance, with quick access to damage sheets and history.";
        } else if (item.id === 'installment_credit_tracking') {
          q = "Is there ledger and debt tracking for credit and installment sales?";
          a = "Yes! You can open ledgers for your term customers, track maturities, paid installments, and remaining balances, and export ledger statements as Excel or PDF.";
        } else if (item.id === 'multi_branch_crm') {
          q = "Is there support for multi-branch and agent authorization?";
          a = "Yes! AutoLP features an enterprise-grade multi-branch and agent permission architecture. Add unlimited branches and staff, manage inventory transfers, and track branch metrics.";
        } else if (item.id === 'google_cloud_backup') {
          q = "Can we backup all our data securely?";
          a = "Yes! All system data, images, and contracts can be securely backed up to corporate Google Cloud servers with one click.";
        } else if (item.id === 'seo_google_meta_pixel') {
          q = "Can SEO compliance and Google / Meta Ad pixel codes be added?";
          a = "Yes! Our SEO-compliant codebase ensures you rank high in Google searches. Add your Google Analytics and Meta Pixel codes in seconds for retargeting.";
        } else if (item.id === 'realtime_analytics_dashboard') {
          q = "Is there a real-time analytics and charts dashboard?";
          a = "Yes! Top-selling vehicle segments, average selling times, branch revenues, and financial statements are instantly shown with sleek interactive charts.";
        }
      } else if (lang === 'el') {
        if (item.id === 'fleet_management') {
          q = "Μπορούμε να παρακολουθούμε οδηγούς στόλου, χιλιόμετρα και ιστορικό συντήρησης;";
          a = "Ναι! Με την Προηγμένη Μονάδα Διαχείρισης Στόλου, μπορείτε να αποθηκεύετε ψηφιακά αναθέσεις οδηγών, ενεργά χιλιόμετρα, ιστορικό σέρβις και περιοδικής συντήρησης, αλλαγές ελαστικών και αναφορές ατυχημάτων.";
        } else if (item.id === 'digital_contract_sign') {
          q = "Μπορούμε να υπογράφουμε ψηφιακά και να αποθηκεύουμε συμβόλαια πωλήσεων και παρακαταθήκης;";
          a = "Ναι! Μπορείτε να υπογράψετε συμβόλαια ψηφιακά δίπλα στον πελάτη σας από την κινητή συσκευή σας ή απευθείας μέσω WhatsApp. Οι συμφωνίες αποθηκεύονται σε ασφαλείς διακομιστές cloud και λήψη σε PDF ανά πάσα στιγμή.";
        } else if (item.id === 'realtime_banner_system') {
          q = "Δημιουργεί αυτόματα διαφημιστικά πλαίσια, κολάζ και εικόνες με σήμανση 'Πουλήθηκε' για τα κοινωνικά μέσα;";
          a = "Ναι! Με το Σύστημα Banner σε Πραγματικό Χρόνο, όλες οι τεχνικές προδιαγραφές αποδίδονται αυτόματα σε πρότυπα στυλ. Μπορείτε να δημιουργήσετε εικόνες μεμονωμένων οχημάτων ή κολάζ, έτοιμα για κοινή χρήση σε δευτερόλεπτα.";
        } else if (item.id === 'auto_instagram_share') {
          q = "Κοινοποιούνται αυτόματα τα αυτοκίνητα στους λογαριασμούς μας στο Instagram;";
          a = "Ναι! Κάθε όχημα που προσθέτετε κοινοποιείται αυτόματα και ταυτόχρονα στον εταιρικό σας λογαριασμό Instagram και στο enrakipsiz.com. Τυχόν ενημερώσεις τιμών ή λεπτομερειών συγχρονίζονται αυτόματα.";
        } else if (item.id === 'website_builder_auto') {
          q = "Δημιουργείται αυτόματα ο εταιρικός ιστότοπος και είναι προσαρμόσιμος;";
          a = "Ναι! Τη στιγμή που εγγράφεστε, ο εξαιρετικά γρήγορος, σύγχρονος εταιρικός ιστότοπός σας είναι αυτόματα online. Μπορείτε να προσαρμόσετε χρώματα, λογότυπο και πληροφορίες με ευκολία drag-and-drop.";
        } else if (item.id === 'enrakipsiz_integration') {
          q = "Καταχωρούνται αυτόματα τα οχήματα στο enrakipsiz.com;";
          a = "Ναι! Όλα τα οχήματα δημοσιεύονται στον δικό σας εταιρικό ιστότοπο και στο παγκόσμιο δίκτυο enrakipsiz.com ταυτόχρονα χωρίς καμία χειροκίνητη ενέργεια.";
        } else if (item.id === 'mobile_first_upload') {
          q = "Μπορούμε να βγάλουμε φωτογραφίες από το κινητό και να τις ανεβάσουμε απευθείας στο σύστημα;";
          a = "Ναι! Ξεχάστε τη μεταφορά αρχείων σε υπολογιστές. Τραβήξτε φωτογραφίες του οχήματος από το τηλέφωνό σας, εισαγάγετε λεπτομέρειες και τιμές και δημοσιεύστε αμέσως στον ιστότοπό σας και στο enrakipsiz.com.";
        } else if (item.id === 'cost_profit_tracking') {
          q = "Μπορούμε να δούμε έξοδα αυτοκινήτου, κόστος αγοράς και αναφορές καθαρού κέρδους/ζημίας;";
          a = "Ναι! Μπορείτε να παρακολουθείτε όλα τα έξοδα (εκτελωνισμός, λιμάνι, συντήρηση, περιποίηση, αξεσουάρ κ.λπ.) και το αρχικό κόστος αγοράς. Αναλύστε την κερδοφορία ανά όχημα ή περίοδο.";
        } else if (item.id === 'one_glance_inventory') {
          q = "Μπορούμε να δούμε ολόκληρο το απόθεμα στόλου, τα χιλιόμετρα και την τιμή σε μία μόνο οθόνη;";
          a = "Ναι! Με τον Πίνακα Ελέγχου Αποθεμάτων, μπορείτε να δείτε κρίσιμα δεδομένα όπως μάρκα, μοντέλο, χιλιόμετρα και τιμή με μια ματιά, με γρήγορη πρόσβαση σε φύλλα ζημιών και ιστορικό.";
        } else if (item.id === 'installment_credit_tracking') {
          q = "Υπάρχει παρακολούθηση καθολικού και χρεών για πωλήσεις με πίστωση και δόσεις;";
          a = "Ναι! Μπορείτε να ανοίξετε καθολικά για τους πελάτες σας, να παρακολουθείτε λήξεις, πληρωμένες δόσεις και υπόλοιπα, και να εξάγετε καταστάσεις καθολικού σε Excel ή PDF.";
        } else if (item.id === 'multi_branch_crm') {
          q = "Υπάρχει υποστήριξη για πολλαπλά υποκαταστήματα και εξουσιοδότηση αντιπροσώπων;";
          a = "Ναι! Το AutoLP διαθέτει εταιρική αρχιτεκτονική πολλαπλών υποκαταστημάτων και αδειών προσωπικού. Προσθέστε απεριόριστα υποκαταστήματα, διαχειριστείτε μεταφορές αποθεμάτων και παρακολουθήστε μετρήσεις.";
        } else if (item.id === 'google_cloud_backup') {
          q = "Μπορούμε να δημιουργήσουμε αντίγραφα ασφαλείας όλων των δεδομένων μας με ασφάλεια;";
          a = "Ναι! Όλα τα δεδομένα του συστήματος, οι εικόνες και τα συμβόλαια μπορούν να δημιουργηθούν με ασφάλεια αντίγραφα ασφαλείας στους εταιρικούς διακομιστές Google Cloud με ένα κλικ.";
        } else if (item.id === 'seo_google_meta_pixel') {
          q = "Μπορεί να προστεθεί συμμόρφωση SEO και κώδικες pixel Google / Meta Ad;";
          a = "Ναι! Η συμβατή με SEO βάση κώδικά μας διασφαλίζει ότι κατατάσσεστε ψηλά στις αναζητήσεις Google. Προσθέστε τους κωδικούς Google Analytics και Meta Pixel σε δευτερόλεπτα.";
        } else if (item.id === 'realtime_analytics_dashboard') {
          q = "Υπάρχει πίνακας ελέγχου αναλύσεων και γραφημάτων σε πραγματικό χρόνο;";
          a = "Ναι! Τα τμήματα οχημάτων με τις περισσότερες πωλήσεις, οι μέσοι χρόνοι πώλησης, τα έσοδα υποκαταστημάτων και οι οικονομικές καταστάσεις εμφανίζονται αμέσως με κομψά διαδραστικά γραφήματα.";
        }
      }
      return { ...item, q, a };
    });
  }, [lang]);

  const filteredFaq = useMemo(() => {
    return localizedFaq.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const cleanQuery = searchQuery.toLowerCase().trim();
      const matchesSearch = !cleanQuery || 
        item.q.toLowerCase().includes(cleanQuery) || 
        item.a.toLowerCase().includes(cleanQuery);
      return matchesCategory && matchesSearch;
    });
  }, [localizedFaq, searchQuery, selectedCategory]);

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
          
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200">
              {['tr', 'en', 'el'].map((l) => (
                <button 
                  key={l}
                  onClick={() => setLang(l as 'tr' | 'en' | 'el')}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-[10px] font-black transition-all ${
                    lang === l 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {l === 'el' ? 'GR' : l.toUpperCase()}
                </button>
              ))}
            </div>

            <button 
              onClick={() => navigate('/')} 
              className="text-sm font-extrabold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-xl transition-all"
            >
              {txt('Ana Sayfaya Dön', 'Return to Home Page', 'Επιστροφή στην Αρχική')}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-slate-50/50 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full text-xs md:text-sm font-black text-blue-700 mb-6 border border-blue-100/50">
            <Sparkles className="h-4 w-4" />
            AutoLP by LookPrice
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-950 tracking-tighter mb-6 leading-[1.1]">
            Yeni Nesil Galeri ve Araç <br className="hidden md:inline"/> Portföy Yönetim Sistemi
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-10 font-semibold leading-relaxed">
            Araç stoklarınızı Sterlin (GBP) veya döviz bazlı yönetin, tek tuşla profesyonel PDF broşürleri basın ve galeriniz için harika bir dijital vitrin oluşturun.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all text-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-600/15 cursor-pointer animate-bounce-subtle"
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
            <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase tracking-wider">
              DİJİTAL OTO GALERİ ÇÖZÜMLERİ
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Gelişmiş Araç Envanteri ve Satış Yönetimi
            </h2>
            <p className="text-slate-600 font-semibold text-sm md:text-base leading-relaxed">
              AutoLP, araç stok takibinden gümrükleme, seyrüsefer ve plaka süreçlerine kadar galerinizin ihtiyaç duyduğu tüm takip adımlarını bir araya getirir. Döviz kurları ile entegre fiyalandırma motoru her zaman güncel kalmanızı sağlar.
            </p>
            <div className="space-y-3">
              {[
                "Sterlin (GBP), EUR ve USD bazlı çoklu para birimi motoru",
                "Gümrükleme, seyrüsefer ve koçan devir tarihlerine özel alarmlar",
                "Tek tıkla araç özelliklerini içeren PDF katalog ve broşür çıktısı"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-700 text-sm font-bold">
                  <CheckCircle className="h-5 w-5 text-blue-500 shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200 bg-slate-950 p-2 group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none" />
              <img 
                src="/images/auto_bg_1785752006748.jpg" 
                alt="AutoLP Vehicle Portfolios Showcase" 
                referrerPolicy="no-referrer"
                className="w-full h-[320px] md:h-[450px] object-cover rounded-[1.8rem] group-hover:scale-[1.01] transition-transform duration-500"
              />
              <div className="absolute bottom-8 left-8 right-8 z-20 bg-black/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-white">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 mb-2 inline-block">
                  OTO GALERİ VİTRİN
                </span>
                <p className="font-black text-lg md:text-xl mb-1">Dinamik Kur ve Portföy Senkronizasyonu</p>
                <p className="text-white/60 text-xs md:text-sm font-semibold">Araçlarınızı anlık Merkez Bankası döviz kurları ile eşitleyerek web sitenizde hatasız fiyatlandırın.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
            Galeriniz İçin En Gelişmiş Özellikler
          </h2>
          <p className="text-slate-500 font-semibold text-sm sm:text-base">
            AutoLP, geleneksel verimsiz yöntemleri geride bırakarak tamamen küresel galeri standartlarına göre inşa edilmiştir.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { 
              title: 'Gelişmiş Filo Yönetimi', 
              desc: 'Araçlarınızın Sürücü, Km, Servis/Bakım geçmişi, Lastik değişimleri, Zimmet, Kaza Raporları ve Tüm Resmi Evraklarına dijital ortamda ulaşın.',
              icon: Car,
              color: 'text-blue-600 bg-blue-50 border-blue-100/50'
            },
            { 
              title: 'Dijital İmzalı Sözleşmeler', 
              desc: 'Araç Satış ve Konsinye Sözleşmelerini müşterinizin yanında veya WhatsApp üzerinden yasal olarak anında imzalayıp güvenle saklayın.',
              icon: PenTool,
              color: 'text-indigo-600 bg-indigo-50 border-indigo-100/50'
            },
            { 
              title: 'Realtime Afiş & Görsel Tasarımı', 
              desc: 'Tek resim veya kolaj sosyal medya görselleri üretir. Satılan araçlar için "Satıldı", "Opsiyonlu", "Fırsat" şeritli afişler hazırlar.',
              icon: Image,
              color: 'text-purple-600 bg-purple-50 border-purple-100/50'
            },
            { 
              title: 'Instagram Otomatik Paylaşımı', 
              desc: 'Eklenen her araç anında enrakipsiz.com ve kendi hesaplarınızda otomatik paylaşılır; fiyat değişimlerinde otomatik güncellenir.',
              icon: Share2,
              color: 'text-pink-600 bg-pink-50 border-pink-100/50'
            },
            { 
              title: 'Sürükle-Bırak Web Site Sihirbazı', 
              desc: 'Size özel hazır kurumsal web siteniz saniyeler içinde otomatik kurulur, dilediğiniz gibi sürükle-bırak özelleştirebilirsiniz.',
              icon: Globe,
              color: 'text-emerald-600 bg-emerald-50 border-emerald-100/50'
            },
            { 
              title: 'Otomatik Alıcı Dağıtım Ağı', 
              desc: 'Portföydeki araçlarınız el değmeden kurumsal web sitenizde ve global ilan platformu enrakipsiz.com\'da yayına alınarak sergilenir.',
              icon: Send,
              color: 'text-cyan-600 bg-cyan-50 border-cyan-100/50'
            },
            { 
              title: 'Mobil Öncelikli Hızlı Giriş', 
              desc: 'Telefondan fotoğraf çekip anında portföye yükleyin; kablosuz, anlık ve son derece hızlı envanter yönetim kolaylığı.',
              icon: Smartphone,
              color: 'text-amber-600 bg-amber-50 border-amber-100/50'
            },
            { 
              title: 'Araç Maliyet & Kârlılık Takibi', 
              desc: 'Yaptığınız tüm harcamaları takip edip gelir/gider kayıtlarını portföyünüzle ilişkilendirerek kâr-zarar durum analizleri yapın.',
              icon: TrendingUp,
              color: 'text-rose-600 bg-rose-50 border-rose-100/50'
            },
            { 
              title: 'Tek Bakışta Kilometre Envanteri', 
              desc: 'Tüm araçlarınızın detaylı listesini, kilometrelerini ve fiyatlarını tek bakışta izleyin, görsel detayları tek tıkla inceleyin.',
              icon: CheckCircle,
              color: 'text-teal-600 bg-teal-50 border-teal-100/50'
            },
            { 
              title: 'Vadeli Satış & Cari Hesap', 
              desc: 'Vadeli satışlarınızda borç/alacak takibi yapın, dilediğiniz an raporlayın ve Excel veya PDF olarak tek tıkla dışarı aktarın.',
              icon: BookOpen,
              color: 'text-amber-600 bg-amber-50 border-amber-100/50'
            },
            { 
              title: 'Çok Şubeli CRM & Personel', 
              desc: 'Sınırsız şube ve satış temsilcisi ekleyin. Şubeler arası araç transferi ve zimmet işlemlerini tek panelden kolayca yönetin.',
              icon: Users,
              color: 'text-blue-600 bg-blue-50 border-blue-100/50'
            },
            { 
              title: 'Tek Tuşla Bulut Yedekleme', 
              desc: 'Tüm verilerinizi tek tuşla kurumsal Google Cloud sistemlerine şifreli olarak yedekleyin, her an güvenle erişin.',
              icon: Cloud,
              color: 'text-sky-600 bg-sky-50 border-sky-100/50'
            },
            { 
              title: 'SEO Dostu & Hazır Meta', 
              desc: 'Google hesaplarını ve reklam piksellerini kolayca tanımlayarak PR ve pazarlama kampanyalarınızı anında optimize edin.',
              icon: Search,
              color: 'text-neutral-600 bg-neutral-50 border-neutral-100/50'
            },
            { 
              title: 'Gerçek Zamanlı Karar Analitiği', 
              desc: 'Yöneticiler için anlık raporlama sunan, işletmenizin tüm finansal durumunu özetleyen dinamik dashboard ekranı.',
              icon: BarChart3,
              color: 'text-violet-600 bg-violet-50 border-violet-100/50'
            },
            { 
              title: 'Sektörel Radar Takip Sistemi', 
              desc: 'Belirleyeceğiniz anahtar kelimelere göre internetteki en yeni piyasa fırsatlarını ve araç haberlerini yakalayan radar.',
              icon: Radio,
              color: 'text-red-600 bg-red-50 border-red-100/50'
            },
            { 
              title: 'Otomatik Döviz & Finansman', 
              desc: 'Otomatik Merkez Bankası döviz kur eşitlemesi, harita yol tarifleri, kredi hesaplama motoru ve kullanıcı işlem denetim kayıtları.',
              icon: Calculator,
              color: 'text-emerald-600 bg-emerald-50 border-emerald-100/50'
            }
          ].map((f, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
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
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-3 inline-block">
              {txt('MERAK EDİLENLER', 'COMMON QUESTIONS', 'ΣΥΧΝΕΣ ΕΡΩΤΗΣΕΙΣ')}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {txt('Sıkça Sorulan Sorular', 'Frequently Asked Questions', 'Συχνές Ερωτήσεις')}
            </h2>
            <p className="text-slate-500 font-semibold text-sm mt-2">
              {txt('AutoLP araç portföy yönetim sistemimiz hakkında aradığınız tüm teknik ve operasyonel yanıtlar.', 'All technical and operational answers about our AutoLP vehicle portfolio management system.', 'Όλες οι τεχνικές και λειτουργικές απαντήσεις σχετικά με το σύστημα διαχείρισης στόλου AutoLP.')}
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
                placeholder={txt('Araç yönetimi, döviz, PDF veya tescil hakkında arayın...', 'Search about vehicle management, currency, PDF or registration...', 'Αναζήτηση για διαχείριση οχημάτων, νόμισμα, PDF ή εγγραφή...')}
                className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 focus:border-blue-500 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none transition-all"
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
                      ? 'bg-blue-600 text-white'
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
                <p className="text-slate-800 font-extrabold text-sm">{txt('Aramanızla eşleşen soru bulunamadı.', 'No questions found matching your search.', 'Δεν βρέθηκαν ερωτήσεις που να ταιριάζουν με την αναζήτησή σας.')}</p>
              </div>
            ) : (
              filteredFaq.map((item) => {
                const isOpen = openId === item.id;
                return (
                  <div 
                    key={item.id} 
                    className={`bg-white border rounded-2xl transition-all ${
                      isOpen ? 'border-blue-500 shadow-md shadow-blue-600/5' : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <button
                      onClick={() => toggleAccordion(item.id)}
                      className="w-full text-left p-5 flex items-start justify-between gap-4 font-extrabold text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <span className="text-sm md:text-base">{item.q}</span>
                      <div className={`mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                        isOpen ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'
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
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center font-black">LP</div>
            <span className="font-black text-lg">AutoLP</span>
          </div>
          <p className="text-sm text-white/50 font-medium">{txt('© 2026 LookPrice. Tüm Hakları Saklıdır.', '© 2026 LookPrice. All Rights Reserved.', '© 2026 LookPrice. Με επιφύλαξη παντός δικαιώματος.')}</p>
        </div>
      </footer>
    </div>
  );
}
