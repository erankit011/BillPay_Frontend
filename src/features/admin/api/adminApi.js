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

export const sendDirectShopNotice = async (shopId, noticeData) => {
  const res = await api.post(`/admin/shops/${shopId}/send-notice`, noticeData);
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

// 8. Platform System & Admin Settings
export const getPlatformSettings = async () => {
  const res = await api.get('/admin/settings');
  return res.data?.data;
};

export const updatePlatformSettings = async (settingsData) => {
  const res = await api.put('/admin/settings', settingsData);
  return res.data;
};

// 9. Platform Announcements & Broadcasts
export const getAdminBroadcasts = async (params = {}) => {
  const res = await api.get('/admin/broadcasts', { params });
  return res.data?.data;
};

export const createAdminBroadcast = async (data) => {
  const res = await api.post('/admin/broadcasts', data);
  return res.data;
};

export const updateAdminBroadcast = async (id, data) => {
  const res = await api.put(`/admin/broadcasts/${id}`, data);
  return res.data;
};

export const deleteAdminBroadcast = async (id) => {
  const res = await api.delete(`/admin/broadcasts/${id}`);
  return res.data;
};

export const getActiveBroadcasts = async () => {
  const res = await api.get('/admin/broadcasts/active');
  return res.data?.data || [];
};

// 10. Platform Support & Helpdesk Desk
export const getAdminTickets = async (params = {}) => {
  const res = await api.get('/admin/support/tickets', { params });
  return res.data?.data;
};

export const getAdminTicketStats = async () => {
  const res = await api.get('/admin/support/tickets/stats');
  return res.data?.data;
};

export const getAdminTicketDetails = async (id) => {
  const res = await api.get(`/admin/support/tickets/${id}`);
  return res.data?.data;
};

export const updateAdminTicket = async (id, data) => {
  const res = await api.patch(`/admin/support/tickets/${id}`, data);
  return res.data;
};

export const deleteAdminTicket = async (id) => {
  const res = await api.delete(`/admin/support/tickets/${id}`);
  return res.data;
};

export const submitPublicSupportTicket = async (data) => {
  const res = await api.post('/support', data);
  return res.data;
};

export const getPublicContactInfo = async () => {
  const res = await api.get('/support/contact-info');
  return res.data?.data;
};

// 11. SaaS Coupons & Promo Codes Management
export const getAdminCoupons = async (params = {}) => {
  const res = await api.get('/admin/coupons', { params });
  return res.data?.data;
};

export const getAdminCouponStats = async () => {
  const res = await api.get('/admin/coupons/stats');
  return res.data?.data;
};

export const createAdminCoupon = async (data) => {
  const res = await api.post('/admin/coupons', data);
  return res.data;
};

export const updateAdminCoupon = async (id, data) => {
  const res = await api.put(`/admin/coupons/${id}`, data);
  return res.data;
};

export const toggleAdminCoupon = async (id) => {
  const res = await api.patch(`/admin/coupons/${id}/toggle`);
  return res.data;
};

export const deleteAdminCoupon = async (id) => {
  const res = await api.delete(`/admin/coupons/${id}`);
  return res.data;
};

// Shopkeeper/Merchant Coupon Validation
export const validateSubscriptionCoupon = async (code, plan) => {
  const payload = { code };
  if (plan) payload.plan = plan;
  const res = await api.post('/subscription/validate-coupon', payload);
  return res.data?.data;
};

// 12. Platform Security & Immutable Audit Logs
export const getAdminAuditLogs = async (params = {}) => {
  const res = await api.get('/admin/audit-logs', { params });
  return res.data?.data;
};

export const getAdminAuditStats = async () => {
  const res = await api.get('/admin/audit-logs/stats');
  return res.data?.data;
};

export const exportAdminAuditLogs = async (params = {}) => {
  const res = await api.get('/admin/audit-logs/export', { params });
  return res.data?.data;
};

// 13. Dynamic SaaS Plan Limits & Pricing
export const getAdminPlans = async () => {
  const res = await api.get('/admin/plans');
  return res.data?.data;
};

export const updateAdminPlan = async (planId, data) => {
  const res = await api.put(`/admin/plans/${planId}`, data);
  return res.data;
};

export const resetAdminPlans = async () => {
  const res = await api.post('/admin/plans/reset');
  return res.data;
};

export const getPublicPlans = async () => {
  const res = await api.get('/subscription/plans');
  return res.data?.data;
};

// 14. WhatsApp Business Gateway
export const getWhatsAppStatus = async () => {
  const res = await api.get('/admin/whatsapp/status');
  return res.data?.data;
};

export const restartWhatsAppGateway = async () => {
  const res = await api.post('/admin/whatsapp/restart');
  return res.data;
};

export const logoutWhatsAppGateway = async () => {
  const res = await api.post('/admin/whatsapp/logout');
  return res.data;
};
