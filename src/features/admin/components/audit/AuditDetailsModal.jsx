/**
 * Administrative Audit Log Event Inspection Modal
 * Presents deep metadata inspection, IP address, user agent, target resource IDs, and JSON state diffs.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  User,
  Target,
  Globe,
  Clock,
  Copy,
  Check,
  FileCode,
  Laptop,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '../../../../utils/dateUtils';
import AuditCategoryBadge from './AuditCategoryBadge';

/**
 * Format Audit Action Name
 */
const formatActionName = (action) => {
  if (!action) return 'Unknown Action';
  return action
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const AuditDetailsModal = ({ isOpen, log, onClose }) => {
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  /**
   * Scroll & Touch Prevention Hook
   * Disables document scrolling and touch actions while modal dialog is open.
   */
  useEffect(() => {
    if (!isOpen) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, [isOpen]);

  if (!isOpen || !log) return null;

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(typeof text === 'object' ? JSON.stringify(text, null, 2) : String(text));
    setCopiedKey(key);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formattedDate = formatDate(log.createdAt) || 'N/A';

  return (
    <div className="fixed inset-0 z-50 overscroll-contain">
      {/**
       * Backdrop Overlay
       * Darkened modal background overlay closing the view on backdrop click.
       */}
      <div
        className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay overscroll-contain"
        onClick={onClose}
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/**
       * Modal Viewport Container
       * Positions bottom sheet on mobile screens and centered modal on desktop.
       */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-center sm:justify-center sm:px-4 sm:py-8 z-50 pointer-events-none">
        <div
          className="relative w-full sm:max-w-3xl bg-white rounded-t-2xl sm:rounded-xl border border-gray-200 animate-modal-content overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] pointer-events-auto shadow-2xl sm:shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/**
           * Mobile Drag Handle
           * Visual drag pill handle displayed on mobile touch screens.
           */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0 bg-gray-50/70">
            <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
          </div>

          {/**
           * Audit Log Header
           * Displays security icon, formatted action name, category badge, and log ID.
           */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-200 bg-gray-50/70 flex-shrink-0 gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded bg-[#093C5D]/10 border border-[#093C5D]/20 text-[#093C5D] flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-snug truncate">
                    {formatActionName(log.action)}
                  </h3>
                  <AuditCategoryBadge category={log.actionCategory} size="xs" />
                </div>
                <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">
                  Audit ID: {log._id}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px] border border-gray-200 ml-auto"
              title="Close"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/**
           * Audit Details Body
           * Scrollable container detailing actor, target, network, and payload data.
           */}
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/**
             * Actor & Target Entity Grid
             * Paired metadata cards highlighting who performed the action and what resource was targeted.
             */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/**
               * Executing Actor Card
               * Displays name, system role, email, and internal database identifier.
               */}
              <div className="p-4 rounded-lg border border-gray-200 bg-gray-50/50 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-[#093C5D]" />
                  <span>Executing Actor</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">
                      {log.actor?.name || 'Platform System'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-[#093C5D] border border-blue-200">
                      {log.actor?.role || 'SYSTEM'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">{log.actor?.email || 'N/A'}</p>
                  <p className="text-[11px] text-gray-400 font-mono truncate">
                    Actor ID: {log.actor?._id || 'N/A'}
                  </p>
                </div>
              </div>

              {/**
               * Target Resource Card
               * Identifies target name, category type, and underlying entity ID.
               */}
              <div className="p-4 rounded-lg border border-gray-200 bg-gray-50/50 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <Target className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Target Resource</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">
                      {log.targetName || log.targetType || 'System Platform'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {log.targetType || 'General'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-mono truncate">
                    Target ID: {log.targetId || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/**
             * Network & Client Fingerprint
             * Captures IP address, localized timestamp, and raw user-agent string.
             */}
            <div className="p-4 rounded-lg border border-gray-200 bg-gray-50/50 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <Globe className="w-3.5 h-3.5 text-sky-500" />
                <span>Network & Client Fingerprint</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 block mb-0.5">IP Address</span>
                  <span className="font-mono font-medium text-gray-800 bg-white px-2 py-1 rounded border border-gray-200 inline-block">
                    {log.ipAddress || '127.0.0.1'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Timestamp (IST)</span>
                  <div className="flex items-center gap-1.5 font-medium text-gray-800">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{formattedDate}</span>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-gray-400 block mb-0.5">Client User-Agent</span>
                  <div className="flex items-start gap-1.5 text-gray-600 bg-white p-2 rounded border border-gray-200 font-mono text-[11px] break-all">
                    <Laptop className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                    <span>{log.userAgent || 'Unknown User-Agent'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/**
             * Event Mutation Details & Payload
             * Syntax-highlighted code block with interactive JSON clipboard copy.
             */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <FileCode className="w-4 h-4 text-purple-500" />
                  <span>Event Mutation Details & Payload</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(log.details || {}, 'details')}
                  className="cursor-pointer flex items-center gap-1 text-xs text-[#093C5D] hover:underline font-semibold transition-colors"
                >
                  {copiedKey === 'details' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto text-xs font-mono text-emerald-400 border border-gray-800 max-h-60">
                <pre className="whitespace-pre-wrap break-all">
                  {log.details && Object.keys(log.details).length > 0
                    ? JSON.stringify(log.details, null, 2)
                    : '{\n  "status": "No additional payload properties recorded"\n}'}
                </pre>
              </div>
            </div>
          </div>

          {/**
           * Modal Action Footer
           * Controls to copy log ID to clipboard and dismiss the modal dialog.
           */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => copyToClipboard(log._id, 'id')}
              className="cursor-pointer flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors font-medium"
            >
              {copiedKey === 'id' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>Copy Log ID</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded text-xs sm:text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditDetailsModal;
