import React from "react";
import { AnimatePresence } from "motion/react";
import { UserModal } from "./modals/UserModal";
import { CompanyModal } from "./modals/CompanyModal";
import { ProductModal } from "./modals/ProductModal";
import { QuotationModal } from "./modals/QuotationModal";
import { ImportModal } from "./modals/ImportModal";
import { QrCodeModal } from "./modals/QrCodeModal";
import { PurchaseInvoiceDetailsModal } from "./modals/PurchaseInvoiceDetailsModal";
import { SaleDetailsModal } from "./modals/SaleDetailsModal";
import { QuotationDetailsModal } from "./modals/QuotationDetailsModal";
import { DailyReportModal } from "./modals/DailyReportModal";
import { TransactionModal } from "./modals/TransactionModal";
import { ConfirmSaleModal } from "./modals/ConfirmSaleModal";
import { BulkPriceModal } from "./modals/BulkPriceModal";

export interface DashboardModalsProps {
  // Common
  branding: any;
  translations: any;
  lang: string;

  // QR Modal
  showQrModal: boolean;
  setShowQrModal: (show: boolean) => void;
  scanUrl: string;
  publicUrl: string;
  isPortfolio: boolean;
  isCafeRestaurant?: boolean;
  isShopLp?: boolean;
  handlePrintQR: () => void;
  qrPrintRef: React.RefObject<HTMLDivElement | null>;

  // Purchase Invoice Details
  showPurchaseInvoiceDetailsModal: boolean;
  setShowPurchaseInvoiceDetailsModal: (show: boolean) => void;
  selectedPurchaseInvoice: any;

  // Sale Details Modal
  showSaleDetailsModal: boolean;
  setShowSaleDetailsModal: (show: boolean) => void;
  selectedSale: any;
  handlePrint: () => void;
  shippingSlipRef: React.RefObject<HTMLDivElement | null>;
  handleSaleSuccess?: (id?: number) => void;

  // Quotation Details Modal
  showQuotationDetailsModal: boolean;
  setShowQuotationDetailsModal: (show: boolean) => void;
  selectedQuotationDetails: any;
  onDownloadQuotationPDF: (q: any) => void;
  numberToTurkishWords: (n: number, currency?: string) => string;
  quotationPrintRef: React.RefObject<HTMLDivElement | null>;

  // Daily Report Modal
  showDailyReportModal: boolean;
  setShowDailyReportModal: (show: boolean) => void;
  dailyReportData: { summary: any[], details: any[] };
  reportStartDate: string;
  setReportStartDate: (d: string) => void;
  reportEndDate: string;
  setReportEndDate: (d: string) => void;
  fetchDailySalesReport: () => void;
  reportLoading: boolean;
  handleDownloadDailyReportExcel: () => void;

  // Transaction Modal
  showTransactionModal: boolean;
  setShowTransactionModal: (show: boolean) => void;
  selectedCompany: any;
  companyTransactions: any[];
  selectedCurrency: string;
  setSelectedCurrency: (c: string) => void;
  transactionStartDate: string;
  setTransactionStartDate: (d: string) => void;
  transactionEndDate: string;
  setTransactionEndDate: (d: string) => void;
  handleFetchTransactions: (id: number, targetStoreId?: number, customStart?: string, customEnd?: string) => void;
  transactionLoading: boolean;
  handleExportTransactionsPDF: () => void;
  openingBalances: Record<string, number>;
  companies: any[];
  setShowAddTransactionModal: (show: boolean) => void;
  handleEditTransaction: (id: number, data: any) => void;
  handleDeleteTransaction: (id: number) => void;

  // Add Transaction Modal
  showAddTransactionModal: boolean;
  newTransactionType: 'credit' | 'debt';
  setNewTransactionType: (t: 'credit' | 'debt') => void;
  newTransactionAmount: string;
  setNewTransactionAmount: (a: string) => void;
  newTransactionCurrency: string;
  setNewTransactionCurrency: (c: string) => void;
  newTransactionExchangeRate: string;
  setNewTransactionExchangeRate: (r: string) => void;
  newTransactionPaymentMethod: 'cash' | 'credit_card' | 'bank' | 'term';
  setNewTransactionPaymentMethod: (m: 'cash' | 'credit_card' | 'bank' | 'term') => void;
  newTransactionDescription: string;
  setNewTransactionDescription: (d: string) => void;
  newTransactionDate: string;
  setNewTransactionDate: (d: string) => void;
  handleAddTransaction: (e: React.FormEvent) => void;

