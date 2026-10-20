import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDateTR } from '../../../utils/formatUtils';
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
  Info,
  Settings,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { 
  Vehicle, 
  VehicleDocument, 
  VehicleMaintenance, 
  VehicleAssignment, 
  VehicleMileage, 
  VehicleIncident 
} from '../../../types';
import { formatFuelType, formatTransmission } from '../../../utils/formatUtils';

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
  onEditVehicle?: () => void;
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
  handleUpdateAssignment,
  onEditVehicle
}) => {
  if (!isOpen || !vehicle) return null;
  const isTr = lang === 'tr';

  const sections = [
    { id: 'docs', icon: FileText, label: t.documents || 'Dokümanlar', color: 'blue' },
    { id: 'maintenance', icon: Wrench, label: t.maintenance || 'Bakım Kayıtları', color: 'orange' },
    { id: 'assignments', icon: UserCheck, label: t.history || 'Zimmet & Sürücü', color: 'indigo' },
    { id: 'mileage', icon: History, label: t.mileageLogs || 'KM Geçmişi', color: 'emerald' },
    { id: 'incidents', icon: AlertTriangle, label: t.incidents || 'Hasar & Olaylar', color: 'red' }
  ];

  // Parse paint report
  const paintData = (() => {
    try {
      return typeof vehicle.paint_report === 'string' ? JSON.parse(vehicle.paint_report || '{}') : (vehicle.paint_report || {});
    } catch {
      return {};
    }
  })();

  const paintCounts = Object.values(paintData).reduce<{ original: number; painted: number; replaced: number }>(
    (acc, status: any) => {
      if (status === 'painted') acc.painted++;
      else if (status === 'replaced') acc.replaced++;
      else acc.original++;
      return acc;
    },
    { original: 0, painted: 0, replaced: 0 }
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-1 sm:p-2">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.98, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.98, opacity: 0, y: 10 }}
        className="bg-white w-full max-w-6xl h-[94vh] rounded-xl shadow-2xl relative z-10 overflow-hidden flex flex-col border border-slate-800"
      >
        {/* Compact Header */}
        <div className="px-3 py-1 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-medium tracking-widest uppercase flex items-center gap-1 shadow-sm shrink-0 border border-blue-500/50">
              <Car className="w-3 h-3" />
              <span>{vehicle.plate}</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-[10px] font-medium text-white truncate flex items-center gap-2 uppercase tracking-widest">
                <span>{generateVehicleTitle(vehicle)}</span>
                <span className={`px-1.5 py-0 rounded-[4px] text-[8px] font-medium uppercase tracking-widest border ${getStatusColor(vehicle.status).replace('bg-', 'bg-opacity-20 border-')}`}>
                  {getStatusText(vehicle.status)}
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {vehicle.selling_price && (
              <div className="hidden sm:flex items-center gap-1 bg-emerald-950 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded text-[9px] font-medium uppercase tracking-tighter">
                <Tag className="w-2.5 h-2.5 text-emerald-400" />
                <span>{vehicle.selling_price.toLocaleString()} {vehicle.currency || 'TRY'}</span>
              </div>
            )}

            {!isViewer && onEditVehicle && (
              <button
                onClick={onEditVehicle}
                className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-[9px] font-medium uppercase tracking-widest transition-all border border-slate-700"
              >
                <Settings className="w-2.5 h-2.5" />
                <span>{isTr ? 'DÜZENLE' : 'EDIT'}</span>
              </button>
            )}

            <button onClick={onClose} className="p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Split Layout */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left / Main Dossier Panel (Secere Künyesi) */}
          <div className="w-full lg:w-[320px] bg-slate-50 border-r border-slate-200 flex flex-col overflow-y-auto custom-scrollbar p-2.5 space-y-2 shrink-0">
            {/* Main Photo Thumbnail */}
            <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-slate-300/50 bg-slate-200 shadow-sm group shrink-0">
              {vehicle.images && vehicle.images.length > 0 ? (
                <img 
                  src={vehicle.images[0]} 
                  alt={vehicle.plate} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center gap-1 text-slate-400">
                  <Car className="w-6 h-6 text-slate-300" />
                  <span className="text-[9px] font-medium uppercase tracking-wider">{isTr ? 'Görsel Yok' : 'No Image'}</span>
                </div>
              )}
              {vehicle.images && vehicle.images.length > 1 && (
                <span className="absolute bottom-1 right-1 bg-slate-900/90 text-white text-[8px] font-medium px-1.5 py-0.5 rounded backdrop-blur-xs border border-white/10">
                  +{vehicle.images.length - 1} FOTO
                </span>
              )}
            </div>

            {/* ARAÇ SECERESİ & KÜNYESİ (Micro Bento Grid) */}
            <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1 px-0.5">
                <span className="text-[9px] font-medium text-slate-900 uppercase tracking-widest flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                  Araç Künyesi & Seceresi
                </span>
                <span className="text-[8px] font-mono font-medium text-slate-400">#{vehicle.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[8px] font-medium text-slate-400 uppercase block mb-0.5">Plaka</span>
                  <span className="font-medium text-slate-900 font-mono tracking-tighter uppercase">{vehicle.plate}</span>
                </div>

                <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[8px] font-medium text-slate-400 uppercase block mb-0.5">Satış Fiyatı</span>
                  <span className="font-medium text-emerald-700 tracking-tighter">
                    {vehicle.selling_price ? `${vehicle.selling_price.toLocaleString()} ${vehicle.currency || 'TRY'}` : 'N/A'}
                  </span>
                </div>

                <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[8px] font-medium text-slate-400 uppercase block mb-0.5">Marka / Model</span>
                  <span className="font-medium text-slate-800 truncate block tracking-tight uppercase">{vehicle.brand} {vehicle.model}</span>
                </div>

                <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[8px] font-medium text-slate-400 uppercase block mb-0.5">Yıl / KM</span>
                  <span className="font-medium text-slate-800 tracking-tighter">{vehicle.year} • {(vehicle.current_mileage || 0).toLocaleString()} KM</span>
                </div>

                <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[8px] font-medium text-slate-400 uppercase block mb-0.5">Yakıt / Vites</span>
                  <span className="font-medium text-slate-700 truncate block tracking-tighter uppercase">
                    {formatFuelType(vehicle.fuel_type)} • {formatTransmission(vehicle.transmission)}
                  </span>
                </div>

                <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[8px] font-medium text-slate-400 uppercase block mb-0.5">Paket / Renk</span>
                  <span className="font-medium text-slate-700 truncate block tracking-tighter uppercase">
                    {vehicle.package_name || '-'} {vehicle.color ? `(${vehicle.color})` : ''}
                  </span>
                </div>

                <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[8px] font-medium text-slate-400 uppercase block mb-0.5">Kategori / Kasa</span>
                  <span className="font-medium text-slate-700 truncate block tracking-tighter uppercase">
                    {vehicle.category || 'Otomobil'} {vehicle.body_type ? `• ${vehicle.body_type}` : ''}
                  </span>
                </div>

                <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[8px] font-medium text-slate-400 uppercase block mb-0.5">Tramer Kaydı</span>
                  <span className="font-medium text-slate-900 tracking-tighter">
                    {vehicle.tramer_amount ? `${vehicle.tramer_amount.toLocaleString()} TL` : '0 TL (Temiz)'}
                  </span>
                </div>

                {vehicle.chassis_number && (
                  <div className="col-span-2 p-1.5 bg-slate-50 rounded border border-slate-100 flex items-center justify-between">
                    <span className="text-[8px] font-medium text-slate-400 uppercase">Şasi:</span>
                    <span className="font-mono text-[10px] font-medium text-slate-800 tracking-tight">{vehicle.chassis_number}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ekspertiz Özeti */}
            <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs space-y-1.5">
              <span className="text-[9px] font-medium text-slate-900 uppercase tracking-widest block border-b border-slate-100 pb-1">
                Ekspertiz Durumu
              </span>
              <div className="flex items-center justify-between text-[10px] font-medium pt-0.5 px-0.5 uppercase tracking-tighter">
                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                  Orj: {paintCounts.original}
                </span>
                <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                  Boy: {paintCounts.painted}
                </span>
                <span className="text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                  Değ: {paintCounts.replaced}
                </span>
              </div>
            </div>

            {/* Descriptions (Pazar Hikayesi & Teknik) */}
            {vehicle.market_story && (
              <div className="bg-indigo-50/40 p-2 rounded-lg border border-indigo-100 space-y-1">
                <span className="text-[9px] font-medium text-indigo-700 uppercase tracking-widest block">Açıklama</span>
                <p className="text-[10px] text-slate-800 leading-tight font-medium line-clamp-3 italic">"{vehicle.market_story}"</p>
              </div>
            )}
          </div>

          {/* Right Sub-Records Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Tabs Navigation */}
            <div className="px-2 py-1 bg-slate-900 flex items-center gap-0.5 overflow-x-auto no-scrollbar shrink-0 border-b border-white/5">
              {sections.map((sec) => {
                const isActive = activeVehicleTab === sec.id;
                const Icon = sec.icon;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveVehicleTab(sec.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[10px] font-medium transition-all whitespace-nowrap uppercase tracking-widest border-x border-t ${
                      isActive 
                        ? 'bg-white text-blue-600 border-white/10 shadow-sm' 
                        : 'text-slate-400 hover:text-white border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{sec.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sub-Tab Header Bar */}
            <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <span className="text-[10px] font-medium text-slate-900 uppercase tracking-widest flex items-center gap-2">
                {(() => {
                  const s = sections.find(x => x.id === activeVehicleTab);
                  return s ? (
                    <>
                      <s.icon className="w-3.5 h-3.5 text-blue-600" />
                      {s.label}
                    </>
                  ) : null;
                })()}
              </span>

              {!isViewer && (
                <button
                  onClick={() => {
                    if (activeVehicleTab === 'docs') onAddDocument();
                    else if (activeVehicleTab === 'maintenance') onAddMaintenance();
                    else if (activeVehicleTab === 'assignments') onAddAssignment();
                    else if (activeVehicleTab === 'mileage') onAddMileage();
                    else if (activeVehicleTab === 'incidents') onAddIncident();
                  }}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-md text-[10px] font-medium hover:bg-blue-700 transition-all uppercase tracking-tighter"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isTr ? 'Kaydı İşle' : 'Add'}</span>
                </button>
              )}
            </div>

            {/* Tab Items List */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-3 custom-scrollbar bg-slate-50/30">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeVehicleTab}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.1 }}
                  className="space-y-1.5"
                >
                  {/* Documents Tab */}
                  {activeVehicleTab === 'docs' && (
                    documents.map((doc) => (
                      <div key={doc.id} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded flex items-center justify-center shrink-0 border border-blue-100">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 text-[11px] truncate uppercase tracking-tighter">{doc.type}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                               <Calendar className="w-2.5 h-2.5 text-slate-400" />
                               <span className="text-[9px] text-slate-500 font-medium uppercase">SON: {new Date(doc.expiry_date).toLocaleDateString('tr-TR')}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {doc.document_url === "is_virtual_contract" ? (
                            <button
                              onClick={() => {
                                let details: any = {};
                                try {
                                  details = typeof doc.notes === 'string' ? JSON.parse(doc.notes) : doc.notes || {};
                                } catch (e) { console.error(e); }
                                
                                const cType = details.contractType || 'consignment';
                                const cTitle = cType === 'consignment' ? 'KONSİNYE SÖZLEŞMESİ' : 'REZERVASYON FORMU';
                                const symbol = vehicle.currency === 'GBP' ? '£' : vehicle.currency === 'USD' ? '$' : vehicle.currency === 'EUR' ? '€' : '₺';
                                const priceFormatted = `${symbol}${(vehicle.selling_price || vehicle.buying_price || 0).toLocaleString()}`;
                                const vehicleDetails = `${vehicle.brand} ${vehicle.model} (${vehicle.year || ''}) • Plaka: ${vehicle.plate || ''} • Şasi: ${vehicle.chassis_number || ''}`;

                                const html = `
                                  <div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #1e293b; line-height: 1.5; font-size: 13px;">
                                    <h2 style="font-size: 16px; font-weight: 900; text-align: center; margin-bottom: 20px;">${cTitle}</h2>
                                    <p><strong>Müşteri:</strong> ${details.clientName || ''} (${details.clientIdentity || ''})</p>
                                    <p><strong>Araç:</strong> ${vehicleDetails}</p>
                                    <p><strong>Fiyat:</strong> ${priceFormatted}</p>
                                    <p><strong>Tarih:</strong> ${details.contractDate || new Date().toLocaleDateString("tr-TR")}</p>
                                  </div>
                                `;
                                const win = window.open('', '_blank');
                                if (win) { win.document.write(`<html><head><title>${cTitle}</title></head><body onload="window.print()">${html}</body></html>`); win.document.close(); }
                              }}
                              className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-medium uppercase hover:bg-emerald-200 transition-colors"
                            >
                              GÖR
                            </button>
                          ) : doc.document_url ? (
                            <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : null}

                          {!isViewer && (
                            <button onClick={() => handleDeleteDocument(doc.id)} className="p-1 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Maintenance Tab */}
                  {activeVehicleTab === 'maintenance' && (
                    maintenance.map((m) => (
                      <div key={m.id} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-orange-50 text-orange-600 rounded flex items-center justify-center border border-orange-100 shrink-0">
                            <Wrench className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 text-[11px] uppercase tracking-tighter">{m.type}</p>
                            <p className="text-[9px] text-slate-500 font-medium uppercase mt-0.5">
                              {m.provider_name || 'Servis'} • {formatDateTR(m.date)} • {(m.mileage || 0).toLocaleString()} KM
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded tabular-nums">{m.cost?.toLocaleString()} TL</span>
                          {!isViewer && (
                            <button onClick={() => handleDeleteMaintenance(m.id)} className="p-1 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Assignments Tab */}
                  {activeVehicleTab === 'assignments' && (
                    assignments.map((a) => (
                      <div key={a.id} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded flex items-center justify-center border shrink-0 ${a.status === 'active' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                            <UserCheck className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 text-[11px] uppercase tracking-tighter truncate max-w-[140px]">{a.user_email}</p>
                            <p className="text-[9px] text-slate-500 font-medium uppercase mt-0.5">
                              {formatDateTR(a.start_date)} • {a.start_mileage?.toLocaleString()} KM
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-medium uppercase tracking-widest border ${a.status === 'active' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                            {a.status === 'active' ? 'AKTİF' : 'BİTTİ'}
                          </span>
                          {a.status === 'active' && !isViewer && (
                            <button onClick={() => handleUpdateAssignment(a.id, 0)} className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[9px] font-medium hover:bg-indigo-700 uppercase tracking-tighter">
                              İADE
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Mileage Tab */}
                  {activeVehicleTab === 'mileage' && (
                    mileageLogs.map((log) => (
                      <div key={log.id} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded flex items-center justify-center border border-emerald-100 shrink-0">
                            <History className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-[11px] font-medium text-slate-900 tracking-tight">{log.mileage.toLocaleString()} KM</p>
                            <p className="text-[9px] text-slate-500 font-medium uppercase mt-0.5">{formatDateTR(log.date)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Incidents Tab */}
                  {activeVehicleTab === 'incidents' && (
                    incidents.map((inc) => (
                      <div key={inc.id} className="p-2 bg-white rounded-lg border-l-4 border-red-500 border-y border-r border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-red-50 text-red-600 rounded flex items-center justify-center border border-red-100 shrink-0">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium text-slate-800 uppercase tracking-tighter truncate">{inc.type}: {inc.description}</p>
                            <p className="text-[9px] text-slate-500 font-medium uppercase mt-0.5">{formatDateTR(inc.date)}</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 tabular-nums shrink-0">{inc.cost?.toLocaleString()} TL</span>
                      </div>
                    ))
                  )}

                  {/* Empty State */}
                  {((activeVehicleTab === 'docs' && documents.length === 0) ||
                    (activeVehicleTab === 'maintenance' && maintenance.length === 0) ||
                    (activeVehicleTab === 'assignments' && assignments.length === 0) ||
                    (activeVehicleTab === 'mileage' && mileageLogs.length === 0) ||
                    (activeVehicleTab === 'incidents' && incidents.length === 0)) && (
                    <div className="py-8 text-center bg-white rounded-lg border border-dashed border-slate-200">
                      <Info className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                      <p className="text-[10px] font-medium text-slate-700 uppercase tracking-widest">{isTr ? 'Kayıt Yok' : 'No Records'}</p>
                      <p className="text-[9px] text-slate-400 font-medium uppercase mt-0.5 tracking-tighter">{isTr ? 'Henüz veri girilmemiş.' : 'No data recorded.'}</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
