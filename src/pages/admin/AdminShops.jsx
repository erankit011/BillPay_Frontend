import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  RotateCcw,
  SlidersHorizontal,
  Mail,
  Phone
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  getAdminShops,
  toggleShopSuspension,
  forceLogoutShop
} from '../../features/admin/api/adminApi';
import ShopDetailsModal from '../../features/admin/components/ShopDetailsModal';
import SuspendShopModal from '../../features/admin/components/SuspendShopModal';
import ForceLogoutModal from '../../features/admin/components/ForceLogoutModal';
import AdminStatCard from '../../features/admin/components/AdminStatCard';
import SwirlingLoader from '../../components/common/SwirlingLoader';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/dateUtils';

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

const AdminShops = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const urlSearch = searchParams.get('search') || '';
  const urlPlan = searchParams.get('plan') || 'All';
  const urlStatus = searchParams.get('status') || 'All';
  const urlPage = Number(searchParams.get('page')) || 1;

  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);

  // Active Modals
  const [inspectShop, setInspectShop] = useState(null);
  const [suspendModalShop, setSuspendModalShop] = useState(null);
  const [logoutModalShop, setLogoutModalShop] = useState(null);

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

  const setFilter = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === 'All') next.delete(key);
      else next.set(key, value);
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
    queryKey: ['adminShops', debouncedSearch, urlPlan, urlStatus, urlPage],
    queryFn: () =>
      getAdminShops({
        search: debouncedSearch,
        plan: urlPlan !== 'All' ? urlPlan : undefined,
        status: urlStatus !== 'All' ? urlStatus : undefined,
        page: urlPage,
        limit: 10,
      }),
    staleTime: 30 * 1000,
  });

  const shops = data?.data || [];
  const totalCount = data?.totalCount ?? shops.length;
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || urlPage;

  const activeCount = data?.activeCount ?? shops.filter((s) => !s.isSuspended).length;
  const proCount = data?.proCount ?? shops.filter((s) => s.subscriptionPlan && s.subscriptionPlan !== 'FREE').length;
  const totalUdharSum = data?.totalUdharSum ?? shops.reduce((sum, s) => sum + (s.totalUdhar || 0), 0);

  // Mutations
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">
            Merchants Directory & Stores
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed font-medium">
            View, search, and manage registered merchant shops. Audit shop data, change subscription plans, or manage account suspension.
          </p>
        </div>
      </div>

      {/* Top KPI Summary Cards */}
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

      {/* Filter Chips (Matched with Customer/Shopkeeper Pages UI) */}
      <div className="flex items-center flex-nowrap gap-2 sm:gap-3 overflow-x-auto pb-1 mb-2 sm:mb-3 w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {PLAN_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter('plan', f.value)}
            className={`shrink-0 cursor-pointer py-1.5 sm:py-2 px-3 sm:px-4 rounded-full text-[10px] sm:text-sm font-medium transition-all duration-200 border active:scale-95 select-none flex items-center justify-center whitespace-nowrap !min-h-0 !min-w-0 !h-fit ${
              urlPlan === f.value
                ? 'bg-[#093C5D] text-white border-[#093C5D] shadow-none'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-none'
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
                ? 'bg-[#093C5D] text-white border-[#093C5D] shadow-none'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-none'
            }`}
          >
            {f.label}
          </button>
        ))}

        {(urlPlan !== 'All' || urlStatus !== 'All' || searchTerm) && (
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
            placeholder="Search By Shop Name & Owner & Email & Phone"
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

      {/* Shops Table (Desktop) & Responsive Cards (Mobile) */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-none">
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <SwirlingLoader className="w-10 h-10 text-[#093C5D]" />
          </div>
        ) : shops.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-800 text-sm sm:text-base">No merchants or shops found</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              No merchant accounts match your current query or status filters. Try clearing your search or choosing "All Plans".
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View (lg+) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-gray-50/80 border-b border-gray-200">
                  <tr>
                    <th className="px-4 lg:px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[200px]">
                      Shop Name
                    </th>
                    <th className="px-4 lg:px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[140px]">
                      Owner
                    </th>
                    <th className="px-4 lg:px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[150px]">
                      Contact
                    </th>
                    <th className="px-4 lg:px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[110px]">
                      Plan
                    </th>
                    <th className="px-3 lg:px-4 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[90px]">
                      Customers
                    </th>
                    <th className="px-3 lg:px-4 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[90px]">
                      Bills Issued
                    </th>
                    <th className="px-4 lg:px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Pending Udhar
                    </th>
                    <th className="px-4 lg:px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[110px]">
                      Account Status
                    </th>
                    <th className="px-4 lg:px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[280px]">
                      Manage Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {shops.map((shop) => {
                    const isSuspended = !!shop.isSuspended;
                    const plan = shop.subscriptionPlan || 'FREE';

                    return (
                      <tr key={shop._id} className="hover:bg-gray-50/60 transition-colors">
                        {/* 1. Shop Name Column (Limited: Avatar + Name) */}
                        <td className="px-4 lg:px-5 py-3.5 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg border border-gray-200 bg-[#F5F5F5] flex items-center justify-center text-xs font-semibold text-[#093C5D] shrink-0">
                              {getInitials(shop.shopName || shop.name)}
                            </div>
                            <span className="text-sm font-semibold text-[#093C5D] truncate max-w-[220px]" title={shop.shopName || shop.name}>
                              {shop.shopName || shop.name}
                            </span>
                          </div>
                        </td>

                        {/* 2. Merchant Owner Column (Limited: Owner Name) */}
                        <td className="px-4 lg:px-5 py-3.5 align-middle">
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                            <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate max-w-[160px]" title={shop.name}>{shop.name}</span>
                          </div>
                        </td>

                        {/* 3. Contact Column (Limited: Phone with email fallback & tooltip) */}
                        <td className="px-4 lg:px-5 py-3.5 align-middle">
                          <div
                            className="flex items-center gap-1.5 text-xs font-medium text-gray-800"
                            title={shop.email ? `Email: ${shop.email}` : undefined}
                          >
                            {shop.phone ? (
                              <>
                                <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span>+91 {shop.phone}</span>
                              </>
                            ) : (
                              <>
                                <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="truncate max-w-[170px]">{shop.email || 'N/A'}</span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* 4. Plan Column (Limited: Badge only) */}
                        <td className="px-4 lg:px-5 py-3.5 align-middle text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide border ${getPlanBadge(
                              plan
                            )}`}
                          >
                            {plan}
                          </span>
                        </td>

                        {/* 5. Customers Column */}
                        <td className="px-3 lg:px-4 py-3.5 align-middle text-center">
                          <span className="text-sm font-semibold text-gray-900">
                            {shop.customerCount ?? 0}
                          </span>
                        </td>

                        {/* 6. Bills Column */}
                        <td className="px-3 lg:px-4 py-3.5 align-middle text-center">
                          <span className="text-sm font-semibold text-gray-900">
                            {shop.billCount ?? shop.billsCount ?? 0}
                          </span>
                        </td>

                        {/* 7. Pending Udhar Column */}
                        <td className="px-4 lg:px-5 py-3.5 align-middle text-right">
                          <span className="text-sm font-semibold text-red-700">
                            {formatCurrency(shop.totalUdhar ?? 0)}
                          </span>
                        </td>

                        {/* 8. Status Column */}
                        <td className="px-4 lg:px-5 py-3.5 align-middle text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide border ${
                              isSuspended
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-green-50 text-green-700 border-green-200'
                            }`}
                          >
                            {isSuspended ? 'Suspended' : 'Active'}
                          </span>
                        </td>

                        {/* 9. Action Buttons */}
                        <td className="px-4 lg:px-5 py-3.5 align-middle text-right">
                          <div className="inline-flex items-center justify-end gap-2">
                            {/* Inspect */}
                            <button
                              onClick={() => setInspectShop(shop)}
                              className="cursor-pointer h-8 px-2.5 sm:px-3 text-blue-700 font-semibold bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded inline-flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95 whitespace-nowrap shadow-none"
                              title="Inspect full shop profile, activity and customer metrics"
                            >
                              <Eye className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                              <span className="leading-none">Inspect</span>
                            </button>


                            {/* Suspend / Restore */}
                            <button
                              onClick={() => setSuspendModalShop(shop)}
                              className={`cursor-pointer h-8 px-2.5 sm:px-3 font-semibold rounded inline-flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95 whitespace-nowrap shadow-none ${
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

                            {/* Force Logout */}
                            <button
                              type="button"
                              onClick={() => handleOpenLogoutModal(shop)}
                              disabled={forceLogoutMutation.isPending}
                              className="cursor-pointer h-8 px-2.5 sm:px-3 text-gray-700 font-semibold bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded inline-flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95 whitespace-nowrap shadow-none disabled:opacity-50"
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

            {/* Mobile & Tablet Responsive Cards (<lg) */}
            <div className="lg:hidden p-3 sm:p-4 space-y-3.5 divide-y divide-gray-100">
              {shops.map((shop) => {
                const isSuspended = !!shop.isSuspended;
                const plan = shop.subscriptionPlan || 'FREE';

                return (
                  <div
                    key={shop._id}
                    className="bg-white border border-gray-200 rounded-lg p-3.5 sm:p-4 space-y-3 shadow-none pt-3 first:pt-0"
                  >
                    {/* Header: Shop Avatar, Name & Status Badges (Limited Info) */}
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg border border-gray-200 bg-[#F5F5F5] flex items-center justify-center text-xs font-semibold text-[#093C5D] shrink-0">
                          {getInitials(shop.shopName || shop.name)}
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 truncate" title={shop.shopName || shop.name}>
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

                    {/* Merchant Details Info Strip (Limited: Owner & Phone) */}
                    <div className="bg-gray-50/80 border border-gray-200/80 rounded-lg p-2.5 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-900 font-semibold truncate min-w-0">
                        <User className="w-3.5 h-3.5 text-[#093C5D] shrink-0" />
                        <span className="truncate">{shop.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-700 font-medium shrink-0">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{shop.phone ? `+91 ${shop.phone}` : (shop.email || 'N/A')}</span>
                      </div>
                    </div>

                    {/* 3 Metric Pills */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg py-2 px-1">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase flex items-center justify-center gap-1">
                          <Users className="w-3 h-3 text-[#093C5D]" />
                          <span>Customers</span>
                        </span>
                        <span className="text-sm font-semibold text-gray-900 mt-0.5 block">{shop.customerCount ?? 0}</span>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg py-2 px-1">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase flex items-center justify-center gap-1">
                          <FileText className="w-3 h-3 text-[#093C5D]" />
                          <span>Bills</span>
                        </span>
                        <span className="text-sm font-semibold text-gray-900 mt-0.5 block">{shop.billCount ?? shop.billsCount ?? 0}</span>
                      </div>
                      <div className="bg-red-50/60 border border-red-200 rounded-lg py-2 px-1">
                        <span className="text-[10px] font-semibold text-red-700 uppercase flex items-center justify-center gap-1">
                          <IndianRupee className="w-3 h-3 text-red-700" />
                          <span>Udhar</span>
                        </span>
                        <span className="text-sm font-semibold text-red-700 mt-0.5 block">{formatCurrency(shop.totalUdhar ?? 0)}</span>
                      </div>
                    </div>

                    {/* Bottom Actions Grid */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => setInspectShop(shop)}
                        className="cursor-pointer w-full h-8.5 text-blue-700 font-semibold bg-blue-50 border border-blue-200 hover:bg-blue-100 px-2 rounded inline-flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95 whitespace-nowrap shadow-none"
                      >
                        <Eye className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                        <span className="leading-none">Inspect</span>
                      </button>

                      <button
                        onClick={() => setSuspendModalShop(shop)}
                        className={`cursor-pointer w-full h-8.5 font-semibold px-2 rounded inline-flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95 whitespace-nowrap shadow-none ${
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
                        className="cursor-pointer w-full h-8.5 text-gray-700 font-semibold bg-gray-50 border border-gray-200 hover:bg-gray-100 px-2 rounded inline-flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95 whitespace-nowrap shadow-none disabled:opacity-50"
                      >
                        <LogOut className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                        <span className="leading-none">Logout</span>
                      </button>
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
                  <span className="font-semibold text-gray-800">{totalPages}</span> ({totalCount} total merchants)
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="cursor-pointer p-1.5 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold px-2.5 text-gray-700">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="cursor-pointer p-1.5 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <ShopDetailsModal
        isOpen={!!inspectShop}
        onClose={() => setInspectShop(null)}
        shop={inspectShop}
        onOpenSuspendModal={(shop) => setSuspendModalShop(shop)}
        onForceLogout={(shopOrId) => {
          const target = typeof shopOrId === 'object' && shopOrId !== null
            ? shopOrId
            : (shops.find(s => s._id === shopOrId) || inspectShop || { _id: shopOrId });
          handleOpenLogoutModal(target);
        }}
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
    </div>
  );
};

export default AdminShops;
