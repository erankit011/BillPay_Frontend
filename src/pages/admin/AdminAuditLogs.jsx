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
    <div className="space-y-6 pb-12">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Platform Security & Audit Logs
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
              Immutable Trail
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Tamper-resistant audit trails tracking all administrative mutations, merchant lifecycle events, and security access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchStats();
              fetchLogs();
            }}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={exporting || loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-60"
          >
            <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Logs */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Total Recorded Events
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {statsLoading ? '...' : (stats.total || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Immutable historical records</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Merchant Interventions */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Merchant Interventions
            </p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">
              {statsLoading ? '...' : (stats.byCategory?.MERCHANT_MGMT || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Suspensions, overrides, logouts</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* System & Security Events */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Security & Settings
            </p>
            <p className="text-2xl font-bold text-rose-600 mt-1">
              {statsLoading
                ? '...'
                : (
                    (stats.byCategory?.SYSTEM_SETTINGS || 0) +
                    (stats.byCategory?.SECURITY || 0)
                  ).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Config & security updates</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Today's Activity */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Today's Activity
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {statsLoading ? '...' : (stats.todayCount || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Actions in current calendar day</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, actor name, actor email, target resource..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="py-2.5 pl-3 pr-8 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
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
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Audit Logs Table / Stream */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
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
                      <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                      <p className="text-sm font-medium">Loading audit logs...</p>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Inbox className="w-10 h-10 text-gray-300 stroke-[1.5]" />
                      <p className="text-sm font-semibold text-gray-700">No audit logs found</p>
                      <p className="text-xs text-gray-400">
                        Try adjusting your search criteria or category filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const dObj = log.createdAt ? new Date(log.createdAt) : null;
                  const dateStr = dObj && !isNaN(dObj.getTime())
                    ? dObj.toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })
                    : 'N/A';

                  return (
                    <tr
                      key={log._id}
                      className="hover:bg-gray-50/60 transition-colors group cursor-pointer"
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
                        <span className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
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
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0">
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
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
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
          <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
            <p className="text-xs text-gray-500">
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
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-semibold text-gray-700 px-3">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
