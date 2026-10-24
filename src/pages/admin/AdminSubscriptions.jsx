import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Store,
  User,
  Phone,
  ChevronDown,
  X,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';
import { getAdminSubscriptions } from '../../features/admin/api/adminApi';
import AdminStatCard from '../../features/admin/components/AdminStatCard';
import SwirlingLoader from '../../components/common/SwirlingLoader';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/dateUtils';
import { getInitials } from '../../utils/stringUtils';

const STATUS_FILTERS = [
  { label: 'All Invoices', value: 'ALL' },
  { label: 'Paid (Successful)', value: 'SUCCESS' },
  { label: 'Pending Payment', value: 'PENDING' },
  { label: 'Failed Transactions', value: 'FAILED' },
];

const AdminSubscriptions = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get('search') || '';
  const urlStatus = (searchParams.get('status') || 'ALL').toUpperCase();
  const urlPage = Number(searchParams.get('page')) || 1;

  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (searchTerm) next.set('search', searchTerm);
        else next.delete('search');
        next.set('page', '1');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch]);

  const setStatusFilter = (status) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (status === 'ALL' || status === 'All') next.delete('status');
      else next.set('status', status.toUpperCase());
      next.set('page', '1');
      return next;
    }, { replace: true });
  };

  const handlePageChange = (newPage) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(newPage));
      return next;
    });
  };

  const { data, isLoading } = useQuery({
    queryKey: ['adminSubscriptions', debouncedSearch, urlStatus, urlPage],
    queryFn: () =>
      getAdminSubscriptions({
        search: debouncedSearch,
        status: urlStatus !== 'ALL' && urlStatus !== 'All' ? urlStatus.toLowerCase() : undefined,
        page: urlPage,
        limit: 15,
      }),
    staleTime: 30 * 1000,
  });

  const invoices = data?.data || [];
  const totalCount = data?.totalCount ?? invoices.length;
  const totalRevenue = data?.totalRevenue ?? 0;
  const paidCount = data?.totalSuccessCount ?? 0;
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || urlPage;
  const pendingOrFailed = Math.max(0, totalCount - paidCount);




  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'paid':
        return (
          <span className="inline-block px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide border bg-green-50 text-green-700 border-green-200">
            PAID
          </span>
        );
      case 'failed':
        return (
          <span className="inline-block px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide border bg-red-50 text-red-700 border-red-200">
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-block px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide border bg-amber-50 text-amber-700 border-amber-200">
            PENDING
          </span>
        );
    }
  };

  const getPlanBadge = (plan) => {
    switch (plan?.toUpperCase()) {
      case 'YEARLY':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'QUARTERLY':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'MONTHLY':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12 pb-24 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">
            Platform Subscriptions & Billing Receipts
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed font-medium">
            Track merchant subscription orders, Razorpay payment collections, plan validity, and platform revenue receipts.
          </p>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
        <AdminStatCard
          title="TOTAL REVENUE"
          value={formatCurrency(totalRevenue)}
          subtext="Net Razorpay subscription collections"
          icon={CreditCard}
          variant="success"
        />

        <AdminStatCard
          title="TOTAL INVOICES"
          value={totalCount}
          subtext="Total checkout orders generated"
          icon={Receipt}
          variant="primary"
        />

        <AdminStatCard
          title="PAID INVOICES"
          value={paidCount}
          subtext="Successfully captured subscriptions"
          icon={CheckCircle2}
          variant="success"
        />

        <AdminStatCard
          title="PENDING / FAILED"
          value={pendingOrFailed}
          subtext="Awaiting capture or abandoned orders"
          icon={Clock}
          variant="danger"
        />
      </div>

      {/* Filter Chips (Matched with Customer/Shopkeeper Pages UI) */}
      <div className="flex items-center flex-nowrap gap-2 sm:gap-3 overflow-x-auto pb-1 mb-2 sm:mb-3 w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`shrink-0 cursor-pointer py-1.5 sm:py-2 px-3 sm:px-4 rounded-full text-[10px] sm:text-sm font-medium transition-all duration-200 border active:scale-95 select-none flex items-center justify-center whitespace-nowrap !min-h-0 !min-w-0 !h-fit ${
              urlStatus === f.value
                ? 'bg-[#093C5D] text-white border-[#093C5D] shadow-none'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-none'
            }`}
          >
            {f.label}
          </button>
        ))}

        {(urlStatus !== 'ALL' || searchTerm) && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSearchParams({}, { replace: true });
            }}
            className="shrink-0 cursor-pointer py-1.5 sm:py-2 px-3 sm:px-4 rounded-full text-[10px] sm:text-sm font-medium text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 flex items-center gap-1.5 transition-colors shadow-none"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        )}
      </div>

      {/* Search Bar (Matched with Customer/Shopkeeper Pages UI) */}
      <div className="flex flex-col w-full mb-3 sm:mb-4">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search By Payment ID & Reference & Shop & Owner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full h-10 sm:h-12 pl-9 sm:pl-11 pr-10 sm:pr-12 bg-white border border-gray-300 rounded-lg text-[13px] sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200 shadow-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Table & Cards Container (Separated Shop Name and Merchant Owner Columns) */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-none">
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <SwirlingLoader className="w-10 h-10 text-[#093C5D]" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-800 text-sm sm:text-base">No subscription invoices found</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              There are no billing or payment records matching your query. Try selecting "All Invoices".
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-gray-50/80 border-b border-gray-200">
                  <tr>
                    <th className="px-4 lg:px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[150px]">
                      Payment ID
                    </th>
                    <th className="px-4 lg:px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[200px]">
                      Store & Merchant
                    </th>
                    <th className="px-4 lg:px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[170px]">
                      Merchant Owner
                    </th>
                    <th className="px-4 lg:px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[130px]">
                      Subscription Plan
                    </th>
                    <th className="px-4 lg:px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[130px]">
                      Billed Amount
                    </th>
                    <th className="px-4 lg:px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Payment Status
                    </th>
                    <th className="px-4 lg:px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[170px]">
                      Billing Date
                    </th>
                    <th className="px-4 lg:px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Receipt Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((inv) => {
                    const shopName = inv.shopId?.businessName || inv.shopId?.name || 'Shop';
                    const ownerName = inv.shopId?.name || 'Merchant';
                    const plan = inv.planName || inv.plan || 'MONTHLY';
                    const paymentId = inv.razorpayPaymentId || inv._id.slice(-8).toUpperCase();

                    return (
                      <tr key={inv._id} className="hover:bg-gray-50/60 transition-colors">
                        {/* Payment ID */}
                        <td className="px-4 lg:px-5 py-3.5 align-middle text-left">
                          <span className="font-semibold text-xs text-[#093C5D]">
                            {paymentId}
                          </span>
                        </td>

                        {/* Store & Merchant (Matching AdminShops Avatar + Name) */}
                        <td className="px-4 lg:px-5 py-3.5 align-middle text-left">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg border border-gray-200 bg-[#F5F5F5] flex items-center justify-center text-xs font-semibold text-[#093C5D] shrink-0">
                              {getInitials(shopName)}
                            </div>
                            <span className="text-sm font-semibold text-[#093C5D] truncate max-w-[200px]" title={shopName}>
                              {shopName}
                            </span>
                          </div>
                        </td>

                        {/* Merchant Owner */}
                        <td className="px-4 lg:px-5 py-3.5 align-middle text-left">
                          <div className="text-sm font-semibold text-gray-900 truncate max-w-[160px]" title={ownerName}>
                            {ownerName}
                          </div>
                          <div className="text-[11px] text-gray-500 font-normal truncate max-w-[160px]" title={inv.shopId?.email}>
                            {inv.shopId?.email || 'N/A'}
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="px-4 lg:px-5 py-3.5 align-middle text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide border ${getPlanBadge(
                              plan
                            )}`}
                          >
                            {plan}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="px-4 lg:px-5 py-3.5 align-middle text-right font-semibold text-gray-900 text-sm">
                          {formatCurrency(inv.amount ?? 0)}
                        </td>

                        {/* Status */}
                        <td className="px-4 lg:px-5 py-3.5 align-middle text-center">
                          {getStatusBadge(inv.status)}
                        </td>

                        {/* Date */}
                        <td className="px-4 lg:px-5 py-3.5 align-middle text-left text-xs text-gray-600 font-medium">
                          {formatDate(inv.createdAt)}
                        </td>

                        {/* Action */}
                        <td className="px-4 lg:px-5 py-3.5 align-middle text-right">
                          <Link
                            to={`/platform-receipt/${inv._id}`}
                            className="cursor-pointer h-8 px-2.5 sm:px-3 text-[#093C5D] font-semibold bg-[#093C5D]/10 border border-[#093C5D]/20 hover:bg-[#093C5D]/15 rounded-lg inline-flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95 whitespace-nowrap shadow-none"
                            title="View and download platform tax invoice"
                          >
                            <Receipt className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                            <span className="leading-none">Receipt</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards View (Clean Card Layout matching AdminShops) */}
            <div className="md:hidden space-y-3 p-3 bg-gray-50/50">
              {invoices.map((inv) => {
                const shopName = inv.shopId?.businessName || inv.shopId?.name || 'Shop';
                const ownerName = inv.shopId?.name || 'Merchant';
                const plan = inv.planName || inv.plan || 'MONTHLY';
                const paymentId = inv.razorpayPaymentId || inv._id.slice(-8).toUpperCase();

                return (
                  <div
                    key={inv._id}
                    className="bg-white border border-gray-200 rounded-lg p-3.5 sm:p-4 space-y-3 shadow-none pt-3 first:pt-0"
                  >
                    {/* Header: Shop Avatar, Name, Payment ID & Badges */}
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg border border-gray-200 bg-[#F5F5F5] flex items-center justify-center text-xs font-semibold text-[#093C5D] shrink-0">
                          {getInitials(shopName)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate" title={shopName}>
                            {shopName}
                          </h3>
                          <div className="text-[11px] font-semibold text-[#093C5D] truncate">
                            {paymentId}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${getPlanBadge(
                            plan
                          )}`}
                        >
                          {plan}
                        </span>
                        {getStatusBadge(inv.status)}
                      </div>
                    </div>

                    {/* Merchant Owner & Date Info Strip */}
                    <div className="bg-gray-50/80 border border-gray-200/80 rounded-lg p-2.5 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-900 font-semibold truncate min-w-0">
                        <User className="w-3.5 h-3.5 text-[#093C5D] shrink-0" />
                        <span className="truncate">{ownerName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500 font-medium shrink-0 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{formatDate(inv.createdAt)}</span>
                      </div>
                    </div>

                    {/* Metric Pills */}
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg py-2 px-1">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase block">Billed Amount</span>
                        <span className="text-sm font-semibold text-gray-900 mt-0.5 block">{formatCurrency(inv.amount ?? 0)}</span>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg py-2 px-1">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase block">Merchant Contact</span>
                        <span className="text-xs font-semibold text-gray-700 mt-0.5 block truncate px-1" title={inv.shopId?.email || 'N/A'}>
                          {inv.shopId?.phone ? `+91 ${inv.shopId.phone}` : (inv.shopId?.email || 'N/A')}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="pt-2 border-t border-gray-100">
                      <Link
                        to={`/platform-receipt/${inv._id}`}
                        className="cursor-pointer w-full h-8.5 text-[#093C5D] font-semibold bg-[#093C5D]/10 border border-[#093C5D]/20 hover:bg-[#093C5D]/20 px-2 rounded-lg inline-flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95 whitespace-nowrap shadow-none"
                      >
                        <Receipt className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                        <span className="leading-none">View Platform Receipt</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-t border-gray-200 bg-gray-50/60">
                <span className="text-xs text-gray-500 font-medium">
                  Showing page <span className="font-semibold text-gray-800">{currentPage}</span> of{' '}
                  <span className="font-semibold text-gray-800">{totalPages}</span> ({totalCount} total records)
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="cursor-pointer p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold px-2.5 text-gray-700">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="cursor-pointer p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSubscriptions;
