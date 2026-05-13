import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { IndianRupee, Users, FileText, TrendingUp, TrendingDown, Sun, Clock, Calendar, Award, Wallet, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

const DashboardCard = ({ title, value, icon: Icon, trend, trendUp, bgClass, textClass }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 flex flex-col justify-between group transform hover:-translate-y-1 animate-fade-in">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1 group-hover:text-gray-700 transition-colors">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${bgClass} transition-all duration-300 group-hover:scale-110`}>
        <Icon className={`w-6 h-6 ${textClass}`} />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center text-sm animate-slide-up">
        <span className={trendUp ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
          {trend}
        </span>
        <span className="text-gray-400 ml-2 text-xs">vs last month</span>
      </div>
    )}
  </div>
);

const Dashboard = () => {
  const { t } = useTranslation();
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardAnalytics'],
    queryFn: async () => {
      const res = await api.get('/reports/dashboard');
      return res.data.data;
    }
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">{t('Loading')}...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{t('Failed to load')}</div>;

  // Mock chart data for now
  const chartData = [
    { name: 'Mon', sales: 4000, collections: 2400 },
    { name: 'Tue', sales: 3000, collections: 1398 },
    { name: 'Wed', sales: 2000, collections: 9800 },
    { name: 'Thu', sales: 2780, collections: 3908 },
    { name: 'Fri', sales: 1890, collections: 4800 },
    { name: 'Sat', sales: 2390, collections: 3800 },
    { name: 'Sun', sales: 3490, collections: 4300 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('Dashboard Overview')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t("Here's what's happening with your store today.")}</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        <DashboardCard
          title={t("Today's Sales")}
          value={formatCurrency(data?.todaySales || 0)}
          icon={Sun}
          bgClass="bg-blue-50"
          textClass="text-blue-600"
        />
        <DashboardCard
          title={t("Yesterday's Sales")}
          value={formatCurrency(data?.yesterdaySales || 0)}
          icon={Clock}
          bgClass="bg-indigo-50"
          textClass="text-indigo-600"
        />
        <DashboardCard
          title={t("This Week's Sales")}
          value={formatCurrency(data?.weeklySales || 0)}
          icon={Calendar}
          bgClass="bg-violet-50"
          textClass="text-violet-600"
        />
        <DashboardCard
          title={t("This Month's Sales")}
          value={formatCurrency(data?.monthlySales || 0)}
          icon={TrendingUp}
          bgClass="bg-purple-50"
          textClass="text-purple-600"
        />
        <DashboardCard
          title={t("Lifetime Sales")}
          value={formatCurrency(data?.lifetimeSales || 0)}
          icon={Award}
          bgClass="bg-pink-50"
          textClass="text-pink-600"
        />
        <DashboardCard
          title={t("Today's Collections")}
          value={formatCurrency(data?.todayCollection || 0)}
          icon={Wallet}
          bgClass="bg-green-50"
          textClass="text-green-600"
        />
        <DashboardCard
          title={t("Total Pending Udhar")}
          value={formatCurrency(data?.pendingAmount || 0)}
          icon={AlertCircle}
          bgClass="bg-red-50"
          textClass="text-red-600"
        />
        <DashboardCard
          title={t("Total Customers")}
          value={data?.totalCustomers || 0}
          icon={Users}
          bgClass="bg-teal-50"
          textClass="text-teal-600"
        />
      </div>

        {/* Sales vs Collections Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">{t('Weekly Overview')}</h3>
            <select className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2">
              <option>This Week</option>
              <option>Last Week</option>
            </select>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} tickFormatter={(val) => `₹${val}`} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="sales" fill="#4F46E5" radius={[4, 4, 0, 0]} name={t("Sales")} barSize={32} />
                <Bar dataKey="collections" fill="#10B981" radius={[4, 4, 0, 0]} name={t("Collections")} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
  );
};

export default Dashboard;
