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
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Check,
  Receipt,
  Banknote
} from "lucide-react";
import { api } from "../services/api";
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
  buildDefaultShowingPropertyDetails,
  detectDefaultAuthPropertyCategory,
  resolvePropertyFeatureHighlight,
  resolveOfficialPropertyTitle,
  parseNumericAmount
} from "../utils/contractTemplates";
import { RealEstateProperty } from "../types";
import { formatPhoneForWhatsApp, formatDateTR } from "../utils/formatUtils";


interface LegalContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: RealEstateProperty;
  branding?: any;
  onSaveContract?: (contractDoc: any, prePortfolioMeta?: any) => Promise<any>;
  initialTemplateId?: string;
  initialOfferPrice?: string;
  initialClientName?: string;
  initialClientPhone?: string;
  initialClientIdentity?: string;
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
  initialClientIdentity,
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

  const getDefaultKaporaDueIso = (baseDateIso?: string) => {
    const d = baseDateIso ? new Date(baseDateIso) : new Date();
    if (isNaN(d.getTime())) {
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 10);
      return fallback.toISOString().split("T")[0];
    }
    d.setDate(d.getDate() + 10);
    return d.toISOString().split("T")[0];
  };

  const defaultRentalMeta = buildDefaultRentalPropertyMeta(property);
  const isRentalPortfolioProperty = (prop: any): boolean => {
    if (!prop) return false;
    const lType = String(prop.listing_type || "").trim();
    const titleStr = String(prop.title || "").trim();
    if (/\b(kiralık|kiralik|kira|for rent)\b/i.test(lType)) return true;
    if (/\b(satılık|satilik|satış|satis|for sale)\b/i.test(lType)) return false;
    if (prop.listing_intent === "rent" || prop.intent === "kiralik" || prop.sector_data?.listing_intent === "rent") {
      return true;
    }
    if (
      /\b(kiralık|kiralik|kira|for rent)\b/i.test(titleStr) &&
      !/\b(satılık|satilik|for sale)\b/i.test(titleStr)
    ) {
      return true;
    }
    return false;
  };

  const isRentProperty = isRentalPortfolioProperty(property);
  const isPrePortfolioProperty =
    !property?.id ||
    String(property.id).startsWith("pre_portfolio_") ||
    String(property.id).startsWith("temp_");

  const getInitialExclusivityIntent = (prop: RealEstateProperty): "rent" | "sale" => {
    return isRentalPortfolioProperty(prop) ? "rent" : "sale";
  };

  const [activeMobileTab, setActiveMobileTab] = useState<'params' | 'preview'>('params');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    if ((initialTemplateId === "rental_authorization" || initialTemplateId === "exclusivity_agreement") && !isRentProperty && !isPrePortfolioProperty) {
      return "sales_authorization";
    }
    return initialTemplateId || (isRentProperty ? "rental_agreement" : "sales_brokerage");
  });
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState<boolean>(false);
  const [activeDocId, setActiveDocId] = useState<string>(() => initialContractDoc?.id || `virtual-contract-${Date.now()}`);
  const [resolvedPropertyId, setResolvedPropertyId] = useState<string | number>(() => property?.id || `pre_portfolio_${Date.now()}`);

  const getTemplateBadge = (templateId: string) => {
    if (templateId === "rental_commission_receipt") {
      return { label: "Kiracı ➔ Aracı (Makbuz)", bg: "bg-emerald-400 text-slate-950" };
    }
    if (templateId === "sales_commission_receipt") {
      return { label: "Mal Sahibi ➔ Aracı (Makbuz)", bg: "bg-emerald-400 text-slate-950" };
    }
    if (["sales_brokerage", "property_reservation_deposit", "offer_letter"].includes(templateId)) {
      return { label: "Alıcı ➔ Satıcı İmzalı", bg: "bg-amber-400 text-slate-950" };
    }
    if (templateId === "rental_agreement") {
      return { label: "Kiracı ➔ Mülk Sahibi", bg: "bg-amber-400 text-slate-950" };
    }
    if (templateId === "rental_deposit_agreement") {
      return { label: "Kiracı ➔ Emlakçı İmzalı", bg: "bg-amber-400 text-slate-950" };
    }
    if (templateId === "sales_deposit_agreement") {
      return { label: "Alıcı ➔ Komisyoncu", bg: "bg-amber-400 text-slate-950" };
    }
    if (templateId === "escrow_deposit_agreement") {
      return { label: "Alıcı ➔ Emanetçi", bg: "bg-indigo-300 text-slate-950" };
    }
    if (["exclusivity_agreement", "rental_authorization", "sales_authorization"].includes(templateId)) {
      return { label: "Mülk Sahibi ➔ Yetkili İmzalı", bg: "bg-emerald-400 text-slate-950" };
    }
    if (templateId === "eviction_undertaking") {
      return { label: "Kiracı İmzalı", bg: "bg-slate-300 text-slate-900" };
    }
    return null;
  };

  // Buyer / Tenant states
  const [clientName, setClientName] = useState<string>(initialClientName || "");
  const [clientIdentity, setClientIdentity] = useState<string>("");
  const [buyerIdType, setBuyerIdType] = useState<string>(
    isRentProperty ? "TC kimlik" : "KKTC KİMLİK"
  );
  const [clientPhone, setClientPhone] = useState<string>(initialClientPhone || "");

  // Seller / Property Owner states
  const [ownerName, setOwnerName] = useState<string>(() => resolveOwnerName(property));
  const [ownerPhone, setOwnerPhone] = useState<string>(() => resolveOwnerPhone(property));
  const [sellerIdentity, setSellerIdentity] = useState<string>(() => resolveOwnerIdentity(property));
  const [sellerIdType, setSellerIdType] = useState<string>(
    isRentProperty ? "KKTC kimlik" : "KKTC Kimlik Kartı"
  );

  const [commissionRate, setCommissionRate] = useState<string>(
    isRentProperty ? "1 Aylık Kira Bedeli" : "5"
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

  // Authorization Contracts (KİRALIKLARDA YETKİ BELGESİ & TEK YETKİ SÖZLEŞMESİ) specific states
  const [exclusivityIntent, setExclusivityIntent] = useState<"rent" | "sale">(() => getInitialExclusivityIntent(property));
  const [authPropertyCategory, setAuthPropertyCategory] = useState<string>(() => detectDefaultAuthPropertyCategory(property));
  const [authPropertyCategoryOther, setAuthPropertyCategoryOther] = useState<string>("");
  const [authServiceFeePayer, setAuthServiceFeePayer] = useState<string>(() => resolveOwnerName(property) || "");
  const [authServiceFeeReceiver, setAuthServiceFeeReceiver] = useState<string>(() => getDisplayStoreNameInit());
  const [authShowingDayType, setAuthShowingDayType] = useState<string>("TÜMÜ");
  const [authShowingHours, setAuthShowingHours] = useState<string>("09:00 - 18:00");
  const [authDurationDays, setAuthDurationDays] = useState<string>("90 (Doksan)");
  const [authPropertyTypeFeatures, setAuthPropertyTypeFeatures] = useState<string>(
    () => defaultRentalMeta.rentalPropertyDef || "3+1 Daire"
  );
  const [authAdvancePayment, setAuthAdvancePayment] = useState<string>("1 Aylık Kira Bedeli");
  const [authAnnualIncreaseRate, setAuthAnnualIncreaseRate] = useState<string>("%10");
  const [authTenantCriteria, setAuthTenantCriteria] = useState<string>(
    "Düzenli gelir sahibi, kurumsal çalışan veya aile"
  );
  const [authCopiesCount, setAuthCopiesCount] = useState<string>("2 (İki)");

  // Rental Deposit / Kapora Agreement (KAPORA SÖZLEŞMESİ) specific states
  const [kaporaTenant2Info, setKaporaTenant2Info] = useState<string>("");
  const [kaporaTenant3Info, setKaporaTenant3Info] = useState<string>("");
  const [kaporaTotalRentAmount, setKaporaTotalRentAmount] = useState<string>("");
  const [kaporaDuesAmount, setKaporaDuesAmount] = useState<string>("Aylık 300 TL");
  const [kaporaCommissionAmount, setKaporaCommissionAmount] = useState<string>("1 Kira Bedeli");
  const [kaporaPaidAmount, setKaporaPaidAmount] = useState<string>(() => formatThousandsInput(property?.price));
  const [kaporaRemainingBalance, setKaporaRemainingBalance] = useState<string>("");
  const [kaporaBalanceDueDate, setKaporaBalanceDueDate] = useState<string>(() => getDefaultKaporaDueIso());

  // Sales Deposit / Kapora & Escrow Agreements specific states
  const [salesPaymentTerms, setSalesPaymentTerms] = useState<string>("Tapu devrinde hepsi ödenecektir.");
  const [reservationDays, setReservationDays] = useState<string>("15 (on beş)");
  const [escrowDeadlineDays, setEscrowDeadlineDays] = useState<string>("15");

  // Commission Receipts (KİRALIK & SATILIK KOMİSYON ALIM BELGESİ) states
  const [commissionReceiptAmount, setCommissionReceiptAmount] = useState<string>(() => {
    const rawPrice = property?.price;
    const num = typeof rawPrice === "number" ? rawPrice : parseFloat(String(rawPrice || "").replace(/[^\d.]/g, ""));
    if (isNaN(num) || num <= 0) return "";
    if (isRentProperty) {
      return formatThousandsInput(num);
    } else {
      const commVal = Math.round((num * 5) / 100);
      return formatThousandsInput(commVal);
    }
  });
  const [commissionReceiptCurrency, setCommissionReceiptCurrency] = useState<string>(() => (property?.currency || "GBP").toUpperCase());
  const [commissionReceiptPaymentMethod, setCommissionReceiptPaymentMethod] = useState<string>("Banka Havalesi / EFT");
  const [commissionReceiptPayerName, setCommissionReceiptPayerName] = useState<string>(() => isRentProperty ? (initialClientName || "") : (resolveOwnerName(property) || ""));
  const [commissionReceiptPayerIdentity, setCommissionReceiptPayerIdentity] = useState<string>(() => isRentProperty ? "" : (resolveOwnerIdentity(property) || ""));
  const [commissionReceiptPayerPhone, setCommissionReceiptPayerPhone] = useState<string>(() => isRentProperty ? (initialClientPhone || "") : (resolveOwnerPhone(property) || ""));
  const [commissionReceiptPayerRole, setCommissionReceiptPayerRole] = useState<string>(() => isRentProperty ? "KİRACI" : "MAL SAHİBİ");
  const [commissionReceiptNo, setCommissionReceiptNo] = useState<string>(() => {
    const prefix = isRentProperty ? "MAK-KIR" : "MAK-SAT";
    const refPart = property?.reference_no ? property.reference_no.replace(/[^\w-]/g, "") : `LP-${property?.id || "001"}`;
    return `${prefix}-${refPart}`;
  });
  const [recordToCashRegister, setRecordToCashRegister] = useState<boolean>(true);

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
        const rawShowing1 = det.showingItem1Details || "";
        const cleanShowing1 = (rawShowing1 && property?.title && rawShowing1.includes(property.title))
          ? rawShowing1.replace(property.title, resolvePropertyFeatureHighlight(property)).replace(/\s+-\s+-\s+/g, " - ").trim()
          : (rawShowing1 || buildDefaultShowingPropertyDetails(property));
        setShowingItem1Details(cleanShowing1);
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
        setExclusivityIntent(
          det.exclusivityIntent === "rent" || det.exclusivityIntent === "sale"
            ? det.exclusivityIntent
            : getInitialExclusivityIntent(property)
        );
        setAuthPropertyCategory(det.authPropertyCategory || detectDefaultAuthPropertyCategory(property));
        setAuthPropertyCategoryOther(det.authPropertyCategoryOther || "");
        setAuthServiceFeePayer(det.authServiceFeePayer || det.clientName || resolveOwnerName(property) || "");
        setAuthServiceFeeReceiver(det.authServiceFeeReceiver || det.ownerName || getDisplayStoreNameInit());
        setAuthShowingDayType(det.authShowingDayType || "TÜMÜ");
        setAuthShowingHours(det.authShowingHours || "09:00 - 18:00");
        setAuthDurationDays(det.authDurationDays || "90 (Doksan)");
        setAuthPropertyTypeFeatures(det.authPropertyTypeFeatures || det.rentalPropertyDef || rMeta.rentalPropertyDef || "3+1 Daire");
        setAuthAdvancePayment(det.authAdvancePayment || "1 Aylık Kira Bedeli");
        setAuthAnnualIncreaseRate(det.authAnnualIncreaseRate || "%10");
        setAuthTenantCriteria(det.authTenantCriteria || "Düzenli gelir sahibi, kurumsal çalışan veya aile");
        setAuthCopiesCount(det.authCopiesCount || "2 (İki)");
        setKaporaTenant2Info(det.kaporaTenant2Info || "");
        setKaporaTenant3Info(det.kaporaTenant3Info || "");
        setKaporaTotalRentAmount(det.kaporaTotalRentAmount || "");
        setKaporaDuesAmount(det.kaporaDuesAmount || "Aylık 300 TL");
        setKaporaCommissionAmount(det.kaporaCommissionAmount || "1 Kira Bedeli");
        setKaporaPaidAmount(formatThousandsInput(det.kaporaPaidAmount || property?.price));
        setKaporaRemainingBalance(formatThousandsInput(det.kaporaRemainingBalance || ""));
        if (det.kaporaBalanceDueDate) setKaporaBalanceDueDate(det.kaporaBalanceDueDate);
        if (det.salesPaymentTerms) setSalesPaymentTerms(det.salesPaymentTerms);
        if (det.reservationDays) setReservationDays(det.reservationDays);
        if (det.escrowDeadlineDays) setEscrowDeadlineDays(det.escrowDeadlineDays);
        setCustomClauses(det.customClauses || "");
        setSigned(Boolean(det.signed));
        setSigningName(det.signingName || det.clientName || "");
        setSignatureImage(det.signatureImage || "");
        setSellerSigned(Boolean(det.sellerSigned));
        setSellerSigningName(det.sellerSigningName || det.ownerName || resolveOwnerName(property));
        setSellerSignatureImage(det.sellerSignatureImage || "");
      } else {
        setActiveDocId(`virtual-contract-${Date.now()}`);
        setResolvedPropertyId(property.id || `pre_portfolio_${Date.now()}`);
        const propIsRent = isRentalPortfolioProperty(property);
        const propIsPre =
          !property?.id ||
          String(property.id).startsWith("pre_portfolio_") ||
          String(property.id).startsWith("temp_");
        const sanitizedInitialTpl =
          initialTemplateId === "rental_authorization" && !propIsRent && !propIsPre
            ? "exclusivity_agreement"
            : initialTemplateId;
        const targetTplId =
          sanitizedInitialTpl || (propIsRent ? "rental_agreement" : "sales_brokerage");
        setSelectedTemplateId(targetTplId);
        const isTargetOwnerAuth = ["exclusivity_agreement", "rental_authorization", "sales_authorization"].includes(targetTplId);
        setDepositAmount(getInitialDeposit(property));
        setRentDuration("1 (Bir) Yıl");
        setContractDuration(
          targetTplId === "exclusivity_agreement" || targetTplId === "sales_authorization"
            ? "90 (Doksan)"
            : targetTplId === "rental_authorization"
            ? "6 (Altı)"
            : "12 Ay / 12 Months"
        );
        setPaymentDay("Her Ayın En Geç 5 (Beş)’inde Ödenecektir.");
        setRentalPropertyDef(rMeta.rentalPropertyDef);
        const resolvedOwner = resolveOwnerName(property);
        const resolvedOwnerTel = resolveOwnerPhone(property);
        const resolvedOwnerId = resolveOwnerIdentity(property);
        const sName = getDisplayStoreNameInit();
        const agent = (property?.responsible_agent || (property as any)?.sector_data?.responsible_agent || branding?.owner_name || "").toString().trim();
        const agencyRepLabel = agent ? `${sName} - ${agent}` : sName;
        const agencyTel = branding?.phone || branding?.whatsapp_number || "";
        const agencyIdNo = branding?.owner_identity || "1170237140";

        setExclusivityIntent(getInitialExclusivityIntent(property));
        setAuthPropertyCategory(detectDefaultAuthPropertyCategory(property));
        setAuthPropertyCategoryOther(rMeta.rentalPropertyDef || "");
        setAuthServiceFeePayer(initialClientName || resolvedOwner || "");
        setAuthServiceFeeReceiver(agencyRepLabel);
        setAuthShowingDayType("TÜMÜ");
        setAuthShowingHours("09:00 - 18:00");
        setAuthDurationDays("90 (Doksan)");
        setAuthPropertyTypeFeatures(rMeta.rentalPropertyDef || "3+1 Daire");
        setAuthAdvancePayment("1 Aylık Kira Bedeli");
        setAuthAnnualIncreaseRate("%10");
        setAuthTenantCriteria("Düzenli gelir sahibi, kurumsal çalışan veya aile");
        setAuthCopiesCount("2 (İki)");
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
        setKaporaTenant2Info("");
        setKaporaTenant3Info("");
        setKaporaTotalRentAmount("");
        setKaporaDuesAmount("Aylık 300 TL");
        setKaporaCommissionAmount("1 Kira Bedeli");
        setKaporaPaidAmount(formatThousandsInput(property?.price));
        setKaporaRemainingBalance("");
        setKaporaBalanceDueDate(getDefaultKaporaDueIso(todayIso));

        if (isTargetOwnerAuth) {
          // For Tek Yetki & Kiralama Yetki: 1st Signer (client*) = Mülk Sahibi, 2nd Signer (owner*/seller*) = İşletme Yetkilisi
          const oName = initialClientName || resolvedOwner;
          setClientName(oName);
          setSigningName(oName);
          setClientPhone(initialClientPhone || resolvedOwnerTel);
          setClientIdentity(initialClientIdentity || resolvedOwnerId);
          setOwnerName(agencyRepLabel);
          setOwnerPhone(agencyTel);
          setSellerIdentity(agencyIdNo);
          setSellerSigningName(agencyRepLabel);
        } else {
          setOwnerName(resolvedOwner);
          setOwnerPhone(resolvedOwnerTel);
          setSellerIdentity(resolvedOwnerId);
          setSellerSigningName(resolvedOwner);
          if (initialClientName) {
            setClientName(initialClientName);
            setSigningName(initialClientName);
          } else {
            setClientName("");
            setSigningName("");
          }
          if (initialClientPhone) {
            setClientPhone(initialClientPhone);
          } else {
            setClientPhone("");
          }
          if (initialClientIdentity) {
            setClientIdentity(initialClientIdentity);
          } else {
            setClientIdentity("");
          }
        }

        setSalePropertyDetails(buildDefaultSalePropertyDetails(property));
        setSalePriceInput(formatThousandsInput(property?.price));
        setSaleCurrency((property?.currency || "GBP").toUpperCase());
        setDepositDate(todayIso);
        setDeedTransferDate(getDefaultDeedTransferIso());
        setOfferPropertyNature(detectDefaultPropertyNature(property));
        setOfferPropertyDetails(buildDefaultOfferPropertyDetails(property));
        setViewingDate(initialViewingDate || todayIso);
        setAgentAndCompany(agent ? `${sName} ${agent}` : sName);
        setAuthorizedPersonIdentity(agencyIdNo);
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
      }
    }
  }, [property, initialTemplateId, initialOfferPrice, initialClientName, initialClientPhone, initialClientIdentity, initialViewingDate, initialContractDoc]);

  const handleSelectTemplate = (nextTemplateId: string) => {
    const wasOwnerAuth = ["exclusivity_agreement", "rental_authorization", "sales_authorization"].includes(selectedTemplateId);
    const willBeOwnerAuth = ["exclusivity_agreement", "rental_authorization", "sales_authorization"].includes(nextTemplateId);
    const isAgencySecondSignerNext = ["rental_deposit_agreement", "sales_deposit_agreement", "escrow_deposit_agreement"].includes(nextTemplateId);
    const wasAgencySecondSigner = ["rental_deposit_agreement", "sales_deposit_agreement", "escrow_deposit_agreement"].includes(selectedTemplateId);
    setSelectedTemplateId(nextTemplateId);
    if (nextTemplateId === "sales_authorization") {
      setExclusivityIntent("sale");
    }

    const resolvedOwner = resolveOwnerName(property);
    const resolvedOwnerTel = resolveOwnerPhone(property);
    const resolvedOwnerId = resolveOwnerIdentity(property);
    const sName = getDisplayStoreNameInit();
    const agent = (property?.responsible_agent || (property as any)?.sector_data?.responsible_agent || branding?.owner_name || "").toString().trim();
    const agencyRepLabel = agent ? `${sName} - ${agent}` : sName;
    const agencyTel = branding?.phone || branding?.whatsapp_number || "";
    const agencyIdNo = branding?.owner_identity || "1170237140";

    if (willBeOwnerAuth && !wasOwnerAuth) {
      const mName = resolvedOwner || initialClientName || "";
      setClientName(mName);
      setSigningName(mName);
      setClientPhone(resolvedOwnerTel || initialClientPhone || "");
      setClientIdentity(resolvedOwnerId || initialClientIdentity || "");
      setOwnerName(agencyRepLabel);
      setOwnerPhone(agencyTel);
      setSellerIdentity(agencyIdNo);
      setSellerSigningName(agencyRepLabel);
      if (!authServiceFeePayer) setAuthServiceFeePayer(mName);
      if (!authServiceFeeReceiver) setAuthServiceFeeReceiver(agencyRepLabel);
      setContractDuration(
        nextTemplateId === "exclusivity_agreement" || nextTemplateId === "sales_authorization"
          ? "90 (Doksan)"
          : nextTemplateId === "rental_authorization"
          ? "6 (Altı)"
          : "12 Ay / 12 Months"
      );
    } else if (isAgencySecondSignerNext) {
      if (wasOwnerAuth) {
        setClientName("");
        setSigningName("");
        setClientPhone("");
        setClientIdentity("");
      }
      setOwnerName(agencyRepLabel);
      setOwnerPhone(agencyTel);
      setSellerIdentity(agencyIdNo);
      setSellerSigningName(agencyRepLabel);
      if (nextTemplateId === "rental_deposit_agreement") {
        if (rentPaymentMethod === "Aylık Ödemeli") {
          setRentPaymentMethod("1 Yıl Peşin Ödemeli");
        }
        if (depositAmount === "1 Aylık Kira Bedeli") {
          setDepositAmount("2 Kira Bedeli");
        }
      }
    } else if (!willBeOwnerAuth && !isAgencySecondSignerNext && (wasOwnerAuth || wasAgencySecondSigner)) {
      setOwnerName(resolvedOwner);
      setOwnerPhone(resolvedOwnerTel);
      setSellerIdentity(resolvedOwnerId);
      setSellerSigningName(resolvedOwner);
      if (wasOwnerAuth) {
        setClientName("");
        setSigningName("");
        setClientPhone("");
        setClientIdentity("");
      }
    } else if (willBeOwnerAuth) {
      setContractDuration(
        nextTemplateId === "exclusivity_agreement" || nextTemplateId === "sales_authorization"
          ? "90 (Doksan)"
          : nextTemplateId === "rental_authorization"
          ? "6 (Altı)"
          : "12 Ay / 12 Months"
      );
    }
  };

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

  const baseOrderedTemplateIds = isRentProperty
    ? [
        "rental_agreement",
        "rental_deposit_agreement",
        "rental_commission_receipt",
        "showing_agreement",
        "rental_authorization",
        "exclusivity_agreement",
        "eviction_undertaking"
      ]
    : [
        "sales_brokerage",
        "sales_deposit_agreement",
        "sales_commission_receipt",
        "escrow_deposit_agreement",
        "property_reservation_deposit",
        "showing_agreement",
        "offer_letter",
        "sales_authorization",
        "inter_branch_split"
      ];

  const orderedTemplateIds =
    baseOrderedTemplateIds.includes(selectedTemplateId) ||
    ((selectedTemplateId === "rental_authorization" || selectedTemplateId === "exclusivity_agreement") && !isRentProperty && !isPrePortfolioProperty)
      ? baseOrderedTemplateIds
      : [selectedTemplateId, ...baseOrderedTemplateIds];

  const filteredTemplates = orderedTemplateIds
    .map((tid) => contractTemplates.find((t) => t.id === tid))
    .filter((t): t is ContractTemplate => Boolean(t));

  const currentTemplate = filteredTemplates.find(t => t.id === selectedTemplateId) || filteredTemplates[0] || contractTemplates[0];
  const isOwnerAuthContract = ["exclusivity_agreement", "rental_authorization", "sales_authorization"].includes(selectedTemplateId);
  const isBilateralContract = [
    "sales_brokerage",
    "sales_deposit_agreement",
    "sales_commission_receipt",
    "escrow_deposit_agreement",
    "property_reservation_deposit",
    "rental_agreement",
    "rental_deposit_agreement",
    "rental_commission_receipt",
    "offer_letter",
    "exclusivity_agreement",
    "rental_authorization",
    "sales_authorization"
  ].includes(selectedTemplateId);

  const firstSignerLabel = isOwnerAuthContract || selectedTemplateId === "sales_commission_receipt"
    ? "Mülk Sahibi"
    : selectedTemplateId === "rental_agreement" || selectedTemplateId === "rental_deposit_agreement" || selectedTemplateId === "rental_commission_receipt" || selectedTemplateId === "eviction_undertaking"
    ? "Kiracı"
    : "Alıcı";
  const secondSignerLabel = isOwnerAuthContract
    ? "İşletme Yetkilisi"
    : selectedTemplateId === "rental_deposit_agreement" || selectedTemplateId === "sales_deposit_agreement" || selectedTemplateId === "rental_commission_receipt" || selectedTemplateId === "sales_commission_receipt"
    ? "Emlak Komisyoncusu"
    : selectedTemplateId === "escrow_deposit_agreement"
    ? "Emanetçi (Komisyoncu)"
    : selectedTemplateId === "rental_agreement"
    ? "Kiraya Veren"
    : "Satıcı";

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

  const rawAuthSalePriceNum = parseInt(String(salePriceInput || "").replace(/[^\d]/g, ""), 10);
  const effectivePropPrice =
    (selectedTemplateId === "sales_authorization" || selectedTemplateId === "exclusivity_agreement") && !isNaN(rawAuthSalePriceNum) && rawAuthSalePriceNum > 0
      ? rawAuthSalePriceNum
      : Number(property.price || 0);
  const effectivePropCurrency =
    (selectedTemplateId === "sales_authorization" || selectedTemplateId === "exclusivity_agreement")
      ? (saleCurrency || property.currency || "GBP")
      : (property.currency || "GBP");
  const formattedPriceNum = effectivePropPrice.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const symbol = effectivePropCurrency === 'GBP' ? '£' : effectivePropCurrency === 'USD' ? '$' : effectivePropCurrency === 'EUR' ? '€' : '₺';
  const priceWords = numberToTrWords(effectivePropPrice, effectivePropCurrency);
  const propertyPriceFormatted = `${formattedPriceNum} ${symbol} (${priceWords})`;

  const computedRemainingSaleRaw = computeRemainingSaleAmount(
    salePriceInput || formattedPriceNum,
    depositAmount
  );

  const placeholderValues: ContractPlaceholderValues = {
    storeName: storeNameVal,
    storePhone: storePhoneVal,
    storeEmail: storeEmailVal,
    clientName: clientName || (isOwnerAuthContract ? (resolveOwnerName(property) || "[Mülk Sahibi Adı]") : "[Alıcı / Kiracı Adı]"),
    clientIdentity: clientIdentity || (isOwnerAuthContract ? (resolveOwnerIdentity(property) || "[Mülk Sahibi Kimlik No]") : "[Kimlik / Pasaport No]"),
    buyerIdType: buyerIdType || "KKTC KİMLİK",
    clientPhone: clientPhone || (isOwnerAuthContract ? (resolveOwnerPhone(property) || "[Telefon Numarası]") : "[Telefon Numarası]"),
    ownerName: ownerName || (isOwnerAuthContract ? storeNameVal : (resolveOwnerName(property) || "Mülk Sahibi")),
    ownerPhone: ownerPhone || (isOwnerAuthContract ? storePhoneVal : (resolveOwnerPhone(property) || "")),
    sellerIdentity: sellerIdentity || "[Kimlik No]",
    propertyTitle: resolveOfficialPropertyTitle(property),
    propertyPrice: propertyPriceFormatted,
    propertyBlockPlot: property.block_plot || (adaNo || parselNo ? `Ada: ${adaNo || '-'} / Parsel: ${parselNo || '-'}` : undefined),
    commissionRate: property.listing_intent === 'rent' || selectedTemplateId === 'rental_authorization' ? commissionRate : (commissionRate.includes('%') ? commissionRate : `%${commissionRate}`),
    contractDate: formatTrDate(contractDate),
    propertyAddress: rentalAddress || property.address,
    splitRatio: splitRatio,
    contractDuration: contractDuration,
    evictionDate: formatTrDate(evictionDate),
    depositAmount: depositAmount,
    rentDuration: rentDuration,
    paymentDay: paymentDay,
    // Rental Agreement (KİRA SÖZLEŞMESİ) & Authorization fields
    exclusivityIntent: exclusivityIntent,
    authPropertyCategory: authPropertyCategory || detectDefaultAuthPropertyCategory(property),
    authPropertyCategoryOther: authPropertyCategoryOther,
    authServiceFeePayer: authServiceFeePayer || clientName || resolveOwnerName(property) || "",
    authServiceFeeReceiver: authServiceFeeReceiver || ownerName || storeNameVal,
    authShowingDayType: authShowingDayType || "TÜMÜ",
    authShowingHours: authShowingHours || "09:00 - 18:00",
    authDurationDays: authDurationDays || "90 (Doksan)",
    rentalPropertyDef: rentalPropertyDef || defaultRentalMeta.rentalPropertyDef,
    authPropertyTypeFeatures: authPropertyTypeFeatures || rentalPropertyDef || defaultRentalMeta.rentalPropertyDef,
    authAdvancePayment: authAdvancePayment || "1 Aylık Kira Bedeli",
    authAnnualIncreaseRate: authAnnualIncreaseRate || "%10",
    authTenantCriteria: authTenantCriteria || "Düzenli gelir sahibi, kurumsal çalışan veya aile",
    authCopiesCount: authCopiesCount || "2 (İki)",
    rentalUsagePurpose: rentalUsagePurpose || defaultRentalMeta.rentalUsagePurpose,
    rentalDistrict: rentalDistrict || defaultRentalMeta.rentalDistrict,
    rentalTownVillage: rentalTownVillage || defaultRentalMeta.rentalTownVillage,
    kocanNo: kocanNo,
    paftaNo: paftaNo,
    adaNo: adaNo,
    parselNo: parselNo,
    rentPriceRaw: rentPriceInput || formattedPriceNum,
    rentCurrency: rentCurrency || "TL",
    rentPaymentMethod: rentPaymentMethod || (selectedTemplateId === "rental_deposit_agreement" ? "1 Yıl Peşin Ödemeli" : "Aylık Ödemeli"),
    rentStartDate: formatTrDate(rentStartDate) || formatTrDate(contractDate),
    rentEndDate: formatTrDate(rentEndDate),
    // Rental Deposit / Kapora Agreement (KAPORA SÖZLEŞMESİ) fields
    kaporaTenant2Info: kaporaTenant2Info,
    kaporaTenant3Info: kaporaTenant3Info,
    kaporaTotalRentAmount: kaporaTotalRentAmount,
    kaporaDuesAmount: kaporaDuesAmount,
    kaporaCommissionAmount: kaporaCommissionAmount || commissionRate || "1 Kira Bedeli",
    kaporaPaidAmount: kaporaPaidAmount || rentPriceInput || formattedPriceNum,
    kaporaRemainingBalance: kaporaRemainingBalance,
    kaporaBalanceDueDate: formatTrDate(kaporaBalanceDueDate) || formatTrDate(contractDate),
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
    // Sales Deposit / Kapora & Escrow Agreements fields
    salesDepositPaidAmount: formatThousandsInput(depositAmount || "5000"),
    salesDepositRemainingAmount: computedRemainingSaleRaw,
    salesPaymentTerms: salesPaymentTerms || "Tapu devrinde hepsi ödenecektir.",
    reservationDays: reservationDays || "15 (on beş)",
    escrowDeadlineDays: escrowDeadlineDays || "15",
    // Commission Receipts (KOMİSYON ALIM BELGESİ) fields
    commissionAmountWords: commissionReceiptAmount,
    commissionPaymentMethod: commissionReceiptPaymentMethod,
    commissionBrokerTitle: storeNameVal,
    commissionPayerName: commissionReceiptPayerName || (selectedTemplateId === "rental_commission_receipt" ? clientName : (ownerName || clientName)),
    commissionPayerIdentity: commissionReceiptPayerIdentity || (selectedTemplateId === "rental_commission_receipt" ? clientIdentity : (sellerIdentity || clientIdentity)),
    commissionPayerPhone: commissionReceiptPayerPhone || (selectedTemplateId === "rental_commission_receipt" ? clientPhone : (ownerPhone || clientPhone)),
    commissionPayerRole: commissionReceiptPayerRole,
    commissionReceiptNo: commissionReceiptNo,
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

  const buildContractSignUrl = (role: "buyer" | "seller" | "final" = "buyer", customDocId?: string, customPropId?: string | number) => {
    const targetPropId = customPropId || resolvedPropertyId || property.id;
    const base = `${window.location.origin}/contract/sign/${targetPropId}`;
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
      // Rental & Authorization contract params
      exclusivityIntent: placeholderValues.exclusivityIntent || "sale",
      authPropertyCategory: placeholderValues.authPropertyCategory || "",
      authPropertyCategoryOther: placeholderValues.authPropertyCategoryOther || "",
      authServiceFeePayer: placeholderValues.authServiceFeePayer || "",
      authServiceFeeReceiver: placeholderValues.authServiceFeeReceiver || "",
      authShowingDayType: placeholderValues.authShowingDayType || "TÜMÜ",
      authShowingHours: placeholderValues.authShowingHours || "",
      authDurationDays: placeholderValues.authDurationDays || "",
      rentalPropertyDef: placeholderValues.rentalPropertyDef || "",
      authPropertyTypeFeatures: placeholderValues.authPropertyTypeFeatures || "",
      authAdvancePayment: placeholderValues.authAdvancePayment || "",
      authAnnualIncreaseRate: placeholderValues.authAnnualIncreaseRate || "",
      authTenantCriteria: placeholderValues.authTenantCriteria || "",
      authCopiesCount: placeholderValues.authCopiesCount || "",
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
      kaporaTenant2Info: placeholderValues.kaporaTenant2Info || "",
      kaporaTenant3Info: placeholderValues.kaporaTenant3Info || "",
      kaporaTotalRentAmount: placeholderValues.kaporaTotalRentAmount || "",
      kaporaDuesAmount: placeholderValues.kaporaDuesAmount || "",
      kaporaCommissionAmount: placeholderValues.kaporaCommissionAmount || "",
      kaporaPaidAmount: placeholderValues.kaporaPaidAmount || "",
      kaporaRemainingBalance: placeholderValues.kaporaRemainingBalance || "",
      kaporaBalanceDueDate: placeholderValues.kaporaBalanceDueDate || "",
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
      // Sales Deposit / Kapora & Escrow Agreements params
      salesDepositPaidAmount: placeholderValues.salesDepositPaidAmount || "",
      salesDepositRemainingAmount: placeholderValues.salesDepositRemainingAmount || "",
      salesPaymentTerms: placeholderValues.salesPaymentTerms || "",
      reservationDays: placeholderValues.reservationDays || "",
      escrowDeadlineDays: placeholderValues.escrowDeadlineDays || "",
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
      // Commission Receipt params
      commissionReceiptNo: placeholderValues.commissionReceiptNo || "",
      commissionReceiptAmount: placeholderValues.commissionReceiptAmount || "",
      commissionReceiptCurrency: placeholderValues.commissionReceiptCurrency || "",
      commissionAmountWords: placeholderValues.commissionAmountWords || "",
      commissionPaymentMethod: placeholderValues.commissionPaymentMethod || "",
      commissionPayerName: placeholderValues.commissionPayerName || "",
      commissionPayerIdentity: placeholderValues.commissionPayerIdentity || "",
      commissionPayerPhone: placeholderValues.commissionPayerPhone || "",
      commissionPayerRole: placeholderValues.commissionPayerRole || "",
      commissionBrokerTitle: placeholderValues.commissionBrokerTitle || "",
      commissionInvoiceNote: placeholderValues.commissionInvoiceNote || "",
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

    const effectiveTplTitle =
      selectedTemplateId === "exclusivity_agreement"
        ? exclusivityIntent === "rent"
          ? "Kiralık Gayrimenkul Tek Yetkili Kiralama Sözleşmesi"
          : "Satılık Gayrimenkul Yetkili Satış Sözleşmesi (Hizmet Bedeli Eklenerek)"
        : selectedTemplateId === "sales_authorization"
        ? "Satılık Gayrimenkul Yetkili Satış Sözleşmesi (Hizmet Bedeli Eklenerek)"
        : currentTemplate.titleTr;

    const docName = stage === "finalized"
      ? `FİNAL İMZALI ${effectiveTplTitle} (${firstSignerLabel}: ${clientName || firstSignerLabel} + ${secondSignerLabel}: ${placeholderValues.ownerName}) - ${formatTrDate(contractDate)}`
      : stage === "buyer_signed"
      ? isBilateralContract
        ? `1. İmza (${firstSignerLabel} Onaylı) ${effectiveTplTitle} - ${clientName || firstSignerLabel} [${secondSignerLabel} İmzası Bekleniyor] (${formatTrDate(contractDate)})`
        : `İMZALI ${effectiveTplTitle} - ${clientName || firstSignerLabel} (${formatTrDate(contractDate)})`
      : `${effectiveTplTitle} - ${clientName || 'Taslak'} (${formatTrDate(contractDate)})`;

    const docRecord = {
      id: activeDocId,
      name: docName,
      category: "contract",
      file_url: "is_virtual_contract",
      upload_date: formatTrDate(contractDate),
      details: {
        templateId: selectedTemplateId,
        exclusivityIntent: placeholderValues.exclusivityIntent,
        authPropertyCategory: placeholderValues.authPropertyCategory,
        authPropertyCategoryOther: placeholderValues.authPropertyCategoryOther,
        authServiceFeePayer: placeholderValues.authServiceFeePayer,
        authServiceFeeReceiver: placeholderValues.authServiceFeeReceiver,
        authShowingDayType: placeholderValues.authShowingDayType,
        authShowingHours: placeholderValues.authShowingHours,
        authDurationDays: placeholderValues.authDurationDays,
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
        authPropertyTypeFeatures: placeholderValues.authPropertyTypeFeatures,
        authAdvancePayment: placeholderValues.authAdvancePayment,
        authAnnualIncreaseRate: placeholderValues.authAnnualIncreaseRate,
        authTenantCriteria: placeholderValues.authTenantCriteria,
        authCopiesCount: placeholderValues.authCopiesCount,
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
        kaporaTenant2Info: placeholderValues.kaporaTenant2Info,
        kaporaTenant3Info: placeholderValues.kaporaTenant3Info,
        kaporaTotalRentAmount: placeholderValues.kaporaTotalRentAmount,
        kaporaDuesAmount: placeholderValues.kaporaDuesAmount,
        kaporaCommissionAmount: placeholderValues.kaporaCommissionAmount,
        kaporaPaidAmount: placeholderValues.kaporaPaidAmount,
        kaporaRemainingBalance: placeholderValues.kaporaRemainingBalance,
        kaporaBalanceDueDate: placeholderValues.kaporaBalanceDueDate,
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
        salesDepositPaidAmount: placeholderValues.salesDepositPaidAmount,
        salesDepositRemainingAmount: placeholderValues.salesDepositRemainingAmount,
        salesPaymentTerms: placeholderValues.salesPaymentTerms,
        reservationDays: placeholderValues.reservationDays,
        escrowDeadlineDays: placeholderValues.escrowDeadlineDays,
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
        fixturePhotos: placeholderValues.fixturePhotos,
        // Commission receipt details
        commissionReceiptNo: placeholderValues.commissionReceiptNo,
        commissionReceiptAmount: placeholderValues.commissionReceiptAmount,
        commissionReceiptCurrency: placeholderValues.commissionReceiptCurrency,
        commissionAmountWords: placeholderValues.commissionAmountWords,
        commissionPaymentMethod: placeholderValues.commissionPaymentMethod,
        commissionPayerName: placeholderValues.commissionPayerName,
        commissionPayerIdentity: placeholderValues.commissionPayerIdentity,
        commissionPayerPhone: placeholderValues.commissionPayerPhone,
        commissionPayerRole: placeholderValues.commissionPayerRole,
        commissionBrokerTitle: placeholderValues.commissionBrokerTitle,
        commissionInvoiceNote: placeholderValues.commissionInvoiceNote
      }
    };

    const isRentAuthFlow =
      selectedTemplateId === "rental_authorization" ||
      selectedTemplateId === "exclusivity_agreement";

    const prePortfolioMeta = {
      templateId: selectedTemplateId,
      listingIntent: isRentAuthFlow ? "rent" : "sale",
      address: placeholderValues.propertyAddress || rentalAddress || property.address || "",
      propertyTypeFeatures:
        selectedTemplateId === "exclusivity_agreement" || selectedTemplateId === "sales_authorization"
          ? `${placeholderValues.authPropertyCategory || "APT.DAİRESİ"}${placeholderValues.authPropertyCategoryOther ? ` (${placeholderValues.authPropertyCategoryOther})` : ""}`
          : (placeholderValues.authPropertyTypeFeatures || authPropertyTypeFeatures || rentalPropertyDef || "Konut / Gayrimenkul"),
      price:
        isRentAuthFlow
          ? parseInt(String(rentPriceInput || "0").replace(/[^\d]/g, ""), 10) || Number(property.price || 0)
          : parseInt(String(salePriceInput || "0").replace(/[^\d]/g, ""), 10) || Number(property.price || 0),
      currency:
        isRentAuthFlow
          ? (rentCurrency === "TL" ? "TRY" : rentCurrency || "GBP")
          : (saleCurrency || property.currency || "GBP"),
      deposit: depositAmount,
      kocanNo,
      paftaNo,
      adaNo,
      parselNo,
      district: placeholderValues.rentalDistrict,
      townVillage: placeholderValues.rentalTownVillage,
      ownerName: clientName || resolveOwnerName(property),
      ownerPhone: clientPhone || resolveOwnerPhone(property),
      ownerIdentity: clientIdentity || resolveOwnerIdentity(property),
      ownerAddress: clientAddress || ""
    };

    const savedProp = await onSaveContract(docRecord, prePortfolioMeta);
    const nextPropId = savedProp?.id || resolvedPropertyId || property.id;
    if (savedProp?.id) {
      setResolvedPropertyId(savedProp.id);
    }
    return { docId: activeDocId, propId: nextPropId };
  };

  // 1. Send to 1st Priority Signer (Mülk Sahibi for owner auth contracts; Alıcı/Kiracı otherwise)
  const handleShareBuyerWhatsApp = async () => {
    const isOfferLetter = selectedTemplateId === "offer_letter";
    if (!clientName.trim() || (!isOfferLetter && !isOwnerAuthContract && !clientIdentity.trim()) || !clientPhone.trim()) {
      alert(`Lütfen ${firstSignerLabel} tarafına imza bağlantısı göndermeden önce ${firstSignerLabel} Adı Soyadı ve Telefon Numarasını eksiksiz doldurunuz.`);
      return;
    }
    let targetPropId: string | number = resolvedPropertyId || property.id;
    try {
      const persisted = await persistContractRecord({ silent: true });
      if (persisted && typeof persisted === "object" && persisted.propId) {
        targetPropId = persisted.propId;
      }
    } catch {
      // ignore if offline
    }
    const formattedPhone = formatPhoneForWhatsApp(clientPhone);
    const signUrl = buildContractSignUrl("buyer", activeDocId, targetPropId);
    const subjectLabel = isOwnerAuthContract
      ? `${placeholderValues.propertyAddress || "Belirtilen Adres"} (${placeholderValues.authPropertyTypeFeatures || "Gayrimenkul"})`
      : resolveOfficialPropertyTitle(property);
    const message = `Sayın *${clientName}*,\n\n*${subjectLabel}* taşınmazı için hazırlanan resmi *${currentTemplate.titleTr}* belgesi **1. İmza (${firstSignerLabel} Onayı)** için tarafınıza sunulmuştur.\n\nSözleşmeyi mobil cihazınızdan incelemek ve dijital olarak *İMZALAMAK* için lütfen aşağıdaki bağlantıya tıklayınız:\n\n${signUrl}\n\nSözleşme Tarihi: ${placeholderValues.contractDate}\n\nSaygılarımızla,\n*${storeNameVal}*\nİrtibat: ${storePhoneVal}`;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // 2. Send 1st-Signed Contract to 2nd Signer (İşletme Yetkilisi for owner auth; Satıcı/Kiraya Veren otherwise) for Final Signature
  const handleShareSellerWhatsApp = async () => {
    if (isBilateralContract && !signed) {
      alert(`İmza önceliği ${firstSignerLabel.toUpperCase()} tarafındadır! ${secondSignerLabel} imzasına göndermeden önce sözleşmenin ${firstSignerLabel} tarafından imzalanmış olması gerekmektedir.`);
      return;
    }
    try {
      await persistContractRecord({ silent: true });
    } catch {
      // ignore
    }
    const targetPhone = ownerPhone || (isOwnerAuthContract ? storePhoneVal : resolveOwnerPhone(property));
    const formattedOwnerPhone = targetPhone && !targetPhone.includes("5XX") ? formatPhoneForWhatsApp(targetPhone) : "";
    const signUrl = buildContractSignUrl("seller", activeDocId);
    const message = `*2. İMZA (${secondSignerLabel.toUpperCase()} FİNAL ONAYI) - ${currentTemplate.titleTr.toUpperCase()}*\nTarih: ${placeholderValues.contractDate}\n\n*Sn. ${placeholderValues.ownerName}*,\n\n*${resolveOfficialPropertyTitle(property)}* taşınmazı için hazırlanan *${currentTemplate.titleTr}*, ${firstSignerLabel} *${clientName || firstSignerLabel}* tarafından dijital olarak imzalanmıştır (✔ 1. İmza Tamamlandı).\n\nİmzalı sözleşmeyi incelemek ve **${secondSignerLabel} olarak aynı sözleşme üzerinde dijital imzanızla FİNALLEMEK** için lütfen aşağıdaki bağlantıya tıklayınız:\n\n${signUrl}\n\nSaygılarımızla,\n*${storeNameVal}*\nİrtibat: ${storePhoneVal}`;
    if (formattedOwnerPhone) {
      window.open(`https://wa.me/${formattedOwnerPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  // 3. Send Finalized Dual-Signed Contract to Both Parties
  const handleSendFinalizedWhatsApp = async (recipient: "buyer" | "seller") => {
    try {
      await persistContractRecord({ silent: true });
    } catch {
      // ignore
    }
    const finalUrl = buildContractSignUrl("final", activeDocId);
    const isFirstParty = recipient === "buyer";
    const rawPhone = isFirstParty ? clientPhone : (ownerPhone || (isOwnerAuthContract ? storePhoneVal : resolveOwnerPhone(property)));
    const formattedPhone = rawPhone && !rawPhone.includes("5XX") ? formatPhoneForWhatsApp(rawPhone) : "";
    const recipientName = isFirstParty ? (clientName || firstSignerLabel) : (placeholderValues.ownerName || secondSignerLabel);

    const message = `*FİNAL İMZALI ${currentTemplate.titleTr.toUpperCase()} (${firstSignerLabel.toUpperCase()} + ${secondSignerLabel.toUpperCase()} ONAYLI)*\nTarih: ${placeholderValues.contractDate}\n\nSayın *${recipientName}*,\n\n*${resolveOfficialPropertyTitle(property)}* taşınmazına ait *${currentTemplate.titleTr}*, hem ${firstSignerLabel} (*${clientName}*) hem de ${secondSignerLabel} (*${placeholderValues.ownerName}*) tarafından karşılıklı dijital imzalarla tamamlanarak sistemde mühürlenmiştir.\n\nHer iki tarafın imzasını taşıyan **Sözleşmenin Son Halini** görüntülemek ve PDF olarak indirmek için:\n\n${finalUrl}\n\nHayırlı ve uğurlu olmasını dileriz.\n*${storeNameVal}*\nİrtibat: ${storePhoneVal}`;

    if (formattedPhone) {
      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleSaveContract = async () => {
    const isOfferLetter = selectedTemplateId === "offer_letter";
    const isCommissionReceipt = selectedTemplateId === "rental_commission_receipt" || selectedTemplateId === "sales_commission_receipt";
    const primaryName = isCommissionReceipt
      ? (commissionReceiptPayerName || clientName || ownerName)
      : clientName;
    const primaryId = isCommissionReceipt
      ? (commissionReceiptPayerIdentity || clientIdentity || sellerIdentity)
      : clientIdentity;

    if (!primaryName.trim() || (!isOfferLetter && !isOwnerAuthContract && !isCommissionReceipt && !primaryId.trim())) {
      alert(`Lütfen belgeyi kaydetmeden önce ${firstSignerLabel} Adı Soyadı bilgisini giriniz.`);
      return;
    }
    if (!onSaveContract) return;
    setSaving(true);
    try {
      await persistContractRecord();

      // Kasaya Gelir Olarak İşle
      if (isCommissionReceipt && recordToCashRegister) {
        try {
          const rawNum = parseNumericAmount(commissionReceiptAmount);
          if (rawNum > 0) {
            const isRentReceipt = selectedTemplateId === "rental_commission_receipt";
            const targetStoreId = property?.store_id || branding?.store_id || branding?.id || 1;
            const payerLabel = primaryName || (isRentReceipt ? "Kiracı" : "Mal Sahibi");
            await api.addPortfolioTransaction({
              type: "income",
              category: isRentReceipt ? "rental_placement" : "commission",
              title: isRentReceipt ? "Kiralama Hizmet Bedeli (Komisyon)" : "Gayrimenkul Satış Komisyonu",
              amount: rawNum,
              currency: commissionReceiptCurrency || "GBP",
              date: contractDate || new Date().toISOString().split("T")[0],
              property_id: property.id || null,
              property_title: resolveOfficialPropertyTitle(property),
              description: `${commissionReceiptNo || "Makbuz"} no'lu ${isRentReceipt ? "Kiralık" : "Satılık"} Komisyon Alım Belgesi - ${payerLabel}`,
              payment_method: commissionReceiptPaymentMethod || "Nakit",
              contact_name: payerLabel,
              reference_no: commissionReceiptNo || property.reference_no || ""
            }, targetStoreId);
          }
        } catch (kasaErr) {
          console.warn("Kasa gelir kaydı eklenirken hata:", kasaErr);
        }
      }

      const kasaMsg = (isCommissionReceipt && recordToCashRegister)
        ? "\n\n💰 Komisyon bedeli Mağaza Finans Kasasına (Gelir olarak) başarıyla işlendi."
        : "";

      alert(
        signed && sellerSigned
          ? `${firstSignerLabel} ve ${secondSignerLabel} onaylı FİNAL BELGE sistem arşivine kaydedildi! Şimdi son halini taraflara iletebilirsiniz.${kasaMsg}`
          : signed
          ? `1. İmza (${firstSignerLabel} onaylı belge) kaydedildi! Şimdi 2. adım olarak ${secondSignerLabel} onayına geçebilirsiniz.${kasaMsg}`
          : `Belge başarıyla kaydedildi!${kasaMsg}`
      );
    } catch (err: any) {
      alert("Belge kaydedilemedi: " + err.message);
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
      className="fixed inset-0 z-[120] flex items-center justify-center p-1 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-hidden animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl w-full max-w-[98vw] sm:max-w-[96vw] xl:max-w-[1440px] h-[95vh] sm:h-[92vh] max-h-[95dvh] sm:max-h-[92dvh] flex flex-col md:flex-row overflow-hidden shadow-2xl relative border-2 border-slate-300 text-slate-950">
        
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
        <div className={`w-full flex-1 min-h-0 h-full md:h-auto md:flex-initial md:w-[40%] lg:w-[38%] md:shrink-0 bg-slate-50 p-3.5 sm:p-4 flex-col justify-between border-b-2 md:border-b-0 md:border-r-2 border-slate-300 overflow-y-auto text-slate-950 ${
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

            {/* Template Selector (Açılır-Kapanır / Collapsible Selector) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>1. Sözleşme Şablonu</span>
                  <span className="text-[9px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-md">
                    {filteredTemplates.length} Tip
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsTemplateSelectorOpen((prev) => !prev)}
                  className="text-[10px] font-black text-indigo-700 hover:text-indigo-950 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>{isTemplateSelectorOpen ? "Listeyi Gizle" : "Şablon Değiştir"}</span>
                  {isTemplateSelectorOpen ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Seçili Şablonun Kompakt Kartı (Her Zaman Görünür - Tıklanınca Açılır/Kapanır) */}
              {(() => {
                const activeTpl = filteredTemplates.find((t) => t.id === selectedTemplateId) || filteredTemplates[0];
                const activeTitle = activeTpl
                  ? activeTpl.id === "exclusivity_agreement"
                    ? "Kiralık Tek Yetki Sözleşmesi"
                    : activeTpl.titleTr
                  : "Sözleşme";
                const activeBadge = getTemplateBadge(selectedTemplateId);

                return (
                  <button
                    type="button"
                    onClick={() => setIsTemplateSelectorOpen((prev) => !prev)}
                    className={`w-full px-3 py-2 rounded-xl flex items-center justify-between gap-2 transition-all text-left border-2 cursor-pointer shadow-xs ${
                      isTemplateSelectorOpen
                        ? "bg-slate-900 border-indigo-500 text-white ring-2 ring-indigo-500/20"
                        : "bg-slate-900 border-slate-900 text-white hover:bg-slate-800"
                    }`}
                    title="Sözleşme şablonları listesini aç/kapat"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 shrink-0 text-amber-400" />
                      <div className="min-w-0">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                          Aktif Şablon
                        </div>
                        <h5 className="text-xs font-black leading-snug truncate mt-0.5 text-white">
                          {activeTitle}
                        </h5>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {activeBadge && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${activeBadge.bg}`}>
                          {activeBadge.label}
                        </span>
                      )}
                      <div className="p-1 rounded-lg bg-slate-800 text-slate-300">
                        {isTemplateSelectorOpen ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })()}

              {/* Açılır Sözleşme Listesi (Maksimum Yükseklik Sınırlı, Sayfayı Uzatmaz) */}
              {isTemplateSelectorOpen && (
                <div className="p-1.5 bg-slate-100 border-2 border-slate-300 rounded-2xl space-y-1 shadow-md max-h-64 sm:max-h-72 overflow-y-auto">
                  <div className="text-[9px] font-black uppercase tracking-wider text-slate-500 px-2 py-0.5 flex items-center justify-between">
                    <span>Kullanılabilir Sözleşmeler ({filteredTemplates.length})</span>
                    <span>Seçmek İçin Tıklayın</span>
                  </div>
                  {filteredTemplates.map((template) => {
                    const displayTitleTr =
                      template.id === "exclusivity_agreement"
                        ? "Kiralık Tek Yetki Sözleşmesi"
                        : template.titleTr;
                    const isSelected = selectedTemplateId === template.id;
                    const badge = getTemplateBadge(template.id);

                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => {
                          handleSelectTemplate(template.id);
                          setIsTemplateSelectorOpen(false);
                        }}
                        className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between gap-2 transition-all text-left border cursor-pointer ${
                          isSelected
                            ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                            : "bg-white border-slate-200 text-slate-900 hover:bg-slate-200/80 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? "text-amber-400" : "text-slate-500"
                            }`}
                          />
                          <h5 className="text-xs font-black leading-tight truncate">
                            {displayTitleTr}
                          </h5>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {badge && (
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                                isSelected ? "bg-amber-400 text-slate-950" : badge.bg
                              }`}
                            >
                              {badge.label}
                            </span>
                          )}
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 1. İMZA (ÖNCELİKLİ TARAF): Tek Yetki / Kiralama Yetki'de MÜLK SAHİBİ; Diğerlerinde ALICI / KİRACI */}
            <div className="p-3 bg-white border-2 border-indigo-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-indigo-950 uppercase tracking-wider">
                  {isOwnerAuthContract
                    ? "MÜLK SAHİBİ BİLGİLERİ"
                    : selectedTemplateId === "rental_agreement" || selectedTemplateId === "eviction_undertaking"
                    ? "KİRACI BİLGİLERİ"
                    : "ALICI / MÜŞTERİ BİLGİLERİ"}
                </span>
                <span className="text-[9px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded">
                  1. İmza (Öncelikli)
                </span>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-900">
                    {isOwnerAuthContract
                      ? "Mülk Sahibi Adı Soyadı *"
                      : selectedTemplateId === "rental_agreement" || selectedTemplateId === "eviction_undertaking"
                      ? "Kiracı Adı Soyadı *"
                      : "Alıcı Adı Soyadı *"}
                  </label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border-2 border-slate-300 pl-8 pr-3 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                      placeholder={
                        isOwnerAuthContract
                          ? "Örn: AYSIN YILMAÇ"
                          : selectedTemplateId === "rental_agreement"
                          ? "Örn: KIVANÇ KÖKLÜ"
                          : "Örn: NEVZAT GÜNGÖR"
                      }
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
                    <label className="text-[10px] font-black text-slate-900">
                      {isOwnerAuthContract ? "Mülk Sahibi Kimlik / Pasaport No" : "Kimlik / Pasaport No *"}
                    </label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                      placeholder={selectedTemplateId === "rental_agreement" ? "Örn: 26710811422" : "Örn: 213066"}
                      value={clientIdentity}
                      onChange={(e) => setClientIdentity(e.target.value)}
                    />
                  </div>

                  {(["sales_brokerage", "sales_deposit_agreement", "escrow_deposit_agreement", "property_reservation_deposit", "rental_agreement", "rental_deposit_agreement"].includes(selectedTemplateId)) && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-900">Kimlik / Pasaport Türü</label>
                      <select
                        className="w-full bg-slate-50 border-2 border-slate-300 px-2 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                        value={buyerIdType}
                        onChange={(e) => setBuyerIdType(e.target.value)}
                      >
                        <option value="PASAPORT">PASAPORT</option>
                        <option value="TC kimlik">TC kimlik</option>
                        <option value="KKTC kimlik">KKTC kimlik</option>
                        <option value="KKTC KİMLİK">KKTC KİMLİK</option>
                        <option value="TC KİMLİK">TC KİMLİK</option>
                      </select>
                    </div>
                  )}

                  <div className={(["sales_brokerage", "sales_deposit_agreement", "escrow_deposit_agreement", "property_reservation_deposit", "rental_agreement", "rental_deposit_agreement"].includes(selectedTemplateId)) ? "space-y-1" : "space-y-1 sm:col-span-2"}>
                    <label className="text-[10px] font-black text-slate-900">
                      {isOwnerAuthContract
                        ? "Mülk Sahibi Telefon (WhatsApp) *"
                        : selectedTemplateId === "rental_agreement" || selectedTemplateId === "rental_deposit_agreement" || selectedTemplateId === "eviction_undertaking"
                        ? "Kiracı Telefon (WhatsApp) *"
                        : "Alıcı Telefon (WhatsApp) *"}
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
                  {(property.listing_intent === 'rent' || selectedTemplateId === 'rental_authorization') && selectedTemplateId !== 'exclusivity_agreement' ? (
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

            {/* 2. İMZA (FİNAL ONAY TARAF): Tek Yetki / Kiralama Yetki'de İŞLETME YETKİLİSİ; Diğerlerinde SATICI / KİRAYA VEREN */}
            {isBilateralContract && (
              <div className="p-3 bg-white border-2 border-slate-300 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider">
                    {isOwnerAuthContract || selectedTemplateId === "rental_deposit_agreement"
                      ? "EMLAK KOMİSYONCUSU / ARACI OFİS BİLGİLERİ"
                      : selectedTemplateId === "rental_agreement"
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
                      {isOwnerAuthContract || selectedTemplateId === "rental_deposit_agreement"
                        ? "Emlak Komisyoncusu / Yetkili *"
                        : selectedTemplateId === "rental_agreement"
                        ? "Kiraya Veren Adı Soyadı *"
                        : "Satıcı Adı Soyadı *"}
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                      placeholder={
                        isOwnerAuthContract || selectedTemplateId === "rental_deposit_agreement"
                          ? "Örn: Rodel Investment - Emrah CEYHAN"
                          : selectedTemplateId === "rental_agreement"
                          ? "Örn: TUNCEL SOYCAN"
                          : "Örn: İMAM YILDIRIM"
                      }
                      value={ownerName}
                      onChange={(e) => {
                        setOwnerName(e.target.value);
                        setSellerSigningName(e.target.value);
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">
                      {isOwnerAuthContract
                        ? "Ofis / Yetkili Telefon (WhatsApp)"
                        : selectedTemplateId === "rental_agreement"
                        ? "Kiraya Veren Telefon"
                        : "Satıcı Telefon (WhatsApp)"}
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

            {/* KOMİSYON ALIM BELGESİ (Kiralık & Satılık) Özel Değişkenleri & Kasa Entegrasyonu */}
            {(selectedTemplateId === "rental_commission_receipt" || selectedTemplateId === "sales_commission_receipt") && (
              <div className="p-3 bg-emerald-50/90 border-2 border-emerald-400 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-emerald-700" />
                    3. {selectedTemplateId === "rental_commission_receipt" ? "Kiralık" : "Satılık"} Komisyon Alım Belgesi & Kasa Entegrasyonu
                  </span>
                  <span className="text-[9px] font-black bg-slate-900 text-emerald-400 px-2 py-0.5 rounded uppercase">
                    {selectedTemplateId === "rental_commission_receipt" ? "Kiracı ➔ Aracı" : "Mal Sahibi ➔ Aracı"}
                  </span>
                </div>

                {/* Komisyon Tutarı & Para Birimi & Ödeme Şekli */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-0.5 sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-900">
                      Alınan Komisyon Bedeli *
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="flex-1 min-w-0 bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-emerald-600"
                        placeholder="Örn: 800"
                        value={commissionReceiptAmount}
                        onChange={(e) => setCommissionReceiptAmount(formatThousandsInput(e.target.value))}
                      />
                      <select
                        className="w-20 bg-slate-900 text-white border-2 border-slate-900 px-1.5 py-1.5 rounded-lg text-xs font-black shrink-0"
                        value={commissionReceiptCurrency}
                        onChange={(e) => setCommissionReceiptCurrency(e.target.value)}
                      >
                        <option value="GBP">GBP</option>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                        <option value="TRY">TRY</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[10px] font-black text-slate-900">
                      Tahsilat / Ödeme Şekli
                    </label>
                    <select
                      className="w-full bg-white border-2 border-slate-300 px-2 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-emerald-600"
                      value={commissionReceiptPaymentMethod}
                      onChange={(e) => setCommissionReceiptPaymentMethod(e.target.value)}
                    >
                      <option value="Nakit">Nakit</option>
                      <option value="Banka Havalesi / EFT">Banka Havalesi / EFT</option>
                      <option value="Kredi Kartı">Kredi Kartı</option>
                      <option value="Çek">Çek</option>
                    </select>
                  </div>
                </div>

                {/* Makbuz Numarası & Ödeyen Taraf Rolü */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-black text-slate-900">
                      Makbuz / Belge Numarası
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-950 focus:outline-none focus:border-emerald-600"
                      placeholder="MAK-001"
                      value={commissionReceiptNo}
                      onChange={(e) => setCommissionReceiptNo(e.target.value)}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-black text-slate-900">
                      Ödemeyi Yapan Taraf Rolü
                    </label>
                    <select
                      className="w-full bg-white border-2 border-slate-300 px-2 py-1.5 rounded-lg text-xs font-bold text-slate-950 focus:outline-none focus:border-emerald-600"
                      value={commissionReceiptPayerRole}
                      onChange={(e) => setCommissionReceiptPayerRole(e.target.value)}
                    >
                      {selectedTemplateId === "rental_commission_receipt" ? (
                        <>
                          <option value="KİRACI">KİRACI</option>
                          <option value="MÜLK SAHİBİ">MÜLK SAHİBİ</option>
                        </>
                      ) : (
                        <>
                          <option value="MAL SAHİBİ">MAL SAHİBİ</option>
                          <option value="ALICI">ALICI</option>
                          <option value="MÜŞTERİ">MÜŞTERİ</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Kasaya Gelir Olarak İşle - Entegre Kasa Kartı */}
                <div className="p-2.5 bg-white border-2 border-emerald-500 rounded-xl shadow-xs">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recordToCashRegister}
                      onChange={(e) => setRecordToCashRegister(e.target.checked)}
                      className="w-4 h-4 mt-0.5 accent-emerald-600 rounded text-emerald-600 focus:ring-emerald-500 shrink-0 cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <div className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                        <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                        Bu Tahsilatı Mağaza Finans Kasasına (Gelir) İşle
                      </div>
                      <p className="text-[10.5px] font-medium text-slate-600 leading-tight">
                        Kaydedildiğinde bu tutar ({commissionReceiptAmount || "0"} {commissionReceiptCurrency}) Mağaza Finans & Kasa Yönetimi modülüne otomatik gelir hareketi olarak işlenir.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* KAPORA SÖZLEŞMESİ (sales_deposit_agreement) Özel Değişkenleri */}
            {selectedTemplateId === "sales_deposit_agreement" && (
              <div className="p-3 bg-amber-50/80 border-2 border-amber-300 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-950">
                    3. Kapora Sözleşmesi Değişkenleri (Emlakçı Kasa Muhafazalı)
                  </span>
                  <span className="text-[9px] font-black bg-slate-900 text-amber-400 px-2 py-0.5 rounded uppercase">
                    Alıcı ➔ Komisyoncu
                  </span>
                </div>

                {/* Satış Bedeli & Kapora Tutarı */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Gayrimenkul Satış Fiyatı *</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="flex-1 min-w-0 bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                        placeholder="38.500"
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
                    <label className="text-[10px] font-black text-slate-900">Bırakılan Kapora Tutarı *</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="flex-1 min-w-0 bg-white border-2 border-indigo-400 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                        placeholder="3.500"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(formatThousandsInput(e.target.value))}
                      />
                      <span className="px-2 py-1.5 bg-slate-200 text-slate-900 rounded-lg text-xs font-black shrink-0">
                        {saleCurrency}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Kalan Bakiye Bilgisi */}
                <div className="p-2 bg-white border border-amber-300 rounded-lg flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="font-black text-slate-700">Geriye Kalan Tutar (Otomatik):</span>
                  <span className="font-black text-indigo-950">
                    {formatSaleContractAmount(computedRemainingSaleRaw || "0", saleCurrency, false)}
                  </span>
                </div>

                {/* Ödeme Şekli & Görülme Tarihi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Ödeme Şekli</label>
                    <input
                      type="text"
                      className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                      placeholder="Tapu devrinde hepsi ödenecektir."
                      value={salesPaymentTerms}
                      onChange={(e) => setSalesPaymentTerms(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Taşınmazı Görme Tarihi</label>
                    <input
                      type="date"
                      className="w-full bg-white border-2 border-slate-300 px-2 py-1.5 rounded-lg text-xs font-black text-slate-950"
                      value={viewingDate}
                      onChange={(e) => setViewingDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Şahitler */}
                <div className="space-y-1 pt-1 border-t border-amber-200">
                  <label className="text-[10px] font-black text-slate-900">Şahitler (Ad Soyad / Kimlik)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="bg-white border border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                      placeholder="1. Şahit Ad Soyad"
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
                      placeholder="2. Şahit Ad Soyad"
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

            {/* EMANET SÖZLEŞMESİ (escrow_deposit_agreement) Özel Değişkenleri */}
            {selectedTemplateId === "escrow_deposit_agreement" && (
              <div className="p-3 bg-amber-50/80 border-2 border-amber-300 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-950">
                    3. -Emanet Sözleşmesi- Değişkenleri
                  </span>
                  <span className="text-[9px] font-black bg-slate-900 text-amber-400 px-2 py-0.5 rounded uppercase">
                    Alıcı ➔ Emanetçi
                  </span>
                </div>

                {/* Satış Bedeli & Kapora */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Peşin Satış Bedeli *</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="flex-1 min-w-0 bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                        placeholder="38.500"
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
                    <label className="text-[10px] font-black text-slate-900">Emanet Verilen Kapora *</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="flex-1 min-w-0 bg-white border-2 border-indigo-400 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                        placeholder="3.500"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(formatThousandsInput(e.target.value))}
                      />
                      <span className="px-2 py-1.5 bg-slate-200 text-slate-900 rounded-lg text-xs font-black shrink-0">
                        {saleCurrency}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Kalan Bakiye Bilgisi */}
                <div className="p-2 bg-white border border-amber-300 rounded-lg flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="font-black text-slate-700">Kalan Bakiye (Otomatik):</span>
                  <span className="font-black text-indigo-950">
                    {formatSaleContractAmount(computedRemainingSaleRaw || "0", saleCurrency, false)}
                  </span>
                </div>

                {/* Emanet / Devir Süresi */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-900">
                    Tapu Devir & Kalan Ödeme Süresi (Gün - Madde 5)
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                    placeholder="15"
                    value={escrowDeadlineDays}
                    onChange={(e) => setEscrowDeadlineDays(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-500">
                    Sözleşme metninde &ldquo;en geç tapu devrinde (ortalama {escrowDeadlineDays || "15"} gün içerisinde)&rdquo; olarak geçer.
                  </p>
                </div>
              </div>
            )}

            {/* GAYRİMENKUL KAPORA ANLAŞMASI (property_reservation_deposit) Özel Değişkenleri */}
            {selectedTemplateId === "property_reservation_deposit" && (
              <div className="p-3 bg-amber-50/80 border-2 border-amber-300 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-950">
                    3. Gayrimenkul Kapora Anlaşması Değişkenleri (2 Katı Cayma Cezalı)
                  </span>
                  <span className="text-[9px] font-black bg-slate-900 text-amber-400 px-2 py-0.5 rounded uppercase">
                    Alıcı ➔ Satıcı
                  </span>
                </div>

                {/* Satış Bedeli & Kapora Tutarı */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Satış Bedeli *</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="flex-1 min-w-0 bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                        placeholder="38.500"
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
                    <label className="text-[10px] font-black text-slate-900">Alınan Kapora Miktarı *</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="flex-1 min-w-0 bg-white border-2 border-indigo-400 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                        placeholder="3.500"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(formatThousandsInput(e.target.value))}
                      />
                      <span className="px-2 py-1.5 bg-slate-200 text-slate-900 rounded-lg text-xs font-black shrink-0">
                        {saleCurrency}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Kalan Bakiye Bilgisi */}
                <div className="p-2 bg-white border border-amber-300 rounded-lg flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="font-black text-slate-700">Geriye Kalan Tutar (Otomatik):</span>
                  <span className="font-black text-indigo-950">
                    {formatSaleContractAmount(computedRemainingSaleRaw || "0", saleCurrency, false)}
                  </span>
                </div>

                {/* Rezervasyon Gün Sayısı */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-900">Rezervasyon Süresi (Gün - Madde 1)</label>
                  <input
                    type="text"
                    className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                    placeholder="15 (on beş)"
                    value={reservationDays}
                    onChange={(e) => setReservationDays(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-500">
                    Örn: &ldquo;15 (on beş)&rdquo; veya &ldquo;21 (yirmi bir)&rdquo; gün
                  </p>
                </div>

                {/* Şahitler */}
                <div className="space-y-1 pt-1 border-t border-amber-200">
                  <label className="text-[10px] font-black text-slate-900">Şahitler (Ad Soyad / Kimlik)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="bg-white border border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                      placeholder="1. Şahit Ad Soyad"
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
                      placeholder="2. Şahit Ad Soyad"
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

            {(selectedTemplateId === "rental_authorization" ||
              selectedTemplateId === "exclusivity_agreement" ||
              selectedTemplateId === "sales_authorization") && (
              <div className="p-3 bg-emerald-50/80 border-2 border-emerald-300 rounded-xl space-y-2.5 mt-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-950">
                    {selectedTemplateId === "exclusivity_agreement"
                      ? "2 & 3. Kiralık Gayrimenkul Tek Yetkili Kiralama Bilgileri"
                      : selectedTemplateId === "sales_authorization"
                      ? "2 & 3. Satılık Gayrimenkul Yetkili Satış Sözleşmesi (Hizmet Bedeli Eklenerek)"
                      : "3. Sözleşmenin Konusu (Taşınmazın Adresi & Cinsi) ve Yetki Şartları"}
                  </span>
                  <span className="text-[9px] font-black bg-slate-900 text-emerald-400 px-2 py-0.5 rounded uppercase shrink-0">
                    Mülk Adresi Esaslı
                  </span>
                </div>

                {/* Taşınmazın Açık Adresi */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-900">
                    {selectedTemplateId === "rental_authorization"
                      ? "Taşınmazın Açık Adresi * (İlan açıklaması değil, mülkün gerçek adresi)"
                      : "2- Gayrimenkulün Adresi * (İlan açıklaması değil, mülkün gerçek adresi)"}
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-emerald-600"
                    placeholder="Örn: Ortaköy Mah. Şehit Gazeteci Hasan Tahsin Cad. No:14 Lefkoşa / KKTC"
                    value={rentalAddress}
                    onChange={(e) => setRentalAddress(e.target.value)}
                  />
                </div>

                {/* Kiralık Tek Yetki Sözleşmesi ise: ÇEŞİT Seçimi (EV, APT.DAİRESİ, BİNA, DEPO, BÜRO, DÜKKAN, DİĞER) */}
                {selectedTemplateId === "exclusivity_agreement" ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-900">
                          2- Gayrimenkulün Çeşidi *
                        </label>
                        <select
                          className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-emerald-600"
                          value={authPropertyCategory}
                          onChange={(e) => setAuthPropertyCategory(e.target.value)}
                        >
                          <option value="EV">EV</option>
                          <option value="APT.DAİRESİ">APT.DAİRESİ</option>
                          <option value="BİNA">BİNA</option>
                          <option value="DEPO">DEPO</option>
                          <option value="BÜRO">BÜRO</option>
                          <option value="DÜKKAN">DÜKKAN</option>
                          <option value="DİĞER">DİĞER</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-900">
                          Diğer / Oda & Detay Açıklaması
                        </label>
                        <input
                          type="text"
                          className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950 focus:outline-none focus:border-emerald-600"
                          placeholder="Örn: 3+1 Eşyalı Daire / İkiz Villa"
                          value={authPropertyCategoryOther}
                          onChange={(e) => setAuthPropertyCategoryOther(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-900">
                          1- Gayrimenkul Sahibinin Adresi
                        </label>
                        <input
                          type="text"
                          className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950 focus:outline-none focus:border-emerald-600"
                          placeholder="Mülk sahibinin ikamet / tebligat adresi..."
                          value={clientAddress}
                          onChange={(e) => setClientAddress(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-900">
                          Komisyoncu Adresi & K/P/MŞ No
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            className="flex-1 min-w-0 bg-white border-2 border-slate-300 px-2 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                            placeholder="Komisyoncu Adresi"
                            value={brokerAddress}
                            onChange={(e) => setBrokerAddress(e.target.value)}
                          />
                          <input
                            type="text"
                            className="w-24 bg-white border-2 border-slate-300 px-2 py-1.5 rounded-lg text-xs font-black text-slate-950 shrink-0"
                            placeholder="K/P/MŞ No"
                            value={authorizedPersonIdentity}
                            onChange={(e) => setAuthorizedPersonIdentity(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 3- İşlem Bilgileri (Minimum kira bedeli, Ödeme şekli, Depozit, Hizmet bedeli ödeyen/alan, Gösterim zamanı) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1.5 border-t border-emerald-300">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-900">3- Minimum Kira Bedeli (/ ay) *</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            className="flex-1 min-w-0 bg-white border-2 border-slate-300 px-2 py-1.5 rounded-lg text-xs font-black text-slate-950"
                            placeholder="25.000"
                            value={rentPriceInput}
                            onChange={(e) => setRentPriceInput(formatThousandsInput(e.target.value))}
                          />
                          <select
                            className="w-18 bg-slate-900 text-white border-2 border-slate-900 px-1 py-1.5 rounded-lg text-xs font-black shrink-0"
                            value={rentCurrency}
                            onChange={(e) => setRentCurrency(e.target.value)}
                          >
                            <option value="GBP">GBP</option>
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                            <option value="TL">TL</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-900">3- Ödeme Şekli</label>
                        <input
                          type="text"
                          className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                          placeholder="Örn: Aylık Peşin / 6 Aylık Peşin"
                          value={rentPaymentMethod}
                          onChange={(e) => setRentPaymentMethod(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-900">3- Depozit</label>
                        <input
                          type="text"
                          className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                          placeholder="Örn: 2 Kira Depozito"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Hizmet bedeli kim tarafından kime ödenecek */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-900">
                          3- Hizmet Bedelini Ödeyecek Taraf (... tarafından)
                        </label>
                        <input
                          type="text"
                          className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                          placeholder="Örn: Kiraya Veren / Mülk Sahibi Adı"
                          value={authServiceFeePayer}
                          onChange={(e) => setAuthServiceFeePayer(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-900">
                          3- Hizmet Bedelini Alacak Komisyoncu (...&apos;a ödenecektir)
                        </label>
                        <input
                          type="text"
                          className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                          placeholder="Örn: Rodel Investment - Emrah CEYHAN"
                          value={authServiceFeeReceiver}
                          onChange={(e) => setAuthServiceFeeReceiver(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* GÖSTERİM ZAMANI & 5- Yetki Süresi (Gün) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-900">3- Gösterim Zamanı</label>
                        <select
                          className="w-full bg-white border-2 border-slate-300 px-2 py-1.5 rounded-lg text-xs font-black text-slate-950"
                          value={authShowingDayType}
                          onChange={(e) => setAuthShowingDayType(e.target.value)}
                        >
                          <option value="TÜMÜ">TÜMÜ (Hafta İçi + Sonu)</option>
                          <option value="HAFTA İÇİ">HAFTA İÇİ</option>
                          <option value="HAFTA SONU">HAFTA SONU</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-900">Gösterim Saatleri (SAAT)</label>
                        <input
                          type="text"
                          className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                          placeholder="Örn: 09:00 - 18:00"
                          value={authShowingHours}
                          onChange={(e) => setAuthShowingHours(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-900">5- Yetki Süresi (Gün)</label>
                        <input
                          type="text"
                          className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                          placeholder="Örn: 90 (Doksan)"
                          value={authDurationDays}
                          onChange={(e) => setAuthDurationDays(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Şahitler (1. ve 2. Şahit) */}
                    <div className="pt-1.5 border-t border-emerald-300 space-y-1.5">
                      <span className="text-[10px] font-black text-slate-900 uppercase">Şahitler (İmza Altı)</span>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          className="bg-white border border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                          placeholder="1. Şahit Ad Soyad"
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
                ) : selectedTemplateId === "rental_authorization" ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-900">
                          Taşınmazın Cinsi ve Özellikleri *
                        </label>
                        <input
                          type="text"
                          className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-emerald-600"
                          placeholder="Örn: 3+1 Eşyalı Daire / Müstakil Villa / Arsa"
                          value={authPropertyTypeFeatures}
                          onChange={(e) => setAuthPropertyTypeFeatures(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-900">
                          Kiraya Veren Adresi
                        </label>
                        <input
                          type="text"
                          className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950 focus:outline-none focus:border-emerald-600"
                          placeholder="Mülk sahibinin tebligat / ikamet adresi..."
                          value={clientAddress}
                          onChange={(e) => setClientAddress(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Emlak Komisyoncusu (Tellal) Kimlik & Adres Bilgileri */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] font-black text-slate-900">
                          Emlak Komisyoncusu (Tellal) Adresi
                        </label>
                        <input
                          type="text"
                          className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                          placeholder="Atatürk Caddesi No: 81/A Küçük Kaymaklı / Lefkoşa"
                          value={brokerAddress}
                          onChange={(e) => setBrokerAddress(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-900">
                          Tellal K / P / MŞ No
                        </label>
                        <input
                          type="text"
                          className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                          placeholder="1170237140"
                          value={authorizedPersonIdentity}
                          onChange={(e) => setAuthorizedPersonIdentity(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Kiralama Yetki Belgesi Şartları (A: a, b, c, d & B, C, J) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5 border-t border-emerald-300">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-900">a) Talep Edilen Kira Bedeli *</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            className="flex-1 min-w-0 bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                            placeholder="25.000"
                            value={rentPriceInput}
                            onChange={(e) => setRentPriceInput(formatThousandsInput(e.target.value))}
                          />
                          <select
                            className="w-20 bg-slate-900 text-white border-2 border-slate-900 px-1.5 py-1.5 rounded-lg text-xs font-black shrink-0"
                            value={rentCurrency}
                            onChange={(e) => setRentCurrency(e.target.value)}
                          >
                            <option value="GBP">GBP</option>
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                            <option value="TL">TL</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-900">b) Güvence Bedeli (Depozito)</label>
                        <input
                          type="text"
                          className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                          placeholder="Örn: 2 Aylık Kira Bedeli veya 1.000 GBP"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-900">c) Peşinat Şartı</label>
                        <input
                          type="text"
                          className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                          placeholder="Örn: 1 Aylık Kira Peşin / 6 Aylık Peşin"
                          value={authAdvancePayment}
                          onChange={(e) => setAuthAdvancePayment(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-900">d) Yıllık Artış Oranı</label>
                        <input
                          type="text"
                          className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                          placeholder="Örn: %10 veya TÜFE Oranında"
                          value={authAnnualIncreaseRate}
                          onChange={(e) => setAuthAnnualIncreaseRate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-900">
                        B) Kiracı Adayında Aranılacak Başlıca Özellikler
                      </label>
                      <input
                        type="text"
                        className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                        placeholder="Örn: Düzenli gelir sahibi, kurumsal çalışan veya aile"
                        value={authTenantCriteria}
                        onChange={(e) => setAuthTenantCriteria(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-900">C) Sözleşme Süresi (Ay)</label>
                        <input
                          type="text"
                          className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                          placeholder="Örn: 6 (Altı)"
                          value={contractDuration}
                          onChange={(e) => setContractDuration(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-900">J) Düzenlenen Nüsha Sayısı</label>
                        <input
                          type="text"
                          className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                          placeholder="Örn: 2 (İki)"
                          value={authCopiesCount}
                          onChange={(e) => setAuthCopiesCount(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    {/* SATILIK GAYRİMENKUL YETKİLİ SATIŞ SÖZLEŞMESİ (HİZMET BEDELİ EKLENEREK) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-900">
                          2- Gayrimenkulün Çeşidi *
                        </label>
                        <select
                          className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950 focus:outline-none focus:border-emerald-600"
                          value={authPropertyCategory}
                          onChange={(e) => setAuthPropertyCategory(e.target.value)}
                        >
                          <option value="EV">EV</option>
                          <option value="APT.DAİRESİ">APT.DAİRESİ</option>
                          <option value="BİNA">BİNA</option>
                          <option value="DEPO">DEPO</option>
                          <option value="BÜRO">BÜRO</option>
                          <option value="DÜKKAN">DÜKKAN</option>
                          <option value="DİĞER">DİĞER</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-900">
                          Diğer / Oda & Detay Açıklaması
                        </label>
                        <input
                          type="text"
                          className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950 focus:outline-none focus:border-emerald-600"
                          placeholder="Örn: 3+1 Daire / Müstakil Villa / Arsa"
                          value={authPropertyCategoryOther}
                          onChange={(e) => setAuthPropertyCategoryOther(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* 2- Koçan Bilgileri: Koçan no, Kaza, Mahalle, Ada, Pafta/Harita, Parsel */}
                    <div className="grid grid-cols-3 gap-1.5">
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
                        <label className="text-[10px] font-black text-slate-900">Kaza</label>
                        <input
                          type="text"
                          className="w-full bg-white border border-slate-300 px-2 py-1 rounded-lg text-xs font-bold text-slate-950"
                          placeholder="Örn: Girne"
                          value={rentalDistrict}
                          onChange={(e) => setRentalDistrict(e.target.value)}
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-black text-slate-900">Mahalle</label>
                        <input
                          type="text"
                          className="w-full bg-white border border-slate-300 px-2 py-1 rounded-lg text-xs font-bold text-slate-950"
                          placeholder="Örn: Karakum"
                          value={rentalTownVillage}
                          onChange={(e) => setRentalTownVillage(e.target.value)}
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-black text-slate-900">Ada</label>
                        <input
                          type="text"
                          className="w-full bg-white border border-slate-300 px-2 py-1 rounded-lg text-xs font-bold text-slate-950"
                          placeholder="Ada"
                          value={adaNo}
                          onChange={(e) => setAdaNo(e.target.value)}
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

                    {/* 1- Gayrimenkul Sahibinin Adresi & Komisyoncu Bilgileri */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-900">
                          1- Gayrimenkul Sahibinin Adresi
                        </label>
                        <input
                          type="text"
                          className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950 focus:outline-none focus:border-emerald-600"
                          placeholder="Mülk sahibinin ikamet / tebligat adresi..."
                          value={clientAddress}
                          onChange={(e) => setClientAddress(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-900">
                          Komisyoncu Adresi & P./K./MŞ. No
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            className="flex-1 min-w-0 bg-white border-2 border-slate-300 px-2 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                            placeholder="Komisyoncu Adresi"
                            value={brokerAddress}
                            onChange={(e) => setBrokerAddress(e.target.value)}
                          />
                          <input
                            type="text"
                            className="w-24 bg-white border-2 border-slate-300 px-2 py-1.5 rounded-lg text-xs font-black text-slate-950 shrink-0"
                            placeholder="P./K./MŞ. No"
                            value={authorizedPersonIdentity}
                            onChange={(e) => setAuthorizedPersonIdentity(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 3- İşlem Bilgileri (Gayrimenkulün minimum satış bedeli) & 5- Yetki Süresi (Gün) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5 border-t border-emerald-300">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-900">
                          3- Gayrimenkulün Minimum Satış Bedeli *
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            className="flex-1 min-w-0 bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                            placeholder="125.000"
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
                        <label className="text-[10px] font-black text-slate-900">5- Yetki Süresi (Gün)</label>
                        <input
                          type="text"
                          className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                          placeholder="Örn: 90 (Doksan)"
                          value={authDurationDays}
                          onChange={(e) => setAuthDurationDays(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Şahitler (1. ve 2. Şahit) */}
                    <div className="pt-1.5 border-t border-emerald-300 space-y-1.5">
                      <span className="text-[10px] font-black text-slate-900 uppercase">Şahitler (İmza Altı)</span>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          className="bg-white border border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                          placeholder="1. Şahit Ad Soyad"
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

            {selectedTemplateId === "rental_deposit_agreement" && (
              <div className="space-y-2.5 mt-1 p-3 bg-amber-50/80 border-2 border-amber-300 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-950">
                    3. Kapora Sözleşmesi Detayları & Hesaplama
                  </span>
                  <span className="text-[9px] font-black bg-slate-900 text-amber-400 px-2 py-0.5 rounded uppercase">
                    Kiralık Rezervasyon • KKTC
                  </span>
                </div>

                {/* Varsa 2. ve 3. Kiracı Bilgileri */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">
                      Varsa 2. Kiracı (Ad Soyad & Pasaport/Kimlik)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                      placeholder="Örn: RADMAN ARZANI (PASAPORT NO: B97439253)"
                      value={kaporaTenant2Info}
                      onChange={(e) => setKaporaTenant2Info(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">
                      Varsa 3. Kiracı (Ad Soyad & Pasaport/Kimlik)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                      placeholder="Örn: NAIMA RAJABOVA (PASAPORT NO: 405143945)"
                      value={kaporaTenant3Info}
                      onChange={(e) => setKaporaTenant3Info(e.target.value)}
                    />
                  </div>
                </div>

                {/* Emlak Komisyoncusu (Aracı) Bilgileri */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-amber-300">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-900">
                      Emlak Komisyoncusu (Ünvan & Yetkili Ad Soyad)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                      placeholder="Rodel Investment - EMRAH CEYHAN"
                      value={agentAndCompany}
                      onChange={(e) => {
                        setAgentAndCompany(e.target.value);
                        setOwnerName(e.target.value);
                        setSellerSigningName(e.target.value);
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">KKTC Kimlik / MŞ No</label>
                    <input
                      type="text"
                      className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                      placeholder="1170237140"
                      value={authorizedPersonIdentity}
                      onChange={(e) => {
                        setAuthorizedPersonIdentity(e.target.value);
                        setSellerIdentity(e.target.value);
                      }}
                    />
                  </div>
                </div>

                {/* Malın Tanımı, Adres ve Görülme Tarihi */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-amber-300">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-900">
                      Malın Tanımı (Örn: 3+1 Eşyalı Daire / 2+1 Daire) *
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                      placeholder="Örn: 3+1 Eşyalı Daire"
                      value={rentalPropertyDef}
                      onChange={(e) => setRentalPropertyDef(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Görülme Tarihi</label>
                    <input
                      type="date"
                      className="w-full bg-white border-2 border-slate-300 px-2 py-1.5 rounded-lg text-xs font-black text-slate-950"
                      value={viewingDate}
                      onChange={(e) => setViewingDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-900">Taşınmazın Açık Adresi *</label>
                  <input
                    type="text"
                    className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                    placeholder="Örn: Altınova Sokak No: 3 Dilek Yılmaz Apt. Daire No: 3 Kızılbaş / Lefkoşa"
                    value={rentalAddress}
                    onChange={(e) => setRentalAddress(e.target.value)}
                  />
                </div>

                {/* Aylık Kira Bedeli, Ödeme Şekli ve Dönemlik Kira Toplamı */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-amber-300">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Aylık Kira Bedeli *</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="flex-1 min-w-0 bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                        placeholder="550"
                        value={rentPriceInput}
                        onChange={(e) => setRentPriceInput(formatThousandsInput(e.target.value))}
                      />
                      <select
                        className="w-18 bg-slate-900 text-white border-2 border-slate-900 px-1 py-1.5 rounded-lg text-xs font-black shrink-0"
                        value={rentCurrency}
                        onChange={(e) => setRentCurrency(e.target.value)}
                      >
                        <option value="GBP">GBP</option>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                        <option value="TL">TL</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Ödeme Şekli</label>
                    <select
                      className="w-full bg-white border-2 border-slate-300 px-2 py-1.5 rounded-lg text-xs font-black text-slate-950"
                      value={rentPaymentMethod}
                      onChange={(e) => setRentPaymentMethod(e.target.value)}
                    >
                      <option value="1 Yıl Peşin Ödemeli">1 Yıl Peşin Ödemeli (12 Ay)</option>
                      <option value="6 Ay Peşin Ödemeli">6 Ay Peşin Ödemeli</option>
                      <option value="3 Ay Peşin Ödemeli">3 Ay Peşin Ödemeli</option>
                      <option value="Aylık Ödemeli">Aylık Ödemeli</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Dönem Kira Toplamı (Opsiyonel)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                      placeholder="Boşsa otomatik (Örn: 6.600)"
                      value={kaporaTotalRentAmount}
                      onChange={(e) => setKaporaTotalRentAmount(formatThousandsInput(e.target.value))}
                    />
                  </div>
                </div>

                {/* Depozit, Komisyon ve Aidat */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Depozit Bedeli</label>
                    <input
                      type="text"
                      className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                      placeholder="Örn: 2 Kira Bedeli veya 1.100"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Komisyon (Hizmet Bedeli)</label>
                    <input
                      type="text"
                      className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                      placeholder="Örn: 1 Kira Bedeli veya 550"
                      value={kaporaCommissionAmount}
                      onChange={(e) => setKaporaCommissionAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">Aidat Bilgisi</label>
                    <input
                      type="text"
                      className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                      placeholder="Örn: Aylık 300 TL veya 15.000 TL 1 Yıllık"
                      value={kaporaDuesAmount}
                      onChange={(e) => setKaporaDuesAmount(e.target.value)}
                    />
                  </div>
                </div>

                {/* Bugün Alınan Kapora ve Kalan Bakiye */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-amber-300">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">
                      Bugün Alınan Kapora Tutarı ({rentCurrency}) *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="w-full bg-white border-2 border-indigo-400 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                      placeholder="Örn: 1.100 veya 800"
                      value={kaporaPaidAmount}
                      onChange={(e) => setKaporaPaidAmount(formatThousandsInput(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">
                      Geriye Kalan Bakiye (Boşsa Otomatik Hesaplanır)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="w-full bg-white border-2 border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-950"
                      placeholder="Otomatik (Toplam - Kapora)"
                      value={kaporaRemainingBalance}
                      onChange={(e) => setKaporaRemainingBalance(formatThousandsInput(e.target.value))}
                    />
                  </div>
                </div>

                {/* Rezervasyon / Bakiye Son Ödeme Tarihi ve Kira Başlangıç Tarihi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">
                      Bakiye Son Ödeme & Rezervasyon Bitiş Tarihi *
                    </label>
                    <input
                      type="date"
                      className="w-full bg-white border-2 border-slate-300 px-2 py-1.5 rounded-lg text-xs font-black text-slate-950"
                      value={kaporaBalanceDueDate}
                      onChange={(e) => setKaporaBalanceDueDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-900">
                      Kira Sözleşme Başlangıç Tarihi *
                    </label>
                    <input
                      type="date"
                      className="w-full bg-white border-2 border-slate-300 px-2 py-1.5 rounded-lg text-xs font-black text-slate-950"
                      value={rentStartDate}
                      onChange={(e) => setRentStartDate(e.target.value)}
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
                    {isBilateralContract
                      ? `Sıralı Çift Dijital İmza (1. ${firstSignerLabel} ➔ 2. ${secondSignerLabel})`
                      : "Dijital İmza"}
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
                    ? `1/2 ${firstSignerLabel.toUpperCase()} İMZALADI`
                    : "İMZA BEKLİYOR"}
                </span>
              </div>

              {/* STEP 1: 1ST PRIORITY SIGNATURE (Mülk Sahibi for owner auth; Alıcı/Kiracı otherwise) */}
              <div className="p-2.5 bg-slate-50 border-2 border-indigo-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-indigo-950">
                    1. Adım (İmza Önceliği): {firstSignerLabel} İmzası
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
                      <img src={signatureImage} alt={`${firstSignerLabel} İmzası`} className="h-8 bg-white px-1.5 py-0.5 rounded border border-emerald-300" />
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-700">İmzalayan: {clientName || firstSignerLabel}</span>
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
                            1. ÖNCELİK: {firstSignerLabel.toUpperCase()} BURAYA İMZALAR
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!clientName.trim()) {
                            return alert(`Lütfen önce ${firstSignerLabel} Adı Soyadı bilgisini giriniz!`);
                          }
                          const canvas = canvasRef.current;
                          if (!canvas || !isSigningActive) {
                            return alert(`Lütfen ${firstSignerLabel} imza kutusuna imza çiziniz!`);
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
                        1. {firstSignerLabel} İmzasını Onayla
                      </button>
                      <button
                        type="button"
                        onClick={handleShareBuyerWhatsApp}
                        className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" /> {isOwnerAuthContract ? "Mülk Sahibine Gönder (WA)" : "Alıcıya Gönder (WA)"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 2: 2ND SIGNATURE (İşletme Yetkilisi for owner auth; Satıcı/Kiraya Veren otherwise - UNLOCKED ONLY AFTER 1ST SIGNER SIGNS) */}
              {isBilateralContract && (
                <div className={`p-2.5 rounded-xl border-2 space-y-2 transition-all ${
                  signed ? "bg-amber-50/70 border-amber-400" : "bg-slate-100 border-slate-300 opacity-75"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-900">
                      2. Adım (Final Onay): {secondSignerLabel} İmzası
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
                      İmza önceliği <strong>{firstSignerLabel}</strong> tarafındadır. {firstSignerLabel} imzaladıktan sonra {secondSignerLabel} imzası aktifleşir.
                    </div>
                  ) : sellerSigned ? (
                    <div className="bg-emerald-100 border border-emerald-500 p-2 rounded-lg flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950">
                        <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>2. {secondSignerLabel} İmzası Tamam ({sellerSigningName || placeholderValues.ownerName})</span>
                      </div>
                      {sellerSignatureImage && (
                        <img src={sellerSignatureImage} alt={`${secondSignerLabel} İmzası`} className="h-8 bg-white px-1.5 py-0.5 rounded border border-emerald-400" />
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-800">
                          {secondSignerLabel}: {placeholderValues.ownerName}
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
                              2. FİNAL ONAY: {secondSignerLabel.toUpperCase()} BURAYA İMZALAR
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
                              return alert(`Lütfen ${secondSignerLabel} imza kutusuna imza çiziniz!`);
                            }
                            const sDataUrl = sCanvas.toDataURL("image/png");
                            const resolvedSName = (ownerName || placeholderValues.ownerName || secondSignerLabel).trim();
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
                          2. {secondSignerLabel} İmzasını Onayla (Finalle)
                        </button>
                        <button
                          type="button"
                          onClick={handleShareSellerWhatsApp}
                          className="py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 text-[11px] font-black uppercase rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" /> {isOwnerAuthContract ? "Yetkiliye Gönder (WA)" : "Satıcıya Gönder (WA)"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* FINALIZED CONTRACT DELIVERY TO BOTH PARTIES */}
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
                      <Share2 className="w-3.5 h-3.5" /> Son Halini {isOwnerAuthContract ? "Mülk Sahibine" : "Alıcıya"} İlet
                    </button>
                    {isBilateralContract && (
                      <button
                        type="button"
                        onClick={() => handleSendFinalizedWhatsApp("seller")}
                        className="py-2 px-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Send className="w-3.5 h-3.5" /> Son Halini {isOwnerAuthContract ? "Yetkiliye" : "Satıcıya"} İlet
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
        <div className={`w-full flex-1 min-w-0 min-h-0 h-full bg-white flex-col justify-between overflow-hidden ${
          activeMobileTab === 'preview' ? 'flex' : 'hidden md:flex'
        }`}>
          
          {/* Top action bar */}
          <div className="px-3 py-2.5 sm:px-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2.5 py-1.5 rounded-xl border border-indigo-200 text-xs font-black shrink-0">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span className="hidden xl:inline text-[11px] uppercase tracking-tight">Canlı Sözleşme</span>
            </div>

            <div className="flex items-center justify-end gap-1.5 flex-wrap min-w-0">
              {onSaveContract && (
                <button 
                  onClick={handleSaveContract}
                  disabled={saving}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer shadow-xs active:scale-95"
                  title="Sisteme Kaydet"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-black">{saving ? "..." : "Kaydet"}</span>
                </button>
              )}
              <button 
                onClick={handlePrint}
                className="px-2.5 py-1.5 bg-white text-slate-900 border-2 border-slate-300 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1.5 text-xs font-black shrink-0 cursor-pointer active:scale-95"
                title="Yazdır / PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="text-[11px]">Yazdır / PDF</span>
              </button>
              <button 
                onClick={handleShareBuyerWhatsApp}
                className="px-2.5 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-all flex items-center gap-1.5 text-xs font-black shrink-0 cursor-pointer active:scale-95"
                title={`1. Öncelik: ${firstSignerLabel} İmza İçin Gönder`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="text-[11px]">1. {isOwnerAuthContract ? "Mülk Sahibi İmza" : "Alıcıya İmza"}</span>
              </button>
              {isBilateralContract && (
                <button 
                  onClick={handleShareSellerWhatsApp}
                  className={`px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-black shrink-0 cursor-pointer active:scale-95 ${
                    signed
                      ? "bg-amber-400 text-slate-950 hover:bg-amber-500"
                      : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                  }`}
                  title={`2. Adım: ${secondSignerLabel} Final İmza İçin Gönder`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="text-[11px]">2. {isOwnerAuthContract ? "Yetkili İmza" : "Satıcıya İmza"}</span>
                </button>
              )}
              {signed && (!isBilateralContract || sellerSigned) && (
                <>
                  <button
                    onClick={() => handleSendFinalizedWhatsApp("buyer")}
                    className="px-2.5 py-1.5 bg-slate-900 text-emerald-400 hover:bg-slate-800 rounded-xl transition-all flex items-center gap-1 text-[11px] font-black shrink-0 cursor-pointer"
                    title={`Son Halini ${firstSignerLabel} Tarafına İlet`}
                  >
                    <span>Final ➔ {firstSignerLabel}</span>
                  </button>
                  {isBilateralContract && (
                    <button
                      onClick={() => handleSendFinalizedWhatsApp("seller")}
                      className="px-2.5 py-1.5 bg-slate-900 text-amber-400 hover:bg-slate-800 rounded-xl transition-all flex items-center gap-1 text-[11px] font-black shrink-0 cursor-pointer"
                      title={`Son Halini ${secondSignerLabel} Tarafına İlet`}
                    >
                      <span>Final ➔ {secondSignerLabel}</span>
                    </button>
                  )}
                </>
              )}
            </div>

            <button 
              onClick={onClose}
              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border-2 border-rose-200 rounded-xl transition-all shrink-0 cursor-pointer active:scale-95 ml-1 z-10"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* RENDERED CONTENT */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 md:p-8 bg-slate-100/50">
            <div className="bg-white shadow-lg rounded-3xl border border-slate-200/80 overflow-hidden mx-auto max-w-3xl">
              <div dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
