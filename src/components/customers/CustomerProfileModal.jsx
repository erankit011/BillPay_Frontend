import React, { useEffect } from 'react';
import { X, Phone, Mail, MapPin, Clock, IndianRupee, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/dateUtils';

const CustomerProfileModal = ({ isOpen, onClose, customer }) => {
  const { t } = useTranslation();

  // Prevent background scrolling when modal is open
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
    if (balance > 0) return 'bg-red-50 text-red-700 border-red-200';
    if (balance < 0) return 'bg-green-50 text-green-700 border-green-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay"
        onClick={onClose}
      />

      {/* Mobile: bottom sheet | sm+: centered modal */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-center sm:justify-center sm:px-4 sm:py-8 z-50 pointer-events-none">
        <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-gray-200 animate-modal-content overflow-hidden pointer-events-auto shadow-2xl sm:shadow-xl">

          {/* Drag handle — mobile only */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 md:px-6 py-4 md:py-5 border-b border-gray-100 flex-shrink-0 bg-white">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900">
              {t('Customer Profile')}
            </h3>
            <button
              onClick={onClose}
              className="cursor-pointer text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px] border border-gray-200"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 md:p-5 overflow-y-auto flex-1 bg-white">
            <div className="flex flex-col items-center mb-4 sm:mb-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[3px] border border-gray-200 bg-white mb-3 flex-shrink-0">
                <div className="w-full h-full rounded-full flex items-center justify-center text-2xl sm:text-3xl font-semibold bg-gray-50 text-[#093C5D]">
                  {initials}
                </div>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-[#093C5D] text-center leading-tight mb-1">{customer.name}</h2>
              <div className="flex items-center text-xs text-gray-500 font-medium">
                <Clock className="w-3.5 h-3.5 mr-1.5" />
                {joinedDate}
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {/* Contact Details */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-100">
                  <a href={`tel:${customer.phone}`} className="flex items-center px-3.5 py-3 sm:px-4 sm:py-3.5 hover:bg-gray-50 transition-colors group cursor-pointer">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mr-3 shrink-0 group-hover:bg-blue-100 transition-colors">
                      <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 mb-0.5">{t('Phone Number')}</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{customer.phone}</p>
                    </div>
                  </a>

                  {customer.email && (
                    <div className="flex items-center px-3.5 py-3 sm:px-4 sm:py-3.5">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center mr-3 shrink-0">
                        <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 mb-0.5">{t('Email Address')}</p>
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{customer.email}</p>
                      </div>
                    </div>
                  )}

                  {customer.address && (
                    <div className="flex items-start px-3.5 py-3 sm:px-4 sm:py-3.5">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center mr-3 shrink-0 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 mb-0.5">{t('Address')}</p>
                        <p className="text-xs sm:text-sm font-medium text-gray-900 leading-snug">{customer.address}</p>
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
