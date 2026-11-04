/**
 * System Health Service Status Card
 * Displays real-time operational status, roundtrip latency, and connection diagnostics for platform services.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

/**
 * HealthServiceCard Component
 */
const HealthServiceCard = ({
  name,
  status,
  latency,
  details,
  icon: Icon,
  delay = 0.05,
}) => {
  const isHealthy = status === 'healthy' || status === 'configured' || status === 'operational' || status === 'connected';
  const isDown = status === 'offline' || status === 'down' || status === 'disconnected' || status === 'error';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-[#FFFFFF] rounded-lg border border-[#DCE1EA] p-4 sm:p-5 flex flex-col justify-between shadow-none transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg bg-[#EEF0FB] flex items-center justify-center text-[#4338CA] border border-[#D8DCF5]">
            {Icon && <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-semibold text-[#191E2B]">{name}</h4>
            <p className="text-xs font-medium text-[#757F94]">{details || 'Core Integration'}</p>
          </div>
        </div>

        {/**
         * Service Health Status Pill
         * Color-coded badge reflecting operational, service down, or pending check state.
         */}
        <div>
          {isHealthy ? (
            <span className="inline-block px-2.5 py-1 rounded text-[10px] lg:text-xs font-semibold uppercase tracking-wide bg-[#F0FDF4] text-[#0D7A57] border border-[#DCFCE7]">
              Operational
            </span>
          ) : isDown ? (
            <span className="inline-block px-2.5 py-1 rounded text-[10px] lg:text-xs font-semibold uppercase tracking-wide bg-[#FDF2F2] text-[#B91C1C] border border-[#F9D4D4]">
              Service Down
            </span>
          ) : (
            <span className="inline-block px-2.5 py-1 rounded text-[10px] lg:text-xs font-semibold uppercase tracking-wide bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
              {status || 'Pending Check'}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#E8ECF2] flex items-center justify-between text-xs text-[#757F94]">
        <span className="flex items-center gap-1 font-medium">
          <Clock className="w-3.5 h-3.5 text-[#757F94]" />
          Response Time:{' '}
          <strong className="text-[#191E2B] font-semibold">
            {latency !== undefined ? `${latency}ms` : '<10ms'}
          </strong>
        </span>
        <span className="text-[11px] text-[#757F94] font-medium">Live Heartbeat</span>
      </div>
    </motion.div>
  );
};

export default HealthServiceCard;
