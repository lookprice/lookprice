const fs = require('fs');

let f = 'src/pages/DigitalMenu.tsx';
let content = fs.readFileSync(f, 'utf8');

// Using replace function with regex for all the missing translations.

content = content.replace(
  '<p className="text-slate-600 font-medium">Menü yükleniyor...</p>',
  '<p className="text-slate-600 font-medium">{t(\'Menü yükleniyor...\', \'Loading menu...\', \'Φόρτωση μενού...\')}</p>'
);

content = content.replace(
  '<p className="text-slate-800 font-bold text-lg">Mağaza bulunamadı.</p>',
  '<p className="text-slate-800 font-bold text-lg">{t(\'Mağaza bulunamadı.\', \'Store not found.\', \'Το κατάστημα δεν βρέθηκε.\')}</p>'
);

content = content.replace(
  '<p className="text-slate-500 text-sm mt-1">QR kodu taratarak tekrar giriş yapmayı deneyebilirsiniz.</p>',
  '<p className="text-slate-500 text-sm mt-1">{t(\'QR kodu taratarak tekrar giriş yapmayı deneyebilirsiniz.\', \'You can try to log in again by scanning the QR code.\', \'Μπορείτε να δοκιμάσετε να συνδεθείτε ξανά σαρώνοντας τον κωδικό QR.\')}</p>'
);

content = content.replace(
  'Masa: {activeTableId}',
  '{t(\'Masa\', \'Table\', \'Τραπέζι\')}: {activeTableId}'
);

content = content.replace(
  'Masa Seçilmedi',
  '{t(\'Masa Seçilmedi\', \'No Table Selected\', \'Δεν επιλέχθηκε τραπέζι\')}'
);

content = content.replace(
  'Dijital Menü</span>',
  '{t(\'Dijital Menü\', \'Digital Menu\', \'Ψηφιακό Μενού\')}</span>'
);

content = content.replace(
  'placeholder={isTr ? "Menüde hızlıca ara..." : "Fast search in menu..."}',
  'placeholder={t("Menüde hızlıca ara...", "Fast search in menu...", "Γρήγορη αναζήτηση στο μενού...")}'
);

content = content.replace(
  '<p className="font-bold text-slate-800 text-sm">Masa Belirtilmedi</p>',
  '<p className="font-bold text-slate-800 text-sm">{t(\'Masa Belirtilmedi\', \'No Table Specified\', \'Δεν έχει καθοριστεί τραπέζι\')}</p>'
);

content = content.replace(
  '<p className="text-xs text-slate-500 font-medium mt-0.5 leading-tight">Siparişinizin mutfağa iletilebilmesi için masa seçin.</p>',
  '<p className="text-xs text-slate-500 font-medium mt-0.5 leading-tight">{t(\'Siparişinizin mutfağa iletilebilmesi için masa seçin.\', \'Select a table so your order can be sent to the kitchen.\', \'Επιλέξτε ένα τραπέζι για να σταλεί η παραγγελία σας στην κουζίνα.\')}</p>'
);

content = content.replace(
  '>Masa Seç<',
  '>{t(\'Masa Seç\', \'Select Table\', \'Επιλογή Τραπεζιού\')}<'
);

content = content.replace(
  '{isTr ? "Arama Sonuçları" : "Search Results"}',
  '{t("Arama Sonuçları", "Search Results", "Αποτελέσματα Αναζήτησης")}'
);

content = content.replace(
  '{selectedCategory === "all" ? (isTr ? "Tüm Menü" : "Full Menu") : selectedCategory}',
  '{selectedCategory === "all" ? t("Tüm Menü", "Full Menu", "Πλήρες Μενού") : selectedCategory}'
);

content = content.replace(
  'Siparişi İncele',
  '{t(\'Siparişi İncele\', \'Review Order\', \'Επανεξέταση Παραγγελίας\')}'
);

content = content.replace(
  '<h2 className="text-lg font-extrabold text-slate-800">Siparişinizi İnceleyin</h2>',
  '<h2 className="text-lg font-extrabold text-slate-800">{t(\'Siparişinizi İnceleyin\', \'Review Your Order\', \'Ελέγξτε την Παραγγελία σας\')}</h2>'
);

content = content.replace(
  '<span className="text-sm font-bold text-slate-500">Sipariş Toplamı</span>',
  '<span className="text-sm font-bold text-slate-500">{t(\'Sipariş Toplamı\', \'Order Total\', \'Σύνολο Παραγγελίας\')}</span>'
);

