/**
 * Store Financial Reports & Statement Export Page
 * Generates periodic collection vs revenue charts and exports printable PDF statements.
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Wallet, IndianRupee, ChartNoAxesCombined, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { generateStatementPDF } from '../utils/generateStatementPDF';
import SwirlingLoader from '../components/common/SwirlingLoader';
import toast from 'react-hot-toast';

import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/dateUtils';

/**
 * Reports Component
 */
const Reports = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const statementPeriod = searchParams.get('period') || 'all';

  const setStatementPeriod = (value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value === 'all') next.delete('period');
      else next.set('period', value);
      return next;
    }, { replace: true });
  };

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['dashboardAnalytics'],
    queryFn: async () => {
      const res = await api.get('/reports/dashboard');
      return res.data.data;
    },
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const downloadStatement = async () => {
    try {
      setIsDownloading(true);
      const now = new Date();
      let startDate = new Date();

      switch (statementPeriod) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case '7days':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(now.getDate() - 30);
          break;
        case 'all':
        default:
          startDate = new Date(0);
          break;
      }

      const isoStartDate = startDate.getTime() > 0 ? startDate.toISOString() : undefined;
      const billParams = new URLSearchParams({ limit: '1000', includeStats: 'false' });
      if (isoStartDate) billParams.set('startDate', isoStartDate);

      const txParams = new URLSearchParams({ type: 'PAYMENT' });
      if (isoStartDate) txParams.set('startDate', isoStartDate);

      const [billsRes, txRes, settingsRes] = await Promise.all([
        api.get(`/bills?${billParams.toString()}`),
        api.get(`/transactions?${txParams.toString()}`),
        api.get('/settings')
      ]);

      const filteredBills = billsRes.data.data?.data || billsRes.data.data || [];
      const filteredTransactions = txRes.data.data || [];
      const shopSettings = settingsRes.data.data || {};

      generateStatementPDF(filteredBills, filteredTransactions, statementPeriod, shopSettings, t, formatCurrency, formatDate);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(t('Failed to download statement report.'));
    } finally {
      setIsDownloading(false);
    }
  };

  const salesData = analytics?.chartData || [];

  if (analyticsLoading) return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <SwirlingLoader />
    </div>
  );

  return (
    <div className="w-full space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12 pb-24 lg:pb-0">
      {/**
       * Reports Page Header
       * Page title, overview summary, and period statement PDF export controls.
       */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#191E2B]">{t('Reports & Analytics')}</h1>
          <p className="text-[#4E5668] text-xs sm:text-sm mt-1 sm:mt-1.5">{t('Detailed overview of your business performance')}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select
            value={statementPeriod}
            onChange={(e) => setStatementPeriod(e.target.value)}
            className="cursor-pointer bg-[#FBFBFC] border border-[#DCE1EA] text-[#191E2B] text-xs sm:text-sm rounded-lg px-4 sm:px-5 md:px-6 py-2 md:py-2.5 font-semibold w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] transition-colors duration-200 shadow-none"
          >
            <option value="today">{t('Today')}</option>
            <option value="7days">{t('Last 7 Days')}</option>
            <option value="30days">{t('Last 30 Days')}</option>
            <option value="all">{t('All Time')}</option>
          </select>
          <button
            onClick={downloadStatement}
            disabled={isDownloading}
            className="cursor-pointer bg-[#4338CA] hover:bg-[#3730A3] text-white px-4 sm:px-5 md:px-6 py-2 md:py-2.5 rounded-lg flex items-center whitespace-nowrap shrink-0 font-semibold text-xs sm:text-sm w-full sm:w-auto justify-center active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-none"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
            )}
            {isDownloading ? t('Generating...') : t('Export PDF')}
          </button>
        </div>
      </div>

      {/**
       * Monthly Financial Metrics
       * Metric cards showing monthly sales turnover, customer collections, and pending udhar.
       */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
        <div className="bg-[#FBFBFC] rounded-lg p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[7.5rem] sm:min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-[#DCE1EA] hover:border-[#C2C9D6] transition-all duration-200 overflow-hidden animate-fade-in cursor-default shadow-none">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg bg-[#EEF0FB] flex items-center justify-center text-[#4338CA] border border-[#D8DCF5]">
              <ChartNoAxesCombined className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-[#4E5668] mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Monthly Sales')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-[#191E2B] truncate">{formatCurrency(analytics?.monthlySales || 0)}</p>
            <p className="text-[10px] md:text-xs text-[#0D7A57] font-medium truncate mt-0.5">{t('Earned this month')}</p>
          </div>
        </div>

        <div className="bg-[#FBFBFC] rounded-lg p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[7.5rem] sm:min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-[#DCE1EA] hover:border-[#C2C9D6] transition-all duration-200 overflow-hidden animate-fade-in cursor-default shadow-none" style={{ animationDelay: '100ms' }}>
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg bg-[#EEF0FB] flex items-center justify-center text-[#4338CA] border border-[#D8DCF5]">
              <Wallet className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-[#4E5668] mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Monthly Collections')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-[#191E2B] truncate">{formatCurrency(analytics?.monthlyCollection || 0)}</p>
            <p className="text-[10px] md:text-xs text-[#0D7A57] font-medium truncate mt-0.5">{t('Collected this month')}</p>
          </div>
        </div>

        <div className="bg-[#FBFBFC] rounded-lg p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[7.5rem] sm:min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border-l-4 border-l-[#B91C1C] border-t border-t-[#DCE1EA] border-r border-r-[#DCE1EA] border-b border-b-[#DCE1EA] hover:border-r-[#C2C9D6] hover:border-t-[#C2C9D6] hover:border-b-[#C2C9D6] transition-all duration-200 overflow-hidden animate-fade-in cursor-default shadow-none" style={{ animationDelay: '200ms' }}>
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg bg-[#FFF1F2] flex items-center justify-center text-[#B91C1C] border border-[#FECDD3]">
              <IndianRupee className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-[#4E5668] mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Total Pending')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-[#191E2B] truncate">{formatCurrency(analytics?.pendingAmount || 0)}</p>
            <p className="text-[10px] md:text-xs text-[#B91C1C] font-medium truncate mt-0.5">{t('Needs Collection')}</p>
          </div>
        </div>
      </div>

      {/**
       * Analytical Visualizations Grid
       * Comparative charts for recent 7-day sales trend and monthly revenue collections.
       */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 lg:gap-6">
        {/**
         * Sales Trend Area Chart
         * Visualizes daily sales performance curve over the last 7 recorded days.
         */}
        <div className="bg-[#FBFBFC] border border-[#DCE1EA] rounded-xl p-4 md:p-5 lg:p-6 animate-fade-in shadow-none" style={{ animationDelay: '300ms' }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-5 gap-2">
            <div>
              <h3 className="text-base md:text-lg lg:text-xl font-semibold text-[#191E2B]">{t('Sales Trend (Last 7 Days)')}</h3>
              <div className="flex items-center gap-2 mt-1.5 md:mt-2">
                <div className="w-3 h-3 rounded-full bg-[#4338CA]"></div>
                <span className="text-sm font-medium text-[#4E5668]">{t('Sales')}</span>
              </div>
            </div>
          </div>
          <div className="w-full h-[220px] md:h-[250px] lg:h-[280px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={salesData} margin={{ top: 20, right: 20, left: -15, bottom: 10 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4338CA" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4338CA" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECF2" />
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
                    backgroundColor: '#FBFBFC',
                    border: '1px solid #DCE1EA',
                    borderRadius: '8px',
                    boxShadow: 'none',
                    padding: '6px 10px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                  labelStyle={{
                    color: '#191E2B',
                    fontWeight: '600',
                    marginBottom: '2px'
                  }}
                  itemStyle={{
                    padding: '0',
                    fontWeight: '500'
                  }}
                  formatter={(value) => [`₹${value}`, t('Sales')]}
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
        </div>

        {/**
         * Revenue Collections Bar Chart
         * Displays cash and digital collections growth across previous reporting months.
         */}
        <div className="bg-[#FBFBFC] border border-[#DCE1EA] rounded-xl p-4 md:p-5 lg:p-6 animate-fade-in shadow-none" style={{ animationDelay: '400ms' }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-5 gap-2">
            <div>
              <h3 className="text-base md:text-lg lg:text-xl font-semibold text-[#191E2B]">{t('Revenue Growth')}</h3>
              <div className="flex items-center gap-2 mt-1.5 md:mt-2">
                <div className="w-3 h-3 rounded-full bg-[#0D7A57]"></div>
                <span className="text-sm font-medium text-[#4E5668]">{t('Collections')}</span>
              </div>
            </div>
          </div>
          <div className="w-full h-[220px] md:h-[250px] lg:h-[280px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={salesData} margin={{ top: 20, right: 20, left: -15, bottom: 10 }}>
                <defs>
                  <linearGradient id="collectionsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D7A57" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0D7A57" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECF2" />
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
                    backgroundColor: '#FBFBFC',
                    border: '1px solid #DCE1EA',
                    borderRadius: '8px',
                    boxShadow: 'none',
                    padding: '6px 10px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                  labelStyle={{
                    color: '#191E2B',
                    fontWeight: '600',
                    marginBottom: '2px'
                  }}
                  itemStyle={{
                    padding: '0',
                    fontWeight: '500'
                  }}
                  formatter={(value) => [`₹${value}`, t('Collections')]}
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
        </div>
      </div>
    </div>
  );
};

export default Reports;
