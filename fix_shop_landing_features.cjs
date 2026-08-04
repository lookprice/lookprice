const fs = require('fs');

let f = 'src/pages/ShopLanding.tsx';
let content = fs.readFileSync(f, 'utf8');

// The rest of the features in ShopLanding (lines 330+)
content = content.replace(
  "title: 'Sipariş & Teslimat Ağı',",
  `title: txt("Sipariş & Teslimat Ağı", "Order & Delivery Network", "Δίκτυο Παραγγελιών & Παράδοσης"),`
);
content = content.replace(
  "desc: 'Telefonla veya WhatsApp üzerinden aldığınız siparişleri kurye atayarak yönetin, teslimat sürelerini ve kurye performanslarını izleyin.',",
  `desc: txt("Telefonla veya WhatsApp üzerinden aldığınız siparişleri kurye atayarak yönetin, teslimat sürelerini ve kurye performanslarını izleyin.", "Manage the orders you receive by phone or WhatsApp by assigning couriers, monitor delivery times and courier performances.", "Διαχειριστείτε τις παραγγελίες που λαμβάνετε μέσω τηλεφώνου ή WhatsApp αναθέτοντας κούριερ, παρακολουθήστε τους χρόνους παράδοσης και τις επιδόσεις των κούριερ."),`
);
content = content.replace(
  "title: 'Gelişmiş CRM ve Müşteri Puanı',",
  `title: txt("Gelişmiş CRM ve Müşteri Puanı", "Advanced CRM and Customer Score", "Προηγμένο CRM και Βαθμολογία Πελάτη"),`
);
content = content.replace(
  "desc: 'Müşterilerinizin alışveriş alışkanlıklarını kaydedin. Sadakat puanları, doğum günü indirimleri ve SMS bildirimleriyle satışları artırın.',",
  `desc: txt("Müşterilerinizin alışveriş alışkanlıklarını kaydedin. Sadakat puanları, doğum günü indirimleri ve SMS bildirimleriyle satışları artırın.", "Record the shopping habits of your customers. Increase sales with loyalty points, birthday discounts, and SMS notifications.", "Καταγράψτε τις αγοραστικές συνήθειες των πελατών σας. Αυξήστε τις πωλήσεις με πόντους επιβράβευσης, εκπτώσεις γενεθλίων και ειδοποιήσεις SMS."),`
);
content = content.replace(
  "title: 'Mobil Patron Raporları',",
  `title: txt("Mobil Patron Raporları", "Mobile Boss Reports", "Αναφορές Mobile Boss"),`
);
content = content.replace(
  "desc: 'Mağazanızda olmasanız bile cep telefonunuzdan anlık kasa cirosunu, en çok satan ürünleri ve personel satış performansını takip edin.',",
  `desc: txt("Mağazanızda olmasanız bile cep telefonunuzdan anlık kasa cirosunu, en çok satan ürünleri ve personel satış performansını takip edin.", "Even if you are not in your store, track instant cash register turnover, best-selling products, and personnel sales performance from your mobile phone.", "Ακόμα κι αν δεν βρίσκεστε στο κατάστημά σας, παρακολουθήστε τον άμεσο τζίρο ταμειακής μηχανής, τα προϊόντα με τις καλύτερες πωλήσεις και την απόδοση πωλήσεων προσωπικού από το κινητό σας τηλέφωνο."),`
);
content = content.replace(
  "title: 'Çok Şubeli Depo Transferi',",
  `title: txt("Çok Şubeli Depo Transferi", "Multi-Branch Warehouse Transfer", "Μεταφορά αποθήκης πολλαπλών υποκαταστημάτων"),`
);
content = content.replace(
  "desc: 'Birden fazla mağazanız varsa stokları merkezden yönetin. Şubeler arası tek tuşla ürün sevk edin ve depo sayımlarını otomatik eşitleyin.',",
  `desc: txt("Birden fazla mağazanız varsa stokları merkezden yönetin. Şubeler arası tek tuşla ürün sevk edin ve depo sayımlarını otomatik eşitleyin.", "Manage stocks from the center if you have more than one store. Ship products between branches with a single click and automatically synchronize warehouse counts.", "Διαχειριστείτε τα αποθέματα από το κέντρο εάν έχετε περισσότερα από ένα καταστήματα. Στείλτε προϊόντα μεταξύ των καταστημάτων με ένα μόνο κλικ και συγχρονίστε αυτόματα τις μετρήσεις αποθήκης."),`
);
content = content.replace(
  "title: 'Kolay Barkod Yazdırma',",
  `title: txt("Kolay Barkod Yazdırma", "Easy Barcode Printing", "Εύκολη Εκτύπωση Barcode"),`
);
content = content.replace(
  "desc: 'Ürünlerinize otomatik barkod veya QR kod oluşturun. Tüm termal ve lazer etiket yazıcılarıyla tek tıkla raf etiketleri basın.',",
  `desc: txt("Ürünlerinize otomatik barkod veya QR kod oluşturun. Tüm termal ve lazer etiket yazıcılarıyla tek tıkla raf etiketleri basın.", "Automatically generate barcodes or QR codes for your products. Print shelf labels with a single click with all thermal and laser label printers.", "Δημιουργήστε αυτόματα barcodes ή κωδικούς QR για τα προϊόντα σας. Εκτυπώστε ετικέτες ραφιών με ένα μόνο κλικ με όλους τους θερμικούς εκτυπωτές και εκτυπωτές ετικετών λέιζερ."),`
);
content = content.replace(
  "title: 'Güvenli Kasiyer Yetkileri',",
  `title: txt("Güvenli Kasiyer Yetkileri", "Secure Cashier Authorizations", "Ασφαλείς Εξουσιοδοτήσεις Ταμία"),`
);
content = content.replace(
  "desc: 'İptal, iade, fiyat değiştirme veya iskonto uygulama gibi kritik işlemleri kasiyer yetkilerinden çıkarıp yalnızca yönetici şifresine bağlayın.',",
  `desc: txt("İptal, iade, fiyat değiştirme veya iskonto uygulama gibi kritik işlemleri kasiyer yetkilerinden çıkarıp yalnızca yönetici şifresine bağlayın.", "Remove critical operations such as cancellation, return, price change, or discount application from cashier authorizations and bind them only to the manager password.", "Αφαιρέστε κρίσιμες λειτουργίες όπως ακύρωση, επιστροφή, αλλαγή τιμής ή εφαρμογή έκπτωσης από τις εξουσιοδοτήσεις ταμία και συνδέστε τις μόνο στον κωδικό πρόσβασης διαχειριστή."),`
);

