import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  WorkflowRule,
  WorkflowCondition,
  WorkflowAction,
  WorkflowTriggerType,
} from '@/types/workflow';
import workflowService from '@/services/workflowService';
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
import { ArrowLeft, Save, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ConditionBuilder from '@/components/workflow/ConditionBuilder';
import ActionBuilder from '@/components/workflow/ActionBuilder';

const TRIGGER_TYPES: { value: WorkflowTriggerType; label: string }[] = [
  { value: 'APPLICATION_SUBMITTED', label: '📝 ثبت درخواست' },
  { value: 'DOCUMENT_UPLOADED', label: '📄 آپلود مدرک' },
  { value: 'REVIEW_COMPLETED', label: '✅ اتمام بررسی' },
  { value: 'STATUS_CHANGED', label: '🔄 تغییر وضعیت' },
  { value: 'DEADLINE_APPROACHING', label: '⏰ نزدیک شدن مهلت' },
  { value: 'INTERVIEW_SCHEDULED', label: '📅 تعیین مصاحبه' },
  { value: 'SCORE_ENTERED', label: '📊 ثبت نمره' },
  { value: 'MANUAL_TRIGGER', label: '👆 اجرای دستی' },
];

export default function WorkflowEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: 'APPLICATION_SUBMITTED' as WorkflowTriggerType,
    is_active: true,
    priority: 50,
  });
  const [conditions, setConditions] = useState<WorkflowCondition[]>([]);
  const [actions, setActions] = useState<Omit<WorkflowAction, 'id'>[]>([]);

  useEffect(() => {
    if (isEditMode) {
      loadWorkflowRule();
    }
  }, [id]);

  const loadWorkflowRule = async () => {
    try {
      setLoading(true);
      const rule = await workflowService.getWorkflowRule(parseInt(id!));
      setFormData({
        name: rule.name,
        description: rule.description,
        trigger_type: rule.trigger_type,
        is_active: rule.is_active,
        priority: rule.priority,
      });
      setConditions(rule.conditions);
      setActions(
        rule.actions.map(({ id, ...action }) => action)
      );
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'بارگذاری قانون با خطا مواجه شد',
        variant: 'destructive',
      });
      navigate('/admin/workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'خطا',
        description: 'نام قانون الزامی است',
        variant: 'destructive',
      });
      return;
    }

    if (actions.length === 0) {
      toast({
        title: 'خطا',
        description: 'حداقل یک اکشن باید تعریف شود',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        conditions,
        actions,
      };

      if (isEditMode) {
        await workflowService.updateWorkflowRule(parseInt(id!), payload);
        toast({
          title: 'موفق',
          description: 'قانون ورکفلو ویرایش شد',
        });
      } else {
        await workflowService.createWorkflowRule(payload);
        toast({
          title: 'موفق',
          description: 'قانون ورکفلو ایجاد شد',
        });
      }

      navigate('/admin/workflows');
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'ذخیره قانون با خطا مواجه شد',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!isEditMode) {
      toast({
        title: 'توجه',
        description: 'ابتدا قانون را ذخیره کنید',
        variant: 'destructive',
      });
      return;
    }

    try {
      setTesting(true);
      const result = await workflowService.testWorkflowRule(parseInt(id!));

      if (result.success && result.conditions_met) {
        toast({
          title: 'تست موفق',
          description: `${result.actions_executed} اکشن اجرا شد`,
        });
      } else if (!result.conditions_met) {
        toast({
          title: 'تست انجام شد',
          description: 'شرایط برآورده نشدند',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'تست ناموفق',
          description: result.errors?.join(', '),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'تست با خطا مواجه شد',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/workflows')}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            بازگشت
          </Button>
          <h1 className="text-3xl font-bold">
            {isEditMode ? 'ویرایش ورکفلو' : 'ایجاد ورکفلو'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {isEditMode && (
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testing}
            >
              <TestTube className="w-4 h-4 ml-2" />
              تست ورکفلو
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={loading}>
            <Save className="w-4 h-4 ml-2" />
            ذخیره
          </Button>
        </div>
      </div>

      {loading && !isEditMode ? (
        <div className="text-center py-8">در حال بارگذاری...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات پایه</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">نام قانون *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="مثال: ارسال ایمیل پذیرش"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trigger_type">نوع تریگر</Label>
                  <Select
                    value={formData.trigger_type}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        trigger_type: value as WorkflowTriggerType,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGER_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">توضیحات</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="توضیح مختصری درباره این ورکفلو"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Label htmlFor="priority">اولویت (1-100)</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: parseInt(e.target.value),
                      })
                    }
                    className="w-32"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">
                    {formData.is_active ? 'فعال' : 'غیرفعال'}
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conditions */}
          <ConditionBuilder
            conditions={conditions}
            onChange={setConditions}
          />

          {/* Actions */}
          <ActionBuilder actions={actions} onChange={setActions} />
        </form>
      )}
    </div>
  );
}
