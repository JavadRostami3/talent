import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Loader2, Trash2, Plus, FileText, Award, Book, Users, ScrollText, Lightbulb } from 'lucide-react';
import applicationService from '@/services/applicationService';
import type { ResearchRecord, ResearchRecordType } from '@/types/models';

// Schema برای مقاله
const articleSchema = z.object({
  type: z.literal('ARTICLE'),
  title_fa: z.string().min(2, 'عنوان فارسی الزامی است'),
  title_en: z.string().min(2, 'عنوان انگلیسی الزامی است'),
  article_type: z.enum(['RESEARCH_NATIONAL', 'RESEARCH_INTERNATIONAL', 'PROMOTIONAL_NATIONAL', 'PROMOTIONAL_INTERNATIONAL']),
  journal_name: z.string().min(2, 'نام نشریه الزامی است'),
  doi: z.string().optional(),
  publish_year: z.number().min(1300).max(1410),
  status: z.enum(['PUBLISHED', 'ACCEPTED', 'SUBMITTED']),
  authors: z.string().min(2, 'نام نویسندگان الزامی است'),
});

// Schema برای اختراع
const patentSchema = z.object({
  type: z.literal('PATENT'),
  title_fa: z.string().min(2, 'عنوان الزامی است'),
  patent_number: z.string().min(2, 'شماره ثبت الزامی است'),
  registration_date: z.string().min(8, 'تاریخ ثبت الزامی است'),
  inventors: z.string().min(2, 'نام مخترعان الزامی است'),
  description: z.string().optional(),
});

// Schema برای کتاب
const bookSchema = z.object({
  type: z.literal('BOOK'),
  title_fa: z.string().min(2, 'عنوان الزامی است'),
  book_type: z.enum(['AUTHORSHIP', 'TRANSLATION']),
  publisher: z.string().min(2, 'نام ناشر الزامی است'),
  isbn: z.string().optional(),
  publish_year: z.number().min(1300).max(1410),
  authors_or_translators: z.string().min(2, 'نام نویسندگان/مترجمان الزامی است'),
});

// Schema برای کنفرانس
const conferenceSchema = z.object({
  type: z.literal('CONFERENCE'),
  title_fa: z.string().min(2, 'عنوان فارسی الزامی است'),
  title_en: z.string().min(2, 'عنوان انگلیسی الزامی است'),
  conference_name: z.string().min(2, 'نام کنفرانس الزامی است'),
  conference_type: z.enum(['NATIONAL', 'INTERNATIONAL']),
  year: z.number().min(1300).max(1410),
  authors: z.string().min(2, 'نام نویسندگان الزامی است'),
});

// Schema برای جایزه جشنواره
const festivalAwardSchema = z.object({
  type: z.literal('FESTIVAL_AWARD'),
  festival_name: z.string().min(2, 'نام جشنواره الزامی است'),
  award_title: z.string().min(2, 'عنوان جایزه الزامی است'),
  year: z.number().min(1300).max(1410),
  description: z.string().optional(),
});

// Schema برای پایان‌نامه ارشد
const mastersThesisSchema = z.object({
  type: z.literal('MASTERS_THESIS'),
  title_fa: z.string().min(2, 'عنوان الزامی است'),
  grade: z.number().min(0).max(20, 'نمره باید بین 0 تا 20 باشد'),
  defense_date: z.string().min(8, 'تاریخ دفاع الزامی است'),
  main_supervisor: z.string().min(2, 'نام استاد راهنما الزامی است'),
  second_supervisor: z.string().optional(),
  advisor_1: z.string().optional(),
});

const researchSchema = z.discriminatedUnion('type', [
  articleSchema,
  patentSchema,
  bookSchema,
  conferenceSchema,
  festivalAwardSchema,
  mastersThesisSchema,
]);

type ResearchFormData = z.infer<typeof researchSchema>;

interface ResearchRecordsStepProps {
  applicationId: number;
  onComplete: () => void;
}

