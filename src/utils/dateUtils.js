/**
 * Central Date Utilities for UdharPay Client
 * Follows DRY principles for all date calculations, formatting, trial resolution, and plan expiration.
 */

/**
 * Format date as DD/MM/YYYY • hh:mm AM/PM
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const strHours = hours.toString().padStart(2, '0');
  
  return `${day}/${month}/${year} • ${strHours}:${minutes} ${ampm}`;
};

/**
 * Format date as DD/MM/YYYY
 */
export const formatDateOnly = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Format date as short human-readable string: e.g. "12 Oct 2026"
 */
export const formatShortDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/**
 * Check if a date string or Date object has already passed (is in the past)
 */
export const isDateExpired = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;
  return date.getTime() < Date.now();
};

/**
 * Resolve trial end date for a user/shop object based on currentPeriodEnd or createdAt + fallback days
 */
export const getTrialEndDate = (userOrShop, fallbackDays = 7) => {
  if (!userOrShop) return new Date();
  if (userOrShop.currentPeriodEnd) {
    const end = new Date(userOrShop.currentPeriodEnd);
    if (!isNaN(end.getTime())) return end;
  }
  const base = new Date(userOrShop.createdAt || Date.now());
  return new Date(base.getTime() + fallbackDays * 24 * 60 * 60 * 1000);
};

/**
 * Check if a user/shop's free trial has expired
 */
export const isTrialExpired = (userOrShop, fallbackDays = 7) => {
  if (!userOrShop) return true;
  const trialEnd = getTrialEndDate(userOrShop, fallbackDays);
  return Date.now() > trialEnd.getTime();
};

/**
 * Check if a paid subscription plan has expired
 */
export const isSubscriptionExpired = (userOrShop) => {
  if (!userOrShop) return false;
  const isPaid = userOrShop.subscriptionPlan && userOrShop.subscriptionPlan !== 'FREE';
  if (!isPaid) return false;
  if (!userOrShop.currentPeriodEnd) return false;
  const end = new Date(userOrShop.currentPeriodEnd);
  return !isNaN(end.getTime()) && Date.now() > end.getTime();
};

/**
 * Calculate extended expiry for plan changes / overrides
 * If existing expiry is active in the future, extends from that; else extends from now.
 */
export const calculateExtendedExpiry = (currentExpiry, daysToAdd) => {
  if (!daysToAdd || daysToAdd <= 0) return null;
  const now = Date.now();
  const validCurrent = currentExpiry ? new Date(currentExpiry).getTime() : 0;
  const baseTime = (!isNaN(validCurrent) && validCurrent > now) ? validCurrent : now;
  return new Date(baseTime + daysToAdd * 24 * 60 * 60 * 1000);
};

/**
 * Format relative time (e.g. "2 hours ago", "Just now")
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 60) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDateOnly(dateString);
};

/**
 * Calculate remaining days until target date (0 if expired)
 */
export const getDaysRemaining = (expiryDate) => {
  if (!expiryDate) return 0;
  const target = new Date(expiryDate).getTime();
  if (isNaN(target)) return 0;
  const diff = target - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
};

