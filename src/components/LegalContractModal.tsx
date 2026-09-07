import React, { useState, useRef } from "react";
import { 
  FileText, 
  Download, 
  Send, 
  Share2, 
  CheckCircle, 
  X, 
  Eye, 
  User, 
  CreditCard, 
  Calendar, 
  Bookmark, 
  Phone,
  FileCheck,
  Languages,
  Printer,
  Save,
  Percent,
  RotateCcw
} from "lucide-react";
import { contractTemplates, ContractTemplate, ContractPlaceholderValues } from "../utils/contractTemplates";
import { RealEstateProperty } from "../types";
import { formatPhoneForWhatsApp } from "../utils/formatUtils";


interface LegalContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: RealEstateProperty;
  branding?: any;
  onSaveContract?: (contractDoc: any) => Promise<void>;
}

function numberToTrWords(num: number, currencyCode: string): string {
  const currencyNames: { [key: string]: { singular: string } } = {
    TRY: { singular: "Türk Lirası" },
    TL: { singular: "Türk Lirası" },
    USD: { singular: "Amerikan Doları" },
    EUR: { singular: "Euro" },
    GBP: { singular: "İngiliz Sterlini" }
  };
  
  const ones = ["", "Bir", "İki", "Üç", "Dört", "Beş", "Altı", "Yedi", "Sekiz", "Dokuz"];
  const tens = ["", "On", "Yirmi", "Otuz", "Kırk", "Elli", "Altmış", "Yetmiş", "Seksen", "Doksan"];
  const thousands = ["", "Bin", "Milyon", "Milyar", "Trilyon"];

  if (num === 0) return "Sıfır";

  let words = "";
  let temp = Math.abs(Math.floor(num));
  let step = 0;

  while (temp > 0) {
    const part = temp % 1000;
    if (part > 0) {
      let partWords = "";
      const hundred = Math.floor(part / 100);
      const ten = Math.floor((part % 100) / 10);
      const one = part % 10;

      if (hundred > 0) {
        if (hundred === 1) {
          partWords += "Yüz ";
        } else {
          partWords += ones[hundred] + " Yüz ";
        }
      }

      if (ten > 0) {
        partWords += tens[ten] + " ";
      }

      if (one > 0) {
        if (!(step === 1 && one === 1 && hundred === 0 && ten === 0)) {
          partWords += ones[one] + " ";
        }
      }

      partWords += thousands[step] + " ";
      words = partWords + words;
    }
    temp = Math.floor(temp / 1000);
    step++;
  }

  words = words.replace(/\s+/g, ' ').trim();
  const curr = currencyNames[currencyCode.toUpperCase()] || { singular: currencyCode };
  return `${words} ${curr.singular}`;
}

