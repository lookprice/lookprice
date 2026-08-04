const fs = require('fs');

let f = 'src/pages/StoreDashboard/settings/SettingsStoreOpsTab.tsx';
let content = fs.readFileSync(f, 'utf8');

content = content.replace("  const t = translations || {};", "  const t = translations || {};\n  const txt = (tr: string, en: string, el: string) => {\n    if (lang === 'tr') return tr;\n    if (lang === 'el') return el;\n    return en;\n  };");

content = content.replace(/t\.crossExchangeRates \|\| 'Çapraz Kurlar'/g, "txt('Çapraz Kurlar', 'Cross Exchange Rates', 'Συναλλαγματικές Ισοτιμίες')");
content = content.replace(/>Vergi Ayarları</g, ">{txt('Vergi Ayarları', 'Tax Settings', 'Ρυθμίσεις Φόρων')}<");
content = content.replace(/>Varsayılan KDV Oranı \(%\)</g, ">{txt('Varsayılan KDV Oranı (%)', 'Default VAT Rate (%)', 'Προεπιλεγμένος Συντελεστής ΦΠΑ (%)')}<");
content = content.replace(/>Kategori KDV Kuralları</g, ">{txt('Kategori KDV Kuralları', 'Category VAT Rules', 'Κανόνες ΦΠΑ ανά Κατηγορία')}<");
content = content.replace(/>Kargo Ayarları</g, ">{txt('Kargo Ayarları', 'Shipping Settings', 'Ρυθμίσεις Μεταφορικών')}<");
content = content.replace(/>Mağazadan Teslimat \(Rezervasyon\) Aktif Et</g, ">{txt('Mağazadan Teslimat (Rezervasyon) Aktif Et', 'Enable In-Store Pickup (Reservation)', 'Ενεργοποίηση Παραλαβής από το Κατάστημα (Κράτηση)')}<");
content = content.replace(/>Kafe \/ Restoran Ayarları</g, ">{txt('Kafe / Restoran Ayarları', 'Cafe / Restaurant Settings', 'Ρυθμίσεις Καφέ / Εστιατορίου')}<");
content = content.replace(/>Masa Sayısı</g, ">{txt('Masa Sayısı', 'Number of Tables', 'Αριθμός Τραπεζιών')}<");
content = content.replace(/>Mekanınızdaki toplam masa sayısını belirtin\. Bu sayı Fast POS \/ Masalar ekranında görünecektir\.</g, ">{txt('Mekanınızdaki toplam masa sayısını belirtin. Bu sayı Fast POS / Masalar ekranında görünecektir.', 'Specify the total number of tables in your venue. This number will appear on the Fast POS / Tables screen.', 'Καθορίστε τον συνολικό αριθμό τραπεζιών στον χώρο σας. Αυτός ο αριθμός θα εμφανιστεί στην οθόνη Γρήγορο POS / Τραπέζια.')}<");
content = content.replace(/>Toplu Fiyat Güncelleme</g, ">{txt('Toplu Fiyat Güncelleme', 'Bulk Price Update', 'Μαζική Ενημέρωση Τιμών')}<");
content = content.replace(/>Tüm Ürünler</g, ">{txt('Tüm Ürünler', 'All Products', 'Όλα τα Προϊόντα')}<");
content = content.replace(/>Kategori Bazlı</g, ">{txt('Kategori Bazlı', 'Category Based', 'Βάσει Κατηγορίας')}<");
content = content.replace(/>İşlem Tipi</g, ">{txt('İşlem Tipi', 'Operation Type', 'Τύπος Λειτουργίας')}<");
content = content.replace(/>Yüzde \(%\)</g, ">{txt('Yüzde (%)', 'Percentage (%)', 'Ποσοστό (%)')}<");
content = content.replace(/>Yön</g, ">{txt('Yön', 'Direction', 'Κατεύθυνση')}<");
content = content.replace(/>Artır</g, ">{txt('Artır', 'Increase', 'Αύξηση')}<");
content = content.replace(/>Değer</g, ">{txt('Değer', 'Value', 'Αξία')}<");
content = content.replace(/>Fiyatları Güncelle</g, ">{txt('Fiyatları Güncelle', 'Update Prices', 'Ενημέρωση Τιμών')}<");


fs.writeFileSync(f, content);
