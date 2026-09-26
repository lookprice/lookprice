import React, { useState, useEffect } from "react";
import {
  BedDouble,
  BedSingle,
  User,
  Baby,
  X,
  Users,
  Printer,
  UserCheck,
  Receipt,
  Edit3,
  Save,
  AlertCircle,
  Calendar
} from "lucide-react";
import { HotelRoom, ParsedBedAndCapacity, RoomReservation } from "./hotelTypes";

export interface HotelRoomDetailModalProps {
  selectedRoomDetailModal: HotelRoom | null;
  onClose: () => void;
  formatDisplayDate: (val: string | null | undefined) => string;
  parseBedAndCapacity: (room: HotelRoom) => ParsedBedAndCapacity;
  handlePrintKbsManifest: (rooms?: HotelRoom[]) => void;
  setCheckInModalRoom: (room: HotelRoom | null) => void;
  setCheckOutModalRoom: (room: HotelRoom | null) => void;
  openAddOrEditRoomModal: (room: HotelRoom) => void;
  onReviseRoomGuests?: (roomId: string, currentGuest: any, additionalGuests: any[]) => void;
  onEditReservation?: (room: HotelRoom, res: RoomReservation) => void;
}

export const HotelRoomDetailModal: React.FC<HotelRoomDetailModalProps> = ({
  selectedRoomDetailModal,
  onClose,
  formatDisplayDate,
  parseBedAndCapacity,
  handlePrintKbsManifest,
  setCheckInModalRoom,
  setCheckOutModalRoom,
  openAddOrEditRoomModal,
  onReviseRoomGuests,
  onEditReservation,
}) => {
  const [isEditingGuests, setIsEditingGuests] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [mainGuestForm, setMainGuestForm] = useState({
    first_name: "",
    last_name: "",
    identity_no: "",
    phone: "",
    email: "",
    birth_date: "",
    board_type: "BB",
    check_in_date: "",
    check_out_date: "",
    notes: ""
  });
  const [additionalGuestsForm, setAdditionalGuestsForm] = useState<any[]>([]);

  useEffect(() => {
    if (selectedRoomDetailModal?.current_guest) {
      const cg = selectedRoomDetailModal.current_guest;
      setMainGuestForm({
        first_name: cg.first_name || "",
        last_name: cg.last_name || "",
        identity_no: cg.identity_no || "",
        phone: cg.phone || "",
        email: cg.email || "",
        birth_date: cg.birth_date || "",
        board_type: cg.board_type || "BB",
        check_in_date: cg.check_in_date || "",
        check_out_date: cg.check_out_date || "",
        notes: cg.notes || ""
      });
      setAdditionalGuestsForm(
        (selectedRoomDetailModal.additional_guests || []).map(ag => ({
          first_name: ag.first_name || "",
          last_name: ag.last_name || "",
          identity_no: ag.identity_no || "",
          birth_date: ag.birth_date || "",
          age: ag.age || 0,
          gender: ag.gender || "Kadın"
        }))
      );
      setIsEditingGuests(false);
      setErrorMsg("");
    }
  }, [selectedRoomDetailModal]);

  if (!selectedRoomDetailModal) return null;

  const handleSaveGuestRevision = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const fName = mainGuestForm.first_name.trim();
    const lName = mainGuestForm.last_name.trim();
    const idNo = mainGuestForm.identity_no.trim();

    if (!fName || !lName || !idNo) {
      setErrorMsg("Ana Misafir için TC / Pasaport No, Ad ve Soyad alanları zorunludur.");
      return;
    }

    // Check additional guests
    for (let i = 0; i < additionalGuestsForm.length; i++) {
      const ag = additionalGuestsForm[i];
      if (!ag.first_name?.trim() || !ag.last_name?.trim() || !ag.identity_no?.trim()) {
        setErrorMsg(`${i + 2}. Ek Misafir için Ad, Soyad ve TC / Pasaport No alanları zorunludur.`);
        return;
      }
    }

    const updatedCurrentGuest = {
      ...selectedRoomDetailModal.current_guest,
      first_name: fName,
      last_name: lName,
      identity_no: idNo,
      phone: mainGuestForm.phone.trim(),
      email: mainGuestForm.email.trim(),
      birth_date: mainGuestForm.birth_date,
      board_type: mainGuestForm.board_type,
      check_in_date: mainGuestForm.check_in_date,
      check_out_date: mainGuestForm.check_out_date,
      notes: mainGuestForm.notes.trim()
    };

    const updatedAdditionalGuests = additionalGuestsForm.map(ag => ({
      ...ag,
      first_name: ag.first_name.trim(),
      last_name: ag.last_name.trim(),
      identity_no: ag.identity_no.trim()
    }));

    if (onReviseRoomGuests) {
      onReviseRoomGuests(selectedRoomDetailModal.id, updatedCurrentGuest, updatedAdditionalGuests);
    }
    setIsEditingGuests(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-4xl w-full border-2 border-slate-300 dark:border-slate-700 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* MODAL HEADER */}
        <div className="flex items-start justify-between border-b-2 border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-sm shrink-0">
              <BedDouble className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Oda #{selectedRoomDetailModal.room_number} — Misafir Künyesi & Rezervasyon Detayları
                </h3>
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-black uppercase ${
                  selectedRoomDetailModal.status === 'occupied' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300' :
                  selectedRoomDetailModal.status === 'vacant' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300' :
                  selectedRoomDetailModal.status === 'maintenance' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300' :
                  'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300'
                }`}>
                  {selectedRoomDetailModal.status === 'occupied' ? '🔴 Dolu (Misafirli)' :
                   selectedRoomDetailModal.status === 'vacant' ? '🟢 Boş / Hazır' :
                   selectedRoomDetailModal.status === 'maintenance' ? '🛠️ Servis Dışı / Bakımda' : '👤 Personel'}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {selectedRoomDetailModal.room_type}
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                {(() => {
                  const bed = parseBedAndCapacity(selectedRoomDetailModal);
                  return (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {bed.doubleBeds > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-black border border-indigo-200 dark:border-indigo-800">
                          <BedDouble className="h-3 w-3" />
                          {bed.doubleBeds} Çift Kişilik
                        </span>
                      )}
                      {bed.singleBeds > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[10px] font-black border border-sky-200 dark:border-sky-800">
                          <BedSingle className="h-3 w-3" />
                          {bed.singleBeds} Tek Kişilik {bed.hasBunk ? '(Ranza)' : ''}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black border border-emerald-200 dark:border-emerald-800">
                        <User className="h-3 w-3" />
                        {bed.adults} Yetişkin
                        {bed.children > 0 && (
                          <>
                            <span>+</span>
                            <Baby className="h-2.5 w-2.5" />
                            <span>{bed.children} Çocuk</span>
                          </>
                        )}
                      </span>
                    </div>
                  );
                })()}
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  ₺{(selectedRoomDetailModal.price_per_night || 2500).toLocaleString('tr-TR')}/gece
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-xl cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-bold">{errorMsg}</span>
          </div>
        )}

        {/* QUICK STATS & FOLIO BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
          <div className="space-y-0.5">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Pansiyon Tipi & Ücret</p>
            <p className="text-sm font-black text-slate-900 dark:text-white">
              {selectedRoomDetailModal.current_guest?.board_type || 'BB'} (Oda + Kahvaltı)
            </p>
          </div>

          <div className="space-y-0.5">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Konaklama Tarihleri</p>
            <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">
              {selectedRoomDetailModal.current_guest ? (
                `${formatDisplayDate(selectedRoomDetailModal.current_guest.check_in_date)} ➔ ${formatDisplayDate(selectedRoomDetailModal.current_guest.check_out_date)}`
              ) : "- Satışta Müsait -"}
            </p>
          </div>

          <div className="space-y-0.5">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Adisyon / Folyo Borcu</p>
            <p className="text-sm font-black text-rose-600 dark:text-rose-400">
              ₺{(selectedRoomDetailModal.folio?.total_amount || 0).toLocaleString('tr-TR')}
            </p>
          </div>
        </div>

        {/* GUEST MANIFEST TABLE OR REVISION FORM */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
              <Users className="h-4 w-4 text-emerald-600" />
              <span>Misafir Kimlik Dökümü (KBS)</span>
            </h4>

            {selectedRoomDetailModal.status === 'occupied' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingGuests(!isEditingGuests)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>{isEditingGuests ? "Döküme Dön" : "Misafir Bilgilerini Revize Et"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrintKbsManifest([selectedRoomDetailModal])}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>KBS Dökümü Yazdır</span>
                </button>
              </div>
            )}
          </div>

          {/* EDIT GUESTS FORM */}
          {isEditingGuests && selectedRoomDetailModal.current_guest ? (
            <form onSubmit={handleSaveGuestRevision} className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="font-black text-indigo-900 dark:text-indigo-200 text-sm flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-indigo-600" />
                  1. Ana Misafir Bilgilerini Revize Et
                </span>
                <span className="text-[10px] text-rose-500 font-bold">* Alanlar Zorunludur</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                    TC / Pasaport No <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={mainGuestForm.identity_no}
                    onChange={(e) => setMainGuestForm({ ...mainGuestForm, identity_no: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                    Adı <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={mainGuestForm.first_name}
                    onChange={(e) => setMainGuestForm({ ...mainGuestForm, first_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                    Soyadı <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={mainGuestForm.last_name}
                    onChange={(e) => setMainGuestForm({ ...mainGuestForm, last_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Telefon</label>
                  <input
                    type="text"
                    value={mainGuestForm.phone}
                    onChange={(e) => setMainGuestForm({ ...mainGuestForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Doğum Tarihi</label>
                  <input
                    type="date"
                    value={mainGuestForm.birth_date}
                    onChange={(e) => setMainGuestForm({ ...mainGuestForm, birth_date: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Pansiyon Tipi</label>
                  <select
                    value={mainGuestForm.board_type}
                    onChange={(e) => setMainGuestForm({ ...mainGuestForm, board_type: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="RO">Sadece Oda (RO)</option>
                    <option value="BB">Oda + Kahvaltı (BB)</option>
                    <option value="HB">Yarım Pansiyon (HB)</option>
                    <option value="FB">Tam Pansiyon (FB)</option>
                    <option value="AI">Her Şey Dahil (AI)</option>
                  </select>
                </div>
              </div>

              {/* Additional Guests List Editing */}
              {additionalGuestsForm.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-3">
                  <span className="font-black text-slate-700 dark:text-slate-300 uppercase text-[10px]">
                    Ek Misafirler ({additionalGuestsForm.length})
                  </span>
                  {additionalGuestsForm.map((ag, idx) => (
                    <div key={idx} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">
                          {idx + 2}. Ek Misafir TC/Pasaport <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={ag.identity_no}
                          onChange={(e) => {
                            const list = [...additionalGuestsForm];
                            list[idx].identity_no = e.target.value;
                            setAdditionalGuestsForm(list);
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">
                          Adı <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={ag.first_name}
                          onChange={(e) => {
                            const list = [...additionalGuestsForm];
                            list[idx].first_name = e.target.value;
                            setAdditionalGuestsForm(list);
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">
                          Soyadı <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={ag.last_name}
                          onChange={(e) => {
                            const list = [...additionalGuestsForm];
                            list[idx].last_name = e.target.value;
                            setAdditionalGuestsForm(list);
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsEditingGuests(false)}
                  className="px-3.5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Misafir Bilgilerini Güncelle</span>
                </button>
              </div>
            </form>
          ) : selectedRoomDetailModal.current_guest ? (
            /* REGULAR KBS MANIFEST TABLE */
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <th className="p-2.5 pl-4">Sıra / Rol</th>
                      <th className="p-2.5">T.C. / Pasaport No</th>
                      <th className="p-2.5">Adı Soyadı</th>
                      <th className="p-2.5">Cinsiyet</th>
                      <th className="p-2.5">Doğum Tarihi & Yaş</th>
                      <th className="p-2.5">Uyruk</th>
                      <th className="p-2.5">İletişim Tel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold text-slate-800 dark:text-slate-200">
                    {/* MAIN GUEST */}
                    <tr className="bg-indigo-50/50 dark:bg-indigo-950/20">
                      <td className="p-2.5 pl-4">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100 rounded text-[10px] font-black">
                          1. Ana Misafir
                        </span>
                      </td>
                      <td className="p-2.5 font-black tracking-wider text-slate-900 dark:text-white font-mono">
                        {selectedRoomDetailModal.current_guest.identity_no || "-"}
                      </td>
                      <td className="p-2.5 font-black text-slate-900 dark:text-white">
                        {selectedRoomDetailModal.current_guest.first_name} {selectedRoomDetailModal.current_guest.last_name}
                      </td>
                      <td className="p-2.5">Erkek / Yetişkin</td>
                      <td className="p-2.5">
                        {formatDisplayDate(selectedRoomDetailModal.current_guest.birth_date)} ({selectedRoomDetailModal.current_guest.age || 35} Yaş)
                      </td>
                      <td className="p-2.5">TC - Türkiye</td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">
                        {selectedRoomDetailModal.current_guest.phone || "-"}
                      </td>
                    </tr>

                    {/* ADDITIONAL GUESTS */}
                    {selectedRoomDetailModal.additional_guests?.map((ag, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-2.5 pl-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded text-[10px] font-black">
                            {idx + 2}. Ek Misafir
                          </span>
                        </td>
                        <td className="p-2.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {ag.identity_no || "-"}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                          {ag.first_name} {ag.last_name}
                        </td>
                        <td className="p-2.5">Kadın / Çocuk</td>
                        <td className="p-2.5">
                          {formatDisplayDate(ag.birth_date)} ({ag.age} Yaş)
                        </td>
                        <td className="p-2.5">TC - Türkiye</td>
                        <td className="p-2.5 text-slate-500">
                          {selectedRoomDetailModal.current_guest?.phone || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 font-medium text-xs">
              Bu odada şu anda kayıtlı konaklayan misafir bulunmamaktadır.
            </div>
          )}
        </div>

        {/* UPCOMING RESERVATIONS ON THIS ROOM */}
        {Array.isArray(selectedRoomDetailModal.reservations) && selectedRoomDetailModal.reservations.length > 0 && (
          <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-black text-indigo-900 dark:text-indigo-200 uppercase text-[10px] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                Odaya Ait Gelecek Rezervasyonlar ({selectedRoomDetailModal.reservations.length})
              </span>
            </div>
            <div className="space-y-1.5">
              {selectedRoomDetailModal.reservations.map((res, rIdx) => (
                <div key={res.id || rIdx} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {res.first_name} {res.last_name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-2 font-mono">
                      (TC: {res.identity_no || '-'})
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {formatDisplayDate(res.check_in_date)} ➔ {formatDisplayDate(res.check_out_date)} • {res.board_type || 'BB'}
                    </p>
                  </div>

                  {onEditReservation && (
                    <button
                      type="button"
                      onClick={() => onEditReservation(selectedRoomDetailModal, res)}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Revize Et</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACTION FOOTER */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {selectedRoomDetailModal.status === 'vacant' && (
              <button
                type="button"
                onClick={() => {
                  const room = selectedRoomDetailModal;
                  onClose();
                  setCheckInModalRoom(room);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <UserCheck className="h-4 w-4" />
                <span>Giriş Yap</span>
              </button>
            )}

            {selectedRoomDetailModal.status === 'occupied' && (
              <button
                type="button"
                onClick={() => {
                  const room = selectedRoomDetailModal;
                  onClose();
                  setCheckOutModalRoom(room);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Receipt className="h-4 w-4" />
                <span>Folio & Check-Out Aç</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                const room = selectedRoomDetailModal;
                onClose();
                openAddOrEditRoomModal(room);
              }}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="h-4 w-4" />
              <span>Oda Düzenle</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-bold text-xs hover:bg-slate-800 cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
