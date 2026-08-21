import React, { useState, useEffect } from 'react';
import { ShoppingBag, Key, Lock, RefreshCw, AlertCircle, Save, CheckCircle2 } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';

export const IntegratorHub = () => {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      // Endpointi routes/admin.ts veya genel bir ayarlardan çekebiliriz, 
      // şimdilik varsayılan api metodunu kullanıyoruz.
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
