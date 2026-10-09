import React from "react";
import { motion } from "motion/react";
import { XCircle } from "lucide-react";

interface SettingsMenuTabProps {
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  lang: string;
}

export const SettingsMenuTab = ({
  branding,
  onBrandingChange,
  lang,
}: SettingsMenuTabProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            {lang === "tr" ? "Menü Yönetimi" : "Menu Management"}
          </h3>
          <p className="text-sm text-slate-500">
            {lang === "tr"
              ? "Buradan mağazanızın üst menüsünde görünecek bağlantıları yönetebilirsiniz. Yeni bir sayfa oluşturmaz, sadece mevcut bölümlere (örn: /#about) veya dış bağlantılara (örn: https://google.com) yönlendirme yapar."
              : "Manage the links that will appear in your store's top menu. This does not create new pages, it only links to existing sections (e.g., /#about) or external URLs."}
          </p>
        </div>
        <div className="space-y-4">
          {(branding?.menu_links || []).map((link: any, index: number) => (
            <div key={index} className="flex gap-4 items-center">
              <input
                type="text"
                placeholder={lang === "tr" ? "Menü Adı" : "Menu Name"}
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                value={link.label}
                onChange={(e) => {
                  const newLinks = [...(branding?.menu_links || [])];
                  newLinks[index].label = e.target.value;
                  onBrandingChange("menu_links", newLinks);
                }}
              />
              <input
                type="text"
                placeholder={lang === "tr" ? "Link (örn: /about)" : "Link (e.g., /about)"}
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                value={link.url}
                onChange={(e) => {
                  const newLinks = [...(branding?.menu_links || [])];
                  newLinks[index].url = e.target.value;
                  onBrandingChange("menu_links", newLinks);
                }}
              />
              <button
                onClick={() => {
                  const newLinks = (branding?.menu_links || []).filter((_: any, i: number) => i !== index);
                  onBrandingChange("menu_links", newLinks);
                }}
                className="p-3 text-red-500 hover:bg-red-50 rounded-xl"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const newLinks = [...(branding?.menu_links || []), { label: "", url: "" }];
              onBrandingChange("menu_links", newLinks);
            }}
            className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200"
          >
            {lang === "tr" ? "Yeni Link Ekle" : "Add New Link"}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm mt-8">
        <h3 className="text-lg font-bold text-slate-900 mb-6">
          {lang === "tr" ? "Alt Menü (Yasal Sayfalar)" : "Footer Menu (Legal Pages)"}
        </h3>
        <div className="space-y-4">
          {(branding?.footer_links || []).map((link: any, index: number) => (
            <div key={index} className="flex gap-4 items-center">
              <input
                type="text"
                placeholder={lang === "tr" ? "Sayfa Adı (örn: Gizlilik Politikası)" : "Page Name (e.g., Privacy Policy)"}
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                value={link.label}
                onChange={(e) => {
                  const newLinks = [...(branding?.footer_links || [])];
                  newLinks[index].label = e.target.value;
                  onBrandingChange("footer_links", newLinks);
                }}
              />
              <input
                type="text"
                placeholder={lang === "tr" ? "Link (örn: /privacy)" : "Link (e.g., /privacy)"}
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                value={link.url}
                onChange={(e) => {
                  const newLinks = [...(branding?.footer_links || [])];
                  newLinks[index].url = e.target.value;
                  onBrandingChange("footer_links", newLinks);
                }}
              />
              <button
                onClick={() => {
                  const newLinks = (branding?.footer_links || []).filter((_: any, i: number) => i !== index);
                  onBrandingChange("footer_links", newLinks);
                }}
                className="p-3 text-red-500 hover:bg-red-50 rounded-xl"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const newLinks = [...(branding?.footer_links || []), { label: "", url: "" }];
              onBrandingChange("footer_links", newLinks);
            }}
            className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200"
          >
            {lang === "tr" ? "Yeni Sayfa Ekle" : "Add New Page"}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
