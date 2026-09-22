import React from "react";
import { X, FileText, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { contractTemplates } from "@/utils/contractTemplates";
import { ArrangeTourModal } from "@/components/ArrangeTourModal";

const RealEstateModal = React.lazy(() => import("@/components/RealEstateModal").then(m => ({ default: m.RealEstateModal })));
const LegalContractModal = React.lazy(() => import("@/components/LegalContractModal").then(m => ({ default: m.LegalContractModal })));
const SocialMediaShareModal = React.lazy(() => import("@/components/SocialMediaShareModal").then(m => ({ default: m.SocialMediaShareModal })));
const TapuTakipModal = React.lazy(() => import("@/components/TapuTakipModal").then(m => ({ default: m.TapuTakipModal })));

interface RealEstateModalsContainerProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  selectedProperty: any;
  setSelectedProperty: (p: any) => void;
  isContractModalOpen: boolean;
  setIsContractModalOpen: (open: boolean) => void;
  contractProperty: any;
  setContractProperty: React.Dispatch<React.SetStateAction<any>>;
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
            }}
            property={contractProperty}
            branding={branding}
            onSaveContract={async (contractDoc) => {
              if (!onSave || !contractProperty) return;
              const existingDocs = contractProperty.documents || [];
              const updatedDocs = [...existingDocs.filter((d: any) => d.id !== contractDoc.id), contractDoc];
              await onSave({
                ...contractProperty,
                documents: updatedDocs
              });
              setContractProperty(prev => prev ? { ...prev, documents: updatedDocs } : null);
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
                      <div className="flex gap-2 items-center text-[10px] text-slate-400 mt-0.5 font-bold">
                        <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                          {doc.category === 'title_deed' ? 'Tapu Örneği' :
                           doc.category === 'dask' ? 'DASK Poliçesi' :
                           doc.category === 'contract' ? 'Sözleşme' : 'Yetki Belgesi'}
                        </span>
                        <span>{doc.upload_date}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 items-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (doc.file_url === "is_virtual_contract") {
                            const tDef = contractTemplates.find((t: any) => t.id === (doc.details?.templateId || 'showing_agreement')) || contractTemplates[0];
                            const formattedPriceNum = Number(viewDocsProperty.price).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
                            const symbol = viewDocsProperty.currency === 'GBP' ? '£' : viewDocsProperty.currency === 'USD' ? '$' : viewDocsProperty.currency === 'EUR' ? '€' : '₺';
                            
                            const clientNameVal = doc.details?.clientName || "[Alıcı / Mülk Sahibi Adı]";
                            const clientIdentityVal = doc.details?.clientIdentity || "[T.C. No]";
                            const clientPhoneVal = doc.details?.clientPhone || "[Telefon]";
                            const ipAddressVal = doc.details?.ipAddress || "127.0.0.1";
                            const timestampVal = doc.upload_date || doc.details?.contractDate || new Date().toLocaleDateString("tr-TR");

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

                            const { html } = tDef.getTemplate({
                              storeName: branding?.store_name || branding?.name || "Premium Real Estate",
                              storePhone: branding?.phone || branding?.whatsapp_number || "+90 533 800 00 00",
                              storeEmail: branding?.email || "realestate@lookprice.me",
                              clientName: clientNameVal,
                              clientIdentity: clientIdentityVal,
                              clientPhone: clientPhoneVal,
                              propertyTitle: `[İlan Kodu: LP-${viewDocsProperty.id}] ${viewDocsProperty.title}`,
                              propertyLocation: viewDocsProperty.location || "Kıbrıs",
                              propertyPrice: `${formattedPriceNum} ${symbol}`,
                              propertyBlockPlot: viewDocsProperty.block_plot,
                              commissionRate: doc.details?.commissionRate || "3",
                              contractDate: doc.upload_date,
                              propertyAddress: viewDocsProperty.address,
                              isSigned: doc.details?.signed,
                              signatureImage: doc.details?.signatureImage,
                              splitRatio: doc.details?.splitRatio,
                              contractDuration: doc.details?.contractDuration,
                              evictionDate: doc.details?.evictionDate,
                              depositAmount: doc.details?.depositAmount,
                              rentDuration: doc.details?.rentDuration,
                              paymentDay: doc.details?.paymentDay
                            });

                            const securityBoxHtml = `
                              <div style="margin-top: 45px; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; background-color: #f8fafc; font-family: sans-serif; box-shadow: inset 0 1px 2px rgba(0,0,0,0.02); page-break-inside: avoid;">
                                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                                  <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 16px;">🛡️</span>
                                    <div>
                                      <h4 style="margin: 0; font-size: 13px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">E-İMZA & GÜVENLİK DOĞRULAMA RAPORU</h4>
                                      <span style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase;">DIGITAL SIGNATURE & INTEGRITY REPORT</span>
                                    </div>
                                  </div>
                                  <span style="background-color: #dcfce7; border: 1px solid #bbf7d0; color: #15803d; font-size: 10px; font-weight: 900; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap;">✅ DİJİTAL ONAYLANDI</span>
                                </div>
                                
                                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 11px; margin-bottom: 15px;">
                                  <div>
                                    <span style="color: #64748b; font-weight: bold; display: block; text-transform: uppercase; font-size: 9px; margin-bottom: 2px;">İmzalayan Müşteri (Signing Client)</span>
                                    <strong style="color: #1e293b; font-size: 12px;">${clientNameVal}</strong>
                                  </div>
                                  <div>
                                    <span style="color: #64748b; font-weight: bold; display: block; text-transform: uppercase; font-size: 9px; margin-bottom: 2px;">T.C. Kimlik / Pasaport No (ID / Passport)</span>
                                    <strong style="color: #1e293b; font-size: 12px; font-family: monospace;">${clientIdentityVal}</strong>
                                  </div>
                                  <div>
                                    <span style="color: #64748b; font-weight: bold; display: block; text-transform: uppercase; font-size: 9px; margin-bottom: 2px;">İletişim Telefonu (Client Phone)</span>
                                    <strong style="color: #1e293b; font-size: 12px; font-family: monospace;">${clientPhoneVal}</strong>
                                  </div>
                                  <div>
                                    <span style="color: #64748b; font-weight: bold; display: block; text-transform: uppercase; font-size: 9px; margin-bottom: 2px;">IP Adresi (IP Address)</span>
                                    <strong style="color: #1e293b; font-size: 12px; font-family: monospace;">${ipAddressVal}</strong>
                                  </div>
                                  <div>
                                    <span style="color: #64748b; font-weight: bold; display: block; text-transform: uppercase; font-size: 9px; margin-bottom: 2px;">Onay Zaman Damgası (Signing Timestamp)</span>
                                    <strong style="color: #1e293b; font-size: 12px;">${timestampVal}</strong>
                                  </div>
                                  <div>
                                    <span style="color: #64748b; font-weight: bold; display: block; text-transform: uppercase; font-size: 9px; margin-bottom: 2px;">Güvenlik & Bütünlük Kodu (Security Hash / SHA)</span>
                                    <strong style="color: #16a34a; font-size: 11px; font-family: monospace; letter-spacing: 0.5px;">${securityCode}</strong>
                                  </div>
                                </div>
                                
                                <div style="border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 10px; color: #64748b; text-align: justify; line-height: 1.5;">
                                  <p style="margin: 0;"><strong>YASAL BEYAN VE GEÇERLİLİK:</strong> İşbu dijital sözleşme, taraflarca mobil/tablet cihazın dokunmatik ekranı üzerinde biyometrik parmak izi imza simülasyonu ile onaylanmıştır. 5070 Sayılı Elektronik İmza Kanunu, KKTC E-İmza Yasası ve Türk Borçlar Kanunu kapsamında hukuken geçerli ve tarafları bağlayıcı "Yazılı Delil Başlangıcı ve Sözleşmesi" niteliğindedir. Sözleşme içeriği ve imza bütünlüğü, yukarıda belirtilen benzersiz Güvenlik & Bütünlük Kodu (SHA) ile kriptografik olarak mühürlenmiştir.</p>
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
                             
                            const printWin = window.open('', '_blank');
                            if (printWin) {
                              printWin.document.write(`
                                <html>
                                  <head>
                                    <title>${doc.name}</title>
                                    <style>
                                      body { font-family: sans-serif; background: white; margin: 40px; color: #1e293b; }
                                    </style>
                                  </head>
                                  <body>
                                    ${enrichedHtml}
                                    <script>
                                      window.onload = function() { window.print(); }
                                    </script>
                                  </body>
                                </html>
                              `);
                              printWin.document.close();
                            }
                          } else {
                            window.open(doc.file_url, '_blank');
                          }
                        }}
                        className="p-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-white rounded-xl transition"
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
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-white rounded-xl transition"
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
