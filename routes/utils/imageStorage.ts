import fs from 'fs';
import path from 'path';
import { supabase } from '../../src/services/supabaseService';
import { pool } from '../../models/db';

const uploadsStoresDir = path.join(process.cwd(), 'uploads', 'stores');
if (!fs.existsSync(uploadsStoresDir)) {
  fs.mkdirSync(uploadsStoresDir, { recursive: true });
}

export async function saveBufferToDatabase(filename: string, mimetype: string, buffer: Buffer): Promise<boolean> {
  try {
    await pool.query(`
      INSERT INTO app_storage_files (filename, mimetype, data, size, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (filename) DO UPDATE 
      SET mimetype = EXCLUDED.mimetype, data = EXCLUDED.data, size = EXCLUDED.size, created_at = CURRENT_TIMESTAMP
    `, [filename, mimetype, buffer, buffer.length]);
    return true;
  } catch (err: any) {
    console.warn(`[Storage DB] Failed to save ${filename} to PostgreSQL:`, err?.message || err);
    return false;
  }
}

export async function getFileFromDatabase(filename: string): Promise<{ buffer: Buffer; mimetype: string } | null> {
  try {
    const res = await pool.query(`
      SELECT mimetype, data 
      FROM app_storage_files 
      WHERE filename = $1 
      LIMIT 1
    `, [filename]);
    if (res.rows.length > 0 && res.rows[0].data) {
      return {
        buffer: Buffer.isBuffer(res.rows[0].data) ? res.rows[0].data : Buffer.from(res.rows[0].data),
        mimetype: res.rows[0].mimetype || 'image/png'
      };
    }
    return null;
  } catch (err: any) {
    console.warn(`[Storage DB] Error fetching ${filename} from PostgreSQL:`, err?.message || err);
    return null;
  }
}

export async function saveBase64Image(base64Data: string, prefix: string): Promise<string> {
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
  const localLookdocuDir = path.join(process.cwd(), 'uploads', 'lookdocu');
  if (!fs.existsSync(localLookdocuDir)) {
    fs.mkdirSync(localLookdocuDir, { recursive: true });
  }

  const mimeType = ext === 'svg' ? 'image/svg+xml' : ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

  // 1. Always write locally first to eliminate egress
  try {
    fs.writeFileSync(path.join(localLookdocuDir, filename), buffer);
    fs.writeFileSync(path.join(uploadsStoresDir, filename), buffer);
  } catch (localErr) {
    console.warn("Failed to write base64 image locally:", localErr);
  }

  // 2. Persist directly in PostgreSQL database (never lost on container reboot, independent of Supabase)
  await saveBufferToDatabase(filename, mimeType, buffer);

  // 3. Try to save to Supabase as backup if keys are available
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.project_url;
    const supabaseKey = process.env.SUPABASE_KEY || process.env.service_role;
    if (supabaseUrl && supabaseKey) {
      const { error } = await supabase.storage
        .from("lookdocu")
        .upload(filename, buffer, {
          contentType: mimeType,
          upsert: false,
        });
      if (error) {
        console.warn("[Storage] Supabase base64 upload failed:", error.message || error);
      }
    }
  } catch (err) {
    console.warn("Supabase upload exception:", err);
  }

  return `/api/storage/${filename}`;
}

export async function replaceAllBase64InString(str: string, prefix: string): Promise<string> {
  if (!str || typeof str !== 'string' || !str.includes('data:image/')) return str;

  // Let's match all base64 occurrences
  const regex = /data:image\/([a-zA-Z0-9\+\-\.]+);base64,([a-zA-Z0-9\+\/=\s]+)/g;
  let match;
  let resultStr = str;
  const matchesToReplace: Array<{ fullMatch: string; extMatch: string; base64Str: string }> = [];

  while ((match = regex.exec(str)) !== null) {
    matchesToReplace.push({
      fullMatch: match[0],
      extMatch: match[1],
      base64Str: match[2]
    });
  }

  for (const item of matchesToReplace) {
    try {
      let ext = item.extMatch;
      if (ext === 'jpeg') ext = 'jpg';
      if (ext === 'svg+xml') ext = 'svg';
      const cleanBase64 = item.base64Str.replace(/\s+/g, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      if (buffer.length < 50) continue;

      const filename = `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}.${ext}`;
      const localLookdocuDir = path.join(process.cwd(), 'uploads', 'lookdocu');
      if (!fs.existsSync(localLookdocuDir)) {
        fs.mkdirSync(localLookdocuDir, { recursive: true });
      }

      const mimeType = ext === 'svg' ? 'image/svg+xml' : ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

      // 1. Always write locally first to eliminate egress
      try {
        fs.writeFileSync(path.join(localLookdocuDir, filename), buffer);
        fs.writeFileSync(path.join(uploadsStoresDir, filename), buffer);
      } catch (localErr) {
        console.warn("Failed to write base64 substring locally:", localErr);
      }

      // 2. Persist in PostgreSQL database
      await saveBufferToDatabase(filename, mimeType, buffer);

      // 3. Try to save to Supabase as backup if keys are available
      try {
        const supabaseUrl = process.env.SUPABASE_URL || process.env.project_url;
        const supabaseKey = process.env.SUPABASE_KEY || process.env.service_role;
        if (supabaseUrl && supabaseKey) {
          const { error } = await supabase.storage
            .from("lookdocu")
            .upload(filename, buffer, {
              contentType: mimeType,
              upsert: false,
            });
          if (error) {
            console.warn("[Storage] Supabase base64 upload failed:", error.message || error);
          }
        }
      } catch (err) {
        console.warn("Supabase upload exception:", err);
      }

      const url = `/api/storage/${filename}`;

      resultStr = resultStr.replace(item.fullMatch, url);
    } catch (e) {
      console.error("Error processing base64 replace:", e);
    }
  }

  return resultStr;
}

export async function cleanDeepBase64(data: any, prefix: string): Promise<any> {
  if (!data) return data;
  if (typeof data === 'string') {
    return await replaceAllBase64InString(data, prefix);
  }
  if (Array.isArray(data)) {
    const cleanedArray = [];
    for (let idx = 0; idx < data.length; idx++) {
      cleanedArray.push(await cleanDeepBase64(data[idx], `${prefix}_i${idx}`));
    }
    return cleanedArray;
  }
  if (typeof data === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(data)) {
      cleaned[key] = await cleanDeepBase64(data[key], `${prefix}_${key}`);
    }
    return cleaned;
  }
  return data;
}
