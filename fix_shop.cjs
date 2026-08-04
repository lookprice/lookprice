const fs = require('fs');

let f = 'src/pages/ShopLanding.tsx';
let content = fs.readFileSync(f, 'utf8');

// Hero
content = content.replace(
  'Bulut Tabanlı Perakende ve <br className="hidden md:inline"/> Akıllı Kasa Satış Sistemi',
  `{txt('Bulut Tabanlı Perakende ve', 'Cloud-Based Retail and', 'Λιανική βασισμένη στο Cloud και')} <br className="hidden md:inline"/> {txt('Akıllı Kasa Satış Sistemi', 'Smart POS Sales System', 'Έξυπνο Σύστημα Πωλήσεων POS')}`
);
content = content.replace(
  'Hızlı POS satış ekranı, tam uyumlu barkod okuyucu ve yazıcı entegrasyonu, gelişmiş stok takibi ve resmi e-Fatura / e-Arşiv bağlantısıyla mağazanızı baştan yaratın.',
  `{txt('Hızlı POS satış ekranı, tam uyumlu barkod okuyucu ve yazıcı entegrasyonu, gelişmiş stok takibi ve resmi e-Fatura / e-Arşiv bağlantısıyla mağazanızı baştan yaratın.', 'Reinvent your store with a fast POS sales screen, fully compatible barcode reader and printer integration, advanced stock tracking, and official e-Invoice / e-Archive connection.', 'Επανεφεύρετε το κατάστημά σας με μια γρήγορη οθόνη πωλήσεων POS, πλήρως συμβατή συσκευή ανάγνωσης γραμμωτού κώδικα και ενσωμάτωση εκτυπωτή, προηγμένη παρακολούθηση αποθεμάτων και επίσημη σύνδεση e-Invoice / e-Archive.')}`
);
content = content.replace(
  'Ücretsiz Deneyin <ArrowRight className="h-5 w-5" />',
  `{txt('Ücretsiz Deneyin', 'Try for Free', 'Δοκιμάστε Δωρεάν')} <ArrowRight className="h-5 w-5" />`
);

// Showcase Visual Section
content = content.replace(
  'BULUT TABANLI PERAKENDE AKILLI POS',
  `{txt('BULUT TABANLI PERAKENDE AKILLI POS', 'CLOUD-BASED RETAIL SMART POS', 'ΕΞΥΠΝΟ POS ΛΙΑΝΙΚΗΣ ΒΑΣΙΣΜΕΝΟ ΣΤΟ CLOUD')}`
);
content = content.replace(
  'Hızlı Barkodlu Kasa Satışı ve Varyasyonlu Stok Takibi',
  `{txt('Hızlı Barkodlu Kasa Satışı ve Varyasyonlu Stok Takibi', 'Fast Barcode POS Sales and Variational Stock Tracking', 'Γρήγορες Πωλήσεις POS με Barcode και Παρακολούθηση Αποθέματος με Παραλλαγές')}`
);
content = content.replace(
  'ShopLP, butikler, pastaneler, marketler ve tüm perakende satıcılar için iş süreçlerini kolaylaştırır. Dokunmatik ekranlar ve barkod okuyucularla tam entegre çalışarak satış hızınızı zirveye taşır.',
  `{txt('ShopLP, butikler, pastaneler, marketler ve tüm perakende satıcılar için iş süreçlerini kolaylaştırır. Dokunmatik ekranlar ve barkod okuyucularla tam entegre çalışarak satış hızınızı zirveye taşır.', 'ShopLP simplifies business processes for boutiques, bakeries, markets, and all retail sellers. It takes your sales speed to the peak by working fully integrated with touch screens and barcode readers.', 'Το ShopLP απλοποιεί τις επιχειρηματικές διαδικασίες για μπουτίκ, αρτοποιεία, αγορές και όλους τους πωλητές λιανικής. Ανεβάζει την ταχύτητα πωλήσεών σας στην κορυφή λειτουργώντας πλήρως ενσωματωμένο με οθόνες αφής και συσκευές ανάγνωσης barcode.')}`
);
content = content.replace(
  `"Hızlı barkodlu/barkodsuz dokunmatik POS satış ekranı",
                "Renk, beden ve dinamik varyasyon bazlı gelişmiş stok takibi",
                "Entegre resmi e-Fatura / e-Arşiv ve çoklu dövizli kasa yönetimi"`,
  `txt("Hızlı barkodlu/barkodsuz dokunmatik POS satış ekranı", "Fast barcode/barcode-free touch POS sales screen", "Γρήγορη οθόνη πωλήσεων POS αφής με barcode/χωρίς barcode"),
                txt("Renk, beden ve dinamik varyasyon bazlı gelişmiş stok takibi", "Advanced stock tracking based on color, size, and dynamic variation", "Προηγμένη παρακολούθηση αποθέματος βάσει χρώματος, μεγέθους και δυναμικής παραλλαγής"),
                txt("Entegre resmi e-Fatura / e-Arşiv ve çoklu dövizli kasa yönetimi", "Integrated official e-Invoice / e-Archive and multi-currency cash register management", "Ενσωματωμένο επίσημο e-Invoice / e-Archive και διαχείριση ταμειακής μηχανής πολλαπλών νομισμάτων")`
);

