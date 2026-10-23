import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Tag,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Gift,
  CheckCircle2,
  Users,
  Coins,
  Inbox,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getAdminCoupons,
  getAdminCouponStats,
  createAdminCoupon,
  updateAdminCoupon,
  toggleAdminCoupon,
  deleteAdminCoupon,
} from '../../features/admin/api/adminApi';
import CouponCard from '../../features/admin/components/coupons/CouponCard';
import CouponModal from '../../features/admin/components/coupons/CouponModal';
import AdminStatCard from '../../features/admin/components/AdminStatCard';
import SwirlingLoader from '../../components/common/SwirlingLoader';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active Now' },
  { value: 'INACTIVE', label: 'Paused / Inactive' },
  { value: 'EXPIRED', label: 'Expired' },
];

const DISCOUNT_TYPE_OPTIONS = [
  { value: 'ALL', label: 'All Discount Types' },
  { value: 'PERCENTAGE', label: 'Percentage (%)' },
  { value: 'FLAT', label: 'Flat Cash (₹)' },
];

const AdminCoupons = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const urlSearch = searchParams.get('search') || '';
  const urlStatus = searchParams.get('status') || 'ALL';
  const urlDiscountType = searchParams.get('discountType') || 'ALL';
  const urlPage = Number(searchParams.get('page')) || 1;

  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  // Debounce search input syncing to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (searchTerm) next.set('search', searchTerm);
        else next.delete('search');
        next.set('page', '1');
        return next;
      }, { replace: true });
    }, 450);
    return () => clearTimeout(timer);
  }, [searchTerm, setSearchParams]);

  useEffect(() => {
    if (urlSearch !== debouncedSearch) {
      setSearchTerm(urlSearch);
      setDebouncedSearch(urlSearch);
    }
  }, [urlSearch]);

  const setFilter = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === 'ALL') next.delete(key);
      else next.set(key, value);
      next.set('page', '1');
      return next;
    }, { replace: true });
  };

  const handlePageChange = (newPage) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(newPage));
      return next;
    });
  };

  // React Query for Coupons List
  const { data: couponsData, isLoading: loading } = useQuery({
    queryKey: ['adminCoupons', debouncedSearch, urlStatus, urlDiscountType, urlPage],
    queryFn: () =>
      getAdminCoupons({
        page: urlPage,
        limit: 9,
        search: debouncedSearch || undefined,
        status: urlStatus !== 'ALL' ? urlStatus : undefined,
        discountType: urlDiscountType !== 'ALL' ? urlDiscountType : undefined,
      }),
    staleTime: 30 * 1000,
  });

  // React Query for Coupon Stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['adminCouponStats'],
    queryFn: getAdminCouponStats,
    staleTime: 30 * 1000,
  });

  const coupons = couponsData?.coupons || [];
  const totalPages = couponsData?.pagination?.totalPages || 1;
  const totalCount = couponsData?.pagination?.total ?? coupons.length;
  const stats = statsData || { total: 0, active: 0, expired: 0, totalRedemptions: 0, totalDiscountsGiven: 0 };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => createAdminCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCoupons'] });
      queryClient.invalidateQueries({ queryKey: ['adminCouponStats'] });
      toast.success('Promo code created successfully');
      setModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create coupon');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateAdminCoupon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCoupons'] });
      queryClient.invalidateQueries({ queryKey: ['adminCouponStats'] });
      toast.success('Promo code updated successfully');
      setModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update coupon');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => toggleAdminCoupon(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminCoupons'] });
      queryClient.invalidateQueries({ queryKey: ['adminCouponStats'] });
      toast.success(res?.data?.isActive ? 'Coupon activated' : 'Coupon paused');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to toggle coupon state');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAdminCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCoupons'] });
      queryClient.invalidateQueries({ queryKey: ['adminCouponStats'] });
      toast.success('Coupon deleted successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete coupon');
    },
  });

  const handleSaveCoupon = async (data, couponId) => {
    if (couponId) {
      updateMutation.mutate({ id: couponId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleToggleActive = (id) => {
    toggleMutation.mutate(id);
  };

  const handleDeleteCoupon = (id, code) => {
    if (window.confirm(`Are you sure you want to delete coupon '${code}'?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (coupon) => {
    setEditingCoupon(coupon);
    setModalOpen(true);
  };

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12 pb-24 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">
            Coupons & Promo Codes
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed font-medium">
            Create, monitor, and configure promotional campaigns for storekeeper subscription tiers.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleOpenCreate}
            className="cursor-pointer h-10 sm:h-11 px-4 sm:px-5 rounded-lg bg-[#093C5D] hover:bg-[#072d46] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0 shadow-none"
          >
            <Plus className="w-4 h-4" />
            <span>Create Promo Code</span>
          </button>
        </div>
      </div>

      {/* Top KPI Summary Cards (Matched with Admin Shops UI) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
        <AdminStatCard
          title="ACTIVE COUPONS"
          value={statsLoading ? '...' : stats.active}
          subtext="Ready for merchant checkout"
          icon={CheckCircle2}
          variant="success"
        />
        <AdminStatCard
          title="TOTAL REDEMPTIONS"
          value={statsLoading ? '...' : stats.totalRedemptions}
          subtext="Times coupons applied by stores"
          icon={Users}
          variant="primary"
        />
        <AdminStatCard
          title="DISCOUNTS GIVEN"
          value={statsLoading ? '...' : `₹${stats.totalDiscountsGiven.toLocaleString('en-IN')}`}
          subtext="Total savings passed to stores"
          icon={Coins}
          variant="default"
        />
        <AdminStatCard
          title="EXPIRED / PAUSED"
          value={statsLoading ? '...' : stats.expired + (stats.total - stats.active - stats.expired)}
          subtext="Past campaigns & paused codes"
          icon={Tag}
          variant="danger"
        />
      </div>

      {/* Filter Chips (Matched with Admin Shops UI) */}
      <div className="flex items-center flex-nowrap gap-2 sm:gap-3 overflow-x-auto pb-1 mb-2 sm:mb-3 w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter('status', opt.value)}
            className={`shrink-0 cursor-pointer py-1.5 sm:py-2 px-3 sm:px-4 rounded-full text-[10px] sm:text-sm font-medium transition-all duration-200 border active:scale-95 select-none flex items-center justify-center whitespace-nowrap !min-h-0 !min-w-0 !h-fit ${
              urlStatus === opt.value
                ? 'bg-[#093C5D] text-white border-[#093C5D] shadow-none'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-none'
            }`}
          >
            {opt.label}
          </button>
        ))}

        <span className="w-px h-6 bg-gray-300 mx-1 shrink-0" />

        {DISCOUNT_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter('discountType', opt.value)}
            className={`shrink-0 cursor-pointer py-1.5 sm:py-2 px-3 sm:px-4 rounded-full text-[10px] sm:text-sm font-medium transition-all duration-200 border active:scale-95 select-none flex items-center justify-center whitespace-nowrap !min-h-0 !min-w-0 !h-fit ${
              urlDiscountType === opt.value
                ? 'bg-[#093C5D] text-white border-[#093C5D] shadow-none'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-none'
            }`}
          >
            {opt.label}
          </button>
        ))}

        {(urlStatus !== 'ALL' || urlDiscountType !== 'ALL' || searchTerm) && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setDebouncedSearch('');
              setSearchParams({}, { replace: true });
            }}
            className="shrink-0 cursor-pointer py-1.5 sm:py-2 px-3 sm:px-4 rounded-full text-[10px] sm:text-sm font-medium text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 flex items-center gap-1.5 transition-colors shadow-none active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Search Bar (Matched with Admin Shops UI) */}
      <div className="flex flex-col w-full mb-3 sm:mb-4">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search By Promo Code & Campaign Description & Applicable Plan"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full h-10 sm:h-12 pl-9 sm:pl-11 pr-10 sm:pr-12 bg-white border border-gray-300 rounded-lg text-[13px] sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200 shadow-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setDebouncedSearch('');
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.delete('search');
                  next.set('page', '1');
                  return next;
                }, { replace: true });
              }}
              className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Coupons Grid */}
      {loading ? (
        <div className="py-16 md:py-20 text-center bg-white rounded-lg border border-gray-200 shadow-none">
          <SwirlingLoader className="w-10 h-10 md:w-12 md:h-12 text-[#093C5D] mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600">Loading promo codes...</p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-lg border border-gray-200 px-4 shadow-none">
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 tracking-tight">
            No coupons found
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-sm mx-auto font-medium">
            {debouncedSearch || urlStatus !== 'ALL' || urlDiscountType !== 'ALL'
              ? 'Try modifying your search or clearing the status filters.'
              : 'Launch your first discount campaign to boost subscription upgrades.'}
          </p>
          {!debouncedSearch && urlStatus === 'ALL' && (
            <button
              onClick={handleOpenCreate}
              className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#093C5D] hover:bg-[#072d46] px-4 py-2.5 rounded-lg mt-4 transition-all active:scale-95 shadow-none"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Coupon</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {coupons.map((coupon) => (
            <CouponCard
              key={coupon._id}
              coupon={coupon}
              onEdit={handleOpenEdit}
              onToggleActive={handleToggleActive}
              onDelete={handleDeleteCoupon}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border border-gray-200 bg-gray-50/60 rounded-lg">
          <span className="text-xs text-gray-500 font-medium">
            Showing page <span className="font-semibold text-gray-800">{urlPage}</span> of{' '}
            <span className="font-semibold text-gray-800">{totalPages}</span> ({totalCount} total promo codes)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              disabled={urlPage <= 1}
              onClick={() => handlePageChange(urlPage - 1)}
              className="cursor-pointer p-1.5 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2.5 text-gray-700">
              {urlPage} / {totalPages}
            </span>
            <button
              disabled={urlPage >= totalPages}
              onClick={() => handlePageChange(urlPage + 1)}
              className="cursor-pointer p-1.5 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Coupon Modal */}
      <CouponModal
        isOpen={modalOpen}
        coupon={editingCoupon}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveCoupon}
      />
    </div>
  );
};

export default AdminCoupons;