content = content.replace(
  'Siparişi Onayla ve Gönder',
  '{t(\'Siparişi Onayla ve Gönder\', \'Confirm and Send Order\', \'Επιβεβαίωση και Αποστολή Παραγγελίας\')}'
);

content = content.replace(
  '<p className="font-extrabold text-sm">Siparişiniz Alındı!</p>',
  '<p className="font-extrabold text-sm">{t(\'Siparişiniz Alındı!\', \'Order Received!\', \'Λήφθηκε η Παραγγελία!\')}</p>'
);

content = content.replace(
  '<p className="text-xs text-emerald-100 mt-0.5">Siparişiniz başarıyla mutfağa ve kasaya iletildi.</p>',
  '<p className="text-xs text-emerald-100 mt-0.5">{t(\'Siparişiniz başarıyla mutfağa ve kasaya iletildi.\', \'Your order was successfully sent to the kitchen and checkout.\', \'Η παραγγελία σας στάλθηκε επιτυχώς στην κουζίνα και στο ταμείο.\')}</p>'
);

content = content.replace(
  '<h2 className="text-lg font-extrabold text-slate-800">Masa Seçimi / Girişi</h2>',
  '<h2 className="text-lg font-extrabold text-slate-800">{t(\'Masa Seçimi / Girişi\', \'Table Selection / Entry\', \'Επιλογή / Εισαγωγή Τραπεζιού\')}</h2>'
);

content = content.replace(
  '<p className="text-xs text-slate-400 font-medium mt-0.5">Siparişinizin hangi masaya ait olduğunu belirleyin</p>',
  '<p className="text-xs text-slate-400 font-medium mt-0.5">{t(\'Siparişinizin hangi masaya ait olduğunu belirleyin\', \'Determine which table your order belongs to\', \'Καθορίστε σε ποιο τραπέζι ανήκει η παραγγελία σας\')}</p>'
);

content = content.replace(
  '<h3 className="font-extrabold text-xs text-amber-950 uppercase tracking-wider">Garson Masası (Masa Seçilmeden)</h3>',
  '<h3 className="font-extrabold text-xs text-amber-950 uppercase tracking-wider">{t(\'Garson Masası (Masa Seçilmeden)\', \'Waiter Table (No Table Selected)\', \'Τραπέζι Σερβιτόρου (Χωρίς Επιλογή Τραπεζιού)\')}</h3>'
);

content = content.replace(
  '<p className="text-[11px] text-amber-800 font-medium">Masa belli değilse veya garson tarafından alınıyorsa seçin</p>',
  '<p className="text-[11px] text-amber-800 font-medium">{t(\'Masa belli değilse veya garson tarafından alınıyorsa seçin\', \'Select if the table is unknown or taken by the waiter\', \'Επιλέξτε εάν το τραπέζι είναι άγνωστο ή λαμβάνεται από τον σερβιτόρο\')}</p>'
);

content = content.replace(
  '{activeTableId === "Garson Masası" ? "SEÇİLİ" : "Garson Seç"}',
  '{activeTableId === "Garson Masası" ? t("SEÇİLİ", "SELECTED", "ΕΠΙΛΕΓΜΕΝΟ") : t("Garson Seç", "Select Waiter", "Επιλογή Σερβιτόρου")}'
);

content = content.replace(
  '<h3 className="font-bold text-xs text-rose-800 uppercase tracking-wider">Manuel Masa Tanımlama</h3>',
  '<h3 className="font-bold text-xs text-rose-800 uppercase tracking-wider">{t(\'Manuel Masa Tanımlama\', \'Manual Table Definition\', \'Χειροκίνητος Ορισμός Τραπεζιού\')}</h3>'
);

content = content.replace(
  '>Onayla<',
  '>{t(\'Onayla\', \'Confirm\', \'Επιβεβαίωση\')}<'
);

content = content.replace(
  '<h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Tanımlı Masalar</h3>',
  '<h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">{t(\'Tanımlı Masalar\', \'Defined Tables\', \'Ορισμένα Τραπέζια\')}</h3>'
);

content = content.replace(
  'placeholder="Masa Ara..."',
  'placeholder={t("Masa Ara...", "Search Table...", "Αναζήτηση Τραπεζιού...")}'
);

fs.writeFileSync(f, content);
console.log("Done phase 1");
