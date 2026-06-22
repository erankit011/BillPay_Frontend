import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Plus, Search, FileText, Send, X, Loader2, Wallet, CreditCard, Users, Mail, MessageSquare, MoreVertical } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

const createBillSchema = yup.object({
  customerId: yup.string().required('Customer is required'),
  products: yup.array().of(
    yup.object({
      productId: yup.string().required('Product is required'),
      quantity: yup.number().min(1, 'Min quantity 1').required(),
    })
  ).min(1, 'Add at least one product'),
  amountPaid: yup.number().min(0, 'Cannot be negative').default(0),
});

const Bills = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // For send invoice dropdown
  const queryClient = useQueryClient();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.relative')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['bills'],
    queryFn: async () => {
      const res = await api.get('/bills');
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

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm({
    resolver: yupResolver(createBillSchema),
    defaultValues: {
      products: [{ productId: '', quantity: 1 }],
      amountPaid: 0
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'products'
  });

  const mutation = useMutation({
    mutationFn: (newBill) => api.post('/bills', newBill),
    onSuccess: () => {
      queryClient.invalidateQueries(['bills']);
      setIsModalOpen(false);
      reset();
    }
  });

  const handleCreateBill = (data) => {
    mutation.mutate(data);
  };

  const handleSendInvoice = async (billId, sendVia = 'whatsapp') => {
    try {
      const bill = bills.find(b => b._id === billId);
      
      // Validate if customer has required contact info
      if (sendVia === 'email' && !bill?.customerId?.email) {
        alert(t('Customer email not provided! Please add customer email first.'));
        return;
      }
      
      if (sendVia === 'whatsapp' && !bill?.customerId?.phone) {
        alert(t('Customer phone number not provided!'));
        return;
      }
      
      await api.post(`/invoices/generate/${billId}`, { sendVia });
      
      if (sendVia === 'email') {
        alert(t('Invoice sent via email successfully!'));
      } else if (sendVia === 'both') {
        alert(t('Invoice sent via WhatsApp and email successfully!'));
      } else {
        alert(t('Invoice sent via WhatsApp successfully!'));
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      alert(t('Failed to send invoice') + ': ' + errorMsg);
    }
  };

  const filteredBills = bills.filter(b => 
    b.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (b.customerId && b.customerId.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const revenueGrowth = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let thisMonthRevenue = 0;
    let lastMonthRevenue = 0;

    bills.forEach(b => {
      const bDate = new Date(b.createdAt);
      if (bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear) {
        thisMonthRevenue += b.grandTotal;
      } else if (bDate.getMonth() === previousMonth && bDate.getFullYear() === previousYear) {
        lastMonthRevenue += b.grandTotal;
      }
    });

    if (lastMonthRevenue === 0) return thisMonthRevenue > 0 ? 100 : 0;
    return ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
  }, [bills]);

  return (
    <div className="w-full space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">{t('Billing & Invoices')}</h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed">
            {t('Manage your shop\'s transactions, track pending payments,')}<br className="hidden sm:block"/>
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
        {/* Total Revenue */}
        <div className="bg-white rounded-xl p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
              <Wallet className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Total Revenue')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">
              {formatCurrency(bills.reduce((sum, b) => sum + b.grandTotal, 0))}
            </p>
            <p className={`text-[10px] md:text-xs font-medium truncate mt-0.5 ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% {t('this month')}
            </p>
          </div>
        </div>

        {/* Pending Udhar */}
        <div className="bg-white rounded-xl p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border-l-4 border-l-red-500 border-t border-t-gray-200 border-r border-r-gray-200 border-b border-b-gray-200 hover:border-r-gray-300 hover:border-t-gray-300 hover:border-b-gray-300 transition-all duration-200 overflow-hidden">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
              <CreditCard className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Pending Udhar')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">
              {formatCurrency(customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0))}
            </p>
            <p className="text-[10px] md:text-xs text-red-500 font-medium truncate mt-0.5">
              {customers.filter(c => c.balance > 0).length} {t('customers with udhar')}
            </p>
          </div>
        </div>

        {/* Active Customers */}
        <div className="bg-white rounded-xl p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
              <Users className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Active Customers')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">
              {new Set(bills.filter(b => b.customerId).map(b => b.customerId._id)).size}
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate mt-0.5">
              {bills.filter(b => b.customerId && new Date(b.createdAt) > new Date(Date.now() - 7*24*60*60*1000)).length} {t('new this week')}
            </p>
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
        ) : filteredBills.length === 0 ? (
          <div className="p-8 md:p-12 text-center text-gray-500">
            <FileText className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
            <p className="font-semibold text-sm md:text-base">{t('No bills found. Create your first bill!')}</p>
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
                  {filteredBills.map((bill, index) => (
                    <tr 
                      key={bill._id} 
                      className={`hover:bg-[#F5F5F5]/60 transition-all duration-200 animate-fade-in relative ${openDropdown === bill._id ? 'z-50' : 'z-0'}`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-4 lg:px-6 py-3.5 lg:py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-lg bg-[#F5F5F5] flex items-center justify-center flex-shrink-0 border border-gray-200">
                            <span className="text-[10px] lg:text-xs font-semibold text-[#093C5D]">
                              {bill.customerId?.name?.substring(0, 2).toUpperCase() || 'WI'}
                            </span>
                          </div>
                          <span className="text-xs lg:text-sm font-semibold text-[#093C5D] truncate">{bill.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3.5 lg:py-4">
                        <span className="text-xs lg:text-sm font-semibold text-gray-900 truncate block">{bill.customerId?.name || t('Walk-in Customer')}</span>
                      </td>
                      <td className="px-4 lg:px-6 py-3.5 lg:py-4">
                        <span className="text-xs lg:text-sm text-gray-600 font-medium">{new Date(bill.createdAt).toLocaleDateString('en-GB')}</span>
                      </td>
                      <td className="px-4 lg:px-6 py-3.5 lg:py-4 text-right">
                        <span className="text-xs lg:text-sm font-semibold text-gray-900">{formatCurrency(bill.grandTotal)}</span>
                      </td>
                      <td className="px-4 lg:px-6 py-3.5 lg:py-4 text-center">
                        <span className={`inline-block px-2.5 lg:px-3 py-1 lg:py-1.5 text-[10px] lg:text-xs font-semibold rounded-full uppercase tracking-wide
                          ${bill.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 
                            bill.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-red-100 text-red-700'}`}>
                          {bill.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-3.5 lg:py-4 text-right">
                        <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => setOpenDropdown(openDropdown === bill._id ? null : bill._id)}
                            className="cursor-pointer text-[#093C5D] font-semibold bg-[#093C5D]/5 hover:bg-[#093C5D]/10 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg flex items-center justify-center ml-auto transition-all text-xs lg:text-sm active:scale-95"
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredBills.map((bill, index) => (
                <div 
                  key={bill._id} 
                  className={`p-4 animate-fade-in hover:bg-[#F5F5F5] transition-colors relative ${openDropdown === bill._id ? 'z-50' : 'z-0'}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#F5F5F5] flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-[#093C5D]">
                        {bill.customerId?.name?.substring(0, 2).toUpperCase() || 'WI'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">{bill.customerId?.name || t('Walk-in Customer')}</h4>
                      <p className="text-xs font-semibold text-[#093C5D] mt-0.5">{bill.invoiceNumber}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(bill.createdAt).toLocaleDateString('en-GB')}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(bill.grandTotal)}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-3 gap-2">
                    <span className={`px-2.5 py-1.5 text-xs font-semibold rounded-full uppercase
                          ${bill.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 
                            bill.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-red-100 text-red-700'}`}>
                      {bill.paymentStatus}
                    </span>
                    
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
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
              ))}
            </div>

            {/* Pagination Info */}
            <div className="px-4 md:px-6 py-3 md:py-4 bg-gray-50/50 border-t border-gray-100">
              <p className="text-xs text-gray-600">
                {t('Showing')} 1 {t('to')} {filteredBills.length} {t('of')} {bills.length} {t('invoices')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create Bill Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-3 md:px-4 py-6 md:py-8">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-modal-overlay" onClick={() => setIsModalOpen(false)} />
            <div className="relative bg-white border border-gray-200 rounded-xl max-w-2xl w-full p-5 md:p-6 lg:p-8 animate-modal-content">
              <div className="flex items-center justify-between mb-5 md:mb-6 pb-4 md:pb-5 border-b border-gray-200">
                <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">{t('Create New Bill')}</h3>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="cursor-pointer text-gray-400 hover:text-gray-600 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all active:scale-95 flex-shrink-0"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit(handleCreateBill)} className="space-y-4 md:space-y-5">
              {/* Customer Select */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-800 mb-2">{t('Select Customer')}</label>
                <select 
                  {...register('customerId')} 
                  className="cursor-pointer w-full font-medium rounded-lg border border-gray-300 px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-all"
                >
                  <option value="">-- {t('Select Customer')} --</option>
                  {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>)}
                </select>
                {errors.customerId && <p className="text-red-500 text-xs mt-1.5 font-semibold">{errors.customerId.message}</p>}
              </div>

              {/* Products */}
              <div className="space-y-2.5 md:space-y-3">
                <label className="block text-xs md:text-sm font-semibold text-gray-800 mb-2">{t('Products')}</label>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <select 
                      {...register(`products.${index}.productId`)} 
                      className="cursor-pointer flex-1 font-medium rounded-lg border border-gray-300 px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-all"
                    >
                      <option value="">-- {t('Select Product')} --</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name} - ₹{p.price}</option>)}
                    </select>
                    <input 
                      type="number" 
                      {...register(`products.${index}.quantity`)} 
                      placeholder="Qty" 
                      className="w-25 sm:w-20 font-medium rounded-lg sm:rounded-lg border border-gray-300 px-2 sm:px-3 py-2.5 sm:py-3 text-xs sm:text-sm focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-all" 
                    />
                    {fields.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => remove(index)} 
                        className="cursor-pointer text-red-500 hover:bg-red-50 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl active:scale-95 transition-all flex-shrink-0"
                      >
                        <X className="w-4 h-4 sm:w-5 sm:h-5"/>
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => append({ productId: '', quantity: 1 })} 
                  className="cursor-pointer text-[#093C5D] text-xs sm:text-sm font-semibold hover:text-[#082a42] flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t('Add another product')}
                </button>
              </div>

              {/* Amount Paid */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">{t('Amount Paid (Advance)')}</label>
                <input 
                  type="number" 
                  {...register('amountPaid')} 
                  className="w-full rounded-lg font-medium sm:rounded-lg border border-gray-300 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-all" 
                  placeholder="0"
                />
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={mutation.isPending} 
                className="cursor-pointer w-full bg-[#093C5D] hover:bg-[#082a42] text-white rounded-lg py-2.5 sm:py-3 md:py-3.5 font-semibold text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-[0.98] transition-all"
              >
                {mutation.isPending ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                    {t('Processing...')}
                  </span>
                ) : (
                  t('Generate Bill')
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default Bills;
