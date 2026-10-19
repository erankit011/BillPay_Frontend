import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  IndianRupee,
  CreditCard,
  CheckCircle2,
  Clock,
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

const AdminReports = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminReports'],
    queryFn: getAdminReports,
    staleTime: 60 * 1000,
  });

  const monthlyGMV = data?.monthlyGMV || [];
  const monthlySubscriptions = data?.monthlySubscriptions || [];
  const topShops = data?.topShops || [];
  const paymentModes = data?.paymentModes || [];
  const creditStats = data?.creditStats || { totalUdhar: 0, totalPaid: 0, currentOutstanding: 0 };

  // Real all-time calculations from platform
  const totalPlatformGMV = data?.totalPlatformGMV ?? monthlyGMV.reduce((acc, curr) => acc + (curr.totalGMV || 0), 0);
  const totalSaaSSubscriptions = data?.totalSaaSSubscriptions ?? monthlySubscriptions.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0);
  const totalPlatformBills = data?.totalPlatformBills ?? monthlyGMV.reduce((acc, curr) => acc + (curr.billsCount || 0), 0);

  const recoveryRate =
    creditStats.totalUdhar > 0
      ? Math.min(100, Math.round((creditStats.totalPaid / creditStats.totalUdhar) * 100))
      : 100;

  // Active months GMV for chart
  const gmvChartData = useMemo(() => {
    if (!monthlyGMV || monthlyGMV.length === 0) return [];
    return monthlyGMV.map((item) => ({
      month: item._id,
      GMV: item.totalGMV || 0,
      Paid: item.totalPaid || 0,
      Bills: item.billsCount || 0,
    }));
  }, [monthlyGMV]);

  // Active months subscriptions for chart
  const subscriptionChartData = useMemo(() => {
    if (!monthlySubscriptions || monthlySubscriptions.length === 0) return [];
    return monthlySubscriptions.map((item) => ({
      month: item._id,
      Revenue: item.totalRevenue || 0,
      Invoices: item.count || 0,
    }));
  }, [monthlySubscriptions]);

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12 pb-24 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight">
            Financial & Merchant Analytics Reports
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed font-medium">
            In-depth breakdown of platform turnover, SaaS subscription earnings, customer credit recovery, and top performing merchant stores.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="TOTAL PLATFORM GMV"
          value={formatCurrency(totalPlatformGMV)}
          subtext={`${totalPlatformBills} total bills generated across all stores`}
          icon={IndianRupee}
          variant="primary"
        />
        <AdminStatCard
          title="SAAS SUBSCRIPTIONS"
          value={formatCurrency(totalSaaSSubscriptions)}
          subtext="Merchant membership fee revenue"
          icon={CreditCard}
          variant="success"
        />
        <AdminStatCard
          title="KIRANA CREDIT OUTSTANDING"
          value={formatCurrency(creditStats.currentOutstanding)}
          subtext="Active unpaid credit across stores"
          icon={Clock}
          variant="danger"
        />
        <AdminStatCard
          title="UDHAR RECOVERY RATE"
          value={`${recoveryRate}%`}
          subtext={`${formatCurrency(creditStats.totalPaid)} collected of ${formatCurrency(creditStats.totalUdhar)} total udhar`}
          icon={CheckCircle2}
          variant="primary"
        />
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center text-gray-500 gap-3 bg-white border border-gray-200 rounded-lg shadow-none">
          <SwirlingLoader className="w-8 h-8 text-[#093C5D]" />
          <p className="text-xs sm:text-sm font-medium">Generating financial reports...</p>
        </div>
      ) : isError ? (
        <div className="py-16 text-center text-rose-600 bg-white border border-gray-200 rounded-lg shadow-none">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm font-semibold">Failed to generate platform reports</p>
        </div>
      ) : (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly GMV Growth Trend */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-none">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#093C5D]" />
                  Monthly Platform GMV & Collections Trend (₹)
                </h3>
                <p className="text-xs font-medium text-gray-500 mt-0.5">
                  Gross billed invoice turnover compared with customer collections across all merchant stores
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
                          <stop offset="5%" stopColor="#00A86B" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#00A86B" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} tickFormatter={formatMonthYear} />
                      <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip
                        formatter={(val, name) => [
                          formatCurrency(val),
                          name === 'Paid' || name?.includes('Collection') ? 'Customer Collections' : 'Billed GMV Turnover'
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
                        labelFormatter={(label) => formatMonthYear(label)}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                        formatter={(value) => (value === 'GMV' ? 'Billed GMV Turnover' : 'Customer Collections')}
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
                        stroke="#00A86B"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#00A86B' }}
                        activeDot={{ r: 5 }}
                        fillOpacity={1}
                        fill="url(#paidGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* SaaS Subscription Collections */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-none">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  SaaS Subscription Earnings Trend (₹)
                </h3>
                <p className="text-xs font-medium text-gray-500 mt-0.5">
                  Platform revenue captured from merchant subscription plan upgrades & renewals
                </p>
              </div>

              <div className="h-64 w-full">
                {subscriptionChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">
                    No subscription receipts recorded in this period
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subscriptionChartData} margin={{ top: 12, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} tickFormatter={formatMonthYear} />
                      <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip
                        formatter={(val) => [formatCurrency(val), 'SaaS Membership Revenue']}
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E5E7EB',
                          borderRadius: '8px',
                          fontSize: '12px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          color: '#111827'
                        }}
                        labelStyle={{ color: '#093C5D', fontWeight: 600, marginBottom: '4px' }}
                        labelFormatter={(label) => formatMonthYear(label)}
                      />
                      <Bar dataKey="Revenue" name="SaaS Revenue" fill="#00A86B" radius={[4, 4, 0, 0]} maxBarSize={44} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Payment Modes & Top Merchants (Separated Columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment Modes Distribution */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 lg:col-span-1 shadow-none flex flex-col justify-between">
              <div>
                <div className="mb-3.5">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                    Settlement Modes Breakdown
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">
                    Distribution by bill settlement method (Cash, UPI, Credit)
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

            {/* Top 5 High-Volume Merchants Table */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 lg:col-span-2 shadow-none">
              <div className="mb-3.5">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                  Top Performing Stores by GMV
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">
                  Merchant businesses driving highest transaction volume across UdharPay
                </p>
              </div>

              {topShops.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400 font-medium">
                  No merchant transactions logged yet
                </div>
              ) : (
                <div>
                  {/* Desktop Table View */}
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
                            {/* Store & Business */}
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

                            {/* Merchant Owner */}
                            <td className="py-3 px-3.5 align-middle">
                              <div className="font-semibold text-xs sm:text-sm text-gray-900 truncate max-w-[170px]" title={shop.merchantName}>
                                {shop.merchantName}
                              </div>
                              <span className="text-[11px] text-gray-500 font-normal block truncate max-w-[170px]" title={shop.merchantEmail}>
                                {shop.merchantEmail || 'N/A'}
                              </span>
                            </td>

                            {/* Plan */}
                            <td className="py-3 px-3.5 align-middle text-center">
                              <span
                                className={`inline-block px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide border ${getPlanBadge(
                                  shop.subscriptionPlan
                                )}`}
                              >
                                {shop.subscriptionPlan || 'FREE'}
                              </span>
                            </td>

                            {/* Invoices */}
                            <td className="py-3 px-3.5 align-middle text-center text-gray-800 font-semibold text-xs sm:text-sm">
                              {shop.billsCount}
                            </td>

                            {/* Total GMV */}
                            <td className="py-3 px-3.5 align-middle text-right font-semibold text-gray-900 text-sm">
                              {formatCurrency(shop.totalGMV)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards View */}
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
