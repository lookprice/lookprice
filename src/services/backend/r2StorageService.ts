import crypto from "crypto";

export interface R2Config {
  configured: boolean;
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
  endpoint: string;
}

export function getR2Config(): R2Config {
  const accountId = String(process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID || "").trim();
  const accessKeyId = String(process.env.R2_ACCESS_KEY_ID || "").trim();
  const secretAccessKey = String(process.env.R2_SECRET_ACCESS_KEY || "").trim();
  const bucketName = String(process.env.R2_BUCKET_NAME || "lookprice-media").trim();
  const publicUrl = String(process.env.R2_PUBLIC_URL || "").trim().replace(/\/+$/, "");
  const endpoint = accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "";
  const configured = Boolean(accountId && accessKeyId && secretAccessKey && bucketName);
  return {
    configured,
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicUrl,
    endpoint,
  };
}

export function isR2Configured(): boolean {
  return getR2Config().configured;
}

export function normalizeR2Key(filename: string): string {
  return String(filename || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\.\.+/g, "");
}

function encodeS3Path(rawPath: string): string {
  return rawPath
    .split("/")
    .map((seg) => encodeURIComponent(seg).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()))
    .join("/");
}

export function getR2PublicUrl(filename: string): string | null {
  const cfg = getR2Config();
  if (!cfg.configured || !cfg.publicUrl) return null;
  const key = normalizeR2Key(filename);
  if (!key) return null;
  return `${cfg.publicUrl}/${encodeS3Path(key)}`;
}

function sha256Hex(data: Buffer | string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data).digest();
}

