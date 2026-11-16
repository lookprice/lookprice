import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FolderTree,
  Folder,
  FolderOpen,
  Plus,
  Search,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ArrowRightLeft,
  GitMerge,
  ArrowUpRight,
  CornerDownRight,
  Globe,
  Check,
  X,
  Save,
  Package,
  AlertTriangle,
  Percent,
  CheckSquare,
  Square,
  ChevronRight,
  ChevronDown,
  Loader2,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { matchProductSearch } from "@/lib/searchUtils";
import { resolveDomainId } from "@/utils/sectorCapability";

export interface CategorySubNode {
  name: string;
  is_visible: boolean;
  description?: string;
  image_url?: string;
  product_count: number;
  web_active_count: number;
  web_passive_count: number;
  total_stock: number;
}

export interface CategoryMainNode {
  name: string;
  is_visible: boolean;
  description?: string;
  image_url?: string;
  tax_rate?: number | null;
  product_count: number;
  web_active_count: number;
  web_passive_count: number;
  total_stock: number;
  sub_categories: CategorySubNode[];
}

export interface CategoriesTabProps {
  mode?: "tab" | "modal";
  isOpen?: boolean;
  onClose?: () => void;
  products: any[];
  branding: any;
  setBranding?: (next: any) => void;
  currentStoreId?: number;
  isViewer?: boolean;
  onRefreshProducts?: () => void;
  onApplyTaxRule?: (category: string, taxRate: number) => Promise<void> | void;
  onNavigateToProducts?: (category?: string) => void;
}

type SelectionTarget =
  | { type: "uncategorized" }
  | { type: "main"; category: string }
  | { type: "sub"; category: string; subCategory: string };

