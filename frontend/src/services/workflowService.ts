import api from '@/lib/api';
import {
  WorkflowRule,
  CreateWorkflowRuleRequest,
  UpdateWorkflowRuleRequest,
  WorkflowExecution,
  WorkflowStats,
  PaginatedWorkflowRules,
  PaginatedWorkflowExecutions,
} from '@/types/workflow';

/**
 * Workflow Service - مدیریت قوانین و اجرای ورکفلوها
 */

// ========== CRUD برای قوانین ورکفلو ==========

/**
 * دریافت لیست قوانین ورکفلو با فیلتر و صفحه‌بندی
 */
export const getWorkflowRules = async (params?: {
  page?: number;
  page_size?: number;
  is_enabled?: boolean;
  trigger_type?: string;
  search?: string;
}): Promise<PaginatedWorkflowRules> => {
  const response = await api.get('/api/workflows/rules/', { params });
  return response.data;
};

/**
 * دریافت جزئیات یک قانون ورکفلو
 */
export const getWorkflowRule = async (id: number): Promise<WorkflowRule> => {
  const response = await api.get(`/api/workflows/rules/${id}/`);
  return response.data;
};

/**
 * ایجاد قانون ورکفلو جدید
 */
export const createWorkflowRule = async (
  data: CreateWorkflowRuleRequest
): Promise<WorkflowRule> => {
  const response = await api.post('/api/workflows/rules/', data);
  return response.data;
};

/**
 * ویرایش قانون ورکفلو
 */
export const updateWorkflowRule = async (
  id: number,
  data: UpdateWorkflowRuleRequest
): Promise<WorkflowRule> => {
  const response = await api.patch(`/api/workflows/rules/${id}/`, data);
  return response.data;
};

/**
 * حذف قانون ورکفلو
 */
export const deleteWorkflowRule = async (id: number): Promise<void> => {
  await api.delete(`/api/workflows/rules/${id}/`);
};

/**
 * فعال/غیرفعال کردن قانون ورکفلو
 */
export const toggleWorkflowRule = async (
  id: number,
  is_enabled: boolean
): Promise<WorkflowRule> => {
  const response = await api.patch(`/api/workflows/rules/${id}/`, {
    is_enabled,
  });
  return response.data;
};

/**
 * کپی کردن یک قانون ورکفلو
 */
export const duplicateWorkflowRule = async (
  id: number
): Promise<WorkflowRule> => {
  const response = await api.post(`/api/workflows/rules/${id}/duplicate/`);
  return response.data;
};

// ========== اجرای ورکفلو ==========

/**
 * اجرای دستی یک قانون ورکفلو
 */
export const executeWorkflowRule = async (
  id: number,
  context?: Record<string, any>
): Promise<WorkflowExecution> => {
  const response = await api.post(`/api/workflows/rules/${id}/execute/`, {
    context,
  });
  return response.data;
};

/**
 * تست اجرای ورکفلو (بدون ذخیره)
 */
export const testWorkflowRule = async (
  id: number,
  context?: Record<string, any>
): Promise<{
  success: boolean;
  conditions_met: boolean;
  actions_executed: number;
  execution_log: string[];
  errors?: string[];
}> => {
  const response = await api.post(`/api/workflows/rules/${id}/test/`, {
    context,
  });
  return response.data;
};

// ========== تاریخچه اجرا ==========

/**
 * دریافت لیست اجراهای ورکفلو
 */
export const getWorkflowExecutions = async (params?: {
  page?: number;
  page_size?: number;
  rule_id?: number;
  status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  date_from?: string;
  date_to?: string;
}): Promise<PaginatedWorkflowExecutions> => {
  const response = await api.get('/api/workflows/executions/', { params });
  return response.data;
};

/**
 * دریافت جزئیات یک اجرا
 */
export const getWorkflowExecution = async (
  id: number
): Promise<WorkflowExecution> => {
  const response = await api.get(`/api/workflows/executions/${id}/`);
  return response.data;
};

/**
 * اجرای مجدد یک ورکفلو ناموفق
 */
