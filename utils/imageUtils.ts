
import { jsPDF } from 'jspdf';

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Уменьшает изображение для API, чтобы избежать перегрузки памяти и лимитов размера запроса.
 */
export const prepareImageForAi = async (base64: string, maxSize = 1024): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64);
      
      ctx.drawImage(img, 0, 0, width, height);
      // Используем JPEG для уменьшения веса при передаче в API
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = base64;
  });
};

export const resizeAndCrop = async (
  imageSrc: string,
  widthMm: number,
  heightMm: number
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      const targetRatio = widthMm / heightMm;
      const imgRatio = img.width / img.height;

      let sw, sh, sx, sy;
      if (imgRatio > targetRatio) {
        sh = img.height;
        sw = img.height * targetRatio;
        sx = (img.width - sw) / 2;
        sy = 0;
      } else {
        sw = img.width;
        sh = img.width / targetRatio;
        sx = 0;
        sy = (img.height - sh) / 2;
      }

      const outputWidth = 1200;
      canvas.width = outputWidth;
      canvas.height = (outputWidth / widthMm) * heightMm;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/png', 1.0));
    };
    img.src = imageSrc;
  });
};

export const generateSheetLayout = async (
  imageSrc: string,
  photoSize: { width: number, height: number },
  sheetSize: { width: number, height: number },
  format: 'JPG' | 'PNG' | 'PDF',
  orientation: 'portrait' | 'landscape'
): Promise<string | Blob> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let finalWidth = sheetSize.width;
      let finalHeight = sheetSize.height;

      if (orientation === 'landscape') {
        finalWidth = sheetSize.height;
        finalHeight = sheetSize.width;
      }

      if (format === 'PDF') {
        const doc = new jsPDF({
          orientation: orientation === 'landscape' ? 'l' : 'p',
          unit: 'mm',
          format: [finalWidth, finalHeight]
        });

        const margin = 10;
        const spacing = 2;
        const pW = photoSize.width;
        const pH = photoSize.height;

        const cols = Math.floor((finalWidth - margin * 2 + spacing) / (pW + spacing));
        const rows = Math.floor((finalHeight - margin * 2 + spacing) / (pH + spacing));

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const x = margin + c * (pW + spacing);
            const y = margin + r * (pH + spacing);
            doc.addImage(img, 'PNG', x, y, pW, pH);
          }
        }
        resolve(doc.output('bloburl').toString());
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpi = 300;
      const scale = dpi / 25.4;

      canvas.width = finalWidth * scale;
      canvas.height = finalHeight * scale;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const pW = photoSize.width * scale;
      const pH = photoSize.height * scale;
      const margin = 10 * scale;
      const spacing = 2 * scale;

      const cols = Math.floor((canvas.width - margin * 2 + spacing) / (pW + spacing));
      const rows = Math.floor((canvas.height - margin * 2 + spacing) / (pH + spacing));

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = margin + c * (pW + spacing);
          const y = margin + r * (pH + spacing);
          
          if (x + pW <= canvas.width - margin + 1 && y + pH <= canvas.height - margin + 1) {
            ctx.drawImage(img, x, y, pW, pH);
            ctx.strokeStyle = '#E5E7EB';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, pW, pH);
          }
        }
      }

      const mime = format === 'PNG' ? 'image/png' : 'image/jpeg';
      resolve(canvas.toDataURL(mime, 0.95));
    };
    img.src = imageSrc;
  });
};
