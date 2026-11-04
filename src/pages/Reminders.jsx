/**
 * Payment Reminders Management Page
 * Handles automated WhatsApp/SMS credit payment collection schedules, manual triggers, and recovery analytics.
 */

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient, useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '../api/axios';
import { Plus, Bell, Clock, User, X, MessageCircle, Mail, Edit, Trash2, TrendingUp, Lightbulb, Activity, Send, Loader2, AlertCircle, Eye, Search } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import LoadMoreButton from '../components/common/LoadMoreButton';
import SearchableSelect from '../components/common/SearchableSelect';
import SwirlingLoader from '../components/common/SwirlingLoader';
import ConfirmModal from '../components/common/ConfirmModal';
import BusinessSetupModal from '../components/common/BusinessSetupModal';
import { formatDate } from '../utils/dateUtils';
import toast from 'react-hot-toast';

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
  const [reminderToView, setReminderToView] = useState(null);
  const [sendingReminderId, setSendingReminderId] = useState(null);
  const [businessSetupModalOpen, setBusinessSetupModalOpen] = useState(false);
  const { user } = useSelector(state => state.auth);
  const queryClient = useQueryClient();

  const setFilterStatus = (value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value === 'All') next.delete('filter');
      else next.set('filter', value);
      return next;
    }, { replace: true });
  };

  /**
   * Search Query Debounce & URL Synchronization
   * Defers filter query updates to prevent rapid API requests and keeps browser URL search params in sync
   */
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

  /**
   * Browser Navigation Synchronization
   * Reflects external URL changes and browser history events into local search state
   */
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (urlSearch !== debouncedSearch) {
      setSearchName(urlSearch);
      setDebouncedSearch(urlSearch);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [searchParams]);

  /**
   * Infinite Reminders Query
   * Fetches paginated collection reminders filtered by delivery status and search keyword
   */
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
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  /**
   * Customer Dropdown Query
   * Retrieves minimal customer records to populate recipient selector when reminder modal is active
   */
  const { data: customers = [] } = useQuery({
    queryKey: ['customers', 'minimal-dropdown'],
    queryFn: async () => {
      const res = await api.get('/customers?limit=1000&fields=minimal&includeStats=false');
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isModalOpen,
    staleTime: 2 * 60 * 1000,
  });

  const reminders = useMemo(() => data?.pages?.flatMap(page => page.data || []) || [], [data?.pages]);

  const { register, handleSubmit, reset, watch, control, formState: { errors } } = useForm();
  const selectedCustomerId = watch('customerId');
  const selectedType = watch('type');

  const customerExistingReminder = !isEditMode && selectedCustomerId 
    ? reminders.find(r => (r.customerId?._id === selectedCustomerId || r.customerId === selectedCustomerId) && (
        r.status === 'PENDING' || (new Date(r.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000)
      ))
    : null;

  const mutation = useMutation({
    mutationFn: (reminderData) => {
      if (isEditMode) {
        return api.put(`/reminders/${editingReminder._id}`, reminderData);
      }
      return api.post('/reminders', reminderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingReminder(null);
      reset();
      toast.success(isEditMode ? t('Reminder updated successfully!') : t('Reminder created successfully!'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('Failed to save reminder.'));
      console.error('Reminder creation failed:', error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (reminderId) => api.delete(`/reminders/${reminderId}`),
    onMutate: async (reminderId) => {
      await queryClient.cancelQueries({ queryKey: ['reminders'] });
      const previousData = queryClient.getQueryData(['reminders', debouncedSearch, filterStatus]);

      queryClient.setQueryData(['reminders', debouncedSearch, filterStatus], (old) => {
        if (!old || !old.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: (page.data || []).filter((r) => r._id !== reminderId),
            totalCount: Math.max(0, (page.totalCount || 1) - 1),
          })),
        };
      });

      setReminderToDelete(null);

      return { previousData };
    },
    onError: (err, reminderId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['reminders', debouncedSearch, filterStatus], context.previousData);
      }
      toast.error(err.response?.data?.message || t('Failed to delete reminder.'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
    onSuccess: () => {
      toast.success(t('Reminder deleted successfully!'));
    }
  });

  const handleSendNow = async (reminder) => {
    if (sendingReminderId) return;
    if (!user?.isBusinessSetupCompleted) {
      toast(t('Please complete your Business Profile to send payment reminders'), {
        id: 'reminder-setup-required-toast',
        duration: 4000,
      });
      setBusinessSetupModalOpen(true);
      return;
    }
    try {
      setSendingReminderId(reminder._id);
      await api.post(`/reminders/${reminder._id}/send`);
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success(t('Reminder sent via WhatsApp successfully!'), { id: `send-reminder-${reminder._id}` });
    } catch (err) {
      console.error('Failed to send reminder directly:', err);
      toast.error(err.response?.data?.message || t('Failed to send WhatsApp reminder.'), { id: `send-reminder-${reminder._id}` });
    } finally {
      setSendingReminderId(null);
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

  const isAnyModalOpen = isModalOpen || !!reminderToDelete || !!reminderToView || businessSetupModalOpen;

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
    mutation.mutate(data);
  };

  const firstPage = data?.pages?.[0];
  const totalCount = firstPage?.totalCount || 0;
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
      {/**
       * Page Header Section
       * Title, subtitle, and primary reminder creation action trigger
       */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#191E2B]">{t('Reminders')}</h1>
          <p className="text-[#4E5668] text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed">
            {t('Send payment reminders directly to your customers via WhatsApp')}
          </p>
        </div>
        <button
          onClick={() => {
            if (!user?.isBusinessSetupCompleted) {
              toast(t('Please complete your Business Profile to schedule reminders'), {
                id: 'reminder-setup-required-toast',
                duration: 4000,
              });
              setBusinessSetupModalOpen(true);
              return;
            }
            setIsModalOpen(true);
          }}
          className="hidden lg:flex cursor-pointer bg-[#4338CA] hover:bg-[#3730A3] text-white px-4 sm:px-5 md:px-6 py-2 md:py-2.5 rounded-lg items-center whitespace-nowrap shrink-0 font-semibold text-xs md:text-sm w-full sm:w-auto justify-center active:scale-95 transition-all shadow-none"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
          {t('Set Reminder')}
        </button>
      </div>

      {/**
       * Payment Recovery Metrics Overview
       * Real-time metrics tracking pending reminders, sent alerts, outstanding udhar, and recovered amounts
       */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
        {/**
         * Pending Reminders Metric Tile
         * Number of scheduled reminders awaiting dispatch
         */}
        <div className="bg-[#FBFBFC] rounded-lg p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[7.5rem] sm:min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-[#DCE1EA] hover:border-[#C2C9D6] transition-all duration-200 overflow-hidden cursor-default shadow-none">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg bg-[#EEF0FB] flex items-center justify-center text-[#4338CA] border border-[#D8DCF5]">
              <Clock className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-[#4E5668] mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Pending Reminders')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-[#191E2B] truncate">{stats.pendingCount}</p>
            <p className="text-[10px] md:text-xs text-[#757F94] font-medium truncate mt-0.5">{t('Scheduled')}</p>
          </div>
        </div>

        {/**
         * Sent Reminders Metric Tile
         * Count of reminders successfully delivered to customers
         */}
        <div className="bg-[#FBFBFC] rounded-lg p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[7.5rem] sm:min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-[#DCE1EA] hover:border-[#C2C9D6] transition-all duration-200 overflow-hidden cursor-default shadow-none">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg bg-[#EEF0FB] flex items-center justify-center text-[#4338CA] border border-[#D8DCF5]">
              <Send className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-[#4E5668] mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Reminders Sent')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-[#191E2B] truncate">{stats.sentCount}</p>
            <p className="text-[10px] md:text-xs text-[#757F94] font-medium truncate mt-0.5">{t('Delivered Successfully')}</p>
          </div>
        </div>

        {/**
         * Outstanding Credit Metric Tile
         * Cumulative overdue balance across all debtor customers
         */}
        <div className="bg-[#FBFBFC] rounded-lg p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[7.5rem] sm:min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border-l-4 border-l-[#B91C1C] border-t border-t-[#DCE1EA] border-r border-r-[#DCE1EA] border-b border-b-[#DCE1EA] hover:border-r-[#C2C9D6] hover:border-t-[#C2C9D6] hover:border-b-[#C2C9D6] transition-all duration-200 overflow-hidden cursor-default shadow-none">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg bg-[#FFF1F2] flex items-center justify-center text-[#B91C1C] border border-[#FECDD3]">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-[#4E5668] mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Pending Udhar')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-[#B91C1C] truncate">
              ₹{stats.totalPending.toLocaleString()}
            </p>
            <p className="text-[10px] md:text-xs text-[#B91C1C] font-medium truncate mt-0.5">
              {stats.customersWithDuesCount} {t('Customers')}
            </p>
          </div>
        </div>

        {/**
         * Recovered Credit Metric Tile
         * Total monetary recovery achieved through reminder collections
         */}
        <div className="bg-[#FBFBFC] rounded-lg p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[7.5rem] sm:min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border-l-4 border-l-[#0D7A57] border-t border-t-[#DCE1EA] border-r border-r-[#DCE1EA] border-b border-b-[#DCE1EA] hover:border-r-[#C2C9D6] hover:border-t-[#C2C9D6] hover:border-b-[#C2C9D6] transition-all duration-200 overflow-hidden cursor-default shadow-none">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg bg-[#ECFDF5] flex items-center justify-center text-[#0D7A57] border border-[#A7F3D0]">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-[#4E5668] mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Amount Recovered')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-[#0D7A57] truncate">
              ₹{stats.recovered.toLocaleString()}
            </p>
            <p className="text-[10px] md:text-xs text-[#0D7A57] font-medium truncate mt-0.5">
              {recoveryRate}% {t('Recovery Rate')}
            </p>
          </div>
        </div>
      </div>

      {/**
       * Delivery Status Filter Tabs
       * Filter controls toggling between all, pending, and sent reminders
       */}
      <div className="flex items-center flex-nowrap gap-2 sm:gap-3 overflow-x-auto pb-1 mb-2 sm:mb-3 w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {[
          { label: 'All', value: 'All' },
          { label: 'Pending', value: 'Pending' },
          { label: 'Sent', value: 'Sent' },
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => setFilterStatus(filter.value)}
            className={`shrink-0 cursor-pointer py-1.5 sm:py-2 px-3 sm:px-4 rounded-full text-[10px] sm:text-sm font-medium transition-all duration-200 border active:scale-95 select-none flex items-center justify-center whitespace-nowrap !min-h-0 !min-w-0 !h-fit ${filterStatus === filter.value
              ? 'bg-[#4338CA] text-white border-[#4338CA] shadow-none'
              : 'bg-[#FBFBFC] text-[#4E5668] border-[#DCE1EA] hover:border-[#C2C9D6] hover:bg-[#F0F2F6] shadow-none'
              }`}
          >
            {t(filter.label)}
          </button>
        ))}
      </div>

      {/**
       * Customer Search Bar
       * Search reminders by associated customer name or mobile number
       */}
      <div className="flex flex-col w-full mb-3 sm:mb-4">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-[#757F94]" />
          </div>
          <input
            type="text"
            placeholder={t("Search By Name Or Number")}
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="block w-full h-10 sm:h-12 pl-9 sm:pl-11 pr-3 sm:pr-4 bg-[#FBFBFC] border border-[#DCE1EA] rounded-lg text-[13px] sm:text-sm text-[#191E2B] placeholder-[#757F94] focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] transition-colors duration-200 shadow-none"
          />
        </div>
      </div>

      {/**
       * Reminders Data Directory
       * Main container rendering loading states, empty placeholders, tables, or mobile cards
       */}
      <div className="bg-[#FBFBFC] md:border md:border-[#DCE1EA] md:rounded-lg overflow-hidden shadow-none">
        {isLoading ? (
          <div className="flex justify-center items-center py-12 border border-[#E8ECF2] rounded-lg md:border-none">
            <SwirlingLoader className="w-10 h-10 md:w-12 md:h-12 text-[#4338CA]" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] py-12 border border-[#E8ECF2] rounded-lg md:border-none">
            <AlertCircle className="w-12 h-12 text-[#B91C1C] mb-4" />
            <p className="text-sm font-medium text-[#191E2B] mb-1">{t('Failed to load data')}</p>
            <p className="text-xs text-[#757F94]">{t('Please try refreshing the page')}</p>
          </div>
        ) : reminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] py-12 border border-[#E8ECF2] rounded-lg md:border-none px-4 text-center">
            <div className="w-16 h-16 bg-[#F0F2F6] rounded-full flex items-center justify-center mb-4 border border-[#DCE1EA]">
              <Bell className="w-8 h-8 text-[#757F94]" />
            </div>
            <h3 className="text-base font-semibold text-[#191E2B] mb-1">{t('No Reminders Found')}</h3>
            <p className="text-sm text-[#757F94] max-w-sm mb-6">
              {searchName ? t('No reminders match your search criteria.') : t('You haven\'t set up any reminders yet.')}
            </p>
            {!searchName && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="cursor-pointer bg-[#4338CA] hover:bg-[#3730A3] text-white px-5 py-2.5 rounded-lg flex items-center font-medium text-sm active:scale-95 transition-all shadow-none"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('Set First Reminder')}
              </button>
            )}
          </div>
        ) : (
          <>
            {/**
             * Desktop Tabular Reminders View
             * Tabular display of customer profile, schedule, outstanding due, delivery status, and action triggers
             */}
            <div className="hidden md:block overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] min-h-[400px]">
              <table className="w-full min-w-[950px] whitespace-nowrap text-left">
                <thead className="bg-[#F0F2F6] border-b border-[#DCE1EA]">
                  <tr>
                    <th className="px-4 lg:px-6 py-3.5 lg:py-4 text-left text-[10px] lg:text-xs font-semibold text-[#757F94] uppercase tracking-wider">{t('Customer')}</th>
                    <th className="px-4 lg:px-6 py-3.5 lg:py-4 text-left text-[10px] lg:text-xs font-semibold text-[#757F94] uppercase tracking-wider">{t('Schedule')}</th>
                    <th className="px-4 lg:px-6 py-3.5 lg:py-4 text-right text-[10px] lg:text-xs font-semibold text-[#757F94] uppercase tracking-wider">{t('Due')}</th>
                    <th className="px-4 lg:px-6 py-3.5 lg:py-4 text-right text-[10px] lg:text-xs font-semibold text-[#757F94] uppercase tracking-wider">{t('Status')}</th>
                    <th className="px-4 lg:px-6 py-3.5 lg:py-4 text-right text-[10px] lg:text-xs font-semibold text-[#757F94] uppercase tracking-wider">{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {reminders.map((reminder) => (
                    <tr key={reminder._id} className="bg-[#FBFBFC] border-b border-[#E8ECF2] last:border-b-0 hover:bg-[#F0F2F6]/60 transition-colors duration-150 relative">

                      {/**
                       * Customer Profile Column
                       * Customer initial avatar, full name, and registered phone number
                       */}
                      <td className="w-[30%] px-4 lg:px-6 py-3.5 lg:py-4 align-middle">
                        <div className="flex items-center gap-3 lg:gap-4">
                          <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center text-[10px] lg:text-xs font-semibold flex-shrink-0 border border-[#D8DCF5] bg-[#EEF0FB] text-[#4338CA]">
                            {reminder.customerId?.name ? reminder.customerId.name.substring(0, 2).toUpperCase() : 'UN'}
                          </div>
                          <div>
                            <span className="text-xs lg:text-sm font-semibold text-[#191E2B] truncate block">
                              {reminder.customerId?.name || t('Deleted Customer')}
                            </span>
                            <div className="text-[10px] lg:text-xs text-[#757F94] font-medium mt-0.5 flex items-center">
                              {reminder.customerId?.phone}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/**
                       * Schedule & Channel Column
                       * Target delivery date and communication medium badge (WhatsApp/SMS)
                       */}
                      <td className="w-[20%] px-4 lg:px-6 py-3.5 lg:py-4 align-middle">
                        <span className="text-xs lg:text-sm text-[#191E2B] font-medium block whitespace-nowrap">
                          {formatDate(reminder.scheduledDate)}
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] lg:text-xs text-[#757F94] font-medium mt-0.5 whitespace-nowrap uppercase tracking-wider">
                          {reminder.type === 'WHATSAPP' ? (
                            <MessageCircle className="w-3 h-3 text-[#0D7A57] shrink-0" />
                          ) : (
                            <Mail className="w-3 h-3 text-[#4338CA] shrink-0" />
                          )}
                          {reminder.type}
                        </span>
                      </td>

                      {/**
                       * Outstanding Balance Column
                       * Current overdue amount recorded on the customer ledger
                       */}
                      <td className="w-[15%] px-4 lg:px-6 py-3.5 lg:py-4 align-middle text-right">
                        <span className={`text-xs lg:text-sm font-semibold block ${reminder.customerId?.balance > 0 ? 'text-[#B91C1C]' : 'text-[#191E2B]'}`}>
                          {reminder.customerId?.balance > 0 ? `₹${reminder.customerId.balance.toLocaleString('en-IN')}` : '-'}
                        </span>
                      </td>

                      {/**
                       * Delivery Status Badge Column
                       * Visual indicator reflecting pending, delivered, or failed status
                       */}
                      <td className="w-[10%] px-4 lg:px-6 py-3.5 lg:py-4 align-middle text-right">
                        <div className="flex items-center justify-end w-full h-full">
                          <span className={`inline-block px-2.5 py-1 rounded text-[10px] lg:text-xs font-semibold uppercase tracking-wide text-center ${reminder.status === 'PENDING' ? 'bg-[#FFF1F2] text-[#B91C1C] border border-[#FECDD3]' :
                              reminder.status === 'SENT' ? 'bg-[#ECFDF5] text-[#0D7A57] border border-[#A7F3D0]' :
                                'bg-[#FFF1F2] text-[#B91C1C] border border-[#FECDD3]'
                            }`}>
                            {t(reminder.status)}
                          </span>
                        </div>
                      </td>

                      {/**
                       * Row Action Controls
                       * Interactive buttons to view message text, dispatch instantly, edit, or delete
                       */}
                      <td className="w-[30%] px-4 lg:px-6 py-3.5 lg:py-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-2 lg:gap-2.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setReminderToView(reminder)}
                            className="cursor-pointer text-[#4338CA] font-medium bg-[#EEF0FB] border border-[#D8DCF5] hover:bg-[#E0E4F9] px-3 py-1.5 rounded-lg flex items-center justify-center transition-all text-xs active:scale-95 whitespace-nowrap shadow-none"
                            title={t('View Message')}
                          >
                            <Eye className="w-3.5 h-3.5 lg:mr-1.5 shrink-0" />
                            <span className="hidden lg:inline">{t('Message')}</span>
                          </button>
                          {reminder.status !== 'SENT' && (
                            <button
                              disabled={sendingReminderId === reminder._id}
                              onClick={() => handleSendNow(reminder)}
                              className={`cursor-pointer font-medium px-3 py-1.5 rounded-lg flex items-center justify-center transition-all text-xs active:scale-95 whitespace-nowrap ${
                                sendingReminderId === reminder._id
                                  ? 'bg-[#F0F2F6] text-[#757F94] border border-[#DCE1EA] cursor-wait'
                                  : 'text-[#0D7A57] bg-[#ECFDF5] border border-[#A7F3D0] hover:bg-[#D1FAE5] shadow-none'
                              }`}
                              title={t('Send Now')}
                            >
                              {sendingReminderId === reminder._id ? (
                                <Loader2 className="w-3.5 h-3.5 lg:mr-1.5 shrink-0 animate-spin text-[#0D7A57]" />
                              ) : (
                                <Send className="w-3.5 h-3.5 lg:mr-1.5 shrink-0" />
                              )}
                              <span className="hidden lg:inline">{sendingReminderId === reminder._id ? t('Sending...') : t('Send')}</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(reminder)}
                            className="cursor-pointer text-[#4E5668] font-medium bg-[#F0F2F6] border border-[#DCE1EA] hover:bg-[#EBEEF4] px-3 py-1.5 rounded-lg flex items-center justify-center transition-all text-xs active:scale-95 whitespace-nowrap shadow-none"
                            title={t('Edit')}
                          >
                            <Edit className="w-3.5 h-3.5 lg:mr-1.5 shrink-0" />
                            <span className="hidden lg:inline">{t('Edit')}</span>
                          </button>
                          <button
                            onClick={() => handleDelete(reminder)}
                            disabled={deleteMutation.isPending}
                            className="cursor-pointer text-[#B91C1C] font-medium bg-[#FFF1F2] border border-[#FECDD3] hover:bg-[#FFE4E6] px-3 py-1.5 rounded-lg flex items-center justify-center transition-all text-xs active:scale-95 disabled:opacity-50 whitespace-nowrap shadow-none"
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

            {/**
             * Mobile Reminders Card Feed
             * Responsive touch-optimized cards displaying reminder details and action buttons
             */}
            <div className="md:hidden flex flex-col gap-2.5">
              {reminders.map((reminder) => (
                <div
                  key={reminder._id}
                  className="bg-[#FBFBFC] border border-[#DCE1EA] rounded-lg p-3 sm:p-4 active:bg-[#F0F2F6] transition-colors duration-200 shadow-none"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-sm font-semibold flex-shrink-0 bg-[#EEF0FB] text-[#4338CA] border border-[#D8DCF5]">
                        {reminder.customerId?.name ? reminder.customerId.name.substring(0, 2).toUpperCase() : 'UN'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-[13px] sm:text-sm font-semibold text-[#191E2B] truncate leading-tight">
                            {reminder.customerId?.name || t('Deleted Customer')}
                          </h3>
                        </div>
                        <div className="flex items-center text-[#757F94] text-[11px] sm:text-xs font-medium mt-1">
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 flex-shrink-0" />
                          <span className="leading-none pt-[1.5px]">{formatDate(reminder.scheduledDate)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 flex flex-col items-end gap-0.5">
                      <p className={`text-[13px] sm:text-[14px] font-semibold leading-tight ${reminder.customerId?.balance > 0 ? 'text-[#B91C1C]' : 'text-[#191E2B]'}`}>
                        {reminder.customerId?.balance > 0 ? `₹${reminder.customerId.balance.toLocaleString('en-IN')}` : ''}
                      </p>
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase sm:text-[10px] font-semibold ${reminder.status === 'PENDING'
                        ? 'bg-[#FFF1F2] text-[#B91C1C] border border-[#FECDD3]'
                        : reminder.status === 'SENT'
                          ? 'bg-[#ECFDF5] text-[#0D7A57] border border-[#A7F3D0]'
                          : 'bg-[#FFF1F2] text-[#B91C1C] border border-[#FECDD3]'
                        }`}>
                        {t(reminder.status)}
                      </span>
                    </div>
                  </div>

                  {/**
                   * Card Action Bar
                   * Action buttons for quick preview, immediate dispatch, edit, and deletion
                   */}
                  <div className="flex justify-end gap-2 w-full mt-3 pt-3 border-t border-[#E8ECF2]">
                    <button
                      onClick={(e) => { e.stopPropagation(); setReminderToView(reminder); }}
                      className="cursor-pointer text-[#4338CA] font-medium bg-[#EEF0FB] border border-[#D8DCF5] hover:bg-[#E0E4F9] px-2.5 py-1 rounded-md flex items-center justify-center transition-all text-xs active:scale-95 whitespace-nowrap !min-h-0 !min-w-0 !h-fit shadow-none"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5 shrink-0" /> {t('Message')}
                    </button>
                    {reminder.status !== 'SENT' && (
                      <button
                        disabled={sendingReminderId === reminder._id}
                        onClick={(e) => { e.stopPropagation(); handleSendNow(reminder); }}
                        className={`cursor-pointer font-medium px-2.5 py-1 rounded-md flex items-center justify-center transition-all text-xs active:scale-95 whitespace-nowrap !min-h-0 !min-w-0 !h-fit ${
                          sendingReminderId === reminder._id
                            ? 'bg-[#F0F2F6] text-[#757F94] border border-[#DCE1EA] cursor-wait'
                            : 'text-[#0D7A57] bg-[#ECFDF5] border border-[#A7F3D0] hover:bg-[#D1FAE5] shadow-none'
                        }`}
                      >
                        {sendingReminderId === reminder._id ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 shrink-0 animate-spin text-[#0D7A57]" />
                        ) : (
                          <Send className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                        )}
                        {sendingReminderId === reminder._id ? t('Sending...') : t('Send')}
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(reminder); }}
                      className="cursor-pointer text-[#4E5668] font-medium bg-[#F0F2F6] border border-[#DCE1EA] hover:bg-[#EBEEF4] px-2.5 py-1 rounded-md flex items-center justify-center transition-all text-xs active:scale-95 whitespace-nowrap !min-h-0 !min-w-0 !h-fit shadow-none"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1.5 shrink-0" /> {t('Edit')}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(reminder); }}
                      className="cursor-pointer text-[#B91C1C] font-medium bg-[#FFF1F2] border border-[#FECDD3] hover:bg-[#FFE4E6] px-2.5 py-1 rounded-md flex items-center justify-center transition-all text-xs active:scale-95 whitespace-nowrap !min-h-0 !min-w-0 !h-fit shadow-none"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5 shrink-0" /> {t('Delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/**
             * Pagination Controls
             * Interactive trigger to fetch and append the next page of reminders
             */}
            <LoadMoreButton
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
              currentCount={reminders.length}
              totalCount={totalCount}
              label={t('reminders')}
            />
          </>
        )}
      </div>

      {/**
       * Mobile Floating Action Trigger (FAB)
       * Floating button for creating new reminders on mobile and tablet screens
       */}
      {!isAnyModalOpen && !businessSetupModalOpen && (
        <button
          onClick={() => {
            if (!user?.isBusinessSetupCompleted) {
              setBusinessSetupModalOpen(true);
              return;
            }
            setIsModalOpen(true);
          }}
          className="lg:hidden fixed bottom-6 right-6 bg-[#4338CA] hover:bg-[#3730A3] text-white px-5 py-3.5 rounded-lg flex items-center transition-all z-[40] active:scale-95 group font-semibold text-sm shadow-none"
        >
          <Plus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
          {t('Set Reminder')}
        </button>
      )}

      {/**
       * Create / Edit Reminder Dialog
       * Modal form for setting up customer recipients, scheduled dates, channels, and custom text
       */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50">
          {/**
           * Modal Backdrop Overlay
           * Dimmed background dismissing modal when clicked
           */}
          <div className="fixed inset-0 bg-[#191E2B]/50 transition-opacity animate-modal-overlay" onClick={handleCloseModal} />

          {/**
           * Modal Content Container
           * Bottom sheet on mobile devices transitioning to centered modal on larger viewports
           */}
          <div className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-center sm:justify-center sm:px-4 sm:py-8 z-50 pointer-events-none">
            <div className="relative bg-[#FBFBFC] w-full sm:max-w-md rounded-t-2xl sm:rounded-xl flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-[#DCE1EA] animate-modal-content overflow-hidden pointer-events-auto shadow-none">

              {/**
               * Mobile Bottom Sheet Handle
               * Decorative touch affordance for mobile viewports
               */}
              <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1.5 bg-[#DCE1EA] rounded-full" />
              </div>

              <div className="flex items-center justify-between px-5 md:px-6 py-4 md:py-5 border-b border-[#E8ECF2] flex-shrink-0">
                <h3 className="text-lg md:text-xl font-semibold text-[#191E2B]">
                  {isEditMode ? t('Edit Reminder') : t('Set Custom Reminder')}
                </h3>
                <button onClick={handleCloseModal} className="cursor-pointer text-[#757F94] bg-[#F0F2F6] hover:bg-[#EBEEF4] hover:text-[#191E2B] w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px] border border-[#DCE1EA]">
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              <div className="p-5 md:p-6 overflow-y-auto">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/**
                   * Customer Selector Field
                   * Searchable dropdown selecting customer recipient
                   */}
                  <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-0.5">
                      {t('Customer')} <span className="text-[#B91C1C]">*</span>
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
                      <p className="text-[#B91C1C] text-[11px] sm:text-xs mt-1.5 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="leading-none pt-[1px]">{t(errors.customerId.message)}</span>
                      </p>
                    )}
                    {customerExistingReminder && (
                      <div className="mt-2 p-2.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg text-[#92400E] text-xs flex items-start gap-2 shadow-none">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B45309]" />
                        <span>
                          {customerExistingReminder.status === 'PENDING'
                            ? t('An active reminder is already pending for this customer.')
                            : t('A reminder was already created for this customer today (Limit: 1 per day).')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/**
                   * Notification Message Field
                   * Customizable reminder text template with customer balance details
                   */}
                  <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-0.5">
                      {t('Message')} <span className="text-[#B91C1C]">*</span>
                    </label>
                    <textarea
                      {...register('message', { required: 'Message is required' })}
                      className={`block w-full rounded-lg border bg-[#FBFBFC] px-3 py-2.5 text-sm md:text-base font-medium text-[#191E2B] placeholder:text-[#9AA4B8] transition-colors duration-200 shadow-none focus:outline-none resize-none bg-[#FBFBFC] text-[#191E2B] placeholder-[#9AA4B8] shadow-none ${errors.message ? 'border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20 focus:border-[#B91C1C]' : 'border-[#DCE1EA] focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]'}`}
                      rows="4"
                      placeholder={t("Dear customer, your payment of ₹...")}
                    ></textarea>
                    {errors.message && (
                      <p className="text-[#B91C1C] text-[11px] sm:text-xs mt-1.5 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="leading-none pt-[1px]">{t(errors.message.message)}</span>
                      </p>
                    )}
                  </div>

                  {/**
                   * Scheduled Date Field
                   * Calendar date picker defining when the reminder is dispatched
                   */}
                  <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-0.5">
                      {t('Scheduled Date')} <span className="text-[#B91C1C]">*</span>
                    </label>
                    <input
                      type="date"
                      {...register('scheduledDate', { required: 'Scheduled date is required' })}
                      className={`block w-full rounded-lg border bg-[#FBFBFC] px-3 py-2.5 text-sm md:text-base font-medium text-[#191E2B] placeholder:text-[#9AA4B8] transition-colors duration-200 shadow-none focus:outline-none bg-[#FBFBFC] text-[#191E2B] shadow-none ${errors.scheduledDate ? 'border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20 focus:border-[#B91C1C]' : 'border-[#DCE1EA] focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]'}`}
                    />
                    {errors.scheduledDate && (
                      <p className="text-[#B91C1C] text-[11px] sm:text-xs mt-1.5 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="leading-none pt-[1px]">{t(errors.scheduledDate.message)}</span>
                      </p>
                    )}
                  </div>

                  {/**
                   * Delivery Channel Selector
                   * Communication pathway (WhatsApp)
                   */}
                  <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-0.5">
                      {t('Channel')} <span className="text-[#B91C1C]">*</span>
                    </label>
                    <select
                      {...register('type')}
                      className="block w-full rounded-lg border border-[#DCE1EA] bg-[#FBFBFC] px-3 py-2.5 text-sm md:text-base font-medium text-[#191E2B] placeholder:text-[#9AA4B8] transition-colors duration-200 shadow-none focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] bg-[#FBFBFC] text-[#191E2B] shadow-none"
                    >
                      <option value="WHATSAPP">WhatsApp</option>
                    </select>
                  </div>

                  {/**
                   * Form Submission Trigger
                   * Saves or updates reminder schedule
                   */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={mutation.isPending || !!customerExistingReminder}
                      className="cursor-pointer w-full bg-[#4338CA] hover:bg-[#3730A3] text-white rounded-lg px-5 py-2.5 font-semibold text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all shadow-none"
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

      {/**
       * Reminder Deletion Confirmation Dialog
       */}
      <ConfirmModal
        isOpen={!!reminderToDelete}
        onClose={() => setReminderToDelete(null)}
        onConfirm={confirmDelete}
        title={t('Delete Reminder')}
        message={t('Are you sure you want to delete this reminder for')}
        itemName={reminderToDelete?.customerId?.name || t('Unknown Customer')}
        isLoading={deleteMutation.isPending}
        confirmText={t('Yes, Delete')}
        variant="danger"
      />

      {/**
       * Reminder Message Preview Dialog
       * Modal displaying full reminder text for merchant inspection
       */}
      {reminderToView && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-[#191E2B]/50 transition-opacity animate-modal-overlay" onClick={() => setReminderToView(null)} />
          <div className="relative bg-[#FBFBFC] w-full max-w-sm rounded-lg shadow-none border border-[#DCE1EA] flex flex-col max-h-[80vh] overflow-hidden animate-scale-in z-[101]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8ECF2] bg-[#F0F2F6]">
              <h3 className="font-semibold text-[#191E2B] flex items-center gap-2 text-base">
                <MessageCircle className="w-4 h-4 text-[#4338CA]" />
                {t('Message Details')}
              </h3>
              <button onClick={() => setReminderToView(null)} className="cursor-pointer text-[#757F94] bg-[#F0F2F6] hover:bg-[#EBEEF4] hover:text-[#191E2B] w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px] border border-[#DCE1EA]">
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto text-sm text-[#191E2B] leading-relaxed custom-scrollbar whitespace-pre-wrap text-left">
              {reminderToView.message}
            </div>
          </div>
        </div>
      )}

      {/**
       * Business Setup Prompt Modal
       * Prompts merchant to configure store profile before dispatching customer notifications
       */}
      <BusinessSetupModal
        isOpen={businessSetupModalOpen}
        onClose={() => setBusinessSetupModalOpen(false)}
      />

    </div>
  );
};

export default Reminders;
