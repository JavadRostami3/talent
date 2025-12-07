import { WorkflowExecution } from '@/types/workflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';

interface ExecutionLogViewerProps {
  execution: WorkflowExecution;
}

export default function ExecutionLogViewer({
  execution,
}: ExecutionLogViewerProps) {
  const getStatusIcon = (status: WorkflowExecution['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'RUNNING':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'PENDING':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
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

  const getLogStatusIcon = (status: 'SUCCESS' | 'FAILED') => {
    return status === 'SUCCESS' ? (
      <CheckCircle2 className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Execution Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(execution.status)}
              <span>خلاصه اجرا</span>
            </div>
            {getStatusBadge(execution.status)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">نام ورکفلو</p>
              <p className="font-medium">{execution.workflow_rule.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">شماره درخواست</p>
              <p className="font-medium">
                {execution.application_id || 'ندارد'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">زمان شروع</p>
              <p className="font-medium">
                {formatDistanceToNow(new Date(execution.triggered_at), {
                  addSuffix: true,
                  locale: faIR,
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">زمان پایان</p>
              <p className="font-medium">
                {execution.completed_at
                  ? formatDistanceToNow(new Date(execution.completed_at), {
                      addSuffix: true,
                      locale: faIR,
                    })
                  : 'در حال اجرا'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">اکشن‌های اجرا شده</p>
              <p className="font-medium">
                {execution.actions_executed} / {execution.actions_total}
              </p>
            </div>
            {execution.error_message && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">پیام خطا</p>
                <p className="font-medium text-red-600">
                  {execution.error_message}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Execution Log Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>تایم‌لاین اجرا</CardTitle>
        </CardHeader>
        <CardContent>
          {execution.execution_log.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              هنوز لاگی ثبت نشده است.
            </p>
          ) : (
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute right-4 top-2 bottom-2 w-0.5 bg-gray-200" />

              {/* Log Entries */}
              <div className="space-y-4">
                {execution.execution_log.map((log, index) => (
                  <div key={index} className="flex items-start gap-4 relative">
                    {/* Timeline Node */}
                    <div className="relative z-10 bg-white p-1">
                      {getLogStatusIcon(log.status)}
                    </div>

                    {/* Log Content */}
                    <div className="flex-1 pb-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">
                            {log.action_type}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleTimeString(
                              'fa-IR'
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {log.message}
                        </p>
                        <Badge
                          variant={
                            log.status === 'SUCCESS' ? 'default' : 'destructive'
                          }
                          className="mt-2"
                        >
                          {log.status === 'SUCCESS' ? 'موفق' : 'ناموفق'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
