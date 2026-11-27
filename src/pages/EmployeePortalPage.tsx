import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  QrCode,
  MapPin,
  Clock,
  Calendar,
  Wallet,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Camera,
  X,
  Coffee,
  ArrowRight,
  Lock,
  Phone,
  RefreshCw,
  FileText,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";

type PortalTab = "punch" | "attendance" | "leaves" | "payroll";

const LEAVE_LABELS: Record<string, string> = {
  annual: "Yıllık İzin",
  sick: "Hastalık / Rapor",
  excuse: "Mazeret İzni",
  unpaid: "Ücretsiz İzin",
  parental: "Doğum / Babalık",
};

const PAYROLL_LABELS: Record<string, string> = {
  salary: "Maaş",
  advance: "Avans",
  bonus: "Prim",
  sgk: "SGK",
  meal_transport: "Yol / Yemek",
  overtime: "Fazla Mesai",
  deduction: "Kesinti",
};

function formatMinutes(totalMin: number): string {
  const m = Math.max(0, Math.round(totalMin || 0));
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return `${h} sa ${rem} dk`;
}

function formatTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function formatDateShort(val?: string | null): string {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val).slice(0, 10);
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function EmployeePortalPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const initialQrToken = searchParams.get("token") || "";

  // Store public metadata
  const [storeInfo, setStoreInfo] = useState<{
    store_id: number;
    slug: string;
    store_name: string;
    logo_url?: string | null;
    checkpoint?: {
      id: number;
      branch_id: number;
      label: string;
      branch_type: string;
      radius_meters: number;
      strict_gps: boolean;
      has_gps: boolean;
    } | null;
  } | null>(null);
  const [storeLoading, setStoreLoading] = useState(true);
  const [storeError, setStoreError] = useState<string | null>(null);

  // Employee session kept strictly in React memory (never collides with admin localStorage)
  const [empToken, setEmpToken] = useState<string | null>(null);
  const [portalData, setPortalData] = useState<any>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  // Login form state
  const [phoneInput, setPhoneInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // Active portal tab & clock
  const [activeTab, setActiveTab] = useState<PortalTab>("punch");
  const [nowClock, setNowClock] = useState(() => new Date());

  // QR + GPS state
  const [activeQrToken, setActiveQrToken] = useState(initialQrToken);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [punching, setPunching] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string>("");
  const [lastPunchFeedback, setLastPunchFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  // Leave request form
  const [leaveForm, setLeaveForm] = useState({
    leave_type: "annual",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
    reason: "",
  });
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Advance request form
  const [advanceForm, setAdvanceForm] = useState({ amount: "", description: "" });
  const [submittingAdvance, setSubmittingAdvance] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNowClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load store public info
  useEffect(() => {
    if (!slug) {
      setStoreError("Geçersiz işletme bağlantısı.");
      setStoreLoading(false);
      return;
    }
    setStoreLoading(true);
    const qs = initialQrToken ? `?token=${encodeURIComponent(initialQrToken)}` : "";
    fetch(`/api/hr-portal/store/${encodeURIComponent(slug)}${qs}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "İşletme bulunamadı.");
        setStoreInfo(data);
        document.title = `${data.store_name} · Personel Portalı`;
      })
      .catch((err) => setStoreError(err.message || "İşletme bilgisi alınamadı."))
      .finally(() => setStoreLoading(false));
  }, [slug, initialQrToken]);

  const fetchPortalMe = useCallback(async (tokenToUse: string) => {
    setLoadingPortal(true);
    try {
      const res = await fetch("/api/hr-portal/me", {
        headers: { Authorization: `Bearer ${tokenToUse}` },
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setEmpToken(null);
          setPortalData(null);
        }
        throw new Error(data.error || "Bilgiler yüklenemedi.");
      }
      setPortalData(data);
    } catch (err: any) {
      toast.error(err.message || "Bağlantı hatası.");
    } finally {
      setLoadingPortal(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    setLoggingIn(true);
    try {
      const res = await fetch("/api/hr-portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeSlug: slug,
          phone: phoneInput.trim(),
          pin: pinInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Giriş başarısız.");
      setEmpToken(data.token);
      setPinInput("");
      await fetchPortalMe(data.token);
      toast.success(`Hoş geldiniz, ${data.employee?.full_name || ""}`);
    } catch (err: any) {
      toast.error(err.message || "Giriş yapılamadı.");
    } finally {
      setLoggingIn(false);
    }
  };

  // Stop QR camera cleanly
  const stopScanner = useCallback(async () => {
    if (qrScannerRef.current) {
      try {
        if (qrScannerRef.current.isScanning) {
          await qrScannerRef.current.stop();
        }
        qrScannerRef.current.clear();
      } catch {}
      qrScannerRef.current = null;
    }
    setScannerOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startQrScanner = () => {
    setScannerOpen(true);
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("hr-mobile-qr-reader");
        qrScannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            let extracted = decodedText.trim();
            if (extracted.includes("token=")) {
              try {
                const u = new URL(extracted);
                extracted = u.searchParams.get("token") || extracted;
              } catch {}
            }
            setActiveQrToken(extracted);
            toast.success("Kapı QR kodu okundu!");
            stopScanner();
          },
          () => {}
        );
      } catch (err: any) {
        toast.error("Kamera açılamadı. Tarayıcı kamera iznini kontrol edin.");
        setScannerOpen(false);
      }
    }, 150);
  };

  const getDeviceGps = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      setGpsStatus("Konum doğrulanıyor...");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsStatus("");
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          setGpsStatus("");
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 9000, maximumAge: 15000 }
      );
    });
  };

  const handlePunch = async (action: "check_in" | "break_start" | "break_end" | "check_out") => {
    if (!empToken) return;
    setLastPunchFeedback(null);

    const needsQrAndGps = action === "check_in" || action === "check_out";
    if (needsQrAndGps && !activeQrToken) {
      toast.error("Önce kapıdaki QR kodu okutun.");
      startQrScanner();
      return;
    }

    setPunching(true);
    try {
      let coords: { lat: number; lng: number } | null = null;
      if (needsQrAndGps) {
        coords = await getDeviceGps();
      }

      const res = await fetch("/api/hr-portal/punch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${empToken}`,
        },
        body: JSON.stringify({
          action,
          qr_token: activeQrToken,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLastPunchFeedback({ type: "err", text: data.error || "İşlem reddedildi." });
        toast.error(data.error || "İşlem kaydedilemedi.");
        return;
      }
      setLastPunchFeedback({ type: "ok", text: data.message || "İşlem kaydedildi." });
      toast.success(data.message || "Kaydedildi.");
      await fetchPortalMe(empToken);
    } catch (err: any) {
      setLastPunchFeedback({ type: "err", text: err.message || "Bağlantı hatası." });
      toast.error(err.message || "İşlem başarısız.");
    } finally {
      setPunching(false);
    }
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empToken) return;
    setSubmittingLeave(true);
    try {
      const res = await fetch("/api/hr-portal/leave-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${empToken}`,
        },
        body: JSON.stringify(leaveForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Talep gönderilemedi.");
      toast.success(data.message);
      setLeaveForm((p) => ({ ...p, reason: "" }));
      await fetchPortalMe(empToken);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleSubmitAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empToken) return;
    setSubmittingAdvance(true);
    try {
      const res = await fetch("/api/hr-portal/advance-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${empToken}`,
        },
        body: JSON.stringify(advanceForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Avans talebi gönderilemedi.");
      toast.success(data.message);
      setAdvanceForm({ amount: "", description: "" });
      await fetchPortalMe(empToken);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingAdvance(false);
    }
  };

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <RefreshCw className="w-6 h-6 text-slate-500 animate-spin" />
      </div>
    );
  }

  if (storeError || !storeInfo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
          <h1 className="text-base font-semibold text-slate-900">Portal Bulunamadı</h1>
          <p className="text-sm text-slate-600">{storeError || "Geçersiz işletme bağlantısı."}</p>
        </div>
      </div>
    );
  }

  // ==================== LOGIN VIEW (Phone + 4-digit PIN) ====================
  if (!empToken || !portalData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div className="space-y-1.5">
            {storeInfo.logo_url && (
              <img
                src={storeInfo.logo_url}
                alt={storeInfo.store_name}
                referrerPolicy="no-referrer"
                className="h-9 w-auto object-contain mb-2"
              />
            )}
            <p className="text-xs text-slate-500">Personel Giriş & Self-Servis</p>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{storeInfo.store_name}</h1>
            {storeInfo.checkpoint && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 pt-1">
                <QrCode className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {storeInfo.checkpoint.label} · {storeInfo.checkpoint.has_gps ? `GPS (${storeInfo.checkpoint.radius_meters} m)` : "QR Doğrulama"}
                </span>
              </div>
            )}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 block">Telefon Numarası</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  inputMode="tel"
                  required
                  autoComplete="tel"
                  placeholder="05XX XXX XX XX"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full pl-9 pr-3 h-11 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium tabular-nums focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 block">4 Haneli Personel PIN</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="\d{4,6}"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full pl-9 pr-3 h-11 bg-slate-50 border border-slate-200 rounded-xl text-base tracking-[0.35em] text-slate-900 font-semibold tabular-nums focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full h-12 rounded-xl bg-slate-900 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
            >
              {loggingIn ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><span>Giriş Yap</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-xs text-slate-500 border-t border-slate-100 pt-3">
            PIN kodunuzu unuttuysanız mağaza veya depo yöneticinizden anlık yenileme isteyebilirsiniz.
          </p>
        </div>
      </div>
    );
  }

  // ==================== AUTHENTICATED PORTAL VIEW ====================
  const emp = portalData.employee;
  const todayLog = portalData.today_log;
  const isCheckedIn = Boolean(todayLog && todayLog.check_in_at && !todayLog.check_out_at);
  const isOnBreak = Boolean(isCheckedIn && todayLog?.break_started_at);
  const isCompletedToday = Boolean(todayLog && todayLog.check_in_at && todayLog.check_out_at);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 lg:pb-10">
      {/* Compact 52px Sticky Top App Bar */}
      <header className="sticky top-0 z-30 h-[52px] bg-white/95 backdrop-blur-md border-b border-slate-200 px-4">
        <div className="max-w-5xl mx-auto h-full flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{storeInfo.store_name}</p>
            <p className="text-[11px] text-slate-500 truncate">
              {emp.full_name} · {emp.branch_name}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fetchPortalMe(empToken)}
              aria-label="Yenile"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loadingPortal ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => {
                setEmpToken(null);
                setPortalData(null);
              }}
              className="min-h-[40px] px-3 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Çıkış</span>
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Segmented Navigation (hidden on mobile where bottom tab bar anchors thumb zone) */}
      <div className="hidden lg:block max-w-5xl mx-auto px-4 pt-5">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl">
          {[
            { id: "punch" as PortalTab, label: "Giriş-Çıkış", icon: QrCode },
            { id: "attendance" as PortalTab, label: "Puantajım", icon: Clock },
            { id: "leaves" as PortalTab, label: "İzinlerim", icon: Calendar },
            { id: "payroll" as PortalTab, label: "Avans & Maaş", icon: Wallet },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2 text-xs font-medium rounded-lg flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === t.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Container (Expands cleanly to 2-column grid on desktop) */}
      <main className="max-w-5xl mx-auto px-4 py-4 lg:py-6">
        {activeTab === "punch" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Primary Punch Control Card */}
            <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs text-slate-500">
                    {nowClock.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                  <p className="text-3xl font-semibold text-slate-900 tabular-nums tracking-tight mt-0.5">
                    {nowClock.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Vardiya</p>
                  <p className="text-sm font-semibold text-slate-900 tabular-nums">
                    {emp.shift_start} – {emp.shift_end}
                  </p>
                  <p className={`text-xs font-medium mt-1 ${
                    isOnBreak ? "text-amber-600" : isCheckedIn ? "text-emerald-600" : isCompletedToday ? "text-slate-600" : "text-slate-500"
                  }`}>
                    {isOnBreak
                      ? "Molada"
                      : isCheckedIn
                      ? `İşyerinde · ${formatTime(todayLog?.check_in_at)}`
                      : isCompletedToday
                      ? `Tamamlandı · ${formatTime(todayLog?.check_in_at)}–${formatTime(todayLog?.check_out_at)}`
                      : "Giriş Yapılmadı"}
                  </p>
                </div>
              </div>

              {/* QR Checkpoint Status Row */}
              <div className="flex items-center justify-between gap-3 py-2.5 px-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-900 truncate">
                    {activeQrToken
                      ? (storeInfo.checkpoint?.label || "Kapı QR Kodu Hazır")
                      : "Kapı QR Kodu Okutulmadı"}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {gpsStatus || (activeQrToken ? "Konum doğrulaması işlem anında yapılır" : "Giriş veya çıkış için kapıdaki QR'ı okutun")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={startQrScanner}
                  className="min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-800 flex items-center gap-1.5 whitespace-nowrap shrink-0 hover:bg-slate-100 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>{activeQrToken ? "Yeniden Okut" : "QR Okut"}</span>
                </button>
              </div>

              {/* Inline Camera QR Scanner */}
              {scannerOpen && (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-950 p-3 space-y-2">
                  <div className="flex items-center justify-between text-white text-xs px-1">
                    <span>Kapıdaki QR kodu çerçeveye hizalayın</span>
                    <button
                      type="button"
                      onClick={stopScanner}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-white/10 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div id="hr-mobile-qr-reader" className="w-full rounded-lg overflow-hidden" />
                </div>
              )}

              {/* Feedback Banner */}
              {lastPunchFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    lastPunchFeedback.type === "ok"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-red-50 border-red-200 text-red-900"
                  }`}
                >
                  {lastPunchFeedback.type === "ok" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <span>{lastPunchFeedback.text}</span>
                </div>
              )}

              {/* Thumb-Friendly Primary Action Buttons */}
              <div className="space-y-2.5 pt-1">
                {!isCheckedIn ? (
                  <button
                    type="button"
                    disabled={punching}
                    onClick={() => handlePunch("check_in")}
                    className="w-full min-h-[52px] rounded-xl bg-slate-900 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.99] transition-transform disabled:opacity-60 cursor-pointer"
                  >
                    {punching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                    <span>{punching ? "Doğrulanıyor..." : "Giriş Yap (QR + GPS)"}</span>
                  </button>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={punching}
                      onClick={() => handlePunch(isOnBreak ? "break_end" : "break_start")}
                      className="w-full min-h-[50px] rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-[0.99] transition-transform disabled:opacity-60 cursor-pointer"
                    >
                      <Coffee className="w-4 h-4" />
                      <span>{isOnBreak ? "Molayı Bitir" : "Mola Başlat"}</span>
                    </button>
                    <button
                      type="button"
                      disabled={punching}
                      onClick={() => handlePunch("check_out")}
                      className="w-full min-h-[50px] rounded-xl bg-red-600 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-700 active:scale-[0.99] transition-transform disabled:opacity-60 cursor-pointer"
                    >
                      {punching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                      <span>Çıkış Yap (QR + GPS)</span>
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Right / Secondary Summary Column */}
            <aside className="lg:col-span-5 space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <h2 className="text-xs font-semibold text-slate-900 mb-3">Bu Ayki Özetim</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[11px] text-slate-500">Çalışılan Gün</p>
                    <p className="text-xl font-semibold text-slate-900 tabular-nums mt-0.5">
                      {portalData.month_stats?.days_worked || 0} gün
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[11px] text-slate-500">Toplam Süre</p>
                    <p className="text-xl font-semibold text-slate-900 tabular-nums mt-0.5">
                      {formatMinutes(portalData.month_stats?.total_worked_minutes || 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[11px] text-slate-500">Kalan Yıllık İzin</p>
                    <p className="text-xl font-semibold text-emerald-700 tabular-nums mt-0.5">
                      {portalData.leave_balance?.remaining_days ?? 0} gün
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[11px] text-slate-500">Bu Ayki Avans</p>
                    <p className="text-xl font-semibold text-slate-900 tabular-nums mt-0.5">
                      {Number(portalData.current_month_advances || 0).toLocaleString("tr-TR")} {emp.salary_currency}
                    </p>
                  </div>
                </div>
              </div>

              {portalData.documents?.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                  <h2 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Özlük Belgelerim</span>
                  </h2>
                  <div className="divide-y divide-slate-100">
                    {portalData.documents.slice(0, 4).map((d: any) => (
                      <div key={d.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                        <span className="text-slate-800 truncate">{d.title}</span>
                        <span className="text-slate-500 tabular-nums shrink-0">
                          {d.expiry_date ? `Bitiş: ${formatDateShort(d.expiry_date)}` : "Süresiz"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}

        {activeTab === "attendance" && (
          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900">Son Puantaj Kayıtlarım</h2>
              <span className="text-xs text-slate-500 tabular-nums">
                Mesai: {formatMinutes(portalData.month_stats?.total_overtime_minutes || 0)} · Gecikme: {portalData.month_stats?.total_late_minutes || 0} dk
              </span>
            </div>
            {portalData.attendance_logs?.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">Henüz giriş-çıkış kaydınız yok.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {portalData.attendance_logs.map((log: any) => (
                  <div key={log.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 tabular-nums">
                        {formatDateShort(log.work_date)}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {log.checkpoint_label || "Şube"}
                        {log.check_in_distance_m !== null && log.check_in_distance_m !== undefined
                          ? ` · ${log.check_in_distance_m} m`
                          : ""}
                        {Number(log.late_minutes || 0) > 0 ? ` · ${log.late_minutes} dk geç` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0 tabular-nums">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatTime(log.check_in_at)} – {formatTime(log.check_out_at)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {log.worked_minutes > 0 ? formatMinutes(log.worked_minutes) : "Devam ediyor"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "leaves" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <form onSubmit={handleSubmitLeave} className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">İzin Talebi Oluştur</h2>
                <span className="text-xs text-emerald-700 font-medium tabular-nums">
                  Kalan: {portalData.leave_balance?.remaining_days ?? 0} gün
                </span>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600 block">İzin Türü</label>
                <select
                  value={leaveForm.leave_type}
                  onChange={(e) => setLeaveForm((p) => ({ ...p, leave_type: e.target.value }))}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                >
                  {Object.entries(LEAVE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 block">Başlangıç</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.start_date}
                    onChange={(e) => setLeaveForm((p) => ({ ...p, start_date: e.target.value }))}
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 tabular-nums"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 block">Bitiş</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.end_date}
                    onChange={(e) => setLeaveForm((p) => ({ ...p, end_date: e.target.value }))}
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 tabular-nums"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600 block">Açıklama</label>
                <textarea
                  rows={2}
                  placeholder="İzin sebebinizi kısaca yazın..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm((p) => ({ ...p, reason: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={submittingLeave}
                className="w-full min-h-[46px] rounded-xl bg-slate-900 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{submittingLeave ? "Gönderiliyor..." : "Onaya Gönder"}</span>
              </button>
            </form>

            <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-900">İzin Geçmişim</h2>
              </div>
              {portalData.leave_requests?.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">İzin kaydınız bulunmuyor.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {portalData.leave_requests.map((lv: any) => (
                    <div key={lv.id} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">
                          {LEAVE_LABELS[lv.leave_type] || lv.leave_type} · {lv.days_count} gün
                        </p>
                        <p className="text-xs text-slate-500 tabular-nums">
                          {formatDateShort(lv.start_date)} – {formatDateShort(lv.end_date)}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold shrink-0 ${
                          lv.status === "approved"
                            ? "text-emerald-700"
                            : lv.status === "rejected"
                            ? "text-red-600"
                            : "text-amber-600"
                        }`}
                      >
                        {lv.status === "approved" ? "Onaylandı" : lv.status === "rejected" ? "Reddedildi" : "Onay Bekliyor"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === "payroll" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <form onSubmit={handleSubmitAdvance} className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
              <h2 className="text-sm font-semibold text-slate-900">Avans Talebi Gönder</h2>
              <div className="space-y-1">
                <label className="text-xs text-slate-600 block">Tutar ({emp.salary_currency})</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  placeholder="Örn: 5000"
                  value={advanceForm.amount}
                  onChange={(e) => setAdvanceForm((p) => ({ ...p, amount: e.target.value }))}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-semibold tabular-nums"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600 block">Açıklama</label>
                <input
                  type="text"
                  placeholder="Kısa not (isteğe bağlı)"
                  value={advanceForm.description}
                  onChange={(e) => setAdvanceForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                />
              </div>
              <button
                type="submit"
                disabled={submittingAdvance}
                className="w-full min-h-[46px] rounded-xl bg-slate-900 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{submittingAdvance ? "Gönderiliyor..." : "Avans Talep Et"}</span>
              </button>
            </form>

            <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-900">Maaş & Avans Hareketlerim</h2>
              </div>
              {portalData.payroll_items?.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">Henüz ödeme kaydı bulunmuyor.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {portalData.payroll_items.map((item: any) => (
                    <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {PAYROLL_LABELS[item.item_type] || item.item_type} · {item.period_month}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {item.description || formatDateShort(item.payment_date)}
                        </p>
                      </div>
                      <div className="text-right shrink-0 tabular-nums">
                        <p className="text-sm font-semibold text-slate-900">
                          {Number(item.amount || 0).toLocaleString("tr-TR")} {item.currency}
                        </p>
                        <p className={`text-[11px] font-medium ${
                          item.status === "paid" ? "text-emerald-700" : item.status === "rejected" ? "text-red-600" : "text-amber-600"
                        }`}>
                          {item.status === "paid" ? "Ödendi" : item.status === "rejected" ? "Reddedildi" : "Onay Bekliyor"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Mobile Fixed Bottom Tab Bar (Thumb Zone Anchor, <=15% total sticky chrome) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200">
        <div className="grid grid-cols-4 h-16">
          {[
            { id: "punch" as PortalTab, label: "Giriş-Çıkış", icon: QrCode },
            { id: "attendance" as PortalTab, label: "Puantaj", icon: Clock },
            { id: "leaves" as PortalTab, label: "İzinler", icon: Calendar },
            { id: "payroll" as PortalTab, label: "Avans", icon: Wallet },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex flex-col items-center justify-center gap-1 min-h-[44px] cursor-pointer ${
                  active ? "text-slate-900 font-semibold" : "text-slate-500"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] leading-none">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
