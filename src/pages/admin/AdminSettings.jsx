/**
 * Master Platform Configuration & System Operations Settings
 * Tabbed administrative portal managing global branding, operational policies, maintenance mode, security, and WhatsApp gateway.
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Globe,
  SlidersHorizontal,
  Wrench,
  Lock,
  Laptop,
  Bell,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { getPlatformSettings, updatePlatformSettings } from '../../features/admin/api/adminApi';
import GeneralPlatformSettings from '../../features/admin/components/settings/GeneralPlatformSettings';
import PlatformOperationsSettings from '../../features/admin/components/settings/PlatformOperationsSettings';
import PlatformMaintenanceSettings from '../../features/admin/components/settings/PlatformMaintenanceSettings';
import AdminSecuritySettings from '../../features/admin/components/settings/AdminSecuritySettings';
import AdminActiveDevices from '../../features/admin/components/settings/AdminActiveDevices';
import PlatformNotificationSettings from '../../features/admin/components/settings/PlatformNotificationSettings';
import WhatsAppGatewaySettings from '../../features/admin/components/settings/WhatsAppGatewaySettings';
import SwirlingLoader from '../../components/common/SwirlingLoader';
import AppVersionCard from '../../components/common/AppVersionCard';

/**
 * Navigation Item Component
 * Renders selectable tab button in the desktop administrative settings sidebar.
 */
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
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');

  const [activeSection, setActiveSection] = useState(() => {
    return urlTab || localStorage.getItem('udharpay_admin_settings_tab') || 'general';
  });

  useEffect(() => {
    if (urlTab && urlTab !== activeSection) {
      setActiveSection(urlTab);
    }
  }, [urlTab, activeSection]);

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
    { id: 'whatsapp', icon: MessageCircle, label: t('WhatsApp Gateway') },
    { id: 'operations', icon: SlidersHorizontal, label: t('Operations & Quotas') },
    { id: 'maintenance', icon: Wrench, label: t('Platform Maintenance') },
    { id: 'notifications', icon: Bell, label: t('Notifications') },
    { id: 'security', icon: Lock, label: t('Password & Security') },
    { id: 'devices', icon: Laptop, label: t('Active Devices') },
  ];

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 pb-24 lg:pb-0">
      {/**
       * Administrative Settings Header
       * Displays page title and concise context for global platform configuration.
       */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">{t('Platform Settings')}</h1>
        <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed font-normal">
          {t('Manage global branding, support channels, operational switches and security')}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/**
         * Desktop Sidebar Navigation
         * Fixed-width panel with quick navigation links and system version information.
         */}
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

            {/**
             * Application Version Badge (Desktop)
             * Embedded build version info within the sidebar navigation.
             */}
            <div className="pt-4 border-t border-gray-100 mt-4">
              <AppVersionCard variant="sidebar" />
            </div>
          </nav>
        </div>

        {/**
         * Mobile Navigation Bar
         * Horizontally scrollable pill tabs for switching platform configuration sections.
         */}
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

        {/**
         * Content Panels Container
         * Dynamic settings sub-panel rendering based on the active navigation section.
         */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-16 text-center shadow-none">
              <SwirlingLoader className="w-10 h-10 text-[#093C5D] mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-600">{t('Loading platform configurations...')}</p>
            </div>
          ) : isError ? (
            <div className="p-8 text-center bg-white rounded-lg border border-red-200 text-red-700 shadow-none">
              <p className="font-semibold text-sm sm:text-base">{t('Failed to load platform settings.')}</p>
              <button
                onClick={() => refetch()}
                className="mt-3 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-semibold hover:bg-red-100 transition-colors cursor-pointer"
              >
                {t('Try Again')}
              </button>
            </div>
          ) : (
            <>
              {activeSection === 'general' && (
                <GeneralPlatformSettings
                  settings={settings}
                  onUpdate={handleUpdate}
                  isUpdating={mutation.isPending}
                />
              )}

              {activeSection === 'whatsapp' && <WhatsAppGatewaySettings />}

              {activeSection === 'operations' && (
                <PlatformOperationsSettings
                  settings={settings}
                  onUpdate={handleUpdate}
                  isUpdating={mutation.isPending}
                />
              )}

              {activeSection === 'maintenance' && (
                <PlatformMaintenanceSettings
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

              {activeSection === 'devices' && <AdminActiveDevices />}
            </>
          )}

          {/**
           * Application Version Card (Mobile / Tablet)
           * Footer version info display for smaller screen layouts.
           */}
          <div className="lg:hidden pt-4 pb-2">
            <AppVersionCard variant="full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
