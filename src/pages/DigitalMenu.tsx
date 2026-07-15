import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";

export default function DigitalMenuPage() {
  const { storeId, tableId } = useParams();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;
  if (!store) return <div className="p-8 text-center">Mağaza bulunamadı.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <header className="bg-white p-4 rounded-2xl shadow-sm mb-4 flex items-center gap-4">
        {store.logo_url && <img src={store.logo_url} alt={store.name} className="h-12 w-12 rounded-full object-cover" />}
        <div>
          <h1 className="text-xl font-bold">{store.name}</h1>
          <p className="text-sm text-gray-500">Masa: {tableId}</p>
        </div>
      </header>
      
      <div className="grid grid-cols-2 gap-4">
        {products.map(product => (
          <div key={product.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
            {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-24 object-cover rounded-lg mb-2" />}
            <h3 className="font-bold text-sm">{product.name}</h3>
            <p className="text-indigo-600 font-bold text-sm">{product.price} ₺</p>
          </div>
        ))}
      </div>
    </div>
  );
}
