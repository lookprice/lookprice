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
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 bg-slate-950/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-slate-200"
        >
          <div className="p-3 px-4 border-b border-slate-100 flex justify-between items-center bg-slate-900">
            <h3 className="text-xs font-black text-white tracking-widest flex items-center gap-2 uppercase">
              <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
              {isTr ? 'Belge / Poliçe Ekle' : 'Add Document'}
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-all">
              <X className="h-4 w-4 text-white/60" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/30">
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                  {isTr ? 'Araç Seçin' : 'Select Vehicle'}
                </label>
                <select
                  required
                  value={formData.vehicle_id || ''}
                  onChange={(e) => setFormData({ ...formData, vehicle_id: Number(e.target.value) })}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded focus:border-blue-500 outline-none transition-all font-black text-[10px] uppercase"
                >
                  <option value="">{isTr ? 'ARAÇ SEÇİN' : 'SELECT'}</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                  {isTr ? 'Belge Tipi' : 'Type'}
                </label>
                <select
                  required
                  value={formData.type || ''}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded focus:border-blue-500 outline-none transition-all font-black text-[10px] uppercase"
                >
                  <option value="">{isTr ? 'SEÇİN' : 'SELECT'}</option>
                  <option value="traffic_insurance">{isTr ? 'TRAFİK SİGORTASI' : 'INSURANCE'}</option>
                  <option value="casco">{isTr ? 'KASKO' : 'CASCO'}</option>
                  <option value="inspection">{isTr ? 'MUAYENE' : 'INSPECTION'}</option>
                  <option value="exhaust">{isTr ? 'EGZOZ' : 'EXHAUST'}</option>
                  <option value="other">{isTr ? 'DİĞER' : 'OTHER'}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                    {isTr ? 'Başlangıç' : 'Start'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.issue_date || ''}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded focus:border-blue-500 outline-none transition-all font-black text-[10px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                    {isTr ? 'Bitiş' : 'Expiry'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expiry_date || ''}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded focus:border-blue-500 outline-none transition-all font-black text-[10px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                  {isTr ? 'Poliçe / Dosya No' : 'Policy No'}
                </label>
                <input
                  type="text"
                  value={formData.document_number || ''}
                  onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded focus:border-blue-500 outline-none transition-all font-black text-[10px] uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                  {isTr ? 'Belge / Görsel' : 'Attachment'}
                </label>
                {formData.document_url ? (
                  <div className="flex items-center justify-between p-1.5 bg-white border border-slate-200 rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-indigo-50 flex items-center justify-center border border-indigo-100 overflow-hidden shrink-0">
                        {formData.document_url.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                          <img src={formData.document_url} alt="Evrak" className="w-full h-full object-cover" />
                        ) : (
                          <FileText className="w-3 h-3 text-indigo-600" />
                        )}
                      </div>
                      <a href={formData.document_url} target="_blank" rel="noreferrer" className="text-[8px] font-black text-blue-600 hover:underline uppercase tracking-tighter truncate max-w-[100px]">{isTr ? 'GÖRÜNTÜLE' : 'VIEW'}</a>
                    </div>
                    <button type="button" onClick={() => setFormData({ ...formData, document_url: '' })} className="p-1 text-red-500 hover:bg-red-50 rounded transition-all"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <div className="scale-90 origin-top-left -mb-4">
                    <MultiImageUploader lang={lang} onImagesUploaded={(urls) => urls.length > 0 && setFormData({ ...formData, document_url: urls[0] })} />
                  </div>
                )}
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                  {isTr ? 'Not / Açıklama' : 'Notes'}
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={1}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded focus:border-blue-500 outline-none transition-all font-medium text-[10px] resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 font-black text-[9px] text-slate-400 hover:text-slate-800 uppercase tracking-widest transition-all"
              >
                {isTr ? 'İPTAL' : 'CANCEL'}
              </button>
              <button
                type="submit"
                className="px-6 py-1.5 bg-blue-600 text-white rounded font-black text-[9px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-sm"
              >
                {isTr ? 'KAYDET' : 'SAVE'}
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
