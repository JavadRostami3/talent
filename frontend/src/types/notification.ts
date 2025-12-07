// Notification types and interfaces

export type NotificationType = 
  | 'STATUS_CHANGE'
  | 'DOCUMENT_REVIEWED'
  | 'INTERVIEW_SCHEDULED'
  | 'DEFICIENCY_ADDED'
  | 'DEADLINE_REMINDER'
  | 'ADMISSION_RESULT'
  | 'SYSTEM_ANNOUNCEMENT'
  | 'COMMENT_ADDED';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Notification {
  id: number;
  recipient_type: 'APPLICANT' | 'ADMIN';
  recipient_id: number;
  notification_type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
  read_at?: string;
  metadata?: {
    application_id?: number;
    tracking_code?: string;
    round_title?: string;
    [key: string]: any;
  };
}

export interface NotificationPreferences {
  email_enabled: boolean;
  email_frequency: 'IMMEDIATE' | 'DAILY_DIGEST' | 'WEEKLY_DIGEST';
  in_app_enabled: boolean;
  sms_enabled: boolean;
  notification_types: {
    [key in NotificationType]?: {
      email: boolean;
      in_app: boolean;
      sms: boolean;
    };
  };
}

export interface NotificationStats {
  total_count: number;
  unread_count: number;
  by_type: {
    [key in NotificationType]?: number;
  };
  by_priority: {
    [key in NotificationPriority]?: number;
  };
}

export interface NotificationFilters {
  is_read?: boolean;
  is_archived?: boolean;
  notification_type?: NotificationType;
  priority?: NotificationPriority;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedNotifications {
  count: number;
  next: string | null;
  previous: string | null;
  results: Notification[];
}
