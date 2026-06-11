import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Phone, Mail, FileText, CheckCircle2 } from 'lucide-react';

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                {isTr ? 'Sürücü Bilgileri' : 'Driver Information'}
              </h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl transition-all">
              <X className="h-6 w-6 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
                  {isTr ? 'Ad Soyad' : 'Full Name'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
                    {isTr ? 'Telefon' : 'Phone'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
                    {isTr ? 'E-posta' : 'Email'}
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
                    {isTr ? 'Ehliyet No' : 'License No'}
                  </label>
                  <input
                    type="text"
                    value={formData.license_number || ''}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
                    {isTr ? 'Ehliyet Sınıfı' : 'License Class'}
                  </label>
                  <input
                    type="text"
                    placeholder="B, C, CE..."
                    value={formData.license_class || ''}
                    onChange={(e) => setFormData({ ...formData, license_class: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
                  {isTr ? 'Kan Grubu' : 'Blood Type'}
                </label>
                <select
                  value={formData.blood_type || ''}
                  onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                >
                  <option value="">Seçin</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
                  {isTr ? 'Adres' : 'Address'}
                </label>
                <textarea
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
