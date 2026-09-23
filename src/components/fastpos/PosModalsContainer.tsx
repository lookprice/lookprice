import React from "react";
import { AnimatePresence } from "motion/react";
import { PosStatusModal } from "./PosStatusModal";
import { PosSuccessModal } from "./PosSuccessModal";
import { PosHappyHourModal } from "./PosHappyHourModal";
import { PosSplitPaymentModal } from "./PosSplitPaymentModal";
import { PosPrinterDiagnosticModal } from "./PosPrinterDiagnosticModal";
import { PosReportModal } from "./PosReportModal";
import { PosTableQrModal } from "./PosTableQrModal";
import { PosTransferTableModal } from "./PosTransferTableModal";
import { PosVariantModal } from "./PosVariantModal";
import { PosIkramNoteModal } from "./PosIkramNoteModal";
import { PosTableNicknameModal } from "./PosTableNicknameModal";
import { RoomTransferModal } from "../horeca/RoomTransferModal";

export interface PosModalsContainerProps {
  lang: string;
  storeId?: number;
  branding?: any;
  isCafeRestaurant: boolean;
  isHotelActive: boolean;
  // Status Modal
  posStatus: string;
  posMessage: string;
  setPosStatus: (status: any) => void;
  // Success Modal
  showSuccess: boolean;
  setShowSuccess: (show: boolean) => void;
  lastSaleId: any;
  lastCart: any[];
  paymentMethod: string;
  lastFiscal: any;
  handlePrintReceipt: (saleData?: any) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  // Happy Hour Modal
  showHappyHourModal: boolean;
  setShowHappyHourModal: (show: boolean) => void;
  isHappyHourActive: boolean;
  happyHourConfig: any;
  setHappyHourConfig: (config: any) => void;
  forceHappyHour: boolean;
  setForceHappyHour: (force: boolean) => void;
  allProducts: any[];
  // Split Payment Modal
  showSplitModal: boolean;
  setShowSplitModal: (show: boolean) => void;
  selectedTable: string | null;
  splitTab: any;
  setSplitTab: (tab: any) => void;
  total: number;
  cart: any[];
  selectedSplitItems: any;
  setSelectedSplitItems: (items: any) => void;
  partialPayMethod: any;
  setPartialPayMethod: (method: any) => void;
  completing: boolean;
  handlePartialItemPayment: (method: string) => void;
  splitPayments: any[];
  setSplitPayments: (payments: any[]) => void;
  handleEqualSplit: (ways: number) => void;
  handleFinalizeSplitSale: () => void;
  handlePartialAmountPayment: (amount: number, method: string) => void;
  // Printer Diagnostic Modal
  showPrinterDiagnosticModal: boolean;
  setShowPrinterDiagnosticModal: (show: boolean) => void;
  autoPrintOnOrder: boolean;
  autoPrintOnPay: boolean;
  handleToggleAutoPrintOrder: (val: boolean) => void;
  handleToggleAutoPrintPay: (val: boolean) => void;
  // Report Modal
  showReportModal: boolean;
  setShowReportModal: (show: boolean) => void;
  reportStartDate: string;
  setReportStartDate: (date: string) => void;
  reportEndDate: string;
  setReportEndDate: (date: string) => void;
  reportPreset: string;
  setReportPreset: (preset: string) => void;
  reportSearchQuery: string;
  setReportSearchQuery: (query: string) => void;
  reportSortBy: string;
  setReportSortBy: (sort: string) => void;
  reportData: any;
  reportLoading: boolean;
  fetchReport: (start: string, end: string) => void;
  handleApplyPreset: (preset: string) => void;
  handlePrintReport: (title: string, summary: any, sales: any[]) => void;
  handlePrintA4Report: (title: string, summary: any, sales: any[]) => void;
  // Table QR Modal
  showQrModal: boolean;
  setShowQrModal: (show: boolean) => void;
  allTables: any[];
  qrModalTab: any;
  setQrModalTab: (tab: any) => void;
  singleQrTable: any;
  setSingleQrTable: (table: any) => void;
  newTableCount: number;
  setNewTableCount: (count: number) => void;
  savingTableCount: boolean;
  handleSaveTableCount: () => void;
  handlePrintQr: (table: any) => void;
  handlePrintAllQrs: () => void;
  // Table Transfer Modal
  isChangingTable: boolean;
  setIsChangingTable: (changing: boolean) => void;
  transferLoading: boolean;
  handleTableTransfer: (targetTable: string) => void;
  // Variant Modal
  variantModalProduct: any;
  setVariantModalProduct: (prod: any) => void;
  addToCart: (prod: any, variant: any) => void;
  // Room Transfer Modal
  showRoomTransferModal: boolean;
  setShowRoomTransferModal: (show: boolean) => void;
  handleTransferToRoom: (room: any, notes: any, printSlip: any) => Promise<void> | void;
  // Ikram Note Modal
  showIkramNoteModal: boolean;
  setShowIkramNoteModal: (show: boolean) => void;
  ikramNote: string;
  setIkramNote: (note: string) => void;
  pendingIkramAction: any;
  setPendingIkramAction: (action: any) => void;
  // Table Nickname Modal
  activeNicknameModal: string | null;
  setActiveNicknameModal: (table: string | null) => void;
  activeNicknameInput: string;
  setActiveNicknameInput: (input: string) => void;
  tableNicknames: Record<string, string>;
  saveTableNickname: (table: string, nick: string) => void;
  clearStoredTableNickname: (table: string) => void;
}

