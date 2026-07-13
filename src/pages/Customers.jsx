import { useState, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Plus, Search, Phone, IndianRupee, History, Loader2, Edit, Trash2, Users, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CustomerLedger from '../components/customers/CustomerLedger';
import CustomerFormModal from '../components/customers/CustomerFormModal';
import InfiniteScrollObserver from '../components/common/InfiniteScrollObserver';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

const Customers = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterBalance, setFilterBalance] = useState('All');
  const queryClient = useQueryClient();

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

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
    }
  });

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = (customer) => {
    if (window.confirm(t(`Are you sure you want to delete ${customer.name}? This action cannot be undone.`))) {
      deleteMutation.mutate(customer._id);
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

  const getAvatarColor = (index) => {
    const colors = [
      'bg-[#F5F5F5] text-[#093C5D]',
      'bg-purple-100 text-purple-600',
      'bg-blue-100 text-[#093C5D]',
      'bg-green-100 text-green-600',
      'bg-yellow-100 text-yellow-600',
      'bg-pink-100 text-pink-600',
    ];
    return colors[index % colors.length];
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
    <div className="w-full min-w-0 space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">{t('Customers')}</h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5">{t('Manage your customers and their outstanding balances')}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="cursor-pointer bg-[#093C5D] hover:bg-[#082a42] text-white px-4 sm:px-5 md:px-6 py-2 md:py-2.5 rounded-lg flex items-center whitespace-nowrap shrink-0 font-semibold text-xs md:text-sm w-full sm:w-auto justify-center active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
          {t('Add Customer')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
        {/* Total Customers */}
        <div className="bg-white rounded-xl p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
              <Users className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Total Customers')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">{totalCount}</p>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate mt-0.5">{t('Active accounts')}</p>
          </div>
        </div>

        {/* Total Pending */}
        <div className="bg-white rounded-xl p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border-l-4 border-l-red-500 border-t border-t-gray-200 border-r border-r-gray-200 border-b border-b-gray-200 hover:border-r-gray-300 hover:border-t-gray-300 hover:border-b-gray-300 transition-all duration-200 overflow-hidden">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
              <IndianRupee className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Total Pending')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">
              {formatCurrency(totalPendingBalance)}
            </p>
            <p className="text-[10px] md:text-xs text-red-500 font-medium truncate mt-0.5">
              {customersWithPendingCount} {t('with pending balance')}
            </p>
          </div>
        </div>

        {/* Total Advance */}
        <div className="bg-white rounded-xl p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border-l-4 border-l-green-500 border-t border-t-gray-200 border-r border-r-gray-200 border-b border-b-gray-200 hover:border-r-gray-300 hover:border-t-gray-300 hover:border-b-gray-300 transition-all duration-200 overflow-hidden">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
              <Wallet className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Total Advance')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">
              {formatCurrency(totalAdvanceBalance)}
            </p>
            <p className="text-[10px] md:text-xs text-green-600 font-medium truncate mt-0.5">
              {customersWithAdvanceCount} {t('with advance balance')}
            </p>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white rounded-xl p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
              <History className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('This Month')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">
              {thisMonthCustomersCount}
            </p>
            <p className="text-[10px] md:text-xs text-green-600 font-medium truncate mt-0.5">{t('New customers')}</p>
          </div>
        </div>
      </div>

      {/* Search Bar + Filter */}
      <div className="flex items-center gap-2 sm:gap-3 w-full">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t("Search by invoice number or customer...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-12 pr-4 py-2.5 md:py-3 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] text-sm md:text-base font-medium transition-colors duration-200"
          />
        </div>
        
        {/* Filter Dropdown */}
        <select
          value={filterBalance}
          onChange={(e) => setFilterBalance(e.target.value)}
          className="cursor-pointer w-auto bg-white border border-gray-200 rounded-lg px-2 sm:px-3 py-2.5 md:py-3 text-xs md:text-sm font-semibold text-gray-700 focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] outline-none transition-colors duration-200 flex-shrink-0 bg-no-repeat bg-[right_8px_center] pr-7 sm:pr-8"
        >
          <option value="All">{t('All Customers')}</option>
          <option value="Pending">{t('Pending Udhar')}</option>
          <option value="Advance">{t('Advance Given')}</option>
          <option value="Settled">{t('Settled')}</option>
        </select>
      </div>

      {/* Customer Cards */}
      <div className="space-y-3 md:space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#093C5D]" />
          </div>
        ) : isError ? (
          <div className="bg-white rounded-xl border border-red-200 p-8 md:p-10 lg:p-12 text-center">
            <p className="text-red-500 text-sm md:text-base font-medium">{t('Failed to load customers.')}</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 md:p-10 lg:p-12 text-center">
            <p className="text-gray-500 text-sm md:text-base font-medium">{t('No customers found.')}</p>
          </div>
        ) : (
          <>
            {customers.map((customer, index) => (
              <div
                key={customer._id}
                className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 p-4 md:p-5 animate-fade-in overflow-hidden transition-all duration-200"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Desktop Layout: Single row */}
                <div className="hidden md:flex items-center gap-5">
                  {/* Avatar */}
                  <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-lg border border-gray-200 ${getAvatarColor(index)} flex items-center justify-center font-semibold text-base lg:text-lg flex-shrink-0`}>
                    {getInitials(customer.name)}
                  </div>
  
                  {/* Name + Phone */}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900 truncate">{customer.name}</h3>
                    <div className="flex items-center text-gray-500 text-sm font-medium mt-0.5">
                      <Phone className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                      <span>{customer.phone}</span>
                    </div>
                  </div>
  
                  {/* Pending Balance */}
                  <div className="text-right flex-shrink-0 min-w-[120px] lg:min-w-[140px]">
                    <p className="text-[10px] lg:text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">
                      {t('PENDING BALANCE')}
                    </p>
                    <p className={`text-lg lg:text-xl font-semibold ${customer.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(customer.balance)}
                    </p>
                  </div>
  
                  {/* Separator */}
                  <div className="w-px h-10 bg-gray-200 flex-shrink-0"></div>
  
                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(customer)}
                      className="cursor-pointer p-2.5 hover:bg-[#093C5D]/5 rounded-xl transition-colors active:scale-90 group"
                      title={t('Edit Customer')}
                    >
                      <Edit className="w-[18px] h-[18px] text-[#093C5D] group-hover:text-[#082a42]" />
                    </button>
  
                    <button
                      onClick={() => handleDelete(customer)}
                      className="cursor-pointer p-2.5 hover:bg-red-50 rounded-xl transition-colors active:scale-90 group"
                      title={t('Delete Customer')}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-[18px] h-[18px] text-red-600 group-hover:text-red-700" />
                    </button>
  
                    <button
                      onClick={() => setSelectedCustomer(customer)}
                      className="cursor-pointer ml-1 text-[#093C5D] border-2 border-[#093C5D] hover:bg-[#093C5D] hover:text-white px-4 py-2 rounded-full font-semibold active:scale-95 transition-all whitespace-nowrap text-sm"
                    >
                      {t('Ledger')}
                    </button>
                  </div>
                </div>
  
                {/* Mobile Layout: Compact stacked */}
                <div className="md:hidden">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full ${getAvatarColor(index)} flex items-center justify-center font-semibold text-sm sm:text-base flex-shrink-0 mt-0.5`}>
                      {getInitials(customer.name)}
                    </div>
  
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {/* Name + Phone */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{customer.name}</h3>
                        <div className="flex items-center text-gray-400 text-xs font-medium">
                          <Phone className="w-3 h-3 mr-0.5 flex-shrink-0" />
                          <span>{customer.phone}</span>
                        </div>
                      </div>
  
                      {/* Balance + Actions Row */}
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <p className="text-[9px] sm:text-[10px] text-gray-500 font-semibold uppercase tracking-wider leading-none mb-0.5">
                            {t('PENDING BALANCE')}
                          </p>
                          <p className={`text-base sm:text-lg font-semibold ${customer.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(customer.balance)}
                          </p>
                        </div>
  
                        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleEdit(customer)}
                            className="cursor-pointer p-1.5 sm:p-2 hover:bg-[#093C5D]/5 rounded-lg transition-colors active:scale-90 group"
                            title={t('Edit Customer')}
                          >
                            <Edit className="w-4 h-4 text-[#093C5D]" />
                          </button>
  
                          <button
                            onClick={() => handleDelete(customer)}
                            className="cursor-pointer p-1.5 sm:p-2 hover:bg-red-50 rounded-lg transition-colors active:scale-90 group"
                            title={t('Delete Customer')}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
  
                          <button
                            onClick={() => setSelectedCustomer(customer)}
                            className="cursor-pointer ml-0.5 text-[#093C5D] border-2 border-[#093C5D] hover:bg-[#093C5D] hover:text-white px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full font-semibold active:scale-95 transition-all whitespace-nowrap text-[11px] sm:text-xs"
                          >
                            {t('Ledger')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <InfiniteScrollObserver 
              hasNextPage={hasNextPage} 
              isFetchingNextPage={isFetchingNextPage} 
              fetchNextPage={fetchNextPage} 
            />
          </>
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

      {selectedCustomer && (
        <CustomerLedger customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
      )}
    </div>
  );
};

export default Customers;
