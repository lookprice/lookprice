const fs = require('fs');

function translate(file, search, replace) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(search, replace);
  fs.writeFileSync(file, content);
}

// AutoLanding.tsx
let f = 'src/pages/AutoLanding.tsx';
let content = fs.readFileSync(f, 'utf8');

// Hero
content = content.replace(
  'Yeni Nesil Galeri ve Araç <br className="hidden md:inline"/> Portföy Yönetim Sistemi',
  `{txt('Yeni Nesil Galeri ve Araç', 'Next-Gen Gallery and Vehicle', 'Νέα Γενιά Γκαλερί και Όχημα')} <br className="hidden md:inline"/> {txt('Portföy Yönetim Sistemi', 'Portfolio Management System', 'Σύστημα Διαχείρισης Χαρτοφυλακίου')}`
);
content = content.replace(
  'Araç stoklarınızı Sterlin (GBP) veya döviz bazlı yönetin, tek tuşla profesyonel PDF broşürleri basın ve galeriniz için harika bir dijital vitrin oluşturun.',
  `{txt('Araç stoklarınızı Sterlin (GBP) veya döviz bazlı yönetin, tek tuşla profesyonel PDF broşürleri basın ve galeriniz için harika bir dijital vitrin oluşturun.', 'Manage your vehicle stocks in Sterling (GBP) or foreign currency, print professional PDF brochures with a single click, and create a fantastic digital showcase for your gallery.', 'Διαχειριστείτε τα αποθέματα των οχημάτων σας σε στερλίνα (GBP) ή σε ξένο νόμισμα, εκτυπώστε επαγγελματικά φυλλάδια PDF με ένα μόνο κλικ και δημιουργήστε μια φανταστική ψηφιακή βιτρίνα για τη γκαλερί σας.')}`
);
content = content.replace(
  'Ücretsiz Deneyin <ArrowRight className="h-5 w-5" />',
  `{txt('Ücretsiz Deneyin', 'Try for Free', 'Δοκιμάστε Δωρεάν')} <ArrowRight className="h-5 w-5" />`
);

// Showcase Visual Section
content = content.replace(
  'DİJİTAL OTO GALERİ ÇÖZÜMLERİ',
  `{txt('DİJİTAL OTO GALERİ ÇÖZÜMLERİ', 'DIGITAL AUTO GALLERY SOLUTIONS', 'ΨΗΦΙΑΚΕΣ ΛΥΣΕΙΣ ΓΚΑΛΕΡΙ ΑΥΤΟΚΙΝΗΤΩΝ')}`
);
content = content.replace(
  'Gelişmiş Araç Envanteri ve Satış Yönetimi',
  `{txt('Gelişmiş Araç Envanteri ve Satış Yönetimi', 'Advanced Vehicle Inventory and Sales Management', 'Προηγμένο Απόθεμα Οχημάτων και Διαχείριση Πωλήσεων')}`
);
content = content.replace(
  'AutoLP, araç stok takibinden gümrükleme, seyrüsefer ve plaka süreçlerine kadar galerinizin ihtiyaç duyduğu tüm takip adımlarını bir araya getirir. Döviz kurları ile entegre fiyalandırma motoru her zaman güncel kalmanızı sağlar.',
  `{txt('AutoLP, araç stok takibinden gümrükleme, seyrüsefer ve plaka süreçlerine kadar galerinizin ihtiyaç duyduğu tüm takip adımlarını bir araya getirir. Döviz kurları ile entegre fiyalandırma motoru her zaman güncel kalmanızı sağlar.', 'AutoLP brings together all the tracking steps your gallery needs, from vehicle stock tracking to customs, navigation, and license plate processes. The integrated pricing engine with exchange rates keeps you always up to date.', 'Το AutoLP συγκεντρώνει όλα τα βήματα παρακολούθησης που χρειάζεται η γκαλερί σας, από την παρακολούθηση αποθέματος οχημάτων έως τις διαδικασίες εκτελωνισμού, πλοήγησης και πινακίδων κυκλοφορίας. Ο ενσωματωμένος μηχανισμός τιμολόγησης με τις συναλλαγματικές ισοτιμίες σας κρατά πάντα ενημερωμένους.')}`
);

