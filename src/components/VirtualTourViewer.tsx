import React from "react";
import { X } from "lucide-react";

interface ViewerProps {
  url: string;
  onClose: () => void;
}

export const VirtualTourViewer = ({ url, onClose }: ViewerProps) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="bg-white rounded-[2rem] w-full max-w-5xl h-[80vh] relative z-10 flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center text-slate-800">
          <h3 className="font-black text-sm">3D Sanal Tur</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <iframe 
          src={url} 
          className="w-full h-full border-0" 
          title="Virtual Tour"
          allowFullScreen
          allow="xr-spatial-tracking; gyroscope; accelerometer"
        />
      </div>
    </div>
  );
};
