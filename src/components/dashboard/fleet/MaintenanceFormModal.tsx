import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wrench, Calendar, CheckCircle2, DollarSign } from 'lucide-react';
import { Vehicle } from '../../../types';

interface MaintenanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  formData: any;
  setFormData: (data: any) => void;
  handleSubmit: (e: React.FormEvent) => void;
  vehicles: Vehicle[];
}

export const MaintenanceFormModal: React.FC<MaintenanceFormModalProps> = ({
  isOpen,
  onClose,
  lang,
  formData,
  setFormData,
  handleSubmit,
  vehicles
}) => {
  if (!isOpen) return null;

  const isTr = lang === 'tr';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 bg-slate-950/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-slate-200"
        >
          <div className="p-3 px-4 border-b border-slate-100 flex justify-between items-center bg-slate-900">
            <h3 className="text-xs font-black text-white tracking-widest flex items-center gap-2 uppercase">
              <Wrench className="h-3.5 w-3.5 text-orange-400" />
              {isTr ? 'Bakım Bilgileri' : 'Maintenance Info'}
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-all">
              <X className="h-4 w-4 text-white/60" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/30">
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  {isTr ? 'Araç Seçin' : 'Select Vehicle'}
                </label>
                <select
                  required
                  value={formData.vehicle_id || ''}
                  onChange={(e) => setFormData({ ...formData, vehicle_id: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all font-bold text-xs"
                >
                  <option value="">{isTr ? 'Araç Seçin' : 'Select Vehicle'}</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  {isTr ? 'Bakım Tipi' : 'Maintenance Type'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isTr ? 'Periyodik Bakım, Lastik Değişimi vb.' : 'Maintenance Type...'}
                  value={formData.type || ''}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all font-bold text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    {isTr ? 'Tarih' : 'Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all font-bold text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    {isTr ? 'Kilometre' : 'Mileage'}
                  </label>
                  <input
                    type="number"
                    value={formData.mileage || ''}
                    onChange={(e) => setFormData({ ...formData, mileage: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all font-bold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    {isTr ? 'Servis Sağlayıcı' : 'Provider Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.provider_name || ''}
                    onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all font-bold text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    {isTr ? 'Maliyet' : 'Cost'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cost || ''}
                      onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all font-bold text-xs pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">TRY</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  {isTr ? 'Durum' : 'Status'}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'planned' })}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      formData.status === 'planned' ? 'bg-orange-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500'
                    }`}
                  >
                    {isTr ? 'Planlandı' : 'Planned'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'completed' })}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      formData.status === 'completed' ? 'bg-green-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500'
                    }`}
                  >
                    {isTr ? 'Tamamlandı' : 'Completed'}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  {isTr ? 'Yapılan İşlemler / Notlar' : 'Notes'}
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={1}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all font-bold text-xs resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg font-black text-[10px] text-slate-500 hover:bg-slate-50 uppercase tracking-widest transition-all"
              >
                {isTr ? 'İptal' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-6 py-1.5 bg-blue-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isTr ? 'Kaydet' : 'Save'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
