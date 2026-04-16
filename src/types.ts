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
  // Payment configuration
  payment_settings?: {
    iyzico_enabled: boolean;
    paypal_enabled: boolean;
    payoneer_enabled: boolean;
  };
  created_at: string;
}

export interface Quotation {
  id: number;
  customer_name: string;
  customer_title?: string;
  total_amount: number;
  currency: string;
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
  return_request_status?: 'none' | 'requested' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  items?: any[];
}
