import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { Phone, X, IndianRupee, History, ArrowDownRight, ArrowUpRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

export default CustomerLedger;
