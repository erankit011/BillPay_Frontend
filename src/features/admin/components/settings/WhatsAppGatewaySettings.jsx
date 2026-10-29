/**
 * Administrative WhatsApp Baileys Gateway Settings
 * Provides live QR-code scanner, gateway connection status, phone pairing, and session restart controls.
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageCircle,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  LogOut,
  Smartphone,
  ShieldCheck,
  Server,
  Zap,
  Info,
  Clock,
  Copy,
  Check,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  getWhatsAppStatus,
  restartWhatsAppGateway,
  logoutWhatsAppGateway,
} from '../../api/adminApi';
import SwirlingLoader from '../../../../components/common/SwirlingLoader';

/**
 * WhatsAppGatewaySettings Component
 */
const WhatsAppGatewaySettings = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  /**
   * Modal Scroll Lock Effect
   * Prevents background viewport scrolling when disconnect confirmation modal is open.
   */
  useEffect(() => {
    if (!showDisconnectModal) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [showDisconnectModal]);

  /**
   * Live WhatsApp Gateway Status Query
   * Polls gateway status with accelerated interval during QR code pairing mode.
   */
  const { data: statusData, isLoading, isError, refetch } = useQuery({
    queryKey: ['whatsappStatus'],
    queryFn: getWhatsAppStatus,
    /**
     * Polling Interval Strategy
     * Fast 8s polling during scan phase and standard 30s when session is established.
     */
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === 'SCAN_QR' ? 8000 : 30000;
    },
    staleTime: 5000,
  });

  /**
   * Restart / Refresh QR Code Mutation
   * Re-instantiates gateway engine and forces generation of a new QR authentication key.
   */
  const restartMutation = useMutation({
    mutationFn: restartWhatsAppGateway,
    onSuccess: () => {
      toast.success(t('Gateway engine restarted. Generating fresh QR code...'));
      queryClient.invalidateQueries({ queryKey: ['whatsappStatus'] });
      queryClient.invalidateQueries({ queryKey: ['adminSystemHealth'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t('Failed to restart WhatsApp gateway'));
    },
  });

  /**
   * Session Logout & Disconnect Mutation
   * Explicitly closes WhatsApp web socket and deletes persistent device session.
   */
  const logoutMutation = useMutation({
    mutationFn: logoutWhatsAppGateway,
    onSuccess: () => {
      setShowDisconnectModal(false);
      toast.success(t('WhatsApp session disconnected and credentials purged.'));
      queryClient.invalidateQueries({ queryKey: ['whatsappStatus'] });
      queryClient.invalidateQueries({ queryKey: ['adminSystemHealth'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t('Failed to disconnect WhatsApp'));
    },
  });

  const isConnected = statusData?.status === 'CONNECTED';
  const isScanQR = statusData?.status === 'SCAN_QR';

  /**
   * Phone Number Display Formatter
   * Cleans raw sender ID and formats with country code grouping.
   */
  const formatPhoneNumber = (rawId) => {
    if (!rawId) return 'N/A';
    const digits = rawId.toString().replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) {
      return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    return `+${digits}`;
  };

  /**
   * Session Date & Time Formatter
   * Parses timestamp into standard DD/MM/YYYY • HH:MM AM/PM presentation.
   */
  const formatSessionDate = (dateStr) => {
    if (!dateStr) return t('Active Session');
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return t('Active Session');
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const y = date.getFullYear();
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const strHours = String(hours).padStart(2, '0');
      return `${d}/${m}/${y} • ${strHours}:${minutes} ${ampm}`;
    } catch {
      return t('Active Session');
    }
  };

  const handleCopyPhone = (phoneStr) => {
    if (!phoneStr) return;
    navigator.clipboard.writeText(phoneStr.replace(/\s+/g, ''));
    setCopiedPhone(true);
    toast.success(t('Phone number copied to clipboard'));
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/**
       * WhatsApp Business Gateway Section Card
       * Central hub for device pairing, real-time Baileys status, and anti-ban metrics.
       */}
      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-none">
        {/**
         * Gateway Header Toolbar
         * Displays component title, engine badge, and real-time operational status tag.
         */}
        <div className="px-4 sm:px-5 md:px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 border ${
              isConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isScanQR
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-[#093C5D]/10 text-[#093C5D] border-[#093C5D]/20'
            }`}>
              <MessageCircle className={`w-5 h-5 ${
                isConnected
                  ? 'text-emerald-700'
                  : isScanQR
                  ? 'text-amber-700'
                  : 'text-[#093C5D]'
              }`} />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span>{t('WhatsApp Business Gateway')}</span>
                <span className="hidden sm:inline-block text-xs font-normal text-gray-400">• Baileys Engine</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 font-normal">
                {t('Automated bill slips, payment reminders, and customer recovery alerts')}
              </p>
            </div>
          </div>

          {/**
           * Real-Time Status Pill Indicator
           * Visual indicator for Live & Operational, Scan Required, or Offline states.
           */}
          <div className="flex items-center gap-2">
            {isConnected && (
              <span className="text-[10px] sm:text-xs font-semibold uppercase px-2.5 py-1 rounded border inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{t('Live & Operational')}</span>
              </span>
            )}
            {isScanQR && (
              <span className="text-[10px] sm:text-xs font-semibold uppercase px-2.5 py-1 rounded border inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>{t('Scan Required')}</span>
              </span>
            )}
            {!isConnected && !isScanQR && (
              <span className="text-[10px] sm:text-xs font-semibold uppercase px-2.5 py-1 rounded border inline-flex items-center gap-1.5 bg-red-50 text-red-700 border-red-200">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span>{t('Offline')}</span>
              </span>
            )}
          </div>
        </div>

        {/**
         * Gateway Body Content Area
         * Dynamically toggles between connected dashboard, QR code view, and offline fallback.
         */}
        <div className="px-4 sm:px-5 md:px-6 py-5 md:py-6">
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <SwirlingLoader className="w-8 h-8 text-[#093C5D]" />
              <p className="text-xs text-gray-500 font-medium">{t('Checking gateway status...')}</p>
            </div>
          )}

          {isError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-900">{t('Failed to load WhatsApp gateway')}</h4>
                <p className="text-xs text-red-700 mt-1 font-medium leading-relaxed">
                  {t('Could not communicate with WhatsApp Baileys service. Please ensure the backend server is running.')}
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="cursor-pointer mt-3 h-8 px-3 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  {t('Retry Connection')}
                </button>
              </div>
            </div>
          )}

          {!isLoading && !isError && (
            <>
              {/**
               * Connected Gateway State
               * Shows paired device metadata, queue status, rate limit health, and persistence details.
               */}
              {isConnected && (
                <div className="space-y-4 sm:space-y-5">
                  {/**
                   * Active Device Overview Container
                   * Displays authenticated phone number, device name, and management actions.
                   */}
                  <div className="bg-gray-50/70 border border-gray-200 rounded-lg p-3.5 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 border border-emerald-700/20 shadow-none">
                        <MessageCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                            {statusData.connectedUser?.name || 'WhatsApp Business'}
                          </h3>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{t('Active')}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-600 font-normal">
                          <span className="font-semibold text-gray-800">
                            {formatPhoneNumber(statusData.connectedUser?.id)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyPhone(formatPhoneNumber(statusData.connectedUser?.id))}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 cursor-pointer"
                            title={t('Copy Phone Number')}
                          >
                            {copiedPhone ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span className="text-gray-300 select-none">•</span>
                          <span className="text-gray-500 font-normal truncate">{t('Linked Device Session')}</span>
                        </div>
                      </div>
                    </div>

                    {/**
                     * Gateway Lifecycle Action Buttons
                     * Allows warm restart of web socket or complete device logout and credential purge.
                     */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200">
                      <button
                        type="button"
                        onClick={() => restartMutation.mutate()}
                        disabled={restartMutation.isPending}
                        className="cursor-pointer flex-1 sm:flex-initial h-8 px-3 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-none disabled:opacity-50"
                        title={t('Re-initialize socket connection without losing credentials')}
                      >
                        <RotateCcw className={`w-3.5 h-3.5 text-gray-500 ${restartMutation.isPending ? 'animate-spin' : ''}`} />
                        <span>{t('Restart Gateway')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowDisconnectModal(true)}
                        className="cursor-pointer flex-1 sm:flex-initial h-8 px-3 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-none"
                      >
                        <LogOut className="w-3.5 h-3.5 text-red-600" />
                        <span>{t('Disconnect Device')}</span>
                      </button>
                    </div>
                  </div>

                  {/**
                   * Gateway Diagnostics & Health Grid
                   * 4-column overview of outbox length, rate limiter status, Baileys version, and uptime.
                   */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/**
                     * Outbox Message Queue Metric Card
                     * Monitors pending message backlog and automated pacing.
                     */}
                    <div className="bg-white rounded-lg border border-gray-200 p-3.5 sm:p-4 flex flex-col justify-between hover:border-gray-300 transition-colors shadow-none">
                      <div className="flex items-center justify-between text-xs text-gray-500 font-medium mb-2">
                        <span className="uppercase text-[10px] tracking-wider font-semibold text-gray-600">{t('Outbox Message Queue')}</span>
                        <div className="w-7 h-7 rounded-md bg-[#093C5D]/10 text-[#093C5D] border border-[#093C5D]/20 flex items-center justify-center shrink-0">
                          <Zap className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="text-xl font-semibold text-gray-900">
                        {statusData.queueLength ?? 0}
                        <span className="text-xs font-medium text-gray-500 ml-1.5">{t('messages')}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-normal mt-1">
                        {t('Pacing 40s-60s for anti-ban')}
                      </p>
                    </div>

                    {/**
                     * Circuit Breaker & Rate Limiter Metric Card
                     * Real-time safety status protecting against WhatsApp anti-spam bans.
                     */}
                    <div className="bg-white rounded-lg border border-gray-200 p-3.5 sm:p-4 flex flex-col justify-between hover:border-gray-300 transition-colors shadow-none">
                      <div className="flex items-center justify-between text-xs text-gray-500 font-medium mb-2">
                        <span className="uppercase text-[10px] tracking-wider font-semibold text-gray-600">{t('Rate-Limit Protection')}</span>
                        <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="text-base font-semibold text-gray-900 truncate">
                        {statusData.isCircuitBroken ? (
                          <span className="text-amber-600">
                            {t('Cooldown')} ({statusData.circuitBreakerRemainingMins || 1}m)
                          </span>
                        ) : (
                          <span className="text-emerald-700">{t('Healthy & Idle')}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 font-normal mt-1">
                        {t('Auto circuit breaker defense')}
                      </p>
                    </div>

                    {/**
                     * Engine & Authentication Protocol Metric Card
                     * Shows current underlying Baileys library and session store type.
                     */}
                    <div className="bg-white rounded-lg border border-gray-200 p-3.5 sm:p-4 flex flex-col justify-between hover:border-gray-300 transition-colors shadow-none">
                      <div className="flex items-center justify-between text-xs text-gray-500 font-medium mb-2">
                        <span className="uppercase text-[10px] tracking-wider font-semibold text-gray-600">{t('Engine & Auth')}</span>
                        <div className="w-7 h-7 rounded-md bg-gray-50 text-gray-600 border border-gray-200 flex items-center justify-center shrink-0">
                          <Server className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="text-base font-semibold text-gray-900 truncate">
                        Baileys v7.0
                      </div>
                      <p className="text-[11px] text-gray-500 font-normal mt-1">
                        {t('MongoDB Cloud Synced')}
                      </p>
                    </div>

                    {/**
                     * Session Persistence & Timestamp Metric Card
                     * Tracks continuous session creation and connection stability.
                     */}
                    <div className="bg-white rounded-lg border border-gray-200 p-3.5 sm:p-4 flex flex-col justify-between hover:border-gray-300 transition-colors shadow-none">
                      <div className="flex items-center justify-between text-xs text-gray-500 font-medium mb-2">
                        <span className="uppercase text-[10px] tracking-wider font-semibold text-gray-600">{t('Session Persistence')}</span>
                        <div className="w-7 h-7 rounded-md bg-gray-50 text-gray-600 border border-gray-200 flex items-center justify-center shrink-0">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {formatSessionDate(statusData.lastConnectedAt)}
                      </div>
                      <p className="text-[11px] text-emerald-700 font-normal mt-1">
                        {t('Continuous Cloud Keys')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/**
               * QR Pairing Mode State
               * Guides admin with step-by-step connection instructions alongside live dynamic QR code.
               */}
              {isScanQR && (
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
                  {/**
                   * Pairing Steps & Instructions
                   * Detailed walk-through for linking WhatsApp business account on mobile.
                   */}
                  <div className="flex-1 space-y-4 max-w-xl">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                      {t('Link Business WhatsApp to UdharPay')}
                    </h3>

                    <p className="text-xs sm:text-sm text-gray-600 font-normal leading-relaxed">
                      {t('Scan this QR code from the official business phone to authorize UdharPay for sending automated customer invoices, recovery reminders, and payment receipts.')}
                    </p>

                    {/**
                     * Numbered Instruction Sequence
                     * Step-by-step guide for locating Linked Devices in WhatsApp mobile app.
                     */}
                    <ol className="space-y-3 pt-1">
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#093C5D] text-white text-xs font-semibold flex items-center justify-center shrink-0 shadow-none select-none">
                          1
                        </span>
                        <p className="text-xs sm:text-sm text-gray-700 font-normal leading-6">
                          {t('Open')} <span className="font-semibold text-gray-900">{t('WhatsApp')}</span> {t('on your official business phone.')}
                        </p>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#093C5D] text-white text-xs font-semibold flex items-center justify-center shrink-0 shadow-none select-none">
                          2
                        </span>
                        <p className="text-xs sm:text-sm text-gray-700 font-normal leading-6">
                          {t('Tap')} <span className="font-semibold text-gray-900">{t('Settings')}</span> {t('(or Menu ⋮ on Android) and select')} <span className="font-semibold text-gray-900">{t('Linked Devices')}</span>.
                        </p>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#093C5D] text-white text-xs font-semibold flex items-center justify-center shrink-0 shadow-none select-none">
                          3
                        </span>
                        <p className="text-xs sm:text-sm text-gray-700 font-normal leading-6">
                          {t('Tap')} <span className="font-semibold text-gray-900">{t('Link a Device')}</span> {t('and point your camera at this QR code.')}
                        </p>
                      </li>
                    </ol>

                    {/**
                     * Real-Time Scan Tip Callout
                     * Informs admin that socket pairs automatically without needing browser reload.
                     */}
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-900 font-medium">
                      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        {t('The QR code syncs in real-time. Once scanned, the system will instantly detect the connection without page reload.')}
                      </span>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => restartMutation.mutate()}
                        disabled={restartMutation.isPending}
                        className="cursor-pointer h-9 px-4 text-xs font-semibold text-white bg-[#093C5D] hover:bg-[#082a42] rounded-lg inline-flex items-center gap-1.5 transition-colors active:scale-95 shadow-none disabled:opacity-50"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${restartMutation.isPending ? 'animate-spin' : ''}`} />
                        <span>{t('Regenerate Fresh QR')}</span>
                      </button>
                    </div>
                  </div>

                  {/**
                   * Sharp QR Code Scanner Frame
                   * High-contrast pairing matrix with live pulse status indicator.
                   */}
                  <div className="shrink-0 flex flex-col items-center justify-center p-5 bg-gray-50/80 border border-gray-200 rounded-lg">
                    {statusData.qrDataUrl ? (
                      <div className="flex flex-col items-center">
                        <div className="p-2.5 bg-white rounded-lg border-2 border-[#093C5D] shadow-sm">
                          <img
                            src={statusData.qrDataUrl}
                            alt="WhatsApp Scan QR"
                            className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded"
                          />
                        </div>
                        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#093C5D]">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>{t('Live QR • Ready to Scan')}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-52 h-52 sm:w-60 sm:h-60 flex flex-col items-center justify-center gap-3 bg-white rounded-lg border border-dashed border-gray-300">
                        <SwirlingLoader className="w-7 h-7 text-[#093C5D]" />
                        <p className="text-xs text-gray-500 font-medium">{t('Generating QR Code...')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/**
               * Disconnected / Idle Fallback State
               * Empty-state placeholder prompting administrator to start the gateway service.
               */}
              {!isConnected && !isScanQR && (
                <div className="p-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center mx-auto border border-gray-200">
                    <MessageCircle className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h3 className="text-base font-semibold text-gray-900">
                      {t('WhatsApp Gateway Engine Offline')}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                      {t('The gateway is currently offline or waiting for initialization. Click below to start the Baileys engine and generate a pairing QR code.')}
                    </p>
                    {statusData?.disconnectReason && (
                      <div className="mt-3 inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium text-gray-700 font-sans shadow-none">
                        <span className="text-gray-400 font-normal">{t('Status')}:</span>
                        <span>{statusData.disconnectReason}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => restartMutation.mutate()}
                    disabled={restartMutation.isPending}
                    className="cursor-pointer h-9 px-4 text-xs font-semibold text-white bg-[#093C5D] hover:bg-[#082a42] rounded-lg inline-flex items-center gap-2 transition-all active:scale-95 shadow-none disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${restartMutation.isPending ? 'animate-spin' : ''}`} />
                    <span>{t('Initialize WhatsApp Gateway')}</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/**
       * Disconnect Device Confirmation Modal
       * Confirms session teardown and cloud credential deletion to avoid accidental disconnects.
       */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay"
            onClick={() => setShowDisconnectModal(false)}
          />

          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-sm p-6 text-center z-10 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center mb-4 border border-red-100">
              <LogOut className="w-6 h-6 ml-0.5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('Disconnect WhatsApp?')}</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed mb-6">
              {t('This will log out the linked WhatsApp business session and clear saved keys from the cloud. Automated reminders and bill slips will be paused until a new device is paired.')}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowDisconnectModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
              >
                {t('Cancel')}
              </button>
              <button
                type="button"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {logoutMutation.isPending ? t('Disconnecting...') : t('Yes, Disconnect')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppGatewaySettings;
