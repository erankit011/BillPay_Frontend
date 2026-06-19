import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Calendar, Wallet, CreditCard, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTranslation } from 'react-i18next';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
};

const Reports = () => {
  const { t } = useTranslation();
  const [statementPeriod, setStatementPeriod] = useState('all');

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['dashboardAnalytics'],
    queryFn: async () => {
      const res = await api.get('/reports/dashboard');
      return res.data.data;
    }
  });

  const { data: bills = [], isLoading: billsLoading } = useQuery({
    queryKey: ['bills'],
    queryFn: async () => {
      const res = await api.get('/bills');
      return res.data.data;
    }
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const res = await api.get('/transactions');
      return res.data.data;
    }
  });

  const downloadStatement = () => {
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

    const filteredBills = bills.filter(bill => new Date(bill.createdAt) >= startDate);
    const filteredTransactions = transactions.filter(tx => new Date(tx.createdAt) >= startDate && tx.type === 'PAYMENT');

    if (filteredBills.length === 0 && filteredTransactions.length === 0) {
      alert(t("No data available for the selected period."));
      return;
    }

    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text(t('Store Statement'), 14, 20);
    
    doc.setFontSize(10);
    const periodLabels = {
      'today': t('Today'),
      '7days': t('Last 7 Days'),
      '30days': t('Last 30 Days'),
      'all': t('All Time')
    };
    
    doc.text(`${t('Period')}: ${periodLabels[statementPeriod]}`, 14, 30);
    doc.text(`${t('Generated on')}: ${new Date().toLocaleDateString()}`, 14, 36);
    
    const tableColumn = [t("Invoice No"), t("Customer"), t("Date"), t("Amount"), t("Status")];
    const tableRows = [];
    
    let totalSales = 0;
    let totalCollections = 0;

    filteredBills.forEach(bill => {
      totalSales += bill.grandTotal;
      const billData = [
        bill.invoiceNumber,
        bill.customerId?.name || t('Walk-in Customer'),
        new Date(bill.createdAt).toLocaleDateString(),
        `Rs ${bill.grandTotal}`,
        bill.paymentStatus
      ];
      tableRows.push(billData);
    });

    filteredTransactions.forEach(tx => {
      totalCollections += tx.amount;
    });
    
    autoTable(doc, {
      startY: 42,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
    });
    
    const finalY = doc.lastAutoTable.finalY || 42;
    
    doc.setFontSize(11);
    doc.text(`${t('Total Bills')}: ${filteredBills.length}`, 14, finalY + 12);
    doc.text(`${t('Total Sales')}: Rs ${totalSales.toFixed(2)}`, 14, finalY + 18);
    doc.text(`${t('Total Collections')}: Rs ${totalCollections.toFixed(2)}`, 14, finalY + 24);
    
    doc.save(`Store_Statement_${statementPeriod}.pdf`);
  };

  const salesData = analytics?.chartData && analytics.chartData.length > 0
    ? analytics.chartData
    : [
      { name: 'Sat', sales: 800, collections: 600 },
      { name: 'Sun', sales: 1200, collections: 900 },
      { name: 'Mon', sales: 1500, collections: 1100 },
      { name: 'Tue', sales: 1800, collections: 1400 },
      { name: 'Wed', sales: 2200, collections: 1600 },
      { name: 'Thu', sales: 2800, collections: 2000 },
      { name: 'Fri', sales: 3200, collections: 2500 },
    ];

  if (analyticsLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#093C5D]"></div>
    </div>
  );

  return (
    <div className="w-full space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">{t('Reports & Analytics')}</h1>
            <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5">{t('Detailed overview of your business performance')}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <select 
              value={statementPeriod} 
              onChange={(e) => setStatementPeriod(e.target.value)}
              className="cursor-pointer bg-white border border-gray-300 text-gray-700 text-xs sm:text-sm rounded-full px-4 sm:px-5 md:px-6 py-2 md:py-2.5 font-semibold w-full sm:w-auto focus:outline-none focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200"
            >
              <option value="today">{t('Today')}</option>
              <option value="7days">{t('Last 7 Days')}</option>
              <option value="30days">{t('Last 30 Days')}</option>
              <option value="all">{t('All Time')}</option>
            </select>
            <button 
              onClick={downloadStatement}
              disabled={billsLoading}
              className="cursor-pointer bg-[#093C5D] hover:bg-[#082a42] text-white px-4 sm:px-5 md:px-6 py-2 md:py-2.5 rounded-lg flex items-center whitespace-nowrap shrink-0 font-semibold text-xs sm:text-sm w-full sm:w-auto justify-center active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
              {t('Export PDF')}
            </button>
          </div>
        </div>

                {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
          <div className="bg-white rounded-xl p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden animate-fade-in">
            <div className="flex justify-between items-start gap-1">
              <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
                <Calendar className="w-4 h-4 md:w-5 md:h-5" />
              </div>
            </div>
            <div className="mt-auto pt-2 min-w-0">
              <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Monthly Sales')}</p>
              <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">{formatCurrency(analytics?.monthlySales || 1200)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="flex justify-between items-start gap-1">
              <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
                <Wallet className="w-4 h-4 md:w-5 md:h-5" />
              </div>
            </div>
            <div className="mt-auto pt-2 min-w-0">
              <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Monthly Collections')}</p>
              <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">{formatCurrency(analytics?.monthlyCollection || 2500)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden animate-fade-in " style={{ animationDelay: '200ms' }}>
            <div className="flex justify-between items-start gap-1">
              <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
                <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />
              </div>
            </div>
            <div className="mt-auto pt-2 min-w-0">
              <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Total Pending')}</p>
              <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">{formatCurrency(analytics?.pendingAmount || 69700)}</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 lg:gap-6">
          {/* Sales Trend */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 lg:p-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-5 gap-2">
              <div>
                <h3 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">{t('Sales Trend (Last 7 Days)')}</h3>
                <div className="flex items-center gap-2 mt-1.5 md:mt-2">
                  <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                  <span className="text-sm font-medium text-gray-600">{t('Sales')}</span>
                </div>
              </div>
            </div>
            <div className="w-full h-[220px] md:h-[250px] lg:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4b5563" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4b5563" stopOpacity={0}/>
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
                    tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                    labelStyle={{
                      fontWeight: '700',
                      marginBottom: '4px'
                    }}
                    formatter={(value) => [`₹${value}`, t('Sales')]}
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
          </div>

          {/* Revenue Growth */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 lg:p-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-5 gap-2">
              <div>
                <h3 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">{t('Revenue Growth')}</h3>
                <div className="flex items-center gap-2 mt-1.5 md:mt-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-gray-600">{t('Collections')}</span>
                </div>
              </div>
            </div>
            <div className="w-full h-[220px] md:h-[250px] lg:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="collectionsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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
                    tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                    labelStyle={{
                      fontWeight: '700',
                      marginBottom: '4px'
                    }}
                    formatter={(value) => [`₹${value}`, t('Collections')]}
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
          </div>
        </div>
    </div>
  );
};

export default Reports;
