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
   * Matches Shopkeeper Dashboard / Customer Ledger KPI card hierarchy 1:1.
   */
  const variantStyles = {
    default: {
      card: 'border border-[#DCE1EA] hover:border-[#C2C9D6]',
      iconBg: 'bg-[#EEF0FB] text-[#4338CA] border border-[#DCE1EA]',
      titleColor: 'text-[#4E5668]',
      valueColor: 'text-[#191E2B]',
      subtextColor: 'text-[#757F94]',
    },
    primary: {
      card: 'border border-[#DCE1EA] hover:border-[#C2C9D6]',
      iconBg: 'bg-[#EEF0FB] text-[#4338CA] border border-[#D8DCF5]',
      titleColor: 'text-[#4E5668]',
      valueColor: 'text-[#191E2B]',
      subtextColor: 'text-[#757F94]',
    },
    success: {
      card: 'border-l-4 border-l-[#0D7A57] border-t border-t-[#DCE1EA] border-r border-r-[#DCE1EA] border-b border-b-[#DCE1EA] hover:border-r-[#C2C9D6] hover:border-t-[#C2C9D6] hover:border-b-[#DCE1EA]',
      iconBg: 'bg-[#ECFDF5] text-[#0D7A57] border border-[#A7F3D0]',
      titleColor: 'text-[#4E5668]',
      valueColor: 'text-[#0D7A57]',
      subtextColor: 'text-[#0D7A57]',
    },
    danger: {
      card: 'border-l-4 border-l-[#E11D48] border-t border-t-[#DCE1EA] border-r border-r-[#DCE1EA] border-b border-b-[#DCE1EA] hover:border-r-[#C2C9D6] hover:border-t-[#C2C9D6] hover:border-b-[#C2C9D6]',
      iconBg: 'bg-[#FFF1F2] text-[#B91C1C] border border-[#FECDD3]',
      titleColor: 'text-[#4E5668]',
      valueColor: 'text-[#B91C1C]',
      subtextColor: 'text-[#B91C1C]',
    },
    warning: {
      card: 'border-l-4 border-l-[#B45309] border-t border-t-[#DCE1EA] border-r border-r-[#DCE1EA] border-b border-b-[#DCE1EA] hover:border-r-[#C2C9D6] hover:border-t-[#C2C9D6] hover:border-b-[#C2C9D6]',
      iconBg: 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]',
      titleColor: 'text-[#4E5668]',
      valueColor: 'text-[#191E2B]',
      subtextColor: 'text-[#B45309]',
    },
  };

  const style = variantStyles[resolvedVariant] || variantStyles.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.2 }}
      className={`bg-[#FBFBFC] rounded-lg p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[7.5rem] sm:min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] transition-all duration-200 overflow-hidden cursor-default shadow-none ${style.card}`}
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
          className={`text-[10px] md:text-xs xl:text-sm mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate ${style.titleColor || 'text-[#4E5668]'}`}
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
