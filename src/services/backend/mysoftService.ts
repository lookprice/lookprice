import axios from "axios";

// This is a generic MySoft e-Document Wrapper based on typical UBL-TR Integrator setups.
// Note: Some endpoints might need to naturally adapt according to final API contracts of MySoft.

export class MySoftService {
  private baseUrl: string;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
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

  // 1. Token Handling - Phase 1 Implementation
  private async authenticate(): Promise<string> {
    if (this.token && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.token;
    }

    try {
      // Use URLSearchParams for x-www-form-urlencoded format
      const params = new URLSearchParams();
      params.append('username', this.credentials.username || '');
      params.append('password', this.credentials.password || '');
      params.append('grant_type', 'password');

      // Robust auth URL resolution
      let authUrl = "";
      if (this.baseUrl.includes('/api')) {
        authUrl = this.baseUrl.split('/api')[0] + '/oauth/token';
      } else {
        authUrl = this.baseUrl + '/oauth/token';
      }
      
      console.log(`Authenticating with MySoft OAuth at: ${authUrl}`);
      
      const response = await axios.post(authUrl, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000
      });

      if (response.data.access_token) {
        this.token = response.data.access_token;
        // Token'ı birkaç dakika önce expire olmuş gibi ayarlayalım ki güvenli olsun
        this.tokenExpiry = new Date(Date.now() + (response.data.expires_in - 300) * 1000);
        return this.token;
      }
      throw new Error("Authentication response failed");
    } catch (error: any) {
      console.error("MySoft OAuth Error:", error.response?.data || error.message);
      throw new Error("MySoft API kimlik doğrulaması başarısız.");
    }
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

  // 3. Create/Send Invoice (Standardized Outbox Implementation)
  async sendInvoice(invoiceData: any): Promise<{ isSuccess: boolean; ettn: string; message: string }> {
    try {
      const token = await this.authenticate();
      
      const config: any = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json-patch+json"
        },
        timeout: 20000
      };
      
      console.log(`Sending MySoft Invoice (Outbox) to: ${this.baseUrl}/InvoiceOutbox/invoiceOutbox`);
      
      const response = await axios.post(`${this.baseUrl}/InvoiceOutbox/invoiceOutbox`, invoiceData, config);

      if (response.data.succeed === true) {
         return {
            isSuccess: true,
            ettn: response.data.data?.invoiceETTN || invoiceData.ettn || "",
            message: response.data.message || "Fatura başarıyla oluşturuldu ve kuyruğa alındı."
         };
      }
      
