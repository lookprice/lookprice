import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  Truck, 
  ShieldCheck, 
  MessageCircle,
  Sparkles
} from "lucide-react";
import { Product, Store as StoreInfo } from "../../types";

interface BasketItem extends Product {
  quantity: number;
  selectedVariant?: any;
  selected_variant_name?: string;
  selected_variant_id?: any;
  cart_key?: string;
}

interface ShopDrawerCartProps {
  isOpen: boolean;
  onClose: () => void;
  basket: BasketItem[];
  setBasket: React.Dispatch<React.SetStateAction<BasketItem[]>>;
  basketTotal: number;
  basketSubtotal: number;
  basketShippingTotal: number;
  store: StoreInfo | null;
  lang: string;
  t: any;
  onCheckout: () => void;
}

export const ShopDrawerCart: React.FC<ShopDrawerCartProps> = ({
  isOpen,
  onClose,
  basket,
  setBasket,
  basketTotal,
  basketSubtotal,
  basketShippingTotal,
  store,
  lang,
  t,
  onCheckout
}) => {
  const currency = store?.currency || "TRY";
  const freeShippingThreshold = 1500;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - basketSubtotal);
  const progressPercent = Math.min(100, Math.round((basketSubtotal / freeShippingThreshold) * 100));

  const updateQuantity = (cartKey: string | undefined, id: number | string, delta: number) => {
    setBasket((prev) =>
      prev
        .map((item: any) => {
          const isMatch = cartKey ? item.cart_key === cartKey : item.id === id;
          if (isMatch) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as BasketItem[]
    );
  };

  const removeItem = (cartKey: string | undefined, id: number | string) => {
    setBasket((prev) =>
      prev.filter((item: any) => (cartKey ? item.cart_key !== cartKey : item.id !== id))
    );
  };

  const rawWa = store?.whatsapp_number;
  const waNumber = (!rawWa || rawWa === "905428655000") ? "905488902309" : rawWa;

  const handleWhatsAppOrder = () => {
    if (basket.length === 0) return;
    let message = `Merhaba ${store?.name || ""}, web siteniz üzerinden aşağıdaki sepeti sipariş vermek istiyorum:\n\n`;
    basket.forEach((item, idx) => {
      message += `${idx + 1}. ${item.name} ${item.selected_variant_name ? `(${item.selected_variant_name})` : ""} x ${item.quantity} Adet - ${(Number(item.price) * item.quantity).toFixed(2)} ${currency}\n`;
    });
    message += `\nToplam Tutar: ${basketTotal.toFixed(2)} ${currency}`;
    const url = `https://wa.me/${waNumber.replace(/[^0-9+]/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Container */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-slate-800"
            >
              {/* 1. Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-md">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                      {lang === "tr" ? "Alışveriş Sepetim" : "Shopping Cart"}
                    </h2>
                    <span className="text-xs font-bold text-slate-400">
                      {basket.reduce((sum, i) => sum + i.quantity, 0)} {lang === "tr" ? "ürün eklendi" : "items"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Free Shipping Progress Bar */}
              <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-extrabold mb-1.5">
                  <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-indigo-600" />
                    {remainingForFreeShipping === 0
                      ? (lang === "tr" ? "Tebrikler! Ücretsiz Kargo Kazandınız 🎉" : "Free Shipping Unlocked! 🎉")
                      : `${remainingForFreeShipping.toFixed(0)} ${currency} ${lang === "tr" ? "daha ekleyin, kargonuz bedava olsun!" : "more for free shipping!"}`}
                  </span>
                  <span className="text-indigo-600 font-mono">%{progressPercent}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
                  />
                </div>
              </div>

              {/* 2. Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {basket.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
                      <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                      {lang === "tr" ? "Sepetiniz henüz boş" : "Your cart is empty"}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xs mb-6">
                      {lang === "tr" ? "Öne çıkan ürünlerimize göz atarak sepetinizi doldurmaya başlayabilirsiniz." : "Discover our exclusive collections to add items to your cart."}
                    </p>
                    <button
                      onClick={onClose}
                      className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-black rounded-xl hover:bg-slate-800 transition-colors"
                    >
                      {lang === "tr" ? "Koleksiyonları İncele" : "Explore Collections"}
                    </button>
                  </div>
                ) : (
                  basket.map((item, idx) => (
                    <motion.div
                      key={item.cart_key || `${item.id}_${idx}`}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex gap-4 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 relative group"
                    >
                      {/* Thumbnail */}
                      <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-xl overflow-hidden shrink-0 border border-slate-200/60 dark:border-slate-700">
                        <img
                          src={item.selectedVariant?.image_url || item.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=80"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                              {item.name}
                            </h4>
                            <button
                              type="button"
                              onClick={() => removeItem(item.cart_key, item.id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-0.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Variant Badge */}
                          {item.selected_variant_name && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-md">
                              {item.selected_variant_name}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {(Number(item.price) * item.quantity).toFixed(2)} {currency}
                          </span>

                          {/* Quantity Selector */}
                          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.cart_key, item.id, -1)}
                              className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-black text-slate-900 dark:text-white">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.cart_key, item.id, 1)}
                              className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* 3. Footer & Checkout Actions */}
              {basket.length > 0 && (
                <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500 font-bold">
                      <span>{lang === "tr" ? "Ara Toplam" : "Subtotal"}</span>
                      <span>{basketSubtotal.toFixed(2)} {currency}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 font-bold">
                      <span>{lang === "tr" ? "Kargo Tutarı" : "Shipping"}</span>
                      <span>{basketShippingTotal === 0 ? (lang === "tr" ? "ÜCRETSİZ" : "FREE") : `${basketShippingTotal.toFixed(2)} ${currency}`}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>{lang === "tr" ? "Genel Toplam" : "Total"}</span>
                      <span className="text-base text-indigo-600 dark:text-indigo-400">
                        {basketTotal.toFixed(2)} {currency}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {/* Standard Secure Checkout Button */}
                    <button
                      type="button"
                      onClick={onCheckout}
                      className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-sm rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>{lang === "tr" ? "Güvenli Ödemeye Geç" : "Proceed to Checkout"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {/* WhatsApp Fast Order */}
                    {waNumber && (
                      <button
                        type="button"
                        onClick={handleWhatsAppOrder}
                        className="w-full py-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs rounded-xl hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                        <span>{lang === "tr" ? "WhatsApp İle Hızlı Sipariş Ver" : "Order via WhatsApp"}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
