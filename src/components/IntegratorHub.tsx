import React, { useState, useEffect } from 'react';
import { ShoppingBag, Key, Lock, RefreshCw, AlertCircle, Save, CheckCircle2 } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';

export const IntegratorHub = () => {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [trackingId, setTrackingId] = useState<string>('');
  const [taskStatus, setTaskStatus] = useState<any>(null);

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

  const testProductImport = async (marketplace: string, env: 'sit' | 'production') => {
    if (marketplace === 'hepsiburada') {
      const res = await api.hepsiburadaV3ImportListings(env, [{
        merchantSku: 'TEST-SKU-001',
        productName: 'LookPrice Test Ürünü',
        price: 100,
        availableStock: 10
      }]);
      if (res.trackingId) {
        setTrackingId(res.trackingId);
        toast.success(`Ürün aktarımı başlatıldı. Tracking ID: ${res.trackingId}`);
      } else {
        toast.error("İşlem başlatılamadı: " + JSON.stringify(res));
      }
    }
  };

  const checkStatus = async (marketplace: string, env: 'sit' | 'production', id: string) => {
    if (marketplace === 'hepsiburada') {
      const res = await api.hepsiburadaV3CheckTaskStatus(env, id);
      setTaskStatus(res);
      toast.info("Durum sorgulandı.");
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">Merkezi Pazaryeri Entegratör Hub</h2>
        <button 
          onClick={() => setEditingConfig({ marketplace: 'hepsiburada', env: 'sit', client_id: '', client_secret: '' })}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700"
        >
          Yeni Konfigürasyon
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Yükleniyor...</div>
      ) : (
        <div className="space-y-4">
          {configs.map((c) => (
            <div key={c.id} className="p-4 border rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold uppercase text-sm">{c.marketplace} ({c.env})</p>
                <p className="text-xs text-slate-500">Client ID: {c.client_id}</p>
              </div>
              <button 
                onClick={() => setEditingConfig(c)}
                className="text-indigo-600 text-sm font-bold"
              >
                Düzenle
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 pt-6 border-t">
        <h3 className="font-bold text-lg mb-4">Hepsiburada Entegrasyon Test Paneli</h3>
        <div className="flex gap-2 mb-4">
          <button onClick={() => testProductImport('hepsiburada', 'sit')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold">
            Test Ürünü Gönder (SIT)
          </button>
        </div>
        
        {trackingId && (
          <div className="p-4 bg-slate-50 rounded-lg text-sm">
            <p className="font-bold mb-2">Aktif Tracking ID: {trackingId}</p>
            <button onClick={() => checkStatus('hepsiburada', 'sit', trackingId)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold">
              Durumu Sorgula
            </button>
            {taskStatus && (
              <pre className="mt-2 text-xs bg-slate-200 p-2 rounded">{JSON.stringify(taskStatus, null, 2)}</pre>
            )}
          </div>
        )}
      </div>

      {editingConfig && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveConfig} className="bg-white p-6 rounded-2xl w-full max-w-md space-y-4">
            <h3 className="font-bold text-lg">Konfigürasyon Düzenle</h3>
            <input 
              className="w-full border p-2 rounded" 
              placeholder="Client ID"
              value={editingConfig.client_id}
              onChange={e => setEditingConfig({...editingConfig, client_id: e.target.value})}
            />
            <input 
              className="w-full border p-2 rounded" 
              placeholder="Client Secret"
              type="password"
              value={editingConfig.client_secret}
              onChange={e => setEditingConfig({...editingConfig, client_secret: e.target.value})}
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditingConfig(null)} className="px-4 py-2 text-sm font-bold">İptal</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold">Kaydet</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
