import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { GraduationCap, Upload, Save } from 'lucide-react';
import { FileUpload } from '@/components/ui/file-upload';
import api from '@/services/api';

interface EducationForm {
  // کارشناسی
  bsc_field: string;
  bsc_graduation_month: string;
  bsc_graduation_year: string;
  bsc_duration_months: number;
  bsc_university: string;
  bsc_gpa: number;
  
  // ارشد
  msc_field: string;
  msc_graduation_month: string;
  msc_graduation_year: string;
  msc_duration_months: number;
  msc_university: string;
  msc_gpa: number;
}

interface DocumentUpload {
  type: string;
  file: File | null;
  uploaded: boolean;
  uploadProgress?: number;
}

const PhdEducationPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  
  const [documents, setDocuments] = useState<Record<string, DocumentUpload>>({
    BSC_CERT: { type: 'BSC_CERT', file: null, uploaded: false, uploadProgress: 0 },
    BSC_TRANSCRIPT: { type: 'BSC_TRANSCRIPT', file: null, uploaded: false, uploadProgress: 0 },
    MSC_CERT: { type: 'MSC_CERT', file: null, uploaded: false, uploadProgress: 0 },
    MSC_TRANSCRIPT: { type: 'MSC_TRANSCRIPT', file: null, uploaded: false, uploadProgress: 0 },
    MSC_EXCELLENCE_CERT: { type: 'MSC_EXCELLENCE_CERT', file: null, uploaded: false, uploadProgress: 0 },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<EducationForm>();

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
        
        // Load existing documents
        if (app.documents) {
          const newDocs = { ...documents };
          app.documents.forEach((doc: any) => {
            if (newDocs[doc.type]) {
              newDocs[doc.type].uploaded = true;
            }
          });
          setDocuments(newDocs);
        }
      }
    } catch (error) {
      console.error('Error fetching application:', error);
    }
  };

  const onSubmit = async (data: EducationForm) => {
    if (!applicationId) return;

    setLoading(true);
    try {
      // ذخیره اطلاعات تحصیلی
      await api.post(`/api/applications/${applicationId}/education/`, {
        bsc: {
          field: data.bsc_field,
          graduation_date: `${data.bsc_graduation_year}-${data.bsc_graduation_month}-01`,
          duration_months: data.bsc_duration_months,
          university: data.bsc_university,
          gpa: data.bsc_gpa,
        },
        msc: {
          field: data.msc_field,
          graduation_date: `${data.msc_graduation_year}-${data.msc_graduation_month}-01`,
          duration_months: data.msc_duration_months,
          university: data.msc_university,
          gpa: data.msc_gpa,
        }
      });

      toast({
        title: 'موفق',
        description: 'سوابق تحصیلی با موفقیت ذخیره شد',
      });

      navigate('..');
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در ذخیره اطلاعات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (docType: string, file: File | null) => {
    setDocuments(prev => ({
      ...prev,
      [docType]: { ...prev[docType], file }
    }));
  };

  const handleFileUpload = async (docType: string) => {
    const doc = documents[docType];
    if (!doc.file || !applicationId) return;

    setUploadingDoc(docType);
    
    // Reset progress
    setDocuments(prev => ({
      ...prev,
      [docType]: { ...prev[docType], uploadProgress: 0 }
    }));

    const formData = new FormData();
    formData.append('file', doc.file);
    formData.append('type', docType);

    try {
      await api.post(`/api/applications/${applicationId}/documents/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setDocuments(prev => ({
            ...prev,
            [docType]: { ...prev[docType], uploadProgress: progress }
          }));
        },
      });

      setDocuments(prev => ({
        ...prev,
        [docType]: { ...prev[docType], uploaded: true, file: null, uploadProgress: 100 }
      }));

      toast({
        title: 'موفق',
        description: 'فایل با موفقیت آپلود شد',
      });
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: 'خطا در آپلود فایل',
        variant: 'destructive',
      });
    } finally {
      setUploadingDoc(null);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">سوابق تحصیلی</h1>
        <p className="text-muted-foreground mt-1">
          ثبت اطلاعات تحصیلات کارشناسی و کارشناسی ارشد
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* کارشناسی */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-500" />
              سوابق تحصیلی کارشناسی
            </CardTitle>
            <CardDescription>حداکثر امتیاز: 9 (طول دوره: 3 + دانشگاه و معدل: 6)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رشته تحصیلی <span className="text-red-500">*</span></Label>
                <Input
                  {...register('bsc_field', { required: true })}
                  placeholder="مثال: مهندسی کامپیوتر"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>ماه اخذ مدرک</Label>
                  <Input
                    type="number"
                    {...register('bsc_graduation_month')}
                    placeholder="12"
                    min="1"
                    max="12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>سال اخذ مدرک</Label>
                  <Input
                    type="number"
                    {...register('bsc_graduation_year')}
                    placeholder="1402"
                    min="1300"
                    max="1410"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>
                  طول دوره (ماه) 
                  <Badge variant="outline" className="mr-2">حداکثر 3 امتیاز</Badge>
                </Label>
                <Input
                  type="number"
                  {...register('bsc_duration_months', { required: true })}
                  placeholder="48"
                  min="36"
                  max="80"
                />
                <p className="text-xs text-muted-foreground">
                  ≤48 ماه: 3 امتیاز | 49-54: 2 امتیاز | 55-60: 1 امتیاز
                </p>
              </div>

              <div className="space-y-2">
                <Label>دانشگاه محل تحصیل <span className="text-red-500">*</span></Label>
                <Input
                  {...register('bsc_university', { required: true })}
                  placeholder="نام دانشگاه"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  معدل کارشناسی
                  <Badge variant="outline" className="mr-2">حداکثر 6 امتیاز</Badge>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('bsc_gpa', { required: true })}
                  placeholder="17.50"
                  min="10"
                  max="20"
                />
              </div>
            </div>

            <Separator className="my-4" />

            {/* مدارک کارشناسی */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Upload className="h-4 w-4" />
                مدارک کارشناسی
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FileUpload
                  label="مدرک کارشناسی"
                  uploaded={documents.BSC_CERT.uploaded}
                  uploading={uploadingDoc === 'BSC_CERT'}
                  uploadProgress={documents.BSC_CERT.uploadProgress}
                  fileName={documents.BSC_CERT.file?.name}
                  onFileSelect={(file) => handleFileSelect('BSC_CERT', file)}
                  onUpload={() => handleFileUpload('BSC_CERT')}
                />

                <FileUpload
                  label="ریز نمرات کارشناسی"
                  uploaded={documents.BSC_TRANSCRIPT.uploaded}
                  uploading={uploadingDoc === 'BSC_TRANSCRIPT'}
                  uploadProgress={documents.BSC_TRANSCRIPT.uploadProgress}
                  fileName={documents.BSC_TRANSCRIPT.file?.name}
                  onFileSelect={(file) => handleFileSelect('BSC_TRANSCRIPT', file)}
                  onUpload={() => handleFileUpload('BSC_TRANSCRIPT')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* کارشناسی ارشد */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-green-500" />
              سوابق تحصیلی کارشناسی ارشد
            </CardTitle>
            <CardDescription>حداکثر امتیاز: 8 (طول دوره: 3 + دانشگاه و معدل: 5)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رشته تحصیلی <span className="text-red-500">*</span></Label>
                <Input
                  {...register('msc_field', { required: true })}
                  placeholder="مثال: هوش مصنوعی"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>ماه اخذ مدرک</Label>
                  <Input
                    type="number"
                    {...register('msc_graduation_month')}
                    placeholder="12"
                    min="1"
                    max="12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>سال اخذ مدرک</Label>
                  <Input
                    type="number"
                    {...register('msc_graduation_year')}
                    placeholder="1403"
                    min="1300"
                    max="1410"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>
                  طول دوره (ماه)
                  <Badge variant="outline" className="mr-2">حداکثر 3 امتیاز</Badge>
                </Label>
                <Input
                  type="number"
                  {...register('msc_duration_months', { required: true })}
                  placeholder="24"
                  min="20"
                  max="48"
                />
                <p className="text-xs text-muted-foreground">
                  ≤24 ماه: 3 امتیاز | 25-30: 2 امتیاز | 31-36: 1 امتیاز
                </p>
              </div>

              <div className="space-y-2">
                <Label>دانشگاه محل تحصیل <span className="text-red-500">*</span></Label>
                <Input
                  {...register('msc_university', { required: true })}
                  placeholder="نام دانشگاه"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  معدل کارشناسی ارشد
                  <Badge variant="outline" className="mr-2">حداکثر 5 امتیاز</Badge>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('msc_gpa', { required: true })}
                  placeholder="18.00"
                  min="10"
                  max="20"
                />
              </div>
            </div>

            <Separator className="my-4" />

            {/* مدارک ارشد */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Upload className="h-4 w-4" />
                مدارک کارشناسی ارشد
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FileUpload
                  label="مدرک کارشناسی ارشد (اختیاری - در صورت اتمام تحصیل)"
                  uploaded={documents.MSC_CERT.uploaded}
                  uploading={uploadingDoc === 'MSC_CERT'}
                  uploadProgress={documents.MSC_CERT.uploadProgress}
                  fileName={documents.MSC_CERT.file?.name}
                  onFileSelect={(file) => handleFileSelect('MSC_CERT', file)}
                  onUpload={() => handleFileUpload('MSC_CERT')}
                />

                <FileUpload
                  label="ریز نمرات کارشناسی ارشد"
                  uploaded={documents.MSC_TRANSCRIPT.uploaded}
                  uploading={uploadingDoc === 'MSC_TRANSCRIPT'}
                  uploadProgress={documents.MSC_TRANSCRIPT.uploadProgress}
                  fileName={documents.MSC_TRANSCRIPT.file?.name}
                  onFileSelect={(file) => handleFileSelect('MSC_TRANSCRIPT', file)}
                  onUpload={() => handleFileUpload('MSC_TRANSCRIPT')}
                />

              <FileUpload
                label="گواهی رتبه ممتاز"
                uploaded={documents.MSC_EXCELLENCE_CERT.uploaded}
                uploading={uploadingDoc === 'MSC_EXCELLENCE_CERT'}
                uploadProgress={documents.MSC_EXCELLENCE_CERT.uploadProgress}
                fileName={documents.MSC_EXCELLENCE_CERT.file?.name}
                onFileSelect={(file) => handleFileSelect('MSC_EXCELLENCE_CERT', file)}
                onUpload={() => handleFileUpload('MSC_EXCELLENCE_CERT')}
              />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            <Save className="ml-2 h-4 w-4" />
            {loading ? 'در حال ذخیره...' : 'ذخیره و ادامه'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PhdEducationPage;
