const fs = require('fs');

let f = 'src/pages/StoreDashboard/index.tsx';
let content = fs.readFileSync(f, 'utf8');

// Replacements
content = content.replace(/isTr \? "Portföy & İlan" : "Portfolios & Listings"/g, "txt('Portföy & İlan', 'Portfolios & Listings', 'Χαρτοφυλάκιο & Αγγελίες')");
content = content.replace(/isTr \? 'Gayrimenkul Portföyü' : 'Real Estate Portfolio'/g, "txt('Gayrimenkul Portföyü', 'Real Estate Portfolio', 'Χαρτοφυλάκιο Ακινήτων')");
content = content.replace(/isTr \? 'Oto Galeri \/ Araçlar' : 'Automotive \/ Vehicles'/g, "txt('Oto Galeri / Araçlar', 'Automotive / Vehicles', 'Αντιπροσωπεία / Οχήματα')");
content = content.replace(/isTr \? "Finans & Operasyon" : "Finance & Operations"/g, "txt('Finans & Operasyon', 'Finance & Operations', 'Οικονομικά & Λειτουργίες')");
content = content.replace(/isTr \? 'Gelir & Gider \/ Kasa' : 'Finances & Cash Flow'/g, "txt('Gelir & Gider / Kasa', 'Finances & Cash Flow', 'Έσοδα & Έξοδα / Ταμείο')");
content = content.replace(/isTr \? "Personel & Şube" : "Staff & Branches"/g, "txt('Personel & Şube', 'Staff & Branches', 'Προσωπικό & Υποκαταστήματα')");
content = content.replace(/isTr \? "Personel & Şube Yönetimi" : "Staff & Branch CRM"/g, "txt('Personel & Şube Yönetimi', 'Staff & Branch CRM', 'Διαχείριση Προσωπικού & Υποκαταστημάτων')");
content = content.replace(/isTr \? "Mülk Sahibi & Yatırımcı CRM" : "Property Owner & Investor CRM"/g, "txt('Mülk Sahibi & Yatırımcı CRM', 'Property Owner & Investor CRM', 'CRM Ιδιοκτητών & Επενδυτών')");
content = content.replace(/isTr \? "Yetki Devri \(Tapu\)" : "Authority Transfer"/g, "txt('Yetki Devri (Tapu)', 'Authority Transfer', 'Μεταβίβαση Εξουσιοδότησης')");
content = content.replace(/isTr \? "İstatistik & Rapor" : "Analytics & Logs"/g, "txt('İstatistik & Rapor', 'Analytics & Logs', 'Στατιστικά & Αναφορές')");
content = content.replace(/isTr \? \(isAutomotive \? "Motorlu Taşıtlar & Haber Radarı" : "İmar & Haber Radarı"\) : "Radar & Alerts"/g, "txt(isAutomotive ? 'Motorlu Taşıtlar & Haber Radarı' : 'İmar & Haber Radarı', 'Radar & Alerts', 'Ραντάρ & Ειδοποιήσεις')");
content = content.replace(/isTr \? "SEO Sayfaları" : "SEO Pages"/g, "txt('SEO Sayfaları', 'SEO Pages', 'Σελίδες SEO')");
content = content.replace(/isTr \? 'Web Sitesi Oluştur' : 'Website Generator'/g, "txt('Web Sitesi Oluştur', 'Website Generator', 'Δημιουργία Ιστοσελίδας')");
content = content.replace(/isTr \? "Operasyonlar" : "Operations"/g, "txt('Operasyonlar', 'Operations', 'Λειτουργίες')");
content = content.replace(/isTr \? 'Filo Yönetimi' : 'Fleet Management'/g, "txt('Filo Yönetimi', 'Fleet Management', 'Διαχείριση Στόλου')");
content = content.replace(/isTr \? "Finans" : "Finance"/g, "txt('Finans', 'Finance', 'Οικονομικά')");
content = content.replace(/isTr \? 'İptal Sebebi' : 'Cancellation Reason'/g, "txt('İptal Sebebi', 'Cancellation Reason', 'Λόγος Ακύρωσης')");
content = content.replace(/isTr \? 'İptal nedenini girin\.\.\.' : 'Enter cancellation reason\.\.\.'/g, "txt('İptal nedenini girin...', 'Enter cancellation reason...', 'Εισαγάγετε τον λόγο ακύρωσης...')");
content = content.replace(/isTr \? 'İptal Et' : 'Cancel'/g, "txt('İptal Et', 'Cancel', 'Ακύρωση')");
content = content.replace(/isTr \? 'Çalışan Oturumu & Rolü' : 'Staff Session & Role'/g, "txt('Çalışan Oturumu & Rolü', 'Staff Session & Role', 'Συνεδρία Προσωπικού & Ρόλος')");
content = content.replace(/isTr \? 'Terminal Yetkilendirme Modeli' : 'Terminal Authorization Model'/g, "txt('Terminal Yetkilendirme Modeli', 'Terminal Authorization Model', 'Μοντέλο Εξουσιοδότησης Τερματικού')");
content = content.replace(/isTr \? 'Yönetici' : 'Manager'/g, "txt('Yönetici', 'Manager', 'Διευθυντής')");
content = content.replace(/isTr \? 'Kasiyer' : 'Cashier'/g, "txt('Kasiyer', 'Cashier', 'Ταμίας')");
content = content.replace(/isTr \? 'Garson' : 'Waiter'/g, "txt('Garson', 'Waiter', 'Σερβιτόρος')");
content = content.replace(/isTr \? '4 Haneli Giriş PIN Kodu' : '4-Digit Entry PIN'/g, "txt('4 Haneli Giriş PIN Kodu', '4-Digit Entry PIN', '4-ψήφιο PIN Εισόδου')");
content = content.replace(/isTr \? 'Hatalı Şifre!' : 'Incorrect PIN!'/g, "txt('Hatalı Şifre!', 'Incorrect PIN!', 'Λανθασμένο PIN!')");
content = content.replace(/isTr \? 'TEMİZLE' : 'CLEAR'/g, "txt('TEMİZLE', 'CLEAR', 'ΚΑΘΑΡΙΣΜΟΣ')");
content = content.replace(/isTr \? 'GİRİŞ' : 'ENTER'/g, "txt('GİRİŞ', 'ENTER', 'ΕΙΣΟΔΟΣ')");
content = content.replace(/isTr \? 'PIN Kodlarını Güncelle' : 'Update PIN Codes'/g, "txt('PIN Kodlarını Güncelle', 'Update PIN Codes', 'Ενημέρωση Κωδικών PIN')");
content = content.replace(/isTr \? 'YÖNETİCİ ŞİFRE AYARLARI' : 'MANAGER PIN CONFIGURATION'/g, "txt('YÖNETİCİ ŞİFRE AYARLARI', 'MANAGER PIN CONFIGURATION', 'ΡΥΘΜΙΣΕΙΣ PIN ΔΙΕΥΘΥΝΤΗ')");
content = content.replace(/isTr \? 'Yönetici PIN Kodu' : 'Manager PIN'/g, "txt('Yönetici PIN Kodu', 'Manager PIN', 'PIN Διευθυντή')");
content = content.replace(/isTr \? 'Kasiyer PIN Kodu' : 'Cashier PIN'/g, "txt('Kasiyer PIN Kodu', 'Cashier PIN', 'PIN Ταμία')");
content = content.replace(/isTr \? 'Garson PIN Kodu' : 'Waiter PIN'/g, "txt('Garson PIN Kodu', 'Waiter PIN', 'PIN Σερβιτόρου')");
content = content.replace(/isTr \? 'Geri Dön' : 'Go Back'/g, "txt('Geri Dön', 'Go Back', 'Επιστροφή')");
content = content.replace(/isTr \? 'PIN kodları başarıyla kaydedildi!' : 'PIN codes updated successfully!'/g, "txt('PIN kodları başarıyla kaydedildi!', 'PIN codes updated successfully!', 'Οι κωδικοί PIN ενημερώθηκαν επιτυχώς!')");
content = content.replace(/isTr \? 'Değişiklikleri Kaydet' : 'Save Changes'/g, "txt('Değişiklikleri Kaydet', 'Save Changes', 'Αποθήκευση Αλλαγών')");

fs.writeFileSync(f, content);
