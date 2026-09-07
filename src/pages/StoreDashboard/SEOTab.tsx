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
  const [faqText, setFaqText] = useState("");
  const [descText, setDescText] = useState("");

  useEffect(() => {
    fetchSeoPages();
  }, [storeId]);

  useEffect(() => {
    if (editingPage) {
      setFormData(editingPage);
      setFaqText(JSON.stringify(editingPage.faq || [], null, 2));
      setDescText(JSON.stringify(editingPage.descriptions || [], null, 2));
    } else {
      setFormData({ title: '', slug: '', h1: '', description: '', faq: [], descriptions: [] });
      setFaqText("[]");
      setDescText("[]");
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
      let finalFaq = formData.faq;
      let finalDescs = formData.descriptions;

      try {
        finalFaq = JSON.parse(faqText);
      } catch (err) {
        toast.error("SSS alanı geçerli bir JSON değil!");
        return;
      }

      try {
        finalDescs = JSON.parse(descText);
      } catch (err) {
        toast.error("Ek Açıklamalar alanı geçerli bir JSON değil!");
        return;
      }

      const submissionData = {
        ...formData,
        faq: finalFaq,
        descriptions: finalDescs
      };

      if (formData.id) {
        await api.updateSEOPage(formData.id, submissionData, storeId);
        toast.success("SEO sayfası güncellendi");
      } else {
        await api.addSEOPage(submissionData, storeId);
        toast.success("SEO sayfası eklendi");
      }
      setEditingPage(null);
      fetchSeoPages();
    } catch (error) {
      toast.error("Kaydetme işlemi başarısız oldu");
    }
  };

  const generateDrafts = async () => {
    const loadingToast = toast.loading("Taslaklar oluşturuluyor...");
    try {
      const [pagesRes, productsRes] = await Promise.all([
        api.getSEOPages(storeId),
        api.getProducts("", storeId)
      ]);
      
      const pages = pagesRes.data || pagesRes;
      const products = productsRes.data || productsRes;
      
      const existingSlugs = new Set(pages.map((p: any) => p.slug));
      
      // Real Estate and Automotive are portfolios
      const portfolios = products.filter((p: any) => p.type === "real_estate" || p.type === "vehicle");
      const draftsToCreate = portfolios.filter((p: any) => !existingSlugs.has(p.slug));
      
      if (draftsToCreate.length === 0) {
        toast.dismiss(loadingToast);
        toast.info("Tüm portföyler için zaten SEO sayfası mevcut.");
        return;
      }
      
      // Create drafts sequentially to avoid overwhelming the server
      for (const p of draftsToCreate) {
        const draft = {
          title: p.name || p.title,
          slug: p.slug || `portfolio-${p.id}`,
          h1: p.name || p.title,
          description: p.description?.substring(0, 160) || `${p.name || p.title} portföyü hakkında detaylı bilgi.`,
          faq: [
            { q: "Fiyatı nedir?", a: `Bu portföyün fiyatı ve detayları için bizimle iletişime geçebilirsiniz.` },
            { q: "Konumu neresidir?", a: `${p.location || 'Kuzey Kıbrıs'} bölgesinde yer almaktadır.` }
          ],
          descriptions: [
            p.description || "Detaylı açıklama eklenmemiş.",
            `Referans No: ${p.reference_no || 'Belirtilmemiş'}`
          ]
        };
        await api.addSEOPage(draft, storeId);
      }
      
      toast.dismiss(loadingToast);
      toast.success(`${draftsToCreate.length} adet taslak SEO sayfası oluşturuldu.`);
      fetchSeoPages();
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error(error);
      toast.error("Taslaklar oluşturulurken hata oluştu");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">SEO Sayfaları</h3>
        <div className="flex gap-2">
          <button 
            onClick={generateDrafts} 
            className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-slate-50 transition-colors"
          >
            <Plus size={16} />
            <span>Portföylerden Taslak Oluştur</span>
          </button>
          <button onClick={() => setEditingPage({})} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <Plus size={16} />
            <span>Yeni Sayfa</span>
          </button>
        </div>
      </div>
      
      {editingPage ? (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Başlık" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 border rounded" />
            <input type="text" placeholder="Slug" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full p-2 border rounded" />
          </div>
          <input type="text" placeholder="H1 Başlığı" value={formData.h1} onChange={e => setFormData({...formData, h1: e.target.value})} className="w-full p-2 border rounded" />
          <textarea placeholder="Açıklama" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded" rows={2} />
          
          <div className="space-y-2">
            <label className="font-bold text-sm text-slate-600">SSS (JSON formatında: {"[{\"q\": \"...\", \"a\": \"...\"}]"})</label>
            <textarea 
              placeholder='[{"q": "Soru", "a": "Cevap"}]' 
              value={faqText} 
              onChange={e => setFaqText(e.target.value)} 
              className="w-full p-2 border rounded font-mono text-sm bg-slate-50" 
              rows={4} 
            />
          </div>

          <div className="space-y-2">
            <label className="font-bold text-sm text-slate-600">Ek Açıklamalar (JSON dizisi: ["...", "..."])</label>
            <textarea 
              placeholder='["Açıklama 1", "Açıklama 2"]' 
              value={descText} 
              onChange={e => setDescText(e.target.value)} 
              className="w-full p-2 border rounded font-mono text-sm bg-slate-50" 
              rows={4} 
            />
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
