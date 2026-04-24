export interface User {
  id: number;
  username: string;
  email: string;
  role: 'superadmin' | 'storeadmin' | 'editor' | 'viewer' | 'customer';
  store_id?: number;
  store_slug?: string;
  name?: string;
  phone?: string;
  address?: string;
}

export interface Product {
  id: number;
  store_id: number;
  barcode: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  cost_price: number;
  cost_currency: string;
  stock_quantity: number;
  min_stock_level: number;
  unit: string;
  tax_rate: number;
  image_url: string;
  category: string;
  sub_category?: string;
  brand?: string;
  author?: string;
  labels?: string[];
  is_web_sale?: boolean;
  product_type?: 'product' | 'service';
  price_2?: number;
  price_2_currency?: string;
  shipping_profile_id?: string;
  created_at: string;
  updated_at: string;
}

export interface FAQEntry {
  question: string;
  answer: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image_url?: string;
  date: string;
}

export interface LegalPage {
  title: string;
  content: string;
}

export interface Store {
  id: number;
  name: string;
  slug: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  address: string;
  phone: string;
  email: string;
  emails?: string[];
  phones?: string[];
  custom_domain?: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  hero_title?: string;
  hero_subtitle?: string;
  hero_image_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  whatsapp_number?: string;
  about_text?: string;
  description?: string;
  faq?: FAQEntry[];
  blog_posts?: BlogPost[];
  legal_pages?: {
    kvkk?: LegalPage;
    privacy?: LegalPage;
    sales_agreement?: LegalPage;
    pre_info?: LegalPage;
  };
  page_layout?: any[];
  page_layout_settings?: {
    show_announcement?: boolean;
    show_stories?: boolean;
    show_campaigns?: boolean;
    show_testimonials?: boolean;
    show_newsletter?: boolean;
    enable_live_activity?: boolean;
    theme?: 'modern' | 'minimal' | 'bold';
  };
  menu_links?: any[];
  footer_links?: any[];
  shipping_profiles?: any[];
  default_currency?: string;
  currency?: string;
  // Payment configuration
  payment_settings?: {
    iyzico_enabled: boolean;
    paypal_enabled: boolean;
    payoneer_enabled: boolean;
    cod_enabled?: boolean;
    bank_transfer_enabled?: boolean;
    bank_details?: string;
    iyzico_api_key?: string;
    iyzico_secret_key?: string;
    iyzico_sandbox?: boolean;
    paypal_client_id?: string;
    payoneer_email?: string;
  };
  einvoice_settings?: EInvoiceSettings;
  created_at: string;
}

export interface EInvoiceSettings {
  is_active: boolean;
  provider: 'mysoft' | 'diyalogo' | 'none';
  username?: string;            // User ID / Tax URN prefix
  api_token?: string;           // E-Fatura Token / API Key
  tenant_id?: string;           // VKN / Tenant
  sender_alias?: string;        // GB
  receiver_alias?: string;      // PK
  earchive_username?: string;   // E-Archive user id
  einvoice_prefix?: string;     // GAP
  earchive_prefix?: string;     // GEA
}

export interface Quotation {
  id: number;
  customer_name: string;
  customer_title?: string;
  total_amount: number;
  currency: string;
  exchange_rate?: number;
  status: 'pending' | 'approved' | 'sold' | 'cancelled';
  notes?: string;
  expiry_date?: string;
  created_at: string;
  items: QuotationItem[];
  company_id?: number;
  tax_number?: string;
  tax_office?: string;
  payment_method?: string;
  due_date?: string;
}

export interface QuotationItem {
  id?: number;
  product_id: number;
  product_name: string;
  barcode?: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  total_price?: number;
}

export interface Sale {
  id: number;
  quotation_id?: number;
  customer_name: string;
  total_amount: number;
  currency: string;
  payment_method: 'cash' | 'card' | 'bank' | 'term';
  due_date?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'returned';
  tracking_number?: string;
  shipping_carrier?: string;
  exchange_rate?: number;
  return_request_status?: 'none' | 'requested' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  items?: any[];
}
