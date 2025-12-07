import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Archive,
  Filter,
  RefreshCw,
  InboxIcon,
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import type { Notification, NotificationType } from '@/types/notification';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const {
    notifications,
    stats,
    loading,
    hasMore,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    loadMore,
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const getNotificationIcon = (type: NotificationType) => {
    const icons = {
      STATUS_CHANGE: '🔄',
      DOCUMENT_REVIEWED: '📄',
      INTERVIEW_SCHEDULED: '📅',
      DEFICIENCY_ADDED: '⚠️',
      DEADLINE_REMINDER: '⏰',
      ADMISSION_RESULT: '🎓',
      SYSTEM_ANNOUNCEMENT: '📢',
      COMMENT_ADDED: '💬',
    };
    return icons[type] || '🔔';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      URGENT: 'bg-red-100 text-red-800 border-red-200',
      HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
      MEDIUM: 'bg-blue-100 text-blue-800 border-blue-200',
      LOW: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[priority as keyof typeof colors] || colors.MEDIUM;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الان';
    if (diffMins < 60) return `${diffMins} دقیقه پیش`;
    if (diffHours < 24) return `${diffHours} ساعت پیش`;
    if (diffDays < 7) return `${diffDays} روز پیش`;
    return date.toLocaleDateString('fa-IR');
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    if (notification.link) {
      navigate(notification.link);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  });

  const unreadCount = stats?.unread_count || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell className="h-8 w-8" />
            اعلان‌ها
          </h1>
          <p className="text-muted-foreground mt-1">
            مدیریت اعلان‌ها و پیام‌های سیستم
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotifications(true)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تازه‌سازی
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/notifications/settings')}>
            تنظیمات اعلان
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              همه اعلان‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_count || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              خوانده نشده
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              فوری
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.by_priority?.URGENT || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              مهم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.by_priority?.HIGH || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>لیست اعلان‌ها</CardTitle>
              <CardDescription>مشاهده و مدیریت اعلان‌های دریافتی</CardDescription>
            </div>
            {unreadCount > 0 && (
              <Button size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 ml-2" />
                خواندن همه ({unreadCount})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="all">
                همه ({stats?.total_count || 0})
              </TabsTrigger>
              <TabsTrigger value="unread">
                خوانده نشده ({unreadCount})
              </TabsTrigger>
              <TabsTrigger value="read">
                خوانده شده ({(stats?.total_count || 0) - unreadCount})
              </TabsTrigger>
            </TabsList>

            <div className="space-y-0">
              {filteredNotifications.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <InboxIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-1">اعلانی وجود ندارد</p>
                  <p className="text-sm">
                    {filter === 'unread'
                      ? 'همه اعلان‌ها خوانده شده‌اند'
                      : 'هیچ اعلانی دریافت نکرده‌اید'}
                  </p>
                </div>
              ) : (
                <>
                  {filteredNotifications.map((notification, idx) => (
                    <div key={notification.id}>
                      <div
                        className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                          !notification.is_read ? 'bg-blue-50/50' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="text-3xl flex-shrink-0">
                            {getNotificationIcon(notification.notification_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-base">
                                  {notification.title}
                                </h3>
                                {!notification.is_read && (
                                  <Badge variant="default" className="text-xs">
                                    جدید
                                  </Badge>
                                )}
                              </div>
                              <Badge
                                variant="outline"
                                className={`text-xs ${getPriorityColor(notification.priority)}`}
                              >
                                {notification.priority === 'URGENT'
                                  ? 'فوری'
                                  : notification.priority === 'HIGH'
                                  ? 'مهم'
                                  : notification.priority === 'MEDIUM'
                                  ? 'متوسط'
                                  : 'عادی'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(notification.created_at)}
                              </span>
                              <div className="flex gap-2">
                                {!notification.is_read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notification.id);
                                    }}
                                  >
                                    <Check className="h-4 w-4 ml-1" />
                                    خواندن
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    archiveNotification(notification.id);
                                  }}
                                >
                                  <Archive className="h-4 w-4 ml-1" />
                                  بایگانی
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 ml-1" />
                                  حذف
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {idx < filteredNotifications.length - 1 && <Separator />}
                    </div>
                  ))}

                  {hasMore && (
                    <div className="pt-4 text-center">
                      <Button variant="outline" onClick={loadMore} disabled={loading}>
                        {loading ? (
                          <>
                            <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                            در حال بارگذاری...
                          </>
                        ) : (
                          'بارگذاری بیشتر'
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;