export const PosModalsContainer: React.FC<PosModalsContainerProps> = ({
  lang,
  storeId,
  branding,
  isCafeRestaurant,
  isHotelActive,
  posStatus,
  posMessage,
  setPosStatus,
  showSuccess,
  setShowSuccess,
  lastSaleId,
  lastCart,
  paymentMethod,
  lastFiscal,
  handlePrintReceipt,
  searchInputRef,
  showHappyHourModal,
  setShowHappyHourModal,
  isHappyHourActive,
  happyHourConfig,
  setHappyHourConfig,
  forceHappyHour,
  setForceHappyHour,
  allProducts,
  showSplitModal,
  setShowSplitModal,
  selectedTable,
  splitTab,
  setSplitTab,
  total,
  cart,
  selectedSplitItems,
  setSelectedSplitItems,
  partialPayMethod,
  setPartialPayMethod,
  completing,
  handlePartialItemPayment,
  splitPayments,
  setSplitPayments,
  handleEqualSplit,
  handleFinalizeSplitSale,
  handlePartialAmountPayment,
  showPrinterDiagnosticModal,
  setShowPrinterDiagnosticModal,
  autoPrintOnOrder,
  autoPrintOnPay,
  handleToggleAutoPrintOrder,
  handleToggleAutoPrintPay,
  showReportModal,
  setShowReportModal,
  reportStartDate,
  setReportStartDate,
  reportEndDate,
  setReportEndDate,
  reportPreset,
  setReportPreset,
  reportSearchQuery,
  setReportSearchQuery,
  reportSortBy,
  setReportSortBy,
  reportData,
  reportLoading,
  fetchReport,
  handleApplyPreset,
  handlePrintReport,
  handlePrintA4Report,
  showQrModal,
  setShowQrModal,
  allTables,
  qrModalTab,
  setQrModalTab,
  singleQrTable,
  setSingleQrTable,
  newTableCount,
  setNewTableCount,
  savingTableCount,
  handleSaveTableCount,
  handlePrintQr,
  handlePrintAllQrs,
  isChangingTable,
  setIsChangingTable,
  transferLoading,
  handleTableTransfer,
  variantModalProduct,
  setVariantModalProduct,
  addToCart,
  showRoomTransferModal,
  setShowRoomTransferModal,
  handleTransferToRoom,
  showIkramNoteModal,
  setShowIkramNoteModal,
  ikramNote,
  setIkramNote,
  pendingIkramAction,
  setPendingIkramAction,
  activeNicknameModal,
  setActiveNicknameModal,
  activeNicknameInput,
  setActiveNicknameInput,
  tableNicknames,
  saveTableNickname,
  clearStoredTableNickname
}) => {
  return (
    <AnimatePresence>
      <PosStatusModal
        isOpen={posStatus !== 'idle'}
        posStatus={posStatus as any}
        posMessage={posMessage}
        lang={lang}
        onClose={() => setPosStatus('idle')}
      />

      <PosSuccessModal
        isOpen={showSuccess}
        lang={lang}
        lastSaleId={lastSaleId}
        branding={branding}
        storeId={storeId}
        lastCart={lastCart}
        paymentMethod={paymentMethod as any}
        lastFiscal={lastFiscal}
        onPrintReceipt={handlePrintReceipt}
        onContinue={() => {
          setShowSuccess(false);
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }}
      />

      {/* Happy Hour Campaign Modal */}
      <PosHappyHourModal
        isOpen={showHappyHourModal}
        onClose={() => setShowHappyHourModal(false)}
        lang={lang}
        isHappyHourActive={isHappyHourActive}
        happyHourConfig={happyHourConfig}
        setHappyHourConfig={setHappyHourConfig}
        forceHappyHour={forceHappyHour}
        setForceHappyHour={setForceHappyHour}
        allProducts={allProducts}
      />

      {/* Split / Partial Payment Modal */}
      <PosSplitPaymentModal
        isOpen={showSplitModal}
        onClose={() => setShowSplitModal(false)}
        lang={lang}
        selectedTable={selectedTable}
        splitTab={splitTab}
        setSplitTab={setSplitTab}
        total={total}
        cart={cart}
        selectedSplitItems={selectedSplitItems}
        setSelectedSplitItems={setSelectedSplitItems}
        itemSplitMethod={partialPayMethod}
        setItemSplitMethod={setPartialPayMethod}
        completing={completing}
        handlePartialItemPayment={() => handlePartialItemPayment(partialPayMethod)}
        splitPayments={splitPayments}
        setSplitPayments={setSplitPayments}
        handleEqualSplit={handleEqualSplit}
        handleFinalizeSplitSale={handleFinalizeSplitSale}
        handlePartialAmountPayment={(amt) => handlePartialAmountPayment(amt, partialPayMethod)}
      />

      {/* Printer Diagnostic Tool Modal */}
      <PosPrinterDiagnosticModal
        isOpen={showPrinterDiagnosticModal}
        onClose={() => setShowPrinterDiagnosticModal(false)}
        lang={lang}
        branding={branding}
        autoPrintOnOrder={autoPrintOnOrder}
        autoPrintOnPay={autoPrintOnPay}
        onToggleAutoPrintOrder={(e: any) => handleToggleAutoPrintOrder(typeof e === 'boolean' ? e : e?.target?.checked)}
        onToggleAutoPrintPay={(e: any) => handleToggleAutoPrintPay(typeof e === 'boolean' ? e : e?.target?.checked)}
      />

      {/* End of Day & Period Sales Report Modal */}
      <PosReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        lang={lang}
        branding={branding}
        reportStartDate={reportStartDate}
        setReportStartDate={setReportStartDate}
        reportEndDate={reportEndDate}
        setReportEndDate={setReportEndDate}
        reportPreset={reportPreset as any}
        setReportPreset={setReportPreset}
        reportSearchQuery={reportSearchQuery}
        setReportSearchQuery={setReportSearchQuery}
        reportSortBy={reportSortBy as any}
        setReportSortBy={setReportSortBy}
        reportData={reportData}
        reportLoading={reportLoading}
        onFetchReport={(start, end) => fetchReport(start || reportStartDate, end || reportEndDate)}
        onApplyPreset={handleApplyPreset}
        onPrintReport={() => handlePrintReport('Z Raporu', reportData, reportData?.sales || [])}
        onPrintA4Report={() => handlePrintA4Report('Z Raporu', reportData, reportData?.sales || [])}
      />

      {/* Tables & Digital Menu QR Modal */}
      <PosTableQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        lang={lang}
        storeId={storeId?.toString()}
        branding={branding}
        allTables={allTables}
        qrModalTab={qrModalTab}
        setQrModalTab={setQrModalTab}
        singleQrTable={singleQrTable}
        setSingleQrTable={setSingleQrTable}
        newTableCount={newTableCount}
        setNewTableCount={setNewTableCount}
        savingTableCount={savingTableCount}
        onSaveTableCount={handleSaveTableCount}
        onPrintSingleQr={handlePrintQr}
        onPrintAllQrs={handlePrintAllQrs}
      />

      <PosTransferTableModal
        isOpen={isChangingTable}
        onClose={() => setIsChangingTable(false)}
        selectedTable={selectedTable}
        allTables={allTables}
        transferLoading={transferLoading}
        onTableTransfer={handleTableTransfer}
        lang={lang}
      />

      {/* Variant Selection Modal */}
      <PosVariantModal
        variantModalProduct={variantModalProduct}
        onClose={() => setVariantModalProduct(null)}
        lang={lang}
        isCafeRestaurant={isCafeRestaurant}
        addToCart={addToCart}
      />

      {isHotelActive && (
        <RoomTransferModal
          isOpen={showRoomTransferModal}
          onClose={() => setShowRoomTransferModal(false)}
          tableName={selectedTable}
          cart={cart}
          totalAmount={total}
          storeId={storeId}
          storeName={branding?.store_name || branding?.name}
          lang={lang}
          onConfirmTransfer={handleTransferToRoom as any}
        />
      )}

      {/* İkram Notu Zorunluluğu Modalı */}
      <PosIkramNoteModal
        isOpen={showIkramNoteModal}
        onClose={() => {
          setShowIkramNoteModal(false);
          setPendingIkramAction(null);
        }}
        lang={lang}
        ikramNote={ikramNote}
        setIkramNote={setIkramNote}
        pendingIkramAction={pendingIkramAction}
        setPendingIkramAction={setPendingIkramAction}
      />

      {/* Active Table Nickname Modal */}
      <PosTableNicknameModal
        activeNicknameModal={activeNicknameModal}
        setActiveNicknameModal={setActiveNicknameModal}
        activeNicknameInput={activeNicknameInput}
        setActiveNicknameInput={setActiveNicknameInput}
        lang={lang}
        storeId={storeId}
        tableNicknames={tableNicknames}
        saveTableNickname={saveTableNickname}
        clearStoredTableNickname={clearStoredTableNickname}
      />
    </AnimatePresence>
  );
};
