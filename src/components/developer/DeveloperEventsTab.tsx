import React from "react";
import {
  Plus,
  X,
  Loader2,
  Image as ImageIcon,
  Video,
  Edit3,
  Trash2,
  Play
} from "lucide-react";
import {
  getSectionBandTheme,
  getYouTubeThumbnailUrl,
  isYouTubeUrl,
  resolveDisplayImageUrl
} from "./developerProjectUtils";

export interface EventFormState {
  title: string;
  event_type: string;
  project_name: string;
  event_date: string;
  location: string;
  target_regions: string;
  media_preview_url: string;
  cover_image: string;
  video_url: string;
  media_gallery: Array<{ id: string; name: string; url: string; type: "image" | "video" }>;
  max_capacity: number;
  description: string;
}

interface DeveloperEventsTabProps {
  events: any[];
  projects: any[];
  isNewEventOpen: boolean;
  setIsNewEventOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editingEventId: number | null;
  setEditingEventId: React.Dispatch<React.SetStateAction<number | null>>;
  newEventForm: EventFormState;
  setNewEventForm: React.Dispatch<React.SetStateAction<EventFormState>>;
  uploadingEventMedia: boolean;
  eventImageInputRef: React.RefObject<HTMLInputElement | null>;
  eventVideoInputRef: React.RefObject<HTMLInputElement | null>;
  onEventMediaUpload: (e: React.ChangeEvent<HTMLInputElement>, mediaKind: "image" | "video") => void;
  onSaveEvent: (e: React.FormEvent) => void;
  onOpenEditEvent: (ev: any) => void;
  onDeleteEvent: (eventId: number) => void;
  onPreviewAsset: (asset: any) => void;
}

