import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Loader2, Upload, Trash2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import applicationService from '@/services/applicationService';
import type { DocumentRecord, DocumentType } from '@/types/models';

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  PERSONAL_PHOTO: 'عکس پرسنلی',
  NATIONAL_CARD: 'کارت ملی',
  BSC_TRANSCRIPT: 'ریز نمرات کارشناسی',
  BSC_CERTIFICATE: 'مدرک کارشناسی',
  MSC_TRANSCRIPT: 'ریز نمرات کارشناسی ارشد',
  MSC_CERTIFICATE: 'مدرک کارشناسی ارشد',
  RECOMMENDATION_LETTER: 'توصیه‌نامه',
  RESEARCH_PROPOSAL: 'پروپوزال پژوهشی',
  LANGUAGE_CERTIFICATE: 'مدرک زبان',
  WORK_EXPERIENCE: 'سوابق شغلی',
  OTHER: 'سایر مدارک',
};

interface DocumentUploadStepProps {
  applicationId: number;
  roundType: string;
  onComplete: () => void;
}

const DocumentUploadStep = ({ applicationId, roundType, onComplete }: DocumentUploadStepProps) => {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState<DocumentType | ''>('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const isPhdRound = roundType === 'PHD_TALENT' || roundType === 'PHD_EXAM';

  // مدارک الزامی بر اساس نوع دوره
  const requiredDocTypes: DocumentType[] = [
    'PERSONAL_PHOTO',
    'NATIONAL_CARD',
    'BSC_TRANSCRIPT',
    'BSC_CERTIFICATE',
    ...(isPhdRound ? ['MSC_TRANSCRIPT', 'MSC_CERTIFICATE'] as DocumentType[] : []),
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setFetchingData(true);
    try {
      const data = await applicationService.getDocuments(applicationId);
      setDocuments(data);
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری مدارک',
        variant: 'destructive',
      });
    } finally {
      setFetchingData(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // بررسی حجم فایل (حداکثر 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'خطا',
        description: 'حجم فایل نباید بیشتر از 5 مگابایت باشد',
        variant: 'destructive',
      });
      return;
    }

    // بررسی فرمت فایل
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'خطا',
        description: 'فقط فایل‌های PDF، JPG و PNG مجاز هستند',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedType) {
      toast({
        title: 'خطا',
        description: 'لطفاً نوع مدرک و فایل را انتخاب کنید',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      await applicationService.uploadDocument(
        applicationId,
        selectedFile,
        selectedType,
        (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 100)
          );
          setUploadProgress(progress);
        }
      );

      toast({
        title: 'موفق',
        description: 'مدرک با موفقیت بارگذاری شد',
      });

      // ریست کردن فرم
      setSelectedFile(null);
      setSelectedType('');
      setUploadProgress(0);

      // به‌روزرسانی لیست مدارک
      await fetchDocuments();

      // ریست input file
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در بارگذاری مدرک',
        variant: 'destructive',
      });
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId: number) => {
    if (!confirm('آیا از حذف این مدرک اطمینان دارید؟')) return;

    setLoading(true);
    try {
      await applicationService.deleteDocument(applicationId, documentId);
      toast({
        title: 'موفق',
        description: 'مدرک حذف شد',
      });
      await fetchDocuments();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: 'خطا در حذف مدرک',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    // بررسی کامل بودن مدارک الزامی
    const uploadedTypes = documents.map(d => d.document_type);
    const missingDocs = requiredDocTypes.filter(type => !uploadedTypes.includes(type));

    if (missingDocs.length > 0) {
      const missingLabels = missingDocs.map(type => DOCUMENT_TYPE_LABELS[type]).join('، ');
      toast({
        title: 'ناقص',
        description: `لطفاً مدارک زیر را بارگذاری کنید: ${missingLabels}`,
        variant: 'destructive',
      });
      return;
    }

    onComplete();
  };

  const getDocumentStatus = (docType: DocumentType) => {
    const uploaded = documents.find(d => d.document_type === docType);
    const isRequired = requiredDocTypes.includes(docType);

    if (uploaded) {
      return {
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
        label: 'بارگذاری شده',
        color: 'bg-green-50 dark:bg-green-950',
      };
    } else if (isRequired) {
      return {
        icon: <AlertCircle className="h-5 w-5 text-red-600" />,
        label: 'الزامی',
        color: 'bg-red-50 dark:bg-red-950',
      };
    } else {
      return {
        icon: <FileText className="h-5 w-5 text-gray-400" />,
        label: 'اختیاری',
        color: 'bg-gray-50 dark:bg-gray-900',
      };
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* فرم بارگذاری */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">بارگذاری مدرک جدید</h3>

        <div className="space-y-4">
          {/* انتخاب نوع مدرک */}
          <div className="space-y-2">
            <Label>نوع مدرک <span className="text-red-500">*</span></Label>
            <Select
              value={selectedType}
              onValueChange={(value: DocumentType) => setSelectedType(value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="انتخاب کنید" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([type, label]) => {
                  const status = getDocumentStatus(type as DocumentType);
                  return (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        {status.icon}
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* انتخاب فایل */}
          <div className="space-y-2">
            <Label>فایل <span className="text-red-500">*</span></Label>
            <div className="flex items-center gap-2">
              <input
                id="file-input"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              فرمت‌های مجاز: PDF, JPG, PNG | حداکثر حجم: 5MB
            </p>
          </div>

          {/* پیشرفت بارگذاری */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-sm text-center text-muted-foreground">
                در حال بارگذاری... {uploadProgress}%
              </p>
            </div>
          )}

          {/* دکمه بارگذاری */}
          <Button
            onClick={handleUpload}
            disabled={loading || !selectedFile || !selectedType}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                در حال بارگذاری...
              </>
            ) : (
              <>
                <Upload className="ml-2 h-4 w-4" />
                بارگذاری مدرک
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* وضعیت مدارک */}
      <div>
        <h3 className="text-lg font-semibold mb-4">وضعیت مدارک</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(DOCUMENT_TYPE_LABELS).map(([type, label]) => {
            const status = getDocumentStatus(type as DocumentType);
            const uploaded = documents.find(d => d.document_type === type);

            return (
              <Card
                key={type}
                className={`p-4 ${status.color}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {status.icon}
                    <div className="space-y-1 flex-1">
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground">{status.label}</p>
                      {uploaded && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(uploaded.uploaded_at).toLocaleDateString('fa-IR')}
                        </p>
                      )}
                    </div>
                  </div>
                  {uploaded && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(uploaded.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* راهنما */}
      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>نکات مهم:</strong>
        </p>
        <ul className="text-sm text-blue-900 dark:text-blue-100 list-disc list-inside mt-2 space-y-1">
          <li>فایل‌ها باید واضح و خوانا باشند</li>
          <li>برای عکس پرسنلی از عکس رسمی با زمینه سفید استفاده کنید</li>
          <li>مدارک می‌توانند در قالب PDF یا تصویر باشند</li>
          <li>در صورت نیاز می‌توانید مدارک را حذف و مجدداً بارگذاری کنید</li>
        </ul>
      </div>

      {/* دکمه تکمیل */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          {documents.length} مدرک بارگذاری شده
        </div>
        <Button onClick={handleComplete} size="lg" disabled={loading}>
          تایید و ادامه
        </Button>
      </div>
    </div>
  );
};

export default DocumentUploadStep;
