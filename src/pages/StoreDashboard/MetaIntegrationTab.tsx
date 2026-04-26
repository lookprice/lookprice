import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Facebook, 
  Instagram, 
  Settings, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Save,
  Info,
  Layers,
  ShoppingBag,
  Target
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { api } from '@/services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '@/translations';

interface MetaSettings {
  enabled: boolean;
  pixel_id: string;
  catalog_id: string;
  catalog_currency?: string;
}

const MetaIntegration = () => {
  const { lang } = useLanguage();
  const { slug: urlSlug } = useParams();
  const t = translations[lang].dashboard;
  const [settings, setSettings] = useState<MetaSettings>({
    enabled: false,
    pixel_id: '',
    catalog_id: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [storeSlug, setStoreSlug] = useState('');
  const [customDomain, setCustomDomain] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [settingsRes, storeRes] = await Promise.all([
        api.getMetaSettings(),
        api.getBranding()
      ]);
      setSettings(settingsRes || { enabled: false, pixel_id: '', catalog_id: '' });
      setStoreSlug(storeRes?.slug || '');
      setCustomDomain(storeRes?.custom_domain || '');
    } catch (err: any) {
      setError(t.metaIntegration.loadingError);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await api.saveMetaSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || t.metaIntegration.error);
    } finally {
      setSaving(false);
    }
  };

  const effectiveSlug = storeSlug || urlSlug || '';
  
  // Create a more robust catalog URL
  const getCatalogUrl = () => {
    if (!effectiveSlug) return '';
    
    // If we are on a custom domain dashboard, origin already points to the custom domain
    // If we are on the main platform, origin is lookprice.net
    const origin = window.location.origin;
    return `${origin}/api/public/store/${effectiveSlug}/catalog.xml`;
  };

  const catalogUrl = getCatalogUrl();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Facebook className="w-8 h-8 text-[#1877F2]" />
            {t.metaIntegration.title}
          </h1>
          <p className="text-gray-500 mt-1">
            {t.metaIntegration.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://business.facebook.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Meta Business Suite <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Settings className="w-5 h-5 text-[#1877F2]" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{t.metaIntegration.settings}</h2>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1877F2]"></div>
                <span className="ml-3 text-sm font-medium text-gray-900">
                  {settings.enabled ? (lang === 'tr' ? 'Aktif' : 'Active') : (lang === 'tr' ? 'Pasif' : 'Inactive')}
                </span>
              </label>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Target className="w-4 h-4" /> {t.metaIntegration.pixelId}
                  </label>
                  <input
                    type="text"
                    value={settings.pixel_id}
                    onChange={(e) => setSettings({ ...settings, pixel_id: e.target.value })}
                    placeholder="Örn: 123456789012345"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500">
                    {t.metaIntegration.pixelIdDesc}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Layers className="w-4 h-4" /> {t.metaIntegration.catalogId}
                  </label>
                  <input
                    type="text"
                    value={settings.catalog_id}
                    onChange={(e) => setSettings({ ...settings, catalog_id: e.target.value })}
                    placeholder="Örn: 987654321098765"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500">
                    {t.metaIntegration.catalogIdDesc}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="font-bold">₺</span> Katalog Para Birimi
                  </label>
                  <select
                    value={settings.catalog_currency || 'TRY'}
                    onChange={(e) => setSettings({ ...settings, catalog_currency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="TRY">TRY - Türk Lirası</option>
                    <option value="USD">USD - Amerikan Doları</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - İngiliz Sterlini</option>
                  </select>
                  <p className="text-xs text-red-500 mt-1">
                    Önemli: Facebook Mağazanızın para birimi ne ise onu seçin. Aksi takdirde "Para Birimi Uyuşmazlığı" hatası alırsınız!
                  </p>
                </div>
              </div>

              {settings.enabled && (
                <div className="mt-6 flex flex-col gap-4">
                  {/* Catalog URL */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-orange-500" /> {t.metaIntegration.feedUrl}
                      </label>
                      <button
                        onClick={() => copyToClipboard(catalogUrl)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> {t.metaIntegration.copy}
                      </button>
                    </div>
                    <div className="bg-white p-3 border border-gray-200 rounded text-xs font-mono text-gray-600 break-all">
                      {catalogUrl}
                    </div>
                    <div className="mt-3 flex items-start gap-2 text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-100">
                      <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <p>
                        {t.metaIntegration.feedUrlDesc}
                      </p>
                    </div>
                  </div>

                  {/* Information Box indicating LookPrice is the Website for Ads */}
                  <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <h4 className="text-sm font-medium text-green-900 mb-2 flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" /> Web Sitelerindeki Ürünlerin URL'leri Hakkında
                    </h4>
                    <p className="text-xs text-green-800 leading-relaxed">
                      Sistemimize yüklediğiniz ürünlerin kendilerine ait bir web sayfasının veya linkinin olmasına gerek yoktur! LookPrice, ürünleriniz için otomatik olarak dışarıya açık bir E-ticaret vitrini (web sayfası) oluşturur.
                    </p>
                    <p className="text-xs text-green-800 leading-relaxed mt-2">
                      Meta (Facebook/Instagram), oluşturulan kataloğunuzu okuduğunda, her bir ürünün URL'si olarak otomatik olarak sizin <strong>LookPrice vitrininizdeki ürün sayfasını</strong> kaydeder. Böylece reklamlara tıklayan müşteriler doğrudan LookPrice vitrininize yönlendirilir.
                    </p>
                  </div>

                  {/* Privacy Policy URL for Meta */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Info className="w-4 h-4 text-indigo-500" /> Gizlilik URL'si (Privacy Policy)
                      </label>
                      <button
                        onClick={() => copyToClipboard(`${window.location.origin}/api/public/store/${effectiveSlug}/privacy`)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> {t.metaIntegration.copy}
                      </button>
                    </div>
                    <div className="bg-white p-3 border border-gray-200 rounded text-xs font-mono text-gray-600 break-all">
                      {`${window.location.origin}/api/public/store/${effectiveSlug}/privacy`}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Meta Commerce Manager mağazanızı onaylamak için bir "Gizlilik Politikası (Privacy Policy)" linkine ihtiyaç duyar. Yukarıdaki size özel statik bağlantıyı, Meta Formunda "Privacy Policy URL" alanına yapıştırabilirsiniz. (Düzeltmek isterseniz Mağaza Ayarları &gt; Yasal Sayfalar bölümünden KVKK içeriğini düzenleyebilirsiniz).
                    </p>
                  </div>

                  {/* Checkout URL for Meta */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-emerald-600" /> Web Sitesi Ödeme URL'si (Checkout URL Template)
                      </label>
                      <button
                        onClick={() => copyToClipboard(`${window.location.origin}/s/${effectiveSlug}/direct-checkout?id={{product.id}}&qty={{quantity}}`)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> {t.metaIntegration.copy}
                      </button>
                    </div>
                    <div className="bg-white p-3 border border-gray-200 rounded text-xs font-mono text-gray-600 break-all">
                      {`${window.location.origin}/s/${effectiveSlug}/direct-checkout?id={{product.id}}&qty={{quantity}}`}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Eğer Meta Commerce Manager kurulumunda Facebook mağazanızdan doğrudan "Web Sitesinde Ödemeyi" seçip, bir <strong>"Ödeme URL'si (Checkout URL)"</strong> ayarlamanız gerekiyorsa, yukarıdaki metni kopyalayıp ilgili alana yapıştırabilirsiniz. Değişkenleri değiştirmeyin.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {success && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> {t.metaIntegration.saved}
                  </span>
                )}
                {error && (
                  <span className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </span>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-[#1877F2] text-white rounded-lg hover:bg-[#166fe5] disabled:opacity-50 transition-colors font-medium"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {t.metaIntegration.save}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">{t.metaIntegration.setupSteps}</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">1</div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">{t.metaIntegration.step1Title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{t.metaIntegration.step1Desc}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">2</div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">{t.metaIntegration.step2Title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{t.metaIntegration.step2Desc}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">3</div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">{t.metaIntegration.step3Title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{t.metaIntegration.step3Desc}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">4</div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">{t.metaIntegration.step4Title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{t.metaIntegration.step4Desc}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">

          {/* Facebook Pain Relief Box */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-indigo-900 flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-indigo-600" />
              Meta (Facebook) Karmaşasına Rehber
            </h3>
            <div className="space-y-4">
              <div className="bg-white p-3 rounded shadow-sm text-sm border-l-4 border-yellow-400">
                <span className="font-bold text-gray-800 block mb-1">1. "Ürün Para Birimi Uyuşmazlığı" Hatası:</span>
                <p className="text-gray-600 text-xs">Facebook Commerce Manager'da mağaza açarken seçtiğiniz para birimi ile XML içindeki para birimi farklı olduğunda çıkar. <strong>Çözüm:</strong> Sol taraftaki ayarlardan "Katalog Para Birimi"ni Facebook'ta seçtiğiniz para birimi ile aynı yapın (Örn: TRY) ve XML'i Facebook'tan tekrar çektirin.</p>
              </div>

              <div className="bg-white p-3 rounded shadow-sm text-sm border-l-4 border-blue-400">
                <span className="font-bold text-gray-800 block mb-1">2. Pixel ID'mi Nerede Bulacağım?</span>
                <p className="text-gray-600 text-xs">Meta Business Suite &gt; Ayarlar (Sol alt dişli) &gt; İşletme Ayarları &gt; Veri Kaynakları &gt; Pikseller (veya Veri Setleri) bölümüne girin. Oradaki 15 haneli numaradır.</p>
              </div>

              <div className="bg-white p-3 rounded shadow-sm text-sm border-l-4 border-green-400">
                <span className="font-bold text-gray-800 block mb-1">3. Katalog ID'mi Nerede Bulacağım?</span>
                <p className="text-gray-600 text-xs">Commerce Manager'a girin. Sol üstte kataloğunuzun adına tıklayın. Veya Ayarlar &gt; Katalog sekmesine gidin. Orada "Katalog Kimliği" (Catalog ID) yazar.</p>
              </div>

              <div className="bg-white p-3 rounded shadow-sm text-sm border-l-4 border-purple-400">
                <span className="font-bold text-gray-800 block mb-1">4. XML URL'sini Nereye Ekleyeceğim?</span>
                <p className="text-gray-600 text-xs">Commerce Manager &gt; Katalog &gt; Veri Kaynakları (Data Sources) &gt; "Data Feed Ekle" seçin. "Planlanmış Akış (Scheduled feed)" diyerek LookPrice XML linkini oraya yapıştırın. Saatlik veya günlük güncellemeyi seçin.</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1877F2]/5 rounded-xl border border-[#1877F2]/10 p-6 space-y-4">
            <h3 className="font-semibold text-[#1877F2] flex items-center gap-2">
              <Instagram className="w-5 h-5" /> {t.metaIntegration.instagramShopping}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t.metaIntegration.instagramShoppingDesc}
            </p>
            <ul className="text-xs text-gray-600 space-y-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> {t.metaIntegration.benefit1}</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> {t.metaIntegration.benefit2}</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> {t.metaIntegration.benefit3}</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" /> {t.metaIntegration.qualityGuide}
            </h3>
            <p className="text-sm text-gray-500">
              {t.metaIntegration.qualityGuideDesc}
            </p>
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">{t.metaIntegration.imageStandards}</h4>
                <ul className="text-xs text-amber-700 space-y-1 list-disc pl-4">
                  <li>{t.metaIntegration.imageStandard1}</li>
                  <li>{t.metaIntegration.imageStandard2}</li>
                  <li>{t.metaIntegration.imageStandard3}</li>
                </ul>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">{t.metaIntegration.productInfo}</h4>
                <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
                  <li>{t.metaIntegration.productInfo1}</li>
                  <li>{t.metaIntegration.productInfo2}</li>
                  <li>{t.metaIntegration.productInfo3}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Info className="w-5 h-5 text-gray-400" /> {t.metaIntegration.resources}
            </h3>
            <div className="space-y-3">
              <a href="https://developers.facebook.com/docs/marketing-api/catalog" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm">
                <span>{t.metaIntegration.resource1}</span>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>
              <a href="https://www.facebook.com/business/help/120325381656392" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm">
                <span>{t.metaIntegration.resource2}</span>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetaIntegration;
