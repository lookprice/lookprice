import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Upload, Sparkles, AlertCircle, Check, Loader2, ListPlus } from "lucide-react";
import { toast } from "react-hot-toast";
import { api } from "../../../services/api";

interface AiMenuScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  storeId?: number;
  onSuccess: () => void;
}

export default function AiMenuScanModal({ isOpen, onClose, lang, storeId, onSuccess }: AiMenuScanModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = {
    title: lang === 'tr' ? 'Yapay Zeka Menü Tarayıcı' : 'AI Menu Scanner',
    desc: lang === 'tr' ? 'Basılı menünüzün fotoğrafını yükleyin, yapay zeka ürünleri ve kategorileri otomatik çıkartsın.' : 'Upload a photo of your printed menu, and AI will automatically extract products and categories.',
    uploadBtn: lang === 'tr' ? 'Menü Görseli Seç' : 'Select Menu Image',
    scanBtn: lang === 'tr' ? 'Tara ve Çıkar' : 'Scan and Extract',
    savingBtn: lang === 'tr' ? 'Kaydediliyor...' : 'Saving...',
    saveBtn: lang === 'tr' ? 'Ürünleri Kaydet' : 'Save Products',
    cancelBtn: lang === 'tr' ? 'İptal' : 'Cancel',
    successScan: lang === 'tr' ? 'Menü başarıyla tarandı!' : 'Menu scanned successfully!',
    successSave: lang === 'tr' ? 'Ürünler başarıyla eklendi!' : 'Products added successfully!',
    errorFile: lang === 'tr' ? 'Lütfen bir görsel seçin.' : 'Please select an image.',
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error(lang === 'tr' ? "Görsel boyutu en fazla 10MB olmalıdır." : "Image size must be less than 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
      setParsedData(null); // reset previous scan if any
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!selectedImage) {
      toast.error(t.errorFile);
      return;
    }

    setIsScanning(true);
    try {
      const res = await api.parseMenuImage(selectedImage, lang);
      if (res && res.categories) {
        setParsedData(res);
        toast.success(t.successScan);
      } else {
        throw new Error(lang === 'tr' ? "Geçerli bir veri bulunamadı." : "No valid data found.");
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || e.message || "Error parsing menu");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSave = async () => {
    if (!parsedData || !parsedData.categories) return;

    setIsSaving(true);
    try {
      const productsToSave: any[] = [];
      parsedData.categories.forEach((cat: any) => {
        cat.products.forEach((prod: any) => {
          productsToSave.push({
            name: prod.name,
            description: prod.description || "",
            price: Number(prod.price) || 0,
            category: cat.name,
            currency: "TRY",
            stock: 999, // default
          });
        });
      });

      if (productsToSave.length === 0) {
        toast.error(lang === 'tr' ? "Kaydedilecek ürün bulunamadı." : "No products to save.");
        return;
      }

      const res = await api.addBulkProducts(productsToSave, storeId);
      if (res && res.success) {
        toast.success(t.successSave);
        onSuccess();
        onClose();
        // Reset state
        setSelectedImage(null);
        setParsedData(null);
      } else {
        toast.error(res?.error || "Error saving products");
      }
    } catch (e: any) {
      toast.error(e.message || "Error saving products");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col"
      >
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">{t.title}</h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.desc}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!parsedData ? (
            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group relative overflow-hidden"
              >
                {selectedImage ? (
                  <img src={selectedImage} alt="Menu preview" className="absolute inset-0 w-full h-full object-contain p-2" />
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-slate-400" />
                    </div>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{t.uploadBtn}</span>
                    <span className="text-xs font-medium text-slate-400 mt-1">PNG, JPG (Max 10MB)</span>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>

              {selectedImage && (
                <button
                  onClick={handleScan}
                  disabled={isScanning}
                  className="w-full p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  <span>{isScanning ? (lang === 'tr' ? 'Görsel Taranıyor...' : 'Scanning Image...') : t.scanBtn}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    {lang === 'tr' ? 'Tarama Tamamlandı' : 'Scan Completed'}
                  </h4>
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                    {lang === 'tr' 
                      ? 'Yapay zeka menünüzü inceledi ve aşağıdaki ürünleri çıkardı. Kaydetmeden önce listeyi gözden geçirebilirsiniz.' 
                      : 'AI has analyzed your menu and extracted the following items. Please review the list before saving.'}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {parsedData.categories.map((cat: any, i: number) => (
                  <div key={i} className="space-y-3">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      {cat.name}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {cat.products.map((prod: any, j: number) => (
                        <div key={j} className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{prod.name}</h4>
                              <span className="text-sm font-black text-slate-900 dark:text-white whitespace-nowrap bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">{prod.price} ₺</span>
                            </div>
                            {prod.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{prod.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {parsedData && (
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 sticky bottom-0">
            <button
              onClick={() => {
                setParsedData(null);
                setSelectedImage(null);
              }}
              disabled={isSaving}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
            >
              {lang === 'tr' ? 'Yeniden Tara' : 'Scan Again'}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListPlus className="w-4 h-4" />}
              <span>{isSaving ? t.savingBtn : t.saveBtn}</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
