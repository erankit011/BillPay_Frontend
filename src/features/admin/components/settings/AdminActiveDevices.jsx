import React, { useState, useEffect } from 'react';
import {
  Laptop,
  Monitor,
  Smartphone,
  Tablet,
  RefreshCw,
  LogOut,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import api from '../../../../api/axios';
import { logout } from '../../../../redux/slices/authSlice';
import toast from 'react-hot-toast';

const AdminActiveDevices = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [deviceActionLoadingId, setDeviceActionLoadingId] = useState(null);
  const [loggingOutAllOthers, setLoggingOutAllOthers] = useState(false);
  const [deviceToLogout, setDeviceToLogout] = useState(null);
  const [confirmLogoutOthersModal, setConfirmLogoutOthersModal] = useState(false);

  const fetchDevices = async () => {
    try {
      setDevicesLoading(true);
      const res = await api.get('/auth/devices');
      if (res.data?.success) {
        setDevices(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load active devices:', err);
      toast.error(t('Failed to load active devices.'));
    } finally {
      setDevicesLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const executeLogoutDevice = async (device) => {
    if (!device?._id) return;
    try {
      setDeviceActionLoadingId(device._id);
      const res = await api.delete(`/auth/devices/${device._id}`);
      if (res.data?.success) {
        if (res.data.data?.isCurrentDevice) {
          toast.success(t('Current device logged out. Redirecting...'));
          dispatch(logout());
          window.location.href = '/login';
          return;
        }
        toast.success(t('Device logged out successfully!'));
        setDevices((prev) => prev.filter((d) => d._id !== device._id));
        fetchDevices();
      }
    } catch (err) {
      console.error('Logout device error:', err);
      toast.error(err.response?.data?.message || t('Failed to logout device.'));
    } finally {
      setDeviceActionLoadingId(null);
      setDeviceToLogout(null);
    }
  };

  const executeLogoutAllOthers = async () => {
    try {
      setLoggingOutAllOthers(true);
      const res = await api.delete('/auth/devices/others');
      if (res.data?.success) {
        toast.success(t('All other devices have been logged out.'));
        setDevices((prev) => prev.filter((d) => d.isCurrentDevice));
        fetchDevices();
      }
    } catch (err) {
      console.error('Logout all others error:', err);
      toast.error(err.response?.data?.message || t('Failed to log out other devices.'));
    } finally {
      setLoggingOutAllOthers(false);
      setConfirmLogoutOthersModal(false);
    }
  };

  const formatDeviceTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 2) return t('Just now');
      if (diffMins < 60) return `${diffMins} ${t('mins ago')}`;
      if (diffHours < 24) return `${diffHours} ${t('hours ago')}`;
      if (diffDays < 7) return `${diffDays} ${t('days ago')}`;

      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (e) {
      return '';
    }
  };

  const formatDeviceDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (e) {
      return '-';
    }
  };

  const getDeviceIcon = (device) => {
    if (!device) return Monitor;
    const type = (device.deviceType || '').toLowerCase();
    const os = (device.os || '').toLowerCase();
    const raw = (device.device || '').toLowerCase();

    if (type === 'mobile' || os.includes('android') || os.includes('ios') || os.includes('iphone')) {
      return Smartphone;
    }
    if (type === 'tablet' || os.includes('ipad') || raw.includes('tablet')) {
      return Tablet;
    }
    if (type === 'desktop' || os.includes('windows') || os.includes('mac') || os.includes('linux')) {
      return Monitor;
    }
    return Laptop;
  };

  const getDeviceTitle = (device) => {
    if (!device) return t('Unknown Device');
    if (device.os && device.os !== 'Unknown OS') {
      if (device.deviceType === 'desktop') return `${device.os} PC`;
      if (device.deviceType === 'mobile') return device.os.includes('Phone') ? device.os : `${device.os} Phone`;
      if (device.deviceType === 'tablet') return `${device.os} Tablet`;
      return device.os;
    }
    const raw = device.device || '';
    if (raw.toLowerCase().includes('windows')) return 'Windows PC';
    if (raw.toLowerCase().includes('mac')) return 'Mac';
    if (raw.toLowerCase().includes('android')) return 'Android Device';
    if (raw.toLowerCase().includes('iphone')) return 'iPhone';
    if (raw.toLowerCase().includes('ipad')) return 'iPad';
    return raw || t('Active Device');
  };

  const otherDevicesCount = devices.filter((d) => !d.isCurrentDevice).length;

  return (
    <>
      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-none">
        {/* Section Header */}
        <div className="px-4 sm:px-5 md:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Laptop className="w-5 h-5 text-[#093C5D] shrink-0" />
              <h2 className="text-base md:text-lg font-semibold text-gray-900">
                {t('Active Devices & Sessions')}
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed font-normal">
              {t('Manage and review devices where your admin account is currently signed in.')}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={fetchDevices}
              disabled={devicesLoading}
              className="cursor-pointer !min-h-0 !min-w-0 h-[30px] sm:h-[34px] px-3.5 sm:px-4 rounded-lg border border-gray-200 bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50 text-xs font-semibold whitespace-nowrap transition-colors shrink-0 flex items-center justify-center gap-1.5 active:scale-95"
              title={t('Refresh devices')}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                  devicesLoading ? 'animate-spin text-[#093C5D]' : ''
                }`}
              />
              <span>{t('Refresh')}</span>
            </button>

            {otherDevicesCount > 0 && (
              <button
                type="button"
                onClick={() => setConfirmLogoutOthersModal(true)}
                disabled={loggingOutAllOthers}
                className="cursor-pointer !min-h-0 !min-w-0 h-[30px] sm:h-[34px] px-3.5 sm:px-4 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold whitespace-nowrap transition-colors shrink-0 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                title={t('Log Out All Other Devices')}
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>{t('Log Out All Other Devices')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Section Content */}
        <div className="px-4 sm:px-5 md:px-6 py-5 md:py-6">
          {devicesLoading && devices.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-500 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#093C5D]" />
              <p className="text-xs font-medium">{t('Loading')}...</p>
            </div>
          ) : devices.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              <Laptop className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-medium">{t('No active devices found')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {devices.map((device) => {
                const IconComponent = getDeviceIcon(device);
                return (
                  <div
                    key={device._id}
                    className={`p-3 sm:p-4 rounded-lg border transition-all ${
                      device.isCurrentDevice
                        ? 'border-[#093C5D]/30 bg-white'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    {/* Top Row: Device Icon + Title on Left, Badge/Action on Right */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            device.isCurrentDevice
                              ? 'bg-[#093C5D]/10 text-[#093C5D] border border-[#093C5D]/20'
                              : 'bg-gray-50 text-gray-600 border border-gray-200'
                          }`}
                        >
                          <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>

                        <h3
                          className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug whitespace-nowrap truncate"
                          title={getDeviceTitle(device)}
                        >
                          {getDeviceTitle(device)}
                        </h3>
                      </div>

                      {/* Right: Sleek Logout button for Other Device only */}
                      {!device.isCurrentDevice && (
                        <div className="shrink-0">
                          <button
                            type="button"
                            onClick={() => setDeviceToLogout(device)}
                            disabled={deviceActionLoadingId === device._id}
                            className="cursor-pointer inline-flex items-center justify-center gap-1 !min-h-0 !min-w-0 h-[22px] sm:h-6 px-2 sm:px-2.5 rounded-md text-[10px] sm:text-xs font-semibold text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors active:scale-95 disabled:opacity-50 whitespace-nowrap"
                          >
                            {deviceActionLoadingId === device._id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                            )}
                            <span>{t('Log Out')}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Middle Row: Full Browser & IP details on dedicated full-width line */}
                    <div className="text-[11px] sm:text-xs text-gray-500 font-medium mb-2.5 flex items-center gap-1.5 flex-wrap">
                      <span className="text-gray-700 font-medium">{device.browser || 'Browser'}</span>
                      <span className="text-gray-300">•</span>
                      <span>
                        IP: <span className="font-mono text-gray-700">{device.ip}</span>
                      </span>
                    </div>

                    {/* Bottom Info Grid: Clean balanced 2-column metadata sub-box */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 bg-gray-50/80 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg border border-gray-100">
                      <div className="min-w-0 text-left">
                        <span className="text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider block leading-tight">
                          {t('Last active')}
                        </span>
                        <div className="mt-1 flex items-center h-5 text-[11px] sm:text-xs md:text-[13px] truncate">
                          {device.isCurrentDevice ? (
                            <span className="text-emerald-700 font-semibold inline-flex items-center gap-1.5 leading-none">
                              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 aspect-square"></span>
                              <span className="leading-none">{t('Active Now')}</span>
                            </span>
                          ) : (
                            <span className="text-gray-800 font-medium leading-none truncate">
                              {formatDeviceTime(device.lastActive)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 text-right">
                        <span className="text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider block leading-tight">
                          {t('First signed in')}
                        </span>
                        <div className="mt-1 flex items-center justify-end h-5 text-[11px] sm:text-xs md:text-[13px] text-gray-800 font-medium truncate leading-none">
                          {formatDeviceDate(device.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Logout Single Device Confirmation Modal */}
      {deviceToLogout && (
        <div className="fixed inset-0 z-[100]">
          <div
            className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay"
            onClick={() => setDeviceToLogout(null)}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-scale-in pointer-events-auto border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 sm:p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 mx-auto flex items-center justify-center mb-4 border border-red-100">
                  <LogOut className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{t('Log Out Device')}</h3>
                <p className="text-gray-500 text-sm mb-3 font-medium">
                  {t('Are you sure you want to log out this device?')}
                </p>
                <div className="text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-2.5 mb-5 text-left">
                  <div className="truncate text-gray-900">{deviceToLogout.device}</div>
                  <div className="text-gray-500 font-normal mt-0.5">IP: {deviceToLogout.ip}</div>
                </div>
                <div className="flex gap-2 sm:gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => setDeviceToLogout(null)}
                    className="cursor-pointer flex-1 px-4 py-2 sm:px-5 sm:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm transition-colors active:scale-95"
                  >
                    {t('Cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={() => executeLogoutDevice(deviceToLogout)}
                    disabled={deviceActionLoadingId === deviceToLogout._id}
                    className="cursor-pointer flex-1 px-4 py-2 sm:px-5 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {deviceActionLoadingId === deviceToLogout._id && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t('Log Out')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout All Other Devices Confirmation Modal */}
      {confirmLogoutOthersModal && (
        <div className="fixed inset-0 z-[100]">
          <div
            className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay"
            onClick={() => setConfirmLogoutOthersModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-scale-in pointer-events-auto border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 sm:p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 mx-auto flex items-center justify-center mb-4 border border-red-100">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  {t('Log Out All Other Devices')}
                </h3>
                <p className="text-gray-500 text-sm mb-6 font-medium">
                  {t(
                    'Are you sure you want to log out all other active devices? Anyone else using your account will be required to log in again.'
                  )}
                </p>
                <div className="flex gap-2 sm:gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => setConfirmLogoutOthersModal(false)}
                    className="cursor-pointer flex-1 px-4 py-2 sm:px-5 sm:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm transition-colors active:scale-95"
                  >
                    {t('Cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={executeLogoutAllOthers}
                    disabled={loggingOutAllOthers}
                    className="cursor-pointer flex-1 px-4 py-2 sm:px-5 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {loggingOutAllOthers && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t('Log Out All Others')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminActiveDevices;
