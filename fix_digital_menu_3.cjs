const fs = require('fs');
let f = 'src/pages/DigitalMenu.tsx';
let content = fs.readFileSync(f, 'utf8');

content = content.replace(
  '              Masa Seç',
  '              {t(\'Masa Seç\', \'Select Table\', \'Επιλογή Τραπεζιού\')}'
);

fs.writeFileSync(f, content);
console.log("Done phase 3");
