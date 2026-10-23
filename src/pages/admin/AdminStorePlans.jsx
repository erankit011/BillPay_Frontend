import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Crown,
  Search,
  Store,
  User,
  Clock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAdminShops, overrideShopPlan } from '../../features/admin/api/adminApi';
import PlanOverrideModal from '../../features/admin/components/PlanOverrideModal';
import AdminStatCard from '../../features/admin/components/AdminStatCard';
import SwirlingLoader from '../../components/common/SwirlingLoader';
import { formatDate, isDateExpired } from '../../utils/dateUtils';

const PLAN_FILTERS = [
  { label: 'All Plans', value: 'All' },
  { label: 'Free Trial (₹0)', value: 'FREE' },
  { label: 'Monthly Pro (₹299)', value: 'MONTHLY' },
  { label: 'Quarterly Pro (₹799)', value: 'QUARTERLY' },
  { label: 'Yearly Pro (₹2999)', value: 'YEARLY' },
];

const STATUS_FILTERS = [
  { label: 'All Status', value: 'All' },
  { label: 'Active Stores', value: 'ACTIVE' },
  { label: 'Suspended Stores', value: 'SUSPENDED' },
];

const AdminStorePlans = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const urlSearch = searchParams.get('search') || '';
  const urlPlan = searchParams.get('plan') || 'All';
  const urlStatus = searchParams.get('status') || 'All';
  const urlPage = Number(searchParams.get('page')) || 1;

  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);

  // Modal state
  const [planModalShop, setPlanModalShop] = useState(null);

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

  const setPlanFilter = (plan) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (plan === 'All') next.delete('plan');
      else next.set('plan', plan);
      next.set('page', '1');
      return next;
    }, { replace: true });
  };

  const setStatusFilter = (status) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (status === 'All') next.delete('status');
      else next.set('status', status);
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

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSearchParams({}, { replace: true });
  };

  const { data, isLoading } = useQuery({
    queryKey: ['adminStorePlans', debouncedSearch, urlPlan, urlStatus, urlPage],
    queryFn: () =>
      getAdminShops({
        search: debouncedSearch,
        plan: urlPlan !== 'All' ? urlPlan : undefined,
        status: urlStatus !== 'All' ? urlStatus : undefined,
        page: urlPage,
        limit: 15,
      }),
    staleTime: 30 * 1000,
  });

  const shops = data?.data || [];
  const totalCount = data?.totalCount ?? shops.length;
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || urlPage;

  const activeCount = data?.activeCount ?? shops.filter((s) => !s.isSuspended).length;
  const proCount = data?.proCount ?? shops.filter((s) => s.subscriptionPlan && s.subscriptionPlan !== 'FREE').length;
  const freeCount = Math.max(0, totalCount - proCount);

  // Mutation for Plan Override
  const planMutation = useMutation({
    mutationFn: ({ shopId, planData }) => overrideShopPlan(shopId, planData),
    onSuccess: () => {
      toast.success('Store subscription updated successfully');
      queryClient.invalidateQueries({ queryKey: ['adminStorePlans'] });
      queryClient.invalidateQueries({ queryKey: ['adminShops'] });
      queryClient.invalidateQueries({ queryKey: ['adminSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['adminOverview'] });
      setPlanModalShop(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update store subscription');
    },
  });

  const getInitials = (name) => {
    if (!name) return 'SH';
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
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
      {/* Header (Matched exactly with Billing Receipts UI) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">
            Store Subscription Plans & Validity
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed font-medium">
            Manage merchant subscription tiers, validity extensions, and custom billing overrides across all stores.
          </p>
        </div>
      </div>

      {/* KPI Stat Cards (Matched exactly with Billing Receipts UI) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
        <AdminStatCard
          title="TOTAL STORES"
          value={totalCount}
          subtext="Total onboarded merchant accounts"
          icon={Store}
          variant="primary"
        />

        <AdminStatCard
          title="PRO SUBSCRIBERS"
          value={proCount}
          subtext="Monthly, Quarterly & Yearly plans"
          icon={Crown}
          variant="success"
        />

        <AdminStatCard
          title="FREE TRIAL STORES"
          value={freeCount}
          subtext="Standard free access tier stores"
          icon={Sparkles}
          variant="default"
        />

        <AdminStatCard
          title="ACTIVE STORES"
          value={activeCount}
          subtext="Verified operational businesses"
          icon={ShieldCheck}
          variant="default"
        />
      </div>

      {/* Filter Chips (Matched exactly with Billing Receipts UI) */}
      <div className="flex items-center flex-nowrap gap-2 sm:gap-3 overflow-x-auto pb-1 mb-2 sm:mb-3 w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {PLAN_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setPlanFilter(f.value)}
            className={`shrink-0 cursor-pointer py-1.5 sm:py-2 px-3 sm:px-4 rounded-full text-[10px] sm:text-sm font-medium transition-all duration-200 border active:scale-95 select-none flex items-center justify-center whitespace-nowrap !min-h-0 !min-w-0 !h-fit ${
              urlPlan === f.value
                ? 'bg-[#093C5D] text-white border-[#093C5D] shadow-none'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-none'
            }`}
          >
            {f.label}
          </button>
        ))}

        <div className="h-5 w-px bg-gray-200 shrink-0" />

        {STATUS_FILTERS.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={`shrink-0 cursor-pointer py-1.5 sm:py-2 px-3 sm:px-4 rounded-full text-[10px] sm:text-sm font-medium transition-all duration-200 border active:scale-95 select-none flex items-center justify-center whitespace-nowrap !min-h-0 !min-w-0 !h-fit ${
              urlStatus === s.value
                ? 'bg-[#093C5D] text-white border-[#093C5D] shadow-none'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-none'
            }`}
          >
            {s.label}
          </button>
        ))}

        {(urlPlan !== 'All' || urlStatus !== 'All' || searchTerm) && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="shrink-0 cursor-pointer py-1.5 sm:py-2 px-3 sm:px-4 rounded-full text-[10px] sm:text-sm font-medium text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 flex items-center gap-1.5 transition-colors shadow-none"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        )}
      </div>

      {/* Search Bar (Matched exactly with Billing Receipts UI) */}
      <div className="flex flex-col w-full mb-3 sm:mb-4">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search By Store Name & Owner & Email & Phone"
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

      {/* Table & Cards Container (Matched exactly with Billing Receipts UI) */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-none">
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <SwirlingLoader className="w-10 h-10 text-[#093C5D]" />
          </div>
        ) : shops.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-800 text-sm sm:text-base">No store subscription records found</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              There are no stores matching your selected plan tier or search query.
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-gray-50/80 border-b border-gray-200">
                  <tr>
                    <th className="px-4 lg:px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[200px]">
                      Store & Merchant
                    </th>
                    <th className="px-4 lg:px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[170px]">
                      Merchant Owner
                    </th>
                    <th className="px-4 lg:px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[130px]">
                      Subscription Plan
                    </th>
                    <th className="px-4 lg:px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[170px]">
                      Validity / Expiry
                    </th>
                    <th className="px-4 lg:px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Account Status
                    </th>
                    <th className="px-4 lg:px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Plan Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {shops.map((shop) => {
                    const shopName = shop.shopName || shop.businessName || shop.name || 'Shop';
                    const ownerName = shop.name || 'Merchant';
                    const plan = (shop.subscriptionPlan || 'FREE').toUpperCase();
                    const isSuspended = Boolean(shop.isSuspended);
                    const expiry = shop.currentPeriodEnd;
                    const isExpired = isDateExpired(expiry);

                    return (
                      <tr key={shop._id} className="hover:bg-gray-50/60 transition-colors">
                        {/* Store & Merchant */}
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
                          <div className="text-[11px] text-gray-500 font-normal truncate max-w-[160px]" title={shop.email}>
                            {shop.phone ? `+91 ${shop.phone}` : (shop.email || 'N/A')}
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

                        {/* Validity / Expiry */}
                        <td className="px-4 lg:px-5 py-3.5 align-middle text-left text-xs font-medium">
                          {plan === 'FREE' ? (
                            <span className="text-gray-500">Lifetime Free</span>
                          ) : expiry ? (
                            <div className="text-xs">
                              <span className={isExpired ? 'text-red-700 font-semibold' : 'text-gray-900 font-medium'}>
                                {formatDate(expiry)}
                              </span>
                              <span className="text-[11px] text-gray-400 block mt-0.5">
                                {isExpired ? 'Expired' : 'Active'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">No Expiry</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 lg:px-5 py-3.5 align-middle text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide border ${
                              isSuspended
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-green-50 text-green-700 border-green-200'
                            }`}
                          >
                            {isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-4 lg:px-5 py-3.5 align-middle text-right">
                          <button
                            type="button"
                            onClick={() => setPlanModalShop(shop)}
                            className="cursor-pointer h-8 px-2.5 sm:px-3 text-[#093C5D] font-semibold bg-[#093C5D]/10 border border-[#093C5D]/20 hover:bg-[#093C5D]/15 rounded-lg inline-flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95 whitespace-nowrap shadow-none"
                            title="Update subscription tier and billing validity"
                          >
                            <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" strokeWidth={2} />
                            <span className="leading-none">Change Plan</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards View (Clean Card Layout matching Billing Receipts) */}
            <div className="md:hidden space-y-3 p-3 bg-gray-50/50">
              {shops.map((shop) => {
                const shopName = shop.shopName || shop.businessName || shop.name || 'Shop';
                const ownerName = shop.name || 'Merchant';
                const plan = (shop.subscriptionPlan || 'FREE').toUpperCase();
                const isSuspended = Boolean(shop.isSuspended);
                const expiry = shop.currentPeriodEnd;

                return (
                  <div
                    key={shop._id}
                    className="bg-white border border-gray-200 rounded-lg p-3.5 sm:p-4 space-y-3 shadow-none pt-3 first:pt-0"
                  >
                    {/* Header: Shop Avatar, Name, ID & Badges */}
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
                            #{shop._id?.slice(-6).toUpperCase()}
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
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${
                            isSuspended
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-green-50 text-green-700 border-green-200'
                          }`}
                        >
                          {isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                        </span>
                      </div>
                    </div>

                    {/* Merchant Owner & Validity Info Strip */}
                    <div className="bg-gray-50/80 border border-gray-200/80 rounded-lg p-2.5 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-900 font-semibold truncate min-w-0">
                        <User className="w-3.5 h-3.5 text-[#093C5D] shrink-0" />
                        <span className="truncate">{ownerName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500 font-medium shrink-0 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>
                          {plan === 'FREE' ? 'Lifetime Free' : expiry ? formatDate(expiry) : 'No Expiry'}
                        </span>
                      </div>
                    </div>

                    {/* Metric Pills */}
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg py-2 px-1">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase block">Store Customers</span>
                        <span className="text-sm font-semibold text-gray-900 mt-0.5 block">{shop.customerCount ?? 0}</span>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg py-2 px-1">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase block">Merchant Contact</span>
                        <span className="text-xs font-semibold text-gray-700 mt-0.5 block truncate px-1" title={shop.email || 'N/A'}>
                          {shop.phone ? `+91 ${shop.phone}` : (shop.email || 'N/A')}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setPlanModalShop(shop)}
                        className="cursor-pointer w-full h-8.5 text-[#093C5D] font-semibold bg-[#093C5D]/10 border border-[#093C5D]/20 hover:bg-[#093C5D]/20 px-2 rounded-lg inline-flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95 whitespace-nowrap shadow-none"
                      >
                        <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" strokeWidth={2} />
                        <span className="leading-none">Change Subscription Plan</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls (Matched exactly with Billing Receipts UI) */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-t border-gray-200 bg-gray-50/60">
                <span className="text-xs text-gray-500 font-medium">
                  Showing page <span className="font-semibold text-gray-800">{currentPage}</span> of{' '}
                  <span className="font-semibold text-gray-800">{totalPages}</span> ({totalCount} total stores)
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

      {/* Plan Override Modal */}
      <PlanOverrideModal
        isOpen={!!planModalShop}
        onClose={() => setPlanModalShop(null)}
        shop={planModalShop}
        isLoading={planMutation.isPending}
        onConfirm={(planData) =>
          planMutation.mutate({ shopId: planModalShop._id, planData })
        }
      />
    </div>
  );
};

export default AdminStorePlans;