export const DeveloperEventsTab: React.FC<DeveloperEventsTabProps> = ({
  events,
  projects,
  isNewEventOpen,
  setIsNewEventOpen,
  editingEventId,
  setEditingEventId,
  newEventForm,
  setNewEventForm,
  uploadingEventMedia,
  eventImageInputRef,
  eventVideoInputRef,
  onEventMediaUpload,
  onSaveEvent,
  onOpenEditEvent,
  onDeleteEvent,
  onPreviewAsset
}) => {
  return (
    <div className="space-y-3">
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">
            Etkinlik, Lansman & PR Medya Arşivi ({events.length})
          </h3>
          <p className="text-[11px] text-slate-500">
            Lansman geceleri, yatırımcı gezileri ve etkinlikler için bilgisayar veya mobilden fotoğraf ve video yükleyin.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingEventId(null);
            setNewEventForm({
              title: "",
              event_type: "launch_party",
              project_name: projects[0]?.name || "Mykonos Homes",
              event_date: "2026-07-10 19:30",
              location: "Esentepe Sahil — Satış & Lansman Merkezi, KKTC",
              target_regions: "Yönetim, Satış ve PR Ekibi",
              media_preview_url: "",
              cover_image: "",
              video_url: "",
              media_gallery: [],
              max_capacity: 200,
              description: ""
            });
            setIsNewEventOpen((prev) => !prev);
          }}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Yeni Etkinlik Oluştur</span>
        </button>
      </div>

      {/* CENTERED VIEWPORT-FIT MODAL FOR EVENT CREATION & MEDIA UPLOAD/EDIT */}
      {isNewEventOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3"
          onClick={() => {
            setIsNewEventOpen(false);
            setEditingEventId(null);
          }}
        >
          <form
            onSubmit={onSaveEvent}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl p-4 bg-white text-slate-900 rounded-2xl border-2 border-indigo-500 shadow-2xl space-y-3 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div>
                <span className="text-[10px] font-mono font-semibold uppercase text-indigo-700">
                  ETKİNLİK & LANSMAN MEDYA YÖNETİM PENCERESİ
                </span>
                <h4 className="text-sm font-semibold text-slate-950">
                  {editingEventId
                    ? `Etkinlik & Medya Düzenle: ${newEventForm.title}`
                    : "Yeni Etkinlik / Lansman Oluştur (Resim & Video Destekli)"}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsNewEventOpen(false);
                  setEditingEventId(null);
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Kapat</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="sm:col-span-2">
                <label className="block text-[10px] text-slate-700 uppercase font-medium mb-1">
                  Etkinlik / Lansman Başlığı *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Mykonos Homes Yaz Lansmanı & Gala Gecesi"
                  value={newEventForm.title}
                  onChange={(e) => setNewEventForm({ ...newEventForm, title: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-700 uppercase font-medium mb-1">
                  İlgili Proje
                </label>
                <select
                  value={newEventForm.project_name}
                  onChange={(e) => setNewEventForm({ ...newEventForm, project_name: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-indigo-50/60 border border-indigo-300 rounded-lg text-xs text-slate-900 font-medium"
                >
                  <option value="Tüm Projeler">Tüm Projeler</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-700 uppercase font-medium mb-1">
                  Tarih & Saat
                </label>
                <input
                  type="text"
                  placeholder="2026-07-10 19:30"
                  value={newEventForm.event_date}
                  onChange={(e) => setNewEventForm({ ...newEventForm, event_date: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-700 uppercase font-medium mb-1">
                  Konum / Mekan
                </label>
                <input
                  type="text"
                  placeholder="Esentepe Sahil Satış Ofisi"
                  value={newEventForm.location}
                  onChange={(e) => setNewEventForm({ ...newEventForm, location: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-700 uppercase font-medium mb-1">
                  Etkinlik Açıklaması
                </label>
                <input
                  type="text"
                  placeholder="Kısa açıklama / program özeti"
                  value={newEventForm.description}
                  onChange={(e) => setNewEventForm({ ...newEventForm, description: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>
            </div>

            {/* IMAGE & VIDEO UPLOAD CONTROLS FOR EVENT */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <label className="block text-[10px] text-slate-700 uppercase font-medium mb-1">
                  Fotoğraf / Görsel Ekle (Cihazdan)
                </label>
                <input
                  ref={eventImageInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => onEventMediaUpload(e, "image")}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => eventImageInputRef.current?.click()}
                  disabled={uploadingEventMedia}
                  className="w-full px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {uploadingEventMedia ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5" />
                  )}
                  <span>+ Resim Yükle</span>
                </button>
              </div>

              <div>
                <label className="block text-[10px] text-slate-700 uppercase font-medium mb-1">
                  Lansman Videosu Ekle (Cihazdan)
                </label>
                <input
                  ref={eventVideoInputRef}
                  type="file"
                  multiple
                  accept="video/*,.mp4,.mov,.webm"
                  onChange={(e) => onEventMediaUpload(e, "video")}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => eventVideoInputRef.current?.click()}
                  disabled={uploadingEventMedia}
                  className="w-full px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {uploadingEventMedia ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Video className="w-3.5 h-3.5" />
                  )}
                  <span>+ Video Yükle (MP4/MOV)</span>
                </button>
              </div>

              <div>
                <label className="block text-[10px] text-slate-700 uppercase font-medium mb-1">
                  Harici Video / YouTube Linki
                </label>
                <input
                  type="text"
                  placeholder="YouTube video veya görsel URL yapıştırın"
                  value={newEventForm.video_url || newEventForm.cover_image}
                  onChange={(e) =>
                    setNewEventForm({
                      ...newEventForm,
                      video_url: e.target.value,
                      media_preview_url: e.target.value
                    })
                  }
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>
            </div>

            {newEventForm.media_gallery.length > 0 && (
              <div className="space-y-1.5 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-200">
                <div className="text-[10px] font-semibold text-indigo-950 uppercase">
                  Eklenen Etkinlik Medyaları ({newEventForm.media_gallery.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {newEventForm.media_gallery.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-medium"
                    >
                      {item.type === "video" ? (
                        <Video className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span className="truncate max-w-[180px]">{item.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setNewEventForm((prev) => ({
                            ...prev,
                            media_gallery: prev.media_gallery.filter((m) => m.id !== item.id)
                          }))
                        }
                        className="text-slate-400 hover:text-rose-600 cursor-pointer flex items-center"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setIsNewEventOpen(false);
                  setEditingEventId(null);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={uploadingEventMedia}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0 whitespace-nowrap"
              >
                Kaydet & Güncelle
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EVENTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {events.map((ev, evIdx) => {
          const evTheme = getSectionBandTheme(evIdx);
          const gallery: any[] = Array.isArray(ev.media_gallery) ? ev.media_gallery : [];
          const matchedProj = projects.find((p) =>
            ev.project_name?.toLowerCase().includes(p.name?.toLowerCase())
          );
          const videoUrl =
            ev.video_url ||
            gallery.find((m: any) => m.type === "video" || isYouTubeUrl(m.url))?.url ||
            (ev.media_preview_url?.startsWith("/api/storage/") ||
            ev.media_preview_url?.startsWith("http")
              ? ev.media_preview_url
              : "https://drive.google.com/file/d/1S-voP7vN7ciN52agBq4iuWHSoP0yfRCW/view");
          const coverImg =
            resolveDisplayImageUrl(ev.cover_image, "") ||
            resolveDisplayImageUrl(gallery.find((m: any) => m.type === "image")?.url, "") ||
            getYouTubeThumbnailUrl(videoUrl) ||
            resolveDisplayImageUrl(matchedProj?.cover_image, "") ||
            resolveDisplayImageUrl(projects[0]?.cover_image, "");

          return (
            <div
              key={ev.id}
              className={`border border-l-4 rounded-xl overflow-hidden shadow-2xs flex flex-col justify-between ${evTheme.cardBg}`}
            >
              <div>
                <div className="relative h-36 w-full bg-slate-100 overflow-hidden">
                  {coverImg && (
                    <img src={coverImg} alt={ev.title} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1">
                    <span className="px-2 py-0.5 bg-white/95 text-slate-950 rounded text-[10px] font-medium truncate">
                      {ev.project_name}
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-mono font-medium shrink-0">
                      {ev.event_date}
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-white/90 text-slate-950 text-[10px] font-medium flex items-center gap-1">
                      <Video className="w-3 h-3 text-indigo-600" />
                      <span>
                        {gallery.length > 0
                          ? `${gallery.length} Medya (Resim & Video)`
                          : ev.media_preview_url || "Lansman Medyası"}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="p-3 space-y-1.5">
                  <h4 className="text-sm font-semibold text-slate-950 leading-snug">{ev.title}</h4>
                  <p className="text-[11px] text-slate-600">{ev.description}</p>
                  <div className="text-[10px] text-slate-700 bg-white/90 p-2 rounded-lg border border-slate-200/80">
                    <strong>Konum:</strong> {ev.location}
                  </div>
                </div>
              </div>

              <div
                className={`px-3 py-2 border-t flex items-center justify-between gap-1.5 ${evTheme.footerBg}`}
              >
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onOpenEditEvent(ev)}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-[10px] font-medium cursor-pointer flex items-center gap-1 whitespace-nowrap"
                  >
                    <Edit3 className="w-3 h-3 text-indigo-600" />
                    <span>Medya Ekle / Düzenle</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteEvent(ev.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="Etkinliği Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onPreviewAsset({
                      name: ev.title,
                      category: "Etkinlik & Lansman Medyası",
                      type: "video",
                      url: videoUrl,
                      cover: coverImg,
                      gallery,
                      projectName: ev.project_name
                    })
                  }
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-medium cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap"
                >
                  <Play className="w-3 h-3" />
                  <span>Medyayı Aç</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
