import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Globe,
  Sliders,
  Lock,
  Bell,
  ShieldCheck,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getPlatformSettings, updatePlatformSettings } from '../../features/admin/api/adminApi';
import GeneralPlatformSettings from '../../features/admin/components/settings/GeneralPlatformSettings';
import PlatformOperationsSettings from '../../features/admin/components/settings/PlatformOperationsSettings';
import AdminSecuritySettings from '../../features/admin/components/settings/AdminSecuritySettings';
import PlatformNotificationSettings from '../../features/admin/components/settings/PlatformNotificationSettings';
import SwirlingLoader from '../../components/common/SwirlingLoader';

const TABS = [
  { id: 'GENERAL', label: 'General & Brand', icon: Globe },
  { id: 'OPERATIONS', label: 'Operations & Switches', icon: SlidersHorizontal },
  { id: 'SECURITY', label: 'Admin Security', icon: Lock },
  { id: 'NOTIFICATIONS', label: 'Alert Preferences', icon: Bell },
];

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('GENERAL');

  const { data: settings, isLoading, isError, refetch } = useQuery({
    queryKey: ['platformSettings'],
    queryFn: getPlatformSettings,
    staleTime: 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: ({ formData }) => updatePlatformSettings(formData),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['platformSettings'] });
      queryClient.invalidateQueries({ queryKey: ['activeBroadcasts'] });
      queryClient.invalidateQueries({ queryKey: ['publicContactInfo'] });
      queryClient.invalidateQueries({ queryKey: ['adminPlans'] });
      toast.success(variables?.customMessage || 'Settings updated successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update platform settings');
    },
  });

  const handleUpdate = (formData, customMessage) => {
    mutation.mutate({ formData, customMessage });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[75vh]">
        <SwirlingLoader className="w-10 h-10 md:w-12 md:h-12 text-[#093C5D]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-red-200 text-red-700 shadow-none my-6">
        <p className="font-semibold text-sm sm:text-base">Failed to load platform settings.</p>
        <button
          onClick={() => refetch()}
          className="mt-3 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 pb-24 lg:pb-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">
              Platform & Admin Settings
            </h1>
            <span className="text-[10px] sm:text-xs font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-[#093C5D] border border-blue-200">
              Admin Only
            </span>
          </div>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed font-medium">
            Configure system-wide parameters, operational switches, security credentials, and notification dispatches.
          </p>
        </div>
      </div>

      {/* Tabs Navigation Strip */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-px" aria-label="Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`cursor-pointer inline-flex items-center gap-2 py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap select-none ${
                  isActive
                    ? 'border-[#093C5D] text-[#093C5D]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#093C5D]' : 'text-gray-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        {activeTab === 'GENERAL' && (
          <GeneralPlatformSettings
            settings={settings}
            onUpdate={handleUpdate}
            isUpdating={mutation.isPending}
          />
        )}

        {activeTab === 'OPERATIONS' && (
          <PlatformOperationsSettings
            settings={settings}
            onUpdate={handleUpdate}
            isUpdating={mutation.isPending}
          />
        )}

        {activeTab === 'SECURITY' && <AdminSecuritySettings />}

        {activeTab === 'NOTIFICATIONS' && (
          <PlatformNotificationSettings
            settings={settings}
            onUpdate={handleUpdate}
            isUpdating={mutation.isPending}
          />
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
