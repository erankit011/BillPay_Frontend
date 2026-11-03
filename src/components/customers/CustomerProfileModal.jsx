/**
 * Customer Profile Details Modal
 * Displays customer ledger balance, lifetime collections, contact information, and registration metadata.
 */

import React, { useEffect } from 'react';
import { X, Phone, Mail, MapPin, Clock, IndianRupee, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/dateUtils';

/**
 * CustomerProfileModal Component
 */
const CustomerProfileModal = ({ isOpen, onClose, customer }) => {
  const { t } = useTranslation();

  /**
   * Body Scroll Lock Controller
   * Prevents window scroll manipulation while profile modal is displayed
   */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !customer) return null;

  const initials = customer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const joinedDate = formatDate(customer.createdAt);

  const getAvatarColor = (balance) => {
    if (balance > 0) return 'bg-[#FFF1F2] text-[#B91C1C] border-[#FECDD3]';
    if (balance < 0) return 'bg-[#ECFDF5] text-[#0D7A57] border-[#A7F3D0]';
    return 'bg-gray-50 text-[#4E5668] border-[#DCE1EA]';
  };

  return (
    <div className="fixed inset-0 z-50">
      {/**
       * Backdrop Dimmer Overlay
       * Semi-transparent dark blur background capturing dismiss clicks
       */}
      <div
        className="fixed inset-0 bg-[#191E2B]/50 transition-opacity animate-modal-overlay"
        onClick={onClose}
      />

      {/**
       * Responsive Dialog Container
       * Bottom sheet on mobile viewports, centered dialog on desktop screens
       */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-center sm:justify-center sm:px-4 sm:py-8 z-50 pointer-events-none">
        <div className="relative bg-[#FBFBFC] w-full sm:max-w-md rounded-t-2xl sm:rounded-xl flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-[#DCE1EA] animate-modal-content overflow-hidden pointer-events-auto shadow-none">

          {/**
           * Mobile Sheet Drag Indicator
           */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1.5 bg-[#DCE1EA] rounded-full" />
          </div>

          {/**
           * Modal Header & Dismiss Action
           */}
          <div className="flex items-center justify-between px-5 md:px-6 py-4 md:py-5 border-b border-[#E8ECF2] flex-shrink-0 bg-[#FBFBFC]">
            <h3 className="text-lg md:text-xl font-semibold text-[#191E2B]">
              {t('Customer Profile')}
            </h3>
            <button
              onClick={onClose}
              className="cursor-pointer text-[#757F94] bg-gray-100 hover:bg-[#DCE1EA] hover:text-[#191E2B] w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px] border border-[#DCE1EA]"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/**
           * Customer Overview Content Area
           * Monogram badge, contact metrics, and balance indicator
           */}
          <div className="p-4 md:p-5 overflow-y-auto flex-1 bg-[#FBFBFC]">
            <div className="flex flex-col items-center mb-4 sm:mb-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[3px] border border-[#DCE1EA] bg-[#FBFBFC] mb-3 flex-shrink-0">
                <div className="w-full h-full rounded-full flex items-center justify-center text-2xl sm:text-3xl font-semibold bg-[#EEF0FB] text-[#4338CA]">
                  {initials}
                </div>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-[#191E2B] text-center leading-tight mb-1">{customer.name}</h2>
              <div className="flex items-center text-xs text-[#757F94] font-medium">
                <Clock className="w-3.5 h-3.5 mr-1.5" />
                {joinedDate}
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {/**
               * Contact Information Group
               * Direct telephone dialer, email link, and billing address
               */}
              <div className="bg-[#FBFBFC] rounded-lg border border-[#DCE1EA] overflow-hidden">
                <div className="divide-y divide-[#E8ECF2]">
                  <a href={`tel:${customer.phone}`} className="flex items-center px-3.5 py-3 sm:px-4 sm:py-3.5 hover:bg-[#F4F6FA] transition-colors group cursor-pointer">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#EEF0FB] text-[#4338CA] border border-[#D8DCF5] flex items-center justify-center mr-3 shrink-0 group-hover:bg-[#E0E4FA] transition-colors">
                      <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-[11px] font-medium text-[#757F94] mb-0.5">{t('Phone Number')}</p>
                      <p className="text-xs sm:text-sm font-medium text-[#191E2B] truncate">{customer.phone}</p>
                    </div>
                  </a>

                  {customer.email && (
                    <div className="flex items-center px-3.5 py-3 sm:px-4 sm:py-3.5">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#EEF0FB] text-[#4338CA] border border-[#D8DCF5] flex items-center justify-center mr-3 shrink-0">
                        <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-[11px] font-medium text-[#757F94] mb-0.5">{t('Email Address')}</p>
                        <p className="text-xs sm:text-sm font-medium text-[#191E2B] truncate">{customer.email}</p>
                      </div>
                    </div>
                  )}

                  {customer.address && (
                    <div className="flex items-start px-3.5 py-3 sm:px-4 sm:py-3.5">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] flex items-center justify-center mr-3 shrink-0 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-[11px] font-medium text-[#757F94] mb-0.5">{t('Address')}</p>
                        <p className="text-xs sm:text-sm font-medium text-[#191E2B] leading-snug">{customer.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfileModal;
