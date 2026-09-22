import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const customerSchema = yup.object({
  name: yup.string().required('Name is required'),
  phone: yup.string().matches(/^[0-9]{10}$/, 'Must be a 10 digit number').required('Phone is required'),
  email: yup.string().email('Invalid email').nullable().transform(value => value === '' ? null : value),
  address: yup.string().nullable(),
});

const CustomerFormModal = ({ isOpen, isEditMode, editingCustomer, onClose, onSubmit, isPending }) => {
  const { t } = useTranslation();

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
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
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay" onClick={handleClose} />

      {/* Mobile: bottom sheet | sm+: centered modal */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-center sm:justify-center sm:px-4 sm:py-8 z-50 pointer-events-none">
        <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-gray-200 animate-modal-content overflow-hidden pointer-events-auto shadow-2xl sm:shadow-xl">

          {/* Drag handle — mobile only */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
          </div>

          <div className="flex items-center justify-between px-5 md:px-6 py-4 md:py-5 border-b border-gray-100 flex-shrink-0">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900">
              {isEditMode ? t('Edit Customer') : t('Add New Customer')}
            </h3>
            <button onClick={handleClose} className="cursor-pointer text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px] border border-gray-200">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <div className="p-5 md:p-6 overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-0.5">
                  {t('Full Name')} <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('name')}
                  className={`block w-full rounded-lg border px-3 py-2.5 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none ${errors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#093C5D] focus:border-[#093C5D]'}`}
                  placeholder={t("Enter Full Name")}
                />
                {errors.name && (
                  <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="leading-none pt-[1px]">{t(errors.name.message)}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-0.5">
                  {t('Phone Number')} <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('phone')}
                  className={`block w-full rounded-lg border px-3 py-2.5 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 ${errors.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#093C5D] focus:border-[#093C5D]'}`}
                  placeholder={t("Enter Phone Number")}
                  disabled={isEditMode}
                />
                {errors.phone && (
                  <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="leading-none pt-[1px]">{t(errors.phone.message)}</span>
                  </p>
                )}
                {isEditMode && <p className="text-[11px] sm:text-xs text-red-500 mt-1 font-medium">{t('Phone number cannot be changed')}</p>}
              </div>

              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-0.5">
                  {t('Email')}
                </label>
                <input
                  {...register('email')}
                  className={`block w-full rounded-lg border px-3 py-2.5 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#093C5D] focus:border-[#093C5D]'}`}
                  placeholder={t("Enter Email Address")}
                />
                {errors.email && (
                  <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="leading-none pt-[1px]">{t(errors.email.message)}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-0.5">
                  {t('Address')}
                </label>
                <textarea
                  {...register('address')}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm md:text-base font-medium focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200 resize-none"
                  rows="3"
                  placeholder={t("Enter Address")}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending || (isEditMode && !isDirty)}
                  className="cursor-pointer w-full bg-[#093C5D] hover:bg-[#082a42] text-white rounded-lg px-5 py-2.5 font-semibold text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all shadow-none"
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
