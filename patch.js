const fs = require('fs');
const file = 'src/pages/StoreDashboard/settings/SettingsEStoresTab.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update Merchant ID label
content = content.replace(
  /{t\.hepsiburadaMerchantId \|\| 'Merchant ID \(Mağaza ID\)'}/g,
  "{t.hepsiburadaMerchantId || 'Mağaza ID (Merchant ID)'}"
);

// Update API Key label
content = content.replace(
  /{t\.hepsiburadaApiKey \|\| 'API Key \(Username \/ Entegratör Adı\)'}/g,
  "{t.hepsiburadaApiKey || 'Entegratör Kullanıcı Adı'}"
);
content = content.replace(
  /placeholder="Entegratör Kullanıcı Adı"/g,
  'placeholder="Örn: lookprice_dev"'
);

// Update API Secret label
content = content.replace(
  /{t\.hepsiburadaApiSecret \|\| 'API Secret \(Password\)'}/g,
  "{t.hepsiburadaApiSecret || 'Servis Anahtarı (Secret Key)'}"
);

// Add the info alert
const infoAlert = `
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4 flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 leading-relaxed">
                  <strong>Entegrasyon Kurulumu:</strong> Hepsiburada Satıcı Panelinizde <em>Entegrasyon &gt; Entegratör Bilgileri</em> sayfasına gidin. 
                  Yeni entegratör ekle diyerek <strong>lookprice_dev</strong> kullanıcısını seçin. Ekrandaki <strong>Mağaza ID</strong> ve size özel üretilen <strong>Servis Anahtarını</strong> aşağıdaki alanlara girin. Entegratör Kullanıcı Adı kısmına <strong>lookprice_dev</strong> yazmalısınız.
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">`;

content = content.replace(
  /<div className="grid grid-cols-1 md:grid-cols-3 gap-4">/g,
  infoAlert
);

fs.writeFileSync(file, content);
