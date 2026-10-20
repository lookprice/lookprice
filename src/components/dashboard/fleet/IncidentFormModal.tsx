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
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 bg-slate-950/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-slate-200"
        >
          <div className="p-3 px-4 border-b border-slate-100 flex justify-between items-center bg-slate-900">
            <h3 className="text-xs font-medium text-white tracking-widest flex items-center gap-2 uppercase">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              {isTr ? 'Olay / Kaza Bildirimi' : 'Incident Report'}
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-all">
              <X className="h-4 w-4 text-white/60" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/30">
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest block">
                  {isTr ? 'Araç Seçin' : 'Select Vehicle'}
                </label>
                <select
                  required
                  value={formData.vehicle_id || ''}
                  onChange={(e) => setFormData({ ...formData, vehicle_id: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all font-medium text-xs"
                >
                  <option value="">{isTr ? 'Araç Seçin' : 'Select Vehicle'}</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest block">
                  {isTr ? 'Olay Tipi' : 'Incident Type'}
                </label>
                <select
                  required
                  value={formData.type || ''}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all font-medium text-xs"
                >
                  <option value="">{isTr ? 'Seçin' : 'Select'}</option>
                  <option value="accident">{isTr ? 'Kaza' : 'Accident'}</option>
                  <option value="breakdown">{isTr ? 'Arıza' : 'Breakdown'}</option>
                  <option value="theft">{isTr ? 'Hırsızlık' : 'Theft'}</option>
                  <option value="fine">{isTr ? 'Trafik Cezası' : 'Traffic Fine'}</option>
                  <option value="other">{isTr ? 'Diğer' : 'Other'}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest block">
                    {isTr ? 'Olay Tarihi' : 'Incident Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all font-medium text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest block">
                    {isTr ? 'Tahmini Maliyet' : 'Estimated Cost'}
                  </label>
                  <input
                    type="number"
                    value={formData.cost || ''}
                    onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all font-medium text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest block">
                  {isTr ? 'Olay Detayları / Notlar' : 'Incident Details / Notes'}
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all font-medium text-xs resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-[10px] text-slate-500 hover:bg-slate-50 uppercase tracking-widest transition-all"
              >
                {isTr ? 'İptal' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-6 py-1.5 bg-red-600 text-white rounded-lg font-medium text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-sm flex items-center gap-2"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                {isTr ? 'Bildir' : 'Report'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
