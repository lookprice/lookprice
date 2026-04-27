import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, AlertCircle } from 'lucide-react';

export default function DirectCheckoutRedirect() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const initCheckout = async () => {
      try {
        let id = searchParams.get('id') || searchParams.get('barcode');
        let quantityStr = searchParams.get('quantity') || searchParams.get('qty') || '1';

        // Check if Facebook dynamic variables weren't replaced
        if (id && (id.includes('product.id') || id.includes('{{'))) id = null;
        if (quantityStr && (quantityStr.includes('quantity') || quantityStr.includes('{{'))) quantityStr = '1';

        const fbProducts = searchParams.get('products');
        if (fbProducts) {
          const firstProduct = fbProducts.split(',')[0];
          const parts = firstProduct.split(':');
          
          let parsedId = parts[0];
          // Strip quotes or special characters if any
          if (parsedId) {
            parsedId = parsedId.replace(/['"]/g, '').trim();
          }

          // ALWAYS prioritize the ID from Facebook's `products` query param if present
          if (parsedId) id = parsedId;
          
          if (parts.length > 1) quantityStr = parts[1];
        }

        const quantity = parseInt(quantityStr, 10) || 1;

        if (!id) {
          setError('Product ID is missing from URL parameters.');
          return;
        }

        // Fetch store details to get storeId and currency
        const storeRes = await axios.get(`/api/public/store/${slug}`);
        const store = storeRes.data;

        // Fetch product details
        // Note: For public API, we might need to get all products and find it
        const productsRes = await axios.get(`/api/public/store/${slug}/products`);
        const product = productsRes.data.find((p: any) => p.barcode === id || String(p.id) === id);

        if (!product) {
          setError('Product not found in this store.');
          return;
        }

        const priceToUse = product.is_web_sale && product.price_2 > 0 ? product.price_2 : product.price;
        const currencyToUse = product.is_web_sale && product.price_2_currency ? product.price_2_currency : product.currency;

        const basketItem = {
          ...product,
          quantity: quantity
        };

        const total = priceToUse * quantity;

        // Redirect to public guest checkout
        navigate(`/s/${slug}/checkout`, {
          state: {
            basket: [basketItem],
            storeId: store.id,
            total: total,
            currency: currencyToUse,
            storeName: store.name
          },
          replace: true
        });

      } catch (err: any) {
        console.error("Direct checkout completely failed:", err);
        setError('Failed to initiate checkout link.');
      }
    };

    initCheckout();
  }, [slug, searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow max-w-sm w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Checkout Error</h2>
          <p className="text-gray-600 text-sm">{error}</p>
          <button 
            onClick={() => navigate(`/s/${slug}`)}
            className="mt-6 w-full py-2 bg-blue-600 text-white rounded font-medium"
          >
            Go back to Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Preparing checkout...</p>
      </div>
    </div>
  );
}
