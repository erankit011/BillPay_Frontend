import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../api/axios';
import { Plus, Search, Phone, User, X, IndianRupee, History, ArrowDownRight, ArrowUpRight, Loader2, Edit, Trash2 } from 'lucide-react';
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
  const [txType, setTxType] = useState('PAYMENT');
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
      <div className="flex items-center justify-center min-h-screen px-4 py-6 md:py-8">
        <div className="fixed inset-0 bg-black/30 animate-modal-overlay" onClick={onClose} />
        <div className="relative bg-white rounded-xl border border-gray-200 max-w-4xl w-full max-h-[85vh] flex flex-col animate-modal-content">
          
          <div className="flex items-center justify-between p-5 md:p-6 border-b border-gray-200">
            <div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">{customer.name}</h3>
              <p className="text-gray-500 text-sm flex items-center mt-1 font-medium">
                <Phone className="w-3 h-3 mr-1" /> {customer.phone}
              </p>
            </div>
            <button onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors active:scale-90">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            {/* Ledger List */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6 bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4 flex items-center">
                <History className="w-4 h-4 mr-2"/> {t('Transaction History')}
              </h4>
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : transactions.length === 0 ? (
                <p className="text-gray-500 text-sm text-center p-8 font-medium">{t('No transactions yet.')}</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx, index) => (
                    <div 
                      key={tx._id} 
                      className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${tx.type === 'UDHAR' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                          {tx.type === 'UDHAR' ? <ArrowUpRight className="w-5 h-5"/> : <ArrowDownRight className="w-5 h-5"/>}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{tx.type === 'UDHAR' ? t('Udhar Given') : t('Payment Received')}</p>
                          <p className="text-xs text-gray-500 font-medium">{new Date(tx.createdAt).toLocaleString()} {tx.remarks && `• ${tx.remarks}`}</p>
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
            <div className="w-full md:w-80 bg-white p-5 md:p-6 border-t md:border-t-0 md:border-l border-gray-200">
              <div className="mb-6 bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                <p className="text-sm text-gray-500 mb-1 font-semibold">{t('Current Pending Balance')}</p>
                <p className={`text-2xl font-semibold ${customer.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(customer.balance)}
                </p>
              </div>

              <h4 className="font-semibold text-gray-700 mb-4">{t('Add Entry')}</h4>
              <form onSubmit={handleTransaction} className="space-y-4">
                <div className="flex rounded-xl p-1 bg-gray-100">
                  <button 
                    type="button" 
                    onClick={() => setTxType('PAYMENT')} 
                    className={`cursor-pointer flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${txType === 'PAYMENT' ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {t('Received')}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setTxType('UDHAR')} 
                    className={`cursor-pointer flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${txType === 'UDHAR' ? 'bg-white shadow text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {t('Gave Udhar')}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('Amount')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IndianRupee className="h-4 w-4 text-gray-400" />
                    </div>
                    <input 
                      type="number" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                      className="block w-full pl-9 pr-3 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium transition-colors duration-200" 
                      placeholder="0.00" 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('Remarks')} <span className="text-gray-500 font-medium">({t('Optional')})</span>
                  </label>
                  <input 
                    type="text" 
                    value={remarks} 
                    onChange={(e) => setRemarks(e.target.value)} 
                    className="block w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium transition-colors duration-200" 
                    placeholder={t("e.g. Paid in cash")} 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={mutation.isPending} 
                  className={`cursor-pointer w-full text-white rounded-full py-2.5 md:py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 active:scale-95 transition-all ${txType === 'PAYMENT' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {mutation.isPending ? t('Saving...') : txType === 'PAYMENT' ? t('Save Payment') : t('Add Udhar')}
                </button>
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
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
    mutationFn: (newCustomer) => {
      if (isEditMode) {
        return api.put(`/customers/${editingCustomer._id}`, newCustomer);
      }
      return api.post('/customers', newCustomer);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingCustomer(null);
      reset();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (customerId) => api.delete(`/customers/${customerId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
    }
  });

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setIsEditMode(true);
    reset({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (customer) => {
    if (window.confirm(t(`Are you sure you want to delete ${customer.name}? This action cannot be undone.`))) {
      deleteMutation.mutate(customer._id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingCustomer(null);
    reset();
  };

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  const getInitials = (name) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (index) => {
    const colors = [
      'bg-indigo-100 text-indigo-600',
      'bg-purple-100 text-purple-600',
      'bg-blue-100 text-blue-600',
      'bg-green-100 text-green-600',
      'bg-yellow-100 text-yellow-600',
      'bg-pink-100 text-pink-600',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="w-full space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">{t('Customers')}</h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5">{t('Manage your customers and their outstanding balances')}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-full flex items-center font-semibold text-xs sm:text-sm w-full sm:w-auto justify-center active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
          {t('Add Customer')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
        {/* Total Customers */}
        <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <p className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide">{t('Total Customers')}</p>
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-indigo-100 flex items-center justify-center">
              <User className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-semibold text-gray-900">{customers.length}</p>
          <p className="text-xs text-gray-600 font-semibold mt-1.5 md:mt-2">{t('Active accounts')}</p>
        </div>

        {/* Total Pending */}
        <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <p className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide">{t('Total Pending')}</p>
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-red-100 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-semibold text-gray-900">
            {formatCurrency(customers.reduce((sum, c) => sum + (c.balance || 0), 0))}
          </p>
          <p className="text-xs text-red-600 font-semibold mt-1.5 md:mt-2">
            {customers.filter(c => c.balance > 0).length} {t('with pending balance')}
          </p>
        </div>

        {/* This Month */}
        <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <p className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide">{t('This Month')}</p>
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-green-100 flex items-center justify-center">
              <History className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-semibold text-gray-900">
            {customers.filter(c => {
              const createdDate = new Date(c.createdAt);
              const now = new Date();
              return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
            }).length}
          </p>
          <p className="text-xs text-green-600 font-semibold mt-1.5 md:mt-2">{t('New customers')}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder={t("Search by invoice number or customer...")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-12 pr-4 py-2.5 md:py-3 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base font-medium transition-colors duration-200"
        />
      </div>

      {/* Customer Cards */}
      <div className="space-y-3 md:space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 md:p-10 lg:p-12 text-center">
            <p className="text-gray-500 text-sm md:text-base font-medium">{t('No customers found.')}</p>
          </div>
        ) : (
          filteredCustomers.map((customer, index) => (
            <div 
              key={customer._id} 
              className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Left Side - Customer Info */}
              <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full ${getAvatarColor(index)} flex items-center justify-center font-semibold text-base md:text-lg flex-shrink-0`}>
                  {getInitials(customer.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate">{customer.name}</h3>
                  <div className="flex items-center text-gray-500 text-sm mt-0.5 font-medium">
                    <Phone className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                    <span className="truncate">{customer.phone}</span>
                  </div>
                </div>
              </div>
              
              {/* Right Side - Balance & Actions */}
              <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-between">
                <div className="text-left md:text-right flex-1 md:flex-initial">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-0.5">
                    {t('PENDING BALANCE')}
                  </p>
                  <p className={`text-lg md:text-xl lg:text-2xl font-semibold ${customer.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(customer.balance)}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Edit Button */}
                  <button 
                    onClick={() => handleEdit(customer)}
                    className="cursor-pointer p-2 md:p-2.5 hover:bg-indigo-50 rounded-xl transition-colors active:scale-90 group"
                    title={t('Edit Customer')}
                  >
                    <Edit className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 group-hover:text-indigo-700" />
                  </button>
                  
                  {/* Delete Button */}
                  <button 
                    onClick={() => handleDelete(customer)}
                    className="cursor-pointer p-2 md:p-2.5 hover:bg-red-50 rounded-xl transition-colors active:scale-90 group"
                    title={t('Delete Customer')}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 md:w-5 md:h-5 text-red-600 group-hover:text-red-700" />
                  </button>
                  
                  {/* View Ledger Button */}
                  <button 
                    onClick={() => setSelectedCustomer(customer)}
                    className="cursor-pointer text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-50 px-3 py-1.5 md:px-4 md:py-2 rounded-full font-semibold active:scale-95 transition-all whitespace-nowrap text-xs md:text-sm"
                  >
                    {t('Ledger')}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-6 md:py-8">
            <div className="fixed inset-0 bg-black/30 animate-modal-overlay" onClick={handleCloseModal} />
            <div className="relative bg-white rounded-xl border border-gray-200 max-w-md w-full p-5 md:p-6 animate-modal-content">
              <div className="flex items-center justify-between mb-4 md:mb-5 pb-4 border-b border-gray-200">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                  {isEditMode ? t('Edit Customer') : t('Add New Customer')}
                </h3>
                <button onClick={handleCloseModal} className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors active:scale-90">
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm md:text-base font-semibold text-gray-800 mb-2">{t('Full Name')}</label>
                  <input 
                    {...register('name')}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 md:py-3 text-sm md:text-base font-medium focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                    placeholder={t("Enter customer name")}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1.5 font-semibold">{errors.name.message}</p>}
                </div>
                
                <div>
                  <label className="block text-sm md:text-base font-semibold text-gray-800 mb-2">{t('Phone Number')}</label>
                  <input 
                    {...register('phone')}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 md:py-3 text-sm md:text-base font-medium focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="10-digit number"
                    disabled={isEditMode}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1.5 font-semibold">{errors.phone.message}</p>}
                  {isEditMode && <p className="text-xs text-gray-500 mt-1.5 font-medium">{t('Phone number cannot be changed')}</p>}
                </div>

                <div>
                  <label className="block text-sm md:text-base font-semibold text-gray-800 mb-2">
                    {t('Email')} <span className="text-gray-500 font-medium">({t('Optional')})</span>
                  </label>
                  <input 
                    {...register('email')}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 md:py-3 text-sm md:text-base font-medium focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                    placeholder="customer@example.com"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1.5 font-semibold">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm md:text-base font-semibold text-gray-800 mb-2">
                    {t('Address')} <span className="text-gray-500 font-medium">({t('Optional')})</span>
                  </label>
                  <textarea 
                    {...register('address')}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 md:py-3 text-sm md:text-base font-medium focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 resize-none"
                    rows="3"
                    placeholder={t("Enter address")}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="cursor-pointer w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full px-5 md:px-6 py-2.5 md:py-3 font-semibold text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 active:scale-95 transition-all shadow-lg"
                >
                  {mutation.isPending ? t('Saving...') : isEditMode ? t('Update Customer') : t('Save Customer')}
                </button>
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
