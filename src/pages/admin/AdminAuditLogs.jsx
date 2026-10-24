import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Download,
  Eye,
  Calendar,
  Layers,
  Activity,
  UserCheck,
  AlertCircle,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Clock,
  Laptop,
  RotateCcw,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getAdminAuditLogs,
  getAdminAuditStats,
  exportAdminAuditLogs,
} from '../../features/admin/api/adminApi';
import AuditCategoryBadge from '../../features/admin/components/audit/AuditCategoryBadge';
import AuditDetailsModal from '../../features/admin/components/audit/AuditDetailsModal';
import AdminStatCard from '../../features/admin/components/AdminStatCard';
import SwirlingLoader from '../../components/common/SwirlingLoader';
import { formatDate } from '../../utils/dateUtils';
import { getInitials } from '../../utils/stringUtils';

const CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'MERCHANT_MGMT', label: 'Merchant Management' },
  { value: 'SYSTEM_SETTINGS', label: 'Platform Settings' },
  { value: 'BROADCASTS', label: 'Broadcast Announcements' },
  { value: 'COUPONS', label: 'Coupons & Promos' },
  { value: 'SUPPORT', label: 'Helpdesk & Support' },
  { value: 'SECURITY', label: 'Platform Security' },
];

const formatActionName = (action) => {
  if (!action) return 'Unknown Action';
  return action
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const AdminAuditLogs = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || 'ALL';
  const urlPage = Number(searchParams.get('page')) || 1;

  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);

  const [exporting, setExporting] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Search debounce syncing with URL
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

  // Fetch KPI Stats via React Query
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['adminAuditStats'],
    queryFn: getAdminAuditStats,
    staleTime: 30 * 1000,
  });

  const stats = statsData || {
    total: 0,
    byCategory: {},
    todayCount: 0,
    last24Hours: 0,
  };

  // Fetch Logs via React Query
  const { data: logsData, isLoading: loading } = useQuery({
    queryKey: ['adminAuditLogs', debouncedSearch, urlCategory, urlPage],
    queryFn: () =>
      getAdminAuditLogs({
        page: urlPage,
        limit: 15,
        search: debouncedSearch || undefined,
        actionCategory: urlCategory !== 'ALL' ? urlCategory : undefined,
      }),
    staleTime: 30 * 1000,
  });

  const logs = logsData?.logs || [];
  const pagination = {
    page: logsData?.pagination?.page || urlPage,
    total: logsData?.pagination?.total ?? logs.length,
    totalPages: logsData?.pagination?.totalPages || logsData?.pagination?.pages || 1,
  };

  // Export CSV
  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const data = await exportAdminAuditLogs({
        actionCategory: urlCategory !== 'ALL' ? urlCategory : undefined,
        search: debouncedSearch || undefined,
      });

      if (!data || data.length === 0) {
        toast.error('No audit records match the current criteria');
        return;
      }

      const headers = [
        'Timestamp',
        'Action',
        'Category',
        'Actor Name',
        'Actor Email',
        'Target Type',
        'Target Name',
        'IP Address',
        'User Agent',
        'Details Payload',
      ];

      const rows = data.map((l) => [
        `"${new Date(l.createdAt).toISOString()}"`,
        `"${l.action || ''}"`,
        `"${l.actionCategory || ''}"`,
        `"${(l.actor?.name || 'Platform System').replace(/"/g, '""')}"`,
        `"${l.actor?.email || ''}"`,
        `"${l.targetType || ''}"`,
        `"${(l.targetName || '').replace(/"/g, '""')}"`,
        `"${l.ipAddress || ''}"`,
        `"${(l.userAgent || '').replace(/"/g, '""')}"`,
        `"${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,\uFEFF' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `udharpay-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${data.length} audit records`);
    } catch (err) {
      toast.error('Failed to export audit logs');
    } finally {
      setExporting(false);
    }
  };

  const openLogDetails = (log) => {
    setSelectedLog(log);
    setIsDetailsOpen(true);
  };

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12 pb-24 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">
            Platform Security & Audit Logs
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed font-medium">
            Tamper-resistant audit trails tracking all administrative mutations, merchant lifecycle events, and security access.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            disabled={exporting || loading}
            className="cursor-pointer h-10 sm:h-11 px-4 sm:px-5 rounded-lg bg-[#093C5D] hover:bg-[#072d46] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0 disabled:opacity-60 shadow-none"
          >
            <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Top KPI Summary Cards (Matched with Admin Shops UI) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
        <AdminStatCard
          title="TOTAL RECORDED EVENTS"
          value={statsLoading ? '...' : (stats.total || 0).toLocaleString()}
          subtext="Immutable historical records"
          icon={Layers}
          variant="primary"
        />
        <AdminStatCard
          title="MERCHANT ACTIONS"
          value={statsLoading ? '...' : (stats.byCategory?.MERCHANT_MGMT || 0).toLocaleString()}
          subtext="Suspensions, overrides, edits"
          icon={UserCheck}
          variant="default"
        />
        <AdminStatCard
          title="SECURITY & SETTINGS"
          value={statsLoading
            ? '...'
            : (
                (stats.byCategory?.SYSTEM_SETTINGS || 0) +
                (stats.byCategory?.SECURITY || 0)
              ).toLocaleString()}
          subtext="Config & security updates"
          icon={ShieldCheck}
          variant="danger"
        />
        <AdminStatCard
          title="TODAY'S ACTIVITY"
          value={statsLoading ? '...' : (stats.todayCount || 0).toLocaleString()}
          subtext="Current calendar day"
          icon={Activity}
          variant="success"
        />
      </div>

      {/* Filter Chips (Matched with Admin Shops UI) */}
      <div className="flex items-center flex-nowrap gap-2 sm:gap-3 overflow-x-auto pb-1 mb-2 sm:mb-3 w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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

        {(urlCategory !== 'ALL' || searchTerm) && (
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
            placeholder="Search By Action Event & Actor Name & Target Resource & IP Address"
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

      {/* Audit Logs Table / Stream */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-none">
        {loading ? (
          <div className="py-16 text-center text-gray-400">
            <div className="flex flex-col items-center justify-center gap-3">
              <SwirlingLoader className="w-10 h-10 md:w-12 md:h-12 text-[#093C5D] mx-auto" />
              <p className="text-sm font-medium text-gray-600">Loading audit logs...</p>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-gray-400 px-4">
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 tracking-tight">No audit logs found</h3>
            <p className="text-xs sm:text-sm text-gray-500 font-medium max-w-sm mx-auto mt-1">
              Try adjusting your search criteria or clearing your category filters.
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4 lg:px-6">Timestamp (IST)</th>
                    <th className="py-3.5 px-4 lg:px-6">Action Event</th>
                    <th className="py-3.5 px-4 lg:px-6">Category</th>
                    <th className="py-3.5 px-4 lg:px-6">Executing Actor</th>
                    <th className="py-3.5 px-4 lg:px-6">Target Resource</th>
                    <th className="py-3.5 px-4 lg:px-6">Network / IP</th>
                    <th className="py-3.5 px-4 lg:px-6 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {logs.map((log) => {
                    const dateStr = formatDate(log.createdAt) || 'N/A';

                    return (
                      <tr
                        key={log._id}
                        className="hover:bg-[#F5F5F5]/60 transition-colors group cursor-pointer"
                        onClick={() => openLogDetails(log)}
                      >
                        {/* Timestamp */}
                        <td className="py-3.5 px-4 lg:px-6 text-gray-600 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{dateStr}</span>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 lg:px-6">
                          <span className="font-semibold text-gray-900 group-hover:text-[#093C5D] transition-colors">
                            {formatActionName(log.action)}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 lg:px-6">
                          <AuditCategoryBadge category={log.actionCategory} size="xs" />
                        </td>

                        {/* Executing Actor */}
                        <td className="py-3.5 px-4 lg:px-6">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg p-[2px] border border-gray-200 bg-white shrink-0">
                              <div className="w-full h-full rounded-md flex items-center justify-center text-xs font-semibold bg-gray-50 text-[#093C5D]">
                                {getInitials(log.actor?.name)}
                              </div>
                            </div>
                            <div className="truncate max-w-[140px]">
                              <p className="font-semibold text-gray-900 truncate">
                                {log.actor?.name || 'Platform System'}
                              </p>
                              <p className="text-[10px] text-gray-500 truncate">
                                {log.actor?.email || 'system'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Target Resource */}
                        <td className="py-3.5 px-4 lg:px-6">
                          <div className="truncate max-w-[150px]">
                            <span className="font-semibold text-gray-900 block truncate">
                              {log.targetName || log.targetType || 'Platform'}
                            </span>
                            <span className="text-[10px] text-gray-500 block truncate font-medium">
                              {log.targetType || 'General'}
                            </span>
                          </div>
                        </td>

                        {/* Network / IP */}
                        <td className="py-3.5 px-4 lg:px-6 font-mono text-[11px] text-gray-600">
                          {log.ipAddress || '127.0.0.1'}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 lg:px-6 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openLogDetails(log);
                            }}
                            className="shrink-0 cursor-pointer text-[#093C5D] font-medium bg-[#093C5D]/5 border border-[#093C5D]/15 hover:bg-[#093C5D]/10 px-2.5 py-1 rounded-md transition-all text-xs active:scale-95 inline-flex items-center gap-1"
                            title="View Full Audit Snapshot"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Card Stream */}
            <div className="lg:hidden flex flex-col gap-2.5 p-3">
              {logs.map((log) => {
                const dateStr = formatDate(log.createdAt) || 'N/A';

                return (
                  <div
                    key={log._id}
                    onClick={() => openLogDetails(log)}
                    className="bg-white border border-gray-200 rounded-lg p-3.5 transition-colors cursor-pointer active:bg-gray-50 shadow-none space-y-3"
                  >
                    {/* Top Row: Actor Avatar + Action + Category */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg p-[2px] border border-gray-200 bg-white shrink-0">
                          <div className="w-full h-full rounded-md flex items-center justify-center text-xs font-semibold bg-gray-50 text-[#093C5D]">
                            {getInitials(log.actor?.name)}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                            {formatActionName(log.action)}
                          </h4>
                          <p className="text-[11px] text-gray-500 truncate">
                            by {log.actor?.name || 'Platform System'}
                          </p>
                        </div>
                      </div>

                      <AuditCategoryBadge category={log.actionCategory} size="xs" />
                    </div>

                    {/* Middle Details */}
                    <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-500 gap-2 pt-1 border-t border-gray-100">
                      <span>Target: <strong className="text-gray-800 font-semibold">{log.targetName || log.targetType || 'Platform'}</strong></span>
                      <span className="font-mono text-[10px] text-gray-500">{log.ipAddress || '127.0.0.1'}</span>
                    </div>

                    {/* Bottom Row */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{dateStr}</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openLogDetails(log);
                        }}
                        className="shrink-0 cursor-pointer text-[#093C5D] font-medium bg-[#093C5D]/5 border border-[#093C5D]/15 hover:bg-[#093C5D]/10 px-2.5 py-1 rounded-md transition-all text-xs active:scale-95 inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-t border-gray-200 bg-gray-50/60">
            <span className="text-xs text-gray-500 font-medium">
              Showing page <span className="font-semibold text-gray-800">{pagination.page}</span> of{' '}
              <span className="font-semibold text-gray-800">{pagination.totalPages}</span> ({pagination.total} total events)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
                className="cursor-pointer p-1.5 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold px-2.5 text-gray-700">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="cursor-pointer p-1.5 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Snapshot Modal */}
      <AuditDetailsModal
        isOpen={isDetailsOpen}
        log={selectedLog}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedLog(null);
        }}
      />
    </div>
  );
};

export default AdminAuditLogs;
