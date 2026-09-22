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
  paymentMode: yup.string().when('amountPaid', {
    is: (val) => val > 0,
    then: () => yup.string().required('Payment mode is required when amount is paid'),
    otherwise: () => yup.string()
  })
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

  const { register, handleSubmit, control, formState: { errors }, reset, setValue, getValues, watch } = useForm({
    resolver: yupResolver(createBillSchema),
    defaultValues: {
      products: [{ productId: '', quantity: 1 }],
      amountPaid: 0,
      paymentMode: 'CASH'
    }
  });

  const formProducts = watch('products') || [];
  const totalAmount = formProducts.reduce((sum, item) => {
    if (item.productId && item.quantity) {
      const p = products.find(prod => prod._id === item.productId);
      if (p) sum += p.price * Number(item.quantity);
    }
    return sum;
  }, 0);

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
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
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
              className="cursor-pointer text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px] border border-gray-200"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">
            <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="flex flex-col gap-5 sm:gap-6">

              {/* Customer */}
              <div>
                <div className="flex items-end justify-between mb-1.5 sm:mb-2">
                  <label className="block text-xs sm:text-[13px] font-medium text-gray-700">
                    {t('Customer')} <span className="text-red-500">*</span>
                  </label>
                  <button type="button" onClick={() => setIsAddCustomerOpen(!isAddCustomerOpen)}
                    className="cursor-pointer bg-[#093C5D]/5 text-[#093C5D] border border-[#093C5D]/20 hover:bg-[#093C5D]/10 h-6 sm:h-7 !min-h-[24px] sm:!min-h-[28px] px-2 sm:px-2.5 rounded-lg text-[10px] sm:text-[11px] leading-none font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all">
                    <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {t('Create Customer')}
                  </button>
                </div>

                {isAddCustomerOpen && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 mb-3 animate-fade-in">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">{t('Quick Add Customer')}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <input type="text" placeholder={t('Full Name')} value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} className={inputCls} />
                      <input type="text" placeholder={t('Phone Number')} value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} className={inputCls} />
                      <input type="email" placeholder={t('Email')} value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} className={inputCls} />
                      <input type="text" placeholder={t('Address')} value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} className={inputCls} />
                    </div>
                    {customerError && (
                      <p className="text-red-500 text-[11px] sm:text-xs mt-2 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="leading-none pt-[1px]">{t(customerError)}</span>
                      </p>
                    )}
                    <div className="flex justify-end gap-2 mt-3">
                      <button type="button" onClick={() => { setIsAddCustomerOpen(false); setCustomerError(''); }} className="cursor-pointer h-7 sm:h-8 !min-h-[28px] sm:!min-h-[32px] px-3 sm:px-4 flex items-center justify-center text-[11px] sm:text-xs leading-none font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">{t('Cancel')}</button>
                      <button type="button" onClick={handleAddCustomer} disabled={addCustomerMutation.isPending} className="cursor-pointer h-7 sm:h-8 !min-h-[28px] sm:!min-h-[32px] px-3 sm:px-4 flex items-center justify-center text-[11px] sm:text-xs leading-none font-semibold text-white bg-[#093C5D] hover:bg-[#082a42] rounded-lg transition-colors disabled:opacity-50">{addCustomerMutation.isPending ? t('Saving...') : t('Save')}</button>
                    </div>
                  </div>
                )}

                <Controller name="customerId" control={control} render={({ field }) => (
                  <SearchableSelect options={customers.map(c => ({ value: c._id, label: `${c.name} +91 ${c.phone}` }))} value={field.value} onChange={field.onChange} placeholder={`${t('Select Customer')}`} searchPlaceholder={t('Search by name or phone...')} />
                )} />
                {errors.customerId && (
                  <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="leading-none pt-[1px]">{t(errors.customerId.message)}</span>
                  </p>
                )}
              </div>

              {/* Products */}
              <div className="space-y-2.5">
                <div className="flex items-end justify-between mb-1.5 sm:mb-2">
                  <label className="block text-xs sm:text-[13px] font-medium text-gray-700">
                    {t('Products')} <span className="text-red-500">*</span>
                  </label>
                  <button type="button" onClick={() => setIsAddProductOpen(!isAddProductOpen)}
                    className="cursor-pointer bg-[#093C5D]/5 text-[#093C5D] border border-[#093C5D]/20 hover:bg-[#093C5D]/10 h-6 sm:h-7 !min-h-[24px] sm:!min-h-[28px] px-2 sm:px-2.5 rounded-lg text-[10px] sm:text-[11px] leading-none font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all">
                    <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {t('Create Product')}
                  </button>
                </div>

                {isAddProductOpen && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 mb-3 animate-fade-in">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">{t('Quick Add Product')}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <input type="text" placeholder={t('Product Name')} value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className={`${inputCls} sm:col-span-2`} />
                      <input type="number" placeholder={t('Price')} value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} className={inputCls} />
                      <input type="number" placeholder={t('Stock')} value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} className={inputCls} />
                    </div>
                    {productError && (
                      <p className="text-red-500 text-[11px] sm:text-xs mt-2 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="leading-none pt-[1px]">{t(productError)}</span>
                      </p>
                    )}
                    <div className="flex justify-end gap-2 mt-3">
                      <button type="button" onClick={() => { setIsAddProductOpen(false); setProductError(''); }} className="cursor-pointer h-7 sm:h-8 !min-h-[28px] sm:!min-h-[32px] px-3 sm:px-4 flex items-center justify-center text-[11px] sm:text-xs leading-none font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">{t('Cancel')}</button>
                      <button type="button" onClick={handleAddProduct} disabled={addProductMutation.isPending} className="cursor-pointer h-7 sm:h-8 !min-h-[28px] sm:!min-h-[32px] px-3 sm:px-4 flex items-center justify-center text-[11px] sm:text-xs leading-none font-semibold text-white bg-[#093C5D] hover:bg-[#082a42] rounded-lg transition-colors disabled:opacity-50">{addProductMutation.isPending ? t('Saving...') : t('Save')}</button>
                    </div>
                  </div>
                )}

                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <div className="flex-1 min-w-0">
                      <Controller name={`products.${index}.productId`} control={control} render={({ field }) => (
                        <SearchableSelect options={products.map(p => ({ value: p._id, label: `${p.name} - ₹${p.price}` }))} value={field.value} onChange={field.onChange} placeholder={`${t('Select Product')}`} searchPlaceholder={t('Search by product name...')} />
                      )} />
                      {errors.products?.[index]?.productId && (
                        <p className="text-red-500 text-[11px] sm:text-xs mt-1 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span className="leading-none pt-[1px]">{t(errors.products[index].productId.message)}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <input type="number" {...register(`products.${index}.quantity`)} placeholder="1"
                        className="w-16 sm:w-20 font-medium rounded-lg border border-gray-300 px-2 py-2.5 text-sm text-center text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors outline-none" />
                      {errors.products?.[index]?.quantity && (
                        <p className="text-red-500 text-[11px] sm:text-xs mt-1 font-medium text-center">
                          {t(errors.products[index].quantity.message)}
                        </p>
                      )}
                    </div>
                    {fields.length > 1 && (
                      <div className="h-[42px] flex items-center">
                        <button type="button" onClick={() => remove(index)} className="cursor-pointer text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-700 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px] border border-red-200">
                          <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                <button type="button" onClick={() => append({ productId: '', quantity: 1 })}
                  className="cursor-pointer w-full sm:w-auto mt-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 !min-h-[32px] sm:!min-h-[36px] text-xs sm:text-sm font-semibold text-[#093C5D] bg-[#093C5D]/5 hover:bg-[#093C5D]/10 rounded-lg transition-all active:scale-95 border border-dashed border-[#093C5D]/20">
                  <Plus className="w-3.5 h-3.5" /> {t('Add Another Product')}
                </button>
              </div>

              {/* Total Amount Display */}
              <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3">
                <span className="text-sm font-medium text-[#093C5D]">{t('Total Bill Amount')}</span>
                <span className="text-base sm:text-lg font-semibold text-[#093C5D]">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>

              {/* Amount & Payment Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-0.5">
                    {t('Payment Mode')}
                  </label>
                  <select {...register('paymentMode')} className={inputCls}>
                    <option value="CASH">{t('Cash')}</option>
                    <option value="UPI">{t('UPI')}</option>
                    <option value="BANK_TRANSFER">{t('Bank Transfer')}</option>
                    <option value="CHEQUE">{t('Cheque')}</option>
                    <option value="CREDIT">{t('Credit')}</option>
                  </select>
                  {errors.paymentMode && (
                    <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="leading-none pt-[1px]">{t(errors.paymentMode.message)}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-0.5">
                    {t('Amount Paid')} <span className="text-red-500">*</span>
                  </label>
                  <input type="number" {...register('amountPaid')} className={inputCls} placeholder="0" />
                  {errors.amountPaid && (
                    <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="leading-none pt-[1px]">{t(errors.amountPaid.message)}</span>
                    </p>
                  )}
                </div>
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
