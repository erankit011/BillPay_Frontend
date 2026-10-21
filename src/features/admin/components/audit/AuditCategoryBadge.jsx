import React from 'react';
import { Store, Sliders, Megaphone, Tag, Headphones, Shield, FileText } from 'lucide-react';

const CATEGORY_CONFIG = {
  MERCHANT_MGMT: {
    label: 'Merchant Mgmt',
    bg: 'bg-blue-50 text-[#093C5D] border-blue-200',
    icon: Store,
  },
  SYSTEM_SETTINGS: {
    label: 'Platform Settings',
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Sliders,
  },
  BROADCASTS: {
    label: 'Broadcasts',
    bg: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: Megaphone,
  },
  COUPONS: {
    label: 'Coupons & Promos',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Tag,
  },
  SUPPORT: {
    label: 'Helpdesk & Support',
    bg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    icon: Headphones,
  },
  SECURITY: {
    label: 'Platform Security',
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: Shield,
  },
  GENERAL: {
    label: 'General System',
    bg: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: FileText,
  },
};

const AuditCategoryBadge = ({ category, size = 'sm' }) => {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.GENERAL;
  const Icon = config.icon;

  const sizeClasses = size === 'xs'
    ? 'px-2 py-0.5 text-[11px] gap-1'
    : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded border ${config.bg} ${sizeClasses}`}
    >
      <Icon className={size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {config.label}
    </span>
  );
};

export default AuditCategoryBadge;
