import React, { useState, useEffect } from "react";
import { X, Phone, Mail, UserCheck, CheckCircle2, Edit3, Save, AlertCircle } from "lucide-react";

interface HotelOnlineBookingDetailModalProps {
  selectedOnlineResModal: any | null;
  onClose: () => void;
  isTr: boolean;
  formatThousand: (val: number | string) => string;
  formatDisplayDate: (dateStr: string) => string;
  handleCheckInOnlineReservation: (res: any, targetRoomId?: string) => void;
  handleConfirmOnlineReservation: (res: any) => void;
  handleCancelOnlineReservation: (res: any) => void;
  handleSaveOnlineReservationRevision?: (resId: number | string, updatedData: any) => Promise<void>;
}

export const HotelOnlineBookingDetailModal: React.FC<HotelOnlineBookingDetailModalProps> = ({
  selectedOnlineResModal,
  onClose,
  isTr,
  formatThousand,
  formatDisplayDate,
  handleCheckInOnlineReservation,
  handleConfirmOnlineReservation,
  handleCancelOnlineReservation,
  handleSaveOnlineReservationRevision,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [editForm, setEditForm] = useState({
    guest_first_name: "",
    guest_last_name: "",
    guest_identity_no: "",
    guest_phone: "",
    guest_email: "",
    check_in_date: "",
    check_out_date: "",
    board_name: "",
    special_requests: ""
  });

  useEffect(() => {
    if (selectedOnlineResModal) {
      setEditForm({
        guest_first_name: selectedOnlineResModal.guest_first_name || "",
        guest_last_name: selectedOnlineResModal.guest_last_name || "",
        guest_identity_no: selectedOnlineResModal.guest_identity_no || "",
        guest_phone: selectedOnlineResModal.guest_phone || "",
        guest_email: selectedOnlineResModal.guest_email || "",
        check_in_date: selectedOnlineResModal.check_in_date || "",
        check_out_date: selectedOnlineResModal.check_out_date || "",
        board_name: selectedOnlineResModal.board_name || selectedOnlineResModal.board_type || "Oda Kahvaltı",
        special_requests: selectedOnlineResModal.special_requests || ""
      });
      setIsEditing(false);
      setErrorMsg("");
    }
  }, [selectedOnlineResModal]);

  if (!selectedOnlineResModal) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const fName = editForm.guest_first_name.trim();
    const lName = editForm.guest_last_name.trim();
    const idNo = editForm.guest_identity_no.trim();

    if (!fName || !lName || !idNo) {
      setErrorMsg("Lütfen misafir TC / Pasaport No, Ad ve Soyad alanlarını eksiksiz doldurunuz.");
      return;
    }

    if (handleSaveOnlineReservationRevision) {
      try {
        setIsSaving(true);
        await handleSaveOnlineReservationRevision(selectedOnlineResModal.id, {
          guest_first_name: fName,
          guest_last_name: lName,
          guest_identity_no: idNo,
          guest_phone: editForm.guest_phone.trim(),
          guest_email: editForm.guest_email.trim(),
          check_in_date: editForm.check_in_date,
          check_out_date: editForm.check_out_date,
          board_name: editForm.board_name.trim(),
          special_requests: editForm.special_requests.trim()
        });
        setIsEditing(false);
      } catch (err: any) {
        setErrorMsg(err.message || "Rezervasyon güncellenirken hata oluştu.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-xs">
              🔔
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isTr ? "Web Rezervasyon Künyesi" : "Online Booking Details"}</span>
                <span className="font-mono text-xs text-amber-500 font-bold">
                  {selectedOnlineResModal.reservation_code || `#${String(selectedOnlineResModal.id).slice(0, 8)}`}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedOnlineResModal.created_at ? new Date(selectedOnlineResModal.created_at).toLocaleString('tr-TR') : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
          >
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
          /* DETAILS VIEW */
          <div className="space-y-4 text-xs">
            {/* STATUS BANNER */}
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              selectedOnlineResModal.status === 'pending_action'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-900 dark:text-amber-200'
                : selectedOnlineResModal.status === 'checked_in'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-900 dark:text-emerald-200'
                : selectedOnlineResModal.status === 'confirmed'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 text-indigo-900 dark:text-indigo-200'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-300 text-slate-700 dark:text-slate-300'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                <span>Durum:</span>
                <span className="font-black uppercase">
                  {selectedOnlineResModal.status === 'pending_action' && '🔔 Aksiyon Bekliyor'}
                  {selectedOnlineResModal.status === 'checked_in' && '🟢 Odaya Giriş Yapıldı (Check-In)'}
                  {selectedOnlineResModal.status === 'confirmed' && '🔵 Rezerve / Onaylandı'}
                  {selectedOnlineResModal.status === 'cancelled' && '⚪ İptal Edildi'}
                </span>
              </div>
              <span className="font-black text-base text-emerald-600 dark:text-emerald-400">
                ₺{formatThousand(selectedOnlineResModal.total_amount)}
              </span>
            </div>

            {/* GUEST & CONTACT GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <p className="font-black text-slate-900 dark:text-white uppercase text-[10px] text-indigo-600 dark:text-indigo-400">
                  Misafir Bilgileri
                </p>
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  {selectedOnlineResModal.guest_first_name} {selectedOnlineResModal.guest_last_name}
                </p>
                <p className="text-slate-600 dark:text-slate-300 font-mono">
                  TC / Pasaport: <strong>{selectedOnlineResModal.guest_identity_no || '-'}</strong>
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  Kişi Sayısı: <strong>{selectedOnlineResModal.adults || selectedOnlineResModal.adults_count || 1} Yetişkin {(selectedOnlineResModal.children || selectedOnlineResModal.children_count) > 0 ? `, ${selectedOnlineResModal.children || selectedOnlineResModal.children_count} Çocuk` : ''}</strong>
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <p className="font-black text-slate-900 dark:text-white uppercase text-[10px] text-amber-600 dark:text-amber-400">
                  İletişim & Kanallar
                </p>
                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{selectedOnlineResModal.guest_phone || '-'}</span>
                </p>
                {selectedOnlineResModal.guest_email && (
                  <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5 truncate">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{selectedOnlineResModal.guest_email}</span>
                  </p>
                )}
                {selectedOnlineResModal.guest_phone && (
                  <div className="pt-1 flex items-center gap-2">
                    <a
                      href={`https://wa.me/${String(selectedOnlineResModal.guest_phone).replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] inline-flex items-center gap-1"
                    >
                      <span>WhatsApp'tan Yaz</span>
                    </a>
                    <a
                      href={`tel:${selectedOnlineResModal.guest_phone}`}
                      className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-bold text-[11px] inline-flex items-center gap-1"
                    >
                      <span>Ara</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* RESERVATION DATES & ROOM SPECS */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <p className="font-black text-slate-900 dark:text-white uppercase text-[10px] text-slate-500">
                Konaklama ve Oda Bilgisi
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block">Oda Tipi</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedOnlineResModal.room_type || 'Standart'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Oda No</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedOnlineResModal.room_number ? `#${selectedOnlineResModal.room_number}` : 'Atanacak'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Tarih Aralığı</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formatDisplayDate(selectedOnlineResModal.check_in_date)} - {formatDisplayDate(selectedOnlineResModal.check_out_date)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Pansiyon & Gece</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedOnlineResModal.board_name || selectedOnlineResModal.board_type || 'Oda Kahvaltı'} ({selectedOnlineResModal.nights || 1} Gece)</span>
                </div>
              </div>
            </div>

            {/* SPECIAL NOTES */}
            {selectedOnlineResModal.special_requests && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50 space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 block">Misafir Özel İstekleri & Notları:</span>
                <p className="text-amber-900 dark:text-amber-200 italic">{selectedOnlineResModal.special_requests}</p>
              </div>
            )}

            {/* MODAL ACTIONS */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Kapat
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Bilgileri Revize Et</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedOnlineResModal.status === 'pending_action' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCheckInOnlineReservation(selectedOnlineResModal)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>Odaya Check-In Yap</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleConfirmOnlineReservation(selectedOnlineResModal)}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Rezerve Et & Onayla</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCancelOnlineReservation(selectedOnlineResModal)}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl font-bold text-xs cursor-pointer"
                    >
                      İptal Et
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* EDIT REVISION FORM */
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
              <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Web Rezervasyon Misafir Bilgilerini Revize Ediyorsunuz</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  TC / Pasaport No <span className="text-rose-500">* (Zorunlu)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="TC / Pasaport No"
                  value={editForm.guest_identity_no}
                  onChange={(e) => setEditForm({ ...editForm, guest_identity_no: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  İletişim Telefonu
                </label>
                <input
                  type="text"
                  placeholder="+90 5XX XXX XX XX"
                  value={editForm.guest_phone}
                  onChange={(e) => setEditForm({ ...editForm, guest_phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
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
                  placeholder="Misafir Adı"
                  value={editForm.guest_first_name}
                  onChange={(e) => setEditForm({ ...editForm, guest_first_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Misafir Soyadı <span className="text-rose-500">* (Zorunlu)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misafir Soyadı"
                  value={editForm.guest_last_name}
                  onChange={(e) => setEditForm({ ...editForm, guest_last_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Giriş Tarihi
                </label>
                <input
                  type="date"
                  required
                  value={editForm.check_in_date}
                  onChange={(e) => setEditForm({ ...editForm, check_in_date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Çıkış Tarihi
                </label>
                <input
                  type="date"
                  required
                  value={editForm.check_out_date}
                  onChange={(e) => setEditForm({ ...editForm, check_out_date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Pansiyon Tipi
                </label>
                <input
                  type="text"
                  placeholder="Oda Kahvaltı vb."
                  value={editForm.board_name}
                  onChange={(e) => setEditForm({ ...editForm, board_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  E-Posta Adresi
                </label>
                <input
                  type="email"
                  placeholder="eposta@adresi.com"
                  value={editForm.guest_email}
                  onChange={(e) => setEditForm({ ...editForm, guest_email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                Özel İstekler / Notlar
              </label>
              <textarea
                rows={2}
                value={editForm.special_requests}
                onChange={(e) => setEditForm({ ...editForm, special_requests: e.target.value })}
                placeholder="Misafir talepleri..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
              >
                Vazgeç
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Kaydet & Güncelle</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
