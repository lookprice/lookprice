import React from "react";
import { 
  X, 
  Save, 
  Calendar, 
  User as UserIcon, 
  Hash, 
  Package, 
  Truck, 
  MapPin, 
  Ship, 
  Plus, 
  Trash2 
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
  cargoCarrier, setCargoCarrier, cargoNo, setCargoNo, items,
  handleUpdateItem, handleAddItemRow, handleRemoveItemRow, selectProductForLine,
  showProductDropdown, setShowProductDropdown, handleSaveWaybill,
  setShowQuickProductModal, setQuickProductRowIdx, setShowQuickCariModal, setQuickCariSearchInitial,
  INCOTERMS_LIST
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl max-w-6xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[95vh]"
      >
        {/* Modal Header */}
        <div className="p-4 px-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Truck className="h-5 w-5 text-indigo-600" />
            {formId ? (isTr ? "İrsaliye Düzenle" : "Edit Waybill") : (isTr ? "Yeni E-İrsaliye Hazırla" : "New e-Waybill Preparation")}
          </h2>
          <button onClick={onClose} className="p-1 px-2 rounded-xl hover:bg-slate-200 text-slate-400 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSaveWaybill} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* section 1: Basic setup & receiver */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-5">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-1">
                <UserIcon className="h-4 w-4" />
                {isTr ? "ALICI (MUHATTAP) BİLGİLERİ" : "RECIPIENT DETAILS"}
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1 relative">
                  <label className="text-xs font-bold text-slate-600 flex justify-between">
                    {isTr ? "Cari veya Müşteri Seçin" : "Select Cari/Customer"}
                    <button
                      type="button"
                      onClick={() => {
                        setQuickCariSearchInitial(customerSearch);
                        setShowQuickCariModal(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 text-[10px]"
                    >
                      + {isTr ? "Hızlı Cari Ekle" : "Quick Add"}
                    </button>
                  </label>
                  <AutocompleteSelect
                    items={[
                      ...companies.map(c => ({ id: `comp_${c.id}`, value: String(c.id), label: c.title || c.name || "İsimsiz", type: 'company', raw: c })),
                      ...customers.map(c => ({ id: `cust_${c.id}`, value: String(c.id), label: `${c.name || ''} ${c.surname || ''}`.trim() || "İsimsiz", type: 'customer', raw: c }))
                    ]}
                    value={companyId ? `comp_${companyId}` : customerId ? `cust_${customerId}` : ""}
                    onSelect={(item) => {
                      if (!item) {
                        setCompanyId("");
                        setCustomerId("");
                        setCustomerSearch("");
                        return;
                      }
                      if (item.type === 'company') {
                        setCompanyId(item.value);
                        setCustomerId("");
                        setCustomerSearch(item.label);
                        if (item.raw.delivery_address || item.raw.address) setDeliveryAddress(item.raw.delivery_address || item.raw.address);
                      } else if (item.type === 'customer') {
                        setCustomerId(item.value);
                        setCompanyId("");
                        setCustomerSearch(item.label);
                        if (item.raw.address) setDeliveryAddress(item.raw.address);
                      }
                    }}
                    displayField="label"
                    type="all-accounts"
                    placeholder={isTr ? "Ünvan veya isim ile ara..." : "Search by title/name..."}
                    lang={isTr ? "tr" : "en"}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">{isTr ? "Sevk / Teslimat Adresi" : "Shipment Address"}</label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder={isTr ? "Ürünlerin teslim edileceği tam adres..." : "Full delivery address..."}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition resize-none bg-slate-50/50"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">
                  <Calendar className="h-4 w-4" />
                  {isTr ? "DÖKÜMAN TARİHLERİ" : "DOCUMENT DATES"}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">{isTr ? "İrsaliye Tarihi" : "Waybill Date"}</label>
                    <input type="date" value={waybillDate} onChange={(e) => setWaybillDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">{isTr ? "Saat" : "Time"}</label>
                    <input type="time" step="1" value={waybillTime} onChange={(e) => setWaybillTime(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">{isTr ? "Fiili Sevk Tarihi" : "Actual Date"}</label>
                    <input type="date" value={actualDate} onChange={(e) => setActualDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">{isTr ? "Saat" : "Time"}</label>
                    <input type="time" step="1" value={actualTime} onChange={(e) => setActualTime(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">
                  <Hash className="h-4 w-4" />
                  {isTr ? "GİB AYARLARI" : "GIB SETTINGS"}
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase">{isTr ? "Seri / Önek" : "Prefix"}</label>
                      <input type="text" maxLength={3} value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase">{isTr ? "Senaryo" : "Scenario"}</label>
                      <select value={scenario} onChange={(e) => setScenario(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white">
                        <option value="TEMEL IRSALİYE">TEMEL IRSALİYE</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">{isTr ? "İrsaliye Tipi" : "Waybill Type"}</label>
                    <select value={waybillType} onChange={(e) => setWaybillType(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white">
                      <option value="SEVK">{isTr ? "SEVK (Satış/Transfer)" : "SEVK"}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* section 2: Carrier / Driver Details */}
          <div className="space-y-4 p-5 bg-slate-50/30 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-widest">
                <Truck className="h-4 w-4 text-indigo-600" />
                {isTr ? "TAŞIMA VE LOJİSTİK BİLGİLERİ" : "SHIPMENT & LOGISTICS"}
              </div>
              
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCargoShipment}
                    onChange={(e) => setIsCargoShipment(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="relative w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span className="ms-2 text-xs font-bold text-slate-700">{isTr ? "Kargo / Kurye ile Gönderim" : "Ship via Cargo/Courier"}</span>
                </label>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isCargoShipment ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">{isTr ? "Kargo Firması" : "Carrier"}</label>
                    <input type="text" value={cargoCarrier} onChange={(e) => setCargoCarrier(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none" placeholder="Aras, Yurtiçi vb..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">{isTr ? "Takip / Dosya No" : "Tracking No"}</label>
                    <input type="text" value={cargoNo} onChange={(e) => setCargoNo(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none" placeholder="Opsiyonel" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">{isTr ? "Teslim Şekli" : "Terms"}</label>
                    <select value={deliveryTerm} onChange={(e) => setDeliveryTerm(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white">
                      {INCOTERMS_LIST.map(inc => <option key={inc.code} value={inc.code}>{inc.code} - {isTr ? inc.labelTr : inc.labelEn}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">{isTr ? "Taşıma Modu" : "Mode"}</label>
                    <select value={transportMode} onChange={(e) => setTransportMode(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white">
                      <option value="1">Karayolu</option>
                      <option value="2">Denizyolu</option>
                      <option value="3">Havayolu</option>
                      <option value="4">Demiryolu</option>
                    </select>
                  </div>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-1 relative">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">{isTr ? "Şoför Seçin / Yazın" : "Driver Name"}</label>
                    <AutocompleteSelect
                      items={drivers.map(d => ({ id: String(d.id), value: String(d.id), label: `${d.name} ${d.surname}`, raw: d }))}
                      value={driverName}
                      onSelect={(item) => {
                        if (item) {
                          setDriverName(item.raw.name || "");
                          setDriverSurname(item.raw.surname || "");
                          setDriverVkn(item.raw.vkn_tckn || "");
                        }
                      }}
                      displayField="label"
                      type="customer"
                      placeholder={isTr ? "Adı..." : "Name..."}
                      lang={isTr ? "tr" : "en"}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">{isTr ? "Şoför Soyadı" : "Driver Surname"}</label>
                    <input type="text" value={driverSurname} onChange={(e) => setDriverSurname(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">{isTr ? "Şoför TCKN" : "Driver ID/TC"}</label>
                    <input type="text" maxLength={11} value={driverVkn} onChange={(e) => setDriverVkn(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none font-mono" />
                  </div>
                  <div className="space-y-1 relative">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">{isTr ? "Araç Plaka" : "Plate No"}</label>
                    <AutocompleteSelect
                      items={vehicles.map(v => ({ id: String(v.id), value: String(v.id), label: v.plate_number, raw: v }))}
                      value={plateNumber}
                      onSelect={(item) => { if (item) setPlateNumber(item.raw.plate_number || ""); }}
                      displayField="label"
                      type="company"
                      placeholder="34 ABC 123"
                      lang={isTr ? "tr" : "en"}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* section 3: Items Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-widest">
                <Package className="h-4 w-4 text-indigo-600" />
                {isTr ? "İRSALİYE SATIRLARI (ÜRÜNLER)" : "LINE ITEMS"}
              </div>
              <button type="button" onClick={handleAddItemRow} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" />
                {isTr ? "Yeni Satır Ekle" : "Add Line"}
              </button>
            </div>

            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3 min-w-[280px]">{isTr ? "Ürün Adı / Açıklama" : "Product description"}</th>
                    <th className="p-3 w-28 text-center">{isTr ? "Miktar" : "Qty"}</th>
                    <th className="p-3 w-32">{isTr ? "Birim" : "Unit"}</th>
                    <th className="p-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((item, idx) => (
                    <tr key={item.tempId || idx} className="hover:bg-slate-50/50">
                      <td className="p-2 text-center text-xs font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-2">
                        <div className="relative">
                          <div className="flex gap-1">
                            <input
                              type="text"
                              required
                              value={item.product_name}
                              onChange={(e) => {
                                handleUpdateItem(idx, "product_name", e.target.value);
                                setShowProductDropdown(idx);
                              }}
                              onFocus={() => setShowProductDropdown(idx)}
                              placeholder={isTr ? "Katalogdan seçin veya yazın..." : "Select from catalog..."}
                              className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 font-medium"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setQuickProductRowIdx(idx);
                                setShowQuickProductModal(true);
                              }}
                              className="p-1 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-indigo-600 transition"
                              title={isTr ? "Hızlı Ürün Ekle" : "Quick Add Product"}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          
                          {showProductDropdown === idx && (
                            <>
                              <div className="fixed inset-0 z-[60]" onClick={() => setShowProductDropdown(null)} />
                              <div className="absolute left-0 right-0 top-full mt-1 z-[70] bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto p-1 animate-in fade-in slide-in-from-top-1">
                                {(() => {
                                  const query = (item.product_name || "").trim();
                                  const searchTerms = normalizeSearch(query).split(/\s+/).filter(Boolean);
                                  const filtered = products.filter(p => {
                                    if (searchTerms.length === 0) return true;
                                    const pNameNormalized = normalizeSearch(p.name || "");
                                    const pBarcodeNormalized = normalizeSearch(p.barcode || "");
                                    return searchTerms.every(term => pNameNormalized.includes(term) || pBarcodeNormalized.includes(term));
                                  });
                                  if (filtered.length === 0) return <div className="p-3 text-center text-xs text-slate-400 font-medium">{isTr ? "Eşleşen katalog ürünü bulunamadı." : "No matching catalog product."}</div>;
                                  return filtered.map(p => (
                                    <button key={p.id} type="button" className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-between gap-2 group" onClick={() => selectProductForLine(idx, p)}>
                                      <div className="flex items-center gap-2">
                                        <div className="p-1 bg-slate-100 rounded group-hover:bg-indigo-100 text-slate-500 group-hover:text-indigo-600"><Package className="h-3.5 w-3.5" /></div>
                                        <div>
                                          <div className="text-xs font-bold text-slate-700">{p.name}</div>
                                          <div className="text-[10px] text-slate-400 font-mono">{p.barcode || "-"}</div>
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <div className="text-xs font-bold text-indigo-600">{Number(p.price).toLocaleString('tr-TR')} {p.currency || 'TRY'}</div>
                                        <div className="text-[9px] font-bold text-slate-400">{isTr ? 'Stok' : 'Stock'}: {p.stock || 0}</div>
                                      </div>
                                    </button>
                                  ));
                                })()}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <input type="number" min="0.01" step="any" required value={item.quantity} onChange={(e) => handleUpdateItem(idx, "quantity", e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-center font-bold" />
                      </td>
                      <td className="p-2">
                        <select value={item.unit_code} onChange={(e) => handleUpdateItem(idx, "unit_code", e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg">
                          <option value="Adet">{isTr ? "Adet" : "Units"}</option>
                          <option value="KG">KG</option>
                          <option value="Metre">{isTr ? "Metre" : "Meters"}</option>
                          <option value="Kutu">{isTr ? "Kutu" : "Box"}</option>
                          <option value="Saat">{isTr ? "Saat" : "Hours"}</option>
                        </select>
                      </td>
                      <td className="p-2 text-center">
                        <button type="button" onClick={() => handleRemoveItemRow(idx)} className="p-1 rounded text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* section 4: Bottom details, notes rate, and totals */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4">
            <div className="md:col-span-7 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">{isTr ? "İrsaliye Notu (GİB dökümanında gözükür)" : "Waybill Notes"}</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={isTr ? "Sevkiyat koşulları, taşıma firması bilgileri vb..." : "Cargo details..."} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition resize-none bg-slate-50/50" />
              </div>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">{isTr ? "Para Birimi" : "Currency"}</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs bg-white">
                    <option value="TRY">TRY</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">{isTr ? "Kur" : "Exchange Rate"}</label>
                  <input type="number" step="0.0001" disabled={currency === 'TRY'} value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs bg-white" />
                </div>
              </div>
            </div>
            <div className="md:col-span-5 bg-slate-50/80 p-5 rounded-2xl border border-slate-100 flex flex-col justify-center space-y-3">
              <p className="text-xs text-indigo-700 text-center leading-relaxed font-bold bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/60 shadow-sm">
                {isTr ? "⚠️ Sevkiyat İrsaliyesinin yasal olarak fiili sevk tarihinden itibaren 7 gün içinde e-Faturaya dönüştürülmesi gerekmektedir." : "⚠️ Waybill documents must legally be converted into actual sales invoices within 7 days of delivery."}
              </p>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition text-sm">{isTr ? "Vazgeç" : "Cancel"}</button>
          <button onClick={handleSaveWaybill} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center gap-2 text-sm shadow-sm">
            <Save className="h-4 w-4" />
            {isTr ? "İrsaliyeyi Kaydet" : "Save Waybill"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
