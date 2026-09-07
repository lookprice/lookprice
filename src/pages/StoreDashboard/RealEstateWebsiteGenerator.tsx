import React, { useState, useEffect } from "react";
import { LiteRichEditor } from "../../components/LiteRichEditor";
import {
  Globe,
  Palette,
  Save,
  Plus,
  Trash2,
  Edit3,
  Image as ImageIcon,
  Check,
  X,
  Layers,
  Store,
  Sparkles,
  Link as LinkIcon
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { api } from "../../services/api";
import { toast } from "sonner";
import { FooterLink } from "../../types/websiteGenerator";

export const RealEstateWebsiteGenerator = ({
  storeId,
}: {
  storeId?: number;
}) => {
  const { lang } = useLanguage();
  const isTr = lang === 'tr';

  const [originalBranding, setOriginalBranding] = useState<any>({});
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [storeSlug, setStoreSlug] = useState("abone");
  const [customDomain, setCustomDomain] = useState("");
  const [useCustomDomain, setUseCustomDomain] = useState(false);

  const [storeTitle, setStoreTitle] = useState(isTr ? "Kurumsal Gayrimenkul & Yatırım Portföyü" : "Exclusive Real Estate & Investment Portfolio");
  const [storeSubtitle, setStoreSubtitle] = useState(isTr ? "Yatırım hedeflerinizi gerçeğe dönüştüren profesyonel gayrimenkul çözümleri." : "Professional real estate solutions turning your investment goals into reality.");
  const [trustSlogan, setTrustSlogan] = useState(isTr ? "10 Yıldır Güvenle" : "Trusted for 10 Years");

  const [quickLinks, setQuickLinks] = useState<FooterLink[]>([
    { label: isTr ? "Mülklerimiz" : "Properties", url: "#portfolio", type: "url" },
    { label: isTr ? "Bölgelerimiz" : "Locations", url: "#", type: "url" },
    {
      label: isTr ? "Biz Kimiz?" : "Who Are We?",
      url: "",
      type: "content",
      content: isTr
        ? `Biz Seçkin Emlak ekibi olarak yatırımlarınıza değer katıyoruz.`
        : `As the Exclusive Real Estate team, we add value to your investments.`,
    },
    { label: isTr ? "İletişim" : "Contact", url: "#contact", type: "url" },
  ]);

  const [corporateLinks, setCorporateLinks] = useState<FooterLink[]>([
    { label: isTr ? "Gizlilik Politikası" : "Privacy Policy", url: "", type: "content", content: isTr ? "Gizlilik politikamız..." : "Privacy policy..." },
    { label: isTr ? "Kullanım Koşulları" : "Terms of Use", url: "", type: "content", content: isTr ? "Kullanım koşulları..." : "Terms of use..." },
    { label: isTr ? "KVKK Aydınlatma" : "KVKK Disclosure", url: "", type: "content", content: isTr ? "KVKK metnimiz..." : "KVKK disclosure..." },
  ]);

  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editingLinkInfo, setEditingLinkInfo] = useState<{ list: "quick" | "corporate"; index: number } | null>(null);

  useEffect(() => {
    if (storeId) {
      api.getBranding(storeId).then((res) => {
        if (res && !res.error) {
          setOriginalBranding(res);
          if (res.logo_url) setLogoUrl(res.logo_url);
          if (res.favicon_url) setFaviconUrl(res.favicon_url);
          if (res.slug) setStoreSlug(res.slug);
          if (res.custom_domain) { setCustomDomain(res.custom_domain); setUseCustomDomain(true); }
          if (res.slogan) setTrustSlogan(res.slogan);

          const webContent = res.page_layout_settings?.web_content;
          if (webContent) {
            if (webContent.hero?.title) setStoreTitle(webContent.hero.title);
            if (webContent.hero?.subtitle) setStoreSubtitle(webContent.hero.subtitle);
            if (webContent.trustSlogan) setTrustSlogan(webContent.trustSlogan);
          }

          const layout = res.page_layout;
          if (layout && typeof layout === "object" && !Array.isArray(layout)) {
            if (layout.quickLinks && Array.isArray(layout.quickLinks)) setQuickLinks(layout.quickLinks);
            if (layout.corporateLinks && Array.isArray(layout.corporateLinks)) setCorporateLinks(layout.corporateLinks);
          }
        }
      }).catch(console.error);
    }
  }, [storeId]);

  const handleSave = async () => {
    if (!storeId) return;
    try {
      const updatedLayout = {
        ...(originalBranding.page_layout || {}),
        quickLinks,
        corporateLinks,
      };

      const updatedWebContent = {
        ...(originalBranding.page_layout_settings?.web_content || {}),
        hero: {
          title: storeTitle,
          subtitle: storeSubtitle,
          bgImage: originalBranding.page_layout_settings?.web_content?.hero?.bgImage || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000"
        },
        trustSlogan
      };

      const payload = {
        ...originalBranding,
        logo_url: logoUrl,
        favicon_url: faviconUrl,
        slogan: trustSlogan,
        slug: storeSlug,
        custom_domain: useCustomDomain ? customDomain : null,
        page_layout: updatedLayout,
        page_layout_settings: {
          ...(originalBranding.page_layout_settings || {}),
          web_content: updatedWebContent
        }
      };

      await api.updateBranding(payload, storeId);
      toast.success(isTr ? "Web Sitesi ve Footer Ayarları başarıyla güncellendi!" : "Website & Footer settings successfully updated!");
    } catch (error) {
      console.error(error);
      toast.error(isTr ? "Kaydedilirken bir hata oluştu." : "An error occurred while saving.");
    }
  };

  const openEditor = (list: "quick" | "corporate", index: number) => {
    setEditingLinkInfo({ list, index });
    setEditorModalOpen(true);
  };

  const removeLink = (list: "quick" | "corporate", index: number) => {
    const setter = list === "quick" ? setQuickLinks : setCorporateLinks;
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const addLink = (list: "quick" | "corporate") => {
    const setter = list === "quick" ? setQuickLinks : setCorporateLinks;
    setter((prev) => [...prev, { label: isTr ? "Yeni Bağlantı" : "New Link", url: "#", type: "url", content: "" }]);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-300">
            <Globe className="w-3.5 h-3.5 animate-pulse" /> {isTr ? "Canlı Web Senkronizasyonu" : "Live Web Sync"}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            {isTr ? "Web Sitesi & Footer Yönetimi" : "Website & Footer Management"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl">
            {isTr
              ? "Restatelp web temasıyla tam entegre çalışan marka kimliği, logo, favicon ve footer zengin içerik bağlantılarını buradan yönetebilirsiniz."
              : "Manage fully integrated brand identity, logo, favicon, and footer rich-content links synchronized with your Restatelp theme."}
          </p>
        </div>
        <button
          onClick={handleSave}
          className="relative z-10 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center gap-2 shrink-0 hover:scale-105 active:scale-95"
        >
          <Save className="w-4 h-4" /> {isTr ? "Değişiklikleri Kaydet" : "Save Changes"}
        </button>
      </div>

      {/* Main Grid Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Brand Identity & Favicon / Logo */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
                {isTr ? "Marka Kimliği, Logo & Favicon" : "Brand Identity, Logo & Favicon"}
              </h3>
              <p className="text-xs text-slate-500 font-medium">{isTr ? "Site ikonları ve ana başlık bilgileri" : "Site icons and main title info"}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                {isTr ? "Kurumsal Logo URL" : "Corporate Logo URL"}
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                />
                {logoUrl && (
                  <div className="w-12 h-12 rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center p-1 shrink-0">
                    <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400"; }} />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                {isTr ? "Favicon URL (Tarayıcı Sekme İkonu)" : "Favicon URL"}
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  value={faviconUrl}
                  onChange={(e) => setFaviconUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                />
                {faviconUrl && (
                  <div className="w-12 h-12 rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center p-1 shrink-0">
                    <img src={faviconUrl} alt="Favicon" className="max-h-full max-w-full object-contain" />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                {isTr ? "Web Sokağı / Slogan" : "Trust Slogan"}
              </label>
              <input
                type="text"
                value={trustSlogan}
                onChange={(e) => setTrustSlogan(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                {isTr ? "Ana Hero Başlığı" : "Main Hero Title"}
              </label>
              <input
                type="text"
                value={storeTitle}
                onChange={(e) => setStoreTitle(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Domain & Published Info */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
                  {isTr ? "Web Yayın Adresi & Durum" : "Web Publish Address & Status"}
                </h3>
                <p className="text-xs text-slate-500 font-medium">{isTr ? "Mağazanızın web görünürlük linki" : "Store web visibility link"}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  {isTr ? "Mağaza URL Kodu (Slug)" : "Store Slug"}
                </label>
                <div className="flex items-center gap-2 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600">
                  <span className="text-slate-400">lookprice.net/s/</span>
                  <input
                    type="text"
                    value={storeSlug}
                    onChange={(e) => setStoreSlug(e.target.value)}
                    className="bg-transparent font-black text-slate-900 outline-none flex-1"
                  />
                </div>
              </div>

              <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs font-medium text-amber-900">
                  {isTr
                    ? "Yaptığınız tüm logo, favicon, slogan ve footer değişiklikleri anında Restatelp web sitenizde ve harita görünümünde güncellenir."
                    : "All logo, favicon, slogan, and footer changes update instantly on your Restatelp website and map view."}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <a
              href={`/s/${storeSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center gap-2 shadow-lg"
            >
              <Globe className="w-4 h-4 text-emerald-400" /> {isTr ? "Canlı Web Sitesini Görüntüle" : "View Live Website"}
            </a>
          </div>
        </div>
      </div>

      {/* Footer Links & Content Editor Section */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
                {isTr ? "Footer Bağlantıları & Zengin İçerik Yönetimi" : "Footer Links & Rich Content Management"}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {isTr ? "Web sitesi alt footer alanındaki Hızlı ve Kurumsal bağlantıların içeriklerini düzenleyin" : "Manage Quick and Corporate links in the website footer"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Quick Links */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span> {isTr ? "Hızlı Bağlantılar (Quick Links)" : "Quick Links"}
              </h4>
              <button
                onClick={() => addLink("quick")}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> {isTr ? "Ekle" : "Add"}
              </button>
            </div>

            <div className="space-y-3">
              {quickLinks.map((lnk, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-4 group hover:border-indigo-300 transition-all">
                  <div className="space-y-1 flex-1 min-w-0">
                    <input
                      type="text"
                      value={lnk.label}
                      onChange={(e) => {
                        const c = [...quickLinks];
                        c[idx].label = e.target.value;
                        setQuickLinks(c);
                      }}
                      className="w-full bg-transparent font-black text-slate-900 text-xs uppercase outline-none"
                    />
                    <div className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-200 rounded text-slate-600 uppercase">{lnk.type || "url"}</span>
                      <span className="truncate">{lnk.type === 'content' ? (isTr ? "Zengin Sayfa İçerikli" : "Rich Content Page") : lnk.url}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openEditor("quick", idx)}
                      className="p-2 bg-white hover:bg-indigo-600 hover:text-white text-slate-700 rounded-xl border border-slate-200 transition-all shadow-xs"
                      title={isTr ? "İçerik Editörü" : "Content Editor"}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeLink("quick", idx)}
                      className="p-2 bg-white hover:bg-rose-600 hover:text-white text-rose-600 rounded-xl border border-slate-200 transition-all shadow-xs"
                      title={isTr ? "Sil" : "Delete"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Corporate Links */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span> {isTr ? "Kurumsal & Yasal Bağlantılar" : "Corporate & Legal Links"}
              </h4>
              <button
                onClick={() => addLink("corporate")}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> {isTr ? "Ekle" : "Add"}
              </button>
            </div>

            <div className="space-y-3">
              {corporateLinks.map((lnk, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-4 group hover:border-emerald-300 transition-all">
                  <div className="space-y-1 flex-1 min-w-0">
                    <input
                      type="text"
                      value={lnk.label}
                      onChange={(e) => {
                        const c = [...corporateLinks];
                        c[idx].label = e.target.value;
                        setCorporateLinks(c);
                      }}
                      className="w-full bg-transparent font-black text-slate-900 text-xs uppercase outline-none"
                    />
                    <div className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-200 rounded text-slate-600 uppercase">{lnk.type || "url"}</span>
                      <span className="truncate">{lnk.type === 'content' ? (isTr ? "Zengin Sayfa İçerikli" : "Rich Content Page") : lnk.url}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openEditor("corporate", idx)}
                      className="p-2 bg-white hover:bg-emerald-600 hover:text-white text-slate-700 rounded-xl border border-slate-200 transition-all shadow-xs"
                      title={isTr ? "İçerik Editörü" : "Content Editor"}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeLink("corporate", idx)}
                      className="p-2 bg-white hover:bg-rose-600 hover:text-white text-rose-600 rounded-xl border border-slate-200 transition-all shadow-xs"
                      title={isTr ? "Sil" : "Delete"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Editor Modal for Link Content */}
      {editorModalOpen && editingLinkInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                  {isTr ? "Footer Bağlantı & Sayfa İçerik Editörü" : "Footer Link & Page Content Editor"}
                </h3>
              </div>
              <button onClick={() => setEditorModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="p-8 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isTr ? "Link Başlığı" : "Link Label"}</label>
                  <input
                    type="text"
                    value={(editingLinkInfo.list === "quick" ? quickLinks : corporateLinks)[editingLinkInfo.index].label}
                    onChange={(e) => {
                      const setter = editingLinkInfo.list === "quick" ? setQuickLinks : setCorporateLinks;
                      setter((prev) => {
                        const c = [...prev];
                        c[editingLinkInfo.index].label = e.target.value;
                        return c;
                      });
                    }}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isTr ? "Bağlantı / İçerik Türü" : "Type"}</label>
                  <select
                    value={(editingLinkInfo.list === "quick" ? quickLinks : corporateLinks)[editingLinkInfo.index].type || "url"}
                    onChange={(e) => {
                      const setter = editingLinkInfo.list === "quick" ? setQuickLinks : setCorporateLinks;
                      setter((prev) => {
                        const c = [...prev];
                        c[editingLinkInfo.index].type = e.target.value as any;
                        return c;
                      });
                    }}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="url">{isTr ? "Harici URL Bağlantısı" : "External URL Link"}</option>
                    <option value="content">{isTr ? "Zengin Sayfa İçeriği (Popup Modal)" : "Rich Page Content (Modal)"}</option>
                  </select>
                </div>
              </div>

              {(editingLinkInfo.list === "quick" ? quickLinks : corporateLinks)[editingLinkInfo.index].type === "url" ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">URL</label>
                  <input
                    type="text"
                    value={(editingLinkInfo.list === "quick" ? quickLinks : corporateLinks)[editingLinkInfo.index].url}
                    onChange={(e) => {
                      const setter = editingLinkInfo.list === "quick" ? setQuickLinks : setCorporateLinks;
                      setter((prev) => {
                        const c = [...prev];
                        c[editingLinkInfo.index].url = e.target.value;
                        return c;
                      });
                    }}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    placeholder="https://..."
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {isTr ? "Sayfa Detay İçeriği (Zengin Metin Editörü)" : "Page Content (Rich Text Editor)"}
                  </label>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <LiteRichEditor
                      value={(editingLinkInfo.list === "quick" ? quickLinks : corporateLinks)[editingLinkInfo.index].content || ""}
                      onChange={(val) => {
                        const setter = editingLinkInfo.list === "quick" ? setQuickLinks : setCorporateLinks;
                        setter((prev) => {
                          const c = [...prev];
                          c[editingLinkInfo.index].content = val;
                          return c;
                        });
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setEditorModalOpen(false)}
                className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl transition-all uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> {isTr ? "TAMAMLANDI" : "DONE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
