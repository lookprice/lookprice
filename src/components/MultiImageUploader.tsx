import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { api } from '../services/api';

interface MultiImageUploaderProps {
  onImagesUploaded: (urls: string[]) => void;
}

const compressImageToWebP = (file: File, maxWidth: number = 1920, maxHeight: number = 1920, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
              const compressedFile = new File([blob], newFileName, {
                type: 'image/webp',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => {
        resolve(file);
      };
    };
    reader.onerror = () => {
      resolve(file);
    };
  });
};

export const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({ onImagesUploaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = React.useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
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
        alert(`"${file.name}" adlı dosya sıkıştırılmasına rağmen boyutu 2MB'den büyük olduğu için yüklenemedi. Lütfen fotoğrafları küçülterek tekrar deneyin.`);
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await api.uploadFile(formData);
        if (res.url) {
          uploadedUrls.push(res.url);
        } else if (res.error) {
          alert(`Yükleme hatası: ${res.error}`);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }

    if (uploadedUrls.length > 0) {
      onImagesUploaded(uploadedUrls);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsUploading(false);
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
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        className={`flex items-center gap-2 px-4 py-2 ${isUploading ? 'bg-indigo-100 text-indigo-400 cursor-not-allowed' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'} rounded-xl font-bold text-sm transition-all`}
      >
        <Upload className={`w-4 h-4 ${isUploading ? 'animate-bounce' : ''}`} />
        {isUploading ? 'Yükleniyor...' : 'Fotoğraf Yükle'}
      </button>
    </div>
  );
};
