import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  FileText,
  GraduationCap,
  FlaskConical,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import api from '@/services/api';
import type { Application, ApplicationStatus } from '@/types/models';

const ApplicationReview = () => {
  const { id } = useParams<{ id: string }>();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

  const [status, setStatus] = useState<ApplicationStatus>('UNDER_REVIEW');
  const [educationScore, setEducationScore] = useState<number>(0);
  const [researchScore, setResearchScore] = useState<number>(0);
  const [interviewScore, setInterviewScore] = useState<number>(0);
  const [interviewDate, setInterviewDate] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await api.get<Application>(`/api/admin/applications/${id}/`);
      setApplication(response.data);
      setStatus(response.data.status);
      setEducationScore(response.data.education_score || 0);
      setResearchScore(response.data.research_score || 0);
      setInterviewScore(response.data.interview_score || 0);
      setInterviewDate(response.data.interview_date || '');
      setRejectionReason(response.data.rejection_reason || '');
    } catch (error: any) {
      toast({
        title: 'خطا در بارگذاری',
        description: 'اطلاعات درخواست بارگذاری نشد',
        variant: 'destructive',
      });
      navigate('/admin/applications');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!application) return;
    setUpdating(true);
    try {
      await api.patch(`/api/admin/applications/${application.id}/`, {
        status,
        education_score: educationScore,
        research_score: researchScore,
        interview_score: interviewScore,
        interview_date: interviewDate || null,
        rejection_reason: status === 'REJECTED' ? rejectionReason : null,
      });
      toast({ title: 'ذخیره موفق', description: 'اطلاعات درخواست به‌روزرسانی شد' });
      fetchApplication();
    } catch (error: any) {
      toast({
        title: 'خطا در ذخیره',
        description: error.response?.data?.error || 'خطایی رخ داده است',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const roundTypeLabels = {
    MA_TALENT: 'کارشناسی ارشد',
    PHD_TALENT: 'دکتری استعداد',
    PHD_EXAM: 'دکتری آزمون',
    OLYMPIAD: 'المپیاد',
  };

  const statusConfig: Partial<Record<ApplicationStatus, { label: string; variant: any }>> = {
    DRAFT: { label: 'پیش‌نویس', variant: 'secondary' },
    SUBMITTED: { label: 'ارسال شده', variant: 'default' },
    UNDER_REVIEW: { label: 'در حال بررسی', variant: 'outline' },
    APPROVED: { label: 'تایید شده', variant: 'default' },
    REJECTED: { label: 'رد شده', variant: 'destructive' },
    PENDING_DOCUMENTS: { label: 'نیازمند مدارک', variant: 'outline' },
  };

  if (loading || !application) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-12">
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/admin/applications')} className="mb-4">
          <ArrowRight className="ml-2 h-4 w-4" />
          بازگشت
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">بررسی درخواست</h1>
            <p className="text-muted-foreground">کد: {application.tracking_code}</p>
          </div>
                <Badge variant={statusConfig[application.status]?.variant || 'outline'} className="text-base px-4 py-2">
            {statusConfig[application.status]?.label || application.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات متقاضی</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">نام</p>
                  <p className="font-medium">{application.user_name || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">کد ملی</p>
                  <p className="font-medium font-mono">{application.user_national_id || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">موبایل</p>
                  <p className="font-medium font-mono">{application.user_mobile || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">دوره</p>
                  <p className="font-medium text-xs">{roundTypeLabels[application.round_type]}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                رشته‌های انتخابی
              </CardTitle>
            </CardHeader>
            <CardContent>
              {application.program_choices && application.program_choices.length > 0 ? (
                <div className="space-y-2">
                  {application.program_choices
                    .sort((a, b) => a.priority - b.priority)
                    .map((choice) => (
                      <div key={choice.id} className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                        <Badge variant="outline">اولویت {choice.priority}</Badge>
                        <div className="flex-1">
                          <p className="font-medium">{choice.program_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {choice.faculty_name} - {choice.department_name}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">-</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                سوابق پژوهشی ({application.research_records?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {application.research_records && application.research_records.length > 0 ? (
                <div className="space-y-3">
                  {application.research_records.map((record) => (
                    <div key={record.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <Badge>{record.type}</Badge>
                        {record.reference_link && (
                          <a
                            href={record.reference_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            لینک <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <p className="font-medium mb-1">{record.title}</p>
                      <p className="text-sm text-muted-foreground">{record.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">-</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                مدارک ({application.documents?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {application.documents && application.documents.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {application.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent/50"
                    >
                      <FileText className="h-4 w-4" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.document_type}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 shrink-0" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">-</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>بررسی و ارزیابی</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>وضعیت</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ApplicationStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNDER_REVIEW">در حال بررسی</SelectItem>
                    <SelectItem value="APPROVED">تایید</SelectItem>
                    <SelectItem value="REJECTED">رد</SelectItem>
                    <SelectItem value="PENDING_DOCUMENTS">نیاز به مدارک</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>نمرات</Label>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="ed" className="text-xs">تحصیلی</Label>
                    <Input
                      id="ed"
                      type="number"
                      step="0.01"
                      value={educationScore}
                      onChange={(e) => setEducationScore(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rs" className="text-xs">پژوهشی</Label>
                    <Input
                      id="rs"
                      type="number"
                      step="0.01"
                      value={researchScore}
                      onChange={(e) => setResearchScore(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="is" className="text-xs">مصاحبه</Label>
                    <Input
                      id="is"
                      type="number"
                      step="0.01"
                      value={interviewScore}
                      onChange={(e) => setInterviewScore(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">کل</p>
                    <p className="text-2xl font-bold text-primary">
                      {(educationScore + researchScore + interviewScore).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {status === 'APPROVED' && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="date">
                      <Calendar className="inline h-4 w-4 ml-1" />
                      تاریخ مصاحبه
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                    />
                  </div>
                </>
              )}

              {status === 'REJECTED' && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="reason">دلیل رد</Label>
                    <Textarea
                      id="reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={4}
                    />
                  </div>
                </>
              )}

              <Button onClick={handleSubmit} disabled={updating} className="w-full" size="lg">
                {updating ? 'در حال ذخیره...' : status === 'APPROVED' ? (
                  <>
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                    تایید
                  </>
                ) : status === 'REJECTED' ? (
                  <>
                    <XCircle className="ml-2 h-4 w-4" />
                    رد
                  </>
                ) : (
                  'ذخیره'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ApplicationReview;
