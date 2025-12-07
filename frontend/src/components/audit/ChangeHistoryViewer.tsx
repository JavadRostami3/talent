import { AuditLog } from '@/types/audit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';

interface ChangeHistoryViewerProps {
  changes: AuditLog[];
  resourceTitle?: string;
}

export default function ChangeHistoryViewer({
  changes,
  resourceTitle,
}: ChangeHistoryViewerProps) {
  const getActionBadge = (actionType: string) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-green-500',
      UPDATE: 'bg-blue-500',
      DELETE: 'bg-red-500',
      APPROVE: 'bg-green-600',
      REJECT: 'bg-red-600',
      SUBMIT: 'bg-purple-500',
    };
    const labels: Record<string, string> = {
      CREATE: 'ایجاد',
      UPDATE: 'ویرایش',
      DELETE: 'حذف',
      APPROVE: 'تایید',
      REJECT: 'رد',
      SUBMIT: 'ارسال',
      VIEW: 'مشاهده',
    };
    return (
      <Badge className={colors[actionType] || 'bg-gray-500'}>
        {labels[actionType] || actionType}
      </Badge>
    );
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'خالی';
    if (typeof value === 'boolean') return value ? 'بله' : 'خیر';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          تاریخچه تغییرات
          {resourceTitle && (
            <span className="text-base font-normal text-muted-foreground mr-2">
              - {resourceTitle}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {changes.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            هیچ تغییری ثبت نشده است
          </p>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute right-4 top-2 bottom-2 w-0.5 bg-gray-200" />

            {/* Change Entries */}
            <div className="space-y-6">
              {changes.map((log, index) => (
                <div key={log.id} className="flex items-start gap-4 relative">
                  {/* Timeline Node */}
                  <div className="relative z-10 bg-white">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                  </div>

                  {/* Change Content */}
                  <div className="flex-1 pb-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getActionBadge(log.action_type)}
                          <span className="font-medium">
                            {log.user.full_name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {log.user.role}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(log.timestamp), {
                            addSuffix: true,
                            locale: faIR,
                          })}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground mb-3">
                        {log.description}
                      </p>

                      {/* Changes */}
                      {log.changes && log.changes.length > 0 && (
                        <div className="space-y-3 mt-4 pt-4 border-t">
                          <h4 className="text-sm font-medium">تغییرات:</h4>
                          {log.changes.map((change, idx) => (
                            <div
                              key={idx}
                              className="grid grid-cols-3 gap-4 text-sm"
                            >
                              <div className="font-medium text-gray-700">
                                {change.field}:
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 p-2 bg-red-50 rounded border border-red-200">
                                  <span className="text-red-700 line-through">
                                    {formatValue(change.old_value)}
                                  </span>
                                </div>
                                <span className="text-gray-400">→</span>
                              </div>
                              <div className="p-2 bg-green-50 rounded border border-green-200">
                                <span className="text-green-700 font-medium">
                                  {formatValue(change.new_value)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Metadata */}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <details className="text-sm">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                              اطلاعات تکمیلی
                            </summary>
                            <div className="mt-2 p-2 bg-gray-100 rounded">
                              <pre className="text-xs">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          </details>
                        </div>
                      )}

                      {/* Footer Info */}
                      <div className="mt-3 pt-3 border-t flex items-center gap-4 text-xs text-muted-foreground">
                        {log.ip_address && (
                          <span>IP: {log.ip_address}</span>
                        )}
                        <span>
                          {new Date(log.timestamp).toLocaleString('fa-IR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
