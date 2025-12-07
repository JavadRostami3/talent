import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Mail, MessageSquare, Save, TestTube, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import notificationService from '@/services/notificationService';
import type { NotificationPreferences } from '@/types/notification';
import { useNavigate } from 'react-router-dom';

const NotificationSettingsPage = () => {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotificationPreferences();
      setPreferences(data);
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری تنظیمات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      await notificationService.updateNotificationPreferences(preferences);
      toast({
        title: 'موفق',
        description: 'تنظیمات با موفقیت ذخیره شد',
      });
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: 'خطا در ذخیره تنظیمات',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    setTesting(true);
    try {
      await notificationService.sendTestNotification();
      toast({
        title: 'موفق',
        description: 'اعلان تستی ارسال شد. لطفاً بررسی کنید.',
      });
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: 'خطا در ارسال اعلان تستی',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading || !preferences) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>در حال بارگذاری...</p>
      </div>
    );
  }

  const notificationTypes = [
    { value: 'STATUS_CHANGE', label: 'تغییر وضعیت پرونده', icon: '🔄' },
    { value: 'DOCUMENT_REVIEWED', label: 'بررسی مدارک', icon: '📄' },
    { value: 'INTERVIEW_SCHEDULED', label: 'زمان‌بندی مصاحبه', icon: '📅' },
    { value: 'DEFICIENCY_ADDED', label: 'اضافه شدن نقص', icon: '⚠️' },
    { value: 'DEADLINE_REMINDER', label: 'یادآور مهلت', icon: '⏰' },
    { value: 'ADMISSION_RESULT', label: 'نتیجه پذیرش', icon: '🎓' },
    { value: 'SYSTEM_ANNOUNCEMENT', label: 'اطلاعیه سیستم', icon: '📢' },
    { value: 'COMMENT_ADDED', label: 'افزودن نظر', icon: '💬' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/notifications')}>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">تنظیمات اعلان‌ها</h1>
          <p className="text-muted-foreground">مدیریت روش دریافت اعلان‌ها</p>
        </div>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>تنظیمات عمومی</CardTitle>
          <CardDescription>روش‌های دریافت اعلان را فعال یا غیرفعال کنید</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* In-App Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                اعلان‌های درون برنامه
              </Label>
              <p className="text-sm text-muted-foreground">
                نمایش اعلان‌ها در نوار بالای سیستم
              </p>
            </div>
            <Switch
              checked={preferences.in_app_enabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, in_app_enabled: checked })
              }
            />
          </div>

          <Separator />

          {/* Email Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  اعلان‌های ایمیل
                </Label>
                <p className="text-sm text-muted-foreground">
                  دریافت اعلان از طریق ایمیل
                </p>
              </div>
              <Switch
                checked={preferences.email_enabled}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, email_enabled: checked })
                }
              />
            </div>

            {preferences.email_enabled && (
              <div className="ml-8">
                <Label className="text-sm">دفعات ارسال ایمیل</Label>
                <Select
                  value={preferences.email_frequency}
                  onValueChange={(value: any) =>
                    setPreferences({ ...preferences, email_frequency: value })
                  }
                >
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IMMEDIATE">فوری (هر اعلان جداگانه)</SelectItem>
                    <SelectItem value="DAILY_DIGEST">خلاصه روزانه</SelectItem>
                    <SelectItem value="WEEKLY_DIGEST">خلاصه هفتگی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Separator />

          {/* SMS Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                اعلان‌های پیامکی
              </Label>
              <p className="text-sm text-muted-foreground">
                دریافت اعلان از طریق پیامک (فقط موارد مهم)
              </p>
            </div>
            <Switch
              checked={preferences.sms_enabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, sms_enabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle>انواع اعلان</CardTitle>
          <CardDescription>
            برای هر نوع اعلان، روش دریافت را انتخاب کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {notificationTypes.map((type) => {
              const typePrefs = preferences.notification_types?.[type.value as keyof typeof preferences.notification_types] || {
                email: true,
                in_app: true,
                sms: false,
              };

              return (
                <div key={type.value} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{type.icon}</span>
                    <Label className="text-base font-semibold">{type.label}</Label>
                  </div>
                  <div className="grid grid-cols-3 gap-4 ml-8">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        id={`${type.value}-in-app`}
                        checked={typePrefs.in_app}
                        disabled={!preferences.in_app_enabled}
                        onCheckedChange={(checked) => {
                          setPreferences({
                            ...preferences,
                            notification_types: {
                              ...preferences.notification_types,
                              [type.value]: { ...typePrefs, in_app: checked },
                            },
                          });
                        }}
                      />
                      <Label
                        htmlFor={`${type.value}-in-app`}
                        className="text-sm cursor-pointer"
                      >
                        برنامه
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        id={`${type.value}-email`}
                        checked={typePrefs.email}
                        disabled={!preferences.email_enabled}
                        onCheckedChange={(checked) => {
                          setPreferences({
                            ...preferences,
                            notification_types: {
                              ...preferences.notification_types,
                              [type.value]: { ...typePrefs, email: checked },
                            },
                          });
                        }}
                      />
                      <Label
                        htmlFor={`${type.value}-email`}
                        className="text-sm cursor-pointer"
                      >
                        ایمیل
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        id={`${type.value}-sms`}
                        checked={typePrefs.sms}
                        disabled={!preferences.sms_enabled}
                        onCheckedChange={(checked) => {
                          setPreferences({
                            ...preferences,
                            notification_types: {
                              ...preferences.notification_types,
                              [type.value]: { ...typePrefs, sms: checked },
                            },
                          });
                        }}
                      />
                      <Label
                        htmlFor={`${type.value}-sms`}
                        className="text-sm cursor-pointer"
                      >
                        پیامک
                      </Label>
                    </div>
                  </div>
                  <Separator />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Test Notification */}
      <Card>
        <CardHeader>
          <CardTitle>تست اعلان</CardTitle>
          <CardDescription>
            برای اطمینان از صحت تنظیمات، یک اعلان تستی ارسال کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleTestNotification} disabled={testing} variant="outline">
            <TestTube className="h-4 w-4 ml-2" />
            {testing ? 'در حال ارسال...' : 'ارسال اعلان تستی'}
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate('/notifications')}>
          انصراف
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 ml-2" />
          {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertDescription className="text-sm">
          <strong>توجه:</strong> تغییرات تنظیمات بلافاصله اعمال می‌شود. برای اعلان‌های
          مهم (مانند نتیجه پذیرش و زمان مصاحبه)، توصیه می‌شود حداقل یکی از روش‌های
          دریافت را فعال نگه دارید.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default NotificationSettingsPage;
