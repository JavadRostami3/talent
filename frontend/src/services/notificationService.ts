import api from './api';
import type {
  Notification,
  NotificationFilters,
  NotificationPreferences,
  NotificationStats,
  PaginatedNotifications,
} from '@/types/notification';

/**
 * Get notifications for current user
 */
export const getNotifications = async (
  filters?: NotificationFilters
): Promise<PaginatedNotifications> => {
  const params = new URLSearchParams();
  
  if (filters?.is_read !== undefined) params.append('is_read', String(filters.is_read));
  if (filters?.is_archived !== undefined) params.append('is_archived', String(filters.is_archived));
  if (filters?.notification_type) params.append('notification_type', filters.notification_type);
  if (filters?.priority) params.append('priority', filters.priority);
  if (filters?.date_from) params.append('date_from', filters.date_from);
  if (filters?.date_to) params.append('date_to', filters.date_to);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.page_size) params.append('page_size', String(filters.page_size));

  const response = await api.get<PaginatedNotifications>(
    `/api/notifications/?${params.toString()}`
  );
  return response.data;
};

/**
 * Get notification statistics
 */
export const getNotificationStats = async (): Promise<NotificationStats> => {
  const response = await api.get<NotificationStats>('/api/notifications/stats/');
  return response.data;
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId: number): Promise<Notification> => {
  const response = await api.post<Notification>(
    `/api/notifications/${notificationId}/mark-read/`
  );
  return response.data;
};

/**
 * Mark multiple notifications as read
 */
export const markMultipleAsRead = async (notificationIds: number[]): Promise<void> => {
  await api.post('/api/notifications/mark-multiple-read/', {
    notification_ids: notificationIds,
  });
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<void> => {
  await api.post('/api/notifications/mark-all-read/');
};

/**
 * Archive notification
 */
export const archiveNotification = async (notificationId: number): Promise<Notification> => {
  const response = await api.post<Notification>(
    `/api/notifications/${notificationId}/archive/`
  );
  return response.data;
};

/**
 * Delete notification
 */
export const deleteNotification = async (notificationId: number): Promise<void> => {
  await api.delete(`/api/notifications/${notificationId}/`);
};

/**
 * Get notification preferences
 */
export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const response = await api.get<NotificationPreferences>('/api/notifications/preferences/');
  return response.data;
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> => {
  const response = await api.patch<NotificationPreferences>(
    '/api/notifications/preferences/',
    preferences
  );
  return response.data;
};

/**
 * Send test notification
 */
export const sendTestNotification = async (): Promise<void> => {
  await api.post('/api/notifications/test/');
};

const notificationService = {
  getNotifications,
  getNotificationStats,
  markAsRead,
  markMultipleAsRead,
  markAllAsRead,
  archiveNotification,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  sendTestNotification,
};

export default notificationService;
