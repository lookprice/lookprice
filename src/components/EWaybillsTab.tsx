import React, { useState, useEffect, useDeferredValue } from "react";
import { 
  Plus, 
  Search, 
  Trash2, 
  FileDown, 
  Eye, 
  X, 
  Save, 
  Calendar, 
  User as UserIcon, 
  Hash, 
  Package, 
  Truck, 
  Printer, 
  CloudUpload, 
  RefreshCw, 
  Loader2, 
  CheckCircle2, 
  Edit, 
  Building2, 
  Divide,
  XCircle,
  FileText,
  MapPin,
  Ship
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from 'xlsx';

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

  // Saved drivers and vehicles from fleet
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  // Cargo/Courier Shipment states
  const [isCargoShipment, setIsCargoShipment] = useState(false);
  const [deliveryTerm, setDeliveryTerm] = useState("CFR");
  const [transportMode, setTransportMode] = useState("1");
  const [cargoCarrier, setCargoCarrier] = useState("Aras Kargo");
  const [cargoNo, setCargoNo] = useState("");

  // Product Dropdown inside line items helper
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState<number | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch waybills
      const waybillRes = await fetch(`/api/independent-waybills?search=${deferredSearch}&status=${statusFilter === 'all' ? '' : statusFilter}`);
      if (waybillRes.ok) {
        const data = await waybillRes.json();
        setWaybills(data);
      }

      // 2. Fetch companies
      const compRes = await api.getCompanies(storeId);
      setCompanies(compRes || []);

      // 3. Fetch customers
      const custRes = await api.getCustomers(storeId);
      setCustomers(custRes || []);

      // 4. Fetch products
      const prodRes = await api.getProducts(storeId);
      setProducts(prodRes || []);

      // 5. Fetch drivers
      try {
        const driversRes = await api.getDrivers(storeId);
        setDrivers(driversRes || []);
      } catch (err) {
        console.error("Drivers fetch failed:", err);
      }

      // 6. Fetch vehicles
      try {
        const vehiclesRes = await api.getVehicles(storeId);
        setVehicles(vehiclesRes || []);
      } catch (err) {
        console.error("Vehicles fetch failed:", err);
      }

    } catch (err) {
      console.error(err);
      toast.error(isTr ? "Veriler yüklenirken bir hata oluştu." : "Error loading data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [storeId, deferredSearch, statusFilter]);

  // Open creation form
  const handleOpenCreateNew = () => {
    setFormId(null);
    setCompanyId("");
    setCustomerId("");
    setWaybillDate(new Date().toISOString().split('T')[0]);
    setWaybillTime(new Date().toLocaleTimeString('tr-TR', { hour12: false }));
    setActualDate(new Date().toISOString().split('T')[0]);
    setActualTime(new Date().toLocaleTimeString('tr-TR', { hour12: false }));
    setPrefix("IRS");
    setScenario("TEMEL IRSALİYE");
    setWaybillType("SEVK");
    setDriverName("");
    setDriverSurname("");
    setDriverVkn("");
    setPlateNumber("");
    setTrailerPlate("");
    setNotes("");
    setCurrency(branding?.default_currency || "TRY");
    setExchangeRate("1");
    setDeliveryAddress("");
    setIsCargoShipment(false);
    setDeliveryTerm("CFR");
    setTransportMode("1");
    setCargoCarrier("Aras Kargo");
    setCargoNo("");
    setItems([{ tempId: Date.now(), product_id: "", product_name: "", barcode: "", quantity: 1, unit_code: "Adet", unit_price: 0, tax_rate: 20 }]);
    setShowFormModal(true);
  };

  // Open edit form
  const handleOpenEdit = async (waybill: any) => {
    try {
      const res = await fetch(`/api/independent-waybills/${waybill.id}`);
      if (!res.ok) throw new Error("Could not retrieve details");
      const data = await res.json();

      setFormId(data.id);
      setCompanyId(data.company_id ? String(data.company_id) : "");
      setCustomerId(data.customer_id ? String(data.customer_id) : "");
      setWaybillDate(new Date(data.waybill_date).toISOString().split('T')[0]);
      setWaybillTime(data.waybill_time || "12:00:00");
      setActualDate(new Date(data.actual_date).toISOString().split('T')[0]);
      setActualTime(data.actual_time || "12:00:00");
      setPrefix(data.prefix || "IRS");
      setScenario(data.scenario || "TEMEL IRSALİYE");
      setWaybillType(data.waybill_type || "SEVK");
      setDriverName(data.driver_name || "");
      setDriverSurname(data.driver_surname || "");
      setDriverVkn(data.driver_vkn || "");
      setPlateNumber(data.plate_number || "");
      setTrailerPlate(data.trailer_plate || "");
      setNotes(data.notes || "");
      setCurrency(data.currency || "TRY");
      setExchangeRate(String(data.exchange_rate || 1));
      setDeliveryAddress(data.delivery_address || "");
      setIsCargoShipment(!!data.is_cargo_shipment);
      setDeliveryTerm(data.delivery_term || "CFR");
      setTransportMode(data.transport_mode || "1");
      setCargoCarrier(data.carrier_name || "Aras Kargo");
      setCargoNo(data.tracking_number || "");
      
      const loadedItems = (data.items || []).map((i: any) => ({
        ...i,
        tempId: i.id
      }));

      setItems(loadedItems.length > 0 ? loadedItems : [{ tempId: Date.now(), product_id: "", product_name: "", barcode: "", quantity: 1, unit_code: "Adet", unit_price: 0, tax_rate: 20 }]);
      setShowFormModal(true);
    } catch (err: any) {
      toast.error(isTr ? "İrsaliye detayları alınamadı: " + err.message : "Error reading waybill details.");
    }
  };

  // Delete handler
  const handleDelete = async (id: number) => {
    if (!window.confirm(isTr ? "Bu irsaliyi silmek istediğinizden emin misiniz?" : "Are you sure you want to delete this waybill?")) return;
    try {
      const res = await fetch(`/api/independent-waybills/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(isTr ? "İrsaliye silindi." : "Waybill deleted successfully.");
        fetchData();
        setSelectedIds(prev => prev.filter(x => x !== id));
      } else {
        const data = await res.json();
        toast.error(data.error || "Error");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Submit Handler (Create or Update)
  const handleSaveWaybill = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyId && !customerId) {
      toast.error(isTr ? "Lütfen bir alıcı (Cari veya Şahıs Müşteri) seçin." : "Please select a receiver (Company or Customer).");
      return;
    }

    if (!isCargoShipment && !plateNumber.trim()) {
      toast.error(isTr ? "GİB Şema kuralları gereği Araç Plaka Numarası doldurulması zorunludur." : "Plate Number is mandatory for GİB rules.");
      return;
    }

    const cleanedItems = items.filter(it => it.product_name.trim());
    if (cleanedItems.length === 0) {
      toast.error(isTr ? "Lütfen en az bir geçerli ürün ekleyin." : "Please add at least one line item.");
      return;
    }

    const payload = {
      company_id: companyId ? Number(companyId) : null,
      customer_id: customerId ? Number(customerId) : null,
      waybill_date: waybillDate,
      waybill_time: waybillTime,
      actual_date: actualDate,
      actual_time: actualTime,
      prefix,
      scenario,
      waybill_type: waybillType,
      driver_name: isCargoShipment ? "" : driverName,
      driver_surname: isCargoShipment ? "" : driverSurname,
      driver_vkn: isCargoShipment ? "" : driverVkn,
      plate_number: isCargoShipment ? "" : plateNumber,
      trailer_plate: isCargoShipment ? "" : trailerPlate,
      notes,
      currency,
      exchange_rate: Number(exchangeRate) || 1,
      delivery_address: deliveryAddress,
      items: cleanedItems,
      delivery_term: isCargoShipment ? deliveryTerm : null,
      transport_mode: isCargoShipment ? transportMode : null,
      carrier_name: isCargoShipment ? cargoCarrier : null,
      tracking_number: isCargoShipment ? cargoNo : null,
      is_cargo_shipment: isCargoShipment
    };

    try {
      const url = formId ? `/api/independent-waybills/${formId}` : '/api/independent-waybills';
      const method = formId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(isTr ? "İrsaliye başarıyla kaydedildi." : "Waybill saved successfully.");
        setShowFormModal(false);
        fetchData();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || (isTr ? "Kayıt işlemi başarısız." : "Save unsuccessful."));
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Send to MySoft
  const handleSendToMysoft = async (id: number) => {
    const loaderId = toast.loading(isTr ? "E-İrsaliye MySoft entegratörüne iletiliyor..." : "Transmitting waybill to Mysoft...");
    try {
      const res = await fetch(`/api/independent-waybills/${id}/send`, { method: 'POST' });
      if (res.ok) {
        toast.success(isTr ? "E-İrsaliye başarıyla iletildi!" : "E-Waybill transmitted successfully!", { id: loaderId });
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Transmission failed.", { id: loaderId });
      }
    } catch (err: any) {
      toast.error(err.message, { id: loaderId });
    }
  };

  // Sync / check status
  const handleCheckStatus = async (id: number) => {
    try {
      const res = await fetch(`/api/independent-waybills/${id}/status`);
      const data = await res.json();
      if (res.ok) {
        toast.success(`${isTr ? 'GİB Durumu' : 'GİB Status'}: ${data.message || data.status}`);
        fetchData();
      } else {
        toast.error(data.error || "Status inquiry failed");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Fetch HTML representation
  const handlePrintView = async (waybill: any) => {
    setSelectedWaybill(waybill);
    setPreviewLoading(true);
    setPreviewContent("");
    setShowHtmlModal(true);

    try {
      const res = await fetch(`/api/independent-waybills/${waybill.id}/html`);
      if (res.ok) {
        const html = await res.text();
        setPreviewContent(html);
      } else {
        toast.error(isTr ? "Görsel alınamadı (Taslak olabilir)" : "Could not retrieve visual (might be draft)");
        setShowHtmlModal(false);
      }
    } catch (err: any) {
      toast.error(err.message);
      setShowHtmlModal(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  // View draft particulars
  const handleViewDetails = async (waybill: any) => {
    try {
      const res = await fetch(`/api/independent-waybills/${waybill.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedWaybill(data);
        setShowDetailsModal(true);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Items Helper
  const handleAddItemRow = () => {
    setItems(prev => [...prev, { tempId: Date.now(), product_id: "", product_name: "", barcode: "", quantity: 1, unit_code: "Adet", unit_price: 0, tax_rate: 20 }]);
  };

  const handleRemoveItemRow = (idx: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateItem = (idx: number, key: string, value: any) => {
    setItems(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [key]: value };
      return copy;
    });
  };

  const selectProductForLine = (idx: number, product: any) => {
    setItems(prev => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        product_id: String(product.id),
        product_name: product.name,
        barcode: product.barcode || "",
        unit_price: Number(product.price) || 0,
        unit_code: product.unit_code || "Adet"
      };
      return copy;
    });
    setShowProductDropdown(null);
  };

  // Calculate totals
  const getSubtotal = () => {
    return items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)), 0);
  };

  const getTaxTotal = () => {
    return items.reduce((sum, item) => {
      const q = Number(item.quantity) || 0;
      const up = Number(item.unit_price) || 0;
      const tr = Number(item.tax_rate) || 20;
      return sum + (q * up * (tr / 100));
    }, 0);
  };

  const getGrandTotal = () => {
    return getSubtotal() + getTaxTotal();
  };

  // Excel Export
  const handleExportExcel = () => {
    const cleanList = waybills.map(w => ({
      ID: w.id,
      [isTr ? "İrsaliye No" : "Waybill No"]: w.waybill_number,
      [isTr ? "Tarih" : "Date"]: new Date(w.waybill_date).toLocaleDateString(),
      [isTr ? "Cari / Alıcı" : "Customer / Title"]: w.company_title || w.company_name || `${w.customer_name || ''} ${w.customer_surname || ''}`,
      [isTr ? "Sürücü" : "Driver"]: `${w.driver_name || ''} ${w.driver_surname || ''}`,
      [isTr ? "Plaka" : "Plate"]: w.plate_number,
      [isTr ? "Tutar" : "Net Total"]: w.total_amount,
      [isTr ? "KDV Tutar" : "Tax Total"]: w.tax_amount,
      [isTr ? "Genel Toplam" : "Grand Total"]: w.grand_total,
      [isTr ? "Durum" : "Status"]: w.status.toUpperCase(),
      [isTr ? "E-Fatura Bağlantısı" : "Bill Connection"]: w.is_invoiced ? `${isTr ? "Faturalandı": "Billed"} (#${w.linked_invoice_number || ""})` : (isTr ? "Bekliyor" : "Unbilled")
    }));

    const ws = XLSX.utils.json_to_sheet(cleanList);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "e-İrsaliyeler");
    XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    XLSX.writeFile(wb, "E_Irsaliyeler_Rapor.xlsx");
    toast.success(isTr ? "Excel raporu indirildi." : "Excel report downloaded.");
  };

  // Convert Waybills to a single Draft Sales Invoice
  const handleBulkConversionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;

    const loaderId = toast.loading(isTr ? "İrsaliyeler birleştirilip e-Faturaya dönüştürülüyor..." : "Consolidating waybills into e-invoice...");
    try {
      const res = await fetch("/api/independent-waybills/convert-to-invoice", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waybillIds: selectedIds,
          invoiceProfile: convertForm.invoiceProfile,
          giInvoiceType: convertForm.giInvoiceType,
          paymentMethod: convertForm.paymentMethod,
          notes: convertForm.notes,
          currency: convertForm.currency
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(
          isTr 
            ? `BAŞARILI! İrsaliyeler birleştirildi ve Taslak Fatura #${data.invoiceNumber} oluşturuldu!` 
            : `SUCCESS! Waybills consolidated and Draft Invoice #${data.invoiceNumber} created!`,
          { id: loaderId, duration: 6000 }
        );
        setShowConvertModal(false);
        setSelectedIds([]);
        fetchData();
      } else {
        toast.error(data.error || "Invoice generation failed.", { id: loaderId });
      }
    } catch (err: any) {
      toast.error(err.message, { id: loaderId });
    }
  };

  // Selection toggles
  const toggleSelectAll = () => {
    const unbilledOnly = waybills.filter(w => !w.is_invoiced);
    if (selectedIds.length === unbilledOnly.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(unbilledOnly.map(w => w.id));
    }
  };

  const toggleSelectId = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const getStatusBadgeClass = (status: string) => {
    const styleMap: any = {
      draft: "bg-slate-100 text-slate-700 border-slate-200",
      queued: "bg-amber-50 text-amber-700 border-amber-200 animate-pulse",
      success: "bg-emerald-50 text-emerald-700 border-emerald-200",
      error: "bg-rose-50 text-rose-700 border-rose-200"
    };
    return `inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${styleMap[status.toLowerCase()] || 'bg-slate-100'}`;
  };

  return (
    <div className="space-y-6">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Truck className="h-6 w-6 text-indigo-600" />
            {isTr ? "Sevk ve Taşıma İrsaliyeleri" : "Waybills & Shipments"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isTr 
              ? "Ürün sevkiyatı ve şubeler arası taşıma irsaliyelerini taklip edin, resmileştirin ve topluca e-Faturaya dönüştürün."
              : "Track and officialize e-Waybills of shipment dispatches, and consolidate them into invoices latter."}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {branding?.einvoice_settings?.is_active && (
            <button
              id="btn_create_waybill"
              onClick={handleOpenCreateNew}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 text-sm shadow-sm"
            >
              <Plus className="h-4 w-4" />
              {isTr ? "İrsaliye Oluştur" : "Create Waybill"}
            </button>
          )}

          <button
            id="btn_export_waybill_xls"
            onClick={handleExportExcel}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold transition flex items-center justify-center gap-2 text-sm"
          >
            <FileDown className="h-4 w-4 text-emerald-600" />
            {isTr ? "Excel Çıktısı" : "Export Excel"}
          </button>
        </div>
      </div>

      {/* Bulk action alert toolbar */}
      {selectedIds.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-indigo-900">
                {isTr 
                  ? `${selectedIds.length} Adet İrsaliye Seçildi` 
                  : `${selectedIds.length} Waybill Selected`}
              </h3>
              <p className="text-xs text-indigo-700">
                {isTr 
                  ? "Seçtiğiniz irsaliyeleri birleştirerek tek bir toplu Satış Faturası haline getirebilirsiniz." 
                  : "Consolidate selected waybills into a single client sales invoice draft."}
              </p>
            </div>
          </div>

          <button
            id="btn_convert_bulk_to_bill"
            onClick={() => {
              // Pre-fill notes
              setConvertForm(prev => ({
                ...prev,
                notes: isTr 
                  ? "Seçilen sevk irsaliyelerinden otomatik birleştirilmiştir."
                  : "Automatically consolidated from chosen shipment dispatches."
              }));
              setShowConvertModal(true);
            }}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition flex items-center gap-2 shadow-sm"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isTr ? "Birleştirip Faturaya Dönüştür" : "Consolidate to Sales Invoice"}
          </button>
        </motion.div>
      )}

      {/* Main content table filter area */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={isTr ? "Seri No, İrsaliye Numarası veya Muhattap Cari ara..." : "Search waybill number, driver or firm..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-xl border border-slate-200 outline-none text-sm focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">{isTr ? "Durum Filtresi:" : "Status filter:"}</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 outline-none"
            >
              <option value="all">{isTr ? "Tüm İrsaliyeler" : "All Waybills"}</option>
              <option value="draft">{isTr ? "Taslak" : "Draft"}</option>
              <option value="queued">{isTr ? "Kuyrukta" : "Queued"}</option>
              <option value="success">{isTr ? "Başarılı" : "Success"}</option>
              <option value="error">{isTr ? "Hatalı" : "Error"}</option>
            </select>
          </div>
        </div>

        {/* Table representation */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            <p className="text-sm font-semibold">{isTr ? "Yükleniyor..." : "Loading..."}</p>
          </div>
        ) : waybills.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Truck className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-medium">{isTr ? "Aranan kriterlere uygun irsaliye kaydı bulunamadı." : "No waybill records found."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-4 px-5 w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === waybills.filter(w=>!w.is_invoiced).length}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                  </th>
                  <th className="py-4 px-4">{isTr ? "İrsaliye No / Seri" : "Waybill Number"}</th>
                  <th className="py-4 px-4">{isTr ? "Alıcı / Cari" : "Receiver Business"}</th>
                  <th className="py-4 px-4">{isTr ? "Tevzi Tarihi" : "Logistics Dates"}</th>
                  <th className="py-4 px-4">{isTr ? "Nakliye & Plaka" : "Logistics info"}</th>
                  <th className="py-4 px-4 text-right">{isTr ? "Genel Toplam" : "Grand Total"}</th>
                  <th className="py-4 px-4 text-center">{isTr ? "Durum" : "Status"}</th>
                  <th className="py-4 px-5 text-right">{isTr ? "İşlemler" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {waybills.map((w) => {
                  const label = w.company_title || w.company_name || `${w.customer_name || ''} ${w.customer_surname || ''}` || (isTr ? "Genel Müşteri / Şube" : "Generic Branch / Customer");
                  const isChecked = selectedIds.includes(w.id);

                  return (
                    <tr key={w.id} className={`hover:bg-slate-50/80 transition-colors ${isChecked ? 'bg-indigo-50/30' : ''}`}>
                      <td className="py-3.5 px-5">
                        <input
                          type="checkbox"
                          disabled={w.is_invoiced}
                          checked={isChecked}
                          onChange={() => toggleSelectId(w.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          {w.waybill_number}
                          {w.is_invoiced && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                              {isTr ? "FATURALANDI" : "BILLED"}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <span>{w.scenario}</span>
                          <span>•</span>
                          <span>{w.prefix}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {label}
                        {w.linked_invoice_number && (
                          <div className="text-xs text-slate-500 mt-0.5 font-normal flex items-center gap-1">
                            <FileText className="h-3 w-3 text-slate-400" />
                            {isTr ? `Kapsayan Fatura: ${w.linked_invoice_number}` : `Parent Invoice: ${w.linked_invoice_number}`}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-600">
                        <div>{new Date(w.waybill_date).toLocaleDateString('tr-TR')}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{w.waybill_time || "12:00"}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <div className="font-bold">{w.plate_number || (isTr ? "Kendi Sürücüsü/Yaya" : "Self Carrier")}</div>
                        <div className="text-slate-400 mt-0.5">
                          {w.driver_name ? `${w.driver_name} ${w.driver_surname}` : (isTr ? "Sürücü Belirtilmedi" : "Driver generic")}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {Number(w.grand_total).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {w.currency || 'TRY'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={getStatusBadgeClass(w.status)}>
                          {w.status === 'draft' && (isTr ? "Taslak" : "Draft")}
                          {w.status === 'queued' && (isTr ? "Kuyrukta" : "Queued")}
                          {w.status === 'success' && (isTr ? "GİB Gönderildi" : "GİB Approved")}
                          {w.status === 'error' && (isTr ? "Hata" : "Error")}
                        </span>
                        {w.message && (
                          <div className="text-[10px] text-slate-400 mt-1 max-w-[120px] mx-auto truncate" title={w.message}>
                            {w.message}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-1.5 whitespace-nowrap">
                        {/* Status Check / Queue status */}
                        {w.status === 'queued' && (
                          <button
                            title={isTr ? "Durum Sorgula" : "Check state"}
                            onClick={() => handleCheckStatus(w.id)}
                            className="p-1 px-2 rounded-lg text-amber-600 hover:bg-amber-50 border border-amber-200 text-xs font-bold transition inline-flex items-center gap-1"
                          >
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            {isTr ? "Sorgula" : "Query"}
                          </button>
                        )}

                        {/* Send option for dry draft */}
                        {(w.status === 'draft' || w.status === 'error') && (
                          <button
                            title={isTr ? "GİB e-İrsaliye olarak Gönder" : "Transmit as actual e-waybill"}
                            onClick={() => handleSendToMysoft(w.id)}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 transition inline-flex items-center gap-1"
                          >
                            <CloudUpload className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Edit option */}
                        {(w.status === 'draft' || w.status === 'error') && (
                          <button
                            title={isTr ? "İrsaliye Düzenle" : "Edit draft details"}
                            onClick={() => handleOpenEdit(w)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition inline-flex"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Visual Printout view (Only for successfully sent/official waybills) */}
                        {w.ettn && (
                          <button
                            title={isTr ? "Yazdır / PDF Görsel" : "Visual Document Page HTML"}
                            onClick={() => handlePrintView(w)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-indigo-600 transition inline-flex"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Inspect info details */}
                        <button
                          title={isTr ? "Muhteva İncele" : "Inspect draft contents"}
                          onClick={() => handleViewDetails(w)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 transition inline-flex"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete option */}
                        {(w.status === 'draft' || w.status === 'error') && !w.is_invoiced && (
                          <button
                            title={isTr ? "Sil" : "Wipe record"}
                            onClick={() => handleDelete(w.id)}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition inline-flex"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: FORM MODAL (CREATE OR UPDATE) */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100"
            >
              {/* Modal Header */}
              <div className="p-4 px-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {formId ? (isTr ? "e-İrsaliye Bilgilerini Düzenle" : "Modify e-Waybill details") : (isTr ? "Yeni e-İrsaliye Belgesi Oluştur" : "Create New e-Waybill")}
                    </h2>
                    <p className="text-xs text-slate-500">{isTr ? "GİB Şema Uyumlu döküman tasarımı" : "GİB Scheme-compliant document formulation"}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowFormModal(false)}
                  className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveWaybill} className="overflow-y-auto p-6 flex-1 space-y-6">
                
                {/* section 1: Buyer/Sender Accounts information */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Select Receiver entity */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">{isTr ? "Vkn/Tckn - Ünvan (Alıcı Seçimi)" : "Vkn/Tckn - Receiver (Business/Cari Select)"}</label>
                    <select
                      value={companyId ? `company-${companyId}` : customerId ? `customer-${customerId}` : ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          setCompanyId("");
                          setCustomerId("");
                          setDeliveryAddress("");
                        } else if (val.startsWith("company-")) {
                          const cid = val.replace("company-", "");
                          setCompanyId(cid);
                          setCustomerId("");
                          const comp = companies.find(c => String(c.id) === String(cid));
                          if (comp) {
                            setDeliveryAddress(comp.delivery_address || comp.address || "");
                          }
                        } else if (val.startsWith("customer-")) {
                          const cuid = val.replace("customer-", "");
                          setCustomerId(cuid);
                          setCompanyId("");
                          const cust = customers.find(cu => String(cu.id) === String(cuid));
                          if (cust) {
                            setDeliveryAddress(cust.address || "");
                          }
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-indigo-500 transition font-medium"
                    >
                      <option value="">{isTr ? "-- Alıcı Seçin --" : "-- Select Recipient --"}</option>
                      <optgroup label={isTr ? "Cari Firmalar" : "B2B Companies"}>
                        {companies.map(c => (
                          <option key={`c-${c.id}`} value={`company-${c.id}`}>{c.title || c.name} ({c.tax_number || "VKN Yok"})</option>
                        ))}
                      </optgroup>
                      <optgroup label={isTr ? "Şahıs / Bireysel Müşteriler" : "Direct Customers"}>
                        {customers.map(cu => (
                          <option key={`cu-${cu.id}`} value={`customer-${cu.id}`}>{cu.name} {cu.surname || ""} ({cu.phone || "Telefon Yok"})</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Document date & dispatch dates */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block">{isTr ? "İrsaliye Tarihi" : "Waybill Date"}</label>
                      <input
                        type="date"
                        value={waybillDate}
                        onChange={(e) => setWaybillDate(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block">{isTr ? "İrsaliye Saati" : "Waybill Time"}</label>
                      <input
                        type="time"
                        step="1"
                        value={waybillTime}
                        onChange={(e) => setWaybillTime(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block">{isTr ? "Seri Öneki" : "Prefix"}</label>
                      <input
                        type="text"
                        maxLength={3}
                        value={prefix}
                        onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition bg-slate-50 font-bold text-indigo-700 uppercase"
                      />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <label className="text-xs font-bold text-slate-600 block">{isTr ? "İrsaliye Tipi" : "Despatch Type"}</label>
                      <select
                        value={waybillType}
                        onChange={(e) => setWaybillType(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-sm outline-none bg-white font-semibold text-slate-700"
                      >
                        <option value="SEVK">{isTr ? "SEVK (Müşteriye Gönderim)" : "SEVK"}</option>
                        <option value="INTERNAL">{isTr ? "FİRMA İÇİ SEVK (Kayıtlı Şubeler Arası)" : "INTERNAL DISPATCH"}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block">{isTr ? "Sevk (Fiili) Tarihi" : "Shipment Date"}</label>
                      <input
                        type="date"
                        value={actualDate}
                        onChange={(e) => setActualDate(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block">{isTr ? "Sevk (Fiili) Saati" : "Shipment Time"}</label>
                      <input
                        type="time"
                        step="1"
                        value={actualTime}
                        onChange={(e) => setActualTime(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                </div>

                {/* section 1.5: Delivery and Shipment address selection */}
                {(() => {
                  const selectedComp = companies.find(c => String(c.id) === String(companyId));
                  return (
                    <div className="bg-rose-50/10 p-4 rounded-xl border border-rose-100/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-rose-700 uppercase tracking-widest flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-rose-500" />
                          {isTr ? "Sevk ve Teslimat Adresi (2. Adres)" : "Dispatch & Delivery Address (2nd Address)"}
                        </h3>
                        {selectedComp && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setDeliveryAddress(selectedComp.address || "")}
                              className={`px-2 py-0.5 text-[9px] font-black rounded-lg transition-all cursor-pointer ${
                                deliveryAddress === selectedComp.address
                                  ? "bg-rose-600 text-white"
                                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                              }`}
                            >
                              {isTr ? "Ana Adres (Fatura)" : "Billing Address"}
                            </button>
                            {selectedComp.delivery_address && (
                              <button
                                type="button"
                                onClick={() => setDeliveryAddress(selectedComp.delivery_address || "")}
                                className={`px-2 py-0.5 text-[9px] font-black rounded-lg transition-all cursor-pointer ${
                                  deliveryAddress === selectedComp.delivery_address
                                    ? "bg-rose-600 text-white"
                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                }`}
                              >
                                {isTr ? "Sevk Adresi (2. Adres)" : "Saved Delivery Address"}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <textarea
                        rows={2}
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder={isTr ? "Malın teslim edileceği sevk adresi..." : "Address where products will be dispatched..."}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-rose-500 transition bg-white text-slate-700 font-medium"
                      />
                    </div>
                  );
                })()}

                {/* section 2: Shipment carrier driver plate logitics info details */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                      <Truck className="h-4 w-4 text-indigo-500" />
                      {isTr ? "Lojistik / Sevkiyat Bilgileri" : "Logistics & Despatch Details"}
                    </h3>

                    {/* Sliding Mode Segmented Tab */}
                    <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto border border-slate-200/50">
                      <button
                        type="button"
                        onClick={() => setIsCargoShipment(false)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${!isCargoShipment ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        <UserIcon className="h-3 w-3" />
                        {isTr ? "Kendi Sürücü/Aracımız" : "Self Logistics"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCargoShipment(true)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${isCargoShipment ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        <Ship className="h-3 w-3" />
                        {isTr ? "Kargo Firması ile Sevk" : "Cargo Shipment"}
                      </button>
                    </div>
                  </div>

                  {!isCargoShipment ? (
                    <div className="space-y-4 animate-fadeIn">
                      {/* Fleet Quick Selection */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-100">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">
                            {isTr ? "⚡ Hızlı Sürücü Seçimi (Filo)" : "⚡ Quick Driver Selection (Fleet)"}
                          </label>
                          <select
                            onChange={(e) => {
                              const selectedDriver = drivers.find(d => String(d.id) === e.target.value);
                              if (selectedDriver) {
                                const names = (selectedDriver.name || "").trim().split(" ");
                                const sName = names.slice(-1)[0] || "";
                                const fName = names.slice(0, -1).join(" ") || selectedDriver.name || "";
                                setDriverName(fName);
                                setDriverSurname(sName);
                                setDriverVkn(selectedDriver.national_id || selectedDriver.license_number || "");
                                toast.success(isTr ? `Sürücü ${selectedDriver.name} bilgileri dolduruldu.` : `Driver ${selectedDriver.name} filled.`);
                              }
                            }}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-indigo-50/30 hover:bg-indigo-50/50 transition font-bold"
                          >
                            <option value="">{isTr ? "-- Kayıtlı Sürücülerden Seç --" : "-- Choose from Saved Drivers --"}</option>
                            {drivers.map(d => (
                              <option key={d.id} value={d.id}>{d.name} {d.phone ? `(${d.phone})` : ''}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">
                            {isTr ? "⚡ Hızlı Araç Seçimi (Filo)" : "⚡ Quick Vehicle Selection (Fleet)"}
                          </label>
                          <select
                            onChange={(e) => {
                              const selectedVehicle = vehicles.find(v => String(v.id) === e.target.value);
                              if (selectedVehicle) {
                                setPlateNumber(selectedVehicle.plate || "");
                                toast.success(isTr ? `Araç Plaka ${selectedVehicle.plate} dolduruldu.` : `Vehicle plate ${selectedVehicle.plate} filled.`);
                              }
                            }}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-indigo-50/30 hover:bg-indigo-50/50 transition font-bold"
                          >
                            <option value="">{isTr ? "-- Kayıtlı Araçlardan Seç --" : "-- Choose from Saved Vehicles --"}</option>
                            {vehicles.map(v => (
                              <option key={v.id} value={v.id}>{v.plate} ({v.brand} {v.model})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Self logistics inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500 block">{isTr ? "Sürücü Adı" : "Driver Name"}</label>
                          <input
                            type="text"
                            value={driverName}
                            onChange={(e) => setDriverName(e.target.value)}
                            placeholder="Örn: Ahmet"
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition bg-white"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500 block">{isTr ? "Sürücü Soyadı" : "Driver Surname"}</label>
                          <input
                            type="text"
                            value={driverSurname}
                            onChange={(e) => setDriverSurname(e.target.value)}
                            placeholder="Örn: Yılmaz"
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition bg-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500 block">{isTr ? "Sürücü TCKN / VKN" : "Driver ID/VKN"}</label>
                          <input
                            type="text"
                            maxLength={11}
                            value={driverVkn}
                            onChange={(e) => setDriverVkn(e.target.value.replace(/\D/g, ''))}
                            placeholder="11111111111"
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition bg-white font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500 block">
                            {isTr ? "Araç Plaka No *" : "Plate Number *"}
                          </label>
                          <input
                            type="text"
                            required={!isCargoShipment}
                            value={plateNumber}
                            onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                            placeholder="Örn: 34ABC123"
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-indigo-500 transition bg-white font-bold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500 block">{isTr ? "Dorse / Treyler Plaka" : "Trailer Plate"}</label>
                          <input
                            type="text"
                            value={trailerPlate}
                            onChange={(e) => setTrailerPlate(e.target.value.toUpperCase())}
                            placeholder="Örn: 34XYZ99"
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 animate-fadeIn">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 block">
                          {isTr ? "Teslim Şartı (Incoterms)" : "Delivery Term (Incoterms)"}
                        </label>
                        <select
                          value={deliveryTerm}
                          onChange={(e) => setDeliveryTerm(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-sm outline-none bg-white font-bold"
                        >
                          {INCOTERMS_LIST.map(term => (
                            <option key={term.code} value={term.code}>
                              {isTr ? term.labelTr : term.labelEn}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 block">
                          {isTr ? "Gönderim Şekli" : "Shipping Method"}
                        </label>
                        <select
                          value={transportMode}
                          onChange={(e) => setTransportMode(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-sm outline-none bg-white font-bold"
                        >
                          <option value="1">{isTr ? "1. Karayolu" : "1. Road Transport"}</option>
                          <option value="2">{isTr ? "2. Denizyolu" : "2. Sea Transport"}</option>
                          <option value="3">{isTr ? "3. Havayolu" : "3. Air Transport"}</option>
                          <option value="4">{isTr ? "4. Demiryolu" : "4. Rail Transport"}</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 block">
                          {isTr ? "Kargo Firması" : "Cargo Company"}
                        </label>
                        <select
                          value={cargoCarrier}
                          onChange={(e) => setCargoCarrier(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-sm outline-none bg-white font-bold"
                        >
                          {["Aras Kargo", "Yurtiçi Kargo", "MNG Kargo", "Sürat Kargo", "PTT Kargo", "UPS Hızlı Kargo", "DHL Express", "FedEx", "TNT", "Diğer"].map(carrier => (
                            <option key={carrier} value={carrier}>{carrier}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 block">
                          {isTr ? "Kargo Takip No" : "Cargo Tracking No"}
                        </label>
                        <input
                          type="text"
                          required={isCargoShipment}
                          value={cargoNo}
                          onChange={(e) => setCargoNo(e.target.value)}
                          placeholder={isTr ? "Takip no girin..." : "Enter tracking number..."}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-indigo-500 transition bg-white font-bold"
                        />
                      </div>

                      {cargoCarrier === "Diğer" && (
                        <div className="col-span-1 md:col-span-4 space-y-1 animate-fadeIn">
                          <label className="text-xs font-semibold text-slate-500 block">
                            {isTr ? "Özel Kargo Firması Adı *" : "Custom Cargo Company Name *"}
                          </label>
                          <input
                            type="text"
                            required
                            placeholder={isTr ? "Firma adını yazın..." : "Enter custom company..."}
                            onChange={(e) => setCargoCarrier(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-indigo-500 transition bg-white font-medium"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* section 3: Line items table */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">{isTr ? "Taşınan Mal Hizmet Satırları" : "Despatch Line Details"}</h3>
                    <button
                      type="button"
                      id="btn_add_waybill_line"
                      onClick={handleAddItemRow}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      {isTr ? "Satır Ekle" : "Add Row"}
                    </button>
                  </div>

                  {/* table body */}
                  <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 border-b border-indigo-100 uppercase tracking-wide font-bold text-slate-500">
                        <tr>
                          <th className="p-3 w-40">{isTr ? "Ürün Seçimi" : "Select Product"}</th>
                          <th className="p-3">{isTr ? "Ürün Adı" : "Product Name"}</th>
                          <th className="p-3 w-28 text-center">{isTr ? "Miktar" : "Qty"}</th>
                          <th className="p-3 w-24">{isTr ? "Birim" : "Unit"}</th>
                          <th className="p-3 w-32">{isTr ? "Birim Fiyat" : "Unit Price"}</th>
                          <th className="p-3 w-20 text-center">{isTr ? "KDV %" : "KDV %"}</th>
                          <th className="p-3 w-28 text-right">{isTr ? "Toplam (Vesika)" : "Net Total"}</th>
                          <th className="p-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {items.map((item, idx) => {
                          const itemTotalNet = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
                          
                          return (
                            <tr key={item.tempId || idx} className="hover:bg-slate-50/50">
                              
                              <td className="p-2 relative">
                                <select
                                  value={item.product_id || ""}
                                  onChange={(e) => {
                                    const pId = e.target.value;
                                    const matched = products.find(p => String(p.id) === String(pId));
                                    if (matched) {
                                      selectProductForLine(idx, matched);
                                    } else {
                                      handleUpdateItem(idx, "product_id", "");
                                    }
                                  }}
                                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-medium"
                                >
                                  <option value="">{isTr ? "Katalog Seçimi..." : "Catalog Select..."}</option>
                                  {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                                </select>
                              </td>

                              <td className="p-2">
                                <input
                                  type="text"
                                  placeholder={isTr ? "Ürün/Tanım Adı" : "Label"}
                                  required
                                  value={item.product_name}
                                  onChange={(e) => handleUpdateItem(idx, "product_name", e.target.value)}
                                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                                />
                              </td>

                              <td className="p-2">
                                <input
                                  type="number"
                                  min="0.01"
                                  step="any"
                                  required
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateItem(idx, "quantity", e.target.value)}
                                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-center font-bold"
                                />
                              </td>

                              <td className="p-2">
                                <select
                                  value={item.unit_code}
                                  onChange={(e) => handleUpdateItem(idx, "unit_code", e.target.value)}
                                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg"
                                >
                                  <option value="Adet">{isTr ? "Adet" : "Units"}</option>
                                  <option value="KG">KG</option>
                                  <option value="Metre">{isTr ? "Metre" : "Meters"}</option>
                                  <option value="Kutu">{isTr ? "Kutu" : "Box"}</option>
                                  <option value="Saat">{isTr ? "Saat" : "Hours"}</option>
                                </select>
                              </td>

                              <td className="p-2">
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    value={item.unit_price}
                                    onChange={(e) => handleUpdateItem(idx, "unit_price", e.target.value)}
                                    className="w-full pr-10 pl-2 py-1.5 border border-slate-200 rounded-lg text-right font-medium"
                                  />
                                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">{currency}</span>
                                </div>
                              </td>

                              <td className="p-2">
                                <select
                                  value={item.tax_rate}
                                  onChange={(e) => handleUpdateItem(idx, "tax_rate", e.target.value)}
                                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-center bg-slate-50"
                                >
                                  <option value="20">%20</option>
                                  <option value="10">%10</option>
                                  <option value="1">%1</option>
                                  <option value="0">%0</option>
                                </select>
                              </td>

                              <td className="p-2 text-right font-bold text-slate-800">
                                {itemTotalNet.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {currency}
                              </td>

                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItemRow(idx)}
                                  className="p-1 rounded text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* section 4: Bottom details, notes rate, and totals */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4">
                  
                  {/* Notes & details */}
                  <div className="md:col-span-7 space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block">{isTr ? "İrsaliye Notu (GİB dökümanında gözükür)" : "Waybill Notes"}</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={isTr ? "Sevkiyat koşulları, taşıma firması bilgileri vb..." : "Cargo details..."}
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition resize-none bg-slate-50/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 block">{isTr ? "Para Birimi" : "Currency"}</label>
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs bg-white"
                        >
                          <option value="TRY">TRY</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 block">{isTr ? "Kur" : "Exchange Rate"}</label>
                        <input
                          type="number"
                          step="0.0001"
                          disabled={currency === 'TRY'}
                          value={exchangeRate}
                          onChange={(e) => setExchangeRate(e.target.value)}
                          className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* calculated totals summary */}
                  <div className="md:col-span-5 bg-slate-50/80 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 tracking-wider uppercase border-b border-slate-200 pb-2">{isTr ? "TUTAR HESAPLAMALARI" : "PRICE SUMMARY"}</h4>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>{isTr ? "Mal / Hizmet Toplam" : "Total lines price"}</span>
                        <span className="font-semibold">{getSubtotal().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {currency}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>{isTr ? "Hesaplanan KDV" : "Calculated Tax"}</span>
                        <span className="font-semibold">{getTaxTotal().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {currency}</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-slate-900">
                      <span className="font-bold text-sm">{isTr ? "İrsaliye Vesika Toplam:" : "Waybill Grand Total:"}</span>
                      <span className="font-extrabold text-lg text-indigo-700">{getGrandTotal().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {currency}</span>
                    </div>

                    <p className="text-[10px] text-slate-400 text-center leading-relaxed italic mt-1 bg-white p-2 rounded-lg border border-slate-100">
                      {isTr 
                        ? "Sevkiyat İrsaliyesinin yasal olarak teslim tarihinden itibaren 10 gün içinde e-Faturaya dönüştürülmesi gerekmektedir."
                        : "Waybill documents must legally be billed into actual invoices within 10 days of same month."}
                    </p>
                  </div>

                </div>

              </form>

              {/* Modal Footer */}
              <div className="p-4 px-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition text-sm"
                >
                  {isTr ? "Vazgeç" : "Cancel"}
                </button>
                <button
                  onClick={handleSaveWaybill}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center gap-2 text-sm shadow-sm"
                >
                  <Save className="h-4 w-4" />
                  {isTr ? "İrsaliyeyi Kaydet" : "Save Waybill"}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: DETAIL INSPECT MODAL */}
      <AnimatePresence>
        {showDetailsModal && selectedWaybill && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
            >
              <div className="p-4 px-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-indigo-600" />
                  {isTr ? `İrsaliye Detaylı Görünümü (${selectedWaybill.waybill_number})` : `Waybill Particular details`}
                </h2>
                <button onClick={() => setShowDetailsModal(false)} className="p-1 px-2 rounded-xl hover:bg-slate-200 text-slate-400 transition">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                
                {/* Meta details cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-xs font-semibold text-slate-400 block">{isTr ? "ALICI UNVAN / CARİ" : "RECIPIENT"}</span>
                    <strong className="text-sm text-slate-800 block">
                      {selectedWaybill.company_title || selectedWaybill.company_name || `${selectedWaybill.customer_name || ''} ${selectedWaybill.customer_surname || ''}`}
                    </strong>
                    <span className="text-xs text-slate-400 block">
                      {isTr ? "VKN/TCKN:" : "Tax ID:"} {selectedWaybill.company_tax_number || "11111111111"}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-xs font-semibold text-slate-400 block">{isTr ? "PLANLANAN SEVK TARİHİ" : "SHIPMENT LOGISTICS"}</span>
                    <strong className="text-sm text-slate-800 block">
                      {new Date(selectedWaybill.waybill_date).toLocaleDateString()} {selectedWaybill.waybill_time}
                    </strong>
                    <span className="text-xs text-emerald-600 block flex items-center gap-1 font-semibold">
                      {isTr ? "Yol İzin Vesikası Aktif" : "Waybill Transport Active"}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                    {selectedWaybill.is_cargo_shipment ? (
                      <>
                        <span className="text-xs font-semibold text-slate-400 block">{isTr ? "KARGO / SEVK DETAYI" : "CARGO SHIPMENT DETAILS"}</span>
                        <strong className="text-sm text-slate-800 block">
                          {selectedWaybill.carrier_name || "Belirtilmedi"}
                        </strong>
                        <span className="text-xs text-slate-500 block font-mono">
                          {isTr ? "Takip No: " : "Track No: "} {selectedWaybill.tracking_number || "Girilmedi"}
                        </span>
                        <span className="text-[10px] text-indigo-600 block font-bold">
                          {selectedWaybill.delivery_term || "CFR"} - {selectedWaybill.transport_mode === '1' ? (isTr ? 'Karayolu' : 'Road') : selectedWaybill.transport_mode === '2' ? (isTr ? 'Denizyolu' : 'Sea') : selectedWaybill.transport_mode === '3' ? (isTr ? 'Havayolu' : 'Air') : (isTr ? 'Demiryolu' : 'Rail')}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-semibold text-slate-400 block">{isTr ? "ARAÇ VE PLAKALAR" : "TRUCK PLATES"}</span>
                        <strong className="text-sm text-slate-800 block">
                          {selectedWaybill.plate_number || "Plaka Belirtilmedi"}
                        </strong>
                        <span className="text-xs text-slate-500 block">
                          {selectedWaybill.driver_name ? `${selectedWaybill.driver_name} ${selectedWaybill.driver_surname}` : "Sürücü Yok"}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Items tabular view */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isTr ? "MAL HİZMET DETAYLARI" : "LINE CONTENTS"}</h4>
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                        <tr>
                          <th className="p-3">{isTr ? "Ürün Adı / Tanımı" : "Product label"}</th>
                          <th className="p-3 text-center">{isTr ? "Miktar" : "Quantity"}</th>
                          <th className="p-3">{isTr ? "Ölçü Birmi" : "Unit"}</th>
                          <th className="p-3 text-right">{isTr ? "Birim Fiyat" : "Unit Price"}</th>
                          <th className="p-3 text-center">{isTr ? "KDV %" : "TAX %"}</th>
                          <th className="p-3 text-right">{isTr ? "Satır Tutarı" : "Line Total"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedWaybill.items || []).map((it: any) => (
                          <tr key={it.id} className="border-b border-slate-50">
                            <td className="p-3 font-medium text-slate-800">{it.product_name}</td>
                            <td className="p-3 text-center font-bold">{it.quantity}</td>
                            <td className="p-3">{it.unit_code}</td>
                            <td className="p-3 text-right">{Number(it.unit_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedWaybill.currency}</td>
                            <td className="p-3 text-center font-semibold text-slate-500">%{it.tax_rate}</td>
                            <td className="p-3 text-right font-bold text-slate-900">{(it.quantity * it.unit_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedWaybill.currency}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notes and financial summaries */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{isTr ? "MAHSUS NOTLAR / AÇIKLAMA" : "WAYBILL INSTRUCTIONS"}</span>
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      {selectedWaybill.notes || (isTr ? "İrsaliye notu eklenmedi." : "No waybill notes added.")}
                    </p>
                  </div>
                  <div className="text-right space-y-1.5 text-xs text-slate-600 flex flex-col justify-end">
                    <div>{isTr ? "Vesika Net Tutar:" : "Net values:"} <strong>{Number(selectedWaybill.total_amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedWaybill.currency}</strong></div>
                    <div>{isTr ? "Vesika KDV Toplam:" : "Tax values:"} <strong>{Number(selectedWaybill.tax_amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedWaybill.currency}</strong></div>
                    <div className="border-t border-slate-200 mt-2 pt-2 text-sm text-indigo-700 font-bold">
                      {isTr ? "Vesika Genel Toplam:" : "Grand total:"} <span className="text-lg font-black">{Number(selectedWaybill.grand_total || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedWaybill.currency}</span>
                    </div>
                  </div>
                </div>

              </div>

              <div className="p-4 px-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition"
                >
                  {isTr ? "Kapat" : "Close"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: HTML PREVIEW PRINT MODAL */}
      <AnimatePresence>
        {showHtmlModal && selectedWaybill && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="p-4 px-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Truck className="h-4 w-4 text-emerald-600" />
                    {isTr ? `Resmî E-İrsaliye Görsel Baskısı (${selectedWaybill.waybill_number})` : `Official e-Waybill visual print representation`}
                  </h2>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{selectedWaybill.ettn}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const frame = document.getElementById('waybill_print_iframe') as HTMLIFrameElement;
                      if (frame && frame.contentWindow) {
                        frame.contentWindow.print();
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Printer className="h-3.5 w-3.5 text-indigo-600" />
                    {isTr ? "Yazdır / PDF Kaydet" : "Print PDF"}
                  </button>
                  <button onClick={() => setShowHtmlModal(false)} className="p-1 px-2 rounded-xl hover:bg-slate-200 text-slate-400 transition">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-slate-100 p-6 overflow-hidden flex items-center justify-center relative">
                {previewLoading ? (
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                    <p className="text-xs font-bold">{isTr ? "Entegratörden döküman şablonu alınıyor..." : "Downloading visual markup..."}</p>
                  </div>
                ) : (
                  <iframe
                    id="waybill_print_iframe"
                    className="w-full h-full bg-white rounded-2xl shadow-inner border border-slate-200"
                    srcDoc={previewContent}
                    title="e-Irsaliye PDF Doc"
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: CONVERT MULTIPLE WAYBILLS TO INVOICE */}
      <AnimatePresence>
        {showConvertModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-4 px-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  {isTr ? "Toplu İrsaliye e-Fatura Dönüşümü" : "Consolidate waybills to e-Invoice"}
                </h2>
                <button onClick={() => setShowConvertModal(false)} className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 transition">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleBulkConversionSubmit} className="p-6 space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-indigo-800">
                  {isTr 
                    ? `Seçtiğiniz ${selectedIds.length} adet sevk irsaliyesi tek bir Satış Faturası altında birleştirilecektir. Mükerrer ürünler konsolide edilip miktarları toplanacaktır.`
                    : `Your ${selectedIds.length} selected waybills will be consolidated into a single draft invoice. Duplicate item quantities will be summed.`}
                </p>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">{isTr ? "Fatura Senaryosu" : "Invoice Profile"}</label>
                    <select
                      value={convertForm.invoiceProfile}
                      onChange={(e) => setConvertForm(prev => ({ ...prev, invoiceProfile: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:border-indigo-500 outline-none"
                    >
                      <option value="TICARIFATURA">{isTr ? "TİCARİ FATURA (Ortak)" : "TICARIFATURA"}</option>
                      <option value="TEMELFATURA">{isTr ? "TEMEL FATURA (Bireysel/E-Arşiv)" : "TEMELFATURA"}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">{isTr ? "Fatura Tipi" : "Billing Category"}</label>
                    <select
                      value={convertForm.giInvoiceType}
                      onChange={(e) => setConvertForm(prev => ({ ...prev, giInvoiceType: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:border-indigo-500 outline-none"
                    >
                      <option value="SATIS">{isTr ? "SATIŞ FATURASI" : "SATIS"}</option>
                      <option value="ISTISNA">{isTr ? "İSTİSNA FATURASI" : "ISTISNA"}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">{isTr ? "Ödeme Şekli" : "Payment Method"}</label>
                    <select
                      value={convertForm.paymentMethod}
                      onChange={(e) => setConvertForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:border-indigo-500 outline-none"
                    >
                      <option value="cash">{isTr ? "Nakit" : "Cash"}</option>
                      <option value="credit_card">{isTr ? "Kredi Kartı" : "Credit Card"}</option>
                      <option value="bank">{isTr ? "Banka Havalesi / EFT" : "Bank Transfer"}</option>
                      <option value="term">{isTr ? "Açık Hesap / Vadeli" : "Açık Hesap"}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">{isTr ? "Özel Fatura Notu" : "Invoice Notes"}</label>
                    <textarea
                      value={convertForm.notes}
                      onChange={(e) => setConvertForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:border-indigo-500 outline-none resize-none"
                      placeholder={isTr ? "Fatura açıklaması ekleyin..." : "Notes..."}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 -mx-6 -mb-6 p-4">
                  <button
                    type="button"
                    onClick={() => setShowConvertModal(false)}
                    className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-800 rounded-xl text-xs font-bold transition text-slate-600"
                  >
                    {isTr ? "İptal" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {isTr ? "Faturayı Oluştur (Taslak)" : "Create Bill Draft"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
