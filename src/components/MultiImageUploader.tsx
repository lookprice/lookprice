import React, { useRef } from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { api } from '../services/api';
import { compressImageToWebP } from '../utils/imageUtils';

interface MultiImageUploaderProps {
  onImagesUploaded: (urls: string[]) => void;
  lang?: string;
}


export const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({ onImagesUploaded, lang = 'tr' }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = React.useState(false);

  const processAndUploadFiles = async (files: FileList | null, isCamera: boolean = false) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploadedUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      let file = files[i];
      
      // Automatic conversion and compression to WebP on client side!
      try {
        file = await compressImageToWebP(file);
      } catch (err) {
        console.error("Client side compression error:", err);
      }

      if (file.size > 2 * 1024 * 1024) {
        alert(
          lang === 'tr' 
            ? `"${file.name}" adlı dosya sıkıştırılmasına rağmen boyutu 2MB'den büyük olduğu için yüklenemedi. Lütfen fotoğrafları küçülterek tekrar deneyin.`
            : `"${file.name}" could not be uploaded because its size is over 2MB even after compression. Please resize and try again.`
        );
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await api.uploadFile(formData);
        if (res.url) {
          uploadedUrls.push(res.url);
        } else if (res.error) {
          alert(lang === 'tr' ? `Yükleme hatası: ${res.error}` : `Upload error: ${res.error}`);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }

    if (uploadedUrls.length > 0) {
      onImagesUploaded(uploadedUrls);
    }
    
    // Reset file elements
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
    setIsUploading(false);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 select-none">
      {/* Standard Gallery Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => processAndUploadFiles(e.target.files, false)}
        className="hidden"
        multiple
        accept="image/*"
      />
      
      {/* Direct Camera Input with capture="environment" */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={(e) => processAndUploadFiles(e.target.files, true)}
        className="hidden"
        accept="image/*"
        capture="environment"
      />

      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full">
        {/* Live Camera Button */}
        <button
          type="button"
          disabled={isUploading}
          onClick={() => cameraInputRef.current?.click()}
          className={`flex items-center justify-center gap-2 h-11 px-4 ${
            isUploading 
              ? 'bg-rose-50 text-rose-300 border-rose-100 cursor-not-allowed' 
              : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200 active:scale-95'
          } rounded-2xl border font-black text-xs uppercase tracking-wider transition-all w-full sm:w-auto`}
        >
          <Camera className={`w-4 h-4 ${isUploading ? 'animate-pulse' : ''}`} />
          {isUploading ? (lang === 'tr' ? 'Yükleniyor...' : 'Uploading...') : (lang === 'tr' ? 'Canlı Foto Çek 📸' : 'Take Photo 📸')}
        </button>

        {/* Gallery Pick Button */}
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className={`flex items-center justify-center gap-2 h-11 px-4 ${
            isUploading 
              ? 'bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed' 
              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 active:scale-95'
          } rounded-2xl border font-black text-xs uppercase tracking-wider transition-all w-full sm:w-auto`}
        >
          <ImageIcon className="w-4 h-4" />
          {lang === 'tr' ? 'Galeri / Dosyalar' : 'From Gallery'}
        </button>
      </div>
    </div>
  );
};
