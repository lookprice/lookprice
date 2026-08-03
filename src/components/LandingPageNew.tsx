import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  ArrowRight, 
  X, 
  Package, 
  Check, 
  Globe, 
  Sparkles, 
  Building2, 
  Car, 
  Utensils, 
  ShoppingCart, 
  TrendingUp, 
  FileText, 
  Layers, 
  Receipt,
  UserCheck,
  Shield,
  Clock,
  ArrowLeftRight,
  PenTool,
  Share2,
  Printer,
  QrCode,
  Wrench,
  Smartphone,
  Calendar,
  GitBranch
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../translations";
import { api } from "../services/api";
import SEO from "./SEO";

export const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, setLang } = useLanguage();
  const t = translations[lang];

  const txt = (trText: string, enText: string, elText: string) => {
    if (lang === 'tr') return trText;
    if (lang === 'el') return elText;
    return enText;
  };

  const [showDemoModal, setShowDemoModal] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [demoForm, setDemoForm] = useState({ 
    name: "", 
    storeName: "", 
    phone: "", 
    email: "", 
    notes: "", 
    storeType: "real_estate" as "product" | "real_estate" | "motor_vehicle" | "restaurant" 
  });
  const [demoStatus, setDemoStatus] = useState({ type: "", text: "" });

  useEffect(() => {
    if (location.state?.openDemo) {
      setShowDemoModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 4);
    }, 8000);
    return () => clearInterval(interval);
  }, [isHovered]);

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDemoStatus({ type: "loading", text: txt("Gönderiliyor...", "Sending...", "Στέλνεται...") });
    
    try {
      const data = await api.requestDemo(demoForm);
      if (data.success) {
        setDemoStatus({ 
          type: "success", 
          text: txt(
            "Talebiniz alındı! En kısa sürede sizinle iletişime geçeceğiz.",
            "Request received! We will contact you shortly.",
            "Το αίτημά σας ελήφθη! Θα επικοινωνήσουμε μαζί σας σύντομα."
          ) 
        });
        setDemoForm({ name: "", storeName: "", phone: "", email: "", notes: "", storeType: "real_estate" });
        setTimeout(() => {
          setShowDemoModal(false);
          setDemoStatus({ type: "", text: "" });
        }, 3000);
      } else {
        setDemoStatus({ 
          type: "error", 
          text: txt(
            "Bir hata oluştu. Lütfen tekrar deneyin.",
            "An error occurred. Please try again.",
            "Παρουσιάστηκε σφάλμα. Παρακαλώ προσπαθήστε ξανά."
          ) 
        });
      }
    } catch (err) {
      setDemoStatus({ 
        type: "error", 
        text: txt("Bağlantı hatası.", "Connection error.", "Σφάλμα σύνδεσης.") 
      });
    }
  };

  const products = [
    {
      name: "AutoLP",
      sector: txt("Otomotiv & Galeri", "Automotive & Gallery", "Αυτοκίνητα & Γκαλερί"),
      description: txt(
        "Yeni nesil galeri standartlarına özel araç tescil, gümrük takibi, GBP/Sterlin kur senkronizasyonu ve hızlı PDF broşür oluşturma sistemi.",
        "Automotive inventory management, vehicle registration, GBP currency sync, and instant PDF catalogue builder.",
        "Διαχείριση αποθέματος αυτοκινήτων, εγγραφή οχημάτων, συγχρονισμός GBP και άμεση δημιουργία καταλόγου PDF."
      ),
      icon: Car,
      link: "/auto-landing",
      bgImage: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
      color: "from-blue-600/20 to-cyan-600/10",
      accent: "text-blue-500",
      btnBg: "bg-blue-600 hover:bg-blue-700",
      features: [
        txt("Gelişmiş Filo & Bakım Yönetimi", "Advanced Fleet & Maintenance Management", "Προηγμένη Διαχείριση Στόλου & Συντήρησης"),
        txt("Dijital İmzalı Satış & Konsinye Sözleşmesi", "Digitally Signed Sales & Consignment Contracts", "Ψηφιακά Υπογεγραμμένα Συμβόλαια Πωλήσεων & Παρακαταθήκης"),
        txt("Instagram & enrakipsiz.com Otomatik Paylaşım", "Automatic Instagram & enrakipsiz.com Sync", "Αυτόματος Συγχρονισμός Instagram & enrakipsiz.com"),
        txt("Maliyet, Cari & Kâr/Zarar Takip Paneli", "Cost, Ledger & Profit Tracker Dashboard", "Πίνακας Ελέγχου Κόστους, Καθολικού & Παρακολούθησης Κερδών")
      ]
    },
    {
      name: "REstateLP",
      sector: txt("Gayrimenkul & Portföy", "Real Estate & Brokerage", "Ακίνητα & Κτηματομεσιτικά"),
      description: txt(
        "Modern emlak piyasası mülkiyet ve koçan türlerine uyumlu akıllı eşleştirme ve lüks konut sunum altyapısı.",
        "Smart matching real estate CRM with property deed management (Turkish Title, Equivalent) and luxury teasers.",
        "Έξυπνο CRM ακινήτων με διαχείριση τίτλων ιδιοκτησίας και παρουσιάσεις πολυτελείας."
      ),
      icon: Building2,
      link: "/restate-landing",
      bgImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
      color: "from-rose-600/20 to-purple-600/10",
      accent: "text-rose-500",
      btnBg: "bg-rose-600 hover:bg-rose-700",
      features: [
        txt("Gezi, Randevu & CRM Pipeline", "Tour, Appointment & CRM Pipeline", "Διαδρομή Ξενάγησης, Ραντεβού & CRM Pipeline"),
        txt("Biyometrik Dijital İmzalı Sözleşmeler", "Biometric Digitally Signed Contracts", "Ψηφιακά Υπογεγραμμένα Συμβόλαια με Βιομετρικά Στοιχεία"),
        txt("Vitrin Posterleri & Sosyal Medya Afişleri", "Show Window Posters & Social Media Banners", "Αφίσες Βιτρίνας & Διαφημιστικά Μέσων Κοινωνικής Δικτύωσης"),
        txt("Instagram & enrakipsiz.com Otomatik Paylaşım", "Automatic Instagram & enrakipsiz.com Sync", "Αυτόματος Συγχρονισμός Instagram & enrakipsiz.com")
      ]
    },
    {
      name: "ShopLP",
      sector: txt("Perakende & Akıllı POS", "Retail & Smart POS", "Λιανική Πώληση & Έξυπνο POS"),
      description: txt(
        "Butik, market ve genel mağazalar için hızlı barkodlu POS satış ekranı, varyasyonlu stok takibi, teknik servis, teklif yönetimi, dövizli cari hesaplar ve resmi e-Fatura.",
        "Cloud-based retail POS with barcode scanning, dynamic product variants, service and quotation management, ledger/debts and official e-Invoice integration.",
        "Λιανική POS στο cloud με σάρωση γραμμωτού κώδικα, παραλλαγές προϊόντων, διαχείριση υπηρεσιών/προσφορών και τιμολόγηση."
      ),
      icon: ShoppingCart,
      link: "/shop-landing",
      bgImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
      color: "from-indigo-600/20 to-blue-600/10",
      accent: "text-indigo-500",
      btnBg: "bg-indigo-600 hover:bg-indigo-700",
      features: [
        txt("Teknik Servis & Teklif Yönetimi", "Tech Service & Quotation Management", "Διαχείριση Τεχνικών Υπηρεσιών & Προσφορών"),
        txt("Çok Şubeli Eşgüdümlü Stok Transferi", "Multi-branch Stock Transfer Engine", "Διαχείριση Μεταφοράς Αποθεμάτων Πολλαπλών Καταστημάτων"),
        txt("Mağaza içi QR Fiyat Gör Sistemi", "In-store QR Price Checker System", "Σύστημα Ελέγχου Τιμών QR εντός Καταστήματος"),
        txt("Dövizli Cari & Dijital Mutabakat", "Multi-Currency Ledgers & Reconciliations", "Καθολικά σε Πολλαπλά Νομίσματα & Ψηφιακή Συμφωνία")
      ]
    },
    {
      name: "HoReCaLP",
      sector: txt("Cafe & Restoran", "Cafe & Restaurant", "Καφετέρια & Εστιατόριο"),
      description: txt(
        "Masaya QR sipariş, hızlı restoran POS ekranı, akıllı dijital mutfak paneli, kurye/paket servis ve anlık masa adisyon yönetimi.",
        "Interactive QR order-to-table, rapid restaurant POS, digital kitchen screens, courier dispatcher, and table accounts.",
        "Ανέπαφη παραγγελία QR, γρήγορο POS εστιατορίου, ψηφιακές οθόνες κουζίνας, αποστολή κούριερ και λογαριασμοί τραπεζιών."
      ),
      icon: Utensils,
      link: "/horeca-landing",
      bgImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
      color: "from-amber-600/20 to-orange-600/10",
      accent: "text-amber-500",
      btnBg: "bg-amber-600 hover:bg-amber-700",
      features: [
        txt("Temassız QR Menü & Masadan Sipariş", "Contactless QR Menu & Ordering", "Ανέπαφο Μενού QR & Παραγγελία από το Τραπέζι"),
        txt("Hızlı Garson / Kasa POS Ekranı", "Rapid Waiter / Cashier POS", "Γρήγορο POS Σερβιτόρου / Ταμείου"),
        txt("Dijital Mutfak & Hazırlık Paneli", "Digital Kitchen display", "Ψηφιακή Οθόνη Κουζίνας & Προετοιμασίας"),
        txt("Adisyon & Masa Hesap Bölme", "Bill Splitting & Multi-Table Management", "Διαίρεση Λογαριασμού & Διαχείριση Πολλαπλών Τραπεζιών")
      ]
    }
  ];

  const sliderData = [
    {
      name: "AutoLP",
      sector: txt("Otomotiv & Galeri", "Automotive & Gallery", "Αυτοκίνητα & Γκαλερί"),
      title: txt("Sektörünüze Özel\nOto Galeri & Filo Otomasyonu", "Industry-Specific\nAutomotive & Fleet Automation", "Εξειδικευμένος Αυτοματισμός\nΑυτοκινήτων & Στόλου"),
      description: txt(
        "Uluslararası standartlarda araç tescil, gümrük takibi, GBP/Sterlin kur senkronizasyonu ve otomatik ilan entegrasyonu.",
        "Tailored for global vehicle registration, customs, GBP currency sync, and automatic listings.",
        "Προσαρμοσμένο για εγγραφή οχημάτων, τελωνείο, συγχρονισμό GBP και αυτόματες καταχωρίσεις."
      ),
      bgImage: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
      color: "from-blue-600 to-cyan-500",
      accent: "text-blue-400",
      accentBg: "bg-blue-500/10 border-blue-500/20",
      glowColor: "rgba(59,130,246,0.15)",
      features: [
        txt("Gelişmiş Filo & Bakım Yönetimi", "Advanced Fleet & Maintenance Management", "Προηγμένη Διαχείριση Στόλου & Συντήρησης"),
        txt("Biyometrik Dijital İmzalı Sözleşmeler", "Biometric Digitally Signed Contracts", "Ψηφιακά Υπογεγραμμένα Συμβόλαια με Βιομετρικά Στοιχεία"),
        txt("Instagram & enrakipsiz.com Otomatik Paylaşım", "Automatic Instagram & enrakipsiz.com Sync", "Αυτόματος Συγχρονισμός Instagram & enrakipsiz.com"),
        txt("Maliyet, Cari & Kâr/Zarar Takip Paneli", "Cost, Ledger & Profit Tracker Dashboard", "Πίνακας Ελέγχου Κόστους, Καθολικού & Παρακολούθησης Κερδών")
      ],
      link: "/auto-landing"
    },
    {
      name: "REstateLP",
      sector: txt("Emlak & Gayrimenkul", "Real Estate & Property", "Ακίνητα & Κτηματομεσιτικά"),
      title: txt("Sektörünüze Özel\nAkıllı Portföy & Emlak CRM'i", "Industry-Specific\nSmart Real Estate CRM", "Εξειδικευμένο Smart\nReal Estate CRM"),
      description: txt(
        "Çoklu tapu ve mülkiyet türlerine tam uyum, otomatik yer gösterme, randevu planlayıcı ve lüks konut sunum altyapısı.",
        "Fully compliant with multiple property and deed types, automatic showings, scheduler, and luxury teasers.",
        "Πλήρης συμμόρφωση με τύπους ακινήτων, αυτόματες υποδείξεις, προγραμματιστή και παρουσιάσεις πολυτελείας."
      ),
      bgImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
      color: "from-rose-600 to-purple-500",
      accent: "text-rose-400",
      accentBg: "bg-rose-500/10 border-rose-500/20",
      glowColor: "rgba(244,63,94,0.15)",
      features: [
        txt("Gezi, Randevu & CRM Pipeline", "Tour, Appointment & CRM Pipeline", "Διαδρομή Ξενάγησης, Ραντεβού & CRM Pipeline"),
        txt("Islak İmzaya Son Biyometrik Sözleşmeler", "Biometric Online Digital Contracts", "Τέλος στην υγρή υπογραφή με Βιομετρικά Συμβόλαια"),
        txt("Hazır Vitrin Posterleri & Broşürler", "Automatic Window Posters & Teasers", "Έτοιμες Αφίσες Βιτρίνας & Φυλλάδια"),
        txt("Mülk Sahibi Eşleştirme Motoru", "Smart Property Matching Engine", "Έξυπνη Μηχανή Αντιστοίχισης Ιδιοκτητών")
      ],
      link: "/restate-landing"
    },
    {
      name: "ShopLP",
      sector: txt("Perakende & POS", "Retail & POS Systems", "Λιανική Πώληση & Έξυπνο POS"),
      title: txt("Sektörünüze Özel\nHızlı Barkodlu Satış & POS", "Industry-Specific\nFast Barcoded Sales & POS", "Εξειδικευμένο Γρήγορο\nBarcode Sales & POS"),
      description: txt(
        "Butik, market ve genel mağazalar için entegre e-Fatura, varyasyonlu stok takibi, teknik servis ve QR fiyat sistemi.",
        "For boutiques, grocery stores and general shops with e-Invoice integration, variant stock alert, and QR checker.",
        "Για μπουτίκ, παντοπωλεία και γενικά καταστήματα με τιμολόγηση, ειδοποίηση αποθέματος και έλεγχο QR."
      ),
      bgImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
      color: "from-indigo-600 to-blue-500",
      accent: "text-indigo-400",
      accentBg: "bg-indigo-500/10 border-indigo-500/20",
      glowColor: "rgba(99,102,241,0.15)",
      features: [
        txt("Hızlı Barkodlu POS Satış Ekranı", "Fast Barcode Sales & POS Terminal", "Τερματικό Πωλήσεων POS με Γρήγορο Barcode"),
        txt("Teknik Servis & Teklif Yönetimi", "Tech Service & Quotation Engine", "Διαχείριση Τεχνικών Υπηρεσιών & Προσφορών"),
        txt("Mağaza içi QR Fiyat Gör Altyapısı", "In-store QR Price Checker Altyapısı", "Υποδομή Ελέγχου Τιμών QR εντός Καταστήματος"),
        txt("Dövizli Cari & Dijital Mutabakat", "Multi-Currency Ledgers & Ledger Statements", "Καθολικά σε Πολλαπλά Νομίσματα & Ψηφianκή Συμφωνία")
      ],
      link: "/shop-landing"
    },
    {
      name: "HoReCaLP",
      sector: txt("Cafe, Restoran & Otel", "Cafe, Restaurant & Hotel", "Καφετέρια, Εστιατόριο & Ξενοδοχείο"),
      title: txt("Sektörünüze Özel\nQR Menü & Masa Otomasyonu", "Industry-Specific\nQR Menu & Table Automation", "Εξειδικευμένο Μενού QR\n& Αυτοματισμός Τραπεζιού"),
      description: txt(
        "Temassız QR sipariş, hızlı garson el terminali, akıllı mutfak ekranı ve anlık masa adisyon hesap yönetimi.",
        "Contactless QR ordering, rapid waiter terminal, kitchen display, and table bill splitting management.",
        "Ανέπαφη παραγγελία QR, γρήγορο τερματικό σερβιτόρου, οθόνη κουζίνας και διαχείριση λογαριασμού τραπεζιού."
      ),
      bgImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
      color: "from-amber-600 to-orange-500",
      accent: "text-amber-400",
      accentBg: "bg-amber-500/10 border-amber-500/20",
      glowColor: "rgba(245,158,11,0.15)",
      features: [
        txt("Masaya QR Menü & Hızlı Sipariş", "QR Menu & Rapid Table Ordering", "Μενού QR & Γρήγορη Παραγγελία Τραπεζιού"),
        txt("Pratik Garson Terminali & POS", "Handheld Waiter Terminal & POS", "Φορητό Τερματικό Σερβιτόρου & POS"),
        txt("Dijital Mutfak & Hazırlık Paneli", "Digital Kitchen Monitor Screen", "Ψηφιακή Οθόνη Κουζίνας & Προετοιμασίας"),
        txt("Adisyon & Masa Hesap Bölme", "Bill Splitting & Multi-Table Management", "Διαίρεση Λογαριασμού & Διαχείριση Πολλαπλών Τραπεζιών")
      ],
      link: "/horeca-landing"
    }
  ];

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "LookPrice Suite",
    "operatingSystem": "Web, iOS, Android",
    "applicationCategory": "BusinessApplication",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "180"
    },
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD"
    },
    "description": lang === 'tr' 
      ? "İşletmenizin sektörüne özel yönetim sistemleri. AutoLP, REstateLP, ShopLP ve HoReCaLP çözümlerimizi keşfedin."
      : "Industry-focused business management suites. Explore our tailored solutions: AutoLP, REstateLP, ShopLP, and HoReCaLP."
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-indigo-500/30">
      <SEO 
        title={lang === 'tr' ? "LookPrice | Sektörünüze Özel Akıllı Yönetim Çözümleri" : "LookPrice | Industry-Specific Smart Business Suites"}
        description={lang === 'tr' 
          ? "LookPrice ile işletmenizin sektörüne özel tasarlanmış otomasyon sistemlerini keşfedin. Otomotiv, Emlak, Perakende ve Cafe/Restoran çözümleri." 
          : "Discover automation suites customized for your industry. Premium solutions for Automotive, Real Estate, Retail, and Cafe/Restaurants."
        }
        keywords="pos, crm, emlak crm, oto galeri yazilimi, restorant pos, kktc pos, lookprice"
        schemaData={schemaData}
      />

      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-[100] px-6 md:px-12 py-4 flex items-center justify-between bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => navigate("/")}>
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative w-10 h-10 bg-white rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg">
              <div className="w-5 h-5 bg-gradient-to-tr from-indigo-650 to-blue-600 rounded" />
            </div>
          </div>
          <span className="text-xl font-black tracking-tighter text-white">Look<span className="text-indigo-500">Price</span></span>
        </div>

        <div className="flex items-center space-x-4">
          {/* Language Switcher */}
          <div className="flex items-center bg-white/5 p-1 rounded-full border border-white/10">
            {['tr', 'en', 'el'].map((l) => (
              <button 
                key={l}
                onClick={() => setLang(l as 'tr' | 'en' | 'el')}
                className={`w-8 h-8 flex items-center justify-center rounded-full text-[10px] font-black transition-all ${
                  lang === l 
                    ? 'bg-white text-black shadow-xl' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {l === 'el' ? 'GR' : l.toUpperCase()}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 bg-white text-black hover:bg-indigo-600 hover:text-white rounded-full text-xs font-black uppercase tracking-widest transition-all"
          >
            {txt('Giriş', 'Login', 'Σύνδεση')}
          </button>
        </div>
      </header>

      {/* Hero Power Banner Slider Section */}
      <section 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative min-h-[85vh] lg:min-h-[80vh] flex flex-col justify-center px-6 md:px-12 lg:px-24 pt-32 pb-16 overflow-hidden border-b border-white/5 bg-[#050505]"
      >
        {/* Cinematic Animated Backglow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#050505] to-[#050505] pointer-events-none z-0" />
        
        {/* Glowing visual atmosphere matching the active slide */}
        <div 
          className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full filter blur-[120px] opacity-10 pointer-events-none transition-all duration-1000 z-0"
          style={{ backgroundColor: sliderData[activeSlide].name === "AutoLP" ? "#3b82f6" : sliderData[activeSlide].name === "REstateLP" ? "#f43f5e" : sliderData[activeSlide].name === "ShopLP" ? "#6366f1" : "#f59e0b" }}
        />

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          {/* Main Display Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[480px]">
            {/* Left Content Side */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlide}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-6"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 text-white/80 rounded-full text-xs font-black tracking-widest uppercase border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    {sliderData[activeSlide].sector}
                  </div>

                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-[1.05] text-white whitespace-pre-line">
                    {sliderData[activeSlide].title}
                  </h1>

                  <p className="text-base sm:text-lg text-white/60 font-semibold leading-relaxed max-w-xl">
                    {sliderData[activeSlide].description}
                  </p>

                  {/* Top Features bullets inside the Hero */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                    {sliderData[activeSlide].features.map((feat, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-3 bg-white/[0.02] border border-white/5 hover:border-white/10 p-3 rounded-xl transition-all"
                      >
                        <div className={`p-1.5 rounded-lg ${sliderData[activeSlide].accentBg}`}>
                          <Check className={`w-4 h-4 ${sliderData[activeSlide].accent}`} />
                        </div>
                        <span className="text-xs sm:text-sm text-white/90 font-black tracking-tight">{feat}</span>
                      </div>
                    ))}
                  </div>

                   {/* Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button
                      onClick={() => navigate(sliderData[activeSlide].link)}
                      className="group relative inline-flex items-center justify-center px-8 py-4 font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-all text-sm tracking-wide shadow-xl"
                    >
                      {txt(`${sliderData[activeSlide].name} Çözümünü İncele`, `Explore ${sliderData[activeSlide].name}`, `Εξερευνήστε το ${sliderData[activeSlide].name}`)}
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => setShowDemoModal(true)}
                      className="group inline-flex items-center justify-center px-8 py-4 font-black text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-sm tracking-wide"
                    >
                      {txt('Demo Randevusu Al', 'Request Demo', 'Ζητήστε Demo')}
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Interactive Image Side */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlide}
                  initial={{ opacity: 0, scale: 0.95, rotateY: 10 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  exit={{ opacity: 0, scale: 0.95, rotateY: -10 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 shadow-2xl group"
                  style={{
                    boxShadow: `0 25px 50px -12px ${sliderData[activeSlide].glowColor}`
                  }}
                >
                  <img 
                    src={sliderData[activeSlide].bgImage} 
                    alt={sliderData[activeSlide].name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/95 via-black/30 to-transparent" />
                  
                  {/* Floating Telemetry Badge inside Image */}
                  <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">
                        LOOKPRICE AUTO-SYNC
                      </div>
                      <div className="text-xs font-bold text-white mt-0.5">
                        {txt("Aktif Bulut Entegrasyonu", "Active Cloud Synced", "Ενεργός Συγχρονισμός Cloud")}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">LIVE</span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation Control Tabs at Bottom of Hero */}
          <div className="mt-16 border-t border-white/5 pt-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sliderData.map((slide, idx) => {
                const isActive = activeSlide === idx;
                return (
                  <button
                    key={slide.name}
                    onClick={() => setActiveSlide(idx)}
                    className={`text-left p-4 rounded-2xl border transition-all relative overflow-hidden group ${
                      isActive 
                        ? 'bg-white/[0.03] border-white/10' 
                        : 'bg-transparent border-transparent hover:bg-white/[0.01]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? slide.accent : 'text-white/40 group-hover:text-white/60'}`}>
                        {slide.name}
                      </span>
                      <span className="text-[10px] font-black text-white/20">0{idx + 1}</span>
                    </div>
                    <p className={`text-xs sm:text-sm font-black mt-1 truncate ${isActive ? 'text-white' : 'text-white/40 group-hover:text-white/60'}`}>
                      {slide.sector}
                    </p>

                    {/* Progress Bar Animation */}
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
                      {isActive && (
                        <motion.div 
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ 
                            duration: isHovered ? 0 : 8, 
                            ease: "linear"
                          }}
                          className="h-full bg-indigo-500" 
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Sector Selection Grid */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-[#050505] relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-white">
              {txt("Profesyonel Ürünlerimiz", "Our Professional Products", "Τα Επαγγελματικά Προϊόντα μας")}
            </h2>
            <p className="text-white/50 text-sm sm:text-base font-semibold leading-relaxed">
              {txt(
                "İşletmenizin sektörünü seçin ve tamamen size özel hazırlanan özellikleri, ekranları ve sıkça sorulan soruları anında inceleyin.",
                "Select your business sector to explore highly customized features, workflows, and FAQs designed specifically for you.",
                "Επιλέξτε τον τομέα της επιχείρησής σας για να εξερευνήσετε εξαιρετικά προσαρμοσμένες δυνατότητες, ροές εργασίας και συχνές ερωτήσεις σχεδιασμένες ειδικά για εσάς."
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {products.map((p, idx) => {
              const IconComp = p.icon;
              return (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  onClick={() => navigate(p.link)}
                  className={`bg-gradient-to-br ${p.color} rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between overflow-hidden cursor-pointer group hover:scale-[1.01]`}
                >
                  <div className="relative h-48 w-full overflow-hidden">
                    <img 
                      src={p.bgImage} 
                      alt={p.name} 
                      referrerPolicy="no-referrer" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
                    <div className="absolute top-4 left-4 p-3 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-white">
                      <IconComp className={`h-6 w-6 ${p.accent}`} />
                    </div>
                    <div className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest text-white bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                      {p.sector}
                    </div>
                    <div className="absolute bottom-4 left-6">
                      <h3 className="text-3xl font-black text-white group-hover:text-white/95">{p.name}</h3>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-white/60 text-sm leading-relaxed mb-6 font-medium">{p.description}</p>

                      <div className="space-y-3 mb-8">
                        {p.features.map((feat, fIdx) => (
                          <div key={fIdx} className="flex items-center gap-2.5 text-xs font-semibold text-white/80">
                            <Check className={`h-4 w-4 shrink-0 ${p.accent}`} />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button className={`w-full py-4 text-white font-black rounded-2xl transition-all text-sm flex items-center justify-center gap-2 ${p.btnBg}`}>
                      {txt(`${p.name} Çözümünü İncele`, `Explore ${p.name}`, `Εξερευνήστε το ${p.name}`)}
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust & Stability Badges */}
      <section className="py-16 border-t border-white/5 bg-[#030304]">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { 
              title: txt("GİB ve N11.com Entegratöründen", "Integrated GİB & N11", "Από τον Επίσημο Πάροχο GİB & N11"), 
              desc: txt("Maliye Bakanlığı ve N11.com Resmi Entegratörü ISM TEKNOLOJİ'den", "From ISM TECHNOLOGY, official integrator of Ministry of Finance and N11.com", "Από την ISM TECHNOLOGY, επίσημο πάροχο του Υπουργείου Οικονομικών και N11.com") 
            },
            { 
              title: txt("1996 Yılından Beri Kurumsal Teknoloji", "Enterprise Tech Since 1996", "Εταιρική Τεχνολογία από το 1996"), 
              desc: txt("smartFatura ve Gap Bilişim Hizmetleri Kurucuları ve Sektör Profesyonelleri ile birlikte Geliştirilmiştir.", "Developed together with founders of smartFatura & Gap Bilişim and industry professionals.", "Αναπτύχθηκε σε συνεργασία με τους ιδρυτές των smartFatura & Gap Bilişim και επαγγελματίες του κλάδου.") 
            },
            { 
              title: txt("Tam Yerel Uyum", "Local Compliance", "Πλήρης Τοπική Συμμόρφωση"), 
              desc: txt("Sektörün kur yönetimi, sözleşmeleri ve fatura kurallarıyla %100 uyumludur.", "100% compliant with industry custom documents and currencies.", "100% συμβατό με τα έγγραφα του κλάδου και τα νομίσματα.") 
            }
          ].map((item, idx) => (
            <div key={idx} className="space-y-2">
              <h4 className="text-lg font-black text-white">{item.title}</h4>
              <p className="text-white/40 text-xs sm:text-sm font-semibold max-w-xs mx-auto">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo Modal */}
      <AnimatePresence>
        {showDemoModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDemoModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0A0A0E] rounded-[2rem] border border-white/10 p-8 shadow-2xl z-10"
            >
              <button 
                onClick={() => setShowDemoModal(false)}
                className="absolute top-6 right-6 text-white/50 hover:text-white p-1 hover:bg-white/5 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-6">
                <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                  LOOKPRICE DEMO
                </span>
                <h3 className="text-2xl font-black mt-3">
                  {txt('Demo Talebi Oluşturun', 'Request a Live Demo', 'Δημιουργήστε ένα Αίτημα για Demo')}
                </h3>
                <p className="text-white/50 text-xs mt-1 font-semibold">
                  {txt(
                    'Sektörünüze özel akıllı yönetim yazılımını birlikte inceleyelim.', 
                    'Let us show you how our tailored suite can optimize your business.',
                    'Ας εξερευνήσουμε μαζί το έξυπνο λογισμικό διαχείρισης που είναι ειδικά προσαρμοσμένο για τον τομέα σας.'
                  )}
                </p>
              </div>

              {demoStatus.type === 'success' ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-6 rounded-2xl text-center text-sm font-semibold">
                  {demoStatus.text}
                </div>
              ) : (
                <form onSubmit={handleDemoSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-white/40 mb-1.5">
                      {txt('Adınız Soyadınız', 'Your Name', 'Ονοματεπώνυμο')}
                    </label>
                    <input
                      type="text"
                      required
                      value={demoForm.name}
                      onChange={(e) => setDemoForm({...demoForm, name: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-white/40 mb-1.5">
                      {txt('İşletme / Mağaza Adı', 'Business / Store Name', 'Όνομα Επιχείρησης / Καταστήματος')}
                    </label>
                    <input
                      type="text"
                      required
                      value={demoForm.storeName}
                      onChange={(e) => setDemoForm({...demoForm, storeName: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-white/40 mb-1.5">
                      {txt('Sektör', 'Sector', 'Τομέας')}
                    </label>
                    <select
                      value={demoForm.storeType}
                      onChange={(e) => setDemoForm({...demoForm, storeType: e.target.value as any})}
                      className="w-full px-4 py-3 bg-[#0A0A0E] border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
                    >
                      <option value="motor_vehicle">{txt('Otomotiv (AutoLP)', 'Automotive (AutoLP)', 'Αυτοκίνητα (AutoLP)')}</option>
                      <option value="real_estate">{txt('Gayrimenkul (REstateLP)', 'Real Estate (REstateLP)', 'Ακίνητα (REstateLP)')}</option>
                      <option value="product">{txt('Perakende & Mağaza (ShopLP)', 'Retail (ShopLP)', 'Λιανική (ShopLP)')}</option>
                      <option value="restaurant">{txt('Cafe & Restoran (HoReCaLP)', 'Cafe & Restaurant (HoReCaLP)', 'Καφετέρια & Εστιατόριο (HoReCaLP)')}</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-white/40 mb-1.5">
                        {txt('Telefon', 'Phone', 'Τηλέφωνο')}
                      </label>
                      <input
                        type="tel"
                        required
                        value={demoForm.phone}
                        onChange={(e) => setDemoForm({...demoForm, phone: e.target.value})}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-white/40 mb-1.5">
                        {txt('E-posta', 'Email', 'E-mail')}
                      </label>
                      <input
                        type="email"
                        required
                        value={demoForm.email}
                        onChange={(e) => setDemoForm({...demoForm, email: e.target.value})}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-white/40 mb-1.5">
                      {txt('Ek Notlar', 'Additional Notes', 'Επιπλέον Σημειώσεις')}
                    </label>
                    <textarea
                      rows={2}
                      value={demoForm.notes}
                      onChange={(e) => setDemoForm({...demoForm, notes: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-indigo-500 transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={demoStatus.type === 'loading'}
                    className="w-full py-4 bg-white hover:bg-indigo-600 hover:text-white text-black rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 mt-4"
                  >
                    {demoStatus.type === 'loading' ? txt('Gönderiliyor...', 'Sending...', 'Στέλνεται...') : txt('Talebi Gönder', 'Send Request', 'Υποβολή Αιτήματος')}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 bg-[#050505]">
        <div className="flex flex-col items-center md:items-start space-y-2">
          <div className="flex items-center space-x-2">
            <span className="font-black tracking-tight text-white">Look<span className="text-indigo-500">Price</span></span>
          </div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
            {txt('BULUT TABANLI SEKTÖREL YÖNETİM SUITE', 'CLOUD-BASED SECTORAL SUITE', 'ΣΟΥΙΤΑ ΔΙΑΧΕΙΡΙΣΗΣ ΤΟΜΕΩΝ CLOUD')}
          </p>
        </div>
        <p className="text-xs text-white/40 font-semibold">
          {txt('© 2026 LookPrice. Tüm Hakları Saklıdır.', '© 2026 LookPrice. All Rights Reserved.', '© 2026 LookPrice. Με επιφύλαξη παντός δικαιώματος.')}
        </p>
      </footer>
    </div>
  );
};
