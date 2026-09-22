import React from "react";
import { 
  Sparkles, 
  Flame, 
  Star, 
  Award, 
  Crown, 
  Clock, 
  Tag, 
  Check, 
  Plus, 
  X 
} from "lucide-react";
import { BOOKSTORE_BADGES } from "@/data/bookstoreBadges";

interface BookstoreBadgePopoverProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onToggleBadge: (e: React.MouseEvent, p: any, badgeId: string) => void;
  hasProductBadge: (p: any, badgeId: string) => boolean;
  lang: string;
}

export const BookstoreBadgePopover: React.FC<BookstoreBadgePopoverProps> = ({
  product,
  isOpen,
  onClose,
  onToggleBadge,
  hasProductBadge,
  lang,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="absolute left-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-left"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-600" />
          <span>{lang === 'tr' ? "Vitrin Izgara Rozetleri" : "Showcase Badges"}</span>
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-1 max-h-56 overflow-y-auto">
        {BOOKSTORE_BADGES.map((b) => {
          const active = hasProductBadge(product, b.id);
          const IconComp = 
            b.iconName === 'Flame' ? Flame :
            b.iconName === 'Sparkles' ? Sparkles :
            b.iconName === 'Star' ? Star :
            b.iconName === 'Award' ? Award :
            b.iconName === 'Crown' ? Crown :
            b.iconName === 'Clock' ? Clock : Tag;
          return (
            <button
              key={`popover-badge-${product.id}-${b.id}`}
              type="button"
              onClick={(e) => onToggleBadge(e, product, b.id)}
              className={`w-full px-2 py-1 rounded-lg text-[10px] font-bold flex items-center justify-between transition-all border cursor-pointer select-none text-left ${
                active 
                  ? `${b.badgeBgClass} border-transparent shadow-xs` 
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <IconComp className={`w-3 h-3 shrink-0 ${active ? "text-current" : b.textClass}`} />
                <span className="truncate">{lang === 'tr' ? b.labelTr : b.labelEn}</span>
              </div>
              {active ? (
                <Check className="w-3 h-3 shrink-0" />
              ) : (
                <Plus className="w-3 h-3 shrink-0 opacity-50" />
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[9px] text-slate-400 mt-1.5 pt-1 border-t border-slate-100 leading-tight">
        {lang === 'tr' ? "İşaretlenen kitap anında web sitesindeki ilgili vitrin ızgarasında gösterilir." : "Books appear instantly in the selected showcase row."}
      </p>
    </div>
  );
};
