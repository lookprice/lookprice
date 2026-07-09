import React from "react";
import { X, Truck, FileText } from "lucide-react";
import { motion } from "motion/react";

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
        <div className="p-4 px-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Truck className="h-5 w-5 text-indigo-600" />
            {isTr ? `İrsaliye Detaylı Görünümü (${selectedWaybill.waybill_number})` : `Waybill Particular details`}
          </h2>
          <button onClick={onClose} className="p-1 px-2 rounded-xl hover:bg-slate-200 text-slate-400 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
              <span className="text-xs font-semibold text-slate-400 block">{isTr ? "ALICI UNVAN / CARİ" : "RECIPIENT"}</span>
              <strong className="text-sm text-slate-800 block">
                {selectedWaybill.company_title || selectedWaybill.company_name || `${selectedWaybill.customer_name || ''} ${selectedWaybill.customer_surname || ''}`}
              </strong>
              <span className="text-xs text-slate-400 block">{isTr ? "VKN/TCKN:" : "Tax ID:"} {selectedWaybill.company_tax_number || "11111111111"}</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
              <span className="text-xs font-semibold text-slate-400 block">{isTr ? "PLANLANAN SEVK TARİHİ" : "SHIPMENT LOGISTICS"}</span>
              <strong className="text-sm text-slate-800 block">{new Date(selectedWaybill.waybill_date).toLocaleDateString()} {selectedWaybill.waybill_time}</strong>
              <span className="text-xs text-emerald-600 block flex items-center gap-1 font-semibold">{isTr ? "Yol İzin Vesikası Aktif" : "Waybill Transport Active"}</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
              {selectedWaybill.is_cargo_shipment ? (
                <>
                  <span className="text-xs font-semibold text-slate-400 block">{isTr ? "KARGO / SEVK DETAYI" : "CARGO SHIPMENT DETAILS"}</span>
                  <strong className="text-sm text-slate-800 block">{selectedWaybill.carrier_name || "Belirtilmedi"}</strong>
                  <span className="text-xs text-slate-500 block font-mono">{isTr ? "Takip No: " : "Track No: "} {selectedWaybill.tracking_number || "Girilmedi"}</span>
                  <span className="text-[10px] text-indigo-600 block font-bold">{selectedWaybill.delivery_term || "CFR"} - {selectedWaybill.transport_mode === '1' ? (isTr ? 'Karayolu' : 'Road') : selectedWaybill.transport_mode === '2' ? (isTr ? 'Denizyolu' : 'Sea') : selectedWaybill.transport_mode === '3' ? (isTr ? 'Havayolu' : 'Air') : (isTr ? 'Demiryolu' : 'Rail')}</span>
                </>
              ) : (
                <>
                  <span className="text-xs font-semibold text-slate-400 block">{isTr ? "ARAÇ VE PLAKALAR" : "TRUCK PLATES"}</span>
                  <strong className="text-sm text-slate-800 block">{selectedWaybill.plate_number || "Plaka Belirtilmedi"}</strong>
                  <span className="text-xs text-slate-500 block">{selectedWaybill.driver_name ? `${selectedWaybill.driver_name} ${selectedWaybill.driver_surname}` : "Sürücü Yok"}</span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isTr ? "MAL HİZMET DETAYLARI" : "LINE CONTENTS"}</h4>
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-3">{isTr ? "Ürün Adı / Tanımı" : "Product label"}</th>
                    <th className="p-3 text-center">{isTr ? "Miktar" : "Quantity"}</th>
                    <th className="p-3">{isTr ? "Ölçü Birmi" : "Unit"}</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedWaybill.items || []).map((it: any) => (
                    <tr key={it.id} className="border-b border-slate-50">
                      <td className="p-3 font-medium text-slate-800">{it.product_name}</td>
                      <td className="p-3 text-center font-bold">{it.quantity}</td>
                      <td className="p-3">{it.unit_code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{isTr ? "MAHSUS NOTLAR / AÇIKLAMA" : "WAYBILL INSTRUCTIONS"}</span>
            <p className="text-xs text-slate-600 leading-relaxed italic">{selectedWaybill.notes || (isTr ? "İrsaliye notu eklenmedi." : "No waybill notes added.")}</p>
          </div>
        </div>

        <div className="p-4 px-6 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition">{isTr ? "Kapat" : "Close"}</button>
        </div>
      </motion.div>
    </div>
  );
};
