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
import { FileUpload } from '@/components/ui/file-upload';
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
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File | null }>({});

  const documentTypes: { [key: string]: DocumentType[] } = {
    identity: [
      { type: 'PERSONAL_PHOTO', label: 'عکس پرسنلی', required: true },
      { type: 'NATIONAL_CARD', label: 'تصویر کارت ملی', required: true },
      { type: 'ID_CARD', label: 'تصویر شناسنامه', required: true },
    ],
    education: [
      { type: 'BSC_CERT', label: 'مدرک کارشناسی', required: true },
      { type: 'BSC_TRANSCRIPT', label: 'ریزنمرات کارشناسی', required: true },
      { type: 'EXCELLENCE_CERT', label: 'گواهی رتبه ممتاز کارشناسی', required: true },
    ],
  };

  useEffect(() => {
    fetchApplication();
  }, []);

  const fetchApplication = async () => {
    try {
      const response = await api.get('/api/applications/');
      const applications = Array.isArray(response.data) ? response.data : response.data.results || [];
      if (applications.length > 0) {
        const app = applications[0];
        setApplicationId(app.id);
        setDocuments(app.documents || []);
      }
    } catch (error) {
      console.error('Error fetching application:', error);
    }
  };

  const handleFileUpload = async (type: string, file: File | null) => {
    if (!file || !applicationId) {
      toast({
        title: 'خطا',
        description: 'لطفاً ابتدا فایلی انتخاب کنید',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('application', applicationId.toString());
    formData.append('type', type);
    formData.append('file', file);

    try {
      setUploadingType(type);
      setUploadProgress({ ...uploadProgress, [type]: 0 });

      const response = await api.post(`/api/applications/${applicationId}/documents/`, formData, {
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
      setSelectedFiles({ ...selectedFiles, [type]: null });
      
      toast({
        title: 'موفق',
        description: 'فایل با موفقیت آپلود شد',
      });

      // Update application status
      if (category === 'identity') {
        const identityDocs = documents.filter(d => 
          ['PERSONAL_PHOTO', 'NATIONAL_CARD', 'ID_CARD'].includes(d.type)
        );
        if (identityDocs.length >= 3) {
          await api.patch(`/api/applications/${applicationId}/update/`, {
            status: 'IDENTITY_DOCS_UPLOADED',
          });
        }
      } else if (category === 'education') {
        const eduDocs = documents.filter(d =>
          ['BSC_CERT', 'BSC_TRANSCRIPT'].includes(d.type)
        );
        if (eduDocs.length >= 2) {
          await api.patch(`/api/applications/${applicationId}/update/`, {
            status: 'EDU_DOCS_UPLOADED',
          });
        }
      }

      setUploadProgress({ ...uploadProgress, [type]: 100 });

    } catch (error) {
      toast({
        title: 'خطا',
        description: 'آپلود فایل با خطا مواجه شد',
        variant: 'destructive',
      });
      setUploadProgress({ ...uploadProgress, [type]: 0 });
    } finally {
      setUploadingType(null);
    }
  };

  const handleFileSelect = (type: string, file: File | null) => {
    if (file && file.size > 5 * 1024 * 1024) {
      toast({
        title: 'خطا',
        description: 'حجم فایل نباید بیشتر از 5MB باشد',
        variant: 'destructive',
      });
      return;
    }
    setSelectedFiles({ ...selectedFiles, [type]: file });
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
            const doc = documents.find(d => d.type === docType.type);

            return (
              <FileUpload
                key={docType.type}
                label={`${docType.label}${!docType.required ? ' (اختیاری)' : ''}`}
                uploaded={uploaded}
                uploading={uploadingType === docType.type}
                uploadProgress={progress}
                fileName={selectedFiles[docType.type]?.name || doc?.file}
                onFileSelect={(file) => handleFileSelect(docType.type, file)}
                onUpload={() => handleFileUpload(docType.type, selectedFiles[docType.type])}
                onRemove={() => {
                  if (doc) handleDelete(doc.id);
                }}
              />
            );
          })}

          <div className="flex gap-4 justify-end pt-4 border-t">
            <Button onClick={() => navigate('..')}>
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
