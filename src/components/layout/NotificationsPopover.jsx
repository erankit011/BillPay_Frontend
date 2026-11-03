import React from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Topbar Notification Bell & Dropdown Popover
 */
const NotificationsPopover = ({
  notificationCount = 0,
  notifications = [],
  isOpen,
  onToggle,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  menuRef,
}) => {
  const { t } = useTranslation();

  return (
    <div className="relative flex items-center justify-center" ref={menuRef}>
      {/**
       * Notification Bell Trigger
       * Interactive bell icon displaying unread counter badge
       */}
      <button
        type="button"
        onClick={onToggle}
        className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center border border-transparent hover:border-[#DCD6F7] rounded-full text-[#5B618A] hover:text-[#424874] bg-transparent active:bg-[#F4EEFF] hover:bg-[#F4EEFF] transition-colors duration-150 cursor-pointer shrink-0"
        title="Notifications"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-[#5B618A]" strokeWidth={1.75} />
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
        <div className="fixed sm:absolute right-4 sm:right-0 top-14 sm:top-11 w-[calc(100vw-2rem)] sm:w-96 bg-white border border-[#DCD6F7] shadow-none rounded-2xl p-0 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-4 border-b border-[#DCD6F7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-[#424874]">{t('Notifications')}</h4>
              {notificationCount > 0 && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F4EEFF] text-[#424874] border border-[#DCD6F7]">
                  {notificationCount} {t('new')}
                </span>
              )}
            </div>
            {notifications.some((n) => !n.read) && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="text-xs font-semibold text-[#424874] hover:text-[#323759] hover:underline cursor-pointer"
              >
                {t('Mark all read')}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#DCD6F7]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-[#8F99C5] text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="font-medium">{t('No new notifications')}</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => !notif.read && onMarkAsRead(notif._id)}
                  className={`p-3.5 hover:bg-[#F4EEFF] transition-colors cursor-pointer ${
                    !notif.read ? 'bg-[#F4EEFF]/60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {notif.type === 'ADMIN_NOTICE' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F4EEFF] text-[#424874] border border-[#DCD6F7] shrink-0">
                          Official
                        </span>
                      )}
                      <p className="text-xs font-semibold text-[#424874] truncate">{notif.title}</p>
                    </div>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-[#424874] shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-[#5B618A] mt-0.5 line-clamp-2">{notif.message}</p>
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 border-t border-[#DCD6F7] bg-[#F4EEFF]/50 text-center">
            <Link
              to="/notifications"
              onClick={onClose}
              className="text-xs font-semibold text-[#424874] hover:text-[#323759] hover:underline"
            >
              {t('View all notifications →')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(NotificationsPopover);

