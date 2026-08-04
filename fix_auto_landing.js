const fs = require('fs');

let content = fs.readFileSync('src/pages/AutoLanding.tsx', 'utf8');

// Hero section
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
content = content.replace(
  `"Sterlin (GBP), EUR ve USD bazlı çoklu para birimi motoru",
                "Gümrükleme, seyrüsefer ve koçan devir tarihlerine özel alarmlar",
                "Tek tıkla araç özelliklerini içeren PDF katalog ve broşür çıktısı"`,
  `txt("Sterlin (GBP), EUR ve USD bazlı çoklu para birimi motoru", "Multi-currency engine based on Sterling (GBP), EUR, and USD", "Μηχανή πολλαπλών νομισμάτων με βάση Στερλίνα (GBP), EUR και USD"),
                txt("Gümrükleme, seyrüsefer ve koçan devir tarihlerine özel alarmlar", "Special alarms for customs clearance, navigation, and logbook transfer dates", "Ειδικοί συναγερμοί για εκτελωνισμό, πλοήγηση και ημερομηνίες μεταβίβασης βιβλίου καταγραφής"),
                txt("Tek tıkla araç özelliklerini içeren PDF katalog ve broşür çıktısı", "One-click PDF catalog and brochure output containing vehicle features", "Παραγωγή καταλόγου και φυλλαδίου PDF με ένα κλικ που περιέχει τα χαρακτηριστικά του οχήματος")`
);

content = content.replace(
  'OTO GALERİ VİTRİN',
  `{txt('OTO GALERİ VİTRİN', 'AUTO GALLERY SHOWCASE', 'ΒΙΤΡΙΝΑ ΓΚΑΛΕΡΙ ΑΥΤΟΚΙΝΗΤΩΝ')}`
);
content = content.replace(
  'Dinamik Kur ve Portföy Senkronizasyonu',
  `{txt('Dinamik Kur ve Portföy Senkronizasyonu', 'Dynamic Exchange Rate and Portfolio Synchronization', 'Δυναμική Συναλλαγματική Ισοτιμία και Συγχρονισμός Χαρτοφυλακίου')}`
);
content = content.replace(
  'Araçlarınızı anlık Merkez Bankası döviz kurları ile eşitleyerek web sitenizde hatasız fiyatlandırın.',
  `{txt('Araçlarınızı anlık Merkez Bankası döviz kurları ile eşitleyerek web sitenizde hatasız fiyatlandırın.', 'Price your vehicles accurately on your website by synchronizing them with real-time Central Bank exchange rates.', 'Τιμολογήστε τα οχήματά σας με ακρίβεια στον ιστότοπό σας συγχρονίζοντάς τα με τις συναλλαγματικές ισοτιμίες της Κεντρικής Τράπεζας σε πραγματικό χρόνο.')}`
);

// Feature Highlights Section
content = content.replace(
  'Galeriniz İçin En Gelişmiş Özellikler',
  `{txt('Galeriniz İçin En Gelişmiş Özellikler', 'Most Advanced Features for Your Gallery', 'Τα πιο προηγμένα χαρακτηριστικά για τη γκαλερί σας')}`
);
content = content.replace(
  'AutoLP, geleneksel verimsiz yöntemleri geride bırakarak tamamen küresel galeri standartlarına göre inşa edilmiştir.',
  `{txt('AutoLP, geleneksel verimsiz yöntemleri geride bırakarak tamamen küresel galeri standartlarına göre inşa edilmiştir.', 'AutoLP is built entirely according to global gallery standards, leaving behind traditional inefficient methods.', 'Το AutoLP είναι κατασκευασμένο εξ ολοκλήρου σύμφωνα με τα παγκόσμια πρότυπα γκαλερί, αφήνοντας πίσω παραδοσιακές αναποτελεσματικές μεθόδους.')}`
);

fs.writeFileSync('src/pages/AutoLanding.tsx', content);
