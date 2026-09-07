import React from "react";
import { GripVertical, Trash2, Edit3, Plus, Info } from "lucide-react";

interface LayoutSection {
  id: string;
  type: 'hero' | 'featured' | 'blog' | 'about' | 'contact';
  title: string;
  data: any;
}

interface PageBuilderProps {
  layout: LayoutSection[];
  onUpdateLayout: (newLayout: LayoutSection[]) => void;
}

export const PageBuilder: React.FC<PageBuilderProps> = ({ layout, onUpdateLayout }) => {
  const addSection = (type: LayoutSection['type']) => {
    const newSection: LayoutSection = {
      id: Date.now().toString(),
      type,
      title: type.toUpperCase(),
      data: {}
    };
    onUpdateLayout([...layout, newSection]);
  };

  const removeSection = (id: string) => {
    onUpdateLayout(layout.filter(s => s.id !== id));
  };

  const getSectionDescription = (type: string) => {
    switch (type) {
      case 'hero': return "Mağaza vitrininin en üstünde yer alan büyük görsel ve başlık alanı. İçeriğini 'Genel Görünüm' sekmesinden (Hero Başlık/Alt Başlık) değiştirebilirsiniz.";
      case 'featured': return "Öne çıkan ürünlerinizi listeler. Ürünleri 'Ürünler' sekmesinden öne çıkan olarak işaretleyebilirsiniz.";
      case 'blog': return "Blog yazılarınızı listeler. Yazıları 'Blog' sekmesinden ekleyebilirsiniz.";
      case 'about': return "Hakkımızda metnini gösterir. İçeriğini 'Genel Görünüm' sekmesinden (Hakkımızda Metni) değiştirebilirsiniz.";
      case 'contact': return "İletişim bilgilerinizi gösterir. İçeriğini 'Mağaza Profili' sekmesindeki adres ve telefon bilgilerinden alır.";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm flex items-start gap-3">
        <Info className="w-5 h-5 shrink-0 mt-0.5" />
        <p>
          Bu alan mağazanızın ana sayfa dizilimini belirler. İstediğiniz blokları ekleyebilir, sürükleyip bırakarak sıralarını değiştirebilirsiniz. 
          <strong> Not:</strong> Bu blokların içerikleri (yazılar, resimler) "Genel Görünüm" veya "Mağaza Profili" gibi diğer sekmelerden beslenir.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(['hero', 'featured', 'blog', 'about', 'contact'] as const).map(type => (
          <button
            key={type}
            onClick={() => addSection(type)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors"
          >
            <Plus className="h-4 w-4" /> {type.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {layout.map((section, index) => (
          <div key={section.id} className="flex items-start gap-4 p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-300 transition-colors">
            <GripVertical className="h-5 w-5 text-slate-400 cursor-move mt-1" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-black text-slate-900">{section.title}</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] uppercase font-bold tracking-wider">{section.type}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {getSectionDescription(section.type)}
              </p>
            </div>
            <button onClick={() => removeSection(section.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
        {layout.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <p className="text-slate-500 text-sm font-medium">Henüz sayfa düzenine bir blok eklemediniz.<br/>Yukarıdaki butonları kullanarak başlayabilirsiniz.</p>
          </div>
        )}
      </div>
    </div>
  );
};
