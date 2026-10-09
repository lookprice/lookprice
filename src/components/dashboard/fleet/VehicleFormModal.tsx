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
          <div className="px-4 py-2.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-xs">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-2">
                  {selectedVehicle ? (lang === 'tr' ? 'Aracı Düzenle' : 'Edit Vehicle') : (lang === 'tr' ? 'Yeni Araç Ekle' : 'Add New Vehicle')}
                  {selectedVehicle && (
                    <span className="text-[10px] font-mono font-bold bg-slate-800 text-blue-400 px-2 py-0.5 rounded border border-slate-700">
                      ID: #{selectedVehicle.id}
                    </span>
                  )}
                </h3>
              </div>
            </div>
            
            {vehicleAiNotice && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-3 flex-1 max-w-md bg-emerald-950/80 text-emerald-300 px-3 py-1 rounded-lg text-xs font-medium border border-emerald-800 flex items-center gap-1.5 truncate"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{vehicleAiNotice}</span>
              </motion.div>
            )}

            <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content - High Density */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5 custom-scrollbar bg-slate-50/50">
            {/* 1. Ruhsat ve Kayıt Bilgileri */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <h4 className="text-xs font-black text-blue-700 tracking-wider uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  1. Ruhsat ve Kayıt Bilgileri
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Plaka *</label>
                  <input
                    required
                    type="text"
                    value={formData.plate || ''}
                    onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-xs font-bold uppercase tracking-wider text-slate-900"
                    placeholder="34 ABC 123"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Araç Tipi *</label>
                  <select
                    value={formData.type || 'company'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-xs font-semibold text-slate-800"
                  >
                    <option value="company">{t.company || 'Şirket / Galeri'}</option>
                    <option value="personal">{t.personal || 'Şahıs / Konsinye'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Kategori *</label>
                  <select
                    value={formData.category || 'otomobil'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-xs font-semibold text-slate-800"
                  >
                    <option value="otomobil">{isTr ? 'Otomobil' : 'Car'}</option>
                    <option value="suv">{isTr ? 'SUV / Arazi' : 'SUV'}</option>
                    <option value="pickup">{isTr ? 'Pick-up' : 'Pick-up'}</option>
                    <option value="hafif_ticari">{isTr ? 'Hafif Ticari' : 'Commercial'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Marka *</label>
                  <input
                    required
                    type="text"
                    value={formData.brand || ''}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-xs font-medium text-slate-800"
                    placeholder="Örn: Ford"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Model Adı *</label>
                  <div className="flex gap-1">
                    <input
                      required
                      type="text"
                      value={formData.model || ''}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="flex-1 min-w-0 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-xs font-medium text-slate-800"
                      placeholder="Örn: Focus"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateVehicleDesc}
                      disabled={generatingVehicleDesc}
                      className="px-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 border border-indigo-200 transition-colors disabled:opacity-50 shrink-0"
                      title="AI ile Açıklama Oluştur"
                    >
                      {generatingVehicleDesc ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Üretim Yılı *</label>
                  <input
                    required
                    type="number"
                    value={formData.year || ''}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Kilometre (KM) *</label>
                  <input
                    required
                    type="number"
                    value={formData.current_mileage || ''}
                    onChange={(e) => setFormData({ ...formData, current_mileage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Şasi Numarası</label>
                  <input
                    type="text"
                    value={formData.chassis_number || ''}
                    onChange={(e) => setFormData({ ...formData, chassis_number: e.target.value.toUpperCase() })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-[11px] font-mono text-slate-800"
                    placeholder="WBA123..."
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Motor Numarası</label>
                  <input
                    type="text"
                    value={formData.engine_number || ''}
                    onChange={(e) => setFormData({ ...formData, engine_number: e.target.value.toUpperCase() })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-[11px] font-mono text-slate-800"
                    placeholder="N47D..."
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Operasyon Durumu *</label>
                  <select
                    value={formData.status || 'for_sale'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-xs font-bold text-slate-800"
                  >
                    <option value="for_sale">Satışta (Portföy)</option>
                    <option value="active">Aktif (Kullanımda)</option>
                    <option value="in_service">Serviste / Bakımda</option>
                    <option value="broken">Arızalı / Gayri Aktif</option>
                    <option value="sold">Satıldı</option>
                  </select>
                </div>

                {/* Publications & Trade-in Switches Row */}
                <div className="col-span-2 sm:col-span-3 lg:col-span-2 flex flex-wrap gap-1.5 items-center justify-start pt-3">
                  <label className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-50/80 border border-indigo-100 rounded-md cursor-pointer text-[10px] font-semibold text-indigo-950">
                    <input
                      type="checkbox"
                      checked={!!formData.is_trade_in_available}
                      onChange={(e) => setFormData({ ...formData, is_trade_in_available: e.target.checked })}
                      className="w-3.5 h-3.5 text-indigo-600 rounded border-indigo-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    Takas Kabul
                  </label>

                  <label className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-50/80 border border-indigo-100 rounded-md cursor-pointer text-[10px] font-semibold text-indigo-950">
                    <input
                      type="checkbox"
                      checked={formData.is_on_website !== undefined ? !!formData.is_on_website : true}
                      onChange={(e) => setFormData({ ...formData, is_on_website: e.target.checked })}
                      className="w-3.5 h-3.5 text-indigo-600 rounded border-indigo-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    Web Sitemde
                  </label>

                  <label className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-50/80 border border-indigo-100 rounded-md cursor-pointer text-[10px] font-semibold text-indigo-950">
                    <input
                      type="checkbox"
                      checked={formData.is_on_enrakipsiz !== undefined ? !!formData.is_on_enrakipsiz : true}
                      onChange={(e) => setFormData({ ...formData, is_on_enrakipsiz: e.target.checked })}
                      className="w-3.5 h-3.5 text-indigo-600 rounded border-indigo-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    EnRakipsiz'de
                  </label>

                  <label className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-50/80 border border-indigo-100 rounded-md cursor-pointer text-[10px] font-semibold text-indigo-950">
                    <input
                      type="checkbox"
                      checked={!!formData.auto_post_instagram}
                      onChange={(e) => setFormData({ ...formData, auto_post_instagram: e.target.checked })}
                      className="w-3.5 h-3.5 text-indigo-600 rounded border-indigo-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    Instagram
                  </label>
                </div>
              </div>
            </div>

            {/* 2. Donanım ve Teknik Özellikler & Fiyatlandırma */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <h4 className="text-xs font-black text-blue-700 tracking-wider uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  2. Donanım, Fiyat ve Teknik Özellikler
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Donanım Paketi</label>
                  <input
                    type="text"
                    value={formData.package_name || ''}
                    onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-xs font-medium text-slate-800"
                    placeholder="Titanium, M Sport"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Şanzıman Tipi</label>
                  <select
                    value={formData.transmission || 'manual'}
                    onChange={(e) => setFormData({ ...formData, transmission: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-xs font-medium text-slate-800"
                  >
                    <option value="manual">Manuel</option>
                    <option value="automatic">Otomatik</option>
                    <option value="semi_automatic">Yarı Otomatik</option>
                    <option value="dual_clutch">Çift Kavrama (DSG/DCT)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Yakıt Türü</label>
                  <select
                    value={(() => {
                      const f = String(formData.fuel_type || 'gasoline').toLowerCase().trim();
                      if (['diesel', 'dizel'].includes(f)) return 'diesel';
                      if (['gasoline', 'benzin', 'petrol'].includes(f)) return 'gasoline';
                      if (['lpg'].includes(f)) return 'lpg';
                      if (['hybrid', 'hibrit'].includes(f)) return 'hybrid';
                      if (['gasoline_hybrid'].includes(f)) return 'gasoline_hybrid';
                      if (['diesel_hybrid'].includes(f)) return 'diesel_hybrid';
                      if (['electric', 'elektrik', 'elektrikli'].includes(f)) return 'electric';
                      return formData.fuel_type || 'gasoline';
                    })()}
                    onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-xs font-medium text-slate-800"
                  >
                    <option value="gasoline">Benzin</option>
                    <option value="diesel">Dizel</option>
                    <option value="gasoline_hybrid">Benzin / Hibrit</option>
                    <option value="diesel_hybrid">Dizel / Hibrit</option>
                    <option value="hybrid">Hibrit</option>
                    <option value="electric">Elektrik</option>
                    <option value="lpg">LPG</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Renk</label>
                  <input
                    type="text"
                    value={formData.color || ''}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-xs font-medium text-slate-800"
                    placeholder="Metalik Siyah"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Kasa Tipi</label>
                  <input
                    type="text"
                    value={formData.body_type || ''}
                    onChange={(e) => setFormData({ ...formData, body_type: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-xs font-medium text-slate-800"
                    placeholder="Sedan, SUV"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-emerald-800 uppercase block mb-1">İlan Satış Fiyatı *</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={formData.selling_price || ''}
                      onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                      placeholder="0"
                      className="flex-1 min-w-0 px-2.5 py-1.5 bg-emerald-50/50 border border-emerald-200 rounded-lg outline-none text-xs font-black text-emerald-900"
                    />
                    <select
                      value={formData.currency || 'TRY'}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="px-2 py-1.5 bg-emerald-100/80 border border-emerald-300 rounded-lg outline-none font-black text-xs text-emerald-900 shrink-0"
                    >
                      <option value="TRY">₺</option>
                      <option value="USD">$</option>
                      <option value="EUR">€</option>
                      <option value="GBP">£</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Ekspertiz ve Boya/Değişen Durumu */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <h4 className="text-xs font-black text-blue-700 tracking-wider uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  3. Ekspertiz, Boya/Değişen & Tramer
                </h4>
                <div className="flex items-center gap-3 text-[10px] font-bold">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Orijinal</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500" /> Boyalı</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-500" /> Değişen</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                {/* Paint Part Buttons Grid */}
                <div className="md:col-span-8 grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {[
                    { id: 'hood', label: 'Kaput' },
                    { id: 'roof', label: 'Tavan' },
                    { id: 'trunk', label: 'Bagaj' },
                    { id: 'front_bumper', label: 'Ön Tampon' },
                    { id: 'rear_bumper', label: 'Arka Tampon' },
                    { id: 'front_left_fender', label: 'Ön Sol Çamurluk' },
                    { id: 'front_right_fender', label: 'Ön Sağ Çamurluk' },
                    { id: 'rear_left_fender', label: 'Arka Sol Çamurluk' },
                    { id: 'rear_right_fender', label: 'Arka Sağ Çamurluk' },
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
                        className={`px-2 py-1.5 rounded-lg border border-slate-200/80 text-[10px] font-bold transition-all text-left flex items-center justify-between ${getPaintColor(status)}`}
                      >
                        <span className="truncate">{part.label}</span>
                        <span className="text-[9px] uppercase tracking-wider opacity-80 shrink-0 ml-1 font-mono">
                          {status === 'original' ? 'ORJ' : status === 'painted' ? 'BOY' : 'DEĞ'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Tramer & Damage Notes */}
                <div className="md:col-span-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Tramer Kaydı (TL)</label>
                    <input
                      type="number"
                      value={formData.tramer_amount || 0}
                      onChange={(e) => setFormData({ ...formData, tramer_amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-xs font-bold text-slate-900"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Araç İlan Açıklamaları */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <h4 className="text-xs font-black text-blue-700 tracking-wider uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  4. Araç İlan Açıklamaları
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Genel Araç Detayı</label>
                  <textarea
                    rows={2}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-xs text-slate-800 leading-snug"
                    placeholder="Genel araç bilgileri ve özellikler..."
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Teknik Donanım Açıklaması</label>
                  <textarea
                    rows={2}
                    value={formData.technical_description || ''}
                    onChange={(e) => setFormData({ ...formData, technical_description: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-xs text-slate-800 leading-snug"
                    placeholder="Özel opsiyonlar, paket detayları..."
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Pazar / İlan Hikayesi</label>
                  <textarea
                    rows={2}
                    value={formData.market_story || ''}
                    onChange={(e) => setFormData({ ...formData, market_story: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-xs text-slate-800 leading-snug"
                    placeholder="Müşteriyi çekecek öne çıkan satış vurgusu..."
                  />
                </div>
              </div>
            </div>

            {/* 5. Görseller */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <h4 className="text-xs font-black text-blue-700 tracking-wider uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  5. Araç Görselleri ({formData.images?.length || 0})
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
          <div className="px-4 py-2.5 border-t border-slate-200 flex items-center justify-end gap-3 bg-white shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-all"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-200 transition-all active:scale-95"
            >
              {selectedVehicle ? 'Değişiklikleri Kaydet' : 'Kaydet ve Aracı Ekle'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

