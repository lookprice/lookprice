import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Printer,
  Share2,
  Eye,
  FileText,
  User,
  CreditCard,
  Phone,
  Calendar,
  CheckCircle,
  RotateCcw,
  Save,
  FileCheck,
  Percent
} from "lucide-react";
import { contractTemplates, ContractPlaceholderValues } from "../utils/contractTemplates";
import { formatPhoneForWhatsApp, formatDateTR } from "../utils/formatUtils";

export interface SavedConsultantContract {
  agentId: number | string;
  agentName: string;
  contractDate: string;
  authorizedPersonName: string;
  authorizedPersonIdentity: string;
  authorizedPersonIdType: string;
  consultantIdentity: string;
  consultantIdType: string;
  consultantPhone: string;
  noticePeriodDays: string;
  officeSplitRate: string;
  consultantSplitRate: string;
  externalOfficeSplitRate: string;
  externalInternalOfficeRate: string;
  externalInternalConsultantRate: string;
  customClauses: string;
  signed: boolean;
  signingName: string;
  signatureImage: string;
  updatedAt: string;
}

interface ConsultantPartnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: {
    id: number | string;
    name: string;
    role?: string;
    phone?: string;
    email?: string;
    branch?: string;
    identity_no?: string;
    id_type?: string;
  } | null;
  storeName?: string;
  branding?: any;
  savedContract?: SavedConsultantContract | null;
  onSaveContract: (contractData: SavedConsultantContract) => void;
}

