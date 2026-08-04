const fs = require('fs');

let f = 'src/pages/HoReCaLanding.tsx';
let content = fs.readFileSync(f, 'utf8');

// The rest of the features in HoReCaLanding (lines 330+) - actually some of them are already handled in previous code maybe?
// Wait, I translated HoReCa features partially in previous steps or maybe not at all?
// Let's replace the features in HoReCa:
content = content.replace(
  "title: 'Çevrimdışı El Terminalleri',",
  `title: txt('Çevrimdışı El Terminalleri', 'Offline Handheld Terminals', 'Τερματικά Χειρός Εκτός Σύνδεσης'),`
);
content = content.replace(
  "desc: 'İnternet bağlantınız kopsa bile el terminalleriniz sipariş almaya, adisyon açmaya ve yerel ağda haberleşmeye devam eder. Bağlantı gelince otomatik senkronize olur.',",
  `desc: txt('İnternet bağlantınız kopsa bile el terminalleriniz sipariş almaya, adisyon açmaya ve yerel ağda haberleşmeye devam eder. Bağlantı gelince otomatik senkronize olur.', 'Even if your internet connection is lost, your handheld terminals continue to take orders, open bills, and communicate on the local network. Automatically syncs when connection returns.', 'Ακόμα και αν η σύνδεση στο διαδίκτυο διακοπεί, τα φορητά τερματικά σας συνεχίζουν να λαμβάνουν παραγγελίες, να ανοίγουν λογαριασμούς και να επικοινωνούν στο τοπικό δίκτυο. Συγχρονίζονται αυτόματα όταν η σύνδεση αποκατασταθεί.'),`
);
content = content.replace(
  "title: 'Anlık Masa Senkronizasyonu',",
  `title: txt('Anlık Masa Senkronizasyonu', 'Instant Table Sync', 'Άμεσος Συγχρονισμός Τραπεζιού'),`
);
content = content.replace(
  "desc: 'Tüm terminaller arasında tam zamanlı çift yönlü veri senkronizasyonu. Garsonların girdiği siparişler kasada ve diğer terminallerde anlık güncellenir.',",
  `desc: txt('Tüm terminaller arasında tam zamanlı çift yönlü veri senkronizasyonu. Garsonların girdiği siparişler kasada ve diğer terminallerde anlık güncellenir.', 'Full-time two-way data synchronization across all terminals. Orders entered by waiters are instantly updated at the cash register and other terminals.', 'Αμφίδρομος συγχρονισμός δεδομένων πραγματικού χρόνου σε όλα τα τερματικά. Οι παραγγελίες που εισάγονται από σερβιτόρους ενημερώνονται άμεσα στο ταμείο και σε άλλα τερματικά.'),`
);
content = content.replace(
  "title: 'Gelişmiş Hesap Bölme',",
  `title: txt('Gelişmiş Hesap Bölme', 'Advanced Bill Splitting', 'Προηγμένη Διαίρεση Λογαριασμού'),`
);
content = content.replace(
  "desc: 'Kişi sayısına göre eşit hesap bölme veya seçilen spesifik ürün kalemlerine göre parça parça ödeme alma imkanı (Nakit, Kredi Kartı ve Karma).',",
  `desc: txt('Kişi sayısına göre eşit hesap bölme veya seçilen spesifik ürün kalemlerine göre parça parça ödeme alma imkanı (Nakit, Kredi Kartı ve Karma).', 'Possibility of equal bill splitting by number of people or partial payments based on selected specific products (Cash, Credit Card, and Mixed).', 'Δυνατότητα ισότιμης διαίρεσης λογαριασμού ανάλογα με τον αριθμό των ατόμων ή μερικών πληρωμών βάσει επιλεγμένων προϊόντων (Μετρητά, Πιστωτική Κάρτα και Μικτά).'),`
);
content = content.replace(
  "title: 'Zengin QR Menü & Sipariş',",
  `title: txt('Zengin QR Menü & Sipariş', 'Rich QR Menu & Ordering', 'Πλούσιο Μενού QR & Παραγγελίες'),`
);
content = content.replace(
  "desc: 'Müşterilerinizin masadaki kodu okutarak porsiyon, alerjen detaylarını görmesini ve doğrudan masadan interaktif sipariş vermesini sağlayın.',",
  `desc: txt('Müşterilerinizin masadaki kodu okutarak porsiyon, alerjen detaylarını görmesini ve doğrudan masadan interaktif sipariş vermesini sağlayın.', 'Allow your customers to scan the code at the table to see portions and allergen details, and place interactive orders directly from the table.', 'Επιτρέψτε στους πελάτες σας να σαρώσουν τον κωδικό στο τραπέζι για να δουν λεπτομέρειες για μερίδες και αλλεργιογόνα, και να κάνουν διαδραστικές παραγγελίες απευθείας από το τραπέζι.'),`
);
content = content.replace(
  "title: 'Akıllı Reçete & Stok Takibi',",
  `title: txt('Akıllı Reçete & Stok Takibi', 'Smart Recipe & Stock Tracking', 'Έξυπνη Συνταγή & Παρακολούθηση Αποθεμάτων'),`
);
content = content.replace(
  "desc: 'Her yemek ve kokteyl için milimetrik reçeteler (BOM) oluşturun. Satış yapıldıkça un, yağ, et gibi hammaddeler depodan otomatik düşsün.',",
  `desc: txt('Her yemek ve kokteyl için milimetrik reçeteler (BOM) oluşturun. Satış yapıldıkça un, yağ, et gibi hammaddeler depodan otomatik düşsün.', 'Create millimeter-precise recipes (BOM) for each dish and cocktail. As sales are made, raw materials like flour, oil, and meat are automatically deducted from stock.', 'Δημιουργήστε συνταγές ακριβείας (BOM) για κάθε πιάτο και κοκτέιλ. Καθώς πραγματοποιούνται πωλήσεις, πρώτες ύλες όπως αλεύρι, λάδι και κρέας αφαιρούνται αυτόματα από το απόθεμα.'),`
);
content = content.replace(
  "title: 'Süreli Happy Hour tarifesi',",
  `title: txt('Süreli Happy Hour tarifesi', 'Timed Happy Hour Tariff', 'Προγραμματισμένη Χρέωση Happy Hour'),`
);
content = content.replace(
  "desc: 'Haftanın belirli günlerinde ve saat aralıklarında otomatik devreye giren özel indirim tarifeleri ve Happy Hour kuralları tanımlayın.',",
  `desc: txt('Haftanın belirli günlerinde ve saat aralıklarında otomatik devreye giren özel indirim tarifeleri ve Happy Hour kuralları tanımlayın.', 'Define special discount tariffs and Happy Hour rules that automatically activate on specific days and time intervals of the week.', 'Ορίστε ειδικά τιμολόγια εκπτώσεων και κανόνες Happy Hour που ενεργοποιούνται αυτόματα σε συγκεκριμένες ημέρες και χρονικά διαστήματα της εβδομάδας.'),`
);
content = content.replace(
  "title: 'Akıllı Sipariş Yönlendirme',",
  `title: txt('Akıllı Sipariş Yönlendirme', 'Smart Order Routing', 'Έξυπνη Δρομολόγηση Παραγγελιών'),`
);
content = content.replace(
  "desc: 'Onaylanan adisyondaki yemek siparişleri anında mutfak ekranına, içecekler ise bar yazıcısına departman bazlı ayrılarak saniyeler içinde iletilir.',",
  `desc: txt('Onaylanan adisyondaki yemek siparişleri anında mutfak ekranına, içecekler ise bar yazıcısına departman bazlı ayrılarak saniyeler içinde iletilir.', 'Food orders in the approved bill are instantly routed to the kitchen screen, and drinks to the bar printer, split by department in seconds.', 'Οι παραγγελίες φαγητού στον εγκεκριμένο λογαριασμό δρομολογούνται άμεσα στην οθόνη της κουζίνας και τα ποτά στον εκτυπωτή μπαρ, διαχωρισμένα ανά τμήμα σε δευτερόλεπτα.'),`
);
content = content.replace(
  "title: 'Güvenlik & Rol Kısıtlamaları',",
  `title: txt('Güvenlik & Rol Kısıtlamaları', 'Security & Role Restrictions', 'Ασφάλεια & Περιορισμοί Ρόλων'),`
);
content = content.replace(
  "desc: 'İptal, ikram, iskonto ve iade işlemlerini yönetici onayına bağlayın. Personelin sadece iş yeri Wi-Fi ağından sisteme erişebilmesini sağlayın.',",
  `desc: txt('İptal, ikram, iskonto ve iade işlemlerini yönetici onayına bağlayın. Personelin sadece iş yeri Wi-Fi ağından sisteme erişebilmesini sağlayın.', 'Bind cancellation, treats, discount, and return processes to manager approval. Ensure staff can only access the system from the workplace Wi-Fi network.', 'Συνδέστε τις διαδικασίες ακύρωσης, κερασμάτων, εκπτώσεων και επιστροφών με την έγκριση του διευθυντή. Διασφαλίστε ότι το προσωπικό μπορεί να έχει πρόσβαση στο σύστημα μόνο από το Wi-Fi του καταστήματος.'),`
);
content = content.replace(
  "title: 'Paket Servis & Kurye Ağı',",
  `title: txt('Paket Servis & Kurye Ağı', 'Takeaway & Courier Network', 'Δίκτυο Takeaway & Κούριερ'),`
);
content = content.replace(
  "desc: 'Telefon veya online platformlardan gelen paket siparişleri tek ekrandan yönetin. Kuryelere sipariş atayıp teslimat sürelerini analiz edin.',",
  `desc: txt('Telefon veya online platformlardan gelen paket siparişleri tek ekrandan yönetin. Kuryelere sipariş atayıp teslimat sürelerini analiz edin.', 'Manage takeaway orders from phone or online platforms from a single screen. Assign orders to couriers and analyze delivery times.', 'Διαχειριστείτε παραγγελίες σε πακέτο από τηλέφωνο ή διαδικτυακές πλατφόρμες από μία μόνο οθόνη. Αναθέστε παραγγελίες σε κούριερ και αναλύστε τους χρόνους παράδοσης.'),`
);
content = content.replace(
  "title: 'Alerjen ve Kalori İkonları',",
  `title: txt('Alerjen ve Kalori İkonları', 'Allergen and Calorie Icons', 'Εικονίδια αλλεργιογόνων και θερμίδων'),`
);
content = content.replace(
  "desc: 'QR menünüzde her yemeğin gluten, fıstık, vegan gibi alerjen uyarılarını ve kalori değerlerini şeffaf ikonlarla müşteriye sunun.',",
  `desc: txt('QR menünüzde her yemeğin gluten, fıstık, vegan gibi alerjen uyarılarını ve kalori değerlerini şeffaf ikonlarla müşteriye sunun.', 'Present allergen warnings such as gluten, peanut, vegan, and calorie values of each dish to the customer with transparent icons in your QR menu.', 'Παρουσιάστε προειδοποιήσεις για αλλεργιογόνα, όπως γλουτένη, φιστίκια, vegan και θερμιδικές αξίες κάθε πιάτου στον πελάτη με διαφανή εικονίδια στο μενού QR σας.'),`
);
content = content.replace(
  "title: 'Hızlı Kasa & Parçalı Ödeme',",
  `title: txt('Hızlı Kasa & Parçalı Ödeme', 'Fast Checkout & Partial Payment', 'Γρήγορο Ταμείο & Μερική Πληρωμή'),`
);
content = content.replace(
  "desc: 'Müşteriler hesabı öderken nakit, kredi kartı ve yemek çeki gibi farklı ödeme yöntemlerini tek bir adisyon üzerinde aynı anda kullanabilsin.',",
  `desc: txt('Müşteriler hesabı öderken nakit, kredi kartı ve yemek çeki gibi farklı ödeme yöntemlerini tek bir adisyon üzerinde aynı anda kullanabilsin.', 'Allow customers to use different payment methods such as cash, credit card, and meal vouchers simultaneously on a single bill while paying the bill.', 'Επιτρέψτε στους πελάτες να χρησιμοποιούν διαφορετικούς τρόπους πληρωμής, όπως μετρητά, πιστωτική κάρτα και κουπόνια γευμάτων ταυτόχρονα σε έναν μόνο λογαριασμό κατά την πληρωμή του λογαριασμού.'),`
);
content = content.replace(
  "title: 'Bulut Yedekli Müşteri CRM',",
  `title: txt('Bulut Yedekli Müşteri CRM', 'Cloud Backed Customer CRM', 'CRM Πελατών Υποστηριζόμενο από Cloud'),`
);
content = content.replace(
  "desc: 'Müdavim müşterilerinizin iletişim bilgilerini, sipariş geçmişini ve favori ürünlerini güvenli bulut sunucularında saklayarak VIP hizmet sunun.',",
  `desc: txt('Müdavim müşterilerinizin iletişim bilgilerini, sipariş geçmişini ve favori ürünlerini güvenli bulut sunucularında saklayarak VIP hizmet sunun.', 'Offer VIP service by securely storing your regular customers\\' contact information, order history, and favorite products on cloud servers.', 'Προσφέρετε υπηρεσία VIP αποθηκεύοντας με ασφάλεια τα στοιχεία επικοινωνίας των τακτικών πελατών σας, το ιστορικό παραγγελιών και τα αγαπημένα προϊόντα σε διακομιστές cloud.'),`
);

