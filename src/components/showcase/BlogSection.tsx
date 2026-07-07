import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { Store as StoreInfo, BlogPost } from '../../types';

interface BlogSectionProps {
  store: StoreInfo;
  isTr: boolean;
  onSelectPost: (post: BlogPost) => void;
}

export const BlogSection: React.FC<BlogSectionProps> = ({ store, isTr, onSelectPost }) => {
  if (!store.blog_posts || store.blog_posts.length === 0) return null;
  return (
    <section id="blog" className="py-12">
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-4xl font-semibold text-gray-900 tracking-tight">
          {isTr ? "Blog Yazıları" : "Blog Posts"}
        </h2>
        <div className="hidden md:flex items-center space-x-2 text-sm font-semibold text-indigo-600 tracking-wide">
          <Sparkles className="w-4 h-4" />
          <span>{isTr ? "YENİ İÇERİKLER" : "NEW CONTENT"}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {store.blog_posts.map((post) => (
          <motion.div
            key={post.id}
            whileHover={{ y: -8 }}
            onClick={() => onSelectPost(post)}
            className="group cursor-pointer bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-500"
          >
            <div className="relative h-64 overflow-hidden">
              <img
                src={
                  post.image_url ||
                  "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=60"
                }
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                alt={post.title}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-lg text-xss font-semibold text-indigo-600 tracking-wide">
                  {isTr ? "Okumaya Devam Et" : "Read More"}
                </span>
              </div>
            </div>
            <div className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-semibold text-indigo-600 tracking-wide bg-indigo-50 px-2 py-1 rounded-md">
                  {post.date}
                </span>
                <span className="w-1 h-1 rounded-lg bg-gray-300" />
                <span className="text-[10px] font-semibold text-gray-400 tracking-wide">
                  {Math.ceil((post.content?.length || 0) / 1000)} {isTr ? "DAKİKA" : "MIN READ"}
                </span>
              </div>
              <h4 className="text-xsl font-semibold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                {post.title}
              </h4>
              <p className="text-gray-500 text-sm leading-relaxed font-medium line-clamp-3">
                {post.excerpt}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
