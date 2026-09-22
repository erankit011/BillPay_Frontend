import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { formatCurrency } from '../../utils/currency';

const formatPaymentMode = (mode) => {
  if (!mode) return '';
  switch (mode) {
    case 'CASH': return 'Cash';
    case 'UPI': return 'UPI';
    case 'BANK_TRANSFER': return 'Bank Transfer';
    case 'CHEQUE': return 'Cheque';
    case 'CREDIT': return 'Credit';
    default: return mode;
  }
};

const ViewBillModal = ({ viewBill, setViewBill }) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (viewBill) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [viewBill]);

  if (!viewBill) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-3 md:px-4 py-6 md:py-8">
        <div className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay" onClick={() => setViewBill(null)} />
        <div className="relative bg-white border border-gray-200 rounded-xl max-w-2xl w-[95%] sm:w-full p-4 sm:p-5 md:p-6 lg:p-8 animate-modal-content flex flex-col max-h-[90vh] mx-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-5 pb-3 sm:pb-4 border-b border-gray-100 flex-shrink-0 gap-2">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 leading-tight truncate">
              {t('Bill Details')} - <span className="text-[#093C5D]">{viewBill.invoiceNumber}</span>
            </h3>
            <button
              onClick={() => setViewBill(null)}
              className="cursor-pointer text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px] border border-gray-200"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-col flex-1 min-h-0 space-y-1 sm:space-y-2">
             
             {/* Customer & Date Info - Clean Receipt Style */}
             <div className="flex flex-row items-start justify-between border-b border-dashed border-gray-200 pb-3 sm:pb-4 mb-2 flex-shrink-0">
               <div className="flex-1 pr-2">
                 <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('Billed To')}</p>
                 <p className="text-[13px] sm:text-sm font-semibold text-gray-900 leading-tight">{viewBill.customerId?.name || t('Walk-in Customer')}</p>
                 {viewBill.customerId?.phone && <p className="text-[12px] sm:text-xs text-gray-500 mt-1">{viewBill.customerId.phone}</p>}
                 {viewBill.customerId?.email && <p className="text-[12px] sm:text-xs text-gray-500 mt-0.5">{viewBill.customerId.email}</p>}
               </div>
               
               <div className="text-left pl-3 border-l border-gray-100 w-[45%] sm:min-w-[140px]">
                 <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('Date & Status')}</p>
                 <p className="text-[13px] sm:text-sm font-semibold text-gray-900 leading-tight">
                   {new Date(viewBill.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                 </p>
                 <p className="text-[12px] sm:text-xs text-gray-500 mt-1">
                   {new Date(viewBill.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}
                 </p>
                 <div className="mt-0.5 flex justify-start">
                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase sm:text-[10px] font-medium ${(viewBill.paymentStatus === 'PAID' || viewBill.paymentStatus === 'ADVANCE') ? 'bg-green-50 text-green-700 border border-green-200' : viewBill.paymentStatus === 'PARTIAL' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {viewBill.paymentStatus === 'PAID' ? t('Paid') : viewBill.paymentStatus === 'UNPAID' ? t('Unpaid') : viewBill.paymentStatus === 'PARTIAL' ? t('Partial') : viewBill.paymentStatus === 'ADVANCE' ? t('Advance') : viewBill.paymentStatus}
                    </span>
                 </div>
               </div>
             </div>
             
             {/* Products Table - Clean Style */}
             <div className="flex flex-col flex-1 min-h-0 overflow-hidden py-1">
               <div className="overflow-y-auto overflow-x-auto flex-1 min-h-0 custom-scrollbar">
                 <table className="w-full text-left min-w-[260px] sm:min-w-[400px]">
                   <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
                   <tr>
                     <th className="py-2.5 px-2 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Item')}</th>
                     <th className="py-2.5 px-2 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">{t('Qty')}</th>
                     <th className="py-2.5 px-2 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">{t('Price')}</th>
                     <th className="py-2.5 px-2 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">{t('Total')}</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                   {viewBill.products?.map((p, i) => (
                     <tr key={i} className="group border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                       <td className="py-2.5 sm:py-3 px-2 text-[11px] sm:text-sm text-gray-900 font-medium leading-tight">{p.name}</td>
                       <td className="py-2.5 sm:py-3 px-2 text-center text-[11px] sm:text-sm text-gray-600 font-medium">{p.quantity}</td>
                       <td className="py-2.5 sm:py-3 px-2 text-right text-[11px] sm:text-sm text-gray-600 font-medium">{formatCurrency(p.price)}</td>
                       <td className="py-2.5 sm:py-3 px-2 text-right text-[11px] sm:text-sm text-[#093C5D] font-semibold">{formatCurrency(p.total)}</td>
                     </tr>
                   ))}
                  </tbody>
               </table>
               </div>
             </div>

             {/* Totals Section */}
             <div className="pt-3 sm:pt-4 border-t border-dashed border-gray-200 flex-shrink-0">
               <div className="w-full space-y-1.5 sm:space-y-2">
                 <div className="flex justify-between items-center text-xs sm:text-sm">
                   <span className="text-gray-500 font-medium">{t('Subtotal')}</span>
                   <span className="font-semibold text-gray-900">{formatCurrency(viewBill.subtotal)}</span>
                 </div>
                 {viewBill.tax > 0 && (
                   <div className="flex justify-between items-center text-xs sm:text-sm">
                     <span className="text-gray-500 font-medium">{t('Tax')}</span>
                     <span className="font-semibold text-gray-900">{formatCurrency(viewBill.tax)}</span>
                   </div>
                 )}
                 {viewBill.discount > 0 && (
                   <div className="flex justify-between items-center text-xs sm:text-sm">
                     <span className="text-gray-500 font-medium">{t('Discount')}</span>
                     <span className="font-semibold text-red-500">-{formatCurrency(viewBill.discount)}</span>
                   </div>
                 )}

                 <div className="flex justify-between items-center pt-2 sm:pt-2.5 border-t border-gray-100">
                   <span className="text-sm sm:text-base font-semibold text-gray-900">{t('Grand Total')}</span>
                   <span className="text-base sm:text-lg font-semibold text-[#093C5D]">{formatCurrency(viewBill.grandTotal)}</span>
                 </div>

                  <div className="flex justify-between items-center text-[11px] sm:text-sm">
                    <span className="text-gray-500 font-medium">
                      {t('Amount Paid')}
                      {viewBill.amountPaid > 0 && viewBill.paymentMode && (
                        <span className="ml-1 text-[10px] sm:text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-md border border-gray-100">
                          {formatPaymentMode(viewBill.paymentMode)}
                        </span>
                      )}
                    </span>
                    <span className="font-semibold text-green-600">{formatCurrency(viewBill.amountPaid)}</span>
                  </div>
                 {viewBill.grandTotal > (viewBill.amountPaid || 0) ? (
                   <div className="flex justify-between items-center text-[11px] sm:text-sm">
                     <span className="text-gray-500 font-medium">{t('Pending Amount')}</span>
                     <span className="font-semibold text-red-700">{formatCurrency(viewBill.grandTotal - (viewBill.amountPaid || 0))}</span>
                   </div>
                 ) : (viewBill.amountPaid || 0) > viewBill.grandTotal ? (
                   <div className="flex justify-between items-center text-[11px] sm:text-sm">
                     <span className="text-gray-500 font-medium">{t('Advance Amount')}</span>
                     <span className="font-semibold text-green-700">{formatCurrency((viewBill.amountPaid || 0) - viewBill.grandTotal)}</span>
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
