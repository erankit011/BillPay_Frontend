/**
 * Top Announcement & Maintenance Alert Bar
 * Displays high-priority administrative broadcasts, scheduled maintenance notices,
 * and critical store alerts with dismissal caching and dynamic height adjustment.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
  AlertTriangle,
  BellRing,
  Megaphone,
  Info,
  AlertCircle,
  CheckCircle2,
  X,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import api from '../../api/axios';
import { getActiveBroadcasts } from '../../features/admin/api/adminApi';
import { ROLES } from '../../constants/roles';

const DISMISSED_BROADCASTS_KEY = 'udharpay_dismissed_broadcasts';
const DISMISSED_NOTICES_KEY = 'udharpay_dismissed_notices';
const DISMISSED_MAINTENANCE_KEY = 'udharpay_dismissed_maintenance';
const BANNER_HEIGHT_PX = 42;

/**
 * Intelligent Theme Resolver
 * Determines background color, badge tag, icon, and mobile theme-color
 * based on message content, urgency level, category, and priority.
 * 
 * @param {'maintenance' | 'notice' | 'broadcast'} category Broadcast category
 * @param {'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS'} type Urgency type
 * @param {'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'} priority Dispatch priority
 */
const resolveBannerTheme = ({
  category = 'broadcast',
  type = 'INFO',
  priority = 'NORMAL',
  title = '',
  message = '',
}) => {
  const combined = `${title} ${message}`.toLowerCase();

  /**
   * System Maintenance Category
   * Visual palette for scheduled or urgent infrastructure maintenance
   */
  if (category === 'maintenance') {
    const isCritical =
      type === 'ALERT' ||
      combined.includes('urgent') ||
      combined.includes('critical') ||
      combined.includes('emergency') ||
      combined.includes('lockdown');

    return {
      bg: isCritical ? 'bg-rose-700' : 'bg-amber-600',
      tag: 'MAINTENANCE',
      icon: AlertTriangle,
      themeColor: isCritical ? '#be123c' : '#d97706',
    };
  }

  /**
   * Urgent & Critical Alert Category
   * High-contrast crimson styling for immediate security or service notices
   */
  if (
    type === 'ALERT' ||
    priority === 'URGENT' ||
    combined.includes('urgent') ||
    combined.includes('critical') ||
    combined.includes('danger') ||
    combined.includes('security risk') ||
    combined.includes('suspicious') ||
    combined.includes('immediate action') ||
    combined.includes('suspended')
  ) {
    return {
      bg: 'bg-rose-700',
      tag: priority === 'URGENT' ? 'URGENT ALERT' : (category === 'notice' ? 'OFFICIAL ALERT' : 'CRITICAL ALERT'),
      icon: AlertCircle,
      themeColor: '#be123c',
    };
  }

  /**
   * High-Priority Warning Category
   * Amber palette for expiring plans, quota limits, or required merchant actions
   */
  if (
    type === 'WARNING' ||
    priority === 'HIGH' ||
    combined.includes('maintenance') ||
    combined.includes('warning') ||
    combined.includes('attention') ||
    combined.includes('action required') ||
    combined.includes('ending soon') ||
    combined.includes('expires') ||
    combined.includes('expiring') ||
    combined.includes('due soon') ||
    combined.includes('trial ending')
  ) {
    return {
      bg: 'bg-amber-600',
      tag: combined.includes('maintenance')
        ? 'MAINTENANCE'
        : (priority === 'HIGH' ? 'HIGH PRIORITY' : 'WARNING'),
      icon: AlertTriangle,
      themeColor: '#d97706',
    };
  }

  /**
   * Promotional & Feature Announcement Category
   * Emerald branding for new product releases and platform offers
   */
  if (
    type === 'SUCCESS' ||
    combined.includes('new feature') ||
    combined.includes('offer') ||
    combined.includes('discount') ||
    combined.includes('upgrade offer') ||
    combined.includes('congrat') ||
    combined.includes('launch') ||
    combined.includes('live now')
  ) {
    return {
      bg: 'bg-emerald-600',
      tag: combined.includes('offer') || combined.includes('discount') ? 'SPECIAL OFFER' : 'NEW FEATURE',
      icon: CheckCircle2,
      themeColor: '#059669',
    };
  }

  /**
   * Standard Informational Category
   * Default platform indigo theme for administrative announcements
   */
  return {
    bg: 'bg-[#3A3550]',
    tag: category === 'notice' ? 'OFFICIAL NOTICE' : (category === 'broadcast' ? 'ANNOUNCEMENT' : 'INFO'),
    icon: category === 'notice' ? BellRing : Megaphone,
    themeColor: '#3A3550',
  };
};

