import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle, XCircle, ArrowRight, FileText, User,
  GraduationCap, Building, Award, BookOpen, Star,
  Calendar, Clock, MessageSquare
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import applicationService from '@/services/applicationService';
import type { Application } from '@/types/models';

interface ScoringData {
  education_score: number;
  research_score: number;
  interview_score?: number;
  recommendation: string;
}

const FacultyApplicationReview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Review form
  const [approved, setApproved] = useState(true);
  const [comment, setComment] = useState('');
  const [recommendations, setRecommendations] = useState('');
  
  // Scoring
  const [educationScore, setEducationScore] = useState<number>(0);
  const [researchScore, setResearchScore] = useState<number>(0);
  const [interviewScore, setInterviewScore] = useState<number>(0);

  // Interview scheduling (for PHD_EXAM)
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewLocation, setInterviewLocation] = useState('');

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    setLoading(true);
    try {
      const data = await applicationService.getApplicationById(Number(id));
      setApplication(data);
      
      if (data.faculty_review_comment) {
        setComment(data.faculty_review_comment);
      }
      
      // Pre-fill scores if they exist
      if (data.education_score) setEducationScore(data.education_score);
      if (data.research_score) setResearchScore(data.research_score);
      if (data.interview_score) setInterviewScore(data.interview_score);
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: 'پرونده یافت نشد',
        variant: 'destructive',
      });
      navigate('/admin/faculty/applications');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleInterview = async () => {
    if (!interviewDate || !interviewTime || !interviewLocation) {
      toast({
        title: 'خطا',
        description: 'لطفاً تمام فیلدها را پر کنید',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      await applicationService.scheduleInterview(Number(id), {
        interview_datetime: `${interviewDate}T${interviewTime}`,
        location: interviewLocation,
      });

      toast({
        title: 'موفق',
        description: 'مصاحبه با موفقیت زمان‌بندی شد',
      });

      setShowInterviewForm(false);
      fetchApplication();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطایی رخ داد',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleScoreInterview = async () => {
    if (interviewScore < 0 || interviewScore > 100) {
      toast({
        title: 'خطا',
        description: 'نمره مصاحبه باید بین 0 تا 100 باشد',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      await applicationService.scoreInterview(Number(id), {
        score: interviewScore,
        interviewer_comment: comment,
      });

      toast({
        title: 'موفق',
        description: 'نمره مصاحبه ثبت شد',
      });

      fetchApplication();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطایی رخ داد',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!comment.trim()) {
      toast({
        title: 'خطا',
        description: 'لطفاً نظر خود را وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    // Validate scores
    if (educationScore < 0 || educationScore > 100) {
      toast({
        title: 'خطا',
        description: 'نمره تحصیلی باید بین 0 تا 100 باشد',
        variant: 'destructive',
      });
      return;
    }

    if (researchScore < 0 || researchScore > 100) {
      toast({
        title: 'خطا',
        description: 'نمره پژوهشی باید بین 0 تا 100 باشد',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      // First submit the review
      await applicationService.performFacultyReview(Number(id), {
        approved,
        comment: comment.trim(),
        recommendations: recommendations.trim(),
      });

      // Then submit scores
      await applicationService.scoreApplication(Number(id), {
        education_score: educationScore,
        research_score: researchScore,
        interview_score: application?.round_type === 'PHD_EXAM' ? interviewScore : undefined,
      });

      toast({
        title: 'موفق',
        description: 'بررسی و امتیازدهی با موفقیت ثبت شد',
      });

      navigate('/admin/faculty/applications');
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطایی رخ داد',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">در حال بارگذاری...</p>
      </div>
    );
  }

  if (!application) {
    return null;
  }

  const degreeLabels: Record<string, string> = {
    DIPLOMA: 'دیپلم',
    ASSOCIATE: 'کاردانی',
    BACHELOR: 'کارشناسی',
    MASTER: 'کارشناسی ارشد',
    PHD: 'دکتری',
  };

  const researchTypeLabels: Record<string, string> = {
    CONFERENCE_PAPER: 'مقاله کنفرانس',
    JOURNAL_PAPER: 'مقاله ژورنال',
    BOOK: 'کتاب',
    BOOK_CHAPTER: 'فصل کتاب',
    PATENT: 'ثبت اختراع',
    THESIS: 'پایان‌نامه',
    PROJECT: 'پروژه تحقیقاتی',
    OTHER: 'سایر',
  };

  const totalScore = educationScore + researchScore + (application.round_type === 'PHD_EXAM' ? interviewScore : 0);
  const maxScore = application.round_type === 'PHD_EXAM' ? 300 : 200;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/admin/faculty/applications')}>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">بررسی تخصصی پرونده</h1>
          <p className="text-muted-foreground">کد پیگیری: {application.tracking_code}</p>
        </div>
      </div>

      {/* Current Status Alert */}
      {application.faculty_review_completed && (
        <Alert className="mb-6">
          <AlertDescription>
            این پرونده قبلاً در تاریخ{' '}
            {application.faculty_reviewed_at && new Date(application.faculty_reviewed_at).toLocaleDateString('fa-IR')}{' '}
            بررسی شده است. نمره کل: {application.total_score || 0}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="info" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">اطلاعات</TabsTrigger>
              <TabsTrigger value="education">تحصیلی</TabsTrigger>
              <TabsTrigger value="research">پژوهشی</TabsTrigger>
              <TabsTrigger value="interview">مصاحبه</TabsTrigger>
            </TabsList>

            {/* Tab: Basic Info */}
            <TabsContent value="info" className="space-y-6">
              {/* Applicant Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    اطلاعات متقاضی
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">نام و نام خانوادگی:</span>
                      <p className="font-medium">
                        {application.applicant?.user.first_name} {application.applicant?.user.last_name}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">کد ملی:</span>
                      <p className="font-medium font-mono">{application.applicant?.user.national_id}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">موبایل:</span>
                      <p className="font-medium font-mono">{application.applicant?.user.mobile}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">ایمیل:</span>
                      <p className="font-medium">{application.applicant?.user.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Selected Programs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    رشته‌های انتخابی
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {application.selected_programs
                      ?.sort((a, b) => a.priority - b.priority)
                      .map((sp, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                          <Badge variant="outline" className="shrink-0">
                            اولویت {sp.priority}
                          </Badge>
                          <div>
                            <p className="font-medium">{sp.program?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {sp.program?.faculty?.name} - {sp.program?.department?.name}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Documents */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    مدارک ارسال شده
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {application.documents?.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{doc.document_type}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(doc.uploaded_at).toLocaleDateString('fa-IR')}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                            مشاهده
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Education Records */}
            <TabsContent value="education" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    سوابق تحصیلی
                  </CardTitle>
                  <CardDescription>
                    بررسی دقیق سوابق تحصیلی و محاسبه امتیاز
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {application.education_records?.map((edu, idx) => (
                      <div key={idx} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge>{degreeLabels[edu.degree_level]}</Badge>
                          <span className="font-medium">{edu.field_of_study}</span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>دانشگاه: {edu.university}</p>
                          <p>معدل: <strong className="text-lg text-foreground">{edu.gpa}</strong> از 20</p>
                          <p>سال‌های تحصیل: {edu.start_year} تا {edu.end_year}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-6" />

                  {/* Education Score Input */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      امتیاز تحصیلی (0-100) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={educationScore}
                      onChange={(e) => setEducationScore(Number(e.target.value))}
                      placeholder="امتیاز بر اساس معدل و رتبه"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      معیار: معدل + رتبه کنکور + نوع دانشگاه
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Research Records */}
            <TabsContent value="research" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    سوابق پژوهشی
                  </CardTitle>
                  <CardDescription>
                    بررسی مقالات، پروژه‌ها و فعالیت‌های تحقیقاتی
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {application.research_records && application.research_records.length > 0 ? (
                      application.research_records.map((research, idx) => (
                        <div key={idx} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {researchTypeLabels[research.record_type] || research.record_type}
                              </Badge>
                              {research.score > 0 && (
                                <Badge variant="outline" className="bg-green-50">
                                  <Star className="h-3 w-3 ml-1" />
                                  {research.score} امتیاز
                                </Badge>
                              )}
                            </div>
                          </div>
                          <h4 className="font-medium mb-1">{research.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{research.description}</p>
                          {research.publication_date && (
                            <p className="text-xs text-muted-foreground">
                              تاریخ انتشار: {new Date(research.publication_date).toLocaleDateString('fa-IR')}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4">
                        سابقه پژوهشی ثبت نشده است
                      </p>
                    )}
                  </div>

                  <Separator className="my-6" />

                  {/* Research Score Input */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      امتیاز پژوهشی (0-100) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={researchScore}
                      onChange={(e) => setResearchScore(Number(e.target.value))}
                      placeholder="امتیاز بر اساس کیفیت و کمیت تحقیقات"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      معیار: تعداد مقالات ISI/ISC + ضریب تاثیر + پروژه‌های تحقیقاتی
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Interview */}
            <TabsContent value="interview" className="space-y-6">
              {application.round_type === 'PHD_EXAM' ? (
                <>
                  {/* Interview Scheduling */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        زمان‌بندی مصاحبه
                      </CardTitle>
                      <CardDescription>
                        برای پرونده‌های آزمون دکتری، مصاحبه الزامی است
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {application.interview_datetime ? (
                        <Alert>
                          <Clock className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-1">
                              <p className="font-medium">مصاحبه زمان‌بندی شده است:</p>
                              <p>تاریخ و ساعت: {new Date(application.interview_datetime).toLocaleString('fa-IR')}</p>
                              <p>مکان: {application.interview_location || 'نامشخص'}</p>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <>
                          {!showInterviewForm ? (
                            <Button onClick={() => setShowInterviewForm(true)} className="w-full">
                              <Calendar className="h-4 w-4 ml-2" />
                              زمان‌بندی مصاحبه
                            </Button>
                          ) : (
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium mb-2 block">تاریخ</label>
                                <Input
                                  type="date"
                                  value={interviewDate}
                                  onChange={(e) => setInterviewDate(e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-2 block">ساعت</label>
                                <Input
                                  type="time"
                                  value={interviewTime}
                                  onChange={(e) => setInterviewTime(e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-2 block">مکان</label>
                                <Input
                                  value={interviewLocation}
                                  onChange={(e) => setInterviewLocation(e.target.value)}
                                  placeholder="مثال: اتاق 301، دانشکده فنی"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={handleScheduleInterview} disabled={submitting}>
                                  ثبت زمان مصاحبه
                                </Button>
                                <Button variant="outline" onClick={() => setShowInterviewForm(false)}>
                                  انصراف
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Interview Score */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        امتیاز مصاحبه
                      </CardTitle>
                      <CardDescription>
                        ثبت نمره و نظرات مصاحبه
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          نمره مصاحبه (0-100) <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={interviewScore}
                          onChange={(e) => setInterviewScore(Number(e.target.value))}
                          placeholder="امتیاز مصاحبه"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          معیار: تسلط تخصصی + مهارت‌های پژوهشی + انگیزه و علاقه
                        </p>
                      </div>

                      {application.interview_datetime && (
                        <Button onClick={handleScoreInterview} disabled={submitting} className="w-full">
                          ثبت نمره مصاحبه
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      مصاحبه فقط برای پرونده‌های آزمون دکتری الزامی است
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar: Review & Scoring */}
        <div className="space-y-6">
          {/* Score Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">خلاصه امتیازات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">امتیاز تحصیلی:</span>
                  <Badge variant="outline" className="text-lg">
                    {educationScore}/100
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">امتیاز پژوهشی:</span>
                  <Badge variant="outline" className="text-lg">
                    {researchScore}/100
                  </Badge>
                </div>
                {application.round_type === 'PHD_EXAM' && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">امتیاز مصاحبه:</span>
                    <Badge variant="outline" className="text-lg">
                      {interviewScore}/100
                    </Badge>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="font-bold">جمع کل:</span>
                <Badge className="text-xl" variant={totalScore >= maxScore * 0.6 ? 'default' : 'destructive'}>
                  {totalScore}/{maxScore}
                </Badge>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    totalScore >= maxScore * 0.6 ? 'bg-green-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${Math.min((totalScore / maxScore) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-center text-muted-foreground">
                حد نصاب: {(maxScore * 0.6).toFixed(0)} ({totalScore >= maxScore * 0.6 ? 'قبول' : 'مردود'})
              </p>
            </CardContent>
          </Card>

          {/* Decision Form */}
          <Card>
            <CardHeader>
              <CardTitle>نتیجه بررسی</CardTitle>
              <CardDescription>تصمیم نهایی و توصیه‌ها</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Decision */}
              <div className="space-y-3">
                <Button
                  variant={approved ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setApproved(true)}
                >
                  <CheckCircle className="ml-2 h-4 w-4" />
                  تایید و پیشنهاد پذیرش
                </Button>

                <Button
                  variant={!approved ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setApproved(false)}
                >
                  <XCircle className="ml-2 h-4 w-4" />
                  عدم تایید
                </Button>
              </div>

              <Separator />

              {/* Comment */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  نظر تخصصی <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="ارزیابی تخصصی، نقاط قوت و ضعف..."
                  rows={4}
                />
              </div>

              {/* Recommendations */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  توصیه‌ها
                </label>
                <Textarea
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  placeholder="توصیه‌های تکمیلی برای کمیته پذیرش..."
                  rows={3}
                />
              </div>

              <Separator />

              {/* Submit */}
              <Button
                className="w-full"
                onClick={handleSubmitReview}
                disabled={submitting}
              >
                {submitting ? 'در حال ثبت...' : 'ثبت نتیجه بررسی و امتیازدهی'}
              </Button>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">اطلاعات پرونده</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">نوع فراخوان:</span>
                <p className="font-medium">{application.round?.title}</p>
              </div>
              <div>
                <span className="text-muted-foreground">تاریخ ثبت‌نام:</span>
                <p className="font-medium">
                  {new Date(application.created_at).toLocaleDateString('fa-IR')}
                </p>
              </div>
              {application.university_review_status && (
                <div>
                  <span className="text-muted-foreground">وضعیت بررسی دانشگاه:</span>
                  <p className="font-medium">{application.university_review_status}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FacultyApplicationReview;
