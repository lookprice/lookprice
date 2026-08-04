const fs = require('fs');

let f = 'src/pages/StoreDashboard/settings/SettingsWebTab.tsx';
let content = fs.readFileSync(f, 'utf8');

if (!content.includes("const txt =")) {
    content = content.replace("export const SettingsWebTab = ({", "export const SettingsWebTab = ({\n");
    content = content.replace("  lang,", "  lang,\n");
    content = content.replace("}) => {", "}) => {\n  const txt = (tr: string, en: string, el: string) => {\n    if (lang === 'tr') return tr;\n    if (lang === 'el') return el;\n    return en;\n  };");
}

content = content.replace(/Moda \/ Lüks/g, "{txt('Moda / Lüks', 'Fashion / Luxury', 'Μόδα / Πολυτέλεια')}");
content = content.replace(/Mağazanızın en üstündeki reklam alanına birden fazla görsel ekleyip sıralayabilir, üzerindeki metinlerin konumunu ve görünürlüğünü yönetebilirsiniz\./g, "{txt('Mağazanızın en üstündeki reklam alanına birden fazla görsel ekleyip sıralayabilir, üzerindeki metinlerin konumunu ve görünürlüğünü yönetebilirsiniz.', 'You can add multiple images to the advertising area at the top of your store, order them, and manage the position and visibility of the texts on them.', 'Μπορείτε να προσθέσετε πολλές εικόνες στον διαφημιστικό χώρο στο πάνω μέρος του καταστήματός σας, να τις παραγγείλετε και να διαχειριστείτε τη θέση και την ορατότητα των κειμένων σε αυτές.')}");
content = content.replace(/Mağaza ismi 'lookprice' içerirse sistem otomatik olarak seçkin yerel firma fallbacks uygular\./g, "{txt(\"Mağaza ismi 'lookprice' içerirse sistem otomatik olarak seçkin yerel firma fallbacks uygular.\", \"If the store name contains 'lookprice', the system automatically applies premium local business fallbacks.\", \"Εάν το όνομα του καταστήματος περιέχει 'lookprice', το σύστημα εφαρμόζει αυτόματα εναλλακτικές επιλογές κορυφαίων τοπικών επιχειρήσεων.\")}");
content = content.replace(/>YÜKLE</g, ">{txt('YÜKLE', 'UPLOAD', 'ΜΕΤΑΦΟΡΤΩΣΗ')}<");
content = content.replace(/Görsel URL veya base64\.\.\./g, "{txt('Görsel URL veya base64...', 'Image URL or base64...', 'Διεύθυνση URL εικόνας ή base64...')}");
content = content.replace(/Örn: #portfolio veya #contact/g, "{txt('Örn: #portfolio veya #contact', 'e.g., #portfolio or #contact', 'π.χ. #portfolio ή #contact')}");
content = content.replace(/Bu ayarlar web sitenizdeki filtreleme ve ürün detaylarındaki başlıkları değiştirir\./g, "{txt('Bu ayarlar web sitenizdeki filtreleme ve ürün detaylarındaki başlıkları değiştirir.', 'These settings change the filtering and product detail headings on your website.', 'Αυτές οι ρυθμίσεις αλλάζουν το φιλτράρισμα και τις επικεφαλίδες λεπτομερειών προϊόντος στον ιστότοπό σας.')}");
content = content.replace(/Google Analytics veya Google Tag Manager \(GTM\) aracılığıyla mağazanızı dijital olarak analiz edin\./g, "{txt('Google Analytics veya Google Tag Manager (GTM) aracılığıyla mağazanızı dijital olarak analiz edin.', 'Digitally analyze your store via Google Analytics or Google Tag Manager (GTM).', 'Αναλύστε ψηφιακά το κατάστημά σας μέσω του Google Analytics ή του Google Tag Manager (GTM).')}");
content = content.replace(/Örn: G-XXXXXXXXXX\. Sadece ID'yi girin\./g, "{txt(\"Örn: G-XXXXXXXXXX. Sadece ID'yi girin.\", \"e.g., G-XXXXXXXXXX. Just enter the ID.\", \"π.χ. G-XXXXXXXXXX. Απλώς εισάγετε το ID.\")}");
content = content.replace(/Örn: GTM-XXXXXXX\. Sadece ID'yi girin\./g, "{txt(\"Örn: GTM-XXXXXXX. Sadece ID'yi girin.\", \"e.g., GTM-XXXXXXX. Just enter the ID.\", \"π.χ. GTM-XXXXXXX. Απλώς εισάγετε το ID.\")}");
content = content.replace(/>Google Search Console \(GSC\) Doğrulama Kodu</g, ">{txt('Google Search Console (GSC) Doğrulama Kodu', 'Google Search Console (GSC) Verification Code', 'Κωδικός επαλήθευσης Google Search Console (GSC)')}<");
content = content.replace(/google-site-verification meta etiketinin content değeri/g, "{txt('google-site-verification meta etiketinin content değeri', 'Content value of the google-site-verification meta tag', 'Τιμή περιεχομένου της μετα-ετικέτας google-site-verification')}");
content = content.replace(/Google Search Console'daki meta etiketinin \(\"google-site-verification\"\) içindeki kod\/content değeridir\./g, "{txt('Google Search Console\\'daki meta etiketinin (\"google-site-verification\") içindeki kod/content değeridir.', 'It is the code/content value in the meta tag (\"google-site-verification\") in Google Search Console.', 'Είναι η τιμή κωδικού/περιεχομένου στη μετα-ετικέτα (\"google-site-verification\") στο Google Search Console.')}");


fs.writeFileSync(f, content);
