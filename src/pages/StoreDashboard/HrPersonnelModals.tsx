import React, { useState } from "react";
import {
  X,
  MapPin,
  Copy,
  Check,
  KeyRound,
  Upload,
  Printer,
  FileText,
  Download,
  RefreshCw,
  Send,
  Crosshair,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { DomainId } from "../../utils/sectorCapability";
import { getSectorDocumentTypes, printAssetCustodyReceipt } from "../../utils/hrPrintHelpers";

function getAuthHeaders(extra?: Record<string, string>) {
  const token = localStorage.getItem("token");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra || {}),
  };
}

// ============================================================================
// 1. EMPLOYEE CREATE / EDIT MODAL
// ============================================================================
export function EmployeeFormModal({
  storeId,
  branches,
  users,
  employee,
  onClose,
  onSaved,
}: {
  storeId: number;
  branches: any[];
  users: any[];
  employee?: any | null;
  onClose: () => void;
  onSaved: (generatedPin?: string, empName?: string, empPhone?: string) => void;
}) {
  const isEdit = Boolean(employee?.id);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: employee?.full_name || "",
    phone: employee?.phone || "",
    pin: "",
    tc_no: employee?.tc_no || "",
    email: employee?.email || "",
    branch_id: employee?.branch_id ? String(employee.branch_id) : String(storeId),
    user_id: employee?.user_id ? String(employee.user_id) : "",
    role_title: employee?.role_title || "Personel",
    department: employee?.department || "Genel",
    employment_type: employee?.employment_type || "full_time",
    start_date: employee?.start_date ? String(employee.start_date).slice(0, 10) : new Date().toISOString().slice(0, 10),
    status: employee?.status || "active",
    shift_start: employee?.shift_start || "09:00",
    shift_end: employee?.shift_end || "18:00",
    late_tolerance_min: String(employee?.late_tolerance_min ?? 15),
    base_salary: employee?.base_salary ? String(employee.base_salary) : "",
    salary_currency: employee?.salary_currency || "TRY",
    meal_allowance: employee?.meal_allowance ? String(employee.meal_allowance) : "",
    transport_allowance: employee?.transport_allowance ? String(employee.transport_allowance) : "",
    annual_leave_override: employee?.annual_leave_override !== null && employee?.annual_leave_override !== undefined ? String(employee.annual_leave_override) : "",
    iban: employee?.iban || "",
    blood_type: employee?.blood_type || "",
    emergency_contact_name: employee?.emergency_contact_name || "",
    emergency_contact_phone: employee?.emergency_contact_phone || "",
    notes: employee?.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.phone.trim()) {
      toast.error("Ad Soyad ve telefon zorunludur.");
      return;
    }
    setSaving(true);
    try {
      const url = isEdit
        ? `/api/store/hr/employees/${employee.id}?storeId=${storeId}`
        : `/api/store/hr/employees?storeId=${storeId}`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kayıt başarısız.");
      toast.success(isEdit ? "Personel kartı güncellendi." : "Personel eklendi.");
      onSaved(data.generated_pin, data.employee?.full_name, data.employee?.phone);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {isEdit ? "Personel Kartını Düzenle" : "Yeni Personel Ekle"}
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 space-y-3 text-xs">
          {/* Row 1: Identity & PIN (Bounded widths) */}
          <div className="flex flex-wrap gap-2.5">
            <div className="flex-1 min-w-[180px]">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Ad Soyad *</label>
              <input
                type="text"
                required
                value={form.full_name}
                onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                placeholder="Örn: Mehmet Demir"
                className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="w-40">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Telefon *</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="05XX XXX XX XX"
                className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 tabular-nums"
              />
            </div>
            <div className="w-28">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                {isEdit ? "Yeni PIN" : "4 Haneli PIN"}
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={form.pin}
                onChange={(e) => setForm((p) => ({ ...p, pin: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                placeholder={isEdit ? "Değişmez" : "Otomatik"}
                className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 tabular-nums"
              />
            </div>
          </div>

          {/* Row 2: Branch/Warehouse, Role, Department, Status */}
          <div className="flex flex-wrap gap-2.5">
            <div className="flex-1 min-w-[160px]">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Mağaza / Şube / Depo</label>
              <select
                value={form.branch_id}
                onChange={(e) => setForm((p) => ({ ...p, branch_id: e.target.value }))}
                className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                {branches.map((b) => (
                  <option key={b.branch_id || b.id} value={b.branch_id || b.id}>
                    {b.label || b.name} ({b.branch_type === "WAREHOUSE" ? "Depo" : "Mağaza"})
                  </option>
                ))}
              </select>
            </div>
            <div className="w-40">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Görev / Unvan</label>
              <input
                type="text"
                value={form.role_title}
                onChange={(e) => setForm((p) => ({ ...p, role_title: e.target.value }))}
                placeholder="Kasiyer, Depocu..."
                className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="w-32">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Departman</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                placeholder="Satış, Depo..."
                className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="w-28">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Durum</label>
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="active">Aktif</option>
                <option value="inactive">İşten Ayrıldı</option>
              </select>
            </div>
          </div>

          {/* Row 3: Shift & Start Date */}
          <div className="flex flex-wrap gap-2.5">
            <div className="w-36">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">İşe Giriş Tarihi</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 tabular-nums"
              />
            </div>
            <div className="w-28">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Vardiya Giriş</label>
              <input
                type="time"
                value={form.shift_start}
                onChange={(e) => setForm((p) => ({ ...p, shift_start: e.target.value }))}
                className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 tabular-nums"
              />
            </div>
            <div className="w-28">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Vardiya Çıkış</label>
              <input
                type="time"
                value={form.shift_end}
                onChange={(e) => setForm((p) => ({ ...p, shift_end: e.target.value }))}
                className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 tabular-nums"
              />
            </div>
            <div className="w-24">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Tolerans (dk)</label>
              <input
                type="number"
                min="0"
                max="120"
                value={form.late_tolerance_min}
                onChange={(e) => setForm((p) => ({ ...p, late_tolerance_min: e.target.value }))}
                className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 tabular-nums"
              />
            </div>
            <div className="w-24">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Yıllık İzin (gün)</label>
              <input
                type="number"
                min="0"
                max="60"
                placeholder="Oto"
                value={form.annual_leave_override}
                onChange={(e) => setForm((p) => ({ ...p, annual_leave_override: e.target.value }))}
                className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 tabular-nums"
              />
            </div>
          </div>

          {/* Row 4: Salary + Currency (Integrated group), Meal, Transport */}
          <div className="flex flex-wrap gap-2.5 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="w-48">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Aylık Net Maaş</label>
              <div className="flex">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.base_salary}
                  onChange={(e) => setForm((p) => ({ ...p, base_salary: e.target.value }))}
                  placeholder="0"
                  className="flex-1 min-w-0 h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-r-0 border-slate-200 dark:border-slate-700 rounded-l-lg text-slate-900 dark:text-slate-100 tabular-nums"
                />
                <select
                  value={form.salary_currency}
                  onChange={(e) => setForm((p) => ({ ...p, salary_currency: e.target.value }))}
                  className="w-18 h-9 px-1.5 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-r-lg text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="TRY">TRY</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
            <div className="w-28">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Yemek Desteği</label>
              <input
                type="number"
                min="0"
                value={form.meal_allowance}
                onChange={(e) => setForm((p) => ({ ...p, meal_allowance: e.target.value }))}
                placeholder="0"
                className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 tabular-nums"
              />
            </div>
            <div className="w-28">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Yol Desteği</label>
              <input
                type="number"
                min="0"
                value={form.transport_allowance}
                onChange={(e) => setForm((p) => ({ ...p, transport_allowance: e.target.value }))}
                placeholder="0"
                className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 tabular-nums"
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">IBAN</label>
              <input
                type="text"
                value={form.iban}
                onChange={(e) => setForm((p) => ({ ...p, iban: e.target.value }))}
                placeholder="TR00 0000 ..."
                className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Row 5: Legal & Emergency */}
          <div className="flex flex-wrap gap-2.5 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="w-36">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">TCKN / Pasaport</label>
              <input
                type="text"
                value={form.tc_no}
                onChange={(e) => setForm((p) => ({ ...p, tc_no: e.target.value }))}
                className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 tabular-nums"
              />
            </div>
            <div className="w-24">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Kan Grubu</label>
              <input
                type="text"
                value={form.blood_type}
                onChange={(e) => setForm((p) => ({ ...p, blood_type: e.target.value }))}
                placeholder="A Rh+"
                className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Acil Durum Kişisi</label>
              <input
                type="text"
                value={form.emergency_contact_name}
                onChange={(e) => setForm((p) => ({ ...p, emergency_contact_name: e.target.value }))}
                className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="w-36">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Acil Telefon</label>
              <input
                type="tel"
                value={form.emergency_contact_phone}
                onChange={(e) => setForm((p) => ({ ...p, emergency_contact_phone: e.target.value }))}
                className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 tabular-nums"
              />
            </div>
          </div>

          {/* Optional ERP User Link */}
          {users.length > 0 && (
            <div className="flex flex-wrap gap-2.5 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Panel Kullanıcısı Eşleştir (İsteğe Bağlı)
                </label>
                <select
                  value={form.user_id}
                  onChange={(e) => setForm((p) => ({ ...p, user_id: e.target.value }))}
                  className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  <option value="">— Panel hesabı yok (Sadece mobil self-servis) —</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name || u.name || u.username || u.email} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
              İptal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white font-medium hover:opacity-90 disabled:opacity-60 cursor-pointer"
            >
              {saving ? "Kaydediliyor..." : isEdit ? "Değişiklikleri Kaydet" : "Personeli Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// 2. CHECKPOINT GPS SETTINGS MODAL
// ============================================================================
export function CheckpointGpsModal({
  storeId,
  checkpoint,
  onClose,
  onSaved,
}: {
  storeId: number;
  checkpoint: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [form, setForm] = useState({
    label: checkpoint.label || "",
    latitude: checkpoint.latitude !== null && checkpoint.latitude !== undefined ? String(checkpoint.latitude) : "",
    longitude: checkpoint.longitude !== null && checkpoint.longitude !== undefined ? String(checkpoint.longitude) : "",
    radius_meters: String(checkpoint.radius_meters || 150),
    strict_gps: checkpoint.strict_gps !== false,
    work_start: checkpoint.work_start || "09:00",
    work_end: checkpoint.work_end || "18:00",
    late_tolerance_min: String(checkpoint.late_tolerance_min ?? 15),
  });

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Tarayıcınız konum servisini desteklemiyor.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((p) => ({
          ...p,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setLocating(false);
        toast.success("Mevcut GPS koordinatı alındı.");
      },
      () => {
        setLocating(false);
        toast.error("Konum alınamadı. Tarayıcı konum iznini kontrol edin.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/store/hr/checkpoints/${checkpoint.branch_id}?storeId=${storeId}`, {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Güncellenemedi.");
      toast.success("Lokasyon GPS & vardiya ayarları kaydedildi.");
      onSaved();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Lokasyon GPS & QR Ayarı
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
          <div>
            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Lokasyon Adı</label>
            <input
              type="text"
              required
              value={form.label}
              onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
              className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">GPS Koordinatları</span>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={locating}
              className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Crosshair className={`w-3.5 h-3.5 ${locating ? "animate-spin" : ""}`} />
              <span>{locating ? "Alınıyor..." : "Mevcut Konumumu Al"}</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 block mb-0.5">Enlem (Lat)</label>
              <input
                type="text"
                value={form.latitude}
                onChange={(e) => setForm((p) => ({ ...p, latitude: e.target.value }))}
                placeholder="41.0082"
                className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg tabular-nums text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block mb-0.5">Boylam (Lng)</label>
              <input
                type="text"
                value={form.longitude}
                onChange={(e) => setForm((p) => ({ ...p, longitude: e.target.value }))}
                placeholder="28.9784"
                className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg tabular-nums text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block mb-0.5">Yarıçap (m)</label>
              <input
                type="number"
                min="30"
                max="5000"
                value={form.radius_meters}
                onChange={(e) => setForm((p) => ({ ...p, radius_meters: e.target.value }))}
                className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg tabular-nums text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 py-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.strict_gps}
              onChange={(e) => setForm((p) => ({ ...p, strict_gps: e.target.checked }))}
              className="rounded border-slate-300"
            />
            <span className="text-slate-700 dark:text-slate-300">
              Yarıçap dışından giriş-çıkışı engelle (Suiistimal koruması)
            </span>
          </label>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="text-[10px] text-slate-500 block mb-0.5">Varsayılan Giriş</label>
              <input
                type="time"
                value={form.work_start}
                onChange={(e) => setForm((p) => ({ ...p, work_start: e.target.value }))}
                className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg tabular-nums text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block mb-0.5">Varsayılan Çıkış</label>
              <input
                type="time"
                value={form.work_end}
                onChange={(e) => setForm((p) => ({ ...p, work_end: e.target.value }))}
                className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg tabular-nums text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block mb-0.5">Tolerans (dk)</label>
              <input
                type="number"
                min="0"
                max="120"
                value={form.late_tolerance_min}
                onChange={(e) => setForm((p) => ({ ...p, late_tolerance_min: e.target.value }))}
                className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg tabular-nums text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
              İptal
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white font-medium cursor-pointer">
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// 3. PAYROLL / ADVANCE PAYMENT MODAL (BIDIRECTIONAL FINANCE SYNC)
// ============================================================================
export function PayrollPaymentModal({
  storeId,
  employees,
  accounts,
  period,
  prefill,
  onClose,
  onSaved,
}: {
  storeId: number;
  employees: any[];
  accounts: any[];
  period: string;
  prefill?: {
    employee_id?: number;
    item_type?: string;
    amount?: number;
    currency?: string;
    pending_ledger_id?: number;
    title?: string;
  } | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    employee_id: prefill?.employee_id ? String(prefill.employee_id) : (employees[0]?.id ? String(employees[0].id) : ""),
    item_type: prefill?.item_type || "salary",
    amount: prefill?.amount ? String(prefill.amount) : "",
    currency: prefill?.currency || "TRY",
    period_month: period,
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: "bank_transfer",
    account_id: "",
    account_name: "",
    reference_no: "",
    description: "",
    sync_to_finance: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const selectedAcc = accounts.find((a) => String(a.id) === String(form.account_id));
      const accName = selectedAcc
        ? selectedAcc.account_name
        : form.payment_method === "cash"
        ? `${form.currency} Nakit Kasa`
        : "";

      if (prefill?.pending_ledger_id) {
        const res = await fetch(`/api/store/hr/payroll/ledger/${prefill.pending_ledger_id}/status?storeId=${storeId}`, {
          method: "PUT",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            status: "paid",
            payment_method: form.payment_method,
            account_id: form.account_id ? Number(form.account_id) : null,
            account_name: accName,
            sync_to_finance: form.sync_to_finance,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Onaylanamadı.");
        toast.success("Avans talebi onaylandı ve finans giderine işlendi.");
      } else {
        const res = await fetch(`/api/store/hr/payroll/ledger?storeId=${storeId}`, {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            ...form,
            account_id: form.account_id ? Number(form.account_id) : null,
            account_name: accName,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Ödeme kaydedilemedi.");
        toast.success(
          data.synced_to_finance
            ? "Ödeme kaydedildi ve Gelir & Gider / Kasa'ya otomatik işlendi."
            : "Bordro hareketi kaydedildi."
        );
      }
      onSaved();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {prefill?.pending_ledger_id ? "Avans Talebini Onayla & Öde" : "Maaş / Avans / SGK Ödemesi"}
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
          <div className="flex flex-wrap gap-2.5">
            <div className="flex-1 min-w-[180px]">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Personel *</label>
              <select
                required
                disabled={Boolean(prefill?.pending_ledger_id)}
                value={form.employee_id}
                onChange={(e) => {
                  const emp = employees.find((x) => String(x.id) === e.target.value);
                  setForm((p) => ({
                    ...p,
                    employee_id: e.target.value,
                    currency: emp?.salary_currency || p.currency,
                  }));
                }}
                className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.role_title})</option>
                ))}
              </select>
            </div>
            <div className="w-36">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Ödeme Türü</label>
              <select
                disabled={Boolean(prefill?.pending_ledger_id)}
                value={form.item_type}
                onChange={(e) => setForm((p) => ({ ...p, item_type: e.target.value }))}
                className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="salary">Maaş</option>
                <option value="advance">Avans</option>
                <option value="bonus">Prim / İkramiye</option>
                <option value="sgk">SGK & Vergi</option>
                <option value="meal_transport">Yol & Yemek</option>
                <option value="overtime">Fazla Mesai</option>
                <option value="deduction">Kesinti (Gidere yazılmaz)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <div className="w-44">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Tutar *</label>
              <div className="flex">
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  disabled={Boolean(prefill?.pending_ledger_id)}
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                  className="flex-1 min-w-0 h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-r-0 border-slate-200 dark:border-slate-700 rounded-l-lg text-slate-900 dark:text-slate-100 tabular-nums font-semibold"
                />
                <select
                  disabled={Boolean(prefill?.pending_ledger_id)}
                  value={form.currency}
                  onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
                  className="w-16 h-9 px-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-r-lg text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="TRY">TRY</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
            <div className="w-36">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Ödeme Tarihi</label>
              <input
                type="date"
                value={form.payment_date}
                onChange={(e) => setForm((p) => ({ ...p, payment_date: e.target.value }))}
                className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 tabular-nums"
              />
            </div>
            <div className="w-36">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Ödeme Yöntemi</label>
              <select
                value={form.payment_method}
                onChange={(e) => setForm((p) => ({ ...p, payment_method: e.target.value, account_id: "" }))}
                className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="bank_transfer">Banka Havale / EFT</option>
                <option value="cash">Nakit Kasa</option>
                <option value="credit_card">Kredi Kartı</option>
              </select>
            </div>
          </div>

          {accounts.length > 0 && form.item_type !== "deduction" && (
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Kasa / Banka Hesabı</label>
              <select
                value={form.account_id}
                onChange={(e) => setForm((p) => ({ ...p, account_id: e.target.value }))}
                className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="">— Varsayılan {form.payment_method === "cash" ? `${form.currency} Nakit Kasa` : "Banka Hesabı"} —</option>
                {accounts
                  .filter((a) =>
                    form.payment_method === "cash"
                      ? a.account_type === "cash"
                      : form.payment_method === "credit_card"
                      ? a.account_type === "credit_card"
                      : a.account_type === "bank"
                  )
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_name} ({acc.currency})
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Açıklama</label>
            <input
              type="text"
              placeholder="Dekont no veya kısa not..."
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          {form.item_type !== "deduction" && (
            <label className="flex items-center gap-2 py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.sync_to_finance}
                onChange={(e) => setForm((p) => ({ ...p, sync_to_finance: e.target.checked }))}
                className="rounded border-slate-300"
              />
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                Gelir & Gider / Kasa modülüne otomatik gider olarak işle
              </span>
            </label>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
              İptal
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white font-medium cursor-pointer">
              {saving ? "İşleniyor..." : "Ödemeyi Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// 4. DOCUMENT UPLOAD MODAL (SECTOR-AWARE PRESETS)
// ============================================================================
export function DocumentUploadModal({
  storeId,
  employees,
  domainId,
  defaultEmployeeId,
  onClose,
  onSaved,
}: {
  storeId: number;
  employees: any[];
  domainId?: DomainId;
  defaultEmployeeId?: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const presets = getSectorDocumentTypes(domainId);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    employee_id: defaultEmployeeId ? String(defaultEmployeeId) : (employees[0]?.id ? String(employees[0].id) : ""),
    doc_type: presets[0]?.id || "id_card",
    title: presets[0]?.label || "Kimlik Fotokopisi",
    issue_date: "",
    expiry_date: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("employee_id", form.employee_id);
      fd.append("doc_type", form.doc_type);
      fd.append("title", form.title);
      if (form.issue_date) fd.append("issue_date", form.issue_date);
      if (form.expiry_date) fd.append("expiry_date", form.expiry_date);
      if (form.notes) fd.append("notes", form.notes);
      if (file) fd.append("file", file);

      const res = await fetch(`/api/store/hr/documents?storeId=${storeId}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Belge kaydedilemedi.");
      toast.success("Özlük belgesi kaydedildi.");
      onSaved();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Özlük Belgesi Ekle</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
          <div>
            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Personel *</label>
            <select
              required
              value={form.employee_id}
              onChange={(e) => setForm((p) => ({ ...p, employee_id: e.target.value }))}
              className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.full_name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Belge Türü</label>
              <select
                value={form.doc_type}
                onChange={(e) => {
                  const found = presets.find((x) => x.id === e.target.value);
                  setForm((p) => ({ ...p, doc_type: e.target.value, title: found ? found.label : p.title }));
                }}
                className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                {presets.map((pr) => (
                  <option key={pr.id} value={pr.id}>{pr.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Belge Başlığı *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Düzenleme Tarihi</label>
              <input
                type="date"
                value={form.issue_date}
                onChange={(e) => setForm((p) => ({ ...p, issue_date: e.target.value }))}
                className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg tabular-nums text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Geçerlilik Bitiş (Uyarı için)</label>
              <input
                type="date"
                value={form.expiry_date}
                onChange={(e) => setForm((p) => ({ ...p, expiry_date: e.target.value }))}
                className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg tabular-nums text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Dosya (PDF, JPG, PNG · Maks. 10 MB)</label>
            <label className="flex items-center justify-center gap-2 h-11 px-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:border-slate-500">
              <Upload className="w-4 h-4 text-slate-500" />
              <span className="truncate text-slate-700 dark:text-slate-300">
                {file ? file.name : "Dosya seçin (isteğe bağlı)"}
              </span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
              İptal
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white font-medium cursor-pointer">
              {saving ? "Yükleniyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// 5. EMPLOYEE 360-DEGREE DETAIL DRAWER
// ============================================================================
export function EmployeeDetailDrawer({
  storeId,
  storeName,
  portalBaseUrl,
  employeeId,
  onClose,
  onEdit,
  onRefreshParent,
}: {
  storeId: number;
  storeName: string;
  portalBaseUrl: string;
  employeeId: number;
  onClose: () => void;
  onEdit: (emp: any) => void;
  onRefreshParent: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [resetPinResult, setResetPinResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/store/hr/employees/${employeeId}/detail?storeId=${storeId}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Detay yüklenemedi.");
      setDetail(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadDetail();
  }, [employeeId, storeId]);

  const handleResetPin = async () => {
    try {
      const res = await fetch(`/api/store/hr/employees/${employeeId}/reset-pin?storeId=${storeId}`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "PIN sıfırlanamadı.");
      setResetPinResult(data.pin);
      toast.success(`Yeni 4 haneli PIN oluşturuldu: ${data.pin}`);
      onRefreshParent();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDownloadDoc = async (docId: number, fileName: string) => {
    try {
      const res = await fetch(`/api/store/hr/documents/${docId}/download?storeId=${storeId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Dosya indirilemedi.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || `belge-${docId}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const copyInviteText = () => {
    if (!detail?.employee) return;
    const text = `${storeName} Personel Giriş Portalı\nLink: ${portalBaseUrl}\nTelefon: ${detail.employee.phone}${resetPinResult ? `\nPIN: ${resetPinResult}` : ""}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Personel giriş bilgileri kopyalandı.");
    setTimeout(() => setCopied(false), 2000);
  };

  const emp = detail?.employee;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {emp?.full_name || "Personel Kartı"}
            </h3>
            {emp && (
              <p className="text-[11px] text-slate-500 truncate">
                {emp.role_title} · {emp.branch_name || "Merkez"} · {emp.phone}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {emp && (
              <button
                type="button"
                onClick={() => onEdit(emp)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Düzenle
              </button>
            )}
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading || !detail ? (
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
            {/* Self-Service PIN & Portal Access */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-100">Mobil Self-Servis Erişimi</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleResetPin}
                    className="px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Yeni PIN Üret</span>
                  </button>
                  <button
                    type="button"
                    onClick={copyInviteText}
                    className="px-2.5 py-1 rounded-md bg-slate-900 dark:bg-indigo-600 text-white font-medium flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Bilgi Kopyala</span>
                  </button>
                </div>
              </div>
              {resetPinResult && (
                <p className="text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">
                  Yeni PIN: {resetPinResult} (Sadece bir kez gösterilir — personelle paylaşın)
                </p>
              )}
              <p className="text-[11px] text-slate-500 font-mono truncate">{portalBaseUrl}</p>
            </div>

            {/* Key Summary Numbers */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <p className="text-[11px] text-slate-500">Aylık Net Maaş</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
                  {Number(emp.base_salary || 0).toLocaleString("tr-TR")} {emp.salary_currency}
                </p>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <p className="text-[11px] text-slate-500">Kalan Yıllık İzin</p>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">
                  {detail.leave_balance.remaining_days} / {detail.leave_balance.entitled_days} gün
                </p>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <p className="text-[11px] text-slate-500">Vardiya</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
                  {emp.shift_start} – {emp.shift_end}
                </p>
              </div>
            </div>

            {/* Dossier Documents */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Özlük Belgeleri ({detail.documents.length})</span>
              </h4>
              {detail.documents.length === 0 ? (
                <p className="text-slate-500">Yüklenmiş özlük belgesi yok.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
                  {detail.documents.map((d: any) => (
                    <div key={d.id} className="px-3 py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{d.title}</p>
                        <p className="text-[11px] text-slate-500 tabular-nums">
                          {d.expiry_date ? `Geçerlilik: ${new Date(d.expiry_date).toLocaleDateString("tr-TR")}` : "Süresiz"}
                        </p>
                      </div>
                      {d.stored_path && (
                        <button
                          type="button"
                          onClick={() => handleDownloadDoc(d.id, d.file_name)}
                          className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>İndir</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assigned Assets + Print Custody Form */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-slate-500" />
                  <span>Zimmetli Demirbaşlar ({detail.assets.length})</span>
                </h4>
                {detail.assets.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      printAssetCustodyReceipt({
                        storeName,
                        employeeName: emp.full_name,
                        employeeRole: emp.role_title,
                        employeeTc: emp.tc_no,
                        employeePhone: emp.phone,
                        assets: detail.assets,
                      })
                    }
                    className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Zimmet Tutanağı Yazdır</span>
                  </button>
                )}
              </div>
              {detail.assets.length === 0 ? (
                <p className="text-slate-500">Zimmetli demirbaş bulunmuyor.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
                  {detail.assets.map((a: any) => (
                    <div key={a.id} className="px-3 py-2 flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{a.asset_name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{a.serial_no || "Seri no yok"}</p>
                      </div>
                      <span className={`text-[11px] font-medium ${a.status === "assigned" ? "text-emerald-700" : "text-slate-500"}`}>
                        {a.status === "assigned" ? "Zimmetli" : "İade Edildi"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Payroll / Advances */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">Son Maaş & Avans Hareketleri</h4>
              {detail.payroll.length === 0 ? (
                <p className="text-slate-500">Ödeme kaydı bulunmuyor.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
                  {detail.payroll.slice(0, 8).map((p: any) => (
                    <div key={p.id} className="px-3 py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{p.title}</p>
                        <p className="text-[11px] text-slate-500 tabular-nums">{p.period_month}</p>
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums shrink-0">
                        {Number(p.amount || 0).toLocaleString("tr-TR")} {p.currency}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
