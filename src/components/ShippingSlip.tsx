import React from 'react';

interface ShippingSlipProps {
  sale: any;
  store: any;
}

const ShippingSlip = React.forwardRef<HTMLDivElement, ShippingSlipProps>(({ sale, store }, ref) => {
  return (
    <div ref={ref} className="p-6 bg-white text-black w-full max-w-[148mm] min-h-[210mm] mx-auto print:p-4" style={{ fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @media print {
          @page {
            size: A5;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      
      <div className="border-b-2 border-black pb-4 mb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">{store?.store_name || store?.name || 'LOOKPRICE'}</h1>
          <p className="text-xs font-medium text-gray-600">Sevkiyat ve Kargo Fişi</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-gray-400 uppercase">Sipariş No</p>
          <p className="text-lg font-black text-indigo-600">#{sale.id}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="space-y-2">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alıcı Bilgileri</h2>
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
            <p className="font-bold text-sm text-gray-900">{sale.customer_name}</p>
            {sale.customer_phone && <p className="text-xs text-gray-600 mt-0.5">{sale.customer_phone}</p>}
            <p className="text-xs text-gray-700 mt-2 leading-relaxed">{sale.customer_address}</p>
          </div>
        </div>
        <div className="space-y-4 text-right">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tarih</p>
            <p className="text-xs font-bold text-gray-900">{new Date(sale.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ödeme</p>
            <p className="text-xs font-bold text-gray-900 uppercase">{sale.payment_method === 'iyzico' ? 'Online Ödeme' : (sale.payment_method || '-')}</p>
          </div>
          {sale.notes && (
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Notlar</p>
              <p className="text-[10px] text-gray-600 italic">{sale.notes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-8">
        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sipariş İçeriği</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-[10px] font-black text-gray-500 uppercase rounded-l-lg">Ürün</th>
              <th className="px-3 py-2 text-[10px] font-black text-gray-500 uppercase text-center rounded-r-lg">Adet</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sale.items?.map((item: any, index: number) => (
              <tr key={index}>
                <td className="px-3 py-3">
                  <p className="text-xs font-bold text-gray-900">{item.product_name}</p>
                  <p className="text-[10px] text-gray-400">#{item.product_id}</p>
                </td>
                <td className="px-3 py-3 text-center text-xs font-black text-gray-900">{Math.floor(Number(item.quantity))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
    </div>
  );
});

export default ShippingSlip;
