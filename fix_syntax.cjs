const fs = require('fs');

let f = 'src/pages/StoreDashboard/settings/SettingsWebTab.tsx';
let content = fs.readFileSync(f, 'utf8');

content = content.replace(
    /\{lang === "tr"[\s\S]*?\: "💡 If the store name contains 'lookprice', the system automatically applies premium fallbacks\."\}/m,
    "{\"💡 \" + txt(\"Mağaza ismi 'lookprice' içerirse sistem otomatik olarak seçkin yerel firma fallbacks uygular.\", \"If the store name contains 'lookprice', the system automatically applies premium local business fallbacks.\", \"Εάν το όνομα του καταστήματος περιέχει 'lookprice', το σύστημα εφαρμόζει αυτόματα εναλλακτικές επιλογές κορυφαίων τοπικών επιχειρήσεων.\")}"
);

fs.writeFileSync(f, content);
