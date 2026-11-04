/**
 * Direct Administrative Notice Dispatch Modal
 * Dispatches targeted real-time alerts and dashboard notifications to specific storekeepers.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  BellRing,
  Store,
  Sparkles,
  AlertTriangle,
  Info,
  Flame,
  CheckCircle2,
  Clock,
  ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sendDirectShopNotice } from '../api/adminApi';

/**
 * Notice Message Preset Templates
 */
const PRESET_TEMPLATES = [
  {
    label: 'Store Verification Pending',
    title: 'Action Required: Store Verification Pending',
    priority: 'HIGH',
    message: 'Dear merchant, your business profile details are incomplete. Please update your shop address, UPI ID, and business details from Store Settings to ensure uninterrupted service.',
  },
  {
    label: 'Subscription Renewal Alert',
    title: 'Exclusive Offer: Renew Your Subscription Today',
    priority: 'NORMAL',
    message: 'Your subscription is nearing expiry. Renew now to enjoy uninterrupted WhatsApp reminders, unlimited billing, and priority merchant support.',
  },
  {
    label: 'Security & Policy Notice',
    title: 'Important Security & Platform Compliance Notice',
    priority: 'URGENT',
    message: 'Please review your active logged-in sessions and verify your store settings. If you notice any suspicious activity, change your password immediately or contact support.',
  },
  {
    label: 'Free Trial Ending Soon',
    title: 'Your 7-Day Free Trial is Ending Soon',
    priority: 'HIGH',
    message: 'Your free trial will end in 2 days. Upgrade to Monthly or Yearly Pro to retain unlimited customer management and auto WhatsApp billing.',
  },
];

const PRIORITY_OPTIONS = [
  { id: 'NORMAL', label: 'Standard', desc: 'Standard inbox alert' },
  { id: 'HIGH', label: 'High Priority', desc: 'Urgent merchant action' },
  { id: 'URGENT', label: 'Urgent Alert', desc: 'Critical platform notice' },
  { id: 'LOW', label: 'Informational', desc: 'General announcement' },
];

