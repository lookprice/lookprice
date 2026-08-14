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
  Globe,
  Play,
  Tv,
  Youtube
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { shopFaq } from '../data/shopFaq';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';

export default function ShopLanding() {
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
    let isMounted = true;
    api.getPublicVideos("shoplp")
      .then(res => {
        if (isMounted && res && Array.isArray(res) && res.length > 0) {
          setDbVideos(res);
        }
      })
      .catch(err => console.warn("Could not load Shop videos, using defaults:", err?.message || err));
    return () => {
      isMounted = false;
    };
  }, []);

  const videoTabs = useMemo(() => {
    if (dbVideos.length > 0) {
      return dbVideos.map(v => ({
        id: v.product_key,
        title: v.title,
        tag: "SHOPLP",
        description: v.description || "",
        youtubeId: v.youtube_id,
        duration: v.duration || "1:00",
        isLive: v.is_live,
        coverImg: v.cover_img || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80"
      }));
    }
    return [
      {
        id: "shop_sale",
        title: txt("Hızlı Barkodlu Satış & POS", "Fast Barcode Sales & POS", "Fast Barcode Sales & POS"),
        tag: "SHOPLP",
        description: txt(
          "Mağaza içi hızlı barkod okuma, anlık sepet ve nakit/kart tahsilat süreçlerinin detaylı canlı kullanımı.",
          "Detailed live demonstration of in-store fast barcode scanning, instant cart, and cash/card collections.",
          "Detailed live demonstration of in-store fast barcode scanning, instant cart, and cash/card collections."
        ),
        youtubeId: "bdbXezbS35c",
        duration: "1:15",
        isLive: true,
        coverImg: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "shop_invoice",
        title: txt("E-Fatura & E-Arşiv Entegrasyonu", "E-Invoice & E-Archive Integration", "E-Invoice & E-Archive Integration"),
        tag: "SHOPLP",
        description: txt(
          "Tek tıkla resmi e-fatura veya e-arşiv fatura düzenleme, müşteriye SMS/E-posta ile iletim ve entegratör entegrasyonu.",
          "One-click official e-invoice creation, SMS/Email delivery to customers, and integrator synchronization.",
          "One-click official e-invoice creation, SMS/Email delivery to customers, and integrator synchronization."
        ),
        youtubeId: null,
        duration: txt("Yakında", "Coming Soon", "Coming Soon"),
        isLive: false,
        coverImg: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "shop_stock",
        title: txt("Stok & Depo Yönetimi", "Stock & Warehouse Management", "Stock & Warehouse Management"),
        tag: "SHOPLP",
        description: txt(
          "Kritik stok seviye uyarıları, varyantlı ürün takibi, toplu stok güncelleme ve depo giriş/çıkış hareketleri.",
          "Critical stock level alerts, variant product tracking, bulk stock updates, and warehouse movement logs.",
          "Critical stock level alerts, variant product tracking, bulk stock updates, and warehouse movement logs."
        ),
        youtubeId: null,
        duration: txt("Yakında", "Coming Soon", "Coming Soon"),
        isLive: false,
        coverImg: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "shop_ledger",
        title: txt("Cari Hesap & Veresiye Takibi", "Current Accounts & Credit Tracking", "Current Accounts & Credit Tracking"),
        tag: "SHOPLP",
        description: txt(
          "Müşteri ve tedarikçi cari kartları oluşturma, veresiye borç limitleri, vade takibi ve hesap ekstresi paylaşımı.",
          "Customer & supplier account cards creation, credit debt limits, due date tracking, and statement sharing.",
          "Customer & supplier account cards creation, credit debt limits, due date tracking, and statement sharing."
        ),
        youtubeId: null,
        duration: txt("Yakında", "Coming Soon", "Coming Soon"),
        isLive: false,
        coverImg: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80"
      }
    ];
  }, [dbVideos, lang]);

  const toggleAccordion = (id: string) => {
    setOpenId(prev => prev === id ? null : id);
  };

  const categories = [
    { id: 'all', label: txt('Tümü', 'All', 'Όλα') },
    { id: 'stok_perakende', label: txt('Stok & Perakende', 'Stock & Retail', 'Απόθεμα & Λιανική') },
    { id: 'satis_kasa', label: txt('Satış & Kasa', 'Sales & Checkout', 'Πωλήσεις & Ταμείο') },
    { id: 'finans_cari', label: txt('Finans & Cari', 'Finance & Ledgers', 'Χρηματοοικονομικά & Καθολικά') }
  ];

  const localizedFaq = useMemo(() => {
    return shopFaq.map(item => {
      let q = item.q;
      let a = item.a;
      if (lang === 'en') {
        if (item.id === 'barcode_scanner') {
          q = "Is ShopLP fully compatible with physical barcode scanners and printers?";
          a = "Yes! ShopLP is plug-and-play compatible with standard USB and wireless Bluetooth barcode scanners. Read the barcode and add items instantly. You can also generate barcodes and print labels.";
        } else if (item.id === 'fast_pos_retail') {
          q = "Can we sell barcode-less items with touch buttons on the Fast POS screen? Is cash register integration supported?";
          a = "Yes! Customize the quick sales layout with shortcuts and color codes for barcode-less or weighed items. Our system is also compatible with integrated POS and cash registers.";
        } else if (item.id === 'stock_alarms_retail') {
          q = "Is there a critical stock level alarm? Do we receive notifications when products are running low?";
          a = "Yes! You can set minimum stock limits for each item. When stock falls below this threshold, the system sends a notification and lists them in supply reports.";
        } else if (item.id === 'multi_currency_pricing') {
          q = "Can we accept payments in Euro, GBP, or USD? Can it calculate change in custom currencies?";
          a = "Yes! ShopLP supports multi-currency cash registers. Even if your base prices are in TRY, calculate payments in foreign currency based on central bank rates and compute change.";
        } else if (item.id === 'customers_debts_tracking') {
          q = "Can we create open ledger / credit accounts for our customers? How do we track debt?";
          a = "Yes! Use the Cari Account module to save sales as credit. Track limits, balance history, and send invoices or debt statements via WhatsApp easily.";
        } else if (item.id === 'e_invoice_integration') {
          q = "Can we issue e-Invoices and e-Archive bills after a sale? Is there integrator support?";
          a = "Yes! Convert retail sales into official e-Invoices or e-Archive bills instantly through secure integrator channels (Mysoft, etc.), and email them immediately.";
        } else if (item.id === 'variants_management') {
          q = "Is variation tracking (size, color, etc.) supported for clothing or shoe shops?";
          a = "Yes! Define unlimited variants (e.g., Size M - Red, Size L - Blue) under a single master card. Keep stock, barcodes, and prices independent.";
        } else if (item.id === 'einvoice_vat_grouping') {
          q = "How are VAT rates calculated and grouped on multi-item sales invoices?";
          a = "ShopLP complies with official regulations. Instead of printing separate VAT lines for each row, identical VAT rates are dynamically grouped to ensure clean invoicing.";
        } else if (item.id === 'incoming_invoice_view') {
          q = "How do we view supplier Purchase e-invoices? Does it auto-record stock?";
          a = "Gelen invoices are rendered cleanly as raw HTML. Better yet, the system auto-registers stock records and ledger accounts from purchase invoices to eliminate manual data entry.";
        } else if (item.id === 'tech_service_mgmt') {
          q = "How does Technical Service Management work? How do we invoice repairs?";
          a = "Record faulty product admissions, issue service receipts, notify clients via SMS/email, draft proposals, and automatically generate draft invoices upon approval.";
        } else if (item.id === 'price_quotation_system') {
          q = "How does the Price Quotation and online approval flow operate?";
          a = "Draft quotes, share them as PDFs or interactive digital links. Once the client clicks 'Approve', a draft sales invoice is automatically prepared in the background.";
        } else if (item.id === 'stock_movement_ledger') {
          q = "Can we perform historical stock and demand analysis with stock movement reports?";
          a = "Yes! Log historical movements per branch, trace shipments, and analyze seasonal demand trends to optimize purchasing.";
        } else if (item.id === 'bulk_price_updates') {
          q = "Is there a batch price update feature against currency fluctuations?";
          a = "Yes! Adjust thousands of prices simultaneously by percentage or fixed amount across specific brands, categories, or branches.";
        } else if (item.id === 'expense_centers_tracking') {
          q = "Can we track operational expenses and associate them with expense centers?";
          a = "Yes! Define custom Expense Centers (ads, rent, shipping) to categorize overhead, calculate net profit, and print detailed cost-distribution charts.";
        }
      } else if (lang === 'el') {
        if (item.id === 'barcode_scanner') {
          q = "Είναι το ShopLP συμβατό με φυσικούς σαρωτές γραμμωτού κώδικα (barcode) και εκτυπωτές;";
          a = "Ναι! Το ShopLP είναι plug-and-play συμβατό με τυπικούς σαρωτές USB και Bluetooth. Διαβάστε το barcode και προσθέστε προϊόντα στο καλάθι αμέσως.";
        } else if (item.id === 'fast_pos_retail') {
          q = "Μπορούμε να πουλήσουμε προϊόντα χωρίς barcode με κουμπιά αφής στην οθόνη Fast POS; Υποστηρίζεται σύνδεση με ταμειακή μηχανή;";
          a = "Ναι! Προσαρμόστε τη διάταξη γρήγορων πωλήσεων με συντομεύσεις για προϊόντα χωρίς barcode ή ζυμώμενα είδη. Το σύστημά μας είναι συμβατό με ταμειακές POS.";
        } else if (item.id === 'stock_alarms_retail') {
          q = "Υπάρχει συναγερμός κρίσιμου επιπέδου αποθέματος; Λαμβάνουμε ειδοποιήσεις όταν τα προϊόντα εξαντλούνται;";
          a = "Ναι! Μπορείτε να ορίσετε ελάχιστα όρια αποθέματος για κάθε προϊόν. Όταν το απόθεμα πέσει κάτω από το όριο, λαμβάνετε ειδοποίηση.";
        } else if (item.id === 'multi_currency_pricing') {
          q = "Μπορούμε να δεχτούμε πληρωμές σε ευρώ, GBP ή USD; Μπορεί να υπολογίσει ρέστα σε ξένα νομίσματα;";
          a = "Ναι! Το ShopLP υποστηρίζει ταμεία πολλαπλών νομισμάτων. Υπολογίστε πληρωμές σε ξένο νόμισμα με βάση τις τρέχουσες ισοτιμίες και δώστε ρέστα εύκολα.";
        } else if (item.id === 'customers_debts_tracking') {
          q = "Μπορούμε να δημιουργήσουμε λογαριασμούς πίστωσης για τους πελάτες μας; Πώς παρακολουθούμε το χρέος;";
          a = "Ναι! Χρησιμοποιήστε τη μονάδα Cari Account για να αποθηκεύσετε πωλήσεις με πίστωση. Παρακολουθήστε όρια, ιστορικό και στείλτε υπόλοιπα μέσω WhatsApp.";
        } else if (item.id === 'e_invoice_integration') {
          q = "Μπορούμε να εκδώσουμε e-Invoices και e-Archive μετά από μια πώληση; Υπάρχει υποστήριξη παρόχου;";
          a = "Ναι! Μετατρέψτε τις πωλήσεις λιανικής σε επίσημα e-Invoices ή e-Archive μέσω των ασφαλών καναλιών μας (Mysoft κ.λπ.) και στείλτε τα μέσω email.";
        } else if (item.id === 'variants_management') {
          q = "Υποστηρίζεται η παρακολούθηση παραλλαγών (μέγεθος, χρώμα κ.λπ.) για καταστήματα ρούχων ή υποδημάτων;";
          a = "Ναι! Ορίστε απεριόριστες παραλλαγές (π.χ. Μέγεθος M - Κόκκινο, Μέγεθος L - Μπλε) κάτω από ένα προϊόν, κρατώντας ξεχωριστό απόθεμα και τιμές.";
        } else if (item.id === 'einvoice_vat_grouping') {
          q = "Πώς υπολογίζονται και ομαδοποιούνται οι συντελεστές ΦΠΑ στα τιμολόγια πωλήσεων;";
          a = "Το ShopLP συμμορφώνεται με τους επίσημους κανονισμούς. Αντί να εκτυπώνονται ξεχωριστές γραμμές ΦΠΑ, οι ίδιοι συντελεστές ομαδοποιούνται αυτόματα.";
        } else if (item.id === 'incoming_invoice_view') {
          q = "Πώς βλέπουμε τα τιμολόγια αγοράς από προμηθευτές; Καταγράφει αυτόματα το απόθεμα;";
          a = "Τα εισερχόμενα τιμολόγια εμφανίζονται καθαρά ως HTML. Το σύστημα καταγράφει αυτόματα το απόθεμα και τους λογαριασμούς καθολικού από αυτά.";
        } else if (item.id === 'tech_service_mgmt') {
          q = "Πώς λειτουργεί η Διαχείριση Τεχνικού Σέρβις; Πώς τιμολογούμε τις επισκευές;";
          a = "Καταγράψτε ελαττωματικά προϊόντα, εκδώστε αποδείξεις σέρβις, ενημερώστε τους πελάτες, στείλτε προσφορές και εκδώστε τιμολόγια με ένα κλικ.";
        } else if (item.id === 'price_quotation_system') {
          q = "Πώς λειτουργεί το Σύστημα Προσφορών Τιμών και η ροή online έγκρισης;";
          a = "Δημιουργήστε προσφορές, μοιραστείτε τις ως PDF ή ψηφιακούς συνδέσμους. Μόλις ο πελάτης κάνει κλικ στο 'Έγκριση', ετοιμάζεται αυτόματα τιμολόγιο.";
        } else if (item.id === 'stock_movement_ledger') {
          q = "Μπορούμε να κάνουμε ιστορική ανάλυση αποθεμάτων με αναφορές κίνησης αποθεμάτων;";
          a = "Ναι! Καταγράψτε ιστορικές κινήσεις ανά υποκατάστημα, εντοπίστε αποστολές και αναλύστε εποχιακές τάσεις για να βελτιστοποιήσετε τις αγορές.";
        } else if (item.id === 'bulk_price_updates') {
          q = "Υπάρχει δυνατότητα μαζικής ενημέρωσης τιμών λόγω διακυμάνσεων συναλλάγματος;";
          a = "Ναι! Προσαρμόστε χιλιάδες τιμές ταυτόχρονα με ποσοστό ή σταθερό ποσό σε συγκεκριμένες μάρκες, κατηγορίες ή υποκαταστήματα.";
        } else if (item.id === 'expense_centers_tracking') {
          q = "Μπορούμε να παρακολουθούμε λειτουργικά έξοδα και να τα συνδέσουμε με κέντρα κόστους;";
          a = "Ναι! Ορίστε προσαρμοσμένα Κέντρα Κόστους (διαφημίσεις, ενοίκιο, μεταφορικά) για να κατηγοριοποιήσετε τα έξοδα και να δείτε το καθαρό κέρδος.";
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
        <title>ShopLP | {txt('Perakende Mağaza Yönetim ve POS Yazılımı', 'Retail Store Management and POS Software', 'Λογισμικό Διαχείρισης Λιανικής & POS')}</title>
        <meta name="description" content={txt(
          "ShopLP ile perakende mağazanızı dijitalleştirin. Hızlı POS satış ekranı, barkodlu stok takibi, cari hesap yönetimi ve e-Fatura entegrasyonu ile mağaza verimliliğinizi artırın.",
          "Digitalize your retail store with ShopLP. Increase store efficiency with fast POS sales screen, barcode stock tracking, ledger management, and e-Invoice integration.",
          "Ψηφιοποιήστε το κατάστημα λιανικής σας με το ShopLP. Αυξήστε την αποδοτικότητα του καταστήματος με γρήγορη οθόνη πωλήσεων POS, παρακολούθηση αποθεμάτων με barcode, διαχείριση καθολικών και ενσωμάτωση e-Invoice."
        )} />
        <meta name="keywords" content="perakende satış programı, mağaza yönetim yazılımı, stok takip sistemi, hızlı satış pos, cari hesap takip, mağaza crm, barkodlu satış sistemi, perakende otomasyonu, stok ve depo yönetimi, mağaza analiz raporları, online satış entegrasyonu, kasa takip programı, yeni nesil perakende çözümleri, mağaza yönetim sistemi, bulut tabanlı pos" />
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
                      ? 'bg-indigo-600 text-white shadow-md' 
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
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-transparent to-slate-50/50 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 rounded-full text-xs md:text-sm font-black text-indigo-700 mb-6 border border-indigo-100/50">
            <Sparkles className="h-4 w-4" />
            ShopLP by LookPrice
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-950 tracking-tighter mb-6 leading-[1.1]">
            {txt('Bulut Tabanlı Perakende ve', 'Cloud-Based Retail and', 'Λιανική βασισμένη στο Cloud και')} <br className="hidden md:inline"/> {txt('Akıllı Kasa Satış Sistemi', 'Smart POS Sales System', 'Έξυπνο Σύστημα Πωλήσεων POS')}
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-10 font-semibold leading-relaxed">
            {txt('Hızlı POS satış ekranı, tam uyumlu barkod okuyucu ve yazıcı entegrasyonu, gelişmiş stok takibi ve resmi e-Fatura / e-Arşiv bağlantısıyla mağazanızı baştan yaratın.', 'Reinvent your store with a fast POS sales screen, fully compatible barcode reader and printer integration, advanced stock tracking, and official e-Invoice / e-Archive connection.', 'Επανεφεύρετε το κατάστημά σας με μια γρήγορη οθόνη πωλήσεων POS, πλήρως συμβατή συσκευή ανάγνωσης γραμμωτού κώδικα και ενσωμάτωση εκτυπωτή, προηγμένη παρακολούθηση αποθεμάτων και επίσημη σύνδεση e-Invoice / e-Archive.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all text-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15 cursor-pointer"
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
            <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold uppercase tracking-wider">
              {txt('BULUT TABANLI PERAKENDE AKILLI POS', 'CLOUD-BASED RETAIL SMART POS', 'ΕΞΥΠΝΟ POS ΛΙΑΝΙΚΗΣ ΒΑΣΙΣΜΕΝΟ ΣΤΟ CLOUD')}
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              {txt('Hızlı Barkodlu Kasa Satışı ve Varyasyonlu Stok Takibi', 'Fast Barcode POS Sales and Variational Stock Tracking', 'Γρήγορες Πωλήσεις POS με Barcode και Παρακολούθηση Αποθέματος με Παραλλαγές')}
            </h2>
            <p className="text-slate-600 font-semibold text-sm md:text-base leading-relaxed">
              {txt('ShopLP, butikler, pastaneler, marketler ve tüm perakende satıcılar için iş süreçlerini kolaylaştırır. Dokunmatik ekranlar ve barkod okuyucularla tam entegre çalışarak satış hızınızı zirveye taşır.', 'ShopLP simplifies business processes for boutiques, bakeries, markets, and all retail sellers. It takes your sales speed to the peak by working fully integrated with touch screens and barcode readers.', 'Το ShopLP απλοποιεί τις επιχειρηματικές διαδικασίες για μπουτίκ, αρτοποιεία, αγορές και όλους τους πωλητές λιανικής. Ανεβάζει την ταχύτητα πωλήσεών σας στην κορυφή λειτουργώντας πλήρως ενσωματωμένο με οθόνες αφής και συσκευές ανάγνωσης barcode.')}
            </p>
            <div className="space-y-3">
              {[
                txt(txt("Hızlı barkodlu/barkodsuz dokunmatik POS satış ekranı", "Fast barcode/barcode-free touch POS sales screen", "Γρήγορη οθόνη πωλήσεων POS αφής με barcode/χωρίς barcode"), "Fast barcode/barcode-free touch POS sales screen", "Γρήγορη οθόνη πωλήσεων POS αφής με barcode/χωρίς barcode"),
                txt(txt("Renk, beden ve dinamik varyasyon bazlı gelişmiş stok takibi", "Advanced stock tracking based on color, size, and dynamic variation", "Προηγμένη παρακολούθηση αποθέματος βάσει χρώματος, μεγέθους και δυναμικής παραλλαγής"), "Advanced stock tracking based on color, size, and dynamic variation", "Προηγμένη παρακολούθηση αποθέματος βάσει χρώματος, μεγέθους και δυναμικής παραλλαγής"),
                txt(txt("Entegre resmi e-Fatura / e-Arşiv ve çoklu dövizli kasa yönetimi", "Integrated official e-Invoice / e-Archive and multi-currency cash register management", "Ενσωματωμένο επίσημο e-Invoice / e-Archive και διαχείριση ταμειακής μηχανής πολλαπλών νομισμάτων"), "Integrated official e-Invoice / e-Archive and multi-currency cash register management", "Ενσωματωμένο επίσημο e-Invoice / e-Archive και διαχείριση ταμειακής μηχανής πολλαπλών νομισμάτων")
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
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80" 
                alt="ShopLP Retail & POS Showcase" 
                referrerPolicy="no-referrer"
                className="w-full h-[320px] md:h-[450px] object-cover rounded-[1.8rem] group-hover:scale-[1.01] transition-transform duration-500"
              />
              <div className="absolute bottom-8 left-8 right-8 z-20 bg-black/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-white">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 mb-2 inline-block">
                  {txt('PERAKENDE KASA VİTRİN', 'RETAIL POS SHOWCASE', 'ΒΙΤΡΙΝΑ POS ΛΙΑΝΙΚΗΣ')}
                </span>
                <p className="font-black text-lg md:text-xl mb-1">{txt('Veresiye ve Cari Hesap Defteri', 'Credit and Current Account Ledger', 'Βιβλίο Πιστώσεων και Τρεχούμενων Λογαριασμών')}</p>
                <p className="text-white/60 text-xs md:text-sm font-semibold">{txt('Tüm müşteri cari bakiyelerini, tahsilatları ve veresiye limitlerini anlık izleyin.', 'Instantly monitor all customer current balances, collections, and credit limits.', 'Παρακολουθήστε άμεσα όλα τα τρέχοντα υπόλοιπα πελατών, τις εισπράξεις και τα πιστωτικά όρια.')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Showcase Section */}
      <section className="py-20 bg-gradient-to-b from-white to-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-indigo-500/10 text-indigo-700 rounded-full text-xs font-black tracking-wider uppercase border border-indigo-500/10">
              <Tv className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
              {txt('SİSTEMİ CANLI İZLEYİN', 'WATCH LIVE DEMO', 'ΠΑΡΑΚΟΛΟΥΘΗΣΤΕ LIVE')}
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mt-3 mb-4">
              {txt('Uygulamalı Sistem Özellikleri & Video Turu', 'Interactive System Tour & Live Demos', 'Διαδραστική Περιήγηση Συστήματος & Live Demos')}
            </h2>
            <p className="text-slate-500 font-semibold text-sm sm:text-base leading-relaxed">
              {txt(
                'ShopLP perakende barkodlu POS programının tüm modüllerini ve kasa akışlarını uygulamalı anlatımlarla canlı olarak izleyin.',
                'Watch real usage scenarios and explore how the entire ShopLP suite functions in retail environments.',
                'Watch real usage scenarios and explore how the entire ShopLP suite functions in retail environments.'
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
                          ? 'bg-white border-indigo-500/20 shadow-md shadow-indigo-500/5'
                          : 'bg-white/50 border-slate-100 hover:bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        isActive ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Tv className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${
                            isActive ? 'text-indigo-700' : 'text-slate-400'
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
              <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/30 flex items-center gap-3">
                <Youtube className="h-5 w-5 text-red-600 shrink-0" />
                <p className="text-xs text-indigo-800 font-bold">
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
                          <button className="relative h-14 w-14 sm:h-16 sm:w-16 bg-indigo-600 hover:bg-indigo-500 hover:scale-105 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300">
                            <Play className="h-6 w-6 sm:h-7 sm:w-7 fill-current ml-1" />
                          </button>
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 p-3 sm:p-4 bg-black/50 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">YOUTUBE VIDEO</p>
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
                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20 hover:bg-indigo-500/20 transition-all whitespace-nowrap"
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
                        <Tv className="h-8 w-8 text-indigo-500 animate-pulse" />
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
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            {txt('Perakende Mağazanız İçin Eksiksiz Güç', 'Complete Power for Your Retail Store', 'Πλήρης Δύναμη για το Κατάστημα Λιανικής σας')}
          </h2>
          <p className="text-slate-500 font-semibold text-sm sm:text-base leading-relaxed">
            {txt('ShopLP, butikler, pastaneler, marketler ve tüm perakende mağazaları için uçtan uca otomasyon ve finansal yönetim sunar.', 'ShopLP offers end-to-end automation and financial management for boutiques, bakeries, markets, and all retail stores.', 'Το ShopLP προσφέρει αυτοματοποίηση και οικονομική διαχείριση από άκρο σε άκρο για μπουτίκ, αρτοποιεία, αγορές και όλα τα καταστήματα λιανικής.')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { 
              title: txt("Hızlı Dokunmatik POS", "Fast Touch POS", "Γρήγορο POS Αφής"), 
              desc: txt("Barkodlu veya barkodsuz tüm ürünlerinizi ister okutarak ister dokunarak saniyeler içinde satın. Yeni nesil entegre yazar kasa/POS cihazları ile tam uyumlu çalışır.", "Sell all your products, with or without barcodes, in seconds, either by scanning or touching. It works fully compatibly with new generation integrated cash register/POS devices.", "Πουλήστε όλα τα προϊόντα σας, με ή χωρίς barcode, σε δευτερόλεπτα, είτε με σάρωση είτε με άγγιγμα. Λειτουργεί πλήρως συμβατά με νέας γενιάς ενσωματωμένες ταμειακές μηχανές/συσκευές POS."),
              icon: ShoppingBag,
              color: 'text-indigo-600 bg-indigo-50 border-indigo-100/50'
            },
            { 
              title: txt("Gelişmiş Varyasyon", "Advanced Variation", "Προηγμένη Παραλλαγή"), 
              desc: txt("Giyim ve ayakkabı gibi renk, beden, numara kırılımlı ürünleri tek kartta toplayıp stoklarını bağımsız takip edin.", "Collect products with color, size, and number breakdowns such as clothing and shoes on a single card and track their stocks independently.", "Συλλέξτε προϊόντα με αναλύσεις χρώματος, μεγέθους και αριθμού, όπως ρούχα και παπούτσια σε μία μόνο κάρτα και παρακολουθήστε τα αποθέματά τους ανεξάρτητα."),
              icon: Layers,
              color: 'text-blue-600 bg-blue-50 border-blue-100/50'
            },
            { 
              title: txt("Entegre e-Fatura Altyapısı", "Integrated e-Invoice Infrastructure", "Ενσωματωμένη Υποδομή e-Invoice"), 
              desc: txt("Satış anında müşteri bilgileriyle resmi e-Fatura veya e-Arşiv faturası kesin, muhasebe süreçlerinizi hızlandırın.", "Issue official e-Invoice or e-Archive invoices with customer information at the time of sale, speed up your accounting processes.", "Εκδώστε επίσημα e-Invoice ή e-Archive τιμολόγια με πληροφορίες πελατών κατά την πώληση, επιταχύνετε τις λογιστικές σας διαδικασίες."),
              icon: Receipt,
              color: 'text-emerald-600 bg-emerald-50 border-emerald-100/50'
            },
            { 
              title: txt("Teknik Servis Yönetimi", "Technical Service Management", "Διαχείριση Τεχνικής Υπηρεσίας"), 
              desc: txt("Müşteri bilgilendirmesi, servis raporu ve fiyat teklifleri süreçlerini dijital olarak takip edin. Onay durumuna göre otomatik taslak satış faturası oluşturun.", "Track customer information, service report, and price quote processes digitally. Automatically create a draft sales invoice based on the approval status.", "Παρακολουθήστε ψηφιακά τις πληροφορίες πελατών, την αναφορά υπηρεσίας και τις διαδικασίες προσφοράς τιμής. Δημιουργήστε αυτόματα ένα πρόχειρο τιμολόγιο πώλησης με βάση την κατάσταση έγκρισης."),
              icon: Wrench,
              color: 'text-orange-600 bg-orange-50 border-orange-100/50'
            },
            { 
              title: txt("Akıllı Fiyat Teklif Sistemi", "Smart Price Quote System", "Έξυπνο Σύστημα Προσφοράς Τιμής"), 
              desc: txt("Fiyat tekliflerinizi saniyeler içinde hazırlayıp PDF veya interaktif dijital onay linkiyle gönderin. Onaylanan teklifleri otomatik taslak faturaya dönüştürün.", "Prepare your price quotes in seconds and send them via PDF or interactive digital approval link. Automatically convert approved quotes into draft invoices.", "Ετοιμάστε τις προσφορές τιμών σας σε δευτερόλεπτα και στείλτε τις μέσω PDF ή διαδραστικού συνδέσμου ψηφιακής έγκρισης. Μετατρέψτε αυτόματα τις εγκεκριμένες προσφορές σε πρόχειρα τιμολόγια."),
              icon: FileText,
              color: 'text-sky-600 bg-sky-50 border-sky-100/50'
            },
            { 
              title: txt("Stok Hareket Ekstresi", "Stock Movement Statement", "Κατάσταση Κίνησης Αποθέματος"), 
              desc: txt("Geçmiş dönem ürün hareketlerini, giriş/çıkış sipariş detaylarını, şubeler arası sevkleri ve stokların talep yoğunluk durumlarını anlık analiz edin.", "Instantly analyze past period product movements, entry/exit order details, inter-branch transfers, and demand intensity status of stocks.", "Αναλύστε άμεσα τις κινήσεις προϊόντων προηγούμενης περιόδου, λεπτομέρειες παραγγελίας εισόδου/εξόδου, μεταφορές μεταξύ υποκαταστημάτων και κατάσταση έντασης ζήτησης αποθεμάτων."),
              icon: Activity,
              color: 'text-violet-600 bg-violet-50 border-violet-100/50'
            },
            { 
              title: txt("Otomatik Muhasebe & Kayıt", "Automatic Accounting & Registration", "Αυτόματη Λογιστική & Εγγραφή"), 
              desc: txt("Alış ve satış faturalarından (hem resmi e-fatura hem de manuel faturalardan) otomatik cari ve stok kayıtları oluşturarak manuel iş yükünü sıfırlayın.", "Reset manual workload by automatically creating current and stock records from purchase and sales invoices (both official e-invoices and manual invoices).", "Επαναφέρετε τον χειροκίνητο φόρτο εργασίας δημιουργώντας αυτόματα τρέχοντα αρχεία και αρχεία αποθέματος από τιμολόγια αγοράς και πώλησης (τόσο επίσημα e-invoices όσο και χειροκίνητα τιμολόγια)."),
              icon: CheckCircle,
              color: 'text-teal-600 bg-teal-50 border-teal-100/50'
            },
            { 
              title: txt("Toplu Fiyat Değişikliği", "Bulk Price Change", "Μαζική Αλλαγή Τιμής"), 
              desc: txt("Piyasadaki anlık kur ve maliyet dalgalanmalarına karşı, saniyeler içerisinde binlerce ürünün fiyatına kategori veya marka bazında müdahale edin.", "Against instant exchange rate and cost fluctuations in the market, intervene in the prices of thousands of products on a category or brand basis in seconds.", "Ενάντια στις άμεσες διακυμάνσεις συναλλαγματικών ισοτιμιών και κόστους στην αγορά, παρέμβετε στις τιμές χιλιάδων προϊόντων σε επίπεδο κατηγορίας ή μάρκας σε δευτερόλεπτα."),
              icon: RefreshCw,
              color: 'text-pink-600 bg-pink-50 border-pink-100/50'
            },
            { 
              title: txt("Gider Merkezleri Analizi", "Expense Centers Analysis", "Ανάλυση Κέντρων Κόστους"), 
              desc: 'Gider yerlerinizi (reklam, kira, kargo vb.) tanımlayarak şirket masraflarınızı ürünlerle ilişkilendirin ve net kâr-zarar raporlarını çıkarın.',
              icon: TrendingUp,
              color: 'text-rose-600 bg-rose-50 border-rose-100/50'
            },
            { 
              title: txt("Filo & Araç Yönetim Sistemi", "Fleet & Vehicle Management System", "Σύστημα διαχείρισης στόλου & οχημάτων"), 
              desc: 'Şirket araçlarınızın aktif Sürücü zimmetlerini, Km durumlarını, Servis/Bakım geçmişlerini, lastik değişimlerini ve resmi sigorta/kasko evraklarını takip edin.',
              icon: Car,
              color: 'text-red-600 bg-red-50 border-red-100/50'
            },
            { 
              title: txt("Uçtan Uca Tedarik Yönetimi", "End-to-End Supply Management", "End-to-End Supply Management"), 
              desc: 'Satın alma taleplerinden tedarikçi teklif toplamalarına, sipariş onayından mal kabule kadar tüm tedarik zincirinizi tek ekrandan yönetin.',
              icon: Truck,
              color: 'text-amber-600 bg-amber-50 border-amber-100/50'
            },
            { 
              title: txt("Çok Şubeli Eşgüdümlü Yönetim", "Multi-Branch Coordinated Management", "Συντονισμένη διαχείριση πολλών καταστημάτων"), 
              desc: 'Sınırsız şube açın. Merkezle tam eşgüdümlü çalışan şubeleriniz arasında hızlı stok transferi yapın ve tüm stoklarınızı tek bir platformdan izleyin.',
              icon: Users,
              color: 'text-slate-600 bg-slate-50 border-slate-100/50'
            },
            { 
              title: txt("Dövizli Cari & Dijital Mutabakat", "Foreign Currency Current & Digital Reconciliation", "Τρέχων συνάλλαγμα & ψηφιακή συμφωνία"), 
              desc: 'Cari hesap ekstrelerinizi dövizli takip edin. Entegre Dijital Mutabakat sistemiyle müşterilerinize online onaylı bakiye mutabakatı gönderin.',
              icon: Coins,
              color: 'text-yellow-600 bg-yellow-50 border-yellow-100/50'
            },
            { 
              title: txt("Mağaza içi 'Fiyat Gör' QR", "In-Store 'See Price' QR", "Κωδικός QR 'Δείτε Τιμή' στο κατάστημα"), 
              desc: 'Müşterileriniz veya personeliniz mağaza içi QR kodu okutarak tüm ürünlerin güncel fiyatlarını mobil cihazları üzerinden saniyeler içinde sorgular.',
              icon: QrCode,
              color: 'text-cyan-600 bg-cyan-50 border-cyan-100/50'
            },
            { 
              title: txt("E-Ticaret & Otomatik Kur", "E-Commerce & Automatic Rate", "Ηλεκτρονικό εμπόριο & Αυτόματη ισοτιμία"), 
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
              {txt('MAĞAZA BİLGİ BANKASI', 'RETAIL KNOWLEDGE BANK', 'ΤΡΑΠΕΖΑ ΓΝΩΣΕΩΝ ΛΙΑΝΙΚΗΣ')}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {txt('Sıkça Sorulan Sorular', 'Frequently Asked Questions', 'Συχνές Ερωτήσεις')}
            </h2>
            <p className="text-slate-500 font-semibold text-sm mt-2">
              {txt('ShopLP satış, stok ve cari otomasyon sistemimizle ilgili en çok merak edilen detaylar.', 'The most curious details about our ShopLP sales, stock, and ledger automation system.', 'Οι πιο ενδιαφέρουσες λεπτομέρειες σχετικά με το σύστημα πωλήσεων, αποθεμάτων και αυτοματοποίησης καθολικού ShopLP.')}
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
                placeholder={txt('Barkod, veresiye borç, dövizli kasa veya e-Fatura hakkında arayın...', 'Search about barcode, credit debt, multi-currency cash register or e-Invoice...', 'Αναζήτηση για barcode, πιστωτικό χρέος, ταμειακή μηχανή πολλαπλών νομισμάτων ή e-Invoice...')}
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
                <p className="text-slate-800 font-extrabold text-sm">{txt('Aramanızla eşleşen soru bulunamadı.', 'No questions found matching your search.', 'Δεν βρέθηκαν ερωτήσεις που να ταιριάζουν με την αναζήτησή σας.')}</p>
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
          <p className="text-sm text-white/50 font-medium">{txt('© 2026 LookPrice. Tüm Hakları Saklıdır.', '© 2026 LookPrice. All Rights Reserved.', '© 2026 LookPrice. Με επιφύλαξη παντός δικαιώματος.')}</p>
        </div>
      </footer>
    </div>
  );
}
