import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../api/axios';
import { Plus, Search, Phone, User, X, IndianRupee, History, ArrowDownRight, ArrowUpRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const customerSchema = yup.object({
  name: yup.string().required('Name is required'),
  phone: yup.string().matches(/^[0-9]{10}$/, 'Must be a 10-digit number').required('Phone is required'),
  email: yup.string().email('Invalid email').nullable(),
  address: yup.string().nullable(),
});

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

const CustomerLedger = ({ customer, onClose }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [txType, setTxType] = useState('PAYMENT'); // 'PAYMENT' or 'UDHAR'
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', customer._id],
    queryFn: async () => {
      const res = await api.get(`/transactions/customer/${customer._id}`);
      return res.data.data;
    }
  });

  const mutation = useMutation({
    mutationFn: (newTx) => api.post('/transactions', newTx),
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions', customer._id]);
      queryClient.invalidateQueries(['customers']);
      setAmount('');
      setRemarks('');
    }
  });

  const handleTransaction = (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return alert(t('Enter valid amount'));
    mutation.mutate({
      customerId: customer._id,
      amount: Number(amount),
      type: txType,
      remarks
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="inline-block w-full max-w-3xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl relative z-10 flex flex-col h-[80vh] animate-scale-in">
          
          <div className="flex items-center justify-between p-6 border-b shrink-0 bg-gray-50/50">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{customer.name}</h3>
              <p className="text-gray-500 text-sm flex items-center mt-1"><Phone className="w-3 h-3 mr-1" /> {customer.phone}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500"><X className="w-6 h-6" /></button>
          </div>
          
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            {/* Ledger List */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4 flex items-center"><History className="w-4 h-4 mr-2"/> {t('Transaction History')}</h4>
              {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
              ) : transactions.length === 0 ? (
                <p className="text-gray-500 text-sm text-center p-8">{t('No transactions yet.')}</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map(tx => (
                    <div key={tx._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${tx.type === 'UDHAR' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                          {tx.type === 'UDHAR' ? <ArrowUpRight className="w-5 h-5"/> : <ArrowDownRight className="w-5 h-5"/>}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{tx.type === 'UDHAR' ? t('Udhar Given') : t('Payment Received')}</p>
                          <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString()} {tx.remarks && `• ${tx.remarks}`}</p>
                        </div>
                      </div>
                      <p className={`font-semibold ${tx.type === 'UDHAR' ? 'text-red-600' : 'text-green-600'}`}>
                        {tx.type === 'UDHAR' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Action Pane */}
            <div className="w-full md:w-80 bg-white p-6 border-t md:border-t-0 md:border-l flex flex-col shrink-0">
              <div className="mb-6 bg-gray-50 rounded-xl p-4 text-center border">
                <p className="text-sm text-gray-500 mb-1">{t('Current Pending Balance')}</p>
                <p className={`text-2xl font-semibold ${customer.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(customer.balance)}
                </p>
              </div>

              <h4 className="font-semibold text-gray-700 mb-4">{t('Add Entry')}</h4>
              <form onSubmit={handleTransaction} className="space-y-4 flex-1 flex flex-col">
                <div className="flex rounded-xl p-1 bg-gray-100">
                  <button type="button" onClick={() => setTxType('PAYMENT')} className={`flex-1 py-2 text-sm font-medium rounded-lg ${txType === 'PAYMENT' ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    {t('Received')}
                  </button>
                  <button type="button" onClick={() => setTxType('UDHAR')} className={`flex-1 py-2 text-sm font-medium rounded-lg ${txType === 'UDHAR' ? 'bg-white shadow text-red-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    {t('Gave Udhar')}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('Amount')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><IndianRupee className="h-4 w-4 text-gray-400" /></div>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500" placeholder="0.00" required />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('Remarks (Optional)')}</label>
                  <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} className="block w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500" placeholder={t("e.g. Paid in cash")} />
                </div>

                <div className="mt-auto pt-4">
                  <button type="submit" disabled={mutation.isPending} className={`w-full text-white rounded-xl py-3 font-medium shadow-sm transition-colors disabled:opacity-50 ${txType === 'PAYMENT' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                    {mutation.isPending ? t('Saving...') : txType === 'PAYMENT' ? t('Save Payment') : t('Add Udhar')}
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const Customers = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/customers');
      return res.data.data;
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(customerSchema)
  });

  const mutation = useMutation({
    mutationFn: (newCustomer) => api.post('/customers', newCustomer),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      setIsModalOpen(false);
      reset();
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('Customers')}</h1>
          <p className="text-gray-500 text-sm">{t('Manage your customers and balances')}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center shadow-sm w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('Add Customer')}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder={t("Search by name or phone...")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      {/* Responsive Customer List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t('No customers found.')}</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredCustomers.map((customer, idx) => (
              <div key={customer._id} className="p-4 hover:bg-indigo-50/50 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }} onClick={() => setSelectedCustomer(customer)}>
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xl shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{customer.name}</h3>
                    <div className="flex items-center text-gray-500 text-sm mt-1">
                      <Phone className="w-4 h-4 mr-1 opacity-70" />
                      {customer.phone}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-1/3 border-t sm:border-none pt-3 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <p className="text-sm text-gray-500">{t('Pending Balance')}</p>
                    <p className={`text-lg font-semibold ${customer.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(customer.balance)}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer); }}
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium bg-indigo-50 px-4 py-2 rounded-lg"
                  >
                    {t('View Ledger')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl sm:align-middle relative z-10 animate-scale-in">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-semibold text-gray-900">{t('Add New Customer')}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('Full Name')}</label>
                  <input 
                    {...register('name')}
                    className="mt-1 block w-full rounded-xl border-gray-300 border p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={t("Enter customer name")}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('Phone Number')}</label>
                  <input 
                    {...register('phone')}
                    className="mt-1 block w-full rounded-xl border-gray-300 border p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="10-digit number"
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email (Optional)</label>
                  <input 
                    {...register('email')}
                    className="mt-1 block w-full rounded-xl border-gray-300 border p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full inline-flex justify-center rounded-xl border border-transparent px-4 py-2.5 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
                  >
                    {mutation.isPending ? t('Saving...') : t('Save Customer')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Customer Ledger Modal */}
      {selectedCustomer && (
        <CustomerLedger customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
      )}
    </div>
  );
};

export default Customers;
