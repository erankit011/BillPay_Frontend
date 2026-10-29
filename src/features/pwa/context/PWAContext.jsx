import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { APP_VERSION } from '../../../constants/appVersion';
import api from '../../../api/axios';

export const PWAContext = createContext(null);

/**
 * PWAProvider - Enterprise PWA Lifecycle & In-App Auto-Update Manager
 * Provides hybrid dual-detection (Service Worker byte-check + Backend Health API version sync),
 * periodic background polling, focus-based update check, and manual update trigger.
 */
export const PWAProvider = ({ children }) => {
  const { t } = useTranslation();
  const [swRegistration, setSwRegistration] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [availableVersion, setAvailableVersion] = useState(null);
  const isCheckingRef = useRef(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegistered(registration) {
      if (registration) {
        setSwRegistration(registration);

        /**
         * Periodic Background Polling
         * Queries for service worker updates at hourly intervals when online.
         */
        const intervalId = setInterval(() => {
          if (navigator.onLine && registration) {
            registration.update().catch(() => {});
          }
        }, 60 * 60 * 1000);

        return () => clearInterval(intervalId);
      }
    },
    onRegisterError(error) {
      console.warn('PWA ServiceWorker registration failed:', error);
    },
  });

  /**
   * Visibility Change Detection
   * Triggers service worker registration update when browser window regains focus.
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        if (swRegistration) {
          swRegistration.update().catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [swRegistration]);

  /**
   * Application Update Execution
   * Activates waiting service worker and smoothly refreshes the document context.
   */
  const updateApp = async () => {
    setIsUpdating(true);
    try {
      /**
       * Reload Safety Fallback
       * Ensures reload occurs within 1200ms if service worker controller fails to fire.
       */
      setTimeout(() => {
        window.location.reload();
      }, 1200);

      if (typeof updateServiceWorker === 'function') {
        await updateServiceWorker(true);
      }
    } catch (err) {
      console.error('PWA update failed:', err);
      window.location.reload();
    }
  };

  /**
   * Update Prompt Dismissal
   * Clears active refresh requirement state without reloading the document.
   */
  const dismissUpdate = () => {
    setNeedRefresh(false);
  };

  /**
   * Hybrid Dual Update Verification
   * Manually checks server health API version and initiates service worker byte checks.
   */
  const checkForUpdates = async () => {
    if (isCheckingRef.current) return;

    if (!navigator.onLine) {
      toast.error(t('You are offline. Please check your internet connection.'), { id: 'pwa-update-toast' });
      return;
    }

    isCheckingRef.current = true;
    setIsChecking(true);

    try {
      /**
       * Backend Health Endpoint Audit
       * Verifies live server application version against client bundle build.
       */
      let serverHasNewVersion = false;
      let serverVer = null;
      try {
        const healthRes = await api.get('/health');
        if (healthRes?.data?.version) {
          serverVer = healthRes.data.version;
          if (serverVer !== APP_VERSION) {
            serverHasNewVersion = true;
          }
        }
      } catch (e) {
        /**
         * Graceful Health Check Bypass
         * Silently handles network failures when backend health endpoint is unreachable.
         */
      }

      /**
       * Service Worker Update Trigger
       * Initiates registration cycle to detect fresh service worker scripts.
       */
      if (swRegistration) {
        try {
          await swRegistration.update();
        } catch (swErr) {
          console.warn('SW update check failed:', swErr);
        }
      }

      /**
       * UI Synchronization Delay
       * Provides brief feedback period for realistic loading state presentation.
       */
      setTimeout(() => {
        setIsChecking(false);
        isCheckingRef.current = false;

        /**
         * Server Version Mismatch Handler
         * Prompts client refresh when remote API advertises newer release build.
         */
        if (serverHasNewVersion && serverVer) {
          setAvailableVersion(serverVer);
          setNeedRefresh(true);
          return;
        }

        /**
         * Waiting Worker Verification
         * Activates prompt if a worker script is parsed and waiting in lifecycle.
         */
        if (swRegistration?.waiting || needRefresh) {
          setNeedRefresh(true);
          return;
        }

        /**
         * Up-to-Date Status Feedback
         * Displays confirmation toast with fixed identifier preventing duplicate popups.
         */
        toast.success(t('You are using the latest version of UdharPay'), { id: 'pwa-update-toast' });
      }, 700);
    } catch (err) {
      setIsChecking(false);
      isCheckingRef.current = false;
      toast.error(t('Unable to check for updates right now'), { id: 'pwa-update-toast' });
    }
  };

  return (
    <PWAContext.Provider
      value={{
        needRefresh,
        offlineReady,
        isChecking,
        isUpdating,
        availableVersion,
        updateApp,
        dismissUpdate,
        checkForUpdates,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
};

export const usePWAUpdate = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWAUpdate must be used within a PWAProvider');
  }
  return context;
};

export default PWAContext;
