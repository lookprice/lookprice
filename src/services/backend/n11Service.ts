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
    catalogId?: string | number;
    sellerNickname?: string;
    sellerStockCode?: string;
    title?: string;
    isLive?: boolean;
    n11Status?: string;
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
      // 0. Pre-check if this product already exists in seller's N11 catalog (by stockCode or barcode)
      try {
        const queryHeaders = {
          appkey: cleanAppKey,
          appsecret: cleanAppSecret,
          appKey: cleanAppKey,
          appSecret: cleanAppSecret,
          "Content-Type": "application/json"
        };
        let existingItem: any = null;
        if (stockCode) {
          const qByCode = await axios.get(
            `https://api.n11.com/ms/product-query?page=0&size=20&stockCode=${encodeURIComponent(stockCode)}`,
            { headers: queryHeaders, timeout: 8000 }
          ).catch(() => null);
          const codeItems = qByCode?.data?.content || [];
          existingItem =
            codeItems.find((it: any) => it.status === "Active") ||
            codeItems.find((it: any) => String(it.stockCode || "").toLowerCase() === stockCode.toLowerCase());
        }
        if (!existingItem && barcode && !barcode.startsWith("20") && barcode.length >= 8) {
          const qByBc = await axios.get(
            `https://api.n11.com/ms/product-query?page=0&size=20&barcode=${encodeURIComponent(barcode)}`,
            { headers: queryHeaders, timeout: 8000 }
          ).catch(() => null);
          const bcItems = qByBc?.data?.content || [];
          existingItem =
            bcItems.find((it: any) => it.status === "Active") ||
            bcItems.find((it: any) => String(it.barcode || "").toLowerCase() === barcode.toLowerCase());
        }

        if (existingItem && existingItem.n11ProductId && existingItem.status !== "CatalogRejected" && existingItem.status !== "Rejected") {
          const realStockCode = String(existingItem.stockCode || stockCode).trim();
          await this.updatePriceAndStock(auth, realStockCode, formattedPrice, quantity).catch(() => null);
          const isCurrentlyActive = existingItem.status === "Active" && quantity > 0;
          return {
            success: true,
            n11Id: String(existingItem.n11ProductId),
            groupId: existingItem.groupId || undefined,
            catalogId: existingItem.catalogId || undefined,
            sellerNickname: existingItem.sellerNickname || undefined,
            sellerStockCode: realStockCode,
            title: existingItem.title || product.title,
            isLive: isCurrentlyActive,
            n11Status: existingItem.status,
            message: isCurrentlyActive
              ? "Ürün N11 mağazanızda aktif satışta; fiyat ve stok bilgisi anlık güncellendi."
              : "Ürün N11 katalog onay kuyruğunda (InApproval); fiyat ve stok bilgisi güncellendi."
          };
        }
      } catch (preCheckErr) {
        // Ignore pre-check error and proceed with product-create
      }

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

        // If N11 states the seller stock code or catalog item is already registered under this seller account, update its price & stock and query real status!
        const updatedReasons = (attemptResult.reasons || []).join(" ");
        if (
          attemptResult.status === "FAIL" &&
          /seller stock code tarafınızdan kullanılmaktadır|ürün listenizde mevcuttur/i.test(updatedReasons)
        ) {
          await this.updatePriceAndStock(auth, stockCode, formattedPrice, quantity).catch(() => null);
          let queriedItem: any = null;
          try {
            const qRes = await axios.get(
              `https://api.n11.com/ms/product-query?page=0&size=10&stockCode=${encodeURIComponent(stockCode)}`,
              {
                headers: {
                  appkey: cleanAppKey,
                  appsecret: cleanAppSecret,
                  appKey: cleanAppKey,
                  appSecret: cleanAppSecret,
                  "Content-Type": "application/json"
                },
                timeout: 8000
              }
            );
            const qList = qRes.data?.content || [];
            queriedItem = qList.find((it: any) => it.status === "Active") || qList[0] || null;
          } catch (qErr) {}

          const existingIdMatch = updatedReasons.match(/(\d{6,12})\s*nolu\s*katalog\s*id/i);
          const resolvedExistingId = queriedItem?.n11ProductId
            ? String(queriedItem.n11ProductId)
            : attemptResult.sku?.n11ProductId
            ? String(attemptResult.sku.n11ProductId)
            : existingIdMatch
            ? existingIdMatch[1]
            : stockCode;

          const itemStatus = queriedItem?.status || "InApproval";
          const isLiveNow = itemStatus === "Active" && quantity > 0;

          return {
            success: true,
            n11Id: resolvedExistingId,
            groupId: queriedItem?.groupId || attemptResult.sku?.groupId,
            catalogId: queriedItem?.catalogId || undefined,
            sellerNickname: queriedItem?.sellerNickname || attemptResult.sku?.sellerNickname,
            sellerStockCode: queriedItem?.stockCode || stockCode,
            title: queriedItem?.title || product.title,
            isLive: isLiveNow,
            n11Status: itemStatus,
            taskId: attemptResult.taskId || undefined,
            message: isLiveNow
              ? "Ürün N11 kataloğunuzda aktif kayıtlı; fiyat ve stok bilgisi güncellendi."
              : "Ürün N11 katalog onay kuyruğunda (Onay Bekliyor); fiyat ve stok bilgisi güncellendi."
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

      // Query N11 product-query by stockCode to inspect the created product's actual approval status (Active vs InApproval)
      let createdItem: any = null;
      try {
        const qRes = await axios.get(
          `https://api.n11.com/ms/product-query?page=0&size=10&stockCode=${encodeURIComponent(stockCode)}`,
          {
            headers: {
              appkey: cleanAppKey,
              appsecret: cleanAppSecret,
              appKey: cleanAppKey,
              appSecret: cleanAppSecret,
              "Content-Type": "application/json"
            },
            timeout: 8000
          }
        );
        const qList = qRes.data?.content || [];
        createdItem = qList.find((it: any) => it.status === "Active") || qList[0] || null;
      } catch (qErr) {}

      const n11ProductId = createdItem?.n11ProductId
        ? String(createdItem.n11ProductId)
        : attemptResult.sku?.n11ProductId
        ? String(attemptResult.sku.n11ProductId)
        : String(attemptResult.taskId || stockCode);

      const finalStatus = createdItem?.status || (attemptResult.status === "IN_QUEUE" ? "InApproval" : "InApproval");
      const isLive = finalStatus === "Active" && quantity > 0;

      return {
        success: true,
        n11Id: n11ProductId,
        groupId: createdItem?.groupId || attemptResult.sku?.groupId,
        catalogId: createdItem?.catalogId || undefined,
        sellerNickname: createdItem?.sellerNickname || attemptResult.sku?.sellerNickname,
        sellerStockCode: createdItem?.stockCode || stockCode,
        title: createdItem?.title || product.title,
        isLive,
        n11Status: finalStatus,
        taskId: attemptResult.taskId || undefined,
        message: isLive
          ? "Ürün N11 kataloğunda onaylandı ve canlı satışa açıldı!"
          : ((attemptResult.reasons || [])[0] || "Ürün N11 katalog onay kuyruğuna (InApproval) alındı. N11 katalog kontrolü tamamlandığında otomatik satışa açılacaktır.")
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
   * Batch Update Product Prices & Stocks in N11 using the official REST API (with task verification)
   */
  static async updatePriceAndStockBatch(
    auth: N11Auth,
    items: Array<{ stockCode: string; price?: number; salePrice?: number; listPrice?: number; quantity: number }>
  ): Promise<{
    success: boolean;
    taskId?: number | string;
    results?: Record<string, { status: string; reasons: string[] }>;
    message?: string;
  }> {
    const cleanAppKey = (auth.appKey || "").trim();
    const cleanAppSecret = (auth.appSecret || "").trim();
    if (!cleanAppKey || !cleanAppSecret) {
      return { success: false, message: "N11 AppKey veya AppSecret eksik." };
    }

    const validItems = (items || []).filter((it) => it && String(it.stockCode || "").trim().length > 0);
    if (validItems.length === 0) {
      return { success: true, results: {}, message: "Güncellenecek N11 ürünü bulunamadı." };
    }

    const headers = {
      appKey: cleanAppKey,
      appSecret: cleanAppSecret,
      appkey: cleanAppKey,
      appsecret: cleanAppSecret,
      "Content-Type": "application/json"
    };

    const results: Record<string, { status: string; reasons: string[] }> = {};
    let lastTaskId: number | string | undefined;

    // Process in chunks of 100 SKUs
    for (let i = 0; i < validItems.length; i += 100) {
      const chunk = validItems.slice(i, i + 100);
      const skusPayload = chunk.map((it) => {
        const rawPrice = it.salePrice !== undefined ? it.salePrice : (it.price !== undefined ? it.price : (it.listPrice || 0));
        const formattedPrice = Number(Math.max(1, Number(rawPrice || 0)).toFixed(2));
        const listPrice = it.listPrice !== undefined ? Math.max(formattedPrice, Number(Number(it.listPrice).toFixed(2))) : formattedPrice;
        const formattedQuantity = Math.max(0, Math.floor(Number(it.quantity || 0)));
        return {
          stockCode: String(it.stockCode).trim(),
          listPrice: listPrice,
          salePrice: formattedPrice,
          quantity: formattedQuantity,
          currencyType: "TL"
        };
      });

      try {
        const res = await axios.post(
          "https://api.n11.com/ms/product/tasks/price-stock-update",
          {
            payload: {
              integrator: "LookPrice",
              skus: skusPayload
            }
          },
          { headers, timeout: 15000 }
        );

        const taskId = res.data?.id || res.data?.taskId;
        lastTaskId = taskId;

        if (taskId) {
          // Poll task-details up to 3 times to verify actual execution status
          for (let attempt = 0; attempt < 3; attempt++) {
            await new Promise((r) => setTimeout(r, 1200));
            try {
              const tdRes = await axios.post(
                "https://api.n11.com/ms/product/task-details/page-query",
                {
                  taskId,
                  pageable: { page: 0, size: Math.max(20, chunk.length) }
                },
                { headers, timeout: 10000 }
              );
              const tStatus = tdRes.data?.status;
              const content: any[] = tdRes.data?.skus?.content || [];
              if (tStatus === "PROCESSED" && content.length > 0) {
                for (const c of content) {
                  const sc = String(c.sku?.stockCode || c.stockCode || "").trim();
                  if (sc) {
                    results[sc] = {
                      status: c.status || "SUCCESS",
                      reasons: c.reasons || c.sku?.reasons || []
                    };
                  }
                }
                break;
              }
            } catch (pollErr) {
              // Ignore poll error
            }
          }
        }
      } catch (err: any) {
        return {
          success: false,
          message: err.response?.data?.errorMessage || err.message || "N11 toplu fiyat/stok güncelleme hatası."
        };
      }
    }

    return {
      success: true,
      taskId: lastTaskId,
      results,
      message: `${validItems.length} ürün için N11 fiyat ve stok güncellemesi tamamlandı.`
    };
  }

  /**
   * Update Product Price & Stock in N11 using the modern REST API (with task verification) or SOAP fallback
   */
  static async updatePriceAndStock(
    auth: N11Auth,
    productSellerCode: string,
    price: number,
    quantity: number
  ): Promise<{ success: boolean; message?: string }> {
    const cleanCode = String(productSellerCode || "").trim();
    if (!cleanCode) {
      return { success: false, message: "N11 satıcı stok kodu (stockCode) eksik." };
    }
    const formattedPrice = Number(Math.max(1, Number(price || 0)).toFixed(2));
    const formattedQuantity = Math.max(0, Math.floor(Number(quantity || 0)));

    const cleanAppKey = (auth.appKey || "").trim();
    const cleanAppSecret = (auth.appSecret || "").trim();
    const headers = {
      appKey: cleanAppKey,
      appSecret: cleanAppSecret,
      appkey: cleanAppKey,
      appsecret: cleanAppSecret,
      "Content-Type": "application/json"
    };

    const requestBody = {
      payload: {
        integrator: "LookPrice",
        skus: [
          {
            stockCode: cleanCode,
            listPrice: formattedPrice,
            salePrice: formattedPrice,
            quantity: formattedQuantity,
            currencyType: "TL"
          }
        ]
      }
    };

    // 1. Try modern N11 REST API (price-stock-update) and verify via task-details/page-query
    let restFailReason = "";
    try {
      const res = await axios.post("https://api.n11.com/ms/product/tasks/price-stock-update", requestBody, {
        headers,
        timeout: 10000
      });

      const taskId = res.data?.id || res.data?.taskId;
      if (taskId) {
        for (let attempt = 0; attempt < 3; attempt++) {
          await new Promise((r) => setTimeout(r, 1100));
          try {
            const tdRes = await axios.post(
              "https://api.n11.com/ms/product/task-details/page-query",
              {
                taskId,
                pageable: { page: 0, size: 10 }
              },
              { headers, timeout: 8000 }
            );
            const taskStatus = tdRes.data?.status;
            const skuContent = tdRes.data?.skus?.content?.[0];
            if (taskStatus === "PROCESSED" && skuContent) {
              const reasons: string[] = skuContent.reasons || skuContent.sku?.reasons || [];
              if (skuContent.status === "SUCCESS") {
                return {
                  success: true,
                  message: reasons[0] || `N11 fiyat (${formattedPrice} TL) ve stok (${formattedQuantity}) başarıyla güncellendi.`
                };
              } else if (skuContent.status === "FAIL") {
                restFailReason = reasons.join(" | ");
                break;
              }
            }
          } catch (pollErr) {
            // Ignore transient poll error
          }
        }
        if (!restFailReason) {
          return {
            success: true,
            message: `N11 REST API fiyat ve stok güncelleme görevi oluşturuldu. Task ID: ${taskId}`
          };
        }
      }
    } catch (restErr: any) {
      // Quiet fallback to SOAP if REST fails
    }

    // 2. SOAP Fallback (using SOAP UpdateProductPriceBySellerCode + UpdateStockByStockSellerCode)
    try {
      const priceRes = await this.updateProductPriceBySellerCode(
        auth,
        cleanCode,
        formattedPrice,
        [{ sellerStockCode: cleanCode, optionPrice: formattedPrice }]
      );

      const stockRes = await this.updateStockByStockSellerCode(auth, [{ sellerStockCode: cleanCode, quantity: formattedQuantity }]);

      if (priceRes?.success || stockRes?.success) {
        return {
          success: true,
          message: `N11 ürün fiyatı ve stok miktarı SOAP ile güncellendi.${stockRes.success ? "" : ` (Stok uyarısı: ${stockRes.message})`}`
        };
      }

      if (/^\d+$/.test(cleanCode)) {
        const idRes = await this.updateProductPriceById(
          auth,
          cleanCode,
          formattedPrice,
          [{ sellerStockCode: cleanCode, optionPrice: formattedPrice }]
        );
        if (idRes.success) {
          return { success: true, message: `N11 ürün fiyatı ID ile güncellendi.` };
        }
      }

      return {
        success: false,
        message: restFailReason || priceRes?.message || "N11 güncelleme tamamlanamadı (Satıcı stok kodu veya N11 katalog kaydı doğrulanamadı)."
      };
    } catch (err: any) {
      return {
        success: false,
        message: restFailReason || `N11 güncelleme tamamlanamadı. (RestAPI ve SOAP servisleri yanıt vermedi)`
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
   * Fetch all products from N11 using the official REST Product Query API (`GET https://api.n11.com/ms/product-query`)
   * with SOAP `GetProductList` fallback.
   */
  static async getAllProductsRest(auth: N11Auth): Promise<any[]> {
    const cleanAppKey = (auth.appKey || "").trim();
    const cleanAppSecret = (auth.appSecret || "").trim();
    if (!cleanAppKey || !cleanAppSecret) return [];

    const headers = {
      appKey: cleanAppKey,
      appSecret: cleanAppSecret,
      appkey: cleanAppKey,
      appsecret: cleanAppSecret,
      "Content-Type": "application/json"
    };

    const allItems: any[] = [];
    try {
      let page = 0;
      let totalPages = 1;
      while (page < totalPages && page < 50) {
        const res = await axios.get(`https://api.n11.com/ms/product-query?page=${page}&size=100`, {
          headers,
          timeout: 15000
        });
        const content = res.data?.content || [];
        if (Array.isArray(content)) {
          allItems.push(...content);
        }
        totalPages = Number(res.data?.totalPages || 1);
        page++;
      }
      if (allItems.length > 0) {
        return allItems;
      }
    } catch (restErr) {
      // Fallback to SOAP GetProductList
    }

    try {
      const soapRes = await this.getProductList(auth, 0, 500);
      return soapRes.products || [];
    } catch (soapErr) {
      return [];
    }
  }

  /**
   * Match Remote N11 Listings with Local Store Products
   * - Prioritizes Active & On_Sale listings over InApproval duplicates
   * - Distinguishes Active (Satışta) vs InApproval (Onay Bekliyor) vs CatalogRejected (Reddedildi)
   * - Builds verified N11 public URLs using N11's exact catalog title and groupId / catalogId
   * - Synchronizes live prices & stocks to N11 for all matched Active listings
   */
  static async matchListingsWithStoreProducts(
    auth: N11Auth,
    poolInstance: any,
    storeId: number,
    options: { importMissing?: boolean; syncPrices?: boolean } = {}
  ): Promise<{
    success: boolean;
    matchedCount: number;
    activeCount?: number;
    pendingCount?: number;
    rejectedCount?: number;
    importedCount: number;
    totalRemote: number;
    message: string;
  }> {
    const remoteProductsRaw = await this.getAllProductsRest(auth);

    // Sort remote products so Active + On_Sale ALWAYS match before Active (Out_Of_Stock), which match before InApproval, which match before Rejected/Suspended
    const getStatusPriority = (rp: any): number => {
      const st = String(rp.status || "");
      const saleSt = String(rp.saleStatus || "");
      const appSt = String(rp.approvalStatus || "");
      if ((st === "Active" || appSt === "1") && (saleSt === "On_Sale" || saleSt === "2")) return 1;
      if (st === "Active" || appSt === "1") return 2;
      if (st === "InApproval" || appSt === "5") return 3;
      if (st === "Suspended" || appSt === "2" || appSt === "3") return 4;
      return 5;
    };

    const remoteProducts = [...remoteProductsRaw].sort((a, b) => getStatusPriority(a) - getStatusPriority(b));

    const localProdRes = await poolInstance.query("SELECT * FROM products WHERE store_id = $1", [storeId]);
    const localProducts = localProdRes.rows || [];

    const storeRes = await poolInstance.query("SELECT n11_settings, currency_rates, branding, default_currency FROM stores WHERE id = $1", [storeId]);
    const storeRow = storeRes.rows[0] || {};
    let n11Settings = storeRow.n11_settings || {};
    if (typeof n11Settings === "string") { try { n11Settings = JSON.parse(n11Settings); } catch { n11Settings = {}; } }
    let branding = storeRow.branding || {};
    if (typeof branding === "string") { try { branding = JSON.parse(branding); } catch { branding = {}; } }
    const rates = { ...(branding?.currency_rates || {}), ...(storeRow.currency_rates || {}) };

    let matchedCount = 0;
    let activeCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;
    let importedCount = 0;
    const matchedLocalIds = new Set<number>();
    const activeMatchedIds = new Set<number>();
    const priceStockSyncBatch: Array<{ stockCode: string; price: number; quantity: number }> = [];

    // Clear any legacy fake 'PUBLISHED' placeholder IDs
    await poolInstance.query(
      "UPDATE products SET n11_id = NULL, is_n11_active = false WHERE store_id = $1 AND n11_id = 'PUBLISHED'",
      [storeId]
    );

    const isRealExternalBarcode = (bc: string): boolean => {
      if (!bc || bc.length < 8) return false;
      if (bc.startsWith("200") || bc.startsWith("205") || bc.startsWith("8680000") || bc.startsWith("prd-")) return false;
      return /^\d{8,14}$/.test(bc);
    };

    for (const rp of remoteProducts) {
      const rpId = String(rp.n11ProductId || rp.id || rp.productId || "").trim();
      const rpStockCodeRaw = String(rp.stockCode || rp.productSellerCode || "").trim();
      const rpCode = rpStockCodeRaw.toLowerCase();
      const rpBaseCode = rpCode.replace(/_(489_)?2$/i, "");
      const rpBarcode = String(rp.barcode || "").trim().toLowerCase();
      const rpTitle = String(rp.title || rp.name || "").trim();
      const rpTitleLower = rpTitle.toLocaleLowerCase("tr-TR");
      const rpGroupId = rp.groupId || rp.n11CatalogGroupId || "";
      const rpCatalogId = rp.catalogId || "";
      const rpSellerNickname = rp.sellerNickname || "enrakipsiz";

      // Extract GTINs and sellerStockCodes from SOAP stockItems if present
      const stockItemsRaw = rp.stockItems?.stockItem || [];
      const stockItemsList = Array.isArray(stockItemsRaw) ? stockItemsRaw : (stockItemsRaw ? [stockItemsRaw] : []);
      const rpGtins = stockItemsList.map((si: any) => String(si.gtin || "").trim().toLowerCase()).filter(Boolean);
      const rpSellerCodes = stockItemsList.map((si: any) => String(si.sellerStockCode || "").trim().toLowerCase()).filter(Boolean);

      // Determine normalized N11 status
      const rawStatus = String(rp.status || "");
      const rawSaleStatus = String(rp.saleStatus || "");
      const rawApproval = String(rp.approvalStatus || "");

      const isApprovedOnN11 = rawStatus === "Active" || rawApproval === "1";
      const isPendingOnN11 = rawStatus === "InApproval" || rawApproval === "5";
      const isRejectedOnN11 = rawStatus === "CatalogRejected" || rawStatus === "Rejected" || rawApproval === "8" || rawApproval === "3";
      const isOnSaleOnN11 = rawSaleStatus === "On_Sale" || rawSaleStatus === "2";

      // 1a. Pass 1a: Exact Barcode / GTIN match across all products first
      let matchedLocal = localProducts.find((lp: any) => {
        if (matchedLocalIds.has(lp.id)) return false;
        const lpBarcode = String(lp.barcode || "").trim().toLowerCase();
        const lpCleanBarcode = lpBarcode.replace(/^0+/, "");
        if (!lpBarcode) return false;

        if (rpBarcode && (rpBarcode === lpBarcode || rpBarcode.replace(/^0+/, "") === lpCleanBarcode)) return true;
        if (rpCode && (rpCode === lpBarcode || rpBaseCode === lpBarcode)) return true;
        for (const gtin of rpGtins) {
          const cleanGtin = gtin.replace(/^0+/, "");
          if (gtin === lpBarcode || cleanGtin === lpCleanBarcode) return true;
        }
        return false;
      });

      // 1b. Pass 1b: Exact SKU / SellerStockCode / N11 ID match (only if external barcodes do not conflict!)
      if (!matchedLocal) {
        matchedLocal = localProducts.find((lp: any) => {
          if (matchedLocalIds.has(lp.id)) return false;
          const lpBarcode = String(lp.barcode || "").trim().toLowerCase();
          const lpSku = String(lp.sku || "").trim().toLowerCase();
          const lpProdCode = String(lp.product_code || "").trim().toLowerCase();
          const lpN11Id = String(lp.n11_id || "").trim();

          // Never match two items that have different real EAN/UPC barcodes even if they share a generic SKU prefix (e.g. Hs-usb-m200)
          if (isRealExternalBarcode(rpBarcode) && isRealExternalBarcode(lpBarcode) && rpBarcode !== lpBarcode) {
            return false;
          }

          if (rpCode && ((lpSku && (rpCode === lpSku || rpBaseCode === lpSku)) || (lpProdCode && (rpCode === lpProdCode || rpBaseCode === lpProdCode)))) return true;
          if (rpCode === `prd-${lp.id}` || rpBaseCode === `prd-${lp.id}`) return true;
          for (const sc of rpSellerCodes) {
            const baseSc = sc.replace(/_(489_)?2$/i, "");
            if ((lpSku && (sc === lpSku || baseSc === lpSku)) || (lpBarcode && (sc === lpBarcode || baseSc === lpBarcode))) return true;
          }

          if (lpN11Id && (lpN11Id === rpId || (rpCatalogId && lpN11Id === String(rpCatalogId)) || (rpGroupId && lpN11Id === String(rpGroupId)))) {
            return true;
          }

          return false;
        });
      }

      // 2. Second pass: Exact title or distinct model token match (only when barcodes do not conflict!)
      if (!matchedLocal) {
        matchedLocal = localProducts.find((lp: any) => {
          if (matchedLocalIds.has(lp.id)) return false;
          const lpBarcode = String(lp.barcode || "").trim().toLowerCase();
          const lpName = String(lp.name || "").trim();
          const lpNameLower = lpName.toLocaleLowerCase("tr-TR");
          const lpSku = String(lp.sku || "").trim().toLowerCase();

          // Guard: If both N11 item and local DB product have real EAN/UPC barcodes and they differ, NEVER fuzzy-match them!
          if (isRealExternalBarcode(rpBarcode) && isRealExternalBarcode(lpBarcode) && rpBarcode !== lpBarcode) {
            return false;
          }

          if (rpTitleLower && lpNameLower && rpTitleLower === lpNameLower) return true;

          // Distinct model code check (e.g., fm10, 2pc54aa, tcg455, m171, m170, mk120, k380s, 1470g2, 6200a, c270, zq521, wca004vfwh, 800300-250, av10128cw03)
          const candidateModel = rpBaseCode.replace(/^prd-\d+$/i, "").trim();
          if (candidateModel && candidateModel.length >= 4 && !/^\d+$/.test(candidateModel)) {
            const escapedModel = candidateModel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const tokenRegex = new RegExp(`(^|[^a-z0-9])${escapedModel}($|[^a-z0-9])`, "i");
            if (tokenRegex.test(lpNameLower) || tokenRegex.test(lpSku)) {
              // Extra check for M171 color variants (Siyah, Mavi, Kırmızı)
              if (candidateModel === "m171") {
                const rpHasBlue = /mavi|blue/i.test(rpTitleLower);
                const rpHasRed = /kırmızı|kirmizi|red/i.test(rpTitleLower);
                const rpHasBlack = /siyah|black/i.test(rpTitleLower);
                const lpHasBlue = /mavi|blue/i.test(lpNameLower);
                const lpHasRed = /kırmızı|kirmizi|red/i.test(lpNameLower);
                const lpHasBlack = /siyah|black/i.test(lpNameLower);
                if ((rpHasBlue && !lpHasBlue) || (rpHasRed && !lpHasRed) || (rpHasBlack && !lpHasBlack)) {
                  return false;
                }
              }
              return true;
            }
          }

          return false;
        });
      }

      if (matchedLocal) {
        matchedLocalIds.add(matchedLocal.id);
        let mpData: any = matchedLocal.marketplace_data;
        if (typeof mpData === "string") { try { mpData = JSON.parse(mpData); } catch { mpData = {}; } }
        mpData = mpData || {};

        const publicCatalogId = String(rpGroupId || rpCatalogId || stockItemsList[0]?.n11CatalogId || "").trim();
        const n11Title = rpTitle || matchedLocal.name || "";
        const catalogSlug = n11Title
          .toString()
          .replace(/Ğ/g, "g").replace(/ğ/g, "g")
          .replace(/Ü/g, "u").replace(/ü/g, "u")
          .replace(/Ş/g, "s").replace(/ş/g, "s")
          .replace(/İ/g, "i").replace(/I/g, "i").replace(/ı/g, "i")
          .replace(/Ö/g, "o").replace(/ö/g, "o")
          .replace(/Ç/g, "c").replace(/ç/g, "c")
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9 -]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-");

        // Build public product URL ONLY when N11 listing is approved (Active) and has a valid Catalog Group ID
        const productUrl = isApprovedOnN11 && publicCatalogId
          ? `https://www.n11.com/urun/${catalogSlug}-${publicCatalogId}?magaza=${rpSellerNickname}`
          : undefined;

        const pPrice = Number(matchedLocal.price || 0);
        const pStock = Math.max(0, Math.floor(Number(matchedLocal.stock_quantity || 0)));

        // Calculate target N11 price in TRY
        let webPriceTry = pPrice;
        const prodCurrency = String(matchedLocal.currency || storeRow.default_currency || "TRY").toUpperCase();
        if (prodCurrency !== "TRY" && prodCurrency !== "TL") {
          const rate = Number(rates[prodCurrency] || (prodCurrency === "USD" ? 49.5647 : prodCurrency === "EUR" ? 55.4997 : 1));
          if (rate > 1) webPriceTry = pPrice * rate;
        }
        const calculatedN11Price = pPrice > 0
          ? this.calculateMarketplacePrice(webPriceTry, matchedLocal.category, matchedLocal.sub_category, n11Settings)
          : 0;

        let finalActive = false;
        let mpStatus = "INACTIVE";
        let approvalStatusStr = "1";
        let lastError: string | null = null;

        if (isApprovedOnN11) {
          approvalStatusStr = "1";
          if (pPrice > 0 && pStock > 0 && (isOnSaleOnN11 || Number(rp.quantity || 0) === 0)) {
            finalActive = true;
            mpStatus = "ACTIVE";
            activeCount++;
            activeMatchedIds.add(matchedLocal.id);
          } else {
            finalActive = false;
            mpStatus = "INACTIVE";
          }

          // Queue live N11 price & stock sync if price or stock on N11 differs from local store
          if (rpStockCodeRaw && calculatedN11Price > 0) {
            const remoteSalePrice = Number(rp.salePrice || rp.price || 0);
            const remoteQty = Number(rp.quantity ?? -1);
            if (Math.abs(remoteSalePrice - calculatedN11Price) >= 0.05 || remoteQty !== pStock) {
              priceStockSyncBatch.push({
                stockCode: rpStockCodeRaw,
                price: calculatedN11Price,
                quantity: pStock
              });
            }
          }
        } else if (isPendingOnN11) {
          finalActive = false;
          mpStatus = "PENDING";
          approvalStatusStr = "5";
          lastError = null;
          pendingCount++;
        } else if (isRejectedOnN11) {
          finalActive = false;
          mpStatus = "ERROR";
          approvalStatusStr = "8";
          lastError = "N11 katalog onayı reddedildi: Ürün özellik veya görsel bilgileri N11 katalog standartlarına uygun değil.";
          rejectedCount++;
        } else {
          finalActive = false;
          mpStatus = "INACTIVE";
          approvalStatusStr = rawApproval || "2";
        }

        mpData.n11 = {
          ...(mpData.n11 || {}),
          n11Id: rpId,
          productId: rpId,
          sellerStockCode: rpStockCodeRaw || undefined,
          productSellerCode: rpStockCodeRaw || undefined,
          stockCode: rpStockCodeRaw || undefined,
          n11CatalogId: rpCatalogId ? String(rpCatalogId) : (stockItemsList[0]?.n11CatalogId || undefined),
          n11CatalogGroupId: rpGroupId ? String(rpGroupId) : undefined,
          sellerNickname: rpSellerNickname,
          title: n11Title,
          status: mpStatus,
          rawStatus: rawStatus || (isApprovedOnN11 ? "Active" : isPendingOnN11 ? "InApproval" : "Inactive"),
          approvalStatus: approvalStatusStr,
          saleStatus: rawSaleStatus || rp.saleStatus,
          price: calculatedN11Price > 0 ? calculatedN11Price : Number(rp.salePrice || rp.price || 0),
          productUrl: productUrl || null,
          lastSync: new Date().toISOString(),
          lastError
        };

        await poolInstance.query(
          "UPDATE products SET n11_id = $1, is_n11_active = $2, n11_last_error = $3, marketplace_data = $4 WHERE id = $5 AND store_id = $6",
          [rpId, finalActive, lastError, JSON.stringify(mpData), matchedLocal.id, storeId]
        );
        matchedCount++;
      }
    }

    // Ensure any product not matched to any N11 listing has its stale N11 active/pending state cleaned up
    const matchedIdsArray = Array.from(matchedLocalIds);
    if (remoteProducts.length > 0) {
      for (const lp of localProducts) {
        if (!matchedLocalIds.has(lp.id)) {
          let mpData: any = lp.marketplace_data;
          if (typeof mpData === "string") { try { mpData = JSON.parse(mpData); } catch { mpData = {}; } }
          if (lp.is_n11_active || lp.n11_id || mpData?.n11?.status === "ACTIVE" || mpData?.n11?.status === "PENDING") {
            if (mpData?.n11) {
              mpData.n11.status = "INACTIVE";
              mpData.n11.rawStatus = "Unmatched";
              mpData.n11.approvalStatus = "0";
              mpData.n11.productUrl = null;
            }
            await poolInstance.query(
              "UPDATE products SET is_n11_active = false, n11_id = NULL, marketplace_data = $1 WHERE id = $2 AND store_id = $3",
              [JSON.stringify(mpData || {}), lp.id, storeId]
            );
          }
        }
      }
    }

    // Push updated prices and stocks in batch for all active matched listings where price/stock differed
    if (options.syncPrices !== false && priceStockSyncBatch.length > 0) {
      await this.updatePriceAndStockBatch(auth, priceStockSyncBatch).catch((err) => {
        console.warn("[N11 Match Listings Batch Price/Stock Sync Warning]:", err?.message || err);
      });
    }

    return {
      success: true,
      matchedCount,
      activeCount,
      pendingCount,
      rejectedCount,
      importedCount,
      totalRemote: remoteProducts.length,
      message: `N11 mağazası (enrakipsiz) tarandı: ${matchedCount} ürün eşleştirildi (${activeCount} aktif satışta, ${pendingCount} N11 katalog onayında bekliyor${rejectedCount > 0 ? `, ${rejectedCount} reddedildi` : ""}).`
    };
  }
}
