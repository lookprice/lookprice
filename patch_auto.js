import fs from 'fs';
let code = fs.readFileSync('src/components/ModernAutomotiveLayout.tsx', 'utf8');

// Add mobile filter state
if(!code.includes('const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);')) {
    code = code.replace(
        '  // Vehicle-specific share modal state',
        '  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);\n  // Vehicle-specific share modal state'
    );
}

const targetContainer = `        {/* Advanced Search Strip for Automotive */}
        {isSectionEnabled("search") && (
          <div className="-mt-12 relative z-30 w-full mb-24">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-2xl grid grid-cols-1 md:grid-cols-4 gap-6">`;

const replacementContainer = `        {/* Advanced Search Strip for Automotive */}
        {isSectionEnabled("search") && (
          <div className="-mt-12 relative z-30 w-full mb-12 md:mb-24">
            {/* Mobile Filter Button */}
            <div className="md:hidden flex justify-center w-full relative z-40">
                <button
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl shadow-xl flex items-center gap-2 font-black tracking-widest text-xs uppercase"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {lang === "tr" ? "Araç Filtrele" : "Filter Vehicles"}
                </button>
            </div>

            {/* Desktop Filters */}
            <div className="hidden md:grid bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-2xl grid-cols-4 gap-6">`;

code = code.replace(targetContainer, replacementContainer);

const targetFiltersEnd = `              })}
              <button 
                onClick={() => {
                  setActiveBrand(pendingBrand);
                  setActiveModel(pendingModel);
                  setActiveBudget(pendingBudget);
                  setActiveYear(pendingYear);
                }}
                className="col-span-1 md:col-span-4 mt-2 w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-colors shadow-lg active:scale-95"
              >
                {lang === "tr" ? "ARAÇ BUL" : "FIND VEHICLE"}
              </button>
            </div>
          </div>
        )}`;

const replacementFiltersEnd = `              })}
              <button 
                onClick={() => {
                  setActiveBrand(pendingBrand);
                  setActiveModel(pendingModel);
                  setActiveBudget(pendingBudget);
                  setActiveYear(pendingYear);
                }}
                className="col-span-4 mt-2 w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-colors shadow-lg active:scale-95"
              >
                {lang === "tr" ? "ARAÇ BUL" : "FIND VEHICLE"}
              </button>
            </div>
          </div>
        )}
        
        {/* Mobile Filters Modal */}
        <AnimatePresence>
          {isMobileFiltersOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileFiltersOpen(false)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] md:hidden"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] z-[201] md:hidden shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-xl z-10">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                    {lang === "tr" ? "Araç Filtrele" : "Filter Vehicles"}
                  </h3>
                  <button
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {["BRAND", "MODEL", "BUDGET", "YEAR"].map((filt, idx) => {
                    let displayTitle = filt;
                    let value = "all";
                    let onChange = (v: string) => {};
                    let options: { value: string; label: string }[] = [];
                    if (filt === "BRAND") {
                      displayTitle = lang === "tr" ? "MARKA" : "BRAND";
                      value = pendingBrand;
                      onChange = setPendingBrand;
                      options = [
                        { value: "all", label: lang === "tr" ? "Tümü" : "All" },
                        ...brands.map(v => ({ value: String(v), label: String(v) }))
                      ];
                    } else if (filt === "MODEL") {
                      displayTitle = lang === "tr" ? "MODEL" : "MODEL";
                      value = pendingModel;
                      onChange = setPendingModel;
                      options = [
                        { value: "all", label: lang === "tr" ? "Tümü" : "All" },
                        ...models.map(v => ({ value: String(v), label: String(v) }))
                      ];
                    } else if (filt === "BUDGET") {
                      displayTitle = lang === "tr" ? "BÜTÇE" : "BUDGET";
                      value = pendingBudget;
                      onChange = setPendingBudget;
                      options = budgetSpecs.ranges;
                    } else if (filt === "YEAR") {
                      displayTitle = lang === "tr" ? "MODEL YILI" : "YEAR";
                      value = pendingYear;
                      onChange = setPendingYear;
                      options = [
                        { value: "all", label: lang === "tr" ? "Tümü" : "All" },
                        ...yearsOptions.map(v => ({ value: String(v), label: String(v) }))
                      ];
                    }

                    return (
                      <div key={filt} className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {displayTitle}
                        </label>
                        <select
                          value={value}
                          onChange={(e) => onChange(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 appearance-none"
                        >
                          {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
                
                <div className="p-6 border-t border-slate-100 bg-white pb-safe">
                  <button 
                    onClick={() => {
                      setActiveBrand(pendingBrand);
                      setActiveModel(pendingModel);
                      setActiveBudget(pendingBudget);
                      setActiveYear(pendingYear);
                      setIsMobileFiltersOpen(false);
                    }}
                    className="w-full py-4 bg-amber-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-amber-600 transition-colors shadow-xl shadow-amber-500/20 active:scale-95"
                  >
                    {lang === "tr" ? "SONUÇLARI GÖSTER" : "SHOW RESULTS"}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>`;

code = code.replace(targetFiltersEnd, replacementFiltersEnd);
fs.writeFileSync('src/components/ModernAutomotiveLayout.tsx', code);
