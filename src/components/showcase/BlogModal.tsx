import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, Facebook, Twitter, MessageSquare, Link2, BookOpen } from 'lucide-react';
import { BlogPost } from '../../types';

interface BlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  isTr: boolean;
  selectedBlogPost: BlogPost | null;
  setSelectedBlogPost: (post: BlogPost | null) => void;
  blogPosts?: BlogPost[];
}

export const BlogModal: React.FC<BlogModalProps> = ({
  isOpen,
  onClose,
  lang,
  isTr,
  selectedBlogPost,
  setSelectedBlogPost,
  blogPosts
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-4xl rounded-[40px] shadow-lg relative z-10 overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-8 border-b flex items-center justify-between shrink-0">
              <h2 className="text-2xl font-semibold text-gray-900 tracking-normal">
                {lang === "tr" ? "Blog" : "Blog"}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
              {selectedBlogPost ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <button
                    onClick={() => setSelectedBlogPost(null)}
                    className="group mb-8 flex items-center gap-2 text-sm font-semibold text-indigo-600 tracking-wide hover:text-indigo-700 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    {lang === "tr" ? "TÜM YAZILAR" : "ALL POSTS"}
                  </button>

                  {selectedBlogPost.image_url && (
                    <div className="relative h-96 rounded-3xl overflow-hidden mb-10 shadow-xl border border-gray-100">
                      <img
                        src={selectedBlogPost.image_url}
                        alt={selectedBlogPost.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="max-w-2xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-semibold tracking-wide leading-none">
                        {selectedBlogPost.date}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-lg bg-gray-200" />
                      <span className="text-[10px] font-semibold text-gray-400 tracking-wide">
                        {Math.ceil((selectedBlogPost.content?.length || 0) / 1000)}{" "}
                        {isTr ? "DAKİKA OKUMA" : "MIN READ"}
                      </span>
                    </div>

                    <h3 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-10 tracking-tight">
                      {selectedBlogPost.title}
                    </h3>

                    <div className="whitespace-pre-wrap text-gray-600 text-lg leading-relaxed font-normal space-y-6">
                      {selectedBlogPost.content}
                    </div>

                    <div className="mt-16 pt-10 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-10">
                      <div className="flex items-center gap-4">
                        <span className="text-xss font-semibold text-gray-400 tracking-wide">
                          {isTr ? "PAYLAŞ:" : "SHARE:"}
                        </span>
                        <div className="flex items-center gap-2">
                          <button className="w-12 h-12 flex items-center justify-center bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-all shadow-sm">
                            <Facebook className="w-5 h-5" />
                          </button>
                          <button className="w-12 h-12 flex items-center justify-center bg-gray-50 hover:bg-sky-50 hover:text-sky-600 rounded-2xl transition-all shadow-sm">
                            <Twitter className="w-5 h-5" />
                          </button>
                          <button className="w-12 h-12 flex items-center justify-center bg-gray-50 hover:bg-emerald-50 hover:text-emerald-600 rounded-2xl transition-all shadow-sm">
                            <MessageSquare className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          // We avoid window.alert as per guidelines if possible, but keep it if simple
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-semibold text-xss tracking-wide hover:bg-gray-800 transition-all active:scale-95 shadow-xl shadow-gray-200"
                      >
                        <Link2 className="w-4 h-4" />
                        <span>{isTr ? "BAĞLANTIYI KOPYALA" : "COPY LINK"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {blogPosts?.length ? (
                    blogPosts.map((post) => (
                      <motion.div
                        key={post.id}
                        whileHover={{ y: -8 }}
                        onClick={() => setSelectedBlogPost(post)}
                        className="group cursor-pointer bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500"
                      >
                        <div className="relative h-64 overflow-hidden">
                          {post.image_url ? (
                            <img
                              src={post.image_url}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                              <BookOpen className="w-12 h-12 text-slate-200" />
                            </div>
                          )}
                          <div className="absolute top-4 left-4">
                            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-indigo-600 rounded-lg text-[10px] font-bold tracking-wide shadow-sm">
                              {post.date}
                            </span>
                          </div>
                        </div>
                        <div className="p-8">
                          <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                            {post.title}
                          </h4>
                          <p className="text-gray-500 text-sm font-medium line-clamp-3 leading-relaxed mb-6">
                            {post.excerpt || post.content}
                          </p>
                          <div className="flex items-center text-indigo-600 text-xs font-bold tracking-widest uppercase gap-2 group-hover:gap-3 transition-all">
                             {isTr ? "Devamını Oku" : "Read More"}
                             <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-20 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                      <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100 text-gray-300">
                        <BookOpen className="w-10 h-10" />
                      </div>
                      <p className="text-xl font-bold text-gray-900 mb-2">
                        {isTr ? "Henüz Yazı Yok" : "No Posts Yet"}
                      </p>
                      <p className="text-gray-500 font-medium max-w-sm mx-auto">
                        {isTr
                          ? "Yakında yeni içeriklerimizle burada olacağız."
                          : "We will be here with new content soon."}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const ChevronRight: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
  </svg>
);
