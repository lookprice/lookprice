import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Wifi, Printer, Copy, Check, Eye, EyeOff, Sparkles, Smartphone, Download, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export interface WifiQrPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  branding: any;
  lang?: string;
  initialSsid?: string;
  initialPassword?: string;
  onSaveCredentials?: (ssid: string, password: string) => void;
}

export const WifiQrPrintModal: React.FC<WifiQrPrintModalProps> = ({
  isOpen,
  onClose,
  branding,
  lang = "tr",
  initialSsid = "",
  initialPassword = "",
  onSaveCredentials,
}) => {
  const isTr = lang === "tr";
  const storeName = branding?.store_name || branding?.name || (isTr ? "Seçkin Mağaza" : "Store");
  const storeLogo = branding?.logo_url || "";
  const brandColor = branding?.primary_color || "#4f46e5";

  const [ssid, setSsid] = useState(initialSsid || branding?.wifi_ssid || "");
  const [password, setPassword] = useState(initialPassword || branding?.wifi_password || "");
  const [encryption, setEncryption] = useState<"WPA" | "nopass" | "WEP">("WPA");
  const [printFormat, setPrintFormat] = useState<"stand" | "a5" | "a4" | "thermal">("stand");
  const [themeStyle, setThemeStyle] = useState<"dark" | "light" | "brand">("brand");
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  if (!isOpen) return null;

  // Standard Wi-Fi QR Protocol String (Scannable by iOS & Android camera directly)
  const wifiQrString = encryption === "nopass" || !password.trim()
    ? `WIFI:T:nopass;S:${ssid.trim()};;`
    : `WIFI:T:${encryption};S:${ssid.trim()};P:${password.trim()};;`;

  const handleCopyInfo = () => {
    const text = isTr
      ? `📡 Wi-Fi Ağ Adı: ${ssid || '(Belirtilmedi)'}\n🔑 Wi-Fi Şifresi: ${password || '(Şifresiz)'}\n📍 ${storeName}`
      : `📡 Wi-Fi SSID: ${ssid || '(Not set)'}\n🔑 Wi-Fi Password: ${password || '(No password)'}\n📍 ${storeName}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (onSaveCredentials) {
      onSaveCredentials(ssid, password);
    }
  };

  const handlePrint = () => {
    handleSave();
    const printWindow = window.open("", "_blank", "width=850,height=900");
    if (!printWindow) {
      alert(isTr ? "Yazdırma penceresi açılamadı. Lütfen açılır pencerelere (pop-up) izin veriniz." : "Could not open print window. Please allow popups.");
      return;
    }

    const qrSvgElement = document.getElementById("wifi-modal-qr-code");
    const qrSvgHtml = qrSvgElement ? qrSvgElement.outerHTML : "";

    let dimensionsCss = "";
    if (printFormat === "thermal") {
      dimensionsCss = `
        @page { size: 80mm auto; margin: 3mm; }
        body { width: 74mm; font-family: monospace, sans-serif; background: #fff; color: #000; padding: 2mm; margin: 0 auto; text-align: center; }
        .thermal-box { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 4mm 0; margin: 3mm 0; }
        .qr-wrap { display: flex; justify-content: center; margin: 4mm auto; }
        .qr-wrap svg { width: 45mm !important; height: 45mm !important; }
        h1 { font-size: 14px; font-weight: 900; margin: 2mm 0; text-transform: uppercase; }
        h2 { font-size: 11px; font-weight: 800; margin: 1mm 0; }
        .cred { font-size: 12px; font-weight: 800; margin: 2mm 0; }
        .sub { font-size: 9px; margin-top: 2mm; color: #333; }
      `;
    } else if (printFormat === "a5") {
      dimensionsCss = `
        @page { size: A5 portrait; margin: 8mm; }
        body { width: 132mm; margin: 0 auto; padding: 6mm; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; }
        .card-container { border: 2px solid ${themeStyle === 'brand' ? brandColor : '#0f172a'}; border-radius: 16px; padding: 8mm 6mm; text-align: center; box-sizing: border-box; }
        .qr-wrap svg { width: 52mm !important; height: 52mm !important; }
      `;
    } else if (printFormat === "a4") {
      dimensionsCss = `
        @page { size: A4 portrait; margin: 15mm; }
        body { width: 180mm; margin: 0 auto; padding: 10mm; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; }
        .card-container { border: 3px solid ${themeStyle === 'brand' ? brandColor : '#0f172a'}; border-radius: 24px; padding: 14mm 10mm; text-align: center; box-sizing: border-box; }
        .qr-wrap svg { width: 75mm !important; height: 75mm !important; }
      `;
    } else {
      // Stand / Table Tent (100mm x 150mm)
      dimensionsCss = `
        @page { size: 105mm 148mm portrait; margin: 5mm; }
        body { width: 95mm; margin: 0 auto; padding: 4mm; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; }
        .card-container { border: 2px solid ${themeStyle === 'brand' ? brandColor : '#0f172a'}; border-radius: 14px; padding: 6mm 4mm; text-align: center; box-sizing: border-box; }
        .qr-wrap svg { width: 44mm !important; height: 44mm !important; }
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${isTr ? "Müşteri Wi-Fi QR Standı" : "Guest Wi-Fi QR Stand"} - ${storeName}</title>
          <style>
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            ${dimensionsCss}
            .logo-img { max-height: 48px; max-width: 140px; object-fit: contain; margin-bottom: 4px; }
            .badge { display: inline-block; background: ${themeStyle === 'brand' ? brandColor : '#0f172a'}; color: #fff; font-size: 10px; font-weight: 900; letter-spacing: 1px; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; margin-bottom: 6px; }
            .wifi-title { font-size: 16px; font-weight: 900; margin: 4px 0 2px 0; letter-spacing: -0.5px; }
            .wifi-subtitle { font-size: 11px; color: #475569; margin-bottom: 10px; }
            .qr-box { display: inline-block; background: #fff; padding: 8px; border: 1.5px solid #e2e8f0; border-radius: 12px; margin: 6px auto; }
            .info-table { width: 100%; max-width: 240px; margin: 8px auto 0 auto; border-collapse: collapse; background: #f8fafc; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
            .info-table td { padding: 5px 8px; font-size: 11px; text-align: left; }
            .info-table td.label { font-weight: 800; color: #64748b; width: 38%; font-size: 9px; text-transform: uppercase; }
            .info-table td.val { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 900; color: #0f172a; font-size: 12px; word-break: break-all; }
            .scan-tip { font-size: 9.5px; color: #64748b; margin-top: 8px; line-height: 1.3; font-weight: 600; }
            .footer-tag { font-size: 8px; color: #94a3b8; margin-top: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
          </style>
        </head>
        <body>
          ${printFormat === 'thermal' ? `
            <h1>${storeName}</h1>
            <h2>${isTr ? "MÜŞTERİ Wİ-Fİ AĞI" : "GUEST WI-FI"}</h2>
            <div class="thermal-box">
              <div class="qr-wrap">${qrSvgHtml}</div>
              <div class="cred">SSID: ${ssid || '-' }</div>
              <div class="cred">${isTr ? "ŞİFRE" : "PASS"}: ${password || (isTr ? "Şifresiz" : "Open")}</div>
            </div>
            <p class="sub">${isTr ? "Kameranızla QR kodu okutarak hızlıca bağlanabilirsiniz." : "Scan QR code with your phone camera to connect."}</p>
            <p class="sub" style="font-size: 8px;">LookPrice Wi-Fi Hub</p>
          ` : `
            <div class="card-container">
              ${storeLogo ? `<img src="${storeLogo}" class="logo-img" alt="${storeName}" />` : ''}
              <div class="badge">FREE WI-FI</div>
              <div class="wifi-title">${storeName}</div>
              <div class="wifi-subtitle">${isTr ? "Misafirlerimize Özel Ücretsiz Yüksek Hızlı İnternet" : "Complimentary High-Speed Guest Wi-Fi"}</div>
              
              <div class="qr-box">
                <div class="qr-wrap">${qrSvgHtml}</div>
              </div>

              <table class="info-table">
                <tr>
                  <td class="label">AĞ (SSID):</td>
                  <td class="val">${ssid || '-'}</td>
                </tr>
                <tr>
                  <td class="label">ŞİFRE:</td>
                  <td class="val">${password || (isTr ? 'Şifresiz / Açık' : 'Open / No Password')}</td>
                </tr>
              </table>

              ${showInstructions ? `
                <div class="scan-tip">
                  📱 <strong>${isTr ? "Nasıl Bağlanılır?" : "How to Connect?"}</strong><br/>
                  ${isTr ? "Telefonunuzun kamerasını QR koda tutarak şifre girmeden otomatik bağlanabilirsiniz." : "Point your phone camera at the QR code to connect automatically without typing."}
                </div>
              ` : ''}

              <div class="footer-tag">LOOKPRICE SECURE GUEST WI-FI</div>
            </div>
          `}
          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden border border-slate-200"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl">
              <Wifi className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                {isTr ? "Müşteri Wi-Fi QR & Masa Standı Merkezi" : "Guest Wi-Fi QR & Table Stand Hub"}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {isTr ? "Hazır Çıktı" : "Print Ready"}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                {isTr
                  ? "Müşterilerinizin şifre sormadan ve yazmadan tek tıkla Wi-Fi ağına bağlanmasını sağlayın"
                  : "Allow customers to connect to your Wi-Fi network instantly without asking or typing passwords"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body (2 Columns: Left Settings, Right Live Interactive Preview) */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-y-auto divide-y md:divide-y-0 md:divide-x divide-slate-100">
          
          {/* Left Column: Configuration Controls */}
          <div className="md:col-span-6 p-5 sm:p-6 space-y-4 bg-slate-50/50">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                1. {isTr ? "Wi-Fi Bağlantı Bilgileri" : "Wi-Fi Credentials"}
              </span>

              <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div>
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">
                    {isTr ? "Ağ Adı (SSID) *" : "Network Name (SSID) *"}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={ssid}
                      onChange={(e) => setSsid(e.target.value)}
                      placeholder={isTr ? "Örn: LookPrice_Guest" : "e.g. LookPrice_Guest"}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-0 outline-none"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Wifi className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">
                    {isTr ? "Wi-Fi Şifresi" : "Wi-Fi Password"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isTr ? "Şifre (Boş bırakılırsa şifresiz ağ)" : "Password (Leave blank for open network)"}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-0 outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                      {isTr ? "Güvenlik Türü" : "Security"}
                    </label>
                    <select
                      value={encryption}
                      onChange={(e: any) => setEncryption(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      <option value="WPA">WPA / WPA2 / WPA3</option>
                      <option value="nopass">{isTr ? "Şifresiz (Açık Ağ)" : "Open / No Pass"}</option>
                      <option value="WEP">WEP</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleCopyInfo}
                      className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{copied ? (isTr ? "Kopyalandı" : "Copied") : (isTr ? "Bilgileri Kopyala" : "Copy Info")}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Format & Style Selection */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                2. {isTr ? "Çıktı Formatı & Tasarım Şablonu" : "Print Format & Design"}
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "stand", label: isTr ? "Masa Standı" : "Table Stand", sub: "10x15 cm" },
                  { id: "a5", label: isTr ? "A5 Masa/Duvar" : "A5 Card", sub: "15x21 cm" },
                  { id: "a4", label: isTr ? "A4 Afiş/Poster" : "A4 Poster", sub: "21x30 cm" },
                  { id: "thermal", label: isTr ? "80mm Termal" : "80mm Slip", sub: "Fiş/Slip" },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setPrintFormat(fmt.id as any)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      printFormat === fmt.id
                        ? "border-indigo-600 bg-indigo-50/80 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className={`text-xs font-black ${printFormat === fmt.id ? "text-indigo-900" : "text-slate-800"}`}>
                      {fmt.label}
                    </div>
                    <div className="text-[9.5px] text-slate-400 font-medium">{fmt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Extra Options */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <label className="flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer">
                <span>{isTr ? "Kamera ile otomatik bağlanma talimatını göster" : "Show camera scan auto-connect guide"}</span>
                <input
                  type="checkbox"
                  checked={showInstructions}
                  onChange={(e) => setShowInstructions(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                />
              </label>
            </div>

            {/* Hint Box */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-start gap-2.5">
              <Smartphone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                {isTr
                  ? "Standart Wi-Fi QR protokolü kullanılmıştır. Müşterileriniz iPhone veya Android kameralarını bu koda tuttuklarında otomatik olarak ağa bağlanırlar."
                  : "Uses standard Wi-Fi QR protocol. Customers scanning with iPhone or Android camera connect directly to the network."}
              </p>
            </div>
          </div>

          {/* Right Column: Live Printable Visual Stand Preview */}
          <div className="md:col-span-6 p-5 sm:p-6 flex flex-col items-center justify-center bg-slate-100/70">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3 self-start">
              {isTr ? "Canlı Önizleme & Masaüstü Kartı" : "Live Stand & Card Preview"}
            </span>

            {/* Interactive Card Canvas */}
            <div
              className={`w-full max-w-[280px] sm:max-w-[310px] rounded-2xl p-5 text-center transition-all shadow-xl border ${
                printFormat === 'thermal'
                  ? 'bg-white text-slate-900 border-dashed border-slate-400 font-mono'
                  : 'bg-white text-slate-900 border-slate-200 ring-4 ring-slate-200/50'
              }`}
            >
              {storeLogo && printFormat !== 'thermal' && (
                <div className="flex justify-center mb-2">
                  <img src={storeLogo} alt={storeName} className="h-9 max-w-[120px] object-contain" />
                </div>
              )}

              <div className="inline-block bg-slate-900 text-white text-[9px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase mb-1.5">
                FREE WI-FI
              </div>

              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{storeName}</h4>
              <p className="text-[10px] text-slate-500 font-medium mb-3">
                {isTr ? "Misafir Wi-Fi Ağı" : "Guest Wi-Fi Network"}
              </p>

              {/* QR Code Container */}
              <div className="inline-block p-2.5 bg-white border border-slate-200 rounded-xl shadow-xs mx-auto mb-3">
                <QRCodeSVG
                  id="wifi-modal-qr-code"
                  value={wifiQrString}
                  size={140}
                  level="M"
                  marginSize={1}
                />
              </div>

              {/* Credentials Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-left space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">{isTr ? "AĞ ADI" : "SSID"}:</span>
                  <span className="font-mono font-black text-slate-900">{ssid || "-"}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">{isTr ? "ŞİFRE" : "PASS"}:</span>
                  <span className="font-mono font-black text-slate-900">
                    {password || (isTr ? "Şifresiz" : "Open")}
                  </span>
                </div>
              </div>

              {showInstructions && printFormat !== 'thermal' && (
                <p className="text-[9px] text-slate-400 font-medium mt-3 leading-snug">
                  📱 {isTr ? "Kameranızı QR koda tutarak otomatik bağlanın." : "Scan with camera to connect instantly."}
                </p>
              )}
            </div>

            {/* Print Action Buttons */}
            <div className="w-full max-w-[280px] sm:max-w-[310px] mt-4 flex gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>{isTr ? "Yazdır / PDF Al" : "Print / PDF"}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            {isTr ? "LookPrice Wi-Fi Standı & QR Paylaşım Sistemi" : "LookPrice Wi-Fi Stand & QR Sharing System"}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-all cursor-pointer"
            >
              {isTr ? "Kapat" : "Close"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