  // Sale Modal (Confirm Sale from Quotation)
  showSaleModal: boolean;
  setShowSaleModal: (show: boolean) => void;
  selectedQuotation: any;
  handleConfirmSale: (e: React.FormEvent) => void;
  isConfirmingSale: boolean;
  dueDate: string;
  setDueDate: (d: string) => void;
  saleNotes: string;
  setSaleNotes: (n: string) => void;
  createCompanyFromSale: boolean;
  setCreateCompanyFromSale: (c: boolean) => void;

  // Bulk Price Modal
  showBulkPriceModal: boolean;
  setShowBulkPriceModal: (show: boolean) => void;
  bulkPriceForm: any;
  setBulkPriceForm: (f: any) => void;
  handleBulkPriceSubmit: (e: React.FormEvent) => void;
  products: any[];

  // Missing Modals Props
  showProductModal?: boolean;
  setShowProductModal?: (show: boolean) => void;
  editingProduct?: any;
  setEditingProduct?: (p: any) => void;
  handleAddProduct?: (e: React.FormEvent) => void;

  showCompanyModal?: boolean;
  setShowCompanyModal?: (show: boolean) => void;
  editingCompany?: any;
  setEditingCompany?: (c: any) => void;
  handleAddCompany?: (e: React.FormEvent) => void;

  showUserModal?: boolean;
  setShowUserModal?: (show: boolean) => void;
  handleAddUser?: (e: React.FormEvent) => void;

  showQuotationModal?: boolean;
  setShowQuotationModal?: (show: boolean) => void;
  editingQuotation?: any;
  setEditingQuotation?: (q: any) => void;
  quotationItems?: any[];
  setQuotationItems?: any;
  handleAddQuotation?: (e: React.FormEvent) => void;
  isTaxInclusive?: boolean;
  setIsTaxInclusive?: (b: boolean) => void;
  quotationNotes?: string;
  setQuotationNotes?: (notes: string) => void;
  showQuickProductModal?: boolean;
  setShowQuickProductModal?: (b: boolean) => void;
  quickProductForm?: any;
  setQuickProductForm?: any;
  handleQuickAddProduct?: (e: React.FormEvent) => void;

  showImportModal: boolean;
  setShowImportModal: (show: boolean) => void;
  isImporting: boolean;
  importFile: File | null;
  importColumns: string[];
  mapping: any;
  setMapping: (m: any) => void;
  convertCurrency: boolean;
  setConvertCurrency: (c: boolean) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleImport: (e: React.FormEvent) => void;
}

/**
 * DashboardModals: Modular Orchestrator Component for Store Dashboard Modals
 */
