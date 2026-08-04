const fs = require('fs');

let f = 'src/pages/DigitalMenu.tsx';
let content = fs.readFileSync(f, 'utf8');

content = content.replace(
  '{isTr ? "Trendler" : "Trending"}',
  '{t("Trendler", "Trending", "Τάσεις")}'
);

content = content.replace(
  '{isTr ? "Trendler" : "Trending"}',
  '{t("Trendler", "Trending", "Τάσεις")}'
);

content = content.replace(
  '{isTr ? "Ürün" : "Products"}',
  '{t("Ürün", "Products", "Προϊόντα")}'
);

content = content.replace(
  '{isTr ? "POPÜLER" : "POPULAR"}',
  '{t("POPÜLER", "POPULAR", "ΔΗΜΟΦΙΛΗ")}'
);

content = content.replace(
  'title={isTr ? "Reçeteyi Gör" : "See Recipe"}',
  'title={t("Reçeteyi Gör", "See Recipe", "Δείτε τη Συνταγή")}'
);

content = content.replace(
  '{pHasVars ? (isTr ? "Seçenek Seç" : "Select Option") : (isTr ? "Ekle" : "Add")}',
  '{pHasVars ? t("Seçenek Seç", "Select Option", "Επιλογή") : t("Ekle", "Add", "Προσθήκη")}'
);

content = content.replace(
  '{isTr ? "REÇETE" : "RECIPE"}',
  '{t("REÇETE", "RECIPE", "ΣΥΝΤΑΓΗ")}'
);

content = content.replace(
  '{pHasVars ? (isTr ? "Seç" : "Select") : (isTr ? "Ekle" : "Add")}',
  '{pHasVars ? t("Seç", "Select", "Επιλογή") : t("Ekle", "Add", "Προσθήκη")}'
);

content = content.replace(
  '{isTr ? "Eşleşen ürün bulunamadı." : "No matching products found."}',
  '{t("Eşleşen ürün bulunamadı.", "No matching products found.", "Δεν βρέθηκαν προϊόντα που να ταιριάζουν.")}'
);

content = content.replace(
  '{isTr ? "Farklı bir arama kelimesi yazmayı veya kategorileri incelemeyi deneyebilirsiniz." : "Try typing another search term or exploring other categories."}',
  '{t("Farklı bir arama kelimesi yazmayı veya kategorileri incelemeyi deneyebilirsiniz.", "Try typing another search term or exploring other categories.", "Δοκιμάστε να πληκτρολογήσετε έναν άλλο όρο αναζήτησης ή να εξερευνήσετε άλλες κατηγορίες.")}'
);

content = content.replace(
  '{isTr ? \'Lütfen seçenek seçiniz\' : \'Please select an option\'}',
  '{t(\'Lütfen seçenek seçiniz\', \'Please select an option\', \'Παρακαλώ επιλέξτε μια επιλογή\')}'
);

content = content.replace(
  '{isTr ? \'Seçenekler\' : \'Options\'}',
  '{t(\'Seçenekler\', \'Options\', \'Επιλογές\')}'
);

content = content.replace(
  '{isTr ? \'Ekle\' : \'Add\'}',
  '{t(\'Ekle\', \'Add\', \'Προσθήκη\')}'
);

content = content.replace(
  '{isTr ? \'Kapat\' : \'Close\'}',
  '{t(\'Kapat\', \'Close\', \'Κλείσιμο\')}'
);

fs.writeFileSync(f, content);
console.log("Done phase 2");
