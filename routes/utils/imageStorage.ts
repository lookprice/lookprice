import fs from 'fs';
import path from 'path';
import { supabase } from '../../src/services/supabaseService';
import { pool } from '../../models/db';
import { mirrorMediaTo5TBDrive, fetchMediaFrom5TBDrive } from '../googleDrive';
import {
  isR2Configured,
  uploadBufferToR2,
  getBufferFromR2,
  getR2PublicUrl,
  getR2Config,
} from '../../src/services/backend/r2StorageService';

const uploadsStoresDir = path.join(process.cwd(), 'uploads', 'stores');
if (!fs.existsSync(uploadsStoresDir)) {
  fs.mkdirSync(uploadsStoresDir, { recursive: true });
}

// Negative cache to prevent repeated BYTEA/R2 queries for non-existent files
const missingDbFilesCache = new Map<string, number>();
const MISSING_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function saveBufferToDatabase(filename: string, mimetype: string, buffer: Buffer): Promise<boolean> {
  // Asynchronously mirror uploaded media into the 5 TB Google Drive Vault ('LookPrice_5TB_Media')
  mirrorMediaTo5TBDrive(filename, mimetype, buffer).catch(() => {});

  missingDbFilesCache.delete(filename);

  // 1. Primary Zero-Egress Backend: Cloudflare R2 ($0 bandwidth, skips Supabase PostgreSQL BYTEA bloat!)
  if (isR2Configured()) {
    const r2Res = await uploadBufferToR2(filename, mimetype || 'application/octet-stream', buffer);
    if (r2Res.success) {
      return true;
    }
    console.warn(`[Storage R2] Upload failed for ${filename}, falling back to DB:`, r2Res.error);
  }

  // 2. Fallback: Persist in PostgreSQL only when R2 is not yet configured or transiently unavailable
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

export async function getFileFromDatabase(
  filenameOrVariants: string | string[]
): Promise<{ buffer: Buffer; mimetype: string; filename?: string; source?: string } | null> {
  const candidates = (Array.isArray(filenameOrVariants) ? filenameOrVariants : [filenameOrVariants]).filter(Boolean);
  if (candidates.length === 0) return null;

  const now = Date.now();
  const uncheckedCandidates = candidates.filter((fn) => {
    const exp = missingDbFilesCache.get(fn);
    if (exp && now < exp) return false;
    if (exp && now >= exp) missingDbFilesCache.delete(fn);
    return true;
  });

  if (uncheckedCandidates.length === 0) {
    return null;
  }

  // 1. Primary Zero-Egress Read: Cloudflare R2 (0 Supabase DB queries, $0 bandwidth)
  if (isR2Configured()) {
    try {
      const r2File = await getBufferFromR2(uncheckedCandidates);
      if (r2File) {
        return {
          filename: r2File.filename,
          buffer: r2File.buffer,
          mimetype: r2File.mimetype || 'image/jpeg',
          source: 'CLOUDFLARE-R2',
        };
      }
    } catch (r2Err: any) {
      console.warn(`[Storage R2] Read error for ${uncheckedCandidates[0]}:`, r2Err?.message || r2Err);
    }
  }

  try {
    // 2. Legacy PostgreSQL fallback (with automatic background migration to R2 when configured)
    const res = await pool.query(`
      SELECT filename, mimetype, data 
      FROM app_storage_files 
      WHERE filename = ANY($1) 
      LIMIT 1
    `, [uncheckedCandidates]);
    if (res.rows.length > 0 && res.rows[0].data) {
      const buf = Buffer.isBuffer(res.rows[0].data) ? res.rows[0].data : Buffer.from(res.rows[0].data);
      const mime = res.rows[0].mimetype || 'image/png';
      const fn = res.rows[0].filename;
      if (isR2Configured() && fn) {
        // Lazy-migrate to Cloudflare R2 so future cold starts never read this BYTEA from Supabase again
        uploadBufferToR2(fn, mime, buf).catch(() => {});
      }
      return {
        filename: fn,
        buffer: buf,
        mimetype: mime,
        source: 'PG-LEGACY',
      };
    }

    // 3. Fallback: Check 5 TB Google Drive Vault ('LookPrice_5TB_Media') before marking missing
    const primaryCandidate = uncheckedCandidates[0];
    if (primaryCandidate) {
      const driveFile = await fetchMediaFrom5TBDrive(primaryCandidate);
      if (driveFile) {
        if (isR2Configured()) {
          uploadBufferToR2(primaryCandidate, driveFile.mimetype, driveFile.buffer).catch(() => {});
        }
        return {
          filename: primaryCandidate,
          buffer: driveFile.buffer,
          mimetype: driveFile.mimetype,
          source: '5TB-DRIVE-VAULT',
        };
      }
    }

    // Mark candidates as missing in RAM to prevent repeated DB/R2 queries
    if (missingDbFilesCache.size > 5000) {
      missingDbFilesCache.clear();
    }
    for (const fn of uncheckedCandidates) {
      missingDbFilesCache.set(fn, now + MISSING_TTL_MS);
    }
    return null;
  } catch (err: any) {
    console.warn(`[Storage DB] Error fetching ${uncheckedCandidates[0]} from PostgreSQL:`, err?.message || err);
    return null;
  }
}

export function resolvePublicMediaUrl(filename: string): string {
  const r2Pub = getR2PublicUrl(filename);
  if (r2Pub) return r2Pub;
  return `/api/storage/${filename}`;
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

  // 2. Persist to Cloudflare R2 (primary, $0 egress) or PostgreSQL fallback
  await saveBufferToDatabase(filename, mimeType, buffer);

  return resolvePublicMediaUrl(filename);
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

      // 2. Persist to Cloudflare R2 (primary, $0 egress) or PostgreSQL fallback
      await saveBufferToDatabase(filename, mimeType, buffer);

      const url = resolvePublicMediaUrl(filename);

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

/**
 * Rewrites legacy direct Supabase Storage URLs or /uploads paths to our resilient /api/storage/* endpoint
 * (or preserves direct Cloudflare R2 CDN URLs) so media loads with zero Supabase egress.
 */
export function normalizeStorageUrl(rawUrl: string | null | undefined, storeId?: number | string | null, brandName?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith('data:image/')) return trimmed;

  const r2PublicBase = getR2Config().publicUrl;
  if (
    (r2PublicBase && trimmed.startsWith(r2PublicBase)) ||
    trimmed.includes('.r2.dev/') ||
    trimmed.includes('.r2.cloudflarestorage.com/')
  ) {
    return trimmed;
  }

  let storagePath = '';

  // 1. Direct Supabase Storage public URL -> extract filename
  if (trimmed.includes('.supabase.co/storage/v1/object/public/')) {
    const parts = trimmed.split('/storage/v1/object/public/')[1];
    if (parts) {
      const segs = parts.split('/');
      // remove bucket name (e.g. 'lookdocu' or 'stores')
      storagePath = segs.length > 1 ? segs.slice(1).join('/') : segs[0];
    }
  } else if (trimmed.startsWith('/uploads/lookdocu/')) {
    storagePath = trimmed.replace('/uploads/lookdocu/', '');
  } else if (trimmed.startsWith('/uploads/stores/')) {
    storagePath = trimmed.replace('/uploads/stores/', '');
  } else if (trimmed.startsWith('/uploads/')) {
    storagePath = trimmed.replace('/uploads/', '');
  } else if (trimmed.startsWith('/api/storage/')) {
    storagePath = trimmed.replace('/api/storage/', '');
  }

  if (!storagePath) {
    return trimmed;
  }

  // Strip existing query string from storagePath before re-attaching storeId/brand
  const [cleanPath, existingQuery] = storagePath.split('?');
  const params = new URLSearchParams(existingQuery || '');
  if (storeId !== undefined && storeId !== null && String(storeId) !== '' && !params.has('storeId')) {
    params.set('storeId', String(storeId));
  }
  if (brandName && !params.has('brand')) {
    params.set('brand', String(brandName).slice(0, 40));
  }
  const qs = params.toString();
  return `/api/storage/${cleanPath}${qs ? `?${qs}` : ''}`;
}


