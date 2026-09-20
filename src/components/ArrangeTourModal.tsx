import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, User, Clock, Check, Building2, MapPin, Sparkles } from 'lucide-react';
import { RealEstateProperty } from '../types';
import { api } from '../services/api';
import { toast } from 'sonner';

interface ArrangeTourModalProps {
  property: RealEstateProperty | null;
  propertiesList?: RealEstateProperty[];
  storeId?: number;
  onClose: () => void;
  onSave: () => void;
}

export const ArrangeTourModal = ({ property, propertiesList = [], storeId, onClose, onSave }: ArrangeTourModalProps) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | string>(() => property?.id || (propertiesList[0]?.id || ''));
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
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
  }, [property, propertiesList, selectedPropertyId]);

  const activeProp = property || propertiesList.find(p => p.id === Number(selectedPropertyId) || p.id === selectedPropertyId);

  const handleSubmit = async () => {
    if (!selectedPropertyId) {
      toast.error('Lütfen gösterim / gezi yapılacak gayrimenkulü seçiniz.');
      return;
    }
    if (!date || !time || !customerName.trim()) {
      toast.error('Lütfen tarih, saat ve müşteri adı alanlarını doldurunuz.');
      return;
    }
    setLoading(true);
    try {
      const descStr = `Gezi Düzenlendi: ${customerName.trim()} (Tel: ${customerPhone.trim() || '---'}) ${agentName.trim() ? '• Danışman: ' + agentName.trim() : ''} ${notes.trim() ? '• Not: ' + notes.trim() : ''}`;
      await api.createTask({
        property_id: Number(selectedPropertyId),
        task_type: 'tour',
        description: descStr,
        due_date: new Date(`${date}T${time}`).toISOString(),
      }, storeId);
      toast.success('Gezi randevusu başarıyla kaydedildi ve Pipeline kartına bağlandı!');
      if (onSave) onSave();
      onClose();
    } catch (e) {
      console.error('Error creating tour task:', e);
      toast.error('Gezi kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 z-[99999]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 relative overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Futuristic Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black text-indigo-400 uppercase tracking-widest">PIPELINE TASK</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded">Canlı Senkron</span>
              </div>
              <h2 className="text-xs sm:text-sm font-black text-white">Yer Gösterme & Keşif Turu Planla</h2>
            </div>
          </div>
          <button 
            onClick={onClose} 
            type="button"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-4 space-y-3 text-xs font-bold overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30">
          {/* Property Select */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
              Portföy / Gayrimenkul *
            </label>
            {property ? (
              <div className="p-2.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-black text-slate-900 truncate">{property.title}</p>
                  <p className="text-[10px] text-indigo-700 font-bold font-mono truncate">
                    REF: {property.reference_no} • {property.price} {property.currency}
                  </p>
                </div>
              </div>
            ) : (
              <select 
                value={selectedPropertyId} 
                onChange={e => setSelectedPropertyId(e.target.value)}
                className="w-full px-2.5 py-1.5 h-9 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-800 outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
              >
                <option value="">-- Portföy Seçiniz --</option>
                {propertiesList.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.reference_no || 'REF'}] {p.title} • {p.price} {p.currency}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                Müşteri Ad Soyad *
              </label>
              <input 
                type="text" 
                placeholder="Örn: Ahmet Yılmaz" 
                value={customerName} 
                onChange={e => setCustomerName(e.target.value)} 
                className="w-full px-2.5 py-1.5 h-8.5 bg-white border border-slate-200 rounded-lg font-bold text-xs text-slate-800 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                Müşteri Telefonu
              </label>
              <input 
                type="text" 
                placeholder="+90 533 123 4567" 
                value={customerPhone} 
                onChange={e => setCustomerPhone(e.target.value)} 
                className="w-full px-2.5 py-1.5 h-8.5 bg-white border border-slate-200 rounded-lg font-bold text-xs text-slate-800 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                Gezi Tarihi *
              </label>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="w-full px-2.5 py-1.5 h-8.5 bg-white border border-slate-200 rounded-lg font-bold text-xs text-slate-800 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                Gezi Saati *
              </label>
              <input 
                type="time" 
                value={time} 
                onChange={e => setTime(e.target.value)} 
                className="w-full px-2.5 py-1.5 h-8.5 bg-white border border-slate-200 rounded-lg font-bold text-xs text-slate-800 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
              Sorumlu Danışman / Rehber
            </label>
            <input 
              type="text" 
              placeholder="Örn: Mehmet B. (Gayrimenkul Danışmanı)" 
              value={agentName} 
              onChange={e => setAgentName(e.target.value)} 
              className="w-full px-2.5 py-1.5 h-8.5 bg-white border border-slate-200 rounded-lg font-bold text-xs text-slate-800 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
              Özel Notlar & Müşteri Beklentileri
            </label>
            <textarea 
              placeholder="Müşteri deniz manzaralı katları önceliklendiriyor, ödeme peşin planlanıyor..." 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              rows={2}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-xs text-slate-800 outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
          <button 
            type="button"
            onClick={onClose} 
            className="px-3.5 py-1.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Vazgeç
          </button>
          <button 
            type="button"
            onClick={handleSubmit} 
            disabled={loading} 
            className="px-4 py-1.5 bg-indigo-600 text-white font-black rounded-xl text-xs hover:bg-indigo-700 transition-all cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            {loading ? 'Kaydediliyor...' : 'Gezisini Planla & Kaydet'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
