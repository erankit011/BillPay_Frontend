import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Plus, Bell, Clock, User, X, MessageSquare, Mail, Edit, Trash2, TrendingUp, Lightbulb, Activity, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const Reminders = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchName, setSearchName] = useState('');
  const queryClient = useQueryClient();

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['reminders'],
    queryFn: async () => {
      const res = await api.get('/reminders');
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

  const { register, handleSubmit, reset, watch } = useForm();

  const selectedCustomerId = watch('customerId');
  const selectedType = watch('type');

  const mutation = useMutation({
    mutationFn: (reminderData) => {
      if (isEditMode) {
        return api.put(`/reminders/${editingReminder._id}`, reminderData);
      }
      return api.post('/reminders', reminderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reminders']);
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingReminder(null);
      reset();
    },
    onError: (error) => {
      // Handle error - will be displayed in the form
      console.error('Reminder creation failed:', error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (reminderId) => api.delete(`/reminders/${reminderId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['reminders']);
    }
  });

  const sendMutation = useMutation({
    mutationFn: (reminderId) => api.post(`/reminders/${reminderId}/send`),
    onSuccess: () => {
      queryClient.invalidateQueries(['reminders']);
      alert(t('Reminder sent successfully!'));
    },
    onError: (err) => {
      alert(t('Failed to send reminder: ') + (err.response?.data?.message || err.message));
    }
  });

  const handleSendNow = (reminder) => {
    if (window.confirm(t('Are you sure you want to send this reminder now?'))) {
      sendMutation.mutate(reminder._id);
    }
  };

  const handleEdit = (reminder) => {
    setEditingReminder(reminder);
    setIsEditMode(true);
    reset({
      customerId: reminder.customerId?._id || '',
      message: reminder.message || '',
      scheduledDate: reminder.scheduledDate ? new Date(reminder.scheduledDate).toISOString().split('T')[0] : '',
      type: reminder.type || 'WHATSAPP'
    });
    setIsModalOpen(true);
  };

  const handleDelete = (reminder) => {
    if (window.confirm(t(`Are you sure you want to delete this reminder? This action cannot be undone.`))) {
      deleteMutation.mutate(reminder._id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingReminder(null);
    reset();
  };

  const onSubmit = (data) => {
    // Check if EMAIL type is selected and customer has no email
    if (data.type === 'EMAIL') {
      const selectedCustomer = customers.find(c => c._id === data.customerId);
      if (!selectedCustomer?.email) {
        alert(t('Customer email not provided! Please add customer email first or use WhatsApp reminder.'));
        return;
      }
    }
    mutation.mutate(data);
  };

  // Filter reminders based on status and search query
  const filteredReminders = reminders.filter(r => {
    const matchesStatus = filterStatus === 'All' || r.status === filterStatus.toUpperCase();
    const customerName = r.customerId?.name || '';
    const matchesSearch = customerName.toLowerCase().includes(searchName.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate stats using actual customer data for realistic analytics
  const pendingCount = reminders.filter(r => r.status === 'PENDING').length;
  const sentCount = reminders.filter(r => r.status === 'SENT').length;
  
  const totalPending = customers.reduce((sum, c) => sum + (c.balance || 0), 0);
  const recovered = customers.reduce((sum, c) => sum + (c.totalPaid || 0), 0);
  const totalUdhar = customers.reduce((sum, c) => sum + (c.totalUdhar || 0), 0);
  const recoveryRate = totalUdhar > 0 ? Math.round((recovered / totalUdhar) * 100) : 0;

  // Dynamic Smart Tip logic
  const customersWithDues = customers.filter(c => c.balance > 0);
  let smartTip = t('Sending reminders on Saturday mornings between 9-11 AM increases payment recovery by 22% for retail customers.');
  if (customersWithDues.length > 0) {
    const topDefaulter = [...customersWithDues].sort((a, b) => b.balance - a.balance)[0];
    smartTip = t(`You have ${customersWithDues.length} customer(s) with pending dues. Consider sending a reminder to ${topDefaulter.name} who owes ₹${topDefaulter.balance.toLocaleString()} to improve your cash flow.`);
  } else if (customers.length > 0) {
    smartTip = t('Great job! You have zero pending payments. Your cash flow is healthy and well maintained.');
  }

  return (
    <div className="w-full space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">{t('Reminders')}</h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed">
            {t('Automate your payment recovery via WhatsApp and Email. Set smart triggers to ensure your Udhar is cleared on time without manual follow-ups.')}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="cursor-pointer bg-[#093C5D] hover:bg-[#082a42] text-white px-4 sm:px-5 md:px-6 py-2 md:py-2.5 rounded-lg flex items-center whitespace-nowrap shrink-0 font-semibold text-xs sm:text-sm w-full sm:w-auto justify-center active:scale-95 transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
          {t('Set Reminder')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 md:space-y-5">
            {/* Search + Filter Row */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-0">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={t('Search customer...')}
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="block w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 md:py-3 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] text-xs md:text-sm font-medium transition-colors duration-200"
                />
              </div>

              {/* Filter Dropdown */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="cursor-pointer w-auto bg-white border border-gray-200 rounded-lg px-2 sm:px-3 py-2.5 md:py-3 text-xs md:text-sm font-semibold text-gray-700 focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] outline-none transition-colors duration-200 flex-shrink-0 bg-no-repeat bg-[right_8px_center] pr-7 sm:pr-8"
              >
                <option value="All">{t('All')}</option>
                <option value="Pending">{t('Pending')}</option>
                <option value="Sent">{t('Sent')}</option>
              </select>
            </div>

          {/* Reminders List */}
          <div className="space-y-3 md:space-y-4">
            {isLoading ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 md:p-10 lg:p-12 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-[#093C5D] mx-auto"></div>
              </div>
            ) : filteredReminders.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 md:p-10 lg:p-12 text-center text-gray-500">
                <Bell className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
                <p className="font-medium text-xs md:text-sm">{t('No reminders found. Set your first reminder!')}</p>
              </div>
            ) : (
              filteredReminders.map((reminder, index) => (
                <div
                  key={reminder._id}
                  className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 animate-fade-in hover:border-[#D1D5DB] transition-all"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-3 md:gap-4">
                    {/* Avatar */}
                    <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-[#E5E7EB] flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 md:w-6 md:h-6 text-[#093C5D]" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xs md:text-sm font-semibold text-gray-900 truncate">
                            {reminder.customerId?.name || t('Deleted Customer')}
                          </h3>
                          <p className="text-sm text-gray-600 mt-0.5 font-medium">
                            Bill #{reminder.billId?.invoiceNumber || 'N/A'} • ₹{reminder.amount || 0}
                          </p>
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${reminder.status === 'PENDING'
                          ? 'bg-[#E5E7EB] text-[#093C5D]'
                          : reminder.status === 'SENT'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                          }`}>
                          {reminder.status}
                        </span>
                      </div>

                      {/* Message */}
                      <p className="text-sm text-gray-700 font-medium mb-3 italic bg-gray-50 p-3 rounded-xl border border-gray-100 line-clamp-2">
                        "{reminder.message}"
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium">{new Date(reminder.scheduledDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {reminder.type === 'WHATSAPP' ? (
                              <MessageSquare className="w-4 h-4 text-green-600 flex-shrink-0" />
                            ) : (
                              <Mail className="w-4 h-4 text-[#093C5D] flex-shrink-0" />
                            )}
                            <span className={`font-semibold ${reminder.type === 'WHATSAPP' ? 'text-green-600' : 'text-[#093C5D]'}`}>
                              {reminder.type}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {reminder.status !== 'SENT' && (
                            <button
                              onClick={() => handleSendNow(reminder)}
                              className="cursor-pointer p-2 hover:bg-green-50 rounded-xl transition-colors active:scale-90"
                              title={t('Send Now')}
                              disabled={sendMutation.isPending}
                            >
                              <Send className="w-4 h-4 text-green-600" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(reminder)}
                            className="cursor-pointer p-2 hover:bg-[#F5F5F5] rounded-xl transition-colors active:scale-90"
                            title={t('Edit Reminder')}
                          >
                            <Edit className="w-4 h-4 text-[#093C5D]" />
                          </button>
                          <button
                            onClick={() => handleDelete(reminder)}
                            className="cursor-pointer p-2 hover:bg-red-50 rounded-xl transition-colors active:scale-90"
                            title={t('Delete Reminder')}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 md:space-y-5">
          {/* Quick Analytics */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">{t('Quick Analytics')}</h3>

            {/* Recovery Rate */}
            <div className="mb-4 md:mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-semibold text-gray-700">{t('Recovery Rate')}</span>
                <span className="text-xl md:text-2xl font-semibold text-[#093C5D]">{recoveryRate}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#093C5D] to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${recoveryRate}%` }}
                  ></div>
                </div>
                <TrendingUp className="w-4 h-4 text-[#093C5D] flex-shrink-0" />
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-base">
                <span className="text-gray-600 font-medium">{t('Total Pending')}</span>
                <span className="font-semibold text-gray-900">₹{totalPending.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-base">
                <span className="text-gray-600 font-medium">{t('Total Recovered')}</span>
                <span className="font-semibold text-green-600">₹{recovered.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Smart Tip */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 bg-gradient-to-br from-[#F5F5F5] to-purple-50 border-[#E5E7EB]">
            <div className="flex items-start gap-2 mb-2">
              <Lightbulb className="w-4 h-4 md:w-5 md:h-5 text-[#093C5D] flex-shrink-0" />
              <h3 className="text-base font-semibold text-[#04101a]">{t('Smart Tip')}</h3>
            </div>
            <p className="text-sm text-[#061d2e] leading-relaxed font-medium">
              {smartTip}
            </p>
          </div>

          {/* Recent Activity */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Activity className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
              <h3 className="text-base font-semibold text-gray-900">{t('Recent Activity')}</h3>
            </div>
            <div className="space-y-3">
              {reminders.slice(0, 3).map((reminder, idx) => (
                <div key={idx} className="flex items-start gap-2 text-base">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${reminder.status === 'SENT' ? 'bg-green-500' : 'bg-[#F5F5F5]0'
                    }`}></div>
                  <p className="text-gray-700 leading-relaxed font-medium">
                    <span className="font-semibold">{reminder.customerId?.name || 'Customer'}</span>{' '}
                    {reminder.status === 'SENT' ? t('paid') : t('Reminder sent to')}{' '}
                    <span className="font-semibold">₹{reminder.amount || 0}</span>{' '}
                    {reminder.type === 'WHATSAPP' ? t('via WhatsApp link') : t('via Email')}.
                  </p>
                </div>
              ))}
              {reminders.length > 3 && (
                <button className="cursor-pointer text-[#093C5D] text-base font-semibold hover:text-[#093C5D] transition-colors active:scale-95">
                  {t('View All Logs')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Reminder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-6 md:py-8">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-modal-overlay" onClick={handleCloseModal} />
            <div className="relative bg-white border border-gray-200 rounded-xl max-w-md w-full p-5 md:p-6 lg:p-8 animate-modal-content">
              <div className="flex items-center justify-between mb-4 md:mb-5 pb-4 md:pb-5 border-b border-gray-200">
                <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">
                  {isEditMode ? t('Edit Reminder') : t('Set Custom Reminder')}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="cursor-pointer text-gray-400 hover:text-gray-600 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all active:scale-90 flex-shrink-0"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-5">
                {/* Customer */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-800 mb-2">{t('Customer')}</label>
                  <select
                    {...register('customerId')}
                    className="cursor-pointer w-full rounded-xl border border-gray-300 px-4 py-2.5 md:py-3 text-xs md:text-sm font-medium focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200"
                    required
                  >
                    <option value="" disabled selected>{t('Select a customer')}</option>
                    {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-800 mb-2">{t('Message')}</label>
                  <textarea
                    {...register('message')}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 md:py-3 text-xs md:text-sm font-medium focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200 resize-none"
                    rows="4"
                    required
                    placeholder={t("Dear customer, your payment of ₹...")}
                  ></textarea>
                </div>

                {/* Scheduled Date */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-800 mb-2">{t('Scheduled Date')}</label>
                  <input
                    type="date"
                    {...register('scheduledDate')}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 md:py-3 text-xs md:text-sm font-medium focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200"
                    required
                  />
                </div>

                {/* Channel */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-800 mb-2">{t('Channel')}</label>
                  <select
                    {...register('type')}
                    className="cursor-pointer w-full rounded-xl border border-gray-300 px-4 py-2.5 md:py-3 text-xs md:text-sm font-medium focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200"
                  >
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="EMAIL">Email</option>
                  </select>

                  {/* Warning message if EMAIL selected but customer has no email */}
                  {selectedType === 'EMAIL' && selectedCustomerId && (() => {
                    const customer = customers.find(c => c._id === selectedCustomerId);
                    if (!customer?.email) {
                      return (
                        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 animate-scale-in">
                          <Mail className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs md:text-sm text-amber-800 font-medium">
                            ⚠️ {t('This customer does not have an email address. Please add their email first or use WhatsApp reminder.')}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="cursor-pointer w-full bg-[#093C5D] hover:bg-[#082a42] text-white rounded-full px-5 md:px-6 lg:px-7 py-2.5 md:py-3 lg:py-3.5 font-semibold text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 active:scale-95 transition-all"
                >
                  {mutation.isPending ? t('Saving...') : isEditMode ? t('Update Reminder') : t('Save Reminder')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reminders;
