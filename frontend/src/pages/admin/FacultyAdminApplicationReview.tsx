import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  FileText,
  User,
  GraduationCap,
  Building,
  Award,
  BookOpen,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import api from '@/services/api';

interface ApplicationDetail {
  id: number;
  tracking_code: string;
  applicant: {
    user: {
      national_id: string;
      first_name: string;
      last_name: string;
      mobile: string;
      email: string;
    };
  };
  round: {
    round_type: string;
    title: string;
  };
  status: string;
  faculty_review_completed: boolean;
  faculty_review_comment: string;
  faculty_reviewed_at?: string;
  faculty_reviewed_by?: {
    first_name: string;
    last_name: string;
  };
  total_score: number;
  created_at: string;
  selected_programs: Array<{
    program: {
      name: string;
      faculty: { name: string };
      department: { name: string };
    };
    priority: number;
  }>;
  education_records: Array<{
    degree_level: string;
    university: string;
    field_of_study: string;
    gpa: number;
    start_year: number;
    end_year: number;
  }>;
  research_records?: Array<{
    record_type: string;
    title: string;
    description: string;
    publication_date?: string;
    score: number;
  }>;
  documents: Array<{
    type?: string;
    document_type?: string;
    file_url: string;
    uploaded_at: string;
  }>;
}

const FacultyAdminApplicationReview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Review form
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [comment, setComment] = useState('');
  
  // Manual scores (برای دکتری)
  const [researchScore, setResearchScore] = useState<number>(0);
  const [publicationScore, setPublicationScore] = useState<number>(0);

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    setLoading(true);
    try {
      const response = await api.get<ApplicationDetail>(`/api/admin/faculty/applications/${id}/`);
      setApplication(response.data);

      if (response.data.faculty_review_comment) {
        setComment(response.data.faculty_review_comment);
      }
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'پرونده یافت نشد',
        variant: 'destructive',
      });
      navigate('/admin/faculty/applications');
    } finally {
      setLoading(false);
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

    setSubmitting(true);
    try {
      const payload: any = {
        decision,
        comment: comment.trim(),
      };

      // اگر دکتری باشد، امتیازهای دستی را اضافه کن
      if (
        application?.round.round_type === 'PHD_TALENT' ||
        application?.round.round_type === 'PHD_EXAM'
      ) {
        payload.manual_scores = {
          research_score: researchScore,
          publication_score: publicationScore,
        };
      }

      await api.post(`/api/admin/faculty/applications/${id}/review/`, payload);

      toast({
        title: 'موفق',
        description: 'بررسی با موفقیت ثبت شد',
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
    ISI_PAPER: 'مقاله ISI',
    ISC_PAPER: 'مقاله ISC',
    CONFERENCE_PAPER: 'مقاله کنفرانس',
    BOOK: 'کتاب',
    PATENT: 'ثبت اختراع',
    PROJECT: 'پروژه تحقیقاتی',
  };

  const isPhdRound =
    application.round.round_type === 'PHD_TALENT' || application.round.round_type === 'PHD_EXAM';

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/admin/faculty/applications')}>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">بررسی نهایی پرونده</h1>
          <p className="text-muted-foreground">کد پیگیری: {application.tracking_code}</p>
        </div>
      </div>

      {/* Current Status Alert */}
      {application.faculty_review_completed && (
        <Alert className="mb-6">
          <AlertDescription>
            این پرونده قبلاً توسط{' '}
            {application.faculty_reviewed_by?.first_name} {application.faculty_reviewed_by?.last_name}{' '}
            در تاریخ {new Date(application.faculty_reviewed_at!).toLocaleDateString('fa-IR')}{' '}
            بررسی شده است.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
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
                    {application.applicant.user.first_name} {application.applicant.user.last_name}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">کد ملی:</span>
                  <p className="font-medium font-mono">{application.applicant.user.national_id}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">موبایل:</span>
                  <p className="font-medium font-mono">{application.applicant.user.mobile}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">ایمیل:</span>
                  <p className="font-medium">{application.applicant.user.email}</p>
                </div>
              </div>

              {application.total_score > 0 && (
                <div className="pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-medium text-muted-foreground">امتیاز کل:</span>
                    <Badge variant="outline" className="text-lg">
                      {application.total_score.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              )}
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
                  .sort((a, b) => a.priority - b.priority)
                  .map((sp, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <Badge variant="outline" className="shrink-0">
                        اولویت {sp.priority}
                      </Badge>
                      <div>
                        <p className="font-medium">{sp.program.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {sp.program.faculty.name} - {sp.program.department.name}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Education Records */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                سوابق تحصیلی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {application.education_records.map((edu, idx) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>{degreeLabels[edu.degree_level]}</Badge>
                      <span className="font-medium">{edu.field_of_study}</span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>دانشگاه: {edu.university}</p>
                      <p>
                        معدل: {edu.gpa} - سال‌های تحصیل: {edu.start_year} تا {edu.end_year}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Research Records (for PHD only) */}
          {isPhdRound && (application.research_records?.length || 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  سوابق پژوهشی
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(application.research_records || []).map((record, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge>{researchTypeLabels[record.record_type]}</Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          {record.score} امتیاز
                        </Badge>
                      </div>
                      <p className="font-medium mb-1">{record.title}</p>
                      {record.description && (
                        <p className="text-sm text-muted-foreground mb-2">{record.description}</p>
                      )}
                      {record.publication_date && (
                        <p className="text-xs text-muted-foreground">
                          تاریخ: {new Date(record.publication_date).toLocaleDateString('fa-IR')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
                {application.documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{doc.type || doc.document_type}</p>
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
        </div>

        {/* Review Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تصمیم‌گیری نهایی</CardTitle>
              <CardDescription>نتیجه بررسی و پذیرش را ثبت کنید</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Decision Buttons */}
              <div className="space-y-3">
                <Button
                  variant={decision === 'APPROVED' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setDecision('APPROVED')}
                >
                  <CheckCircle className="ml-2 h-4 w-4" />
                  پذیرش
                </Button>

                <Button
                  variant={decision === 'REJECTED' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setDecision('REJECTED')}
                >
                  <XCircle className="ml-2 h-4 w-4" />
                  عدم پذیرش
                </Button>
              </div>

              <Separator />

              {/* Manual Scoring for PHD */}
              {isPhdRound && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      امتیازدهی دستی (اختیاری)
                    </label>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground">امتیاز پژوهش</label>
                        <Input
                          type="number"
                          value={researchScore}
                          onChange={(e) => setResearchScore(Number(e.target.value))}
                          placeholder="0"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">امتیاز انتشارات</label>
                        <Input
                          type="number"
                          value={publicationScore}
                          onChange={(e) => setPublicationScore(Number(e.target.value))}
                          placeholder="0"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />
                </>
              )}

              {/* Comment */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  نظر و توضیحات <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="توضیحات خود را وارد کنید..."
                  rows={5}
                />
              </div>

              <Separator />

              {/* Submit */}
              <Button className="w-full" onClick={handleSubmitReview} disabled={submitting}>
                {submitting ? 'در حال ثبت...' : 'ثبت تصمیم نهایی'}
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
                <p className="font-medium">{application.round.title}</p>
              </div>
              <div>
                <span className="text-muted-foreground">تاریخ ثبت‌نام:</span>
                <p className="font-medium">
                  {new Date(application.created_at).toLocaleDateString('fa-IR')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FacultyAdminApplicationReview;
