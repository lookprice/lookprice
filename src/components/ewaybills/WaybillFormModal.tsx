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

        <form onSubmit={handleSaveWaybill} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/30">
          {/* row 1: Receiver & Header Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest mb-0.5">
                <UserIcon className="h-3.5 w-3.5" />
                {isTr ? "ALICI (MUHATTAP) BİLGİLERİ" : "RECIPIENT DETAILS"}
              </div>
              
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
                    {isTr ? "Cari veya Müşteri Seçin" : "Select Cari/Customer"}
                    <button
                      type="button"
                      onClick={() => {
                        setQuickCariSearchInitial(customerSearch);
                        setShowQuickCariModal(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 text-[9px] font-black"
                    >
                      + {isTr ? "HIZLI EKLE" : "QUICK ADD"}
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{isTr ? "Sevk / Teslimat Adresi" : "Shipment Address"}</label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder={isTr ? "Ürünlerin teslim edileceği tam adres..." : "Full delivery address..."}
                    rows={1}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 transition resize-none bg-slate-50/50 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs h-full">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-400 font-black text-[9px] uppercase tracking-widest">
                    <Hash className="h-3 w-3" />
                    {isTr ? "GİB AYARLARI" : "GIB SETTINGS"}
                  </div>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 block uppercase">{isTr ? "Seri / Önek" : "Prefix"}</label>
                      <input type="text" maxLength={3} value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none font-black uppercase bg-slate-50/30" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 block uppercase">{isTr ? "Senaryo" : "Scenario"}</label>
                      <select value={scenario} onChange={(e) => setScenario(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-white font-black text-slate-700">
                        <option value="TEMEL IRSALİYE">TEMEL IRSALİYE</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 pt-4">
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 block uppercase">{isTr ? "İrsaliye Tipi" : "Type"}</label>
                      <select value={waybillType} onChange={(e) => setWaybillType(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-white font-black text-slate-700">
                        <option value="SEVK">{isTr ? "SEVK" : "SEVK"}</option>
                        <option value="MATBUDAN">{isTr ? "MATBUDAN" : "MATBUDAN"}</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 block uppercase">{isTr ? "Para Birimi" : "Currency"}</label>
                      <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-white font-black text-slate-700">
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

          {/* row 2: Items Grid (PROMINENT) */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <div className="flex items-center gap-2 text-slate-900 font-black text-[10px] uppercase tracking-widest">
                <Package className="h-4 w-4 text-indigo-600" />
                {isTr ? "İRSALİYE SATIRLARI (ÜRÜNLER)" : "LINE ITEMS"}
              </div>
              <button type="button" onClick={handleAddItemRow} className="px-3 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-black text-[10px] flex items-center gap-1.5 transition-all uppercase tracking-tighter shadow-sm">
                <Plus className="h-3 w-3" />
                {isTr ? "Yeni Satır Ekle" : "Add Line"}
              </button>
            </div>

            <div className="border border-slate-100 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="p-2 w-10 text-center">#</th>
                    <th className="p-2 min-w-[280px]">{isTr ? "Ürün Adı / Açıklama" : "Product description"}</th>
                    <th className="p-2 w-24 text-center">{isTr ? "Miktar" : "Qty"}</th>
                    <th className="p-2 w-32">{isTr ? "Birim" : "Unit"}</th>
                    <th className="p-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((item, idx) => (
                    <tr key={item.tempId || idx} className="hover:bg-slate-50/50 group transition-colors">
                      <td className="p-2 text-center text-[10px] font-black text-slate-300 group-hover:text-indigo-400">{idx + 1}</td>
                      <td className="p-2">
                        <div className="relative">
                          <div className="flex gap-1.5">
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
                              className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 font-black bg-white placeholder:text-slate-300"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setQuickProductRowIdx(idx);
                                setShowQuickProductModal(true);
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-indigo-600 transition shadow-xs shrink-0"
                              title={isTr ? "Hızlı Ürün Ekle" : "Quick Add Product"}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          
                          {showProductDropdown === idx && (
                            <>
                              <div className="fixed inset-0 z-[60]" onClick={() => setShowProductDropdown(null)} />
                              <div className="absolute left-0 right-0 top-full mt-1.5 z-[70] bg-white border border-slate-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto p-1 animate-in fade-in slide-in-from-top-1">
                                {(() => {
                                  const query = (item.product_name || "").trim();
                                  const searchTerms = normalizeSearch(query).split(/\s+/).filter(Boolean);
                                  const filtered = products.filter(p => {
                                    if (searchTerms.length === 0) return true;
                                    const pNameNormalized = normalizeSearch(p.name || "");
                                    const pBarcodeNormalized = normalizeSearch(p.barcode || "");
                                    return searchTerms.every(term => pNameNormalized.includes(term) || pBarcodeNormalized.includes(term));
                                  });
                                  if (filtered.length === 0) return <div className="p-3 text-center text-[10px] text-slate-400 font-black">{isTr ? "Katalogda bulunamadı." : "No match."}</div>;
                                  return filtered.map(p => (
                                    <button key={p.id} type="button" className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-between gap-2 group/item" onClick={() => selectProductForLine(idx, p)}>
                                      <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover/item:text-indigo-600"><Package className="h-3.5 w-3.5" /></div>
                                        <div className="min-w-0">
                                          <div className="text-[11px] font-black text-slate-700 group-hover/item:text-indigo-900 truncate uppercase">{p.name}</div>
                                          <div className="text-[9px] text-slate-400 font-mono">{p.barcode || "-"}</div>
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <div className="text-[10px] font-black text-indigo-600">{Number(p.price).toLocaleString('tr-TR')} {p.currency || 'TRY'}</div>
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
                        <input type="number" min="0.01" step="any" required value={item.quantity} onChange={(e) => handleUpdateItem(idx, "quantity", e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-center font-black text-slate-900 bg-white" />
                      </td>
                      <td className="p-2">
                        <select value={item.unit_code} onChange={(e) => handleUpdateItem(idx, "unit_code", e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-black bg-white uppercase">
                          <option value="Adet">{isTr ? "Adet" : "Units"}</option>
                          <option value="KG">KG</option>
                          <option value="Metre">{isTr ? "Metre" : "Meters"}</option>
                          <option value="Kutu">{isTr ? "Kutu" : "Box"}</option>
                          <option value="Saat">{isTr ? "Saat" : "Hours"}</option>
                          <option value="Porsiyon">{isTr ? "Porsiyon" : "Portion"}</option>
                        </select>
                      </td>
                      <td className="p-2 text-center">
                        <button type="button" onClick={() => handleRemoveItemRow(idx)} className="p-1.5 rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-600 transition"><Trash2 className="h-3.5 w-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* row 3: Dates & Logistics & References */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest mb-0.5">
                <Calendar className="h-3.5 w-3.5" />
                {isTr ? "DÖKÜMAN TARİHLERİ" : "DOCUMENT DATES"}
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 block uppercase">{isTr ? "İrsaliye Tarihi" : "Waybill Date"}</label>
                    <input type="date" value={waybillDate} onChange={(e) => setWaybillDate(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none font-black text-slate-700 bg-slate-50/30" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 block uppercase">{isTr ? "Saat" : "Time"}</label>
                    <input type="time" step="1" value={waybillTime} onChange={(e) => setWaybillTime(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none font-black text-slate-700 bg-slate-50/30" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-indigo-400 block uppercase">{isTr ? "Fiili Sevk Tarihi" : "Actual Date"}</label>
                    <input type="date" value={actualDate} onChange={(e) => setActualDate(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none font-black text-indigo-700 bg-indigo-50/20" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-indigo-400 block uppercase">{isTr ? "Saat" : "Time"}</label>
                    <input type="time" step="1" value={actualTime} onChange={(e) => setActualTime(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none font-black text-indigo-700 bg-indigo-50/20" />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
                  <Truck className="h-4 w-4" />
                  {isTr ? "TAŞIMA VE LOJİSTİK BİLGİLERİ" : "SHIPMENT & LOGISTICS"}
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={isCargoShipment} onChange={(e) => setIsCargoShipment(e.target.checked)} className="sr-only peer" />
                  <div className="relative w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span className="ms-2 text-[10px] font-black text-slate-700 uppercase tracking-tighter">{isTr ? "Kargo" : "Cargo"}</span>
                </label>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs min-h-[120px]">
                <AnimatePresence mode="wait">
                  {isCargoShipment ? (
                    <motion.div key="cargo" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 block uppercase">{isTr ? "Kargo Firması" : "Carrier"}</label>
                          <input type="text" value={cargoCarrier} onChange={(e) => setCargoCarrier(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none font-black text-slate-700" placeholder="Aras, Yurtiçi..." />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 block uppercase">{isTr ? "Taşıyıcı VKN/TCKN" : "Carrier ID"}</label>
                          <input type="text" value={carrierVkn} onChange={(e) => setCarrierVkn(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none font-black text-slate-700" placeholder="0000000000" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 block uppercase">{isTr ? "Takip / Dosya No" : "Tracking No"}</label>
                          <input type="text" value={cargoNo} onChange={(e) => setCargoNo(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none font-black text-slate-700" placeholder="..." />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 block uppercase">{isTr ? "Taşıma Modu" : "Mode"}</label>
                          <select value={transportMode} onChange={(e) => setTransportMode(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-white font-black text-slate-700">
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
                      <div className="space-y-2">
                        <div className="space-y-1 relative">
                          <label className="text-[9px] font-black text-slate-400 block uppercase">{isTr ? "Sürücü Seçin / Yazın" : "Select / Type Driver"}</label>
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
                                // Robust fallback for TCKN/VKN fields
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
                            <label className="text-[9px] font-black text-slate-400 block uppercase">{isTr ? "Soyadı" : "Surname"}</label>
                            <input 
                              type="text" 
                              value={driverSurname} 
                              onChange={(e) => setDriverSurname(e.target.value)} 
                              placeholder="..."
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[11px] outline-none font-black uppercase text-slate-700 bg-white" 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 block uppercase">{isTr ? "TCKN" : "ID"}</label>
                            <input 
                              type="text" 
                              maxLength={11} 
                              value={driverVkn} 
                              onChange={(e) => setDriverVkn(e.target.value)} 
                              placeholder="000..."
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[11px] outline-none font-mono font-black text-slate-700 bg-white" 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 block uppercase">{isTr ? "Telefon" : "Tel"}</label>
                            <input 
                              type="text" 
                              value={driverPhone} 
                              onChange={(e) => setDriverPhone(e.target.value)} 
                              placeholder="5..."
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[11px] outline-none font-black text-slate-700 bg-white" 
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="space-y-1 relative">
                          <label className="text-[9px] font-black text-slate-400 block uppercase">{isTr ? "Araç Plaka Seçin / Yazın" : "Plate No"}</label>
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
                            <label className="text-[9px] font-black text-slate-400 block uppercase">{isTr ? "Dorse Plaka" : "Trailer"}</label>
                            <input 
                              type="text" 
                              value={trailerPlate} 
                              onChange={(e) => setTrailerPlate(e.target.value)} 
                              placeholder="..."
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[11px] outline-none font-black uppercase text-slate-700 bg-white" 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 block uppercase">{isTr ? "Teslim Şekli" : "Terms"}</label>
                            <select value={deliveryTerm} onChange={(e) => setDeliveryTerm(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] outline-none bg-white font-black text-slate-700 uppercase">
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
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">{isTr ? "SİPARİŞ REFERANSI" : "ORDER REF"}</label>
                  <input type="text" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder={isTr ? "No..." : "No..."} className="w-full px-2.5 py-1.5 border border-indigo-100 rounded-lg text-xs outline-none font-black text-indigo-700 bg-indigo-50/10" />
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">{isTr ? "SİPARİŞ TARİHİ" : "ORDER DATE"}</label>
                   <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className="w-full px-2.5 py-1.5 border border-indigo-100 rounded-lg text-xs outline-none font-black text-indigo-700 bg-indigo-50/10" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{isTr ? "MATBU İRSALİYE REF" : "PAPER REF"}</label>
                  <input type="text" value={matbuNumber} onChange={(e) => setMatbuNumber(e.target.value)} placeholder={isTr ? "No..." : "No..."} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none font-black text-slate-700 bg-slate-50/30" />
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{isTr ? "MATBU TARİHİ" : "PAPER DATE"}</label>
                   <input type="date" value={matbuDate} onChange={(e) => setMatbuDate(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none font-black text-slate-700 bg-slate-50/30" />
                </div>
              </div>
            </div>
          </div>

          {/* row 5: Notes & Summary */}
          <div className="bg-slate-900 p-3 rounded-xl shadow-lg shadow-slate-200/50">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-9 space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 block uppercase tracking-widest">{isTr ? "İrsaliye Notu (Dökümanda gözükür)" : "Waybill Notes"}</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={isTr ? "Sevkiyat koşulları vb..." : "Cargo details..."} rows={1} className="w-full px-3 py-1.5 border border-slate-800 rounded-lg text-xs outline-none focus:border-indigo-500 transition resize-none bg-slate-950 text-slate-200 font-medium" />
              </div>
              <div className="md:col-span-3 flex items-center justify-center border-l border-slate-800">
                <div className="text-center">
                  <p className="text-[9px] text-indigo-400 leading-tight font-black uppercase tracking-tighter">
                    {isTr ? "7 GÜN İÇİNDE FATURAYA DÖNÜŞTÜRÜLMELİDİR" : "MUST BE INVOICED IN 7 DAYS"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-3 px-6 border-t border-slate-100 flex justify-end gap-2 bg-white shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 font-black uppercase tracking-widest transition text-[10px]">{isTr ? "Vazgeç" : "Cancel"}</button>
          <button onClick={handleSaveWaybill} className="px-6 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black transition flex items-center gap-2 text-[10px] uppercase tracking-widest shadow-md shadow-indigo-200 active:scale-95">
            <Save className="h-3.5 w-3.5" />
            {isTr ? "İrsaliyeyi Kaydet" : "Save Waybill"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
