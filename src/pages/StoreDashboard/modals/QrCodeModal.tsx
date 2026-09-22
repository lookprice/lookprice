import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { X, QrCode, Globe, Check, Copy, Printer, Download, Scan } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface QrCodeModalProps {
  showQrModal: boolean;
  setShowQrModal: (show: boolean) => void;
  scanUrl: string;
  publicUrl: string;
  isPortfolio: boolean;
  isCafeRestaurant?: boolean;
  isShopLp?: boolean;
  handlePrintQR: () => void;
  qrPrintRef: React.RefObject<HTMLDivElement | null>;
  branding: any;
  lang: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  showQrModal,
  setShowQrModal,
  scanUrl,
  publicUrl,
  isPortfolio,
  isCafeRestaurant,
  handlePrintQR,
  qrPrintRef,
  branding,
  lang
}) => {
  const [copied, setCopied] = useState(false);
  const isTr = lang === 'tr';
  const isCafe = Boolean(
    isCafeRestaurant || 
    branding?.store_type === 'cafe_restaurant' || 
    branding?.page_layout_settings?.sector === 'cafe_restaurant'
  );
  const isShopOnly = !isPortfolio && !isCafe;

  const [qrTarget, setQrTarget] = useState<'scanner' | 'website'>(isShopOnly ? 'scanner' : 'website');
  const [qrViewMode, setQrViewMode] = useState<'poster' | 'card'>('poster');

  useEffect(() => {
    if (!isShopOnly && qrTarget !== 'website') {
      setQrTarget('website');
    }
  }, [isShopOnly, qrTarget]);

  if (!showQrModal) return null;

  const activeQrUrl = qrTarget === 'scanner' ? scanUrl : publicUrl;
  const storeDisplayName = branding.store_name || branding.name || (isTr ? "Seçkin Mağaza" : "Store");

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[94vh] flex flex-col overflow-hidden border border-slate-200"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                {isShopOnly 
                  ? (isTr ? "Mağaza İçi Fiyat Gör & QR Afiş Merkezi" : "In-Store Price Check & QR Hub")
                  : isCafe
                  ? (isTr ? "Dijital Menü & Web QR Afiş Merkezi" : "Digital Menu & Web QR Hub")
                  : (isTr ? "Web Portföy & Vitrin QR Afiş Merkezi" : "Web Showcase & Portfolio QR Hub")}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                {isShopOnly
                  ? (isTr 
                      ? "Müşterilerinizin kendi telefonlarıyla barkod okutup fiyat görmesini sağlayın"
                      : "Allow in-store customers to scan product barcodes and view prices on their phones")
                  : isCafe
                  ? (isTr
                      ? "Müşterilerinizin telefonlarıyla dijital menünüze ve ürün vitrininize hızlıca ulaşmasını sağlayın"
                      : "Allow customers to scan and view your live digital menu on their mobile devices")
                  : (isTr
                      ? "Müşterilerinizin güncel portföy ve ilan vitrininize telefonlarıyla anında ulaşmasını sağlayın"
                      : "Allow customers to scan and browse your property and vehicle showcase on mobile")}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowQrModal(false)} 
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Controls / Tabs */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {isShopOnly ? (
            <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setQrTarget('scanner')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  qrTarget === 'scanner' 
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-black' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Scan className="h-3.5 w-3.5" />
                <span>{isTr ? "📱 Fiyat Gör (Barkod Okuyucu)" : "📱 Price Checker"}</span>
              </button>
              <button
                type="button"
                onClick={() => setQrTarget('website')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  qrTarget === 'website' 
                    ? 'bg-indigo-600 text-white shadow-xs font-black' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>{isTr ? "🌐 Web Vitrini / Katalog" : "🌐 Web Store"}</span>
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-black text-slate-800 shadow-2xs">
              {isCafe ? (
                <>
                  <Globe className="h-3.5 w-3.5 text-amber-600" />
                  <span>{isTr ? "🍽️ Dijital Menü & Web Vitrini" : "🍽️ Digital Menu & Web Store"}</span>
                </>
              ) : (
                <>
                  <Globe className="h-3.5 w-3.5 text-indigo-600" />
                  <span>{isTr ? "🌐 Web Vitrini & Portföy" : "🌐 Web Showcase"}</span>
                </>
              )}
            </div>
          )}

          {/* View Mode (Poster vs Compact) */}
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setQrViewMode('poster')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                qrViewMode === 'poster' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Printer className="h-3.5 w-3.5 text-amber-400" />
              <span>{isTr ? "A4 Mağaza Afişi" : "A4 Poster"}</span>
            </button>
            <button
              type="button"
              onClick={() => setQrViewMode('card')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                qrViewMode === 'card' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <QrCode className="h-3.5 w-3.5 text-indigo-400" />
              <span>{isTr ? "Kompakt QR" : "Compact QR"}</span>
            </button>
          </div>
        </div>

        {/* Modal Body / Scroll Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100/60">
          
          {/* PRINTABLE A4 POSTER & STAND PREVIEW */}
          {qrViewMode === 'poster' && (
            <div className="flex flex-col items-center">
              <div 
                ref={qrPrintRef} 
                className="w-full max-w-[480px] bg-white rounded-3xl p-6 sm:p-8 shadow-md border-2 border-slate-300 text-slate-900 flex flex-col items-center text-center relative overflow-hidden"
                style={{ minHeight: '520px' }}
              >
                {/* Corner Accent Decorators */}
                <div className="absolute top-0 left-0 w-16 h-16 bg-amber-500/10 rounded-br-3xl -z-0"></div>
                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-bl-3xl -z-0"></div>

                {/* Store Logo & Branding */}
                <div className="relative z-10 flex flex-col items-center mb-4">
                  {branding.logo_url ? (
                    <img 
                      src={branding.logo_url} 
                      alt={storeDisplayName} 
                      className="h-12 max-w-[180px] object-contain mb-2"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-slate-900 text-amber-400 rounded-2xl flex items-center justify-center font-black text-xl mb-2 shadow-xs">
                      {storeDisplayName.charAt(0)}
                    </div>
                  )}
                  <h4 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                    {storeDisplayName}
                  </h4>
                  {branding.tagline && (
                    <p className="text-[11px] text-slate-500 font-medium italic mt-0.5">{branding.tagline}</p>
                  )}
                </div>

                {/* Poster Main Banner */}
                <div className="relative z-10 w-full bg-slate-900 text-white rounded-2xl p-3.5 mb-5 shadow-sm border border-slate-800">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-1">
                    {isShopOnly && qrTarget === 'scanner'
                      ? (isTr ? "📱 MAĞAZA İÇİ HIZLI SORGULAMA" : "📱 IN-STORE PRICE CHECK") 
                      : isCafe
                      ? (isTr ? "🍽️ DİJİTAL MENÜ & SİPARİŞ" : "🍽️ DIGITAL MENU & ORDER")
                      : (isTr ? "🌐 ONLİNE VİTRİN & KATALOG" : "🌐 ONLINE SHOWCASE")}
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight">
                    {isShopOnly && qrTarget === 'scanner'
                      ? (isTr ? "FİYAT GÖR & BARKOD OKUYUCU" : "SCAN & CHECK PRICE") 
                      : isCafe
                      ? (isTr ? "DİJİTAL MENÜMÜZÜ KEŞFEDİN" : "EXPLORE OUR DIGITAL MENU")
                      : (isTr ? "DİJİTAL PORTFÖYÜMÜZÜ KEŞFEDİN" : "EXPLORE OUR DIGITAL PORTFOLIO")}
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-1 font-medium">
                    {isShopOnly && qrTarget === 'scanner'
                      ? (isTr ? "Ürün üzerindeki barkodu telefonunuzla okutun, fiyat ve detayları anında görün!" : "Scan the product barcode with your phone to instantly see prices and details!") 
                      : isCafe
                      ? (isTr ? "QR kodu okutarak güncel menümüzü, fiyatlarımızı ve lezzetlerimizi anında inceleyin." : "Scan the QR code to instantly explore our live menu, prices, and specials.")
                      : (isTr ? "Tüm ürünlerimizi ve güncel ilanlarımızı online inceleyin." : "Browse our full product showcase and latest listings online.")}
                  </p>
                </div>

                {/* QR Code Canvas */}
                <div className="relative z-10 p-4 bg-white rounded-2xl shadow-inner border-2 border-dashed border-amber-400/60 mb-5 flex flex-col items-center">
                  <QRCodeSVG 
                    value={activeQrUrl}
                    size={210}
                    style={{ width: '100%', height: 'auto', maxWidth: '210px' }}
                    level="H"
                    includeMargin={true}
                    imageSettings={branding.logo_url ? {
                      src: branding.logo_url,
                      x: undefined,
                      y: undefined,
                      height: 38,
                      width: 38,
                      excavate: true,
                    } : undefined}
                  />
                  <div className="mt-2 text-[10px] font-mono font-bold text-slate-500 tracking-wider">
                    {activeQrUrl}
                  </div>
                </div>

                {/* 3 Step Instruction Guide */}
                <div className="relative z-10 w-full grid grid-cols-3 gap-2 mb-4 text-left">
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex flex-col items-center text-center">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center mb-1">1</span>
                    <p className="text-[10px] font-bold text-slate-900 leading-tight">
                      {isTr ? "Kamerayı Açın" : "Open Camera"}
                    </p>
                    <p className="text-[9px] text-slate-500 leading-tight mt-0.5">
                      {isTr ? "Bu QR kodu telefonunuzla okutun" : "Scan this QR with your phone"}
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex flex-col items-center text-center">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center mb-1">2</span>
                    <p className="text-[10px] font-bold text-slate-900 leading-tight">
                      {isShopOnly && qrTarget === 'scanner' 
                        ? (isTr ? "Barkodu Tutun" : "Scan Barcode") 
                        : isCafe
                        ? (isTr ? "Menüyü İnceleyin" : "Browse Menu")
                        : (isTr ? "Kataloğu Gezin" : "Browse Store")}
                    </p>
                    <p className="text-[9px] text-slate-500 leading-tight mt-0.5">
                      {isShopOnly && qrTarget === 'scanner' 
                        ? (isTr ? "Ürün barkodunu ekrana gösterin" : "Hold barcode to camera") 
                        : isCafe
                        ? (isTr ? "Yiyecek & içecekleri keşfedin" : "Explore foods and drinks")
                        : (isTr ? "Kategorileri inceleyin" : "Browse all items")}
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex flex-col items-center text-center">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center mb-1">3</span>
                    <p className="text-[10px] font-bold text-slate-900 leading-tight">
                      {isShopOnly && qrTarget === 'scanner' 
                        ? (isTr ? "Fiyatı Görün" : "View Price") 
                        : isCafe
                        ? (isTr ? "Sipariş Verin" : "Order / Enjoy")
                        : (isTr ? "İletişime Geçin" : "Contact / Order")}
                    </p>
                    <p className="text-[9px] text-slate-500 leading-tight mt-0.5">
                      {isShopOnly && qrTarget === 'scanner' 
                        ? (isTr ? "Fiyat ve stok anında karşınızda" : "Real-time price & stock details") 
                        : isCafe
                        ? (isTr ? "Garsona iletin veya sipariş verin" : "Order with your waiter or online")
                        : (isTr ? "Detayları görün ve sipariş verin" : "View details & order easily")}
                    </p>
                  </div>
                </div>

                {/* Poster Footer: Address, Phone */}
                <div className="relative z-10 w-full pt-3 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500">
                  <div className="text-left truncate max-w-[240px]">
                    {branding.address && <p className="truncate font-medium">{branding.address}</p>}
                    {(branding.phone || branding.whatsapp_number) && (
                      <p className="font-bold text-slate-700">📞 {branding.phone || branding.whatsapp_number}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-black text-slate-700 uppercase tracking-wider">lookprice.net</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* COMPACT CARD & QUICK SHARE VIEW */}
          {qrViewMode === 'card' && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner shrink-0 flex flex-col items-center">
                <QRCodeSVG 
                  value={activeQrUrl}
                  size={180}
                  level="H"
                  includeMargin={true}
                />
                <span className="mt-2 text-[10px] font-mono text-slate-400 font-bold uppercase">
                  {isShopOnly && qrTarget === 'scanner' ? 'Barkod Scanner' : isCafe ? 'Dijital Menü' : 'Web Vitrin'}
                </span>
              </div>

              <div className="space-y-4 flex-1 text-left w-full">
                <div>
                  <h4 className="text-base font-black text-slate-900">
                    {isShopOnly && qrTarget === 'scanner' 
                      ? (isTr ? "Mağaza Fiyat Gör Bağlantısı" : "Price Checker URL") 
                      : isCafe
                      ? (isTr ? "Dijital Menü Bağlantısı" : "Digital Menu URL")
                      : (isTr ? "Mağaza Web Vitrini Bağlantısı" : "Store Website URL")}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isShopOnly && qrTarget === 'scanner'
                      ? (isTr 
                          ? "Bu bağlantıyı doğrudan müşterilerinizle paylaşabilir veya barkod kiosk cihazlarınıza tanımlayabilirsiniz."
                          : "Share this link directly with customers or set it on in-store tablet kiosks.")
                      : isCafe
                      ? (isTr
                          ? "Bu bağlantıyı müşterilerinizle paylaşabilir veya restoran masalarındaki QR aparatlarına tanımlayabilirsiniz."
                          : "Share this link directly with guests or use it for table QR standees.")
                      : (isTr
                          ? "Bu bağlantıyı müşterilerinizle paylaşabilir veya ilan vitrinlerinizde kullanabilirsiniz."
                          : "Share this link directly with clients or use it on your display stands.")}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-indigo-600 font-bold truncate flex-1">
                    {activeQrUrl}
                  </span>
                  <button 
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(activeQrUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                    <span>{copied ? (isTr ? "Kopyalandı" : "Copied") : (isTr ? "Kopyala" : "Copy")}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <a 
                    href={activeQrUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Globe className="h-4 w-4" />
                    <span>{isTr ? "Sayfayı Canlı Test Et" : "Test Live Page"}</span>
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            {isTr 
              ? "💡 Standart A4 kağıda yazdırıp mağaza reyonlarına, masalara veya kasaya asabilirsiniz." 
              : "💡 Print on A4 to display on shelves, tables, or cashier counter."}
          </div>

          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => {
                const svg = qrPrintRef.current?.querySelector('svg');
                if (svg) {
                  const svgData = new XMLSerializer().serializeToString(svg);
                  const canvas = document.createElement("canvas");
                  const ctx = canvas.getContext("2d");
                  const img = new Image();
                  img.onload = () => {
                    canvas.width = img.width * 2;
                    canvas.height = img.height * 2;
                    ctx?.scale(2, 2);
                    ctx?.drawImage(img, 0, 0);
                    const pngFile = canvas.toDataURL("image/png");
                    const downloadLink = document.createElement("a");
                    const fileSuffix = isShopOnly && qrTarget === 'scanner' ? 'Fiyat_Gor' : isCafe ? 'Dijital_Menu' : 'Web_Vitrin';
                    downloadLink.download = `${storeDisplayName}_${fileSuffix}_QR.png`;
                    downloadLink.href = pngFile;
                    downloadLink.click();
                  };
                  img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
                }
              }}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>{isTr ? "PNG İndir" : "Download PNG"}</span>
            </button>

            <button 
              type="button"
              onClick={handlePrintQR} 
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>{isTr ? "Afişi Yazdır (A4 / Stand)" : "Print Poster (A4)"}</span>
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
