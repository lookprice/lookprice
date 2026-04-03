import React, { useEffect, useState } from 'react';
import { X, Package, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
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
}

const ProductMovementModal = ({ product, onClose }: ProductMovementModalProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{product.name} - {lang === 'tr' ? 'Hareket Geçmişi' : 'Movement History'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
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
                      <div className="text-xs text-slate-500">{new Date(m.created_at).toLocaleString('tr-TR')} - {lang === 'tr' ? 'Kaynak' : 'Source'}: {m.source}</div>
                      {(m.customer_info || m.unit_price != null) && (
                        <div className="text-xs text-slate-600 mt-1 flex gap-3">
                          {m.customer_info && (
                            <span><span className="font-medium">{lang === 'tr' ? 'Müşteri/Tedarikçi' : 'Customer/Supplier'}:</span> {m.customer_info}</span>
                          )}
                          {m.unit_price != null && (
                            <span><span className="font-medium">{lang === 'tr' ? 'Birim Fiyat' : 'Unit Price'}:</span> {m.unit_price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
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
