import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  Store,
  Search,
  User,
  Users,
  FileText,
  IndianRupee,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Crown,
  LogOut,
  BellRing,
  ChevronDown,
  X,
  RotateCcw,
  SlidersHorizontal,
  Mail,
  Phone,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  getAdminShops,
  createShopkeeper,
  toggleShopSuspension,
  forceLogoutShop,
  overrideShopPlan
} from '../../features/admin/api/adminApi';
import CreateShopkeeperModal from '../../features/admin/components/CreateShopkeeperModal';
import ShopDetailsModal from '../../features/admin/components/ShopDetailsModal';
import SuspendShopModal from '../../features/admin/components/SuspendShopModal';
import ForceLogoutModal from '../../features/admin/components/ForceLogoutModal';
import SendDirectNoticeModal from '../../features/admin/components/SendDirectNoticeModal';
import PlanOverrideModal from '../../features/admin/components/PlanOverrideModal';
import AdminStatCard from '../../features/admin/components/AdminStatCard';
import LoadMoreButton from '../../components/common/LoadMoreButton';
import SwirlingLoader from '../../components/common/SwirlingLoader';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/dateUtils';
import { getInitials } from '../../utils/stringUtils';

const PLAN_FILTERS = [
  { label: 'All Plans', value: 'ALL' },
  { label: 'Free Trial', value: 'FREE' },
  { label: 'Monthly Pro', value: 'MONTHLY' },
  { label: 'Quarterly Pro', value: 'QUARTERLY' },
  { label: 'Yearly Pro', value: 'YEARLY' },
];

const STATUS_FILTERS = [
  { label: 'All Status', value: 'ALL' },
  { label: 'Active Stores', value: 'ACTIVE' },
  { label: 'Pending Verification', value: 'PENDING_VERIFICATION' },
  { label: 'Suspended Stores', value: 'SUSPENDED' },
];

