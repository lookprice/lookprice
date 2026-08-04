const fs = require('fs');

let f = 'src/pages/StoreDashboard/index.tsx';
let content = fs.readFileSync(f, 'utf8');

if (!content.includes("const txt =")) {
    content = content.replace("const isTr = lang === 'tr';", "const isTr = lang === 'tr';\n  const txt = (tr: string, en: string, el: string) => {\n    if (lang === 'tr') return tr;\n    if (lang === 'el') return el;\n    return en;\n  };");
}

content = content.replace(/isTr \? "Yedekleme & Kanallar" : "Backup & Channels"/g, "txt('Yedekleme & Kanallar', 'Backup & Channels', 'Δημιουργία Αντιγράφων & Κανάλια')");
content = content.replace(/isTr \? "Yedekleme" : "Backup"/g, "txt('Yedekleme', 'Backup', 'Δημιουργία Αντιγράφων')");
content = content.replace(/isTr \? "İstatistik & Blog" : "Analytics & Blog"/g, "txt('İstatistik & Blog', 'Analytics & Blog', 'Στατιστικά & Blog')");
content = content.replace(/isTr \? 'Bildirimler' : 'Notifications'/g, "txt('Bildirimler', 'Notifications', 'Ειδοποιήσεις')");
content = content.replace(/isTr \? "Blog" : "Blog"/g, "txt('Blog', 'Blog', 'Blog')");
content = content.replace(/isTr \? "S\.S\.S" : "FAQ"/g, "txt('S.S.S', 'FAQ', 'Συχνές Ερωτήσεις')");
content = content.replace(/isTr \? "Hızlı POS \/ Masalar" : "Fast POS \/ Tables"/g, "txt('Hızlı POS / Masalar', 'Fast POS / Tables', 'Γρήγορο POS / Τραπέζια')");
content = content.replace(/isTr \? "Ürün & Fiyat Listesi" : "Products"/g, "txt('Ürün & Fiyat Listesi', 'Products & Price List', 'Προϊόντα & Τιμοκατάλογος')");
content = content.replace(/isTr \? "Satış Faturaları" : "Sales Invoices"/g, "txt('Satış Faturaları', 'Sales Invoices', 'Τιμολόγια Πώλησης')");
content = content.replace(/isTr \? "e-İrsaliyeler" : "e-Waybills"/g, "txt('e-İrsaliyeler', 'e-Waybills', 'Ηλεκτρονικά Δελτία Αποστολής')");

fs.writeFileSync(f, content);
