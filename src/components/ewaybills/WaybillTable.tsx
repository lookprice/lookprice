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
  FileText,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X
} from "lucide-react";
import { formatDateTR } from "../../utils/formatUtils";

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
  handleCheckSchema: (id: number) => void;
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
  handleCheckSchema,
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      <div className="p-3 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/30">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input
            type="text"
            placeholder={isTr ? "Seri, No veya Cari ara..." : "Search waybill, driver or firm..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8 py-1.5 w-full rounded-lg border border-slate-200 outline-none text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/10 transition bg-white"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              title={isTr ? "Aramayı Temizle" : "Clear search"}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{isTr ? "DURUM:" : "STATUS:"}</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-normal text-slate-700 bg-white outline-none cursor-pointer"
          >
            <option value="all">{isTr ? "TÜMÜ" : "ALL"}</option>
            <option value="draft">{isTr ? "TASLAK" : "DRAFT"}</option>
            <option value="queued">{isTr ? "KUYRUKTA" : "QUEUED"}</option>
            <option value="success">{isTr ? "BAŞARILI" : "SUCCESS"}</option>
            <option value="error">{isTr ? "HATALI" : "ERROR"}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
          <p className="text-xs font-medium uppercase tracking-wider">{isTr ? "Yükleniyor..." : "Loading..."}</p>
        </div>
      ) : waybills.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <p className="text-xs font-medium uppercase tracking-wider">{isTr ? "Kayıt Bulunamadı" : "No records found"}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[10px] font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === waybills.filter(w => !w.is_invoiced).length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                  />
                </th>
                <th className="py-2.5 px-3">{isTr ? "İRSALİYE NO" : "WAYBILL NO"}</th>
                <th className="py-2.5 px-3">{isTr ? "ALICI / CARİ" : "RECEIVER"}</th>
                <th className="py-2.5 px-3">{isTr ? "TARİH" : "DATE"}</th>
                <th className="py-2.5 px-3">{isTr ? "NAKLİYE" : "LOGISTICS"}</th>
                <th className="py-2.5 px-3 text-center">{isTr ? "DURUM" : "STATUS"}</th>
                <th className="py-2.5 px-4 text-right">{isTr ? "İŞLEMLER" : "ACTIONS"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {waybills.map((w) => {
                const label = w.company_title || w.company_name || `${w.customer_name || ''} ${w.customer_surname || ''}`.trim() || (isTr ? "Genel Müşteri / Şube" : "Generic Branch / Customer");
                const isChecked = selectedIds.includes(w.id);

                return (
                  <tr key={w.id} className={`hover:bg-slate-50/50 transition-colors ${isChecked ? 'bg-indigo-50/20' : ''}`}>
                    <td className="py-2.5 px-4">
                      <input
                        type="checkbox"
                        disabled={w.is_invoiced}
                        checked={isChecked}
                        onChange={() => toggleSelectId(w.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 disabled:opacity-20"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-900 flex items-center gap-1.5 uppercase">
                        {w.waybill_number}
                        {w.is_invoiced && (
                          <span className="px-1.5 py-0.5 rounded-[4px] text-[9px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-100">
                            {isTr ? "FATURALANDI" : "BILLED"}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal flex items-center gap-1 uppercase">
                        <span>{w.prefix}</span>
                        <span>•</span>
                        <span>{w.scenario}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700 truncate max-w-[240px]">
                      {label}
                      {w.linked_invoice_number && (
                        <div className="text-[10px] text-indigo-500 font-normal flex items-center gap-1 mt-0.5">
                          <FileText className="h-3 w-3" />
                          {isTr ? `REF: ${w.linked_invoice_number}` : `REF: ${w.linked_invoice_number}`}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-normal text-slate-600 text-xs tabular-nums">
                      <div>{formatDateTR(w.waybill_date)}</div>
                      <div className="text-[10px] text-slate-400">{w.waybill_time || "12:00"}</div>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-600">
                      <div className="font-medium uppercase">{w.plate_number || (isTr ? "ÖZEL" : "SELF")}</div>
                      <div className="text-slate-400 font-normal truncate max-w-[140px] text-[11px]">
                        {w.driver_name ? `${w.driver_name} ${w.driver_surname}` : "-"}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {(() => {
                        const st = (w.status || 'draft').toLowerCase();
                        if (st === 'draft') {
                          return (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              {isTr ? "TASLAK" : "DRAFT"}
                            </span>
                          );
                        }
                        if (st === 'queued') {
                          return (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                              {isTr ? "KUYRUKTA" : "QUEUED"}
                            </span>
                          );
                        }
                        if (st === 'success') {
                          return (
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default" 
                              title={w.message || (isTr ? "GİB'e iletildi ve onaylandı." : "Approved by GIB")}
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {isTr ? "GİB'E İLETİLDİ" : "APPROVED"}
                            </span>
                          );
                        }
                        if (st === 'error') {
                          return (
                            <div className="inline-flex flex-col items-center">
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200 cursor-help"
                                title={w.message || (isTr ? "Gönderim sırasında hata oluştu" : "Error sending waybill")}
                              >
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                {isTr ? "HATALI" : "ERROR"}
                              </span>
                              {w.message && (
                                <span className="text-[9px] text-rose-600 font-normal max-w-[130px] truncate mt-0.5" title={w.message}>
                                  {w.message}
                                </span>
                              )}
                            </div>
                          );
                        }
                        return (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                            {w.status}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-2.5 px-4 text-right space-x-1 whitespace-nowrap">
                      {((w.status || '').toLowerCase() === 'queued') && (
                        <button 
                          onClick={() => handleCheckStatus(w.id)} 
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition border border-transparent hover:border-amber-100 cursor-pointer"
                          title={isTr ? "GİB Durumunu Yenile" : "Refresh GIB Status"}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      )}
                      
                      {((w.status || '').toLowerCase() === 'draft' || (w.status || '').toLowerCase() === 'error') && (
                        <>
                          <button 
                            onClick={() => handleCheckSchema(w.id)} 
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition border border-transparent hover:border-emerald-100 cursor-pointer" 
                            title={isTr ? "GİB Şema & Veri Doğrulama (Test Kontrol)" : "Verify GIB Schematron (Pre-check)"}
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => handleSendToMysoft(w.id)} 
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition border border-transparent hover:border-indigo-100 cursor-pointer font-medium" 
                            title={isTr ? "MySoft / GİB'e Gönder" : "Send to MySoft / GIB"}
                          >
                            <CloudUpload className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => handleOpenEdit(w)} 
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition border border-transparent hover:border-slate-200 cursor-pointer"
                            title={isTr ? "İrsaliyeyi Düzenle" : "Edit Waybill"}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}

                      {((w.status || '').toLowerCase() === 'success') && (
                        <button 
                          onClick={() => handlePrintView(w)} 
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition border border-transparent hover:border-emerald-100 cursor-pointer"
                          title={isTr ? "Yazdır / HTML Görüntüle" : "Print / View HTML"}
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <button 
                        onClick={() => handleViewDetails(w)} 
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition border border-transparent hover:border-slate-200 cursor-pointer"
                        title={isTr ? "İrsaliye Detaylarını Görüntüle" : "View Waybill Details"}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      {!w.is_invoiced && (
                        <button 
                          onClick={() => handleDelete(w.id)} 
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition border border-transparent hover:border-rose-100 cursor-pointer"
                          title={isTr ? "İrsaliyeyi Sil" : "Delete Waybill"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
