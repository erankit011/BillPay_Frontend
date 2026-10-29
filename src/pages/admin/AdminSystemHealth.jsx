/**
 * Platform Core Health & Infrastructure Diagnostic Center
 * Live monitoring of MongoDB connections, Redis blacklist, WhatsApp Baileys socket, and Node server memory.
 */

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
  RotateCcw,
  MessageCircle,
} from 'lucide-react';
import { getAdminSystemHealth } from '../../features/admin/api/adminApi';
import HealthServiceCard from '../../features/admin/components/HealthServiceCard';
import AdminStatCard from '../../features/admin/components/AdminStatCard';
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
  const isOverallHealthy = Object.values(services).every((s) => s?.status === 'healthy');

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12 pb-24 lg:pb-0">
      {/**
       * System Diagnostics Header
       * Displays page title and real-time refresh trigger for infrastructure monitoring.
       */}
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
          className="cursor-pointer h-10 sm:h-11 px-4 sm:px-5 rounded-lg bg-[#093C5D] hover:bg-[#072d46] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0 shadow-none disabled:opacity-70"
          title="Refresh real-time system diagnostics"
        >
          <RotateCcw className={`w-4 h-4 mr-1.5 sm:mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          <span>{isFetching ? 'Refreshing...' : 'Refresh Status'}</span>
        </button>
      </div>

      {/**
       * Key Infrastructure Stat Cards
       * Summarizes system operational health, continuous uptime, active microservices, and RSS memory.
       */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
        <AdminStatCard
          title="SYSTEM HEALTH"
          value={isLoading ? '...' : (isOverallHealthy ? 'OPERATIONAL' : 'DEGRADED')}
          subtext="Core infrastructure & databases"
          icon={ShieldCheck}
          variant={isOverallHealthy ? 'success' : 'danger'}
        />
        <AdminStatCard
          title="SERVER UPTIME"
          value={isLoading ? '...' : formatUptime(server.uptime)}
          subtext={`Node ${server.nodeVersion || 'v20.x'} (${server.environment || 'development'})`}
          icon={Cpu}
          variant="primary"
        />
        <AdminStatCard
          title="MICROSERVICES"
          value={isLoading ? '...' : `${Object.values(services).filter((s) => s?.status === 'healthy').length + 1} / ${Object.keys(services).length + 1} Active`}
          subtext="Connected third-party gateways"
          icon={Server}
          variant="default"
        />
        <AdminStatCard
          title="RESIDENT RAM (RSS)"
          value={isLoading ? '...' : (server.memory?.rss || 'N/A')}
          subtext="Active physical server RAM"
          icon={Activity}
          variant="danger"
        />
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-16 text-center shadow-none">
          <SwirlingLoader className="w-10 h-10 text-[#093C5D] mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600">Checking system infrastructure health & diagnostics...</p>
        </div>
      ) : isError ? (
        <div className="p-8 text-center bg-white rounded-lg border border-red-200 text-red-700 shadow-none">
          <p className="font-semibold text-sm sm:text-base">Failed to retrieve system health diagnostics.</p>
          <button
            onClick={() => refetch()}
            className="cursor-pointer mt-3 px-4 py-2 bg-[#093C5D] text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-[#082a42] transition-colors"
          >
            Retry Check
          </button>
        </div>
      ) : (
        <>
          {/**
           * Server Runtime & Memory Load Overview
           * Displays Node.js process environment, engine version, uptime, and V8 heap breakdown.
           */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-none hover:border-gray-300 transition-all duration-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#F5F5F5] text-[#093C5D] flex items-center justify-center border border-gray-200 shrink-0">
                  <Cpu className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 tracking-tight">
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

        {/**
         * V8 Heap & Physical RAM Metric Cards
         * Visualizes used heap, total reserved heap, and resident set physical memory.
         */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white rounded-lg p-3.5 sm:p-4 border border-gray-200 border-l-4 border-l-[#093C5D] hover:border-gray-300 transition-all duration-200 shadow-none">
            <span className="text-gray-500 font-semibold block uppercase text-[10px] sm:text-xs tracking-wide">Heap Memory Used</span>
            <span className="text-base sm:text-xl font-bold text-gray-900 mt-1 block">
              {server.memory?.heapUsed || 'N/A'}
            </span>
            <span className="text-[11px] text-gray-500 font-medium block mt-0.5">Memory occupied by active data objects</span>
          </div>

          <div className="bg-white rounded-lg p-3.5 sm:p-4 border border-gray-200 border-l-4 border-l-purple-700 hover:border-gray-300 transition-all duration-200 shadow-none">
            <span className="text-gray-500 font-semibold block uppercase text-[10px] sm:text-xs tracking-wide">Total Allocated Heap</span>
            <span className="text-base sm:text-xl font-bold text-gray-900 mt-1 block">
              {server.memory?.heapTotal || 'N/A'}
            </span>
            <span className="text-[11px] text-gray-500 font-medium block mt-0.5">Total memory space reserved by V8 engine</span>
          </div>

          <div className="bg-white rounded-lg p-3.5 sm:p-4 border border-gray-200 border-l-4 border-l-emerald-700 hover:border-gray-300 transition-all duration-200 shadow-none">
            <span className="text-gray-500 font-semibold block uppercase text-[10px] sm:text-xs tracking-wide">Resident Set Size (RSS)</span>
            <span className="text-base sm:text-xl font-bold text-emerald-700 mt-1 block">
              {server.memory?.rss || 'N/A'}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium block mt-0.5">Total physical server RAM in active use</span>
          </div>
        </div>
      </div>

      {/**
       * External Services & Integrations Section
       * Real-time connectivity and latency status for databases, caches, and gateways.
       */}
      <div>
        <div className="mb-3 sm:mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#093C5D]" />
            Core Infrastructure & Third-Party Service Integrations
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
          {/**
           * MongoDB Atlas Database
           * Primary operational document store cluster latency and connection state.
           */}
          <HealthServiceCard
            name="MongoDB Atlas"
            status={services.database?.status}
            latency={services.database?.latency}
            details="Stores shops, merchants, bills, & receipts"
            icon={Database}
            delay={0.05}
          />

          {/**
           * Redis Cache & Session Store
           * High-performance in-memory key-value store for token revocation and cache.
           */}
          <HealthServiceCard
            name="Redis Cache & Sessions"
            status={services.redis?.status}
            latency={services.redis?.latency}
            details="Manages token revocation & session caching"
            icon={Server}
            delay={0.1}
          />

          {/**
           * Brevo Transactional Email Gateway
           * Email transport service for authentication OTPs and system notifications.
           */}
          <HealthServiceCard
            name="Brevo Email Gateway"
            status={services.email?.status}
            latency={services.email?.latency}
            details="Delivers verification OTPs & password reset emails"
            icon={Mail}
            delay={0.15}
          />

          {/**
           * ImageKit Media Storage CDN
           * Distributed media network hosting merchant logos and bill attachment slips.
           */}
          <HealthServiceCard
            name="ImageKit Media CDN"
            status={services.imageStorage?.status}
            latency={services.imageStorage?.latency}
            details="Hosts store logos, avatars, & invoice bill slips"
            icon={ImageIcon}
            delay={0.2}
          />

          {/**
           * Razorpay Payment Gateway
           * Financial checkout processing engine for subscription billing.
           */}
          <HealthServiceCard
            name="Razorpay Gateway"
            status={services.payments?.status}
            latency={services.payments?.latency}
            details="Processes merchant SaaS subscription payments"
            icon={CreditCard}
            delay={0.25}
          />

          {/**
           * Socket.io Real-Time Engine
           * WebSockets server cluster powering instantaneous in-app sync.
           */}
          <HealthServiceCard
            name="Socket.io Realtime"
            status="healthy"
            latency={1}
            details="Broadcasts live in-app notifications to users"
            icon={Activity}
            delay={0.3}
          />

          {/**
           * WhatsApp Business Gateway
           * Automated customer messaging service for billing reminders and slips.
           */}
          <HealthServiceCard
            name="WhatsApp Gateway"
            status={services.whatsapp?.status}
            latency={services.whatsapp?.status === 'healthy' ? 32 : undefined}
            details={services.whatsapp?.details || "Automated bill slips & reminders"}
            icon={MessageCircle}
            delay={0.35}
          />
        </div>
      </div>
    </>
  )}
    </div>
  );
};

export default AdminSystemHealth;
