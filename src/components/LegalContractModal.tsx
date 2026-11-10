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
import {
  contractTemplates,
  ContractTemplate,
  ContractPlaceholderValues,
  resolvePropertyRegionLabel,
  detectDefaultPropertyNature,
  buildDefaultOfferPropertyDetails,
  formatOfferPriceWithWords,
  computeRemainingSaleAmount,
  formatSaleContractAmount,
  buildDefaultSalePropertyDetails,
  buildDefaultRentalPropertyMeta,
  buildDefaultShowingPropertyDetails
} from "../utils/contractTemplates";
import { RealEstateProperty } from "../types";
import { formatPhoneForWhatsApp, formatDateTR } from "../utils/formatUtils";


interface LegalContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: RealEstateProperty;
  branding?: any;
  onSaveContract?: (contractDoc: any) => Promise<void>;
  initialTemplateId?: string;
  initialOfferPrice?: string;
  initialClientName?: string;
  initialClientPhone?: string;
  initialViewingDate?: string;
  initialContractDoc?: any;
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
  return formatDateTR(isoDateStr);
};

export const LegalContractModal: React.FC<LegalContractModalProps> = ({ 
  isOpen, 
  onClose, 
  property,
  branding,
  onSaveContract,
  initialTemplateId,
  initialOfferPrice,
  initialClientName,
  initialClientPhone,
  initialViewingDate,
  initialContractDoc
}) => {
  const getDisplayStoreNameInit = () => {
    const rawName = branding?.store_name || branding?.name || "Seçkin Emlak";
    if (!rawName || rawName.toLowerCase().includes("lookprice")) {
      return "Premium VIP Emlak";
    }
    return rawName;
  };

  const resolveOwnerName = (prop: RealEstateProperty) => {
    const sec = typeof prop?.sector_data === "string"
      ? (() => { try { return JSON.parse(prop.sector_data); } catch { return {}; } })()
      : (prop?.sector_data || {});
    return (
      prop?.owner_info?.fullName ||
      sec?.owner_info?.fullName ||
      (prop as any)?.owner_name ||
      sec?.owner_name ||
      ""
    ).toString().trim();
  };

  const resolveOwnerPhone = (prop: RealEstateProperty) => {
    const sec = typeof prop?.sector_data === "string"
      ? (() => { try { return JSON.parse(prop.sector_data); } catch { return {}; } })()
      : (prop?.sector_data || {});
    return (
      prop?.owner_info?.phone ||
      sec?.owner_info?.phone ||
      (prop as any)?.owner_phone ||
      sec?.owner_phone ||
      ""
    ).toString().trim();
  };

  const resolveOwnerIdentity = (prop: RealEstateProperty) => {
    const sec = typeof prop?.sector_data === "string"
      ? (() => { try { return JSON.parse(prop.sector_data); } catch { return {}; } })()
      : (prop?.sector_data || {});
    return (
      (prop?.owner_info as any)?.identityNo ||
      (sec?.owner_info as any)?.identityNo ||
      (prop as any)?.owner_identity ||
      sec?.owner_identity ||
      ""
    ).toString().trim();
  };

  const formatThousandsInput = (raw: string | number | undefined) => {
    if (raw === undefined || raw === null || raw === "") return "";
    const digits = String(raw).replace(/[^\d]/g, "");
    if (!digits) return "";
    const num = parseInt(digits, 10);
    return isNaN(num) ? "" : num.toLocaleString("tr-TR");
  };

  const getDefaultDeedTransferIso = (baseDateIso?: string) => {
    const d = baseDateIso ? new Date(baseDateIso) : new Date();
    if (isNaN(d.getTime())) {
      const fallback = new Date();
      fallback.setMonth(fallback.getMonth() + 4);
      return fallback.toISOString().split("T")[0];
    }
    d.setMonth(d.getMonth() + 4);
    return d.toISOString().split("T")[0];
  };

  const getDefaultRentEndIso = (baseDateIso?: string) => {
    const d = baseDateIso ? new Date(baseDateIso) : new Date();
    if (isNaN(d.getTime())) {
      const fallback = new Date();
      fallback.setFullYear(fallback.getFullYear() + 1);
      fallback.setDate(fallback.getDate() - 1);
      return fallback.toISOString().split("T")[0];
    }
    d.setFullYear(d.getFullYear() + 1);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  };

  const defaultRentalMeta = buildDefaultRentalPropertyMeta(property);

  const [activeMobileTab, setActiveMobileTab] = useState<'params' | 'preview'>('params');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialTemplateId || (property.listing_intent === 'rent' ? "rental_agreement" : "sales_brokerage")
  );
  const [activeDocId, setActiveDocId] = useState<string>(() => initialContractDoc?.id || `virtual-contract-${Date.now()}`);

  // Buyer / Tenant states
  const [clientName, setClientName] = useState<string>(initialClientName || "");
  const [clientIdentity, setClientIdentity] = useState<string>("");
  const [buyerIdType, setBuyerIdType] = useState<string>(
    property.listing_intent === "rent" ? "TC kimlik" : "KKTC KİMLİK"
  );
  const [clientPhone, setClientPhone] = useState<string>(initialClientPhone || "");

  // Seller / Property Owner states
  const [ownerName, setOwnerName] = useState<string>(() => resolveOwnerName(property));
  const [ownerPhone, setOwnerPhone] = useState<string>(() => resolveOwnerPhone(property));
  const [sellerIdentity, setSellerIdentity] = useState<string>(() => resolveOwnerIdentity(property));
  const [sellerIdType, setSellerIdType] = useState<string>(
    property.listing_intent === "rent" ? "KKTC kimlik" : "KKTC Kimlik Kartı"
  );

  const [commissionRate, setCommissionRate] = useState<string>(
    property.listing_intent === 'rent' ? "1 Aylık Kira Bedeli" : "5"
  );
  const [contractDate, setContractDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [splitRatio, setSplitRatio] = useState<string>("50 / 50");
  const [contractDuration, setContractDuration] = useState<string>("12 Ay / 12 Months");
  const [evictionDate, setEvictionDate] = useState<string>(
    new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
  );
  const getInitialDeposit = (prop: RealEstateProperty) => {
    const sym = prop.currency === 'GBP' ? 'GBP' : prop.currency === 'USD' ? 'USD' : prop.currency === 'EUR' ? 'EUR' : 'TL';
    const depNum = Number(prop.deposit) > 0 ? Number(prop.deposit) : (Number((prop as any).sector_data?.deposit) || 0);
    if (depNum > 0) {
      return prop.listing_intent === 'rent' ? `${depNum.toLocaleString("tr-TR")} ${sym}` : depNum.toLocaleString("tr-TR");
    }
    return prop.listing_intent === 'rent' ? "1 Aylık Kira Bedeli" : "35.000";
  };

  const [depositAmount, setDepositAmount] = useState<string>(() => getInitialDeposit(property));
  const [rentDuration, setRentDuration] = useState<string>("1 (Bir) Yıl");
  const [paymentDay, setPaymentDay] = useState<string>("Her Ayın En Geç 5 (Beş)’inde Ödenecektir.");

  // Rental Agreement (KİRA SÖZLEŞMESİ) specific states
  const [rentalPropertyDef, setRentalPropertyDef] = useState<string>(() => defaultRentalMeta.rentalPropertyDef);
  const [rentalUsagePurpose, setRentalUsagePurpose] = useState<string>(() => defaultRentalMeta.rentalUsagePurpose);
  const [rentalAddress, setRentalAddress] = useState<string>(() => defaultRentalMeta.rentalAddress);
  const [rentalDistrict, setRentalDistrict] = useState<string>(() => defaultRentalMeta.rentalDistrict);
  const [rentalTownVillage, setRentalTownVillage] = useState<string>(() => defaultRentalMeta.rentalTownVillage);
  const [kocanNo, setKocanNo] = useState<string>(() => defaultRentalMeta.kocanNo);
  const [paftaNo, setPaftaNo] = useState<string>(() => defaultRentalMeta.paftaNo);
  const [adaNo, setAdaNo] = useState<string>(() => defaultRentalMeta.adaNo);
  const [parselNo, setParselNo] = useState<string>(() => defaultRentalMeta.parselNo);
  const [rentPriceInput, setRentPriceInput] = useState<string>(() => formatThousandsInput(property?.price));
  const [rentCurrency, setRentCurrency] = useState<string>(() => {
    const c = (property?.currency || "TRY").toUpperCase();
    return c === "TRY" ? "TL" : c;
  });
  const [rentPaymentMethod, setRentPaymentMethod] = useState<string>("Aylık Ödemeli");
  const [rentStartDate, setRentStartDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [rentEndDate, setRentEndDate] = useState<string>(() => getDefaultRentEndIso());

  // Sales Contract (SATIŞ SÖZLEŞMESİ) specific states
  const [salePropertyDetails, setSalePropertyDetails] = useState<string>(() => buildDefaultSalePropertyDetails(property));
  const [salePriceInput, setSalePriceInput] = useState<string>(() => formatThousandsInput(property?.price));
  const [saleCurrency, setSaleCurrency] = useState<string>(() => (property?.currency || "GBP").toUpperCase());
  const [depositDate, setDepositDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [deedTransferDate, setDeedTransferDate] = useState<string>(() => getDefaultDeedTransferIso());
  const [paymentDeadlineMonths, setPaymentDeadlineMonths] = useState<string>("4 (dört) ay");
  const [gracePeriodDays, setGracePeriodDays] = useState<string>("14");
  const [taxClauseText, setTaxClauseText] = useState<string>(
    "Satıcı Belediye Emlak Vergisi (varsa KDV yi) ve Stopaj Ödeyecek, Alıcı ise Tapu Devir Harcı’nı ödeyecektir."
  );
  const [witness1Name, setWitness1Name] = useState<string>(() => branding?.owner_name || "Emrah CEYHAN");
  const [witness1Identity, setWitness1Identity] = useState<string>(() => branding?.owner_identity || "1170237140");
  const [witness2Name, setWitness2Name] = useState<string>("");
  const [witness2Identity, setWitness2Identity] = useState<string>("");

  // Offer Letter (Fiyat Teklif Mektubu) specific states
  const [offerPropertyNature, setOfferPropertyNature] = useState<string>(() => detectDefaultPropertyNature(property));
  const [offerPropertyDetails, setOfferPropertyDetails] = useState<string>(() => buildDefaultOfferPropertyDetails(property));
  const [viewingDate, setViewingDate] = useState<string>(() => initialViewingDate || new Date().toISOString().split('T')[0]);
  const [agentAndCompany, setAgentAndCompany] = useState<string>(() => {
    const sName = getDisplayStoreNameInit();
    const agent = (property?.responsible_agent || (property as any)?.sector_data?.responsible_agent || branding?.owner_name || "").toString().trim();
    return agent ? `${sName} ${agent}` : sName;
  });
  const [offerPriceInput, setOfferPriceInput] = useState<string>(() =>
    formatThousandsInput(initialOfferPrice || property?.price)
  );
  const [offerCurrency, setOfferCurrency] = useState<string>(() => (property?.currency || "GBP").toUpperCase());
  const [offerValidityPeriod, setOfferValidityPeriod] = useState<string>("7 (yedi) gün");
  const [offerFreeNotes, setOfferFreeNotes] = useState<string>("");
  const [customClauses, setCustomClauses] = useState<string>("");

  // Property Showing Agreement (YER GÖSTERME SÖZLEŞMESİ) specific states
  const [authorizedPersonIdentity, setAuthorizedPersonIdentity] = useState<string>(
    () => branding?.owner_identity || "1170237140"
  );
  const [brokerAddress, setBrokerAddress] = useState<string>(
    () => branding?.address || "Atatürk Caddesi No: 81/A Küçük Kaymaklı / Lefkoşa"
  );
  const [clientAddress, setClientAddress] = useState<string>("");
  const [showingItem1Details, setShowingItem1Details] = useState<string>(() =>
    buildDefaultShowingPropertyDetails(property)
  );
  const [showingItem1Price, setShowingItem1Price] = useState<string>(() => {
    const sym =
      property?.currency === "GBP"
        ? "£"
        : property?.currency === "USD"
        ? "$"
        : property?.currency === "EUR"
        ? "€"
        : "TL";
    const numStr = formatThousandsInput(property?.price);
    return numStr ? `${numStr} ${sym}` : "";
  });
  const [showingItem2Details, setShowingItem2Details] = useState<string>("");
  const [showingItem2Price, setShowingItem2Price] = useState<string>("");

  // 1st Signature: Buyer / Tenant (Priority 1)
  const [signed, setSigned] = useState<boolean>(false);
  const [signingName, setSigningName] = useState<string>(initialClientName || "");
  const [signatureImage, setSignatureImage] = useState<string>("");
  const [isSigningActive, setIsSigningActive] = useState<boolean>(false);

  // 2nd Signature: Seller / Property Owner (Priority 2 - Finalization)
  const [sellerSigned, setSellerSigned] = useState<boolean>(false);
  const [sellerSigningName, setSellerSigningName] = useState<string>(() => resolveOwnerName(property));
  const [sellerSignatureImage, setSellerSignatureImage] = useState<string>("");
  const [isSellerSigningActive, setIsSellerSigningActive] = useState<boolean>(false);

  const [saving, setSaving] = useState<boolean>(false);

  React.useEffect(() => {
    if (property) {
      const rMeta = buildDefaultRentalPropertyMeta(property);
      const det = initialContractDoc?.details;
      if (det) {
        setActiveDocId(initialContractDoc.id || `virtual-contract-${Date.now()}`);
        setSelectedTemplateId(det.templateId || initialTemplateId || (property.listing_intent === 'rent' ? "rental_agreement" : "sales_brokerage"));
        setClientName(det.clientName || initialClientName || "");
        setClientIdentity(det.clientIdentity || "");
        setBuyerIdType(det.buyerIdType || (property.listing_intent === "rent" ? "TC kimlik" : "KKTC KİMLİK"));
        setClientPhone(det.clientPhone || initialClientPhone || "");
        setOwnerName(det.ownerName || resolveOwnerName(property));
        setOwnerPhone(det.ownerPhone || resolveOwnerPhone(property));
        setSellerIdentity(det.sellerIdentity || resolveOwnerIdentity(property));
        setSellerIdType(det.sellerIdType || (property.listing_intent === "rent" ? "KKTC kimlik" : "KKTC Kimlik Kartı"));
        setCommissionRate(det.commissionRate || (property.listing_intent === 'rent' ? "1 Aylık Kira Bedeli" : "5"));
        setDepositAmount(det.depositAmount || getInitialDeposit(property));
        setRentDuration(det.rentDuration || "1 (Bir) Yıl");
        setPaymentDay(det.paymentDay || "Her Ayın En Geç 5 (Beş)’inde Ödenecektir.");
        setRentalPropertyDef(det.rentalPropertyDef || rMeta.rentalPropertyDef);
        setRentalUsagePurpose(det.rentalUsagePurpose || rMeta.rentalUsagePurpose);
        setRentalAddress(det.rentalAddress || rMeta.rentalAddress);
        setRentalDistrict(det.rentalDistrict || rMeta.rentalDistrict);
        setRentalTownVillage(det.rentalTownVillage || rMeta.rentalTownVillage);
        setKocanNo(det.kocanNo ?? rMeta.kocanNo);
        setPaftaNo(det.paftaNo ?? rMeta.paftaNo);
        setAdaNo(det.adaNo ?? rMeta.adaNo);
        setParselNo(det.parselNo ?? rMeta.parselNo);
        setRentPriceInput(formatThousandsInput(det.rentPriceRaw || property?.price));
        setRentCurrency((det.rentCurrency || (property?.currency === "TRY" ? "TL" : property?.currency) || "TL").toUpperCase());
        setRentPaymentMethod(det.rentPaymentMethod || "Aylık Ödemeli");
        if (det.rentStartDate) setRentStartDate(det.rentStartDate);
        if (det.rentEndDate) setRentEndDate(det.rentEndDate);
        setSalePropertyDetails(det.salePropertyDetails || buildDefaultSalePropertyDetails(property));
        setSalePriceInput(formatThousandsInput(det.salePriceRaw || property?.price));
        setSaleCurrency((det.saleCurrency || property?.currency || "GBP").toUpperCase());
        if (det.depositDate) setDepositDate(det.depositDate);
        if (det.deedTransferDate) setDeedTransferDate(det.deedTransferDate);
        setPaymentDeadlineMonths(det.paymentDeadlineMonths || "4 (dört) ay");
        setGracePeriodDays(det.gracePeriodDays || "14");
        if (det.taxClauseText) setTaxClauseText(det.taxClauseText);
        setWitness1Name(det.witness1Name || branding?.owner_name || "Emrah CEYHAN");
        setWitness1Identity(det.witness1Identity || branding?.owner_identity || "1170237140");
        setWitness2Name(det.witness2Name || "");
        setWitness2Identity(det.witness2Identity || "");
        setAuthorizedPersonIdentity(det.authorizedPersonIdentity || branding?.owner_identity || "1170237140");
        setBrokerAddress(det.brokerAddress || branding?.address || "Atatürk Caddesi No: 81/A Küçük Kaymaklı / Lefkoşa");
        setClientAddress(det.clientAddress || "");
        setShowingItem1Details(det.showingItem1Details || buildDefaultShowingPropertyDetails(property));
        const defaultSym =
          property?.currency === "GBP"
            ? "£"
            : property?.currency === "USD"
            ? "$"
            : property?.currency === "EUR"
            ? "€"
            : "TL";
        const defaultNum = formatThousandsInput(property?.price);
        setShowingItem1Price(det.showingItem1Price || (defaultNum ? `${defaultNum} ${defaultSym}` : ""));
        setShowingItem2Details(det.showingItem2Details || "");
        setShowingItem2Price(det.showingItem2Price || "");
        setCustomClauses(det.customClauses || "");
        setSigned(Boolean(det.signed));
        setSigningName(det.signingName || det.clientName || "");
        setSignatureImage(det.signatureImage || "");
        setSellerSigned(Boolean(det.sellerSigned));
        setSellerSigningName(det.sellerSigningName || det.ownerName || resolveOwnerName(property));
        setSellerSignatureImage(det.sellerSignatureImage || "");
      } else {
        setActiveDocId(`virtual-contract-${Date.now()}`);
        setSelectedTemplateId(
          initialTemplateId || (property.listing_intent === 'rent' ? "rental_agreement" : "sales_brokerage")
        );
        setDepositAmount(getInitialDeposit(property));
        setRentDuration("1 (Bir) Yıl");
        setPaymentDay("Her Ayın En Geç 5 (Beş)’inde Ödenecektir.");
        setRentalPropertyDef(rMeta.rentalPropertyDef);
        setRentalUsagePurpose(rMeta.rentalUsagePurpose);
        setRentalAddress(rMeta.rentalAddress);
        setRentalDistrict(rMeta.rentalDistrict);
        setRentalTownVillage(rMeta.rentalTownVillage);
        setKocanNo(rMeta.kocanNo);
        setPaftaNo(rMeta.paftaNo);
        setAdaNo(rMeta.adaNo);
        setParselNo(rMeta.parselNo);
        setRentPriceInput(formatThousandsInput(property?.price));
        const initCurr = (property?.currency || "TRY").toUpperCase();
        setRentCurrency(initCurr === "TRY" ? "TL" : initCurr);
        setRentPaymentMethod("Aylık Ödemeli");
        const todayIso = new Date().toISOString().split("T")[0];
        setRentStartDate(todayIso);
        setRentEndDate(getDefaultRentEndIso(todayIso));
        const resolvedOwner = resolveOwnerName(property);
        setOwnerName(resolvedOwner);
        setOwnerPhone(resolveOwnerPhone(property));
        setSellerIdentity(resolveOwnerIdentity(property));
        setSellerSigningName(resolvedOwner);
        setSalePropertyDetails(buildDefaultSalePropertyDetails(property));
        setSalePriceInput(formatThousandsInput(property?.price));
        setSaleCurrency((property?.currency || "GBP").toUpperCase());
        setDepositDate(todayIso);
        setDeedTransferDate(getDefaultDeedTransferIso());
        setOfferPropertyNature(detectDefaultPropertyNature(property));
        setOfferPropertyDetails(buildDefaultOfferPropertyDetails(property));
        setViewingDate(initialViewingDate || todayIso);
        const sName = getDisplayStoreNameInit();
        const agent = (property?.responsible_agent || (property as any)?.sector_data?.responsible_agent || branding?.owner_name || "").toString().trim();
        setAgentAndCompany(agent ? `${sName} ${agent}` : sName);
        setAuthorizedPersonIdentity(branding?.owner_identity || "1170237140");
        setBrokerAddress(branding?.address || "Atatürk Caddesi No: 81/A Küçük Kaymaklı / Lefkoşa");
        setClientAddress("");
        setShowingItem1Details(buildDefaultShowingPropertyDetails(property));
        const defaultSym =
          property?.currency === "GBP"
            ? "£"
            : property?.currency === "USD"
            ? "$"
            : property?.currency === "EUR"
            ? "€"
            : "TL";
        const defaultNum = formatThousandsInput(property?.price);
        setShowingItem1Price(defaultNum ? `${defaultNum} ${defaultSym}` : "");
        setShowingItem2Details("");
        setShowingItem2Price("");
        setOfferPriceInput(formatThousandsInput(initialOfferPrice || property?.price));
        setOfferCurrency((property?.currency || "GBP").toUpperCase());
        setCustomClauses("");
        setSigned(false);
        setSignatureImage("");
        setSellerSigned(false);
        setSellerSignatureImage("");
        if (initialClientName) {
          setClientName(initialClientName);
          setSigningName(initialClientName);
        }
        if (initialClientPhone) {
          setClientPhone(initialClientPhone);
        }
      }
    }
  }, [property, initialTemplateId, initialOfferPrice, initialClientName, initialClientPhone, initialViewingDate, initialContractDoc]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef<boolean>(false);

  const sellerCanvasRef = useRef<HTMLCanvasElement>(null);
  const isSellerDrawing = useRef<boolean>(false);

  // Canvas drawing handlers for Buyer signature (Step 1)
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

  // Canvas drawing handlers for Seller signature (Step 2)
  const startSellerDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = sellerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    isSellerDrawing.current = true;
    const pos = getEventPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const drawSeller = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isSellerDrawing.current) return;
    e.preventDefault();
    const canvas = sellerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getEventPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#064e3b";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    setIsSellerSigningActive(true);
  };

  const stopSellerDrawing = () => {
    isSellerDrawing.current = false;
  };

  const clearSellerCanvas = () => {
    const canvas = sellerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSellerSignatureImage("");
    setIsSellerSigningActive(false);
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

  const orderedTemplateIds = property.listing_intent === "rent"
    ? ["rental_agreement", "showing_agreement", "rental_authorization", "eviction_undertaking"]
    : ["sales_brokerage", "showing_agreement", "offer_letter", "exclusivity_agreement", "inter_branch_split"];

  const filteredTemplates = orderedTemplateIds
    .map((tid) => contractTemplates.find((t) => t.id === tid))
    .filter((t): t is ContractTemplate => Boolean(t));

  const currentTemplate = filteredTemplates.find(t => t.id === selectedTemplateId) || filteredTemplates[0] || contractTemplates[0];
  const isBilateralContract = ["sales_brokerage", "rental_agreement", "offer_letter"].includes(selectedTemplateId);

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

  const formattedPriceNum = Number(property.price).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const symbol = property.currency === 'GBP' ? '£' : property.currency === 'USD' ? '$' : property.currency === 'EUR' ? '€' : '₺';
  const priceWords = numberToTrWords(property.price, property.currency || 'GBP');
  const propertyPriceFormatted = `${formattedPriceNum} ${symbol} (${priceWords})`;

  const computedRemainingSaleRaw = computeRemainingSaleAmount(
    salePriceInput || formattedPriceNum,
    depositAmount
  );

  const placeholderValues: ContractPlaceholderValues = {
    storeName: storeNameVal,
    storePhone: storePhoneVal,
    storeEmail: storeEmailVal,
    clientName: clientName || "[Alıcı / Kiracı Adı]",
    clientIdentity: clientIdentity || "[Kimlik / Pasaport No]",
    buyerIdType: buyerIdType || "KKTC KİMLİK",
    clientPhone: clientPhone || "[Telefon Numarası]",
    ownerName: ownerName || resolveOwnerName(property) || "Mülk Sahibi",
    ownerPhone: ownerPhone || resolveOwnerPhone(property) || "",
    sellerIdentity: sellerIdentity || "[Satıcı Kimlik No]",
    sellerIdType: sellerIdType || "KKTC Kimlik Kartı",
    propertyTitle: property.type === 'land' 
      ? `[Ref: ${property.reference_no || `LP-${property.id}`}] ${property.mahalle || ''} Mah. Ada: ${property.ada || '...'}, Parsel: ${property.parsel || '...'}, Pafta: ${property.pafta || '...'}`
      : `[Ref: ${property.reference_no || `LP-${property.id}`}] ${property.title}`,
    propertyLocation: resolvePropertyRegionLabel(property),
    propertyPrice: propertyPriceFormatted,
    propertyBlockPlot: property.block_plot,
    commissionRate: property.listing_intent === 'rent' ? commissionRate : (commissionRate.includes('%') ? commissionRate : `%${commissionRate}`),
    contractDate: formatTrDate(contractDate),
    propertyAddress: selectedTemplateId === "rental_agreement" ? (rentalAddress || property.address) : property.address,
    splitRatio: splitRatio,
    contractDuration: contractDuration,
    evictionDate: formatTrDate(evictionDate),
    depositAmount: depositAmount,
    rentDuration: rentDuration,
    paymentDay: paymentDay,
    // Rental Agreement (KİRA SÖZLEŞMESİ) fields
    rentalPropertyDef: rentalPropertyDef || defaultRentalMeta.rentalPropertyDef,
    rentalUsagePurpose: rentalUsagePurpose || defaultRentalMeta.rentalUsagePurpose,
    rentalDistrict: rentalDistrict || defaultRentalMeta.rentalDistrict,
    rentalTownVillage: rentalTownVillage || defaultRentalMeta.rentalTownVillage,
    kocanNo: kocanNo,
    paftaNo: paftaNo,
    adaNo: adaNo,
    parselNo: parselNo,
    rentPriceRaw: rentPriceInput || formattedPriceNum,
    rentCurrency: rentCurrency || "TL",
    rentPaymentMethod: rentPaymentMethod || "Aylık Ödemeli",
    rentStartDate: formatTrDate(rentStartDate) || formatTrDate(contractDate),
    rentEndDate: formatTrDate(rentEndDate),
    // Sales Contract (SATIŞ SÖZLEŞMESİ) fields
    salePropertyDetails: salePropertyDetails || buildDefaultSalePropertyDetails(property),
    salePriceRaw: salePriceInput || formattedPriceNum,
    saleCurrency: saleCurrency || (property.currency || "GBP"),
    depositDate: formatTrDate(depositDate) || formatTrDate(contractDate),
    remainingAmountRaw: computedRemainingSaleRaw,
    deedTransferDate: formatTrDate(deedTransferDate),
    paymentDeadlineMonths: paymentDeadlineMonths || "4 (dört) ay",
    gracePeriodDays: gracePeriodDays || "14",
    taxClauseText: taxClauseText,
    witness1Name: witness1Name,
    witness1Identity: witness1Identity,
    witness2Name: witness2Name,
    witness2Identity: witness2Identity,
    // Offer Letter fields
    offerPropertyNature: offerPropertyNature || detectDefaultPropertyNature(property),
    offerPropertyDetails: offerPropertyDetails || buildDefaultOfferPropertyDetails(property),
    viewingDate: formatTrDate(viewingDate) || formatTrDate(contractDate),
    agentAndCompany: agentAndCompany || storeNameVal,
    offerPrice: formatOfferPriceWithWords(
      `${offerPriceInput || formattedPriceNum} ${offerCurrency}`,
      offerCurrency
    ),
    offerValidityPeriod: offerValidityPeriod || "7 (yedi) gün",
    offerFreeNotes: offerFreeNotes,
    customClauses: customClauses,
    // Property Showing Agreement (YER GÖSTERME SÖZLEŞMESİ) fields
    authorizedPersonIdentity: authorizedPersonIdentity || "1170237140",
    brokerAddress: brokerAddress || "Atatürk Caddesi No: 81/A Küçük Kaymaklı / Lefkoşa",
    clientAddress: clientAddress,
    showingItem1Details: showingItem1Details || buildDefaultShowingPropertyDetails(property),
    showingItem1Price: showingItem1Price || `${formattedPriceNum} ${symbol}`,
    showingItem2Details: showingItem2Details,
    showingItem2Price: showingItem2Price,
    // Sequential Dual Signatures
    isSigned: signed,
    signingName: signingName || clientName,
    signatureImage: signatureImage,
    sellerSigned: sellerSigned,
    sellerSigningName: sellerSigningName || ownerName || resolveOwnerName(property),
    sellerSignatureImage: sellerSignatureImage,
    contractStage: signed && sellerSigned ? "finalized" : signed ? "buyer_signed" : "draft",
    isFurnishedRental: property.listing_intent === 'rent' && (
      property.furnished === true ||
      (property as any).furnished === 'true' ||
      (property as any).furnished === 'esyali' ||
      (property as any).furnished === 'furnished' ||
      property.sector_data?.furnished === true ||
      property.sector_data?.furnished === 'esyali' ||
      property.sector_data?.furnished === 'furnished'
    ),
    fixturePhotosCount: Array.isArray(property.fixture_photos) 
      ? property.fixture_photos.length 
      : (typeof (property as any).fixture_photos === 'string' 
          ? JSON.parse((property as any).fixture_photos || '[]').length 
          : 0),
    fixturePhotos: Array.isArray(property.fixture_photos)
      ? property.fixture_photos
      : (typeof (property as any).fixture_photos === 'string'
          ? (() => { try { return JSON.parse((property as any).fixture_photos || '[]'); } catch { return []; } })()
          : (Array.isArray(property.sector_data?.fixture_photos) ? property.sector_data.fixture_photos : []))
  };

  const isFurnishedRental = placeholderValues.isFurnishedRental;
  const fixturePhotosCount = placeholderValues.fixturePhotosCount || 0;

  const { html } = currentTemplate.getTemplate(placeholderValues);

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

  const buildContractSignUrl = (role: "buyer" | "seller" | "final" = "buyer", customDocId?: string) => {
    const base = `${window.location.origin}/contract/sign/${property.id}`;
    const resolvedDocId = customDocId || activeDocId;
    const params = new URLSearchParams({
      docId: resolvedDocId,
      role: role === "final" ? "buyer" : role,
      view: role === "final" ? "final" : "sign",
      client: clientName || "",
      phone: clientPhone || "",
      identity: clientIdentity || "",
      buyerIdType: buyerIdType || "KKTC KİMLİK",
      ownerName: placeholderValues.ownerName || "",
      ownerPhone: ownerPhone || "",
      sellerIdentity: sellerIdentity || "",
      sellerIdType: sellerIdType || "KKTC Kimlik Kartı",
      templateId: selectedTemplateId,
      commissionRate: commissionRate || "",
      contractDate: placeholderValues.contractDate || "",
      splitRatio: splitRatio || "",
      contractDuration: contractDuration || "",
      evictionDate: evictionDate || "",
      depositAmount: depositAmount || "",
      rentDuration: rentDuration || "",
      paymentDay: paymentDay || "",
      // Rental contract params
      rentalPropertyDef: placeholderValues.rentalPropertyDef || "",
      rentalUsagePurpose: placeholderValues.rentalUsagePurpose || "",
      rentalAddress: placeholderValues.propertyAddress || "",
      rentalDistrict: placeholderValues.rentalDistrict || "",
      rentalTownVillage: placeholderValues.rentalTownVillage || "",
      kocanNo: kocanNo || "",
      paftaNo: paftaNo || "",
      adaNo: adaNo || "",
      parselNo: parselNo || "",
      rentPriceRaw: String(placeholderValues.rentPriceRaw || ""),
      rentCurrency: placeholderValues.rentCurrency || "TL",
      rentPaymentMethod: placeholderValues.rentPaymentMethod || "Aylık Ödemeli",
      rentStartDate: placeholderValues.rentStartDate || "",
      rentEndDate: placeholderValues.rentEndDate || "",
      // Sales contract params
      salePropertyDetails: placeholderValues.salePropertyDetails || "",
      salePriceRaw: String(placeholderValues.salePriceRaw || ""),
      saleCurrency: placeholderValues.saleCurrency || "GBP",
      depositDate: placeholderValues.depositDate || "",
      deedTransferDate: placeholderValues.deedTransferDate || "",
      paymentDeadlineMonths: placeholderValues.paymentDeadlineMonths || "",
      gracePeriodDays: placeholderValues.gracePeriodDays || "",
      taxClauseText: placeholderValues.taxClauseText || "",
      witness1Name: placeholderValues.witness1Name || "",
      witness1Identity: placeholderValues.witness1Identity || "",
      witness2Name: placeholderValues.witness2Name || "",
      witness2Identity: placeholderValues.witness2Identity || "",
      // Offer letter params
      offerPrice: placeholderValues.offerPrice || "",
      viewingDate: placeholderValues.viewingDate || "",
      offerValidityPeriod: placeholderValues.offerValidityPeriod || "",
      offerFreeNotes: placeholderValues.offerFreeNotes || "",
      offerPropertyNature: placeholderValues.offerPropertyNature || "",
      offerPropertyDetails: placeholderValues.offerPropertyDetails || "",
      agentAndCompany: placeholderValues.agentAndCompany || "",
      authorizedPersonIdentity: placeholderValues.authorizedPersonIdentity || "",
      brokerAddress: placeholderValues.brokerAddress || "",
      clientAddress: placeholderValues.clientAddress || "",
      showingItem1Details: placeholderValues.showingItem1Details || "",
      showingItem1Price: placeholderValues.showingItem1Price || "",
      showingItem2Details: placeholderValues.showingItem2Details || "",
      showingItem2Price: placeholderValues.showingItem2Price || "",
      customClauses: customClauses || ""
    });
    return `${base}?${params.toString()}`;
  };

  // Persist contract state into property.documents so Seller link / Final link always resolves the exact document
  const persistContractRecord = async (overrideFlags?: {
    buyerSigned?: boolean;
    buyerSigImg?: string;
    sellerSigned?: boolean;
    sellerSigImg?: string;
    silent?: boolean;
  }) => {
    if (!onSaveContract) return activeDocId;
    const isBuyerSigned = overrideFlags?.buyerSigned ?? signed;
    const bSigImg = overrideFlags?.buyerSigImg ?? signatureImage;
    const isSellerSigned = overrideFlags?.sellerSigned ?? sellerSigned;
    const sSigImg = overrideFlags?.sellerSigImg ?? sellerSignatureImage;

    const stage = isBuyerSigned && isSellerSigned
      ? "finalized"
      : isBuyerSigned
      ? "buyer_signed"
      : "draft";

    const docName = stage === "finalized"
      ? `FİNAL İMZALI ${currentTemplate.titleTr} (Alıcı: ${clientName || 'Alıcı'} + Satıcı: ${placeholderValues.ownerName}) - ${formatTrDate(contractDate)}`
      : stage === "buyer_signed"
      ? isBilateralContract
        ? `1. İmza (Alıcı Onaylı) ${currentTemplate.titleTr} - ${clientName || 'Alıcı'} [Satıcı İmzası Bekleniyor] (${formatTrDate(contractDate)})`
        : `İMZALI ${currentTemplate.titleTr} - ${clientName || 'Müşteri'} (${formatTrDate(contractDate)})`
      : `${currentTemplate.titleTr} - ${clientName || 'Taslak'} (${formatTrDate(contractDate)})`;

    const docRecord = {
      id: activeDocId,
      name: docName,
      category: "contract",
      file_url: "is_virtual_contract",
      upload_date: formatTrDate(contractDate),
      details: {
        templateId: selectedTemplateId,
        clientName,
        clientIdentity,
        buyerIdType,
        clientPhone,
        clientAddress: placeholderValues.clientAddress,
        ownerName: placeholderValues.ownerName,
        ownerPhone,
        sellerIdentity,
        sellerIdType,
        commissionRate,
        contractDate,
        signed: isBuyerSigned,
        buyerSigned: isBuyerSigned,
        signingName: signingName || clientName,
        signatureImage: bSigImg,
        sellerSigned: isSellerSigned,
        sellerSigningName: sellerSigningName || placeholderValues.ownerName,
        sellerSignatureImage: sSigImg,
        contractStage: stage,
        splitRatio,
        contractDuration,
        evictionDate,
        depositAmount,
        rentDuration,
        paymentDay,
        rentalPropertyDef: placeholderValues.rentalPropertyDef,
        rentalUsagePurpose: placeholderValues.rentalUsagePurpose,
        rentalAddress: placeholderValues.propertyAddress,
        rentalDistrict: placeholderValues.rentalDistrict,
        rentalTownVillage: placeholderValues.rentalTownVillage,
        kocanNo,
        paftaNo,
        adaNo,
        parselNo,
        rentPriceRaw: placeholderValues.rentPriceRaw,
        rentCurrency: placeholderValues.rentCurrency,
        rentPaymentMethod: placeholderValues.rentPaymentMethod,
        rentStartDate: placeholderValues.rentStartDate,
        rentEndDate: placeholderValues.rentEndDate,
        salePropertyDetails: placeholderValues.salePropertyDetails,
        salePriceRaw: placeholderValues.salePriceRaw,
        saleCurrency: placeholderValues.saleCurrency,
        depositDate: placeholderValues.depositDate,
        remainingAmountRaw: placeholderValues.remainingAmountRaw,
        deedTransferDate: placeholderValues.deedTransferDate,
        paymentDeadlineMonths: placeholderValues.paymentDeadlineMonths,
        gracePeriodDays: placeholderValues.gracePeriodDays,
        taxClauseText: placeholderValues.taxClauseText,
        witness1Name: placeholderValues.witness1Name,
        witness1Identity: placeholderValues.witness1Identity,
        witness2Name: placeholderValues.witness2Name,
        witness2Identity: placeholderValues.witness2Identity,
        offerPropertyNature: placeholderValues.offerPropertyNature,
        offerPropertyDetails: placeholderValues.offerPropertyDetails,
        viewingDate: placeholderValues.viewingDate,
        agentAndCompany: placeholderValues.agentAndCompany,
        authorizedPersonIdentity: placeholderValues.authorizedPersonIdentity,
        brokerAddress: placeholderValues.brokerAddress,
        showingItem1Details: placeholderValues.showingItem1Details,
        showingItem1Price: placeholderValues.showingItem1Price,
        showingItem2Details: placeholderValues.showingItem2Details,
        showingItem2Price: placeholderValues.showingItem2Price,
        offerPrice: placeholderValues.offerPrice,
        offerValidityPeriod: placeholderValues.offerValidityPeriod,
        offerFreeNotes: placeholderValues.offerFreeNotes,
        customClauses: placeholderValues.customClauses,
        propertyLocation: placeholderValues.propertyLocation,
        isFurnishedRental: placeholderValues.isFurnishedRental,
        fixturePhotosCount: placeholderValues.fixturePhotosCount,
        fixturePhotos: placeholderValues.fixturePhotos
      }
    };

    await onSaveContract(docRecord);
    return activeDocId;
  };

  // 1. Send to Buyer for 1st Priority Signature
  const handleShareBuyerWhatsApp = async () => {
    const isOfferLetter = selectedTemplateId === "offer_letter";
    if (!clientName.trim() || (!isOfferLetter && !clientIdentity.trim()) || !clientPhone.trim()) {
      alert("Lütfen Alıcıya imza bağlantısı göndermeden önce Alıcı Adı Soyadı, Kimlik No ve Telefon Numarasını eksiksiz doldurunuz.");
      return;
    }
    try {
      await persistContractRecord({ silent: true });
    } catch {
      // ignore if offline
    }
    const formattedPhone = formatPhoneForWhatsApp(clientPhone);
    const signUrl = buildContractSignUrl("buyer", activeDocId);
    const message = `Sayın *${clientName}*,\n\n*[Ref: ${property.reference_no || `LP-${property.id}`}] ${property.title}* taşınmazı için hazırlanan resmi *${currentTemplate.titleTr}* belgesi **1. İmza (Alıcı Onayı)** için tarafınıza sunulmuştur.\n\nSözleşmeyi mobil cihazınızdan incelemek ve dijital olarak *İMZALAMAK* için lütfen aşağıdaki bağlantıya tıklayınız:\n\n${signUrl}\n\nSözleşme Tarihi: ${placeholderValues.contractDate}\n\nSaygılarımızla,\n*${storeNameVal}*\nİrtibat: ${storePhoneVal}`;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // 2. Send Buyer-Signed Contract to Seller for Final Signature
  const handleShareSellerWhatsApp = async () => {
    if (isBilateralContract && !signed) {
      alert("İmza önceliği ALICI'dadır! Satıcıya imza için göndermeden önce sözleşmenin Alıcı tarafından imzalanmış olması gerekmektedir.");
      return;
    }
    try {
      await persistContractRecord({ silent: true });
    } catch {
      // ignore
    }
    const targetPhone = ownerPhone || resolveOwnerPhone(property);
    const formattedOwnerPhone = targetPhone ? formatPhoneForWhatsApp(targetPhone) : "";
    const signUrl = buildContractSignUrl("seller", activeDocId);
    const message = `*2. İMZA (SATICI FİNAL ONAYI) - ${currentTemplate.titleTr.toUpperCase()}*\nTarih: ${placeholderValues.contractDate}\n\n*Sn. ${placeholderValues.ownerName}*,\n\n*[Ref: ${property.reference_no || `LP-${property.id}`}] ${property.title}* taşınmazınız için hazırlanan *${currentTemplate.titleTr}*, Alıcı *${clientName || "Alıcı"}* tarafından dijital olarak imzalanmıştır (✔ 1. İmza Tamamlandı).\n\nAlıcı imzalı sözleşmeyi incelemek ve **Satıcı olarak aynı sözleşme üzerinde dijital imzanızla FİNALLEMEK** için lütfen aşağıdaki bağlantıya tıklayınız:\n\n${signUrl}\n\nSaygılarımızla,\n*${storeNameVal}*\nİrtibat: ${storePhoneVal}`;
    if (formattedOwnerPhone) {
      window.open(`https://wa.me/${formattedOwnerPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  // 3. Send Finalized Dual-Signed Contract to Buyer & Seller
  const handleSendFinalizedWhatsApp = async (recipient: "buyer" | "seller") => {
    try {
      await persistContractRecord({ silent: true });
    } catch {
      // ignore
    }
    const finalUrl = buildContractSignUrl("final", activeDocId);
    const isBuyer = recipient === "buyer";
    const rawPhone = isBuyer ? clientPhone : (ownerPhone || resolveOwnerPhone(property));
    const formattedPhone = rawPhone ? formatPhoneForWhatsApp(rawPhone) : "";
    const recipientName = isBuyer ? (clientName || "Alıcı") : (placeholderValues.ownerName || "Satıcı");

    const message = `*FİNAL İMZALI ${currentTemplate.titleTr.toUpperCase()} (ALICI + SATICI ONAYLI)*\nTarih: ${placeholderValues.contractDate}\n\nSayın *${recipientName}*,\n\n*[Ref: ${property.reference_no || `LP-${property.id}`}] ${property.title}* taşınmazına ait *${currentTemplate.titleTr}*, hem Alıcı (*${clientName}*) hem de Satıcı (*${placeholderValues.ownerName}*) tarafından karşılıklı dijital imzalarla tamamlanarak sistemde mühürlenmiştir.\n\nHer iki tarafın imzasını taşıyan **Sözleşmenin Son Halini** görüntülemek ve PDF olarak indirmek için:\n\n${finalUrl}\n\nHayırlı ve uğurlu olmasını dileriz.\n*${storeNameVal}*\nİrtibat: ${storePhoneVal}`;

    if (formattedPhone) {
      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleSaveContract = async () => {
    const isOfferLetter = selectedTemplateId === "offer_letter";
    if (!clientName.trim() || (!isOfferLetter && !clientIdentity.trim())) {
      alert("Lütfen sözleşmeyi kaydetmeden önce Alıcı Adı Soyadı ve Kimlik/Pasaport No bilgilerini giriniz.");
      return;
    }
    if (!onSaveContract) return;
    setSaving(true);
    try {
      await persistContractRecord();
      alert(
        signed && sellerSigned
          ? "Alıcı ve Satıcı imzalı FİNAL SÖZLEŞME sistem arşivine kaydedildi! Şimdi son halini Alıcı ve Satıcıya iletebilirsiniz."
          : signed
          ? "1. İmza (Alıcı imzalı sözleşme) kaydedildi! Şimdi 2. adım olarak Satıcı imzasına geçebilir veya Satıcıya imza bağlantısı gönderebilirsiniz."
          : "Sözleşme başarıyla kaydedildi!"
      );
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
      className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-hidden animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl w-full max-w-6xl h-[92vh] max-h-[92dvh] flex flex-col md:flex-row overflow-hidden shadow-2xl relative border-2 border-slate-300 text-slate-950">
        
        {/* Mobile Tab Bar & Header */}
        <div className="md:hidden flex items-center justify-between bg-slate-900 border-b border-slate-800 p-2 shrink-0 gap-2">
          <div className="flex bg-slate-800 p-1 rounded-xl gap-1 flex-1">
            <button
              onClick={() => setActiveMobileTab('params')}
              className={`flex-1 py-1.5 text-center text-xs font-black rounded-lg transition-all ${
                activeMobileTab === 'params' 
                  ? 'bg-amber-400 text-slate-950 shadow-sm' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Sözleşme Bilgileri
            </button>
            <button
              onClick={() => setActiveMobileTab('preview')}
              className={`flex-1 py-1.5 text-center text-xs font-black rounded-lg transition-all ${
                activeMobileTab === 'preview' 
                  ? 'bg-amber-400 text-slate-950 shadow-sm' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Sözleşme Ön İzleme
            </button>
          </div>

          <button 
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all shrink-0 active:scale-95 cursor-pointer"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Left Side: Parameters Form - High-Contrast Daylight Corporate Theme */}
        <div className={`w-full md:w-[42%] bg-slate-50 p-3.5 sm:p-4 flex-col justify-between border-r-2 border-slate-300 overflow-y-auto text-slate-950 ${
          activeMobileTab === 'params' ? 'flex' : 'hidden md:flex'
        }`}>
          <div className="space-y-3.5">
            <div className="flex justify-between items-start border-b border-slate-200 pb-2.5">
              <div>
                <span className="text-[10px] bg-slate-900 text-white font-black tracking-widest px-2 py-0.5 rounded uppercase font-mono">
                  Ref: {property.reference_no || `LP-${property.id}`}
                </span>
                <h3 className="text-sm sm:text-base font-black text-slate-950 mt-1">Resmi Sözleşme & Dijital İmza Merkezi</h3>
              </div>
              <button 
                onClick={onClose}
                className="hidden md:flex p-1.5 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-300 rounded-lg transition-all shrink-0 cursor-pointer"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Template Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">1. Sözleşme Şablonu</span>
              <div className="grid grid-cols-1 gap-1.5">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplateId(template.id);
                    }}
                    className={`px-3 py-2 rounded-xl flex items-center justify-between gap-2 transition-all text-left border-2 cursor-pointer ${
                      selectedTemplateId === template.id 
                        ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                        : 'bg-white border-slate-300 text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className={`w-4 h-4 shrink-0 ${selectedTemplateId === template.id ? 'text-amber-400' : 'text-slate-600'}`} />
                      <h5 className="text-xs font-black leading-tight truncate">{template.titleTr}</h5>
                    </div>
                    {["sales_brokerage", "rental_agreement", "offer_letter"].includes(template.id) && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase shrink-0 ${
                        selectedTemplateId === template.id ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-800'
                      }`}>
                        Alıcı ➔ Satıcı İmzalı
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* SATICI / KİRAYA VEREN (Mülk Sahibi) Bilgileri */}
            {isBilateralContract && (
              <div className="p-3 bg-white border-2 border-slate-300 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider">
                    {selectedTemplateId === "rental_agreement"
                      ? "KİRAYA VEREN (MÜLK SAHİBİ) BİLGİLERİ"
                      : "SATICI / MÜLK SAHİBİ BİLGİLERİ"}
                  </span>
                  <span className="text-[9px] font-black bg-slate-900 text-amber-400 px-2 py-0.5 rounded">
                    2. İmza (Final)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">
                      {selectedTemplateId === "rental_agreement" ? "Kiraya Veren Adı Soyadı *" : "Satıcı Adı Soyadı *"}
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                      placeholder={selectedTemplateId === "rental_agreement" ? "Örn: TUNCEL SOYCAN" : "Örn: İMAM YILDIRIM"}
                      value={ownerName}
                      onChange={(e) => {
                        setOwnerName(e.target.value);
                        setSellerSigningName(e.target.value);
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">
                      {selectedTemplateId === "rental_agreement" ? "Kiraya Veren Telefon" : "Satıcı Telefon (WhatsApp)"}
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                      placeholder="Örn: 0548 839 4982"
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                    />
                  </div>
                </div>
                {(selectedTemplateId === "sales_brokerage" || selectedTemplateId === "rental_agreement") && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-900">Kimlik / Pasaport No</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                        placeholder={selectedTemplateId === "rental_agreement" ? "Örn: 2150296214" : "Örn: 2010390619"}
                        value={sellerIdentity}
                        onChange={(e) => setSellerIdentity(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-900">Kimlik Türü</label>
                      <select
                        className="w-full bg-slate-50 border-2 border-slate-300 px-2 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                        value={sellerIdType}
                        onChange={(e) => setSellerIdType(e.target.value)}
                      >
                        <option value="KKTC kimlik">KKTC kimlik</option>
                        <option value="KKTC Kimlik Kartı">KKTC Kimlik Kartı</option>
                        <option value="TC kimlik">TC kimlik</option>
                        <option value="TC Kimlik Kartı">TC Kimlik Kartı</option>
                        <option value="Pasaport">Pasaport</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ALICI / KİRACI Bilgileri */}
            <div className="p-3 bg-white border-2 border-indigo-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-indigo-950 uppercase tracking-wider">
                  {selectedTemplateId === "rental_agreement" ? "KİRACI BİLGİLERİ" : "ALICI / MÜŞTERİ BİLGİLERİ"}
                </span>
                <span className="text-[9px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded">
                  1. İmza (Öncelikli)
                </span>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-900">
                    {selectedTemplateId === "rental_agreement" ? "Kiracı Adı Soyadı *" : "Alıcı Adı Soyadı *"}
                  </label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border-2 border-slate-300 pl-8 pr-3 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                      placeholder={selectedTemplateId === "rental_agreement" ? "Örn: KIVANÇ KÖKLÜ" : "Örn: NEVZAT GÜNGÖR"}
                      value={clientName}
                      onChange={(e) => {
                        setClientName(e.target.value);
                        setSigningName(e.target.value);
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Kimlik / Pasaport No *</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                      placeholder={selectedTemplateId === "rental_agreement" ? "Örn: 26710811422" : "Örn: 213066"}
                      value={clientIdentity}
                      onChange={(e) => setClientIdentity(e.target.value)}
                    />
                  </div>

                  {(selectedTemplateId === "sales_brokerage" || selectedTemplateId === "rental_agreement") && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-900">Kimlik Türü</label>
                      <select
                        className="w-full bg-slate-50 border-2 border-slate-300 px-2 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                        value={buyerIdType}
                        onChange={(e) => setBuyerIdType(e.target.value)}
                      >
                        <option value="TC kimlik">TC kimlik</option>
                        <option value="KKTC kimlik">KKTC kimlik</option>
                        <option value="KKTC KİMLİK">KKTC KİMLİK</option>
                        <option value="TC KİMLİK">TC KİMLİK</option>
                        <option value="PASAPORT">PASAPORT</option>
                      </select>
                    </div>
                  )}

                  <div className={(selectedTemplateId === "sales_brokerage" || selectedTemplateId === "rental_agreement") ? "space-y-1" : "space-y-1 sm:col-span-2"}>
                    <label className="text-[10px] font-black text-slate-900">
                      {selectedTemplateId === "rental_agreement" ? "Kiracı Telefon (WhatsApp) *" : "Alıcı Telefon (WhatsApp) *"}
                    </label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                      placeholder="Örn: 0548 863 89 31"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {property.listing_intent === 'rent' ? (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-900">Hizmet Komisyonu</label>
                      <input 
                        type="text"
                        className="w-full bg-slate-50 border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                        placeholder="1 Aylık Kira"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-900">Emlak Komisyonu (%)</label>
                      <div className="flex items-center gap-1.5">
                        <div className="relative w-20 shrink-0">
                          <span className="absolute left-2.5 top-1.5 text-xs text-slate-600 font-black">%</span>
                          <input 
                            type="number"
                            className="w-full bg-slate-50 border-2 border-slate-300 pl-6 pr-2 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                            placeholder="5"
                            min="1"
                            max="15"
                            value={commissionRate}
                            onChange={(e) => setCommissionRate(e.target.value)}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 truncate">Sözleşme Günü</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Sözleşme Tarihi</label>
                    <input 
                      type="date"
                      className="w-full bg-slate-50 border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                      value={contractDate}
                      onChange={(e) => setContractDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SATIŞ SÖZLEŞMESİ (sales_brokerage) Özel Değişkenleri */}
            {selectedTemplateId === "sales_brokerage" && (
              <div className="p-3 bg-amber-50/80 border-2 border-amber-300 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-950">
                    3. Satış Sözleşmesi Maddeleri & Değişkenler
                  </span>
                  <span className="text-[9px] font-black bg-slate-900 text-amber-400 px-2 py-0.5 rounded uppercase">
                    9 Madde • KKTC
                  </span>
                </div>

                {/* Madde 1: Taşınmaz Tapu & Koçan Bilgisi */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-900">
                    Madde 1 - Taşınmaz Koçan / Pafta / Ada / Parsel / Bağımsız Bölüm Tanımı
                  </label>
                  <textarea
                    rows={2}
                    className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-600"
                    placeholder="Örn: Lefkoşa Küçük Kaymaklı’da C3006 koçan numaralı, XXI 30-E-1,E-2 Pafta / Haritalı C Ada/Blok 1623 Parsel numarada kain 3. Kat 2 nolu daire"
                    value={salePropertyDetails}
                    onChange={(e) => setSalePropertyDetails(e.target.value)}
                  />
                </div>

                {/* Madde 2: Satış Bedeli, Kapora ve Otomatik Kalan Bakiye */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Satış Bedeli *</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="flex-1 min-w-0 bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                        placeholder="78.000"
                        value={salePriceInput}
                        onChange={(e) => setSalePriceInput(formatThousandsInput(e.target.value))}
                      />
                      <select
                        className="w-20 bg-slate-900 text-white border-2 border-slate-900 px-1.5 py-1.5 rounded-lg text-xs font-black shrink-0"
                        value={saleCurrency}
                        onChange={(e) => setSaleCurrency(e.target.value)}
                      >
                        <option value="GBP">GBP</option>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                        <option value="TRY">TRY</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Ödenen Kapora Tutarı *</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="flex-1 min-w-0 bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                        placeholder="35.000"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(formatThousandsInput(e.target.value))}
                      />
                      <span className="px-2 py-1.5 bg-slate-200 text-slate-900 rounded-lg text-xs font-black shrink-0">
                        {saleCurrency}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Otomatik Hesaplanan Kalan Bakiye Özeti */}
                <div className="p-2 bg-white border border-amber-300 rounded-lg flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="font-black text-slate-700">Geriye Kalan Tutar (Otomatik):</span>
                  <span className="font-black text-indigo-950">
                    {formatSaleContractAmount(computedRemainingSaleRaw || "0", saleCurrency, false)}
                  </span>
                </div>

                {/* Kapora Tarihi ve En Geç Tapu Devir Tarihi */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Kapora Ödeme Tarihi</label>
                    <input
                      type="date"
                      className="w-full bg-white border-2 border-slate-300 px-2 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                      value={depositDate}
                      onChange={(e) => setDepositDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">En Geç Tapu Devir Tarihi</label>
                    <input
                      type="date"
                      className="w-full bg-white border-2 border-slate-300 px-2 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                      value={deedTransferDate}
                      onChange={(e) => setDeedTransferDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Madde 4 & 5: Süre, Lütuf Süresi, Aracı Emlakçı */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Devir Süresi (Madde 4)</label>
                    <input
                      type="text"
                      className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                      placeholder="4 (dört) ay"
                      value={paymentDeadlineMonths}
                      onChange={(e) => setPaymentDeadlineMonths(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Lütuf Süresi (Gün)</label>
                    <input
                      type="text"
                      className="w-20 bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                      placeholder="14"
                      value={gracePeriodDays}
                      onChange={(e) => setGracePeriodDays(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Aracı Emlakçı (Madde 5)</label>
                    <input
                      type="text"
                      className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                      placeholder="RODEL INVESTMENT EMRAH CEYHAN"
                      value={agentAndCompany}
                      onChange={(e) => setAgentAndCompany(e.target.value)}
                    />
                  </div>
                </div>

                {/* Madde 5: Vergi Yükümlülüğü */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-900">Madde 5 - Tapu Harç & Vergi Dağılımı</label>
                  <input
                    type="text"
                    className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                    value={taxClauseText}
                    onChange={(e) => setTaxClauseText(e.target.value)}
                  />
                </div>

                {/* Şahitler */}
                <div className="pt-1.5 border-t border-amber-300 space-y-1.5">
                  <span className="text-[10px] font-black text-slate-900 uppercase">Şahitler (İmza Altı)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="bg-white border border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                      placeholder="1. Şahit Ad Soyad (Örn: Emrah CEYHAN)"
                      value={witness1Name}
                      onChange={(e) => setWitness1Name(e.target.value)}
                    />
                    <input
                      type="text"
                      className="bg-white border border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                      placeholder="1. Şahit Kimlik No"
                      value={witness1Identity}
                      onChange={(e) => setWitness1Identity(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="bg-white border border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                      placeholder="2. Şahit Ad Soyad (Opsiyonel)"
                      value={witness2Name}
                      onChange={(e) => setWitness2Name(e.target.value)}
                    />
                    <input
                      type="text"
                      className="bg-white border border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                      placeholder="2. Şahit Kimlik No"
                      value={witness2Identity}
                      onChange={(e) => setWitness2Identity(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedTemplateId === "inter_branch_split" && (
              <div className="space-y-1 mt-1">
                <label className="text-[10px] font-black text-slate-900 ml-0.5">Paylaşım Oranı</label>
                <div className="relative">
                  <Percent className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input 
                    type="text"
                    className="w-full bg-white border-2 border-slate-300 pl-9 pr-3 py-2 rounded-xl text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                    placeholder="Örn: 50 / 50"
                    value={splitRatio}
                    onChange={(e) => setSplitRatio(e.target.value)}
                  />
                </div>
              </div>
            )}

            {selectedTemplateId === "rental_authorization" && (
              <div className="space-y-1 mt-1">
                <label className="text-[10px] font-black text-slate-900 ml-0.5">Yetki Süresi</label>
                <div className="relative">
                  <Bookmark className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input 
                    type="text"
                    className="w-full bg-white border-2 border-slate-300 pl-9 pr-3 py-2 rounded-xl text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                    placeholder="Örn: 12 Ay"
                    value={contractDuration}
                    onChange={(e) => setContractDuration(e.target.value)}
                  />
                </div>
              </div>
            )}

            {selectedTemplateId === "eviction_undertaking" && (
              <div className="space-y-1 mt-1">
                <label className="text-[10px] font-black text-slate-900 ml-0.5">Tahliye Tarihi</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input 
                    type="date"
                    className="w-full bg-white border-2 border-slate-300 pl-9 pr-3 py-2 rounded-xl text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                    value={evictionDate}
                    onChange={(e) => setEvictionDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            {selectedTemplateId === "offer_letter" && (
              <div className="space-y-2.5 mt-1 p-3 bg-amber-50/70 border-2 border-amber-300 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-950">
                    Teklif Bilgileri
                  </span>
                  <span className="text-[9px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded uppercase">
                    Teklif
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900 ml-0.5">Mülk Niteliği</label>
                    <select
                      className="w-full bg-white border-2 border-slate-300 px-2.5 py-2 rounded-xl text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                      value={offerPropertyNature}
                      onChange={(e) => setOfferPropertyNature(e.target.value)}
                    >
                      <option value="Arsa">Arsa</option>
                      <option value="Daire">Daire</option>
                      <option value="Villa">Villa</option>
                      <option value="Müstakil Ev">Müstakil Ev</option>
                      <option value="Ticari Gayrimenkul">Ticari Mülk</option>
                      <option value="Gayrimenkul">Gayrimenkul</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900 ml-0.5">Gezi Tarihi</label>
                    <input
                      type="date"
                      className="w-full bg-white border-2 border-slate-300 px-2.5 py-2 rounded-xl text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                      value={viewingDate}
                      onChange={(e) => setViewingDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-900 ml-0.5">
                    Teklif Fiyatı *
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      className="flex-1 bg-white border-2 border-indigo-400 px-3 py-2 rounded-xl text-sm font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                      placeholder="Örn: 98.000"
                      value={offerPriceInput}
                      onChange={(e) => setOfferPriceInput(formatThousandsInput(e.target.value))}
                    />
                    <select
                      className="w-20 bg-slate-900 text-white border-2 border-slate-900 px-2 py-2 rounded-xl text-xs font-black focus:outline-none shrink-0"
                      value={offerCurrency}
                      onChange={(e) => setOfferCurrency(e.target.value)}
                    >
                      <option value="GBP">GBP</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="TRY">TRY</option>
                    </select>
                  </div>
                  <p className="text-[10px] font-bold text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 truncate">
                    {placeholderValues.offerPrice}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900 ml-0.5">Geçerlilik Süresi</label>
                    <input
                      type="text"
                      className="w-full bg-white border-2 border-slate-300 px-3 py-2 rounded-xl text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                      placeholder="Örn: 7 (yedi) gün"
                      value={offerValidityPeriod}
                      onChange={(e) => setOfferValidityPeriod(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900 ml-0.5">Aracı Emlakçı / Şirket</label>
                    <input
                      type="text"
                      className="w-full bg-white border-2 border-slate-300 px-3 py-2 rounded-xl text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                      placeholder="Örn: Emrah CEYHAN"
                      value={agentAndCompany}
                      onChange={(e) => setAgentAndCompany(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-900 ml-0.5">
                    Adres & Parsel Bilgileri
                  </label>
                  <textarea
                    rows={2}
                    className="w-full bg-white border-2 border-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-600"
                    placeholder="Bölge, koçan, pafta, parsel bilgileri..."
                    value={offerPropertyDetails}
                    onChange={(e) => setOfferPropertyDetails(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-900 ml-0.5">
                    Ek Koşul / Not
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border-2 border-slate-300 px-3 py-2 rounded-xl text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-600"
                    placeholder="Opsiyonel ek şart..."
                    value={offerFreeNotes}
                    onChange={(e) => setOfferFreeNotes(e.target.value)}
                  />
                </div>
              </div>
            )}

            {selectedTemplateId === "rental_agreement" && (
              <div className="space-y-2.5 mt-1 p-3 bg-amber-50/80 border-2 border-amber-300 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-950">
                    3. Taşınmazın Bilgileri & Kira Şartları
                  </span>
                  <span className="text-[9px] font-black bg-slate-900 text-amber-400 px-2 py-0.5 rounded uppercase">
                    9 + 9 Madde • KKTC
                  </span>
                </div>

                {/* Taşınmazın Tanımı & Kullanım Amacı */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Taşınmazın Tanımı</label>
                    <input
                      type="text"
                      className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                      placeholder="Örn: 3+1 Daire"
                      value={rentalPropertyDef}
                      onChange={(e) => setRentalPropertyDef(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Kullanım Amacı</label>
                    <input
                      type="text"
                      className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                      placeholder="Örn: Aile Yaşam Alanı"
                      value={rentalUsagePurpose}
                      onChange={(e) => setRentalUsagePurpose(e.target.value)}
                    />
                  </div>
                </div>

                {/* Adresi */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-900">Taşınmazın Açık Adresi</label>
                  <input
                    type="text"
                    className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                    placeholder="Örn: Lavinium Sitesi A 19 (C2) Blok Daire No: 6 Aşağı Dikmen / Girne"
                    value={rentalAddress}
                    onChange={(e) => setRentalAddress(e.target.value)}
                  />
                </div>

                {/* Kaza, Kasaba/Köy, Koçan No, Pafta/Harita, Ada/Blok, Parsel */}
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-black text-slate-900">Kaza</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-300 px-2 py-1 rounded-lg text-xs font-bold text-slate-950"
                      placeholder="Girne"
                      value={rentalDistrict}
                      onChange={(e) => setRentalDistrict(e.target.value)}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-black text-slate-900">Kasaba / Köy</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-300 px-2 py-1 rounded-lg text-xs font-bold text-slate-950"
                      placeholder="Aşağı Dikmen"
                      value={rentalTownVillage}
                      onChange={(e) => setRentalTownVillage(e.target.value)}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-black text-slate-900">Koçan No</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-300 px-2 py-1 rounded-lg text-xs font-bold text-slate-950"
                      placeholder="Koçan No"
                      value={kocanNo}
                      onChange={(e) => setKocanNo(e.target.value)}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-black text-slate-900">Pafta / Harita</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-300 px-2 py-1 rounded-lg text-xs font-bold text-slate-950"
                      placeholder="Pafta/Harita"
                      value={paftaNo}
                      onChange={(e) => setPaftaNo(e.target.value)}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-black text-slate-900">Ada / Blok</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-300 px-2 py-1 rounded-lg text-xs font-bold text-slate-950"
                      placeholder="Ada/Blok"
                      value={adaNo}
                      onChange={(e) => setAdaNo(e.target.value)}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-black text-slate-900">Parsel</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-300 px-2 py-1 rounded-lg text-xs font-bold text-slate-950"
                      placeholder="Parsel"
                      value={parselNo}
                      onChange={(e) => setParselNo(e.target.value)}
                    />
                  </div>
                </div>

                {/* Kira Bedeli & Ödeme Şekli */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-amber-300">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Bir Aylık Kira Bedeli *</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="flex-1 min-w-0 bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                        placeholder="17.000"
                        value={rentPriceInput}
                        onChange={(e) => setRentPriceInput(formatThousandsInput(e.target.value))}
                      />
                      <select
                        className="w-20 bg-slate-900 text-white border-2 border-slate-900 px-1.5 py-1.5 rounded-lg text-xs font-black shrink-0"
                        value={rentCurrency}
                        onChange={(e) => setRentCurrency(e.target.value)}
                      >
                        <option value="TL">TL</option>
                        <option value="GBP">GBP</option>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Ödeme Şekli</label>
                    <input
                      type="text"
                      className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                      placeholder="Örn: Aylık Ödemeli"
                      value={rentPaymentMethod}
                      onChange={(e) => setRentPaymentMethod(e.target.value)}
                    />
                  </div>
                </div>

                {/* Ödeme Şartları & Alınan Depozito Miktarı */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-900">Ödeme Şartları (Ödeme Günü)</label>
                  <input 
                    type="text"
                    className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                    placeholder="Her Ayın En Geç 5 (Beş)’inde Ödenecektir."
                    value={paymentDay}
                    onChange={(e) => setPaymentDay(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-900">Alınan Depozito Miktarı ve Ödeme Planı</label>
                  <input 
                    type="text"
                    className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                    placeholder="Örn: 8.500 TL Ödendi 8.500 TL 01/10/2025 Tarihinde ödenecek ve Toplamda 17.000 TL Olacaktır."
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                </div>

                {/* Başlangıç Tarihi, Bitiş Tarihi, Kira Süresi */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Kira Başlangıç Tarihi</label>
                    <input
                      type="date"
                      className="w-full bg-white border-2 border-slate-300 px-2 py-1.5 rounded-lg text-xs font-black text-slate-950"
                      value={rentStartDate}
                      onChange={(e) => {
                        setRentStartDate(e.target.value);
                        setRentEndDate(getDefaultRentEndIso(e.target.value));
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Kira Bitiş Tarihi</label>
                    <input
                      type="date"
                      className="w-full bg-white border-2 border-slate-300 px-2 py-1.5 rounded-lg text-xs font-black text-slate-950"
                      value={rentEndDate}
                      onChange={(e) => setRentEndDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Kira Sözleşme Süresi</label>
                    <input 
                      type="text"
                      className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                      placeholder="1 (Bir) Yıl"
                      value={rentDuration}
                      onChange={(e) => setRentDuration(e.target.value)}
                    />
                  </div>
                </div>

                {/* Şahitler */}
                <div className="pt-1.5 border-t border-amber-300 space-y-1.5">
                  <span className="text-[10px] font-black text-slate-900 uppercase">Şahitler (İmza Altı)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="bg-white border border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                      placeholder="1. Şahit Ad Soyad (Örn: Emrah CEYHAN)"
                      value={witness1Name}
                      onChange={(e) => setWitness1Name(e.target.value)}
                    />
                    <input
                      type="text"
                      className="bg-white border border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                      placeholder="1. Şahit Kimlik No"
                      value={witness1Identity}
                      onChange={(e) => setWitness1Identity(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="bg-white border border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                      placeholder="2. Şahit Ad Soyad (Örn: Tuncel Tahir SOYCAN)"
                      value={witness2Name}
                      onChange={(e) => setWitness2Name(e.target.value)}
                    />
                    <input
                      type="text"
                      className="bg-white border border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                      placeholder="2. Şahit Kimlik No"
                      value={witness2Identity}
                      onChange={(e) => setWitness2Identity(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedTemplateId === "showing_agreement" && (
              <div className="space-y-2.5 mt-1 p-3 bg-amber-50/80 border-2 border-amber-300 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-950">
                    3. Emlak Komisyoncusu & Gösterilen Gayrimenkuller
                  </span>
                  <span className="text-[9px] font-black bg-slate-900 text-amber-400 px-2 py-0.5 rounded uppercase">
                    A–F Şartlar • KKTC
                  </span>
                </div>

                {/* Emlak Komisyoncusu Bilgileri */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-900">Emlak Komisyoncusu (Ünvan & Ad Soyad)</label>
                    <input
                      type="text"
                      className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                      placeholder="Rodel investment EMRAH CEYHAN"
                      value={agentAndCompany}
                      onChange={(e) => setAgentAndCompany(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Komisyoncu Kimlik No</label>
                    <input
                      type="text"
                      className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                      placeholder="1170237140"
                      value={authorizedPersonIdentity}
                      onChange={(e) => setAuthorizedPersonIdentity(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Komisyoncu Adresi</label>
                    <input
                      type="text"
                      className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                      placeholder="Atatürk Caddesi No: 81/A Küçük Kaymaklı / Lefkoşa"
                      value={brokerAddress}
                      onChange={(e) => setBrokerAddress(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Müşteri Adresi (Opsiyonel)</label>
                    <input
                      type="text"
                      className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                      placeholder="Alıcı / Kiracı adayı adresi..."
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                    />
                  </div>
                </div>

                {/* Gösterilen Gayrimenkuller Tablosu (1- ve 2-) */}
                <div className="pt-1.5 border-t border-amber-300 space-y-2">
                  <span className="text-[10px] font-black text-slate-900 uppercase block">
                    Gösterilen Yerler (Gayrimenkuller) Tablosu
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="space-y-0.5 sm:col-span-2">
                      <label className="text-[10px] font-black text-slate-900">1- Gayrimenkul Adres ve Bilgiler</label>
                      <input
                        type="text"
                        className="w-full bg-white border border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                        placeholder="1. Gösterilen taşınmaz adres ve bilgileri"
                        value={showingItem1Details}
                        onChange={(e) => setShowingItem1Details(e.target.value)}
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[10px] font-black text-slate-900">1- Ortalama Değeri</label>
                      <input
                        type="text"
                        className="w-full bg-white border border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                        placeholder="Örn: 85.000 £"
                        value={showingItem1Price}
                        onChange={(e) => setShowingItem1Price(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="space-y-0.5 sm:col-span-2">
                      <label className="text-[10px] font-black text-slate-900">2- Gayrimenkul Adres ve Bilgiler (Opsiyonel)</label>
                      <input
                        type="text"
                        className="w-full bg-white border border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                        placeholder="Varsa 2. gösterilen taşınmaz adres ve bilgileri"
                        value={showingItem2Details}
                        onChange={(e) => setShowingItem2Details(e.target.value)}
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[10px] font-black text-slate-900">2- Ortalama Değeri</label>
                      <input
                        type="text"
                        className="w-full bg-white border border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                        placeholder="Örn: 92.000 £"
                        value={showingItem2Price}
                        onChange={(e) => setShowingItem2Price(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isFurnishedRental && (
              <div className="p-2.5 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-slate-950 text-xs font-black">
                  <span>EK-1 Eşya Listesi</span>
                  <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-black">
                    {fixturePhotosCount} Fotoğraf
                  </span>
                </div>
              </div>
            )}

            {/* Özel Şartlar / Serbest Madde */}
            <div className="p-3 bg-white border-2 border-slate-300 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-900">Özel Şartlar / Serbest Madde (Bu Sözleşmeye Özel)</label>
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
                className="w-full bg-slate-50 border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-600 resize-y"
                placeholder="Sadece bu sözleşmeye eklenecek özel maddeleri her satıra bir madde gelecek şekilde yazabilirsiniz..."
                value={customClauses}
                onChange={(e) => setCustomClauses(e.target.value)}
              />
            </div>

            {/* SEQUENTIAL DUAL DIGITAL SIGNATURE CENTER */}
            <div className="p-3.5 bg-white border-2 border-slate-900 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-indigo-600" />
                  <span className="text-[11px] font-black uppercase text-slate-950 tracking-wider">
                    {isBilateralContract ? "Sıralı Çift Dijital İmza (1. Alıcı ➔ 2. Satıcı)" : "Dijital İmza"}
                  </span>
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                  signed && (!isBilateralContract || sellerSigned)
                    ? "bg-emerald-600 text-white"
                    : signed
                    ? "bg-amber-400 text-slate-950"
                    : "bg-slate-200 text-slate-800"
                }`}>
                  {signed && (!isBilateralContract || sellerSigned)
                    ? "FİNAL İMZALI"
                    : signed
                    ? "1/2 ALICI İMZALADI"
                    : "İMZA BEKLİYOR"}
                </span>
              </div>

              {/* STEP 1: BUYER / CLIENT SIGNATURE (1ST PRIORITY) */}
              <div className="p-2.5 bg-slate-50 border-2 border-indigo-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-indigo-950">
                    1. Adım (İmza Önceliği): {selectedTemplateId === "rental_agreement" ? "Kiracı İmzası" : "Alıcı İmzası"}
                  </span>
                  {signed && (
                    <button
                      type="button"
                      onClick={() => {
                        setSigned(false);
                        setSignatureImage("");
                        setIsSigningActive(false);
                        setSellerSigned(false);
                        setSellerSignatureImage("");
                      }}
                      className="text-[10px] text-rose-600 hover:text-rose-700 font-black uppercase cursor-pointer"
                    >
                      Sıfırla
                    </button>
                  )}
                </div>

                {signed ? (
                  <div className="bg-emerald-50 border border-emerald-400 p-2 rounded-lg flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>1. İmza Tamam ({signingName || clientName})</span>
                    </div>
                    {signatureImage && (
                      <img src={signatureImage} alt="Alıcı İmzası" className="h-8 bg-white px-1.5 py-0.5 rounded border border-emerald-300" />
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-700">İmzalayan: {clientName || "Alıcı"}</span>
                      <button
                        onClick={clearCanvas}
                        type="button"
                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 uppercase cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" /> Temizle
                      </button>
                    </div>
                    <div className="border-2 border-slate-300 rounded-xl overflow-hidden bg-white relative">
                      <canvas
                        ref={canvasRef}
                        width={300}
                        height={100}
                        className="w-full h-[95px] cursor-crosshair block touch-none"
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
                            1. ÖNCELİK: ALICI BURAYA İMZALAR
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!clientName.trim()) {
                            return alert("Lütfen önce Alıcı Adı Soyadı bilgisini giriniz!");
                          }
                          const canvas = canvasRef.current;
                          if (!canvas || !isSigningActive) {
                            return alert("Lütfen Alıcı imza kutusuna imza çiziniz!");
                          }
                          const dataUrl = canvas.toDataURL("image/png");
                          setSigningName(clientName.trim());
                          setSignatureImage(dataUrl);
                          setSigned(true);
                          try {
                            await persistContractRecord({
                              buyerSigned: true,
                              buyerSigImg: dataUrl,
                              silent: true
                            });
                          } catch {
                            // ignore
                          }
                        }}
                        className="py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black uppercase rounded-lg transition-all cursor-pointer"
                      >
                        1. Alıcı İmzasını Onayla
                      </button>
                      <button
                        type="button"
                        onClick={handleShareBuyerWhatsApp}
                        className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" /> Alıcıya Gönder (WA)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 2: SELLER / OWNER SIGNATURE (UNLOCKED ONLY AFTER BUYER SIGNS) */}
              {isBilateralContract && (
                <div className={`p-2.5 rounded-xl border-2 space-y-2 transition-all ${
                  signed ? "bg-amber-50/70 border-amber-400" : "bg-slate-100 border-slate-300 opacity-75"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-900">
                      2. Adım (Final Onay): Satıcı / Mülk Sahibi İmzası
                    </span>
                    {sellerSigned && (
                      <button
                        type="button"
                        onClick={() => {
                          setSellerSigned(false);
                          setSellerSignatureImage("");
                          setIsSellerSigningActive(false);
                        }}
                        className="text-[10px] text-rose-600 hover:text-rose-700 font-black uppercase cursor-pointer"
                      >
                        Düzenle
                      </button>
                    )}
                  </div>

                  {!signed ? (
                    <div className="p-2 bg-white border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 text-center">
                      İmza önceliği <strong>Alıcı</strong>'dadır. Alıcı imzaladıktan sonra Satıcı imzası aktifleşir.
                    </div>
                  ) : sellerSigned ? (
                    <div className="bg-emerald-100 border border-emerald-500 p-2 rounded-lg flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950">
                        <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>2. Satıcı İmzası Tamam ({sellerSigningName || placeholderValues.ownerName})</span>
                      </div>
                      {sellerSignatureImage && (
                        <img src={sellerSignatureImage} alt="Satıcı İmzası" className="h-8 bg-white px-1.5 py-0.5 rounded border border-emerald-400" />
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-800">
                          Satıcı: {placeholderValues.ownerName}
                        </span>
                        <button
                          onClick={clearSellerCanvas}
                          type="button"
                          className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 uppercase cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" /> Temizle
                        </button>
                      </div>
                      <div className="border-2 border-amber-400 rounded-xl overflow-hidden bg-white relative">
                        <canvas
                          ref={sellerCanvasRef}
                          width={300}
                          height={100}
                          className="w-full h-[95px] cursor-crosshair block touch-none"
                          onMouseDown={startSellerDrawing}
                          onMouseMove={drawSeller}
                          onMouseUp={stopSellerDrawing}
                          onMouseLeave={stopSellerDrawing}
                          onTouchStart={startSellerDrawing}
                          onTouchMove={drawSeller}
                          onTouchEnd={stopSellerDrawing}
                        />
                        {!isSellerSigningActive && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                            <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                              2. FİNAL ONAY: SATICI BURAYA İMZALAR
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={async () => {
                            const sCanvas = sellerCanvasRef.current;
                            if (!sCanvas || !isSellerSigningActive) {
                              return alert("Lütfen Satıcı imza kutusuna imza çiziniz!");
                            }
                            const sDataUrl = sCanvas.toDataURL("image/png");
                            const resolvedSName = (ownerName || placeholderValues.ownerName || "Satıcı").trim();
                            setSellerSigningName(resolvedSName);
                            setSellerSignatureImage(sDataUrl);
                            setSellerSigned(true);
                            try {
                              await persistContractRecord({
                                buyerSigned: true,
                                buyerSigImg: signatureImage,
                                sellerSigned: true,
                                sellerSigImg: sDataUrl,
                                silent: true
                              });
                            } catch {
                              // ignore
                            }
                          }}
                          className="py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 text-[11px] font-black uppercase rounded-lg transition-all cursor-pointer"
                        >
                          2. Satıcı İmzasını Onayla (Finalle)
                        </button>
                        <button
                          type="button"
                          onClick={handleShareSellerWhatsApp}
                          className="py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 text-[11px] font-black uppercase rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" /> Satıcıya Gönder (WA)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* FINALIZED CONTRACT DELIVERY TO BOTH BUYER AND SELLER */}
              {signed && (!isBilateralContract || sellerSigned) && (
                <div className="p-2.5 bg-emerald-950 text-white rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                      ✔ Sözleşme Finallendi • Taraflara Son Halini İlet
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSendFinalizedWhatsApp("buyer")}
                      className="py-2 px-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Son Halini Alıcıya İlet
                    </button>
                    {isBilateralContract && (
                      <button
                        type="button"
                        onClick={() => handleSendFinalizedWhatsApp("seller")}
                        className="py-2 px-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Send className="w-3.5 h-3.5" /> Son Halini Satıcıya İlet
                      </button>
                    )}
                  </div>
                </div>
              )}

              {onSaveContract && (
                <button
                  type="button"
                  onClick={handleSaveContract}
                  disabled={saving}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {saving
                    ? "Kaydediliyor..."
                    : signed && sellerSigned
                    ? "Final İmzalı Sözleşmeyi Arşive Kaydet"
                    : "Sözleşmeyi Kaydet"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Contract Live Rendering */}
        <div className={`flex-1 bg-white flex-col justify-between overflow-hidden ${
          activeMobileTab === 'preview' ? 'flex' : 'hidden md:flex'
        }`}>
          
          {/* Top action bar */}
          <div className="p-2.5 sm:p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2.5 py-1.5 rounded-xl border border-indigo-200 text-xs font-black shrink-0">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline text-[11px] uppercase tracking-tight">Canlı Sözleşme</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {onSaveContract && (
                <button 
                  onClick={handleSaveContract}
                  disabled={saving}
                  className="p-2 sm:px-3 sm:py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer shadow-xs active:scale-95"
                  title="Sisteme Kaydet"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline text-[11px] font-black">{saving ? "..." : "Kaydet"}</span>
                </button>
              )}
              <button 
                onClick={handlePrint}
                className="p-2 sm:px-3 sm:py-1.5 bg-white text-slate-900 border-2 border-slate-300 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1.5 text-xs font-black shrink-0 cursor-pointer active:scale-95"
                title="Yazdır / PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[11px]">Yazdır / PDF</span>
              </button>
              <button 
                onClick={handleShareBuyerWhatsApp}
                className="p-2 sm:px-3 sm:py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-all flex items-center gap-1.5 text-xs font-black shrink-0 cursor-pointer active:scale-95"
                title="1. Öncelik: Alıcıya İmza İçin Gönder"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="text-[11px]">1. Alıcıya İmza</span>
              </button>
              {isBilateralContract && (
                <button 
                  onClick={handleShareSellerWhatsApp}
                  className={`p-2 sm:px-3 sm:py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-black shrink-0 cursor-pointer active:scale-95 ${
                    signed
                      ? "bg-amber-400 text-slate-950 hover:bg-amber-500"
                      : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                  }`}
                  title="2. Adım: Satıcıya Final İmza İçin Gönder"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="text-[11px]">2. Satıcıya İmza</span>
                </button>
              )}
              {signed && (!isBilateralContract || sellerSigned) && (
                <>
                  <button
                    onClick={() => handleSendFinalizedWhatsApp("buyer")}
                    className="p-2 sm:px-2.5 sm:py-1.5 bg-slate-900 text-emerald-400 hover:bg-slate-800 rounded-xl transition-all flex items-center gap-1 text-[11px] font-black shrink-0 cursor-pointer"
                    title="Son Halini Alıcıya İlet"
                  >
                    <span>Final ➔ Alıcı</span>
                  </button>
                  {isBilateralContract && (
                    <button
                      onClick={() => handleSendFinalizedWhatsApp("seller")}
                      className="p-2 sm:px-2.5 sm:py-1.5 bg-slate-900 text-amber-400 hover:bg-slate-800 rounded-xl transition-all flex items-center gap-1 text-[11px] font-black shrink-0 cursor-pointer"
                      title="Son Halini Satıcıya İlet"
                    >
                      <span>Final ➔ Satıcı</span>
                    </button>
                  )}
                </>
              )}

              <button 
                onClick={onClose}
                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl transition-all shrink-0 cursor-pointer active:scale-95 ml-0.5"
                title="Kapat"
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
