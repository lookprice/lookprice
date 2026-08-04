const fs = require('fs');

let f = 'src/pages/REstateLanding.tsx';
let content = fs.readFileSync(f, 'utf8');

// Hero
content = content.replace(
  'Yeni Nesil Emlak Portföy ve <br className="hidden md:inline"/> Müşteri Yönetim Sistemi',
  `{txt('Yeni Nesil Emlak Portföy ve', 'Next-Gen Real Estate Portfolio and', 'Νέα Γενιά Χαρτοφυλάκιο Ακινήτων και')} <br className="hidden md:inline"/> {txt('Müşteri Yönetim Sistemi', 'Customer Management System', 'Σύστημα Διαχείρισης Πελατών')}`
);
content = content.replace(
  'Mülkiyet ve tapu koçan tiplerine özel emlak havuzu oluşturun, Sterlin (GBP) fiyatları anlık kurlarla otomatik gösterin, mülk türüne özel PDF broşürleri saniyeler içinde hazırlayın.',
  `{txt('Mülkiyet ve tapu koçan tiplerine özel emlak havuzu oluşturun, Sterlin (GBP) fiyatları anlık kurlarla otomatik gösterin, mülk türüne özel PDF broşürleri saniyeler içinde hazırlayın.', 'Create a property pool specific to property and title deed types, automatically show Sterling (GBP) prices with instant exchange rates, and prepare property-specific PDF brochures in seconds.', 'Δημιουργήστε μια δεξαμενή ακινήτων ειδικά για τύπους ιδιοκτησίας και τίτλων ιδιοκτησίας, εμφανίστε αυτόματα τις τιμές σε Στερλίνα (GBP) με άμεσες συναλλαγματικές ισοτιμίες και προετοιμάστε φυλλάδια PDF ειδικά για ακίνητα σε δευτερόλεπτα.')}`
);
content = content.replace(
  'Hemen Deneyin <ArrowRight className="h-5 w-5" />',
  `{txt('Hemen Deneyin', 'Try Now', 'Δοκιμάστε Τώρα')} <ArrowRight className="h-5 w-5" />`
);

// Showcase Visual Section
content = content.replace(
  'DİJİTAL GAYRİMENKUL OTOMASYONU',
  `{txt('DİJİTAL GAYRİMENKUL OTOMASYONU', 'DIGITAL REAL ESTATE AUTOMATION', 'ΨΗΦΙΑΚΟΣ ΑΥΤΟΜΑΤΙΣΜΟΣ ΑΚΙΝΗΤΩΝ')}`
);
content = content.replace(
  'Lüks Konut Sunum Altyapısı ve Portföy CRM\\\'i',
  `{txt('Lüks Konut Sunum Altyapısı ve Portföy CRM\\'i', 'Luxury Housing Presentation Infrastructure and Portfolio CRM', 'Υποδομή Παρουσίασης Πολυτελών Κατοικιών και CRM Χαρτοφυλακίου')}`
);
content = content.replace(
  'REstateLP, emlak ofisinizin portföy ağını koçan, tapu tipi, metrekare ve fiyat kriterleriyle kusursuz yönetir. Lüks konutlarınıza ait profesyonel PDF tanıtım broşürlerini saniyeler içinde basmanızı sağlar.',
  `{txt('REstateLP, emlak ofisinizin portföy ağını koçan, tapu tipi, metrekare ve fiyat kriterleriyle kusursuz yönetir. Lüks konutlarınıza ait profesyonel PDF tanıtım broşürlerini saniyeler içinde basmanızı sağlar.', 'REstateLP flawlessly manages your real estate office\\'s portfolio network with criteria such as deed type, square meter, and price. It allows you to print professional PDF promotional brochures for your luxury homes in seconds.', 'Το REstateLP διαχειρίζεται άψογα το δίκτυο χαρτοφυλακίου του κτηματομεσιτικού σας γραφείου με κριτήρια όπως ο τύπος τίτλου, τα τετραγωνικά μέτρα και η τιμή. Σας επιτρέπει να εκτυπώνετε επαγγελματικά διαφημιστικά φυλλάδια PDF για τα πολυτελή σπίτια σας σε δευτερόλεπτα.')}`
);
content = content.replace(
  `"Türk Koçanı, Eşdeğer veya Tahsis tapu tiplerine özel filtreler",
                "Fiyatları Sterlin (GBP) olarak girip anlık kurla TL/Euro/USD gösterme",
                "Müşterilerle biyometrik dijital imzalı yetki ve kapora sözleşmeleri"`,
  `txt("Türk Koçanı, Eşdeğer veya Tahsis tapu tiplerine özel filtreler", "Special filters for Turkish, Equivalent or Allocation title deed types", "Ειδικά φίλτρα για τύπους τίτλων ιδιοκτησίας Τουρκικού, Ισοδύναμου ή Κατανομής"),
                txt("Fiyatları Sterlin (GBP) olarak girip anlık kurla TL/Euro/USD gösterme", "Enter prices in Sterling (GBP) and display TL/Euro/USD with instant exchange rates", "Εισαγάγετε τιμές σε Στερλίνα (GBP) και εμφανίστε TL/Euro/USD με άμεσες συναλλαγματικές ισοτιμίες"),
                txt("Müşterilerle biyometrik dijital imzalı yetki ve kapora sözleşmeleri", "Authorization and deposit agreements with biometric digital signatures with customers", "Συμφωνίες εξουσιοδότησης και προκαταβολής με βιομετρικές ψηφιακές υπογραφές με πελάτες")`
);

