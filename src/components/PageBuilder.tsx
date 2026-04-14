import React from "react";
import { GripVertical, Trash2, Edit3, Plus } from "lucide-react";

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

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        {(['hero', 'featured', 'blog', 'about', 'contact'] as const).map(type => (
          <button
            key={type}
            onClick={() => addSection(type)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-100"
          >
            <Plus className="h-4 w-4" /> {type.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {layout.map((section, index) => (
          <div key={section.id} className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <GripVertical className="h-5 w-5 text-slate-400 cursor-move" />
            <div className="flex-1">
              <span className="font-bold text-slate-900">{section.title}</span>
              <span className="ml-2 text-xs text-slate-500 uppercase">{section.type}</span>
            </div>
            <button onClick={() => removeSection(section.id)} className="text-red-500 hover:text-red-700">
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
