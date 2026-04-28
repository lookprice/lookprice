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
  };

  constructor(credentials: any) {
    this.baseUrl = credentials.api_url || "https://edocumentapi.mysoft.com.tr/api";
    this.credentials = credentials;
  }

  // 1. Token Handling
  private async authenticate() {
    // If the user provided a static API Token from SmartFATURA/MySoft portal, use it directly
    if (this.credentials.api_token && this.credentials.api_token.length > 10) {
       this.token = this.credentials.api_token;
       return this.token;
    }
    
    // Some MySoft services use Username/Password for token generation
    if (this.credentials.username && this.credentials.password) {
       try {
         const response = await axios.post(`${this.baseUrl}/Login/Authentication`, {
           Username: this.credentials.username,
           Password: this.credentials.password
         });
         this.token = response.data.Data || response.data.token || response.data;
         return this.token;
       } catch (error) {
         console.error("MySoft Auth Error:", error);
       }
    }
    
    throw new Error("MySoft API Token veya kullanıcı bilgileri bulunamadı. Lütfen mağaza ayarlarından bilgileri kontrol ediniz.");
  }

  // 2. Taxpayer Query (Mükellef Sorgulama)
  async checkTaxpayer(vknTckn: string): Promise<{ isTaxpayer: boolean; title?: string; documentType: 'E-FATURA' | 'E-ARSIV' }> {
    try {
      const token = await this.authenticate();
      
      const response = await axios.get(`${this.baseUrl}/Contact/GetContactByVkn?vkn=${vknTckn}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

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
      
      const response = await axios.post(`${this.baseUrl}/Invoice/SendInvoice`, invoiceData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

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
      
      const response = await axios.get(`${this.baseUrl}/Invoice/GetInvoiceStatus?uuid=${ettn}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

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
  async getIncomingInvoices(startDate: string, endDate: string): Promise<any[]> {
    try {
      const token = await this.authenticate();
      
      // MySoft Inbox endpoint often prefers POST for searches
      const response = await axios.post(`${this.baseUrl}/Invoice/GetInboxInvoices`, {
        StartDate: startDate,
        EndDate: endDate
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`MySoft Inbox Sync response status: ${response.status}`);
      if (response.data) {
         console.log(`MySoft Inbox Sync response data keys: ${Object.keys(response.data)}`);
      }
      
      let rawData = response.data.Data || response.data.data;
      if (!Array.isArray(rawData)) {
        rawData = Array.isArray(response.data) ? response.data : [];
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
      console.error("MySoft Inbox Sync Error:", error.response?.data || error.message);
      throw new Error("Gelen faturalar senkronize edilemedi.");
    }
  }
}
