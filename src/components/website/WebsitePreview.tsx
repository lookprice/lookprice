import React from "react";
import { 
  ArrowRight, 
  MapPin, 
  Search, 
  Facebook, 
  Instagram, 
  Twitter, 
  MessageCircle, 
  Settings, 
  Users, 
  Layout, 
  Newspaper 
} from "lucide-react";
import { WebContent, TeamMember, SectionConfig, FooterLink } from "../../types/websiteGenerator";

interface WebsitePreviewProps {
  lang: string;
  originalBranding: any;
  logoUrl: string;
  content: WebContent;
  sections: SectionConfig[];
  gridLayout: string;
  featuredCount: number;
  blogs: any[];
  radarNews: any[];
  team: TeamMember[];
  quickLinks: FooterLink[];
  corporateLinks: FooterLink[];
  openEditor: (list: "quick" | "corporate", index: number) => void;
  removeLink: (list: "quick" | "corporate", index: number) => void;
  addLink: (list: "quick" | "corporate") => void;
}

export const WebsitePreview: React.FC<WebsitePreviewProps> = ({
  lang,
  originalBranding,
  logoUrl,
  content,
  sections,
  gridLayout,
  featuredCount,
  blogs,
  radarNews,
  team,
  quickLinks,
  corporateLinks,
  openEditor,
  removeLink,
  addLink,
}) => {
  const isTr = lang === "tr";
  const isEnabled = (id: string) => sections.find((s) => s.id === id)?.enabled;

  return (
    <div className="bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl sticky top-6">
      {/* Browser Bar */}
      <div className="bg-slate-900 px-4 py-3 flex items-center gap-2 border-b border-slate-800">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-slate-700"></div>
          <div className="h-2.5 w-2.5 rounded-full bg-slate-700"></div>
          <div className="h-2.5 w-2.5 rounded-full bg-slate-700"></div>
        </div>
        <div className="flex-1 bg-slate-800/50 rounded-lg h-6 mx-4"></div>
      </div>

      <div className="h-[750px] overflow-y-auto custom-scrollbar bg-white">
        {/* Navigation */}
        <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-4 flex items-center justify-between">
          <div className="h-8 w-24 bg-slate-50 border border-slate-100 rounded flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} className="h-full w-full object-contain p-1" alt="Preview Logo" />
            ) : (
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">
                {originalBranding?.store_name || "LOGO"}
              </span>
            )}
          </div>
          <div className="flex gap-6">
            {["ANAYASAYFA", "PORTFÖY", "BİZ KİMİZ", "İLETİŞİM"].map((item) => (
              <span key={item} className="text-[9px] font-black text-slate-900 tracking-widest opacity-60">
                {item}
              </span>
            ))}
          </div>
        </nav>

        {/* Hero Section */}
        {isEnabled("hero") && (
          <div className="relative h-[450px] bg-slate-900 overflow-hidden flex items-center justify-center text-center p-8">
            <img src={content.hero.bgImage} className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105" alt="Hero Background" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
            <div className="relative z-10 max-w-2xl space-y-4">
              <span className="inline-block px-4 py-1.5 bg-indigo-600 text-white text-[9px] font-black tracking-[0.3em] rounded-full uppercase">
                {content.trustSlogan}
              </span>
              <h1 className="text-4xl font-black text-white leading-[1.1] tracking-tight">
                {content.hero.title}
              </h1>
              <p className="text-sm text-slate-200 font-medium leading-relaxed opacity-80">
                {content.hero.subtitle}
              </p>
              <div className="pt-4 flex items-center justify-center gap-3">
                <button className="px-6 py-3 bg-white text-slate-950 text-[10px] font-black rounded-xl uppercase tracking-widest flex items-center gap-2">
                  {isTr ? "PORTFÖYÜ İNCELE" : "EXPLORE NOW"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Section */}
        {isEnabled("search") && (
          <div className="bg-white px-8 -mt-12 relative z-20">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 grid grid-cols-4 gap-6">
              {[
                { label: isTr ? "İŞLEM TİPİ" : "TYPE", value: isTr ? "Satılık" : "For Sale" },
                { label: isTr ? "MÜLK TİPİ" : "CATEGORY", value: isTr ? "Lüks Villa" : "Luxury Villa" },
                { label: isTr ? "BÖLGE" : "LOCATION", value: "Girne, Kıbrıs" },
              ].map((filter) => (
                <div key={filter.label} className="space-y-1.5 border-r border-slate-100 pr-6">
                  <p className="text-[9px] font-black text-slate-400 tracking-widest">{filter.label}</p>
                  <p className="text-xs font-black text-slate-900">{filter.value}</p>
                </div>
              ))}
              <div className="flex items-center">
                <button className="w-full h-full bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  <Search className="h-4 w-4" />
                  {isTr ? "ARAMA YAP" : "SEARCH"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Section */}
        {isEnabled("stats") && (
          <div className="px-8 py-16 grid grid-cols-4 gap-8">
            {content.stats.map((stat, idx) => (
              <div key={idx} className="text-center space-y-1">
                <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h4>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* News Section */}
        {isEnabled("news") && radarNews.length > 0 && (
          <div className="px-8 py-16 bg-slate-50">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-indigo-600" />
                  {isTr ? "BÖLGESEL HABERLER" : "REGIONAL RADAR"}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {isTr ? "Kuzey Kıbrıs'tan Sıcak Gelişmeler" : "Latest Updates from North Cyprus"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {radarNews.map((news, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 flex gap-4 hover:border-indigo-200 transition-all cursor-pointer group">
                  <div className="h-20 w-20 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={news.image || "https://images.unsplash.com/photo-1524178232363-1fb28f74b083?auto=format&fit=crop&w=400&q=80"} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" alt="News" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-1">{news.category || "GÜNCEL"}</span>
                    <h4 className="text-[11px] font-bold text-slate-900 leading-tight line-clamp-2">{news.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blog Section */}
        {isEnabled("blog") && blogs.length > 0 && (
          <div className="px-8 py-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {isTr ? "GÜNCEL BLOG" : "JOURNAL"}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {isTr ? "SEKTÖREL REHBERLER" : "INSIGHTS & GUIDES"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <div key={blog.id} className="space-y-4 group cursor-pointer">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 relative">
                    <img src={blog.image_url || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Blog" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[8px] font-black text-indigo-500 uppercase tracking-[0.2em]">{isTr ? "REHBER" : "GUIDE"}</p>
                    <h4 className="text-xs font-black text-slate-900 leading-snug">{blog.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Section */}
        {isEnabled("team") && (
          <div className="px-8 py-20 bg-slate-50">
            <div className="text-center mb-12">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{isTr ? "DANIŞMANLARIMIZ" : "OUR ADVISORS"}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{isTr ? "SİZİN İÇİN BURADAYIZ" : "PROFESSIONAL EXCELLENCE"}</p>
            </div>
            <div className="grid grid-cols-3 gap-8">
              {team.map((member) => (
                <div key={member.id} className="text-center space-y-4">
                  <div className="h-40 w-40 rounded-full mx-auto overflow-hidden border-4 border-white shadow-xl">
                    <img src={member.image} className="h-full w-full object-cover" alt={member.name} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{member.name}</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="bg-slate-950 px-10 py-20 text-white">
          <div className="grid grid-cols-12 gap-12">
            <div className="col-span-4 space-y-6">
              <div className="h-10 w-32 bg-white/5 border border-white/10 rounded flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} className="h-full w-full object-contain p-1 invert opacity-80" alt="Footer Logo" />
                ) : (
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-tighter">
                    {originalBranding?.store_name || "LOGO"}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-medium text-slate-400 leading-relaxed uppercase tracking-wide">
                {isTr 
                  ? "Kuzey Kıbrıs'ın en köklü ve güvenilir emlak çözüm ortağı. Profesyonel kadromuzla yanınızdayız." 
                  : "North Cyprus' most established and reliable real estate partner. Always here for you."}
              </p>
              <div className="flex gap-4">
                <Instagram className="h-4 w-4 text-slate-600 hover:text-white transition-colors cursor-pointer" />
                <Facebook className="h-4 w-4 text-slate-600 hover:text-white transition-colors cursor-pointer" />
                <Twitter className="h-4 w-4 text-slate-600 hover:text-white transition-colors cursor-pointer" />
              </div>
            </div>

            <div className="col-span-3 space-y-6">
              <h5 className="text-[10px] font-black text-white uppercase tracking-[0.3em] opacity-40">{isTr ? "HIZLI ERİŞİM" : "LINKS"}</h5>
              <div className="space-y-4">
                {quickLinks.map((link, idx) => (
                  <div key={idx} className="group relative flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 hover:text-white transition-colors cursor-pointer uppercase tracking-widest">{link.label}</span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditor("quick", idx)} className="p-1 text-indigo-400 hover:text-indigo-300"><Settings className="h-3 w-3" /></button>
                      <button onClick={() => removeLink("quick", idx)} className="p-1 text-rose-400 hover:text-rose-300">×</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => addLink("quick")} className="text-[9px] font-black text-indigo-500 hover:text-indigo-400 uppercase tracking-widest flex items-center gap-2 mt-4">+ {isTr ? "EKLE" : "ADD"}</button>
              </div>
            </div>

            <div className="col-span-3 space-y-6">
              <h5 className="text-[10px] font-black text-white uppercase tracking-[0.3em] opacity-40">{isTr ? "KURUMSAL" : "CORPORATE"}</h5>
              <div className="space-y-4">
                {corporateLinks.map((link, idx) => (
                  <div key={idx} className="group relative flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 hover:text-white transition-colors cursor-pointer uppercase tracking-widest">{link.label}</span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditor("corporate", idx)} className="p-1 text-indigo-400 hover:text-indigo-300"><Settings className="h-3 w-3" /></button>
                      <button onClick={() => removeLink("corporate", idx)} className="p-1 text-rose-400 hover:text-rose-300">×</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => addLink("corporate")} className="text-[9px] font-black text-indigo-500 hover:text-indigo-400 uppercase tracking-widest flex items-center gap-2 mt-4">+ {isTr ? "EKLE" : "ADD"}</button>
              </div>
            </div>

            <div className="col-span-2 space-y-6">
              <h5 className="text-[10px] font-black text-white uppercase tracking-[0.3em] opacity-40">{isTr ? "DESTEK" : "SUPPORT"}</h5>
              <div className="space-y-4">
                <div className="flex items-center gap-2 group cursor-pointer">
                  <div className="h-8 w-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">WhatsApp</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-20 pt-10 border-t border-white/5 flex items-center justify-between">
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">© 2024 {originalBranding?.store_name || "SEÇKİN EMLAK"} - POWERED BY LOOKPRICE</p>
            <div className="flex gap-4">
              <div className="h-6 w-10 bg-white/5 rounded border border-white/10"></div>
              <div className="h-6 w-10 bg-white/5 rounded border border-white/10"></div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
