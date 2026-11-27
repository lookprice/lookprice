import axios, { AxiosRequestConfig } from "axios";
import { detectCategorySector } from "../../data/marketplaceCategoriesData";

const PAZARAMA_AUTH_URL = "https://isortagimgiris.pazarama.com/connect/token";
const PAZARAMA_API_BASE = "https://isortagimapi.pazarama.com";

export interface PazaramaSettings {
  apiKey?: string;      // Client ID from isortagim.pazarama.com/auth/integration
  apiSecret?: string;   // Client Secret from isortagim.pazarama.com/auth/integration
  merchantId?: string;  // Optional Seller / Merchant ID
  commissionRate?: number;
  defaultCommissionRate?: number;
  defaultFixedFee?: number;
  categoryMappings?: Record<string, any>;
  categoryMappingLabels?: Record<string, any>;
  categoryAttributes?: Record<string, any>;
  categoryMarkups?: Record<string, any>;
  brandMappings?: Record<string, any>;
}

export interface PazaramaCategoryNode {
  id: string;
  parentId?: string | null;
  name: string;
  displayName: string;
  paths: string[];
  leaf: boolean;
  isActive: boolean;
  sector: string;
}

export interface PazaramaCategoryAttributeValue {
  id: string;
  value: string;
}

export interface PazaramaCategoryAttribute {
  id: string;
  name: string;
  mandatory: boolean;
  isVariant: boolean;
  isSlicer: boolean;
  type: "select" | "text";
  values: PazaramaCategoryAttributeValue[];
}

export interface PazaramaBrand {
  id: string;
  name: string;
}

