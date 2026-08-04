const fs = require('fs');

let f = 'src/pages/REstateLanding.tsx';
let content = fs.readFileSync(f, 'utf8');

// The first 8 features were partly translated (only 8, there are more)
content = content.replace(
  "title: 'Sürükle-Bırak Web Site Sihirbazı',",
  `title: txt("Sürükle-Bırak Web Site Sihirbazı", "Drag-and-Drop Website Wizard", "Οδηγός ιστότοπου μεταφοράς και απόθεσης"),`
);
content = content.replace(
  "desc: 'Emlak ofisinize özel hazır kurumsal web siteniz saniyeler içinde otomatik kurulur, dilediğiniz gibi sürükle-bırak özelleştirebilirsiniz.',",
  `desc: txt("Emlak ofisinize özel hazır kurumsal web siteniz saniyeler içinde otomatik kurulur, dilediğiniz gibi sürükle-bırak özelleştirebilirsiniz.", "Your custom ready-made corporate website is automatically installed in seconds, you can customize it with drag-and-drop as you wish.", "Ο προσαρμοσμένος έτοιμος εταιρικός ιστότοπός σας εγκαθίσταται αυτόματα σε δευτερόλεπτα, μπορείτε να τον προσαρμόσετε με μεταφορά και απόθεση όπως επιθυμείτε."),`
);
content = content.replace(
  "title: 'Otomatik Portföy Dağıtım Ağı',",
  `title: txt("Otomatik Portföy Dağıtım Ağı", "Automatic Portfolio Distribution Network", "Αυτόματο Δίκτυο Διανομής Χαρτοφυλακίου"),`
);
content = content.replace(
  "desc: 'Eklediğiniz mülkler el değmeden kendi kurumsal sitenizde ve global emlak paylaşım portalı enrakipsiz.com\\'da otomatik listelenir.',",
  `desc: txt("Eklediğiniz mülkler el değmeden kendi kurumsal sitenizde ve global emlak paylaşım portalı enrakipsiz.com'da otomatik listelenir.", "Your added properties are automatically listed untouched on your own corporate website and the global real estate sharing portal enrakipsiz.com.", "Τα ακίνητα που προσθέσατε παρατίθενται αυτόματα ανέγγιχτα στον δικό σας εταιρικό ιστότοπο και στην παγκόσμια πύλη κοινής χρήσης ακινήτων enrakipsiz.com."),`
);
content = content.replace(
  "title: 'Mobil Öncelikli Hızlı Portföy',",
  `title: txt("Mobil Öncelikli Hızlı Portföy", "Mobile-First Quick Portfolio", "Γρήγορο Χαρτοφυλάκιο Mobile-First"),`
);
content = content.replace(
  "desc: 'Daha mülkün içerisindeyken telefondan fotoğrafları çekin, verileri girin; anında web sitesinde ve sosyal medyada yayına alın.',",
  `desc: txt("Daha mülkün içerisindeyken telefondan fotoğrafları çekin, verileri girin; anında web sitesinde ve sosyal medyada yayına alın.", "Take photos from your phone while you are still inside the property, enter the data; publish it instantly on the website and social media.", "Τραβήξτε φωτογραφίες από το τηλέφωνό σας ενώ βρίσκεστε ακόμα μέσα στο ακίνητο, εισαγάγετε τα δεδομένα. δημοσιεύστε το άμεσα στον ιστότοπο και στα μέσα κοινωνικής δικτύωσης."),`
);
content = content.replace(
  "title: 'Maliyet & Gider Takip Sistemi',",
  `title: txt("Maliyet & Gider Takip Sistemi", "Cost & Expense Tracking System", "Σύστημα παρακολούθησης κόστους και εξόδων"),`
);
content = content.replace(
  "desc: 'Mülklere yaptığınız tüm masrafları (reklam, tadilat, hukuki) gelir/gider kalemlerine işleyerek kâr-zarar raporlarını analiz edin.',",
  `desc: txt("Mülklere yaptığınız tüm masrafları (reklam, tadilat, hukuki) gelir/gider kalemlerine işleyerek kâr-zarar raporlarını analiz edin.", "Analyze profit and loss reports by processing all your expenses (advertising, renovation, legal) on properties into income/expense items.", "Αναλύστε τις αναφορές κερδών και ζημιών επεξεργάζοντας όλα τα έξοδά σας (διαφήμιση, ανακαίνιση, νομικά) σε ακίνητα σε στοιχεία εσόδων/εξόδων."),`
);
content = content.replace(
  "title: 'Tek Bakışta Envanter Listesi',",
  `title: txt("Tek Bakışta Envanter Listesi", "Inventory List at a Glance", "Λίστα αποθέματος με μια ματιά"),`
);
content = content.replace(
  "desc: 'Kiralık, Kiralandı, Satılık, Satıldı, Opsiyonlu mülklerinizi fiyatı ve özet bilgileriyle birlikte tek bir ekranda, tablo halinde görün.',",
  `desc: txt("Kiralık, Kiralandı, Satılık, Satıldı, Opsiyonlu mülklerinizi fiyatı ve özet bilgileriyle birlikte tek bir ekranda, tablo halinde görün.", "See your properties For Rent, Rented, For Sale, Sold, Optioned in a table on a single screen along with their price and summary information.", "Δείτε τα ακίνητά σας Προς Ενοικίαση, Ενοικιάζεται, Προς Πώληση, Πουλήθηκε, Επιλογή σε πίνακα σε μία μόνο οθόνη μαζί με την τιμή τους και συνοπτικές πληροφορίες."),`
);
content = content.replace(
  "title: 'Vadeli İşlemler & Cari Hesap',",
  `title: txt("Vadeli İşlemler & Cari Hesap", "Forward Transactions & Current Account", "Προθεσμιακές Συναλλαγές & Τρεχούμενος Λογαριασμός"),`
);
content = content.replace(
  "desc: 'Senetli veya taksitli satış/kiralama işlemlerinizde cari hesapları, vadesi gelen ödemeleri ve müşteri bakiyelerini yakından takip edin.',",
  `desc: txt("Senetli veya taksitli satış/kiralama işlemlerinizde cari hesapları, vadesi gelen ödemeleri ve müşteri bakiyelerini yakından takip edin.", "Closely follow up current accounts, due payments and customer balances in your promissory or installment sales/rental transactions.", "Παρακολουθήστε στενά τους τρεχούμενους λογαριασμούς, τις οφειλόμενες πληρωμές και τα υπόλοιπα πελατών στις συναλλαγές πώλησης/ενοικίασης με γραμμάτια ή δόσεις."),`
);
content = content.replace(
  "title: 'Çok Şubeli CRM & Personel',",
  `title: txt("Çok Şubeli CRM & Personel", "Multi-Branch CRM & Personnel", "Πολυκαταστηματικό CRM & Προσωπικό"),`
);
content = content.replace(
  "desc: 'Dilediğiniz kadar şube ve danışman ekleyin. Şubeler arası portföy transferlerini yönetin, personel performanslarını şube bazlı ölçün.',",
  `desc: txt("Dilediğiniz kadar şube ve danışman ekleyin. Şubeler arası portföy transferlerini yönetin, personel performanslarını şube bazlı ölçün.", "Add as many branches and consultants as you want. Manage portfolio transfers between branches, measure personnel performances on a branch basis.", "Προσθέστε όσα υποκαταστήματα και συμβούλους θέλετε. Διαχειριστείτε τις μεταφορές χαρτοφυλακίου μεταξύ υποκαταστημάτων, μετρήστε τις επιδόσεις του προσωπικού σε επίπεδο υποκαταστήματος."),`
);
content = content.replace(
  "title: 'Tek Tuşla Bulut Yedekleme',",
  `title: txt("Tek Tuşla Bulut Yedekleme", "One-Click Cloud Backup", "Cloud Backup με ένα κλικ"),`
);
content = content.replace(
  "desc: 'Tüm tapu, evrak, sözleşme ve ilan fotoğraflarınızı Google Cloud sunucularına tek tıkla yedekleyerek veri kaybı riskini sıfırlayın.',",
  `desc: txt("Tüm tapu, evrak, sözleşme ve ilan fotoğraflarınızı Google Cloud sunucularına tek tıkla yedekleyerek veri kaybı riskini sıfırlayın.", "Eliminate the risk of data loss by backing up all your title deed, document, contract and ad photos to Google Cloud servers with a single click.", "Εξαλείψτε τον κίνδυνο απώλειας δεδομένων δημιουργώντας αντίγραφα ασφαλείας όλων των φωτογραφιών των τίτλων ιδιοκτησίας, των εγγράφων, των συμβολαίων και των διαφημίσεών σας στους διακομιστές του Google Cloud με ένα μόνο κλικ."),`
);

