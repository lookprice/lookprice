import axios from "axios";
import xml2js from "xml2js";

export * from "../n11Constants";

export interface N11Auth {
  appKey: string;
  appSecret: string;
}

export interface N11ProductPayload {
  productSellerCode: string;
  productMainId?: string;
  barcode?: string;
  brand?: string;
  categoryName?: string;
  subCategoryName?: string;
  title: string;
  subtitle?: string;
  description: string;
  category: { id: number };
  price: number;
  currencyType?: string;
  vatRate?: number;
  domestic?: boolean;
  preparingDay?: number;
  attributes?: Array<{ name?: string; value?: string; id?: number; valueId?: number; customValue?: string }>;
  stockItems: Array<{
    sellerStockCode: string;
    quantity: number;
    gtin?: string;
    mpn?: string;
    oem?: string;
    optionPrice?: number;
    attributes?: Array<{ name: string; value: string }>;
  }>;
  images: string[];
  shipmentTemplate: string;
  approvalStatus?: string;
}

export class N11Service {
  private static readonly BASE_URL = "https://api.n11.com/ws";

  /**
   * Helper to build a standard N11 SOAP Request XML Envelope
   */
  private static buildSoapEnvelope(actionName: string, auth?: N11Auth | null, bodyContent?: string): string {
    const authXml = (auth && auth.appKey && auth.appSecret) ? `
         <auth>
            <appKey>${auth.appKey}</appKey>
            <appSecret>${auth.appSecret}</appSecret>
         </auth>` : "";

    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://www.n11.com/ws/schemas">
   <soapenv:Header/>
   <soapenv:Body>
      <sch:${actionName}Request>${authXml}
         ${bodyContent || ""}
      </sch:${actionName}Request>
   </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Helper to post SOAP request and parse response XML
   */
  private static async executeSoapRequest(serviceName: string, actionName: string, xmlData: string): Promise<any> {
    const wsdlUrl = `${this.BASE_URL}/${serviceName}.wsdl`;
    const response = await axios.post(wsdlUrl, xmlData, {
      headers: {
        "Content-Type": "text/xml;charset=UTF-8",
        "SOAPAction": actionName,
        "User-Agent": "LookPrice-N11-Integration/2.0"
      },
      timeout: 30000
    });

    const parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: true,
      tagNameProcessors: [xml2js.processors.stripPrefix]
    });

    const parsed = await parser.parseStringPromise(response.data);
    const body = parsed?.Envelope?.Body;

    if (body?.Fault) {
      const fault = body.Fault;
      throw new Error(`N11 SOAP Fault: ${fault.faultstring || fault.message || JSON.stringify(fault)}`);
    }

