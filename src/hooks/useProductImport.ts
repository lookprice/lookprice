import { useState } from "react";
import * as XLSX from 'xlsx';
import { toast } from "sonner";
import { api } from "../services/api";
import { translations } from "../translations";
import { Product } from "../types";

export const useProductImport = (user: any, currentStoreId: number | undefined, productsCount: number, branding: any, planLimits: Record<string, number>, lang: string, fetchData: (background?: boolean) => Promise<void>) => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importColumns, setImportColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<any>({
    barcode: "",
    name: "",
    category: "",
    sub_category: "",
    brand: "",
    author: "",
    price: "",
    description: "",
    stock_quantity: "",
    unit: "",
    image_url: "",
    image_url_2: "",
    image_url_3: "",
    image_url_4: "",
    image_url_5: "",
    variant_name: "",
    variant_barcode: "",
    variant_price: "",
    variant_stock: "",
    variant_color: "",
    variant_size: "",
    variant_image: ""
  });
  const [convertCurrency, setConvertCurrency] = useState(false);

  const autoDetectMapping = (cols: string[]) => {
    const next: any = {
      barcode: "",
      name: "",
      category: "",
      sub_category: "",
      brand: "",
      author: "",
      price: "",
      description: "",
      stock_quantity: "",
      unit: "",
      image_url: "",
      image_url_2: "",
      image_url_3: "",
      image_url_4: "",
      image_url_5: "",
      variant_name: "",
      variant_barcode: "",
      variant_price: "",
      variant_stock: "",
      variant_color: "",
      variant_size: "",
      variant_image: ""
    };

    const usedCols = new Set<string>();
    const findMatch = (patterns: RegExp[]) => {
      for (const pat of patterns) {
        const found = cols.find(c => c && !usedCols.has(c) && pat.test(String(c).trim().toLocaleLowerCase('tr-TR')));
        if (found) {
          usedCols.add(found);
          return found;
        }
      }
      return "";
    };

    next.barcode = findMatch([/^(barkod|barcode|ean|isbn|ürün kodu|urun kodu|stok kodu|sku)$/i, /barkod|barcode|isbn|ean/i]);
    next.name = findMatch([/^(ürün adı|urun adi|ürün|name|product name|title|başlık|baslik|eser adı|kitap adı)$/i, /ürün adı|urun adi|product name|isim|ad/i]);
    next.price = findMatch([/^(fiyat|satış fiyatı|satis fiyati|price|birim fiyat|liste fiyatı|tutar)$/i, /fiyat|price/i]);
    next.stock_quantity = findMatch([/^(stok|stok miktarı|stok adedi|miktar|adet|quantity|stock)$/i, /stok|stock|miktar/i]);
    next.category = findMatch([/^(kategori|ana kategori|category)$/i, /^kategori|category/i]);
    next.sub_category = findMatch([/^(alt kategori|sub_category|subcategory|alt_kategori)$/i, /alt kategori|sub.?cat/i]);
    next.brand = findMatch([/^(marka|brand|üretici|uretici|yayınevi|yayinevi)$/i, /marka|brand|yayın/i]);
    next.author = findMatch([/^(yazar|author|eser sahibi)$/i, /yazar|author/i]);
    next.description = findMatch([/^(açıklama|aciklama|description|detay|ürün açıklaması)$/i, /açıklama|aciklama|desc/i]);
    next.unit = findMatch([/^(birim|unit|ölçü birimi)$/i, /birim|unit/i]);

    // Image columns auto-detection
    next.image_url = findMatch([
      /^(görsel|gorsel|resim|ana görsel|ana resim|kapak görseli|image|image_url|photo|fotoğraf|resim 1|görsel 1|image 1|img1|resim linki|görsel linki)$/i,
      /^(resim|görsel|gorsel|image|img|foto)/i
    ]);
    next.image_url_2 = findMatch([
      /(resim|görsel|gorsel|image|img|foto|ek resim|ekstra resim).*2/i,
      /^(ek resim|ekstra resim|extra image|image_url_2|resim2|gorsel2)$/i
    ]);
    next.image_url_3 = findMatch([
      /(resim|görsel|gorsel|image|img|foto|ek resim|ekstra resim).*3/i,
      /^(image_url_3|resim3|gorsel3)$/i
    ]);
    next.image_url_4 = findMatch([
      /(resim|görsel|gorsel|image|img|foto|ek resim|ekstra resim).*4/i,
      /^(image_url_4|resim4|gorsel4)$/i
    ]);
    next.image_url_5 = findMatch([
      /(resim|görsel|gorsel|image|img|foto|ek resim|ekstra resim).*5/i,
      /^(image_url_5|resim5|gorsel5)$/i
    ]);

    // Variant columns auto-detection
    next.variant_name = findMatch([
      /^(varyant adı|varyant adi|varyant seçeneği|varyant secenegi|varyant|variant name|variant|seçenek|secenek|alt ürün)$/i,
      /varyant adı|variant name|varyant|variant/i
    ]);
    next.variant_barcode = findMatch([
      /^(varyant barkod|varyant barkodu|variant barcode|alt barkod|varyant sku)$/i,
      /varyant barkod|variant barcode/i
    ]);
    next.variant_price = findMatch([
      /^(varyant fiyatı|varyant fiyati|varyant satış fiyatı|variant price)$/i,
      /varyant fiyat|variant price/i
    ]);
    next.variant_stock = findMatch([
      /^(varyant stok|varyant stoku|varyant miktarı|variant stock)$/i,
      /varyant stok|variant stock/i
    ]);
    next.variant_color = findMatch([
      /^(varyant renk|varyant rengi|renk|color|colour)$/i,
      /renk|color/i
    ]);
    next.variant_size = findMatch([
      /^(varyant beden|varyant boyutu|beden|size|numara|boyut)$/i,
      /beden|size/i
    ]);
    next.variant_image = findMatch([
      /^(varyant resim|varyant görsel|varyant resim linki|variant image)$/i,
      /varyant resim|variant image/i
    ]);

    setMapping(next);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (data.length > 0) {
        const cols = (data[0] as any[]).map(c => String(c || "").trim()).filter(Boolean);
        setImportColumns(cols);
        autoDetectMapping(cols);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;

    const currentPlan = branding.plan || 'free';
    const limit = planLimits[currentPlan];
    if (productsCount >= limit) {
      toast.error(lang === 'tr' 
        ? `Hesap planı limitine ulaştınız (${limit} ürün). Lütfen planınızı yükseltin.` 
        : `You have reached your plan limit (${limit} products). Please upgrade your plan.`);
      return;
    }

    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('mapping', JSON.stringify(mapping));
    formData.append('convertCurrency', String(convertCurrency));
    if (targetStoreId) formData.append('storeId', targetStoreId.toString());
    
    try {
      setIsImporting(true);
      const res = await api.importProducts(formData, targetStoreId);
      setShowImportModal(false);
      setImportFile(null);
      setImportColumns([]);
      fetchData(true);
      toast.success(lang === 'tr' 
        ? `İçe aktarma tamamlandı (${res?.count || ''} ürün işlendi)` 
        : "Import completed successfully");
    } catch (error: any) {
      toast.error(error?.message || (lang === 'tr' ? "İçe aktarma sırasında hata oluştu" : "An error occurred during import"));
    } finally {
      setIsImporting(false);
    }
  };

  return { showImportModal, setShowImportModal, isImporting, setIsImporting, importFile, setImportFile, importColumns, setImportColumns, mapping, setMapping, convertCurrency, setConvertCurrency, handleFileSelect, handleImport };
};

