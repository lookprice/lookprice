import fs from 'fs';
let code = fs.readFileSync('src/pages/StoreShowcase.tsx', 'utf8');

const targetMenu = `                        <button
                          onClick={() => navigate(\`/s/\${slug}/orders\`)}
                          className={\`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-semibold text-sm transition-all \${isOrdersView ? "bg-gray-900 text-white shadow-xl" : "text-gray-500 hover:bg-white"}\`}
                        >
                          <ShoppingBag className="w-5 h-5" />
                          {lang === "tr" ? "Siparişlerim" : "My Orders"}
                        </button>
                        <button
                          onClick={() => navigate(\`/s/\${slug}/return\`)}
                          className={\`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-semibold text-sm transition-all \${isReturnView ? "bg-gray-900 text-white shadow-xl" : "text-gray-500 hover:bg-white"}\`}
                        >
                          <RotateCcw className="w-5 h-5" />
                          {lang === "tr"
                            ? "İade Taleplerim"
                            : "Return Requests"}
                        </button>`;

const replacementMenu = `                        <button
                          onClick={() => navigate(\`/s/\${slug}/orders\`)}
                          className={\`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-semibold text-sm transition-all \${isOrdersView ? "bg-gray-900 text-white shadow-xl" : "text-gray-500 hover:bg-white"}\`}
                        >
                          <ShoppingBag className="w-5 h-5" />
                          {lang === "tr" 
                            ? (store?.store_type === 'real_estate' || store?.store_type === 'motor_vehicle' ? "Taleplerim" : "Siparişlerim")
                            : (store?.store_type === 'real_estate' || store?.store_type === 'motor_vehicle' ? "My Requests" : "My Orders")}
                        </button>
                        {store?.store_type !== 'real_estate' && store?.store_type !== 'motor_vehicle' && (
                          <button
                            onClick={() => navigate(\`/s/\${slug}/return\`)}
                            className={\`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-semibold text-sm transition-all \${isReturnView ? "bg-gray-900 text-white shadow-xl" : "text-gray-500 hover:bg-white"}\`}
                          >
                            <RotateCcw className="w-5 h-5" />
                            {lang === "tr"
                              ? "İade Taleplerim"
                              : "Return Requests"}
                          </button>
                        )}`;

code = code.replace(targetMenu, replacementMenu);
fs.writeFileSync('src/pages/StoreShowcase.tsx', code);
