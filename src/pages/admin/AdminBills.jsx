import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Search,
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Store,
  User,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CreditCard,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';
import { getAdminBills } from '../../features/admin/api/adminApi';
import AdminStatCard from '../../features/admin/components/AdminStatCard';
import SwirlingLoader from '../../components/common/SwirlingLoader';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/dateUtils';

const AdminBills = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('All');
  const [paymentMode, setPaymentMode] = useState('All');
  const [selectedBill, setSelectedBill] = useState(null);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (!selectedBill) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, [selectedBill]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminBills', page, search, paymentStatus, paymentMode],
    queryFn: () =>
      getAdminBills({
        page,
        limit: 10,
        search,
        paymentStatus,
        paymentMode
      }),
    staleTime: 30 * 1000,
  });

  const bills = data?.data || [];
  const totalCount = data?.totalCount || 0;
  const totalGMV = data?.totalGMV || 0;
  const totalPaid = data?.totalPaid || 0;
  const totalPending = data?.totalPending || 0;
  const totalPages = data?.totalPages || 1;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'SH';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PAID
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            PARTIAL
          </span>
        );
      case 'UNPAID':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" />
            UNPAID
          </span>
        );
    }
  };

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12 pb-24 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight">
            Store Bills & Invoices
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed font-medium">
            Audit all itemized bills created by merchant stores across UdharPay. Track payment settlements, cash collections, and pending customer credit.
          </p>
        </div>
      </div>

      {/* KPI Stat Cards (Shopkeeper standard 2x2 on mobile, 4 in row on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
        <AdminStatCard
          title="TOTAL PLATFORM GMV"
          value={formatCurrency(totalGMV)}
          subtext="Gross merchandise value billed"
          icon={IndianRupee}
          variant="primary"
        />
        <AdminStatCard
          title="TOTAL COLLECTED"
          value={formatCurrency(totalPaid)}
          subtext="Settled & cash collections received"
          icon={CheckCircle2}
          variant="success"
        />
        <AdminStatCard
          title="OUTSTANDING CREDIT"
          value={formatCurrency(totalPending)}
          subtext="Pending customer credit balance"
          icon={Clock}
          variant="danger"
        />
        <AdminStatCard
          title="TOTAL BILLS ISSUED"
          value={totalCount}
          subtext="Invoices generated across stores"
          icon={FileText}
          variant="default"
        />
      </div>

      {/* Filter Chips (Matched with Customer/Shopkeeper Pages UI) */}
      <div className="flex items-center flex-nowrap gap-2 sm:gap-3 overflow-x-auto pb-1 mb-2 sm:mb-3 w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {[
          { label: 'All Invoices', value: 'All' },
          { label: 'Fully Paid', value: 'PAID' },
          { label: 'Partially Paid', value: 'PARTIAL' },
          { label: 'Unpaid (Udhar)', value: 'UNPAID' },
        ].map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => {
              setPaymentStatus(f.value);
              setPage(1);
            }}
            className={`shrink-0 cursor-pointer py-1.5 sm:py-2 px-3 sm:px-4 rounded-full text-[10px] sm:text-sm font-medium transition-all duration-200 border active:scale-95 select-none flex items-center justify-center whitespace-nowrap !min-h-0 !min-w-0 !h-fit ${paymentStatus === f.value
                ? 'bg-[#093C5D] text-white border-[#093C5D] shadow-none'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-none'
              }`}
          >
            {f.label}
          </button>
        ))}

        <span className="w-px h-6 bg-gray-300 mx-1 shrink-0" />

        {[
          { label: 'All Modes', value: 'All' },
          { label: 'Cash', value: 'CASH' },
          { label: 'UPI Payment', value: 'UPI' },
          { label: 'Store Credit (Udhar)', value: 'CREDIT' },
          { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
        ].map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => {
              setPaymentMode(f.value);
              setPage(1);
            }}
            className={`shrink-0 cursor-pointer py-1.5 sm:py-2 px-3 sm:px-4 rounded-full text-[10px] sm:text-sm font-medium transition-all duration-200 border active:scale-95 select-none flex items-center justify-center whitespace-nowrap !min-h-0 !min-w-0 !h-fit ${paymentMode === f.value
                ? 'bg-[#093C5D] text-white border-[#093C5D] shadow-none'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-none'
              }`}
          >
            {f.label}
          </button>
        ))}

        {(paymentStatus !== 'All' || paymentMode !== 'All' || search || searchInput) && (
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setPaymentStatus('All');
              setPaymentMode('All');
              setPage(1);
            }}
            className="shrink-0 cursor-pointer py-1.5 sm:py-2 px-3 sm:px-4 rounded-full text-[10px] sm:text-sm font-medium text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 flex items-center gap-1.5 transition-colors shadow-none"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        )}
      </div>

      {/* Search Bar (Matched with Customer/Shopkeeper Pages UI) */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col w-full mb-3 sm:mb-4">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search By Invoice Number & Shop & Customer"
            className="block w-full h-10 sm:h-12 pl-9 sm:pl-11 pr-10 sm:pr-12 bg-white border border-gray-300 rounded-lg text-[13px] sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200 shadow-none"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearch('');
                setPage(1);
              }}
              className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </form>

      {/* Bills Ledger Table (Separate Shop Name & Merchant Owner Columns) */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-none">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-500 gap-3">
            <SwirlingLoader className="w-8 h-8 text-[#093C5D]" />
            <p className="text-xs sm:text-sm font-medium">Loading store bills...</p>
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-rose-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-semibold">Failed to load platform bills</p>
          </div>
        ) : bills.length === 0 ? (
          <div className="py-20 text-center text-gray-500">
            <FileText className="w-10 h-10 mx-auto text-gray-400 mb-3" />
            <p className="text-base font-semibold text-gray-900">No Invoices or Bills Found</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              No customer billing transactions match your current filters. Try resetting search or switching status tabs.
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View (md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Shop & Store Name</th>
                    <th className="py-3 px-4">Merchant Owner</th>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4 text-right">Grand Total</th>
                    <th className="py-3 px-4 text-right">Amount Paid</th>
                    <th className="py-3 px-4 text-center">Payment Status</th>
                    <th className="py-3 px-4 text-center">Payment Mode</th>
                    <th className="py-3 px-4 text-left">Issued Date</th>
                    <th className="py-3 px-4 text-right">Inspect Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-700">
                  {bills.map((bill) => (
                    <tr key={bill._id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Invoice # */}
                      <td className="py-3.5 px-4 font-semibold text-[#093C5D]">
                        #{bill.invoiceNumber}
                      </td>

                      {/* Shop Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg border border-gray-200 bg-[#F5F5F5] flex items-center justify-center text-[11px] font-semibold text-[#093C5D] shrink-0">
                            {getInitials(bill.shopId?.businessName || bill.shopId?.name)}
                          </div>
                          <span className="truncate max-w-[160px]" title={bill.shopId?.businessName || bill.shopId?.name || 'Shop'}>
                            {bill.shopId?.businessName || bill.shopId?.name || 'Shop'}
                          </span>
                        </div>
                      </td>

                      {/* Merchant Owner */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 truncate max-w-[140px]" title={bill.shopId?.name}>
                          {bill.shopId?.name || 'Merchant'}
                        </div>
                        <div className="text-[11px] text-gray-500 font-normal truncate max-w-[140px]">{bill.shopId?.phone || bill.shopId?.email || '—'}</div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 truncate max-w-[140px]" title={bill.customerId?.name}>
                          {bill.customerId?.name || 'Walk-in Customer'}
                        </div>
                        <div className="text-[11px] text-gray-500 font-normal truncate max-w-[140px]">{bill.customerId?.phone || '—'}</div>
                      </td>

                      {/* Grand Total */}
                      <td className="py-3.5 px-4 text-right font-semibold text-gray-900">
                        {formatCurrency(bill.grandTotal)}
                      </td>

                      {/* Amount Paid */}
                      <td className="py-3.5 px-4 text-right text-emerald-700 font-semibold">
                        {formatCurrency(bill.amountPaid || 0)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(bill.paymentStatus)}
                      </td>

                      {/* Mode */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200 uppercase">
                          {bill.paymentMode || 'CASH'}
                        </span>
                      </td>

                      {/* Issued On */}
                      <td className="py-3.5 px-4 text-left text-xs text-gray-500 font-normal">
                        {formatDate(bill.createdAt)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedBill(bill)}
                          className="cursor-pointer h-8 px-2.5 sm:px-3 text-blue-700 font-semibold bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg inline-flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95 whitespace-nowrap shadow-none"
                          title="Inspect itemized bill details, products, and payment breakdown"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (< md) - Clean layout matching shopkeeper standard */}
            <div className="md:hidden space-y-3 p-3 bg-gray-50/50">
              {bills.map((bill) => {
                const shopName = bill.shopId?.businessName || bill.shopId?.name || 'Shop';
                const customerName = bill.customerId?.name || 'Walk-in Customer';

                return (
                  <div
                    key={bill._id}
                    className="bg-white border border-gray-200 rounded-lg p-3.5 space-y-3 shadow-none"
                  >
                    {/* Header: Shop Avatar, Name, Invoice Number & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg border border-gray-200 bg-[#F5F5F5] flex items-center justify-center text-xs font-semibold text-[#093C5D] shrink-0">
                          {getInitials(shopName)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 truncate" title={shopName}>
                            {shopName}
                          </h3>
                          <span className="font-mono text-[11px] font-semibold text-[#093C5D] block">
                            #{bill.invoiceNumber}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {getStatusBadge(bill.paymentStatus)}
                      </div>
                    </div>

                    {/* Customer & Date Info Strip */}
                    <div className="bg-gray-50/80 border border-gray-200/80 rounded-lg p-2.5 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-900 font-semibold truncate min-w-0">
                        <User className="w-3.5 h-3.5 text-[#093C5D] shrink-0" />
                        <span className="truncate">{customerName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500 font-medium shrink-0 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{formatDate(bill.createdAt)}</span>
                      </div>
                    </div>

                    {/* Financial Figures Grid */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg py-2 px-1">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase block">Grand Total</span>
                        <span className="text-xs sm:text-sm font-semibold text-gray-900 mt-0.5 block">{formatCurrency(bill.grandTotal)}</span>
                      </div>
                      <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg py-2 px-1">
                        <span className="text-[10px] font-semibold text-emerald-700 uppercase block">Paid</span>
                        <span className="text-xs sm:text-sm font-semibold text-emerald-700 mt-0.5 block">{formatCurrency(bill.amountPaid || 0)}</span>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg py-2 px-1">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase block">Mode</span>
                        <span className="text-xs font-semibold text-gray-700 mt-0.5 block uppercase">{bill.paymentMode || 'CASH'}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2 border-t border-gray-100">
                      <button
                        onClick={() => setSelectedBill(bill)}
                        className="cursor-pointer w-full h-8.5 text-blue-700 font-semibold bg-blue-50 border border-blue-200 hover:bg-blue-100 px-3 rounded-lg inline-flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95 whitespace-nowrap shadow-none"
                      >
                        <Eye className="w-3.5 h-3.5 shrink-0" />
                        <span>Inspect Bill Breakdown</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination Bar */}
        {!isLoading && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-600 font-medium">
              Showing page <span className="font-semibold text-gray-900">{page}</span> of{' '}
              <span className="font-semibold text-gray-900">{totalPages}</span> ({totalCount} total bills)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bill Itemized Details Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-[60] overscroll-contain">
          {/* Backdrop (matching Customer pages) */}
          <div
            className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay overscroll-contain"
            onClick={() => setSelectedBill(null)}
            onWheel={(e) => e.preventDefault()}
            onTouchMove={(e) => e.preventDefault()}
          />

          {/* Mobile: bottom sheet | sm+: centered modal */}
          <div className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-center sm:justify-center sm:px-4 sm:py-8 z-[60] pointer-events-none">
            <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-gray-200 animate-modal-content overflow-hidden pointer-events-auto shadow-2xl sm:shadow-xl">

              {/* Drag handle — mobile only */}
              <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0 bg-white">
                <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white flex-shrink-0">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Invoice #{selectedBill.invoiceNumber}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Issued on {formatDate(selectedBill.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBill(null)}
                  className="cursor-pointer text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px] border border-gray-200"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {/* Merchant & Customer Info Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                      Merchant
                    </span>
                    <p className="text-sm font-semibold text-gray-900">{selectedBill.shopId?.name || '—'}</p>
                    <p className="text-xs text-gray-500">{selectedBill.shopId?.phone || selectedBill.shopId?.email || '—'}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                      Customer
                    </span>
                    <p className="text-sm font-semibold text-gray-900">{selectedBill.customerId?.name || 'Walk-in'}</p>
                    <p className="text-xs text-gray-500">{selectedBill.customerId?.phone || '—'}</p>
                  </div>
                </div>

                {/* Products Breakdown Table */}
                <div>
                  <span className="text-xs font-semibold text-gray-700 block mb-2">Itemized Products</span>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-600">
                        <tr>
                          <th className="py-2 px-3">Item</th>
                          <th className="py-2 px-3 text-center">Qty</th>
                          <th className="py-2 px-3 text-right">Rate</th>
                          <th className="py-2 px-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(selectedBill.products || []).map((p, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-medium text-gray-900">{p.name}</td>
                            <td className="py-2 px-3 text-center text-gray-600">{p.quantity}</td>
                            <td className="py-2 px-3 text-right text-gray-600">{formatCurrency(p.price)}</td>
                            <td className="py-2 px-3 text-right font-semibold text-gray-900">{formatCurrency(p.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedBill.subtotal || 0)}</span>
                  </div>
                  {selectedBill.discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Discount:</span>
                      <span>- {formatCurrency(selectedBill.discount)}</span>
                    </div>
                  )}
                  {selectedBill.tax > 0 && (
                    <div className="flex justify-between text-gray-600 font-medium">
                      <span>Tax:</span>
                      <span>+ {formatCurrency(selectedBill.tax)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-1.5 flex justify-between font-semibold text-sm text-gray-900">
                    <span>Grand Total:</span>
                    <span className="text-[#093C5D]">{formatCurrency(selectedBill.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold pt-1">
                    <span>Paid Amount:</span>
                    <span>{formatCurrency(selectedBill.amountPaid || 0)}</span>
                  </div>
                  <div className="flex justify-between text-rose-700 font-semibold">
                    <span>Pending Balance:</span>
                    <span>{formatCurrency(Math.max(0, selectedBill.grandTotal - (selectedBill.amountPaid || 0)))}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end flex-shrink-0">
                <button
                  onClick={() => setSelectedBill(null)}
                  className="cursor-pointer px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBills;
