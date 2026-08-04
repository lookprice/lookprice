const fs = require('fs');

let f = 'src/pages/REstateLanding.tsx';
let content = fs.readFileSync(f, 'utf8');

content = content.replace(
  "title: 'Otomatik Instagram Paylaşımı',",
  `title: txt("Otomatik Instagram Paylaşımı", "Automatic Instagram Sharing", "Αυτόματη κοινοποίηση στο Instagram"),`
);
content = content.replace(
  "desc: 'Portföye eklenen her mülk anında enrakipsiz.com ve kendi hesaplarınızda otomatik paylaşılır; fiyat güncellemelerinde yenilenir.',",
  `desc: txt("Portföye eklenen her mülk anında enrakipsiz.com ve kendi hesaplarınızda otomatik paylaşılır; fiyat güncellemelerinde yenilenir.", "Every property added to the portfolio is instantly shared automatically on enrakipsiz.com and your own accounts; updated on price updates.", "Κάθε ακίνητο που προστίθεται στο χαρτοφυλάκιο κοινοποιείται αυτόματα στο enrakipsiz.com και στους δικούς σας λογαριασμούς. ενημερώνεται με ενημερώσεις τιμών."),`
);
content = content.replace(
  "title: 'SEO Dostu & Hazır Meta',",
  `title: txt("SEO Dostu & Hazır Meta", "SEO Friendly & Ready Meta", "Φιλικό προς το SEO & Έτοιμο Meta"),`
);
content = content.replace(
  "desc: 'Google hesaplarını ve reklam piksellerini kolayca tanımlayarak PR ve pazarlama kampanyalarınızı anında optimize edin.',",
  `desc: txt("Google hesaplarını ve reklam piksellerini kolayca tanımlayarak PR ve pazarlama kampanyalarınızı anında optimize edin.", "Easily define Google accounts and ad pixels to optimize your PR and marketing campaigns instantly.", "Ορίστε εύκολα λογαριασμούς Google και pixel διαφημίσεων για να βελτιστοποιήσετε τις καμπάνιες PR και μάρκετινγκ άμεσα."),`
);
content = content.replace(
  "title: 'Gerçek Zamanlı Karar Analitiği',",
  `title: txt("Gerçek Zamanlı Karar Analitiği", "Real-Time Decision Analytics", "Αναλυτικά Στοιχεία Απόφασης σε Πραγματικό Χρόνο"),`
);
content = content.replace(
  "desc: 'Yöneticiler için anlık raporlama sunan, işletmenizin tüm finansal durumunu özetleyen dinamik dashboard ekranı.',",
  `desc: txt("Yöneticiler için anlık raporlama sunan, işletmenizin tüm finansal durumunu özetleyen dinamik dashboard ekranı.", "Dynamic dashboard screen that provides instant reporting for managers and summarizes the entire financial status of your business.", "Δυναμική οθόνη πίνακα ελέγχου που παρέχει άμεση αναφορά για διευθυντές και συνοψίζει ολόκληρη την οικονομική κατάσταση της επιχείρησής σας."),`
);
content = content.replace(
  "title: 'Sektörel Radar Takip Sistemi',",
  `title: txt("Sektörel Radar Takip Sistemi", "Sectoral Radar Tracking System", "Τομεακό Σύστημα Παρακολούθησης Ραντάρ"),`
);
content = content.replace(
  "desc: 'Belirleyeceğiniz anahtar kelimelere göre internetteki en yeni piyasa fırsatlarını ve imar haberlerini yakalayan radar.',",
  `desc: txt("Belirleyeceğiniz anahtar kelimelere göre internetteki en yeni piyasa fırsatlarını ve imar haberlerini yakalayan radar.", "Radar that captures the latest market opportunities and zoning news on the internet according to the keywords you specify.", "Ραντάρ που καταγράφει τις πιο πρόσφατες ευκαιρίες αγοράς και ειδήσεις ζωνών στο διαδίκτυο σύμφωνα με τις λέξεις-κλειδιά που καθορίζετε."),`
);
content = content.replace(
  "title: 'Otomatik Döviz & Finansman',",
  `title: txt("Otomatik Döviz & Finansman", "Automatic Currency & Financing", "Αυτόματο Νόμισμα & Χρηματοδότηση"),`
);
content = content.replace(
  "desc: 'Otomatik Merkez Bankası döviz kur eşitlemesi, harita yol tarifleri, kredi hesaplama motoru ve kullanıcı işlem denetim kayıtları.',",
  `desc: txt("Otomatik Merkez Bankası döviz kur eşitlemesi, harita yol tarifleri, kredi hesaplama motoru ve kullanıcı işlem denetim kayıtları.", "Automatic Central Bank exchange rate equalization, map directions, loan calculation engine, and user transaction audit logs.", "Αυτόματη εξίσωση συναλλαγματικής ισοτιμίας της Κεντρικής Τράπεζας, οδηγίες χάρτη, μηχανή υπολογισμού δανείου και αρχεία ελέγχου συναλλαγών χρηστών."),`
);
fs.writeFileSync(f, content);

