import { useState } from 'react';
import { WorkflowAction, WorkflowActionType } from '@/types/workflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface ActionBuilderProps {
  actions: Omit<WorkflowAction, 'id'>[];
  onChange: (actions: Omit<WorkflowAction, 'id'>[]) => void;
}

const ACTION_TYPES: { value: WorkflowActionType; label: string; emoji: string }[] = [
  { value: 'STATUS_CHANGE', label: 'تغییر وضعیت', emoji: '🔄' },
  { value: 'SEND_EMAIL', label: 'ارسال ایمیل', emoji: '📧' },
  { value: 'SEND_SMS', label: 'ارسال پیامک', emoji: '📱' },
  { value: 'CREATE_NOTIFICATION', label: 'ایجاد اعلان', emoji: '🔔' },
  { value: 'UPDATE_FIELD', label: 'بروزرسانی فیلد', emoji: '✏️' },
  { value: 'CALL_API', label: 'فراخوانی API', emoji: '🌐' },
  { value: 'SCHEDULE_TASK', label: 'زمان‌بندی وظیفه', emoji: '⏰' },
];

export default function ActionBuilder({
  actions,
  onChange,
}: ActionBuilderProps) {
  const handleAddAction = () => {
    const newAction: Omit<WorkflowAction, 'id'> = {
      action_type: 'STATUS_CHANGE',
      config: {},
      order: actions.length + 1,
      is_enabled: true,
    };
    onChange([...actions, newAction]);
  };

  const handleRemoveAction = (index: number) => {
    const newActions = actions.filter((_, i) => i !== index);
    // Re-order remaining actions
    const reordered = newActions.map((action, i) => ({
      ...action,
      order: i + 1,
    }));
    onChange(reordered);
  };

  const handleUpdateAction = (
    index: number,
    updates: Partial<Omit<WorkflowAction, 'id'>>
  ) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], ...updates };
    onChange(newActions);
  };

  const handleMoveAction = (index: number, direction: 'up' | 'down') => {
    const newActions = [...actions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newActions.length) return;

    // Swap
    [newActions[index], newActions[targetIndex]] = [
      newActions[targetIndex],
      newActions[index],
    ];

    // Re-order
    const reordered = newActions.map((action, i) => ({
      ...action,
      order: i + 1,
    }));
    onChange(reordered);
  };

  const renderActionConfig = (
    action: Omit<WorkflowAction, 'id'>,
    index: number
  ) => {
    switch (action.action_type) {
      case 'STATUS_CHANGE':
        return (
          <div className="space-y-2">
            <Label>وضعیت جدید</Label>
            <Select
              value={action.config.new_status}
              onValueChange={(value) =>
                handleUpdateAction(index, {
                  config: { ...action.config, new_status: value },
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="انتخاب وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">در انتظار بررسی</SelectItem>
                <SelectItem value="UNDER_REVIEW">در حال بررسی</SelectItem>
                <SelectItem value="ACCEPTED">پذیرفته شده</SelectItem>
                <SelectItem value="REJECTED">رد شده</SelectItem>
                <SelectItem value="WAITLIST">لیست انتظار</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 'SEND_EMAIL':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>موضوع ایمیل</Label>
              <Input
                value={action.config.email_subject || ''}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, email_subject: e.target.value },
                  })
                }
                placeholder="موضوع ایمیل"
              />
            </div>
            <div className="space-y-2">
              <Label>متن ایمیل</Label>
              <Textarea
                value={action.config.email_body || ''}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, email_body: e.target.value },
                  })
                }
                placeholder="متن ایمیل"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>گیرندگان (با کاما جدا کنید)</Label>
              <Input
                value={action.config.email_to?.join(', ') || ''}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: {
                      ...action.config,
                      email_to: e.target.value.split(',').map((s) => s.trim()),
                    },
                  })
                }
                placeholder="email1@example.com, email2@example.com"
              />
            </div>
          </div>
        );

      case 'SEND_SMS':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>متن پیامک</Label>
              <Textarea
                value={action.config.sms_message || ''}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, sms_message: e.target.value },
                  })
                }
                placeholder="متن پیامک"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>شماره‌های گیرنده (با کاما جدا کنید)</Label>
              <Input
                value={action.config.sms_to?.join(', ') || ''}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: {
                      ...action.config,
                      sms_to: e.target.value.split(',').map((s) => s.trim()),
                    },
                  })
                }
                placeholder="09121234567, 09129876543"
              />
            </div>
          </div>
        );

      case 'CREATE_NOTIFICATION':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>نوع اعلان</Label>
              <Select
                value={action.config.notification_type}
                onValueChange={(value) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, notification_type: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب نوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STATUS_CHANGE">تغییر وضعیت</SelectItem>
                  <SelectItem value="SYSTEM_ANNOUNCEMENT">اطلاعیه سیستم</SelectItem>
                  <SelectItem value="DEADLINE_REMINDER">یادآوری مهلت</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>عنوان اعلان</Label>
              <Input
                value={action.config.notification_title || ''}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: {
                      ...action.config,
                      notification_title: e.target.value,
                    },
                  })
                }
                placeholder="عنوان"
              />
            </div>
            <div className="space-y-2">
              <Label>متن اعلان</Label>
              <Textarea
                value={action.config.notification_message || ''}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: {
                      ...action.config,
                      notification_message: e.target.value,
                    },
                  })
                }
                placeholder="متن اعلان"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>اولویت</Label>
              <Select
                value={action.config.notification_priority}
                onValueChange={(value) =>
                  handleUpdateAction(index, {
                    config: {
                      ...action.config,
                      notification_priority: value,
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب اولویت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">کم</SelectItem>
                  <SelectItem value="MEDIUM">متوسط</SelectItem>
                  <SelectItem value="HIGH">زیاد</SelectItem>
                  <SelectItem value="URGENT">فوری</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'UPDATE_FIELD':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>نام فیلد</Label>
              <Input
                value={action.config.field_name || ''}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, field_name: e.target.value },
                  })
                }
                placeholder="مثال: priority"
              />
            </div>
            <div className="space-y-2">
              <Label>مقدار جدید</Label>
              <Input
                value={action.config.field_value || ''}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, field_value: e.target.value },
                  })
                }
                placeholder="مقدار"
              />
            </div>
          </div>
        );

      case 'CALL_API':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={action.config.api_url || ''}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, api_url: e.target.value },
                  })
                }
                placeholder="https://api.example.com/endpoint"
              />
            </div>
            <div className="space-y-2">
              <Label>متد HTTP</Label>
              <Select
                value={action.config.api_method}
                onValueChange={(value) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, api_method: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب متد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Body (JSON)</Label>
              <Textarea
                value={
                  typeof action.config.api_body === 'string'
                    ? action.config.api_body
                    : JSON.stringify(action.config.api_body || {}, null, 2)
                }
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, api_body: e.target.value },
                  })
                }
                placeholder='{"key": "value"}'
                rows={4}
              />
            </div>
          </div>
        );

      case 'SCHEDULE_TASK':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>نوع وظیفه</Label>
              <Input
                value={action.config.task_type || ''}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, task_type: e.target.value },
                  })
                }
                placeholder="مثال: send_reminder"
              />
            </div>
            <div className="space-y-2">
              <Label>تاخیر (ساعت)</Label>
              <Input
                type="number"
                value={action.config.task_delay_hours || ''}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: {
                      ...action.config,
                      task_delay_hours: parseInt(e.target.value),
                    },
                  })
                }
                placeholder="24"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>اکشن‌ها</span>
          <Button onClick={handleAddAction} size="sm">
            <Plus className="w-4 h-4 ml-2" />
            افزودن اکشن
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>هیچ اکشنی تعریف نشده است.</p>
            <p className="text-sm mt-2">حداقل یک اکشن اضافه کنید.</p>
          </div>
        ) : (
          actions.map((action, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 border rounded-lg"
            >
              {/* Drag Handle & Order Controls */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleMoveAction(index, 'up')}
                  disabled={index === 0}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                >
                  ↑
                </button>
                <div className="text-sm text-center font-medium">
                  {action.order}
                </div>
                <button
                  onClick={() => handleMoveAction(index, 'down')}
                  disabled={index === actions.length - 1}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                >
                  ↓
                </button>
              </div>

              <div className="flex-1 space-y-4">
                {/* Action Type */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-2">
                    <Label>نوع اکشن</Label>
                    <Select
                      value={action.action_type}
                      onValueChange={(value) =>
                        handleUpdateAction(index, {
                          action_type: value as WorkflowActionType,
                          config: {}, // Reset config when type changes
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.emoji} {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Enable/Disable Toggle */}
                  <div className="flex items-center gap-2 mr-4">
                    <Switch
                      checked={action.is_enabled}
                      onCheckedChange={(checked) =>
                        handleUpdateAction(index, { is_enabled: checked })
                      }
                    />
                    <Label className="text-sm">
                      {action.is_enabled ? 'فعال' : 'غیرفعال'}
                    </Label>
                  </div>
                </div>

                {/* Action-specific Config */}
                {renderActionConfig(action, index)}
              </div>

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveAction(index)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
