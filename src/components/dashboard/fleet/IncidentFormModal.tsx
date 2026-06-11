import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, Calendar, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Vehicle } from '../../../types';

interface IncidentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  formData: any;
  setFormData: (data: any) => void;
  handleSubmit: (e: React.FormEvent) => void;
  vehicles: Vehicle[];
}

export const IncidentFormModal: React.FC<IncidentFormModalProps> = ({
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
              <AlertTriangle className="h-5 w-5 text-red-600" />
              {isTr ? 'Olay / Kaza Bildirimi' : 'Incident / Accident Report'}
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
                  {isTr ? 'Olay Tipi' : 'Incident Type'}
                </label>
                <select
                  required
                  value={formData.type || ''}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                >
                  <option value="">{isTr ? 'Seçin' : 'Select'}</option>
                  <option value="accident">{isTr ? 'Kaza' : 'Accident'}</option>
                  <option value="breakdown">{isTr ? 'Arıza' : 'Breakdown'}</option>
                  <option value="theft">{isTr ? 'Hırsızlık' : 'Theft'}</option>
                  <option value="fine">{isTr ? 'Trafik Cezası' : 'Traffic Fine'}</option>
                  <option value="other">{isTr ? 'Diğer' : 'Other'}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
                    {isTr ? 'Olay Tarihi' : 'Incident Date'}
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
                    {isTr ? 'Tahmini Maliyet' : 'Estimated Cost'}
                  </label>
                  <input
                    type="number"
                    value={formData.cost || ''}
                    onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
                  {isTr ? 'Olay Detayları / Notlar' : 'Incident Details / Notes'}
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
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
                className="px-8 py-3 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center gap-2"
              >
                <ShieldAlert className="w-5 h-5" />
                {isTr ? 'Bildir' : 'Report'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
