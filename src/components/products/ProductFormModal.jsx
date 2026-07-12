import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const productSchema = yup.object({
  name: yup.string().required('Name is required'),
  price: yup.number().min(0, 'Price cannot be negative').required('Price is required'),
  stock: yup.number().min(0, 'Stock cannot be negative').required('Stock is required'),
});

const ProductFormModal = ({ isOpen, editingProduct, onClose, onSubmit, isPending }) => {
  const { t } = useTranslation();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="fixed inset-0 bg-black/30 animate-modal-overlay" onClick={handleClose} />
        <div className="relative bg-white rounded-xl border border-gray-200 max-w-md w-full p-5 md:p-6 animate-modal-content">
          <div className="flex items-center justify-between mb-4 md:mb-5 pb-4 border-b border-gray-200">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900">
              {editingProduct ? t('Edit Product') : t('Add New Product')}
            </h3>
            <button onClick={handleClose} className="cursor-pointer text-gray-400 hover:text-gray-600 active:scale-90 transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-1.5">{t('Product Name')}</label>
              <input 
                {...register('name')}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm md:text-base font-medium focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200"
                placeholder="e.g. Atta 5kg"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1.5 font-semibold">{errors.name.message}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-sm md:text-base font-semibold text-gray-700 mb-1.5">{t('Price (₹)')}</label>
                <input 
                  type="number"
                  step="0.01"
                  {...register('price')}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm md:text-base font-medium focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200"
                  placeholder="0.00"
                />
                {errors.price && <p className="text-red-500 text-xs mt-1.5 font-semibold">{errors.price.message}</p>}
              </div>
              <div>
                <label className="block text-sm md:text-base font-semibold text-gray-700 mb-1.5">{t('Stock Qty')}</label>
                <input 
                  type="number"
                  {...register('stock')}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm md:text-base font-medium focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200"
                  placeholder="0"
                />
                {errors.stock && <p className="text-red-500 text-xs mt-1.5 font-semibold">{errors.stock.message}</p>}
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isPending}
              className="cursor-pointer w-full bg-[#093C5D] hover:bg-[#082a42] text-white rounded-full px-5 md:px-6 py-2.5 md:py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 active:scale-95 transition-all text-sm md:text-base"
            >
              {isPending ? t('Saving...') : t('Save Product')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductFormModal;
