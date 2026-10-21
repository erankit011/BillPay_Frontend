import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Globe,
  SlidersHorizontal,
  Lock,
  Bell,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getPlatformSettings, updatePlatformSettings } from '../../features/admin/api/adminApi';
import GeneralPlatformSettings from '../../features/admin/components/settings/GeneralPlatformSettings';
import PlatformOperationsSettings from '../../features/admin/components/settings/PlatformOperationsSettings';
import AdminSecuritySettings from '../../features/admin/components/settings/AdminSecuritySettings';
import PlatformNotificationSettings from '../../features/admin/components/settings/PlatformNotificationSettings';
import SwirlingLoader from '../../components/common/SwirlingLoader';

const SECTIONS = [
  {
    id: 'GENERAL',
    label: 'Brand & Localization',
    desc: 'Platform name, support contacts & currency',
    icon: Globe,
  },
  {
    id: 'OPERATIONS',
    label: 'Operations & Switches',
    desc: 'Maintenance mode & free tier allowances',
    icon: SlidersHorizontal,
  },
  {
    id: 'SECURITY',
    label: 'Admin Security',
    desc: 'Master credentials & active sessions',
    icon: Lock,
  },
  {
    id: 'NOTIFICATIONS',
    label: 'Alert Preferences',
    desc: 'Email, SMS & WhatsApp notifications',
    icon: Bell,
  },
];

const SectionNavItem = ({ icon: Icon, label, desc, sectionId, activeSection, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(sectionId)}
    className={`cursor-pointer w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left ${
      activeSection === sectionId
        ? 'bg-[#093C5D]/5 text-[#093C5D] border border-[#093C5D]/15 font-semibold'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
    }`}
  >
    <div
      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        activeSection === sectionId
          ? 'bg-[#093C5D] text-white'
          : 'bg-gray-100 text-gray-500'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
    </div>
    <div className="min-w-0 flex-1">
      <span className="truncate block leading-tight">{label}</span>
      <span className="text-[11px] text-gray-400 font-normal truncate block mt-0.5">
        {desc}
      </span>
    </div>
    <ChevronRight
      className={`w-3.5 h-3.5 ml-auto shrink-0 transition-transform ${
        activeSection === sectionId ? 'rotate-90 text-[#093C5D]' : 'text-gray-400'
      }`}
    />
  </button>
);

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('GENERAL');

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
      toast.success(variables?.customMessage || 'Platform settings updated successfully');
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
          className="mt-3 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-semibold hover:bg-red-100 transition-colors cursor-pointer"
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
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">
            Platform & System Settings
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed font-medium">
            Manage global branding, support channels, live operational switches, and default SaaS quotas.
          </p>
        </div>
      </div>

      {/* Main Layout Grid: Left Sidebar (Desktop) + Right Content */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* ── Left Sidebar Nav (Desktop) ── */}
        <div className="hidden lg:block w-64 xl:w-72 shrink-0">
          <nav className="sticky top-20 space-y-1.5 bg-white p-2.5 rounded-lg border border-gray-200">
            <div className="px-3 py-2 border-b border-gray-100 mb-1">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Configuration Sections
              </span>
            </div>
            {SECTIONS.map((sec) => (
              <SectionNavItem
                key={sec.id}
                icon={sec.icon}
                label={sec.label}
                desc={sec.desc}
                sectionId={sec.id}
                activeSection={activeSection}
                onClick={setActiveSection}
              />
            ))}
          </nav>
        </div>

        {/* ── Mobile Horizontal Scroll Nav (Mobile / Tablet) ── */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={`cursor-pointer flex items-center justify-center gap-2 px-3.5 py-2 rounded text-xs font-semibold whitespace-nowrap border transition-all shrink-0 ${
                  isActive
                    ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/20'
                    : 'text-gray-600 hover:text-gray-900 border-gray-200 hover:bg-gray-50 bg-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#093C5D]' : 'text-gray-400'}`} />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Right Content Panels ── */}
        <div className="flex-1 min-w-0">
          {activeSection === 'GENERAL' && (
            <GeneralPlatformSettings
              settings={settings}
              onUpdate={handleUpdate}
              isUpdating={mutation.isPending}
            />
          )}

          {activeSection === 'OPERATIONS' && (
            <PlatformOperationsSettings
              settings={settings}
              onUpdate={handleUpdate}
              isUpdating={mutation.isPending}
            />
          )}

          {activeSection === 'SECURITY' && <AdminSecuritySettings />}

          {activeSection === 'NOTIFICATIONS' && (
            <PlatformNotificationSettings
              settings={settings}
              onUpdate={handleUpdate}
              isUpdating={mutation.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
