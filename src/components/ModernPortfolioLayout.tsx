import React, { useState, useEffect } from "react";
import {
  Map,
  Layout,
  ArrowRight,
  Check,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { Store, Product } from "../types";
import { useLanguage } from "../contexts/LanguageContext";
import { api } from "../services/api";

interface ModernPortfolioLayoutProps {
  store: Store;
  products: Product[];
  onViewProduct: (product: Product) => void;
}

export const ModernPortfolioLayout: React.FC<ModernPortfolioLayoutProps> = ({
  store,
  products,
  onViewProduct,
}) => {
  const { lang } = useLanguage();
  const [blogs, setBlogs] = useState<any[]>([]);

  useEffect(() => {
    if (store.slug) {
      api
        .getPublicBlogPosts(store.slug)
        .then((res) => {
          if (Array.isArray(res)) {
            setBlogs(res.slice(0, 3));
          }
        })
        .catch(console.error);
    }
  }, [store.slug]);

  const team = store.consultants && store.consultants.length > 0 
    ? store.consultants.map(c => ({
        id: c.id?.toString() || c.name,
        name: c.name,
        role: c.role || "Danışman",
        image: c.image_url || "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400",
      }))
    : [
    {
      id: "1",
      name: store.name || "Broker",
      role: "Broker / Manager",
      image:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400",
    },
  ];

  const content = {
    hero: {
      title:
        store.name?.toUpperCase() ||
        (lang === "tr" ? "YENİ NESİL PORTFÖY" : "NEW GENERATION PORTFOLIO"),
      subtitle:
        store.description ||
        (lang === "tr"
          ? "Yatırım hayallerinizi gerçeğe dönüştüren profesyonel çözümler."
          : "Professional solutions turning your investment dreams into reality."),
      bgImage:
        store.logo_url ||
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000",
    },
    stats: [
      {
        value: "500+",
        label: lang === "tr" ? "Mutlu Müşteri" : "Happy Clients",
      },
      {
        value: products.length.toString(),
        label: lang === "tr" ? "Aktif İlan" : "Active Listings",
      },
      {
        value: "10+",
        label: lang === "tr" ? "Yıl Tecrübe" : "Years Experience",
      },
    ],
    trustSlogan:
      (store as any).slogan ||
      (lang === "tr" ? "GÜVENLE YÖNETİYORUZ" : "MANAGED WITH TRUST"),
  };

  const layoutConfig = React.useMemo(() => {
    if (!store.page_layout) return { sections: [], grid: 'standard', count: 6 };
    let layout = store.page_layout;
    if (typeof layout === "string") {
      try {
        layout = JSON.parse(layout);
      } catch (e) {
        return { sections: [], grid: 'standard', count: 6 };
      }
    }
    
    if (Array.isArray(layout)) {
      return { sections: layout, grid: 'standard', count: 6 };
    }
    
    const l = layout as any;
    return {
      sections: l.sections || [],
      grid: l.grid || 'standard',
      count: l.count || 6
    };
  }, [store.page_layout]);

  const isSectionEnabled = (sectionId: string) => {
    if (!layoutConfig.sections || layoutConfig.sections.length === 0) return true;
    const section = layoutConfig.sections.find((s: any) => s.id === sectionId);
    return section ? section.enabled : true;
  };

  const displayedProducts = products.slice(0, layoutConfig.count);

  return (
    <div className="flex-1 bg-white overflow-hidden min-h-screen relative w-full font-sans">
      {/* Hero Container */}
      {isSectionEnabled("hero") && (
        <div className="h-[450px] relative flex flex-col items-center justify-center p-12 text-center w-full">
          <div
            className="absolute inset-0 transition-opacity duration-1000"
            style={{
              backgroundImage: `url(${content.hero.bgImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(2px)",
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-white/90"></div>

          <div className="relative z-10 space-y-6 max-w-2xl transform translate-y-4">
            <div className="inline-flex items-center gap-2 bg-indigo-600/20 backdrop-blur-xl px-4 py-1.5 rounded-full border border-indigo-400/30">
              <Check className="h-4 w-4 text-indigo-400" />
              <span className="text-[12px] font-black text-indigo-300 uppercase tracking-widest">
                {content.trustSlogan}
              </span>
            </div>
            <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-[0.9] drop-shadow-2xl">
              {content.hero.title}
            </h1>
            <p className="text-white text-lg font-bold max-w-lg mx-auto leading-relaxed italic drop-shadow-sm">
              "{content.hero.subtitle}"
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 pb-32">
        {/* Advanced Search Strip */}
        {isSectionEnabled("search") && (
          <div className="-mt-12 relative z-30 w-full mb-24">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-2xl grid grid-cols-1 md:grid-cols-4 gap-6">
              {["LOCATION", "TYPE", "BUDGET", "ROOMS"].map((filt, idx) => (
                <div
                  key={filt}
                  className={`group cursor-pointer ${idx < 3 ? "md:border-r border-slate-100" : ""} px-2`}
                >
                  <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] mb-1">
                    {filt}
                  </p>
                  <div className="flex items-center justify-between pr-4">
                    <span className="text-sm font-black text-slate-900">
                      {lang === "tr" ? "Tümü" : "All"}
                    </span>
                    <SlidersHorizontal className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </div>
              ))}
              <button className="col-span-1 md:col-span-4 bg-slate-900 text-white py-4 rounded-3xl text-[12px] font-black uppercase tracking-[0.4em] mt-2 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
                {lang === "tr" ? "HAYALİNDEKİ MÜLKÜ BUL" : "FIND YOUR DREAM"}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-32">
          {/* Stats */}
          {isSectionEnabled("stats") && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-y border-slate-200 py-12">
              {content.stats.map((st, i) => (
                <div key={i} className="text-center group">
                  <p className="text-5xl font-black text-slate-900 mb-2 group-hover:scale-110 transition-transform">
                    {st.value}
                  </p>
                  <div className="h-1 w-8 bg-indigo-600 mx-auto mb-4 rounded-full"></div>
                  <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">
                    {st.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Portfolio/Listing Grid Preview */}
          {isSectionEnabled("portfolio") && (
            <div className="space-y-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-slate-100 pb-8 gap-4">
                <div className="space-y-2">
                  <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
                    {lang === "tr" ? "GÜNCEL PORTFÖY" : "LATEST LISTINGS"}
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="h-1 w-12 bg-indigo-600 rounded-full"></div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
                      {lang === "tr" ? "Size Özel Seçkiler" : "Curated For You"}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`grid gap-10 ${layoutConfig.grid === 'masonry' ? 'columns-1 md:columns-2 lg:columns-3 space-y-10' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                {displayedProducts.map((p) => {
                  const priceStr = new Intl.NumberFormat("tr-TR", {
                    style: "currency",
                    currency: p.currency || store.currency || "USD",
                  }).format(p.price);

                  return (
                    <div
                      key={p.id}
                      onClick={() => onViewProduct(p)}
                      className="group cursor-pointer"
                    >
                      <div className="bg-slate-50 rounded-[3rem] overflow-hidden relative shadow-sm group-hover:shadow-2xl transition-all duration-700 aspect-[16/10]">
                        <div
                          className="h-full w-full bg-cover bg-center transition-transform duration-[2s] group-hover:scale-105"
                          style={{
                            backgroundImage: `url(${p.image_url || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000"})`,
                          }}
                        ></div>
                        <div className="absolute top-8 left-8 flex gap-2">
                          <div className="bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-2xl text-[10px] font-black text-slate-950 uppercase tracking-[0.2em] shadow-xl border border-slate-100">
                            {p.category || "GAYRİMENKUL"}
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full p-10 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                          <button className="w-full py-4 bg-white text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-slate-50 transition-colors">
                            {lang === "tr" ? "MÜLKÜ İNCELE" : "EXPLORE PROPERTY"}
                          </button>
                        </div>
                      </div>
                      <div className="mt-8 space-y-3 px-4">
                        <div className="flex justify-between items-start">
                          <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter group-hover:text-indigo-600 transition-colors leading-none">
                            {p.name}
                          </h4>
                        </div>
                        <div className="flex items-center justify-between">
                           <p className="text-xl font-black text-indigo-600 tracking-tight">
                              {priceStr}
                           </p>
                           {(p.sector_data?.city || p.sector_data?.district) && (
                             <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                               <Map className="h-3.5 w-3.5 text-indigo-500" />
                               {p.sector_data?.district || p.sector_data?.city}
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Blog Section */}
          {isSectionEnabled("blog") && (
            <div className="space-y-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-slate-100 pb-8 gap-4">
                <div className="space-y-2">
                  <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
                    {lang === "tr" ? "BLOG YAZILARIMIZ" : "OUR BLOG"}
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="h-1 w-12 bg-rose-500 rounded-full"></div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
                      {lang === "tr" ? "Güncel İçerikler" : "Latest Insights"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(blogs.length > 0 ? blogs : []).map((blog, i) => (
                  <div
                    key={i}
                    className="group cursor-pointer flex flex-col bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-rose-500/10 transition-all duration-300"
                  >
                    <div className="h-64 relative overflow-hidden">
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{
                          backgroundImage: `url(${blog.image_url || blog.img || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800"})`,
                        }}
                      ></div>
                    </div>
                    <div className="p-8 space-y-4 flex-1 flex flex-col">
                      <p className="text-xs font-black text-rose-500 uppercase tracking-widest">
                        {blog.date ||
                          new Date(blog.created_at).toLocaleDateString()}
                      </p>
                      <h4 className="text-xl font-black text-slate-900 leading-snug group-hover:text-rose-600 transition-colors">
                        {blog.title}
                      </h4>
                      <div
                        className="text-sm text-slate-500 leading-relaxed max-w-sm line-clamp-3"
                        dangerouslySetInnerHTML={{
                          __html:
                            blog.summary ||
                            (blog.content
                              ? blog.content
                                  .replace(/<[^>]*>?/gm, "")
                                  .substring(0, 150) + "..."
                              : ""),
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

              {/* Standalone Financing Calculator for Portfolio */}
              {isSectionEnabled("financing") && (
                <div className="pt-24">
                  <div className="bg-slate-900 rounded-[3.5rem] p-8 md:p-16 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                      <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/5">
                          <Check className="h-4 w-4 text-indigo-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Akıllı Finansal Asistan</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
                          {lang === "tr" ? "Yatırımınızı\nPlanlayın" : "Plan Your\nInvestment"}
                        </h2>
                        <p className="text-slate-400 font-bold max-w-md">
                          {lang === "tr" 
                            ? "Hayalinizdeki mülk için size özel ödeme planlarını ve kredi seçeneklerini anında hesaplayın."
                            : "Calculate your personalized payment plans and credit options for your dream property instantly."}
                        </p>
                        <div className="flex flex-wrap gap-4 pt-4">
                           <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center flex-1 min-w-[120px]">
                              <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Düşük Faiz</p>
                              <p className="text-lg font-black text-emerald-400">%1.89</p>
                           </div>
                           <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center flex-1 min-w-[120px]">
                              <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Vade</p>
                              <p className="text-lg font-black text-indigo-400">120 Ay</p>
                           </div>
                        </div>
                      </div>

                      <div className="bg-white text-slate-900 p-8 md:p-10 rounded-[2.5rem] shadow-2xl space-y-6">
                         <div className="space-y-6">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mülk Tutarı</label>
                               <div className="relative">
                                  <input type="text" defaultValue="5.000.000" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xl font-black focus:ring-2 focus:ring-indigo-600 outline-none transition-all" />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">TRY</span>
                               </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peşinat (%)</label>
                                  <input type="number" defaultValue="30" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-black focus:ring-2 focus:ring-indigo-600 outline-none" />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vade (Ay)</label>
                                  <select className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-black focus:ring-2 focus:ring-indigo-600 outline-none appearance-none">
                                     <option>36</option>
                                     <option>60</option>
                                     <option>120</option>
                                  </select>
                               </div>
                            </div>
                            <button className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl">
                               Şimdi Hesapla
                            </button>
                            <p className="text-[9px] text-slate-400 text-center font-bold italic">
                               * Hesaplamalar genel bilgilendirme amaçlıdır. Güncel banka verilerine göre değişiklik gösterebilir.
                            </p>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

          {/* Trust Anchor Team Section */}
          {isSectionEnabled("team") && (
            <div className="space-y-16">
              <div className="text-center space-y-4 max-w-2xl mx-auto">
                <div className="h-1 w-16 bg-indigo-600 mx-auto"></div>
                <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                  {lang === "tr"
                    ? "GÜVEN BİZİM GENETİĞİMİZDE VAR"
                    : "TRUST IS IN OUR DNA"}
                </h3>
                <p className="text-base font-bold text-slate-500 leading-relaxed">
                  {lang === "tr"
                    ? "Brokerlarımızın 10 yıllık tecrübesiyle, her mülk bir hikaye ve doğru yatırımdır."
                    : "Our brokers bring a decade of experience to every listing."}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {team.map((tm, idx) => (
                  <div key={idx} className="group cursor-pointer">
                    <div className="aspect-[3/4] bg-slate-100 rounded-[3rem] overflow-hidden relative shadow-xl hover:-translate-y-4 transition-all duration-700">
                      <img
                        src={tm.image}
                        className="h-full w-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 scale-105"
                        alt={tm.name}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <div className="mt-8 text-center space-y-2">
                      <p className="text-xl font-black text-slate-900 uppercase tracking-tight">
                        {tm.name}
                      </p>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {tm.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 pt-24 pb-12 text-white mt-32">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-16 border-b border-slate-800">
            <div className="col-span-1 md:col-span-1 space-y-6">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">{store.name}</h2>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                {store.description || (lang === 'tr' ? 'Yenilikçi gayrimenkul çözümleri ve portföy yönetimi.' : 'Innovative real estate solutions and portfolio management.')}
              </p>
              <div className="flex gap-4">
                {store.instagram_url && (
                  <a href={store.instagram_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.03.07-4.85.148-3.212 1.664-4.771 4.918-4.918 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                )}
                {store.facebook_url && (
                  <a href={store.facebook_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-8.77h-2.953v-3.425h2.953v-2.524c0-2.921 1.782-4.513 4.391-4.513 1.25-.013 2.493.048 3.731.183v3.13h-1.854c-1.419 0-1.694.675-1.694 1.662v2.176h3.463l-.451 3.426h-3.012v8.77h6.105c.733 0 1.325-.593 1.325-1.325v-21.352c0-.732-.592-1.325-1.325-1.325z"/></svg>
                  </a>
                )}
              </div>
            </div>
            
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Hızlı Erişim</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-400">
                <li className="hover:text-indigo-400 cursor-pointer transition-colors">Mülklerimiz</li>
                <li className="hover:text-indigo-400 cursor-pointer transition-colors">Bölgelerimiz</li>
                <li className="hover:text-indigo-400 cursor-pointer transition-colors">Biz Kimiz?</li>
                <li className="hover:text-indigo-400 cursor-pointer transition-colors">İletişim</li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Kurumsal</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-400">
                <li className="hover:text-indigo-400 cursor-pointer transition-colors">Gizlilik Politikası</li>
                <li className="hover:text-indigo-400 cursor-pointer transition-colors">Kullanım Koşulları</li>
                <li className="hover:text-indigo-400 cursor-pointer transition-colors">KVKK Aydınlatma</li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">İletişim</h4>
              <div className="space-y-4 text-sm font-bold text-slate-400">
                <p className="flex items-center gap-3">
                  <span className="text-indigo-500">A:</span> {store.address || 'Kıbrıs / Lefkoşa'}
                </p>
                <p className="flex items-center gap-3">
                  <span className="text-indigo-500">T:</span> {store.phone || '+90 (555) 000 00 00'}
                </p>
                <p className="flex items-center gap-3">
                  <span className="text-indigo-500">E:</span> {store.email || 'info@lookprice.net'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
              © {new Date().getFullYear()} {store.name}. TÜM HAKLARI SAKLIDIR.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">POWERED BY</span>
              <img src="https://lookprice.net/logo_dark.png" alt="Lookprice" className="h-4 opacity-30 invert" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
