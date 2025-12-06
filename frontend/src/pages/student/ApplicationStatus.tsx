import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import api from '@/services/api';
import { toast } from '@/hooks/use-toast';

const ApplicationStatus = () => {
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<any>(null);

  useEffect(() => {
    fetchApplicationStatus();
  }, []);

  const fetchApplicationStatus = async () => {
    try {
      const response = await api.get('/api/applications/');
      if (response.data.results && response.data.results.length > 0) {
        setApplication(response.data.results[0]);
      }
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'دریافت وضعیت پرونده با خطا مواجه شد',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any; icon: any }> = {
      NEW: { label: 'جدید', variant: 'default', icon: Clock },
      PROGRAM_SELECTED: { label: 'انتخاب رشته', variant: 'default', icon: Clock },
      PERSONAL_INFO_COMPLETED: { label: 'اطلاعات شخصی تکمیل شده', variant: 'secondary', icon: Clock },
      IDENTITY_DOCS_UPLOADED: { label: 'مدارک شناسایی بارگذاری شده', variant: 'secondary', icon: Clock },
      EDU_INFO_COMPLETED: { label: 'اطلاعات تحصیلی تکمیل شده', variant: 'secondary', icon: Clock },
      EDU_DOCS_UPLOADED: { label: 'مدارک تحصیلی بارگذاری شده', variant: 'secondary', icon: Clock },
      SUBMITTED: { label: 'ارسال شده', variant: 'default', icon: CheckCircle },
      UNDER_UNIVERSITY_REVIEW: { label: 'در حال بررسی (دانشگاه)', variant: 'default', icon: Clock },
      UNIVERSITY_APPROVED: { label: 'تایید شده (دانشگاه)', variant: 'secondary', icon: CheckCircle },
      UNIVERSITY_REJECTED: { label: 'رد شده (دانشگاه)', variant: 'destructive', icon: XCircle },
      UNDER_FACULTY_REVIEW: { label: 'در حال بررسی (دانشکده)', variant: 'default', icon: Clock },
      FACULTY_APPROVED: { label: 'تایید شده (دانشکده)', variant: 'secondary', icon: CheckCircle },
      FACULTY_REJECTED: { label: 'رد شده (دانشکده)', variant: 'destructive', icon: XCircle },
      ACCEPTED: { label: 'پذیرفته شده', variant: 'default', icon: CheckCircle },
      REJECTED: { label: 'رد شده', variant: 'destructive', icon: XCircle },
      HAS_DEFICIENCY: { label: 'دارای نقص', variant: 'destructive', icon: XCircle },
      DEFICIENCY_RESOLVED: { label: 'نقص رفع شده', variant: 'secondary', icon: CheckCircle },
    };

    return statusMap[status] || { label: status, variant: 'default', icon: Clock };
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive">
          <AlertDescription>
            درخواستی یافت نشد
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const statusInfo = getStatusInfo(application.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-primary" />
          وضعیت پرونده
        </h1>
        <p className="text-muted-foreground mt-2">
          کد پیگیری: <span className="font-mono font-bold">{application.tracking_code}</span>
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>وضعیت فعلی</span>
            <Badge variant={statusInfo.variant} className="text-base">
              <StatusIcon className="ml-2 h-4 w-4" />
              {statusInfo.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">نوع فراخوان</p>
              <p className="font-medium">{application.round_type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">تاریخ ثبت‌نام</p>
              <p className="font-medium">
                {new Date(application.created_at).toLocaleDateString('fa-IR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">آخرین بروزرسانی</p>
              <p className="font-medium">
                {new Date(application.updated_at).toLocaleDateString('fa-IR')}
              </p>
            </div>
          </div>

          {application.status === 'SUBMITTED' && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                درخواست شما ارسال شده و در انتظار بررسی است. فرآیند بررسی معمولاً 7-10 روز کاری طول می‌کشد.
              </AlertDescription>
            </Alert>
          )}

          {application.status === 'UNIVERSITY_APPROVED' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                درخواست شما توسط کارشناس دانشگاه تایید شده و در حال ارسال به دانشکده است.
              </AlertDescription>
            </Alert>
          )}

          {application.status === 'FACULTY_APPROVED' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                درخواست شما توسط کارشناس دانشکده تایید شده است.
              </AlertDescription>
            </Alert>
          )}

          {application.status === 'ACCEPTED' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-700 font-medium">
                تبریک! درخواست شما پذیرفته شده است. لطفاً منتظر اطلاعیه‌های بعدی باشید.
              </AlertDescription>
            </Alert>
          )}

          {(application.status === 'REJECTED' || application.status === 'UNIVERSITY_REJECTED' || application.status === 'FACULTY_REJECTED') && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                متاسفانه درخواست شما رد شده است. برای اطلاعات بیشتر با کارشناسان تماس بگیرید.
              </AlertDescription>
            </Alert>
          )}

          {application.status === 'HAS_DEFICIENCY' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                پرونده شما دارای نقص است. لطفاً به بخش نقص‌ها مراجعه کرده و نقص‌ها را رفع نمایید.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplicationStatus;
