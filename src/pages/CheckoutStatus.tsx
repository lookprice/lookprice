import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, ArrowLeft, ShoppingBag } from "lucide-react";

const CheckoutStatus: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const saleId = searchParams.get("saleId");
  const token = searchParams.get("token"); // PayPal Order ID
  const PayerID = searchParams.get("PayerID");
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState("");
  const [storeSlug, setStoreSlug] = useState<string>(slug || "");
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    // If we are in an iframe (e.g. Iyzico 3D secure or embedded form), redirect the parent window
    if (window !== window.top) {
      window.top.location.href = window.location.href;
      return;
    }

    const processPayment = async () => {
      // Check if this is a cancellation/error path
      if (window.location.pathname.includes('/checkout/cancel')) {
        setStatus('error');
        setMessage(searchParams.get("error") || "Ödeme işlemi iptal edildi veya bir hata oluştu.");
        if (saleId) {
          fetch(`/api/public/sales/${saleId}/status`)
            .then(res => res.json())
            .then(data => {
              if (data?.store_slug) setStoreSlug(data.store_slug);
              setOrderDetails(data);
            })
            .catch(() => {});
        }
        return;
      }

      if (!saleId) {
        setStatus('error');
        setMessage("Sipariş numarası bulunamadı.");
        return;
      }

      // Fetch sale details for store slug and receipt info
      try {
        const saleInfoRes = await fetch(`/api/public/sales/${saleId}/status`);
        const saleInfo = await saleInfoRes.json();
        if (saleInfo?.store_slug) {
          setStoreSlug(saleInfo.store_slug);
          // Clear basket from localStorage for this store
          localStorage.removeItem(`basket_${saleInfo.store_slug}`);
          localStorage.removeItem(`store_basket_${saleInfo.store_id}`);
        }
        setOrderDetails(saleInfo);

        // Also if customer is logged in, empty backend cart
        try {
          const storedCustomer = localStorage.getItem("customer");
          if (storedCustomer && saleInfo?.store_id) {
            const parsed = JSON.parse(storedCustomer);
            if (parsed?.id) {
              fetch('/api/public/customers/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId: parsed.id, storeId: saleInfo.store_id, items: [] })
              }).catch(() => {});
            }
          }
        } catch (e) {}
      } catch (err) {
        console.warn("Could not fetch sale status info:", err);
      }

      // If it's a PayPal return
      if (token && PayerID) {
        try {
          const res = await fetch('/api/public/paypal/capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: token, saleId })
          });
          const data = await res.json();
          if (data.success) {
            setStatus('success');
          } else {
            setStatus('error');
            setMessage(data.error || "Ödeme onaylanırken bir hata oluştu.");
          }
        } catch (err) {
          setStatus('error');
          setMessage("PayPal ödemesi işlenirken bir hata oluştu.");
        }
      } else {
        // For other providers (Iyzico, Payoneer) the status is updated via webhooks
        // We just show success if we reached this page (the backend redirects here on success)
        setStatus('success');
      }
    };

    processPayment();
  }, [saleId, token, PayerID, searchParams, slug]);

  const handleReturnToStore = () => {
    if (orderDetails?.custom_domain && window.location.hostname === orderDetails.custom_domain) {
      navigate('/');
    } else if (storeSlug) {
      navigate(`/s/${storeSlug}`);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-gray-100">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900">Ödeme İşleniyor</h2>
            <p className="text-gray-500 text-sm">Lütfen bekleyiniz, ödemeniz doğrulanıyor...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Sipariş Başarılı!</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Ödemeniz ve siparişiniz başarıyla alındı. Sipariş sürecinizi üye profilinizden veya sipariş takip sayfasından takip edebilirsiniz.
            </p>
            {orderDetails && (
              <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left my-2 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Sipariş No:</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">#{orderDetails.id}</span>
                </div>
                {orderDetails.store_name && (
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>Mağaza:</span>
                    <span className="font-semibold text-slate-800">{orderDetails.store_name}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs text-slate-500 pt-1 border-t border-slate-200">
                  <span>Toplam Tutar:</span>
                  <span className="font-black text-slate-900 text-sm">
                    {Number(orderDetails.total_amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {orderDetails.currency || 'TL'}
                  </span>
                </div>
              </div>
            )}
            <button 
              onClick={handleReturnToStore}
              className="mt-4 w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
            >
              <ShoppingBag className="w-5 h-5" />
              Mağazaya Dön
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-2">
              <XCircle className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Ödeme Alınamadı</h2>
            <p className="text-gray-500 text-sm leading-relaxed">{message || "Ödeme işlemi sırasında bir sorun oluştu. Lütfen tekrar deneyiniz."}</p>
            <button 
              onClick={handleReturnToStore}
              className="mt-4 w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
              Mağazaya Dön ve Tekrar Dene
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutStatus;