// Check features
content = content.replace(
  'title: "SEO Dostu & Hazır Meta",',
  `title: txt("SEO Dostu & Hazır Meta", "SEO Friendly & Ready Meta", "Φιλικό προς το SEO & Έτοιμο Meta"),`
);
content = content.replace(
  'desc: "Google hesaplarını ve reklam piksellerini kolayca tanımlayarak PR ve pazarlama kampanyalarınızı anında optimize edin."',
  `desc: txt("Google hesaplarını ve reklam piksellerini kolayca tanımlayarak PR ve pazarlama kampanyalarınızı anında optimize edin.", "Easily define Google accounts and ad pixels to optimize your PR and marketing campaigns instantly.", "Ορίστε εύκολα λογαριασμούς Google και pixel διαφημίσεων για να βελτιστοποιήσετε τις καμπάνιες PR και μάρκετινγκ άμεσα.")`
);
content = content.replace(
  'title: "Gerçek Zamanlı Karar Analitiği",',
  `title: txt("Gerçek Zamanlı Karar Analitiği", "Real-Time Decision Analytics", "Αναλυτικά Στοιχεία Απόφασης σε Πραγματικό Χρόνο"),`
);
content = content.replace(
  'desc: "Yöneticiler için anlık raporlama sunan, işletmenizin tüm finansal durumunu özetleyen dinamik dashboard ekranı."',
  `desc: txt("Yöneticiler için anlık raporlama sunan, işletmenizin tüm finansal durumunu özetleyen dinamik dashboard ekranı.", "Dynamic dashboard screen that provides instant reporting for managers and summarizes the entire financial status of your business.", "Δυναμική οθόνη πίνακα ελέγχου που παρέχει άμεση αναφορά για διευθυντές και συνοψίζει ολόκληρη την οικονομική κατάσταση της επιχείρησής σας.")`
);
content = content.replace(
  'title: "Sektörel Radar Takip Sistemi",',
  `title: txt("Sektörel Radar Takip Sistemi", "Sectoral Radar Tracking System", "Τομεακό Σύστημα Παρακολούθησης Ραντάρ"),`
);
content = content.replace(
  'desc: "Belirleyeceğiniz anahtar kelimelere göre internetteki en yeni piyasa fırsatlarını ve araç haberlerini yakalayan radar."',
  `desc: txt("Belirleyeceğiniz anahtar kelimelere göre internetteki en yeni piyasa fırsatlarını ve araç haberlerini yakalayan radar.", "Radar that captures the latest market opportunities and vehicle news on the internet according to the keywords you specify.", "Ραντάρ που καταγράφει τις πιο πρόσφατες ευκαιρίες αγοράς και ειδήσεις οχημάτων στο διαδίκτυο σύμφωνα με τις λέξεις-κλειδιά που καθορίζετε.")`
);
content = content.replace(
  'title: "Otomatik Döviz & Finansman",',
  `title: txt("Otomatik Döviz & Finansman", "Automatic Currency & Financing", "Αυτόματο Νόμισμα & Χρηματοδότηση"),`
);
content = content.replace(
  'desc: "Otomatik Merkez Bankası döviz kur eşitlemesi, harita yol tarifleri, kredi hesaplama motoru ve kullanıcı işlem denetim kayıtları."',
  `desc: txt("Otomatik Merkez Bankası döviz kur eşitlemesi, harita yol tarifleri, kredi hesaplama motoru ve kullanıcı işlem denetim kayıtları.", "Automatic Central Bank exchange rate equalization, map directions, loan calculation engine, and user transaction audit logs.", "Αυτόματη εξίσωση συναλλαγματικής ισοτιμίας της Κεντρικής Τράπεζας, οδηγίες χάρτη, μηχανή υπολογισμού δανείου και αρχεία ελέγχου συναλλαγών χρηστών.")`
);

fs.writeFileSync(f, content);
console.log("Done AutoLanding");
