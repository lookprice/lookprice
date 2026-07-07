import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Upload, FileUp, Check } from "lucide-react";

interface ImportModalProps {
  showImportModal: boolean;
  setShowImportModal: (show: boolean) => void;
  isImporting: boolean;
  importFile: File | null;
  importColumns: string[];
  mapping: any;
  setMapping: (m: any) => void;
  convertCurrency: boolean;
  setConvertCurrency: (c: boolean) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleImport: (e: React.FormEvent) => void;
  t: any;
  lang: string;
}

export const ImportModal = ({
  showImportModal,
  setShowImportModal,
  isImporting,
  importFile,
  importColumns,
  mapping,
  setMapping,
  convertCurrency,
  setConvertCurrency,
  handleFileSelect,
  handleImport,
  t,
  lang
}: ImportModalProps) => {
  if (!showImportModal) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-xl font-bold text-gray-900">{t.importProducts || "Ürün İçe Aktar"}</h3>
          <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleImport} className="p-6 overflow-y-auto space-y-6">
          {!importFile ? (
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all">
              <Upload className="h-10 w-10 text-gray-400 mb-2" />
              <span className="text-sm font-bold text-gray-600">{t.selectFile || "Dosya Seç"}</span>
              <input type="file" onChange={handleFileSelect} className="hidden" accept=".xlsx,.xls" />
            </label>
          ) : (
            <div className="p-4 bg-emerald-50 rounded-2xl flex items-center justify-between border border-emerald-100">
              <div className="flex items-center gap-3">
                <FileUp className="h-6 w-6 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-900 truncate max-w-[200px]">{importFile.name}</span>
              </div>
              <button type="button" onClick={() => setMapping({})} className="text-xs font-bold text-red-600 hover:underline">{t.change || "Değiştir"}</button>
            </div>
          )}

          {importColumns.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.columnMapping || "Sütun Eşleme"}</p>
              {Object.keys(mapping).map((key) => (
                <div key={key} className="grid grid-cols-2 gap-4 items-center">
                  <span className="text-sm font-bold text-gray-700 capitalize">{key}</span>
                  <select 
                    value={mapping[key]}
                    onChange={(e) => setMapping({...mapping, [key]: e.target.value})}
                    className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold"
                  >
                    <option value="">{t.selectColumn || "Sütun Seç"}</option>
                    {importColumns.map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                </div>
              ))}
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <input 
                  type="checkbox" 
                  checked={convertCurrency} 
                  onChange={(e) => setConvertCurrency(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-sm font-bold text-gray-700">{t.convertCurrency || "Para Birimini Çevir"}</span>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isImporting || !importFile}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
          >
            {isImporting ? t.importing || "Aktarılıyor..." : t.startImport || "İçe Aktarmayı Başlat"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
