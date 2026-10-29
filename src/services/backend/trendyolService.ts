import axios from "axios";

export interface TrendyolSettings {
  apiKey?: string;
  apiSecret?: string;
  merchantId?: string;
  storeFrontCode?: string;
  defaultCommissionRate?: number;
  commissionRate?: number;
  defaultFixedFee?: number;
  categoryMarkups?: Record<string, { commissionRate?: number; fixedFee?: number }>;
  priceCalculationMethod?: "markup" | "margin";
  priceCalculation?: "markup" | "margin";
  cargoCompanyId?: number;
  defaultDispatchTime?: number;
}

export class TrendyolService {
  private static getHeaders(settings: TrendyolSettings) {
    const merchantId = String(settings.merchantId || "").trim();
    const storeFrontCode = (settings.storeFrontCode && String(settings.storeFrontCode).trim() !== "1"
      ? String(settings.storeFrontCode).trim()
      : "TR").toUpperCase();

    return {
      "User-Agent": `${merchantId} - SelfIntegration`,
      "Accept": "application/json",
      "Content-Type": "application/json",
      "storeFrontCode": storeFrontCode
    };
  }

  private static getAuth(settings: TrendyolSettings) {
    return {
      username: String(settings.apiKey || "").trim(),
      password: String(settings.apiSecret || "").trim()
    };
  }

  /**
   * Calculate Trendyol selling price in TRY based on category markups, commission & fixed fees
   */
  static calculateMarketplacePrice(
    basePriceTRY: number,
    category?: string,
    subCategory?: string,
    settings?: TrendyolSettings
  ): number {
    if (!basePriceTRY || basePriceTRY <= 0) return 0;
    if (!settings) return Math.round(basePriceTRY * 100) / 100;

    let commRate = settings.defaultCommissionRate !== undefined && settings.defaultCommissionRate !== null
      ? Number(settings.defaultCommissionRate)
      : (settings.commissionRate !== undefined ? Number(settings.commissionRate) : 0);
    let fixedFee = settings.defaultFixedFee !== undefined && settings.defaultFixedFee !== null
      ? Number(settings.defaultFixedFee)
      : 0;

    const cat1 = category ? String(category).trim() : "";
    const sub1 = subCategory ? String(subCategory).trim() : "";
    const subKey = cat1 && sub1 ? `${cat1} > ${sub1}` : "";
    const categoryMarkups = settings.categoryMarkups || {};

    if (subKey && categoryMarkups[subKey]) {
      const cm = categoryMarkups[subKey];
      if (cm.commissionRate !== undefined && cm.commissionRate !== null && cm.commissionRate !== ('' as any)) commRate = Number(cm.commissionRate);
      if (cm.fixedFee !== undefined && cm.fixedFee !== null && cm.fixedFee !== ('' as any)) fixedFee = Number(cm.fixedFee);
    } else if (cat1 && categoryMarkups[cat1]) {
      const cm = categoryMarkups[cat1];
      if (cm.commissionRate !== undefined && cm.commissionRate !== null && cm.commissionRate !== ('' as any)) commRate = Number(cm.commissionRate);
      if (cm.fixedFee !== undefined && cm.fixedFee !== null && cm.fixedFee !== ('' as any)) fixedFee = Number(cm.fixedFee);
    }

    const method = settings.priceCalculationMethod || settings.priceCalculation || "markup";
    let finalPrice = basePriceTRY;
    if (method === "margin" && commRate < 100) {
      finalPrice = (basePriceTRY + fixedFee) / (1 - commRate / 100);
    } else {
      finalPrice = (basePriceTRY * (1 + commRate / 100)) + fixedFee;
    }

    return Math.round(finalPrice * 100) / 100;
  }

  /**
   * Fetch all products from Trendyol (/products API) with full pagination
   */
  static async getAllProducts(settings: TrendyolSettings, maxPages = 20): Promise<any[]> {
    const merchantId = String(settings.merchantId || "").trim();
    if (!merchantId || !settings.apiKey || !settings.apiSecret) return [];

    const auth = this.getAuth(settings);
    const headers = this.getHeaders(settings);
    const allItems: any[] = [];

    try {
      let page = 0;
      let totalPages = 1;
      while (page < totalPages && page < maxPages) {
        const res = await axios.get(
          `https://apigw.trendyol.com/integration/product/sellers/${merchantId}/products?page=${page}&size=100`,
          { auth, headers, timeout: 15000 }
        );
        const content = res.data?.content || [];
        allItems.push(...content);
        totalPages = Number(res.data?.totalPages || 1);
        page++;
        if (content.length === 0) break;
      }
    } catch (err: any) {
      console.warn("[TrendyolService.getAllProducts Error]:", err?.response?.data || err?.message);
    }

    return allItems;
  }

