/**
 * Merchant Business Analytics & KPI Dashboard
 * Renders daily sales collections, outstanding debt counters, sales trend graphs,
 * quick action shortcuts, recent invoices, and pending udhar watchlists.
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../api/axios';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Wallet,
  Users,
  ChartNoAxesCombined,
  IndianRupee,
  Receipt,
  UserPlus,
  PackagePlus,
  BellRing,
  Mic,
  BarChart3,
  ArrowRight,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  ChevronRight,
  AlertCircle,
  Calendar,
  CalendarRange,
  Sparkles,
  MessageCircle,
  Phone,
  Banknote,
  QrCode,
  CreditCard,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SwirlingLoader from '../components/common/SwirlingLoader';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/dateUtils';
import { getInitials } from '../utils/stringUtils';

/**
 * Dashboard Component
 */
const Dashboard = () => {
  const { t } = useTranslation();
  const user = useSelector((state) => state.auth?.user);
  const shopName = user?.businessName || user?.name || 'UdharPay';
  const [chartTimeframe, setChartTimeframe] = useState('This Week');
  const [billFilter, setBillFilter] = useState('ALL');

  /**
   * Primary Merchant Analytics Data
   */
  const { data, isLoading } = useQuery({
    queryKey: ['dashboardAnalytics'],
    queryFn: async () => {
      const res = await api.get('/reports/dashboard');
      return res.data.data;
    },
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  /**
   * Recent Bills Data Query
   * Fetches latest 5 invoices created by merchant
   */
  const { data: recentBillsData } = useQuery({
    queryKey: ['dashboardRecentBills'],
    queryFn: async () => {
      const res = await api.get('/bills?page=1&limit=5');
      return res.data?.data?.bills || res.data?.data?.data || res.data?.data || [];
    },
    staleTime: 60 * 1000,
  });

  /**
   * Top Debtors Watchlist Query
   * Fetches top customers with pending udhar balance
   */
  const { data: topDebtorsData } = useQuery({
    queryKey: ['dashboardTopDebtors'],
    queryFn: async () => {
      const res = await api.get('/customers?page=1&limit=5&filterBalance=Pending');
      return res.data?.data?.customers || res.data?.data?.data || res.data?.data || [];
    },
    staleTime: 60 * 1000,
  });

  const recentBills = Array.isArray(recentBillsData) ? recentBillsData : [];
  const topDebtors = Array.isArray(topDebtorsData) ? topDebtorsData : [];

  const filteredBills = useMemo(() => {
    if (billFilter === 'UNPAID') {
      return recentBills.filter((b) => b.paymentStatus !== 'PAID');
    }
    if (billFilter === 'PAID') {
      return recentBills.filter((b) => b.paymentStatus === 'PAID');
    }
    return recentBills;
  }, [recentBills, billFilter]);

  const totalPendingAtRisk = useMemo(() => {
    return topDebtors.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);
  }, [topDebtors]);

  /**
   * Chart Dataset Initialization
   * Retrieves aggregated analytics or defaults to an empty dataset
   */
  const salesData = data?.chartData || [];

  /**
   * Chart Data Memoization
   * Normalizes time series date points and metrics without unnecessary recalculation
   */
  const chartData = useMemo(() => {
    return salesData.map((item) => ({
      date: item.name || item.date,
      sales: item.sales,
      collections: item.collections,
    }));
  }, [salesData]);

  const getBillStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-[#ECFDF5] text-[#0D7A57] border-[#A7F3D0]';
      case 'partial':
        return 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]';
      default:
        return 'bg-[#FFF1F2] text-[#B91C1C] border-[#FECDD3]';
    }
  };

  const getPaymentMethodBadge = (method) => {
    switch (method?.toUpperCase()) {
      case 'CASH':
        return {
          label: 'Cash',
          icon: Banknote,
          color: 'text-[#0D7A57] bg-[#ECFDF5] border-[#A7F3D0]',
        };
      case 'ONLINE':
      case 'UPI':
        return {
          label: 'UPI',
          icon: QrCode,
          color: 'text-[#4338CA] bg-[#EEF0FB] border-[#D8DCF5]',
        };
      default:
        return {
          label: 'Udhar',
          icon: CreditCard,
          color: 'text-[#B91C1C] bg-[#FFF1F2] border-[#FECDD3]',
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <SwirlingLoader className="w-10 h-10 md:w-12 md:h-12 text-[#4338CA]" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-5 md:space-y-6 pb-24 lg:pb-0">
      {/**
       * Dashboard Header Section
       * Displays primary overview title and performance tagline
       */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"
      >
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#191E2B]">
            {t('Dashboard Overview')}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[#4E5668] mt-0.5">
            {t("Here's a summary of your business performance.")}
          </p>
        </div>
      </motion.div>

      {/**
       * Business Metrics Top 4 KPI Cards (Untouched Layout & Positioning)
       * Four-card summary grid tracking daily sales, collections, pending debts, and merchant customers
       */}
      <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
        {/**
         * Today's Sales Metric Card
         * Sum of revenue earned on current day
         */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#FBFBFC] rounded-lg p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[7.5rem] sm:min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-[#DCE1EA] hover:border-[#C2C9D6] transition-all duration-200 overflow-hidden cursor-default"
        >
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg bg-[#EEF0FB] flex items-center justify-center text-[#4338CA] border border-[#D8DCF5]">
              <ChartNoAxesCombined className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-[#4E5668] mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">
              {t("Today's Sales")}
            </p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-[#191E2B] truncate">
              {formatCurrency(data?.todaySales ?? 0)}
            </p>
            <p className="text-[10px] md:text-xs text-[#0D7A57] font-medium truncate mt-0.5">
              {t("Today's Earnings")}
            </p>
          </div>
        </motion.div>

        {/**
         * Today's Collections Metric Card
         * Total cash and online debt payments collected today
         */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-[#FBFBFC] rounded-lg p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[7.5rem] sm:min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border-l-4 border-l-[#0D7A57] border-t border-t-[#DCE1EA] border-r border-r-[#DCE1EA] border-b border-b-[#DCE1EA] hover:border-r-[#C2C9D6] hover:border-t-[#C2C9D6] hover:border-b-[#DCE1EA] transition-all duration-200 overflow-hidden cursor-default"
        >
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg bg-[#ECFDF5] flex items-center justify-center text-[#0D7A57] border border-[#A7F3D0]">
              <Wallet className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-[#4E5668] mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">
              {t("Today's Collections")}
            </p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-[#0D7A57] truncate">
              {formatCurrency(data?.todayCollection ?? 0)}
            </p>
            <p className="text-[10px] md:text-xs text-[#0D7A57] font-medium truncate mt-0.5">
              {t('Collected Today')}
            </p>
          </div>
        </motion.div>

        {/**
         * Pending Udhar Debt Card
         * Highlights outstanding customer credit requiring collection
         */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#FBFBFC] rounded-lg p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[7.5rem] sm:min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border-l-4 border-l-[#E11D48] border-t border-t-[#DCE1EA] border-r border-r-[#DCE1EA] border-b border-b-[#DCE1EA] hover:border-r-[#C2C9D6] hover:border-t-[#C2C9D6] hover:border-b-[#C2C9D6] transition-all duration-200 overflow-hidden cursor-default"
        >
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg bg-[#FFF1F2] flex items-center justify-center text-[#B91C1C] border border-[#FECDD3]">
              <IndianRupee className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-[#4E5668] mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">
              {t('Pending Udhar')}
            </p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-[#B91C1C] truncate">
              {formatCurrency(data?.pendingAmount ?? 0)}
            </p>
            <p className="text-[10px] md:text-xs text-[#B91C1C] font-medium truncate mt-0.5">
              {t('Needs Collection')}
            </p>
          </div>
        </motion.div>

        {/**
         * Total Registered Customers Card
         * Total count of active customer ledgers
         */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-[#FBFBFC] rounded-lg p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[7.5rem] sm:min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-[#DCE1EA] hover:border-[#C2C9D6] transition-all duration-200 overflow-hidden cursor-default"
        >
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg bg-[#EEF0FB] flex items-center justify-center text-[#4338CA] border border-[#D8DCF5]">
              <Users className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-[#4E5668] mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">
              {t('Total Customers')}
            </p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-[#191E2B] truncate">
              {data?.totalCustomers ?? 0}
            </p>
            <p className="text-[10px] md:text-xs text-[#757F94] font-medium truncate mt-0.5">
              {t('Active Accounts')}
            </p>
          </div>
        </motion.div>
      </div>

      {/**
       * Quick Actions Hub (Streamlined, Left-Aligned with rounded-lg Outer & Inner Harmony)
       * Zero inner hover border, consistent rounded-lg radius, and clean micro-interactions
       */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="space-y-2"
      >
        <p className="text-xs md:text-sm font-semibold text-[#4E5668] uppercase tracking-wide">
          {t('Quick Actions')}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
          {[
            { to: '/bills', label: 'Create Bill', icon: Receipt },
            { to: '/customers', label: 'Add Customer', icon: UserPlus },
            { to: '/products', label: 'Add Product', icon: PackagePlus },
            { to: '/reminders', label: 'Reminders', icon: BellRing },
            { to: '/voice', label: 'Voice Entry', icon: Mic },
            { to: '/reports', label: 'Reports', icon: BarChart3 },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.to}
                to={action.to}
                className="flex items-center gap-1.5 sm:gap-2 xl:gap-2.5 px-2 sm:px-2.5 xl:px-3 py-2 sm:py-2.5 bg-[#FBFBFC] hover:bg-white border border-[#DCE1EA] hover:border-[#4338CA]/30 rounded-lg shadow-none hover:shadow-none transition-all duration-150 group text-left cursor-pointer min-w-0"
              >
                <div className="w-8 h-8 rounded-lg bg-[#EEF0FB] text-[#4338CA] flex items-center justify-center shrink-0 border border-[#D8DCF5] shadow-none">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs xl:text-sm font-semibold text-[#191E2B] group-hover:text-[#4338CA] transition-colors truncate">
                  {t(action.label)}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#9AA4B8] group-hover:text-[#4338CA] group-hover:translate-x-0.5 transition-all ml-auto shrink-0 opacity-50 group-hover:opacity-100" />
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/**
       * Historical Performance Comparison Strip (Streamlined & Theme-Aligned)
       * Matching rounded-lg outer & inner, zero inner hover border, and clean typography
       */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        <p className="text-xs md:text-sm font-semibold text-[#4E5668] uppercase tracking-wide">
          {t('Historical Sales')}
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 md:gap-3">
          {[
            {
              key: 'yesterday',
              label: 'Yesterday',
              value: data?.yesterdaySales ?? 0,
              icon: Clock,
            },
            {
              key: 'thisWeek',
              label: 'This Week',
              value: data?.weeklySales ?? 0,
              icon: Calendar,
            },
            {
              key: 'thisMonth',
              label: 'This Month',
              value: data?.monthlySales ?? 0,
              icon: CalendarRange,
            },
            {
              key: 'lifetime',
              label: 'Lifetime',
              value: data?.lifetimeSales ?? 0,
              icon: Sparkles,
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.key}
                className="flex items-center gap-2.5 sm:gap-3 px-3 py-2 sm:py-2.5 bg-[#FBFBFC] hover:bg-white border border-[#DCE1EA] hover:border-[#4338CA]/30 rounded-lg shadow-none hover:shadow-none transition-all duration-150 group cursor-default min-w-0"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#EEF0FB] text-[#4338CA] flex items-center justify-center shrink-0 border border-[#D8DCF5] shadow-none">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-[11px] text-[#757F94] font-semibold uppercase tracking-wider truncate">
                    {t(card.label)}
                  </p>
                  <p className="text-xs sm:text-sm md:text-base font-bold text-[#191E2B] group-hover:text-[#4338CA] transition-colors truncate mt-0.5">
                    {formatCurrency(card.value)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/**
       * Revenue vs Collections Bar Chart (Matching Image 1 & Image 2)
       * Clean white surface background without dirty gray fill
       */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-[#FBFBFC] rounded-lg p-4 md:p-5 border border-[#DCE1EA]"
      >
        <div className="flex flex-row justify-between items-center gap-3 mb-4">
          <div>
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-[#191E2B]">
              {t('Revenue vs Collections')}
            </h3>
            <p className="text-xs sm:text-sm font-medium text-[#4E5668]">
              {t('Weekly performance chart')}
            </p>
          </div>
          <select
            aria-label="Filter Revenue vs Collections time period"
            value={chartTimeframe}
            onChange={(e) => setChartTimeframe(e.target.value)}
            className="cursor-pointer bg-[#FBFBFC] rounded-lg text-xs sm:text-sm border border-[#DCE1EA] hover:border-[#C2C9D6] px-3 py-1.5 sm:px-4 sm:py-2 text-[#191E2B] font-medium outline-none focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] transition-colors"
          >
            <option>{t('This Week')}</option>
            <option>{t('This Month')}</option>
            <option>{t('This Year')}</option>
          </select>
        </div>

        <div className="w-full h-[240px] md:h-[280px] lg:h-[320px] pt-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart
                data={chartData}
                margin={{ top: 15, right: 15, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#DCE1EA" strokeOpacity={0.6} vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#757F94"
                  style={{ fontSize: '11px', fontWeight: '600' }}
                  axisLine={false}
                  tickLine={false}
                  padding={{ left: 20, right: 20 }}
                />
                <YAxis
                  stroke="#757F94"
                  width={45}
                  style={{ fontSize: '11px', fontWeight: '600' }}
                  tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #DCE1EA',
                    borderRadius: '8px',
                    boxShadow: 'none',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}
                  labelStyle={{
                    color: '#191E2B',
                    fontWeight: '600',
                    marginBottom: '2px',
                    fontSize: '13px',
                  }}
                  itemStyle={{
                    padding: '0',
                    fontWeight: '500',
                  }}
                  formatter={(value, name) => {
                    const label = name === 'Collections' ? t('Collections') : t('Sales');
                    return [`₹${value.toLocaleString('en-IN')}`, label];
                  }}
                  cursor={{ fill: '#EEF0FB' }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontWeight: '600' }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar
                  dataKey="collections"
                  fill="#4338CA"
                  radius={[6, 6, 0, 0]}
                  name={t('Collections')}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="sales"
                  fill="#818CF8"
                  radius={[6, 6, 0, 0]}
                  name={t('Sales')}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-[#757F94] text-sm md:text-base font-medium">{t('No data available')}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/**
       * Trend Analysis Area Charts (Matching Image 3)
       * Dual charts for 7-day sales curve and cash collection volume
       */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 lg:gap-5">
        {/**
         * Weekly Sales Trend Chart
         */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#FBFBFC] rounded-lg p-4 md:p-5 border border-[#DCE1EA]"
        >
          <div className="mb-3.5">
            <h3 className="text-base sm:text-lg font-semibold text-[#191E2B] mb-0.5">
              {t('Sales Trend')}
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#4338CA]"></div>
              <span className="text-xs md:text-sm text-[#4E5668] font-medium">{t('Sales')}</span>
            </div>
          </div>

          <div className="w-full h-[200px] md:h-[220px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={salesData} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4338CA" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DCE1EA" strokeOpacity={0.6} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#757F94', fontSize: 10, fontWeight: 600 }}
                  padding={{ left: 20, right: 20 }}
                />
                <YAxis
                  axisLine={false}
                  width={45}
                  tickLine={false}
                  tick={{ fill: '#757F94', fontSize: 10, fontWeight: 600 }}
                  tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #DCE1EA',
                    borderRadius: '8px',
                    boxShadow: 'none',
                    padding: '6px 10px',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}
                  labelStyle={{
                    color: '#191E2B',
                    fontWeight: '600',
                    marginBottom: '2px',
                    fontSize: '13px',
                  }}
                  itemStyle={{
                    padding: '0',
                    fontWeight: '500',
                  }}
                  formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, t('Sales')]}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#4338CA"
                  strokeWidth={2}
                  fill="url(#salesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/**
         * Revenue Collection Growth Chart
         */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-[#FBFBFC] rounded-lg p-4 md:p-5 border border-[#DCE1EA]"
        >
          <div className="mb-3.5">
            <h3 className="text-base sm:text-lg font-semibold text-[#191E2B] mb-0.5">
              {t('Revenue Growth')}
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#0D7A57]"></div>
              <span className="text-xs md:text-sm text-[#4E5668] font-medium">{t('Collections')}</span>
            </div>
          </div>

          <div className="w-full h-[200px] md:h-[220px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={salesData} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <defs>
                  <linearGradient id="collectionsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D7A57" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0D7A57" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DCE1EA" strokeOpacity={0.6} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#757F94', fontSize: 10, fontWeight: 600 }}
                  padding={{ left: 20, right: 20 }}
                />
                <YAxis
                  axisLine={false}
                  width={45}
                  tickLine={false}
                  tick={{ fill: '#757F94', fontSize: 10, fontWeight: 600 }}
                  tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #DCE1EA',
                    borderRadius: '8px',
                    boxShadow: 'none',
                    padding: '6px 10px',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}
                  labelStyle={{
                    color: '#191E2B',
                    fontWeight: '600',
                    marginBottom: '2px',
                    fontSize: '13px',
                  }}
                  itemStyle={{
                    padding: '0',
                    fontWeight: '500',
                  }}
                  formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, t('Collections')]}
                />
                <Area
                  type="monotone"
                  dataKey="collections"
                  stroke="#0D7A57"
                  strokeWidth={2}
                  fill="url(#collectionsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/**
       * Operational Data Hub (Industry-Grade Commercial Activity & Credit Engine)
       * Left: Interactive Invoices & Bills Hub with Real-Time Status Filtering and Payment Tags
       * Right: Smart Udhar Recovery Engine with 1-Click WhatsApp Reminders, Direct Call & Urgency Badges
       */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 lg:gap-5">
        {/**
         * Widget 1: Recent Invoices & Bills Activity
         */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#FBFBFC] hover:bg-white rounded-xl p-4 md:p-5 border border-[#DCE1EA] hover:border-[#C2C9D6] transition-all duration-150 shadow-none hover:shadow-none flex flex-col justify-between"
        >
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5 pb-3 border-b border-[#DCE1EA]">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-[#191E2B]">
                  {t('Recent Invoices & Bills')}
                </h3>
                <p className="text-xs text-[#757F94] font-medium mt-0.5">
                  {t('Latest transactions registered')}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2.5">
                {/* Segmented Filter Pills */}
                <div className="inline-flex items-center bg-[#F0F2F6] p-0.5 rounded-lg border border-[#DCE1EA]">
                  {[
                    { id: 'ALL', label: 'All' },
                    { id: 'UNPAID', label: 'Udhar' },
                    { id: 'PAID', label: 'Paid' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setBillFilter(filter.id)}
                      className={`px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        billFilter === filter.id
                          ? 'bg-white text-[#4338CA] border border-[#D8DCF5] shadow-none'
                          : 'text-[#757F94] hover:text-[#191E2B]'
                      }`}
                    >
                      {t(filter.label)}
                    </button>
                  ))}
                </div>

                <Link
                  to="/bills"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#4338CA] hover:text-[#3730A3] transition-colors shrink-0"
                >
                  <span>{t('View All')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {filteredBills.length > 0 ? (
              <div className="divide-y divide-[#E8ECF2]">
                {filteredBills.slice(0, 5).map((bill) => {
                  const customerName = bill.customerId?.name || bill.customer?.name || bill.customerName || t('Walk-in Customer');
                  const invoiceNum = bill.invoiceNumber || (bill._id ? `#${bill._id.slice(-6).toUpperCase()}` : '');
                  const status = bill.paymentStatus || 'UNPAID';
                  const methodBadge = getPaymentMethodBadge(bill.paymentMethod || (status === 'PAID' ? 'CASH' : 'CREDIT'));
                  const MethodIcon = methodBadge.icon;

                  return (
                    <Link
                      key={bill._id}
                      to="/bills"
                      className="py-2.5 flex items-center justify-between gap-3 hover:bg-[#F3F5F9]/80 rounded-lg px-2 transition-colors group cursor-pointer"
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#EEF0FB] text-[#4338CA] border border-[#D8DCF5] flex items-center justify-center text-xs font-semibold shrink-0">
                          {getInitials(customerName)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-[#191E2B] group-hover:text-[#4338CA] truncate transition-colors">
                              {customerName}
                            </p>
                            {invoiceNum && (
                              <span className="text-[10px] text-[#757F94] font-medium bg-[#F0F2F6] px-1.5 py-0.2 rounded border border-[#DCE1EA] shrink-0">
                                {invoiceNum}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-[#757F94] font-medium mt-0.5">
                            <span className="inline-flex items-center whitespace-nowrap gap-1 leading-none">
                              <Clock className="w-3 h-3 shrink-0 -translate-y-[1px]" />
                              <span>{formatDate(bill.createdAt)}</span>
                            </span>
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase border ${methodBadge.color}`}>
                              <MethodIcon className="w-2.5 h-2.5" />
                              <span>{t(methodBadge.label)}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <span className="text-xs sm:text-sm font-semibold text-[#191E2B]">
                          {formatCurrency(bill.grandTotal)}
                        </span>
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider border ${getBillStatusBadge(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <FileText className="w-8 h-8 text-[#9AA4B8] mx-auto mb-1.5" />
                <p className="text-xs text-[#757F94] font-medium">{t('No bills match selected filter')}</p>
                <Link
                  to="/bills"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#4338CA] hover:underline"
                >
                  <span>{t('Create your first bill')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/**
         * Widget 2: Smart Udhar Recovery Engine (Action Watchlist)
         */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="bg-[#FBFBFC] hover:bg-white rounded-xl p-4 md:p-5 border border-[#DCE1EA] hover:border-[#C2C9D6] transition-all duration-150 shadow-none hover:shadow-none flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3.5 pb-3 border-b border-[#DCE1EA]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-semibold text-[#191E2B]">
                    {t('Pending Udhar Watchlist')}
                  </h3>
                  {totalPendingAtRisk > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-[#FFF1F2] text-[#B91C1C] border border-[#FECDD3]">
                      {formatCurrency(totalPendingAtRisk)} {t('Pending')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#757F94] font-medium mt-0.5">
                  {t('High-priority customer credit')}
                </p>
              </div>
              <Link
                to="/customers?filterBalance=Pending"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#B91C1C] hover:text-[#991B1B] transition-colors"
              >
                <span>{t('View All')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {topDebtors.length > 0 ? (
              <div className="divide-y divide-[#E8ECF2]">
                {topDebtors.slice(0, 5).map((customer) => {
                  const cleanPhone = (customer.phone || '').replace(/\D/g, '');
                  const waMessage = encodeURIComponent(
                    `Namaste ${customer.name}, aapke ${shopName} par ₹${customer.balance || 0} ka udhar pending hai. Kripya jald se jald bhugtan karein. Dhanyawad!`
                  );
                  const waUrl = cleanPhone ? `https://wa.me/91${cleanPhone}?text=${waMessage}` : null;

                  return (
                    <div
                      key={customer._id}
                      className="py-2.5 flex items-center justify-between gap-3 hover:bg-[#F3F5F9]/80 rounded-lg px-2 transition-colors group"
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#FFF1F2] text-[#B91C1C] border border-[#FECDD3] flex items-center justify-center text-xs font-semibold shrink-0">
                          {getInitials(customer.name)}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to="/customers"
                            className="text-xs sm:text-sm font-semibold text-[#191E2B] group-hover:text-[#4338CA] truncate block transition-colors"
                          >
                            {customer.name}
                          </Link>
                          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#757F94] font-medium mt-0.5">
                            <span>{customer.phone ? `+91 ${customer.phone}` : t('No phone')}</span>
                            {customer.balance > 2500 && (
                              <span className="text-[9px] font-bold uppercase text-[#B91C1C] bg-[#FFF1F2] px-1 py-0.2 rounded border border-[#FECDD3]">
                                {t('High')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2 sm:gap-2.5">
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-[#B91C1C] block">
                            {formatCurrency(customer.balance)}
                          </span>
                          <span className="text-[10px] text-[#757F94] font-medium block">
                            {t('Udhar Owed')}
                          </span>
                        </div>

                        {/* 1-Click WhatsApp & Phone Actions */}
                        <div className="flex items-center gap-1">
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-[#0D7A57] bg-[#ECFDF5] hover:bg-[#D1FAE5] border border-[#A7F3D0] transition-colors shrink-0"
                              title={t('Send 1-Click WhatsApp Reminder')}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {cleanPhone && (
                            <a
                              href={`tel:+91${cleanPhone}`}
                              className="p-1.5 rounded-lg text-[#4E5668] bg-[#F0F2F6] hover:bg-[#E2E8F0] border border-[#DCE1EA] transition-colors shrink-0"
                              title={t('Call Customer')}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-[#0D7A57] mx-auto mb-1.5" />
                <p className="text-xs text-[#0D7A57] font-semibold">{t('Zero pending udhar balance!')}</p>
                <p className="text-[11px] text-[#757F94] mt-0.5 font-medium">{t('All customer accounts are settled.')}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
