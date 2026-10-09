import React from 'react';
import { X, MapPin } from 'lucide-react';
import { StoreLocation } from '../types';
import { StoreLocator } from './StoreLocator';

interface StoreLocatorModalProps {
  locations: StoreLocation[];
  onClose: () => void;
}

export const StoreLocatorModal: React.FC<StoreLocatorModalProps> = ({ locations, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-lg relative z-10 max-h-[90vh] flex flex-col overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 z-20">
          <X className="w-5 h-5" />
        </button>
        <div className="overflow-y-auto mt-4 px-2 -mx-2">
          <StoreLocator locations={locations} />
        </div>
      </div>
    </div>
  );
};
