/**
 * Merchant & Administrator Notifications Center Page
 * Paginated activity feed of billing alerts, customer udhar events, stock warnings, and official broadcasts.
 * Fully aligned with UdharPay design system, Dashboard KPI cards, and Settings navigation pattern.
 */

import { useState, useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  BellRing,
  CheckCheck, 
  Trash2, 
  Loader2, 
  AlertTriangle,
  FileText,
  CreditCard,
  Users,
  ShieldAlert,
  Headphones,
  Gem,
  Inbox,
  ArrowRight,
  Clock
} from 'lucide-react';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';
import LoadMoreButton from '../components/common/LoadMoreButton';
import SwirlingLoader from '../components/common/SwirlingLoader';
import { formatRelativeTime } from '../utils/dateUtils';
import toast from 'react-hot-toast';

/**
 * Filter Categories for Notification Feed
 * Optimized icons and font hierarchy matching Settings.jsx navigation
 */
const FILTER_TABS = [
  { id: 'ALL', label: 'All Alerts', icon: Bell },
  { id: 'UNREAD', label: 'Unread', icon: Inbox },
  { id: 'ADMIN_NOTICE', label: 'Official Notices', icon: ShieldAlert },
  { id: 'BILL', label: 'Bills', icon: FileText },
  { id: 'PAYMENT', label: 'Payments', icon: CreditCard },
  { id: 'REMINDER', label: 'Reminders', icon: Clock },
  { id: 'CUSTOMER', label: 'Customers', icon: Users },
  { id: 'LOW_STOCK', label: 'Stock Alerts', icon: AlertTriangle },
  { id: 'SUBSCRIPTION', label: 'Subscription', icon: Gem },
  { id: 'SUPPORT', label: 'Support', icon: Headphones },
];

/**
 * Notifications Component
 */