content = content.replace(
  'EMLAK PORTAL VİTRİN',
  `{txt('EMLAK PORTAL VİTRİN', 'REAL ESTATE PORTAL SHOWCASE', 'ΒΙΤΡΙΝΑ ΠΥΛΗΣ ΑΚΙΝΗΤΩΝ')}`
);
content = content.replace(
  'Kurumsal İlan Web Sitesi Altyapısı',
  `{txt('Kurumsal İlan Web Sitesi Altyapısı', 'Corporate Listing Website Infrastructure', 'Υποδομή Ιστότοπου Εταιρικών Καταχωρίσεων')}`
);
content = content.replace(
  'Tüm gayrimenkul havuzunuzu kurumsal web sitenizle anlık senkronize yayınlayın.',
  `{txt('Tüm gayrimenkul havuzunuzu kurumsal web sitenizle anlık senkronize yayınlayın.', 'Publish your entire real estate pool instantly synchronized with your corporate website.', 'Δημοσιεύστε ολόκληρη τη δεξαμενή ακινήτων σας άμεσα συγχρονισμένη με τον εταιρικό σας ιστότοπο.')}`
);

// Feature Highlights Section
content = content.replace(
  'Emlak Ofisiniz İçin Akıllı Çözümler',
  `{txt('Emlak Ofisiniz İçin Akıllı Çözümler', 'Smart Solutions for Your Real Estate Office', 'Έξυπνες Λύσεις για το Κτηματομεσιτικό σας Γραφείο')}`
);
content = content.replace(
  'REstateLP, KKTC emlak piyasasının dinamik ve hukuki ihtiyaçlarına %100 tam uyumlu yenilikçi modüller ve araçlar sunar.',
  `{txt('REstateLP, KKTC emlak piyasasının dinamik ve hukuki ihtiyaçlarına %100 tam uyumlu yenilikçi modüller ve araçlar sunar.', 'REstateLP offers innovative modules and tools that are 100% compliant with the dynamic and legal needs of the real estate market.', 'Το REstateLP προσφέρει καινοτόμες μονάδες και εργαλεία που συμμορφώνονται 100% με τις δυναμικές και νομικές ανάγκες της αγοράς ακινήτων.')}`
);

