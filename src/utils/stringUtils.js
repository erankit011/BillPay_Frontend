/**
 * Central String Utilities for UdharPay Client
 * Follows DRY principles for string formatting, initials, and name handling.
 */

/**
 * Extract 1-2 uppercase letter initials from a person or business name
 * @param {string} name 
 * @param {string} fallback Default fallback letter if name is empty
 * @returns {string}
 */
export const getInitials = (name, fallback = 'U') => {
  if (!name || typeof name !== 'string') return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0] ? parts[0].slice(0, 2).toUpperCase() : fallback;
};
