import React from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
};

const ViewBillModal = ({ viewBill, setViewBill }) => {
  const { t } = useTranslation();

  if (!viewBill) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-3 md:px-4 py-6 md:py-8">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-modal-overlay" onClick={() => setViewBill(null)} />
        <div className="relative bg-white border border-gray-200 rounded-xl max-w-2xl w-full p-5 md:p-6 lg:p-8 animate-modal-content flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between mb-4 md:mb-5 pb-4 border-b border-gray-200 flex-shrink-0">
            <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">{t('Bill Details')} - {viewBill.invoiceNumber}</h3>
            <button
              onClick={() => setViewBill(null)}
              className="cursor-pointer text-gray-400 hover:text-gray-600 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all active:scale-95 flex-shrink-0"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
          <div className="flex flex-col flex-1 min-h-0 space-y-4">
             <div className="flex flex-col md:flex-row md:justify-between gap-4 flex-shrink-0">
               <div>
                 <p className="text-sm font-semibold text-gray-800">{t('Customer')}: {viewBill.customerId?.name || t('Walk-in Customer')}</p>
                 <p className="text-sm text-gray-600">{viewBill.customerId?.phone}</p>
                 {viewBill.customerId?.email && <p className="text-sm text-gray-600">{viewBill.customerId.email}</p>}
               </div>
               <div className="md:text-right">
                 <p className="text-sm font-semibold text-gray-800">{t('Date')}: {new Date(viewBill.createdAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                 <p className="text-sm font-semibold text-gray-800 mt-1 flex items-center md:justify-end gap-2">{t('Status')}: <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${(viewBill.paymentStatus === 'PAID' || viewBill.paymentStatus === 'ADVANCE') ? 'bg-green-100 text-green-700' : viewBill.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{viewBill.paymentStatus}</span></p>
               </div>
             </div>
             
             <div className="flex flex-col flex-1 min-h-0 overflow-hidden border-t border-b border-gray-200 py-4">
               <h4 className="text-sm font-semibold text-gray-800 mb-2 flex-shrink-0">{t('Products')}</h4>
               <div className="overflow-y-auto overflow-x-auto flex-1 min-h-0 border border-gray-100 rounded-lg">
                 <table className="w-full text-sm text-left min-w-[400px]">
                   <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                   <tr>
                     <th className="px-3 py-2 font-medium text-gray-600 rounded-l-lg">{t('Item')}</th>
                     <th className="px-3 py-2 font-medium text-gray-600 text-center">{t('Qty')}</th>
                     <th className="px-3 py-2 font-medium text-gray-600 text-right">{t('Price')}</th>
                     <th className="px-3 py-2 font-medium text-gray-600 text-right rounded-r-lg">{t('Total')}</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {viewBill.products?.map((p, i) => (
                     <tr key={i}>
                       <td className="px-3 py-2.5 text-gray-900 font-medium">{p.name}</td>
                       <td className="px-3 py-2.5 text-center text-gray-600">{p.quantity}</td>
                       <td className="px-3 py-2.5 text-right text-gray-600">{formatCurrency(p.price)}</td>
                       <td className="px-3 py-2.5 text-right text-gray-900 font-medium">{formatCurrency(p.total)}</td>
                     </tr>
                   ))}
                  </tbody>
               </table>
               </div>
             </div>

             <div className="pt-2 flex justify-end flex-shrink-0">
               <div className="w-full md:w-1/2 space-y-2">
                 <div className="flex justify-between text-sm">
                   <span className="text-gray-600">{t('Subtotal')}</span>
                   <span className="font-medium text-gray-900">{formatCurrency(viewBill.subtotal)}</span>
                 </div>
                 {viewBill.tax > 0 && (
                   <div className="flex justify-between text-sm">
                     <span className="text-gray-600">{t('Tax')}</span>
                     <span className="font-medium text-gray-900">{formatCurrency(viewBill.tax)}</span>
                   </div>
                 )}
                 {viewBill.discount > 0 && (
                   <div className="flex justify-between text-sm">
                     <span className="text-gray-600">{t('Discount')}</span>
                     <span className="font-medium text-red-600">-{formatCurrency(viewBill.discount)}</span>
                   </div>
                 )}
                 <div className="flex justify-between text-base font-bold pt-3 mt-1 border-t border-gray-200">
                   <span className="text-gray-900">{t('Grand Total')}</span>
                   <span className="text-[#093C5D]">{formatCurrency(viewBill.grandTotal)}</span>
                 </div>
                 <div className="flex justify-between text-sm pt-2">
                   <span className="text-gray-600">{t('Amount Paid')}</span>
                   <span className="font-semibold text-green-600">{formatCurrency(viewBill.amountPaid)}</span>
                 </div>
                 {viewBill.grandTotal > (viewBill.amountPaid || 0) ? (
                    <div className="flex justify-between text-sm pt-1">
                      <span className="text-gray-600 font-medium">{t('Pending Amount')}</span>
                      <span className="font-semibold text-red-600">{formatCurrency(viewBill.grandTotal - (viewBill.amountPaid || 0))}</span>
                    </div>
                  ) : (viewBill.amountPaid || 0) > viewBill.grandTotal ? (
                    <div className="flex justify-between text-sm pt-1">
                      <span className="text-gray-600 font-medium">{t('Advance Amount')}</span>
                      <span className="font-semibold text-green-600">{formatCurrency((viewBill.amountPaid || 0) - viewBill.grandTotal)}</span>
                    </div>
                  ) : null}
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewBillModal;