export interface PazaramaProductCreateItem {
  code: string;
  name: string;
  displayName: string;
  description: string;
  brandId: string;
  categoryId: string;
  stockCount: number;
  stockCode: string;
  listPrice: number;
  salePrice: number;
  vatRate: number;
  desi?: number;
  groupCode?: string;
  images: Array<{ imageUrl: string }>;
  attributes: Array<{ attributeId: string; attributeValueId: string }>;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Per-clientId OAuth2 Bearer token cache (tokens typically expire in 3600s; refresh 5 min early)
const tokenCache = new Map<string, CachedToken>();
// Per-categoryId attribute schema cache (1 hour TTL)
const attrCache = new Map<string, { attributes: PazaramaCategoryAttribute[]; timestamp: number }>();
// Per-brand-name lookup cache (2 hours TTL)
const brandNameCache = new Map<string, { brand: PazaramaBrand | null; timestamp: number }>();

export function isPazaramaUuid(val: unknown): boolean {
  return typeof val === "string" && UUID_REGEX.test(val.trim());
}

/**
 * Pure helper to transform Pazarama's raw `getCategoryTree` array into
 * normalized leaf categories with full parent-to-child breadcrumb `paths`.
 * Exported for unit testing and server-side caching.
 */
export function buildPazaramaLeafCategories(rawItems: any[]): PazaramaCategoryNode[] {
  if (!Array.isArray(rawItems) || rawItems.length === 0) return [];

  // Flatten if Pazarama returns nested `subCategories` / `children` OR flat `parentId` list
  const flatMap = new Map<string, any>();
  const walk = (nodes: any[], inheritedParentId: string | null = null) => {
    for (const node of nodes) {
      if (!node || typeof node !== "object") continue;
      const id = String(node.id ?? node.categoryId ?? "").trim();
      if (!id) continue;
      const rawParent = node.parentId ?? node.parentCategoryId ?? inheritedParentId;
      const parentId = rawParent && String(rawParent).trim() && String(rawParent).trim() !== "00000000-0000-0000-0000-000000000000"
        ? String(rawParent).trim()
        : null;
      const children = Array.isArray(node.subCategories)
        ? node.subCategories
        : (Array.isArray(node.children) ? node.children : []);

      flatMap.set(id, {
        ...node,
        _id: id,
        _parentId: parentId,
        _hasExplicitChildren: children.length > 0,
      });

      if (children.length > 0) {
        walk(children, id);
      }
    }
  };
  walk(rawItems, null);

  // Track which IDs are referenced as a parent by another node
  const parentIdsWithChildren = new Set<string>();
  for (const node of flatMap.values()) {
    if (node._parentId) {
      parentIdsWithChildren.add(node._parentId);
    }
    if (node._hasExplicitChildren) {
      parentIdsWithChildren.add(node._id);
    }
  }

  // Build breadcrumb path from root -> node (cycle-guarded)
  const buildPath = (id: string): string[] => {
    const chain: string[] = [];
    const visited = new Set<string>();
    let cursor: string | null = id;
    while (cursor && !visited.has(cursor)) {
      visited.add(cursor);
      const item = flatMap.get(cursor);
      if (!item) break;
      const label = String(item.name || item.displayName || "").trim();
      if (label) chain.unshift(label);
      cursor = item._parentId || null;
    }
    return chain;
  };

  const leafNodes: PazaramaCategoryNode[] = [];
  for (const node of flatMap.values()) {
    const isActive = node.isActive !== false && node.status !== "INACTIVE" && node.isDeleted !== true;
    if (!isActive) continue;

    // Respect explicit `leaf` flag when present; otherwise determine by absence of child nodes
    const isLeaf = typeof node.leaf === "boolean"
      ? node.leaf
      : (typeof node.isLeaf === "boolean" ? node.isLeaf : !parentIdsWithChildren.has(node._id));

    if (!isLeaf) continue;

    const name = String(node.name || node.displayName || "").trim();
    if (!name) continue;

    const paths = buildPath(node._id);
    const displayName = paths.length > 1
      ? paths.join(" > ")
      : String(node.displayName || name).trim();

    leafNodes.push({
      id: node._id,
      parentId: node._parentId,
      name,
      displayName,
      paths: paths.length > 0 ? paths : [name],
      leaf: true,
      isActive: true,
      sector: detectCategorySector(name, paths),
    });
  }

  leafNodes.sort((a, b) => a.displayName.localeCompare(b.displayName, "tr"));
  return leafNodes;
}

/**
 * Normalizes Pazarama `getCategoryWithAttributes` response into a unified attribute list.
 */
export function parsePazaramaCategoryAttributes(rawData: any): PazaramaCategoryAttribute[] {
  const rawAttrs = Array.isArray(rawData)
    ? rawData
    : (Array.isArray(rawData?.attributes)
      ? rawData.attributes
      : (Array.isArray(rawData?.data?.attributes) ? rawData.data.attributes : []));

  const normalized: PazaramaCategoryAttribute[] = [];
  for (const attr of rawAttrs) {
    if (!attr || typeof attr !== "object") continue;
    const id = String(attr.id ?? attr.attributeId ?? "").trim();
    const name = String(attr.name ?? attr.attributeName ?? attr.displayName ?? "").trim();
    if (!id || !name) continue;

    const rawValues = Array.isArray(attr.attributeValues)
      ? attr.attributeValues
      : (Array.isArray(attr.values) ? attr.values : []);

    const values: PazaramaCategoryAttributeValue[] = rawValues
      .map((v: any) => ({
        id: String(v?.id ?? v?.attributeValueId ?? "").trim(),
        value: String(v?.value ?? v?.name ?? v?.displayName ?? "").trim(),
      }))
      .filter((v: PazaramaCategoryAttributeValue) => v.id && v.value);

    normalized.push({
      id,
      name,
      mandatory: Boolean(attr.isRequired ?? attr.required ?? attr.mandatory),
      isVariant: Boolean(attr.isVariant ?? attr.isVariantable ?? attr.varianter),
      isSlicer: Boolean(attr.isSlicer ?? attr.slicer),
      type: values.length > 0 ? "select" : "text",
      values,
    });
  }

  // Sort mandatory attributes first, then Turkish alphabetical
  normalized.sort((a, b) => {
    if (a.mandatory !== b.mandatory) return a.mandatory ? -1 : 1;
    return a.name.localeCompare(b.name, "tr");
  });

  return normalized;
}

export class PazaramaService {
  private clientId: string;
  private clientSecret: string;
  private merchantId: string;

  constructor(settings: PazaramaSettings) {
    this.clientId = String(settings?.apiKey || "").trim();
    this.clientSecret = String(settings?.apiSecret || "").trim();
    this.merchantId = String(settings?.merchantId || "").trim();
  }

