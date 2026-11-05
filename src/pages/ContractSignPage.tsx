import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Check, 
  PenTool, 
  RotateCcw, 
  Send, 
  CheckCircle, 
  User, 
  Building, 
  Calendar,
  AlertTriangle,
  Lock,
  Smartphone,
  CreditCard,
  XCircle,
  ZoomIn,
  X
} from "lucide-react";
import { contractTemplates } from "../utils/contractTemplates";
import { formatPhoneForWhatsApp, formatDateTR } from "../utils/formatUtils";

export default function ContractSignPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  
  const clientNameParam = searchParams.get("client") || "";
  const clientPhoneParam = searchParams.get("phone") || "";
  const clientIdentityParam = searchParams.get("identity") || "";
  const templateIdParam = searchParams.get("templateId") || "";
  const contractTypeParam = searchParams.get("contractType") || "";
  const commissionRateParam = searchParams.get("commissionRate") || "3";
  const contractDateParam = formatDateTR(searchParams.get("contractDate") || new Date());
  const splitRatioParam = searchParams.get("splitRatio") || "";
  const contractDurationParam = searchParams.get("contractDuration") || "";
  const evictionDateParam = searchParams.get("evictionDate") || "";
  const depositAmountParam = searchParams.get("depositAmount") || "";
  const rentDurationParam = searchParams.get("rentDuration") || "";
  const paymentDayParam = searchParams.get("paymentDay") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemData, setItemData] = useState<any>(null);
  const [isVehicle, setIsVehicle] = useState(false);
  const [clientName, setClientName] = useState(clientNameParam);
  const [clientPhone, setClientPhone] = useState(clientPhoneParam);
  const [clientIdentity, setClientIdentity] = useState(clientIdentityParam);
  const [signed, setSigned] = useState(false);
  const [isSigningActive, setIsSigningActive] = useState(false);
  const [success, setSuccess] = useState(false);
  const [decisionStatus, setDecisionStatus] = useState<"approved" | "rejected">("approved");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [fixtureAccepted, setFixtureAccepted] = useState(true);
  const [inspectPhotoUrl, setInspectPhotoUrl] = useState<{ url: string; name: string; timestamp?: string } | null>(null);
  const [signatureImage, setSignatureImage] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    if (!id) {
      setError("Sözleşme ID bulunamadı.");
      setLoading(false);
      return;
    }

    const checkAndFetch = async () => {
      try {
        if (id.startsWith("vehicle-")) {
          setIsVehicle(true);
          const realVehicleId = id.replace("vehicle-", "");
          const res = await fetch(`/api/public/vehicles/${realVehicleId}`);
          if (!res.ok) throw new Error("Araç bulunamadı.");
          const data = await res.json();
          setItemData(data);
        } else {
          setIsVehicle(false);
          const res = await fetch(`/api/public/real-estate/${id}`);
          if (!res.ok) throw new Error("Gayrimenkul bulunamadı.");
          const data = await res.json();
          setItemData(data);
        }
      } catch (err: any) {
        setError(err.message || "Veri yüklenirken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    checkAndFetch();
  }, [id]);

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
    ctx.strokeStyle = "#0f172a";
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
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const fixturePhotosList: any[] = React.useMemo(() => {
    if (!itemData) return [];
    const raw = itemData.fixture_photos || itemData.sector_data?.fixture_photos;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    }
    return [];
  }, [itemData]);

  const isFurnishedRental = Boolean(
    !isVehicle &&
      itemData &&
      (itemData.listing_intent === "rent" || templateIdParam === "rental_agreement") &&
      (itemData.furnished === true ||
        itemData.furnished === "true" ||
        itemData.furnished === "esyali" ||
        itemData.furnished === "furnished" ||
        fixturePhotosList.length > 0)
  );

  const handleApprove = async () => {
    if (!clientName.trim()) {
      alert("Lütfen adınızı ve soyadınızı giriniz.");
      return;
    }
    if (!clientIdentity.trim()) {
      alert("Lütfen T.C. Kimlik veya Pasaport numaranızı giriniz.");
      return;
    }
    if (!clientPhone.trim()) {
      alert("Lütfen iletişim telefon numaranızı giriniz.");
      return;
    }
    if (isFurnishedRental && !fixtureAccepted) {
      alert("Lütfen eşya/demirbaş listesini ve fotoğraflarını incelediğinizi onaylayan kutucuğu işaretleyiniz.");
      return;
    }
    if (!isSigningActive) {
      alert("Lütfen parmağınızla imza alanına imzanızı atınız.");
      return;
    }

    const canvas = canvasRef.current;
    let signatureImgData = "";
    if (canvas) {
      signatureImgData = canvas.toDataURL("image/png");
      setSignatureImage(signatureImgData);
    }

    try {
      setLoading(true);
      const url = isVehicle ? `/api/public/vehicles/${id}/sign` : `/api/public/real-estate/${id}/sign`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          clientIdentity,
          clientPhone,
          commissionRate: isVehicle ? undefined : commissionRateParam,
          templateId: isVehicle ? undefined : (templateIdParam || (itemData?.listing_intent === "rent" ? "rental_agreement" : "showing_agreement")),
          contractType: isVehicle ? (contractTypeParam || "consignment") : undefined,
          displayName: storeName,
          signatureImage: signatureImgData,
          decision: "approved",
          fixtureApproved: isFurnishedRental
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Sözleşme kaydedilemedi.");
      }

      setDecisionStatus("approved");
      setSigned(true);
      setSuccess(true);
    } catch (err: any) {
      alert(err.message || "Sözleşme kaydedilirken hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!clientName.trim() || !clientIdentity.trim() || !clientPhone.trim()) {
      alert("Lütfen düzeltme/ret talebi göndermeden önce Ad Soyad, Kimlik/Pasaport ve Telefon alanlarını doldurunuz.");
      return;
    }
    if (!rejectionReason.trim()) {
      alert("Lütfen eşya listesi veya sözleşme ile ilgili düzeltme/itiraz nedeninizi kısaca yazınız.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/public/real-estate/${id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          clientIdentity,
          clientPhone,
          commissionRate: commissionRateParam,
          templateId: templateIdParam || (itemData?.listing_intent === "rent" ? "rental_agreement" : "showing_agreement"),
          displayName: storeName,
          decision: "rejected",
          rejectionReason: rejectionReason.trim(),
          fixtureApproved: false
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "İşlem kaydedilemedi.");
      }

      setDecisionStatus("rejected");
      setSuccess(true);
    } catch (err: any) {
      alert(err.message || "İşlem kaydedilirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: any, currency: string) => {
    if (val === undefined || val === null || val === "") return "0";
    const symbol = currency === "GBP" ? "£" : currency === "USD" ? "$" : currency === "EUR" ? "€" : "₺";
    return `${symbol}${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(Math.round(val))}`;
  };

  const storeName = itemData?.store_name?.replace(/lookprice/gi, "Seçkin") || "Seçkin VIP Portföy";
  const effectiveTemplateId =
    templateIdParam || (itemData?.listing_intent === "rent" ? "rental_agreement" : "showing_agreement");

  let dynamicContractTitle = "";
  if (isVehicle) {
    if (contractTypeParam === "consignment") {
      dynamicContractTitle = "Araç Emanet & Konsinye Sözleşmesi";
    } else if (contractTypeParam === "reservation") {
      dynamicContractTitle = "Araç Rezervasyon Protokolü";
    } else {
      dynamicContractTitle = "Araç Emanet & Satış Aracılık Protokolü";
    }
  } else {
    const matchedTemplate = contractTemplates.find((t) => t.id === effectiveTemplateId);
    dynamicContractTitle = matchedTemplate ? matchedTemplate.titleTr : "Kira & Demirbaş Teslim Sözleşmesi";
  }

  let renderedContractHtml = "";
  if (!isVehicle && itemData) {
    const matchedTemplate = contractTemplates.find((t) => t.id === effectiveTemplateId);
    if (matchedTemplate) {
      const formattedPriceNum = itemData.price ? new Intl.NumberFormat("tr-TR").format(Math.round(itemData.price)) : "0";
      const symbol = itemData.currency === "GBP" ? "£" : itemData.currency === "USD" ? "$" : itemData.currency === "EUR" ? "€" : "₺";
      
      const values = {
        clientName: clientName || "..................................................",
        clientIdentity: clientIdentity || "..................................................",
        clientPhone: clientPhone || "..................................................",
        storeName: storeName,
        storePhone: itemData.store_phone || "",
        propertyTitle: itemData.type === "land"
          ? `[Ref: ${itemData.reference_no || `LP-${itemData.id}`}] ${(itemData as any).mahalle || ""} Mah. Ada: ${(itemData as any).ada || "..."}, Parsel: ${(itemData as any).parsel || "..."}`
          : `[Ref: ${itemData.reference_no || `LP-${itemData.id}`}] ${itemData.title}`,
        propertyLocation: itemData.location || "Kıbrıs",
        propertyPrice: `${formattedPriceNum} ${symbol}`,
        propertyBlockPlot: itemData.block_plot,
        commissionRate: itemData.listing_intent === "rent" ? commissionRateParam : (commissionRateParam.includes("%") ? commissionRateParam : `%${commissionRateParam}`),
        contractDate: contractDateParam,
        propertyAddress: itemData.address || "Belirtilmemiş adres",
        splitRatio: splitRatioParam,
        contractDuration: contractDurationParam,
        evictionDate: evictionDateParam,
        depositAmount: depositAmountParam || (itemData.deposit ? `${itemData.deposit} ${symbol}` : "1 Aylık Kira Bedeli"),
        rentDuration: rentDurationParam || "1 Yıl",
        paymentDay: paymentDayParam || "Her ayın en geç 5. günü",
        isSigned: signed,
        signingName: clientName,
        signatureImage: signatureImage,
        isFurnishedRental,
        fixturePhotosCount: fixturePhotosList.length,
        fixturePhotos: fixturePhotosList
      };
      const { html } = matchedTemplate.getTemplate(values);
      renderedContractHtml = html;
    }
  }

  const sendNotificationToAgent = () => {
    if (!itemData) return;
    const formattedPhone = formatPhoneForWhatsApp(itemData.store_phone || "");
    const targetRef = itemData.reference_no || `LP-${id}`;
    const sName = itemData.store_name?.replace(/lookprice/gi, "Seçkin") || "Seçkin VIP Portföy";
    
    const message =
      decisionStatus === "approved"
        ? `SAYIN ${sName.toUpperCase()},\n\nTarafıma iletmiş olduğunuz *${dynamicContractTitle}*${
            isFurnishedRental ? ` ve *Eşya/Demirbaş Teslim Listesi ile Fotoğraflarını (${fixturePhotosList.length} Adet)*` : ""
          } inceledim ve mobil cihazım üzerinden *ONAYLAYARAK İMZALADIM*.\n\n*Bilgiler:*\n• *Portföy Ref:* ${targetRef}\n• *İmzalayan:* ${clientName}\n• *Kimlik/Pasaport:* ${clientIdentity}\n• *Tel:* ${clientPhone}\n• *Tarih:* ${formatDateTR(new Date())}\n\nOnaylı sözleşme ve eşya tutanağı sisteminize işlenmiştir.`
        : `SAYIN ${sName.toUpperCase()},\n\n*Ref: ${targetRef}* portföyü için iletilen sözleşme / eşya listesi hakkında *DÜZELTME / RET TALEBİM* bulunmaktadır:\n\n• *Müşteri:* ${clientName} (${clientPhone})\n• *Düzeltme / İtiraz Notu:* ${rejectionReason}\n\nKontrol ederek revize etmenizi rica ederim.`;
    
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-950">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-black text-slate-800">Güvenli Sözleşme & Eşya Tutanağı Yükleniyor...</p>
      </div>
    );
  }

  if (error || !itemData) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-slate-950">
        <div className="bg-white border-2 border-slate-300 p-6 rounded-2xl max-w-md w-full text-center shadow-xl">
          <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto mb-3" />
          <h2 className="text-lg font-black mb-2">Bağlantı Hatası</h2>
          <p className="text-xs text-slate-700 leading-relaxed mb-4">{error || "Sözleşme verisi çekilemedi."}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl uppercase transition-all"
          >
            Yeniden Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 flex items-center justify-center p-2 sm:p-6 font-sans">
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div 
            key="sign-flow"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="w-full max-w-6xl bg-white border-2 border-slate-300 rounded-2xl overflow-hidden shadow-2xl flex flex-col lg:flex-row"
          >
            {/* Left Column: Contract & Fixture Inventory Viewer */}
            <div className="lg:w-7/12 p-4 sm:p-6 flex flex-col justify-between border-b-2 lg:border-b-0 lg:border-r-2 border-slate-300 bg-slate-50">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="bg-slate-900 text-white text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-400" /> Dijital Sözleşme & Eşya Onay Sistemi
                  </span>
                  <span className="text-xs bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-mono font-black">
                    Ref: {itemData.reference_no || `LP-${id}`}
                  </span>
                </div>

                <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-950 mb-3">
                  {dynamicContractTitle}
                </h1>

                {/* Summary Bar */}
                <div className="grid grid-cols-2 gap-2.5 mb-4 bg-white p-3 rounded-xl border-2 border-slate-300">
                  <div className="flex items-start gap-2">
                    {isVehicle ? <Smartphone className="w-4 h-4 text-slate-700 mt-0.5" /> : <Building className="w-4 h-4 text-slate-700 mt-0.5" />}
                    <div className="truncate">
                      <span className="block text-[9px] font-black text-slate-600 uppercase leading-none mb-0.5">Portföy</span>
                      <span className="text-xs font-black text-slate-950 block truncate">
                        {isVehicle ? `${itemData.brand} ${itemData.model}` : itemData.title}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-slate-700 mt-0.5" />
                    <div className="truncate">
                      <span className="block text-[9px] font-black text-slate-600 uppercase leading-none mb-0.5">Yetkili Ofis</span>
                      <span className="text-xs font-black text-slate-950 block truncate">{storeName}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 col-span-2 border-t border-slate-200 pt-2">
                    <Calendar className="w-4 h-4 text-indigo-600 mt-0.5" />
                    <div>
                      <span className="block text-[9px] font-black text-slate-600 uppercase leading-none mb-0.5">Bedel & Konum</span>
                      <span className="text-xs font-black text-indigo-700 block">
                        {isVehicle 
                          ? `Fiyat: ${formatCurrency(itemData.selling_price || itemData.price, itemData.currency || "TRY")}`
                          : `Kira/Satış Bedeli: ${formatCurrency(itemData.price, itemData.currency || "GBP")} • ${itemData.location || "Girne"}`
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Furnished Rental Fixture Photo Strip (Interactive Zoom for Tenant) */}
                {isFurnishedRental && fixturePhotosList.length > 0 && (
                  <div className="mb-4 bg-white border-2 border-indigo-600 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-slate-950 uppercase">
                        Teslim Edilen Eşyalar ({fixturePhotosList.length} Fotoğraf)
                      </span>
                      <span className="text-[10px] font-bold text-indigo-700">
                        Büyütmek için resme dokunun
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[190px] overflow-y-auto pr-1">
                      {fixturePhotosList.map((fp: any, idx: number) => (
                        <div
                          key={fp.id || idx}
                          onClick={() => setInspectPhotoUrl({ url: fp.url, name: fp.name, timestamp: fp.timestamp_str })}
                          className="border border-slate-300 rounded-lg p-1.5 bg-slate-50 hover:border-indigo-600 cursor-pointer flex items-center gap-2"
                        >
                          <img
                            src={fp.url}
                            alt={fp.name}
                            className="w-12 h-10 object-cover rounded border border-slate-300 shrink-0 bg-slate-950"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black text-slate-950 truncate">{fp.name}</p>
                            <p className="text-[9px] font-bold text-indigo-700 truncate">{fp.condition || "Sağlam"}</p>
                            <p className="text-[8px] font-mono text-slate-600 truncate">{fp.timestamp_str}</p>
                          </div>
                          <ZoomIn className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contract Full HTML Preview */}
                {renderedContractHtml ? (
                  <div className="bg-white border-2 border-slate-300 rounded-xl p-3 max-h-[340px] overflow-y-auto text-slate-950 leading-relaxed font-sans">
                    <div dangerouslySetInnerHTML={{ __html: renderedContractHtml }} />
                  </div>
                ) : null}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-700 font-bold">
                <span>Güvenli Dijital Sözleşme & Eşya Teslim Protokolü</span>
                <span className="flex items-center gap-1 text-emerald-700 font-black">
                  <CheckCircle className="w-3.5 h-3.5" /> Hukuki Delil Statüsündedir
                </span>
              </div>
            </div>

            {/* Right Column: Approval / Signature / Rejection Form */}
            <div className="lg:w-5/12 p-4 sm:p-6 flex flex-col justify-between bg-white">
              <div className="space-y-3.5">
                <div className="flex items-center gap-1.5 text-slate-950 font-black text-xs uppercase tracking-wider border-b border-slate-200 pb-2">
                  <PenTool className="w-4 h-4 text-indigo-600" /> MÜŞTERİ ONAY & İMZA PANELİ
                </div>

                {/* Input Fields */}
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-900 uppercase mb-1">ADINIZ SOYADINIZ *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="text" 
                        placeholder="Adınız Soyadınız" 
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-300 focus:border-indigo-600 rounded-xl py-2 pl-9 pr-3 text-xs font-black text-slate-950 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-black text-slate-900 uppercase mb-1">KİMLİK / PASAPORT NO *</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input 
                          type="text" 
                          placeholder="Kimlik / Pasaport No" 
                          value={clientIdentity}
                          onChange={(e) => setClientIdentity(e.target.value)}
                          className="w-full bg-slate-50 border-2 border-slate-300 focus:border-indigo-600 rounded-xl py-2 pl-9 pr-3 text-xs font-black text-slate-950 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-900 uppercase mb-1">TELEFON NUMARANIZ *</label>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input 
                          type="tel" 
                          placeholder="+90 533 ..." 
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          className="w-full bg-slate-50 border-2 border-slate-300 focus:border-indigo-600 rounded-xl py-2 pl-9 pr-3 text-xs font-black text-slate-950 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mandatory Fixture Acceptance Checkbox for Furnished Rentals */}
                {isFurnishedRental && (
                  <label className="flex items-start gap-2.5 p-2.5 bg-amber-50 border-2 border-amber-300 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fixtureAccepted}
                      onChange={(e) => setFixtureAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-indigo-600 shrink-0"
                    />
                    <span className="text-[11px] font-black text-slate-950 leading-snug">
                      Sözleşmeyi, EK-1 Eşya Listesini ve zaman damgalı eşya fotoğraflarını inceledim, sağlam ve eksiksiz teslim aldığımı onaylıyorum.
                    </span>
                  </label>
                )}

                {/* Canvas Signature Box */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-black text-slate-900 uppercase">PARMAĞINIZLA BURAYA İMZALAYIN</label>
                    <button 
                      onClick={clearCanvas}
                      type="button"
                      className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 uppercase cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Temizle
                    </button>
                  </div>

                  <div className="border-2 border-slate-300 rounded-xl overflow-hidden bg-slate-50 relative">
                    <canvas 
                      ref={canvasRef}
                      width={320}
                      height={150}
                      className="w-full h-[140px] cursor-crosshair block touch-none bg-white"
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
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                          PARMAĞINIZLA BURAYA İMZA ÇİZİN
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Optional Rejection / Correction Box */}
                {showRejectBox && (
                  <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-xl space-y-2">
                    <label className="block text-[10px] font-black text-rose-900 uppercase">
                      Red / Düzeltme Talebi Açıklamanız *
                    </label>
                    <textarea
                      rows={2}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Örn: Salon kliması kumandası eksik veya koltukta mevcut leke not edilmeli..."
                      className="w-full p-2 bg-white border border-rose-300 rounded-lg text-xs font-bold text-slate-950 focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleReject}
                        className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-lg uppercase cursor-pointer"
                      >
                        Düzeltme Talebini Gönder
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRejectBox(false)}
                        className="px-3 py-2 bg-white border border-slate-300 text-slate-800 font-bold text-xs rounded-lg cursor-pointer"
                      >
                        Vazgeç
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Approval or Reject Triggers */}
              <div className="mt-4 space-y-2">
                <button 
                  type="button"
                  onClick={handleApprove}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
                >
                  <Check className="w-4 h-4" /> ONAYLA VE İMZALA
                </button>

                {!isVehicle && !showRejectBox && (
                  <button
                    type="button"
                    onClick={() => setShowRejectBox(true)}
                    className="w-full py-2.5 bg-white hover:bg-rose-50 text-rose-700 border-2 border-rose-300 font-black text-xs rounded-xl uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" /> Reddet / Eşya Listesinde Düzeltme İste
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="success-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-white border-2 border-slate-300 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-y-auto max-h-[90vh] text-slate-950"
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 ${
                decisionStatus === "approved"
                  ? "bg-emerald-50 border-emerald-500 text-emerald-600"
                  : "bg-rose-50 border-rose-500 text-rose-600"
              }`}
            >
              {decisionStatus === "approved" ? <Check className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
            </div>

            <span
              className={`text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-full mb-2 inline-block ${
                decisionStatus === "approved"
                  ? "bg-emerald-100 text-emerald-900"
                  : "bg-rose-100 text-rose-900"
              }`}
            >
              {decisionStatus === "approved"
                ? "SÖZLEŞME & EŞYA LİSTESİ ONAYLANDI"
                : "DÜZELTME / RET TALEBİ KAYDEDİLDİ"}
            </span>

            <h2 className="text-xl font-black text-slate-950 tracking-tight mb-2">
              {decisionStatus === "approved"
                ? "Teşekkürler, Dijital Onayınız Kaydedildi!"
                : "Düzeltme Talebiniz Sisteme İşlendi"}
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed mb-5 max-w-sm mx-auto font-medium">
              {decisionStatus === "approved"
                ? "Sözleşmeniz ve eşya tespit tutanağınız dijital zaman damgası ile sisteme kaydedilmiştir."
                : "Belirttiğiniz düzeltme/itiraz notu ilgili gayrimenkul danışmanının ekranına iletilmiştir."}
            </p>

            <div className="bg-slate-50 border-2 border-slate-300 p-3.5 rounded-xl text-left space-y-1.5 mb-5 text-xs max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-600 font-bold">Müşteri:</span>
                <span className="text-slate-950 font-black">{clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-bold">Tarih / Saat:</span>
                <span className="text-indigo-700 font-black">{new Date().toLocaleString("tr-TR")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-bold">Durum:</span>
                <span className="text-slate-950 font-black">
                  {decisionStatus === "approved" ? "Onaylandı & İmzalandı" : `Red / Düzeltme: ${rejectionReason}`}
                </span>
              </div>
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <button 
                onClick={sendNotificationToAgent}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" /> Danışmana WhatsApp ile Bildir
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox for Tenant Inspecting Fixture Photos */}
      {inspectPhotoUrl && (
        <div
          className="fixed inset-0 z-[200] bg-slate-950/90 flex flex-col items-center justify-center p-4"
          onClick={() => setInspectPhotoUrl(null)}
        >
          <div className="w-full max-w-3xl flex items-center justify-between text-white mb-2">
            <div>
              <h4 className="text-sm font-black text-amber-400">{inspectPhotoUrl.name}</h4>
              {inspectPhotoUrl.timestamp && (
                <p className="text-xs font-mono text-slate-300">{inspectPhotoUrl.timestamp} • hukuki delil</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setInspectPhotoUrl(null)}
              className="p-2 bg-slate-800 rounded-lg text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <img
            src={inspectPhotoUrl.url}
            alt={inspectPhotoUrl.name}
            className="max-w-full max-h-[80vh] object-contain rounded-xl border-2 border-slate-700"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