export const ConsultantPartnershipModal: React.FC<ConsultantPartnershipModalProps> = ({
  isOpen,
  onClose,
  agent,
  storeName,
  branding,
  savedContract,
  onSaveContract
}) => {
  const resolveStoreName = () => {
    const raw = branding?.store_name || branding?.name || storeName || "Rodel Investment";
    if (!raw || raw.toLowerCase().includes("lookprice")) {
      return "Rodel Investment";
    }
    return raw;
  };

  const resolveDefaultAuthName = () => {
    return (
      branding?.owner_name ||
      branding?.authorized_person ||
      branding?.contact_person ||
      "EMRAH CEYHAN"
    ).toString().trim();
  };

  const resolveDefaultAuthId = () => {
    return (
      branding?.owner_identity ||
      branding?.tax_number ||
      "1170237140"
    ).toString().trim();
  };

  const [activeMobileTab, setActiveMobileTab] = useState<"params" | "preview">("params");
  const [contractDate, setContractDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const [firmName, setFirmName] = useState<string>(() => resolveStoreName());
  const [authorizedPersonName, setAuthorizedPersonName] = useState<string>(() => resolveDefaultAuthName());
  const [authorizedPersonIdentity, setAuthorizedPersonIdentity] = useState<string>(() => resolveDefaultAuthId());
  const [authorizedPersonIdType, setAuthorizedPersonIdType] = useState<string>("KKTC Kimlik");

  const [consultantName, setConsultantName] = useState<string>("");
  const [consultantIdentity, setConsultantIdentity] = useState<string>("");
  const [consultantIdType, setConsultantIdType] = useState<string>("Pasaport / Kimlik");
  const [consultantPhone, setConsultantPhone] = useState<string>("");

  const [noticePeriodDays, setNoticePeriodDays] = useState<string>("30");
  const [officeSplitRate, setOfficeSplitRate] = useState<string>("50");
  const [consultantSplitRate, setConsultantSplitRate] = useState<string>("50");
  const [externalOfficeSplitRate, setExternalOfficeSplitRate] = useState<string>("50 - 50");
  const [externalInternalOfficeRate, setExternalInternalOfficeRate] = useState<string>("50");
  const [externalInternalConsultantRate, setExternalInternalConsultantRate] = useState<string>("50");
  const [customClauses, setCustomClauses] = useState<string>("");

  const [signed, setSigned] = useState<boolean>(false);
  const [signingName, setSigningName] = useState<string>("");
  const [signatureImage, setSignatureImage] = useState<string>("");
  const [isSigningActive, setIsSigningActive] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen || !agent) return;
    setFirmName(resolveStoreName());
    if (savedContract) {
      setContractDate(savedContract.contractDate || new Date().toISOString().split("T")[0]);
      setAuthorizedPersonName(savedContract.authorizedPersonName || resolveDefaultAuthName());
      setAuthorizedPersonIdentity(savedContract.authorizedPersonIdentity || resolveDefaultAuthId());
      setAuthorizedPersonIdType(savedContract.authorizedPersonIdType || "KKTC Kimlik");
      setConsultantName(savedContract.agentName || agent.name || "");
      setConsultantIdentity(savedContract.consultantIdentity || agent.identity_no || "");
      setConsultantIdType(savedContract.consultantIdType || agent.id_type || "Pasaport / Kimlik");
      setConsultantPhone(savedContract.consultantPhone || agent.phone || "");
      setNoticePeriodDays(savedContract.noticePeriodDays || "30");
      setOfficeSplitRate(savedContract.officeSplitRate || "50");
      setConsultantSplitRate(savedContract.consultantSplitRate || "50");
      setExternalOfficeSplitRate(savedContract.externalOfficeSplitRate || "50 - 50");
      setExternalInternalOfficeRate(savedContract.externalInternalOfficeRate || "50");
      setExternalInternalConsultantRate(savedContract.externalInternalConsultantRate || "50");
      setCustomClauses(savedContract.customClauses || "");
      setSigned(Boolean(savedContract.signed));
      setSigningName(savedContract.signingName || agent.name || "");
      setSignatureImage(savedContract.signatureImage || "");
      setIsSigningActive(Boolean(savedContract.signatureImage));
    } else {
      setContractDate(new Date().toISOString().split("T")[0]);
      setAuthorizedPersonName(resolveDefaultAuthName());
      setAuthorizedPersonIdentity(resolveDefaultAuthId());
      setAuthorizedPersonIdType("KKTC Kimlik");
      setConsultantName(agent.name || "");
      setConsultantIdentity(agent.identity_no || "");
      setConsultantIdType(agent.id_type || "Pasaport / Kimlik");
      setConsultantPhone(agent.phone || "");
      setNoticePeriodDays("30");
      setOfficeSplitRate("50");
      setConsultantSplitRate("50");
      setExternalOfficeSplitRate("50 - 50");
      setExternalInternalOfficeRate("50");
      setExternalInternalConsultantRate("50");
      setCustomClauses("");
      setSigned(false);
      setSigningName(agent.name || "");
      setSignatureImage("");
      setIsSigningActive(false);
    }
  }, [isOpen, agent, savedContract]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !agent) return null;

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
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

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
    ctx.strokeStyle = "#1e1b4b";
    ctx.lineWidth = 3.2;
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

  const templateDef =
    contractTemplates.find((t) => t.id === "consultant_partnership") || contractTemplates[0];

  const storePhoneVal = branding?.phone || branding?.whatsapp_number || "";

  const placeholderValues: ContractPlaceholderValues = {
    storeName: firmName || resolveStoreName(),
    storePhone: storePhoneVal,
    clientName: consultantName || agent.name || "Danışman",
    clientIdentity: consultantIdentity || "Belirtilmedi",
    clientPhone: consultantPhone || agent.phone || "",
    propertyTitle: "Danışman İş Ortaklığı Sözleşmesi",
    propertyLocation: "KKTC",
    propertyPrice: "",
    commissionRate: `${officeSplitRate} / ${consultantSplitRate}`,
    contractDate: formatDateTR(contractDate),
    authorizedPersonName: authorizedPersonName || "EMRAH CEYHAN",
    authorizedPersonIdentity: authorizedPersonIdentity || "1170237140",
    authorizedPersonIdType: authorizedPersonIdType || "KKTC Kimlik",
    consultantIdType: consultantIdType || "Pasaport / Kimlik",
    noticePeriodDays: noticePeriodDays || "30",
    officeSplitRate: officeSplitRate || "50",
    consultantSplitRate: consultantSplitRate || "50",
    externalOfficeSplitRate: externalOfficeSplitRate || "50 - 50",
    externalInternalOfficeRate: externalInternalOfficeRate || "50",
    externalInternalConsultantRate: externalInternalConsultantRate || "50",
    customClauses: customClauses,
    isSigned: signed,
    signingName: signingName || consultantName || agent.name,
    signatureImage: signatureImage
  };

  const { html } = templateDef.getTemplate(placeholderValues);

  const handlePrint = () => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.write(`
        <html>
          <head>
            <title>Emlak Danışman İş Ortaklığı Sözleşmesi - ${consultantName || agent.name}</title>
            <style>
              body { font-family: 'Times New Roman', Georgia, serif; background: white; margin: 24px; color: #0f172a; }
              @media print {
                body { margin: 0; padding: 12px; }
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
      }, 400);
    }
  };

  const buildConsultantSignUrl = () => {
    const base = `${window.location.origin}/contract/sign/consultant-${agent.id}`;
    const params = new URLSearchParams({
      templateId: "consultant_partnership",
      storeName: placeholderValues.storeName,
      storePhone: storePhoneVal,
      client: placeholderValues.clientName,
      identity: placeholderValues.clientIdentity,
      phone: placeholderValues.clientPhone,
      contractDate: placeholderValues.contractDate,
      authorizedPersonName: placeholderValues.authorizedPersonName || "",
      authorizedPersonIdentity: placeholderValues.authorizedPersonIdentity || "",
      authorizedPersonIdType: placeholderValues.authorizedPersonIdType || "",
      consultantIdType: placeholderValues.consultantIdType || "",
      noticePeriodDays: placeholderValues.noticePeriodDays || "30",
      officeSplitRate: placeholderValues.officeSplitRate || "50",
      consultantSplitRate: placeholderValues.consultantSplitRate || "50",
      externalOfficeSplitRate: placeholderValues.externalOfficeSplitRate || "50 - 50",
      externalInternalOfficeRate: placeholderValues.externalInternalOfficeRate || "50",
      externalInternalConsultantRate: placeholderValues.externalInternalConsultantRate || "50",
      customClauses: customClauses || ""
    });
    return `${base}?${params.toString()}`;
  };

  const handleShareWhatsApp = () => {
    if (!consultantName.trim()) {
      alert("Lütfen Danışman Adı Soyadı bilgisini giriniz.");
      return;
    }
    const formattedPhone = consultantPhone.trim() ? formatPhoneForWhatsApp(consultantPhone) : "";
    const signUrl = buildConsultantSignUrl();
    const msg = `Sayın *${consultantName}*,\n\n*${placeholderValues.storeName}* bünyesinde hazırlanan resmi *EMLAK DANIŞMAN İŞ ORTAKLIĞI SÖZLEŞMESİ* onayınıza sunulmuştur.\n\n• *Komisyon Paylaşımı:* %${officeSplitRate} Yetkili / %${consultantSplitRate} Danışman\n• *Tarih:* ${placeholderValues.contractDate}\n\nSözleşmeyi mobil cihazınızdan incelemek ve dijital olarak imzalamak için bağlantı:\n${signUrl}`;
    if (formattedPhone) {
      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, "_blank");
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    }
  };

  const handleSave = () => {
    if (!consultantName.trim()) {
      alert("Lütfen Danışman Adı Soyadı bilgisini giriniz.");
      return;
    }
    const payload: SavedConsultantContract = {
      agentId: agent.id,
      agentName: consultantName.trim(),
      contractDate,
      authorizedPersonName: authorizedPersonName.trim() || "EMRAH CEYHAN",
      authorizedPersonIdentity: authorizedPersonIdentity.trim() || "1170237140",
      authorizedPersonIdType: authorizedPersonIdType.trim() || "KKTC Kimlik",
      consultantIdentity: consultantIdentity.trim() || "Belirtilmedi",
      consultantIdType: consultantIdType.trim() || "Pasaport / Kimlik",
      consultantPhone: consultantPhone.trim(),
      noticePeriodDays: noticePeriodDays || "30",
      officeSplitRate: officeSplitRate || "50",
      consultantSplitRate: consultantSplitRate || "50",
      externalOfficeSplitRate: externalOfficeSplitRate || "50 - 50",
      externalInternalOfficeRate: externalInternalOfficeRate || "50",
      externalInternalConsultantRate: externalInternalConsultantRate || "50",
      customClauses,
      signed,
      signingName: signingName || consultantName.trim(),
      signatureImage,
      updatedAt: new Date().toISOString()
    };
    onSaveContract(payload);
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[130] flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-hidden animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-6xl h-[92vh] max-h-[92dvh] flex flex-col md:flex-row overflow-hidden shadow-2xl relative border border-slate-200">
        {/* Mobile Tab Switcher */}
        <div className="md:hidden flex items-center justify-between bg-slate-100 border-b border-slate-200 p-2 shrink-0 gap-2">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 gap-1 flex-1">
            <button
              type="button"
              onClick={() => setActiveMobileTab("params")}
              className={`flex-1 py-1.5 text-center text-xs font-black rounded-lg transition-all cursor-pointer ${
                activeMobileTab === "params"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              Sözleşme Bilgileri
            </button>
            <button
              type="button"
              onClick={() => setActiveMobileTab("preview")}
              className={`flex-1 py-1.5 text-center text-xs font-black rounded-lg transition-all cursor-pointer ${
                activeMobileTab === "preview"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              Ön İzleme ({signed ? "İmzalı" : "Taslak"})
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl transition-all shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Left Column: Contract Parameters */}
        <div
          className={`w-full md:w-96 bg-slate-50 p-4 text-slate-900 flex-col justify-between overflow-y-auto shrink-0 border-b md:border-b-0 md:border-r border-slate-200 flex-1 md:flex-initial ${
            activeMobileTab === "params" ? "flex" : "hidden md:flex"
          }`}
        >
          <div className="space-y-3.5">
            <div className="hidden md:flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-black tracking-tight text-slate-950 uppercase">
                    Danışman İş Ortaklığı
                  </h2>
                  <p className="text-[10px] text-slate-600 font-bold">
                    {agent.name} • {agent.branch || "Merkez"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Yetkili (Ofis) Bilgileri */}
            <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">
                  1. Yetkili & Ofis Bilgileri
                </span>
                <input
                  type="date"
                  value={contractDate}
                  onChange={(e) => setContractDate(e.target.value)}
                  className="bg-slate-50 border border-slate-300 px-2 py-0.5 rounded-lg text-[10px] font-black text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-black text-slate-700 mb-0.5">Firma Adı</label>
                  <input
                    type="text"
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-700 mb-0.5">Yetkili Adı Soyadı</label>
                  <input
                    type="text"
                    value={authorizedPersonName}
                    onChange={(e) => setAuthorizedPersonName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-black text-slate-700 mb-0.5">Yetkili Kimlik Türü</label>
                  <input
                    type="text"
                    value={authorizedPersonIdType}
                    onChange={(e) => setAuthorizedPersonIdType(e.target.value)}
                    placeholder="KKTC Kimlik"
                    className="w-full bg-slate-50 border border-slate-300 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-700 mb-0.5">Yetkili Kimlik No</label>
                  <input
                    type="text"
                    value={authorizedPersonIdentity}
                    onChange={(e) => setAuthorizedPersonIdentity(e.target.value)}
                    placeholder="1170237140"
                    className="w-full bg-slate-50 border border-slate-300 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>

            {/* 2. Danışman Bilgileri */}
            <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">
                2. Danışman Kimlik Bilgileri
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-black text-slate-700 mb-0.5">Danışman Adı Soyadı</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      value={consultantName}
                      onChange={(e) => {
                        setConsultantName(e.target.value);
                        setSigningName(e.target.value);
                      }}
                      className="w-full bg-slate-50 border border-slate-300 pl-7 pr-2 py-1.5 rounded-xl text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-700 mb-0.5">Telefon</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="tel"
                      value={consultantPhone}
                      onChange={(e) => setConsultantPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 pl-7 pr-2 py-1.5 rounded-xl text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-black text-slate-700 mb-0.5">Kimlik / Pasaport Türü</label>
                  <input
                    type="text"
                    value={consultantIdType}
                    onChange={(e) => setConsultantIdType(e.target.value)}
                    placeholder="Örn: İran Pasaport / KKTC Kimlik"
                    className="w-full bg-slate-50 border border-slate-300 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-700 mb-0.5">Kimlik / Pasaport No</label>
                  <div className="relative">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      value={consultantIdentity}
                      onChange={(e) => setConsultantIdentity(e.target.value)}
                      placeholder="Örn: N53809955"
                      className="w-full bg-slate-50 border border-slate-300 pl-7 pr-2 py-1.5 rounded-xl text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Komisyon Paylaşım Oranları & Özel Şartlar */}
            <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5" /> 3. Komisyon Oranları & Şartlar
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold text-slate-600">İhbar (Gün):</span>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={noticePeriodDays}
                    onChange={(e) => setNoticePeriodDays(e.target.value)}
                    className="w-14 bg-slate-50 border border-slate-300 px-1.5 py-0.5 rounded-lg text-xs font-black text-center text-slate-950 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Madde 2: Bireysel Satış / Kiralama */}
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                <span className="text-[10px] font-black text-slate-800">
                  Madde 2 • Satış/Kiralama Payı
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold text-slate-600">Yetkili %</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={officeSplitRate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setOfficeSplitRate(val);
                        const num = parseInt(val, 10);
                        if (!isNaN(num) && num >= 0 && num <= 100) {
                          setConsultantSplitRate(String(100 - num));
                        }
                      }}
                      className="w-14 bg-white border border-slate-300 px-1.5 py-1 rounded-lg text-xs font-black text-center text-slate-950 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <span className="text-slate-400 font-bold">/</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold text-slate-600">Danışman %</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={consultantSplitRate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setConsultantSplitRate(val);
                        const num = parseInt(val, 10);
                        if (!isNaN(num) && num >= 0 && num <= 100) {
                          setOfficeSplitRate(String(100 - num));
                        }
                      }}
                      className="w-14 bg-white border border-slate-300 px-1.5 py-1 rounded-lg text-xs font-black text-center text-slate-950 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* Madde 4: Başka Ofisle Ortak İş */}
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black text-slate-800">
                    Madde 4 • Dış Ofisler Arası (%)
                  </span>
                  <input
                    type="text"
                    value={externalOfficeSplitRate}
                    onChange={(e) => setExternalOfficeSplitRate(e.target.value)}
                    placeholder="50 - 50"
                    className="w-24 bg-white border border-slate-300 px-2 py-1 rounded-lg text-xs font-black text-center text-slate-950 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-700">
                    Ofise Kalan Paylaşım
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold text-slate-600">Yetkili %</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={externalInternalOfficeRate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setExternalInternalOfficeRate(val);
                          const num = parseInt(val, 10);
                          if (!isNaN(num) && num >= 0 && num <= 100) {
                            setExternalInternalConsultantRate(String(100 - num));
                          }
                        }}
                        className="w-14 bg-white border border-slate-300 px-1.5 py-1 rounded-lg text-xs font-black text-center text-slate-950 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                    <span className="text-slate-400 font-bold">/</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold text-slate-600">Danışman %</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={externalInternalConsultantRate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setExternalInternalConsultantRate(val);
                          const num = parseInt(val, 10);
                          if (!isNaN(num) && num >= 0 && num <= 100) {
                            setExternalInternalOfficeRate(String(100 - num));
                          }
                        }}
                        className="w-14 bg-white border border-slate-300 px-1.5 py-1 rounded-lg text-xs font-black text-center text-slate-950 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Özel Şartlar / Serbest Madde */}
              <div className="space-y-1 pt-1 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-900">
                    Özel Şartlar / Serbest Madde
                  </label>
                  {customClauses.trim() && (
                    <button
                      type="button"
                      onClick={() => setCustomClauses("")}
                      className="text-[9px] font-black text-rose-600 hover:text-rose-700 cursor-pointer"
                    >
                      Temizle
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={customClauses}
                  onChange={(e) => setCustomClauses(e.target.value)}
                  placeholder="Sadece bu sözleşmeye eklenecek özel maddeleri her satıra bir madde gelecek şekilde yazın..."
                  className="w-full bg-slate-50 border border-slate-300 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-600 resize-y"
                />
              </div>
            </div>

            {/* 4. Dijital İmza */}
            <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-950 tracking-wider flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5 text-indigo-600" /> Danışman Dijital İmza
                </span>
                {signed && (
                  <button
                    type="button"
                    onClick={() => {
                      setSigned(false);
                      setSignatureImage("");
                      setIsSigningActive(false);
                    }}
                    className="text-[10px] font-black text-rose-600 hover:text-rose-700 uppercase cursor-pointer"
                  >
                    Düzenle
                  </button>
                )}
              </div>

              {signed ? (
                <div className="space-y-2">
                  <div className="bg-emerald-50 border border-emerald-500 p-2 rounded-xl text-center text-xs text-emerald-900 font-black flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-emerald-600" /> İmzalandı ({signingName})
                    </div>
                    {signatureImage && (
                      <div className="bg-white p-1 rounded border border-slate-200 max-w-[120px]">
                        <img src={signatureImage} alt="Signature" className="max-h-[36px] max-w-full block" />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-600">İmza Alanı</span>
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 uppercase cursor-pointer"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> Temizle
                    </button>
                  </div>
                  <div className="border border-slate-300 rounded-xl overflow-hidden bg-white relative">
                    <canvas
                      ref={canvasRef}
                      width={300}
                      height={100}
                      className="w-full h-[90px] cursor-crosshair block touch-none"
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
                        <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                          BURAYA İMZALAYIN
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isSigningActive || !canvasRef.current) {
                        alert("Lütfen imza kutusuna imza çiziniz.");
                        return;
                      }
                      setSignatureImage(canvasRef.current.toDataURL("image/png"));
                      setSigned(true);
                    }}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase rounded-xl transition-all cursor-pointer"
                  >
                    İmzayı Onayla
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Contract Preview & Top Actions */}
        <div
          className={`flex-1 bg-white flex-col justify-between overflow-hidden ${
            activeMobileTab === "preview" ? "flex" : "hidden md:flex"
          }`}
        >
          <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2.5 py-1.5 rounded-xl border border-indigo-200 text-xs font-black">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span className="text-[11px] uppercase">Sözleşme Ön İzleme</span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-black cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Kaydet</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl transition-all flex items-center gap-1.5 text-xs font-black cursor-pointer"
              >
                <Printer className="w-4 h-4 text-indigo-600" />
                <span>Yazdır</span>
              </button>
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-black cursor-pointer shadow-xs"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl transition-all cursor-pointer ml-1"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-100/70">
            <div className="bg-white shadow-lg rounded-2xl border border-slate-200 overflow-hidden mx-auto max-w-3xl">
              <div dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
