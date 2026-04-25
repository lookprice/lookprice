
const getToken = (url: string) => {
  if (url.includes('/api/public/customers/')) {
    return localStorage.getItem("customerToken");
  }
  return localStorage.getItem("token");
};

// --- API Helper ---
const handleResponse = async (res: Response) => {
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }
  const text = await res.text();
  console.error("Non-JSON response received:", text);
  return { error: `Sunucu hatası (JSON bekleniyordu). Durum: ${res.status}` };
};

export const api = {
  async get(url: string) {
    const token = getToken(url);
    const separator = url.includes('?') ? '&' : '?';
    const cacheBustedUrl = `${url}${separator}_t=${Date.now()}`;
    const res = await fetch(cacheBustedUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    });
    return handleResponse(res);
  },
  async post(url: string, body: any) {
    const token = getToken(url);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  async put(url: string, body: any) {
    const token = getToken(url);
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  async delete(url: string) {
    const token = getToken(url);
    const res = await fetch(url, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return handleResponse(res);
  },
  async download(url: string, filename: string) {
    const token = getToken(url);
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  },
  async upload(url: string, formData: FormData) {
    const token = getToken(url);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    return handleResponse(res);
  },

  // Store Methods
  getProducts: (search = "", storeId?: number, includeBranches = false) => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (storeId !== undefined && storeId !== null) params.append("storeId", storeId.toString());
    if (includeBranches) params.append("includeBranches", "true");
    const queryString = params.toString();
    const url = `/api/store/products${queryString ? `?${queryString}` : ""}`;
    return api.get(url);
  },
  addProduct: (data: any, storeId?: number) => api.post(`/api/store/products${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  updateProduct: (id: number, data: any, storeId?: number) => api.put(`/api/store/products/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  bulkUpdateTax: (category: string, taxRate: number, storeId?: number, includeBranches?: boolean) => api.put(`/api/store/products/bulk-update-tax${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, { category, taxRate, includeBranches }),
  bulkUpdatePrice: (data: any, storeId?: number) => api.put(`/api/store/products/bulk-update-price${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  bulkRecalculatePrice2: (storeId?: number) => api.put(`/api/store/products/bulk-recalculate-price2${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, {}),
  updateProductStock: (id: number, quantityChange: number, storeId?: number) => api.post(`/api/store/products/${id}/stock${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, { quantityChange }),
  deleteProduct: (id: number, storeId?: number) => api.delete(`/api/store/products/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  deleteAllProducts: (storeId?: number) => api.delete(`/api/store/products/all${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  importProducts: (formData: FormData, storeId?: number) => api.upload(`/api/store/import${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, formData),
  
  getDriverDocuments: (id: number) => api.get(`/api/fleet/drivers/${id}/documents`),
  getDriverAssignments: (id: number) => api.get(`/api/fleet/drivers/${id}/assignments`),
  
  getAnalytics: (storeId?: number) => api.get(`/api/store/analytics${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  getAuditLogs: (storeId?: number) => api.get(`/api/store/audit-logs${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  getBranding: (storeId?: number, slug?: string) => api.get(`/api/store/info${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : (slug ? `?slug=${slug}` : "")}`),
  updateBranding: (data: any, storeId?: number) => api.post(`/api/store/branding${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  verifyDomain: (domain: string) => api.post("/api/store/verify-domain", { domain }),
  addCustomDomain: (domain: string, storeId?: number, config?: any) => api.post(`/api/store/domain${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, { domain, ...config }),
  saveCustomDomainManual: (domain: string, storeId?: number) => api.post(`/api/store/domain/manual${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, { domain }),
  getCustomDomainStatus: (storeId?: number) => api.get(`/api/store/domain${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  
  getQuotations: (search = "", status = "all", storeId?: number) => api.get(`/api/store/quotations?search=${search}&status=${status}${(storeId !== undefined && storeId !== null) ? `&storeId=${storeId}` : ""}`),
  addQuotation: (data: any, storeId?: number) => api.post(`/api/store/quotations${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  approveQuotation: (id: number, data: any = {}, storeId?: number) => api.post(`/api/store/quotations/${id}/approve${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  cancelQuotation: (id: number, storeId?: number) => api.post(`/api/store/quotations/${id}/cancel${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, {}),
  createSale: (data: any) => api.post("/api/public/sales", data), 
  deleteQuotation: (id: number, storeId?: number) => api.delete(`/api/store/quotations/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  updateQuotation: (id: number, data: any, storeId?: number) => api.put(`/api/store/quotations/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),

  getCompanies: (includeZero = false, storeId?: number) => api.get(`/api/store/companies?includeZero=${includeZero}${(storeId !== undefined && storeId !== null) ? `&storeId=${storeId}` : ""}`),
  getCustomers: (storeId?: number) => api.get(`/api/store/customers${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  addCustomer: (data: any, storeId?: number) => api.post(`/api/store/customers${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  updateCustomer: (id: number | string, data: any, storeId?: number) => api.put(`/api/store/customers/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  addCompany: (data: any, storeId?: number) => api.post(`/api/store/companies${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  updateCompany: (id: number | string, data: any, storeId?: number) => api.put(`/api/store/companies/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  deleteCompany: (id: number | string, storeId?: number) => api.delete(`/api/store/companies/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  addCompanyTransaction: (id: number | string, data: any, storeId?: number) => api.post(`/api/store/companies/${id}/transactions${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  deleteCompanyTransaction: (companyId: number | string, id: number | string, storeId?: number) => api.delete(`/api/store/companies/${companyId}/transactions/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  getCompanyTransactions: (id: number | string, start = "", end = "", storeId?: number) => api.get(`/api/store/companies/${id}/transactions?startDate=${start}&endDate=${end}${(storeId !== undefined && storeId !== null) ? `&storeId=${storeId}` : ""}`),
  exportCompanyTransactionsPDF: async (id: number | string, start = "", end = "", storeId?: number) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/store/companies/${id}/transactions/pdf?startDate=${start}&endDate=${end}${(storeId !== undefined && storeId !== null) ? `&storeId=${storeId}` : ""}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("PDF export failed");
    return res.blob();
  },

  getSales: (status = "all", start = "", end = "", storeId?: number) => api.get(`/api/store/sales?status=${status}&startDate=${start}&endDate=${end}${(storeId !== undefined && storeId !== null) ? `&storeId=${storeId}` : ""}`),
  createPosSale: (data: any, storeId?: number) => api.post(`/api/store/pos/sale${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  completeSale: (id: number, data: any, storeId?: number) => api.post(`/api/store/sales/${id}/complete${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  shipSale: (id: number, data: { carrier: string, trackingNumber: string }, storeId?: number) => api.post(`/api/store/sales/${id}/ship${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  deliverSale: (id: number, storeId?: number) => api.post(`/api/store/sales/${id}/deliver${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, {}),
  cancelSale: (id: number, storeId?: number) => api.post(`/api/store/sales/${id}/cancel${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, {}),
  deleteSale: (id: number, storeId?: number) => api.delete(`/api/store/sales/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  getDailySalesReport: (start = "", end = "", storeId?: number) => api.get(`/api/store/reports/daily-sales?startDate=${start}&endDate=${end}${(storeId !== undefined && storeId !== null) ? `&storeId=${storeId}` : ""}`),
  
  getSalesInvoices: (storeId?: number) => api.get(`/api/store/sales-invoices${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  getSalesInvoice: (id: number, storeId?: number) => api.get(`/api/store/sales-invoices/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  addSalesInvoice: (data: any, storeId?: number) => api.post(`/api/store/sales-invoices${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  updateSalesInvoice: (id: number, data: any, storeId?: number) => api.put(`/api/store/sales-invoices/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  deleteSalesInvoice: (id: number, storeId?: number) => api.delete(`/api/store/sales-invoices/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),

  getPurchaseInvoices: (storeId?: number) => api.get(`/api/store/purchase-invoices${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  getPurchaseInvoice: (id: number, storeId?: number) => api.get(`/api/store/purchase-invoices/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  addPurchaseInvoice: (data: any, storeId?: number) => api.post(`/api/store/purchase-invoices${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  updatePurchaseInvoice: (id: number, data: any, storeId?: number) => api.put(`/api/store/purchase-invoices/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  deletePurchaseInvoice: (id: number, storeId?: number) => api.delete(`/api/store/purchase-invoices/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  updatePurchaseInvoiceTicariStatus: (id: number, status: 'APPROVED' | 'REJECTED', storeId?: number) => api.post(`/api/store/purchase-invoices/${id}/status${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, { status }),

  getUsers: (storeId?: number) => api.get(`/api/store/users${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  addUser: (data: any, storeId?: number) => api.post(`/api/store/users${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  deleteUser: (id: number, storeId?: number) => api.delete(`/api/store/users/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),

  getLeads: () => api.get("/api/admin/leads"),
  getRegistrationRequests: () => api.get("/api/admin/registration-requests"),
  approveRegistration: (id: number) => api.post(`/api/admin/registration-requests/${id}/approve`, {}),
  rejectRegistration: (id: number) => api.post(`/api/admin/registration-requests/${id}/reject`, {}),
  getAdminStats: () => api.get("/api/admin/stats"),
  updateLead: (id: number, data: any) => api.put(`/api/admin/leads/${id}`, data),
  getStores: () => api.get("/api/admin/stores"),
  addStore: (data: any) => api.post("/api/admin/stores", data),
  updateStore: (id: number, data: any) => api.put(`/api/admin/stores/${id}`, data),
  deleteStore: (id: number, password: any) => api.post(`/api/admin/stores/${id}/delete`, { password }),

  uploadFile: (formData: FormData) => api.upload("/api/upload", formData),
  
  // Supplier APIs
  getSupplierApis: (storeId?: number) => api.get(`/api/store/supplier-apis${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  addSupplierApi: (data: any, storeId?: number) => api.post(`/api/store/supplier-apis${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  updateSupplierApi: (id: number, data: any, storeId?: number) => api.put(`/api/store/supplier-apis/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  deleteSupplierApi: (id: number, storeId?: number) => api.delete(`/api/store/supplier-apis/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),

  // Procurements
  getProcurements: (storeId?: number) => api.get(`/api/store/procurements${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  updateProcurement: (id: number, data: any, storeId?: number) => api.put(`/api/store/procurements/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  deleteProcurement: (id: number, storeId?: number) => api.delete(`/api/store/procurements/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  querySupplierApis: (id: number, storeId?: number) => api.post(`/api/store/procurements/${id}/query${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, {}),

  // Technical Service
  getServiceRecords: (storeId?: number) => api.get(`/api/store/service-records${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  getServiceRecord: (id: number, storeId?: number) => api.get(`/api/store/service-records/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  addServiceRecord: (data: any, storeId?: number) => api.post(`/api/store/service-records${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  updateServiceRecord: (id: number, data: any, storeId?: number) => api.put(`/api/store/service-records/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  deleteServiceRecord: (id: number, storeId?: number) => api.delete(`/api/store/service-records/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),

  // Branches & Stock Transfers
  getBranches: (storeId?: number) => api.get(`/api/store/branches${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  getBranchStock: (barcode: string, storeId?: number) => api.get(`/api/store/branches/stock/${barcode}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  getStockTransfers: (storeId?: number, includeBranches?: boolean) => api.get(`/api/store/stock-transfers${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}${includeBranches ? `&includeBranches=true` : ""}`),
  createStockTransfer: (data: any, storeId?: number) => api.post(`/api/store/stock-transfers${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  updateStockTransferStatus: (id: number, status: string, storeId?: number, lang = 'tr') => api.put(`/api/store/stock-transfers/${id}/status${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}&lang=${lang}` : `?lang=${lang}`}`, { status }),
  deleteStockTransfer: (id: number, storeId?: number) => api.delete(`/api/store/stock-transfers/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  getNotifications: (storeId?: number) => api.get(`/api/store/notifications${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),

  customerLogin: (data: any) => api.post("/api/public/customers/login", data),
  customerRegister: (data: any) => api.post("/api/public/customers/register", data),
  getCustomerProfile: () => api.get("/api/public/customers/profile"),
  updateCustomerProfile: (data: any) => api.put("/api/public/customers/profile", data),
  getCustomerOrders: () => api.get("/api/public/customers/orders"),
  login: (data: any) => api.post("/api/auth/login", data),
  register: (data: any) => api.post("/api/auth/register", data),
  forgotPassword: (email: string) => api.post("/api/auth/forgot-password", { email }),
  resetPassword: (token: string, newPassword: any) => api.post("/api/auth/reset-password", { token, newPassword }),
  getProfile: () => api.get("/api/user/profile"),
  updateProfile: (data: any) => api.put("/api/user/profile", data),
  getMyOrders: () => api.get("/api/user/orders"),
  requestReturn: (orderId: number, reason: string) => api.post(`/api/user/orders/${orderId}/return`, { reason }),
  
  // Public Methods
  getPublicStoreProducts: (slug: string) => api.get(`/api/public/store/${slug}/products`),
  getPublicStore: (slug: string) => api.get(`/api/public/store/${slug}`),
  getProductBySlug: (slug: string, barcode: string) => api.get(`/api/public/scan/${slug}/${barcode}`),
  getSaleStatus: (id: number) => api.get(`/api/public/sales/${id}/status`),
  createPublicSale: (data: any) => api.post("/api/public/sales", data),
  createGuestSale: (data: any) => api.post("/api/public/guest-sales", data),
  getPublicProductBranchStock: (slug: string, barcode: string) => api.get(`/api/public/store/${slug}/products/${barcode}/stock`),
  requestDemo: (data: any) => api.post("/api/public/demo-request", data),
  requestRegistration: (data: any) => api.post("/api/public/register-request", data),
  
  getPublicQuotation: (id: string) => api.get(`/api/public/quotations/${id}`),
  publicQuotationAction: (id: string, action: 'approve' | 'reject', notes?: string, paymentMethod?: string, dueDate?: string) => api.post(`/api/public/quotations/${id}/action`, { action, notes, paymentMethod, dueDate }),

  // Fleet Management Methods
  getVehicles: (storeId?: number) => api.get(`/api/fleet/vehicles${(storeId !== undefined && storeId !== null) ? `?store_id=${storeId}` : ""}`),
  createVehicle: (data: any) => api.post("/api/fleet/vehicles", data),
  updateVehicle: (id: number, data: any) => api.put(`/api/fleet/vehicles/${id}`, data),
  deleteVehicle: (id: number) => api.delete(`/api/fleet/vehicles/${id}`),
  getVehicleDocuments: (id: number) => api.get(`/api/fleet/vehicles/${id}/documents`),
  createVehicleDocument: (id: number, data: any) => api.post(`/api/fleet/vehicles/${id}/documents`, data),
  updateVehicleDocument: (id: number, data: any) => api.put(`/api/fleet/vehicle-documents/${id}`, data),
  deleteVehicleDocument: (id: number) => api.delete(`/api/fleet/vehicle-documents/${id}`),
  getVehicleMaintenance: (id: number) => api.get(`/api/fleet/vehicles/${id}/maintenance`),
  createVehicleMaintenance: (id: number, data: any) => api.post(`/api/fleet/vehicles/${id}/maintenance`, data),
  updateVehicleMaintenance: (id: number, data: any) => api.put(`/api/fleet/vehicle-maintenance/${id}`, data),
  getVehicleAssignments: (id: number) => api.get(`/api/fleet/vehicles/${id}/assignments`),
  createVehicleAssignment: (id: number, data: any) => api.post(`/api/fleet/vehicles/${id}/assignments`, data),
  updateVehicleAssignment: (id: number, data: any) => api.put(`/api/fleet/vehicle-assignments/${id}`, data),
  getVehicleMileage: (id: number) => api.get(`/api/fleet/vehicles/${id}/mileage`),
  createVehicleMileage: (id: number, data: any) => api.post(`/api/fleet/vehicles/${id}/mileage`, data),
  getVehicleIncidents: (id: number) => api.get(`/api/fleet/vehicles/${id}/incidents`),
  createVehicleIncident: (id: number, data: any) => api.post(`/api/fleet/vehicles/${id}/incidents`, data),
  
  // Store-wide Fleet Methods
  getAllFleetDocuments: (storeId?: number) => api.get(`/api/fleet/documents${(storeId !== undefined && storeId !== null) ? `?store_id=${storeId}` : ""}`),
  getAllFleetMaintenance: (storeId?: number) => api.get(`/api/fleet/maintenance${(storeId !== undefined && storeId !== null) ? `?store_id=${storeId}` : ""}`),
  getAllFleetAssignments: (storeId?: number) => api.get(`/api/fleet/assignments${(storeId !== undefined && storeId !== null) ? `?store_id=${storeId}` : ""}`),
  getAllFleetMileage: (storeId?: number) => api.get(`/api/fleet/mileage${(storeId !== undefined && storeId !== null) ? `?store_id=${storeId}` : ""}`),
  getAllFleetIncidents: (storeId?: number) => api.get(`/api/fleet/incidents${(storeId !== undefined && storeId !== null) ? `?store_id=${storeId}` : ""}`),
  getAllFleetDriverDocuments: (storeId?: number) => api.get(`/api/fleet/driver-documents${(storeId !== undefined && storeId !== null) ? `?store_id=${storeId}` : ""}`),
  
  // Driver Methods
  getDrivers: (storeId?: number) => api.get(`/api/fleet/drivers${(storeId !== undefined && storeId !== null) ? `?store_id=${storeId}` : ""}`),
  createDriver: (data: any) => api.post("/api/fleet/drivers", data),
  updateDriver: (id: number, data: any) => api.put(`/api/fleet/drivers/${id}`, data),
  deleteDriver: (id: number) => api.delete(`/api/fleet/drivers/${id}`),
  uploadDriverDocument: (id: number, formData: FormData) => api.upload(`/api/fleet/drivers/${id}/documents`, formData),
  deleteDriverDocument: (id: number) => api.delete(`/api/fleet/driver-documents/${id}`),

  // Amazon Integration
  getAmazonAuthUrl: () => api.get("/api/integrations/amazon/auth-url"),
  getAmazonSettings: (storeId?: number) => api.get(`/api/integrations/amazon/settings${storeId ? `?storeId=${storeId}` : ""}`),
  saveAmazonSettings: (data: { clientId: string, clientSecret: string, refreshToken: string, sellerId: string, storeId?: number }) => api.post("/api/integrations/amazon/settings", data),
  syncAmazonOrders: (storeId?: number) => api.post("/api/integrations/amazon/sync", { storeId }),
  disconnectAmazon: (storeId?: number) => api.post("/api/integrations/amazon/disconnect", { storeId }),

  // N11 Integration
  getN11Settings: (storeId?: number) => api.get(`/api/integrations/n11/settings${storeId ? `?storeId=${storeId}` : ""}`),
  saveN11Settings: (data: { appKey: string, appSecret: string, storeId?: number }) => api.post("/api/integrations/n11/settings", data),
  syncN11Orders: (storeId?: number) => api.post("/api/integrations/n11/sync", { storeId }),
  disconnectN11: (storeId?: number) => api.post("/api/integrations/n11/disconnect", { storeId }),

  // Hepsiburada Integration
  getHepsiburadaSettings: (storeId?: number) => api.get(`/api/integrations/hepsiburada/settings${storeId ? `?storeId=${storeId}` : ""}`),
  saveHepsiburadaSettings: (data: { apiKey: string, apiSecret: string, merchantId: string, storeId?: number }) => api.post("/api/integrations/hepsiburada/settings", data),
  syncHepsiburadaOrders: (storeId?: number) => api.post("/api/integrations/hepsiburada/sync", { storeId }),
  disconnectHepsiburada: (storeId?: number) => api.post("/api/integrations/hepsiburada/disconnect", { storeId }),

  // Trendyol Integration
  getTrendyolSettings: (storeId?: number) => api.get(`/api/integrations/trendyol/settings${storeId ? `?storeId=${storeId}` : ""}`),
  saveTrendyolSettings: (data: { apiKey: string, apiSecret: string, merchantId: string, storeId?: number }) => api.post("/api/integrations/trendyol/settings", data),
  syncTrendyolOrders: (storeId?: number) => api.post("/api/integrations/trendyol/sync", { storeId }),
  disconnectTrendyol: (storeId?: number) => api.post("/api/integrations/trendyol/disconnect", { storeId }),

  // Pazarama Integration
  getPazaramaSettings: (storeId?: number) => api.get(`/api/integrations/pazarama/settings${storeId ? `?storeId=${storeId}` : ""}`),
  savePazaramaSettings: (data: { 
    apiKey: string, 
    apiSecret: string, 
    merchantId?: string, 
    commissionRate?: number, 
    categoryMappings?: any,
    brandMappings?: any,
    storeId?: number 
  }) => api.post("/api/integrations/pazarama/settings", data),
  syncPazaramaOrders: (storeId?: number) => api.post("/api/integrations/pazarama/sync", { storeId }),
  disconnectPazarama: (storeId?: number) => api.post("/api/integrations/pazarama/disconnect", { storeId }),
  publishPazaramaProduct: (productId: number, storeId?: number) => api.post("/api/integrations/pazarama/publish", { productId, storeId }),
  getPazaramaCategories: (storeId?: number) => api.get(`/api/integrations/pazarama/categories${storeId ? `?storeId=${storeId}` : ""}`),
  getPazaramaBrands: (storeId?: number) => api.get(`/api/integrations/pazarama/brands${storeId ? `?storeId=${storeId}` : ""}`),

  // Transactions
  deleteTransaction: (id: number) => api.delete(`/api/store/transactions/${id}`),
  updateTransaction: (id: number, data: any) => api.put(`/api/store/transactions/${id}`, data),
  logError: (data: any) => api.post("/api/store/log-error", data),

  // E-Invoice Methods
  checkTaxpayer: (vknTckn: string) => api.post("/api/einvoice/check-taxpayer", { vknTckn }),
  sendEInvoice: (invoiceId: number) => api.post(`/api/einvoice/send/${invoiceId}`, {}),
  checkEInvoiceStatus: (invoiceId: number) => api.get(`/api/einvoice/status/${invoiceId}`),
  syncIncomingEInvoices: (startDate: string, endDate: string) => api.post("/api/einvoice/sync-inbox", { startDate, endDate }),
};
