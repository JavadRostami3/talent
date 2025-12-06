import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  FileText,
  User,
  GraduationCap,
  Building,
  Calendar,
  Plus,
  Trash2,
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
  university_review_status: string;
  university_review_comment: string;
  university_reviewed_at?: string;
  university_reviewed_by?: {
    first_name: string;
    last_name: string;
  };
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
  documents: Array<{
    document_type: string;
    file_url: string;
    uploaded_at: string;
  }>;
}

const UniversityAdminApplicationReview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Review form
  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'APPROVED_WITH_DEFECT' | 'REJECTED'>('APPROVED');
  const [comment, setComment] = useState('');
  const [defects, setDefects] = useState<string[]>(['']);

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    setLoading(true);
    try {
      const response = await api.get<ApplicationDetail>(`/api/admin/applications/${id}/`);
      setApplication(response.data);
      
      if (response.data.university_review_comment) {
        setComment(response.data.university_review_comment);
      }
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'پرونده یافت نشد',
        variant: 'destructive',
      });
      navigate('/admin/university/applications');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDefect = () => {
    setDefects([...defects, '']);
  };

  const handleRemoveDefect = (index: number) => {
    setDefects(defects.filter((_, i) => i !== index));
  };

  const handleDefectChange = (index: number, value: string) => {
    const updated = [...defects];
    updated[index] = value;
    setDefects(updated);
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

    if (reviewStatus === 'APPROVED_WITH_DEFECT' && defects.filter(d => d.trim()).length === 0) {
      toast({
        title: 'خطا',
        description: 'لطفاً حداقل یک نقص را وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        review_status: reviewStatus,
        comment: comment.trim(),
      };

      if (reviewStatus === 'APPROVED_WITH_DEFECT') {
        payload.defects = defects.filter(d => d.trim());
      }

      await api.post(`/api/admin/university/applications/${id}/review/`, payload);

      toast({
        title: 'موفق',
        description: 'بررسی با موفقیت ثبت شد',
      });

      navigate('/admin/university/applications');
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

  const statusLabels: Record<string, string> = {
    PENDING: 'در انتظار بررسی',
    APPROVED: 'تایید شده',
    APPROVED_WITH_DEFECT: 'تایید با نقص',
    REJECTED: 'رد شده',
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/admin/university/applications')}>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">بررسی پرونده</h1>
          <p className="text-muted-foreground">کد پیگیری: {application.tracking_code}</p>
        </div>
      </div>

      {/* Current Status Alert */}
      {application.university_review_status !== 'PENDING' && (
        <Alert className="mb-6">
          <AlertDescription>
            این پرونده قبلاً توسط{' '}
            {application.university_reviewed_by?.first_name} {application.university_reviewed_by?.last_name}{' '}
            در تاریخ {new Date(application.university_reviewed_at!).toLocaleDateString('fa-IR')}{' '}
            با وضعیت "{statusLabels[application.university_review_status]}" بررسی شده است.
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
        </div>

        {/* Review Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>بررسی و تصمیم‌گیری</CardTitle>
              <CardDescription>نتیجه بررسی پرونده را ثبت کنید</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Review Status */}
              <div className="space-y-3">
                <Button
                  variant={reviewStatus === 'APPROVED' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setReviewStatus('APPROVED')}
                >
                  <CheckCircle className="ml-2 h-4 w-4" />
                  تایید و ارجاع به دانشکده
                </Button>

                <Button
                  variant={reviewStatus === 'APPROVED_WITH_DEFECT' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setReviewStatus('APPROVED_WITH_DEFECT')}
                >
                  <AlertTriangle className="ml-2 h-4 w-4" />
                  برگشت برای اصلاح نواقص
                </Button>

                <Button
                  variant={reviewStatus === 'REJECTED' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setReviewStatus('REJECTED')}
                >
                  <XCircle className="ml-2 h-4 w-4" />
                  رد پرونده
                </Button>
              </div>

              <Separator />

              {/* Comment */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  نظر و توضیحات <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="توضیحات خود را وارد کنید..."
                  rows={4}
                />
              </div>

              {/* Defects List */}
              {reviewStatus === 'APPROVED_WITH_DEFECT' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    نواقص <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {defects.map((defect, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          value={defect}
                          onChange={(e) => handleDefectChange(idx, e.target.value)}
                          placeholder={`نقص ${idx + 1}`}
                        />
                        {defects.length > 1 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveDefect(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddDefect}
                      className="w-full"
                    >
                      <Plus className="ml-2 h-4 w-4" />
                      افزودن نقص
                    </Button>
                  </div>
                </div>
              )}

              <Separator />

              {/* Submit */}
              <Button
                className="w-full"
                onClick={handleSubmitReview}
                disabled={submitting}
              >
                {submitting ? 'در حال ثبت...' : 'ثبت نتیجه بررسی'}
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

export default UniversityAdminApplicationReview;
