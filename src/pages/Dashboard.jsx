import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { IndianRupee, Users, TrendingUp, Sun, Clock, Calendar, Award, Wallet, AlertCircle, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
};

const LightMetricCard = ({ title, value, icon: Icon, trend, trendUp, colorClass, bgClass }) => (
  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgClass}`}>
        <Icon className={`w-5 h-5 ${colorClass}`} />
      </div>
      {trend && (
        <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {trendUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
          {trend}
        </div>
      )}
    </div>
    <div>
      <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-semibold text-slate-800">{value}</h3>
    </div>
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

  if (isLoading) return <div className="p-8 text-center text-slate-500 font-medium">{t('Loading')}...</div>;
  if (error) return <div className="p-8 text-center text-red-500 font-medium">{t('Failed to load')}</div>;

  const chartData = data?.chartData || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-0 sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">{t('Dashboard Overview')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t("Here's a summary of your business performance.")}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-1 flex shadow-sm">
          <button className="px-4 py-2 text-sm font-semibold text-slate-800 bg-slate-100 rounded-lg">{t('Overview')}</button>
          <button className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">{t('Analytics')}</button>
        </div>
      </div>

      {/* Primary Metrics Row */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 mb-3 tracking-wider">{t('PRIMARY METRICS')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <LightMetricCard
            title={t("Today's Sales")}
            value={formatCurrency(data?.todaySales)}
            icon={Sun}
            colorClass="text-slate-800"
            bgClass="bg-slate-100"
            trend="12%"
            trendUp={true}
          />
          <LightMetricCard
            title={t("Today's Collections")}
            value={formatCurrency(data?.todayCollection)}
            icon={Wallet}
            colorClass="text-emerald-600"
            bgClass="bg-emerald-50"
            trend="5%"
            trendUp={true}
          />
          <LightMetricCard
            title={t("Pending Udhar")}
            value={formatCurrency(data?.pendingAmount)}
            icon={AlertCircle}
            colorClass="text-red-600"
            bgClass="bg-red-50"
            trend="2%"
            trendUp={false}
          />
          <LightMetricCard
            title={t("Total Customers")}
            value={data?.totalCustomers || 0}
            icon={Users}
            colorClass="text-slate-800"
            bgClass="bg-slate-100"
          />
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 mb-3 tracking-wider">{t('SALES HISTORY')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <LightMetricCard
            title={t("Yesterday")}
            value={formatCurrency(data?.yesterdaySales)}
            icon={Clock}
            colorClass="text-slate-800"
            bgClass="bg-slate-100"
          />
          <LightMetricCard
            title={t("This Week")}
            value={formatCurrency(data?.weeklySales)}
            icon={Calendar}
            colorClass="text-slate-800"
            bgClass="bg-slate-100"
          />
          <LightMetricCard
            title={t("This Month")}
            value={formatCurrency(data?.monthlySales)}
            icon={TrendingUp}
            colorClass="text-slate-800"
            bgClass="bg-slate-100"
          />
          <LightMetricCard
            title={t("Lifetime")}
            value={formatCurrency(data?.lifetimeSales)}
            icon={Award}
            colorClass="text-slate-800"
            bgClass="bg-slate-100"
          />
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{t('Revenue vs Collections')}</h3>
            <p className="text-sm text-slate-500 mt-1">{t('Weekly performance chart')}</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center text-sm font-semibold text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 mr-2"></span>{t("Sales")}
            </div>
            <div className="flex items-center text-sm font-semibold text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-400 mr-2"></span>{t("Collections")}
            </div>
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCollections" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} dy={15} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`} dx={-10} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontWeight: '600' }}
                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
              <Area type="monotone" dataKey="collections" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCollections)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
