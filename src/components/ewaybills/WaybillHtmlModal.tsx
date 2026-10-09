import React from "react";
import { X, Truck, Printer, Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface WaybillHtmlModalProps {
  isOpen: boolean;
  onClose: () => void;
  isTr: boolean;
  selectedWaybill: any;
  previewLoading: boolean;
  previewContent: string;
}

export const WaybillHtmlModal: React.FC<WaybillHtmlModalProps> = ({
  isOpen, onClose, isTr, selectedWaybill, previewLoading, previewContent
}) => {
  if (!isOpen || !selectedWaybill) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden"
      >
        <div className="p-4 px-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Truck className="h-4 w-4 text-emerald-600" />
              {isTr ? `Resmî E-İrsaliye Görsel Baskısı (${selectedWaybill.waybill_number})` : `Official e-Waybill visual print representation`}
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{selectedWaybill.ettn}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const frame = document.getElementById('waybill_print_iframe') as HTMLIFrameElement;
                if (frame && frame.contentWindow) {
                  frame.contentWindow.print();
                }
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5 text-indigo-600" />
              {isTr ? "Yazdır / PDF Kaydet" : "Print PDF"}
            </button>
            <button onClick={onClose} className="p-1 px-2 rounded-xl hover:bg-slate-200 text-slate-400 transition">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-100 p-6 overflow-hidden flex items-center justify-center relative">
          {previewLoading ? (
            <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
              <p className="text-xs font-bold">{isTr ? "Entegratörden döküman şablonu alınıyor..." : "Downloading visual markup..."}</p>
            </div>
          ) : (
            <iframe
              id="waybill_print_iframe"
              className="w-full h-full bg-white rounded-2xl shadow-inner border border-slate-200"
              srcDoc={previewContent}
              title="e-Irsaliye PDF Doc"
            />
          )}
        </div>
      </motion.div>
    </div>
  );
};
