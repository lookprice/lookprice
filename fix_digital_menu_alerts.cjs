const fs = require('fs');
let f = 'src/pages/DigitalMenu.tsx';
let content = fs.readFileSync(f, 'utf8');

content = content.replace(
  'alert("Lütfen siparişiniz için bir masa seçin veya \'Garson Masası\' seçeneğini işaretleyin.");',
  'alert(t("Lütfen siparişiniz için bir masa seçin veya \'Garson Masası\' seçeneğini işaretleyin.", "Please select a table for your order or check the \'Waiter Table\' option.", "Επιλέξτε ένα τραπέζι για την παραγγελία σας ή επιλέξτε την επιλογή \'Τραπέζι Σερβιτόρου\'."));'
);

content = content.replace(
  'alert("Sipariş verilirken bir hata oluştu. Lütfen tekrar deneyin.");',
  'alert(t("Sipariş verilirken bir hata oluştu. Lütfen tekrar deneyin.", "An error occurred while placing the order. Please try again.", "Παρουσιάστηκε σφάλμα κατά την παραγγελία. Παρακαλώ δοκιμάστε ξανά."));'
);

fs.writeFileSync(f, content);
console.log("Done fixing alerts");
