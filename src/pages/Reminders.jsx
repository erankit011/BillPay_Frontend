import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Plus, Bell, Clock, User, X, MessageSquare, Mail, Edit, Trash2, TrendingUp, Lightbulb, Activity } from 'lucide-react';
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

  const { register, handleSubmit, reset } = useForm();

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
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (reminderId) => api.delete(`/reminders/${reminderId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['reminders']);
    }
  });

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
    mutation.mutate(data);
  };

  // Filter reminders based on status and search query
  const filteredReminders = reminders.filter(r => {
    const matchesStatus = filterStatus === 'All' || r.status === filterStatus.toUpperCase();
    const customerName = r.customerId?.name || '';
    const matchesSearch = customerName.toLowerCase().includes(searchName.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate stats
  const pendingCount = reminders.filter(r => r.status === 'PENDING').length;
  const sentCount = reminders.filter(r => r.status === 'SENT').length;
  const totalPending = reminders.reduce((sum, r) => r.status === 'PENDING' ? sum + (r.amount || 0) : sum, 0);
  const recovered = reminders.reduce((sum, r) => r.status === 'SENT' ? sum + (r.amount || 0) : sum, 0);
  const recoveryRate = reminders.length > 0 ? Math.round((sentCount / reminders.length) * 100) : 84;

  return (
    <div className="w-full space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">{t('Reminders')}</h1>
            <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed">
              {t('Automate your payment recovery via WhatsApp and Email. Set smart triggers to ensure your Udhar is cleared on time without manual follow-ups.')}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-full flex items-center font-semibold text-xs sm:text-sm w-full sm:w-auto justify-center active:scale-95 transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
            {t('Set Reminder')}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 md:space-y-5">
            {/* Search Bar */}
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder={t('Search by customer name...')}
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="block w-full pl-12 pr-4 py-2.5 md:py-3 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base font-medium transition-colors duration-200"
              />
            </div>

            {/* Filter Tabs */}
            <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-3 overflow-x-auto">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="text-sm text-gray-500 font-medium whitespace-nowrap">{t('Filter by status')}</span>
                <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                  {['All', 'Pending', 'Sent'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`cursor-pointer px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap active:scale-95 ${filterStatus === status
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      {t(status)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reminders List */}
            <div className="space-y-3 md:space-y-4">
              {isLoading ? (
                <div className="bg-white border border-gray-200 rounded-xl p-8 md:p-10 lg:p-12 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-indigo-600 mx-auto"></div>
                </div>
              ) : filteredReminders.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-8 md:p-10 lg:p-12 text-center text-gray-500">
                  <Bell className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
                  <p className="font-semibold text-sm md:text-base">{t('No reminders found. Set your first reminder!')}</p>
                </div>
              ) : (
                filteredReminders.map((reminder, index) => (
                  <div
                    key={reminder._id}
                    className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 animate-fade-in hover:border-indigo-200 transition-all"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-3 md:gap-4">
                      {/* Avatar */}
                      <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm md:text-base font-semibold text-gray-900 truncate">
                              {reminder.customerId?.name || t('Deleted Customer')}
                            </h3>
                            <p className="text-sm text-gray-600 mt-0.5 font-medium">
                              Bill #{reminder.billId?.invoiceNumber || 'N/A'} • ₹{reminder.amount || 0}
                            </p>
                          </div>
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${reminder.status === 'PENDING'
                              ? 'bg-indigo-100 text-indigo-700'
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
                                <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              )}
                              <span className={`font-semibold ${reminder.type === 'WHATSAPP' ? 'text-green-600' : 'text-blue-600'}`}>
                                {reminder.type}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(reminder)}
                              className="cursor-pointer p-2 hover:bg-indigo-50 rounded-xl transition-colors active:scale-90"
                              title={t('Edit Reminder')}
                            >
                              <Edit className="w-4 h-4 text-indigo-600" />
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
                  <span className="text-xl md:text-2xl font-semibold text-indigo-600">{recoveryRate}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${recoveryRate}%` }}
                    ></div>
                  </div>
                  <TrendingUp className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-base">
                  <span className="text-gray-600 font-medium">{t('Total Pending')}</span>
                  <span className="font-semibold text-gray-900">₹{totalPending.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-base">
                  <span className="text-gray-600 font-medium">{t('Recovered (MTD)')}</span>
                  <span className="font-semibold text-green-600">₹{recovered.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Smart Tip */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
              <div className="flex items-start gap-2 mb-2">
                <Lightbulb className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 flex-shrink-0" />
                <h3 className="text-base font-semibold text-indigo-900">{t('Smart Tip')}</h3>
              </div>
              <p className="text-base text-indigo-800 leading-relaxed font-medium">
                {t('Sending reminders on Saturday mornings between 9-11 AM increases payment recovery by 22% for retail customers.')}
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
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${reminder.status === 'SENT' ? 'bg-green-500' : 'bg-indigo-500'
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
                  <button className="cursor-pointer text-indigo-600 text-base font-semibold hover:text-indigo-700 transition-colors active:scale-95">
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
                    <label className="block text-sm md:text-base font-semibold text-gray-800 mb-2">{t('Customer')}</label>
                    <select
                      {...register('customerId')}
                      className="cursor-pointer w-full rounded-xl border border-gray-300 px-4 py-2.5 md:py-3 text-sm md:text-base font-medium focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                      required
                    >
                      <option value="" disabled selected>{t('Select a customer')}</option>
                      {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm md:text-base font-semibold text-gray-800 mb-2">{t('Message')}</label>
                    <textarea
                      {...register('message')}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 md:py-3 text-sm md:text-base font-medium focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 resize-none"
                      rows="4"
                      required
                      placeholder={t("Dear customer, your payment of ₹...")}
                    ></textarea>
                  </div>

                  {/* Scheduled Date */}
                  <div>
                    <label className="block text-sm md:text-base font-semibold text-gray-800 mb-2">{t('Scheduled Date')}</label>
                    <input
                      type="date"
                      {...register('scheduledDate')}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 md:py-3 text-sm md:text-base font-medium focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                      required
                    />
                  </div>

                  {/* Channel */}
                  <div>
                    <label className="block text-sm md:text-base font-semibold text-gray-800 mb-2">{t('Channel')}</label>
                    <select
                      {...register('type')}
                      className="cursor-pointer w-full rounded-xl border border-gray-300 px-4 py-2.5 md:py-3 text-sm md:text-base font-medium focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                    >
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="EMAIL">Email</option>
                    </select>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="cursor-pointer w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full px-5 md:px-6 lg:px-7 py-2.5 md:py-3 lg:py-3.5 font-semibold text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 active:scale-95 transition-all"
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
