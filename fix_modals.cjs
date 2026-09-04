const fs = require('fs');
let content = fs.readFileSync('src/pages/StoreDashboard/DashboardModals.tsx', 'utf8');

// 1. Remove the injected code from QR modal
const badInjectionStart = `              {/* Status Update Actions for Web Sales */}`;
const badInjectionEnd = `      {/* Purchase Invoice Details Modal */}`;
const idxStart = content.indexOf(badInjectionStart);
if (idxStart !== -1) {
    const idxEnd = content.indexOf(badInjectionEnd, idxStart);
    if (idxEnd !== -1) {
        // We also need to restore the closing tags of the QR modal
        content = content.substring(0, idxStart) + `            </div>\n          </motion.div>\n        </div>\n      )}\n\n` + content.substring(idxEnd);
    }
}

// 2. Add it to the Sale details modal
const saleModalEndTarget = `              </div>\n            </div>\n          </motion.div>\n        </div>\n      )}\n\n      {/* Quotation Details Modal */}`;
const saleModalEndIdx = content.indexOf(`{/* Quotation Details Modal */}`);

if (saleModalEndIdx !== -1) {
    const replacement = `
              {/* Status Update Actions for Web Sales */}
              {selectedSale.status !== 'cancelled' && (
                <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                  {selectedSale.status === 'pending' && (
                    <button 
                      onClick={async () => {
                        try {
                          await api.prepareSale(selectedSale.id);
                          if (handleSaleSuccess) handleSaleSuccess(selectedSale.id);
                          else window.location.reload();
                        } catch (e: any) { alert(e.message || "Hata"); }
                      }}
                      className="px-4 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 text-xs font-bold rounded-lg transition-colors"
                    >
                      {lang === 'tr' ? 'Hazırlanıyor Olarak İşaretle' : 'Mark as Preparing'}
                    </button>
                  )}
                  {(selectedSale.status === 'pending' || selectedSale.status === 'processing') && (
                    <button 
                      onClick={async () => {
                        try {
                          await api.updateSaleStatus(selectedSale.id, { status: 'shipped' });
                          if (handleSaleSuccess) handleSaleSuccess(selectedSale.id);
                          else window.location.reload();
                        } catch (e: any) { alert(e.message || "Hata"); }
                      }}
                      className="px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-xs font-bold rounded-lg transition-colors"
                    >
                      {lang === 'tr' ? 'Kargoya Verildi Yap' : 'Mark as Shipped'}
                    </button>
                  )}
                  {selectedSale.status === 'shipped' && (
                    <button 
                      onClick={async () => {
                        try {
                          await api.deliverSale(selectedSale.id);
                          if (handleSaleSuccess) handleSaleSuccess(selectedSale.id);
                          else window.location.reload();
                        } catch (e: any) { alert(e.message || "Hata"); }
                      }}
                      className="px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-bold rounded-lg transition-colors"
                    >
                      {lang === 'tr' ? 'Teslim Edildi Yap' : 'Mark as Delivered'}
                    </button>
                  )}
                  {/* Create Invoice Button */}
                  {!selectedSale.sales_invoice_id && (
                    <button 
                      onClick={async () => {
                        try {
                          await api.post(\`/api/store/sales/\${selectedSale.id}/create-invoice\`, {});
                          alert(lang === 'tr' ? 'Fatura başarıyla oluşturuldu.' : 'Invoice created successfully.');
                          if (handleSaleSuccess) handleSaleSuccess(selectedSale.id);
                          else window.location.reload();
                        } catch (e: any) { alert(e.message || "Hata"); }
                      }}
                      className="px-4 py-2 bg-slate-900 text-white hover:bg-black text-xs font-bold rounded-lg transition-colors ml-auto"
                    >
                      {lang === 'tr' ? 'Satış Faturasına Dönüştür' : 'Convert to Invoice'}
                    </button>
                  )}
                </div>
              )}
`;
    // Find the end of the sale modal which is before the Quotation Modal
    const beforeQuotation = content.substring(0, saleModalEndIdx);
    const lastClosingDivs = beforeQuotation.lastIndexOf(`</div>\n          </motion.div>\n        </div>\n      )}`);
    if (lastClosingDivs !== -1) {
        content = content.substring(0, lastClosingDivs) + replacement + `            </div>\n          </motion.div>\n        </div>\n      )}\n\n      ` + content.substring(saleModalEndIdx);
    } else {
        console.log("Could not find closing tags before quotation modal");
    }
}

fs.writeFileSync('src/pages/StoreDashboard/DashboardModals.tsx', content);
console.log("Done patching");
