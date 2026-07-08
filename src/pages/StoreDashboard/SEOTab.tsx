import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { toast } from "sonner";
import { Edit2, Trash2, Plus } from "lucide-react";

interface SEOTabProps {
  storeId: number;
}

export default function SEOTab({ storeId }: SEOTabProps) {
  const [seoPages, setSeoPages] = useState<any[]>([]);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [formData, setFormData] = useState<any>({ title: '', slug: '', h1: '', description: '', faq: [], descriptions: [] });

  useEffect(() => {
    fetchSeoPages();
  }, [storeId]);

  useEffect(() => {
    if (editingPage) {
      setFormData(editingPage);
    } else {
      setFormData({ title: '', slug: '', h1: '', description: '', faq: [], descriptions: [] });
    }
  }, [editingPage]);

  const fetchSeoPages = async () => {
    try {
      const pages = await api.getSEOPages(storeId);
      setSeoPages(pages.data || pages);
    } catch (error) {
      toast.error("SEO sayfaları yüklenirken hata oluştu");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await api.updateSEOPage(formData.id, formData, storeId);
        toast.success("SEO sayfası güncellendi");
      } else {
        await api.addSEOPage(formData, storeId);
        toast.success("SEO sayfası eklendi");
      }
      setEditingPage(null);
      fetchSeoPages();
    } catch (error) {
      toast.error("Kaydetme işlemi başarısız oldu");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">SEO Sayfaları</h3>
        <button onClick={() => setEditingPage({})} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
          <Plus size={16} />
          <span>Yeni Sayfa</span>
        </button>
      </div>
      
      {editingPage ? (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow space-y-4">
          <input type="text" placeholder="Başlık" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 border rounded" />
          <input type="text" placeholder="Slug" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full p-2 border rounded" />
          <input type="text" placeholder="H1 Başlığı" value={formData.h1} onChange={e => setFormData({...formData, h1: e.target.value})} className="w-full p-2 border rounded" />
          <textarea placeholder="Açıklama" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded" />
          
          <div className="space-y-2">
            <label className="font-bold">SSS (JSON formatında: [q: "...", a: "..."])</label>
            <textarea placeholder='[{"q": "Soru", "a": "Cevap"}]' value={JSON.stringify(formData.faq || [])} onChange={e => {
              try { setFormData({...formData, faq: JSON.parse(e.target.value)}); } catch {}
            }} className="w-full p-2 border rounded font-mono text-sm" rows={3} />
          </div>

          <div className="space-y-2">
            <label className="font-bold">Ek Açıklamalar (JSON dizisi: ["...", "..."])</label>
            <textarea placeholder='["Açıklama 1", "Açıklama 2"]' value={JSON.stringify(formData.descriptions || [])} onChange={e => {
              try { setFormData({...formData, descriptions: JSON.parse(e.target.value)}); } catch {}
            }} className="w-full p-2 border rounded font-mono text-sm" rows={3} />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={() => setEditingPage(null)} className="px-4 py-2 bg-slate-200 rounded-lg">İptal</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Kaydet</button>
          </div>
        </form>
      ) : (
        <div className="grid gap-4">
          {seoPages.map((page: any) => (
            <div key={page.id} className="bg-white p-4 rounded-xl shadow flex justify-between items-center">
              <div>
                <h4 className="font-bold">{page.title}</h4>
                <p className="text-sm text-slate-500">/{page.slug}</p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => setEditingPage(page)} className="p-2 hover:bg-slate-100 rounded-lg"><Edit2 size={16} /></button>
                <button onClick={() => {
                  if (confirm("Silmek istediğinize emin misiniz?")) {
                    api.deleteSEOPage(page.id, storeId).then(() => fetchSeoPages());
                  }
                }} className="p-2 hover:bg-slate-100 rounded-lg text-rose-500"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
