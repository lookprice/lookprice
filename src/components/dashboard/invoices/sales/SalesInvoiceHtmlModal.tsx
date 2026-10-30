import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, Loader2, Maximize2, Minimize2 } from 'lucide-react';

interface SalesInvoiceHtmlModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
  htmlLoading: boolean;
  isTr: boolean;
}

export const SalesInvoiceHtmlModal: React.FC<SalesInvoiceHtmlModalProps> = ({
  isOpen,
  onClose,
  htmlContent,
  htmlLoading,
  isTr
}) => {
  if (!isOpen) return null;

  const [iframeReady, setIframeReady] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    setIframeReady(false);
  }, [htmlContent]);

  const getStyledHtml = (html: string) => {
    if (!html) return '';
    const printStyles = `
      <style id="a4-print-styles">
        @media screen {
          html, body {
            background-color: #f1f5f9 !important;
            margin: 0 !important;
            padding: 12px !important;
          }
          body {
            width: 100% !important;
            max-width: 960px !important;
            margin: 0 auto !important;
            padding: 24px !important;
            background-color: #ffffff !important;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
            box-sizing: border-box !important;
            border-radius: 8px !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
          }
          table {
            width: 100% !important;
            max-width: 100% !important;
            table-layout: auto !important;
            box-sizing: border-box !important;
          }
        }

        @media print {
          @page {
            size: A4 portrait !important;
            margin: 6mm 8mm 6mm 8mm !important;
          }
          html, body {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 10px !important;
            line-height: 1.25 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          table {
            width: 100% !important;
            max-width: 100% !important;
            table-layout: auto !important;
            border-collapse: collapse !important;
            box-sizing: border-box !important;
            margin: 0 0 6px 0 !important;
          }
          table tr {
            page-break-inside: avoid !important;
          }
          td, th {
            padding: 3px 4px !important;
            font-size: 9.5px !important;
            line-height: 1.2 !important;
            box-sizing: border-box !important;
            word-break: break-word !important;
          }
          img {
            max-height: 65px !important;
            max-width: 180px !important;
            object-fit: contain !important;
          }
          .invoice-notes-box {
            margin-top: 6px !important;
            padding: 6px 10px !important;
            border: 1px solid #000 !important;
            font-size: 9.5px !important;
            line-height: 1.25 !important;
            page-break-inside: auto !important;
          }
          h1, h2, h3, h4, p, div {
            margin-top: 2px !important;
            margin-bottom: 2px !important;
          }
        }
      </style>
    `;
    if (html.includes("</head>")) {
      return html.replace("</head>", `${printStyles}</head>`);
    } else if (html.includes("<head>")) {
      return html.replace("<head>", `<head>${printStyles}`);
    } else {
      return printStyles + html;
    }
  };

  return (
    <AnimatePresence>
      <div className={`fixed inset-0 z-[160] flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-2 sm:p-4'} bg-slate-900/60 backdrop-blur-sm overflow-hidden`}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`bg-white shadow-2xl w-full flex flex-col overflow-hidden transition-all duration-200 ${
            isFullscreen 
              ? 'fixed inset-0 w-screen h-screen max-w-none max-h-none rounded-none' 
              : 'max-w-6xl h-[92vh] rounded-2xl sm:rounded-3xl border border-slate-200'
          }`}
        >
          <div className="px-4 py-3 sm:px-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">{isTr ? 'E-Fatura Resmi Görseli' : 'E-Invoice Preview'}</h3>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button 
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title={isFullscreen ? (isTr ? "Pencere Boyutuna Dön" : "Exit Fullscreen") : (isTr ? "Tam Ekran Görünüm" : "Fullscreen")}
              >
                {isFullscreen ? <Minimize2 className="h-3.5 w-3.5 text-indigo-600" /> : <Maximize2 className="h-3.5 w-3.5 text-slate-600" />}
                <span className="hidden sm:inline font-semibold">{isFullscreen ? (isTr ? "Küçült" : "Windowed") : (isTr ? "Tam Ekran" : "Fullscreen")}</span>
              </button>
              <button 
                type="button"
                onClick={() => {
                  const iframe = document.getElementById('sales-invoice-iframe') as HTMLIFrameElement;
                  if (iframe?.contentWindow) {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                  }
                }} 
                className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{isTr ? 'Yazdır' : 'Print'}</span>
              </button>
              <button 
                type="button"
                onClick={() => {
                  setIsFullscreen(false);
                  onClose();
                }} 
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition-all cursor-pointer"
                title={isTr ? "Kapat" : "Close"}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className={`relative flex-1 overflow-auto bg-slate-100/90 ${isFullscreen ? 'p-2 sm:p-4' : 'p-3 sm:p-6'} flex justify-center`}>
            {(htmlLoading || !iframeReady) && (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/90 backdrop-blur-xs gap-4 z-10 transition-opacity duration-300">
                 <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                 <p className="text-sm font-medium text-slate-500 animate-pulse uppercase tracking-widest">{isTr ? 'Görsel Hazırlanıyor...' : 'Preparing Preview...'}</p>
               </div>
            )}
            <iframe 
              id="sales-invoice-iframe"
              srcDoc={getStyledHtml(htmlContent)}
              onLoad={() => setIframeReady(true)}
              className={`w-full h-full bg-white shadow-md rounded-2xl min-h-[60vh] border-0 transition-opacity duration-300 ${
                iframeReady && !htmlLoading ? 'opacity-100' : 'opacity-0'
              }`}
              title="Invoice Preview"
              referrerPolicy="no-referrer"
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
