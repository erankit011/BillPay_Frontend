import React, { useState } from 'react';
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

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'products'
  });

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
        if (emptyIndex !== -1) {
          setValue(`products.${emptyIndex}.productId`, newId);
        } else {
          append({ productId: newId, quantity: 1 });
        }
      }
    },
    onError: (err) => {
      const errorMsg = err.response?.data?.message || err.message;
      setProductError(errorMsg);
    }
  });

  const handleAddProduct = (e) => {
    e.preventDefault();
    setProductError('');
    if (!newProduct.name || newProduct.price === '' || newProduct.stock === '') {
      setProductError(t('Please fill all product fields'));
      return;
    }
    addProductMutation.mutate({
      name: newProduct.name,
      price: Number(newProduct.price),
      stock: Number(newProduct.stock)
    });
  };

  const addCustomerMutation = useMutation({
    mutationFn: (cust) => api.post('/customers', cust),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['customers']);
      setIsAddCustomerOpen(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '' });
      setCustomerError('');
      
      if (res.data?.data?._id) {
        setValue('customerId', res.data.data._id);
      }
    },
    onError: (err) => {
      const errorMsg = err.response?.data?.message || err.message;
      setCustomerError(errorMsg);
    }
  });

  const handleAddCustomer = (e) => {
    e.preventDefault();
    setCustomerError('');
    if (!newCustomer.name || !newCustomer.phone) {
      setCustomerError(t('Please fill required customer fields (Name and Phone)'));
      return;
    }
    addCustomerMutation.mutate({
      name: newCustomer.name,
      phone: newCustomer.phone,
      email: newCustomer.email,
      address: newCustomer.address
    });
  };

  const handleCreateBill = (data) => {
    mutation.mutate(data);
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-3 md:px-4 py-6 md:py-8">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-modal-overlay" onClick={() => setIsModalOpen(false)} />
        <div className="relative bg-white border border-gray-200 rounded-xl max-w-2xl w-full p-5 md:p-6 lg:p-8 animate-modal-content">
          <div className="flex items-center justify-between mb-5 md:mb-6 pb-4 md:pb-5 border-b border-gray-200">
            <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">{t('Create New Bill')}</h3>
            <button
              onClick={() => setIsModalOpen(false)}
              className="cursor-pointer text-gray-400 hover:text-gray-600 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all active:scale-95 flex-shrink-0"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit(handleCreateBill)} className="space-y-4 md:space-y-5">
            {/* Customer Select */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs md:text-sm font-semibold text-gray-800">{t('Select Customer')}</label>
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(!isAddCustomerOpen)}
                  className="cursor-pointer text-[#093C5D] text-xs font-semibold hover:underline flex items-center active:scale-95 transition-transform"
                >
                  <Plus className="w-3 h-3 mr-1" /> {t('New Customer')}
                </button>
              </div>

              {isAddCustomerOpen && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4 mb-3 animate-fade-in">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">{t('Quick Add Customer')}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                    <input
                      type="text"
                      placeholder={t('Full Name *')}
                      value={newCustomer.name}
                      onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D]"
                    />
                    <input
                      type="text"
                      placeholder={t('Phone Number *')}
                      value={newCustomer.phone}
                      onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D]"
                    />
                    <input
                      type="email"
                      placeholder={t('Email *')}
                      value={newCustomer.email}
                      onChange={e => setNewCustomer({...newCustomer, email: e.target.value})}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D]"
                    />
                    <input
                      type="text"
                      placeholder={t('Address (Optional)')}
                      value={newCustomer.address}
                      onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D]"
                    />
                  </div>
                  {customerError && (
                    <p className="text-red-500 text-[11px] sm:text-xs mt-2 font-medium flex items-start gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-[1px]" />
                      <span className="leading-snug">{customerError}</span>
                    </p>
                  )}
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddCustomerOpen(false);
                        setCustomerError('');
                      }}
                      className="cursor-pointer px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      {t('Cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCustomer}
                      disabled={addCustomerMutation.isPending}
                      className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-white bg-[#093C5D] hover:bg-[#082a42] rounded-md transition-colors disabled:opacity-50"
                    >
                      {addCustomerMutation.isPending ? t('Saving...') : t('Save')}
                    </button>
                  </div>
                </div>
              )}

              <Controller
                name="customerId"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    options={customers.map(c => ({ value: c._id, label: `${c.name} (${c.phone})` }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={`-- ${t('Select Customer')} --`}
                    searchPlaceholder={t('Search by name or phone...')}
                  />
                )}
              />
              {errors.customerId && (
                <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium flex items-start gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-[1px]" />
                  <span className="leading-snug">{errors.customerId.message}</span>
                </p>
              )}
            </div>

            {/* Products */}
            <div className="space-y-2.5 md:space-y-3">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs md:text-sm font-semibold text-gray-800">{t('Products')}</label>
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(!isAddProductOpen)}
                  className="cursor-pointer text-[#093C5D] text-xs font-semibold hover:underline flex items-center active:scale-95 transition-transform"
                >
                  <Plus className="w-3 h-3 mr-1" /> {t('New Product')}
                </button>
              </div>
              
              {isAddProductOpen && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4 mb-3 animate-fade-in">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">{t('Quick Add Product')}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
                    <input
                      type="text"
                      placeholder={t('Product Name')}
                      value={newProduct.name}
                      onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D]"
                    />
                    <input
                      type="number"
                      placeholder={t('Price')}
                      value={newProduct.price}
                      onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D]"
                    />
                    <input
                      type="number"
                      placeholder={t('Stock')}
                      value={newProduct.stock}
                      onChange={e => setNewProduct({...newProduct, stock: e.target.value})}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D]"
                    />
                  </div>
                  {productError && (
                    <p className="text-red-500 text-[11px] sm:text-xs mt-2 font-medium flex items-start gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-[1px]" />
                      <span className="leading-snug">{productError}</span>
                    </p>
                  )}
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddProductOpen(false);
                        setProductError('');
                      }}
                      className="cursor-pointer px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      {t('Cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={handleAddProduct}
                      disabled={addProductMutation.isPending}
                      className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-white bg-[#093C5D] hover:bg-[#082a42] rounded-md transition-colors disabled:opacity-50"
                    >
                      {addProductMutation.isPending ? t('Saving...') : t('Save')}
                    </button>
                  </div>
                </div>
              )}
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <div className="flex-1 min-w-0">
                    <Controller
                      name={`products.${index}.productId`}
                      control={control}
                      render={({ field }) => (
                        <SearchableSelect
                          options={products.map(p => ({ value: p._id, label: `${p.name} - ₹${p.price}` }))}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={`-- ${t('Select Product')} --`}
                          searchPlaceholder={t('Search by product name...')}
                        />
                      )}
                    />
                  </div>
                  <input
                    type="number"
                    {...register(`products.${index}.quantity`)}
                    placeholder="Qty"
                    className="w-25 sm:w-20 font-medium rounded-lg sm:rounded-lg border border-gray-300 px-2 sm:px-3 py-2.5 sm:py-3 text-xs sm:text-sm focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-all"
                  />
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="cursor-pointer text-red-500 hover:bg-red-50 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl active:scale-95 transition-all flex-shrink-0"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => append({ productId: '', quantity: 1 })}
                className="cursor-pointer text-[#093C5D] text-xs hover:underline sm:text-sm font-semibold hover:text-[#082a42] flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t('Add Another product')}
              </button>
            </div>

            {/* Amount Paid */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">{t('Amount Paid (Advance)')}</label>
              <input
                type="number"
                {...register('amountPaid')}
                className="w-full rounded-lg font-medium sm:rounded-lg border border-gray-300 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-all"
                placeholder="0"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="cursor-pointer w-full bg-[#093C5D] hover:bg-[#082a42] text-white rounded-lg py-2.5 sm:py-3 md:py-3.5 font-semibold text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-[0.98] transition-all"
            >
              {mutation.isPending ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                  {t('Processing...')}
                </span>
              ) : (
                t('Generate Bill')
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateBillModal;