      const errorMsg = response.data.message || "Entegratör bilinmeyen bir hata döndürdü.";
      throw new Error(errorMsg);

    } catch (error: any) {
      const apiError = error.response?.data?.message || error.response?.data?.Message || error.message;
      console.error("MySoft Send Invoice Error:", apiError);
      throw new Error(apiError);
    }
  }

  // 4. Get Invoice Status (Fatura Durum Sorgulama)


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

      // Variations of MySoft Inbox endpoints based on provided documentation and trial/error
      const tId = this.credentials.tenant_id;
      const syncOptions = [
        // 1. getInvoiceInboxListForPeriod (POST) - Primary documented way
        { 
          url: `${this.baseUrl}/InvoiceInbox/getInvoiceInboxListForPeriod`, 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          data: { 
            startDate: startDate + " 00:00:00", 
            endDate: endDate + " 23:59:59", 
            afterValue: 0, 
            limit: 0,
            isUseDocDate: true,
            tenantIdentifierNumber: tId
          } 
        },
        // 2. getInvoiceInboxListForPeriod (POST with null tenant)
        { 
          url: `${this.baseUrl}/InvoiceInbox/getInvoiceInboxListForPeriod`, 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          data: { 
            startDate: startDate + " 00:00:00", 
            endDate: endDate + " 23:59:59", 
            afterValue: 0, 
            limit: 0,
            isUseDocDate: true,
            tenantIdentifierNumber: null
          } 
        },
        // 3. getNewInvoiceInboxList (POST) 
        { 
          url: `${this.baseUrl}/InvoiceInbox/getNewInvoiceInboxList`, 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          data: { afterValue: 0, limit: 0, tenantIdentifierNumber: tId } 
        },
        // 4. getNewInvoiceInboxList (POST with null tenant)
        { 
          url: `${this.baseUrl}/InvoiceInbox/getNewInvoiceInboxList`, 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          data: { afterValue: 0, limit: 0, tenantIdentifierNumber: null } 
        },
        // 4.1 getNewInvoiceInboxList (POST without tenant field)
        { 
          url: `${this.baseUrl}/InvoiceInbox/getNewInvoiceInboxList`, 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          data: { afterValue: 0, limit: 100 } 
        },
        // 5. Generic GET variations (Older APIs)
        { url: `${this.baseUrl}/InvoiceInbox/invoiceInbox`, method: 'GET', params: { startDate, endDate, tenantIdentifierNumber: tId } },
        { url: `${this.baseUrl}/Invoice/GetInboxInvoices`, method: 'GET', params: { StartDate: startDate, EndDate: endDate, tenantIdentifierNumber: tId } },
      ];

      const errors: string[] = [];
      for (const opt of syncOptions) {
        try {
          console.log(`Trying MySoft Inbox Sync: ${opt.method} ${opt.url}`);
          const config: any = {
            headers: { 
              Authorization: token.toLowerCase().startsWith('bearer') ? token : `Bearer ${token}`,
              'Accept': 'application/json',
              ...(opt.headers || {})
            },
            timeout: 15000
          };
          
          if (this.credentials.tenant_id) {
            config.headers['TenantId'] = this.credentials.tenant_id;
            config.headers['ApplicationId'] = this.credentials.tenant_id;
          }

          let response;
          if (opt.method === 'POST') {
            response = await axios.post(opt.url, opt.data, config);
          } else {
            response = await axios.get(opt.url, { ...config, params: opt.params });
          }

          if (response.status === 200 && response.data) {
            // MySoft often returns Success: true/false inside a 200 OK
            const isSuccess = response.data.Succeed ?? response.data.succeed ?? response.data.Success ?? response.data.success ?? true;
            if (!isSuccess) {
               const msg = response.data.Message || response.data.message || "İşlem başarısız (Succeed: false)";
               console.log(`MySoft Inbox variation returned Succeed: false (${opt.url}): ${msg}`);
               errors.push(`${opt.method} ${opt.url.split('/').pop()}: [200] ${msg}`);
               continue;
            }

            let data = response.data.Data || response.data.data || response.data.Items || response.data.items;
            
            // If data is still null, but the root is an array
            if (data === undefined || data === null) {
              if (Array.isArray(response.data)) {
                data = response.data;
              } else if (response.data.value && Array.isArray(response.data.value)) {
                data = response.data.value;
              }
            } else if (!Array.isArray(data) && data.Items && Array.isArray(data.Items)) {
              // Handle { Data: { Items: [] } }
              data = data.Items;
            } else if (!Array.isArray(data) && data.items && Array.isArray(data.items)) {
              data = data.items;
            }
            
            if (data && Array.isArray(data)) {
              rawData = data;
              success = true;
              console.log(`Successfully synced inbox from ${opt.url} using ${opt.method}. Found ${data.length} items.`);
              break;
            } else {
              console.log(`MySoft Inbox variation returned 200 but no array found (${opt.url})`);
              errors.push(`${opt.method} ${opt.url.split('/').pop()}: [200] Beklenen liste formatı bulunamadı`);
            }
          }
        } catch (err: any) {
          lastApiError = err;
          const msg = err.response?.data?.Message || err.response?.data?.message || err.response?.data || err.message;
          const status = err.response?.status;
          console.log(`MySoft Inbox variation failed (${opt.url} ${opt.method}): [${status}] ${msg}`);
          
          if (status === 401 && retryOnAuth) {
            console.log("Authorization failed (401), refreshing token and retrying inbox sync...");
            this.token = null;
            return this.getIncomingInvoices(startDate, endDate, false);
          }

          errors.push(`${opt.method} ${opt.url.split('/').pop()}: [${status}] ${msg}`);
        }
      }

      if (!success) {
        console.error("All sync variations failed. Errors tracked:", errors);
        throw new Error(`Entegratörün fatura listeleme servislerine ulaşılamadı. Hatalar: ${errors.join(' | ')}`);
      }
      
      // Map to normalized camelCase format for our route logic
      return rawData.map((item: any) => {
        // Robust extraction from varied MySoft response structures
        const ettn = item.Uuid || item.uuid || item.ettn || item.Ettn || item.invoiceETTN || item.DocumentUUID || item.documentUUID || item.invoiceUuid || item.InvoiceUuid || "";
        const documentNumber = item.Id || item.id || item.documentNumber || item.DocumentNumber || item.invoiceID || item.documentId || item.DocumentId || item.InvoiceNumber || item.invoiceNumber || "";
        const issueDate = item.IssueDate || item.issueDate || item.Date || item.date || item.invoiceDate || item.DocumentDate || item.documentDate || item.ExecutionDate || item.executionDate || "";
        const senderTitle = item.SenderTitle || item.senderTitle || item.Title || item.title || item.senderName || item.SenderName || item.companyName || item.CompanyName || item.customerName || item.CustomerName || item.TaxpayerName || item.taxpayerName || "";
        const senderVkn = item.SenderVkn || item.senderVkn || item.Vkn || item.vkn || item.senderIdentifier || item.SenderVknTckn || item.senderVknTckn || item.CustomerVkn || item.customerVkn || item.vkntckn || item.VknTckn || item.TaxNumber || item.taxNumber || item.TaxId || item.taxId || "";
        const payableAmount = item.PayableAmount || item.payableAmount || item.Amount || item.amount || item.totalAmount || item.TotalAmount || item.PayableAmount || item.GrandTotal || item.grandTotal || item.InvoiceAmount || item.invoiceAmount || 0;
        const currency = item.CurrencyCode || item.currencyCode || item.Currency || item.currency || item.documentCurrencyCode || item.DocumentCurrencyCode || 'TRY';
        const documentType = item.InvoiceTypeCode || item.invoiceTypeCode || item.Type || item.type || item.eDocumentType || item.DocumentType || item.documentType || item.profileId || item.ProfileId || 'EFATURA';
        
        return {
          ettn,
          documentNumber,
          issueDate,
          senderTitle,
          senderVkn,
          payableAmount: Number(payableAmount) || 0,
          currency,
          documentType,
          raw: item
        };
      });
    } catch (error: any) {
      console.error("MySoft Inbox Sync Error:", error.message);
      throw new Error(`Gelen faturalar senkronize edilemedi: ${error.message}`);
    }
  }

  // 6. Send Application Response (Ticari Fatura Yanıtı - Kabul/Red)
  async sendApplicationResponse(ettn: string, status: 'APPROVED' | 'REJECTED', reason = ""): Promise<{ isSuccess: boolean; message: string }> {
    try {
      const token = await this.authenticate();
      
      const config: any = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json-patch+json"
        }
      };
      
      const payload = {
        uuid: ettn,
        responseStatus: status === 'APPROVED' ? 'KABUL' : 'RED',
        reason: reason || (status === 'APPROVED' ? 'Fatura tarafımızca kabul edilmiştir.' : 'Fatura reddedilmiştir.')
      };

      console.log(`Sending MySoft Application Response for ${ettn} at: ${this.baseUrl}/InvoiceInbox/saveApplicationResponse`);
      
      const response = await axios.post(`${this.baseUrl}/InvoiceInbox/saveApplicationResponse`, payload, config);

      if (response.data.succeed === true) {
         return {
            isSuccess: true,
            message: response.data.message || "Yanıt başarıyla iletildi."
         };
      }
      
      throw new Error(response.data.message || "Uygulama yanıtı iletilemedi.");
    } catch (error: any) {
      const apiError = error.response?.data?.message || error.response?.data?.Message || error.message;
      console.error("MySoft Application Response Error:", apiError);
      throw new Error(apiError);
    }
  }

  // 8. Get Invoice Details by UUID
  async getInvoiceDetailsByUuid(ettn: string): Promise<any> {
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
      
      // Try a few variations for detail fetch
      const variations = [
        `${this.baseUrl}/InvoiceInbox/GetInvoiceDetailByUuid?uuid=${ettn}`,
        `${this.baseUrl}/Invoice/GetInvoiceByUuid?uuid=${ettn}`
      ];
      
      for (const url of variations) {
        try {
          const response = await axios.get(url, config);
          if (response.status === 200 && response.data) {
             const data = response.data.Data || response.data.data || response.data;
             return data;
          }
        } catch (e) {
          // ignore
        }
      }
      throw new Error(`Detaylar alınamadı: ${ettn}`);
    } catch (error: any) {
      console.error("MySoft Invoice Details Error:", error.message);
      return null;
    }
  }

  // 7. Get Invoice HTML
  async getInvoiceHtml(ettn: string): Promise<string> {
    try {
      const token = await this.authenticate();
      
      const config: any = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const variations = [
        { url: `${this.baseUrl}/InvoiceInbox/GetInvoiceHtml`, method: 'POST', data: { uuid: ettn, tenantIdentifierNumber: this.credentials.tenant_id } },
        { url: `${this.baseUrl}/Invoice/GetHtml`, method: 'POST', data: { uuid: ettn, tenantIdentifierNumber: this.credentials.tenant_id } },
        { url: `${this.baseUrl}/Invoice/getInvoiceHtml`, method: 'POST', data: { Id: ettn, tenantIdentifierNumber: this.credentials.tenant_id } },
        { url: `${this.baseUrl}/InvoiceInbox/getInvoiceHtml`, method: 'GET', params: { uuid: ettn, tenantIdentifierNumber: this.credentials.tenant_id } }
      ];

      for (const opt of variations) {
        try {
          const response = await axios({
            url: opt.url,
            method: opt.method,
            headers: {
              ...config.headers,
              "Content-Type": opt.method === 'POST' ? "application/json" : undefined
            },
            data: opt.method === 'POST' ? opt.data : undefined,
            params: opt.method === 'GET' ? opt.params : undefined
          });

          if (response.status === 200 && response.data) {
            const html = response.data.Data || response.data.data || response.data.Html || response.data.html || response.data;
            if (typeof html === 'string' && (html.includes('<html') || html.includes('<body') || html.includes('<div'))) {
              return html;
            }
          }
        } catch (e) {
          // ignore error and try next
        }
      }

      throw new Error("HTML formatı bulunamadı veya entegratör desteklemiyor.");
    } catch (error: any) {
      console.error("MySoft HTML Info Error:", error.message);
      throw new Error(error.message);
    }
  }
}