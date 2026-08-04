const fs = require('fs');

// Fix the checklist in AutoLanding
let f = 'src/pages/AutoLanding.tsx';
let content = fs.readFileSync(f, 'utf8');

// I might have already fixed it, but just to be sure:
content = content.replace(
  `"Sterlin (GBP), EUR ve USD bazlı çoklu para birimi motoru"`,
  `txt("Sterlin (GBP), EUR ve USD bazlı çoklu para birimi motoru", "Multi-currency engine based on Sterling (GBP), EUR, and USD", "Μηχανή πολλαπλών νομισμάτων με βάση Στερλίνα (GBP), EUR και USD")`
);
content = content.replace(
  `"Gümrükleme, seyrüsefer ve koçan devir tarihlerine özel alarmlar"`,
  `txt("Gümrükleme, seyrüsefer ve koçan devir tarihlerine özel alarmlar", "Special alarms for customs clearance, navigation, and logbook transfer dates", "Ειδικοί συναγερμοί για εκτελωνισμό, πλοήγηση και ημερομηνίες μεταβίβασης βιβλίου καταγραφής")`
);
content = content.replace(
  `"Tek tıkla araç özelliklerini içeren PDF katalog ve broşür çıktısı"`,
  `txt("Tek tıkla araç özelliklerini içeren PDF katalog ve broşür çıktısı", "One-click PDF catalog and brochure output containing vehicle features", "Παραγωγή καταλόγου και φυλλαδίου PDF με ένα κλικ που περιέχει τα χαρακτηριστικά του οχήματος")`
);

fs.writeFileSync(f, content);

f = 'src/pages/REstateLanding.tsx';
content = fs.readFileSync(f, 'utf8');
content = content.replace(
  `"Türk Koçanı, Eşdeğer veya Tahsis tapu tiplerine özel filtreler"`,
  `txt("Türk Koçanı, Eşdeğer veya Tahsis tapu tiplerine özel filtreler", "Special filters for Turkish, Equivalent or Allocation title deed types", "Ειδικά φίλτρα για τύπους τίτλων ιδιοκτησίας Τουρκικού, Ισοδύναμου ή Κατανομής")`
);
content = content.replace(
  `"Fiyatları Sterlin (GBP) olarak girip anlık kurla TL/Euro/USD gösterme"`,
  `txt("Fiyatları Sterlin (GBP) olarak girip anlık kurla TL/Euro/USD gösterme", "Enter prices in Sterling (GBP) and display TL/Euro/USD with instant exchange rates", "Εισαγάγετε τιμές σε Στερλίνα (GBP) και εμφανίστε TL/Euro/USD με άμεσες συναλλαγματικές ισοτιμίες")`
);
content = content.replace(
  `"Müşterilerle biyometrik dijital imzalı yetki ve kapora sözleşmeleri"`,
  `txt("Müşterilerle biyometrik dijital imzalı yetki ve kapora sözleşmeleri", "Authorization and deposit agreements with biometric digital signatures with customers", "Συμφωνίες εξουσιοδότησης και προκαταβολής με βιομετρικές ψηφιακές υπογραφές με πελάτες")`
);
fs.writeFileSync(f, content);
console.log("Done checking checklists");
