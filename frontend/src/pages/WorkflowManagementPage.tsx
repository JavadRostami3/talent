import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkflowRule, WorkflowStats } from '@/types/workflow';
import workflowService from '@/services/workflowService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Play,
  BarChart3,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';

export default function WorkflowManagementPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEnabled, setFilterEnabled] = useState<boolean | undefined>(
    undefined
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [filterEnabled]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rulesData, statsData] = await Promise.all([
        workflowService.getWorkflowRules({
          is_enabled: filterEnabled,
          search: searchQuery || undefined,
        }),
        workflowService.getWorkflowStats(),
      ]);
      setRules(rulesData.results);
      setStats(statsData);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'بارگذاری داده‌ها با خطا مواجه شد',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRule = async (id: number, currentState: boolean) => {
    try {
      await workflowService.toggleWorkflowRule(id, !currentState);
      toast({
        title: 'موفق',
        description: 'وضعیت قانون تغییر کرد',
      });
      loadData();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'تغییر وضعیت با خطا مواجه شد',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicateRule = async (id: number) => {
    try {
      await workflowService.duplicateWorkflowRule(id);
      toast({
        title: 'موفق',
        description: 'قانون کپی شد',
      });
      loadData();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'کپی کردن با خطا مواجه شد',
        variant: 'destructive',
      });
    }
  };

  const handleExecuteRule = async (id: number) => {
    try {
      await workflowService.executeWorkflowRule(id);
      toast({
        title: 'موفق',
        description: 'ورکفلو اجرا شد',
      });
      loadData();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'اجرای ورکفلو با خطا مواجه شد',
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = async () => {
    if (!ruleToDelete) return;

    try {
      await workflowService.deleteWorkflowRule(ruleToDelete);
      toast({
        title: 'موفق',
        description: 'قانون حذف شد',
      });
      loadData();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'حذف قانون با خطا مواجه شد',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    }
  };

  const getTriggerLabel = (trigger: string) => {
    const labels: Record<string, string> = {
      APPLICATION_SUBMITTED: '📝 ثبت درخواست',
      DOCUMENT_UPLOADED: '📄 آپلود مدرک',
      REVIEW_COMPLETED: '✅ اتمام بررسی',
      STATUS_CHANGED: '🔄 تغییر وضعیت',
      DEADLINE_APPROACHING: '⏰ نزدیک شدن مهلت',
      INTERVIEW_SCHEDULED: '📅 تعیین مصاحبه',
      SCORE_ENTERED: '📊 ثبت نمره',
      MANUAL_TRIGGER: '👆 دستی',
    };
    return labels[trigger] || trigger;
  };

  const filteredRules = rules.filter((rule) =>
    rule.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">مدیریت ورکفلوها</h1>
          <p className="text-muted-foreground mt-1">
            خودکارسازی فرآیندها با قوانین هوشمند
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </Button>
          <Button onClick={() => navigate('/admin/workflows/new')}>
            <Plus className="w-4 h-4 ml-2" />
            ایجاد ورکفلو
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                کل قوانین
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_rules}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                قوانین فعال
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats.active_rules}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                اجراهای موفق
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {stats.successful_executions}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                اجراهای ناموفق
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {stats.failed_executions}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در قوانین..."
                className="pr-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="w-4 h-4 ml-2" />
                  فیلتر
                  {filterEnabled !== undefined && (
                    <Badge className="mr-2" variant="secondary">
                      1
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterEnabled(undefined)}>
                  همه قوانین
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterEnabled(true)}>
                  فقط فعال
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterEnabled(false)}>
                  فقط غیرفعال
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle>لیست قوانین</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">در حال بارگذاری...</div>
          ) : filteredRules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>هیچ قانونی یافت نشد</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نام قانون</TableHead>
                  <TableHead>نوع تریگر</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>تعداد اجرا</TableHead>
                  <TableHead>آخرین اجرا</TableHead>
                  <TableHead>اولویت</TableHead>
                  <TableHead className="text-left">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {rule.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTriggerLabel(rule.trigger_type)}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() =>
                          handleToggleRule(rule.id, rule.is_active)
                        }
                      />
                    </TableCell>
                    <TableCell>{rule.execution_count}</TableCell>
                    <TableCell>
                      {rule.last_executed_at
                        ? formatDistanceToNow(
                            new Date(rule.last_executed_at),
                            {
                              addSuffix: true,
                              locale: faIR,
                            }
                          )
                        : 'هرگز'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{rule.priority}</Badge>
                    </TableCell>
                    <TableCell className="text-left">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(`/admin/workflows/${rule.id}`)
                            }
                          >
                            <Edit className="w-4 h-4 ml-2" />
                            ویرایش
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDuplicateRule(rule.id)}
                          >
                            <Copy className="w-4 h-4 ml-2" />
                            کپی
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleExecuteRule(rule.id)}
                          >
                            <Play className="w-4 h-4 ml-2" />
                            اجرای دستی
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(`/admin/workflows/${rule.id}/executions`)
                            }
                          >
                            <BarChart3 className="w-4 h-4 ml-2" />
                            تاریخچه اجرا
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setRuleToDelete(rule.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 ml-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف قانون ورکفلو</AlertDialogTitle>
            <AlertDialogDescription>
              آیا مطمئن هستید که می‌خواهید این قانون را حذف کنید؟ این عملیات قابل
              بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>لغو</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