export const retryWorkflowExecution = async (
  id: number
): Promise<WorkflowExecution> => {
  const response = await api.post(`/api/workflows/executions/${id}/retry/`);
  return response.data;
};

/**
 * لغو اجرای در حال انجام
 */
export const cancelWorkflowExecution = async (id: number): Promise<void> => {
  await api.post(`/api/workflows/executions/${id}/cancel/`);
};

// ========== آمار و گزارش ==========

/**
 * دریافت آمار ورکفلوها
 */
export const getWorkflowStats = async (params?: {
  date_from?: string;
  date_to?: string;
  rule_id?: number;
}): Promise<WorkflowStats> => {
  const response = await api.get('/api/workflows/stats/', { params });
  return response.data;
};

/**
 * دریافت گزارش عملکرد قوانین
 */
export const getWorkflowPerformanceReport = async (params?: {
  date_from?: string;
  date_to?: string;
  limit?: number;
}): Promise<
  {
    rule: WorkflowRule;
    execution_count: number;
    success_rate: number;
    avg_duration_ms: number;
    last_execution?: string;
  }[]
> => {
  const response = await api.get('/api/workflows/performance/', { params });
  return response.data;
};

/**
 * دریافت لاگ اجرای ورکفلو
 */
export const getWorkflowExecutionLog = async (
  id: number
): Promise<string[]> => {
  const response = await api.get(`/api/workflows/executions/${id}/log/`);
  return response.data.log;
};

// ========== تنظیمات ==========

/**
 * دریافت تنظیمات سیستم ورکفلو
 */
export const getWorkflowSettings = async (): Promise<{
  max_concurrent_executions: number;
  execution_timeout_seconds: number;
  retry_failed_executions: boolean;
  max_retry_attempts: number;
  enable_execution_history: boolean;
  history_retention_days: number;
}> => {
  const response = await api.get('/api/workflows/settings/');
  return response.data;
};

/**
 * بروزرسانی تنظیمات سیستم ورکفلو
 */
export const updateWorkflowSettings = async (
  settings: Partial<{
    max_concurrent_executions: number;
    execution_timeout_seconds: number;
    retry_failed_executions: boolean;
    max_retry_attempts: number;
    enable_execution_history: boolean;
    history_retention_days: number;
  }>
): Promise<void> => {
  await api.patch('/api/workflows/settings/', settings);
};

// ========== Bulk Operations ==========

/**
 * فعال/غیرفعال کردن چند قانون به صورت همزمان
 */
export const bulkToggleWorkflowRules = async (
  rule_ids: number[],
  is_enabled: boolean
): Promise<{ updated: number }> => {
  const response = await api.post('/api/workflows/rules/bulk-toggle/', {
    rule_ids,
    is_enabled,
  });
  return response.data;
};

/**
 * حذف چند قانون به صورت همزمان
 */
export const bulkDeleteWorkflowRules = async (
  rule_ids: number[]
): Promise<{ deleted: number }> => {
  const response = await api.post('/api/workflows/rules/bulk-delete/', {
    rule_ids,
  });
  return response.data;
};

/**
 * اجرای دستی چند قانون
 */
export const bulkExecuteWorkflowRules = async (
  rule_ids: number[],
  context?: Record<string, any>
): Promise<{ executions: WorkflowExecution[] }> => {
  const response = await api.post('/api/workflows/rules/bulk-execute/', {
    rule_ids,
    context,
  });
  return response.data;
};

export default {
  // CRUD
  getWorkflowRules,
  getWorkflowRule,
  createWorkflowRule,
  updateWorkflowRule,
  deleteWorkflowRule,
  toggleWorkflowRule,
  duplicateWorkflowRule,

  // Execution
  executeWorkflowRule,
  testWorkflowRule,

  // History
  getWorkflowExecutions,
  getWorkflowExecution,
  retryWorkflowExecution,
  cancelWorkflowExecution,

  // Stats
  getWorkflowStats,
  getWorkflowPerformanceReport,
  getWorkflowExecutionLog,

  // Settings
  getWorkflowSettings,
  updateWorkflowSettings,

  // Bulk
  bulkToggleWorkflowRules,
  bulkDeleteWorkflowRules,
  bulkExecuteWorkflowRules,
};
