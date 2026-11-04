/**
 * Platform-Wide Invoices Audit & Inspection Ledger
 * Global billing oversight across all merchants with customer, status, payment mode, and date filters.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
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
  ChevronDown,
  CreditCard,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';
import { getAdminBills } from '../../features/admin/api/adminApi';
import AdminStatCard from '../../features/admin/components/AdminStatCard';
import LoadMoreButton from '../../components/common/LoadMoreButton';
import SwirlingLoader from '../../components/common/SwirlingLoader';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/dateUtils';
import { getInitials } from '../../utils/stringUtils';

/**
 * AdminBills Component
 */
const AdminBills = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get('search') || '';
  const urlStatus = (searchParams.get('status') || 'ALL').toUpperCase();
  const urlPaymentMode = (searchParams.get('mode') || 'ALL').toUpperCase();

  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);
  const [selectedBill, setSelectedBill] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (searchTerm) next.set('search', searchTerm);
        else next.delete('search');
        next.delete('page');
        return next;
      }, { replace: true });
    }, 450);

    return () => clearTimeout(timer);
  }, [searchTerm, setSearchParams]);

  useEffect(() => {
    if (urlSearch !== debouncedSearch) {
      setSearchTerm(urlSearch);
      setDebouncedSearch(urlSearch);
    }
  }, [urlSearch]);

  const setFilter = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === 'All' || value === 'ALL') next.delete(key);
      else next.set(key, value.toUpperCase());
      next.delete('page');
      return next;
    }, { replace: true });
  };

  /**
   * Modal Scroll Lock Effect
   * Prevents background viewport scrolling and mobile gesture bubbling when modal is open.
   */
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

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['adminBills', debouncedSearch, urlStatus, urlPaymentMode],
    queryFn: ({ pageParam = 1 }) =>
      getAdminBills({
        page: pageParam,
        limit: 15,
        search: debouncedSearch || undefined,
        paymentStatus: urlStatus !== 'ALL' && urlStatus !== 'All' ? urlStatus : undefined,
        paymentMode: urlPaymentMode !== 'ALL' && urlPaymentMode !== 'All' ? urlPaymentMode : undefined,
      }),
    getNextPageParam: (lastPage) => (lastPage?.hasNextPage ? lastPage.currentPage + 1 : undefined),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });

  const bills = useMemo(() => {
    return data?.pages ? data.pages.flatMap((p) => p?.data || []) : [];
  }, [data]);

  const firstPage = data?.pages?.[0];
  const totalCount = firstPage?.totalCount || 0;
  const totalGMV = firstPage?.totalGMV || 0;
  const totalPaid = firstPage?.totalPaid || 0;
  const totalPending = firstPage?.totalPending || 0;

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
      {/**
       * Page Header Toolbar
       * Displays main heading and introductory explanation of system-wide billing audits.
       */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#191E2B] tracking-tight">
            Store Bills & Invoices
          </h1>
          <p className="text-[#4E5668] text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed font-medium">
            Audit all itemized bills created by merchant stores across UdharPay. Track payment settlements, cash collections, and pending customer credit.
          </p>
        </div>
      </div>

      {/**
       * KPI Stat Cards Grid
       * 4-card overview summarizing total GMV, collected revenue, outstanding credit, and invoice volume.
       */}
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

      {/**
       * Payment Status & Mode Filter Chips Bar
       * Scrollable selector allowing simultaneous status filtering and payment method segregation.
       */}
      <div className="flex items-center flex-nowrap gap-2 sm:gap-3 overflow-x-auto pb-1 mb-2 sm:mb-3 w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {[
          { label: 'All Invoices', value: 'ALL' },
          { label: 'Fully Paid', value: 'PAID' },
          { label: 'Partially Paid', value: 'PARTIAL' },
          { label: 'Unpaid (Udhar)', value: 'UNPAID' },
        ].map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter('status', f.value)}
            className={`shrink-0 cursor-pointer py-1.5 sm:py-2 px-3 sm:px-4 rounded-full text-[10px] sm:text-sm font-medium transition-all duration-200 border active:scale-95 select-none flex items-center justify-center whitespace-nowrap !min-h-0 !min-w-0 !h-fit ${
              urlStatus === f.value
                ? 'bg-[#4338CA] text-white border-[#4338CA] shadow-none'
                : 'bg-[#FBFBFC] text-[#4E5668] border-[#DCE1EA] hover:border-[#DCE1EA] hover:bg-[#F0F2F6] shadow-none'
            }`}
          >
            {f.label}
          </button>
        ))}

        <span className="w-px h-6 bg-gray-300 mx-1 shrink-0" />

        {[
          { label: 'All Modes', value: 'ALL' },
          { label: 'Cash', value: 'CASH' },
          { label: 'UPI', value: 'UPI' },
          { label: 'Credit (Udhar)', value: 'CREDIT' },
          { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
        ].map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter('mode', f.value)}
            className={`shrink-0 cursor-pointer py-1.5 sm:py-2 px-3 sm:px-4 rounded-full text-[10px] sm:text-sm font-medium transition-all duration-200 border active:scale-95 select-none flex items-center justify-center whitespace-nowrap !min-h-0 !min-w-0 !h-fit ${
              urlPaymentMode === f.value
                ? 'bg-[#4338CA] text-white border-[#4338CA] shadow-none'
                : 'bg-[#FBFBFC] text-[#4E5668] border-[#DCE1EA] hover:border-[#DCE1EA] hover:bg-[#F0F2F6] shadow-none'
            }`}
          >
            {f.label}
          </button>
        ))}

        {(urlStatus !== 'ALL' || urlPaymentMode !== 'ALL' || searchTerm) && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setDebouncedSearch('');
              setSearchParams({}, { replace: true });
            }}
            className="shrink-0 cursor-pointer py-1.5 sm:py-2 px-3 sm:px-4 rounded-full text-[10px] sm:text-sm font-medium text-[#B91C1C] bg-[#FFF1F2] border border-[#FECDD3] hover:bg-[#FEE2E2] flex items-center gap-1.5 transition-colors shadow-none"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        )}
      </div>

      {/**
       * Search Bar Input
       * Debounced search querying bill numbers, store trade names, and customer profiles.
       */}
      <div className="flex flex-col w-full mb-3 sm:mb-4">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-[#757F94]" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by invoice number, shop, or customer..."
            className="block w-full h-10 sm:h-12 pl-9 sm:pl-11 pr-10 sm:pr-12 bg-[#FBFBFC] border border-[#DCE1EA] rounded-lg text-[13px] sm:text-sm text-[#191E2B] placeholder-[#9AA4B8] focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] transition-colors duration-200 shadow-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setDebouncedSearch('');
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.delete('search');
                  next.set('page', '1');
                  return next;
                }, { replace: true });
              }}
              className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-[#757F94] hover:text-[#4E5668]"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>

      {/**
       * Bills Ledger Table Container
       * Multi-device container rendering desktop data tables and mobile bill cards.
       */}
      <div className="bg-[#FBFBFC] border border-[#DCE1EA] rounded-lg overflow-hidden shadow-none">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#757F94] gap-3">
            <SwirlingLoader className="w-8 h-8 text-[#4338CA]" />
            <p className="text-xs sm:text-sm font-medium">Loading store bills...</p>
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-rose-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-semibold">Failed to load platform bills</p>
          </div>
        ) : bills.length === 0 ? (
          <div className="py-20 text-center text-[#757F94]">
            <FileText className="w-10 h-10 mx-auto text-[#757F94] mb-3" />
            <p className="text-base font-semibold text-[#191E2B]">No Invoices or Bills Found</p>
            <p className="text-xs text-[#757F94] mt-1 font-medium">
              No customer billing transactions match your current filters. Try resetting search or switching status tabs.
            </p>
          </div>
        ) : (
          <div>
            {/**
             * Desktop Table View
             * Tabular view for md+ viewports showing invoice numbers, merchants, customers, and totals.
             */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-[#F0F2F6]/80 border-b border-[#DCE1EA] text-xs font-semibold text-[#757F94] uppercase tracking-wider">
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
                <tbody className="divide-y divide-gray-100 text-sm font-medium text-[#4E5668]">
                  {bills.map((bill) => (
                    <tr key={bill._id} className="hover:bg-[#F0F2F6]/60 transition-colors">
                      {/**
                       * Invoice Number Cell
                       * Displays invoice serial identifier with custom platform styling.
                       */}
                      <td className="py-3.5 px-4 font-semibold text-[#4338CA]">
                        #{bill.invoiceNumber}
                      </td>

                      {/**
                       * Store Name Cell
                       * Commercial trade name and avatar initials badge.
                       */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#191E2B] flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg border border-[#DCE1EA] bg-[#EEF0FB] flex items-center justify-center text-[11px] font-semibold text-[#4338CA] shrink-0">
                            {getInitials(bill.shopId?.businessName || bill.shopId?.name)}
                          </div>
                          <span className="truncate max-w-[160px]" title={bill.shopId?.businessName || bill.shopId?.name || 'Shop'}>
                            {bill.shopId?.businessName || bill.shopId?.name || 'Shop'}
                          </span>
                        </div>
                      </td>

                      {/**
                       * Merchant Owner Cell
                       * Shopkeeper personal name and verified contact telephone or email.
                       */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#191E2B] truncate max-w-[140px]" title={bill.shopId?.name}>
                          {bill.shopId?.name || 'Merchant'}
                        </div>
                        <div className="text-[11px] text-[#757F94] font-normal truncate max-w-[140px]">{bill.shopId?.phone || bill.shopId?.email || '—'}</div>
                      </td>

                      {/**
                       * Customer Profile Cell
                       * Recipient customer name and phone contact details.
                       */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#191E2B] truncate max-w-[140px]" title={bill.customerId?.name}>
                          {bill.customerId?.name || 'Walk-in Customer'}
                        </div>
                        <div className="text-[11px] text-[#757F94] font-normal truncate max-w-[140px]">{bill.customerId?.phone || '—'}</div>
                      </td>

                      {/**
                       * Grand Total Financial Figure
                       * Total gross invoice value including taxes and line items.
                       */}
                      <td className="py-3.5 px-4 text-right font-semibold text-[#191E2B]">
                        {formatCurrency(bill.grandTotal)}
                      </td>

                      {/**
                       * Amount Paid Financial Figure
                       * Cumulative amount settled by the customer for this invoice.
                       */}
                      <td className="py-3.5 px-4 text-right text-emerald-700 font-semibold">
                        {formatCurrency(bill.amountPaid || 0)}
                      </td>

                      {/**
                       * Payment Status Badge Cell
                       * Color-coded status tag indicating PAID, PARTIAL, or UNPAID.
                       */}
                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(bill.paymentStatus)}
                      </td>

                      {/**
                       * Payment Mode Indicator Cell
                       * Channel used to complete payment transaction.
                       */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-[#4E5668] border border-[#DCE1EA] uppercase">
                          {bill.paymentMode || 'CASH'}
                        </span>
                      </td>

                      {/**
                       * Bill Creation Timestamp Cell
                       * Date and time when invoice was generated by shopkeeper.
                       */}
                      <td className="py-3.5 px-4 text-left text-xs text-[#757F94] font-normal">
                        {formatDate(bill.createdAt)}
                      </td>

                      {/**
                       * Bill Inspection Action Trigger
                       * Opens itemized modal showing full line items, tax, and notes.
                       */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedBill(bill)}
                          className="cursor-pointer h-8 px-2.5 sm:px-3 text-blue-700 font-semibold bg-blue-50 border border-[#D8DCF5] hover:bg-blue-100 rounded-lg inline-flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95 whitespace-nowrap shadow-none"
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

            {/**
             * Mobile Responsive Card Stream
             * Mobile layout matching standard merchant billing view on small screens.
             */}
            <div className="md:hidden space-y-3 p-3 bg-[#F0F2F6]/50">
              {bills.map((bill) => {
                const shopName = bill.shopId?.businessName || bill.shopId?.name || 'Shop';
                const customerName = bill.customerId?.name || 'Walk-in Customer';

                return (
                  <div
                    key={bill._id}
                    className="bg-[#FBFBFC] border border-[#DCE1EA] rounded-lg p-3.5 space-y-3 shadow-none"
                  >
                    {/**
                     * Card Header
                     * Store initials, name, invoice number, and payment status badge.
                     */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg border border-[#DCE1EA] bg-[#EEF0FB] flex items-center justify-center text-xs font-semibold text-[#4338CA] shrink-0">
                          {getInitials(shopName)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs sm:text-sm font-semibold text-[#191E2B] truncate" title={shopName}>
                            {shopName}
                          </h3>
                          <span className="font-mono text-[11px] font-semibold text-[#4338CA] block">
                            #{bill.invoiceNumber}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {getStatusBadge(bill.paymentStatus)}
                      </div>
                    </div>

                    {/**
                     * Customer & Date Info Strip
                     * Contact name with calendar creation timestamp.
                     */}
                    <div className="bg-[#F0F2F6]/80 border border-[#DCE1EA]/80 rounded-lg p-2.5 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-[#191E2B] font-semibold truncate min-w-0">
                        <User className="w-3.5 h-3.5 text-[#4338CA] shrink-0" />
                        <span className="truncate">{customerName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#757F94] font-medium shrink-0 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-[#757F94] shrink-0" />
                        <span>{formatDate(bill.createdAt)}</span>
                      </div>
                    </div>

                    {/**
                     * Financial Figures Grid
                     * 3-column glance of grand total, amount paid, and payment method.
                     */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-[#F0F2F6] border border-[#DCE1EA] rounded-lg py-2 px-1">
                        <span className="text-[10px] font-semibold text-[#757F94] uppercase block">Grand Total</span>
                        <span className="text-xs sm:text-sm font-semibold text-[#191E2B] mt-0.5 block">{formatCurrency(bill.grandTotal)}</span>
                      </div>
                      <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg py-2 px-1">
                        <span className="text-[10px] font-semibold text-emerald-700 uppercase block">Paid</span>
                        <span className="text-xs sm:text-sm font-semibold text-emerald-700 mt-0.5 block">{formatCurrency(bill.amountPaid || 0)}</span>
                      </div>
                      <div className="bg-[#F0F2F6] border border-[#DCE1EA] rounded-lg py-2 px-1">
                        <span className="text-[10px] font-semibold text-[#757F94] uppercase block">Mode</span>
                        <span className="text-xs font-semibold text-[#4E5668] mt-0.5 block uppercase">{bill.paymentMode || 'CASH'}</span>
                      </div>
                    </div>

                    {/**
                     * Mobile Inspection Action Trigger
                     * Opens detailed bill modal from handheld device.
                     */}
                    <div className="pt-2 border-t border-[#E8ECF2]">
                      <button
                        onClick={() => setSelectedBill(bill)}
                        className="cursor-pointer w-full h-8.5 text-blue-700 font-semibold bg-blue-50 border border-[#D8DCF5] hover:bg-blue-100 px-3 rounded-lg inline-flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95 whitespace-nowrap shadow-none"
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

        {/**
         * Universal LoadMore Controls Bar (DRY)
         * Interactive trigger to fetch and append the next page of billing records
         */}
        <LoadMoreButton
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          currentCount={bills.length}
          totalCount={totalCount}
          pageSize={15}
          label="bills"
        />
      </div>

      {/**
       * Bill Itemized Inspection Modal
       * Detailed popup showing buyer/seller details, itemized goods, tax calculations, and payment audit.
       */}
      {selectedBill && (
        <div className="fixed inset-0 z-[60] overscroll-contain">
          {/**
           * Modal Backdrop Overlay
           * Semi-transparent overlay intercepting backdrop clicks to close.
           */}
          <div
            className="fixed inset-0 bg-[#191E2B]/50 transition-opacity animate-modal-overlay overscroll-contain"
            onClick={() => setSelectedBill(null)}
            onWheel={(e) => e.preventDefault()}
            onTouchMove={(e) => e.preventDefault()}
          />

          {/**
           * Modal Container Shell
           * Responsive drawer on mobile viewports and centered dialog on sm+ viewports.
           */}
          <div className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-center sm:justify-center sm:px-4 sm:py-8 z-[60] pointer-events-none">
            <div className="relative bg-[#FBFBFC] w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-[#DCE1EA] animate-modal-content overflow-hidden pointer-events-auto shadow-none">

              {/**
               * Mobile Touch Gesture Drag Handle
               * Visual indicator for mobile sheet dragging.
               */}
              <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0 bg-[#FBFBFC]">
                <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
              </div>

              {/**
               * Modal Header Toolbar
               * Shows invoice serial number, issuance timestamp, and close button.
               */}
              <div className="px-5 py-4 border-b border-[#E8ECF2] flex items-center justify-between bg-[#FBFBFC] flex-shrink-0">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-[#191E2B]">
                    Invoice #{selectedBill.invoiceNumber}
                  </h3>
                  <p className="text-xs text-[#757F94] mt-0.5">
                    Issued on {formatDate(selectedBill.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBill(null)}
                  className="cursor-pointer text-[#757F94] bg-[#F0F2F6] hover:bg-[#EBEEF4] hover:text-[#191E2B] w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px] border border-[#DCE1EA]"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/**
               * Modal Body Content Area
               * Contains merchant info, customer profile, itemized inventory goods, and ledger totals.
               */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {/**
                 * Merchant & Customer Context Cards
                 * Dual-column layout identifying parties involved in this transaction.
                 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#F0F2F6] border border-[#DCE1EA] rounded-lg p-3">
                    <span className="text-[11px] font-semibold text-[#757F94] uppercase tracking-wider block mb-1">
                      Merchant
                    </span>
                    <p className="text-sm font-semibold text-[#191E2B]">{selectedBill.shopId?.name || '—'}</p>
                    <p className="text-xs text-[#757F94]">{selectedBill.shopId?.phone || selectedBill.shopId?.email || '—'}</p>
                  </div>
                  <div className="bg-[#F0F2F6] border border-[#DCE1EA] rounded-lg p-3">
                    <span className="text-[11px] font-semibold text-[#757F94] uppercase tracking-wider block mb-1">
                      Customer
                    </span>
                    <p className="text-sm font-semibold text-[#191E2B]">{selectedBill.customerId?.name || 'Walk-in'}</p>
                    <p className="text-xs text-[#757F94]">{selectedBill.customerId?.phone || '—'}</p>
                  </div>
                </div>

                {/**
                 * Products Breakdown Table
                 * Itemized lines showing product name, quantity, unit rate, and total line price.
                 */}
                <div>
                  <span className="text-xs font-semibold text-[#4E5668] block mb-2">Itemized Products</span>
                  <div className="border border-[#DCE1EA] rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F0F2F6] border-b border-[#DCE1EA] font-semibold text-[#4E5668]">
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
                            <td className="py-2 px-3 font-medium text-[#191E2B]">{p.name}</td>
                            <td className="py-2 px-3 text-center text-[#4E5668]">{p.quantity}</td>
                            <td className="py-2 px-3 text-right text-[#4E5668]">{formatCurrency(p.price)}</td>
                            <td className="py-2 px-3 text-right font-semibold text-[#191E2B]">{formatCurrency(p.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/**
                 * Financial Ledger Summary
                 * Line-by-line totals showing subtotal, discounts, tax, grand total, and remaining balance.
                 */}
                <div className="bg-[#F0F2F6] border border-[#DCE1EA] rounded-lg p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#4E5668] font-medium">
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
                    <div className="flex justify-between text-[#4E5668] font-medium">
                      <span>Tax:</span>
                      <span>+ {formatCurrency(selectedBill.tax)}</span>
                    </div>
                  )}
                  <div className="border-t border-[#DCE1EA] pt-1.5 flex justify-between font-semibold text-sm text-[#191E2B]">
                    <span>Grand Total:</span>
                    <span className="text-[#4338CA]">{formatCurrency(selectedBill.grandTotal)}</span>
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

              {/**
               * Modal Footer Controls
               * Dismiss action button closing the itemized audit modal.
               */}
              <div className="px-5 py-3.5 bg-[#F0F2F6] border-t border-[#DCE1EA] flex items-center justify-end flex-shrink-0">
                <button
                  onClick={() => setSelectedBill(null)}
                  className="cursor-pointer px-4 py-2 text-xs sm:text-sm font-semibold text-[#4E5668] bg-[#FBFBFC] hover:bg-[#F0F2F6] border border-[#DCE1EA] rounded-lg transition-colors active:scale-95"
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
