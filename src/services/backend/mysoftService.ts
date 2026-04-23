import axios from "axios";

// This is a generic MySoft e-Document Wrapper based on typical UBL-TR Integrator setups.
// Note: Some endpoints might need to naturally adapt according to final API contracts of MySoft.

export class MySoftService {
  private baseUrl: string;
  private token: string | null = null;
  private credentials: {
    username?: string;
    api_token?: string;
    tenant_id?: string;
    sender_alias?: string;
    receiver_alias?: string;
    earchive_username?: string;
  };

  constructor(credentials: any) {
    this.baseUrl = "https://edocument.mysoft.com.tr/api"; // Replace with exact base URL from documentation later
    this.credentials = credentials;
  }

  // 1. Token Handling
  private async authenticate() {
    // If the user provided a static API Token from SmartFATURA/MySoft portal, use it directly
    if (this.credentials.api_token && this.credentials.api_token.length > 10) {
       this.token = this.credentials.api_token;
       return this.token;
    }
    
    // Otherwise fallback to OAuth2 logic if they used a password... (legacy)
    throw new Error("MySoft API Token (Statik Token) bulunamadı. Lütfen mağaza ayarlarından token giriniz.");
  }

  // 2. Taxpayer Query (Mükellef Sorgulama)
  async checkTaxpayer(vknTckn: string): Promise<{ isTaxpayer: boolean; title?: string; documentType: 'E-FATURA' | 'E-ARSIV' }> {
    try {
      const token = await this.authenticate();
      
      const response = await axios.get(`${this.baseUrl}/taxpayer/${vknTckn}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Based on MySoft response (if user exists in e-invoice list)
      const isTaxpayer = response.data.isEInvoiceUser || false;

      return {
        isTaxpayer,
        title: response.data.title,
        documentType: isTaxpayer ? 'E-FATURA' : 'E-ARSIV'
      };
    } catch (error: any) {
      // If 404, usually means not a taxpayer
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
      
      // Sending UBL-TR JSON or XML. Most new APIs accept a JSON DTO that they construct into UBL internally.
      const response = await axios.post(`${this.baseUrl}/invoice/send`, invoiceData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      return {
        isSuccess: true,
        ettn: response.data.ettn || invoiceData.Uuid,
        message: "Fatura başarıyla GİB'e iletilmek üzere kuyruğa eklendi."
      };
    } catch (error: any) {
      console.error("MySoft Send Invoice Error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Fatura gönderimi başarısız oldu.");
    }
  }

  // 4. Get Invoice Status (Fatura Durum Sorgulama)
  async getInvoiceStatus(ettn: string): Promise<{ status: string; message: string; gibStatusCode?: string }> {
     try {
      const token = await this.authenticate();
      
      const response = await axios.get(`${this.baseUrl}/invoice/status/${ettn}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return {
        status: response.data.status, // e.g. "APPROVED", "REJECTED", "QUEUED"
        message: response.data.message,
        gibStatusCode: response.data.gibStatusCode
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
      
      // Standard endpoint for Inbox querying, dates usually in ISO format
      // Note: Endpoint varies by provider, this maps a common structure
      const response = await axios.get(`${this.baseUrl}/invoice/inbox`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
           startDate,
           endDate,
           receiverAlias: this.credentials.receiver_alias,
           tenantId: this.credentials.tenant_id
        }
      });
      
      // Assume the response returns an array of simple invoice summaries
      // Typically: [{ ettn, documentNumber, issueDate, senderTitle, senderVkn, payableAmount, currency, documentType }]
      return response.data.data || [];
    } catch (error: any) {
      console.error("MySoft Inbox Sync Error:", error.response?.data || error.message);
      throw new Error("Gelen faturalar senkronize edilemedi.");
    }
  }
}
