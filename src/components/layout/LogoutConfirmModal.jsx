/**
 * Logout Confirmation Modal Dialog
 * Thin wrapper over universal ConfirmModal enforcing uniform UI/UX and scroll management.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmModal from '../common/ConfirmModal';

const LogoutConfirmModal = ({ isOpen, onClose, onConfirm, isLoading = false }) => {
  const { t } = useTranslation();

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={t('Logout')}
      message={t('Are you sure you want to log out of your session?')}
      confirmText={t('Yes, Logout')}
      cancelText={t('Cancel')}
      variant="logout"
      isLoading={isLoading}
    />
  );
};

export default React.memo(LogoutConfirmModal);
