
const getToken = () => localStorage.getItem("token");

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
    const token = getToken();
    const separator = url.includes('?') ? '&' : '?';
    const cacheBustedUrl = `${url}${separator}_t=${Date.now()}`;
    const res = await fetch(cacheBustedUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    });
    return handleResponse(res);
  },
  async post(url: string, body: any) {
    const token = getToken();
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
    const token = getToken();
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
    const token = getToken();
    const res = await fetch(url, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return handleResponse(res);
  },
  async upload(url: string, formData: FormData) {
    const token = getToken();
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
  getProducts: (storeId?: number) => api.get(`/api/store/products${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  addProduct: (data: any, storeId?: number) => api.post(`/api/store/products${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  updateProduct: (id: number, data: any, storeId?: number) => api.put(`/api/store/products/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  deleteProduct: (id: number, storeId?: number) => api.delete(`/api/store/products/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  deleteAllProducts: (storeId?: number) => api.delete(`/api/store/products/all${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  importProducts: (formData: FormData, storeId?: number) => api.upload(`/api/store/import${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, formData),
  
  getAnalytics: (storeId?: number) => api.get(`/api/store/analytics${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  getBranding: (storeId?: number, slug?: string) => api.get(`/api/store/info${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : (slug ? `?slug=${slug}` : "")}`),
  updateBranding: (data: any, storeId?: number) => api.post(`/api/store/branding${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  
  getQuotations: (search = "", status = "all", storeId?: number) => api.get(`/api/store/quotations?search=${search}&status=${status}${(storeId !== undefined && storeId !== null) ? `&storeId=${storeId}` : ""}`),
  addQuotation: (data: any, storeId?: number) => api.post(`/api/store/quotations${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  approveQuotation: (id: number, data: any = {}, storeId?: number) => api.post(`/api/store/quotations/${id}/approve${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  cancelQuotation: (id: number, storeId?: number) => api.post(`/api/store/quotations/${id}/cancel${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, {}),
  createSale: (data: any) => api.post("/api/public/sales", data), 
  deleteQuotation: (id: number, storeId?: number) => api.delete(`/api/store/quotations/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  updateQuotation: (id: number, data: any, storeId?: number) => api.put(`/api/store/quotations/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),

  getCompanies: (includeZero = false, storeId?: number) => api.get(`/api/store/companies?includeZero=${includeZero}${(storeId !== undefined && storeId !== null) ? `&storeId=${storeId}` : ""}`),
  addCompany: (data: any, storeId?: number) => api.post(`/api/store/companies${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  updateCompany: (id: number | string, data: any, storeId?: number) => api.put(`/api/store/companies/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  deleteCompany: (id: number | string, storeId?: number) => api.delete(`/api/store/companies/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  addCompanyTransaction: (id: number | string, data: any, storeId?: number) => api.post(`/api/store/companies/${id}/transactions${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  deleteCompanyTransaction: (companyId: number | string, id: number | string, storeId?: number) => api.delete(`/api/store/companies/${companyId}/transactions/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),

  getSales: (status = "all", start = "", end = "", storeId?: number) => api.get(`/api/store/sales?status=${status}&startDate=${start}&endDate=${end}${(storeId !== undefined && storeId !== null) ? `&storeId=${storeId}` : ""}`),
  completeSale: (id: number, data: any, storeId?: number) => api.post(`/api/store/sales/${id}/complete${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, data),
  cancelSale: (id: number, storeId?: number) => api.post(`/api/store/sales/${id}/cancel${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`, {}),
  deleteSale: (id: number, storeId?: number) => api.delete(`/api/store/sales/${id}${(storeId !== undefined && storeId !== null) ? `?storeId=${storeId}` : ""}`),
  getDailySalesReport: (start = "", end = "", storeId?: number) => api.get(`/api/store/reports/daily-sales?startDate=${start}&endDate=${end}${(storeId !== undefined && storeId !== null) ? `&storeId=${storeId}` : ""}`),
  
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

  login: (data: any) => api.post("/api/auth/login", data),
  register: (data: any) => api.post("/api/auth/register", data),
  forgotPassword: (email: string) => api.post("/api/auth/forgot-password", { email }),
  resetPassword: (token: string, newPassword: any) => api.post("/api/auth/reset-password", { token, newPassword }),
  
  // Public Methods
  getPublicStoreProducts: (slug: string) => api.get(`/api/public/store/${slug}/products`),
  getPublicStore: (slug: string) => api.get(`/api/public/store/${slug}`),
  getProductBySlug: (slug: string, barcode: string) => api.get(`/api/public/scan/${slug}/${barcode}`),
  getSaleStatus: (id: number) => api.get(`/api/public/sales/${id}/status`),
  createPublicSale: (data: any) => api.post("/api/public/sales", data),
  requestDemo: (data: any) => api.post("/api/public/demo-request", data),
  requestRegistration: (data: any) => api.post("/api/public/register-request", data),
  
  getPublicQuotation: (id: string) => api.get(`/api/public/quotations/${id}`),
  publicQuotationAction: (id: string, action: 'approve' | 'reject', notes?: string, paymentMethod?: string, dueDate?: string) => api.post(`/api/public/quotations/${id}/action`, { action, notes, paymentMethod, dueDate }),
};
