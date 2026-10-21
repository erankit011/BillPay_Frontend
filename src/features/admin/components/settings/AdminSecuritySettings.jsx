import React, { useState } from 'react';
import { Lock, Eye, EyeOff, LogOut, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../../../api/axios';
import toast from 'react-hot-toast';

const AdminSecuritySettings = () => {
  const { t } = useTranslation();

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isRevokingSessions, setIsRevokingSessions] = useState(false);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const isFormValid =
    passwordData.currentPassword &&
    passwordData.newPassword.length >= 6 &&
    passwordData.newPassword !== passwordData.currentPassword &&
    passwordData.confirmPassword &&
    passwordData.newPassword === passwordData.confirmPassword;

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword.length < 6) {
      toast.error(t('New password must be at least 6 characters long'));
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t('New password and confirm password do not match'));
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      toast.success(res.data?.message || t('Admin password updated successfully'));
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || t('Failed to update password'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRevokeOtherSessions = async () => {
    if (!window.confirm(t('Are you sure you want to log out all other active admin devices?'))) {
      return;
    }

    setIsRevokingSessions(true);
    try {
      const res = await api.delete('/auth/devices/others');
      toast.success(res.data?.message || t('All other active sessions revoked successfully'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('Failed to revoke other sessions'));
    } finally {
      setIsRevokingSessions(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* ── Change Admin Password Card ── */}
      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-none">
        <div className="px-4 sm:px-5 md:px-6 py-4 border-b border-gray-100">
          <h2 className="text-base md:text-lg font-semibold text-gray-900">{t('Change Admin Password')}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{t('Update credentials used to access the administrative control panel')}</p>
        </div>

        <div className="px-4 sm:px-5 md:px-6 py-5 md:py-6">
          <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                {t('Current Password')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  placeholder={t('Enter current password')}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                {t('New Password')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  placeholder={t('Min 6 characters')}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                {t('Confirm New Password')} <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
                placeholder={t('Confirm new password')}
                className={`block w-full rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none ${
                  passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : passwordData.confirmPassword &&
                      passwordData.newPassword === passwordData.confirmPassword &&
                      passwordData.newPassword.length >= 6
                    ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                    : 'border-gray-300 focus:ring-[#093C5D] focus:border-[#093C5D]'
                }`}
              />
              {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium">
                  {t('Passwords do not match')}
                </p>
              )}
              {passwordData.confirmPassword &&
                passwordData.newPassword === passwordData.confirmPassword &&
                passwordData.newPassword.length >= 6 && (
                  <p className="text-green-600 text-[11px] sm:text-xs mt-1.5 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t('Passwords match')}</span>
                  </p>
                )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isChangingPassword || !isFormValid}
                className={`cursor-pointer bg-[#093C5D] text-white px-8 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm w-full sm:w-auto active:scale-[0.98] transition-colors duration-300 ${
                  isChangingPassword || !isFormValid ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#072d46]'
                }`}
              >
                <Lock className="w-4 h-4 shrink-0" />
                <span className="tracking-wide">
                  {isChangingPassword ? t('Updating...') : t('Update Password')}
                </span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ── Active Sessions & Device Security Card ── */}
      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-none">
        <div className="px-4 sm:px-5 md:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base md:text-lg font-semibold text-gray-900">{t('Active Sessions & Device Security')}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{t('Manage and review active administrative login sessions')}</p>
          </div>
        </div>

        <div className="px-4 sm:px-5 md:px-6 py-5 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-gray-50/70 border border-gray-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-gray-900">{t('Current Active Session Verified')}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed">
                {t('If you worked from a public browser or shared computer, log out all other devices immediately.')}
              </p>
            </div>

            <button
              type="button"
              onClick={handleRevokeOtherSessions}
              disabled={isRevokingSessions}
              className="cursor-pointer bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-none whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>{isRevokingSessions ? t('Logging out...') : t('Logout Other Devices')}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminSecuritySettings;
