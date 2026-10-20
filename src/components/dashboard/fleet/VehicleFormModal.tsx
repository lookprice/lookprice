import React from 'react';
import { 
  X, 
  Car, 
  Sparkles, 
  RefreshCw, 
  ShieldCheck, 
  Camera, 
  Info, 
  Plus, 
  ImageIcon, 
  Image as ImageIconFallback 
} from 'lucide-react';
import { motion } from 'motion/react';
import { Vehicle } from '../../../types';
import { MultiImageUploader } from '../../MultiImageUploader';
import { ImageGallery } from '../../ImageGallery';

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVehicle: Vehicle | null;
  formData: Partial<Vehicle>;
  setFormData: (data: any) => void;
  t: any;
  lang: string;
  isTr: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  generatingVehicleDesc: boolean;
  handleGenerateVehicleDesc: () => void;
  vehicleAiNotice: string | null;
}

export const VehicleFormModal: React.FC<VehicleFormModalProps> = ({
  isOpen,
  onClose,
  selectedVehicle,
  formData,
  setFormData,
  t,
  lang,
  isTr,
  handleSubmit,
  generatingVehicleDesc,
  handleGenerateVehicleDesc,
  vehicleAiNotice
}) => {
  if (!isOpen) return null;

  const paintReportData = (() => {
    try {
      return typeof formData.paint_report === 'string' ? JSON.parse(formData.paint_report || '{}') : (formData.paint_report || {});
    } catch {
      return {};
    }
  })();

  const setPaintStatus = (part: string, status: 'original' | 'painted' | 'replaced') => {
    const updated = { ...paintReportData, [part]: status };
    setFormData({ ...formData, paint_report: JSON.stringify(updated) });
  };

  const getPaintColor = (status: string) => {
    switch (status) {
      case 'original': return 'bg-emerald-500 text-white';
      case 'painted': return 'bg-amber-500 text-white';
      case 'replaced': return 'bg-red-500 text-white';
      default: return 'bg-slate-200 text-slate-600 hover:bg-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 10 }}
        className="bg-white w-full max-w-5xl h-[92vh] rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col border border-slate-200"
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <div className="px-4 py-1.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white font-medium shadow-xs">
                <Car className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-[11px] font-medium tracking-widest text-white uppercase flex items-center gap-2">
                {selectedVehicle ? (isTr ? 'ARACI DÜZENLE' : 'EDIT VEHICLE') : (isTr ? 'YENİ ARAÇ EKLE' : 'ADD VEHICLE')}
                {selectedVehicle && (
                  <span className="text-[9px] font-mono font-medium bg-slate-800 text-blue-400 px-1.5 py-0.5 rounded border border-slate-700">
                    ID: #{selectedVehicle.id}
                  </span>
                )}
              </h3>
            </div>
            
            {vehicleAiNotice && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-3 flex-1 max-w-sm bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-lg text-[9px] font-medium border border-emerald-800 flex items-center gap-1.5 truncate uppercase tracking-tighter"
              >
                <Sparkles className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                <span className="truncate">{vehicleAiNotice}</span>
              </motion.div>
            )}

            <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content - High Density */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 custom-scrollbar bg-slate-50/50">
            {/* 1. Ruhsat ve Kayıt Bilgileri */}
            <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1 px-0.5">
                <h4 className="text-[9px] font-medium text-blue-700 tracking-widest uppercase flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-blue-600" />
                  1. RUHSAT VE KAYIT BİLGİLERİ
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                <div>
                  <label className="text-[8px] font-medium text-slate-400 uppercase tracking-widest block mb-0.5">Plaka *</label>
                  <input
                    required
                    type="text"
                    value={formData.plate || ''}
                    onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none text-[10px] font-medium uppercase tracking-widest text-slate-900"
                    placeholder="34 ABC 123"
                  />
                </div>

                <div>
                  <label className="text-[8px] font-medium text-slate-400 uppercase tracking-widest block mb-0.5">Araç Tipi *</label>
                  <select
                    value={formData.type || 'company'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none text-[10px] font-medium text-slate-800 uppercase"
                  >
                    <option value="company">{t.company || 'ŞİRKET / GALERİ'}</option>
                    <option value="personal">{t.personal || 'ŞAHIS / KONSİNYE'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-[8px] font-medium text-slate-400 uppercase tracking-widest block mb-0.5">Kategori *</label>
                  <select
                    value={formData.category || 'otomobil'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none text-[10px] font-medium text-slate-800 uppercase"
                  >
                    <option value="otomobil">{isTr ? 'OTOMOBİL' : 'CAR'}</option>
                    <option value="suv">{isTr ? 'SUV / ARAZİ' : 'SUV'}</option>
                    <option value="pickup">{isTr ? 'PICK-UP' : 'PICK-UP'}</option>
                    <option value="hafif_ticari">{isTr ? 'HAFİF TİCARİ' : 'COMMERCIAL'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-[8px] font-medium text-slate-400 uppercase tracking-widest block mb-0.5">Marka *</label>
                  <input
                    required
                    type="text"
                    value={formData.brand || ''}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none text-[10px] font-medium text-slate-800 uppercase"
                    placeholder="FORD"
                  />
                </div>

                <div>
                  <label className="text-[8px] font-medium text-slate-400 uppercase tracking-widest block mb-0.5">Model Adı *</label>
                  <div className="flex gap-1">
                    <input
                      required
                      type="text"
                      value={formData.model || ''}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="flex-1 min-w-0 px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none text-[10px] font-medium text-slate-800 uppercase"
                      placeholder="FOCUS"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[8px] font-medium text-slate-400 uppercase tracking-widest block mb-0.5">Yıl *</label>
                  <input
                    required
                    type="number"
                    value={formData.year || ''}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none text-[10px] font-medium text-slate-800 tabular-nums"
                  />
                </div>

                <div>
                  <label className="text-[8px] font-medium text-slate-400 uppercase tracking-widest block mb-0.5">KM *</label>
                  <input
                    required
                    type="number"
                    value={formData.current_mileage || ''}
                    onChange={(e) => setFormData({ ...formData, current_mileage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none text-[10px] font-medium text-slate-900 tabular-nums"
                  />
                </div>

                <div>
                  <label className="text-[8px] font-medium text-slate-400 uppercase tracking-widest block mb-0.5">Şasi No</label>
                  <input
                    type="text"
                    value={formData.chassis_number || ''}
                    onChange={(e) => setFormData({ ...formData, chassis_number: e.target.value.toUpperCase() })}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none text-[9px] font-mono font-medium text-slate-800 uppercase"
                  />
                </div>

                <div>
                  <label className="text-[8px] font-medium text-slate-400 uppercase tracking-widest block mb-0.5">Durum *</label>
                  <select
                    value={formData.status || 'for_sale'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none text-[10px] font-medium text-slate-800 uppercase"
                  >
                    <option value="for_sale">SATIŞTA</option>
                    <option value="active">AKTİF</option>
                    <option value="in_service">SERVİSTE</option>
                    <option value="sold">SATILDI</option>
                  </select>
                </div>

                {/* Publications & Trade-in Switches Row */}
                <div className="col-span-2 sm:col-span-2 lg:col-span-3 flex flex-wrap gap-1 items-center justify-start py-1">
                  <label className="inline-flex items-center gap-1 px-1 py-0.5 bg-indigo-50 border border-indigo-100 rounded cursor-pointer text-[8px] font-medium text-indigo-950 uppercase tracking-tighter">
                    <input type="checkbox" checked={!!formData.is_trade_in_available} onChange={(e) => setFormData({ ...formData, is_trade_in_available: e.target.checked })} className="w-3 h-3 text-indigo-600 rounded" />
                    Takas
                  </label>
                  <label className="inline-flex items-center gap-1 px-1 py-0.5 bg-indigo-50 border border-indigo-100 rounded cursor-pointer text-[8px] font-medium text-indigo-950 uppercase tracking-tighter">
                    <input type="checkbox" checked={formData.is_on_website !== undefined ? !!formData.is_on_website : true} onChange={(e) => setFormData({ ...formData, is_on_website: e.target.checked })} className="w-3 h-3 text-indigo-600 rounded" />
                    Web
                  </label>
                  <label className="inline-flex items-center gap-1 px-1 py-0.5 bg-indigo-50 border border-indigo-100 rounded cursor-pointer text-[8px] font-medium text-indigo-950 uppercase tracking-tighter">
                    <input type="checkbox" checked={formData.is_on_enrakipsiz !== undefined ? !!formData.is_on_enrakipsiz : true} onChange={(e) => setFormData({ ...formData, is_on_enrakipsiz: e.target.checked })} className="w-3 h-3 text-indigo-600 rounded" />
                    EnR
                  </label>
                </div>
              </div>
            </div>

            {/* 2. Donanım ve Teknik Özellikler & Fiyatlandırma */}
            <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1 px-0.5">
                <h4 className="text-[9px] font-medium text-blue-700 tracking-widest uppercase flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-blue-600" />
                  2. DONANIM, FİYAT VE TEKNİK ÖZELLİKLER
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                <div>
                  <label className="text-[8px] font-medium text-slate-400 uppercase tracking-widest block mb-0.5">Paket</label>
                  <input
                    type="text"
                    value={formData.package_name || ''}
                    onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none text-[10px] font-medium text-slate-800 uppercase"
                    placeholder="TITANIUM"
                  />
                </div>

                <div>
                  <label className="text-[8px] font-medium text-slate-400 uppercase tracking-widest block mb-0.5">Şanzıman</label>
                  <select
                    value={formData.transmission || 'manual'}
                    onChange={(e) => setFormData({ ...formData, transmission: e.target.value as any })}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none text-[10px] font-medium text-slate-800 uppercase"
                  >
                    <option value="manual">MANUEL</option>
                    <option value="automatic">OTOMATİK</option>
                  </select>
                </div>

                <div>
                  <label className="text-[8px] font-medium text-slate-400 uppercase tracking-widest block mb-0.5">Yakıt</label>
                  <select
                    value={String(formData.fuel_type || 'gasoline').toLowerCase().trim()}
                    onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value as any })}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none text-[10px] font-medium text-slate-800 uppercase"
                  >
                    <option value="gasoline">BENZİN</option>
                    <option value="diesel">DİZEL</option>
                    <option value="hybrid">HİBRİT</option>
                    <option value="electric">ELEKTRİK</option>
                  </select>
                </div>

                <div>
                  <label className="text-[8px] font-medium text-emerald-600 uppercase tracking-widest block mb-0.5">Fiyat *</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={formData.selling_price || ''}
                      onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                      className="flex-1 min-w-0 px-2 py-1 bg-emerald-50 border border-emerald-100 rounded outline-none text-[11px] font-medium text-emerald-900 tabular-nums"
                    />
                    <select
                      value={formData.currency || 'TRY'}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="px-1 py-1 bg-emerald-100 border border-emerald-200 rounded outline-none font-medium text-[9px] text-emerald-900 shrink-0"
                    >
                      <option value="TRY">₺</option>
                      <option value="USD">$</option>
                      <option value="EUR">€</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>


            {/* 3. Ekspertiz ve Boya/Değişen Durumu */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1 px-0.5">
                <h4 className="text-[10px] font-medium text-blue-700 tracking-widest uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  3. EKSPERTİZ, BOYA/DEĞİŞEN & TRAMER
                </h4>
                <div className="flex items-center gap-2 text-[8px] font-medium uppercase tracking-widest">
                  <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded bg-emerald-500" /> ORJ</span>
                  <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded bg-amber-500" /> BOY</span>
                  <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded bg-red-500" /> DEĞ</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                {/* Paint Part Buttons Grid */}
                <div className="md:col-span-9 grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-1">
                  {[
                    { id: 'hood', label: 'Kaput' },
                    { id: 'roof', label: 'Tavan' },
                    { id: 'trunk', label: 'Bagaj' },
                    { id: 'front_bumper', label: 'Ön Tampon' },
                    { id: 'rear_bumper', label: 'Arka Tampon' },
                    { id: 'front_left_fender', label: 'Ön Sol Çam' },
                    { id: 'front_right_fender', label: 'Ön Sağ Çam' },
                    { id: 'rear_left_fender', label: 'Arka Sol Çam' },
                    { id: 'rear_right_fender', label: 'Arka Sağ Çam' },
                    { id: 'front_left_door', label: 'Ön Sol Kapı' },
                    { id: 'front_right_door', label: 'Ön Sağ Kapı' },
                    { id: 'rear_left_door', label: 'Arka Sol Kapı' },
                    { id: 'rear_right_door', label: 'Arka Sağ Kapı' }
                  ].map((part) => {
                    const status = paintReportData[part.id] || 'original';
                    return (
                      <button
                        key={part.id}
                        type="button"
                        onClick={() => setPaintStatus(part.id, status === 'original' ? 'painted' : status === 'painted' ? 'replaced' : 'original')}
                        className={`px-1.5 py-1 rounded-md border border-slate-100 text-[9px] font-medium transition-all text-left flex items-center justify-between ${getPaintColor(status)} shadow-2xs`}
                      >
                        <span className="truncate uppercase">{part.label}</span>
                        <span className="opacity-80 shrink-0 ml-1 font-mono text-[8px]">
                          {status === 'original' ? 'O' : status === 'painted' ? 'B' : 'D'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Tramer & Damage Notes */}
                <div className="md:col-span-3 bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-2">
                  <div>
                    <label className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block mb-0.5">Tramer Kaydı (TL)</label>
                    <input
                      type="number"
                      value={formData.tramer_amount || 0}
                      onChange={(e) => setFormData({ ...formData, tramer_amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-[11px] font-medium text-slate-900 tabular-nums"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Araç İlan Açıklamaları */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1 px-0.5">
                <h4 className="text-[10px] font-medium text-blue-700 tracking-widest uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  4. ARAÇ İLAN AÇIKLAMALARI
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block">Genel Detay</label>
                  <textarea rows={1} value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-[10px] font-medium text-slate-800 leading-tight resize-none" placeholder="..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block">Teknik Donanım</label>
                  <textarea rows={1} value={formData.technical_description || ''} onChange={(e) => setFormData({ ...formData, technical_description: e.target.value })} className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-[10px] font-medium text-slate-800 leading-tight resize-none" placeholder="..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block">Pazar Hikayesi</label>
                  <textarea rows={1} value={formData.market_story || ''} onChange={(e) => setFormData({ ...formData, market_story: e.target.value })} className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-[10px] font-medium text-slate-800 leading-tight resize-none" placeholder="..." />
                </div>
              </div>
            </div>

            {/* 5. Görseller */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1 px-0.5">
                <h4 className="text-[10px] font-medium text-blue-700 tracking-widest uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  5. ARAÇ GÖRSELLERİ ({formData.images?.length || 0})
                </h4>
              </div>

              <div className="space-y-2">
                <MultiImageUploader
                  lang={lang}
                  onImagesUploaded={(urls) => {
                    const existing = formData.images || [];
                    setFormData({ ...formData, images: [...existing, ...urls] });
                  }}
                />
                <ImageGallery
                  images={formData.images || []}
                  onChange={(images) => setFormData({ ...formData, images })}
                  isEditable={true}
                />
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-end gap-3 bg-white shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-1.5 text-[10px] font-medium text-slate-400 hover:text-slate-800 transition-all uppercase tracking-widest">İPTAL</button>
            <button type="submit" className="px-6 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-medium uppercase tracking-widest hover:bg-blue-700 shadow-md shadow-blue-200 transition-all active:scale-95">
              {selectedVehicle ? 'KAYDET' : 'KAYDET VE EKLE'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

