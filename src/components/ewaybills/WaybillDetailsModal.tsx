import React from "react";
import { X, Truck, FileText } from "lucide-react";
import { motion } from "motion/react";
import { formatDateTR } from "../../utils/formatUtils";

interface WaybillDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isTr: boolean;
  selectedWaybill: any;
}

export const WaybillDetailsModal: React.FC<WaybillDetailsModalProps> = ({
  isOpen, onClose, isTr, selectedWaybill
}) => {
  if (!isOpen || !selectedWaybill) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
      >
        <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-900 flex justify-between items-center">
          <h2 className="text-xs font-semibold text-white flex items-center gap-2 uppercase tracking-wider">
            <Truck className="h-4 w-4 text-blue-400" />
            {isTr ? `İRSALİYE DETAYI (${selectedWaybill.waybill_number})` : `Waybill Details`}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded transition-all">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
              <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">{isTr ? "ALICI / CARİ" : "RECIPIENT"}</span>
              <span className="text-xs text-slate-900 block font-medium">
                {selectedWaybill.company_title || selectedWaybill.company_name || `${selectedWaybill.customer_name || ''} ${selectedWaybill.customer_surname || ''}`}
              </span>
              <span className="text-[11px] text-slate-500 block font-mono">{isTr ? "VKN/TCKN:" : "Tax ID:"} {selectedWaybill.company_tax_number || "-"}</span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
              <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">{isTr ? "SEVK TARİHİ" : "SHIPMENT DATE"}</span>
              <span className="text-xs text-slate-900 block font-medium">{formatDateTR(selectedWaybill.waybill_date)} • {selectedWaybill.waybill_time || '12:00'}</span>
              <span className="text-[10px] text-emerald-600 block flex items-center gap-1 font-medium uppercase">{isTr ? "Yol İzin Vesikası Aktif" : "Waybill Active"}
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
              {selectedWaybill.is_cargo_shipment ? (
                <>
                  <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">{isTr ? "KARGO / SEVK" : "CARGO DETAILS"}
                  </span>
                  <span className="text-xs text-slate-900 block uppercase font-medium">{selectedWaybill.carrier_name || "-"}</span>
                  <span className="text-[11px] text-indigo-600 block font-normal">{selectedWaybill.delivery_term || "-"} • {selectedWaybill.transport_mode === '1' ? 'KARAYOLU' : 'DİĞER'}</span>
                </>
              ) : (
                <>
                  <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">{isTr ? "ARAÇ & SÜRÜCÜ" : "VEHICLE & DRIVER"}
                  </span>
                  <span className="text-xs text-slate-900 block font-medium uppercase">{selectedWaybill.plate_number || "-"}</span>
                  <span className="text-[11px] text-slate-500 block uppercase font-normal">{selectedWaybill.driver_name ? `${selectedWaybill.driver_name} ${selectedWaybill.driver_surname}` : "-"}</span>
                </>
              )
              }
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] font-medium text-slate-500 uppercase tracking-wider px-1">{isTr ? "KALEM DETAYLARI" : "LINE ITEMS"}</h4>
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-medium text-[10px] uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="p-2 px-3">{isTr ? "ÜRÜN ADI / TANIMI" : "PRODUCT"}</th>
                    <th className="p-2 text-center w-24">{isTr ? "MİKTAR" : "QTY"}</th>
                    <th className="p-2 px-3 w-28">{isTr ? "BİRİM" : "UNIT"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedWaybill.items || []).map((it: any) => (
                    <tr key={it.id}>
                      <td className="p-2 px-3 font-normal text-slate-800">{it.product_name}</td>
                      <td className="p-2 text-center font-medium text-indigo-600 tabular-nums">{it.quantity}</td>
                      <td className="p-2 px-3 font-normal text-slate-500 uppercase">{it.unit_code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] font-medium text-slate-400 uppercase block mb-1 tracking-wider">{isTr ? "NOTLAR / AÇIKLAMA" : "NOTES"}</span>
            <p className="text-xs text-slate-200">{selectedWaybill.notes || "-"}</p>
          </div>
        </div>

        <div className="p-3 px-4 border-t border-slate-100 bg-white flex justify-end shrink-0">
          <button onClick={onClose} className="px-6 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium uppercase tracking-wider hover:bg-slate-800 transition-all active:scale-95">{isTr ? "KAPAT" : "CLOSE"}</button>
        </div>
      </motion.div>
    </div>
  );
};
