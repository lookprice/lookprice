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
  Calculator,
  Play,
  Tv,
  Youtube
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { restateFaq } from '../data/restateFaq';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';

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

  const [dbVideos, setDbVideos] = useState<any[]>([]);
  const [activeVideoTab, setActiveVideoTab] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.getPublicVideos("restatelp")
      .then(res => {
        if (isMounted && res && Array.isArray(res) && res.length > 0) {
          setDbVideos(res);
        }
      })
      .catch(err => console.warn("Could not load REstate videos, using defaults:", err?.message || err));
    return () => {
      isMounted = false;
    };
  }, []);

  const videoTabs = useMemo(() => {
    if (dbVideos.length > 0) {
      return dbVideos.map(v => ({
        id: v.product_key,
        title: v.title,
        tag: "RESTATELP",
        description: v.description || "",
        youtubeId: v.youtube_id,
        duration: v.duration || "1:00",
        isLive: v.is_live,
        coverImg: v.cover_img || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80"
      }));
    }
    return [
      {
        id: "restate_portfolio",
        title: txt("Gayrimenkul Portföy CRM & Arşiv", "Real Estate Portfolio CRM & Archive", "Gayrimenkul Portföy CRM & Arşiv"),
        tag: "RESTATELP",
        description: txt(
          "Konut, ticari ve tarla/arsa portföylerinin koçan tipi, tapu bilgileri ve mülk sahibi detayları ile eksiksiz kaydı ve detaylı arşivi.",
          "Complete record and detailed archive of residential, commercial, and land portfolios with deed type, title deed info, and owner details.",
          "Complete record and detailed archive of residential, commercial, and land portfolios with deed type, title deed info, and owner details."
        ),
        youtubeId: "bdbXezbS35c",
        duration: "1:45",
        isLive: true,
        coverImg: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "restate_calendar",
        title: txt("Yer Gösterim & Randevu Planlayıcı", "Viewing & Appointment Planner", "Viewing & Appointment Planner"),
        tag: "RESTATELP",
        description: txt(
          "Brokerlar ve danışmanlar arası ortak yer gösterme takvimi, müşteri saha randevuları ve randevu çakışma uyarıları.",
          "Joint viewing calendar among brokers and consultants, client field appointments, and schedule conflict warnings.",
          "Joint viewing calendar among brokers and consultants, client field appointments, and schedule conflict warnings."
        ),
        youtubeId: null,
        duration: txt("Yakında", "Coming Soon", "Coming Soon"),
        isLive: false,
        coverImg: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "restate_signature",
        title: txt("Dijital Biyometrik İmzalama", "Digital Biometric Signing", "Digital Biometric Signing"),
        tag: "RESTATELP",
        description: txt(
          "Yer gösterme formları, kiralama ve kapora ön-sözleşmelerinin tablet veya telefonda ıslak biyometrik imza ile güvenli imzalatılması.",
          "Secure signature of property viewing forms, lease, and deposit pre-contracts on tablets or phones with wet biometric signatures.",
          "Secure signature of property viewing forms, lease, and deposit pre-contracts on tablets or phones with wet biometric signatures."
        ),
        youtubeId: null,
        duration: txt("Yakında", "Coming Soon", "Coming Soon"),
        isLive: false,
        coverImg: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "restate_design",
        title: txt("Ofis Vitrin Afiş & Kolaj Tasarımı", "Office Showcase Poster & Collage Design", "Office Showcase Poster & Collage Design"),
        tag: "RESTATELP",
        description: txt(
          "Tek tıkla portföy bilgilerini ofis vitrin afişine veya sosyal medya şablonlarına (Satıldı/Kiralandı şeritli) otomatik dökme.",
          "One-click mapping of portfolio details onto office showcase posters or social media templates with 'Sold/Rented' ribbons.",
          "One-click mapping of portfolio details onto office showcase posters or social media templates with 'Sold/Rented' ribbons."
        ),
        youtubeId: null,
        duration: txt("Yakında", "Coming Soon", "Coming Soon"),
        isLive: false,
        coverImg: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
      }
    ];
  }, [dbVideos, lang]);

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
        } else if (item.id === 'multi_branch_crm_restate') {
          q = "Is there support for multi-branch and agent authorization?";
          a = "Yes! Add unlimited branches and staff, manage inventory transfers, and track branch metrics.";
        } else if (item.id === 'google_cloud_backup_restate') {
          q = "Can we backup all our data securely?";
          a = "Yes! All system data, images, and contracts can be securely backed up to corporate Google Cloud servers with one click.";
        } else if (item.id === 'seo_meta_integration_restate') {
          q = "Can SEO compliance and Google / Meta Ad pixel codes be added?";
          a = "Yes! Our SEO-compliant codebase ensures you rank high in Google searches. Add your Google Analytics and Meta Pixel codes in seconds.";
        } else if (item.id === 'realtime_analytics_restate') {
          q = "Is there a real-time analytics and charts dashboard?";
          a = "Yes! Top-selling regions, average selling times, and financial statements are instantly shown with sleek interactive charts.";
        } else if (item.id === 'radar_news_restate') {
          q = "Is there a radar system to track real estate news and opportunities?";
          a = "Yes! With the Radar Tracking System, you can instantly catch current sector news and opportunity listings.";
        } else if (item.id === 'currency_credit_audit_restate') {
          q = "Are automatic exchange rates, loan calculation, and user transaction audits included?";
          a = "Yes! With professional tools such as automatic exchange rate system, real-time financial loan calculation engine, and security audit logs.";
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
        } else if (item.id === 'multi_branch_crm_restate') {
          q = "Υπάρχει υποστήριξη για πολλαπλά υποκαταστήματα και εξουσιοδότηση αντιπροσώπων;";
          a = "Ναι! Προσθέστε απεριόριστα υποκαταστήματα και προσωπικό, διαχειριστείτε μεταφορές αποθεμάτων και παρακολουθήστε μετρήσεις υποκαταστημάτων.";
        } else if (item.id === 'google_cloud_backup_restate') {
          q = "Μπορούμε να δημιουργήσουμε αντίγραφα ασφαλείας όλων των δεδομένων μας με ασφάλεια;";
          a = "Ναι! Όλα τα δεδομένα του συστήματος, οι εικόνες και τα συμβόλαια μπορούν να δημιουργηθούν με ασφάλεια αντίγραφα ασφαλείας στους διακομιστές Google Cloud με ένα κλικ.";
        } else if (item.id === 'seo_meta_integration_restate') {
          q = "Μπορεί να προστεθεί συμμόρφωση SEO και κώδικες pixel Google / Meta Ad;";
          a = "Ναι! Προσθέστε τους κωδικούς Google Analytics και Meta Pixel σε δευτερόλεπτα για να βελτιστοποιήσετε τις καμπάνιες μάρκετινγκ.";
        } else if (item.id === 'realtime_analytics_restate') {
          q = "Υπάρχει πίνακας ελέγχου αναλύσεων και γραφημάτων σε πραγματικό χρόνο;";
          a = "Ναι! Οι περιοχές με τις περισσότερες πωλήσεις, οι μέσοι χρόνοι πώλησης και οι οικονομικές καταστάσεις εμφανίζονται αμέσως με κομψά διαδραστικά γραφήματα.";
        } else if (item.id === 'radar_news_restate') {
          q = "Υπάρχει σύστημα ραντάρ για την παρακολούθηση ειδήσεων και ευκαιριών ακινήτων;";
          a = "Ναι! Με το Σύστημα Παρακολούθησης Ραντάρ, μπορείτε να καταγράψετε άμεσα τα τρέχοντα νέα του τομέα και τις λίστες ευκαιριών.";
        } else if (item.id === 'currency_credit_audit_restate') {
          q = "Περιλαμβάνονται αυτόματες συναλλαγματικές ισοτιμίες, υπολογισμός δανείου και έλεγχοι συναλλαγών χρηστών;";
          a = "Ναι! Το μεσιτικό σας γραφείο βρίσκεται υπό πλήρη έλεγχο με εργαλεία όπως ο αυτόματος συγχρονισμός συναλλαγματικών ισοτιμιών και τα αρχεία ελέγχου.";
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
        <title>REstateLP | {txt('Gayrimenkul ve Emlak Portföy Yönetim Yazılımı', 'Real Estate and Property Portfolio Management Software', 'Λογισμικό Διαχείρισης Ακινήτων & Χαρτοφυλακίου')}</title>
        <meta name="description" content={txt(
          "REstateLP ile emlak ofisi yönetiminizi dijitalleştirin. Mülk portföy takibi, emlak CRM, dijital satış sözleşmeleri ve otomatik sosyal medya paylaşımı ile emlak ofisinizin verimliliğini artırın.",
          "Digitalize your real estate agency management with REstateLP. Increase efficiency with property portfolio tracking, real estate CRM, digital sales contracts, and automated social media sharing.",
          "Ψηφιοποιήστε τη διαχείριση του κτηματομεσιτικού σας γραφείου με το REstateLP. Αυξήστε την αποδοτικότητα με παρακολούθηση χαρτοφυλακίου ακινήτων, CRM ακινήτων, ψηφιακά συμβόλαια πωλήσεων και αυτοματοποιημένη κοινή χρήση στα κοινωνικά μέσα."
        )} />
        <meta name="keywords" content="emlakçı programı, emlak crm, gayrimenkul takip sistemi, portföy yönetim yazılımı, emlakçı satış takip, satılık daire ilanı, kiralık emlak yönetimi, emlak ofis programı, gayrimenkul müşteri yönetimi, gayrimenkul crm, emlak yazılımı, emlak ilan yönetimi, gayrimenkul satış otomasyonu, emlak ofis yönetimi, gayrimenkul dijital vitrin" />
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
            {txt('Yeni Nesil Emlak Portföy ve', 'Next-Gen Real Estate Portfolio and', 'Νέα Γενιά Χαρτοφυλάκιο Ακινήτων και')} <br className="hidden md:inline"/> {txt('Müşteri Yönetim Sistemi', 'Customer Management System', 'Σύστημα Διαχείρισης Πελατών')}
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-10 font-semibold leading-relaxed">
            {txt('Mülkiyet ve tapu koçan tiplerine özel emlak havuzu oluşturun, Sterlin (GBP) fiyatları anlık kurlarla otomatik gösterin, mülk türüne özel PDF broşürleri saniyeler içinde hazırlayın.', 'Create a property pool specific to property and title deed types, automatically show Sterling (GBP) prices with instant exchange rates, and prepare property-specific PDF brochures in seconds.', 'Δημιουργήστε μια δεξαμενή ακινήτων ειδικά για τύπους ιδιοκτησίας και τίτλων ιδιοκτησίας, εμφανίστε αυτόματα τις τιμές σε Στερλίνα (GBP) με άμεσες συναλλαγματικές ισοτιμίες και προετοιμάστε φυλλάδια PDF ειδικά για ακίνητα σε δευτερόλεπτα.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 transition-all text-lg flex items-center justify-center gap-2 shadow-lg shadow-rose-600/15 cursor-pointer"
            >
              {txt('Hemen Deneyin', 'Try Now', 'Δοκιμάστε Τώρα')} <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Showcase Visual Section */}
      <section className="py-16 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-block px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold uppercase tracking-wider">
              {txt('DİJİTAL GAYRİMENKUL OTOMASYONU', 'DIGITAL REAL ESTATE AUTOMATION', 'ΨΗΦΙΑΚΟΣ ΑΥΤΟΜΑΤΙΣΜΟΣ ΑΚΙΝΗΤΩΝ')}
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              {txt('Lüks Konut Sunum Altyapısı ve Portföy CRM\'i', 'Luxury Housing Presentation Infrastructure and Portfolio CRM', 'Υποδομή Παρουσίασης Πολυτελών Κατοικιών και CRM Χαρτοφυλακίου')}
            </h2>
            <p className="text-slate-600 font-semibold text-sm md:text-base leading-relaxed">
              {txt('REstateLP, emlak ofisinizin portföy ağını koçan, tapu tipi, metrekare ve fiyat kriterleriyle kusursuz yönetir. Lüks konutlarınıza ait profesyonel PDF tanıtım broşürlerini saniyeler içinde basmanızı sağlar.', 'REstateLP flawlessly manages your real estate office\'s portfolio network with criteria such as deed type, square meter, and price. It allows you to print professional PDF promotional brochures for your luxury homes in seconds.', 'Το REstateLP διαχειρίζεται άψογα το δίκτυο χαρτοφυλακίου του κτηματομεσιτικού σας γραφείου με κριτήρια όπως ο τύπος τίτλου, τα τετραγωνικά μέτρα και η τιμή. Σας επιτρέπει να εκτυπώνετε επαγγελματικά διαφημιστικά φυλλάδια PDF για τα πολυτελή σπίτια σας σε δευτερόλεπτα.')}
            </p>
            <div className="space-y-3">
              {[
                txt(txt("Türk Koçanı, Eşdeğer veya Tahsis tapu tiplerine özel filtreler", "Special filters for Turkish, Equivalent or Allocation title deed types", "Ειδικά φίλτρα για τύπους τίτλων ιδιοκτησίας Τουρκικού, Ισοδύναμου ή Κατανομής"), "Special filters for Turkish, Equivalent or Allocation title deed types", "Ειδικά φίλτρα για τύπους τίτλων ιδιοκτησίας Τουρκικού, Ισοδύναμου ή Κατανομής"),
                txt(txt("Fiyatları Sterlin (GBP) olarak girip anlık kurla TL/Euro/USD gösterme", "Enter prices in Sterling (GBP) and display TL/Euro/USD with instant exchange rates", "Εισαγάγετε τιμές σε Στερλίνα (GBP) και εμφανίστε TL/Euro/USD με άμεσες συναλλαγματικές ισοτιμίες"), "Enter prices in Sterling (GBP) and display TL/Euro/USD with instant exchange rates", "Εισαγάγετε τιμές σε Στερλίνα (GBP) και εμφανίστε TL/Euro/USD με άμεσες συναλλαγματικές ισοτιμίες"),
                txt(txt("Müşterilerle biyometrik dijital imzalı yetki ve kapora sözleşmeleri", "Authorization and deposit agreements with biometric digital signatures with customers", "Συμφωνίες εξουσιοδότησης και προκαταβολής με βιομετρικές ψηφιακές υπογραφές με πελάτες"), "Authorization and deposit agreements with biometric digital signatures with customers", "Συμφωνίες εξουσιοδότησης και προκαταβολής με βιομετρικές ψηφιακές υπογραφές με πελάτες")
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
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80" 
                alt="REstateLP Property Portfolios Showcase" 
                referrerPolicy="no-referrer"
                className="w-full h-[320px] md:h-[450px] object-cover rounded-[1.8rem] group-hover:scale-[1.01] transition-transform duration-500"
              />
              <div className="absolute bottom-8 left-8 right-8 z-20 bg-black/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-white">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20 mb-2 inline-block">
                  {txt('EMLAK PORTAL VİTRİN', 'REAL ESTATE PORTAL SHOWCASE', 'ΒΙΤΡΙΝΑ ΠΥΛΗΣ ΑΚΙΝΗΤΩΝ')}
                </span>
                <p className="font-black text-lg md:text-xl mb-1">{txt('Kurumsal İlan Web Sitesi Altyapısı', 'Corporate Listing Website Infrastructure', 'Υποδομή Ιστότοπου Εταιρικών Καταχωρίσεων')}</p>
                <p className="text-white/60 text-xs md:text-sm font-semibold">{txt('Tüm gayrimenkul havuzunuzu kurumsal web sitenizle anlık senkronize yayınlayın.', 'Publish your entire real estate pool instantly synchronized with your corporate website.', 'Δημοσιεύστε ολόκληρη τη δεξαμενή ακινήτων σας άμεσα συγχρονισμένη με τον εταιρικό σας ιστότοπο.')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Showcase Section */}
      <section className="py-20 bg-gradient-to-b from-white to-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-rose-500/10 text-rose-700 rounded-full text-xs font-black tracking-wider uppercase border border-rose-500/10">
              <Tv className="h-3.5 w-3.5 text-rose-600 animate-pulse" />
              {txt('SİSTEMİ CANLI İZLEYİN', 'WATCH LIVE DEMO', 'ΠΑΡΑΚΟΛΟΥΘΗΣΤΕ LIVE')}
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mt-3 mb-4">
              {txt('Uygulamalı Sistem Özellikleri & Video Turu', 'Interactive System Tour & Live Demos', 'Διαδραστική Περιήγηση Συστήματος & Live Demos')}
            </h2>
            <p className="text-slate-500 font-semibold text-sm sm:text-base leading-relaxed">
              {txt(
                'REstateLP yazılımının tüm modüllerini ve portföy yönetim akışlarını uygulamalı anlatımlarla canlı olarak izleyin.',
                'Watch real usage scenarios and explore how the entire REstateLP suite functions in real estate operations.',
                'Watch real usage scenarios and explore how the entire REstateLP suite functions in real estate operations.'
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
                          ? 'bg-white border-rose-500/20 shadow-md shadow-rose-500/5'
                          : 'bg-white/50 border-slate-100 hover:bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        isActive ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Tv className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${
                            isActive ? 'text-rose-700' : 'text-slate-400'
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
              <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100/30 flex items-center gap-3">
                <Youtube className="h-5 w-5 text-red-600 shrink-0" />
                <p className="text-xs text-rose-800 font-bold">
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
                          <button className="relative h-14 w-14 sm:h-16 sm:w-16 bg-rose-600 hover:bg-rose-500 hover:scale-105 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300">
                            <Play className="h-6 w-6 sm:h-7 sm:w-7 fill-current ml-1" />
                          </button>
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 p-3 sm:p-4 bg-black/50 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase text-rose-400 tracking-wider">YOUTUBE VIDEO</p>
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
                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20 hover:bg-rose-500/20 transition-all whitespace-nowrap"
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
                        <Tv className="h-8 w-8 text-rose-500 animate-pulse" />
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
            {txt('Emlak Ofisiniz İçin Akıllı Çözümler', 'Smart Solutions for Your Real Estate Office', 'Έξυπνες Λύσεις για το Κτηματομεσιτικό σας Γραφείο')}
          </h2>
          <p className="text-slate-500 font-semibold text-sm sm:text-base leading-relaxed">
            {txt('REstateLP, KKTC emlak piyasasının dinamik ve hukuki ihtiyaçlarına %100 tam uyumlu yenilikçi modüller ve araçlar sunar.', 'REstateLP offers innovative modules and tools that are 100% compliant with the dynamic and legal needs of the real estate market.', 'Το REstateLP προσφέρει καινοτόμες μονάδες και εργαλεία που συμμορφώνονται 100% με τις δυναμικές και νομικές ανάγκες της αγοράς ακινήτων.')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { 
              title: txt("Mülk, Müşteri & Evrak CRM'i", "Property, Customer & Document CRM", "CRM Ακινήτων, Πελατών & Εγγράφων"), 
              desc: txt("Konut, Ticari ve Tarla/Arsa gibi her statüde mülkün Satılık/Kiralık kaydı, mülk sahibi detayları ve resmi tapu evrak arşivi.", "For Sale/Rent registration of properties in all statuses such as Residential, Commercial, and Field/Land, property owner details, and official title deed document archive.", "Εγγραφή Προς Πώληση/Ενοικίαση ακινήτων σε όλες τις καταστάσεις, όπως Κατοικίες, Εμπορικά και Αγροτεμάχια/Οικόπεδα, στοιχεία ιδιοκτήτη ακινήτου και επίσημο αρχείο εγγράφων τίτλου ιδιοκτησίας."),
              icon: Building,
              color: 'text-rose-600 bg-rose-50 border-rose-100/50'
            },
            { 
              title: txt("Gezi & Randevu Takvimi", "Tour & Appointment Calendar", "Ημερολόγιο Περιήγησης & Ραντεβού"), 
              desc: txt("Tüm broker ve danışmanlarınız ile ortak kullanabileceğiniz yer gösterme planlayıcısı ve müşteri saha randevu takvimi.", "Property viewing planner and customer field appointment calendar that you can use jointly with all your brokers and consultants.", "Σχεδιαστής προβολής ακινήτων και ημερολόγιο ραντεβού πελατών στο πεδίο που μπορείτε να χρησιμοποιήσετε από κοινού με όλους τους μεσίτες και τους συμβούλους σας."),
              icon: Calendar,
              color: 'text-indigo-600 bg-indigo-50 border-indigo-100/50'
            },
            { 
              title: txt("CRM Pipeline Süreç Takibi", "CRM Pipeline Process Tracking", "Παρακολούθηση Διαδικασίας Pipeline CRM"), 
              desc: txt("İlk temastan pazarlık, kapora ve tapu devrine kadar tüm portföy işlem adımlarını görsel pipeline paneli üzerinden izleyin.", "Monitor all portfolio transaction steps from the first contact to negotiation, deposit, and title deed transfer via the visual pipeline panel.", "Παρακολουθήστε όλα τα βήματα συναλλαγής χαρτοφυλακίου από την πρώτη επαφή έως τη διαπραγμάτευση, την προκαταβολή και τη μεταβίβαση τίτλου ιδιοκτησίας μέσω του οπτικού πίνακα pipeline."),
              icon: GitBranch,
              color: 'text-emerald-600 bg-emerald-50 border-emerald-100/50'
            },
            { 
              title: txt("Vitrin Bilgi Posterleri (Print)", "Showcase Info Posters (Print)", "Αφίσες Πληροφοριών Βιτρίνας (Εκτύπωση)"), 
              desc: txt("Ofisinizin camına asılacak şık tasarımlı ve özet teknik bilgileri içeren portföy afişlerini saniyeler içinde tasarlayın ve yazdırın.", "Design and print elegantly designed portfolio posters containing summary technical information to hang on your office window in seconds.", "Σχεδιάστε και εκτυπώστε κομψά σχεδιασμένες αφίσες χαρτοφυλακίου που περιέχουν συνοπτικές τεχνικές πληροφορίες για να κρεμάσετε στο παράθυρο του γραφείου σας σε δευτερόλεπτα."),
              icon: Printer,
              color: 'text-amber-600 bg-amber-50 border-amber-100/50'
            },
            { 
              title: txt("Gizli & Yetkili Portföy Yönetimi", "Confidential & Authorized Portfolio Management", "Εμπιστευτική & Εξουσιοδοτημένη Διαχείριση Χαρτοφυλακίου"), 
              desc: txt("İstediğiniz hassas portföyü diğer paydaşlardan gizleyin. Tek yetkili (Exclusive) emlak kontratlarını ve sürelerini yönetin.", "Hide the sensitive portfolio you want from other stakeholders. Manage sole authorized (Exclusive) real estate contracts and their durations.", "Κρύψτε το ευαίσθητο χαρτοφυλάκιο που θέλετε από άλλους ενδιαφερόμενους. Διαχειριστείτε αποκλειστικά εξουσιοδοτημένα συμβόλαια ακινήτων και τη διάρκειά τους."),
              icon: EyeOff,
              color: 'text-purple-600 bg-purple-50 border-purple-100/50'
            },
            { 
              title: txt("Dijital İmzalı Sözleşmeler", "Digitally Signed Contracts", "Ψηφιακά Υπογεγραμμένα Συμβόλαια"), 
              desc: txt("Yer gösterme belgesi, kiralama ve kapora sözleşmelerini müşterinizin yanında veya WhatsApp üzerinden yasal ve biyometrik imzalatın.", "Have the property viewing document, rental and deposit contracts signed legally and biometrically next to your customer or via WhatsApp.", "Ζητήστε από τον πελάτη σας να υπογράψει νομικά και βιομετρικά το έγγραφο προβολής ακινήτου, τα συμβόλαια ενοικίασης και προκαταβολής δίπλα στον πελάτη σας ή μέσω WhatsApp."),
              icon: PenTool,
              color: 'text-blue-600 bg-blue-50 border-blue-100/50'
            },
            { 
              title: txt("Realtime Afiş & Görsel Tasarımı", "Realtime Poster & Visual Design", "Σχεδιασμός Αφίσας & Οπτικών σε Πραγματικό Χρόνο"), 
              desc: txt("Tek tuşla ilan teknik verilerini şablonlara işleyin; \"Satıldı\", \"Kiralandı\", \"Opsiyonlu\", \"Fırsat\" şeritli kolaj afişleri hazırlayın.", "Process ad technical data into templates with one click; prepare collage posters with \"Sold\", \"Rented\", \"Optioned\", \"Opportunity\" ribbons.", "Επεξεργαστείτε τεχνικά δεδομένα διαφημίσεων σε πρότυπα με ένα κλικ. προετοιμάστε αφίσες κολάζ με κορδέλες \"Πουλήθηκε\", \"Ενοικιάστηκε\", \"Επιλογή\", \"Ευκαιρία\"."),
              icon: Image,
              color: 'text-pink-600 bg-pink-50 border-pink-100/50'
            },
            { 
              title: txt("Otomatik Instagram Paylaşımı", "Automatic Instagram Sharing", "Αυτόματη κοινοποίηση στο Instagram"), 
              desc: txt("Portföye eklenen her mülk anında enrakipsiz.com ve kendi hesaplarınızda otomatik paylaşılır; fiyat güncellemelerinde yenilenir.", "Every property added to the portfolio is instantly shared automatically on enrakipsiz.com and your own accounts; updated on price updates.", "Κάθε ακίνητο που προστίθεται στο χαρτοφυλάκιο κοινοποιείται αυτόματα στο enrakipsiz.com και στους δικούς σας λογαριασμούς. ενημερώνεται με ενημερώσεις τιμών."),
              icon: Share2,
              color: 'text-red-600 bg-red-50 border-red-100/50'
            },
            { 
              title: txt("Sürükle-Bırak Web Site Sihirbazı", "Drag-and-Drop Website Wizard", "Οδηγός ιστότοπου μεταφοράς και απόθεσης"), 
              desc: txt("Emlak ofisinize özel hazır kurumsal web siteniz saniyeler içinde otomatik kurulur, dilediğiniz gibi sürükle-bırak özelleştirebilirsiniz.", "Your custom ready-made corporate website is automatically installed in seconds, you can customize it with drag-and-drop as you wish.", "Ο προσαρμοσμένος έτοιμος εταιρικός ιστότοπός σας εγκαθίσταται αυτόματα σε δευτερόλεπτα, μπορείτε να τον προσαρμόσετε με μεταφορά και απόθεση όπως επιθυμείτε."),
              icon: Globe,
              color: 'text-emerald-600 bg-emerald-50 border-emerald-100/50'
            },
            { 
              title: txt("Otomatik Portföy Dağıtım Ağı", "Automatic Portfolio Distribution Network", "Αυτόματο Δίκτυο Διανομής Χαρτοφυλακίου"), 
              desc: txt("Eklediğiniz mülkler el değmeden kendi kurumsal sitenizde ve global emlak paylaşım portalı enrakipsiz.com'da otomatik listelenir.", "Your added properties are automatically listed untouched on your own corporate website and the global real estate sharing portal enrakipsiz.com.", "Τα ακίνητα που προσθέσατε παρατίθενται αυτόματα ανέγγιχτα στον δικό σας εταιρικό ιστότοπο και στην παγκόσμια πύλη κοινής χρήσης ακινήτων enrakipsiz.com."),
              icon: Send,
              color: 'text-cyan-600 bg-cyan-50 border-cyan-100/50'
            },
            { 
              title: txt("Mobil Öncelikli Hızlı Portföy", "Mobile-First Quick Portfolio", "Γρήγορο Χαρτοφυλάκιο Mobile-First"), 
              desc: txt("Daha mülkün içerisindeyken telefondan fotoğrafları çekin, verileri girin; anında web sitesinde ve sosyal medyada yayına alın.", "Take photos from your phone while you are still inside the property, enter the data; publish it instantly on the website and social media.", "Τραβήξτε φωτογραφίες από το τηλέφωνό σας ενώ βρίσκεστε ακόμα μέσα στο ακίνητο, εισαγάγετε τα δεδομένα. δημοσιεύστε το άμεσα στον ιστότοπο και στα μέσα κοινωνικής δικτύωσης."),
              icon: Smartphone,
              color: 'text-amber-600 bg-amber-50 border-amber-100/50'
            },
            { 
              title: txt("Maliyet & Gider Takip Sistemi", "Cost & Expense Tracking System", "Σύστημα παρακολούθησης κόστους και εξόδων"), 
              desc: txt("Mülklere yaptığınız tüm masrafları (reklam, tadilat, hukuki) gelir/gider kalemlerine işleyerek kâr-zarar raporlarını analiz edin.", "Analyze profit and loss reports by processing all your expenses (advertising, renovation, legal) on properties into income/expense items.", "Αναλύστε τις αναφορές κερδών και ζημιών επεξεργάζοντας όλα τα έξοδά σας (διαφήμιση, ανακαίνιση, νομικά) σε ακίνητα σε στοιχεία εσόδων/εξόδων."),
              icon: TrendingUp,
              color: 'text-rose-600 bg-rose-50 border-rose-100/50'
            },
            { 
              title: txt("Tek Bakışta Envanter Listesi", "Inventory List at a Glance", "Λίστα αποθέματος με μια ματιά"), 
              desc: 'Kiralık, Kiralandı, Satılık, Satıldı, Opsiyonlu mülklerinizi fiyatı ve özet teknik verileriyle tek bakışta izleyin, detayları inceleyin.',
              icon: CheckCircle,
              color: 'text-teal-600 bg-teal-50 border-teal-100/50'
            },
            { 
              title: txt("Vadeli İşlemler & Cari Hesap", "Forward Transactions & Current Account", "Προθεσμιακές Συναλλαγές & Τρεχούμενος Λογαριασμός"), 
              desc: 'Senetli veya taksitli satış/kiralama işlemlerinizde cari borç/alacak takibi yapın, dilediğiniz an raporlayıp Excel/PDF indirin.',
              icon: BookOpen,
              color: 'text-violet-600 bg-violet-50 border-violet-100/50'
            },
            { 
              title: txt("Çok Şubeli CRM & Personel", "Multi-Branch CRM & Personnel", "Πολυκαταστηματικό CRM & Προσωπικό"), 
              desc: 'Dilediğiniz kadar şube ve danışman ekleyin. Şubeler arası portföy transferlerini tek panelden yetki kısıtlamalı kontrol edin.',
              icon: Users,
              color: 'text-blue-600 bg-blue-50 border-blue-100/50'
            },
            { 
              title: txt("Tek Tuşla Bulut Yedekleme", "One-Click Cloud Backup", "Cloud Backup με ένα κλικ"), 
              desc: 'Tüm tapu, evrak, sözleşme ve ilan fotoğraflarınızı Google Cloud sunucularına tek tuşla şifreli ve güvenli yedekleyin.',
              icon: Cloud,
              color: 'text-sky-600 bg-sky-50 border-sky-100/50'
            },
            { 
              title: txt("SEO Dostu & Hazır Meta", "SEO Friendly & Ready Meta", "Φιλικό προς το SEO & Έτοιμο Meta"), 
              desc: 'Google Analytics ve Meta Pixel entegrasyonu ile ilan sayfalarınızın reklam yeniden hedefleme (retargeting) kampanyalarını kolaylaştırın.',
              icon: Search,
              color: 'text-slate-600 bg-slate-50 border-slate-100/50'
            },
            { 
              title: txt("Gerçek Zamanlı Karar Analitiği", "Real-Time Decision Analytics", "Αναλυτικά Στοιχεία Απόφασης σε Πραγματικό Χρόνο"), 
              desc: 'Karar alıcılar için üretilmiş, ofisin kâr-zarar, ciro ve işlem adetlerini anlık özetleyen zengin dashboard grafikleri.',
              icon: BarChart3,
              color: 'text-indigo-600 bg-indigo-50 border-indigo-100/50'
            },
            { 
              title: txt("Sektörel Radar Takip Sistemi", "Sectoral Radar Tracking System", "Τομεακό Σύστημα Παρακολούθησης Ραντάρ"), 
              desc: 'Belirleyeceğiniz anahtar kelimelere göre internetteki en yeni piyasa fırsatlarını ve imar duyurularını yakalayan akıllı emlak radarı.',
              icon: Radio,
              color: 'text-red-600 bg-red-50 border-red-100/50'
            },
            { 
              title: txt("Otomatik Döviz & Finansman", "Automatic Currency & Financing", "Αυτόματο Νόμισμα & Χρηματοδότηση"), 
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
