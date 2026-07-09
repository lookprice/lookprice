import React, { useState, useEffect, useDeferredValue } from "react";
import { 
  Plus, 
  FileDown, 
  Truck, 
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from 'xlsx';
import { QuickProductModal } from "./dashboard/invoices/sales/QuickProductModal";
import { QuickCariModal } from "./dashboard/invoices/sales/QuickCariModal";

// Modular Components
import { WaybillTable } from "./ewaybills/WaybillTable";
import { WaybillFormModal } from "./ewaybills/WaybillFormModal";
import { WaybillDetailsModal } from "./ewaybills/WaybillDetailsModal";
import { WaybillHtmlModal } from "./ewaybills/WaybillHtmlModal";
import { WaybillConvertModal } from "./ewaybills/WaybillConvertModal";

const INCOTERMS_LIST = [
  { code: "CFR", labelTr: "CFR - Masraflar ve Navlun", labelEn: "CFR - Cost and Freight" },
  { code: "CIF", labelTr: "CIF - Masraflar, Sigorta ve Navlun", labelEn: "CIF - Cost, Insurance and Freight" },
  { code: "CIP", labelTr: "CIP - Taşıma ve Sigorta Ödenmiş Olarak", labelEn: "CIP - Carriage and Insurance Paid To" },
  { code: "CPT", labelTr: "CPT - Taşıma Ödenmiş Olarak", labelEn: "CPT - Carriage Paid To" },
  { code: "DAF", labelTr: "DAF - Sınırda Teslim", labelEn: "DAF - Delivered At Frontier" },
  { code: "DAP", labelTr: "DAP - Belirlenen Yerde Teslim", labelEn: "DAP - Delivered At Place" },
  { code: "DAT", labelTr: "DAT - Terminalde Teslim", labelEn: "DAT - Delivered At Terminal" },
  { code: "DDP", labelTr: "DDP - Gümrük Vergileri Ödenmiş Olarak", labelEn: "DDP - Delivered Duty Paid" },
  { code: "DDU", labelTr: "DDU - Gümrük Resmi Ödenmemiş Olarak Teslim", labelEn: "DDU - Delivered Duty Unpaid" },
  { code: "DEQ", labelTr: "DEQ - Rıhtımda Teslim (Gümrük Vergi ve Harçları Dahil)", labelEn: "DEQ - Delivered Ex Quay" },
  { code: "DES", labelTr: "DES - Gemide Teslim", labelEn: "DES - Delivered Ex Ship" },
  { code: "DPU", labelTr: "DPU - Belirlenen Yerde Boşaltılmış Olarak Teslim", labelEn: "DPU - Delivered at Place Unloaded" },
  { code: "EXW", labelTr: "EXW - İşyerinde Teslim", labelEn: "EXW - Ex Works" },
  { code: "FAS", labelTr: "FAS - Gemi Doğrultusunda Masrafsız", labelEn: "FAS - Free Alongside Ship" },
  { code: "FCA", labelTr: "FCA - Taşıyıcıya Masrafsız", labelEn: "FCA - Free Carrier" },
  { code: "FOB", labelTr: "FOB - Gemide Masrafsız", labelEn: "FOB - Free On Board" }
];

export default function EWaybillsTab({ storeId, lang, api, branding }: any) {
  const isTr = lang === 'tr';

  // Data states
  const [waybills, setWaybills] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter/Search states
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Selection states (for bulk invoice conversion)
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // UI Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [showHtmlModal, setShowHtmlModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  // HTML Viewer
  const [previewContent, setPreviewContent] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedWaybill, setSelectedWaybill] = useState<any>(null);

  // Invoice Conversion settings
  const [convertForm, setConvertForm] = useState({
    invoiceProfile: "TICARIFATURA",
    giInvoiceType: "SATIS",
    paymentMethod: "cash",
    notes: "",
    currency: "TRY"
  });

  // Waybill Form States
  const [formId, setFormId] = useState<number | null>(null);
  const [companyId, setCompanyId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [waybillDate, setWaybillDate] = useState(new Date().toISOString().split('T')[0]);
  const [waybillTime, setWaybillTime] = useState("12:00:00");
  const [actualDate, setActualDate] = useState(new Date().toISOString().split('T')[0]);
  const [actualTime, setActualTime] = useState("12:00:00");
  const [prefix, setPrefix] = useState("IRS");
  const [scenario, setScenario] = useState("TEMEL IRSALİYE");
  const [waybillType, setWaybillType] = useState("SEVK");
  const [driverName, setDriverName] = useState("");
  const [driverSurname, setDriverSurname] = useState("");
  const [driverVkn, setDriverVkn] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [trailerPlate, setTrailerPlate] = useState("");
  const [notes, setNotes] = useState("");
  const [currency, setCurrency] = useState("TRY");
  const [exchangeRate, setExchangeRate] = useState("1");
  const [items, setItems] = useState<any[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  const [isCargoShipment, setIsCargoShipment] = useState(false);
  const [deliveryTerm, setDeliveryTerm] = useState("CFR");
  const [transportMode, setTransportMode] = useState("1");
  const [cargoCarrier, setCargoCarrier] = useState("Aras Kargo");
  const [cargoNo, setCargoNo] = useState("");

  const [showProductDropdown, setShowProductDropdown] = useState<number | null>(null);
  const [showQuickProductModal, setShowQuickProductModal] = useState(false);
  const [quickProductRowIdx, setQuickProductRowIdx] = useState<number | null>(null);
  const [quickProductForm, setQuickProductForm] = useState<any>({
    name: "", category: "", sub_category: "", barcode: "", tax_rate: "20", price: "0", currency: "TRY"
  });

  const [customerSearch, setCustomerSearch] = useState("");
  const [showQuickCariModal, setShowQuickCariModal] = useState(false);
  const [quickCariSearchInitial, setQuickCariSearchInitial] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const waybillRes = await fetch(`/api/independent-waybills?storeId=${storeId}&search=${deferredSearch}&status=${statusFilter === 'all' ? '' : statusFilter}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (waybillRes.ok) setWaybills(await waybillRes.json());
      setCompanies(await api.getCompanies(storeId) || []);
      setCustomers(await api.getCustomers(storeId) || []);
      setProducts(await api.getProducts("", storeId) || []);
      try { setDrivers(await api.getDrivers(storeId) || []); } catch (err) {}
      try { setVehicles(await api.getVehicles(storeId) || []); } catch (err) {}
    } catch (err) {
      toast.error(isTr ? "Veriler yüklenirken bir hata oluştu." : "Error loading data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [storeId, deferredSearch, statusFilter]);

  const handleOpenCreateNew = () => {
    setFormId(null); setCompanyId(""); setCustomerId(""); setCustomerSearch("");
    setWaybillDate(new Date().toISOString().split('T')[0]);
    setWaybillTime(new Date().toLocaleTimeString('tr-TR', { hour12: false }));
    setActualDate(new Date().toISOString().split('T')[0]);
    setActualTime(new Date().toLocaleTimeString('tr-TR', { hour12: false }));
    setPrefix("IRS"); setScenario("TEMEL IRSALİYE"); setWaybillType("SEVK");
    setDriverName(""); setDriverSurname(""); setDriverVkn(""); setPlateNumber(""); setTrailerPlate("");
    setNotes(""); setCurrency(branding?.default_currency || "TRY"); setExchangeRate("1"); setDeliveryAddress("");
    setIsCargoShipment(false); setDeliveryTerm("CFR"); setTransportMode("1"); setCargoCarrier("Aras Kargo"); setCargoNo("");
    setItems([{ tempId: Date.now(), product_id: "", product_name: "", barcode: "", quantity: 1, unit_code: "Adet", unit_price: 0, tax_rate: 20 }]);
    setShowFormModal(true);
  };

  const handleOpenEdit = async (waybill: any) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/independent-waybills/${waybill.id}?storeId=${storeId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      setFormId(data.id);
      const cId = data.company_id ? String(data.company_id) : "";
      const cuId = data.customer_id ? String(data.customer_id) : "";
      setCompanyId(cId); setCustomerId(cuId);
      let initialSearch = "";
      if (cId) {
        const c = companies.find(x => String(x.id) === cId);
        if (c) initialSearch = c.title || c.name || "";
      } else if (cuId) {
        const cu = customers.find(x => String(x.id) === cuId);
        if (cu) initialSearch = `${cu.name || ""} ${cu.surname || ""}`.trim();
      }
      setCustomerSearch(initialSearch);
      setWaybillDate(new Date(data.waybill_date).toISOString().split('T')[0]);
      setWaybillTime(data.waybill_time || "12:00:00");
      setActualDate(new Date(data.actual_date).toISOString().split('T')[0]);
      setActualTime(data.actual_time || "12:00:00");
      setPrefix(data.prefix || "IRS"); setScenario(data.scenario || "TEMEL IRSALİYE"); setWaybillType(data.waybill_type || "SEVK");
      setDriverName(data.driver_name || ""); setDriverSurname(data.driver_surname || ""); setDriverVkn(data.driver_vkn || "");
      setPlateNumber(data.plate_number || ""); setTrailerPlate(data.trailer_plate || ""); setNotes(data.notes || "");
      setCurrency(data.currency || "TRY"); setExchangeRate(String(data.exchange_rate || 1)); setDeliveryAddress(data.delivery_address || "");
      setIsCargoShipment(!!data.is_cargo_shipment); setDeliveryTerm(data.delivery_term || "CFR");
      setTransportMode(data.transport_mode || "1"); setCargoCarrier(data.carrier_name || "Aras Kargo"); setCargoNo(data.tracking_number || "");
      const lItems = (data.items || []).map((i: any) => ({ ...i, tempId: i.id }));
      setItems(lItems.length > 0 ? lItems : [{ tempId: Date.now(), product_id: "", product_name: "", barcode: "", quantity: 1, unit_code: "Adet", unit_price: 0, tax_rate: 20 }]);
      setShowFormModal(true);
    } catch (err: any) { toast.error(isTr ? "İrsaliye detayları alınamadı" : "Error reading details"); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(isTr ? "Bu irsaliyi silmek istediğinizden emin misiniz?" : "Are you sure?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/independent-waybills/${id}?storeId=${storeId}`, {
        method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) { toast.success(isTr ? "İrsaliye silindi." : "Deleted."); fetchData(); setSelectedIds(prev => prev.filter(x => x !== id)); }
    } catch (err: any) { toast.error(err.message); }
  };

  const handleSaveWaybill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId && !customerId) { toast.error(isTr ? "Alıcı seçin." : "Select receiver."); return; }
    if (!isCargoShipment && !plateNumber.trim()) { toast.error(isTr ? "Plaka zorunludur." : "Plate is mandatory."); return; }
    const cleaned = items.filter(it => it.product_name.trim());
    if (cleaned.length === 0) { toast.error(isTr ? "Ürün ekleyin." : "Add items."); return; }
    const payload = {
      storeId: Number(storeId), company_id: companyId ? Number(companyId) : null, customer_id: customerId ? Number(customerId) : null,
      waybill_date: waybillDate, waybill_time: waybillTime, actual_date: actualDate, actual_time: actualTime,
      prefix, scenario, waybill_type: waybillType, driver_name: isCargoShipment ? "" : driverName, driver_surname: isCargoShipment ? "" : driverSurname,
      driver_vkn: isCargoShipment ? "" : driverVkn, plate_number: isCargoShipment ? "" : plateNumber, trailer_plate: isCargoShipment ? "" : trailerPlate,
      notes, currency, exchange_rate: Number(exchangeRate) || 1, delivery_address: deliveryAddress, items: cleaned,
      delivery_term: isCargoShipment ? deliveryTerm : null, transport_mode: isCargoShipment ? transportMode : null,
      carrier_name: isCargoShipment ? cargoCarrier : null, tracking_number: isCargoShipment ? cargoNo : null, is_cargo_shipment: isCargoShipment
    };
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(formId ? `/api/independent-waybills/${formId}` : '/api/independent-waybills', {
        method: formId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload)
      });
      if (res.ok) { toast.success(isTr ? "Kaydedildi." : "Saved."); setShowFormModal(false); fetchData(); }
      else { const d = await res.json(); toast.error(d.error || "Save failed."); }
    } catch (err: any) { toast.error(err.message); }
  };

  const handleSendToMysoft = async (id: number) => {
    const lid = toast.loading(isTr ? "İletiliyor..." : "Transmitting...");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/independent-waybills/${id}/send?storeId=${storeId}`, {
        method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) { toast.success(isTr ? "İletildi!" : "Sent!", { id: lid }); fetchData(); }
      else { const d = await res.json(); toast.error(d.error || "Failed.", { id: lid }); }
    } catch (err: any) { toast.error(err.message, { id: lid }); }
  };

  const handleCheckStatus = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/independent-waybills/${id}/status?storeId=${storeId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const d = await res.json();
      if (res.ok) { toast.success(`${isTr ? 'Durum' : 'Status'}: ${d.message || d.status}`); fetchData(); }
    } catch (err: any) { toast.error(err.message); }
  };

  const handlePrintView = async (waybill: any) => {
    setSelectedWaybill(waybill); setPreviewLoading(true); setPreviewContent(""); setShowHtmlModal(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/independent-waybills/${waybill.id}/html?storeId=${storeId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const html = await res.text();
        const styles = `
          <style>@media print { @page { size: A4 portrait; margin: 10mm; } body { width: 100%; margin: 0; -webkit-print-color-adjust: exact; } } body { max-width: 800px; margin: 0 auto; padding: 20px; }</style>
          <script>(function(){ function hp(){ const k=['fiyat','tutar','kdv','iskonto','matrah','toplam','price','total','tax','amount','currency','%']; const s=['miktarı','adeti','birimi','ürün','tarih','numara','plaka','adres','driver','plate']; document.querySelectorAll('table tr').forEach(r=>{ let toH=new Set(); r.querySelectorAll('th,td').forEach((c,i)=>{ const t=c.textContent.toLowerCase(); if(k.some(kw=>t.includes(kw))&&!s.some(sw=>t.includes(sw))) toH.add(i); }); r.querySelectorAll('th,td').forEach((c,i)=>{ if(toH.has(i)) c.style.display='none'; }); }); document.querySelectorAll('div,span,p,td,tr,li,strong,b').forEach(el=>{ const t=el.textContent.toLowerCase(); if(k.some(kw=>t.includes(kw))&&!s.some(sw=>t.includes(sw))&&t.length<100) el.style.display='none'; }); } hp(); setTimeout(hp,100); setTimeout(hp,1000); })();</script>
        `;
        setPreviewContent(html.replace("</head>", `${styles}</head>`));
      }
    } catch (err: any) { toast.error(err.message); setShowHtmlModal(false); } finally { setPreviewLoading(false); }
  };

  const handleViewDetails = async (waybill: any) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/independent-waybills/${waybill.id}?storeId=${storeId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) { setSelectedWaybill(await res.json()); setShowDetailsModal(true); }
    } catch (err: any) { toast.error(err.message); }
  };

  const handleAddItemRow = () => setItems(prev => [...prev, { tempId: Date.now(), product_id: "", product_name: "", barcode: "", quantity: 1, unit_code: "Adet", unit_price: 0, tax_rate: 20 }]);
  const handleRemoveItemRow = (idx: number) => { if (items.length > 1) setItems(prev => prev.filter((_, i) => i !== idx)); };
  const handleUpdateItem = (idx: number, key: string, value: any) => setItems(prev => { const c = [...prev]; c[idx] = { ...c[idx], [key]: value }; return c; });
  const selectProductForLine = (idx: number, p: any) => {
    setItems(prev => {
      const c = [...prev];
      c[idx] = { ...c[idx], product_id: String(p.id), product_name: p.name, barcode: p.barcode || "", unit_price: Number(p.price) || 0, unit_code: p.unit_code || "Adet" };
      return c;
    });
    setShowProductDropdown(null);
  };

  const handleQuickProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tax = Number(quickProductForm.tax_rate) || 20;
      const n = await api.addProduct({ ...quickProductForm, tax_rate: tax, stock_quantity: 0, status: 'active' }, storeId);
      setProducts(prev => [...prev, n]);
      if (quickProductRowIdx !== null) selectProductForLine(quickProductRowIdx, n);
      else handleAddItemRow();
      toast.success(isTr ? "Ürün kaydedildi." : "Product saved.");
      setShowQuickProductModal(false); setQuickProductRowIdx(null);
    } catch (err) { toast.error("Error"); }
  };

  const handleQuickCariSubmit = async (data: any) => {
    try {
      if (data.type === 'company') {
        const n = await api.addCompany({ title: data.title, phone: data.phone, email: data.email, tax_office: data.tax_office, tax_number: data.tax_number, currency: data.currency, address: data.address, status: 'active' }, storeId);
        setCompanies(prev => [...prev, n]); setCompanyId(String(n.id)); setCustomerId(""); setCustomerSearch(n.title || "");
        if (n.address) setDeliveryAddress(n.address);
      } else {
        const n = await api.addCustomer({ name: data.title, phone: data.phone, email: data.email, currency: data.currency, address: data.address, status: 'active' }, storeId);
        setCustomers(prev => [...prev, n]); setCustomerId(String(n.id)); setCompanyId(""); setCustomerSearch(n.name || "");
        if (n.address) setDeliveryAddress(n.address);
      }
      setShowQuickCariModal(false); toast.success(isTr ? "Kaydedildi" : "Saved");
    } catch (err: any) { toast.error(err.message); }
  };

  const handleBulkConversionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    const lid = toast.loading(isTr ? "Dönüştürülüyor..." : "Converting...");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/independent-waybills/convert-to-invoice", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ storeId: Number(storeId), waybillIds: selectedIds, ...convertForm })
      });
      const d = await res.json();
      if (res.ok) { toast.success(isTr ? `Fatura #${d.invoiceNumber} oluşturuldu!` : `Bill #${d.invoiceNumber} created!`, { id: lid }); setShowConvertModal(false); setSelectedIds([]); fetchData(); }
      else toast.error(d.error || "Failed", { id: lid });
    } catch (err: any) { toast.error(err.message, { id: lid }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Truck className="h-6 w-6 text-indigo-600" />
            {isTr ? "Sevk ve Taşıma İrsaliyeleri" : "Waybills & Shipments"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{isTr ? "Ürün sevkiyatlarını takip edin ve e-Faturaya dönüştürün." : "Track shipments and convert to e-Invoices."}</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {branding?.einvoice_settings?.is_active && (
            <button onClick={handleOpenCreateNew} className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 text-sm shadow-sm">
              <Plus className="h-4 w-4" /> {isTr ? "İrsaliye Oluştur" : "Create Waybill"}
            </button>
          )}
          <button onClick={() => {
            const clean = waybills.map(w => ({ ID: w.id, [isTr ? "No" : "No"]: w.waybill_number, [isTr ? "Tarih" : "Date"]: new Date(w.waybill_date).toLocaleDateString(), [isTr ? "Alıcı" : "Receiver"]: w.company_title || w.company_name || `${w.customer_name || ''} ${w.customer_surname || ''}`, [isTr ? "Plaka" : "Plate"]: w.plate_number, [isTr ? "Durum" : "Status"]: w.status }));
            const ws = XLSX.utils.json_to_sheet(clean); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "e-İrsaliyeler"); XLSX.writeFile(wb, "E_Irsaliyeler.xlsx");
          }} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold transition flex items-center justify-center gap-2 text-sm">
            <FileDown className="h-4 w-4 text-emerald-600" /> {isTr ? "Excel Çıktısı" : "Export Excel"}
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600"><Plus className="h-5 w-5" /></div>
            <div>
              <h3 className="text-sm font-bold text-indigo-900">{isTr ? `${selectedIds.length} İrsaliye Seçildi` : `${selectedIds.length} Selected`}</h3>
              <p className="text-xs text-indigo-700">{isTr ? "Seçtiğiniz irsaliyeleri faturaya dönüştürebilirsiniz." : "Convert selected waybills to invoice."}</p>
            </div>
          </div>
          <button onClick={() => { setConvertForm(p => ({ ...p, notes: isTr ? "Seçilen sevk irsaliyelerinden otomatik birleştirilmiştir." : "Automatically consolidated." })); setShowConvertModal(true); }} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition flex items-center gap-2 shadow-sm">
            <CheckCircle2 className="h-4 w-4" /> {isTr ? "Birleştirip Faturaya Dönüştür" : "Consolidate to Bill"}
          </button>
        </motion.div>
      )}

      <WaybillTable
        isTr={isTr} waybills={waybills} loading={loading} search={search} setSearch={setSearch}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter} selectedIds={selectedIds}
        toggleSelectAll={() => { const un = waybills.filter(w => !w.is_invoiced); setSelectedIds(selectedIds.length === un.length ? [] : un.map(w => w.id)); }}
        toggleSelectId={(id) => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])}
        handleCheckStatus={handleCheckStatus} handleSendToMysoft={handleSendToMysoft}
        handlePrintView={handlePrintView} handleOpenEdit={handleOpenEdit}
        handleViewDetails={handleViewDetails} handleDelete={handleDelete}
      />

      <AnimatePresence>
        {showFormModal && (
          <WaybillFormModal
            isOpen={showFormModal} onClose={() => setShowFormModal(false)} isTr={isTr} formId={formId}
            companies={companies} customers={customers} products={products} drivers={drivers} vehicles={vehicles}
            companyId={companyId} setCompanyId={setCompanyId} customerId={customerId} setCustomerId={setCustomerId}
            customerSearch={customerSearch} setCustomerSearch={setCustomerSearch} waybillDate={waybillDate}
            setWaybillDate={setWaybillDate} waybillTime={waybillTime} setWaybillTime={setWaybillTime}
            actualDate={actualDate} setActualDate={setActualDate} actualTime={actualTime} setActualTime={setActualTime}
            prefix={prefix} setPrefix={setPrefix} scenario={scenario} setScenario={setScenario}
            waybillType={waybillType} setWaybillType={setWaybillType} driverName={driverName} setDriverName={setDriverName}
            driverSurname={driverSurname} setDriverSurname={setDriverSurname} driverVkn={driverVkn} setDriverVkn={setDriverVkn}
            plateNumber={plateNumber} setPlateNumber={setPlateNumber} trailerPlate={trailerPlate} setTrailerPlate={setTrailerPlate}
            notes={notes} setNotes={setNotes} currency={currency} setCurrency={setCurrency}
            exchangeRate={exchangeRate} setExchangeRate={setExchangeRate} deliveryAddress={deliveryAddress}
            setDeliveryAddress={setDeliveryAddress} isCargoShipment={isCargoShipment} setIsCargoShipment={setIsCargoShipment}
            deliveryTerm={deliveryTerm} setDeliveryTerm={setDeliveryTerm} transportMode={transportMode}
            setTransportMode={setTransportMode} cargoCarrier={cargoCarrier} setCargoCarrier={setCargoCarrier}
            cargoNo={cargoNo} setCargoNo={setCargoNo} items={items} handleUpdateItem={handleUpdateItem}
            handleAddItemRow={handleAddItemRow} handleRemoveItemRow={handleRemoveItemRow}
            selectProductForLine={selectProductForLine} showProductDropdown={showProductDropdown}
            setShowProductDropdown={setShowProductDropdown} handleSaveWaybill={handleSaveWaybill}
            setShowQuickProductModal={setShowQuickProductModal} setQuickProductRowIdx={setQuickProductRowIdx}
            setShowQuickCariModal={setShowQuickCariModal} setQuickCariSearchInitial={setQuickCariSearchInitial}
            INCOTERMS_LIST={INCOTERMS_LIST}
          />
        )}
      </AnimatePresence>

      <WaybillDetailsModal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} isTr={isTr} selectedWaybill={selectedWaybill} />
      <WaybillHtmlModal isOpen={showHtmlModal} onClose={() => setShowHtmlModal(false)} isTr={isTr} selectedWaybill={selectedWaybill} previewLoading={previewLoading} previewContent={previewContent} />
      <WaybillConvertModal isOpen={showConvertModal} onClose={() => setShowConvertModal(false)} isTr={isTr} selectedIds={selectedIds} convertForm={convertForm} setConvertForm={setConvertForm} handleBulkConversionSubmit={handleBulkConversionSubmit} />

      <QuickProductModal 
        isOpen={showQuickProductModal} onClose={() => { setShowQuickProductModal(false); setQuickProductRowIdx(null); }}
        isTr={isTr} quickProductForm={quickProductForm} setQuickProductForm={setQuickProductForm} handleQuickProductSubmit={handleQuickProductSubmit}
      />

      <QuickCariModal isOpen={showQuickCariModal} onClose={() => setShowQuickCariModal(false)} isTr={isTr} initialValue={quickCariSearchInitial} onSubmit={handleQuickCariSubmit} />
    </div>
  );
}
