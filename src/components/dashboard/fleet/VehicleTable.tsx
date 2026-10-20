import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Car, 
  MapPin, 
  AlertCircle, 
  Eye, 
  Share2, 
  Edit2, 
  Trash2, 
  FileSignature,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Globe,
  Sparkles,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { Vehicle, Driver, VehicleDocument, VehicleAssignment, VehicleMaintenance } from '../../../types';
import { VehicleAppointmentModal } from '../../VehicleAppointmentModal';

interface VehicleTableProps {
  vehicles: Vehicle[];
  paginatedVehicles: Vehicle[];
  t: any;
  lang: string;
  allDocuments: VehicleDocument[];
  allAssignments: VehicleAssignment[];
  drivers: Driver[];
  allDriverDocuments: any[];
  allMaintenance: VehicleMaintenance[];
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  generateVehicleTitle: (vehicle: Vehicle) => string;
  setSelectedVehicle: (vehicle: Vehicle) => void;
  fetchVehicleDetails: (vehicle: Vehicle) => void;
  setShowDetailModal: (val: boolean) => void;
  setShareVehicle: (vehicle: Vehicle) => void;
  setIsShareModalOpen: (val: boolean) => void;
  setFormData: (val: any) => void;
  setShowAddModal: (val: boolean) => void;
  handleDeleteVehicle: (id: number) => void;
  setAutoContractVehicle: (vehicle: Vehicle) => void;
  setIsAutoContractOpen: (val: boolean) => void;
}

