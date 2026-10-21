import React, { useState } from 'react';
import { Lock, Key, ShieldCheck, Eye, EyeOff, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../../../api/axios';
import toast from 'react-hot-toast';

const AdminSecuritySettings = () => {
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

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      toast.success(res.data?.message || 'Admin password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRevokeOtherSessions = async () => {
    if (!window.confirm('Are you sure you want to log out all other active admin devices?')) {
      return;
    }

    setIsRevokingSessions(true);
    try {
      const res = await api.delete('/auth/devices/others');
      toast.success(res.data?.message || 'All other active sessions revoked successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revoke other sessions');
    } finally {
      setIsRevokingSessions(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Change Admin Password Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6 shadow-none">
        <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-[#093C5D]/10 text-[#093C5D] flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900">Change Admin Master Password</h3>
            <p className="text-xs text-gray-500 font-medium">Update credentials used to access the administrative control panel</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Current Admin Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
                placeholder="Enter current password"
                className="w-full h-10 px-3.5 pr-10 text-sm bg-gray-50/70 border border-gray-200 rounded-lg focus:outline-none focus:border-[#093C5D] focus:bg-white transition-all text-gray-900 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  placeholder="Min 6 characters"
                  className="w-full h-10 px-3.5 pr-10 text-sm bg-gray-50/70 border border-gray-200 rounded-lg focus:outline-none focus:border-[#093C5D] focus:bg-white transition-all text-gray-900 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
                placeholder="Re-enter new password"
                className="w-full h-10 px-3.5 text-sm bg-gray-50/70 border border-gray-200 rounded-lg focus:outline-none focus:border-[#093C5D] focus:bg-white transition-all text-gray-900 font-medium"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-start">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="cursor-pointer h-10 px-5 rounded-lg bg-[#093C5D] hover:bg-[#072d46] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-all active:scale-95 shadow-none disabled:opacity-50"
            >
              {isChangingPassword ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Active Session & Device Security Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6 shadow-none">
        <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900">Session & Device Security</h3>
            <p className="text-xs text-gray-500 font-medium">Protect administrative privileges from unauthorized concurrent access</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-gray-50/80 border border-gray-200/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-gray-900">Current Active Session Verified</span>
            </div>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              If you suspect any unauthorized login or worked from a public terminal, revoke other sessions immediately.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRevokeOtherSessions}
            disabled={isRevokingSessions}
            className="cursor-pointer h-9 px-4 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-none whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            {isRevokingSessions ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <span>Logout All Other Devices</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSecuritySettings;
