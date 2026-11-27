import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Users,
  QrCode,
  MapPin,
  Wallet,
  Calendar,
  FileText,
  Plus,
  Search,
  Printer,
  RefreshCw,
  Check,
  X,
  Copy,
  Download,
  Trash2,
  Clock,
  FileSpreadsheet,
  KeyRound,
  Package,
  AlertTriangle,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { DomainId, resolveDomainId } from "../../utils/sectorCapability";
import { printCheckpointQrPoster, printAssetCustodyReceipt } from "../../utils/hrPrintHelpers";
import {
  EmployeeFormModal,
  CheckpointGpsModal,
  PayrollPaymentModal,
  DocumentUploadModal,
  EmployeeDetailDrawer,
} from "./HrPersonnelModals";

type HrSubTab = "attendance" | "employees" | "payroll" | "leaves" | "dossier";

const PAYROLL_LABELS: Record<string, string> = {
  salary: "Maaş",
  advance: "Avans",
  bonus: "Prim",
  sgk: "SGK",
  meal_transport: "Yol / Yemek",
  overtime: "Mesai",
  deduction: "Kesinti",
};

const LEAVE_LABELS: Record<string, string> = {
  annual: "Yıllık İzin",
  sick: "Hastalık / Rapor",
  excuse: "Mazeret İzni",
  unpaid: "Ücretsiz İzin",
  parental: "Doğum / Babalık",
};

const ASSET_CATEGORIES: Record<string, string> = {
  phone: "Telefon / Hat",
  pos: "POS / El Terminali",
  key: "Anahtar / Kart",
  vehicle: "Araç / Motor",
  computer: "Bilgisayar / Tablet",
  uniform: "Üniforma / Ekipman",
  other: "Diğer",
};

function getAuthHeaders(extra?: Record<string, string>) {
  const token = localStorage.getItem("token");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra || {}),
  };
}

function fmtTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(val?: string | null) {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val).slice(0, 10);
  return d.toLocaleDateString("tr-TR");
}

function fmtHours(mins?: number | null) {
  const m = Math.max(0, Number(mins || 0));
  if (m === 0) return "—";
  return `${Math.floor(m / 60)} sa ${m % 60} dk`;
}

