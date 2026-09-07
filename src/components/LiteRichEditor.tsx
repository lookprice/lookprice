import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, Italic, Underline, List, ListOrdered, Link, RemoveFormatting 
} from 'lucide-react';

interface LiteRichEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export const LiteRichEditor: React.FC<LiteRichEditorProps> = ({
  value,
  onChange,
  placeholder = "İçeriğinizi buraya yazın...",
  minHeight = "200px"
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Synchronize internal div content with incoming value prop without clearing selection/cursor
  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html === '<br>' ? '' : html);
    }
  };

  const execCommand = (command: string, arg: string = '') => {
    document.execCommand(command, false, arg);
    handleInput();
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500">
      {/* Dynamic Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-100 select-none">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded transition-colors"
          title="Kalın"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded transition-colors"
          title="İtalik"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded transition-colors"
          title="Altı Çizili"
        >
          <Underline className="w-4 h-4" />
        </button>
        
        <div className="w-px h-4 bg-slate-200 mx-1" />
        
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded transition-colors"
          title="Maddeli Liste"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className="p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded transition-colors"
          title="Numaralı Liste"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-200 mx-1" />

        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<h1>')}
          className="px-2 py-1 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded transition-colors text-xs font-bold"
          title="Başlık 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<h2>')}
          className="px-2 py-1 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded transition-colors text-xs font-bold"
          title="Başlık 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<p>')}
          className="px-2 py-1 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded transition-colors text-xs font-bold"
          title="Paragraf"
        >
          P
        </button>

        <div className="w-px h-4 bg-slate-200 mx-1" />

        <button
          type="button"
          onClick={() => {
            const url = prompt('Bağlantı adresini girin (URL):', 'https://');
            if (url && url !== 'https://') {
              execCommand('createLink', url);
            }
          }}
          className="p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded transition-colors"
          title="Bağlantı Ekle"
        >
          <Link className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('removeFormat')}
          className="p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded transition-colors"
          title="Formatı Temizle"
        >
          <RemoveFormatting className="w-4 h-4" />
        </button>
      </div>

      {/* Editing Stage */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="p-4 outline-none text-slate-800 bg-white min-h-[150px] overflow-y-auto overflow-x-hidden text-sm"
          style={{ minHeight }}
        />
        {!value && !isFocused && (
          <div className="absolute top-4 left-4 text-slate-400 pointer-events-none text-sm select-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
};
