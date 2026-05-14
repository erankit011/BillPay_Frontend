import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Plus, Search, FileText, Send, X, Loader2 } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

const createBillSchema = yup.object({
  customerId: yup.string().required('Customer is required'),
  products: yup.array().of(
    yup.object({
      productId: yup.string().required('Product is required'),
      quantity: yup.number().min(1, 'Min quantity 1').required(),
    })
  ).min(1, 'Add at least one product'),
  amountPaid: yup.number().min(0, 'Cannot be negative').default(0),
});

const Bills = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['bills'],
    queryFn: async () => {
      const res = await api.get('/bills');
      return res.data.data;
    }
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/customers');
      return res.data.data;
    }
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products');
      return res.data.data;
    }
  });

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm({
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
      setIsModalOpen(false);
      reset();
    }
  });

  const handleCreateBill = (data) => {
    mutation.mutate(data);
  };

  const handleSendInvoice = async (billId) => {
    try {
      await api.post(`/invoices/generate/${billId}`);
      alert(t('Invoice generated and sent via WhatsApp successfully!'));
    } catch (err) {
      alert(t('Failed to send invoice'));
    }
  };

  const filteredBills = bills.filter(b => 
    b.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (b.customerId && b.customerId.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">{t('Billing & Invoices')}</h1>
          <p className="text-slate-500 text-sm">{t('Create bills and send WhatsApp invoices')}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center shadow-sm w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('Create New Bill')}
        </button>
      </div>

      <div className="relative w-full md:max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder={t("Search by invoice number or customer...")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : filteredBills.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>{t('No bills found. Create your first bill!')}</p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-[800px] w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">{t('Invoice')}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">{t('Customer')}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">{t('Date')}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">{t('Amount')}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">{t('Status')}</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 tracking-wider">{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredBills.map((bill, idx) => (
                    <tr key={bill._id} className="hover:bg-slate-50 transition-colors animate-fade-in group" style={{ animationDelay: `${idx * 50}ms` }}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600">
                        {bill.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-800 font-medium">{bill.customerId?.name || t('Walk-in Customer')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(bill.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">
                        {formatCurrency(bill.grandTotal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${bill.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 
                            bill.paymentStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-800' : 
                            'bg-rose-100 text-rose-800'}`}>
                          {bill.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleSendInvoice(bill._id)}
                          className="text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 px-3 py-1.5 rounded-lg flex items-center justify-center ml-auto transition-colors"
                        >
                          <Send className="w-4 h-4 mr-1" /> {t('Send')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredBills.map((bill, idx) => (
                <div key={bill._id} className="p-4 animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{bill.customerId?.name || t('Walk-in Customer')}</h4>
                      <p className="text-xs font-semibold text-indigo-600 mt-1">{bill.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-800">{formatCurrency(bill.grandTotal)}</p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(bill.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <span className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-md 
                          ${bill.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 
                            bill.paymentStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-800' : 
                            'bg-rose-100 text-rose-800'}`}>
                      {bill.paymentStatus}
                    </span>
                    <button 
                      onClick={() => handleSendInvoice(bill._id)}
                      className="text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 px-3 py-1.5 rounded-lg flex items-center text-xs font-semibold transition-colors"
                    >
                      <Send className="w-3.5 h-3.5 mr-1" /> {t('Send')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl sm:align-middle relative z-10 animate-scale-in">
              <div className="flex items-center justify-between mb-5 pb-4 border-b">
                <h3 className="text-xl font-semibold text-slate-800">{t('Create New Bill')}</h3>
                <button onClick={() => setIsModalOpen(false)} className="hover:bg-slate-100 p-1 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400 hover:text-slate-700" /></button>
              </div>
              <form onSubmit={handleSubmit(handleCreateBill)} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('Select Customer')}</label>
                  <select {...register('customerId')} className="mt-1 block w-full rounded-xl bg-white border border-slate-200 px-3 py-2.5">
                    <option value="">-- {t('Choose Customer')} --</option>
                    {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>)}
                  </select>
                  {errors.customerId && <p className="text-red-500 text-xs mt-1">{errors.customerId.message}</p>}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('Products')}</label>
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-center">
                      <select {...register(`products.${index}.productId`)} className="flex-1 rounded-xl bg-white border border-slate-200 px-3 py-2.5">
                        <option value="">-- {t('Product')} --</option>
                        {products.map(p => <option key={p._id} value={p._id}>{p.name} - ₹{p.price}</option>)}
                      </select>
                      <input type="number" {...register(`products.${index}.quantity`)} placeholder="Qty" className="w-24 rounded-xl bg-white border border-slate-200 px-3 py-2.5" />
                      <button type="button" onClick={() => remove(index)} className="text-red-500 hover:bg-red-50 p-2 rounded-xl"><X className="w-5 h-5"/></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => append({ productId: '', quantity: 1 })} className="text-slate-800 text-sm font-medium hover:underline">+ {t('Add another product')}</button>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('Amount Paid (Advance)')}</label>
                  <input type="number" {...register('amountPaid')} className="mt-1 block w-full rounded-xl bg-white border border-slate-200 px-3 py-2.5" />
                </div>

                <button type="submit" disabled={mutation.isPending} className="w-full bg-indigo-600 text-white rounded-xl py-3 font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {mutation.isPending ? t('Processing...') : t('Generate Bill')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bills;
