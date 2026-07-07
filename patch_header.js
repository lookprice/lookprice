import fs from 'fs';
let code = fs.readFileSync('src/components/showcase/StoreHeader.tsx', 'utf8');

const target1 = `                      <button
                        onClick={() => {
                          navigate(getStorePath("/orders"));
                          setIsAccountMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 text-sm font-bold flex items-center gap-2 group transition-colors"
                      >
                        <Package className="w-4 h-4 text-gray-400 group-hover:text-gray-900" />{" "}
                        {lang === "tr" ? "Siparişlerim" : "My Orders"}
                      </button>`;

const replacement1 = `                      <button
                        onClick={() => {
                          navigate(getStorePath("/orders"));
                          setIsAccountMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 text-sm font-bold flex items-center gap-2 group transition-colors"
                      >
                        <Package className="w-4 h-4 text-gray-400 group-hover:text-gray-900" />{" "}
                        {lang === "tr" 
                          ? (store?.store_type === 'real_estate' || store?.store_type === 'motor_vehicle' ? "Taleplerim" : "Siparişlerim") 
                          : (store?.store_type === 'real_estate' || store?.store_type === 'motor_vehicle' ? "My Requests" : "My Orders")}
                      </button>`;

if (code.includes('Siparişlerim" : "My Orders"}')) {
  code = code.replace(target1, replacement1);
  fs.writeFileSync('src/components/showcase/StoreHeader.tsx', code);
}
