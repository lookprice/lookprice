const fs = require('fs');
let f = 'src/pages/DigitalMenu.tsx';
let content = fs.readFileSync(f, 'utf8');

content = content.replace(
  'placeholder="Özel istek / Not ekleyin (örn: Açık, demli, bol soslu)"',
  'placeholder={t(\'Özel istek / Not ekleyin (örn: Açık, demli, bol soslu)\', \'Add special request / Note (e.g., Light, strong, extra sauce)\', \'Προσθήκη ειδικού αιτήματος / Σημείωση (π.χ. Ελαφρύ, δυνατό, επιπλέον σάλτσα)\')}'
);

content = content.replace(
  'placeholder="Örn: 5, Bahçe 2, VIP"',
  'placeholder={t(\'Örn: 5, Bahçe 2, VIP\', \'e.g. 5, Garden 2, VIP\', \'π.χ. 5, Κήπος 2, VIP\')}'
);

fs.writeFileSync(f, content);
console.log("Done phase 6");
