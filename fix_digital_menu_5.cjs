const fs = require('fs');
let f = 'src/pages/DigitalMenu.tsx';
let content = fs.readFileSync(f, 'utf8');

content = content.replace(
  '>Toplam Tutar<',
  '>{t(\'Toplam Tutar\', \'Total Amount\', \'Συνολικό Ποσό\')}<'
);

content = content.replace(
  '>Özel isteklerinizi ürün bazında belirtebilirsiniz<',
  '>{t(\'Özel isteklerinizi ürün bazında belirtebilirsiniz\', \'You can specify special requests on a per-product basis\', \'Μπορείτε να καθορίσετε ειδικά αιτήματα ανά προϊόν\')}<'
);

fs.writeFileSync(f, content);
console.log("Done phase 5");
