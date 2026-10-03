import React, { useState, useEffect } from "react";
import { 
  X, 
  Sparkles, 
  CheckCircle, 
  RefreshCw, 
  Layers, 
  Check, 
  Package, 
  Cpu, 
  Camera, 
  Coffee, 
  Tv, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  FolderTree
} from "lucide-react";
import { api } from "../services/api";
import { toast } from "sonner";

interface SectorPackage {
  id: string;
  name: string;
  description: string;
  icon: string;
  categories: {
    category: string;
    sub_categories: string[];
    hb_category_id?: number;
  }[];
}

interface SectorTaxonomyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storeId?: number;
  storeName?: string;
}

export const SectorTaxonomyModal: React.FC<SectorTaxonomyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  storeId,
  storeName
}) => {
  const [packages, setPackages] = useState<SectorPackage[]>([]);
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>(["tech_computer", "small_appliances", "consumer_electronics", "photography_camera"]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [expandedPkg, setExpandedPkg] = useState<string | null>("tech_computer");

  const [bridging, setBridging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getSectorTaxonomyPackages()
        .then((res: any) => {
          if (res.data?.packages) {
            setPackages(res.data.packages);
          }
        })
        .catch((err) => {
          console.error("Failed to load sector packages:", err);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const togglePackage = (id: string) => {
    setSelectedPackageIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleApply = async () => {
    if (selectedPackageIds.length === 0) {
      toast.error("Lütfen en az bir sektör kategorisi seçiniz.");
      return;
    }

    setApplying(true);
    try {
      const res = await api.seedSectorTaxonomy(selectedPackageIds, storeId);
      toast.success(
        res.data?.addedCategoriesCount > 0
          ? `${res.data.addedCategoriesCount} adet standart Hepsiburada kategorisi ve alt kategorisi mağazanıza başarıyla tanımlandı!`
          : "Kategori paketleri ve filtre taksonomisi güncellendi."
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Apply taxonomy error:", err);
      toast.error(err.response?.data?.error || "Kategori paketi uygulanamadı.");
    } finally {
      setApplying(false);
    }
  };

  const handleAutoBridge = async () => {
    setBridging(true);
    try {
      const res = await api.autoBridgeCategories(storeId);
      if (res.data?.mappedCount > 0) {
        toast.success(`${res.data.mappedCount} adet mevcut mağaza kategorisi arka planda Hepsiburada/Amazon kanonik ağacına köprülendi!`);
      } else {
        toast.info("Tüm mevcut kategoriler zaten pazar yeri taksonomisine köprülü durumda.");
      }
      onSuccess();
    } catch (err: any) {
      console.error("Auto bridge error:", err);
      toast.error(err.response?.data?.error || "Kategori köprüleme başarısız oldu.");
    } finally {
      setBridging(false);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Cpu": return <Cpu className="w-5 h-5 text-indigo-600" />;
      case "Camera": return <Camera className="w-5 h-5 text-emerald-600" />;
      case "Coffee": return <Coffee className="w-5 h-5 text-amber-600" />;
      case "Tv": return <Tv className="w-5 h-5 text-cyan-600" />;
      default: return <Package className="w-5 h-5 text-indigo-600" />;
    }
  };

  const totalCategoriesCount = packages
    .filter(p => selectedPackageIds.includes(p.id))
    .reduce((acc, p) => acc + p.categories.length, 0);

  const totalSubCategoriesCount = packages
    .filter(p => selectedPackageIds.includes(p.id))
    .reduce((acc, p) => acc + p.categories.reduce((cAcc, c) => cAcc + c.sub_categories.length, 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-600 rounded-xl border border-indigo-200">
              <FolderTree className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Standart Sektör & Hepsiburada Kategori Taksonomisi
                </h3>
                {storeName && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-800 rounded-md border border-indigo-200">
                    {storeName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Mağaza açılışında kategorileri ve alt kategorileri 1:1 Hepsiburada standart şablonlarıyla eşleştirir, sıfır zahmetle zengin web filtreleri oluşturur.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-5 py-2.5 bg-amber-50/80 border-b border-amber-200 flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Seçilen sektör paketleri sisteme tanımlandığında, ürün eklerken kategori eşleştirme gerekmez; e-Ticaret vitrininizde filtreler otomatik canlanır.
            </span>
          </div>
          <div className="text-[11px] font-black shrink-0 px-2 py-0.5 bg-amber-200/70 rounded text-amber-900">
            {totalCategoriesCount} Ana Kategori | {totalSubCategoriesCount} Alt Kategori Seçili
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/40">
          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">Kategori paketleri yükleniyor...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {packages.map((pkg) => {
                const isSelected = selectedPackageIds.includes(pkg.id);
                const isExpanded = expandedPkg === pkg.id;

                return (
                  <div
                    key={pkg.id}
                    className={`bg-white rounded-xl border transition-all ${
                      isSelected 
                        ? "border-indigo-300 shadow-sm" 
                        : "border-slate-200 opacity-80"
                    }`}
                  >
                    <div className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => togglePackage(pkg.id)}
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                            isSelected 
                              ? "bg-indigo-600 border-indigo-600 text-white" 
                              : "border-slate-300 hover:border-slate-400 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>
                        <div className="p-2 bg-slate-100 rounded-lg">
                          {getIcon(pkg.icon)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-slate-900">{pkg.name}</h4>
                            <span className="text-[11px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                              {pkg.categories.length} Ana Kategori
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium line-clamp-1">{pkg.description}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedPkg(isExpanded ? null : pkg.id)}
                        className="px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>{isExpanded ? "Detayı Gizle" : "Kategorileri İncele"}</span>
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      </button>
                    </div>

                    {/* Expanded categories drawer */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50/50 rounded-b-xl space-y-2.5 animate-in fade-in">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Bu Paketteki Kategoriler ve Alt Dal Ağacı:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {pkg.categories.map((c, idx) => (
                            <div key={idx} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs space-y-1">
                              <div className="font-bold text-slate-900 flex items-center justify-between">
                                <span>📁 {c.category}</span>
                                <span className="text-[10px] text-indigo-600 font-mono">
                                  {c.sub_categories.length} alt grup
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1 pt-1">
                                {c.sub_categories.map((sub, sIdx) => (
                                  <span key={sIdx} className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-700 rounded border border-slate-200/60">
                                    {sub}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Mevcut ürünlerinizi veya özel kategorilerinizi silmez, üstüne zenginleştirir.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoBridge}
              disabled={bridging || loading}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Mevcut kategori isimlerinizi değiştirmeden arka planda Hepsiburada/Amazon standartlarına bağlar"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${bridging ? "animate-spin" : ""}`} />
              <span>{bridging ? "Köprüleniyor..." : "Mevcut Kategorileri Otomatik Köprüle"}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              Kapat
            </button>
            <button
              onClick={handleApply}
              disabled={applying || loading || selectedPackageIds.length === 0}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {applying ? "Tanımlanıyor..." : "Seçilen Paketleri Mağazaya Tanımla"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