// HoReCa FAQs
content = content.replace(
  "q: 'İnternet bağlantımız kesilirse sipariş almaya devam edebilir miyiz?',",
  `q: txt('İnternet bağlantımız kesilirse sipariş almaya devam edebilir miyiz?', 'Can we continue to take orders if our internet connection is lost?', 'Μπορούμε να συνεχίσουμε να δεχόμαστε παραγγελίες εάν χαθεί η σύνδεσή μας στο διαδίκτυο;'),`
);
content = content.replace(
  "a: 'Kesinlikle! Çevrimdışı (offline-first) mimarimiz sayesinde internet kopsa bile el terminalleri ve mutfak ekranları yerel ağ üzerinden haberleşmeye ve sipariş almaya devam eder. İnternet geldiğinde veriler otomatik olarak buluta senkronize olur.'",
  `a: txt('Kesinlikle! Çevrimdışı (offline-first) mimarimiz sayesinde internet kopsa bile el terminalleri ve mutfak ekranları yerel ağ üzerinden haberleşmeye ve sipariş almaya devam eder. İnternet geldiğinde veriler otomatik olarak buluta senkronize olur.', 'Absolutely! Thanks to our offline-first architecture, even if the internet goes down, handheld terminals and kitchen screens continue to communicate and take orders over the local network. Data automatically syncs to the cloud when the internet returns.', 'Απολύτως! Χάρη στην αρχιτεκτονική μας offline-first, ακόμα κι αν διακοπεί το Διαδίκτυο, τα τερματικά χειρός και οι οθόνες της κουζίνας συνεχίζουν να επικοινωνούν και να δέχονται παραγγελίες μέσω του τοπικού δικτύου. Τα δεδομένα συγχρονίζονται αυτόματα στο cloud όταν επιστρέψει το Διαδίκτυο.')`
);
content = content.replace(
  "q: 'Aynı adisyonu birden fazla parçaya bölebilir miyiz?',",
  `q: txt('Aynı adisyonu birden fazla parçaya bölebilir miyiz?', 'Can we split the same bill into multiple parts?', 'Μπορούμε να χωρίσουμε τον ίδιο λογαριασμό σε πολλά μέρη;'),`
);
content = content.replace(
  "a: 'Evet. Gelişmiş hesap bölme özelliğimizle hesabı kişi sayısına göre eşit bölebilir veya spesifik kalemleri (örneğin sadece 2 kahveyi) seçerek farklı ödeme yöntemleriyle (Nakit/Kart) tahsil edebilirsiniz.'",
  `a: txt('Evet. Gelişmiş hesap bölme özelliğimizle hesabı kişi sayısına göre eşit bölebilir veya spesifik kalemleri (örneğin sadece 2 kahveyi) seçerek farklı ödeme yöntemleriyle (Nakit/Kart) tahsil edebilirsiniz.', 'Yes. With our advanced bill splitting feature, you can split the bill equally according to the number of people or collect specific items (e.g., only 2 coffees) with different payment methods (Cash/Card).', 'Ναι. Με την προηγμένη λειτουργία διαχωρισμού λογαριασμών, μπορείτε να μοιράσετε το λογαριασμό εξίσου ανάλογα με τον αριθμό των ατόμων ή να εισπράξετε συγκεκριμένα στοιχεία (π.χ. μόνο 2 καφέδες) με διαφορετικούς τρόπους πληρωμής (Μετρητά/Κάρτα).')`
);
content = content.replace(
  "q: 'Mutfak ve bar siparişlerini nasıl ayırıyorsunuz?',",
  `q: txt('Mutfak ve bar siparişlerini nasıl ayırıyorsunuz?', 'How do you separate kitchen and bar orders?', 'Πώς ξεχωρίζετε τις παραγγελίες κουζίνας και μπαρ;'),`
);
content = content.replace(
  "a: 'Akıllı Sipariş Yönlendirme sistemimiz ile garson bir adisyonu onayladığında, yemek siparişleri mutfak ekranına/yazıcısına, içecekler ise bar departmanına eşzamanlı ve otomatik olarak iletilir.'",
  `a: txt('Akıllı Sipariş Yönlendirme sistemimiz ile garson bir adisyonu onayladığında, yemek siparişleri mutfak ekranına/yazıcısına, içecekler ise bar departmanına eşzamanlı ve otomatik olarak iletilir.', 'With our Smart Order Routing system, when a waiter approves a bill, food orders are instantly and automatically transmitted to the kitchen screen/printer, and beverages to the bar department.', 'Με το σύστημα Smart Order Routing, όταν ένας σερβιτόρος εγκρίνει έναν λογαριασμό, οι παραγγελίες φαγητού μεταδίδονται άμεσα και αυτόματα στην οθόνη/εκτυπωτή της κουζίνας και τα ποτά στο τμήμα του μπαρ.')`
);
content = content.replace(
  "q: 'İptal ve iade işlemlerinde personel suiistimalini nasıl önleriz?',",
  `q: txt('İptal ve iade işlemlerinde personel suiistimalini nasıl önleriz?', 'How do we prevent staff abuse in cancellation and return transactions?', 'Πώς μπορούμε να αποτρέψουμε την κατάχρηση προσωπικού σε συναλλαγές ακύρωσης και επιστροφής;'),`
);
content = content.replace(
  "a: 'Güvenlik & Rol Kısıtlamaları altyapımız sayesinde iptal, ikram, iskonto ve iade gibi tüm kritik işlemleri kasiyer/garson yetkilerinden çıkarıp, yalnızca yöneticinin onay koduna/şifresine bağlayabilirsiniz.'",
  `a: txt('Güvenlik & Rol Kısıtlamaları altyapımız sayesinde iptal, ikram, iskonto ve iade gibi tüm kritik işlemleri kasiyer/garson yetkilerinden çıkarıp, yalnızca yöneticinin onay koduna/şifresine bağlayabilirsiniz.', 'Thanks to our Security & Role Restrictions infrastructure, you can remove all critical operations such as cancellation, treat, discount, and return from cashier/waiter authorizations and bind them only to the manager\\'s approval code/password.', 'Χάρη στην υποδομή ασφάλειας & Περιορισμών ρόλων, μπορείτε να αφαιρέσετε όλες τις κρίσιμες λειτουργίες, όπως ακύρωση, κέρασμα, έκπτωση και επιστροφή από τις εξουσιοδοτήσεις ταμία/σερβιτόρου και να τις συνδέσετε μόνο με τον κωδικό/κωδικό έγκρισης του διαχειριστή.')`
);
content = content.replace(
  "q: 'Reçete ve fire takibi yapabiliyor muyuz?',",
  `q: txt('Reçete ve fire takibi yapabiliyor muyuz?', 'Can we do recipe and waste tracking?', 'Μπορούμε να κάνουμε συνταγή και παρακολούθηση απορριμμάτων;'),`
);
content = content.replace(
  "a: 'Evet, Akıllı Reçete (BOM) modülü ile her yemek veya kokteyl için gramajına kadar içerik belirleyebilirsiniz. Satış anında ilgili hammaddeler deponuzdan otomatik düşer, böylece fire ve maliyetlerinizi tam kontrol altına alırsınız.'",
  `a: txt('Evet, Akıllı Reçete (BOM) modülü ile her yemek veya kokteyl için gramajına kadar içerik belirleyebilirsiniz. Satış anında ilgili hammaddeler deponuzdan otomatik düşer, böylece fire ve maliyetlerinizi tam kontrol altına alırsınız.', 'Yes, with the Smart Recipe (BOM) module, you can determine ingredients down to the gram for each dish or cocktail. At the time of sale, the relevant raw materials are automatically deducted from your warehouse, so you take full control of your waste and costs.', 'Ναι, με την ενότητα Smart Recipe (BOM), μπορείτε να καθορίσετε τα συστατικά μέχρι το γραμμάριο για κάθε πιάτο ή κοκτέιλ. Κατά τη στιγμή της πώλησης, οι σχετικές πρώτες ύλες αφαιρούνται αυτόματα από την αποθήκη σας, ώστε να έχετε τον πλήρη έλεγχο των απορριμμάτων και του κόστους σας.')`
);
content = content.replace(
  "q: 'Müşteriler masadan kendi telefonlarıyla sipariş verebilir mi?',",
  `q: txt('Müşteriler masadan kendi telefonlarıyla sipariş verebilir mi?', 'Can customers order from the table with their own phones?', 'Μπορούν οι πελάτες να παραγγείλουν από το τραπέζι με τα δικά τους τηλέφωνα;'),`
);
content = content.replace(
  "a: 'Kesinlikle. Zengin QR Menü entegrasyonumuz ile müşterileriniz masadaki kodu okutarak alerjen detaylarına kadar menüyü inceleyebilir ve garson beklemeden doğrudan mutfağa interaktif sipariş gönderebilir.'",
  `a: txt('Kesinlikle. Zengin QR Menü entegrasyonumuz ile müşterileriniz masadaki kodu okutarak alerjen detaylarına kadar menüyü inceleyebilir ve garson beklemeden doğrudan mutfağa interaktif sipariş gönderebilir.', 'Absolutely. With our Rich QR Menu integration, your customers can scan the code on the table, examine the menu down to allergen details, and send an interactive order directly to the kitchen without waiting for a waiter.', 'Απολύτως. Με την ενσωμάτωσή μας στο Rich QR Menu, οι πελάτες σας μπορούν να σαρώσουν τον κωδικό στο τραπέζι, να εξετάσουν το μενού μέχρι τις λεπτομέρειες για τα αλλεργιογόνα και να στείλουν μια διαδραστική παραγγελία απευθείας στην κουζίνα χωρίς να περιμένουν σερβιτόρο.')`
);

fs.writeFileSync(f, content);
console.log("Done HoReCaLanding fixes");
