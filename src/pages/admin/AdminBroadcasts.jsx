import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Megaphone,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Edit2,
  Power,
  RefreshCw,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getAdminBroadcasts,
  createAdminBroadcast,
  updateAdminBroadcast,
  deleteAdminBroadcast,
} from '../../features/admin/api/adminApi';
import BroadcastBanner from '../../features/admin/components/broadcast/BroadcastBanner';
import BroadcastModal from '../../features/admin/components/broadcast/BroadcastModal';
import SwirlingLoader from '../../components/common/SwirlingLoader';
import { formatDate } from '../../utils/dateUtils';

const AdminBroadcasts = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBroadcast, setEditingBroadcast] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all broadcasts
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['adminBroadcasts', filterType, filterStatus],
    queryFn: () =>
      getAdminBroadcasts({
        type: filterType !== 'ALL' ? filterType : undefined,
        status: filterStatus !== 'ALL' ? filterStatus.toLowerCase() : undefined,
      }),
    staleTime: 30 * 1000,
  });

  const broadcasts = data?.broadcasts || [];
  const stats = data?.stats || { total: 0, activeCount: 0 };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload) => createAdminBroadcast(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBroadcasts'] });
      queryClient.invalidateQueries({ queryKey: ['activeBroadcasts'] });
      toast.success('Announcement broadcasted successfully');
      setModalOpen(false);
      setEditingBroadcast(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create broadcast');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateAdminBroadcast(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBroadcasts'] });
      queryClient.invalidateQueries({ queryKey: ['activeBroadcasts'] });
      toast.success('Announcement updated successfully');
      setModalOpen(false);
      setEditingBroadcast(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update broadcast');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAdminBroadcast(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBroadcasts'] });
      queryClient.invalidateQueries({ queryKey: ['activeBroadcasts'] });
      toast.success('Announcement deleted successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete broadcast');
    },
  });

  const handleOpenCreate = () => {
    setEditingBroadcast(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (broadcast) => {
    setEditingBroadcast(broadcast);
    setModalOpen(true);
  };

  const handleSave = (payload, id) => {
    if (id) {
      updateMutation.mutate({ id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleToggleStatus = (broadcast) => {
    updateMutation.mutate({
      id: broadcast._id,
      payload: { isActive: !broadcast.isActive },
    });
  };

  const handleDelete = (broadcast) => {
    if (window.confirm(`Are you sure you want to delete "${broadcast.title}"?`)) {
      deleteMutation.mutate(broadcast._id);
    }
  };

  // Client-side search filtering
  const filteredBroadcasts = useMemo(() => {
    if (!searchQuery.trim()) return broadcasts;
    const q = searchQuery.toLowerCase();
    return broadcasts.filter(
      (b) =>
        b.title?.toLowerCase().includes(q) ||
        b.message?.toLowerCase().includes(q) ||
        b.type?.toLowerCase().includes(q)
    );
  }, [broadcasts, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[75vh]">
        <SwirlingLoader className="w-10 h-10 md:w-12 md:h-12 text-[#093C5D]" />
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 pb-24 lg:pb-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">
            Global Announcements & Broadcasts
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed font-medium">
            Broadcast operational notices, scheduled maintenance alerts, or new feature updates to merchant stores.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="cursor-pointer h-10 px-4 sm:px-5 rounded-lg bg-[#093C5D] hover:bg-[#072d46] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-none shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Broadcast</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
        <div className="bg-white rounded-lg p-4 md:p-5 flex flex-col justify-between border border-gray-200 hover:border-gray-300 transition-all duration-200">
          <div className="flex justify-between items-start gap-1">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-emerald-700 border border-gray-200 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">
              Live Broadcasts
            </p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">
              {stats.activeCount || 0}
            </p>
            <p className="text-[10px] md:text-xs text-emerald-700 font-medium truncate mt-0.5">
              Active banners on merchant screens
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 md:p-5 flex flex-col justify-between border border-gray-200 hover:border-gray-300 transition-all duration-200">
          <div className="flex justify-between items-start gap-1">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200 shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">
              Total Announcements
            </p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">
              {stats.total || 0}
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate mt-0.5">
              All created broadcast history
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 md:p-5 flex flex-col justify-between border border-gray-200 hover:border-gray-300 transition-all duration-200">
          <div className="flex justify-between items-start gap-1">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-purple-700 border border-gray-200 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">
              Target Audience
            </p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">
              Targeted Filters
            </p>
            <p className="text-[10px] md:text-xs text-purple-700 font-medium truncate mt-0.5">
              Free trial, Pro, or all merchants
            </p>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-white border border-gray-200 rounded-lg">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search announcements by title or content..."
            className="w-full h-10 pl-9 pr-3.5 text-xs sm:text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#093C5D]/20 focus:border-[#093C5D] text-gray-900 font-medium transition-all"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 sm:pb-0">
          {/* Severity Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-10 px-3 text-xs sm:text-sm font-medium bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#093C5D]/20 focus:border-[#093C5D] text-gray-700 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="INFO">Information (Blue)</option>
            <option value="WARNING">Warning / Maintenance (Amber)</option>
            <option value="ALERT">Critical Alert (Red)</option>
            <option value="SUCCESS">Feature Release (Green)</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 px-3 text-xs sm:text-sm font-medium bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#093C5D]/20 focus:border-[#093C5D] text-gray-700 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Live / Active</option>
            <option value="INACTIVE">Paused / Inactive</option>
          </select>
        </div>
      </div>

      {/* Announcements Stream */}
      {filteredBroadcasts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-lg border border-gray-200">
          <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
            <Megaphone className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">No Announcements Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 font-medium leading-relaxed">
            Broadcast platform-wide updates, holiday notices, or new features directly across merchant dashboards.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="cursor-pointer mt-4 h-10 px-4 rounded-lg bg-[#093C5D] hover:bg-[#072d46] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Announcement</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBroadcasts.map((broadcast) => (
            <div
              key={broadcast._id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden transition-all hover:border-gray-300"
            >
              {/* Actual Banner View */}
              <div className="p-4 sm:p-5">
                <BroadcastBanner broadcast={broadcast} isPreview={false} />
              </div>

              {/* Administrative Meta & Actions Toolbar */}
              <div className="px-4 py-3 sm:px-5 bg-gray-50/80 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Status & Timing Details */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-gray-500 font-medium">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                      broadcast.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        broadcast.isActive ? 'bg-emerald-500' : 'bg-gray-400'
                      }`}
                    />
                    {broadcast.isActive ? 'Active' : 'Paused'}
                  </span>

                  {/* Target Audience Badge */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-[#093C5D] border border-blue-200 font-semibold text-[11px] uppercase">
                    Audience: {broadcast.targetAudience === 'PAID_SUBSCRIBERS' ? 'Paid Pro' : broadcast.targetAudience === 'FREE_TRIAL' ? 'Free Trial' : 'All Merchants'}
                  </span>

                  <span>
                    Started: <strong className="text-gray-700 font-semibold">{formatDate(broadcast.startsAt || broadcast.createdAt)}</strong>
                  </span>

                  {broadcast.expiresAt && (
                    <span>
                      Expires: <strong className="text-gray-700 font-semibold">{formatDate(broadcast.expiresAt)}</strong>
                    </span>
                  )}
                </div>

                {/* Action Buttons - Small buttons use 'rounded' */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(broadcast)}
                    title={broadcast.isActive ? 'Pause Broadcast' : 'Activate Broadcast'}
                    className={`cursor-pointer px-2.5 py-1 rounded text-xs font-semibold border transition-all active:scale-95 inline-flex items-center gap-1.5 ${
                      broadcast.isActive
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{broadcast.isActive ? 'Pause' : 'Activate'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(broadcast)}
                    className="cursor-pointer px-2.5 py-1 rounded text-xs font-semibold bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition-all inline-flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(broadcast)}
                    className="cursor-pointer p-1.5 rounded text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all active:scale-95"
                    title="Delete announcement"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <BroadcastModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingBroadcast(null);
        }}
        broadcastToEdit={editingBroadcast}
        onSave={handleSave}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};

export default AdminBroadcasts;
