import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Clock, X, Facebook, Twitter, Link2, Sparkles } from "lucide-react";

interface BlogShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  blog: {
    id?: any;
    title: string;
    content?: string;
    summary?: string;
    image_url?: string;
    img?: string;
    date?: string;
    created_at?: string;
  } | null;
  lang?: string;
}

export const BlogShowcaseModal: React.FC<BlogShowcaseModalProps> = ({
  isOpen,
  onClose,
  blog,
  lang = "tr",
}) => {
  if (!isOpen || !blog) return null;

  const title = blog.title;
  const content = blog.content || blog.summary || "";
  const imageUrl = blog.image_url || blog.img || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800";
  const dateStr = blog.date || (blog.created_at ? new Date(blog.created_at).toLocaleDateString() : "");

  // Calculated reading time helper
  const cleanText = content.replace(/<[^>]*>?/gm, "");
  const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
  const minutesToRead = Math.max(1, Math.ceil(wordCount / 200));

  const handleShare = (platform: "facebook" | "twitter" | "copy") => {
    const shareUrl = window.location.href;
    const shareText = encodeURIComponent(title);

    if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
    } else if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`, "_blank");
    } else if (platform === "copy") {
      navigator.clipboard.writeText(shareUrl);
      alert(lang === "tr" ? "Bağlantı kopyalandı!" : "Link copied to clipboard!");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Transparent backdrop blur overlay */}
        <motion.div
          id="blog-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Content Structure */}
        <motion.div
          id="blog-modal-content"
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="relative w-full max-w-3xl bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]"
        >
          {/* Close trigger button */}
          <button
            id="blog-modal-close"
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full backdrop-blur-md bg-black/40 text-white hover:bg-black/60 transition-colors cursor-pointer z-20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Scrolling surface container */}
          <div className="overflow-y-auto custom-scrollbar">
            {/* Header Image Cover */}
            <div className="h-64 sm:h-80 w-full relative overflow-hidden bg-slate-100 flex-shrink-0">
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/25 to-transparent" />
            </div>

            {/* Typography Content Wrapper */}
            <div className="p-8 sm:p-12 space-y-6">
              {/* Blog Metadata Indicators */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400">
                {dateStr && (
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{dateStr}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>
                    {minutesToRead} {lang === "tr" ? "DK OKUMA SÜRESİ" : "MIN READ"}
                  </span>
                </div>
              </div>

              {/* Display Title */}
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight tracking-tight">
                {title}
              </h2>

              {/* Main Content Pane */}
              <div 
                className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium space-y-6 prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />

              {/* Bottom Decorative Layout & Social actions */}
              <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    {lang === "tr" ? "İÇERİĞİ PAYLAŞ:" : "SHARE THIS ARTICLE:"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleShare("facebook")}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 hover:text-indigo-600 text-slate-500 rounded-xl transition-all cursor-pointer"
                      title="Facebook"
                    >
                      <Facebook className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleShare("twitter")}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 hover:text-sky-500 text-slate-500 rounded-xl transition-all cursor-pointer"
                      title="Twitter"
                    >
                      <Twitter className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleShare("copy")}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 hover:text-emerald-500 text-slate-500 rounded-xl transition-all cursor-pointer"
                      title={lang === "tr" ? "Bağlantıyı Kopyala" : "Copy Link"}
                    >
                      <Link2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Return trigger component */}
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer self-start sm:self-center"
                >
                  {lang === "tr" ? "PENCEREKİ Kapat" : "Dismiss Reader"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
