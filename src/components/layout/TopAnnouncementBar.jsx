import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

const DISMISSED_BROADCASTS_KEY = 'udharpay_dismissed_broadcasts';

const TopAnnouncementBar = () => {
  const { user } = useSelector((state) => state.auth);

  const [dismissedBroadcasts, setDismissedBroadcasts] = useState(() => {
    try {
      const stored = localStorage.getItem(DISMISSED_BROADCASTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [dismissedNoticeIds, setDismissedNoticeIds] = useState([]);
  const [maintenanceDismissed, setMaintenanceDismissed] = useState(false);

  // 1. Fetch Active Global Broadcasts
  const { data: broadcasts = [] } = useQuery({
    queryKey: ['activeBroadcasts'],
    queryFn: getActiveBroadcasts,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // 2. Fetch Platform Settings (for maintenance mode)
  const { data: platformSettings } = useQuery({
    queryKey: ['supportContactInfo'],
    queryFn: async () => {
      const res = await api.get('/support/contact-info');
      return res.data?.data;
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // 3. Fetch Direct Store Notices (only for shopkeepers, not admin)
  const isShopkeeper = Boolean(user && user.role !== 'admin');
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

  // Determine the single highest-priority banner to show
  const activeBanner = useMemo(() => {
    // Priority 1: Maintenance Mode (Critical — non-dismissible by default)
    if (platformSettings?.isMaintenanceMode && !maintenanceDismissed) {
      return {
        id: 'maintenance-mode-alert',
        title: 'Platform Maintenance',
        message:
          platformSettings.maintenanceMessage ||
          'Scheduled maintenance is underway. Some features may be temporarily unavailable.',
        tag: 'Maintenance',
        bg: 'bg-rose-600',
        textColor: 'text-white',
        icon: AlertTriangle,
        actionUrl: null,
        actionLabel: null,
        dismissible: true,
        onDismiss: () => setMaintenanceDismissed(true),
      };
    }

    // Priority 2: Direct Official Store Notice
    const validNotice = directNotices.find(
      (n) => !dismissedNoticeIds.includes(n._id)
    );
    if (validNotice) {
      const isUrgent = validNotice.priority === 'URGENT';
      return {
        id: `notice-${validNotice._id}`,
        title: validNotice.title,
        message: validNotice.message,
        tag: isUrgent ? 'Urgent Notice' : 'Official Notice',
        bg: isUrgent ? 'bg-rose-600' : 'bg-[#093C5D]',
        textColor: 'text-white',
        icon: BellRing,
        actionUrl: '/notifications',
        actionLabel: 'View',
        dismissible: true,
        onDismiss: () =>
          setDismissedNoticeIds((prev) => [...prev, validNotice._id]),
      };
    }

    // Priority 3: Active Global Broadcast
    const validBroadcast = broadcasts.find(
      (b) =>
        b &&
        b._id &&
        (b.dismissible === false || !dismissedBroadcasts.includes(b._id))
    );
    if (validBroadcast) {
      let bg = 'bg-[#093C5D]';
      let icon = Megaphone;

      if (validBroadcast.type === 'ALERT') {
        bg = 'bg-rose-600';
        icon = AlertCircle;
      } else if (validBroadcast.type === 'WARNING') {
        bg = 'bg-amber-600';
        icon = AlertTriangle;
      } else if (validBroadcast.type === 'SUCCESS') {
        bg = 'bg-emerald-700';
        icon = CheckCircle2;
      } else if (validBroadcast.type === 'INFO') {
        bg = 'bg-[#093C5D]';
        icon = Info;
      }

      const tag =
        validBroadcast.targetAudience && validBroadcast.targetAudience !== 'ALL'
          ? validBroadcast.targetAudience.replace('_', ' ')
          : 'Announcement';

      return {
        id: `broadcast-${validBroadcast._id}`,
        title: validBroadcast.title,
        message: validBroadcast.message,
        tag,
        bg,
        textColor: 'text-white',
        icon,
        actionUrl: validBroadcast.actionUrl || null,
        actionLabel: validBroadcast.actionLabel || 'Details',
        dismissible: validBroadcast.dismissible !== false,
        onDismiss: () => {
          const next = [...dismissedBroadcasts, validBroadcast._id];
          setDismissedBroadcasts(next);
          try {
            localStorage.setItem(
              DISMISSED_BROADCASTS_KEY,
              JSON.stringify(next)
            );
          } catch {
            // safe fallback
          }
        },
      };
    }

    return null;
  }, [
    platformSettings,
    maintenanceDismissed,
    directNotices,
    dismissedNoticeIds,
    broadcasts,
    dismissedBroadcasts,
  ]);

  if (!activeBanner) return null;

  const BannerIcon = activeBanner.icon;
  const isExternal = activeBanner.actionUrl?.startsWith('http');

  return (
    <div
      role="banner"
      className={`w-full flex items-center justify-between gap-2 px-3 sm:px-4 shrink-0 ${activeBanner.bg} ${activeBanner.textColor}`}
      style={{ minHeight: '36px', maxHeight: '36px' }}
    >
      {/* Left: Icon + Tag + 1-Line Message (strictly no wrapping) */}
      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
        {/* Icon */}
        <BannerIcon className="w-3.5 h-3.5 shrink-0 opacity-90" strokeWidth={2} />

        {/* Category Tag Badge */}
        <span className="shrink-0 hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/20 leading-none whitespace-nowrap">
          {activeBanner.tag}
        </span>

        {/* 1-Line Truncated Title + Separator + Message */}
        <p className="text-xs font-medium truncate whitespace-nowrap leading-none flex-1 min-w-0">
          <span className="font-semibold">{activeBanner.title}</span>
          <span className="opacity-60 mx-1.5">—</span>
          <span className="opacity-90">{activeBanner.message}</span>
        </p>

        {/* Optional CTA Link (hidden on xs, shown on sm+) */}
        {activeBanner.actionUrl && (
          <span className="shrink-0 hidden sm:inline-flex items-center">
            {isExternal ? (
              <a
                href={activeBanner.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-xs font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity whitespace-nowrap"
              >
                {activeBanner.actionLabel}
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <Link
                to={activeBanner.actionUrl}
                className="inline-flex items-center gap-0.5 text-xs font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity whitespace-nowrap"
              >
                {activeBanner.actionLabel}
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </span>
        )}
      </div>

      {/* Right: Dismiss Button */}
      {activeBanner.dismissible && activeBanner.onDismiss && (
        <button
          type="button"
          onClick={activeBanner.onDismiss}
          aria-label="Dismiss"
          className="shrink-0 p-1 -mr-1 rounded hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default TopAnnouncementBar;
