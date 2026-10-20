import React, { useState } from "react";
import { 
  X, 
  Save, 
  Calendar, 
  User as UserIcon, 
  Hash, 
  Package, 
  Truck, 
  MapPin, 
  Plus, 
  Trash2,
  Building2,
  BookmarkCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AutocompleteSelect } from "../AutocompleteSelect";
import { normalizeSearch } from "../../lib/searchUtils";

interface WaybillFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  isTr: boolean;
  formId: number | null;
  companies: any[];
  customers: any[];
  products: any[];
  drivers: any[];
  vehicles: any[];
  companyId: string;
  setCompanyId: (id: string) => void;
  customerId: string;
  setCustomerId: (id: string) => void;
  customerSearch: string;
  setCustomerSearch: (s: string) => void;
  waybillDate: string;
  setWaybillDate: (d: string) => void;
  waybillTime: string;
  setWaybillTime: (t: string) => void;
  actualDate: string;
  setActualDate: (d: string) => void;
  actualTime: string;
  setActualTime: (t: string) => void;
  prefix: string;
  setPrefix: (p: string) => void;
  scenario: string;
  setScenario: (s: string) => void;
  waybillType: string;
  setWaybillType: (t: string) => void;
  driverName: string;
  setDriverName: (s: string) => void;
  driverSurname: string;
  setDriverSurname: (s: string) => void;
  driverVkn: string;
  setDriverVkn: (s: string) => void;
  plateNumber: string;
  setPlateNumber: (s: string) => void;
  trailerPlate: string;
  setTrailerPlate: (s: string) => void;
  notes: string;
  setNotes: (s: string) => void;
  currency: string;
  setCurrency: (s: string) => void;
  exchangeRate: string;
  setExchangeRate: (s: string) => void;
  deliveryAddress: string;
  setDeliveryAddress: (s: string) => void;
  isCargoShipment: boolean;
  setIsCargoShipment: (b: boolean) => void;
  deliveryTerm: string;
  setDeliveryTerm: (s: string) => void;
  transportMode: string;
  setTransportMode: (s: string) => void;
  cargoCarrier: string;
  setCargoCarrier: (s: string) => void;
  carrierVkn: string;
  setCarrierVkn: (s: string) => void;
  cargoNo: string;
  setCargoNo: (s: string) => void;
  items: any[];
  handleUpdateItem: (idx: number, key: string, value: any) => void;
  handleAddItemRow: () => void;
  handleRemoveItemRow: (idx: number) => void;
  selectProductForLine: (idx: number, p: any) => void;
  showProductDropdown: number | null;
  setShowProductDropdown: (idx: number | null) => void;
  handleSaveWaybill: (e: React.FormEvent) => void;
  setShowQuickProductModal: (b: boolean) => void;
  setQuickProductRowIdx: (idx: number | null) => void;
  setShowQuickCariModal: (b: boolean) => void;
  setQuickCariSearchInitial: (s: string) => void;
  orderNumber: string;
  setOrderNumber: (s: string) => void;
  orderDate: string;
  setOrderDate: (s: string) => void;
  matbuNumber: string;
  setMatbuNumber: (s: string) => void;
  matbuDate: string;
  setMatbuDate: (s: string) => void;
  driverPhone: string;
  setDriverPhone: (s: string) => void;
  onSaveAlternativeAddress?: (address: string) => void;
  INCOTERMS_LIST: any[];
}

