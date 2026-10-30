import React, { useState, useMemo } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  FileText,
  Mic,
  BarChart2,
  Settings,
  Bell,
  Box,
  HelpCircle,
  Gem,
  Activity,
  Store,
  CreditCard,
  ChevronDown,
  X,
  Megaphone,
  LifeBuoy,
  Tag,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Main application sidebar for Desktop (collapsible rail) and Mobile (offcanvas drawer)
 */
const Sidebar = ({
  sidebarCollapsed,
  mobileDrawerOpen,
  setMobileDrawerOpen,
  isAdmin,
}) => {
  const location = useLocation();
  const { t } = useTranslation();

  /**
   * Navigation Accordion State Flags
   * Tracks open/closed toggle states for submenus
   */
  const isStoresActive = useMemo(() => {
    return (
      location.pathname === '/admin/shops' ||
      location.pathname === '/admin/bills' ||
      location.pathname === '/admin/reports'
    );
  }, [location.pathname]);

  const [storesOpen, setStoresOpen] = useState(true);

  const isSubscriptionsActive = useMemo(() => {
    return (
      location.pathname === '/admin/subscriptions' ||
      location.pathname === '/admin/subscriptions/plans' ||
      location.pathname === '/admin/plans'
    );
  }, [location.pathname]);

  const [subscriptionsOpen, setSubscriptionsOpen] = useState(true);

  const isShopkeeperBillingActive = useMemo(() => {
    return (
      location.pathname === '/bills' ||
      location.pathname === '/voice' ||
      location.pathname === '/reminders'
    );
  }, [location.pathname]);

  const [shopkeeperBillingOpen, setShopkeeperBillingOpen] = useState(true);

  /**
   * Mobile Drawer Auto-Close Handler
   * Collapses mobile navigation flyout upon route selection
   */
  const handleNavClick = () => {
    if (mobileDrawerOpen) {
      setMobileDrawerOpen(false);
    }
  };

  /**
   * Reusable Navigation Content (Used by both Desktop and Mobile Drawer)
   */
  const renderNavLinks = (isMobile = false) => {
    const isCollapsed = !isMobile && sidebarCollapsed;

    if (isAdmin) {
      return (
        <>
          {/**
           * Admin Dashboard Route
           * Overview analytics and key store metrics
           */}
          <NavLink
            to="/admin/dashboard"
            onClick={handleNavClick}
            title={isCollapsed ? 'Dashboard' : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                isActive
                  ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                  : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
              } ${isCollapsed ? 'justify-center px-2' : ''}`
            }
          >
            <Home className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Dashboard</span>}
          </NavLink>

          {/**
           * Store Management Submenu
           * Links to merchants, store bills, and business reports
           */}
          <div className="pt-0.5">
            {isCollapsed ? (
              <NavLink
                to="/admin/shops"
                title="Stores"
                className={({ isActive }) =>
                  `flex items-center justify-center px-2 py-2.5 rounded-lg border text-sm transition-all ${
                    isStoresActive
                      ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                      : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
                  }`
                }
              >
                <Store className="w-4 h-4 shrink-0" />
              </NavLink>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => setStoresOpen((prev) => !prev)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-all cursor-pointer ${
                    isStoresActive
                      ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                      : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Store className="w-4 h-4 shrink-0" />
                    <span>Stores</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                      storesOpen ? 'rotate-180' : ''
                    } ${isStoresActive ? 'text-[#332F2A]' : 'text-[#B2ABA0]'}`}
                  />
                </button>

                {storesOpen && (
                  <div className="mt-1 space-y-1 relative pl-7 pr-1">
                    <div className="absolute left-[22px] top-1.5 bottom-2 w-px bg-[#CFCAC2]" />

                    <NavLink
                      to="/admin/shops"
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-1.5 rounded-lg border text-[13px] transition-colors ${
                          isActive
                            ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                            : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
                        }`
                      }
                    >
                      Store
                    </NavLink>

                    <NavLink
                      to="/admin/bills"
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-1.5 rounded-lg border text-[13px] transition-colors ${
                          isActive
                            ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                            : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
                        }`
                      }
                    >
                      Store Bill
                    </NavLink>

                    <NavLink
                      to="/admin/reports"
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-1.5 rounded-lg border text-[13px] transition-colors ${
                          isActive
                            ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                            : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
                        }`
                      }
                    >
                      Reports
                    </NavLink>
                  </div>
                )}
              </div>
            )}
          </div>

          {/**
           * Subscriptions & Pricing Submenu
           * Revenue receipts and dynamic SaaS plan tiers
           */}
          <div className="pt-0.5">
            {isCollapsed ? (
              <NavLink
                to="/admin/subscriptions"
                title="Subscriptions"
                className={({ isActive }) =>
                  `flex items-center justify-center px-2 py-2.5 rounded-lg border text-sm transition-all ${
                    isSubscriptionsActive
                      ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                      : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
                  }`
                }
              >
                <CreditCard className="w-4 h-4 shrink-0" />
              </NavLink>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => setSubscriptionsOpen((prev) => !prev)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-all cursor-pointer ${
                    isSubscriptionsActive
                      ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                      : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 shrink-0" />
                    <span>Subscriptions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                      LIVE
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                        subscriptionsOpen ? 'rotate-180' : ''
                      } ${isSubscriptionsActive ? 'text-[#332F2A]' : 'text-[#B2ABA0]'}`}
                    />
                  </div>
                </button>

                {subscriptionsOpen && (
                  <div className="mt-1 space-y-1 relative pl-7 pr-1">
                    <div className="absolute left-[22px] top-1.5 bottom-2 w-px bg-[#CFCAC2]" />

                    <NavLink
                      to="/admin/subscriptions"
                      end
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-1.5 rounded-lg border text-[13px] transition-colors ${
                          isActive
                            ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                            : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
                        }`
                      }
                    >
                      Billing Receipts
                    </NavLink>

                    <NavLink
                      to="/admin/plans"
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-1.5 rounded-lg border text-[13px] transition-colors ${
                          isActive
                            ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                            : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
                        }`
                      }
                    >
                      Plans & Pricing
                    </NavLink>
                  </div>
                )}
              </div>
            )}
          </div>

          {/**
           * System Health Monitor
           * Real-time server telemetry and service heartbeat
           */}
          <NavLink
            to="/admin/health"
            onClick={handleNavClick}
            title={isCollapsed ? 'System Health' : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                isActive
                  ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                  : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
              } ${isCollapsed ? 'justify-center px-2' : ''}`
            }
          >
            <Activity className="w-4 h-4 shrink-0" />
            {!isCollapsed && (
              <>
                <span>System Health</span>
                <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                  LIVE
                </span>
              </>
            )}
          </NavLink>

          {/**
           * Global Broadcasts Manager
           * Platform-wide announcements and notice banners
           */}
          <NavLink
            to="/admin/broadcasts"
            onClick={handleNavClick}
            title={isCollapsed ? 'Broadcasts' : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                isActive
                  ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                  : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
              } ${isCollapsed ? 'justify-center px-2' : ''}`
            }
          >
            <Megaphone className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Broadcasts</span>}
          </NavLink>

          {/**
           * Help Desk Support Portal
           * Merchant assistance tickets and inquiries
           */}
          <NavLink
            to="/admin/support"
            onClick={handleNavClick}
            title={isCollapsed ? 'Support Desk' : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                isActive
                  ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                  : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
              } ${isCollapsed ? 'justify-center px-2' : ''}`
            }
          >
            <LifeBuoy className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Support Desk</span>}
          </NavLink>

          {/**
           * Promotional Coupons Manager
           * Discount codes and redemption statistics
           */}
          <NavLink
            to="/admin/coupons"
            onClick={handleNavClick}
            title={isCollapsed ? 'Coupons' : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                isActive
                  ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                  : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
              } ${isCollapsed ? 'justify-center px-2' : ''}`
            }
          >
            <Tag className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Coupons</span>}
          </NavLink>

          {/**
           * Security Audit Logs
           * Administrative activity trail and access history
           */}
          <NavLink
            to="/admin/audit-logs"
            onClick={handleNavClick}
            title={isCollapsed ? 'Audit Logs' : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                isActive
                  ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                  : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
              } ${isCollapsed ? 'justify-center px-2' : ''}`
            }
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Audit Logs</span>}
          </NavLink>

          {/**
           * Platform Security & Settings
           * Global configurations and operational toggles
           */}
          <NavLink
            to="/admin/settings"
            onClick={handleNavClick}
            title={isCollapsed ? 'Settings' : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                isActive
                  ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                  : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
              } ${isCollapsed ? 'justify-center px-2' : ''}`
            }
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Settings</span>}
          </NavLink>
        </>
      );
    }

    /**
     * Merchant Navigation Section
     * Core shopkeeper tools for daily business operations
     */
    return (
      <>
        {/**
         * Merchant Dashboard Route
         * Daily sales overview and quick action shortcuts
         */}
        <NavLink
          to="/dashboard"
          onClick={handleNavClick}
          title={isCollapsed ? t('Dashboard') : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
              isActive
                ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
            } ${isCollapsed ? 'justify-center px-2' : ''}`
          }
        >
          <Home className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>{t('Dashboard')}</span>}
        </NavLink>

        {/**
         * Customer Directory Route
         * Customer balances and khata ledger records
         */}
        <NavLink
          to="/customers"
          onClick={handleNavClick}
          title={isCollapsed ? t('Customers') : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
              isActive
                ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
            } ${isCollapsed ? 'justify-center px-2' : ''}`
          }
        >
          <Users className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>{t('Customers')}</span>}
        </NavLink>

        {/**
         * Product Inventory Route
         * Catalog management, stock tracking, and pricing
         */}
        <NavLink
          to="/products"
          onClick={handleNavClick}
          title={isCollapsed ? t('Products') : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
              isActive
                ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
            } ${isCollapsed ? 'justify-center px-2' : ''}`
          }
        >
          <Box className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>{t('Products')}</span>}
        </NavLink>

        {/**
         * Billing Operations Submenu
         * Invoicing, voice-assisted entry, and payment reminders
         */}
        <div className="pt-0.5">
          {isCollapsed ? (
            <NavLink
              to="/bills"
              title={t('Billing')}
              className={({ isActive }) =>
                `flex items-center justify-center px-2 py-2.5 rounded-lg border text-sm transition-all ${
                  isShopkeeperBillingActive
                    ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                    : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
                }`
              }
            >
              <FileText className="w-4 h-4 shrink-0" />
            </NavLink>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setShopkeeperBillingOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-all cursor-pointer ${
                  isShopkeeperBillingActive
                    ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                    : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>{t('Billing')}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                    shopkeeperBillingOpen ? 'rotate-180' : ''
                  } ${isShopkeeperBillingActive ? 'text-[#332F2A]' : 'text-[#B2ABA0]'}`}
                />
              </button>

              {shopkeeperBillingOpen && (
                <div className="mt-1 space-y-1 relative pl-7 pr-1">
                  <div className="absolute left-[22px] top-1.5 bottom-2 w-px bg-[#CFCAC2]" />

                  <NavLink
                    to="/bills"
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-1.5 rounded-lg border text-[13px] transition-colors ${
                        isActive
                          ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                          : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
                      }`
                    }
                  >
                    {t('Bills & Invoices')}
                  </NavLink>

                  <NavLink
                    to="/voice"
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-1.5 rounded-lg border text-[13px] transition-colors ${
                        isActive
                          ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                          : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
                      }`
                    }
                  >
                    {t('Voice Entry')}
                  </NavLink>

                  <NavLink
                    to="/reminders"
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-1.5 rounded-lg border text-[13px] transition-colors ${
                        isActive
                          ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                          : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
                      }`
                    }
                  >
                    {t('Reminders')}
                  </NavLink>
                </div>
              )}
            </div>
          )}
        </div>

        {/**
         * Financial Reports Route
         * Sales trends, tax summaries, and profit analytics
         */}
        <NavLink
          to="/reports"
          onClick={handleNavClick}
          title={isCollapsed ? t('Reports') : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
              isActive
                ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
            } ${isCollapsed ? 'justify-center px-2' : ''}`
          }
        >
          <BarChart2 className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>{t('Reports')}</span>}
        </NavLink>

        {/**
         * Subscription Plan Route
         * Account tier benefits and billing management
         */}
        <NavLink
          to="/subscription"
          onClick={handleNavClick}
          title={isCollapsed ? t('Subscription') : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
              isActive
                ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
            } ${isCollapsed ? 'justify-center px-2' : ''}`
          }
        >
          <Gem className="w-4 h-4 shrink-0" />
          {!isCollapsed && (
            <>
              <span>{t('Subscription')}</span>
              <span className="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Pro
              </span>
            </>
          )}
        </NavLink>

        {/**
         * Store Settings Route
         * Shop profile, invoice customization, and security
         */}
        <NavLink
          to="/settings"
          onClick={handleNavClick}
          title={isCollapsed ? t('Settings') : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
              isActive
                ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
            } ${isCollapsed ? 'justify-center px-2' : ''}`
          }
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>{t('Settings')}</span>}
        </NavLink>
      </>
    );
  };

  return (
    <>
      {/**
       * Desktop Sidebar Rail (<1024px: hidden, >=1024px: flex)
       * Fixed vertical navigation pane supporting expanded and icon-only rail modes
       */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 z-40 bg-white border-r border-[#CFCAC2]/70 transition-all duration-200 ease-in-out ${
          sidebarCollapsed ? 'w-[72px]' : 'w-64'
        }`}
        style={{ top: 'var(--top-announcement-height, 0px)', bottom: 0 }}
      >
        {/**
         * Sidebar Brand Identity Header
         * Brand monogram and title badge
         */}
        <div className="h-14 flex items-center px-4 border-b border-[#CFCAC2]/70 shrink-0">
          <Link
            to={isAdmin ? '/admin/dashboard' : '/dashboard'}
            className={`flex items-center gap-3 transition-opacity ${
              sidebarCollapsed ? 'mx-auto justify-center' : ''
            }`}
            title="UdharPay"
          >
            <div className="w-8 h-8 rounded-lg bg-[#332F2A] text-white flex items-center justify-center font-medium text-base shadow-sm shrink-0">
              U
            </div>

            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="font-semibold text-[#332F2A] text-[16px] tracking-tight truncate">
                  UdharPay
                </span>
                {isAdmin ? (
                  <span className="text-[10px] font-medium tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-[#E6E3DD] text-[#332F2A] shrink-0">
                    ADMIN
                  </span>
                ) : (
                  <span className="inline-block w-2 h-2 rounded-full bg-[#10B981] ml-0.5" />
                )}
              </div>
            )}
          </Link>
        </div>

        {/**
         * Primary Navigation Scroll Container
         * Renders categorized links with scroll virtualization
         */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {renderNavLinks(false)}
        </nav>

        {/**
         * Sidebar Bottom Actions
         * Customer help and support trigger
         */}
        <div className="p-3 border-t border-[#CFCAC2]/70 shrink-0">
          {!isAdmin && (
            <Link
              to="/contact-support"
              title={sidebarCollapsed ? 'Help & Support' : undefined}
              className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg border transition-colors ${
                location.pathname === '/contact-support'
                  ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                  : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
              } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>{t('Help')}</span>}
            </Link>
          )}
        </div>
      </aside>

      {/**
       * Mobile / Tablet Offcanvas Drawer (<1024px)
       * Responsive sliding navigation panel with modal overlay
       */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/**
           * Offcanvas Backdrop Overlay
           * Semi-transparent dark blur background capturing dismiss clicks
           */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/**
           * Sliding Drawer Container
           * Slide-in navigation container with close button
           */}
          <aside className="fixed inset-y-0 left-0 w-72 bg-white border-r border-[#CFCAC2]/70 flex flex-col z-50 transition-transform">
            <div className="h-14 flex items-center justify-between px-5 border-b border-[#CFCAC2]/70 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#332F2A] text-white flex items-center justify-center font-medium text-base shadow-sm">
                  U
                </div>
                <span className="font-semibold text-[#332F2A] text-[16px]">
                  UdharPay {isAdmin && <span className="text-[11px] font-medium text-[#332F2A] bg-[#E6E3DD] px-1.5 py-0.5 rounded">ADMIN</span>}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 text-[#857E71] hover:text-[#332F2A] hover:bg-[#F8F6F3] rounded-lg transition-colors cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
              {renderNavLinks(true)}

              {!isAdmin && (
                <div className="pt-2 border-t border-[#CFCAC2]/70 mt-2">
                  <Link
                    to="/contact-support"
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                      location.pathname === '/contact-support'
                        ? 'bg-[#E6E3DD] text-[#332F2A] border-[#B2ABA0]/40 font-semibold'
                        : 'text-[#585248] hover:text-[#332F2A] hover:bg-[#F8F6F3] border-transparent font-medium'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4 shrink-0" />
                    <span>{t('Help & Support')}</span>
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default React.memo(Sidebar);

