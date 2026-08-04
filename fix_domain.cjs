const fs = require('fs');
let f = 'src/pages/StoreDashboard/settings/SettingsDomainTab.tsx';
let content = fs.readFileSync(f, 'utf8');

if (!content.includes('const txt = ')) {
    content = content.replace("}) => {\n", "}) => {\n  const txt = (tr: string, en: string, el: string) => {\n    if (lang === 'tr') return tr;\n    if (lang === 'el') return el;\n    return en;\n  };\n");
}

content = content.replace(/placeholder="Örn: shop\.magazam\.com"/g, "placeholder={txt('Örn: shop.magazam.com', 'e.g. shop.mystore.com', 'π.χ. shop.mystore.com')}");
content = content.replace(/placeholder="Örn: user@example\.com"/g, "placeholder={txt('Örn: user@example.com', 'e.g. user@example.com', 'π.χ. user@example.com')}");
content = content.replace(/placeholder="Örn: 1234567890abcdef\.\.\."/g, "placeholder={txt('Örn: 1234567890abcdef...', 'e.g. 1234567890abcdef...', 'π.χ. 1234567890abcdef...')}");
content = content.replace(/placeholder="Örn: a1b2c3d4e5f6\.\.\."/g, "placeholder={txt('Örn: a1b2c3d4e5f6...', 'e.g. a1b2c3d4e5f6...', 'π.χ. a1b2c3d4e5f6...')}");

// Remove the `lang === "tr" ? "..." : "..."` strings and replace with `{txt()}` logic!
// Let's use regex for all the `lang === "tr" ?` ones we missed in the past, or use the fix script pattern.

content = content.replace(
    /lang === 'tr'\s*\?\s*"\* Domaininizi bağlamak için aşağıdaki otomatik sistemi kullanın\. SSL sertifikanız otomatik olarak oluşturulacaktır\."\s*:\s*"\* Use the automated system below to connect your domain\. Your SSL certificate will be generated automatically\."/g,
    "txt('* Domaininizi bağlamak için aşağıdaki otomatik sistemi kullanın. SSL sertifikanız otomatik olarak oluşturulacaktır.', '* Use the automated system below to connect your domain. Your SSL certificate will be generated automatically.', '* Χρησιμοποιήστε το παρακάτω αυτοματοποιημένο σύστημα για να συνδέσετε τον τομέα σας. Το πιστοποιητικό SSL σας θα δημιουργηθεί αυτόματα.')"
);

content = content.replace(
    /lang === 'tr'\s*\?\s*"Sistem anahtarları aktif\. Mağaza için özel anahtar gerekmez\."\s*:\s*"System keys are active\. No custom key required for the store\."/g,
    "txt('Sistem anahtarları aktif. Mağaza için özel anahtar gerekmez.', 'System keys are active. No custom key required for the store.', 'Τα κλειδιά συστήματος είναι ενεργά. Δεν απαιτείται προσαρμοσμένο κλειδί για το κατάστημα.')"
);

content = content.replace(
    /lang === 'tr'\s*\?\s*"DNS kayıtları onarıldı ve Gri Bulut moduna alındı\."\s*:\s*"DNS records have been repaired and set to Gray Cloud mode\."/g,
    "txt('DNS kayıtları onarıldı ve Gri Bulut moduna alındı.', 'DNS records have been repaired and set to Gray Cloud mode.', 'Οι εγγραφές DNS έχουν επισκευαστεί και έχουν οριστεί σε λειτουργία Γκρίζου Σύννεφου.')"
);

content = content.replace(
    /lang === 'tr'\s*\?\s*"Domaininizi aldığınız panelden aşağıdaki Name Server \(NS\) adreslerini tanımlayın\. Bu işlemden sonra domaininiz otomatik olarak aktif olacaktır\."\s*:\s*"Define the following Name Server \(NS\) addresses from the panel where you purchased your domain\. After this process, your domain will be activated automatically\."/g,
    "txt('Domaininizi aldığınız panelden aşağıdaki Name Server (NS) adreslerini tanımlayın. Bu işlemden sonra domaininiz otomatik olarak aktif olacaktır.', 'Define the following Name Server (NS) addresses from the panel where you purchased your domain. After this process, your domain will be activated automatically.', 'Ορίστε τις ακόλουθες διευθύνσεις Name Server (NS) από τον πίνακα όπου αγοράσατε τον τομέα σας. Μετά από αυτήν τη διαδικασία, ο τομέας σας θα ενεργοποιηθεί αυτόματα.')"
);

content = content.replace(
    /lang === 'tr'\s*\?\s*"Domaininiz sisteme kaydedildi\. Şimdi domain panelinizden A kaydını 216\.24\.57\.1 IP adresine yönlendirdiğinizden emin olun\."\s*:\s*"Your domain is registered in the system\. Now make sure you point the A record to the 216\.24\.57\.1 IP address from your domain panel\."/g,
    "txt('Domaininiz sisteme kaydedildi. Şimdi domain panelinizden A kaydını 216.24.57.1 IP adresine yönlendirdiğinizden emin olun.', 'Your domain is registered in the system. Now make sure you point the A record to the 216.24.57.1 IP address from your domain panel.', 'Ο τομέας σας είναι εγγεγραμμένος στο σύστημα. Τώρα βεβαιωθείτε ότι δείχνετε την εγγραφή A στη διεύθυνση IP 216.24.57.1 από τον πίνακα τομέα σας.')"
);

fs.writeFileSync(f, content);
