/**
 * Authentication Layout Shell
 * Split-screen 2/3 marketing presentation on desktop and 1/3 focused form wrapper
 * for login, registration, OTP verification, and password recovery.
 */

import { useTranslation } from 'react-i18next';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Wallet, 
  MessageCircle, 
  Box, 
  ShieldCheck
} from 'lucide-react';

/**
 * AuthLayout Component
 */
const AuthLayout = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const features = [
    {
      icon: Wallet,
      title: t('Digital Khata Ledger'),
      desc: t('Real-time customer credit & debit tracking with zero calculation errors.'),
    },
    {
      icon: MessageCircle,
      title: t('WhatsApp Invoices & Reminders'),
      desc: t('Share digital bills and collect pending udhar with automated payment links.'),
    },
    {
      icon: Box,
      title: t('Fast Billing & Inventory'),
      desc: t('Quick item search, daily stock management, and instant invoice creation.'),
    },
    {
      icon: ShieldCheck,
      title: t('100% Safe Cloud Sync'),
      desc: t('Bank-grade encrypted records, safe forever even if your device is changed.'),
    },
  ];

  return (
    <div className="min-h-screen bg-white flex">
      {/**
       * Desktop Branding Panel (2/3 Width)
       * Enterprise presentation matching UdharPay Dashboard, Products & Customers design DNA
       */}
      <div className="hidden lg:flex lg:w-2/3 bg-[#093C5D] text-white px-8 xl:px-12 py-7 xl:py-9 flex-col justify-between sticky top-0 h-screen overflow-hidden">
        
        {/** Top Header: Brand Logo & Category Pill */}
        <div className="flex items-center justify-between gap-4 shrink-0">
          <div className="cursor-pointer inline-flex items-center" onClick={() => navigate('/')}>
            <span className="text-[26px] xl:text-[28px] font-semibold tracking-tight text-white">
              UdharPay<span className="inline-block w-2 h-2 rounded-full bg-[#2ECC71] ml-1 mb-1 align-baseline"></span>
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-medium text-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2ECC71] shrink-0"></span>
            <span>{t("India's Smart Khata & Billing App")}</span>
          </div>
        </div>

        {/** Middle Section: Hero Copy, 4 Core App Feature Cards & Live Stats */}
        <div className="my-auto py-2 xl:py-4 max-w-3xl">
          <div className="max-w-2xl mb-5">
            <h1 className="text-3xl xl:text-4xl font-semibold tracking-tight text-white leading-tight mb-2">
              {t("Manage your shop's")} <br />
              <span>{t("Khata & Billing")}</span> {t("digitally.")}
            </h1>
            <p className="text-xs xl:text-sm text-slate-300 font-medium leading-relaxed max-w-xl">
              {t("Built for Indian shopkeepers. Eliminate paper bahi-khata, record customer transactions, share WhatsApp bills, and recover udhar 3x faster.")}
            </p>
          </div>

          {/** 4 Feature Cards (2x2 Grid) */}
          <div className="grid grid-cols-2 gap-3 xl:gap-3.5 max-w-3xl">
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div 
                  key={idx}
                  className="h-full bg-[#062438]/85 hover:bg-[#062438] border border-white/10 hover:border-[#2ECC71]/40 transition-colors duration-200 rounded-xl p-3.5 xl:p-4 text-left flex items-start gap-3 xl:gap-3.5"
                >
                  <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-lg bg-[#2ECC71]/10 border border-[#2ECC71]/20 text-[#2ECC71] flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4.5 h-4.5 xl:w-5 xl:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs xl:text-sm font-semibold text-white tracking-tight leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-[11px] xl:text-xs text-slate-300 font-medium mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/** Live Stats directly under cards with intentional spacing */}
          <div className="grid grid-cols-3 gap-4 pt-4 mt-4 border-t border-white/10 max-w-3xl">
            <div>
              <p className="text-lg xl:text-xl font-semibold text-white tracking-tight">10,000+</p>
              <p className="text-[11px] xl:text-xs font-medium text-slate-300 mt-0.5">{t('Active Retailers')}</p>
            </div>
            <div>
              <p className="text-lg xl:text-xl font-semibold text-[#2ECC71] tracking-tight">₹15 Cr+</p>
              <p className="text-[11px] xl:text-xs font-medium text-slate-300 mt-0.5">{t('Udhar Recovered')}</p>
            </div>
            <div>
              <p className="text-lg xl:text-xl font-semibold text-white tracking-tight">100%</p>
              <p className="text-[11px] xl:text-xs font-medium text-slate-300 mt-0.5">{t('Safe & Encrypted')}</p>
            </div>
          </div>
        </div>

        {/** Bottom Footer: Anchored with Full-Width Divider */}
        <div className="shrink-0 w-full pt-3 border-t border-white/10 flex items-center justify-between text-xs font-medium text-slate-400">
          <p>© {new Date().getFullYear()} UdharPay. {t('All rights reserved.')}</p>
          <p className="flex items-center gap-1.5 text-slate-300 shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#2ECC71]" />
            <span>{t('100% Safe & Secure Khata')}</span>
          </p>
        </div>
      </div>

      {/**
       * Credential Form Content Area (1/3 Width)
       * Clean focused container for Auth Pages
       */}
      <div className="w-full lg:w-1/3 flex flex-col relative bg-white min-h-[100dvh]">
        <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-6 xl:px-8 2xl:px-12 py-8 sm:py-12">

          {/**
           * Mobile Viewport Header (< lg)
           * Visible on mobile and tablet where sidebar is hidden
           */}
          <div className="lg:hidden w-full max-w-[400px] text-center mb-8 animate-fade-in">
            <div className="cursor-pointer inline-block" onClick={() => navigate('/')}>
              <span className="text-3xl font-bold tracking-tight text-[#093C5D] select-none">
                UdharPay<span className="inline-block w-2.5 h-2.5 rounded-full bg-[#2ECC71] ml-1 mb-1 align-baseline"></span>
              </span>
            </div>
            <p className="text-gray-500 font-medium text-sm mt-1.5">{t("Manage your shop's")} {t("Khata digitally.")}</p>
          </div>

          <div className="w-full max-w-[400px]">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
