import React, { useState } from "react";
import { X, Truck, Printer, Loader2, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(115);

  if (!isOpen || !selectedWaybill) return null;

  const getStyledWaybillHtml = (rawHtml: string) => {
    if (!rawHtml) return "";
    // Fix invalid inline body margin syntax from GİB XSLT and remove any invoice-only "İrsaliye Yerine Geçer." phrase from waybill view
    const cleanedHtml = rawHtml
      .replace(/charset=utf-16/gi, "charset=utf-8")
      .replace(/margin-left=0\.6in;\s*margin-right=0\.6in;\s*margin-top=0\.79in;\s*margin-bottom=0\.79in/gi, "")
      .replace(/<b>\s*(?:&nbsp;|\u00a0|\s)*Not:\s*<\/b>\s*İrsaliye\s+Yerine\s+Geçer\.?(?:<br\s*\/?>)*/gi, "")
      .replace(/İrsaliye\s+Yerine\s+Geçer\.?/gi, "");

    const customStyles = `
      <style id="waybill-a4-screen-print-styles">
        @media screen {
          html {
            background-color: #cbd5e1 !important;
            margin: 0 !important;
            padding: 16px !important;
          }
          body {
            width: 100% !important;
            max-width: 960px !important;
            min-height: calc(100vh - 48px) !important;
            margin: 0 auto !important;
            padding: 28px 32px !important;
            background-color: #ffffff !important;
            box-shadow: 0 10px 30px rgba(15, 23, 42, 0.14) !important;
            border-radius: 8px !important;
            box-sizing: border-box !important;
            zoom: ${zoom}% !important;
            color: #0f172a !important;
          }
          table {
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
        }
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 8mm 10mm !important;
          }
          html, body {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            box-shadow: none !important;
            zoom: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      </style>
    `;

    if (cleanedHtml.includes("</head>")) {
      return cleanedHtml.replace("</head>", `${customStyles}</head>`);
    }
    return `${customStyles}${cleanedHtml}`;
  };

  return (
    <div className="fixed inset-0 z-[160] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <motion.div 
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`bg-white flex flex-col shadow-2xl border border-slate-200 overflow-hidden transition-all duration-200 ${
          isFullscreen
            ? "w-screen h-screen max-w-none max-h-none rounded-none"
            : "w-full max-w-6xl h-[94vh] rounded-2xl"
        }`}
      >
        <div className="py-2.5 px-4 sm:px-6 border-b border-slate-200 bg-slate-900 text-white flex flex-wrap justify-between items-center gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Truck className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-xs sm:text-sm flex items-center gap-2">
                {isTr ? `Resmî E-İrsaliye Görsel Baskısı (${selectedWaybill.waybill_number})` : `Official e-Waybill Visual Representation (${selectedWaybill.waybill_number})`}
              </h2>
              {selectedWaybill.ettn && (
                <p className="text-[10px] text-slate-300 font-mono">ETTN: {selectedWaybill.ettn}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 text-slate-200">
              <button
                type="button"
                onClick={() => setZoom(z => Math.max(75, z - 10))}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-200 transition cursor-pointer"
                title={isTr ? "Küçült" : "Zoom Out"}
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="px-2 text-[11px] font-mono font-semibold text-white min-w-[46px] text-center">
                %{zoom}
              </span>
              <button
                type="button"
                onClick={() => setZoom(z => Math.min(160, z + 10))}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-200 transition cursor-pointer"
                title={isTr ? "Büyüt" : "Zoom In"}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(115)}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition cursor-pointer border-l border-slate-700"
                title={isTr ? "Varsayılan Boyut" : "Reset Zoom"}
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsFullscreen(f => !f)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
              title={isFullscreen ? (isTr ? "Normal Boyut" : "Exit Fullscreen") : (isTr ? "Tam Ekran" : "Fullscreen")}
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5 text-indigo-400" /> : <Maximize2 className="h-3.5 w-3.5 text-indigo-400" />}
              <span className="hidden md:inline">{isFullscreen ? (isTr ? "Küçült" : "Restore") : (isTr ? "Tam Ekran" : "Fullscreen")}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const frame = document.getElementById('waybill_print_iframe') as HTMLIFrameElement;
                if (frame && frame.contentWindow) {
                  frame.contentWindow.focus();
                  frame.contentWindow.print();
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              {isTr ? "Yazdır / PDF Kaydet" : "Print / Save PDF"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-300 overflow-hidden flex items-center justify-center relative">
          {previewLoading ? (
            <div className="flex flex-col items-center justify-center text-slate-700 gap-2 bg-white/90 px-6 py-4 rounded-2xl shadow">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
              <p className="text-xs font-medium">{isTr ? "Entegratörden resmî e-İrsaliye belgesi alınıyor..." : "Downloading official e-Waybill document..."}</p>
            </div>
          ) : (
            <iframe
              id="waybill_print_iframe"
              className="w-full h-full bg-slate-300 border-0"
              srcDoc={getStyledWaybillHtml(previewContent)}
              title="e-Irsaliye PDF Doc"
            />
          )}
        </div>
      </motion.div>
    </div>
  );
};

