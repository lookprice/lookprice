import React, { useEffect, useState } from 'react';
import { X, Package, ArrowUpCircle, ArrowDownCircle, FileDown } from 'lucide-react';
import { translations } from '../translations';
import { useLanguage } from '../contexts/LanguageContext';

import { api } from '../services/api';

interface Movement {
  id: number;
  type: 'in' | 'out';
  quantity: number;
  source: string;
  description: string;
  unit_price?: number;
  customer_info?: string;
  created_at: string;
}

interface ProductMovementModalProps {
  product: any;
  onClose: () => void;
  branding: any;
}

const ProductMovementModal = ({ product, onClose, branding }: ProductMovementModalProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.get(`/api/store/products/${product.id}/movements`)
      .then(data => {
        if (Array.isArray(data)) {
          setMovements(data);
        } else {
          console.error("Expected array but got:", data);
          setMovements([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [product.id]);

  const handleExport = async () => {
    try {
      setExporting(true);
      await api.download(`/api/store/products/${product.id}/movements/export?lang=${lang}`, `${lang === 'tr' ? 'hareketler' : 'movements'}_${product.name.replace(/\s+/g, '_')}.xlsx`);
    } catch (err) {
      console.error(err);
      alert(lang === 'tr' ? 'Dışa aktarma başarısız oldu' : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-slate-900">{product.name} - {lang === 'tr' ? 'Hareket Geçmişi' : 'Movement History'}</h2>
            <p className="text-xs text-slate-500">{product.barcode}</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExport}
              disabled={exporting || movements.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
            >
              <FileDown className="h-4 w-4" />
              {exporting ? (lang === 'tr' ? 'İndiriliyor...' : 'Downloading...') : (lang === 'tr' ? 'Excel' : 'Excel')}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12 text-slate-500">{t.loading}</div>
          ) : movements.length === 0 ? (
            <div className="text-center py-12 text-slate-400">{lang === 'tr' ? 'Hareket bulunamadı' : 'No movements found'}</div>
          ) : (
            <div className="space-y-4">
              {movements.map(m => (
                <div key={m.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    {m.type === 'in' ? (
                      <ArrowUpCircle className="h-8 w-8 text-emerald-500" />
                    ) : (
                      <ArrowDownCircle className="h-8 w-8 text-rose-500" />
                    )}
                    <div>
                      <div className="font-bold text-slate-900">{m.description}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(m.created_at).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} - {t.statements.source}: {t.sources[m.source] || m.source}
                      </div>
                      {(m.customer_info || m.unit_price != null) && (
                        <div className="text-xs text-slate-600 mt-1 flex gap-3">
                          {m.customer_info && (
                            <span><span className="font-medium">{t.statements.customerSupplier}:</span> {m.customer_info}</span>
                          )}
                          {m.unit_price != null && (
                            <span><span className="font-medium">{t.statements.unitPrice}:</span> {m.unit_price.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { style: 'currency', currency: branding.default_currency || 'TRY' })}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`font-bold ${m.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {m.type === 'in' ? '+' : '-'}{m.quantity}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductMovementModal;
