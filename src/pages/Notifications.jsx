import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';
import InfiniteScrollObserver from '../components/common/InfiniteScrollObserver';

const Notifications = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get(`/notifications?page=${pageParam}&limit=15`);
      return res.data.data;
    },
    getNextPageParam: (lastPage) => lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined,
    // Explicitly defining Garbage Collection and Caching to show how it works
    staleTime: 1 * 60 * 1000, // Data is fresh for 1 min
    gcTime: 5 * 60 * 1000,   // Garbage collect (delete from memory) if unused for 5 mins
  });

  const notifications = data?.pages?.flatMap(page => page.data || []) || [];

  const markReadMutation = useMutation({
    mutationFn: (notificationId) => api.patch(`/notifications/${notificationId}/read`),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries(['notifications']);
      const previousData = queryClient.getQueryData(['notifications']);
      
      queryClient.setQueryData(['notifications'], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            data: page.data.map(notif => 
              notif._id === notificationId ? { ...notif, isRead: true } : notif
            )
          }))
        };
      });
      return { previousData };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['notifications'], context.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unread-notifications']); // Assuming unread count query key is this
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/mark-all-read'),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unread-notifications']);
    }
  });

  const markAsRead = (notificationId) => {
    markReadMutation.mutate(notificationId);
  };

  const markAllAsRead = () => {
    markAllReadMutation.mutate();
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'PAYMENT': return '💰';
      case 'CUSTOMER': return '👤';
      case 'BILL': return '📄';
      case 'REMINDER': return '🔔';
      case 'UDHAR': return '💳';
      default: return '📢';
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 flex items-center gap-2">
            {t('All Notifications')}
            {unreadCount > 0 && (
              <span className="bg-[#093C5D]/10 text-[#093C5D] text-xs sm:text-sm font-semibold px-2.5 py-0.5 rounded-lg">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 font-medium">
            {data?.pages?.[0]?.totalCount || 0} {t('total notifications')}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={markAllReadMutation.isPending}
            className="cursor-pointer flex items-center justify-center gap-2 w-full sm:w-auto bg-[#093C5D] hover:bg-[#082a42] text-white px-4 sm:px-5 md:px-6 py-2 md:py-2.5 rounded-lg font-semibold text-xs md:text-sm active:scale-95 transition-all disabled:opacity-50"
          >
            {markAllReadMutation.isPending ? (
               <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
               <CheckCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
            {t('Mark all as read')}
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3 md:space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-xl p-8 md:p-10 lg:p-12 text-center border border-gray-200 flex justify-center">
            <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-[#093C5D] animate-spin" />
          </div>
        ) : isError ? (
           <div className="bg-white border border-gray-200 rounded-xl p-8 md:p-10 lg:p-12 text-center text-red-500">
            <p className="font-medium text-xs md:text-sm">{t('Failed to load notifications.')}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl p-8 md:p-10 lg:p-12 text-center border border-gray-200">
            <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 rounded-xl bg-[#F5F5F5] flex items-center justify-center border border-gray-200">
              <Bell className="w-7 h-7 md:w-8 md:h-8 text-gray-400" strokeWidth={2} />
            </div>
            <p className="text-base md:text-lg text-gray-900 font-semibold mb-1">{t('No notifications')}</p>
            <p className="text-gray-500 text-sm md:text-base font-medium">{t("You're all caught up!")}</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification, index) => (
              <div
                key={notification._id}
                onClick={() => !notification.isRead && markAsRead(notification._id)}
                className={`mb-3 md:mb-4 bg-white rounded-xl p-4 md:p-5 border transition-all duration-200 animate-fade-in ${
                  !notification.isRead 
                    ? 'cursor-pointer border-[#093C5D]/20 hover:border-[#093C5D]/40 bg-[#093C5D]/[0.02]' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="flex items-start gap-3 md:gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-lg md:text-xl border border-gray-200">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1 md:mb-1.5">
                      <h3 className={`text-sm md:text-base font-semibold leading-snug ${
                        !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.title}
                      </h3>
                      <div className="flex-shrink-0 mt-0.5">
                        {!notification.isRead ? (
                          <span className="w-2 h-2 md:w-2.5 md:h-2.5 bg-[#093C5D] rounded-full block"></span>
                        ) : (
                          <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-2 leading-relaxed font-medium line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 md:gap-3 text-[10px] sm:text-xs text-gray-400 font-semibold uppercase tracking-wide">
                      <span>{getTimeAgo(notification.createdAt)}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                      <span>{notification.type}</span>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
