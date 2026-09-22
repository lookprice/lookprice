import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  DollarSign,
  MapPin,
  Layers,
  Image as ImageIcon,
  AlignLeft,
  Award,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Check
} from "lucide-react";
import { RealEstateProperty } from "../types";
import { api } from "../services/api";

import { RealEstateBasicTab } from "./realestate/modal/RealEstateBasicTab";
import { RealEstateOwnerLocationTab } from "./realestate/modal/RealEstateOwnerLocationTab";
import { RealEstateMetricsFeaturesTab } from "./realestate/modal/RealEstateMetricsFeaturesTab";
import { RealEstateMediaTab } from "./realestate/modal/RealEstateMediaTab";
import { RealEstateDescriptionTab } from "./realestate/modal/RealEstateDescriptionTab";
import { RealEstateDocsPublishTab } from "./realestate/modal/RealEstateDocsPublishTab";

interface RealEstateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (property: RealEstateProperty) => void;
  property?: RealEstateProperty | null;
  storeId?: number;
  userRole?: string;
}

const formatPriceDisplay = (val: number | string | undefined | null): string => {
  if (val === undefined || val === null || val === "" || val === 0) return "";
  const num = typeof val === "number" ? val : parseInt(String(val).replace(/\D/g, ""), 10);
  if (isNaN(num)) return "";
  return new Intl.NumberFormat("tr-TR").format(num);
};

const parsePriceInput = (val: string): number => {
  const digits = val.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
};

type TabId = "basic" | "owner" | "metrics" | "media" | "description" | "docs";

const TABS: { id: TabId; label: string; icon: any; short: string }[] = [
  { id: "basic", label: "1. Temel & Fiyat", icon: DollarSign, short: "Temel & Fiyat" },
  { id: "owner", label: "2. Mülk Sahibi & Konum", icon: MapPin, short: "Mülk Sahibi" },
  { id: "metrics", label: "3. Metrikler & Donanım", icon: Layers, short: "Metrikler" },
  { id: "media", label: "4. Görseller & Medya", icon: ImageIcon, short: "Görseller" },
  { id: "description", label: "5. İlan Metni & Notlar", icon: AlignLeft, short: "Açıklama" },
  { id: "docs", label: "6. Evrak & Yayın", icon: Award, short: "Evrak & Yayın" }
];

