const fs = require('fs');
let f = 'src/pages/DigitalMenu.tsx';
let content = fs.readFileSync(f, 'utf8');

content = content.replace(
  'alert("Lütfen geçerli bir masa adı veya numarası girin.");',
  'alert(t("Lütfen geçerli bir masa adı veya numarası girin.", "Please enter a valid table name or number.", "Εισαγάγετε ένα έγκυρο όνομα ή αριθμό τραπεζιού."));'
);

fs.writeFileSync(f, content);
console.log("Done fixing alert 2");
