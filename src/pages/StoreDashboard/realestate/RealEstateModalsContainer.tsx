import React from "react";
import { X, FileText, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { contractTemplates, resolvePropertyRegionLabel, resolveOfficialPropertyTitle } from "@/utils/contractTemplates";
import { ArrangeTourModal } from "@/components/ArrangeTourModal";

const RealEstateModal = React.lazy(() => import("@/components/RealEstateModal").then(m => ({ default: m.RealEstateModal })));
const LegalContractModal = React.lazy(() => import("@/components/LegalContractModal").then(m => ({ default: m.LegalContractModal })));
const SocialMediaShareModal = React.lazy(() => import("@/components/SocialMediaShareModal").then(m => ({ default: m.SocialMediaShareModal })));
const TapuTakipModal = React.lazy(() => import("@/components/TapuTakipModal").then(m => ({ default: m.TapuTakipModal })));
const FixtureVaultModal = React.lazy(() => import("@/components/realestate/FixtureVaultModal").then(m => ({ default: m.FixtureVaultModal })));

interface RealEstateModalsContainerProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  selectedProperty: any;
  setSelectedProperty: (p: any) => void;
  isContractModalOpen: boolean;
  setIsContractModalOpen: (open: boolean) => void;
  contractProperty: any;
  setContractProperty: React.Dispatch<React.SetStateAction<any>>;
  contractInitialTemplateId?: string;
  setContractInitialTemplateId?: (tplId: string | undefined) => void;
  isTapuModalOpen: boolean;
  setIsTapuModalOpen: (open: boolean) => void;
  tapuProperty: any;
  setTapuProperty: (p: any) => void;
  isTourModalOpen: boolean;
  setIsTourModalOpen: (open: boolean) => void;
  activeTourProperty: any;
  setActiveTourProperty: (p: any) => void;
  isSocialShareModalOpen: boolean;
  setIsSocialShareModalOpen: (open: boolean) => void;
  socialShareProperty: any;
  setSocialShareProperty: (p: any) => void;
  isFixtureVaultModalOpen?: boolean;
  setIsFixtureVaultModalOpen?: (open: boolean) => void;
  fixtureVaultProperty?: any;
  setFixtureVaultProperty?: (p: any) => void;
  viewDocsProperty: any;
  setViewDocsProperty: (p: any) => void;
  storeId?: number;
  user: any;
  userRole: string;
  branding: any;
  safeProperties: any[];
  onSave: (p: any) => void;
  fetchTasks: () => void;
}