// FAQs for ShopLanding
content = content.replace(
  "q: 'Hızlı dokunmatik POS sistemi yeni nesil yazar kasalarla uyumlu mu?',",
  `q: txt('Hızlı dokunmatik POS sistemi yeni nesil yazar kasalarla uyumlu mu?', 'Is the fast touch POS system compatible with new generation cash registers?', 'Είναι το γρήγορο σύστημα POS αφής συμβατό με νέας γενιάς ταμειακές μηχανές;'),`
);
content = content.replace(
  "a: 'Evet, sistemimiz barkodlu veya barkodsuz tüm ürünleriniz için yeni nesil entegre yazar kasa ve POS cihazlarıyla tam uyumlu çalışır.'",
  `a: txt('Evet, sistemimiz barkodlu veya barkodsuz tüm ürünleriniz için yeni nesil entegre yazar kasa ve POS cihazlarıyla tam uyumlu çalışır.', 'Yes, our system works fully compatibly with new generation integrated cash registers and POS devices for all your products, with or without barcodes.', 'Ναι, το σύστημά μας λειτουργεί πλήρως συμβατά με νέας γενιάς ενσωματωμένες ταμειακές μηχανές και συσκευές POS για όλα τα προϊόντα σας, με ή χωρίς barcode.')`
);
content = content.replace(
  "q: 'Giyim ve ayakkabı mağazaları için varyasyonlu stok takibi yapabiliyor muyuz?',",
  `q: txt('Giyim ve ayakkabı mağazaları için varyasyonlu stok takibi yapabiliyor muyuz?', 'Can we do variant stock tracking for clothing and shoe stores?', 'Μπορούμε να κάνουμε παρακολούθηση αποθεμάτων παραλλαγών για καταστήματα ρούχων και υποδημάτων;'),`
);
content = content.replace(
  "a: 'Kesinlikle. Renk, beden, numara gibi varyasyonları tek kartta toplayıp stoklarını bağımsız olarak takip edebilir ve raporlayabilirsiniz.'",
  `a: txt('Kesinlikle. Renk, beden, numara gibi varyasyonları tek kartta toplayıp stoklarını bağımsız olarak takip edebilir ve raporlayabilirsiniz.', 'Absolutely. You can collect variations such as color, size, number on a single card and track and report their stocks independently.', 'Απολύτως. Μπορείτε να συλλέξετε παραλλαγές όπως χρώμα, μέγεθος, αριθμό σε μία μόνο κάρτα και να παρακολουθείτε και να αναφέρετε τα αποθέματά τους ανεξάρτητα.')`
);
content = content.replace(
  "q: 'Birden fazla şubemiz var, stokları ve transferleri merkezden yönetebilir miyiz?',",
  `q: txt('Birden fazla şubemiz var, stokları ve transferleri merkezden yönetebilir miyiz?', 'We have more than one branch, can we manage stocks and transfers from the center?', 'Έχουμε περισσότερα από ένα υποκαταστήματα, μπορούμε να διαχειριστούμε τα αποθέματα και τις μεταφορές από το κέντρο;'),`
);
content = content.replace(
  "a: 'Evet, Çok Şubeli Depo Transferi özelliği sayesinde tüm şubelerinizin stoklarını merkezden izleyebilir ve tek tıkla ürün sevkiyatı yapabilirsiniz.'",
  `a: txt('Evet, Çok Şubeli Depo Transferi özelliği sayesinde tüm şubelerinizin stoklarını merkezden izleyebilir ve tek tıkla ürün sevkiyatı yapabilirsiniz.', 'Yes, thanks to the Multi-Branch Warehouse Transfer feature, you can monitor the stocks of all your branches from the center and make product shipments with a single click.', 'Ναι, χάρη στη λειτουργία Μεταφοράς Αποθήκης Πολλαπλών Καταστημάτων, μπορείτε να παρακολουθείτε τα αποθέματα όλων των υποκαταστημάτων σας από το κέντρο και να κάνετε αποστολές προϊόντων με ένα μόνο κλικ.')`
);
content = content.replace(
  "q: 'Satış anında e-fatura kesmek zor mu?',",
  `q: txt('Satış anında e-fatura kesmek zor mu?', 'Is it difficult to issue an e-invoice at the time of sale?', 'Είναι δύσκολο να εκδοθεί e-invoice κατά την πώληση;'),`
);
content = content.replace(
  "a: 'Hayır, çok kolay. Entegre e-Fatura Altyapımız ile satış anında müşteri bilgileriyle resmi e-Fatura veya e-Arşiv faturanızı anında kesebilirsiniz.'",
  `a: txt('Hayır, çok kolay. Entegre e-Fatura Altyapımız ile satış anında müşteri bilgileriyle resmi e-Fatura veya e-Arşiv faturanızı anında kesebilirsiniz.', 'No, very easy. With our Integrated e-Invoice Infrastructure, you can instantly issue your official e-Invoice or e-Archive invoice with customer information at the time of sale.', 'Όχι, πολύ εύκολο. Με την Ενσωματωμένη Υποδομή e-Invoice, μπορείτε να εκδώσετε άμεσα το επίσημο e-Invoice ή το e-Archive τιμολόγιό σας με πληροφορίες πελατών κατά την πώληση.')`
);
content = content.replace(
  "q: 'Kasiyerlerin işlem yetkilerini sınırlandırabiliyor muyuz?',",
  `q: txt('Kasiyerlerin işlem yetkilerini sınırlandırabiliyor muyuz?', 'Can we limit the transaction authorities of cashiers?', 'Μπορούμε να περιορίσουμε τις εξουσιοδοτήσεις συναλλαγών των ταμιών;'),`
);
content = content.replace(
  "a: 'Evet, iptal, iade, fiyat değiştirme gibi kritik işlemleri kasiyer yetkilerinden çıkarıp sadece yönetici onayıyla yapılmasını sağlayabilirsiniz.'",
  `a: txt('Evet, iptal, iade, fiyat değiştirme gibi kritik işlemleri kasiyer yetkilerinden çıkarıp sadece yönetici onayıyla yapılmasını sağlayabilirsiniz.', 'Yes, you can remove critical operations such as cancellation, return, price change from cashier authorizations and ensure that they are done only with manager approval.', 'Ναι, μπορείτε να αφαιρέσετε κρίσιμες λειτουργίες όπως ακύρωση, επιστροφή, αλλαγή τιμής από εξουσιοδοτήσεις ταμία και να βεβαιωθείτε ότι γίνονται μόνο με έγκριση διαχειριστή.')`
);
content = content.replace(
  "q: 'Raf etiketleri ve ürün barkodları yazdırabilir miyim?',",
  `q: txt('Raf etiketleri ve ürün barkodları yazdırabilir miyim?', 'Can I print shelf labels and product barcodes?', 'Μπορώ να εκτυπώσω ετικέτες ραφιών και barcode προϊόντων;'),`
);
content = content.replace(
  "a: 'Evet, Kolay Barkod Yazdırma modülü sayesinde ürünlerinize özel barkod/QR kod oluşturup tüm termal veya lazer yazıcılardan tek tıkla çıktı alabilirsiniz.'",
  `a: txt('Evet, Kolay Barkod Yazdırma modülü sayesinde ürünlerinize özel barkod/QR kod oluşturup tüm termal veya lazer yazıcılardan tek tıkla çıktı alabilirsiniz.', 'Yes, thanks to the Easy Barcode Printing module, you can create custom barcode/QR codes for your products and print them from all thermal or laser printers with a single click.', 'Ναι, χάρη στη λειτουργική μονάδα Easy Barcode Printing, μπορείτε να δημιουργήσετε προσαρμοσμένους κωδικούς barcode/QR για τα προϊόντα σας και να τους εκτυπώσετε από όλους τους θερμικούς ή λέιζερ εκτυπωτές με ένα μόνο κλικ.')`
);

fs.writeFileSync(f, content);
console.log("Done ShopLanding fixes");
