import React from "react";
import { motion } from "motion/react";

interface StoreBlogPostsProps {
  blogPosts: any[];
  lang: string;
  setShowBlog: (show: boolean) => void;
  setSelectedBlogPost: (post: any) => void;
}

export const StoreBlogPosts: React.FC<StoreBlogPostsProps> = ({
  blogPosts,
  lang,
  setShowBlog,
  setSelectedBlogPost
}) => {
  if (!blogPosts || blogPosts.length === 0) return null;

  return (
    <section className="mt-32">
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">
          {lang === "tr" ? "Blog Yazıları" : "Blog Posts"}
        </h2>
        <button
          onClick={() => setShowBlog(true)}
          className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          {lang === "tr" ? "Tümünü Gör" : "See All"}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {blogPosts.slice(0, 3).map((post) => (
          <motion.div
            key={post.id}
            whileHover={{ y: -8 }}
            onClick={() => {
              setSelectedBlogPost(post);
              setShowBlog(true);
            }}
            className="group cursor-pointer bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500"
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={
                  post.image_url ||
                  "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=60"
                }
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <div className="p-6">
              <span className="text-[10px] font-semibold text-indigo-600 tracking-wide mb-2 block">
                {post.date}
              </span>
              <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                {post.title}
              </h4>
              <p className="text-gray-500 text-sm line-clamp-3 leading-relaxed">
                {post.excerpt || post.content}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
