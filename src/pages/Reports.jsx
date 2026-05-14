import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, Calendar, IndianRupee } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTranslation } from 'react-i18next';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
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

  const salesData = analytics?.chartData || [];

  if (analyticsLoading) return <div className="p-8 text-center text-gray-500">{t('Loading')}...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('Reports & Analytics')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('Detailed overview of your business performance')}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <select 
            value={statementPeriod} 
            onChange={(e) => setStatementPeriod(e.target.value)}
            className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2"
          >
            <option value="today">{t('Today')}</option>
            <option value="7days">{t('Last 7 Days')}</option>
            <option value="30days">{t('Last 30 Days')}</option>
            <option value="all">{t('All Time')}</option>
          </select>
          <button 
            onClick={downloadStatement}
            disabled={billsLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center font-medium disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-2" />
            {t('Export PDF')}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: t('Monthly Sales'), value: formatCurrency(analytics?.monthlySales || 0), icon: Calendar, color: "text-gray-400" },
          { title: t('Monthly Collections'), value: formatCurrency(analytics?.monthlyCollection || 0), icon: IndianRupee, color: "text-green-600" },
          { title: t('Total Pending'), value: formatCurrency(analytics?.pendingAmount || 0), icon: IndianRupee, color: "text-red-600" }
        ].map((card, index) => (
          <div 
            key={index} 
            className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-500 font-medium text-sm">{card.title}</h3>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <h3 className="text-lg font-bold text-gray-900 mb-4">{t('Sales Trend (Last 7 Days)')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e5e7eb' }} />
                <Bar dataKey="sales" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <h3 className="text-lg font-bold text-gray-900 mb-4">{t('Revenue Growth')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`} />
                <Tooltip contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e5e7eb' }} />
                <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
