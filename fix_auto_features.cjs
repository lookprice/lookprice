const fs = require('fs');
let f = 'src/pages/AutoLanding.tsx';
let content = fs.readFileSync(f, 'utf8');

// The desc of "Otomatik Portföy Dağıtım Ağı"
content = content.replace(
  "desc: 'Portföydeki araçlarınız el değmeden kurumsal web sitenizde ve global ilan platformu enrakipsiz.com\\'da yayına alınarak sergilenir.',",
  `desc: txt("Portföydeki araçlarınız el değmeden kurumsal web sitenizde ve global ilan platformu enrakipsiz.com'da yayına alınarak sergilenir.", "Your vehicles in the portfolio are automatically published and displayed on your corporate website and the global classifieds platform enrakipsiz.com.", "Τα οχήματά σας στο χαρτοφυλάκιο δημοσιεύονται αυτόματα και προβάλλονται στον εταιρικό σας ιστότοπο και στην παγκόσμια πλατφόρμα αγγελιών enrakipsiz.com."),`
);

// The desc of "Mobil Öncelikli Hızlı Portföy"
content = content.replace(
  "desc: 'Telefondan fotoğraf çekip anında portföye yükleyin; kablosuz, anlık ve son derece hızlı envanter yönetim kolaylığı.',",
  `desc: txt("Telefondan fotoğraf çekip anında portföye yükleyin; kablosuz, anlık ve son derece hızlı envanter yönetim kolaylığı.", "Take a photo from your phone and instantly upload it to your portfolio; wireless, instant, and extremely fast inventory management convenience.", "Τραβήξτε μια φωτογραφία από το τηλέφωνό σας και ανεβάστε την άμεσα στο χαρτοφυλάκιό σας. ασύρματη, άμεση και εξαιρετικά γρήγορη ευκολία διαχείρισης αποθέματος."),`
);

// The desc of "Maliyet & Gider Takip Sistemi"
content = content.replace(
  "desc: 'Yaptığınız tüm harcamaları takip edip gelir/gider kayıtlarını portföyünüzle ilişkilendirerek kâr-zarar durum analizleri yapın.',",
  `desc: txt("Yaptığınız tüm harcamaları takip edip gelir/gider kayıtlarını portföyünüzle ilişkilendirerek kâr-zarar durum analizleri yapın.", "Analyze profit and loss situations by tracking all your expenses and associating income/expense records with your portfolio.", "Αναλύστε καταστάσεις κερδών και ζημιών παρακολουθώντας όλα τα έξοδά σας και συσχετίζοντας αρχεία εσόδων/εξόδων με το χαρτοφυλάκιό σας."),`
);

// title & desc of "Tek Bakışta Kilometre Envanteri"
content = content.replace(
  "title: 'Tek Bakışta Kilometre Envanteri',",
  `title: txt("Tek Bakışta Kilometre Envanteri", "Mileage Inventory at a Glance", "Απόθεμα χιλιομετρικής απόστασης με μια ματιά"),`
);
content = content.replace(
  "desc: 'Tüm araçlarınızın detaylı listesini, kilometrelerini ve fiyatlarını tek bakışta izleyin, görsel detayları tek tıkla inceleyin.',",
  `desc: txt("Tüm araçlarınızın detaylı listesini, kilometrelerini ve fiyatlarını tek bakışta izleyin, görsel detayları tek tıkla inceleyin.", "Monitor the detailed list, mileage, and prices of all your vehicles at a glance, and examine visual details with a single click.", "Παρακολουθήστε τη λεπτομερή λίστα, τα χιλιόμετρα και τις τιμές όλων των οχημάτων σας με μια ματιά και εξετάστε τις οπτικές λεπτομέρειες με ένα μόνο κλικ."),`
);

// title & desc of "Vadeli Satış & Cari Hesap"
content = content.replace(
  "title: 'Vadeli Satış & Cari Hesap',",
  `title: txt("Vadeli Satış & Cari Hesap", "Term Sales & Current Account", "Προθεσμιακές Πωλήσεις & Τρεχούμενος Λογαριασμός"),`
);
content = content.replace(
  "desc: 'Vadeli satışlarınızda borç/alacak takibi yapın, dilediğiniz an raporlayın ve Excel veya PDF olarak tek tıkla dışarı aktarın.',",
  `desc: txt("Vadeli satışlarınızda borç/alacak takibi yapın, dilediğiniz an raporlayın ve Excel veya PDF olarak tek tıkla dışarı aktarın.", "Track debt/receivables in your term sales, report them whenever you want, and export them as Excel or PDF with a single click.", "Παρακολουθήστε τις οφειλές/απαιτήσεις στις προθεσμιακές πωλήσεις σας, αναφέρετέ τις όποτε θέλετε και εξάγετέ τις ως Excel ή PDF με ένα μόνο κλικ."),`
);

