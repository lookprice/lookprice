import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { motion } from "motion/react";
import { ShoppingBasket, CheckCircle2 } from "lucide-react";

export default function DigitalMenuPage() {
  const { storeId, tableId } = useParams();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!storeId) return;
      try {
        const [storeRes, productsRes] = await Promise.all([
          api.getBranding(Number(storeId)),
          api.getProducts("", Number(storeId), false)
        ]);
        setStore(storeRes);
        setProducts(Array.isArray(productsRes) ? productsRes : []);
      } catch (error) {
        console.error("Fetch digital menu error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [storeId]);

  const addToCart = (product: any) => {
    setCart(prev => [...prev, product]);
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    try {
      const orderData = {
        storeId: Number(storeId),
        tableNumber: tableId,
        items: cart.map(p => ({ productId: p.id, price: p.price, quantity: 1 })),
        total: cart.reduce((sum, p) => sum + p.price, 0),
        status: 'pending'
      };
      await api.createPublicPosSale(orderData, Number(storeId));
      setCart([]);
      alert("Siparişiniz başarıyla mutfağa iletildi.");
    } catch (error) {
      console.error("Order error:", error);
      alert("Sipariş verilirken bir hata oluştu.");
    }
  };

  if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;
  if (!store) return <div className="p-8 text-center">Mağaza bulunamadı.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <header className="bg-white p-4 rounded-2xl shadow-sm mb-4 flex items-center gap-4">
        {store.logo_url && <img src={store.logo_url} alt={store.name} className="h-12 w-12 rounded-full object-cover" />}
        <div>
          <h1 className="text-xl font-bold">{store.name}</h1>
          <p className="text-sm text-gray-500">Masa: {tableId}</p>
        </div>
      </header>
      
      <div className="grid grid-cols-2 gap-4">
        {products.map(product => (
          <div key={product.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-24 object-cover rounded-lg mb-2" />}
            <h3 className="font-bold text-sm flex-grow">{product.name}</h3>
            <div className="flex justify-between items-center mt-2">
              <p className="text-indigo-600 font-bold text-sm">{product.price} ₺</p>
              <button 
                onClick={() => addToCart(product)}
                className="bg-indigo-600 text-white p-2 rounded-lg text-xs"
              >
                + Ekle
              </button>
            </div>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-4 left-4 right-4 bg-white p-4 rounded-2xl shadow-lg border border-indigo-100 flex justify-between items-center"
        >
          <div className="flex items-center gap-2">
            <ShoppingBasket className="h-6 w-6 text-indigo-600" />
            <span className="font-bold">{cart.length} Ürün</span>
          </div>
          <button 
            onClick={placeOrder}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Siparişi Tamamla
          </button>
        </motion.div>
      )}
    </div>
  );
}