const Notifications = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL');

  /**
   * Paginated Infinite Query Scoped to Active Filter
   */
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['notifications', { tab: activeTab }],
    queryFn: async ({ pageParam = 1 }) => {
      let url = `/notifications?page=${pageParam}&limit=15`;
      if (activeTab === 'UNREAD') {
        url += '&isRead=false';
      } else if (activeTab !== 'ALL') {
        url += `&type=${activeTab}`;
      }
      const res = await api.get(url);
      return res.data.data;
    },
    getNextPageParam: (lastPage) => (lastPage?.hasNextPage ? lastPage.currentPage + 1 : undefined),
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const notifications = useMemo(() => data?.pages?.flatMap((page) => page?.data || []) || [], [data?.pages]);
  const firstPage = data?.pages?.[0];
  const totalCount = firstPage?.totalCount || 0;
  const unreadCount = firstPage?.unreadCount ?? notifications.filter((n) => !n.isRead).length;

  /**
   * Mark Single Notification Read Mutation
   */
  const markReadMutation = useMutation({
    mutationFn: (notificationId) => api.patch(`/notifications/${notificationId}/read`),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previousData = queryClient.getQueryData(['notifications', { tab: activeTab }]);

      queryClient.setQueryData(['notifications', { tab: activeTab }], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((notif) =>
              notif._id === notificationId ? { ...notif, isRead: true } : notif
            ),
          })),
        };
      });
      return { previousData };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['notifications', { tab: activeTab }], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['directOfficialNotices'] });
    },
  });

  /**
   * Mark All Notifications Read Mutation
   */
  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/mark-all-read'),
    onSuccess: () => {
      toast.success(t('All notifications marked as read'));
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['directOfficialNotices'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('Failed to mark all as read'));
    },
  });

  /**
   * Delete Single Notification Mutation
   */
  const deleteMutation = useMutation({
    mutationFn: (notificationId) => api.delete(`/notifications/${notificationId}`),
    onSuccess: () => {
      toast.success(t('Notification dismissed'));
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('Failed to dismiss notification'));
    },
  });

  /**
   * Clear All Read Notifications Mutation
   */
  const clearReadMutation = useMutation({
    mutationFn: () => api.delete('/notifications/clear-all?onlyRead=true'),
    onSuccess: () => {
      toast.success(t('Read notifications cleared'));
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('Failed to clear read notifications'));
    },
  });

  const handleCardClick = (notification) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification._id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ADMIN_NOTICE':
        return <ShieldAlert className="w-5 h-5 text-[#4338CA]" />;
      case 'LOW_STOCK':
        return <AlertTriangle className="w-5 h-5 text-[#B45309]" />;
      case 'BILL':
        return <FileText className="w-5 h-5 text-[#4E5668]" />;
      case 'PAYMENT':
        return <CreditCard className="w-5 h-5 text-[#047857]" />;
      case 'CUSTOMER':
        return <Users className="w-5 h-5 text-[#0369A1]" />;
      case 'SUBSCRIPTION':
        return <Gem className="w-5 h-5 text-[#7C3AED]" />;
      case 'SUPPORT':
        return <Headphones className="w-5 h-5 text-[#2563EB]" />;
      case 'REMINDER':
        return <Clock className="w-5 h-5 text-[#D97706]" />;
      default:
        return <Bell className="w-5 h-5 text-[#757F94]" />;
    }
  };

  const sanitizeNotificationMessage = (msg) => {
    if (!msg) return '';
    return msg.replace(/₹undefined/g, '₹—').replace(/₹NaN/g, '₹0').replace(/undefined/g, '—');
  };

  const getActionLabel = (notif) => {
    if (notif.actionText) return t(notif.actionText);
    switch (notif.type) {
      case 'BILL':
        return t('View Bill');
      case 'PAYMENT':
        return t('View Details');
      case 'REMINDER':
        return t('View Reminder');
      case 'CUSTOMER':
        return t('View Customer');
      case 'LOW_STOCK':
        return t('View Stock');
      case 'SUBSCRIPTION':
        return t('Manage Plan');
      case 'SUPPORT':
        return t('View Ticket');
      case 'ADMIN_NOTICE':
        return t('View Notice');
      default:
        return t('Inspect');
    }
  };

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'ADMIN_NOTICE':
        return 'bg-[#EEF0FB] text-[#4338CA] border-[#D8DCF5]';
      case 'LOW_STOCK':
        return 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]';
      case 'BILL':
        return 'bg-[#F0F2F6] text-[#4E5668] border-[#DCE1EA]';
      case 'PAYMENT':
        return 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]';
      case 'REMINDER':
        return 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]';
      case 'CUSTOMER':
        return 'bg-[#F0F9FF] text-[#0369A1] border-[#BAE6FD]';
      case 'SUBSCRIPTION':
        return 'bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]';
      case 'SUPPORT':
        return 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]';
      case 'SYSTEM':
        return 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]';
      default:
        return 'bg-[#F0F2F6] text-[#4E5668] border-[#DCE1EA]';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'ADMIN_NOTICE':
        return t('Official Notice');
      case 'LOW_STOCK':
        return t('Stock Warning');
      case 'BILL':
        return t('Bill');
      case 'PAYMENT':
        return t('Payment');
      case 'REMINDER':
        return t('Reminder');
      case 'CUSTOMER':
        return t('Customer');
      case 'SUBSCRIPTION':
        return t('Subscription');
      case 'SUPPORT':
        return t('Support');
      case 'SYSTEM':
        return t('System');
      default:
        return type;
    }
  };

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 pb-24 lg:pb-0">
      {/**
       * Page Header Section
       * Aligned with Customers page layout and responsive button strip
       */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#191E2B] flex items-center gap-2">
            <span>{t('Notifications Center')}</span>
            {unreadCount > 0 && (
              <span className="bg-[#EEF0FB] text-[#4338CA] border border-[#D8DCF5] text-xs sm:text-sm font-semibold px-2.5 py-0.5 rounded-lg">
                {unreadCount} {t('unread')}
              </span>
            )}
          </h1>
          <p className="text-[#4E5668] text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed font-medium">
            {t('Review activity alerts, billing events, and system broadcasts')}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="cursor-pointer flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-[#4338CA] hover:bg-[#3730A3] text-white px-3.5 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm active:scale-95 transition-all disabled:opacity-50 shadow-none"
            >
              {markAllReadMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCheck className="w-4 h-4" />
              )}
              <span>{t('Mark all as read')}</span>
            </button>
          )}

          {notifications.some((n) => n.isRead) && (
            <button
              type="button"
              onClick={() => clearReadMutation.mutate()}
              disabled={clearReadMutation.isPending}
              className="cursor-pointer inline-flex items-center justify-center gap-1.5 bg-white hover:bg-[#F0F2F6] text-[#4E5668] hover:text-[#191E2B] border border-[#DCE1EA] px-3.5 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm active:scale-95 transition-all disabled:opacity-50 shadow-none"
              title={t('Clear all read notifications')}
            >
              {clearReadMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>{t('Clear Read')}</span>
            </button>
          )}
        </div>
      </div>

      {/**
       * KPI Overview Cards
       * 4-card overview aligned with Dashboard.jsx and Customers.jsx metrics dashboard
       */}
      <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
        {/**
         * Total Alerts Metric
         */}
        <div className="bg-[#FBFBFC] rounded-lg p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[7.5rem] sm:min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-[#DCE1EA] hover:border-[#C2C9D6] transition-all duration-200 overflow-hidden cursor-default shadow-none">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg bg-[#EEF0FB] flex items-center justify-center text-[#4338CA] border border-[#D8DCF5]">
              <Bell className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-[#4E5668] mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">
              {t('Total Alerts')}
            </p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-[#191E2B] truncate">
              {firstPage?.stats?.total ?? totalCount}
            </p>
            <p className="text-[10px] md:text-xs text-[#757F94] font-medium truncate mt-0.5">
              {t('All Events & Notices')}
            </p>
          </div>
        </div>

        {/**
         * Unread Alerts Metric
         */}
        <div className="bg-[#FBFBFC] rounded-lg p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[7.5rem] sm:min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border-l-4 border-l-[#E11D48] border-t border-t-[#DCE1EA] border-r border-r-[#DCE1EA] border-b border-b-[#DCE1EA] hover:border-r-[#C2C9D6] hover:border-t-[#C2C9D6] hover:border-b-[#C2C9D6] transition-all duration-200 overflow-hidden cursor-default shadow-none">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg bg-[#FFF1F2] flex items-center justify-center text-[#B91C1C] border border-[#FECDD3]">
              <BellRing className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-[#4E5668] mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">
              {t('Unread Alerts')}
            </p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-[#B91C1C] truncate">
              {firstPage?.stats?.unread ?? unreadCount}
            </p>
            <p className="text-[10px] md:text-xs text-[#B91C1C] font-medium truncate mt-0.5">
              {unreadCount > 0 ? t('Requires Attention') : t('All Caught Up')}
            </p>
          </div>
        </div>

        {/**
         * Bills & Payments Metric
         */}
        <div className="bg-[#FBFBFC] rounded-lg p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[7.5rem] sm:min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border-l-4 border-l-[#0D7A57] border-t border-t-[#DCE1EA] border-r border-r-[#DCE1EA] border-b border-b-[#DCE1EA] hover:border-r-[#C2C9D6] hover:border-t-[#C2C9D6] hover:border-b-[#C2C9D6] transition-all duration-200 overflow-hidden cursor-default shadow-none">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg bg-[#ECFDF5] flex items-center justify-center text-[#0D7A57] border border-[#A7F3D0]">
              <FileText className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-[#4E5668] mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">
              {t('Bills & Payments')}
            </p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-[#0D7A57] truncate">
              {firstPage?.stats?.billsAndPayments ?? 0}
            </p>
            <p className="text-[10px] md:text-xs text-[#0D7A57] font-medium truncate mt-0.5">
              {t('Transactional Alerts')}
            </p>
          </div>
        </div>

        {/**
         * Official Notices Metric
         */}
        <div className="bg-[#FBFBFC] rounded-lg p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[7.5rem] sm:min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-[#DCE1EA] hover:border-[#C2C9D6] transition-all duration-200 overflow-hidden cursor-default shadow-none">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg bg-[#F5F3FF] flex items-center justify-center text-[#7C3AED] border border-[#DDD6FE]">
              <ShieldAlert className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-[#4E5668] mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">
              {t('Official Notices')}
            </p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-[#7C3AED] truncate">
              {firstPage?.stats?.officialNotices ?? 0}
            </p>
            <p className="text-[10px] md:text-xs text-[#757F94] font-medium truncate mt-0.5">
              {t('Platform Broadcasts')}
            </p>
          </div>
        </div>
      </div>

      {/**
       * Category Filter Bar
       * Styled identically to Settings.jsx navigation pill bar with exact uniform height, optical icon-text alignment, and shadow-none
       */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {FILTER_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <div
              key={tab.id}
              role="button"
              tabIndex={0}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveTab(tab.id);
                }
              }}
              className={`cursor-pointer inline-flex items-center justify-center gap-1.5 h-8 sm:h-9 px-3 sm:px-3.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-colors shrink-0 select-none shadow-none ${
                isActive
                  ? 'bg-[#EEF0FB] text-[#4338CA] border-[#D8DCF5]'
                  : 'text-[#4E5668] hover:text-[#191E2B] border-[#DCE1EA] hover:bg-[#F0F2F6]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 -translate-y-[0.5px]" />
              <span className="leading-none flex items-center">{t(tab.label)}</span>
              {tab.id === 'UNREAD' && unreadCount > 0 && (
                <span className={`leading-none text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-[#4338CA] text-white' : 'bg-[#EEF0FB] text-[#4338CA]'
                }`}>
                  {unreadCount}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/**
       * Notifications Stream
       */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-[#FBFBFC] rounded-lg p-8 md:p-12 text-center border border-[#DCE1EA] flex justify-center shadow-none">
            <SwirlingLoader className="w-10 h-10 md:w-12 md:h-12 text-[#4338CA]" />
          </div>
        ) : isError ? (
          <div className="bg-[#FBFBFC] border border-[#F9D4D4] rounded-lg p-8 text-center text-[#B91C1C] shadow-none">
            <p className="font-semibold text-sm">{t('Failed to load notifications.')}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-[#FBFBFC] rounded-lg p-8 md:p-12 text-center border border-[#DCE1EA] shadow-none">
            <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 rounded-lg bg-[#F0F2F6] flex items-center justify-center border border-[#DCE1EA]">
              <Inbox className="w-7 h-7 md:w-8 md:h-8 text-[#757F94]" />
            </div>
            <p className="text-base md:text-lg text-[#191E2B] font-semibold mb-1">
              {activeTab === 'UNREAD' ? t('No unread notifications') : t('No notifications found')}
            </p>
            <p className="text-[#757F94] text-xs sm:text-sm font-medium">
              {activeTab === 'UNREAD'
                ? t("You're all caught up! New alerts will show up here.")
                : t('Activity alerts for your workspace will appear here.')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, index) => {
              const isUnread = !notification.isRead;
              return (
                <div
                  key={notification._id}
                  onClick={() => handleCardClick(notification)}
                  className={`group relative rounded-lg p-3.5 sm:p-5 border transition-all duration-200 shadow-none ${
                    notification.link || isUnread ? 'cursor-pointer' : 'cursor-default'
                  } ${
                    isUnread
                      ? 'border-[#D8DCF5] hover:border-[#4338CA]/40 bg-[#EEF0FB]/35'
                      : 'bg-white border-[#DCE1EA] hover:border-[#CBD5E1]'
                  }`}
                  style={{ animationDelay: `${index * 25}ms` }}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/**
                     * Type Icon
                     */}
                    <div className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-[#F0F2F6] flex items-center justify-center border border-[#DCE1EA]">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/**
                     * Notification Details
                     */}
                    <div className="flex-1 min-w-0">
                      {/**
                       * Header Row: Type Badge + Priority + Unread Pill + Time + Actions
                       */}
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span
                          className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${getBadgeStyle(
                            notification.type
                          )}`}
                        >
                          {getTypeLabel(notification.type)}
                        </span>

                        {notification.priority === 'URGENT' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FFF1F2] text-[#B91C1C] border border-[#FECDD3]">
                            {t('Urgent')}
                          </span>
                        )}
                        {notification.priority === 'HIGH' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                            {t('High Priority')}
                          </span>
                        )}

                        {isUnread && (
                          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-[#4338CA] bg-[#EEF0FB] px-1.5 py-0.5 rounded border border-[#D8DCF5]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4338CA] animate-pulse" />
                            {t('New')}
                          </span>
                        )}

                        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
                          <span className="text-[11px] sm:text-xs text-[#757F94] font-medium inline-flex items-center gap-1 whitespace-nowrap">
                            <Clock className="w-3 h-3 text-[#757F94] shrink-0" />
                            <span>{formatRelativeTime(notification.createdAt)}</span>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMutation.mutate(notification._id);
                            }}
                            className="cursor-pointer text-[#757F94] hover:text-[#B91C1C] p-1 rounded-md hover:bg-[#F0F2F6] transition-colors ml-1 shadow-none"
                            title={t('Dismiss')}
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>

                      {/**
                       * Title & Content
                       */}
                      <h3
                        className={`text-sm sm:text-[15px] font-semibold leading-snug mt-1.5 ${
                          isUnread ? 'text-[#191E2B]' : 'text-[#333D4F]'
                        }`}
                      >
                        {notification.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-[#4E5668] mt-1 leading-relaxed font-medium">
                        {sanitizeNotificationMessage(notification.message)}
                      </p>

                      {/**
                       * Entity Metadata Badges
                       */}
                      {notification.metadata && (notification.metadata.invoiceNumber || notification.metadata.amount != null || notification.metadata.paymentStatus) && (
                        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                          {notification.metadata.invoiceNumber && (
                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-[#F0F2F6] text-[#191E2B] border border-[#DCE1EA]">
                              #{notification.metadata.invoiceNumber}
                            </span>
                          )}
                          {notification.metadata.amount != null && (
                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                              ₹{notification.metadata.amount}
                            </span>
                          )}
                          {notification.metadata.paymentStatus && (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase border ${
                                notification.metadata.paymentStatus === 'PAID'
                                  ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
                                  : notification.metadata.paymentStatus === 'UNPAID'
                                  ? 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                                  : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                              }`}
                            >
                              {notification.metadata.paymentStatus}
                            </span>
                          )}
                        </div>
                      )}

                      {/**
                       * Action Button Strip (Perfect Icon + Text Alignment)
                       */}
                      {notification.link && (
                        <div className="mt-3.5 pt-3 border-t border-[#E8ECF2] flex items-center justify-between gap-2">
                          <span className="text-[11px] sm:text-xs text-[#757F94] font-medium hidden sm:inline">
                            {t('Click to open and manage in your workspace')}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCardClick(notification);
                            }}
                            className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#EEF0FB] text-[#4338CA] border border-[#D8DCF5] hover:bg-[#E0E4FA] active:scale-95 transition-all ml-auto sm:ml-0 shadow-none"
                          >
                            <span className="leading-none">{getActionLabel(notification)}</span>
                            <ArrowRight className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/**
             * Pagination Load More Trigger
             */}
            <LoadMoreButton
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
              currentCount={notifications.length}
              totalCount={totalCount}
              label={t('notifications')}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