  /**
   * Batch update price and inventory on Trendyol
   */
  static async updatePriceAndInventoryBatch(
    settings: TrendyolSettings,
    items: Array<{ barcode: string; quantity: number; salePrice: number; listPrice?: number }>
  ): Promise<{ success: boolean; batchRequestId?: string; message?: string }> {
    const merchantId = String(settings.merchantId || "").trim();
    if (!merchantId || !settings.apiKey || !settings.apiSecret) {
      return { success: false, message: "Trendyol kimlik bilgileri eksik." };
    }
    if (!items || items.length === 0) {
      return { success: true, message: "Güncellenecek ürün yok." };
    }

    const auth = this.getAuth(settings);
    const headers = this.getHeaders(settings);

    // Filter valid items and enforce listPrice >= salePrice
    const payloadItems = items
      .filter(it => it.barcode && String(it.barcode).trim())
      .map(it => {
        const sPrice = Math.max(1, Math.round(Number(it.salePrice || 1) * 100) / 100);
        const lPrice = Math.max(sPrice, Math.round(Number(it.listPrice || sPrice) * 100) / 100);
        const qty = Math.max(0, Math.floor(Number(it.quantity || 0)));
        return {
          barcode: String(it.barcode).trim(),
          quantity: qty,
          salePrice: sPrice,
          listPrice: lPrice
        };
      });

    if (payloadItems.length === 0) return { success: true };

    try {
      const res = await axios.post(
        `https://apigw.trendyol.com/integration/inventory/sellers/${merchantId}/products/price-and-inventory`,
        { items: payloadItems },
        { auth, headers, timeout: 15000 }
      );
      return {
        success: true,
        batchRequestId: res.data?.batchRequestId,
        message: "Fiyat ve stok güncellemesi Trendyol'a iletildi."
      };
    } catch (err: any) {
      const errMsg = err?.response?.data?.errors?.map((e: any) => e.message || e).join(" | ") ||
        err?.response?.data?.message || err?.message || "Fiyat/stok güncelleme hatası";
      return { success: false, message: errMsg };
    }
  }

