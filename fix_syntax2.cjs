const fs = require('fs');

let f = 'src/pages/StoreDashboard/settings/SettingsWebTab.tsx';
let content = fs.readFileSync(f, 'utf8');

content = content.replace(
    /\{lang === "tr"\s*\?\s*"\*\s*\{txt\('Bu ayarlar web sitenizdeki filtreleme ve ürün detaylarındaki başlıkları değiştirir\.', 'These settings change the filtering and product detail headings on your website\.', 'Αυτές οι ρυθμίσεις αλλάζουν το φιλτράρισμα και τις επικεφαλίδες λεπτομερειών προϊόντος στον ιστότοπό σας\.'\)\}"/m,
    "{\"* \" + txt('Bu ayarlar web sitenizdeki filtreleme ve ürün detaylarındaki başlıkları değiştirir.', 'These settings change the filtering and product detail headings on your website.', 'Αυτές οι ρυθμίσεις αλλάζουν το φιλτράρισμα και τις επικεφαλίδες λεπτομερειών προϊόντος στον ιστότοπό σας.')}"
);

fs.writeFileSync(f, content);
