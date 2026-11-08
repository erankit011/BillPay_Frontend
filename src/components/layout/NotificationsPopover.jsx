import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatRelativeTime } from '../../utils/dateUtils';

/**
 * Topbar Notification Bell & Dropdown Popover
 * Displays real-time alerts, unread counter badges, and quick-action links
 */
const NotificationsPopover = ({
  notificationCount = 0,
  notifications = [],
  isOpen,
  onToggle,
  onClose,
  onMarkAsRead,
  markAsRead,
  onMarkAllAsRead,
  markAllAsRead,
  menuRef,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleMarkAsRead = onMarkAsRead || markAsRead;
  const handleMarkAllAsRead = onMarkAllAsRead || markAllAsRead;

  const hasUnread = notifications.some((n) => !(n.isRead ?? n.read));

  const handleItemClick = (notif) => {
    const isUnread = !(notif.isRead ?? notif.read);
    if (isUnread && typeof handleMarkAsRead === 'function') {
      handleMarkAsRead(notif._id);
    }
    if (notif.link) {
      if (typeof onClose === 'function') onClose();
      navigate(notif.link);
    }
  };

  const sanitizeMessage = (msg) => {
    if (!msg) return '';
    return msg.replace(/₹undefined/g, '₹—').replace(/₹NaN/g, '₹0').replace(/undefined/g, '—');
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'ADMIN_NOTICE':
        return (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#EEF0FB] text-[#4338CA] border border-[#D8DCF5] shrink-0">
            {t('Official')}
          </span>
        );
      case 'LOW_STOCK':
        return (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] shrink-0">
            {t('Low Stock')}
          </span>
        );
      case 'SUBSCRIPTION':
        return (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] shrink-0">
            {t('Plan')}
          </span>
        );
      case 'SUPPORT':
        return (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#F5F3FF] text-[#6D28D9] border border-[#DDD6FE] shrink-0">
            {t('Support')}
          </span>
        );
      case 'BILL':
        return (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#F0F2F6] text-[#4E5668] border border-[#DCE1EA] shrink-0">
            {t('Bill')}
          </span>
        );
      case 'PAYMENT':
        return (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] shrink-0">
            {t('Payment')}
          </span>
        );
      case 'REMINDER':
        return (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] shrink-0">
            {t('Reminder')}
          </span>
        );
      case 'CUSTOMER':
        return (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#F0F9FF] text-[#0369A1] border border-[#BAE6FD] shrink-0">
            {t('Customer')}
          </span>
        );
      case 'SYSTEM':
        return (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] shrink-0">
            {t('System')}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative flex items-center justify-center" ref={menuRef}>
      {/**
       * Notification Bell Trigger
       * Interactive bell icon displaying unread counter badge
       */}
      <button
        type="button"
        onClick={onToggle}
        className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center border border-transparent hover:border-[#DCE1EA] rounded-full text-[#4E5668] hover:text-[#191E2B] bg-transparent active:bg-[#F0F2F6] hover:bg-[#F0F2F6] transition-colors duration-150 cursor-pointer shrink-0"
        title="Notifications"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-[#4E5668]" strokeWidth={1.75} />
        {notificationCount > 0 && (
          <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
        )}
      </button>

      {/**
       * Floating Notification Flyout
       * Interactive drawer listing latest tenant announcements and system notices
       */}
      {isOpen && (
        <div className="fixed sm:absolute right-4 sm:right-0 top-14 sm:top-11 w-[calc(100vw-2rem)] sm:w-96 bg-[#FBFBFC] border border-[#DCE1EA] shadow-none rounded-2xl p-0 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-4 border-b border-[#E8ECF2] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-[#191E2B]">{t('Notifications')}</h4>
              {notificationCount > 0 && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#EEF0FB] text-[#4338CA] border border-[#D8DCF5]">
                  {notificationCount} {t('new')}
                </span>
              )}
            </div>
            {hasUnread && typeof handleMarkAllAsRead === 'function' && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs font-semibold text-[#4338CA] hover:text-[#3730A3] hover:underline cursor-pointer flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {t('Mark all read')}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-[#757F94] text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="font-medium">{t('No new notifications')}</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !(notif.isRead ?? notif.read);
                return (
                  <div
                    key={notif._id}
                    onClick={() => handleItemClick(notif)}
                    className={`p-3.5 hover:bg-[#F0F2F6] transition-colors cursor-pointer ${
                      isUnread ? 'bg-[#EEF0FB]/60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {getTypeBadge(notif.type)}
                        <p className="text-xs font-semibold text-[#191E2B] truncate">{notif.title}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-[#4338CA] shrink-0 mt-1" />
                        )}
                        {notif.link && (
                          <ArrowRight className="w-3 h-3 text-[#757F94] hover:text-[#4338CA] transition-transform" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-[#4E5668] mt-0.5 line-clamp-2">{sanitizeMessage(notif.message)}</p>
                    {notif.createdAt && (
                      <p className="text-[10px] text-[#757F94] mt-1 font-medium">
                        {formatRelativeTime(notif.createdAt, t)}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="p-2.5 border-t border-[#E8ECF2] bg-[#F0F2F6] text-center">
            <Link
              to="/notifications"
              onClick={onClose}
              className="text-xs font-semibold text-[#4338CA] hover:text-[#3730A3] hover:underline inline-flex items-center gap-1"
            >
              <span>{t('View all notifications')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(NotificationsPopover);
