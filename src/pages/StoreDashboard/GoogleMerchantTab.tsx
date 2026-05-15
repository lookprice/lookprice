import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShoppingBag, 
  Settings, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Save,
  Info,
  Layers,
  Target,
  Globe,
  Truck,
  RotateCcw
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { api } from '@/services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '@/translations';

interface MerchantSettings {
  enabled: boolean;
  merchant_id: string;
  catalog_currency?: string;
}

const GoogleMerchantIntegration = () => {
  const { lang } = useLanguage();
  const { slug: urlSlug } = useParams();
  const t = translations[lang].dashboard;
  const isTr = lang === 'tr';
  
  const [settings, setSettings] = useState<MerchantSettings>({
    enabled: false,
    merchant_id: '',
    catalog_currency: 'TRY'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [storeSlug, setStoreSlug] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [settingsRes, storeRes] = await Promise.all([
        api.getGoogleMerchantSettings(),
        api.getBranding()
      ]);
      setSettings(settingsRes || { enabled: false, merchant_id: '', catalog_currency: 'TRY' });
      setStoreSlug(storeRes?.slug || '');
    } catch (err: any) {
      setError(isTr ? 'Ayarlar yüklenirken hata oluştu' : 'Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await api.saveGoogleMerchantSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || (isTr ? 'Kaydedilirken hata oluştu' : 'Error saving'));
    } finally {
      setSaving(false);
    }
  };

  const effectiveSlug = storeSlug || urlSlug || '';
  const origin = window.location.origin;
  
  const getCatalogUrl = () => {
    if (!effectiveSlug) return '';
    return `${origin}/api/public/store/${effectiveSlug}/catalog.xml`;
  };

  const catalogUrl = getCatalogUrl();
  const privacyUrl = `${origin}/api/public/store/${effectiveSlug}/privacy`;
  const aboutUrl = `${origin}/api/public/store/${effectiveSlug}/about-us`;
  const returnUrl = `${origin}/api/public/store/${effectiveSlug}/return-policy`;
  const shippingUrl = `${origin}/api/public/store/${effectiveSlug}/shipping-policy`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
            <ShoppingBag className="w-8 h-8 text-[#4285F4]" />
            Google Merchant Center Entegrasyonu
          </h1>
          <p className="text-gray-500 mt-1">
            Ürünlerinizi Google Alışveriş sonuçlarında ve Google reklamlarında listeleyin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://merchants.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            Google Merchant Center <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Settings className="w-5 h-5 text-[#4285F4]" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Genel Ayarlar</h2>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4285F4]"></div>
                <span className="ml-3 text-sm font-medium text-gray-900">
                  {settings.enabled ? 'Aktif' : 'Pasif'}
                </span>
              </label>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Target className="w-4 h-4" /> Merchant ID (Mağaza No)
                  </label>
                  <input
                    type="text"
                    value={settings.merchant_id}
                    onChange={(e) => setSettings({ ...settings, merchant_id: e.target.value })}
                    placeholder="Örn: 508612345"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500">
                    Merchant Center hesabınızın sağ üst köşesinde yazar.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="font-bold">₺</span> Para Birimi
                  </label>
                  <select
                    value={settings.catalog_currency || 'TRY'}
                    onChange={(e) => setSettings({ ...settings, catalog_currency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                  >
                    <option value="TRY">TRY - Türk Lirası</option>
                    <option value="USD">USD - Amerikan Doları</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>
              </div>

              {settings.enabled && (
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Paylaşılması Gereken Bağlantılar</h3>
                  
                  {/* Feed URL */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-600" /> Ürün Feed (XML) URL'si
                      </label>
                      <button
                        onClick={() => copyToClipboard(catalogUrl)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Kopyala
                      </button>
                    </div>
                    <div className="bg-white p-3 border border-gray-200 rounded text-xs font-mono text-gray-600 break-all select-all">
                      {catalogUrl}
                    </div>
                    <p className="mt-2 text-[11px] text-gray-500">
                      Merchant Center &gt; Ürünler &gt; Feedler bölümüne "Planlanmış Akış" olarak ekleyin.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Privacy */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-indigo-500" /> Gizlilik Politikası
                        </label>
                        <button onClick={() => copyToClipboard(privacyUrl)} className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="bg-white p-2 border border-gray-200 rounded text-[10px] font-mono text-gray-600 truncate">
                        {privacyUrl}
                      </div>
                    </div>

                    {/* About Us */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <Info className="w-4 h-4 text-emerald-500" /> Hakkımızda Sayfası
                        </label>
                        <button onClick={() => copyToClipboard(aboutUrl)} className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="bg-white p-2 border border-gray-200 rounded text-[10px] font-mono text-gray-600 truncate">
                        {aboutUrl}
                      </div>
                    </div>

                    {/* Return */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <RotateCcw className="w-4 h-4 text-rose-500" /> İade Politikası
                        </label>
                        <button onClick={() => copyToClipboard(returnUrl)} className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="bg-white p-2 border border-gray-200 rounded text-[10px] font-mono text-gray-600 truncate">
                        {returnUrl}
                      </div>
                    </div>

                    {/* Shipping */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <Truck className="w-4 h-4 text-amber-500" /> Kargo Politikası
                        </label>
                        <button onClick={() => copyToClipboard(shippingUrl)} className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="bg-white p-2 border border-gray-200 rounded text-[10px] font-mono text-gray-600 truncate">
                        {shippingUrl}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {success && (
                  <span className="text-sm text-green-600 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> Kaydedildi
                  </span>
                )}
                {error && (
                  <span className="text-sm text-red-600 flex items-center gap-1 font-bold">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </span>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 bg-[#4285F4] text-white rounded-xl hover:bg-[#3b78e7] disabled:opacity-50 transition-all font-bold shadow-lg shadow-blue-100"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Ayarları Kaydet
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-500" />
              Neden Gereklidir?
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Google Merchant Center, mağazanızı onaylamadan önce teknik olarak "Gizlilik, Hakkımızda, İade ve Kargo" politikalarınızın web sitenizde açıkça yer almasını şart koşar. 
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              LookPrice sizin yerinize bu sayfaları otomatik oluşturur. Yukarıdaki linkleri kopyalayıp Merchant Center "İşletme Bilgileri" kısmına eklemeniz yeterlidir.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-amber-900 flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Önemli Kontrol Listesi
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">Mağaza adı ve adresiniz Merchant Center ile aynı olmalıdır.</p>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">Ürün resimleri min. 250x250 piksel olmalıdır.</p>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">Fiyatlara KDV dahil ise Merchant settings'te de bunu belirtin.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleMerchantIntegration;
