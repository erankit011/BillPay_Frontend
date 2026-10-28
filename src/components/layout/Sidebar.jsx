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

  // Accordion states
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

  // Close drawer helper
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
          {/* 1. Admin Dashboard */}
          <NavLink
            to="/admin/dashboard"
            onClick={handleNavClick}
            title={isCollapsed ? 'Dashboard' : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                isActive
                  ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
              } ${isCollapsed ? 'justify-center px-2' : ''}`
            }
          >
            <Home className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Dashboard</span>}
          </NavLink>

          {/* 2. Stores Accordion */}
          <div className="pt-0.5">
            {isCollapsed ? (
              <NavLink
                to="/admin/shops"
                title="Stores"
                className={({ isActive }) =>
                  `flex items-center justify-center px-2 py-2.5 rounded-lg border text-sm transition-all ${
                    isStoresActive
                      ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
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
                      ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Store className="w-4 h-4 shrink-0" />
                    <span>Stores</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                      storesOpen ? 'rotate-180' : ''
                    } ${isStoresActive ? 'text-[#093C5D]' : 'text-gray-400'}`}
                  />
                </button>

                {storesOpen && (
                  <div className="mt-1 space-y-1 relative pl-7 pr-1">
                    <div className="absolute left-[22px] top-1.5 bottom-2 w-px bg-gray-200/80" />

                    <NavLink
                      to="/admin/shops"
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-1.5 rounded-lg border text-[13px] transition-colors ${
                          isActive
                            ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
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
                            ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
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
                            ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
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

          {/* 3. Subscriptions Accordion */}
          <div className="pt-0.5">
            {isCollapsed ? (
              <NavLink
                to="/admin/subscriptions"
                title="Subscriptions"
                className={({ isActive }) =>
                  `flex items-center justify-center px-2 py-2.5 rounded-lg border text-sm transition-all ${
                    isSubscriptionsActive
                      ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
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
                      ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
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
                      } ${isSubscriptionsActive ? 'text-[#093C5D]' : 'text-gray-400'}`}
                    />
                  </div>
                </button>

                {subscriptionsOpen && (
                  <div className="mt-1 space-y-1 relative pl-7 pr-1">
                    <div className="absolute left-[22px] top-1.5 bottom-2 w-px bg-gray-200/80" />

                    <NavLink
                      to="/admin/subscriptions"
                      end
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-1.5 rounded-lg border text-[13px] transition-colors ${
                          isActive
                            ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
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
                            ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
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

          {/* 4. System Health (LIVE badge) */}
          <NavLink
            to="/admin/health"
            onClick={handleNavClick}
            title={isCollapsed ? 'System Health' : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                isActive
                  ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
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

          {/* 5. Broadcasts */}
          <NavLink
            to="/admin/broadcasts"
            onClick={handleNavClick}
            title={isCollapsed ? 'Broadcasts' : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                isActive
                  ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
              } ${isCollapsed ? 'justify-center px-2' : ''}`
            }
          >
            <Megaphone className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Broadcasts</span>}
          </NavLink>

          {/* 6. Support Desk */}
          <NavLink
            to="/admin/support"
            onClick={handleNavClick}
            title={isCollapsed ? 'Support Desk' : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                isActive
                  ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
              } ${isCollapsed ? 'justify-center px-2' : ''}`
            }
          >
            <LifeBuoy className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Support Desk</span>}
          </NavLink>

          {/* 7. Coupons */}
          <NavLink
            to="/admin/coupons"
            onClick={handleNavClick}
            title={isCollapsed ? 'Coupons' : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                isActive
                  ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
              } ${isCollapsed ? 'justify-center px-2' : ''}`
            }
          >
            <Tag className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Coupons</span>}
          </NavLink>

          {/* 8. Audit Logs */}
          <NavLink
            to="/admin/audit-logs"
            onClick={handleNavClick}
            title={isCollapsed ? 'Audit Logs' : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                isActive
                  ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
              } ${isCollapsed ? 'justify-center px-2' : ''}`
            }
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Audit Logs</span>}
          </NavLink>

          {/* 9. Admin Settings */}
          <NavLink
            to="/admin/settings"
            onClick={handleNavClick}
            title={isCollapsed ? 'Settings' : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                isActive
                  ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
              } ${isCollapsed ? 'justify-center px-2' : ''}`
            }
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Settings</span>}
          </NavLink>
        </>
      );
    }

    // Shopkeeper Navigation
    return (
      <>
        {/* 1. Dashboard */}
        <NavLink
          to="/dashboard"
          onClick={handleNavClick}
          title={isCollapsed ? t('Dashboard') : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
              isActive
                ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
            } ${isCollapsed ? 'justify-center px-2' : ''}`
          }
        >
          <Home className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>{t('Dashboard')}</span>}
        </NavLink>

        {/* 2. Customers */}
        <NavLink
          to="/customers"
          onClick={handleNavClick}
          title={isCollapsed ? t('Customers') : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
              isActive
                ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
            } ${isCollapsed ? 'justify-center px-2' : ''}`
          }
        >
          <Users className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>{t('Customers')}</span>}
        </NavLink>

        {/* 3. Products */}
        <NavLink
          to="/products"
          onClick={handleNavClick}
          title={isCollapsed ? t('Products') : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
              isActive
                ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
            } ${isCollapsed ? 'justify-center px-2' : ''}`
          }
        >
          <Box className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>{t('Products')}</span>}
        </NavLink>

        {/* 4. Billing Accordion */}
        <div className="pt-0.5">
          {isCollapsed ? (
            <NavLink
              to="/bills"
              title={t('Billing')}
              className={({ isActive }) =>
                `flex items-center justify-center px-2 py-2.5 rounded-lg border text-sm transition-all ${
                  isShopkeeperBillingActive
                    ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
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
                    ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>{t('Billing')}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                    shopkeeperBillingOpen ? 'rotate-180' : ''
                  } ${isShopkeeperBillingActive ? 'text-[#093C5D]' : 'text-gray-400'}`}
                />
              </button>

              {shopkeeperBillingOpen && (
                <div className="mt-1 space-y-1 relative pl-7 pr-1">
                  <div className="absolute left-[22px] top-1.5 bottom-2 w-px bg-gray-200/80" />

                  <NavLink
                    to="/bills"
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-1.5 rounded-lg border text-[13px] transition-colors ${
                        isActive
                          ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
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
                          ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
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
                          ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
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

        {/* 5. Reports */}
        <NavLink
          to="/reports"
          onClick={handleNavClick}
          title={isCollapsed ? t('Reports') : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
              isActive
                ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
            } ${isCollapsed ? 'justify-center px-2' : ''}`
          }
        >
          <BarChart2 className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>{t('Reports')}</span>}
        </NavLink>

        {/* 6. Subscription (Pro badge) */}
        <NavLink
          to="/subscription"
          onClick={handleNavClick}
          title={isCollapsed ? t('Subscription') : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
              isActive
                ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
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

        {/* 7. Settings */}
        <NavLink
          to="/settings"
          onClick={handleNavClick}
          title={isCollapsed ? t('Settings') : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
              isActive
                ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
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
      {/* =========================================================================
          DESKTOP SIDEBAR RAIL
      ========================================================================= */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 z-40 bg-white border-r border-gray-100 transition-all duration-200 ease-in-out ${
          sidebarCollapsed ? 'w-[72px]' : 'w-64'
        }`}
        style={{ top: 'var(--top-announcement-height, 0px)', bottom: 0 }}
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center px-4 border-b border-gray-100 shrink-0">
          <Link
            to={isAdmin ? '/admin/dashboard' : '/dashboard'}
            className={`flex items-center gap-3 transition-opacity ${
              sidebarCollapsed ? 'mx-auto justify-center' : ''
            }`}
            title="UdharPay"
          >
            <div className="w-8 h-8 rounded-lg bg-[#093C5D] text-white flex items-center justify-center font-medium text-base shadow-sm shrink-0">
              U
            </div>

            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="font-medium text-gray-900 text-[16px] tracking-tight truncate">
                  UdharPay
                </span>
                {isAdmin ? (
                  <span className="text-[10px] font-medium tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-[#093C5D]/10 text-[#093C5D] shrink-0">
                    ADMIN
                  </span>
                ) : (
                  <span className="inline-block w-2 h-2 rounded-full bg-[#10B981] ml-0.5" />
                )}
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {renderNavLinks(false)}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-gray-100 shrink-0">
          {!isAdmin && (
            <Link
              to="/contact-support"
              title={sidebarCollapsed ? 'Help & Support' : undefined}
              className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg border transition-colors ${
                location.pathname === '/contact-support'
                  ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
              } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>{t('Help')}</span>}
            </Link>
          )}
        </div>
      </aside>

      {/* =========================================================================
          MOBILE / TABLET OFFCANVAS DRAWER (< 1024px)
      ========================================================================= */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <aside className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl flex flex-col z-50 transition-transform">
            <div className="h-14 flex items-center justify-between px-5 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#093C5D] text-white flex items-center justify-center font-medium text-base shadow-sm">
                  U
                </div>
                <span className="font-medium text-gray-900 text-[16px]">
                  UdharPay {isAdmin && <span className="text-[11px] font-medium text-[#093C5D] bg-[#093C5D]/10 px-1.5 py-0.5 rounded">ADMIN</span>}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
              {renderNavLinks(true)}

              {!isAdmin && (
                <div className="pt-2 border-t border-gray-100 mt-2">
                  <Link
                    to="/contact-support"
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                      location.pathname === '/contact-support'
                        ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
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

