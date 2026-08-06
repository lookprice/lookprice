import React, { useState, useEffect } from "react";
import { 
  Video, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Search, 
  Filter, 
  Youtube, 
  Sparkles,
  RefreshCw,
  Clock,
  Link
} from "lucide-react";
import { api } from "../../services/api";
import { EnrakipsizVideo } from "../../types/superadmin";

interface SuperAdminVideosManagerProps {
  lang: string;
}

export function SuperAdminVideosManager({ lang }: SuperAdminVideosManagerProps) {
  const [videos, setVideos] = useState<EnrakipsizVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageFilter, setPageFilter] = useState<string>("all");
  
  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<EnrakipsizVideo | null>(null);
  const [formData, setFormData] = useState<Partial<EnrakipsizVideo>>({
    product_key: "shoplp",
    page_type: "lookprice_net",
    title: "",
    description: "",
    youtube_id: "",
    duration: "",
    cover_img: "",
    is_live: true,
    order_index: 0
  });

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminVideos();
      if (res && !res.error) {
        setVideos(res);
      }
    } catch (err) {
      console.error("Failed to fetch videos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleOpenAdd = () => {
    setEditingVideo(null);
    setFormData({
      product_key: "shoplp",
      page_type: "lookprice_net",
      title: "",
      description: "",
      youtube_id: "",
      duration: "1:30",
      cover_img: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
      is_live: true,
      order_index: (videos.length ? Math.max(...videos.map(v => v.order_index || 0)) + 1 : 0)
    });
    setShowModal(true);
  };

  const handleOpenEdit = (video: EnrakipsizVideo) => {
    setEditingVideo(video);
    setFormData({
      ...video,
      youtube_id: video.youtube_id || ""
    });
    setShowModal(true);
  };

  // Extract YouTube ID from paste
  const extractYoutubeId = (urlOrId: string): string => {
    if (!urlOrId) return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = urlOrId.match(regExp);
    return (match && match[2].length === 11) ? match[2] : urlOrId;
  };

  const handleYoutubeIdChange = (val: string) => {
    const extracted = extractYoutubeId(val);
    setFormData(prev => ({ ...prev, youtube_id: extracted }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.product_key || !formData.page_type) {
      alert(lang === "tr" ? "Lütfen zorunlu alanları doldurun." : "Please fill required fields.");
      return;
    }

    try {
      const payload = {
        ...formData,
        id: editingVideo?.id,
        youtube_id: formData.youtube_id || null,
        order_index: Number(formData.order_index || 0)
      };

      const res = await api.saveAdminVideo(payload);
      if (res && !res.error) {
        alert(lang === "tr" ? "Video başarıyla kaydedildi!" : "Video saved successfully!");
        setShowModal(false);
        fetchVideos();
      } else {
        alert(res?.error || "Error saving video");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    }
  };

  const handleDelete = async (id: number) => {
    const confirmMsg = lang === "tr" 
      ? "Bu videoyu silmek istediğinize emin misiniz?" 
      : "Are you sure you want to delete this video?";
    if (!confirm(confirmMsg)) return;

    try {
      const res = await api.deleteAdminVideo(id);
      if (res && !res.error) {
        alert(lang === "tr" ? "Video silindi!" : "Video deleted!");
        fetchVideos();
      } else {
        alert(res?.error || "Error deleting video");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    }
  };

  // Filter & Search
  const filteredVideos = videos.filter(video => {
    const matchesSearch = 
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (video.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.product_key.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPage = pageFilter === "all" || video.page_type === pageFilter;

    return matchesSearch && matchesPage;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Intro Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800 shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
            <Video className="h-5 w-5" />
            <span className="text-xs uppercase tracking-wider">MEDYA KONTROL ODASI</span>
          </div>
          <h2 className="text-xl font-black">lookprice.net & Sektörel Video Yönetimi</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Ana sayfa (lookprice.net) ürün kartlarındaki tanıtım videolarını ve her bir sektörel ürün sayfasındaki (HoReCaLP, AutoLP vb.) detaylı video turlarını buradan güncelleyin.
          </p>
        </div>
        <div>
          <button
            onClick={handleOpenAdd}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg"
          >
            <Plus className="h-4 w-4" /> Yeni Video Ekle
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </span>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
            placeholder="Başlık, açıklama veya anahtar kelime ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <Filter className="h-4 w-4 text-gray-400 shrink-0" />
          <select
            className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs w-full md:w-56"
            value={pageFilter}
            onChange={(e) => setPageFilter(e.target.value)}
          >
            <option value="all">Tüm Sayfalar</option>
            <option value="lookprice_net">lookprice.net Ana Sayfa</option>
            <option value="horecalp">HoReCaLP (Restoran) Sayfası</option>
            <option value="shoplp">ShopLP (Mağaza) Sayfası</option>
            <option value="autolp">AutoLP (Otomotiv) Sayfası</option>
            <option value="restatelp">RestateLP (Emlak) Sayfası</option>
          </select>

          <button
            onClick={fetchVideos}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
            title="Yenile"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid of Videos */}
      {loading ? (
        <div className="py-24 text-center text-sm font-bold text-gray-400 animate-pulse flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
          Videolar Yükleniyor...
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="py-16 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl">
          <Video className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-550 font-bold">Aranan kriterlere uygun hiç video bulunamadı.</p>
          <p className="text-xs text-gray-400 mt-1">Filtreleri değiştirmeyi deneyebilir veya yeni bir video ekleyebilirsiniz.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className={`bg-white rounded-2xl border ${
                video.is_live ? "border-gray-150" : "border-amber-200 bg-amber-50/10"
              } shadow-sm overflow-hidden flex flex-col h-full`}
            >
              {/* Cover Image Preview */}
              <div className="aspect-video bg-slate-950 relative overflow-hidden group">
                <img
                  src={video.cover_img || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80"}
                  alt={video.title}
                  className="w-full h-full object-cover opacity-80"
                />
                
                {/* Overlay Badge */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-slate-900/90 text-white border border-white/10 shadow-md">
                    {video.page_type === "lookprice_net" ? "lookprice.net" : `${video.page_type.toUpperCase()} SAYFASI`}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-indigo-600 text-white">
                    {video.product_key.toUpperCase()}
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                    video.is_live 
                      ? "bg-emerald-500 text-white" 
                      : "bg-amber-500 text-white"
                  }`}>
                    {video.is_live ? "YAYINDA" : "YAKINDA / TASLAK"}
                  </span>
                </div>

                {video.youtube_id ? (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:scale-110 transition-transform duration-300">
                    <div className="h-12 w-12 bg-red-600 rounded-full flex items-center justify-center text-white shadow-2xl">
                      <Youtube className="h-6 w-6 fill-current" />
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-[10px] font-black tracking-widest text-white bg-black/60 px-3 py-1.5 rounded-full border border-white/15">YOUTUBE ID YOK</span>
                  </div>
                )}

                {video.duration && (
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white">
                    {video.duration}
                  </div>
                )}
              </div>

              {/* Content Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-sm font-black text-gray-900 line-clamp-1">{video.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">{video.description || "Açıklama girilmemiş."}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
                  <div className="text-[10px] text-gray-400 font-bold">
                    Sıralama: <span className="text-gray-700">{video.order_index}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(video)}
                      className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-all"
                      title="Düzenle"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => video.id && handleDelete(video.id)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-100 transition-all"
                      title="Sil"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-150 max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                <h3 className="text-md font-bold">{editingVideo ? "Videoyu Düzenle" : "Yeni Video Ekle"}</h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white transition-all text-xs font-bold"
              >
                Kapat
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Row 1: Target Page and Product Key */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Görüneceği Web Sayfası*</label>
                  <select
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    value={formData.page_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, page_type: e.target.value }))}
                    required
                  >
                    <option value="lookprice_net">lookprice.net Ana Sayfa</option>
                    <option value="horecalp">HoReCaLP (Restoran)</option>
                    <option value="shoplp">ShopLP (Mağaza)</option>
                    <option value="autolp">AutoLP (Otomotiv)</option>
                    <option value="restatelp">RestateLP (Emlak)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Ürün / Tab Anahtarı*</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    placeholder="shoplp, autolp, qr_menu vb."
                    value={formData.product_key || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, product_key: e.target.value }))}
                    required
                  />
                  <span className="text-[9px] text-gray-400 mt-0.5 block leading-tight">
                    Home için: shoplp, autolp, restatelp, horecalp. Ürün iç tabı için: pos, qr_menu vb.
                  </span>
                </div>
              </div>

              {/* Row 2: Title */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Video Başlığı*</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  placeholder="Adisyon & Hızlı POS"
                  value={formData.title || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              {/* Row 3: Description */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Tanıtım Açıklaması</label>
                <textarea
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs h-20 resize-none"
                  placeholder="Videoyu ve sağladığı kolaylıkları anlatan kısa metin..."
                  value={formData.description || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {/* Row 4: YouTube URL or ID Extractor */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <Youtube className="w-3.5 h-3.5 text-red-500" /> YouTube Video ID veya Linki
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs"
                  placeholder="https://www.youtube.com/watch?v=... veya bdbXezbS35c"
                  onChange={(e) => handleYoutubeIdChange(e.target.value)}
                  defaultValue={formData.youtube_id || ""}
                />
                <div className="flex justify-between items-center mt-1.5">
                  <span className="text-[9px] text-gray-400 block">Link yapıştırdığınızda ID otomatik çözümlenir.</span>
                  {formData.youtube_id && (
                    <span className="text-[9px] bg-red-100 text-red-600 font-black px-1.5 py-0.5 rounded">
                      ID: {formData.youtube_id}
                    </span>
                  )}
                </div>
              </div>

              {/* Row 5: Cover Image & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Kapak Resim Linki (URL)</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    placeholder="https://..."
                    value={formData.cover_img || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, cover_img: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Süre / Etiket</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    placeholder="1:24 veya Yakında"
                    value={formData.duration || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  />
                </div>
              </div>

              {/* Row 6: Live Status & Sort Order */}
              <div className="grid grid-cols-2 gap-4 items-center pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_live"
                    className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                    checked={!!formData.is_live}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_live: e.target.checked }))}
                  />
                  <label htmlFor="is_live" className="text-xs font-bold text-gray-700 cursor-pointer select-none">
                    Video Yayında (Aktif)
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Sıralama İndeksi</label>
                  <input
                    type="number"
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    value={formData.order_index ?? 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, order_index: Number(e.target.value) }))}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-6 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
