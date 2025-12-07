// Workflow types and interfaces

export type WorkflowActionType =
  | 'STATUS_CHANGE'
  | 'SEND_EMAIL'
  | 'SEND_SMS'
  | 'CREATE_NOTIFICATION'
  | 'UPDATE_FIELD'
  | 'CALL_API'
  | 'SCHEDULE_TASK';

export type WorkflowTriggerType =
  | 'APPLICATION_SUBMITTED'
  | 'DOCUMENT_UPLOADED'
  | 'REVIEW_COMPLETED'
  | 'STATUS_CHANGED'
  | 'DEADLINE_APPROACHING'
  | 'INTERVIEW_SCHEDULED'
  | 'SCORE_ENTERED'
  | 'MANUAL_TRIGGER';

export type WorkflowConditionOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'CONTAINS'
  | 'IN'
  | 'NOT_IN';

export interface WorkflowCondition {
  field: string;
  operator: WorkflowConditionOperator;
  value: any;
  logic?: 'AND' | 'OR'; // For multiple conditions
}

export interface WorkflowAction {
  id?: number;
  action_type: WorkflowActionType;
  config: {
    // For STATUS_CHANGE
    new_status?: string;
    
    // For SEND_EMAIL
    email_template?: string;
    email_subject?: string;
    email_body?: string;
    email_to?: string[];
    
    // For SEND_SMS
    sms_template?: string;
    sms_message?: string;
    sms_to?: string[];
    
    // For CREATE_NOTIFICATION
    notification_type?: string;
    notification_title?: string;
    notification_message?: string;
    notification_priority?: string;
    notification_recipients?: string[];
    
    // For UPDATE_FIELD
    field_name?: string;
    field_value?: any;
    
    // For CALL_API
    api_url?: string;
    api_method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    api_body?: any;
    
    // For SCHEDULE_TASK
    task_type?: string;
    task_delay_hours?: number;
    task_config?: any;
    
    [key: string]: any;
  };
  order: number;
  is_enabled: boolean;
}

export interface WorkflowRule {
  id: number;
  name: string;
  description: string;
  trigger_type: WorkflowTriggerType;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  created_by?: {
    full_name: string;
  };
  execution_count: number;
  last_executed_at?: string;
}

export interface WorkflowExecution {
  id: number;
  workflow_rule: WorkflowRule;
  application_id?: number;
  triggered_at: string;
  completed_at?: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  error_message?: string;
  actions_executed: number;
  actions_total: number;
  execution_log: Array<{
    timestamp: string;
    action_type: string;
    status: 'SUCCESS' | 'FAILED';
    message: string;
  }>;
}

export interface WorkflowStats {
  total_rules: number;
  active_rules: number;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  pending_executions: number;
  by_trigger_type: {
    [key in WorkflowTriggerType]?: number;
  };
  recent_executions: WorkflowExecution[];
}

export interface CreateWorkflowRuleRequest {
  name: string;
  description: string;
  trigger_type: WorkflowTriggerType;
  conditions: WorkflowCondition[];
  actions: Omit<WorkflowAction, 'id'>[];
  is_active: boolean;
  priority: number;
}

export interface UpdateWorkflowRuleRequest extends Partial<CreateWorkflowRuleRequest> {}

export interface PaginatedWorkflowRules {
  count: number;
  next: string | null;
  previous: string | null;
  results: WorkflowRule[];
}

export interface PaginatedWorkflowExecutions {
  count: number;
  next: string | null;
  previous: string | null;
  results: WorkflowExecution[];
}