    return body?.[`${actionName}Response`] || body;
  }

  /**
   * Calculate effective N11 price using the net margin protection formula:
   * P_N11 = (P_Web + FixedFee) / (1 - (CommissionRate / 100))
   */
  static calculateMarketplacePrice(webPrice: number, category?: string, subCategory?: string, config?: any): number {
    const rawPrice = Number(webPrice) || 0;
    if (rawPrice <= 0) return 0;

    const settings: any = config || {};
    const categoryMarkups = settings.categoryMarkups || {};

    let commissionRate = settings.defaultCommissionRate !== undefined && settings.defaultCommissionRate !== null
      ? Number(settings.defaultCommissionRate) 
      : 15;
    let fixedFee = settings.defaultFixedFee !== undefined && settings.defaultFixedFee !== null 
      ? Number(settings.defaultFixedFee) 
      : 80;

    const cat1 = category ? String(category).trim() : '';
    const sub1 = subCategory ? String(subCategory).trim() : '';
    const subKey = cat1 && sub1 ? `${cat1} > ${sub1}` : '';

    if (subKey && categoryMarkups[subKey]) {
      const cm = categoryMarkups[subKey];
      if (cm.commissionRate !== undefined && cm.commissionRate !== null && cm.commissionRate !== '') {
        commissionRate = Number(cm.commissionRate);
      }
      if (cm.fixedFee !== undefined && cm.fixedFee !== null && cm.fixedFee !== '') {
        fixedFee = Number(cm.fixedFee);
      }
    } else if (cat1 && categoryMarkups[cat1]) {
      const cm = categoryMarkups[cat1];
      if (cm.commissionRate !== undefined && cm.commissionRate !== null && cm.commissionRate !== '') {
        commissionRate = Number(cm.commissionRate);
      }
      if (cm.fixedFee !== undefined && cm.fixedFee !== null && cm.fixedFee !== '') {
        fixedFee = Number(cm.fixedFee);
      }
    }

    const priceWithFee = rawPrice + fixedFee;
    let finalPrice = priceWithFee;

    if (commissionRate > 0 && commissionRate < 100) {
      finalPrice = priceWithFee / (1 - (commissionRate / 100));
    }

    return Number(finalPrice.toFixed(2));
  }

  /**
   * Test N11 API credentials by fetching shipment templates
   */
  static async testConnection(auth: N11Auth): Promise<{ success: boolean; message: string }> {
    if (!auth.appKey || !auth.appSecret) {
      return { success: false, message: "N11 AppKey veya AppSecret bilgisi boş olamaz." };
    }

    try {
      const xml = this.buildSoapEnvelope(
        "GetShipmentTemplateList",
        auth,
        ""
      );

      const res = await this.executeSoapRequest("ShipmentService", "GetShipmentTemplateList", xml);

      if (res?.result?.status === "failure") {
        return { success: false, message: res.result.errorMessage || "N11 API Kimlik doğrulaması başarısız." };
      }

      return { success: true, message: "N11 API bağlantısı başarılı! Mağaza kargo şablonları çekildi." };
    } catch (err: any) {
      console.error("[N11-SERVICE] Test Connection error:", err.message);
      return { success: false, message: `N11 Bağlantı Hatası: ${err.message}` };
    }
  }

  /**
   * Get Seller Shipment Templates (Kargo Şablonları)
   */
  static async getShipmentTemplates(auth: N11Auth): Promise<any[]> {
    const xml = this.buildSoapEnvelope(
      "GetShipmentTemplateList",
      auth,
      ""
    );

    const res = await this.executeSoapRequest("ShipmentService", "GetShipmentTemplateList", xml);

    if (res?.result?.status === "failure") {
      throw new Error(res.result.errorMessage || "Kargo şablonları çekilemedi.");
    }

    const templates = res?.shipmentTemplates?.shipmentTemplate;
    if (!templates) return [];
    return Array.isArray(templates) ? templates : [templates];
  }

  /**
   * Get Top Level & Sub Categories from N11
   */
  static async getTopLevelCategories(auth: N11Auth): Promise<any[]> {
    const xml = this.buildSoapEnvelope(
      "GetTopLevelCategories",
      auth,
      ""
    );

    const res = await this.executeSoapRequest("CategoryService", "GetTopLevelCategories", xml);

    if (res?.result?.status === "failure") {
      throw new Error(res.result.errorMessage || "Kategoriler çekilemedi.");
    }

    const cats = res?.categoryList?.category;
    if (!cats) return [];
    return Array.isArray(cats) ? cats : [cats];
  }

  /**
   * Get Sub Categories for a given category ID
   */
  static async getSubCategories(auth: N11Auth, categoryId: number): Promise<any[]> {
    const xml = this.buildSoapEnvelope(
      "GetSubCategories",
      auth,
      `<categoryId>${categoryId}</categoryId>`
    );

    const res = await this.executeSoapRequest("CategoryService", "GetSubCategories", xml);

    if (res?.result?.status === "failure") {
      throw new Error(res.result.errorMessage || "Alt kategoriler çekilemedi.");
    }

    const cats = res?.category?.subCategoryList?.category || res?.category;
    if (!cats) return [];
    return Array.isArray(cats) ? cats : [cats];
  }

  /**
   * Get Parent Category for a given sub-category ID
   */
  static async getParentCategory(auth: N11Auth, categoryId: number): Promise<any> {
    const xml = this.buildSoapEnvelope(
      "GetParentCategory",
      auth,
      `<categoryId>${categoryId}</categoryId>`
    );

    const res = await this.executeSoapRequest("CategoryService", "GetParentCategory", xml);

    if (res?.result?.status === "failure") {
      throw new Error(res.result.errorMessage || "Üst kategori çekilemedi.");
    }

    return res?.category || null;
  }

  /**
   * Get Category Attributes with Values (GetCategoryAttributes)
   */
  static async getCategoryAttributes(auth: N11Auth, categoryId: number, currentPage = 0, pageSize = 100): Promise<any[]> {
    const xml = this.buildSoapEnvelope(
      "GetCategoryAttributes",
      auth,
      `<categoryId>${categoryId}</categoryId>
       <pagingData>
          <currentPage>${currentPage}</currentPage>
          <pageSize>${pageSize}</pageSize>
       </pagingData>`
    );

    const res = await this.executeSoapRequest("CategoryService", "GetCategoryAttributes", xml);

    if (res?.result?.status === "failure") {
      throw new Error(res.result.errorMessage || "Kategori özellikleri çekilemedi.");
    }

    const attrs = res?.category?.attributeList?.attribute;
    if (!attrs) return [];
    return Array.isArray(attrs) ? attrs : [attrs];
  }

  /**
   * Get Category Attributes IDs only (GetCategoryAttributesId)
   */
  static async getCategoryAttributesId(auth: N11Auth, categoryId: number): Promise<any[]> {
    const xml = this.buildSoapEnvelope(
      "GetCategoryAttributesId",
      auth,
      `<categoryId>${categoryId}</categoryId>`
    );

    const res = await this.executeSoapRequest("CategoryService", "GetCategoryAttributesId", xml);

    if (res?.result?.status === "failure") {
      throw new Error(res.result.errorMessage || "Kategori özellik id listesi çekilemedi.");
    }

    const attrs = res?.categoryProductAttributeList?.categoryProductAttribute;
    if (!attrs) return [];
    return Array.isArray(attrs) ? attrs : [attrs];
  }

  /**
   * Get Values for a specific Attribute ID (GetCategoryAttributeValue)
   */
  static async getCategoryAttributeValue(auth: N11Auth, categoryProductAttributeId: number, currentPage = 0, pageSize = 100): Promise<any[]> {
    const xml = this.buildSoapEnvelope(
      "GetCategoryAttributeValue",
      auth,
      `<categoryProductAttributeId>${categoryProductAttributeId}</categoryProductAttributeId>
       <pagingData>
          <currentPage>${currentPage}</currentPage>
          <pageSize>${pageSize}</pageSize>
       </pagingData>`
    );

    const res = await this.executeSoapRequest("CategoryService", "GetCategoryAttributeValue", xml);

    if (res?.result?.status === "failure") {
      throw new Error(res.result.errorMessage || "Kategori özellik değerleri çekilemedi.");
    }

    const values = res?.categoryProductAttributeValueList?.categoryProductAttributeValue;
    if (!values) return [];
    return Array.isArray(values) ? values : [values];
  }

  /**
   * Automatically resolve the best N11 Leaf Category ID from product title, category, and sub_category
   */
  static resolveCategoryIdForProduct(title?: string, category?: string, subCategory?: string, explicitCatId?: number | string): number {
    const numExplicit = Number(explicitCatId);
    // If caller supplied a specific non-default N11 category (not the generic 1000280 placeholder), respect it
    if (!isNaN(numExplicit) && numExplicit > 1000000 && numExplicit !== 1000280) {
      return numExplicit;
    }

    const combined = `${title || ""} ${subCategory || ""} ${category || ""}`.toLocaleLowerCase("tr-TR");

    if (/barkod.*yazıcı|etiket.*yazıcı|termal.*yazıcı|zd220|zd421/i.test(combined)) return 1000340;
    if (/barkod.*okuyucu|karekod.*okuyucu|el.*terminali/i.test(combined)) return 1000294;
    if (/lazer.*yazıcı|laserjet/i.test(combined)) return 1000343;
    if (/tanklı.*yazıcı|deskjet|ecotank|inkjet|püskürtmeli/i.test(combined)) return 1000344;
    if (/çok fonksiyonlu.*yazıcı|all in one.*yazıcı/i.test(combined)) return 1000347;
    if (/tarayıcı|scanner/i.test(combined)) return 1000337;
    if (/toner/i.test(combined)) return 1000338;
    if (/kartuş|mürekkep/i.test(combined)) return 1000335;
    if (/şerit|ribbon|barkod.*sarf/i.test(combined)) return 1000334;
    if (/taşınabilir.*disk|harici.*disk|external.*ssd|elements|my passport/i.test(combined)) return 1000352;
    if (/usb.*bellek|flash.*bellek|cruzer|datatraveler/i.test(combined)) return 1000353;
    if (/ssd|nvme|m\.2|sabit.*disk|hard.*disk|hdd/i.test(combined)) return 1000264;
    if (/ram|bellek.*ddr|ddr4|ddr5|so-dimm|udimm/i.test(combined)) return 1000259;
    if (/anakart|motherboard/i.test(combined)) return 1000258;
    if (/ekran.*kartı|geforce|radeon|rtx|gtx/i.test(combined)) return 1000262;
    if (/işlemci|ryzen|core i[3579]/i.test(combined)) return 1000270;
    if (/klavye.*mouse|set.*klavye|combo/i.test(combined)) return 1000362;
    if (/mouse\s*pad|mousepad/i.test(combined)) return 1000369;
    if (/mouse|fare/i.test(combined)) return 1000363;
    if (/klavye|keyboard/i.test(combined)) return 1000361;
    if (/kulaklık|headset|earbuds|airpods/i.test(combined)) return 1000365;
    if (/mikrofon/i.test(combined)) return 1000366;
    if (/webcam|web.*kamera/i.test(combined)) return 1000372;
    if (/monitör.*kolu|monitör.*stand/i.test(combined)) return 1000238;
    if (/monitör|monitor|ekran/i.test(combined)) return 1000368;
    if (/hoparlör|speaker|ses.*sistemi|soundbar/i.test(combined)) return 1000370;
    if (/ups|kesintisiz.*güç/i.test(combined)) return 1000371;
    if (/güç.*kaynağı|power.*supply|psu/i.test(combined)) return 1000263;
    if (/çanta|kılıf|sırt.*çantası|evrak.*çantası|sleeve/i.test(combined)) return 1000222;
    if (/soğutucu|fan|termal.*macun|contact.*cleaner|degreaser|kimyasal/i.test(combined)) return 1000225;
    if (/dock|stand|yükseltici|sunum.*kumanda|presenter/i.test(combined)) return 1000227;
    if (/batarya|pil/i.test(combined)) return 1000230;
    if (/adaptör|adaptor|çevirici|dönüştürücü|multiport|hub|çoğaltıcı|şarj.*cihazı|type-c|usb-c|priz/i.test(combined)) return 1000212;
    if (/kablo|hdmi|displayport|vga|cat6|cat5|patch.*cord/i.test(combined)) return 1000236;
    if (/switch/i.test(combined)) return 1000277;
    if (/modem|router|access.*point|menzil.*genişletici|deco|mesh|powerline/i.test(combined)) return 1000286;
    if (/bluetooth.*adaptör|usb.*bluetooth/i.test(combined)) return 1000284;
    if (/güvenlik.*kamera|ip.*kamera/i.test(combined)) return 1000300;
    if (/tripod|monopod|foto.*filtre|aksiyon.*kamera|fotoğraf/i.test(combined)) return 1000415;
    if (/tansiyon|medikal|hasta.*bakım|boru.*tipi.*yatak|hasta.*önlüğü/i.test(combined)) return 1000620;
    if (/dizüstü|notebook|laptop|macbook|thinkpad|ideapad|vostro|latitude|inspiron/i.test(combined)) return 1000271;
    if (/masaüstü|all-in-one|mini\s*pc|optiplex|prodesk|thinkcentre/i.test(combined)) return 1000273;
    if (/tablet|ipad|tab\s*[as]/i.test(combined)) return 1000354;

    return 1000212;
  }

  /**
   * Create or Save Product on N11 using the official N11 REST API (/ms/product/tasks/product-create)
   * with automatic task status verification and Slicer category adaptation
   */
  static async saveProduct(auth: N11Auth, product: N11ProductPayload): Promise<{
    success: boolean;
    n11Id?: string;
    groupId?: string | number;
    sellerNickname?: string;
    taskId?: string | number;
    message?: string;
  }> {
    const cleanAppKey = (auth.appKey || "").trim();
    const cleanAppSecret = (auth.appSecret || "").trim();
    if (!cleanAppKey || !cleanAppSecret) {
      return { success: false, message: "N11 AppKey veya AppSecret bilgisi eksik." };
    }

    const stockItem = product.stockItems?.[0] || {
      sellerStockCode: product.productSellerCode,
      quantity: 1,
      gtin: product.barcode
    };

    const stockCode = (stockItem.sellerStockCode || product.productSellerCode || "").trim();
    const barcode = (product.barcode || stockItem.gtin || stockCode).trim();
    const formattedPrice = Number(Number(product.price || 0).toFixed(2));
    const quantity = Math.max(0, Math.floor(Number(stockItem.quantity || 0)));

    const validImages = (product.images || [])
      .filter((img) => typeof img === "string" && img.trim().startsWith("http"))
      .slice(0, 8)
      .map((url, idx) => ({
        url: url.trim(),
        order: idx + 1
      }));

    if (validImages.length === 0) {
      validImages.push({
        url: "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&q=80",
        order: 1
      });
    }

    const currencyMap: Record<string, string> = {
      "1": "TL",
      "2": "USD",
      "3": "EUR",
      "TL": "TL",
      "TRY": "TL",
      "USD": "USD",
      "EUR": "EUR"
    };
    const currencyType = currencyMap[String(product.currencyType || "TL").toUpperCase()] || "TL";

    // Resolve Brand name from explicit product.brand, attributes, or title first word
    let resolvedBrand = String((product as any).brand || "").trim();
    if (!resolvedBrand && Array.isArray(product.attributes)) {
      const bAttr = product.attributes.find(
        (a: any) =>
          String(a?.name || "").toLowerCase() === "marka" ||
          String(a?.id || "") === "1"
      );
      if (bAttr) {
        resolvedBrand = String(bAttr.customValue || bAttr.value || "").trim();
      }
    }
    if (!resolvedBrand && product.title) {
      const firstToken = product.title.trim().split(/\s+/)[0] || "";
      if (firstToken.length >= 2 && !/^\d+$/.test(firstToken)) {
        resolvedBrand = firstToken;
      }
    }
    if (!resolvedBrand) {
      resolvedBrand = "Diğer";
    }

    // Fetch mandatory N11 attributes for the target category from N11 CDN API and populate Brand + mandatory fields
    const buildCompleteCategoryAttributes = async (catId: number): Promise<any[]> => {
      const attrMap = new Map<number, { id: number; valueId: number | null; customValue: string | null }>();

      // Preserve any valid caller-supplied numeric attribute IDs first
      if (Array.isArray(product.attributes)) {
        for (const a of product.attributes) {
          const numId = Number(a?.id);
          if (!isNaN(numId) && numId > 0 && (a.valueId || a.customValue || a.value)) {
            attrMap.set(numId, {
              id: numId,
              valueId: a.valueId ? Number(a.valueId) : null,
              customValue: a.valueId ? null : String(a.customValue || a.value || "").trim()
            });
          }
        }
      }

      try {
        const attrRes = await axios.get(`https://api.n11.com/cdn/category/${catId}/attribute`, {
          headers: {
            appkey: cleanAppKey,
            appsecret: cleanAppSecret,
            appKey: cleanAppKey,
            appSecret: cleanAppSecret,
            "Content-Type": "application/json"
          },
          timeout: 8000
        });

        const categoryAttributes: any[] = attrRes.data?.categoryAttributes || [];
        const normBrand = resolvedBrand.toLocaleLowerCase("tr-TR").trim();
        const titleLower = (product.title || "").toLocaleLowerCase("tr-TR");

        for (const catAttr of categoryAttributes) {
          const attrId = Number(catAttr.attributeId);
          if (!attrId || attrMap.has(attrId)) continue;

          const attrName = String(catAttr.attributeName || "").trim();
          const attrNameLower = attrName.toLocaleLowerCase("tr-TR");
          const isMandatory = Boolean(catAttr.isMandatory);
          const isCustomValue = Boolean(catAttr.isCustomValue);
          const values: Array<{ id: number; value: string }> = Array.isArray(catAttr.attributeValues)
            ? catAttr.attributeValues
            : [];

          // Always populate Marka (attributeId === 1 or name === "Marka")
          if (attrId === 1 || attrNameLower === "marka") {
            const exactBrand =
              values.find((v) => String(v.value || "").toLocaleLowerCase("tr-TR").trim() === normBrand) ||
              values.find((v) => String(v.value || "").toLowerCase().trim() === resolvedBrand.toLowerCase().trim());

            if (exactBrand) {
              attrMap.set(attrId, { id: attrId, valueId: Number(exactBrand.id), customValue: null });
            } else if (isCustomValue) {
              attrMap.set(attrId, { id: attrId, valueId: null, customValue: resolvedBrand });
            } else {
              const otherBrand = values.find((v) => /^diğer$/i.test(String(v.value || "").trim())) || values[0];
              if (otherBrand) {
                attrMap.set(attrId, { id: attrId, valueId: Number(otherBrand.id), customValue: null });
              }
            }
            continue;
          }

          if (!isMandatory) continue;

          // Smart matching for mandatory attributes
          if (attrNameLower === "model" || attrId === 425) {
            if (isCustomValue) {
              attrMap.set(attrId, {
                id: attrId,
                valueId: null,
                customValue: (stockCode || product.title || "Standart").substring(0, 40)
              });
              continue;
            }
          }

          if (attrNameLower === "renk" || attrId === 429) {
            const colorMatch = values.find((v) => {
              const vl = String(v.value || "").toLocaleLowerCase("tr-TR").trim();
              return vl.length >= 3 && titleLower.includes(vl);
            });
            if (colorMatch) {
              attrMap.set(attrId, { id: attrId, valueId: Number(colorMatch.id), customValue: null });
              continue;
            }
            if (isCustomValue) {
              attrMap.set(attrId, { id: attrId, valueId: null, customValue: "Siyah" });
              continue;
            }
          }

          if (attrNameLower === "seçenekler" || attrId === 6369) {
            if (isCustomValue) {
              attrMap.set(attrId, { id: attrId, valueId: null, customValue: "Standart" });
              continue;
            }
          }

          // Check if any allowed value appears in the product title
          const valueInTitle = values.find((v) => {
            const vl = String(v.value || "").toLocaleLowerCase("tr-TR").trim();
            return vl.length >= 2 && vl !== "diğer" && vl !== "var" && vl !== "yok" && titleLower.includes(vl);
          });
          if (valueInTitle) {
            attrMap.set(attrId, { id: attrId, valueId: Number(valueInTitle.id), customValue: null });
            continue;
          }

          // Fallback to "Diğer", "Belirtilmemiş", "Standart", "2 Yıl", etc.
          const safeFallback =
            values.find((v) => /^diğer$/i.test(String(v.value || "").trim())) ||
            values.find((v) => /diğer|belirtilmemiş|standart|resmi distribütör|ithalatçı|var|yok/i.test(String(v.value || ""))) ||
            values[0];

          if (safeFallback) {
            attrMap.set(attrId, { id: attrId, valueId: Number(safeFallback.id), customValue: null });
          } else if (isCustomValue) {
            attrMap.set(attrId, { id: attrId, valueId: null, customValue: "Standart" });
          }
        }
      } catch (attrErr) {
        // Fallback if CDN attribute endpoint is unreachable: still ensure Marka (id: 1) is sent
        if (!attrMap.has(1)) {
          attrMap.set(1, { id: 1, valueId: null, customValue: resolvedBrand });
        }
      }

      if (!attrMap.has(1)) {
        attrMap.set(1, { id: 1, valueId: null, customValue: resolvedBrand });
      }

      return Array.from(attrMap.values());
    };

    const executeRestCreate = async (catId: number, includeMainId: boolean) => {
      const resolvedAttributes = await buildCompleteCategoryAttributes(catId);
      const skuObj: any = {
        stockCode,
        barcode,
        title: (product.title || "").substring(0, 65),
        description: product.description ? `<p>${product.description}</p>` : `<p>${product.title}</p>`,
        categoryId: catId,
        currencyType,
        listPrice: formattedPrice,
        salePrice: formattedPrice,
        quantity,
        preparingDay: Number(product.preparingDay || 1),
        shipmentTemplate: product.shipmentTemplate || "alici",
        vatRate: Number(product.vatRate ?? 20),
        images: validImages,
        attributes: resolvedAttributes
      };

      if (includeMainId) {
        skuObj.productMainId = product.productMainId || `GRP-${stockCode}`;
      }

      const createRes = await axios.post(
        "https://api.n11.com/ms/product/tasks/product-create",
        {
          payload: {
            integrator: "LookPrice",
            skus: [skuObj]
          }
        },
        {
          headers: {
            appkey: cleanAppKey,
            appsecret: cleanAppSecret,
            appKey: cleanAppKey,
            appSecret: cleanAppSecret,
            "Content-Type": "application/json"
          },
          timeout: 15000
        }
      );

      const taskId = createRes.data?.id;
      if (!taskId) {
        return {
          status: "FAIL",
          reasons: [createRes.data?.errorMessage || "N11 görev ID'si alınamadı."],
          sku: null,
          taskId: null
        };
      }

      // Poll task-details up to 3 times (total ~4.5s) to get immediate N11 Product ID or validation reason
      for (let attempt = 0; attempt < 3; attempt++) {
        await new Promise((r) => setTimeout(r, attempt === 0 ? 1500 : 1500));
        try {
          const tdRes = await axios.post(
            "https://api.n11.com/ms/product/task-details/page-query",
            {
              taskId,
              pageable: { page: 0, size: 10 }
            },
            {
              headers: {
                appkey: cleanAppKey,
                appsecret: cleanAppSecret,
                appKey: cleanAppKey,
                appSecret: cleanAppSecret,
                "Content-Type": "application/json"
              },
              timeout: 10000
            }
          );

          const taskStatus = tdRes.data?.status;
          const skuContent = tdRes.data?.skus?.content?.[0];
          const reasons: string[] = skuContent?.reasons || skuContent?.sku?.reasons || [];
          const isStillQueued =
            taskStatus === "IN_QUEUE" ||
            reasons.some((r) => /işlenmeye alındı|kuyruğa alındı/i.test(String(r)));

          if (!isStillQueued && taskStatus === "PROCESSED" && skuContent) {
            return {
              status: skuContent.status,
              reasons,
              sku: skuContent.sku || null,
              taskId
            };
          }
          if (taskStatus === "PROCESSED" && !skuContent) {
            break;
          }
        } catch (pollErr) {
          // Ignore transient poll error
        }
      }

      return {
        status: "IN_QUEUE",
        reasons: ["Ürün N11 katalog kuyruğuna alındı."],
        sku: null,
        taskId
      };
    };

    try {
      let targetCatId = this.resolveCategoryIdForProduct(
        product.title,
        product.categoryName,
        product.subCategoryName,
        product.category?.id
      );
      let attemptResult = await executeRestCreate(targetCatId, true);

      // Check if N11 returned a specific category requirement or Slicer requirement
      if (attemptResult.status === "FAIL") {
        const joinedReasons = (attemptResult.reasons || []).join(" ");
        // Example: "1000363 id li Mouse kategorisinde mainId girişi zorunludur." or "Slicer False olan kategorilerde mainId girilmemelidir"
        const catMatch = joinedReasons.match(/(\d{5,9})\s*id\s*li/i);
        if (catMatch && Number(catMatch[1]) !== targetCatId) {
          targetCatId = Number(catMatch[1]);
        }

        if (/mainId\s*girilmemelidir|Slicer\s*False/i.test(joinedReasons)) {
          attemptResult = await executeRestCreate(targetCatId, false);
        } else if (catMatch) {
          attemptResult = await executeRestCreate(targetCatId, true);
        } else if (/Marka ve Kategori id değerlerini doğru girdiğinizi kontrol edin/i.test(joinedReasons) && targetCatId !== 1000212) {
          targetCatId = 1000212;
          attemptResult = await executeRestCreate(targetCatId, false);
        }

        // If N11 states the seller stock code or catalog item is already registered under this seller account, update its price & stock and treat as active!
        const updatedReasons = (attemptResult.reasons || []).join(" ");
        if (
          attemptResult.status === "FAIL" &&
          /seller stock code tarafınızdan kullanılmaktadır|ürün listenizde mevcuttur/i.test(updatedReasons)
        ) {
          await this.updatePriceAndStock(auth, stockCode, formattedPrice, quantity).catch(() => null);
          const existingIdMatch = updatedReasons.match(/(\d{6,12})\s*nolu\s*katalog\s*id/i);
          const resolvedExistingId = attemptResult.sku?.n11ProductId
            ? String(attemptResult.sku.n11ProductId)
            : existingIdMatch
            ? existingIdMatch[1]
            : stockCode;
          return {
            success: true,
            n11Id: resolvedExistingId,
            groupId: attemptResult.sku?.groupId,
            sellerNickname: attemptResult.sku?.sellerNickname,
            taskId: attemptResult.taskId || undefined,
            message: "Ürün N11 kataloğunuzda zaten kayıtlı; fiyat ve stok bilgisi güncellendi."
          };
        }
      }

      if (attemptResult.status === "FAIL") {
        return {
          success: false,
          taskId: attemptResult.taskId || undefined,
          message: (attemptResult.reasons || []).join(" | ") || "Ürün N11 tarafından reddedildi."
        };
      }

      const n11ProductId = attemptResult.sku?.n11ProductId
        ? String(attemptResult.sku.n11ProductId)
        : String(attemptResult.taskId || stockCode);

      return {
        success: true,
        n11Id: n11ProductId,
        groupId: attemptResult.sku?.groupId,
        sellerNickname: attemptResult.sku?.sellerNickname,
        taskId: attemptResult.taskId || undefined,
        message: (attemptResult.reasons || [])[0] || "Ürün başarıyla N11 kataloğuna eklendi."
      };
    } catch (err: any) {
      const apiErrMsg =
        err.response?.data?.errorMessage ||
        err.response?.data?.reasons?.join?.(" | ") ||
        err.message ||
        "N11 API bağlantı hatası";
      return {
        success: false,
        message: apiErrMsg
      };
    }
  }

  /**
   * Get Product Info by N11 Product ID (GetProductByProductId)
   */
  static async getProductByProductId(auth: N11Auth, productId: string | number): Promise<any> {
    const xml = this.buildSoapEnvelope(
      "GetProductByProductId",
      auth,
      `<productId>${productId}</productId>`
    );

    const res = await this.executeSoapRequest("ProductService", "GetProductByProductId", xml);

    if (res?.result?.status === "failure") {
      throw new Error(res.result.errorMessage || "N11 ürün bilgisi alınamadı.");
    }

    return res?.product || null;
  }

  /**
   * Get Product Info by Seller Product Code (GetProductBySellerCode)
   */
  static async getProductBySellerCode(auth: N11Auth, sellerCode: string): Promise<any> {
    const xml = this.buildSoapEnvelope(
      "GetProductBySellerCode",
      auth,
      `<sellerCode><![CDATA[${sellerCode}]]></sellerCode>`
    );

    const res = await this.executeSoapRequest("ProductService", "GetProductBySellerCode", xml);

    if (res?.result?.status === "failure") {
      throw new Error(res.result.errorMessage || "N11 mağaza ürün kodu ile ürün bilgisi alınamadı.");
    }

    return res?.product || null;
  }

  /**
   * List Products with Pagination (GetProductList)
   */
  static async getProductList(auth: N11Auth, currentPage = 0, pageSize = 100): Promise<{ products: any[]; pagingData?: any }> {
    const xml = this.buildSoapEnvelope(
      "GetProductList",
      auth,
      `<pagingData>
         <currentPage>${currentPage}</currentPage>
         <pageSize>${pageSize}</pageSize>
      </pagingData>`
    );

    const res = await this.executeSoapRequest("ProductService", "GetProductList", xml);

    if (res?.result?.status === "failure") {
      throw new Error(res.result.errorMessage || "N11 ürün listesi alınamadı.");
    }

    const rawProducts = res?.products?.product;
    const products = rawProducts ? (Array.isArray(rawProducts) ? rawProducts : [rawProducts]) : [];
    return {
      products,
      pagingData: res?.pagingData || null
    };
  }

  /**
   * Search Products on N11 (SearchProducts)
   */
  static async searchProducts(
    auth: N11Auth,
    query: {
      name?: string;
      startDate?: string;
      endDate?: string;
      approvalStatus?: string | number;
      currentPage?: number;
      pageSize?: number;
    }
  ): Promise<{ products: any[]; pagingData?: any }> {
    const currentPage = query.currentPage || 0;
    const pageSize = query.pageSize || 20;

    let searchXml = "";
    if (query.name) {
      searchXml += `<name><![CDATA[${query.name}]]></name>`;
    }
    if (query.startDate || query.endDate) {
      searchXml += `<saleDate>
        ${query.startDate ? `<startDate>${query.startDate}</startDate>` : ""}
        ${query.endDate ? `<endDate>${query.endDate}</endDate>` : ""}
      </saleDate>`;
    }
    if (query.approvalStatus !== undefined && query.approvalStatus !== null && query.approvalStatus !== "") {
      searchXml += `<approvalStatus>${query.approvalStatus}</approvalStatus>`;
    }

    const xml = this.buildSoapEnvelope(
      "SearchProducts",
      auth,
      `<pagingData>
         <currentPage>${currentPage}</currentPage>
         <pageSize>${pageSize}</pageSize>
      </pagingData>
      <productSearch>
         ${searchXml}
      </productSearch>`
    );

    const res = await this.executeSoapRequest("ProductService", "SearchProducts", xml);

    if (res?.result?.status === "failure") {
      throw new Error(res.result.errorMessage || "N11 ürün araması başarısız.");
    }

    const rawProducts = res?.products?.product;
    const products = rawProducts ? (Array.isArray(rawProducts) ? rawProducts : [rawProducts]) : [];
    return {
      products,
      pagingData: res?.pagingData || null
    };
  }

  /**
   * Delete Product by N11 Product ID (DeleteProductById)
   */
  static async deleteProductById(auth: N11Auth, productId: string | number): Promise<{ success: boolean; message?: string; product?: any }> {
    const xml = this.buildSoapEnvelope(
      "DeleteProductById",
      auth,
      `<productId>${productId}</productId>`
    );

    const res = await this.executeSoapRequest("ProductService", "DeleteProductById", xml);

    if (res?.result?.status === "failure") {
      return { success: false, message: res.result.errorMessage || "N11 ürün silme başarısız." };
    }

    return {
      success: true,
      message: "Ürün N11'den silindi.",
      product: res?.product || null
    };
  }

  /**
   * Delete Product by Seller Product Code (DeleteProductBySellerCode)
   */
  static async deleteProductBySellerCode(auth: N11Auth, sellerCode: string): Promise<{ success: boolean; message?: string; product?: any }> {
    const xml = this.buildSoapEnvelope(
      "DeleteProductBySellerCode",
      auth,
      `<productSellerCode><![CDATA[${sellerCode}]]></productSellerCode>`
    );

    const res = await this.executeSoapRequest("ProductService", "DeleteProductBySellerCode", xml);

    if (res?.result?.status === "failure") {
      return { success: false, message: res.result.errorMessage || "N11 ürün silme başarısız." };
    }

    return {
      success: true,
      message: "Ürün N11'den silindi.",
      product: res?.product || null
    };
  }

  /**
   * Update Discount Value by N11 Product ID (UpdateDiscountValueByProductId)
   */
  static async updateDiscountValueByProductId(
    auth: N11Auth,
    productId: string | number,
    discount: {
      discountType: number | string; // 1: Tutar, 2: Yüzde
      discountValue: number | string;
      discountStartDate?: string;
      discountEndDate?: string;
    }
  ): Promise<{ success: boolean; message?: string; product?: any }> {
    const xml = this.buildSoapEnvelope(
      "UpdateDiscountValueByProductId",
      auth,
      `<productId>${productId}</productId>
       <productDiscount>
          <discountType>${discount.discountType}</discountType>
          <discountValue>${discount.discountValue}</discountValue>
          ${discount.discountStartDate ? `<discountStartDate>${discount.discountStartDate}</discountStartDate>` : ""}
          ${discount.discountEndDate ? `<discountEndDate>${discount.discountEndDate}</discountEndDate>` : ""}
       </productDiscount>`
    );

    const res = await this.executeSoapRequest("ProductService", "UpdateDiscountValueByProductId", xml);

    if (res?.result?.status === "failure") {
      return { success: false, message: res.result.errorMessage || "İndirim tutarı güncellenemedi." };
    }

    return {
      success: true,
      message: "N11 ürün indirimi güncellendi.",
      product: res?.product || null
    };
  }

  /**
   * Update Discount Value by Seller Product Code (UpdateDiscountValueBySellerCode)
   */
  static async updateDiscountValueBySellerCode(
    auth: N11Auth,
    sellerCode: string,
    discount: {
      discountType: number | string; // 1: Tutar, 2: Yüzde
      discountValue: number | string;
      discountStartDate?: string;
      discountEndDate?: string;
    }
  ): Promise<{ success: boolean; message?: string; product?: any }> {
    const xml = this.buildSoapEnvelope(
      "UpdateDiscountValueBySellerCode",
      auth,
      `<productSellerCode><![CDATA[${sellerCode}]]></productSellerCode>
       <productDiscount>
          <discountType>${discount.discountType}</discountType>
          <discountValue>${discount.discountValue}</discountValue>
          ${discount.discountStartDate ? `<discountStartDate>${discount.discountStartDate}</discountStartDate>` : ""}
          ${discount.discountEndDate ? `<discountEndDate>${discount.discountEndDate}</discountEndDate>` : ""}
       </productDiscount>`
    );

    const res = await this.executeSoapRequest("ProductService", "UpdateDiscountValueBySellerCode", xml);

    if (res?.result?.status === "failure") {
      return { success: false, message: res.result.errorMessage || "İndirim tutarı güncellenemedi." };
    }

    return {
      success: true,
      message: "N11 ürün indirimi güncellendi.",
      product: res?.product || null
    };
  }

  /**
   * Update Product Price by N11 Product ID (UpdateProductPriceById)
   */
  static async updateProductPriceById(
    auth: N11Auth,
    productId: string | number,
    price: number,
    stockItems?: Array<{ sellerStockCode: string; optionPrice: number }>,
    currencyType: string = "TL"
  ): Promise<{ success: boolean; message?: string; product?: any }> {
    const stockItemsXml = (stockItems && stockItems.length > 0)
      ? `<stockItems>${stockItems.map(st => `<stockItem><sellerStockCode>${st.sellerStockCode}</sellerStockCode><optionPrice>${st.optionPrice}</optionPrice></stockItem>`).join("\n")}</stockItems>`
      : "";

    const xml = this.buildSoapEnvelope(
      "UpdateProductPriceById",
      auth,
      `<productId>${productId}</productId>
       <price>${price}</price>
       <currencyType>${currencyType}</currencyType>
       ${stockItemsXml}`
    );

    const res = await this.executeSoapRequest("ProductService", "UpdateProductPriceById", xml);

    if (res?.result?.status === "failure") {
      return { success: false, message: res.result.errorMessage || "Fiyat güncellenemedi." };
    }

    return {
      success: true,
      message: "N11 ürün fiyatı güncellendi.",
      product: res?.product || null
    };
  }

  /**
   * Update Product Price by Seller Code (UpdateProductPriceBySellerCode)
   */
  static async updateProductPriceBySellerCode(
    auth: N11Auth,
    sellerCode: string,
    price: number,
    stockItems?: Array<{ sellerStockCode: string; optionPrice: number }>,
    currencyType: string = "TL"
  ): Promise<{ success: boolean; message?: string; product?: any }> {
    const stockItemsXml = (stockItems && stockItems.length > 0)
      ? `<stockItems>${stockItems.map(st => `<stockItem><sellerStockCode>${st.sellerStockCode}</sellerStockCode><optionPrice>${st.optionPrice}</optionPrice></stockItem>`).join("\n")}</stockItems>`
      : "";

    const xml = this.buildSoapEnvelope(
      "UpdateProductPriceBySellerCode",
      auth,
      `<productSellerCode><![CDATA[${sellerCode}]]></productSellerCode>
       <price>${price}</price>
       <currencyType>${currencyType}</currencyType>
       ${stockItemsXml}`
    );

    const res = await this.executeSoapRequest("ProductService", "UpdateProductPriceBySellerCode", xml);

    if (res?.result?.status === "failure") {
      return { success: false, message: res.result.errorMessage || "Fiyat güncellenemedi." };
    }

    return {
      success: true,
      message: "N11 ürün fiyatı güncellendi.",
      product: res?.product || null
    };
  }

  /**
   * Update Basic Product Attributes (UpdateProductBasic)
   */
  static async updateProductBasic(
    auth: N11Auth,
    params: {
      productId?: string | number;
      productSellerCode?: string;
      price?: number;
      description?: string;
      discount?: {
        discountType: number | string;
        discountValue: number | string;
        discountStartDate?: string;
        discountEndDate?: string;
      };
      images?: string[];
      stockItems?: Array<{
        id?: string | number;
        sellerStockCode?: string;
        optionPrice?: number;
        quantity?: number;
      }>;
    }
  ): Promise<{ success: boolean; message?: string; product?: any }> {
    let innerXml = "";

    if (params.productId) {
      innerXml += `<productId>${params.productId}</productId>\n`;
    }
    if (params.productSellerCode) {
      innerXml += `<productSellerCode><![CDATA[${params.productSellerCode}]]></productSellerCode>\n`;
    }
    if (params.price !== undefined) {
      innerXml += `<price>${params.price}</price>\n`;
    }
    if (params.description) {
      innerXml += `<description><![CDATA[${params.description}]]></description>\n`;
    }
    if (params.discount) {
      innerXml += `<productDiscount>
        <discountType>${params.discount.discountType}</discountType>
        <discountValue>${params.discount.discountValue}</discountValue>
        <discountStartDate>${params.discount.discountStartDate || ""}</discountStartDate>
        <discountEndDate>${params.discount.discountEndDate || ""}</discountEndDate>
      </productDiscount>\n`;
    }
    if (params.images && params.images.length > 0) {
      const imgXml = params.images
        .filter(Boolean)
        .map((url, idx) => `<image><url>${url}</url><order>${idx + 1}</order></image>`)
        .join("\n");
      innerXml += `<images>${imgXml}</images>\n`;
    }
    if (params.stockItems && params.stockItems.length > 0) {
      const stockXml = params.stockItems
        .map(st => {
          let stXml = "<stockItem>";
          if (st.id) stXml += `<id>${st.id}</id>`;
          if (st.sellerStockCode) stXml += `<sellerStockCode>${st.sellerStockCode}</sellerStockCode>`;
          if (st.optionPrice !== undefined) stXml += `<optionPrice>${st.optionPrice}</optionPrice>`;
          if (st.quantity !== undefined) stXml += `<quantity>${st.quantity}</quantity>`;
          stXml += "</stockItem>";
          return stXml;
        })
        .join("\n");
      innerXml += `<stockItems>${stockXml}</stockItems>\n`;
    }

    const xml = this.buildSoapEnvelope("UpdateProductBasic", auth, innerXml);
    const res = await this.executeSoapRequest("ProductService", "UpdateProductBasic", xml);

    if (res?.result?.status === "failure") {
      return { success: false, message: res.result.errorMessage || "Temel ürün güncellenemedi." };
    }

    return {
      success: true,
      message: "N11 temel ürün özellikleri güncellendi.",
      product: res?.product || null
    };
  }

  /**
   * Product Approval Status Counts (ProductApprovalStatusRequest)
   */
  static async getProductApprovalStatusCounts(auth: N11Auth): Promise<any> {
    const xml = this.buildSoapEnvelope("ProductApprovalStatus", auth, "");
    const res = await this.executeSoapRequest("ProductService", "ProductApprovalStatus", xml);

    if (res?.result?.status === "failure") {
      throw new Error(res.result.errorMessage || "Ürün statü sayıları alınamadı.");
    }

    return res?.ProductApprovalStatusResponseResult || res || null;
  }

  /**
   * Start Selling Product by Product ID (StartSellingProductByProductId)
   */
  static async startSellingProductByProductId(auth: N11Auth, productId: string | number): Promise<{ success: boolean; message?: string; product?: any }> {
    const xml = this.buildSoapEnvelope(
      "StartSellingProductByProductId",
      auth,
      `<productId>${productId}</productId>`
    );

    const res = await this.executeSoapRequest("ProductSellingService", "StartSellingProductByProductId", xml);

    if (res?.result?.status === "failure") {
      return { success: false, message: res.result.errorMessage || "Ürün satışı başlatılamadı." };
    }

    return {
      success: true,
      message: "Ürün N11'de satışa açıldı.",
      product: res?.product || null
    };
  }

  /**
   * Start Selling Product by Seller Code (StartSellingProductBySellerCode)
   */
  static async startSellingProductBySellerCode(auth: N11Auth, sellerCode: string): Promise<{ success: boolean; message?: string; product?: any }> {
    const xml = this.buildSoapEnvelope(
      "StartSellingProductBySellerCode",
      auth,
      `<productSellerCode><![CDATA[${sellerCode}]]></productSellerCode>`
    );

    const res = await this.executeSoapRequest("ProductSellingService", "StartSellingProductBySellerCode", xml);

    if (res?.result?.status === "failure") {
      return { success: false, message: res.result.errorMessage || "Ürün satışı başlatılamadı." };
    }

    return {
      success: true,
      message: "Ürün N11'de satışa açıldı.",
      product: res?.product || null
    };
  }

  /**
   * Stop Selling Product by Product ID (StopSellingProductByProductId)
   */
  static async stopSellingProductByProductId(auth: N11Auth, productId: string | number): Promise<{ success: boolean; message?: string; product?: any }> {
    const xml = this.buildSoapEnvelope(
      "StopSellingProductByProductId",
      auth,
      `<productId>${productId}</productId>`
    );

    const res = await this.executeSoapRequest("ProductSellingService", "StopSellingProductByProductId", xml);

    if (res?.result?.status === "failure") {
      return { success: false, message: res.result.errorMessage || "Ürün satışı durdurulamadı." };
    }

    return {
      success: true,
      message: "Ürün N11'de satışa kapatıldı.",
      product: res?.product || null
    };
  }

  /**
   * Stop Selling Product by Seller Code (StopSellingProductBySellerCode)
   */
  static async stopSellingProductBySellerCode(auth: N11Auth, sellerCode: string): Promise<{ success: boolean; message?: string; product?: any }> {
    const xml = this.buildSoapEnvelope(
      "StopSellingProductBySellerCode",
      auth,
      `<productSellerCode><![CDATA[${sellerCode}]]></productSellerCode>`
    );

    const res = await this.executeSoapRequest("ProductSellingService", "StopSellingProductBySellerCode", xml);

    if (res?.result?.status === "failure") {
      return { success: false, message: res.result.errorMessage || "Ürün satışı durdurulamadı." };
    }

    return {
      success: true,
      message: "Ürün N11'de satışa kapatıldı.",
      product: res?.product || null
    };
  }

  /**
   * ProductStockService: Get Product Stock by N11 Product ID
   */
  static async getProductStockByProductId(auth: N11Auth, productId: string | number): Promise<any[]> {
    const xml = this.buildSoapEnvelope("GetProductStockByProductId", auth, `<productId>${productId}</productId>`);
    const res = await this.executeSoapRequest("ProductStockService", "GetProductStockByProductId", xml);

    if (res?.result?.status === "failure") {
      throw new Error(res.result.errorMessage || "N11 stok bilgisi alınamadı.");
    }

    const items = res?.stockItems?.stockItem;
    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }

  /**
   * ProductStockService: Get Product Stock by Seller Product Code
   */
  static async getProductStockBySellerCode(auth: N11Auth, sellerCode: string): Promise<any[]> {
    const xml = this.buildSoapEnvelope("GetProductStockByProductSellerCode", auth, `<productSellerCode><![CDATA[${sellerCode}]]></productSellerCode>`);
    const res = await this.executeSoapRequest("ProductStockService", "GetProductStockByProductSellerCode", xml);

    if (res?.result?.status === "failure") {
      throw new Error(res.result.errorMessage || "N11 stok bilgisi alınamadı.");
    }

    const items = res?.stockItems?.stockItem;
    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }

  /**
   * ProductStockService: Update Stock by Stock ID
   */
  static async updateStockByStockId(
    auth: N11Auth,
    stockItems: Array<{ id: string | number; quantity: number; version?: number }>
  ): Promise<{ success: boolean; message?: string; stockItems?: any[] }> {
    const stockItemsXml = stockItems
      .map(st => `<stockItem><id>${st.id}</id><quantity>${st.quantity}</quantity>${st.version !== undefined ? `<version>${st.version}</version>` : ""}</stockItem>`)
      .join("\n");

    const xml = this.buildSoapEnvelope("UpdateStockByStockId", auth, `<stockItems>${stockItemsXml}</stockItems>`);
    const res = await this.executeSoapRequest("ProductStockService", "UpdateStockByStockId", xml);

    if (res?.result?.status === "failure") {
      return { success: false, message: res.result.errorMessage || "N11 stok güncelleme başarısız." };
    }

    const items = res?.stockItems?.stockItem;
    return {
      success: true,
      message: "N11 stok miktarı güncellendi.",
      stockItems: items ? (Array.isArray(items) ? items : [items]) : []
    };
  }

  /**
   * ProductStockService: Update Stock by Stock Seller Code
   */
  static async updateStockByStockSellerCode(
    auth: N11Auth,
    stockItems: Array<{ sellerStockCode: string; quantity: number; version?: number }>
  ): Promise<{ success: boolean; message?: string; stockItems?: any[] }> {
    const stockItemsXml = stockItems
      .map(st => `<stockItem><sellerStockCode><![CDATA[${st.sellerStockCode}]]></sellerStockCode><quantity>${st.quantity}</quantity>${st.version !== undefined ? `<version>${st.version}</version>` : ""}</stockItem>`)
      .join("\n");

    const xml = this.buildSoapEnvelope("UpdateStockByStockSellerCode", auth, `<stockItems>${stockItemsXml}</stockItems>`);
    const res = await this.executeSoapRequest("ProductStockService", "UpdateStockByStockSellerCode", xml);

    if (res?.result?.status === "failure") {
      return { success: false, message: res.result.errorMessage || "N11 stok güncelleme başarısız." };
    }

    const items = res?.stockItems?.stockItem;
    return {
      success: true,
      message: "N11 stok miktarı güncellendi.",
      stockItems: items ? (Array.isArray(items) ? items : [items]) : []
    };
  }

  /**
   * ProductStockService: Delete and Update Stock by Stock Attributes
   */
  static async deleteAndUpdateStockByStockAttributes(
    auth: N11Auth,
    productId: string | number,
    stockItems: Array<{ attributes: Array<{ name: string; value: string }>; quantity: number; version?: number }>
  ): Promise<{ success: boolean; message?: string; stockItems?: any[] }> {
    const stockItemsXml = stockItems
      .map(st => {
        const attrXml = st.attributes.map(a => `<attribute><name><![CDATA[${a.name}]]></name><value><![CDATA[${a.value}]]></value></attribute>`).join("");
        return `<stockItem><attributes>${attrXml}</attributes><quantity>${st.quantity}</quantity>${st.version !== undefined ? `<version>${st.version}</version>` : ""}</stockItem>`;
      })
      .join("\n");

    const xml = this.buildSoapEnvelope(
      "DeleteAndUpdateStockByStockAttributes",
      auth,
      `<product><id>${productId}</id><stockItems>${stockItemsXml}</stockItems></product>`
    );
    const res = await this.executeSoapRequest("ProductStockService", "DeleteAndUpdateStockByStockAttributes", xml);

    if (res?.result?.status === "failure") {
      return { success: false, message: res.result.errorMessage || "Varyant stok güncelleme başarısız." };
    }

    const items = res?.stockItems?.stockItem;
    return {
      success: true,
      message: "Varyant stokları güncellendi.",
      stockItems: items ? (Array.isArray(items) ? items : [items]) : []
    };
  }

  /**
   * ProductStockService: Increase Stock by Stock ID
   */
  static async increaseStockByStockId(
    auth: N11Auth,
    stockItems: Array<{ id: string | number; quantityToIncrease: number; version?: number }>
  ): Promise<{ success: boolean; message?: string; stockItems?: any[] }> {
    const stockItemsXml = stockItems
      .map(st => `<stockItem><id>${st.id}</id><quantityToIncrease>${st.quantityToIncrease}</quantityToIncrease>${st.version !== undefined ? `<version>${st.version}</version>` : ""}</stockItem>`)
      .join("\n");

    const xml = this.buildSoapEnvelope("IncreaseStockByStockId", auth, `<stockItems>${stockItemsXml}</stockItems>`);
    const res = await this.executeSoapRequest("ProductStockService", "IncreaseStockByStockId", xml);

    if (res?.result?.status === "failure") {
      return { success: false, message: res.result.errorMessage || "Stok arttırma başarısız." };
    }

    const items = res?.stockItems?.stockItem;
    return {
      success: true,
      message: "N11 stok miktarı arttırıldı.",
      stockItems: items ? (Array.isArray(items) ? items : [items]) : []
    };
  }

  /**
   * ProductStockService: Increase Stock by Stock Seller Code
   */
  static async increaseStockByStockSellerCode(
    auth: N11Auth,
    stockItems: Array<{ sellerStockCode: string; quantityToIncrease: number; version?: number }>
  ): Promise<{ success: boolean; message?: string; stockItems?: any[] }> {
    const stockItemsXml = stockItems
      .map(st => `<stockItem><sellerStockCode><![CDATA[${st.sellerStockCode}]]></sellerStockCode><quantityToIncrease>${st.quantityToIncrease}</quantityToIncrease>${st.version !== undefined ? `<version>${st.version}</version>` : ""}</stockItem>`)
      .join("\n");

    const xml = this.buildSoapEnvelope("IncreaseStockByStockSellerCode", auth, `<stockItems>${stockItemsXml}</stockItems>`);
    const res = await this.executeSoapRequest("ProductStockService", "IncreaseStockByStockSellerCode", xml);

    if (res?.result?.status === "failure") {
      return { success: false, message: res.result.errorMessage || "Stok arttırma başarısız." };
    }

    const items = res?.stockItems?.stockItem;
    return {
      success: true,
      message: "N11 stok miktarı arttırıldı.",
      stockItems: items ? (Array.isArray(items) ? items : [items]) : []
    };
  }

  /**
   * ProductStockService: Increase Stock by Stock Attributes
   */
  static async increaseStockByStockAttributes(
    auth: N11Auth,
    productId: string | number,
    stockItems: Array<{ attributes: Array<{ name: string; value: string }>; quantityToIncrease: number; version?: number }>
  ): Promise<{ success: boolean; message?: string; stockItems?: any[] }> {
    const stockItemsXml = stockItems
      .map(st => {
        const attrXml = st.attributes.map(a => `<attribute><name><![CDATA[${a.name}]]></name><value><![CDATA[${a.value}]]></value></attribute>`).join("");
        return `<stockItem><attributes>${attrXml}</attributes><quantityToIncrease>${st.quantityToIncrease}</quantityToIncrease>${st.version !== undefined ? `<version>${st.version}</version>` : ""}</stockItem>`;
      })
      .join("\n");

    const xml = this.buildSoapEnvelope(
      "IncreaseStockByStockAttributes",
      auth,
      `<product><id>${productId}</id><stockItems>${stockItemsXml}</stockItems></product>`
    );
    const res = await this.executeSoapRequest("ProductStockService", "IncreaseStockByStockAttributes", xml);

    if (res?.result?.status === "failure") {
      return { success: false, message: res.result.errorMessage || "Varyant stok arttırma başarısız." };
    }

    const items = res?.stockItems?.stockItem;
    return {
      success: true,
      message: "Varyant stok miktarları arttırıldı.",
      stockItems: items ? (Array.isArray(items) ? items : [items]) : []
    };
  }

  /**
   * Update Product Price & Stock in N11 using the modern REST API or SOAP fallback
   */
  static async updatePriceAndStock(
    auth: N11Auth,
    productSellerCode: string,
    price: number,
    quantity: number
  ): Promise<{ success: boolean; message?: string }> {
    const formattedPrice = Number(price.toFixed(2));
    const formattedQuantity = Math.max(0, Math.floor(quantity));

    const requestBody = {
      payload: {
        integrator: "LookPrice",
        skus: [
          {
            stockCode: productSellerCode,
            listPrice: formattedPrice,
            salePrice: formattedPrice,
            quantity: formattedQuantity,
            currencyType: "TL"
          }
        ]
      }
    };

    // 1. Try modern N11 REST API (price-stock-update)
    try {
      const res = await axios.post("https://api.n11.com/ms/product/tasks/price-stock-update", requestBody, {
        headers: {
          "appKey": auth.appKey.trim(),
          "appSecret": auth.appSecret.trim(),
          "appkey": auth.appKey.trim(),
          "appsecret": auth.appSecret.trim(),
          "Content-Type": "application/json"
        },
        timeout: 10000
      });

      if (res.status === 200 || res.status === 201 || res.status === 202) {
        return { 
          success: true, 
          message: `N11 REST API fiyat ve stok güncelleme görevi oluşturuldu. Task ID: ${res.data?.id || res.data?.taskId || "N/A"}` 
        };
      }
    } catch (restErr: any) {
      // Quiet fallback without throwing or spamming error logs
    }

    // 2. SOAP Fallback (using SOAP UpdateProductPriceBySellerCode + UpdateStockByStockSellerCode)
    try {
      // Use full stockItems structure required by N11 SOAP ProductService
      const priceRes = await this.updateProductPriceBySellerCode(
        auth,
        productSellerCode,
        formattedPrice,
        [{ sellerStockCode: productSellerCode, optionPrice: formattedPrice }]
      );

      const stockRes = await this.updateStockByStockSellerCode(auth, [{ sellerStockCode: productSellerCode, quantity: formattedQuantity }]);

      if (priceRes?.success || stockRes?.success) {
        return { 
          success: true, 
          message: `N11 ürün fiyatı ve stok miktarı SOAP ile güncellendi.${stockRes.success ? "" : ` (Stok uyarısı: ${stockRes.message})`}` 
        };
      }

      // If seller code lookup failed and productSellerCode is numeric, try updateProductPriceById
      if (/^\d+$/.test(productSellerCode)) {
        const idRes = await this.updateProductPriceById(
          auth,
          productSellerCode,
          formattedPrice,
          [{ sellerStockCode: productSellerCode, optionPrice: formattedPrice }]
        );
        if (idRes.success) {
          return { success: true, message: `N11 ürün fiyatı ID ile güncellendi.` };
        }
      }

      return {
        success: false,
        message: priceRes?.message || "N11 güncelleme tamamlanamadı (Satıcı stok kodu veya N11 katalog kaydı doğrulanamadı)."
      };
    } catch (err: any) {
      return { 
        success: false, 
        message: `N11 güncelleme tamamlanamadı. (RestAPI ve SOAP servisleri yanıt vermedi)` 
      };
    }
  }

  /**
   * OrderService: Fetch Detailed Orders List (DetailedOrderList)
   */
  static async getDetailedOrders(
    auth: N11Auth,
    searchFilter: {
      productId?: string | number;
      status?: string;
      buyerName?: string;
      orderNumber?: string;
      productSellerCode?: string;
      recipient?: string;
      startDate?: string;
      endDate?: string;
      sortForUpdateDate?: boolean;
      currentPage?: number;
      pageSize?: number;
    } | string = "Approved"
  ): Promise<any> {
    if (typeof searchFilter === "string") {
      searchFilter = { status: searchFilter };
    }

    let searchXml = "";
    if (searchFilter.productId) searchXml += `<productId>${searchFilter.productId}</productId>\n`;
    if (searchFilter.status) searchXml += `<status>${searchFilter.status}</status>\n`;
    if (searchFilter.buyerName) searchXml += `<buyerName><![CDATA[${searchFilter.buyerName}]]></buyerName>\n`;
    if (searchFilter.orderNumber) searchXml += `<orderNumber>${searchFilter.orderNumber}</orderNumber>\n`;
    if (searchFilter.productSellerCode) searchXml += `<productSellerCode><![CDATA[${searchFilter.productSellerCode}]]></productSellerCode>\n`;
    if (searchFilter.recipient) searchXml += `<recipient><![CDATA[${searchFilter.recipient}]]></recipient>\n`;
    if (searchFilter.startDate || searchFilter.endDate) {
      searchXml += `<period>
        ${searchFilter.startDate ? `<startDate>${searchFilter.startDate}</startDate>` : ""}
        ${searchFilter.endDate ? `<endDate>${searchFilter.endDate}</endDate>` : ""}
      </period>\n`;
    }
    if (searchFilter.sortForUpdateDate) {
      searchXml += `<sortForUpdateDate>${searchFilter.sortForUpdateDate}</sortForUpdateDate>\n`;
    }

    const currentPage = searchFilter.currentPage || 0;
    const pageSize = searchFilter.pageSize || 100;

    const innerBody = `
       <searchData>
          ${searchXml}
       </searchData>
       <pagingData>
          <currentPage>${currentPage}</currentPage>
          <pageSize>${pageSize}</pageSize>
       </pagingData>
    `;

    const xml = this.buildSoapEnvelope("DetailedOrderList", auth, innerBody);
    const res = await this.executeSoapRequest("OrderService", "DetailedOrderList", xml);

    if (res?.result?.status === "failure") {
      throw new Error(res.result.errorMessage || "N11 detaylı sipariş listesi alınamadı.");
    }

    const orderList = res?.orderList?.order;
    const orders = orderList ? (Array.isArray(orderList) ? orderList : [orderList]) : [];
    
    // Return array directly for backward compatibility with existing sync, or array with pagingData if requested
    return orders;
  }

  /**
   * OrderService: Fetch Summary Order List (OrderList)
   */
  static async getOrderList(
    auth: N11Auth,
    searchFilter: {
      productId?: string | number;
      status?: string;
      buyerName?: string;
      orderNumber?: string;
      productSellerCode?: string;
      recipient?: string;
      startDate?: string;
      endDate?: string;
      sortForUpdateDate?: boolean;
      currentPage?: number;
      pageSize?: number;
    } = {}
  ): Promise<{ orders: any[]; pagingData?: any }> {
    let searchXml = "";
    if (searchFilter.productId) searchXml += `<productId>${searchFilter.productId}</productId>\n`;
    if (searchFilter.status) searchXml += `<status>${searchFilter.status}</status>\n`;
    if (searchFilter.buyerName) searchXml += `<buyerName><![CDATA[${searchFilter.buyerName}]]></buyerName>\n`;
    if (searchFilter.orderNumber) searchXml += `<orderNumber>${searchFilter.orderNumber}</orderNumber>\n`;
    if (searchFilter.productSellerCode) searchXml += `<productSellerCode><![CDATA[${searchFilter.productSellerCode}]]></productSellerCode>\n`;
    if (searchFilter.recipient) searchXml += `<recipient><![CDATA[${searchFilter.recipient}]]></recipient>\n`;
    if (searchFilter.startDate || searchFilter.endDate) {
      searchXml += `<period>
        ${searchFilter.startDate ? `<startDate>${searchFilter.startDate}</startDate>` : ""}
        ${searchFilter.endDate ? `<endDate>${searchFilter.endDate}</endDate>` : ""}
      </period>\n`;
    }
    if (searchFilter.sortForUpdateDate) {
      searchXml += `<sortForUpdateDate>${searchFilter.sortForUpdateDate}</sortForUpdateDate>\n`;
    }

    const currentPage = searchFilter.currentPage || 0;
    const pageSize = searchFilter.pageSize || 100;

    const innerBody = `
       <searchData>
          ${searchXml}
       </searchData>
       <pagingData>
          <currentPage>${currentPage}</currentPage>
          <pageSize>${pageSize}</pageSize>
       </pagingData>
    `;

    const xml = this.buildSoapEnvelope("OrderList", auth, innerBody);
    const res = await this.executeSoapRequest("OrderService", "OrderList", xml);

    if (res?.result?.status === "failure") {
      throw new Error(res.result.errorMessage || "N11 sipariş özeti alınamadı.");
    }

    const orderList = res?.orderList?.order;
    const orders = orderList ? (Array.isArray(orderList) ? orderList : [orderList]) : [];
    return {
      orders,
      pagingData: res?.pagingData || null
    };
  }

  /**
   * OrderService: Fetch Order Detail by Order ID (OrderDetail)
   */
  static async getOrderDetail(auth: N11Auth, orderId: string | number): Promise<any> {
    const xml = this.buildSoapEnvelope("OrderDetail", auth, `<orderRequest><id>${orderId}</id></orderRequest>`);
    const res = await this.executeSoapRequest("OrderService", "OrderDetail", xml);

    if (res?.result?.status === "failure") {
      throw new Error(res.result.errorMessage || "N11 sipariş detayı alınamadı.");
    }

    return res?.orderDetail || null;
  }

  /**
   * OrderService: Accept Order Item (OrderItemAccept)
   */
  static async acceptOrderItem(
    auth: N11Auth,
    orderItemId: string | number,
    numberOfPackages: number = 1
  ): Promise<{ success: boolean; message?: string; orderItemList?: any[] }> {
    const innerBody = `
      <orderItemList>
         <orderItem>
            <id>${orderItemId}</id>
         </orderItem>
      </orderItemList>
      <numberOfPackages>${numberOfPackages}</numberOfPackages>
    `;

    const xml = this.buildSoapEnvelope("OrderItemAccept", auth, innerBody);
    const res = await this.executeSoapRequest("OrderService", "OrderItemAccept", xml);

    if (res?.result?.status === "failure") {
      return { success: false, message: res.result.errorMessage || "Sipariş kalemi onaylanamadı." };
    }

    const items = res?.orderItemList?.orderItem;
    return {
      success: true,
      message: "Sipariş kalemi onaylandı.",
      orderItemList: items ? (Array.isArray(items) ? items : [items]) : []
    };
  }

  /**
   * OrderService: Reject Order Item (OrderItemReject)
   */
  static async rejectOrderItem(
    auth: N11Auth,
    orderItemId: string | number,
    rejectReason: string = "Ürün stoklarımızda bulunmamaktadır.",
    rejectReasonType: string = "OUT_OF_STOCK"
  ): Promise<{ success: boolean; message?: string; orderItemList?: any[] }> {
    const innerBody = `
      <orderItemList>
         <orderItem>
            <id>${orderItemId}</id>
         </orderItem>
      </orderItemList>
      <rejectReason><![CDATA[${rejectReason}]]></rejectReason>
      <rejectReasonType>${rejectReasonType}</rejectReasonType>
    `;

    const xml = this.buildSoapEnvelope("OrderItemReject", auth, innerBody);
    const res = await this.executeSoapRequest("OrderService", "OrderItemReject", xml);

    if (res?.result?.status === "failure") {
      return { success: false, message: res.result.errorMessage || "Sipariş kalemi reddedilemedi." };
    }

    const items = res?.orderItemList?.orderItem;
    return {
      success: true,
      message: "Sipariş kalemi reddedildi.",
      orderItemList: items ? (Array.isArray(items) ? items : [items]) : []
    };
  }

  /**
   * OrderService: Make Order Item Shipment (MakeOrderItemShipment)
   */
  static async makeOrderItemShipment(
    auth: N11Auth,
    params: {
      orderItemId: string | number;
      shipmentCompanyId: string | number;
      campaignNumber?: string;
      trackingNumber?: string;
      shipmentMethod?: number | string;
    }
  ): Promise<{ success: boolean; message?: string; orderItemList?: any[] }> {
    const innerBody = `
      <orderItemList>
         <orderItem>
            <id>${params.orderItemId}</id>
            <shipmentInfo>
               <shipmentCompany>
                  <id>${params.shipmentCompanyId}</id>
               </shipmentCompany>
               ${params.campaignNumber ? `<campaignNumber>${params.campaignNumber}</campaignNumber>` : ""}
               ${params.trackingNumber ? `<trackingNumber>${params.trackingNumber}</trackingNumber>` : ""}
               <shipmentMethod>${params.shipmentMethod || 1}</shipmentMethod>
            </shipmentInfo>
         </orderItem>
      </orderItemList>
    `;

    const xml = this.buildSoapEnvelope("MakeOrderItemShipment", auth, innerBody);
    const res = await this.executeSoapRequest("OrderService", "MakeOrderItemShipment", xml);

    if (res?.result?.status === "failure") {
      return { success: false, message: res.result.errorMessage || "Kargoya verme işlemi başarısız." };
    }

    const items = res?.orderItemList?.orderItem;
    return {
      success: true,
      message: "Sipariş kalemi kargoya verildi.",
      orderItemList: items ? (Array.isArray(items) ? items : [items]) : []
    };
  }

  /**
   * ShipmentCompanyService: Get Shipment Companies List (GetShipmentCompanies) - Public Endpoint
   */
  static async getShipmentCompanies(auth?: N11Auth | null): Promise<any[]> {
    const xml = this.buildSoapEnvelope("GetShipmentCompanies", auth, "");
    const res = await this.executeSoapRequest("ShipmentCompanyService", "GetShipmentCompanies", xml);

    if (res?.result?.status === "failure") {
      throw new Error(res.result.errorMessage || "Kargo firmaları çekilemedi.");
    }

    const companies = res?.shipmentCompanies?.shipmentCompany;
    if (!companies) return [];
    return Array.isArray(companies) ? companies : [companies];
  }

  /**
   * ShipmentService: Get Single Shipment Template Details (GetShipmentTemplate)
   */
  static async getShipmentTemplate(auth: N11Auth, name: string): Promise<any> {
    const xml = this.buildSoapEnvelope("GetShipmentTemplate", auth, `<name><![CDATA[${name}]]></name>`);
    const res = await this.executeSoapRequest("ShipmentService", "GetShipmentTemplate", xml);

    if (res?.result?.status === "failure") {
      throw new Error(res.result.errorMessage || "Teslimat şablonu çekilemedi.");
    }

    return res?.shipmentTemplate || null;
  }

  /**
   * ShipmentService: Get All Shipment Templates List (GetShipmentTemplateList)
   */
  static async getShipmentTemplateList(auth: N11Auth): Promise<any[]> {
    const xml = this.buildSoapEnvelope("GetShipmentTemplateList", auth, "");
    const res = await this.executeSoapRequest("ShipmentService", "GetShipmentTemplateList", xml);

    if (res?.result?.status === "failure") {
      throw new Error(res.result.errorMessage || "Kargo şablonları listesi çekilemedi.");
    }

    const templates = res?.shipmentTemplates?.shipmentTemplate;
    if (!templates) return [];
    return Array.isArray(templates) ? templates : [templates];
  }

  /**
   * ShipmentService: Create or Update Shipment Template (CreateOrUpdateShipmentTemplate)
   */
  static async createOrUpdateShipmentTemplate(auth: N11Auth, shipment: any): Promise<{ success: boolean; message?: string; shipmentTemplate?: any }> {
    let shipmentXml = "<shipment>\n";
    if (shipment.templateName) shipmentXml += `<templateName><![CDATA[${shipment.templateName}]]></templateName>\n`;
    if (shipment.installmentInfo) shipmentXml += `<installmentInfo><![CDATA[${shipment.installmentInfo}]]></installmentInfo>\n`;
    if (shipment.exchangeInfo) shipmentXml += `<exchangeInfo><![CDATA[${shipment.exchangeInfo}]]></exchangeInfo>\n`;
    if (shipment.shippingInfo) shipmentXml += `<shippingInfo><![CDATA[${shipment.shippingInfo}]]></shippingInfo>\n`;
    if (shipment.specialDelivery !== undefined) shipmentXml += `<specialDelivery>${shipment.specialDelivery}</specialDelivery>\n`;
    if (shipment.deliveryFeeType) shipmentXml += `<deliveryFeeType>${shipment.deliveryFeeType}</deliveryFeeType>\n`;
    if (shipment.combinedShipmentAllowed !== undefined) shipmentXml += `<combinedShipmentAllowed>${shipment.combinedShipmentAllowed}</combinedShipmentAllowed>\n`;
    if (shipment.shipmentMethod) shipmentXml += `<shipmentMethod>${shipment.shipmentMethod}</shipmentMethod>\n`;
    
    if (shipment.warehouseAddress) {
      shipmentXml += `<warehouseAddress>
        <title><![CDATA[${shipment.warehouseAddress.title || ""}]]></title>
        <address><![CDATA[${shipment.warehouseAddress.address || ""}]]></address>
        <city><code>${shipment.warehouseAddress.cityCode || ""}</code><name><![CDATA[${shipment.warehouseAddress.cityName || ""}]]></name></city>
        <district><id>${shipment.warehouseAddress.districtId || ""}</id><name><![CDATA[${shipment.warehouseAddress.districtName || ""}]]></name></district>
        <postalCode>${shipment.warehouseAddress.postalCode || ""}</postalCode>
      </warehouseAddress>\n`;
    }

    if (shipment.exchangeAddress) {
      shipmentXml += `<exchangeAddress>
        <title><![CDATA[${shipment.exchangeAddress.title || ""}]]></title>
        <address><![CDATA[${shipment.exchangeAddress.address || ""}]]></address>
        <city><code>${shipment.exchangeAddress.cityCode || ""}</code><name><![CDATA[${shipment.exchangeAddress.cityName || ""}]]></name></city>
        <district><id>${shipment.exchangeAddress.districtId || ""}</id><name><![CDATA[${shipment.exchangeAddress.districtName || ""}]]></name></district>
        <postalCode>${shipment.exchangeAddress.postalCode || ""}</postalCode>
      </exchangeAddress>\n`;
    }

    if (shipment.shipmentCompanies && shipment.shipmentCompanies.length > 0) {
      shipmentXml += `<shipmentCompanies>${shipment.shipmentCompanies.map((c: any) => `<shipmentCompany><name><![CDATA[${c.name}]]></name><shortName>${c.shortName}</shortName></shipmentCompany>`).join("")}</shipmentCompanies>\n`;
    }

    if (shipment.claimShipmentCompany) {
      shipmentXml += `<claimShipmentCompany><name><![CDATA[${shipment.claimShipmentCompany.name}]]></name><shortName>${shipment.claimShipmentCompany.shortName}</shortName></claimShipmentCompany>\n`;
    }

    if (shipment.useDmallCargo !== undefined) shipmentXml += `<useDmallCargo>${shipment.useDmallCargo}</useDmallCargo>\n`;
    shipmentXml += "</shipment>";

    const xml = this.buildSoapEnvelope("CreateOrUpdateShipmentTemplate", auth, shipmentXml);
    const res = await this.executeSoapRequest("ShipmentService", "CreateOrUpdateShipmentTemplate", xml);

    if (res?.result?.status === "failure") {
      return { success: false, message: res.result.errorMessage || "Teslimat şablonu oluşturulamadı." };
    }

    return {
      success: true,
      message: "Teslimat şablonu başarıyla güncellendi.",
      shipmentTemplate: res?.shipmentTemplate || null
    };
  }

  /**
   * CityService: List all cities (GetCities) - Public endpoint
   */
  static async getCities(auth?: N11Auth | null): Promise<any[]> {
    const xml = this.buildSoapEnvelope("GetCities", auth, "");
    const res = await this.executeSoapRequest("CityService", "GetCities", xml);

    if (res?.result?.status === "failure") {
      throw new Error(res.result.errorMessage || "N11 Şehir listesi alınamadı.");
    }

    const cityList = res?.cities?.city;
    if (!cityList) return [];
    return Array.isArray(cityList) ? cityList : [cityList];
  }

  /**
   * CityService: Get single city info (GetCity) - Public endpoint
   */
  static async getCity(cityCode: string | number, auth?: N11Auth | null): Promise<any> {
    const codeStr = String(cityCode).padStart(2, '0');
    const xml = this.buildSoapEnvelope("GetCity", auth, `<cityCode>${codeStr}</cityCode>`);
    const res = await this.executeSoapRequest("CityService", "GetCity", xml);

    if (res?.result?.status === "failure") {
      throw new Error(res.result.errorMessage || "N11 Şehir bilgisi alınamadı.");
    }

    return res?.city || null;
  }

  /**
   * CityService: Get districts for a city code (GetDistrict) - Public endpoint
   */
  static async getDistricts(cityCode: string | number, auth?: N11Auth | null): Promise<any[]> {
    const codeStr = String(cityCode).padStart(2, '0');
    const xml = this.buildSoapEnvelope("GetDistrict", auth, `<cityCode>${codeStr}</cityCode>`);
    const res = await this.executeSoapRequest("CityService", "GetDistrict", xml);

    if (res?.result?.status === "failure") {
      throw new Error(res.result.errorMessage || "N11 İlçe listesi alınamadı.");
    }

    const districtList = res?.districts?.district;
    if (!districtList) return [];
    return Array.isArray(districtList) ? districtList : [districtList];
  }

  /**
   * CityService: Get neighborhoods for a district ID (GetNeighborhoods) - Public endpoint
   */
  static async getNeighborhoods(districtId: string | number, auth?: N11Auth | null): Promise<any[]> {
    const xml = this.buildSoapEnvelope("GetNeighborhoods", auth, `<districtId>${districtId}</districtId>`);
    const res = await this.executeSoapRequest("CityService", "GetNeighborhoods", xml);

    if (res?.result?.status === "failure") {
      throw new Error(res.result.errorMessage || "N11 Mahalle listesi alınamadı.");
    }

    const neighborhoodList = res?.neighborhoods?.neighborhood;
    if (!neighborhoodList) return [];
    return Array.isArray(neighborhoodList) ? neighborhoodList : [neighborhoodList];
  }

  /**
   * Match Remote N11 Listings with Local Store Products
   */
  static async matchListingsWithStoreProducts(
    auth: N11Auth,
    poolInstance: any,
    storeId: number,
    options: { importMissing?: boolean } = {}
  ): Promise<{ success: boolean; matchedCount: number; importedCount: number; totalRemote: number; message: string }> {
    const listRes = await this.getProductList(auth, 0, 500);
    const remoteProducts = listRes.products || [];

    const localProdRes = await poolInstance.query("SELECT * FROM products WHERE store_id = $1", [storeId]);
    const localProducts = localProdRes.rows || [];

    let matchedCount = 0;
    let importedCount = 0;
    const matchedLocalIds = new Set<number>();

    // First clear any legacy fake 'PUBLISHED' placeholder IDs
    await poolInstance.query(
      "UPDATE products SET n11_id = NULL, is_n11_active = false WHERE store_id = $1 AND n11_id = 'PUBLISHED'",
      [storeId]
    );

    for (const rp of remoteProducts) {
      const rpId = String(rp.id || rp.productId || '');
      const rpCode = String(rp.productSellerCode || rp.stockCode || rp.barcode || '').trim().toLowerCase();
      const rpBarcode = String(rp.barcode || '').trim().toLowerCase();
      const rpTitle = String(rp.title || rp.name || '').trim().toLowerCase();
      const isSaleActiveOnN11 = String(rp.saleStatus || '2') === '2' && String(rp.approvalStatus || '1') === '1';

      // Extract GTINs and sellerStockCodes from stockItems
      const stockItemsRaw = rp.stockItems?.stockItem || [];
      const stockItemsList = Array.isArray(stockItemsRaw) ? stockItemsRaw : (stockItemsRaw ? [stockItemsRaw] : []);
      const rpGtins = stockItemsList.map((si: any) => String(si.gtin || '').trim().toLowerCase()).filter(Boolean);
      const rpSellerCodes = stockItemsList.map((si: any) => String(si.sellerStockCode || '').trim().toLowerCase()).filter(Boolean);

      let matchedLocal = localProducts.find((lp: any) => {
        if (matchedLocalIds.has(lp.id)) return false;
        if (String(lp.n11_id || '') === rpId) return true;
        const lpSku = String(lp.sku || '').trim().toLowerCase();
        const lpProdCode = String(lp.product_code || '').trim().toLowerCase();
        const lpBarcode = String(lp.barcode || '').trim().toLowerCase();
        const lpCleanBarcode = lpBarcode.replace(/^0+/, '');
        const lpName = String(lp.name || '').trim().toLowerCase();

        if (rpCode && ((lpSku && rpCode === lpSku) || (lpProdCode && rpCode === lpProdCode))) return true;
        if (rpBarcode && lpBarcode && rpBarcode === lpBarcode) return true;
        if (rpCode && lpBarcode && rpCode === lpBarcode) return true;
        if (rpBarcode && lpSku && rpBarcode === lpSku) return true;

        for (const gtin of rpGtins) {
          const cleanGtin = gtin.replace(/^0+/, '');
          if (gtin === lpBarcode || cleanGtin === lpBarcode || cleanGtin === lpCleanBarcode) return true;
          if (gtin === lpSku || cleanGtin === lpSku) return true;
        }

        for (const sc of rpSellerCodes) {
          if (sc === lpSku || sc === lpBarcode || sc === lpProdCode) return true;
        }

        if (rpTitle && lpName && rpTitle === lpName) return true;

        // Model code / token matching
        if (rpCode && rpCode.length >= 4) {
          const cleanCode = rpCode.replace(/^(tru|per)/, '').replace(/_[0-9_]+$/, '').replace(/[-_\s]/g, '');
          const cleanLpName = lpName.replace(/[-_\s]/g, '');
          if (cleanCode.length >= 4 && (cleanLpName.includes(cleanCode) || lpBarcode.includes(cleanCode))) {
            return true;
          }
        }
        return false;
      });

      if (matchedLocal) {
        matchedLocalIds.add(matchedLocal.id);
        let mpData: any = matchedLocal.marketplace_data;
        if (typeof mpData === 'string') { try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; } }
        mpData = mpData || {};

        const catalogId = rp.n11CatalogGroupId || stockItemsList[0]?.n11CatalogId || '';
        const publicId = catalogId || rpId;
        const n11Title = rp.title || matchedLocal.name || '';
        const catalogSlug = n11Title
          .toString()
          .replace(/Ğ/g, 'g').replace(/ğ/g, 'g')
          .replace(/Ü/g, 'u').replace(/ü/g, 'u')
          .replace(/Ş/g, 's').replace(/ş/g, 's')
          .replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i')
          .replace(/Ö/g, 'o').replace(/ö/g, 'o')
          .replace(/Ç/g, 'c').replace(/ç/g, 'c')
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9 -]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');

        const productUrl = publicId 
          ? `https://www.n11.com/urun/${catalogSlug}-${publicId}?magaza=enrakipsiz` 
          : `https://www.n11.com/urun/${catalogSlug}-${rpId}?magaza=enrakipsiz`;

        const pPrice = Number(matchedLocal.price || 0);
        const pStock = Number(matchedLocal.stock_quantity || 0);
        const finalActive = isSaleActiveOnN11 && pPrice > 0 && pStock > 0;

        mpData.n11 = {
          ...(mpData.n11 || {}),
          n11Id: rpId,
          productId: rpId,
          n11CatalogId: stockItemsList[0]?.n11CatalogId || undefined,
          n11CatalogGroupId: rp.n11CatalogGroupId || undefined,
          title: n11Title,
          status: finalActive ? 'ACTIVE' : 'INACTIVE',
          saleStatus: rp.saleStatus,
          productUrl,
          lastSync: new Date().toISOString(),
          lastError: null
        };

        await poolInstance.query(
          "UPDATE products SET n11_id = $1, is_n11_active = $2, n11_last_error = NULL, marketplace_data = $3 WHERE id = $4 AND store_id = $5",
          [rpId, finalActive, JSON.stringify(mpData), matchedLocal.id, storeId]
        );
        matchedCount++;
      }
    }

    // Ensure any product not matched to a live N11 listing does not remain falsely marked active
    const matchedIdsArray = Array.from(matchedLocalIds);
    if (matchedIdsArray.length > 0) {
      await poolInstance.query(
        "UPDATE products SET is_n11_active = false WHERE store_id = $1 AND is_n11_active = true AND NOT (id = ANY($2::int[]))",
        [storeId, matchedIdsArray]
      );
    } else if (remoteProducts.length === 0) {
      await poolInstance.query(
        "UPDATE products SET is_n11_active = false WHERE store_id = $1 AND (n11_id IS NULL OR n11_id = 'PUBLISHED')",
        [storeId]
      );
    }

    return {
      success: true,
      matchedCount,
      importedCount,
      totalRemote: remoteProducts.length,
      message: `N11 mağazası (enrakipsiz) tarandı: ${matchedCount} ürün yerel ürünlerinizle eşleştirildi, ${importedCount} yeni ürün içe aktarıldı.`
    };
  }
}
