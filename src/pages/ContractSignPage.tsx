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
  Printer,
  Share2,
  X
} from "lucide-react";
import {
  contractTemplates,
  resolvePropertyRegionLabel,
  computeRemainingSaleAmount,
  buildDefaultSalePropertyDetails,
  buildDefaultRentalPropertyMeta,
  buildDefaultShowingPropertyDetails,
  resolvePropertyFeatureHighlight,
  resolveOfficialPropertyTitle
} from "../utils/contractTemplates";
import { formatPhoneForWhatsApp, formatDateTR } from "../utils/formatUtils";

export default function ContractSignPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  
  const docIdParam = searchParams.get("docId") || "";
  const roleParam = (searchParams.get("role") || "buyer") as "buyer" | "seller";
  const viewParam = searchParams.get("view") || "sign";

  const clientNameParam = searchParams.get("client") || "";
  const clientPhoneParam = searchParams.get("phone") || "";
  const clientIdentityParam = searchParams.get("identity") || "";
  const buyerIdTypeParam = searchParams.get("buyerIdType") || "KKTC KİMLİK";
  const ownerNameParam = searchParams.get("ownerName") || "";
  const ownerPhoneParam = searchParams.get("ownerPhone") || "";
  const sellerIdentityParam = searchParams.get("sellerIdentity") || "";
  const sellerIdTypeParam = searchParams.get("sellerIdType") || "KKTC Kimlik Kartı";

  const templateIdParam = searchParams.get("templateId") || "";
  const contractTypeParam = searchParams.get("contractType") || "";
  const commissionRateParam = searchParams.get("commissionRate") || "5";
  const contractDateParam = formatDateTR(searchParams.get("contractDate") || new Date());
  const splitRatioParam = searchParams.get("splitRatio") || "";
  const contractDurationParam = searchParams.get("contractDuration") || "";
  const evictionDateParam = searchParams.get("evictionDate") || "";
  const depositAmountParam = searchParams.get("depositAmount") || "";
  const rentDurationParam = searchParams.get("rentDuration") || "";
  const paymentDayParam = searchParams.get("paymentDay") || "";
  const partnerIdParam = searchParams.get("partnerId") || "";

  // Rental Contract (KİRA SÖZLEŞMESİ) & Authorization params
  const exclusivityIntentParam = searchParams.get("exclusivityIntent") || "";
  const authPropertyCategoryParam = searchParams.get("authPropertyCategory") || "";
  const authPropertyCategoryOtherParam = searchParams.get("authPropertyCategoryOther") || "";
  const authServiceFeePayerParam = searchParams.get("authServiceFeePayer") || "";
  const authServiceFeeReceiverParam = searchParams.get("authServiceFeeReceiver") || "";
  const authShowingDayTypeParam = searchParams.get("authShowingDayType") || "";
  const authShowingHoursParam = searchParams.get("authShowingHours") || "";
  const authDurationDaysParam = searchParams.get("authDurationDays") || "";
  const rentalPropertyDefParam = searchParams.get("rentalPropertyDef") || "";
  const authPropertyTypeFeaturesParam = searchParams.get("authPropertyTypeFeatures") || "";
  const authAdvancePaymentParam = searchParams.get("authAdvancePayment") || "";
  const authAnnualIncreaseRateParam = searchParams.get("authAnnualIncreaseRate") || "";
  const authTenantCriteriaParam = searchParams.get("authTenantCriteria") || "";
  const authCopiesCountParam = searchParams.get("authCopiesCount") || "";
  const rentalUsagePurposeParam = searchParams.get("rentalUsagePurpose") || "";
  const rentalAddressParam = searchParams.get("rentalAddress") || "";
  const rentalDistrictParam = searchParams.get("rentalDistrict") || "";
  const rentalTownVillageParam = searchParams.get("rentalTownVillage") || "";
  const kocanNoParam = searchParams.get("kocanNo") || "";
  const paftaNoParam = searchParams.get("paftaNo") || "";
  const adaNoParam = searchParams.get("adaNo") || "";
  const parselNoParam = searchParams.get("parselNo") || "";
  const rentPriceRawParam = searchParams.get("rentPriceRaw") || "";
  const rentCurrencyParam = searchParams.get("rentCurrency") || "";
  const rentPaymentMethodParam = searchParams.get("rentPaymentMethod") || "";
  const rentStartDateParam = searchParams.get("rentStartDate") || "";
  const rentEndDateParam = searchParams.get("rentEndDate") || "";
  const kaporaTenant2InfoParam = searchParams.get("kaporaTenant2Info") || "";
  const kaporaTenant3InfoParam = searchParams.get("kaporaTenant3Info") || "";
  const kaporaTotalRentAmountParam = searchParams.get("kaporaTotalRentAmount") || "";
  const kaporaDuesAmountParam = searchParams.get("kaporaDuesAmount") || "";
  const kaporaCommissionAmountParam = searchParams.get("kaporaCommissionAmount") || "";
  const kaporaPaidAmountParam = searchParams.get("kaporaPaidAmount") || "";
  const kaporaRemainingBalanceParam = searchParams.get("kaporaRemainingBalance") || "";
  const kaporaBalanceDueDateParam = searchParams.get("kaporaBalanceDueDate") || "";

  // Sales Contract (SATIŞ SÖZLEŞMESİ) params
  const salePropertyDetailsParam = searchParams.get("salePropertyDetails") || "";
  const salePriceRawParam = searchParams.get("salePriceRaw") || "";
  const saleCurrencyParam = searchParams.get("saleCurrency") || "";
  const depositDateParam = searchParams.get("depositDate") || "";
  const deedTransferDateParam = searchParams.get("deedTransferDate") || "";
  const paymentDeadlineMonthsParam = searchParams.get("paymentDeadlineMonths") || "";
  const gracePeriodDaysParam = searchParams.get("gracePeriodDays") || "";
  const taxClauseTextParam = searchParams.get("taxClauseText") || "";
  const witness1NameParam = searchParams.get("witness1Name") || "";
  const witness1IdentityParam = searchParams.get("witness1Identity") || "";
  const witness2NameParam = searchParams.get("witness2Name") || "";
  const witness2IdentityParam = searchParams.get("witness2Identity") || "";

  // Sales Deposit / Kapora & Escrow Agreements params
  const salesDepositPaidAmountParam = searchParams.get("salesDepositPaidAmount") || "";
  const salesDepositRemainingAmountParam = searchParams.get("salesDepositRemainingAmount") || "";
  const salesPaymentTermsParam = searchParams.get("salesPaymentTerms") || "";
  const reservationDaysParam = searchParams.get("reservationDays") || "";
  const escrowDeadlineDaysParam = searchParams.get("escrowDeadlineDays") || "";

  // Offer Letter & Consultant params
  const offerPriceParam = searchParams.get("offerPrice") || "";
  const viewingDateParam = searchParams.get("viewingDate") || "";
  const offerValidityPeriodParam = searchParams.get("offerValidityPeriod") || "";
  const offerFreeNotesParam = searchParams.get("offerFreeNotes") || "";
  const offerPropertyNatureParam = searchParams.get("offerPropertyNature") || "";
  const offerPropertyDetailsParam = searchParams.get("offerPropertyDetails") || "";
  const agentAndCompanyParam = searchParams.get("agentAndCompany") || "";
  const customClausesParam = searchParams.get("customClauses") || "";
  const authorizedPersonNameParam = searchParams.get("authorizedPersonName") || "";
  const authorizedPersonIdentityParam = searchParams.get("authorizedPersonIdentity") || "";
  const authorizedPersonIdTypeParam = searchParams.get("authorizedPersonIdType") || "";
  const consultantIdTypeParam = searchParams.get("consultantIdType") || "";
  const officeSplitRateParam = searchParams.get("officeSplitRate") || "";
  const consultantSplitRateParam = searchParams.get("consultantSplitRate") || "";
  const externalOfficeSplitRateParam = searchParams.get("externalOfficeSplitRate") || "";
  const externalInternalOfficeRateParam = searchParams.get("externalInternalOfficeRate") || "";
  const externalInternalConsultantRateParam = searchParams.get("externalInternalConsultantRate") || "";
  const noticePeriodDaysParam = searchParams.get("noticePeriodDays") || "";
  const storeNameParam = searchParams.get("storeName") || "";
  const storePhoneParam = searchParams.get("storePhone") || "";
  const brokerAddressParam = searchParams.get("brokerAddress") || "";
  const clientAddressParam = searchParams.get("clientAddress") || "";
  const showingItem1DetailsParam = searchParams.get("showingItem1Details") || "";
  const showingItem1PriceParam = searchParams.get("showingItem1Price") || "";
  const showingItem2DetailsParam = searchParams.get("showingItem2Details") || "";
  const showingItem2PriceParam = searchParams.get("showingItem2Price") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemData, setItemData] = useState<any>(null);
  const [isVehicle, setIsVehicle] = useState(false);
  const [activeDocId, setActiveDocId] = useState<string>(docIdParam);

  // Buyer states
  const [clientName, setClientName] = useState(clientNameParam);
  const [clientPhone, setClientPhone] = useState(clientPhoneParam);
  const [clientIdentity, setClientIdentity] = useState(clientIdentityParam);
  const [buyerIdType, setBuyerIdType] = useState(buyerIdTypeParam);
  const [signed, setSigned] = useState(false);
  const [signatureImage, setSignatureImage] = useState("");

  // Seller states
  const [ownerName, setOwnerName] = useState(ownerNameParam);
  const [ownerPhone, setOwnerPhone] = useState(ownerPhoneParam);
  const [sellerIdentity, setSellerIdentity] = useState(sellerIdentityParam);
  const [sellerIdType, setSellerIdType] = useState(sellerIdTypeParam);
  const [sellerSigned, setSellerSigned] = useState(false);
  const [sellerSignatureImage, setSellerSignatureImage] = useState("");

  //Stored doc details fallback
  const [savedDocDetails, setSavedDocDetails] = useState<any>(null);

  const [isSigningActive, setIsSigningActive] = useState(false);
  const [success, setSuccess] = useState(false);
  const [decisionStatus, setDecisionStatus] = useState<"approved" | "rejected">("approved");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [fixtureAccepted, setFixtureAccepted] = useState(true);
  const [inspectPhotoUrl, setInspectPhotoUrl] = useState<{ url: string; name: string; timestamp?: string } | null>(null);
  const [generatedOtp] = useState(() => String(Math.floor(100000 + Math.random() * 900000)));
  const [enteredOtp, setEnteredOtp] = useState("");
  const [sealResult, setSealResult] = useState<{ ipAddress?: string; timestamp?: string; legalSeal?: string; otpCode?: string } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const isSellerMode = roleParam === "seller";
  const isFinalViewMode = viewParam === "final";

  useEffect(() => {
    if (!id) {
      setError("Sözleşme ID bulunamadı.");
      setLoading(false);
      return;
    }

    const checkAndFetch = async () => {
      try {
        if (id.startsWith("consultant-") || templateIdParam === "consultant_partnership") {
          setIsVehicle(false);
          setItemData({
            id,
            title: "Danışman İş Ortaklığı Sözleşmesi",
            reference_no: id.toUpperCase(),
            store_name: storeNameParam || "Rodel Investment",
            store_phone: storePhoneParam || "",
            price: 0,
            currency: "GBP",
            listing_intent: "sale"
          });
        } else if (id.startsWith("pre_portfolio_") || id.startsWith("temp_")) {
          setIsVehicle(false);
          const isRentPrePortfolio =
            templateIdParam === "rental_authorization" ||
            (templateIdParam === "exclusivity_agreement" && exclusivityIntentParam === "rent");
          const rawPriceStr = isRentPrePortfolio ? rentPriceRawParam : salePriceRawParam;
          const numericPrice = parseInt(String(rawPriceStr || "0").replace(/[^\d]/g, ""), 10) || 0;
          setItemData({
            id,
            title: `${authPropertyCategoryParam || authPropertyTypeFeaturesParam || rentalPropertyDefParam || "Gayrimenkul"} - ${rentalAddressParam || "KKTC"}`,
            address: rentalAddressParam || "",
            reference_no: "YETKİ-ÖN-PORTFÖY",
            store_name: storeNameParam || ownerNameParam || "Seçkin Emlak",
            store_phone: storePhoneParam || ownerPhoneParam || "",
            price: numericPrice,
            currency: (isRentPrePortfolio ? rentCurrencyParam : saleCurrencyParam) || "GBP",
            listing_intent: isRentPrePortfolio ? "rent" : "sale"
          });
        } else if (id.startsWith("vehicle-")) {
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

          // Check existing documents in property to hydrate Buyer signature / finalized state
          const rawDocs = data.documents
            ? typeof data.documents === "string"
              ? JSON.parse(data.documents)
              : data.documents
            : [];
          if (Array.isArray(rawDocs) && rawDocs.length > 0) {
            let matchedDoc: any = null;
            if (docIdParam) {
              matchedDoc = rawDocs.find((d: any) => d && d.id === docIdParam);
            }
            if (!matchedDoc && (isSellerMode || isFinalViewMode)) {
              const targetTpl = templateIdParam || (data.listing_intent === "rent" ? "rental_agreement" : "sales_brokerage");
              for (let i = rawDocs.length - 1; i >= 0; i--) {
                const d = rawDocs[i];
                if (d && d.category === "contract" && (!targetTpl || d.details?.templateId === targetTpl)) {
                  matchedDoc = d;
                  break;
                }
              }
            }
            if (matchedDoc && matchedDoc.details) {
              const det = matchedDoc.details;
              setActiveDocId(matchedDoc.id);
              setSavedDocDetails(det);
              if (det.clientName && !clientNameParam) setClientName(det.clientName);
              if (det.clientIdentity && !clientIdentityParam) setClientIdentity(det.clientIdentity);
              if (det.clientPhone && !clientPhoneParam) setClientPhone(det.clientPhone);
              if (det.buyerIdType) setBuyerIdType(det.buyerIdType);
              if (det.ownerName && !ownerNameParam) setOwnerName(det.ownerName);
              if (det.ownerPhone && !ownerPhoneParam) setOwnerPhone(det.ownerPhone);
              if (det.sellerIdentity && !sellerIdentityParam) setSellerIdentity(det.sellerIdentity);
              if (det.sellerIdType) setSellerIdType(det.sellerIdType);
              if (det.signed) {
                setSigned(true);
                setSignatureImage(det.signatureImage || "");
              }
              if (det.sellerSigned) {
                setSellerSigned(true);
                setSellerSignatureImage(det.sellerSignatureImage || "");
              }
              if (det.legalSeal) {
                setSealResult({
                  ipAddress: det.sellerIpAddress || det.ipAddress || "Kayıtlı IP",
                  timestamp: det.sellerSignedAt || det.contractDate,
                  legalSeal: det.legalSeal,
                  otpCode: det.sellerOtpCode || det.otpCode || "ONAYLI"
                });
              }
            }
          }
        }
      } catch (err: any) {
        setError(err.message || "Veri yüklenirken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    checkAndFetch();
  }, [id, templateIdParam, storeNameParam, storePhoneParam, docIdParam, isSellerMode, isFinalViewMode]);

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
    ctx.strokeStyle = isSellerMode ? "#064e3b" : "#0f172a";
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

  const effectiveTemplateId =
    templateIdParam ||
    savedDocDetails?.templateId ||
    (itemData?.listing_intent === "rent" ? "rental_agreement" : "sales_brokerage");

  const isOwnerAuthContract = ["exclusivity_agreement", "rental_authorization", "sales_authorization"].includes(effectiveTemplateId);
  const isBilateralContract = [
    "sales_brokerage",
    "sales_deposit_agreement",
    "escrow_deposit_agreement",
    "property_reservation_deposit",
    "rental_agreement",
    "rental_deposit_agreement",
    "offer_letter",
    "exclusivity_agreement",
    "rental_authorization",
    "sales_authorization"
  ].includes(effectiveTemplateId);

  const firstSignerLabel = isOwnerAuthContract
    ? "Mülk Sahibi"
    : effectiveTemplateId === "rental_agreement" || effectiveTemplateId === "rental_deposit_agreement" || effectiveTemplateId === "eviction_undertaking"
    ? "Kiracı"
    : "Alıcı";
  const secondSignerLabel = isOwnerAuthContract
    ? "İşletme Yetkilisi"
    : effectiveTemplateId === "rental_deposit_agreement" || effectiveTemplateId === "sales_deposit_agreement"
    ? "Emlak Komisyoncusu"
    : effectiveTemplateId === "escrow_deposit_agreement"
    ? "Emanetçi (Komisyoncu)"
    : effectiveTemplateId === "rental_agreement"
    ? "Kiraya Veren"
    : "Satıcı";

  const isFurnishedRental = Boolean(
    !isVehicle &&
      itemData &&
      (itemData.listing_intent === "rent" || effectiveTemplateId === "rental_agreement") &&
      (itemData.furnished === true ||
        itemData.furnished === "true" ||
        itemData.furnished === "esyali" ||
        itemData.furnished === "furnished" ||
        fixturePhotosList.length > 0)
  );

  const symbol = itemData?.currency === "GBP" ? "£" : itemData?.currency === "USD" ? "$" : itemData?.currency === "EUR" ? "€" : "₺";
  const resolvedRegionLabel = itemData ? resolvePropertyRegionLabel(itemData) : "KKTC";
  const effectiveDepositAmount =
    depositAmountParam ||
    savedDocDetails?.depositAmount ||
    (itemData?.deposit && Number(itemData.deposit) > 0
      ? `${itemData.deposit}`
      : itemData?.listing_intent === "rent"
      ? "1 Aylık Kira Bedeli"
      : "35.000");

  const resolvedOwnerName =
    ownerName ||
    savedDocDetails?.ownerName ||
    (isOwnerAuthContract
      ? (itemData?.store_name?.replace(/lookprice/gi, "Seçkin") || "Yetkili Emlak Ofisi")
      : (itemData?.owner_info?.fullName ||
         itemData?.sector_data?.owner_info?.fullName ||
         "Mülk Sahibi"));

  const resolvedOwnerPhone =
    ownerPhone ||
    savedDocDetails?.ownerPhone ||
    (isOwnerAuthContract
      ? (itemData?.store_phone || "")
      : (itemData?.owner_info?.phone ||
         itemData?.sector_data?.owner_phone ||
         ""));

  const handleApprove = async () => {
    const isOfferLetter = effectiveTemplateId === "offer_letter";

    if (isSellerMode) {
      if (isBilateralContract && !signed) {
        alert(`İmza önceliği ${firstSignerLabel.toUpperCase()} tarafına aittir! ${secondSignerLabel} imzası öncesinde sözleşmenin ${firstSignerLabel} tarafından imzalanmış olması gerekmektedir.`);
        return;
      }
      if (!resolvedOwnerName.trim()) {
        alert(`Lütfen ${secondSignerLabel} Ad Soyad bilgisini giriniz.`);
        return;
      }
      if (effectiveTemplateId === "sales_brokerage" && !sellerIdentity.trim()) {
        alert("Lütfen Satıcı Kimlik / Pasaport numarasını giriniz.");
        return;
      }
    } else {
      if (!clientName.trim()) {
        alert(`Lütfen ${firstSignerLabel} Adı Soyadı bilgisini giriniz.`);
        return;
      }
      if (!isOfferLetter && !isOwnerAuthContract && !clientIdentity.trim()) {
        alert("Lütfen Kimlik veya Pasaport numaranızı giriniz.");
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
    }

    if (!isSigningActive) {
      alert("Lütfen parmağınızla imza alanına imzanızı atınız.");
      return;
    }
    const finalOtp = (enteredOtp.trim() || generatedOtp).trim();
    if (finalOtp.length < 4) {
      alert("Lütfen 6 haneli SMS/WhatsApp OTP doğrulama kodunu giriniz.");
      return;
    }

    const canvas = canvasRef.current;
    let signatureImgData = "";
    if (canvas) {
      signatureImgData = canvas.toDataURL("image/png");
      if (isSellerMode) {
        setSellerSignatureImage(signatureImgData);
      } else {
        setSignatureImage(signatureImgData);
      }
    }

    try {
      setLoading(true);
      if (id?.startsWith("consultant-") || effectiveTemplateId === "consultant_partnership") {
        const nowStr = formatDateTR(new Date());
        setSealResult({
          ipAddress: "Mobil Cihaz Onaylı",
          timestamp: nowStr,
          legalSeal: `DANIŞMAN İŞ ORTAKLIĞI ONAYI (${clientName} • OTP: #${finalOtp} • ${nowStr})`,
          otpCode: finalOtp
        });
        setDecisionStatus("approved");
        setSigned(true);
        setSuccess(true);
        return;
      }
      const url = isVehicle ? `/api/public/vehicles/${id}/sign` : `/api/public/real-estate/${id}/sign`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: activeDocId || docIdParam || undefined,
          signerRole: isSellerMode ? "seller" : "buyer",
          clientName,
          clientIdentity,
          buyerIdType,
          clientPhone,
          ownerName: resolvedOwnerName,
          ownerPhone: resolvedOwnerPhone,
          sellerIdentity,
          sellerIdType,
          sellerSigned: isSellerMode ? true : sellerSigned,
          sellerSigningName: isSellerMode ? resolvedOwnerName : undefined,
          sellerSignatureImage: isSellerMode ? signatureImgData : sellerSignatureImage,
          commissionRate: isVehicle ? undefined : (commissionRateParam || savedDocDetails?.commissionRate || "5"),
          templateId: isVehicle ? undefined : effectiveTemplateId,
          contractType: isVehicle ? (contractTypeParam || "consignment") : undefined,
          displayName: storeName,
          signatureImage: isSellerMode ? signatureImage : signatureImgData,
          decision: "approved",
          fixtureApproved: isFurnishedRental,
          depositAmount: effectiveDepositAmount,
          rentDuration: rentDurationParam || savedDocDetails?.rentDuration || "1 (Bir) Yıl",
          paymentDay: paymentDayParam || savedDocDetails?.paymentDay || "Her Ayın En Geç 5 (Beş)’inde Ödenecektir.",
          splitRatio: splitRatioParam || savedDocDetails?.splitRatio,
          contractDuration: contractDurationParam || savedDocDetails?.contractDuration,
          evictionDate: evictionDateParam || savedDocDetails?.evictionDate,
          // Rental & Authorization contract fields
          exclusivityIntent:
            exclusivityIntentParam ||
            savedDocDetails?.exclusivityIntent ||
            (itemData?.listing_intent === "rent" ? "rent" : "sale"),
          authPropertyCategory: authPropertyCategoryParam || savedDocDetails?.authPropertyCategory,
          authPropertyCategoryOther: authPropertyCategoryOtherParam || savedDocDetails?.authPropertyCategoryOther,
          authServiceFeePayer: authServiceFeePayerParam || savedDocDetails?.authServiceFeePayer || clientName,
          authServiceFeeReceiver: authServiceFeeReceiverParam || savedDocDetails?.authServiceFeeReceiver || resolvedOwnerName,
          authShowingDayType: authShowingDayTypeParam || savedDocDetails?.authShowingDayType || "TÜMÜ",
          authShowingHours: authShowingHoursParam || savedDocDetails?.authShowingHours || "09:00 - 18:00",
          authDurationDays: authDurationDaysParam || savedDocDetails?.authDurationDays || "90 (Doksan)",
          rentalPropertyDef: rentalPropertyDefParam || savedDocDetails?.rentalPropertyDef,
          authPropertyTypeFeatures: authPropertyTypeFeaturesParam || savedDocDetails?.authPropertyTypeFeatures || rentalPropertyDefParam || savedDocDetails?.rentalPropertyDef,
          authAdvancePayment: authAdvancePaymentParam || savedDocDetails?.authAdvancePayment,
          authAnnualIncreaseRate: authAnnualIncreaseRateParam || savedDocDetails?.authAnnualIncreaseRate,
          authTenantCriteria: authTenantCriteriaParam || savedDocDetails?.authTenantCriteria,
          authCopiesCount: authCopiesCountParam || savedDocDetails?.authCopiesCount,
          rentalUsagePurpose: rentalUsagePurposeParam || savedDocDetails?.rentalUsagePurpose,
          rentalAddress: rentalAddressParam || savedDocDetails?.rentalAddress || itemData?.address,
          rentalDistrict: rentalDistrictParam || savedDocDetails?.rentalDistrict,
          rentalTownVillage: rentalTownVillageParam || savedDocDetails?.rentalTownVillage,
          kocanNo: kocanNoParam || savedDocDetails?.kocanNo,
          paftaNo: paftaNoParam || savedDocDetails?.paftaNo,
          adaNo: adaNoParam || savedDocDetails?.adaNo,
          parselNo: parselNoParam || savedDocDetails?.parselNo,
          rentPriceRaw: rentPriceRawParam || savedDocDetails?.rentPriceRaw || itemData?.price,
          rentCurrency: rentCurrencyParam || savedDocDetails?.rentCurrency || (itemData?.currency === "TRY" ? "TL" : itemData?.currency || "TL"),
          rentPaymentMethod: rentPaymentMethodParam || savedDocDetails?.rentPaymentMethod || "Aylık Ödemeli",
          rentStartDate: rentStartDateParam || savedDocDetails?.rentStartDate || contractDateParam,
          rentEndDate: rentEndDateParam || savedDocDetails?.rentEndDate,
          kaporaTenant2Info: kaporaTenant2InfoParam || savedDocDetails?.kaporaTenant2Info,
          kaporaTenant3Info: kaporaTenant3InfoParam || savedDocDetails?.kaporaTenant3Info,
          kaporaTotalRentAmount: kaporaTotalRentAmountParam || savedDocDetails?.kaporaTotalRentAmount,
          kaporaDuesAmount: kaporaDuesAmountParam || savedDocDetails?.kaporaDuesAmount,
          kaporaCommissionAmount: kaporaCommissionAmountParam || savedDocDetails?.kaporaCommissionAmount,
          kaporaPaidAmount: kaporaPaidAmountParam || savedDocDetails?.kaporaPaidAmount,
          kaporaRemainingBalance: kaporaRemainingBalanceParam || savedDocDetails?.kaporaRemainingBalance,
          kaporaBalanceDueDate: kaporaBalanceDueDateParam || savedDocDetails?.kaporaBalanceDueDate,
          // Sales contract fields
          salePropertyDetails:
            salePropertyDetailsParam ||
            savedDocDetails?.salePropertyDetails ||
            buildDefaultSalePropertyDetails(itemData),
          salePriceRaw: salePriceRawParam || savedDocDetails?.salePriceRaw || itemData?.price,
          saleCurrency: saleCurrencyParam || savedDocDetails?.saleCurrency || itemData?.currency || "GBP",
          depositDate: depositDateParam || savedDocDetails?.depositDate || contractDateParam,
          deedTransferDate: deedTransferDateParam || savedDocDetails?.deedTransferDate,
          paymentDeadlineMonths: paymentDeadlineMonthsParam || savedDocDetails?.paymentDeadlineMonths || "4 (dört) ay",
          gracePeriodDays: gracePeriodDaysParam || savedDocDetails?.gracePeriodDays || "14",
          taxClauseText: taxClauseTextParam || savedDocDetails?.taxClauseText,
          witness1Name: witness1NameParam || savedDocDetails?.witness1Name,
          witness1Identity: witness1IdentityParam || savedDocDetails?.witness1Identity,
          witness2Name: witness2NameParam || savedDocDetails?.witness2Name,
          witness2Identity: witness2IdentityParam || savedDocDetails?.witness2Identity,
          // Sales Deposit / Kapora & Escrow Agreements fields
          salesDepositPaidAmount: salesDepositPaidAmountParam || savedDocDetails?.salesDepositPaidAmount || effectiveDepositAmount,
          salesDepositRemainingAmount: salesDepositRemainingAmountParam || savedDocDetails?.salesDepositRemainingAmount || computeRemainingSaleAmount(salePriceRawParam || savedDocDetails?.salePriceRaw || itemData?.price, effectiveDepositAmount),
          salesPaymentTerms: salesPaymentTermsParam || savedDocDetails?.salesPaymentTerms || "Tapu devrinde hepsi ödenecektir.",
          reservationDays: reservationDaysParam || savedDocDetails?.reservationDays || "15 (on beş)",
          escrowDeadlineDays: escrowDeadlineDaysParam || savedDocDetails?.escrowDeadlineDays || "15",
          // Offer letter & custom clauses
          offerPrice: offerPriceParam || savedDocDetails?.offerPrice,
          viewingDate: viewingDateParam || savedDocDetails?.viewingDate,
          offerValidityPeriod: offerValidityPeriodParam || savedDocDetails?.offerValidityPeriod,
          offerFreeNotes: offerFreeNotesParam || savedDocDetails?.offerFreeNotes,
          offerPropertyNature: offerPropertyNatureParam || savedDocDetails?.offerPropertyNature,
          offerPropertyDetails: offerPropertyDetailsParam || savedDocDetails?.offerPropertyDetails,
          agentAndCompany: agentAndCompanyParam || savedDocDetails?.agentAndCompany || storeName,
          authorizedPersonIdentity: authorizedPersonIdentityParam || savedDocDetails?.authorizedPersonIdentity,
          brokerAddress: brokerAddressParam || savedDocDetails?.brokerAddress || itemData?.store_address,
          clientAddress: clientAddressParam || savedDocDetails?.clientAddress,
          showingItem1Details:
            showingItem1DetailsParam ||
            (savedDocDetails?.showingItem1Details && itemData.title && savedDocDetails.showingItem1Details.includes(itemData.title)
              ? savedDocDetails.showingItem1Details.replace(itemData.title, resolvePropertyFeatureHighlight(itemData)).replace(/\s+-\s+-\s+/g, " - ").trim()
              : savedDocDetails?.showingItem1Details) ||
            buildDefaultShowingPropertyDetails(itemData),
          showingItem1Price: showingItem1PriceParam || savedDocDetails?.showingItem1Price,
          showingItem2Details: showingItem2DetailsParam || savedDocDetails?.showingItem2Details,
          showingItem2Price: showingItem2PriceParam || savedDocDetails?.showingItem2Price,
          customClauses: customClausesParam || savedDocDetails?.customClauses,
          propertyLocation: resolvedRegionLabel,
          isFurnishedRental,
          fixturePhotosCount: fixturePhotosList.length,
          fixturePhotos: fixturePhotosList,
          otpCode: finalOtp,
          partnerId: partnerIdParam || undefined
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Sözleşme kaydedilemedi.");
      }

      if (resData.docId) {
        setActiveDocId(resData.docId);
      }
      setSealResult({
        ipAddress: resData.ipAddress || "127.0.0.1",
        timestamp: resData.timestamp || new Date().toISOString(),
        legalSeal: resData.legalSeal,
        otpCode: resData.otpCode || finalOtp
      });
      setDecisionStatus("approved");
      if (isSellerMode) {
        setSellerSigned(true);
      } else {
        setSigned(true);
      }
      setSuccess(true);
    } catch (err: any) {
      alert(err.message || "Sözleşme kaydedilirken hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Lütfen sözleşme veya eşya listesi ile ilgili düzeltme/itiraz nedeninizi kısaca yazınız.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/public/real-estate/${id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: activeDocId || docIdParam || undefined,
          signerRole: isSellerMode ? "seller" : "buyer",
          clientName: clientName || "Müşteri",
          clientIdentity: clientIdentity || "-",
          clientPhone: clientPhone || "-",
          ownerName: resolvedOwnerName,
          ownerPhone: resolvedOwnerPhone,
          sellerIdentity,
          commissionRate: commissionRateParam,
          templateId: effectiveTemplateId,
          displayName: storeName,
          decision: "rejected",
          rejectionReason: rejectionReason.trim(),
          fixtureApproved: false,
          depositAmount: effectiveDepositAmount,
          rentDuration: rentDurationParam || "1 Yıl",
          paymentDay: paymentDayParam || "Her ayın en geç 5. günü",
          propertyLocation: resolvedRegionLabel,
          isFurnishedRental,
          fixturePhotosCount: fixturePhotosList.length,
          fixturePhotos: fixturePhotosList
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
    const sym = currency === "GBP" ? "£" : currency === "USD" ? "$" : currency === "EUR" ? "€" : "₺";
    return `${sym}${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(Math.round(val))}`;
  };

  const storeName = itemData?.store_name?.replace(/lookprice/gi, "Seçkin") || "Seçkin VIP Portföy";

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
    const resolvedExclusivityIntent =
      exclusivityIntentParam ||
      savedDocDetails?.exclusivityIntent ||
      (itemData?.listing_intent === "rent" ? "rent" : "sale");
    dynamicContractTitle =
      effectiveTemplateId === "exclusivity_agreement" && resolvedExclusivityIntent === "rent"
        ? "Kiralık Gayrimenkul Tek Yetkili Kiralama Sözleşmesi"
        : matchedTemplate
        ? matchedTemplate.titleTr
        : "Satış Sözleşmesi";
  }

  let renderedContractHtml = "";
  if (!isVehicle && itemData) {
    const matchedTemplate = contractTemplates.find((t) => t.id === effectiveTemplateId);
    if (matchedTemplate) {
      const formattedPriceNum = itemData.price ? new Intl.NumberFormat("tr-TR").format(Math.round(itemData.price)) : "0";
      const resolvedSalePriceRaw = salePriceRawParam || savedDocDetails?.salePriceRaw || formattedPriceNum;
      const resolvedSaleCurr = saleCurrencyParam || savedDocDetails?.saleCurrency || itemData.currency || "GBP";
      const rMeta = buildDefaultRentalPropertyMeta(itemData);

      const values = {
        clientName: clientName || savedDocDetails?.clientName || "..................................................",
        clientIdentity: clientIdentity || savedDocDetails?.clientIdentity || "..................................................",
        buyerIdType: buyerIdType || savedDocDetails?.buyerIdType || (effectiveTemplateId === "rental_agreement" ? "TC kimlik" : "KKTC KİMLİK"),
        clientPhone: clientPhone || savedDocDetails?.clientPhone || "..................................................",
        ownerName: resolvedOwnerName,
        ownerPhone: resolvedOwnerPhone,
        sellerIdentity: sellerIdentity || savedDocDetails?.sellerIdentity || "..................................................",
        sellerIdType: sellerIdType || savedDocDetails?.sellerIdType || (effectiveTemplateId === "rental_agreement" ? "KKTC kimlik" : "KKTC Kimlik Kartı"),
        storeName: storeName,
        propertyTitle: resolveOfficialPropertyTitle(itemData),
        propertyPrice: `${formattedPriceNum} ${symbol}`,
        propertyBlockPlot: itemData.block_plot,
        commissionRate: itemData.listing_intent === "rent"
          ? (commissionRateParam || savedDocDetails?.commissionRate || "1 Aylık Kira")
          : ((commissionRateParam || savedDocDetails?.commissionRate || "5").includes("%")
              ? (commissionRateParam || savedDocDetails?.commissionRate || "%5")
              : `%${commissionRateParam || savedDocDetails?.commissionRate || "5"}`),
        contractDate: savedDocDetails?.contractDate || contractDateParam,
        propertyAddress: rentalAddressParam || savedDocDetails?.rentalAddress || itemData.address || rMeta.rentalAddress || "Belirtilmemiş adres",
        splitRatio: splitRatioParam || savedDocDetails?.splitRatio || "",
        contractDuration: contractDurationParam || savedDocDetails?.contractDuration || "",
        evictionDate: evictionDateParam || savedDocDetails?.evictionDate || "",
        depositAmount: effectiveDepositAmount,
        rentDuration: rentDurationParam || savedDocDetails?.rentDuration || "1 (Bir) Yıl",
        paymentDay: paymentDayParam || savedDocDetails?.paymentDay || "Her Ayın En Geç 5 (Beş)’inde Ödenecektir.",
        // Rental & Authorization contract variables
        exclusivityIntent:
          (exclusivityIntentParam ||
            savedDocDetails?.exclusivityIntent ||
            (itemData.listing_intent === "rent" ? "rent" : "sale")) as "rent" | "sale",
        authPropertyCategory: authPropertyCategoryParam || savedDocDetails?.authPropertyCategory || "APT.DAİRESİ",
        authPropertyCategoryOther: authPropertyCategoryOtherParam || savedDocDetails?.authPropertyCategoryOther || "",
        authServiceFeePayer:
          authServiceFeePayerParam || savedDocDetails?.authServiceFeePayer || clientName || savedDocDetails?.clientName || "",
        authServiceFeeReceiver:
          authServiceFeeReceiverParam || savedDocDetails?.authServiceFeeReceiver || resolvedOwnerName || storeName,
        authShowingDayType: authShowingDayTypeParam || savedDocDetails?.authShowingDayType || "TÜMÜ",
        authShowingHours: authShowingHoursParam || savedDocDetails?.authShowingHours || "09:00 - 18:00",
        authDurationDays: authDurationDaysParam || savedDocDetails?.authDurationDays || "90 (Doksan)",
        rentalPropertyDef: rentalPropertyDefParam || savedDocDetails?.rentalPropertyDef || rMeta.rentalPropertyDef,
        authPropertyTypeFeatures:
          authPropertyTypeFeaturesParam ||
          savedDocDetails?.authPropertyTypeFeatures ||
          rentalPropertyDefParam ||
          savedDocDetails?.rentalPropertyDef ||
          rMeta.rentalPropertyDef,
        authAdvancePayment: authAdvancePaymentParam || savedDocDetails?.authAdvancePayment || "1 Aylık Kira Bedeli",
        authAnnualIncreaseRate: authAnnualIncreaseRateParam || savedDocDetails?.authAnnualIncreaseRate || "%10",
        authTenantCriteria:
          authTenantCriteriaParam ||
          savedDocDetails?.authTenantCriteria ||
          "Düzenli gelir sahibi, kurumsal çalışan veya aile",
        authCopiesCount: authCopiesCountParam || savedDocDetails?.authCopiesCount || "2 (İki)",
        rentalUsagePurpose: rentalUsagePurposeParam || savedDocDetails?.rentalUsagePurpose || rMeta.rentalUsagePurpose,
        rentalDistrict: rentalDistrictParam || savedDocDetails?.rentalDistrict || rMeta.rentalDistrict,
        rentalTownVillage: rentalTownVillageParam || savedDocDetails?.rentalTownVillage || rMeta.rentalTownVillage,
        kocanNo: kocanNoParam || savedDocDetails?.kocanNo || rMeta.kocanNo,
        paftaNo: paftaNoParam || savedDocDetails?.paftaNo || rMeta.paftaNo,
        adaNo: adaNoParam || savedDocDetails?.adaNo || rMeta.adaNo,
        parselNo: parselNoParam || savedDocDetails?.parselNo || rMeta.parselNo,
        rentPriceRaw: rentPriceRawParam || savedDocDetails?.rentPriceRaw || formattedPriceNum,
        rentCurrency: rentCurrencyParam || savedDocDetails?.rentCurrency || (itemData.currency === "TRY" ? "TL" : itemData.currency || "TL"),
        rentPaymentMethod: rentPaymentMethodParam || savedDocDetails?.rentPaymentMethod || "Aylık Ödemeli",
        rentStartDate: rentStartDateParam || savedDocDetails?.rentStartDate || savedDocDetails?.contractDate || contractDateParam,
        rentEndDate: rentEndDateParam || savedDocDetails?.rentEndDate || "",
        kaporaTenant2Info: kaporaTenant2InfoParam || savedDocDetails?.kaporaTenant2Info || "",
        kaporaTenant3Info: kaporaTenant3InfoParam || savedDocDetails?.kaporaTenant3Info || "",
        kaporaTotalRentAmount: kaporaTotalRentAmountParam || savedDocDetails?.kaporaTotalRentAmount || "",
        kaporaDuesAmount: kaporaDuesAmountParam || savedDocDetails?.kaporaDuesAmount || "Aylık 300 TL",
        kaporaCommissionAmount: kaporaCommissionAmountParam || savedDocDetails?.kaporaCommissionAmount || "1 Kira Bedeli",
        kaporaPaidAmount: kaporaPaidAmountParam || savedDocDetails?.kaporaPaidAmount || formattedPriceNum,
        kaporaRemainingBalance: kaporaRemainingBalanceParam || savedDocDetails?.kaporaRemainingBalance || "",
        kaporaBalanceDueDate: kaporaBalanceDueDateParam || savedDocDetails?.kaporaBalanceDueDate || contractDateParam,
        // Sales contract variables
        salePropertyDetails:
          salePropertyDetailsParam ||
          savedDocDetails?.salePropertyDetails ||
          buildDefaultSalePropertyDetails(itemData),
        salePriceRaw: resolvedSalePriceRaw,
        saleCurrency: resolvedSaleCurr,
        depositDate: depositDateParam || savedDocDetails?.depositDate || contractDateParam,
        remainingAmountRaw: computeRemainingSaleAmount(resolvedSalePriceRaw, effectiveDepositAmount),
        deedTransferDate: deedTransferDateParam || savedDocDetails?.deedTransferDate || "",
        paymentDeadlineMonths: paymentDeadlineMonthsParam || savedDocDetails?.paymentDeadlineMonths || "4 (dört) ay",
        gracePeriodDays: gracePeriodDaysParam || savedDocDetails?.gracePeriodDays || "14",
        taxClauseText:
          taxClauseTextParam ||
          savedDocDetails?.taxClauseText ||
          "Satıcı Belediye Emlak Vergisi (varsa KDV yi) ve Stopaj Ödeyecek, Alıcı ise Tapu Devir Harcı’nı ödeyecektir.",
        witness1Name: witness1NameParam || savedDocDetails?.witness1Name || "Emrah CEYHAN",
        witness1Identity: witness1IdentityParam || savedDocDetails?.witness1Identity || "1170237140",
        witness2Name: witness2NameParam || savedDocDetails?.witness2Name || "",
        witness2Identity: witness2IdentityParam || savedDocDetails?.witness2Identity || "",
        // Sales Deposit / Kapora & Escrow Agreements fields
        salesDepositPaidAmount: salesDepositPaidAmountParam || savedDocDetails?.salesDepositPaidAmount || effectiveDepositAmount || formattedPriceNum,
        salesDepositRemainingAmount: salesDepositRemainingAmountParam || savedDocDetails?.salesDepositRemainingAmount || computeRemainingSaleAmount(resolvedSalePriceRaw, effectiveDepositAmount),
        salesPaymentTerms: salesPaymentTermsParam || savedDocDetails?.salesPaymentTerms || "Tapu devrinde hepsi ödenecektir.",
        reservationDays: reservationDaysParam || savedDocDetails?.reservationDays || "15 (on beş)",
        escrowDeadlineDays: escrowDeadlineDaysParam || savedDocDetails?.escrowDeadlineDays || "15",
        // Commission Receipts (KOMİSYON ALIM BELGESİ) fields
        commissionAmountWords: searchParams.get("commissionAmountWords") || savedDocDetails?.commissionAmountWords,
        commissionPaymentMethod: searchParams.get("commissionPaymentMethod") || savedDocDetails?.commissionPaymentMethod || "Nakit",
        commissionBrokerTitle: searchParams.get("commissionBrokerTitle") || savedDocDetails?.commissionBrokerTitle || storeName,
        commissionPayerName: searchParams.get("commissionPayerName") || savedDocDetails?.commissionPayerName || clientName || resolvedOwnerName,
        commissionPayerIdentity: searchParams.get("commissionPayerIdentity") || savedDocDetails?.commissionPayerIdentity || clientIdentity || sellerIdentity,
        commissionPayerPhone: searchParams.get("commissionPayerPhone") || savedDocDetails?.commissionPayerPhone || clientPhone || resolvedOwnerPhone,
        commissionPayerRole: searchParams.get("commissionPayerRole") || savedDocDetails?.commissionPayerRole || (effectiveTemplateId === "rental_commission_receipt" ? "KİRACI" : "MAL SAHİBİ"),
        commissionReceiptNo: searchParams.get("commissionReceiptNo") || savedDocDetails?.commissionReceiptNo || `MAK-${itemData?.reference_no || itemData?.id || "001"}`,
        // Offer letter & Consultant variables
        offerPrice: offerPriceParam || savedDocDetails?.offerPrice || `${formattedPriceNum} ${symbol}`,
        viewingDate: viewingDateParam || savedDocDetails?.viewingDate || contractDateParam,
        offerValidityPeriod: offerValidityPeriodParam || savedDocDetails?.offerValidityPeriod || "7 (yedi) gün",
        offerFreeNotes: offerFreeNotesParam || savedDocDetails?.offerFreeNotes || "",
        offerPropertyNature: offerPropertyNatureParam || savedDocDetails?.offerPropertyNature || "",
        offerPropertyDetails: offerPropertyDetailsParam || savedDocDetails?.offerPropertyDetails || "",
        agentAndCompany: agentAndCompanyParam || savedDocDetails?.agentAndCompany || storeName,
        customClauses: customClausesParam || savedDocDetails?.customClauses || "",
        authorizedPersonName: authorizedPersonNameParam,
        authorizedPersonIdentity:
          authorizedPersonIdentityParam || savedDocDetails?.authorizedPersonIdentity || "1170237140",
        brokerAddress:
          brokerAddressParam ||
          savedDocDetails?.brokerAddress ||
          itemData.store_address ||
          "Atatürk Caddesi No: 81/A Küçük Kaymaklı / Lefkoşa",
        clientAddress: clientAddressParam || savedDocDetails?.clientAddress || "",
        showingItem1Details:
          showingItem1DetailsParam ||
          (savedDocDetails?.showingItem1Details && itemData.title && savedDocDetails.showingItem1Details.includes(itemData.title)
            ? savedDocDetails.showingItem1Details.replace(itemData.title, resolvePropertyFeatureHighlight(itemData)).replace(/\s+-\s+-\s+/g, " - ").trim()
            : savedDocDetails?.showingItem1Details) ||
          buildDefaultShowingPropertyDetails(itemData),
        showingItem1Price:
          showingItem1PriceParam || savedDocDetails?.showingItem1Price || `${formattedPriceNum} ${symbol}`,
        showingItem2Details: showingItem2DetailsParam || savedDocDetails?.showingItem2Details || "",
        showingItem2Price: showingItem2PriceParam || savedDocDetails?.showingItem2Price || "",
        authorizedPersonIdType: authorizedPersonIdTypeParam,
        consultantIdType: consultantIdTypeParam,
        officeSplitRate: officeSplitRateParam,
        consultantSplitRate: consultantSplitRateParam,
        externalOfficeSplitRate: externalOfficeSplitRateParam,
        externalInternalOfficeRate: externalInternalOfficeRateParam,
        externalInternalConsultantRate: externalInternalConsultantRateParam,
        noticePeriodDays: noticePeriodDaysParam,
        // Dual Signatures
        isSigned: signed,
        signingName: clientName || savedDocDetails?.clientName,
        signatureImage: signatureImage,
        sellerSigned: sellerSigned,
        sellerSigningName: resolvedOwnerName,
        sellerSignatureImage: sellerSignatureImage,
        isFurnishedRental,
        fixturePhotosCount: fixturePhotosList.length,
        fixturePhotos: fixturePhotosList
      };
      const { html } = matchedTemplate.getTemplate(values);
      renderedContractHtml = html;
    }
  }

  const handlePrintContract = () => {
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
            <title>${dynamicContractTitle}</title>
            <style>
              body { font-family: sans-serif; background: white; margin: 32px; color: #0f172a; }
              @media print { body { margin: 0; padding: 16px; } }
            </style>
          </head>
          <body>${renderedContractHtml}</body>
        </html>
      `);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 400);
    }
  };

  const buildRoleLink = (targetRole: "seller" | "final") => {
    const url = new URL(window.location.href);
    if (activeDocId) url.searchParams.set("docId", activeDocId);
    if (targetRole === "final") {
      url.searchParams.set("view", "final");
      url.searchParams.set("role", "buyer");
    } else {
      url.searchParams.set("role", "seller");
      url.searchParams.set("view", "sign");
    }
    return url.toString();
  };

  const handleForwardToSellerWhatsApp = () => {
    const sellerSignLink = buildRoleLink("seller");
    const targetPhone = formatPhoneForWhatsApp(resolvedOwnerPhone || itemData?.store_phone || "");
    const msg = `*2. İMZA (${secondSignerLabel.toUpperCase()} FİNAL ONAYI) - ${dynamicContractTitle.toUpperCase()}*\n\nSayın *${resolvedOwnerName}*,\n\n*Ref: ${itemData?.reference_no || `LP-${id}`}* taşınmazına ait *${dynamicContractTitle}*, ${firstSignerLabel} (*${clientName}*) tarafından dijital olarak imzalanmıştır (✔ 1. İmza Tamamlandı).\n\nSözleşmeyi incelemek ve **${secondSignerLabel} olarak aynı sözleşme üzerinde imzalayıp FİNALLEMEK** için aşağıdaki bağlantıya tıklayınız:\n\n${sellerSignLink}`;
    if (targetPhone) {
      window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, "_blank");
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    }
  };

  const handleShareFinalContractWhatsApp = (recipient: "buyer" | "seller") => {
    const finalLink = buildRoleLink("final");
    const rawPhone = recipient === "buyer" ? clientPhone : resolvedOwnerPhone;
    const formattedPhone = rawPhone ? formatPhoneForWhatsApp(rawPhone) : "";
    const recName = recipient === "buyer" ? (clientName || firstSignerLabel) : resolvedOwnerName;
    const msg = `*FİNAL İMZALI ${dynamicContractTitle.toUpperCase()} (${firstSignerLabel.toUpperCase()} + ${secondSignerLabel.toUpperCase()} ONAYLI)*\n\nSayın *${recName}*,\n\n*Ref: ${itemData?.reference_no || `LP-${id}`}* taşınmazına ait *${dynamicContractTitle}*, hem ${firstSignerLabel} (*${clientName}*) hem de ${secondSignerLabel} (*${resolvedOwnerName}*) tarafından dijital imzalarla tamamlanarak sistemde mühürlenmiştir.\n\nHer iki tarafın imzasını taşıyan **Sözleşmenin Son Halini** görüntülemek ve PDF olarak indirmek için:\n\n${finalLink}\n\nHayırlı olsun.\n*${storeName}*`;
    if (formattedPhone) {
      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, "_blank");
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    }
  };

  const sendNotificationToAgent = () => {
    if (!itemData) return;
    const formattedPhone = formatPhoneForWhatsApp(itemData.store_phone || "");
    const targetRef = itemData.reference_no || `LP-${id}`;
    const sName = itemData.store_name?.replace(/lookprice/gi, "Seçkin") || "Seçkin VIP Portföy";
    const signerLabel = isSellerMode ? `${secondSignerLabel} (${resolvedOwnerName})` : `${firstSignerLabel} (${clientName})`;
    const finalLink = buildRoleLink(signed && sellerSigned ? "final" : "seller");

    const message =
      decisionStatus === "approved"
        ? `SAYIN ${sName.toUpperCase()},\n\n*${dynamicContractTitle}* belgesini *${signerLabel}* olarak inceledim ve mobil cihazım üzerinden *ONAYLAYARAK İMZALADIM*.\n\n• *Portföy Ref:* ${targetRef}\n• *İmza Durumu:* ${
            signed && sellerSigned
              ? `✔ FİNAL TAMAMLANDI (${firstSignerLabel} + ${secondSignerLabel} İmzalı)`
              : `1/2 ${firstSignerLabel} İmzası Tamamlandı (${secondSignerLabel} İmzası Bekleniyor)`
          }\n• *Tarih:* ${formatDateTR(new Date())}\n\nSözleşme Bağlantısı:\n${finalLink}`
        : `SAYIN ${sName.toUpperCase()},\n\n*Ref: ${targetRef}* portföyü için iletilen sözleşme hakkında *DÜZELTME / RET TALEBİM* bulunmaktadır:\n\n• *Taraf:* ${signerLabel}\n• *Not:* ${rejectionReason}`;
    
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-950">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-black text-slate-800">Güvenli Sözleşme & Dijital İmza Sistemi Yükleniyor...</p>
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

  const isAlreadyFinalized = isFinalViewMode || (isBilateralContract && signed && sellerSigned && !success);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 flex items-center justify-center p-2 sm:p-6 font-sans">
      <AnimatePresence mode="wait">
        {isAlreadyFinalized ? (
          <motion.div
            key="final-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl bg-white border-2 border-emerald-600 rounded-2xl overflow-hidden shadow-2xl p-4 sm:p-6 space-y-4"
          >
            <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded">
                  ✔ FİNAL İMZALI SÖZLEŞME ({firstSignerLabel.toUpperCase()} + {secondSignerLabel.toUpperCase()} ONAYLI)
                </span>
                <h1 className="text-base sm:text-lg font-black text-white mt-1">
                  {dynamicContractTitle} • Ref: {itemData.reference_no || `LP-${id}`}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintContract}
                  className="px-3 py-2 bg-white text-slate-950 hover:bg-slate-100 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Yazdır / PDF İndir
                </button>
                <button
                  type="button"
                  onClick={() => handleShareFinalContractWhatsApp("buyer")}
                  className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" /> {isOwnerAuthContract ? "Mülk Sahibine İlet (WA)" : "Alıcıya İlet (WA)"}
                </button>
                <button
                  type="button"
                  onClick={() => handleShareFinalContractWhatsApp("seller")}
                  className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" /> {isOwnerAuthContract ? "Yetkiliye İlet (WA)" : "Satıcıya İlet (WA)"}
                </button>
              </div>
            </div>

            {sealResult?.legalSeal && (
              <div className="p-3 bg-emerald-50 border-2 border-emerald-400 rounded-xl text-xs font-mono font-bold text-emerald-950">
                🔒 {sealResult.legalSeal}
              </div>
            )}

            <div className="bg-white border-2 border-slate-300 rounded-xl p-4 overflow-y-auto max-h-[72vh]">
              <div dangerouslySetInnerHTML={{ __html: renderedContractHtml }} />
            </div>
          </motion.div>
        ) : !success ? (
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
                    <Lock className="w-3 h-3 text-amber-400" />
                    {isSellerMode
                      ? `2. ADIM: ${secondSignerLabel.toUpperCase()} FİNAL ONAY & DİJİTAL İMZA`
                      : `1. ADIM (ÖNCELİKLİ): ${firstSignerLabel.toUpperCase()} DİJİTAL İMZA`}
                  </span>
                  <span className="text-xs bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-mono font-black">
                    Ref: {itemData.reference_no || `LP-${id}`}
                  </span>
                </div>

                <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-950 mb-3">
                  {dynamicContractTitle}
                </h1>

                {/* Signing Priority Status Bar for Bilateral Contracts */}
                {isBilateralContract && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className={`p-2.5 rounded-xl border-2 flex items-center justify-between ${
                      signed ? "bg-emerald-50 border-emerald-500 text-emerald-950" : "bg-indigo-50 border-indigo-500 text-indigo-950"
                    }`}>
                      <div>
                        <span className="block text-[9px] font-black uppercase">1. İmza (Öncelikli: {firstSignerLabel})</span>
                        <span className="text-xs font-black truncate block">{clientName || firstSignerLabel}</span>
                      </div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                        signed ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white"
                      }`}>
                        {signed ? "✔ İMZALANDI" : "BEKLİYOR"}
                      </span>
                    </div>
                    <div className={`p-2.5 rounded-xl border-2 flex items-center justify-between ${
                      sellerSigned
                        ? "bg-emerald-50 border-emerald-500 text-emerald-950"
                        : signed
                        ? "bg-amber-50 border-amber-500 text-amber-950"
                        : "bg-slate-100 border-slate-300 text-slate-600"
                    }`}>
                      <div>
                        <span className="block text-[9px] font-black uppercase">2. İmza (Final: {secondSignerLabel})</span>
                        <span className="text-xs font-black truncate block">{resolvedOwnerName}</span>
                      </div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                        sellerSigned
                          ? "bg-emerald-600 text-white"
                          : signed
                          ? `SIRA ${secondSignerLabel.toUpperCase()}`
                          : `ÖNCE ${firstSignerLabel.toUpperCase()}`
                      }`}>
                        {sellerSigned ? "✔ FİNALLENDİ" : signed ? `SIRA ${secondSignerLabel.toUpperCase()}` : `ÖNCE ${firstSignerLabel.toUpperCase()}`}
                      </span>
                    </div>
                  </div>
                )}

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
                  <div className="bg-white border-2 border-slate-300 rounded-xl p-3 max-h-[380px] overflow-y-auto text-slate-950 leading-relaxed font-sans">
                    <div dangerouslySetInnerHTML={{ __html: renderedContractHtml }} />
                  </div>
                ) : null}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-700 font-bold">
                <span>Güvenli Çift Taraflı Dijital Sözleşme Protokolü</span>
                <span className="flex items-center gap-1 text-emerald-700 font-black">
                  <CheckCircle className="w-3.5 h-3.5" /> Hukuki Delil Statüsündedir
                </span>
              </div>
            </div>

            {/* Right Column: Approval / Signature / Rejection Form */}
            <div className="lg:w-5/12 p-4 sm:p-6 flex flex-col justify-between bg-white">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-1.5 text-slate-950 font-black text-xs uppercase tracking-wider">
                    <PenTool className="w-4 h-4 text-indigo-600" />
                    <span>
                      {isSellerMode
                        ? `2. ADIM: ${secondSignerLabel.toUpperCase()} FİNAL İMZA PANELİ`
                        : `1. ADIM (ÖNCELİKLİ): ${firstSignerLabel.toUpperCase()} İMZA PANELİ`}
                    </span>
                  </div>
                </div>

                {/* 1st-signer priority guard when 2nd signer opens before 1st signer signs */}
                {isSellerMode && isBilateralContract && !signed && (
                  <div className="p-3 bg-amber-50 border-2 border-amber-400 rounded-xl text-xs font-bold text-amber-950 space-y-1">
                    <div className="font-black uppercase text-amber-900">⚠️ İmza Önceliği {firstSignerLabel} Tarafındadır</div>
                    <p>
                      Bu sözleşme tipinde önce {firstSignerLabel} tarafından imzalanması, ardından {secondSignerLabel} tarafından imzalanarak finallenmesi gerekmektedir.
                    </p>
                  </div>
                )}

                {/* Input Fields based on Role */}
                {isSellerMode ? (
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-900 uppercase mb-1">
                        {isOwnerAuthContract ? "İŞLETME YETKİLİSİ / BROKER ADI SOYADI *" : "SATICI / MÜLK SAHİBİ ADI SOYADI *"}
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder={`${secondSignerLabel} Adı Soyadı`}
                          value={ownerName || resolvedOwnerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          className="w-full bg-slate-50 border-2 border-slate-300 focus:border-indigo-600 rounded-xl py-2 pl-9 pr-3 text-xs font-black text-slate-950 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-black text-slate-900 uppercase mb-1">
                          {isOwnerAuthContract ? "YETKİLİ KİMLİK NO" : "SATICI KİMLİK / PASAPORT NO *"}
                        </label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Örn: 1170237140"
                            value={sellerIdentity}
                            onChange={(e) => setSellerIdentity(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-300 focus:border-indigo-600 rounded-xl py-2 pl-9 pr-3 text-xs font-black text-slate-950 outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-900 uppercase mb-1">
                          {isOwnerAuthContract ? "OFİS / YETKİLİ TELEFON NUMARASI" : "SATICI TELEFON NUMARASI"}
                        </label>
                        <div className="relative">
                          <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                          <input
                            type="tel"
                            placeholder="+90 533 ..."
                            value={ownerPhone || resolvedOwnerPhone}
                            onChange={(e) => setOwnerPhone(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-300 focus:border-indigo-600 rounded-xl py-2 pl-9 pr-3 text-xs font-black text-slate-950 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-900 uppercase mb-1">
                        {isOwnerAuthContract
                          ? "MÜLK SAHİBİ ADI SOYADI *"
                          : effectiveTemplateId === "rental_agreement" || effectiveTemplateId === "eviction_undertaking"
                          ? "KİRACI ADI SOYADI *"
                          : "ALICI / MÜŞTERİ ADI SOYADI *"}
                      </label>
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
                        <label className="block text-[10px] font-black text-slate-900 uppercase mb-1">
                          {isOwnerAuthContract ? "MÜLK SAHİBİ KİMLİK / PASAPORT NO" : "KİMLİK / PASAPORT NO *"}
                        </label>
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
                        <label className="block text-[10px] font-black text-slate-900 uppercase mb-1">
                          {isOwnerAuthContract ? "MÜLK SAHİBİ TELEFON NUMARASI *" : "TELEFON NUMARANIZ *"}
                        </label>
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
                )}

                {/* Mandatory Fixture Acceptance Checkbox for Furnished Rentals */}
                {isFurnishedRental && !isSellerMode && (
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

                {/* SMS / WhatsApp 6-Digit OTP Verification & IP Timestamp Seal */}
                <div className="p-2.5 bg-indigo-50/90 border-2 border-indigo-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="text-[10px] font-black text-indigo-950 uppercase flex items-center gap-1">
                      <Lock className="w-3 h-3 text-indigo-700" />
                      <span>6 Haneli SMS / WhatsApp OTP Doğrulama Kodu</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setEnteredOtp(generatedOtp)}
                      className="text-[9px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded cursor-pointer hover:bg-indigo-700"
                    >
                      Tek Kullanımlık Kod: #{generatedOtp} (Aktar)
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder={`Örn: ${generatedOtp}`}
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-32 bg-white border-2 border-indigo-300 focus:border-indigo-600 rounded-lg py-1.5 px-2.5 text-xs font-mono font-black text-slate-950 tracking-widest outline-none"
                    />
                    <span className="text-[10px] text-indigo-900 font-bold leading-tight">
                      İmzanız IP adresiniz, zaman damgası ve OTP doğrulama kodunuzla hukuki olarak mühürlenir.
                    </span>
                  </div>
                </div>

                {/* Canvas Signature Box */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-black text-slate-900 uppercase">
                      {isSellerMode
                        ? `${secondSignerLabel.toUpperCase()} OLARAK BURAYA İMZALAYIN (FİNAL ONAY)`
                        : `${firstSignerLabel.toUpperCase()} OLARAK BURAYA İMZALAYIN (1. ÖNCELİK)`}
                    </label>
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
                      placeholder="Sözleşme maddeleri veya bilgilerle ilgili düzeltme talebinizi yazınız..."
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
                  disabled={isSellerMode && isBilateralContract && !signed}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {isSellerMode
                    ? `${secondSignerLabel.toUpperCase()} OLARAK İMZALA VE SÖZLEŞMEYİ FİNALLE`
                    : `${firstSignerLabel.toUpperCase()} OLARAK ONAYLA VE İMZALA`}
                </button>

                {!isVehicle && !showRejectBox && (
                  <button
                    type="button"
                    onClick={() => setShowRejectBox(true)}
                    className="w-full py-2.5 bg-white hover:bg-rose-50 text-rose-700 border-2 border-rose-300 font-black text-xs rounded-xl uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" /> Reddet / Düzeltme İste
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
              {decisionStatus !== "approved"
                ? "DÜZELTME / RET TALEBİ KAYDEDİLDİ"
                : signed && sellerSigned
                ? `✔ SÖZLEŞME FİNALLENDİ (${firstSignerLabel.toUpperCase()} + ${secondSignerLabel.toUpperCase()} İMZALI)`
                : `✔ 1. ADIM: ${firstSignerLabel.toUpperCase()} İMZASI TAMAMLANDI`}
            </span>

            <h2 className="text-xl font-black text-slate-950 tracking-tight mb-2">
              {decisionStatus !== "approved"
                ? "Düzeltme Talebiniz Sisteme İşlendi"
                : signed && sellerSigned
                ? "Sözleşme Karşılıklı İmzalanarak Finallendi!"
                : `${firstSignerLabel} Dijital İmzası Kaydedildi!`}
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed mb-5 max-w-sm mx-auto font-medium">
              {decisionStatus !== "approved"
                ? "Belirttiğiniz düzeltme/itiraz notu ilgili gayrimenkul danışmanının ekranına iletilmiştir."
                : signed && sellerSigned
                ? `Hem ${firstSignerLabel} hem ${secondSignerLabel} imzasını içeren sözleşmenin son hali sistemde mühürlenerek saklanmıştır. Aşağıdaki butonlarla son halini taraflara iletebilirsiniz.`
                : `1. Öncelikli ${firstSignerLabel} imzası tamamlandı. Sözleşmenin finallenmesi için şimdi ${secondSignerLabel} imzasına iletebilirsiniz.`}
            </p>

            <div className="bg-slate-50 border-2 border-slate-300 p-3.5 rounded-xl text-left space-y-1.5 mb-5 text-xs max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-600 font-bold">{firstSignerLabel} (1. İmza):</span>
                <span className="text-slate-950 font-black">
                  {clientName} {signed ? "✔" : ""}
                </span>
              </div>
              {isBilateralContract && (
                <div className="flex justify-between">
                  <span className="text-slate-600 font-bold">{secondSignerLabel} (2. Final İmza):</span>
                  <span className="text-slate-950 font-black">
                    {resolvedOwnerName} {sellerSigned ? "✔" : "(Bekleniyor)"}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600 font-bold">Tarih / Saat:</span>
                <span className="text-indigo-700 font-black">{new Date().toLocaleString("tr-TR")}</span>
              </div>
              {decisionStatus === "approved" && sealResult && (
                <div className="pt-2 mt-2 border-t border-slate-200 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-bold">IP Adresi & OTP:</span>
                    <span className="text-emerald-800 font-mono font-black">
                      IP: {sealResult.ipAddress} • OTP: #{sealResult.otpCode}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-700 font-mono font-bold bg-emerald-50 border border-emerald-200 p-2 rounded-lg leading-snug">
                    🔒 {sealResult.legalSeal}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              {decisionStatus === "approved" && isBilateralContract && signed && !sellerSigned && (
                <button
                  type="button"
                  onClick={handleForwardToSellerWhatsApp}
                  className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" /> 2. İmza İçin {isOwnerAuthContract ? "Yetkiliye" : "Satıcıya"} İlet (WhatsApp)
                </button>
              )}

              {decisionStatus === "approved" && (!isBilateralContract || (signed && sellerSigned)) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleShareFinalContractWhatsApp("buyer")}
                    className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" /> Son Halini {isOwnerAuthContract ? "Mülk Sahibine" : "Alıcıya"} İlet
                  </button>
                  {isBilateralContract && (
                    <button
                      type="button"
                      onClick={() => handleShareFinalContractWhatsApp("seller")}
                      className="py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-4 h-4" /> Son Halini {isOwnerAuthContract ? "Yetkiliye" : "Satıcıya"} İlet
                    </button>
                  )}
                </div>
              )}

              {decisionStatus === "approved" && (
                <button
                  type="button"
                  onClick={handlePrintContract}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Sözleşmeyi Yazdır / PDF İndir
                </button>
              )}

              <button 
                onClick={sendNotificationToAgent}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
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
