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
  FlaskConical,
  Trophy,
  Languages,
} from 'lucide-react';
import api from '@/services/api';
import type { Application } from '@/types/models';

interface PhdDashboardStats {
  personalInfoComplete: boolean;
  identityDocsComplete: boolean;
  bscEducationComplete: boolean;
  mscEducationComplete: boolean;
  educationDocsComplete: boolean;
  programSelected: boolean;
  researchRecordsAdded: boolean;
  olympiadOrLanguageAdded: boolean;
}

const PhdDashboard = () => {
  const [application, setApplication] = useState<Application | null>(null);
  const [stats, setStats] = useState<PhdDashboardStats>({
    personalInfoComplete: false,
    identityDocsComplete: false,
    bscEducationComplete: false,
    mscEducationComplete: false,
    educationDocsComplete: false,
    programSelected: false,
    researchRecordsAdded: false,
    olympiadOrLanguageAdded: false,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const completionPercentage = Object.values(stats).filter(Boolean).length / Object.keys(stats).length * 100;

  useEffect(() => {
    fetchApplication();
  }, []);

  const fetchApplication = async () => {
    setLoading(true);
    try {
      const response = await api.get<{ results: Application[] }>('/api/applicant/applications/');
      
      if (response.data.results && response.data.results.length > 0) {
        const app = response.data.results[0];
        setApplication(app);
        calculateStats(app);
      }
    } catch (error: any) {
      console.error('Error fetching application:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری اطلاعات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (app: Application) => {
    const newStats: PhdDashboardStats = {
      personalInfoComplete: !!(app.applicant?.user?.gender && app.applicant?.user?.birth_year),
      identityDocsComplete: (app.documents?.filter((d: any) => 
        ['PERSONAL_PHOTO', 'NATIONAL_CARD', 'ID_CARD'].includes(d.type)
      ).length || 0) >= 3,
      bscEducationComplete: (app.education_records?.filter((e: any) => 
        e.degree_level === 'BSC'
      ).length || 0) >= 1,
      mscEducationComplete: (app.education_records?.filter((e: any) => 
        e.degree_level === 'MSC'
      ).length || 0) >= 1,
      educationDocsComplete: (app.documents?.filter((d: any) => 
        ['BSC_CERT', 'BSC_TRANSCRIPT', 'MSC_CERT', 'MSC_TRANSCRIPT'].includes(d.type)
      ).length || 0) >= 4,
      programSelected: (app.choices?.length || 0) > 0,
      researchRecordsAdded: (app.research_records?.length || 0) > 0,
      olympiadOrLanguageAdded: false, // TODO: Check olympiad/language records when backend is ready
    };
    
    setStats(newStats);
  };

  const getStatusBadge = (status?: string) => {
    const statusConfig: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
      NEW: { label: 'جدید', variant: 'secondary' },
      PERSONAL_INFO_COMPLETED: { label: 'اطلاعات شخصی تکمیل شده', variant: 'default' },
      SUBMITTED: { label: 'ارسال شده', variant: 'default' },
      UNDER_UNIVERSITY_REVIEW: { label: 'در حال بررسی دانشگاه', variant: 'default' },
      UNDER_FACULTY_REVIEW: { label: 'در حال بررسی دانشکده', variant: 'default' },
      COMPLETED: { label: 'تکمیل شده', variant: 'default' },
      REJECTED: { label: 'رد شده', variant: 'destructive' },
    };

    const config = statusConfig[status || 'NEW'] || { label: 'نامشخص', variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            درخواستی یافت نشد. لطفاً ابتدا ثبت‌نام کنید.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const steps = [
    {
      id: 1,
      title: 'اطلاعات شخصی',
      description: 'تکمیل اطلاعات هویتی و شناسنامه‌ای',
      icon: User,
      completed: stats.personalInfoComplete,
      link: '/student/personal-info',
    },
    {
      id: 2,
      title: 'مدارک شناسایی',
      description: 'آپلود عکس، کارت ملی و شناسنامه',
      icon: IdCard,
      completed: stats.identityDocsComplete,
      link: '/student/documents?category=identity',
    },
    {
      id: 3,
      title: 'سوابق تحصیلی - کارشناسی',
      description: 'ثبت اطلاعات مقطع کارشناسی',
      icon: GraduationCap,
      completed: stats.bscEducationComplete,
      link: '/student/phd/education/bsc',
    },
    {
      id: 4,
      title: 'سوابق تحصیلی - ارشد',
      description: 'ثبت اطلاعات مقطع کارشناسی ارشد',
      icon: GraduationCap,
      completed: stats.mscEducationComplete,
      link: '/student/phd/education/msc',
    },
    {
      id: 5,
      title: 'مدارک تحصیلی',
      description: 'آپلود مدارک و ریزنمرات کارشناسی و ارشد',
      icon: FileText,
      completed: stats.educationDocsComplete,
      link: '/student/phd/documents/education',
    },
    {
      id: 6,
      title: 'سوابق پژوهشی',
      description: 'ثبت مقالات، اختراعات، جوایز و...',
      icon: FlaskConical,
      completed: stats.researchRecordsAdded,
      link: '/student/phd/research-records',
    },
    {
      id: 7,
      title: 'المپیاد و زبان',
      description: 'ثبت سوابق المپیاد علمی و آزمون زبان',
      icon: Languages,
      completed: stats.olympiadOrLanguageAdded,
      link: '/student/phd/olympiad-language',
    },
    {
      id: 8,
      title: 'انتخاب رشته',
      description: 'انتخاب حداکثر 3 رشته با اولویت',
      icon: BookOpen,
      completed: stats.programSelected,
      link: '/student/program-selection',
    },
  ];

  const handleSubmitApplication = async () => {
    if (!application) return;

    // Check if all required sections are complete
    const requiredComplete = stats.personalInfoComplete &&
      stats.identityDocsComplete &&
      stats.bscEducationComplete &&
      stats.mscEducationComplete &&
      stats.educationDocsComplete &&
      stats.programSelected;

    if (!requiredComplete) {
      toast({
        title: 'ناقص',
        description: 'لطفاً ابتدا تمام بخش‌های الزامی را تکمیل کنید',
        variant: 'destructive',
      });
      return;
    }

    try {
      await api.post(`/api/applicant/applications/${application.id}/submit/`);
      
      toast({
        title: 'موفق',
        description: 'درخواست شما با موفقیت ارسال شد',
      });
      
      fetchApplication();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در ارسال درخواست',
        variant: 'destructive',
      });
    }
  };

  const canSubmit = application.status === 'NEW' || application.status === 'PERSONAL_INFO_COMPLETED';

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">داشبورد - دکتری استعداد درخشان</h1>
          <p className="text-muted-foreground mt-1">
            کد پیگیری: <span className="font-mono font-bold">{application.tracking_code}</span>
          </p>
        </div>
        {getStatusBadge(application.status)}
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle>پیشرفت تکمیل پرونده</CardTitle>
          <CardDescription>
            {Math.round(completionPercentage)}% تکمیل شده
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={completionPercentage} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            {Object.values(stats).filter(Boolean).length} از {Object.keys(stats).length} بخش تکمیل شده
          </p>
        </CardContent>
      </Card>

      {/* Important Notice for PhD */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>توجه:</strong> برای دکتری استعداد درخشان، حداقل ۷ امتیاز پژوهشی الزامی است. 
          سوابق پژوهشی خود را با دقت و کامل ثبت کنید.
        </AlertDescription>
      </Alert>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map((step) => (
          <Card
            key={step.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              step.completed ? 'border-green-500 bg-green-50/50' : ''
            }`}
            onClick={() => navigate(step.link)}
          >
            <CardHeader className="flex flex-row items-center gap-4">
              <div className={`p-3 rounded-full ${
                step.completed ? 'bg-green-500 text-white' : 'bg-muted'
              }`}>
                <step.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  {step.title}
                  {step.completed && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                </CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Research Records Summary */}
      {stats.researchRecordsAdded && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              خلاصه سوابق پژوهشی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{application.research_records?.length || 0}</p>
                <p className="text-sm text-muted-foreground">سوابق ثبت شده</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">
                  {application.research_records?.filter((r: any) => r.type === 'ARTICLE').length || 0}
                </p>
                <p className="text-sm text-muted-foreground">مقالات</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">
                  {application.research_records?.filter((r: any) => r.type === 'PATENT').length || 0}
                </p>
                <p className="text-sm text-muted-foreground">اختراعات</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              امتیازدهی نهایی توسط کمیته بررسی انجام خواهد شد
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        {canSubmit && (
          <Button
            onClick={handleSubmitApplication}
            size="lg"
            className="flex-1"
            disabled={completionPercentage < 100}
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            ارسال نهایی پرونده
          </Button>
        )}
        
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate('/student/status')}
        >
          <Eye className="mr-2 h-5 w-5" />
          مشاهده وضعیت
        </Button>
      </div>
    </div>
  );
};

export default PhdDashboard;
