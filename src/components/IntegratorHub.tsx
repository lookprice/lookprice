import React, { useState, useEffect } from 'react';
import { ShoppingBag, Key, Lock, RefreshCw, AlertCircle, Save, CheckCircle2, PackageCheck, FileText, Send, Layers, Tag, ArrowUpRight, Barcode, ListTree, Sparkles, HelpCircle } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';

export const IntegratorHub = () => {
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'inventory' | 'oms'>('catalog');
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);

  // Listing V2 Tracking
  const [listingTrackingId, setListingTrackingId] = useState<string>('');
  const [listingTaskStatus, setListingTaskStatus] = useState<any>(null);

  // Catalog V1/V2 State
  const [catalogTrackingId, setCatalogTrackingId] = useState<string>('');
  const [catalogTaskStatus, setCatalogTaskStatus] = useState<any>(null);
  const [fetchingCategories, setFetchingCategories] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [categoryAttributes, setCategoryAttributes] = useState<any[]>([]);
  const [fetchingAttributes, setFetchingAttributes] = useState(false);
  const [catalogSending, setCatalogSending] = useState(false);

  // Real Test SKUs for Inventory/Listing
  const [customSku1, setCustomSku1] = useState({
    merchantSku: '8681892240266',
    hepsiburadaSku: 'HBV0000114P92',
    name: 'Otom Audi A6 Özel Dikim Koltuk Kılıfı (Siyah)',
    price: 1850,
    stock: 15,
    dispatchTime: 1
  });

  const [customSku2, setCustomSku2] = useState({
    merchantSku: '8660743368267',
    hepsiburadaSku: 'HBV000010L77T',
    name: 'Lopard Apple Uyumlu Kordon',
    price: 349,
    stock: 45,
    dispatchTime: 1
  });

  // OMS Orders State
  const [fetchingOrders, setFetchingOrders] = useState(false);
  const [ordersResult, setOrdersResult] = useState<any>(null);
  const [simulatingOrder, setSimulatingOrder] = useState(false);
  const [simulatedOrderResult, setSimulatedOrderResult] = useState<any>(null);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await api.getIntegratorConfigs();
      setConfigs(res.data || []);
    } catch (e) {
      toast.error("Konfigürasyonlar yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  // --- CATALOG OPERATIONS ---
  const handleFetchCategories = async (env: 'sit' | 'production' = 'sit') => {
    setFetchingCategories(true);
    try {
      const res = await api.hepsiburadaV3GetCategories(env, 0, 50);
      if (res?.error) {
        toast.error(`Kategori hatası: ${res.error}`);
        return;
      }
      const list = Array.isArray(res?.data) ? res.data : (res?.data?.categories || res?.data?.items || []);
      setCategories(list);
      toast.success(`${list.length} adet kategori başarıyla yüklendi.`);
    } catch (err: any) {
      toast.error("Kategori sorgulama hatası: " + (err?.message || err));
    } finally {
      setFetchingCategories(false);
    }
  };

  const handleFetchAttributes = async (categoryId: string, env: 'sit' | 'production' = 'sit') => {
    if (!categoryId) return;
    setFetchingAttributes(true);
    try {
      const res = await api.hepsiburadaV3GetCategoryAttributes(env, categoryId);
      if (res?.error) {
        toast.error(`Özellik hatası: ${res.error}`);
        return;
      }
      const attrs = Array.isArray(res?.data) ? res.data : (res?.data?.attributes || []);
      setCategoryAttributes(attrs);
      toast.success(`Kategori #${categoryId} için ${attrs.length} özellik bulundu.`);
    } catch (err: any) {
      toast.error("Özellik sorgulama hatası: " + (err?.message || err));
    } finally {
      setFetchingAttributes(false);
    }
  };

  const handleSendSingleCatalogProduct = async (env: 'sit' | 'production' = 'sit') => {
    setCatalogSending(true);
    try {
      let catId = selectedCategoryId ? Number(selectedCategoryId) : 1000282;
      let currentAttrs = categoryAttributes;

      // If we don't have attributes loaded yet for this category, fetch them on the fly
      if ((!currentAttrs || currentAttrs.length === 0) && catId) {
        try {
          const attrRes = await api.hepsiburadaV3GetCategoryAttributes(env, catId);
          const fetched = Array.isArray(attrRes?.data) ? attrRes.data : (attrRes?.data?.attributes || []);
          if (fetched && fetched.length > 0) {
            currentAttrs = fetched;
            setCategoryAttributes(fetched);
          }
        } catch (e) {
          console.warn("Could not auto-fetch attributes:", e);
        }
      }
      
      // Build dynamic attributes satisfying mandatory requirements if available
      const dynamicAttributes: Record<string, any> = {
        "Garanti Süresi (Ay)": "24",
        "Renk": "Siyah"
      };

      if (currentAttrs && currentAttrs.length > 0) {
        currentAttrs.forEach((attr: any) => {
          const attrName = attr.name || attr.attributeName || attr.id;
          if (attrName) {
            if (attr.values && attr.values.length > 0) {
              const val = attr.values[0];
              dynamicAttributes[attrName] = val.value || val.name || (typeof val === 'string' ? val : "Standart");
            } else if (attr.type === 'number' || attr.type === 'numeric' || attr.type === 'integer') {
              dynamicAttributes[attrName] = 1;
            } else {
              dynamicAttributes[attrName] = "Standart";
            }
          }
        });
      }

      // Single test product payload
      const payload = [
        {
          categoryId: catId,
          merchantItemCode: customSku2.merchantSku || "8660743368267",
          name: customSku2.name || "Lopard Apple Watch Uyumlu Silikon Kordon (LookPrice Test)",
          brand: "Lopard",
          barcode: customSku2.merchantSku || "8660743368267",
          price: Number(customSku2.price) || 349,
          stock: Number(customSku2.stock) || 45,
          images: [
            { url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=60" }
          ],
          description: "<p>LookPrice Hepsiburada Entegratör Entegrasyonu Tekil Test Ürünüdür.</p>",
          attributes: dynamicAttributes
        }
      ];

      const res = await api.hepsiburadaV3ImportCatalog(env, payload);
      if (res?.error) {
        toast.error(`Katalog Hatası: ${res.error}`, { duration: 8000 });
        return;
      }
      if (res?.trackingId) {
        setCatalogTrackingId(res.trackingId);
        toast.success(`Tekil ürün kataloğa iletildi. Tracking ID: ${res.trackingId}`);
      } else {
        toast.success(res?.message || "Ürün kataloğa iletildi.");
      }
    } catch (err: any) {
      toast.error("Katalog gönderim hatası: " + (err?.message || err), { duration: 8000 });
    } finally {
      setCatalogSending(false);
    }
  };

  const handleSendVariantCatalogProducts = async (env: 'sit' | 'production' = 'sit') => {
    setCatalogSending(true);
    try {
      let catId = selectedCategoryId ? Number(selectedCategoryId) : 1000282;
      let currentAttrs = categoryAttributes;

      // Auto-fetch if empty
      if ((!currentAttrs || currentAttrs.length === 0) && catId) {
        try {
          const attrRes = await api.hepsiburadaV3GetCategoryAttributes(env, catId);
          const fetched = Array.isArray(attrRes?.data) ? attrRes.data : (attrRes?.data?.attributes || []);
          if (fetched && fetched.length > 0) {
            currentAttrs = fetched;
            setCategoryAttributes(fetched);
          }
        } catch (e) {
          console.warn("Could not auto-fetch attributes:", e);
        }
      }

      const variantGroupId = `VAR-GRP-${Date.now().toString().slice(-6)}`;

      const baseAttrs: Record<string, any> = {
        "Garanti Süresi (Ay)": "24",
        "Materyal": "Deri / Kumaş"
      };

      if (currentAttrs && currentAttrs.length > 0) {
        currentAttrs.forEach((attr: any) => {
          const attrName = attr.name || attr.attributeName || attr.id;
          if (attrName && attrName !== "Renk") {
            if (attr.values && attr.values.length > 0) {
              const val = attr.values[0];
              baseAttrs[attrName] = val.value || val.name || (typeof val === 'string' ? val : "Standart");
            } else if (attr.type === 'number' || attr.type === 'numeric' || attr.type === 'integer') {
              baseAttrs[attrName] = 1;
            } else {
              baseAttrs[attrName] = "Standart";
            }
          }
        });
      }

      // 2 Variant products under the same variantGroupID
      const payload = [
        {
          categoryId: catId,
          variantGroupID: variantGroupId,
          merchantItemCode: customSku1.merchantSku || "8681892240266",
          name: `${customSku1.name || 'Otom Audi A6 Koltuk Kılıfı'} - Siyah`,
          brand: "Otom",
          barcode: customSku1.merchantSku || "8681892240266",
          price: Number(customSku1.price) || 1850,
          stock: Number(customSku1.stock) || 15,
          images: [
            { url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60" }
          ],
          description: "<p>LookPrice Hepsiburada Test Ürünü - Siyah Varyantı.</p>",
          attributes: {
            ...baseAttrs,
            "Renk": "Siyah"
          }
        },
        {
          categoryId: catId,
          variantGroupID: variantGroupId,
          merchantItemCode: `${customSku1.merchantSku || "8681892240266"}-GRI`,
          name: `${customSku1.name || 'Otom Audi A6 Koltuk Kılıfı'} - Gri`,
          brand: "Otom",
          barcode: "8681892240267",
          price: Number(customSku1.price) || 1850,
          stock: 10,
          images: [
            { url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60" }
          ],
          description: "<p>LookPrice Hepsiburada Test Ürünü - Gri Varyantı.</p>",
          attributes: {
            ...baseAttrs,
            "Renk": "Gri"
          }
        }
      ];

      const res = await api.hepsiburadaV3ImportCatalog(env, payload);
      if (res?.error) {
        toast.error(`Katalog Hatası: ${res.error}`, { duration: 8000 });
        return;
      }
      if (res?.trackingId) {
        setCatalogTrackingId(res.trackingId);
        toast.success(`Varyantlı ürün grubu (${variantGroupId}) kataloğa iletildi. Tracking ID: ${res.trackingId}`);
      } else {
        toast.success(res?.message || "Varyantlı ürünler kataloğa iletildi.");
      }
    } catch (err: any) {
      toast.error("Varyantlı ürün gönderim hatası: " + (err?.message || err), { duration: 8000 });
    } finally {
      setCatalogSending(false);
    }
  };

  const handleCheckCatalogStatus = async (trackingId: string, env: 'sit' | 'production' = 'sit') => {
    if (!trackingId) return;
    try {
      const res = await api.hepsiburadaV3CheckCatalogStatus(env, trackingId);
      setCatalogTaskStatus(res);
      toast.info("Katalog aktarım durumu sorgulandı.");
    } catch (err: any) {
      toast.error("Durum sorgulama hatası: " + (err?.message || err));
    }
  };

  // --- INVENTORY OPERATIONS ---
  const handleSendSpecificProduct = async (productData: any, env: 'sit' | 'production' = 'sit') => {
    try {
      const payload = [{
        MerchantSku: productData.merchantSku,
        HepsiburadaSku: productData.hepsiburadaSku,
        Price: Number(productData.price),
        AvailableStock: Number(productData.stock),
        DispatchTime: Number(productData.dispatchTime || 1),
        MaximumPurchasableQuantity: 10
      }];

      const res = await api.hepsiburadaV3ImportListings(env, payload);
      if (res?.error) {
        toast.error(`Hata: ${res.error}`);
        return;
      }
      if (res?.trackingId) {
        setListingTrackingId(res.trackingId);
        toast.success(`'${productData.merchantSku}' güncellendi. Tracking ID: ${res.trackingId}`);
      } else if (res?.success) {
        toast.success(res.message || "İşlem başarıyla iletildi.");
      }
    } catch (err: any) {
      toast.error("İstek hatası: " + (err?.message || err));
    }
  };

  const handleSendBothProducts = async (env: 'sit' | 'production' = 'sit') => {
    try {
      const payload = [
        {
          MerchantSku: customSku1.merchantSku,
          HepsiburadaSku: customSku1.hepsiburadaSku,
          Price: Number(customSku1.price),
          AvailableStock: Number(customSku1.stock),
          DispatchTime: Number(customSku1.dispatchTime || 1),
          MaximumPurchasableQuantity: 10
        },
        {
          MerchantSku: customSku2.merchantSku,
          HepsiburadaSku: customSku2.hepsiburadaSku,
          Price: Number(customSku2.price),
          AvailableStock: Number(customSku2.stock),
          DispatchTime: Number(customSku2.dispatchTime || 1),
          MaximumPurchasableQuantity: 10
        }
      ];

      const res = await api.hepsiburadaV3ImportListings(env, payload);
      if (res?.error) {
        toast.error(`Hata: ${res.error}`);
        return;
      }
      if (res?.trackingId) {
        setListingTrackingId(res.trackingId);
        toast.success(`2 adet test ürünü Hepsiburada kuyruğuna iletildi. Tracking ID: ${res.trackingId}`);
      } else if (res?.success) {
        toast.success(res.message || "İşlem başarıyla iletildi.");
      }
    } catch (err: any) {
      toast.error("İstek hatası: " + (err?.message || err));
    }
  };

  const checkListingStatus = async (env: 'sit' | 'production', id: string) => {
    try {
      const res = await api.hepsiburadaV3CheckTaskStatus(env, id);
      if (res?.error) {
        toast.error(`Durum sorgulanamadı: ${res.error}`);
        return;
      }
      setListingTaskStatus(res);
      toast.info("Envanter durumu sorgulandı.");
    } catch (err: any) {
      toast.error("Durum sorgulama hatası: " + (err?.message || err));
    }
  };

  // --- OMS OPERATIONS ---
  const handleFetchLiveOrders = async (env: 'sit' | 'production') => {
    setFetchingOrders(true);
    setOrdersResult(null);
    try {
      const res = await api.hepsiburadaV3FetchOrders(env, { limit: 10 });
      if (res?.error) {
        toast.error(`OMS Hatası: ${res.error}`);
        return;
      }
      setOrdersResult(res);
      const count = res?.total ?? (Array.isArray(res?.orders) ? res.orders.length : 0);
      toast.success(`Hepsiburada OMS (${env.toUpperCase()}) bağlantısı başarılı. ${count} sipariş/paket bulundu.`);
    } catch (err: any) {
      toast.error("Sipariş sorgulama hatası: " + (err?.message || err));
    } finally {
      setFetchingOrders(false);
    }
  };

  const handleSimulateTestOrder = async () => {
    setSimulatingOrder(true);
    try {
      const res = await api.hepsiburadaV3SimulateOrder({
        env: 'sit',
        customerName: 'Serkan Erdekli (Hepsiburada SIT Test)',
        customerEmail: 'serkanerdekli@gmail.com',
        customerPhone: '+90 548 888 1234',
        sku: customSku1.merchantSku,
        productName: customSku1.name,
        price: customSku1.price,
        quantity: 1
      });
      if (res?.error) {
        toast.error(`Simülasyon Hatası: ${res.error}`);
        return;
      }
      setSimulatedOrderResult(res);
      toast.success(`Hepsiburada Test Siparişi (#${res.testOrderId}) oluşturuldu ve sisteme işlendi!`);
    } catch (err: any) {
      toast.error("Simülasyon hatası: " + (err?.message || err));
    } finally {
      setSimulatingOrder(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig.client_id || !editingConfig.client_secret) {
      toast.error("Lütfen Merchant ID ve Secret Key / API Şifresi alanlarını doldurun.");
      return;
    }
    try {
      await api.saveIntegratorConfig(editingConfig);
      toast.success("Konfigürasyon kaydedildi");
      setEditingConfig(null);
      fetchConfigs();
    } catch (e) {
      toast.error("Kaydetme başarısız");
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Merkezi Pazaryeri Entegratör Hub</h2>
            <span className="text-xs px-2.5 py-0.5 bg-orange-100 text-orange-800 font-bold rounded-full">
              Hepsiburada Test & Canlı Protokolü
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Katalog tanımlama, Envanter (fiyat/stok) revizyonu ve OMS sipariş akışı yönetimi</p>
        </div>
        <button 
          onClick={() => setEditingConfig({ marketplace: 'hepsiburada', env: 'sit', client_id: '', client_secret: '', config: { user_agent: 'enrakipsiz_dev' } })}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm self-start md:self-auto"
        >
          Yeni Konfigürasyon
        </button>
      </div>

      {/* Configs Card */}
      {loading ? (
        <div className="text-center py-6 text-slate-400 font-medium">Yükleniyor...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {configs.map((c) => (
            <div key={c.id} className="p-3.5 border border-slate-200 rounded-xl flex items-center justify-between hover:border-slate-300 transition-all bg-slate-50/70">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold uppercase text-xs text-slate-900">{c.marketplace}</p>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${c.env === 'production' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {c.env === 'production' ? 'CANLI (PROD)' : 'TEST (SIT)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">Merchant ID: {c.client_id}</p>
              </div>
              <button 
                onClick={() => setEditingConfig(c)}
                className="px-2.5 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold transition-all"
              >
                Düzenle
              </button>
            </div>
          ))}
        </div>
      )}

      {/* SUB-TABS NAVIGATION */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveSubTab('catalog')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeSubTab === 'catalog'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ListTree className="w-4 h-4" />
          1. Katalog & Ürün Tanımlama (Test Şartı)
        </button>

        <button
          onClick={() => setActiveSubTab('inventory')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeSubTab === 'inventory'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          2. Envanter (Fiyat & Stok Revizyonu)
        </button>

        <button
          onClick={() => setActiveSubTab('oms')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeSubTab === 'oms'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          3. OMS Sipariş & Fatura Akışı
        </button>
      </div>

      {/* TAB 1: CATALOG MANAGEMENT */}
      {activeSubTab === 'catalog' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Hepsiburada Katalog Entegrasyon & Onay Protokolü</span>
            </div>
            <p className="text-xs text-indigo-800 leading-relaxed">
              Hepsiburada test onayında <strong>en az 1 tekil</strong> ve <strong>1 varyantlı ürün (ortak variantGroupID ile)</strong> gönderilmelidir. Test ortamı (SIT) kategori ağacı canlı ortamdan farklıdır.
            </p>
          </div>

          {/* 1.1 Category & Attribute Explorer */}
          <div className="p-4 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">SIT Kategori & Zorunlu Özellikler (Attributes)</h4>
                <p className="text-xs text-slate-500">SIT ortamındaki kategori ağacını ve zorunlu alanları sorgulayın</p>
              </div>
              <button
                onClick={() => handleFetchCategories('sit')}
                disabled={fetchingCategories}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${fetchingCategories ? 'animate-spin' : ''}`} />
                {fetchingCategories ? 'Çekiliyor...' : 'SIT Kategorilerini Listele'}
              </button>
            </div>

            {categories.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Kategori Seçin (veya Manuel ID Girin)</label>
                    <div className="flex gap-1.5">
                      <select
                        className="w-full border border-slate-200 p-2 rounded-xl text-xs bg-white font-medium"
                        value={selectedCategoryId}
                        onChange={(e) => {
                          setSelectedCategoryId(e.target.value);
                          handleFetchAttributes(e.target.value, 'sit');
                        }}
                      >
                        <option value="">Kategori seçiniz...</option>
                        {categories.map((c: any) => (
                          <option key={c.categoryId || c.id} value={c.categoryId || c.id}>
                            {c.name || c.categoryName} (ID: {c.categoryId || c.id})
                          </option>
                        ))}
                      </select>
                      <input 
                        type="text"
                        placeholder="ID"
                        className="w-24 border border-slate-200 p-2 rounded-xl text-xs font-mono bg-white"
                        value={selectedCategoryId}
                        onChange={(e) => {
                          setSelectedCategoryId(e.target.value);
                          handleFetchAttributes(e.target.value, 'sit');
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Zorunlu / Seçili Özellikler</label>
                    <div className="p-2 border border-slate-200 rounded-xl text-xs bg-slate-50 min-h-[40px] max-h-32 overflow-y-auto">
                      {fetchingAttributes ? (
                        <span className="text-slate-400">Özellikler yükleniyor...</span>
                      ) : categoryAttributes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {categoryAttributes.map((attr: any, idx: number) => (
                            <span key={idx} className={`text-[10px] px-2 py-0.5 rounded font-mono ${attr.mandatory ? 'bg-rose-100 text-rose-800 font-bold' : 'bg-slate-200 text-slate-700'}`}>
                              {attr.name || attr.attributeName} {attr.mandatory ? '*' : ''}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Kategori seçildiğinde zorunlu nitelikler otomatik doldurulur ve gönderime eklenir.</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>SIT Test İpucu:</strong> Hepsiburada SIT ortamı dummy verilerden oluşur (örn: Delsey Evrak Çantaları, Tetra Balık Yemleri vb.). Test ürününüzün kategorisiyle birebir uyuşmak zorunda değildir. Listeden <strong>herhangi bir kategoriyi</strong> seçtiğinizde sistem o kategorinin zorunlu özelliklerini (Attributes) otomatik olarak algılar ve gönderim paketine entegre eder!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 1.2 Send Test Catalog Products */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tekil Ürün Kartı */}
            <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md">1. Adım: Tekil Ürün Testi</span>
                <span className="text-[11px] font-mono text-slate-500">Lopard Kordon</span>
              </div>
              <div className="text-xs space-y-1">
                <p className="font-bold text-slate-900">Lopard Apple Watch Uyumlu Silikon Kordon</p>
                <p className="text-slate-500">Barkod: <strong className="text-indigo-600">8660743368267</strong></p>
                <p className="text-slate-500">Fiyat: 349 TRY | Stok: 45 Adet</p>
              </div>
              <button
                onClick={() => handleSendSingleCatalogProduct('sit')}
                disabled={catalogSending}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" /> Tekil Test Ürününü Kataloğa Gönder (SIT)
              </button>
            </div>

            {/* Varyantlı Ürün Grubu Kartı */}
            <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">2. Adım: Varyantlı Ürün Grubu Testi</span>
                <span className="text-[11px] font-mono text-slate-500">Otom Koltuk Kılıfı</span>
              </div>
              <div className="text-xs space-y-1">
                <p className="font-bold text-slate-900">Otom Audi A6 Koltuk Kılıfı (Siyah & Gri Varyantları)</p>
                <p className="text-slate-500">Varyant Barkodları: <strong className="text-emerald-600">8681892240266 (Siyah), 8681892240267 (Gri)</strong></p>
                <p className="text-slate-500">Ortak Grup ID: Otomatik <strong className="text-slate-700">variantGroupID</strong> ile bağlanır</p>
              </div>
              <button
                onClick={() => handleSendVariantCatalogProducts('sit')}
                disabled={catalogSending}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" /> Varyantlı Grubu Kataloğa Gönder (SIT)
              </button>
            </div>
          </div>

          {/* Catalog Tracking Status */}
          {catalogTrackingId && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-800">Aktif Katalog Tracking ID: <span className="font-mono text-indigo-600 font-extrabold">{catalogTrackingId}</span></p>
                <button 
                  onClick={() => handleCheckCatalogStatus(catalogTrackingId, 'sit')} 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  Onay Durumunu Sorgula
                </button>
              </div>
              {catalogTaskStatus && (
                <pre className="mt-2 text-xs bg-slate-900 text-emerald-400 p-3.5 rounded-xl overflow-x-auto font-mono">{JSON.stringify(catalogTaskStatus, null, 2)}</pre>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INVENTORY MANAGEMENT */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">Hepsiburada Fiyat & Stok Revizyon Testi (Inventory V2)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Gerçek SKU ve Satıcı Kodu eşleşmesiyle anlık fiyat/stok güncellemesi</p>
            </div>
            <button 
              onClick={() => handleSendBothProducts('sit')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> Her İki Ürünü Birlikte Güncelle (SIT)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1 */}
            <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md">Varyantlı Ürün</span>
                <span className="text-[11px] font-mono text-slate-500">HB SKU: <strong className="text-slate-800">{customSku1.hepsiburadaSku}</strong></span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{customSku1.name}</p>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">Barkod / Satıcı Kodu: <strong className="text-indigo-600">{customSku1.merchantSku}</strong></p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500">Fiyat (TRY)</label>
                  <input 
                    type="number"
                    value={customSku1.price}
                    onChange={e => setCustomSku1({...customSku1, price: Number(e.target.value)})}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500">Stok Adedi</label>
                  <input 
                    type="number"
                    value={customSku1.stock}
                    onChange={e => setCustomSku1({...customSku1, stock: Number(e.target.value)})}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              <button 
                onClick={() => handleSendSpecificProduct(customSku1, 'sit')}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Fiyat & Stok Güncelle (SIT)
              </button>
            </div>

            {/* Card 2 */}
            <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">Tekil Ürün</span>
                <span className="text-[11px] font-mono text-slate-500">HB SKU: <strong className="text-slate-800">{customSku2.hepsiburadaSku}</strong></span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{customSku2.name}</p>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">Barkod / Satıcı Kodu: <strong className="text-emerald-600">{customSku2.merchantSku}</strong></p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500">Fiyat (TRY)</label>
                  <input 
                    type="number"
                    value={customSku2.price}
                    onChange={e => setCustomSku2({...customSku2, price: Number(e.target.value)})}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500">Stok Adedi</label>
                  <input 
                    type="number"
                    value={customSku2.stock}
                    onChange={e => setCustomSku2({...customSku2, stock: Number(e.target.value)})}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              <button 
                onClick={() => handleSendSpecificProduct(customSku2, 'sit')}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Fiyat & Stok Güncelle (SIT)
              </button>
            </div>
          </div>

          {listingTrackingId && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-800">Son Envanter Tracking ID: <span className="font-mono text-indigo-600 font-extrabold">{listingTrackingId}</span></p>
                <button 
                  onClick={() => checkListingStatus('sit', listingTrackingId)} 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  Durumu Sorgula
                </button>
              </div>
              {listingTaskStatus && (
                <pre className="mt-2 text-xs bg-slate-900 text-emerald-400 p-3.5 rounded-xl overflow-x-auto font-mono">{JSON.stringify(listingTaskStatus, null, 2)}</pre>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: OMS ORDERS */}
      {activeSubTab === 'oms' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="font-bold text-base text-slate-900">Hepsiburada Sipariş Yönetimi (OMS) & Fatura Akış Testi</h3>
            <p className="text-xs text-slate-500 mt-0.5">Canlı OMS havuzundan paket çekme veya LookPrice sisteminde uçtan uca test siparişi simülasyonu</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => handleFetchLiveOrders('sit')}
              disabled={fetchingOrders}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${fetchingOrders ? 'animate-spin' : ''}`} />
              {fetchingOrders ? 'Sorgulanıyor...' : 'Hepsiburada SIT Siparişlerini Çek (Canlı OMS)'}
            </button>

            <button 
              onClick={handleSimulateTestOrder}
              disabled={simulatingOrder}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {simulatingOrder ? 'İşleniyor...' : 'Test Siparişi Simüle Et (Uçtan Uca)'}
            </button>
          </div>

          {/* Live OMS Result */}
          {ordersResult && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">OMS Canlı Yanıtı ({ordersResult.env?.toUpperCase()}):</span>
                <span className="text-xs font-bold px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-lg">
                  Toplam: {ordersResult.total ?? 0} Kayıt
                </span>
              </div>
              {ordersResult.orders && ordersResult.orders.length > 0 ? (
                <div className="space-y-2">
                  {ordersResult.orders.map((ord: any, idx: number) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1">
                      <p className="font-bold text-slate-800">Sipariş / Paket No: {ord.orderNumber || ord.id || ord.packageNumber}</p>
                      <p className="text-slate-600">Alıcı: {ord.customer || ord.recipientName || 'Hepsiburada Müşterisi'}</p>
                      <p className="text-slate-500">Durum: <span className="font-bold text-indigo-600">{ord.status || 'Açık'}</span></p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Hepsiburada SIT havuzunda şu an açık bekleyen sipariş bulunamadı (0 adet).</p>
              )}
            </div>
          )}

          {/* Simulated Order Result */}
          {simulatedOrderResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Hepsiburada Test Siparişi Başarıyla Oluşturuldu</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Sipariş No</p>
                  <p className="font-mono font-bold text-slate-900 text-xs mt-0.5">#{simulatedOrderResult.testOrderId}</p>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Fatura No</p>
                  <p className="font-mono font-bold text-indigo-600 text-xs mt-0.5">{simulatedOrderResult.invoiceNumber}</p>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Müşteri</p>
                  <p className="font-bold text-slate-900 text-xs mt-0.5 truncate">{simulatedOrderResult.customerName}</p>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Tutar</p>
                  <p className="font-bold text-emerald-600 text-xs mt-0.5">{simulatedOrderResult.grandTotal} TRY</p>
                </div>
              </div>
              <p className="text-xs text-emerald-700 pt-1">
                ✓ Bu sipariş LookPrice veritabanında otomatik olarak <strong>Cari Hesap</strong>, <strong>Satış Kaydı</strong> ve <strong>Satış Faturası</strong> oluşturdu.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Edit Config Modal */}
      {editingConfig && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveConfig} className="bg-white p-6 rounded-2xl w-full max-w-lg space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Pazaryeri Konfigürasyonu Düzenle</h3>
                <p className="text-xs text-slate-500">Hepsiburada API erişim parametreleri</p>
              </div>
              <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md uppercase">
                {editingConfig.marketplace || 'hepsiburada'} ({editingConfig.env || 'sit'})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Pazaryeri</label>
                <select 
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-sm font-medium bg-slate-50"
                  value={editingConfig.marketplace || 'hepsiburada'}
                  onChange={e => setEditingConfig({...editingConfig, marketplace: e.target.value})}
                >
                  <option value="hepsiburada">Hepsiburada</option>
                  <option value="trendyol">Trendyol</option>
                  <option value="n11">N11</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Ortam (Environment)</label>
                <select 
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-sm font-medium bg-slate-50"
                  value={editingConfig.env || 'sit'}
                  onChange={e => setEditingConfig({...editingConfig, env: e.target.value})}
                >
                  <option value="sit">Test / Sandbox (SIT)</option>
                  <option value="production">Canlı (Production)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Merchant ID (Mağaza ID / Username)</span>
                <span className="text-[10px] text-rose-500 font-bold">*Zorunlu</span>
              </label>
              <input 
                className="w-full border border-slate-200 p-2.5 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                placeholder="Örn: 17305983-4803-4dd7-9479-..."
                value={editingConfig.client_id || ''}
                onChange={e => setEditingConfig({...editingConfig, client_id: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Password / Secret Key (API Şifresi)</span>
                <span className="text-[10px] text-rose-500 font-bold">*Zorunlu</span>
              </label>
              <input 
                className="w-full border border-slate-200 p-2.5 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                placeholder="Hepsiburada Password (Secretkey)"
                type="password"
                value={editingConfig.client_secret || ''}
                onChange={e => setEditingConfig({...editingConfig, client_secret: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Header: User-Agent (Developer Username)</span>
                <span className="text-[10px] text-indigo-600 font-bold">Örn: enrakipsiz_dev</span>
              </label>
              <input 
                className="w-full border border-slate-200 p-2.5 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                placeholder="enrakipsiz_dev"
                value={editingConfig.config?.user_agent || ''}
                onChange={e => setEditingConfig({...editingConfig, config: {...editingConfig.config, user_agent: e.target.value}})}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setEditingConfig(null)} 
                className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                İptal
              </button>
              <button 
                type="submit" 
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95"
              >
                Kaydet
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
