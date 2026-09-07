import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Calendar, CheckCircle2, ShieldCheck, Upload, Trash2 } from 'lucide-react';
import { Vehicle } from '../../../types';
import { MultiImageUploader } from '../../MultiImageUploader';

interface DocumentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  formData: any;
  setFormData: (data: any) => void;
  handleSubmit: (e: React.FormEvent) => void;
  vehicles: Vehicle[];
}

export const DocumentFormModal: React.FC<DocumentFormModalProps> = ({
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
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              {isTr ? 'Belge / Poliçe Ekle' : 'Add Document / Policy'}
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
                  {isTr ? 'Belge Tipi' : 'Document Type'}
                </label>
                <select
                  required
                  value={formData.type || ''}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                >
                  <option value="">{isTr ? 'Seçin' : 'Select'}</option>
                  <option value="traffic_insurance">{isTr ? 'Trafik Sigortası' : 'Traffic Insurance'}</option>
                  <option value="casco">{isTr ? 'Kasko' : 'Casco'}</option>
                  <option value="inspection">{isTr ? 'Muayene' : 'Inspection'}</option>
                  <option value="exhaust">{isTr ? 'Egzoz Emisyon' : 'Exhaust Emission'}</option>
                  <option value="other">{isTr ? 'Diğer' : 'Other'}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
                    {isTr ? 'Başlangıç Tarihi' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.issue_date || ''}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
                    {isTr ? 'Bitiş Tarihi' : 'Expiry Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expiry_date || ''}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
                  {isTr ? 'Poliçe / Dosya No' : 'Policy / File No'}
                </label>
                <input
                  type="text"
                  value={formData.document_number || ''}
                  onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
                  {isTr ? 'Evrak Belgesi / Görseli (Canlı Foto / Dosya)' : 'Document Attachment (Live Photo / File)'}
                </label>
                {formData.document_url ? (
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 overflow-hidden">
                        {formData.document_url.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                          <img src={formData.document_url} alt="Evrak" className="w-full h-full object-cover" />
                        ) : (
                          <FileText className="w-6 h-6 text-indigo-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">{isTr ? 'Belge Yüklendi' : 'Document Attached'}</p>
                        <a 
                          href={formData.document_url} 
                          target="_blank" 
                          referrerPolicy="no-referrer"
                          rel="noreferrer" 
                          className="text-[10px] font-semibold text-blue-600 hover:underline"
                        >
                          {isTr ? 'Görüntüle' : 'View Document'}
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, document_url: '' })}
                      className="p-2 text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <MultiImageUploader
                      lang={lang}
                      onImagesUploaded={(urls) => {
                        if (urls.length > 0) {
                          setFormData({ ...formData, document_url: urls[0] });
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
                  {isTr ? 'Açıklama' : 'Description'}
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
                {isTr ? 'Ekle' : 'Add'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
