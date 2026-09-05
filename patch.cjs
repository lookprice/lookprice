const fs = require('fs');
const file = 'src/pages/StoreDashboard/settings/SettingsEStoresTab.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace using literal strings instead of regex to avoid escape issues
content = content.replace(
  "{t.hepsiburadaMerchantId || 'Merchant ID (Mağaza ID)'}",
  "{t.hepsiburadaMerchantId || 'Mağaza ID (Merchant ID)'}"
);

content = content.replace(
  "{t.hepsiburadaApiKey || 'API Key (Username / Entegratör Adı)'}",
  "{t.hepsiburadaApiKey || 'Entegratör Kullanıcı Adı'}"
);

content = content.replace(
  'placeholder="Entegratör Kullanıcı Adı"',
  'placeholder="Örn: lookprice_dev"'
);

content = content.replace(
  "{t.hepsiburadaApiSecret || 'API Secret (Password)'}",
  "{t.hepsiburadaApiSecret || 'Servis Anahtarı (Secret Key)'}"
);

const infoAlert = `
              <div className="bg-blue-50/50 border border-blue-200/50 rounded-xl p-4 mb-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 leading-relaxed font-medium">
                  <strong>Entegrasyon Kurulumu:</strong> Hepsiburada Satıcı Panelinizde <em className="not-italic font-bold">Entegrasyon &gt; Entegratör Bilgileri</em> sayfasına gidin. 
                  Yeni entegratör ekle diyerek <strong className="text-blue-700">lookprice_dev</strong> kullanıcısını seçin. Ekrandaki <strong className="text-blue-700">Mağaza ID</strong> ve size özel üretilen <strong className="text-blue-700">Servis Anahtarını</strong> aşağıya yapıştırın. (Kullanıcı Adı: lookprice_dev olmalıdır)
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">`;

content = content.replace(
  '<div className="grid grid-cols-1 md:grid-cols-3 gap-4">',
  infoAlert
);

fs.writeFileSync(file, content);
