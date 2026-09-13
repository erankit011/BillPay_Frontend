import React, { useState, useEffect } from 'react';
import { X, Plus, Loader2, AlertCircle } from 'lucide-react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import SearchableSelect from '../common/SearchableSelect';

const createBillSchema = yup.object({
  customerId: yup.string().required('Customer is required'),
  products: yup.array().of(
    yup.object({
      productId: yup.string().required('Product is required'),
      quantity: yup.number().transform((value, originalValue) => String(originalValue).trim() === '' ? undefined : value).min(1, 'Min quantity 1').required(),
    })
  ).min(1, 'Add at least one product'),
  amountPaid: yup.number().transform((value, originalValue) => String(originalValue).trim() === '' ? undefined : value).min(0, 'Cannot be negative').default(0),
});

const CreateBillModal = ({ isModalOpen, setIsModalOpen, customers, products }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '' });
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });
  const [customerError, setCustomerError] = useState('');
  const [productError, setProductError] = useState('');

  const { register, handleSubmit, control, formState: { errors }, reset, setValue, getValues } = useForm({
    resolver: yupResolver(createBillSchema),
    defaultValues: {
      products: [{ productId: '', quantity: 1 }],
      amountPaid: 0
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'products' });

  const mutation = useMutation({
    mutationFn: (newBill) => api.post('/bills', newBill),
    onSuccess: () => {
      queryClient.invalidateQueries(['bills']);
      queryClient.invalidateQueries(['customers']);
      queryClient.invalidateQueries(['products']);
      setIsModalOpen(false);
      reset();
    }
  });

  const addProductMutation = useMutation({
    mutationFn: (prod) => api.post('/products', prod),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['products']);
      setIsAddProductOpen(false);
      setNewProduct({ name: '', price: '', stock: '' });
      setProductError('');
      if (res.data?.data?._id) {
        const newId = res.data.data._id;
        const currentProducts = getValues('products') || [];
        const emptyIndex = currentProducts.findIndex(p => !p.productId);
        if (emptyIndex !== -1) { setValue(`products.${emptyIndex}.productId`, newId); }
        else { append({ productId: newId, quantity: 1 }); }
      }
    },
    onError: (err) => { setProductError(err.response?.data?.message || err.message); }
  });

  const addCustomerMutation = useMutation({
    mutationFn: (cust) => api.post('/customers', cust),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['customers']);
      setIsAddCustomerOpen(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '' });
      setCustomerError('');
      if (res.data?.data?._id) { setValue('customerId', res.data.data._id); }
    },
    onError: (err) => { setCustomerError(err.response?.data?.message || err.message); }
  });

  const handleAddProduct = (e) => {
    e.preventDefault();
    setProductError('');
    if (!newProduct.name || newProduct.price === '' || newProduct.stock === '') {
      setProductError(t('Please fill all product fields')); return;
    }
    addProductMutation.mutate({ name: newProduct.name, price: Number(newProduct.price), stock: Number(newProduct.stock) });
  };

  const handleAddCustomer = (e) => {
    e.preventDefault();
    setCustomerError('');
    if (!newCustomer.name || !newCustomer.phone) {
      setCustomerError(t('Please fill required customer fields (Name and Phone)')); return;
    }
    addCustomerMutation.mutate({ name: newCustomer.name, phone: newCustomer.phone, email: newCustomer.email, address: newCustomer.address });
  };

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  if (!isModalOpen) return null;

  const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors outline-none";

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay" onClick={() => setIsModalOpen(false)} />

      {/* Mobile: bottom sheet | sm+: centered modal */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-center sm:justify-center sm:px-4 sm:py-8">
        <div className="relative bg-white w-full sm:max-w-lg lg:max-w-2xl rounded-t-2xl sm:rounded-lg flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-gray-200 animate-modal-content overflow-hidden">

          {/* Drag handle — mobile only */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 pt-3 sm:pt-5 pb-3 sm:pb-4 border-b border-gray-100 flex-shrink-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">{t('Create New Bill')}</h3>
            <button
              onClick={() => setIsModalOpen(false)}
              className="cursor-pointer text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px]"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">
            <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4 sm:space-y-5">

              {/* Customer */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-gray-700">{t('Customer')}</label>
                  <button type="button" onClick={() => setIsAddCustomerOpen(!isAddCustomerOpen)}
                    className="cursor-pointer text-[#093C5D] text-xs font-semibold hover:underline flex items-center gap-1 active:scale-95 transition-transform">
                    <Plus className="w-3 h-3" /> {t('Create Customer')}
                  </button>
                </div>

                {isAddCustomerOpen && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 mb-3 animate-fade-in">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">{t('Quick Add Customer')}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <input type="text" placeholder={t('Full Name')} value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className={inputCls} />
                      <input type="text" placeholder={t('Phone Number')} value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className={inputCls} />
                      <input type="email" placeholder={t('Email')} value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} className={inputCls} />
                      <input type="text" placeholder={t('Address')} value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} className={inputCls} />
                    </div>
                    {customerError && <p className="text-red-500 text-xs mt-2 font-medium flex items-start gap-1"><AlertCircle className="w-3.5 h-3.5 shrink-0 mt-[1px]" /><span>{customerError}</span></p>}
                    <div className="flex justify-end gap-2 mt-3">
                      <button type="button" onClick={() => { setIsAddCustomerOpen(false); setCustomerError(''); }} className="cursor-pointer px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">{t('Cancel')}</button>
                      <button type="button" onClick={handleAddCustomer} disabled={addCustomerMutation.isPending} className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-white bg-[#093C5D] hover:bg-[#082a42] rounded-lg transition-colors disabled:opacity-50">{addCustomerMutation.isPending ? t('Saving...') : t('Save')}</button>
                    </div>
                  </div>
                )}

                <Controller name="customerId" control={control} render={({ field }) => (
                  <SearchableSelect options={customers.map(c => ({ value: c._id, label: `${c.name} +91 ${c.phone}` }))} value={field.value} onChange={field.onChange} placeholder={`${t('Select Customer')}`} searchPlaceholder={t('Search by name or phone...')} />
                )} />
                {errors.customerId && <p className="text-red-500 text-xs mt-1.5 font-medium flex items-start gap-1"><AlertCircle className="w-3.5 h-3.5 shrink-0 mt-[1px]" /><span>{errors.customerId.message}</span></p>}
              </div>

              {/* Products */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-gray-700">{t('Products')}</label>
                  <button type="button" onClick={() => setIsAddProductOpen(!isAddProductOpen)}
                    className="cursor-pointer text-[#093C5D] text-xs font-semibold hover:underline flex items-center gap-1 active:scale-95 transition-transform">
                    <Plus className="w-3 h-3" /> {t('Create Product')}
                  </button>
                </div>

                {isAddProductOpen && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 mb-3 animate-fade-in">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">{t('Quick Add Product')}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <input type="text" placeholder={t('Product Name')} value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className={`${inputCls} sm:col-span-2`} />
                      <input type="number" placeholder={t('Price')} value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className={inputCls} />
                      <input type="number" placeholder={t('Stock')} value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className={inputCls} />
                    </div>
                    {productError && <p className="text-red-500 text-xs mt-2 font-medium flex items-start gap-1"><AlertCircle className="w-3.5 h-3.5 shrink-0 mt-[1px]" /><span>{productError}</span></p>}
                    <div className="flex justify-end gap-2 mt-3">
                      <button type="button" onClick={() => { setIsAddProductOpen(false); setProductError(''); }} className="cursor-pointer px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">{t('Cancel')}</button>
                      <button type="button" onClick={handleAddProduct} disabled={addProductMutation.isPending} className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-white bg-[#093C5D] hover:bg-[#082a42] rounded-lg transition-colors disabled:opacity-50">{addProductMutation.isPending ? t('Saving...') : t('Save')}</button>
                    </div>
                  </div>
                )}

                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-center">
                    <div className="flex-1 min-w-0">
                      <Controller name={`products.${index}.productId`} control={control} render={({ field }) => (
                        <SearchableSelect options={products.map(p => ({ value: p._id, label: `${p.name} - ₹${p.price}` }))} value={field.value} onChange={field.onChange} placeholder={`${t('Select Product')}`} searchPlaceholder={t('Search by product name...')} />
                      )} />
                    </div>
                    <input type="number" {...register(`products.${index}.quantity`)} placeholder="1"
                      className="w-16 sm:w-20 font-medium rounded-lg border border-gray-300 px-2 py-2.5 text-sm text-center text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors outline-none" />
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(index)} className="cursor-pointer bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 font-semibold p-2.5 sm:p-2 rounded-full active:scale-95 transition-all flex-shrink-0 flex items-center justify-center min-w-[36px] sm:min-w-[40px] shadow-none">
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    )}
                  </div>
                ))}

                <button type="button" onClick={() => append({ productId: '', quantity: 1 })}
                  className="cursor-pointer w-full sm:w-auto mt-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-[#093C5D] bg-[#093C5D]/5 hover:bg-[#093C5D]/10 rounded-lg transition-all active:scale-95 border border-dashed border-[#093C5D]/20">
                  <Plus className="w-3.5 h-3.5" /> {t('Add Another Product')}
                </button>
              </div>

              {/* Amount Paid */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Amount Paid (Advance)')}</label>
                <input type="number" {...register('amountPaid')} className={inputCls} placeholder="0.00" />
              </div>

              {/* Submit */}
              <button type="submit" disabled={mutation.isPending}
                className="cursor-pointer w-full bg-[#093C5D] hover:bg-[#082a42] text-white rounded-lg py-3 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all">
                {mutation.isPending ? (
                  <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('Processing...')}</span>
                ) : t('Generate Bill')}
              </button>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBillModal;
