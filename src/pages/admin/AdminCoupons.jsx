import React, { useState, useEffect, useCallback } from 'react';
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
  const [coupons, setCoupons] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    totalRedemptions: 0,
    totalDiscountsGiven: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [discountTypeFilter, setDiscountTypeFilter] = useState('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch KPI statistics
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await getAdminCouponStats();
      if (data) setStats(data);
    } catch (err) {
      // Silent error fallback
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch coupons list
  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (discountTypeFilter !== 'ALL') params.discountType = discountTypeFilter;

      const res = await getAdminCoupons(params);
      if (res) {
        setCoupons(res.coupons || []);
        if (res.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: res.pagination.total,
            totalPages: res.pagination.totalPages,
          }));
        }
      }
    } catch (err) {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    debouncedSearch,
    statusFilter,
    discountTypeFilter,
  ]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleSaveCoupon = async (data, couponId) => {
    if (couponId) {
      await updateAdminCoupon(couponId, data);
    } else {
      await createAdminCoupon(data);
    }
    fetchCoupons();
    fetchStats();
  };

  const handleToggleActive = async (id) => {
    try {
      const res = await toggleAdminCoupon(id);
      if (res?.data) {
        setCoupons((prev) =>
          prev.map((c) => (c._id === id ? { ...c, isActive: res.data.isActive } : c))
        );
        fetchStats();
        toast.success(
          res.data.isActive ? 'Coupon activated' : 'Coupon paused'
        );
      }
    } catch (err) {
      toast.error('Failed to toggle coupon state');
    }
  };

  const handleDeleteCoupon = async (id, code) => {
    if (window.confirm(`Are you sure you want to delete coupon '${code}'?`)) {
      try {
        await deleteAdminCoupon(id);
        setCoupons((prev) => prev.filter((c) => c._id !== id));
        fetchStats();
        toast.success(`Coupon '${code}' deleted`);
      } catch (err) {
        toast.error('Failed to delete coupon');
      }
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
    <div className="w-full min-w-0 space-y-6 md:space-y-8 pb-24 lg:pb-0">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            className="cursor-pointer h-10 px-4 sm:px-5 rounded-lg bg-[#093C5D] hover:bg-[#072d46] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Promo Code</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
        {/* Active Coupons */}
        <div className="bg-white rounded-lg p-4 md:p-5 flex flex-col justify-between border border-gray-200 hover:border-gray-300 transition-all duration-200">
          <div className="flex justify-between items-start gap-1">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-emerald-700 border border-gray-200 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">
              Active Coupons
            </p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-emerald-700 truncate">
              {statsLoading ? '...' : stats.active}
            </p>
            <p className="text-[10px] md:text-xs text-emerald-700 font-medium truncate mt-0.5">
              Ready for merchant checkout
            </p>
          </div>
        </div>

        {/* Total Redemptions */}
        <div className="bg-white rounded-lg p-4 md:p-5 flex flex-col justify-between border border-gray-200 hover:border-gray-300 transition-all duration-200">
          <div className="flex justify-between items-start gap-1">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200 shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">
              Total Redemptions
            </p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">
              {statsLoading ? '...' : stats.totalRedemptions}
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate mt-0.5">
              Times coupons used
            </p>
          </div>
        </div>

        {/* Total Discounts Disbursed */}
        <div className="bg-white rounded-lg p-4 md:p-5 flex flex-col justify-between border border-gray-200 hover:border-gray-300 transition-all duration-200">
          <div className="flex justify-between items-start gap-1">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-purple-700 border border-gray-200 shrink-0">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">
              Discounts Given
            </p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">
              {statsLoading ? '...' : `₹${stats.totalDiscountsGiven.toLocaleString('en-IN')}`}
            </p>
            <p className="text-[10px] md:text-xs text-purple-700 font-medium truncate mt-0.5">
              Total savings passed to stores
            </p>
          </div>
        </div>

        {/* Expired / Inactive */}
        <div className="bg-white rounded-lg p-4 md:p-5 flex flex-col justify-between border border-gray-200 hover:border-gray-300 transition-all duration-200">
          <div className="flex justify-between items-start gap-1">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-gray-600 border border-gray-200 shrink-0">
              <Tag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">
              Expired / Paused
            </p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">
              {statsLoading ? '...' : stats.expired + (stats.total - stats.active - stats.expired)}
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate mt-0.5">
              Past campaigns & paused codes
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-3.5 md:p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code (e.g. DIWALI50) or description..."
              className="w-full h-10 pl-9 pr-4 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#093C5D]/20 focus:border-[#093C5D] text-gray-900 font-medium transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full h-10 text-xs sm:text-sm font-medium border border-gray-200 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#093C5D]/20 focus:border-[#093C5D] text-gray-700 cursor-pointer"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Discount Type Filter */}
          <div className="md:col-span-3">
            <select
              value={discountTypeFilter}
              onChange={(e) => {
                setDiscountTypeFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full h-10 text-xs sm:text-sm font-medium border border-gray-200 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#093C5D]/20 focus:border-[#093C5D] text-gray-700 cursor-pointer"
            >
              {DISCOUNT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Coupons Grid */}
      {loading ? (
        <div className="py-20 text-center bg-white rounded-lg border border-gray-200">
          <SwirlingLoader className="w-10 h-10 text-[#093C5D] mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600">Loading promo codes...</p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-lg border border-gray-200 px-4">
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 tracking-tight">
            No coupons found
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-sm mx-auto font-medium">
            {debouncedSearch || statusFilter !== 'ALL' || discountTypeFilter !== 'ALL'
              ? 'Try modifying your search or clearing the status filters.'
              : 'Launch your first discount campaign to boost subscription upgrades.'}
          </p>
          {!debouncedSearch && statusFilter === 'ALL' && (
            <button
              onClick={handleOpenCreate}
              className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#093C5D] hover:bg-[#072d46] px-4 py-2.5 rounded-lg mt-4 transition-colors"
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

      {/* Pagination Bar */}
      {pagination.totalPages > 1 && (
        <div className="p-4 bg-white rounded-lg border border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <span>
            Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} promo codes)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
              className="cursor-pointer p-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
              className="cursor-pointer p-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
