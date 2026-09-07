import { useState } from "react";
import * as XLSX from 'xlsx';
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
    unit: ""
  });
  const [convertCurrency, setConvertCurrency] = useState(false);

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
        setImportColumns(data[0] as string[]);
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
      alert(lang === 'tr' 
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
      await api.importProducts(formData, targetStoreId);
      setShowImportModal(false);
      setImportFile(null);
      setImportColumns([]);
      fetchData(true);
      alert(lang === 'tr' ? "İçe aktarma tamamlandı" : "Import completed");
    } catch (error) {
      alert(lang === 'tr' ? "Hata oluştu" : "An error occurred");
    } finally {
      setIsImporting(false);
    }
  };

  return { showImportModal, setShowImportModal, isImporting, setIsImporting, importFile, setImportFile, importColumns, setImportColumns, mapping, setMapping, convertCurrency, setConvertCurrency, handleFileSelect, handleImport };
};