export const WaybillFormModal: React.FC<WaybillFormModalProps> = ({
  isOpen, onClose, isTr, formId, companies, customers, products, drivers, vehicles,
  companyId, setCompanyId, customerId, setCustomerId, customerSearch, setCustomerSearch,
  waybillDate, setWaybillDate, waybillTime, setWaybillTime, actualDate, setActualDate, actualTime, setActualTime,
  prefix, setPrefix, scenario, setScenario, waybillType, setWaybillType,
  driverName, setDriverName, driverSurname, setDriverSurname, driverVkn, setDriverVkn,
  plateNumber, setPlateNumber, trailerPlate, setTrailerPlate, notes, setNotes,
  currency, setCurrency, exchangeRate, setExchangeRate, deliveryAddress, setDeliveryAddress,
  isCargoShipment, setIsCargoShipment, deliveryTerm, setDeliveryTerm, transportMode, setTransportMode,
  cargoCarrier, setCargoCarrier, carrierVkn, setCarrierVkn, cargoNo, setCargoNo, items,
  handleUpdateItem, handleAddItemRow, handleRemoveItemRow, selectProductForLine,
  showProductDropdown, setShowProductDropdown, handleSaveWaybill,
  setShowQuickProductModal, setQuickProductRowIdx, setShowQuickCariModal, setQuickCariSearchInitial,
  orderNumber, setOrderNumber, orderDate, setOrderDate,
  matbuNumber, setMatbuNumber, matbuDate, setMatbuDate,
  driverPhone, setDriverPhone,
  onSaveAlternativeAddress,
  INCOTERMS_LIST
}) => {
  const [addressMode, setAddressMode] = useState<'corporate' | 'alternative' | 'custom'>('corporate');

  if (!isOpen) return null;

  const selectedCompany = companyId ? companies.find(c => String(c.id) === String(companyId)) : null;
  const selectedCustomer = customerId ? customers.find(c => String(c.id) === String(customerId)) : null;
  const selectedCariTitle = selectedCompany
    ? (selectedCompany.title || selectedCompany.name || "")
    : selectedCustomer
    ? (`${selectedCustomer.name || ""} ${selectedCustomer.surname || ""}`.trim())
    : "";

  const corporateAddress = selectedCompany?.address || selectedCustomer?.address || "";
  const alternativeAddress = selectedCompany?.delivery_address || "";

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <motion.div 
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl max-w-6xl w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[95vh]"
      >
        {/* Modal Header */}
        <div className="p-3.5 px-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 text-base">
            <Truck className="h-5 w-5 text-indigo-600" />
            {formId ? (isTr ? "İrsaliye Düzenle" : "Edit Waybill") : (isTr ? "Yeni E-İrsaliye Hazırla" : "New e-Waybill Preparation")}
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSaveWaybill} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar bg-slate-50/30">
          {/* row 1: Receiver & Header Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 space-y-2.5">
              <div className="flex items-center gap-2 text-indigo-600 font-medium text-[11px] uppercase tracking-wider mb-0.5">
                <UserIcon className="h-3.5 w-3.5" />
                {isTr ? "ALICI (MUHATAP) BİLGİLERİ" : "RECIPIENT DETAILS"}
              </div>
              
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="space-y-1.5 relative">
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider flex justify-between items-center">
                    <span>{isTr ? "Cari veya Müşteri Seçin" : "Select Cari/Customer"}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickCariSearchInitial(customerSearch);
                        setShowQuickCariModal(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 transition"
                    >
                      + {isTr ? "Hızlı Cari Ekle" : "Quick Add"}
                    </button>
                  </label>
                  <AutocompleteSelect
                    items={[
                      ...companies.map(c => ({
                        ...c,
                        id: `comp_${c.id}`,
                        value: String(c.id),
                        label: c.title || c.name || "İsimsiz Şirket",
                        display: c.title || c.name || "İsimsiz Şirket",
                        secondary_info: c.tax_number ? `VKN: ${c.tax_number}` : (c.phone || ""),
                        type: 'company',
                        raw: c
                      })),
                      ...customers.map(c => ({
                        ...c,
                        id: `cust_${c.id}`,
                        value: String(c.id),
                        label: `${c.name || ''} ${c.surname || ''}`.trim() || "İsimsiz Müşteri",
                        display: `${c.name || ''} ${c.surname || ''}`.trim() || "İsimsiz Müşteri",
                        secondary_info: c.phone || c.email || "",
                        type: 'customer',
                        raw: c
                      }))
                    ]}
                    value={customerSearch || selectedCariTitle}
                    onSearchChange={(val) => setCustomerSearch(val)}
                    onSelect={(item) => {
                      if (!item) {
                        setCompanyId("");
                        setCustomerId("");
                        setCustomerSearch("");
                        return;
                      }
                      const resolvedName = item.label || item.display || item.raw?.title || item.raw?.name || "";
                      if (item.type === 'company') {
                        setCompanyId(String(item.value || item.raw?.id || ""));
                        setCustomerId("");
                        setCustomerSearch(resolvedName);
                        if (item.raw?.delivery_address) {
                          setDeliveryAddress(item.raw.delivery_address);
                          setAddressMode('alternative');
                        } else if (item.raw?.address) {
                          setDeliveryAddress(item.raw.address);
                          setAddressMode('corporate');
                        }
                      } else if (item.type === 'customer') {
                        setCustomerId(String(item.value || item.raw?.id || ""));
                        setCompanyId("");
                        setCustomerSearch(resolvedName);
                        if (item.raw?.address) {
                          setDeliveryAddress(item.raw.address);
                          setAddressMode('corporate');
                        }
                      }
                    }}
                    displayField="label"
                    secondaryField="secondary_info"
                    type="all-accounts"
                    placeholder={isTr ? "Şirket ünvanı, müşteri adı veya VKN ile ara..." : "Search by company title, name or tax ID..."}
                    lang={isTr ? "tr" : "en"}
                  />

                  {/* Selected Cari Info Banner (Ensures company title is always visible and never replaced by comp_92) */}
                  {(selectedCompany || selectedCustomer) && (
                    <div className="mt-1.5 px-3 py-2 rounded-lg bg-indigo-50/60 border border-indigo-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Building2 className="h-4 w-4 text-indigo-600 shrink-0" />
                        <span className="font-medium text-slate-800 truncate">{selectedCariTitle}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        {selectedCompany?.tax_number && (
                          <span>VKN/TCKN: <span className="text-slate-700 font-mono">{selectedCompany.tax_number}</span></span>
                        )}
                        {selectedCompany?.tax_office && (
                          <span>V.D.: <span className="text-slate-700">{selectedCompany.tax_office}</span></span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Expandable & Flexible Shipment / Delivery Address with Alternative Address Support */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                      {isTr ? "Sevk / Teslimat Adresi" : "Shipment / Delivery Address"}
                    </label>

                    {/* Address Source Switcher */}
                    {(selectedCompany || selectedCustomer) && (
                      <div className="flex flex-wrap items-center gap-1">
                        {corporateAddress && (
                          <button
                            type="button"
                            onClick={() => {
                              setDeliveryAddress(corporateAddress);
                              setAddressMode('corporate');
                            }}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition border ${
                              deliveryAddress === corporateAddress
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {isTr ? "1. Kurumsal Adres" : "1. Corporate Address"}
                          </button>
                        )}
                        {selectedCompany && (
                          <button
                            type="button"
                            onClick={() => {
                              setDeliveryAddress(alternativeAddress || "");
                              setAddressMode('alternative');
                            }}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition border ${
                              addressMode === 'alternative' || (alternativeAddress && deliveryAddress === alternativeAddress)
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {alternativeAddress
                              ? (isTr ? "2. Alternatif Sevk Adresi" : "2. Alt. Shipment Address")
                              : (isTr ? "+ 2. Sevk Adresi Tanımla" : "+ Set 2nd Address")}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setAddressMode('custom');
                            if (deliveryAddress === corporateAddress || deliveryAddress === alternativeAddress) {
                              setDeliveryAddress("");
                            }
                          }}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition border ${
                            addressMode === 'custom' && deliveryAddress !== corporateAddress && deliveryAddress !== alternativeAddress
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isTr ? "Serbest Giriş" : "Free Entry"}
                        </button>
                      </div>
                    )}
                  </div>

                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder={isTr ? "Ürünlerin sevk/teslim edileceği tam adresi serbestçe yazın veya yukarıdan seçin (Sağ alt köşeden genişletebilirsiniz)..." : "Enter full delivery address..."}
                    rows={3}
                    className="w-full min-h-[76px] px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition resize-y bg-white font-normal leading-relaxed"
                  />

                  {/* Save as 2nd Alternative Shipment Address to Company Card */}
                  {selectedCompany && onSaveAlternativeAddress && deliveryAddress.trim() && deliveryAddress.trim() !== alternativeAddress.trim() && deliveryAddress.trim() !== corporateAddress.trim() && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => onSaveAlternativeAddress(deliveryAddress)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition"
                      >
                        <BookmarkCheck className="h-3.5 w-3.5" />
                        {isTr ? "Bu Adresi Cari Kartına 2. Sevk Adresi Olarak Kaydet" : "Save as 2nd Shipment Address to Account"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs h-full">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px] uppercase tracking-wider">
                    <Hash className="h-3.5 w-3.5 text-indigo-500" />
                    {isTr ? "GİB AYARLARI" : "GIB SETTINGS"}
                  </div>
                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-500 block uppercase">{isTr ? "Seri / Önek" : "Prefix"}</label>
                      <input type="text" maxLength={3} value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())} className="w-24 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none font-medium uppercase bg-slate-50/50 text-slate-800 focus:border-indigo-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-500 block uppercase">{isTr ? "Senaryo" : "Scenario"}</label>
                      <select value={scenario} onChange={(e) => setScenario(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-white font-normal text-slate-700 focus:border-indigo-500">
                        <option value="TEMEL IRSALİYE">TEMEL İRSALİYE</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="space-y-2.5 pt-6">
                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-500 block uppercase">{isTr ? "İrsaliye Tipi" : "Type"}</label>
                      <select value={waybillType} onChange={(e) => setWaybillType(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-white font-normal text-slate-700 focus:border-indigo-500">
                        <option value="SEVK">{isTr ? "SEVK" : "SEVK"}</option>
                        <option value="MATBUDAN">{isTr ? "MATBUDAN" : "MATBUDAN"}</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-500 block uppercase">{isTr ? "Para Birimi" : "Currency"}</label>
                      <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-24 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-white font-normal text-slate-700 focus:border-indigo-500">
                        <option value="TRY">TRY</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* row 2: Items Grid (UNCLIPPED DROPDOWN & SPACIOUS PRODUCT SELECTION) */}
          <div className={`bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3 transition-all ${showProductDropdown !== null ? 'pb-60' : ''}`}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-slate-800 font-medium text-[11px] uppercase tracking-wider">
                <Package className="h-4 w-4 text-indigo-600" />
                {isTr ? "İRSALİYE SATIRLARI (ÜRÜNLER)" : "LINE ITEMS"}
              </div>
              <button type="button" onClick={handleAddItemRow} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium text-xs flex items-center gap-1.5 transition-all shadow-xs">
                <Plus className="h-3.5 w-3.5" />
                {isTr ? "Yeni Satır Ekle" : "Add Line"}
              </button>
            </div>

            {/* IMPORTANT: overflow-visible so the product dropdown is never clipped by the table wrapper */}
            <div className="border border-slate-200 rounded-xl overflow-visible">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[10px] font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 w-10 text-center">#</th>
                    <th className="p-2.5 min-w-[320px]">{isTr ? "Ürün Adı / Açıklama (Katalogdan Ara veya Serbest Yaz)" : "Product Name / Description"}</th>
                    <th className="p-2.5 w-28 text-center">{isTr ? "Miktar" : "Qty"}</th>
                    <th className="p-2.5 w-32">{isTr ? "Birim" : "Unit"}</th>
                    <th className="p-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={item.tempId || idx} className="hover:bg-slate-50/50 group transition-colors">
                      <td className="p-2.5 text-center text-xs font-normal text-slate-400 group-hover:text-indigo-600">{idx + 1}</td>
                      <td className="p-2.5">
                        <div className="relative">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              required
                              value={item.product_name}
                              onChange={(e) => {
                                handleUpdateItem(idx, "product_name", e.target.value);
                                setShowProductDropdown(idx);
                              }}
                              onFocus={() => setShowProductDropdown(idx)}
                              placeholder={isTr ? "Ürün adı veya barkod ile katalogdan arayın veya yazın..." : "Search catalog by product name or barcode..."}
                              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 font-normal text-slate-800 bg-white placeholder:text-slate-400"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setQuickProductRowIdx(idx);
                                setShowQuickProductModal(true);
                              }}
                              className="px-2.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 text-indigo-600 transition shadow-2xs shrink-0 flex items-center gap-1 text-[11px] font-medium"
                              title={isTr ? "Hızlı Ürün Ekle" : "Quick Add Product"}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">{isTr ? "Yeni Ürün" : "New"}</span>
                            </button>
                          </div>
                          
                          {showProductDropdown === idx && (
                            <>
                              <div className="fixed inset-0 z-[110]" onClick={() => setShowProductDropdown(null)} />
                              <div className="absolute left-0 right-0 top-full mt-1.5 z-[120] bg-white border border-indigo-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto p-1.5 ring-1 ring-slate-900/5">
                                {(() => {
                                  const query = (item.product_name || "").trim();
                                  const searchTerms = normalizeSearch(query).split(/\s+/).filter(Boolean);
                                  const filtered = products.filter(p => {
                                    if (searchTerms.length === 0) return true;
                                    const pNameNormalized = normalizeSearch(p.name || "");
                                    const pBarcodeNormalized = normalizeSearch(p.barcode || "");
                                    const pCodeNormalized = normalizeSearch(p.code || p.sku || "");
                                    return searchTerms.every(term =>
                                      pNameNormalized.includes(term) ||
                                      pBarcodeNormalized.includes(term) ||
                                      pCodeNormalized.includes(term)
                                    );
                                  });
                                  if (filtered.length === 0) {
                                    return (
                                      <div className="p-3 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                                        <span>{isTr ? "Katalogda eşleşen ürün bulunamadı. Serbest metin olarak devam edebilir veya yeni ürün ekleyebilirsiniz." : "No matching product in catalog."}</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setShowProductDropdown(null);
                                            setQuickProductRowIdx(idx);
                                            setShowQuickProductModal(true);
                                          }}
                                          className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-medium"
                                        >
                                          + {isTr ? "Kataloğa Hızlı Ürün Ekle" : "Quick Add Product"}
                                        </button>
                                      </div>
                                    );
                                  }
                                  return filtered.slice(0, 50).map(p => (
                                    <button
                                      key={p.id}
                                      type="button"
                                      className="w-full text-left px-3 py-2 hover:bg-indigo-50/80 rounded-lg transition-colors flex items-center justify-between gap-3 group/item border-b border-slate-50 last:border-0"
                                      onClick={() => selectProductForLine(idx, p)}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500 group-hover/item:bg-indigo-100 group-hover/item:text-indigo-600 shrink-0">
                                          <Package className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                          <div className="text-xs font-medium text-slate-800 group-hover/item:text-indigo-900 truncate">
                                            {p.name}
                                          </div>
                                          <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                            {p.barcode && <span className="font-mono">{p.barcode}</span>}
                                            {p.stock_quantity !== undefined && (
                                              <span>{isTr ? "Stok" : "Stock"}: {p.stock_quantity} {p.unit_code || p.unit || "Adet"}</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <div className="text-xs font-medium text-indigo-600">
                                          {Number(p.price || 0).toLocaleString('tr-TR')} {p.currency || 'TRY'}
                                        </div>
                                      </div>
                                    </button>
                                  ));
                                })()}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          required
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(idx, "quantity", e.target.value)}
                          className="w-24 mx-auto block px-2.5 py-2 border border-slate-200 rounded-lg text-center font-normal text-slate-800 bg-white focus:border-indigo-500 outline-none"
                        />
                      </td>
                      <td className="p-2.5">
                        <select
                          value={item.unit_code}
                          onChange={(e) => handleUpdateItem(idx, "unit_code", e.target.value)}
                          className="w-28 px-2.5 py-2 border border-slate-200 rounded-lg text-xs font-normal text-slate-700 bg-white focus:border-indigo-500 outline-none"
                        >
                          <option value="Adet">{isTr ? "Adet" : "Units"}</option>
                          <option value="KG">KG</option>
                          <option value="Lt">{isTr ? "Litre" : "Liter"}</option>
                          <option value="Metre">{isTr ? "Metre" : "Meters"}</option>
                          <option value="Kutu">{isTr ? "Kutu" : "Box"}</option>
                          <option value="Paket">{isTr ? "Paket" : "Pack"}</option>
                          <option value="Saat">{isTr ? "Saat" : "Hours"}</option>
                          <option value="Porsiyon">{isTr ? "Porsiyon" : "Portion"}</option>
                        </select>
                      </td>
                      <td className="p-2.5 text-center">
                        <button type="button" onClick={() => handleRemoveItemRow(idx)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* row 3: Dates & Logistics & References */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 space-y-2.5">
              <div className="flex items-center gap-2 text-slate-500 font-medium text-[11px] uppercase tracking-wider mb-0.5">
                <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                {isTr ? "DÖKÜMAN TARİHLERİ" : "DOCUMENT DATES"}
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-500 block uppercase">{isTr ? "İrsaliye Tarihi" : "Waybill Date"}</label>
                    <input type="date" value={waybillDate} onChange={(e) => setWaybillDate(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none font-normal text-slate-700 bg-slate-50/40" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-500 block uppercase">{isTr ? "Saat" : "Time"}</label>
                    <input type="time" step="1" value={waybillTime} onChange={(e) => setWaybillTime(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none font-normal text-slate-700 bg-slate-50/40" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-indigo-600 block uppercase">{isTr ? "Fiili Sevk Tarihi" : "Actual Date"}</label>
                    <input type="date" value={actualDate} onChange={(e) => setActualDate(e.target.value)} className="w-full px-2.5 py-1.5 border border-indigo-100 rounded-lg text-xs outline-none font-normal text-indigo-700 bg-indigo-50/20" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-indigo-600 block uppercase">{isTr ? "Saat" : "Time"}</label>
                    <input type="time" step="1" value={actualTime} onChange={(e) => setActualTime(e.target.value)} className="w-full px-2.5 py-1.5 border border-indigo-100 rounded-lg text-xs outline-none font-normal text-indigo-700 bg-indigo-50/20" />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-2.5">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-2 text-indigo-600 font-medium text-[11px] uppercase tracking-wider">
                  <Truck className="h-4 w-4" />
                  {isTr ? "TAŞIMA VE LOJİSTİK BİLGİLERİ" : "SHIPMENT & LOGISTICS"}
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={isCargoShipment} onChange={(e) => setIsCargoShipment(e.target.checked)} className="sr-only peer" />
                  <div className="relative w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span className="ms-2 text-xs font-medium text-slate-700">{isTr ? "Kargo ile Gönderim" : "Cargo"}</span>
                </label>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs min-h-[120px]">
                <AnimatePresence mode="wait">
                  {isCargoShipment ? (
                    <motion.div key="cargo" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-medium text-slate-500 block uppercase">{isTr ? "Kargo Firması" : "Carrier"}</label>
                          <input type="text" value={cargoCarrier} onChange={(e) => setCargoCarrier(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none font-normal text-slate-700" placeholder="Aras, Yurtiçi..." />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-medium text-slate-500 block uppercase">{isTr ? "Taşıyıcı VKN/TCKN" : "Carrier ID"}</label>
                          <input type="text" value={carrierVkn} onChange={(e) => setCarrierVkn(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none font-normal text-slate-700" placeholder="0000000000" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-medium text-slate-500 block uppercase">{isTr ? "Takip / Dosya No" : "Tracking No"}</label>
                          <input type="text" value={cargoNo} onChange={(e) => setCargoNo(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none font-normal text-slate-700" placeholder="..." />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-medium text-slate-500 block uppercase">{isTr ? "Taşıma Modu" : "Mode"}</label>
                          <select value={transportMode} onChange={(e) => setTransportMode(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-white font-normal text-slate-700">
                            <option value="1">Karayolu</option>
                            <option value="2">Denizyolu</option>
                            <option value="3">Havayolu</option>
                            <option value="4">Demiryolu</option>
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="driver" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2.5">
                        <div className="space-y-1 relative">
                          <label className="text-[10px] font-medium text-slate-500 block uppercase">{isTr ? "Sürücü Seçin / Yazın" : "Select / Type Driver"}</label>
                          <AutocompleteSelect
                            items={drivers.map(d => ({ 
                              id: String(d.id), 
                              value: String(d.id), 
                              label: d.name || "", 
                              raw: d 
                            }))}
                            value={driverName}
                            onSearchChange={setDriverName}
                            onSelect={(item) => {
                              if (item) {
                                const fullName = (item.raw.name || "").trim();
                                const parts = fullName.split(/\s+/);
                                if (parts.length > 1) {
                                  const surname = parts.pop() || "";
                                  const name = parts.join(" ");
                                  setDriverName(name);
                                  setDriverSurname(surname);
                                } else {
                                  setDriverName(fullName);
                                  setDriverSurname("");
                                }
                                const idVal = item.raw.national_id || item.raw.vkn_tckn || item.raw.tc_no || "";
                                setDriverVkn(String(idVal));
                                setDriverPhone(item.raw.phone || "");
                              } else {
                                setDriverName("");
                                setDriverSurname("");
                                setDriverVkn("");
                                setDriverPhone("");
                              }
                            }}
                            displayField="label"
                            type="customer"
                            placeholder={isTr ? "Sürücü Ara..." : "Search Driver..."}
                            lang={isTr ? "tr" : "en"}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-slate-500 block uppercase">{isTr ? "Soyadı" : "Surname"}</label>
                            <input 
                              type="text" 
                              value={driverSurname} 
                              onChange={(e) => setDriverSurname(e.target.value)} 
                              placeholder="..."
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none font-normal uppercase text-slate-700 bg-white" 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-slate-500 block uppercase">{isTr ? "TCKN" : "ID"}</label>
                            <input 
                              type="text" 
                              maxLength={11} 
                              value={driverVkn} 
                              onChange={(e) => setDriverVkn(e.target.value)} 
                              placeholder="000..."
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none font-mono font-normal text-slate-700 bg-white" 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-slate-500 block uppercase">{isTr ? "Telefon" : "Tel"}</label>
                            <input 
                              type="text" 
                              value={driverPhone} 
                              onChange={(e) => setDriverPhone(e.target.value)} 
                              placeholder="5..."
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none font-normal text-slate-700 bg-white" 
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2.5">
                        <div className="space-y-1 relative">
                          <label className="text-[10px] font-medium text-slate-500 block uppercase">{isTr ? "Araç Plaka Seçin / Yazın" : "Plate No"}</label>
                          <AutocompleteSelect
                            items={vehicles.map(v => ({ 
                              id: String(v.id), 
                              value: String(v.id), 
                              label: v.plate || v.plate_number || "", 
                              raw: v 
                            }))}
                            value={plateNumber}
                            onSearchChange={setPlateNumber}
                            onSelect={(item) => { 
                              if (item) {
                                setPlateNumber(item.raw.plate || item.raw.plate_number || ""); 
                              } else {
                                setPlateNumber("");
                              }
                            }}
                            displayField="label"
                            type="company"
                            placeholder="34 ABC 123"
                            lang={isTr ? "tr" : "en"}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-slate-500 block uppercase">{isTr ? "Dorse Plaka" : "Trailer"}</label>
                            <input 
                              type="text" 
                              value={trailerPlate} 
                              onChange={(e) => setTrailerPlate(e.target.value)} 
                              placeholder="..."
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none font-normal uppercase text-slate-700 bg-white" 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-slate-500 block uppercase">{isTr ? "Teslim Şekli" : "Terms"}</label>
                            <select value={deliveryTerm} onChange={(e) => setDeliveryTerm(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-white font-normal text-slate-700 uppercase">
                              {INCOTERMS_LIST.map(inc => <option key={inc.code} value={inc.code}>{inc.code}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* row 4: Order & Paper References */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-indigo-600 uppercase tracking-wider block">{isTr ? "SİPARİŞ REFERANSI" : "ORDER REF"}</label>
                  <input type="text" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder={isTr ? "Sipariş No..." : "No..."} className="w-full px-2.5 py-1.5 border border-indigo-100 rounded-lg text-xs outline-none font-normal text-indigo-700 bg-indigo-50/10" />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-medium text-indigo-600 uppercase tracking-wider block">{isTr ? "SİPARİŞ TARİHİ" : "ORDER DATE"}</label>
                   <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className="w-full px-2.5 py-1.5 border border-indigo-100 rounded-lg text-xs outline-none font-normal text-indigo-700 bg-indigo-50/10" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">{isTr ? "MATBU İRSALİYE REF" : "PAPER REF"}</label>
                  <input type="text" value={matbuNumber} onChange={(e) => setMatbuNumber(e.target.value)} placeholder={isTr ? "Matbu No..." : "No..."} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none font-normal text-slate-700 bg-slate-50/30" />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">{isTr ? "MATBU TARİHİ" : "PAPER DATE"}</label>
                   <input type="date" value={matbuDate} onChange={(e) => setMatbuDate(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none font-normal text-slate-700 bg-slate-50/30" />
                </div>
              </div>
            </div>
          </div>

          {/* row 5: Notes & Summary */}
          <div className="bg-slate-900 p-3.5 rounded-xl shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-9 space-y-1.5">
                <label className="text-[10px] font-medium text-slate-300 block uppercase tracking-wider">{isTr ? "İrsaliye Notu (Dökümanda gözükür)" : "Waybill Notes"}</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={isTr ? "Sevkiyat koşulları, teslimat notu vb..." : "Cargo details..."} rows={2} className="w-full px-3 py-1.5 border border-slate-700 rounded-lg text-xs outline-none focus:border-indigo-400 transition resize-y bg-slate-950 text-slate-100 font-normal" />
              </div>
              <div className="md:col-span-3 flex items-center justify-center md:border-l border-slate-800 pl-2">
                <div className="text-center">
                  <p className="text-[11px] text-indigo-300 leading-relaxed font-medium uppercase">
                    {isTr ? "7 GÜN İÇİNDE FATURAYA DÖNÜŞTÜRÜLMELİDİR" : "MUST BE INVOICED IN 7 DAYS"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-3.5 px-6 border-t border-slate-100 flex justify-end gap-2.5 bg-white shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium transition text-xs">{isTr ? "Vazgeç" : "Cancel"}</button>
          <button type="button" onClick={handleSaveWaybill} className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition flex items-center gap-2 text-xs shadow-sm active:scale-95">
            <Save className="h-4 w-4" />
            {isTr ? "İrsaliyeyi Kaydet" : "Save Waybill"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

