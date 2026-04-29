import axios from "axios";

// This is a generic MySoft e-Document Wrapper based on typical UBL-TR Integrator setups.
// Note: Some endpoints might need to naturally adapt according to final API contracts of MySoft.

export class MySoftService {
  private baseUrl: string;
  private token: string | null = null;
  private credentials: {
    username?: string;
    password?: string;
    api_token?: string;
    tenant_id?: string;
    sender_alias?: string;
    receiver_alias?: string;
    earchive_username?: string;
    earchive_uuid?: string;
  };

  constructor(credentials: any) {
    let url = credentials.api_url || "https://edocumentapi.mysoft.com.tr/api";
    if (url.endsWith("/")) url = url.slice(0, -1);
    this.baseUrl = url;
    this.credentials = credentials;
  }

   // 1. Token Handling
  private async authenticate(forceRefresh = false) {
    if (this.credentials.api_token && this.credentials.api_token.length > 10) {
       this.token = this.credentials.api_token;
       return this.token;
    }
    
    if (this.credentials.username && this.credentials.password) {
       if (this.token && !forceRefresh) return this.token;
       this.token = null; // Clear if refreshing

       const endpoints = [
         `${this.baseUrl}/Login/Authentication`,
         `${this.baseUrl}/Authentication/Login`,
         `${this.baseUrl}/Authentication/GetToken`,
         `${this.baseUrl}/Authentication/Token`,
         `${this.baseUrl}/token`,
         `${this.baseUrl.replace('/api', '')}/Login/Authentication`
       ];

       let lastError = null;

       for (const endpoint of endpoints) {
         try {
           const authPayload: any = {
             Username: this.credentials.username,
             Password: this.credentials.password
           };

           if (this.credentials.tenant_id) {
             authPayload.TenantId = this.credentials.tenant_id;
             authPayload.ApplicationId = this.credentials.tenant_id;
             authPayload.tenantId = this.credentials.tenant_id;
           }
           
           if (this.credentials.earchive_uuid) {
             authPayload.ClientId = this.credentials.earchive_uuid;
             authPayload.clientId = this.credentials.earchive_uuid;
           }

           console.log(`Trying MySoft Auth at: ${endpoint}`);
           const config: any = { 
             timeout: 8000, 
             headers: { 'Content-Type': 'application/json' } 
           };
           if (this.credentials.tenant_id) {
             config.headers['TenantId'] = this.credentials.tenant_id;
           }

           const response = await axios.post(endpoint, authPayload, config);
           
           let tokenValue = response.data.Data || response.data.token || response.data.AccessToken || response.data.access_token || response.data.data?.token || response.data.data?.accessToken;

           if (tokenValue && typeof tokenValue === 'object') {
             tokenValue = tokenValue.Token || tokenValue.AccessToken || tokenValue.token || tokenValue.accessToken || tokenValue.SessionId;
           }

           if (tokenValue && typeof tokenValue === 'string') {
             this.token = tokenValue;
             console.log(`MySoft Auth Success at: ${endpoint}`);
             return this.token;
           }
         } catch (error: any) {
           lastError = error;
           const errMsg = error.response?.data?.Message || error.response?.data || error.message;
           console.log(`Failed auth at ${endpoint}: ${errMsg}`);
         }
       }
       
       const errorData = lastError?.response?.data;
       const errorMessage = errorData?.Message || errorData || lastError?.message || "Bilinmeyen hata";
       console.error("MySoft All Auth Endpoints Failed:", errorMessage);
       throw new Error(`MySoft Giriş Hatası: ${errorMessage}. Lütfen kullanıcı adı, şifre ve Tenant ID (Genelde 210) bilgilerini kontrol ediniz.`);
    }
    
    throw new Error("MySoft API Token veya kullanıcı bilgileri (Kullanıcı Adı, Şifre) eksik. Lütfen mağaza ayarlarından bilgileri kontrol ediniz.");
  }

  // 2. Taxpayer Query (Mükellef Sorgulama)
  async checkTaxpayer(vknTckn: string): Promise<{ isTaxpayer: boolean; title?: string; documentType: 'E-FATURA' | 'E-ARSIV' }> {
    try {
      const token = await this.authenticate();
      
      const config: any = {
        headers: { Authorization: `Bearer ${token}` }
      };
      if (this.credentials.tenant_id) {
        config.headers['TenantId'] = this.credentials.tenant_id;
      }

      const response = await axios.get(`${this.baseUrl}/Contact/GetContactByVkn?vkn=${vknTckn}`, config);

      // Based on MySoft response (Data.IsEInvoiceUser)
      const data = response.data.Data || response.data;
      const isTaxpayer = data.IsEInvoiceUser || data.isEInvoiceUser || false;

      return {
        isTaxpayer,
        title: data.Title || data.title,
        documentType: isTaxpayer ? 'E-FATURA' : 'E-ARSIV'
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
         return { isTaxpayer: false, documentType: 'E-ARSIV' };
      }
      console.error("MySoft Taxpayer Check Error:", error.response?.data || error.message);
      throw new Error("Mükellef sorgulaması başarısız oldu.");
    }
  }

