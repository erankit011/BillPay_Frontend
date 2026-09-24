import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Plus, Bell, Clock, User, X, MessageSquare, Mail, Edit, Trash2, TrendingUp, Lightbulb, Activity, Send, Loader2, AlertCircle, Eye } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import InfiniteScrollObserver from '../components/common/InfiniteScrollObserver';
import SearchableSelect from '../components/common/SearchableSelect';
import SwirlingLoader from '../components/common/SwirlingLoader';
import { formatDate } from '../utils/dateUtils';

const Reminders = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const filterStatus = searchParams.get('filter') || 'All';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [searchName, setSearchName] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [reminderToDelete, setReminderToDelete] = useState(null);
  const [reminderToSend, setReminderToSend] = useState(null);
  const [reminderToView, setReminderToView] = useState(null);
  const queryClient = useQueryClient();

  const setFilterStatus = (value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value === 'All') next.delete('filter');
      else next.set('filter', value);
      return next;
    }, { replace: true });
  };

  // Debounce search and sync URL
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchName);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (searchName) next.set('search', searchName);
        else next.delete('search');
        return next;
      }, { replace: true });
    }, 500);
    return () => clearTimeout(handler);
  }, [searchName, setSearchParams]);

  // Sync URL back to local state (for back/forward navigation)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (urlSearch !== debouncedSearch) {
      setSearchName(urlSearch);
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
    queryKey: ['reminders', debouncedSearch, filterStatus],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get(`/reminders?page=${pageParam}&limit=15&search=${encodeURIComponent(debouncedSearch)}&filterStatus=${encodeURIComponent(filterStatus)}`);
      return res.data.data;
    },
    getNextPageParam: (lastPage) => lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined,
    staleTime: 1 * 60 * 1000, // Data is fresh for 1 min
    gcTime: 5 * 60 * 1000,   // Garbage collect (delete from memory) if unused for 5 mins
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: async () => {
      const res = await api.get('/customers?limit=1000');
      return res.data.data?.data || res.data.data || [];
    }
  });

  const reminders = data?.pages?.flatMap(page => page.data || []) || [];

  const { register, handleSubmit, reset, watch, control, formState: { errors } } = useForm();
  const selectedCustomerId = watch('customerId');
  const selectedType = watch('type');

  const mutation = useMutation({
    mutationFn: (reminderData) => {
      if (isEditMode) {
        return api.put(`/reminders/${editingReminder._id}`, reminderData);
      }
      return api.post('/reminders', reminderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reminders']);
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingReminder(null);
      reset();
    },
    onError: (error) => {
      console.error('Reminder creation failed:', error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (reminderId) => api.delete(`/reminders/${reminderId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['reminders']);
    }
  });

  const sendMutation = useMutation({
    mutationFn: (reminderId) => api.post(`/reminders/${reminderId}/send`),
    onSuccess: () => {
      queryClient.invalidateQueries(['reminders']);
      alert(t('Reminder sent successfully!'));
    },
    onError: (err) => {
      alert(t('Failed to send reminder: ') + (err.response?.data?.message || err.message));
    }
  });

  const handleSendNow = (reminder) => {
    setReminderToSend(reminder);
  };

  const confirmSend = () => {
    if (reminderToSend) {
      sendMutation.mutate(reminderToSend._id);
      setReminderToSend(null);
    }
  };

  const handleEdit = (reminder) => {
    setEditingReminder(reminder);
    setIsEditMode(true);
    reset({
      customerId: reminder.customerId?._id || '',
      message: reminder.message || '',
      scheduledDate: reminder.scheduledDate ? new Date(reminder.scheduledDate).toISOString().split('T')[0] : '',
      type: reminder.type || 'WHATSAPP'
    });
    setIsModalOpen(true);
  };

  const handleDelete = (reminder) => {
    setReminderToDelete(reminder);
  };

  const confirmDelete = () => {
    if (reminderToDelete) {
      deleteMutation.mutate(reminderToDelete._id);
      setReminderToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingReminder(null);
    reset();
  };

  const isAnyModalOpen = isModalOpen || !!reminderToDelete || !!reminderToSend || !!reminderToView;

  useEffect(() => {
    if (isAnyModalOpen) {
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
  }, [isAnyModalOpen]);

  const onSubmit = (data) => {
    if (data.type === 'EMAIL') {
      const selectedCustomer = customers.find(c => c._id === data.customerId);
      if (!selectedCustomer?.email) {
        alert(t('Customer email not provided! Please add customer email first or use WhatsApp reminder.'));
        return;
      }
    }
    mutation.mutate(data);
  };

  const firstPage = data?.pages?.[0];
  const stats = firstPage?.stats || {
    pendingCount: 0, sentCount: 0, totalPending: 0, recovered: 0, totalUdhar: 0, customersWithDuesCount: 0, topDefaulter: null
  };

  const recoveryRate = stats.totalUdhar > 0 ? Math.round((stats.recovered / stats.totalUdhar) * 100) : 0;

  let smartTip = t('Sending reminders on Saturday mornings between 9-11 AM increases payment recovery by 22% for retail customers.');
  if (stats.customersWithDuesCount > 0 && stats.topDefaulter) {
    smartTip = t(`You have ${stats.customersWithDuesCount} customer(s) with pending dues. Consider sending a reminder to ${stats.topDefaulter.name} who owes ₹${stats.topDefaulter.balance.toLocaleString()} to improve your cash flow.`);
  } else if (stats.totalUdhar > 0 && stats.totalPending === 0) {
    smartTip = t('Great job! You have zero pending payments. Your cash flow is healthy and well maintained.');
  }

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12 pb-24 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">{t('Reminders')}</h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed">
            {t('Automate your payment recovery via WhatsApp and Email')}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="hidden lg:flex cursor-pointer bg-[#093C5D] hover:bg-[#082a42] text-white px-4 sm:px-5 md:px-6 py-2 md:py-2.5 rounded-lg items-center whitespace-nowrap shrink-0 font-semibold text-xs md:text-sm w-full sm:w-auto justify-center active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
          {t('Set Reminder')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
        {/* Total Reminders (Pending) */}
        <div className="bg-white rounded-lg p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[7.5rem] sm:min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden cursor-default">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
              <Clock className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Pending Reminders')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">{stats.pendingCount}</p>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate mt-0.5">{t('Scheduled')}</p>
          </div>
        </div>

        {/* Reminders Sent */}
        <div className="bg-white rounded-lg p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[7.5rem] sm:min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden cursor-default">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
              <Send className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Reminders Sent')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">{stats.sentCount}</p>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate mt-0.5">{t('Delivered Successfully')}</p>
          </div>
        </div>

        {/* Total Pending Udhar */}
        <div className="bg-white rounded-lg p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[7.5rem] sm:min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border-l-4 border-l-red-700 border-t border-t-gray-200 border-r border-r-gray-200 border-b border-b-gray-200 hover:border-r-gray-300 hover:border-t-gray-300 hover:border-b-gray-300 transition-all duration-200 overflow-hidden cursor-default">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg bg-red-50 flex items-center justify-center text-red-700 border border-red-100">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Pending Udhar')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-red-700 truncate">
              ₹{stats.totalPending.toLocaleString()}
            </p>
            <p className="text-[10px] md:text-xs text-red-700 font-medium truncate mt-0.5">
              {stats.customersWithDuesCount} {t('Customers')}
            </p>
          </div>
        </div>

        {/* Amount Recovered */}
        <div className="bg-white rounded-lg p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[7.5rem] sm:min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border-l-4 border-l-green-700 border-t border-t-gray-200 border-r border-r-gray-200 border-b border-b-gray-200 hover:border-r-gray-300 hover:border-t-gray-300 hover:border-b-gray-300 transition-all duration-200 overflow-hidden cursor-default">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg bg-green-50 flex items-center justify-center text-green-700 border border-green-100">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Amount Recovered')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-green-700 truncate">
              ₹{stats.recovered.toLocaleString()}
            </p>
            <p className="text-[10px] md:text-xs text-green-700 font-medium truncate mt-0.5">
              {recoveryRate}% {t('Recovery Rate')}
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder={t('Search customer...')}
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="block w-full h-10 sm:h-12 pl-9 sm:pl-11 pr-3 sm:pr-4 bg-white border border-gray-200 rounded-lg text-[13px] sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#093C5D]/20 focus:border-[#093C5D] transition-all shadow-none"
          />
        </div>

        {/* Filter Dropdown */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="block h-10 sm:h-12 w-full sm:w-auto sm:min-w-[150px] px-3 sm:px-4 bg-white border border-gray-200 rounded-lg text-[13px] sm:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#093C5D]/20 focus:border-[#093C5D] transition-all cursor-pointer shadow-none appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_8px_center] bg-[length:16px_16px]"
        >
          <option value="All">{t('All')}</option>
          <option value="Pending">{t('Pending')}</option>
          <option value="Sent">{t('Sent')}</option>
        </select>
      </div>

      {/* Main Content Area */}
      <div className="bg-white md:border md:border-gray-100 md:rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12 border border-gray-100 rounded-lg md:border-none">
            <SwirlingLoader className="w-10 h-10 md:w-12 md:h-12 text-[#093C5D]" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] py-12 border border-gray-100 rounded-lg md:border-none">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <p className="text-sm font-medium text-gray-900 mb-1">{t('Failed to load data')}</p>
            <p className="text-xs text-gray-500">{t('Please try refreshing the page')}</p>
          </div>
        ) : reminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] py-12 border border-gray-100 rounded-lg md:border-none px-4 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">{t('No Reminders Found')}</h3>
            <p className="text-sm text-gray-500 max-w-sm mb-6">
              {searchName ? t('No reminders match your search criteria.') : t('You haven\'t set up any reminders yet.')}
            </p>
            {!searchName && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="cursor-pointer bg-[#093C5D] hover:bg-[#082a42] text-white px-5 py-2.5 rounded-lg flex items-center font-medium text-sm active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('Set First Reminder')}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] min-h-[400px]">
              <table className="w-full min-w-[950px] whitespace-nowrap text-left">
                <thead className="bg-gray-50/80 border-b border-gray-200">
                  <tr>
                    <th className="px-4 lg:px-6 py-3.5 lg:py-4 text-left text-[10px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Customer')}</th>
                    <th className="px-4 lg:px-6 py-3.5 lg:py-4 text-left text-[10px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Schedule')}</th>
                    <th className="px-4 lg:px-6 py-3.5 lg:py-4 text-right text-[10px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Due')}</th>
                    <th className="px-4 lg:px-6 py-3.5 lg:py-4 text-right text-[10px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Status')}</th>
                    <th className="px-4 lg:px-6 py-3.5 lg:py-4 text-right text-[10px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {reminders.map((reminder) => (
                    <tr key={reminder._id} className="bg-white border-b border-gray-100 last:border-b-0 hover:bg-[#F5F5F5]/60 transition-colors duration-150 relative">

                      {/* Customer */}
                      <td className="w-[30%] px-4 lg:px-6 py-3.5 lg:py-4 align-middle">
                        <div className="flex items-center gap-3 lg:gap-4">
                          <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center text-[10px] lg:text-xs font-semibold flex-shrink-0 border border-gray-200 bg-gray-50 text-[#093C5D]">
                            {reminder.customerId?.name ? reminder.customerId.name.substring(0, 2).toUpperCase() : 'UN'}
                          </div>
                          <div>
                            <span className="text-xs lg:text-sm font-semibold text-gray-900 truncate block">
                              {reminder.customerId?.name || t('Deleted Customer')}
                            </span>
                            <div className="text-[10px] lg:text-xs text-gray-500 font-medium mt-0.5 flex items-center">
                              {reminder.customerId?.phone}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Schedule */}
                      <td className="w-[20%] px-4 lg:px-6 py-3.5 lg:py-4 align-middle">
                        <span className="text-xs lg:text-sm text-gray-900 font-medium block whitespace-nowrap">
                          {formatDate(reminder.scheduledDate)}
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] lg:text-xs text-gray-500 font-medium mt-0.5 whitespace-nowrap uppercase tracking-wider">
                          {reminder.type === 'WHATSAPP' ? (
                            <MessageSquare className="w-3 h-3 text-green-600 shrink-0" />
                          ) : (
                            <Mail className="w-3 h-3 text-[#093C5D] shrink-0" />
                          )}
                          {reminder.type}
                        </span>
                      </td>

                      {/* Due */}
                      <td className="w-[15%] px-4 lg:px-6 py-3.5 lg:py-4 align-middle text-right">
                        <span className={`text-xs lg:text-sm font-semibold block ${reminder.customerId?.balance > 0 ? 'text-red-700' : 'text-gray-900'}`}>
                          {reminder.customerId?.balance > 0 ? `₹${reminder.customerId.balance.toLocaleString('en-IN')}` : '-'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="w-[10%] px-4 lg:px-6 py-3.5 lg:py-4 align-middle text-right">
                        <div className="flex items-center justify-end w-full h-full">
                          <span className={`inline-block px-2.5 py-1 rounded text-[10px] lg:text-xs font-semibold uppercase tracking-wide text-center ${reminder.status === 'PENDING' ? 'bg-red-50 text-red-700 border border-red-200' :
                              reminder.status === 'SENT' ? 'bg-green-50 text-green-700 border border-green-200' :
                                'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {t(reminder.status)}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="w-[30%] px-4 lg:px-6 py-3.5 lg:py-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-2 lg:gap-2.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setReminderToView(reminder)}
                            className="cursor-pointer text-blue-700 font-medium bg-blue-50 border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center justify-center transition-all text-xs active:scale-95 whitespace-nowrap"
                            title={t('View Message')}
                          >
                            <Eye className="w-3.5 h-3.5 lg:mr-1.5 shrink-0" />
                            <span className="hidden lg:inline">{t('Message')}</span>
                          </button>
                          {reminder.status !== 'SENT' && (
                            <button
                              onClick={() => handleSendNow(reminder)}
                              disabled={sendMutation.isPending}
                              className="cursor-pointer text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-lg flex items-center justify-center transition-all text-xs active:scale-95 whitespace-nowrap"
                              title={t('Send Now')}
                            >
                              <Send className="w-3.5 h-3.5 lg:mr-1.5 shrink-0" />
                              <span className="hidden lg:inline">{t('Send')}</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(reminder)}
                            className="cursor-pointer text-gray-700 font-medium bg-gray-50 border border-gray-200 hover:bg-gray-100 px-3 py-1.5 rounded-lg flex items-center justify-center transition-all text-xs active:scale-95 whitespace-nowrap"
                            title={t('Edit')}
                          >
                            <Edit className="w-3.5 h-3.5 lg:mr-1.5 shrink-0" />
                            <span className="hidden lg:inline">{t('Edit')}</span>
                          </button>
                          <button
                            onClick={() => handleDelete(reminder)}
                            disabled={deleteMutation.isPending}
                            className="cursor-pointer text-red-700 font-medium bg-red-50 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-lg flex items-center justify-center transition-all text-xs active:scale-95 disabled:opacity-50 whitespace-nowrap"
                            title={t('Delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5 lg:mr-1.5 shrink-0" />
                            <span className="hidden lg:inline">{t('Delete')}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden flex flex-col gap-2.5">
              {reminders.map((reminder) => (
                <div
                  key={reminder._id}
                  className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 active:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-sm font-semibold flex-shrink-0 bg-gray-50 text-[#093C5D] border border-gray-200">
                        {reminder.customerId?.name ? reminder.customerId.name.substring(0, 2).toUpperCase() : 'UN'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-[13px] sm:text-sm font-semibold text-gray-900 truncate leading-tight">
                            {reminder.customerId?.name || t('Deleted Customer')}
                          </h3>
                        </div>
                        <div className="flex items-center text-gray-500 text-[11px] sm:text-xs font-medium mt-1">
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 flex-shrink-0" />
                          <span className="leading-none pt-[1.5px]">{formatDate(reminder.scheduledDate)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 flex flex-col items-end gap-0.5">
                      <p className={`text-[13px] sm:text-[14px] font-semibold leading-tight ${reminder.customerId?.balance > 0 ? 'text-red-700' : 'text-gray-900'}`}>
                        {reminder.customerId?.balance > 0 ? `₹${reminder.customerId.balance.toLocaleString('en-IN')}` : ''}
                      </p>
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase sm:text-[10px] font-semibold ${reminder.status === 'PENDING'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : reminder.status === 'SENT'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {t(reminder.status)}
                      </span>
                    </div>
                  </div>

                  {/* Actions (Aligned like Bills.jsx) */}
                  <div className="flex justify-end gap-2 w-full mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); setReminderToView(reminder); }}
                      className="cursor-pointer text-blue-700 font-medium bg-blue-50 border border-blue-200 hover:bg-blue-100 px-2.5 py-1 rounded-md flex items-center justify-center transition-all text-xs active:scale-95 whitespace-nowrap !min-h-0 !min-w-0 !h-fit"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5 shrink-0" /> {t('Message')}
                    </button>
                    {reminder.status !== 'SENT' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSendNow(reminder); }}
                        className="cursor-pointer text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-2.5 py-1 rounded-md flex items-center justify-center transition-all text-xs active:scale-95 whitespace-nowrap !min-h-0 !min-w-0 !h-fit"
                      >
                        <Send className="w-3.5 h-3.5 mr-1.5 shrink-0" /> {t('Send')}
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(reminder); }}
                      className="cursor-pointer text-gray-700 font-medium bg-gray-50 border border-gray-200 hover:bg-gray-100 px-2.5 py-1 rounded-md flex items-center justify-center transition-all text-xs active:scale-95 whitespace-nowrap !min-h-0 !min-w-0 !h-fit"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1.5 shrink-0" /> {t('Edit')}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(reminder); }}
                      className="cursor-pointer text-red-700 font-medium bg-red-50 border border-red-200 hover:bg-red-100 px-2.5 py-1 rounded-md flex items-center justify-center transition-all text-xs active:scale-95 whitespace-nowrap !min-h-0 !min-w-0 !h-fit"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5 shrink-0" /> {t('Delete')}
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
          {hasNextPage && (
              <div className="py-2">
                <InfiniteScrollObserver
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  fetchNextPage={fetchNextPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile & Tablet Extended FAB (No Shadow) */}
      {!isAnyModalOpen && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 bg-[#093C5D] hover:bg-[#082a42] text-white px-5 py-3.5 rounded-lg flex items-center transition-all z-[40] active:scale-95 group font-semibold text-sm"
        >
          <Plus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
          {t('Set Reminder')}
        </button>
      )}

      {/* Reminder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay" onClick={handleCloseModal} />

          {/* Mobile: bottom sheet | sm+: centered modal */}
          <div className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-center sm:justify-center sm:px-4 sm:py-8 z-50 pointer-events-none">
            <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-gray-200 animate-modal-content overflow-hidden pointer-events-auto shadow-2xl sm:shadow-xl">

              {/* Drag handle — mobile only */}
              <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
              </div>

              <div className="flex items-center justify-between px-5 md:px-6 py-4 md:py-5 border-b border-gray-100 flex-shrink-0">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                  {isEditMode ? t('Edit Reminder') : t('Set Custom Reminder')}
                </h3>
                <button onClick={handleCloseModal} className="cursor-pointer text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px] border border-gray-200">
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              <div className="p-5 md:p-6 overflow-y-auto">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Customer */}
                  <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-0.5">
                      {t('Customer')} <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="customerId"
                      control={control}
                      rules={{ required: 'Customer is required' }}
                      render={({ field }) => (
                        <SearchableSelect
                          options={customers.map(c => ({ value: c._id, label: `${c.name} - ${c.phone}` }))}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={`-- ${t('Select Customer')} --`}
                          searchPlaceholder={t('Search by name or phone...')}
                          error={errors.customerId ? true : false}
                        />
                      )}
                    />
                    {errors.customerId && (
                      <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="leading-none pt-[1px]">{t(errors.customerId.message)}</span>
                      </p>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-0.5">
                      {t('Message')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      {...register('message', { required: 'Message is required' })}
                      className={`block w-full rounded-lg border px-3 py-2.5 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none resize-none ${errors.message ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#093C5D] focus:border-[#093C5D]'}`}
                      rows="4"
                      placeholder={t("Dear customer, your payment of ₹...")}
                    ></textarea>
                    {errors.message && (
                      <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="leading-none pt-[1px]">{t(errors.message.message)}</span>
                      </p>
                    )}
                  </div>

                  {/* Scheduled Date */}
                  <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-0.5">
                      {t('Scheduled Date')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      {...register('scheduledDate', { required: 'Scheduled date is required' })}
                      className={`block w-full rounded-lg border px-3 py-2.5 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none ${errors.scheduledDate ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#093C5D] focus:border-[#093C5D]'}`}
                    />
                    {errors.scheduledDate && (
                      <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="leading-none pt-[1px]">{t(errors.scheduledDate.message)}</span>
                      </p>
                    )}
                  </div>

                  {/* Channel */}
                  <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-0.5">
                      {t('Channel')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('type')}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                    >
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="EMAIL">Email</option>
                    </select>

                    {/* Warning message if EMAIL selected but customer has no email */}
                    {selectedType === 'EMAIL' && selectedCustomerId && (() => {
                      const customer = customers.find(c => c._id === selectedCustomerId);
                      if (!customer?.email) {
                        return (
                          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                            <Mail className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-[11px] sm:text-xs text-amber-800 font-medium">
                              ⚠️ {t('This customer does not have an email address. Please add their email first or use WhatsApp reminder.')}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={mutation.isPending}
                      className="cursor-pointer w-full bg-[#093C5D] hover:bg-[#082a42] text-white rounded-lg px-5 py-2.5 font-semibold text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all shadow-none"
                    >
                      {mutation.isPending ? t('Saving...') : isEditMode ? t('Update Reminder') : t('Save Reminder')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {reminderToDelete && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay"
            onClick={() => setReminderToDelete(null)}
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
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{t('Delete Reminder')}</h3>
                <p className="text-gray-500 text-sm mb-6 font-medium">
                  {t('Are you sure you want to delete this reminder for')} <span className="font-semibold text-gray-800">{reminderToDelete.customerId?.name || t('Unknown Customer')}</span>? {t('This action cannot be undone.')}
                </p>

                <div className="flex gap-2 sm:gap-3 justify-center">
                  <button
                    onClick={() => setReminderToDelete(null)}
                    className="cursor-pointer flex-1 px-4 py-2 sm:px-5 sm:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm transition-colors active:scale-95"
                  >
                    {t('Cancel')}
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={deleteMutation.isPending}
                    className="cursor-pointer flex-1 px-4 py-2 sm:px-5 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 sm:gap-2"
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

      {/* Send Confirmation Modal */}
      {reminderToSend && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay"
            onClick={() => setReminderToSend(null)}
          />

          {/* Modal Content */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-scale-in pointer-events-auto border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 sm:p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 mx-auto flex items-center justify-center mb-4 border border-emerald-100">
                  <Send className="w-6 h-6 text-emerald-600 -ml-0.5 mt-0.5" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{t('Send Reminder')}</h3>
                <p className="text-gray-500 text-sm mb-6 font-medium">
                  {t('Are you sure you want to send this reminder to')} <span className="font-semibold text-gray-800">{reminderToSend.customerId?.name || t('Unknown Customer')}</span> {t('now?')}
                </p>

                <div className="flex gap-2 sm:gap-3 justify-center">
                  <button
                    onClick={() => setReminderToSend(null)}
                    className="cursor-pointer flex-1 px-4 py-2 sm:px-5 sm:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm transition-colors active:scale-95"
                  >
                    {t('Cancel')}
                  </button>
                  <button
                    onClick={confirmSend}
                    disabled={sendMutation.isPending}
                    className="cursor-pointer flex-1 px-4 py-2 sm:px-5 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 sm:gap-2"
                  >
                    {sendMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t('Yes, Send')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Message Modal */}
      {reminderToView && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay" onClick={() => setReminderToView(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-lg shadow-xl flex flex-col max-h-[80vh] overflow-hidden animate-scale-in z-[101]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-base">
                <MessageSquare className="w-4 h-4 text-[#093C5D]" />
                {t('Message Details')}
              </h3>
              <button onClick={() => setReminderToView(null)} className="cursor-pointer text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px] border border-gray-200">
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto text-sm text-gray-700 leading-relaxed custom-scrollbar whitespace-pre-wrap text-left">
              {reminderToView.message}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Reminders;
