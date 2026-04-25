import React, { useState } from "react";
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Image as ImageIcon, 
  Sparkles, 
  Loader2, 
  Save,
  X,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BlogPost, Store } from "../../types";
import { api } from "../../services/api";

interface BlogTabProps {
  branding: Store;
  setBranding: (branding: Store) => void;
  isTr: boolean;
}

export default function BlogTab({ branding, setBranding, isTr }: BlogTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [formState, setFormState] = useState({
    title: "",
    excerpt: "",
    content: "",
    image_url: ""
  });

  const blogPosts = branding.blog_posts || [];

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const newPost: BlogPost = {
      id: editingPost?.id || Math.random().toString(36).substr(2, 9),
      title: formState.title,
      excerpt: formState.excerpt,
      content: formState.content,
      image_url: formState.image_url || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=60",
      date: editingPost?.date || new Date().toISOString().split('T')[0]
    };

    let updatedPosts;
    if (editingPost && editingPost.id) {
      updatedPosts = blogPosts.map(p => p.id === editingPost.id ? newPost : p);
    } else {
      updatedPosts = [newPost, ...blogPosts];
    }

    setBranding({ ...branding, blog_posts: updatedPosts });
    setShowModal(false);
    setEditingPost(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(isTr ? "Bu yazıyı silmek istediğinizden emin misiniz?" : "Are you sure you want to delete this post?")) {
      const updatedPosts = blogPosts.filter(p => p.id !== id);
      setBranding({ ...branding, blog_posts: updatedPosts });
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormState({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      image_url: post.image_url || ""
    });
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingPost(null);
    setFormState({
      title: "",
      excerpt: "",
      content: "",
      image_url: ""
    });
    setShowModal(true);
  };

  const generateWithAI = async (topic: string) => {
    if (!topic) return;
    setIsGenerating(true);
    try {
      const result = await api.generateBlog(topic, branding.name, isTr ? 'tr' : 'en');
      setFormState(prev => ({
        ...prev,
        ...result
      }));
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert(isTr ? "Yapay zeka ile içerik üretilirken bir hata oluştu." : "Error generating content with AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredPosts = blogPosts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {isTr ? "Blog Yönetimi" : "Blog Management"}
          </h2>
          <p className="text-slate-500 mt-1 font-medium">
            {isTr ? "Müşterileriniz için ilgi çekici içerikler oluşturun ve yayınlayın." : "Create and publish engaging content for your customers."}
          </p>
        </div>
        <button 
          onClick={handleNew}
          className="flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>{isTr ? "Yeni Yazı Ekle" : "Add New Post"}</span>
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        <input 
          type="text" 
          placeholder={isTr ? "Yazılarda ara..." : "Search posts..."}
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-3xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium text-slate-600"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => (
          <motion.div 
            key={post.id}
            layout
            className="bg-white rounded-[2.5rem] border border-slate-100 p-2 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group overflow-hidden"
          >
            <div className="relative h-48 rounded-[2.2rem] overflow-hidden mb-4">
              <img 
                src={post.image_url} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              />
              <div className="absolute top-4 right-4 flex space-x-2">
                <button 
                  onClick={() => handleEdit(post)}
                  className="p-2 bg-white/90 backdrop-blur-md rounded-xl text-indigo-600 hover:bg-white transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(post.id)}
                  className="p-2 bg-rose-500/90 backdrop-blur-md rounded-xl text-white hover:bg-rose-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center space-x-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">
                <BookOpen className="w-3 h-3" />
                <span>{post.date}</span>
              </div>
              <h3 className="font-black text-slate-900 text-lg mb-2 line-clamp-2">{post.title}</h3>
              <p className="text-slate-500 text-sm font-medium line-clamp-3 mb-4">{post.excerpt}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSave} className="flex flex-col h-[85vh]">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        {editingPost ? (isTr ? "Yazıyı Düzenle" : "Edit Post") : (isTr ? "Yeni Yazı" : "New Post")}
                      </h3>
                      <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
                        {isTr ? "İçerik Editörü" : "Content Editor"}
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="p-3 hover:bg-slate-200 rounded-2xl transition-colors"
                  >
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                  {/* AI Content Enrichment */}
                  <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl">
                    <div className="flex items-center space-x-3 mb-4">
                      <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                      <h4 className="font-black text-indigo-900 text-sm uppercase tracking-widest">
                        {isTr ? "Yapay Zeka Asistanı" : "AI Assistant"}
                      </h4>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        id="ai-topic"
                        placeholder={isTr ? "Yazılacak konu (örn: Yaz indirimi kampanyamız...)" : "Topic to write about (e.g., Our summer sale...)"}
                        className="flex-1 px-4 py-3 bg-white border border-indigo-200 rounded-2xl focus:ring-4 focus:ring-indigo-200 outline-none transition-all font-medium text-slate-700"
                      />
                      <button 
                        type="button"
                        disabled={isGenerating}
                        onClick={() => {
                          const topic = (document.getElementById('ai-topic') as HTMLInputElement).value;
                          generateWithAI(topic);
                        }}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all flex items-center space-x-2 disabled:opacity-50"
                      >
                        {isGenerating ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Sparkles className="w-5 h-5" />
                        )}
                        <span>{isTr ? "Yaz" : "Write"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{isTr ? "Başlık" : "Title"}</label>
                        <input 
                          name="title"
                          required
                          value={formState.title}
                          onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                          placeholder={isTr ? "Yazı başlığı..." : "Post title..."}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{isTr ? "Özet" : "Excerpt"}</label>
                        <textarea 
                          name="excerpt"
                          required
                          rows={3}
                          value={formState.excerpt}
                          onChange={(e) => setFormState({ ...formState, excerpt: e.target.value })}
                          placeholder={isTr ? "Kısa bir özet yazın..." : "Write a short summary..."}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium text-slate-600 resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{isTr ? "Görsel URL" : "Image URL"}</label>
                        <div className="flex gap-2">
                          <input 
                            name="image_url"
                            value={formState.image_url}
                            onChange={(e) => setFormState({ ...formState, image_url: e.target.value })}
                            placeholder="https://..."
                            className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-mono text-xs text-slate-500"
                          />
                          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-200">
                             <ImageIcon className="w-6 h-6 text-slate-300" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 flex flex-col h-full">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{isTr ? "İçerik" : "Content"}</label>
                      <textarea 
                        name="content"
                        required
                        value={formState.content}
                        onChange={(e) => setFormState({ ...formState, content: e.target.value })}
                        placeholder={isTr ? "Yazı içeriğini buraya girin..." : "Enter post content here..."}
                        className="flex-1 w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium text-slate-600 min-h-[300px]"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end space-x-4">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all active:scale-95"
                  >
                    {isTr ? "İptal" : "Cancel"}
                  </button>
                  <button 
                    type="submit"
                    className="flex items-center space-x-2 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                  >
                    <Save className="w-5 h-5" />
                    <span>{isTr ? "Yazıyı Yayınla" : "Publish Post"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
