/**
 * Master Platform Analytics & Executive Financial Intelligence
 * Aggregates platform GMV, store revenue collections, active merchant tiers, and monthly growth velocity.
 */

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChartNoAxesCombined,
  Wallet,
  IndianRupee,
  TrendingUp,
  Receipt,
  Store,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { getAdminReports } from '../../features/admin/api/adminApi';
import AdminStatCard from '../../features/admin/components/AdminStatCard';
import SwirlingLoader from '../../components/common/SwirlingLoader';
import { formatCurrency } from '../../utils/currency';
import { getInitials } from '../../utils/stringUtils';

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

const formatPaymentMode = (mode) => {
  switch (mode?.toUpperCase()) {
    case 'BANK_TRANSFER':
      return 'Bank Transfer';
    case 'CASH':
      return 'Cash Payment';
    case 'UPI':
      return 'UPI / QR Code';
    case 'CREDIT':
      return 'Kirana Credit (Udhar)';
    default:
      return mode ? mode.replace(/_/g, ' ') : 'Cash';
  }
};

const getPaymentModeColor = (mode) => {
  switch (mode?.toUpperCase()) {
    case 'UPI':
      return 'bg-blue-500';
    case 'CASH':
      return 'bg-emerald-500';
    case 'CREDIT':
      return 'bg-amber-500';
    case 'BANK_TRANSFER':
      return 'bg-purple-500';
    default:
      return 'bg-gray-400';
  }
};

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const formatMonthShort = (val) => {
  if (!val || typeof val !== 'string') return val;
  const parts = val.split('-');
  if (parts.length === 2) {
    const yyyy = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${MONTH_NAMES[monthIndex]} ${yyyy}`;
    }
  }
  return val;
};

const formatMonthFull = (val) => {
  if (!val || typeof val !== 'string') return val;
  const parts = val.split('-');
  if (parts.length === 2) {
    const yyyy = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${FULL_MONTH_NAMES[monthIndex]} ${yyyy}`;
    }
  }
  return val;
};

