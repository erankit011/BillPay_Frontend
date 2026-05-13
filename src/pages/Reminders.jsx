import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Plus, Bell, Clock, Calendar, CheckCircle2, User, X } from 'lucide-react';
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
          <h1 className="text-2xl font-semibold text-gray-900">{t('Reminders')}</h1>
          <p className="text-gray-500 text-sm">{t('Automate your payment recovery via WhatsApp/Email')}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center shadow-sm w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('Set Reminder')}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6">
        {isLoading ? (
          <div className="text-center text-gray-500">{t('Loading')}...</div>
        ) : reminders.length === 0 ? (
          <div className="text-center text-gray-500">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>{t('No active reminders. Keep track of payments automatically.')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reminders.map((reminder, idx) => (
              <div key={reminder._id} className="border border-gray-100 rounded-2xl p-4 hover:shadow-lg transition-all duration-300 bg-white hover:-translate-y-1 cursor-pointer animate-fade-in group" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-800 transition-colors">
                    <User className="w-4 h-4 mr-2" />
                    {reminder.customerId?.name || t('Deleted Customer')}
                  </div>
                  <span className={`px-2 py-1 rounded-md text-xs font-semibold ${reminder.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : reminder.status === 'SENT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {reminder.status}
                  </span>
                </div>
                <p className="text-gray-700 text-sm mb-4 line-clamp-2">{reminder.message}</p>
                <div className="flex items-center text-gray-500 text-xs mt-auto">
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
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl sm:align-middle relative z-10 animate-scale-in">
              <div className="flex items-center justify-between mb-5 pb-4 border-b">
                <h3 className="text-xl font-semibold text-gray-900">{t('Set Custom Reminder')}</h3>
                <button onClick={() => setIsModalOpen(false)} className="hover:bg-gray-100 p-1 rounded-full transition-colors"><X className="w-6 h-6 text-gray-400 hover:text-gray-700" /></button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('Customer')}</label>
                  <select {...register('customerId')} className="mt-1 block w-full rounded-xl bg-white border border-gray-200 px-3 py-2.5" required>
                    <option value="">{t('Select a customer')}</option>
                    {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('Message')}</label>
                  <textarea {...register('message')} className="mt-1 block w-full rounded-xl bg-white border border-gray-200 px-3 py-2.5" rows="3" required placeholder={t("Dear customer, your payment of ₹...")}></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('Scheduled Date')}</label>
                  <input type="date" {...register('scheduledDate')} className="mt-1 block w-full rounded-xl bg-white border border-gray-200 px-3 py-2.5" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('Channel')}</label>
                  <select {...register('type')} className="mt-1 block w-full rounded-xl bg-white border border-gray-200 px-3 py-2.5">
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="EMAIL">Email</option>
                  </select>
                </div>
                <button type="submit" disabled={mutation.isPending} className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium hover:bg-blue-700">
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
