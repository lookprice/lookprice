import React from 'react';

interface ShippingSlipProps {
  sale: any;
  store: any;
}

const ShippingSlip = React.forwardRef<HTMLDivElement, ShippingSlipProps>(({ sale, store }, ref) => {
  return (
    <div ref={ref} className="p-8 bg-white text-black">
      <div className="border-b-2 border-black pb-4 mb-4">
        <h1 className="text-3xl font-bold">{store?.store_name || 'Mağaza'}</h1>
        <p className="text-sm">Kargo Fişi</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <h2 className="font-bold text-lg">Müşteri Bilgileri:</h2>
          <p className="font-semibold">{sale.customer_name}</p>
          <p>{sale.customer_phone}</p>
          <p className="text-sm">{sale.customer_address}</p>
        </div>
        <div className="text-right">
          <p><strong>Sipariş No:</strong> #{sale.id}</p>
          <p><strong>Tarih:</strong> {new Date(sale.created_at).toLocaleDateString('tr-TR')}</p>
        </div>
      </div>

      <table className="w-full border-collapse border border-black mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-2 text-left">Ürün</th>
            <th className="border border-black p-2 text-center">Adet</th>
          </tr>
        </thead>
        <tbody>
          {sale.items?.map((item: any, index: number) => (
            <tr key={index}>
              <td className="border border-black p-2">{item.product_name}</td>
              <td className="border border-black p-2 text-center">{Math.floor(Number(item.quantity))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="text-center text-sm mt-8">
        <p>Bizi tercih ettiğiniz için teşekkürler!</p>
      </div>
    </div>
  );
});

export default ShippingSlip;