  public hasCredentials(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  private getTokenCacheKey(): string {
    return `${this.clientId}:${this.clientSecret.slice(0, 6)}`;
  }

  public invalidateToken(): void {
    tokenCache.delete(this.getTokenCacheKey());
  }

  /**
   * Acquires an OAuth2 Client Credentials Bearer Token from Pazarama Identity Server:
   * POST https://isortagimgiris.pazarama.com/connect/token
   * Header: Authorization: Basic base64(clientId:clientSecret)
   * Body (x-www-form-urlencoded): grant_type=client_credentials&scope=merchantgatewayapi.fullaccess
   */
  public async getAccessToken(forceRefresh = false): Promise<string> {
    if (!this.hasCredentials()) {
      throw new Error("Pazarama Client ID (API Key) ve Client Secret (API Secret) bilgileri eksik.");
    }

    const cacheKey = this.getTokenCacheKey();
    if (!forceRefresh) {
      const cached = tokenCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now() + 300_000) {
        return cached.accessToken;
      }
    }

    const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
    const formBody = new URLSearchParams({
      grant_type: "client_credentials",
      scope: "merchantgatewayapi.fullaccess",
    }).toString();

    try {
      const res = await axios.post(PAZARAMA_AUTH_URL, formBody, {
        headers: {
          "Authorization": `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
        },
        timeout: 15000,
      });

      const body = res.data || {};
      const token: string | undefined =
        body?.data?.accessToken ||
        body?.data?.access_token ||
        body?.accessToken ||
        body?.access_token;

      if (!token) {
        const errDetail = body?.userMessage || body?.message || body?.error_description || body?.error || "Token alınamadı";
        throw new Error(`Pazarama OAuth2 token yanıtı geçersiz: ${errDetail}`);
      }

      const expiresInSec = Number(body?.data?.expiresIn || body?.expires_in || 3600);
      tokenCache.set(cacheKey, {
        accessToken: token,
        expiresAt: Date.now() + Math.max(600, expiresInSec) * 1000,
      });

      return token;
    } catch (err: any) {
      const status = err?.response?.status;
      const errData = err?.response?.data;
      const detail =
        errData?.userMessage ||
        errData?.message ||
        errData?.error_description ||
        errData?.error ||
        err?.message ||
        "Bağlantı hatası";

      if (status === 400 || status === 401 || status === 403) {
        throw new Error(
          `Pazarama kimlik doğrulama başarısız (HTTP ${status}): Client ID veya Client Secret hatalı olabilir. (${detail})`
        );
      }
      throw new Error(`Pazarama token sunucusuna bağlanılamadı: ${detail}`);
    }
  }

  /**
   * Executes an authenticated request against `https://isortagimapi.pazarama.com`
   * with automatic single-retry on 401 (expired/revoked token).
   */
  private async request<T = any>(config: AxiosRequestConfig, retryOn401 = true): Promise<T> {
    const token = await this.getAccessToken(false);
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...(config.headers as Record<string, string> || {}),
    };
    if (this.merchantId) {
      headers["MerchantId"] = this.merchantId;
    }

    try {
      const res = await axios({
        baseURL: PAZARAMA_API_BASE,
        timeout: 25000,
        ...config,
        headers,
      });
      return res.data as T;
    } catch (err: any) {
      if (retryOn401 && err?.response?.status === 401) {
        this.invalidateToken();
        const freshToken = await this.getAccessToken(true);
        const retryRes = await axios({
          baseURL: PAZARAMA_API_BASE,
          timeout: 25000,
          ...config,
          headers: { ...headers, Authorization: `Bearer ${freshToken}` },
        });
        return retryRes.data as T;
      }
      throw err;
    }
  }

  private extractApiError(body: any, fallback: string): string {
    if (!body) return fallback;
    if (typeof body === "string") return body.slice(0, 300);
    return (
      body.userMessage ||
      body.message ||
      body.error_description ||
      body.error ||
      (Array.isArray(body.errors) ? body.errors.map((e: any) => e?.message || String(e)).join("; ") : null) ||
      fallback
    );
  }

  /**
   * Verifies live Pazarama connectivity:
   * 1. Obtains OAuth2 Bearer Token from `isortagimgiris.pazarama.com/connect/token`
   * 2. Calls lightweight live endpoint `GET /brand/getBrands?Page=1&Size=1`
   */
  public async testConnection(): Promise<{ success: boolean; message: string; tokenOk: boolean; apiOk: boolean }> {
    let tokenOk = false;
    try {
      await this.getAccessToken(true);
      tokenOk = true;
    } catch (tokenErr: any) {
      return {
        success: false,
        tokenOk: false,
        apiOk: false,
        message: tokenErr?.message || "Pazarama OAuth2 token alınamadı.",
      };
    }

    try {
      const data = await this.request<any>({
        method: "GET",
        url: "/brand/getBrands",
        params: { Page: 1, Size: 1 },
        timeout: 15000,
      });

      const ok = data?.success !== false && data?.isSuccess !== false;
      if (ok) {
        return {
          success: true,
          tokenOk: true,
          apiOk: true,
          message: "Pazarama OAuth2 bağlantısı ve canlı API erişimi doğrulandı.",
        };
      }
      return {
        success: false,
        tokenOk: true,
        apiOk: false,
        message: this.extractApiError(data, "Pazarama API yanıtı başarısız döndü."),
      };
    } catch (apiErr: any) {
      return {
        success: false,
        tokenOk,
        apiOk: false,
        message: this.extractApiError(apiErr?.response?.data, apiErr?.message || "Pazarama API testi başarısız."),
      };
    }
  }

  /**
   * Fetches the full Pazarama category tree (`GET /category/getCategoryTree`)
   * and flattens it into active leaf categories with full breadcrumb paths.
   */
  public async getLeafCategories(): Promise<PazaramaCategoryNode[]> {
    const res = await this.request<any>({
      method: "GET",
      url: "/category/getCategoryTree",
      timeout: 30000,
    });

    if (res?.success === false || res?.isSuccess === false) {
      throw new Error(this.extractApiError(res, "Pazarama kategori ağacı çekilemedi."));
    }

    const rawList = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
    return buildPazaramaLeafCategories(rawList);
  }

  /**
   * Fetches live attributes & allowed GUID values for a specific Pazarama leaf category:
   * `GET /category/getCategoryWithAttributes?Id={categoryId}`
   */
  public async getCategoryAttributes(categoryId: string): Promise<PazaramaCategoryAttribute[]> {
    const cleanId = String(categoryId || "").trim();
    if (!cleanId) return [];

    const cached = attrCache.get(cleanId);
    if (cached && Date.now() - cached.timestamp < 3_600_000) {
      return cached.attributes;
    }

    const res = await this.request<any>({
      method: "GET",
      url: "/category/getCategoryWithAttributes",
      params: { Id: cleanId },
      timeout: 20000,
    });

    if (res?.success === false || res?.isSuccess === false) {
      throw new Error(this.extractApiError(res, "Pazarama kategori özellikleri çekilemedi."));
    }

    const attributes = parsePazaramaCategoryAttributes(res?.data ?? res);
    if (attributes.length > 0) {
      attrCache.set(cleanId, { attributes, timestamp: Date.now() });
    }
    return attributes;
  }

  /**
   * Searches Pazarama brands (`GET /brand/getBrands?Page=1&Size=100&name=...`)
   */
  public async getBrands(options?: { name?: string; page?: number; size?: number }): Promise<PazaramaBrand[]> {
    const params: Record<string, any> = {
      Page: options?.page ?? 1,
      Size: options?.size ?? 100,
    };
    if (options?.name && options.name.trim()) {
      params.name = options.name.trim();
    }

    const res = await this.request<any>({
      method: "GET",
      url: "/brand/getBrands",
      params,
      timeout: 20000,
    });

    if (res?.success === false || res?.isSuccess === false) {
      throw new Error(this.extractApiError(res, "Pazarama markaları çekilemedi."));
    }

    const raw = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
    return raw
      .map((b: any) => ({
        id: String(b?.id ?? b?.brandId ?? "").trim(),
        name: String(b?.name ?? b?.brandName ?? "").trim(),
      }))
      .filter((b: PazaramaBrand) => b.id && b.name);
  }

  /**
   * Resolves a human-readable brand name into a real Pazarama Brand GUID.
   * Checks store `brandMappings` first, then queries live `brand/getBrands?name=...` with caching.
   */
  public async resolveBrandId(brandName?: string | null, brandMappings?: Record<string, any>): Promise<string | null> {
    const clean = String(brandName || "").trim();
    if (!clean) return null;
    if (isPazaramaUuid(clean)) return clean;

    if (brandMappings && typeof brandMappings === "object") {
      const direct = brandMappings[clean] || brandMappings[clean.toLowerCase()];
      if (isPazaramaUuid(direct)) return String(direct).trim();
      if (direct && typeof direct === "object" && isPazaramaUuid(direct.id)) {
        return String(direct.id).trim();
      }
    }

    const cacheKey = clean.toLowerCase();
    const cached = brandNameCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 7_200_000) {
      return cached.brand?.id || null;
    }

    try {
      const candidates = await this.getBrands({ name: clean, page: 1, size: 25 });
      const exact = candidates.find((b) => b.name.toLocaleLowerCase("tr") === clean.toLocaleLowerCase("tr"));
      const winner = exact || candidates[0] || null;
      brandNameCache.set(cacheKey, { brand: winner, timestamp: Date.now() });
      return winner?.id || null;
    } catch {
      return null;
    }
  }

  /**
   * Creates one or more products in Pazarama (`POST /product/create`).
   * Returns batchRequestId for asynchronous status tracking.
   */
  public async createProducts(products: PazaramaProductCreateItem[]): Promise<{
    success: boolean;
    batchRequestId?: string;
    message: string;
    raw?: any;
  }> {
    const res = await this.request<any>({
      method: "POST",
      url: "/product/create",
      data: { products },
      timeout: 30000,
    });

    const ok = res?.success === true || res?.isSuccess === true;
    const batchRequestId =
      typeof res?.data === "string"
        ? res.data
        : (res?.data?.batchRequestId || res?.batchRequestId || undefined);

    return {
      success: ok,
      batchRequestId,
      message: ok
        ? (res?.userMessage || res?.message || "Ürün Pazarama kuyruğuna başarıyla gönderildi.")
        : this.extractApiError(res, "Pazarama ürün oluşturma isteği reddedildi."),
      raw: res,
    };
  }

  /**
   * Checks asynchronous product creation batch result:
   * `GET /product/checkRegisterBatchResult?BatchRequestId={id}`
   */
  public async checkBatchResult(batchRequestId: string): Promise<any> {
    return this.request<any>({
      method: "GET",
      url: "/product/checkRegisterBatchResult",
      params: { BatchRequestId: batchRequestId },
      timeout: 15000,
    });
  }

  /**
   * Updates product prices via official v2 endpoint:
   * `POST /product/updatePrice-v2`
   */
  public async updatePrices(items: Array<{ code: string; listPrice: number; salePrice: number }>): Promise<{
    success: boolean;
    message: string;
    raw?: any;
  }> {
    if (!items.length) return { success: true, message: "No items" };
    const res = await this.request<any>({
      method: "POST",
      url: "/product/updatePrice-v2",
      data: { items },
      timeout: 20000,
    });
    const ok = res?.success === true || res?.isSuccess === true;
    return {
      success: ok,
      message: ok ? "Pazarama fiyat güncellemesi iletildi." : this.extractApiError(res, "Pazarama fiyat güncellenemedi."),
      raw: res,
    };
  }

  /**
   * Updates product stock quantities via official v2 endpoint:
   * `POST /product/updateStock-v2`
   */
  public async updateStocks(items: Array<{ code: string; stockCount: number }>): Promise<{
    success: boolean;
    message: string;
    raw?: any;
  }> {
    if (!items.length) return { success: true, message: "No items" };
    const res = await this.request<any>({
      method: "POST",
      url: "/product/updateStock-v2",
      data: { items },
      timeout: 20000,
    });
    const ok = res?.success === true || res?.isSuccess === true;
    return {
      success: ok,
      message: ok ? "Pazarama stok güncellemesi iletildi." : this.extractApiError(res, "Pazarama stok güncellenemedi."),
      raw: res,
    };
  }

  /**
   * Lists orders via official endpoint:
   * `POST /order/getOrdersForApi` (max 30-day window recommended by Pazarama).
   */
  public async getOrders(options?: {
    startDate?: string;
    endDate?: string;
    pageSize?: number;
    pageNumber?: number;
    orderNumber?: number;
  }): Promise<any[]> {
    const end = options?.endDate ? new Date(options.endDate) : new Date();
    const start = options?.startDate ? new Date(options.startDate) : new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    const payload: Record<string, any> = {
      startDate: fmt(start),
      endDate: fmt(end),
      pageSize: options?.pageSize ?? 100,
      pageNumber: options?.pageNumber ?? 1,
    };
    if (options?.orderNumber) {
      payload.orderNumber = options.orderNumber;
    }

    const res = await this.request<any>({
      method: "POST",
      url: "/order/getOrdersForApi",
      data: payload,
      timeout: 30000,
    });

    if (res?.success === false || res?.isSuccess === false) {
      throw new Error(this.extractApiError(res, "Pazarama siparişleri çekilemedi."));
    }

    const data = res?.data ?? res?.content ?? [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.orders)) return data.orders;
    return [];
  }
}
