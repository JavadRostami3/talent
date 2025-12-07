import api from '@/services/api';
import {
  AuditLog,
  AuditLogFilters,
  PaginatedAuditLogs,
  AuditStats,
  ActivityTimeline,
  AuditExportRequest,
} from '@/types/audit';

/**
 * Audit Service - مدیریت لاگ‌های ممیزی و تاریخچه فعالیت‌ها
 */

// ========== دریافت لاگ‌ها ==========

/**
 * دریافت لیست لاگ‌های ممیزی با فیلتر و صفحه‌بندی
 */
export const getAuditLogs = async (
  filters?: AuditLogFilters
): Promise<PaginatedAuditLogs> => {
  const response = await api.get('/api/audit/logs/', { params: filters });
  return response.data;
};

/**
 * دریافت جزئیات یک لاگ خاص
 */
export const getAuditLog = async (id: number): Promise<AuditLog> => {
  const response = await api.get(`/api/audit/logs/${id}/`);
  return response.data;
};

/**
 * دریافت لاگ‌های مربوط به یک resource خاص
 */
export const getResourceAuditLogs = async (
  resourceType: string,
  resourceId: number,
  params?: { page?: number; page_size?: number }
): Promise<PaginatedAuditLogs> => {
  const response = await api.get(
    `/api/audit/logs/${resourceType}/${resourceId}/`,
    { params }
  );
  return response.data;
};

/**
 * دریافت تاریخچه تغییرات یک resource
 */
export const getResourceChangeHistory = async (
  resourceType: string,
  resourceId: number
): Promise<AuditLog[]> => {
  const response = await api.get(
    `/api/audit/changes/${resourceType}/${resourceId}/`
  );
  return response.data;
};

// ========== آمار و گزارش ==========

/**
 * دریافت آمار کلی لاگ‌های ممیزی
 */
export const getAuditStats = async (params?: {
  date_from?: string;
  date_to?: string;
}): Promise<AuditStats> => {
  const response = await api.get('/api/audit/stats/', { params });
  return response.data;
};

/**
 * دریافت Timeline فعالیت‌ها
 */
export const getActivityTimeline = async (params?: {
  user_id?: number;
  date_from?: string;
  date_to?: string;
}): Promise<ActivityTimeline[]> => {
  const response = await api.get('/api/audit/timeline/', { params });
  return response.data;
};

/**
 * دریافت فعالیت‌های اخیر کاربر
 */
export const getUserRecentActivity = async (
  userId: number,
  limit: number = 10
): Promise<AuditLog[]> => {
  const response = await api.get(`/api/audit/users/${userId}/recent/`, {
    params: { limit },
  });
  return response.data;
};

/**
 * دریافت فعالیت‌های مشکوک
 */
export const getSuspiciousActivities = async (params?: {
  severity?: 'LOW' | 'MEDIUM' | 'HIGH';
  date_from?: string;
  date_to?: string;
}): Promise<AuditLog[]> => {
  const response = await api.get('/api/audit/suspicious/', { params });
  return response.data;
};

// ========== صادرات ==========

/**
 * درخواست صادرات لاگ‌های ممیزی
 */
export const exportAuditLogs = async (
  request: AuditExportRequest
): Promise<{ file_url: string; file_name: string }> => {
  const response = await api.post('/api/audit/export/', request);
  return response.data;
};

/**
 * دانلود فایل صادرات شده
 */
export const downloadAuditExport = async (fileUrl: string): Promise<Blob> => {
  const response = await api.get(fileUrl, { responseType: 'blob' });
  return response.data;
};

// ========== ثبت دستی لاگ ==========

/**
 * ثبت لاگ ممیزی به صورت دستی
 */
export const createAuditLog = async (data: {
  action_type: string;
  resource_type: string;
  resource_id?: number;
  description: string;
  metadata?: Record<string, any>;
}): Promise<AuditLog> => {
  const response = await api.post('/api/audit/logs/', data);
  return response.data;
};

// ========== تنظیمات ==========

/**
 * دریافت تنظیمات سیستم ممیزی
 */
export const getAuditSettings = async (): Promise<{
  retention_days: number;
  log_all_reads: boolean;
  log_api_calls: boolean;
  log_authentication: boolean;
  alert_on_suspicious: boolean;
  auto_export_enabled: boolean;
  auto_export_frequency: string;
}> => {
  const response = await api.get('/api/audit/settings/');
  return response.data;
};

/**
 * بروزرسانی تنظیمات سیستم ممیزی
 */
export const updateAuditSettings = async (
  settings: Partial<{
    retention_days: number;
    log_all_reads: boolean;
    log_api_calls: boolean;
    log_authentication: boolean;
    alert_on_suspicious: boolean;
    auto_export_enabled: boolean;
    auto_export_frequency: string;
  }>
): Promise<void> => {
  await api.patch('/api/audit/settings/', settings);
};

// ========== پاکسازی ==========

/**
 * پاکسازی لاگ‌های قدیمی
 */
export const purgeOldLogs = async (
  olderThanDays: number
): Promise<{ deleted_count: number }> => {
  const response = await api.post('/api/audit/purge/', {
    older_than_days: olderThanDays,
  });
  return response.data;
};

export default {
  // Logs
  getAuditLogs,
  getAuditLog,
  getResourceAuditLogs,
  getResourceChangeHistory,

  // Stats
  getAuditStats,
  getActivityTimeline,
  getUserRecentActivity,
  getSuspiciousActivities,

  // Export
  exportAuditLogs,
  downloadAuditExport,

  // Manual
  createAuditLog,

  // Settings
  getAuditSettings,
  updateAuditSettings,

  // Cleanup
  purgeOldLogs,
};
