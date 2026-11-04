/**
 * Customer Profile Creation & Editing Dialog
 * Form validation via Yup schema, supporting phone regex checks, email sanitation, and reactive reset.
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Customer Form Validation Schema
 */
const customerSchema = yup.object({
  name: yup.string().required('Name is required'),
  phone: yup.string().matches(/^(?:\+?91[\-\s]?)?[0]?(?:\d[\-\s]?){10}$/, 'Enter a valid 10-digit number').required('Phone is required'),
  email: yup.string().email('Please provide a valid email address').nullable().transform(value => value === '' ? null : value),
  address: yup.string().nullable(),
});

/**
 * CustomerFormModal Component
 */
const CustomerFormModal = ({ isOpen, isEditMode, editingCustomer, onClose, onSubmit, isPending, serverError }) => {
  const { t } = useTranslation();

  const { register, handleSubmit, reset, setError, formState: { errors, isDirty } } = useForm({
    resolver: yupResolver(customerSchema),
    defaultValues: isEditMode && editingCustomer ? {
      name: editingCustomer.name,
      phone: editingCustomer.phone,
      email: editingCustomer.email || '',
      address: editingCustomer.address || ''
    } : {}
  });

  React.useEffect(() => {
    if (isOpen) {
      if (isEditMode && editingCustomer) {
        reset({
          name: editingCustomer.name,
          phone: editingCustomer.phone,
          email: editingCustomer.email || '',
          address: editingCustomer.address || ''
        });
      } else {
        reset({
          name: '',
          phone: '',
          email: '',
          address: ''
        });
      }
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
  }, [isOpen, isEditMode, editingCustomer, reset]);

  React.useEffect(() => {
    if (serverError) {
      if (serverError.toLowerCase().includes('phone')) {
        setError('phone', { type: 'server', message: serverError });
      } else if (serverError.toLowerCase().includes('email')) {
        setError('email', { type: 'server', message: serverError });
      } else {
        setError('root.server', { type: 'server', message: serverError });
      }
    }
  }, [serverError, setError]);

  if (!isOpen) return null;

  const handleClose = () => {
    reset({
      name: '',
      phone: '',
      email: '',
      address: ''
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      {/**
       * Backdrop Dimmer Overlay
       * Semi-transparent dark blur background capturing dismiss clicks
       */}
      <div className="fixed inset-0 bg-[#191E2B]/50 transition-opacity animate-modal-overlay" onClick={handleClose} />

      {/**
       * Responsive Dialog Frame
       * Bottom sheet on mobile devices, centered window on desktop
       */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-center sm:justify-center sm:px-4 sm:py-8 z-50 pointer-events-none">
        <div className="relative bg-[#FBFBFC] w-full sm:max-w-md rounded-t-2xl sm:rounded-xl flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-[#DCE1EA] animate-modal-content overflow-hidden pointer-events-auto shadow-none">

          {/**
           * Mobile Sheet Drag Indicator
           */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1.5 bg-[#DCE1EA] rounded-full" />
          </div>

          <div className="flex items-center justify-between px-5 md:px-6 py-4 md:py-5 border-b border-[#E8ECF2] flex-shrink-0">
            <h3 className="text-lg md:text-xl font-semibold text-[#191E2B]">
              {isEditMode ? t('Edit Customer') : t('Add New Customer')}
            </h3>
            <button onClick={handleClose} className="cursor-pointer text-[#757F94] bg-gray-100 hover:bg-[#DCE1EA] hover:text-[#191E2B] w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px] border border-[#DCE1EA]">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <div className="p-5 md:p-6 overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {errors.root?.server && (
                <div className="bg-[#FFF1F2] border-l-[3px] border-[#E11D48] p-2 rounded-r-md mb-4">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#B91C1C] shrink-0" />
                    <p className="text-[11px] sm:text-[12px] font-medium text-[#B91C1C] leading-none">{errors.root.server.message}</p>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-0.5">
                  {t('Full Name')} <span className="text-[#B91C1C]">*</span>
                </label>
                <input
                  {...register('name')}
                  className={`block w-full rounded-lg border bg-[#FBFBFC] px-3 py-2.5 text-sm md:text-base font-medium text-[#191E2B] placeholder:text-[#9AA4B8] transition-colors duration-200 shadow-none focus:outline-none ${errors.name ? 'border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20 focus:border-[#B91C1C]' : 'border-[#DCE1EA] focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] text-[#191E2B] placeholder-[#9AA4B8] bg-[#FBFBFC]'}`}
                  placeholder={t("Enter Full Name")}
                />
                {errors.name && (
                  <p className="text-[#B91C1C] text-[11px] sm:text-xs mt-1.5 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="leading-none pt-[1px]">{t(errors.name.message)}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-0.5">
                  {t('Phone Number')} <span className="text-[#B91C1C]">*</span>
                </label>
                <input
                  {...register('phone')}
                  className={`block w-full rounded-lg border bg-[#FBFBFC] px-3 py-2.5 text-sm md:text-base font-medium text-[#191E2B] placeholder:text-[#9AA4B8] transition-colors duration-200 shadow-none focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 ${errors.phone ? 'border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20 focus:border-[#B91C1C]' : 'border-[#DCE1EA] focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] text-[#191E2B] placeholder-[#9AA4B8] bg-[#FBFBFC]'}`}
                  placeholder={t("Enter Phone Number")}
                  disabled={isEditMode}
                />
                {errors.phone && (
                  <p className="text-[#B91C1C] text-[11px] sm:text-xs mt-1.5 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="leading-none pt-[1px]">{t(errors.phone.message)}</span>
                  </p>
                )}
                {isEditMode && <p className="text-[11px] sm:text-xs text-[#B91C1C] mt-1 font-medium">{t('Phone number cannot be changed')}</p>}
              </div>

              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-0.5">
                  {t('Email')}
                </label>
                <input
                  {...register('email')}
                  className={`block w-full rounded-lg border bg-[#FBFBFC] px-3 py-2.5 text-sm md:text-base font-medium text-[#191E2B] placeholder:text-[#9AA4B8] transition-colors duration-200 shadow-none focus:outline-none ${errors.email ? 'border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20 focus:border-[#B91C1C]' : 'border-[#DCE1EA] focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] text-[#191E2B] placeholder-[#9AA4B8] bg-[#FBFBFC]'}`}
                  placeholder={t("Enter Email Address")}
                />
                {errors.email && (
                  <p className="text-[#B91C1C] text-[11px] sm:text-xs mt-1.5 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="leading-none pt-[1px]">{t(errors.email.message)}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-0.5">
                  {t('Address')}
                </label>
                <textarea
                  {...register('address')}
                  className="block w-full rounded-lg border border-[#DCE1EA] px-3 py-2.5 text-sm md:text-base font-medium focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] text-[#191E2B] placeholder-[#9AA4B8] transition-colors duration-200 resize-none"
                  rows="3"
                  placeholder={t("Enter Address")}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending || (isEditMode && !isDirty)}
                  className="cursor-pointer w-full bg-[#4338CA] hover:bg-[#3730A3] text-white rounded-lg px-5 py-2.5 font-semibold text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all shadow-none"
                >
                  {isPending ? t('Saving...') : isEditMode ? t('Update Customer') : t('Save Customer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerFormModal;
