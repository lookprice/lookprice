import React, { useState, useRef } from "react";
import { 
  X, 
  Printer, 
  Share2, 
  Send, 
  Eye, 
  FileText,
  User, 
  CreditCard, 
  Phone, 
  Calendar,
  CheckCircle,
  ShieldCheck,
  FileSignature,
  RotateCcw,
  Save,
  FileCheck
} from "lucide-react";
import { formatPhoneForWhatsApp } from "../utils/formatUtils";
import { renderSignatureOrStamp } from "../utils/contractTemplates";


interface AutoContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: any;
  storeName: string;
  branding?: any;
  onSaveContract?: (contractDoc: any) => Promise<void>;
}

export const AutoContractModal: React.FC<AutoContractModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  storeName,
  branding,
  onSaveContract
}) => {
  const [contractType, setContractType] = useState<'consignment' | 'booking'>('consignment');
  const [clientName, setClientName] = useState("");
  const [clientIdentity, setClientIdentity] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [commissionAmount, setCommissionAmount] = useState("2.5");
  const [depositAmount, setDepositAmount] = useState("");
  const [contractDate, setContractDate] = useState(new Date().toISOString().split('T')[0]);
  const [signedName, setSignedName] = useState("");
  const [isSigned, setIsSigned] = useState(false);
  const [previewMode, setPreviewMode] = useState<'editor' | 'code'>('editor');
  const [signatureImage, setSignatureImage] = useState<string>("");
  const [isSigningActive, setIsSigningActive] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef<boolean>(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'params' | 'preview'>('params');

  // Intercept Browser Back Button (popstate) & ESC key for smooth modal exit
  React.useEffect(() => {
    if (!isOpen) return;

    const stateObj = { modalOpen: true, modalType: "autoContractModal" };
    window.history.pushState(stateObj, "");

    const handlePopState = () => {
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("keydown", handleKeyDown);
      if (window.history.state?.modalOpen && window.history.state?.modalType === "autoContractModal") {
        window.history.back();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveContract = async () => {
    if (!clientName.trim() || !clientIdentity.trim() || !clientPhone.trim()) {
      alert("Lütfen Sözleşme'yi kaydetmeden önce '2. Müşteri & Sözleşme Detayları' alanındaki tüm bilgileri (Müşteri Tam Adı, Kimlik/Pasaport No ve Telefon Numarası) eksiksiz doldurunuz. Tarafı olmayan sözleşme kaydedilemez!");
      return;
    }
    if (!onSaveContract) {
      alert("Kaydetme özelliği aktif değil!");
      return;
    }
    setSaving(true);
    const newDoc = {
      type: contractType === 'consignment' ? 'Konsinye Satış Sözleşmesi' : 'Rezervasyon Protokolü',
      document_url: 'is_virtual_contract',
      expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
      notes: JSON.stringify({
        contractType,
        clientName,
        clientIdentity,
        clientPhone,
        commissionAmount,
        depositAmount,
        contractDate,
        signed: isSigned,
        signingName: signedName,
        signatureImage,
        displayName: storeName
      })
    };
    try {
      await onSaveContract(newDoc);
    } catch (err: any) {
      alert("Sözleşme kaydedilemedi: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Canvas drawing handlers for signature
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    isDrawing.current = true;
    const pos = getEventPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getEventPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1e1b4b"; // Indigo-950
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    setIsSigningActive(true);
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureImage("");
    setIsSigningActive(false);
  };

  const getEventPos = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const getDisplayStoreName = () => {
    const rawName = branding?.store_name || branding?.name || storeName || "";
    if (!rawName || rawName.toLowerCase().includes("lookprice")) {
      return "Seçkin Otomotiv";
    }
    return rawName;
  };

  const displayName = getDisplayStoreName();
  const displayPhone = branding?.phone || branding?.whatsapp_number || "+90 (5XX) 000 00 00";

  const numberToWords = (n: string) => {
    const num = parseInt(n.replace(/\./g, ''));
    if (isNaN(num)) return '';

    const currencyNames: { [key: string]: string } = {
      GBP: 'Sterlin',
      USD: 'Dolar',
      EUR: 'Euro',
      TRY: 'Türk Lirası',
      TL: 'Türk Lirası'
    };
    const currencySuffix = currencyNames[vehicle?.currency?.toUpperCase()] || 'Türk Lirası';

    if (num === 0) {
      return 'Sıfır ' + currencySuffix;
    }

    const birler = ['', 'Bir', 'İki', 'Üç', 'Dört', 'Beş', 'Altı', 'Yedi', 'Sekiz', 'Dokuz'];
    const onlar = ['', 'On', 'Yirmi', 'Otuz', 'Kırk', 'Elli', 'Altmış', 'Yetmiş', 'Seksen', 'Doksan'];
    const basamak = ['', 'Bin', 'Milyon', 'Milyar'];
    
    let words = '';
    let i = 0;
    let tempNum = num;

    while (tempNum > 0) {
        let b = tempNum % 1000;
        if (b > 0) {
            let s = '';
            let y = Math.floor(b / 100);
            let o = Math.floor((b % 100) / 10);
            let bi = b % 10;
            
            if (y > 0) s += (y > 1 ? birler[y] : '') + 'Yüz';
            s += onlar[o] + birler[bi];
            
            if (i === 1 && b === 1) s = 'Bin';
            else s += basamak[i];
            words = s + words;
        }
        tempNum = Math.floor(tempNum / 1000);
        i++;
    }
    return words + ' ' + currencySuffix;
  };

  if (!isOpen || !vehicle) return null;

  const vehicleDetails = `${vehicle.brand} ${vehicle.model} (${vehicle.year}) • Plaka: ${vehicle.plate || 'Belirtilmedi'} • Şasi: ${vehicle.chassis_number || 'Belirtilmedi'} • KM: ${(vehicle.current_mileage || 0).toLocaleString()}`;
  const currencySymbol = vehicle.currency === 'GBP' ? '£' : vehicle.currency === 'USD' ? '$' : vehicle.currency === 'EUR' ? '€' : '₺';
  const priceFormatted = `${currencySymbol}${(vehicle.selling_price || vehicle.buying_price || 0).toLocaleString()}`;
  const depositFormatted = depositAmount ? `${depositAmount} ${currencySymbol} (${numberToWords(depositAmount)})` : '[Kapora Tutarı]';

  const renderConsignmentHtml = () => `
<div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1e293b; line-height: 1.6;">
  <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px double #cbd5e1; padding-bottom: 20px;">
    <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">ARAÇ KONSİNYE GİRİŞ VE SATIŞ SÖZLEŞMESİ</h1>
    <h2 style="font-size: 13px; font-weight: bold; color: #64748b; margin: 5px 0 0 0; text-transform: uppercase;">CAR CONSIGNMENT & MARKETING MANDATE</h2>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px;">
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; width: 30%;">YETKİLİ GALERİ / DEALER</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${displayName}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold; width: 30%;">İletişim:</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${displayPhone}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">ARAÇ SAHİBİ / OWNER</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>${clientName || '[Araç Sahibi Adı]'}</strong></td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">T.C. / PASAPORT NO</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${clientIdentity || '[Kimlik / Pasaport]'}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">TELEFON / PHONE</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${clientPhone || '[Telefon Numarası]'}</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">KONSİNYE ARAÇ BİLGİSİ</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${vehicleDetails}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">HEDEF SATIŞ BEDELİ</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #1d4ed8;">${priceFormatted}</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">HİZMET KOMİSYONU / FEE</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">%${commissionAmount} + KDV</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">SÖZLEŞME TARİHİ / DATE</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${contractDate}</td>
    </tr>
  </table>

  <h3 style="font-size: 14px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 20px;">SÖZLEŞME MADDELERİ / STANDARD CONSIGNMENT CLAUSES</h3>
  <ol style="font-size: 11px; color: #334155; padding-left: 20px; text-align: justify; margin-bottom: 25px;">
    <li><strong>Teslimat Amacı:</strong> Hizmet alan, yukarıda özellikleri belirtilen aracını satılması amacıyla Galeri'ye (emanet) teslim etmiştir. Araç konsinye süresince Galeri showroom'unda muhafaza edilecektir.</li>
    <li><strong>Galeri Sorumlulukları:</strong> Galeri, aracı fiziki olarak korumakla, rutin iç ve dış temizliğini sağlamakla, internet portallarında fotoğraf ve video donatılarıyla ilan ve pazarlamasını yapmakla yükümlüdür.</li>
    <li><strong>Satış Yetkisi ve Komisyon:</strong> Araç satış bedelinin ödenmesine müteakip, Galeri hedef satış bedeli üzerinden <strong>%${commissionAmount}</strong> pazarlama ve aracılık ücretine hak kazanır. Hizmet alan, Galeri'yi devredışı bırakarak aracı bir başkasına satarsa da yine belirlenen bu komisyon tutarını ödemeyi kabul ve taahhüt eder.</li>
    <li><strong>Süre:</strong> Bu emanet pazarlama sözleşmesi imza tarihinden itibaren 30 (Otuz) gün süreyle geçerlidir.</li>
  </ol>

  <div style="margin-top: 45px; display: flex; justify-content: space-between; gap: 40px;">
    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 12px; padding: 15px; background-color: #f8fafc; text-align: center; min-height: 160px; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <span style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">YETKİLİ GALERİ ADINA</span>
        <span style="display: block; font-size: 10px; color: #94a3b8;">GALERİ YETKİLİ ADI</span>
      </div>
      <div style="font-size: 14px; font-weight: bold; color: #475569; font-style: italic;">
        ${displayName}
      </div>
      <div style="font-size: 10px; color: #64748b;">
        İletişim: ${displayPhone}
      </div>
      <div style="font-size: 9px; color: #94a3b8;">Kaşe & Güvenli İmza / Stamp</div>
    </div>

    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 12px; padding: 15px; background-color: #f8fafc; text-align: center; min-height: 160px; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <span style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">ARAÇ SAHİBİ / CONSULTANT</span>
        <span style="display: block; font-size: 10px; color: #94a3b8;">CLIENT / VEHICLE OWNER</span>
      </div>
      ${renderSignatureOrStamp(clientName, isSigned, signatureImage)}
      <div style="font-size: 9px; color: #94a3b8;">Onaylandı & Dijital Mühür Basıldı</div>
    </div>
  </div>
</div>
`;

  const renderBookingHtml = () => `
<div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1e293b; line-height: 1.6;">
  <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px double #cbd5e1; padding-bottom: 20px;">
    <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">ARAÇ SATIŞ REZERVASYON VE KAPORA PROTOKOLÜ</h1>
    <h2 style="font-size: 13px; font-weight: bold; color: #64748b; margin: 5px 0 0 0; text-transform: uppercase;">CAR BOOKING & RESERVATION协议</h2>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px;">
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; width: 30%;">ARACI GALERİ / DEALER</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${displayName}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold; width: 30%;">İletişim:</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${displayPhone}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">ALICI (Müşteri) / INVESTOR</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>${clientName || '[Alıcı Adı Soyadı]'}</strong></td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">T.C. / PASAPORT NO</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${clientIdentity || '[Kimlik / Pasaport Bilgisi]'}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">TELSİZ / PHONE</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${clientPhone || '[Telefon Numarası]'}</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">REZERVASYON ARAÇ DETAYI</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${vehicleDetails}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">TOPLAM ARAÇ BEDELİ</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #1d4ed8;">${priceFormatted}</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">ALINAN KAPORA TUTARI</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #e11d48;">${depositFormatted}</td>
    </tr>
  </table>

  <h3 style="font-size: 14px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">SÖZLEŞME ŞARTLARI</h3>
  <p style="font-size: 11px; color: #334155; text-align: justify;">
    Alıcı, yukarıda bahsi geçen aracı satın alma niyetiyle rezervasyon kaporası ödemiştir. Söz konusu araç 7 (Yedi) iş günü süresince Galeri tarafından satış dondurma statüsünde kilitli tutularak üçüncü kişilere pazarlanmayacaktır. 7 iş günü sonunda alıcının bakiye tutarı ödemeyerek vazgeçmesi halinde kapora iade edilmez, Galeri lehine gelir kaydedilir. Galeri satış prosedürü güvenle korunmuştur.
  </p>

  <div style="margin-top: 45px; display: flex; justify-content: space-between; gap: 40px;">
    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 12px; padding: 15px; background-color: #f8fafc; text-align: center; min-height: 160px; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <span style="font-size: 11px; font-weight: bold; color: #64748b;">ARACI / BROADCAST DEPT</span>
      </div>
      <div style="font-weight: bold; color: #475569;">${displayName}</div>
      <div style="font-size: 10px; color: #94a3b8;">${displayPhone}</div>
    </div>
    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 12px; padding: 15px; background-color: #f8fafc; text-align: center; min-height: 160px; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <span style="font-size: 11px; font-weight: bold; color: #64748b;">MÜŞTERİ / BUYER</span>
      </div>
      ${renderSignatureOrStamp(clientName, isSigned, signatureImage)}
    </div>
  </div>
</div>
`;

  const htmlContent = contractType === 'consignment' ? renderConsignmentHtml() : renderBookingHtml();

  const handlePrint = () => {
    if (!clientName.trim() || !clientIdentity.trim() || !clientPhone.trim()) {
      alert("Lütfen sözleşmeyi hazırlamak/yazdırmak için önce '2. Müşteri & Sözleşme Detayları' alanındaki tüm bilgileri (Ad Soyadı, Kimlik/Pasaport No ve Telefon Numarası) doldurun!");
      return;
    }
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.write(`
        <html>
          <head>
            <title>${contractType === 'consignment' ? 'Araç Emanet Sözleşmesi' : 'Araç Rezervasyon Protokolü'}</title>
            <style>
              body { font-family: sans-serif; background: white; margin: 40px; color: #1e293b; }
              @media print {
                body { margin: 0; padding: 20px; }
              }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  };

  const handleShareWhatsApp = () => {
    if (!clientName.trim() || !clientIdentity.trim() || !clientPhone.trim()) {
      alert("Lütfen sözleşmeyi WhatsApp üzerinden paylaşmadan önce '2. Müşteri & Sözleşme Detayları' alanındaki tüm bilgileri (Ad Soyadı, Kimlik/Pasaport No ve Telefon Numarası) doldurun!");
      return;
    }
    const formattedPhone = formatPhoneForWhatsApp(clientPhone);
    const contractTitle = contractType === 'consignment' ? 'Araç Emanet Sözleşmesi' : 'Araç Rezervasyon Protokolü';
    const message = `Sayın *${clientName || 'Müşterimiz'}*,\n\n*${vehicle.brand} ${vehicle.model}* marka aracınız için düzenlenen resmi *${contractTitle}* belgesi onayınıza sunulmuştur.\nBelgeyi mobil cihazınızdan incelemek ve parmağınızla dijital imza/onay vermek için lütfen aşağıdaki bağlantıya tıklayınız:\n\n🔗 ${window.location.origin}/contract/sign/vehicle-${vehicle.id}?client=${encodeURIComponent(clientName || '')}&phone=${encodeURIComponent(clientPhone)}&identity=${encodeURIComponent(clientIdentity)}&contractType=${contractType}\n\nSözleşme Tarihi: ${contractDate}\n\nSaygılarımızla,\n*${displayName}*\nİrtibat: ${displayPhone}`;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] w-full max-w-6xl h-[92vh] max-h-[92dvh] flex flex-col md:flex-row overflow-hidden shadow-2xl relative border border-slate-800/80">
        
        {/* Mobile Tab Bar & Header */}
        <div className="md:hidden flex items-center justify-between bg-slate-950 border-b border-slate-800 p-2.5 shrink-0 gap-2">
          <div className="flex bg-slate-900 p-1 rounded-xl gap-1 flex-1">
            <button
              onClick={() => setActiveMobileTab('params')}
              className={`flex-1 py-1.5 text-center text-xs font-black rounded-lg transition-all ${
                activeMobileTab === 'params' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sözleşme Bilgileri
            </button>
            <button
              onClick={() => setActiveMobileTab('preview')}
              className={`flex-1 py-1.5 text-center text-xs font-black rounded-lg transition-all ${
                activeMobileTab === 'preview' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sözleşme Ön İzleme
            </button>
          </div>

          <button 
            onClick={onClose}
            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-all shrink-0 active:scale-95 cursor-pointer"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Left Side Parameters */}
        <div className={`w-full md:w-[40%] bg-slate-950 p-4 sm:p-6 flex-col justify-between border-r border-slate-800 overflow-y-auto ${
          activeMobileTab === 'params' ? 'flex' : 'hidden md:flex'
        }`}>
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] bg-blue-600/20 text-blue-400 font-black tracking-widest px-2 py-0.5 rounded-md uppercase">Oto Galeri Legal CRM</span>
                <h3 className="text-xl font-black text-white mt-1">Galeri Sözleşme Jeneratörü</h3>
                <p className="text-slate-400 text-xs">Konsinye (Emanet) ve Alım-Satım Sözleşmeleri</p>
              </div>
              <button 
                onClick={onClose}
                className="hidden md:flex p-2 bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/80 hover:border-rose-500/30 rounded-xl transition-all shrink-0 cursor-pointer"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type selector */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">1. Sözleşme Tipi</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setContractType('consignment'); setIsSigned(false); }}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                    contractType === 'consignment' 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                      : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="text-xs font-black">Konsinye Satış Sözleşmesi</span>
                  <span className="text-[8px] opacity-80">Emanet araç giriş tutanağı</span>
                </button>
                <button
                  onClick={() => { setContractType('booking'); setIsSigned(false); }}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                    contractType === 'booking' 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                      : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="text-xs font-black">Rezervasyon / Kapora</span>
                  <span className="text-[8px] opacity-80">Sözleşmeli ön satış kilidi</span>
                </button>
              </div>
            </div>

            {/* Params form */}
            <div className="space-y-3.5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">2. Müşteri & Sözleşme Detayları</span>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 ml-1">Müşteri / Malik Adı Soyadı</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800 pl-9 pr-4 py-2 rounded-xl text-xs font-bold text-white focus:outline-none"
                      placeholder="Örn: Ahmet Kara"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 ml-1">Kimlik / Pasaport No</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="text"
                        className="w-full bg-slate-900 border border-slate-800 pl-9 pr-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none"
                        value={clientIdentity}
                        onChange={(e) => setClientIdentity(e.target.value)}
                        placeholder="Örn: Pasaport / TC"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 ml-1">Telefon Numarası</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="text"
                        className="w-full bg-slate-900 border border-slate-800 pl-9 pr-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none"
                        placeholder="Örn: +(90) 533 ... veya 0533..."
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 ml-1">Komisyon Tutarı (%)</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none"
                      value={commissionAmount}
                      onChange={(e) => setCommissionAmount(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 ml-1">Kapora Tutarı</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Örn: 10.000"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 ml-1">Sözleşme Tarihi</label>
                    <input 
                      type="date"
                      className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
                      value={contractDate}
                      onChange={(e) => setContractDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick drawing / signature button */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSignature className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider">Hızlı Dijital Onay İmza</span>
                </div>
                {isSigned && (
                  <button 
                    onClick={() => {
                      setIsSigned(false);
                      setSignatureImage("");
                      setIsSigningActive(false);
                    }}
                    className="text-[9px] text-slate-400 hover:text-white uppercase font-black tracking-wider transition-colors"
                  >
                    Yeniden Düzenle
                  </button>
                )}
              </div>
              
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Müşteriyle ofiste veya tablet üzerinden yan yanayken, ismini yazıp ekrana çizdirerek imzayı sözleşmeye anında monte edebilirsiniz.
              </p>

              {isSigned ? (
                <div className="space-y-2">
                  <div className="bg-emerald-950/40 border border-emerald-900/60 p-2.5 rounded-xl text-center text-xs text-emerald-400 font-bold flex flex-col items-center justify-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400" /> Dijital Damga & İmza Basıldı
                    </div>
                    <span className="text-[10px] text-slate-300">İmzalayan: {signedName}</span>
                    {signatureImage && (
                      <div className="mt-2 bg-white p-1.5 rounded-lg border border-slate-800/20 max-w-[120px]">
                        <img src={signatureImage} alt="Drawn signature" className="max-h-[40px] max-w-full block" />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400">Onaylayan Adı Soyadı / Name</label>
                    <input 
                      type="text" 
                      placeholder="Müşteri onay adı..." 
                      className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500"
                      value={signedName}
                      onChange={(e) => setSignedName(e.target.value)}
                    />
                  </div>

                  {/* Draw area */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-bold text-slate-400">Parmağıyla / Mouse ile İmzalasın</label>
                      <button 
                        onClick={clearCanvas}
                        type="button"
                        className="text-[9px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-0.5 uppercase"
                      >
                        <RotateCcw className="w-2.5 h-2.5" /> Temizle
                      </button>
                    </div>

                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-white relative">
                      <canvas 
                        ref={canvasRef}
                        width={300}
                        height={120}
                        className="w-full h-[110px] cursor-crosshair block touch-none"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                      {!isSigningActive && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                          <span className="text-[9px] font-black tracking-wider text-slate-400 uppercase flex items-center gap-1 animate-pulse">
                            ✍️ BURAYA PARMAKLA ÇİZDİRİN
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      if (!signedName.trim()) return alert("Lütfen onaylayacak kişinin adını yazın.");
                      if (!clientName.trim()) return alert("Lütfen sözleşme bilgilerini (Müşteri Adı) eksiksiz giriniz.");
                      if (!clientPhone.trim()) return alert("Lütfen sözleşme bilgilerini (Telefon) eksiksiz giriniz.");

                      const canvas = canvasRef.current;
                      if (canvas && isSigningActive) {
                        const dataUrl = canvas.toDataURL("image/png");
                        setSignatureImage(dataUrl);
                      } else {
                        return alert("Lütfen ekrana imzanızı atın.");
                      }
                      
                      setIsSigned(true);
                      setClientName(signedName);
                    }}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase rounded-xl transition-all"
                  >
                    Sözleşmeye Monte Et & Mühürle
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="text-[9px] text-slate-500 text-center mt-6">
            Premium Auto Dealer Legal Module • v4 Engine
          </p>
        </div>

        {/* Right Side Rendering */}
        <div className={`flex-1 bg-white flex-col justify-between overflow-hidden ${
          activeMobileTab === 'preview' ? 'flex' : 'hidden md:flex'
        }`}>
          
          <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-xl border border-blue-200/60 text-xs font-black shrink-0">
              <Eye className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline text-[11px] uppercase tracking-tight">Canlı Taslak</span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {onSaveContract && (
                <button 
                  onClick={handleSaveContract}
                  disabled={saving}
                  className="p-2 sm:px-3 sm:py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer shadow-xs active:scale-95"
                  title="Sözleşmeyi Kaydet"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden md:inline text-[11px] font-extrabold">{saving ? "..." : "Kaydet"}</span>
                </button>
              )}
              <button 
                onClick={handlePrint}
                className="p-2 sm:px-3 sm:py-2 bg-blue-50 text-blue-700 border border-blue-200/80 hover:bg-blue-100 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer active:scale-95"
                title="Yazdır / PDF"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden md:inline text-[11px] font-extrabold">Yazdır</span>
              </button>
              <button 
                onClick={handleShareWhatsApp}
                className="p-2 sm:px-3 sm:py-2 bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer active:scale-95"
                title="WhatsApp ile Paylaş"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden md:inline text-[11px] font-extrabold">WhatsApp</span>
              </button>

              <button 
                onClick={onClose}
                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl transition-all shrink-0 cursor-pointer active:scale-95 ml-1"
                title="Pencereyi Kapat (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-100/50">
            <div className="bg-white shadow-lg rounded-3xl border border-slate-200/80 overflow-hidden mx-auto max-w-3xl">
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>
          </div>

          <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button 
              onClick={onClose}
              className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
            >
              Kapat
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
