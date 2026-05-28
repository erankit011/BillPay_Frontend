import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { Users, TrendingUp, Sun, Clock, Calendar, Award, Wallet, AlertCircle, TrendingDown, Package, ShoppingCart, UserCheck, DollarSign, Activity, Target, TrendingUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
};

const MetricCard = ({ title, value, icon: Icon, trend, trendUp, colorClass, bgClass }) => (
  <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 transition-all duration-300 cursor-pointer">
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
  const [activeTab, setActiveTab] = useState('overview');
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardAnalytics'],
    queryFn: async () => {
      const res = await api.get('/reports/dashboard');
      return res.data.data;
    }
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/customers');
      return res.data.data;
    }
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products');
      return res.data.data;
    }
  });

  const { data: bills = [] } = useQuery({
    queryKey: ['bills'],
    queryFn: async () => {
      const res = await api.get('/bills');
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

  // Analytics Calculations
  const topCustomers = customers
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5)
    .map(c => ({ name: c.name, amount: c.balance }));

  const lowStockProducts = products
    .filter(p => p.stock < 10)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

  const paymentStatusData = [
    { name: 'Paid', value: bills.filter(b => b.paymentStatus === 'PAID').length, color: '#10b981' },
    { name: 'Partial', value: bills.filter(b => b.paymentStatus === 'PARTIAL').length, color: '#f59e0b' },
    { name: 'Pending', value: bills.filter(b => b.paymentStatus === 'PENDING').length, color: '#ef4444' }
  ];

  const monthlyTrend = chartData.map(item => ({
    name: item.name,
    sales: item.sales,
    collections: item.collections,
    profit: item.sales - (item.sales * 0.3) // Assuming 30% cost
  }));

  const avgOrderValue = bills.length > 0 
    ? bills.reduce((sum, b) => sum + b.grandTotal, 0) / bills.length 
    : 0;

  const collectionRate = data?.todaySales > 0 
    ? ((data?.todayCollection / data?.todaySales) * 100).toFixed(1) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('Dashboard Overview')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("Here's a summary of your business performance.")}</p>
        </div>
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'overview' 
                ? 'text-gray-900 bg-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('Overview')}
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'analytics' 
                ? 'text-gray-900 bg-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('Analytics')}
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
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
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 animate-fade-in" style={{ animationDelay: '800ms' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{t('Revenue vs Collections')}</h3>
            <p className="text-sm text-gray-500 mt-1">{t('Weekly performance chart')}</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center text-sm font-medium text-gray-600">
              <span className="w-3 h-3 rounded-full bg-blue-600 mr-2"></span>{t("Sales")}
            </div>
            <div className="flex items-center text-sm font-medium text-gray-600">
              <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>{t("Collections")}
            </div>
          </div>
        </div>

        <div style={{ width: '100%', height: 300 }}>
          {chartData && chartData.length > 0 ? (
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  width={65}
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
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>{t('No data available')}</p>
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <>
          {/* Advanced Metrics */}
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('Business Insights')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: t("Avg Order Value"), value: formatCurrency(avgOrderValue), icon: ShoppingCart, colorClass: "text-purple-600", bgClass: "bg-purple-50" },
                { title: t("Collection Rate"), value: `${collectionRate}%`, icon: Target, colorClass: "text-green-600", bgClass: "bg-green-50" },
                { title: t("Total Bills"), value: bills.length, icon: Activity, colorClass: "text-blue-600", bgClass: "bg-blue-50" },
                { title: t("Active Customers"), value: customers.filter(c => c.balance > 0).length, icon: UserCheck, colorClass: "text-orange-600", bgClass: "bg-orange-50" }
              ].map((metric, index) => (
                <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <MetricCard {...metric} />
                </div>
              ))}
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Status Distribution */}
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 animate-fade-in" style={{ animationDelay: '400ms' }}>
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('Payment Status Distribution')}</h3>
              <div style={{ width: '100%', height: 280 }}>
                {paymentStatusData && paymentStatusData.length > 0 ? (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={paymentStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {paymentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>{t('No data available')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Monthly Profit Trend */}
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 animate-fade-in" style={{ animationDelay: '500ms' }}>
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('Sales vs Profit Trend')}</h3>
              <div style={{ width: '100%', height: 280 }}>
                {monthlyTrend && monthlyTrend.length > 0 ? (
                  <ResponsiveContainer>
                    <BarChart data={monthlyTrend} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`} />
                      <Tooltip contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e5e7eb' }} />
                      <Legend />
                      <Bar dataKey="sales" fill="#2563eb" name={t("Sales")} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="profit" fill="#10b981" name={t("Profit")} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>{t('No data available')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Data Tables Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Customers by Pending Amount */}
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 animate-fade-in" style={{ animationDelay: '600ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">{t('Top Customers (Pending)')}</h3>
                <Users className="w-5 h-5 text-gray-400" />
              </div>
              {topCustomers.length > 0 ? (
                <div className="space-y-3">
                  {topCustomers.map((customer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <span className="font-medium text-gray-900">{customer.name}</span>
                      </div>
                      <span className="font-bold text-red-600">{formatCurrency(customer.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>{t('No pending amounts')}</p>
                </div>
              )}
            </div>

            {/* Low Stock Products */}
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 animate-fade-in" style={{ animationDelay: '700ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">{t('Low Stock Alert')}</h3>
                <Package className="w-5 h-5 text-orange-500" />
              </div>
              {lowStockProducts.length > 0 ? (
                <div className="space-y-3">
                  {lowStockProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{formatCurrency(product.price)}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                          product.stock === 0 ? 'bg-red-100 text-red-700' : 
                          product.stock < 5 ? 'bg-orange-100 text-orange-700' : 
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {product.stock} {t('left')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>{t('All products well stocked')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200 animate-fade-in" style={{ animationDelay: '800ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <TrendingUpDown className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{t('Performance Summary')}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">{t('Total Revenue')}</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(data?.lifetimeSales || 0)}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">{t('Total Collected')}</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency((data?.lifetimeSales || 0) - (data?.pendingAmount || 0))}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">{t('Total Products')}</p>
                <p className="text-xl font-bold text-gray-900">{products.length}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">{t('Total Customers')}</p>
                <p className="text-xl font-bold text-gray-900">{customers.length}</p>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default Dashboard;
