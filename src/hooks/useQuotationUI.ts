import { useState } from 'react';
import { Quotation, QuotationItem } from '../types';

export const useQuotationUI = (branding: any) => {
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [quotationProductSearch, setQuotationProductSearch] = useState("");
  const [showQuickProductModal, setShowQuickProductModal] = useState(false);
  const [quickProductForm, setQuickProductForm] = useState({ name: '', price: '', barcode: '', tax_rate: String(branding?.default_tax_rate ?? 20) });
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [quotationSearch, setQuotationSearch] = useState("");
  const [quotationStatusFilter, setQuotationStatusFilter] = useState("all");
  const [selectedQuotationDetails, setSelectedQuotationDetails] = useState<Quotation | null>(null);
  const [showQuotationDetailsModal, setShowQuotationDetailsModal] = useState(false);

  return {
    showQuotationModal, setShowQuotationModal,
    showNotes, setShowNotes,
    quotationProductSearch, setQuotationProductSearch,
    showQuickProductModal, setShowQuickProductModal,
    quickProductForm, setQuickProductForm,
    quotationItems, setQuotationItems,
    editingQuotation, setEditingQuotation,
    quotationSearch, setQuotationSearch,
    quotationStatusFilter, setQuotationStatusFilter,
    selectedQuotationDetails, setSelectedQuotationDetails,
    showQuotationDetailsModal, setShowQuotationDetailsModal
  };
};
