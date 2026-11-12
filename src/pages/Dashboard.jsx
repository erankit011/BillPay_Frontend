/**
 * Merchant Business Analytics & KPI Dashboard
 * Renders daily sales collections, outstanding debt counters, sales trend graphs,
 * quick action shortcuts, recent invoices, and pending udhar watchlists.
 */

import { useState, useMemo } from 'react';
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
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SwirlingLoader from '../components/common/SwirlingLoader';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/dateUtils';
import { getInitials } from '../utils/stringUtils';

/**
 * Compact Rupee Currency Formatter for Chart Axes (DRY)
 * Strips unnatural decimals like .0k while preserving clean integers (e.g. ₹12k, ₹9k, ₹0)
 */
const formatAxisRupee = (val) => {
  if (!val || val === 0) return '₹0';
  const num = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (num >= 10000000) {
    const cr = num / 10000000;
    return `${sign}₹${cr % 1 === 0 ? cr : Number(cr.toFixed(1))}Cr`;
  }
  if (num >= 100000) {
    const lk = num / 100000;
    return `${sign}₹${lk % 1 === 0 ? lk : Number(lk.toFixed(1))}L`;
  }
  if (num >= 1000) {
    const k = num / 1000;
    return `${sign}₹${k % 1 === 0 ? k : Number(k.toFixed(1))}k`;
  }
  return `${sign}₹${num}`;
};

/**
 * Dashboard Component
 */
