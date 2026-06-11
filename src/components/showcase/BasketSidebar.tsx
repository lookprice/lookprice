import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBasket, MapPin, Package, Minus, Plus } from 'lucide-react';

interface BasketSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  basket: any[];
  setBasket: (val: any) => void;
  basketCount: number;
  basketItemPrices: Record<string, number>;
  basketSubtotal: number;
  basketShippingTotal: number;
  basketTotal: number;
  store: any;
  t: any;
  onCheckout: () => void;
  theme?: {
    primaryColor?: string;
  };
}

export const BasketSidebar: React.FC<BasketSidebarProps> = ({
  isOpen,
  onClose,
  basket,
  setBasket,
  basketCount,
  basketItemPrices,
  basketSubtotal,
  basketShippingTotal,
  basketTotal,
  store,
  t,
  onCheckout,
  theme
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[101]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="absolute top-0 right-0 bottom-0 w-full sm:w-[500px] bg-white shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="flex-1 flex flex-col min-h-0 bg-gray-50/50">
            {/* Header */}
            <div className="p-8 border-b bg-white flex items-center justify-between shrink-0 shadow-sm relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 flex items-center justify-center rounded-2xl border border-gray-100 shadow-sm">
                  <ShoppingBasket className="w-6 h-6 text-gray-900" />
                </div>
                <div>
                  <h2 className="text-xsl font-semibold tracking-normal text-gray-900">
                    {t.dashboard.cart}
                  </h2>
                  <p className="text-gray-500 text-xss font-bold tracking-wide mt-1">
                    {basketCount} {t.dashboard.product}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all border border-gray-100 shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-8">
              {basket.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 bg-gray-100 flex items-center justify-center rounded-3xl mb-6 shadow-sm border border-gray-200">
                    <ShoppingBasket className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xsl font-semibold text-gray-900">
                    {t.dashboard.emptyBasket}
                  </h3>
                  <p className="text-gray-500 mt-2 max-w-[200px]">
                    {t.dashboard.startShopping}
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {basket.map((item) => (
                    <div key={item.id} className="flex gap-6 group">
                      <div className="w-24 h-24 shrink-0 rounded-2xl bg-white border shadow-sm border-gray-100 overflow-hidden relative">
                        {item.image_url || item.images?.[0] ? (
                          <img
                            src={item.image_url || item.images?.[0]}
                            alt={item.title || item.name}
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center space-y-2 bg-gray-50">
                            <ShoppingBasket className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                        <button
                          onClick={() => {
                            setBasket((prev: any[]) =>
                              prev.filter((i: any) => i.id !== item.id)
                            );
                          }}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex-1 min-w-0">
                        {item.branch_name && (
                           <div className="flex items-center gap-1.5 mb-1.5">
                             <MapPin className="w-3.5 h-3.5 text-gray-400" />
                             <span className="text-xss font-bold text-gray-500 tracking-wide">{item.branch_name}</span>
                           </div>
                        )}
                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">
                          {item.title || item.name}
                        </h4>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-2 py-1.5 shadow-sm">
                            <button
                              onClick={() => {
                                setBasket((prev: any[]) => {
                                  const idx = prev.findIndex((i: any) => i.id === item.id);
                                  if (idx === -1) return prev;
                                  const newB = [...prev];
                                  if (newB[idx].quantity > 1) {
                                    newB[idx].quantity -= 1;
                                  } else {
                                    newB.splice(idx, 1);
                                  }
                                  return newB;
                                });
                              }}
                              className="w-6 h-6 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors border border-gray-100"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-semibold w-4 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => {
                                setBasket((prev: any[]) => {
                                  const idx = prev.findIndex((i: any) => i.id === item.id);
                                  if (idx === -1) return prev;
                                  const newB = [...prev];
                                  newB[idx].quantity += 1;
                                  return newB;
                                });
                              }}
                              className="w-6 h-6 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors border border-gray-100"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span
                            className="text-lg font-semibold whitespace-nowrap"
                            style={{ color: theme?.primaryColor || "#000" }}
                          >
                            {(basketItemPrices[item.id] || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}{" "}
                            {store?.currency || "TL"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {basket.length > 0 && (
              <div className="p-8 border-t bg-gray-50 flex flex-col gap-6 shrink-0 z-20 sticky bottom-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-gray-500 text-sm font-bold tracking-wide">
                    <span>{t.dashboard.subtotal}</span>
                    <span>
                      {basketSubtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}{" "}
                      {store?.currency || "TL"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-green-600 text-sm font-bold tracking-wide">
                    <span className="flex items-center gap-2">
                       <Package className="w-4 h-4" />
                       {t.dashboard.shipping}
                    </span>
                    <span>
                      {basketShippingTotal > 0
                        ? `${basketShippingTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${store?.currency || "TL"}`
                        : t.dashboard.freeShipping}
                    </span>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900 font-semibold tracking-wide">
                        {t.dashboard.total}
                      </span>
                      <span
                        className="text-3xl font-semibold tracking-tight"
                        style={{ color: theme?.primaryColor || "#000" }}
                      >
                        {basketTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}{" "}
                        {store?.currency || "TL"}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onCheckout}
                  className="w-full py-5 rounded-2xl text-white font-semibold text-sm hover:opacity-90 shadow-2xl transition-all hover:scale-[0.98] active:scale-95"
                  style={{ backgroundColor: theme?.primaryColor || "#000" }}
                >
                  {t.dashboard.checkout}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
