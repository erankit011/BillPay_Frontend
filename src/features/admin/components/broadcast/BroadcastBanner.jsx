/**
 * Interactive Broadcast Message Alert Banner
 * Renders categorized dismissible announcement cards with action CTAs and external link navigation.
 */

import React from 'react';
import { Info, AlertTriangle, AlertCircle, CheckCircle2, X, ExternalLink, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Broadcast Type Visual Styles
 */
const TYPE_CONFIG = {
  INFO: {
    bg: 'bg-blue-50/90',
    border: 'border-blue-200',
    text: 'text-blue-900',
    iconColor: 'text-[#093C5D]',
    badgeBg: 'bg-blue-100 text-[#093C5D]',
    icon: Info,
    buttonClass: 'bg-[#093C5D] text-white hover:bg-[#072d46]',
  },
  WARNING: {
    bg: 'bg-amber-50/95',
    border: 'border-amber-300',
    text: 'text-amber-950',
    iconColor: 'text-amber-700',
    badgeBg: 'bg-amber-100 text-amber-900',
    icon: AlertTriangle,
    buttonClass: 'bg-amber-700 text-white hover:bg-amber-800',
  },
  ALERT: {
    bg: 'bg-rose-50/95',
    border: 'border-rose-300',
    text: 'text-rose-950',
    iconColor: 'text-rose-700',
    badgeBg: 'bg-rose-100 text-rose-900',
    icon: AlertCircle,
    buttonClass: 'bg-rose-700 text-white hover:bg-rose-800',
  },
  SUCCESS: {
    bg: 'bg-emerald-50/95',
    border: 'border-emerald-300',
    text: 'text-emerald-950',
    iconColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-100 text-emerald-900',
    icon: CheckCircle2,
    buttonClass: 'bg-emerald-700 text-white hover:bg-emerald-800',
  },
};

const BroadcastBanner = ({ broadcast, onDismiss, isPreview = false }) => {
  if (!broadcast) return null;

  const config = TYPE_CONFIG[broadcast.type] || TYPE_CONFIG.INFO;
  const Icon = config.icon;

  const isExternal = broadcast.actionUrl?.startsWith('http');

  return (
    <div
      role="alert"
      className={`relative w-full rounded-lg border p-3.5 sm:p-4 transition-all shadow-none ${config.bg} ${config.border} ${config.text}`}
    >
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        {/**
         * Announcement Content Column
         * Icon, announcement title, audience badges, and message description.
         */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="shrink-0 mt-0.5">
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs sm:text-sm font-semibold tracking-tight">
                {broadcast.title || 'Announcement Title'}
              </span>

              {broadcast.targetAudience && broadcast.targetAudience !== 'ALL' && (
                <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded border border-transparent ${config.badgeBg}`}>
                  {broadcast.targetAudience.replace('_', ' ')}
                </span>
              )}

              {isPreview && (
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">
                  Preview
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm leading-relaxed opacity-90 break-words font-medium">
              {broadcast.message || 'Announcement message content will appear here...'}
            </p>

            {/**
             * Call-to-Action Link Button
             * Renders external link anchor or internal React router navigation button.
             */}
            {broadcast.actionUrl && (
              <div className="mt-2.5">
                {isExternal ? (
                  <a
                    href={broadcast.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all active:scale-95 shadow-none ${config.buttonClass}`}
                  >
                    <span>{broadcast.actionLabel || 'Learn More'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <Link
                    to={broadcast.actionUrl}
                    className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all active:scale-95 shadow-none ${config.buttonClass}`}
                  >
                    <span>{broadcast.actionLabel || 'View Details'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/**
         * Dismiss Announcement Action
         * Dismisses broadcast banner when configured as dismissible by administrator.
         */}
        {broadcast.dismissible && onDismiss && !isPreview && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss announcement"
            className="shrink-0 p-1 rounded opacity-60 hover:opacity-100 hover:bg-black/5 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default BroadcastBanner;
