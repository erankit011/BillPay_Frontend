import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { Phone, X, IndianRupee, History, ArrowDownRight, ArrowUpRight, Loader2, Calendar, Mail, MessageSquareText, Wallet, Eye, Receipt } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

const formatPaymentMode = (mode) => {
  switch (mode) {
    case 'CASH': return 'Cash';
    case 'UPI': return 'UPI';
    case 'BANK_TRANSFER': return 'Bank Transfer';
    case 'CHEQUE': return 'Cheque';
    case 'CREDIT': return 'Credit';
    default: return mode;
  }
};

const CustomerLedger = ({ customer, onClose }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [txType, setTxType] = useState('PAYMENT');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState({});
  const [viewDescTx, setViewDescTx] = useState(null);

  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

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

    const newErrors = {};
    if (!amount || amount <= 0) {
      newErrors.amount = 'Enter valid amount';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    mutation.mutate({
      customerId: customer._id,
      amount: Number(amount),
      type: txType,
      paymentMode,
      description: remarks
    });
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay" onClick={onClose} />

      {/* Mobile: bottom sheet | sm+: centered modal */}
      {/* Mobile: bottom sheet | sm+: centered modal */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-center sm:justify-center sm:px-4 sm:py-8 z-50 pointer-events-none">
        <div className="relative bg-white w-full sm:max-w-lg lg:max-w-2xl rounded-t-lg sm:rounded-lg flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-gray-200 animate-modal-content overflow-hidden pointer-events-auto">

          {/* Drag handle — mobile only */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 pt-3 sm:pt-5 pb-3 sm:pb-4 border-b border-gray-100 flex-shrink-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">{t('Transactions')}</h3>
            <button
              onClick={onClose}
              className="cursor-pointer text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px] border border-gray-200"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">

            {/* Customer Details & Balance Card */}
            <div className="mb-4 bg-gray-50/80 rounded-lg p-3.5 sm:p-4 border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 flex-wrap">

                {/* Customer Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-[19px] font-semibold text-gray-900 leading-tight truncate">{customer.name}</h3>
                  <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                    <p className="text-gray-500 text-xs sm:text-[13px] flex items-center font-medium">
                      <Phone className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> {customer.phone}
                    </p>
                    <span className="text-gray-300 hidden sm:inline-block">|</span>
                    <p className="text-gray-500 text-xs sm:text-[13px] flex items-center font-medium">
                      <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                      {new Date(customer.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  {customer.email && (
                    <p className="text-gray-500 text-xs sm:text-[13px] flex items-center mt-1.5 font-medium">
                      <Mail className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> {customer.email}
                    </p>
                  )}
                </div>

                {/* Divider on Mobile */}
                <div className="h-px w-full bg-gray-200 sm:hidden"></div>

                {/* Balance Info */}
                <div className="sm:text-right flex-shrink-0 min-w-0 max-w-full mt-2 sm:mt-0">
                  <p className="text-[10px] sm:text-[11px] text-gray-500 mb-1.5 font-semibold uppercase tracking-wider">{t('Current Balance')}</p>
                  <div className="flex flex-col items-start sm:items-end gap-1.5">
                    <p className={`text-2xl sm:text-[28px] leading-none font-semibold tracking-tight break-all ${customer.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(Math.abs(customer.balance))}
                    </p>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-medium tracking-wider ${customer.balance > 0 ? 'bg-red-50 text-red-600 border border-red-100' : customer.balance < 0 ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                      {customer.balance > 0 ? t('Pending') : customer.balance < 0 ? t('Advance') : t('Settled')}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Add Entry Form */}
            <h4 className="font-semibold text-gray-800 mb-2 sm:mb-2.5 text-sm sm:text-base">{t('Add Entry')}</h4>
            <form onSubmit={handleTransaction} className="space-y-2.5 mb-5">
              <div className="flex rounded-lg p-1 bg-gray-100/80 border border-gray-200">
                <button
                  type="button"
                  onClick={() => { setTxType('PAYMENT'); setErrors({}); }}
                  className={`cursor-pointer flex-1 py-1.5 sm:py-2 text-[13px] sm:text-sm font-semibold rounded-lg transition-all active:scale-95 !min-h-0 ${txType === 'PAYMENT' ? 'bg-green-600 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                >
                  {t('Received')}
                </button>
                <button
                  type="button"
                  onClick={() => { setTxType('UDHAR'); setErrors({}); }}
                  className={`cursor-pointer flex-1 py-1.5 sm:py-2 text-[13px] sm:text-sm font-semibold rounded-lg transition-all active:scale-95 !min-h-0 ${txType === 'UDHAR' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                >
                  {t('Gave Udhar')}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-0.5">{t('Amount')} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IndianRupee className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        if (errors.amount) setErrors({ ...errors, amount: null });
                      }}
                      className={`block w-full h-10 sm:h-11 pl-9 pr-3 py-2 bg-white border ${errors.amount ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#093C5D] focus:border-[#093C5D]'} rounded-lg focus:ring-1 font-medium transition-colors duration-200 text-sm`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.amount && <p className="text-red-500 text-[10px] sm:text-[11px] mt-0.5 font-medium">{t(errors.amount)}</p>}
                </div>

                <div>
                  <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-0.5">{t('Payment Mode')} <span className="text-red-500">*</span></label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="block w-full h-10 sm:h-11 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] font-medium transition-colors duration-200 text-sm"
                    required
                  >
                    <option value="CASH">{t('Cash')}</option>
                    <option value="UPI">{t('UPI')}</option>
                    <option value="BANK_TRANSFER">{t('Bank Transfer')}</option>
                    <option value="CHEQUE">{t('Cheque')}</option>
                    <option value="CREDIT">{t('Credit')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-0.5">
                  {t('Description')}
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="block w-full h-10 sm:h-11 px-3 py-2 bg-white border border-gray-300 focus:ring-[#093C5D] focus:border-[#093C5D] rounded-lg focus:ring-1 font-medium transition-colors duration-200 text-sm"
                  placeholder={t("Enter payment reason")}
                />
                <p className="text-gray-400 text-[10px] sm:text-[11px] mt-0.5 font-medium">{t('Optional')}</p>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="cursor-pointer w-full flex items-center justify-center bg-[#093C5D] hover:bg-[#082a42] text-white rounded-lg py-2 sm:py-2.5 text-sm sm:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all shadow-none !min-h-0"
                >
                  {mutation.isPending ? t('Saving...') : txType === 'PAYMENT' ? t('Save Payment') : t('Add Udhar')}
                </button>
              </div>
            </form>

            {/* Transaction History */}
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center text-sm sm:text-base">
              <History className="w-4 h-4 mr-2" /> {t('Transaction History')}
            </h4>

            <div className="bg-gray-50/50 rounded-lg p-2.5 sm:p-3 border border-gray-100">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#093C5D]" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-lg border border-gray-200">
                  <p className="text-gray-500 text-sm font-medium">{t('No transactions yet.')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx, index) => (
                    <div
                      key={tx._id}
                      className="bg-white p-3.5 sm:p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-all flex justify-between items-start animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className={`mt-0.5 p-2 sm:p-2.5 rounded-lg flex-shrink-0 ${tx.type === 'UDHAR' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                          {tx.type === 'UDHAR' ? <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" /> : <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-[13px] sm:text-sm">
                            {tx.type === 'UDHAR' 
                              ? (tx.description && tx.description.startsWith('Bill generated') ? t('Bill Generated') : t('Udhar Given'))
                              : (tx.description && tx.description.startsWith('Advance payment for bill') ? t('Bill Payment Received') : t('Payment Received'))}
                          </p>
                          <p className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5">
                            {new Date(tx.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} • {new Date(tx.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </p>
                          {(tx.description || tx.paymentMode) && (
                            <div className="mt-1.5 flex items-center gap-1.5 w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                              {tx.description && (tx.description.startsWith('Bill generated') || tx.description.startsWith('Advance payment for bill') || tx.description.startsWith('Bill: ')) ? (
                                <>
                                  {tx.paymentMode && (
                                    <span className="text-[11px] sm:text-xs text-emerald-700 font-medium bg-emerald-50 border border-emerald-100 px-2 sm:px-2.5 py-1 rounded-lg flex items-center gap-1 sm:gap-1.5 flex-shrink-0 whitespace-nowrap">
                                      <Wallet className="w-3.5 h-3.5" /> {t(formatPaymentMode(tx.paymentMode))}
                                    </span>
                                  )}
                                  <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-lg flex-shrink-0 whitespace-nowrap">
                                    <Receipt className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span>
                                      {tx.description.startsWith('Bill generated')
                                        ? tx.description.replace(' generated', '')
                                        : tx.description.startsWith('Advance payment for bill')
                                          ? tx.description.replace('Advance payment for bill: ', 'Bill: ')
                                          : tx.description.split(' (')[0]}
                                    </span>
                                  </span>
                                  {tx.description.includes('(') && (
                                    <button
                                      onClick={() => setViewDescTx(tx)}
                                      className="cursor-pointer text-[11px] sm:text-xs text-[#093C5D] font-medium bg-[#093C5D]/5 border border-[#093C5D]/10 hover:bg-[#093C5D]/10 px-2 sm:px-2.5 py-1 rounded-lg flex items-center gap-1 sm:gap-1.5 transition-colors active:scale-95 flex-shrink-0 whitespace-nowrap !min-h-[24px] sm:!min-h-[28px] !min-w-0"
                                      title={t('View Description')}
                                    >
                                      <Eye className="w-3.5 h-3.5 opacity-80" />
                                      <span className="hidden sm:inline">{t('Details')}</span>
                                      <span className="sm:hidden">{t('Details')}</span>
                                    </button>
                                  )}
                                </>
                              ) : (
                                <>
                                  {tx.paymentMode && (
                                    <span className="text-[11px] sm:text-xs text-emerald-700 font-medium bg-emerald-50 border border-emerald-100 px-2 sm:px-2.5 py-1 rounded-lg flex items-center gap-1 sm:gap-1.5 flex-shrink-0 whitespace-nowrap">
                                      <Wallet className="w-3.5 h-3.5" /> {t(formatPaymentMode(tx.paymentMode))}
                                    </span>
                                  )}
                                  {tx.description && (
                                    <button
                                      onClick={() => setViewDescTx(tx)}
                                      className="cursor-pointer text-[11px] sm:text-xs text-[#093C5D] font-medium bg-[#093C5D]/5 border border-[#093C5D]/10 hover:bg-[#093C5D]/10 px-2 sm:px-2.5 py-1 rounded-lg flex items-center gap-1 sm:gap-1.5 transition-colors active:scale-95 flex-shrink-0 whitespace-nowrap !min-h-[24px] sm:!min-h-[28px] !min-w-0"
                                      title={t('View Description')}
                                    >
                                      <Eye className="w-3.5 h-3.5 opacity-80" />
                                      <span className="hidden sm:inline">{t('Description')}</span>
                                      <span className="sm:hidden">{t('Description')}</span>
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink min-w-0 ml-3 max-w-[45%] sm:max-w-[50%]">
                        <p className={`font-semibold text-[14px] sm:text-[15px] break-all ${tx.type === 'UDHAR' ? 'text-red-700' : 'text-green-700'} mt-0.5 sm:mt-0`}>
                          {tx.type === 'UDHAR' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* View Description Modal */}
      {viewDescTx && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay" onClick={() => setViewDescTx(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-lg shadow-xl flex flex-col max-h-[80vh] overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquareText className="w-4 h-4 text-[#093C5D]" />
                {t('Transaction Details')}
              </h3>
              <button onClick={() => setViewDescTx(null)} className="cursor-pointer text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px] border border-gray-200">
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto text-sm text-gray-700 leading-relaxed custom-scrollbar whitespace-pre-wrap">
              {viewDescTx.description}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerLedger;
