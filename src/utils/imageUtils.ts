export const compressImageToWebP = (
  file: File, 
  targetMaxWidth: number = 1600, 
  targetMaxHeight: number = 1600, 
  initialQuality: number = 0.8
): Promise<File> => {
  return new Promise((resolve) => {
    // If not an image, return original file
    if (!file.type || (!file.type.startsWith('image/') && !/\.(heic|heif|jpe?g|png|webp|bmp|gif)$/i.test(file.name))) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const imgSrc = event.target?.result as string;
      if (!imgSrc) {
        resolve(file);
        return;
      }

      const img = new Image();
      img.src = imgSrc;
      img.onload = () => {
        let currentWidth = img.width || 1200;
        let currentHeight = img.height || 1200;
        let currentMaxDim = Math.max(targetMaxWidth, targetMaxHeight);
        let quality = initialQuality;

        const compressPass = (maxDim: number, q: number): Promise<Blob | null> => {
          return new Promise((blobResolve) => {
            const canvas = document.createElement('canvas');
            let w = currentWidth;
            let h = currentHeight;

            if (w > h) {
              if (w > maxDim) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              }
            } else {
              if (h > maxDim) {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }

            canvas.width = Math.max(w, 1);
            canvas.height = Math.max(h, 1);

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              blobResolve(null);
              return;
            }

            // High-quality image smoothing for crisp mobile camera photos
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Try webp first; if mobile browser fails to output webp, fall back to jpeg
            canvas.toBlob(
              (blob) => {
                if (blob && blob.size > 0) {
                  blobResolve(blob);
                } else {
                  // Fallback to jpeg if webp blob creation is unsupported on older iOS/WebView
                  canvas.toBlob(
                    (jpgBlob) => blobResolve(jpgBlob),
                    'image/jpeg',
                    q
                  );
                }
              },
              'image/webp',
              q
            );
          });
        };

        const processIterative = async () => {
          let bestBlob = await compressPass(currentMaxDim, quality);

          // If blob size is over 1.5 MB, recursively reduce dimensions & quality until file is under 1.5MB
          const maxAllowedSize = 1.5 * 1024 * 1024;
          if (bestBlob && bestBlob.size > maxAllowedSize) {
            bestBlob = await compressPass(1280, 0.75);
          }
          if (bestBlob && bestBlob.size > maxAllowedSize) {
            bestBlob = await compressPass(1024, 0.65);
          }

          if (bestBlob && bestBlob.size > 0) {
            const isWebp = bestBlob.type === 'image/webp';
            const ext = isWebp ? '.webp' : '.jpg';
            const newFileName = file.name.replace(/\.[^/.]+$/, "") + ext;
            const compressedFile = new File([bestBlob], newFileName, {
              type: bestBlob.type || 'image/webp',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        };

        processIterative().catch(() => resolve(file));
      };

      img.onerror = () => resolve(file);
    };

    reader.onerror = () => resolve(file);
  });
};
