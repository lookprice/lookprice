import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from "lucide-react";
import { api } from "../services/api";

const CheckoutStatus: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const saleId = searchParams.get("saleId");
  const token = searchParams.get("token"); // PayPal Order ID
  const PayerID = searchParams.get("PayerID");
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState("");

  useEffect(() => {
    const processPayment = async () => {
      if (!saleId) {
        setStatus('error');
        setMessage("Sipariş numarası bulunamadı.");
        return;
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
  }, [saleId, token, PayerID]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900">Ödeme İşleniyor</h2>
            <p className="text-gray-500">Lütfen bekleyiniz, ödemeniz doğrulanıyor...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-gray-900">Sipariş Başarılı!</h2>
            <p className="text-gray-500">Siparişiniz başarıyla alındı ve işleme konuldu. Teşekkür ederiz!</p>
            <button 
              onClick={() => navigate(`/s/${slug}`)}
              className="mt-6 w-full py-4 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Mağazaya Dön
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-2">
              <XCircle className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-gray-900">Ödeme Başarısız</h2>
            <p className="text-gray-500">{message || "Ödeme işlemi sırasında bir sorun oluştu. Lütfen tekrar deneyiniz."}</p>
            <button 
              onClick={() => navigate(`/s/${slug}`)}
              className="mt-6 w-full py-4 bg-gray-900 text-white rounded-2xl font-bold"
            >
              Mağazaya Dön ve Tekrar Dene
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutStatus;
