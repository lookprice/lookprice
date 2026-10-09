import React from "react";
import { Bell, Printer } from "lucide-react";
import { printThermalReceipt } from "../../utils/thermalPrinter";

export interface PosServiceCallsBannerProps {
  storeTableCalls: Array<{ id: string | number; tableId: string | number; type: string }>;
  lang: string;
  pendingSales: any[];
  branding: any;
  handlePrintTableBill: (sale: any) => void;
  handleResolveTableCall: (callId: string | number) => void;
}

export const PosServiceCallsBanner: React.FC<PosServiceCallsBannerProps> = ({
  storeTableCalls,
  lang,
  pendingSales,
  branding,
  handlePrintTableBill,
  handleResolveTableCall
}) => {
  if (!storeTableCalls || storeTableCalls.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500 to-rose-600 text-white p-3 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse shrink-0">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-xl">
          <Bell className="w-6 h-6 text-white animate-bounce" />
        </div>
        <div>
          <h3 className="font-extrabold text-sm tracking-wide">
            {lang === 'tr' ? `Müşteri Talep Bildirimi (${storeTableCalls.length} Bekleyen)` : `Customer Table Requests (${storeTableCalls.length} Pending)`}
          </h3>
          <p className="text-xs text-amber-100 font-medium">
            {storeTableCalls.map(c => `${c.tableId}: ${c.type}`).join(' | ')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto max-w-full">
        {storeTableCalls.map(call => {
          const saleForCall = pendingSales.find(s => 
            s.customer_name?.toLowerCase().includes(call.tableId.toString().toLowerCase()) || 
            s.restaurant_table_id?.toString() === call.tableId.toString()
          );
          return (
            <div key={call.id} className="bg-white/15 backdrop-blur-xs px-3 py-1.5 rounded-xl flex items-center gap-2 shrink-0 border border-white/20">
              <span className="text-xs font-black">{call.tableId} - {call.type}</span>
              <button
                type="button"
                onClick={() => {
                  if (saleForCall) {
                    handlePrintTableBill(saleForCall);
                  } else {
                    printThermalReceipt({
                      title: "HESAP TALEBİ FİŞİ",
                      storeName: branding?.store_name || branding?.name || 'TELOCA CAFE',
                      storePhone: branding?.phone || branding?.whatsapp_number,
                      tableNo: call.tableId.toString(),
                      items: [],
                      totalAmount: 0,
                      paymentMethod: "HESAP İSTENDİ"
                    });
                  }
                }}
                className="px-2 py-0.5 bg-indigo-900/80 hover:bg-indigo-900 text-white rounded-lg text-[10px] font-extrabold transition-all cursor-pointer shadow-xs flex items-center gap-1"
                title={lang === 'tr' ? 'Masaya ait adisyon fişini yazdır' : 'Print bill for table'}
              >
                <Printer className="w-3 h-3 text-amber-300" />
                {lang === 'tr' ? 'Fiş Yazdır' : 'Print Bill'}
              </button>
              <button
                type="button"
                onClick={() => handleResolveTableCall(call.id)}
                className="px-2 py-0.5 bg-white text-rose-700 hover:bg-rose-50 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer shadow-xs"
              >
                {lang === 'tr' ? 'İlgilenildi' : 'Resolve'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
