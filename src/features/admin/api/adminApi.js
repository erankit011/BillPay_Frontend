import api from '../../../api/axios';

/**
 * Admin Feature API Client
 * Clean, feature-modular service abstraction for UdharPay Admin Panel
 */

// 1. Overview & Executive Platform Analytics
export const getAdminOverview = async () => {
  const res = await api.get('/admin/overview');
  return res.data?.data;
};

// 2. Shops & Merchants Management
export const getAdminShops = async (params = {}) => {
  const res = await api.get('/admin/shops', { params });
  return res.data?.data;
};

export const getShopDetails = async (shopId) => {
  const res = await api.get(`/admin/shops/${shopId}`);
  return res.data?.data;
};

export const toggleShopSuspension = async (shopId, { isSuspended, reason }) => {
  const res = await api.patch(`/admin/shops/${shopId}/suspend`, { isSuspended, reason });
  return res.data;
};

export const overrideShopPlan = async (shopId, planData) => {
  const res = await api.patch(`/admin/shops/${shopId}/override-plan`, planData);
  return res.data;
};

export const forceLogoutShop = async (shopId) => {
  const res = await api.post(`/admin/shops/${shopId}/force-logout`);
  return res.data;
};

// 3. Platform Customer Bills Audit & Ledger
export const getAdminBills = async (params = {}) => {
  const res = await api.get('/admin/bills', { params });
  return res.data?.data;
};

// 5. Platform Financial Reports & Analytics
export const getAdminReports = async () => {
  const res = await api.get('/admin/reports');
  return res.data?.data;
};

// 6. Platform Subscriptions & SaaS Invoices
export const getAdminSubscriptions = async (params = {}) => {
  const res = await api.get('/admin/subscriptions', { params });
  return res.data?.data;
};

// 7. Infrastructure & External Services Health
export const getAdminSystemHealth = async () => {
  const res = await api.get('/admin/health');
  return res.data?.data;
};
