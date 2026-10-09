import { LucideIcon } from "lucide-react";

export interface SectionConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  enabled: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  image_url?: string;
}

export interface WebContent {
  hero: { 
    title: string; 
    subtitle: string; 
    bgImage: string 
  };
  stats: { 
    value: string; 
    label: string 
  }[];
  trustSlogan: string;
}

export interface FooterLink {
  label: string;
  url: string;
  content?: string;
  type?: "url" | "content";
}

export interface WebsiteLayout {
  sections: { id: string; enabled: boolean }[];
  grid: string;
  count: number;
  banners: string[];
  quickLinks: FooterLink[];
  corporateLinks: FooterLink[];
}
