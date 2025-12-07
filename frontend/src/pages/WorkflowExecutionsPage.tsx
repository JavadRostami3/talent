import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WorkflowExecution } from '@/types/workflow';
import workflowService from '@/services/workflowService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, RefreshCw, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import ExecutionLogViewer from '@/components/workflow/ExecutionLogViewer';

export default function WorkflowExecutionsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExecution, setSelectedExecution] =
    useState<WorkflowExecution | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadExecutions();
  }, [id]);

  const loadExecutions = async () => {
    try {
      setLoading(true);
      const data = await workflowService.getWorkflowExecutions({
        rule_id: id ? parseInt(id) : undefined,
      });
      setExecutions(data.results);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'بارگذاری تاریخچه اجرا با خطا مواجه شد',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (execution: WorkflowExecution) => {
    try {
      const fullExecution = await workflowService.getWorkflowExecution(
        execution.id
      );
      setSelectedExecution(fullExecution);
      setDialogOpen(true);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'بارگذاری جزئیات با خطا مواجه شد',
        variant: 'destructive',
      });
    }
  };

  const handleRetry = async (executionId: number) => {
    try {
      await workflowService.retryWorkflowExecution(executionId);
      toast({
        title: 'موفق',
        description: 'اجرای مجدد ورکفلو انجام شد',
      });
      loadExecutions();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'اجرای مجدد با خطا مواجه شد',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: WorkflowExecution['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-500">تکمیل شده</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">ناموفق</Badge>;
      case 'RUNNING':
        return <Badge className="bg-blue-500">در حال اجرا</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-500">در انتظار</Badge>;
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
          <h1 className="text-3xl font-bold">تاریخچه اجرای ورکفلو</h1>
        </div>
        <Button onClick={loadExecutions} disabled={loading}>
          <RefreshCw
            className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`}
          />
          بروزرسانی
        </Button>
      </div>

      {/* Executions Table */}
      <Card>
        <CardHeader>
          <CardTitle>لیست اجراها</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">در حال بارگذاری...</div>
          ) : executions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>هیچ اجرایی یافت نشد</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>شناسه</TableHead>
                  <TableHead>نام ورکفلو</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>پیشرفت</TableHead>
                  <TableHead>زمان شروع</TableHead>
                  <TableHead>زمان پایان</TableHead>
                  <TableHead className="text-left">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executions.map((execution) => (
                  <TableRow key={execution.id}>
                    <TableCell>#{execution.id}</TableCell>
                    <TableCell>{execution.workflow_rule.name}</TableCell>
                    <TableCell>{getStatusBadge(execution.status)}</TableCell>
                    <TableCell>
                      {execution.actions_executed} / {execution.actions_total}
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(execution.triggered_at), {
                        addSuffix: true,
                        locale: faIR,
                      })}
                    </TableCell>
                    <TableCell>
                      {execution.completed_at
                        ? formatDistanceToNow(
                            new Date(execution.completed_at),
                            {
                              addSuffix: true,
                              locale: faIR,
                            }
                          )
                        : '-'}
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(execution)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {execution.status === 'FAILED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetry(execution.id)}
                          >
                            اجرای مجدد
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Execution Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>جزئیات اجرای ورکفلو</DialogTitle>
          </DialogHeader>
          {selectedExecution && (
            <ExecutionLogViewer execution={selectedExecution} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