content = content.replace(
  'PERAKENDE KASA VİTRİN',
  `{txt('PERAKENDE KASA VİTRİN', 'RETAIL POS SHOWCASE', 'ΒΙΤΡΙΝΑ POS ΛΙΑΝΙΚΗΣ')}`
);
content = content.replace(
  'Veresiye ve Cari Hesap Defteri',
  `{txt('Veresiye ve Cari Hesap Defteri', 'Credit and Current Account Ledger', 'Βιβλίο Πιστώσεων και Τρεχούμενων Λογαριασμών')}`
);
content = content.replace(
  'Tüm müşteri cari bakiyelerini, tahsilatları ve veresiye limitlerini anlık izleyin.',
  `{txt('Tüm müşteri cari bakiyelerini, tahsilatları ve veresiye limitlerini anlık izleyin.', 'Instantly monitor all customer current balances, collections, and credit limits.', 'Παρακολουθήστε άμεσα όλα τα τρέχοντα υπόλοιπα πελατών, τις εισπράξεις και τα πιστωτικά όρια.')}`
);

// Feature Highlights Section
content = content.replace(
  'Perakende Mağazanız İçin Eksiksiz Güç',
  `{txt('Perakende Mağazanız İçin Eksiksiz Güç', 'Complete Power for Your Retail Store', 'Πλήρης Δύναμη για το Κατάστημα Λιανικής σας')}`
);
content = content.replace(
  'ShopLP, butikler, pastaneler, marketler ve tüm perakende mağazaları için uçtan uca otomasyon ve finansal yönetim sunar.',
  `{txt('ShopLP, butikler, pastaneler, marketler ve tüm perakende mağazaları için uçtan uca otomasyon ve finansal yönetim sunar.', 'ShopLP offers end-to-end automation and financial management for boutiques, bakeries, markets, and all retail stores.', 'Το ShopLP προσφέρει αυτοματοποίηση και οικονομική διαχείριση από άκρο σε άκρο για μπουτίκ, αρτοποιεία, αγορές και όλα τα καταστήματα λιανικής.')}`
);

