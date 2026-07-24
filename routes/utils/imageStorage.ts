import fs from 'fs';
import path from 'path';

const uploadsStoresDir = path.join(process.cwd(), 'uploads', 'stores');
if (!fs.existsSync(uploadsStoresDir)) {
  fs.mkdirSync(uploadsStoresDir, { recursive: true });
}

export function saveBase64Image(base64Data: string, prefix: string): string {
  if (!base64Data || typeof base64Data !== 'string' || !base64Data.startsWith('data:image/')) {
    return base64Data;
  }
  const matches = base64Data.match(/^data:image\/([a-zA-Z0-9\+\-\.]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return base64Data;
  }
  let ext = matches[1];
  if (ext === 'jpeg') ext = 'jpg';
  if (ext === 'svg+xml') ext = 'svg';
  const cleanBase64 = matches[2].replace(/\s+/g, '');
  const buffer = Buffer.from(cleanBase64, 'base64');
  if (buffer.length < 50) return base64Data; // Keep tiny SVGs or icons inline if negligible
  const filename = `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
  const filePath = path.join(uploadsStoresDir, filename);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/stores/${filename}`;
}

export function replaceAllBase64InString(str: string, prefix: string): string {
  if (!str || typeof str !== 'string' || !str.includes('data:image/')) return str;
  return str.replace(/data:image\/([a-zA-Z0-9\+\-\.]+);base64,([a-zA-Z0-9\+\/=\s]+)/g, (fullMatch, extMatch, base64Str) => {
    try {
      let ext = extMatch;
      if (ext === 'jpeg') ext = 'jpg';
      if (ext === 'svg+xml') ext = 'svg';
      const cleanBase64 = base64Str.replace(/\s+/g, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      if (buffer.length < 50) return fullMatch;
      const filename = `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}.${ext}`;
      const filePath = path.join(uploadsStoresDir, filename);
      fs.writeFileSync(filePath, buffer);
      return `/uploads/stores/${filename}`;
    } catch (e) {
      return fullMatch;
    }
  });
}

export function cleanDeepBase64(data: any, prefix: string): any {
  if (!data) return data;
  if (typeof data === 'string') {
    return replaceAllBase64InString(data, prefix);
  }
  if (Array.isArray(data)) {
    return data.map((item, idx) => cleanDeepBase64(item, `${prefix}_i${idx}`));
  }
  if (typeof data === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(data)) {
      cleaned[key] = cleanDeepBase64(data[key], `${prefix}_${key}`);
    }
    return cleaned;
  }
  return data;
}
