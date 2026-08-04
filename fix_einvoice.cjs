const fs = require('fs');
let f = 'src/pages/StoreDashboard/settings/SettingsEInvoiceTab.tsx';
let content = fs.readFileSync(f, 'utf8');

if (!content.includes('const txt = ')) {
    content = content.replace("}) => {\n", "}) => {\n  const txt = (tr: string, en: string, el: string) => {\n    if (lang === 'tr') return tr;\n    if (lang === 'el') return el;\n    return en;\n  };\n");
}

content = content.replace(/>Diyalogo \(Yakında\)<\/option>/g, ">{txt('Diyalogo (Yakında)', 'Diyalogo (Coming Soon)', 'Diyalogo (Σύντομα)')}</option>");
content = content.replace(/placeholder="Kullanıcı adınızı girin"/g, "placeholder={txt('Kullanıcı adınızı girin', 'Enter your username', 'Εισάγετε το όνομα χρήστη σας')}");
content = content.replace(/placeholder="Örn: 1234567890"/g, "placeholder={txt('Örn: 1234567890', 'e.g. 1234567890', 'π.χ. 1234567890')}");
content = content.replace(/placeholder="Örn: Kadıköy"/g, "placeholder={txt('Örn: Kadıköy', 'e.g. Kadikoy', 'π.χ. Kadikoy')}");
content = content.replace(/>E-Fatura Kullanıcı ID \(Tenant ID\)<\/label>/g, ">{txt('E-Fatura Kullanıcı ID (Tenant ID)', 'E-Invoice User ID (Tenant ID)', 'E-Invoice User ID (Tenant ID)')}</label>");
content = content.replace(/placeholder="Örn: 210"/g, "placeholder={txt('Örn: 210', 'e.g. 210', 'π.χ. 210')}");
content = content.replace(/placeholder="Örn: 00000000-0000-0000-0000-000000000000"/g, "placeholder={txt('Örn: 00000000-0000-0000-0000-000000000000', 'e.g. 00000000-0000-0000-0000-000000000000', 'π.χ. 00000000-0000-0000-0000-000000000000')}");
content = content.replace(/>E-Arşiv UUID \(GİB\)<\/label>/g, ">{txt('E-Arşiv UUID (GİB)', 'E-Archive UUID (GIB)', 'E-Archive UUID (GIB)')}</label>");
content = content.replace(/>E-Fatura Gönderici Birim Alias \(GB\)<\/label>/g, ">{txt('E-Fatura Gönderici Birim Alias (GB)', 'E-Invoice Sender Unit Alias (GB)', 'E-Invoice Sender Unit Alias (GB)')}</label>");
content = content.replace(/>E-Arşiv Kullanıcı Adı<\/label>/g, ">{txt('E-Arşiv Kullanıcı Adı', 'E-Archive Username', 'E-Archive Όνομα Χρήστη')}</label>");
content = content.replace(/>E-Fatura Ön Eki \(Örn: GAP\)<\/label>/g, ">{txt('E-Fatura Ön Eki (Örn: GAP)', 'E-Invoice Prefix (e.g. GAP)', 'E-Invoice Πρόθεμα (π.χ. GAP)')}</label>");
content = content.replace(/>E-Arşiv Ön Eki \(Örn: GEA\)<\/label>/g, ">{txt('E-Arşiv Ön Eki (Örn: GEA)', 'E-Archive Prefix (e.g. GEA)', 'E-Archive Πρόθεμα (π.χ. GEA)')}</label>");

content = content.replace(
    /lang === 'tr'\s*\?\s*'Önemli: iysapi.mysoft.com.tr adresi IYS izinleri içindir, e-fatura için kullanılamaz\. Özel bir adresiniz yoksa boş bırakın\.'\s*:\s*'Important: iysapi.mysoft.com.tr address is for IYS permissions, cannot be used for e-invoice. Leave blank if you don\\'t have a custom address\.'/g,
    "txt('Önemli: iysapi.mysoft.com.tr adresi IYS izinleri içindir, e-fatura için kullanılamaz. Özel bir adresiniz yoksa boş bırakın.', 'Important: iysapi.mysoft.com.tr address is for IYS permissions, cannot be used for e-invoice. Leave blank if you don\\'t have a custom address.', 'Σημαντικό: Η διεύθυνση iysapi.mysoft.com.tr είναι για άδειες IYS, δεν μπορεί να χρησιμοποιηθεί για ηλεκτρονικό τιμολόγιο. Αφήστε κενό εάν δεν έχετε προσαρμοσμένη διεύθυνση.')"
);


fs.writeFileSync(f, content);
