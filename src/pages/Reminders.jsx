import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Plus, Bell, Clock, Calendar, User, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const Reminders = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    mutationFn: (newReminder) => api.post('/reminders', newReminder),
    onSuccess: () => {
      queryClient.invalidateQueries(['reminders']);
      setIsModalOpen(false);
      reset();
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('Reminders')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('Automate your payment recovery via WhatsApp/Email')}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center font-medium w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('Set Reminder')}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {isLoading ? (
          <div className="text-center text-gray-500">{t('Loading')}...</div>
        ) : reminders.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>{t('No active reminders. Keep track of payments automatically.')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reminders.map((reminder, index) => (
              <div 
                key={reminder._id} 
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-all duration-200 bg-white animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center text-blue-600 font-medium">
                    <User className="w-4 h-4 mr-2" />
                    {reminder.customerId?.name || t('Deleted Customer')}
                  </div>
                  <span className={`px-2 py-1 rounded-md text-xs font-semibold ${reminder.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : reminder.status === 'SENT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {reminder.status}
                  </span>
                </div>
                <p className="text-gray-700 text-sm mb-4 line-clamp-2">{reminder.message}</p>
                <div className="flex items-center text-gray-500 text-xs">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(reminder.scheduledDate).toLocaleDateString()}
                  <Clock className="w-4 h-4 ml-4 mr-1" />
                  {reminder.type}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-8">
            <div className="fixed inset-0 bg-black/30 animate-modal-overlay" onClick={() => setIsModalOpen(false)} />
            <div className="relative bg-white rounded-xl border border-gray-200 max-w-md w-full p-6 animate-modal-content">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">{t('Set Custom Reminder')}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('Customer')}</label>
                  <select {...register('customerId')} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                    <option value="">{t('Select a customer')}</option>
                    {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('Message')}</label>
                  <textarea {...register('message')} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows="3" required placeholder={t("Dear customer, your payment of ₹...")}></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('Scheduled Date')}</label>
                  <input type="date" {...register('scheduledDate')} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('Channel')}</label>
                  <select {...register('type')} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="EMAIL">Email</option>
                  </select>
                </div>
                <button type="submit" disabled={mutation.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-medium disabled:opacity-50">
                  {mutation.isPending ? t('Saving...') : t('Save Reminder')}
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
