import React from 'react';
import { 
  X, 
  Building2, 
  Bed, 
  Receipt, 
  Coffee, 
  Camera, 
  Upload, 
  SlidersHorizontal, 
  CheckCircle2,
  Sparkles,
  Plus,
  Trash2
} from 'lucide-react';
import { HotelRoom } from '../HotelRoomManagement';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>{editingRoom ? `Oda #${editingRoom.room_number} Düzenle & Güncelle` : "Yeni Oda Ekle & Tanımla"}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Oda numarası, yatak kombinasyonu, pansiyon fiyatları ve fotoğraf galerisi
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors cursor-pointer">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmitRoom} className="space-y-5">
          {/* BÖLÜM 1: GENEL ODA BİLGİLERİ & KAT */}
          <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-4">
            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              1. Temel Oda Tanımı & Konum
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide block mb-1">
                  Oda Numarası / Adı *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 101, 204, VIP Suite..."
                  value={roomForm.room_number}
                  onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide block mb-1">
                  Oda Tipi / Kategorisi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Standart Deniz Manzaralı, Deluxe..."
                  value={roomForm.room_type}
                  onChange={(e) => setRoomForm({ ...roomForm, room_type: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide block mb-1">
                  Bulunduğu Kat
                </label>
                <select
                  value={roomForm.floor}
                  onChange={(e) => setRoomForm({ ...roomForm, floor: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={0}>Zemin Kat (0)</option>
                  <option value={1}>1. Kat</option>
                  <option value={2}>2. Kat</option>
                  <option value={3}>3. Kat</option>
                  <option value={4}>4. Kat</option>
                  <option value={5}>5. Kat ve Üzeri</option>
                  <option value={-1}>Bodrum / Alt Kat (-1)</option>
                </select>
              </div>
            </div>
          </div>

          {/* BÖLÜM 2: YATAK KONFİGÜRASYONU & İNTERAKTİF SAYACLAR */}
          <div className="p-4 sm:p-5 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-xs font-black text-indigo-950 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Bed className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  2. Yatak Tipi, Ekstra Yataklar & Kapasite
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Odadaki yatak sayılarını artırıp azalttıkça toplam kapasite otomatik hesaplanır.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-2xs self-start sm:self-auto">
                <span className="text-[11px] font-black text-indigo-900 dark:text-indigo-200">
                  Toplam Kapasite:
                </span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {roomForm.capacity} Kişi
                </span>
              </div>
            </div>

            {/* Yatak Tipleri Sayaç Izgarası */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Çift Kişilik Yatak (2 Kişi)", key: "doubleBeds", icon: "🛏️" },
                { label: "Tek Kişilik Yatak (1 Kişi)", key: "singleBeds", icon: "🛌" },
                { label: "Ranza (2 Kişi)", key: "bunkBeds", icon: "🪜" },
                { label: "Ekstra Yatak (Katlanır)", key: "extraBeds", icon: "🛋️" },
                { label: "Döşek / Yer Yatağı", key: "floorMattress", icon: "🛏️" },
                { label: "Bebek Yatağı / Beşik", key: "babyCribs", icon: "👶" },
                { label: "Açılır Koltuk / Çekyat", key: "sofaBeds", icon: "🛋️" },
              ].map((item) => {
                const count = bedConfig[item.key] || 0;
                return (
                  <div key={item.key} className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase block truncate" title={item.label}>
                      {item.icon} {item.label}
                    </span>
                    <div className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const nextVal = Math.max(0, count - 1);
                          const nextConfig = { ...bedConfig, [item.key]: nextVal };
                          setBedConfig(nextConfig);

                          const parts: string[] = [];
                          if (nextConfig.doubleBeds > 0) parts.push(`${nextConfig.doubleBeds} Çift Kişilik Yatak`);
                          if (nextConfig.singleBeds > 0) parts.push(`${nextConfig.singleBeds} Tek Kişilik Yatak`);
                          if (nextConfig.bunkBeds > 0) parts.push(`${nextConfig.bunkBeds} Ranza`);
                          if (nextConfig.extraBeds > 0) parts.push(`${nextConfig.extraBeds} Ekstra Yatak (Katlanır)`);
                          if (nextConfig.floorMattress > 0) parts.push(`${nextConfig.floorMattress} Döşek / Yer Yatağı`);
                          if (nextConfig.babyCribs > 0) parts.push(`${nextConfig.babyCribs} Bebek Yatağı / Beşik`);
                          if (nextConfig.sofaBeds > 0) parts.push(`${nextConfig.sofaBeds} Açılır Koltuk / Çekyat`);

                          const stdCapacity = (nextConfig.doubleBeds * 2) + nextConfig.singleBeds + (nextConfig.bunkBeds * 2) + nextConfig.extraBeds + nextConfig.floorMattress + nextConfig.sofaBeds;
                          const suggestedCap = Math.max(1, stdCapacity);

                          setRoomForm((rf: any) => ({
                            ...rf,
                            bed_info: parts.join(", "),
                            capacity: suggestedCap,
                            max_adults: suggestedCap,
                            max_children: nextConfig.babyCribs > 0 ? nextConfig.babyCribs : (suggestedCap > 2 ? 1 : 0)
                          }));
                        }}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-100 hover:text-rose-700 dark:bg-slate-800 dark:hover:bg-rose-950 font-black text-xs flex items-center justify-center transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{count}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextVal = count + 1;
                          const nextConfig = { ...bedConfig, [item.key]: nextVal };
                          setBedConfig(nextConfig);

                          const parts: string[] = [];
                          if (nextConfig.doubleBeds > 0) parts.push(`${nextConfig.doubleBeds} Çift Kişilik Yatak`);
                          if (nextConfig.singleBeds > 0) parts.push(`${nextConfig.singleBeds} Tek Kişilik Yatak`);
                          if (nextConfig.bunkBeds > 0) parts.push(`${nextConfig.bunkBeds} Ranza`);
                          if (nextConfig.extraBeds > 0) parts.push(`${nextConfig.extraBeds} Ekstra Yatak (Katlanır)`);
                          if (nextConfig.floorMattress > 0) parts.push(`${nextConfig.floorMattress} Döşek / Yer Yatağı`);
                          if (nextConfig.babyCribs > 0) parts.push(`${nextConfig.babyCribs} Bebek Yatağı / Beşik`);
                          if (nextConfig.sofaBeds > 0) parts.push(`${nextConfig.sofaBeds} Açılır Koltuk / Çekyat`);

                          const stdCapacity = (nextConfig.doubleBeds * 2) + nextConfig.singleBeds + (nextConfig.bunkBeds * 2) + nextConfig.extraBeds + nextConfig.floorMattress + nextConfig.sofaBeds;
                          const suggestedCap = Math.max(1, stdCapacity);

                          setRoomForm((rf: any) => ({
                            ...rf,
                            bed_info: parts.join(", "),
                            capacity: suggestedCap,
                            max_adults: suggestedCap,
                            max_children: nextConfig.babyCribs > 0 ? nextConfig.babyCribs : (suggestedCap > 2 ? 1 : 0)
                          }));
                        }}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-emerald-950 font-black text-xs flex items-center justify-center transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Şablonlar */}
            <div className="space-y-2 pt-2 border-t border-indigo-100 dark:border-slate-800">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                ⚡ Hızlı Yatak Kombinasyon Şablonları:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "1 Çift Kişilik (Standart 2 Kişi)", d: 1, s: 0, b: 0, ex: 0, fl: 0, cb: 0, sf: 0 },
                  { label: "2 Tek Kişilik (Twin Room)", d: 0, s: 2, b: 0, ex: 0, fl: 0, cb: 0, sf: 0 },
                  { label: "1 Çift + 1 Ekstra (3 Kişilik Aile)", d: 1, s: 0, b: 0, ex: 1, fl: 0, cb: 0, sf: 0 },
                  { label: "1 Çift + 1 Bebek Beşiği (Bebekli Aile)", d: 1, s: 0, b: 0, ex: 0, fl: 0, cb: 1, sf: 0 },
                  { label: "2 Çift Kişilik (Dört Kişilik Lüks Suite)", d: 2, s: 0, b: 0, ex: 0, fl: 0, cb: 0, sf: 0 },
                  { label: "1 Çift + 1 Ranza (4 Kişilik Aile)", d: 1, s: 0, b: 1, ex: 0, fl: 0, cb: 0, sf: 0 },
                ].map((template) => (
                  <button
                    key={template.label}
                    type="button"
                    onClick={() => {
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
                      if (nextConfig.extraBeds > 0) parts.push(`${nextConfig.extraBeds} Ekstra Yatak (Katlanır)`);
                      if (nextConfig.floorMattress > 0) parts.push(`${nextConfig.floorMattress} Döşek / Yer Yatağı`);
                      if (nextConfig.babyCribs > 0) parts.push(`${nextConfig.babyCribs} Bebek Yatağı / Beşik`);
                      if (nextConfig.sofaBeds > 0) parts.push(`${nextConfig.sofaBeds} Açılır Koltuk / Çekyat`);

                      const stdCapacity = (nextConfig.doubleBeds * 2) + nextConfig.singleBeds + (nextConfig.bunkBeds * 2) + nextConfig.extraBeds + nextConfig.floorMattress + nextConfig.sofaBeds;
                      const suggestedCap = Math.max(1, stdCapacity);

                      setRoomForm((rf: any) => ({
                        ...rf,
                        bed_info: parts.join(", "),
                        capacity: suggestedCap,
                        max_adults: suggestedCap,
                        max_children: nextConfig.babyCribs > 0 ? nextConfig.babyCribs : (suggestedCap > 2 ? 1 : 0)
                      }));
                    }}
                    className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-white dark:bg-slate-900 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-800 cursor-pointer shadow-2xs transition-all active:scale-95"
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Oluşturulan Metin Kutusu */}
            <div className="pt-2 border-t border-indigo-100 dark:border-slate-800">
              <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center justify-between mb-1">
                <span>Oluşturulan Yatak & Ekstra Yatak Açıklaması (Web & Rezervasyon Fişinde Gösterilir):</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Dilerseniz elle ek açıklama yazabilirsiniz</span>
              </label>
              <input
                type="text"
                placeholder="Örn: 1 Çift Kişilik Yatak, 1 Ekstra Katlanır Yatak, 1 Döşek"
                value={roomForm.bed_info}
                onChange={(e) => setRoomForm({ ...roomForm, bed_info: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* BÖLÜM 3: PANSİYON VE KONAKLAMA FİYATLARI */}
          <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 dark:border-slate-700 pb-3">
              <div>
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  3. Pansiyon Tiplerine Göre Gecelik Fiyatlandırma (₺)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Fiyatlar otomatik binlik ayraçlıdır. Rezervasyon ve check-in işlemlerinde bu baz fiyatlar kullanılır.
                </p>
              </div>
              <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 rounded-lg shrink-0 self-start sm:self-auto">
                Para Birimi: TRY (₺)
              </span>
            </div>

            <div className="mb-2">
              <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide block mb-2">
                {isTr ? "Fiyatlandırma Mantığı (Rezervasyon Hesaplaması)" : "Pricing Logic"}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setRoomForm({ ...roomForm, pricing_type: 'per_room' })}
                  className={`w-full p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between min-w-0 ${
                    roomForm.pricing_type === 'per_room'
                      ? 'bg-emerald-50 dark:bg-emerald-900/40 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="font-black text-sm mb-1 text-emerald-950 dark:text-emerald-100 flex items-center justify-between gap-2">
                    <span>Oda Başı (Sabit Fiyat)</span>
                    {roomForm.pricing_type === 'per_room' && (
                      <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold shrink-0">Seçili</span>
                    )}
                  </div>
                  <div className="text-xs font-medium opacity-90 leading-normal break-words">
                    Odayı kullanan kişi sayısından bağımsız, odanın gecelik satış fiyatı sabittir. (Kapasiteye kadar)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRoomForm({ ...roomForm, pricing_type: 'per_person' })}
                  className={`w-full p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between min-w-0 ${
                    roomForm.pricing_type === 'per_person' || !roomForm.pricing_type
                      ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-500 text-indigo-900 dark:text-indigo-100 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="font-black text-sm mb-1 text-indigo-950 dark:text-indigo-100 flex items-center justify-between gap-2">
                    <span>Kişi Başı (Dinamik Fiyat)</span>
                    {(roomForm.pricing_type === 'per_person' || !roomForm.pricing_type) && (
                      <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold shrink-0">Seçili</span>
                    )}
                  </div>
                  <div className="text-xs font-medium opacity-90 leading-normal break-words">
                    Girdiğiniz fiyatlar kişi başı 1 yetişkin ücretidir. Yaş indirimleri vb. çocuk oranlarına göre hesaplanır.
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* Sadece Oda (RO) */}
              <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 block mb-1">
                  Sadece Oda (RO)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₺</span>
                  <input
                    type="text"
                    placeholder="2.200"
                    value={formatThousand(roomForm.price_room_only)}
                    onChange={(e) => setRoomForm({ ...roomForm, price_room_only: parseThousand(e.target.value) })}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Oda + Kahvaltı (BB - Temel Fiyat) */}
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border-2 border-indigo-400 dark:border-indigo-600 shadow-xs">
                <label className="text-[11px] font-black text-indigo-900 dark:text-indigo-200 block mb-1">
                  Oda + Kahvaltı (BB - Baz Fiyat) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-indigo-500">₺</span>
                  <input
                    type="text"
                    placeholder="2.500"
                    value={formatThousand(roomForm.price_per_night)}
                    onChange={(e) => {
                      const val = parseThousand(e.target.value);
                      setRoomForm({ ...roomForm, price_per_night: val });
                    }}
                    className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-950 border border-indigo-500 rounded-lg text-sm font-black text-indigo-900 dark:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Yarım Pansiyon (HB) */}
              <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 block mb-1">
                  Yarım Pansiyon (HB)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₺</span>
                  <input
                    type="text"
                    placeholder="3.200"
                    value={formatThousand(roomForm.price_half_board)}
                    onChange={(e) => setRoomForm({ ...roomForm, price_half_board: parseThousand(e.target.value) })}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Tam Pansiyon (FB) */}
              <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 block mb-1">
                  Tam Pansiyon (FB)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₺</span>
                  <input
                    type="text"
                    placeholder="3.900"
                    value={formatThousand(roomForm.price_full_board)}
                    onChange={(e) => setRoomForm({ ...roomForm, price_full_board: parseThousand(e.target.value) })}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Her Şey Dahil (AI) */}
              <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 block mb-1">
                  Her Şey Dahil (AI)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₺</span>
                  <input
                    type="text"
                    placeholder="4.800"
                    value={formatThousand(roomForm.price_all_inclusive)}
                    onChange={(e) => setRoomForm({ ...roomForm, price_all_inclusive: parseThousand(e.target.value) })}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* İptal Edilemez İndirimi (%) */}
              <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <label className="text-[11px] font-black text-emerald-800 dark:text-emerald-300 block mb-1">
                  İptal Edilemez İndirimi (%)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-emerald-600">%</span>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    placeholder="10"
                    value={roomForm.non_refundable_discount}
                    onChange={(e) => setRoomForm({ ...roomForm, non_refundable_discount: Number(e.target.value) })}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-lg text-sm font-black text-emerald-800 dark:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* BÖLÜM 4: ÖZEL GÜN FİYATLARI VE TARİH KABATMA / BLOKAJ (Bayram, Yılbaşı, Sömestr) */}
          <div className="p-4 sm:p-5 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-amber-200 dark:border-amber-800/60 pb-3">
              <div>
                <span className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  4. Özel Gün Fiyatları & Tarih Blokajı / Kapatma (Bayram, Yılbaşı, Sömestr)
                </span>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                  Bayram, yılbaşı, sömestr veya yüksek sezonda geçerli özel fiyatlandırma ve odayı tarihe göre satışa kapatma (blokaj) kuralları.
                </p>
              </div>
            </div>

            {/* Özel Gün Fiyat Listesi & Ekleme */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-amber-950 dark:text-amber-100 uppercase tracking-wider">
                  🎉 Tanımlı Özel Gün & Sezon Fiyatları
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const newRule = {
                      id: `sp-${Date.now()}`,
                      title: "Kurban Bayramı Özel",
                      start_date: new Date().toISOString().split('T')[0],
                      end_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
                      price_per_night: Math.round((roomForm.price_per_night || 2500) * 1.5)
                    };
                    setRoomForm({
                      ...roomForm,
                      special_prices: [...(roomForm.special_prices || []), newRule]
                    });
                  }}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Özel Gün Fiyatı Ekle</span>
                </button>
              </div>

              {Array.isArray(roomForm.special_prices) && roomForm.special_prices.length > 0 ? (
                <div className="space-y-2">
                  {roomForm.special_prices.map((sp: any, spIdx: number) => (
                    <div key={sp.id || spIdx} className="p-3 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs">
                      <div className="sm:col-span-4">
                        <label className="text-[9px] font-bold text-slate-400 uppercase block">Özel Gün / Etkinlik Adı</label>
                        <input
                          type="text"
                          placeholder="Örn: Yılbaşı, Bayram, Sömestr"
                          value={sp.title}
                          onChange={(e) => {
                            const updated = [...roomForm.special_prices];
                            updated[spIdx].title = e.target.value;
                            setRoomForm({ ...roomForm, special_prices: updated });
                          }}
                          className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border rounded font-bold text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="text-[9px] font-bold text-slate-400 uppercase block">Başlangıç - Bitiş Tarihi</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            value={sp.start_date}
                            onChange={(e) => {
                              const updated = [...roomForm.special_prices];
                              updated[spIdx].start_date = e.target.value;
                              setRoomForm({ ...roomForm, special_prices: updated });
                            }}
                            className="w-full px-1.5 py-1 bg-slate-50 dark:bg-slate-800 border rounded font-bold text-[10px]"
                          />
                          <span>-</span>
                          <input
                            type="date"
                            value={sp.end_date}
                            onChange={(e) => {
                              const updated = [...roomForm.special_prices];
                              updated[spIdx].end_date = e.target.value;
                              setRoomForm({ ...roomForm, special_prices: updated });
                            }}
                            className="w-full px-1.5 py-1 bg-slate-50 dark:bg-slate-800 border rounded font-bold text-[10px]"
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-[9px] font-bold text-amber-700 dark:text-amber-300 uppercase block">Gecelik Fiyat (₺)</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1 text-xs font-bold text-amber-600">₺</span>
                          <input
                            type="text"
                            placeholder="3.500"
                            value={formatThousand(sp.price_per_night)}
                            onChange={(e) => {
                              const updated = [...roomForm.special_prices];
                              updated[spIdx].price_per_night = parseThousand(e.target.value);
                              setRoomForm({ ...roomForm, special_prices: updated });
                            }}
                            className="w-full pl-6 pr-2 py-1 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 rounded font-black text-amber-900 dark:text-amber-100"
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
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg cursor-pointer"
                          title="Kuralı Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-dashed border-amber-200 dark:border-amber-800 text-center">
                  <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                    Henüz bu oda için özel gün fiyatı tanımlanmadı. "Özel Gün Fiyatı Ekle" butonunu kullanarak bayram, yılbaşı veya yüksek sezon fiyatı ekleyebilirsiniz.
                  </p>
                </div>
              )}
            </div>

            {/* Tarih Kapatma & Blokaj Listesi & Ekleme */}
            <div className="pt-3 border-t border-amber-200 dark:border-amber-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-rose-900 dark:text-rose-200 uppercase tracking-wider">
                  🔒 Tarih Blokajı / Oda Kapatma (Tadilat, Özel Etkinlik vb.)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const newBlock = {
                      id: `cd-${Date.now()}`,
                      title: "Özel Tadilat / Kapatma",
                      start_date: new Date().toISOString().split('T')[0],
                      end_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
                      reason: "Tesis içi bakım çalışması"
                    };
                    setRoomForm({
                      ...roomForm,
                      closed_dates: [...(roomForm.closed_dates || []), newBlock]
                    });
                  }}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tarih Kapat / Blokaj Ekle</span>
                </button>
              </div>

              {Array.isArray(roomForm.closed_dates) && roomForm.closed_dates.length > 0 ? (
                <div className="space-y-2">
                  {roomForm.closed_dates.map((cd: any, cdIdx: number) => (
                    <div key={cd.id || cdIdx} className="p-3 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs">
                      <div className="sm:col-span-5">
                        <label className="text-[9px] font-bold text-rose-800 dark:text-rose-300 uppercase block">Kapatma / Blokaj Nedeni</label>
                        <input
                          type="text"
                          placeholder="Örn: Tadilat, Sahiplik Kullanımı"
                          value={cd.title}
                          onChange={(e) => {
                            const updated = [...roomForm.closed_dates];
                            updated[cdIdx].title = e.target.value;
                            setRoomForm({ ...roomForm, closed_dates: updated });
                          }}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-rose-300 rounded font-bold text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div className="sm:col-span-6">
                        <label className="text-[9px] font-bold text-rose-800 dark:text-rose-300 uppercase block">Kapatılan Tarih Aralığı</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            value={cd.start_date}
                            onChange={(e) => {
                              const updated = [...roomForm.closed_dates];
                              updated[cdIdx].start_date = e.target.value;
                              setRoomForm({ ...roomForm, closed_dates: updated });
                            }}
                            className="w-full px-1.5 py-1 bg-white dark:bg-slate-900 border rounded font-bold text-[10px]"
                          />
                          <span>-</span>
                          <input
                            type="date"
                            value={cd.end_date}
                            onChange={(e) => {
                              const updated = [...roomForm.closed_dates];
                              updated[cdIdx].end_date = e.target.value;
                              setRoomForm({ ...roomForm, closed_dates: updated });
                            }}
                            className="w-full px-1.5 py-1 bg-white dark:bg-slate-900 border rounded font-bold text-[10px]"
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = roomForm.closed_dates.filter((_: any, i: number) => i !== cdIdx);
                            setRoomForm({ ...roomForm, closed_dates: updated });
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900 rounded-lg cursor-pointer"
                          title="Blokajı Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-dashed border-rose-200 dark:border-rose-800 text-center">
                  <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">
                    Bu oda için herhangi bir kapalı tarih veya blokaj kuralı yok.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* BÖLÜM 5: ODA OLANAKLARI & HIZLI SEÇİM */}
          <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Coffee className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                4. Oda Olanakları & Hizmetler
              </span>
              <span className="text-[10px] text-slate-500">Tıklayarak ekleyip çıkarabilirsiniz</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                "WiFi", "Deniz Manzarası", "Balkon", "Klima", "LCD TV", "Minibar", 
                "Jakuzi", "Çay/Kahve Makinesi", "Kasa", "Saç Kurutma Makinesi", "Oda Servisi"
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {isSelected ? `✓ ${amenity}` : `+ ${amenity}`}
                  </button>
                );
              })}
            </div>

            <div>
              <input
                type="text"
                placeholder="WiFi, Deniz Manzarası, Balkon, Jakuzi, Klima..."
                value={roomForm.amenitiesStr}
                onChange={(e) => setRoomForm({ ...roomForm, amenitiesStr: e.target.value })}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* BÖLÜM 5: FOTOĞRAF GALERİSİ & GÖRSELLER */}
          <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 dark:border-slate-700 pb-3">
              <div>
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  5. Oda Fotoğraf Galerisi & Kapak Görselleri
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Web sitenizde ve rezervasyon sayfasında misafirlerin göreceği fotoğrafları ekleyin.
                </p>
              </div>
              <span className="text-[10px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-lg shrink-0 self-start sm:self-auto">
                {roomForm.images?.length || 0} Fotoğraf
              </span>
            </div>

            {/* Gizli Dosya Inputları */}
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

            {/* Eylem Butonları */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => document.getElementById('hotel_room_photo_camera_input')?.click()}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Camera className="h-4 w-4" />
                <span>{isTr ? "📸 Fotoğraf Çek" : "Take Photo"}</span>
              </button>

              <button
                type="button"
                onClick={() => document.getElementById('hotel_room_photo_file_input')?.click()}
                className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                <span>{isTr ? "📁 Dosya / Galeri Seç" : "Upload File"}</span>
              </button>

              <div className="flex-1 min-w-[240px] flex gap-1.5">
                <input
                  type="text"
                  id="hotel_room_custom_url_input"
                  placeholder="Web görsel linki yapıştırın (https://...)"
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
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
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Ekle
                </button>
              </div>
            </div>

            {/* Görsel Grid */}
            {roomForm.images && roomForm.images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {(roomForm.images || []).map((imgUrl: string, idx: number) => {
                  const isCover = roomForm.cover_image === imgUrl || (!roomForm.cover_image && idx === 0);
                  return (
                    <div
                      key={idx}
                      className={`relative group h-28 rounded-xl overflow-hidden border-2 transition-all ${
                        isCover ? "border-amber-500 ring-2 ring-amber-500/40 shadow-md" : "border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Room Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {isCover && (
                        <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm">
                          Ana Kapak
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                        {!isCover && (
                          <button
                            type="button"
                            onClick={() => setRoomForm((prev: any) => ({ ...prev, cover_image: imgUrl }))}
                            className="px-2 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer w-full text-center"
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
                          className="px-2 py-1 bg-rose-600 text-white text-[10px] font-bold rounded-lg hover:bg-rose-700 transition-colors cursor-pointer w-full text-center"
                        >
                          Fotoğrafı Sil
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                <p className="text-xs text-slate-500 font-bold">Henüz fotoğraf yüklenmedi. Yukarıdaki butonlarla görsel ekleyebilirsiniz.</p>
              </div>
            )}
          </div>

          {/* BÖLÜM 6: AÇIKLAMA, ODA DURUMU VE İÇ NOTLAR */}
          <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-4">
            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              6. Açıklama & Oda Durumu
            </span>

            <div>
              <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide block mb-1">
                Web Sitesi Açıklaması
              </label>
              <textarea
                rows={2}
                placeholder="Akdeniz manzaralı, geniş balkonlu ve ekstra yatak imkanına sahip lüks aile odası..."
                value={roomForm.description}
                onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide block mb-1">
                  {isTr ? "Oda Durumu" : "Status"}
                </label>
                <select
                  value={roomForm.status}
                  onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="vacant">🟢 Boş & Hazır</option>
                  <option value="occupied">🔴 Dolu (Misafir Konaklamada)</option>
                  <option value="maintenance">🛠️ Tadilatta / Servis Dışı</option>
                  <option value="staff">🟣 Personel Tahsisli</option>
                  <option value="disabled">⚪ Pasif / Kapalı</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide block mb-1">
                  {isTr ? "İç Notlar (Resepsiyon / Kat Hizmetleri)" : "Internal Notes"}
                </label>
                <input
                  type="text"
                  placeholder="Klima bakımı yapıldı, ek yatak odada hazır vb."
                  value={roomForm.notes}
                  onChange={(e) => setRoomForm({ ...roomForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* MODAL FOOTER BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              Vazgeç / İptal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{editingRoom ? "Güncellemeleri Kaydet & Yayınla" : "Odayı Kaydet & Sisteme Ekle"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