  // 3. Send Invoice (Giden Fatura Gönderimi)
  async sendInvoice(invoiceData: any): Promise<{ isSuccess: boolean; ettn: string; message: string }> {
    try {
      const token = await this.authenticate();
      
      const config: any = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      };
      if (this.credentials.tenant_id) {
        config.headers['TenantId'] = this.credentials.tenant_id;
      }

      const response = await axios.post(`${this.baseUrl}/Invoice/SendInvoice`, invoiceData, config);

      return {
        isSuccess: true,
        ettn: response.data.Data?.Uuid || response.data.ettn || invoiceData.Uuid,
        message: response.data.Message || "Fatura başarıyla iletildi."
      };
    } catch (error: any) {
      console.error("MySoft Send Invoice Error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.Message || "Fatura gönderimi başarısız oldu.");
    }
  }

  // 4. Get Invoice Status (Fatura Durum Sorgulama)
  async getInvoiceStatus(ettn: string): Promise<{ status: string; message: string; gibStatusCode?: string }> {
     try {
      const token = await this.authenticate();
      
      const config: any = {
        headers: { Authorization: `Bearer ${token}` }
      };
      if (this.credentials.tenant_id) {
        config.headers['TenantId'] = this.credentials.tenant_id;
      }

      const response = await axios.get(`${this.baseUrl}/Invoice/GetInvoiceStatus?uuid=${ettn}`, config);

      const data = response.data.Data || response.data;
      return {
        status: data.StatusName || data.status,
        message: data.StatusDescription || data.message,
        gibStatusCode: data.GibStatusCode
      };
    } catch (error: any) {
      console.error("MySoft Invoice Status Error:", error.response?.data || error.message);
      throw new Error("Fatura durumu sorgulanamadı.");
    }
  }

