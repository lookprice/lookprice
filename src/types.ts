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
  id: number | string;
  store_id: number;
  barcode: string;
  name: string;
  description: string;
  price: number;
  old_price?: number;
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
  sector_data?: any;
  is_web_sale?: boolean;
  product_type?: 'product' | 'service';
  type?: 'product' | 'vehicle' | 'real_estate';
  db_id?: number;
  branch_name?: string;
  branch_slug?: string;
  available_branches?: { id: number; store_id: number; branch_name: string; branch_slug: string }[];
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

export interface StoreLocation {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  active: boolean;
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
  store_type?: 'product' | 'portfolio';
  sector?: string;
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
  brand_label?: string;
  category_label?: string;
  product_label?: string;
  stock_label?: string;
  show_barcode_in_list?: boolean;
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
    announcement_text?: string;
    theme?: 'modern' | 'minimal' | 'bold';
    theme_variety?: 'modern' | 'minimal' | 'bold' | 'luxury';
    sector?: string;
  };
  menu_links?: any[];
  footer_links?: any[];
  shipping_profiles?: any[];
  default_currency?: string;
  currency?: string;
  locations?: StoreLocation[];
  branches?: { id: number; name: string; slug: string; address: string; phone: string }[];
  consultants?: { id: number; branch_id: number; name: string; email: string; phone: string; role: string; image_url?: string }[];
  reservation_enabled?: boolean;
  financing_settings?: any;
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
  is_tax_inclusive?: boolean;
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

export interface OwnerInfo {
  fullName: string;
  phone: string;
  email?: string;
  idNumber?: string;
}

export interface RealEstateProperty {
  id: number;
  reference_no?: string;
  store_id: number;
  title: string;
  description?: string;
  price: number;
  currency: string;
  location?: string;
  type: 'residence' | 'commercial' | 'land';
  room_count?: string;
  square_meters?: number;
  sqm_gross?: number;
  block_plot?: string; // Ada/Parsel
  facade?: string; // Cephe
  building_age?: string;
  floor?: string;
  total_floors?: string;
  heating?: string;
  furnished?: boolean;
  in_gated_community?: boolean; // Site içi mi
  dues?: number; // Aidat tutarı
  dues_currency?: string; // Aidat para birimi
  country?: 'TR' | 'KKTC'; // Pilot Bölge / Ülke
  kktc_region?: 'Girne' | 'Lefkoşa' | 'Gazimağusa' | 'İskele' | 'Güzelyurt' | 'Lefke'; // KKTC Bölgesi
  kktc_title_type?: 'Türk Koçanı' | 'Eşdeğer Koçan' | 'Tahsis Koçan' | 'Diğer'; // KKTC Koçan Tipi
  images?: string[];
  is_on_enrakipsiz?: boolean;
  virtual_tour_url?: string;
  ai_tour_enabled?: boolean;
  seller_type?: 'professional' | 'individual';
  owner_info?: OwnerInfo;
  is_verified?: boolean;
  verification_status?: 'none' | 'pending' | 'verified' | 'rejected';
  status: 'active' | 'rented' | 'sold' | 'optioned'; // Satılık, Kiralık, Opsiyonlu (Kapora Alındı), Satıldı
  branch_id?: number | string;
  branch_name?: string;
  authorized_branch_id?: number;
  responsible_agent?: string;
  responsible_consultant_id?: number;
  sharing_scope?: 'shared_pool' | 'branch_private' | 'private';
  reserved_by_branch?: string;
  reservation_notes?: string;
  reservation_expiry?: string;
  external_crm_id?: string;
  external_crm_name?: string;
  sync_status?: 'pending' | 'success' | 'error';
  last_sync_at?: string;
  documents?: {
    id: string;
    name: string;
    category: 'title_deed' | 'dask' | 'contract' | 'auth_doc';
    file_url: string;
    upload_date: string;
    size?: string;
    details?: any;
  }[];
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: number;
  store_id: number;
  plate: string;
  type: 'company' | 'personal';
  brand: string;
  model: string;
  year: number;
  chassis_number: string;
  engine_number: string;
  current_mileage: number;
  status: 'active' | 'in_service' | 'broken' | 'sold' | 'for_sale';
  selling_price?: number;
  currency?: string;
  package_name?: string;
  transmission?: 'manual' | 'automatic' | 'dual_clutch' | 'semi_automatic';
  fuel_type?: 'gasoline' | 'diesel' | 'lpg' | 'hybrid' | 'electric';
  color?: string;
  body_type?: string;
  paint_report?: string | Record<string, 'original' | 'painted' | 'replaced'>;
  tramer_amount?: number;
  tramer_currency?: string;
  buying_price?: number;
  buying_currency?: string;
  expenses?: string | { id: string; name: string; amount: number; currency: string; date: string }[];
  target_profit_margin?: number;
  description?: string;
  images?: string[];
  is_on_enrakipsiz?: boolean;
  virtual_tour_url?: string;
  ai_tour_enabled?: boolean;
  seller_type?: 'professional' | 'individual';
  is_verified?: boolean;
  verification_status?: 'none' | 'pending' | 'verified' | 'rejected';
  branch_id?: number | string;
  branch_name?: string;
  responsible_agent?: string;
  sharing_scope?: 'shared_pool' | 'branch_private' | 'private';
  reserved_by_branch?: string;
  reservation_notes?: string;
  reservation_expiry?: string;
  created_at: string;
  updated_at: string;
  expiring_docs?: number;
  maintenance_due?: number;
}

export interface VehicleDocument {
  id: number;
  vehicle_id: number;
  type: string;
  document_url: string;
  expiry_date: string;
  notes: string;
  created_at: string;
  is_recurring: boolean;
  recurrence_period?: string;
}

export interface VehicleMaintenance {
  id: number;
  vehicle_id: number;
  type: string;
  date: string;
  mileage: number;
  cost: number;
  currency: string;
  provider_name: string;
  description: string;
  status: 'planned' | 'completed' | 'cancelled';
  next_maintenance_date: string;
  next_maintenance_mileage: number;
  invoice_url: string | null;
}

export interface VehicleAssignment {
  id: number;
  vehicle_id: number;
  user_id: number;
  driver_id?: number;
  user_email: string;
  start_date: string;
  end_date: string | null;
  start_mileage: number;
  end_mileage: number | null;
}
