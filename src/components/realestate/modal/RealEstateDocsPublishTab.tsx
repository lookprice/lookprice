import React, { useRef } from "react";
import { FileText, Trash2, Camera, Upload, Plus, Eye } from "lucide-react";
import { RealEstateProperty } from "../../../types";
import { contractTemplates, resolvePropertyRegionLabel, resolveOfficialPropertyTitle } from "../../../utils/contractTemplates";

interface RealEstateDocsPublishTabProps {
  formData: Partial<RealEstateProperty>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<RealEstateProperty>>>;
  isOfficeManager: boolean;
  docName: string;
  setDocName: (val: string) => void;
  docCategory: "title_deed" | "dask" | "contract" | "auth_doc";
  setDocCategory: (val: "title_deed" | "dask" | "contract" | "auth_doc") => void;
  selectedDocFile: File | null;
  setSelectedDocFile: (file: File | null) => void;
  handleAddDocument: (e: React.FormEvent) => void;
  handleRemoveDocument: (id: string) => void;
}

export const RealEstateDocsPublishTab: React.FC<RealEstateDocsPublishTabProps> = ({
  formData,
  setFormData,
  isOfficeManager,
  docName,
  setDocName,
  docCategory,
  setDocCategory,
  selectedDocFile,
  setSelectedDocFile,
  handleAddDocument,
  handleRemoveDocument
}) => {
  const docCameraInputRef = useRef<HTMLInputElement>(null);

  const handleViewDocument = (doc: any) => {
    if (doc.file_url === "is_virtual_contract") {
      const effectiveTemplateId =
        doc.details?.templateId || (formData.listing_intent === "rent" ? "rental_agreement" : "showing_agreement");
      const tDef = contractTemplates.find((t) => t.id === effectiveTemplateId) || contractTemplates[0];
      const formattedPriceNum = Number(formData.price || 0).toLocaleString("tr-TR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
      const symbol =
        formData.currency === "GBP"
          ? "£"
          : formData.currency === "USD"
          ? "$"
          : formData.currency === "EUR"
          ? "€"
          : "₺";

      const propDepositNum =
        Number(formData.deposit) > 0
          ? Number(formData.deposit)
          : Number((formData as any).sector_data?.deposit) || 0;
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
        const raw = formData.fixture_photos || (formData as any).sector_data?.fixture_photos;
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
          ((formData.listing_intent === "rent" || tDef.id === "rental_agreement") &&
            (formData.furnished === true ||
              (formData.furnished as any) === "true" ||
              (formData.furnished as any) === "esyali" ||
              (formData.furnished as any) === "furnished"))
      );

      const { html } = tDef.getTemplate({
        storeName: doc.details?.storeName || "Yetkili Emlak Ofisi",
        clientName: doc.details?.clientName || "[Müşteri Adı]",
        clientIdentity: doc.details?.clientIdentity || "[Kimlik / Pasaport No]",
        clientPhone: doc.details?.clientPhone || "[Telefon]",
        propertyTitle: resolveOfficialPropertyTitle(formData),
        propertyLocation: resolvePropertyRegionLabel(formData),
        propertyPrice: `${formattedPriceNum} ${symbol}`,
        propertyBlockPlot: formData.block_plot,
        commissionRate: doc.details?.commissionRate || "3",
        contractDate: doc.upload_date || doc.details?.contractDate || "",
        propertyAddress: doc.details?.rentalAddress || formData.address,
        isSigned: doc.details?.signed,
        signatureImage: doc.details?.signatureImage,
        sellerSigned: doc.details?.sellerSigned,
        sellerSigningName: doc.details?.sellerSigningName,
        sellerSignatureImage: doc.details?.sellerSignatureImage,
        contractStage: doc.details?.contractStage,
        splitRatio: doc.details?.splitRatio,
        contractDuration: doc.details?.contractDuration,
        evictionDate: doc.details?.evictionDate,
        depositAmount: resolvedDepositAmount,
        rentDuration: doc.details?.rentDuration,
        paymentDay: doc.details?.paymentDay,
        ownerName: doc.details?.ownerName,
        ownerPhone: doc.details?.ownerPhone,
        sellerIdentity: doc.details?.sellerIdentity,
        sellerIdType: doc.details?.sellerIdType,
        buyerIdType: doc.details?.buyerIdType,
        rentalPropertyDef: doc.details?.rentalPropertyDef,
        rentalUsagePurpose: doc.details?.rentalUsagePurpose,
        rentalDistrict: doc.details?.rentalDistrict,
        rentalTownVillage: doc.details?.rentalTownVillage,
        kocanNo: doc.details?.kocanNo,
        paftaNo: doc.details?.paftaNo,
        adaNo: doc.details?.adaNo,
        parselNo: doc.details?.parselNo,
        rentPriceRaw: doc.details?.rentPriceRaw || formattedPriceNum,
        rentCurrency: doc.details?.rentCurrency || (formData.currency === "TRY" ? "TL" : formData.currency || "TL"),
        rentPaymentMethod: doc.details?.rentPaymentMethod,
        rentStartDate: doc.details?.rentStartDate,
        rentEndDate: doc.details?.rentEndDate,
        salePropertyDetails: doc.details?.salePropertyDetails,
        salePriceRaw: doc.details?.salePriceRaw,
        saleCurrency: doc.details?.saleCurrency || formData.currency || "GBP",
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
        offerPropertyNature: doc.details?.offerPropertyNature,
        offerPropertyDetails: doc.details?.offerPropertyDetails,
        viewingDate: doc.details?.viewingDate,
        agentAndCompany: doc.details?.agentAndCompany,
        authorizedPersonIdentity: doc.details?.authorizedPersonIdentity,
        brokerAddress: doc.details?.brokerAddress,
        clientAddress: doc.details?.clientAddress,
        showingItem1Details: doc.details?.showingItem1Details,
        showingItem1Price: doc.details?.showingItem1Price,
        showingItem2Details: doc.details?.showingItem2Details,
        showingItem2Price: doc.details?.showingItem2Price,
        offerPrice: doc.details?.offerPrice,
        offerValidityPeriod: doc.details?.offerValidityPeriod,
        offerFreeNotes: doc.details?.offerFreeNotes,
        customClauses: doc.details?.customClauses,
        isFurnishedRental: resolvedIsFurnishedRental,
        fixturePhotosCount: resolvedFixturePhotos.length,
        fixturePhotos: resolvedFixturePhotos
      });

      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);
      const docWin = iframe.contentWindow?.document;
      if (docWin) {
        docWin.open();
        docWin.write(`
          <html>
            <head>
              <title>${doc.name}</title>
              <style>
                body { font-family: sans-serif; background: white; margin: 20px; color: #0f172a; }
                @media print { body { margin: 10px; } }
              </style>
            </head>
            <body>${html}</body>
          </html>
        `);
        docWin.close();
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => document.body.removeChild(iframe), 1500);
        }, 300);
      }
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Document Management Box */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 sm:p-3 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 flex-wrap gap-2">
          <span className="text-[11px] font-black uppercase text-amber-950 flex items-center gap-1.5 tracking-wide">
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            6. Güvenli Resmi Evrak Yönetimi (Tapu, DASK, Sözleşme)
          </span>

          {/* Verified Badge Checkbox */}
          <label className="flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 cursor-pointer">
            <input
              type="checkbox"
              className="w-3 h-3 rounded text-amber-600 focus:ring-amber-500"
              checked={formData.is_verified || false}
              onChange={(e) =>
                setFormData({ ...formData, is_verified: e.target.checked })
              }
            />
            <span className="text-[11px] font-black text-amber-900">
              Doğrulanmış Portföy Rozeti
            </span>
          </label>
        </div>

        {isOfficeManager ? (
          <div className="space-y-2">
            {/* Documents List */}
            <div>
              {!formData.documents || formData.documents.length === 0 ? (
                <div className="text-center py-2 border border-dashed border-slate-200 rounded-lg bg-slate-50 text-slate-400 text-xs">
                  Henüz eklenmiş resmi evrak yok.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {formData.documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="font-bold text-slate-800 truncate flex-1" title={doc.name}>
                        {doc.name}
                      </span>
                      {doc.size && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {doc.size}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleViewDocument(doc)}
                        className="text-indigo-600 p-0.5 hover:bg-indigo-50 rounded cursor-pointer"
                        title="Görüntüle / Yazdır"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(doc.id)}
                        className="text-rose-500 p-0.5 hover:bg-rose-50 rounded cursor-pointer"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Add Doc Input */}
            <div className="bg-slate-50/80 p-2 rounded-lg border border-slate-200 space-y-1.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                    Belge Türü
                  </label>
                  <select
                    className="w-full px-2 py-1 h-7.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white"
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value as any)}
                  >
                    <option value="title_deed">Tapu Örneği / Title Deed</option>
                    <option value="dask">DASK / Sigorta</option>
                    <option value="contract">Yetki & Aracılık Sözleşmesi</option>
                    <option value="auth_doc">Diğer Resmî Evrak</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                    Evrak Adı (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Blok A-3 Tapu Örneği"
                    className="w-full px-2 py-1 h-7.5 border border-slate-200 rounded-lg text-xs font-bold bg-white"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                  />
                </div>
              </div>

              <input
                type="file"
                ref={docCameraInputRef}
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedDocFile(file);
                    if (!docName)
                      setDocName(file.name.split(".")[0] || "Belge Fotoğrafı");
                  }
                }}
              />

              <div className="flex flex-col sm:flex-row items-center gap-1.5">
                <input
                  type="file"
                  id="document-secure-file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedDocFile(file);
                      if (!docName) setDocName(file.name.split(".")[0]);
                    }
                  }}
                  className="hidden"
                />

                <label
                  htmlFor="document-secure-file"
                  className="w-full sm:flex-1 px-2.5 py-1 border border-dashed border-slate-300 hover:border-indigo-500 rounded-lg bg-white text-xs font-bold text-slate-600 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-600" />
                  {selectedDocFile ? selectedDocFile.name : "Dosya Seç (PDF, Resim)"}
                </label>

                <button
                  type="button"
                  onClick={() => docCameraInputRef.current?.click()}
                  className="w-full sm:w-auto px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Kamera
                </button>

                <button
                  type="button"
                  onClick={handleAddDocument}
                  disabled={!selectedDocFile && !docName}
                  className="w-full sm:w-auto px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-black hover:bg-indigo-700 shadow-2xs disabled:opacity-40 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  Ekle
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Güvenli evrak yönetimi sadece ofis yöneticisi yetkisindedir.
          </p>
        )}
      </div>

      {/* Publication and Marketing Toggles */}
      <div className="bg-slate-900 text-white p-2.5 sm:p-3 rounded-xl space-y-2 shadow-md">
        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 block">
          İlan Yayın & Pazarlama Seçenekleri
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          <label className="flex items-center gap-1.5 cursor-pointer bg-white/10 px-2 py-1 rounded-lg border border-white/10 hover:bg-white/15 transition-all">
            <input
              type="checkbox"
              checked={!!formData.is_trade_in_available}
              onChange={(e) =>
                setFormData({ ...formData, is_trade_in_available: e.target.checked })
              }
              className="w-3.5 h-3.5 text-indigo-500 rounded border-slate-400"
            />
            <span className="text-[11px] font-bold text-white">Takas Kabul</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer bg-white/10 px-2 py-1 rounded-lg border border-white/10 hover:bg-white/15 transition-all">
            <input
              type="checkbox"
              checked={!!formData.is_on_enrakipsiz}
              onChange={(e) =>
                setFormData({ ...formData, is_on_enrakipsiz: e.target.checked })
              }
              className="w-3.5 h-3.5 text-indigo-500 rounded border-slate-400"
            />
            <span className="text-[11px] font-bold text-white">EnRakipsiz.com</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer bg-white/10 px-2 py-1 rounded-lg border border-white/10 hover:bg-white/15 transition-all">
            <input
              type="checkbox"
              checked={!!formData.auto_post_instagram}
              onChange={(e) =>
                setFormData({ ...formData, auto_post_instagram: e.target.checked })
              }
              className="w-3.5 h-3.5 text-indigo-500 rounded border-slate-400"
            />
            <span className="text-[11px] font-bold text-white">Instagram Otomatik</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer bg-rose-500/20 px-2 py-1 rounded-lg border border-rose-500/30 hover:bg-rose-500/30 transition-all">
            <input
              type="checkbox"
              checked={Boolean((formData as any).is_discounted)}
              onChange={(e) =>
                setFormData({ ...formData, is_discounted: e.target.checked } as any)
              }
              className="w-3.5 h-3.5 text-rose-500 rounded border-slate-400"
            />
            <span className="text-[11px] font-bold text-rose-200">Fırsat & Kelepir</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer bg-amber-500/20 px-2 py-1 rounded-lg border border-amber-500/30 hover:bg-amber-500/30 transition-all sm:col-span-2">
            <input
              type="checkbox"
              checked={Boolean((formData as any).is_featured)}
              onChange={(e) =>
                setFormData({ ...formData, is_featured: e.target.checked } as any)
              }
              className="w-3.5 h-3.5 text-amber-500 rounded border-slate-400"
            />
            <span className="text-[11px] font-bold text-amber-200">
              Öne Çıkan / VIP Portföy
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};
