import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const PhdEducationDocuments = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const documentTypes: DocumentType[] = [
    { type: 'BSC_CERT', label: 'مدرک کارشناسی', required: true },
    { type: 'BSC_TRANSCRIPT', label: 'ریزنمرات کارشناسی', required: true },
    { type: 'BSC_EXCELLENCE_CERT', label: 'گواهی رتبه ممتاز کارشناسی', required: false },
    { type: 'MSC_CERT', label: 'مدرک کارشناسی ارشد', required: true },
    { type: 'MSC_TRANSCRIPT', label: 'ریزنمرات کارشناسی ارشد', required: true },
    { type: 'MSC_EXCELLENCE_CERT', label: 'فرم رتبه ممتاز ارشد', required: false },
  ];

  useEffect(() => {
    fetchApplication();
  }, []);

  const fetchApplication = async () => {
    try {
      const response = await api.get('/api/applicant/applications/');
      if (response.data.results && response.data.results.length > 0) {
        const app = response.data.results[0];
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

      setUploadProgress({ ...uploadProgress, [type]: 100 });
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در آپلود فایل',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!applicationId) return;

    try {
      await api.delete(`/api/applicant/applications/${applicationId}/documents/${docId}/`);
      setDocuments(documents.filter(d => d.id !== docId));
      
      toast({
        title: 'موفق',
        description: 'فایل حذف شد',
      });
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: 'خطا در حذف فایل',
        variant: 'destructive',
      });
    }
  };

  const getUploadedDocument = (type: string) => {
    return documents.find(d => d.type === type);
  };

  const requiredDocsCount = documentTypes.filter(d => d.required).length;
  const uploadedRequiredDocsCount = documentTypes.filter(d => 
    d.required && getUploadedDocument(d.type)
  ).length;
  const completionPercentage = (uploadedRequiredDocsCount / requiredDocsCount) * 100;

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">مدارک تحصیلی - دکتری</h1>
        <p className="text-muted-foreground mt-1">
          آپلود مدارک و ریزنمرات کارشناسی و کارشناسی ارشد
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle>پیشرفت آپلود مدارک</CardTitle>
          <CardDescription>
            {uploadedRequiredDocsCount} از {requiredDocsCount} مدرک الزامی آپلود شده
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={completionPercentage} className="h-3" />
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>توجه:</strong> فایل‌ها باید واضح و خوانا باشند. فرمت مجاز: PDF (حداکثر 10 مگابایت) یا تصویر JPG/PNG (حداکثر 2 مگابایت)
        </AlertDescription>
      </Alert>

      {/* BSC Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle>مدارک کارشناسی</CardTitle>
          <CardDescription>مدارک و ریزنمرات مقطع کارشناسی</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {documentTypes.filter(dt => dt.type.startsWith('BSC')).map((docType) => {
            const uploaded = getUploadedDocument(docType.type);
            const progress = uploadProgress[docType.type];

            return (
              <div key={docType.type} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label className="font-medium">
                        {docType.label}
                        {docType.required && <span className="text-red-500 mr-1">*</span>}
                      </Label>
                      {!docType.required && (
                        <p className="text-xs text-muted-foreground">اختیاری</p>
                      )}
                    </div>
                  </div>
                  
                  {uploaded ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDocument(uploaded.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          انتخاب فایل
                        </span>
                      </Button>
                      <Input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(docType.type, file);
                        }}
                      />
                    </label>
                  )}
                </div>

                {uploaded && (
                  <div className="text-sm text-muted-foreground">
                    <a href={uploaded.file} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      مشاهده فایل
                    </a>
                  </div>
                )}

                {progress !== undefined && progress < 100 && (
                  <Progress value={progress} className="h-2" />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* MSC Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle>مدارک کارشناسی ارشد</CardTitle>
          <CardDescription>مدارک و ریزنمرات مقطع کارشناسی ارشد</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {documentTypes.filter(dt => dt.type.startsWith('MSC')).map((docType) => {
            const uploaded = getUploadedDocument(docType.type);
            const progress = uploadProgress[docType.type];

            return (
              <div key={docType.type} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label className="font-medium">
                        {docType.label}
                        {docType.required && <span className="text-red-500 mr-1">*</span>}
                      </Label>
                      {!docType.required && (
                        <p className="text-xs text-muted-foreground">اختیاری</p>
                      )}
                    </div>
                  </div>
                  
                  {uploaded ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDocument(uploaded.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          انتخاب فایل
                        </span>
                      </Button>
                      <Input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(docType.type, file);
                        }}
                      />
                    </label>
                  )}
                </div>

                {uploaded && (
                  <div className="text-sm text-muted-foreground">
                    <a href={uploaded.file} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      مشاهده فایل
                    </a>
                  </div>
                )}

                {progress !== undefined && progress < 100 && (
                  <Progress value={progress} className="h-2" />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          بازگشت
        </Button>
        <Button 
          onClick={() => navigate('/student')}
          disabled={completionPercentage < 100}
        >
          ادامه
        </Button>
      </div>
    </div>
  );
};

export default PhdEducationDocuments;
