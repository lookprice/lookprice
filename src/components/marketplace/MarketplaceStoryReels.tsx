import React from "react";
import { Play, Flame, ExternalLink, X } from "lucide-react";
import { Link } from "react-router-dom";

export interface StoryItem {
  id: string;
  storeName: string;
  storeSlug: string;
  title: string;
  price: string;
  category: string;
  type: string;
  videoUrl: string;
  poster: string;
}

interface MarketplaceStoryReelsProps {
  stories: StoryItem[];
  selectedStory: StoryItem | null;
  onSelectStory: (story: StoryItem | null) => void;
  isDarkMode?: boolean;
}

export const MarketplaceStoryReels: React.FC<MarketplaceStoryReelsProps> = ({
  stories,
  selectedStory,
  onSelectStory,
  isDarkMode = true
}) => {
  return (
    <>
      {/* Stories Bar */}
      <div className="w-full py-3 overflow-x-auto scrollbar-none flex items-center gap-3 px-1">
        <div className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-rose-600 to-amber-600 rounded-2xl text-white shrink-0 shadow-lg">
          <Flame className="w-4 h-4 animate-bounce text-amber-200" />
          <span className="text-xs font-black uppercase tracking-wider">Keşfet Reels</span>
        </div>

        {stories.map((story) => (
          <div
            key={story.id}
            onClick={() => onSelectStory(story)}
            className="relative w-28 h-40 rounded-2xl overflow-hidden shrink-0 cursor-pointer group border-2 border-slate-700/80 hover:border-blue-500 shadow-md transition-all hover:scale-105"
          >
            <img 
              src={story.poster} 
              alt={story.title} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex flex-col justify-between p-2">
              <span className="self-end px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black">
                REELS
              </span>
              <div>
                <span className="text-[10px] font-bold text-white line-clamp-1">{story.storeName}</span>
                <span className="text-[9px] text-amber-300 font-extrabold">{story.price}</span>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
                <Play className="w-4 h-4 fill-white ml-0.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Story Video Modal */}
      {selectedStory && (
        <div 
          onClick={() => onSelectStory(null)}
          className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm h-[80vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col justify-between cursor-default"
          >
            {/* Header Overlay */}
            <div className="absolute top-0 inset-x-0 p-4 z-20 bg-gradient-to-b from-slate-950/90 to-transparent flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-amber-400 block">{selectedStory.storeName}</span>
                <span className="text-[10px] text-white/80 font-bold">{selectedStory.title}</span>
              </div>
              <button 
                onClick={() => onSelectStory(null)}
                className="p-1.5 rounded-full bg-slate-950/80 text-white hover:bg-rose-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Canvas */}
            <video 
              src={selectedStory.videoUrl} 
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Bottom Overlay Action */}
            <div className="absolute bottom-0 inset-x-0 p-4 z-20 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-white">{selectedStory.price}</span>
                <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold">{selectedStory.category}</span>
              </div>

              <Link
                to={`/s/${selectedStory.storeSlug}`}
                target="_blank"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg hover:brightness-110 transition"
              >
                <span>Mağazaya Git ve İncele</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
