/**
 * Admin KPI Metric Summary Card
 * Renders statistical indicators with left-border accents, category badges, and smooth entrance transitions.
 */

import React from 'react';
import { motion } from 'framer-motion';

/**
 * AdminStatCard Component
 */
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

  /**
   * Color Prop Normalization
   * Maps legacy color string names to modern design system variant identifiers.
   */
  let resolvedVariant = variant;
  if (variant === 'default' && color) {
    if (color === 'emerald' || color === 'green') resolvedVariant = 'success';
    else if (color === 'amber' || color === 'yellow') resolvedVariant = 'warning';
    else if (color === 'rose' || color === 'red') resolvedVariant = 'danger';
    else if (color === 'teal' || color === 'blue') resolvedVariant = 'primary';
  }

  /**
   * Card Accent Variant Tokens
   * Defines border, icon, and typography styles for each analytical metric type.
   */
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
      className={`bg-white rounded-lg p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[7.5rem] sm:min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] transition-all duration-200 overflow-hidden cursor-default shadow-none ${style.card}`}
    >
      {/**
       * Metric Icon Emblem
       * Rounded badge displaying contextual metric iconography.
       */}
      <div className="flex justify-between items-start gap-1">
        <div className={`w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg flex items-center justify-center ${style.iconBg}`}>
          {Icon && <Icon className="w-4 h-4 md:w-5 md:h-5" />}
        </div>
      </div>

      {/**
       * Quantitative Metric Presentation
       * Renders KPI label, primary value count, and dynamic trend subtext.
       */}
      <div className="mt-auto pt-2 min-w-0">
        <p
          className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate"
          title={title}
        >
          {title}
        </p>
        <p className={`text-base md:text-lg xl:text-2xl font-semibold truncate ${style.valueColor}`}>
          {value}
        </p>
        {displaySubtext && (
          <p
            className={`text-[10px] md:text-xs font-medium truncate mt-0.5 ${style.subtextColor}`}
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
