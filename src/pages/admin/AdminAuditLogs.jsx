import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getAdminAuditLogs,
  getAdminAuditStats,
  exportAdminAuditLogs,
} from '../../features/admin/api/adminApi';
import AuditCategoryBadge from '../../features/admin/components/audit/AuditCategoryBadge';
import AuditDetailsModal from '../../features/admin/components/audit/AuditDetailsModal';
import SwirlingLoader from '../../components/common/SwirlingLoader';
import { formatDate } from '../../utils/dateUtils';

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
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    byCategory: {},
    todayCount: 0,
    last24Hours: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch KPI Stats
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await getAdminAuditStats();
      if (data) setStats(data);
    } catch (err) {
      console.error('Failed to load audit stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch Logs
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedCategory !== 'ALL') params.actionCategory = selectedCategory;

      const data = await getAdminAuditLogs(params);
      if (data) {
        setLogs(data.logs || []);
        if (data.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: data.pagination.total,
            totalPages: data.pagination.totalPages || data.pagination.pages || 1,
          }));
        }
      }
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, selectedCategory]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Export CSV
  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const data = await exportAdminAuditLogs({
        actionCategory: selectedCategory !== 'ALL' ? selectedCategory : undefined,
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
    <div className="w-full min-w-0 space-y-6 md:space-y-8 pb-24 lg:pb-0">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            className="cursor-pointer h-10 px-4 sm:px-5 rounded-lg bg-[#093C5D] hover:bg-[#072d46] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0 disabled:opacity-60"
          >
            <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
        {/* Total Logs */}
        <div className="bg-white rounded-lg p-4 md:p-5 flex flex-col justify-between border border-gray-200 hover:border-gray-300 transition-all duration-200">
          <div className="flex justify-between items-start gap-1">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">
              Total Recorded Events
            </p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">
              {statsLoading ? '...' : (stats.total || 0).toLocaleString()}
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate mt-0.5">
              Immutable historical records
            </p>
          </div>
        </div>

        {/* Merchant Interventions */}
        <div className="bg-white rounded-lg p-4 md:p-5 flex flex-col justify-between border border-gray-200 hover:border-gray-300 transition-all duration-200">
          <div className="flex justify-between items-start gap-1">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">
              Merchant Actions
            </p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">
              {statsLoading ? '...' : (stats.byCategory?.MERCHANT_MGMT || 0).toLocaleString()}
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate mt-0.5">
              Suspensions, overrides, edits
            </p>
          </div>
        </div>

        {/* System & Security Events */}
        <div className="bg-white rounded-lg p-4 md:p-5 flex flex-col justify-between border border-gray-200 hover:border-gray-300 transition-all duration-200">
          <div className="flex justify-between items-start gap-1">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-rose-600 border border-gray-200 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">
              Security & Settings
            </p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-rose-600 truncate">
              {statsLoading
                ? '...'
                : (
                    (stats.byCategory?.SYSTEM_SETTINGS || 0) +
                    (stats.byCategory?.SECURITY || 0)
                  ).toLocaleString()}
            </p>
            <p className="text-[10px] md:text-xs text-rose-600 font-medium truncate mt-0.5">
              Config & security updates
            </p>
          </div>
        </div>

        {/* Today's Activity */}
        <div className="bg-white rounded-lg p-4 md:p-5 flex flex-col justify-between border border-gray-200 hover:border-gray-300 transition-all duration-200">
          <div className="flex justify-between items-start gap-1">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-emerald-700 border border-gray-200 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">
              Today's Activity
            </p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-emerald-700 truncate">
              {statsLoading ? '...' : (stats.todayCount || 0).toLocaleString()}
            </p>
            <p className="text-[10px] md:text-xs text-emerald-700 font-medium truncate mt-0.5">
              Current calendar day
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-3.5 md:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, actor name, actor email, target resource..."
            className="w-full h-10 pl-9 pr-4 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#093C5D]/20 focus:border-[#093C5D] text-gray-900 font-medium transition-all"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="h-10 text-xs sm:text-sm font-medium border border-gray-200 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#093C5D]/20 focus:border-[#093C5D] text-gray-700 cursor-pointer"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {(search || selectedCategory !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('ALL');
              }}
              className="cursor-pointer text-xs text-[#093C5D] hover:underline font-medium px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Audit Logs Table / Stream */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 pl-6">Timestamp (IST)</th>
                <th className="py-3.5 px-4">Action Event</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Executing Actor</th>
                <th className="py-3.5 px-4">Target Resource</th>
                <th className="py-3.5 px-4">Network / IP</th>
                <th className="py-3.5 px-4 pr-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <SwirlingLoader className="w-10 h-10 text-[#093C5D] mx-auto" />
                      <p className="text-sm font-medium text-gray-600">Loading audit logs...</p>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Inbox className="w-10 h-10 text-gray-300 stroke-[1.5]" />
                      <p className="text-sm font-semibold text-gray-700">No audit logs found</p>
                      <p className="text-xs text-gray-500 font-medium">
                        Try adjusting your search criteria or category filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const dateStr = formatDate(log.createdAt) || 'N/A';

                  return (
                    <tr
                      key={log._id}
                      className="hover:bg-gray-50/70 transition-colors group cursor-pointer"
                      onClick={() => openLogDetails(log)}
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 pl-6 whitespace-nowrap text-gray-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-gray-900 group-hover:text-[#093C5D] transition-colors">
                          {formatActionName(log.action)}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <AuditCategoryBadge category={log.actionCategory} size="xs" />
                      </td>

                      {/* Executing Actor */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-50 text-[#093C5D] border border-blue-200 flex items-center justify-center font-semibold text-[10px] shrink-0">
                            {(log.actor?.name || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate max-w-[140px]">
                            <p className="font-medium text-gray-800 truncate">
                              {log.actor?.name || 'Platform System'}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">
                              {log.actor?.email || 'system'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Target Resource */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="truncate max-w-[150px]">
                          <span className="font-medium text-gray-800 block truncate">
                            {log.targetName || log.targetType || 'Platform'}
                          </span>
                          <span className="text-[10px] text-gray-400 block truncate">
                            {log.targetType || 'General'}
                          </span>
                        </div>
                      </td>

                      {/* Network / IP */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-gray-500">
                        {log.ipAddress || '127.0.0.1'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 pr-6 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openLogDetails(log);
                          }}
                          className="cursor-pointer p-1.5 text-gray-400 hover:text-[#093C5D] hover:bg-[#093C5D]/10 rounded transition-colors"
                          title="View Full Audit Snapshot"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.total > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/60">
            <p className="text-xs text-gray-500 font-medium">
              Showing{' '}
              <span className="font-semibold text-gray-700">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-gray-700">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-semibold text-gray-700">{pagination.total}</span> events
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1 || loading}
                className="cursor-pointer p-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-gray-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-semibold text-gray-700 px-3">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="cursor-pointer p-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-gray-700"
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
