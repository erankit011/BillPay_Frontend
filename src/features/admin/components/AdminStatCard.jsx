import React from 'react';
import { motion } from 'framer-motion';

const AdminStatCard = ({
  title,
  value,
  subtext,
  subtitle,
  icon: Icon,
  variant = 'default',
  color,
  delay = 0.05,
}) => {
  const displaySubtext = subtext || subtitle;

  // Map legacy color prop to variant if variant not explicitly set
  let resolvedVariant = variant;
  if (variant === 'default' && color) {
    if (color === 'emerald' || color === 'green') resolvedVariant = 'success';
    else if (color === 'amber' || color === 'yellow') resolvedVariant = 'warning';
    else if (color === 'rose' || color === 'red') resolvedVariant = 'danger';
    else if (color === 'teal' || color === 'blue') resolvedVariant = 'primary';
  }

  // Exact Admin Dashboard card styling (icon box + colored left border)
  const variantStyles = {
    default: {
      card: 'border border-gray-200 hover:border-gray-300',
      iconBg: 'bg-[#F5F5F5] text-[#093C5D] border border-gray-200',
      titleColor: 'text-gray-500',
      valueColor: 'text-gray-900',
      subtextColor: 'text-gray-500',
    },
    primary: {
      card: 'border-l-4 border-l-[#093C5D] border-t border-t-gray-200 border-r border-r-gray-200 border-b border-b-gray-200 hover:border-r-gray-300 hover:border-t-gray-300 hover:border-b-gray-300',
      iconBg: 'bg-[#F5F5F5] text-[#093C5D] border border-gray-200',
      titleColor: 'text-gray-500',
      valueColor: 'text-gray-900',
      subtextColor: 'text-gray-500',
    },
    success: {
      card: 'border-l-4 border-l-green-700 border-t border-t-gray-200 border-r border-r-gray-200 border-b border-b-gray-200 hover:border-r-gray-300 hover:border-t-gray-300 hover:border-b-gray-300',
      iconBg: 'bg-green-50 text-green-700 border border-green-100',
      titleColor: 'text-gray-500',
      valueColor: 'text-green-700',
      subtextColor: 'text-green-700',
    },
    danger: {
      card: 'border-l-4 border-l-red-700 border-t border-t-gray-200 border-r border-r-gray-200 border-b border-b-gray-200 hover:border-r-gray-300 hover:border-t-gray-300 hover:border-b-gray-300',
      iconBg: 'bg-red-50 text-red-700 border border-red-100',
      titleColor: 'text-gray-500',
      valueColor: 'text-red-700',
      subtextColor: 'text-red-700',
    },
    warning: {
      card: 'border border-gray-200 hover:border-gray-300',
      iconBg: 'bg-amber-50 text-amber-700 border border-amber-100',
      titleColor: 'text-gray-500',
      valueColor: 'text-gray-900',
      subtextColor: 'text-amber-700',
    },
  };

  const style = variantStyles[resolvedVariant] || variantStyles.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.2 }}
      className={`bg-white rounded-lg p-3.5 sm:p-4 md:p-4.5 flex flex-col justify-between min-h-[125px] sm:min-h-[135px] transition-all duration-200 overflow-hidden cursor-default shadow-none ${style.card}`}
    >
      {/* Top Left Icon Box */}
      <div className="flex justify-between items-start gap-1">
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${style.iconBg}`}>
          {Icon && <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
        </div>
      </div>

      {/* Metric Content */}
      <div className="mt-auto pt-2.5 sm:pt-3 min-w-0">
        <p
          className={`text-[10px] sm:text-[11px] md:text-xs font-semibold uppercase tracking-wider mb-0.5 sm:mb-1 truncate ${style.titleColor}`}
          title={title}
        >
          {title}
        </p>
        <p className={`text-xl sm:text-2xl font-bold tracking-tight truncate ${style.valueColor}`}>
          {value}
        </p>
        {displaySubtext && (
          <p
            className={`text-[10px] sm:text-xs font-medium truncate mt-0.5 sm:mt-1 ${style.subtextColor}`}
            title={displaySubtext}
          >
            {displaySubtext}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default AdminStatCard;