function buildSigV4Headers(params: {
  method: "GET" | "PUT" | "HEAD" | "DELETE";
  host: string;
  canonicalUri: string;
  canonicalQuery?: string;
  payloadHash: string;
  extraHeaders?: Record<string, string>;
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
}): Record<string, string> {
  const region = params.region || "auto";
  const service = "s3";
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  const lowerHeaders: Record<string, string> = {
    host: params.host,
    "x-amz-content-sha256": params.payloadHash,
    "x-amz-date": amzDate,
  };

  if (params.extraHeaders) {
    for (const [k, v] of Object.entries(params.extraHeaders)) {
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        lowerHeaders[k.toLowerCase()] = String(v).trim();
      }
    }
  }

  const sortedKeys = Object.keys(lowerHeaders).sort();
  const canonicalHeaders = sortedKeys.map((k) => `${k}:${lowerHeaders[k]}\n`).join("");
  const signedHeaders = sortedKeys.join(";");

  const canonicalRequest = [
    params.method,
    params.canonicalUri,
    params.canonicalQuery || "",
    canonicalHeaders,
    signedHeaders,
    params.payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = hmacSha256(`AWS4${params.secretAccessKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, "aws4_request");
  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");

  const authHeader = `AWS4-HMAC-SHA256 Credential=${params.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const out: Record<string, string> = {
    Authorization: authHeader,
    "x-amz-date": amzDate,
    "x-amz-content-sha256": params.payloadHash,
  };
  if (params.extraHeaders) {
    for (const [k, v] of Object.entries(params.extraHeaders)) {
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        out[k] = String(v).trim();
      }
    }
  }
  return out;
}

export async function uploadBufferToR2(
  filename: string,
  mimetype: string,
  buffer: Buffer
): Promise<{ success: boolean; key: string; publicUrl: string | null; error?: string }> {
  const cfg = getR2Config();
  const key = normalizeR2Key(filename);
  if (!cfg.configured || !key) {
    return { success: false, key, publicUrl: null, error: "R2 not configured" };
  }

  try {
    const host = `${cfg.accountId}.r2.cloudflarestorage.com`;
    const canonicalUri = `/${encodeS3Path(cfg.bucketName)}/${encodeS3Path(key)}`;
    const payloadHash = sha256Hex(buffer);
    const contentType = mimetype || "application/octet-stream";

    const headers = buildSigV4Headers({
      method: "PUT",
      host,
      canonicalUri,
      payloadHash,
      extraHeaders: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    });

    const resp = await fetch(`https://${host}${canonicalUri}`, {
      method: "PUT",
      headers,
      body: new Uint8Array(buffer),
      signal: AbortSignal.timeout(25000),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      return {
        success: false,
        key,
        publicUrl: null,
        error: `R2 PUT ${resp.status}: ${errText.slice(0, 200)}`,
      };
    }

    return {
      success: true,
      key,
      publicUrl: getR2PublicUrl(key),
    };
  } catch (err: any) {
    return {
      success: false,
      key,
      publicUrl: null,
      error: err?.message || String(err),
    };
  }
}

export async function getBufferFromR2(
  filenameOrVariants: string | string[]
): Promise<{ buffer: Buffer; mimetype: string; filename: string } | null> {
  const cfg = getR2Config();
  if (!cfg.configured) return null;

  const candidates = (Array.isArray(filenameOrVariants) ? filenameOrVariants : [filenameOrVariants])
    .map(normalizeR2Key)
    .filter(Boolean);

  for (const key of candidates) {
    try {
      // Fast path via public CDN URL if configured
      if (cfg.publicUrl) {
        const pubResp = await fetch(`${cfg.publicUrl}/${encodeS3Path(key)}`, {
          method: "GET",
          signal: AbortSignal.timeout(12000),
        });
        if (pubResp.ok) {
          const arr = await pubResp.arrayBuffer();
          return {
            filename: key,
            buffer: Buffer.from(arr),
            mimetype: pubResp.headers.get("content-type") || "application/octet-stream",
          };
        }
        if (pubResp.status === 404) continue;
      }

      // Authenticated SigV4 GET directly from R2 S3 API
      const host = `${cfg.accountId}.r2.cloudflarestorage.com`;
      const canonicalUri = `/${encodeS3Path(cfg.bucketName)}/${encodeS3Path(key)}`;
      const payloadHash = sha256Hex("");
      const headers = buildSigV4Headers({
        method: "GET",
        host,
        canonicalUri,
        payloadHash,
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      });

      const resp = await fetch(`https://${host}${canonicalUri}`, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(15000),
      });

      if (resp.ok) {
        const arr = await resp.arrayBuffer();
        return {
          filename: key,
          buffer: Buffer.from(arr),
          mimetype: resp.headers.get("content-type") || "application/octet-stream",
        };
      }
    } catch {
      // Try next variant
    }
  }

  return null;
}

export async function testR2Connection(): Promise<{
  configured: boolean;
  connected: boolean;
  bucket: string;
  publicUrl: string;
  message: string;
}> {
  const cfg = getR2Config();
  if (!cfg.configured) {
    return {
      configured: false,
      connected: false,
      bucket: cfg.bucketName,
      publicUrl: cfg.publicUrl,
      message: "R2 ortam değişkenleri (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME) henüz tanımlı değil.",
    };
  }

  try {
    const host = `${cfg.accountId}.r2.cloudflarestorage.com`;
    const canonicalUri = `/${encodeS3Path(cfg.bucketName)}`;
    const canonicalQuery = "list-type=2&max-keys=1";
    const payloadHash = sha256Hex("");
    const headers = buildSigV4Headers({
      method: "GET",
      host,
      canonicalUri,
      canonicalQuery,
      payloadHash,
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    });

    const resp = await fetch(`https://${host}${canonicalUri}?${canonicalQuery}`, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(8000),
    });

    if (resp.ok) {
      return {
        configured: true,
        connected: true,
        bucket: cfg.bucketName,
        publicUrl: cfg.publicUrl,
        message: `Cloudflare R2 aktif (${cfg.bucketName}) · Sınırsız $0 Egress`,
      };
    }

    return {
      configured: true,
      connected: false,
      bucket: cfg.bucketName,
      publicUrl: cfg.publicUrl,
      message: `R2 bağlantı hatası (HTTP ${resp.status})`,
    };
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      bucket: cfg.bucketName,
      publicUrl: cfg.publicUrl,
      message: err?.message || "R2 bağlantı zaman aşımı",
    };
  }
}