const AdminShops = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const urlSearch = searchParams.get('search') || '';
  const urlPlan = (searchParams.get('plan') || 'ALL').toUpperCase();
  const urlStatus = (searchParams.get('status') || 'ALL').toUpperCase();

  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);

  /**
   * Active Modal State Management
   * Holds current store object targeting inspect, suspend, logout, notice, or plan edit dialogs.
   */
  const [inspectShop, setInspectShop] = useState(null);
  const [suspendModalShop, setSuspendModalShop] = useState(null);
  const [logoutModalShop, setLogoutModalShop] = useState(null);
  const [noticeModalShop, setNoticeModalShop] = useState(null);
  const [planModalShop, setPlanModalShop] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
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

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['adminShops', debouncedSearch, urlPlan, urlStatus],
    queryFn: ({ pageParam = 1 }) =>
      getAdminShops({
        search: debouncedSearch,
        plan: urlPlan !== 'ALL' && urlPlan !== 'All' ? urlPlan : undefined,
        status: urlStatus !== 'ALL' && urlStatus !== 'All' ? urlStatus : undefined,
        page: pageParam,
        limit: 15,
      }),
    getNextPageParam: (lastPage) => (lastPage?.hasNextPage ? lastPage.currentPage + 1 : undefined),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });

  const shops = useMemo(() => {
    return data?.pages ? data.pages.flatMap((p) => p?.data || []) : [];
  }, [data]);

  const firstPage = data?.pages?.[0];
  const totalCount = firstPage?.totalCount ?? shops.length;
  const activeCount = firstPage?.activeCount ?? shops.filter((s) => !s.isSuspended).length;
  const proCount = firstPage?.proCount ?? shops.filter((s) => s.subscriptionPlan && s.subscriptionPlan !== 'FREE').length;
  const totalUdharSum = firstPage?.totalUdharSum ?? shops.reduce((sum, s) => sum + (s.totalUdhar || 0), 0);

  /**
   * Store Management Mutations
   * Handles plan override, account suspension, direct broadcast notice, and forced session termination.
   */
  const createMutation = useMutation({
    mutationFn: (newShopData) => createShopkeeper(newShopData),
    onSuccess: (res) => {
      toast.success(res?.message || 'Shopkeeper account created successfully');
      queryClient.invalidateQueries({ queryKey: ['adminShops'] });
      queryClient.invalidateQueries({ queryKey: ['adminOverview'] });
      setIsCreateModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create shopkeeper account');
    },
  });

  const planMutation = useMutation({
    mutationFn: ({ shopId, planData }) => overrideShopPlan(shopId, planData),
    onSuccess: (res) => {
      toast.success(res?.message || 'Store subscription updated successfully');
      queryClient.invalidateQueries({ queryKey: ['adminShops'] });
      queryClient.invalidateQueries({ queryKey: ['adminOverview'] });
      queryClient.invalidateQueries({ queryKey: ['adminSubscriptions'] });
      setPlanModalShop(null);
      if (inspectShop) setInspectShop(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update store subscription');
    },
  });

  const suspendMutation = useMutation({
    mutationFn: ({ shopId, isSuspended, reason }) =>
      toggleShopSuspension(shopId, { isSuspended, reason }),
    onSuccess: (res) => {
      toast.success(res.message || 'Shop suspension status updated');
      queryClient.invalidateQueries({ queryKey: ['adminShops'] });
      queryClient.invalidateQueries({ queryKey: ['adminOverview'] });
      setSuspendModalShop(null);
      if (inspectShop) setInspectShop(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update shop suspension');
    },
  });

  const forceLogoutMutation = useMutation({
    mutationFn: (shopId) => forceLogoutShop(shopId),
    onSuccess: () => {
      toast.success('Shopkeeper logged out across all devices successfully');
      queryClient.invalidateQueries({ queryKey: ['adminShops'] });
      queryClient.invalidateQueries({ queryKey: ['adminOverview'] });
      setLogoutModalShop(null);
      if (inspectShop) setInspectShop(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to revoke sessions');
    },
  });

  const handleOpenLogoutModal = (shop) => {
    setLogoutModalShop(shop);
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
      {/**
       * Page Header Section
       * Administrative title, merchant directory context, and store operation controls.
       */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#191E2B]">
            Merchants Directory & Stores
          </h1>
          <p className="text-[#4E5668] text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed font-medium">
            View, search, and manage registered merchant shops. Audit shop data, change subscription plans, or manage account suspension.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-lg bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-95 border border-[#4338CA] shadow-none shrink-0"
        >
          <Plus className="w-4 h-4 text-[#F4EFF3]" strokeWidth={2.5} />
          <span>Create Shopkeeper</span>
        </button>
      </div>

      {/**
       * Key Performance Indicator Cards
       * High-level metrics for registered shops, active accounts, pro subscriptions, and aggregate udhar.
       */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
        <AdminStatCard
          title="REGISTERED SHOPS"
          value={totalCount}
          subtext="Total onboarded merchant accounts"
          icon={Store}
          variant="primary"
        />
        <AdminStatCard
          title="ACTIVE STORES"
          value={activeCount}
          subtext="Verified operational businesses"
          icon={ShieldCheck}
          variant="success"
        />
        <AdminStatCard
          title="PRO SUBSCRIBERS"
          value={proCount}
          subtext="Monthly, Quarterly & Yearly plans"
          icon={Crown}
          variant="default"
        />
        <AdminStatCard
          title="PENDING STORE UDHAR"
          value={formatCurrency(totalUdharSum)}
          subtext="Total customer credit across stores"
          icon={IndianRupee}
          variant="danger"
        />
      </div>

      {/**
       * Filter Chips Bar
       * Status and subscription plan selectors with active indicator styling and reset option.
       */}
      <div className="flex items-center flex-nowrap gap-2 sm:gap-3 overflow-x-auto pb-1 mb-2 sm:mb-3 w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {PLAN_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter('plan', f.value)}
            className={`shrink-0 cursor-pointer py-1.5 sm:py-2 px-3 sm:px-4 rounded-full text-[10px] sm:text-sm font-medium transition-all duration-200 border active:scale-95 select-none flex items-center justify-center whitespace-nowrap !min-h-0 !min-w-0 !h-fit ${
              urlPlan === f.value
                ? 'bg-[#4338CA] text-white border-[#4338CA] shadow-none'
                : 'bg-[#FBFBFC] text-[#4E5668] border-[#DCE1EA] hover:border-[#DCE1EA] hover:bg-[#F0F2F6] shadow-none'
            }`}
          >
            {f.label}
          </button>
        ))}

        <span className="w-px h-6 bg-gray-300 mx-1 shrink-0" />

        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
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

        {(urlPlan !== 'ALL' || urlStatus !== 'ALL' || searchTerm) && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
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
       * Search Bar Filter
       * Full-text search input covering store name, merchant owner, email, and contact number.
       */}
      <div className="flex flex-col w-full mb-3 sm:mb-4">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-[#757F94]" />
          </div>
          <input
            type="text"
            placeholder="Search by shop name, owner, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full h-10 sm:h-12 pl-9 sm:pl-11 pr-10 sm:pr-12 bg-[#FBFBFC] border border-[#DCE1EA] rounded-lg text-[13px] sm:text-sm text-[#191E2B] placeholder:text-[#9AA4B8] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] transition-colors duration-200 shadow-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-[#757F94] hover:text-[#4E5668]"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>

      {/**
       * Stores Directory Listing
       * Renders responsive desktop table layout or adaptive mobile cards with management actions.
       */}
      <div className="bg-[#FBFBFC] border border-[#DCE1EA] rounded-lg overflow-hidden shadow-none">
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <SwirlingLoader className="w-10 h-10 text-[#4338CA]" />
          </div>
        ) : shops.length === 0 ? (
          <div className="p-12 text-center text-[#757F94]">
            <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-[#191E2B] text-sm sm:text-base">No merchants or shops found</p>
            <p className="text-xs text-[#757F94] mt-1 font-medium">
              No merchant accounts match your current query or status filters. Try clearing your search or choosing "All Plans".
            </p>
          </div>
        ) : (
          <div>
            {/**
             * Desktop Table View
             * Tabular display of merchant profiles, subscription plans, operational metrics, and actions.
             */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-[#F0F2F6]/80 border-b border-[#DCE1EA]">
                  <tr>
                    <th className="px-4 lg:px-5 py-3.5 text-xs font-semibold text-[#757F94] uppercase tracking-wider min-w-[200px]">
                      Shop Name
                    </th>
                    <th className="px-4 lg:px-5 py-3.5 text-xs font-semibold text-[#757F94] uppercase tracking-wider min-w-[140px]">
                      Owner
                    </th>
                    <th className="px-4 lg:px-5 py-3.5 text-xs font-semibold text-[#757F94] uppercase tracking-wider min-w-[150px]">
                      Contact
                    </th>
                    <th className="px-4 lg:px-5 py-3.5 text-center text-xs font-semibold text-[#757F94] uppercase tracking-wider min-w-[110px]">
                      Plan
                    </th>
                    <th className="px-3 lg:px-4 py-3.5 text-center text-xs font-semibold text-[#757F94] uppercase tracking-wider min-w-[90px]">
                      Customers
                    </th>
                    <th className="px-3 lg:px-4 py-3.5 text-center text-xs font-semibold text-[#757F94] uppercase tracking-wider min-w-[90px]">
                      Bills Issued
                    </th>
                    <th className="px-4 lg:px-5 py-3.5 text-right text-xs font-semibold text-[#757F94] uppercase tracking-wider min-w-[120px]">
                      Pending Udhar
                    </th>
                    <th className="px-4 lg:px-5 py-3.5 text-center text-xs font-semibold text-[#757F94] uppercase tracking-wider min-w-[110px]">
                      Account Status
                    </th>
                    <th className="px-4 lg:px-5 py-3.5 text-right text-xs font-semibold text-[#757F94] uppercase tracking-wider min-w-[360px]">
                      Manage Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {shops.map((shop) => {
                    const isSuspended = !!shop.isSuspended;
                    const plan = shop.subscriptionPlan || 'FREE';

                    return (
                      <tr key={shop._id} className="hover:bg-[#F0F2F6]/60 transition-colors">
                        {/**
                         * Shop Name & Avatar Column
                         * Displays shop branding initials badge and merchant business title.
                         */}
                        <td className="px-4 lg:px-5 py-3.5 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg border border-[#DCE1EA] bg-[#EEF0FB] flex items-center justify-center text-xs font-semibold text-[#4338CA] shrink-0">
                              {getInitials(shop.shopName || shop.name)}
                            </div>
                            <span className="text-sm font-semibold text-[#4338CA] truncate max-w-[220px]" title={shop.shopName || shop.name}>
                              {shop.shopName || shop.name}
                            </span>
                          </div>
                        </td>

                        {/**
                         * Merchant Owner Column
                         * Displays owner identity icon and registered merchant full name.
                         */}
                        <td className="px-4 lg:px-5 py-3.5 align-middle">
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-[#191E2B]">
                            <User className="w-3.5 h-3.5 text-[#757F94] shrink-0" />
                            <span className="truncate max-w-[160px]" title={shop.name}>{shop.name}</span>
                          </div>
                        </td>

                        {/**
                         * Contact Information Column
                         * Shows verified phone number with fallback email address.
                         */}
                        <td className="px-4 lg:px-5 py-3.5 align-middle">
                          <div
                            className="flex items-center gap-1.5 text-xs font-medium text-[#191E2B]"
                            title={shop.email ? `Email: ${shop.email}` : undefined}
                          >
                            {shop.phone ? (
                              <>
                                <Phone className="w-3.5 h-3.5 text-[#757F94] shrink-0" />
                                <span>+91 {shop.phone}</span>
                              </>
                            ) : (
                              <>
                                <Mail className="w-3.5 h-3.5 text-[#757F94] shrink-0" />
                                <span className="truncate max-w-[170px]">{shop.email || 'N/A'}</span>
                              </>
                            )}
                          </div>
                        </td>

                        {/**
                         * Subscription Plan Tier Badge
                         * Visual badge indicator showing store's active subscription tier.
                         */}
                        <td className="px-4 lg:px-5 py-3.5 align-middle text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide border ${getPlanBadge(
                              plan
                            )}`}
                          >
                            {plan}
                          </span>
                        </td>

                        {/**
                         * Registered Customers Count
                         * Aggregate number of customer ledger profiles under this store.
                         */}
                        <td className="px-3 lg:px-4 py-3.5 align-middle text-center">
                          <span className="text-sm font-semibold text-[#191E2B]">
                            {shop.customerCount ?? 0}
                          </span>
                        </td>

                        {/**
                         * Invoices Generated Count
                         * Total bills and invoices recorded by the merchant.
                         */}
                        <td className="px-3 lg:px-4 py-3.5 align-middle text-center">
                          <span className="text-sm font-semibold text-[#191E2B]">
                            {shop.billCount ?? shop.billsCount ?? 0}
                          </span>
                        </td>

                        {/**
                         * Outstanding Udhar Balance
                         * Aggregate pending customer credit amount owed to the merchant.
                         */}
                        <td className="px-4 lg:px-5 py-3.5 align-middle text-right">
                          <span className="text-sm font-semibold text-red-700">
                            {formatCurrency(shop.totalUdhar ?? 0)}
                          </span>
                        </td>

                        {/**
                         * Account Status Badge
                         * Indicates whether the shop account is active, pending verification, or suspended.
                         */}
                        <td className="px-4 lg:px-5 py-3.5 align-middle text-center">
                          {isSuspended ? (
                            <span className="inline-block px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide border bg-red-50 text-red-700 border-red-200">
                              Suspended
                            </span>
                          ) : !shop.isVerified ? (
                            <span className="inline-block px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide border bg-amber-50 text-amber-700 border-amber-200">
                              Pending Verification
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide border bg-green-50 text-green-700 border-green-200">
                              Active
                            </span>
                          )}
                        </td>

                        {/**
                         * Store Management Action Toolbar
                         * Interactive buttons for inspecting, overriding plans, sending notices, and suspension.
                         */}
                        <td className="px-4 lg:px-5 py-3.5 align-middle text-right">
                          <div className="inline-flex items-center justify-end gap-2">
                            {/**
                             * Inspect Store Details
                             * Opens deep inspection drawer with store analytics and customer data.
                             */}
                            <button
                              type="button"
                              onClick={() => setInspectShop(shop)}
                              className="cursor-pointer h-8 px-2.5 sm:px-3 text-[#4338CA] font-semibold bg-[#EEF0FB] border border-[#D8DCF5] hover:bg-[#E0E7FF] rounded-lg inline-flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95 whitespace-nowrap shadow-none"
                              title="Inspect full shop profile, activity and customer metrics"
                            >
                              <Eye className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                              <span className="leading-none">Inspect</span>
                            </button>

                            {/**
                             * Override Subscription Plan
                             * Opens dialog to upgrade, downgrade, or manually extend store plan.
                             */}
                            <button
                              type="button"
                              onClick={() => setPlanModalShop(shop)}
                              className="cursor-pointer h-8 px-2.5 sm:px-3 text-[#B45309] font-semibold bg-[#FEF3C7] border border-[#FDE68A] hover:bg-[#FDE68A]/70 rounded-lg inline-flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95 whitespace-nowrap shadow-none"
                              title="Change, upgrade or extend merchant subscription plan"
                            >
                              <Crown className="w-3.5 h-3.5 shrink-0 text-amber-600" strokeWidth={2} />
                              <span className="leading-none">Plan</span>
                            </button>

                            {/**
                             * Send Direct Notice
                             * Opens modal to deliver official targeted broadcast notice to store dashboard.
                             */}
                            <button
                              type="button"
                              onClick={() => setNoticeModalShop(shop)}
                              className="cursor-pointer h-8 px-2.5 sm:px-3 text-[#4338CA] font-semibold bg-[#EEF0FB] border border-[#D8DCF5] hover:bg-[#E0E7FF] rounded-lg inline-flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95 whitespace-nowrap shadow-none"
                              title="Send official direct notice to this store"
                            >
                              <BellRing className="w-3.5 h-3.5 shrink-0 text-[#4338CA]" strokeWidth={2} />
                              <span className="leading-none">Notice</span>
                            </button>

                            {/**
                             * Suspend or Reactivate Account
                             * Toggles store account suspension state and billing access.
                             */}
                            <button
                              onClick={() => setSuspendModalShop(shop)}
                              className={`cursor-pointer h-8 px-2.5 sm:px-3 font-semibold rounded-lg inline-flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95 whitespace-nowrap shadow-none ${
                                isSuspended
                                  ? 'text-green-700 bg-green-50 border border-green-200 hover:bg-green-100'
                                  : 'text-red-700 bg-red-50 border border-red-200 hover:bg-red-100'
                              }`}
                              title={isSuspended ? 'Reactivate shop and restore portal access' : 'Suspend shop account and block billing access'}
                            >
                              {isSuspended ? (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                                  <span className="leading-none">Restore</span>
                                </>
                              ) : (
                                <>
                                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                                  <span className="leading-none">Suspend</span>
                                </>
                              )}
                            </button>

                            {/**
                             * Terminate Active Sessions
                             * Forcibly invalidates all active JWT login sessions for this merchant.
                             */}
                            <button
                              type="button"
                              onClick={() => handleOpenLogoutModal(shop)}
                              disabled={forceLogoutMutation.isPending}
                              className="cursor-pointer h-8 px-2.5 sm:px-3 text-[#4E5668] font-semibold bg-[#F0F2F6] border border-[#DCE1EA] hover:bg-[#E0E4FA] rounded-lg inline-flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95 whitespace-nowrap shadow-none disabled:opacity-50"
                              title="Forcibly terminate shopkeeper sessions across all devices"
                            >
                              <LogOut className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                              <span className="leading-none">Logout</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/**
             * Mobile & Tablet Responsive Cards
             * Compact card layout for touch devices displaying store details and quick actions.
             */}
            <div className="lg:hidden p-3 sm:p-4 space-y-3.5 divide-y divide-gray-100">
              {shops.map((shop) => {
                const isSuspended = !!shop.isSuspended;
                const plan = shop.subscriptionPlan || 'FREE';

                return (
                  <div
                    key={shop._id}
                    className="bg-[#FBFBFC] border border-[#DCE1EA] rounded-lg p-3.5 sm:p-4 space-y-3 shadow-none pt-3 first:pt-0"
                  >
                    {/**
                     * Shop Header & Status Strip
                     * Merchant initials avatar, business name, and active plan/status badges.
                     */}
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg border border-[#DCE1EA] bg-[#EEF0FB] flex items-center justify-center text-xs font-semibold text-[#4338CA] shrink-0">
                          {getInitials(shop.shopName || shop.name)}
                        </div>
                        <h3 className="text-sm font-semibold text-[#191E2B] truncate" title={shop.shopName || shop.name}>
                          {shop.shopName || shop.name}
                        </h3>
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
                          {isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </div>
                    </div>

                    {/**
                     * Merchant Contact Summary Strip
                     * Quick overview of business owner name and phone contact.
                     */}
                    <div className="bg-[#F0F2F6]/80 border border-[#DCE1EA]/80 rounded-lg p-2.5 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-[#191E2B] font-semibold truncate min-w-0">
                        <User className="w-3.5 h-3.5 text-[#4338CA] shrink-0" />
                        <span className="truncate">{shop.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#4E5668] font-medium shrink-0">
                        <Phone className="w-3.5 h-3.5 text-[#757F94] shrink-0" />
                        <span>{shop.phone ? `+91 ${shop.phone}` : (shop.email || 'N/A')}</span>
                      </div>
                    </div>

                    {/**
                     * Store Metrics Grid
                     * Compact grid displaying customer count, bill count, and outstanding udhar.
                     */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-[#F0F2F6] border border-[#DCE1EA] rounded-lg py-2 px-1">
                        <span className="text-[10px] font-semibold text-[#757F94] uppercase flex items-center justify-center gap-1">
                          <Users className="w-3 h-3 text-[#4338CA]" />
                          <span>Customers</span>
                        </span>
                        <span className="text-sm font-semibold text-[#191E2B] mt-0.5 block">{shop.customerCount ?? 0}</span>
                      </div>
                      <div className="bg-[#F0F2F6] border border-[#DCE1EA] rounded-lg py-2 px-1">
                        <span className="text-[10px] font-semibold text-[#757F94] uppercase flex items-center justify-center gap-1">
                          <FileText className="w-3 h-3 text-[#4338CA]" />
                          <span>Bills</span>
                        </span>
                        <span className="text-sm font-semibold text-[#191E2B] mt-0.5 block">{shop.billCount ?? shop.billsCount ?? 0}</span>
                      </div>
                      <div className="bg-red-50/60 border border-red-200 rounded-lg py-2 px-1">
                        <span className="text-[10px] font-semibold text-red-700 uppercase flex items-center justify-center gap-1">
                          <IndianRupee className="w-3 h-3 text-red-700" />
                          <span>Udhar</span>
                        </span>
                        <span className="text-sm font-semibold text-red-700 mt-0.5 block">{formatCurrency(shop.totalUdhar ?? 0)}</span>
                      </div>
                    </div>

                    {/**
                     * Responsive Card Action Grid
                     * Full-width action button grid for inspecting, overriding plan, and managing account.
                     */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-[#E8ECF2]">
                      <button
                        type="button"
                        onClick={() => setInspectShop(shop)}
                        className="cursor-pointer w-full h-8.5 text-[#4338CA] font-semibold bg-[#EEF0FB] border border-[#D8DCF5] hover:bg-[#E0E7FF] px-2 rounded-lg inline-flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95 whitespace-nowrap shadow-none"
                      >
                        <Eye className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                        <span className="leading-none">Inspect</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPlanModalShop(shop)}
                        className="cursor-pointer w-full h-8.5 text-[#B45309] font-semibold bg-[#FEF3C7] border border-[#FDE68A] hover:bg-[#FDE68A]/70 px-2 rounded-lg inline-flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95 whitespace-nowrap shadow-none"
                      >
                        <Crown className="w-3.5 h-3.5 shrink-0 text-amber-600" strokeWidth={2} />
                        <span className="leading-none">Plan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNoticeModalShop(shop)}
                        className="cursor-pointer w-full h-8.5 text-[#4338CA] font-semibold bg-[#EEF0FB] border border-[#D8DCF5] hover:bg-[#E0E7FF] px-2 rounded-lg inline-flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95 whitespace-nowrap shadow-none"
                      >
                        <BellRing className="w-3.5 h-3.5 shrink-0 text-[#4338CA]" strokeWidth={2} />
                        <span className="leading-none">Notice</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSuspendModalShop(shop)}
                        className={`cursor-pointer w-full h-8.5 font-semibold px-2 rounded-lg inline-flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95 whitespace-nowrap shadow-none ${
                          isSuspended
                            ? 'text-green-700 bg-green-50 border border-green-200 hover:bg-green-100'
                            : 'text-red-700 bg-red-50 border border-red-200 hover:bg-red-100'
                        }`}
                      >
                        {isSuspended ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                            <span className="leading-none">Restore</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                            <span className="leading-none">Suspend</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenLogoutModal(shop)}
                        disabled={forceLogoutMutation.isPending}
                        className="cursor-pointer w-full h-8.5 text-[#4E5668] font-semibold bg-[#F0F2F6] border border-[#DCE1EA] hover:bg-[#E0E4FA] px-2 rounded-lg inline-flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95 whitespace-nowrap shadow-none disabled:opacity-50 col-span-2 sm:col-span-1"
                      >
                        <LogOut className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                        <span className="leading-none">Logout</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/**
             * Universal LoadMore Controls Bar (DRY)
             * Interactive trigger to fetch and append the next page of merchant records
             */}
            <LoadMoreButton
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
              currentCount={shops.length}
              totalCount={totalCount}
              pageSize={15}
              label="merchants"
            />
          </div>
        )}
      </div>

      {/**
       * Administrative Store Modals
       * Inspection, suspension, plan override, direct notice, and logout confirmation dialogs.
       */}
      <ShopDetailsModal
        isOpen={!!inspectShop}
        onClose={() => setInspectShop(null)}
        shop={inspectShop}
        onOpenSuspendModal={(shop) => setSuspendModalShop(shop)}
        onOpenPlanModal={(shop) => setPlanModalShop(shop)}
        onOpenDirectNoticeModal={(shop) => setNoticeModalShop(shop)}
        onForceLogout={(shopOrId) => {
          const target = typeof shopOrId === 'object' && shopOrId !== null
            ? shopOrId
            : (shops.find(s => s._id === shopOrId) || inspectShop || { _id: shopOrId });
          handleOpenLogoutModal(target);
        }}
      />

      <PlanOverrideModal
        isOpen={!!planModalShop}
        onClose={() => setPlanModalShop(null)}
        shop={planModalShop}
        isLoading={planMutation.isPending}
        onConfirm={(planData) =>
          planMutation.mutate({ shopId: planModalShop._id, planData })
        }
      />

      <SuspendShopModal
        isOpen={!!suspendModalShop}
        onClose={() => setSuspendModalShop(null)}
        shop={suspendModalShop}
        isLoading={suspendMutation.isPending}
        onConfirm={({ isSuspended, reason }) =>
          suspendMutation.mutate({ shopId: suspendModalShop._id, isSuspended, reason })
        }
      />

      <ForceLogoutModal
        isOpen={!!logoutModalShop}
        onClose={() => setLogoutModalShop(null)}
        shop={logoutModalShop}
        isLoading={forceLogoutMutation.isPending}
        onConfirm={(shopId) => {
          const id = typeof shopId === 'object' ? shopId._id : shopId;
          forceLogoutMutation.mutate(id);
        }}
      />

      <SendDirectNoticeModal
        isOpen={!!noticeModalShop}
        onClose={() => setNoticeModalShop(null)}
        shop={noticeModalShop}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['adminShops'] });
          queryClient.invalidateQueries({ queryKey: ['adminOverview'] });
        }}
      />

      <CreateShopkeeperModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />
    </div>
  );
};

export default AdminShops;