const SendDirectNoticeModal = ({ isOpen, onClose, shop, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Scroll & Touch Prevention Hook
   * Disables document scrolling and touch moves while modal dialog is open.
   */
  useEffect(() => {
    if (!isOpen) return;

    setTitle('');
    setMessage('');
    setPriority('NORMAL');
    setIsSubmitting(false);

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
  }, [isOpen, shop]);

  if (!isOpen || !shop) return null;

  const shopDisplayName = shop.shopName || shop.businessName || shop.settings?.shopName || shop.name || 'Merchant Shop';
  const ownerName = shop.name || 'Store Owner';
  const plan = (shop.subscriptionPlan || 'FREE').toUpperCase();

  const handleApplyTemplate = (tmpl) => {
    setTitle(tmpl.title);
    setMessage(tmpl.message);
    setPriority(tmpl.priority);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || title.trim().length < 3) {
      toast.error('Notice title must be at least 3 characters');
      return;
    }
    if (!message.trim() || message.trim().length < 5) {
      toast.error('Notice message must be at least 5 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await sendDirectShopNotice(shop._id, {
        title: title.trim(),
        message: message.trim(),
        priority,
      });

      toast.success(res?.message || `Official notice delivered to ${shopDisplayName}!`, {
        duration: 5000,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send official notice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overscroll-contain">
      {/**
       * Backdrop Overlay
       * Darkened semi-transparent overlay closing dialog on background tap.
       */}
      <div
        className="fixed inset-0 bg-[#191E2B]/50 transition-opacity animate-modal-overlay overscroll-contain"
        onClick={onClose}
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/**
       * Modal Viewport Dialog
       * Renders as mobile bottom sheet or desktop centered dialogue modal.
       */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-center sm:justify-center sm:px-4 sm:py-8 z-[60] pointer-events-none">
        <div className="relative bg-[#FBFBFC] w-full sm:max-w-xl rounded-t-2xl sm:rounded-xl flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-[#DCE1EA] animate-modal-content overflow-hidden pointer-events-auto shadow-none">
          
          {/**
           * Mobile Drag Pill
           * Visual drag pill indicator displayed on mobile devices.
           */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0 bg-[#FBFBFC]">
            <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
          </div>

          {/**
           * Modal Header
           * Bell icon, title banner, direct push tag, and circular close action.
           */}
          <div className="px-5 sm:px-6 py-4 border-b border-[#E8ECF2] flex items-center justify-between bg-[#FBFBFC] flex-shrink-0 gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border bg-[#EEF0FB] text-[#4338CA] border-[#D8DCF5]">
                <BellRing className="w-5 h-5 text-[#4338CA]" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-semibold text-[#191E2B] leading-snug truncate">
                    Send Direct Notice to Store
                  </h3>
                  <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200 shrink-0">
                    Direct Push
                  </span>
                </div>
                <p className="text-xs text-[#757F94] font-medium truncate mt-0.5">
                  {shopDisplayName} {shop.phone ? `• +91 ${shop.phone}` : (shop.email ? `• ${shop.email}` : '')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer text-[#757F94] bg-[#F0F2F6] hover:bg-[#EBEEF4] hover:text-[#191E2B] w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 border border-[#DCE1EA] ml-auto"
              title="Close"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/**
           * Direct Notice Form
           * Form fields for templates, priority, title, message body, and live preview.
           */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/**
               * Store Recipient Summary
               * Information strip displaying target shop name, merchant owner, and plan tier.
               */}
              <div className="p-3 bg-[#F0F2F6]/80 border border-[#DCE1EA] rounded-lg flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Store className="w-4 h-4 text-[#4338CA] shrink-0" />
                  <div className="min-w-0">
                    <span className="font-semibold text-[#191E2B] truncate block">
                      {shopDisplayName}
                    </span>
                    <span className="text-[11px] text-[#757F94] truncate block mt-0.5">
                      Merchant: {ownerName}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded border bg-[#FFFFFF] text-[#4E5668] border-[#DCE1EA]">
                    {plan} Plan
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Active
                  </span>
                </div>
              </div>

              {/**
               * Quick Preset Templates
               * Clickable chips pre-filling common administrative notices.
               */}
              <div>
                <label className="block text-xs font-semibold text-[#4E5668] mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#4338CA]" />
                  <span>Quick Fill Templates:</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {PRESET_TEMPLATES.map((tmpl, idx) => {
                    const isSelected = title === tmpl.title;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyTemplate(tmpl)}
                        className={`cursor-pointer px-2.5 py-1.5 text-left text-[11px] sm:text-xs font-medium rounded-lg border transition-all active:scale-95 truncate ${
                          isSelected
                            ? 'bg-[#EEF0FB] text-[#4338CA] border-[#D8DCF5] ring-1 ring-[#4338CA]/20 font-semibold'
                            : 'bg-[#F0F2F6]/80 hover:bg-gray-100 text-[#4E5668] border-[#DCE1EA]'
                        }`}
                        title={tmpl.label}
                      >
                        {tmpl.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/**
               * Priority Level Selector
               * Granular urgency levels: normal, high, urgent, or broadcast.
               */}
              <div>
                <label className="block text-xs font-semibold text-[#4E5668] mb-1.5">
                  Notice Priority Level
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {PRIORITY_OPTIONS.map((item) => {
                    const isSelected = priority === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPriority(item.id)}
                        className={`cursor-pointer px-2.5 py-2 rounded-lg border text-xs font-medium text-center transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-[#4338CA] text-white border-[#4338CA] font-semibold shadow-sm'
                            : 'bg-[#F0F2F6]/80 hover:bg-gray-100 text-[#4E5668] border-[#DCE1EA]'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/**
               * Notice Title Input
               * Headline subject line for the in-app merchant notice.
               */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#4E5668]">
                    Notice Title <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-[#757F94] font-normal">
                    {title.length}/120
                  </span>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  required
                  placeholder="e.g. Action Required: Store Verification Pending"
                  className="w-full text-xs sm:text-sm border border-[#DCE1EA] rounded-lg p-2.5 bg-[#FBFBFC] text-[#191E2B] placeholder-[#9AA4B8] focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] shadow-none font-normal"
                />
              </div>

              {/**
               * Notice Message Body
               * Multi-line textarea detailing formal instructions for the shopkeeper.
               */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#4E5668]">
                    Notice Message / Instructions <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-[#757F94] font-normal">
                    {message.length}/1000
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={1000}
                  required
                  placeholder="Enter the official notice message for the shopkeeper here..."
                  className="w-full text-xs sm:text-sm border border-[#DCE1EA] rounded-lg p-2.5 bg-[#FBFBFC] text-[#191E2B] placeholder-[#9AA4B8] focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] shadow-none resize-none font-normal"
                />
              </div>

              {/**
               * Live In-App Notification Preview
               * Demonstrates how the alert will appear in the shopkeeper's notifications drawer.
               */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#757F94] mb-1.5">
                  Live Merchant Box Preview
                </label>
                <div className="p-3 bg-[#F0F2F6]/80 border border-[#DCE1EA] rounded-lg flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#EEF0FB] text-[#4338CA] flex items-center justify-center shrink-0 mt-0.5">
                    <BellRing className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs sm:text-sm font-semibold text-[#191E2B] truncate">
                        {title || 'Notice Title Will Appear Here'}
                      </p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                        {priority}
                      </span>
                    </div>
                    <p className="text-xs text-[#4E5668] mt-1 leading-relaxed break-words font-normal">
                      {message || 'The notice message will appear here in the shopkeeper notification drawer...'}
                    </p>
                    <span className="text-[10px] text-[#757F94] block mt-1.5">
                      Just now • Official Platform Notice
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/**
             * Modal Action Footer
             * Cancel button and submit trigger to deliver direct notification to store.
             */}
            <div className="px-4 sm:px-5 py-3.5 bg-[#F0F2F6] border-t border-[#DCE1EA] flex items-center justify-end gap-2.5 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="cursor-pointer h-10 px-4 sm:px-5 text-xs sm:text-sm font-semibold text-[#4E5668] bg-[#FBFBFC] hover:bg-[#F0F2F6] border border-[#DCE1EA] rounded-lg transition-colors active:scale-95 inline-flex items-center justify-center flex-1 sm:flex-initial"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer h-10 px-5 text-xs sm:text-sm font-semibold rounded-lg text-white bg-[#4338CA] hover:bg-[#3730A3] border border-[#4338CA] shadow-none transition-all active:scale-95 disabled:opacity-50 inline-flex items-center justify-center gap-2 flex-1 sm:flex-initial"
              >
                {isSubmitting ? (
                  <span>Delivering...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Direct Notice</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SendDirectNoticeModal;
