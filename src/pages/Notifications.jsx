/**
 * Merchant & Administrator Notifications Center Page
 * Paginated infinite-scroll activity feed of billing alerts, customer udhar events, stock warnings, and official broadcasts.
 */

import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Loader2, 
  AlertTriangle,
  Receipt,
  CreditCard,
  User,
  ShieldAlert,
  Headphones,
  Sparkles,
  Inbox,
  ArrowRight
} from 'lucide-react';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';
import LoadMoreButton from '../components/common/LoadMoreButton';
import SwirlingLoader from '../components/common/SwirlingLoader';
import { formatRelativeTime } from '../utils/dateUtils';
import toast from 'react-hot-toast';

/**
 * Filter Categories for Notification Feed
 */
const FILTER_TABS = [
  { id: 'ALL', label: 'All Alerts' },
  { id: 'UNREAD', label: 'Unread' },
  { id: 'ADMIN_NOTICE', label: 'Official Notices' },
  { id: 'BILL', label: 'Bills' },
  { id: 'PAYMENT', label: 'Payments' },
  { id: 'REMINDER', label: 'Reminders' },
  { id: 'CUSTOMER', label: 'Customers' },
  { id: 'LOW_STOCK', label: 'Stock Alerts' },
  { id: 'SUBSCRIPTION', label: 'Subscription' },
  { id: 'SUPPORT', label: 'Support' },
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

  const notifications = data?.pages?.flatMap((page) => page?.data || []) || [];
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
        return <Receipt className="w-5 h-5 text-[#4E5668]" />;
      case 'PAYMENT':
        return <CreditCard className="w-5 h-5 text-[#047857]" />;
      case 'CUSTOMER':
        return <User className="w-5 h-5 text-[#0369A1]" />;
      case 'SUBSCRIPTION':
        return <Sparkles className="w-5 h-5 text-[#7C3AED]" />;
      case 'SUPPORT':
        return <Headphones className="w-5 h-5 text-[#2563EB]" />;
      case 'REMINDER':
        return <Bell className="w-5 h-5 text-[#D97706]" />;
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

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 pb-24 lg:pb-0">
      {/**
       * Header Strip & Global Inbox Actions
       */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#191E2B] flex items-center gap-2">
            {t('Notifications Center')}
            {unreadCount > 0 && (
              <span className="bg-[#EEF0FB] text-[#4338CA] border border-[#D8DCF5] text-xs sm:text-sm font-semibold px-2.5 py-0.5 rounded-lg">
                {unreadCount} {t('unread')}
              </span>
            )}
          </h1>
          <p className="text-[#4E5668] text-xs sm:text-sm mt-1 sm:mt-1.5 font-medium">
            {totalCount} {t('total alerts and events')}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="cursor-pointer flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-[#4338CA] hover:bg-[#3730A3] text-white px-3.5 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm active:scale-95 transition-all disabled:opacity-50"
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
              className="cursor-pointer inline-flex items-center justify-center gap-1.5 bg-white hover:bg-[#F0F2F6] text-[#4E5668] hover:text-[#191E2B] border border-[#DCE1EA] px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm active:scale-95 transition-all disabled:opacity-50"
              title={t('Clear all read notifications')}
            >
              {clearReadMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{t('Clear Read')}</span>
            </button>
          )}
        </div>
      </div>

      {/**
       * Category Filter Bar (Horizontally scrollable on mobile)
       */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {FILTER_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`cursor-pointer flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap border transition-colors shrink-0 ${
                isActive
                  ? 'bg-[#EEF0FB] text-[#4338CA] border-[#D8DCF5]'
                  : 'text-[#4E5668] hover:text-[#191E2B] border-[#DCE1EA] bg-white hover:bg-[#F0F2F6]'
              }`}
            >
              <span>{t(tab.label)}</span>
              {tab.id === 'UNREAD' && unreadCount > 0 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-[#4338CA] text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/**
       * Notifications Stream
       */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-[#FBFBFC] rounded-xl p-8 md:p-12 text-center border border-[#DCE1EA] flex justify-center shadow-none">
            <SwirlingLoader className="w-10 h-10 md:w-12 md:h-12 text-[#4338CA]" />
          </div>
        ) : isError ? (
          <div className="bg-[#FBFBFC] border border-[#F9D4D4] rounded-xl p-8 text-center text-[#B91C1C]">
            <p className="font-semibold text-sm">{t('Failed to load notifications.')}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-[#FBFBFC] rounded-xl p-8 md:p-12 text-center border border-[#DCE1EA]">
            <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 rounded-xl bg-[#F0F2F6] flex items-center justify-center border border-[#DCE1EA]">
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
                  className={`group relative rounded-xl p-4 md:p-5 border transition-all duration-150 ${
                    notification.link ? 'cursor-pointer' : isUnread ? 'cursor-pointer' : 'cursor-default'
                  } ${
                    isUnread
                      ? 'border-[#D8DCF5] hover:border-[#4338CA]/40 bg-[#EEF0FB]/40'
                      : 'bg-white border-[#DCE1EA] hover:border-[#CBD5E1]'
                  }`}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/**
                     * Type Icon
                     */}
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-[#F0F2F6] flex items-center justify-center border border-[#DCE1EA]">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/**
                     * Notification Details
                     */}
                    <div className="flex-1 min-w-0 pr-8 sm:pr-12">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${getBadgeStyle(
                            notification.type
                          )}`}
                        >
                          {notification.type === 'ADMIN_NOTICE'
                            ? t('Official Notice')
                            : notification.type === 'LOW_STOCK'
                            ? t('Stock Warning')
                            : notification.type === 'BILL'
                            ? t('Bill')
                            : notification.type === 'PAYMENT'
                            ? t('Payment')
                            : notification.type === 'REMINDER'
                            ? t('Reminder')
                            : notification.type === 'CUSTOMER'
                            ? t('Customer')
                            : notification.type === 'SUBSCRIPTION'
                            ? t('Subscription')
                            : notification.type === 'SUPPORT'
                            ? t('Support')
                            : notification.type === 'SYSTEM'
                            ? t('System')
                            : notification.type}
                        </span>

                        {notification.priority === 'URGENT' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FDF2F2] text-[#B91C1C] border border-[#F9D4D4]">
                            {t('Urgent')}
                          </span>
                        )}
                        {notification.priority === 'HIGH' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                            {t('High Priority')}
                          </span>
                        )}

                        <span className="text-[11px] text-[#757F94] font-medium ml-auto">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>

                      <h3
                        className={`text-sm md:text-base font-semibold leading-snug mt-1 ${
                          isUnread ? 'text-[#191E2B]' : 'text-[#4E5668]'
                        }`}
                      >
                        {notification.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-[#4E5668] mt-1 leading-relaxed font-medium">
                        {sanitizeNotificationMessage(notification.message)}
                      </p>

                      {notification.metadata && (notification.metadata.invoiceNumber || notification.metadata.amount != null || notification.metadata.paymentStatus) && (
                        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                          {notification.metadata.invoiceNumber && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#F0F2F6] text-[#191E2B] border border-[#DCE1EA]">
                              #{notification.metadata.invoiceNumber}
                            </span>
                          )}
                          {notification.metadata.amount != null && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                              ₹{notification.metadata.amount}
                            </span>
                          )}
                          {notification.metadata.paymentStatus && (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase border ${
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

                      {notification.link && (
                        <div className="mt-3.5 pt-2.5 border-t border-[#E8ECF2] flex items-center justify-between">
                          <span className="text-[11px] text-[#757F94] font-medium hidden sm:inline">
                            {t('Click to open and manage')}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4338CA] group-hover:text-[#3730A3] transition-colors ml-auto sm:ml-0">
                            <span>{getActionLabel(notification)}</span>
                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                          </span>
                        </div>
                      )}
                    </div>

                    {/**
                     * Status indicator & Dismiss Action
                     */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5">
                      {isUnread && (
                        <span
                          className="w-2.5 h-2.5 rounded-full bg-[#4338CA] block"
                          title={t('Unread')}
                        />
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(notification._id);
                        }}
                        className="cursor-pointer text-[#757F94] hover:text-[#B91C1C] p-1 rounded hover:bg-[#F0F2F6] transition-colors"
                        title={t('Dismiss')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
