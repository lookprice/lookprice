const fs = require('fs');

let f = 'src/pages/AutoLanding.tsx';
let content = fs.readFileSync(f, 'utf8');

content = content.replace(
  'OTO GALERİ VİTRİN',
  `{txt('OTO GALERİ VİTRİN', 'AUTO GALLERY SHOWCASE', 'ΒΙΤΡΙΝΑ ΓΚΑΛΕΡΙ ΑΥΤΟΚΙΝΗΤΩΝ')}`
);
content = content.replace(
  'Dinamik Kur ve Portföy Senkronizasyonu',
  `{txt('Dinamik Kur ve Portföy Senkronizasyonu', 'Dynamic Exchange Rate and Portfolio Synchronization', 'Δυναμική Συναλλαγματική Ισοτιμία και Συγχρονισμός Χαρτοφυλακίου')}`
);
content = content.replace(
  'Araçlarınızı anlık Merkez Bankası döviz kurları ile eşitleyerek web sitenizde hatasız fiyatlandırın.',
  `{txt('Araçlarınızı anlık Merkez Bankası döviz kurları ile eşitleyerek web sitenizde hatasız fiyatlandırın.', 'Price your vehicles accurately on your website by synchronizing them with real-time Central Bank exchange rates.', 'Τιμολογήστε τα οχήματά σας με ακρίβεια στον ιστότοπό σας συγχρονίζοντάς τα με τις συναλλαγματικές ισοτιμίες της Κεντρικής Τράπεζας σε πραγματικό χρόνο.')}`
);

// Feature Highlights Section
content = content.replace(
  'Galeriniz İçin En Gelişmiş Özellikler',
  `{txt('Galeriniz İçin En Gelişmiş Özellikler', 'Most Advanced Features for Your Gallery', 'Τα πιο προηγμένα χαρακτηριστικά για τη γκαλερί σας')}`
);
content = content.replace(
  'AutoLP, geleneksel verimsiz yöntemleri geride bırakarak tamamen küresel galeri standartlarına göre inşa edilmiştir.',
  `{txt('AutoLP, geleneksel verimsiz yöntemleri geride bırakarak tamamen küresel galeri standartlarına göre inşa edilmiştir.', 'AutoLP is built entirely according to global gallery standards, leaving behind traditional inefficient methods.', 'Το AutoLP είναι κατασκευασμένο εξ ολοκλήρου σύμφωνα με τα παγκόσμια πρότυπα γκαλερί, αφήνοντας πίσω παραδοσιακές αναποτελεσματικές μεθόδους.')}`
);

fs.writeFileSync(f, content);
