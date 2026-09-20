import React, { useState } from "react";
import { motion } from "motion/react";
import TeamAccessManagement from "../../../components/TeamAccessManagement";
import { ShopThemeStudio } from "../../../components/dashboard/ShopThemeStudio";
import { HorecaThemeStudio } from "../../../components/dashboard/HorecaThemeStudio";
import {
  Palette,
  Tag,
  FileText,
  Share2,
  BarChart3,
  Users,
  Save,
  RefreshCw,
  X,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  ExternalLink,
  BookOpen,
} from "lucide-react";

interface SettingsWebTabProps {
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  lang: string;
  isPortfolio: boolean;
  currentUser: any;
  emails: string[];
  phones: string[];
  updateEmail: (index: number, value: string) => void;
  removeEmail: (index: number) => void;
  addEmail: () => void;
  updatePhone: (index: number, value: string) => void;
  removePhone: (index: number) => void;
  addPhone: () => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFaviconUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  users: any[];
  onAddUser: () => void;
  onDeleteUser: (id: number) => void;
  onSaveBranding?: () => void;
  savingBranding?: boolean;
}

export const SettingsWebTab = ({
  branding,
  onBrandingChange,
  lang,
  isPortfolio,
  currentUser,
  emails,
  phones,
  updateEmail,
  removeEmail,
  addEmail,
  updatePhone,
  removePhone,
  addPhone,
  users,
  onAddUser,
  onSaveBranding,
  savingBranding,
}: SettingsWebTabProps) => {
  const txt = (tr: string, en: string, el: string) => (lang === "tr" ? tr : lang === "el" ? el : en);
  const isCafeRestaurant = branding?.store_type === 'cafe_restaurant' || branding?.page_layout_settings?.sector === 'cafe_restaurant';

  const [activeSubTab, setActiveSubTab] = useState<'theme' | 'labels' | 'legal' | 'contact' | 'analytics' | 'team'>('theme');

  const subNavItems = [
    { id: 'theme', label: txt('Vitrin', 'Theme', 'Βιτρίνα'), icon: Palette, show: true },
    { id: 'labels', label: txt('Etiketler', 'Labels', 'Ετικέτες'), icon: Tag, show: !isPortfolio && !isCafeRestaurant },
    { id: 'legal', label: txt('Politikalar', 'Policies', 'Πολιτικές'), icon: FileText, show: !isPortfolio && !isCafeRestaurant },
    { id: 'contact', label: txt('İletişim', 'Contact', 'Επικοινωνία'), icon: Share2, show: true },
    { id: 'analytics', label: txt('SEO', 'SEO', 'SEO'), icon: BarChart3, show: true },
    { id: 'team', label: txt('Ekip', 'Team', 'Ομάδα'), icon: Users, show: true },
  ].filter(item => item.show);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-4 pb-12"
    >
      {/* Upper Horizontal Bar: Micro Sub-Nav Tabs & Top Action */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {subNavItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-400 dark:text-indigo-600" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {onSaveBranding && (
          <button
            type="button"
            onClick={onSaveBranding}
            disabled={savingBranding}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 ml-auto shrink-0"
          >
            {savingBranding ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{txt('Kaydediliyor...', 'Saving...', 'Aποθήκευση...')}</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{txt('Değişiklikleri Kaydet', 'Save Changes', 'Αποθήκευση')}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* SUB-TAB 1: TEMA VE VİTRİN STÜDYOSU */}
      {activeSubTab === 'theme' && (
        <div className="space-y-4">
          {isCafeRestaurant ? (
            <HorecaThemeStudio
              branding={branding}
              onBrandingChange={onBrandingChange}
              lang={lang}
              onSave={onSaveBranding}
              saving={savingBranding}
              storeId={branding?.id || branding?.slug}
            />
          ) : (
            <ShopThemeStudio
              branding={branding}
              onBrandingChange={onBrandingChange}
              lang={lang}
              onSave={onSaveBranding}
              saving={savingBranding}
            />
          )}
        </div>
      )}

      {/* SUB-TAB 2: ÖZEL ETİKETLER VE HAKKIMIZDA */}
      {activeSubTab === 'labels' && !isPortfolio && !isCafeRestaurant && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Label Customization */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-500" />
                {txt('Özel Arayüz Etiketleri', 'Custom Interface Labels', 'Ετικέτες Διεπαφής')}
              </h3>
              <button
                type="button"
                onClick={() => {
                  onBrandingChange("brand_label", lang === "tr" ? "Yazarlar" : "Authors");
                  onBrandingChange("category_label", lang === "tr" ? "Kitap Türleri" : "Book Types");
                  onBrandingChange("product_label", lang === "tr" ? "Kitap" : "Book");
                  onBrandingChange("stock_label", lang === "tr" ? "Stoktaki Kitap Sayısı" : "Books in Stock");
                  onBrandingChange("hero_title", lang === "tr" ? "Okumayı Seviyoruz" : "We Love Reading");
                }}
                className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg text-[10px] font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <BookOpen className="w-3 h-3" />
                {txt('Kitapçı Konsepti Uygula', 'Apply Bookstore Concept', 'Εφαρμογή Concept Βιβλιοπωλείου')}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {txt('Marka Etiketi', 'Brand Label', 'Ετικέτα Μάρκας')}
                </label>
                <input
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder={txt('Örn: Yazarlar', 'e.g. Authors', 'π.χ. Συγγραφείς')}
                  value={branding?.brand_label || ""}
                  onChange={(e) => onBrandingChange("brand_label", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {txt('Kategori Etiketi', 'Category Label', 'Ετικέτα Κατηγορίας')}
                </label>
                <input
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder={txt('Örn: Koleksiyon', 'e.g. Collections', 'π.χ. Συλλογές')}
                  value={branding?.category_label || ""}
                  onChange={(e) => onBrandingChange("category_label", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {txt('Ürün Adlandırma', 'Product Label', 'Ετικέτα Προϊόντος')}
                </label>
                <input
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder={txt('Örn: Kitap', 'e.g. Book', 'π.χ. Βιβλίο')}
                  value={branding?.product_label || ""}
                  onChange={(e) => onBrandingChange("product_label", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {txt('Stok Etiketi', 'Stock Label', 'Ετικέτα Αποθέματος')}
                </label>
                <input
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder={txt('Örn: Kalan Adet', 'e.g. Remaining', 'π.χ. Υπόλοιπο')}
                  value={branding?.stock_label || ""}
                  onChange={(e) => onBrandingChange("stock_label", e.target.value)}
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
              {"* " + txt('Bu ayarlar web sitenizdeki filtreleme ve detay sayfalarındaki başlıkları özelleştirir.', 'Customizes title labels on website filtering & product pages.', 'Προσαρμόζει τις ετικέτες επικεφαλίδας στον ιστότοπό σας.')}
            </p>
          </div>

          {/* About Text */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
              {txt('Hakkımızda Metni', 'About Store Text', 'Κείμενο Σχετικά με Εμάς')}
            </h3>
            <textarea
              className="w-full h-28 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
              value={branding?.about_text || ""}
              onChange={(e) => onBrandingChange("about_text", e.target.value)}
              placeholder={txt('Mağazanız hakkında kurumsal bilgi metni yazın...', 'Write company background information...', 'Γράψτε πληροφορίες σχετικά με το κατάστημά σας...')}
            />
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  {txt('Google Merchant Sayfa URL', 'Google Merchant URL', 'Google Merchant URL')}
                </p>
                <code className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono break-all font-bold">
                  {window.location.origin}/store/{branding?.slug}/about-us
                </code>
              </div>
              <a
                href={`${window.location.origin}/store/${branding?.slug}/about-us`}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: YASAL POLİTİKALAR */}
      {activeSubTab === 'legal' && !isPortfolio && !isCafeRestaurant && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {txt('İade Politikası', 'Return Policy', 'Πολιτική Επιστροφών')}
              </h3>
              <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-md border border-amber-200 dark:border-amber-800">
                Merchant Zorunlu
              </span>
            </div>
            <textarea
              className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
              value={branding?.legal_pages?.return_policy || ""}
              onChange={(e) =>
                onBrandingChange("legal_pages", { ...branding?.legal_pages, return_policy: e.target.value })
              }
              placeholder={txt('İade şartları ve cayma hakkı metnini girin...', 'Enter return policy and withdrawal conditions...', 'Εισάγετε την πολιτική επιστροφών...')}
            />
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  {txt('Sayfa Linki', 'Page Link', 'Σύνδεσμος Σελίδας')}
                </p>
                <code className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono break-all font-bold">
                  {window.location.origin}/store/{branding?.slug}/return-policy
                </code>
              </div>
              <a
                href={`${window.location.origin}/store/${branding?.slug}/return-policy`}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {txt('Kargo Politikası', 'Shipping Policy', 'Πολιτική Αποστολής')}
              </h3>
              <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-md border border-amber-200 dark:border-amber-800">
                Merchant Zorunlu
              </span>
            </div>
            <textarea
              className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
              value={branding?.legal_pages?.shipping_policy || ""}
              onChange={(e) =>
                onBrandingChange("legal_pages", { ...branding?.legal_pages, shipping_policy: e.target.value })
              }
              placeholder={txt('Kargo, teslimat süreleri ve süreç metnini girin...', 'Enter shipping options & delivery times...', 'Εισάγετε την πολιτική αποστολής...')}
            />
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  {txt('Sayfa Linki', 'Page Link', 'Σύνδεσμος Σελίδας')}
                </p>
                <code className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono break-all font-bold">
                  {window.location.origin}/store/{branding?.slug}/shipping-policy
                </code>
              </div>
              <a
                href={`${window.location.origin}/store/${branding?.slug}/shipping-policy`}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: İLETİŞİM VE SOSYAL MEDYA */}
      {activeSubTab === 'contact' && (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Emails & Phones */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider pb-1 border-b border-slate-100 dark:border-slate-800">
                {txt('E-Posta & Telefon Yönetimi', 'Manage Emails & Phones', 'Διαχείριση Email & Tηλεφώνων')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {txt('E-Posta Adresleri', 'Emails', 'Emails')}
                    </span>
                    <button
                      type="button"
                      onClick={addEmail}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      + {txt('Ekle', 'Add', 'Προσθήκη')}
                    </button>
                  </div>
                  {emails.map((email, idx) => (
                    <div key={idx} className="flex gap-1.5 items-center">
                      <input
                        className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                        value={email}
                        onChange={(e) => updateEmail(idx, e.target.value)}
                      />
                      {emails.length > 1 && (
                        <button type="button" onClick={() => removeEmail(idx)} className="text-rose-500 hover:bg-rose-50 p-1 rounded-lg">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {txt('Telefon Numaraları', 'Phones', 'Τηλέφωνα')}
                    </span>
                    <button
                      type="button"
                      onClick={addPhone}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      + {txt('Ekle', 'Add', 'Προσθήκη')}
                    </button>
                  </div>
                  {phones.map((phone, idx) => (
                    <div key={idx} className="flex gap-1.5 items-center">
                      <input
                        className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                        value={phone}
                        onChange={(e) => updatePhone(idx, e.target.value)}
                      />
                      {phones.length > 1 && (
                        <button type="button" onClick={() => removePhone(idx)} className="text-rose-500 hover:bg-rose-50 p-1 rounded-lg">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider pb-1 border-b border-slate-100 dark:border-slate-800">
                {txt('Sosyal Medya Bağlantıları', 'Social Media Links', 'Σύνδεσμοι Social Media')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { icon: <Instagram className="w-3.5 h-3.5 text-pink-500" />, key: "instagram_url", label: "Instagram", placeholder: "@kullaniciadi" },
                  { icon: <Facebook className="w-3.5 h-3.5 text-blue-600" />, key: "facebook_url", label: "Facebook", placeholder: "facebook.com/sayfa" },
                  { icon: <Twitter className="w-3.5 h-3.5 text-sky-500" />, key: "twitter_url", label: "Twitter (X)", placeholder: "@twitter" },
                  { icon: <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />, key: "whatsapp_number", label: "WhatsApp", placeholder: "+90..." },
                ].map((social) => (
                  <div key={social.key} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="p-1 bg-white dark:bg-slate-700 rounded-lg shadow-2xs">{social.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{social.label}</p>
                      <input
                        className="w-full bg-transparent text-xs font-bold text-slate-900 dark:text-white outline-none placeholder:text-slate-300"
                        placeholder={social.placeholder}
                        value={branding?.[social.key as keyof typeof branding] || ""}
                        onChange={(e) => onBrandingChange(social.key as any, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: SEO VE ANALİTİK */}
      {activeSubTab === 'analytics' && (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
              {txt('Google İzleme & Dijital Analitik', 'Google Tracking & Digital Analytics', 'Google Analytics & SEO')}
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Google Analytics / GTM / Search Console</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Google Analytics ID (gtag)
              </label>
              <input
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                placeholder="G-XXXXXXXXXX"
                value={
                  branding?.meta_settings &&
                  typeof branding.meta_settings === "object" &&
                  !Array.isArray(branding.meta_settings)
                    ? branding.meta_settings.ga_measurement_id || ""
                    : ""
                }
                onChange={(e) => {
                  const newSettings = { ...(branding?.meta_settings || {}) };
                  newSettings.ga_measurement_id = e.target.value;
                  onBrandingChange("meta_settings", newSettings);
                }}
              />
              <p className="text-[9px] text-slate-400">{txt("Örn: G-XXXXXXXXXX", "e.g., G-XXXXXXXXXX", "π.χ. G-XXXXXXXXXX")}</p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Google Tag Manager (GTM) ID
              </label>
              <input
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                placeholder="GTM-XXXXXXX"
                value={
                  branding?.meta_settings &&
                  typeof branding.meta_settings === "object" &&
                  !Array.isArray(branding.meta_settings)
                    ? branding.meta_settings.gtm_id || ""
                    : ""
                }
                onChange={(e) => {
                  const newSettings = { ...(branding?.meta_settings || {}) };
                  newSettings.gtm_id = e.target.value;
                  onBrandingChange("meta_settings", newSettings);
                }}
              />
              <p className="text-[9px] text-slate-400">{txt("Örn: GTM-XXXXXXX", "e.g., GTM-XXXXXXX", "π.χ. GTM-XXXXXXX")}</p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Search Console Kodu
              </label>
              <input
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                placeholder="Content Değeri"
                value={
                  branding?.meta_settings &&
                  typeof branding.meta_settings === "object" &&
                  !Array.isArray(branding.meta_settings)
                    ? branding.meta_settings.gsc_id || ""
                    : ""
                }
                onChange={(e) => {
                  const newSettings = { ...(branding?.meta_settings || {}) };
                  newSettings.gsc_id = e.target.value;
                  onBrandingChange("meta_settings", newSettings);
                }}
              />
              <p className="text-[9px] text-slate-400">{txt("Site doğrulama meta content değeri", "Site verification meta content", "Τιμή περιεχομένου επαλήθευσης")}</p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: EKİP YETKİLERİ */}
      {activeSubTab === 'team' && (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <TeamAccessManagement 
            users={users} 
            currentUser={currentUser} 
            lang={lang} 
            onRefreshUsers={onAddUser} 
          />
        </div>
      )}
    </motion.div>
  );
};
