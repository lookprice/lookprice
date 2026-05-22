import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Upload, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageGalleryProps {
  images: string[];
  onChange?: (images: string[]) => void;
  isEditable?: boolean;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, onChange, isEditable }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const removeImage = (index: number) => {
    if (onChange) {
      onChange(images.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-4">
      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((url, index) => (
          <div key={index} className="relative group aspect-square">
            <img
              src={url}
              alt={`Gallery ${index}`}
              className="w-full h-full object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setSelectedImage(url)}
            />
            {isEditable && (
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button
              className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-full object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
