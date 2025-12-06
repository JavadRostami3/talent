import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Upload, File, Trash2, Check, AlertCircle, ArrowRight } from 'lucide-react';
import api from '@/services/api';
import type { Document, DocumentType } from '@/types/models';

interface DocumentUploadFormProps {
  applicationId: number;
  onComplete: () => void;
  onBack: () => void;
}

const DocumentUploadForm = ({ applicationId, onComplete, onBack }: DocumentUploadFormProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const requiredDocumentTypes: { type: DocumentType; label: string; description: string }[] = [
    {
      type: 'NATIONAL_ID',
      label: 'کارت ملی',
      description: 'تصویر کارت ملی (هر دو روی)',
    },
    {
      type: 'BIRTH_CERTIFICATE',
      label: 'شناسنامه',
      description: 'تصویر شناسنامه (صفحات مشخصات)',
    },
    {
      type: 'PHOTO',
      label: 'عکس پرسنلی',
      description: 'عکس پرسنلی 4x3 با پس‌زمینه روشن',
    },
    {
      type: 'TRANSCRIPT',
      label: 'ریز نمرات',
      description: 'ریز نمرات آخرین مقطع تحصیلی',
    },
    {
      type: 'DEGREE',
      label: 'مدرک تحصیلی',
      description: 'مدرک تحصیلی آخرین مقطع (در صورت فارغ‌التحصیلی)',
    },
  ];

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await api.get<Document[]>(
        `/api/applications/${applicationId}/documents/`
      );
      setDocuments(response.data);
    } catch (error: any) {
      toast({
        title: 'خطا در بارگذاری',
        description: 'مدارک بارگذاری نشد',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (type: DocumentType, file: File) => {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'حجم فایل زیاد است',
        description: 'حداکثر حجم مجاز: 5 مگابایت',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'فرمت فایل نامعتبر',
        description: 'فقط فایل‌های JPG، PNG و PDF مجاز هستند',
        variant: 'destructive',
      });
      return;
    }

    setUploading(type);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', type);

    try {
      await api.post(`/api/applications/${applicationId}/documents/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast({
        title: 'آپلود موفق',
        description: 'فایل با موفقیت آپلود شد',
      });

      fetchDocuments();
    } catch (error: any) {
      toast({
        title: 'خطا در آپلود',
        description: error.response?.data?.error || 'خطایی رخ داده است',
        variant: 'destructive',
      });
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (documentId: number) => {
    if (!confirm('آیا از حذف این مدرک اطمینان دارید؟')) return;

    try {
      await api.delete(`/api/applications/${applicationId}/documents/${documentId}/`);

      toast({
        title: 'حذف موفق',
        description: 'مدرک حذف شد',
      });

      fetchDocuments();
    } catch (error: any) {
      toast({
        title: 'خطا در حذف',
        description: error.response?.data?.error || 'خطایی رخ داده است',
        variant: 'destructive',
      });
    }
  };

  const getDocumentForType = (type: DocumentType) => {
    return documents.find((doc) => doc.document_type === type);
  };

  const handleContinue = () => {
    // Check if all required documents are uploaded
    const requiredTypes = ['NATIONAL_ID', 'BIRTH_CERTIFICATE', 'PHOTO', 'TRANSCRIPT'];
    const missingTypes = requiredTypes.filter(
      (type) => !documents.some((doc) => doc.document_type === type)
    );

    if (missingTypes.length > 0) {
      toast({
        title: 'مدارک ناقص',
        description: 'لطفاً تمام مدارک الزامی را آپلود کنید',
        variant: 'destructive',
      });
      return;
    }

    onComplete();
  };

  const isRequired = (type: DocumentType) => {
    return ['NATIONAL_ID', 'BIRTH_CERTIFICATE', 'PHOTO', 'TRANSCRIPT'].includes(type);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>بارگذاری مدارک</CardTitle>
        <CardDescription>
          لطفاً مدارک مورد نیاز را آپلود کنید. فرمت‌های مجاز: JPG، PNG، PDF (حداکثر 5MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Document Upload Sections */}
        <div className="space-y-4">
          {requiredDocumentTypes.map((docType) => {
            const existingDoc = getDocumentForType(docType.type);
            const isUploading = uploading === docType.type;

            return (
              <Card key={docType.type} className="bg-accent/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Label className="text-base font-medium">{docType.label}</Label>
                        {isRequired(docType.type) ? (
                          <Badge variant="destructive" className="text-xs">
                            الزامی
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            اختیاری
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {docType.description}
                      </p>

                      {existingDoc ? (
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">آپلود شده</span>
                          <a
                            href={existingDoc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            مشاهده فایل
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">آپلود نشده</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {existingDoc ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(existingDoc.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}

                      <Button
                        size="sm"
                        variant={existingDoc ? 'outline' : 'default'}
                        disabled={isUploading}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/jpeg,image/png,image/jpg,application/pdf';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              handleFileUpload(docType.type, file);
                            }
                          };
                          input.click();
                        }}
                      >
                        {isUploading ? (
                          'در حال آپلود...'
                        ) : existingDoc ? (
                          <>
                            <Upload className="h-4 w-4 ml-1" />
                            جایگزینی
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 ml-1" />
                            آپلود
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">نکات مهم:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>تمام مدارک الزامی باید آپلود شوند</li>
                <li>فایل‌ها باید واضح و خوانا باشند</li>
                <li>حداکثر حجم هر فایل: 5 مگابایت</li>
                <li>فرمت‌های مجاز: JPG، PNG، PDF</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowRight className="ml-2 h-4 w-4" />
            مرحله قبل
          </Button>
          <Button onClick={handleContinue}>
            <Check className="ml-2 h-4 w-4" />
            تکمیل و ارسال درخواست
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentUploadForm;