export const DashboardModals: React.FC<DashboardModalsProps> = (props) => {
  const {
    branding, translations: t, lang,
    showQrModal, setShowQrModal, scanUrl, publicUrl, isPortfolio, isCafeRestaurant, isShopLp, handlePrintQR, qrPrintRef,
    showPurchaseInvoiceDetailsModal, setShowPurchaseInvoiceDetailsModal, selectedPurchaseInvoice,
    showSaleDetailsModal, setShowSaleDetailsModal, selectedSale, handlePrint, shippingSlipRef, handleSaleSuccess,
    showQuotationDetailsModal, setShowQuotationDetailsModal, selectedQuotationDetails, onDownloadQuotationPDF, numberToTurkishWords, quotationPrintRef,
    showDailyReportModal, setShowDailyReportModal, dailyReportData, reportStartDate, setReportStartDate, reportEndDate, setReportEndDate, fetchDailySalesReport, reportLoading, handleDownloadDailyReportExcel,
    showTransactionModal, setShowTransactionModal, selectedCompany, companyTransactions, selectedCurrency, setSelectedCurrency, transactionStartDate, setTransactionStartDate, transactionEndDate, setTransactionEndDate, handleFetchTransactions, transactionLoading, handleExportTransactionsPDF, openingBalances, companies, setShowAddTransactionModal, handleEditTransaction, handleDeleteTransaction,
    showAddTransactionModal, newTransactionType, setNewTransactionType, newTransactionAmount, setNewTransactionAmount, newTransactionCurrency, setNewTransactionCurrency, newTransactionExchangeRate, setNewTransactionExchangeRate, newTransactionPaymentMethod, setNewTransactionPaymentMethod, newTransactionDescription, setNewTransactionDescription, newTransactionDate, setNewTransactionDate, handleAddTransaction,
    showSaleModal, setShowSaleModal, selectedQuotation, handleConfirmSale, isConfirmingSale, dueDate, setDueDate, saleNotes, setSaleNotes, createCompanyFromSale, setCreateCompanyFromSale,
    showBulkPriceModal, setShowBulkPriceModal, bulkPriceForm, setBulkPriceForm, handleBulkPriceSubmit, products,
    
    // Missing Modals Props
    showProductModal, setShowProductModal, editingProduct, setEditingProduct, handleAddProduct,
    showCompanyModal, setShowCompanyModal, editingCompany, setEditingCompany, handleAddCompany,
    showUserModal, setShowUserModal, handleAddUser,
    showQuotationModal, setShowQuotationModal, editingQuotation, setEditingQuotation, quotationItems = [], setQuotationItems, handleAddQuotation, isTaxInclusive = false, setIsTaxInclusive, quotationNotes, setQuotationNotes,
    showQuickProductModal, setShowQuickProductModal, quickProductForm, setQuickProductForm, handleQuickAddProduct,
    showImportModal, setShowImportModal, isImporting, importFile, importColumns, mapping, setMapping, convertCurrency, setConvertCurrency, handleFileSelect, handleImport
  } = props;

  const isTr = lang === 'tr';

  // Auto-fetch transactions when modal opens or date filters change
  React.useEffect(() => {
    if (showTransactionModal && selectedCompany?.id) {
      handleFetchTransactions(selectedCompany.id);
    }
  }, [showTransactionModal, selectedCompany?.id, transactionStartDate, transactionEndDate]);

  return (
    <AnimatePresence>
      {/* QR & Printable Poster Hub Modal */}
      <QrCodeModal
        showQrModal={showQrModal}
        setShowQrModal={setShowQrModal}
        scanUrl={scanUrl}
        publicUrl={publicUrl}
        isPortfolio={isPortfolio}
        isCafeRestaurant={isCafeRestaurant}
        isShopLp={isShopLp}
        handlePrintQR={handlePrintQR}
        qrPrintRef={qrPrintRef}
        branding={branding}
        lang={lang}
      />

      {/* Purchase Invoice Details Modal */}
      <PurchaseInvoiceDetailsModal
        showPurchaseInvoiceDetailsModal={showPurchaseInvoiceDetailsModal}
        setShowPurchaseInvoiceDetailsModal={setShowPurchaseInvoiceDetailsModal}
        selectedPurchaseInvoice={selectedPurchaseInvoice}
        translations={t}
        lang={lang}
      />

      {/* Sale Details Modal */}
      <SaleDetailsModal
        showSaleDetailsModal={showSaleDetailsModal}
        setShowSaleDetailsModal={setShowSaleDetailsModal}
        selectedSale={selectedSale}
        handlePrint={handlePrint}
        shippingSlipRef={shippingSlipRef}
        handleSaleSuccess={handleSaleSuccess}
        branding={branding}
        translations={t}
        lang={lang}
      />

      {/* Quotation Details Modal */}
      <QuotationDetailsModal
        showQuotationDetailsModal={showQuotationDetailsModal}
        setShowQuotationDetailsModal={setShowQuotationDetailsModal}
        selectedQuotationDetails={selectedQuotationDetails}
        onDownloadQuotationPDF={onDownloadQuotationPDF}
        numberToTurkishWords={numberToTurkishWords}
        quotationPrintRef={quotationPrintRef}
        translations={t}
        lang={lang}
      />

      {/* Daily Sales Report Modal */}
      <DailyReportModal
        showDailyReportModal={showDailyReportModal}
        setShowDailyReportModal={setShowDailyReportModal}
        dailyReportData={dailyReportData}
        reportStartDate={reportStartDate}
        setReportStartDate={setReportStartDate}
        reportEndDate={reportEndDate}
        setReportEndDate={setReportEndDate}
        fetchDailySalesReport={fetchDailySalesReport}
        reportLoading={reportLoading}
        handleDownloadDailyReportExcel={handleDownloadDailyReportExcel}
        branding={branding}
        translations={t}
        lang={lang}
      />

      {/* Account Statement & Add Transaction Modal */}
      <TransactionModal
        showTransactionModal={showTransactionModal}
        setShowTransactionModal={setShowTransactionModal}
        selectedCompany={selectedCompany}
        companyTransactions={companyTransactions}
        selectedCurrency={selectedCurrency}
        setSelectedCurrency={setSelectedCurrency}
        transactionStartDate={transactionStartDate}
        setTransactionStartDate={setTransactionStartDate}
        transactionEndDate={transactionEndDate}
        setTransactionEndDate={setTransactionEndDate}
        handleFetchTransactions={handleFetchTransactions}
        transactionLoading={transactionLoading}
        handleExportTransactionsPDF={handleExportTransactionsPDF}
        openingBalances={openingBalances}
        companies={companies}
        setShowAddTransactionModal={setShowAddTransactionModal}
        handleEditTransaction={handleEditTransaction}
        handleDeleteTransaction={handleDeleteTransaction}
        branding={branding}
        translations={t}
        lang={lang}
        showAddTransactionModal={showAddTransactionModal}
        newTransactionType={newTransactionType}
        setNewTransactionType={setNewTransactionType}
        newTransactionAmount={newTransactionAmount}
        setNewTransactionAmount={setNewTransactionAmount}
        newTransactionCurrency={newTransactionCurrency}
        setNewTransactionCurrency={setNewTransactionCurrency}
        newTransactionExchangeRate={newTransactionExchangeRate}
        setNewTransactionExchangeRate={setNewTransactionExchangeRate}
        newTransactionPaymentMethod={newTransactionPaymentMethod}
        setNewTransactionPaymentMethod={setNewTransactionPaymentMethod}
        newTransactionDescription={newTransactionDescription}
        setNewTransactionDescription={setNewTransactionDescription}
        newTransactionDate={newTransactionDate}
        setNewTransactionDate={setNewTransactionDate}
        handleAddTransaction={handleAddTransaction}
      />

      {/* Quotation to Sale Conversion Modal */}
      <ConfirmSaleModal
        showSaleModal={showSaleModal}
        setShowSaleModal={setShowSaleModal}
        selectedQuotation={selectedQuotation}
        handleConfirmSale={handleConfirmSale}
        dueDate={dueDate}
        setDueDate={setDueDate}
        saleNotes={saleNotes}
        setSaleNotes={setSaleNotes}
        createCompanyFromSale={createCompanyFromSale}
        setCreateCompanyFromSale={setCreateCompanyFromSale}
        isConfirmingSale={isConfirmingSale}
        translations={t}
        lang={lang}
      />

      {/* Bulk Price & Quick Product Modal */}
      <BulkPriceModal
        showBulkPriceModal={showBulkPriceModal}
        setShowBulkPriceModal={setShowBulkPriceModal}
        bulkPriceForm={bulkPriceForm}
        setBulkPriceForm={setBulkPriceForm}
        handleBulkPriceSubmit={handleBulkPriceSubmit}
        branding={branding}
        translations={t}
        lang={lang}
        showQuickProductModal={showQuickProductModal}
        setShowQuickProductModal={setShowQuickProductModal}
        quickProductForm={quickProductForm}
        setQuickProductForm={setQuickProductForm}
        handleQuickAddProduct={handleQuickAddProduct}
      />

      {/* Main Quotation Creation / Editing Modal */}
      <QuotationModal
        showQuotationModal={showQuotationModal || false}
        setShowQuotationModal={setShowQuotationModal || (() => {})}
        editingQuotation={editingQuotation}
        setEditingQuotation={setEditingQuotation || (() => {})}
        handleAddQuotation={handleAddQuotation}
        isTr={isTr}
        branding={branding}
        translations={t}
        companies={companies}
        products={products}
        quotationItems={quotationItems}
        setQuotationItems={setQuotationItems}
        isTaxInclusive={isTaxInclusive}
        setIsTaxInclusive={setIsTaxInclusive || (() => {})}
        quotationNotes={quotationNotes || ""}
        setQuotationNotes={setQuotationNotes || (() => {})}
        setShowQuickProductModal={setShowQuickProductModal}
      />

      {/* Product Add / Edit Modal */}
      <ProductModal
        showProductModal={showProductModal || false}
        setShowProductModal={setShowProductModal || (() => {})}
        editingProduct={editingProduct}
        setEditingProduct={setEditingProduct || (() => {})}
        handleAddProduct={handleAddProduct}
        isTr={isTr}
        lang={lang}
        branding={branding}
        translations={t}
        products={products}
      />

      {/* Company Add / Edit Modal */}
      <CompanyModal
        showCompanyModal={showCompanyModal || false}
        setShowCompanyModal={setShowCompanyModal || (() => {})}
        editingCompany={editingCompany}
        setEditingCompany={setEditingCompany || (() => {})}
        handleAddCompany={handleAddCompany}
        isTr={isTr}
        branding={branding}
        translations={t}
      />

      {/* User Account Add Modal */}
      <UserModal
        showUserModal={showUserModal || false}
        setShowUserModal={setShowUserModal || (() => {})}
        handleAddUser={handleAddUser}
        isTr={isTr}
        translations={t}
      />

      {/* CSV/Excel Import Modal */}
      <ImportModal 
        showImportModal={showImportModal}
        setShowImportModal={setShowImportModal}
        isImporting={isImporting}
        importFile={importFile}
        importColumns={importColumns}
        mapping={mapping}
        setMapping={setMapping}
        convertCurrency={convertCurrency}
        setConvertCurrency={setConvertCurrency}
        handleFileSelect={handleFileSelect}
        handleImport={handleImport}
        t={t}
        lang={lang}
      />
    </AnimatePresence>
  );
};
