import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Building,
  Calendar,
  CheckCircle,
  FileText,
  GraduationCap,
  Loader2,
  User,
  X,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import api from '@/services/api';

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  PERSONAL_PHOTO: 'عکس پرسنلی',
  NATIONAL_CARD: 'کارت ملی',
  ID_CARD: 'شناسنامه',
  BSC_CERT: 'مدرک کارشناسی',
  BSC_TRANSCRIPT: 'ریز نمرات کارشناسی',
  ENROLLMENT_CERT: 'گواهی اشتغال به تحصیل',
};

const IDENTITY_DOC_TYPES = ['PERSONAL_PHOTO', 'NATIONAL_CARD', 'ID_CARD'];

type CategoryKey =
  | 'personal_info'
  | 'identity_docs'
  | 'education_records'
  | 'education_documents'
  | 'program_selection';

const CATEGORY_DEFECT_OPTIONS: Record<CategoryKey, string[]> = {
  personal_info: ['نام پدر ثبت نشده', 'جنسیت یا سال تولد ناقص است', 'محل تولد وارد نشده'],
  identity_docs: ['عکس پرسنلی واضح نیست', 'کارت ملی وضوح ندارد', 'شناسنامه خوانا نیست'],
  education_records: ['کارشناسی ثبت نشده', 'معدل یا رشته مشخص نشده'],
  education_documents: ['مدرک کارشناسی بارگذاری نشده', 'ریز نمرات ثبت نشده', 'گواهی اشتغال به تحصیل ناقص'],
  program_selection: ['رشته‌ای انتخاب نشده', 'اولویت‌ها تکمیل نشده‌اند'],
};

interface DocumentItem {
  id: number;
  type?: string;
  document_type?: string;
  file_url: string;
  uploaded_at: string;
}

interface ApplicationChoiceItem {
  id: number;
  priority: number;
  program: {
    name: string;
    code?: string;
    orientation?: string;
    faculty: { name: string };
    department: { name: string };
  };
}

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
      father_name?: string;
      gender?: string;
      birth_year?: number;
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
  faculty_review_completed: boolean;
  faculty_review_comment: string;
  faculty_reviewed_at?: string;
  faculty_reviewed_by?: {
    first_name: string;
    last_name: string;
  };
  admission_overall_status: string;
  created_at: string;
  updated_at: string;
  choices: ApplicationChoiceItem[];
  education_records: Array<{
    degree_level: string;
    university?: { name: string };
    field_of_study?: string;
    gpa?: number;
    start_year?: number;
    graduation_year?: number;
    status?: string;
  }>;
  documents: DocumentItem[];
}

