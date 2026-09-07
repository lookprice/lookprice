import React from "react";
import { Palette, ImageIcon, Users, Plus, Upload } from "lucide-react";
import { WebContent, TeamMember } from "../../types/websiteGenerator";

interface BrandIdentityStepProps {
  lang: string;
  selectedTemplate: string;
  setSelectedTemplate: (t: string) => void;
  content: WebContent;
  setContent: (c: WebContent) => void;
  logoUrl: string;
  setLogoUrl: (u: string) => void;
  faviconUrl: string;
  setFaviconUrl: (u: string) => void;
  team: TeamMember[];
  setTeam: (t: TeamMember[] | ((prev: TeamMember[]) => TeamMember[])) => void;
}

export const BrandIdentityStep: React.FC<BrandIdentityStepProps> = ({
  lang,
  selectedTemplate,
  setSelectedTemplate,
  content,
  setContent,
  logoUrl,
  setLogoUrl,
  faviconUrl,
  setFaviconUrl,
  team,
  setTeam,
}) => {
  const isTr = lang === "tr";

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Palette className="h-4 w-4 text-indigo-500" />
          {isTr ? "MARKA KİMLİĞİ" : "BRAND IDENTITY"}
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {["modern", "classic", "dark", "minimal"].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTemplate(t)}
                className={`p-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedTemplate === t
                    ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200"
                    : "bg-slate-50 text-slate-400 border-slate-100"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={content.trustSlogan}
            onChange={(e) =>
              setContent({ ...content, trustSlogan: e.target.value })
            }
            placeholder={
              isTr
                ? 'Güven Sloganı (Örn: "10 Yıldır Güvenle")'
                : "Trust Slogan"
            }
            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-indigo-800 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
          />
          <input
            type="text"
            value={content.hero.title}
            onChange={(e) =>
              setContent({ ...content, hero: { ...content.hero, title: e.target.value } })
            }
            placeholder={isTr ? "Karşılama Başlığı" : "Hero Title"}
            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-indigo-800 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
          />
          <textarea
            value={content.hero.subtitle}
            onChange={(e) =>
              setContent({ ...content, hero: { ...content.hero, subtitle: e.target.value } })
            }
            placeholder={isTr ? "Karşılama Alt Metni" : "Hero Subtitle"}
            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-indigo-800 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
            rows={3}
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-indigo-500" />
          {isTr ? "LOGO & FAVICON" : "LOGO & FAVICON"}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              {isTr ? "Firma Logosu (Navigasyon)" : "Company Logo"}
            </label>
            <div className="flex gap-4 items-center">
              <div className="h-16 w-32 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} className="h-full w-full object-contain p-2" alt="Logo" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-slate-300" />
                )}
              </div>
              <label className="px-4 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors border border-slate-200">
                {isTr ? "LOGO DEĞİŞTİR" : "CHANGE LOGO"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (uploadEvent) => setLogoUrl(uploadEvent.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              {isTr ? "Seçme Simgesi (Favicon)" : "Favicon"}
            </label>
            <div className="flex gap-4 items-center">
              <div className="h-10 w-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                {faviconUrl ? (
                  <img src={faviconUrl} className="h-full w-full object-cover" alt="Favicon" />
                ) : (
                  <ImageIcon className="h-4 w-4 text-slate-300" />
                )}
              </div>
              <label className="px-4 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors border border-slate-200">
                {isTr ? "FAVICON SEÇ" : "SELECT FAVICON"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (uploadEvent) => setFaviconUrl(uploadEvent.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-500" />
          {isTr ? "EKİP KADROSU & DANIŞMANLAR" : "TEAM & AGENTS"}
        </h3>
        <div className="space-y-4">
          {team.map((member) => (
            <div key={member.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="relative group h-12 w-12 bg-slate-200 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                  <img src={member.image || member.image_url || "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400"} className="h-full w-full object-cover" alt={member.name} />
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all">
                    <Upload className="h-4 w-4 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (uploadEvent) => {
                            const base64 = uploadEvent.target?.result as string;
                            setTeam((prev) => prev.map((m) => m.id === member.id ? { ...m, image: base64, image_url: base64 } : m));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-900 uppercase">{member.name || (isTr ? "Yeni Üye" : "New Agent")}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{member.role || "Unvan"}</p>
                </div>
                <button
                  onClick={() => setTeam((prev) => prev.filter((m) => m.id !== member.id))}
                  className="text-[10px] font-black text-red-500 hover:text-red-700 transition-colors uppercase tracking-widest bg-red-50 px-2 py-1 rounded-md"
                >
                  {isTr ? "SİL" : "DEL"}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-150-none">
                <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">{isTr ? "AD SOYAD" : "FULL NAME"}</label>
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => setTeam((prev) => prev.map((m) => m.id === member.id ? { ...m, name: e.target.value } : m))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">{isTr ? "UNVAN / ROL" : "POSITION / ROLE"}</label>
                  <input
                    type="text"
                    value={member.role}
                    onChange={(e) => setTeam((prev) => prev.map((m) => m.id === member.id ? { ...m, role: e.target.value } : m))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              setTeam((prev) => [
                ...prev,
                {
                  id: Math.random().toString(36).substr(2, 9),
                  name: "Yeni Danışman",
                  role: "Satış Temsilcisi",
                  image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400",
                },
              ]);
            }}
            className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-black text-slate-400 flex items-center justify-center gap-2 hover:border-indigo-300 hover:text-indigo-500 transition-all uppercase tracking-widest"
          >
            <Plus className="h-3 w-3" />
            {isTr ? "YÖNETİCİ EKLE" : "ADD LEADER"}
          </button>
        </div>
      </div>
    </div>
  );
};
