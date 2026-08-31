import React, { useState } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Layers, 
  Wand2, 
  Image as ImageIcon, 
  DollarSign, 
  Package, 
  Barcode, 
  Settings2, 
  Check, 
  AlertCircle, 
  RefreshCw,
  Copy,
  ChevronDown,
  ChevronUp,
  Tag
} from 'lucide-react';
import { ProductVariant, VariantBehaviorType } from '@/types';
import { 
  SECTOR_VARIANT_PRESETS, 
  generateCartesianMatrix, 
  getColorHex,
  AttributePreset
} from '@/utils/variantPresets';

interface VariantMatrixManagerProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  baseProduct: {
    name?: string;
    price?: number;
    cost_price?: number;
    barcode?: string;
    sku?: string;
    stock_quantity?: number;
    currency?: string;
    image_url?: string;
  };
  isCafeRestaurant?: boolean;
  lang?: string;
}

interface WorkingAttribute {
  id: string;
  name: string;
  display_type: 'swatch' | 'button' | 'dropdown';
  values: string[];
  inputValue: string;
}

export const VariantMatrixManager: React.FC<VariantMatrixManagerProps> = ({
  variants,
  onChange,
  baseProduct,
  isCafeRestaurant = false,
  lang = 'tr'
}) => {
  const isTr = lang === 'tr';

  // Matrix Generator Working State
  const [showGenerator, setShowGenerator] = useState<boolean>(variants.length === 0);
  const [workingAttributes, setWorkingAttributes] = useState<WorkingAttribute[]>([
    {
      id: 'attr_1',
      name: isCafeRestaurant ? (isTr ? 'Porsiyon / Ebat' : 'Portion / Size') : (isTr ? 'Renk' : 'Color'),
      display_type: isCafeRestaurant ? 'button' : 'swatch',
      values: isCafeRestaurant ? ['Küçük', 'Orta', 'Büyük'] : ['Siyah', 'Beyaz', 'Mavi'],
      inputValue: ''
    },
    ...(!isCafeRestaurant ? [{
      id: 'attr_2',
      name: isTr ? 'Beden' : 'Size',
      display_type: 'button' as const,
      values: ['S', 'M', 'L', 'XL'],
      inputValue: ''
    }] : [])
  ]);

  // Bulk Edit Inputs
  const [bulkPrice, setBulkPrice] = useState<string>('');
  const [bulkStock, setBulkStock] = useState<string>('');
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [expandedVariantId, setExpandedVariantId] = useState<string | null>(null);

  // Load Sector Preset
  const handleApplyPreset = (preset: AttributePreset) => {
    const nextAttrs: WorkingAttribute[] = preset.attributes.map((a, idx) => ({
      id: `attr_${Date.now()}_${idx}`,
      name: a.name,
      display_type: a.display_type,
      values: [...a.suggestedValues.slice(0, 4)],
      inputValue: ''
    }));
    setWorkingAttributes(nextAttrs);
    setShowGenerator(true);
  };

  // Add Attribute Value tag
  const handleAddValue = (attrIndex: number) => {
    const attr = workingAttributes[attrIndex];
    const val = attr.inputValue.trim();
    if (!val) return;

    if (!attr.values.includes(val)) {
      const next = [...workingAttributes];
      next[attrIndex].values = [...next[attrIndex].values, val];
      next[attrIndex].inputValue = '';
      setWorkingAttributes(next);
    } else {
      const next = [...workingAttributes];
      next[attrIndex].inputValue = '';
      setWorkingAttributes(next);
    }
  };

  // Remove Attribute Value tag
  const handleRemoveValue = (attrIndex: number, valIndex: number) => {
    const next = [...workingAttributes];
    next[attrIndex].values = next[attrIndex].values.filter((_, i) => i !== valIndex);
    setWorkingAttributes(next);
  };

  // Add New Attribute Row
  const handleAddAttribute = () => {
    const next: WorkingAttribute = {
      id: `attr_${Date.now()}`,
      name: '',
      display_type: 'button',
      values: [],
      inputValue: ''
    };
    setWorkingAttributes([...workingAttributes, next]);
  };

  // Remove Attribute Row
  const handleRemoveAttribute = (attrIndex: number) => {
    setWorkingAttributes(workingAttributes.filter((_, i) => i !== attrIndex));
  };

  // Run Matrix Generator
  const handleGenerateMatrix = () => {
    const cleanAttrs = workingAttributes
      .filter(a => a.name.trim() && a.values.length > 0)
      .map(a => ({
        name: a.name.trim(),
        values: a.values
      }));

    if (cleanAttrs.length === 0) {
      alert(isTr ? 'Lütfen en az bir nitelik adı ve en az bir değer girin.' : 'Please enter at least one attribute and value.');
      return;
    }

    const generated = generateCartesianMatrix(cleanAttrs, baseProduct);
    onChange(generated);
    setShowGenerator(false);
  };

  // Bulk Apply Price
  const handleApplyBulkPrice = () => {
    const p = parseFloat(bulkPrice);
    if (isNaN(p) || p < 0) return;
    const next = variants.map(v => ({ ...v, price: p }));
    onChange(next);
    setBulkPrice('');
  };

  // Bulk Apply Stock
  const handleApplyBulkStock = () => {
    const s = parseInt(bulkStock, 10);
    if (isNaN(s) || s < 0) return;
    const next = variants.map(v => ({ ...v, stock_quantity: s }));
    onChange(next);
    setBulkStock('');
  };

  // Single Variant Updates
  const handleUpdateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const next = [...variants];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  // Delete Variant Row
  const handleDeleteVariant = (index: number) => {
    const next = variants.filter((_, i) => i !== index);
    onChange(next);
  };

  // Add Single Manual Variant
  const handleAddSingleVariant = () => {
    const newVariant: ProductVariant = {
      id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: isCafeRestaurant ? (isTr ? 'Ek Porsiyon / Seçenek' : 'Extra Portion') : (isTr ? 'Yeni Varyant' : 'New Option'),
      price: baseProduct.price || 0,
      cost_price: baseProduct.cost_price || 0,
      stock_quantity: baseProduct.stock_quantity !== undefined ? baseProduct.stock_quantity : 10,
      barcode: `${Date.now().toString().slice(-6)}${variants.length + 1}`.padStart(12, '869000'),
      sku: `${baseProduct.sku || 'PRD'}-VAR${variants.length + 1}`,
      variant_type: 'standard',
      is_active: true
    };
    onChange([...variants, newVariant]);
  };

  // Calculate estimated matrix count
  const validAttrs = workingAttributes.filter(a => a.name.trim() && a.values.length > 0);
  const estimatedCount = validAttrs.reduce((acc, curr) => acc * curr.values.length, 1);

  // Filtered variants for table
  const displayedVariants = variants.filter(v => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      (v.name && v.name.toLowerCase().includes(q)) ||
      (v.sku && v.sku.toLowerCase().includes(q)) ||
      (v.barcode && v.barcode.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Banner & Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-indigo-900 text-white rounded-2xl shadow-md border border-indigo-700">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              {isTr ? 'Dinamik Çok Sektörlü Varyant & Matris Motoru' : 'Dynamic Multi-Sector Variant Matrix'}
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-black bg-indigo-700 text-indigo-100 rounded-full border border-indigo-500">
              {variants.length} {isTr ? 'Varyant' : 'Variants'}
            </span>
          </div>
          <p className="text-xs text-indigo-200">
            {isTr 
              ? 'EAV tabanlı sınırsız nitelik, akıllı görsel değişimi, bağımsız stok & fiyat ve Google Merchant uyumu.' 
              : 'EAV dynamic attributes, smart image switching, independent stock/pricing and Google Merchant sync.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setShowGenerator(!showGenerator)}
            className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
              showGenerator 
                ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300' 
                : 'bg-indigo-800 hover:bg-indigo-700 text-white border border-indigo-600'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>{showGenerator ? (isTr ? 'Matris Ayarlarını Gizle' : 'Hide Matrix') : (isTr ? '⚡ Matris Oluşturucu' : '⚡ Matrix Generator')}</span>
          </button>

          <button
            type="button"
            onClick={handleAddSingleVariant}
            className="px-3 py-1.5 bg-white text-indigo-950 hover:bg-indigo-50 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isTr ? '+ Tekli Varyant' : '+ Single Variant'}</span>
          </button>
        </div>
      </div>

      {/* MATRIX GENERATOR WIZARD */}
      {showGenerator && (
        <div className="p-5 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-xl space-y-5 animate-fadeIn">
          {/* Sector Preset Buttons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                {isTr ? '1. Sektörel Hazır Nitelik Setleri (1-Tıkla Yükle)' : '1. Sector Attribute Presets (1-Click)'}
              </span>
              <span className="text-[10px] text-slate-400">
                {isTr ? 'Sektörünüze özel hazır şablonu seçebilirsiniz' : 'Select a preset for your industry'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {SECTOR_VARIANT_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Attributes Definition List */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5" />
                {isTr ? '2. Nitelik ve Değerleri Belirleyin (EAV Matrix)' : '2. Define Attributes & Values'}
              </span>

              <button
                type="button"
                onClick={handleAddAttribute}
                className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 border border-indigo-500/40"
              >
                <Plus className="w-3 h-3" />
                <span>{isTr ? '+ Yeni Nitelik Ekle' : '+ Add Attribute'}</span>
              </button>
            </div>

            {workingAttributes.map((attr, attrIdx) => (
              <div key={attr.id} className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex-1 w-full sm:w-auto">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      {isTr ? 'Nitelik Adı (Örn: Renk, Beden, Hafıza, Kumaş)' : 'Attribute Name'}
                    </label>
                    <input
                      type="text"
                      placeholder={isTr ? 'Örn: Renk, Beden, Porsiyon, Materyal' : 'e.g. Color, Size, Storage'}
                      value={attr.name}
                      onChange={e => {
                        const next = [...workingAttributes];
                        next[attrIdx].name = e.target.value;
                        setWorkingAttributes(next);
                      }}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs font-bold focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="w-full sm:w-44">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      {isTr ? 'Arayüz Görünümü' : 'Display Mode'}
                    </label>
                    <select
                      value={attr.display_type}
                      onChange={e => {
                        const next = [...workingAttributes];
                        next[attrIdx].display_type = e.target.value as any;
                        setWorkingAttributes(next);
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs font-bold focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="swatch">{isTr ? 'Renk Kutusu (Swatch)' : 'Color Swatch'}</option>
                      <option value="button">{isTr ? 'Buton / Kutu (Pills)' : 'Button Pills'}</option>
                      <option value="dropdown">{isTr ? 'Açılır Liste (Dropdown)' : 'Dropdown List'}</option>
                    </select>
                  </div>

                  {workingAttributes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAttribute(attrIdx)}
                      className="self-end sm:self-center p-2 text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer border border-rose-900/40"
                      title={isTr ? 'Niteliği Sil' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Values Tag Input */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {isTr ? 'Değerler (Yazıp Enter veya Ekle\'ye basın)' : 'Values'}
                  </label>

                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      placeholder={isTr ? 'Yeni değer yazın (Örn: Kırmızı veya XL)' : 'Enter value'}
                      value={attr.inputValue}
                      onChange={e => {
                        const next = [...workingAttributes];
                        next[attrIdx].inputValue = e.target.value;
                        setWorkingAttributes(next);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddValue(attrIdx);
                        }
                      }}
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs font-bold focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddValue(attrIdx)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-700"
                    >
                      {isTr ? '+ Ekle' : '+ Add'}
                    </button>
                  </div>

                  {/* Render Value Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {attr.values.map((v, valIdx) => {
                      const hex = getColorHex(v);
                      return (
                        <span
                          key={valIdx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-850 border border-slate-700 text-slate-100 rounded-lg text-xs font-bold shadow-2xs"
                        >
                          {hex && (
                            <span
                              className="w-3 h-3 rounded-full border border-white/30 shrink-0"
                              style={{ backgroundColor: hex }}
                            />
                          )}
                          <span>{v}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveValue(attrIdx, valIdx)}
                            className="text-slate-400 hover:text-rose-400 transition-colors ml-0.5 cursor-pointer font-black"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}

            {/* Matrix Calculation Summary & Generate Button */}
            <div className="p-4 bg-indigo-950/60 rounded-2xl border border-indigo-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-0.5 text-center sm:text-left">
                <span className="text-xs font-black text-amber-300 flex items-center justify-center sm:justify-start gap-1.5">
                  <Wand2 className="w-4 h-4" />
                  {isTr ? 'Matris Kombinasyon Hesabı' : 'Combinations Calculation'}
                </span>
                <p className="text-xs text-slate-300">
                  {validAttrs.length > 0 ? (
                    <>
                      {validAttrs.map(a => `${a.name} (${a.values.length})`).join(' × ')} = <strong className="text-white font-extrabold">{estimatedCount} {isTr ? 'Benzersiz Kombinasyon' : 'Combinations'}</strong>
                    </>
                  ) : (
                    isTr ? 'Lütfen nitelik ve değerleri giriniz' : 'Please define attributes and values'
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerateMatrix}
                disabled={validAttrs.length === 0}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <Wand2 className="w-4 h-4" />
                <span>{isTr ? `⚡ Kombinasyonları Oluştur (${estimatedCount} Adet)` : `⚡ Generate Matrix (${estimatedCount})`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK ACTIONS & SEARCH BAR */}
      {variants.length > 0 && (
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={isTr ? 'Varyant adı, SKU veya barkod ara...' : 'Filter variants...'}
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none w-52 sm:w-64"
              />
              <span className="text-[11px] font-bold text-slate-500">
                {displayedVariants.length} / {variants.length}
              </span>
            </div>

            {/* Bulk Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Bulk Price */}
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  placeholder={isTr ? 'Toplu Fiyat' : 'Bulk Price'}
                  value={bulkPrice}
                  onChange={e => setBulkPrice(e.target.value)}
                  className="w-24 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyBulkPrice}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {isTr ? 'Fiyat Ata' : 'Set Price'}
                </button>
              </div>

              {/* Bulk Stock */}
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  placeholder={isTr ? 'Toplu Stok' : 'Bulk Stock'}
                  value={bulkStock}
                  onChange={e => setBulkStock(e.target.value)}
                  className="w-24 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyBulkStock}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {isTr ? 'Stok Ata' : 'Set Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VARIANTS LIST TABLE */}
      {variants.length > 0 ? (
        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
          {displayedVariants.map((variant, index) => {
            const isExpanded = expandedVariantId === variant.id;
            const hex = variant.color_code || getColorHex(variant.color_name || '') || (variant.attributes ? getColorHex(variant.attributes['Renk'] || variant.attributes['Color'] || '') : undefined);

            return (
              <div
                key={variant.id || index}
                className={`p-3.5 bg-white rounded-2xl border transition-all ${
                  variant.is_active === false 
                    ? 'border-slate-200 opacity-60 bg-slate-50' 
                    : 'border-slate-200 hover:border-indigo-300 shadow-2xs'
                }`}
              >
                {/* Main Row */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                  {/* Left: Badge + Name + Color Swatch */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-[10px] font-black flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>

                    {/* Color Swatch / Image Preview */}
                    {variant.image_url ? (
                      <img 
                        src={variant.image_url} 
                        alt="" 
                        className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0" 
                        referrerPolicy="no-referrer"
                      />
                    ) : hex ? (
                      <span
                        className="w-6 h-6 rounded-full border border-black/15 shadow-xs shrink-0"
                        style={{ backgroundColor: hex }}
                        title={variant.color_name || 'Renk'}
                      />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
                    )}

                    <div className="min-w-0 flex-1">
                      <input
                        type="text"
                        value={variant.name || ''}
                        onChange={e => handleUpdateVariant(index, 'name', e.target.value)}
                        placeholder={isTr ? 'Varyant Adı' : 'Variant Name'}
                        className="font-extrabold text-xs text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-600 focus:bg-slate-50 px-1 py-0.5 rounded outline-none w-full truncate"
                      />

                      {/* Attributes Tags Summary */}
                      {variant.attributes && Object.keys(variant.attributes).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {Object.entries(variant.attributes).map(([k, v]) => (
                            <span key={k} className="text-[9px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded border border-slate-200">
                              {k}: <strong>{v}</strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Center/Right: Pricing, Stock, SKU, Barcode Controls */}
                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
                    {/* Price Input */}
                    <div className="w-24">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block leading-tight">
                        {isTr ? 'Fiyat' : 'Price'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={variant.price !== undefined ? variant.price : ''}
                        onChange={e => handleUpdateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-emerald-700 focus:border-indigo-600 focus:outline-none"
                      />
                    </div>

                    {/* Stock Input */}
                    <div className="w-20">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block leading-tight">
                        {isTr ? 'Stok' : 'Stock'}
                      </label>
                      <input
                        type="number"
                        value={variant.stock_quantity !== undefined ? variant.stock_quantity : ''}
                        onChange={e => handleUpdateVariant(index, 'stock_quantity', parseInt(e.target.value, 10) || 0)}
                        placeholder="0"
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
                      />
                    </div>

                    {/* SKU Input */}
                    <div className="w-28 hidden sm:block">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block leading-tight">
                        SKU
                      </label>
                      <input
                        type="text"
                        value={variant.sku || ''}
                        onChange={e => handleUpdateVariant(index, 'sku', e.target.value)}
                        placeholder="SKU-123"
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-700 focus:border-indigo-600 focus:outline-none"
                      />
                    </div>

                    {/* Barcode Input */}
                    <div className="w-28 hidden md:block">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block leading-tight">
                        {isTr ? 'Barkod' : 'Barcode'}
                      </label>
                      <input
                        type="text"
                        value={variant.barcode || ''}
                        onChange={e => handleUpdateVariant(index, 'barcode', e.target.value)}
                        placeholder="869000..."
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-700 focus:border-indigo-600 focus:outline-none"
                      />
                    </div>

                    {/* Expand Details & Delete */}
                    <div className="flex items-center gap-1 pt-3 lg:pt-0">
                      <button
                        type="button"
                        onClick={() => setExpandedVariantId(isExpanded ? null : variant.id)}
                        className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title={isTr ? 'Detaylı Ayarlar' : 'Details'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteVariant(index)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title={isTr ? 'Varyantı Sil' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Settings Panel (Image, Cost Price, Variant Behavior Type, Item Group ID) */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/70 p-3 rounded-xl">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                        {isTr ? 'Varyanta Özel Görsel URL' : 'Variant Image URL'}
                      </label>
                      <div className="flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          value={variant.image_url || ''}
                          onChange={e => handleUpdateVariant(index, 'image_url', e.target.value)}
                          placeholder="https://..."
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                        {isTr ? 'Alış / Maliyet Fiyatı' : 'Cost Price'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={variant.cost_price !== undefined ? variant.cost_price : ''}
                        onChange={e => handleUpdateVariant(index, 'cost_price', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:border-indigo-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                        {isTr ? 'Varyant Davranış Tipi' : 'Behavior Type'}
                      </label>
                      <select
                        value={variant.variant_type || 'standard'}
                        onChange={e => handleUpdateVariant(index, 'variant_type', e.target.value as VariantBehaviorType)}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:border-indigo-600 focus:outline-none"
                      >
                        <option value="standard">{isTr ? 'Standart (Fiyat + Stok)' : 'Standard (Price + Stock)'}</option>
                        <option value="price_only">{isTr ? 'Sadece Fiyat (Üretim/Hizmet)' : 'Price Only (No Stock)'}</option>
                        <option value="addon_option">{isTr ? 'Ekstra Opsiyon (Sos/Malzeme)' : 'Addon Option'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                        {isTr ? 'Google & ERP Group ID' : 'Item Group ID'}
                      </label>
                      <input
                        type="text"
                        value={variant.item_group_id || ''}
                        onChange={e => handleUpdateVariant(index, 'item_group_id', e.target.value)}
                        placeholder={baseProduct.sku || 'GROUP-123'}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:border-indigo-600 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 space-y-2">
          <Package className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs font-bold text-slate-600">
            {isTr ? 'Henüz hiçbir varyant eklenmedi.' : 'No variants added yet.'}
          </p>
          <p className="text-[11px] text-slate-400 max-w-md mx-auto">
            {isTr 
              ? 'Yukarıdaki "⚡ Matris Oluşturucu" butonuna tıklayarak Renk, Beden, Hafıza gibi seçeneklerden saniyeler içinde onlarca varyant üretebilir veya tek tek ekleyebilirsiniz.'
              : 'Click "⚡ Matrix Generator" above to create combinations or add variants manually.'}
          </p>
        </div>
      )}
    </div>
  );
};