export const VehicleTable: React.FC<VehicleTableProps> = ({
  vehicles,
  paginatedVehicles,
  t,
  lang,
  allDocuments,
  allAssignments,
  drivers,
  allDriverDocuments,
  allMaintenance,
  getStatusColor,
  getStatusText,
  generateVehicleTitle,
  setSelectedVehicle,
  fetchVehicleDetails,
  setShowDetailModal,
  setShareVehicle,
  setIsShareModalOpen,
  setFormData,
  setShowAddModal,
  handleDeleteVehicle,
  setAutoContractVehicle,
  setIsAutoContractOpen,
}) => {
  const [activePreviewImages, setActivePreviewImages] = useState<string[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState<number>(0);
  const [previewVehiclePlate, setPreviewVehiclePlate] = useState<string>('');
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState<boolean>(false);
  const [appointmentVehicleId, setAppointmentVehicleId] = useState<number | string | undefined>(undefined);

  const getVehicleImagesList = (vehicle: Vehicle): string[] => {
    if (!vehicle.images) return [];
    try {
      const imgs = typeof vehicle.images === 'string' ? JSON.parse(vehicle.images) : vehicle.images;
      if (Array.isArray(imgs)) {
        return imgs.filter((img): img is string => typeof img === 'string' && img.trim() !== '');
      }
    } catch (e) {
      // fallback handled below
    }
    const rawImages = vehicle.images as any;
    if (typeof rawImages === 'string' && rawImages.startsWith('http')) {
      return [rawImages];
    }
    return [];
  };

  const getThumbnailUrl = (vehicle: Vehicle): string | null => {
    const list = getVehicleImagesList(vehicle);
    return list.length > 0 ? list[0] : null;
  };

  const openPreview = (vehicle: Vehicle) => {
    const imgs = getVehicleImagesList(vehicle);
    if (imgs.length > 0) {
      setActivePreviewImages(imgs);
      setActivePreviewIndex(0);
      setPreviewVehiclePlate(vehicle.plate);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {paginatedVehicles.map((vehicle) => (
          <div key={vehicle.id} className="bg-white p-3 rounded-xl border border-slate-200 hover:shadow-md transition-all space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {(() => {
                  const thumb = getThumbnailUrl(vehicle);
                  if (thumb) {
                    return (
                      <div 
                        onClick={() => openPreview(vehicle)}
                        className="w-10 h-10 rounded-lg overflow-hidden relative group cursor-pointer border border-slate-200 shrink-0 active:scale-95 transition-all"
                      >
                        <img src={thumb} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt={vehicle.plate} />
                      </div>
                    );
                  }
                  return (
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
                      <Car className="w-5 h-5" />
                    </div>
                  );
                })()}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-black text-slate-900 text-sm uppercase tracking-tight truncate">{vehicle.plate}</p>
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-black uppercase tracking-widest border border-blue-100">
                      {vehicle.category === 'hafif_ticari' ? (lang === 'tr' ? 'Ticari' : 'Comm') : 
                       vehicle.category === 'suv' ? (lang === 'tr' ? 'SUV' : 'SUV') :
                       vehicle.category === 'pickup' ? (lang === 'tr' ? 'Pick-up' : 'Pick-up') :
                       (lang === 'tr' ? 'Oto' : 'Car')}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight truncate">{generateVehicleTitle(vehicle)}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1 items-end shrink-0">
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${getStatusColor(vehicle.status)}`}>
                  {getStatusText(vehicle.status)}
                </span>
                {vehicle.selling_price && (
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {vehicle.selling_price.toLocaleString()} {vehicle.currency || 'TRY'}
                  </span>
                )}
              </div>
            </div>
            
            <div className="py-2 border-y border-slate-50 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-700 shrink-0">
                <MapPin className="w-3 h-3 text-slate-400" />
                {(vehicle.current_mileage || 0).toLocaleString()} <span className="text-[8px] text-slate-400">KM</span>
              </div>
              <div className="flex gap-1 shrink-0">
                {allDocuments
                  .filter(d => d.vehicle_id === vehicle.id && d.type !== 'Ruhsat-Koçan' && new Date(d.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
                  .map((d, idx) => (
                    <div key={idx} className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-[8px] font-black border border-amber-100 uppercase">{d.type}</div>
                  ))
                }
                {(vehicle.maintenance_due || 0) > 0 && (vehicle.current_mileage || 0) >= (vehicle.maintenance_due || 0) && (
                  <div className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-[8px] font-black border border-red-100 uppercase">{t.service}</div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-1">
               <div className="flex items-center gap-1">
                 <button onClick={() => { setSelectedVehicle(vehicle); fetchVehicleDetails(vehicle); setShowDetailModal(true); }} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100" title="İncele"><Eye className="w-3.5 h-3.5" /></button>
                 <button onClick={() => { setShareVehicle(vehicle); setIsShareModalOpen(true); }} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100" title="Paylaş"><Share2 className="w-3.5 h-3.5" /></button>
                 <button onClick={() => { setAppointmentVehicleId(vehicle.id); setIsAppointmentModalOpen(true); }} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100" title="Randevu"><Calendar className="w-3.5 h-3.5" /></button>
               </div>
               <div className="flex items-center gap-1">
                 <button onClick={() => { setAutoContractVehicle(vehicle); setIsAutoContractOpen(true); }} className="p-1.5 bg-violet-50 text-violet-600 rounded-lg border border-violet-100" title="Sözleşme"><FileSignature className="w-3.5 h-3.5" /></button>
                 <button onClick={() => { setSelectedVehicle(vehicle); setFormData({...vehicle}); setShowAddModal(true); }} className="p-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100" title="Düzenle"><Edit2 className="w-3.5 h-3.5" /></button>
                 <button onClick={() => handleDeleteVehicle(vehicle.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg border border-red-100" title="Sil"><Trash2 className="w-3.5 h-3.5" /></button>
               </div>
            </div>
          </div>
        ))}
      </div>


      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">#</th>
                <th className="p-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">{t.vehicleInfo}</th>
                <th className="p-2 text-[9px] font-black text-slate-500 uppercase tracking-widest min-w-[110px]">{t.status}</th>
                <th className="p-2 text-[9px] font-black text-slate-500 uppercase tracking-widest min-w-[100px]">Yayın</th>
                <th className="p-2 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">KM</th>
                <th className="p-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">{t.alerts}</th>
                <th className="p-2 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right min-w-[140px] whitespace-nowrap">{t.actions}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-2 text-[10px] font-black text-slate-400 font-mono">
                    {vehicle.id}
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const thumb = getThumbnailUrl(vehicle);
                        if (thumb) {
                          return (
                            <div 
                              onClick={() => openPreview(vehicle)}
                              className="w-8 h-8 rounded bg-slate-100 overflow-hidden relative group cursor-pointer border border-slate-200 shrink-0"
                            >
                              <img src={thumb} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt={vehicle.plate} />
                            </div>
                          );
                        }
                        return (
                          <div className="w-8 h-8 bg-slate-50 rounded flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                            <Car className="w-3.5 h-3.5" />
                          </div>
                        );
                      })()}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-black text-slate-900 text-[11px] uppercase tracking-tighter truncate">{vehicle.plate}</p>
                          <span className="px-1 bg-blue-50 text-blue-600 rounded text-[7px] font-black uppercase tracking-widest border border-blue-100">
                            {vehicle.category?.substring(0, 3)}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-500 font-bold truncate uppercase tracking-tighter">{generateVehicleTitle(vehicle)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-2 min-w-[110px]">
                    <div className="flex flex-col gap-0.5 items-start">
                      <span className={`px-1 rounded-sm text-[7px] font-black uppercase tracking-widest border ${getStatusColor(vehicle.status)}`}>
                        {getStatusText(vehicle.status)}
                      </span>
                      {vehicle.selling_price && (
                        <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-1 rounded-sm border border-emerald-200/30 tabular-nums">
                          {vehicle.selling_price.toLocaleString()} <span className="text-[8px] opacity-60">{vehicle.currency || 'TRY'}</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-2 min-w-[100px]">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className={`px-1 rounded-sm text-[7px] font-black border uppercase tracking-tighter ${vehicle.is_on_website !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>Web</span>
                      <span className={`px-1 rounded-sm text-[7px] font-black border uppercase tracking-tighter ${vehicle.is_on_enrakipsiz ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>EnR</span>
                    </div>
                  </td>
                  <td className="p-2 text-center">
                    <div className="inline-flex items-center gap-1 text-[10px] font-black text-slate-900 tabular-nums tracking-tighter">
                      {(vehicle.current_mileage || 0).toLocaleString()} <span className="text-[8px] text-slate-400">KM</span>
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="flex gap-1 flex-wrap max-w-[120px]">
                      {allDocuments
                        .filter(d => d.vehicle_id === vehicle.id && d.type !== 'Ruhsat-Koçan' && new Date(d.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
                        .map((d, idx) => (
                          <div key={idx} className="px-1 bg-amber-50 text-amber-600 rounded text-[7px] font-black border border-amber-100 uppercase tracking-tighter">{d.type}</div>
                        ))
                      }
                      {(vehicle.maintenance_due || 0) > 0 && (vehicle.current_mileage || 0) >= (vehicle.maintenance_due || 0) && (
                        <div className="px-1 bg-red-50 text-red-600 rounded text-[7px] font-black border border-red-100 uppercase tracking-tighter">SERVİS</div>
                      )}
                    </div>
                  </td>
                  <td className="p-2 text-right min-w-[140px]">
                    <div className="flex justify-end gap-0.5 items-center">
                      <button onClick={() => { setAppointmentVehicleId(vehicle.id); setIsAppointmentModalOpen(true); }} className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Randevu"><Calendar className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { setAutoContractVehicle(vehicle); setIsAutoContractOpen(true); }} className="p-1.5 text-violet-400 hover:text-violet-600 hover:bg-violet-50 rounded" title="Sözleşme"><FileSignature className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { setSelectedVehicle(vehicle); fetchVehicleDetails(vehicle); setShowDetailModal(true); }} className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="İncele"><Eye className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { setShareVehicle(vehicle); setIsShareModalOpen(true); }} className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Paylaş"><Share2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { setSelectedVehicle(vehicle); setFormData({...vehicle}); setShowAddModal(true); }} className="p-1.5 text-amber-400 hover:text-amber-600 hover:bg-amber-50 rounded" title="Düzenle"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteVehicle(vehicle.id)} className="p-1.5 text-red-300 hover:text-red-600 hover:bg-red-50 rounded" title="Sil"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Image Gallery / Preview Modal */}
      <AnimatePresence>
        {activePreviewImages.length > 0 && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop with elegant frosted glass */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePreviewImages([])}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl relative z-10 w-full max-w-2xl overflow-hidden flex flex-col text-white"
            >
              {/* Header inside modal */}
              <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-sm font-black tracking-wider uppercase text-slate-300">
                    {previewVehiclePlate} - {lang === 'tr' ? 'Araç Görseli' : 'Vehicle Image'}
                  </span>
                </div>
                <button
                  onClick={() => setActivePreviewImages([])}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Image View */}
              <div className="relative flex-1 flex items-center justify-center min-h-[300px] max-h-[500px] bg-slate-950 p-6">
                <img
                  src={activePreviewImages[activePreviewIndex]}
                  alt="Vehicle Preview"
                  className="max-h-[380px] w-auto max-w-full object-contain rounded-xl shadow-lg border border-slate-850"
                  referrerPolicy="no-referrer"
                />

                {/* Left/Right Navigation Arrows if there are multiple images */}
                {activePreviewImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePreviewIndex((prev) => (prev === 0 ? activePreviewImages.length - 1 : prev - 1));
                      }}
                      className="absolute left-4 p-2.5 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 rounded-full text-white transition-all shadow-md active:scale-90"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePreviewIndex((prev) => (prev === activePreviewImages.length - 1 ? 0 : prev + 1));
                      }}
                      className="absolute right-4 p-2.5 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 rounded-full text-white transition-all shadow-md active:scale-90"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Footer Indicator / Image Strips */}
              <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                <div className="font-mono bg-slate-950 px-2.5 py-1 rounded-lg">
                  {activePreviewIndex + 1} / {activePreviewImages.length}
                </div>
                
                {/* Thumbnails list to jump to specific image */}
                {activePreviewImages.length > 1 && (
                  <div className="flex gap-1.5 overflow-x-auto max-w-[280px] sm:max-w-[350px] no-scrollbar py-0.5">
                    {activePreviewImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePreviewIndex(idx)}
                        className={`w-9 h-9 rounded-md overflow-hidden border transition-all duration-150 shrink-0 ${
                          idx === activePreviewIndex
                            ? 'border-blue-500 ring-2 ring-blue-500/20 opacity-100 scale-105'
                            : 'border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                )}
                
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">
                  {lang === 'tr' ? 'Seçkin Otomotiv' : 'Premium Automotive'}
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Vehicle Appointment Modal */}
      {isAppointmentModalOpen && (
        <VehicleAppointmentModal
          isOpen={isAppointmentModalOpen}
          onClose={() => {
            setIsAppointmentModalOpen(false);
            setAppointmentVehicleId(undefined);
          }}
          storeId={vehicles[0]?.store_id || 1}
          vehicles={vehicles}
          initialVehicleId={appointmentVehicleId}
          onSuccess={() => {
            // Success callback
          }}
        />
      )}
    </div>
  );
};
