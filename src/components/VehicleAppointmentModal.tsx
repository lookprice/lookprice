import React, { useState } from 'react';
import { X, Calendar, Clock, Car, User, Phone, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface VehicleAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: number;
  vehicles: any[];
  onSuccess: () => void;
  initialDate?: string;
  initialVehicleId?: string | number;
}

export const VehicleAppointmentModal = ({
  isOpen,
  onClose,
  storeId,
  vehicles,
  onSuccess,
  initialDate,
  initialVehicleId
}: VehicleAppointmentModalProps) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | number>(
    initialVehicleId || vehicles[0]?.id || ''
  );
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [date, setDate] = useState(initialDate || format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (initialVehicleId) {
      setSelectedVehicleId(initialVehicleId);
    } else if (vehicles.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [initialVehicleId, vehicles]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      toast.error("Lütfen bir araç seçiniz.");
      return;
    }
    if (!clientName) {
      toast.error("Lütfen müşteri adını giriniz.");
      return;
    }

    setIsSubmitting(true);
    try {
      const dueDateTime = `${date}T${time}:00`;
      const description = `Randevu: ${clientName} (${clientPhone || 'Telefon Yok'}) - ${notes || 'Araç inceleme / test sürüşü randevusu'}`;

      await api.createTask({
        property_id: Number(selectedVehicleId),
        task_type: 'appointment',
        description,
        due_date: dueDateTime
      }, storeId);

      toast.success("Araç satış randevusu başarıyla oluşturuldu!");
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Appointment creation error:", err);
      toast.error("Randevu oluşturulurken hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
      >
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-white tracking-wider">Yeni Araç Randevusu Oluştur</h3>
              <p className="text-[10px] text-slate-400 font-bold">AutoLP Müşteri Görüşme & Test Sürüşü Planı</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-bold bg-slate-50/40">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
              İlgilenilen Araç (Portföy) *
            </label>
            <select
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-2xs"
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              required
            >
              <option value="">Araç Seçiniz...</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.plate ? `[${v.plate}] ` : ''}{v.brand} {v.model} ({v.year || '-'}) - {v.price ? `${v.price} ${v.currency || 'TRY'}` : 'Fiyat Belirtilmemiş'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                Müşteri Adı Soyadı *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ahmet Yılmaz"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-2xs"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                Telefon Numarası
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="0532 000 00 00"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-2xs"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                Randevu Tarihi *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-2xs"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                Randevu Saati *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="time"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-2xs"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
              Görüşme / Test Sürüşü Notları
            </label>
            <textarea
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 min-h-[80px] resize-none shadow-2xs"
              placeholder="Müşteri takas aracı var, otomatik vites tercih ediyor..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-2xs active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'Kaydediliyor...' : 'Randevuyu Kaydet'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
