import html2canvas from 'html2canvas';

export interface RecordProgressCallback {
  (progress: number, statusText: string): void;
}

/**
 * High quality DOM Canvas Frame Recorder
 * Renders the target element continuously at target FPS into a canvas and exports WebM video.
 * Does NOT prompt for getDisplayMedia screen share!
 */
export async function recordElementToVideo(
  element: HTMLElement,
  durationSec: number,
  fps: number = 20,
  onProgress?: RecordProgressCallback
): Promise<Blob> {
  const width = element.clientWidth || 1280;
  const height = element.clientHeight || 720;

  // Create an offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });

  if (!ctx) {
    throw new Error('Canvas 2D context could not be created.');
  }

  // Create MediaStream from canvas
  const stream = canvas.captureStream(fps);
  
  // Pick preferred supported mime type
  const mimeTypes = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4'
  ];
  const selectedMime = mimeTypes.find(t => MediaRecorder.isTypeSupported(t)) || 'video/webm';

  const recorder = new MediaRecorder(stream, {
    mimeType: selectedMime,
    videoBitsPerSecond: 4000000 // 4 Mbps high quality
  });

  const recordedChunks: Blob[] = [];

  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  return new Promise(async (resolve, reject) => {
    try {
      recorder.start(100); // 100ms time slice

      const totalFrames = Math.floor(durationSec * fps);
      const frameIntervalMs = 1000 / fps;
      let frameCount = 0;
      let isCancelled = false;

      const renderInterval = setInterval(async () => {
        if (isCancelled) {
          clearInterval(renderInterval);
          return;
        }

        try {
          // Render current state of element to temporary canvas
          const frameCanvas = await html2canvas(element, {
            backgroundColor: '#05060b',
            scale: 1,
            logging: false,
            useCORS: true,
            allowTaint: true,
            width: width,
            height: height
          });

          // Draw onto the stream canvas
          ctx.drawImage(frameCanvas, 0, 0, width, height);
          frameCount++;

          const percent = Math.min(99, Math.round((frameCount / totalFrames) * 100));
          if (onProgress) {
            onProgress(percent, `Kareler işleniyor: ${frameCount}/${totalFrames}`);
          }

          if (frameCount >= totalFrames) {
            clearInterval(renderInterval);
            
            if (onProgress) {
              onProgress(100, 'Video dosyası paketleniyor...');
            }

            recorder.onstop = () => {
              const finalBlob = new Blob(recordedChunks, { type: selectedMime });
              resolve(finalBlob);
            };

            recorder.stop();
          }
        } catch (err) {
          // In case a single frame fails, don't crash
          console.warn('Frame render error:', err);
        }
      }, frameIntervalMs);

    } catch (err) {
      reject(err);
    }
  });
}
