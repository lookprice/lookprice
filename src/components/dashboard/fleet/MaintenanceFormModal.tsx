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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-600" />
              {isTr ? 'Bakım Bilgileri' : 'Maintenance Information'}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl transition-all">
              <X className="h-6 w-6 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
                  {isTr ? 'Araç Seçin' : 'Select Vehicle'}
                </label>
                <select
                  required
                  value={formData.vehicle_id || ''}
                  onChange={(e) => setFormData({ ...formData, vehicle_id: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                >
                  <option value="">{isTr ? 'Araç Seçin' : 'Select Vehicle'}</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
                  {isTr ? 'Bakım Tipi' : 'Maintenance Type'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isTr ? 'Periyodik Bakım, Lastik Değişimi vb.' : 'Periodic Maintenance, Tire Change etc.'}
                  value={formData.type || ''}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
                    {isTr ? 'Tarih' : 'Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
                    {isTr ? 'Kilometre' : 'Mileage'}
                  </label>
                  <input
                    type="number"
                    value={formData.mileage || ''}
                    onChange={(e) => setFormData({ ...formData, mileage: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
                    {isTr ? 'Servis Sağlayıcı' : 'Provider Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.provider_name || ''}
                    onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
                    {isTr ? 'Maliyet' : 'Cost'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cost || ''}
                      onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold pr-12"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">TRY</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
                  {isTr ? 'Durum' : 'Status'}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'planned' })}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      formData.status === 'planned' ? 'bg-orange-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {isTr ? 'Planlandı' : 'Planned'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'completed' })}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      formData.status === 'completed' ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {isTr ? 'Tamamlandı' : 'Completed'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
                  {isTr ? 'Yapılan İşlemler' : 'Notes'}
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all"
              >
                {isTr ? 'İptal' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                {isTr ? 'Kaydet' : 'Save'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
