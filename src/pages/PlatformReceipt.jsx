import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { Printer, ArrowLeft, CheckCircle } from 'lucide-react';
import SwirlingLoader from '../components/common/SwirlingLoader';

const PlatformReceipt = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await api.get(`/subscription/invoices/${id}`);
        if (res.data.success) {
          setInvoice(res.data.data.invoice);
        }
      } catch (err) {
        setError('Failed to load invoice details');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <SwirlingLoader />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <div className="text-red-500 mb-4 text-xl font-medium">{error || 'Invoice not found'}</div>
        <Link to="/settings" className="text-[#093C5D] font-medium hover:underline">
          &larr; Back to Settings
        </Link>
      </div>
    );
  }

  const shop = invoice.shopId || {};

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 font-sans print:bg-white print:py-0 print:px-0">
      <div className="max-w-3xl mx-auto">
        {/* Actions (Hidden on Print) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 print:hidden">
          <Link to="/settings" className="flex w-full sm:w-auto items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm bg-white px-4 py-2.5 rounded-lg border border-gray-200">
            <ArrowLeft className="w-4 h-4" />
            {t('Back to Settings')}
          </Link>
          <div className="flex w-full sm:w-auto items-center gap-3 flex-col sm:flex-row">
            {invoice.receiptUrl ? (
              <a
                href={invoice.receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="flex w-full sm:w-auto items-center justify-center gap-2 bg-[#093C5D] hover:bg-[#072d46] text-white px-5 py-2.5 rounded-lg transition-colors font-medium text-sm shadow-sm"
              >
                <Printer className="w-4 h-4" />
                {t('Download Cloud PDF')}
              </a>
            ) : (
              <button
                onClick={handlePrint}
                className="flex w-full sm:w-auto items-center justify-center gap-2 bg-[#093C5D] hover:bg-[#072d46] text-white px-5 py-2.5 rounded-lg transition-colors font-medium text-sm shadow-sm"
              >
                <Printer className="w-4 h-4" />
                {t('Print Invoice')}
              </button>
            )}
          </div>
        </div>

        {/* Invoice Paper */}
        <div className="bg-white border border-gray-200 print:border-none">
          
          {/* Header */}
          <div className="bg-[#093C5D] text-white p-6 sm:p-10 flex flex-col sm:flex-row justify-between items-center gap-6 text-center sm:text-left">
            <div className="w-full border-b border-white/10 pb-6 sm:border-b-0 sm:pb-0">
              <h1 className="text-3xl font-semibold tracking-tight mb-1">UdharPay</h1>
              <p className="text-white/80 text-sm font-medium">Biller Solution for Retailers</p>
            </div>
            <div className="w-full sm:text-right">
              <h2 className="text-2xl font-semibold uppercase tracking-widest opacity-90 mb-1">{t('INVOICE')}</h2>
              <p className="text-white/80 text-sm font-medium break-all">#{invoice.razorpayPaymentId || invoice._id}</p>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            {/* Meta Info */}
            <div className="flex flex-col sm:flex-row justify-between gap-6 pb-8 border-b border-gray-100 text-center sm:text-left">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('Invoice Date')}</p>
                <p className="text-gray-900 font-medium">{formatDate(invoice.createdAt)}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('Payment Status')}</p>
                <div className="inline-flex items-center justify-center gap-1.5 text-green-700 bg-green-50 px-3 py-1 rounded-full text-sm font-semibold border border-green-200">
                  <CheckCircle className="w-4 h-4" />
                  {t('PAID')}
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-gray-100 text-center sm:text-left">
              <div className="border-b border-gray-100 pb-8 sm:pb-0 sm:border-none">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('Billed To')}</p>
                <div className="space-y-1 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900 text-base">{shop.shopName || shop.name}</p>
                  {shop.shopAddress && <p className="text-gray-600 font-medium">{shop.shopAddress}</p>}
                  <p className="font-medium text-gray-600">Email: <span className="font-medium text-gray-900">{shop.shopEmail || '-'}</span></p>
                  <p className="font-medium text-gray-600">Phone: <span className="font-medium text-gray-900">{shop.shopPhone || '-'}</span></p>
                  {shop.gstNumber && <p className="mt-2 text-xs font-semibold text-gray-500">GSTIN: <span className="text-gray-900">{shop.gstNumber}</span></p>}
                </div>
              </div>
              <div className="sm:text-right">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('Billed From')}</p>
                <div className="space-y-1 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900 text-base">UdharPay Technologies Pvt Ltd</p>
                  <p className="text-gray-600 font-medium">123 Tech Park, Phase 1</p>
                  <p className="text-gray-600 font-medium">Bangalore, Karnataka 560001</p>
                  <p className="font-medium text-gray-600">Email: <span className="font-medium text-gray-900">support@udharpay.com</span></p>
                  <p className="mt-2 text-xs font-semibold text-gray-500">GSTIN: <span className="text-gray-900">29ABCDE1234F1Z5</span></p>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="py-8">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Description')}</th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">{t('Amount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-4">
                      <p className="font-semibold text-gray-900 text-base mb-1">UdharPay {invoice.planName} Subscription</p>
                      <p className="text-sm text-gray-500">
                        {t('Validity:')} {formatDate(invoice.billingPeriodStart)} - {formatDate(invoice.billingPeriodEnd)}
                      </p>
                    </td>
                    <td className="py-4 text-right font-medium text-gray-900 text-base">
                      ₹{invoice.amount.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end pt-4">
              <div className="w-full sm:w-1/2 md:w-1/3">
                <div className="flex justify-between py-2 text-sm text-gray-600">
                  <span>{t('Subtotal')}</span>
                  <span className="font-medium text-gray-900">₹{invoice.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 text-sm text-gray-600 border-b border-gray-100">
                  <span>{t('Tax (Inclusive)')}</span>
                  <span className="font-medium text-gray-900">₹0.00</span>
                </div>
                <div className="flex justify-between py-4 text-lg font-semibold text-gray-900">
                  <span>{t('Total Paid')}</span>
                  <span className="text-[#093C5D]">₹{invoice.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-100 text-center text-xs text-gray-400">
              <p>{t('This is a computer-generated invoice and requires no signature.')}</p>
              <p className="mt-1">Thank you for choosing UdharPay.</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformReceipt;
