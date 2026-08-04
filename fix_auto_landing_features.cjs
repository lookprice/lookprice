const fs = require('fs');

let f = 'src/pages/AutoLanding.tsx';
let content = fs.readFileSync(f, 'utf8');

// Features
content = content.replace(
  "title: 'Gelişmiş Filo Yönetimi',",
  `title: txt("Gelişmiş Filo Yönetimi", "Advanced Fleet Management", "Προηγμένη Διαχείριση Στόλου"),`
);
content = content.replace(
  "desc: 'Araçlarınızın Sürücü, Km, Servis/Bakım geçmişi, Lastik değişimleri, Zimmet, Kaza Raporları ve Tüm Resmi Evraklarına dijital ortamda ulaşın.',",
  `desc: txt("Araçlarınızın Sürücü, Km, Servis/Bakım geçmişi, Lastik değişimleri, Zimmet, Kaza Raporları ve Tüm Resmi Evraklarına dijital ortamda ulaşın.", "Access your vehicles' Driver, Mileage, Service/Maintenance history, Tire changes, Assignment, Accident Reports, and All Official Documents digitally.", "Αποκτήστε ψηφιακή πρόσβαση στο ιστορικό Οδηγού, Χιλιομετρικής απόστασης, Σέρβις/Συντήρησης, Αλλαγών ελαστικών, Ανάθεσης, Αναφορών ατυχημάτων και Όλων των Επίσημων Εγγράφων των οχημάτων σας."),`
);
content = content.replace(
  "title: 'Dijital İmzalı Sözleşmeler',",
  `title: txt("Dijital İmzalı Sözleşmeler", "Digitally Signed Contracts", "Ψηφιακά Υπογεγραμμένα Συμβόλαια"),`
);
content = content.replace(
  "desc: 'Araç Satış ve Konsinye Sözleşmelerini müşterinizin yanında veya WhatsApp üzerinden yasal olarak anında imzalayıp güvenle saklayın.',",
  `desc: txt("Araç Satış ve Konsinye Sözleşmelerini müşterinizin yanında veya WhatsApp üzerinden yasal olarak anında imzalayıp güvenle saklayın.", "Instantly and legally sign Vehicle Sales and Consignment Contracts next to your customer or via WhatsApp and store them safely.", "Υπογράψτε άμεσα και νόμιμα Συμβάσεις Πώλησης και Αποστολής Οχημάτων δίπλα στον πελάτη σας ή μέσω WhatsApp και αποθηκεύστε τις με ασφάλεια."),`
);
content = content.replace(
  "title: 'Realtime Afiş & Görsel Tasarımı',",
  `title: txt("Realtime Afiş & Görsel Tasarımı", "Realtime Poster & Visual Design", "Σχεδιασμός Αφίσας & Οπτικών σε Πραγματικό Χρόνο"),`
);
content = content.replace(
  "desc: 'Tek resim veya kolaj sosyal medya görselleri üretir. Satılan araçlar için \"Satıldı\", \"Opsiyonlu\", \"Fırsat\" şeritli afişler hazırlar.',",
  `desc: txt("Tek resim veya kolaj sosyal medya görselleri üretir. Satılan araçlar için \\"Satıldı\\", \\"Opsiyonlu\\", \\"Fırsat\\" şeritli afişler hazırlar.", "Produces single image or collage social media visuals. Prepares posters with \\"Sold\\", \\"Optioned\\", \\"Opportunity\\" ribbons for sold vehicles.", "Παράγει γραφικά μέσων κοινωνικής δικτύωσης μεμονωμένης εικόνας ή κολάζ. Προετοιμάζει αφίσες με κορδέλες \\"Πουλήθηκε\\", \\"Επιλογή\\", \\"Ευκαιρία\\" για πουλημένα οχήματα."),`
);
content = content.replace(
  "title: 'Instagram Otomatik Paylaşımı',",
  `title: txt("Instagram Otomatik Paylaşımı", "Instagram Automatic Sharing", "Αυτόματη κοινοποίηση στο Instagram"),`
);
content = content.replace(
  "desc: 'Eklenen her araç anında enrakipsiz.com ve kendi hesaplarınızda otomatik paylaşılır; fiyat değişimlerinde otomatik güncellenir.',",
  `desc: txt("Eklenen her araç anında enrakipsiz.com ve kendi hesaplarınızda otomatik paylaşılır; fiyat değişimlerinde otomatik güncellenir.", "Every added vehicle is instantly shared automatically on enrakipsiz.com and your own accounts; updated automatically on price changes.", "Κάθε όχημα που προστίθεται κοινοποιείται αυτόματα στο enrakipsiz.com και στους δικούς σας λογαριασμούς. ενημερώνεται αυτόματα στις αλλαγές τιμών."),`
);
content = content.replace(
  "title: 'Sürükle-Bırak Web Site Sihirbazı',",
  `title: txt("Sürükle-Bırak Web Site Sihirbazı", "Drag-and-Drop Website Wizard", "Οδηγός ιστότοπου μεταφοράς και απόθεσης"),`
);
content = content.replace(
  "desc: 'Size özel hazır kurumsal web siteniz saniyeler içinde otomatik kurulur, dilediğiniz gibi sürükle-bırak özelleştirebilirsiniz.',",
  `desc: txt("Size özel hazır kurumsal web siteniz saniyeler içinde otomatik kurulur, dilediğiniz gibi sürükle-bırak özelleştirebilirsiniz.", "Your custom ready-made corporate website is automatically installed in seconds, you can customize it with drag-and-drop as you wish.", "Ο προσαρμοσμένος έτοιμος εταιρικός ιστότοπός σας εγκαθίσταται αυτόματα σε δευτερόλεπτα, μπορείτε να τον προσαρμόσετε με μεταφορά και απόθεση όπως επιθυμείτε."),`
);
content = content.replace(
  "title: 'Otomatik Alıcı Dağıtım Ağı',",
  `title: txt("Otomatik Alıcı Dağıtım Ağı", "Automatic Buyer Distribution Network", "Αυτόματο Δίκτυο Διανομής Αγοραστών"),`
);
content = content.replace(
  "desc: 'Portföydeki araçlarınız el değmeden kendi kurumsal sitenizde ve global araç paylaşım portalı enrakipsiz.com\\'da otomatik listelenir.',",
  `desc: txt("Portföydeki araçlarınız el değmeden kendi kurumsal sitenizde ve global araç paylaşım portalı enrakipsiz.com'da otomatik listelenir.", "Your vehicles in the portfolio are automatically listed untouched on your own corporate website and the global car sharing portal enrakipsiz.com.", "Τα οχήματά σας στο χαρτοφυλάκιο καταχωρούνται αυτόματα ανέγγιχτα στον δικό σας εταιρικό ιστότοπο και στην παγκόσμια πύλη κοινής χρήσης αυτοκινήτων enrakipsiz.com."),`
);
content = content.replace(
  "title: 'Mobil Öncelikli Hızlı Giriş',",
  `title: txt("Mobil Öncelikli Hızlı Giriş", "Mobile-First Quick Entry", "Γρήγορη Είσοδος Mobile-First"),`
);
content = content.replace(
  "desc: 'Daha aracın başındayken telefondan fotoğrafları çekin, verileri girin; anında web sitesinde ve sosyal medyada yayına alın.',",
  `desc: txt("Daha aracın başındayken telefondan fotoğrafları çekin, verileri girin; anında web sitesinde ve sosyal medyada yayına alın.", "Take photos from your phone while you are still at the vehicle, enter the data; publish it instantly on the website and social media.", "Τραβήξτε φωτογραφίες από το τηλέφωνό σας ενώ βρίσκεστε ακόμα στο όχημα, εισαγάγετε τα δεδομένα. δημοσιεύστε το άμεσα στον ιστότοπο και στα μέσα κοινωνικής δικτύωσης."),`
);
content = content.replace(
  "title: 'Araç Maliyet & Kârlılık Takibi',",
  `title: txt("Araç Maliyet & Kârlılık Takibi", "Vehicle Cost & Profitability Tracking", "Κόστος οχήματος και παρακολούθηση κερδοφορίας"),`
);
content = content.replace(
  "desc: 'Yaptığınız tüm harcamaları (reklam, tadilat, gümrük) gelir/gider kalemlerine işleyerek kâr-zarar raporlarını analiz edin.',",
  `desc: txt("Yaptığınız tüm harcamaları (reklam, tadilat, gümrük) gelir/gider kalemlerine işleyerek kâr-zarar raporlarını analiz edin.", "Analyze profit and loss reports by processing all your expenditures (advertising, modification, customs) into income/expense items.", "Αναλύστε τις αναφορές κερδών και ζημιών επεξεργάζοντας όλα τα έξοδά σας (διαφήμιση, τροποποίηση, τελωνείο) σε στοιχεία εσόδων/εξόδων."),`
);

