import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
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
    </div>
  );
};

export default AdminSecuritySettings;
