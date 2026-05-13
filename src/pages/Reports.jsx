import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, FileText, Calendar, IndianRupee, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTranslation } from 'react-i18next';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

const Reports = () => {
  const { t } = useTranslation();
  const [statementPeriod, setStatementPeriod] = useState('7days'); // 'today', '7days', '30days', 'all'

  // Fetch Dashboard Analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['dashboardAnalytics'],
    queryFn: async () => {
      const res = await api.get('/reports/dashboard');
      return res.data.data;
    }
  });

  // Fetch All Bills for Statement
  const { data: bills = [], isLoading: billsLoading } = useQuery({
    queryKey: ['bills'],
    queryFn: async () => {
      const res = await api.get('/bills');
      return res.data.data;
    }
  });

  const downloadStatement = () => {
    // 1. Filter bills based on selected period
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
        startDate = new Date(0); // Beginning of time
        break;
    }

    const filteredBills = bills.filter(bill => new Date(bill.createdAt) >= startDate);

    // 2. Generate PDF using jsPDF and jspdf-autotable
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(31, 41, 55); // Gray-800
    doc.text(t('Store Statement'), 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(107, 114, 128); // Gray-500
    const periodLabels = {
      'today': t('Today'),
      '7days': t('Last 7 Days'),
      '30days': t('Last 30 Days'),
      'all': t('All Time')
    };
    
    doc.text(`${t('Period')}: ${periodLabels[statementPeriod]}`, 14, 32);
    doc.text(`${t('Generated on')}: ${new Date().toLocaleDateString()}`, 14, 38);
    
    // Table
    const tableColumn = [t("Invoice No"), t("Customer"), t("Date"), t("Amount"), t("Status")];
    const tableRows = [];
    
    let totalSales = 0;
    let totalCollections = 0;

    filteredBills.forEach(bill => {
      totalSales += bill.grandTotal;
      if (bill.paymentStatus === 'PAID') {
         totalCollections += bill.grandTotal;
      } else if (bill.paymentStatus === 'PARTIAL') {
         totalCollections += bill.amountPaid;
      }

      const billData = [
        bill.invoiceNumber,
        bill.customerId?.name || t('Walk-in Customer'),
        new Date(bill.createdAt).toLocaleDateString(),
        `Rs ${bill.grandTotal}`,
        bill.paymentStatus
      ];
      tableRows.push(billData);
    });
    
    autoTable(doc, {
      startY: 45,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255 }, // Indigo-600
      styles: { fontSize: 10, cellPadding: 4 },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    });
    
    // Summary at the bottom
    const finalY = doc.lastAutoTable.finalY || 45;
    
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    doc.text(`${t('Total Bills')}: ${filteredBills.length}`, 14, finalY + 15);
    doc.text(`${t('Total Sales')}: Rs ${totalSales.toFixed(2)}`, 14, finalY + 22);
    doc.text(`${t('Total Collections')}: Rs ${totalCollections.toFixed(2)}`, 14, finalY + 29);
    
    doc.save(`Store_Statement_${statementPeriod}.pdf`);
  };

  // Mock data for charts
  const salesData = [
    { name: 'Jan', sales: 4000 },
    { name: 'Feb', sales: 3000 },
    { name: 'Mar', sales: 5000 },
    { name: 'Apr', sales: 4500 },
    { name: 'May', sales: 6000 },
    { name: 'Jun', sales: 5500 },
  ];

  if (analyticsLoading) return <div className="p-8 text-center text-gray-500">{t('Loading')}...</div>;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('Reports & Analytics')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('Detailed overview of your business performance')}</p>
        </div>
        
        {/* PDF Export Section with Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto bg-gray-50 p-2 rounded-xl border border-gray-200">
          <select 
            value={statementPeriod} 
            onChange={(e) => setStatementPeriod(e.target.value)}
            className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2 w-full sm:w-auto shadow-sm"
          >
            <option value="today">{t('Today')}</option>
            <option value="7days">{t('Last 7 Days')}</option>
            <option value="30days">{t('Last 30 Days')}</option>
            <option value="all">{t('All Time')}</option>
          </select>
          <button 
            onClick={downloadStatement}
            disabled={billsLoading}
            className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center shadow-sm w-full sm:w-auto justify-center font-medium transition-colors disabled:opacity-50"
          >
            <Download className="w-5 h-5 mr-2" />
            {t('Export PDF')}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 font-medium">{t('Monthly Sales')}</h3>
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Calendar className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <p className="text-3xl font-semibold text-gray-900">{formatCurrency(analytics?.monthlySales || 0)}</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 font-medium">{t('Monthly Collections')}</h3>
              <div className="p-2 bg-green-50 rounded-lg">
                <IndianRupee className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-semibold text-gray-900">{formatCurrency(analytics?.monthlyCollection || 0)}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 font-medium">{t('Total Pending')}</h3>
              <div className="p-2 bg-red-50 rounded-lg">
                <FileText className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-3xl font-semibold text-gray-900">{formatCurrency(analytics?.pendingAmount || 0)}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('Sales Trend (Last 6 Months)')}</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="sales" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Line Chart */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('Revenue Growth')}</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="sales" stroke="#10B981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
