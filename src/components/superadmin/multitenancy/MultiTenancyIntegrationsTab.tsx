import React from "react";
import { CreditCard, Store as StoreIcon, Zap } from "lucide-react";

interface MultiTenancyIntegrationsTabProps {
  configForm: any;
  setConfigForm: React.Dispatch<React.SetStateAction<any>>;
  isShopLpSelected: boolean;
}

export const MultiTenancyIntegrationsTab: React.FC<MultiTenancyIntegrationsTabProps> = ({
  configForm,
  setConfigForm,
  isShopLpSelected
}) => {
  return (
    <div className="space-y-4 pt-2">
      {/* 1. E-Fatura / E-Arşiv */}
      <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-emerald-500" />
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                Resmi E-Fatura / E-Arşiv (MySoft & GİB)
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Canlı GİB sorgusu, alıcı pkAlias ve satış faturası UBL oluşturma
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={Boolean(configForm.branding?.einvoice?.enabled)}
              onChange={(e) =>
                setConfigForm((prev: any) => ({
                  ...prev,
                  branding: {
                    ...(prev.branding || {}),
                    einvoice: {
                      ...(prev.branding?.einvoice || {}),
                      enabled: e.target.checked
                    }
                  }
                }))
              }
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {configForm.branding?.einvoice?.enabled && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Entegratör Kullanıcı Adı
              </label>
              <input
                type="text"
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                value={configForm.branding?.einvoice?.username || ""}
                onChange={(e) =>
                  setConfigForm((prev: any) => ({
                    ...prev,
                    branding: {
                      ...(prev.branding || {}),
                      einvoice: {
                        ...(prev.branding?.einvoice || {}),
                        username: e.target.value
                      }
                    }
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Entegratör Şifre / API Key
              </label>
              <input
                type="password"
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                value={configForm.branding?.einvoice?.password || ""}
                onChange={(e) =>
                  setConfigForm((prev: any) => ({
                    ...prev,
                    branding: {
                      ...(prev.branding || {}),
                      einvoice: {
                        ...(prev.branding?.einvoice || {}),
                        password: e.target.value
                      }
                    }
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Çalışma Ortamı
              </label>
              <select
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                value={configForm.branding?.einvoice?.environment || "test"}
                onChange={(e) =>
                  setConfigForm((prev: any) => ({
                    ...prev,
                    branding: {
                      ...(prev.branding || {}),
                      einvoice: {
                        ...(prev.branding?.einvoice || {}),
                        environment: e.target.value
                      }
                    }
                  }))
                }
              >
                <option value="test">Test / Sandbox Ortamı</option>
                <option value="production">Canlı GİB Üretim Ortamı</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 2. E-Mağaza / Pazaryeri (SADECE shopLP için Kesin İzolasyon) */}
      <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StoreIcon className="h-4 w-4 text-blue-500" />
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                E-Mağazalar & Pazaryeri Entegrasyonları (Trendyol, Hepsiburada, N11, Amazon)
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Stok ve fiyat aktarımı (SADECE shopLP Perakende mağazalarına özeldir)
              </p>
            </div>
          </div>
        </div>

        {!isShopLpSelected ? (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-300 font-medium">
            🛡️ <strong>Sektörel İzolasyon Güvencesi:</strong> Bu mağaza Emlak, Otomotiv veya HoReCa sektöründe olduğu için Pazaryeri modülü devre dışıdır ve izole edilmiştir.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-orange-600">Trendyol</span>
                <input
                  type="checkbox"
                  checked={Boolean(configForm.branding?.marketplaces?.trendyol?.enabled)}
                  onChange={(e) =>
                    setConfigForm((prev: any) => ({
                      ...prev,
                      branding: {
                        ...(prev.branding || {}),
                        marketplaces: {
                          ...(prev.branding?.marketplaces || {}),
                          trendyol: {
                            ...(prev.branding?.marketplaces?.trendyol || {}),
                            enabled: e.target.checked
                          }
                        }
                      }
                    }))
                  }
                />
              </div>
              {configForm.branding?.marketplaces?.trendyol?.enabled && (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="Satıcı ID (Supplier ID)"
                    className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border rounded"
                    value={configForm.branding?.marketplaces?.trendyol?.supplierId || ""}
                    onChange={(e) =>
                      setConfigForm((prev: any) => ({
                        ...prev,
                        branding: {
                          ...(prev.branding || {}),
                          marketplaces: {
                            ...(prev.branding?.marketplaces || {}),
                            trendyol: {
                              ...(prev.branding?.marketplaces?.trendyol || {}),
                              supplierId: e.target.value
                            }
                          }
                        }
                      }))
                    }
                  />
                </div>
              )}
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-600">Hepsiburada</span>
                <input
                  type="checkbox"
                  checked={Boolean(configForm.branding?.marketplaces?.hepsiburada?.enabled)}
                  onChange={(e) =>
                    setConfigForm((prev: any) => ({
                      ...prev,
                      branding: {
                        ...(prev.branding || {}),
                        marketplaces: {
                          ...(prev.branding?.marketplaces || {}),
                          hepsiburada: {
                            ...(prev.branding?.marketplaces?.hepsiburada || {}),
                            enabled: e.target.checked
                          }
                        }
                      }
                    }))
                  }
                />
              </div>
              {configForm.branding?.marketplaces?.hepsiburada?.enabled && (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="Merchant ID"
                    className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border rounded"
                    value={configForm.branding?.marketplaces?.hepsiburada?.merchantId || ""}
                    onChange={(e) =>
                      setConfigForm((prev: any) => ({
                        ...prev,
                        branding: {
                          ...(prev.branding || {}),
                          marketplaces: {
                            ...(prev.branding?.marketplaces || {}),
                            hepsiburada: {
                              ...(prev.branding?.marketplaces?.hepsiburada || {}),
                              merchantId: e.target.value
                            }
                          }
                        }
                      }))
                    }
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. TCMB Canlı Kur & Para Birimleri */}
      <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                TCMB Otomatik Döviz Kuru Senkronizasyonu (Forex Buying)
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                TCMB bülten saatlerinde (09:30, 15:45) çapraz kurların otomatik güncellenmesi
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={Boolean(configForm.branding?.currency_sync?.auto_tcmb !== false)}
            onChange={(e) =>
              setConfigForm((prev: any) => ({
                ...prev,
                branding: {
                  ...(prev.branding || {}),
                  currency_sync: {
                    ...(prev.branding?.currency_sync || {}),
                    auto_tcmb: e.target.checked
                  }
                }
              }))
            }
          />
        </div>
      </div>
    </div>
  );
};
