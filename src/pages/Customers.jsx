import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../api/axios';
import { Plus, Search, Phone, X, IndianRupee, History, ArrowDownRight, ArrowUpRight, Loader2, Edit, Trash2, Users } from 'lucide-react';
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
        <div className="relative bg-white rounded-xl border border-gray-200 max-w-4xl w-full max-h-[90vh] md:max-h-[85vh] flex flex-col animate-modal-content">

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

          <div className="flex flex-col-reverse md:flex-row flex-1 overflow-y-auto md:overflow-hidden">
            {/* Ledger List */}
            <div className="flex-1 md:overflow-y-auto p-4 md:p-6 bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4 flex items-center">
                <History className="w-4 h-4 mr-2" /> {t('Transaction History')}
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
                      className="bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-all flex justify-between items-center animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${tx.type === 'UDHAR' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                          {tx.type === 'UDHAR' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{tx.type === 'UDHAR' ? t('Udhar Given') : t('Payment Received')}</p>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">
                            {new Date(tx.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} • {new Date(tx.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </p>
                          {(tx.description || tx.remarks) && (
                            <p className="text-xs text-gray-600 mt-1">{tx.description || tx.remarks}</p>
                          )}
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
            <div className="w-full md:w-80 bg-white p-4 md:p-6 border-b md:border-b-0 md:border-l border-gray-200 flex-shrink-0">
              <div className="mb-6 bg-white rounded-lg p-4 text-center border border-gray-200 hover:border-gray-300 transition-all">
                <p className="text-[10px] md:text-xs text-gray-600 mb-1 font-semibold uppercase tracking-wide">{t('Current Pending Balance')}</p>
                <p className={`text-2xl md:text-3xl font-semibold ${customer.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(customer.balance)}
                </p>
              </div>

              <h4 className="font-semibold text-gray-700 mb-4">{t('Add Entry')}</h4>
              <form onSubmit={handleTransaction} className="space-y-4">
                <div className="flex rounded-lg p-1 bg-gray-100 border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setTxType('PAYMENT')}
                    className={`cursor-pointer flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${txType === 'PAYMENT' ? 'bg-white border border-gray-200 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {t('Received')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType('UDHAR')}
                    className={`cursor-pointer flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${txType === 'UDHAR' ? 'bg-white border border-gray-200 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
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
                      className="block w-full pl-9 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] font-medium transition-colors duration-200"
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
                    className="block w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] font-medium transition-colors duration-200"
                    placeholder={t("e.g. Paid in cash")}
                  />
                </div>

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="cursor-pointer w-full bg-[#093C5D] hover:bg-[#082a42] text-white rounded-lg py-2.5 md:py-3 text-sm md:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 active:scale-95 transition-all"
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
    if (!name) return 'UN';
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (index) => {
    const colors = [
      'bg-[#F5F5F5] text-[#093C5D]',
      'bg-purple-100 text-purple-600',
      'bg-blue-100 text-[#093C5D]',
      'bg-green-100 text-green-600',
      'bg-yellow-100 text-yellow-600',
      'bg-pink-100 text-pink-600',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">{t('Customers')}</h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5">{t('Manage your customers and their outstanding balances')}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="cursor-pointer bg-[#093C5D] hover:bg-[#082a42] text-white px-4 sm:px-5 md:px-6 py-2 md:py-2.5 rounded-lg flex items-center whitespace-nowrap shrink-0 font-semibold text-xs md:text-sm w-full sm:w-auto justify-center active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
          {t('Add Customer')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
        {/* Total Customers */}
        <div className="bg-white rounded-xl p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
              <Users className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Total Customers')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">{customers.length}</p>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate mt-0.5">{t('Active accounts')}</p>
          </div>
        </div>

        {/* Total Pending */}
        <div className="bg-white rounded-xl p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border-l-4 border-l-red-500 border-t border-t-gray-200 border-r border-r-gray-200 border-b border-b-gray-200 hover:border-r-gray-300 hover:border-t-gray-300 hover:border-b-gray-300 transition-all duration-200 overflow-hidden">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
              <IndianRupee className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Total Pending')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">
              {formatCurrency(customers.reduce((sum, c) => sum + (c.balance || 0), 0))}
            </p>
            <p className="text-[10px] md:text-xs text-red-500 font-medium truncate mt-0.5">
              {customers.filter(c => c.balance > 0).length} {t('with pending balance')}
            </p>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white rounded-xl p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
              <History className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('This Month')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">
              {customers.filter(c => {
                const createdDate = new Date(c.createdAt);
                const now = new Date();
                return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
              }).length}
            </p>
            <p className="text-[10px] md:text-xs text-green-600 font-medium truncate mt-0.5">{t('New customers')}</p>
          </div>
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
          className="block w-full pl-12 pr-4 py-2.5 md:py-3 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] text-sm md:text-base font-medium transition-colors duration-200"
        />
      </div>

      {/* Customer Cards */}
      <div className="space-y-3 md:space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#093C5D]" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 md:p-10 lg:p-12 text-center">
            <p className="text-gray-500 text-sm md:text-base font-medium">{t('No customers found.')}</p>
          </div>
        ) : (
          filteredCustomers.map((customer, index) => (
            <div
              key={customer._id}
              className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 p-4 md:p-5 animate-fade-in overflow-hidden transition-all duration-200"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Desktop Layout: Single row */}
              <div className="hidden md:flex items-center gap-5">
                {/* Avatar */}
                <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-lg border border-gray-200 ${getAvatarColor(index)} flex items-center justify-center font-semibold text-base lg:text-lg flex-shrink-0`}>
                  {getInitials(customer.name)}
                </div>

                {/* Name + Phone */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 truncate">{customer.name}</h3>
                  <div className="flex items-center text-gray-500 text-sm font-medium mt-0.5">
                    <Phone className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                    <span>{customer.phone}</span>
                  </div>
                </div>

                {/* Pending Balance */}
                <div className="text-right flex-shrink-0 min-w-[120px] lg:min-w-[140px]">
                  <p className="text-[10px] lg:text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">
                    {t('PENDING BALANCE')}
                  </p>
                  <p className={`text-lg lg:text-xl font-semibold ${customer.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(customer.balance)}
                  </p>
                </div>

                {/* Separator */}
                <div className="w-px h-10 bg-gray-200 flex-shrink-0"></div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(customer)}
                    className="cursor-pointer p-2.5 hover:bg-[#093C5D]/5 rounded-xl transition-colors active:scale-90 group"
                    title={t('Edit Customer')}
                  >
                    <Edit className="w-[18px] h-[18px] text-[#093C5D] group-hover:text-[#082a42]" />
                  </button>

                  <button
                    onClick={() => handleDelete(customer)}
                    className="cursor-pointer p-2.5 hover:bg-red-50 rounded-xl transition-colors active:scale-90 group"
                    title={t('Delete Customer')}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-[18px] h-[18px] text-red-600 group-hover:text-red-700" />
                  </button>

                  <button
                    onClick={() => setSelectedCustomer(customer)}
                    className="cursor-pointer ml-1 text-[#093C5D] border-2 border-[#093C5D] hover:bg-[#093C5D] hover:text-white px-4 py-2 rounded-full font-semibold active:scale-95 transition-all whitespace-nowrap text-sm"
                  >
                    {t('Ledger')}
                  </button>
                </div>
              </div>

              {/* Mobile Layout: Compact stacked */}
              <div className="md:hidden">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full ${getAvatarColor(index)} flex items-center justify-center font-semibold text-sm sm:text-base flex-shrink-0 mt-0.5`}>
                    {getInitials(customer.name)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {/* Name + Phone */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{customer.name}</h3>
                      <div className="flex items-center text-gray-400 text-xs font-medium">
                        <Phone className="w-3 h-3 mr-0.5 flex-shrink-0" />
                        <span>{customer.phone}</span>
                      </div>
                    </div>

                    {/* Balance + Actions Row */}
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <p className="text-[9px] sm:text-[10px] text-gray-500 font-semibold uppercase tracking-wider leading-none mb-0.5">
                          {t('PENDING BALANCE')}
                        </p>
                        <p className={`text-base sm:text-lg font-semibold ${customer.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(customer.balance)}
                        </p>
                      </div>

                      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="cursor-pointer p-1.5 sm:p-2 hover:bg-[#093C5D]/5 rounded-lg transition-colors active:scale-90 group"
                          title={t('Edit Customer')}
                        >
                          <Edit className="w-4 h-4 text-[#093C5D]" />
                        </button>

                        <button
                          onClick={() => handleDelete(customer)}
                          className="cursor-pointer p-1.5 sm:p-2 hover:bg-red-50 rounded-lg transition-colors active:scale-90 group"
                          title={t('Delete Customer')}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>

                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="cursor-pointer ml-0.5 text-[#093C5D] border-2 border-[#093C5D] hover:bg-[#093C5D] hover:text-white px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full font-semibold active:scale-95 transition-all whitespace-nowrap text-[11px] sm:text-xs"
                        >
                          {t('Ledger')}
                        </button>
                      </div>
                    </div>
                  </div>
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
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-modal-overlay" onClick={handleCloseModal} />
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
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 md:py-3 text-sm md:text-base font-medium focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200"
                    placeholder={t("Enter customer name")}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1.5 font-semibold">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm md:text-base font-semibold text-gray-800 mb-2">{t('Phone Number')}</label>
                  <input
                    {...register('phone')}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 md:py-3 text-sm md:text-base font-medium focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 md:py-3 text-sm md:text-base font-medium focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200"
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
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 md:py-3 text-sm md:text-base font-medium focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200 resize-none"
                    rows="3"
                    placeholder={t("Enter address")}
                  />
                </div>

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="cursor-pointer w-full bg-[#093C5D] hover:bg-[#082a42] text-white rounded-lg px-5 md:px-6 py-2.5 md:py-3 font-semibold text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 active:scale-95 transition-all shadow-lg"
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
