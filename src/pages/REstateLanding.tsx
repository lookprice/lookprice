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
  Building,
  TrendingUp,
  MapPin,
  ClipboardList,
  Globe,
  FileText,
  Layers,
  Calendar,
  GitBranch,
  Printer,
  EyeOff,
  PenTool,
  Image,
  Share2,
  Send,
  Smartphone,
  BookOpen,
  Users,
  Cloud,
  BarChart3,
  Radio,
  Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { restateFaq } from '../data/restateFaq';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function REstateLanding() {
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
    { id: 'emlak_yonetim', label: txt('Emlak Yönetimi', 'Real Estate Management', 'Διαχείριση Ακινήτων') },
    { id: 'finans_pazarlama', label: txt('Finans & Raporlar', 'Finance & Reports', 'Χρηματοοικονομικά & Εκθέσεις') },
    { id: 'pazarlama', label: txt('Pazarlama & Sunum', 'Marketing & Presentation', 'Μάρκετινγκ & Παρουσίαση') }
  ];

  const localizedFaq = useMemo(() => {
    return restateFaq.map(item => {
      let q = item.q;
      let a = item.a;
      if (lang === 'en') {
        if (item.id === 'property_document_mgmt') {
          q = "Can we save property documents, landlord, and client details based on status?";
          a = "Yes! With the REstateLP management system, you can save Konut, Ticari, and Tarla/Arsa statuses and Sale/Rent details. You can link Landlords and Clients, and digitally upload deeds, share contracts, and power of attorney.";
        } else if (item.id === 'tour_appointment_calendar') {
          q = "How do we track property showings with the Tour & Appointment Calendar?";
          a = "With the integrated Tour & Appointment Calendar, you can schedule showings, client appointments, and field visits. Share the schedule with other brokers to prevent conflicts.";
        } else if (item.id === 'crm_pipeline_system') {
          q = "How do we monitor sales and rentals using the CRM Pipeline?";
          a = "Our advanced CRM Pipeline lets you drag and drop cards to track steps like first contact, offer, negotiation, deposit, deed transfer, and rental.";
        } else if (item.id === 'shop_window_posters') {
          q = "Can we print automatic information posters and banners for our office showcase?";
          a = "Yes! For every property, the system automatically generates beautifully styled info posters. Print them with one click and showcase them in your office window immediately.";
        } else if (item.id === 'exclusive_private_properties') {
          q = "Can we hide certain portfolios or set exclusive listings in the system?";
          a = "Yes! For privacy or competitive reasons, you can hide custom listings from other brokers or branches, and designate 'Exclusive' agreements.";
        } else if (item.id === 'digital_signed_contracts_restate') {
          q = "Can we digitally sign showing agreements or deposit contracts?";
          a = "Yes! Sign lease, deposit, or showing agreements digitally on your mobile device next to your client or send them via WhatsApp.";
        } else if (item.id === 'realtime_banner_restate') {
          q = "Can we generate social media banners with 'Sold' or 'Rented' badges?";
          a = "Yes! Our Realtime Banner System processes specs onto templates instantly. Generate single-property graphics or collage styles with 'Sold', 'Rented', or 'Opportunity' ribbons.";
        } else if (item.id === 'auto_instagram_restate') {
          q = "Are added listings automatically shared on our Instagram accounts?";
          a = "Yes! Every property is automatically posted to your corporate Instagram and on enrakipsiz.com simultaneously. Updates are automatically updated.";
        } else if (item.id === 'website_builder_restate') {
          q = "Is a custom corporate website generated automatically for our agency?";
          a = "Yes! Upon subscribing, your ultra-fast, modern website is live. Customize themes, colors, and menus easily via drag-and-drop.";
        } else if (item.id === 'enrakipsiz_auto_restate') {
          q = "Are our listings published on our website and enrakipsiz.com automatically?";
          a = "Yes! All listings publish to your website and are auto-listed on the global network enrakipsiz.com simultaneously without manual effort.";
        } else if (item.id === 'mobile_quick_upload_restate') {
          q = "Can we take photos from mobile on-site and upload them instantly?";
          a = "Yes! Forget transferring files to computers. Take photos at the property, enter details and prices, and publish instantly on your website and enrakipsiz.com.";
        } else if (item.id === 'property_expense_tracking') {
          q = "Can we track property expenses, ad spend, and profit/loss?";
          a = "Yes! Input all income/expense transactions like renovations, ads, cleaning, or legal consulting, link them to the portfolio, and analyze profit/loss.";
        } else if (item.id === 'one_glance_portfolio_list') {
          q = "Can we view all rent, sale, and option listings on a single screen?";
          a = "Yes! With the One-Glance Inventory Board, filter listings by Rent, Rented, Sale, Sold, or Option. View size, price, and specs in a single unified list.";
        } else if (item.id === 'ledger_accounts_restate') {
          q = "Can we track maturities and ledger accounts for term or installment sales?";
          a = "Yes! Open ledgers for term sales or lease agreements to track payments, dues, and remaining balances, and export ledger statements easily.";
        }
      } else if (lang === 'el') {
        if (item.id === 'property_document_mgmt') {
          q = "Μπορούμε να αποθηκεύσουμε έγγραφα ακινήτων, ιδιοκτήτες και λεπτομέρειες πελατών με βάση την κατάσταση;";
          a = "Ναι! Με το REstateLP, μπορείτε να αποθηκεύσετε Konut, Ticari και Tarla/Arsa καταστάσεις και Sale/Rent λεπτομέρειες, να συνδέσετε Ιδιοκτήτες και Πελάτες, και να ανεβάσετε ψηφιακά έγγραφα.";
        } else if (item.id === 'tour_appointment_calendar') {
          q = "Πώς παρακολουθούμε τις υποδείξεις ακινήτων με το Ημερολόγιο Περιηγήσεων & Ραντεβού;";
          a = "Σχεδιάστε υποδείξεις ακινήτων, ραντεβού πελατών και επισκέψεις πεδίου. Μοιραστείτε το ημερολόγιο με άλλους μεσίτες για να αποφύγετε επικαλύψεις.";
        } else if (item.id === 'crm_pipeline_system') {
          q = "Πώς παρακολουθούμε τις πωλήσεις και τις ενοικιάσεις χρησιμοποιώντας το CRM Pipeline;";
          a = "Το CRM Pipeline σάς επιτρέπει να παρακολουθείτε βήματα όπως πρώτη επαφή, προσφορά, διαπραγμάτευση, κατάθεση, μεταβίβαση τίτλου και ενοικίαση.";
        } else if (item.id === 'shop_window_posters') {
          q = "Μπορούμε να εκτυπώσουμε αυτόματες αφίσες πληροφοριών για τη βιτρίνα του γραφείου μας;";
          a = "Ναι! Για κάθε ακίνητο, το σύστημα δημιουργεί αυτόματα κομψές αφίσες πληροφοριών. Εκτυπώστε τις με ένα κλικ για τη βιτρίνα του γραφείου σας.";
        } else if (item.id === 'exclusive_private_properties') {
          q = "Μπορούμε να κρύψουμε ορισμένα χαρτοφυλάκια ή να ορίσουμε αποκλειστικές καταχωρίσεις στο σύστημα;";
          a = "Ναι! Για λόγους προστασίας προσωπικών δεδομένων ή ανταγωνισμού, μπορείτε να κρύψετε καταχωρίσεις από άλλους μεσίτες ή υποκαταστήματα.";
        } else if (item.id === 'digital_signed_contracts_restate') {
          q = "Μπορούμε να υπογράψουμε ψηφιακά συμφωνητικά υπόδειξης ή συμβόλαια προκαταβολής;";
          a = "Ναι! Υπογράψτε ψηφιακά συμφωνητικά μίσθωσης, προκαταβολής ή υπόδειξης ακινήτου απευθείας από το κινητό σας ή στείλτε τα μέσω WhatsApp.";
        } else if (item.id === 'realtime_banner_restate') {
          q = "Μπορούμε να δημιουργήσουμε διαφημιστικά πλαίσια κοινωνικών μέσων με σήμανση 'Πουλήθηκε' ή 'Ενοικιάστηκε';";
          a = "Ναι! Το Σύστημά μας παράγει αυτόματα γραφικά με σήμανση 'Πουλήθηκε', 'Ενοικιάστηκε' ή 'Ευκαιρία' έτοιμα για κοινή χρήση σε δευτερόλεπτα.";
        } else if (item.id === 'auto_instagram_restate') {
          q = "Κοινοποιούνται αυτόματα οι καταχωρίσεις στους λογαριασμούς μας στο Instagram;";
          a = "Ναι! Κάθε ακίνητο δημοσιεύεται αυτόματα στο Instagram σας και στο enrakipsiz.com ταυτόχρονα. Οι ενημερώσεις συγχρονίζονται.";
        } else if (item.id === 'website_builder_restate') {
          q = "Δημιουργείται αυτόματα εταιρικός ιστότοπος για το γραφείο μας;";
          a = "Ναι! Με την εγγραφή σας, ο ιστότοπός σας είναι online. Προσαρμόστε θέματα, χρώματα και μενού εύκολα με drag-and-drop.";
        } else if (item.id === 'enrakipsiz_auto_restate') {
          q = "Δημοσιεύονται αυτόματα οι αγγελίες μας στον ιστότοπό μας και στο enrakipsiz.com;";
          a = "Ναι! Όλες οι αγγελίες δημοσιεύονται στον ιστότοπό σας και στο παγκόσμιο δίκτυο enrakipsiz.com ταυτόχρονα χωρίς χειροκίνητη προσπάθεια.";
        } else if (item.id === 'mobile_quick_upload_restate') {
          q = "Μπορούμε να βγάλουμε φωτογραφίες από το κινητό επιτόπου και να τις ανεβάσουμε αμέσως;";
          a = "Ναι! Τραβήξτε φωτογραφίες στο ακίνητο, εισαγάγετε λεπτομέρειες και τιμές και δημοσιεύστε αμέσως στον ιστότοπό σας και στο enrakipsiz.com.";
        } else if (item.id === 'property_expense_tracking') {
          q = "Μπορούμε να παρακολουθούμε έξοδα ακινήτων, διαφημιστικές δαπάνες και κέρδος/ζημία;";
          a = "Ναι! Καταχωρίστε συναλλαγές όπως ανακαινίσεις, διαφημίσεις, καθαρισμό ή νομικές συμβουλές, συνδέστε τις και αναλύστε το κέρδος/ζημία.";
        } else if (item.id === 'one_glance_portfolio_list') {
          q = "Μπορούμε να δούμε όλες τις ενοικιάσεις, πωλήσεις και επιλογές σε μία οθόνη;";
          a = "Ναι! Φιλτράρετε τις καταχωρίσεις κατά Ενοικίαση, Ενοικιάστηκε, Πώληση, Πουλήθηκε ή Επιλογή. Δείτε μέγεθος, τιμή και προδιαγραφές με μια ματιά.";
        } else if (item.id === 'ledger_accounts_restate') {
          q = "Μπορούμε να παρακολουθούμε λήξεις και καθολικά για πωλήσεις με δόσεις;";
          a = "Ναι! Ανοίξτε καθολικά για πωλήσεις ή μισθώσεις για να παρακολουθείτε πληρωμές, οφειλές και υπόλοιπα και εξάγετε καταστάσεις εύκολα.";
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
                      ? 'bg-rose-600 text-white shadow-md' 
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
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50/40 via-transparent to-slate-50/50 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-50 rounded-full text-xs md:text-sm font-black text-rose-700 mb-6 border border-rose-100/50">
            <Sparkles className="h-4 w-4" />
            REstateLP by LookPrice
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-950 tracking-tighter mb-6 leading-[1.1]">
            Yeni Nesil Emlak Portföy ve <br className="hidden md:inline"/> Müşteri Yönetim Sistemi
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-10 font-semibold leading-relaxed">
            Mülkiyet ve tapu koçan tiplerine özel emlak havuzu oluşturun, Sterlin (GBP) fiyatları anlık kurlarla otomatik gösterin, mülk türüne özel PDF broşürleri saniyeler içinde hazırlayın.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 transition-all text-lg flex items-center justify-center gap-2 shadow-lg shadow-rose-600/15 cursor-pointer"
            >
              Hemen Deneyin <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Showcase Visual Section */}
      <section className="py-16 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-block px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold uppercase tracking-wider">
              DİJİTAL GAYRİMENKUL OTOMASYONU
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Lüks Konut Sunum Altyapısı ve Portföy CRM\'i
            </h2>
            <p className="text-slate-600 font-semibold text-sm md:text-base leading-relaxed">
              REstateLP, emlak ofisinizin portföy ağını koçan, tapu tipi, metrekare ve fiyat kriterleriyle kusursuz yönetir. Lüks konutlarınıza ait profesyonel PDF tanıtım broşürlerini saniyeler içinde basmanızı sağlar.
            </p>
            <div className="space-y-3">
              {[
                "Türk Koçanı, Eşdeğer veya Tahsis tapu tiplerine özel filtreler",
                "Fiyatları Sterlin (GBP) olarak girip anlık kurla TL/Euro/USD gösterme",
                "Müşterilerle biyometrik dijital imzalı yetki ve kapora sözleşmeleri"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-700 text-sm font-bold">
                  <CheckCircle className="h-5 w-5 text-rose-500 shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200 bg-slate-950 p-2 group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none" />
              <img 
                src="/images/restate_bg_1785752020453.jpg" 
                alt="REstateLP Property Portfolios Showcase" 
                referrerPolicy="no-referrer"
                className="w-full h-[320px] md:h-[450px] object-cover rounded-[1.8rem] group-hover:scale-[1.01] transition-transform duration-500"
              />
              <div className="absolute bottom-8 left-8 right-8 z-20 bg-black/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-white">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20 mb-2 inline-block">
                  EMLAK PORTAL VİTRİN
                </span>
                <p className="font-black text-lg md:text-xl mb-1">Kurumsal İlan Web Sitesi Altyapısı</p>
                <p className="text-white/60 text-xs md:text-sm font-semibold">Tüm gayrimenkul havuzunuzu kurumsal web sitenizle anlık senkronize yayınlayın.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Emlak Ofisiniz İçin Akıllı Çözümler
          </h2>
          <p className="text-slate-500 font-semibold text-sm sm:text-base leading-relaxed">
            REstateLP, KKTC emlak piyasasının dinamik ve hukuki ihtiyaçlarına %100 tam uyumlu yenilikçi modüller ve araçlar sunar.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { 
              title: 'Mülk, Müşteri & Evrak CRM\'i', 
              desc: 'Konut, Ticari ve Tarla/Arsa gibi her statüde mülkün Satılık/Kiralık kaydı, mülk sahibi detayları ve resmi tapu evrak arşivi.',
              icon: Building,
              color: 'text-rose-600 bg-rose-50 border-rose-100/50'
            },
            { 
              title: 'Gezi & Randevu Takvimi', 
              desc: 'Tüm broker ve danışmanlarınız ile ortak kullanabileceğiniz yer gösterme planlayıcısı ve müşteri saha randevu takvimi.',
              icon: Calendar,
              color: 'text-indigo-600 bg-indigo-50 border-indigo-100/50'
            },
            { 
              title: 'CRM Pipeline Süreç Takibi', 
              desc: 'İlk temastan pazarlık, kapora ve tapu devrine kadar tüm portföy işlem adımlarını görsel pipeline paneli üzerinden izleyin.',
              icon: GitBranch,
              color: 'text-emerald-600 bg-emerald-50 border-emerald-100/50'
            },
            { 
              title: 'Vitrin Bilgi Posterleri (Print)', 
              desc: 'Ofisinizin camına asılacak şık tasarımlı ve özet teknik bilgileri içeren portföy afişlerini saniyeler içinde tasarlayın ve yazdırın.',
              icon: Printer,
              color: 'text-amber-600 bg-amber-50 border-amber-100/50'
            },
            { 
              title: 'Gizli & Yetkili Portföy Yönetimi', 
              desc: 'İstediğiniz hassas portföyü diğer paydaşlardan gizleyin. Tek yetkili (Exclusive) emlak kontratlarını ve sürelerini yönetin.',
              icon: EyeOff,
              color: 'text-purple-600 bg-purple-50 border-purple-100/50'
            },
            { 
              title: 'Dijital İmzalı Sözleşmeler', 
              desc: 'Yer gösterme belgesi, kiralama ve kapora sözleşmelerini müşterinizin yanında veya WhatsApp üzerinden yasal ve biyometrik imzalatın.',
              icon: PenTool,
              color: 'text-blue-600 bg-blue-50 border-blue-100/50'
            },
            { 
              title: 'Realtime Afiş & Görsel Tasarımı', 
              desc: 'Tek tuşla ilan teknik verilerini şablonlara işleyin; "Satıldı", "Kiralandı", "Opsiyonlu", "Fırsat" şeritli kolaj afişleri hazırlayın.',
              icon: Image,
              color: 'text-pink-600 bg-pink-50 border-pink-100/50'
            },
            { 
              title: 'Otomatik Instagram Paylaşımı', 
              desc: 'Portföye eklenen her mülk anında enrakipsiz.com ve kendi hesaplarınızda otomatik paylaşılır; fiyat güncellemelerinde yenilenir.',
              icon: Share2,
              color: 'text-red-600 bg-red-50 border-red-100/50'
            },
            { 
              title: 'Sürükle-Bırak Web Site Sihirbazı', 
              desc: 'Emlak ofisinize özel hazır kurumsal web siteniz saniyeler içinde otomatik kurulur, dilediğiniz gibi sürükle-bırak özelleştirebilirsiniz.',
              icon: Globe,
              color: 'text-emerald-600 bg-emerald-50 border-emerald-100/50'
            },
            { 
              title: 'Otomatik Portföy Dağıtım Ağı', 
              desc: 'Eklediğiniz mülkler el değmeden kendi kurumsal sitenizde ve global emlak paylaşım portalı enrakipsiz.com\'da otomatik listelenir.',
              icon: Send,
              color: 'text-cyan-600 bg-cyan-50 border-cyan-100/50'
            },
            { 
              title: 'Mobil Öncelikli Hızlı Portföy', 
              desc: 'Daha mülkün içerisindeyken telefondan fotoğrafları çekin, verileri girin; anında web sitesinde ve sosyal medyada yayına alın.',
              icon: Smartphone,
              color: 'text-amber-600 bg-amber-50 border-amber-100/50'
            },
            { 
              title: 'Maliyet & Gider Takip Sistemi', 
              desc: 'Mülklere yaptığınız tüm masrafları (reklam, tadilat, hukuki) gelir/gider kalemlerine işleyerek kâr-zarar raporlarını analiz edin.',
              icon: TrendingUp,
              color: 'text-rose-600 bg-rose-50 border-rose-100/50'
            },
            { 
              title: 'Tek Bakışta Envanter Listesi', 
              desc: 'Kiralık, Kiralandı, Satılık, Satıldı, Opsiyonlu mülklerinizi fiyatı ve özet teknik verileriyle tek bakışta izleyin, detayları inceleyin.',
              icon: CheckCircle,
              color: 'text-teal-600 bg-teal-50 border-teal-100/50'
            },
            { 
              title: 'Vadeli İşlemler & Cari Hesap', 
              desc: 'Senetli veya taksitli satış/kiralama işlemlerinizde cari borç/alacak takibi yapın, dilediğiniz an raporlayıp Excel/PDF indirin.',
              icon: BookOpen,
              color: 'text-violet-600 bg-violet-50 border-violet-100/50'
            },
            { 
              title: 'Çok Şubeli CRM & Personel', 
              desc: 'Dilediğiniz kadar şube ve danışman ekleyin. Şubeler arası portföy transferlerini tek panelden yetki kısıtlamalı kontrol edin.',
              icon: Users,
              color: 'text-blue-600 bg-blue-50 border-blue-100/50'
            },
            { 
              title: 'Tek Tuşla Bulut Yedekleme', 
              desc: 'Tüm tapu, evrak, sözleşme ve ilan fotoğraflarınızı Google Cloud sunucularına tek tuşla şifreli ve güvenli yedekleyin.',
              icon: Cloud,
              color: 'text-sky-600 bg-sky-50 border-sky-100/50'
            },
            { 
              title: 'SEO Dostu & Hazır Meta', 
              desc: 'Google Analytics ve Meta Pixel entegrasyonu ile ilan sayfalarınızın reklam yeniden hedefleme (retargeting) kampanyalarını kolaylaştırın.',
              icon: Search,
              color: 'text-slate-600 bg-slate-50 border-slate-100/50'
            },
            { 
              title: 'Gerçek Zamanlı Karar Analitiği', 
              desc: 'Karar alıcılar için üretilmiş, ofisin kâr-zarar, ciro ve işlem adetlerini anlık özetleyen zengin dashboard grafikleri.',
              icon: BarChart3,
              color: 'text-indigo-600 bg-indigo-50 border-indigo-100/50'
            },
            { 
              title: 'Sektörel Radar Takip Sistemi', 
              desc: 'Belirleyeceğiniz anahtar kelimelere göre internetteki en yeni piyasa fırsatlarını ve imar duyurularını yakalayan akıllı emlak radarı.',
              icon: Radio,
              color: 'text-red-600 bg-red-50 border-red-100/50'
            },
            { 
              title: 'Otomatik Döviz & Finansman', 
              desc: 'Günlük otomatik döviz kuru senkronizasyonu, şube harita yol tarifleri, kredi hesaplama motoru ve kullanıcı audit güvenlik kayıtları.',
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
            <span className="text-xs font-extrabold uppercase tracking-widest text-rose-600 bg-rose-50 px-3 py-1 rounded-full mb-3 inline-block">
              {txt('EMLAK BİLGİ BANKASI', 'REAL ESTATE KNOWLEDGE BANK', 'ΤΡΑΠΕΖΑ ΓΝΩΣΕΩΝ ΑΚΙΝΗΤΩΝ')}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {txt('Emlak Sıkça Sorulan Sorular', 'Real Estate FAQs', 'Συχνές Ερωτήσεις Ακινήτων')}
            </h2>
            <p className="text-slate-500 font-semibold text-sm mt-2">
              {txt('REstateLP emlak otomasyonu, mülk yönetimi ve sunum altyapımızla ilgili sıkça sorulan sorular.', 'Frequently asked questions about our REstateLP real estate automation, property management, and presentation system.', 'Συχνές ερωτήσεις σχετικά με τον αυτοματισμό ακινήτων, τη διαχείριση ακινήτων και το σύστημα παρουσίασης REstateLP.')}
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
                placeholder={txt('Koçan, arsa, KDV/Stopaj veya PDF sunumları hakkında arayın...', 'Search about deeds, land, VAT/Withholding tax or PDF presentations...', 'Αναζήτηση για τίτλους ιδιοκτησίας, γη, ΦΠΑ ή παρουσιάσεις PDF...')}
                className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 focus:border-rose-500 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none transition-all"
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
                      ? 'bg-rose-600 text-white'
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
                      isOpen ? 'border-rose-500 shadow-md shadow-rose-600/5' : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <button
                      onClick={() => toggleAccordion(item.id)}
                      className="w-full text-left p-5 flex items-start justify-between gap-4 font-extrabold text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <span className="text-sm md:text-base">{item.q}</span>
                      <div className={`mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                        isOpen ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
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
            <div className="h-8 w-8 bg-rose-600 rounded-lg flex items-center justify-center font-black">LP</div>
            <span className="font-black text-lg">REstateLP</span>
          </div>
          <p className="text-sm text-white/50 font-medium">{txt('© 2026 LookPrice. Tüm Hakları Saklıdır.', '© 2026 LookPrice. All Rights Reserved.', '© 2026 LookPrice. Με επιφύλαξη παντός δικαιώματος.')}</p>
        </div>
      </footer>
    </div>
  );
}
