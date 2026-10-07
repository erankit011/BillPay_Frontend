import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { Loader2, Download, Printer, ShieldCheck, HelpCircle } from 'lucide-react';
import SwirlingLoader from '../components/common/SwirlingLoader';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../utils/dateUtils';
// We assume there's a component to render the receipt/bill design. Let's see if there is one.
// The user already has PlatformReceipt.jsx maybe? Or we just render it here.

const PublicInvoice = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { t } = useTranslation();

  const [bill, setBill] = useState(null);
  const [shopSettings, setShopSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const res = await api.get(`/bills/public/${id}?token=${token}`);
        setBill(res.data.data.bill);
        setShopSettings(res.data.data.shopSettings);
      } catch (err) {
        setError(err.response?.data?.message || 'Invoice not found or link has expired.');
      } finally {
        setLoading(false);
      }
    };
    if (id && token) {
      fetchBill();
    } else {
      setError('Invalid link.');
      setLoading(false);
    }
  }, [id, token]);

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 gap-3">
        <SwirlingLoader className="w-10 h-10 text-[#093C5D]" />
        <span className="text-gray-500 font-medium text-sm animate-pulse">{t('Loading Secure Invoice...')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-50 text-center p-4 sm:p-6">
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 max-w-sm sm:max-w-md w-full flex flex-col items-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 sm:mb-6">
            <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
          </div>

          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2 sm:mb-3">
            {t('Content Unavailable')}
          </h2>

          <p className="text-gray-500 font-medium text-xs sm:text-sm mb-6 sm:mb-8 leading-relaxed px-2">
            {error === 'Content not found or access denied.' || error === 'Too many requests. Please try again later.'
              ? t(error)
              : t("The content you are looking for does not exist or you don't have permission to view it.")}
          </p>

          <button
            onClick={() => window.open('/contact-support', '_blank')}
            className="w-full sm:w-auto mb-2 sm:mb-4 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg font-semibold transition-colors active:scale-95 text-[13px] sm:text-sm border border-gray-200 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-gray-500" /> {t("Contact Support")}
          </button>

          <div className="w-full pt-4 border-t border-gray-100 mt-4 sm:mt-6">
            <p className="text-[11px] sm:text-xs text-gray-400 font-medium">{t("Powered by UdharPay Business")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white py-4 sm:py-8 px-2 sm:px-6 lg:px-8 print:p-0 font-sans">
      <div className="max-w-3xl mx-auto print:max-w-none">

        {/* Header Actions */}
        <div className="print:hidden flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 mb-4 sm:mb-6 bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-all cursor-default">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-gray-800">Verified Secure Invoice</span>
          </div>
          <div className="flex gap-2 w-full sm:w-auto mt-3 sm:mt-0">
            <button
              onClick={() => window.print()}
              className="cursor-pointer flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#093C5D] hover:bg-[#082a42] text-white rounded-lg text-[15px] font-medium active:scale-95 transition-all duration-200 shadow-none"
            >
              <Printer className="w-[18px] h-[18px] sm:w-5 sm:h-5 shrink-0" />
              <span className="leading-none pt-px whitespace-nowrap">Print & Download</span>
            </button>
          </div>
        </div>

        {/* Invoice Display */}
        <div className="bg-white p-5 sm:p-8 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-300 cursor-default relative group print:shadow-none" id="invoice-content">
          {/* Shop Details */}
          <div className="flex flex-col items-start text-left border-b border-dashed border-gray-200 pb-3 mb-3 sm:pb-4 sm:mb-4 group-hover:border-gray-300 transition-colors">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 tracking-tight mb-2 sm:mb-3">
              {shopSettings?.shopName || bill?.shopId?.name}
            </h1>

            <div className="flex flex-col space-y-1.5 sm:space-y-2.5 w-full">
              {shopSettings?.shopEmail && (
                <div className="flex flex-col">
                  <span className="text-gray-400 font-medium text-[11px] sm:text-xs uppercase tracking-wider mb-0.5">Email</span>
                  <span className="text-gray-800 font-medium text-sm break-all">{shopSettings.shopEmail}</span>
                </div>
              )}

              {shopSettings?.shopPhone && (
                <div className="flex flex-col">
                  <span className="text-gray-400 font-medium text-[11px] sm:text-xs uppercase tracking-wider mb-0.5">Phone</span>
                  <span className="text-gray-800 font-medium text-sm">{shopSettings.shopPhone}</span>
                </div>
              )}

              {shopSettings?.shopAddress && (
                <div className="flex flex-col">
                  <span className="text-gray-400 font-medium text-[11px] sm:text-xs uppercase tracking-wider mb-0.5">Address</span>
                  <span className="text-gray-800 font-medium text-sm leading-relaxed">{shopSettings.shopAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bill Details */}
          <div className="grid grid-cols-2 gap-y-3 gap-x-2 sm:gap-4 mb-4 sm:mb-5">
            {/* Column 1: Customer Details */}
            <div className="flex flex-col space-y-1.5 sm:space-y-2.5">
              <div className="flex flex-col">
                <span className="text-gray-400 font-medium text-[11px] sm:text-xs uppercase tracking-wider mb-0.5">Billed To</span>
                <span className="font-semibold text-gray-800 text-base sm:text-lg">{bill?.customerId?.name || 'Walk-in Customer'}</span>
              </div>

              {bill?.customerId?.phone && (
                <div className="flex flex-col">
                  <span className="text-gray-400 font-medium text-[11px] sm:text-xs uppercase tracking-wider mb-0.5">Phone</span>
                  <span className="font-semibold text-gray-800 text-sm">{bill?.customerId?.phone}</span>
                </div>
              )}

              {bill?.customerId?.email && (
                <div className="flex flex-col">
                  <span className="text-gray-400 font-medium text-[11px] sm:text-xs uppercase tracking-wider mb-0.5">Email</span>
                  <span className="font-semibold text-gray-800 text-sm break-all">{bill?.customerId?.email}</span>
                </div>
              )}
            </div>

            {/* Column 2: Invoice Info */}
            <div className="flex flex-col space-y-1.5 sm:space-y-2.5 items-end text-right">
              <div className="flex flex-col items-end">
                <span className="text-gray-400 font-medium text-[11px] sm:text-xs uppercase tracking-wider mb-0.5">Invoice No</span>
                <span className="font-semibold text-gray-800 text-base sm:text-lg">{bill?.invoiceNumber}</span>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-gray-400 font-medium text-[11px] sm:text-xs uppercase tracking-wider mb-0.5">Generated At</span>
                <span className="font-semibold text-gray-800 text-sm">{formatDate(bill?.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="mb-5 sm:mb-6 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[300px]">
              <thead>
                <tr className="border-y border-gray-200 text-gray-600 text-xs sm:text-sm">
                  <th className="py-2 sm:py-3 pr-2 font-semibold w-full">Item</th>
                  <th className="py-2 sm:py-3 px-2 sm:px-3 font-semibold text-right whitespace-nowrap">Qty</th>
                  <th className="py-2 sm:py-3 px-2 sm:px-3 font-semibold text-right whitespace-nowrap">Price</th>
                  <th className="py-2 sm:py-3 pl-2 sm:pl-3 font-semibold text-right whitespace-nowrap">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bill?.products?.map((item, idx) => (
                  <tr key={idx} className="text-sm hover:bg-gray-50/80 transition-colors cursor-default align-top">
                    <td className="py-2 sm:py-3 pr-2 font-semibold text-gray-800 leading-tight">{item.name}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-3 text-right text-gray-700 font-medium whitespace-nowrap">{item.quantity}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-3 text-right text-gray-700 font-medium whitespace-nowrap">₹{item.price}</td>
                    <td className="py-2 sm:py-3 pl-2 sm:pl-3 text-right font-semibold text-gray-900 whitespace-nowrap">₹{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="border-t border-gray-200 pt-4 sm:pt-6 group-hover:border-gray-300 transition-colors">
            <div className="w-full sm:w-1/2 ml-auto space-y-1.5 sm:space-y-2 text-sm">
              <div className="flex justify-between text-gray-700 font-medium hover:text-gray-900 transition-colors">
                <span>Subtotal</span>
                <span>₹{bill?.subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-700 font-medium hover:text-gray-900 transition-colors">
                <span>Tax</span>
                <span>₹{bill?.tax || 0}</span>
              </div>
              <div className="flex justify-between text-gray-700 font-medium hover:text-gray-900 transition-colors">
                <span>Discount</span>
                <span className="text-green-600">-₹{bill?.discount || 0}</span>
              </div>
              <div className="flex justify-between text-base sm:text-lg font-semibold text-gray-900 pt-2 border-t border-gray-200 mt-1">
                <span>Grand Total</span>
                <span>₹{bill?.grandTotal}</span>
              </div>

              <div className="flex justify-between text-gray-700 font-medium pt-2 border-t border-gray-200 mt-2 hover:text-gray-900 transition-colors">
                <span>Amount Paid</span>
                <span className="text-green-600">₹{bill?.amountPaid || 0}</span>
              </div>
              {(bill?.grandTotal - (bill?.amountPaid || 0)) > 0 && (
                <div className="flex justify-between text-base font-semibold text-red-600 pt-1 hover:text-red-700 transition-colors">
                  <span>Balance Due</span>
                  <span>₹{bill?.grandTotal - (bill?.amountPaid || 0)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Thank You Note */}
          <div className="mt-6 sm:mt-8 bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-100 text-center print:break-inside-avoid">
            <p className="text-gray-600 font-medium text-[11px] sm:text-xs">
              Thank you for shopping with {shopSettings?.shopName || bill?.shopId?.name}! We appreciate your business.
            </p>
          </div>

          <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-dashed border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 print:break-inside-avoid">
            <div className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200/60 cursor-default hover:bg-emerald-100/80 transition-colors">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="text-[11.5px] sm:text-xs font-semibold whitespace-nowrap">Digitally Verified</span>
            </div>
            <p className="text-[11px] sm:text-xs text-gray-400 font-medium tracking-wide">
              Powered by <span className="font-semibold text-gray-500">UdharPay Business</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicInvoice;
