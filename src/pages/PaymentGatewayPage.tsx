import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function PaymentGatewayPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const paymentPageUrl = location.state?.paymentPageUrl;

  useEffect(() => {
    if (paymentPageUrl) {
      // Modaldan, iframe'den, her şeyden tamamen bağımsız tam sayfa yönlendirme
      window.top.location.href = paymentPageUrl;
    } else {
      navigate('/checkout/error');
    }
  }, [paymentPageUrl, navigate]);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
      <p>Ödeme sayfasına yönlendiriliyorsunuz...</p>
    </div>
  );
}
