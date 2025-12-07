import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Edit,
  Eye,
  BookOpen,
  GraduationCap,
  IdCard,
  FilePlus,
  User,
  Award,
} from 'lucide-react';
import api from '@/services/api';
import type { Application, ApplicationStatus } from '@/types/models';

interface DashboardStats {
  personalInfoComplete: boolean;
  identityDocsComplete: boolean;
  educationInfoComplete: boolean;
  educationDocsComplete: boolean;
  programSelected: boolean;
  scientificRecordsAdded: boolean;
}

const Dashboard = () => {
  const [application, setApplication] = useState<Application | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    personalInfoComplete: false,
    identityDocsComplete: false,
    educationInfoComplete: false,
    educationDocsComplete: false,
    programSelected: false,
    scientificRecordsAdded: false,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🚀 Dashboard جدید لود شد - نسخه 2.0!');
    fetchApplication();
  }, []);

  const fetchApplication = async () => {
    setLoading(true);
    try {
      console.log('📡 Fetching applications...');
      const response = await api.get<Application[]>('/api/applicant/applications/');
      console.log('✅ Response:', response.data);
      
      if (response.data.length > 0) {
        const app = response.data[0];
        setApplication(app);
        console.log('✅ Application found:', app);
        
        // محاسبه وضعیت تکمیل بخش‌ها
        setStats({
          programSelected: app.status !== 'NEW',
          personalInfoComplete: ['PERSONAL_INFO_COMPLETED', 'IDENTITY_DOCS_UPLOADED', 'EDU_INFO_COMPLETED', 'EDU_DOCS_UPLOADED', 'SUBMITTED'].includes(app.status),
          identityDocsComplete: ['IDENTITY_DOCS_UPLOADED', 'EDU_INFO_COMPLETED', 'EDU_DOCS_UPLOADED', 'SUBMITTED'].includes(app.status),
          educationInfoComplete: ['EDU_INFO_COMPLETED', 'EDU_DOCS_UPLOADED', 'SUBMITTED'].includes(app.status),
          educationDocsComplete: ['EDU_DOCS_UPLOADED', 'SUBMITTED'].includes(app.status),
          scientificRecordsAdded: app.status === 'SUBMITTED',
        });
      } else {
        console.log('⚠️ No applications found - User needs to complete registration');
      }
    } catch (error: unknown) {
      console.error('❌ Error fetching applications:', error);
      
      // اگر 404 بود یعنی هنوز application نساخته
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status: number } };
        if (axiosError.response?.status === 404) {
          console.log('ℹ️ Application not found - showing empty state');
        } else {
          toast({
            title: 'خطا در بارگذاری',
            description: 'اطلاعات درخواست بارگذاری نشد',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'خطا در بارگذاری',
          description: 'اطلاعات درخواست بارگذاری نشد',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const statusConfig: Partial<Record<
    ApplicationStatus,
    { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ComponentType<{ className?: string }> }
  >> = {
    DRAFT: { label: 'پیش‌نویس', variant: 'secondary', icon: Edit },
    SUBMITTED: { label: 'ارسال شده', variant: 'default', icon: Clock },
    UNDER_REVIEW: { label: 'در حال بررسی', variant: 'outline', icon: AlertCircle },
    APPROVED: { label: 'تایید شده', variant: 'default', icon: CheckCircle2 },
    REJECTED: { label: 'رد شده', variant: 'destructive', icon: XCircle },
    PENDING_DOCUMENTS: { label: 'نیازمند مدارک', variant: 'outline', icon: FileText },
  };

  const calculateProgress = () => {
    if (!application) return 0;
    let completed = 0;
    const total = 5;

    if (application.program_choices && application.program_choices.length > 0) completed++;
    if (user?.father_name && user?.birth_date && user?.gender) completed++;
    if (application.education_records && application.education_records.length > 0) completed++;
    if (
      application.research_records &&
      (application.research_records.length > 0 || ['MA_TALENT', 'OLYMPIAD'].includes(application.round_type))
    ) {
      completed++;
    }
    if (application.documents && application.documents.length >= 4) completed++;

    return Math.round((completed / total) * 100);
  };

  const roundTypeLabels = {
    MA_TALENT: 'کارشناسی ارشد استعداد درخشان',
    PHD_TALENT: 'دکتری استعداد درخشان',
    PHD_EXAM: 'دکتری آزمون',
    OLYMPIAD: 'المپیاد علمی',
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-12">
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">درخواستی یافت نشد</h3>
            <p className="text-muted-foreground mb-4">شما هنوز درخواستی ثبت نکرده‌اید</p>
            <Button onClick={() => navigate('/masters/wizard')}>شروع ثبت‌نام</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = statusConfig[application.status] || { label: application.status, variant: 'outline' as const, icon: AlertCircle };
  const StatusIcon = statusInfo.icon;

  const completionPercentage = () => {
    const completed = Object.values(stats).filter(Boolean).length;
    return Math.round((completed / Object.keys(stats).length) * 100);
  };

  const isMAOrPhDTalent = application.round_type === 'MA_TALENT' || application.round_type === 'PHD_TALENT';
  const isPhdTalent = application.round_type === 'PHD_TALENT';

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">داشبورد ({application.tracking_code})</h1>
        </div>
        <div className="flex items-center gap-2">
          <StatusIcon className="h-5 w-5" />
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
      </div>
      {/* انتخاب رشته - اگر هنوز انتخاب نکرده */}
      {!stats.programSelected && (
        <Card className="mb-6 border-primary bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">انتخاب رشته</h3>
                  <p className="text-sm text-muted-foreground">
                    برای ادامه فرآیند ثبت‌نام، ابتدا رشته‌های مورد نظر خود را انتخاب کنید
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate('/masters/program-selection')} size="lg">
                <GraduationCap className="ml-2 h-5 w-5" />
                انتخاب رشته
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>چک‌لیست ثبت‌نام</CardTitle>
          <CardDescription>
            مراحل اصلی تکمیل پرونده کارشناسی ارشد
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/masters/program-selection')}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
              stats.programSelected ? 'bg-green-500 border-green-500' : 'border-muted-foreground'
            }`}>
              {stats.programSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
            </div>
            <span className={stats.programSelected ? 'line-through text-muted-foreground' : ''}>انتخاب رشته</span>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/masters/personal-info')}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
              stats.personalInfoComplete ? 'bg-green-500 border-green-500' : 'border-muted-foreground'
            }`}>
              {stats.personalInfoComplete && <CheckCircle2 className="h-4 w-4 text-white" />}
            </div>
            <span className={stats.personalInfoComplete ? 'line-through text-muted-foreground' : ''}>تکمیل اطلاعات شخصی</span>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/masters/documents?category=identity')}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
              stats.identityDocsComplete ? 'bg-green-500 border-green-500' : 'border-muted-foreground'
            }`}>
              {stats.identityDocsComplete && <CheckCircle2 className="h-4 w-4 text-white" />}
            </div>
            <span className={stats.identityDocsComplete ? 'line-through text-muted-foreground' : ''}>آپلود مدارک شناسایی</span>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/masters/education')}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
              stats.educationInfoComplete ? 'bg-green-500 border-green-500' : 'border-muted-foreground'
            }`}>
              {stats.educationInfoComplete && <CheckCircle2 className="h-4 w-4 text-white" />}
            </div>
            <span className={stats.educationInfoComplete ? 'line-through text-muted-foreground' : ''}>ثبت سوابق تحصیلی</span>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/masters/documents?category=education')}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
              stats.educationDocsComplete ? 'bg-green-500 border-green-500' : 'border-muted-foreground'
            }`}>
              {stats.educationDocsComplete && <CheckCircle2 className="h-4 w-4 text-white" />}
            </div>
            <span className={stats.educationDocsComplete ? 'line-through text-muted-foreground' : ''}>آپلود مدارک تحصیلی</span>
          </div>
          
          {isMAOrPhDTalent && (
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/masters/scientific-records')}>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                stats.scientificRecordsAdded ? 'bg-green-500 border-green-500' : 'border-muted-foreground'
              }`}>
                {stats.scientificRecordsAdded && <CheckCircle2 className="h-4 w-4 text-white" />}
              </div>
              <span className={stats.scientificRecordsAdded ? 'line-through text-muted-foreground' : ''}>ثبت سوابق علمی (اختیاری)</span>
            </div>
          )}
          
          <Separator className="my-2" />
          
          <div className="text-center text-sm text-muted-foreground">
            {Object.values(stats).filter(Boolean).length} از {Object.keys(stats).length} مرحله تکمیل شده
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


export default Dashboard;