// Now ShopLanding
f = 'src/pages/ShopLanding.tsx';
content = fs.readFileSync(f, 'utf8');

content = content.replace(
  "title: 'Gider Merkezleri Analizi',",
  `title: txt("Gider Merkezleri Analizi", "Expense Centers Analysis", "Ανάλυση Κέντρων Κόστους"),`
);
content = content.replace(
  "desc: 'Yaptığınız tüm harcamaları (reklam, tadilat, hukuki) gelir/gider kalemlerine işleyerek kâr-zarar raporlarını analiz edin.',",
  `desc: txt("Yaptığınız tüm harcamaları (reklam, tadilat, hukuki) gelir/gider kalemlerine işleyerek kâr-zarar raporlarını analiz edin.", "Analyze profit and loss reports by processing all your expenses (advertising, renovation, legal) into income/expense items.", "Αναλύστε τις αναφορές κερδών και ζημιών επεξεργάζοντας όλα τα έξοδά σας (διαφήμιση, ανακαίνιση, νομικά) σε στοιχεία εσόδων/εξόδων."),`
);
content = content.replace(
  "title: 'Filo & Araç Yönetim Sistemi',",
  `title: txt("Filo & Araç Yönetim Sistemi", "Fleet & Vehicle Management System", "Σύστημα διαχείρισης στόλου & οχημάτων"),`
);
content = content.replace(
  "desc: 'Mağazanızın dağıtım ve kargo araçlarının yakıt, kaza, kasko ve zimmet takibini tek ekrandan yönetin.',",
  `desc: txt("Mağazanızın dağıtım ve kargo araçlarının yakıt, kaza, kasko ve zimmet takibini tek ekrandan yönetin.", "Manage fuel, accident, insurance and debit tracking of your store's distribution and cargo vehicles from a single screen.", "Διαχειριστείτε την παρακολούθηση καυσίμων, ατυχημάτων, ασφάλισης και χρεώσεων των οχημάτων διανομής και φορτίου του καταστήματός σας από μία μόνο οθόνη."),`
);
content = content.replace(
  "title: 'Uçtan Uca Tedarik Yönetimi',",
  `title: txt("Uçtan Uca Tedarik Yönetimi", "End-to-End Supply Management", "End-to-End Supply Management"),`
);
content = content.replace(
  "desc: 'Tedarikçilerden alınan ürünlerin sipariş aşamasından faturalaşmasına kadar tüm evrelerini kayıt altına alın.',",
  `desc: txt("Tedarikçilerden alınan ürünlerin sipariş aşamasından faturalaşmasına kadar tüm evrelerini kayıt altına alın.", "Record all stages of the products received from suppliers, from the ordering stage to invoicing.", "Καταγράψτε όλα τα στάδια των προϊόντων που λαμβάνονται από τους προμηθευτές, από το στάδιο της παραγγελίας έως την τιμολόγηση."),`
);
content = content.replace(
  "title: 'Çok Şubeli Eşgüdümlü Yönetim',",
  `title: txt("Çok Şubeli Eşgüdümlü Yönetim", "Multi-Branch Coordinated Management", "Συντονισμένη διαχείριση πολλών καταστημάτων"),`
);
content = content.replace(
  "desc: 'Dilediğiniz kadar şube ekleyin. Şubeler arası ürün/personel transferlerini yönetin, performansları şube bazlı ölçün.',",
  `desc: txt("Dilediğiniz kadar şube ekleyin. Şubeler arası ürün/personel transferlerini yönetin, performansları şube bazlı ölçün.", "Add as many branches as you want. Manage product/personnel transfers between branches, measure performances on a branch basis.", "Προσθέστε όσα υποκαταστήματα θέλετε. Διαχειριστείτε τις μεταφορές προϊόντων/προσωπικού μεταξύ των υποκαταστημάτων, μετρήστε τις επιδόσεις σε επίπεδο υποκαταστήματος."),`
);
content = content.replace(
  "title: 'Dövizli Cari & Dijital Mutabakat',",
  `title: txt("Dövizli Cari & Dijital Mutabakat", "Foreign Currency Current & Digital Reconciliation", "Τρέχων συνάλλαγμα & ψηφιακή συμφωνία"),`
);
content = content.replace(
  "desc: 'Satış/satın alma işlemlerinizde cari hesapları, vadesi gelen ödemeleri döviz kuruna endeksli takip edin.',",
  `desc: txt("Satış/satın alma işlemlerinizde cari hesapları, vadesi gelen ödemeleri döviz kuruna endeksli takip edin.", "Track current accounts and due payments indexed to the exchange rate in your sales/purchase transactions.", "Παρακολουθήστε τους τρεχούμενους λογαριασμούς και τις οφειλόμενες πληρωμές που έχουν ευρετηριαστεί στη συναλλαγματική ισοτιμία στις συναλλαγές αγορών/πωλήσεων σας."),`
);
content = content.replace(
  "title: 'Mağaza içi \"Fiyat Gör\" QR',",
  `title: txt("Mağaza içi 'Fiyat Gör' QR", "In-Store 'See Price' QR", "Κωδικός QR 'Δείτε Τιμή' στο κατάστημα"),`
);
content = content.replace(
  "desc: 'Müşterilerin ürün etiketlerindeki QR kodu kendi telefonlarından okutarak anlık dövizli/TL fiyatları görmesini sağlayın.',",
  `desc: txt("Müşterilerin ürün etiketlerindeki QR kodu kendi telefonlarından okutarak anlık dövizli/TL fiyatları görmesini sağlayın.", "Allow customers to scan the QR code on the product labels from their own phones and see instant foreign currency/TL prices.", "Επιτρέψτε στους πελάτες να σαρώσουν τον κωδικό QR στις ετικέτες των προϊόντων από τα δικά τους τηλέφωνα και να δουν άμεσες τιμές ξένου νομίσματος/TL."),`
);
content = content.replace(
  "title: 'E-Ticaret & Otomatik Kur',",
  `title: txt("E-Ticaret & Otomatik Kur", "E-Commerce & Automatic Rate", "Ηλεκτρονικό εμπόριο & Αυτόματη ισοτιμία"),`
);
content = content.replace(
  "desc: 'B2B/B2C sipariş altyapısı, otomatik Merkez Bankası kur eşitlemesi, kampanya yönetimi ve detaylı analiz logları.',",
  `desc: txt("B2B/B2C sipariş altyapısı, otomatik Merkez Bankası kur eşitlemesi, kampanya yönetimi ve detaylı analiz logları.", "B2B/B2C ordering infrastructure, automatic Central Bank exchange rate equalization, campaign management and detailed analysis logs.", "Υποδομή παραγγελιών B2B/B2C, αυτόματη εξίσωση συναλλαγματικής ισοτιμίας Κεντρικής Τράπεζας, διαχείριση καμπάνιας και λεπτομερή αρχεία καταγραφής αναλύσεων."),`
);
fs.writeFileSync(f, content);

console.log("Done fixing features");