const ResearchRecordsStep = ({ applicationId, onComplete }: ResearchRecordsStepProps) => {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [records, setRecords] = useState<ResearchRecord[]>([]);
  const [selectedType, setSelectedType] = useState<ResearchRecordType | null>(null);
  const [editingRecord, setEditingRecord] = useState<ResearchRecord | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ResearchFormData>({
    resolver: zodResolver(researchSchema),
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setFetchingData(true);
    try {
      const data = await applicationService.getResearchRecords(applicationId);
      setRecords(data);
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری سوابق پژوهشی',
        variant: 'destructive',
      });
    } finally {
      setFetchingData(false);
    }
  };

  const startNewRecord = (type: ResearchRecordType) => {
    setSelectedType(type);
    setEditingRecord(null);
    reset({ type } as any);
  };

  const startEditRecord = (record: ResearchRecord) => {
    setSelectedType(record.type);
    setEditingRecord(record);
    
    // پر کردن فرم با داده‌های موجود
    reset({
      type: record.type,
      ...record.data,
    } as any);
  };

  const cancelEditing = () => {
    setSelectedType(null);
    setEditingRecord(null);
    reset();
  };

  const onSubmit = async (data: ResearchFormData) => {
    setLoading(true);
    try {
      const { type, ...recordData } = data;
      
      if (editingRecord) {
        await applicationService.updateResearchRecord(
          applicationId,
          type,
          editingRecord.id,
          recordData as any
        );
      } else {
        await applicationService.createResearchRecord(applicationId, {
          type,
          data: recordData as any,
        });
      }

      toast({
        title: 'موفق',
        description: 'سابقه پژوهشی ذخیره شد',
      });

      await fetchRecords();
      cancelEditing();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در ذخیره سابقه',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (record: ResearchRecord) => {
    if (!confirm('آیا از حذف این سابقه اطمینان دارید؟')) return;

    setLoading(true);
    try {
      await applicationService.deleteResearchRecord(applicationId, record.type, record.id);
      toast({
        title: 'موفق',
        description: 'سابقه پژوهشی حذف شد',
      });
      await fetchRecords();
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

  const getTypeIcon = (type: ResearchRecordType) => {
    switch (type) {
      case 'ARTICLE': return <FileText className="h-5 w-5" />;
      case 'PATENT': return <Lightbulb className="h-5 w-5" />;
      case 'BOOK': return <Book className="h-5 w-5" />;
      case 'CONFERENCE': return <Users className="h-5 w-5" />;
      case 'FESTIVAL_AWARD': return <Award className="h-5 w-5" />;
      case 'MASTERS_THESIS': return <ScrollText className="h-5 w-5" />;
    }
  };

  const getTypeTitle = (type: ResearchRecordType): string => {
    switch (type) {
      case 'ARTICLE': return 'مقاله';
      case 'PATENT': return 'اختراع';
      case 'BOOK': return 'کتاب';
      case 'CONFERENCE': return 'کنفرانس';
      case 'FESTIVAL_AWARD': return 'جایزه جشنواره';
      case 'MASTERS_THESIS': return 'پایان‌نامه ارشد';
    }
  };

  const renderRecordSummary = (record: ResearchRecord) => {
    const data = record.data;
    
    switch (record.type) {
      case 'ARTICLE':
        return (
          <>
            <p><strong>عنوان:</strong> {data.title_fa}</p>
            <p><strong>نشریه:</strong> {data.journal_name}</p>
            <p><strong>نوع:</strong> {data.article_type}</p>
          </>
        );
      case 'PATENT':
        return (
          <>
            <p><strong>عنوان:</strong> {data.title_fa}</p>
            <p><strong>شماره ثبت:</strong> {data.patent_number}</p>
          </>
        );
      case 'BOOK':
        return (
          <>
            <p><strong>عنوان:</strong> {data.title_fa}</p>
            <p><strong>ناشر:</strong> {data.publisher}</p>
          </>
        );
      case 'CONFERENCE':
        return (
          <>
            <p><strong>عنوان:</strong> {data.title_fa}</p>
            <p><strong>کنفرانس:</strong> {data.conference_name}</p>
          </>
        );
      case 'FESTIVAL_AWARD':
        return (
          <>
            <p><strong>جشنواره:</strong> {data.festival_name}</p>
            <p><strong>جایزه:</strong> {data.award_title}</p>
          </>
        );
      case 'MASTERS_THESIS':
        return (
          <>
            <p><strong>عنوان:</strong> {data.title_fa}</p>
            <p><strong>نمره:</strong> {data.grade}</p>
          </>
        );
    }
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
      {/* دکمه‌های افزودن انواع سوابق */}
      {!selectedType && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={() => startNewRecord('ARTICLE')}
          >
            <FileText className="h-6 w-6" />
            <span>مقاله</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={() => startNewRecord('PATENT')}
          >
            <Lightbulb className="h-6 w-6" />
            <span>اختراع</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={() => startNewRecord('BOOK')}
          >
            <Book className="h-6 w-6" />
            <span>کتاب</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={() => startNewRecord('CONFERENCE')}
          >
            <Users className="h-6 w-6" />
            <span>کنفرانس</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={() => startNewRecord('FESTIVAL_AWARD')}
          >
            <Award className="h-6 w-6" />
            <span>جایزه</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={() => startNewRecord('MASTERS_THESIS')}
          >
            <ScrollText className="h-6 w-6" />
            <span>پایان‌نامه</span>
          </Button>
        </div>
      )}

      {/* فرم افزودن/ویرایش */}
      {selectedType && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            {getTypeIcon(selectedType)}
            <h3 className="text-lg font-semibold">
              {editingRecord ? 'ویرایش' : 'افزودن'} {getTypeTitle(selectedType)}
            </h3>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register('type')} />

            {/* فرم مقاله */}
            {selectedType === 'ARTICLE' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>عنوان فارسی <span className="text-red-500">*</span></Label>
                    <Input {...register('title_fa')} disabled={loading} />
                    {errors.title_fa && <p className="text-sm text-red-600">{errors.title_fa.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>عنوان انگلیسی <span className="text-red-500">*</span></Label>
                    <Input {...register('title_en')} dir="ltr" disabled={loading} />
                    {errors.title_en && <p className="text-sm text-red-600">{errors.title_en.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>نوع مقاله <span className="text-red-500">*</span></Label>
                    <Select
                      onValueChange={(value) => setValue('article_type', value as any)}
                      defaultValue={watch('article_type')}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب کنید" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RESEARCH_NATIONAL">علمی-پژوهشی (ملی)</SelectItem>
                        <SelectItem value="RESEARCH_INTERNATIONAL">علمی-پژوهشی (بین‌المللی)</SelectItem>
                        <SelectItem value="PROMOTIONAL_NATIONAL">علمی-ترویجی (ملی)</SelectItem>
                        <SelectItem value="PROMOTIONAL_INTERNATIONAL">علمی-ترویجی (بین‌المللی)</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.article_type && <p className="text-sm text-red-600">{errors.article_type.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>نام نشریه <span className="text-red-500">*</span></Label>
                    <Input {...register('journal_name')} disabled={loading} />
                    {errors.journal_name && <p className="text-sm text-red-600">{errors.journal_name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>DOI</Label>
                    <Input {...register('doi')} placeholder="10.1234/..." dir="ltr" disabled={loading} />
                  </div>

                  <div className="space-y-2">
                    <Label>سال انتشار <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      {...register('publish_year', { valueAsNumber: true })}
                      placeholder="1402"
                      disabled={loading}
                    />
                    {errors.publish_year && <p className="text-sm text-red-600">{errors.publish_year.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>وضعیت <span className="text-red-500">*</span></Label>
                    <Select
                      onValueChange={(value) => setValue('status', value as any)}
                      defaultValue={watch('status')}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب کنید" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PUBLISHED">منتشر شده</SelectItem>
                        <SelectItem value="ACCEPTED">پذیرفته شده</SelectItem>
                        <SelectItem value="SUBMITTED">ارسال شده</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>نام نویسندگان <span className="text-red-500">*</span></Label>
                    <Input {...register('authors')} placeholder="نویسنده 1، نویسنده 2، ..." disabled={loading} />
                    {errors.authors && <p className="text-sm text-red-600">{errors.authors.message}</p>}
                  </div>
                </div>
              </>
            )}

            {/* فرم اختراع */}
            {selectedType === 'PATENT' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>عنوان اختراع <span className="text-red-500">*</span></Label>
                    <Input {...register('title_fa')} disabled={loading} />
                    {errors.title_fa && <p className="text-sm text-red-600">{errors.title_fa.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>شماره ثبت <span className="text-red-500">*</span></Label>
                    <Input {...register('patent_number')} disabled={loading} />
                    {errors.patent_number && <p className="text-sm text-red-600">{errors.patent_number.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>تاریخ ثبت <span className="text-red-500">*</span></Label>
                    <Input {...register('registration_date')} placeholder="1402/09/15" disabled={loading} />
                    {errors.registration_date && <p className="text-sm text-red-600">{errors.registration_date.message}</p>}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>نام مخترعان <span className="text-red-500">*</span></Label>
                    <Input {...register('inventors')} placeholder="مخترع 1، مخترع 2، ..." disabled={loading} />
                    {errors.inventors && <p className="text-sm text-red-600">{errors.inventors.message}</p>}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>توضیحات</Label>
                    <Textarea {...register('description')} rows={3} disabled={loading} />
                  </div>
                </div>
              </>
            )}

            {/* فرم کتاب */}
            {selectedType === 'BOOK' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>عنوان کتاب <span className="text-red-500">*</span></Label>
                    <Input {...register('title_fa')} disabled={loading} />
                    {errors.title_fa && <p className="text-sm text-red-600">{errors.title_fa.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>نوع <span className="text-red-500">*</span></Label>
                    <Select
                      onValueChange={(value) => setValue('book_type', value as any)}
                      defaultValue={watch('book_type')}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب کنید" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AUTHORSHIP">تألیف</SelectItem>
                        <SelectItem value="TRANSLATION">ترجمه</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.book_type && <p className="text-sm text-red-600">{errors.book_type.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>ناشر <span className="text-red-500">*</span></Label>
                    <Input {...register('publisher')} disabled={loading} />
                    {errors.publisher && <p className="text-sm text-red-600">{errors.publisher.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>ISBN</Label>
                    <Input {...register('isbn')} dir="ltr" disabled={loading} />
                  </div>

                  <div className="space-y-2">
                    <Label>سال انتشار <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      {...register('publish_year', { valueAsNumber: true })}
                      placeholder="1402"
                      disabled={loading}
                    />
                    {errors.publish_year && <p className="text-sm text-red-600">{errors.publish_year.message}</p>}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>نویسندگان/مترجمان <span className="text-red-500">*</span></Label>
                    <Input {...register('authors_or_translators')} disabled={loading} />
                    {errors.authors_or_translators && <p className="text-sm text-red-600">{errors.authors_or_translators.message}</p>}
                  </div>
                </div>
              </>
            )}

            {/* فرم کنفرانس */}
            {selectedType === 'CONFERENCE' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>عنوان فارسی <span className="text-red-500">*</span></Label>
                    <Input {...register('title_fa')} disabled={loading} />
                    {errors.title_fa && <p className="text-sm text-red-600">{errors.title_fa.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>عنوان انگلیسی <span className="text-red-500">*</span></Label>
                    <Input {...register('title_en')} dir="ltr" disabled={loading} />
                    {errors.title_en && <p className="text-sm text-red-600">{errors.title_en.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>نام کنفرانس <span className="text-red-500">*</span></Label>
                    <Input {...register('conference_name')} disabled={loading} />
                    {errors.conference_name && <p className="text-sm text-red-600">{errors.conference_name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>نوع کنفرانس <span className="text-red-500">*</span></Label>
                    <Select
                      onValueChange={(value) => setValue('conference_type', value as any)}
                      defaultValue={watch('conference_type')}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب کنید" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NATIONAL">داخلی</SelectItem>
                        <SelectItem value="INTERNATIONAL">خارجی</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.conference_type && <p className="text-sm text-red-600">{errors.conference_type.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>سال <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      {...register('year', { valueAsNumber: true })}
                      placeholder="1402"
                      disabled={loading}
                    />
                    {errors.year && <p className="text-sm text-red-600">{errors.year.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>نام نویسندگان <span className="text-red-500">*</span></Label>
                    <Input {...register('authors')} disabled={loading} />
                    {errors.authors && <p className="text-sm text-red-600">{errors.authors.message}</p>}
                  </div>
                </div>
              </>
            )}

            {/* فرم جایزه */}
            {selectedType === 'FESTIVAL_AWARD' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نام جشنواره <span className="text-red-500">*</span></Label>
                    <Input {...register('festival_name')} disabled={loading} />
                    {errors.festival_name && <p className="text-sm text-red-600">{errors.festival_name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>عنوان جایزه <span className="text-red-500">*</span></Label>
                    <Input {...register('award_title')} placeholder="رتبه اول، مدال طلا، ..." disabled={loading} />
                    {errors.award_title && <p className="text-sm text-red-600">{errors.award_title.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>سال <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      {...register('year', { valueAsNumber: true })}
                      placeholder="1402"
                      disabled={loading}
                    />
                    {errors.year && <p className="text-sm text-red-600">{errors.year.message}</p>}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>توضیحات</Label>
                    <Textarea {...register('description')} rows={3} disabled={loading} />
                  </div>
                </div>
              </>
            )}

            {/* فرم پایان‌نامه */}
            {selectedType === 'MASTERS_THESIS' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>عنوان پایان‌نامه <span className="text-red-500">*</span></Label>
                    <Input {...register('title_fa')} disabled={loading} />
                    {errors.title_fa && <p className="text-sm text-red-600">{errors.title_fa.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>نمره <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register('grade', { valueAsNumber: true })}
                      placeholder="19.50"
                      disabled={loading}
                    />
                    {errors.grade && <p className="text-sm text-red-600">{errors.grade.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>تاریخ دفاع <span className="text-red-500">*</span></Label>
                    <Input {...register('defense_date')} placeholder="1402/06/15" disabled={loading} />
                    {errors.defense_date && <p className="text-sm text-red-600">{errors.defense_date.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>استاد راهنمای اول <span className="text-red-500">*</span></Label>
                    <Input {...register('main_supervisor')} disabled={loading} />
                    {errors.main_supervisor && <p className="text-sm text-red-600">{errors.main_supervisor.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>استاد راهنمای دوم</Label>
                    <Input {...register('second_supervisor')} disabled={loading} />
                  </div>

                  <div className="space-y-2">
                    <Label>استاد مشاور اول</Label>
                    <Input {...register('advisor_1')} disabled={loading} />
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button type="button" variant="ghost" onClick={cancelEditing} disabled={loading}>
                انصراف
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                ذخیره
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* لیست سوابق موجود */}
      {records.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">سوابق ثبت شده</h3>
          {records.map(record => (
            <Card key={record.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex gap-3 flex-1">
                  <div className="text-primary mt-1">
                    {getTypeIcon(record.type)}
                  </div>
                  <div className="text-sm space-y-1 flex-1">
                    <p className="font-semibold">{getTypeTitle(record.type)}</p>
                    {renderRecordSummary(record)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEditRecord(record)}
                    disabled={loading || !!selectedType}
                  >
                    ویرایش
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(record)}
                    disabled={loading || !!selectedType}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* دکمه تکمیل */}
      {!selectedType && (
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {records.length === 0 ? 'هیچ سابقه‌ای ثبت نشده است.' : `${records.length} سابقه ثبت شده`}
          </p>
          <Button onClick={onComplete} size="lg">
            تایید و ادامه
          </Button>
        </div>
      )}
    </div>
  );
};

export default ResearchRecordsStep;
