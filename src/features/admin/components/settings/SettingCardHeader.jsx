/**
 * Settings Card Section Header
 * Standardized header component displaying section icon, title, description, and status tag.
 */

import React from 'react';

/**
 * SettingCardHeader Component
 */
const SettingCardHeader = ({
  icon: Icon,
  title,
  subtitle,
  badge,
  iconBg = 'bg-[#EEF0FB]',
  iconColor = 'text-[#4338CA]',
}) => {
  return (
    <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#E8ECF2]">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className={`w-8 h-8 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-semibold text-[#191E2B]">{title}</h3>
            {badge && (
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-[#757F94] font-medium">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

export default SettingCardHeader;
