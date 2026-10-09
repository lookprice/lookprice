import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  Bed, 
  Receipt, 
  Camera, 
  Upload, 
  CheckCircle2,
  Sparkles,
  Plus,
  Trash2,
  Lock,
  Layers,
  Check,
  BedDouble,
  BedSingle,
  User,
  Coffee,
  Info
} from 'lucide-react';
import { HotelRoom } from '../HotelRoomManagement';

const getNextDay = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }
  return dateStr;
};

interface HotelRoomEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRoom: HotelRoom | null;
  roomForm: any;
  setRoomForm: React.Dispatch<React.SetStateAction<any>>;
  bedConfig: any;
  setBedConfig: React.Dispatch<React.SetStateAction<any>>;
  handleSubmitRoom: (e: React.FormEvent) => void;
  handleImageFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formatThousand: (val: any) => string;
  parseThousand: (val: string) => number;
  isTr: boolean;
}

export const HotelRoomEditModal: React.FC<HotelRoomEditModalProps> = ({
  isOpen,
  onClose,
  editingRoom,
  roomForm,
  setRoomForm,
  bedConfig,
  setBedConfig,
  handleSubmitRoom,
  handleImageFileUpload,
  formatThousand,
  parseThousand,
  isTr,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'pricing' | 'special_dates' | 'media'>('general');

  if (!isOpen) return null;

  // Bed configuration recalculator helper
  const updateBedItem = (key: string, delta: number) => {
    const current = bedConfig[key] || 0;
    const nextVal = Math.max(0, current + delta);
    const nextConfig = { ...bedConfig, [key]: nextVal };
    setBedConfig(nextConfig);

    const parts: string[] = [];
    if (nextConfig.doubleBeds > 0) parts.push(`${nextConfig.doubleBeds} Çift Kişilik Yatak`);
    if (nextConfig.singleBeds > 0) parts.push(`${nextConfig.singleBeds} Tek Kişilik Yatak`);
    if (nextConfig.bunkBeds > 0) parts.push(`${nextConfig.bunkBeds} Ranza`);
    if (nextConfig.extraBeds > 0) parts.push(`${nextConfig.extraBeds} Ekstra Yatak`);
    if (nextConfig.floorMattress > 0) parts.push(`${nextConfig.floorMattress} Yer Yatağı`);
    if (nextConfig.babyCribs > 0) parts.push(`${nextConfig.babyCribs} Bebek Beşiği`);
    if (nextConfig.sofaBeds > 0) parts.push(`${nextConfig.sofaBeds} Çekyat`);

    const stdCapacity = (nextConfig.doubleBeds * 2) + nextConfig.singleBeds + (nextConfig.bunkBeds * 2) + nextConfig.extraBeds + nextConfig.floorMattress + nextConfig.sofaBeds;
    const suggestedCap = Math.max(1, stdCapacity);

    setRoomForm((rf: any) => ({
      ...rf,
      bed_info: parts.join(", "),
      capacity: suggestedCap,
      max_adults: suggestedCap,
      max_children: nextConfig.babyCribs > 0 ? nextConfig.babyCribs : (suggestedCap > 2 ? 1 : 0)
    }));
  };

  const applyBedTemplate = (template: { d: number; s: number; b: number; ex: number; fl: number; cb: number; sf: number }) => {
    const nextConfig = {
      doubleBeds: template.d,
      singleBeds: template.s,
      bunkBeds: template.b,
      extraBeds: template.ex,
      floorMattress: template.fl,
      babyCribs: template.cb,
      sofaBeds: template.sf
    };
    setBedConfig(nextConfig);

    const parts: string[] = [];
    if (nextConfig.doubleBeds > 0) parts.push(`${nextConfig.doubleBeds} Çift Kişilik Yatak`);
    if (nextConfig.singleBeds > 0) parts.push(`${nextConfig.singleBeds} Tek Kişilik Yatak`);
    if (nextConfig.bunkBeds > 0) parts.push(`${nextConfig.bunkBeds} Ranza`);
    if (nextConfig.extraBeds > 0) parts.push(`${nextConfig.extraBeds} Ekstra Yatak`);
    if (nextConfig.floorMattress > 0) parts.push(`${nextConfig.floorMattress} Yer Yatağı`);
    if (nextConfig.babyCribs > 0) parts.push(`${nextConfig.babyCribs} Bebek Beşiği`);
    if (nextConfig.sofaBeds > 0) parts.push(`${nextConfig.sofaBeds} Çekyat`);

    const stdCapacity = (nextConfig.doubleBeds * 2) + nextConfig.singleBeds + (nextConfig.bunkBeds * 2) + nextConfig.extraBeds + nextConfig.floorMattress + nextConfig.sofaBeds;
    const suggestedCap = Math.max(1, stdCapacity);

    setRoomForm((rf: any) => ({
      ...rf,
      bed_info: parts.join(", "),
      capacity: suggestedCap,
      max_adults: suggestedCap,
      max_children: nextConfig.babyCribs > 0 ? nextConfig.babyCribs : (suggestedCap > 2 ? 1 : 0)
    }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[94vh] overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* COMPACT CORPORATE ILLUMINATED HEADER */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black border border-indigo-200 dark:border-indigo-800/60">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {editingRoom ? `Oda #${editingRoom.room_number}` : "Yeni Oda Tanımla"}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                  {editingRoom ? "Düzenle & Güncelle" : "Oluştur"}
                </span>
              </div>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* CORPORATE SEGMENTED TAB SELECTOR */}
        <div className="px-4 pt-2.5 pb-2 bg-slate-50/50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { id: 'general', label: 'Temel & Yatak', icon: <Bed className="h-3.5 w-3.5" /> },
            { id: 'pricing', label: 'Pansiyon Fiyatları', icon: <Receipt className="h-3.5 w-3.5" /> },
            { id: 'special_dates', label: 'Özel Sezon & Blokaj', icon: <Sparkles className="h-3.5 w-3.5" /> },
            { id: 'media', label: 'Galeri & Detay', icon: <Camera className="h-3.5 w-3.5" /> },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* FORM CONTAINER - HIGH INFORMATION DENSITY */}
        <form onSubmit={handleSubmitRoom} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/30 dark:bg-slate-900/60">
          
          {/* TAB 1: TEMEL BİLGİLER & YATAK KONFİGÜRASYONU */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Row 1: Oda No, Oda Tipi, Kat, Durum */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">
                    Oda No *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="101"
                    value={roomForm.room_number}
                    onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">
                    Oda Tipi *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Standart Çift Kişilik"
                    value={roomForm.room_type}
                    onChange={(e) => setRoomForm({ ...roomForm, room_type: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">
                    Kat
                  </label>
                  <select
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm({ ...roomForm, floor: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
                  >
                    <option value={0}>Zemin (0)</option>
                    <option value={1}>1. Kat</option>
                    <option value={2}>2. Kat</option>
                    <option value={3}>3. Kat</option>
                    <option value={4}>4. Kat</option>
                    <option value={5}>5. Kat+</option>
                    <option value={-1}>Bodrum (-1)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">
                    Durum
                  </label>
                  <select
                    value={roomForm.status}
                    onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value as any })}
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
                  >
                    <option value="vacant">🟢 Boş & Temiz</option>
                    <option value="occupied">🔴 Dolu (Bugün Konaklayan)</option>
                    <option value="maintenance">🛠️ Bakımda</option>
                    <option value="staff">🟣 Personel</option>
                    <option value="disabled">⚪ Pasif</option>
                  </select>
                </div>
              </div>

              {/* Yatak Konfigürasyonu Kartı - ILLUMINATED & CRYSTAL CLEAR */}
              <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase flex items-center gap-1.5">
                    <Bed className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    Yataklar & Kapasite
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-md shadow-2xs">
                      {roomForm.capacity} Kişi Kapasite
                    </span>
                  </div>
                </div>

                {/* Yatak Sayaçları (Mobile 2-Cols / Desktop 4-Cols, Clear Badges) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {[
                    { label: "Çift Kişilik", key: "doubleBeds", icon: <BedDouble className="h-4 w-4 text-indigo-500 shrink-0" /> },
                    { label: "Tek Kişilik", key: "singleBeds", icon: <BedSingle className="h-4 w-4 text-sky-500 shrink-0" /> },
                    { label: "Ranza", key: "bunkBeds", icon: <Layers className="h-4 w-4 text-amber-500 shrink-0" /> },
                    { label: "Ekstra Yatak", key: "extraBeds", icon: <BedSingle className="h-4 w-4 text-emerald-500 shrink-0" /> },
                    { label: "Yer Yatağı", key: "floorMattress", icon: <Bed className="h-4 w-4 text-slate-500 shrink-0" /> },
                    { label: "Bebek Beşiği", key: "babyCribs", icon: <User className="h-4 w-4 text-rose-500 shrink-0" /> },
                    { label: "Açılır Çekyat", key: "sofaBeds", icon: <Bed className="h-4 w-4 text-purple-500 shrink-0" /> },
                  ].map((item) => {
                    const count = bedConfig[item.key] || 0;
                    return (
                      <div key={item.key} className="p-2 bg-slate-50 dark:bg-slate-900/90 rounded-lg border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-1.5 text-xs shadow-2xs">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {item.icon}
                          <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                            {item.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateBedItem(item.key, -1)}
                            className="w-6 h-6 rounded-md bg-white dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-300 text-slate-700 dark:text-slate-200 font-black text-xs flex items-center justify-center cursor-pointer transition-all border border-slate-200 dark:border-slate-700 active:scale-90 shadow-2xs"
                            title="Azalt"
                          >
                            -
                          </button>
                          <span className="min-w-[22px] px-1 h-6 flex items-center justify-center font-black text-xs rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80">
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateBedItem(item.key, 1)}
                            className="w-6 h-6 rounded-md bg-white dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-200 font-black text-xs flex items-center justify-center cursor-pointer transition-all border border-slate-200 dark:border-slate-700 active:scale-90 shadow-2xs"
                            title="Arttır"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Hızlı Şablonlar (High-Contrast Buttons) */}
                <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">Şablon:</span>
                  {[
                    { label: "1 Çift Kişilik", d: 1, s: 0, b: 0, ex: 0, fl: 0, cb: 0, sf: 0 },
                    { label: "2 Tek (Twin)", d: 0, s: 2, b: 0, ex: 0, fl: 0, cb: 0, sf: 0 },
                    { label: "1 Çift + 1 Ekstra", d: 1, s: 0, b: 0, ex: 1, fl: 0, cb: 0, sf: 0 },
                    { label: "1 Çift + 1 Beşik", d: 1, s: 0, b: 0, ex: 0, fl: 0, cb: 1, sf: 0 },
                    { label: "1 Çift + 1 Ranza", d: 1, s: 0, b: 1, ex: 0, fl: 0, cb: 0, sf: 0 },
                  ].map((tpl) => (
                    <button
                      key={tpl.label}
                      type="button"
                      onClick={() => applyBedTemplate(tpl)}
                      className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>

                {/* Bed description text */}
                <input
                  type="text"
                  placeholder="Yatak açıklaması..."
                  value={roomForm.bed_info}
                  onChange={(e) => setRoomForm({ ...roomForm, bed_info: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Olanaklar & Özellikler */}
              <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2.5">
                <span className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase flex items-center gap-1.5">
                  <Coffee className="h-4 w-4 text-amber-500" />
                  Oda Olanakları
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    "WiFi", "Deniz Manzarası", "Balkon", "Klima", "LCD TV", "Minibar", 
                    "Jakuzi", "Çay/Kahve Makinesi", "Kasa", "Saç Kurutma", "Oda Servisi"
                  ].map(amenity => {
                    const currentList = (roomForm.amenitiesStr || '').split(',').map((s: string) => s.trim().toLowerCase());
                    const isSelected = currentList.includes(amenity.toLowerCase());
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => {
                          let arr = (roomForm.amenitiesStr || '').split(',').map((s: string) => s.trim()).filter(Boolean);
                          if (isSelected) {
                            arr = arr.filter((item: string) => item.toLowerCase() !== amenity.toLowerCase());
                          } else {
                            arr.push(amenity);
                          }
                          setRoomForm({ ...roomForm, amenitiesStr: arr.join(", ") });
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer shadow-2xs active:scale-95 ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {isSelected ? `✓ ${amenity}` : `+ ${amenity}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PANSİYON FİYATLARI */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              {/* Fiyatlandırma Modu (Oda Başı / Kişi Başı) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRoomForm({ ...roomForm, pricing_type: 'per_room' })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    roomForm.pricing_type === 'per_room'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div>
                    <span className="text-xs font-black block">Oda Başı (Sabit)</span>
                    <span className="text-[10px] opacity-75">Oda kapasitesine kadar tek fiyat</span>
                  </div>
                  {roomForm.pricing_type === 'per_room' && <Check className="h-4 w-4 text-emerald-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => setRoomForm({ ...roomForm, pricing_type: 'per_person' })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    roomForm.pricing_type === 'per_person' || !roomForm.pricing_type
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-100 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div>
                    <span className="text-xs font-black block">Kişi Başı (Dinamik)</span>
                    <span className="text-[10px] opacity-75">Yetişkin/çocuk oranlı hesaplama</span>
                  </div>
                  {(roomForm.pricing_type === 'per_person' || !roomForm.pricing_type) && <Check className="h-4 w-4 text-indigo-600" />}
                </button>
              </div>

              {/* 6 Pansiyon Gecelik Fiyatları (Kompakt 3-Kolon Izgara) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {/* RO */}
                <div className="p-2.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    Sadece Oda (RO)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">₺</span>
                    <input
                      type="text"
                      placeholder="0"
                      value={formatThousand(roomForm.price_room_only)}
                      onChange={(e) => setRoomForm({ ...roomForm, price_room_only: parseThousand(e.target.value) })}
                      className="w-full pl-6 pr-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* BB - Baz Fiyat */}
                <div className="p-2.5 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                  <label className="text-[10px] font-bold text-indigo-950 dark:text-indigo-200 block mb-1">
                    Oda & Kahvaltı (BB) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-indigo-600 dark:text-indigo-400">₺</span>
                    <input
                      type="text"
                      placeholder="2.500"
                      value={formatThousand(roomForm.price_per_night)}
                      onChange={(e) => setRoomForm({ ...roomForm, price_per_night: parseThousand(e.target.value) })}
                      className="w-full pl-6 pr-2 py-1 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg text-xs font-normal text-indigo-950 dark:text-indigo-100 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* HB */}
                <div className="p-2.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    Yarım Pansiyon (HB)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">₺</span>
                    <input
                      type="text"
                      placeholder="0"
                      value={formatThousand(roomForm.price_half_board)}
                      onChange={(e) => setRoomForm({ ...roomForm, price_half_board: parseThousand(e.target.value) })}
                      className="w-full pl-6 pr-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* FB */}
                <div className="p-2.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    Tam Pansiyon (FB)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">₺</span>
                    <input
                      type="text"
                      placeholder="0"
                      value={formatThousand(roomForm.price_full_board)}
                      onChange={(e) => setRoomForm({ ...roomForm, price_full_board: parseThousand(e.target.value) })}
                      className="w-full pl-6 pr-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* AI */}
                <div className="p-2.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    Her Şey Dahil (AI)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">₺</span>
                    <input
                      type="text"
                      placeholder="0"
                      value={formatThousand(roomForm.price_all_inclusive)}
                      onChange={(e) => setRoomForm({ ...roomForm, price_all_inclusive: parseThousand(e.target.value) })}
                      className="w-full pl-6 pr-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* UAI */}
                <div className="p-2.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    Ultra Her Şey (UAI)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">₺</span>
                    <input
                      type="text"
                      placeholder="0"
                      value={formatThousand(roomForm.price_ultra_all_inclusive)}
                      onChange={(e) => setRoomForm({ ...roomForm, price_ultra_all_inclusive: parseThousand(e.target.value) })}
                      className="w-full pl-6 pr-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* İptal Edilemez İndirimi */}
              <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">İptal Edilemez İndirim Oranı</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Erken ödemede web vitrininde uygulanacak indirim yüzdesi</span>
                </div>
                <div className="relative w-24">
                  <span className="absolute left-2.5 top-1.5 text-xs font-bold text-emerald-600">%</span>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    placeholder="10"
                    value={roomForm.non_refundable_discount || 0}
                    onChange={(e) => setRoomForm({ ...roomForm, non_refundable_discount: Number(e.target.value) })}
                    className="w-full pl-6 pr-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-emerald-600 text-right focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ÖZEL SEZON & BLOKAJ */}
          {activeTab === 'special_dates' && (
            <div className="space-y-4">
              {/* Özel Gün & Bayram Fiyatları */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 uppercase flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    Özel Tarih Tarifeleri (Bayram, Yılbaşı, Sezon)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const baseRate = Math.round((roomForm.price_per_night || 2500) * 1.5);
                      const newRule = {
                        id: `sp-${Date.now()}`,
                        title: "Özel Sezon",
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
                        price_per_night: baseRate,
                        board_prices: {
                          room_only: Math.round(baseRate * 0.88),
                          bed_breakfast: baseRate,
                          half_board: Math.round(baseRate * 1.28),
                          full_board: Math.round(baseRate * 1.56),
                          all_inclusive: Math.round(baseRate * 1.92)
                        }
                      };
                      setRoomForm({
                        ...roomForm,
                        special_prices: [...(roomForm.special_prices || []), newRule]
                      });
                    }}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg cursor-pointer flex items-center gap-1 shadow-2xs transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Özel Fiyat Ekle</span>
                  </button>
                </div>

                {Array.isArray(roomForm.special_prices) && roomForm.special_prices.length > 0 ? (
                  <div className="space-y-2">
                    {roomForm.special_prices.map((sp: any, spIdx: number) => (
                      <div key={sp.id || spIdx} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2.5 text-xs shadow-2xs">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                          <div className="sm:col-span-4">
                            <input
                              type="text"
                              placeholder="Tarife Başlığı (Örn: Bayram)"
                              value={sp.title}
                              onChange={(e) => {
                                const updated = [...roomForm.special_prices];
                                updated[spIdx].title = e.target.value;
                                setRoomForm({ ...roomForm, special_prices: updated });
                              }}
                              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                          </div>
                          <div className="sm:col-span-5 flex items-center gap-1.5">
                            <input
                              type="date"
                              value={sp.start_date}
                              onChange={(e) => {
                                const newStart = e.target.value;
                                const updated = [...roomForm.special_prices];
                                updated[spIdx].start_date = newStart;
                                updated[spIdx].end_date = getNextDay(newStart);
                                setRoomForm({ ...roomForm, special_prices: updated });
                              }}
                              className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                            />
                            <span className="text-slate-400 font-bold">-</span>
                            <input
                              type="date"
                              value={sp.end_date}
                              onChange={(e) => {
                                const updated = [...roomForm.special_prices];
                                updated[spIdx].end_date = e.target.value;
                                setRoomForm({ ...roomForm, special_prices: updated });
                              }}
                              className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <div className="relative">
                              <span className="absolute left-2 top-1.5 text-xs text-slate-400">₺</span>
                              <input
                                type="text"
                                placeholder="Taban Fiyat"
                                value={formatThousand(sp.price_per_night)}
                                onChange={(e) => {
                                  const newBase = parseThousand(e.target.value);
                                  const updated = [...roomForm.special_prices];
                                  updated[spIdx].price_per_night = newBase;
                                  if (!updated[spIdx].board_prices || Object.keys(updated[spIdx].board_prices).length === 0) {
                                    updated[spIdx].board_prices = {
                                      room_only: Math.round(newBase * 0.88),
                                      bed_breakfast: newBase,
                                      half_board: Math.round(newBase * 1.28),
                                      full_board: Math.round(newBase * 1.56),
                                      all_inclusive: Math.round(newBase * 1.92)
                                    };
                                  }
                                  setRoomForm({ ...roomForm, special_prices: updated });
                                }}
                                className="w-full pl-5 pr-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-normal text-slate-800 dark:text-slate-100 text-xs"
                              />
                            </div>
                          </div>
                          <div className="sm:col-span-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = roomForm.special_prices.filter((_: any, i: number) => i !== spIdx);
                                setRoomForm({ ...roomForm, special_prices: updated });
                              }}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg cursor-pointer transition-colors"
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* ÖZEL TARİFEYE AİT PANSİYON TİPLERİ VE FİYATLARI */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                          <div className="text-[10px] font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center justify-between">
                            <span>Özel Dönem Pansiyon Fiyatları</span>
                            <span className="text-[9px] font-normal text-slate-400">0 girilen pansiyon sunulmaz</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                            {/* RO */}
                            <div>
                              <label className="text-[9px] font-medium text-slate-600 dark:text-slate-400 block truncate mb-0.5">Sadece Oda (RO)</label>
                              <div className="relative">
                                <span className="absolute left-1.5 top-1 text-[10px] text-slate-400">₺</span>
                                <input
                                  type="text"
                                  placeholder="0"
                                  value={formatThousand(sp.board_prices?.room_only || 0)}
                                  onChange={(e) => {
                                    const val = parseThousand(e.target.value);
                                    const updated = [...roomForm.special_prices];
                                    updated[spIdx].board_prices = {
                                      ...(updated[spIdx].board_prices || {}),
                                      room_only: val
                                    };
                                    setRoomForm({ ...roomForm, special_prices: updated });
                                  }}
                                  className="w-full pl-4 pr-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-normal text-slate-800 dark:text-slate-100 text-xs"
                                />
                              </div>
                            </div>
                            {/* BB */}
                            <div>
                              <label className="text-[9px] font-medium text-slate-600 dark:text-slate-400 block truncate mb-0.5">Oda Kahvaltı (BB)</label>
                              <div className="relative">
                                <span className="absolute left-1.5 top-1 text-[10px] text-slate-400">₺</span>
                                <input
                                  type="text"
                                  placeholder="0"
                                  value={formatThousand(sp.board_prices?.bed_breakfast || 0)}
                                  onChange={(e) => {
                                    const val = parseThousand(e.target.value);
                                    const updated = [...roomForm.special_prices];
                                    updated[spIdx].board_prices = {
                                      ...(updated[spIdx].board_prices || {}),
                                      bed_breakfast: val
                                    };
                                    setRoomForm({ ...roomForm, special_prices: updated });
                                  }}
                                  className="w-full pl-4 pr-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-normal text-slate-800 dark:text-slate-100 text-xs"
                                />
                              </div>
                            </div>
                            {/* HB */}
                            <div>
                              <label className="text-[9px] font-medium text-slate-600 dark:text-slate-400 block truncate mb-0.5">Yarım Pansiyon (HB)</label>
                              <div className="relative">
                                <span className="absolute left-1.5 top-1 text-[10px] text-slate-400">₺</span>
                                <input
                                  type="text"
                                  placeholder="0"
                                  value={formatThousand(sp.board_prices?.half_board || 0)}
                                  onChange={(e) => {
                                    const val = parseThousand(e.target.value);
                                    const updated = [...roomForm.special_prices];
                                    updated[spIdx].board_prices = {
                                      ...(updated[spIdx].board_prices || {}),
                                      half_board: val
                                    };
                                    setRoomForm({ ...roomForm, special_prices: updated });
                                  }}
                                  className="w-full pl-4 pr-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-normal text-slate-800 dark:text-slate-100 text-xs"
                                />
                              </div>
                            </div>
                            {/* FB */}
                            <div>
                              <label className="text-[9px] font-medium text-slate-600 dark:text-slate-400 block truncate mb-0.5">Tam Pansiyon (FB)</label>
                              <div className="relative">
                                <span className="absolute left-1.5 top-1 text-[10px] text-slate-400">₺</span>
                                <input
                                  type="text"
                                  placeholder="0"
                                  value={formatThousand(sp.board_prices?.full_board || 0)}
                                  onChange={(e) => {
                                    const val = parseThousand(e.target.value);
                                    const updated = [...roomForm.special_prices];
                                    updated[spIdx].board_prices = {
                                      ...(updated[spIdx].board_prices || {}),
                                      full_board: val
                                    };
                                    setRoomForm({ ...roomForm, special_prices: updated });
                                  }}
                                  className="w-full pl-4 pr-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-normal text-slate-800 dark:text-slate-100 text-xs"
                                />
                              </div>
                            </div>
                            {/* AI */}
                            <div>
                              <label className="text-[9px] font-medium text-slate-600 dark:text-slate-400 block truncate mb-0.5">Her Şey Dahil (AI)</label>
                              <div className="relative">
                                <span className="absolute left-1.5 top-1 text-[10px] text-slate-400">₺</span>
                                <input
                                  type="text"
                                  placeholder="0"
                                  value={formatThousand(sp.board_prices?.all_inclusive || 0)}
                                  onChange={(e) => {
                                    const val = parseThousand(e.target.value);
                                    const updated = [...roomForm.special_prices];
                                    updated[spIdx].board_prices = {
                                      ...(updated[spIdx].board_prices || {}),
                                      all_inclusive: val
                                    };
                                    setRoomForm({ ...roomForm, special_prices: updated });
                                  }}
                                  className="w-full pl-4 pr-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-normal text-slate-800 dark:text-slate-100 text-xs"
                                />
                              </div>
                            </div>
                            {/* UAI */}
                            <div>
                              <label className="text-[9px] font-medium text-slate-600 dark:text-slate-400 block truncate mb-0.5">Ultra Her Şey (UAI)</label>
                              <div className="relative">
                                <span className="absolute left-1.5 top-1 text-[10px] text-slate-400">₺</span>
                                <input
                                  type="text"
                                  placeholder="0"
                                  value={formatThousand(sp.board_prices?.ultra_all_inclusive || 0)}
                                  onChange={(e) => {
                                    const val = parseThousand(e.target.value);
                                    const updated = [...roomForm.special_prices];
                                    updated[spIdx].board_prices = {
                                      ...(updated[spIdx].board_prices || {}),
                                      ultra_all_inclusive: val
                                    };
                                    setRoomForm({ ...roomForm, special_prices: updated });
                                  }}
                                  className="w-full pl-4 pr-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-normal text-slate-800 dark:text-slate-100 text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2.5 bg-white/60 dark:bg-slate-900/60 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-center text-[11px] text-slate-500 dark:text-slate-400">
                    Özel tarih fiyatı eklenmedi. Standart taban fiyatlar geçerlidir.
                  </div>
                )}
              </div>

              {/* Tarih Kapatma & Blokaj */}
              <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-800/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-rose-900 dark:text-rose-200 uppercase flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-rose-600" />
                    Tarih Blokajı / Satışa Kapatma
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const newBlock = {
                        id: `cd-${Date.now()}`,
                        title: "Tadilat / Kapatma",
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
                      };
                      setRoomForm({
                        ...roomForm,
                        closed_dates: [...(roomForm.closed_dates || []), newBlock]
                      });
                    }}
                    className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Blokaj Ekle</span>
                  </button>
                </div>

                {Array.isArray(roomForm.closed_dates) && roomForm.closed_dates.length > 0 ? (
                  <div className="space-y-1.5">
                    {roomForm.closed_dates.map((cd: any, cdIdx: number) => (
                      <div key={cd.id || cdIdx} className="p-2 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800/60 rounded-lg flex items-center justify-between gap-2 text-xs">
                        <input
                          type="text"
                          placeholder="Blokaj Sebebi"
                          value={cd.title}
                          onChange={(e) => {
                            const updated = [...roomForm.closed_dates];
                            updated[cdIdx].title = e.target.value;
                            setRoomForm({ ...roomForm, closed_dates: updated });
                          }}
                          className="flex-1 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-bold text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            value={cd.start_date}
                            onChange={(e) => {
                              const newStart = e.target.value;
                              const updated = [...roomForm.closed_dates];
                              updated[cdIdx].start_date = newStart;
                              updated[cdIdx].end_date = getNextDay(newStart);
                              setRoomForm({ ...roomForm, closed_dates: updated });
                            }}
                            className="px-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-bold text-[10px] text-slate-900 dark:text-white"
                          />
                          <span className="text-slate-500 dark:text-slate-400 font-bold">-</span>
                          <input
                            type="date"
                            value={cd.end_date}
                            onChange={(e) => {
                              const updated = [...roomForm.closed_dates];
                              updated[cdIdx].end_date = e.target.value;
                              setRoomForm({ ...roomForm, closed_dates: updated });
                            }}
                            className="px-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-bold text-[10px] text-slate-900 dark:text-white"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = roomForm.closed_dates.filter((_: any, i: number) => i !== cdIdx);
                            setRoomForm({ ...roomForm, closed_dates: updated });
                          }}
                          className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2.5 bg-white/60 dark:bg-slate-900/60 rounded-lg border border-dashed border-rose-200 dark:border-rose-800 text-center text-[11px] text-rose-800 dark:text-rose-300">
                    Oda tüm tarihlerde açık ve satıştadır.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: GALERİ & DETAYLAR */}
          {activeTab === 'media' && (
            <div className="space-y-4">
              {/* Fotoğraf Galerisi */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5 text-indigo-500" />
                    Oda Görselleri ({roomForm.images?.length || 0})
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="file"
                      id="hotel_room_photo_file_input"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageFileUpload}
                    />
                    <input
                      type="file"
                      id="hotel_room_photo_camera_input"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleImageFileUpload}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('hotel_room_photo_camera_input')?.click()}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>Çek</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => document.getElementById('hotel_room_photo_file_input')?.click()}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-black text-white dark:bg-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Yükle</span>
                    </button>
                  </div>
                </div>

                {/* URL Input */}
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    id="hotel_room_custom_url_input"
                    placeholder="Web görsel linki yapıştırın (https://...)"
                    className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('hotel_room_custom_url_input') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        const url = input.value.trim();
                        setRoomForm((prev: any) => {
                          const currentList = Array.isArray(prev.images) ? prev.images : [];
                          return {
                            ...prev,
                            cover_image: prev.cover_image || url,
                            images: currentList.includes(url) ? currentList : [...currentList, url]
                          };
                        });
                        input.value = "";
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Ekle
                  </button>
                </div>

                {/* Thumbnails */}
                {roomForm.images && roomForm.images.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                    {(roomForm.images || []).map((imgUrl: string, idx: number) => {
                      const isCover = roomForm.cover_image === imgUrl || (!roomForm.cover_image && idx === 0);
                      return (
                        <div
                          key={idx}
                          className={`relative group h-18 rounded-lg overflow-hidden border transition-all ${
                            isCover ? "border-amber-500 ring-2 ring-amber-400/50" : "border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          <img src={imgUrl} alt={`Room ${idx + 1}`} className="w-full h-full object-cover" />
                          {isCover && (
                            <span className="absolute top-1 left-1 bg-amber-500 text-white text-[8px] font-black uppercase px-1 rounded">
                              Kapak
                            </span>
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                            {!isCover && (
                              <button
                                type="button"
                                onClick={() => setRoomForm((prev: any) => ({ ...prev, cover_image: imgUrl }))}
                                className="px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-bold rounded cursor-pointer w-full text-center"
                              >
                                Kapak Yap
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setRoomForm((prev: any) => {
                                  const updated = prev.images.filter((i: string) => i !== imgUrl);
                                  return {
                                    ...prev,
                                    images: updated,
                                    cover_image: prev.cover_image === imgUrl ? (updated[0] || "") : prev.cover_image
                                  };
                                });
                              }}
                              className="px-1.5 py-0.5 bg-rose-600 text-white text-[8px] font-bold rounded cursor-pointer w-full text-center"
                            >
                              Sil
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-400">
                    Fotoğraf eklenmedi.
                  </div>
                )}
              </div>

              {/* Açıklama & Notlar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase block mb-1">
                    Web Vitrin Açıklaması
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Oda konsepti ve misafir açıklaması..."
                    value={roomForm.description}
                    onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase block mb-1">
                    İç Resepsiyon Notları
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Personel ve temizlik notları..."
                    value={roomForm.notes}
                    onChange={(e) => setRoomForm({ ...roomForm, notes: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{editingRoom ? "Güncelle & Kaydet" : "Odayı Ekle"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