export const RealEstateModal: React.FC<RealEstateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  property,
  storeId,
  userRole = "admin"
}) => {
  const isOfficeManager = [
    "superadmin",
    "admin",
    "storeadmin",
    "manager",
    "owner",
    "yönetici",
    "yonetici",
    "portfolio_manager",
    "portföy yöneticisi",
    "consultant",
    "danışman",
    "danisman",
    "editor"
  ].includes((userRole || "admin").toString().toLowerCase());

  const [activeTab, setActiveTab] = useState<TabId>("basic");
  const [viewMode, setViewMode] = useState<"tabs" | "all">("tabs");

  const [formData, setFormData] = useState<Partial<RealEstateProperty>>({
    title: "",
    price: 0,
    reference_no: `REF-${Math.floor(Math.random() * 9000) + 1000}`,
    currency: "GBP",
    type: "residence",
    subtype: "",
    listing_intent: "sale",
    deposit: 0,
    status: "active",
    location: "",
    description: "",
    room_count: "",
    square_meters: 0,
    sqm_gross: 0,
    block_plot: "",
    facade: "",
    building_age: "",
    floor: "",
    total_floors: "",
    heating: "",
    furnished: false,
    in_gated_community: false,
    dues: 0,
    dues_currency: "GBP",
    country: "KKTC",
    kktc_region: "Girne",
    kktc_sub_region: "",
    kktc_title_type: "Eşdeğer Koçan",
    trafo_bedeli: false,
    kdv_status: "to_be_paid",
    cati_terasi: false,
    is_on_enrakipsiz: true,
    auto_post_instagram: false,
    images: [],
    virtual_tour_url: "",
    ai_tour_enabled: false,
    documents: [],
    owner_info: { fullName: "", phone: "" },
    address: "",
    responsible_consultant_id: undefined,
    authorized_branch_id: undefined
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  // CRM states
  const [branches, setBranches] = useState<any[]>([]);
  const [consultants, setConsultants] = useState<any[]>([]);
  const [loadingCrm, setLoadingCrm] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);

  // Document Upload state
  const [docName, setDocName] = useState("");
  const [docCategory, setDocCategory] = useState<
    "title_deed" | "dask" | "contract" | "auth_doc"
  >("title_deed");
  const [docUrl, setDocUrl] = useState("");
  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null);

  const standardizeOwnerPhone = (phone: string) => {
    if (!phone) return phone;
    let cleaned = phone.trim();
    if (cleaned.startsWith("05") && cleaned.replace(/\s/g, "").length === 11) {
      const rawDigits = cleaned.replace(/\s/g, "");
      cleaned = `+90 ${rawDigits.substring(1, 4)} ${rawDigits.substring(4, 7)} ${rawDigits.substring(7)}`;
    } else if (cleaned.startsWith("5") && cleaned.replace(/\s/g, "").length === 10) {
      const rawDigits = cleaned.replace(/\s/g, "");
      cleaned = `+90 ${rawDigits.substring(0, 3)} ${rawDigits.substring(3, 6)} ${rawDigits.substring(6)}`;
    } else if (!cleaned.startsWith("+") && !cleaned.startsWith("00")) {
      const rawDigits = cleaned.replace(/\D/g, "");
      if (rawDigits.length === 10) {
        cleaned = `+90 ${rawDigits.substring(0, 3)} ${rawDigits.substring(3, 6)} ${rawDigits.substring(6)}`;
      } else if (rawDigits.length === 11 && rawDigits.startsWith("0")) {
        cleaned = `+90 ${rawDigits.substring(1, 4)} ${rawDigits.substring(4, 7)} ${rawDigits.substring(7)}`;
      }
    }
    return cleaned;
  };

  useEffect(() => {
    if (isOpen) {
      setValidationError(null);
      fetchCrmData();
    }
  }, [isOpen]);

  const fetchCrmData = async () => {
    setLoadingCrm(true);
    try {
      const [branchesRes, consultantsRes, contactsRes] = await Promise.all([
        api.getBranches(storeId),
        api.getConsultants(storeId),
        api.getRealEstateContacts(undefined, storeId)
      ]);
      setBranches(Array.isArray(branchesRes) ? branchesRes : []);
      setConsultants(Array.isArray(consultantsRes) ? consultantsRes : []);
      setContacts(Array.isArray(contactsRes) ? contactsRes : []);
    } catch (error) {
      console.error("Failed to fetch CRM data:", error);
    } finally {
      setLoadingCrm(false);
    }
  };

  useEffect(() => {
    setValidationError(null);
    if (property) {
      const sec =
        typeof (property as any).sector_data === "string"
          ? (() => {
              try {
                return JSON.parse((property as any).sector_data);
              } catch (e) {
                return {};
              }
            })()
          : (property as any).sector_data || {};

      setFormData({
        ...sec,
        ...property,
        commercial_devir_status:
          (property as any).commercial_devir_status ||
          sec.commercial_devir_status ||
          "empty",
        monthly_rent_income:
          (property as any).monthly_rent_income || sec.monthly_rent_income || 0,
        frontage_width:
          (property as any).frontage_width || sec.frontage_width || 0,
        ceiling_height:
          (property as any).ceiling_height || sec.ceiling_height || 0,
        water_tank_capacity:
          (property as any).water_tank_capacity || sec.water_tank_capacity || 0,
        generator_capacity_kva:
          (property as any).generator_capacity_kva || sec.generator_capacity_kva || 0,
        entrance_count:
          (property as any).entrance_count || sec.entrance_count || "",
        is_main_road_frontage:
          (property as any).is_main_road_frontage ?? sec.is_main_road_frontage ?? false,
        ground_floor_sqm:
          (property as any).ground_floor_sqm || sec.ground_floor_sqm || 0,
        has_basement: (property as any).has_basement ?? sec.has_basement ?? false,
        basement_sqm: (property as any).basement_sqm || sec.basement_sqm || 0,
        has_mezzanine: (property as any).has_mezzanine ?? sec.has_mezzanine ?? false,
        mezzanine_sqm: (property as any).mezzanine_sqm || sec.mezzanine_sqm || 0,
        has_outdoor_terrace:
          (property as any).has_outdoor_terrace ?? sec.has_outdoor_terrace ?? false,
        outdoor_sqm: (property as any).outdoor_sqm || sec.outdoor_sqm || 0,
        toilet_count: (property as any).toilet_count || sec.toilet_count || "",
        has_chimney: (property as any).has_chimney ?? sec.has_chimney ?? false,
        has_industrial_electricity:
          (property as any).has_industrial_electricity ??
          sec.has_industrial_electricity ??
          false,
        has_generator: (property as any).has_generator ?? sec.has_generator ?? false,
        has_elevator: (property as any).has_elevator ?? sec.has_elevator ?? false,
        has_parking: (property as any).has_parking ?? sec.has_parking ?? false,
        parking_capacity:
          (property as any).parking_capacity || sec.parking_capacity || "",
        has_kitchen: (property as any).has_kitchen ?? sec.has_kitchen ?? false,
        hotel_rooms: (property as any).hotel_rooms || sec.hotel_rooms || 0,
        hotel_beds: (property as any).hotel_beds || sec.hotel_beds || 0,
        hotel_stars: (property as any).hotel_stars || sec.hotel_stars || "",
        has_tourism_license:
          (property as any).has_tourism_license ?? sec.has_tourism_license ?? false,
        ada:
          sec.ada ||
          (property as any).ada ||
          (property.block_plot ? property.block_plot.split("/")[0] : ""),
        parsel:
          sec.parsel ||
          (property as any).parsel ||
          (property.block_plot ? property.block_plot.split("/")[1] : ""),
        mahalle: sec.mahalle || (property as any).mahalle || "",
        kocan_type:
          sec.kocan_type ||
          sec.kktc_title_type ||
          (property as any).kocan_type ||
          property.kktc_title_type ||
          "",
        zoning_status:
          sec.zoning_status ||
          sec.imar_durumu ||
          (property as any).zoning_status ||
          (property as any).imar_durumu ||
          "",
        imar_durumu:
          sec.imar_durumu ||
          sec.zoning_status ||
          (property as any).imar_durumu ||
          (property as any).zoning_status ||
          "",
        kaks: sec.kaks || (property as any).kaks || "",
        gabari: sec.gabari || (property as any).gabari || "",
        elektrik_var:
          sec.elektrik_var !== undefined
            ? !!sec.elektrik_var
            : sec.elektrik_altyapisi !== undefined
            ? !!sec.elektrik_altyapisi
            : !((property as any).elektrik_var || (property as any).elektrik_altyapisi),
        su_var:
          sec.su_var !== undefined
            ? !!sec.su_var
            : sec.su_altyapisi !== undefined
            ? !!sec.su_altyapisi
            : !((property as any).su_var || (property as any).su_altyapisi),
        yol_var:
          sec.yol_var !== undefined
            ? !!sec.yol_var
            : sec.kadastro_yolu !== undefined
            ? !!sec.kadastro_yolu
            : !((property as any).yol_var || (property as any).kadastro_yolu),
        currency: property.currency || "GBP",
        country: property.country || "KKTC",
        kktc_region: property.kktc_region || sec.kktc_region || "Girne",
        kktc_sub_region: property.kktc_sub_region || sec.kktc_sub_region || "",
        kktc_title_type:
          property.kktc_title_type ||
          sec.kktc_title_type ||
          sec.kocan_type ||
          (property as any).kocan_type ||
          "Eşdeğer Koçan",
        trafo_bedeli:
          sec.trafo_bedeli !== undefined
            ? !!sec.trafo_bedeli
            : !!property.trafo_bedeli,
        kdv_status: property.kdv_status || sec.kdv_status || "to_be_paid",
        cati_terasi: property.cati_terasi ?? sec.cati_terasi ?? false,
        is_on_enrakipsiz: property.is_on_enrakipsiz ?? true,
        auto_post_instagram: property.auto_post_instagram || false,
        subtype: property.subtype || sec.subtype || "",
        branch_name: property.branch_name || "Merkez Ofis",
        authorized_branch_id: property.authorized_branch_id,
        responsible_agent: property.responsible_agent || "",
        responsible_consultant_id: property.responsible_consultant_id,
        listing_intent:
          property.listing_intent ||
          sec.listing_intent ||
          (property.reference_no?.toUpperCase().includes("-K-") ? "rent" : "sale"),
        owner_info: property.owner_info || { fullName: "", phone: "" },
        address: property.address || "",
        sharing_scope: property.sharing_scope || "shared_pool",
        reserved_by_branch: property.reserved_by_branch || "",
        reservation_notes: property.reservation_notes || "",
        documents: property.documents || []
      });
    } else {
      setFormData({
        title: "",
        price: 0,
        currency: "GBP",
        type: "residence",
        subtype: "",
        listing_intent: "sale",
        deposit: 0,
        billing_period: "monthly",
        status: "active",
        location: "",
        description: "",
        room_count: "",
        square_meters: 0,
        sqm_gross: 0,
        block_plot: "",
        facade: "",
        building_age: "",
        floor: "",
        total_floors: "",
        heating: "",
        furnished: false,
        in_gated_community: false,
        dues: 0,
        dues_currency: "GBP",
        country: "KKTC",
        kktc_region: "Girne",
        kktc_sub_region: "",
        kktc_title_type: "Eşdeğer Koçan",
        trafo_bedeli: false,
        kdv_status: "to_be_paid",
        cati_terasi: false,
        is_on_enrakipsiz: true,
        auto_post_instagram: false,
        branch_name: "Merkez Ofis",
        authorized_branch_id: undefined,
        responsible_agent: "",
        responsible_consultant_id: undefined,
        owner_info: { fullName: "", phone: "" },
        address: "",
        sharing_scope: "shared_pool",
        reserved_by_branch: "",
        reservation_notes: "",
        images: [],
        virtual_tour_url: "",
        ai_tour_enabled: false,
        documents: []
      });
    }
    setDocName("");
    setDocUrl("");
    setSelectedDocFile(null);
  }, [property, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (formData.listing_intent === "rent") {
      const depVal = Number(formData.deposit);
      if (!formData.deposit || isNaN(depVal) || depVal <= 0) {
        setValidationError(
          "Kiralık mülkler için 'Depozito Tutarı' girişi zorunludur ve 0'dan büyük olmalıdır!"
        );
        setActiveTab("basic");
        return;
      }
    }
    if (formData.type === "land") {
      if (!formData.ada || !formData.parsel || !formData.mahalle) {
        setValidationError(
          "Arsa/Tarla mülkleri için Mahalle, Ada ve Parsel bilgileri zorunludur!"
        );
        setActiveTab("owner");
        return;
      }
    } else {
      if (!formData.address) {
        setValidationError("Konut/Ticari mülkler için adres bilgisi zorunludur!");
        setActiveTab("owner");
        return;
      }
    }
    setValidationError(null);

    // Sync owner to CRM contacts directly
    if (formData.owner_info?.fullName) {
      api
        .addRealEstateContact(
          {
            name: formData.owner_info.fullName,
            phone: formData.owner_info.phone || "",
            type: "owner",
            notes: `${
              formData.title || "Mülk"
            } sahibi olarak portföy kaydından otomatik senkronize edildi.`
          },
          storeId
        )
        .catch((err) => console.error("Auto CRM sync failed:", err));
    }

    const sectorData = {
      ...((formData as any).sector_data || {}),
      type: formData.type,
      subtype: formData.subtype,
      room_count: formData.room_count,
      rooms: formData.room_count,
      square_meters: Number(formData.square_meters) || 0,
      sqm_gross: Number(formData.sqm_gross) || 0,
      listing_intent: formData.listing_intent,
      kktc_region: formData.kktc_region,
      kktc_sub_region: formData.kktc_sub_region,
      kktc_title_type:
        formData.kktc_title_type ||
        (formData as any).kocan_type ||
        "Eşdeğer Koçan",
      trafo_bedeli: !!formData.trafo_bedeli,
      kdv_status: formData.kdv_status,
      cati_terasi: !!formData.cati_terasi,
      furnished: !!formData.furnished,
      is_trade_in_available: !!formData.is_trade_in_available,
      commercial_devir_status: formData.commercial_devir_status || "empty",
      monthly_rent_income: Number(formData.monthly_rent_income) || 0,
      frontage_width: Number(formData.frontage_width) || 0,
      ceiling_height: Number(formData.ceiling_height) || 0,
      water_tank_capacity: Number(formData.water_tank_capacity) || 0,
      generator_capacity_kva: Number(formData.generator_capacity_kva) || 0,
      entrance_count: formData.entrance_count || "",
      is_main_road_frontage: !!formData.is_main_road_frontage,
      ground_floor_sqm: Number(formData.ground_floor_sqm) || 0,
      has_basement: !!formData.has_basement,
      basement_sqm: Number(formData.basement_sqm) || 0,
      has_mezzanine: !!formData.has_mezzanine,
      mezzanine_sqm: Number(formData.mezzanine_sqm) || 0,
      has_outdoor_terrace: !!formData.has_outdoor_terrace,
      outdoor_sqm: Number(formData.outdoor_sqm) || 0,
      toilet_count: formData.toilet_count || "",
      has_chimney: !!formData.has_chimney,
      has_industrial_electricity: !!formData.has_industrial_electricity,
      has_generator: !!formData.has_generator,
      has_elevator: !!formData.has_elevator,
      has_parking: !!formData.has_parking,
      parking_capacity: formData.parking_capacity || "",
      has_kitchen: !!formData.has_kitchen,
      hotel_rooms: Number(formData.hotel_rooms) || 0,
      hotel_beds: Number(formData.hotel_beds) || 0,
      hotel_stars: formData.hotel_stars || "",
      has_tourism_license: !!formData.has_tourism_license,
      ada: formData.ada || "",
      parsel: formData.parsel || "",
      mahalle: formData.mahalle || "",
      kocan_type:
        (formData as any).kocan_type || formData.kktc_title_type || "",
      zoning_status:
        (formData as any).zoning_status || (formData as any).imar_durumu || "",
      imar_durumu:
        (formData as any).imar_durumu || (formData as any).zoning_status || "",
      kaks: (formData as any).kaks || "",
      gabari: (formData as any).gabari || "",
      elektrik_var: !!(formData as any).elektrik_var,
      su_var: !!(formData as any).su_var,
      yol_var: !!(formData as any).yol_var,
      elektrik_altyapisi: !!(formData as any).elektrik_var,
      su_altyapisi: !!(formData as any).su_var,
      kadastro_yolu: !!(formData as any).yol_var
    };

    const dataToSave = {
      ...formData,
      block_plot:
        formData.ada || formData.parsel
          ? `${formData.ada || ""}/${formData.parsel || ""}`
          : formData.block_plot,
      sector_data: sectorData
    };

    onSave(dataToSave as RealEstateProperty);
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName && !selectedDocFile) return;

    const sizeStr = selectedDocFile
      ? (selectedDocFile.size / (1024 * 1024)).toFixed(2) + " MB"
      : (Math.random() * 2 + 1).toFixed(1) + " MB";

    const fileUrlStr = selectedDocFile
      ? URL.createObjectURL(selectedDocFile)
      : docUrl || "https://lookprice.me/docs/preview_deed.pdf";

    const finalDocName =
      docName ||
      (selectedDocFile ? selectedDocFile.name.split(".")[0] : "Evrak Örneği");

    const newDoc = {
      id: "doc_" + Date.now(),
      name: finalDocName,
      category: docCategory,
      file_url: fileUrlStr,
      upload_date: new Date().toISOString().split("T")[0],
      size: sizeStr
    };

    const updatedDocs = [...(formData.documents || []), newDoc];
    setFormData({ ...formData, documents: updatedDocs });
    setDocName("");
    setDocUrl("");
    setSelectedDocFile(null);
  };

  const handleRemoveDocument = (id: string) => {
    const updatedDocs = (formData.documents || []).filter((d) => d.id !== id);
    setFormData({ ...formData, documents: updatedDocs });
  };

  const currentTabIndex = TABS.findIndex((t) => t.id === activeTab);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4">
      {/* High-tech backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Modal Main Frame - Viewport Fit Compact & Futuristic */}
      <div className="bg-white rounded-2xl w-full max-w-4xl relative z-10 flex flex-col max-h-[85vh] shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
        {/* TOP FUTURISTIC BAR */}
        <div className="bg-slate-900 text-white px-3.5 py-2 flex items-center justify-between gap-2.5 border-b border-slate-800 shrink-0 select-none">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400 shrink-0">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black tracking-widest text-indigo-400 uppercase font-mono">
                  RESTATELP
                </span>
                <span className="text-[9px] bg-white/10 px-1.5 py-0.2 rounded text-slate-300 font-mono font-bold">
                  {formData.reference_no || "REF-AUTO"}
                </span>
              </div>
              <h3 className="text-xs font-black text-white truncate">
                {property
                  ? `Portföy Düzenle: ${property.title || property.reference_no}`
                  : "Yeni Gayrimenkul Portföyü Girişi"}
              </h3>
            </div>
          </div>

          {/* Quick Header Switchers & Close */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Intent Switcher */}
            <div className="flex bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/60">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, listing_intent: "sale" })}
                className={`px-2 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                  formData.listing_intent === "sale"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                SATILIK
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, listing_intent: "rent" })}
                className={`px-2 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                  formData.listing_intent === "rent"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                KİRALIK
              </button>
            </div>

            {/* Region Switcher */}
            <div className="hidden sm:flex bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/60">
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    country: "KKTC",
                    currency: formData.currency || "GBP"
                  })
                }
                className={`px-2 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                  formData.country === "KKTC"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                🏝️ KKTC
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, country: "TR", currency: "TRY" })
                }
                className={`px-2 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                  formData.country === "TR"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                🇹🇷 TR
              </button>
            </div>

            {/* View Mode Toggle: Tabs vs All */}
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "tabs" ? "all" : "tabs")}
              title={
                viewMode === "tabs"
                  ? "Tüm alanları tek listede göster"
                  : "Adım adım sekmeli görünüme geç"
              }
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Sliders className="w-3 h-3" />
              <span className="hidden md:inline">
                {viewMode === "tabs" ? "Tüm Alanlar" : "Sekmeli Mod"}
              </span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* FUTURISTIC SEGMENTED TAB BAR (If tabs mode) */}
        {viewMode === "tabs" && (
          <div className="bg-slate-50 border-b border-slate-200 px-3 py-1 flex items-center gap-1 overflow-x-auto custom-scrollbar shrink-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setValidationError(null);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive ? "text-white" : "text-slate-400"
                    }`}
                  />
                  <span>{tab.label}</span>
                  {tab.id === "media" && (formData.images?.length || 0) > 0 && (
                    <span
                      className={`text-[9px] px-1 rounded-full font-mono font-black ${
                        isActive
                          ? "bg-white text-indigo-700"
                          : "bg-indigo-100 text-indigo-700"
                      }`}
                    >
                      {formData.images?.length}
                    </span>
                  )}
                  {tab.id === "docs" && (formData.documents?.length || 0) > 0 && (
                    <span
                      className={`text-[9px] px-1 rounded-full font-mono font-black ${
                        isActive
                          ? "bg-white text-indigo-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {formData.documents?.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* SCROLLABLE FORM BODY - HIGH-DENSITY, MINIMALIST & FUTURISTIC */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2.5 bg-slate-50/40 text-xs font-bold">
          {/* SECTION 1: TEMEL & FİYAT */}
          {(viewMode === "all" || activeTab === "basic") && (
            <RealEstateBasicTab
              formData={formData}
              setFormData={setFormData}
              formatPriceDisplay={formatPriceDisplay}
              parsePriceInput={parsePriceInput}
              setValidationError={setValidationError}
            />
          )}

          {/* SECTION 2: MÜLK SAHİBİ & ADRES & ŞUBE */}
          {(viewMode === "all" || activeTab === "owner") && (
            <RealEstateOwnerLocationTab
              formData={formData}
              setFormData={setFormData}
              contacts={contacts}
              setContacts={setContacts}
              branches={branches}
              consultants={consultants}
              storeId={storeId}
              standardizeOwnerPhone={standardizeOwnerPhone}
            />
          )}

          {/* SECTION 3: METRİKLER & DONANIM */}
          {(viewMode === "all" || activeTab === "metrics") && (
            <RealEstateMetricsFeaturesTab
              formData={formData}
              setFormData={setFormData}
              formatPriceDisplay={formatPriceDisplay}
              parsePriceInput={parsePriceInput}
            />
          )}

          {/* SECTION 4: FOTOĞRAFLAR & MEDYA */}
          {(viewMode === "all" || activeTab === "media") && (
            <RealEstateMediaTab formData={formData} setFormData={setFormData} />
          )}

          {/* SECTION 5: AÇIKLAMA */}
          {(viewMode === "all" || activeTab === "description") && (
            <RealEstateDescriptionTab
              formData={formData}
              setFormData={setFormData}
            />
          )}

          {/* SECTION 6: DOKÜMAN YÖNETİMİ & YAYIN SEÇENEKLERİ */}
          {(viewMode === "all" || activeTab === "docs") && (
            <RealEstateDocsPublishTab
              formData={formData}
              setFormData={setFormData}
              isOfficeManager={isOfficeManager}
              docName={docName}
              setDocName={setDocName}
              docCategory={docCategory}
              setDocCategory={setDocCategory}
              selectedDocFile={selectedDocFile}
              setSelectedDocFile={setSelectedDocFile}
              handleAddDocument={handleAddDocument}
              handleRemoveDocument={handleRemoveDocument}
            />
          )}
        </div>

        {/* FIXED BOTTOM ACTION BAR */}
        <div className="p-2 sm:px-3.5 sm:py-2 bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          {/* Left: Validation message or step info */}
          <div className="min-w-0 flex-1">
            {validationError ? (
              <div className="text-rose-600 text-xs font-black flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse shrink-0" />
                <span className="truncate">{validationError}</span>
              </div>
            ) : viewMode === "tabs" ? (
              <div className="text-[11px] font-bold text-slate-500 hidden sm:flex items-center gap-1.5">
                <span>
                  Adım {currentTabIndex + 1} / {TABS.length}:
                </span>
                <span className="text-indigo-600 font-black">
                  {TABS[currentTabIndex]?.short}
                </span>
              </div>
            ) : null}
          </div>

          {/* Right: Step navigation & Save */}
          <div className="flex items-center gap-1.5 shrink-0">
            {viewMode === "tabs" && currentTabIndex > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab(TABS[currentTabIndex - 1].id)}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Geri</span>
              </button>
            )}

            {viewMode === "tabs" && currentTabIndex < TABS.length - 1 && (
              <button
                type="button"
                onClick={() => setActiveTab(TABS[currentTabIndex + 1].id)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer"
              >
                <span>İleri</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onClose}
              type="button"
              className="px-2.5 py-1 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-bold text-xs transition-colors cursor-pointer"
            >
              Kapat
            </button>

            <button
              onClick={handleSave}
              type="button"
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-black text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{property ? "Kaydet" : "Portföye Ekle"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
