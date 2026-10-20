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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Coupons & Promo Codes
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Discounts Engine
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Create, monitor, and configure promotional campaigns for storekeeper subscription tiers
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => {
              fetchStats();
              fetchCoupons();
              toast.success('Coupons refreshed');
            }}
            disabled={loading}
            className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleOpenCreate}
            className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#093C5D] hover:bg-[#072C44] rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Create Promo Code
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Coupons */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">
              Active Coupons
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2 tracking-tight">
            {statsLoading ? '...' : stats.active}
          </p>
          <p className="text-xs text-gray-500 mt-1">Ready for merchant checkout</p>
        </div>

        {/* Total Redemptions */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">
              Total Redemptions
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-2 tracking-tight">
            {statsLoading ? '...' : stats.totalRedemptions}
          </p>
          <p className="text-xs text-gray-500 mt-1">Times coupons used</p>
        </div>

        {/* Total Discounts Disbursed */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-purple-600 uppercase tracking-wider">
              Discounts Given
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2 tracking-tight">
            {statsLoading ? '...' : `₹${stats.totalDiscountsGiven.toLocaleString('en-IN')}`}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total revenue discounted</p>
        </div>

        {/* Expired / Inactive */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Expired / Inactive
            </span>
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2 tracking-tight">
            {statsLoading ? '...' : stats.expired + (stats.total - stats.active - stats.expired)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Past campaigns & paused codes</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code (e.g. DIWALI50) or description..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] outline-none"
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
              className="w-full text-sm border border-gray-300 rounded-lg p-2 bg-white focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] outline-none"
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
              className="w-full text-sm border border-gray-300 rounded-lg p-2 bg-white focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] outline-none"
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
        <div className="py-20 text-center bg-white rounded-xl border border-gray-200">
          <RefreshCw className="w-8 h-8 text-[#093C5D] animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading promo codes...</p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-xl border border-gray-200 px-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 tracking-tight">
            No coupons found
          </h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            {debouncedSearch || statusFilter !== 'ALL' || discountTypeFilter !== 'ALL'
              ? 'Try modifying your search or clearing the status filters.'
              : 'Launch your first discount campaign to boost subscription upgrades.'}
          </p>
          {!debouncedSearch && statusFilter === 'ALL' && (
            <button
              onClick={handleOpenCreate}
              className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-[#093C5D] bg-[#093C5D]/10 hover:bg-[#093C5D]/20 px-4 py-2 rounded-lg mt-4 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create First Coupon
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
        <div className="p-4 bg-white rounded-xl border border-gray-200 flex items-center justify-between text-xs text-gray-500 shadow-xs">
          <span>
            Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} promo codes)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
              className="cursor-pointer p-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
              className="cursor-pointer p-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
