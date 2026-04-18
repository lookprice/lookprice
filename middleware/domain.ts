import { Request, Response, NextFunction } from "express";
import { pool } from "../models/db";

const domainCache = new Map<string, string | null>();
const CACHE_TTL = 60 * 1000; // 1 minute

export const domainMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const path = req.path;
  
  // QUICK EXIT: Skip domain logic for internal paths and static assets immediately
  const isStaticFile = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|otf|json|map)$/.test(path);
  if (
    isStaticFile ||
    path.startsWith("/api/") ||
    path.startsWith("/assets/") ||
    path.startsWith("/uploads/") ||
    path === "/favicon.ico" ||
    path === "/vite.svg"
  ) {
    return next();
  }

  const customDomain = req.headers['x-custom-domain'] as string;
  const host = req.headers.host;
  
  if (!host) return next();

  // Define main domains that should not be treated as custom domains
  const mainDomains = [
    "lookprice.net",
    "www.lookprice.net",
    "ais-dev-fw5matlno23z7prjfvwxwu-416165499277.europe-west2.run.app",
    "ais-pre-fw5matlno23z7prjfvwxwu-416165499277.europe-west2.run.app",
    "localhost",
    "0.0.0.0",
    "onrender.com"
  ];

  const domainToLookup = customDomain || host;

  // If it's a main domain, just continue
  if (mainDomains.some(d => domainToLookup.toLowerCase().includes(d))) {
    return next();
  }

  // Check cache first
  const cachedSlug = domainCache.get(domainToLookup);
  if (cachedSlug !== undefined) {
    if (cachedSlug) {
      return rewriteUrl(req, cachedSlug, next);
    }
    return next();
  }

  try {
    // Check if this host is a custom domain for any store
    const normalizedHost = domainToLookup.startsWith("www.") ? domainToLookup.substring(4) : domainToLookup;
    const result = await pool.query(
      "SELECT slug FROM stores WHERE custom_domain = $1 OR custom_domain = $2", 
      [domainToLookup, normalizedHost]
    );
    
    if (result.rows.length > 0) {
      const storeSlug = result.rows[0].slug;
      domainCache.set(domainToLookup, storeSlug);
      
      // Clear cache after TTL
      setTimeout(() => domainCache.delete(domainToLookup), CACHE_TTL);
      
      return rewriteUrl(req, storeSlug, next);
    } else {
      domainCache.set(domainToLookup, null);
      setTimeout(() => domainCache.delete(domainToLookup), CACHE_TTL);
    }
  } catch (error) {
    console.error("Domain middleware error:", error);
  }

  next();
};

function rewriteUrl(req: Request, storeSlug: string, next: NextFunction) {
  const path = req.path;
  const isStaticFile = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|otf|json|map)$/.test(path);
  
  if (
    isStaticFile ||
    path.startsWith("/s/") || 
    path.startsWith("/store/") || 
    path.startsWith("/scan/") || 
    path.startsWith("/api/") ||
    path.startsWith("/assets/") ||
    path.startsWith("/uploads/") ||
    path === "/favicon.ico" ||
    path === "/vite.svg"
  ) {
    return next();
  }

  req.url = `/s/${storeSlug}${req.url === "/" ? "" : req.url}`;
  console.log(`Custom domain rewrite: ${req.headers.host} -> /s/${storeSlug}`);
  next();
}
