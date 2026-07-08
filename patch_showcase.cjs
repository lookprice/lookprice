const fs = require('fs');
const code = fs.readFileSync('src/pages/StoreShowcase.tsx', 'utf-8');

const componentCode = `
const CampaignCarousel = ({ 
  products, 
  lang, 
  isLuxury, 
  setSelectedProduct, 
  formatPrice, 
  store 
}: any) => {
  const [page, setPage] = useState(0);

  const campaignProducts = useMemo(() => {
    const isCampaign = (p: any) => p.labels?.includes("Kampanya") || p.labels?.includes("Fırsat");
    const camps = products.filter(isCampaign);
    return camps.length > 0 ? camps : products;
  }, [products]);

  const itemsPerPage = 4;
  const totalPages = Math.ceil(campaignProducts.length / itemsPerPage);

  useEffect(() => {
    if (totalPages <= 1) return;
    const interval = setInterval(() => {
      setPage(p => (p + 1) % totalPages);
    }, 3000);
    return () => clearInterval(interval);
  }, [totalPages]);

  const currentProducts = campaignProducts.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  return (
    <div className="relative w-full overflow-hidden min-h-[400px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full"
        >
          {currentProducts.map((product: any, idx: number) => (
            <div
              key={\`featured-\${product.id}-\${idx}\`}
              className="group relative cursor-pointer"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="aspect-[1/1] rounded-2xl overflow-hidden bg-white mb-8 relative shadow-sm group-hover:shadow-lg group-hover:-translate-y-2 transition-all duration-700 font-sans border border-slate-100">
                {product.old_price && (
                  <div className="absolute top-8 right-8 z-10 w-14 h-14 bg-white rounded-lg flex items-center justify-center text-red-600 text-xss font-semibold shadow-xl">
                    -{Math.round((1 - product.price / product.old_price) * 100)}%
                  </div>
                )}
                <img
                  src={product.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&auto=format&fit=crop"}
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-full object-contain p-6 transition-transform duration-1000 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-700" />
                <div className="absolute bottom-8 left-8 right-8 flex justify-center translate-y-20 group-hover:translate-y-0 transition-transform duration-700">
                  <button className="w-full py-4 bg-white text-slate-950 rounded-2xl font-semibold text-[10px] tracking-wide shadow-lg">
                    {lang === "tr" ? "İncele" : "View Details"}
                  </button>
                </div>
              </div>
              <div className="px-4 text-center">
                <h4 className={\`text-xsl text-slate-900 mb-2 truncate \${isLuxury ? "!font-sans !font-medium" : "font-semibold"}\`}>
                  {product.name}
                </h4>
                {(() => {
                  let labels: string[] = [];
                  if (Array.isArray(product.labels)) {
                    labels = product.labels;
                  } else if (typeof product.labels === "string") {
                    labels = (product.labels as string).replace(/[^a-zA-Z0-9çÇğĞışİÖöÜü\\s,]/g, "").split(",").map((s) => s.trim()).filter(Boolean);
                  }
                  if (labels.length === 0) return null;
                  return (
                    <div className="flex flex-wrap gap-1 justify-center mb-2">
                      {labels.map((label, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 text-[9px] uppercase font-black rounded-md tracking-wider">
                          {label}
                        </span>
                      ))}
                    </div>
                  );
                })()}
                <div className="flex items-center justify-center gap-3">
                  <span className="text-xsl font-semibold text-slate-900 font-sans tracking-tight">
                    {formatPrice(product.price, store?.currency || product.currency || "")}
                  </span>
                  {product.old_price && (
                    <span className="text-sm font-medium text-slate-400 line-through decoration-red-500/50 font-sans tracking-tight">
                      {formatPrice(product.old_price || 0, store?.currency || product.currency || "")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
`;

let newCode = code.replace(/const StoreShowcase: React\.FC/, componentCode + '\nconst StoreShowcase: React.FC');

// Then replace the grid code
const regex = /<div className="relative w-full overflow-hidden flex items-center -mx-4 px-4 md:-mx-8 md:px-8">[\s\S]*?<\/motion\.div>\s*<\/div>/;
newCode = newCode.replace(regex, `<CampaignCarousel products={products} lang={lang} isLuxury={isLuxury} setSelectedProduct={setSelectedProduct} formatPrice={formatPrice} store={store} />`);

// Replace the count header
const countRegex = /<span className="text-slate-900 font-semibold">\s*\{products\.length\}\s*<\/span>/;
newCode = newCode.replace(countRegex, `<span className="text-slate-900 font-semibold">{products.some(p => p.labels?.includes("Kampanya") || p.labels?.includes("Fırsat")) ? products.filter(p => p.labels?.includes("Kampanya") || p.labels?.includes("Fırsat")).length : Math.min(8, products.length)}</span>`);

fs.writeFileSync('src/pages/StoreShowcase.tsx', newCode);
console.log('Patched');
