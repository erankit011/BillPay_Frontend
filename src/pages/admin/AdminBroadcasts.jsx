/**
 * Platform Broadcast Announcements Management
 * Publishes top-bar banners and notifications targeted to all stores or specific subscription tiers.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  RotateCcw,
  X,
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
import AdminStatCard from '../../features/admin/components/AdminStatCard';
import SwirlingLoader from '../../components/common/SwirlingLoader';
import { formatDate } from '../../utils/dateUtils';

/**
 * AdminBroadcasts Component
 */
const AdminBroadcasts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const urlSearch = searchParams.get('search') || '';
  const urlType = searchParams.get('type') || 'ALL';
  const urlStatus = searchParams.get('status') || 'ALL';

  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBroadcast, setEditingBroadcast] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (searchTerm) next.set('search', searchTerm);
        else next.delete('search');
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
      return next;
    }, { replace: true });
  };

  /**
   * Broadcast Records React Query
   * Fetches administrative announcements filtered by notification type and active status.
   */
  const { data, isLoading } = useQuery({
    queryKey: ['adminBroadcasts', urlType, urlStatus],
    queryFn: () =>
      getAdminBroadcasts({
        type: urlType !== 'ALL' ? urlType : undefined,
        status: urlStatus !== 'ALL' ? urlStatus.toLowerCase() : undefined,
      }),
    staleTime: 30 * 1000,
  });

  const broadcasts = data?.broadcasts || [];
  const stats = data?.stats || { total: 0, activeCount: 0 };

  /**
   * Broadcast Mutation Handlers
   * Manages announcement creation, updates, and deletion with instant cache invalidation.
   */
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

  /**
   * Client-Side Search Filtering Memo
   * Filters cached broadcasts by title, message text, or notification type matching query.
   */
  const filteredBroadcasts = useMemo(() => {
    if (!debouncedSearch.trim()) return broadcasts;
    const q = debouncedSearch.toLowerCase();
    return broadcasts.filter(
      (b) =>
        b.title?.toLowerCase().includes(q) ||
        b.message?.toLowerCase().includes(q) ||
        b.type?.toLowerCase().includes(q)
    );
  }, [broadcasts, debouncedSearch]);

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12 pb-24 lg:pb-0">
      {/**
       * Page Header Toolbar
       * Displays broadcast management title, descriptive subtext, and creation action button.
       */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
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
          className="cursor-pointer h-10 sm:h-11 px-4 sm:px-5 rounded-lg bg-[#093C5D] hover:bg-[#082a42] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-none shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Broadcast</span>
        </button>
      </div>

      {/**
       * Top KPI Summary Metrics Grid
       * Summary stat cards detailing live broadcasts, historical totals, audience tiers, and paused alerts.
       */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
        <AdminStatCard
          title="LIVE BROADCASTS"
          value={stats.activeCount || 0}
          subtext="Active banners on merchant screens"
          icon={CheckCircle2}
          variant="success"
        />
        <AdminStatCard
          title="TOTAL ANNOUNCEMENTS"
          value={stats.total || 0}
          subtext="All created broadcast history"
          icon={Megaphone}
          variant="primary"
        />
        <AdminStatCard
          title="AUDIENCE TARGETING"
          value="Precision"
          subtext="Free Trial, Pro & All Stores"
          icon={Clock}
          variant="default"
        />
        <AdminStatCard
          title="PAUSED BROADCASTS"
          value={Math.max(0, (stats.total || 0) - (stats.activeCount || 0))}
          subtext="Inactive or scheduled alerts"
          icon={Power}
          variant="danger"
        />
      </div>

      {/**
       * Announcement Category & Status Filter Chips
       * Fast filter pills categorizing announcements by notification intent and lifecycle status.
       */}
      <div className="flex items-center flex-nowrap gap-2 sm:gap-3 overflow-x-auto pb-1 mb-2 sm:mb-3 w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {[
          { label: 'All Categories', value: 'ALL' },
          { label: 'Information', value: 'INFO' },
          { label: 'Warning / Maintenance', value: 'WARNING' },
          { label: 'Critical Alert', value: 'ALERT' },
          { label: 'Feature Release', value: 'SUCCESS' },
        ].map((chip) => (
          <button
            key={chip.value}
            onClick={() => setFilter('type', chip.value)}
            className={`shrink-0 cursor-pointer py-1.5 sm:py-2 px-3 sm:px-4 rounded-full text-[10px] sm:text-sm font-medium transition-all duration-200 border active:scale-95 select-none flex items-center justify-center whitespace-nowrap !min-h-0 !min-w-0 !h-fit ${
              urlType === chip.value
                ? 'bg-[#093C5D] text-white border-[#093C5D] shadow-none'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-none'
            }`}
          >
            {chip.label}
          </button>
        ))}

        <span className="w-px h-6 bg-gray-300 mx-1 shrink-0" />

        {[
          { label: 'All Status', value: 'ALL' },
          { label: 'Active Stores', value: 'ACTIVE' },
          { label: 'Paused Stores', value: 'INACTIVE' },
        ].map((chip) => (
          <button
            key={chip.value}
            onClick={() => setFilter('status', chip.value)}
            className={`shrink-0 cursor-pointer py-1.5 sm:py-2 px-3 sm:px-4 rounded-full text-[10px] sm:text-sm font-medium transition-all duration-200 border active:scale-95 select-none flex items-center justify-center whitespace-nowrap !min-h-0 !min-w-0 !h-fit ${
              urlStatus === chip.value
                ? 'bg-[#093C5D] text-white border-[#093C5D] shadow-none'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-none'
            }`}
          >
            {chip.label}
          </button>
        ))}

        {(urlType !== 'ALL' || urlStatus !== 'ALL' || searchTerm) && (
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

      {/**
       * Search Bar Filter Input
       * Debounced input query searching across announcement titles, content, and target audiences.
       */}
      <div className="flex flex-col w-full mb-3 sm:mb-4">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search By Announcement Title & Content & Audience"
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

      {/**
       * Announcements Stream List Area
       * Renders live announcement banners with embedded administration and status toggles.
       */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-lg border border-gray-200 shadow-none">
          <SwirlingLoader className="w-10 h-10 text-[#093C5D] mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600">Loading announcements...</p>
        </div>
      ) : filteredBroadcasts.length === 0 ? (
        <div className="p-8 md:p-12 text-center bg-white rounded-lg border border-gray-200 shadow-none">
          <div className="w-12 h-12 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
            <Megaphone className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 tracking-tight">No Announcements Found</h3>
          <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto mt-1 font-medium leading-relaxed">
            {debouncedSearch || urlType !== 'ALL' || urlStatus !== 'ALL'
              ? 'Try modifying your search or clearing your active category filters.'
              : 'Broadcast platform-wide updates, holiday notices, or new features directly across merchant dashboards.'}
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="cursor-pointer mt-4 h-10 px-4 rounded-lg bg-[#093C5D] hover:bg-[#072d46] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-all active:scale-95 shadow-none"
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
              className="bg-white border border-gray-200 rounded-lg overflow-hidden transition-all hover:border-gray-300 shadow-none"
            >
              {/**
               * Live Banner Visual Preview
               * Renders announcement banner exactly as storekeepers perceive it.
               */}
              <div className="p-4 sm:p-5">
                <BroadcastBanner broadcast={broadcast} isPreview={false} />
              </div>

              {/**
               * Administrative Metadata & Management Toolbar
               * Displays scheduling timeline, audience targeting, and lifecycle actions.
               */}
              <div className="px-4 py-3 sm:px-5 bg-gray-50/80 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                {/**
                 * Lifecycle Status & Schedule Details
                 * Indicates active/paused state and scheduled start/expiry dates.
                 */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-gray-500 font-medium">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] lg:text-xs font-semibold uppercase tracking-wide ${
                      broadcast.isActive
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        broadcast.isActive ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                    {broadcast.isActive ? 'Active' : 'Paused'}
                  </span>

                  {/**
                   * Target Audience Badge
                   * Indicates store tier audience (Paid Pro, Free Trial, or All Stores).
                   */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-[#093C5D] border border-blue-200 font-semibold text-[10px] lg:text-xs uppercase">
                    Audience: {broadcast.targetAudience === 'PAID_SUBSCRIBERS' ? 'Paid Pro' : broadcast.targetAudience === 'FREE_TRIAL' ? 'Free Trial' : 'All Stores'}
                  </span>

                  <span className="text-gray-500 font-medium">
                    Started: <strong className="text-gray-800 font-semibold">{formatDate(broadcast.startsAt || broadcast.createdAt)}</strong>
                  </span>

                  {broadcast.expiresAt && (
                    <span className="text-gray-500 font-medium">
                      Expires: <strong className="text-gray-800 font-semibold">{formatDate(broadcast.expiresAt)}</strong>
                    </span>
                  )}
                </div>

                {/**
                 * Action Control Buttons
                 * Allows pausing, editing, or deleting the broadcast.
                 */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(broadcast)}
                    title={broadcast.isActive ? 'Pause Broadcast' : 'Activate Broadcast'}
                    className={`cursor-pointer px-2.5 py-1 rounded-md text-xs font-semibold border transition-all active:scale-95 inline-flex items-center gap-1.5 ${
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
                    className="cursor-pointer px-2.5 py-1 rounded-md text-xs font-semibold bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition-all inline-flex items-center gap-1.5 active:scale-95"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(broadcast)}
                    className="cursor-pointer p-1.5 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all active:scale-95"
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

      {/**
       * Broadcast Modal Dialog
       * Modal for composing new broadcasts or editing existing announcements.
       */}
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
