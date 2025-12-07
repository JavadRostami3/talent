import { useState } from 'react';
import { WorkflowCondition, WorkflowConditionOperator } from '@/types/workflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

interface ConditionBuilderProps {
  conditions: WorkflowCondition[];
  onChange: (conditions: WorkflowCondition[]) => void;
}

const OPERATORS: { value: WorkflowConditionOperator; label: string }[] = [
  { value: 'EQUALS', label: 'برابر است با' },
  { value: 'NOT_EQUALS', label: 'برابر نیست با' },
  { value: 'GREATER_THAN', label: 'بزرگتر است از' },
  { value: 'LESS_THAN', label: 'کوچکتر است از' },
  { value: 'CONTAINS', label: 'شامل می‌شود' },
  { value: 'IN', label: 'در لیست است' },
  { value: 'NOT_IN', label: 'در لیست نیست' },
];

const COMMON_FIELDS = [
  { value: 'application.status', label: 'وضعیت درخواست' },
  { value: 'application.priority', label: 'اولویت درخواست' },
  { value: 'application.gpa', label: 'معدل' },
  { value: 'application.english_score', label: 'نمره زبان' },
  { value: 'documents.count', label: 'تعداد مدارک' },
  { value: 'documents.verified', label: 'مدارک تایید شده' },
  { value: 'applicant.nationality', label: 'ملیت متقاضی' },
  { value: 'program.level', label: 'مقطع تحصیلی' },
  { value: 'program.university', label: 'دانشگاه' },
];

export default function ConditionBuilder({
  conditions,
  onChange,
}: ConditionBuilderProps) {
  const handleAddCondition = () => {
    const newCondition: WorkflowCondition = {
      field: '',
      operator: 'EQUALS',
      value: '',
      logic: conditions.length > 0 ? 'AND' : undefined,
    };
    onChange([...conditions, newCondition]);
  };

  const handleRemoveCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    // Remove logic from first condition if it exists
    if (newConditions.length > 0 && newConditions[0].logic) {
      newConditions[0] = { ...newConditions[0], logic: undefined };
    }
    onChange(newConditions);
  };

  const handleUpdateCondition = (
    index: number,
    updates: Partial<WorkflowCondition>
  ) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    onChange(newConditions);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>شرایط اجرا</span>
          <Button onClick={handleAddCondition} size="sm">
            <Plus className="w-4 h-4 ml-2" />
            افزودن شرط
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {conditions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>هیچ شرطی تعریف نشده است.</p>
            <p className="text-sm mt-2">
              برای اجرای همیشگی، بدون شرط ادامه دهید.
            </p>
          </div>
        ) : (
          conditions.map((condition, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 border rounded-lg"
            >
              {/* Logic Operator (for 2nd condition onwards) */}
              {index > 0 && (
                <div className="flex flex-col gap-2">
                  <Label>منطق</Label>
                  <Select
                    value={condition.logic}
                    onValueChange={(value) =>
                      handleUpdateCondition(index, {
                        logic: value as 'AND' | 'OR',
                      })
                    }
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">و</SelectItem>
                      <SelectItem value="OR">یا</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex-1 space-y-4">
                {/* Field */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>فیلد</Label>
                    <Select
                      value={condition.field}
                      onValueChange={(value) =>
                        handleUpdateCondition(index, { field: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب فیلد" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_FIELDS.map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Operator */}
                  <div className="space-y-2">
                    <Label>عملگر</Label>
                    <Select
                      value={condition.operator}
                      onValueChange={(value) =>
                        handleUpdateCondition(index, {
                          operator: value as WorkflowConditionOperator,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Value */}
                  <div className="space-y-2">
                    <Label>مقدار</Label>
                    <Input
                      value={condition.value}
                      onChange={(e) =>
                        handleUpdateCondition(index, { value: e.target.value })
                      }
                      placeholder="مقدار"
                    />
                  </div>
                </div>
              </div>

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveCondition(index)}
                className="mt-8"
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