// FAQS
content = content.replace(
  "q: 'Sektörel gelişmeleri ve araç ilanlarını takip edebileceğimiz bir radar sistemi var mı?',",
  `q: txt('Sektörel gelişmeleri ve araç ilanlarını takip edebileceğimiz bir radar sistemi var mı?', 'Is there a radar system where we can follow sectoral developments and vehicle advertisements?', 'Υπάρχει σύστημα ραντάρ όπου μπορούμε να παρακολουθούμε τις εξελίξεις του κλάδου και τις αγγελίες οχημάτων;'),`
);
content = content.replace(
  "a: 'Evet, AutoLP içerisinde yer alan Sektörel Radar Takip Sistemi sayesinde belirleyeceğiniz anahtar kelimelere göre internetteki en yeni piyasa fırsatlarını ve araç haberlerini yakalayabilirsiniz.'",
  `a: txt('Evet, AutoLP içerisinde yer alan Sektörel Radar Takip Sistemi sayesinde belirleyeceğiniz anahtar kelimelere göre internetteki en yeni piyasa fırsatlarını ve araç haberlerini yakalayabilirsiniz.', 'Yes, thanks to the Sectoral Radar Tracking System within AutoLP, you can catch the latest market opportunities and vehicle news on the internet according to the keywords you specify.', 'Ναι, χάρη στο Τομεακό Σύστημα Παρακολούθησης Ραντάρ εντός του AutoLP, μπορείτε να πιάσετε τις τελευταίες ευκαιρίες της αγοράς και τα νέα οχημάτων στο διαδίκτυο σύμφωνα με τις λέξεις-κλειδιά που θα καθορίσετε.')`
);
content = content.replace(
  "q: 'Anlık döviz kurları, kredi hesaplama ve kullanıcı işlem denetimleri sisteme dahil mi?',",
  `q: txt('Anlık döviz kurları, kredi hesaplama ve kullanıcı işlem denetimleri sisteme dahil mi?', 'Are instant exchange rates, loan calculations, and user transaction audits included in the system?', 'Περιλαμβάνονται στο σύστημα άμεσες συναλλαγματικές ισοτιμίες, υπολογισμοί δανείων και έλεγχοι συναλλαγών χρηστών;'),`
);
content = content.replace(
  "a: 'Kesinlikle. Otomatik Merkez Bankası döviz kur eşitlemesi, harita yol tarifleri, kredi hesaplama motoru ve kullanıcı işlem denetim kayıtları AutoLP\\'nin standart özellikleri arasındadır.'",
  `a: txt('Kesinlikle. Otomatik Merkez Bankası döviz kur eşitlemesi, harita yol tarifleri, kredi hesaplama motoru ve kullanıcı işlem denetim kayıtları AutoLP\\'nin standart özellikleri arasındadır.', 'Absolutely. Automatic Central Bank exchange rate equalization, map directions, loan calculation engine, and user transaction audit logs are among the standard features of AutoLP.', 'Απολύτως. Η αυτόματη εξίσωση της συναλλαγματικής ισοτιμίας της Κεντρικής Τράπεζας, οι οδηγίες χάρτη, ο μηχανισμός υπολογισμού δανείου και τα αρχεία καταγραφής ελέγχου συναλλαγών χρηστών είναι μεταξύ των τυπικών χαρακτηριστικών του AutoLP.')`
);

// We should also replace the missing text in the checkmarks at the top:
// "Türk Koçanı, Eşdeğer veya Tahsis tapu tiplerine özel filtreler" -> "Araç stoklarınızı Sterlin (GBP) veya döviz bazlı yönetin, tek tuşla profesyonel PDF broşürleri basın ve galeriniz için harika bir dijital vitrin oluşturun." (Actually we did that one)
// Check REstateLanding for FAQs too.

fs.writeFileSync(f, content);
console.log("Done AutoLanding fixes");
