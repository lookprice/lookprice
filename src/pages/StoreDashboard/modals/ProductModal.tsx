import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { MultiImageUploader } from "../../../components/MultiImageUploader";

interface ProductModalProps {
  showProductModal: boolean;
  setShowProductModal: (show: boolean) => void;
  editingProduct: any;
  setEditingProduct: (p: any) => void;
  handleAddProduct?: (e: React.FormEvent) => void;
  isTr: boolean;
  lang: string;
  branding: any;
  translations: any;
}

export const ProductModal = ({
  showProductModal,
  setShowProductModal,
  editingProduct,
  setEditingProduct,
  handleAddProduct,
  isTr,
  lang,
  branding,
  translations: t,
}: ProductModalProps) => {
  const [productImageUrl, setProductImageUrl] = useState("");

  useEffect(() => {
    if (showProductModal) {
      setProductImageUrl(editingProduct?.image_url || "");
    } else {
      setProductImageUrl("");
    }
  }, [showProductModal, editingProduct]);

  if (!showProductModal) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in"
      >
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div>
            <h3 className="text-lg font-black uppercase tracking-wider">
              {editingProduct
                ? isTr
                  ? "Ürünü Düzenle"
                  : "Edit Product"
                : isTr
                ? "Yeni Ürün Kaydet"
                : "Create New Product"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isTr
                ? "Stok listenize yeni ürün veya hizmet tanımlayın."
                : "Define new product or service in inventory."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowProductModal(false);
              setEditingProduct(null);
            }}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white border-0 outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            if (handleAddProduct) handleAddProduct(e);
          }}
          className="flex-1 overflow-y-auto p-8 space-y-6"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Barkod / Ürün Kodu *" : "Barcode / SKU *"}
              </label>
              <input
                type="text"
                name="barcode"
                required
                placeholder={isTr ? "Barkod girin veya okutun..." : "SKO code..."}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                defaultValue={editingProduct?.barcode || ""}
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Ürün / Hizmet Adı *" : "Product / Service Name *"}
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder={isTr ? "örn: Alçıpan Profili" : "Product name"}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-extrabold text-slate-900"
                defaultValue={editingProduct?.name || ""}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Kategori" : "Category"}
              </label>
              <input
                type="text"
                name="category"
                placeholder={isTr ? "örn: İnşaat, Yapı Çelikleri" : "Category"}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                defaultValue={editingProduct?.category || ""}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Marka / Üretici" : "Brand"}
              </label>
              <input
                type="text"
                name="brand"
                placeholder={isTr ? "örn: Knauf, Gap" : "Brand name"}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                defaultValue={editingProduct?.brand || ""}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Ürün Tipi" : "Product Type"}
              </label>
              <select
                name="product_type"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none text-xs h-[50px]"
                defaultValue={editingProduct?.product_type || "product"}
              >
                <option value="product">{isTr ? "Fiziksel Ürün (Stoklu)" : "Physical Product"}</option>
                <option value="service">{isTr ? "Hizmet / Servis (Stoksuz)" : "Service / Labor"}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Birim" : "Unit"}
              </label>
              <input
                type="text"
                name="unit"
                placeholder={isTr ? "örn: Adet, Palet, Kg, Mt" : "Unit abbreviation"}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700"
                defaultValue={editingProduct?.unit || "Adet"}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Maliyet Fiyatı" : "Cost Price"}
              </label>
              <input
                type="text"
                name="cost_price"
                placeholder="0.00"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                defaultValue={editingProduct?.cost_price || ""}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Maliyet Para Birimi" : "Cost Currency"}
              </label>
              <select
                name="cost_currency"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none text-xs h-[50px]"
                defaultValue={editingProduct?.cost_currency || branding?.default_currency || "TRY"}
              >
                <option value="TRY">TRY (₺)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Satış Fiyatı *" : "Sales Price *"}
              </label>
              <input
                type="text"
                name="price"
                required
                placeholder="0.00"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-black text-slate-900"
                defaultValue={editingProduct?.price || ""}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Alternatif Satış Fiyatı (Nakit Fiyatı vb)" : "Backup Sales Price"}
              </label>
              <input
                type="text"
                name="price_2"
                placeholder="0.00"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                defaultValue={editingProduct?.price_2 || ""}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Satış Para Birimi" : "Sales Price Currency"}
              </label>
              <select
                name="currency"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none text-xs h-[50px]"
                defaultValue={editingProduct?.currency || branding?.default_currency || "TRY"}
              >
                <option value="TRY">TRY (₺)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Varsayılan KDV %" : "VAT %"}
              </label>
              <select
                name="tax_rate"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none text-xs h-[50px]"
                defaultValue={editingProduct?.tax_rate !== undefined ? String(editingProduct.tax_rate) : "20"}
              >
                <option value="20">%20</option>
                <option value="10">%10</option>
                <option value="1">%1</option>
                <option value="0">%0 (KDV Muaf)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Mevcut Stok Miktarı" : "Stock Quantity"}
              </label>
              <input
                type="number"
                name="stock_quantity"
                placeholder="0"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                defaultValue={editingProduct?.stock_quantity !== undefined ? String(editingProduct.stock_quantity) : "0"}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Kritik Stok Seviyesi" : "Min Stock Level"}
              </label>
              <input
                type="number"
                name="min_stock_level"
                placeholder="0"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                defaultValue={editingProduct?.min_stock_level !== undefined ? String(editingProduct.min_stock_level) : "5"}
              />
            </div>

            <div className="space-y-1.5 col-span-2 bg-slate-50 p-4 rounded-3xl border border-slate-150">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                {isTr ? "Ürün Görseli (Canlı Fotoğraf veya URL)" : "Product Image (Live Photo or URL)"}
              </label>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm bg-cover bg-center">
                  {productImageUrl ? (
                    <img src={productImageUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold">{isTr ? "Görsel Yok" : "Blank"}</span>
                  )}
                </div>
                
                <div className="flex-1 w-full space-y-2">
                  <input
                    type="text"
                    name="image_url"
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all font-semibold text-xs text-slate-750"
                    value={productImageUrl}
                    onChange={(e) => setProductImageUrl(e.target.value)}
                  />
                  
                  <div className="pt-1">
                    <MultiImageUploader 
                      onImagesUploaded={(urls) => {
                        if (urls && urls.length > 0) {
                          setProductImageUrl(urls[0]);
                        }
                      }} 
                      lang={lang} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Ürün Detaylı Açıklaması" : "Detailed Description"}
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder={isTr ? "Ürün teknik özellikleri ve detayları" : "Detailed specs"}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-semibold text-slate-800"
                defaultValue={editingProduct?.description || ""}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 col-span-2">
            <input
              type="checkbox"
              name="is_web_sale"
              id="prod_is_web_sale"
              className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
              defaultChecked={editingProduct?.is_web_sale !== false}
            />
            <label htmlFor="prod_is_web_sale" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
              {isTr ? "Bu Ürün Mağaza Web Sitesinde Vitrinde Yayınlansın" : "Publish product in public store showcase page"}
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowProductModal(false);
                setEditingProduct(null);
              }}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all cursor-pointer"
            >
              {isTr ? "Ürünü Kaydet" : "Save Product Record"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
