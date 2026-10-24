/**
 * Application Versioning Constant
 * Injected dynamically at build/runtime from client/package.json via vite.config.js
 */
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';
export const BUILD_DATE = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : 'Oct 2026';
export const APP_NAME = 'UdharPay';
export const APP_ENVIRONMENT = import.meta.env.MODE || 'production';
