const fs = require('fs');
let f = 'src/pages/StoreDashboard/settings/SettingsPosTab.tsx';
let content = fs.readFileSync(f, 'utf8');

if (!content.includes('const txt = ')) {
    content = content.replace("}) => {\n", "}) => {\n  const txt = (tr: string, en: string, el: string) => {\n    if (lang === 'tr') return tr;\n    if (lang === 'el') return el;\n    return en;\n  };\n");
}

content = content.replace(/>POS Köprüsü<\/h3>/g, ">{txt('POS Köprüsü', 'POS Bridge', 'Γέφυρα POS')}</h3>");
content = content.replace(/>Köprü IP Adresi<\/label>/g, ">{txt('Köprü IP Adresi', 'Bridge IP Address', 'Διεύθυνση IP Γέφυρας')}</label>");
content = content.replace(/>Bağlantı Portu<\/label>/g, ">{txt('Bağlantı Portu', 'Connection Port', 'Θύρα Σύνδεσης')}</label>");
content = content.replace(/>Terminal No \(Opsiyonel\)<\/label>/g, ">{txt('Terminal No (Opsiyonel)', 'Terminal No (Optional)', 'Αρ. Τερματικού (Προαιρετικό)')}</label>");
content = content.replace(/placeholder="192\.168\.1\.100"/g, "placeholder={txt('192.168.1.100', '192.168.1.100', '192.168.1.100')}");
content = content.replace(/placeholder="443"/g, "placeholder={txt('443', '443', '443')}");
content = content.replace(/placeholder="T001"/g, "placeholder={txt('T001', 'T001', 'T001')}");

// There's a long text around line 267. Let's find it.
content = content.replace(
    /lang === 'tr'\s*\?\s*'LookPrice POS Köprüsü, yerel ağınızdaki fiziksel POS cihazları ile bulut sistemi arasında güvenli bir bağlantı kurar\. Bu ayar aktif olduğunda, yapılan satışlar otomatik olarak fiziksel terminale gönderilir\.'\s*:\s*'LookPrice POS Bridge establishes a secure connection between physical POS devices on your local network and the cloud system\. When this setting is active, sales are automatically sent to the physical terminal\.'/g,
    "txt('LookPrice POS Köprüsü, yerel ağınızdaki fiziksel POS cihazları ile bulut sistemi arasında güvenli bir bağlantı kurar. Bu ayar aktif olduğunda, yapılan satışlar otomatik olarak fiziksel terminale gönderilir.', 'LookPrice POS Bridge establishes a secure connection between physical POS devices on your local network and the cloud system. When this setting is active, sales are automatically sent to the physical terminal.', 'Η Γέφυρα LookPrice POS δημιουργεί μια ασφαλή σύνδεση μεταξύ των φυσικών συσκευών POS στο τοπικό σας δίκτυο και του συστήματος cloud. Όταν αυτή η ρύθμιση είναι ενεργή, οι πωλήσεις αποστέλλονται αυτόματα στο φυσικό τερματικό.')"
);

fs.writeFileSync(f, content);
