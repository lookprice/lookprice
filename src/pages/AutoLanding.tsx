import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
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
  ShieldCheck,
  Play,
  Tv,
  Youtube
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { autoFaq } from '../data/autoFaq';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';

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

  const [dbVideos, setDbVideos] = useState<any[]>([]);
  const [activeVideoTab, setActiveVideoTab] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    api.getPublicVideos("autolp")
      .then(res => {
        if (res && Array.isArray(res) && res.length > 0) {
          setDbVideos(res);
        }
      })
      .catch(err => console.error("Error fetching Auto videos:", err));
  }, []);

  const videoTabs = useMemo(() => {
    if (dbVideos.length > 0) {
      return dbVideos.map(v => ({
        id: v.product_key,
        title: v.title,
        tag: "AUTOLP",
        description: v.description || "",
        youtubeId: v.youtube_id,
        duration: v.duration || "1:00",
        isLive: v.is_live,
        coverImg: v.cover_img || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80"
      }));
    }
    return [
      {
        id: "auto_portfolio",
        title: txt("Araç Portföyü & Tramer Kaydı", "Vehicle Portfolio & Damage History", "Vehicle Portfolio & Damage History"),
        tag: "AUTOLP",
        description: txt(
          "Marka, model, donanım paketleri ve detaylı tramer/boya-değişen bilgilerinin sisteme eklenmesi ve takibi.",
          "Addition and tracking of make, model, trim packages, and detailed accident/paint-replaced information.",
          "Addition and tracking of make, model, trim packages, and detailed accident/paint-replaced information."
        ),
        youtubeId: "bdbXezbS35c",
        duration: "1:30",
        isLive: true,
        coverImg: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "auto_contract",
        title: txt("Noter Satış & Konsinye Sözleşmesi", "Notary Sale & Consignment Contract", "Notary Sale & Consignment Contract"),
        tag: "AUTOLP",
        description: txt(
          "Tek tıkla resmi noter satış, konsinye (araç teslimat) ve kapora sözleşmelerinin dinamik basımı ve arşivlenmesi.",
          "One-click dynamic printing and archiving of official notary sales, consignment delivery, and deposit contracts.",
          "One-click dynamic printing and archiving of official notary sales, consignment delivery, and deposit contracts."
        ),
        youtubeId: null,
        duration: txt("Yakında", "Coming Soon", "Coming Soon"),
        isLive: false,
        coverImg: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "auto_showcase",
        title: txt("Dijital Vitrin & Sosyal Medya", "Digital Showcase & Social Media", "Digital Showcase & Social Media"),
        tag: "AUTOLP",
        description: txt(
          "Eklenen araç ilanlarının anında galeri kurumsal web sitesinde ve sosyal medyadaki lüks şablonlarla otomatik paylaşımı.",
          "Instant automated publishing of vehicles to gallery corporate websites and luxury social media templates.",
          "Instant automated publishing of vehicles to gallery corporate websites and luxury social media templates."
        ),
        youtubeId: null,
        duration: txt("Yakında", "Coming Soon", "Coming Soon"),
        isLive: false,
        coverImg: "https://images.unsplash.com/photo-1562577309-4932fdd64cd1?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "auto_finance",
        title: txt("Alış-Satış & Cari Finans Takibi", "Buy-Sell & Finance Ledger Tracking", "Buy-Sell & Finance Ledger Tracking"),
        tag: "AUTOLP",
        description: txt(
          "Konsinye ve öz-mal araçların alış/satış kâr-zarar tabloları, vergi hesaplamaları ve genel kasa gider raporları.",
          "Profit-loss statements, tax calculations, and cash flow expense reports for consignment and owned vehicles.",
          "Profit-loss statements, tax calculations, and cash flow expense reports for consignment and owned vehicles."
        ),
        youtubeId: null,
        duration: txt("Yakında", "Coming Soon", "Coming Soon"),
        isLive: false,
        coverImg: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80"
      }
    ];
  }, [dbVideos, lang]);

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
        } else if (item.id === 'radar_news_tracking') {
          q = "Is there a radar system to track sector developments and vehicle listings?";
          a = "Yes. You can instantly catch current market news and opportunity listings with the smart Radar Tracking System that continuously scans the internet for keywords you specify.";
        } else if (item.id === 'currency_credit_audit') {
          q = "Are real-time exchange rates, loan calculation, and user transaction audits included?";
          a = "Yes. You keep your gallery under full control with professional tools like daily automatic exchange rate synchronization, map directions, loan calculation engine, and Audit Logs.";
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
        } else if (item.id === 'radar_news_tracking') {
          q = "Υπάρχει σύστημα ραντάρ για την παρακολούθηση των εξελίξεων του τομέα και των αγγελιών οχημάτων;";
          a = "Ναι. Μπορείτε να παρακολουθείτε άμεσα τα τρέχοντα νέα της αγοράς και τις ευκαιρίες με το έξυπνο σύστημα παρακολούθησης ραντάρ που σαρώνει συνεχώς το διαδίκτυο.";
        } else if (item.id === 'currency_credit_audit') {
          q = "Περιλαμβάνονται συναλλαγματικές ισοτιμίες σε πραγματικό χρόνο, υπολογισμός δανείου και έλεγχοι συναλλαγών χρηστών;";
          a = "Ναι. Διατηρείτε τη γκαλερί σας υπό πλήρη έλεγχο με επαγγελματικά εργαλεία όπως ο καθημερινός αυτόματος συγχρονισμός συναλλαγματικών ισοτιμιών και τα αρχεία καταγραφής ελέγχου.";
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
      <Helmet>
        <title>AutoLP | {txt('Galeri ve Araç Yönetim Yazılımı', 'Gallery and Vehicle Management Software', 'Λογισμικό Διαχείρισης Γκαλερί & Οχημάτων')}</title>
        <meta name="description" content={txt(
          "AutoLP ile oto galeri ve araç yönetimini dijitalleştirin. Araç stok takibi, galeri CRM, dijital satış sözleşmeleri ve otomatik sosyal medya paylaşımı ile işlerinizi hızlandırın.",
          "Digitalize your auto gallery and vehicle management with AutoLP. Accelerate your business with vehicle stock tracking, gallery CRM, digital sales contracts, and automated social media sharing.",
          "Ψηφιοποιήστε τη διαχείριση της γκαλερί αυτοκινήτων και των οχημάτων σας με το AutoLP. Επιταχύνετε τις δραστηριότητές σας με παρακολούθηση αποθεμάτων οχημάτων, CRM γκαλερί, ψηφιακά συμβόλαια πωλήσεων και αυτοματοποιημένη κοινή χρήση στα κοινωνικά μέσα."
        )} />
        <meta name="keywords" content="Araç stok yönetimi, galeri otomasyonu, ikinci el araç takip, galeri crm, oto satış programı, plaka sorgulama, araç ekspertiz raporu, dijital galeri yönetimi, otomotiv satış yazılımı, galeri yönetim sistemi, filo takip yazılımı, araç satış sözleşmesi, dijital galeri vitrini, araç maliyet takip, stok takip programı, ikinci el galeri programı, oto crm yazılımı" />
      </Helmet>
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
            {txt('Yeni Nesil Galeri ve Araç', 'Next-Gen Gallery and Vehicle', 'Νέα Γενιά Γκαλερί και Όχημα')} <br className="hidden md:inline"/> {txt('Portföy Yönetim Sistemi', 'Portfolio Management System', 'Σύστημα Διαχείρισης Χαρτοφυλακίου')}
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-10 font-semibold leading-relaxed">
            {txt('Araç stoklarınızı Sterlin (GBP) veya döviz bazlı yönetin, tek tuşla profesyonel PDF broşürleri basın ve galeriniz için harika bir dijital vitrin oluşturun.', 'Manage your vehicle stocks in Sterling (GBP) or foreign currency, print professional PDF brochures with a single click, and create a fantastic digital showcase for your gallery.', 'Διαχειριστείτε τα αποθέματα των οχημάτων σας σε στερλίνα (GBP) ή σε ξένο νόμισμα, εκτυπώστε επαγγελματικά φυλλάδια PDF με ένα μόνο κλικ και δημιουργήστε μια φανταστική ψηφιακή βιτρίνα για τη γκαλερί σας.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all text-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-600/15 cursor-pointer animate-bounce-subtle"
            >
              {txt('Ücretsiz Deneyin', 'Try for Free', 'Δοκιμάστε Δωρεάν')} <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Showcase Visual Section */}
      <section className="py-16 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase tracking-wider">
              {txt('DİJİTAL OTO GALERİ ÇÖZÜMLERİ', 'DIGITAL AUTO GALLERY SOLUTIONS', 'ΨΗΦΙΑΚΕΣ ΛΥΣΕΙΣ ΓΚΑΛΕΡΙ ΑΥΤΟΚΙΝΗΤΩΝ')}
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              {txt('Gelişmiş Araç Envanteri ve Satış Yönetimi', 'Advanced Vehicle Inventory and Sales Management', 'Προηγμένο Απόθεμα Οχημάτων και Διαχείριση Πωλήσεων')}
            </h2>
            <p className="text-slate-600 font-semibold text-sm md:text-base leading-relaxed">
              {txt('AutoLP, araç stok takibinden gümrükleme, seyrüsefer ve plaka süreçlerine kadar galerinizin ihtiyaç duyduğu tüm takip adımlarını bir araya getirir. Döviz kurları ile entegre fiyalandırma motoru her zaman güncel kalmanızı sağlar.', 'AutoLP brings together all the tracking steps your gallery needs, from vehicle stock tracking to customs, navigation, and license plate processes. The integrated pricing engine with exchange rates keeps you always up to date.', 'Το AutoLP συγκεντρώνει όλα τα βήματα παρακολούθησης που χρειάζεται η γκαλερί σας, από την παρακολούθηση αποθέματος οχημάτων έως τις διαδικασίες εκτελωνισμού, πλοήγησης και πινακίδων κυκλοφορίας. Ο ενσωματωμένος μηχανισμός τιμολόγησης με τις συναλλαγματικές ισοτιμίες σας κρατά πάντα ενημερωμένους.')}
            </p>
            <div className="space-y-3">
              {[
                txt("Sterlin (GBP), EUR ve USD bazlı çoklu para birimi motoru", "Multi-currency engine based on Sterling (GBP), EUR, and USD", "Μηχανή πολλαπλών νομισμάτων με βάση Στερλίνα (GBP), EUR και USD"),
                txt("Gümrükleme, seyrüsefer ve koçan devir tarihlerine özel alarmlar", "Special alarms for customs clearance, navigation, and logbook transfer dates", "Ειδικοί συναγερμοί για εκτελωνισμό, πλοήγηση και ημερομηνίες μεταβίβασης βιβλίου καταγραφής"),
                txt("Tek tıkla araç özelliklerini içeren PDF katalog ve broşür çıktısı", "One-click PDF catalog and brochure output containing vehicle features", "Παραγωγή καταλόγου και φυλλαδίου PDF με ένα κλικ που περιέχει τα χαρακτηριστικά του οχήματος")
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
                src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80" 
                alt="AutoLP Vehicle Portfolios Showcase" 
                referrerPolicy="no-referrer"
                className="w-full h-[320px] md:h-[450px] object-cover rounded-[1.8rem] group-hover:scale-[1.01] transition-transform duration-500"
              />
              <div className="absolute bottom-8 left-8 right-8 z-20 bg-black/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-white">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 mb-2 inline-block">
                  {txt('OTO GALERİ VİTRİN', 'AUTO GALLERY SHOWCASE', 'ΒΙΤΡΙΝΑ ΓΚΑΛΕΡΙ ΑΥΤΟΚΙΝΗΤΩΝ')}
                </span>
                <p className="font-black text-lg md:text-xl mb-1">{txt('Dinamik Kur ve Portföy Senkronizasyonu', 'Dynamic Exchange Rate and Portfolio Synchronization', 'Δυναμική Συναλλαγματική Ισοτιμία και Συγχρονισμός Χαρτοφυλακίου')}</p>
                <p className="text-white/60 text-xs md:text-sm font-semibold">{txt('Araçlarınızı anlık Merkez Bankası döviz kurları ile eşitleyerek web sitenizde hatasız fiyatlandırın.', 'Price your vehicles accurately on your website by synchronizing them with real-time Central Bank exchange rates.', 'Τιμολογήστε τα οχήματά σας με ακρίβεια στον ιστότοπό σας συγχρονίζοντάς τα με τις συναλλαγματικές ισοτιμίες της Κεντρικής Τράπεζας σε πραγματικό χρόνο.')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Showcase Section */}
      <section className="py-20 bg-gradient-to-b from-white to-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-blue-500/10 text-blue-700 rounded-full text-xs font-black tracking-wider uppercase border border-blue-500/10">
              <Tv className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
              {txt('SİSTEMİ CANLI İZLEYİN', 'WATCH LIVE DEMO', 'ΠΑΡΑΚΟΛΟΥΘΗΣΤΕ LIVE')}
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mt-3 mb-4">
              {txt('Uygulamalı Sistem Özellikleri & Video Turu', 'Interactive System Tour & Live Demos', 'Διαδραστική Περιήγηση Συστήματος & Live Demos')}
            </h2>
            <p className="text-slate-500 font-semibold text-sm sm:text-base leading-relaxed">
              {txt(
                'AutoLP oto galeri programının tüm modüllerini ve araç yönetim akışlarını uygulamalı anlatımlarla canlı olarak izleyin.',
                'Watch real usage scenarios and explore how the entire AutoLP suite functions in gallery operations.',
                'Watch real usage scenarios and explore how the entire AutoLP suite functions in gallery operations.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            {/* Left Side: Video Selector Tabs */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4 order-2 lg:order-1">
              <div className="space-y-3">
                {videoTabs.map((tab, idx) => {
                  const isActive = activeVideoTab === idx;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveVideoTab(idx);
                        setIsVideoPlaying(false);
                      }}
                      className={`w-full text-left p-5 rounded-2xl border transition-all relative overflow-hidden flex items-start gap-4 cursor-pointer ${
                        isActive
                          ? 'bg-white border-blue-500/20 shadow-md shadow-blue-500/5'
                          : 'bg-white/50 border-slate-100 hover:bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        isActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Tv className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${
                            isActive ? 'text-blue-700' : 'text-slate-400'
                          }`}>
                            {tab.tag}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            tab.isLive 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {tab.duration}
                          </span>
                        </div>
                        <h3 className={`text-base font-black tracking-tight mt-1 ${
                          isActive ? 'text-slate-900' : 'text-slate-700'
                        }`}>
                          {tab.title}
                        </h3>
                        {isActive && (
                          <p className="text-slate-500 text-xs font-semibold mt-1.5 leading-relaxed">
                            {tab.description}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Video Player Info */}
              <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/30 flex items-center gap-3">
                <Youtube className="h-5 w-5 text-red-600 shrink-0" />
                <p className="text-xs text-blue-800 font-bold">
                  {txt(
                    'Sistemimizin canlı ekran videoları YouTube kanalımızda düzenli olarak yayınlanmaktadır.',
                    'Our system screen recordings are regularly uploaded to our YouTube channel.',
                    'Our system screen recordings are regularly uploaded to our YouTube channel.'
                  )}
                </p>
              </div>
            </div>

            {/* Right Side: Active Video Player Stage */}
            <div className="lg:col-span-7 order-1 lg:order-2">
              <div className="relative aspect-video rounded-3xl overflow-hidden border border-slate-100 bg-slate-950 shadow-2xl w-full h-auto lg:h-full lg:min-h-[300px] flex flex-col justify-center">
                {videoTabs[activeVideoTab].isLive && videoTabs[activeVideoTab].youtubeId ? (
                  isVideoPlaying ? (
                    <div className="relative w-full h-full">
                      <iframe
                        src={`https://www.youtube.com/embed/${videoTabs[activeVideoTab].youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                        title={videoTabs[activeVideoTab].title}
                        className="w-full h-full border-0 absolute inset-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                      {/* Floating Fallback Button */}
                      <div className="absolute top-4 right-4 z-20 flex gap-2">
                        <a
                          href={`https://www.youtube.com/watch?v=${videoTabs[activeVideoTab].youtubeId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-black/85 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/15 shadow-xl transition-all"
                        >
                          <Youtube className="w-4 h-4 text-red-500" />
                          {txt("YouTube'da Aç", "Open in YouTube", "Open in YouTube")}
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 group cursor-pointer animate-fade-in" onClick={() => setIsVideoPlaying(true)}>
                      <img
                        src={videoTabs[activeVideoTab].coverImg}
                        alt={videoTabs[activeVideoTab].title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/35 transition-colors duration-300 flex items-center justify-center -translate-y-6 sm:-translate-y-8">
                        <div className="relative">
                          <div className="absolute -inset-4 bg-white/20 rounded-full blur-xl group-hover:scale-125 transition-transform duration-300" />
                          <button className="relative h-14 w-14 sm:h-16 sm:w-16 bg-blue-600 hover:bg-blue-500 hover:scale-105 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300">
                            <Play className="h-6 w-6 sm:h-7 sm:w-7 fill-current ml-1" />
                          </button>
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 p-3 sm:p-4 bg-black/50 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase text-blue-400 tracking-wider">YOUTUBE VIDEO</p>
                          <p className="text-xs font-black text-white mt-0.5 truncate">{videoTabs[activeVideoTab].title}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsVideoPlaying(true);
                            }}
                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {txt('İZLE', 'WATCH', 'İZLE')}
                          </button>
                          <a
                            href={`https://www.youtube.com/watch?v=${videoTabs[activeVideoTab].youtubeId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 hover:bg-blue-500/20 transition-all whitespace-nowrap"
                          >
                            <Youtube className="w-3.5 h-3.5 text-red-500" />
                            {txt('YOUTUBE\'DA AÇ', 'YOUTUBE', 'YOUTUBE')}
                          </a>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center bg-slate-950 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none" style={{ backgroundImage: `url(${videoTabs[activeVideoTab].coverImg})` }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-slate-950 pointer-events-none" />
                    <div className="relative z-10 max-w-sm space-y-4 flex flex-col items-center">
                      <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                        <Tv className="h-8 w-8 text-blue-500 animate-pulse" />
                      </div>
                      <h3 className="text-xl font-black">{txt('Hazırlanıyor', 'Coming Soon', 'Σύντομα')}</h3>
                      <p className="text-white/60 text-xs font-semibold leading-relaxed">
                        {txt(
                          `"${videoTabs[activeVideoTab].title}" özelliğinin detaylı ekran videosu şu an hazırlanma aşamasındadır. Çok yakında YouTube kanalımıza yüklenecektir!`,
                          `Detailed screen video for "${videoTabs[activeVideoTab].title}" is being prepared. It will be uploaded to our YouTube channel very soon!`,
                          `Detailed screen video for "${videoTabs[activeVideoTab].title}" is being prepared. It will be uploaded to our YouTube channel very soon!`
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
            {txt('Galeriniz İçin En Gelişmiş Özellikler', 'Most Advanced Features for Your Gallery', 'Τα πιο προηγμένα χαρακτηριστικά για τη γκαλερί σας')}
          </h2>
          <p className="text-slate-500 font-semibold text-sm sm:text-base">
            {txt('AutoLP, geleneksel verimsiz yöntemleri geride bırakarak tamamen küresel galeri standartlarına göre inşa edilmiştir.', 'AutoLP is built entirely according to global gallery standards, leaving behind traditional inefficient methods.', 'Το AutoLP είναι κατασκευασμένο εξ ολοκλήρου σύμφωνα με τα παγκόσμια πρότυπα γκαλερί, αφήνοντας πίσω παραδοσιακές αναποτελεσματικές μεθόδους.')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { 
              title: txt("Gelişmiş Filo Yönetimi", "Advanced Fleet Management", "Προηγμένη Διαχείριση Στόλου"), 
              desc: txt("Araçlarınızın Sürücü, Km, Servis/Bakım geçmişi, Lastik değişimleri, Zimmet, Kaza Raporları ve Tüm Resmi Evraklarına dijital ortamda ulaşın.", "Access your vehicles' Driver, Mileage, Service/Maintenance history, Tire changes, Assignment, Accident Reports, and All Official Documents digitally.", "Αποκτήστε ψηφιακή πρόσβαση στο ιστορικό Οδηγού, Χιλιομετρικής απόστασης, Σέρβις/Συντήρησης, Αλλαγών ελαστικών, Ανάθεσης, Αναφορών ατυχημάτων και Όλων των Επίσημων Εγγράφων των οχημάτων σας."),
              icon: Car,
              color: 'text-blue-600 bg-blue-50 border-blue-100/50'
            },
            { 
              title: txt("Dijital İmzalı Sözleşmeler", "Digitally Signed Contracts", "Ψηφιακά Υπογεγραμμένα Συμβόλαια"), 
              desc: txt("Araç Satış ve Konsinye Sözleşmelerini müşterinizin yanında veya WhatsApp üzerinden yasal olarak anında imzalayıp güvenle saklayın.", "Instantly and legally sign Vehicle Sales and Consignment Contracts next to your customer or via WhatsApp and store them safely.", "Υπογράψτε άμεσα και νόμιμα Συμβάσεις Πώλησης και Αποστολής Οχημάτων δίπλα στον πελάτη σας ή μέσω WhatsApp και αποθηκεύστε τις με ασφάλεια."),
              icon: PenTool,
              color: 'text-indigo-600 bg-indigo-50 border-indigo-100/50'
            },
            { 
              title: txt("Realtime Afiş & Görsel Tasarımı", "Realtime Poster & Visual Design", "Σχεδιασμός Αφίσας & Οπτικών σε Πραγματικό Χρόνο"), 
              desc: txt("Tek resim veya kolaj sosyal medya görselleri üretir. Satılan araçlar için \"Satıldı\", \"Opsiyonlu\", \"Fırsat\" şeritli afişler hazırlar.", "Produces single image or collage social media visuals. Prepares posters with \"Sold\", \"Optioned\", \"Opportunity\" ribbons for sold vehicles.", "Παράγει γραφικά μέσων κοινωνικής δικτύωσης μεμονωμένης εικόνας ή κολάζ. Προετοιμάζει αφίσες με κορδέλες \"Πουλήθηκε\", \"Επιλογή\", \"Ευκαιρία\" για πουλημένα οχήματα."),
              icon: Image,
              color: 'text-purple-600 bg-purple-50 border-purple-100/50'
            },
            { 
              title: txt("Instagram Otomatik Paylaşımı", "Instagram Automatic Sharing", "Αυτόματη κοινοποίηση στο Instagram"), 
              desc: txt("Eklenen her araç anında enrakipsiz.com ve kendi hesaplarınızda otomatik paylaşılır; fiyat değişimlerinde otomatik güncellenir.", "Every added vehicle is instantly shared automatically on enrakipsiz.com and your own accounts; updated automatically on price changes.", "Κάθε όχημα που προστίθεται κοινοποιείται αυτόματα στο enrakipsiz.com και στους δικούς σας λογαριασμούς. ενημερώνεται αυτόματα στις αλλαγές τιμών."),
              icon: Share2,
              color: 'text-pink-600 bg-pink-50 border-pink-100/50'
            },
            { 
              title: txt("Sürükle-Bırak Web Site Sihirbazı", "Drag-and-Drop Website Wizard", "Οδηγός ιστότοπου μεταφοράς και απόθεσης"), 
              desc: txt("Size özel hazır kurumsal web siteniz saniyeler içinde otomatik kurulur, dilediğiniz gibi sürükle-bırak özelleştirebilirsiniz.", "Your custom ready-made corporate website is automatically installed in seconds, you can customize it with drag-and-drop as you wish.", "Ο προσαρμοσμένος έτοιμος εταιρικός ιστότοπός σας εγκαθίσταται αυτόματα σε δευτερόλεπτα, μπορείτε να τον προσαρμόσετε με μεταφορά και απόθεση όπως επιθυμείτε."),
              icon: Globe,
              color: 'text-emerald-600 bg-emerald-50 border-emerald-100/50'
            },
            { 
              title: txt("Otomatik Alıcı Dağıtım Ağı", "Automatic Buyer Distribution Network", "Αυτόματο Δίκτυο Διανομής Αγοραστών"), 
              desc: txt("Portföydeki araçlarınız el değmeden kurumsal web sitenizde ve global ilan platformu enrakipsiz.com'da yayına alınarak sergilenir.", "Your vehicles in the portfolio are automatically published and displayed on your corporate website and the global classifieds platform enrakipsiz.com.", "Τα οχήματά σας στο χαρτοφυλάκιο δημοσιεύονται αυτόματα και προβάλλονται στον εταιρικό σας ιστότοπο και στην παγκόσμια πλατφόρμα αγγελιών enrakipsiz.com."),
              icon: Send,
              color: 'text-cyan-600 bg-cyan-50 border-cyan-100/50'
            },
            { 
              title: txt("Mobil Öncelikli Hızlı Giriş", "Mobile-First Quick Entry", "Γρήγορη Είσοδος Mobile-First"), 
              desc: txt("Telefondan fotoğraf çekip anında portföye yükleyin; kablosuz, anlık ve son derece hızlı envanter yönetim kolaylığı.", "Take a photo from your phone and instantly upload it to your portfolio; wireless, instant, and extremely fast inventory management convenience.", "Τραβήξτε μια φωτογραφία από το τηλέφωνό σας και ανεβάστε την άμεσα στο χαρτοφυλάκιό σας. ασύρματη, άμεση και εξαιρετικά γρήγορη ευκολία διαχείρισης αποθέματος."),
              icon: Smartphone,
              color: 'text-amber-600 bg-amber-50 border-amber-100/50'
            },
            { 
              title: txt("Araç Maliyet & Kârlılık Takibi", "Vehicle Cost & Profitability Tracking", "Κόστος οχήματος και παρακολούθηση κερδοφορίας"), 
              desc: txt("Yaptığınız tüm harcamaları takip edip gelir/gider kayıtlarını portföyünüzle ilişkilendirerek kâr-zarar durum analizleri yapın.", "Analyze profit and loss situations by tracking all your expenses and associating income/expense records with your portfolio.", "Αναλύστε καταστάσεις κερδών και ζημιών παρακολουθώντας όλα τα έξοδά σας και συσχετίζοντας αρχεία εσόδων/εξόδων με το χαρτοφυλάκιό σας."),
              icon: TrendingUp,
              color: 'text-rose-600 bg-rose-50 border-rose-100/50'
            },
            { 
              title: txt("Tek Bakışta Kilometre Envanteri", "Mileage Inventory at a Glance", "Απόθεμα χιλιομετρικής απόστασης με μια ματιά"), 
              desc: txt("Tüm araçlarınızın detaylı listesini, kilometrelerini ve fiyatlarını tek bakışta izleyin, görsel detayları tek tıkla inceleyin.", "Monitor the detailed list, mileage, and prices of all your vehicles at a glance, and examine visual details with a single click.", "Παρακολουθήστε τη λεπτομερή λίστα, τα χιλιόμετρα και τις τιμές όλων των οχημάτων σας με μια ματιά και εξετάστε τις οπτικές λεπτομέρειες με ένα μόνο κλικ."),
              icon: CheckCircle,
              color: 'text-teal-600 bg-teal-50 border-teal-100/50'
            },
            { 
              title: txt("Vadeli Satış & Cari Hesap", "Term Sales & Current Account", "Προθεσμιακές Πωλήσεις & Τρεχούμενος Λογαριασμός"), 
              desc: txt("Vadeli satışlarınızda borç/alacak takibi yapın, dilediğiniz an raporlayın ve Excel veya PDF olarak tek tıkla dışarı aktarın.", "Track debt/receivables in your term sales, report them whenever you want, and export them as Excel or PDF with a single click.", "Παρακολουθήστε τις οφειλές/απαιτήσεις στις προθεσμιακές πωλήσεις σας, αναφέρετέ τις όποτε θέλετε και εξάγετέ τις ως Excel ή PDF με ένα μόνο κλικ."),
              icon: BookOpen,
              color: 'text-amber-600 bg-amber-50 border-amber-100/50'
            },
            { 
              title: txt("Çok Şubeli CRM & Personel", "Multi-Branch CRM & Personnel", "Πολυκαταστηματικό CRM & Προσωπικό"), 
              desc: txt("Sınırsız şube ve satış temsilcisi ekleyin. Şubeler arası araç transferi ve zimmet işlemlerini tek panelden kolayca yönetin.", "Add unlimited branches and sales representatives. Easily manage vehicle transfers and debit transactions between branches from a single panel.", "Προσθέστε απεριόριστα υποκαταστήματα και αντιπροσώπους πωλήσεων. Διαχειριστείτε εύκολα τις μεταφορές οχημάτων και τις χρεωστικές συναλλαγές μεταξύ των υποκαταστημάτων από έναν ενιαίο πίνακα."),
              icon: Users,
              color: 'text-blue-600 bg-blue-50 border-blue-100/50'
            },
            { 
              title: txt("Tek Tuşla Bulut Yedekleme", "One-Click Cloud Backup", "Cloud Backup με ένα κλικ"), 
              desc: txt("Tüm verilerinizi tek tuşla kurumsal Google Cloud sistemlerine şifreli olarak yedekleyin, her an güvenle erişin.", "Securely backup all your data to corporate Google Cloud systems with a single click and access it safely at any time.", "Δημιουργήστε αντίγραφα ασφαλείας όλων των δεδομένων σας με ασφάλεια σε εταιρικά συστήματα Google Cloud με ένα μόνο κλικ και αποκτήστε πρόσβαση σε αυτά με ασφάλεια ανά πάσα στιγμή."),
              icon: Cloud,
              color: 'text-sky-600 bg-sky-50 border-sky-100/50'
            },
            { 
              title: txt("SEO Dostu & Hazır Meta", "SEO Friendly & Ready Meta", "Φιλικό προς το SEO & Έτοιμο Meta"), 
              desc: txt("Google hesaplarını ve reklam piksellerini kolayca tanımlayarak PR ve pazarlama kampanyalarınızı anında optimize edin.", "Easily define Google accounts and ad pixels to optimize your PR and marketing campaigns instantly.", "Ορίστε εύκολα λογαριασμούς Google και pixel διαφημίσεων για να βελτιστοποιήσετε τις καμπάνιες PR και μάρκετινγκ άμεσα."),
              icon: Search,
              color: 'text-neutral-600 bg-neutral-50 border-neutral-100/50'
            },
            { 
              title: txt("Gerçek Zamanlı Karar Analitiği", "Real-Time Decision Analytics", "Αναλυτικά Στοιχεία Απόφασης σε Πραγματικό Χρόνο"), 
              desc: txt("Yöneticiler için anlık raporlama sunan, işletmenizin tüm finansal durumunu özetleyen dinamik dashboard ekranı.", "Dynamic dashboard screen that provides instant reporting for managers and summarizes the entire financial status of your business.", "Δυναμική οθόνη πίνακα ελέγχου που παρέχει άμεση αναφορά για διευθυντές και συνοψίζει ολόκληρη την οικονομική κατάσταση της επιχείρησής σας."),
              icon: BarChart3,
              color: 'text-violet-600 bg-violet-50 border-violet-100/50'
            },
            { 
              title: 'Sektörel Radar Takip Sistemi', 
              desc: txt("Belirleyeceğiniz anahtar kelimelere göre internetteki en yeni piyasa fırsatlarını ve araç haberlerini yakalayan radar.", "Radar that captures the latest market opportunities and vehicle news on the internet according to the keywords you specify.", "Ραντάρ που καταγράφει τις πιο πρόσφατες ευκαιρίες αγοράς και ειδήσεις οχημάτων στο διαδίκτυο σύμφωνα με τις λέξεις-κλειδιά που καθορίζετε."),
              icon: Radio,
              color: 'text-red-600 bg-red-50 border-red-100/50'
            },
            { 
              title: 'Otomatik Döviz & Finansman', 
              desc: txt("Otomatik Merkez Bankası döviz kur eşitlemesi, harita yol tarifleri, kredi hesaplama motoru ve kullanıcı işlem denetim kayıtları.", "Automatic Central Bank exchange rate equalization, map directions, loan calculation engine, and user transaction audit logs.", "Αυτόματη εξίσωση συναλλαγματικής ισοτιμίας της Κεντρικής Τράπεζας, οδηγίες χάρτη, μηχανή υπολογισμού δανείου και αρχεία ελέγχου συναλλαγών χρηστών."),
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
