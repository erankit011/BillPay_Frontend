import React, { useState, useEffect, useCallback } from 'react';
import {
  LifeBuoy,
  Search,
  Filter,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle2,
  Inbox,
  User,
  Mail,
  Store,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getAdminTickets,
  getAdminTicketStats,
  updateAdminTicket,
  deleteAdminTicket,
} from '../../features/admin/api/adminApi';
import TicketStatusBadge from '../../features/admin/components/support/TicketStatusBadge';
import TicketPriorityBadge from '../../features/admin/components/support/TicketPriorityBadge';
import TicketDetailsModal from '../../features/admin/components/support/TicketDetailsModal';
import SwirlingLoader from '../../components/common/SwirlingLoader';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

const PRIORITY_OPTIONS = [
  { value: 'ALL', label: 'All Priorities' },
  { value: 'URGENT', label: 'Urgent' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

const CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'GENERAL', label: 'General' },
  { value: 'BILLING', label: 'Billing' },
  { value: 'TECHNICAL', label: 'Technical' },
  { value: 'ACCOUNT', label: 'Account' },
  { value: 'FEATURE_REQUEST', label: 'Feature Request' },
  { value: 'BUG_REPORT', label: 'Bug Report' },
];

const AdminSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    urgent: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

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
      const data = await getAdminTicketStats();
      if (data) setStats(data);
    } catch (err) {
      // Silent error or fallback
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch tickets list
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (categoryFilter !== 'ALL') params.category = categoryFilter;

      const res = await getAdminTickets(params);
      if (res) {
        setTickets(res.tickets || []);
        if (res.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: res.pagination.total,
            totalPages: res.pagination.totalPages,
          }));
        }
      }
    } catch (err) {
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    debouncedSearch,
    statusFilter,
    priorityFilter,
    categoryFilter,
  ]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleUpdateTicket = async (ticketId, updateData) => {
    const updated = await updateAdminTicket(ticketId, updateData);
    if (updated?.data) {
      // Update local state smoothly
      setTickets((prev) =>
        prev.map((t) => (t._id === ticketId ? updated.data : t))
      );
      if (selectedTicket?._id === ticketId) {
        setSelectedTicket(updated.data);
      }
      fetchStats();
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    await deleteAdminTicket(ticketId);
    setTickets((prev) => prev.filter((t) => t._id !== ticketId));
    fetchStats();
  };

  const handleQuickResolve = async (e, ticket) => {
    e.stopPropagation();
    try {
      await handleUpdateTicket(ticket._id, { status: 'RESOLVED' });
      toast.success(`Ticket #${ticket.ticketId} marked as resolved`);
    } catch (err) {
      toast.error('Failed to resolve ticket');
    }
  };

  const handleOpenTicket = (ticket) => {
    setSelectedTicket(ticket);
    setModalOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 pb-24 lg:pb-0">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">
            Support Desk & Helpdesk
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed font-medium">
            Monitor, triage, and reply directly to merchant tickets with live in-app notifications.
          </p>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
        {/* Total Inquiries */}
        <div className="bg-white rounded-lg p-4 md:p-5 flex flex-col justify-between border border-gray-200 hover:border-gray-300 transition-all duration-200">
          <div className="flex justify-between items-start gap-1">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-gray-700 border border-gray-200 shrink-0">
              <LifeBuoy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">
              Total Inquiries
            </p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">
              {statsLoading ? '...' : stats.total}
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate mt-0.5">
              All-time merchant tickets
            </p>
          </div>
        </div>

        {/* Pending Action / Open */}
        <div className="bg-white rounded-lg p-4 md:p-5 flex flex-col justify-between border border-gray-200 hover:border-gray-300 transition-all duration-200">
          <div className="flex justify-between items-start gap-1">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-amber-600 border border-gray-200 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">
              Pending / Open
            </p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-amber-600 truncate">
              {statsLoading ? '...' : stats.open}
            </p>
            <p className="text-[10px] md:text-xs text-amber-600 font-medium truncate mt-0.5">
              Awaiting first response
            </p>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-lg p-4 md:p-5 flex flex-col justify-between border border-gray-200 hover:border-gray-300 transition-all duration-200">
          <div className="flex justify-between items-start gap-1">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-blue-600 border border-gray-200 shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">
              In Progress
            </p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-blue-600 truncate">
              {statsLoading ? '...' : stats.inProgress}
            </p>
            <p className="text-[10px] md:text-xs text-blue-600 font-medium truncate mt-0.5">
              Under investigation
            </p>
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-white rounded-lg p-4 md:p-5 flex flex-col justify-between border border-gray-200 hover:border-gray-300 transition-all duration-200">
          <div className="flex justify-between items-start gap-1">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-emerald-700 border border-gray-200 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">
              Resolved Tickets
            </p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-emerald-700 truncate">
              {statsLoading ? '...' : (stats.resolved || 0)}
            </p>
            <p className="text-[10px] md:text-xs text-emerald-700 font-medium truncate mt-0.5">
              Successfully addressed
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-3.5 md:p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Ticket ID, name, email, store, or subject..."
              className="w-full h-10 pl-9 pr-4 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#093C5D]/20 focus:border-[#093C5D] text-gray-900 font-medium transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
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

          {/* Priority Filter */}
          <div className="md:col-span-2">
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full h-10 text-xs sm:text-sm font-medium border border-gray-200 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#093C5D]/20 focus:border-[#093C5D] text-gray-700 cursor-pointer"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full h-10 text-xs sm:text-sm font-medium border border-gray-200 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#093C5D]/20 focus:border-[#093C5D] text-gray-700 cursor-pointer"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <SwirlingLoader className="w-10 h-10 text-[#093C5D] mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">Loading support inquiries...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 tracking-tight">
              No tickets found
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              {debouncedSearch || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                ? 'Try clearing or modifying your search and filter criteria.'
                : 'All clear! No pending support inquiries at this time.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Ticket</th>
                  <th className="py-3.5 px-4">Requester</th>
                  <th className="py-3.5 px-4">Subject & Category</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket._id}
                    onClick={() => handleOpenTicket(ticket)}
                    className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
                  >
                    {/* Ticket ID */}
                    <td className="py-3.5 px-4 font-mono font-medium text-gray-900">
                      <span className="text-xs bg-gray-100 group-hover:bg-[#093C5D]/10 group-hover:text-[#093C5D] px-2 py-1 rounded transition-colors">
                        #{ticket.ticketId}
                      </span>
                    </td>

                    {/* Requester */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{ticket.name}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[180px]">
                          {ticket.email}
                        </div>
                        {(ticket.shopName || ticket.user?.businessName) && (
                          <div className="text-[11px] text-[#093C5D] font-medium mt-0.5 flex items-center gap-1">
                            <Store className="w-3 h-3" />
                            <span>{ticket.shopName || ticket.user?.businessName}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Subject & Category */}
                    <td className="py-3.5 px-4">
                      <div className="max-w-[280px]">
                        <div className="font-medium text-gray-900 truncate">
                          {ticket.subject}
                        </div>
                        <span className="inline-block text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mt-0.5">
                          {ticket.category}
                        </span>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">
                      <TicketPriorityBadge priority={ticket.priority} />
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <TicketStatusBadge status={ticket.status} />
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(ticket.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                          <button
                            type="button"
                            onClick={(e) => handleQuickResolve(e, ticket)}
                            title="Quick Resolve"
                            className="cursor-pointer p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTicket(ticket);
                          }}
                          className="cursor-pointer px-2.5 py-1 text-xs font-semibold text-[#093C5D] bg-[#093C5D]/5 hover:bg-[#093C5D]/10 rounded transition-colors"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50/60 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} tickets total)
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
      </div>

      {/* Ticket Management Slide-Over / Modal */}
      <TicketDetailsModal
        isOpen={modalOpen}
        ticket={selectedTicket}
        onClose={() => setModalOpen(false)}
        onUpdateTicket={handleUpdateTicket}
        onDeleteTicket={handleDeleteTicket}
      />
    </div>
  );
};

export default AdminSupport;
