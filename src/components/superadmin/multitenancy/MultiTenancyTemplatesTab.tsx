import React from "react";
import { Copy, FileCode2, Download, Upload } from "lucide-react";

interface MultiTenancyTemplatesTabProps {
  handleClonePreset: (presetKey: string) => Promise<void>;
  handleExportJson: () => void;
  jsonConfigInput: string;
  setJsonConfigInput: (val: string) => void;
  handleImportJson: () => void;
}

export const MultiTenancyTemplatesTab: React.FC<MultiTenancyTemplatesTabProps> = ({
  handleClonePreset,
  handleExportJson,
  jsonConfigInput,
  setJsonConfigInput,
  handleImportJson
}) => {
  return (
    <div className="space-y-4 pt-2">
      <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
        <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
          <Copy className="h-4 w-4 text-indigo-500" /> Hazır Sektörel Şablon Klonla
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Aşağıdaki şablonlardan birini seçerek bu mağazanın tüm tasarım, banner ve renk yapılandırmasını tek tıkla standart sektörel ayarlara getirebilirsiniz:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleClonePreset("shoplp_minimal")}
            className="p-2.5 text-xs font-bold bg-white dark:bg-slate-900 border rounded-xl hover:bg-slate-100 text-left"
          >
            🛒 shopLP Standart
          </button>
          <button
            type="button"
            onClick={() => handleClonePreset("bookstore_netflix")}
            className="p-2.5 text-xs font-bold bg-white dark:bg-slate-900 border rounded-xl hover:bg-slate-100 text-left"
          >
            📚 BookLP Sinematik
          </button>
          <button
            type="button"
            onClick={() => handleClonePreset("luxury_auto")}
            className="p-2.5 text-xs font-bold bg-white dark:bg-slate-900 border rounded-xl hover:bg-slate-100 text-left"
          >
            🚗 AutoLP Lüks Galeri
          </button>
          <button
            type="button"
            onClick={() => handleClonePreset("real_estate_idx")}
            className="p-2.5 text-xs font-bold bg-white dark:bg-slate-900 border rounded-xl hover:bg-slate-100 text-left"
          >
            🏡 RestateLP Harita IDX
          </button>
          <button
            type="button"
            onClick={() => handleClonePreset("horeca_bistro")}
            className="p-2.5 text-xs font-bold bg-white dark:bg-slate-900 border rounded-xl hover:bg-slate-100 text-left"
          >
            🍽️ HoReCaLP QR Bistro
          </button>
          <button
            type="button"
            onClick={() => handleClonePreset("modern_tech")}
            className="p-2.5 text-xs font-bold bg-white dark:bg-slate-900 border rounded-xl hover:bg-slate-100 text-left"
          >
            ⚡ Modern Tech Siber
          </button>
        </div>
      </div>

      {/* JSON Export / Import */}
      <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            <FileCode2 className="h-4 w-4 text-purple-500" /> JSON Konfigürasyon Yedekleme & Geri Yükleme
          </h4>
          <button
            type="button"
            onClick={handleExportJson}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            <Download className="h-3.5 w-3.5" /> İndir (.json)
          </button>
        </div>

        <textarea
          rows={4}
          placeholder="Geri yüklemek için JSON konfigürasyonunu buraya yapıştırın..."
          className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
          value={jsonConfigInput}
          onChange={(e) => setJsonConfigInput(e.target.value)}
        />

        {jsonConfigInput && (
          <button
            type="button"
            onClick={handleImportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold"
          >
            <Upload className="h-3.5 w-3.5" /> JSON'u İçe Aktar
          </button>
        )}
      </div>
    </div>
  );
};
