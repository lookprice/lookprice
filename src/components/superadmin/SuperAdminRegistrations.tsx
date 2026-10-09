import React from "react";
import { Package, Mail, Phone, MapPin, Globe, CheckCircle2, XCircle, Trash2 } from "lucide-react";

interface SuperAdminRegistrationsProps {
  registrationRequests: any[];
  st: any;
  handleApproveRegistration: (id: number) => void;
  handleRejectRegistration: (id: number) => void;
  handleDeleteRegistrationRequest: (id: number) => void;
}

export const SuperAdminRegistrations: React.FC<SuperAdminRegistrationsProps> = ({
  registrationRequests,
  st,
  handleApproveRegistration,
  handleRejectRegistration,
  handleDeleteRegistrationRequest
}) => {
  return (
    <section className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden mb-8">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Package className="h-5 w-5 text-amber-500" /> {st.registrationRequests}
        </h2>
        <p className="text-xs text-gray-500 font-medium">Sisteme yeni dahil olmak isteyen mağaza başvuruları</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/30">
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">BAŞVURU SAHİBİ</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">İLETİŞİM</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">MAĞAZA DETAYI</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">DURUM</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">{st.action}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {registrationRequests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">
                  Henüz yeni bir başvuru bulunmuyor.
                </td>
              </tr>
            ) : (
              registrationRequests.map(req => (
                <tr key={req.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-amber-50 text-amber-700 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                        {req.store_name.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">{req.store_name}</p>
                        <p className="text-[10px] text-gray-400 font-medium italic">@{req.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-xs text-gray-600 font-medium">
                        <Mail className="h-3 w-3 mr-1.5 text-gray-400" /> {req.admin_email}
                      </div>
                      <div className="flex items-center text-[10px] text-gray-400 font-mono">
                        <Phone className="h-3 w-3 mr-1.5" /> {req.phone || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-xs text-gray-600 font-medium">
                        <MapPin className="h-3 w-3 mr-1.5 text-gray-400" /> {req.address || 'N/A'}
                      </div>
                      <div className="flex items-center text-[10px] text-indigo-500 font-bold uppercase tracking-tighter">
                        <Globe className="h-3 w-3 mr-1.5" /> {req.country} / {req.language}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      req.status === 'pending' ? 'bg-amber-50 text-amber-700 animate-pulse' :
                      req.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                      'bg-rose-50 text-rose-700'
                    }`}>
                      {req.status === 'pending' ? 'Onay Bekliyor' :
                       req.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {req.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleApproveRegistration(req.id)}
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Onayla"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleRejectRegistration(req.id)}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Reddet"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => handleDeleteRegistrationRequest(req.id)}
                        className="p-2 text-gray-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
