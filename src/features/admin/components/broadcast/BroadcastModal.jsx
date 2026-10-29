/**
 * Administrative System Broadcast Creation & Editing Modal
 * Configures platform-wide announcements, start and expiry windows, target audiences, and live banner preview.
 */

import React, { useState, useEffect } from 'react';
import { X, Megaphone, Calendar, Link as LinkIcon, Save, RefreshCw, Eye } from 'lucide-react';
import BroadcastBanner from './BroadcastBanner';
import toast from 'react-hot-toast';

/**
 * BroadcastModal Component
 */
const BroadcastModal = ({ isOpen, onClose, broadcastToEdit, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'INFO',
    targetAudience: 'ALL',
    isActive: true,
    startsAt: '',
    expiresAt: '',
    actionUrl: '',
    actionLabel: '',
    dismissible: true,
  });

  useEffect(() => {
    if (broadcastToEdit) {
      setFormData({
        title: broadcastToEdit.title || '',
        message: broadcastToEdit.message || '',
        type: broadcastToEdit.type || 'INFO',
        targetAudience: broadcastToEdit.targetAudience || 'ALL',
        isActive: broadcastToEdit.isActive !== false,
        startsAt: broadcastToEdit.startsAt ? new Date(broadcastToEdit.startsAt).toISOString().slice(0, 10) : '',
        expiresAt: broadcastToEdit.expiresAt ? new Date(broadcastToEdit.expiresAt).toISOString().slice(0, 10) : '',
        actionUrl: broadcastToEdit.actionUrl || '',
        actionLabel: broadcastToEdit.actionLabel || '',
        dismissible: broadcastToEdit.dismissible !== false,
      });
    } else {
      setFormData({
        title: '',
        message: '',
        type: 'INFO',
        targetAudience: 'ALL',
        isActive: true,
        startsAt: new Date().toISOString().slice(0, 10),
        expiresAt: '',
        actionUrl: '',
        actionLabel: '',
        dismissible: true,
      });
    }
  }, [broadcastToEdit, isOpen]);

  /**
   * Scroll & Touch Prevention Hook
   * Locks background document scrolling and mobile touch moves when modal is visible.
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

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Title and message are required');
      return;
    }

    if (formData.startsAt && formData.expiresAt && new Date(formData.expiresAt) <= new Date(formData.startsAt)) {
      toast.error('Expiration date must be after the start display date');
      return;
    }

    const payload = {
      ...formData,
      startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : null,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
    };

    onSave(payload, broadcastToEdit?._id);
  };

  return (
    <div className="fixed inset-0 z-50 overscroll-contain">
      {/**
       * Backdrop Overlay
       * Darkened modal background dismissing view upon backdrop click.
       */}
      <div
        className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay overscroll-contain"
        onClick={onClose}
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/**
       * Responsive Dialog Viewport
       * Renders as mobile bottom sheet or desktop centered dialogue.
       */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-center sm:justify-center sm:px-4 sm:py-8 z-50 pointer-events-none">
        <div
          className="relative bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-xl flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-gray-200 animate-modal-content overflow-hidden pointer-events-auto shadow-2xl sm:shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/**
           * Mobile Drag Pill
           * Visual drag pill indicator for mobile bottom sheet.
           */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0 bg-white">
            <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
          </div>

          {/**
           * Modal Header
           * Banner title with megaphone icon and round close button.
           */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 flex-shrink-0 gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded bg-[#093C5D]/10 text-[#093C5D] flex items-center justify-center shrink-0">
                <Megaphone className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 leading-snug truncate">
                  {broadcastToEdit ? 'Edit Global Announcement' : 'Create Global Announcement'}
                </h2>
                <p className="text-xs text-gray-500 font-medium truncate">Broadcast an alert banner across merchant dashboards</p>
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
           * Broadcast Configuration Form
           * Form fields for live preview, title, message body, target audience, and dates.
           */}
          <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 flex-1">
            {/**
             * Live Banner Preview
             * Interactive preview reflecting real-time configuration changes.
             */}
            <div>
              <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <Eye className="w-3.5 h-3.5" />
                <span>Live Merchant Banner Preview</span>
              </div>
              <BroadcastBanner broadcast={formData} isPreview={true} />
            </div>

            {/**
             * Broadcast Title Field
             * Headline text for the announcement banner.
             */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Announcement Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                maxLength={150}
                placeholder="e.g. Scheduled System Upgrade or New Feature Announcement"
                className="w-full h-10 px-3.5 text-sm bg-gray-50/70 border border-gray-200 rounded-lg focus:outline-none focus:border-[#093C5D] focus:bg-white transition-all text-gray-900 font-medium"
              />
            </div>

            {/**
             * Announcement Message Field
             * Full explanatory message text rendered for storekeepers.
             */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Message Content <span className="text-red-500">*</span>
              </label>
              <textarea
                name="message"
                rows={3}
                value={formData.message}
                onChange={handleChange}
                required
                maxLength={1000}
                placeholder="Enter clear, concise information for storekeepers..."
                className="w-full p-3 text-sm bg-gray-50/70 border border-gray-200 rounded-lg focus:outline-none focus:border-[#093C5D] focus:bg-white transition-all text-gray-900 font-medium leading-relaxed"
              />
            </div>

            {/**
             * Category & Audience Parameters
             * Selectors for announcement severity level and target merchant tier.
             */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/**
               * Severity Category Selector
               * Selects between info, warning, critical alert, and success styles.
               */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Severity / Category
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full h-10 px-3 text-sm bg-gray-50/70 border border-gray-200 rounded-lg focus:outline-none focus:border-[#093C5D] focus:bg-white transition-all text-gray-900 font-medium cursor-pointer"
                >
                  <option value="INFO">Information (Blue)</option>
                  <option value="WARNING">Maintenance / Warning (Amber)</option>
                  <option value="ALERT">Critical / Urgent Alert (Rose)</option>
                  <option value="SUCCESS">Feature / Promotional (Emerald)</option>
                </select>
              </div>

              {/**
               * Merchant Audience Filter
               * Scopes delivery to all stores, free trial merchants, or paid subscribers.
               */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Target Merchant Audience
                </label>
                <select
                  name="targetAudience"
                  value={formData.targetAudience}
                  onChange={handleChange}
                  className="w-full h-10 px-3 text-sm bg-gray-50/70 border border-gray-200 rounded-lg focus:outline-none focus:border-[#093C5D] focus:bg-white transition-all text-gray-900 font-medium cursor-pointer"
                >
                  <option value="ALL">All Registered Stores</option>
                  <option value="FREE_TRIAL">Free Trial Stores Only</option>
                  <option value="PAID_SUBSCRIBERS">Paid Pro Subscribers Only</option>
                </select>
              </div>
            </div>

            {/**
             * Call-to-Action Link Configuration
             * Optional label and destination route for interactive banner button.
             */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  CTA Button Text (Optional)
                </label>
                <input
                  type="text"
                  name="actionLabel"
                  value={formData.actionLabel}
                  onChange={handleChange}
                  maxLength={50}
                  placeholder="e.g. Upgrade Now or Learn More"
                  className="w-full h-10 px-3.5 text-sm bg-gray-50/70 border border-gray-200 rounded-lg focus:outline-none focus:border-[#093C5D] focus:bg-white transition-all text-gray-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Action Destination Link (Optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="actionUrl"
                    value={formData.actionUrl}
                    onChange={handleChange}
                    placeholder="/subscription or https://..."
                    className="w-full h-10 pl-9 pr-3.5 text-sm bg-gray-50/70 border border-gray-200 rounded-lg focus:outline-none focus:border-[#093C5D] focus:bg-white transition-all text-gray-900 font-medium"
                  />
                  <LinkIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            {/**
             * Temporal Display Schedule
             * Start and expiration dates defining banner visibility lifecycle.
             */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Start Display Date
                </label>
                <input
                  type="date"
                  name="startsAt"
                  value={formData.startsAt}
                  onChange={handleChange}
                  className="w-full h-10 px-3.5 text-sm bg-gray-50/70 border border-gray-200 rounded-lg focus:outline-none focus:border-[#093C5D] focus:bg-white transition-all text-gray-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Expiration Date (Optional)
                </label>
                <input
                  type="date"
                  name="expiresAt"
                  value={formData.expiresAt}
                  onChange={handleChange}
                  className="w-full h-10 px-3.5 text-sm bg-gray-50/70 border border-gray-200 rounded-lg focus:outline-none focus:border-[#093C5D] focus:bg-white transition-all text-gray-900 font-medium"
                />
              </div>
            </div>

            {/**
             * Publishing & Dismissal Toggles
             * Controls immediate activation status and user dismissibility.
             */}
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-[#093C5D] focus:ring-[#093C5D] border-gray-300"
                />
                <span className="text-xs font-semibold text-gray-900">Active (Publish immediately)</span>
              </label>

              <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="dismissible"
                  checked={formData.dismissible}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-[#093C5D] focus:ring-[#093C5D] border-gray-300"
                />
                <span className="text-xs font-semibold text-gray-900">Allow Merchants to Dismiss (✕)</span>
              </label>
            </div>

            {/**
             * Modal Action Footer
             * Buttons to cancel changes or save and broadcast the announcement.
             */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer h-10 px-4 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-semibold transition-all active:scale-95 shadow-none"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="cursor-pointer h-10 px-5 rounded bg-[#093C5D] hover:bg-[#072d46] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-all active:scale-95 shadow-none disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Announcement...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{broadcastToEdit ? 'Save Changes' : 'Broadcast Announcement'}</span>
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

export default BroadcastModal;
