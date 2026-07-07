import fs from 'fs';
let code = fs.readFileSync('src/components/ModernRealEstateLayout.tsx', 'utf8');

if (!code.includes('const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);')) {
    code = code.replace(
        '  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(true);',
        '  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(true);\n  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);'
    );
}

const targetContainer = `      <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 pb-32">
        {/* Advanced Search Strip */}
        {isSectionEnabled("search") && (
          <div className="-mt-12 relative z-30 w-full mb-24">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden">
              <div 
                className="p-6 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors" 
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              >`;

const replacementContainer = `      <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 pb-32">
        {/* Advanced Search Strip */}
        {isSectionEnabled("search") && (
          <div className="-mt-12 relative z-30 w-full mb-12 md:mb-24">
            {/* Mobile Filter Button */}
            <div className="md:hidden flex justify-center w-full relative z-40">
                <button
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl shadow-xl flex items-center gap-2 font-black tracking-widest text-xs uppercase"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {lang === "tr" ? "Filtrele" : "Filters"}
                </button>
            </div>

            {/* Desktop Filters */}
            <div className="hidden md:block bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden">
              <div 
                className="p-6 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors" 
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              >`;

if (code.includes(targetContainer)) {
    code = code.replace(targetContainer, replacementContainer);
}

const targetFiltersEnd = `              </div>
            </div>
          </div>
        )}`;

const replacementFiltersEnd = `              </div>
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
                    {lang === "tr" ? "Gayrimenkul Filtrele" : "Filter Properties"}
                  </h3>
                  <button
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {["LOCATION", "TYPE", "BUDGET", "ROOMS"].map((filt, idx) => {
                    let displayTitle = filt;
                    let value = "all";
                    let onChange = (v: string) => {};
                    let options: { value: string; label: string }[] = [];
                    
                    if (filt === "LOCATION") {
                      displayTitle = lang === "tr" ? "LOKASYON" : "LOCATION";
                      value = pendingLocation;
                      onChange = setPendingLocation;
                      options = [
                        { value: "all", label: lang === "tr" ? "Tümü" : "All" },
                        ...locations.map(v => ({ value: String(v), label: String(v) }))
                      ];
                    } else if (filt === "TYPE") {
                      displayTitle = lang === "tr" ? "TÜR" : "TYPE";
                      value = pendingType;
                      onChange = setPendingType;
                      options = [
                        { value: "all", label: lang === "tr" ? "Tümü" : "All" },
                        ...types.map(v => {
                          let displayLabel = String(v);
                          if (lang === "tr") {
                            if (displayLabel === "sale") displayLabel = "Satılık";
                            if (displayLabel === "rent") displayLabel = "Kiralık";
                          }
                          return { value: String(v), label: displayLabel };
                        })
                      ];
                    } else if (filt === "BUDGET") {
                      displayTitle = lang === "tr" ? "BÜTÇE" : "BUDGET";
                      value = pendingBudget;
                      onChange = setPendingBudget;
                      options = budgetSpecs.ranges;
                    } else if (filt === "ROOMS") {
                      displayTitle = lang === "tr" ? "ODA SAYISI" : "ROOMS";
                      value = pendingRooms;
                      onChange = setPendingRooms;
                      options = [
                        { value: "all", label: lang === "tr" ? "Tümü" : "All" },
                        ...roomsOptions.map(v => ({ value: String(v), label: String(v) }))
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
                          className="w-full bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none"
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
                      setActiveLocation(pendingLocation);
                      setActiveType(pendingType);
                      setActiveBudget(pendingBudget);
                      setActiveRooms(pendingRooms);
                      setIsMobileFiltersOpen(false);
                    }}
                    className="w-full py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-colors shadow-xl shadow-indigo-600/20 active:scale-95"
                  >
                    {lang === "tr" ? "SONUÇLARI GÖSTER" : "SHOW RESULTS"}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>`;

if (code.includes(targetFiltersEnd)) {
    code = code.replace(targetFiltersEnd, replacementFiltersEnd);
}

fs.writeFileSync('src/components/ModernRealEstateLayout.tsx', code);
