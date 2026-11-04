/**
 * Administrative Force Remote Logout Confirmation Modal
 * Terminates all active JWT credentials and WebSocket sessions for a merchant across devices.
 * Uses universal ConfirmModal component for consistent styling and scroll management.
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import ConfirmModal from '../../../components/common/ConfirmModal';

const ForceLogoutModal = ({
  isOpen,
  onClose,
  shop,
  isLoading,
  onConfirm
}) => {
  if (!isOpen || !shop) return null;

  const shopName = shop.businessName || shop.name || 'this shop';
  const ownerName = shop.name && shop.businessName && shop.name !== shop.businessName ? shop.name : null;

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={() => onConfirm(shop._id || shop)}
      title="Force Logout Shopkeeper"
      message={`Are you sure you want to forcibly log out "${shopName}"${ownerName ? ` (${ownerName})` : ''}? All active sessions across all devices will be terminated immediately.`}
      confirmText="Yes, Force Logout"
      cancelText="Cancel"
      isLoading={isLoading}
      variant="logout"
    >
      <div className="bg-red-50/70 border border-red-100 rounded-lg p-2.5 text-xs text-red-700 text-left space-y-0.5">
        <div className="flex items-center gap-1.5 font-medium text-red-800">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Security Notice</span>
        </div>
        <p className="text-red-600/90 text-[11px] leading-normal font-normal pl-5">
          The merchant will be required to re-authenticate with their credentials to access their store again.
        </p>
      </div>
    </ConfirmModal>
  );
};

export default React.memo(ForceLogoutModal);
