import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle2, X, AlertCircle } from 'lucide-react';
import api from '@/services/api';

interface Document {
  id: number;
  type: string;
  file: string;
  status: string;
}

interface DocumentType {
  type: string;
  label: string;
  required: boolean;
}

const DocumentsUpload = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || 'identity';
  
  const [loading, setLoading] = useState(false);
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const documentTypes: { [key: string]: DocumentType[] } = {
    identity: [
      { type: 'PERSONAL_PHOTO', label: 'عکس پرسنلی', required: true },
      { type: 'NATIONAL_CARD', label: 'تصویر کارت ملی', required: true },
      { type: 'ID_CARD', label: 'تصویر شناسنامه', required: true },
    ],
    education: [
      { type: 'BSC_CERT', label: 'مدرک کارشناسی', required: true },
      { type: 'BSC_TRANSCRIPT', label: 'ریزنمرات کارشناسی', required: true },
      { type: 'EXCELLENCE_CERT', label: 'گواهی دانشجو ممتاز', required: false },
      { type: 'MSC_CERT', label: 'مدرک کارشناسی ارشد', required: false },
      { type: 'MSC_TRANSCRIPT', label: 'ریزنمرات ارشد', required: false },
      { type: 'MSC_EXCELLENCE_CERT', label: 'فرم رتبه ممتاز ارشد', required: false },
    ],
  };

  useEffect(() => {
    fetchApplication();
  }, []);

  const fetchApplication = async () => {
    try {
      const response = await api.get('/api/applicant/applications/');
      if (response.data.length > 0) {
        const app = response.data[0];
        setApplicationId(app.id);
        setDocuments(app.documents || []);
      }
    } catch (error) {
      console.error('Error fetching application:', error);
    }
  };

  const handleFileUpload = async (type: string, file: File) => {
    if (!applicationId) {
      toast({
        title: 'خطا',
        description: 'ابتدا باید درخواست خود را ایجاد کنید',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('application', applicationId.toString());
    formData.append('type', type);
    formData.append('file', file);

    try {
      setUploadProgress({ ...uploadProgress, [type]: 0 });

      const response = await api.post(`/api/applicant/applications/${applicationId}/documents/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress({ ...uploadProgress, [type]: progress });
        },
      });

      setDocuments([...documents, response.data]);
      
      toast({
        title: 'موفق',
        description: 'فایل با موفقیت آپلود شد',
      });

      // Update application status
      if (category === 'identity') {
        const identityDocs = documents.filter(d => 
          ['PERSONAL_PHOTO', 'NATIONAL_CARD', 'ID_CARD'].includes(d.type)
        );
        if (identityDocs.length >= 2) {
          await api.patch(`/api/applicant/applications/${applicationId}/update/`, {
            status: 'IDENTITY_DOCS_UPLOADED',
          });
        }
      } else if (category === 'education') {
        const eduDocs = documents.filter(d =>
          ['BSC_CERT', 'BSC_TRANSCRIPT'].includes(d.type)
        );
        if (eduDocs.length >= 2) {
          await api.patch(`/api/applicant/applications/${applicationId}/update/`, {
            status: 'EDU_DOCS_UPLOADED',
          });
        }
      }

      setUploadProgress({ ...uploadProgress, [type]: 100 });
      setTimeout(() => {
        setUploadProgress({ ...uploadProgress, [type]: 0 });
      }, 2000);

    } catch (error) {
      toast({
        title: 'خطا',
        description: 'آپلود فایل با خطا مواجه شد',
        variant: 'destructive',
      });
      setUploadProgress({ ...uploadProgress, [type]: 0 });
    }
  };

  const handleDelete = async (docId: number) => {
    try {
      await api.delete(`/api/documents/${docId}/`);
      setDocuments(documents.filter(d => d.id !== docId));
      
      toast({
        title: 'موفق',
        description: 'فایل حذف شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'حذف فایل با خطا مواجه شد',
        variant: 'destructive',
      });
    }
  };

  const currentDocTypes = documentTypes[category] || [];
  const hasDocument = (type: string) => documents.some(d => d.type === type);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>
            {category === 'identity' ? 'مدارک شناسایی' : 'مدارک تحصیلی'}
          </CardTitle>
          <CardDescription>
            فایل‌های مجاز: PDF, JPG, PNG - حداکثر حجم: 5MB
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              لطفاً تصاویر واضح و خوانا از مدارک خود را آپلود نمایید. فرمت‌های مجاز: PDF, JPG, PNG
            </AlertDescription>
          </Alert>

          {currentDocTypes.map((docType) => {
            const uploaded = hasDocument(docType.type);
            const progress = uploadProgress[docType.type] || 0;

            return (
              <div key={docType.type} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <h4 className="font-medium">{docType.label}</h4>
                      {!docType.required && (
                        <span className="text-xs text-muted-foreground">(اختیاری)</span>
                      )}
                    </div>
                  </div>
                  
                  {uploaded ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const doc = documents.find(d => d.type === docType.type);
                          if (doc) handleDelete(doc.id);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Label
                      htmlFor={`file-${docType.type}`}
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      <Upload className="h-4 w-4" />
                      آپلود
                      <Input
                        id={`file-${docType.type}`}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              toast({
                                title: 'خطا',
                                description: 'حجم فایل نباید بیشتر از 5MB باشد',
                                variant: 'destructive',
                              });
                              return;
                            }
                            handleFileUpload(docType.type, file);
                          }
                        }}
                      />
                    </Label>
                  )}
                </div>

                {progress > 0 && progress < 100 && (
                  <div className="space-y-1">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                      در حال آپلود... {progress}%
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex gap-4 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => navigate('/student')}>
              بازگشت به داشبورد
            </Button>
            <Button onClick={() => navigate('/student')}>
              <CheckCircle2 className="ml-2 h-4 w-4" />
              تایید و ادامه
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentsUpload;
