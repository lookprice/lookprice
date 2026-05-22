import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { api } from '../services/api';

interface MultiImageUploaderProps {
  onImagesUploaded: (urls: string[]) => void;
}

export const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({ onImagesUploaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uploadedUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append('file', files[i]);
      try {
        const res = await api.uploadFile(formData);
        if (res.url) {
          uploadedUrls.push(res.url);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }

    if (uploadedUrls.length > 0) {
      onImagesUploaded(uploadedUrls);
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
        accept="image/*"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-all"
      >
        <Upload className="w-4 h-4" />
        Fotoğraf Yükle
      </button>
    </div>
  );
};
