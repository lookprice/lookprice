import React from "react";
import { 
  Search, 
  RefreshCw, 
  Printer, 
  CloudUpload, 
  Loader2, 
  Edit, 
  Trash2, 
  Eye,
  FileText
} from "lucide-react";

interface WaybillTableProps {
  isTr: boolean;
  waybills: any[];
  loading: boolean;
  search: string;
  setSearch: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  selectedIds: number[];
  toggleSelectAll: () => void;
  toggleSelectId: (id: number) => void;
  handleCheckStatus: (id: number) => void;
  handleSendToMysoft: (id: number) => void;
  handlePrintView: (w: any) => void;
  handleOpenEdit: (w: any) => void;
  handleViewDetails: (w: any) => void;
  handleDelete: (id: number) => void;
}

export const WaybillTable: React.FC<WaybillTableProps> = ({
  isTr,
  waybills,
  loading,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  selectedIds,
  toggleSelectAll,
  toggleSelectId,
  handleCheckStatus,
  handleSendToMysoft,
  handlePrintView,
  handleOpenEdit,
  handleViewDetails,
  handleDelete
}) => {
  const getStatusBadgeClass = (status: string) => {
    const styleMap: any = {
      draft: "bg-slate-100 text-slate-700 border-slate-200",
      queued: "bg-amber-50 text-amber-700 border-amber-200 animate-pulse",
      success: "bg-emerald-50 text-emerald-700 border-emerald-200",
      error: "bg-rose-50 text-rose-700 border-rose-200"
    };
    return `inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${styleMap[status.toLowerCase()] || 'bg-slate-100'}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={isTr ? "Seri No, İrsaliye Numarası veya Muhattap Cari ara..." : "Search waybill number, driver or firm..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-full rounded-xl border border-slate-200 outline-none text-sm focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">{isTr ? "Durum Filtresi:" : "Status filter:"}</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 outline-none"
          >
            <option value="all">{isTr ? "Tüm İrsaliyeler" : "All Waybills"}</option>
            <option value="draft">{isTr ? "Taslak" : "Draft"}</option>
            <option value="queued">{isTr ? "Kuyrukta" : "Queued"}</option>
            <option value="success">{isTr ? "Başarılı" : "Success"}</option>
            <option value="error">{isTr ? "Hatalı" : "Error"}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <p className="text-sm font-semibold">{isTr ? "Yükleniyor..." : "Loading..."}</p>
        </div>
      ) : waybills.length === 0 ? (
        <div className="py-20 text-center text-slate-400">
          <p className="text-sm font-medium">{isTr ? "Aranan kriterlere uygun irsaliye kaydı bulunamadı." : "No waybill records found."}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-4 px-5 w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === waybills.filter(w => !w.is_invoiced).length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                </th>
                <th className="py-4 px-4">{isTr ? "İrsaliye No / Seri" : "Waybill Number"}</th>
                <th className="py-4 px-4">{isTr ? "Alıcı / Cari" : "Receiver Business"}</th>
                <th className="py-4 px-4">{isTr ? "Tevzi Tarihi" : "Logistics Dates"}</th>
                <th className="py-4 px-4">{isTr ? "Nakliye & Plaka" : "Logistics info"}</th>
                <th className="py-4 px-4 text-center">{isTr ? "Durum" : "Status"}</th>
                <th className="py-4 px-5 text-right">{isTr ? "İşlemler" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {waybills.map((w) => {
                const label = w.company_title || w.company_name || `${w.customer_name || ''} ${w.customer_surname || ''}` || (isTr ? "Genel Müşteri / Şube" : "Generic Branch / Customer");
                const isChecked = selectedIds.includes(w.id);

                return (
                  <tr key={w.id} className={`hover:bg-slate-50/80 transition-colors ${isChecked ? 'bg-indigo-50/30' : ''}`}>
                    <td className="py-3.5 px-5">
                      <input
                        type="checkbox"
                        disabled={w.is_invoiced}
                        checked={isChecked}
                        onChange={() => toggleSelectId(w.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 disabled:opacity-30 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        {w.waybill_number}
                        {w.is_invoiced && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            {isTr ? "FATURALANDI" : "BILLED"}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <span>{w.scenario}</span>
                        <span>•</span>
                        <span>{w.prefix}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {label}
                      {w.linked_invoice_number && (
                        <div className="text-xs text-slate-500 mt-0.5 font-normal flex items-center gap-1">
                          <FileText className="h-3 w-3 text-slate-400" />
                          {isTr ? `Kapsayan Fatura: ${w.linked_invoice_number}` : `Parent Invoice: ${w.linked_invoice_number}`}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600">
                      <div>{new Date(w.waybill_date).toLocaleDateString('tr-TR')}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{w.waybill_time || "12:00"}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div className="font-bold">{w.plate_number || (isTr ? "Kendi Sürücüsü/Yaya" : "Self Carrier")}</div>
                      <div className="text-slate-400 mt-0.5">
                        {w.driver_name ? `${w.driver_name} ${w.driver_surname}` : (isTr ? "Sürücü Belirtilmedi" : "Driver generic")}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={getStatusBadgeClass(w.status)}>
                        {w.status === 'draft' && (isTr ? "Taslak" : "Draft")}
                        {w.status === 'queued' && (isTr ? "Kuyrukta" : "Queued")}
                        {w.status === 'success' && (isTr ? "GİB Gönderildi" : "GİB Approved")}
                        {w.status === 'error' && (isTr ? "Hata" : "Error")}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right space-x-1.5 whitespace-nowrap">
                      {w.status === 'queued' && (
                        <button
                          onClick={() => handleCheckStatus(w.id)}
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      )}
                      
                      {w.status === 'draft' && (
                        <>
                          <button
                            onClick={() => handleSendToMysoft(w.id)}
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition"
                          >
                            <CloudUpload className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(w)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </>
                      )}

                      {w.status === 'success' && (
                        <button
                          onClick={() => handlePrintView(w)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleViewDetails(w)}
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {!w.is_invoiced && (
                        <button
                          onClick={() => handleDelete(w.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