content = content.replace(
  "title: 'Hızlı Dokunmatik POS',",
  `title: txt("Hızlı Dokunmatik POS", "Fast Touch POS", "Γρήγορο POS Αφής"),`
);
content = content.replace(
  "desc: 'Barkodlu veya barkodsuz tüm ürünlerinizi ister okutarak ister dokunarak saniyeler içinde satın. Yeni nesil entegre yazar kasa/POS cihazları ile tam uyumlu çalışır.',",
  `desc: txt("Barkodlu veya barkodsuz tüm ürünlerinizi ister okutarak ister dokunarak saniyeler içinde satın. Yeni nesil entegre yazar kasa/POS cihazları ile tam uyumlu çalışır.", "Sell all your products, with or without barcodes, in seconds, either by scanning or touching. It works fully compatibly with new generation integrated cash register/POS devices.", "Πουλήστε όλα τα προϊόντα σας, με ή χωρίς barcode, σε δευτερόλεπτα, είτε με σάρωση είτε με άγγιγμα. Λειτουργεί πλήρως συμβατά με νέας γενιάς ενσωματωμένες ταμειακές μηχανές/συσκευές POS."),`
);
content = content.replace(
  "title: 'Gelişmiş Varyasyon',",
  `title: txt("Gelişmiş Varyasyon", "Advanced Variation", "Προηγμένη Παραλλαγή"),`
);
content = content.replace(
  "desc: 'Giyim ve ayakkabı gibi renk, beden, numara kırılımlı ürünleri tek kartta toplayıp stoklarını bağımsız takip edin.',",
  `desc: txt("Giyim ve ayakkabı gibi renk, beden, numara kırılımlı ürünleri tek kartta toplayıp stoklarını bağımsız takip edin.", "Collect products with color, size, and number breakdowns such as clothing and shoes on a single card and track their stocks independently.", "Συλλέξτε προϊόντα με αναλύσεις χρώματος, μεγέθους και αριθμού, όπως ρούχα και παπούτσια σε μία μόνο κάρτα και παρακολουθήστε τα αποθέματά τους ανεξάρτητα."),`
);
content = content.replace(
  "title: 'Entegre e-Fatura Altyapısı',",
  `title: txt("Entegre e-Fatura Altyapısı", "Integrated e-Invoice Infrastructure", "Ενσωματωμένη Υποδομή e-Invoice"),`
);
content = content.replace(
  "desc: 'Satış anında müşteri bilgileriyle resmi e-Fatura veya e-Arşiv faturası kesin, muhasebe süreçlerinizi hızlandırın.',",
  `desc: txt("Satış anında müşteri bilgileriyle resmi e-Fatura veya e-Arşiv faturası kesin, muhasebe süreçlerinizi hızlandırın.", "Issue official e-Invoice or e-Archive invoices with customer information at the time of sale, speed up your accounting processes.", "Εκδώστε επίσημα e-Invoice ή e-Archive τιμολόγια με πληροφορίες πελατών κατά την πώληση, επιταχύνετε τις λογιστικές σας διαδικασίες."),`
);
content = content.replace(
  "title: 'Teknik Servis Yönetimi',",
  `title: txt("Teknik Servis Yönetimi", "Technical Service Management", "Διαχείριση Τεχνικής Υπηρεσίας"),`
);
content = content.replace(
  "desc: 'Müşteri bilgilendirmesi, servis raporu ve fiyat teklifleri süreçlerini dijital olarak takip edin. Onay durumuna göre otomatik taslak satış faturası oluşturun.',",
  `desc: txt("Müşteri bilgilendirmesi, servis raporu ve fiyat teklifleri süreçlerini dijital olarak takip edin. Onay durumuna göre otomatik taslak satış faturası oluşturun.", "Track customer information, service report, and price quote processes digitally. Automatically create a draft sales invoice based on the approval status.", "Παρακολουθήστε ψηφιακά τις πληροφορίες πελατών, την αναφορά υπηρεσίας και τις διαδικασίες προσφοράς τιμής. Δημιουργήστε αυτόματα ένα πρόχειρο τιμολόγιο πώλησης με βάση την κατάσταση έγκρισης."),`
);
content = content.replace(
  "title: 'Akıllı Fiyat Teklif Sistemi',",
  `title: txt("Akıllı Fiyat Teklif Sistemi", "Smart Price Quote System", "Έξυπνο Σύστημα Προσφοράς Τιμής"),`
);
content = content.replace(
  "desc: 'Fiyat tekliflerinizi saniyeler içinde hazırlayıp PDF veya interaktif dijital onay linkiyle gönderin. Onaylanan teklifleri otomatik taslak faturaya dönüştürün.',",
  `desc: txt("Fiyat tekliflerinizi saniyeler içinde hazırlayıp PDF veya interaktif dijital onay linkiyle gönderin. Onaylanan teklifleri otomatik taslak faturaya dönüştürün.", "Prepare your price quotes in seconds and send them via PDF or interactive digital approval link. Automatically convert approved quotes into draft invoices.", "Ετοιμάστε τις προσφορές τιμών σας σε δευτερόλεπτα και στείλτε τις μέσω PDF ή διαδραστικού συνδέσμου ψηφιακής έγκρισης. Μετατρέψτε αυτόματα τις εγκεκριμένες προσφορές σε πρόχειρα τιμολόγια."),`
);
content = content.replace(
  "title: 'Stok Hareket Ekstresi',",
  `title: txt("Stok Hareket Ekstresi", "Stock Movement Statement", "Κατάσταση Κίνησης Αποθέματος"),`
);
content = content.replace(
  "desc: 'Geçmiş dönem ürün hareketlerini, giriş/çıkış sipariş detaylarını, şubeler arası sevkleri ve stokların talep yoğunluk durumlarını anlık analiz edin.',",
  `desc: txt("Geçmiş dönem ürün hareketlerini, giriş/çıkış sipariş detaylarını, şubeler arası sevkleri ve stokların talep yoğunluk durumlarını anlık analiz edin.", "Instantly analyze past period product movements, entry/exit order details, inter-branch transfers, and demand intensity status of stocks.", "Αναλύστε άμεσα τις κινήσεις προϊόντων προηγούμενης περιόδου, λεπτομέρειες παραγγελίας εισόδου/εξόδου, μεταφορές μεταξύ υποκαταστημάτων και κατάσταση έντασης ζήτησης αποθεμάτων."),`
);
content = content.replace(
  "title: 'Otomatik Muhasebe & Kayıt',",
  `title: txt("Otomatik Muhasebe & Kayıt", "Automatic Accounting & Registration", "Αυτόματη Λογιστική & Εγγραφή"),`
);
content = content.replace(
  "desc: 'Alış ve satış faturalarından (hem resmi e-fatura hem de manuel faturalardan) otomatik cari ve stok kayıtları oluşturarak manuel iş yükünü sıfırlayın.',",
  `desc: txt("Alış ve satış faturalarından (hem resmi e-fatura hem de manuel faturalardan) otomatik cari ve stok kayıtları oluşturarak manuel iş yükünü sıfırlayın.", "Reset manual workload by automatically creating current and stock records from purchase and sales invoices (both official e-invoices and manual invoices).", "Επαναφέρετε τον χειροκίνητο φόρτο εργασίας δημιουργώντας αυτόματα τρέχοντα αρχεία και αρχεία αποθέματος από τιμολόγια αγοράς και πώλησης (τόσο επίσημα e-invoices όσο και χειροκίνητα τιμολόγια)."),`
);
content = content.replace(
  "title: 'Toplu Fiyat Değişikliği',",
  `title: txt("Toplu Fiyat Değişikliği", "Bulk Price Change", "Μαζική Αλλαγή Τιμής"),`
);
content = content.replace(
  "desc: 'Piyasadaki anlık kur ve maliyet dalgalanmalarına karşı, saniyeler içerisinde binlerce ürünün fiyatına kategori veya marka bazında müdahale edin.',",
  `desc: txt("Piyasadaki anlık kur ve maliyet dalgalanmalarına karşı, saniyeler içerisinde binlerce ürünün fiyatına kategori veya marka bazında müdahale edin.", "Against instant exchange rate and cost fluctuations in the market, intervene in the prices of thousands of products on a category or brand basis in seconds.", "Ενάντια στις άμεσες διακυμάνσεις συναλλαγματικών ισοτιμιών και κόστους στην αγορά, παρέμβετε στις τιμές χιλιάδων προϊόντων σε επίπεδο κατηγορίας ή μάρκας σε δευτερόλεπτα."),`
);

fs.writeFileSync(f, content);
console.log("Done ShopLanding");
