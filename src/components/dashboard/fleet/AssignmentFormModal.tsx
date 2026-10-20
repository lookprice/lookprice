import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserCheck, Calendar, CheckCircle2, Mail } from 'lucide-react';
import { Vehicle } from '../../../types';

interface AssignmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  formData: any;
  setFormData: (data: any) => void;
  handleSubmit: (e: React.FormEvent) => void;
  vehicles: Vehicle[];
  drivers?: any[];
}

export const AssignmentFormModal: React.FC<AssignmentFormModalProps> = ({
  isOpen,
  onClose,
  lang,
  formData,
  setFormData,
  handleSubmit,
  vehicles,
  drivers = []
}) => {
  if (!isOpen) return null;

  const isTr = lang === 'tr';
  const [assignType, setAssignType] = React.useState<'driver' | 'email'>(formData.driver_id ? 'driver' : formData.user_email ? 'email' : 'driver');

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
              <UserCheck className="h-3.5 w-3.5 text-purple-400" />
              {isTr ? 'Zimmet Bilgileri' : 'Assignment Info'}
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

              <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setAssignType('driver');
                    setFormData({ ...formData, user_email: '', driver_id: '' });
                  }}
                  className={`flex-1 py-1 text-[10px] font-black uppercase tracking-widest rounded transition-all ${assignType === 'driver' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                >
                  {isTr ? 'Kayıtlı Sürücü' : 'Driver'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAssignType('email');
                    setFormData({ ...formData, driver_id: '', user_email: '' });
                  }}
                  className={`flex-1 py-1 text-[10px] font-black uppercase tracking-widest rounded transition-all ${assignType === 'email' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                >
                  {isTr ? 'E-posta' : 'Email'}
                </button>
              </div>

              {assignType === 'driver' ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    {isTr ? 'Sürücü Seçin' : 'Select Driver'}
                  </label>
                  <select
                    required
                    value={formData.driver_id || ''}
                    onChange={(e) => {
                      const selectedDriver = drivers.find(d => String(d.id) === e.target.value);
                      setFormData({ 
                        ...formData, 
                        driver_id: e.target.value ? Number(e.target.value) : '',
                        user_email: selectedDriver?.email || ''
                      });
                    }}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all font-bold text-xs"
                  >
                    <option value="">{isTr ? 'Sürücü Seçin' : 'Select Driver'}</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                     {isTr ? 'Sürücü E-posta' : 'Driver Email'}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ornek@mail.com"
                    value={formData.user_email || ''}
                    onChange={(e) => setFormData({ ...formData, user_email: e.target.value, driver_id: '' })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all font-bold text-xs"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    {isTr ? 'Teslim Tarihi' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date || ''}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all font-bold text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    {isTr ? 'Kilometre' : 'Start Mileage'}
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.start_mileage || ''}
                    onChange={(e) => setFormData({ ...formData, start_mileage: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all font-bold text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  {isTr ? 'Zimmet Notları' : 'Notes'}
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
                {isTr ? 'Zimmetle' : 'Assign'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
