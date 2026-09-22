import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Plus, Search, Phone, IndianRupee, History, Loader2, Edit, Trash2, Users, Wallet, FileText, Mail, Calendar, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CustomerLedger from '../components/customers/CustomerLedger';
import CustomerFormModal from '../components/customers/CustomerFormModal';
import CustomerProfileModal from '../components/customers/CustomerProfileModal';
import InfiniteScrollObserver from '../components/common/InfiniteScrollObserver';

import { formatCurrency } from '../utils/currency';

const Customers = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const filterBalance = searchParams.get('filter') || 'All';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewProfileCustomer, setViewProfileCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

  const setFilterBalance = (value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value === 'All') next.delete('filter');
      else next.set('filter', value);
      return next;
    }, { replace: true });
  };
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const queryClient = useQueryClient();

  // Debounce search term and sync URL
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (searchTerm) next.set('search', searchTerm);
        else next.delete('search');
        return next;
      }, { replace: true });
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, setSearchParams]);

  // Sync URL back to local state (for back/forward navigation)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (urlSearch !== debouncedSearch) {
      setSearchTerm(urlSearch);
      setDebouncedSearch(urlSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['customers', debouncedSearch, filterBalance],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get(`/customers?page=${pageParam}&limit=15&search=${encodeURIComponent(debouncedSearch)}&filterBalance=${encodeURIComponent(filterBalance)}`);
      return res.data.data;
    },
    getNextPageParam: (lastPage) => lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined,
    staleTime: 1 * 60 * 1000, // Data is fresh for 1 min
    gcTime: 5 * 60 * 1000,   // Garbage collect (delete from memory) if unused for 5 mins
  });

  const viewTransactionId = searchParams.get('viewTransaction');
  const activeCustomer = viewTransactionId && data?.pages
    ? data.pages.flatMap(p => p.data || []).find(c => c._id === viewTransactionId)
    : null;

  // Handle body scroll for delete modal
  useEffect(() => {
    if (deleteModalOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [deleteModalOpen]);

  const mutation = useMutation({
    mutationFn: (newCustomer) => {
      if (isEditMode) {
        return api.put(`/customers/${editingCustomer._id}`, newCustomer);
      }
      return api.post('/customers', newCustomer);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingCustomer(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (customerId) => api.delete(`/customers/${customerId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      setDeleteModalOpen(false);
      setCustomerToDelete(null);
    }
  });

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = (customer) => {
    setCustomerToDelete(customer);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (customerToDelete) {
      deleteMutation.mutate(customerToDelete._id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingCustomer(null);
  };

  const onSubmit = (formData) => {
    mutation.mutate(formData);
  };

  const getInitials = (name) => {
    if (!name) return 'UN';
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (balance) => {
    if (balance > 0) return 'bg-red-50 text-red-700 border border-red-200';
    if (balance < 0) return 'bg-green-50 text-green-700 border border-green-200';
    return 'bg-gray-50 text-gray-700 border border-gray-200';
  };

  const customers = data?.pages?.flatMap(page => page.data || []) || [];

  // Get EXACT stats from the first page backend response
  const firstPage = data?.pages?.[0];
  const totalCount = firstPage?.totalCount || 0;
  const totalPendingBalance = firstPage?.totalPendingBalance || 0;
  const customersWithPendingCount = firstPage?.customersWithPendingCount || 0;
  const totalAdvanceBalance = firstPage?.totalAdvanceBalance || 0;
  const customersWithAdvanceCount = firstPage?.customersWithAdvanceCount || 0;
  const thisMonthCustomersCount = firstPage?.thisMonthCustomersCount || 0;

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12 pb-24 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">{t('Customers')}</h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed">
            {t('Manage your customers and their outstanding balances')}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="hidden lg:flex cursor-pointer bg-[#093C5D] hover:bg-[#082a42] text-white px-4 sm:px-5 md:px-6 py-2 md:py-2.5 rounded-lg items-center whitespace-nowrap shrink-0 font-semibold text-xs md:text-sm w-full sm:w-auto justify-center active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
          {t('Add Customer')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
        {/* Total Customers */}
        <div className="bg-white rounded-lg p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[7.5rem] sm:min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden cursor-default">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
              <Users className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Total Customers')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">{totalCount}</p>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate mt-0.5">{t('Active Accounts')}</p>
          </div>
        </div>

        {/* Total Pending */}
        <div className="bg-white rounded-lg p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[7.5rem] sm:min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border-l-4 border-l-red-700 border-t border-t-gray-200 border-r border-r-gray-200 border-b border-b-gray-200 hover:border-r-gray-300 hover:border-t-gray-300 hover:border-b-gray-300 transition-all duration-200 overflow-hidden cursor-default">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg bg-red-50 flex items-center justify-center text-red-700 border border-red-100">
              <IndianRupee className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Pending Udhar')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-red-700 truncate">
              {formatCurrency(totalPendingBalance)}
            </p>
            <p className="text-[10px] md:text-xs text-red-700 font-medium truncate mt-0.5">
              {customersWithPendingCount} {t('Customers')}
            </p>
          </div>
        </div>

        {/* Advance Balance */}
        <div className="bg-white rounded-lg p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[7.5rem] sm:min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border-l-4 border-l-green-700 border-t border-t-gray-200 border-r border-r-gray-200 border-b border-b-gray-200 hover:border-r-gray-300 hover:border-t-gray-300 hover:border-b-gray-300 transition-all duration-200 overflow-hidden cursor-default">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg bg-green-50 flex items-center justify-center text-green-700 border border-green-100">
              <Wallet className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Advance Given')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-green-700 truncate">
              {formatCurrency(Math.abs(totalAdvanceBalance))}
            </p>
            <p className="text-[10px] md:text-xs text-green-700 font-medium truncate mt-0.5">
              {customersWithAdvanceCount} {t('Customers')}
            </p>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white rounded-lg p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[7.5rem] sm:min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden cursor-default">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
              <History className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('This Month')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">
              {thisMonthCustomersCount}
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate mt-0.5">{t('New Customers')}</p>
          </div>
        </div>
      </div>

      {/* Search Bar + Filter */}
      {/* Filter Chips */}
      <div className="flex items-center flex-nowrap gap-2 sm:gap-3 overflow-x-auto pb-1 mb-2 sm:mb-3 w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {[
          { label: 'All Customers', value: 'All' },
          { label: 'Pending Udhar', value: 'Pending' },
          { label: 'Advance Given', value: 'Advance' },
          { label: 'Settled', value: 'Settled' },
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => setFilterBalance(filter.value)}
            className={`shrink-0 cursor-pointer py-1.5 sm:py-2 px-3 sm:px-4 rounded-full text-[10px] sm:text-sm font-medium transition-all duration-200 border active:scale-95 select-none flex items-center justify-center whitespace-nowrap !min-h-0 !min-w-0 !h-fit ${
              filterBalance === filter.value
                ? 'bg-[#093C5D] text-white border-[#093C5D] shadow-none'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-none'
            }`}
          >
            {t(filter.label)}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex flex-col w-full">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t("Search By Name Or Number")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full h-10 sm:h-12 pl-8 sm:pl-10 pr-3 sm:pr-4 bg-white border border-gray-300 rounded-lg text-sm sm:text-base font-medium text-gray-900 placeholder-gray-400 placeholder:font-medium focus:outline-none focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200 shadow-none"
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white md:border md:border-gray-100 md:rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12 border border-gray-100 rounded-lg md:border-none">
            <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-[#093C5D]" />
          </div>
        ) : isError ? (
          <div className="bg-white rounded-lg border border-red-200 md:border-none p-8 md:p-12 text-center text-red-700">
            <p className="font-medium text-sm md:text-base">{t('Failed to load customers.')}</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 md:border-none p-8 md:p-12 text-center text-gray-500">
            <Users className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
            <p className="font-medium text-sm md:text-base">{t('No customers found.')}</p>
          </div>
        ) : (
          <div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <table className="w-full min-w-[900px] whitespace-nowrap">
                <thead className="bg-gray-50/80 border-b border-gray-200">
                  <tr>
                    <th className="w-[35%] px-4 lg:px-6 py-3.5 lg:py-4 text-left text-[10px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Customer Details')}</th>
                    <th className="w-[20%] px-4 lg:px-6 py-3.5 lg:py-4 text-right text-[10px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Balance')}</th>
                    <th className="w-[20%] px-4 lg:px-6 py-3.5 lg:py-4 text-right text-[10px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Status')}</th>
                    <th className="w-[25%] px-4 lg:px-6 py-3.5 lg:py-4 text-right text-[10px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((customer, index) => (
                    <tr key={customer._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="w-[35%] px-4 lg:px-6 py-3.5 lg:py-4 align-middle">
                        <div className="flex items-center gap-3 lg:gap-4">
                          <div 
                            onClick={(e) => { e.stopPropagation(); setViewProfileCustomer(customer); }}
                            className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg p-[2px] border border-gray-200 bg-white flex-shrink-0 cursor-pointer hover:opacity-80 active:scale-95 transition-all"
                            title={t('View Profile')}
                          >
                            <div className="w-full h-full rounded-md flex items-center justify-center text-sm font-semibold bg-gray-50 text-[#093C5D]">
                              {getInitials(customer.name)}
                            </div>
                          </div>
                          <div className="min-w-0 flex flex-col justify-center">
                            <span className="text-sm lg:text-[15px] font-semibold text-[#093C5D] truncate block mb-0.5">{customer.name}</span>
                            <span className="text-[10px] lg:text-[11px] text-gray-500 font-medium flex items-center whitespace-nowrap">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(customer.createdAt).toLocaleDateString('en-US')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="w-[20%] px-4 lg:px-6 py-3.5 lg:py-4 align-middle text-right">
                        <span className={`text-xs lg:text-sm font-semibold block ${customer.balance > 0 ? 'text-red-700' : customer.balance < 0 ? 'text-green-700' : 'text-gray-900'}`}>
                          {formatCurrency(Math.abs(customer.balance))}
                        </span>
                      </td>
                      <td className="w-[20%] px-4 lg:px-6 py-3.5 lg:py-4 align-middle text-right">
                        <div className="flex items-center justify-end w-full h-full">
                          <span className={`inline-block px-2.5 py-1 rounded text-[10px] lg:text-xs font-semibold uppercase tracking-wide text-center ${customer.balance > 0 ? 'bg-red-50 text-red-700 border border-red-200' : customer.balance < 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-700 border border-gray-200'}`}>
                            {customer.balance > 0 ? t('Pending') : customer.balance < 0 ? t('Advance') : t('Settled')}
                          </span>
                        </div>
                      </td>
                      <td className="w-[25%] px-4 lg:px-6 py-3.5 lg:py-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-2 lg:gap-3">
                          <button
                            onClick={() => {
                              setSearchParams(prev => {
                                const next = new URLSearchParams(prev);
                                next.set('viewTransaction', customer._id);
                                return next;
                              });
                            }}
                            className="cursor-pointer text-blue-700 font-medium bg-blue-50 border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center justify-center transition-all text-xs active:scale-95 whitespace-nowrap"
                          >
                            <FileText className="w-3.5 h-3.5 mr-1.5" /> {t('Transactions')}
                          </button>
                          <button
                            onClick={() => handleEdit(customer)}
                            className="cursor-pointer text-gray-700 font-medium bg-gray-50 border border-gray-200 hover:bg-gray-100 px-3 py-1.5 rounded-lg flex items-center justify-center transition-all text-xs active:scale-95 whitespace-nowrap"
                            title={t('Edit')}
                          >
                            <Edit className="w-3.5 h-3.5 mr-1.5" /> {t('Edit')}
                          </button>
                          <button
                            onClick={() => handleDelete(customer)}
                            disabled={deleteMutation.isPending}
                            className="cursor-pointer text-red-700 font-medium bg-red-50 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-lg flex items-center justify-center transition-all text-xs active:scale-95 disabled:opacity-50 whitespace-nowrap"
                            title={t('Delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> {t('Delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden flex flex-col gap-2.5">
              {customers.map((customer, index) => (
                <div
                  key={customer._id}
                  className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 active:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        onClick={(e) => { e.stopPropagation(); setViewProfileCustomer(customer); }}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg p-[2px] border border-gray-200 bg-white flex-shrink-0 cursor-pointer hover:opacity-80 active:scale-95 transition-all"
                        title={t('View Profile')}
                      >
                        <div className="w-full h-full rounded-md flex items-center justify-center text-sm font-semibold bg-gray-50 text-[#093C5D]">
                          {getInitials(customer.name)}
                        </div>
                      </div>
                      <div className="min-w-0 flex flex-col justify-center">
                        <h3 className="text-sm sm:text-[15px] font-semibold text-[#093C5D] truncate leading-tight mb-0.5">{customer.name}</h3>
                        <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium flex items-center whitespace-nowrap">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(customer.createdAt).toLocaleDateString('en-US')}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 flex flex-col items-end gap-0.5">
                      <p className={`text-[13px] sm:text-[14px] font-semibold leading-tight ${customer.balance > 0 ? 'text-red-700' : customer.balance < 0 ? 'text-green-700' : 'text-gray-900'}`}>
                        {formatCurrency(Math.abs(customer.balance))}
                      </p>
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase sm:text-[10px] font-semibold ${customer.balance > 0 ? 'bg-red-50 text-red-700 border border-red-200' : customer.balance < 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-700 border border-gray-200'}`}>
                        {customer.balance > 0 ? t('Pending') : customer.balance < 0 ? t('Advance') : t('Settled')}
                      </span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100 my-2.5 sm:my-3"></div>

                  {/* Actions */}
                  <div className="flex items-center justify-end flex-nowrap gap-1.5 sm:gap-2 w-full mt-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <a
                      href={`tel:${customer.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 cursor-pointer text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-2 sm:px-3 py-1 rounded-md flex items-center justify-center transition-all text-[10px] sm:text-xs active:scale-95 whitespace-nowrap !min-h-0 !min-w-0 !h-fit"
                    >
                      <Phone className="w-3.5 h-3.5 mr-1 sm:mr-1.5 shrink-0" /> {t('Call')}
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchParams(prev => {
                          const next = new URLSearchParams(prev);
                          next.set('viewTransaction', customer._id);
                          return next;
                        });
                      }}
                      className="shrink-0 cursor-pointer text-blue-700 font-medium bg-blue-50 border border-blue-200 hover:bg-blue-100 px-2 sm:px-3 py-1 rounded-md flex items-center justify-center transition-all text-[10px] sm:text-xs active:scale-95 whitespace-nowrap !min-h-0 !min-w-0 !h-fit"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1 sm:mr-1.5 shrink-0" /> {t('Transactions')}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(customer);
                      }}
                      className="shrink-0 cursor-pointer text-gray-700 font-medium bg-gray-50 border border-gray-200 hover:bg-gray-100 px-2 sm:px-3 py-1 rounded-md flex items-center justify-center transition-all text-[10px] sm:text-xs active:scale-95 whitespace-nowrap !min-h-0 !min-w-0 !h-fit"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1 sm:mr-1.5 shrink-0" /> {t('Edit')}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(customer);
                      }}
                      disabled={deleteMutation.isPending}
                      className="shrink-0 cursor-pointer text-red-700 font-medium bg-red-50 border border-red-200 hover:bg-red-100 px-2 sm:px-3 py-1 rounded-md flex items-center justify-center transition-all text-[10px] sm:text-xs active:scale-95 disabled:opacity-50 whitespace-nowrap !min-h-0 !min-w-0 !h-fit"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1 sm:mr-1.5 shrink-0" /> {t('Delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Loader + Intersection trigger */}
            {isFetchingNextPage && (
              <div className="flex justify-center items-center py-5">
                <div className="bg-white border border-gray-200 rounded-lg px-5 py-2.5 flex items-center gap-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-[#093C5D]" />
                  <span className="text-xs font-semibold text-gray-600 tracking-wide">{t('Loading more...')}</span>
                </div>
              </div>
            )}
            <InfiniteScrollObserver
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
            />
          </div>
        )}
      </div>

      <CustomerFormModal
        isOpen={isModalOpen}
        isEditMode={isEditMode}
        editingCustomer={editingCustomer}
        onClose={handleCloseModal}
        onSubmit={onSubmit}
        isPending={mutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && customerToDelete && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay"
            onClick={() => {
              setDeleteModalOpen(false);
              setCustomerToDelete(null);
            }}
          />

          {/* Modal Content */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-scale-in pointer-events-auto border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 sm:p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 mx-auto flex items-center justify-center mb-4 border border-red-100">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{t('Delete Customer')}</h3>
                <p className="text-gray-500 text-sm mb-6 font-medium">
                  {t('Are you sure you want to delete')} <span className="font-semibold text-gray-800">{customerToDelete.name}</span>? {t('This action cannot be undone.')}
                </p>

                <div className="flex gap-2 sm:gap-3 justify-center">
                  <button
                    onClick={() => {
                      setDeleteModalOpen(false);
                      setCustomerToDelete(null);
                    }}
                    className="cursor-pointer flex-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-xs sm:text-[13px] transition-colors active:scale-95"
                  >
                    {t('Cancel')}
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={deleteMutation.isPending}
                    className="cursor-pointer flex-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-xs sm:text-[13px] transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t('Yes, Delete')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeCustomer && (
        <CustomerLedger
          customer={activeCustomer}
          onClose={() => {
            setSearchParams(prev => {
              const next = new URLSearchParams(prev);
              next.delete('viewTransaction');
              return next;
            });
          }}
        />
      )}

      {/* Mobile & Tablet Extended FAB (No Shadow) */}
      {!activeCustomer && !isModalOpen && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 bg-[#093C5D] hover:bg-[#082a42] text-white px-5 py-3.5 rounded-lg flex items-center transition-all z-[40] active:scale-95 group font-semibold text-sm"
        >
          <Plus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
          {t('Add Customer')}
        </button>
      )}

      {/* Customer Profile Modal */}
      <CustomerProfileModal
        isOpen={!!viewProfileCustomer}
        onClose={() => setViewProfileCustomer(null)}
        customer={viewProfileCustomer}
      />
    </div>
  );
};

export default Customers;
