import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Wallet, Users, ChartNoAxesCombined, IndianRupee } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount || 0);
};

const Dashboard = () => {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboardAnalytics'],
    queryFn: async () => {
      const res = await api.get('/reports/dashboard');
      return res.data.data;
    },
    staleTime: 1 * 60 * 1000, // Data is fresh for 1 min
    gcTime: 5 * 60 * 1000,   // Garbage collect (delete from memory) if unused for 5 mins
  });

  // Use actual chart data, default to empty array if none
  const salesData = data?.chartData || [];

  // Use for bar chart (convert name to date for backward compatibility)
  const chartData = salesData.map(item => ({
    date: item.name || item.date,
    sales: item.sales,
    collections: item.collections
  }));

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#093C5D]"></div>
    </div>
  );

  return (
    <div className="w-full space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12">

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-1 md:mb-1.5">
          {t('Dashboard Overview')}
        </h2>
        <p className="text-xs sm:text-sm font-medium text-gray-600">
          {t("Here's a summary of your business performance.")}
        </p>
      </motion.div>

      {/* Metrics Cards - 4 Cards in Row */}
      <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
        {/* Today's Sales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden"
        >
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
              <ChartNoAxesCombined className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t("Today's Sales")}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">{formatCurrency(data?.todaySales ?? 0)}</p>
          </div>
        </motion.div>

        {/* Today's Collections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-xl p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden"
        >
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
              <Wallet className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t("Today's Collections")}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">{formatCurrency(data?.todayCollection ?? 0)}</p>
          </div>
        </motion.div>

        {/* Pending Udhar - With Red Left Border */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border-l-4 border-l-red-500 border-t border-t-gray-200 border-r border-r-gray-200 border-b border-b-gray-200 hover:border-r-gray-300 hover:border-t-gray-300 hover:border-b-gray-300 transition-all duration-200 overflow-hidden"
        >
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
              <IndianRupee className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Pending Udhar')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">
              {formatCurrency(data?.pendingAmount ?? 0)}
            </p>
          </div>
        </motion.div>

        {/* Total Customers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-xl p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden"
        >
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
              <Users className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Total Customers')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">{data?.totalCustomers ?? 0}</p>
          </div>
        </motion.div>
      </div>

      {/* Historical Sales - Small Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3 md:space-y-4"
      >
        <h3 className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide">
          {t('HISTORICAL SALES')}
        </h3>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden">
            <p className="text-[10px] md:text-xs text-gray-600 mb-1 font-semibold uppercase tracking-wide truncate">{t('Yesterday')}</p>
            <p className="font-semibold text-base md:text-lg xl:text-xl text-gray-900 truncate">{formatCurrency(data?.yesterdaySales ?? 0)}</p>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden">
            <p className="text-[10px] md:text-xs text-gray-600 mb-1 font-semibold uppercase tracking-wide truncate">{t('This Week')}</p>
            <p className="font-semibold text-base md:text-lg xl:text-xl text-gray-900 truncate">{formatCurrency(data?.weeklySales ?? 0)}</p>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden">
            <p className="text-[10px] md:text-xs text-gray-600 mb-1 font-semibold uppercase tracking-wide truncate">{t('This Month')}</p>
            <p className="font-semibold text-base md:text-lg xl:text-xl text-gray-900 truncate">{formatCurrency(data?.monthlySales ?? 0)}</p>
          </div>
          <div className="bg-[#093C5D]/5 rounded-xl p-3 md:p-4 border border-[#093C5D]/20 hover:border-[#093C5D]/40 transition-all duration-200 overflow-hidden">
            <p className="text-[10px] md:text-xs text-[#093C5D] mb-1 font-semibold uppercase tracking-wide truncate">{t('Lifetime')}</p>
            <p className="font-semibold text-base md:text-lg xl:text-xl text-[#093C5D] truncate">{formatCurrency(data?.lifetimeSales ?? 0)}</p>
          </div>
        </div>
      </motion.div>

      {/* Chart Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl p-4 md:p-5 lg:p-6 border border-gray-200"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <div>
            <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">
              {t('Revenue vs Collections')}
            </h3>
            <p className="text-sm md:text-base font-medium text-gray-600 mt-1">
              {t('Weekly performance chart')}
            </p>
          </div>
          <select className="cursor-pointer bg-white rounded-xl text-sm md:text-base border border-gray-300 px-4 md:px-5 py-2.5 md:py-3 text-gray-700 font-medium outline-none focus:outline-none focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200 w-full md:w-auto">
            <option>{t('This Week')}</option>
            <option>{t('This Month')}</option>
            <option>{t('This Year')}</option>
          </select>
        </div>

        <div className="w-full h-[240px] md:h-[280px] lg:h-[320px] xl:h-[360px] bg-gray-50/50 rounded-xl p-2 md:p-3">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 5, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  style={{ fontSize: '11px', fontWeight: '600' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#9ca3af"
                  style={{ fontSize: '11px', fontWeight: '600' }}
                  tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: 'none',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                  labelStyle={{
                    color: '#111827',
                    fontWeight: '600',
                    marginBottom: '2px',
                    fontSize: '13px'
                  }}
                  itemStyle={{
                    padding: '0',
                    fontWeight: '500'
                  }}
                  formatter={(value, name) => {
                    const label = name === 'Collections' ? t('Collections') : t('Sales');
                    return [`₹${value.toLocaleString('en-IN')}`, label];
                  }}
                  cursor={{ fill: '#f9fafb' }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '15px', fontSize: '12px', fontWeight: '600' }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar
                  dataKey="collections"
                  fill="#093C5D"
                  radius={[6, 6, 0, 0]}
                  name={t('Collections')}
                  maxBarSize={35}
                />
                <Bar
                  dataKey="sales"
                  fill="#4A90E2"
                  radius={[6, 6, 0, 0]}
                  name={t('Sales')}
                  maxBarSize={35}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 text-sm md:text-base font-medium">{t('No data available')}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Area Charts - Sales Trend & Revenue Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 lg:gap-5">
        {/* Sales Trend (Last 7 Days) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-4 md:p-5 border border-gray-200"
        >
          <div className="mb-4 md:mb-5">
            <h3 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900 mb-1">
              {t('Sales Trend (Last 7 Days)')}
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-600"></div>
              <span className="text-xs md:text-sm text-gray-600 font-medium">{t('Sales')}</span>
            </div>
          </div>

          <div className="w-full h-[200px] md:h-[220px] lg:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4b5563" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4b5563" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                  tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: 'none',
                    padding: '6px 10px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                  labelStyle={{
                    color: '#111827',
                    fontWeight: '600',
                    marginBottom: '2px',
                    fontSize: '13px'
                  }}
                  itemStyle={{
                    padding: '0',
                    fontWeight: '500'
                  }}
                  formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, t('Sales')]}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#4b5563"
                  strokeWidth={2}
                  fill="url(#salesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Revenue Growth */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl p-4 md:p-5 border border-gray-200"
        >
          <div className="mb-4 md:mb-5">
            <h3 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900 mb-1">
              {t('Revenue Growth')}
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs md:text-sm text-gray-600 font-medium">{t('Collections')}</span>
            </div>
          </div>

          <div className="w-full h-[200px] md:h-[220px] lg:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="collectionsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                  tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: 'none',
                    padding: '6px 10px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                  labelStyle={{
                    color: '#111827',
                    fontWeight: '600',
                    marginBottom: '2px',
                    fontSize: '13px'
                  }}
                  itemStyle={{
                    padding: '0',
                    fontWeight: '500'
                  }}
                  formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, t('Collections')]}
                />
                <Area
                  type="monotone"
                  dataKey="collections"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#collectionsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
