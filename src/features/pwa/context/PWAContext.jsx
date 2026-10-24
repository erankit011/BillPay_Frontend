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

        // 1. Periodic background check: Run every 60 minutes when user is online
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

  // 2. Window Focus Check: When user returns to tab/app, check for new release
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

  // 3. User action: Execute instant zero-data-loss application update
  const updateApp = async () => {
    setIsUpdating(true);
    try {
      // Safety Fallback: In dev simulation mode or if SW controller doesn't trigger reload within 1200ms, force reload
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

  // 4. User action: Dismiss update banner
  const dismissUpdate = () => {
    setNeedRefresh(false);
  };

  // 5. User action: Manual 'Check for updates' trigger (Hybrid Dual Detection)
  const checkForUpdates = async (forceSimulate = false) => {
    if (isCheckingRef.current) return;

    // Developer preview / simulation trigger (e.g. Shift + Click in dev mode)
    if (forceSimulate) {
      setAvailableVersion('1.0.1');
      setNeedRefresh(true);
      toast.success(t('Update prompt triggered (Test Mode)'), { id: 'pwa-update-toast' });
      return;
    }

    if (!navigator.onLine) {
      toast.error(t('You are offline. Please check your internet connection.'), { id: 'pwa-update-toast' });
      return;
    }

    isCheckingRef.current = true;
    setIsChecking(true);

    try {
      // Step A: Check Backend Version via Health API
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
        // Ignore API health error if offline or unreachable
      }

      // Step B: Trigger Service Worker Registration Update
      if (swRegistration) {
        try {
          await swRegistration.update();
        } catch (swErr) {
          console.warn('SW update check failed:', swErr);
        }
      }

      // Natural delay for realistic UI feedback
      setTimeout(() => {
        setIsChecking(false);
        isCheckingRef.current = false;

        // If backend version is newer, trigger refresh prompt
        if (serverHasNewVersion && serverVer) {
          setAvailableVersion(serverVer);
          setNeedRefresh(true);
          return;
        }

        // If SW detected a waiting worker or needRefresh is true
        if (swRegistration?.waiting || needRefresh) {
          setNeedRefresh(true);
          return;
        }

        // If already latest version (de-duplicated toast ID prevents stacking)
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
