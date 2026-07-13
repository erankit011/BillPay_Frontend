import { useState, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Plus, Search, FileText, Send, Loader2, Wallet, Users, Mail, MessageSquare, MoreVertical, IndianRupee, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import InfiniteScrollObserver from '../components/common/InfiniteScrollObserver';
import CreateBillModal from '../components/bills/CreateBillModal';
import ViewBillModal from '../components/bills/ViewBillModal';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
};

const getInitials = (name) => {
  if (!name) return 'WI';
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const Bills = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [viewBill, setViewBill] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.relative')) setOpenDropdown(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['bills', debouncedSearch],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get(`/bills?page=${pageParam}&limit=15&search=${encodeURIComponent(debouncedSearch)}`);
      return res.data.data; // Return the entire paginated object
    },
    getNextPageParam: (lastPage) => lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined,
    staleTime: 1 * 60 * 1000, // Data is fresh for 1 min
    gcTime: 5 * 60 * 1000,   // Garbage collect (delete from memory) if unused for 5 mins
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: async () => {
      const res = await api.get('/customers?limit=1000');
      return res.data.data.data || res.data.data || [];
    }
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => {
      const res = await api.get('/products?limit=1000');
      return res.data.data.data || res.data.data || [];
    }
  });

  const bills = data?.pages?.flatMap(page => page.data || []) || [];

  const handleSendInvoice = async (billId, sendVia = 'whatsapp') => {
    try {
      const bill = bills.find(b => b._id === billId);
      if (sendVia === 'email' && !bill?.customerId?.email) {
        alert(t('Customer email not provided! Please add customer email first.'));
        return;
      }
      if (sendVia === 'whatsapp' && !bill?.customerId?.phone) {
        alert(t('Customer phone number not provided!'));
        return;
      }

      await api.post(`/invoices/generate/${billId}`, { sendVia });

      if (sendVia === 'email') alert(t('Invoice sent via email successfully!'));
      else if (sendVia === 'both') alert(t('Invoice sent via WhatsApp and email successfully!'));
      else alert(t('Invoice sent via WhatsApp successfully!'));
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      alert(t('Failed to send invoice') + ': ' + errorMsg);
    }
  };

  const firstPage = data?.pages?.[0];
  const stats = firstPage?.stats || {
    totalRevenue: 0, revenueGrowth: 0, pendingUdharTotal: 0, customersWithUdhar: 0, activeCustomers: 0, newCustomersThisWeek: 0,
    billCounts: { today: 0, yesterday: 0, week: 0, month: 0, lifetime: 0 }
  };

  return (
    <div className="w-full space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">{t('Billing & Invoices')}</h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed">
            {t('Manage your shop\'s transactions, track pending payments,')}<br className="hidden sm:block" />
            {t('and send instant WhatsApp invoices to your customers.')}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="cursor-pointer bg-[#093C5D] hover:bg-[#082a42] text-white px-4 sm:px-5 md:px-6 py-2 md:py-2.5 rounded-lg flex items-center whitespace-nowrap shrink-0 font-semibold text-xs md:text-sm w-full sm:w-auto justify-center active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
          {t('Create New Bill')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
        <div className="bg-white rounded-xl p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
              <Wallet className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Total Revenue')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">
              {formatCurrency(stats.totalRevenue)}
            </p>
            <p className={`text-[10px] md:text-xs font-medium truncate mt-0.5 ${stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth.toFixed(1)}% {t('this month')}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border-l-4 border-l-red-500 border-t border-t-gray-200 border-r border-r-gray-200 border-b border-b-gray-200 hover:border-r-gray-300 hover:border-t-gray-300 hover:border-b-gray-300 transition-all duration-200 overflow-hidden">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
              <IndianRupee className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Pending Udhar')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">
              {formatCurrency(stats.pendingUdharTotal)}
            </p>
            <p className="text-[10px] md:text-xs text-red-500 font-medium truncate mt-0.5">
              {stats.customersWithUdhar} {t('customers with udhar')}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
              <Users className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Active Customers')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">
              {stats.activeCustomers}
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate mt-0.5">
              {stats.newCustomersThisWeek} {t('new this week')}
            </p>
          </div>
        </div>
      </div>

      {/* Bill Count Stats */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-[#093C5D] to-[#125887] px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3.5 flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="w-4 h-4 md:w-5 md:h-5 mr-2 text-white/90" />
            <h3 className="text-xs md:text-sm font-semibold text-white tracking-wide uppercase">{t('Bills Generated Overview')}</h3>
          </div>
        </div>
        <div className="p-2 sm:p-4 md:p-5 bg-gray-50/30">
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 md:gap-4 lg:gap-5">
            <div className="bg-white rounded-lg sm:rounded-xl p-2.5 px-3 sm:p-3 md:p-4 flex flex-row sm:flex-col items-center justify-between sm:justify-center text-left sm:text-center border border-gray-100 hover:bg-gray-50 hover:border-[#093C5D]/40 transition-all duration-300 cursor-default">
              <p className="text-[10px] md:text-xs text-gray-500 font-medium uppercase tracking-wider mb-0 sm:mb-1.5">{t('Today')}</p>
              <p className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-semibold text-gray-800">{stats.billCounts.today}</p>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl p-2.5 px-3 sm:p-3 md:p-4 flex flex-row sm:flex-col items-center justify-between sm:justify-center text-left sm:text-center border border-gray-100 hover:bg-gray-50 hover:border-[#093C5D]/40 transition-all duration-300 cursor-default">
              <p className="text-[10px] md:text-xs text-gray-500 font-medium uppercase tracking-wider mb-0 sm:mb-1.5">{t('Yesterday')}</p>
              <p className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-semibold text-gray-800">{stats.billCounts.yesterday}</p>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl p-2.5 px-3 sm:p-3 md:p-4 flex flex-row sm:flex-col items-center justify-between sm:justify-center text-left sm:text-center border border-gray-100 hover:bg-gray-50 hover:border-[#093C5D]/40 transition-all duration-300 cursor-default">
              <p className="text-[10px] md:text-xs text-gray-500 font-medium uppercase tracking-wider mb-0 sm:mb-1.5">{t('This Week')}</p>
              <p className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-semibold text-gray-800">{stats.billCounts.week}</p>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl p-2.5 px-3 sm:p-3 md:p-4 flex flex-row sm:flex-col items-center justify-between sm:justify-center text-left sm:text-center border border-gray-100 hover:bg-gray-50 hover:border-[#093C5D]/40 transition-all duration-300 cursor-default">
              <p className="text-[10px] md:text-xs text-gray-500 font-medium uppercase tracking-wider mb-0 sm:mb-1.5">{t('This Month')}</p>
              <p className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-semibold text-gray-800">{stats.billCounts.month}</p>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl p-2.5 px-3 sm:p-3 md:p-4 flex flex-row sm:flex-col items-center justify-between sm:justify-center text-left sm:text-center border border-gray-100 hover:bg-gray-50 hover:border-[#093C5D]/40 transition-all duration-300 cursor-default sm:col-span-3 md:col-span-1">
              <p className="text-[10px] md:text-xs text-gray-500 font-medium uppercase tracking-wider mb-0 sm:mb-1.5">{t('Lifetime')}</p>
              <p className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-semibold text-gray-800">{stats.billCounts.lifetime}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full md:max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder={t("Search by invoice number or customer...")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] text-xs sm:text-sm transition-all"
        />
      </div>

      {/* Bills Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 md:p-12 text-center text-gray-500 flex justify-center">
            <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-[#093C5D]" />
          </div>
        ) : isError ? (
          <div className="p-8 md:p-12 text-center text-red-500">
            <p className="font-medium text-sm md:text-base">{t('Failed to load bills.')}</p>
          </div>
        ) : bills.length === 0 ? (
          <div className="p-8 md:p-12 text-center text-gray-500">
            <FileText className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
            <p className="font-medium text-sm md:text-base">{t('No bills found. Create your first bill!')}</p>
          </div>
        ) : (
          <div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50/80 border-b border-gray-200">
                  <tr>
                    <th className="w-[22%] px-4 lg:px-6 py-3.5 lg:py-4 text-left text-[10px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Invoice')}</th>
                    <th className="w-[22%] px-4 lg:px-6 py-3.5 lg:py-4 text-left text-[10px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Customer')}</th>
                    <th className="w-[15%] px-4 lg:px-6 py-3.5 lg:py-4 text-left text-[10px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Date')}</th>
                    <th className="w-[15%] px-4 lg:px-6 py-3.5 lg:py-4 text-right text-[10px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Amount')}</th>
                    <th className="w-[12%] px-4 lg:px-6 py-3.5 lg:py-4 text-center text-[10px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Status')}</th>
                    <th className="w-[14%] px-4 lg:px-6 py-3.5 lg:py-4 text-right text-[10px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bills.map((bill, index) => (
                    <tr
                      key={bill._id}
                      className={`hover:bg-[#F5F5F5]/60 transition-all duration-200 animate-fade-in relative ${openDropdown === bill._id ? 'z-50' : 'z-0'}`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-4 lg:px-6 py-3.5 lg:py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-lg bg-[#F5F5F5] flex items-center justify-center flex-shrink-0 border border-gray-200">
                            <span className="text-[10px] lg:text-xs font-semibold text-[#093C5D]">
                              {getInitials(bill.customerId?.name)}
                            </span>
                          </div>
                          <span className="text-xs lg:text-sm font-semibold text-[#093C5D] truncate">{bill.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3.5 lg:py-4">
                        <span className="text-xs lg:text-sm font-semibold text-gray-900 truncate block">{bill.customerId?.name || t('Walk-in Customer')}</span>
                        {bill.customerId?.balance > 0 && (
                          <span className="text-[10px] lg:text-xs text-red-500 font-medium block mt-0.5">
                            {t('Total Due')}: {formatCurrency(bill.customerId.balance)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-3.5 lg:py-4">
                        <span className="text-xs lg:text-sm text-gray-900 font-medium block whitespace-nowrap">{new Date(bill.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                        <span className="text-[10px] lg:text-xs text-gray-500 font-medium block mt-0.5 whitespace-nowrap uppercase tracking-wider">{new Date(bill.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                      </td>
                      <td className="px-4 lg:px-6 py-3.5 lg:py-4 text-right">
                        <span className="text-xs lg:text-sm font-semibold text-gray-900 block">{formatCurrency(bill.grandTotal)}</span>
                        {bill.grandTotal > (bill.amountPaid || 0) ? (
                          <span className="text-[10px] lg:text-xs text-red-500 font-medium block mt-0.5">
                            {t('Pending')}: {formatCurrency(bill.grandTotal - (bill.amountPaid || 0))}
                          </span>
                        ) : (bill.amountPaid || 0) > bill.grandTotal ? (
                          <span className="text-[10px] lg:text-xs text-green-500 font-medium block mt-0.5">
                            {t('Advance')}: {formatCurrency((bill.amountPaid || 0) - bill.grandTotal)}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 lg:px-6 py-3.5 lg:py-4 text-center">
                        <span className={`inline-block px-2.5 lg:px-3 py-1 lg:py-1 text-[10px] lg:text-xs font-semibold rounded-full uppercase tracking-wide
                          ${(bill.paymentStatus === 'PAID' || bill.paymentStatus === 'ADVANCE') ? 'bg-green-100 text-green-700' :
                            bill.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'}`}>
                          {bill.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-3.5 lg:py-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewBill(bill);
                            }}
                            className="cursor-pointer text-[#093C5D] font-semibold bg-[#093C5D]/5 hover:bg-[#093C5D]/10 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg flex items-center justify-center transition-all text-xs lg:text-sm active:scale-95"
                            title={t('View Bill')}
                          >
                            <Eye className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                          </button>

                          <div className="relative inline-block">
                            <button
                              onClick={() => setOpenDropdown(openDropdown === bill._id ? null : bill._id)}
                              className="cursor-pointer text-[#093C5D] font-semibold bg-[#093C5D]/5 hover:bg-[#093C5D]/10 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg flex items-center justify-center transition-all text-xs lg:text-sm active:scale-95"
                            >
                              <Send className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1 lg:mr-1.5" /> {t('Send')}
                              <MoreVertical className="w-3.5 h-3.5 ml-1" />
                            </button>

                            {/* Dropdown Menu */}
                            {openDropdown === bill._id && (
                              <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  handleSendInvoice(bill._id, 'whatsapp');
                                  setOpenDropdown(null);
                                }}
                                className="cursor-pointer w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 active:scale-95"
                              >
                                <MessageSquare className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <span>{t('Send via WhatsApp')}</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSendInvoice(bill._id, 'email');
                                  setOpenDropdown(null);
                                }}
                                className="cursor-pointer w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 active:scale-95 border-t border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!bill.customerId?.email}
                              >
                                <Mail className="w-4 h-4 text-[#093C5D] flex-shrink-0" />
                                <span className={!bill.customerId?.email ? 'text-gray-400' : ''}>
                                  {t('Send via Email')}
                                  {!bill.customerId?.email && <span className="text-xs"> (No email)</span>}
                                </span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSendInvoice(bill._id, 'both');
                                  setOpenDropdown(null);
                                }}
                                className="cursor-pointer w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 active:scale-95 border-t border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!bill.customerId?.email || !bill.customerId?.phone}
                              >
                                <Send className="w-4 h-4 text-[#093C5D] flex-shrink-0" />
                                <span className={(!bill.customerId?.email || !bill.customerId?.phone) ? 'text-gray-400' : ''}>
                                  {t('Send Both')}
                                </span>
                              </button>
                            </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {bills.map((bill, index) => (
                <div
                  key={bill._id}
                  className={`p-4 animate-fade-in hover:bg-[#F5F5F5] transition-colors relative ${openDropdown === bill._id ? 'z-50' : 'z-0'}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#F5F5F5] flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-[#093C5D]">
                        {getInitials(bill.customerId?.name)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 truncate block">{bill.customerId?.name || t('Walk-in Customer')}</h4>
                      {bill.customerId?.balance > 0 && (
                        <p className="text-[10px] text-red-500 font-medium mb-1">
                          {t('Total Due')}: {formatCurrency(bill.customerId.balance)}
                        </p>
                      )}
                      <p className="text-xs font-semibold text-[#093C5D] mt-0.5">{bill.invoiceNumber}</p>
                      <p className="text-xs text-gray-500 mt-1 whitespace-nowrap">
                        {new Date(bill.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} • {new Date(bill.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(bill.grandTotal)}</p>
                      {bill.grandTotal > (bill.amountPaid || 0) ? (
                        <p className="text-[10px] text-red-500 font-medium mt-1">
                          {t('Pend')}: {formatCurrency(bill.grandTotal - (bill.amountPaid || 0))}
                        </p>
                      ) : (bill.amountPaid || 0) > bill.grandTotal ? (
                        <p className="text-[10px] text-green-500 font-medium mt-1">
                          {t('Adv')}: {formatCurrency((bill.amountPaid || 0) - bill.grandTotal)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-3 gap-2">
                    <span className={`px-2.5 py-1.5 text-xs font-semibold rounded-full uppercase
                          ${(bill.paymentStatus === 'PAID' || bill.paymentStatus === 'ADVANCE') ? 'bg-green-100 text-green-700' :
                        bill.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'}`}>
                      {bill.paymentStatus}
                    </span>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewBill(bill);
                        }}
                        className="cursor-pointer text-[#093C5D] font-semibold bg-[#093C5D]/5 hover:bg-[#F5F5F5] w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === bill._id ? null : bill._id)}
                          className="cursor-pointer text-[#093C5D] font-semibold bg-[#093C5D]/5 hover:bg-[#F5F5F5] px-3 py-1.5 rounded-full flex items-center text-xs transition-all active:scale-95 whitespace-nowrap"
                        >
                          <Send className="w-3.5 h-3.5 mr-1" /> {t('Send')}
                          <MoreVertical className="w-3 h-3 ml-0.5" />
                        </button>

                        {/* Dropdown Menu */}
                        {openDropdown === bill._id && (
                          <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                              handleSendInvoice(bill._id, 'whatsapp');
                              setOpenDropdown(null);
                            }}
                            className="cursor-pointer w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 active:scale-95"
                          >
                            <MessageSquare className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span>{t('Send via WhatsApp')}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendInvoice(bill._id, 'email');
                              setOpenDropdown(null);
                            }}
                            className="cursor-pointer w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 active:scale-95 border-t border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!bill.customerId?.email}
                          >
                            <Mail className="w-4 h-4 text-[#093C5D] flex-shrink-0" />
                            <span className={!bill.customerId?.email ? 'text-gray-400' : ''}>
                              {t('Send via Email')}
                              {!bill.customerId?.email && <span className="text-xs"> (No email)</span>}
                            </span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendInvoice(bill._id, 'both');
                              setOpenDropdown(null);
                            }}
                            className="cursor-pointer w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 active:scale-95 border-t border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!bill.customerId?.email || !bill.customerId?.phone}
                          >
                            <Send className="w-4 h-4 text-[#093C5D] flex-shrink-0" />
                            <span className={(!bill.customerId?.email || !bill.customerId?.phone) ? 'text-gray-400' : ''}>
                              {t('Send Both')}
                            </span>
                          </button>
                        </div>
                      )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <InfiniteScrollObserver 
              hasNextPage={hasNextPage} 
              isFetchingNextPage={isFetchingNextPage} 
              fetchNextPage={fetchNextPage} 
            />

          </div>
        )}
      </div>

      <ViewBillModal viewBill={viewBill} setViewBill={setViewBill} />
      
      <CreateBillModal 
        isModalOpen={isModalOpen} 
        setIsModalOpen={setIsModalOpen} 
        customers={customers} 
        products={products} 
      />
    </div>
  );
};

export default Bills;
