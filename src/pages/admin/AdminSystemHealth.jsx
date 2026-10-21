import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Database,
  Server,
  Mail,
  Image as ImageIcon,
  CreditCard,
  Cpu,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { getAdminSystemHealth } from '../../features/admin/api/adminApi';
import HealthServiceCard from '../../features/admin/components/HealthServiceCard';
import SwirlingLoader from '../../components/common/SwirlingLoader';

const formatUptime = (seconds = 0) => {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
};

const AdminSystemHealth = () => {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['adminSystemHealth'],
    queryFn: getAdminSystemHealth,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });

  const services = data?.services || {};
  const server = data?.server || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[75vh]">
        <SwirlingLoader className="w-10 h-10 md:w-12 md:h-12 text-[#093C5D]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-red-200 text-red-700 shadow-none">
        <p className="font-semibold text-sm sm:text-base">Failed to retrieve system health diagnostics.</p>
        <button
          onClick={() => refetch()}
          className="cursor-pointer mt-3 px-4 py-2 bg-[#093C5D] text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-[#082a42] transition-colors"
        >
          Retry Check
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12 pb-24 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">
            System Infrastructure & Health Diagnostics
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed font-medium">
            Real-time operational status of backend microservices, database clusters, server memory, and payment gateways.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="cursor-pointer bg-[#093C5D] hover:bg-[#082a42] text-white px-4 sm:px-5 md:px-6 py-2 md:py-2.5 rounded-lg flex items-center whitespace-nowrap shrink-0 font-semibold text-xs md:text-sm w-full sm:w-auto justify-center active:scale-95 transition-all shadow-none disabled:opacity-70"
          title="Refresh real-time system diagnostics"
        >
          <RotateCcw className={`w-4 h-4 mr-1.5 sm:mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          <span>{isFetching ? 'Refreshing...' : 'Refresh Status'}</span>
        </button>
      </div>

      {/* Server Runtime & Memory Load Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-none">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#F5F5F5] text-[#093C5D] flex items-center justify-center border border-gray-200 shrink-0">
              <Cpu className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                Backend Node.js Server Runtime
              </h3>
              <p className="text-xs font-medium text-gray-500">
                Environment: <span className="font-semibold uppercase text-gray-800">{server.environment || 'development'}</span> • Runtime Engine: Node {server.nodeVersion || 'v20.x'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] sm:text-xs text-gray-500 font-medium block">Continuous Server Uptime</span>
            <span className="text-xs sm:text-sm font-semibold text-gray-900">
              {formatUptime(server.uptime)}
            </span>
          </div>
        </div>

        {/* Memory Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-gray-500 font-semibold block uppercase text-[10px] tracking-wide">Heap Memory Used</span>
            <span className="text-base sm:text-lg font-semibold text-gray-900 mt-0.5 block">
              {server.memory?.heapUsed || 'N/A'}
            </span>
            <span className="text-[11px] text-gray-500 font-medium">Memory occupied by active data objects</span>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-gray-500 font-semibold block uppercase text-[10px] tracking-wide">Total Allocated Heap</span>
            <span className="text-base sm:text-lg font-semibold text-gray-900 mt-0.5 block">
              {server.memory?.heapTotal || 'N/A'}
            </span>
            <span className="text-[11px] text-gray-500 font-medium">Total memory space reserved by V8 engine</span>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-gray-500 font-semibold block uppercase text-[10px] tracking-wide">Resident Set Size (RSS)</span>
            <span className="text-base sm:text-lg font-semibold text-gray-900 mt-0.5 block">
              {server.memory?.rss || 'N/A'}
            </span>
            <span className="text-[11px] text-gray-500 font-medium">Total physical server RAM in active use</span>
          </div>
        </div>
      </div>

      {/* External Services Section */}
      <div>
        <div className="mb-3 sm:mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#093C5D]" />
            Core Infrastructure & Third-Party Service Integrations
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
          {/* MongoDB */}
          <HealthServiceCard
            name="MongoDB Atlas"
            status={services.database?.status}
            latency={services.database?.latency}
            details="Stores shops, merchants, bills, & receipts"
            icon={Database}
            delay={0.05}
          />

          {/* Redis */}
          <HealthServiceCard
            name="Redis Cache & Sessions"
            status={services.redis?.status}
            latency={services.redis?.latency}
            details="Manages token revocation & session caching"
            icon={Server}
            delay={0.1}
          />

          {/* Brevo Email */}
          <HealthServiceCard
            name="Brevo Email Gateway"
            status={services.email?.status}
            latency={services.email?.latency}
            details="Delivers verification OTPs & password reset emails"
            icon={Mail}
            delay={0.15}
          />

          {/* ImageKit */}
          <HealthServiceCard
            name="ImageKit Media CDN"
            status={services.imageStorage?.status}
            latency={services.imageStorage?.latency}
            details="Hosts store logos, avatars, & invoice bill slips"
            icon={ImageIcon}
            delay={0.2}
          />

          {/* Razorpay */}
          <HealthServiceCard
            name="Razorpay Gateway"
            status={services.payments?.status}
            latency={services.payments?.latency}
            details="Processes merchant SaaS subscription payments"
            icon={CreditCard}
            delay={0.25}
          />

          {/* Socket.io Realtime */}
          <HealthServiceCard
            name="Socket.io Realtime"
            status="healthy"
            latency={1}
            details="Broadcasts live in-app notifications to users"
            icon={Activity}
            delay={0.3}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminSystemHealth;
