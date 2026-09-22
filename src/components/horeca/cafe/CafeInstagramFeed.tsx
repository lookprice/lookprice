import React from "react";
import { Instagram } from "lucide-react";

interface CafeInstagramFeedProps {
  enabled: boolean;
  store: any;
  instagramHandle: string;
  instagramSubtitle: string;
  instagramProfileUrl: string;
  instagramPosts: any[];
  isTr: boolean;
}

export const CafeInstagramFeed: React.FC<CafeInstagramFeedProps> = ({
  enabled,
  store,
  instagramHandle,
  instagramSubtitle,
  instagramProfileUrl,
  instagramPosts,
  isTr
}) => {
  if (!enabled) return null;

  return (
    <section id="instagram-grid" className="py-12 bg-slate-950 border-t border-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-900 pb-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="p-0.5 rounded-full bg-slate-800 border border-slate-700 shrink-0">
              {(store.logo_url || store.branding?.logo_url) ? (
                <img
                  src={store.logo_url || store.branding?.logo_url}
                  alt="Instagram Avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-xs">
                  <Instagram className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-sm font-black text-white tracking-tight">
                  {instagramHandle}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                {instagramSubtitle}
              </p>
            </div>
          </div>

          <a
            href={instagramProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Instagram className="w-3.5 h-3.5" />
            <span>{isTr ? "Instagram'da Takip Et" : "Follow on Instagram"}</span>
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {instagramPosts.map((post: any, idx: number) => {
            const targetUrl = post.post_url || instagramProfileUrl;

            return (
              <a
                key={post.id || idx}
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-800 transition-all cursor-pointer block"
              >
                <img
                  src={post.image_url}
                  alt={post.caption || `Instagram Post ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90"
                  loading="lazy"
                />
              </a>
            );
          })}
        </div>

      </div>
    </section>
  );
};
