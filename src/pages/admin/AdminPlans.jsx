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
    <div className="space-y-6 pb-12">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              SaaS Plan Limits & Pricing
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Live Dynamic Quotas
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Configure live subscription plan pricing, customer quotas, monthly invoice allowances, and feature entitlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPlans}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleResetDefaults}
            disabled={resetting || loading}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-rose-600 transition-colors shadow-sm disabled:opacity-60"
            title="Reset all tiers to factory defaults"
          >
            <RotateCcw className={`w-4 h-4 ${resetting ? 'animate-spin text-rose-600' : ''}`} />
            <span>{resetting ? 'Resetting...' : 'Reset Defaults'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Tiers */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Configured Tiers
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {loading ? '...' : `${activeTiersCount} Active`}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{plans.length} total tiers defined</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Total Subscribed Stores */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Total Subscribed Stores
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {loading ? '...' : totalSubscribers}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Across all active plans</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Paid Tiers Available */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Paid Pro Plans
            </p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">
              {loading ? '...' : `${paidPlans.length} Tiers`}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Monthly, Quarterly, Yearly</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Free Trial Status */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Free Starter Quota
            </p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {loading
                ? '...'
                : `${plans.find((p) => p.planId === 'FREE')?.trialDays || 7} Days`}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {plans.find((p) => p.planId === 'FREE')?.maxBills || 10} Bills /{' '}
              {plans.find((p) => p.planId === 'FREE')?.maxCustomers || 2} Cust
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
            <Crown className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Plan Cards Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600">Loading SaaS plans configuration...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
