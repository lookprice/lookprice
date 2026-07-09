export interface Store {
  id: number;
  name: string;
  slug: string;
  address?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  country: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  subscription_end: string;
  logo_url?: string;
  admin_email?: string;
  default_currency?: string;
  language?: string;
  parent_id?: number | string | null;
  store_type?: 'product' | 'real_estate' | 'motor_vehicle';
  sub_sector?: string;
  status?: string;
  is_approved?: boolean;
  max_products?: number;
  max_properties?: number;
  max_vehicles?: number;
  max_users?: number;
  max_customers?: number;
  is_enrakipsiz_featured?: boolean;
  enrakipsiz_featured_order?: number;
  enrakipsiz_featured_title?: string;
}

export interface Lead {
  id: number;
  store_name: string;
  company_title?: string;
  email?: string;
  status: string;
  probability: number;
  notes?: string;
  created_at: string;
}

export interface EnrakipsizSettings {
  portal_title?: string;
  portal_description?: string;
  announcement?: string;
  primary_color?: string;
  footer_text?: string;
  portal_domain?: string;
  theme_style?: string;
  font_family?: string;
  layout_sections?: string;
  custom_css?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  google_analytics_id?: string;
  google_tag_manager_id?: string;
  google_search_console_id?: string;
}

export interface EnrakipsizSlide {
  id: number;
  title: string;
  subtitle: string;
  description?: string;
  image_url: string;
  badge?: string;
  type?: string;
  link_url?: string;
  accent?: string;
  is_active?: boolean;
  order?: number;
}

export interface EnrakipsizAd {
  id: number;
  title: string;
  broker: string;
  description?: string;
  profit_badge?: string;
  action_text?: string;
  link_url?: string;
  media_type?: 'image' | 'video' | 'html';
  media_url?: string;
  position?: 'top' | 'middle' | 'sidebar';
  is_active?: boolean;
  order?: number;
}
