import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Award, 
  GraduationCap, 
  FlaskConical, 
  Trophy, 
  Languages,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import api from '@/services/api';

interface ScoreBreakdown {
  bsc_duration: number;
  bsc_university_gpa: number;
  msc_duration: number;
  msc_university_gpa: number;
  bsc_total: number;
  msc_total: number;
  education_total: number;
  
  // برای آینده
  research_total: number;
  olympiad_language_total: number;
  
  grand_total: number;
  max_possible: number;
}

const ScoresOverview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<ScoreBreakdown | null>(null);

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/applications/');
      
      const applications = Array.isArray(response.data) ? response.data : response.data.results || [];
      if (applications.length > 0) {
        const app = applications[0];
        calculateScores(app);
      }
    } catch (error) {
      console.error('Error fetching scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateScores = (app: any) => {
    const bscRecord = app.education_records?.find((e: any) => e.degree_level === 'BSC');
    const mscRecord = app.education_records?.find((e: any) => e.degree_level === 'MSC');

    // محاسبه امتیاز کارشناسی
    let bscDurationScore = 0;
    let bscUniversityGpaScore = 0;
    
    if (bscRecord) {
      // امتیاز طول دوره (حداکثر 3)
      if (bscRecord.duration_months <= 48) bscDurationScore = 3;
      else if (bscRecord.duration_months <= 54) bscDurationScore = 2;
      else if (bscRecord.duration_months <= 60) bscDurationScore = 1;

      // امتیاز دانشگاه + معدل (حداکثر 6)
      if (bscRecord.gpa >= 18) bscUniversityGpaScore = 6;
      else if (bscRecord.gpa >= 17) bscUniversityGpaScore = 5;
      else if (bscRecord.gpa >= 16) bscUniversityGpaScore = 4;
      else if (bscRecord.gpa >= 15) bscUniversityGpaScore = 3;
      else if (bscRecord.gpa >= 14) bscUniversityGpaScore = 2;
      else if (bscRecord.gpa >= 12) bscUniversityGpaScore = 1;
    }

    // محاسبه امتیاز ارشد
    let mscDurationScore = 0;
    let mscUniversityGpaScore = 0;
    
    if (mscRecord) {
      // امتیاز طول دوره (حداکثر 3)
      if (mscRecord.duration_months <= 24) mscDurationScore = 3;
      else if (mscRecord.duration_months <= 30) mscDurationScore = 2;
      else if (mscRecord.duration_months <= 36) mscDurationScore = 1;

      // امتیاز دانشگاه + معدل (حداکثر 5)
      if (mscRecord.gpa >= 18) mscUniversityGpaScore = 5;
      else if (mscRecord.gpa >= 17) mscUniversityGpaScore = 4;
      else if (mscRecord.gpa >= 16) mscUniversityGpaScore = 3;
      else if (mscRecord.gpa >= 15) mscUniversityGpaScore = 2;
      else if (mscRecord.gpa >= 14) mscUniversityGpaScore = 1;
    }

    const bscTotal = bscDurationScore + bscUniversityGpaScore;
    const mscTotal = mscDurationScore + mscUniversityGpaScore;
    const educationTotal = bscTotal + mscTotal;

    // امتیازات آینده (فعلاً صفر)
    const researchTotal = 0;
    const olympiadLanguageTotal = 0;

    const grandTotal = educationTotal + researchTotal + olympiadLanguageTotal;
    const maxPossible = 17; // فعلاً فقط تحصیلات

    setScores({
      bsc_duration: bscDurationScore,
      bsc_university_gpa: bscUniversityGpaScore,
      msc_duration: mscDurationScore,
      msc_university_gpa: mscUniversityGpaScore,
      bsc_total: bscTotal,
      msc_total: mscTotal,
      education_total: educationTotal,
      research_total: researchTotal,
      olympiad_language_total: olympiadLanguageTotal,
      grand_total: grandTotal,
      max_possible: maxPossible,
    });
  };

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'bg-green-600';
    if (percentage >= 60) return 'bg-blue-600';
    if (percentage >= 40) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!scores) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            اطلاعاتی برای نمایش امتیازات یافت نشد. لطفاً ابتدا فرم‌های مربوطه را تکمیل کنید.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const completionPercentage = (scores.grand_total / scores.max_possible) * 100;

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Award className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">جزئیات امتیازات</h1>
        </div>
        <p className="text-muted-foreground">
          مشاهده تمام امتیازات دریافتی در بخش‌های مختلف
        </p>
      </div>

      {/* امتیاز کل */}
      <Card className="mb-6 border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              امتیاز کل
            </span>
            <Badge variant="outline" className="text-2xl px-4 py-2">
              <span className={`font-bold ${getScoreColor(scores.grand_total, scores.max_possible)}`}>
                {scores.grand_total}
              </span>
              <span className="text-muted-foreground mx-2">/</span>
              <span className="text-muted-foreground">{scores.max_possible}</span>
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress 
            value={completionPercentage} 
            className="h-4"
          />
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {completionPercentage.toFixed(1)}% از امتیاز کل
          </p>
        </CardContent>
      </Card>

      {/* سوابق تحصیلی */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              سوابق تحصیلی
            </span>
            <Badge variant={scores.education_total > 0 ? "default" : "secondary"}>
              {scores.education_total} از 17 امتیاز
            </Badge>
          </CardTitle>
          <CardDescription>
            امتیازات مربوط به مدارک کارشناسی و کارشناسی ارشد
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* کارشناسی */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                کارشناسی
              </h3>
              <Badge variant="outline" className="bg-blue-50">
                {scores.bsc_total} از 9 امتیاز
              </Badge>
            </div>
            
            <div className="space-y-3 pr-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">طول دوره تحصیلی</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {scores.bsc_duration} / 3
                  </Badge>
                  {scores.bsc_duration > 0 && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">دانشگاه و معدل</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {scores.bsc_university_gpa} / 6
                  </Badge>
                  {scores.bsc_university_gpa > 0 && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* ارشد */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                کارشناسی ارشد
              </h3>
              <Badge variant="outline" className="bg-green-50">
                {scores.msc_total} از 8 امتیاز
              </Badge>
            </div>
            
            <div className="space-y-3 pr-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">طول دوره تحصیلی</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {scores.msc_duration} / 3
                  </Badge>
                  {scores.msc_duration > 0 && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">دانشگاه و معدل</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {scores.msc_university_gpa} / 5
                  </Badge>
                  {scores.msc_university_gpa > 0 && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                </div>
              </div>
            </div>
          </div>

          {scores.education_total < 17 && (
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                با تکمیل اطلاعات تحصیلی می‌توانید حداکثر {17 - scores.education_total} امتیاز بیشتر کسب کنید.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* سوابق پژوهشی */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              سوابق پژوهشی
            </span>
            <Badge variant={scores.research_total > 0 ? "default" : "secondary"}>
              {scores.research_total} امتیاز
            </Badge>
          </CardTitle>
          <CardDescription>
            امتیازات مربوط به مقالات، اختراعات، و جوایز علمی - هر مورد جداگانه امتیازدهی می‌شود
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">مقالات پژوهشی</span>
                <Badge variant="outline">0 مورد</Badge>
              </div>
              <p className="text-xs text-muted-foreground">هر مقاله بر اساس رتبه نشریه امتیاز می‌گیرد</p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">مقالات ترویجی</span>
                <Badge variant="outline">0 مورد</Badge>
              </div>
              <p className="text-xs text-muted-foreground">مقالات ترویجی و کنفرانسی</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">اختراعات</span>
                <Badge variant="outline">0 مورد</Badge>
              </div>
              <p className="text-xs text-muted-foreground">ثبت اختراع داخلی یا بین‌المللی</p>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">جوایز علمی</span>
                <Badge variant="outline">0 مورد</Badge>
              </div>
              <p className="text-xs text-muted-foreground">جوایز ملی و بین‌المللی</p>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">کتاب‌ها</span>
                <Badge variant="outline">0 مورد</Badge>
              </div>
              <p className="text-xs text-muted-foreground">تالیف و ترجمه کتاب</p>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">پروژه‌های تحقیقاتی</span>
                <Badge variant="outline">0 مورد</Badge>
              </div>
              <p className="text-xs text-muted-foreground">پروژه‌های ملی و بین‌المللی</p>
            </div>
          </div>
          
          {scores.research_total === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                برای دکتری استعداد درخشان، حداقل ۷ امتیاز پژوهشی الزامی است.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* المپیاد علمی */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              المپیاد علمی
            </span>
            <Badge variant="secondary">
              0 امتیاز
            </Badge>
          </CardTitle>
          <CardDescription>
            امتیازات مربوط به المپیادهای علمی ملی و بین‌المللی
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">المپیاد فیزیک</span>
              <Badge variant="outline">0 مورد</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">المپیاد شیمی</span>
              <Badge variant="outline">0 مورد</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">المپیاد ریاضی</span>
              <Badge variant="outline">0 مورد</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">المپیاد کامپیوتر</span>
              <Badge variant="outline">0 مورد</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">سایر المپیادها</span>
              <Badge variant="outline">0 مورد</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* مدارک زبان */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              مدارک زبان
            </span>
            <Badge variant="secondary">
              0 امتیاز
            </Badge>
          </CardTitle>
          <CardDescription>
            امتیازات مربوط به آزمون‌های زبان معتبر (حداکثر ۸ امتیاز)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <span className="text-sm font-medium">زبان انگلیسی</span>
                <p className="text-xs text-muted-foreground">TOEFL, IELTS, GRE, MSRT, EPT</p>
              </div>
              <Badge variant="outline">0 مورد</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <span className="text-sm font-medium">سایر زبان‌ها</span>
                <p className="text-xs text-muted-foreground">فرانسه، آلمانی، عربی</p>
              </div>
              <Badge variant="outline">0 مورد</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* امتیاز مصاحبه */}
      <Card className="mb-6 border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              امتیاز مصاحبه
            </span>
            <Badge variant="default">
              0 از 30 امتیاز
            </Badge>
          </CardTitle>
          <CardDescription>
            امتیازات دریافتی از مصاحبه تخصصی (بعد از برگزاری)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
            <span className="text-sm">تشارک در تجربه و تحلیل مسائل علمی</span>
            <Badge variant="secondary" className="text-xs">0 / 3</Badge>
          </div>
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
            <span className="text-sm">وسعت نظر، خلاقیت و کاربردی‌بودن</span>
            <Badge variant="secondary" className="text-xs">0 / 3</Badge>
          </div>
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
            <span className="text-sm">شخصیت، صحت و حجم بیان</span>
            <Badge variant="secondary" className="text-xs">0 / 3</Badge>
          </div>
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
            <span className="text-sm">نگارش و مدارک فراواحد مرتبط</span>
            <Badge variant="secondary" className="text-xs">0 / 3</Badge>
          </div>
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
            <span className="text-sm">فن بیان و احتمال موفقیت</span>
            <Badge variant="secondary" className="text-xs">0 / 3</Badge>
          </div>
          <div className="flex items-center justify-between p-2 bg-primary/10 rounded">
            <span className="text-sm font-semibold">همراستایی پژوهشی با آزمایشگاه‌ها</span>
            <Badge variant="default" className="text-xs">0 / 15</Badge>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              امتیاز مصاحبه بعد از تشکیل جلسه و اعلام کارشناس در اینجا نمایش داده خواهد شد.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* دکمه‌های پایین */}
      <div className="flex gap-4">
        <Button
          onClick={() => navigate('/phd/education')}
          className="flex-1"
        >
          ویرایش اطلاعات تحصیلی
          <ArrowRight className="mr-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ScoresOverview;
