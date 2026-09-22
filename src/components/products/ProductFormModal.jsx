import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const productSchema = yup.object({
  name: yup.string().required('Name is required'),
  price: yup.number().transform((value, originalValue) => String(originalValue).trim() === '' ? undefined : value).min(0, 'Price cannot be negative').required('Price is required'),
  stock: yup.number().transform((value, originalValue) => String(originalValue).trim() === '' ? undefined : value).min(0, 'Stock cannot be negative').required('Stock is required'),
});

const ProductFormModal = ({ isOpen, editingProduct, onClose, onSubmit, isPending }) => {
  const { t } = useTranslation();

  const { register, handleSubmit, reset, setValue, formState: { errors, isDirty } } = useForm({
    resolver: yupResolver(productSchema),
    defaultValues: editingProduct ? {
      name: editingProduct.name,
      price: editingProduct.price,
      stock: editingProduct.stock
    } : {}
  });

  React.useEffect(() => {
    if (isOpen) {
      if (editingProduct) {
        reset({
          name: editingProduct.name,
          price: editingProduct.price,
          stock: editingProduct.stock
        });
      } else {
        reset({});
      }
    }
  }, [isOpen, editingProduct, reset]);

  if (!isOpen) return null;

  const handleClose = () => {
    reset({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay" onClick={handleClose} />

      {/* Mobile: bottom sheet | sm+: centered modal */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-center sm:justify-center sm:px-4 sm:py-8 z-50 pointer-events-none">
        <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-lg flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-gray-200 animate-modal-content overflow-hidden pointer-events-auto shadow-none">

          {/* Drag handle — mobile only */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
          </div>

          <div className="flex items-center justify-between px-5 md:px-6 py-4 md:py-5 border-b border-gray-100 flex-shrink-0">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900">
              {editingProduct ? t('Edit Product') : t('Add New Product')}
            </h3>
            <button onClick={handleClose} className="cursor-pointer text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px] border border-gray-200">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <div className="p-5 md:p-6 overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-0.5">
                  {t('Product Name')} <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('name')}
                  className={`block w-full rounded-lg border px-3 py-2.5 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none ${errors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#093C5D] focus:border-[#093C5D]'}`}
                  placeholder="e.g. Atta 5kg"
                />
                {errors.name && (
                  <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="leading-none pt-[1px]">{t(errors.name.message)}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-0.5">
                    {t('Price (₹)')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('price')}
                    className={`block w-full rounded-lg border px-3 py-2.5 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none ${errors.price ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#093C5D] focus:border-[#093C5D]'}`}
                    placeholder="0"
                  />
                  {errors.price && (
                    <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="leading-none pt-[1px]">{t(errors.price.message)}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-0.5">
                    {t('Stock Qty')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    {...register('stock')}
                    className={`block w-full rounded-lg border px-3 py-2.5 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none ${errors.stock ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#093C5D] focus:border-[#093C5D]'}`}
                    placeholder="0"
                  />
                  {errors.stock && (
                    <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="leading-none pt-[1px]">{t(errors.stock.message)}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 md:pt-3">
                <button
                  type="submit"
                  disabled={isPending || (editingProduct && !isDirty)}
                  className="cursor-pointer w-full bg-[#093C5D] hover:bg-[#082a42] text-white rounded-lg px-4 md:px-5 py-2.5 md:py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 active:scale-95 transition-all text-[13px] sm:text-sm"
                >
                  {isPending ? t('Saving...') : (editingProduct ? t('Update Product') : t('Save Product'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFormModal;