const Dashboard = () => {
  const { t } = useTranslation();
  const user = useSelector((state) => state.auth?.user);
  const shopName = user?.businessName || user?.name || 'UdharPay';

  const [activeDonutIndex, setActiveDonutIndex] = useState(0);

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

  /**
   * Sales Performance Metrics Dataset (This Week, This Month, This Year)
   * Defaults to This Week (index 0) on load or refresh.
   * Provides contextual benchmarks & percentages for a clean, pro-level detail card.
   */
  const salesPerformanceData = useMemo(() => {
    const weekly = Number(data?.weeklySales) || 0;
    const monthly = Number(data?.monthlySales) || 0;
    const yearly = Number(data?.yearlySales) || 0;

    const weekPct =
      monthly > 0
        ? ((weekly / monthly) * 100).toFixed(1)
        : yearly > 0
        ? ((weekly / yearly) * 100).toFixed(1)
        : '0';
    const monthPct = yearly > 0 ? ((monthly / yearly) * 100).toFixed(1) : '0';

    return [
      {
        key: 'thisWeek',
        label: 'This Week',
        badge: 'Last 7 Days',
        value: weekly,
        percentage: Number(weekPct),
        benchmarkText: monthly > 0 ? 'of this month' : 'of annual sales',
        color: '#4338CA', // Theme Indigo
        icon: Calendar,
      },
      {
        key: 'thisMonth',
        label: 'This Month',
        badge: 'Month-to-Date',
        value: monthly,
        percentage: Number(monthPct),
        benchmarkText: 'of annual sales',
        color: '#0D7A57', // Emerald Green
        icon: TrendingUp,
      },
      {
        key: 'thisYear',
        label: 'This Year',
        badge: 'Year-to-Date',
        value: yearly,
        percentage: 100,
        benchmarkText: 'annual benchmark',
        color: '#6366F1', // Light Indigo
        icon: Trophy,
      },
    ];
  }, [data]);

  const yearlySalesTotal = useMemo(() => {
    return Number(data?.yearlySales) || salesPerformanceData.reduce((acc, curr) => Math.max(acc, curr.value), 0);
  }, [data, salesPerformanceData]);

  /**
   * Donut Chart Data Series
   * Guarantees visible min-angle arc for interactive slice hover & selection
   */
  const donutChartData = useMemo(() => {
    const hasData = salesPerformanceData.some((item) => item.value > 0);
    if (!hasData) {
      return [
        {
          key: 'empty',
          name: 'No Sales',
          value: 1,
          color: '#EEF1F6',
        },
      ];
    }
    return salesPerformanceData.map((item) => ({
      key: item.key,
      name: item.label,
      value: Math.max(1, item.value),
      color: item.color,
    }));
  }, [salesPerformanceData]);

  const activeDonutItem = salesPerformanceData[activeDonutIndex] || salesPerformanceData[0];

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <SwirlingLoader className="w-10 h-10 md:w-12 md:h-12 text-[#4338CA]" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-3.5 sm:space-y-4 md:space-y-5 pb-24 lg:pb-0">
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
      <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
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
       * Quick Action Command Center (Matching Image 1)
       * Streamlined shortcuts with rounded-lg buttons, soft indigo icons, and zero truncation
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
            { to: '/voice', label: 'Voice Billing', icon: Mic },
            { to: '/reports', label: 'Reports', icon: BarChart3 },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.to}
                to={action.to}
                className="flex items-center gap-1.5 xl:gap-2 px-2 sm:px-2.5 xl:px-3 py-2 sm:py-2.5 bg-[#FBFBFC] hover:bg-white border border-[#DCE1EA] hover:border-[#4338CA]/30 rounded-lg shadow-none hover:shadow-none transition-all duration-150 group text-left cursor-pointer min-w-0"
              >
                <div className="w-7 h-7 xl:w-8 xl:h-8 rounded-lg bg-[#EEF0FB] text-[#4338CA] flex items-center justify-center shrink-0 border border-[#D8DCF5] shadow-none">
                  <Icon className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
                </div>
                <span className="text-[11px] sm:text-xs xl:text-sm font-semibold truncate text-[#4338CA] group-hover:text-[#3730A3] transition-colors">
                  {t(action.label)}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#9AA4B8] group-hover:text-[#4338CA] group-hover:translate-x-0.5 transition-all ml-auto shrink-0 opacity-40 group-hover:opacity-100" />
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/**
       * Sales Performance Donut Card (Week, Month & Year)
       * Interactive Donut chart defaulting to This Week,
       * dynamic visual pipeline line connecting active slice to a single detailed card.
       */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#FBFBFC] rounded-lg p-3 sm:p-4 border border-[#DCE1EA] shadow-none"
      >
        {/* Card Header: Icon + Title */}
        <div className="flex items-center justify-between gap-2.5 pb-2.5 border-b border-[#DCE1EA]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#EEF0FB] text-[#4338CA] flex items-center justify-center shrink-0 border border-[#D8DCF5] shadow-none">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-[#191E2B] truncate">
                {t('Sales Performance')}
              </h3>
              <p className="text-[11px] font-medium text-[#757F94] hidden sm:block truncate">
                {t('Week, Month & Year Overview')}
              </p>
            </div>
          </div>
        </div>

        {/* Centered Compact Widget Layout: Donut + Pipeline Bridge + Detail Card */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-0 md:gap-4 my-2 sm:my-3 max-w-2xl mx-auto w-full">
          {/* Left: Interactive Donut Chart with Total Sales in Center (Never duplicates active item) */}
          <div className="relative w-[170px] sm:w-[185px] h-[170px] sm:h-[185px] shrink-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                {/* Background Full Track Ring */}
                <Pie
                  data={[{ value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={74}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  fill="#EEF1F6"
                  stroke="none"
                  isAnimationActive={false}
                  silent={true}
                />
                {/* Colored Data Slices with Min Angle */}
                <Pie
                  data={donutChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={74}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  cornerRadius={5}
                  paddingAngle={donutChartData.length > 1 ? 4 : 0}
                  minAngle={24}
                  stroke="none"
                  onMouseEnter={(_, index) => {
                    if (donutChartData[0]?.key !== 'empty') {
                      setActiveDonutIndex(index);
                    }
                  }}
                  onClick={(_, index) => {
                    if (donutChartData[0]?.key !== 'empty') {
                      setActiveDonutIndex(index);
                    }
                  }}
                >
                  {donutChartData.map((entry, index) => (
                    <Cell
                      key={`slice-${entry.key || index}`}
                      fill={entry.color}
                      className="cursor-pointer transition-opacity duration-200 outline-none"
                      opacity={activeDonutIndex === null || activeDonutIndex === index ? 1 : 0.35}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center Dynamic Total Sales Overlay (Clean & Professional: NO Week/Month duplicate) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
              <span className="text-[10px] sm:text-[11px] font-medium text-[#757F94] uppercase tracking-wider">
                {t('Total Sales')}
              </span>
              <span className="text-base sm:text-lg font-semibold text-[#191E2B] tracking-tight my-0.5 truncate max-w-[125px]">
                {formatCurrency(yearlySalesTotal)}
              </span>
              <span className="text-[10px] font-medium text-[#4338CA] bg-[#EEF0FB] px-2 py-0.5 rounded-full border border-[#D8DCF5]">
                {t('Annual')}
              </span>
            </div>
          </div>

          {/* Middle: SVG Pipeline Connector Line (Desktop) */}
          <div className="hidden md:flex items-center shrink-0 w-12 sm:w-14 h-[170px] sm:h-[185px]">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 56 185" fill="none">
              {/* Subtle guide lines for slices */}
              <path
                d="M 0 42 C 28 42, 28 92, 56 92"
                stroke="#E2E8F0"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity={activeDonutIndex === 0 ? 0 : 0.6}
              />
              <path
                d="M 0 72 C 28 72, 28 92, 56 92"
                stroke="#E2E8F0"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity={activeDonutIndex === 1 ? 0 : 0.6}
              />
              <path
                d="M 0 130 C 28 130, 28 92, 56 92"
                stroke="#E2E8F0"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity={activeDonutIndex === 2 ? 0 : 0.6}
              />

              {/* Dynamic Active Pipeline Line */}
              <path
                d={
                  activeDonutIndex === 0
                    ? 'M 0 42 C 28 42, 28 92, 56 92'
                    : activeDonutIndex === 1
                    ? 'M 0 72 C 28 72, 28 92, 56 92'
                    : 'M 0 130 C 28 130, 28 92, 56 92'
                }
                stroke={activeDonutItem.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                className="transition-all duration-300"
              />
              {/* Origin Node on Circle */}
              <circle
                cx="0"
                cy={activeDonutIndex === 0 ? 42 : activeDonutIndex === 1 ? 72 : 130}
                r="3.5"
                fill={activeDonutItem.color}
                className="transition-all duration-300"
              />
              {/* Destination Node entering Card */}
              <circle
                cx="56"
                cy="92"
                r="3.5"
                fill={activeDonutItem.color}
                className="transition-all duration-300"
              />
            </svg>
          </div>

          {/* Middle: Vertical Connector for Mobile Screens */}
          <div className="flex md:hidden items-center justify-center w-full h-6 my-1">
            <div className="w-0.5 h-full bg-[#DCE1EA] relative flex items-center justify-center">
              <span
                className="w-2.5 h-2.5 rounded-full absolute transition-all duration-300"
                style={{ backgroundColor: activeDonutItem.color }}
              />
            </div>
          </div>

          {/* Right: Single Clean Detail Card for Active Period (Pro-Level Polish) */}
          <div className="w-full md:w-[280px] lg:w-[320px] shrink-0">
            <div className="bg-white rounded-lg p-4 sm:p-5 border border-[#DCE1EA] shadow-none flex flex-col justify-between h-[170px] sm:h-[185px] transition-all duration-200">
              {/* Top Row: Period Indicator & Badge */}
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 transition-colors"
                    style={{ backgroundColor: activeDonutItem.color }}
                  />
                  <h4 className="text-sm sm:text-base font-semibold text-[#191E2B] leading-tight truncate">
                    {t(activeDonutItem.label)}
                  </h4>
                </div>
                <span
                  className="text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 border"
                  style={{
                    backgroundColor: `${activeDonutItem.color}12`,
                    color: activeDonutItem.color,
                    borderColor: `${activeDonutItem.color}35`,
                  }}
                >
                  {t(activeDonutItem.badge)}
                </span>
              </div>

              {/* Main Metric Value */}
              <div>
                <p className="text-2xl sm:text-3xl font-semibold text-[#191E2B] tracking-tight leading-none">
                  {formatCurrency(activeDonutItem.value)}
                </p>
              </div>

              {/* Bottom Benchmark & Progress Indicator */}
              <div>
                <div className="w-full bg-[#EEF1F6] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(activeDonutItem.value > 0 ? 3 : 0, activeDonutItem.percentage))}%`,
                      backgroundColor: activeDonutItem.color,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-medium text-[#757F94] mt-1.5">
                  <span className="truncate">{t(activeDonutItem.benchmarkText)}</span>
                  <span className="font-semibold shrink-0 ml-2" style={{ color: activeDonutItem.color }}>
                    {activeDonutItem.percentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>
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
        className="bg-[#FBFBFC] rounded-lg p-3.5 sm:p-4 border border-[#DCE1EA]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 sm:mb-2.5">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-[#191E2B]">
              {t('Revenue vs Collections')}
            </h3>
            <p className="text-xs sm:text-sm font-medium text-[#4E5668]">
              {t('Weekly performance chart')}
            </p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#4338CA]"></div>
              <span className="text-xs font-medium text-[#4E5668]">{t('Sales')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0D7A57]"></div>
              <span className="text-xs font-medium text-[#4E5668]">{t('Collections')}</span>
            </div>
          </div>
        </div>

        <div className="w-full h-[250px] sm:h-[270px] md:h-[290px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart
                data={chartData}
                barGap={4}
                margin={{ top: 8, right: 8, left: -4, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#DCE1EA" strokeOpacity={0.6} vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#757F94"
                  style={{ fontSize: '11px', fontWeight: '500' }}
                  axisLine={false}
                  tickLine={false}
                  padding={{ left: 8, right: 8 }}
                />
                <YAxis
                  stroke="#757F94"
                  width={48}
                  style={{ fontSize: '11px', fontWeight: '500' }}
                  tickFormatter={formatAxisRupee}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  itemSorter={(item) => (item.dataKey === 'sales' ? -1 : 1)}
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
                    const label = name === 'Sales' ? t('Sales') : t('Collections');
                    return [`₹${value.toLocaleString('en-IN')}`, label];
                  }}
                  cursor={{ fill: '#EEF0FB' }}
                />
                <Bar
                  dataKey="sales"
                  fill="#4338CA"
                  radius={[4, 4, 0, 0]}
                  name={t('Sales')}
                  maxBarSize={38}
                />
                <Bar
                  dataKey="collections"
                  fill="#0D7A57"
                  radius={[4, 4, 0, 0]}
                  name={t('Collections')}
                  maxBarSize={38}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-3.5 md:gap-4">
        {/**
         * Weekly Sales Trend Chart
         */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#FBFBFC] hover:bg-white rounded-lg p-3.5 sm:p-4 border border-[#DCE1EA] hover:border-[#C2C9D6] transition-all duration-150 shadow-none hover:shadow-none"
        >
          <div className="flex items-center justify-between gap-2 mb-2 sm:mb-2.5">
            <h3 className="text-base sm:text-lg font-semibold text-[#191E2B]">
              {t('Sales Trend')}
            </h3>
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-[#4338CA]"></div>
              <span className="text-xs font-medium text-[#4E5668]">{t('Sales')}</span>
            </div>
          </div>

          <div className="w-full h-[200px] sm:h-[220px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={salesData} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
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
                  tick={{ fill: '#757F94', fontSize: 11, fontWeight: 500 }}
                  padding={{ left: 8, right: 8 }}
                />
                <YAxis
                  axisLine={false}
                  width={48}
                  tickLine={false}
                  tick={{ fill: '#757F94', fontSize: 11, fontWeight: 500 }}
                  tickFormatter={formatAxisRupee}
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
          className="bg-[#FBFBFC] hover:bg-white rounded-lg p-3.5 sm:p-4 border border-[#DCE1EA] hover:border-[#C2C9D6] transition-all duration-150 shadow-none hover:shadow-none"
        >
          <div className="flex items-center justify-between gap-2 mb-2 sm:mb-2.5">
            <h3 className="text-base sm:text-lg font-semibold text-[#191E2B]">
              {t('Revenue Growth')}
            </h3>
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0D7A57]"></div>
              <span className="text-xs font-medium text-[#4E5668]">{t('Collections')}</span>
            </div>
          </div>

          <div className="w-full h-[200px] sm:h-[220px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={salesData} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
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
                  tick={{ fill: '#757F94', fontSize: 11, fontWeight: 500 }}
                  padding={{ left: 8, right: 8 }}
                />
                <YAxis
                  axisLine={false}
                  width={48}
                  tickLine={false}
                  tick={{ fill: '#757F94', fontSize: 11, fontWeight: 500 }}
                  tickFormatter={formatAxisRupee}
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
       * Operational Hub: Recent Invoices & Pending Udhar Watchlist (Matching Image 3)
       * Dual widgets with clean lists, transaction badges, and 1-click reminders
       */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-3.5 md:gap-4">
        {/**
         * Widget 1: Recent Invoices & Bills Activity (Matching Image 3)
         */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#FBFBFC] hover:bg-white rounded-xl p-3.5 sm:p-4 border border-[#DCE1EA] hover:border-[#C2C9D6] transition-all duration-150 shadow-none hover:shadow-none flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2.5 mb-2.5 pb-2.5 border-b border-[#DCE1EA]">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-[#191E2B]">
                  {t('Recent Invoices & Bills')}
                </h3>
                <p className="text-xs text-[#757F94] font-medium mt-0.5">
                  {t('Latest transactions registered')}
                </p>
              </div>

              <Link
                to="/bills"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#4338CA] hover:text-[#3730A3] transition-colors shrink-0"
              >
                <span>{t('View All')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentBills.length > 0 ? (
              <div className="divide-y divide-[#E8ECF2]">
                {recentBills.slice(0, 5).map((bill) => {
                  const customerName = bill.customerId?.name || bill.customer?.name || bill.customerName || t('Counter Sale');
                  const status = bill.paymentStatus || 'UNPAID';

                  return (
                    <Link
                      key={bill._id}
                      to="/bills"
                      className="py-2 flex items-center justify-between gap-3 hover:bg-[#F3F5F9]/80 rounded-lg px-2 transition-colors group cursor-pointer"
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#EEF0FB] text-[#4338CA] border border-[#D8DCF5] flex items-center justify-center text-xs font-semibold shrink-0">
                          {getInitials(customerName)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-[#191E2B] group-hover:text-[#4338CA] truncate transition-colors">
                            {customerName}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-[#757F94] font-medium mt-0.5">
                            <Clock className="w-3 h-3 shrink-0 text-[#757F94]" />
                            <span>{formatDate(bill.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <span className="text-xs sm:text-sm font-semibold text-[#191E2B]">
                          {formatCurrency(bill.grandTotal)}
                        </span>
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider border ${getBillStatusBadge(
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
                <p className="text-xs text-[#757F94] font-medium">{t('No bills recorded yet')}</p>
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
         * Widget 2: Pending Udhar Watchlist (Matching Image 3)
         */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="bg-[#FBFBFC] hover:bg-white rounded-xl p-3.5 sm:p-4 border border-[#DCE1EA] hover:border-[#C2C9D6] transition-all duration-150 shadow-none hover:shadow-none flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2.5 pb-2.5 border-b border-[#DCE1EA]">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-[#191E2B]">
                  {t('Pending Udhar Watchlist')}
                </h3>
                <p className="text-xs text-[#757F94] font-medium mt-0.5">
                  {t('Top outstanding customer credit')}
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
                      className="py-2 flex items-center justify-between gap-3 hover:bg-[#F3F5F9]/80 rounded-lg px-2 transition-colors group"
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
                          <p className="text-[10px] sm:text-xs text-[#757F94] font-medium mt-0.5 truncate">
                            {customer.phone ? `+91 ${customer.phone}` : t('No phone')}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2 sm:gap-3">
                        <div>
                          <span className="text-xs sm:text-sm font-semibold text-[#191E2B] block">
                            {formatCurrency(customer.balance)}
                          </span>
                          <span className="text-[10px] text-[#757F94] font-medium block">
                            {t('Udhar Owed')}
                          </span>
                        </div>

                        {/* Reminder Bell Action */}
                        {waUrl ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Send reminder to ${customer.name}`}
                            className="w-8 h-8 rounded-lg bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#B91C1C] border border-[#FECDD3] flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-1 sm:ml-2"
                            title={t('Send WhatsApp Reminder')}
                          >
                            <BellRing className="w-4 h-4" />
                          </a>
                        ) : (
                          <Link
                            to="/reminders"
                            aria-label={`Send reminder to ${customer.name}`}
                            className="w-8 h-8 rounded-lg bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#B91C1C] border border-[#FECDD3] flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-1 sm:ml-2"
                            title={t('Open Reminders')}
                          >
                            <BellRing className="w-4 h-4" />
                          </Link>
                        )}
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
