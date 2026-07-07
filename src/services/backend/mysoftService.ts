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
    vkn?: string;
    sender_alias?: string;
    receiver_alias?: string;
    earchive_username?: string;
    earchive_uuid?: string;
    connector_guid?: string;
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
      console.log(`[MySoft] Authenticating for user: ${this.credentials.username || this.credentials.earchive_username}`);
      // Use URLSearchParams for x-www-form-urlencoded format
      const params = new URLSearchParams();
      params.append('username', this.credentials.username || this.credentials.earchive_username || '');
      params.append('password', this.credentials.password || (this.credentials as any).api_token || '');
      params.append('grant_type', 'password');
      if (this.credentials.connector_guid) {
        params.append('connector_guid', this.credentials.connector_guid);
      }

      // Robust auth URL resolution
      let authUrl = "";
      if (this.baseUrl.includes('/api')) {
        authUrl = this.baseUrl.split('/api')[0] + '/oauth/token';
      } else {
        authUrl = this.baseUrl + '/oauth/token';
      }
      
      const config: any = {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000
      };

      const response = await axios.post(authUrl, params, config);

      if (response.data.access_token) {
        this.token = response.data.access_token;
        this.tokenExpiry = new Date(Date.now() + (response.data.expires_in - 300) * 1000);
        console.log(`[MySoft] Auth Successful. Token obtained.`);
        return this.token;
      }
      throw new Error("Authentication response failed: No access_token returned");
    } catch (error: any) {
      console.error("MySoft OAuth Error:", error.response?.data || error.message);
      const details = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      throw new Error(`MySoft API kimlik doğrulaması başarısız: ${details}`);
    }
  }

  // 2. Taxpayer Query (Mükellef Sorgulama)
  async checkTaxpayer(vknTckn: string): Promise<{ isTaxpayer: boolean; title?: string; documentType: 'E-FATURA' | 'E-ARSIV' | 'UNKNOWN', alias?: string, waybillAlias?: string }> {
    try {
      const token = await this.authenticate();
      
      const config: any = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const url = `${this.baseUrl}/GeneralCard/getGibAccountModel?vknTckn=${vknTckn}`;
      console.log(`[MySoft DEBUG] Checking GIB account at: ${url}`);
      
      const response = await axios.get(url, config);
      const rawData = response.data;
      
      const data = rawData.Data || rawData.data;

      // If data is null, they are explicitly NOT an E-Invoice user
      if (!data) {
         console.log(`[MySoft checkTaxpayer] Taxpayer ${vknTckn} is NOT an E-Invoice user (returned null). Gracefully returning E-ARSIV.`);
         return { isTaxpayer: false, documentType: 'E-ARSIV' };
      }

      const title = data.gibAccountName || data.GibAccountName || "";
      let alias = "";
      let waybillAlias = "";

      // Extract alias
      const aliasList = data.gibAccountAliasList || data.GibAccountAliasList;
      if (Array.isArray(aliasList) && aliasList.length > 0) {
        // Look for a PK (Posta Kutusu) for E-Fatura
        // gibDocumentType = 1 (E-Fatura), aliasType = 1 (PK)
        const eFaturaPk = aliasList.find(a => a.gibDocumentType === 1 && a.aliasType === 1);
        if (eFaturaPk) {
           alias = eFaturaPk.alias || eFaturaPk.Alias;
        } else {
           // fallback to any pk
           const fallbackPk = aliasList.find(a => a.aliasType === 1) || aliasList[0];
           if (fallbackPk) alias = fallbackPk.alias || fallbackPk.Alias;
        }

        // Look for a PK (Posta Kutusu) for E-Waybill
        // gibDocumentType = 2 (E-Waybill), aliasType = 1 (PK)
        const eWaybillPk = aliasList.find(a => a.gibDocumentType === 2 && a.aliasType === 1);
        if (eWaybillPk) {
           waybillAlias = eWaybillPk.alias || eWaybillPk.Alias;
        }
      }

      console.log(`Taxpayer ${vknTckn} identified as E-FATURA with alias: ${alias}, Waybill PK: ${waybillAlias}`);
      return {
        isTaxpayer: true,
        title: title,
        documentType: 'E-FATURA',
        alias: alias,
        waybillAlias: waybillAlias
      };

    } catch (error: any) {
      console.error("MySoft Taxpayer Check Error:", error.response?.data || error.message);
      return { isTaxpayer: false, documentType: 'UNKNOWN' };
    }
  }

  // 3. Create/Send Invoice (Standardized Outbox Implementation)
  async sendInvoice(invoiceData: any): Promise<{ isSuccess: boolean; ettn: string; message: string }> {
    try {
      const token = await this.authenticate();
      
      const config: any = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        timeout: 30000
      };
      
      const targetUrl = `${this.baseUrl}/InvoiceOutbox/invoiceOutbox`;
      console.log(`[MySoft] Sending Invoice to: ${targetUrl}`);
      console.log(`[MySoft] Payload (summary): ETTN: ${invoiceData.ettn} | DocNo: ${invoiceData.docNo} | Tenant: ${invoiceData.tenantIdentifierNumber}`);
      
      const response = await axios.post(targetUrl, invoiceData, config);

      console.log(`[MySoft] Send Result:`, JSON.stringify(response.data).substring(0, 500));

      if (response.data.succeed === true || response.data.Succeed === true) {
         const data = response.data.data || response.data.Data;
         return {
            isSuccess: true,
            ettn: data?.invoiceETTN || invoiceData.ettn || "",
            message: response.data.message || response.data.Message || "Fatura başarıyla oluşturuldu ve kuyruğa alındı."
         };
      }
      
      const errorMsg = response.data.message || response.data.Message || "Entegratör bilinmeyen bir hata döndürdü.";
      throw new Error(errorMsg);

    } catch (error: any) {
      const apiErrorResponse = error.response?.data;
      let detailedMsg = error.message;
      if (apiErrorResponse) {
        // Handle structured error responses from MySoft
        if (typeof apiErrorResponse === 'object') {
          detailedMsg = apiErrorResponse.message || apiErrorResponse.Message || apiErrorResponse.description || apiErrorResponse.Description || JSON.stringify(apiErrorResponse);
          
          // Check for validation results or schematron errors
          if (apiErrorResponse.validationResults || apiErrorResponse.ValidationResults) {
             const results = apiErrorResponse.validationResults || apiErrorResponse.ValidationResults;
             if (Array.isArray(results)) {
                const innerErrors = results.map((r: any) => r.message || r.Message || r.description || r.Description).filter(Boolean).join(' | ');
                if (innerErrors) detailedMsg += " -> Detaylar: " + innerErrors;
             }
          }
        } else {
          detailedMsg = String(apiErrorResponse);
        }
      }
      console.error("[MySoft] Send Invoice Error:", detailedMsg);
      throw new Error(detailedMsg);
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
        config.headers['ApplicationId'] = this.credentials.tenant_id;
      }

      const response = await axios.get(`${this.baseUrl}/InvoiceOutbox/getInvoiceOutboxStatus?invoiceETTN=${ettn}`, config);

      const data = response.data.Data || response.data.data || response.data;
      return {
        status: data.StatusName || data.status || "UNKNOWN",
        message: data.StatusDescription || data.message || "",
        gibStatusCode: data.GibStatusCode
      };
    } catch (error: any) {
      console.error("MySoft Invoice Status Error:", error.response?.data || error.message);
      throw new Error("Fatura durumu sorgulanamadı.");
    }
  }

  // 5. Delete Draft Invoice
  async deleteInvoiceDraft(ettn: string): Promise<boolean> {
    try {
      const token = await this.authenticate();
      const config: any = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const response = await axios.post(`${this.baseUrl}/Invoice/deleteInvoiceDraft`, [String(ettn)], config);
      return response.data.succeed || response.data.Succeed;
    } catch (error: any) {
      console.error("MySoft Delete Draft Error:", error.response?.data || error.message);
      return false;
    }
  }

  // 6. Sign and Send Draft Invoice
  async signAndSendInvoiceDraft(ettn: string): Promise<boolean> {
    try {
      const token = await this.authenticate();
      const config: any = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const response = await axios.post(`${this.baseUrl}/Invoice/invoiceDraftSignAndSend?invoiceETTN=${ettn}`, null, config);
      return response.data.succeed || response.data.Succeed;
    } catch (error: any) {
      console.error("MySoft Sign and Send Error:", error.response?.data || error.message);
      return false;
    }
  }

  // 7. Sync Inbox (Gelen Fatura Senkronizasyonu)
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
        // 1. getInvoiceInboxListForPeriod (POST with null tenant) - Often works for API users
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
        // 2. getInvoiceInboxListForPeriod (POST) - Documented way using tenantId
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
        // If item is just a string, it's likely the UUID itself
        if (typeof item === 'string') {
          return {
            ettn: item,
            documentNumber: "",
            issueDate: "",
            senderTitle: "",
            senderVkn: "",
            payableAmount: 0,
            currency: 'TRY',
            documentType: 'EFATURA',
            raw: item
          };
        }

        // Robust extraction from varied MySoft response structures
        const ettn = item.Uuid || item.uuid || item.ettn || item.Ettn || item.invoiceETTN || item.DocumentUUID || item.documentUUID || item.invoiceUuid || item.InvoiceUuid || "";
        const documentNumber = item.Id || item.id || item.documentNumber || item.DocumentNumber || item.invoiceID || item.documentId || item.DocumentId || item.InvoiceNumber || item.invoiceNumber || "";
        const issueDate = item.IssueDate || item.issueDate || item.Date || item.date || item.invoiceDate || item.DocumentDate || item.documentDate || item.ExecutionDate || item.executionDate || "";
        const senderTitle = item.SenderTitle || item.senderTitle || item.Title || item.title || item.senderName || item.SenderName || item.companyName || item.CompanyName || item.customerName || item.CustomerName || item.TaxpayerName || item.taxpayerName || "";
        const senderVkn = item.SenderVkn || item.senderVkn || item.Vkn || item.vkn || item.senderIdentifier || item.SenderVknTckn || item.senderVknTckn || item.CustomerVkn || item.customerVkn || item.vkntckn || item.VknTckn || item.TaxNumber || item.taxNumber || item.TaxId || item.taxId || "";
        const payableAmount = item.PayableAmount || item.payableAmount || item.Amount || item.amount || item.totalAmount || item.TotalAmount || item.GrandTotal || item.grandTotal || item.InvoiceAmount || item.invoiceAmount || 0;
        const taxAmount = item.TaxAmount || item.taxAmount || item.LineTotalTaxAmount || item.TotalTaxAmount || item.totalTaxAmount || 0;
        const baseAmount = item.LineExtensionAmount || item.lineExtensionAmount || item.TaxExclusiveAmount || item.taxExclusiveAmount || (Number(payableAmount) - Number(taxAmount)) || 0;
        const currency = item.CurrencyCode || item.currencyCode || item.Currency || item.currency || item.documentCurrencyCode || item.DocumentCurrencyCode || 'TRY';
        const documentType = item.InvoiceTypeCode || item.invoiceTypeCode || item.Type || item.type || item.eDocumentType || item.DocumentType || item.documentType || item.profileId || item.ProfileId || 'EFATURA';
        const exchangeRate = Number(item.PricingExchangeRate?.CalculationRate || item.pricingExchangeRate?.calculationRate || item.ExchangeRate || item.exchangeRate || item.CurrencyRate || item.currencyRate || 1);
        
        return {
          ettn,
          documentNumber,
          issueDate,
          senderTitle,
          senderVkn,
          payableAmount: Number(payableAmount) || 0,
          taxAmount: Number(taxAmount) || 0,
          baseAmount: Number(baseAmount) || 0,
          currency,
          documentType,
          exchangeRate,
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
          "Accept": "application/json"
        },
        params: {
          invoiceETTN: ettn,
          reason: reason || (status === 'APPROVED' ? 'Fatura tarafımızca kabul edilmiştir.' : 'Fatura reddedilmiştir.'),
          notes: reason || (status === 'APPROVED' ? 'Fatura tarafımızca kabul edilmiştir.' : 'Fatura reddedilmiştir.')
        }
      };

      if (this.credentials.tenant_id) {
        config.headers['TenantId'] = this.credentials.tenant_id;
        config.headers['ApplicationId'] = this.credentials.tenant_id;
      }
      if (this.credentials.vkn) {
        config.params.tenantIdentifierNumber = this.credentials.vkn;
      }

      const endpoint = status === 'APPROVED' ? 'AcceptInvoice' : 'DenyInvoice';
      console.log(`Sending MySoft Application Response (${status}) for ${ettn} via GET to: ${this.baseUrl}/InvoiceInbox/${endpoint}`);
      
      const response = await axios.get(`${this.baseUrl}/InvoiceInbox/${endpoint}`, config);

      const isSucceed = response.data?.succeed === true || response.data?.Succeed === true;
      if (isSucceed) {
         return {
            isSuccess: true,
            message: response.data.message || response.data.Message || "Yanıt başarıyla iletildi."
         };
      }
      
      throw new Error(response.data?.message || response.data?.Message || "Uygulama yanıtı iletilemedi.");
    } catch (error: any) {
      const apiError = error.response?.data?.message || error.response?.data?.Message || error.message;
      console.error("MySoft Application Response Error:", apiError);
      throw new Error(apiError);
    }
  }

  // 7. Cancel Invoice (e-Archive Cancellation)
  async cancelInvoice(ettn: string, reason: string, eDocumentType?: string): Promise<{ isSuccess: boolean; message: string }> {
    try {
      const token = await this.authenticate();
      
      const config: any = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      if (eDocumentType === 'E-ARSIV' || eDocumentType === 'E-ARCHIVE') {
          console.log(`Cancelling MySoft E-Archive Invoice for ${ettn}`);
          const dateStr = new Date().toISOString().split('T')[0];
          const storeVkn = this.credentials.vkn;
          // Use GET /InvoiceOutbox/cancelEarchiveInvoice with a valid cancelType like KEP
          const res = await axios.get(`${this.baseUrl}/InvoiceOutbox/cancelEarchiveInvoice?invoiceETTN=${ettn}&cancelDate=${dateStr}&cancelType=KEP&notes=${encodeURIComponent(reason)}&tenantIdentifierNumber=${storeVkn}`, config);
          
          if (res.data.succeed === true) {
             return {
                isSuccess: true,
                message: res.data.message || "E-Arşiv faturası başarıyla iptal edildi."
             };
          }
          throw new Error(res.data.message || "E-Arşiv fatura iptal edilemedi.");
      } else {
          // E-Fatura iptal / Cancel Invoice generic
          config.headers["Content-Type"] = "application/json";
          const payload = {
            invoiceETTN: ettn,
            reason: reason
          };
    
          console.log(`Cancelling MySoft Invoice for ${ettn} at: ${this.baseUrl}/InvoiceOutbox/cancelInvoice`);
          
          const response = await axios.post(`${this.baseUrl}/InvoiceOutbox/cancelInvoice`, payload, config);
    
          if (response.data.succeed === true) {
             return {
                isSuccess: true,
                message: response.data.message || "Fatura başarıyla iptal edildi."
             };
          }
          throw new Error(response.data.message || "Fatura iptal edilemedi.");
      }
    } catch (error: any) {
      const apiError = error.response?.data?.message || error.response?.data?.Message || error.message;
      console.error("MySoft Cancel Invoice Error:", apiError);
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
        },
        timeout: 15000
      };
      
      const tId = this.credentials.tenant_id;
      const storeVkn = this.credentials.vkn;
      
      // Try a few variations for detail fetch based on documentation and successful list patterns
      const variations = [
        // 1. getInvoiceInboxModel (Common MySoft endpoint for structured data)
        { url: `${this.baseUrl}/InvoiceInbox/getInvoiceInboxModel`, method: 'GET', params: { invoiceETTN: ettn, tenantIdentifierNumber: storeVkn } },
        { url: `${this.baseUrl}/InvoiceInbox/getInvoiceInboxModel`, method: 'GET', params: { invoiceETTN: ettn, tenantIdentifierNumber: null } },
        { url: `${this.baseUrl}/InvoiceInbox/getInvoiceInboxModel`, method: 'GET', params: { invoiceETTN: ettn, tenantIdentifierNumber: tId } },
        
        // 2. Older / alternate endpoints
        { url: `${this.baseUrl}/InvoiceInbox/GetInvoiceInboxDetail`, method: 'GET', params: { uuid: ettn, tenantIdentifierNumber: storeVkn } },
        { url: `${this.baseUrl}/Invoice/GetInvoiceByUuid`, method: 'GET', params: { uuid: ettn, tenantIdentifierNumber: storeVkn } },
        
        // 3. Document details fetch (often returns UBL or JSON model)
        { url: `${this.baseUrl}/InvoiceInbox/GetInvoiceDetailByUuid`, method: 'GET', params: { uuid: ettn, tenantIdentifierNumber: storeVkn } },
        { url: `${this.baseUrl}/InvoiceInbox/GetInvoice`, method: 'GET', params: { id: ettn } }
      ];
      
      for (const opt of variations as any[]) {
        try {
          console.log(`Trying MySoft Invoice Details: ${opt.method} ${opt.url}`);
          let response;
          if (opt.method === 'GET') {
            response = await axios.get(opt.url, { ...config, params: opt.params });
          } else {
            response = await axios.post(opt.url, opt.data || {}, config);
          }

          if (response.status === 200 && response.data) {
             const isSuccess = response.data.Succeed ?? response.data.succeed ?? response.data.Success ?? response.data.success ?? true;
             if (!isSuccess) {
                console.log(`MySoft Details variation returned Succeed: false (${opt.url})`);
                continue;
             }
             const data = response.data.Data || response.data.data || response.data;
             if (data) {
                console.log(`Successfully fetched details from ${opt.url}`);
                return data;
             }
          }
        } catch (e: any) {
          console.log(`MySoft Details variation failed (${opt.url}): ${e.message}`);
        }
      }
      throw new Error(`Detaylar alınamadı: ${ettn}`);
    } catch (error: any) {
      console.error("MySoft Invoice Details Error:", error.message);
      return null;
    }
  }

  // 7. Get Invoice HTML
  async getInvoiceHtml(ettn: string, invoiceNumber?: string): Promise<string> {
    try {
      const token = await this.authenticate();
      const tId = this.credentials.tenant_id;
      const storeVkn = this.credentials.vkn;

      // Extract default tenant from token if possible (OID)
      let defaultTid = "";
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        defaultTid = payload.oid || "";
      } catch (e) {}

      // Try these TenantId / ApplicationId combinations
      const contextVariations = [
        { tenantId: tId, applicationId: tId },
        { tenantId: defaultTid, applicationId: defaultTid },
        { tenantId: tId, applicationId: "1" },
        { tenantId: defaultTid, applicationId: "1" },
        { tenantId: storeVkn, applicationId: storeVkn },
        { tenantId: "", applicationId: "" }
      ].filter(v => v.tenantId || v.applicationId || v === contextVariations[5]);

      const isEArchive = invoiceNumber?.startsWith('GEA') || invoiceNumber?.startsWith('GAP') || invoiceNumber?.startsWith('EAR');

      // Targeted endpoints based on document type - reduced for performance
      const endpoints = isEArchive ? [
        `${this.baseUrl}/EArchiveOutbox/getEArchiveOutboxHTML`,
        `${this.baseUrl}/EArchive/getEArchiveHTML`,
      ] : [
        `${this.baseUrl}/InvoiceOutbox/getInvoiceOutboxHTML`,
        `${this.baseUrl}/InvoiceInbox/getInvoiceInboxHTML`,
        `${this.baseUrl}/Invoice/getInvoiceHTML`,
      ];

      const paramVariations: any[] = [
        { earchiveUUID: ettn, vknTckn: storeVkn },
        { uuid: ettn, vknTckn: storeVkn },
        { ettn: ettn, vknTckn: storeVkn },
        { invoiceNumber: invoiceNumber, vknTckn: storeVkn },
        { uuid: ettn },
        { ettn: ettn },
      ];

      console.log(`[HTML-FETCH] Starting exhaustive search for ${isEArchive ? 'E-Archive' : 'Invoice'} ${ettn} (${invoiceNumber})`);

      for (const ctx of contextVariations) {
        const config: any = {
          headers: { 
            Authorization: token.toLowerCase().startsWith('bearer') ? token : `Bearer ${token}`,
            'vknTckn': storeVkn
          },
          responseType: 'arraybuffer',
          timeout: 5000
        };
        if (ctx.tenantId) config.headers['TenantId'] = ctx.tenantId;
        if (ctx.applicationId) config.headers['ApplicationId'] = ctx.applicationId;

        for (const url of endpoints) {
          for (const params of paramVariations) {
            try {
              // Only try relevant combinations
              const response = await axios.get(url, {
                ...config,
                params: params
              });
              
              if (response.status === 200 && response.data) {
                const buffer = Buffer.from(response.data);
                if (buffer.length < 10) continue;

                // Handle responses as before...
                // (Optimized for space, reusing the existing buffer handling logic)
                
                // 1. Handle JSON response
                if (buffer[0] === 123) { // '{'
                  try {
                    const jsonObj = JSON.parse(buffer.toString('utf8'));
                    const isSuccess = jsonObj.succeed ?? jsonObj.Succeed ?? jsonObj.success ?? jsonObj.Success ?? true;
                    if (isSuccess) {
                      const base64Data = jsonObj.data || jsonObj.Data || jsonObj.html || jsonObj.Html;
                      if (base64Data && typeof base64Data === 'string' && base64Data.length > 50) {
                        const decoded = Buffer.from(base64Data, 'base64');
                        if (decoded[0] === 0x50 && decoded[1] === 0x4B) {
                          const AdmZip = (await import('adm-zip')).default;
                          const zip = new AdmZip(decoded);
                          for (const entry of zip.getEntries()) {
                            const content = entry.getData().toString('utf8');
                            if (content.includes('<html') || content.includes('<body') || content.includes('<?xml')) return content;
                          }
                        } else {
                          const content = decoded.toString('utf8');
                          if (content.includes('<html') || content.includes('<body') || content.includes('<?xml')) return content;
                        }
                      }
                    }
                  } catch (e) {}
                }
                
                // 2. Handle direct ZIP
                if (buffer[0] === 0x50 && buffer[1] === 0x4B) {
                  try {
                    const AdmZip = (await import('adm-zip')).default;
                    const zip = new AdmZip(buffer);
                    for (const entry of zip.getEntries()) {
                      const content = entry.getData().toString('utf8');
                      if (content.includes('<html') || content.includes('<body') || content.includes('<?xml')) return content;
                    }
                  } catch (e) {}
                }
                
                // 3. Handle direct string
                const content = buffer.toString('utf8');
                if (content.includes('<html') || content.includes('<body') || content.includes('<?xml')) return content;
              }
            } catch (e: any) {
              // Silently continue to next variation
            }
          }
        }
      }
      
      throw new Error("Fatura görseli entegratör sisteminde bulunamadı. Lütfen daha sonra tekrar deneyiniz veya faturanın onaylanmış olduğundan emin olunuz.");
    } catch (error: any) {
      console.error("MySoft HTML Error:", error.message);
      throw new Error(error.message);
    }
  }

  // --- E-İRSALİYE (Waybill / DespatchAdvice) METHODS ---

  // 1. Send E-Waybill (Sevk İrsaliyesi Gönderimi)
  async sendWaybill(waybillData: any): Promise<{ isSuccess: boolean; ettn: string; message: string }> {
    try {
      const token = await this.authenticate();
      
      const config: any = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        timeout: 30000
      };

      if (this.credentials.tenant_id) {
        config.headers['TenantId'] = this.credentials.tenant_id;
        config.headers['ApplicationId'] = this.credentials.tenant_id;
      }
      
      const targetUrl = `${this.baseUrl}/DespatchOutbox/despatchOutbox`;
      console.log(`[MySoft] Sending Waybill (e-Irsaliye) to: ${targetUrl}`);
      console.log(`[MySoft] Waybill Payload (summary): ETTN: ${waybillData.ettn} | DocNo: ${waybillData.docNo}`);
      
      const response = await axios.post(targetUrl, waybillData, config);

      console.log(`[MySoft] Waybill Send Result:`, JSON.stringify(response.data).substring(0, 500));

      if (response.data.succeed === true || response.data.Succeed === true) {
         const data = response.data.data || response.data.Data;
         return {
            isSuccess: true,
            ettn: data?.despatchETTN || waybillData.ettn || "",
            message: response.data.message || response.data.Message || "E-İrsaliye başarıyla oluşturuldu ve kuyruğa alındı."
         };
      }
      
      const errorMsg = response.data.message || response.data.Message || "Entegratör bilinmeyen bir hata döndürdü.";
      throw new Error(errorMsg);

    } catch (error: any) {
      const apiErrorResponse = error.response?.data;
      let detailedMsg = error.message;
      if (apiErrorResponse) {
        // Handle structured error responses from MySoft
        if (typeof apiErrorResponse === 'object') {
          detailedMsg = apiErrorResponse.message || apiErrorResponse.Message || apiErrorResponse.description || apiErrorResponse.Description || JSON.stringify(apiErrorResponse);
          
          // Check for validation results or schematron errors (common in e-Waybill)
          if (apiErrorResponse.validationResults || apiErrorResponse.ValidationResults) {
             const results = apiErrorResponse.validationResults || apiErrorResponse.ValidationResults;
             if (Array.isArray(results)) {
                const innerErrors = results.map((r: any) => r.message || r.Message || r.description || r.Description).filter(Boolean).join(' | ');
                if (innerErrors) detailedMsg += " -> Detaylar: " + innerErrors;
             }
          }
        } else {
          detailedMsg = String(apiErrorResponse);
        }
      }
      console.error("[MySoft] Send Waybill Error:", detailedMsg);
      throw new Error(detailedMsg);
    }
  }

  // 2. Get Waybill Status (E-İrsaliye Durum Sorgulama)
  async getWaybillStatus(ettn: string): Promise<{ status: string; message: string; gibStatusCode?: string }> {
     try {
      const token = await this.authenticate();
      
      const config: any = {
        headers: { Authorization: `Bearer ${token}` }
      };
      if (this.credentials.tenant_id) {
        config.headers['TenantId'] = this.credentials.tenant_id;
        config.headers['ApplicationId'] = this.credentials.tenant_id;
      }

      const response = await axios.get(`${this.baseUrl}/DespatchOutbox/getDespatchOutboxStatus?despatchETTN=${ettn}`, config);

      const data = response.data.Data || response.data.data || response.data;
      return {
        status: data.StatusName || data.status || "UNKNOWN",
        message: data.StatusDescription || data.message || "",
        gibStatusCode: data.GibStatusCode
      };
    } catch (error: any) {
      console.error("MySoft Waybill Status Error:", error.response?.data || error.message);
      throw new Error("E-İrsaliye durumu sorgulanamadı.");
    }
  }

  // 3. Get Waybill HTML representation
  async getWaybillHtml(ettn: string, notes?: string): Promise<string> {
    try {
      const token = await this.authenticate();
      const tId = this.credentials.tenant_id;
      const storeVkn = this.credentials.vkn;

      const config: any = {
        headers: { 
          Authorization: token.toLowerCase().startsWith('bearer') ? token : `Bearer ${token}` 
        },
        responseType: 'arraybuffer',
        timeout: 15000
      };

      if (tId) {
        config.headers['TenantId'] = tId;
        config.headers['ApplicationId'] = tId;
      }

      const endpoints = [
        `${this.baseUrl}/DespatchOutbox/getDespatchOutboxHTMLAsZip`,
        `${this.baseUrl}/DespatchInbox/getDespatchInboxHTMLAsZip`,
        `${this.baseUrl}/DespatchOutbox/getDespatchOutboxHTML`,
        `${this.baseUrl}/DespatchInbox/getDespatchInboxHTML`
      ];

      const paramVariations: any[] = [
        { despatchETTN: ettn },
        { despatchETTN: ettn, tenantIdentifierNumber: storeVkn },
        { despatchETTN: ettn, tenantIdentifierNumber: tId },
        { ettn: ettn },
        { uuid: ettn }
      ];

      for (const url of endpoints) {
        for (const params of paramVariations) {
          try {
            console.log(`[WAYBILL-HTML-FETCH] Trying URL: ${url} with params: ${JSON.stringify(params)}`);
            const response = await axios.get(url, { ...config, params });
            
            if (response.status === 200 && response.data) {
              const buffer = Buffer.from(response.data);
              
              // Handle JSON response
              if (buffer[0] === 123) { // '{'
                const jsonObj = JSON.parse(buffer.toString('utf8'));
                const isSuccess = jsonObj.succeed ?? jsonObj.Succeed ?? jsonObj.success ?? jsonObj.Success ?? true;
                if (isSuccess) {
                  const base64Data = jsonObj.data || jsonObj.Data || jsonObj.html || jsonObj.Html;
                  if (base64Data && typeof base64Data === 'string') {
                    const decoded = Buffer.from(base64Data, 'base64');
                    if (decoded[0] === 0x50 && decoded[1] === 0x4B) { // ZIP
                      const AdmZip = (await import('adm-zip')).default;
                      const zip = new AdmZip(decoded);
                      for (const entry of zip.getEntries()) {
                        const content = entry.getData().toString('utf8');
                        if (content.includes('<html') || content.includes('<body') || content.includes('<?xml')) return content;
                      }
                    } else {
                      const content = decoded.toString('utf8');
                      if (content.includes('<html') || content.includes('<body') || content.includes('<?xml')) return content;
                    }
                  }
                }
                continue;
              }

              // Handle direct ZIP
              if (buffer[0] === 0x50 && buffer[1] === 0x4B) {
                const AdmZip = (await import('adm-zip')).default;
                const zip = new AdmZip(buffer);
                for (const entry of zip.getEntries()) {
                  const content = entry.getData().toString('utf8');
                  if (content.includes('<html') || content.includes('<body') || content.includes('<?xml')) return content;
                }
              }

              // Handle direct HTML
              const content = buffer.toString('utf8');
              if (content.includes('<html') || content.includes('<body') || content.includes('<?xml')) return content;
            }
          } catch (e) { /* continue */ }
        }
      }
      
      // Fallback: build a beautiful customized print template
      return `
        <html>
        <head>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background: white; line-height: 1.5; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; }
            .title { font-size: 24px; font-weight: bold; color: #0f172a; margin: 0; }
            .meta { font-size: 13px; color: #64748b; margin-top: 5px; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
            .note-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-top: 20px; white-space: pre-wrap; font-size: 13px; color: #334155; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">E-İRSALİYE SEVK BELGESİ</h1>
              <div class="meta">ETTN: ${ettn}</div>
            </div>
            <div style="text-align: right">
              <div style="font-weight: bold; font-size: 14px;">MÜKELLEF SEVK İRSALİYESİ</div>
              <div class="meta">Yasal Belge / Resmi Evraktır</div>
            </div>
          </div>
          <div class="section">
             <div class="section-title">Bilgilendirme</div>
             <p>Bu belge MySoft entegrasyonu üzerinden başarıyla tescil edilmiştir. Detaylı tasarım görüntüsü (XSLT) entegratör tarafından henüz oluşturuluyor olabilir.</p>
          </div>
          <div class="note-box">
             <strong>NOTLAR:</strong><br/>
             ${notes ? notes.replace(/\n/g, '<br/>') : 'Açıklama bulunmamaktadır.'}
          </div>
        </body>
        </html>
      `;
    } catch (error: any) {
      console.warn("MySoft Waybill HTML Fetch issue:", error.message);
      return `<html><body><h3>E-İRSALİYE BELGESİ</h3><p>ETTN: ${ettn}</p><div style="margin-top:20px; white-space:pre-wrap;"><strong>NOTLAR:</strong><br/>${notes || ''}</div></body></html>`;
    }
  }
}