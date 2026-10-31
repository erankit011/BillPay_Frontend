import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  User,
  Settings,
  LogOut,
  Gem,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';
import NotificationsPopover from './NotificationsPopover';

/**
 * Sidebar Rail Collapse Icon
 * Minimalist geometric glyph indicating sidebar collapse state
 */
const SidebarRailIcon = ({ className = "w-4 h-4", strokeWidth = 1.75 }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="18" x="3" y="3" rx="3" />
    <path d="M9 3v18" />
  </svg>
);

/**
 * Top sticky navigation bar and header
 */
const Header = ({
  toggleSidebarCollapse,
  setMobileDrawerOpen,
  BreadcrumbIcon,
  breadcrumbTitle,
  onOpenSearch,
  onOpenLogout,
  user,
  isAdmin,
  hasProfileImage,
  profileImageError,
  setProfileImageError,
  getImageUrl,
  profileDropdownOpen,
  setProfileDropdownOpen,
  profileMenuRef,
  notificationCount,
  notifications,
  notificationOpen,
  onNotificationClick,
  onCloseNotifications,
  markAsRead,
  markAllAsRead,
  notificationMenuRef,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div
      className="sticky z-30 shrink-0 transition-all duration-150"
      style={{ top: 'var(--top-announcement-height, 0px)' }}
    >
      <header className="h-14 bg-white/95 backdrop-blur-md border-b border-[#DCD3E0]/70 flex items-center justify-between px-3 sm:px-6 shrink-0">
        {/**
         * Navigation Trigger & Breadcrumb Trail
         * Handles desktop rail toggle, mobile drawer trigger, and active page breadcrumbs
         */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          {/**
            * Desktop Rail Collapse Trigger
            * Toggles sidebar between expanded mode and compact rail view
            */}
          <button
            type="button"
            onClick={toggleSidebarCollapse}
            className="hidden lg:inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#585272] hover:text-[#3A3550] hover:bg-[#F4EFF3] transition-colors cursor-pointer shrink-0"
            title="Toggle sidebar (Ctrl+B)"
            aria-label="Toggle sidebar collapse"
          >
            <SidebarRailIcon className="w-[18px] h-[18px] text-[#585272]" strokeWidth={1.75} />
          </button>

          {/**
            * Mobile Menu Trigger
            * Opens responsive sliding navigation drawer on touch viewports
            */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="lg:hidden inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#585272] hover:text-[#3A3550] hover:bg-[#F4EFF3] transition-colors cursor-pointer shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-[#585272]" strokeWidth={1.75} />
          </button>

          <div className="hidden lg:block w-px h-4 bg-[#DCD3E0] shrink-0 mx-0.5" aria-hidden="true" />

          {/**
            * Contextual Breadcrumb Indicator
            * Displays active route icon and human-readable page name
            */}
          <div aria-label="Breadcrumb" className="flex items-center gap-2 min-w-0 select-none">
            <span className="inline-flex items-center justify-center text-[#585272] shrink-0">
              <BreadcrumbIcon className="w-4 h-4 text-[#585272]" strokeWidth={1.75} />
            </span>
            <span className="text-[#B7AFC9] text-xs font-normal select-none shrink-0" aria-hidden="true">
              /
            </span>
            <span className="text-[#3A3550] font-semibold text-sm truncate leading-none">
              {breadcrumbTitle}
            </span>
          </div>
        </div>

        {/**
         * Quick Actions Toolbar
         * Houses language switcher, command palette trigger, notifications, and profile menu
         */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <LanguageSwitcher variant="compact" />

          {/**
            * Spotlight Search Trigger
            * Opens global command palette search modal (Ctrl+K)
            */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center border border-transparent hover:border-[#DCD3E0] rounded-full text-[#585272] hover:text-[#3A3550] bg-transparent active:bg-[#F4EFF3] hover:bg-[#F4EFF3] transition-colors duration-150 cursor-pointer shrink-0"
            title="Quick Search (Ctrl+K)"
            aria-label="Quick search"
          >
            <Search className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-[#585272]" strokeWidth={1.75} />
          </button>

          {/**
            * Notifications Dropdown Trigger
            * Displays real-time tenant alerts and system announcements
            */}
          <NotificationsPopover
            notificationCount={notificationCount}
            notifications={notifications}
            isOpen={notificationOpen}
            onToggle={onNotificationClick}
            onClose={onCloseNotifications}
            markAsRead={markAsRead}
            markAllAsRead={markAllAsRead}
            menuRef={notificationMenuRef}
          />

          <div className="h-4 sm:h-5 w-px bg-[#DCD3E0] mx-1 sm:mx-1.5 self-center shrink-0" />

          {/**
            * Merchant Profile Menu Trigger
            * Shows merchant avatar with flyout menu for profile, billing, and logout
            */}
          <div className="relative flex items-center justify-center shrink-0" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full cursor-pointer transition-colors duration-150 shrink-0 ${
                hasProfileImage && !profileImageError
                  ? 'border border-[#DCD3E0] hover:border-[#B7AFC9] hover:ring-2 hover:ring-[#DCD3E0]/60 overflow-hidden'
                  : 'border border-transparent hover:border-[#DCD3E0] text-[#585272] hover:text-[#3A3550] bg-transparent active:bg-[#F4EFF3] hover:bg-[#F4EFF3]'
              }`}
              aria-label="User account menu"
              aria-expanded={profileDropdownOpen}
              title={user?.name || 'Account'}
            >
              {hasProfileImage && !profileImageError ? (
                <img
                  src={getImageUrl(user.profileImage)}
                  alt={user?.name || 'Profile'}
                  onError={() => setProfileImageError(true)}
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-[#585272]" strokeWidth={1.75} />
              )}
            </button>

            {/**
              * Profile Flyout Context Menu
              * Links to profile settings, subscription tier, and sign-out action
              */}
            {profileDropdownOpen && (
              <div className="absolute right-0 top-11 w-48 sm:w-52 bg-white border border-[#DCD3E0] shadow-xl shadow-[#3A3550]/5 rounded-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-[#DCD3E0]/70 mb-1 flex items-center gap-2.5">
                  {hasProfileImage && !profileImageError ? (
                    <img
                      src={getImageUrl(user.profileImage)}
                      alt={user?.name || 'Profile'}
                      className="w-8 h-8 rounded-full object-cover border border-[#DCD3E0] shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#DCD3E0] text-[#3A3550] flex items-center justify-center shrink-0 border border-[#DCD3E0]/60">
                      <User className="w-4 h-4 text-[#3A3550]" strokeWidth={1.75} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#3A3550] truncate">
                      {user?.name || (isAdmin ? 'Administrator' : 'Shopkeeper')}
                    </p>
                    <p className="text-[11px] text-[#8A82A6] truncate font-medium">
                      {user?.email || 'user@udharpay.com'}
                    </p>
                  </div>
                </div>

                {!isAdmin && (
                  <div className="p-1 mb-1">
                    <Link
                      to="/subscription"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 p-2 bg-[#3A3550] text-white hover:bg-[#585272] rounded-xl transition-colors group"
                    >
                      <Gem className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                      <div>
                        <p className="text-xs font-semibold leading-tight">{t('Upgrade Plan')}</p>
                        <p className="text-[10px] text-white/80 leading-tight mt-0.5">{t('Get extra benefits')}</p>
                      </div>
                    </Link>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-[#585272] hover:text-[#3A3550] hover:bg-[#F4EFF3] rounded-lg transition-colors cursor-pointer text-left"
                >
                  <User className="w-4 h-4 text-[#8A82A6] shrink-0" />
                  <span>{t('Account')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    navigate(isAdmin ? '/admin/settings' : '/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-[#585272] hover:text-[#3A3550] hover:bg-[#F4EFF3] rounded-lg transition-colors cursor-pointer text-left"
                >
                  <Settings className="w-4 h-4 text-[#8A82A6] shrink-0" />
                  <span>{t('Settings')}</span>
                </button>

                <div className="my-1 border-t border-[#DCD3E0]/70" />

                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onOpenLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{t('Log out')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default React.memo(Header);

