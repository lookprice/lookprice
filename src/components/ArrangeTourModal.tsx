import React, { useState } from 'react';
import { X, Calendar, User, Clock, Check } from 'lucide-react';
import { RealEstateProperty } from '../types';
import { api } from '../services/api';
import { toast } from 'sonner';

interface ArrangeTourModalProps {
  property: RealEstateProperty | null;
  onClose: () => void;
  onSave: () => void;
}

export const ArrangeTourModal = ({ property, onClose, onSave }: ArrangeTourModalProps) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!date || !time || !customerName) {
      toast.error('Lütfen gerekli alanları doldurunuz.');
      return;
    }
    setLoading(true);
    try {
      await api.createTask({
        property_id: property?.id,
        task_type: 'tour',
        description: `Gezi Düzenlendi: ${customerName} - ${date} ${time} (Telefon: ${customerPhone})`,
        due_date: new Date(`${date}T${time}`).toISOString(),
      });
      toast.success('Gezi başarıyla düzenlendi!');
      onSave();
      onClose();
    } catch (e) {
      toast.error('Gezi düzenlenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (!property) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-900">Gezi Düzenle: {property.title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5"/></button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Müşteri Adı</label>
            <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl font-semibold text-sm"/>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Müşteri Telefonu</label>
            <input type="text" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl font-semibold text-sm"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tarih</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl font-semibold text-sm"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Saat</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl font-semibold text-sm"/>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <button onClick={handleSubmit} disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all">
            {loading ? 'Kaydediliyor...' : 'Gezi Planla'}
          </button>
        </div>
      </div>
    </div>
  );
};
