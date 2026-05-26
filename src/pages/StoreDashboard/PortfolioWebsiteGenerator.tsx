import React, { useState } from 'react';
import { Layout, Palette, Settings, Eye, Globe, Map, Search, SlidersHorizontal, ArrowRight, Check, Users, BarChart3, Image as ImageIcon, Plus } from 'lucide-react';
import { useLanguage } from "../../contexts/LanguageContext";

interface SectionConfig {
  id: string;
  label: string;
  icon: any;
  enabled: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
}

interface WebContent {
  hero: { title: string; subtitle: string; bgImage: string };
  stats: { value: string; label: string }[];
  trustSlogan: string;
}

export const PortfolioWebsiteGenerator = () => {
  const { lang } = useLanguage();
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [activeStep, setActiveStep] = useState(1);
  const [domain, setDomain] = useState('portfolio.101evler.com');
  const [featuredCount, setFeaturedCount] = useState(6);
  const [gridLayout, setGridLayout] = useState('standard');
  const [sections, setSections] = useState<SectionConfig[]>([
    { id: 'hero', label: lang === 'tr' ? 'Karşılama Ekranı' : 'Hero Section', icon: ImageIcon, enabled: true },
    { id: 'search', label: lang === 'tr' ? 'Akıllı Filtreler' : 'Smart Filters', icon: Search, enabled: true },
    { id: 'stats', label: lang === 'tr' ? 'Başarı Rakamları' : 'Trust Stats', icon: BarChart3, enabled: true },
    { id: 'portfolio', label: lang === 'tr' ? 'Portföy Izgarası' : 'Portfolio Grid', icon: Layout, enabled: true },
    { id: 'team', label: lang === 'tr' ? 'Yönetim & Kadro' : 'Team & Staff', icon: Users, enabled: true },
    { id: 'map', label: lang === 'tr' ? 'Harita Görünümü' : 'Map View', icon: Map, enabled: true },
  ]);

  const [team, setTeam] = useState<TeamMember[]>([
    { id: '1', name: 'Ahmet Yılmaz', role: 'CEO / Broker', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400' },
    { id: '2', name: 'Ayşe Kaya', role: 'Satış Danışmanı', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400' },
  ]);

  const [content, setContent] = useState<WebContent>({
    hero: { 
      title: lang === 'tr' ? "Kuzey Kıbrıs'ın En Seçkin Portföyü" : "North Cyprus' Most Exclusive Portfolio",
      subtitle: lang === 'tr' ? "Yatırım hayallerinizi gerçeğe dönüştüren profesyonel gayrimenkul çözümleri." : "Professional real estate solutions turning your investment dreams into reality.",
      bgImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000'
    },
    stats: [
      { value: '500+', label: lang === 'tr' ? 'Mutlu Müşteri' : 'Happy Clients' },
      { value: '1.2B₺', label: lang === 'tr' ? 'Yönetilen Varlık' : 'Assets Managed' },
      { value: '12', label: lang === 'tr' ? 'Yıl Tecrübe' : 'Years Experience' },
      { value: '24', label: lang === 'tr' ? 'Aktif İlan' : 'Active Listings' }
    ],
    trustSlogan: lang === 'tr' ? "10 Yıldır Güvenle" : "Trusted for 10 Years"
  });

  const phases = [
    { id: 1, title: lang === 'tr' ? 'Kimlik & Marka' : 'Identity & Brand', icon: Palette },
    { id: 2, title: lang === 'tr' ? 'İçerik & Seçki' : 'Content & Curation', icon: Layout },
    { id: 3, title: lang === 'tr' ? 'Altyapı & SEO' : 'Infrastructure & SEO', icon: Globe },
    { id: 4, title: lang === 'tr' ? 'Yayınla' : 'Launch', icon: Check },
  ];

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const removeMember = (id: string) => {
    setTeam(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Header with Roadmap Progress */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-1 uppercase">
              {lang === 'tr' ? 'MAESTRO PORTFÖY ENGINE' : 'MAESTRO PORTFOLIO ENGINE'}
            </h2>
            <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-[0.3em] leading-none">
              {lang === 'tr' ? 'GÜVEN ODAKLI ÇIKTI SİSTEMİ' : 'TRUST-DRIVEN OUTPUT SYSTEM'}
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right hidden md:block">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === 'tr' ? 'GÜNCEL DURUM' : 'CURRENT STATUS'}</p>
                <div className="flex items-center gap-2 justify-end">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{lang === 'tr' ? 'CLOUDFLARE BAĞLANTISI HAZIR' : 'CLOUDFLARE LINK READY'}</p>
                </div>
             </div>
             <button className="px-8 py-3 bg-slate-900 text-white text-xs font-black rounded-2xl hover:scale-105 transition-all shadow-xl shadow-slate-200 uppercase tracking-widest flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {lang === 'tr' ? 'GLOBAL YAYINA AL' : 'GO GLOBAL'}
             </button>
          </div>
        </div>

        {/* Roadmap Visualization */}
        <div className="grid grid-cols-4 gap-4 relative">
           <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
           {phases.map((phase) => (
             <button 
               key={phase.id}
               onClick={() => setActiveStep(phase.id)}
               className="relative z-10 flex flex-col items-center gap-3 group"
             >
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${
                  activeStep >= phase.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-100 text-slate-300'
                }`}>
                   <phase.icon className="h-5 w-5" />
                </div>
                <div className="text-center">
                   <p className={`text-[10px] font-black uppercase tracking-widest ${activeStep >= phase.id ? 'text-slate-900' : 'text-slate-300'}`}>
                     {phase.title}
                   </p>
                   <p className={`text-[8px] font-bold uppercase transition-opacity ${activeStep === phase.id ? 'opacity-100 text-indigo-500' : 'opacity-0'}`}>
                     {lang === 'tr' ? 'AKTİF FAZ' : 'ACTIVE PHASE'}
                   </p>
                </div>
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Step-Specific Controls */}
        <div className="xl:col-span-4 space-y-6">
          
          {activeStep === 1 && (
            <>
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-indigo-500" />
                  {lang === 'tr' ? 'MARKA KİMLİĞİ' : 'BRAND IDENTITY'}
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {['modern', 'classic', 'dark', 'minimal'].map(t => (
                      <button 
                        key={t}
                        onClick={() => setSelectedTemplate(t)}
                        className={`p-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                          selectedTemplate === t ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200' : 'bg-slate-50 text-slate-400 border-slate-100'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    value={content.trustSlogan}
                    onChange={(e) => setContent({...content, trustSlogan: e.target.value})}
                    placeholder={lang === 'tr' ? 'Güven Sloganı (Örn: "10 Yıldır Güvenle")' : 'Trust Slogan'} 
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-indigo-800 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                </div>
              </div>

               {/* Team Section */}
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-500" />
                  {lang === 'tr' ? 'YÖNETİM KADROSU (GÜVEN ÇIPASI)' : 'TRUST ANCHOR (TEAM)'}
                </h3>
                <div className="space-y-3">
                  {team.map((member) => (
                    <div key={member.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden border border-white shadow-sm">
                         <img src={member.image} className="h-full w-full object-cover" alt={member.name} />
                      </div>
                      <div className="flex-1">
                         <p className="text-[10px] font-black text-slate-900 uppercase">{member.name}</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{member.role}</p>
                      </div>
                      <button 
                        onClick={() => removeMember(member.id)}
                        className="text-[10px] font-black text-slate-300 hover:text-red-500 transition-colors uppercase tracking-widest"
                      >
                        {lang === 'tr' ? 'SİL' : 'DEL'}
                      </button>
                    </div>
                  ))}
                  <button className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-black text-slate-400 flex items-center justify-center gap-2 hover:border-indigo-300 hover:text-indigo-500 transition-all uppercase tracking-widest">
                    <Plus className="h-3 w-3" />
                    {lang === 'tr' ? 'YÖNETİCİ EKLE' : 'ADD LEADER'}
                  </button>
                </div>
              </div>
            </>
          )}

          {activeStep === 2 && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Layout className="h-4 w-4 text-indigo-500" />
                    {lang === 'tr' ? 'IZGARA VE BÖLÜMLER' : 'GRID & SECTIONS'}
                  </h3>
                  <div className="space-y-2">
                    {sections.map(section => (
                      <button 
                        key={section.id}
                        onClick={() => toggleSection(section.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                          section.enabled ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <section.icon className={`h-4 w-4 ${section.enabled ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <span className={`text-[11px] font-bold ${section.enabled ? 'text-indigo-900' : 'text-slate-600'}`}>
                            {section.label}
                          </span>
                        </div>
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center border ${
                          section.enabled ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-slate-200'
                        }`}>
                          {section.enabled && <Check className="h-3 w-3" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-indigo-500" />
                    {lang === 'tr' ? 'IZGARA AYARLARI' : 'GRID SETTINGS'}
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === 'tr' ? 'Görünüm Modu' : 'Layout Mode'}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {['standard', 'masonry'].map(l => (
                          <button 
                            key={l}
                            onClick={() => setGridLayout(l)}
                            className={`py-2 px-3 rounded-xl border text-[10px] font-black uppercase transition-all ${
                              gridLayout === l ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-400'
                            }`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === 'tr' ? 'İlan Sayısı' : 'Listing Count'}: {featuredCount}</p>
                      <input 
                        type="range" min="3" max="12" step="3" 
                        value={featuredCount}
                        onChange={(e) => setFeaturedCount(parseInt(e.target.value))}
                        className="w-full accent-indigo-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-6">
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                   <Globe className="h-4 w-4 text-indigo-500" />
                   {lang === 'tr' ? 'DOMAIN VE CLOUDFLARE' : 'DOMAIN & CLOUDFLARE'}
                 </h3>
                 <div className="space-y-4">
                   <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1 tracking-widest">Master Domain</p>
                      <input 
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        className="bg-transparent text-xs font-black text-indigo-900 outline-none w-full"
                      />
                   </div>
                   <div className="space-y-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{lang === 'tr' ? 'DNS DURUMU' : 'DNS STATUS'}</p>
                      <div className="p-3 bg-slate-900 rounded-xl font-mono text-[9px] text-emerald-400 space-y-1">
                         <p>CNAME {domain} → nodes.101evler.com</p>
                         <p>Status: CLOUDFLARE_PROXY_ACTIVE</p>
                      </div>
                   </div>
                   <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <span className="text-[9px] font-black text-emerald-600 uppercase">SSL / TLS</span>
                      <span className="text-[9px] font-black text-emerald-600 uppercase">ENCRYPTED</span>
                   </div>
                 </div>
               </div>

               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                   <Search className="h-4 w-4 text-indigo-500" />
                   {lang === 'tr' ? 'SEO VE GOOGLE ÖNİZLEME' : 'SEO & GOOGLE PREVIEW'}
                 </h3>
                 <div className="space-y-4">
                   <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-blue-700 text-sm font-medium leading-tight mb-1 truncate">{content.hero.title} | {content.trustSlogan}</p>
                      <p className="text-emerald-700 text-[10px] mb-1">https://{domain}</p>
                      <p className="text-slate-500 text-[10px] line-clamp-2">Kuzey Kıbrıs emlak piyasasının en seçkin portföyü. Ahmet Yılmaz ve ekibiyle güvenli yatırım...</p>
                   </div>
                   <input placeholder="SEO Meta Title" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none" />
                 </div>
               </div>
            </div>
          )}

          {activeStep === 4 && (
            <div className="bg-white p-8 rounded-3xl border border-slate-900 bg-slate-900 text-white space-y-6">
               <div className="h-16 w-16 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/50">
                  <Check className="h-8 w-8 text-white" />
               </div>
               <div className="text-center space-y-2">
                  <h4 className="text-lg font-black uppercase tracking-tighter">HER ŞEY HAZIR!</h4>
                  <p className="text-[10px] font-medium text-slate-400 leading-relaxed">
                    Tüm fazlar tamamlandı. Sitenizi yayınladığınızda 101evler Master Portföy gücüyle domaine bağlanacaktır.
                  </p>
               </div>
               <button className="w-full py-4 bg-indigo-600 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all">
                 YAYINLA VE CANLIYA AL
               </button>
            </div>
          )}
        </div>

        {/* Right Content: The Visual Output (Live Preview) */}
        <div className="xl:col-span-8">
           <div className="bg-slate-900 rounded-[3rem] border-[16px] border-slate-800 shadow-2xl overflow-hidden min-h-[850px] flex flex-col sticky top-6">
              {/* Premium Browser UI */}
              <div className="bg-slate-800 p-5 flex items-center gap-4 border-b border-slate-700/50">
                 <div className="flex gap-2">
                   <div className="h-2.5 w-2.5 rounded-full bg-red-400"></div>
                   <div className="h-2.5 w-2.5 rounded-full bg-amber-400"></div>
                   <div className="h-2.5 w-2.5 rounded-full bg-emerald-400"></div>
                 </div>
                 <div className="bg-slate-900/60 flex-1 py-1.5 rounded-2xl flex items-center justify-center gap-2 group cursor-pointer border border-slate-700/50">
                    <Globe className="h-3 w-3 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                    <span className="text-[11px] font-bold text-slate-500 tracking-tight">{domain}</span>
                 </div>
              </div>

              {/* Master Website Live View */}
              <div className="flex-1 bg-white overflow-y-auto max-h-[750px] custom-scrollbar scroll-smooth">
                 {/* Hero Container */}
                 {sections.find(s => s.id === 'hero')?.enabled && (
                    <div className="h-[450px] relative flex flex-col items-center justify-center p-12 text-center">
                       <div 
                         className="absolute inset-0 transition-opacity duration-1000" 
                         style={{ backgroundImage: `url(${content.hero.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                       ></div>
                       <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-900/40 to-white"></div>
                       
                       <div className="relative z-10 space-y-6 max-w-2xl transform translate-y-4">
                          <div className="inline-flex items-center gap-2 bg-indigo-600/20 backdrop-blur-xl px-4 py-1.5 rounded-full border border-indigo-400/30">
                            <Check className="h-3 w-3 text-indigo-400" />
                            <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">{content.trustSlogan}</span>
                          </div>
                          <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-[0.9] drop-shadow-2xl">
                             {content.hero.title}
                          </h1>
                          <p className="text-white/80 text-sm font-bold max-w-lg mx-auto leading-relaxed italic">
                             "{content.hero.subtitle}"
                          </p>
                       </div>
                    </div>
                 )}

                 {/* Advanced Search Strip */}
                 {sections.find(s => s.id === 'search')?.enabled && (
                    <div className="px-12 -mt-12 relative z-30">
                       <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] grid grid-cols-4 gap-6">
                          {['LOCATION', 'TYPE', 'BUDGET', 'ROOMS'].map((filt, idx) => (
                             <div key={filt} className={`group cursor-pointer ${idx < 3 ? 'border-r border-slate-100' : ''}`}>
                                <p className="text-[9px] font-black text-slate-400 tracking-[0.2em] mb-1">{filt}</p>
                                <div className="flex items-center justify-between pr-4">
                                   <span className="text-xs font-black text-slate-900">{lang === 'tr' ? 'Seçiniz' : 'Select'}</span>
                                   <SlidersHorizontal className="h-3 w-3 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                </div>
                             </div>
                          ))}
                          <button className="col-span-4 bg-slate-900 text-white py-4 rounded-3xl text-[11px] font-black uppercase tracking-[0.4em] mt-2 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
                             {lang === 'tr' ? 'HAYALİNDEKİ MÜLKÜ BUL' : 'FIND YOUR DREAM'}
                          </button>
                       </div>
                    </div>
                 )}

                 <div className="p-16 space-y-32">
                    {/* Stats */}
                    {sections.find(s => s.id === 'stats')?.enabled && (
                      <div className="grid grid-cols-4 gap-12 border-y border-slate-50 py-12">
                         {content.stats.map((st, i) => (
                           <div key={i} className="text-center group">
                              <p className="text-4xl font-black text-slate-900 mb-1 group-hover:scale-110 transition-transform">{st.value}</p>
                              <div className="h-1 w-6 bg-indigo-500 mx-auto mb-3 rounded-full"></div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{st.label}</p>
                           </div>
                         ))}
                      </div>
                    )}

                    {/* Portfolio/Listing Grid Preview */}
                    {sections.find(s => s.id === 'portfolio')?.enabled && (
                      <div className="space-y-12">
                         <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-slate-50 pb-8 gap-4">
                            <div className="space-y-2">
                               <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                                 {lang === 'tr' ? 'GÜNCEL PORTFÖY' : 'LATEST LISTINGS'}
                               </h3>
                               <div className="flex items-center gap-4">
                                  <div className="h-1 w-12 bg-indigo-600 rounded-full"></div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                                     {lang === 'tr' ? '101evler Entegre Veri Akışı' : '101evler Integrated Data Feed'}
                                  </p>
                               </div>
                            </div>
                            <button className="px-8 py-3 bg-slate-900 text-white text-[11px] font-black rounded-2xl uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all flex items-center gap-3">
                               {lang === 'tr' ? 'TÜMÜNÜ İNCELE' : 'EXPLORE ALL'}
                               <ArrowRight className="h-4 w-4" />
                            </button>
                         </div>
                         
                         <div className={`grid gap-10 ${gridLayout === 'masonry' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2'}`}>
                            {Array.from({ length: featuredCount }).map((_, i) => (
                               <div key={i} className="group cursor-pointer">
                                  <div className={`bg-slate-50 rounded-[2.5rem] overflow-hidden relative shadow-2xl shadow-indigo-100/20 group-hover:shadow-indigo-200/40 transition-all duration-500 ${gridLayout === 'masonry' && i % 2 === 0 ? 'aspect-[3/4]' : 'aspect-video md:aspect-[16/11]'}`}>
                                     <div className={`h-full w-full bg-cover bg-center transition-transform duration-[2s] group-hover:scale-110 ${i % 2 === 0 ? 'bg-[url("https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000&auto=format&fit=crop")]' : 'bg-[url("https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1000&auto=format&fit=crop")]'}`}></div>
                                     <div className="absolute top-6 left-6 flex gap-2">
                                        <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl text-[9px] font-black text-slate-900 uppercase tracking-widest shadow-sm">
                                           {i % 2 === 0 ? (lang === 'tr' ? 'SATILIK' : 'FOR SALE') : (lang === 'tr' ? 'KİRALIK' : 'FOR RENT')}
                                        </div>
                                     </div>
                                     <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                        <button className="w-full py-3 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20">
                                           {lang === 'tr' ? 'DETAYLARI GÖR' : 'VIEW DETAILS'}
                                        </button>
                                     </div>
                                  </div>
                                  <div className="mt-6 space-y-2">
                                     <div className="flex justify-between items-start">
                                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                                          {i % 2 === 0 ? (lang === 'tr' ? 'Lüks Sahil Villası' : 'Beachfront Villa') : (lang === 'tr' ? 'Modern Loft' : 'Urban Loft')}
                                        </h4>
                                        <div className="text-right">
                                           <p className="text-lg font-black text-indigo-600">€{250 + (i * 35)},000</p>
                                           <p className="text-[10px] font-bold text-slate-400 line-through">€{280 + (i * 35)},000</p>
                                        </div>
                                     </div>
                                     <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-100">
                                        <span className="flex items-center gap-1.5"><Map className="h-3 w-3 text-indigo-500" /> GIRNE</span>
                                        <div className="h-3 w-px bg-slate-200"></div>
                                        <span className="flex items-center gap-1.5"><Layout className="h-3 w-3 text-indigo-500" /> 4+1 LUXURY</span>
                                     </div>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                    )}

                    {/* Trust Anchor Team Section */}
                    {sections.find(s => s.id === 'team')?.enabled && (
                       <div className="space-y-16">
                          <div className="text-center space-y-4 max-w-xl mx-auto">
                             <div className="h-0.5 w-12 bg-indigo-600 mx-auto"></div>
                             <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                               {lang === 'tr' ? 'GÜVEN BİZİM GENETİĞİMİZDE VAR' : 'TRUST IS IN OUR DNA'}
                             </h3>
                             <p className="text-xs font-bold text-slate-400 leading-relaxed">
                               {lang === 'tr' ? 'Brokerlarımızın 10 yıllık tecrübesiyle, her mülk bir hikaye ve doğru yatırımdır.' : 'Our brokers bring a decade of experience to every listing.'}
                             </p>
                          </div>
                          <div className="grid grid-cols-3 gap-12">
                             {team.map((tm, idx) => (
                               <div key={idx} className="group cursor-pointer">
                                  <div className="aspect-[3/4] bg-slate-50 rounded-[3rem] overflow-hidden relative shadow-2xl shadow-indigo-100/50 group-hover:-translate-y-4 transition-all duration-700">
                                     <img src={tm.image} className="h-full w-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700 scale-105" alt={tm.name} />
                                     <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                  </div>
                                  <div className="mt-8 text-center space-y-1">
                                     <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{tm.name}</p>
                                     <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{tm.role}</p>
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>
                    )}
                 </div>

                 {/* Modern Footer */}
                 <div className="bg-slate-900 p-20 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full"></div>
                    <div className="relative z-10 space-y-8">
                       <div className="flex items-center justify-center gap-3">
                          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-900 font-black italic shadow-2xl">LP</div>
                          <span className="text-white text-lg font-black tracking-tighter uppercase">LOOKPRICE MASTER</span>
                       </div>
                       <p className="text-slate-500 text-[10px] font-medium max-w-sm mx-auto uppercase tracking-widest leading-loose">
                         {lang === 'tr' ? '101evler iş birliği ile Kuzey Kıbrıs emlak piyasasının zirvesine ulaşın.' : 'Reach the peak of real estate market in collaboration with 101evler.'}
                       </p>
                       <div className="h-px w-20 bg-slate-800 mx-auto"></div>
                       <p className="text-slate-700 text-[9px] font-black tracking-[0.5em] uppercase">PORTFOLIO ENGINE v4.0</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

