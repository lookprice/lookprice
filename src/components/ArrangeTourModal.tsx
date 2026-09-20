import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Clock, Check, Building2 } from 'lucide-react';
import { RealEstateProperty } from '../types';
import { api } from '../services/api';
import { toast } from 'sonner';

interface ArrangeTourModalProps {
  property: RealEstateProperty | null;
  propertiesList?: RealEstateProperty[];
  onClose: () => void;
  onSave: () => void;
}

export const ArrangeTourModal = ({ property, propertiesList = [], onClose, onSave }: ArrangeTourModalProps) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | string>(property?.id || (propertiesList[0]?.id || ''));
  const [date, setDate] = useState('');
  const [time, setTime] = useState('14:00');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [agentName, setAgentName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (property) {
      setSelectedPropertyId(property.id);
    } else if (propertiesList.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(propertiesList[0].id);
    }
  }, [property, propertiesList]);

  const activeProp = property || propertiesList.find(p => p.id === Number(selectedPropertyId) || p.id === selectedPropertyId);

  const handleSubmit = async () => {
    if (!selectedPropertyId) {
      toast.error('Lütfen gösterim / gezi yapılacak gayrimenkulü seçiniz.');
      return;
    }
    if (!date || !time || !customerName) {
      toast.error('Lütfen tarih, saat ve müşteri adı alanlarını doldurunuz.');
      return;
    }
    setLoading(true);
    try {
      const descStr = `Gezi Düzenlendi: ${customerName} (Tel: ${customerPhone || '---'}) ${agentName ? '• Danışman: ' + agentName : ''} ${notes ? '• Not: ' + notes : ''}`;
      await api.createTask({
        property_id: Number(selectedPropertyId),
        task_type: 'tour',
        description: descStr,
        due_date: new Date(`${date}T${time}`).toISOString(),
      });
      toast.success('Gezi randevusu başarıyla sisteme kaydoldu ve Pipeline kartına bağlandı!');
      onSave();
      onClose();
    } catch (e) {
      toast.error('Gezi kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-[110]">
      <div className="bg-white rounded-2xl p-5 w-full max-w-lg shadow-xl border border-slate-200 relative overflow-hidden">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Yer Gösterme / Keşif Turu Planla</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Görüşme ve Gezi Randevusu</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"><X className="w-4 h-4"/></button>
        </div>
        
        <div className="space-y-3 text-xs font-bold">
          {/* Property Select */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Portföy / Gayrimenkul</label>
            {property ? (
              <div className="p-2.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-slate-900 truncate">{property.title}</p>
                  <p className="text-[10px] text-slate-500 font-bold truncate">REF: {property.reference_no} • {property.price} {property.currency}</p>
                </div>
              </div>
            ) : (
              <select 
                value={selectedPropertyId} 
                onChange={e => setSelectedPropertyId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="">-- Portföy Seçiniz --</option>
                {propertiesList.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.reference_no || 'REF'}] {p.title} - {p.price} {p.currency}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Müşteri Ad Soyad *</label>
              <input type="text" placeholder="Ahmet Yılmaz" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500"/>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Müşteri Telefonu</label>
              <input type="text" placeholder="+90 533..." value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Tarih *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500"/>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Saat *</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500"/>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Sorumlu Danışman</label>
            <input type="text" placeholder="Mehmet B. (Sorumlu Danışman)" value={agentName} onChange={e => setAgentName(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500"/>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Özel Notlar & Beklentiler</label>
            <textarea placeholder="Müşteri deniz manzaralı katları önceliklendiriyor..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 min-h-[50px]"/>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 cursor-pointer">
            İptal
          </button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-indigo-600 text-white font-black py-2 rounded-xl text-xs hover:bg-indigo-700 transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50">
            {loading ? 'Kaydediliyor...' : 'Randevuyu Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
};

