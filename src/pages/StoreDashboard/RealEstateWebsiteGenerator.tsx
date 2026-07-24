import React, { useState, useEffect, useRef, useMemo } from "react";
import { LiteRichEditor } from "../../components/LiteRichEditor";
import {
  Layout,
  Palette,
  Eye,
  Globe,
  Map,
  Search,
  BarChart3,
  Image as ImageIcon,
  Check,
  Users,
  Newspaper,
  X,
  Save,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { api } from "../../services/api";

// Modular Components
import { WebsiteHeader } from "../../components/website/WebsiteHeader";
import { BrandIdentityStep } from "../../components/website/BrandIdentityStep";
import { ContentCurationStep } from "../../components/website/ContentCurationStep";
import { InfrastructureStep } from "../../components/website/InfrastructureStep";
import { LaunchStep } from "../../components/website/LaunchStep";
import { WebsitePreview } from "../../components/website/WebsitePreview";

// Types
import { SectionConfig, TeamMember, WebContent, FooterLink } from "../../types/websiteGenerator";

export const RealEstateWebsiteGenerator = ({
  storeId,
}: {
  storeId?: number;
}) => {
  const { lang } = useLanguage();
  const isTr = lang === 'tr';

  const [blogs, setBlogs] = useState<any[]>([]);
  const [radarNews, setRadarNews] = useState<any[]>([]);
  const [originalBranding, setOriginalBranding] = useState<any>({});
  const [banners, setBanners] = useState<any[]>([]);
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [activeStep, setActiveStep] = useState(1);
  const [storeSlug, setStoreSlug] = useState("abone");
  const [customDomain, setCustomDomain] = useState("");
  const [useCustomDomain, setUseCustomDomain] = useState(false);
  const [featuredCount, setFeaturedCount] = useState(6);
  const [gridLayout, setGridLayout] = useState("standard");
  
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
    { label: isTr ? "Gizlilik Politikası" : "Privacy Policy", url: "", type: "content", content: "..." },
    { label: isTr ? "Kullanım Koşulları" : "Terms of Use", url: "", type: "content", content: "..." },
    { label: isTr ? "KVKK Aydınlatma" : "KVKK Disclosure", url: "", type: "content", content: "..." },
  ]);

  const [sections, setSections] = useState<SectionConfig[]>([
    { id: "hero", label: isTr ? "Karşılama Ekranı" : "Hero Section", icon: ImageIcon, enabled: true },
    { id: "search", label: isTr ? "Akıllı Filtreler" : "Smart Filters", icon: Search, enabled: true },
    { id: "stats", label: isTr ? "Başarı Rakamları" : "Trust Stats", icon: BarChart3, enabled: true },
    { id: "portfolio", label: isTr ? "Portföy Izgarası" : "Portfolio Grid", icon: Layout, enabled: true },
    { id: "news", label: isTr ? "Bölgesel Haberler" : "Regional Radar", icon: Newspaper, enabled: true },
    { id: "blog", label: isTr ? "Blog Yazıları" : "Blog Posts", icon: Newspaper, enabled: true },
    { id: "financing", label: isTr ? "Kredi Hesaplama" : "Loan Calculator", icon: Newspaper, enabled: true },
    { id: "team", label: isTr ? "Yönetim & Kadro" : "Team & Staff", icon: Users, enabled: true },
    { id: "map", label: isTr ? "Harita Görünümü" : "Map View", icon: Map, enabled: true },
  ]);

  const [team, setTeam] = useState<TeamMember[]>([
    { id: "1", name: "Ahmet Yılmaz", role: "CEO / Broker", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400" },
    { id: "2", name: "Ayşe Kaya", role: "Satış Danışmanı", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400" },
  ]);

  const [content, setContent] = useState<WebContent>({
    hero: {
      title: isTr ? "Kuzey Kıbrıs'ın En Seçkin Portföyü" : "North Cyprus' Most Exclusive Portfolio",
      subtitle: isTr ? "Yatırım hayallerinizi gerçeğe dönüştüren profesyonel gayrimenkul çözümleri." : "Professional real estate solutions turning your investment dreams into reality.",
      bgImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000",
    },
    stats: [
      { value: "500+", label: isTr ? "Mutlu Müşteri" : "Happy Clients" },
      { value: "1.2B₺", label: isTr ? "Yönetilen Varlık" : "Assets Managed" },
      { value: "12", label: isTr ? "Yıl Tecrübe" : "Years Experience" },
      { value: "24", label: isTr ? "Aktif İlan" : "Active Listings" },
    ],
    trustSlogan: isTr ? "10 Yıldır Güvenle" : "Trusted for 10 Years",
  });

  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editingLinkInfo, setEditingLinkInfo] = useState<{ list: "quick" | "corporate"; index: number } | null>(null);

  const editorConfig = useMemo(() => ({ readonly: false, placeholder: "İçerik girmeye başlayın...", height: 400 }), []);

  useEffect(() => {
    if (storeId) {
      api.getBranding(storeId).then((res) => {
        if (res && !res.error) {
          setOriginalBranding(res);
          if (res.logo_url) setLogoUrl(res.logo_url);
          if (res.favicon_url) setFaviconUrl(res.favicon_url);
          if (res.page_layout_settings?.web_content) setContent(res.page_layout_settings.web_content);
          else if (res.slogan) setContent((prev) => ({ ...prev, trustSlogan: res.slogan }));

          if (res.page_layout) {
            let layout = res.page_layout;
            if (typeof layout === "string") { try { layout = JSON.parse(layout); } catch (e) {} }
            if (layout && typeof layout === "object" && !Array.isArray(layout)) {
              if (layout.sections) {
                setSections((prev) => prev.map((s) => {
                  const found = (layout.sections as any[]).find((ls) => ls.id === s.id);
                  return found ? { ...s, enabled: found.enabled } : s;
                }));
              }
              if (layout.grid) setGridLayout(layout.grid);
              if (layout.count) setFeaturedCount(layout.count);
              if (layout.quickLinks) setQuickLinks(layout.quickLinks);
              if (layout.corporateLinks) setCorporateLinks(layout.corporateLinks);
            } else if (Array.isArray(layout)) {
              setSections((prev) => prev.map((s) => {
                const found = (layout as any[]).find((ls) => ls.id === s.id);
                return found ? { ...s, enabled: found.enabled } : s;
              }));
            }
          }

          const dbBanners = res.banners || (res.page_layout && typeof res.page_layout === "object" && !Array.isArray(res.page_layout) ? res.page_layout.banners : null);
          if (dbBanners && Array.isArray(dbBanners)) {
            const normalized = dbBanners.map((b: any, idx: number) => {
              if (typeof b === 'string') {
                return {
                  id: `slide_legacy_${idx}`,
                  image_url: b,
                  title: "",
                  subtitle: "",
                  text_position: "center",
                  show_store_name: true,
                  button_text: isTr ? "İncele" : "Explore",
                  button_link: "#portfolio"
                };
              }
              return b;
            });
            setBanners(normalized);
            if (normalized.length > 0) {
              setContent((prev) => ({ ...prev, hero: { ...prev.hero, bgImage: normalized[0].image_url } }));
            }
          }
          if (res.slug) {
            setStoreSlug(res.slug);
            api.getPublicRadarNews(res.slug).then((newsRes) => { if (Array.isArray(newsRes)) setRadarNews(newsRes); }).catch(console.error);
          }
          if (res.custom_domain) { setCustomDomain(res.custom_domain); setUseCustomDomain(true); }
          if (res.hero_image_url && (!banners || banners.length === 0)) setContent((prev) => ({ ...prev, hero: { ...prev.hero, bgImage: res.hero_image_url } }));
          
          const savedTeam = res.page_layout_settings?.team || res.team || (res.page_layout && typeof res.page_layout === 'object' && !Array.isArray(res.page_layout) ? res.page_layout.team : null);
          if (savedTeam && Array.isArray(savedTeam) && savedTeam.length > 0) {
            setTeam(savedTeam.map((m: any, idx: number) => {
              const img = m.image || m.image_url || "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400";
              return {
                id: m.id?.toString() || `member_${idx}`,
                name: m.name || "Danışman",
                role: m.role || "Broker / Danışman",
                image: img,
                image_url: img
              };
            }));
          }

          const isAuto = res.store_type === 'motor_vehicle' || res.page_layout_settings?.sector === 'automotive';
          if (isAuto) {
            setContent((prev) => ({
              ...prev,
              hero: {
                title: isTr ? "Kuzey Kıbrıs'ın En Seçkin Araç Portföyü" : "North Cyprus' Most Exclusive Car Portfolio",
                subtitle: isTr ? "Seçkin otomobiller ve prestijli taşıt portföyleriyle güvendesiniz." : "Delightful range of select luxury and condition-focused vehicles.",
                bgImage: prev.hero.bgImage.includes("photo-1600585154340-be6161a56a0c") ? "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=2000&q=80" : prev.hero.bgImage
              },
              stats: prev.stats.map((st, idx) => (idx === 1 ? { value: "1.2B₺", label: isTr ? "İşlem Hacmi" : "Transaction Volume" } : st))
            }));
          }
        }
      }).catch(console.error);

      api.getBlogPosts(storeId).then((res) => { if (Array.isArray(res)) setBlogs(res.filter((b) => b.is_published).slice(0, 3)); }).catch(console.error);
      api.getConsultants(storeId).then((cRes) => {
        if (Array.isArray(cRes) && cRes.length > 0) {
          setTeam((prev) => {
            if (prev && prev.length > 0) {
              return prev.map((pt, idx) => {
                const match = cRes.find((c) => c.id?.toString() === pt.id?.toString() || (c.name && pt.name && c.name.toLowerCase() === pt.name.toLowerCase()));
                const img = pt.image || pt.image_url || match?.image_url || "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400";
                return {
                  id: pt.id || match?.id?.toString() || `member_${idx}`,
                  name: pt.name || match?.name || "Danışman",
                  role: pt.role || match?.role || "Danışman",
                  image: img,
                  image_url: img
                };
              });
            }
            return cRes.map((c, idx) => ({
              id: c.id?.toString() || `c_${idx}`,
              name: c.name,
              role: c.role || "Danışman",
              image: c.image_url || "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400",
              image_url: c.image_url || "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400"
            }));
          });
        }
      }).catch(console.error);
    }
  }, [storeId]);

  const handleSave = async () => {
    if (!storeId) return;
    try {
      const normalizedBanners = (banners || []).map((b: any, idx: number) => {
        if (typeof b === 'string') {
          return {
            id: `slide_${idx}`,
            image_url: b,
            title: content.hero.title,
            subtitle: content.hero.subtitle,
            text_position: "center",
            show_store_name: true,
            button_text: isTr ? "İncele" : "Explore",
            button_link: "#portfolio"
          };
        }
        return {
          ...b,
          image_url: b.image_url || b.url || ""
        };
      });

      const updatedLayout = { 
        sections: sections.map((s) => ({ id: s.id, enabled: s.enabled })), 
        grid: gridLayout, 
        count: featuredCount, 
        banners: normalizedBanners, 
        team: team,
        quickLinks, 
        corporateLinks 
      };

      const firstBannerUrl = normalizedBanners.length > 0 ? normalizedBanners[0].image_url : originalBranding.hero_image_url;
      const payload = { 
        ...originalBranding, 
        logo_url: logoUrl, 
        favicon_url: faviconUrl, 
        page_layout: updatedLayout, 
        page_layout_settings: { ...originalBranding.page_layout_settings, web_content: content, team: team }, 
        team: team,
        slogan: content.trustSlogan, 
        slug: storeSlug, 
        custom_domain: useCustomDomain ? customDomain : null, 
        hero_image_url: firstBannerUrl,
        banners: normalizedBanners
      };
      await api.updateBranding(payload, storeId);
      alert(isTr ? "Ayarlar başarıyla kaydedildi!" : "Settings saved successfully!");
    } catch (error) { console.error(error); alert(isTr ? "Kaydedilirken bir hata oluştu." : "An error occurred while saving."); }
  };

  const openEditor = (list: "quick" | "corporate", index: number) => { setEditingLinkInfo({ list, index }); setEditorModalOpen(true); };
  const removeLink = (list: "quick" | "corporate", index: number) => { const setter = list === "quick" ? setQuickLinks : setCorporateLinks; setter((prev: any) => prev.filter((_: any, i: any) => i !== index)); };
  const addLink = (list: "quick" | "corporate") => { const setter = list === "quick" ? setQuickLinks : setCorporateLinks; setter((prev: any) => [...prev, { label: "Yeni Link", url: "#", type: "url" }]); };

  const currentUrl = useCustomDomain && customDomain ? customDomain : `lookprice.net/s/${storeSlug}`;
  const phases = [
    { id: 1, title: isTr ? "Kimlik & Marka" : "Identity & Brand", icon: Palette },
    { id: 2, title: isTr ? "İçerik & Seçki" : "Content & Curation", icon: Layout },
    { id: 3, title: isTr ? "Altyapı & SEO" : "Infrastructure & SEO", icon: Globe },
    { id: 4, title: isTr ? "Yayınla" : "Launch", icon: Check },
  ];

  return (
    <div className="space-y-6">
      <WebsiteHeader 
        storeName={originalBranding?.store_name || originalBranding?.name || (isTr ? "SEÇKİN EMLAK" : "EXCLUSIVE PROPERTY")}
        lang={lang} activeStep={activeStep} setActiveStep={setActiveStep} phases={phases} handleSave={handleSave}
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 space-y-6">
          {activeStep === 1 && <BrandIdentityStep lang={lang} selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate} content={content} setContent={setContent} logoUrl={logoUrl} setLogoUrl={setLogoUrl} faviconUrl={faviconUrl} setFaviconUrl={setFaviconUrl} team={team} setTeam={setTeam} />}
          {activeStep === 2 && <ContentCurationStep lang={lang} banners={banners} setBanners={setBanners} sections={sections} setSections={setSections} gridLayout={gridLayout} setGridLayout={setGridLayout} featuredCount={featuredCount} setFeaturedCount={setFeaturedCount} setContent={setContent} />}
          {activeStep === 3 && <InfrastructureStep lang={lang} useCustomDomain={useCustomDomain} setUseCustomDomain={setUseCustomDomain} customDomain={customDomain} setCustomDomain={setCustomDomain} storeSlug={storeSlug} />}
          {activeStep === 4 && <LaunchStep lang={lang} currentUrl={currentUrl} />}
        </div>

        <div className="xl:col-span-8">
          <WebsitePreview 
            lang={lang} originalBranding={originalBranding} logoUrl={logoUrl} content={content} 
            sections={sections} gridLayout={gridLayout} featuredCount={featuredCount} blogs={blogs} 
            radarNews={radarNews} team={team} quickLinks={quickLinks} corporateLinks={corporateLinks}
            openEditor={openEditor} removeLink={removeLink} addLink={addLink} banners={banners}
          />
        </div>
      </div>

      {editorModalOpen && editingLinkInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{isTr ? "LİNK & İÇERİK EDİTÖRÜ" : "LINK & CONTENT EDITOR"}</h3>
              <button onClick={() => setEditorModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors"><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <div className="p-8 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isTr ? "Link Başlığı" : "Link Label"}</label>
                  <input type="text" value={(editingLinkInfo.list === "quick" ? quickLinks : corporateLinks)[editingLinkInfo.index].label} onChange={(e) => { const setter = editingLinkInfo.list === "quick" ? setQuickLinks : setCorporateLinks; setter((prev: any) => { const c = [...prev]; c[editingLinkInfo.index].label = e.target.value; return c; }); }} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-100" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isTr ? "Türü" : "Type"}</label>
                  <select value={(editingLinkInfo.list === "quick" ? quickLinks : corporateLinks)[editingLinkInfo.index].type || "url"} onChange={(e) => { const setter = editingLinkInfo.list === "quick" ? setQuickLinks : setCorporateLinks; setter((prev: any) => { const c = [...prev]; c[editingLinkInfo.index].type = e.target.value as any; return c; }); }} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none">
                    <option value="url">{isTr ? "Harici URL" : "External URL"}</option>
                    <option value="content">{isTr ? "Özel Sayfa İçeriği" : "Custom Page Content"}</option>
                  </select>
                </div>
              </div>
              {(editingLinkInfo.list === "quick" ? quickLinks : corporateLinks)[editingLinkInfo.index].type === "url" ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">URL</label>
                  <input type="text" value={(editingLinkInfo.list === "quick" ? quickLinks : corporateLinks)[editingLinkInfo.index].url} onChange={(e) => { const setter = editingLinkInfo.list === "quick" ? setQuickLinks : setCorporateLinks; setter((prev: any) => { const c = [...prev]; c[editingLinkInfo.index].url = e.target.value; return c; }); }} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none" placeholder="https://..." />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isTr ? "Sayfa İçeriği (HTML)" : "Page Content (HTML)"}</label>
                  <LiteRichEditor value={(editingLinkInfo.list === "quick" ? quickLinks : corporateLinks)[editingLinkInfo.index].content || ""} onChange={(val) => { const setter = editingLinkInfo.list === "quick" ? setQuickLinks : setCorporateLinks; setter((prev: any) => { const c = [...prev]; c[editingLinkInfo.index].content = val; return c; }); }} />
                </div>
              )}
            </div>
            <div className="p-6 border-t bg-slate-50 flex justify-end">
              <button onClick={() => setEditorModalOpen(false)} className="px-8 py-3 bg-indigo-600 text-white text-xs font-black rounded-2xl hover:bg-indigo-700 transition-all uppercase tracking-widest shadow-lg shadow-indigo-100">{isTr ? "TAMAMLANDI" : "DONE"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
