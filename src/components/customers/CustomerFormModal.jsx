import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const customerSchema = yup.object({
  name: yup.string().required('Name is required'),
  phone: yup.string().matches(/^[0-9]{10}$/, 'Must be a 10-digit number').required('Phone is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  address: yup.string().nullable(),
});

const CustomerFormModal = ({ isOpen, isEditMode, editingCustomer, onClose, onSubmit, isPending }) => {
  const { t } = useTranslation();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
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
        reset({});
      }
    }
  }, [isOpen, isEditMode, editingCustomer, reset]);

  if (!isOpen) return null;

  const handleClose = () => {
    reset({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-6 md:py-8">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-modal-overlay" onClick={handleClose} />
        <div className="relative bg-white rounded-xl border border-gray-200 max-w-md w-full p-5 md:p-6 animate-modal-content">
          <div className="flex items-center justify-between mb-4 md:mb-5 pb-4 border-b border-gray-200">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900">
              {isEditMode ? t('Edit Customer') : t('Add New Customer')}
            </h3>
            <button onClick={handleClose} className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors active:scale-90">
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-800 mb-2">{t('Full Name')}</label>
              <input
                {...register('name')}
                className={`w-full rounded-xl border px-4 py-2.5 md:py-3 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none ${errors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#093C5D] focus:border-[#093C5D]'}`}
                placeholder={t("Enter customer name")}
              />
              {errors.name && (
                <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium flex items-start gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-[1px]" />
                  <span className="leading-snug">{errors.name.message}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-800 mb-2">{t('Phone Number')}</label>
              <input
                {...register('phone')}
                className={`w-full rounded-xl border px-4 py-2.5 md:py-3 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 ${errors.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#093C5D] focus:border-[#093C5D]'}`}
                placeholder="10-digit number"
                disabled={isEditMode}
              />
              {errors.phone && (
                <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium flex items-start gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-[1px]" />
                  <span className="leading-snug">{errors.phone.message}</span>
                </p>
              )}
              {isEditMode && <p className="text-xs text-gray-500 mt-1.5 font-medium">{t('Phone number cannot be changed')}</p>}
            </div>

            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-800 mb-2">
                {t('Email')} <span className="text-red-500">*</span>
              </label>
              <input
                {...register('email')}
                className={`w-full rounded-xl border px-4 py-2.5 md:py-3 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#093C5D] focus:border-[#093C5D]'}`}
                placeholder="customer@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium flex items-start gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-[1px]" />
                  <span className="leading-snug">{errors.email.message}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-800 mb-2">
                {t('Address')} <span className="text-gray-500 font-medium">({t('Optional')})</span>
              </label>
              <textarea
                {...register('address')}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 md:py-3 text-sm md:text-base font-medium focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200 resize-none"
                rows="3"
                placeholder={t("Enter address")}
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="cursor-pointer w-full bg-[#093C5D] hover:bg-[#082a42] text-white rounded-lg px-5 md:px-6 py-2.5 md:py-3 font-semibold text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 active:scale-95 transition-all shadow-lg"
            >
              {isPending ? t('Saving...') : isEditMode ? t('Update Customer') : t('Save Customer')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerFormModal;
