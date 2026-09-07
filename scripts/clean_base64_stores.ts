import fs from 'fs';
import path from 'path';
import { pool } from '../models/db';

const uploadsStoresDir = path.join(process.cwd(), 'uploads', 'stores');
const uploadsConsultantsDir = path.join(process.cwd(), 'uploads', 'consultants');
if (!fs.existsSync(uploadsStoresDir)) fs.mkdirSync(uploadsStoresDir, { recursive: true });
if (!fs.existsSync(uploadsConsultantsDir)) fs.mkdirSync(uploadsConsultantsDir, { recursive: true });

function replaceAllBase64InString(str: string, prefix: string, targetDir: string = uploadsStoresDir, urlPrefix: string = '/uploads/stores'): string {
  if (!str || typeof str !== 'string' || !str.includes('data:image/')) return str;
  return str.replace(/data:image\/([a-zA-Z0-9\+\-\.]+);base64,([a-zA-Z0-9\+\/=\s]+)/g, (fullMatch, extMatch, base64Str) => {
    try {
      let ext = extMatch;
      if (ext === 'jpeg') ext = 'jpg';
      if (ext === 'svg+xml') ext = 'svg';
      const cleanBase64 = base64Str.replace(/\s+/g, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      if (buffer.length < 50) return fullMatch;
      const filename = `${prefix}_${Date.now()}_${Math.floor(Math.random()*100000)}.${ext}`;
      const filePath = path.join(targetDir, filename);
      fs.writeFileSync(filePath, buffer);
      console.log('Saved image:', filename, buffer.length, 'bytes');
      return `${urlPrefix}/${filename}`;
    } catch (e) {
      console.error('Error saving base64 image:', e);
      return fullMatch;
    }
  });
}

function cleanDeep(data: any, prefix: string, targetDir: string = uploadsStoresDir, urlPrefix: string = '/uploads/stores'): any {
  if (!data) return data;
  if (typeof data === 'string') {
    return replaceAllBase64InString(data, prefix, targetDir, urlPrefix);
  }
  if (Array.isArray(data)) {
    return data.map((item, idx) => cleanDeep(item, `${prefix}_i${idx}`, targetDir, urlPrefix));
  }
  if (typeof data === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(data)) {
      cleaned[key] = cleanDeep(data[key], `${prefix}_${key}`, targetDir, urlPrefix);
    }
    return cleaned;
  }
  return data;
}

async function run() {
  try {
    console.log('Cleaning consultants...');
    const cRes = await pool.query("SELECT id, image_url FROM consultants WHERE image_url LIKE '%data:image/%'");
    for (const c of cRes.rows) {
      const cleanImg = replaceAllBase64InString(c.image_url, `consultant_${c.id}`, uploadsConsultantsDir, '/uploads/consultants');
      await pool.query("UPDATE consultants SET image_url = $1 WHERE id = $2", [cleanImg, c.id]);
      console.log(`Cleaned consultant ${c.id}`);
    }

    console.log('ALL CLEANING COMPLETED!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
