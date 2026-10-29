/**
 * Platform Subscription Plans & Pricing Catalog Management
 * Configures dynamic pricing tiers, customer & billing caps, trial windows, and plan resets.
 */

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Layers,
  RotateCcw,
  Users,
  CreditCard,
  Crown,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  getAdminPlans,
  updateAdminPlan,
  resetAdminPlans,
} from '../../features/admin/api/adminApi';
import PlanCard from '../../features/admin/components/plans/PlanCard';
import EditPlanModal from '../../features/admin/components/plans/EditPlanModal';
import AdminStatCard from '../../features/admin/components/AdminStatCard';
import SwirlingLoader from '../../components/common/SwirlingLoader';

/**
 * AdminPlans Component
 */
const AdminPlans = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [resetting, setResetting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [confirmResetModal, setConfirmResetModal] = useState(false);

  const { data: plansData, isLoading: loading } = useQuery({
    queryKey: ['adminPlans'],
    queryFn: getAdminPlans,
    staleTime: 30 * 1000,
  });

  const plans = plansData || [];

  const handleUpdatePlan = async (planId, payload) => {
    try {
      await updateAdminPlan(planId, payload);
      queryClient.invalidateQueries({ queryKey: ['platformSettings'] });
      queryClient.invalidateQueries({ queryKey: ['publicPlans'] });
      queryClient.invalidateQueries({ queryKey: ['adminPlans'] });
      toast.success(t('Plan configuration updated successfully'));
    } catch (err) {
      const msg = err.response?.data?.message || t('Failed to update plan');
      toast.error(msg);
      throw err;
    }
  };

  const executeResetDefaults = async () => {
    try {
      setResetting(true);
      await resetAdminPlans();
      queryClient.invalidateQueries({ queryKey: ['platformSettings'] });
      queryClient.invalidateQueries({ queryKey: ['publicPlans'] });
      queryClient.invalidateQueries({ queryKey: ['adminPlans'] });
      toast.success(t('All plans reset to factory defaults'));
      setConfirmResetModal(false);
    } catch (err) {
      toast.error(t('Failed to reset plans to defaults'));
    } finally {
      setResetting(false);
    }
  };

  const handleOpenEdit = (plan) => {
    setSelectedPlan(plan);
    setIsEditModalOpen(true);
  };

  /**
   * Plan Aggregate Calculations
   * Computes subscriber sums, active tier count, and extracts baseline Free tier quota defaults.
   */
  const totalSubscribers = plans.reduce((acc, p) => acc + (p.subscriberCount || 0), 0);
  const paidPlans = plans.filter((p) => p.price > 0);
  const activeTiersCount = plans.filter((p) => p.isActive).length;
  const freePlan = plans.find((p) => p.planId === 'FREE');

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12 pb-24 lg:pb-0">
      {/**
       * Page Header Toolbar
       * Plan pricing overview, descriptions, and factory reset trigger button.
       */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">
            {t('SaaS Plan Limits & Pricing')}
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed font-medium">
            {t('Configure live subscription plan pricing, customer quotas, monthly invoice allowances, and feature entitlements.')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setConfirmResetModal(true)}
            disabled={resetting || loading}
            className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 sm:px-5 h-10 sm:h-11 text-xs sm:text-sm font-semibold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg transition-all active:scale-95 shadow-none disabled:opacity-50"
            title={t('Reset all tiers to factory defaults')}
          >
            <RotateCcw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? t('Resetting...') : t('Reset Defaults')}</span>
          </button>
        </div>
      </div>

      {/**
       * Plan KPI Metric Cards Grid
       * Summarizes active subscription tiers, merchant subscribers, Pro count, and Free tier quotas.
       */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
        <AdminStatCard
          title={t('CONFIGURED TIERS')}
          value={loading ? '...' : `${activeTiersCount} Active`}
          subtext={`${plans.length} total tiers defined`}
          icon={Layers}
          variant="primary"
        />

        <AdminStatCard
          title={t('SUBSCRIBED STORES')}
          value={loading ? '...' : totalSubscribers}
          subtext={t('Across all merchant tiers')}
          icon={Users}
          variant="success"
        />

        <AdminStatCard
          title={t('PAID PRO PLANS')}
          value={loading ? '...' : `${paidPlans.length} Tiers`}
          subtext="Monthly, Quarterly, Yearly"
          icon={CreditCard}
          variant="default"
        />

        <AdminStatCard
          title={t('FREE STARTER QUOTA')}
          value={loading ? '...' : `${freePlan?.trialDays || 7} Days`}
          subtext={`${freePlan?.maxBills || 10} Bills / ${freePlan?.maxCustomers || 2} Cust`}
          icon={Crown}
          variant="warning"
        />
      </div>

      {/**
       * Subscription Plan Cards Grid
       * 4-column responsive grid displaying each pricing tier and feature allowance.
       */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-16 text-center shadow-none">
          <SwirlingLoader className="w-10 h-10 text-[#093C5D] mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600">{t('Loading SaaS plans configuration...')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5 items-stretch">
          {plans.map((plan) => (
            <PlanCard key={plan.planId} plan={plan} onEdit={handleOpenEdit} />
          ))}
        </div>
      )}

      {/**
       * Plan Configuration Edit Modal
       * Dialog enabling adjustments to tier pricing, quota caps, and feature toggles.
       */}
      <EditPlanModal
        isOpen={isEditModalOpen}
        plan={selectedPlan}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPlan(null);
        }}
        onSave={handleUpdatePlan}
      />

      {/**
       * Reset Factory Defaults Confirmation Dialog
       * Confirms restoration of default subscription tiers and pricing models.
       */}
      {confirmResetModal && (
        <div className="fixed inset-0 z-50 overscroll-contain">
          {/**
           * Modal Backdrop Overlay
           * Semi-transparent overlay blocking interaction with background.
           */}
          <div
            className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay"
            onClick={() => !resetting && setConfirmResetModal(false)}
          />

          {/**
           * Confirmation Modal Dialog Body
           * Warning alert icon, prompt text, and action buttons.
           */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
            <div
              className="bg-white rounded-lg w-full max-w-sm overflow-hidden animate-scale-in pointer-events-auto border border-gray-200 shadow-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 sm:p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-rose-50 mx-auto flex items-center justify-center mb-3.5 border border-rose-100">
                  <RotateCcw className="w-6 h-6 text-rose-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5">
                  {t('Reset All Plan Tiers?')}
                </h3>
                <p className="text-gray-500 text-xs sm:text-sm mb-6 font-medium leading-relaxed">
                  {t('Are you sure you want to reset all 4 plan tiers to platform factory default quotas and pricing? This will overwrite custom limits.')}
                </p>

                <div className="flex gap-2.5 sm:gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => setConfirmResetModal(false)}
                    disabled={resetting}
                    className="cursor-pointer flex-1 px-4 py-2 sm:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-xs sm:text-sm transition-colors active:scale-95 disabled:opacity-50"
                  >
                    {t('No, Cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={executeResetDefaults}
                    disabled={resetting}
                    className="cursor-pointer flex-1 px-4 py-2 sm:py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium text-xs sm:text-sm transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {resetting ? (
                      <>
                        <RotateCcw className="w-4 h-4 animate-spin" />
                        <span>{t('Resetting...')}</span>
                      </>
                    ) : (
                      <span>{t('Yes, Reset')}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPlans;
