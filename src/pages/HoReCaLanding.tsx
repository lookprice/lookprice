import React, { useState, useMemo } from 'react';
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
  WifiOff,
  RefreshCw,
  Receipt,
  QrCode,
  Layers,
  Send,
  ShieldAlert,
  Play,
  Tv,
  Youtube
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { horecaFaq } from '../data/horecaFaq';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import { useEffect } from 'react';

export default function HoReCaLanding() {
  const { lang, setLang } = useLanguage();
  const txt = (trText: string, enText: string, elText: string) => {
    if (lang === 'tr') return trText;
    if (lang === 'el') return elText;
    return enText;
  };

  const [openId, setOpenId] = useState<string | null>(null);
  const navigate = useNavigate();

  const [activeVideoTab, setActiveVideoTab] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [dbVideos, setDbVideos] = useState<any[]>([]);

  useEffect(() => {
    api.getPublicVideos("horecalp")
      .then(res => {
        if (res && Array.isArray(res) && res.length > 0) {
          setDbVideos(res);
        }
      })
      .catch(err => console.error("Error fetching HoReCa videos:", err));
  }, []);

  const videoTabs = useMemo(() => {
    if (dbVideos.length > 0) {
      return dbVideos.map(v => ({
        id: v.product_key,
        title: v.title,
        tag: v.product_key.toUpperCase(),
        description: v.description || "",
        youtubeId: v.youtube_id,
        duration: v.duration || "1:00",
        isLive: v.is_live,
        coverImg: v.cover_img || "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80"
      }));
    }
    return [
      {
        id: "pos",
        title: txt("Adisyon & Hızlı POS", "Bill & Rapid POS", "Λογαριασμός & Γρήγορο POS"),
        tag: "HORECALP",
        description: txt(
          "Garson el terminalleri ve kasa POS ekranının canlı kullanım görünümü. Masaların adisyon açılışı, sipariş ekleme ve masa durumlarının anlık güncellenmesini izleyin.",
          "Live look at waiter handheld units and cashier POS. Watch table bill opening, order entry, and real-time status updates.",
          "Ζωντανή ματιά στα φορητά τερματικά σερβιτόρου και το POS ταμείου. Παρακολουθήστε το άνοιγμα λογαριασμών, την εισαγωγή παραγγελιών και τις ενημερώσεις κατάστασης."
        ),
        youtubeId: "bdbXezbS35c",
        duration: "1:24",
        isLive: true,
        coverImg: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "qr_menu",
        title: txt("Temassız QR Menü Entegrasyonu", "Contactless QR Menu", "Ανέπαφο Μενού QR"),
        tag: "HORECALP",
        description: txt(
          "Müşteri gözünden temassız masadan sipariş ve interaktif dijital menü deneyimi. Ürün detayları, varyasyonlar ve mutfağa anlık düşen sipariş akışı.",
          "Contactless table ordering and interactive digital menu experience from the customer's perspective. Product details, variations, and instant kitchen routing.",
          "Ανέπαφη παραγγελία από το τραπέζι και διαδραστική εμπειρία ψηφιακού μενού. Λεπτομέρειες προϊόντος, παραλλαγές και άμεση δρομολόγηση στην κουζίνα."
        ),
        youtubeId: null,
        duration: txt("Yakında", "Coming Soon", "Σύντομα"),
        isLive: false,
        coverImg: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "kitchen_screen",
        title: txt("Dijital Mutfak Ekranı", "Digital Kitchen Screen", "Ψηφιακή Οθόνη Κουζίνας"),
        tag: "HORECALP",
        description: txt(
          "Mutfak hazırlık paneli kullanımı. Siparişlerin departman bazlı (Mutfak, Bar, Fırın) ayrışması, hazırlık aşamaları ve tamamlandı bildirimleri.",
          "Kitchen display system usage. Separation of orders by department, preparation stages, and ready alerts.",
          "Χρήση συστήματος οθόνης κουζίνας. Διαχωρισμός παραγγελιών ανά τμήμα, στάδια προετοιμασίας ve ειδοποιήσεις ετοιμότητας."
        ),
        youtubeId: null,
        duration: txt("Yakında", "Coming Soon", "Σύντομα"),
        isLive: false,
        coverImg: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "stock_recipe",
        title: txt("Reçete & Stok Takibi", "Recipe & Stock Tracking", "Συνταγές & Αποθέματα"),
        tag: "HORECALP",
        description: txt(
          "Hammadde bazlı milimetrik reçete (BOM) tanımlama ve satış anında depodan otomatik düşüş süreçlerinin yönetim paneli görünümü.",
          "Millimeter-precise recipe definitions and automatic stock deduction management dashboard view during active sales.",
          "Ορισμός συνταγών ακριβείας και αυτόματη αφαίρεση αποθεμάτων στον πίνακα ελέγχου κατά τη διάρκεια των πωλήσεων."
        ),
        youtubeId: null,
        duration: txt("Yakında", "Coming Soon", "Σύντομα"),
        isLive: false,
        coverImg: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80"
      }
    ];
  }, [dbVideos, lang]);

  const toggleAccordion = (id: string) => {
    setOpenId(prev => prev === id ? null : id);
  };

  const localizedFaq = useMemo(() => {
    return horecaFaq.map(item => {
      let q = item.q;
      let a = item.a;
      if (lang === 'en') {
        if (item.id === 'offline_mode') {
          q = 'Does the system continue to work when the internet is disconnected or in offline mode?';
          a = 'Yes. LookPrice infrastructure offers an offline-first architecture. Even if your internet connection is lost, your terminals and handheld units continue to take orders, open bills, update table statuses, and communicate over the local network. Once the internet connection is restored, all data is automatically and securely synchronized with our cloud servers in the background.';
        } else if (item.id === 'realtime_sync') {
          q = 'How does real-time synchronization work? Can other waiters add orders to a bill opened by one waiter?';
          a = 'Yes. LookPrice uses real-time state synchronization across all terminals. Any authorized waiter or cashier can instantly access, add orders to, or view the current table bill from their own screen. Conflicts are automatically prevented by the system.';
        } else if (item.id === 'split_payment') {
          q = 'Is it possible to request bills, split bills, and split payments at the table?';
          a = 'Yes. LookPrice rapid POS and restaurant interface features advanced bill splitting and partial collection options. You can split bills evenly by the number of guests or select specific items to receive partial payments (Cash, Credit Card, or mixed). The remaining balance is automatically tracked.';
        } else if (item.id === 'digital_menu_order') {
          q = 'Do you have a QR digital menu for customers? Can orders be placed directly through the menu?';
          a = 'Yes, an advanced contactless QR Digital Menu module is available. Customers scan the QR code at the table with their phone camera to access the menu. You can use it as a "Visual Catalog" or enable "Order from Table" so guests can place interactive orders directly.';
        } else if (item.id === 'menu_details') {
          q = 'Can we see product ingredients, portions, allergens, and product options in Digital Menus?';
          a = 'Absolutely. Our QR Digital Menu supports rich details. You can add ingredients, portions, and allergens. You can also define dynamic variations like cooking temperature, sauce selection, or extra ingredients to let guests fully customize their orders.';
        } else if (item.id === 'happy_hours') {
          q = 'Can Happy Hours (Time-limited campaigns/pricing) be defined in the system?';
          a = 'Yes. You can create special price lists and Happy Hour rules valid on specific days and time intervals. The system updates prices automatically and returns to standard pricing when completed without manual action.';
        } else if (item.id === 'kitchen_routing') {
          q = 'Can bar and kitchen orders be separated? Can order tickets be printed to different sections from a single bill?';
          a = 'Yes. Our advanced routing engine filters all bill items by department. For example, when a single bill is approved, drink orders are automatically routed to the bar printer, and food orders to the kitchen screen or kitchen printer in seconds.';
        } else if (item.id === 'role_permissions') {
          q = 'Can waiter and cashier permissions be restricted? Are there IP and administrative restrictions?';
          a = 'Yes. You can manage roles (Manager, Head Waiter, Waiter, Cashier) with precision. Deletion, discounts, or returns require manager approval. You can also restrict waiter access to the venue Wi-Fi network (IP restriction) to strengthen security.';
        } else if (item.id === 'recipe_bom_conversion') {
          q = 'Can recipes (BOM) and weight conversions be set up to track stocks for cocktails or meals?';
          a = 'Yes. With our recipe (BOM) module, you can define precise recipes by milliliter, gram, or piece. For example, when a cocktail is sold, the alcohol amount is subtracted as milliliters and garnishes as pieces in milliseconds, ensuring perfect cost control.';
        } else if (item.id === 'product_variants') {
          q = 'Can we track stocks by defining product varieties and options?';
          a = 'Yes. You can add as many variations (e.g., size, extra sauce, extra cheese) to a product as you wish. You can define extra prices or costs for each, or manage stock items with dedicated barcodes.';
        } else if (item.id === 'reports_analytics') {
          q = 'Are product-based sales, cost, and revenue analysis reports available?';
          a = 'Yes. With the smart reporting module, you can view top-selling products, high-revenue categories, waiter performance, hourly density maps, and net profitability charts. Export reports as PDF or Excel.';
        } else if (item.id === 'online_order_system') {
          q = 'Do you have an online delivery ordering system?';
          a = 'Yes. With your custom ordering interface, you can receive Delivery and Takeaway orders directly from your customers without paying high commissions to external delivery apps. Orders drop directly onto your Cashier/POS screen with an alert sound.';
        } else if (item.id === 'pos_cash_registers') {
          q = 'Can we define new generation cash registers and physical POS devices in the system?';
          a = 'Yes. With our smart POS Bridge infrastructure, we are fully integrated with leading physical POS devices. When payment is selected, the amount is automatically sent to the POS device, and the fiscal receipt prints automatically upon success.';
        } else if (item.id === 'supply_chain_planning') {
          q = 'Do you have a stock supply planning and automatic supply recommendation system?';
          a = 'In R&D/Planning: We are working on our Smart Supply Planning module to fully digitize your supply chain. This module will analyze your past sales trends and stock consumption rates to automatically prepare supplier purchase orders and purchase suggestions.';
        }
      } else if (lang === 'el') {
        if (item.id === 'offline_mode') {
          q = 'Συνεχίζει να λειτουργεί το σύστημα όταν αποσυνδεθεί το διαδίκτυο ή σε λειτουργία εκτός σύνδεσης;';
          a = 'Ναι. Η υποδομή LookPrice προσφέρει αρχιτεκτονική offline-first. Ακόμη και αν χαθεί η σύνδεσή σας στο διαδίκτυο, τα τερματικά και οι φορητές συσκευές σας συνεχίζουν να λαμβάνουν παραγγελίες, να ανοίγουν λογαριασμούς, να ενημερώνουν τις καταστάσεις των τραπεζιών και να επικοινωνούν μέσω του τοπικού δικτύου. Μόλις αποκατασταθεί η σύνδεση, όλα τα δεδομένα συγχρονίζονται αυτόματα και με ασφάλεια στους διακομιστές cloud μας στο υπόβαθρο.';
        } else if (item.id === 'realtime_sync') {
          q = 'Πώς λειτουργεί ο συγχρονισμός σε πραγματικό χρόνο; Μπορούν άλλοι σερβιτόροι να προσθέσουν παραγγελίες σε έναν λογαριασμό που άνοιξε ένας σερβιτόρος;';
          a = 'Ναι. Το LookPrice χρησιμοποιεί αμφίδρομο συγχρονισμό δεδομένων σε πραγματικό χρόνο σε όλα τα τερματικά. Οποιοσδήποτε εξουσιοδοτημένος σερβιτόρος ή ταμίας μπορεί να έχει άμεση πρόσβαση, να προσθέτει παραγγελίες ή να βλέπει τον τρέχοντα λογαριασμό του τραπεζιού από τη δική του οθόνη. Οι διενέξεις αποτρέπονται αυτόματα από το σύστημα.';
        } else if (item.id === 'split_payment') {
          q = 'Είναι δυνατόν να ζητηθούν λογαριασμοί, να διαχωριστούν οι λογαριασμοί και να χωριστούν οι πληρωμές στο τραπέζι;';
          a = 'Ναι. Το γρήγορο POS και η διεπαφή εστιατορίου LookPrice διαθέτει προηγμένες επιλογές διαίρεσης λογαριασμού και μερικής είσπραξης. Μπορείτε να μοιράσετε τους λογαριασμούς εξίσου με τον αριθμό των επισκεπτών ή να επιλέξετε συγκεκριμένα στοιχεία για να λάβετε μερικές πληρωμές (Μετρητά, Πιστωτική Κάρτα ή μικτά). Το υπόλοιπο παρακολουθείται αυτόματα.';
        } else if (item.id === 'digital_menu_order') {
          q = 'Έχετε ψηφιακό μενού QR για τους πελάτες; Μπορούν να γίνουν παραγγελίες απευθείας μέσω του μενού;';
          a = 'Ναι, είναι διαθέσιμη μια προηγμένη ανέπαφη μονάδα ψηφιακού μενού QR. Οι πελάτες σαρώνουν τον κωδικό QR στο τραπέζι με την κάμερα του τηλεφώνου τους για να έχουν πρόσβαση στο μενού. Μπορείτε να το χρησιμοποιήσετε ως "Οπτικό Κατάλογο" ή να ενεργοποιήσετε την "Παραγγελία από το Τραπέζι" ώστε οι επισκέπτες να κάνουν διαδραστικές παραγγελίες απευθείας.';
        } else if (item.id === 'menu_details') {
          q = 'Μπορούμε να δούμε συστατικά προϊόντων, μερίδες, αλλεργιογόνα και επιλογές προϊόντων στα Ψηφιακά Μενού;';
          a = 'Απόλυτα. Το Ψηφιακό Μενού QR υποστηρίζει πλούσιες λεπτομέρειες. Μπορείτε να προσθέσετε συστατικά, μερίδες και αλλεργιογόνα. Μπορείτε επίσης να ορίσετε δυναμικές παραλλαγές όπως θερμοκρασία μαγειρέματος, επιλογή σάλτσας ή επιπλέον συστατικά, επιτρέποντας στους επισκέπτες να προσαρμόσουν πλήρως τις παραγγελίες τους.';
        } else if (item.id === 'happy_hours') {
          q = 'Μπορούν να οριστούν Happy Hours (καμπάνιες/τιμές περιορισμένου χρόνου) στο σύστημα;';
          a = 'Ναι. Μπορείτε να δημιουργήσετε ειδικούς τιμοκαταλόγους και κανόνες Happy Hour που ισχύουν σε συγκεκριμένες ημέρες και χρονικά διαστήματα. Το σύστημα ενημερώνει αυτόματα τις τιμές και επιστρέφει στην τυπική τιμολόγηση όταν ολοκληρωθεί, χωρίς χειροκίνητη ενέργεια.';
        } else if (item.id === 'kitchen_routing') {
          q = 'Μπορούν να διαχωριστούν οι παραγγελίες μπαρ και κουζίνας; Μπορούν να εκτυπωθούν δελτία παραγγελίας σε διαφορετικά τμήματα από έναν μόνο λογαριασμό;';
          a = 'Ναι. Η προηγμένη μηχανή δρομολόγησης φιλτράρει όλα τα στοιχεία του λογαριουμού ανά τμήμα. Για παράδειγμα, όταν εγκρίνεται ένας λογαριασμός, οι παραγγελίες ποτών δρομολογούνται αυτόματα στον εκτυπωτή μπαρ και οι παραγγελίες φαγητού στην οθόνη ή τον εκτυπωτή της κουζίνας σε δευτερόλεπτα.';
        } else if (item.id === 'role_permissions') {
          q = 'Μπορούν να περιοριστούν οι άδειες σερβιτόρου και ταμία; Υπάρχουν περιορισμοί IP και διαχειριστικοί περιορισμοί;';
          a = 'Ναι. Μπορείτε να διαχειριστείτε ρόλους (Διευθυντής, Αρχισερβιτόρος, Σερβιτόρος, Ταμίας) με ακρίβεια. Η διαγραφή, οι εκπτώσεις ή οι επιστροφές απαιτούν έγκριση διευθυντή. Μπορείτε επίσης να περιορίσετε την πρόσβαση των σερβιτόρων στο δίκτυο Wi-Fi του καταστήματος (περιορισμός IP) για ενίσχυση της ασφάλειας.';
        } else if (item.id === 'recipe_bom_conversion') {
          q = 'Μπορούν να ρυθμιστούν συνταγές (BOM) και μετατροπές βάρους για την παρακολούθηση αποθεμάτων για κοκτέιλ ή γεύματα;';
          a = 'Ναι. Με τη μονάδα συνταγών (BOM), μπορείτε να ορίσετε ακριβείς συνταγές ανά χιλιοστόλιτρο, γραμμάριο ή τεμάχιο. Για παράδειγμα, όταν πωλείται ένα κοκτέιλ, η ποσότητα αλκοόλ αφαιρείται ως χιλιοστόλιτρα και οι γαρνιτούρες ως τεμάχια σε χιλιοστά του δευτερολέπτου, εξασφαλίζοντας τέλειο έλεγχο κόστους.';
        } else if (item.id === 'product_variants') {
          q = 'Μπορούμε να παρακολουθούμε τα αποθέματα ορίζοντας ποικιλίες και επιλογές προϊόντων;';
          a = 'Ναι. Μπορείτε να προσθέσετε όσες παραλλαγές (π.χ. μέγεθος, έξτρα σάλτσα, έξτρα τυρί) επιθυμείτε σε ένα προϊόν. Μπορείτε να ορίσετε επιπλέον τιμές ή κόστος για καθεμία, ή να διαχειριστείτε τα αποθέματα με αποκλειστικούς γραμμωτούς κώδικες.';
        } else if (item.id === 'reports_analytics') {
          q = 'Είναι διαθέσιμες αναφορές ανάλυσης πωλήσεων, κόστους και εσόδων βάσει προϊόντος;';
          a = 'Ναι. Με την έξυπνη μονάδα αναφορών, μπορείτε να δείτε τα προϊόντα με τις μεγαλύτερες πωλήσεις, κατηγορίες υψηλών εσόδων, απόδοση σερβιτόρων, ωριαίους χάρτες πυκνότητας και διαγράμματα καθαρής κερδοφορίας. Εξαγωγή αναφορών ως PDF ή Excel.';
        } else if (item.id === 'online_order_system') {
          q = 'Έχετε σύστημα online παραγγελιών παράδοσης (delivery);';
          a = 'Ναι. Με την προσαρμοσμένη διεπαφή παραγγελιών σας, μπορείτε να λαμβάνετε παραγγελίες Delivery και Takeaway απευθείας από τους πελάτες σας χωρίς να πληρώνετε υψηλές προμήθειες σε εξωτερικές εφαρμογές. Οι παραγγελίες εμφανίζονται απευθείας στην οθόνη του Ταμία/POS με έναν ήχο ειδοποίησης.';
        } else if (item.id === 'pos_cash_registers') {
          q = 'Μπορούμε να ορίσουμε ταμειακές μηχανές νέας γενιάς και φυσικές συσκευές POS στο σύστημα;';
          a = 'Ναι. Με την έξυπνη υποδομή μας POS Bridge, είμαστε πλήρως ενσωματωμένοι με κορυφαίες φυσικές συσκευές POS. Όταν επιλέγεται η πληρωμή, το ποσό αποστέλλεται αυτόματα στη συσκευή POS και η απόδειξη εκτυπώνεται αυτόματα μετά την επιτυχή ολοκλήρωση.';
        } else if (item.id === 'supply_chain_planning') {
          q = 'Έχετε σύστημα σχεδιασμού εφοδιασμού αποθεμάτων και αυτόματης σύστασης εφοδιασμού;';
          a = 'Σε φάση Έρευνας & Ανάπτυξης: Εργαζόμαστε για τη μονάδα Έξυπνου Σχεδιασμού Εφοδιασμού για την πλήρη ψηφιοποίηση της εφοδιαστικής αλυσίδας σας. Αυτή η μονάδα θα αναλύει τις παρελθούσες τάσεις πωλήσεων και τα ποσοστά κατανάλωσης αποθεμάτων για την αυτόματη προετοιμασία παραγγελιών αγοράς προμηθευτή και προτάσεων αγοράς.';
        }
      }
      return { ...item, q, a };
    });
  }, [lang]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Helmet>
        <title>HorecaLP | {txt('Restoran ve Cafe Yönetim Yazılımı', 'Restaurant and Cafe Management Software', 'Λογισμικό Διαχείρισης Εστιατορίων & Καφετεριών')}</title>
        <meta name="description" content={txt(
          "LookPrice HorecaLP ile restoran ve kafe yönetimini dijitalleştirin. Adisyon programı, restoran POS sistemi, QR menü, stok takibi ve daha fazlası ile işlerinizi hızlandırın.",
          "Digitalize your restaurant and cafe management with LookPrice HorecaLP. Accelerate your business with bill programs, restaurant POS systems, QR menus, stock tracking, and more.",
          "Ψηφιοποιήστε τη διαχείριση του εστιατορίου και της καφετέριάς σας με το LookPrice HorecaLP. Επιταχύνετε τις δραστηριότητές σας με προγράμματα λογαριασμών, συστήματα POS εστιατορίων, μενού QR, παρακολούθηση αποθεμάτων και πολλά άλλα."
        )} />
        <meta name="keywords" content="Adisyon programı, Restoran POS sistemi, Cafe otomasyonu, Garson sipariş uygulaması, Masa yönetimi, Stok ve depo takibi, Hızlı adisyon, Kasa ve cari hesap, Mutfak ekran sistemi, QR menü entegrasyonu, Kafe yönetim yazılımı, Restoran adisyon, Bar ve restoran programı, Pastane otomasyonu, Fast food satış sistemi, Kolay restoran programı, Ekonomik adisyon yazılımı, Bulut tabanlı cafe sistemi, Kurulumsuz POS programı, Mobil adisyon sistemi, Zincir restoran yönetim yazılımı, Merkezi stok ve depo takibi, Çoklu şube restoran programı, Gelişmiş restoran raporlama, Esnek restoran otomasyonu, Ölçeklenebilir cafe programı, Yeni nesil adisyon sistemi, Hepsi bir arada restoran POS, Bulut restoran yazılımı, Kafe yönetimini kolaylaştıran yazılım, Adisyon karmaşasına son, Akıllı restoran yönetimi, İşletmenizi cebinizden yönetin, Siparişleri hızlandıran sistem, Bulut tabanlı adisyon, Kaçakları önleyen stok takibi, Hızlı sipariş sistemi, Temassız QR menü, Dijital mutfak ekranı" />
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
                      ? 'bg-amber-600 text-white shadow-md' 
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
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/40 via-transparent to-slate-50/50 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 rounded-full text-xs md:text-sm font-black text-amber-700 mb-6 border border-amber-100/50">
            <Sparkles className="h-4 w-4" />
            HoReCaLP by LookPrice
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-950 tracking-tighter mb-6 leading-[1.1]">
            {txt('Cafe ve Restoran Yönetiminde', 'Digital Revolution in', 'Ψηφιακή Επανάσταση στη')} <br className="hidden md:inline"/> {txt('Dijital Devrim', 'Cafe & Restaurant Management', 'Διαχείριση Καφετεριών & Εστιατορίων')}
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-10 font-semibold leading-relaxed">
            {txt(
              'İnternet bağımlılığı olmadan, anlık senkronizasyonla çalışan, mutfak ve bar yönetimini otomatize eden profesyonel restoran yönetim çözümü.',
              'A professional restaurant management solution that works with instant synchronization and automates kitchen and bar management without internet dependency.',
              'Μια επαγγελματική λύση διαχείρισης εστιατορίων που λειτουργεί με άμεσο συγχρονισμό και αυτοματοποιεί τη διαχείριση κουζίνας και μπαρ χωρίς εξάρτηση από το διαδίκτυο.'
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-amber-600 text-white font-black rounded-2xl hover:bg-amber-700 transition-all text-lg flex items-center justify-center gap-2 shadow-lg shadow-amber-600/15 cursor-pointer"
            >
              {txt('Hemen Başlayın', 'Get Started Now', 'Ξεκινήστε Τώρα')} <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Showcase Visual Section */}
      <section className="py-16 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider">
              {txt('YENİ NESİL AR-GE ALTYAPISI', 'NEW GENERATION R&D INFRASTRUCTURE', 'ΥΠΟΔΟΜΗ R&D ΝΕΑΣ ΓΕΝΙΑΣ')}
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              {txt('Sektörün En Akıllı Restoran Otomasyonu', "The Industry's Smartest Restaurant Automation", 'Η Εξυπνότερη Αυτοματοποίηση Εστιατορίων')}
            </h2>
            <p className="text-slate-600 font-semibold text-sm md:text-base leading-relaxed">
              {txt(
                'HoReCaLP, kesintisiz bir hizmet süreci yürütmeniz için tasarlandı. Dijital el terminalleri, mutfak hazırlık panelleri, adisyon kurgusu ve QR entegrasyonu tek bir merkezde, internet kopmalarından etkilenmeksizin çalışır.',
                'HoReCaLP is designed for a seamless service workflow. Digital handheld terminals, kitchen display systems, bill workflows, and QR integration operate from a single hub, unaffected by internet outages.',
                'Το HoReCaLP έχει σχεδιαστεί για απρόσκοπτη ροή εργασιών σέρβις. Τα ψηφιακά τερματικά, τα συστήματα κουζίνας, οι ροές λογαριασμών και η ενσωμάτωση QR λειτουργούν από έναν κόμβο, ανεπηρέαστα από διακοπές ίντερνετ.'
              )}
            </p>
            <div className="space-y-3">
              {[
                txt(txt("Çevrimdışı (offline-first) kesintisiz çalışma mimarisi", "Offline-first continuous working architecture", "Αρχιτεκτονική συνεχούς λειτουργίας offline-first"), "Offline-first continuous working architecture", "Αρχιτεκτονική συνεχούς λειτουργίας offline-first"),
                txt(txt("Masa ve el terminalleri arasında real-time çift yönlü veri transferi", "Real-time two-way data sync between tables and handheld units", "Αμφίδρομος συγχρονισμός δεδομένων πραγματικού χρόνου"), "Real-time two-way data sync between tables and handheld units", "Αμφίδρομος συγχρονισμός δεδομένων πραγματικού χρόνου"),
                txt(txt("Farklı departmanlara (Mutfak, Bar, Fırın) anlık sipariş yönlendirme", "Instant order routing to different departments (Kitchen, Bar, Oven)", "Άμεση δρομολόγηση παραγγελιών σε διαφορετικά τμήματα (Κουζίνα, Μπαρ)"), "Instant order routing to different departments (Kitchen, Bar, Oven)", "Άμεση δρομολόγηση παραγγελιών σε διαφορετικά τμήματα (Κουζίνα, Μπαρ)")
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
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80" 
                alt="HoReCaLP Restaurant Automation Showcase" 
                referrerPolicy="no-referrer"
                className="w-full h-[320px] md:h-[450px] object-cover rounded-[1.8rem] group-hover:scale-[1.01] transition-transform duration-500"
              />
              <div className="absolute bottom-8 left-8 right-8 z-20 bg-black/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-white">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 mb-2 inline-block">
                  {txt('PREMIUM VİTRİN', 'PREMIUM SHOWCASE', 'PREMIUM SHOWCASE')}
                </span>
                <p className="font-black text-lg md:text-xl mb-1">{txt('Masa Adisyon ve Dijital QR Menü Entegrasyonu', 'Table Bill & Digital QR Menu Integration', 'Ενσωμάτωση Λογαριασμού Τραπεζιού & Ψηφιακού Μενού QR')}</p>
                <p className="text-white/60 text-xs md:text-sm font-semibold">{txt('Gelişmiş restoran POS arayüzü ile adisyonları anlık bölün, masadan siparişleri yönetin.', 'Split bills instantly with an advanced restaurant POS interface, manage orders from the table.', 'Διαχωρίστε τους λογαριασμούς άμεσα με μια προηγμένη διεπαφή POS, διαχειριστείτε τις παραγγελίες από το τραπέζι.')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Showcase Section */}
      <section className="py-20 bg-gradient-to-b from-white to-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-amber-500/10 text-amber-700 rounded-full text-xs font-black tracking-wider uppercase border border-amber-500/10">
              <Tv className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
              {txt('SİSTEMİ CANLI İZLEYİN', 'WATCH LIVE DEMO', 'ΠΑΡΑΚΟΛΟΥΘΗΣΤΕ LIVE')}
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mt-3 mb-4">
              {txt('Uygulamalı Sistem Özellikleri & Video Turu', 'Interactive System Tour & Live Demos', 'Διαδραστική Περιήγηση Συστήματος & Live Demos')}
            </h2>
            <p className="text-slate-500 font-semibold text-sm sm:text-base leading-relaxed">
              {txt(
                'HoReCaLP programının tüm modüllerini ve ekran akışlarını gerçek kullanım senaryoları eşliğinde canlı olarak izleyin.',
                'Watch real usage scenarios and explore how the entire HoReCaLP suite functions in active environments.',
                'Παρακολουθήστε πραγματικά σενάρια χρήσης και εξερευνήστε πώς λειτουργεί ολόκληρη η σουίτα HoReCaLP σε ενεργά περιβάλλοντα.'
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
                          ? 'bg-white border-amber-500/20 shadow-md shadow-amber-500/5'
                          : 'bg-white/50 border-slate-100 hover:bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        isActive ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Tv className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${
                            isActive ? 'text-amber-700' : 'text-slate-400'
                          }`}>
                            {tab.tag}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            tab.isLive 
                              ? 'bg-emerald-550 text-emerald-600 border border-emerald-100' 
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
              <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100/30 flex items-center gap-3">
                <Youtube className="h-5 w-5 text-red-600 shrink-0" />
                <p className="text-xs text-amber-800 font-bold">
                  {txt(
                    'Sistemimizin canlı ekran videoları YouTube kanalımızda düzenli olarak yayınlanmaktadır.',
                    'Our system screen recordings are regularly uploaded to our YouTube channel.',
                    'Τα βίντεο της οθόνης του συστήματός μας ανεβαίνουν τακτικά στο κανάλι μας στο YouTube.'
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
                          {txt("YouTube'da Aç", "Open in YouTube", "YouTube'da Aç")}
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
                          <button className="relative h-14 w-14 sm:h-16 sm:w-16 bg-amber-600 hover:bg-amber-500 hover:scale-105 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300">
                            <Play className="h-6 w-6 sm:h-7 sm:w-7 fill-current ml-1" />
                          </button>
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 p-3 sm:p-4 bg-black/50 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase text-amber-400 tracking-wider">YOUTUBE VIDEO</p>
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
                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 hover:bg-amber-500/20 transition-all whitespace-nowrap"
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
                        <Tv className="h-8 w-8 text-amber-500 animate-pulse" />
                      </div>
                      <h3 className="text-xl font-black">{txt('Hazırlanıyor', 'Coming Soon', 'Σύντομα')}</h3>
                      <p className="text-white/60 text-xs font-semibold leading-relaxed">
                        {txt(
                          `"${videoTabs[activeVideoTab].title}" özelliğinin detaylı ekran videosu şu an hazırlanma aşamasındadır. Çok yakında YouTube kanalımıza yüklenecektir!`,
                          `Detailed screen video for "${videoTabs[activeVideoTab].title}" is being prepared. It will be uploaded to our YouTube channel very soon!`,
                          `Το αναλυτικό βίντεο της οθόνης για τη δυνατότητα "${videoTabs[activeVideoTab].title}" προετοιμάζεται. Θα ανέβει στο κανάλι μας στο YouTube πολύ σύντομα!`
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
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">{txt('Neden HoReCaLP?', 'Why HoReCaLP?', 'Γιατί HoReCaLP;')}</h2>
            <p className="text-slate-500 font-semibold text-sm sm:text-base leading-relaxed">
              {txt(
                'Restoran, bar ve cafelerin operasyonel zorluklarını çözmek, sipariş hızını artırmak ve kaçakları sıfıra indirmek için tasarlandı.',
                'Designed to solve operational challenges for restaurants, bars, and cafes, speed up orders, and eliminate leakages.',
                'Σχεδιασμένο για την επίλυση επιχειρησιακών προκλήσεων για εστιατόρια, μπαρ και καφετέριες, επιτάχυνση παραγγελιών και εξάλειψη απωλειών.'
              )}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                title: txt('Kesintisiz Çevrimdışı Çalışma', 'Continuous Offline Operation', 'Αδιάλειπτη Λειτουργία Εκτός Σύνδεσης'), 
                desc: txt('İnternet bağlantınız kopsa dahi el terminalleriniz sipariş almaya, adisyon açmaya ve yerel ağda haberleşmeye devam eder. Bağlantı geldiğinde otomatik eşitlenir.', 'Even if your internet connection drops, your handheld terminals continue to take orders, open bills, and communicate on the local network. Automatically syncs when connection returns.', 'Ακόμα και αν η σύνδεση στο διαδίκτυο διακοπεί, τα φορητά τερματικά σας συνεχίζουν να λαμβάνουν παραγγελίες, να ανοίγουν λογαριασμούς και να επικοινωνούν στο τοπικό δίκτυο. Συγχρονίζονται αυτόματα όταν η σύνδεση αποκατασταθεί.'),
                icon: WifiOff,
                color: 'text-amber-600 bg-amber-50 border-amber-100/50'
              },
              { 
                title: txt('Anlık Masa Senkronizasyonu', 'Instant Table Sync', 'Άμεσος Συγχρονισμός Τραπεζιού'), 
                desc: txt('Tüm terminaller arasında tam zamanlı çift yönlü veri senkronizasyonu. Garsonların girdiği siparişler kasada ve diğer terminallerde anlık güncellenir.', 'Full-time two-way data synchronization across all terminals. Orders entered by waiters are instantly updated at the cash register and other terminals.', 'Αμφίδρομος συγχρονισμός δεδομένων πραγματικού χρόνου σε όλα τα τερματικά. Οι παραγγελίες που εισάγονται από σερβιτόρους ενημερώνονται άμεσα στο ταμείο και σε άλλα τερματικά.'),
                icon: RefreshCw,
                color: 'text-indigo-600 bg-indigo-50 border-indigo-100/50'
              },
              { 
                title: txt('Gelişmiş Hesap Bölme', 'Advanced Bill Splitting', 'Προηγμένη Διαίρεση Λογαριασμού'), 
                desc: txt('Kişi sayısına göre eşit hesap bölme veya seçilen spesifik ürün kalemlerine göre parça parça ödeme alma imkanı (Nakit, Kredi Kartı ve Karma).', 'Possibility of equal bill splitting by number of people or partial payments based on selected specific products (Cash, Credit Card, and Mixed).', 'Δυνατότητα ισότιμης διαίρεσης λογαριασμού ανάλογα με τον αριθμό των ατόμων ή μερικών πληρωμών βάσει επιλεγμένων προϊόντων (Μετρητά, Πιστωτική Κάρτα και Μικτά).'),
                icon: Receipt,
                color: 'text-emerald-600 bg-emerald-50 border-emerald-100/50'
              },
              { 
                title: txt('Zengin QR Menü & Sipariş', 'Rich QR Menu & Ordering', 'Πλούσιο Μενού QR & Παραγγελίες'), 
                desc: txt('Müşterilerinizin masadaki kodu okutarak porsiyon, alerjen detaylarını görmesini ve doğrudan masadan interaktif sipariş vermesini sağlayın.', 'Allow your customers to scan the code at the table to see portions and allergen details, and place interactive orders directly from the table.', 'Επιτρέψτε στους πελάτες σας να σαρώσουν τον κωδικό στο τραπέζι για να δουν λεπτομέρειες για μερίδες και αλλεργιογόνα, και να κάνουν διαδραστικές παραγγελίες απευθείας από το τραπέζι.'),
                icon: QrCode,
                color: 'text-rose-600 bg-rose-50 border-rose-100/50'
              },
              { 
                title: txt('Akıllı Reçete & Stok Takibi', 'Smart Recipe & Stock Tracking', 'Έξυπνη Συνταγή & Παρακολούθηση Αποθεμάτων'), 
                desc: txt('Her yemek ve kokteyl için milimetrik reçeteler (BOM) oluşturun. Satış yapıldıkça un, yağ, et gibi hammaddeler depodan otomatik düşsün.', 'Create millimeter-precise recipes (BOM) for each dish and cocktail. As sales are made, raw materials like flour, oil, and meat are automatically deducted from stock.', 'Δημιουργήστε συνταγές ακριβείας (BOM) για κάθε πιάτο και κοκτέιλ. Καθώς πραγματοποιούνται πωλήσεις, πρώτες ύλες όπως αλεύρι, λάδι και κρέας αφαιρούνται αυτόματα από το απόθεμα.'),
                icon: Layers,
                color: 'text-blue-600 bg-blue-50 border-blue-100/50'
              },
              { 
                title: txt('Süreli Happy Hour tarifesi', 'Timed Happy Hour Tariff', 'Προγραμματισμένη Χρέωση Happy Hour'), 
                desc: txt('Haftanın belirli günlerinde ve saat aralıklarında otomatik devreye giren özel indirim tarifeleri ve Happy Hour kuralları tanımlayın.', 'Define special discount tariffs and Happy Hour rules that automatically activate on specific days and time intervals of the week.', 'Ορίστε ειδικά τιμολόγια εκπτώσεων και κανόνες Happy Hour που ενεργοποιούνται αυτόματα σε συγκεκριμένες ημέρες και χρονικά διαστήματα της εβδομάδας.'),
                icon: Clock,
                color: 'text-violet-600 bg-violet-50 border-violet-100/50'
              },
              { 
                title: txt('Akıllı Sipariş Yönlendirme', 'Smart Order Routing', 'Έξυπνη Δρομολόγηση Παραγγελιών'), 
                desc: txt('Onaylanan adisyondaki yemek siparişleri anında mutfak ekranına, içecekler ise bar yazıcısına departman bazlı ayrılarak saniyeler içinde iletilir.', 'Food orders in the approved bill are instantly routed to the kitchen screen, and drinks to the bar printer, split by department in seconds.', 'Οι παραγγελίες φαγητού στον εγκεκριμένο λογαριασμό δρομολογούνται άμεσα στην οθόνη της κουζίνας και τα ποτά στον εκτυπωτή μπαρ, διαχωρισμένα ανά τμήμα σε δευτερόλεπτα.'),
                icon: Send,
                color: 'text-cyan-600 bg-cyan-50 border-cyan-100/50'
              },
              { 
                title: txt('Güvenlik & Rol Kısıtlamaları', 'Security & Role Restrictions', 'Ασφάλεια & Περιορισμοί Ρόλων'), 
                desc: txt('İptal, ikram, iskonto ve iade işlemlerini yönetici onayına bağlayın. Personelin sadece iş yeri Wi-Fi ağından sisteme erişebilmesini sağlayın.', 'Bind cancellation, treats, discount, and return processes to manager approval. Ensure staff can only access the system from the workplace Wi-Fi network.', 'Συνδέστε τις διαδικασίες ακύρωσης, κερασμάτων, εκπτώσεων και επιστροφών με την έγκριση του διευθυντή. Διασφαλίστε ότι το προσωπικό μπορεί να έχει πρόσβαση στο σύστημα μόνο από το Wi-Fi του καταστήματος.'),
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
          <h2 className="text-3xl font-black text-center mb-12">{txt('Sıkça Sorulan Sorular', 'Frequently Asked Questions', 'Συχνές Ερωτήσεις')}</h2>
          <div className="space-y-3">
            {localizedFaq.filter(item => item.status === 'active').map((item) => {
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
