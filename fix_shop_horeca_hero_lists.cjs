const fs = require('fs');

let f = 'src/pages/ShopLanding.tsx';
let content = fs.readFileSync(f, 'utf8');

content = content.replace(
  `"Hızlı barkodlu/barkodsuz dokunmatik POS satış ekranı"`,
  `txt("Hızlı barkodlu/barkodsuz dokunmatik POS satış ekranı", "Fast barcode/barcode-free touch POS sales screen", "Γρήγορη οθόνη πωλήσεων POS αφής με barcode/χωρίς barcode")`
);
content = content.replace(
  `"Renk, beden ve dinamik varyasyon bazlı gelişmiş stok takibi"`,
  `txt("Renk, beden ve dinamik varyasyon bazlı gelişmiş stok takibi", "Advanced stock tracking based on color, size, and dynamic variation", "Προηγμένη παρακολούθηση αποθέματος βάσει χρώματος, μεγέθους και δυναμικής παραλλαγής")`
);
content = content.replace(
  `"Entegre resmi e-Fatura / e-Arşiv ve çoklu dövizli kasa yönetimi"`,
  `txt("Entegre resmi e-Fatura / e-Arşiv ve çoklu dövizli kasa yönetimi", "Integrated official e-Invoice / e-Archive and multi-currency cash register management", "Ενσωματωμένο επίσημο e-Invoice / e-Archive και διαχείριση ταμειακής μηχανής πολλαπλών νομισμάτων")`
);
fs.writeFileSync(f, content);


f = 'src/pages/HoReCaLanding.tsx';
content = fs.readFileSync(f, 'utf8');

content = content.replace(
  `"Çevrimdışı (offline-first) kesintisiz çalışma mimarisi"`,
  `txt("Çevrimdışı (offline-first) kesintisiz çalışma mimarisi", "Offline-first continuous working architecture", "Αρχιτεκτονική συνεχούς λειτουργίας offline-first")`
);
content = content.replace(
  `"Masa ve el terminalleri arasında real-time çift yönlü veri transferi"`,
  `txt("Masa ve el terminalleri arasında real-time çift yönlü veri transferi", "Real-time two-way data sync between tables and handheld units", "Αμφίδρομος συγχρονισμός δεδομένων πραγματικού χρόνου")`
);
content = content.replace(
  `"Farklı departmanlara (Mutfak, Bar, Fırın) anlık sipariş yönlendirme"`,
  `txt("Farklı departmanlara (Mutfak, Bar, Fırın) anlık sipariş yönlendirme", "Instant order routing to different departments (Kitchen, Bar, Oven)", "Άμεση δρομολόγηση παραγγελιών σε διαφορετικά τμήματα (Κουζίνα, Μπαρ)")`
);

fs.writeFileSync(f, content);
console.log("Done checking checklists 2");
