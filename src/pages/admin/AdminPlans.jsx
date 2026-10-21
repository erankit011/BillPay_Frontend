import React, { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Layers,
  RefreshCw,
  RotateCcw,
  Users,
  CreditCard,
  Crown,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getAdminPlans,
  updateAdminPlan,
  resetAdminPlans,
} from '../../features/admin/api/adminApi';
import PlanCard from '../../features/admin/components/plans/PlanCard';
import EditPlanModal from '../../features/admin/components/plans/EditPlanModal';
import SwirlingLoader from '../../components/common/SwirlingLoader';

const AdminPlans = () => {
  const queryClient = useQueryClient();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminPlans();
      if (data) setPlans(data);
    } catch (err) {
      toast.error('Failed to load SaaS plan tiers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleUpdatePlan = async (planId, payload) => {
    try {
      await updateAdminPlan(planId, payload);
      queryClient.invalidateQueries({ queryKey: ['platformSettings'] });
      queryClient.invalidateQueries({ queryKey: ['publicPlans'] });
      queryClient.invalidateQueries({ queryKey: ['adminPlans'] });
      toast.success('Plan configuration updated successfully');
      fetchPlans();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update plan';
      toast.error(msg);
      throw err;
    }
  };

  const handleResetDefaults = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset all 4 plan tiers to platform factory default quotas and pricing?'
    );
    if (!confirmed) return;

    try {
      setResetting(true);
      const data = await resetAdminPlans();
      if (data) {
        setPlans(data.data || data);
        queryClient.invalidateQueries({ queryKey: ['platformSettings'] });
        queryClient.invalidateQueries({ queryKey: ['publicPlans'] });
        queryClient.invalidateQueries({ queryKey: ['adminPlans'] });
        toast.success('All plans reset to factory defaults');
      }
    } catch (err) {
      toast.error('Failed to reset plans to defaults');
    } finally {
      setResetting(false);
    }
  };

  const handleOpenEdit = (plan) => {
    setSelectedPlan(plan);
    setIsEditModalOpen(true);
  };

  // KPI Calculations
  const totalSubscribers = plans.reduce((acc, p) => acc + (p.subscriberCount || 0), 0);
  const paidPlans = plans.filter((p) => p.price > 0);
  const activeTiersCount = plans.filter((p) => p.isActive).length;

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 pb-24 lg:pb-0">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">
            SaaS Plan Limits & Pricing
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed font-medium">
            Configure live subscription plan pricing, customer quotas, monthly invoice allowances, and feature entitlements.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleResetDefaults}
            disabled={resetting || loading}
            className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors h-10 disabled:opacity-60"
            title="Reset all tiers to factory defaults"
          >
            <RotateCcw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Resetting...' : 'Reset Defaults'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
        {/* Total Active Tiers */}
        <div className="bg-white rounded-lg p-4 md:p-5 flex flex-col justify-between border border-gray-200 hover:border-gray-300 transition-all duration-200">
          <div className="flex justify-between items-start gap-1">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">
              Configured Tiers
            </p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">
              {loading ? '...' : `${activeTiersCount} Active`}
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate mt-0.5">
              {plans.length} total tiers defined
            </p>
          </div>
        </div>

        {/* Total Subscribed Stores */}
        <div className="bg-white rounded-lg p-4 md:p-5 flex flex-col justify-between border border-gray-200 hover:border-gray-300 transition-all duration-200">
          <div className="flex justify-between items-start gap-1">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-emerald-700 border border-gray-200 shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">
              Subscribed Stores
            </p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-emerald-700 truncate">
              {loading ? '...' : totalSubscribers}
            </p>
            <p className="text-[10px] md:text-xs text-emerald-700 font-medium truncate mt-0.5">
              Across all merchant tiers
            </p>
          </div>
        </div>

        {/* Paid Tiers Available */}
        <div className="bg-white rounded-lg p-4 md:p-5 flex flex-col justify-between border border-gray-200 hover:border-gray-300 transition-all duration-200">
          <div className="flex justify-between items-start gap-1">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-purple-700 border border-gray-200 shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">
              Paid Pro Plans
            </p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">
              {loading ? '...' : `${paidPlans.length} Tiers`}
            </p>
            <p className="text-[10px] md:text-xs text-purple-700 font-medium truncate mt-0.5">
              Monthly, Quarterly, Yearly
            </p>
          </div>
        </div>

        {/* Free Starter Status */}
        <div className="bg-white rounded-lg p-4 md:p-5 flex flex-col justify-between border border-gray-200 hover:border-gray-300 transition-all duration-200">
          <div className="flex justify-between items-start gap-1">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-amber-600 border border-gray-200 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">
              Free Starter Quota
            </p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-amber-600 truncate">
              {loading
                ? '...'
                : `${plans.find((p) => p.planId === 'FREE')?.trialDays || 7} Days`}
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate mt-0.5">
              {plans.find((p) => p.planId === 'FREE')?.maxBills || 10} Bills /{' '}
              {plans.find((p) => p.planId === 'FREE')?.maxCustomers || 2} Cust
            </p>
          </div>
        </div>
      </div>

      {/* Plan Cards Grid */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
          <SwirlingLoader className="w-10 h-10 text-[#093C5D] mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600">Loading SaaS plans configuration...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {plans.map((plan) => (
            <PlanCard key={plan.planId} plan={plan} onEdit={handleOpenEdit} />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <EditPlanModal
        isOpen={isEditModalOpen}
        plan={selectedPlan}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPlan(null);
        }}
        onSave={handleUpdatePlan}
      />
    </div>
  );
};

export default AdminPlans;
