import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Globe,
  SlidersHorizontal,
  Lock,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { getPlatformSettings, updatePlatformSettings } from '../../features/admin/api/adminApi';
import GeneralPlatformSettings from '../../features/admin/components/settings/GeneralPlatformSettings';
import PlatformOperationsSettings from '../../features/admin/components/settings/PlatformOperationsSettings';
import AdminSecuritySettings from '../../features/admin/components/settings/AdminSecuritySettings';
import PlatformNotificationSettings from '../../features/admin/components/settings/PlatformNotificationSettings';
import SwirlingLoader from '../../components/common/SwirlingLoader';

// ── Section Nav Item (Exact pattern from Shopkeeper Settings) ──
const SectionNavItem = ({ icon: Icon, label, sectionId, activeSection, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(sectionId)}
    className={`cursor-pointer w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 text-left ${
      activeSection === sectionId
        ? 'bg-[#093C5D]/5 text-[#093C5D] border border-[#093C5D]/15'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
    }`}
  >
    <Icon className="w-4 h-4 shrink-0" />
    <span className="truncate">{label}</span>
    <ChevronRight
      className={`w-3.5 h-3.5 ml-auto shrink-0 transition-transform ${
        activeSection === sectionId ? 'rotate-90' : ''
      }`}
    />
  </button>
);

const AdminSettings = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [activeSection, setActiveSection] = useState(() => {
    return localStorage.getItem('udharpay_admin_settings_tab') || 'general';
  });

  useEffect(() => {
    localStorage.setItem('udharpay_admin_settings_tab', activeSection);
  }, [activeSection]);

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
      toast.success(variables?.customMessage || t('Platform settings updated successfully'));
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t('Failed to update platform settings'));
    },
  });

  const handleUpdate = (formData, customMessage) => {
    mutation.mutate({ formData, customMessage });
  };

  const sections = [
    { id: 'general', icon: Globe, label: t('Platform Details') },
    { id: 'operations', icon: SlidersHorizontal, label: t('Operations & Quotas') },
    { id: 'notifications', icon: Bell, label: t('Notifications') },
    { id: 'security', icon: Lock, label: t('Password & Security') },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <SwirlingLoader />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-red-200 text-red-700 shadow-none my-6">
        <p className="font-semibold text-sm sm:text-base">{t('Failed to load platform settings.')}</p>
        <button
          onClick={() => refetch()}
          className="mt-3 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-semibold hover:bg-red-100 transition-colors cursor-pointer"
        >
          {t('Try Again')}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 pb-24 lg:pb-0">
      {/* ── Page Header (Identical to Shopkeeper Settings) ── */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">{t('Platform Settings')}</h1>
        <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed font-normal">
          {t('Manage global branding, support channels, operational switches and security')}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* ── Left Nav (Desktop) ── */}
        <div className="hidden lg:block w-56 xl:w-60 shrink-0">
          <nav className="sticky top-24 space-y-1">
            {sections.map(({ id, icon: Icon, label }) => (
              <SectionNavItem
                key={id}
                icon={Icon}
                label={label}
                sectionId={id}
                activeSection={activeSection}
                onClick={setActiveSection}
              />
            ))}
          </nav>
        </div>

        {/* ── Mobile Nav (Horizontal Scroll) ── */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {sections.map(({ id, icon: Icon, label }) => (
            <div
              key={id}
              onClick={() => setActiveSection(id)}
              className={`cursor-pointer flex items-center justify-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-semibold whitespace-nowrap border transition-colors shrink-0 ${
                activeSection === id
                  ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15'
                  : 'text-gray-600 hover:text-gray-900 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {label}
            </div>
          ))}
        </div>

        {/* ── Right Content Panels ── */}
        <div className="flex-1 min-w-0">
          {activeSection === 'general' && (
            <GeneralPlatformSettings
              settings={settings}
              onUpdate={handleUpdate}
              isUpdating={mutation.isPending}
            />
          )}

          {activeSection === 'operations' && (
            <PlatformOperationsSettings
              settings={settings}
              onUpdate={handleUpdate}
              isUpdating={mutation.isPending}
            />
          )}

          {activeSection === 'notifications' && (
            <PlatformNotificationSettings
              settings={settings}
              onUpdate={handleUpdate}
              isUpdating={mutation.isPending}
            />
          )}

          {activeSection === 'security' && <AdminSecuritySettings />}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