// FAQS for REstateLanding (lines 530+) - let's replace all standard questions:
content = content.replace(
  "q: 'Ofisimizin farklı şubelerini ve emlak danışmanlarımızın yetkilerini yönetebilir miyiz?',",
  `q: txt('Ofisimizin farklı şubelerini ve emlak danışmanlarımızın yetkilerini yönetebilir miyiz?', 'Can we manage the different branches of our office and the authorities of our real estate consultants?', 'Μπορούμε να διαχειριστούμε τα διαφορετικά υποκαταστήματα του γραφείου μας και τις εξουσίες των συμβούλων ακινήτων μας;'),`
);
content = content.replace(
  "a: 'Evet, Çok Şubeli CRM & Personel yönetimi modülü ile dilediğiniz kadar şube ve danışman ekleyebilir, yetkilendirmeleri yapabilirsiniz.'",
  `a: txt('Evet, Çok Şubeli CRM & Personel yönetimi modülü ile dilediğiniz kadar şube ve danışman ekleyebilir, yetkilendirmeleri yapabilirsiniz.', 'Yes, with the Multi-Branch CRM & Personnel management module, you can add as many branches and consultants as you want and make authorizations.', 'Ναι, με τη λειτουργική μονάδα Multi-Branch CRM & Personnel management, μπορείτε να προσθέσετε όσα υποκαταστήματα και συμβούλους θέλετε και να κάνετε εξουσιοδοτήσεις.')`
);
content = content.replace(
  "q: 'Verilerimizi ve tapu belgelerimizi Google Cloud sistemlerine yedekleyebilir miyiz?',",
  `q: txt('Verilerimizi ve tapu belgelerimizi Google Cloud sistemlerine yedekleyebilir miyiz?', 'Can we back up our data and title deed documents to Google Cloud systems?', 'Μπορούμε να δημιουργήσουμε αντίγραφα ασφαλείας των δεδομένων μας και των εγγράφων τίτλου ιδιοκτησίας στα συστήματα Google Cloud;'),`
);
content = content.replace(
  "a: 'Evet, Tek Tuşla Bulut Yedekleme özelliği sayesinde tüm önemli evrak ve fotoğraflarınızı Google Cloud güvencesiyle yedekleyebilirsiniz.'",
  `a: txt('Evet, Tek Tuşla Bulut Yedekleme özelliği sayesinde tüm önemli evrak ve fotoğraflarınızı Google Cloud güvencesiyle yedekleyebilirsiniz.', 'Yes, thanks to the One-Click Cloud Backup feature, you can back up all your important documents and photos with Google Cloud assurance.', 'Ναι, χάρη στη λειτουργία One-Click Cloud Backup, μπορείτε να δημιουργήσετε αντίγραφα ασφαλείας όλων των σημαντικών εγγράφων και φωτογραφιών σας με τη διασφάλιση του Google Cloud.')`
);
content = content.replace(
  "q: 'Google aramalarında üst sıralara çıkmak için SEO ve piksel kodları ekleyebilir miyiz?',",
  `q: txt('Google aramalarında üst sıralara çıkmak için SEO ve piksel kodları ekleyebilir miyiz?', 'Can we add SEO and pixel codes to rank high in Google searches?', 'Μπορούμε να προσθέσουμε SEO και κώδικες pixel για να κατατάξουμε υψηλά στις αναζητήσεις Google;'),`
);
content = content.replace(
  "a: 'Kesinlikle. SEO Dostu & Hazır Meta araçları ile PR ve pazarlama kampanyalarınızı anında optimize edebilirsiniz.'",
  `a: txt('Kesinlikle. SEO Dostu & Hazır Meta araçları ile PR ve pazarlama kampanyalarınızı anında optimize edebilirsiniz.', 'Absolutely. You can instantly optimize your PR and marketing campaigns with SEO Friendly & Ready Meta tools.', 'Απολύτως. Μπορείτε να βελτιστοποιήσετε άμεσα τις καμπάνιες PR και μάρκετινγκ με τα εργαλεία SEO Friendly & Ready Meta.')`
);
content = content.replace(
  "q: 'Emlak ofisimizin tüm verilerini görebileceğimiz bir analiz paneli var mı?',",
  `q: txt('Emlak ofisimizin tüm verilerini görebileceğimiz bir analiz paneli var mı?', 'Is there an analysis panel where we can see all the data of our real estate office?', 'Υπάρχει πίνακας ανάλυσης όπου μπορούμε να δούμε όλα τα δεδομένα του κτηματομεσιτικού γραφείου μας;'),`
);
content = content.replace(
  "a: 'Evet, Gerçek Zamanlı Karar Analitiği dashboard ekranı, ofisinizin tüm performans ve finansal durumunu özetler.'",
  `a: txt('Evet, Gerçek Zamanlı Karar Analitiği dashboard ekranı, ofisinizin tüm performans ve finansal durumunu özetler.', 'Yes, the Real-Time Decision Analytics dashboard screen summarizes the entire performance and financial status of your office.', 'Ναι, η οθόνη του πίνακα ελέγχου Real-Time Decision Analytics συνοψίζει τη συνολική απόδοση και την οικονομική κατάσταση του γραφείου σας.')`
);
content = content.replace(
  "q: 'Emlak piyasasındaki güncel imar haberlerini ve fırsat ilanlarını takip eden bir sistem var mı?',",
  `q: txt('Emlak piyasasındaki güncel imar haberlerini ve fırsat ilanlarını takip eden bir sistem var mı?', 'Is there a system that follows the current zoning news and opportunity advertisements in the real estate market?', 'Υπάρχει κάποιο σύστημα που να παρακολουθεί τις τρέχουσες ειδήσεις ζωνών και αγγελίες ευκαιριών στην αγορά ακινήτων;'),`
);
content = content.replace(
  "a: 'Evet, Sektörel Radar Takip Sistemi ile belirlediğiniz anahtar kelimelerdeki en yeni gelişmeleri sistem sizin için takip eder.'",
  `a: txt('Evet, Sektörel Radar Takip Sistemi ile belirlediğiniz anahtar kelimelerdeki en yeni gelişmeleri sistem sizin için takip eder.', 'Yes, the system follows the latest developments in the keywords you have determined with the Sectoral Radar Tracking System for you.', 'Ναι, το σύστημα ακολουθεί τις τελευταίες εξελίξεις στις λέξεις-κλειδιά που έχετε καθορίσει με το Sectoral Radar Tracking System για εσάς.')`
);
content = content.replace(
  "q: 'Otomatik döviz kurları, kredi hesaplama ve kullanıcı işlem denetimleri sisteme dahil mi?',",
  `q: txt('Otomatik döviz kurları, kredi hesaplama ve kullanıcı işlem denetimleri sisteme dahil mi?', 'Are automatic exchange rates, loan calculation and user transaction audits included in the system?', 'Περιλαμβάνονται στο σύστημα αυτόματες συναλλαγματικές ισοτιμίες, υπολογισμός δανείου και έλεγχοι συναλλαγών χρηστών;'),`
);
content = content.replace(
  "a: 'Evet, Merkez Bankası döviz kur eşitlemesi ve gelişmiş kredi araçları tüm abonelik paketlerimizde mevcuttur.'",
  `a: txt('Evet, Merkez Bankası döviz kur eşitlemesi ve gelişmiş kredi araçları tüm abonelik paketlerimizde mevcuttur.', 'Yes, Central Bank exchange rate equalization and advanced loan tools are available in all our subscription packages.', 'Ναι, η εξίσωση της συναλλαγματικής ισοτιμίας της Κεντρικής Τράπεζας και τα προηγμένα εργαλεία δανείου είναι διαθέσιμα σε όλα τα πακέτα συνδρομής μας.')`
);
content = content.replace(
  "q: 'Müşterilerle vadeli veya taksitli işlemlerimiz için özel bir hesap takip arayüzü var mı?',",
  `q: txt('Müşterilerle vadeli veya taksitli işlemlerimiz için özel bir hesap takip arayüzü var mı?', 'Is there a special account tracking interface for our forward or installment transactions with customers?', 'Υπάρχει ειδική διεπαφή παρακολούθησης λογαριασμού για τις προθεσμιακές μας συναλλαγές ή συναλλαγές με δόσεις με πελάτες;'),`
);
content = content.replace(
  "a: 'Evet, Vadeli İşlemler & Cari Hesap modülü sayesinde tüm taksitli ödemeleri ve bakiyeleri detaylıca yönetebilirsiniz.'",
  `a: txt('Evet, Vadeli İşlemler & Cari Hesap modülü sayesinde tüm taksitli ödemeleri ve bakiyeleri detaylıca yönetebilirsiniz.', 'Yes, you can manage all installment payments and balances in detail thanks to the Forward Transactions & Current Account module.', 'Ναι, μπορείτε να διαχειριστείτε όλες τις πληρωμές δόσεων και τα υπόλοιπα λεπτομερώς χάρη στη λειτουργική μονάδα Forward Transactions & Current Account.')`
);

fs.writeFileSync(f, content);
console.log("Done REstateLanding fixes");
