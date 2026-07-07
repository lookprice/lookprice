import fs from 'fs';
let code = fs.readFileSync('src/components/showcase/StoreProfile.tsx', 'utf8');

const target1 = `            <h2 className="text-3xl font-bold text-gray-900 tracking-tighter">
              {lang === "tr" ? "Siparişlerim" : "My Orders"}
            </h2>
            <div className="px-4 py-1.5 bg-gray-100 rounded-lg text-[10px] font-semibold text-gray-500 tracking-wide">
              {orders.length} {lang === "tr" ? "SİPARİŞ" : "ORDERS"}
            </div>`;

const replacement1 = `            <h2 className="text-3xl font-bold text-gray-900 tracking-tighter">
              {lang === "tr" 
                ? (store?.store_type === 'real_estate' || store?.store_type === 'motor_vehicle' ? "Taleplerim" : "Siparişlerim") 
                : (store?.store_type === 'real_estate' || store?.store_type === 'motor_vehicle' ? "My Requests" : "My Orders")}
            </h2>
            <div className="px-4 py-1.5 bg-gray-100 rounded-lg text-[10px] font-semibold text-gray-500 tracking-wide">
              {orders.length} {lang === "tr" 
                ? (store?.store_type === 'real_estate' || store?.store_type === 'motor_vehicle' ? "KAYIT" : "SİPARİŞ") 
                : (store?.store_type === 'real_estate' || store?.store_type === 'motor_vehicle' ? "RECORDS" : "ORDERS")}
            </div>`;

code = code.replace(target1, replacement1);

const target2 = `              <p className="text-gray-500 font-bold">
                {lang === "tr"
                  ? "Siparişler yükleniyor..."
                  : "Loading orders..."}
              </p>`;

const replacement2 = `              <p className="text-gray-500 font-bold">
                {lang === "tr"
                  ? (store?.store_type === 'real_estate' || store?.store_type === 'motor_vehicle' ? "Talepler yükleniyor..." : "Siparişler yükleniyor...")
                  : (store?.store_type === 'real_estate' || store?.store_type === 'motor_vehicle' ? "Loading requests..." : "Loading orders...")}
              </p>`;

code = code.replace(target2, replacement2);

const target3 = `                        <p className="text-sm font-semibold text-gray-900">
                          {order.items_count || order.items?.length || 1}{" "}
                          {lang === "tr" ? "Ürün" : "Items"}
                        </p>`;

const replacement3 = `                        <p className="text-sm font-semibold text-gray-900">
                          {order.items_count || order.items?.length || 1}{" "}
                          {lang === "tr" 
                            ? (store?.store_type === 'real_estate' ? "İlan" : store?.store_type === 'motor_vehicle' ? "Araç" : "Ürün") 
                            : (store?.store_type === 'real_estate' ? "Listing" : store?.store_type === 'motor_vehicle' ? "Vehicle" : "Items")}
                        </p>`;

code = code.replace(target3, replacement3);

const target4 = `                {lang === "tr" ? "Henüz bir siparişiniz bulunmuyor." : "You don't have any orders yet."}`;

const replacement4 = `                {lang === "tr" 
                  ? (store?.store_type === 'real_estate' || store?.store_type === 'motor_vehicle' ? "Henüz bir talebiniz bulunmuyor." : "Henüz bir siparişiniz bulunmuyor.") 
                  : (store?.store_type === 'real_estate' || store?.store_type === 'motor_vehicle' ? "You don't have any requests yet." : "You don't have any orders yet.")}`;

code = code.replace(target4, replacement4);

fs.writeFileSync('src/components/showcase/StoreProfile.tsx', code);
