import { Request, Response, NextFunction } from "express";
import { pool } from "../models/db";

// Memory cache for all custom domains to guarantee instant 0ms lookup
let storeDomainMap: Map<string, string> = new Map();
let lastCacheSync = 0;
const CACHE_SYNC_INTERVAL = 30 * 1000; // 30 seconds

// Core system domains that MUST NEVER be rewritten or treated as store domains
export const MAIN_DOMAINS = new Set([
  "lookprice.net",
  "www.lookprice.net",
  "enrakipsiz.com",
  "www.enrakipsiz.com",
  "ais-dev-fw5matlno23z7prjfvwxwu-416165499277.europe-west2.run.app",
  "ais-pre-fw5matlno23z7prjfvwxwu-416165499277.europe-west2.run.app",
  "localhost",
  "0.0.0.0",
  "127.0.0.1",
  "onrender.com"
]);

// Critical paths that MUST NEVER be rewritten to /s/[slug]
const PROTECTED_SYSTEM_PATHS = [
  "/api",
  "/admin",
  "/superadmin",
  "/dashboard",
  "/staff",
  "/login",
  "/register",
  "/assets",
  "/uploads",
  "/s/",
  "/store/",
  "/scan/",
  "/digital-menu",
  "/favicon.ico",
  "/vite.svg"
];

export function normalizeDomain(raw: string): string {
  if (!raw) return "";
  return raw
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .split(":")[0]
    .replace(/^www\./, "")
    .trim();
}

export function extractDomainFromRequest(req: Request): string {
  const customHeader = (req.headers["x-custom-domain"] as string) || (req.query?.custom_domain as string) || "";
  const fwdHost = (req.headers["x-forwarded-host"] as string) || "";
  const host = (req.headers.host as string) || req.hostname || "";
  
  // x-forwarded-host may be comma-separated: "domain.com, proxy.com"
  const raw = customHeader || fwdHost.split(",")[0].trim() || host;
  return normalizeDomain(raw);
}

export async function refreshStoreDomainMap(): Promise<void> {
  try {
    const res = await pool.query(
      "SELECT slug, custom_domain FROM stores WHERE custom_domain IS NOT NULL AND TRIM(custom_domain) != ''"
    );
    const newMap = new Map<string, string>();
    for (const row of res.rows) {
      if (row.custom_domain && row.slug) {
        const norm = normalizeDomain(row.custom_domain);
        if (norm) {
          newMap.set(norm, row.slug);
        }
      }
    }
    storeDomainMap = newMap;
    lastCacheSync = Date.now();
  } catch (err: any) {
    console.error("[DomainMiddleware] Failed to refresh store domain map:", err?.message);
  }
}

export async function resolveStoreSlugForDomain(domain: string): Promise<string | null> {
  const norm = normalizeDomain(domain);
  if (!norm) return null;

  if (Date.now() - lastCacheSync > CACHE_SYNC_INTERVAL || storeDomainMap.size === 0) {
    await refreshStoreDomainMap();
  }

  return storeDomainMap.get(norm) || null;
}

export const domainMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const path = req.path;
  
  // 1. FAST-EXIT for static assets
  const isStaticFile = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|otf|json|map|webmanifest)$/.test(path);
  if (isStaticFile) {
    return next();
  }

  const normalizedDomain = extractDomainFromRequest(req);
  if (!normalizedDomain) return next();

  // 2. Main Portal (Enrakipsiz.com) check
  if (normalizedDomain === "enrakipsiz.com") {
    (req as any).isPortal = true;
    (req as any).storeSlug = "__portal__";
    return next();
  }

  // 3. Main system domains (LookPrice, Localhost, Preview Cloud Run)
  if (
    MAIN_DOMAINS.has(normalizedDomain) ||
    normalizedDomain.includes(".run.app") ||
    normalizedDomain.includes(".onrender.com") ||
    normalizedDomain.includes("webcontainer")
  ) {
    return next();
  }

  // 4. Resolve Store by Custom Domain
  const storeSlug = await resolveStoreSlugForDomain(normalizedDomain);
  if (storeSlug) {
    // Attach to request object so SSR/HTML serving can inject it into window.__CUSTOM_STORE_SLUG__
    (req as any).storeSlug = storeSlug;
    (req as any).customDomain = normalizedDomain;

    // Check if path is a protected system path that should NOT be rewritten
    const isProtectedPath = PROTECTED_SYSTEM_PATHS.some((prefix) => path.startsWith(prefix));
    if (!isProtectedPath) {
      req.url = `/s/${storeSlug}${req.url === "/" ? "" : req.url}`;
      console.log(`[DomainMiddleware] Rewrote: ${normalizedDomain}${path} -> /s/${storeSlug}${path === "/" ? "" : path}`);
    }
  }

  next();
};
