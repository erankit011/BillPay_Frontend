/**
 * Administrative Support Helpdesk & Merchant Inquiries Desk
 * Resolves merchant support tickets, updates priority queues, and maintains staff resolution audit notes.
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  RotateCcw,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatShortDate } from '../../utils/dateUtils';
import { getInitials } from '../../utils/stringUtils';
import {
  getAdminTickets,
  getAdminTicketStats,
  updateAdminTicket,
  deleteAdminTicket,
} from '../../features/admin/api/adminApi';
import TicketStatusBadge from '../../features/admin/components/support/TicketStatusBadge';
import TicketPriorityBadge from '../../features/admin/components/support/TicketPriorityBadge';
import TicketDetailsModal from '../../features/admin/components/support/TicketDetailsModal';
import AdminStatCard from '../../features/admin/components/AdminStatCard';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const urlSearch = searchParams.get('search') || '';
  const urlStatus = searchParams.get('status') || 'ALL';
  const urlPriority = searchParams.get('priority') || 'ALL';
  const urlCategory = searchParams.get('category') || 'ALL';
  const urlPage = Number(searchParams.get('page')) || 1;

  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  /**
   * Search Input Debouncing
   * Synchronizes search query to URL query params with 450ms debounce delay.
   */
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

  /**
   * Support KPI Statistics Query
   * Fetches aggregate metrics for open, in-progress, resolved, and urgent inquiries.
   */
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['adminTicketStats'],
    queryFn: getAdminTicketStats,
    staleTime: 30 * 1000,
  });

  const stats = statsData || {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    urgent: 0,
  };

  /**
   * Support Tickets Query
   * Fetches paginated support tickets filtered by search, status, priority, and category.
   */
  const { data: ticketsData, isLoading: loading } = useQuery({
    queryKey: ['adminTickets', debouncedSearch, urlStatus, urlPriority, urlCategory, urlPage],
    queryFn: () =>
      getAdminTickets({
        page: urlPage,
        limit: 10,
        search: debouncedSearch || undefined,
        status: urlStatus !== 'ALL' ? urlStatus : undefined,
        priority: urlPriority !== 'ALL' ? urlPriority : undefined,
        category: urlCategory !== 'ALL' ? urlCategory : undefined,
      }),
    staleTime: 30 * 1000,
  });

  const tickets = ticketsData?.tickets || [];
  const pagination = {
    page: ticketsData?.pagination?.page || urlPage,
    total: ticketsData?.pagination?.total ?? tickets.length,
    totalPages: ticketsData?.pagination?.totalPages || 1,
  };

  const handleUpdateTicket = async (ticketId, updateData) => {
    const updated = await updateAdminTicket(ticketId, updateData);
    if (updated?.data) {
      if (selectedTicket?._id === ticketId) {
        setSelectedTicket(updated.data);
      }
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
      queryClient.invalidateQueries({ queryKey: ['adminTicketStats'] });
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    await deleteAdminTicket(ticketId);
    queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
    queryClient.invalidateQueries({ queryKey: ['adminTicketStats'] });
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

  const formatDate = (dateString) => formatShortDate(dateString);

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12 pb-24 lg:pb-0">
      {/**
       * Helpdesk Header Section
       * Displays page title and overview description for administrative support desk.
       */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">
            Support Desk & Helpdesk
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed font-medium">
            Monitor, triage, and reply directly to merchant tickets with live in-app notifications.
          </p>
        </div>
      </div>

      {/**
       * Support KPI Stat Cards
       * Summarizes total inquiries, pending/open tickets, tickets in investigation, and resolved issues.
       */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
        <AdminStatCard
          title="TOTAL INQUIRIES"
          value={statsLoading ? '...' : stats.total}
          subtext="All-time merchant tickets"
          icon={LifeBuoy}
          variant="primary"
        />
        <AdminStatCard
          title="PENDING / OPEN"
          value={statsLoading ? '...' : stats.open}
          subtext="Awaiting first response"
          icon={Clock}
          variant="danger"
        />
        <AdminStatCard
          title="IN PROGRESS"
          value={statsLoading ? '...' : stats.inProgress}
          subtext="Under investigation"
          icon={MessageCircle}
          variant="default"
        />
        <AdminStatCard
          title="RESOLVED TICKETS"
          value={statsLoading ? '...' : (stats.resolved || 0)}
          subtext="Successfully addressed"
          icon={CheckCircle2}
          variant="success"
        />
      </div>

      {/**
       * Filter Chips Toolbar
       * Interactive pill buttons for ticket status, priority level, category, and reset option.
       */}
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

        {PRIORITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter('priority', opt.value)}
            className={`shrink-0 cursor-pointer py-1.5 sm:py-2 px-3 sm:px-4 rounded-full text-[10px] sm:text-sm font-medium transition-all duration-200 border active:scale-95 select-none flex items-center justify-center whitespace-nowrap !min-h-0 !min-w-0 !h-fit ${
              urlPriority === opt.value
                ? 'bg-[#093C5D] text-white border-[#093C5D] shadow-none'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-none'
            }`}
          >
            {opt.label}
          </button>
        ))}

        <span className="w-px h-6 bg-gray-300 mx-1 shrink-0" />

        {CATEGORY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter('category', opt.value)}
            className={`shrink-0 cursor-pointer py-1.5 sm:py-2 px-3 sm:px-4 rounded-full text-[10px] sm:text-sm font-medium transition-all duration-200 border active:scale-95 select-none flex items-center justify-center whitespace-nowrap !min-h-0 !min-w-0 !h-fit ${
              urlCategory === opt.value
                ? 'bg-[#093C5D] text-white border-[#093C5D] shadow-none'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-none'
            }`}
          >
            {opt.label}
          </button>
        ))}

        {(urlStatus !== 'ALL' || urlPriority !== 'ALL' || urlCategory !== 'ALL' || searchTerm) && (
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
       * Search Bar Filter
       * Full-text search across ticket ID, requester name, store name, subject, and email.
       */}
      <div className="flex flex-col w-full mb-3 sm:mb-4">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search By Ticket ID & Requester & Store & Subject & Email"
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

      {/**
       * Support Tickets Stream
       * Renders responsive desktop table layout or touch-friendly mobile cards.
       */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-none">
        {loading ? (
          <div className="p-8 md:p-12 text-center text-gray-500 flex flex-col items-center justify-center">
            <SwirlingLoader className="w-10 h-10 md:w-12 md:h-12 text-[#093C5D] mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">Loading support inquiries...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 md:p-12 text-center px-4">
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 tracking-tight">
              No tickets found
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-sm mx-auto font-medium">
              {debouncedSearch || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                ? 'Try clearing or modifying your search and filter criteria.'
                : 'All clear! No pending support inquiries at this time.'}
            </p>
          </div>
        ) : (
          <div>
            {/**
             * Desktop Table View
             * Tabular presentation of support tickets with status badges and quick action controls.
             */}
            <div className="hidden lg:block overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <table className="w-full text-left text-sm text-gray-600 whitespace-nowrap">
                <thead className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 lg:px-6">Ticket</th>
                    <th className="py-3.5 px-4 lg:px-6">Requester</th>
                    <th className="py-3.5 px-4 lg:px-6">Subject & Category</th>
                    <th className="py-3.5 px-4 lg:px-6">Priority</th>
                    <th className="py-3.5 px-4 lg:px-6">Status</th>
                    <th className="py-3.5 px-4 lg:px-6">Date</th>
                    <th className="py-3.5 px-4 lg:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket._id}
                      onClick={() => handleOpenTicket(ticket)}
                      className="hover:bg-[#F5F5F5]/60 transition-colors cursor-pointer group"
                    >
                      {/**
                       * Ticket Identifier
                       * Unique hexadecimal/numeric ticket reference code.
                       */}
                      <td className="py-3.5 px-4 lg:px-6 align-middle">
                        <span className="font-mono text-xs font-semibold bg-gray-100 group-hover:bg-[#093C5D]/10 group-hover:text-[#093C5D] px-2.5 py-1 rounded transition-colors text-gray-800">
                          #{ticket.ticketId}
                        </span>
                      </td>

                      {/**
                       * Requester Profile
                       * User avatar initials, full name, email, and associated store.
                       */}
                      <td className="py-3.5 px-4 lg:px-6 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg p-[2px] border border-gray-200 bg-white shrink-0">
                            <div className="w-full h-full rounded-md flex items-center justify-center text-xs lg:text-sm font-semibold bg-gray-50 text-[#093C5D]">
                              {getInitials(ticket.name)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs lg:text-sm font-semibold text-gray-900">{ticket.name}</div>
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
                        </div>
                      </td>

                      {/**
                       * Subject & Category
                       * Ticket subject line and categorized inquiry badge.
                       */}
                      <td className="py-3.5 px-4 lg:px-6 align-middle">
                        <div className="max-w-[280px]">
                          <div className="text-xs lg:text-sm font-semibold text-gray-900 truncate">
                            {ticket.subject}
                          </div>
                          <span className="inline-block text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded mt-0.5 uppercase tracking-wide">
                            {ticket.category}
                          </span>
                        </div>
                      </td>

                      {/**
                       * Priority Badge
                       * Visual badge indicating Low, Medium, High, or Urgent priority.
                       */}
                      <td className="py-3.5 px-4 lg:px-6 align-middle">
                        <TicketPriorityBadge priority={ticket.priority} />
                      </td>

                      {/**
                       * Status Badge
                       * Visual badge showing Open, In Progress, Resolved, or Closed.
                       */}
                      <td className="py-3.5 px-4 lg:px-6 align-middle">
                        <TicketStatusBadge status={ticket.status} />
                      </td>

                      {/**
                       * Submission Date
                       * Timestamp when the support ticket was opened.
                       */}
                      <td className="py-3.5 px-4 lg:px-6 align-middle text-xs font-medium text-gray-600 whitespace-nowrap">
                        {formatDate(ticket.createdAt)}
                      </td>

                      {/**
                       * Action Buttons
                       * Quick resolve toggle and full ticket inspection trigger.
                       */}
                      <td className="py-3.5 px-4 lg:px-6 align-middle text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                            <button
                              type="button"
                              onClick={(e) => handleQuickResolve(e, ticket)}
                              title="Quick Resolve"
                              className="shrink-0 cursor-pointer p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors active:scale-95 border border-transparent hover:border-emerald-200"
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
                            className="shrink-0 cursor-pointer text-[#093C5D] font-medium bg-[#093C5D]/5 border border-[#093C5D]/15 hover:bg-[#093C5D]/10 px-2.5 sm:px-3 py-1 rounded-md flex items-center justify-center transition-all text-[11px] sm:text-xs active:scale-95 whitespace-nowrap"
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

            {/**
             * Mobile & Tablet Cards View
             * Compact card layout for touch screens with quick triage actions.
             */}
            <div className="lg:hidden flex flex-col gap-2.5 p-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket._id}
                  onClick={() => handleOpenTicket(ticket)}
                  className="bg-white border border-gray-200 rounded-lg p-3.5 transition-colors cursor-pointer active:bg-gray-50 shadow-none space-y-3"
                >
                  {/**
                   * Top Row: Avatar, Name & Status
                   * Requester initials, ticket ID, timestamp, and active status indicator.
                   */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg p-[2px] border border-gray-200 bg-white shrink-0">
                        <div className="w-full h-full rounded-md flex items-center justify-center text-xs font-semibold bg-gray-50 text-[#093C5D]">
                          {getInitials(ticket.name)}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-[#093C5D]">
                            #{ticket.ticketId}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500 font-medium">
                            {formatDate(ticket.createdAt)}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{ticket.name}</h4>
                      </div>
                    </div>

                    <TicketStatusBadge status={ticket.status} />
                  </div>

                  {/**
                   * Middle Row: Subject & Tags
                   * Support inquiry subject line and category metadata tags.
                   */}
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-1">
                      {ticket.subject}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className="inline-block text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded uppercase tracking-wide">
                        {ticket.category}
                      </span>
                      {(ticket.shopName || ticket.user?.businessName) && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#093C5D] font-medium">
                          <Store className="w-3 h-3" />
                          <span>{ticket.shopName || ticket.user?.businessName}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/**
                   * Bottom Row: Priority & Actions
                   * Priority indicator badge and buttons to resolve or view full thread.
                   */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                    <TicketPriorityBadge priority={ticket.priority} />

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                        <button
                          type="button"
                          onClick={(e) => handleQuickResolve(e, ticket)}
                          className="shrink-0 cursor-pointer text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-2.5 py-1 rounded-md flex items-center justify-center transition-all text-xs active:scale-95"
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenTicket(ticket);
                        }}
                        className="shrink-0 cursor-pointer text-[#093C5D] font-medium bg-[#093C5D]/5 border border-[#093C5D]/15 hover:bg-[#093C5D]/10 px-3 py-1 rounded-md flex items-center justify-center transition-all text-xs active:scale-95"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/**
         * Pagination Controls Bar
         * Page index summary and previous/next page navigation buttons.
         */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-t border-gray-200 bg-gray-50/60">
            <span className="text-xs text-gray-500 font-medium">
              Showing page <span className="font-semibold text-gray-800">{pagination.page}</span> of{' '}
              <span className="font-semibold text-gray-800">{pagination.totalPages}</span> ({pagination.total} tickets total)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="cursor-pointer p-1.5 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold px-2.5 text-gray-700">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="cursor-pointer p-1.5 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/**
       * Ticket Management Slide-Over Modal
       * Detailed ticket viewer and conversation thread drawer for administrative replies.
       */}
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