const UniversityAdminApplicationReview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [stageOneSubmitting, setStageOneSubmitting] = useState(false);
  const [stageTwoSubmitting, setStageTwoSubmitting] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'APPROVED_WITH_DEFECT' | 'REJECTED'>('APPROVED');
  const [stageOneComment, setStageOneComment] = useState('');
  const [categoryDefects, setCategoryDefects] = useState<Record<CategoryKey, string[]>>({});
  const [customDefectInputs, setCustomDefectInputs] = useState<Record<CategoryKey, string>>({});
  const [finalDecision, setFinalDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [finalComment, setFinalComment] = useState('');
  // Document review state
  const [docReviews, setDocReviews] = useState<any[]>([]);
  const [docLoading, setDocLoading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string>('');
  const [docStatus, setDocStatus] = useState<'APPROVED' | 'APPROVED_WITH_DEFECT' | 'REJECTED'>('APPROVED');
  const [docComment, setDocComment] = useState('');
  const [docDefects, setDocDefects] = useState<string[]>([]);
  const [newDocDefect, setNewDocDefect] = useState('');

  useEffect(() => {
    if (id) {
      fetchApplication();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchApplication = async () => {
    setLoading(true);
    try {
      const response = await api.get<ApplicationDetail>(`/api/admin/applications/${id}/`);
      setApplication(response.data);
      setStageOneComment(response.data.university_review_comment || '');
      setFinalComment(response.data.faculty_review_comment || '');
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: 'پرونده یافت نشد',
        variant: 'destructive',
      });
      navigate('/admin/university/applications');
    } finally {
      setLoading(false);
      // fetch document reviews as well
      fetchDocumentReviews();
    }
  };

  const fetchDocumentReviews = async () => {
    if (!id) return;
    setDocLoading(true);
    try {
      const resp = await api.get(`/api/admin/applications/${id}/documents/`);
      setDocReviews(resp.data.reviews || []);
    } catch (err) {
      setDocReviews([]);
    } finally {
      setDocLoading(false);
    }
  };

  const addCategoryDefect = (category: CategoryKey, defect: string) => {
    const normalized = defect.trim();
    if (!normalized) return;
    setCategoryDefects((prev) => {
      const existing = prev[category] || [];
      if (existing.includes(normalized)) return prev;
      return { ...prev, [category]: [...existing, normalized] };
    });
    setCustomDefectInputs((prev) => ({ ...prev, [category]: '' }));
  };

  const removeCategoryDefect = (category: CategoryKey, index: number) => {
    setCategoryDefects((prev) => {
      const items = prev[category] || [];
      const next = items.filter((_, i) => i !== index);
      if (next.length === 0) {
        const { [category]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [category]: next };
    });
  };

  const handleAddCustomDefect = (category: CategoryKey) => {
    const text = (customDefectInputs[category] || '').trim();
    addCategoryDefect(category, text);
  };

  const stageOneDefects = Object.values(categoryDefects).flat();

  const handleInitialReviewSubmit = async () => {
    if (!application) return;
    setStageOneSubmitting(true);
    try {
      let resolvedStatus = reviewStatus;
      if (
        stageOneDefects.length > 0 &&
        resolvedStatus === 'APPROVED'
      ) {
        resolvedStatus = 'APPROVED_WITH_DEFECT';
      }
      const payload: any = {
        review_status: resolvedStatus,
        comment: stageOneComment.trim() || 'بررسی اولیه مدارک به‌روزرسانی شد',
      };
      if (stageOneDefects.length > 0) payload.defects = stageOneDefects;

      await api.post(`/api/admin/university/applications/${id}/review/`, payload);
      toast({
        title: 'ثبت شد',
        description: 'بررسی اولیه با موفقیت ثبت شد',
      });
      fetchApplication();
      fetchDocumentReviews();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در ثبت بررسی اولیه',
        variant: 'destructive',
      });
    } finally {
      setStageOneSubmitting(false);
    }
  };

  const addDocDefect = () => {
    const v = (newDocDefect || '').trim();
    if (!v) return;
    setDocDefects((d) => (d.includes(v) ? d : [...d, v]));
    setNewDocDefect('');
  };

  const removeDocDefect = (idx: number) => setDocDefects((d) => d.filter((_, i) => i !== idx));

  const handleDocReviewSubmit = async () => {
    if (!id || !selectedDocType) {
      toast({ title: 'خطا', description: 'نوع مدرک را انتخاب کنید', variant: 'destructive' });
      return;
    }
    try {
      const payload: any = {
        document_type: selectedDocType,
        status: docStatus,
        comment: docComment || undefined,
      };
      if (docDefects.length) payload.defects = docDefects;

      await api.post(`/api/admin/applications/${id}/documents/`, payload);
      toast({ title: 'ثبت شد', description: 'بررسی مدرک با موفقیت ثبت شد' });
      fetchDocumentReviews();
      fetchApplication();
    } catch (err: any) {
      toast({ title: 'خطا', description: err.response?.data?.error || 'خطا در ثبت بررسی مدارک', variant: 'destructive' });
    }
  };

  const handleFinalDecisionSubmit = async () => {
    if (!application) return;
    setStageTwoSubmitting(true);
    try {
      await api.post(`/api/admin/faculty/applications/${id}/review/`, {
        decision: finalDecision,
        comment: finalComment.trim(),
      });
      toast({
        title: 'نتیجه ثبت شد',
        description: 'تصمیم نهایی با موفقیت ثبت گردید',
      });
      fetchApplication();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در ثبت تصمیم نهایی',
        variant: 'destructive',
      });
    } finally {
      setStageTwoSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <div className="text-muted-foreground mt-2">در حال بارگذاری اطلاعات پرونده</div>
        </div>
      </div>
    );
  }

  if (!application) {
    return null;
  }

  const normalizedDocuments = application.documents.map((doc) =>
    doc.type || doc.document_type || ''
  );
  const uploadedDocSet = new Set(normalizedDocuments);

  const personalInfoComplete = Boolean(
    application.applicant.user.father_name &&
      application.applicant.user.gender &&
      application.applicant.user.birth_year
  );
  const identityDocsComplete = IDENTITY_DOC_TYPES.every((type) =>
    uploadedDocSet.has(type)
  );

  const bscRecord = application.education_records.find(
    (record) => record.degree_level === 'BSC'
  );
  const educationRecordsComplete = Boolean(bscRecord);

  const requiredEducationDocs: string[] = [];
  if (bscRecord) {
    if (bscRecord.status === 'GRADUATED') {
      requiredEducationDocs.push('BSC_CERT', 'BSC_TRANSCRIPT');
    } else if (bscRecord.status === 'STUDYING') {
      requiredEducationDocs.push('BSC_TRANSCRIPT', 'ENROLLMENT_CERT');
    } else {
      requiredEducationDocs.push('BSC_TRANSCRIPT');
    }
  }

  const educationDocsComplete =
    requiredEducationDocs.length > 0 &&
    requiredEducationDocs.every((type) => uploadedDocSet.has(type));

  const programSelectionComplete = (application.choices?.length || 0) > 0;

  const stageCategories: Array<{
    key: CategoryKey;
    label: string;
    description: string;
    completed: boolean;
    details: ReactNode;
  }> = [
    {
      key: 'personal_info',
      label: 'اطلاعات شخصی',
      description: personalInfoComplete
        ? 'اطلاعات هویتی تکمیل شده است'
        : 'بررسی کنید نام پدر، جنسیت یا سال تولد ثبت شده باشد',
      completed: personalInfoComplete,
      details: (
        <div className="grid gap-2 text-sm text-muted-foreground">
          <div>
            نام و نام خانوادگی: <strong>{`${application.applicant.user.first_name} ${application.applicant.user.last_name}`}</strong>
          </div>
          <div>کد ملی: <span className="font-mono">{application.applicant.user.national_id}</span></div>
          <div>جنسیت: {application.applicant.user.gender || 'نامشخص'}</div>
          <div>سال تولد: {application.applicant.user.birth_year || 'ثبت نشده'}</div>
        </div>
      ),
    },
    {
      key: 'identity_docs',
      label: 'مدارک شناسایی',
      description: identityDocsComplete
        ? 'مدارک اصلی بارگذاری شده‌اند'
        : 'بررسی کنید عکس، کارت ملی و شناسنامه اپلود شده باشند',
      completed: identityDocsComplete,
      details: (
        <div className="grid grid-cols-2 gap-2 text-sm">
          {IDENTITY_DOC_TYPES.map((type) => (
            <div key={type} className="flex items-center justify-between">
              <span>{DOCUMENT_TYPE_LABELS[type] || type}</span>
              <Badge variant={uploadedDocSet.has(type) ? 'outline' : 'destructive'}>
                {uploadedDocSet.has(type) ? 'بارگذاری شده' : 'مشخص نشده'}
              </Badge>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'education_records',
      label: 'سوابق تحصیلی',
      description: educationRecordsComplete
        ? 'اطلاعات کارشناسی ثبت شده است'
        : 'اطلاعات سابقه کارشناسی بررسی شود',
      completed: educationRecordsComplete,
      details: (
        <div className="text-sm text-muted-foreground">
          {bscRecord ? (
            <div className="space-y-1">
              <div>رشته: {bscRecord.field_of_study || 'ثبت نشده'}</div>
              <div>دانشگاه: {bscRecord.university?.name || 'مشخص نشده'}</div>
              <div>معدل: {bscRecord.gpa ?? 'ندارد'}</div>
              <div>
                سال‌های تحصیل: {bscRecord.start_year || 'نامشخص'} تا {bscRecord.graduation_year || 'در حال تحصیل'}
              </div>
            </div>
          ) : (
            <div>سابقه کارشناسی در پرونده موجود نیست</div>
          )}
        </div>
      ),
    },
    {
      key: 'education_documents',
      label: 'مدارک تحصیلی',
      description: educationDocsComplete
        ? 'مدارک تحصیلی کامل است'
        : 'بررسی کنید مدرک/ریز نمرات تکمیل باشد',
      completed: educationDocsComplete,
      details: (
        <div className="grid grid-cols-1 gap-2 text-sm">
          {requiredEducationDocs.length > 0 ? (
            requiredEducationDocs.map((type) => (
              <div key={type} className="flex items-center justify-between">
                <span>{DOCUMENT_TYPE_LABELS[type] || type}</span>
                <Badge variant={uploadedDocSet.has(type) ? 'outline' : 'destructive'}>
                  {uploadedDocSet.has(type) ? 'بارگذاری شده' : 'در انتظار'}
                </Badge>
              </div>
            ))
          ) : (
            <div>ابتدا سابقه کارشناسی را ثبت کنید</div>
          )}
        </div>
      ),
    },
    {
      key: 'program_selection',
      label: 'انتخاب رشته',
      description: programSelectionComplete
        ? 'حداقل یک رشته انتخاب شده است'
        : 'رشته‌ها را طبق اولویت بررسی کنید',
      completed: programSelectionComplete,
      details: (
        <div className="space-y-2 text-sm">
          {(application.choices || [])
            .slice()
            .sort((a, b) => a.priority - b.priority)
            .map((choice) => (
              <div key={choice.id} className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium">{choice.program.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {choice.program.faculty.name} - {choice.program.department.name}
                  </div>
                </div>
                <Badge variant="secondary">اولویت {choice.priority}</Badge>
              </div>
            ))}
          {!(application.choices?.length) && <div>هنوز گزینه‌ای انتخاب نشده است</div>}
        </div>
      ),
    },
  ];

  const completedCategoryCount = stageCategories.filter((category) => category.completed).length;
  const categoryProgress = Math.round((completedCategoryCount / stageCategories.length) * 100) || 0;
  const stageOneDone = application.university_review_status !== 'PENDING';

  const categoryBadgeColor = (completed: boolean) =>
    completed ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200';

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin/university/applications')}>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">بررسی پرونده کارشناسی ارشد</h1>
          <p className="text-muted-foreground">کد پیگیری: {application.tracking_code}</p>
        </div>
      </div>

      {application.university_review_status !== 'PENDING' && (
        <Alert className="rounded-xl">
          <AlertDescription>
            این پرونده با وضعیت "{application.university_review_status}" توسط{' '}
            {application.university_reviewed_by?.first_name} {application.university_reviewed_by?.last_name}
            {' '} در تاریخ {application.university_reviewed_at
              ? new Date(application.university_reviewed_at).toLocaleDateString('fa-IR')
              : 'نامشخص'} ثبت شده است.
          </AlertDescription>
        </Alert>
      )}

      <Card className="space-y-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" /> ارزیابی آماده‌سازی پرونده
          </CardTitle>
          <CardDescription>
            وضعیت فعلی بررسی اولیه: {application.university_review_status}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">پیشرفت بررسی اولیه</p>
              <p className="font-semibold text-lg">{categoryProgress}% تمدید</p>
            </div>
            <Badge variant="outline" className="text-sm">
              {completedCategoryCount}/{stageCategories.length} بخش کامل شده
            </Badge>
          </div>
          <Progress value={categoryProgress} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {stageCategories.map((category) => (
              <Card key={category.key} className="border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{category.label}</CardTitle>
                    <Badge className={categoryBadgeColor(category.completed)}>
                      {category.completed ? 'تکمیل شده' : 'نیاز به بررسی'}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">{category.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {category.details}
                  <Separator />
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground">ثبت نواقص</div>
                    <div className="flex flex-wrap gap-2">
                      {(categoryDefects[category.key] || []).map((defect, index) => (
                        <Button
                          key={`${category.key}-${defect}-${index}`}
                          variant="ghost"
                          size="sm"
                          className="bg-muted/50 border"
                          onClick={() => removeCategoryDefect(category.key, index)}
                        >
                          <span className="text-xs">{defect}</span>
                          <X className="h-3 w-3" />
                        </Button>
                      ))}
                      {!(categoryDefects[category.key] || []).length && (
                        <span className="text-xs text-muted-foreground">بدون نقص ثبت‌شده</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(CATEGORY_DEFECT_OPTIONS[category.key] || []).map((option) => (
                        <Button
                          key={`${category.key}-option-${option}`}
                          variant="outline"
                          size="sm"
                          onClick={() => addCategoryDefect(category.key, option)}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        size="sm"
                        placeholder="متن نقص را وارد کنید"
                        value={customDefectInputs[category.key] || ''}
                        onChange={(event) =>
                          setCustomDefectInputs((prev) => ({
                            ...prev,
                            [category.key]: event.target.value,
                          }))
                        }
                      />
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleAddCustomDefect(category.key)}
                      >
                        ثبت
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" /> بررسی اولیه
              </CardTitle>
              <CardDescription>
                تصمیم‌گیری برای مرحله اول، با ورود به صورت تایید، تایید با نقص یا رد
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {['APPROVED', 'APPROVED_WITH_DEFECT', 'REJECTED'].map((status) => (
                  <Button
                    key={status}
                    variant={reviewStatus === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReviewStatus(status as typeof reviewStatus)}
                  >
                    {status === 'APPROVED' && 'تایید بدون نقص'}
                    {status === 'APPROVED_WITH_DEFECT' && 'تایید با نقص'}
                    {status === 'REJECTED' && 'رد نهایی'}
                  </Button>
                ))}
              </div>
              <Textarea
                placeholder="توضیحات بررسی اولیه"
                value={stageOneComment}
                onChange={(event) => setStageOneComment(event.target.value)}
                className="min-h-[120px]"
              />
              <Button
                className="w-full"
                onClick={handleInitialReviewSubmit}
                disabled={stageOneSubmitting}
              >
                {stageOneSubmitting ? 'در حال ثبت...' : 'ثبت بررسی اولیه'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" /> تصمیم نهایی پذیرش
              </CardTitle>
              <CardDescription>
                وضعیت نهایی پذیرش پس از تایید دانشگاه ثبت می‌شود
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={finalDecision === 'APPROVED' ? 'default' : 'outline'}
                  onClick={() => setFinalDecision('APPROVED')}
                >
                  پذیرش نهایی
                </Button>
                <Button
                  variant={finalDecision === 'REJECTED' ? 'destructive' : 'outline'}
                  onClick={() => setFinalDecision('REJECTED')}
                >
                  رد صلاحیت نهایی
                </Button>
              </div>
              <Textarea
                placeholder="توضیحات تصمیم نهایی"
                value={finalComment}
                onChange={(event) => setFinalComment(event.target.value)}
                className="min-h-[120px]"
              />
              <Button
                className="w-full"
                onClick={handleFinalDecisionSubmit}
                disabled={stageTwoSubmitting}
              >
                {stageTwoSubmitting ? 'در حال ثبت...' : 'ثبت تصمیم نهایی'}
              </Button>
              <div className="text-sm text-muted-foreground">
                وضعیت پذیرش: {application.admission_overall_status || 'در انتظار'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> اطلاعات متقاضی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">نام</p>
                  <p className="font-medium">{application.applicant.user.first_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">نام خانوادگی</p>
                  <p className="font-medium">{application.applicant.user.last_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">کد ملی</p>
                  <p className="font-semibold font-mono">{application.applicant.user.national_id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">موبایل</p>
                  <p className="font-medium font-mono">{application.applicant.user.mobile}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" /> رشته‌های انتخابی
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(application.choices || [])
                .slice()
                .sort((a, b) => a.priority - b.priority)
                .map((choice) => (
                  <div key={choice.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{choice.program.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {choice.program.faculty.name} - {choice.program.department.name}
                      </p>
                    </div>
                    <Badge variant="outline">اولویت {choice.priority}</Badge>
                  </div>
                ))}
              {!(application.choices?.length) && (
                <p className="text-sm text-muted-foreground">هنوز هیچ رشته‌ای انتخاب نشده است</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" /> سوابق تحصیلی
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {application.education_records.map((record, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{record.degree_level}</Badge>
                    <span className="font-semibold">{record.field_of_study || 'رشته نامشخص'}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    دانشگاه: {record.university?.name || 'در حال تکمیل'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    معدل: {record.gpa ?? 'ثبت نشده'} • سال شروع: {record.start_year || 'نامشخص'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    سال فارغ‌التحصیلی: {record.graduation_year || 'در حال تحصیل'}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> مدارک ارسال‌شده
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {application.documents.map((doc, idx) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{doc.type || doc.document_type || 'سایر مدارک'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(doc.uploaded_at).toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <a href={doc.file_url} target="_blank" rel="noreferrer">
                      مشاهده
                    </a>
                  </Button>
                </div>
              ))}
              {!application.documents.length && (
                <p className="text-sm text-muted-foreground">هیچ مدرکی بارگذاری نشده است</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> بررسی مدارک
              </CardTitle>
              <CardDescription>مشاهده و ثبت بررسی‌های مدارک این پرونده</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm font-medium">بررسی‌های ثبت‌شده</div>
                {docLoading ? (
                  <div className="text-sm text-muted-foreground">در حال بارگذاری...</div>
                ) : docReviews.length === 0 ? (
                  <div className="text-sm text-muted-foreground">هنوز بررسی‌ای ثبت نشده است</div>
                ) : (
                  docReviews.map((r) => (
                    <div key={r.id} className="p-2 border rounded-lg flex items-start justify-between">
                      <div>
                        <div className="font-medium">{r.document_type_display || r.document_type}</div>
                        <div className="text-xs text-muted-foreground">{r.status_display} — {r.reviewer_name || 'نامشخص'}</div>
                        {r.comment && <div className="text-sm mt-1">{r.comment}</div>}
                        {r.defects && r.defects.length > 0 && (
                          <div className="text-xs mt-1 text-destructive">نواقص: {r.defects.join(', ')}</div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString('fa-IR') : ''}</div>
                    </div>
                  ))
                )}

                <div className="pt-3 border-t">
                  <div className="text-sm font-medium">ثبت/به‌روزرسانی بررسی</div>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    <select
                      className="p-2 border rounded"
                      value={selectedDocType}
                      onChange={(e) => setSelectedDocType(e.target.value)}
                    >
                      <option value="">انتخاب نوع مدرک</option>
                      {application.documents.map((d) => (
                        <option key={d.id} value={d.type || d.document_type || ''}>
                          {DOCUMENT_TYPE_LABELS[d.type || d.document_type || ''] || (d.type || d.document_type)}
                        </option>
                      ))}
                    </select>

                    <div className="flex gap-2">
                      {['APPROVED', 'APPROVED_WITH_DEFECT', 'REJECTED'].map((s) => (
                        <Button
                          key={s}
                          variant={docStatus === s ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setDocStatus(s as any)}
                        >
                          {s === 'APPROVED' && 'تایید'}
                          {s === 'APPROVED_WITH_DEFECT' && 'تایید با نقص'}
                          {s === 'REJECTED' && 'رد'}
                        </Button>
                      ))}
                    </div>

                    <Textarea placeholder="توضیحات" value={docComment} onChange={(e) => setDocComment(e.target.value)} />

                    <div className="flex gap-2">
                      <Input size="sm" placeholder="افزودن نقص" value={newDocDefect} onChange={(e) => setNewDocDefect(e.target.value)} />
                      <Button size="sm" onClick={addDocDefect}>افزودن</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {docDefects.map((d, idx) => (
                        <Button key={`${d}-${idx}`} variant="ghost" size="sm" onClick={() => removeDocDefect(idx)}>
                          {d}
                        </Button>
                      ))}
                    </div>

                    <Button className="w-full" onClick={handleDocReviewSubmit}>ثبت بررسی مدرک</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" /> اطلاعات پرونده
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div>
                نوع فراخوان: <strong>{application.round.title}</strong>
              </div>
              <div>
                تاریخ ثبت‌نام: {new Date(application.created_at).toLocaleDateString('fa-IR')}
              </div>
              <div>
                آخرین به‌روزرسانی: {new Date(application.updated_at).toLocaleDateString('fa-IR')}
              </div>
              <div>
                وضعیت مرحله اول: <Badge variant="outline">{application.university_review_status}</Badge>
              </div>
              <div>
                وضعیت نهایی: <Badge variant="outline">{application.status}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UniversityAdminApplicationReview;
