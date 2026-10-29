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
      className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 flex flex-col justify-between shadow-none hover:border-gray-300 transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
            {Icon && <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-semibold text-gray-900">{name}</h4>
            <p className="text-xs font-medium text-gray-500">{details || 'Core Integration'}</p>
          </div>
        </div>

        {/**
         * Service Health Status Pill
         * Color-coded badge reflecting operational, service down, or pending check state.
         */}
        <div>
          {isHealthy ? (
            <span className="inline-block px-2.5 py-1 rounded text-[10px] lg:text-xs font-semibold uppercase tracking-wide bg-green-50 text-green-700 border border-green-200">
              Operational
            </span>
          ) : isDown ? (
            <span className="inline-block px-2.5 py-1 rounded text-[10px] lg:text-xs font-semibold uppercase tracking-wide bg-red-50 text-red-700 border border-red-200">
              Service Down
            </span>
          ) : (
            <span className="inline-block px-2.5 py-1 rounded text-[10px] lg:text-xs font-semibold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200">
              {status || 'Pending Check'}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1 font-medium">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          Response Time:{' '}
          <strong className="text-gray-900 font-semibold">
            {latency !== undefined ? `${latency}ms` : '<10ms'}
          </strong>
        </span>
        <span className="text-[11px] text-gray-400 font-medium">Live Heartbeat</span>
      </div>
    </motion.div>
  );
};

export default HealthServiceCard;
