// Audit Log types and interfaces

export type AuditActionType =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'APPROVE'
  | 'REJECT'
  | 'SUBMIT'
  | 'EXPORT'
  | 'IMPORT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'PERMISSION_CHANGE';

export type AuditResourceType =
  | 'APPLICATION'
  | 'DOCUMENT'
  | 'USER'
  | 'PROGRAM'
  | 'UNIVERSITY'
  | 'FACULTY'
  | 'ANNOUNCEMENT'
  | 'WORKFLOW'
  | 'NOTIFICATION'
  | 'REVIEW'
  | 'COMMENT'
  | 'SETTINGS';

export interface AuditLog {
  id: number;
  user: {
    id: number;
    full_name: string;
    email: string;
    role: string;
  };
  action_type: AuditActionType;
  resource_type: AuditResourceType;
  resource_id?: number;
  resource_title?: string;
  description: string;
  ip_address?: string;
  user_agent?: string;
  changes?: {
    field: string;
    old_value: any;
    new_value: any;
  }[];
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface AuditLogFilters {
  user_id?: number;
  action_type?: AuditActionType;
  resource_type?: AuditResourceType;
  resource_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedAuditLogs {
  count: number;
  next: string | null;
  previous: string | null;
  results: AuditLog[];
}

export interface AuditStats {
  total_logs: number;
  today_logs: number;
  this_week_logs: number;
  this_month_logs: number;
  by_action_type: {
    [key in AuditActionType]?: number;
  };
  by_resource_type: {
    [key in AuditResourceType]?: number;
  };
  top_users: {
    user: {
      id: number;
      full_name: string;
    };
    action_count: number;
  }[];
  recent_activities: AuditLog[];
}

export interface ActivityTimeline {
  date: string;
  activities: AuditLog[];
}

export interface AuditExportRequest {
  filters: AuditLogFilters;
  format: 'CSV' | 'PDF' | 'EXCEL';
  include_changes: boolean;
}