const TopAnnouncementBar = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  /**
   * Administrative Route Exclusion Guard
   * Restricts announcement bar exclusively to merchant viewports
   */
  const isAdmin =
    user?.role === ROLES.ADMIN ||
    user?.role === 'admin' ||
    location.pathname.startsWith('/admin');

  /**
   * Dismissed Cache Hydration
   * Restores locally silenced broadcast and notice IDs from client storage
   */
  const [dismissedBroadcasts, setDismissedBroadcasts] = useState(() => {
    try {
      const stored = localStorage.getItem(DISMISSED_BROADCASTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [dismissedNoticeIds, setDismissedNoticeIds] = useState(() => {
    try {
      const stored = localStorage.getItem(DISMISSED_NOTICES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [maintenanceDismissed, setMaintenanceDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISSED_MAINTENANCE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  /**
   * Global Broadcasts Fetch Query
   * Loads active platform announcements for merchant accounts
   */
  const { data: broadcasts = [] } = useQuery({
    queryKey: ['activeBroadcasts'],
    queryFn: getActiveBroadcasts,
    enabled: !isAdmin,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  /**
   * Maintenance Status Fetch Query
   * Inspects platform health indicators and maintenance scheduling
   */
  const { data: platformSettings } = useQuery({
    queryKey: ['supportContactInfo'],
    queryFn: async () => {
      const res = await api.get('/support/contact-info');
      return res.data?.data;
    },
    enabled: !isAdmin,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  /**
   * Direct Store Notices Fetch Query
   * Retrieves targeted official administrative notices for storekeeper
   */
  const isShopkeeper = Boolean(user && user.role === ROLES.SHOPKEEPER && !isAdmin);
  const { data: directNotices = [] } = useQuery({
    queryKey: ['directOfficialNotices'],
    queryFn: async () => {
      const res = await api.get('/notifications?limit=10');
      const items = res.data?.data?.data || res.data?.data || [];
      return items.filter((n) => n.type === 'ADMIN_NOTICE' && !n.isRead);
    },
    enabled: isShopkeeper,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  /**
   * Highest-Priority Announcement Resolver
   * Resolves active banner by hierarchy: Maintenance > Direct Notice > Global Broadcast
   */
  const activeBanner = useMemo(() => {
    if (isAdmin) return null;

    /**
     * Priority Level 1: Platform Maintenance Alert
     */
    if (platformSettings?.isMaintenanceMode && !maintenanceDismissed) {
      const title = 'Platform Maintenance';
      const message =
        platformSettings.maintenanceMessage ||
        'Scheduled maintenance is underway. Some features may be temporarily unavailable.';

      const theme = resolveBannerTheme({
        category: 'maintenance',
        title,
        message,
      });

      return {
        id: 'maintenance-mode-active',
        title,
        message,
        tag: theme.tag,
        bg: theme.bg,
        themeColor: theme.themeColor,
        icon: theme.icon,
        actionUrl: null,
        actionLabel: null,
        onDismiss: () => {
          setMaintenanceDismissed(true);
          try {
            sessionStorage.setItem(DISMISSED_MAINTENANCE_KEY, 'true');
          } catch {
            /**
             * Storage Access Fallback
             */
          }
        },
      };
    }

    /**
     * Priority Level 2: Targeted Storekeeper Direct Notice
     */
    const validNotice = directNotices.find(
      (n) => n && n._id && !dismissedNoticeIds.includes(n._id)
    );
    if (validNotice) {
      const theme = resolveBannerTheme({
        category: 'notice',
        priority: validNotice.priority || 'NORMAL',
        title: validNotice.title,
        message: validNotice.message,
      });

      return {
        id: `notice-${validNotice._id}`,
        title: validNotice.title,
        message: validNotice.message,
        tag: theme.tag,
        bg: theme.bg,
        themeColor: theme.themeColor,
        icon: theme.icon,
        actionUrl: '/notifications',
        actionLabel: 'View',
        onDismiss: () => {
          const next = [...dismissedNoticeIds, validNotice._id];
          setDismissedNoticeIds(next);
          try {
            localStorage.setItem(DISMISSED_NOTICES_KEY, JSON.stringify(next));
          } catch {
            /**
             * Storage Access Fallback
             */
          }
          api.patch(`/notifications/${validNotice._id}/read`).catch(() => {});
        },
      };
    }

    /**
     * Priority Level 3: Platform-Wide Global Broadcast
     */
    const validBroadcast = broadcasts.find(
      (b) =>
        b &&
        b._id &&
        b._id !== 'platform-maintenance-active' &&
        (b.dismissible === false || !dismissedBroadcasts.includes(b._id))
    );

    if (validBroadcast) {
      const theme = resolveBannerTheme({
        category: 'broadcast',
        type: validBroadcast.type || 'INFO',
        title: validBroadcast.title,
        message: validBroadcast.message,
      });

      let finalTag = theme.tag;
      if (validBroadcast.targetAudience && validBroadcast.targetAudience !== 'ALL') {
        finalTag = validBroadcast.targetAudience.replace('_', ' ');
      }

      const isDismissible = validBroadcast.dismissible !== false;

      return {
        id: `broadcast-${validBroadcast._id}`,
        title: validBroadcast.title,
        message: validBroadcast.message,
        tag: finalTag,
        bg: theme.bg,
        themeColor: theme.themeColor,
        icon: theme.icon,
        actionUrl: validBroadcast.actionUrl || null,
        actionLabel: validBroadcast.actionLabel || 'Details',
        onDismiss: isDismissible
          ? () => {
              const next = [...dismissedBroadcasts, validBroadcast._id];
              setDismissedBroadcasts(next);
              try {
                localStorage.setItem(DISMISSED_BROADCASTS_KEY, JSON.stringify(next));
              } catch {
                /**
                 * Storage Access Fallback
                 */
              }
            }
          : null,
      };
    }

    return null;
  }, [
    isAdmin,
    platformSettings,
    maintenanceDismissed,
    directNotices,
    dismissedNoticeIds,
    broadcasts,
    dismissedBroadcasts,
  ]);

  /**
   * Status Bar & Viewport CSS Sync
   * Updates CSS variables and mobile theme meta tags dynamically
   */
  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (activeBanner && !isAdmin) {
      document.documentElement.style.setProperty(
        '--top-announcement-height',
        `${BANNER_HEIGHT_PX}px`
      );
      if (metaThemeColor && activeBanner.themeColor) {
        metaThemeColor.setAttribute('content', activeBanner.themeColor);
      }
    } else {
      document.documentElement.style.setProperty(
        '--top-announcement-height',
        '0px'
      );
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#3A3550');
      }
    }

    return () => {
      document.documentElement.style.setProperty(
        '--top-announcement-height',
        '0px'
      );
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#3A3550');
      }
    };
  }, [activeBanner, isAdmin]);

  if (isAdmin || !activeBanner) return null;

  const BannerIcon = activeBanner.icon;
  const isExternal = activeBanner.actionUrl?.startsWith('http');

  return (
    <div
      role="banner"
      className={`w-full shrink-0 sticky top-0 z-50 flex items-center justify-center px-3 sm:px-6 border-t-0 border-b border-white/20 shadow-none ${activeBanner.bg} text-white font-sans`}
      style={{
        height: `${BANNER_HEIGHT_PX}px`,
        minHeight: `${BANNER_HEIGHT_PX}px`,
        maxHeight: `${BANNER_HEIGHT_PX}px`,
      }}
    >
      {/**
       * Banner Content Wrapper
       * Displays categorized tag pill, message string, and call-to-action
       */}
      <div className="flex items-center justify-center gap-2 sm:gap-2.5 max-w-full min-w-0">
        {/**
         * Category Indicator Tag
         * Visual uppercase pill emphasizing announcement severity
         */}
        <span className="shrink-0 hidden sm:inline-flex items-center justify-center gap-1.5 h-7 px-2.5 rounded bg-white/15 text-white border border-white/20 text-[11px] sm:text-xs font-medium select-none whitespace-nowrap shadow-none leading-none">
          <BannerIcon className="w-3.5 h-3.5 shrink-0 text-white" strokeWidth={1.8} />
          <span className="leading-none uppercase tracking-wider">{activeBanner.tag}</span>
        </span>

        {/**
         * Announcement Message Body
         * Single-line headline with safety padding to prevent typography clipping
         */}
        <p className="text-xs sm:text-[13px] font-medium truncate whitespace-nowrap leading-normal py-0.5 min-w-0 text-white/95">
          <span className="font-semibold text-white">{activeBanner.title}</span>
          <span className="opacity-40 mx-2 select-none">—</span>
          <span className="opacity-90 font-medium">{activeBanner.message}</span>
        </p>

        {/**
         * Contextual Action Button
         * Optional CTA directing merchant to external URL or internal route
         */}
        {activeBanner.actionUrl && (
          <span className="shrink-0 inline-flex items-center">
            {isExternal ? (
              <a
                href={activeBanner.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer h-7 px-2 sm:px-2.5 text-white font-medium bg-white/15 border border-white/20 hover:bg-white/25 active:scale-95 rounded inline-flex items-center justify-center gap-1.5 transition-all text-[11px] sm:text-xs whitespace-nowrap shadow-none leading-none"
              >
                <span className="leading-none uppercase tracking-wider">{activeBanner.actionLabel}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} />
              </a>
            ) : (
              <Link
                to={activeBanner.actionUrl}
                className="cursor-pointer h-7 px-2 sm:px-2.5 text-white font-medium bg-white/15 border border-white/20 hover:bg-white/25 active:scale-95 rounded inline-flex items-center justify-center gap-1.5 transition-all text-[11px] sm:text-xs whitespace-nowrap shadow-none leading-none"
              >
                <span className="leading-none uppercase tracking-wider">{activeBanner.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} />
              </Link>
            )}
          </span>
        )}

        {/**
         * Dismissal Action Button
         * Silences active announcement for remainder of user session
         */}
        {activeBanner.onDismiss && (
          <button
            type="button"
            onClick={activeBanner.onDismiss}
            aria-label="Dismiss announcement"
            className="cursor-pointer h-7 px-2 sm:px-2.5 text-white font-medium bg-white/15 border border-white/20 hover:bg-white/25 active:scale-95 rounded inline-flex items-center justify-center gap-1.5 transition-all text-[11px] sm:text-xs whitespace-nowrap shadow-none shrink-0 leading-none ml-1"
            title="Dismiss announcement"
          >
            <X className="w-3.5 h-3.5 shrink-0 text-white" strokeWidth={1.8} />
            <span className="hidden sm:inline leading-none uppercase tracking-wider font-semibold">CLOSE</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default TopAnnouncementBar;
