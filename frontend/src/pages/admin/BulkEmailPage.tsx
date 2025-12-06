import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Mail, Users, Send, AlertTriangle, CheckCircle, Info
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import applicationService from '@/services/applicationService';
import type { ApplicationStatus } from '@/types/models';

const BulkEmailPage = () => {
  const [loading, setLoading] = useState(false);
  
  // Email content
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  // Filters for recipient selection
  const [roundTypeFilter, setRoundTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('');
  const [includeApplicants, setIncludeApplicants] = useState(true);
  const [includeAdmins, setIncludeAdmins] = useState(false);
  
  // Estimated recipients count
  const [estimatedCount, setEstimatedCount] = useState(0);

  const handleSendBulkEmail = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: 'خطا',
        description: 'لطفاً موضوع و متن پیام را وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    if (!includeApplicants && !includeAdmins) {
      toast({
        title: 'خطا',
        description: 'لطفاً حداقل یک گروه دریافت‌کننده را انتخاب کنید',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const filters: any = {
        subject: subject.trim(),
        message: message.trim(),
        include_applicants: includeApplicants,
        include_admins: includeAdmins,
      };

      if (roundTypeFilter) filters.round_type = roundTypeFilter;
      if (statusFilter) filters.status = statusFilter;

      await applicationService.sendBulkEmail(filters);
      
      toast({
        title: 'موفق',
        description: `ایمیل برای ${estimatedCount} نفر ارسال شد`,
      });

      // Reset form
      setSubject('');
      setMessage('');
      setRoundTypeFilter('');
      setStatusFilter('');
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در ارسال ایمیل',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const emailTemplates = [
    {
      id: 'approval',
      title: 'اطلاع پذیرش',
      subject: 'نتیجه بررسی پرونده - تایید شده',
      message: 'با سلام\n\nپرونده شما با موفقیت تایید شد. لطفاً جهت ادامه فرآیند به سامانه مراجعه کنید.\n\nبا تشکر',
    },
    {
      id: 'rejection',
      title: 'اطلاع عدم پذیرش',
      subject: 'نتیجه بررسی پرونده',
      message: 'با سلام\n\nمتاسفانه پرونده شما در این مرحله تایید نشد. در صورت نیاز به توضیحات با دفتر تماس بگیرید.\n\nبا تشکر',
    },
    {
      id: 'interview',
      title: 'دعوت به مصاحبه',
      subject: 'دعوت به مصاحبه - فراخوان پذیرش دکتری',
      message: 'با سلام\n\nبدینوسیله شما به مصاحبه دعوت می‌شوید. زمان و مکان مصاحبه از طریق سامانه اعلام خواهد شد.\n\nبا تشکر',
    },
    {
      id: 'deficiency',
      title: 'اطلاع نواقص',
      subject: 'نیاز به تکمیل مدارک',
      message: 'با سلام\n\nپرونده شما نیازمند تکمیل مدارک است. لطفاً به سامانه مراجعه کرده و نواقص را رفع نمایید.\n\nبا تشکر',
    },
    {
      id: 'reminder',
      title: 'یادآوری تکمیل پرونده',
      subject: 'یادآوری - تکمیل پرونده ثبت‌نام',
      message: 'با سلام\n\nپرونده ثبت‌نام شما ناقص است. لطفاً تا پایان مهلت نسبت به تکمیل آن اقدام فرمایید.\n\nبا تشکر',
    },
  ];

  const loadTemplate = (template: typeof emailTemplates[0]) => {
    setSubject(template.subject);
    setMessage(template.message);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">ارسال ایمیل گروهی</h1>
        <p className="text-muted-foreground">ارسال پیام به دسته‌بندی‌های مختلف متقاضیان</p>
      </div>

      {/* Warning Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>توجه:</strong> ایمیل برای تمام افراد منطبق با فیلترهای انتخابی ارسال خواهد شد. 
          لطفاً قبل از ارسال، دقت لازم را داشته باشید.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Email Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">قالب‌های آماده</CardTitle>
              <CardDescription>انتخاب قالب پیش‌فرض برای شروع سریع</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {emailTemplates.map((template) => (
                  <Button
                    key={template.id}
                    variant="outline"
                    className="h-auto flex-col items-start p-4 text-right"
                    onClick={() => loadTemplate(template)}
                  >
                    <Mail className="h-4 w-4 mb-2 text-primary" />
                    <span className="font-semibold">{template.title}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Email Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                محتوای ایمیل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subject */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  موضوع <span className="text-red-500">*</span>
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="موضوع ایمیل را وارد کنید"
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {subject.length}/200 کاراکتر
                </p>
              </div>

              {/* Message */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  متن پیام <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="متن کامل پیام خود را اینجا بنویسید..."
                  rows={12}
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {message.length}/2000 کاراکتر
                </p>
              </div>

              {/* Variables Info */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>متغیرهای قابل استفاده:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li><code>{'{{name}}'}</code> - نام و نام خانوادگی متقاضی</li>
                    <li><code>{'{{tracking_code}}'}</code> - کد رهگیری پرونده</li>
                    <li><code>{'{{round_title}}'}</code> - عنوان فراخوان</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recipients Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                انتخاب دریافت‌کنندگان
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recipient Groups */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="applicants"
                    checked={includeApplicants}
                    onCheckedChange={(checked) => setIncludeApplicants(checked as boolean)}
                  />
                  <label htmlFor="applicants" className="text-sm font-medium cursor-pointer">
                    متقاضیان
                  </label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="admins"
                    checked={includeAdmins}
                    onCheckedChange={(checked) => setIncludeAdmins(checked as boolean)}
                  />
                  <label htmlFor="admins" className="text-sm font-medium cursor-pointer">
                    مدیران
                  </label>
                </div>
              </div>

              {includeApplicants && (
                <>
                  {/* Round Type Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">نوع فراخوان</label>
                    <Select value={roundTypeFilter} onValueChange={setRoundTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="همه" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">همه</SelectItem>
                        <SelectItem value="MA_TALENT">استعداد ارشد</SelectItem>
                        <SelectItem value="PHD_TALENT">استعداد دکتری</SelectItem>
                        <SelectItem value="PHD_EXAM">آزمون دکتری</SelectItem>
                        <SelectItem value="OLYMPIAD">المپیاد</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">وضعیت پرونده</label>
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ApplicationStatus)}>
                      <SelectTrigger>
                        <SelectValue placeholder="همه" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">همه</SelectItem>
                        <SelectItem value="SUBMITTED">ثبت شده</SelectItem>
                        <SelectItem value="UNDER_REVIEW">در حال بررسی</SelectItem>
                        <SelectItem value="APPROVED">تایید شده</SelectItem>
                        <SelectItem value="REJECTED">رد شده</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Estimated Count */}
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">تعداد تخمینی دریافت‌کنندگان</p>
                <p className="text-2xl font-bold text-blue-600">{estimatedCount || '~'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Send Button */}
          <Card>
            <CardContent className="pt-6">
              <Button
                className="w-full"
                size="lg"
                onClick={handleSendBulkEmail}
                disabled={loading || !subject || !message}
              >
                <Send className="h-5 w-5 ml-2" />
                {loading ? 'در حال ارسال...' : 'ارسال ایمیل گروهی'}
              </Button>
            </CardContent>
          </Card>

          {/* Safety Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">نکات ایمنی</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-3 w-3 mt-0.5 shrink-0 text-green-600" />
                <span>قبل از ارسال، متن را بازخوانی کنید</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-3 w-3 mt-0.5 shrink-0 text-green-600" />
                <span>فیلترها را دوباره بررسی نمایید</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-3 w-3 mt-0.5 shrink-0 text-green-600" />
                <span>از قالب‌های استاندارد استفاده کنید</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BulkEmailPage;
