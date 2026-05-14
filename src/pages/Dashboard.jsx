import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, Sun, Clock, Calendar, Award, Wallet, AlertCircle, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
};

const MetricCard = ({ title, value, icon: Icon, trend, trendUp, colorClass, bgClass }) => (
  <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgClass} transition-transform duration-300 hover:scale-110`}>
        <Icon className={`w-5 h-5 ${colorClass}`} />
      </div>
      {trend && (
        <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-md ${
            trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
        }`}>
          {trendUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
          {trend}
        </div>
      )}
    </div>
    <div>
      <p className="text-gray-500 text-sm mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
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

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
    </div>
  );

  if (error) return (
    <div className="p-8 text-center bg-red-50 border border-red-200 rounded-xl max-w-xl mx-auto mt-10">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-red-900 mb-2">{t('Failed to load dashboard')}</h3>
      <p className="text-sm text-red-600">{t('Please try refreshing the page.')}</p>
    </div>
  );

  const chartData = data?.chartData || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('Dashboard Overview')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("Here's a summary of your business performance.")}</p>
        </div>
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button className="px-4 py-2 text-sm font-medium text-gray-900 bg-white rounded-md shadow-sm">{t('Overview')}</button>
          <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">{t('Analytics')}</button>
        </div>
      </div>

      {/* Primary Metrics */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('Today')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: t("Today's Sales"), value: formatCurrency(data?.todaySales), icon: Sun, colorClass: "text-blue-600", bgClass: "bg-blue-50", trend: "12%", trendUp: true },
            { title: t("Today's Collections"), value: formatCurrency(data?.todayCollection), icon: Wallet, colorClass: "text-green-600", bgClass: "bg-green-50", trend: "5%", trendUp: true },
            { title: t("Pending Udhar"), value: formatCurrency(data?.pendingAmount), icon: AlertCircle, colorClass: "text-red-600", bgClass: "bg-red-50", trend: "2%", trendUp: false },
            { title: t("Total Customers"), value: data?.totalCustomers || 0, icon: Users, colorClass: "text-purple-600", bgClass: "bg-purple-50" }
          ].map((metric, index) => (
            <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <MetricCard {...metric} />
            </div>
          ))}
        </div>
      </div>

      {/* Sales History */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('Sales History')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: t("Yesterday"), value: formatCurrency(data?.yesterdaySales), icon: Clock, colorClass: "text-gray-600", bgClass: "bg-gray-50" },
            { title: t("This Week"), value: formatCurrency(data?.weeklySales), icon: Calendar, colorClass: "text-gray-600", bgClass: "bg-gray-50" },
            { title: t("This Month"), value: formatCurrency(data?.monthlySales), icon: TrendingUp, colorClass: "text-gray-600", bgClass: "bg-gray-50" },
            { title: t("Lifetime"), value: formatCurrency(data?.lifetimeSales), icon: Award, colorClass: "text-orange-600", bgClass: "bg-orange-50" }
          ].map((metric, index) => (
            <div key={index} className="animate-fade-in" style={{ animationDelay: `${(index + 4) * 100}ms` }}>
              <MetricCard {...metric} />
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 animate-fade-in" style={{ animationDelay: '800ms' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{t('Revenue vs Collections')}</h3>
            <p className="text-sm text-gray-500 mt-1">{t('Weekly performance chart')}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center text-sm font-medium text-gray-600">
              <span className="w-3 h-3 rounded-full bg-blue-600 mr-2"></span>{t("Sales")}
            </div>
            <div className="flex items-center text-sm font-medium text-gray-600">
              <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>{t("Collections")}
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCollections" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6b7280', fontSize: 12 }} 
                dy={10} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6b7280', fontSize: 12 }} 
                tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`} 
              />
              <Tooltip
                contentStyle={{ 
                  borderRadius: '0.5rem', 
                  border: '1px solid #e5e7eb', 
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  padding: '8px 12px'
                }}
                cursor={{ stroke: '#d1d5db', strokeWidth: 1 }}
              />
              <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              <Area type="monotone" dataKey="collections" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCollections)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