  // 5. Sync Inbox (Gelen Fatura Senkronizasyonu)
  async getIncomingInvoices(startDate: string, endDate: string, retryOnAuth = true): Promise<any[]> {
    try {
      const token = await this.authenticate();
      
      let lastApiError = null;
      let rawData: any[] = [];
      let success = false;

      // Date format variations: YYYY-MM-DD and DD.MM.YYYY
      const transformDate = (d: string) => {
        const parts = d.split('-');
        if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
        return d;
      };

      const dateDDMMYYYY_start = transformDate(startDate);
      const dateDDMMYYYY_end = transformDate(endDate);

      // Variations of MySoft Inbox endpoints, methods and payloads
      const syncOptions = [
        { url: `${this.baseUrl}/Invoice/GetInboxInvoices`, method: 'GET', params: { StartDate: startDate, EndDate: endDate } },
        { url: `${this.baseUrl}/Invoice/GetInboxInvoices`, method: 'GET', params: { startDate, endDate } },
        { url: `${this.baseUrl}/Invoice/GetInboxInvoices`, method: 'POST', data: { StartDate: startDate, EndDate: endDate, Pagination: { PageNumber: 1, PageSize: 100 } } },
        { url: `${this.baseUrl}/EInvoice/GetInboxInvoices`, method: 'POST', data: { StartDate: startDate, EndDate: endDate } },
        { url: `${this.baseUrl}/EInvoice/GetInboxInvoices`, method: 'GET', params: { StartDate: startDate, EndDate: endDate } },
        { url: `${this.baseUrl}/Invoice/GetInboxInvoices`, method: 'POST', data: { Search: { StartDate: startDate, EndDate: endDate }, Pagination: { PageNumber: 1, PageSize: 100 } } },
        { url: `${this.baseUrl}/Invoice/GetInboxInvoices`, method: 'POST', data: { Search: { StartDate: startDate, EndDate: endDate } } },
        { url: `${this.baseUrl}/Invoice/GetInboxInvoices`, method: 'POST', data: { StartDate: dateDDMMYYYY_start, EndDate: dateDDMMYYYY_end } },
        { url: `${this.baseUrl}/Inbox/GetInvoices`, method: 'GET', params: { startDate, endDate } },
        { url: `${this.baseUrl}/Invoice/GetInvoices`, method: 'GET', params: { StartDate: startDate, EndDate: endDate, IsInbox: true } },
        { url: `${this.baseUrl}/Invoice/GetInvoices`, method: 'POST', data: { StartDate: startDate, EndDate: endDate, Direction: 1 } },
        { url: `${this.baseUrl}/Invoice/GetInvoices`, method: 'POST', data: { StartDate: startDate, EndDate: endDate, IsInbox: true } },
        { url: `${this.baseUrl}/Invoice/GetInboxInvoices`, method: 'POST', data: { StartDate: startDate, EndDate: endDate } },
        { url: `${this.baseUrl}/Invoice/GetInboxInvoiceList`, method: 'GET', params: { StartDate: startDate, EndDate: endDate } },
        { url: `${this.baseUrl}/Invoice/GetInboxInvoiceList`, method: 'POST', data: { StartDate: startDate, EndDate: endDate } },
        { url: `${this.baseUrl}/Archive/GetInboxArchiveInvoices`, method: 'POST', data: { StartDate: startDate, EndDate: endDate } },
        { url: `${this.baseUrl.replace('edocumentapi', 'edonusumapi')}/Invoice/GetInboxInvoices`, method: 'GET', params: { StartDate: startDate, EndDate: endDate } },
        { url: `${this.baseUrl.replace('/api', '')}/api/Invoice/GetInboxInvoices`, method: 'GET', params: { StartDate: startDate, EndDate: endDate } }
      ];

      const errors: string[] = [];
      for (const opt of syncOptions) {
        try {
          console.log(`Trying MySoft Inbox Sync: ${opt.method} ${opt.url} (${JSON.stringify(opt.data || opt.params)})`);
          const config: any = {
            headers: { 
              Authorization: token.toLowerCase().startsWith('bearer') ? token : `Bearer ${token}`,
              'X-Auth-Token': token,
              'AuthToken': token,
              'Token': token,
              'SessionId': token,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 10000
          };
          
          if (this.credentials.tenant_id) {
            const tId = this.credentials.tenant_id;
            config.headers['TenantId'] = tId;
            config.headers['tenantid'] = tId;
            config.headers['ApplicationId'] = tId;
            config.headers['applicationid'] = tId;
            config.headers['AppKey'] = tId;
            config.headers['X-TenantId'] = tId;
            config.headers['X-ApplicationId'] = tId;
            config.headers['X-App-Key'] = tId;
            
            // Also try in data if it's a POST
            if (opt.method === 'POST' && opt.data) {
              (opt.data as any).TenantId = tId;
              (opt.data as any).ApplicationId = tId;
              (opt.data as any).Tenant_Id = tId;
            } else if (opt.method === 'GET') {
              // Add to params if it's a GET
              if (!opt.params) (opt as any).params = {};
              const p = (opt as any).params;
              p.TenantId = tId;
              p.ApplicationId = tId;
            }
          }

          let response;
          if (opt.method === 'POST') {
            response = await axios.post(opt.url, opt.data, config);
          } else {
            response = await axios.get(opt.url, { ...config, params: opt.params });
          }

          if (response.status === 200 && response.data) {
            let data = response.data.Data || response.data.data;
            if (!Array.isArray(data)) {
              data = Array.isArray(response.data) ? response.data : null;
            }
            
            if (data && Array.isArray(data)) {
              rawData = data;
              success = true;
              console.log(`Successfully synced inbox from ${opt.url} using ${opt.method}. Found ${data.length} items.`);
              break;
            }
          }
        } catch (err: any) {
          lastApiError = err;
          const msg = err.response?.data?.Message || err.response?.data || err.message;
          const status = err.response?.status;
          console.log(`MySoft Inbox variation failed (${opt.url} ${opt.method}): [${status}] ${msg}`);
          
          // CRITICAL: If we get a 401 Unauthorized, maybe the token expired. 
          // We clear token and retry the whole process once if configured.
          if (status === 401 && retryOnAuth) {
            console.log("Authorization failed (401), refreshing token and retrying inbox sync...");
            this.token = null;
            return this.getIncomingInvoices(startDate, endDate, false);
          }

          errors.push(`${opt.method} ${opt.url.split('/').pop()}: ${msg}`);
        }
      }

      if (!success) {
        const errorData = lastApiError?.response?.data;
        const errorMessage = errorData?.Message || errorData || lastApiError?.message || "Bilinmeyen API hatası";
        
        // If we have specific accumulated errors, throw a summarized version
        if (errors.length > 0) {
           console.error("All sync variations failed:", errors);
        }
        throw new Error(errorMessage);
      }
      
      // Map to normalized camelCase format for our route logic
      return rawData.map((item: any) => ({
        ettn: item.Uuid || item.uuid || item.ettn || item.Ettn,
        documentNumber: item.Id || item.id || item.documentNumber || item.DocumentNumber,
        issueDate: item.IssueDate || item.issueDate || item.Date || item.date,
        senderTitle: item.SenderTitle || item.senderTitle || item.Title || item.title,
        senderVkn: item.SenderVkn || item.senderVkn || item.Vkn || item.vkn,
        payableAmount: item.PayableAmount || item.payableAmount || item.Amount || item.amount,
        currency: item.CurrencyCode || item.currencyCode || item.Currency || item.currency,
        documentType: item.InvoiceTypeCode || item.invoiceTypeCode || item.Type || item.type,
        raw: item
      }));
    } catch (error: any) {
      console.error("MySoft Inbox Sync Error:", error.message);
      throw new Error(`Gelen faturalar senkronize edilemedi: ${error.message}`);
    }
  }
}
