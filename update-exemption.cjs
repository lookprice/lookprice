const fs = require('fs');
let code = fs.readFileSync('routes/einvoice.ts', 'utf8');

const mapCode = `
const KDV_EXEMPTION_MAP: Record<string, string> = {
  "301": "301-11/1-a Mal İhracatı",
  "302": "302-11/1-b Hizmet İhracatı",
  "303": "303-11/1-c Roaming Hizmetleri",
  "311": "311-13/a Deniz, Hava ve Demiryolu Araçlarına İlişkin İstisna",
  "312": "312-13/b Liman ve Hava Meydanlarında Yapılan Hizmetler",
  "313": "313-13/c Altın, Gümüş, Platin vb. Arama İşletme ve Zenginleştirme",
  "314": "314-13/d Makine ve Teçhizat Teslimleri (Yatırım Teşvik)",
  "315": "315-13/e Limanlara Bağlantı Yapan Demiryolu Hatları İstisnası",
  "316": "316-13/f Ulusal Güvenlik Amaçlı Teslim ve Hizmetler",
  "317": "317-13/g Külçe Altın ve Gümüş Teslimleri",
  "318": "318-13/h Engellilerin Kullanımına Mahsus Araç ve Gereçler",
  "323": "323-13/k Teknoloji Geliştirme Bölgesinde Yapılan Teslimler",
  "324": "324-13/m Hastanelere Yapılan Teslim ve Hizmetler",
  "325": "325-13/i Ar-Ge Makineleri İstisnası",
  "350": "350-Diğerleri (Tam İstisna)",
  "201": "201-17/1 Kültür ve Eğitim Amacı Taşıyan İşlemler",
  "202": "202-17/2-a Sağlık, Çevre ve Sosyal Yardım Amaçlı İşlemler",
  "204": "204-17/2-c Yabancı Diplomatik Misyonlara Yapılan Teslimler",
  "207": "207-17/4-c Gümrük Antrepoları ve Geçici Depolama Yerleri",
  "208": "208-17/4-d Banka ve Sigorta Muameleleri",
  "211": "211-17/4-g Külçe Altın, Külçe Gümüş, Kıymetli Taş Teslimleri",
  "213": "213-17/4-i Serbest Bölgelerde Yapılan Fason İşler",
  "214": "214-17/4-ı Serbest Bölgelerde Verilen Hizmetler",
  "215": "215-17/4-j Boru Hattı ile Taşımacılık Hizmetleri",
  "221": "221-17/4-r Kurumların Aktifindeki Taşınmaz ve İştirak Hissesi",
  "223": "223-13/t Serbest Bölgelere İhraç Amaçlı Yük Taşıma",
  "225": "225-17/4-y Taşınmaz Satışları İstisnası",
  "226": "226-17/4-z Zirai Amaçlı Su Teslimleri",
  "235": "235-16/1-c Transit ve Gümrük Antrepo Rejimi",
  "250": "250-Diğerleri (Kısmi İstisna)"
};
`;

if (!code.includes('KDV_EXEMPTION_MAP')) {
  code = mapCode + '\n' + code;
}

// Replace simple "İstisna" with the proper mapped text
code = code.replace(/taxExemptionReason: "İstisna"/g, 'taxExemptionReason: KDV_EXEMPTION_MAP[exemptionCode] || (exemptionCode + "-İstisna")');
code = code.replace(/TaxExemptionReason: "İstisna"/g, 'TaxExemptionReason: KDV_EXEMPTION_MAP[exemptionCode] || (exemptionCode + "-İstisna")');
code = code.replace(/exemptionReason: "İstisna"/g, 'exemptionReason: KDV_EXEMPTION_MAP[exemptionCode] || (exemptionCode + "-İstisna")');

fs.writeFileSync('routes/einvoice.ts', code);
console.log("Successfully updated einvoice.ts with KDV_EXEMPTION_MAP");
