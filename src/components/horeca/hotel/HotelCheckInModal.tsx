import React from 'react';
import { X, Users, Trash2 } from 'lucide-react';
import { HotelRoom } from '../HotelRoomManagement';

interface HotelCheckInModalProps {
  checkInModalRoom: HotelRoom | null;
  setCheckInModalRoom: (room: HotelRoom | null) => void;
  rooms: HotelRoom[];
  guestForm: {
    identity_no: string;
    phone: string;
    first_name: string;
    last_name: string;
    birth_date: string;
    check_in_date: string;
    check_out_date: string;
    additionalGuests?: any[];
  };
  setGuestForm: (form: any) => void;
  handleExecuteCheckIn: (e: React.FormEvent) => void;
  handleAdminCheckInChange: (val: string) => void;
  getNextDayString: (startDateStr: string) => string;
  calculateAgeDetails: (birthDateStr: string, fallbackAge?: number) => any;
  handleAddAdditionalGuestField: () => void;
  handleRemoveAdditionalGuestField: (index: number) => void;
}

export const HotelCheckInModal: React.FC<HotelCheckInModalProps> = ({
  checkInModalRoom,
  setCheckInModalRoom,
  rooms,
  guestForm,
  setGuestForm,
  handleExecuteCheckIn,
  handleAdminCheckInChange,
  getNextDayString,
  calculateAgeDetails,
  handleAddAdditionalGuestField,
  handleRemoveAdditionalGuestField,
}) => {
  if (!checkInModalRoom) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Oda #{checkInModalRoom.room_number} Misafir Girişi (Check-In)
            </h3>
            <p className="text-xs text-slate-500">Maks Kapasite: {checkInModalRoom.capacity} Kişi</p>
          </div>
          <button onClick={() => setCheckInModalRoom(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleExecuteCheckIn} className="space-y-3.5">
          {/* SELECT ROOM DROPDOWN */}
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-1">
            <label className="text-[10px] font-black text-emerald-900 dark:text-emerald-200 uppercase flex items-center justify-between">
              <span>Tahsis Edilecek Oda Seçimi</span>
              <span className="text-[9px] text-emerald-600 font-bold">Maks Kapasite: {checkInModalRoom.capacity} Kişi</span>
            </label>
            <select
              value={checkInModalRoom.id}
              onChange={(e) => {
                const sel = rooms.find(r => r.id === e.target.value);
                if (sel) setCheckInModalRoom(sel);
              }}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-black text-slate-900 dark:text-white"
            >
              {rooms.map(r => (
                <option key={r.id} value={r.id}>
                  Oda #{r.room_number} - {r.room_type} ({r.status === 'vacant' ? '🟢 Boş & Hazır' : r.status === 'occupied' ? '🔴 Dolu' : '⚠️ Tadilat/Servis Dışı'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
                <span>TC / Pasaport No</span>
                <span className="text-rose-500 font-bold">* (Zorunlu)</span>
              </label>
              <input
                type="text"
                required
                placeholder="11 Haneli TC veya Pasaport"
                value={guestForm.identity_no}
                onChange={(e) => setGuestForm({ ...guestForm, identity_no: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase">Telefon</label>
              <input
                type="text"
                placeholder="+90 5XX XXX XX XX"
                value={guestForm.phone}
                onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
                <span>Misafir Adı</span>
                <span className="text-rose-500 font-bold">* (Zorunlu)</span>
              </label>
              <input
                type="text"
                required
                placeholder="Adı"
                value={guestForm.first_name}
                onChange={(e) => setGuestForm({ ...guestForm, first_name: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
                <span>Soyadı</span>
                <span className="text-rose-500 font-bold">* (Zorunlu)</span>
              </label>
              <input
                type="text"
                required
                placeholder="Soyadı"
                value={guestForm.last_name}
                onChange={(e) => setGuestForm({ ...guestForm, last_name: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
            </div>
          </div>

          {/* BIRTHDATE & AUTO AGE DISCOUNT DISPLAY */}
          <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-indigo-900 dark:text-indigo-300 uppercase">Doğum Tarihi</label>
                <input
                  type="date"
                  required
                  value={guestForm.birth_date}
                  onChange={(e) => setGuestForm({ ...guestForm, birth_date: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="flex flex-col justify-end">
                {guestForm.birth_date && (() => {
                  const details = calculateAgeDetails(guestForm.birth_date);
                  return (
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white border border-indigo-200">
                      <span>Yaş: {details.age} ({details.category})</span>
                      {details.discountRate > 0 && (
                        <span className="block text-[10px] text-emerald-600 font-black">
                          💡 Restoranda %{details.discountRate} Otomatik İndirimli!
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase">Giriş Tarihi (Check-In)</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={guestForm.check_in_date}
                onChange={(e) => handleAdminCheckInChange(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase">Çıkış Tarihi (Check-Out)</label>
              <input
                type="date"
                required
                min={getNextDayString(guestForm.check_in_date)}
                value={guestForm.check_out_date}
                onChange={(e) => setGuestForm({ ...guestForm, check_out_date: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
            </div>
          </div>

          {/* EXTRA GUESTS */}
          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Ek Misafirler (Çocuk / Bebek / Eş)</span>
              </div>
              <button
                type="button"
                onClick={handleAddAdditionalGuestField}
                className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-lg text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1"
              >
                + Ek Misafir Ekle
              </button>
            </div>

            {(guestForm.additionalGuests || []).map((ag, idx) => {
              const agAgeDetails = ag.birth_date ? calculateAgeDetails(ag.birth_date, ag.age) : null;
              return (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl space-y-2.5 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                    <span className="text-[11px] font-black text-indigo-900 dark:text-indigo-300">
                      {idx + 2}. Ek Misafir {agAgeDetails ? `(${agAgeDetails.age} Yaş - ${agAgeDetails.labelTr})` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAdditionalGuestField(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer transition-colors"
                      title="Misafiri Kaldır"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-0.5">
                        <span>TC / Pasaport No</span>
                        <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Kimlik / Pasaport"
                        value={ag.identity_no}
                        onChange={(e) => {
                          const list = [...(guestForm.additionalGuests || [])];
                          list[idx].identity_no = e.target.value;
                          setGuestForm({ ...guestForm, additionalGuests: list });
                        }}
                        className="w-full mt-0.5 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-0.5">
                        <span>Adı</span>
                        <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Adı"
                        value={ag.first_name}
                        onChange={(e) => {
                          const list = [...(guestForm.additionalGuests || [])];
                          list[idx].first_name = e.target.value;
                          setGuestForm({ ...guestForm, additionalGuests: list });
                        }}
                        className="w-full mt-0.5 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-0.5">
                        <span>Soyadı</span>
                        <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Soyadı"
                        value={ag.last_name}
                        onChange={(e) => {
                          const list = [...(guestForm.additionalGuests || [])];
                          list[idx].last_name = e.target.value;
                          setGuestForm({ ...guestForm, additionalGuests: list });
                        }}
                        className="w-full mt-0.5 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400">🎂 Doğum Tarihi (İndirim Yaş Hesabı)</label>
                      <input
                        type="date"
                        value={ag.birth_date}
                        onChange={(e) => {
                          const list = [...(guestForm.additionalGuests || [])];
                          list[idx].birth_date = e.target.value;
                          if (e.target.value) {
                            const details = calculateAgeDetails(e.target.value);
                            list[idx].age = details.age;
                            list[idx].age_category = details.category;
                            list[idx].discount_rate = details.discountRate;
                          }
                          setGuestForm({ ...guestForm, additionalGuests: list });
                        }}
                        className="w-full mt-0.5 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400">Cinsiyet</label>
                      <select
                        value={ag.gender || "Kadın"}
                        onChange={(e) => {
                          const list = [...(guestForm.additionalGuests || [])];
                          list[idx].gender = e.target.value;
                          setGuestForm({ ...guestForm, additionalGuests: list });
                        }}
                        className="w-full mt-0.5 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                      >
                        <option value="Erkek">Erkek</option>
                        <option value="Kadın">Kadın</option>
                        <option value="Çocuk">Çocuk / Bebek</option>
                      </select>
                    </div>
                  </div>

                  {agAgeDetails && (
                    <div className="p-2 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between border border-indigo-100 dark:border-indigo-900">
                      <span>Yaş: {agAgeDetails.age} ({agAgeDetails.labelTr})</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black">
                        💡 {agAgeDetails.discountText} (Restoran %{agAgeDetails.discountRate} İndirimli)
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCheckInModalRoom(null)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              Giriş Yap (Check-In)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
