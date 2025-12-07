import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, FileText, Trash2, Edit2, AlertCircle, BookOpen, 
  Trophy, FlaskConical, Award, GraduationCap, Upload,
  CheckCircle2, XCircle
} from 'lucide-react';
import api from '@/services/api';
import applicationService from '@/services/applicationService';
import { ResearchRecordType } from '@/types/models';
import { FileUpload } from '@/components/ui/file-upload';

interface ResearchRecord {
  id: number;
  type: 'ARTICLE' | 'PROMOTIONAL_ARTICLE' | 'PATENT' | 'FESTIVAL_AWARD' | 'CONFERENCE' | 'BOOK' | 'MASTERS_THESIS';
  title_fa?: string;
  title_en?: string;
  article_type?: string;
  journal_name?: string;
  issn?: string;
  status?: string;
  publish_date?: string;
  link?: string;
  doi?: string;
  publish_year?: number;
  authors?: string;
  patent_number?: string;
  registration_date?: string;
  inventors?: string;
  festival_name?: string;
  award_title?: string;
  year?: number;
  conference_name?: string;
  conference_type?: string;
  book_type?: string;
  publisher?: string;
  isbn?: string;
  authors_or_translators?: string;
  grade?: number;
  defense_date?: string;
  main_supervisor?: string;
  second_supervisor?: string;
  advisor_1?: string;
  description?: string;
  file?: string;
  article_file?: string;
  supplementary_file?: string;
  score?: number;
  created_at?: string;
}

interface RecordFormData {
  type: string;
  article_file?: File | string;
  supplementary_file?: File | string;
  [key: string]: any;
}

const ResearchRecordsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [records, setRecords] = useState<ResearchRecord[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Debug: Log records whenever they change
  useEffect(() => {
    console.log('🔄 Records state updated:', records);
    console.log('📊 Records count:', records.length);
  }, [records]);

  const [selectedType, setSelectedType] = useState<ResearchRecordType | ''>('');
  const [editingRecord, setEditingRecord] = useState<ResearchRecord | null>(null);
  const [formData, setFormData] = useState<RecordFormData>({ type: '' });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedArticleFile, setSelectedArticleFile] = useState<File | null>(null);
  const [selectedSupplementaryFile, setSelectedSupplementaryFile] = useState<File | null>(null);

  const recordTypes: Array<{ value: ResearchRecordType; label: string; icon: any; color: string }> = [
    { value: 'ARTICLE', label: 'مقاله علمی-پژوهشی', icon: FileText, color: 'bg-blue-500' },
    { value: 'PROMOTIONAL_ARTICLE', label: 'مقاله علمی-ترویجی', icon: FileText, color: 'bg-cyan-500' },
    { value: 'CONFERENCE', label: 'مقاله کنفرانس', icon: BookOpen, color: 'bg-purple-500' },
    { value: 'PATENT', label: 'اختراع', icon: FlaskConical, color: 'bg-green-500' },
    { value: 'BOOK', label: 'کتاب', icon: BookOpen, color: 'bg-orange-500' },
    { value: 'FESTIVAL_AWARD', label: 'جایزه جشنواره', icon: Trophy, color: 'bg-yellow-500' },
    { value: 'MASTERS_THESIS', label: 'پایان‌نامه ارشد', icon: GraduationCap, color: 'bg-indigo-500' },
  ];

  useEffect(() => {
    fetchApplication();
  }, []);

  const fetchApplication = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching application...');
      const response = await api.get('/api/applications/');
      console.log('📥 Application response:', response.data);
      
      // Backend returns array directly, not {results: [...]}
      const applications = Array.isArray(response.data) ? response.data : response.data.results || [];
      
      if (applications.length > 0) {
        const app = applications[0];
        console.log('✅ Application found:', app.id);
        setApplicationId(app.id);
        await fetchRecords(app.id);
      } else {
        console.warn('⚠️ No applications found in response');
      }
    } catch (error) {
      console.error('❌ Error fetching application:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری اطلاعات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async (appId: number) => {
    try {
      const data = await applicationService.getResearchRecords(appId);
      console.log('📚 Research records fetched:', data);
      
      // Backend returns {total_records, total_score, summary, records: [...]}
      if (data && typeof data === 'object' && 'records' in data) {
        console.log('✅ Setting records:', data.records);
        setRecords(Array.isArray(data.records) ? data.records : []);
      } else if (Array.isArray(data)) {
        // Fallback if backend returns array directly
        console.log('✅ Setting records (array):', data);
        setRecords(data);
      } else {
        console.warn('⚠️ Unexpected data format:', data);
        setRecords([]);
      }
    } catch (error) {
      console.error('❌ Error fetching records:', error);
      setRecords([]);
    }
  };

  const openCreateDialog = (type: ResearchRecordType) => {
    setSelectedType(type);
    setEditingRecord(null);
    setFormData({ type });
    setSelectedArticleFile(null);
    setSelectedSupplementaryFile(null);
    setDialogOpen(true);
  };

  const openEditDialog = (record: ResearchRecord) => {
    setSelectedType(record.type);
    setEditingRecord(record);
    setFormData({ type: record.type, ...record });
    setSelectedArticleFile(null);
    setSelectedSupplementaryFile(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 Form submitted');
    console.log('📋 Form data:', formData);
    console.log('🆔 Application ID:', applicationId);
    
    if (!applicationId) {
      toast({
        title: 'خطا',
        description: 'شناسه درخواست یافت نشد',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { type, id, score, created_at, file, article_file, supplementary_file, ...data } = formData;
      
      console.log('📤 Sending data:', { type, data });

      let recordId: number;

      if (editingRecord) {
        console.log('✏️ Updating record:', editingRecord.id);
        await applicationService.updateResearchRecord(
          applicationId,
          type as ResearchRecordType,
          editingRecord.id,
          data
        );
        recordId = editingRecord.id;
        toast({
          title: 'موفق',
          description: 'سابقه پژوهشی به‌روزرسانی شد',
        });
      } else {
        console.log('➕ Creating new record');
        const response = await applicationService.createResearchRecord(applicationId, {
          type: type as ResearchRecordType,
          data,
        });
        console.log('✅ Response:', response);
        recordId = response.id;
        toast({
          title: 'موفق',
          description: 'سابقه پژوهشی ثبت شد',
        });
      }

      // Refresh records list
      await fetchRecords(applicationId);

      // TODO: Backend upload endpoint not implemented yet
      // File uploads will be added when backend is ready
      
      setDialogOpen(false);
      setFormData({ type: '' });
      setSelectedArticleFile(null);
      setSelectedSupplementaryFile(null);
      console.log('✅ Submit completed successfully');
    } catch (error: any) {
      console.error('❌ Error:', error);
      console.error('❌ Error response:', error.response?.data);
      toast({
        title: 'خطا',
        description: error.response?.data?.error || error.response?.data?.data || 'خطا در ثبت سابقه',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (record: ResearchRecord) => {
    if (!applicationId || !confirm('آیا از حذف این سابقه اطمینان دارید؟')) return;

    setLoading(true);
    try {
      await applicationService.deleteResearchRecord(applicationId, record.type, record.id);
      toast({
        title: 'موفق',
        description: 'سابقه پژوهشی حذف شد',
      });
      await fetchRecords(applicationId);
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: 'خطا در حذف سابقه',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // TODO: File upload endpoint not implemented in backend yet
  /*
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, recordId: number) => {
    const file = e.target.files?.[0];
    if (!file || !applicationId) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingFile(true);
    try {
      await api.post(
        `/api/applications/${applicationId}/research-records/${recordId}/upload/`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      toast({
        title: 'موفق',
        description: 'فایل با موفقیت آپلود شد',
      });
      await fetchRecords(applicationId);
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: 'خطا در آپلود فایل',
        variant: 'destructive',
      });
    } finally {
      setUploadingFile(false);
    }
  };
  */

  const renderFormFields = () => {
    switch (selectedType) {
      case 'ARTICLE':
      case 'PROMOTIONAL_ARTICLE':
        return (
          <>
            <div className="space-y-2">
              <Label>عنوان فارسی <span className="text-red-500">*</span></Label>
              <Input
                value={formData.title_fa || ''}
                onChange={(e) => setFormData({ ...formData, title_fa: e.target.value })}
                placeholder="عنوان مقاله به فارسی"
              />
            </div>
            
            <div className="space-y-2">
              <Label>عنوان انگلیسی <span className="text-red-500">*</span></Label>
              <Input
                value={formData.title_en || ''}
                onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                placeholder="Article title in English"
                dir="ltr"
              />
            </div>
            
            <div className="space-y-2">
              <Label>عنوان نشریه <span className="text-red-500">*</span></Label>
              <Input
                value={formData.journal_name || ''}
                onChange={(e) => setFormData({ ...formData, journal_name: e.target.value })}
                placeholder="نام ژورنال یا نشریه"
              />
            </div>
            
            <div className="space-y-2">
              <Label>ISSN نشریه</Label>
              <Input
                value={formData.issn || ''}
                onChange={(e) => setFormData({ ...formData, issn: e.target.value })}
                placeholder="XXXX-XXXX"
                dir="ltr"
              />
            </div>
            
            <div className="space-y-2">
              <Label>نوع نشریه <span className="text-red-500">*</span></Label>
              <Select
                value={formData.article_type || ''}
                onValueChange={(value) => setFormData({ ...formData, article_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RESEARCH_NATIONAL">علمی-پژوهشی (ملی)</SelectItem>
                  <SelectItem value="RESEARCH_INTERNATIONAL">علمی-پژوهشی (بین‌المللی)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>وضعیت مقاله <span className="text-red-500">*</span></Label>
              <Select
                value={formData.status || ''}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOT_RELATED">غیرمرتبط با پایان‌نامه</SelectItem>
                  <SelectItem value="EXTRACTED_FROM_THESIS">مستخرج از پایان‌نامه</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>تاریخ چاپ یا پذیرش <span className="text-red-500">*</span></Label>
              <Input
                value={formData.publish_date || ''}
                onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                placeholder="1403/09/15"
              />
            </div>
            
            <div className="space-y-2">
              <Label>لینک مقاله</Label>
              <Input
                value={formData.link || ''}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://..."
                dir="ltr"
              />
            </div>
            
            <div className="space-y-2">
              <Label>نویسندگان <span className="text-red-500">*</span></Label>
              <Textarea
                value={formData.authors || ''}
                onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                placeholder="نام نویسنده اول (نویسنده مسئول)، نویسنده دوم، ..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                نویسنده اول را با عنوان «نویسنده مسئول» یا «نویسنده اول» مشخص کنید
              </p>
            </div>
            
            <FileUpload
              label="فایل مقاله (PDF)"
              accept=".pdf"
              fileName={selectedArticleFile?.name || (typeof formData.article_file === 'string' ? 'فایل موجود' : undefined)}
              uploaded={!!formData.article_file && typeof formData.article_file === 'string'}
              onFileSelect={(file) => {
                setSelectedArticleFile(file);
                setFormData({ ...formData, article_file: file });
              }}
              onRemove={() => {
                setSelectedArticleFile(null);
                setFormData({ ...formData, article_file: undefined });
              }}
            />
            
            <FileUpload
              label="فایل مدارک تکمیلی (نامه پذیرش، کاور ژورنال)"
              accept=".pdf,.zip,.rar"
              fileName={selectedSupplementaryFile?.name || (typeof formData.supplementary_file === 'string' ? 'فایل موجود' : undefined)}
              uploaded={!!formData.supplementary_file && typeof formData.supplementary_file === 'string'}
              onFileSelect={(file) => {
                setSelectedSupplementaryFile(file);
                setFormData({ ...formData, supplementary_file: file });
              }}
              onRemove={() => {
                setSelectedSupplementaryFile(null);
                setFormData({ ...formData, supplementary_file: undefined });
              }}
            />
          </>
        );

      case 'PATENT':
        return (
          <>
            <div className="space-y-2">
              <Label>عنوان اختراع <span className="text-red-500">*</span></Label>
              <Input
                value={formData.title_fa || ''}
                onChange={(e) => setFormData({ ...formData, title_fa: e.target.value })}
                placeholder="عنوان اختراع"
              />
            </div>
            <div className="space-y-2">
              <Label>شماره ثبت <span className="text-red-500">*</span></Label>
              <Input
                value={formData.patent_number || ''}
                onChange={(e) => setFormData({ ...formData, patent_number: e.target.value })}
                placeholder="شماره ثبت اختراع"
              />
            </div>
            <div className="space-y-2">
              <Label>تاریخ ثبت <span className="text-red-500">*</span></Label>
              <Input
                value={formData.registration_date || ''}
                onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
                placeholder="1402/09/15"
              />
            </div>
            <div className="space-y-2">
              <Label>نام مخترعان <span className="text-red-500">*</span></Label>
              <Input
                value={formData.inventors || ''}
                onChange={(e) => setFormData({ ...formData, inventors: e.target.value })}
                placeholder="مخترع 1، مخترع 2، ..."
              />
            </div>
            <div className="space-y-2">
              <Label>توضیحات</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="توضیحات اختراع"
                rows={3}
              />
            </div>
          </>
        );

      case 'CONFERENCE':
        return (
          <>
            <div className="space-y-2">
              <Label>عنوان فارسی <span className="text-red-500">*</span></Label>
              <Input
                value={formData.title_fa || ''}
                onChange={(e) => setFormData({ ...formData, title_fa: e.target.value })}
                placeholder="عنوان مقاله کنفرانس"
              />
            </div>
            <div className="space-y-2">
              <Label>عنوان انگلیسی <span className="text-red-500">*</span></Label>
              <Input
                value={formData.title_en || ''}
                onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                placeholder="Conference paper title"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>نام کنفرانس <span className="text-red-500">*</span></Label>
              <Input
                value={formData.conference_name || ''}
                onChange={(e) => setFormData({ ...formData, conference_name: e.target.value })}
                placeholder="نام کنفرانس"
              />
            </div>
            <div className="space-y-2">
              <Label>نوع کنفرانس <span className="text-red-500">*</span></Label>
              <Select
                value={formData.conference_type || ''}
                onValueChange={(value) => setFormData({ ...formData, conference_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NATIONAL">داخلی</SelectItem>
                  <SelectItem value="INTERNATIONAL">خارجی</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>سال <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                value={formData.year || ''}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                placeholder="1403"
                min="1300"
                max="1410"
              />
            </div>
            <div className="space-y-2">
              <Label>نویسندگان <span className="text-red-500">*</span></Label>
              <Input
                value={formData.authors || ''}
                onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                placeholder="نویسنده 1، نویسنده 2، ..."
              />
            </div>
          </>
        );

      case 'BOOK':
        return (
          <>
            <div className="space-y-2">
              <Label>عنوان کتاب <span className="text-red-500">*</span></Label>
              <Input
                value={formData.title_fa || ''}
                onChange={(e) => setFormData({ ...formData, title_fa: e.target.value })}
                placeholder="عنوان کتاب"
              />
            </div>
            <div className="space-y-2">
              <Label>نوع <span className="text-red-500">*</span></Label>
              <Select
                value={formData.book_type || ''}
                onValueChange={(value) => setFormData({ ...formData, book_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUTHORSHIP">تألیف</SelectItem>
                  <SelectItem value="TRANSLATION">ترجمه</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ناشر <span className="text-red-500">*</span></Label>
              <Input
                value={formData.publisher || ''}
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                placeholder="نام ناشر"
              />
            </div>
            <div className="space-y-2">
              <Label>ISBN</Label>
              <Input
                value={formData.isbn || ''}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                placeholder="978-1234567890"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>سال انتشار <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                value={formData.publish_year || ''}
                onChange={(e) => setFormData({ ...formData, publish_year: parseInt(e.target.value) })}
                placeholder="1403"
                min="1300"
                max="1410"
              />
            </div>
            <div className="space-y-2">
              <Label>نویسندگان/مترجمان <span className="text-red-500">*</span></Label>
              <Input
                value={formData.authors_or_translators || ''}
                onChange={(e) => setFormData({ ...formData, authors_or_translators: e.target.value })}
                placeholder="نام نویسندگان یا مترجمان"
              />
            </div>
          </>
        );

      case 'FESTIVAL_AWARD':
        return (
          <>
            <div className="space-y-2">
              <Label>نام جشنواره <span className="text-red-500">*</span></Label>
              <Input
                value={formData.festival_name || ''}
                onChange={(e) => setFormData({ ...formData, festival_name: e.target.value })}
                placeholder="نام جشنواره علمی"
              />
            </div>
            <div className="space-y-2">
              <Label>عنوان جایزه <span className="text-red-500">*</span></Label>
              <Input
                value={formData.award_title || ''}
                onChange={(e) => setFormData({ ...formData, award_title: e.target.value })}
                placeholder="رتبه اول، مدال طلا، ..."
              />
            </div>
            <div className="space-y-2">
              <Label>سال <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                value={formData.year || ''}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                placeholder="1403"
                min="1300"
                max="1410"
              />
            </div>
            <div className="space-y-2">
              <Label>توضیحات</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="توضیحات جایزه"
                rows={3}
              />
            </div>
          </>
        );

      case 'MASTERS_THESIS':
        return (
          <>
            <div className="space-y-2">
              <Label>عنوان پایان‌نامه <span className="text-red-500">*</span></Label>
              <Input
                value={formData.title_fa || ''}
                onChange={(e) => setFormData({ ...formData, title_fa: e.target.value })}
                placeholder="عنوان پایان‌نامه ارشد"
              />
            </div>
            <div className="space-y-2">
              <Label>نمره پایان‌نامه <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                step="0.01"
                value={formData.grade || ''}
                onChange={(e) => setFormData({ ...formData, grade: parseFloat(e.target.value) })}
                placeholder="19.50"
                min="0"
                max="20"
              />
            </div>
            <div className="space-y-2">
              <Label>تاریخ دفاع <span className="text-red-500">*</span></Label>
              <Input
                value={formData.defense_date || ''}
                onChange={(e) => setFormData({ ...formData, defense_date: e.target.value })}
                placeholder="1402/06/15"
              />
            </div>
            <div className="space-y-2">
              <Label>استاد راهنمای اول <span className="text-red-500">*</span></Label>
              <Input
                value={formData.main_supervisor || ''}
                onChange={(e) => setFormData({ ...formData, main_supervisor: e.target.value })}
                placeholder="نام استاد راهنمای اول"
              />
            </div>
            <div className="space-y-2">
              <Label>استاد راهنمای دوم</Label>
              <Input
                value={formData.second_supervisor || ''}
                onChange={(e) => setFormData({ ...formData, second_supervisor: e.target.value })}
                placeholder="نام استاد راهنمای دوم (اختیاری)"
              />
            </div>
            <div className="space-y-2">
              <Label>استاد مشاور</Label>
              <Input
                value={formData.advisor_1 || ''}
                onChange={(e) => setFormData({ ...formData, advisor_1: e.target.value })}
                placeholder="نام استاد مشاور (اختیاری)"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const getRecordIcon = (type: string) => {
    const config = recordTypes.find(t => t.value === type);
    return config ? config.icon : FileText;
  };

  const getRecordColor = (type: string) => {
    const config = recordTypes.find(t => t.value === type);
    return config ? config.color : 'bg-gray-500';
  };

  const getRecordLabel = (type: string) => {
    const config = recordTypes.find(t => t.value === type);
    return config ? config.label : type;
  };

  const renderRecordSummary = (record: ResearchRecord) => {
    switch (record.type) {
      case 'ARTICLE':
      case 'PROMOTIONAL_ARTICLE':
        return (
          <div className="space-y-1">
            <p className="font-medium">{record.title_fa}</p>
            <p className="text-sm text-muted-foreground">
              {record.journal_name}
              {record.publish_date && ` - ${record.publish_date}`}
            </p>
            {record.status && (
              <Badge variant="outline" className="text-xs">{record.status}</Badge>
            )}
          </div>
        );
      case 'PATENT':
        return (
          <div className="space-y-1">
            <p className="font-medium">{record.title_fa}</p>
            <p className="text-sm text-muted-foreground">شماره ثبت: {record.patent_number}</p>
            {record.registration_date && (
              <p className="text-xs text-muted-foreground">{record.registration_date}</p>
            )}
          </div>
        );
      case 'CONFERENCE':
        return (
          <div className="space-y-1">
            <p className="font-medium">{record.title_fa}</p>
            <p className="text-sm text-muted-foreground">
              {record.conference_name}
              {record.year && ` - ${record.year}`}
            </p>
            {record.conference_type && (
              <Badge variant="outline">{record.conference_type === 'NATIONAL' ? 'داخلی' : 'خارجی'}</Badge>
            )}
          </div>
        );
      case 'BOOK':
        return (
          <div className="space-y-1">
            <p className="font-medium">{record.title_fa}</p>
            <p className="text-sm text-muted-foreground">
              {record.publisher}
              {record.publish_year && ` - ${record.publish_year}`}
            </p>
            {record.book_type && (
              <Badge variant="outline">{record.book_type === 'AUTHORSHIP' ? 'تألیف' : 'ترجمه'}</Badge>
            )}
          </div>
        );
      case 'FESTIVAL_AWARD':
        return (
          <div className="space-y-1">
            <p className="font-medium">{record.festival_name}</p>
            <p className="text-sm text-muted-foreground">
              {record.award_title}
              {record.year && ` - ${record.year}`}
            </p>
          </div>
        );
      case 'MASTERS_THESIS':
        return (
          <div className="space-y-1">
            <p className="font-medium">{record.title_fa}</p>
            <p className="text-sm text-muted-foreground">
              نمره: {record.grade}
              {record.defense_date && ` - ${record.defense_date}`}
            </p>
            {record.main_supervisor && (
              <p className="text-xs text-muted-foreground">استاد راهنما: {record.main_supervisor}</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  // Safely calculate total score
  const totalScore = Array.isArray(records) ? records.reduce((sum, r) => sum + (r.score || 0), 0) : 0;
  const minRequiredScore = 7;

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">سوابق پژوهشی</h1>
        <p className="text-muted-foreground mt-1">
          ثبت مقالات، اختراعات، جوایز و سایر سوابق علمی
        </p>
      </div>

      {/* Add Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>افزودن سابقه جدید</CardTitle>
          <CardDescription>نوع سابقه پژوهشی خود را انتخاب کنید</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {recordTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Button
                  key={type.value}
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => openCreateDialog(type.value)}
                >
                  <div className={`p-2 rounded-full ${type.color} text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm">{type.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Records List */}
      <Card>
        <CardHeader>
          <CardTitle>سوابق ثبت شده ({records.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                برای ادامه، حداقل <strong>7 امتیاز</strong> از سوابق پژوهشی لازم است.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {records.map((record) => {
                const Icon = getRecordIcon(record.type);
                const color = getRecordColor(record.type);
                
                return (
                  <Card key={record.id} className="border-l-4" style={{ borderLeftColor: color.replace('bg-', '') }}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${color} text-white flex-shrink-0`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <Badge variant="secondary" className="mb-2">
                                {getRecordLabel(record.type)}
                              </Badge>
                              {renderRecordSummary(record)}
                              {record.score !== undefined && (
                                <div className="mt-2">
                                  <Badge variant="default">امتیاز: {record.score}</Badge>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(record)}
                                title="ویرایش"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(record)}
                                className="text-red-500 hover:text-red-700"
                                title="حذف"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scoring Guide Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">راهنمای امتیازدهی سوابق پژوهشی</CardTitle>
          <CardDescription className="text-center">حداکثر امتیاز قابل دریافت: <strong>40 امتیاز</strong></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-border px-4 py-3 text-right font-semibold rounded-tl-lg">نوع سابقه پژوهشی</th>
                  <th className="border border-border px-4 py-3 text-center font-semibold w-32 rounded-tr-lg">حداکثر امتیاز</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="border border-border px-4 py-3">مقالات علمی-پژوهشی</td>
                  <td className="border border-border px-4 py-3 text-center align-middle font-semibold" rowSpan={3}>
                    40
                    <div className="text-xs font-normal text-destructive mt-1">
                      (حداقل 7 امتیاز الزامی)
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="border border-border px-4 py-3">گواهی ثبت اختراع</td>
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="border border-border px-4 py-3">کسب مقام برگزیده در جشنواره‌های علمی معتبر</td>
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="border border-border px-4 py-3">مقالات علمی-ترویجی</td>
                  <td className="border border-border px-4 py-3 text-center font-semibold">6</td>
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="border border-border px-4 py-3">مقالات در کنفرانس‌های معتبر داخلی یا خارجی</td>
                  <td className="border border-border px-4 py-3 text-center font-semibold">4</td>
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="border border-border px-4 py-3">تألیف یا ترجمه کتاب مرتبط با رشته تحصیلی</td>
                  <td className="border border-border px-4 py-3 text-center font-semibold">4</td>
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="border border-border px-4 py-3 rounded-bl-lg">کیفیت پایان‌نامه</td>
                  <td className="border border-border px-4 py-3 text-center font-semibold rounded-br-lg">4</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for Add/Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? 'ویرایش' : 'افزودن'} {getRecordLabel(selectedType)}
            </DialogTitle>
            <DialogDescription>
              اطلاعات را با دقت وارد کنید. فیلدهای ستاره‌دار الزامی هستند.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {renderFormFields()}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'در حال ذخیره...' : 'ذخیره'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                انصراف
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Navigation */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex gap-4">
          {records.length === 0 && (
            <p className="text-sm text-muted-foreground self-center">
              لطفاً حداقل یک سابقه پژوهشی ثبت کنید
            </p>
          )}
          <Button 
            onClick={() => navigate('/phd/olympiad-language')} 
            disabled={records.length === 0}
            size="lg"
          >
            ثبت و ارسال نهایی
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResearchRecordsPage;