  /**
   * Reconcile remote Trendyol listings with local database products
   */
  static async matchListingsWithStoreProducts(
    settings: TrendyolSettings,
    poolInstance: any,
    storeId: number,
    options: { syncPrices?: boolean } = {}
  ): Promise<{
    success: boolean;
    matchedCount: number;
    activeCount: number;
    pendingCount: number;
    rejectedCount: number;
    totalRemote: number;
    message: string;
  }> {
    const merchantId = String(settings.merchantId || "").trim();
    if (!merchantId || !settings.apiKey || !settings.apiSecret) {
      throw new Error("Trendyol API bilgileri (Satıcı ID, API Key, API Secret) eksik.");
    }

    const remoteProducts = await this.getAllProducts(settings);
    const localProdRes = await poolInstance.query("SELECT * FROM products WHERE store_id = $1", [storeId]);
    const localProducts = localProdRes.rows || [];

    const storeRes = await poolInstance.query(
      "SELECT currency_rates, branding, default_currency FROM stores WHERE id = $1",
      [storeId]
    );
    const storeRow = storeRes.rows[0] || {};
    let branding = storeRow.branding || {};
    if (typeof branding === "string") { try { branding = JSON.parse(branding); } catch { branding = {}; } }
    const rates = { ...(branding?.currency_rates || {}), ...(storeRow.currency_rates || {}) };

    let matchedCount = 0;
    let activeCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;
    const matchedLocalIds = new Set<number>();
    const activeMatchedIds = new Set<number>();
    const priceSyncBatch: Array<{ barcode: string; quantity: number; salePrice: number; listPrice: number }> = [];

    // Helper to format Turkish error reason details
    const formatRejectReasons = (item: any): string => {
      const details = item.rejectReasonDetails || [];
      if (Array.isArray(details) && details.length > 0) {
        return details.map((d: any) => {
          const reason = String(d.rejectReason || "");
          const detail = String(d.rejectReasonDetail || "");
          if (reason.toLowerCase().includes("banned word")) {
            return `Yasaklı Kelime Hatası: ${detail || "Açıklama veya başlıkta kısıtlı kelime (örn: Apple) tespit edildi."}`;
          }
          if (reason.toLowerCase().includes("wrong brand")) {
            return `Marka Uyuşmazlığı: ${detail || "Seçilen marka ile ürün başlığı/görseli uyuşmuyor."}`;
          }
          if (reason.toLowerCase().includes("image") || reason.toLowerCase().includes("görsel")) {
            return `Görsel Hatası: ${detail || "Ürün resmi Trendyol tarafından indirilemedi veya geçersiz format."}`;
          }
          return `${reason}: ${detail}`;
        }).join(" | ");
      }
      return "Trendyol katalog standartlarına uygun olmadığı için reddedildi.";
    };

    for (const rp of remoteProducts) {
      const v = rp.variants?.[0] || rp;
      const rpBarcode = String(v.barcode || rp.barcode || "").trim().toLowerCase();
      const rpCleanBarcode = rpBarcode.replace(/^0+/, "");
      const rpStock = String(v.stockCode || rp.stockCode || "").trim().toLowerCase();
      const rpMainId = String(rp.productMainId || "").trim().toLowerCase();
      const rpContentId = String(rp.contentId || rp.productContentId || rp.productCode || rp.id || "").trim();

      const isApproved = Boolean(rp.approved);
      const isRejected = Boolean(rp.rejected);
      const isOnSale = Boolean(v.onSale ?? rp.onSale) && Number(v.quantity ?? rp.quantity ?? 0) > 0;

      // Extract public product URL ONLY if approved and numeric/valid -p- ID exists
      let publicUrl: string | null = null;
      const rawUrl = String(v.productUrl || rp.productUrl || "").trim();
      if (isApproved && rawUrl.startsWith("http") && /-p-\d+/.test(rawUrl)) {
        publicUrl = rawUrl.includes("merchantId=")
          ? rawUrl
          : `${rawUrl}${rawUrl.includes("?") ? "&" : "?"}merchantId=${merchantId}&filterOverPriceListings=false`;
      } else if (isApproved && /^\d+$/.test(rpContentId)) {
        publicUrl = `https://www.trendyol.com/-p-${rpContentId}?merchantId=${merchantId}&filterOverPriceListings=false`;
      }

      // 1. Exact Barcode Match
      let matchedLocal = localProducts.find((lp: any) => {
        if (matchedLocalIds.has(lp.id)) return false;
        const lpBarcode = String(lp.barcode || "").trim().toLowerCase();
        const lpCleanBarcode = lpBarcode.replace(/^0+/, "");
        if (!lpBarcode) return false;
        return lpBarcode === rpBarcode || lpCleanBarcode === rpCleanBarcode;
      });

      // 2. Exact SKU / StockCode / MainId Match
      if (!matchedLocal) {
        matchedLocal = localProducts.find((lp: any) => {
          if (matchedLocalIds.has(lp.id)) return false;
          const lpSku = String(lp.sku || lp.product_code || "").trim().toLowerCase();
          const lpCleanSku = lpSku.replace(/^0+/, "");
          if (!lpSku) return false;
          return lpSku === rpStock || lpCleanSku === rpStock || lpSku === rpMainId || lpCleanSku === rpMainId;
        });
      }

      if (matchedLocal) {
        matchedLocalIds.add(matchedLocal.id);
        let mpData: any = matchedLocal.marketplace_data;
        if (typeof mpData === "string") { try { mpData = JSON.parse(mpData); } catch { mpData = {}; } }
        mpData = mpData || {};

        const pPrice = Number(matchedLocal.price || 0);
        const pStock = Math.max(0, Math.floor(Number(matchedLocal.stock_quantity || 0)));

        let webPriceTry = pPrice;
        const prodCurrency = String(matchedLocal.currency || storeRow.default_currency || "TRY").toUpperCase();
        if (prodCurrency !== "TRY" && prodCurrency !== "TL") {
          const rate = Number(rates[prodCurrency] || (prodCurrency === "USD" ? 49.5647 : prodCurrency === "EUR" ? 55.4997 : 1));
          if (rate > 1) webPriceTry = pPrice * rate;
        }

        const calculatedPrice = pPrice > 0
          ? this.calculateMarketplacePrice(webPriceTry, matchedLocal.category, matchedLocal.sub_category, settings)
          : 0;

        let finalActive = false;
        let mpStatus = "INACTIVE";
        let lastError: string | null = null;

        if (isApproved) {
          if (pPrice > 0 && pStock > 0 && (isOnSale || Number(rp.quantity || 0) === 0)) {
            finalActive = true;
            mpStatus = "ACTIVE";
            activeCount++;
            activeMatchedIds.add(matchedLocal.id);
          } else {
            finalActive = false;
            mpStatus = "INACTIVE";
            lastError = null;
          }

          if (calculatedPrice > 0 && rpBarcode) {
            const remotePrice = Number(rp.salePrice || v.salePrice || 0);
            const remoteStock = Number(rp.quantity ?? v.quantity ?? -1);
            if (Math.abs(remotePrice - calculatedPrice) >= 0.05 || remoteStock !== pStock) {
              priceSyncBatch.push({
                barcode: rp.barcode || v.barcode,
                quantity: pStock,
                salePrice: calculatedPrice,
                listPrice: calculatedPrice
              });
            }
          }
        } else if (isRejected) {
          finalActive = false;
          mpStatus = "ERROR";
          lastError = formatRejectReasons(rp);
          rejectedCount++;
        } else {
          finalActive = false;
          mpStatus = "PENDING_APPROVAL";
          lastError = null;
          pendingCount++;
        }

        mpData.trendyol = {
          ...(mpData.trendyol || {}),
          contentId: isApproved && /^\d+$/.test(rpContentId) ? rpContentId : (isApproved ? (rp.productContentId || null) : null),
          barcode: rp.barcode || v.barcode,
          productCode: rp.productCode || rpContentId,
          title: rp.title,
          categoryName: rp.categoryName,
          brand: rp.brand,
          status: mpStatus,
          approved: isApproved,
          onSale: isOnSale,
          rejected: isRejected,
          productUrl: publicUrl,
          price: calculatedPrice > 0 ? calculatedPrice : Number(rp.salePrice || 0),
          lastSync: new Date().toISOString(),
          lastError
        };

        await poolInstance.query(
          "UPDATE products SET is_trendyol_active = $1, trendyol_id = $2, trendyol_url = $3, trendyol_last_error = $4, marketplace_data = $5 WHERE id = $6 AND store_id = $7",
          [
            finalActive,
            isApproved && publicUrl ? (rpContentId || null) : null,
            publicUrl,
            lastError,
            JSON.stringify(mpData),
            matchedLocal.id,
            storeId
          ]
        );
        matchedCount++;
      }
    }

    // Defensive Reset: Ensure unverified / phantom products in DB do not remain marked active
    const activeIdsArray = Array.from(activeMatchedIds);
    if (activeIdsArray.length > 0) {
      await poolInstance.query(
        "UPDATE products SET is_trendyol_active = false WHERE store_id = $1 AND is_trendyol_active = true AND NOT (id = ANY($2::int[]))",
        [storeId, activeIdsArray]
      );
    } else if (remoteProducts.length > 0) {
      await poolInstance.query(
        "UPDATE products SET is_trendyol_active = false WHERE store_id = $1 AND is_trendyol_active = true",
        [storeId]
      );
    }

    // Clean up phantom URLs (e.g. https://www.trendyol.com/-p-) for any product without a real live URL
    await poolInstance.query(
      `UPDATE products 
       SET trendyol_url = NULL, trendyol_id = NULL
       WHERE store_id = $1 AND (trendyol_url = 'https://www.trendyol.com/-p-' OR trendyol_url LIKE '%-p-' OR trendyol_url LIKE '%-p-null%')`,
      [storeId]
    );

    // Push updated prices and stocks in batch for active matched listings where price/stock differed
    if (options.syncPrices !== false && priceSyncBatch.length > 0) {
      await this.updatePriceAndInventoryBatch(settings, priceSyncBatch).catch((err) => {
        console.warn("[Trendyol Batch Price/Stock Sync Warning]:", err?.message || err);
      });
    }

    return {
      success: true,
      matchedCount,
      activeCount,
      pendingCount,
      rejectedCount,
      totalRemote: remoteProducts.length,
      message: `Trendyol mağazası tarandı: ${matchedCount} ürün doğrulandı (${activeCount} aktif satışta, ${pendingCount} katalog onayında, ${rejectedCount} katalog reddi).`
    };
  }
}