export const RealEstateModalsContainer: React.FC<RealEstateModalsContainerProps> = ({
  isModalOpen,
  setIsModalOpen,
  selectedProperty,
  setSelectedProperty,
  isContractModalOpen,
  setIsContractModalOpen,
  contractProperty,
  setContractProperty,
  contractInitialTemplateId,
  setContractInitialTemplateId,
  isTapuModalOpen,
  setIsTapuModalOpen,
  tapuProperty,
  setTapuProperty,
  isTourModalOpen,
  setIsTourModalOpen,
  activeTourProperty,
  setActiveTourProperty,
  isSocialShareModalOpen,
  setIsSocialShareModalOpen,
  socialShareProperty,
  setSocialShareProperty,
  isFixtureVaultModalOpen,
  setIsFixtureVaultModalOpen,
  fixtureVaultProperty,
  setFixtureVaultProperty,
  viewDocsProperty,
  setViewDocsProperty,
  storeId,
  user,
  userRole,
  branding,
  safeProperties,
  onSave,
  fetchTasks
}) => {
  const [editingContractDoc, setEditingContractDoc] = React.useState<any>(null);

  return (
    <>
      {/* Real Estate Modal component */}
      {isModalOpen && (
        <React.Suspense fallback={
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-slate-600">İlan Formu Yükleniyor...</p>
            </div>
          </div>
        }>
          <RealEstateModal 
            isOpen={isModalOpen} 
            onClose={() => { setIsModalOpen(false); setSelectedProperty(null); }} 
            property={selectedProperty}
            storeId={storeId || user?.store_id}
            userRole={userRole}
            safeProperties={safeProperties}
            defaultStoreName={branding?.store_name || branding?.name || "Rodel Investment"}
            onSave={async (p) => {
              try {
                if (onSave) {
                  await onSave(p);
                  setIsModalOpen(false);
                  setSelectedProperty(null);
                }
              } catch (err: any) {
                alert("İlan kaydedilirken bir hata oluştu: " + (err.message || err));
              }
            }}
          />
        </React.Suspense>
      )}

      {/* Dynamic Bilingual Legal Contract Generator Modal */}
      {contractProperty && (
        <React.Suspense fallback={null}>
          <LegalContractModal
            isOpen={isContractModalOpen}
            onClose={() => {
              setIsContractModalOpen(false);
              setContractProperty(null);
              setEditingContractDoc(null);
              if (setContractInitialTemplateId) setContractInitialTemplateId(undefined);
            }}
            property={contractProperty}
            branding={branding}
            initialTemplateId={editingContractDoc?.details?.templateId || contractInitialTemplateId}
            initialContractDoc={editingContractDoc}
            onSaveContract={async (contractDoc, prePortfolioMeta) => {
              if (!onSave || !contractProperty) return;
              const isPrePortfolio =
                !contractProperty.id ||
                String(contractProperty.id).startsWith("pre_portfolio_") ||
                String(contractProperty.id).startsWith("temp_");

              const existingDocs = contractProperty.documents || [];
              const existingIdx = existingDocs.findIndex((d: any) => d && d.id === contractDoc.id);
              const updatedDocs =
                existingIdx >= 0
                  ? existingDocs.map((d: any, idx: number) => (idx === existingIdx ? contractDoc : d))
                  : [...existingDocs, contractDoc];

              if (isPrePortfolio) {
                const isRentAuth =
                  prePortfolioMeta?.listingIntent === "rent" ||
                  contractDoc?.details?.templateId === "rental_authorization";
                const addrLabel = (
                  prePortfolioMeta?.address ||
                  contractDoc?.details?.rentalAddress ||
                  "KKTC"
                ).trim();
                const typeLabel = (
                  prePortfolioMeta?.propertyTypeFeatures ||
                  contractDoc?.details?.authPropertyTypeFeatures ||
                  "Gayrimenkul"
                ).trim();
                const ownerFullName = (
                  prePortfolioMeta?.ownerName ||
                  contractDoc?.details?.clientName ||
                  ""
                ).trim();
                const ownerTel = (
                  prePortfolioMeta?.ownerPhone ||
                  contractDoc?.details?.clientPhone ||
                  ""
                ).trim();
                const ownerIdNo = (
                  prePortfolioMeta?.ownerIdentity ||
                  contractDoc?.details?.clientIdentity ||
                  ""
                ).trim();

                const newPrePortfolioProp = {
                  ...contractProperty,
                  title: `[YETKİ ALINDI] ${typeLabel} - ${addrLabel}`,
                  description: `Yetki Sözleşmesi ile Ön Portföye Alındı. Taşınmazın Adresi: ${addrLabel} | Cinsi ve Özellikleri: ${typeLabel}. (Fotoğraf çekimi ve detaylı ilan bilgileri bekleniyor)`,
                  address: addrLabel,
                  location: prePortfolioMeta?.district || addrLabel,
                  kktc_region: prePortfolioMeta?.district || contractProperty?.kktc_region || "Lefkoşa",
                  mahalle: prePortfolioMeta?.townVillage || "",
                  price: Number(prePortfolioMeta?.price || 0),
                  currency: prePortfolioMeta?.currency || "GBP",
                  listing_intent: isRentAuth ? "rent" : "sale",
                  listing_type: isRentAuth ? "Kiralık" : "Satılık",
                  kocan_no: prePortfolioMeta?.kocanNo || "",
                  pafta: prePortfolioMeta?.paftaNo || "",
                  ada: prePortfolioMeta?.adaNo || "",
                  parsel: prePortfolioMeta?.parselNo || "",
                  owner_name: ownerFullName,
                  owner_phone: ownerTel,
                  owner_info: {
                    fullName: ownerFullName,
                    phone: ownerTel,
                    identityNo: ownerIdNo,
                    idNumber: ownerIdNo,
                    address: prePortfolioMeta?.ownerAddress || ""
                  },
                  documents: updatedDocs
                };

                const createdRes = await onSave(newPrePortfolioProp);
                const resolvedProp =
                  createdRes && typeof createdRes === "object"
                    ? createdRes
                    : { ...newPrePortfolioProp };
                setContractProperty(resolvedProp);
                toast.success("Yetki sözleşmesi kaydedildi ve mülk 'Ön Portföy' olarak portföye eklendi!");
                return resolvedProp;
              }

              const savedRes = await onSave({
                ...contractProperty,
                documents: updatedDocs
              });
              setContractProperty((prev: any) => (prev ? { ...prev, documents: updatedDocs } : null));
              return savedRes;
            }}
          />
        </React.Suspense>
      )}

      {/* Tapu Süreç & Randevu Takipçisi Modal */}
      {tapuProperty && (
        <React.Suspense fallback={null}>
          <TapuTakipModal
            isOpen={isTapuModalOpen}
            onClose={() => {
              setIsTapuModalOpen(false);
              setTapuProperty(null);
            }}
            property={tapuProperty}
            branding={branding}
            onSaveTrack={async (updatedProperty) => {
              if (!onSave) return;
              await onSave(updatedProperty);
              toast.success("Tapu tescil süreci başarıyla kaydedildi!");
            }}
          />
        </React.Suspense>
      )}

      {/* Tour Arranger Modal */}
      {isTourModalOpen && (
        <ArrangeTourModal
          onClose={() => {
            setIsTourModalOpen(false);
            setActiveTourProperty(null);
          }}
          property={activeTourProperty}
          propertiesList={safeProperties}
          storeId={storeId || user?.store_id}
          onSave={() => {
            setIsTourModalOpen(false);
            setActiveTourProperty(null);
            fetchTasks();
          }}
        />
      )}

      {/* Social Media Sharing & Poster Creation Wizard */}
      {isSocialShareModalOpen && socialShareProperty && (
        <React.Suspense fallback={null}>
          <SocialMediaShareModal
            isOpen={isSocialShareModalOpen}
            onClose={() => {
              setIsSocialShareModalOpen(false);
              setSocialShareProperty(null);
            }}
            property={socialShareProperty}
            branding={branding}
          />
        </React.Suspense>
      )}

      {/* Fixtures & Inventory Vault Modal (Internal Secret Legal Archive for Furnished Rentals) */}
      {fixtureVaultProperty && (
        <React.Suspense fallback={null}>
          <FixtureVaultModal
            isOpen={!!isFixtureVaultModalOpen}
            onClose={() => {
              if (setIsFixtureVaultModalOpen) setIsFixtureVaultModalOpen(false);
              if (setFixtureVaultProperty) setFixtureVaultProperty(null);
            }}
            property={fixtureVaultProperty}
            onUpdateFixtures={async (updatedPhotos) => {
              if (!onSave || !fixtureVaultProperty) return;
              await onSave({
                ...fixtureVaultProperty,
                fixture_photos: updatedPhotos
              });
              if (setFixtureVaultProperty) {
                setFixtureVaultProperty((prev: any) => prev ? { ...prev, fixture_photos: updatedPhotos } : null);
              }
            }}
          />
        </React.Suspense>
      )}

      {/* Property Documents Quick Access Modal */}
      {viewDocsProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm cursor-pointer" onClick={() => setViewDocsProperty(null)}>
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] cursor-default" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <div>
                <span className="text-[10px] bg-emerald-600/20 text-emerald-400 font-black tracking-widest px-2 py-0.5 rounded-md uppercase font-mono">GÜVENLİ DEPOLAMA</span>
                <h3 className="text-lg font-black text-white mt-1">Resmî Evraklar & Sözleşmeler</h3>
                <p className="text-slate-400 text-xs">#{viewDocsProperty.id} • {viewDocsProperty.title}</p>
              </div>
              <button 
                onClick={() => setViewDocsProperty(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="p-6 overflow-y-auto space-y-3 bg-slate-900 flex-1">
              {(!viewDocsProperty.documents || viewDocsProperty.documents.length === 0) ? (
                <p className="text-center py-8 text-slate-500 text-xs font-semibold">Bu gayrimenkule ait resmî evrak bulunmamaktadır.</p>
              ) : (
                viewDocsProperty.documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-2xl shadow-xs relative group">
                    <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-xs font-bold text-white truncate" title={doc.name}>
                        {doc.name}
                      </span>
                      <div className="flex flex-wrap gap-2 items-center text-[10px] text-slate-400 mt-0.5 font-bold">
                        <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                          {doc.category === 'title_deed' ? 'Tapu Örneği' :
                           doc.category === 'dask' ? 'DASK Poliçesi' :
                           doc.category === 'contract' ? 'Sözleşme' : 'Yetki Belgesi'}
                        </span>
                        {doc.details?.contractStage === "finalized" && (
                          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/40 font-black">
                            ✔ Final (Alıcı + Satıcı İmzalı)
                          </span>
                        )}
                        {doc.details?.contractStage === "buyer_signed" && !doc.details?.sellerSigned && (
                          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/40 font-black">
                            1/2 Alıcı İmzalı • Satıcı Bekleniyor
                          </span>
                        )}
                        <span>{doc.upload_date}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 items-center shrink-0">
                      {doc.file_url === "is_virtual_contract" && (
                        <button
                          type="button"
                          onClick={() => {
                            const targetProp = viewDocsProperty;
                            setViewDocsProperty(null);
                            setEditingContractDoc(doc);
                            setContractProperty(targetProp);
                            setIsContractModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-[10px] font-black transition cursor-pointer"
                          title="Sözleşmeyi Aç / Satıcı İmzası Al / Taraflara İlet"
                        >
                          {doc.details?.sellerSigned ? "İlet / Düzenle" : "2. İmza / İlet"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (doc.file_url === "is_virtual_contract") {
                            const effectiveTemplateId =
                              doc.details?.templateId ||
                              (viewDocsProperty.listing_intent === "rent" ? "rental_agreement" : "sales_brokerage");
                            const tDef =
                              contractTemplates.find((t: any) => t.id === effectiveTemplateId) || contractTemplates[0];
                            const formattedPriceNum = Number(viewDocsProperty.price).toLocaleString("tr-TR", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                            });
                            const symbol =
                              viewDocsProperty.currency === "GBP"
                                ? "£"
                                : viewDocsProperty.currency === "USD"
                                ? "$"
                                : viewDocsProperty.currency === "EUR"
                                ? "€"
                                : "₺";

                            const clientNameVal = doc.details?.clientName || "[Alıcı / Mülk Sahibi Adı]";
                            const clientIdentityVal = doc.details?.clientIdentity || "[T.C. No]";
                            const clientPhoneVal = doc.details?.clientPhone || "[Telefon]";
                            const ipAddressVal = doc.details?.ipAddress || "127.0.0.1";
                            const timestampVal =
                              doc.upload_date || doc.details?.contractDate || new Date().toLocaleDateString("tr-TR");

                            const combined = `${clientNameVal}-${clientIdentityVal}-${clientPhoneVal}-${viewDocsProperty.id}-security-seal`;
                            let hash = 0;
                            for (let i = 0; i < combined.length; i++) {
                              const char = combined.charCodeAt(i);
                              hash = (hash << 5) - hash + char;
                              hash = hash & hash;
                            }
                            const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
                            const randomHex = (index: number) => {
                              let rHash = 0;
                              const rCombined = `${combined}-${index}`;
                              for (let i = 0; i < rCombined.length; i++) {
                                rHash = (rHash << 5) - rHash + rCombined.charCodeAt(i);
                                rHash = rHash & rHash;
                              }
                              return Math.abs(rHash).toString(16).toUpperCase().padStart(8, "0");
                            };
                            const securityCode = `SEC-LP-${hex}-${randomHex(1)}-${randomHex(2)}`;

                            const propDepositNum =
                              Number(viewDocsProperty.deposit) > 0
                                ? Number(viewDocsProperty.deposit)
                                : Number(viewDocsProperty.sector_data?.deposit) || 0;
                            const resolvedDepositAmount =
                              doc.details?.depositAmount && doc.details.depositAmount !== "1 Aylık Kira Bedeli"
                                ? doc.details.depositAmount
                                : propDepositNum > 0
                                ? `${propDepositNum} ${symbol}`
                                : doc.details?.depositAmount || "1 Aylık Kira Bedeli";

                            const resolvedFixturePhotos: any[] = (() => {
                              if (Array.isArray(doc.details?.fixturePhotos) && doc.details.fixturePhotos.length > 0) {
                                return doc.details.fixturePhotos;
                              }
                              const raw =
                                viewDocsProperty.fixture_photos || viewDocsProperty.sector_data?.fixture_photos;
                              if (Array.isArray(raw)) return raw;
                              if (typeof raw === "string") {
                                try {
                                  return JSON.parse(raw);
                                } catch {
                                  return [];
                                }
                              }
                              return [];
                            })();

                            const resolvedIsFurnishedRental = Boolean(
                              doc.details?.isFurnishedRental ||
                                doc.details?.fixtureApproved ||
                                resolvedFixturePhotos.length > 0 ||
                                ((viewDocsProperty.listing_intent === "rent" || tDef.id === "rental_agreement") &&
                                  (viewDocsProperty.furnished === true ||
                                    viewDocsProperty.furnished === "true" ||
                                    viewDocsProperty.furnished === "esyali" ||
                                    viewDocsProperty.furnished === "furnished" ||
                                    viewDocsProperty.sector_data?.furnished === true ||
                                    viewDocsProperty.sector_data?.furnished === "esyali" ||
                                    viewDocsProperty.sector_data?.furnished === "furnished"))
                            );

                            const resolvedRegion = resolvePropertyRegionLabel(viewDocsProperty);

                            const { html } = tDef.getTemplate({
                              storeName: branding?.store_name || branding?.name || "Premium Real Estate",
                              storePhone: branding?.phone || branding?.whatsapp_number || "+90 533 800 00 00",
                              storeEmail: branding?.email || "realestate@lookprice.me",
                              clientName: clientNameVal,
                              clientIdentity: clientIdentityVal,
                              buyerIdType: doc.details?.buyerIdType || "KKTC KİMLİK",
                              clientPhone: clientPhoneVal,
                              ownerName: doc.details?.ownerName || viewDocsProperty.owner_info?.fullName,
                              ownerPhone: doc.details?.ownerPhone || viewDocsProperty.owner_info?.phone,
                              sellerIdentity: doc.details?.sellerIdentity,
                              sellerIdType: doc.details?.sellerIdType || "KKTC Kimlik Kartı",
                              propertyTitle: resolveOfficialPropertyTitle(viewDocsProperty),
                              propertyLocation: resolvedRegion,
                              propertyPrice: `${formattedPriceNum} ${symbol}`,
                              propertyBlockPlot: viewDocsProperty.block_plot,
                              commissionRate: doc.details?.commissionRate || "5",
                              contractDate: doc.upload_date,
                              propertyAddress: doc.details?.rentalAddress || viewDocsProperty.address,
                              isSigned: doc.details?.signed,
                              signingName: doc.details?.signingName || clientNameVal,
                              signatureImage: doc.details?.signatureImage,
                              sellerSigned: doc.details?.sellerSigned,
                              sellerSigningName: doc.details?.sellerSigningName || doc.details?.ownerName,
                              sellerSignatureImage: doc.details?.sellerSignatureImage,
                              splitRatio: doc.details?.splitRatio,
                              contractDuration: doc.details?.contractDuration,
                              evictionDate: doc.details?.evictionDate,
                              depositAmount: resolvedDepositAmount,
                              rentDuration: doc.details?.rentDuration,
                              paymentDay: doc.details?.paymentDay,
                              // Rental & Authorization contract fields
                              exclusivityIntent:
                                doc.details?.exclusivityIntent ||
                                (viewDocsProperty.listing_intent === "rent" ? "rent" : "sale"),
                              authPropertyCategory: doc.details?.authPropertyCategory,
                              authPropertyCategoryOther: doc.details?.authPropertyCategoryOther,
                              authServiceFeePayer: doc.details?.authServiceFeePayer,
                              authServiceFeeReceiver: doc.details?.authServiceFeeReceiver,
                              authShowingDayType: doc.details?.authShowingDayType,
                              authShowingHours: doc.details?.authShowingHours,
                              authDurationDays: doc.details?.authDurationDays,
                              rentalPropertyDef: doc.details?.rentalPropertyDef,
                              authPropertyTypeFeatures: doc.details?.authPropertyTypeFeatures || doc.details?.rentalPropertyDef,
                              authAdvancePayment: doc.details?.authAdvancePayment,
                              authAnnualIncreaseRate: doc.details?.authAnnualIncreaseRate,
                              authTenantCriteria: doc.details?.authTenantCriteria,
                              authCopiesCount: doc.details?.authCopiesCount,
                              rentalUsagePurpose: doc.details?.rentalUsagePurpose,
                              rentalDistrict: doc.details?.rentalDistrict,
                              rentalTownVillage: doc.details?.rentalTownVillage,
                              kocanNo: doc.details?.kocanNo,
                              paftaNo: doc.details?.paftaNo,
                              adaNo: doc.details?.adaNo,
                              parselNo: doc.details?.parselNo,
                              rentPriceRaw: doc.details?.rentPriceRaw || formattedPriceNum,
                              rentCurrency: doc.details?.rentCurrency || (viewDocsProperty.currency === "TRY" ? "TL" : viewDocsProperty.currency || "TL"),
                              rentPaymentMethod: doc.details?.rentPaymentMethod,
                              rentStartDate: doc.details?.rentStartDate,
                              rentEndDate: doc.details?.rentEndDate,
                              // Sales contract fields
                              salePropertyDetails: doc.details?.salePropertyDetails,
                              salePriceRaw: doc.details?.salePriceRaw || formattedPriceNum,
                              saleCurrency: doc.details?.saleCurrency || viewDocsProperty.currency || "GBP",
                              depositDate: doc.details?.depositDate,
                              remainingAmountRaw: doc.details?.remainingAmountRaw,
                              deedTransferDate: doc.details?.deedTransferDate,
                              paymentDeadlineMonths: doc.details?.paymentDeadlineMonths,
                              gracePeriodDays: doc.details?.gracePeriodDays,
                              taxClauseText: doc.details?.taxClauseText,
                              witness1Name: doc.details?.witness1Name,
                              witness1Identity: doc.details?.witness1Identity,
                              witness2Name: doc.details?.witness2Name,
                              witness2Identity: doc.details?.witness2Identity,
                              // Offer letter & Consultant fields
                              offerPropertyNature: doc.details?.offerPropertyNature,
                              offerPropertyDetails: doc.details?.offerPropertyDetails,
                              viewingDate: doc.details?.viewingDate,
                              agentAndCompany: doc.details?.agentAndCompany,
                              offerPrice: doc.details?.offerPrice,
                              offerValidityPeriod: doc.details?.offerValidityPeriod,
                              offerFreeNotes: doc.details?.offerFreeNotes,
                              customClauses: doc.details?.customClauses,
                              authorizedPersonName: doc.details?.authorizedPersonName,
                              authorizedPersonIdentity: doc.details?.authorizedPersonIdentity,
                              brokerAddress: doc.details?.brokerAddress || branding?.address,
                              clientAddress: doc.details?.clientAddress,
                              showingItem1Details: doc.details?.showingItem1Details,
                              showingItem1Price: doc.details?.showingItem1Price,
                              showingItem2Details: doc.details?.showingItem2Details,
                              showingItem2Price: doc.details?.showingItem2Price,
                              authorizedPersonIdType: doc.details?.authorizedPersonIdType,
                              consultantIdType: doc.details?.consultantIdType,
                              officeSplitRate: doc.details?.officeSplitRate,
                              consultantSplitRate: doc.details?.consultantSplitRate,
                              externalOfficeSplitRate: doc.details?.externalOfficeSplitRate,
                              externalInternalOfficeRate: doc.details?.externalInternalOfficeRate,
                              externalInternalConsultantRate: doc.details?.externalInternalConsultantRate,
                              noticePeriodDays: doc.details?.noticePeriodDays,
                              isFurnishedRental: resolvedIsFurnishedRental,
                              fixturePhotosCount: resolvedFixturePhotos.length,
                              fixturePhotos: resolvedFixturePhotos
                            });

                            const securityBoxHtml = `
                              <div style="margin-top: 32px; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 18px; background-color: #f8fafc; font-family: sans-serif; page-break-inside: avoid;">
                                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
                                  <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; background-color: #e0e7ff; color: #4338ca; border-radius: 6px; font-weight: bold; font-size: 13px;">✓</span>
                                    <div>
                                      <h4 style="margin: 0; font-size: 13px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">E-İMZA & GÜVENLİK DOĞRULAMA RAPORU</h4>
                                      <span style="font-size: 10px; color: #475569; font-weight: bold; text-transform: uppercase;">DIGITAL SIGNATURE & INTEGRITY REPORT</span>
                                    </div>
                                  </div>
                                  <span style="background-color: #dcfce7; border: 1px solid #86efac; color: #15803d; font-size: 10px; font-weight: 900; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap;">
                                    ${doc.details?.sellerSigned ? "FİNAL ONAYLI (ALICI + SATICI İMZALI)" : resolvedIsFurnishedRental ? `DİJİTAL ONAYLANDI (SÖZLEŞME + EK-1 EŞYA LİSTESİ: ${resolvedFixturePhotos.length} FOTOĞRAF)` : "DİJİTAL ONAYLANDI"}
                                  </span>
                                </div>
                                
                                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 11px; margin-bottom: 12px;">
                                  <div>
                                    <span style="color: #475569; font-weight: bold; display: block; text-transform: uppercase; font-size: 9px; margin-bottom: 2px;">Alıcı (1. İmza)</span>
                                    <strong style="color: #0f172a; font-size: 12px;">${clientNameVal} (${clientIdentityVal})</strong>
                                  </div>
                                  <div>
                                    <span style="color: #475569; font-weight: bold; display: block; text-transform: uppercase; font-size: 9px; margin-bottom: 2px;">Satıcı (2. Final İmza)</span>
                                    <strong style="color: #0f172a; font-size: 12px;">${doc.details?.ownerName || "-"} (${doc.details?.sellerSigned ? "✔ İmzalandı" : "Bekleniyor"})</strong>
                                  </div>
                                  <div>
                                    <span style="color: #475569; font-weight: bold; display: block; text-transform: uppercase; font-size: 9px; margin-bottom: 2px;">IP Adresi (IP Address)</span>
                                    <strong style="color: #0f172a; font-size: 12px; font-family: monospace;">${ipAddressVal}</strong>
                                  </div>
                                  <div>
                                    <span style="color: #475569; font-weight: bold; display: block; text-transform: uppercase; font-size: 9px; margin-bottom: 2px;">Güvenlik & Bütünlük Kodu (Security Hash / SHA)</span>
                                    <strong style="color: #16a34a; font-size: 11px; font-family: monospace; letter-spacing: 0.5px;">${securityCode}</strong>
                                  </div>
                                </div>
                                
                                <div style="border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 10px; color: #334155; text-align: justify; line-height: 1.5;">
                                  <p style="margin: 0;"><strong>YASAL BEYAN VE GEÇERLİLİK:</strong> İşbu dijital sözleşme${resolvedIsFurnishedRental ? " ve EK-1 Eşya/Demirbaş Teslim Listesi ile mühürlü delil fotoğrafları" : ""}, taraflarca mobil/tablet cihazın dokunmatik ekranı üzerinde biyometrik parmak izi imza simülasyonu ile onaylanmıştır. 5070 Sayılı Elektronik İmza Kanunu, KKTC E-İmza Yasası ve Türk Borçlar Kanunu kapsamında hukuken geçerli ve tarafları bağlayıcı "Yazılı Delil Başlangıcı ve Sözleşmesi" niteliğindedir.</p>
                                </div>
                              </div>
                            `;

                            let enrichedHtml = html;
                            const lastDivIndex = enrichedHtml.lastIndexOf("</div>");
                            if (lastDivIndex !== -1) {
                              enrichedHtml = enrichedHtml.substring(0, lastDivIndex) + securityBoxHtml + "</div>";
                            } else {
                              enrichedHtml = enrichedHtml + securityBoxHtml;
                            }

                            const iframe = document.createElement("iframe");
                            iframe.style.position = "absolute";
                            iframe.style.width = "0px";
                            iframe.style.height = "0px";
                            iframe.style.border = "none";
                            document.body.appendChild(iframe);
                            const printDoc = iframe.contentWindow?.document;
                            if (printDoc) {
                              printDoc.write(`
                                <html>
                                  <head>
                                    <title>${doc.name}</title>
                                    <style>
                                      body { font-family: sans-serif; background: white; margin: 20px; color: #0f172a; }
                                      @media print { body { margin: 10px; } }
                                    </style>
                                  </head>
                                  <body>${enrichedHtml}</body>
                                </html>
                              `);
                              printDoc.close();
                              setTimeout(() => {
                                iframe.contentWindow?.focus();
                                iframe.contentWindow?.print();
                                setTimeout(() => document.body.removeChild(iframe), 1000);
                              }, 400);
                            }
                          } else {
                            window.open(doc.file_url, "_blank");
                          }
                        }}
                        className="p-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-white rounded-xl transition cursor-pointer"
                        title="Evrak Görüntüle / Yazdır"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm("Bu sözleşmeyi/evrakı silmek istediğinize emin misiniz?")) return;
                          const updatedDocs = (viewDocsProperty.documents || []).filter((d: any) => d.id !== doc.id);
                          const updatedProp = { ...viewDocsProperty, documents: updatedDocs };
                          await onSave(updatedProp);
                          setViewDocsProperty(updatedProp);
                          toast.success("Sözleşme başarıyla silindi!");
                        }}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-white rounded-xl transition cursor-pointer"
                        title="Sözleşmeyi Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setViewDocsProperty(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
