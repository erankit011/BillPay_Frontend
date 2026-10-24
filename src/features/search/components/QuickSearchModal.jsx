import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Home,
  Users,
  FileText,
  Mic,
  BarChart2,
  Settings,
  Bell,
  Box,
  User,
  Gem,
  Activity,
  Store,
  CreditCard,
  X,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  Megaphone,
  LifeBuoy,
  Tag,
  ShieldCheck,
  Layers,
  Crown,
  HelpCircle
} from 'lucide-react';

const QuickSearchModal = ({ isOpen, onClose, isAdmin = false }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const itemRefs = useRef([]);

  // Define searchable pages based on user role (1:1 synced with MainLayout)
  const searchablePages = useMemo(() => {
    if (isAdmin) {
      return [
        { title: t('Dashboard'), desc: 'Platform overview, KPIs & live stats', path: '/admin/dashboard', icon: Home, category: 'Main' },
        { title: t('Stores'), desc: 'Browse and manage all registered merchant stores', path: '/admin/shops', icon: Store, category: 'Stores' },
        { title: t('Store Bills'), desc: 'Audit itemized bills, settlements & customer transactions', path: '/admin/bills', icon: FileText, category: 'Stores' },
        { title: t('Store Reports'), desc: 'Store sales turnover, GMV trends & credit recovery analytics', path: '/admin/reports', icon: BarChart2, category: 'Stores' },
        { title: t('Billing Receipts'), desc: 'Platform SaaS invoices, merchant transaction receipts & renewals', path: '/admin/subscriptions', icon: CreditCard, category: 'Subscriptions' },
        { title: t('Plans & Pricing'), desc: 'Configure tier quotas, features, prices & billing cycles', path: '/admin/plans', icon: Layers, category: 'Subscriptions' },
        { title: t('System Health'), desc: 'Server telemetry, memory, latency & database uptime', path: '/admin/health', icon: Activity, category: 'System' },
        { title: t('Broadcast Announcements'), desc: 'Publish banners, notices and alerts to storekeepers', path: '/admin/broadcasts', icon: Megaphone, category: 'Communication' },
        { title: t('Support Desk'), desc: 'Triage customer inquiries, complaints and helpdesk tickets', path: '/admin/support', icon: LifeBuoy, category: 'Support' },
        { title: t('Coupons & Promo Codes'), desc: 'Launch and configure discount campaigns for subscription plans', path: '/admin/coupons', icon: Tag, category: 'Billing' },
        { title: t('Security & Audit Logs'), desc: 'Immutable audit trail of admin actions and platform mutations', path: '/admin/audit-logs', icon: ShieldCheck, category: 'Security' },
        { title: t('Platform Settings'), desc: 'System configuration, operational switches and preferences', path: '/admin/settings', icon: Settings, category: 'Settings' },
        { title: t('Notifications'), desc: 'Real-time alerts, broadcast triggers & activity updates', path: '/notifications', icon: Bell, category: 'System' },
        { title: t('Account Profile'), desc: 'Manage your admin credentials, security & photo', path: '/profile', icon: User, category: 'Account' },
      ];
    }
    return [
      { title: t('Dashboard'), desc: 'Sales overview, udhar summary & daily analytics', path: '/dashboard', icon: Home, category: 'Main' },
      { title: t('Customers'), desc: 'Manage customer accounts, khata & udhar balance', path: '/customers', icon: Users, category: 'Customers' },
      { title: t('Products & Inventory'), desc: 'Item catalog, pricing, barcodes & stock management', path: '/products', icon: Box, category: 'Inventory' },
      { title: t('Bills & Invoices'), desc: 'Create bills, track payments and print/share receipts', path: '/bills', icon: FileText, category: 'Billing' },
      { title: t('Voice Billing'), desc: 'Fast hands-free invoice creation using voice recognition', path: '/voice', icon: Mic, category: 'Billing' },
      { title: t('Payment Reminders'), desc: 'Send automated WhatsApp and SMS udhar reminders', path: '/reminders', icon: Bell, category: 'Reminders' },
      { title: t('Business Reports'), desc: 'Financial audit, profit/loss, cashflow & sales export', path: '/reports', icon: BarChart2, category: 'Reports' },
      { title: t('Subscription Plans'), desc: 'Upgrade or manage active store membership & plan limits', path: '/subscription', icon: Gem, category: 'Subscription' },
      { title: t('Store Settings'), desc: 'Business profile, print templates & invoice preferences', path: '/settings', icon: Settings, category: 'Settings' },
      { title: t('Notifications'), desc: 'Payment alerts, customer notifications & system announcements', path: '/notifications', icon: Bell, category: 'System' },
      { title: t('Help & Support'), desc: 'Contact customer support and raise help tickets', path: '/contact-support', icon: HelpCircle, category: 'Support' },
      { title: t('Account Profile'), desc: 'Manage personal profile, login credentials & security', path: '/profile', icon: User, category: 'Account' },
    ];
  }, [isAdmin, t]);

  // Filter items matching query
  const filteredPages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return searchablePages;
    return searchablePages.filter((item) =>
      item.title.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      (item.category && item.category.toLowerCase().includes(q))
    );
  }, [searchQuery, searchablePages]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Focus input on open & reset state
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Smooth scroll selected item into view during keyboard navigation
  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  // Keyboard navigation inside search results
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredPages.length - 1 ? prev + 1 : 0));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredPages.length - 1));
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredPages[selectedIndex];
        if (selected) {
          onClose();
          navigate(selected.path);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredPages, selectedIndex, onClose, navigate]);

  // Prevent background page scrolling across all screen sizes
  useEffect(() => {
    if (!isOpen) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overscroll-contain">
      {/* Backdrop: standardized dark overlay without blur */}
      <div
        className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay overscroll-contain"
        onClick={onClose}
        aria-hidden="true"
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/* Modal Positioning */}
      <div
        className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-start sm:justify-center sm:pt-20 sm:px-4 z-50 pointer-events-none overscroll-contain"
        onWheel={(e) => {
          if (listRef.current && !listRef.current.contains(e.target)) {
            e.preventDefault();
          }
        }}
      >
        <div
          className="relative bg-white w-full sm:max-w-xl rounded-t-lg sm:rounded-lg border border-gray-200 animate-modal-content overflow-hidden pointer-events-auto shadow-none flex flex-col max-h-[85vh] sm:max-h-[75vh] overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-label={t('Quick Search')}
        >
          {/* Mobile Drag Handle */}
          <div className="sm:hidden flex justify-center pt-2.5 pb-1 flex-shrink-0 bg-gray-50/50">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Search Header */}
          <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-3 sm:py-3.5 border-b border-gray-100 bg-white flex-shrink-0">
            {/* Search Input Container - Matched with all pages UI */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isAdmin
                    ? t('Search by page, stores, bills, subscriptions, settings...')
                    : t('Search by page, customers, bills, products, settings...')
                }
                className="block w-full h-10 sm:h-12 pl-9 sm:pl-11 pr-10 sm:pr-11 bg-white border border-gray-300 rounded-lg text-[13px] sm:text-sm font-normal text-gray-900 placeholder-gray-400 placeholder:font-normal focus:outline-none focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200 shadow-none"
              />

              {/* Clear Query button inside search bar */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 sm:pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label={t('Clear search')}
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>

            {/* Right side controls: Close button (standard across all modals) */}
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px] border border-gray-200"
              title={t('Close')}
              aria-label={t('Close search modal')}
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Search Results List */}
          <div
            ref={listRef}
            className="overflow-y-auto overscroll-contain p-2 pr-2.5 pb-3 sm:pb-2.5 space-y-1 flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300"
          >
            {filteredPages.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 text-gray-400 mx-auto flex items-center justify-center mb-2.5">
                  <Search className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <p className="text-[13px] sm:text-sm font-medium text-gray-900 mb-1">
                  {t('No matching pages found')}
                </p>
                <p className="text-[11px] sm:text-xs text-gray-500 font-medium">
                  {t('Try searching for another keyword or check spelling')}
                </p>
              </div>
            ) : (
              filteredPages.map((item, index) => {
                const isSelected = index === selectedIndex;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.path}
                    ref={(el) => (itemRefs.current[index] = el)}
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(item.path);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between gap-2.5 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-lg border transition-colors duration-150 cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[#093C5D]/5 border-[#093C5D]/15'
                        : 'bg-transparent border-transparent hover:bg-gray-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <div
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-150 shadow-none ${
                          isSelected
                            ? 'bg-[#093C5D] text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-[13px] sm:text-sm font-medium transition-colors truncate ${
                            isSelected ? 'text-[#093C5D]' : 'text-gray-900'
                          }`}
                        >
                          {item.title}
                        </p>
                        <p className="text-[11px] sm:text-xs text-gray-500 font-medium truncate mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    {/* Category Chip - Centered flex container with proper height, padding and line-height */}
                    {item.category && (
                      <span
                        className={`inline-flex items-center justify-center text-center whitespace-nowrap text-[10px] font-semibold leading-none h-5 px-2.5 rounded border transition-colors shrink-0 shadow-none uppercase tracking-wide select-none ml-2 ${
                          isSelected
                            ? 'bg-white text-[#093C5D] border-[#093C5D]/25'
                            : 'bg-gray-100/80 text-gray-500 border-gray-200/80'
                        }`}
                      >
                        {item.category}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Modal Footer with quick instructions */}
          <div className="hidden sm:flex items-center px-4 py-2.5 border-t border-gray-100 bg-gray-50/80 text-[11px] font-medium text-gray-500">
            <div className="flex items-center gap-2">
              {/* Navigate Button Chip */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded text-gray-600 shadow-none h-7">
                <span className="inline-flex items-center gap-0.5 text-gray-500">
                  <ArrowUp className="w-3 h-3 text-gray-500 shrink-0" strokeWidth={2} />
                  <ArrowDown className="w-3 h-3 text-gray-500 shrink-0" strokeWidth={2} />
                </span>
                <span className="text-[11px] font-medium text-gray-600 leading-none">{t('Navigate')}</span>
              </div>

              {/* Select Button Chip */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded text-gray-600 shadow-none h-7">
                <CornerDownLeft className="w-3 h-3 text-gray-500 shrink-0" strokeWidth={2} />
                <span className="text-[11px] font-medium text-gray-600 leading-none">{t('Select')}</span>
              </div>

              {/* Close Button Chip (interactive) */}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 rounded text-gray-600 transition-colors cursor-pointer active:scale-95 shadow-none h-7"
                title={t('Close (Esc)')}
              >
                <span className="text-[10px] font-medium text-gray-500 leading-none">ESC</span>
                <span className="text-[11px] font-medium text-gray-600 leading-none">{t('Close')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(QuickSearchModal);