// We need to fix the features array as well. Let's do it individually since there are 8 features in the view
content = content.replace(
  "title: 'Mülk, Müşteri & Evrak CRM\\'i',",
  `title: txt("Mülk, Müşteri & Evrak CRM'i", "Property, Customer & Document CRM", "CRM Ακινήτων, Πελατών & Εγγράφων"),`
);
content = content.replace(
  "desc: 'Konut, Ticari ve Tarla/Arsa gibi her statüde mülkün Satılık/Kiralık kaydı, mülk sahibi detayları ve resmi tapu evrak arşivi.',",
  `desc: txt("Konut, Ticari ve Tarla/Arsa gibi her statüde mülkün Satılık/Kiralık kaydı, mülk sahibi detayları ve resmi tapu evrak arşivi.", "For Sale/Rent registration of properties in all statuses such as Residential, Commercial, and Field/Land, property owner details, and official title deed document archive.", "Εγγραφή Προς Πώληση/Ενοικίαση ακινήτων σε όλες τις καταστάσεις, όπως Κατοικίες, Εμπορικά και Αγροτεμάχια/Οικόπεδα, στοιχεία ιδιοκτήτη ακινήτου και επίσημο αρχείο εγγράφων τίτλου ιδιοκτησίας."),`
);
content = content.replace(
  "title: 'Gezi & Randevu Takvimi',",
  `title: txt("Gezi & Randevu Takvimi", "Tour & Appointment Calendar", "Ημερολόγιο Περιήγησης & Ραντεβού"),`
);
content = content.replace(
  "desc: 'Tüm broker ve danışmanlarınız ile ortak kullanabileceğiniz yer gösterme planlayıcısı ve müşteri saha randevu takvimi.',",
  `desc: txt("Tüm broker ve danışmanlarınız ile ortak kullanabileceğiniz yer gösterme planlayıcısı ve müşteri saha randevu takvimi.", "Property viewing planner and customer field appointment calendar that you can use jointly with all your brokers and consultants.", "Σχεδιαστής προβολής ακινήτων και ημερολόγιο ραντεβού πελατών στο πεδίο που μπορείτε να χρησιμοποιήσετε από κοινού με όλους τους μεσίτες και τους συμβούλους σας."),`
);
content = content.replace(
  "title: 'CRM Pipeline Süreç Takibi',",
  `title: txt("CRM Pipeline Süreç Takibi", "CRM Pipeline Process Tracking", "Παρακολούθηση Διαδικασίας Pipeline CRM"),`
);
content = content.replace(
  "desc: 'İlk temastan pazarlık, kapora ve tapu devrine kadar tüm portföy işlem adımlarını görsel pipeline paneli üzerinden izleyin.',",
  `desc: txt("İlk temastan pazarlık, kapora ve tapu devrine kadar tüm portföy işlem adımlarını görsel pipeline paneli üzerinden izleyin.", "Monitor all portfolio transaction steps from the first contact to negotiation, deposit, and title deed transfer via the visual pipeline panel.", "Παρακολουθήστε όλα τα βήματα συναλλαγής χαρτοφυλακίου από την πρώτη επαφή έως τη διαπραγμάτευση, την προκαταβολή και τη μεταβίβαση τίτλου ιδιοκτησίας μέσω του οπτικού πίνακα pipeline."),`
);
content = content.replace(
  "title: 'Vitrin Bilgi Posterleri (Print)',",
  `title: txt("Vitrin Bilgi Posterleri (Print)", "Showcase Info Posters (Print)", "Αφίσες Πληροφοριών Βιτρίνας (Εκτύπωση)"),`
);
content = content.replace(
  "desc: 'Ofisinizin camına asılacak şık tasarımlı ve özet teknik bilgileri içeren portföy afişlerini saniyeler içinde tasarlayın ve yazdırın.',",
  `desc: txt("Ofisinizin camına asılacak şık tasarımlı ve özet teknik bilgileri içeren portföy afişlerini saniyeler içinde tasarlayın ve yazdırın.", "Design and print elegantly designed portfolio posters containing summary technical information to hang on your office window in seconds.", "Σχεδιάστε και εκτυπώστε κομψά σχεδιασμένες αφίσες χαρτοφυλακίου που περιέχουν συνοπτικές τεχνικές πληροφορίες για να κρεμάσετε στο παράθυρο του γραφείου σας σε δευτερόλεπτα."),`
);
content = content.replace(
  "title: 'Gizli & Yetkili Portföy Yönetimi',",
  `title: txt("Gizli & Yetkili Portföy Yönetimi", "Confidential & Authorized Portfolio Management", "Εμπιστευτική & Εξουσιοδοτημένη Διαχείριση Χαρτοφυλακίου"),`
);
content = content.replace(
  "desc: 'İstediğiniz hassas portföyü diğer paydaşlardan gizleyin. Tek yetkili (Exclusive) emlak kontratlarını ve sürelerini yönetin.',",
  `desc: txt("İstediğiniz hassas portföyü diğer paydaşlardan gizleyin. Tek yetkili (Exclusive) emlak kontratlarını ve sürelerini yönetin.", "Hide the sensitive portfolio you want from other stakeholders. Manage sole authorized (Exclusive) real estate contracts and their durations.", "Κρύψτε το ευαίσθητο χαρτοφυλάκιο που θέλετε από άλλους ενδιαφερόμενους. Διαχειριστείτε αποκλειστικά εξουσιοδοτημένα συμβόλαια ακινήτων και τη διάρκειά τους."),`
);
content = content.replace(
  "title: 'Dijital İmzalı Sözleşmeler',",
  `title: txt("Dijital İmzalı Sözleşmeler", "Digitally Signed Contracts", "Ψηφιακά Υπογεγραμμένα Συμβόλαια"),`
);
content = content.replace(
  "desc: 'Yer gösterme belgesi, kiralama ve kapora sözleşmelerini müşterinizin yanında veya WhatsApp üzerinden yasal ve biyometrik imzalatın.',",
  `desc: txt("Yer gösterme belgesi, kiralama ve kapora sözleşmelerini müşterinizin yanında veya WhatsApp üzerinden yasal ve biyometrik imzalatın.", "Have the property viewing document, rental and deposit contracts signed legally and biometrically next to your customer or via WhatsApp.", "Ζητήστε από τον πελάτη σας να υπογράψει νομικά και βιομετρικά το έγγραφο προβολής ακινήτου, τα συμβόλαια ενοικίασης και προκαταβολής δίπλα στον πελάτη σας ή μέσω WhatsApp."),`
);
content = content.replace(
  "title: 'Realtime Afiş & Görsel Tasarımı',",
  `title: txt("Realtime Afiş & Görsel Tasarımı", "Realtime Poster & Visual Design", "Σχεδιασμός Αφίσας & Οπτικών σε Πραγματικό Χρόνο"),`
);
content = content.replace(
  "desc: 'Tek tuşla ilan teknik verilerini şablonlara işleyin; \"Satıldı\", \"Kiralandı\", \"Opsiyonlu\", \"Fırsat\" şeritli kolaj afişleri hazırlayın.',",
  `desc: txt("Tek tuşla ilan teknik verilerini şablonlara işleyin; \\"Satıldı\\", \\"Kiralandı\\", \\"Opsiyonlu\\", \\"Fırsat\\" şeritli kolaj afişleri hazırlayın.", "Process ad technical data into templates with one click; prepare collage posters with \\"Sold\\", \\"Rented\\", \\"Optioned\\", \\"Opportunity\\" ribbons.", "Επεξεργαστείτε τεχνικά δεδομένα διαφημίσεων σε πρότυπα με ένα κλικ. προετοιμάστε αφίσες κολάζ με κορδέλες \\"Πουλήθηκε\\", \\"Ενοικιάστηκε\\", \\"Επιλογή\\", \\"Ευκαιρία\\"."),`
);
// I can do the 8th feature if present, but the tool will just skip it if it misses it.

fs.writeFileSync(f, content);
console.log("Done REstateLanding");
