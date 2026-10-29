/**
 * Administrator Executive Dashboard & Master Operations Command Center
 * Displays platform-wide KPIs, revenue trends, live merchant activity, and direct store intervention actions.
 */

import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Store,
  Users,
  FileText,
  IndianRupee,
  CreditCard,
  PieChart,
  ArrowRight,
  Clock,
  Eye,
  Receipt,
  TrendingUp,
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Link } from 'react-router-dom';
import {
  getAdminOverview,
  toggleShopSuspension,
  overrideShopPlan,
  forceLogoutShop
} from '../../features/admin/api/adminApi';
import AdminStatCard from '../../features/admin/components/AdminStatCard';
import ShopDetailsModal from '../../features/admin/components/ShopDetailsModal';
import SuspendShopModal from '../../features/admin/components/SuspendShopModal';
import PlanOverrideModal from '../../features/admin/components/PlanOverrideModal';
import ForceLogoutModal from '../../features/admin/components/ForceLogoutModal';
import SwirlingLoader from '../../components/common/SwirlingLoader';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/dateUtils';
import { getInitials } from '../../utils/stringUtils';
import toast from 'react-hot-toast';

const formatMonthYear = (val) => {
  if (!val || typeof val !== 'string') return val;
  const parts = val.split('-');
  if (parts.length === 2) {
    const yyyy = parts[0];
    const mm = parts[1].padStart(2, '0');
    return `${mm}-${yyyy}`;
  }
  return val;
};

/**
 * Interactive Growth Tooltip Component
 * Glassmorphic tooltip showing dual metrics for new store acquisition and subscription revenue.
 */
const CustomGrowthTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const revenueItem = payload.find((p) => p.dataKey === 'revenue');
  const shopsItem = payload.find((p) => p.dataKey === 'shops');

  return (
    <div className="bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-lg shadow-lg p-3 min-w-[210px] select-none animate-in fade-in zoom-in-95 duration-100">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
        <span className="text-xs font-semibold text-[#093C5D]">
          {formatMonthYear(label)}
        </span>
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 uppercase tracking-wider">
          Timeline
        </span>
      </div>

      <div className="space-y-2">
        {/**
         * New Stores Metric Row
         * Shows onboarded store volume for the hovered monthly timeline period.
         */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#093C5D] shrink-0" />
            <span className="text-gray-600 font-medium">New Stores:</span>
          </div>
          <span className="font-semibold text-gray-900">
            {shopsItem?.value || 0} {shopsItem?.value === 1 ? 'store' : 'stores'}
          </span>
        </div>

        {/**
         * Subscription Revenue Metric Row
         * Shows monetary revenue generated from plan purchases in the hovered period.
         */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0" />
            <span className="text-gray-600 font-medium">Subscription Rev:</span>
          </div>
          <span className="font-semibold text-emerald-700">
            {formatCurrency(revenueItem?.value || 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const [inspectShop, setInspectShop] = useState(null);
  const [suspendModalShop, setSuspendModalShop] = useState(null);
  const [planModalShop, setPlanModalShop] = useState(null);
  const [logoutModalShop, setLogoutModalShop] = useState(null);
  /**
   * Analytics Chart View Mode State
   * Controls display filtering between consolidated, revenue, and store creation metrics ('ALL' | 'REVENUE' | 'STORES')
   */
  const [chartViewMode, setChartViewMode] = useState('ALL');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminOverview'],
    queryFn: getAdminOverview,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const totalShops = data?.totalShops ?? 0;
  const activeSubscribers = data?.activeSubscribers ?? 0;
  const totalRevenue = data?.totalRevenue ?? 0;
  const totalBillsCount = data?.totalBillsCount ?? 0;
  const totalPlatformGMV = data?.totalPlatformGMV ?? 0;
  const totalBillPaid = data?.totalBillPaid ?? 0;
  const totalCustomersCount = data?.totalCustomersCount ?? 0;
  const totalPlatformUdhar = data?.totalPlatformUdhar ?? 0;
  const planBreakdown = data?.planBreakdown || { FREE: 0, MONTHLY: 0, QUARTERLY: 0, YEARLY: 0 };
  const recentShops = data?.recentShops || [];
  const recentBills = data?.recentBills || [];
  const recentInvoices = data?.recentInvoices || [];
  const signupTrend = data?.signupTrend || [];
  const revenueTrend = data?.revenueTrend || [];

  /**
   * Administrative Action Mutations
   * Handles remote store suspensions, plan overrides, and force-logout session purges.
   */
  const suspendMutation = useMutation({
    mutationFn: ({ shopId, isSuspended, reason }) =>
      toggleShopSuspension(shopId, { isSuspended, reason }),
    onSuccess: (res) => {
      toast.success(res.message || 'Shop suspension status updated');
      queryClient.invalidateQueries({ queryKey: ['adminOverview'] });
      setSuspendModalShop(null);
      if (inspectShop) setInspectShop(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update shop suspension');
    },
  });

  const planMutation = useMutation({
    mutationFn: ({ shopId, planData }) => overrideShopPlan(shopId, planData),
    onSuccess: (res) => {
      toast.success(res?.message || 'Shop subscription updated successfully');
      queryClient.invalidateQueries({ queryKey: ['adminOverview'] });
      queryClient.invalidateQueries({ queryKey: ['adminShops'] });
      queryClient.invalidateQueries({ queryKey: ['adminSubscriptions'] });
      setPlanModalShop(null);
      if (inspectShop) setInspectShop(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update subscription');
    },
  });

  const forceLogoutMutation = useMutation({
    mutationFn: (shopId) => forceLogoutShop(shopId),
    onSuccess: () => {
      toast.success('Shopkeeper logged out across all devices successfully');
      queryClient.invalidateQueries({ queryKey: ['adminOverview'] });
      setLogoutModalShop(null);
      if (inspectShop) setInspectShop(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to revoke sessions');
    },
  });

  /**
   * Growth Analytics Chart Dataset Memo
   * Merges merchant registration counts and subscription revenues into monthly timeline nodes.
   */
  const chartData = useMemo(() => {
    const map = new Map();
    signupTrend.forEach((item) => {
      map.set(item._id, { month: item._id, shops: item.count, revenue: 0 });
    });
    revenueTrend.forEach((item) => {
      const existing = map.get(item._id) || { month: item._id, shops: 0, revenue: 0 };
      existing.revenue = item.total || 0;
      map.set(item._id, existing);
    });

    if (map.size === 0) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      map.set(currentMonth, { month: currentMonth, shops: totalShops, revenue: totalRevenue });
    }

    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [signupTrend, revenueTrend, totalShops, totalRevenue]);

  const { totalStoresInPeriod, totalRevenueInPeriod, revTicks, shopTicks, avgRevPerStore } = useMemo(() => {
    let stores = 0;
    let rev = 0;
    let maxR = 0;
    let maxS = 0;

    chartData.forEach((d) => {
      stores += d.shops || 0;
      rev += d.revenue || 0;
      if ((d.revenue || 0) > maxR) maxR = d.revenue;
      if ((d.shops || 0) > maxS) maxS = d.shops;
    });

    const safeMaxRevenue = Math.max(maxR, 500);
    const stepRev = Math.ceil(safeMaxRevenue / 4 / 100) * 100 || 250;
    const rTicks = [0, stepRev, stepRev * 2, stepRev * 3, stepRev * 4];

    const safeMaxShops = Math.max(maxS, 4);
    const stepShops = Math.max(1, Math.ceil(safeMaxShops / 4));
    const sTicks = [0, stepShops, stepShops * 2, stepShops * 3, stepShops * 4];

    const avg = stores > 0 ? Math.round(rev / stores) : 0;

    return {
      totalStoresInPeriod: stores,
      totalRevenueInPeriod: rev,
      revTicks: rTicks,
      shopTicks: sTicks,
      avgRevPerStore: avg,
    };
  }, [chartData]);

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

  const getBillStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return (
          <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border bg-green-50 text-green-700 border-green-200">
            PAID
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border bg-amber-50 text-amber-700 border-amber-200">
            PARTIAL
          </span>
        );
      default:
        return (
          <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border bg-red-50 text-red-700 border-red-200">
            UNPAID
          </span>
        );
    }
  };

  const getInvoiceStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
        return (
          <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border bg-green-50 text-green-700 border-green-200">
            SUCCESS
          </span>
        );
      case 'pending':
        return (
          <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border bg-amber-50 text-amber-700 border-amber-200">
            PENDING
          </span>
        );
      default:
        return (
          <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border bg-red-50 text-red-700 border-red-200">
            FAILED
          </span>
        );
    }
  };

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12 pb-24 lg:pb-0">
      {/**
       * Page Header Toolbar
       * Introductory title and description of executive administrative controls.
       */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">
          Admin Dashboard Overview
        </h1>
        <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed font-medium">
          Real-time platform metrics, merchant registrations, subscription revenue, and billing activity across all stores.
        </p>
      </div>

      {/**
       * KPI Stat Cards Grid
       * 4-column overview displaying merchant count, platform GMV turnover, subscription earnings, and aggregate credit.
       */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
        <AdminStatCard
          title="REGISTERED MERCHANTS"
          value={isLoading ? '...' : totalShops}
          subtext={`${activeSubscribers} on paid plan • ${planBreakdown.FREE || 0} trial`}
          icon={Store}
          variant="primary"
          delay={0.05}
        />

        <AdminStatCard
          title="PLATFORM GMV (TURNOVER)"
          value={isLoading ? '...' : formatCurrency(totalPlatformGMV)}
          subtext={`${formatCurrency(totalBillPaid)} collected from customers`}
          icon={IndianRupee}
          variant="success"
          delay={0.1}
        />

        <AdminStatCard
          title="SUBSCRIPTION EARNINGS"
          value={isLoading ? '...' : formatCurrency(totalRevenue)}
          subtext="Merchant SaaS membership fees"
          icon={CreditCard}
          variant="primary"
          delay={0.15}
        />

        <AdminStatCard
          title="TOTAL PENDING UDHAR"
          value={isLoading ? '...' : formatCurrency(totalPlatformUdhar)}
          subtext="Customer credit owed across shops"
          icon={IndianRupee}
          variant="danger"
          delay={0.2}
        />
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-16 md:p-20 text-center shadow-none">
          <SwirlingLoader className="w-10 h-10 text-[#093C5D] mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600">Loading platform overview metrics & store insights...</p>
        </div>
      ) : isError ? (
        <div className="p-8 text-center bg-white rounded-lg border border-red-200 text-red-700 shadow-none">
          <p className="font-semibold text-sm sm:text-base">Failed to load admin overview metrics.</p>
        </div>
      ) : (
        <>
          {/**
           * Secondary Quick Metrics Bar
           * 3-tile strip showing platform bill counts, customer profiles, and active pro stores.
           */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-gray-200 rounded-lg p-3.5 flex items-center justify-between shadow-none">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#093C5D] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase block">Total Bills Issued</span>
              <span className="text-base font-semibold text-gray-900">{totalBillsCount} Invoices</span>
            </div>
          </div>
          <Link
            to="/admin/bills"
            className="text-xs font-semibold text-[#093C5D] hover:underline flex items-center gap-1"
            title="View all itemized bills across shops"
          >
            Audit Bills <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3.5 flex items-center justify-between shadow-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase block">Customer Profiles</span>
              <span className="text-base font-semibold text-gray-900">{totalCustomersCount} Buyers</span>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
            Platform-wide
          </span>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3.5 flex items-center justify-between shadow-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase block">Active Stores</span>
              <span className="text-base font-semibold text-gray-900">{totalShops} Stores ({activeSubscribers} Pro)</span>
            </div>
          </div>
          <Link
            to="/admin/shops"
            className="text-xs font-semibold text-purple-700 hover:underline flex items-center gap-1"
            title="Inspect and manage all registered merchant stores"
          >
            All Stores <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/**
       * Visual Analytics & Tier Distribution Grid
       * Houses growth trajectory chart on 2 columns alongside subscription plan share breakdown.
       */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        {/**
         * Growth Trends Composed Chart Section
         * Interactive multi-axis graph plotting new merchant registrations and subscription revenue.
         */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-none flex flex-col justify-between">
          <div>
            {/**
             * Chart Header & Segmented View Controller
             * Section title with interactive tab switcher for Combined, Revenue, or Stores perspectives.
             */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                  Store Signups & Platform Growth
                </h3>
                <p className="text-xs font-medium text-gray-500 mt-0.5">
                  Monthly trajectory of new stores onboarded & subscription revenue
                </p>
              </div>

              {/**
               * Segmented View Switcher Control
               * Toggles data series between Combined view, Revenue curve, or Store acquisition bars.
               */}
              <div
                role="tablist"
                aria-label="Filter chart by series"
                className="self-start sm:self-auto inline-flex items-center p-1 bg-gray-100 rounded-lg border border-gray-200 gap-1 text-xs shadow-none"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={chartViewMode === 'ALL'}
                  onClick={() => setChartViewMode('ALL')}
                  className={`cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all select-none shadow-none active:scale-95 ${
                    chartViewMode === 'ALL'
                      ? 'bg-white text-gray-900 border border-gray-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70 border border-transparent'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full transition-colors ${chartViewMode === 'ALL' ? 'bg-[#093C5D]' : 'bg-gray-400'}`} />
                  Combined
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={chartViewMode === 'REVENUE'}
                  onClick={() => setChartViewMode('REVENUE')}
                  className={`cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all select-none shadow-none active:scale-95 ${
                    chartViewMode === 'REVENUE'
                      ? 'bg-white text-emerald-700 border border-emerald-200'
                      : 'text-gray-600 hover:text-emerald-700 hover:bg-gray-200/70 border border-transparent'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full transition-colors ${chartViewMode === 'REVENUE' ? 'bg-[#10B981]' : 'bg-gray-400'}`} />
                  Revenue
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={chartViewMode === 'STORES'}
                  onClick={() => setChartViewMode('STORES')}
                  className={`cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all select-none shadow-none active:scale-95 ${
                    chartViewMode === 'STORES'
                      ? 'bg-white text-[#093C5D] border border-blue-200'
                      : 'text-gray-600 hover:text-[#093C5D] hover:bg-gray-200/70 border border-transparent'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full transition-colors ${chartViewMode === 'STORES' ? 'bg-[#093C5D]' : 'bg-gray-400'}`} />
                  Stores
                </button>
              </div>
            </div>

            {/**
             * Executive Stat Mini-Tiles
             * High-level summary of store volume, subscription earnings, and average revenue per store.
             */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3 sm:mb-4">
              {/**
               * Onboarded Store Volume Tile
               * Total stores registered within active analytics timeline.
               */}
              <div className="p-2.5 rounded-lg bg-gray-50/90 border border-gray-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-medium text-gray-500 tracking-wider block">Stores Onboarded</span>
                  <span className="text-sm sm:text-base font-semibold text-gray-900 mt-0.5 block">
                    {totalStoresInPeriod} {totalStoresInPeriod === 1 ? 'store' : 'stores'}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[#093C5D]/10 text-[#093C5D] flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4" />
                </div>
              </div>

              {/**
               * Subscription Earnings Tile
               * Cumulative plan billing revenue across selected interval.
               */}
              <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200/70 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-medium text-emerald-800 tracking-wider block">Subscription Revenue</span>
                  <span className="text-sm sm:text-base font-semibold text-emerald-700 mt-0.5 block">
                    {formatCurrency(totalRevenueInPeriod)}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>

              {/**
               * Average Revenue Per Store Tile
               * Average monetization calculated across registered merchant base.
               */}
              <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-200/70 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-medium text-blue-800 tracking-wider block">Avg Revenue / Store</span>
                  <span className="text-sm sm:text-base font-semibold text-[#093C5D] mt-0.5 block">
                    {formatCurrency(avgRevPerStore)}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-[#093C5D] flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/**
           * Recharts Responsive Container Canvas
           * Composed bar-area graph with dual Y axes and custom tooltips.
           */}
          <div className="h-[270px] sm:h-[310px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 12, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.28} />
                    <stop offset="60%" stopColor="#10B981" stopOpacity={0.06} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  dataKey="month"
                  stroke="#9CA3AF"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={formatMonthYear}
                  dy={4}
                />
                {/**
                 * Primary Left Y-Axis
                 * Dynamically renders revenue scale or store volume depending on active tab.
                 */}
                <YAxis
                  yAxisId="left"
                  stroke="#9CA3AF"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  ticks={chartViewMode === 'STORES' ? shopTicks : revTicks}
                  domain={[0, chartViewMode === 'STORES' ? shopTicks[4] : revTicks[4]]}
                  tickFormatter={(v) =>
                    chartViewMode === 'STORES'
                      ? `${v}`
                      : v >= 1000
                      ? `₹${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`
                      : `₹${v}`
                  }
                />
                {/**
                 * Secondary Right Y-Axis
                 * Dedicated store acquisition scale visible during combined dual-series view.
                 */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#9CA3AF"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  hide={chartViewMode !== 'ALL'}
                  ticks={shopTicks}
                  domain={[0, shopTicks[4]]}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<CustomGrowthTooltip />}
                  cursor={{ fill: 'rgba(9, 60, 93, 0.04)', radius: 6 }}
                />

                {/**
                 * Store Acquisition Bar Series
                 * Rendered as modern rounded vertical bars.
                 */}
                {(chartViewMode === 'ALL' || chartViewMode === 'STORES') && (
                  <Bar
                    yAxisId={chartViewMode === 'STORES' ? 'left' : 'right'}
                    dataKey="shops"
                    name="New Stores Onboarded"
                    fill="#093C5D"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={chartViewMode === 'STORES' ? 42 : 32}
                  />
                )}

                {/**
                 * Subscription Revenue Area Series
                 * Rendered as smooth monotone wave with soft green gradient fill.
                 */}
                {(chartViewMode === 'ALL' || chartViewMode === 'REVENUE') && (
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    name="Subscription Revenue (₹)"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    dot={{ r: 4.5, fill: '#10B981', stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ r: 6.5, fill: '#10B981', stroke: '#ffffff', strokeWidth: 2.5 }}
                    fillOpacity={1}
                    fill="url(#growthRevenueGrad)"
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/**
         * Subscription Tier Share Card
         * Displays SaaS plan tier distribution bars and paid conversion insights.
         */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-none flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                Subscription Plan Share
              </h3>
              <div className="px-2 py-0.5 rounded-lg bg-blue-50 text-[#093C5D] border border-blue-100 flex items-center gap-1.5 text-[11px] font-semibold">
                <PieChart className="w-3.5 h-3.5 text-[#093C5D]" />
                <span>SaaS Distribution</span>
              </div>
            </div>
            <p className="text-xs font-medium text-gray-500 mb-3.5">
              Active shop accounts categorized by billing plan.
            </p>

            {/**
             * Executive 3-Badge Summary Strip
             * Compact glance at total stores, paid pro members, and free trial accounts.
             */}
            <div className="grid grid-cols-3 gap-2 p-2.5 bg-gray-50/90 rounded-lg border border-gray-200/80 mb-4">
              <div className="text-center">
                <span className="text-[10px] uppercase font-medium text-gray-500 tracking-wider block">Total Stores</span>
                <span className="text-sm sm:text-base font-medium text-gray-900 mt-0.5 block">{totalShops}</span>
              </div>
              <div className="text-center border-x border-gray-200">
                <span className="text-[10px] uppercase font-medium text-emerald-700 tracking-wider block">Paid Pro</span>
                <span className="text-sm sm:text-base font-medium text-emerald-600 mt-0.5 block">{activeSubscribers}</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] uppercase font-medium text-blue-700 tracking-wider block">Free Trial</span>
                <span className="text-sm sm:text-base font-medium text-blue-600 mt-0.5 block">{planBreakdown.FREE || 0}</span>
              </div>
            </div>

            {/**
             * Plan Distribution Breakdown Rows
             * Percentage progress bars for Free, Monthly, Quarterly, and Yearly plan tiers.
             */}
            <div className="space-y-3.5">
              {/**
               * Free Plan Tier Bar
               * Complimentary 7-day trial store accounts.
               */}
              <div>
                <div className="flex justify-between items-baseline text-xs font-semibold text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5 text-[#093C5D]">
                    <span className="w-2 h-2 rounded-full bg-[#093C5D]"></span>
                    <span>Free Plan (Trial)</span>
                    <span className="text-[10px] font-medium text-gray-600 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded">7-day</span>
                  </span>
                  <span className="font-semibold text-gray-900">
                    {planBreakdown.FREE || 0} {planBreakdown.FREE === 1 ? 'shop' : 'shops'}
                    <span className="text-gray-400 font-normal ml-1">
                      ({totalShops > 0 ? Math.round(((planBreakdown.FREE || 0) / totalShops) * 100) : 0}%)
                    </span>
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#093C5D] h-2.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        totalShops > 0 ? ((planBreakdown.FREE || 0) / totalShops) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/**
               * Monthly Pro Plan Tier Bar
               * Standard 30-day recurring paid store subscriptions.
               */}
              <div>
                <div className="flex justify-between items-baseline text-xs font-semibold text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5 text-green-700">
                    <span className="w-2 h-2 rounded-full bg-green-600"></span>
                    <span>Monthly Pro</span>
                    <span className="text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">₹299/mo</span>
                  </span>
                  <span className="font-semibold text-gray-900">
                    {planBreakdown.MONTHLY || 0} {planBreakdown.MONTHLY === 1 ? 'shop' : 'shops'}
                    <span className="text-gray-400 font-normal ml-1">
                      ({totalShops > 0 ? Math.round(((planBreakdown.MONTHLY || 0) / totalShops) * 100) : 0}%)
                    </span>
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        totalShops > 0 ? ((planBreakdown.MONTHLY || 0) / totalShops) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/**
               * Quarterly Pro Plan Tier Bar
               * 90-day discounted tier subscriptions.
               */}
              <div>
                <div className="flex justify-between items-baseline text-xs font-semibold text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span>Quarterly Pro</span>
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">₹799/3mo</span>
                  </span>
                  <span className="font-semibold text-gray-900">
                    {planBreakdown.QUARTERLY || 0} {planBreakdown.QUARTERLY === 1 ? 'shop' : 'shops'}
                    <span className="text-gray-400 font-normal ml-1">
                      ({totalShops > 0 ? Math.round(((planBreakdown.QUARTERLY || 0) / totalShops) * 100) : 0}%)
                    </span>
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        totalShops > 0 ? ((planBreakdown.QUARTERLY || 0) / totalShops) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/**
               * Yearly Pro Plan Tier Bar
               * Annual recurring membership tier.
               */}
              <div>
                <div className="flex justify-between items-baseline text-xs font-semibold text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5 text-purple-700">
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                    <span>Yearly Pro</span>
                    <span className="text-[10px] font-medium text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">₹2,999/yr</span>
                  </span>
                  <span className="font-semibold text-gray-900">
                    {planBreakdown.YEARLY || 0} {planBreakdown.YEARLY === 1 ? 'shop' : 'shops'}
                    <span className="text-gray-400 font-normal ml-1">
                      ({totalShops > 0 ? Math.round(((planBreakdown.YEARLY || 0) / totalShops) * 100) : 0}%)
                    </span>
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        totalShops > 0 ? ((planBreakdown.YEARLY || 0) / totalShops) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/**
             * Paid Conversion Ratio Insight Banner
             * Visual callout displaying overall paid subscriber conversion rate.
             */}
            <div className="mt-3.5 p-2.5 bg-emerald-50/80 border border-emerald-200/90 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
                <span className="font-semibold text-emerald-950">
                  Paid Conversion: <span className="font-medium text-emerald-800">{totalShops > 0 ? Math.round((activeSubscribers / totalShops) * 100) : 0}% of shops</span>
                </span>
              </div>
              <span className="font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200 text-[11px] shrink-0">
                {activeSubscribers} / {totalShops} Active
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 mt-4">
            <Link
              to="/admin/subscriptions"
              className="cursor-pointer w-full py-2.5 px-3.5 bg-gray-50 hover:bg-blue-50/60 text-gray-700 hover:text-[#093C5D] border border-gray-200 hover:border-[#093C5D]/30 rounded-lg flex items-center justify-between text-xs font-semibold transition-all duration-200 group shadow-none"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded bg-white border border-gray-200 group-hover:border-[#093C5D]/30 flex items-center justify-center text-[#093C5D] transition-colors">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <span>Manage All Subscriptions & Invoices</span>
              </div>
              <span className="text-xs font-semibold text-gray-500 group-hover:text-[#093C5D] tracking-wider uppercase transition-colors shrink-0">
                VIEW
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/**
       * Two-Column Recent Activity Tables
       * Houses newly registered merchant stores on left and recent SaaS subscription invoices on right.
       */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/**
         * Recently Registered Merchant Stores Table Card
         * Quick glance at newly onboarded merchants with instant inspection action.
         */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-none flex flex-col justify-between h-full">
          <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-h-[78px]">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">Recently Registered Merchant Shops</h3>
              <p className="text-xs font-medium text-gray-500 mt-0.5">Latest stores onboarded to the UdharPay network</p>
            </div>
            <Link
              to="/admin/shops"
              className="cursor-pointer px-3.5 py-1.5 rounded-lg border border-gray-200 hover:border-[#093C5D]/40 bg-gray-50/80 hover:bg-blue-50/70 text-[#093C5D] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-none whitespace-nowrap shrink-0"
              title="Inspect and manage all registered merchant stores"
            >
              <span>View All Merchants</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#093C5D]" />
            </Link>
          </div>

          {recentShops.length === 0 ? (
            <div className="p-8 text-center text-gray-400 flex-1 flex flex-col items-center justify-center">
              <Store className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-medium text-gray-500">No shops registered yet. Newly onboarded stores will appear here.</p>
            </div>
          ) : (
            <>
              {/**
               * Mobile Card List View
               * Handheld cards for recently registered stores.
               */}
              <div className="block sm:hidden divide-y divide-gray-100 flex-1">
                {recentShops.map((shop) => (
                  <div key={shop._id} className="p-3.5 space-y-2.5 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg border border-gray-200 bg-[#F5F5F5] flex items-center justify-center text-xs font-semibold text-[#093C5D] shrink-0">
                          {getInitials(shop.businessName || shop.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#093C5D] truncate">{shop.businessName || shop.name}</div>
                          <div className="text-[11px] text-gray-500 font-normal truncate">{shop.name} • {shop.email}</div>
                        </div>
                      </div>
                      <span className={`shrink-0 inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${getPlanBadge(shop.subscriptionPlan)}`}>
                        {shop.subscriptionPlan || 'FREE'}
                      </span>
                    </div>
                    <div className="flex items-center justify-end pt-1">
                      <button
                        onClick={() => setInspectShop(shop)}
                        className="cursor-pointer h-7 px-2.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg inline-flex items-center gap-1 transition-all active:scale-95 shadow-none"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Shop</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/**
               * Desktop Table View
               * Multi-column table showing trade name, owner details, plan tier, and inspection triggers.
               */}
              <div className="hidden sm:block overflow-x-auto flex-1">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-gray-50/80 border-b border-gray-200 font-semibold text-gray-500 uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="py-3 px-3.5">Shop Name & Store</th>
                      <th className="py-3 px-3.5">Merchant Owner</th>
                      <th className="py-3 px-3 text-center">Subscription Tier</th>
                      <th className="py-3 px-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-xs">
                    {recentShops.map((shop) => (
                      <tr key={shop._id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-3.5 align-middle">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg border border-gray-200 bg-[#F5F5F5] flex items-center justify-center text-xs font-semibold text-[#093C5D] shrink-0">
                              {getInitials(shop.businessName || shop.name)}
                            </div>
                            <span className="text-xs sm:text-[13px] font-semibold text-[#093C5D] truncate max-w-[130px] lg:max-w-[150px]" title={shop.businessName || shop.name}>
                              {shop.businessName || shop.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 align-middle">
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-gray-900 truncate max-w-[120px] lg:max-w-[140px]" title={shop.name}>
                              {shop.name}
                            </div>
                            <div className="text-[11px] text-gray-500 font-normal truncate max-w-[120px] lg:max-w-[140px]" title={shop.email}>
                              {shop.email}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 align-middle text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${getPlanBadge(shop.subscriptionPlan)}`}>
                            {shop.subscriptionPlan || 'FREE'}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 align-middle text-right">
                          <button
                            onClick={() => setInspectShop(shop)}
                            className="cursor-pointer h-7 px-2.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg inline-flex items-center gap-1 transition-all active:scale-95 shadow-none"
                            title="Inspect full merchant details and manage store"
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
               * Store Card Footer
               * Displays store count indicator.
               */}
              <div className="p-3 sm:px-4 bg-gray-50/60 border-t border-gray-200 flex items-center text-xs text-gray-500 font-medium">
                <span>Showing {recentShops.length} registered {recentShops.length === 1 ? 'store' : 'stores'}</span>
              </div>
            </>
          )}
        </div>

        {/**
         * Recent Subscription Invoices Table Card
         * Financial transactions list logging incoming merchant subscription payments.
         */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-none flex flex-col justify-between h-full">
          <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-h-[78px]">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">Recent Subscription Invoices</h3>
              <p className="text-xs font-medium text-gray-500 mt-0.5">Live SaaS revenue receipts & membership fees collected from merchants</p>
            </div>
            <Link
              to="/admin/subscriptions"
              className="cursor-pointer px-3.5 py-1.5 rounded-lg border border-gray-200 hover:border-[#093C5D]/40 bg-gray-50/80 hover:bg-blue-50/70 text-[#093C5D] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-none whitespace-nowrap shrink-0"
              title="Audit all platform subscriptions and revenue receipts"
            >
              <span>Audit Subscriptions</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#093C5D]" />
            </Link>
          </div>

          {recentInvoices.length === 0 ? (
            <div className="p-8 text-center text-gray-400 flex-1 flex flex-col items-center justify-center">
              <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-medium text-gray-500">No subscription receipts found. New plan purchases will appear here.</p>
            </div>
          ) : (
            <>
              {/**
               * Mobile Invoice Cards
               * Handheld cards for subscription invoices.
               */}
              <div className="block sm:hidden divide-y divide-gray-100 flex-1">
                {recentInvoices.map((inv) => (
                  <div key={inv._id} className="p-3.5 space-y-2 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-[#093C5D]">
                        {inv.razorpayPaymentId || `#INV-${inv._id.toString().slice(-6).toUpperCase()}`}
                      </span>
                      {getInvoiceStatusBadge(inv.status)}
                    </div>
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <div className="min-w-0 pr-2">
                        <span className="font-semibold text-gray-900 truncate block">
                          {inv.shopId?.name || 'Merchant Store'}
                        </span>
                        <span className="text-[11px] text-gray-500 font-normal truncate block">
                          {inv.shopId?.email || 'Store Owner'} • {inv.createdAt ? formatDate(inv.createdAt) : 'Live'}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-semibold text-gray-900 text-xs sm:text-sm block">
                          {formatCurrency(inv.amount)}
                        </span>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide border mt-1 ${getPlanBadge(inv.planName || inv.shopId?.subscriptionPlan)}`}>
                          {inv.planName || inv.shopId?.subscriptionPlan || 'PRO'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/**
               * Desktop Invoices Table
               * Multi-column table of payment receipts with transaction IDs, amounts, and statuses.
               */}
              <div className="hidden sm:block overflow-x-auto flex-1">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-gray-50/80 border-b border-gray-200 font-semibold text-gray-500 uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="py-3 px-3.5">Payment ID</th>
                      <th className="py-3 px-3.5">Merchant Store</th>
                      <th className="py-3 px-3 text-center">Plan Tier</th>
                      <th className="py-3 px-3.5 text-right">Amount</th>
                      <th className="py-3 px-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-xs">
                    {recentInvoices.map((inv) => (
                      <tr key={inv._id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-3.5 align-middle">
                          <div className="font-mono text-xs font-semibold text-[#093C5D]">
                            {inv.razorpayPaymentId || `#INV-${inv._id.toString().slice(-6).toUpperCase()}`}
                          </div>
                          <div className="text-[11px] text-gray-500 font-normal">
                            {inv.createdAt ? formatDate(inv.createdAt) : 'Live'}
                          </div>
                        </td>
                        <td className="py-3 px-3.5 align-middle">
                          <div className="font-semibold text-xs text-gray-900 truncate max-w-[120px] lg:max-w-[140px]" title={inv.shopId?.name || 'Merchant Store'}>
                            {inv.shopId?.name || 'Merchant Store'}
                          </div>
                          <div className="text-[11px] text-gray-500 font-normal truncate max-w-[120px] lg:max-w-[140px]" title={inv.shopId?.email || '-'}>
                            {inv.shopId?.email || '-'}
                          </div>
                        </td>
                        <td className="py-3 px-3 align-middle text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${getPlanBadge(inv.planName || inv.shopId?.subscriptionPlan)}`}>
                            {inv.planName || inv.shopId?.subscriptionPlan || 'PRO'}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 align-middle text-right font-semibold text-gray-900">
                          {formatCurrency(inv.amount)}
                        </td>
                        <td className="py-3 px-3.5 align-middle text-center">
                          {getInvoiceStatusBadge(inv.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/**
               * Invoice Card Footer
               * Displays total invoice count indicator.
               */}
              <div className="p-3 sm:px-4 bg-gray-50/60 border-t border-gray-200 flex items-center text-xs text-gray-500 font-medium">
                <span>Showing {recentInvoices.length} recent subscription {recentInvoices.length === 1 ? 'receipt' : 'receipts'}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )}

      {/**
       * Administrative Management Modals
       * Popups for merchant store inspection, suspension toggling, plan overrides, and forced logout.
       */}
      <ShopDetailsModal
        isOpen={!!inspectShop}
        onClose={() => setInspectShop(null)}
        shop={inspectShop}
        onOpenSuspendModal={(shop) => setSuspendModalShop(shop)}
        onOpenPlanModal={(shop) => setPlanModalShop(shop)}
        onForceLogout={(shopOrId) => {
          const target = typeof shopOrId === 'object' && shopOrId !== null
            ? shopOrId
            : (inspectShop || { _id: shopOrId });
          setLogoutModalShop(target);
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

      <PlanOverrideModal
        isOpen={!!planModalShop}
        onClose={() => setPlanModalShop(null)}
        shop={planModalShop}
        isLoading={planMutation.isPending}
        onConfirm={(planData) =>
          planMutation.mutate({ shopId: planModalShop._id, planData })
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

export default AdminDashboard;