// title & desc of "Çok Şubeli CRM & Personel"
content = content.replace(
  "title: 'Çok Şubeli CRM & Personel',",
  `title: txt("Çok Şubeli CRM & Personel", "Multi-Branch CRM & Personnel", "Πολυκαταστηματικό CRM & Προσωπικό"),`
);
content = content.replace(
  "desc: 'Sınırsız şube ve satış temsilcisi ekleyin. Şubeler arası araç transferi ve zimmet işlemlerini tek panelden kolayca yönetin.',",
  `desc: txt("Sınırsız şube ve satış temsilcisi ekleyin. Şubeler arası araç transferi ve zimmet işlemlerini tek panelden kolayca yönetin.", "Add unlimited branches and sales representatives. Easily manage vehicle transfers and debit transactions between branches from a single panel.", "Προσθέστε απεριόριστα υποκαταστήματα και αντιπροσώπους πωλήσεων. Διαχειριστείτε εύκολα τις μεταφορές οχημάτων και τις χρεωστικές συναλλαγές μεταξύ των υποκαταστημάτων από έναν ενιαίο πίνακα."),`
);

// title & desc of "Tek Tuşla Bulut Yedekleme"
content = content.replace(
  "title: 'Tek Tuşla Bulut Yedekleme',",
  `title: txt("Tek Tuşla Bulut Yedekleme", "One-Click Cloud Backup", "Cloud Backup με ένα κλικ"),`
);
content = content.replace(
  "desc: 'Tüm verilerinizi tek tuşla kurumsal Google Cloud sistemlerine şifreli olarak yedekleyin, her an güvenle erişin.',",
  `desc: txt("Tüm verilerinizi tek tuşla kurumsal Google Cloud sistemlerine şifreli olarak yedekleyin, her an güvenle erişin.", "Securely backup all your data to corporate Google Cloud systems with a single click and access it safely at any time.", "Δημιουργήστε αντίγραφα ασφαλείας όλων των δεδομένων σας με ασφάλεια σε εταιρικά συστήματα Google Cloud με ένα μόνο κλικ και αποκτήστε πρόσβαση σε αυτά με ασφάλεια ανά πάσα στιγμή."),`
);

// title & desc of "SEO Dostu & Hazır Meta"
content = content.replace(
  "title: 'SEO Dostu & Hazır Meta',",
  `title: txt("SEO Dostu & Hazır Meta", "SEO Friendly & Ready Meta", "Φιλικό προς το SEO & Έτοιμο Meta"),`
);
content = content.replace(
  "desc: 'Google hesaplarını ve reklam piksellerini kolayca tanımlayarak PR ve pazarlama kampanyalarınızı anında optimize edin.',",
  `desc: txt("Google hesaplarını ve reklam piksellerini kolayca tanımlayarak PR ve pazarlama kampanyalarınızı anında optimize edin.", "Easily define Google accounts and ad pixels to optimize your PR and marketing campaigns instantly.", "Ορίστε εύκολα λογαριασμούς Google και pixel διαφημίσεων για να βελτιστοποιήσετε τις καμπάνιες PR και μάρκετινγκ άμεσα."),`
);

// title & desc of "Gerçek Zamanlı Karar Analitiği"
content = content.replace(
  "title: 'Gerçek Zamanlı Karar Analitiği',",
  `title: txt("Gerçek Zamanlı Karar Analitiği", "Real-Time Decision Analytics", "Αναλυτικά Στοιχεία Απόφασης σε Πραγματικό Χρόνο"),`
);
content = content.replace(
  "desc: 'Yöneticiler için anlık raporlama sunan, işletmenizin tüm finansal durumunu özetleyen dinamik dashboard ekranı.',",
  `desc: txt("Yöneticiler için anlık raporlama sunan, işletmenizin tüm finansal durumunu özetleyen dinamik dashboard ekranı.", "Dynamic dashboard screen that provides instant reporting for managers and summarizes the entire financial status of your business.", "Δυναμική οθόνη πίνακα ελέγχου που παρέχει άμεση αναφορά για διευθυντές και συνοψίζει ολόκληρη την οικονομική κατάσταση της επιχείρησής σας."),`
);

// desc of "Sektörel Radar Takip Sistemi"
content = content.replace(
  "desc: 'Belirleyeceğiniz anahtar kelimelere göre internetteki en yeni piyasa fırsatlarını ve araç haberlerini yakalayan radar.',",
  `desc: txt("Belirleyeceğiniz anahtar kelimelere göre internetteki en yeni piyasa fırsatlarını ve araç haberlerini yakalayan radar.", "Radar that captures the latest market opportunities and vehicle news on the internet according to the keywords you specify.", "Ραντάρ που καταγράφει τις πιο πρόσφατες ευκαιρίες αγοράς και ειδήσεις οχημάτων στο διαδίκτυο σύμφωνα με τις λέξεις-κλειδιά που καθορίζετε."),`
);

// desc of "Otomatik Döviz & Finansman"
content = content.replace(
  "desc: 'Otomatik Merkez Bankası döviz kur eşitlemesi, harita yol tarifleri, kredi hesaplama motoru ve kullanıcı işlem denetim kayıtları.',",
  `desc: txt("Otomatik Merkez Bankası döviz kur eşitlemesi, harita yol tarifleri, kredi hesaplama motoru ve kullanıcı işlem denetim kayıtları.", "Automatic Central Bank exchange rate equalization, map directions, loan calculation engine, and user transaction audit logs.", "Αυτόματη εξίσωση συναλλαγματικής ισοτιμίας της Κεντρικής Τράπεζας, οδηγίες χάρτη, μηχανή υπολογισμού δανείου και αρχεία ελέγχου συναλλαγών χρηστών."),`
);


fs.writeFileSync(f, content);
console.log("AutoLanding features fixed");
