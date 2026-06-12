import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Car, 
  MapPin, 
  AlertCircle, 
  FileText, 
  Wrench, 
  UserCheck, 
  History, 
  AlertTriangle,
  FilePlus,
  Plus,
  Download,
  Calendar,
  Clock,
  Trash2,
  ExternalLink,
  ChevronRight,
  ClipboardList,
  Fuel,
  Info
} from 'lucide-react';
import { 
  Vehicle, 
  VehicleDocument, 
  VehicleMaintenance, 
  VehicleAssignment, 
  VehicleMileage, 
  VehicleIncident 
} from '../../../types';

interface VehicleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  t: any;
  lang: string;
  isViewer: boolean;
  activeVehicleTab: string;
  setActiveVehicleTab: (tab: any) => void;
  documents: VehicleDocument[];
  maintenance: VehicleMaintenance[];
  assignments: VehicleAssignment[];
  mileageLogs: VehicleMileage[];
  incidents: VehicleIncident[];
  drivers: any[];
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  generateVehicleTitle: (vehicle: Vehicle) => string;
  onAddDocument: () => void;
  onAddMaintenance: () => void;
  onAddAssignment: () => void;
  onAddMileage: () => void;
  onAddIncident: () => void;
  handleDeleteDocument: (id: number) => void;
  handleDeleteMaintenance: (id: number) => void;
  handleUpdateAssignment: (id: number, endMileage: number) => void;
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  t,
  lang,
  isViewer,
  activeVehicleTab,
  setActiveVehicleTab,
  documents,
  maintenance,
  assignments,
  mileageLogs,
  incidents,
  drivers,
  getStatusColor,
  getStatusText,
  generateVehicleTitle,
  onAddDocument,
  onAddMaintenance,
  onAddAssignment,
  onAddMileage,
  onAddIncident,
  handleDeleteDocument,
  handleDeleteMaintenance,
  handleUpdateAssignment
}) => {
  if (!isOpen || !vehicle) return null;
  const isTr = lang === 'tr';

  const sections = [
    { id: 'docs', icon: FileText, label: t.documents, color: 'blue' },
    { id: 'maintenance', icon: Wrench, label: t.maintenance, color: 'orange' },
    { id: 'assignments', icon: UserCheck, label: t.history, color: 'indigo' },
    { id: 'mileage', icon: History, label: t.mileageLogs, color: 'emerald' },
    { id: 'incidents', icon: AlertTriangle, label: t.incidents, color: 'red' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 40 }}
        className="bg-white w-full max-w-7xl h-[85vh] rounded-[40px] shadow-2xl relative z-10 overflow-hidden flex flex-col border border-white/20"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200">
              <Car className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{vehicle.plate}</h3>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(vehicle.status)}`}>
                  {getStatusText(vehicle.status)}
                </span>
              </div>
              <p className="text-sm font-bold text-gray-400 mt-0.5">{generateVehicleTitle(vehicle)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end mr-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{isTr ? 'KAYIT NO' : 'RECORD ID'}</span>
              <span className="text-xs font-black text-gray-900 tracking-wider">#{vehicle.id}</span>
            </div>
            <button onClick={onClose} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-95">
              <X className="w-7 h-7" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Main Info Sidebar */}
          <div className="w-full lg:w-[400px] bg-slate-50/50 border-r border-gray-100 flex flex-col overflow-y-auto custom-scrollbar">
            <div className="p-8 space-y-8">
              {/* Show only ONE main image */}
              <div className="space-y-4">
                <div className="relative group aspect-[16/10] rounded-[32px] overflow-hidden shadow-2xl shadow-blue-900/10 border-4 border-white bg-white">
                  {vehicle.images && vehicle.images.length > 0 ? (
                    <img 
                      src={vehicle.images[0]} 
                      alt={vehicle.plate} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center gap-3">
                      <Car className="w-12 h-12 text-slate-300" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isTr ? 'Görsel Yok' : 'No Image'}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Basic Specs */}
              <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm space-y-7">
                <div className="flex flex-col items-center justify-center py-4 bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-200">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">{isTr ? 'PLAKA' : 'PLATE'}</span>
                  <span className="text-3xl font-black tracking-tight">{vehicle.plate}</span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isTr ? 'MARKA' : 'BRAND'}</span>
                    <span className="text-sm font-black text-gray-900">{vehicle.brand}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isTr ? 'MODEL' : 'MODEL'}</span>
                    <span className="text-sm font-black text-gray-900">{vehicle.model}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                  <div className="bg-gray-50 p-3 rounded-2xl space-y-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-blue-600 uppercase tracking-widest">
                      <Calendar className="w-3 h-3" />
                      {isTr ? 'YIL' : 'YEAR'}
                    </div>
                    <span className="text-sm font-black text-gray-900">{vehicle.year}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-2xl space-y-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                      <MapPin className="w-3 h-3" />
                      {isTr ? 'KM' : 'KM'}
                    </div>
                    <span className="text-sm font-black text-gray-900">{(vehicle.current_mileage || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-gray-50 p-3 rounded-2xl space-y-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-600 uppercase tracking-widest">
                      <Fuel className="w-3 h-3" />
                      {isTr ? 'YAKIT' : 'FUEL'}
                    </div>
                    <span className="text-sm font-black text-gray-900 uppercase">{vehicle.fuel_type || '-'}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-2xl space-y-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                      <Clock className="w-3 h-3" />
                      {isTr ? 'VİTES' : 'TRANS'}
                    </div>
                    <span className="text-sm font-black text-gray-900 uppercase">
                      {vehicle.transmission === 'automatic' ? (isTr ? 'OTOMATİK' : 'AUTO') : 
                       vehicle.transmission === 'manual' ? (isTr ? 'MANUEL' : 'MANUAL') : 
                       vehicle.transmission || '-'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{t.chassisNo}</span>
                    <span className="text-xs font-mono font-bold text-gray-500 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 break-all">{vehicle.chassis_number || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Status info */}
              <div className="bg-slate-900 rounded-[32px] p-6 text-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-all">
                  <Car className="w-20 h-20" />
                </div>
                <div className="relative z-10 space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.22em] mb-1">{isTr ? 'GÜNCEL DURUM' : 'CURRENT STATUS'}</p>
                    <p className="text-xl font-black uppercase tracking-tight">{getStatusText(vehicle.status)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                      <Clock className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{isTr ? 'SON GÜNCELLEME' : 'LAST UPDATE'}</p>
                      <p className="text-xs font-black text-slate-300">{new Date(vehicle.updated_at || vehicle.created_at).toLocaleDateString(isTr ? 'tr-TR' : 'en-US')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Tabs Navigation */}
            <div className="px-8 pt-6 shrink-0 flex items-center gap-4 overflow-x-auto no-scrollbar scroll-smooth">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveVehicleTab(section.id as any)}
                  className={`flex flex-col items-center gap-2 pb-4 border-b-4 transition-all whitespace-nowrap min-w-[100px] ${
                    activeVehicleTab === section.id 
                      ? `border-blue-600 text-blue-600` 
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <section.icon className={`w-5 h-5 ${activeVehicleTab === section.id ? 'animate-pulse' : ''}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">{section.label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gray-50/30">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeVehicleTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  {/* Header for content */}
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <h4 className="text-lg font-black text-gray-900 tracking-tight uppercase flex items-center gap-3">
                      {(() => {
                        const s = sections.find(x => x.id === activeVehicleTab);
                        return s ? (
                          <>
                            <div className={`p-2 bg-${s.color}-50 text-${s.color}-600 rounded-xl`}>
                              <s.icon className="w-5 h-5" />
                            </div>
                            {s.label}
                          </>
                        ) : null;
                      })()}
                    </h4>
                    {!isViewer && (
                      <button
                        onClick={() => {
                          if (activeVehicleTab === 'docs') onAddDocument();
                          else if (activeVehicleTab === 'maintenance') onAddMaintenance();
                          else if (activeVehicleTab === 'assignments') onAddAssignment();
                          else if (activeVehicleTab === 'mileage') onAddMileage();
                          else if (activeVehicleTab === 'incidents') onAddIncident();
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                        {isTr ? 'Kaydı Ekle' : 'Add Record'}
                      </button>
                    )}
                  </div>

                  {/* Dynamic Content */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeVehicleTab === 'docs' && (
                      documents.map((doc) => (
                        <div key={doc.id} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                <FileText className="w-6 h-6" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{doc.type}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{isTr ? 'NO' : 'ID'}: {doc.id}</p>
                              </div>
                            </div>
                            {!isViewer && (
                              <button onClick={() => handleDeleteDocument(doc.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <div className="mt-6 flex items-center justify-between text-xs font-bold text-gray-500">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-gray-300" />
                              {isTr ? 'Sona Erme' : 'Expires'}: {new Date(doc.expiry_date).toLocaleDateString()}
                            </span>
                            {doc.document_url && (
                              <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:underline">
                                {isTr ? 'Görüntüle' : 'View'}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    )}

                    {activeVehicleTab === 'maintenance' && (
                      maintenance.map((m) => (
                        <div key={m.id} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center font-black">
                                {m.cost?.toLocaleString()}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{m.type}</p>
                                <p className="text-[10px] text-gray-400 font-bold">{m.provider_name || '-'}</p>
                              </div>
                            </div>
                            {!isViewer && (
                              <button onClick={() => handleDeleteMaintenance(m.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <div className="mt-6 grid grid-cols-2 gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                             <div className="space-y-1">
                                <span className="block">{isTr ? 'TARİH' : 'DATE'}</span>
                                <span className="text-gray-900">{new Date(m.date).toLocaleDateString()}</span>
                             </div>
                             <div className="space-y-1">
                                <span className="block">{isTr ? 'MİLYAJ' : 'MILEAGE'}</span>
                                <span className="text-gray-900">{(m.mileage || 0).toLocaleString()} KM</span>
                             </div>
                          </div>
                        </div>
                      ))
                    )}

                    {activeVehicleTab === 'assignments' && (
                      assignments.map((a) => (
                        <div key={a.id} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                           <div className={`absolute top-0 left-0 w-2 h-full ${a.status === 'active' ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                           <div className="flex items-start justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${a.status === 'active' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                                  <UserCheck className="w-6 h-6" />
                                </div>
                                <div>
                                   <p className="font-bold text-gray-900">{a.user_email}</p>
                                   <p className="text-[10px] font-black uppercase text-indigo-600">{a.status === 'active' ? (isTr ? 'AKTİF ZİMMET' : 'ACTIVE ASSIGNMENT') : (isTr ? 'TAMAMLANDI' : 'COMPLETED')}</p>
                                </div>
                              </div>
                              {a.status === 'active' && !isViewer && (
                                <button onClick={() => handleUpdateAssignment(a.id, 0)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all">
                                  {isTr ? 'İADE AL' : 'RETURN'}
                                </button>
                              )}
                           </div>
                           <div className="mt-6 grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest block">{isTr ? 'BAŞLANGIÇ' : 'START'}</span>
                                <span className="text-xs font-bold text-gray-600">{new Date(a.start_date).toLocaleDateString()}</span>
                              </div>
                              <div className="space-y-1 text-right">
                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest block">{isTr ? 'KM' : 'MILEAGE'}</span>
                                <span className="text-xs font-bold text-gray-600">{a.start_mileage?.toLocaleString()} KM</span>
                              </div>
                           </div>
                        </div>
                      ))
                    )}

                    {activeVehicleTab === 'mileage' && (
                      mileageLogs.map((log) => (
                        <div key={log.id} className="p-6 bg-white rounded-3xl border border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                              <History className="w-5 h-5" />
                            </div>
                            <div>
                               <p className="text-xs font-black text-gray-900">{log.mileage.toLocaleString()} KM</p>
                               <p className="text-[10px] text-gray-400 font-bold">{new Date(log.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-100" />
                        </div>
                      ))
                    )}

                    {activeVehicleTab === 'incidents' && (
                      incidents.map((inc) => (
                        <div key={inc.id} className="p-6 bg-white rounded-3xl border border-red-100 border-l-8 shadow-sm">
                           <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                               <AlertTriangle className="w-3 h-3" />
                               {inc.type}
                             </div>
                             <span className="text-[10px] font-bold text-gray-400">{new Date(inc.date).toLocaleDateString()}</span>
                           </div>
                           <p className="text-sm font-medium text-gray-700 mb-4">{inc.description}</p>
                           <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                              <span className="text-xs font-black text-red-600">{isTr ? 'MALİYET' : 'COST'}: {inc.cost?.toLocaleString()} TRY</span>
                           </div>
                        </div>
                      ))
                    )}

                    {/* Empty State */}
                    {((activeVehicleTab === 'docs' && documents.length === 0) ||
                      (activeVehicleTab === 'maintenance' && maintenance.length === 0) ||
                      (activeVehicleTab === 'assignments' && assignments.length === 0) ||
                      (activeVehicleTab === 'mileage' && mileageLogs.length === 0) ||
                      (activeVehicleTab === 'incidents' && incidents.length === 0)) && (
                      <div className="col-span-full py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-gray-100">
                         <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Info className="w-10 h-10 text-gray-200" />
                         </div>
                         <h5 className="text-lg font-bold text-gray-900 mb-1">{isTr ? 'Kayıt Bulunmuyor' : 'No Records Found'}</h5>
                         <p className="text-sm text-gray-400 font-medium">{isTr ? 'Henüz bu kategoriye ait bir veri girişi yapılmamış.' : 'No data has been entered for this category yet.'}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
