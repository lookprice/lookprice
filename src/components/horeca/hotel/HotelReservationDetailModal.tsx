import React, { useState, useEffect } from "react";
import { UserCheck, X, Baby, Edit3, Check, Save, AlertCircle } from "lucide-react";
import { RoomReservation } from "./hotelTypes";

export interface HotelReservationDetailModalProps {
  selectedReservationModal: any | null;
  onClose: () => void;
  formatDisplayDate: (val: string | null | undefined) => string;
  calculateAgeDetails: (birthDate?: string, manualAge?: number) => any;
  onSaveReservation?: (roomId: string, updatedRes: RoomReservation) => void;
  onDeleteReservation?: (roomId: string, resId: string) => void;
}

export const HotelReservationDetailModal: React.FC<HotelReservationDetailModalProps> = ({
  selectedReservationModal,
  onClose,
  formatDisplayDate,
  calculateAgeDetails,
  onSaveReservation,
  onDeleteReservation,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<{
    first_name: string;
    last_name: string;
    identity_no: string;
    phone: string;
    email: string;
    check_in_date: string;
    check_out_date: string;
    board_type: string;
    main_guest_age: number;
    notes: string;
  }>({
    first_name: "",
    last_name: "",
    identity_no: "",
    phone: "",
    email: "",
    check_in_date: "",
    check_out_date: "",
    board_type: "BB",
    main_guest_age: 35,
    notes: ""
  });
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (selectedReservationModal?.res) {
      const res = selectedReservationModal.res;
      setEditForm({
        first_name: res.first_name || "",
        last_name: res.last_name || "",
        identity_no: res.identity_no || "",
        phone: res.phone || "",
        email: res.email || "",
        check_in_date: res.check_in_date || "",
        check_out_date: res.check_out_date || "",
        board_type: res.board_type || "BB",
        main_guest_age: res.main_guest_age || 35,
        notes: res.notes || ""
      });
      setIsEditing(false);
      setErrorMsg("");
    }
  }, [selectedReservationModal]);

  if (!selectedReservationModal) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const fName = editForm.first_name.trim();
    const lName = editForm.last_name.trim();
    const idNo = editForm.identity_no.trim();

    if (!fName || !lName || !idNo) {
      setErrorMsg("Lütfen zorunlu alanları (TC/Pasaport No, Adı ve Soyadı) eksiksiz doldurunuz.");
      return;
    }

    const updatedRes: RoomReservation = {
      ...selectedReservationModal.res,
      first_name: fName,
      last_name: lName,
      identity_no: idNo,
      phone: editForm.phone.trim(),
      email: editForm.email.trim(),
      check_in_date: editForm.check_in_date,
      check_out_date: editForm.check_out_date,
      board_type: editForm.board_type as any,
      main_guest_age: Number(editForm.main_guest_age) || 35,
      notes: editForm.notes.trim()
    };

    if (onSaveReservation) {
      onSaveReservation(selectedReservationModal.room.id, updatedRes);
    }
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border-2 border-indigo-200 dark:border-indigo-800 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-sm">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Oda #{selectedReservationModal.room.room_number} - Rezervasyon Detayı
              </h3>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                {selectedReservationModal.room.room_type}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-bold">{errorMsg}</span>
          </div>
        )}

        {!isEditing ? (
          <div className="space-y-4">
            {/* MAIN GUEST HEADER */}
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-500">Ana Misafir / Ad Soyad</span>
                <p className="text-base font-black text-slate-900 dark:text-white">
                  {selectedReservationModal.res.first_name} {selectedReservationModal.res.last_name}
                </p>
                <p className="text-xs font-mono text-slate-600 dark:text-slate-300 font-bold mt-0.5">
                  TC/Pasaport: {selectedReservationModal.res.identity_no || 'Belirtilmedi'} | Tel: {selectedReservationModal.res.phone || 'Yok'}
                </p>
                {selectedReservationModal.res.email && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    E-posta: {selectedReservationModal.res.email}
                  </p>
                )}
              </div>
              <span className="px-3 py-1 bg-indigo-600 text-white rounded-xl text-xs font-black">
                {selectedReservationModal.res.board_type || 'BB'} Pansiyon
              </span>
            </div>

            {/* DATES & NIGHTS */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black">Giriş Tarihi:</span>
                <p className="text-slate-900 dark:text-white text-sm font-black">{formatDisplayDate(selectedReservationModal.res.check_in_date)}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black">Çıkış Tarihi:</span>
                <p className="text-slate-900 dark:text-white text-sm font-black">{formatDisplayDate(selectedReservationModal.res.check_out_date)}</p>
              </div>
            </div>

            {/* AGE & GUESTS BREAKDOWN */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-600 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
                <Baby className="h-4 w-4 text-amber-500" />
                <span>Konaklayan Yaş & Kişi Kırılımı</span>
              </h4>

              <div className="space-y-1.5">
                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                  <span>1. {selectedReservationModal.res.first_name} {selectedReservationModal.res.last_name} (Ana Misafir)</span>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100 rounded text-[10px] font-black">
                    {selectedReservationModal.res.main_guest_age || 35} Yaş (Yetişkin)
                  </span>
                </div>

                {selectedReservationModal.res.guests?.map((g: any, idx: number) => {
                  const ageDetails = calculateAgeDetails(g.birth_date, g.age);
                  return (
                    <div key={idx} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                      <span>{idx + 2}. {g.first_name} {g.last_name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-700 dark:text-slate-300">{ageDetails.age} Yaş</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          ageDetails.bracket === 'infant' ? 'bg-rose-100 text-rose-900' :
                          ageDetails.bracket === 'toddler' ? 'bg-emerald-100 text-emerald-900' :
                          ageDetails.bracket === 'child' ? 'bg-sky-100 text-sky-900' : 'bg-slate-200 text-slate-900'
                        }`}>
                          {ageDetails.labelTr} ({ageDetails.discountText})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* NOTES */}
            {selectedReservationModal.res.notes && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Rezervasyon Notları:</span>
                <p className="text-slate-700 dark:text-slate-300">{selectedReservationModal.res.notes}</p>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Misafir Bilgilerini Revize Et</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        ) : (
          /* EDIT REVISION FORM */
          <form onSubmit={handleSave} className="space-y-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
              <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Misafir ve Rezervasyon Bilgilerini Revize Ediyorsunuz</span>
            </div>

            {/* Mandatory ID & Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  TC / Pasaport No <span className="text-rose-500">* (Zorunlu)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="11 haneli TC veya Pasaport No"
                  value={editForm.identity_no}
                  onChange={(e) => setEditForm({ ...editForm, identity_no: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  İletişim Telefonu
                </label>
                <input
                  type="text"
                  placeholder="+90 5XX XXX XX XX"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Misafir Adı <span className="text-rose-500">* (Zorunlu)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Adı"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Misafir Soyadı <span className="text-rose-500">* (Zorunlu)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Soyadı"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Giriş Tarihi (Check-In)
                </label>
                <input
                  type="date"
                  required
                  value={editForm.check_in_date}
                  onChange={(e) => setEditForm({ ...editForm, check_in_date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Çıkış Tarihi (Check-Out)
                </label>
                <input
                  type="date"
                  required
                  value={editForm.check_out_date}
                  onChange={(e) => setEditForm({ ...editForm, check_out_date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Pansiyon Tipi
                </label>
                <select
                  value={editForm.board_type}
                  onChange={(e) => setEditForm({ ...editForm, board_type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="RO">Sadece Oda (RO)</option>
                  <option value="BB">Oda + Kahvaltı (BB)</option>
                  <option value="HB">Yarım Pansiyon (HB)</option>
                  <option value="FB">Tam Pansiyon (FB)</option>
                  <option value="AI">Her Şey Dahil (AI)</option>
                  <option value="UAI">Ultra Her Şey Dahil (UAI)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  E-Posta Adresi
                </label>
                <input
                  type="email"
                  placeholder="misafir@eposta.com"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                Özel İstekler / Notlar
              </label>
              <textarea
                rows={2}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Misafir istekleri, ek yatak, transfer vb."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            {/* FORM ACTIONS */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
              >
                Vazgeç
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Değişiklikleri Kaydet & Güncelle</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