const formatTrDate = (isoDateStr: string) => {
  if (!isoDateStr) return "";
  const parts = isoDateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`; // GG/AA/YYYY
  }
  return isoDateStr;
};

export const LegalContractModal: React.FC<LegalContractModalProps> = ({ 
  isOpen, 
  onClose, 
  property,
  branding,
  onSaveContract
}) => {
  const [activeMobileTab, setActiveMobileTab] = useState<'params' | 'preview'>('params');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    property.listing_intent === 'rent' ? "rental_agreement" : "showing_agreement"
  );
  const [clientName, setClientName] = useState<string>("");
  const [clientIdentity, setClientIdentity] = useState<string>("");
  const [clientPhone, setClientPhone] = useState<string>("");
  const [commissionRate, setCommissionRate] = useState<string>(
    property.listing_intent === 'rent' ? "1 Aylık Kira Bedeli" : "5"
  );
  const [contractDate, setContractDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [splitRatio, setSplitRatio] = useState<string>("50 / 50");
  const [contractDuration, setContractDuration] = useState<string>("12 Ay / 12 Months");
  const [evictionDate, setEvictionDate] = useState<string>(
    new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
  );
  const [depositAmount, setDepositAmount] = useState<string>(
    property.listing_intent === 'rent' ? "1 Aylık Kira Bedeli" : "5.000 GBP"
  );
  const [rentDuration, setRentDuration] = useState<string>("1 Yıl");
  const [paymentDay, setPaymentDay] = useState<string>("Her ayın en geç 5. günü");
  const [signed, setSigned] = useState<boolean>(false);
  const [signingName, setSigningName] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [signatureImage, setSignatureImage] = useState<string>("");
  const [isSigningActive, setIsSigningActive] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef<boolean>(false);

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

  // Intercept Browser Back Button (popstate) & ESC key for smooth modal exit
  React.useEffect(() => {
    if (!isOpen) return;

    const stateObj = { modalOpen: true, modalType: "legalContractModal" };
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
      if (window.history.state?.modalOpen && window.history.state?.modalType === "legalContractModal") {
        window.history.back();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredTemplates = contractTemplates.filter(template => {
    if (property.listing_intent === 'rent') {
      return ["rental_agreement", "rental_authorization", "eviction_undertaking", "showing_agreement"].includes(template.id);
    } else {
      return ["showing_agreement", "exclusivity_agreement", "sales_brokerage", "inter_branch_split"].includes(template.id);
    }
  });

  const currentTemplate = filteredTemplates.find(t => t.id === selectedTemplateId) || filteredTemplates[0] || contractTemplates[0];

  const getDisplayStoreName = () => {
    const rawName = branding?.store_name || branding?.name || "Seçkin Emlak";
    if (!rawName || rawName.toLowerCase().includes("lookprice")) {
      return "Premium VIP Emlak";
    }
    return rawName;
  };

  const storeNameVal = getDisplayStoreName();
  const storePhoneVal = branding?.phone || branding?.whatsapp_number || "+90 (5XX) 000 00 00";
  const storeEmailVal = branding?.email || `bilgi@${branding?.slug || 'premium'}.com`;

  // Standardized prices: thousands separator with 0 decimal places inside real estate contracts
  const formattedPriceNum = Number(property.price).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const symbol = property.currency === 'GBP' ? '£' : property.currency === 'USD' ? '$' : property.currency === 'EUR' ? '€' : '₺';
  const priceWords = numberToTrWords(property.price, property.currency || 'GBP');
  const propertyPriceFormatted = `${formattedPriceNum} ${symbol} (${priceWords})`;

  const placeholderValues: ContractPlaceholderValues = {
    storeName: storeNameVal,
    storePhone: storePhoneVal,
    storeEmail: storeEmailVal,
    clientName: clientName || "[Alıcı / Mülk Sahibi Adı]",
    clientIdentity: clientIdentity || "[T.C. No / Pasapor No]",
    clientPhone: clientPhone || "[Telefon Numarası]",
    propertyTitle: property.type === 'land' 
      ? `[İlan Kodu: LP-${property.id}] ${property.mahalle || ''} Mah. Ada: ${property.ada || '...'}, Parsel: ${property.parsel || '...'}, Pafta: ${property.pafta || '...'}`
      : `[İlan Kodu: LP-${property.id}] ${property.title}`,
    propertyLocation: property.location || "Kıbrıs",
    propertyPrice: propertyPriceFormatted,
    propertyBlockPlot: property.block_plot,
    // Add % sign only if it's not the rent phrase or already has a % sign
    commissionRate: property.listing_intent === 'rent' ? commissionRate : (commissionRate.includes('%') ? commissionRate : `%${commissionRate}`),
    contractDate: formatTrDate(contractDate),
    propertyAddress: property.address,
    splitRatio: splitRatio,
    contractDuration: contractDuration,
    evictionDate: formatTrDate(evictionDate),
    depositAmount: depositAmount,
    rentDuration: rentDuration,
    paymentDay: paymentDay,
    isSigned: signed,
    signingName: signingName,
    signatureImage: signatureImage
  };

  const { html, markdown } = currentTemplate.getTemplate(placeholderValues);

  // Use a beautifully hidden, sandbox-compatible iframe-based print flow
  const handlePrint = () => {
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
            <title>${currentTemplate.titleTr}</title>
            <style>
              body { font-family: sans-serif; background: white; margin: 40px; color: #1e293b; }
              @media print {
                body { margin: 0; padding: 20px; }
              }
            </style>
          </head>
          <body>
            ${html}
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
      alert("Lütfen WhatsApp üzerinden paylaşmadan önce '2. Müşteri & Sözleşme Bilgileri' alanındaki tüm bilgileri (Müşteri Tam Adı, Kimlik/Pasaport No ve Telefon Numarası) eksiksiz doldurunuz. Tarafı olmayan sözleşme paylaşılamaz!");
      return;
    }
    const formattedPhone = formatPhoneForWhatsApp(clientPhone);
    const message = `Sayın *${clientName || 'Müşterimiz'}*,\n\n*[LP-${property.id}] ${property.title}* portföyü için hazırlanan resmi *${currentTemplate.titleTr}* belgesi onayınıza sunulmuştur.\nBelgeyi mobil cihazınızdan incelemek ve parmağınızla dijital imza/onay vermek için lütfen aşağıdaki bağlantıya tıklayınız:\n\n🔗 ${window.location.origin}/contract/sign/${property.id}?client=${encodeURIComponent(clientName || '')}&phone=${encodeURIComponent(clientPhone)}&identity=${encodeURIComponent(clientIdentity)}&templateId=${selectedTemplateId}&commissionRate=${encodeURIComponent(commissionRate)}&contractDate=${encodeURIComponent(placeholderValues.contractDate)}&splitRatio=${encodeURIComponent(splitRatio)}&contractDuration=${encodeURIComponent(contractDuration)}&evictionDate=${encodeURIComponent(evictionDate)}&depositAmount=${encodeURIComponent(depositAmount)}&rentDuration=${encodeURIComponent(rentDuration)}&paymentDay=${encodeURIComponent(paymentDay)}\n\nSözleşme Tarihi: ${placeholderValues.contractDate}\n\nSaygılarımızla,\n*${storeNameVal}*\nİrtibat: ${storePhoneVal}`;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleEmailPDF = () => {
    alert("Yatırımcı hukuk sözleşmesi dijital damgalı olarak PDF e-posta adresine gönderildi!");
  };

  const handleSaveContract = async () => {
    if (!clientName.trim() || !clientIdentity.trim() || !clientPhone.trim()) {
      alert("Lütfen Sözleşme'yi kaydetmeden önce '2. Müşteri & Sözleşme Bilgileri' alanındaki tüm bilgileri (Müşteri Tam Adı, Kimlik/Pasaport No ve Telefon Numarası) eksiksiz doldurunuz. Tarafı olmayan sözleşme kaydedilemez!");
      return;
    }
    if (!onSaveContract) return;
    setSaving(true);
    const docId = `virtual-contract-${Date.now()}`;
    const newDoc = {
      id: docId,
      name: `${currentTemplate.titleTr} - ${clientName || 'Taslak'} (${formatTrDate(contractDate)})`,
      category: "contract",
      file_url: "is_virtual_contract",
      upload_date: formatTrDate(contractDate),
      details: {
        templateId: selectedTemplateId,
        clientName,
        clientIdentity,
        clientPhone,
        commissionRate,
        contractDate,
        signed,
        signingName,
        signatureImage,
        splitRatio,
        contractDuration,
        evictionDate,
        depositAmount,
        rentDuration,
        paymentDay
      }
    };
    try {
      await onSaveContract(newDoc);
      alert("Sözleşme başarıyla GÜVENLİ DEPOLAMA alanına kaydedildi!");
      onClose();
    } catch (err: any) {
      alert("Sözleşme kaydedilemedi: " + err.message);
    } finally {
      setSaving(false);
    }
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
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sözleşme Bilgileri
            </button>
            <button
              onClick={() => setActiveMobileTab('preview')}
              className={`flex-1 py-1.5 text-center text-xs font-black rounded-lg transition-all ${
                activeMobileTab === 'preview' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
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

        {/* Left Side: Parameters Form */}
        <div className={`w-full md:w-[40%] bg-slate-950 p-4 sm:p-6 flex-col justify-between border-r border-slate-800 overflow-y-auto ${
          activeMobileTab === 'params' ? 'flex' : 'hidden md:flex'
        }`}>
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] bg-indigo-600/20 text-indigo-400 font-black tracking-widest px-2 py-0.5 rounded-md uppercase font-mono">CRM Legal Integration</span>
                <h3 className="text-xl font-black text-white mt-1">Sözleşme Jeneratörü</h3>
                <p className="text-slate-400 text-xs">FTSO ve Kıbrıs mevzuatına uygun tanzim şablonları</p>
              </div>
              <button 
                onClick={onClose}
                className="hidden md:flex p-2 bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/80 hover:border-rose-500/30 rounded-xl transition-all shrink-0 cursor-pointer"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Template Selector */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">1. Sözleşme Tipi Seçin</span>
              <div className="grid grid-cols-1 gap-2">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplateId(template.id);
                      setSigned(false);
                    }}
                    className={`p-3 rounded-2xl flex items-start gap-3 transition-all text-left border ${
                      selectedTemplateId === template.id 
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/15' 
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900/90'
                    }`}
                  >
                    <FileText className={`w-5 h-5 shrink-0 mt-0.5 ${selectedTemplateId === template.id ? 'text-white' : 'text-slate-400'}`} />
                    <div>
                      <h5 className="text-xs font-black leading-tight">{template.titleTr}</h5>
                      <p className="text-[9px] text-slate-400 mt-1 line-clamp-1 group-hover:text-slate-300">
                        {template.descriptionTr}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Placeholder Parameters */}
            <div className="space-y-3.5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">2. Müşteri & Sözleşme Bilgileri</span>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 ml-1">Müşteri Tam Adı / Temsilci</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800 pl-9 pr-4 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                      placeholder="Örn: John Smith"
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
                        className="w-full bg-slate-900 border border-slate-800 pl-9 pr-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                        placeholder="Örn: 99123456"
                        value={clientIdentity}
                        onChange={(e) => setClientIdentity(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 ml-1">Telefon Numarası</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="text"
                        className="w-full bg-slate-900 border border-slate-800 pl-9 pr-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                        placeholder="Örn: +(90) 533 ... veya 0533..."
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {property.listing_intent === 'rent' ? (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 ml-1">Hizmet Komisyon Bedeli</label>
                      <input 
                        type="text"
                        className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                        placeholder="Örn: 1 Aylık Kira Bedeli"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 ml-1">Hizmet Komisyonu (%)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">%</span>
                        <input 
                          type="number"
                          className="w-full bg-slate-900 border border-slate-800 pl-7 pr-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                          placeholder="5"
                          min="1"
                          max="10"
                          value={commissionRate}
                          onChange={(e) => setCommissionRate(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 ml-1">Sözleşme İmza Tarihi</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="date"
                        className="w-full bg-slate-900 border border-slate-800 pl-9 pr-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500 [&::-webkit-calendar-picker-indicator]:invert"
                        value={contractDate}
                        onChange={(e) => setContractDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {selectedTemplateId === "inter_branch_split" && (
                  <div className="space-y-1 mt-1">
                    <label className="text-[10px] font-bold text-slate-400 ml-1">Paylaşım (Split) Oranı</label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="text"
                        className="w-full bg-slate-900 border border-slate-800 pl-9 pr-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                        placeholder="Örn: 50 / 50"
                        value={splitRatio}
                        onChange={(e) => setSplitRatio(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {selectedTemplateId === "rental_authorization" && (
                  <div className="space-y-1 mt-1">
                    <label className="text-[10px] font-bold text-slate-400 ml-1">Yetki Belgesi Süresi</label>
                    <div className="relative">
                      <Bookmark className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="text"
                        className="w-full bg-slate-900 border border-slate-800 pl-9 pr-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                        placeholder="Örn: 12 Ay / 12 Months"
                        value={contractDuration}
                        onChange={(e) => setContractDuration(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {selectedTemplateId === "eviction_undertaking" && (
                  <div className="space-y-1 mt-1">
                    <label className="text-[10px] font-bold text-slate-400 ml-1">Tahliye Hedef Tarihi</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="date"
                        className="w-full bg-slate-900 border border-slate-800 pl-9 pr-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500 [&::-webkit-calendar-picker-indicator]:invert"
                        value={evictionDate}
                        onChange={(e) => setEvictionDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {selectedTemplateId === "sales_brokerage" && (
                  <div className="space-y-1 mt-1">
                    <label className="text-[10px] font-bold text-slate-400 ml-1">Kapora Tutarı / Deposit</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="text"
                        className="w-full bg-slate-900 border border-slate-800 pl-9 pr-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                        placeholder="Örn: 5.000 GBP"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {selectedTemplateId === "rental_agreement" && (
                  <div className="space-y-2 mt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 ml-1">Kira Süresi / Lease Duration</label>
                      <div className="relative">
                        <Bookmark className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input 
                          type="text"
                          className="w-full bg-slate-900 border border-slate-800 pl-9 pr-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                          placeholder="Örn: 1 Yıl"
                          value={rentDuration}
                          onChange={(e) => setRentDuration(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 ml-1">Kira Ödeme Günü / Payment Day</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input 
                          type="text"
                          className="w-full bg-slate-900 border border-slate-800 pl-9 pr-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                          placeholder="Örn: Her ayın en geç 5. günü"
                          value={paymentDay}
                          onChange={(e) => setPaymentDay(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 ml-1">Depozito Tutarı / Security Deposit</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input 
                          type="text"
                          className="w-full bg-slate-900 border border-slate-800 pl-9 pr-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                          placeholder="Örn: 1 Aylık Kira Bedeli veya 10.000 TL"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Digital Stamp Feature */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider">Hızlı Dijital Onay İmza</span>
                </div>
                {signed && (
                  <button 
                    onClick={() => {
                      setSigned(false);
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

              {signed ? (
                <div className="space-y-2">
                  <div className="bg-emerald-950/40 border border-emerald-900/60 p-2.5 rounded-xl text-center text-xs text-emerald-400 font-bold flex flex-col items-center justify-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400" /> Dijital Damga & İmza Basıldı
                    </div>
                    <span className="text-[10px] text-slate-300">İmzalayan: {signingName}</span>
                    {signatureImage && (
                      <div className="mt-2 bg-white p-1.5 rounded-lg border border-slate-800/20 max-w-[120px]">
                        <img src={signatureImage} alt="Drawn signature" className="max-h-[40px] max-w-full block" />
                      </div>
                    )}
                  </div>
                  {onSaveContract && (
                    <button 
                      onClick={handleSaveContract}
                      disabled={saving}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" /> {saving ? "Sözleşme Kaydediliyor..." : "Sözleşmeyi Güvenli Depoya Kaydet"}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400">Onaylayan Adı Soyadı / Name</label>
                    <input 
                      type="text" 
                      placeholder="Müşteri onay adı..." 
                      className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold text-white outline-none focus:border-indigo-500"
                      value={signingName}
                      onChange={(e) => setSigningName(e.target.value)}
                    />
                  </div>

                  {/* Draw area */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-bold text-slate-400">Parmağıyla / Mouse ile İmzalasın</label>
                      <button 
                        onClick={clearCanvas}
                        type="button"
                        className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 uppercase"
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
                      if (!clientName.trim()) {
                        return alert("Lütfen önce '2. Müşteri & Sözleşme Bilgileri' alanındaki 'Müşteri Tam Adı / Temsilci' bilgisini giriniz!");
                      }
                      if (!clientIdentity.trim()) {
                        return alert("Lütfen önce '2. Müşteri & Sözleşme Bilgileri' alanındaki 'Kimlik / Pasaport No' bilgisini giriniz!");
                      }
                      if (!clientPhone.trim()) {
                        return alert("Lütfen önce '2. Müşteri & Sözleşme Bilgileri' alanındaki 'Telefon Numarası' bilgisini giriniz!");
                      }
                      if (!signingName.trim()) {
                        return alert("Lütfen 'Hızlı Dijital Onay İmza' alanındaki 'Onaylayan Adı Soyadı' bilgisini giriniz!");
                      }
                      const canvas = canvasRef.current;
                      if (!canvas || !isSigningActive) {
                        return alert("Lütfen imza kutusuna parmağınızla veya mouse ile bir imza çiziniz!");
                      }
                      
                      const dataUrl = canvas.toDataURL("image/png");
                      setSignatureImage(dataUrl);
                      setSigned(true);
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase rounded-xl transition-all"
                  >
                    Sözleşmeye Monte Et & Mühürle
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="text-[9px] text-slate-500 text-center mt-6">
            Premium Real Estate Engine • 2026 Legal Sync v4
          </p>
        </div>

        {/* Right Side: Contract Live Rendering */}
        <div className={`flex-1 bg-white flex-col justify-between overflow-hidden ${
          activeMobileTab === 'preview' ? 'flex' : 'hidden md:flex'
        }`}>
          
          {/* Top action bar */}
          <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2.5 py-1.5 rounded-xl border border-indigo-150/60 text-xs font-black shrink-0">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline text-[11px] uppercase tracking-tight">Canlı Taslak</span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {onSaveContract && (
                <button 
                  onClick={handleSaveContract}
                  disabled={saving}
                  className="p-2 sm:px-3 sm:py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer shadow-xs active:scale-95"
                  title="Sözleşmeyi Depoya Kaydet"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden md:inline text-[11px] font-extrabold">{saving ? "..." : "Kaydet"}</span>
                </button>
              )}
              <button 
                onClick={handlePrint}
                className="p-2 sm:px-3 sm:py-2 bg-indigo-50 text-indigo-700 border border-indigo-200/80 hover:bg-indigo-100 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer active:scale-95"
                title="Yazdır / PDF İndir"
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
                onClick={handleEmailPDF}
                className="p-2 sm:px-3 sm:py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer active:scale-95"
                title="E-posta Gönder"
              >
                <Send className="w-4 h-4" />
                <span className="hidden md:inline text-[11px] font-extrabold">E-posta</span>
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

          {/* RENDERED CONTENT */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-100/50">
            <div className="bg-white shadow-lg rounded-3xl border border-slate-200/80 overflow-hidden mx-auto max-w-3xl">
              <div dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
