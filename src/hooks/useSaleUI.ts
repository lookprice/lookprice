import { useState } from "react";

export const useSaleUI = () => {
  const [salesStatusFilter, setSalesStatusFilter] = useState("all");
  const [salesStartDate, setSalesStartDate] = useState("");
  const [salesEndDate, setSalesEndDate] = useState("");
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [showSaleDetailsModal, setShowSaleDetailsModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [isConfirmingSale, setIsConfirmingSale] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card' | 'bank' | 'term'>('term');
  const [dueDate, setDueDate] = useState('');
  const [saleNotes, setSaleNotes] = useState('');
  const [createCompanyFromSale, setCreateCompanyFromSale] = useState(false);
  const [completingSale, setCompletingSale] = useState(false);
  const [posPaymentMethod, setPosPaymentMethod] = useState<'cash' | 'credit_card' | 'bank'>('cash');

  return {
    salesStatusFilter, setSalesStatusFilter,
    salesStartDate, setSalesStartDate,
    salesEndDate, setSalesEndDate,
    selectedSale, setSelectedSale,
    showSaleDetailsModal, setShowSaleDetailsModal,
    showSaleModal, setShowSaleModal,
    isConfirmingSale, setIsConfirmingSale,
    selectedQuotation, setSelectedQuotation,
    paymentMethod, setPaymentMethod,
    dueDate, setDueDate,
    saleNotes, setSaleNotes,
    createCompanyFromSale, setCreateCompanyFromSale,
    completingSale, setCompletingSale,
    posPaymentMethod, setPosPaymentMethod
  };
};
