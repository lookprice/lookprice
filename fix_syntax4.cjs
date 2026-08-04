const fs = require('fs');

let f = 'src/pages/StoreDashboard/settings/SettingsWebTab.tsx';
let content = fs.readFileSync(f, 'utf8');

content = content.replace(
    /\{"\* " \+ txt\('Bu ayarlar web sitenizdeki filtreleme ve ürün detaylarındaki başlıkları değiştirir\.', 'These settings change the filtering and product detail headings on your website\.', 'Αυτές οι ρυθμίσεις αλλάζουν το φιλτράρισμα και τις επικεφαλίδες λεπτομερειών προϊόντος στον ιστότοπό σας\.'\)\}\n\s*:\s*"\*\s*These settings change the titles in filtering and product details on your website\."\}/m,
    "{\"\* \" + txt('Bu ayarlar web sitenizdeki filtreleme ve ürün detaylarındaki başlıkları değiştirir.', 'These settings change the filtering and product detail headings on your website.', 'Αυτές οι ρυθμίσεις αλλάζουν το φιλτράρισμα και τις επικεφαλίδες λεπτομερειών προϊόντος στον ιστότοπό σας.')}"
);

// also let's fix placeholder="{txt(...)}" issue
content = content.replace(/placeholder="\{txt\((.*?)\)\}"/g, "placeholder={txt($1)}");

fs.writeFileSync(f, content);