export const CategoriesTab: React.FC<CategoriesTabProps> = ({
  mode = "tab",
  isOpen = true,
  onClose,
  products,
  branding,
  setBranding,
  currentStoreId,
  isViewer = false,
  onRefreshProducts,
  onApplyTaxRule,
}) => {
  const { lang } = useLanguage();
  const isTr = lang === "tr";
  const domainId = resolveDomainId(branding);
  const isShopLp = domainId === "RETAIL" || domainId === "BOOKSTORE";
  const isCafe = domainId === "HORECA" || domainId === "HOTEL";
  const hasMenuOrShowcase = isShopLp || isCafe;

  const [studioLoading, setStudioLoading] = useState(false);
  const [savingTree, setSavingTree] = useState(false);
  const [categoriesTree, setCategoriesTree] = useState<CategoryMainNode[]>([]);
  const [uncategorizedStats, setUncategorizedStats] = useState({
    product_count: 0,
    web_active_count: 0,
    web_passive_count: 0,
    total_stock: 0,
  });

  const [treeSearch, setTreeSearch] = useState("");
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [selectedTarget, setSelectedTarget] = useState<SelectionTarget>({ type: "uncategorized" });

  // New Category / Subcategory Forms
  const [showNewMainInput, setShowNewMainInput] = useState(false);
  const [newMainName, setNewMainName] = useState("");
  const [newSubName, setNewSubName] = useState("");

  // Rename / Metadata Inspector Form
  const [renameDraft, setRenameDraft] = useState("");
  const [descDraft, setDescDraft] = useState("");
  const [imgDraft, setImgDraft] = useState("");
  const [taxDraft, setTaxDraft] = useState<string>("");
  const [isVisibleDraft, setIsVisibleDraft] = useState(true);
  const [isBusyAction, setIsBusyAction] = useState(false);

  // Move / Merge / Safe Delete Popovers
  const [activeOperation, setActiveOperation] = useState<null | "move" | "merge" | "delete" | "assign_products">(null);
  const [opTargetCat, setOpTargetCat] = useState("");
  const [opTargetSub, setOpTargetSub] = useState("");
  const [opNewName, setOpNewName] = useState("");
  const [deleteMode, setDeleteMode] = useState<"migrate" | "clear" | "hide_products">("migrate");

  // Product list inside selected category + Assign Product Picker
  const [productSearch, setProductSearch] = useState("");
  const [selectedProdIds, setSelectedProdIds] = useState<number[]>([]);
  const [reassignTargetCat, setReassignTargetCat] = useState("");
  const [reassignTargetSub, setReassignTargetSub] = useState("");
  const [assignPickerSearch, setAssignPickerSearch] = useState("");
  const [assignPickerIds, setAssignPickerIds] = useState<number[]>([]);

  const fetchStudioData = useCallback(async () => {
    setStudioLoading(true);
    try {
      const res = await api.getCategoryStudio(currentStoreId);
      if (res && Array.isArray(res.categories)) {
        setCategoriesTree(res.categories);
        setUncategorizedStats(
          res.uncategorized || {
            product_count: 0,
            web_active_count: 0,
            web_passive_count: 0,
            total_stock: 0,
          }
        );

        setSelectedTarget((prev) => {
          if (prev.type === "uncategorized") {
            if ((res.uncategorized?.product_count || 0) === 0 && res.categories.length > 0) {
              return { type: "main", category: res.categories[0].name };
            }
            return prev;
          }
          if (prev.type === "main") {
            const exists = res.categories.some((c: any) => c.name === prev.category);
            if (!exists) {
              return res.categories.length > 0
                ? { type: "main", category: res.categories[0].name }
                : { type: "uncategorized" };
            }
            return prev;
          }
          if (prev.type === "sub") {
            const mainNode = res.categories.find((c: any) => c.name === prev.category);
            const subExists = mainNode?.sub_categories?.some((s: any) => s.name === prev.subCategory);
            if (!mainNode) {
              return res.categories.length > 0
                ? { type: "main", category: res.categories[0].name }
                : { type: "uncategorized" };
            }
            if (!subExists) {
              return { type: "main", category: mainNode.name };
            }
            return prev;
          }
          return prev;
        });
      }
    } catch (err: any) {
      toast.error(err?.message || (isTr ? "Kategoriler yüklenemedi" : "Failed to load categories"));
    } finally {
      setStudioLoading(false);
    }
  }, [currentStoreId, isTr]);

  useEffect(() => {
    if (mode === "tab" || isOpen) {
      fetchStudioData();
    }
  }, [mode, isOpen, fetchStudioData]);

  // Sync branding state locally so ProductModal & Storefront previews stay fresh
  const syncLocalBranding = useCallback(
    (nextTree: CategoryMainNode[], nextTaxRules?: any[]) => {
      if (!setBranding || !branding) return;
      const serialized = nextTree.map((c) => {
        const subMeta: Record<string, any> = {};
        c.sub_categories.forEach((s) => {
          if (s.is_visible === false || s.description || s.image_url) {
            subMeta[s.name] = {
              is_visible: s.is_visible !== false,
              ...(s.description ? { description: s.description } : {}),
              ...(s.image_url ? { image_url: s.image_url } : {}),
            };
          }
        });
        return {
          name: c.name,
          sub_categories: c.sub_categories.map((s) => s.name),
          is_visible: c.is_visible !== false,
          ...(c.description ? { description: c.description } : {}),
          ...(c.image_url ? { image_url: c.image_url } : {}),
          ...(c.tax_rate !== undefined && c.tax_rate !== null ? { tax_rate: c.tax_rate } : {}),
          ...(Object.keys(subMeta).length > 0 ? { sub_category_meta: subMeta } : {}),
        };
      });
      setBranding({
        ...branding,
        operator_categories: serialized,
        ...(nextTaxRules ? { category_tax_rules: nextTaxRules } : {}),
      });
    },
    [branding, setBranding]
  );

  const persistTreeToServer = async (nextTree: CategoryMainNode[], successMsg?: string) => {
    setSavingTree(true);
    try {
      const payload = nextTree.map((c) => {
        const subMeta: Record<string, any> = {};
        c.sub_categories.forEach((s) => {
          if (s.is_visible === false || s.description || s.image_url) {
            subMeta[s.name] = {
              is_visible: s.is_visible !== false,
              ...(s.description ? { description: s.description } : {}),
              ...(s.image_url ? { image_url: s.image_url } : {}),
            };
          }
        });
        return {
          name: c.name,
          sub_categories: c.sub_categories.map((s) => s.name),
          is_visible: c.is_visible !== false,
          description: c.description || "",
          image_url: c.image_url || "",
          tax_rate: c.tax_rate ?? null,
          sub_category_meta: subMeta,
        };
      });

      const res = await api.saveCategoryTree(payload, currentStoreId);
      setCategoriesTree(nextTree);
      syncLocalBranding(nextTree, res?.category_tax_rules);
      if (successMsg) toast.success(successMsg);
    } catch (err: any) {
      toast.error(err?.message || (isTr ? "Kategori ağacı kaydedilemedi" : "Failed to save category tree"));
    } finally {
      setSavingTree(false);
    }
  };

  // Current selected node objects
  const selectedMainNode = useMemo(() => {
    if (selectedTarget.type === "uncategorized") return null;
    return categoriesTree.find((c) => c.name === selectedTarget.category) || null;
  }, [categoriesTree, selectedTarget]);

  const selectedSubNode = useMemo(() => {
    if (selectedTarget.type !== "sub" || !selectedMainNode) return null;
    return selectedMainNode.sub_categories.find((s) => s.name === selectedTarget.subCategory) || null;
  }, [selectedMainNode, selectedTarget]);

  // Populate Inspector Drafts whenever selection changes
  useEffect(() => {
    setActiveOperation(null);
    setSelectedProdIds([]);
    setProductSearch("");
    if (selectedTarget.type === "main" && selectedMainNode) {
      setRenameDraft(selectedMainNode.name);
      setDescDraft(selectedMainNode.description || "");
      setImgDraft(selectedMainNode.image_url || "");
      setTaxDraft(selectedMainNode.tax_rate !== null && selectedMainNode.tax_rate !== undefined ? String(selectedMainNode.tax_rate) : "");
      setIsVisibleDraft(selectedMainNode.is_visible !== false);
    } else if (selectedTarget.type === "sub" && selectedSubNode) {
      setRenameDraft(selectedSubNode.name);
      setDescDraft(selectedSubNode.description || "");
      setImgDraft(selectedSubNode.image_url || "");
      setTaxDraft("");
      setIsVisibleDraft(selectedSubNode.is_visible !== false);
    } else {
      setRenameDraft("");
      setDescDraft("");
      setImgDraft("");
      setTaxDraft("");
      setIsVisibleDraft(true);
    }
  }, [selectedTarget, selectedMainNode, selectedSubNode]);

  // Filtered left tree
  const filteredTree = useMemo(() => {
    const q = treeSearch.trim().toLocaleLowerCase("tr-TR");
    if (!q) return categoriesTree;
    return categoriesTree
      .map((cat) => {
        const catMatches = cat.name.toLocaleLowerCase("tr-TR").includes(q);
        const matchedSubs = cat.sub_categories.filter((s) => s.name.toLocaleLowerCase("tr-TR").includes(q));
        if (catMatches) return cat;
        if (matchedSubs.length > 0) return { ...cat, sub_categories: matchedSubs };
        return null;
      })
      .filter(Boolean) as CategoryMainNode[];
  }, [categoriesTree, treeSearch]);

  // Filtered products belonging to current selection
  const scopedProducts = useMemo(() => {
    return (products || []).filter((p) => {
      const cat = String(p.category || "").trim();
      const sub = String(p.sub_category || "").trim();
      let inScope = false;
      if (selectedTarget.type === "uncategorized") {
        inScope = !cat;
      } else if (selectedTarget.type === "main") {
        inScope = cat.toLocaleLowerCase("tr-TR") === selectedTarget.category.toLocaleLowerCase("tr-TR");
      } else if (selectedTarget.type === "sub") {
        inScope =
          cat.toLocaleLowerCase("tr-TR") === selectedTarget.category.toLocaleLowerCase("tr-TR") &&
          sub.toLocaleLowerCase("tr-TR") === selectedTarget.subCategory.toLocaleLowerCase("tr-TR");
      }
      if (!inScope) return false;
      if (productSearch.trim()) {
        return matchProductSearch(p, productSearch);
      }
      return true;
    });
  }, [products, selectedTarget, productSearch]);

  // Candidates for "Assign Products to This Category" picker
  const assignPickerCandidates = useMemo(() => {
    if (activeOperation !== "assign_products" || selectedTarget.type === "uncategorized") return [];
    const targetCatLower = selectedTarget.category.toLocaleLowerCase("tr-TR");
    const targetSubLower = selectedTarget.type === "sub" ? selectedTarget.subCategory.toLocaleLowerCase("tr-TR") : null;
    return (products || [])
      .filter((p) => {
        const pCat = String(p.category || "").trim().toLocaleLowerCase("tr-TR");
        const pSub = String(p.sub_category || "").trim().toLocaleLowerCase("tr-TR");
        const alreadyInTarget = targetSubLower !== null ? pCat === targetCatLower && pSub === targetSubLower : pCat === targetCatLower;
        if (alreadyInTarget) return false;
        if (assignPickerSearch.trim()) return matchProductSearch(p, assignPickerSearch);
        return true;
      })
      .slice(0, 40);
  }, [products, activeOperation, selectedTarget, assignPickerSearch]);

  // Summary Metrics
  const summaryStats = useMemo(() => {
    const totalMain = categoriesTree.length;
    const totalSub = categoriesTree.reduce((sum, c) => sum + c.sub_categories.length, 0);
    const hiddenMain = categoriesTree.filter((c) => !c.is_visible).length;
    const totalProducts = (products || []).length;
    const webActiveProducts = (products || []).filter((p) => p.is_web_sale !== false).length;
    return { totalMain, totalSub, hiddenMain, totalProducts, webActiveProducts };
  }, [categoriesTree, products]);

  // --- ACTIONS ---
  const handleCreateMainCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newMainName.trim();
    if (!clean) return;
    if (categoriesTree.some((c) => c.name.toLocaleLowerCase("tr-TR") === clean.toLocaleLowerCase("tr-TR"))) {
      toast.error(isTr ? "Bu isimde bir ana kategori zaten var." : "Category already exists.");
      return;
    }
    const newNode: CategoryMainNode = {
      name: clean,
      is_visible: true,
      description: "",
      image_url: "",
      tax_rate: null,
      product_count: 0,
      web_active_count: 0,
      web_passive_count: 0,
      total_stock: 0,
      sub_categories: [],
    };
    const nextTree = [...categoriesTree, newNode];
    await persistTreeToServer(nextTree, isTr ? `"${clean}" kategorisi oluşturuldu.` : `Created "${clean}"`);
    setNewMainName("");
    setShowNewMainInput(false);
    setSelectedTarget({ type: "main", category: clean });
  };

  const handleCreateSubCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedMainNode) return;
    const clean = newSubName.trim();
    if (!clean) return;
    if (selectedMainNode.sub_categories.some((s) => s.name.toLocaleLowerCase("tr-TR") === clean.toLocaleLowerCase("tr-TR"))) {
      toast.error(isTr ? "Bu alt kategori zaten mevcut." : "Sub-category already exists.");
      return;
    }
    const nextTree = categoriesTree.map((c) =>
      c.name === selectedMainNode.name
        ? {
            ...c,
            sub_categories: [
              ...c.sub_categories,
              {
                name: clean,
                is_visible: true,
                description: "",
                image_url: "",
                product_count: 0,
                web_active_count: 0,
                web_passive_count: 0,
                total_stock: 0,
              },
            ],
          }
        : c
    );
    await persistTreeToServer(nextTree, isTr ? `"${clean}" alt kategorisi eklendi.` : `Added sub-category "${clean}"`);
    setExpandedCats((prev) => ({ ...prev, [selectedMainNode.name]: true }));
    setNewSubName("");
    setSelectedTarget({ type: "sub", category: selectedMainNode.name, subCategory: clean });
  };

  const handleReorderMain = async (idx: number, dir: -1 | 1) => {
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= categoriesTree.length) return;
    const copy = [...categoriesTree];
    const [moved] = copy.splice(idx, 1);
    copy.splice(nextIdx, 0, moved);
    await persistTreeToServer(copy, isTr ? "Kategori sırası güncellendi." : "Order updated.");
  };

  const handleReorderSub = async (catName: string, subIdx: number, dir: -1 | 1) => {
    const cat = categoriesTree.find((c) => c.name === catName);
    if (!cat) return;
    const nextIdx = subIdx + dir;
    if (nextIdx < 0 || nextIdx >= cat.sub_categories.length) return;
    const subsCopy = [...cat.sub_categories];
    const [moved] = subsCopy.splice(subIdx, 1);
    subsCopy.splice(nextIdx, 0, moved);
    const nextTree = categoriesTree.map((c) => (c.name === catName ? { ...c, sub_categories: subsCopy } : c));
    await persistTreeToServer(nextTree, isTr ? "Alt kategori sırası güncellendi." : "Sub-category order updated.");
  };

  const handleToggleNodeVisibility = async (catName: string, subName?: string) => {
    const nextTree = categoriesTree.map((c) => {
      if (c.name !== catName) return c;
      if (!subName) {
        return { ...c, is_visible: !c.is_visible };
      }
      return {
        ...c,
        sub_categories: c.sub_categories.map((s) =>
          s.name === subName ? { ...s, is_visible: !s.is_visible } : s
        ),
      };
    });
    await persistTreeToServer(
      nextTree,
      isTr
        ? isCafe
          ? "Menü & vitrin kategori görünürlüğü güncellendi."
          : "Vitrin kategori görünürlüğü güncellendi."
        : "Visibility updated."
    );
  };

  const handleSaveInspectorChanges = async () => {
    if (selectedTarget.type === "uncategorized") return;
    const trimmedName = renameDraft.trim();
    if (!trimmedName) {
      toast.error(isTr ? "Kategori adı boş olamaz." : "Name cannot be empty.");
      return;
    }

    setIsBusyAction(true);
    try {
      const oldMainName = selectedTarget.category;
      const oldSubName = selectedTarget.type === "sub" ? selectedTarget.subCategory : undefined;
      const nameChanged =
        selectedTarget.type === "main"
          ? trimmedName !== oldMainName
          : trimmedName !== oldSubName;

      if (nameChanged) {
        await api.renameCategory(
          selectedTarget.type === "main"
            ? { oldCategory: oldMainName, newCategory: trimmedName }
            : {
                oldCategory: oldMainName,
                oldSubCategory: oldSubName,
                newSubCategory: trimmedName,
              },
          currentStoreId
        );
      }

      // Also persist description, image_url, is_visible, tax_rate metadata
      const parsedTax = taxDraft.trim() !== "" && !isNaN(Number(taxDraft)) ? Number(taxDraft) : null;
      const nextTree = categoriesTree.map((c) => {
        if (c.name !== oldMainName) return c;
        if (selectedTarget.type === "main") {
          return {
            ...c,
            name: trimmedName,
            description: descDraft.trim(),
            image_url: imgDraft.trim(),
            tax_rate: parsedTax,
            is_visible: isVisibleDraft,
          };
        } else {
          return {
            ...c,
            sub_categories: c.sub_categories.map((s) =>
              s.name === oldSubName
                ? {
                    ...s,
                    name: trimmedName,
                    description: descDraft.trim(),
                    image_url: imgDraft.trim(),
                    is_visible: isVisibleDraft,
                  }
                : s
            ),
          };
        }
      });

      await persistTreeToServer(nextTree);
      if (selectedTarget.type === "main") {
        setSelectedTarget({ type: "main", category: trimmedName });
      } else {
        setSelectedTarget({ type: "sub", category: oldMainName, subCategory: trimmedName });
      }
      await fetchStudioData();
      if (onRefreshProducts) onRefreshProducts();
      toast.success(isTr ? "Kategori ayarları ve ürünler güncellendi." : "Category updated.");
    } catch (err: any) {
      toast.error(err?.message || (isTr ? "Güncelleme başarısız oldu." : "Update failed."));
    } finally {
      setIsBusyAction(false);
    }
  };

  const handleApplyCategoryTax = async () => {
    if (selectedTarget.type !== "main" || taxDraft.trim() === "") return;
    const rate = Number(taxDraft);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error(isTr ? "Geçerli bir KDV oranı girin (%0-%100)." : "Invalid VAT rate.");
      return;
    }
    setIsBusyAction(true);
    try {
      if (onApplyTaxRule) {
        await onApplyTaxRule(selectedTarget.category, rate);
      } else {
        await api.bulkUpdateTax(selectedTarget.category, rate, currentStoreId, false);
      }
      const nextTree = categoriesTree.map((c) =>
        c.name === selectedTarget.category ? { ...c, tax_rate: rate } : c
      );
      await persistTreeToServer(nextTree);
      if (onRefreshProducts) onRefreshProducts();
      toast.success(isTr ? `"${selectedTarget.category}" ürünlerine %${rate} KDV uygulandı.` : `Applied ${rate}% VAT.`);
    } catch (err: any) {
      toast.error(err?.message || (isTr ? "KDV güncellenemedi." : "Failed to apply VAT."));
    } finally {
      setIsBusyAction(false);
    }
  };

  const handleCategoryBulkWebSale = async (isWebSale: boolean) => {
    setIsBusyAction(true);
    try {
      const payload =
        selectedTarget.type === "uncategorized"
          ? { includeUncategorized: true, is_web_sale: isWebSale }
          : selectedTarget.type === "main"
          ? { category: selectedTarget.category, is_web_sale: isWebSale }
          : { category: selectedTarget.category, subCategory: selectedTarget.subCategory, is_web_sale: isWebSale };

      const res = await api.bulkCategoryWebSale(payload, currentStoreId);
      await fetchStudioData();
      if (onRefreshProducts) onRefreshProducts();
      toast.success(
        isTr
          ? `${res?.updatedCount ?? 0} ürün ${isCafe ? "menüde" : "vitrinde"} ${isWebSale ? "yayına alındı (Aktif)" : "kaldırıldı (Pasif)"}.`
          : `${res?.updatedCount ?? 0} products updated.`
      );
    } catch (err: any) {
      toast.error(err?.message || (isTr ? "Görünürlük güncellemesi başarısız." : "Failed to update showcase."));
    } finally {
      setIsBusyAction(false);
    }
  };

  const handleExecuteMove = async () => {
    if (selectedTarget.type === "uncategorized") return;
    setIsBusyAction(true);
    try {
      if (selectedTarget.type === "sub") {
        if (opTargetCat === "__promote__") {
          await api.moveCategoryNode(
            {
              action: "promote_sub",
              sourceCategory: selectedTarget.category,
              subCategory: selectedTarget.subCategory,
              newName: opNewName.trim() || selectedTarget.subCategory,
            },
            currentStoreId
          );
          setSelectedTarget({ type: "main", category: opNewName.trim() || selectedTarget.subCategory });
        } else {
          if (!opTargetCat) {
            toast.error(isTr ? "Hedef ana kategori seçin." : "Select target category.");
            setIsBusyAction(false);
            return;
          }
          await api.moveCategoryNode(
            {
              action: "move_sub",
              sourceCategory: selectedTarget.category,
              subCategory: selectedTarget.subCategory,
              targetCategory: opTargetCat,
            },
            currentStoreId
          );
          setSelectedTarget({ type: "sub", category: opTargetCat, subCategory: selectedTarget.subCategory });
        }
      } else {
        if (!opTargetCat || opTargetCat === selectedTarget.category) {
          toast.error(isTr ? "Farklı bir hedef ana kategori seçin." : "Select another main category.");
          setIsBusyAction(false);
          return;
        }
        await api.moveCategoryNode(
          {
            action: "demote_main",
            sourceCategory: selectedTarget.category,
            targetCategory: opTargetCat,
            newName: opNewName.trim() || selectedTarget.category,
          },
          currentStoreId
        );
        setSelectedTarget({ type: "sub", category: opTargetCat, subCategory: opNewName.trim() || selectedTarget.category });
      }
      setActiveOperation(null);
      await fetchStudioData();
      if (onRefreshProducts) onRefreshProducts();
      toast.success(isTr ? "Kategori hiyerarşisi güncellendi." : "Hierarchy updated.");
    } catch (err: any) {
      toast.error(err?.message || (isTr ? "Taşıma işlemi başarısız." : "Move failed."));
    } finally {
      setIsBusyAction(false);
    }
  };

  const handleExecuteMerge = async () => {
    if (selectedTarget.type === "uncategorized") return;
    if (!opTargetCat) {
      toast.error(isTr ? "Birleştirilecek hedef kategoriyi seçin." : "Select target category.");
      return;
    }
    setIsBusyAction(true);
    try {
      await api.mergeCategories(
        {
          sourceCategory: selectedTarget.category,
          sourceSubCategory: selectedTarget.type === "sub" ? selectedTarget.subCategory : undefined,
          targetCategory: opTargetCat,
          targetSubCategory: opTargetSub.trim() || undefined,
        },
        currentStoreId
      );
      setActiveOperation(null);
      setSelectedTarget(
        opTargetSub.trim()
          ? { type: "sub", category: opTargetCat, subCategory: opTargetSub.trim() }
          : { type: "main", category: opTargetCat }
      );
      await fetchStudioData();
      if (onRefreshProducts) onRefreshProducts();
      toast.success(isTr ? "Kategoriler başarıyla birleştirildi." : "Categories merged.");
    } catch (err: any) {
      toast.error(err?.message || (isTr ? "Birleştirme başarısız." : "Merge failed."));
    } finally {
      setIsBusyAction(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (selectedTarget.type === "uncategorized") return;
    if (deleteMode === "migrate" && !opTargetCat) {
      toast.error(isTr ? "Ürünlerin taşınacağı hedef kategoriyi seçin." : "Select target category.");
      return;
    }
    setIsBusyAction(true);
    try {
      await api.deleteCategoryNode(
        {
          category: selectedTarget.category,
          subCategory: selectedTarget.type === "sub" ? selectedTarget.subCategory : undefined,
          mode: deleteMode,
          targetCategory: deleteMode === "migrate" ? opTargetCat : undefined,
          targetSubCategory: deleteMode === "migrate" ? opTargetSub.trim() : undefined,
        },
        currentStoreId
      );
      setActiveOperation(null);
      if (selectedTarget.type === "sub") {
        setSelectedTarget({ type: "main", category: selectedTarget.category });
      } else {
        setSelectedTarget({ type: "uncategorized" });
      }
      await fetchStudioData();
      if (onRefreshProducts) onRefreshProducts();
      toast.success(isTr ? "Kategori güvenle silindi." : "Category deleted.");
    } catch (err: any) {
      toast.error(err?.message || (isTr ? "Silme işlemi başarısız." : "Delete failed."));
    } finally {
      setIsBusyAction(false);
    }
  };

  // Bulk actions on selected products inside right pane table
  const handleBulkScopedWebSale = async (isWebSale: boolean) => {
    if (selectedProdIds.length === 0) return;
    setIsBusyAction(true);
    try {
      await api.bulkUpdateWebSale(selectedProdIds, isWebSale, currentStoreId);
      setSelectedProdIds([]);
      await fetchStudioData();
      if (onRefreshProducts) onRefreshProducts();
      toast.success(
        isTr
          ? `${selectedProdIds.length} ürün ${isCafe ? "menüde" : "vitrinde"} ${isWebSale ? "yayına alındı" : "pasife alındı"}.`
          : `Updated showcase status.`
      );
    } catch (err: any) {
      toast.error(err?.message || (isTr ? "İşlem başarısız." : "Failed."));
    } finally {
      setIsBusyAction(false);
    }
  };

  const handleBulkReassignScopedProducts = async () => {
    if (selectedProdIds.length === 0) return;
    setIsBusyAction(true);
    try {
      await api.bulkUpdateCategory(
        selectedProdIds,
        reassignTargetCat.trim(),
        reassignTargetSub.trim(),
        true,
        currentStoreId
      );
      setSelectedProdIds([]);
      setReassignTargetCat("");
      setReassignTargetSub("");
      await fetchStudioData();
      if (onRefreshProducts) onRefreshProducts();
      toast.success(isTr ? `${selectedProdIds.length} ürün yeni kategoriye aktarıldı.` : "Products reassigned.");
    } catch (err: any) {
      toast.error(err?.message || (isTr ? "Aktarım başarısız." : "Reassign failed."));
    } finally {
      setIsBusyAction(false);
    }
  };

  const handleAssignPickerSubmit = async () => {
    if (assignPickerIds.length === 0 || selectedTarget.type === "uncategorized") return;
    setIsBusyAction(true);
    try {
      await api.bulkUpdateCategory(
        assignPickerIds,
        selectedTarget.category,
        selectedTarget.type === "sub" ? selectedTarget.subCategory : "",
        selectedTarget.type === "sub",
        currentStoreId
      );
      setAssignPickerIds([]);
      setActiveOperation(null);
      await fetchStudioData();
      if (onRefreshProducts) onRefreshProducts();
      toast.success(
        isTr
          ? `${assignPickerIds.length} ürün "${selectedTarget.category}" kategorisine eklendi.`
          : `Assigned ${assignPickerIds.length} products.`
      );
    } catch (err: any) {
      toast.error(err?.message || (isTr ? "Ürün ekleme başarısız." : "Assign failed."));
    } finally {
      setIsBusyAction(false);
    }
  };

  const handleToggleSingleProductWebSale = async (product: any) => {
    const nextVal = product.is_web_sale === false;
    try {
      await api.bulkUpdateWebSale([product.id], nextVal, currentStoreId);
      await fetchStudioData();
      if (onRefreshProducts) onRefreshProducts();
      toast.success(
        isTr
          ? `"${product.name}" ${isCafe ? "menüde" : "vitrinde"} ${nextVal ? "aktif edildi" : "pasife alındı"}.`
          : `Updated showcase status.`
      );
    } catch (err: any) {
      toast.error(err?.message || (isTr ? "Güncelleme başarısız." : "Failed."));
    }
  };

  if (mode === "modal" && !isOpen) return null;

  const targetTitle =
    selectedTarget.type === "uncategorized"
      ? isTr
        ? "Kategorisiz Ürünler"
        : "Uncategorized Products"
      : selectedTarget.type === "main"
      ? selectedTarget.category
      : `${selectedTarget.category} › ${selectedTarget.subCategory}`;

  const targetCounts =
    selectedTarget.type === "uncategorized"
      ? uncategorizedStats
      : selectedTarget.type === "sub" && selectedSubNode
      ? selectedSubNode
      : selectedMainNode || { product_count: 0, web_active_count: 0, web_passive_count: 0, total_stock: 0 };

  const content = (
    <div className="flex flex-col h-full w-full bg-slate-50 text-slate-900 select-none">
      {/* Single Clean Module Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-1 h-5 bg-indigo-600 rounded-full shrink-0" />
          <FolderTree className="w-4 h-4 text-indigo-600 shrink-0" />
          <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight uppercase truncate">
            {isTr ? "KATEGORİ YÖNETİMİ" : "CATEGORY MANAGEMENT"}
          </h2>
          <span className="hidden md:inline-flex items-center text-[11px] font-medium text-slate-500 font-mono tabular-nums">
            · {summaryStats.totalMain} {isTr ? "Ana" : "Main"} · {summaryStats.totalSub} {isTr ? "Alt" : "Sub"} ·{" "}
            {uncategorizedStats.product_count} {isTr ? "Kategorisiz" : "Uncategorized"}
            {hasMenuOrShowcase
              ? ` · ${summaryStats.webActiveProducts}/${summaryStats.totalProducts} ${isTr ? (isCafe ? "Menüde" : "Vitrinde") : "Live"}`
              : ""}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={fetchStudioData}
            disabled={studioLoading}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            title={isTr ? "Kategori istatistiklerini yenile" : "Refresh"}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${studioLoading ? "animate-spin text-indigo-600" : "text-slate-500"}`} />
            <span className="hidden sm:inline whitespace-nowrap">{isTr ? "Yenile" : "Refresh"}</span>
          </button>

          {!isViewer && (
            <button
              type="button"
              onClick={() => setShowNewMainInput((prev) => !prev)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isTr ? "Yeni Ana Kategori" : "New Category"}</span>
            </button>
          )}

          {mode === "modal" && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-colors ml-1"
              title={isTr ? "Kapat" : "Close"}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Master-Detail Split Workspace */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 overflow-hidden">
        {/* LEFT PANE: Category Hierarchy Tree */}
        <div className="lg:col-span-4 xl:col-span-4 bg-white border border-slate-200 rounded-xl flex flex-col min-h-0 overflow-hidden">
          <div className="p-2.5 border-b border-slate-200 space-y-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={treeSearch}
                onChange={(e) => setTreeSearch(e.target.value)}
                placeholder={isTr ? "Kategori veya alt kategori ara..." : "Search categories..."}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
              {treeSearch && (
                <button
                  type="button"
                  onClick={() => setTreeSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {showNewMainInput && !isViewer && (
              <form onSubmit={handleCreateMainCategory} className="flex items-center gap-1.5">
                <input
                  type="text"
                  autoFocus
                  value={newMainName}
                  onChange={(e) => setNewMainName(e.target.value)}
                  placeholder={isTr ? "Örn: Elektronik Aksesuar" : "Category name..."}
                  className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-indigo-400 rounded-lg text-slate-900 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={savingTree || !newMainName.trim()}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0"
                >
                  {isTr ? "Ekle" : "Add"}
                </button>
              </form>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {/* Virtual Uncategorized Bucket */}
            <button
              type="button"
              onClick={() => setSelectedTarget({ type: "uncategorized" })}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer border ${
                selectedTarget.type === "uncategorized"
                  ? "bg-amber-50 border-amber-300 text-amber-950 font-semibold"
                  : "bg-slate-50/60 border-slate-200/70 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">{isTr ? "Kategorisiz Ürünler" : "Uncategorized Products"}</span>
              </div>
              <span className="font-mono tabular-nums text-[11px] font-semibold text-amber-800 shrink-0">
                {uncategorizedStats.product_count}
              </span>
            </button>

            <div className="pt-1 border-t border-slate-100" />

            {studioLoading && categoriesTree.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                <span>{isTr ? "Kategoriler yükleniyor..." : "Loading categories..."}</span>
              </div>
            ) : filteredTree.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                {isTr ? "Kategori bulunamadı." : "No categories found."}
              </div>
            ) : (
              filteredTree.map((cat, idx) => {
                const isSelectedMain =
                  selectedTarget.type === "main" && selectedTarget.category === cat.name;
                const isExpanded = expandedCats[cat.name] ?? (cat.sub_categories.length > 0 && idx < 4);
                const fullIdx = categoriesTree.findIndex((c) => c.name === cat.name);

                return (
                  <div key={cat.name} className="space-y-0.5">
                    <div
                      onClick={() => setSelectedTarget({ type: "main", category: cat.name })}
                      className={`group flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer border ${
                        isSelectedMain
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white hover:bg-slate-50 text-slate-800 border-transparent hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCats((prev) => ({ ...prev, [cat.name]: !isExpanded }));
                          }}
                          className={`p-0.5 rounded cursor-pointer shrink-0 ${
                            isSelectedMain ? "hover:bg-white/15 text-slate-300" : "hover:bg-slate-200 text-slate-400"
                          }`}
                        >
                          {cat.sub_categories.length > 0 ? (
                            isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )
                          ) : (
                            <span className="w-3.5 h-3.5 inline-block" />
                          )}
                        </button>
                        {isSelectedMain ? (
                          <FolderOpen className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                        ) : (
                          <Folder className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        )}
                        <span className="truncate font-semibold">{cat.name}</span>
                        {!cat.is_visible && (
                          <EyeOff
                            className={`w-3 h-3 shrink-0 ${isSelectedMain ? "text-amber-300" : "text-rose-500"}`}
                            title={isTr ? (isCafe ? "Menüde Gizli" : "Vitrinde Gizli") : "Hidden on Storefront"}
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {!isViewer && !treeSearch && (
                          <div
                            className="hidden group-hover:flex items-center gap-0.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              disabled={fullIdx <= 0 || savingTree}
                              onClick={() => handleReorderMain(fullIdx, -1)}
                              className={`p-0.5 rounded cursor-pointer disabled:opacity-25 ${
                                isSelectedMain ? "hover:bg-white/20 text-white" : "hover:bg-slate-200 text-slate-600"
                              }`}
                              title={isTr ? "Yukarı Taşı" : "Move Up"}
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={fullIdx >= categoriesTree.length - 1 || savingTree}
                              onClick={() => handleReorderMain(fullIdx, 1)}
                              className={`p-0.5 rounded cursor-pointer disabled:opacity-25 ${
                                isSelectedMain ? "hover:bg-white/20 text-white" : "hover:bg-slate-200 text-slate-600"
                              }`}
                              title={isTr ? "Aşağı Taşı" : "Move Down"}
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <span
                          className={`font-mono tabular-nums text-[11px] px-1.5 py-0.5 rounded ${
                            isSelectedMain ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {cat.product_count}
                        </span>
                      </div>
                    </div>

                    {/* Sub-Categories */}
                    {isExpanded && cat.sub_categories.length > 0 && (
                      <div className="pl-5 space-y-0.5 border-l border-slate-200 ml-3.5">
                        {cat.sub_categories.map((sub, subIdx) => {
                          const isSelectedSub =
                            selectedTarget.type === "sub" &&
                            selectedTarget.category === cat.name &&
                            selectedTarget.subCategory === sub.name;

                          return (
                            <div
                              key={`${cat.name}::${sub.name}`}
                              onClick={() =>
                                setSelectedTarget({
                                  type: "sub",
                                  category: cat.name,
                                  subCategory: sub.name,
                                })
                              }
                              className={`group/sub flex items-center justify-between gap-1 px-2 py-1 rounded-lg text-[11.5px] transition-colors cursor-pointer ${
                                isSelectedSub
                                  ? "bg-indigo-600 text-white font-semibold"
                                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <CornerDownRight
                                  className={`w-3 h-3 shrink-0 ${
                                    isSelectedSub ? "text-indigo-200" : "text-slate-400"
                                  }`}
                                />
                                <span className="truncate">{sub.name}</span>
                                {!sub.is_visible && (
                                  <EyeOff
                                    className={`w-3 h-3 shrink-0 ${
                                      isSelectedSub ? "text-amber-200" : "text-rose-500"
                                    }`}
                                    title={isTr ? (isCafe ? "Menüde Gizli" : "Vitrinde Gizli") : "Hidden on Storefront"}
                                  />
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {!isViewer && !treeSearch && (
                                  <div
                                    className="hidden group-hover/sub:flex items-center gap-0.5"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      disabled={subIdx <= 0 || savingTree}
                                      onClick={() => handleReorderSub(cat.name, subIdx, -1)}
                                      className={`p-0.5 rounded cursor-pointer disabled:opacity-25 ${
                                        isSelectedSub ? "hover:bg-white/20 text-white" : "hover:bg-slate-200 text-slate-600"
                                      }`}
                                      title={isTr ? "Yukarı Taşı" : "Move Up"}
                                    >
                                      <ArrowUp className="w-2.5 h-2.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={subIdx >= cat.sub_categories.length - 1 || savingTree}
                                      onClick={() => handleReorderSub(cat.name, subIdx, 1)}
                                      className={`p-0.5 rounded cursor-pointer disabled:opacity-25 ${
                                        isSelectedSub ? "hover:bg-white/20 text-white" : "hover:bg-slate-200 text-slate-600"
                                      }`}
                                      title={isTr ? "Aşağı Taşı" : "Move Down"}
                                    >
                                      <ArrowDown className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                )}
                                <span
                                  className={`font-mono tabular-nums text-[10.5px] px-1 rounded ${
                                    isSelectedSub ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {sub.product_count}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: Category Inspector + Operations + Products Table */}
        <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-3 min-h-0 overflow-y-auto pr-0.5">
          {/* Inspector Header Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shrink-0">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="min-w-0">
                <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
                  {selectedTarget.type === "uncategorized"
                    ? isTr
                      ? "KATEGORİSİZ HAVUZ"
                      : "UNCATEGORIZED BUCKET"
                    : selectedTarget.type === "sub"
                    ? isTr
                      ? "ALT KATEGORİ DÜZENLEYİCİ"
                      : "SUB-CATEGORY INSPECTOR"
                    : isTr
                    ? "ANA KATEGORİ DÜZENLEYİCİ"
                    : "MAIN CATEGORY INSPECTOR"}
                </div>
                <h3 className="text-base font-bold text-slate-950 truncate">{targetTitle}</h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-600 font-mono tabular-nums">
                  <span>
                    <strong className="text-slate-900">{targetCounts.product_count}</strong> {isTr ? "Ürün" : "Products"}
                  </span>
                  {hasMenuOrShowcase && (
                    <>
                      <span>·</span>
                      <span className="text-emerald-700">
                        <strong>{targetCounts.web_active_count}</strong>{" "}
                        {isTr ? (isCafe ? "Menüde Aktif" : "Vitrinde Aktif") : "Active"}
                      </span>
                      <span>·</span>
                      <span className="text-rose-700">
                        <strong>{targetCounts.web_passive_count}</strong>{" "}
                        {isTr ? (isCafe ? "Menü Kapalı" : "Vitrin Kapalı") : "Passive"}
                      </span>
                    </>
                  )}
                  <span>·</span>
                  <span>
                    {isTr ? "Toplam Stok:" : "Stock:"}{" "}
                    <strong className="text-slate-900">{Math.floor(Number(targetCounts.total_stock || 0))}</strong>
                  </span>
                </div>
              </div>

              {/* Bulk Showcase / Menu Actions for This Category (shopLP + horecaLP) */}
              {!isViewer && hasMenuOrShowcase && (
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={isBusyAction || targetCounts.product_count === 0}
                    onClick={() => handleCategoryBulkWebSale(true)}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    title={isTr ? (isCafe ? "Bu kapsamdaki tüm ürünleri menüde yayınla" : "Bu kapsamdaki tüm ürünleri vitrinde yayınla") : "Publish all products in category"}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{isTr ? (isCafe ? "Tümünü Menüye Aç" : "Tümünü Vitrine Aç") : "Publish All"}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isBusyAction || targetCounts.product_count === 0}
                    onClick={() => handleCategoryBulkWebSale(false)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 border border-slate-200 hover:border-rose-200 disabled:opacity-40 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    title={isTr ? (isCafe ? "Bu kapsamdaki tüm ürünleri menüden gizle" : "Bu kapsamdaki tüm ürünleri vitrinden gizle") : "Hide all products in category"}
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>{isTr ? (isCafe ? "Tümünü Menüden Kaldır" : "Tümünü Vitrinden Kaldır") : "Hide All"}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Category Governance Controls (when main or sub category selected) */}
            {selectedTarget.type !== "uncategorized" && !isViewer && (
              <div className="space-y-3">
                {/* Row 1: Name, Storefront Category Visibility, VAT Rate */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                  <div className="md:col-span-5">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {isTr ? "Kategori Adı" : "Category Name"}
                    </label>
                    <input
                      type="text"
                      value={renameDraft}
                      onChange={(e) => setRenameDraft(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {isTr ? (isCafe ? "Menü & Vitrin Görünürlüğü" : "Vitrin Menü Görünürlüğü") : "Storefront Menu Visibility"}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextVis = !isVisibleDraft;
                        setIsVisibleDraft(nextVis);
                        handleToggleNodeVisibility(
                          selectedTarget.category,
                          selectedTarget.type === "sub" ? selectedTarget.subCategory : undefined
                        );
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        isVisibleDraft
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                          : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
                      }`}
                    >
                      {isVisibleDraft ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>
                        {isVisibleDraft
                          ? isTr
                            ? isCafe
                              ? "Menüde Görünür"
                              : "Vitrinde Görünür"
                            : "Visible"
                          : isTr
                          ? isCafe
                            ? "Menüde Gizli"
                            : "Vitrinde Gizli"
                          : "Hidden"}
                      </span>
                    </button>
                  </div>

                  {selectedTarget.type === "main" && (
                    <div className="md:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {isTr ? "Varsayılan KDV (%)" : "Default VAT (%)"}
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={taxDraft}
                          onChange={(e) => setTaxDraft(e.target.value)}
                          placeholder="20"
                          className="w-20 px-2 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          disabled={isBusyAction || taxDraft.trim() === ""}
                          onClick={handleApplyCategoryTax}
                          className="px-2 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-lg text-[11px] font-semibold cursor-pointer disabled:opacity-40 whitespace-nowrap"
                          title={isTr ? "Bu KDV oranını kategorideki tüm ürünlere uygula" : "Apply VAT to all products"}
                        >
                          {isTr ? "Uygula" : "Apply"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Row 2: Optional Description & Image URL + Save */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                  <div className="md:col-span-5">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {isTr ? "Açıklama (Opsiyonel)" : "Description (Optional)"}
                    </label>
                    <input
                      type="text"
                      value={descDraft}
                      onChange={(e) => setDescDraft(e.target.value)}
                      placeholder={isTr ? "Kategori tanıtım notu..." : "Category description..."}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-5">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {isTr ? "Kapak Görseli URL (Opsiyonel)" : "Cover Image URL"}
                    </label>
                    <input
                      type="text"
                      value={imgDraft}
                      onChange={(e) => setImgDraft(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="button"
                      disabled={isBusyAction || savingTree}
                      onClick={handleSaveInspectorChanges}
                      className="w-full px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      {isBusyAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{isTr ? "Kaydet" : "Save"}</span>
                    </button>
                  </div>
                </div>

                {/* Row 3: Structural Operations Bar + Add Subcategory */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveOperation(activeOperation === "assign_products" ? null : "assign_products");
                        setAssignPickerIds([]);
                        setAssignPickerSearch("");
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 cursor-pointer transition-colors ${
                        activeOperation === "assign_products"
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isTr ? "Ürün Ekle / Ata" : "Assign Products"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveOperation(activeOperation === "move" ? null : "move");
                        setOpTargetCat("");
                        setOpNewName("");
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 cursor-pointer transition-colors ${
                        activeOperation === "move"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>
                        {selectedTarget.type === "sub"
                          ? isTr
                            ? "Yerini Değiştir / Yükselt"
                            : "Move / Promote"
                          : isTr
                          ? "Alt Kategoriye Taşı"
                          : "Demote"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveOperation(activeOperation === "merge" ? null : "merge");
                        setOpTargetCat("");
                        setOpTargetSub("");
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 cursor-pointer transition-colors ${
                        activeOperation === "merge"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <GitMerge className="w-3.5 h-3.5" />
                      <span>{isTr ? "Birleştir" : "Merge"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveOperation(activeOperation === "delete" ? null : "delete");
                        setOpTargetCat("");
                        setOpTargetSub("");
                        setDeleteMode(targetCounts.product_count > 0 ? "migrate" : "clear");
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 cursor-pointer transition-colors ${
                        activeOperation === "delete"
                          ? "bg-rose-600 text-white border-rose-600"
                          : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isTr ? "Sil" : "Delete"}</span>
                    </button>
                  </div>

                  {/* Add Subcategory inline when a Main Category is selected */}
                  {selectedTarget.type === "main" && (
                    <form onSubmit={handleCreateSubCategory} className="flex items-center gap-1">
                      <input
                        type="text"
                        value={newSubName}
                        onChange={(e) => setNewSubName(e.target.value)}
                        placeholder={isTr ? "+ Yeni alt kategori..." : "+ New sub-category..."}
                        className="w-40 px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={!newSubName.trim() || savingTree}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        {isTr ? "Alt Ekle" : "Add Sub"}
                      </button>
                    </form>
                  )}
                </div>

                {/* Inline Operation Panels */}
                {activeOperation === "move" && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                      {selectedTarget.type === "sub"
                        ? isTr
                          ? `"${selectedTarget.subCategory}" Alt Kategorisinin Yerini Değiştir`
                          : `Move "${selectedTarget.subCategory}"`
                        : isTr
                        ? `"${selectedTarget.category}" Kategorisini Başka Kategorinin Altına Taşı`
                        : `Move "${selectedTarget.category}" under another category`}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          {isTr ? "Hedef Ana Kategori" : "Target Main Category"}
                        </label>
                        <select
                          value={opTargetCat}
                          onChange={(e) => setOpTargetCat(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                        >
                          <option value="">{isTr ? "Seçiniz..." : "Select..."}</option>
                          {selectedTarget.type === "sub" && (
                            <option value="__promote__">
                              ↑ {isTr ? "Ana Kategoriye Yükselt (Üst Seviye)" : "Promote to Main Category"}
                            </option>
                          )}
                          {categoriesTree
                            .filter((c) => c.name !== selectedTarget.category)
                            .map((c) => (
                              <option key={c.name} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      {(opTargetCat === "__promote__" || selectedTarget.type === "main") && (
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            {isTr ? "Yeni Konumdaki Adı (Opsiyonel)" : "New Name (Optional)"}
                          </label>
                          <input
                            type="text"
                            value={opNewName}
                            onChange={(e) => setOpNewName(e.target.value)}
                            placeholder={
                              selectedTarget.type === "sub" ? selectedTarget.subCategory : selectedTarget.category
                            }
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isBusyAction || !opTargetCat}
                          onClick={handleExecuteMove}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          {isTr ? "Taşı" : "Move"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveOperation(null)}
                          className="px-2.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          {isTr ? "İptal" : "Cancel"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeOperation === "merge" && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <GitMerge className="w-3.5 h-3.5 text-indigo-600" />
                      {isTr
                        ? `"${targetTitle}" Kategorisindeki Tüm Ürünleri Hedef Kategoriyle Birleştir`
                        : `Merge "${targetTitle}" into Target Category`}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          {isTr ? "Hedef Ana Kategori" : "Target Main Category"}
                        </label>
                        <select
                          value={opTargetCat}
                          onChange={(e) => {
                            setOpTargetCat(e.target.value);
                            setOpTargetSub("");
                          }}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                        >
                          <option value="">{isTr ? "Seçiniz..." : "Select..."}</option>
                          {categoriesTree
                            .filter((c) => selectedTarget.type === "sub" || c.name !== selectedTarget.category)
                            .map((c) => (
                              <option key={c.name} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          {isTr ? "Hedef Alt Kategori (Opsiyonel)" : "Target Sub-Category (Optional)"}
                        </label>
                        <input
                          type="text"
                          value={opTargetSub}
                          onChange={(e) => setOpTargetSub(e.target.value)}
                          list="merge-sub-options"
                          placeholder={isTr ? "Mevcut alt kategorileri koru" : "Keep or enter sub-category"}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                        <datalist id="merge-sub-options">
                          {(categoriesTree.find((c) => c.name === opTargetCat)?.sub_categories || []).map((s) => (
                            <option key={s.name} value={s.name} />
                          ))}
                        </datalist>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isBusyAction || !opTargetCat}
                          onClick={handleExecuteMerge}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          {isTr ? "Birleştir" : "Merge"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveOperation(null)}
                          className="px-2.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          {isTr ? "İptal" : "Cancel"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeOperation === "delete" && (
                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg space-y-2.5">
                    <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      {isTr
                        ? `"${targetTitle}" Silme İşlemi (${targetCounts.product_count} ürün içeriyor)`
                        : `Delete "${targetTitle}" (${targetCounts.product_count} products)`}
                    </div>

                    {targetCounts.product_count > 0 && (
                      <div className="space-y-2 text-xs text-slate-800">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="deleteCatMode"
                            checked={deleteMode === "migrate"}
                            onChange={() => setDeleteMode("migrate")}
                          />
                          <span className="font-medium">
                            {isTr ? "Ürünleri başka bir kategoriye taşı ve sil" : "Move products to another category & delete"}
                          </span>
                        </label>

                        {deleteMode === "migrate" && (
                          <div className="pl-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <select
                              value={opTargetCat}
                              onChange={(e) => setOpTargetCat(e.target.value)}
                              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                            >
                              <option value="">{isTr ? "Hedef Ana Kategori Seçin..." : "Select Target Category..."}</option>
                              {categoriesTree
                                .filter((c) => selectedTarget.type === "sub" || c.name !== selectedTarget.category)
                                .map((c) => (
                                  <option key={c.name} value={c.name}>
                                    {c.name}
                                  </option>
                                ))}
                            </select>
                            <input
                              type="text"
                              value={opTargetSub}
                              onChange={(e) => setOpTargetSub(e.target.value)}
                              placeholder={isTr ? "Hedef Alt Kategori (Opsiyonel)" : "Target Sub-Category"}
                              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                            />
                          </div>
                        )}

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="deleteCatMode"
                            checked={deleteMode === "clear"}
                            onChange={() => setDeleteMode("clear")}
                          />
                          <span className="font-medium">
                            {selectedTarget.type === "sub"
                              ? isTr
                                ? "Alt kategoriyi ürünlerden temizle ve sil (ana kategori kalır)"
                                : "Clear sub-category from products & delete"
                              : isTr
                              ? "Ürünleri kategorisiz bırak ve kategoriyi sil"
                              : "Leave products uncategorized & delete"}
                          </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="deleteCatMode"
                            checked={deleteMode === "hide_products"}
                            onChange={() => setDeleteMode("hide_products")}
                          />
                          <span className="font-medium text-rose-800">
                            {isTr
                              ? isCafe
                                ? "Ürünleri menüde pasife al (kapat) ve kategoriyi sil"
                                : "Ürünleri vitrinde pasife al (kapat) ve kategoriyi sil"
                              : "Hide products from showcase & delete category"}
                          </span>
                        </label>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isBusyAction || (deleteMode === "migrate" && !opTargetCat && targetCounts.product_count > 0)}
                        onClick={handleExecuteDelete}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        {isTr ? "Onayla ve Sil" : "Confirm Delete"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveOperation(null)}
                        className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        {isTr ? "Vazgeç" : "Cancel"}
                      </button>
                    </div>
                  </div>
                )}

                {activeOperation === "assign_products" && (
                  <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-lg space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-bold text-indigo-950">
                        {isTr
                          ? `"${targetTitle}" Kategorisine Ürün Ekle / Ata`
                          : `Assign Products to "${targetTitle}"`}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={assignPickerIds.length === 0 || isBusyAction}
                          onClick={handleAssignPickerSubmit}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          {isTr ? `Seçilileri Ata (${assignPickerIds.length})` : `Assign (${assignPickerIds.length})`}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveOperation(null)}
                          className="px-2 py-1 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          {isTr ? "Kapat" : "Close"}
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={assignPickerSearch}
                      onChange={(e) => setAssignPickerSearch(e.target.value)}
                      placeholder={isTr ? "Eklenecek ürün adı veya barkod ara..." : "Search products to assign..."}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                    />

                    <div className="max-h-44 overflow-y-auto bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
                      {assignPickerCandidates.length === 0 ? (
                        <div className="py-4 text-center text-xs text-slate-400">
                          {isTr ? "Eklenecek başka ürün bulunamadı." : "No matching products found."}
                        </div>
                      ) : (
                        assignPickerCandidates.map((p) => {
                          const checked = assignPickerIds.includes(p.id);
                          return (
                            <label
                              key={p.id}
                              className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs hover:bg-slate-50 cursor-pointer"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() =>
                                    setAssignPickerIds((prev) =>
                                      prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                                    )
                                  }
                                />
                                <span className="truncate font-medium text-slate-900">{p.name}</span>
                                <span className="font-mono text-[10px] text-slate-400 shrink-0">{p.barcode || "-"}</span>
                              </div>
                              <span className="text-[10.5px] text-slate-500 shrink-0 truncate max-w-[140px]">
                                {p.category || (isTr ? "Kategorisiz" : "None")}
                                {p.sub_category ? ` › ${p.sub_category}` : ""}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Scoped Products Table inside this Category */}
          <div className="bg-white border border-slate-200 rounded-xl flex-1 min-h-[260px] flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder={isTr ? "Bu kategorideki ürünlerde ara..." : "Search products in this category..."}
                  className="w-full max-w-xs px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[11px] font-mono tabular-nums text-slate-500 shrink-0">
                  {scopedProducts.length} {isTr ? "ürün" : "items"}
                </span>
              </div>

              {selectedProdIds.length > 0 && !isViewer && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-indigo-700 font-mono">
                    {selectedProdIds.length} {isTr ? "seçili" : "selected"}
                  </span>
                  {hasMenuOrShowcase && (
                    <>
                      <button
                        type="button"
                        disabled={isBusyAction}
                        onClick={() => handleBulkScopedWebSale(true)}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                      >
                        {isTr ? (isCafe ? "Menüde Yayınla" : "Vitrinde Yayınla") : "Publish"}
                      </button>
                      <button
                        type="button"
                        disabled={isBusyAction}
                        onClick={() => handleBulkScopedWebSale(false)}
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                      >
                        {isTr ? (isCafe ? "Menüden Kaldır" : "Vitrinden Kaldır") : "Hide"}
                      </button>
                    </>
                  )}
                  <div className="flex items-center gap-1">
                    <select
                      value={reassignTargetCat}
                      onChange={(e) => {
                        setReassignTargetCat(e.target.value);
                        setReassignTargetSub("");
                      }}
                      className="px-2 py-1 text-[11px] bg-white border border-slate-300 rounded text-slate-800 max-w-[140px]"
                    >
                      <option value="">{isTr ? "Kategoriye Taşı..." : "Move to..."}</option>
                      {categoriesTree.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {reassignTargetCat && (
                      <select
                        value={reassignTargetSub}
                        onChange={(e) => setReassignTargetSub(e.target.value)}
                        className="px-2 py-1 text-[11px] bg-white border border-slate-300 rounded text-slate-800 max-w-[120px]"
                      >
                        <option value="">{isTr ? "Alt Kat. Yok" : "No Sub"}</option>
                        {(categoriesTree.find((c) => c.name === reassignTargetCat)?.sub_categories || []).map((s) => (
                          <option key={s.name} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      disabled={!reassignTargetCat || isBusyAction}
                      onClick={handleBulkReassignScopedProducts}
                      className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded text-[11px] font-semibold cursor-pointer"
                    >
                      {isTr ? "Aktar" : "Apply"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                  <tr className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                    {!isViewer && (
                      <th className="pl-3 py-2 w-8">
                        <input
                          type="checkbox"
                          checked={
                            scopedProducts.length > 0 &&
                            scopedProducts.every((p) => selectedProdIds.includes(p.id))
                          }
                          onChange={() => {
                            if (
                              scopedProducts.length > 0 &&
                              scopedProducts.every((p) => selectedProdIds.includes(p.id))
                            ) {
                              setSelectedProdIds([]);
                            } else {
                              setSelectedProdIds(scopedProducts.map((p) => p.id));
                            }
                          }}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 cursor-pointer"
                        />
                      </th>
                    )}
                    <th className="px-2.5 py-2">{isTr ? "Barkod" : "Barcode"}</th>
                    <th className="px-2.5 py-2">{isTr ? "Ürün Adı" : "Product"}</th>
                    <th className="px-2.5 py-2">{isTr ? "Kategori / Alt Kategori" : "Category"}</th>
                    <th className="px-2.5 py-2 text-right">{isTr ? "Fiyat" : "Price"}</th>
                    <th className="px-2.5 py-2 text-right">{isTr ? "Stok" : "Stock"}</th>
                    {hasMenuOrShowcase && (
                      <th className="px-3 py-2 text-right">
                        {isTr ? (isCafe ? "Menü Durumu" : "Vitrin Durumu") : "Showcase"}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {scopedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={hasMenuOrShowcase ? 7 : 6} className="py-10 text-center text-slate-400 text-xs">
                        {isTr
                          ? "Bu kategoride gösterilecek ürün bulunmuyor."
                          : "No products in this category."}
                      </td>
                    </tr>
                  ) : (
                    scopedProducts.map((p) => {
                      const isWebActive = p.is_web_sale !== false;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          {!isViewer && (
                            <td className="pl-3 py-1.5">
                              <input
                                type="checkbox"
                                checked={selectedProdIds.includes(p.id)}
                                onChange={() =>
                                  setSelectedProdIds((prev) =>
                                    prev.includes(p.id)
                                      ? prev.filter((id) => id !== p.id)
                                      : [...prev, p.id]
                                  )
                                }
                                className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 cursor-pointer"
                              />
                            </td>
                          )}
                          <td className="px-2.5 py-1.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {p.barcode || "-"}
                          </td>
                          <td className="px-2.5 py-1.5 font-medium text-slate-900 max-w-[260px] truncate" title={p.name}>
                            {p.name}
                          </td>
                          <td className="px-2.5 py-1.5 text-[11px] text-slate-600 whitespace-nowrap">
                            {p.category || (isTr ? "Kategorisiz" : "None")}
                            {p.sub_category ? ` › ${p.sub_category}` : ""}
                          </td>
                          <td className="px-2.5 py-1.5 text-right font-mono tabular-nums text-slate-800 whitespace-nowrap">
                            {Number(p.price || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                            {p.currency || "TRY"}
                          </td>
                          <td className="px-2.5 py-1.5 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                            {Math.floor(Number(p.stock_quantity || 0))}
                          </td>
                          {hasMenuOrShowcase && (
                            <td className="px-3 py-1.5 text-right whitespace-nowrap">
                              <button
                                type="button"
                                disabled={isViewer}
                                onClick={() => handleToggleSingleProductWebSale(p)}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors ${
                                  isViewer ? "opacity-75 cursor-default" : "cursor-pointer"
                                } ${
                                  isWebActive
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                                }`}
                                title={
                                  isTr
                                    ? isCafe
                                      ? "Tıkla: Menü durumunu değiştir"
                                      : "Tıkla: Vitrin durumunu değiştir"
                                    : "Click to toggle showcase status"
                                }
                              >
                                {isWebActive ? <Globe className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                <span>
                                  {isWebActive
                                    ? isTr
                                      ? isCafe
                                        ? "Menüde Aktif"
                                        : "Vitrinde Aktif"
                                      : "Live"
                                    : isTr
                                    ? isCafe
                                      ? "Menü Kapalı"
                                      : "Vitrin Kapalı"
                                    : "Hidden"}
                                </span>
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (mode === "modal") {
    return (
      <div className="fixed inset-0 z-[105] bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
        <div className="w-full max-w-7xl h-[92dvh] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
          {content}
        </div>
      </div>
    );
  }

  return <div className="h-[calc(100dvh-110px)] min-h-[580px] w-full rounded-xl border border-slate-200 overflow-hidden bg-slate-50">{content}</div>;
};

export default CategoriesTab;