const formatYAxisCurrency = (val) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${Math.round(val / 1000)}K`;
  return `₹${val}`;
};

const AdminReports = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminReports'],
    queryFn: getAdminReports,
    staleTime: 60 * 1000,
  });

  const monthlyGMV = data?.monthlyGMV || [];
  const topShops = data?.topShops || [];
  const paymentModes = data?.paymentModes || [];
  const creditStats = data?.creditStats || { totalUdhar: 0, totalPaid: 0, currentOutstanding: 0 };

  /**
   * Platform Aggregate Revenue Calculations
   * Summarizes all-time GMV volume, collections settled, and bill counts.
   */
  const totalPlatformGMV = data?.totalPlatformGMV ?? monthlyGMV.reduce((acc, curr) => acc + (curr.totalGMV || 0), 0);
  const totalPlatformPaid = data?.totalPlatformPaid ?? monthlyGMV.reduce((acc, curr) => acc + (curr.totalPaid || 0), 0);
  const totalPlatformBills = data?.totalPlatformBills ?? monthlyGMV.reduce((acc, curr) => acc + (curr.billsCount || 0), 0);

  const recoveryRate =
    creditStats.totalUdhar > 0
      ? Math.min(100, Math.round((creditStats.totalPaid / creditStats.totalUdhar) * 100))
      : 100;

  /**
   * Monthly Sales Chart Data Memo
   * Formats monthly aggregated sales metrics into Recharts-compatible structures.
   */
  const gmvChartData = useMemo(() => {
    if (!monthlyGMV || monthlyGMV.length === 0) return [];
    return monthlyGMV.map((item) => ({
      month: item._id,
      GMV: item.totalGMV || 0,
      Paid: item.totalPaid || 0,
      Bills: item.billsCount || 0,
    }));
  }, [monthlyGMV]);

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12 pb-24 lg:pb-0">
      {/**
       * Page Header Toolbar
       * Title and contextual summary of store sales analytics and performance logs.
       */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight">
            Merchant Store Analytics & Performance Reports
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed font-medium">
            In-depth breakdown of merchant store sales turnover, bills issued, customer udhar credit recovery, settlement modes, and top performing stores.
          </p>
        </div>
      </div>

      {/**
       * Executive KPI Stat Cards Grid
       * Summarizes total store sales, billed collections, credit recovery rate, and outstanding ledger balance.
       */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
        <AdminStatCard
          title="TOTAL STORE SALES"
          value={formatCurrency(totalPlatformGMV)}
          subtext={`${totalPlatformBills} bills generated across stores`}
          icon={ChartNoAxesCombined}
          variant="primary"
        />
        <AdminStatCard
          title="BILLED COLLECTIONS"
          value={formatCurrency(totalPlatformPaid)}
          subtext="Direct payments on invoices"
          icon={Wallet}
          variant="success"
        />
        <AdminStatCard
          title="PENDING CUSTOMER UDHAR"
          value={formatCurrency(creditStats.currentOutstanding)}
          subtext="Active unpaid credit across stores"
          icon={IndianRupee}
          variant="danger"
        />
        <AdminStatCard
          title="UDHAR RECOVERY RATE"
          value={`${recoveryRate}%`}
          subtext={`${formatCurrency(creditStats.totalPaid)} collected of ${formatCurrency(creditStats.totalUdhar)} total udhar`}
          icon={TrendingUp}
          variant="primary"
        />
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center text-gray-500 gap-3 bg-white border border-gray-200 rounded-lg shadow-none">
          <SwirlingLoader className="w-8 h-8 text-[#093C5D]" />
          <p className="text-xs sm:text-sm font-medium">Generating store financial reports...</p>
        </div>
      ) : isError ? (
        <div className="py-16 text-center text-rose-600 bg-white border border-gray-200 rounded-lg shadow-none">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm font-semibold">Failed to generate store reports</p>
        </div>
      ) : (
        <>
          {/**
           * Charts Row
           * Interactive trend visualizations for GMV, collections, and bill volumes.
           */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/**
             * Monthly Store Sales & Collections Trend
             * Displays comparative area chart of billed sales versus payments collected.
             */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-none">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#093C5D]" />
                  Monthly Store Sales & Collections Trend
                </h3>
                <p className="text-xs font-medium text-gray-500 mt-0.5">
                  Gross billed sales turnover compared with direct invoice collections across stores
                </p>
              </div>

              <div className="h-64 w-full">
                {gmvChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">
                    No billing activity recorded in this period
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={gmvChartData} margin={{ top: 12, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#093C5D" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#093C5D" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis
                        dataKey="month"
                        stroke="#9CA3AF"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={formatMonthShort}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatYAxisCurrency}
                      />
                      <Tooltip
                        formatter={(val, name) => [
                          formatCurrency(val),
                          name === 'Paid' ? 'Payments Collected' : 'Billed Store Sales'
                        ]}
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E5E7EB',
                          borderRadius: '8px',
                          fontSize: '12px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          color: '#111827'
                        }}
                        labelStyle={{ color: '#093C5D', fontWeight: 600, marginBottom: '4px' }}
                        labelFormatter={(label) => formatMonthFull(label)}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                        formatter={(value) => (value === 'GMV' ? 'Billed Store Sales' : 'Payments Collected')}
                      />
                      <Area
                        type="monotone"
                        dataKey="GMV"
                        name="GMV"
                        stroke="#093C5D"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#093C5D' }}
                        activeDot={{ r: 5 }}
                        fillOpacity={1}
                        fill="url(#gmvGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="Paid"
                        name="Paid"
                        stroke="#10B981"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#10B981' }}
                        activeDot={{ r: 5 }}
                        fillOpacity={1}
                        fill="url(#paidGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/**
             * Monthly Store Bills Issued Trend
             * Displays bar chart representing count of invoices generated each month.
             */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-none">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#093C5D]" />
                  Monthly Store Bills Issued
                </h3>
                <p className="text-xs font-medium text-gray-500 mt-0.5">
                  Total count of customer invoice bills generated each month across stores
                </p>
              </div>

              <div className="h-64 w-full">
                {gmvChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">
                    No billing records recorded in this period
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gmvChartData} margin={{ top: 12, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis
                        dataKey="month"
                        stroke="#9CA3AF"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={formatMonthShort}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                        tickFormatter={(v) => `${v}`}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(9, 60, 93, 0.04)', radius: 6 }}
                        formatter={(val) => [`${val} bills issued`, 'Total Invoices']}
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E5E7EB',
                          borderRadius: '8px',
                          fontSize: '12px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          color: '#111827'
                        }}
                        labelStyle={{ color: '#093C5D', fontWeight: 600, marginBottom: '4px' }}
                        labelFormatter={(label) => formatMonthFull(label)}
                      />
                      <Bar
                        dataKey="Bills"
                        name="Bills Issued"
                        fill="#093C5D"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={44}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/**
           * Payment Modes & Top Merchants
           * Grid layout separating payment mode breakdown and top merchant rankings.
           */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/**
             * Payment Modes Distribution
             * Visualizes volume and transaction count distribution by payment method.
             */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 lg:col-span-1 shadow-none flex flex-col justify-between">
              <div>
                <div className="mb-3.5">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#093C5D]" />
                    Settlement Modes Breakdown
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">
                    Distribution of store sales by payment method (Cash, UPI, Credit)
                  </p>
                </div>

                {paymentModes.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400 font-medium">
                    No transaction settlement data recorded yet
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {paymentModes.map((m) => (
                      <div
                        key={m._id}
                        className="p-3 bg-gray-50/70 hover:bg-gray-50 border border-gray-200/80 rounded-lg flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${getPaymentModeColor(m._id)}`} />
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-gray-800 tracking-wide block truncate">
                              {formatPaymentMode(m._id)}
                            </span>
                            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                              {m.count} {m.count === 1 ? 'bill' : 'bills'} processed
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 shrink-0 ml-2">
                          {formatCurrency(m.volume || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/**
             * Top Performing Stores Ranking
             * High-volume merchants driving sales volume across the platform.
             */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 lg:col-span-2 shadow-none">
              <div className="mb-3.5">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#093C5D]" />
                  Top Performing Stores by Sales
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">
                  Merchant businesses driving highest sales volume across UdharPay
                </p>
              </div>

              {topShops.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400 font-medium">
                  No merchant transactions logged yet
                </div>
              ) : (
                <div>
                  {/**
                   * Desktop Table View
                   * Tabular display of top performing stores with metrics and badges.
                   */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                      <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-200 font-semibold text-gray-500 uppercase text-[11px]">
                          <th className="py-3 px-3.5 tracking-wider">Store & Business</th>
                          <th className="py-3 px-3.5 tracking-wider">Merchant Owner</th>
                          <th className="py-3 px-3.5 text-center tracking-wider">Plan</th>
                          <th className="py-3 px-3.5 text-center tracking-wider">Invoices</th>
                          <th className="py-3 px-3.5 text-right tracking-wider">Total GMV Volume</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium">
                        {topShops.map((shop) => (
                          <tr key={shop.shopId} className="hover:bg-gray-50/60 transition-colors">
                            {/**
                             * Store Identity Column
                             * Renders merchant brand avatar and business name.
                             */}
                            <td className="py-3 px-3.5 align-middle">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg border border-gray-200 bg-[#F5F5F5] flex items-center justify-center text-xs font-semibold text-[#093C5D] shrink-0">
                                  {getInitials(shop.shopName)}
                                </div>
                                <span className="font-semibold text-sm text-[#093C5D] truncate max-w-[200px]" title={shop.shopName}>
                                  {shop.shopName}
                                </span>
                              </div>
                            </td>

                            {/**
                             * Merchant Owner Column
                             * Shows owner display name and contact email.
                             */}
                            <td className="py-3 px-3.5 align-middle">
                              <div className="font-semibold text-xs sm:text-sm text-gray-900 truncate max-w-[170px]" title={shop.merchantName}>
                                {shop.merchantName}
                              </div>
                              <span className="text-[11px] text-gray-500 font-normal block truncate max-w-[170px]" title={shop.merchantEmail}>
                                {shop.merchantEmail || 'N/A'}
                              </span>
                            </td>

                            {/**
                             * Subscription Plan Column
                             * Displays active tier badge for the merchant account.
                             */}
                            <td className="py-3 px-3.5 align-middle text-center">
                              <span
                                className={`inline-block px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide border ${getPlanBadge(
                                  shop.subscriptionPlan
                                )}`}
                              >
                                {shop.subscriptionPlan || 'FREE'}
                              </span>
                            </td>

                            {/**
                             * Invoices Count Column
                             * Shows total number of bills generated by merchant.
                             */}
                            <td className="py-3 px-3.5 align-middle text-center text-gray-800 font-semibold text-xs sm:text-sm">
                              {shop.billsCount}
                            </td>

                            {/**
                             * Total GMV Column
                             * Formatted aggregate gross sales turnover for the store.
                             */}
                            <td className="py-3 px-3.5 align-middle text-right font-semibold text-gray-900 text-sm">
                              {formatCurrency(shop.totalGMV)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/**
                   * Mobile Cards View
                   * Responsive compact card list for merchant sales performance.
                   */}
                  <div className="sm:hidden space-y-2.5 pt-1">
                    {topShops.map((shop) => (
                      <div
                        key={shop.shopId}
                        className="bg-gray-50/70 border border-gray-200/80 rounded-lg p-3 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg border border-gray-200 bg-[#F5F5F5] flex items-center justify-center text-xs font-semibold text-[#093C5D] shrink-0">
                              {getInitials(shop.shopName)}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-semibold text-[#093C5D] truncate" title={shop.shopName}>
                                {shop.shopName}
                              </h4>
                              <p className="text-[11px] text-gray-500 font-normal truncate">
                                {shop.merchantName}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border shrink-0 ${getPlanBadge(
                              shop.subscriptionPlan
                            )}`}
                          >
                            {shop.subscriptionPlan || 'FREE'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-gray-200/60">
                          <div className="bg-white border border-gray-200 rounded py-1 px-1.5">
                            <span className="text-[10px] font-semibold text-gray-500 uppercase block">Invoices</span>
                            <span className="text-xs font-semibold text-gray-900">{shop.billsCount}</span>
                          </div>
                          <div className="bg-white border border-gray-200 rounded py-1 px-1.5">
                            <span className="text-[10px] font-semibold text-gray-500 uppercase block">Total GMV</span>
                            <span className="text-xs font-semibold text-gray-900">{formatCurrency(shop.totalGMV)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminReports;
