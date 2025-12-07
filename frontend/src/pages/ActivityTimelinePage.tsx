import { useState, useEffect } from 'react';
import { ActivityTimeline } from '@/types/audit';
import auditService from '@/services/auditService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, RefreshCw, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { faIR } from 'date-fns/locale';

export default function ActivityTimelinePage() {
  const { toast } = useToast();

  const [timeline, setTimeline] = useState<ActivityTimeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  useEffect(() => {
    loadTimeline();
  }, []);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const data = await auditService.getActivityTimeline({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setTimeline(data);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'بارگذاری Timeline با خطا مواجه شد',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    const icons: Record<string, string> = {
      CREATE: '✨',
      UPDATE: '✏️',
      DELETE: '🗑️',
      APPROVE: '✅',
      REJECT: '❌',
      SUBMIT: '📤',
      VIEW: '👁️',
      LOGIN: '🔐',
      LOGOUT: '🚪',
      EXPORT: '📥',
    };
    return icons[actionType] || '📝';
  };

  const getActionColor = (actionType: string) => {
    const colors: Record<string, string> = {
      CREATE: 'text-green-600',
      UPDATE: 'text-blue-600',
      DELETE: 'text-red-600',
      APPROVE: 'text-green-700',
      REJECT: 'text-red-700',
      SUBMIT: 'text-purple-600',
    };
    return colors[actionType] || 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timeline فعالیت‌ها</h1>
          <p className="text-muted-foreground mt-1">
            خط زمانی کامل فعالیت‌های سیستم
          </p>
        </div>
        <Button onClick={loadTimeline} disabled={loading}>
          <RefreshCw
            className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`}
          />
          بروزرسانی
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">از تاریخ:</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">تا تاریخ:</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="pt-6">
              <Button onClick={loadTimeline}>
                <Calendar className="w-4 h-4 ml-2" />
                اعمال فیلتر
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      {loading ? (
        <div className="text-center py-8">در حال بارگذاری...</div>
      ) : timeline.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>هیچ فعالیتی در بازه زمانی انتخابی یافت نشد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {timeline.map((day, dayIndex) => (
            <Card key={dayIndex}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {format(new Date(day.date), 'EEEE، d MMMM yyyy', {
                    locale: faIR,
                  })}
                  <Badge variant="secondary">{day.activities.length} فعالیت</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-gray-200" />

                  {/* Activities */}
                  <div className="space-y-4">
                    {day.activities.map((activity, actIndex) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-4 relative"
                      >
                        {/* Timeline Node */}
                        <div className="relative z-10">
                          <div
                            className={`w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-2xl ${getActionColor(
                              activity.action_type
                            )}`}
                          >
                            {getActionIcon(activity.action_type)}
                          </div>
                        </div>

                        {/* Activity Content */}
                        <div className="flex-1 pb-4">
                          <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {activity.user.full_name}
                                </span>
                                <Badge variant="outline">
                                  {activity.user.role}
                                </Badge>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {new Date(activity.timestamp).toLocaleTimeString(
                                  'fa-IR'
                                )}
                              </span>
                            </div>

                            <p className="text-sm text-muted-foreground mb-2">
                              {activity.description}
                            </p>

                            <div className="flex items-center gap-2 text-xs">
                              <Badge
                                variant="secondary"
                                className="bg-blue-100 text-blue-700"
                              >
                                {activity.resource_type}
                              </Badge>
                              {activity.resource_id && (
                                <span className="text-muted-foreground">
                                  #{activity.resource_id}
                                </span>
                              )}
                              {activity.resource_title && (
                                <span className="text-muted-foreground">
                                  - {activity.resource_title}
                                </span>
                              )}
                            </div>

                            {activity.changes && activity.changes.length > 0 && (
                              <div className="mt-2 pt-2 border-t">
                                <span className="text-xs text-muted-foreground">
                                  {activity.changes.length} تغییر
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
