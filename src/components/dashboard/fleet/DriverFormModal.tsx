import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, CheckCircle2 } from 'lucide-react';

interface DriverFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  formData: any;
  setFormData: (data: any) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

export const DriverFormModal: React.FC<DriverFormModalProps> = ({
  isOpen,
  onClose,
  lang,
  formData,
  setFormData,
  handleSubmit
}) => {
  if (!isOpen) return null;

  const isTr = lang === 'tr';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 bg-slate-950/70 backdrop-blur-xs font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-slate-200 font-sans"
        >
          <div className="p-3.5 px-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
            <h3 className="text-sm font-normal font-sans text-slate-800 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              {isTr ? 'Sürücü Kaydı' : 'Driver Registration'}
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg transition-all cursor-pointer">
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar font-sans font-normal">
            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-normal text-slate-600 block">
                  {isTr ? 'Ad Soyad' : 'Full Name'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all font-normal text-xs sm:text-sm text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-normal text-slate-600 block">
                    {isTr ? 'Telefon' : 'Phone'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all font-normal text-xs sm:text-sm text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-normal text-slate-600 block">
                    {isTr ? 'E-posta' : 'Email'}
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all font-normal text-xs sm:text-sm text-slate-800 lowercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-normal text-slate-600 block">
                    {isTr ? 'Ehliyet No' : 'License No'}
                  </label>
                  <input
                    type="text"
                    value={formData.license_number || ''}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all font-normal text-xs sm:text-sm text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-normal text-slate-600 block">
                    {isTr ? 'Ehliyet Sınıfı' : 'License Class'}
                  </label>
                  <input
                    type="text"
                    placeholder="B, C, CE..."
                    value={formData.license_class || ''}
                    onChange={(e) => setFormData({ ...formData, license_class: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all font-normal text-xs sm:text-sm text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-1">
                  <label className="text-xs font-normal text-slate-600 block">
                    {isTr ? 'T.C. Kimlik / Pasaport' : 'National ID'}
                  </label>
                  <input
                    type="text"
                    value={formData.national_id || ''}
                    onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all font-normal text-xs sm:text-sm text-slate-800"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-xs font-normal text-slate-600 block">
                    {isTr ? 'Kan Grubu' : 'Blood Type'}
                  </label>
                  <select
                    value={formData.blood_type || ''}
                    onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all font-normal text-xs sm:text-sm text-slate-800"
                  >
                    <option value="">{isTr ? 'Seçin' : 'Select'}</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-xs font-normal text-slate-600 block">
                    {isTr ? 'Durum' : 'Status'}
                  </label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all font-normal text-xs sm:text-sm text-slate-800"
                  >
                    <option value="active">{isTr ? 'Aktif' : 'Active'}</option>
                    <option value="inactive">{isTr ? 'Pasif' : 'Inactive'}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-normal text-slate-600 block">
                  {isTr ? 'Adres' : 'Address'}
                </label>
                <textarea
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all font-normal text-xs sm:text-sm text-slate-800 resize-y"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg font-normal text-xs text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              >
                {isTr ? 'İptal' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-normal text-xs hover:bg-blue-700 transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isTr ? 'Kaydet' : 'Save'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