export default function HrPersonnelTab({
  storeId,
  branding,
  users = [],
  domainId,
}: {
  storeId: number;
  branding?: any;
  users?: any[];
  domainId?: DomainId;
}) {
  const resolvedDomain: DomainId = domainId || resolveDomainId(branding);
  const storeName = branding?.store_name || branding?.name || "İşletme";

  const [subTab, setSubTab] = useState<HrSubTab>("attendance");
  const [loading, setLoading] = useState(true);

  // Core HR data states
  const [overview, setOverview] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [payrollData, setPayrollData] = useState<any>(null);
  const [leavesData, setLeavesData] = useState<{ leaves: any[]; balances: any[] }>({ leaves: [], balances: [] });
  const [documents, setDocuments] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [attendanceMode, setAttendanceMode] = useState<"day" | "month">("day");
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [leaveSubView, setLeaveSubView] = useState<"requests" | "balances">("requests");
  const [dossierSubView, setDossierSubView] = useState<"documents" | "assets">("documents");

  // Modals & Drawers
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [pinBanner, setPinBanner] = useState<{ name: string; phone: string; pin: string } | null>(null);
  const [detailEmployeeId, setDetailEmployeeId] = useState<number | null>(null);
  const [editingCheckpoint, setEditingCheckpoint] = useState<any | null>(null);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [payrollPrefill, setPayrollPrefill] = useState<any | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);

  // Inline quick modals (Manual attendance, Leave create, Asset create)
  const [showManualAttModal, setShowManualAttModal] = useState(false);
  const [manualAttForm, setManualAttForm] = useState({
    employee_id: "",
    work_date: new Date().toISOString().slice(0, 10),
    check_in_time: "09:00",
    check_out_time: "18:00",
    break_minutes: "60",
    notes: "",
  });

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    employee_id: "",
    leave_type: "annual",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
    reason: "",
  });

  const [showAssetModal, setShowAssetModal] = useState(false);
  const [assetForm, setAssetForm] = useState({
    employee_id: "",
    asset_name: "",
    category: "phone",
    serial_no: "",
    assigned_date: new Date().toISOString().slice(0, 10),
    condition_note: "",
  });

  // Hidden QR SVG refs for printing crisp A4 posters
  const qrContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const storeSlug = overview?.store_slug || branding?.slug || "";
  const portalBaseUrl = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return storeSlug ? `${origin}/personel/${storeSlug}` : `${origin}/personel`;
  }, [storeSlug]);

  const fetchOverviewAndEmployees = useCallback(async () => {
    if (!storeId) return;
    try {
      const [ovRes, empRes] = await Promise.all([
        fetch(`/api/store/hr/overview?storeId=${storeId}`, { headers: getAuthHeaders() }),
        fetch(`/api/store/hr/employees?storeId=${storeId}`, { headers: getAuthHeaders() }),
      ]);
      if (ovRes.ok) setOverview(await ovRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
    } catch (err) {
      console.error("HR overview load error:", err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const fetchAttendance = useCallback(async () => {
    if (!storeId) return;
    const qs = new URLSearchParams({ storeId: String(storeId) });
    if (attendanceMode === "day") qs.set("date", attendanceDate);
    else qs.set("month", selectedMonth);
    if (branchFilter !== "all") qs.set("branch_id", branchFilter);
    const res = await fetch(`/api/store/hr/attendance?${qs.toString()}`, { headers: getAuthHeaders() });
    if (res.ok) setAttendanceLogs(await res.json());
  }, [storeId, attendanceMode, attendanceDate, selectedMonth, branchFilter]);

  const fetchPayroll = useCallback(async () => {
    if (!storeId) return;
    const res = await fetch(`/api/store/hr/payroll?storeId=${storeId}&period=${selectedMonth}`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) setPayrollData(await res.json());
  }, [storeId, selectedMonth]);

  const fetchLeaves = useCallback(async () => {
    if (!storeId) return;
    const res = await fetch(`/api/store/hr/leaves?storeId=${storeId}`, { headers: getAuthHeaders() });
    if (res.ok) setLeavesData(await res.json());
  }, [storeId]);

  const fetchDossier = useCallback(async () => {
    if (!storeId) return;
    const [dRes, aRes] = await Promise.all([
      fetch(`/api/store/hr/documents?storeId=${storeId}`, { headers: getAuthHeaders() }),
      fetch(`/api/store/hr/assets?storeId=${storeId}`, { headers: getAuthHeaders() }),
    ]);
    if (dRes.ok) setDocuments(await dRes.json());
    if (aRes.ok) setAssets(await aRes.json());
  }, [storeId]);

  useEffect(() => {
    fetchOverviewAndEmployees();
  }, [fetchOverviewAndEmployees]);

  useEffect(() => {
    if (subTab === "attendance") fetchAttendance();
    else if (subTab === "payroll") fetchPayroll();
    else if (subTab === "leaves") fetchLeaves();
    else if (subTab === "dossier") fetchDossier();
  }, [subTab, fetchAttendance, fetchPayroll, fetchLeaves, fetchDossier]);

  const checkpoints: any[] = overview?.checkpoints || [];
  const activeEmployees = useMemo(() => employees.filter((e) => e.status === "active"), [employees]);

  const filteredEmployees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return employees.filter((e) => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (branchFilter !== "all" && String(e.branch_id) !== branchFilter) return false;
      if (q && !`${e.full_name} ${e.phone} ${e.role_title} ${e.department}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [employees, statusFilter, branchFilter, searchQuery]);

  const handlePrintQr = (cp: any) => {
    const svgEl = qrContainerRefs.current[cp.qr_token]?.querySelector("svg");
    const svgMarkup = svgEl ? svgEl.outerHTML : "";
    const doorUrl = `${portalBaseUrl}?token=${encodeURIComponent(cp.qr_token)}`;
    printCheckpointQrPoster({
      storeName,
      checkpointLabel: cp.label,
      branchType: cp.branch_type || "STORE",
      portalUrl: doorUrl,
      qrSvgMarkup: svgMarkup,
      radiusMeters: cp.radius_meters || 150,
      hasGps: cp.latitude !== null && cp.longitude !== null,
      workStart: cp.work_start,
      workEnd: cp.work_end,
    });
  };

  const handleRotateQr = async (cp: any) => {
    const res = await fetch(`/api/store/hr/checkpoints/${cp.branch_id}/rotate-qr?storeId=${storeId}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      toast.success(`${cp.label} için yeni kapı QR kodu üretildi. Yeni afişi yazdırın.`);
      fetchOverviewAndEmployees();
    } else {
      toast.error("QR yenilenemedi.");
    }
  };

  const handleExportAttendanceExcel = () => {
    const rows = attendanceLogs.map((a) => ({
      Tarih: fmtDate(a.work_date),
      Personel: a.full_name,
      Lokasyon: a.checkpoint_label || a.branch_name || "Merkez",
      Giriş: fmtTime(a.check_in_at),
      Çıkış: fmtTime(a.check_out_at),
      "Çalışma (dk)": a.worked_minutes || 0,
      "Gecikme (dk)": a.late_minutes || 0,
      "Fazla Mesai (dk)": a.overtime_minutes || 0,
      "GPS Mesafe (m)": a.check_in_distance_m ?? "-",
      Doğrulama: a.verification_status,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Puantaj");
    XLSX.writeFile(wb, `puantaj_${attendanceMode === "day" ? attendanceDate : selectedMonth}.xlsx`);
  };

  const handleExportPayrollExcel = () => {
    const rows = (payrollData?.sheet || []).map((r: any) => ({
      Personel: r.full_name,
      Görev: r.role_title,
      Şube: r.branch_name,
      "Çalışılan Gün": r.worked_days,
      "Sabit Maaş": r.base_salary,
      "Yol+Yemek": r.meal_transport,
      "Verilen Avans": r.paid_advances,
      "Ödenen Maaş": r.paid_salary,
      "Ödenen Prim": r.paid_bonuses,
      "SGK": r.paid_sgk,
      "Ücretsiz İzin Kesintisi": r.unpaid_deduction,
      "Kalan Net Ödenecek": r.remaining_net_payable,
      "Para Birimi": r.currency,
      IBAN: r.iban,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bordro");
    XLSX.writeFile(wb, `bordro_${selectedMonth}.xlsx`);
  };

  const handleManualAttSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/store/hr/attendance/manual?storeId=${storeId}`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(manualAttForm),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || "Kayıt eklenemedi.");
    toast.success("Manuel puantaj kaydı eklendi.");
    setShowManualAttModal(false);
    fetchAttendance();
    fetchOverviewAndEmployees();
  };

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/store/hr/leaves?storeId=${storeId}`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ ...leaveForm, status: "approved" }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || "İzin kaydedilemedi.");
    toast.success("İzin kaydı oluşturuldu.");
    setShowLeaveModal(false);
    fetchLeaves();
    fetchOverviewAndEmployees();
  };

  const handleLeaveStatus = async (id: number, status: "approved" | "rejected") => {
    const res = await fetch(`/api/store/hr/leaves/${id}/status?storeId=${storeId}`, {
      method: "PUT",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success(status === "approved" ? "İzin onaylandı." : "İzin reddedildi.");
      fetchLeaves();
      fetchOverviewAndEmployees();
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/store/hr/assets?storeId=${storeId}`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(assetForm),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || "Zimmet eklenemedi.");
    toast.success("Zimmet kaydı oluşturuldu.");
    setShowAssetModal(false);
    setAssetForm((p) => ({ ...p, asset_name: "", serial_no: "", condition_note: "" }));
    fetchDossier();
    fetchOverviewAndEmployees();
  };

  const handleReturnAsset = async (assetId: number) => {
    const res = await fetch(`/api/store/hr/assets/${assetId}?storeId=${storeId}`, {
      method: "PUT",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ status: "returned" }),
    });
    if (res.ok) {
      toast.success("Zimmet iade alındı olarak işaretlendi.");
      fetchDossier();
      fetchOverviewAndEmployees();
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

  const kpis = overview?.kpis || {
    active_employees: 0,
    on_site_now: 0,
    late_today: 0,
    not_checked_in: 0,
    pending_leaves: 0,
    pending_advances: 0,
    expiring_documents: 0,
  };
  const totalPendingRequests = Number(kpis.pending_leaves || 0) + Number(kpis.pending_advances || 0);

  return (
    <div className="space-y-4">
      {/* Hidden QR SVGs for Crisp A4 Poster Printing */}
      <div className="hidden" aria-hidden="true">
        {checkpoints.map((cp) => (
          <div
            key={cp.qr_token}
            ref={(el) => {
              qrContainerRefs.current[cp.qr_token] = el;
            }}
          >
            <QRCodeSVG value={`${portalBaseUrl}?token=${encodeURIComponent(cp.qr_token)}`} size={320} level="M" />
          </div>
        ))}
      </div>

      {/* Single Unified Module Header (AGENTS.md Rule 12) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            Personel & İK
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Şube/depo kadrosu · QR+GPS puantaj · Maaş & avans bordrosu · İzin & özlük
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {storeSlug && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(portalBaseUrl);
                toast.success("Personel mobil giriş linki kopyalandı.");
              }}
              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Mobil Portal Linki</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setEditingEmployee(null);
              setShowEmployeeModal(true);
            }}
            className="h-9 px-3.5 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white text-xs font-medium hover:opacity-90 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Personel</span>
          </button>
        </div>
      </div>

      {/* One-time generated PIN notification banner */}
      {pinBanner && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="text-emerald-900 dark:text-emerald-200">
            <strong>{pinBanner.name}</strong> için mobil self-servis PIN: <span className="font-mono font-bold text-sm">{pinBanner.pin}</span>
            <span className="text-emerald-700 dark:text-emerald-400"> · Telefon: {pinBanner.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`${storeName} Personel Giriş\nLink: ${portalBaseUrl}\nTelefon: ${pinBanner.phone}\nPIN: ${pinBanner.pin}`);
                toast.success("Giriş bilgileri kopyalandı.");
              }}
              className="px-2.5 py-1 rounded-md bg-emerald-700 text-white font-medium cursor-pointer"
            >
              Bilgileri Kopyala
            </button>
            <button type="button" onClick={() => setPinBanner(null)} className="p-1 text-emerald-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4-Column Flat Hairline KPI Strip (Zero decorative pulsing dots, tabular numerals) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5">
          <p className="text-[11px] text-slate-500">Şu An İşyerinde</p>
          <p className="text-xl font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">
            {kpis.on_site_now} <span className="text-xs font-normal text-slate-500">/ {kpis.active_employees} aktif</span>
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5">
          <p className="text-[11px] text-slate-500">Bugün Geç / Girişsiz</p>
          <p className="text-xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
            <span className={kpis.late_today > 0 ? "text-amber-600" : ""}>{kpis.late_today} geç</span>
            <span className="text-slate-300 dark:text-slate-700 mx-1.5">·</span>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{kpis.not_checked_in} girişsiz</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSubTab(kpis.pending_advances > 0 ? "payroll" : "leaves")}
          className="text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer"
        >
          <p className="text-[11px] text-slate-500">Bekleyen Mobil Talepler</p>
          <p className={`text-xl font-semibold tabular-nums mt-0.5 ${totalPendingRequests > 0 ? "text-amber-600" : "text-slate-900 dark:text-slate-100"}`}>
            {totalPendingRequests} <span className="text-xs font-normal text-slate-500">({kpis.pending_leaves} izin · {kpis.pending_advances} avans)</span>
          </p>
        </button>
        <button
          type="button"
          onClick={() => setSubTab("dossier")}
          className="text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer"
        >
          <p className="text-[11px] text-slate-500">Belge Süresi Uyarısı (30 gün)</p>
          <p className={`text-xl font-semibold tabular-nums mt-0.5 ${kpis.expiring_documents > 0 ? "text-red-600" : "text-slate-900 dark:text-slate-100"}`}>
            {kpis.expiring_documents} <span className="text-xs font-normal text-slate-500">belge</span>
          </p>
        </button>
      </div>

      {/* 5-Tab Segmented Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto">
        {[
          { id: "attendance" as HrSubTab, label: "Canlı & Puantaj", icon: QrCode },
          { id: "employees" as HrSubTab, label: `Kadro (${kpis.active_employees})`, icon: Users },
          { id: "payroll" as HrSubTab, label: "Maaş & Avans", icon: Wallet, count: kpis.pending_advances },
          { id: "leaves" as HrSubTab, label: "İzinler", icon: Calendar, count: kpis.pending_leaves },
          { id: "dossier" as HrSubTab, label: "Özlük & Zimmet", icon: FileText, count: kpis.expiring_documents },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                active
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count ? <span className="text-[11px] font-semibold text-amber-600 tabular-nums">({tab.count})</span> : null}
            </button>
          );
        })}
      </div>

      {/* ==================== TAB 1: CANLI & PUANTAJ + QR CHECKPOINTS ==================== */}
      {subTab === "attendance" && (
        <div className="space-y-4">
          {/* Store & Warehouse QR / GPS Checkpoints */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Mağaza & Depo Giriş QR Kontrol Noktaları
                </h2>
                <p className="text-[11px] text-slate-500">
                  Her lokasyonun kapı QR afişini yazdırın ve GPS yarıçapını tanımlayın.
                </p>
              </div>
              {storeSlug && (
                <a
                  href={portalBaseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 whitespace-nowrap"
                >
                  <span>Mobil Portalı Aç</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {checkpoints.map((cp) => {
                const hasGps = cp.latitude !== null && cp.longitude !== null;
                return (
                  <div key={cp.branch_id} className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {cp.label}
                        <span className="text-slate-400 font-normal"> · {cp.branch_type === "WAREHOUSE" ? "Depo" : "Mağaza / Şube"}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 tabular-nums">
                        {hasGps ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                            GPS Tanımlı ({cp.radius_meters} m{cp.strict_gps ? " · Katı Kural" : ""})
                          </span>
                        ) : (
                          <span className="text-amber-600">GPS tanımlanmadı (yalnızca QR doğrulama)</span>
                        )}
                        <span> · Mesai: {cp.work_start || "09:00"}–{cp.work_end || "18:00"}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingCheckpoint(cp)}
                        className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Konum Ayarla</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrintQr(cp)}
                        className="h-8 px-2.5 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>QR Afişi Yazdır</span>
                      </button>
                      <button
                        type="button"
                        title="QR kodunu yenile"
                        onClick={() => handleRotateQr(cp)}
                        className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center justify-center cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live On-Site vs Not Checked In */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Şu An İşyerinde ({overview?.on_site_list?.length || 0})</h3>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400">Canlı</span>
              </div>
              {!overview?.on_site_list?.length ? (
                <p className="text-xs text-slate-500 py-3">Şu an aktif girişi bulunan personel yok.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-44 overflow-y-auto">
                  {overview.on_site_list.map((a: any) => (
                    <div key={a.id} className="py-1.5 flex items-center justify-between text-xs gap-2">
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {a.full_name} <span className="text-slate-400 font-normal">· {a.checkpoint_label || "Merkez"}</span>
                      </span>
                      <span className="tabular-nums text-slate-600 dark:text-slate-400 shrink-0">
                        {fmtTime(a.check_in_at)}
                        {a.break_started_at ? " · Molada" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Bugün Henüz Giriş Yapmayanlar ({overview?.not_checked_in_list?.length || 0})</h3>
              </div>
              {!overview?.not_checked_in_list?.length ? (
                <p className="text-xs text-slate-500 py-3">Tüm aktif personeller bugün giriş yaptı.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-44 overflow-y-auto">
                  {overview.not_checked_in_list.map((e: any) => (
                    <div key={e.id} className="py-1.5 flex items-center justify-between text-xs gap-2">
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {e.full_name} <span className="text-slate-400 font-normal">· {e.branch_name}</span>
                      </span>
                      <span className="tabular-nums text-slate-500 shrink-0">Vardiya {e.shift_start || "09:00"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Attendance Log Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setAttendanceMode("day")}
                    className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${attendanceMode === "day" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white" : "text-slate-500"}`}
                  >
                    Günlük
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceMode("month")}
                    className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${attendanceMode === "month" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white" : "text-slate-500"}`}
                  >
                    Aylık
                  </button>
                </div>
                {attendanceMode === "day" ? (
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="h-8 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg tabular-nums text-xs text-slate-900 dark:text-slate-100"
                  />
                ) : (
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="h-8 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg tabular-nums text-xs text-slate-900 dark:text-slate-100"
                  />
                )}
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="h-8 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="all">Tüm Şube / Depolar</option>
                  {checkpoints.map((cp) => (
                    <option key={cp.branch_id} value={cp.branch_id}>{cp.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setManualAttForm((p) => ({ ...p, employee_id: activeEmployees[0]?.id ? String(activeEmployees[0].id) : "" }));
                    setShowManualAttModal(true);
                  }}
                  className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Manuel Puantaj</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportAttendanceExcel}
                  className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-3 py-2 font-medium">Tarih</th>
                    <th className="px-3 py-2 font-medium">Personel</th>
                    <th className="px-3 py-2 font-medium">Lokasyon</th>
                    <th className="px-3 py-2 font-medium">Giriş / Çıkış</th>
                    <th className="px-3 py-2 font-medium text-right">Çalışma</th>
                    <th className="px-3 py-2 font-medium text-right">Gecikme / Mesai</th>
                    <th className="px-3 py-2 font-medium">Doğrulama</th>
                    <th className="px-3 py-2 font-medium text-right">Sil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {attendanceLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                        Seçili dönem için puantaj kaydı bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    attendanceLogs.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="px-3 py-2 tabular-nums text-slate-600 dark:text-slate-400">{fmtDate(a.work_date)}</td>
                        <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">
                          {a.full_name}
                          <span className="text-slate-400 font-normal"> · {a.role_title}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{a.checkpoint_label || a.branch_name || "Merkez"}</td>
                        <td className="px-3 py-2 tabular-nums font-medium text-slate-900 dark:text-slate-100">
                          {fmtTime(a.check_in_at)} – {fmtTime(a.check_out_at)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-700 dark:text-slate-300">{fmtHours(a.worked_minutes)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {Number(a.late_minutes || 0) > 0 && <span className="text-amber-600 font-medium">{a.late_minutes} dk geç</span>}
                          {Number(a.late_minutes || 0) > 0 && Number(a.overtime_minutes || 0) > 0 && " · "}
                          {Number(a.overtime_minutes || 0) > 0 && <span className="text-emerald-700 font-medium">+{a.overtime_minutes} dk mesai</span>}
                          {!a.late_minutes && !a.overtime_minutes && "—"}
                        </td>
                        <td className="px-3 py-2 text-[11px] tabular-nums">
                          {a.verification_status === "qr_gps_verified" ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-medium">QR+GPS ({a.check_in_distance_m ?? 0} m)</span>
                          ) : a.verification_status === "out_of_range" ? (
                            <span className="text-red-600 font-medium">Mesafe Dışı ({a.check_in_distance_m} m)</span>
                          ) : a.verification_status === "manual_admin" ? (
                            <span className="text-slate-500">Yönetici Manuel</span>
                          ) : (
                            <span className="text-slate-600 dark:text-slate-400">QR Doğrulandı</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={async () => {
                              const r = await fetch(`/api/store/hr/attendance/${a.id}?storeId=${storeId}`, {
                                method: "DELETE",
                                headers: getAuthHeaders(),
                              });
                              if (r.ok) {
                                toast.success("Puantaj silindi.");
                                fetchAttendance();
                                fetchOverviewAndEmployees();
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: KADRO (EMPLOYEES) ==================== */}
      {subTab === "employees" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ad, telefon, görev ara..."
                  className="w-full h-8 pl-8 pr-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="h-8 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="all">Tüm Şube / Depolar</option>
                {checkpoints.map((cp) => (
                  <option key={cp.branch_id} value={cp.branch_id}>{cp.label}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="active">Aktif Personel</option>
                <option value="inactive">İşten Ayrılanlar</option>
                <option value="all">Tümü</option>
              </select>
            </div>
            <span className="text-[11px] text-slate-500 tabular-nums">{filteredEmployees.length} kayıt</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-3 py-2 font-medium">Personel</th>
                  <th className="px-3 py-2 font-medium">Şube / Depo</th>
                  <th className="px-3 py-2 font-medium">Vardiya</th>
                  <th className="px-3 py-2 font-medium text-right">Aylık Maaş</th>
                  <th className="px-3 py-2 font-medium">İşe Giriş</th>
                  <th className="px-3 py-2 font-medium text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Yükleniyor...</td></tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center space-y-2">
                      <p className="text-slate-500">Henüz personel kaydı bulunmuyor.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEmployee(null);
                          setShowEmployeeModal(true);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium cursor-pointer"
                      >
                        İlk Personeli Ekle
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      onClick={() => setDetailEmployeeId(emp.id)}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer"
                    >
                      <td className="px-3 py-2">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{emp.full_name}</p>
                        <p className="text-[11px] text-slate-500 tabular-nums">
                          {emp.role_title} · {emp.phone}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                        {emp.branch_name || storeName}
                        <span className="text-slate-400"> · {emp.branch_type === "WAREHOUSE" ? "Depo" : "Mağaza"}</span>
                      </td>
                      <td className="px-3 py-2 tabular-nums text-slate-700 dark:text-slate-300">
                        {emp.shift_start} – {emp.shift_end}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                        {Number(emp.base_salary || 0).toLocaleString("tr-TR")} {emp.salary_currency || "TRY"}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-slate-600 dark:text-slate-400">
                        {fmtDate(emp.start_date)}
                      </td>
                      <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailEmployeeId(emp.id)}
                            className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            Dosya
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEmployee(emp);
                              setShowEmployeeModal(true);
                            }}
                            className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            Düzenle
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: MAAŞ & AVANS (BIDIRECTIONAL FINANCE) ==================== */}
      {subTab === "payroll" && (
        <div className="space-y-4">
          {/* Pending Mobile Advance Requests */}
          {payrollData?.pending_requests?.length > 0 && (
            <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3.5 space-y-2">
              <h3 className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                Onay Bekleyen Mobil Avans Talepleri ({payrollData.pending_requests.length})
              </h3>
              <div className="divide-y divide-amber-200/60 dark:divide-amber-800/60">
                {payrollData.pending_requests.map((req: any) => (
                  <div key={req.id} className="py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{req.full_name}</span>
                      <span className="text-slate-600 dark:text-slate-400"> · {req.description || "Avans talebi"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {Number(req.amount || 0).toLocaleString("tr-TR")} {req.currency}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPayrollPrefill({
                            employee_id: req.employee_id,
                            item_type: "advance",
                            amount: Number(req.amount),
                            currency: req.currency,
                            pending_ledger_id: req.id,
                          });
                          setShowPayrollModal(true);
                        }}
                        className="px-2.5 py-1 rounded-md bg-emerald-700 text-white font-medium cursor-pointer"
                      >
                        Onayla & Öde
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await fetch(`/api/store/hr/payroll/ledger/${req.id}/status?storeId=${storeId}`, {
                            method: "PUT",
                            headers: getAuthHeaders({ "Content-Type": "application/json" }),
                            body: JSON.stringify({ status: "rejected" }),
                          });
                          toast.success("Avans talebi reddedildi.");
                          fetchPayroll();
                          fetchOverviewAndEmployees();
                        }}
                        className="px-2.5 py-1 rounded-md border border-red-300 text-red-700 font-medium cursor-pointer"
                      >
                        Reddet
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Payroll Sheet */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="h-8 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs tabular-nums text-slate-900 dark:text-slate-100"
                />
                <span className="text-xs text-slate-500">
                  Gelir & Gider / Kasa ile çift yönlü senkronize
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportPayrollExcel}
                  className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel Bordro</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPayrollPrefill(null);
                    setShowPayrollModal(true);
                  }}
                  className="h-8 px-3 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white text-xs font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ödeme / Avans Gir</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-3 py-2 font-medium">Personel</th>
                    <th className="px-3 py-2 font-medium text-right">Puantaj</th>
                    <th className="px-3 py-2 font-medium text-right">Sabit + Destek</th>
                    <th className="px-3 py-2 font-medium text-right">Avans</th>
                    <th className="px-3 py-2 font-medium text-right">Ödenen Maaş</th>
                    <th className="px-3 py-2 font-medium text-right">Net Kalan</th>
                    <th className="px-3 py-2 font-medium text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(payrollData?.sheet || []).length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Aktif personel bulunamadı.</td></tr>
                  ) : (
                    payrollData.sheet.map((row: any) => (
                      <tr key={row.employee_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="px-3 py-2">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{row.full_name}</p>
                          <p className="text-[11px] text-slate-500">{row.role_title} · {row.branch_name}</p>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-600 dark:text-slate-400">
                          {row.worked_days} gün{row.overtime_minutes > 0 ? ` · +${Math.round(row.overtime_minutes / 60)}s` : ""}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-900 dark:text-slate-100">
                          {(row.base_salary + row.meal_transport).toLocaleString("tr-TR")} {row.currency}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-amber-700 dark:text-amber-400">
                          {row.paid_advances > 0 ? `-${row.paid_advances.toLocaleString("tr-TR")}` : "0"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-emerald-700 dark:text-emerald-400">
                          {row.paid_salary.toLocaleString("tr-TR")}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                          {row.is_settled ? (
                            <span className="text-emerald-700 dark:text-emerald-400">Kapandı</span>
                          ) : (
                            `${row.remaining_net_payable.toLocaleString("tr-TR")} ${row.currency}`
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setPayrollPrefill({
                                  employee_id: row.employee_id,
                                  item_type: "advance",
                                  amount: 0,
                                  currency: row.currency,
                                });
                                setShowPayrollModal(true);
                              }}
                              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                            >
                              Avans
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPayrollPrefill({
                                  employee_id: row.employee_id,
                                  item_type: "salary",
                                  amount: row.remaining_net_payable > 0 ? row.remaining_net_payable : row.base_salary,
                                  currency: row.currency,
                                });
                                setShowPayrollModal(true);
                              }}
                              className="px-2 py-1 rounded bg-slate-900 dark:bg-indigo-600 text-white font-medium cursor-pointer"
                            >
                              Öde
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ledger Entries for Period */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Dönem Ödeme & Gider Hareketleri ({selectedMonth})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-3 py-2 font-medium">Tarih</th>
                    <th className="px-3 py-2 font-medium">Personel & Kalem</th>
                    <th className="px-3 py-2 font-medium">Hesap / Finans Bağlantısı</th>
                    <th className="px-3 py-2 font-medium text-right">Tutar</th>
                    <th className="px-3 py-2 font-medium text-right">Sil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(payrollData?.ledger || []).length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">Bu dönem için ödeme hareketi yok.</td></tr>
                  ) : (
                    payrollData.ledger.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 tabular-nums text-slate-500">{fmtDate(item.payment_date || item.created_at)}</td>
                        <td className="px-3 py-2">
                          <span className="font-medium text-slate-900 dark:text-slate-100">{item.full_name}</span>
                          <span className="text-slate-400"> · {PAYROLL_LABELS[item.item_type] || item.item_type}</span>
                          {item.description && <span className="text-slate-500"> · {item.description}</span>}
                        </td>
                        <td className="px-3 py-2 text-[11px] text-slate-600 dark:text-slate-400">
                          {item.account_name || item.payment_method}
                          {item.portfolio_transaction_id ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-medium"> · Finans #{item.portfolio_transaction_id}</span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                          {Number(item.amount || 0).toLocaleString("tr-TR")} {item.currency}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={async () => {
                              const r = await fetch(`/api/store/hr/payroll/ledger/${item.id}?storeId=${storeId}`, {
                                method: "DELETE",
                                headers: getAuthHeaders(),
                              });
                              if (r.ok) {
                                toast.success("Ödeme ve bağlı finans gideri silindi.");
                                fetchPayroll();
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: İZİNLER ==================== */}
      {subTab === "leaves" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setLeaveSubView("requests")}
                className={`px-3 py-1 rounded-md font-medium cursor-pointer ${leaveSubView === "requests" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white" : "text-slate-500"}`}
              >
                İzin Talepleri & Kayıtlar
              </button>
              <button
                type="button"
                onClick={() => setLeaveSubView("balances")}
                className={`px-3 py-1 rounded-md font-medium cursor-pointer ${leaveSubView === "balances" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white" : "text-slate-500"}`}
              >
                Yıllık İzin Bakiyeleri
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setLeaveForm((p) => ({ ...p, employee_id: activeEmployees[0]?.id ? String(activeEmployees[0].id) : "" }));
                setShowLeaveModal(true);
              }}
              className="h-8 px-3 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white font-medium flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>İzin Ekle</span>
            </button>
          </div>

          {leaveSubView === "requests" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-3 py-2 font-medium">Personel</th>
                    <th className="px-3 py-2 font-medium">Tür & Tarih</th>
                    <th className="px-3 py-2 font-medium text-right">Gün</th>
                    <th className="px-3 py-2 font-medium">Açıklama / Çakışma</th>
                    <th className="px-3 py-2 font-medium">Durum</th>
                    <th className="px-3 py-2 font-medium text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {leavesData.leaves.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Henüz izin kaydı yok.</td></tr>
                  ) : (
                    leavesData.leaves.map((lv) => (
                      <tr key={lv.id}>
                        <td className="px-3 py-2">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{lv.full_name}</p>
                          <p className="text-[11px] text-slate-500">{lv.branch_name || storeName}</p>
                        </td>
                        <td className="px-3 py-2 tabular-nums">
                          <p className="font-medium text-slate-800 dark:text-slate-200">{LEAVE_LABELS[lv.leave_type] || lv.leave_type}</p>
                          <p className="text-[11px] text-slate-500">{fmtDate(lv.start_date)} – {fmtDate(lv.end_date)}</p>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold">{lv.days_count}</td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                          <span>{lv.reason || "—"}</span>
                          {lv.branch_conflicts?.length > 0 && (
                            <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                              Çakışma ({lv.branch_name}): {lv.branch_conflicts.join(", ")}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2 font-medium">
                          <span className={lv.status === "approved" ? "text-emerald-700" : lv.status === "rejected" ? "text-red-600" : "text-amber-600"}>
                            {lv.status === "approved" ? "Onaylı" : lv.status === "rejected" ? "Reddedildi" : "Bekliyor"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="inline-flex items-center gap-1">
                            {lv.status === "pending" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleLeaveStatus(lv.id, "approved")}
                                  className="px-2 py-1 rounded bg-emerald-700 text-white font-medium cursor-pointer"
                                >
                                  Onayla
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleLeaveStatus(lv.id, "rejected")}
                                  className="px-2 py-1 rounded border border-red-300 text-red-700 font-medium cursor-pointer"
                                >
                                  Reddet
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={async () => {
                                await fetch(`/api/store/hr/leaves/${lv.id}?storeId=${storeId}`, { method: "DELETE", headers: getAuthHeaders() });
                                toast.success("İzin kaydı silindi.");
                                fetchLeaves();
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-3 py-2 font-medium">Personel</th>
                    <th className="px-3 py-2 font-medium">İşe Giriş & Kıdem</th>
                    <th className="px-3 py-2 font-medium text-right">Yıllık Hak</th>
                    <th className="px-3 py-2 font-medium text-right">Kullanılan</th>
                    <th className="px-3 py-2 font-medium text-right">Kalan Bakiye</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {leavesData.balances.map((b) => (
                    <tr key={b.employee_id}>
                      <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">
                        {b.full_name} <span className="text-slate-400 font-normal">· {b.branch_name}</span>
                      </td>
                      <td className="px-3 py-2 tabular-nums text-slate-600 dark:text-slate-400">
                        {fmtDate(b.start_date)} ({b.tenure_years} yıl)
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{b.entitled_days} gün</td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-600">{b.used_days} gün</td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                        {b.remaining_days} gün
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 5: ÖZLÜK BELGELERİ & ZİMMET ==================== */}
      {subTab === "dossier" && (
        <div className="space-y-4">
          {overview?.expiring_documents_list?.length > 0 && (
            <div className="p-3 rounded-xl bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs flex flex-wrap items-center gap-2 text-red-900 dark:text-red-200">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                <strong>Süresi Dolmak Üzere / Geçmiş Belgeler:</strong>{" "}
                {overview.expiring_documents_list
                  .slice(0, 4)
                  .map((d: any) => `${d.full_name} (${d.title} · ${fmtDate(d.expiry_date)})`)
                  .join(" · ")}
              </span>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setDossierSubView("documents")}
                  className={`px-3 py-1 rounded-md font-medium cursor-pointer ${dossierSubView === "documents" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white" : "text-slate-500"}`}
                >
                  Özlük Belgeleri ({documents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDossierSubView("assets")}
                  className={`px-3 py-1 rounded-md font-medium cursor-pointer ${dossierSubView === "assets" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white" : "text-slate-500"}`}
                >
                  Zimmet Takibi ({assets.length})
                </button>
              </div>
              {dossierSubView === "documents" ? (
                <button
                  type="button"
                  onClick={() => setShowDocModal(true)}
                  className="h-8 px-3 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Belge Yükle</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAssetForm((p) => ({ ...p, employee_id: activeEmployees[0]?.id ? String(activeEmployees[0].id) : "" }));
                    setShowAssetModal(true);
                  }}
                  className="h-8 px-3 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Zimmet Ver</span>
                </button>
              )}
            </div>

            {dossierSubView === "documents" ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-3 py-2 font-medium">Personel</th>
                      <th className="px-3 py-2 font-medium">Belge</th>
                      <th className="px-3 py-2 font-medium">Geçerlilik Bitiş</th>
                      <th className="px-3 py-2 font-medium text-right">Dosya / İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {documents.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Yüklenmiş özlük belgesi bulunmuyor.</td></tr>
                    ) : (
                      documents.map((doc) => {
                        const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date();
                        const isSoon = doc.expiry_date && !isExpired && (new Date(doc.expiry_date).getTime() - Date.now()) < 30 * 86400000;
                        return (
                          <tr key={doc.id}>
                            <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">{doc.full_name}</td>
                            <td className="px-3 py-2">
                              <span className="font-medium text-slate-800 dark:text-slate-200">{doc.title}</span>
                              {doc.file_name && <span className="text-slate-400"> · {doc.file_name}</span>}
                            </td>
                            <td className="px-3 py-2 tabular-nums">
                              {doc.expiry_date ? (
                                <span className={isExpired ? "text-red-600 font-semibold" : isSoon ? "text-amber-600 font-semibold" : "text-slate-600 dark:text-slate-400"}>
                                  {fmtDate(doc.expiry_date)} {isExpired ? "(Süresi Doldu)" : isSoon ? "(Yaklaşıyor)" : ""}
                                </span>
                              ) : (
                                <span className="text-slate-400">Süresiz</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                {doc.has_file && (
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadDoc(doc.id, doc.file_name)}
                                    className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>İndir</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await fetch(`/api/store/hr/documents/${doc.id}?storeId=${storeId}`, { method: "DELETE", headers: getAuthHeaders() });
                                    toast.success("Belge silindi.");
                                    fetchDossier();
                                    fetchOverviewAndEmployees();
                                  }}
                                  className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-3 py-2 font-medium">Personel</th>
                      <th className="px-3 py-2 font-medium">Demirbaş / Seri No</th>
                      <th className="px-3 py-2 font-medium">Teslim / Durum</th>
                      <th className="px-3 py-2 font-medium text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {assets.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Henüz zimmet kaydı yok.</td></tr>
                    ) : (
                      assets.map((a) => (
                        <tr key={a.id}>
                          <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">{a.full_name}</td>
                          <td className="px-3 py-2">
                            <span className="font-medium text-slate-800 dark:text-slate-200">{a.asset_name}</span>
                            <span className="text-slate-400"> · {ASSET_CATEGORIES[a.category] || a.category}</span>
                            {a.serial_no && <span className="font-mono text-[11px] text-slate-500"> · {a.serial_no}</span>}
                          </td>
                          <td className="px-3 py-2 tabular-nums">
                            <span className={a.status === "assigned" ? "text-emerald-700 font-medium" : "text-slate-500"}>
                              {a.status === "assigned" ? `Zimmetli (${fmtDate(a.assigned_date)})` : `İade (${fmtDate(a.return_date)})`}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  printAssetCustodyReceipt({
                                    storeName,
                                    employeeName: a.full_name,
                                    employeeRole: a.role_title,
                                    employeeTc: a.tc_no,
                                    employeePhone: a.phone,
                                    assets: assets.filter((x) => x.employee_id === a.employee_id),
                                  })
                                }
                                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer"
                              >
                                <Printer className="w-3 h-3" />
                                <span>Tutanak</span>
                              </button>
                              {a.status === "assigned" && (
                                <button
                                  type="button"
                                  onClick={() => handleReturnAsset(a.id)}
                                  className="px-2 py-1 rounded bg-slate-900 text-white font-medium cursor-pointer"
                                >
                                  İade Al
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== MODALS & DRAWERS ==================== */}
      {showEmployeeModal && (
        <EmployeeFormModal
          storeId={storeId}
          branches={checkpoints.length > 0 ? checkpoints : [{ branch_id: storeId, label: storeName, branch_type: "STORE" }]}
          users={users}
          employee={editingEmployee}
          onClose={() => setShowEmployeeModal(false)}
          onSaved={(pin, name, phone) => {
            setShowEmployeeModal(false);
            if (pin && name && phone) setPinBanner({ pin, name, phone });
            fetchOverviewAndEmployees();
          }}
        />
      )}

      {editingCheckpoint && (
        <CheckpointGpsModal
          storeId={storeId}
          checkpoint={editingCheckpoint}
          onClose={() => setEditingCheckpoint(null)}
          onSaved={() => {
            setEditingCheckpoint(null);
            fetchOverviewAndEmployees();
          }}
        />
      )}

      {showPayrollModal && (
        <PayrollPaymentModal
          storeId={storeId}
          employees={activeEmployees}
          accounts={payrollData?.accounts || []}
          period={selectedMonth}
          prefill={payrollPrefill}
          onClose={() => setShowPayrollModal(false)}
          onSaved={() => {
            setShowPayrollModal(false);
            fetchPayroll();
            fetchOverviewAndEmployees();
          }}
        />
      )}

      {showDocModal && (
        <DocumentUploadModal
          storeId={storeId}
          employees={employees}
          domainId={resolvedDomain}
          onClose={() => setShowDocModal(false)}
          onSaved={() => {
            setShowDocModal(false);
            fetchDossier();
            fetchOverviewAndEmployees();
          }}
        />
      )}

      {detailEmployeeId && (
        <EmployeeDetailDrawer
          storeId={storeId}
          storeName={storeName}
          portalBaseUrl={portalBaseUrl}
          employeeId={detailEmployeeId}
          onClose={() => setDetailEmployeeId(null)}
          onEdit={(emp) => {
            setDetailEmployeeId(null);
            setEditingEmployee(emp);
            setShowEmployeeModal(true);
          }}
          onRefreshParent={fetchOverviewAndEmployees}
        />
      )}

      {/* Manual Attendance Modal */}
      {showManualAttModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3">
          <form onSubmit={handleManualAttSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Manuel Puantaj Kaydı</h3>
              <button type="button" onClick={() => setShowManualAttModal(false)} className="p-1 text-slate-500 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="text-[11px] text-slate-600 block mb-1">Personel *</label>
              <select required value={manualAttForm.employee_id} onChange={(e) => setManualAttForm((p) => ({ ...p, employee_id: e.target.value }))} className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                {activeEmployees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Tarih</label>
                <input type="date" required value={manualAttForm.work_date} onChange={(e) => setManualAttForm((p) => ({ ...p, work_date: e.target.value }))} className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg tabular-nums" />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Giriş</label>
                <input type="time" required value={manualAttForm.check_in_time} onChange={(e) => setManualAttForm((p) => ({ ...p, check_in_time: e.target.value }))} className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg tabular-nums" />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Çıkış</label>
                <input type="time" value={manualAttForm.check_out_time} onChange={(e) => setManualAttForm((p) => ({ ...p, check_out_time: e.target.value }))} className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg tabular-nums" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-slate-600 block mb-1">Gerekçe / Not</label>
              <input type="text" value={manualAttForm.notes} onChange={(e) => setManualAttForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Örn: Telefon şarjı bittiği için manuel işlendi" className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowManualAttModal(false)} className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">İptal</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white font-medium cursor-pointer">Kaydet</button>
            </div>
          </form>
        </div>
      )}

      {/* Quick Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3">
          <form onSubmit={handleCreateLeave} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">İzin Kaydı Ekle</h3>
              <button type="button" onClick={() => setShowLeaveModal(false)} className="p-1 text-slate-500 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Personel *</label>
                <select required value={leaveForm.employee_id} onChange={(e) => setLeaveForm((p) => ({ ...p, employee_id: e.target.value }))} className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                  {activeEmployees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">İzin Türü</label>
                <select value={leaveForm.leave_type} onChange={(e) => setLeaveForm((p) => ({ ...p, leave_type: e.target.value }))} className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                  {Object.entries(LEAVE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Başlangıç</label>
                <input type="date" required value={leaveForm.start_date} onChange={(e) => setLeaveForm((p) => ({ ...p, start_date: e.target.value }))} className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg tabular-nums" />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Bitiş</label>
                <input type="date" required value={leaveForm.end_date} onChange={(e) => setLeaveForm((p) => ({ ...p, end_date: e.target.value }))} className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg tabular-nums" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-slate-600 block mb-1">Açıklama</label>
              <input type="text" value={leaveForm.reason} onChange={(e) => setLeaveForm((p) => ({ ...p, reason: e.target.value }))} className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowLeaveModal(false)} className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">İptal</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white font-medium cursor-pointer">Kaydet</button>
            </div>
          </form>
        </div>
      )}

      {/* Quick Asset Custody Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3">
          <form onSubmit={handleCreateAsset} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Zimmet Teslim Kaydı</h3>
              <button type="button" onClick={() => setShowAssetModal(false)} className="p-1 text-slate-500 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Personel *</label>
                <select required value={assetForm.employee_id} onChange={(e) => setAssetForm((p) => ({ ...p, employee_id: e.target.value }))} className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                  {activeEmployees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Kategori</label>
                <select value={assetForm.category} onChange={(e) => setAssetForm((p) => ({ ...p, category: e.target.value }))} className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                  {Object.entries(ASSET_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Demirbaş Adı *</label>
                <input type="text" required placeholder="Örn: iPhone 14 / POS" value={assetForm.asset_name} onChange={(e) => setAssetForm((p) => ({ ...p, asset_name: e.target.value }))} className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Seri / Plaka No</label>
                <input type="text" value={assetForm.serial_no} onChange={(e) => setAssetForm((p) => ({ ...p, serial_no: e.target.value }))} className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Teslim Tarihi</label>
                <input type="date" value={assetForm.assigned_date} onChange={(e) => setAssetForm((p) => ({ ...p, assigned_date: e.target.value }))} className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg tabular-nums" />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Durum Notu</label>
                <input type="text" placeholder="Sıfır, kutulu vb." value={assetForm.condition_note} onChange={(e) => setAssetForm((p) => ({ ...p, condition_note: e.target.value }))} className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAssetModal(false)} className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">İptal</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white font-medium cursor-pointer">Zimmetle</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
