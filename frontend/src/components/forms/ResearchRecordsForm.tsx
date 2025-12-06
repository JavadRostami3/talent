import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Plus, Trash2, ExternalLink } from 'lucide-react';
import api from '@/services/api';
import type { ResearchRecord, ResearchRecordType, RoundType } from '@/types/models';

const researchRecordSchema = z.object({
  type: z.enum([
    'ARTICLE',
    'CONFERENCE',
    'BOOK',
    'PATENT',
    'PROJECT',
    'AWARD',
  ] as const, {
    required_error: 'نوع فعالیت پژوهشی را انتخاب کنید',
  }),
  title: z.string().min(3, 'عنوان باید حداقل ۳ کاراکتر باشد'),
  description: z.string().min(10, 'توضیحات باید حداقل ۱۰ کاراکتر باشد'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاریخ باید به فرمت YYYY-MM-DD باشد'),
  reference_link: z.string().url('لینک معتبر وارد کنید').optional().or(z.literal('')),
  impact_factor: z.number().min(0).optional().nullable(),
  citation_count: z.number().min(0).optional().nullable(),
});

type ResearchRecordFormData = z.infer<typeof researchRecordSchema>;

interface ResearchRecordsFormProps {
  applicationId: number;
  roundType: RoundType;
  onComplete: () => void;
  onBack: () => void;
}

const ResearchRecordsForm = ({
  applicationId,
  roundType,
  onComplete,
  onBack,
}: ResearchRecordsFormProps) => {
  const [records, setRecords] = useState<ResearchRecord[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  const form = useForm<ResearchRecordFormData>({
    resolver: zodResolver(researchRecordSchema),
  });

  const selectedType = form.watch('type');

  useEffect(() => {
    fetchResearchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchResearchRecords = async () => {
    setLoading(true);
    try {
      const response = await api.get<ResearchRecord[]>(
        `/api/applicant/applications/${applicationId}/research-records/`
      );
      setRecords(response.data);
    } catch (error: any) {
      toast({
        title: 'خطا در بارگذاری',
        description: 'سوابق پژوهشی بارگذاری نشد',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ResearchRecordFormData) => {
    try {
      // Clean empty optional fields
      const cleanData = {
        ...data,
        reference_link: data.reference_link || null,
        impact_factor: data.impact_factor || null,
        citation_count: data.citation_count || null,
      };

      await api.post(`/api/applicant/applications/${applicationId}/research-records/`, cleanData);

      toast({
        title: 'ذخیره موفق',
        description: 'سابقه پژوهشی اضافه شد',
      });

      // Reset form
      form.reset();
      setIsAdding(false);

      // Refresh list
      fetchResearchRecords();
    } catch (error: any) {
      toast({
        title: 'خطا در ذخیره',
        description: error.response?.data?.error || 'خطایی رخ داده است',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (recordId: number) => {
    if (!confirm('آیا از حذف این سابقه پژوهشی اطمینان دارید؟')) return;

    try {
      await api.delete(
        `/api/applicant/applications/${applicationId}/research-records/${recordId}/`
      );

      toast({
        title: 'حذف موفق',
        description: 'سابقه پژوهشی حذف شد',
      });

      fetchResearchRecords();
    } catch (error: any) {
      toast({
        title: 'خطا در حذف',
        description: error.response?.data?.error || 'خطایی رخ داده است',
        variant: 'destructive',
      });
    }
  };

  const handleContinue = () => {
    // For PhD rounds, research records are mandatory
    if ((roundType === 'PHD_TALENT' || roundType === 'PHD_EXAM') && records.length === 0) {
      toast({
        title: 'سوابق پژوهشی الزامی است',
        description: 'برای دوره دکتری باید حداقل یک سابقه پژوهشی ثبت کنید',
        variant: 'destructive',
      });
      return;
    }

    onComplete();
  };

  const researchTypeLabels: Record<ResearchRecordType, string> = {
    ARTICLE: 'مقاله',
    CONFERENCE: 'کنفرانس',
    BOOK: 'کتاب',
    PATENT: 'ثبت اختراع',
    PROJECT: 'پروژه',
    AWARD: 'جایزه',
    FESTIVAL_AWARD: 'جایزه جشنواره',
    MASTERS_THESIS: 'پایان‌نامه ارشد',
  };

  const researchTypeVariants: Record<ResearchRecordType, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    ARTICLE: 'default',
    CONFERENCE: 'secondary',
    BOOK: 'outline',
    PATENT: 'default',
    PROJECT: 'secondary',
    AWARD: 'destructive',
    FESTIVAL_AWARD: 'destructive',
    MASTERS_THESIS: 'outline',
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
        <CardTitle>سوابق پژوهشی</CardTitle>
        <CardDescription>
          {(roundType === 'PHD_TALENT' || roundType === 'PHD_EXAM')
            ? 'برای دوره دکتری، ثبت حداقل یک سابقه پژوهشی الزامی است'
            : 'سوابق پژوهشی خود را وارد کنید (اختیاری)'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Records */}
        <div className="space-y-3">
          {records.length === 0 ? (
            <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
              هیچ سابقه پژوهشی ثبت نشده است
            </div>
          ) : (
            records.map((record) => (
              <Card key={record.id} className="bg-accent/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={researchTypeVariants[record.type]}>
                          {researchTypeLabels[record.type]}
                        </Badge>
                        <span className="font-medium">{record.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {record.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span>تاریخ: {record.date}</span>
                        {record.impact_factor && (
                          <span>IF: {record.impact_factor}</span>
                        )}
                        {record.citation_count && (
                          <span>استنادات: {record.citation_count}</span>
                        )}
                        {record.reference_link && (
                          <a
                            href={record.reference_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            لینک <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(record.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Add New Record Form */}
        {isAdding ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 border rounded-lg p-4">
            <h3 className="font-medium">افزودن سابقه پژوهشی جدید</h3>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">نوع فعالیت پژوهشی *</Label>
              <Controller
                name="type"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="نوع را انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARTICLE">مقاله</SelectItem>
                      <SelectItem value="CONFERENCE">کنفرانس</SelectItem>
                      <SelectItem value="BOOK">کتاب</SelectItem>
                      <SelectItem value="PATENT">ثبت اختراع</SelectItem>
                      <SelectItem value="PROJECT">پروژه</SelectItem>
                      <SelectItem value="AWARD">جایزه</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.type && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.type.message}
                </p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">عنوان *</Label>
              <Input
                id="title"
                {...form.register('title')}
                placeholder="عنوان مقاله، پروژه، یا جایزه"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">توضیحات *</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="توضیحات کامل درباره این فعالیت پژوهشی"
                rows={4}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">تاریخ (میلادی) *</Label>
              <Input
                id="date"
                type="date"
                {...form.register('date')}
                dir="ltr"
              />
              {form.formState.errors.date && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.date.message}
                </p>
              )}
            </div>

            {/* Reference Link */}
            <div className="space-y-2">
              <Label htmlFor="reference_link">لینک مرجع (اختیاری)</Label>
              <Input
                id="reference_link"
                type="url"
                {...form.register('reference_link')}
                placeholder="https://..."
                dir="ltr"
              />
              {form.formState.errors.reference_link && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.reference_link.message}
                </p>
              )}
            </div>

            {/* Impact Factor & Citations (for articles) */}
            {selectedType === 'ARTICLE' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="impact_factor">ضریب تأثیر (IF)</Label>
                  <Input
                    id="impact_factor"
                    type="number"
                    step="0.001"
                    {...form.register('impact_factor', { valueAsNumber: true })}
                    placeholder="2.5"
                    dir="ltr"
                  />
                  {form.formState.errors.impact_factor && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.impact_factor.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="citation_count">تعداد استنادات</Label>
                  <Input
                    id="citation_count"
                    type="number"
                    {...form.register('citation_count', { valueAsNumber: true })}
                    placeholder="10"
                    dir="ltr"
                  />
                  {form.formState.errors.citation_count && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.citation_count.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  form.reset();
                }}
              >
                انصراف
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'در حال ذخیره...' : 'افزودن'}
              </Button>
            </div>
          </form>
        ) : (
          <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full">
            <Plus className="ml-2 h-4 w-4" />
            افزودن سابقه پژوهشی
          </Button>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowRight className="ml-2 h-4 w-4" />
            مرحله قبل
          </Button>
          <Button onClick={handleContinue}>
            ذخیره و ادامه
            <ArrowLeft className="mr-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResearchRecordsForm;
