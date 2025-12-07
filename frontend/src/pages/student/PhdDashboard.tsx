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
      const response = await api.get<{ results: Application[] }>('/api/applications/');
      
      const applications = Array.isArray(response.data) ? response.data : response.data.results || [];
      if (applications.length > 0) {
        const app = applications[0];
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
      link: '/phd/personal-info',
    },
    {
      id: 2,
      title: 'مدارک شناسایی',
      description: 'آپلود عکس، کارت ملی و شناسنامه',
      icon: IdCard,
      completed: stats.identityDocsComplete,
      link: '/phd/documents?category=identity',
    },
    {
      id: 3,
      title: 'سوابق تحصیلی',
      description: 'ثبت اطلاعات و مدارک کارشناسی و ارشد (امتیاز: 17)',
      icon: GraduationCap,
      completed: stats.bscEducationComplete && stats.mscEducationComplete && stats.educationDocsComplete,
      link: '/phd/education',
    },
    {
      id: 4,
      title: 'سوابق پژوهشی',
      description: 'ثبت مقالات، اختراعات، جوایز و...',
      icon: FlaskConical,
      completed: stats.researchRecordsAdded,
      link: '/phd/research-records',
    },
    {
      id: 5,
      title: 'المپیاد و زبان',
      description: 'ثبت سوابق المپیاد علمی و آزمون زبان',
      icon: Languages,
      completed: stats.olympiadOrLanguageAdded,
      link: '/phd/olympiad-language',
    },
    {
      id: 6,
      title: 'انتخاب رشته',
      description: 'انتخاب حداکثر 3 رشته با اولویت',
      icon: BookOpen,
      completed: stats.programSelected,
      link: '/phd/program-selection',
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
      await api.post(`/api/applications/${application.id}/submit/`);
      
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
          <h1 className="text-3xl font-bold">داشبورد ({application.tracking_code})</h1>
        </div>
        {getStatusBadge(application.status)}
      </div>

      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>چک‌لیست ثبت‌نام</CardTitle>
          <CardDescription>
            مراحل اصلی تکمیل پرونده دکتری
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/phd/personal-info')}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
              stats.personalInfoComplete ? 'bg-green-500 border-green-500' : 'border-muted-foreground'
            }`}>
              {stats.personalInfoComplete && <CheckCircle2 className="h-4 w-4 text-white" />}
            </div>
            <span className={stats.personalInfoComplete ? 'line-through text-muted-foreground' : ''}>تکمیل اطلاعات شخصی</span>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/phd/documents?category=identity')}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
              stats.identityDocsComplete ? 'bg-green-500 border-green-500' : 'border-muted-foreground'
            }`}>
              {stats.identityDocsComplete && <CheckCircle2 className="h-4 w-4 text-white" />}
            </div>
            <span className={stats.identityDocsComplete ? 'line-through text-muted-foreground' : ''}>آپلود مدارک شناسایی</span>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/phd/education')}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
              stats.bscEducationComplete && stats.mscEducationComplete && stats.educationDocsComplete ? 'bg-green-500 border-green-500' : 'border-muted-foreground'
            }`}>
              {stats.bscEducationComplete && stats.mscEducationComplete && stats.educationDocsComplete && <CheckCircle2 className="h-4 w-4 text-white" />}
            </div>
            <span className={(stats.bscEducationComplete && stats.mscEducationComplete && stats.educationDocsComplete) ? 'line-through text-muted-foreground' : ''}>ثبت سوابق تحصیلی</span>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/phd/research-records')}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
              stats.researchRecordsAdded ? 'bg-green-500 border-green-500' : 'border-muted-foreground'
            }`}>
              {stats.researchRecordsAdded && <CheckCircle2 className="h-4 w-4 text-white" />}
            </div>
            <span className={stats.researchRecordsAdded ? 'line-through text-muted-foreground' : ''}>ثبت سوابق پژوهشی</span>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/phd/olympiad-language')}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
              stats.olympiadOrLanguageAdded ? 'bg-green-500 border-green-500' : 'border-muted-foreground'
            }`}>
              {stats.olympiadOrLanguageAdded && <CheckCircle2 className="h-4 w-4 text-white" />}
            </div>
            <span className={stats.olympiadOrLanguageAdded ? 'line-through text-muted-foreground' : ''}>ثبت المپیاد یا مدرک زبان</span>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/phd/program-selection')}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
              stats.programSelected ? 'bg-green-500 border-green-500' : 'border-muted-foreground'
            }`}>
              {stats.programSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
            </div>
            <span className={stats.programSelected ? 'line-through text-muted-foreground' : ''}>انتخاب رشته</span>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
              application.interview?.status === 'COMPLETED' ? 'bg-green-500 border-green-500' : 'border-muted-foreground'
            }`}>
              {application.interview?.status === 'COMPLETED' && <CheckCircle2 className="h-4 w-4 text-white" />}
            </div>
            <span className={application.interview?.status === 'COMPLETED' ? 'line-through text-muted-foreground' : ''}>
              شرکت در مصاحبه {application.interview?.scheduled_date && `(${new Date(application.interview.scheduled_date).toLocaleDateString('fa-IR')})`}
            </span>
          </div>
          
          <Separator className="my-2" />
          
          <div className="text-center text-sm text-muted-foreground">
            {Object.values(stats).filter(Boolean).length + (application.interview?.status === 'COMPLETED' ? 1 : 0)} از {Object.keys(stats).length + 1} مرحله تکمیل شده
          </div>
        </CardContent>
      </Card>

      {/* Quick Access to Scores */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            جزئیات امتیازات
          </CardTitle>
          <CardDescription>
            مشاهده کامل امتیازات دریافتی در تمام بخش‌ها
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => navigate('/phd/scores')} 
            className="w-full"
            variant="default"
          >
            <Award className="ml-2 h-4 w-4" />
            مشاهده جزئیات امتیازات
          </Button>
        </CardContent>
      </Card>

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
