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
      return rawData.map((item: any) => {
        // Robust extraction from varied MySoft response structures
        const ettn = item.Uuid || item.uuid || item.ettn || item.Ettn || item.invoiceETTN;
        const documentNumber = item.Id || item.id || item.documentNumber || item.DocumentNumber || item.invoiceID;
        const issueDate = item.IssueDate || item.issueDate || item.Date || item.date || item.invoiceDate;
        const senderTitle = item.SenderTitle || item.senderTitle || item.Title || item.title || item.senderName;
        const senderVkn = item.SenderVkn || item.senderVkn || item.Vkn || item.vkn || item.senderIdentifier;
        const payableAmount = item.PayableAmount || item.payableAmount || item.Amount || item.amount || item.totalAmount;
        const currency = item.CurrencyCode || item.currencyCode || item.Currency || item.currency || item.currencyCode || 'TRY';
        const documentType = item.InvoiceTypeCode || item.invoiceTypeCode || item.Type || item.type || item.eDocumentType || 'EFATURA';
        
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
}
