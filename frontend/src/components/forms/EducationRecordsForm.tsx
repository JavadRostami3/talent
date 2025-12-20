import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react';
import UniversitySelector from '@/components/features/UniversitySelector';
import api from '@/services/api';
import type { EducationRecord, University, RoundType } from '@/types/models';

const educationRecordSchema = z.object({
  university_id: z.number({ required_error: 'انتخاب دانشگاه الزامی است' }),
  field_of_study: z.string().min(2, 'رشته تحصیلی باید حداقل ۲ کاراکتر باشد'),
  gpa: z.number().min(0, 'معدل نامعتبر است').max(20, 'معدل باید بین ۰ تا ۲۰ باشد'),
  entrance_year: z
    .number()
    .min(1350, 'سال ورود نامعتبر است')
    .max(1410, 'سال ورود نامعتبر است'),
  graduation_year: z
    .number()
    .min(1350, 'سال فارغ‌التحصیلی نامعتبر است')
    .max(1410, 'سال فارغ‌التحصیلی نامعتبر است')
    .optional()
    .nullable(),
  degree_level: z.enum(['DIPLOMA', 'ASSOCIATE', 'BACHELOR', 'MASTER', 'PHD'] as const),
});

type EducationRecordFormData = z.infer<typeof educationRecordSchema>;

interface EducationRecordsFormProps {
  applicationId: number;
  roundType: RoundType;
  onComplete: () => void;
  onBack: () => void;
}

const EducationRecordsForm = ({
  applicationId,
  roundType,
  onComplete,
  onBack,
}: EducationRecordsFormProps) => {
  const [records, setRecords] = useState<EducationRecord[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedUniversity, setSelectedUniversity] = useState<University | undefined>();

  const form = useForm<EducationRecordFormData>({
    resolver: zodResolver(educationRecordSchema),
  });

  useEffect(() => {
    fetchEducationRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEducationRecords = async () => {
    setLoading(true);
    try {
      const response = await api.get<EducationRecord[]>(
        `/api/applications/${applicationId}/education-records/`
      );
      setRecords(response.data);
    } catch (error: any) {
      toast({
        title: 'خطا در بارگذاری',
        description: 'سوابق تحصیلی بارگذاری نشد',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: EducationRecordFormData) => {
    try {
      await api.post(`/api/applications/${applicationId}/education-records/`, data);

      toast({
        title: 'ذخیره موفق',
        description: 'سابقه تحصیلی اضافه شد',
      });

      // Reset form
      form.reset();
      setSelectedUniversity(undefined);
      setIsAdding(false);

      // Refresh list
      fetchEducationRecords();
    } catch (error: any) {
      toast({
        title: 'خطا در ذخیره',
        description: error.response?.data?.error || 'خطایی رخ داده است',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (recordId: number) => {
    if (!confirm('آیا از حذف این سابقه تحصیلی اطمینان دارید؟')) return;

    try {
      await api.delete(
        `/api/applications/${applicationId}/education-records/${recordId}/`
      );

      toast({
        title: 'حذف موفق',
        description: 'سابقه تحصیلی حذف شد',
      });

      fetchEducationRecords();
    } catch (error: any) {
      toast({
        title: 'خطا در حذف',
        description: error.response?.data?.error || 'خطایی رخ داده است',
        variant: 'destructive',
      });
    }
  };

  const handleContinue = () => {
    // Validation based on round type
    const requiredDegrees = {
      MA_TALENT: ['BACHELOR'],
      PHD_TALENT: ['BACHELOR', 'MASTER'],
      PHD_EXAM: ['BACHELOR', 'MASTER'],
      OLYMPIAD: [],
    };

    const required = requiredDegrees[roundType] || [];
    const hasRequired = required.every((degree) =>
      records.some((r) => r.degree_level === degree)
    );

    if (required.length > 0 && !hasRequired) {
      toast({
        title: 'سوابق تحصیلی ناقص',
        description: `برای این دوره باید سوابق ${required.join(' و ')} را وارد کنید`,
        variant: 'destructive',
      });
      return;
    }

    onComplete();
  };

  const degreeLevelLabels = {
    DIPLOMA: 'دیپلم',
    ASSOCIATE: 'کاردانی',
    BACHELOR: 'کارشناسی',
    MASTER: 'کارشناسی ارشد',
    PHD: 'دکتری',
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
        <CardTitle>سوابق تحصیلی</CardTitle>
        <CardDescription>
          {roundType === 'MA_TALENT' &&
            'برای دوره کارشناسی ارشد استعداد درخشان، وارد کردن مدرک کارشناسی الزامی است'}
          {(roundType === 'PHD_TALENT' || roundType === 'PHD_EXAM') &&
            'برای دوره دکتری، وارد کردن مدارک کارشناسی و کارشناسی ارشد الزامی است'}
          {roundType === 'OLYMPIAD' && 'سوابق تحصیلی خود را وارد کنید'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Records */}
        <div className="space-y-3">
          {records.length === 0 ? (
            <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
              هیچ سابقه تحصیلی ثبت نشده است
            </div>
          ) : (
            records.map((record) => (
              <Card key={record.id} className="bg-accent/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">
                          {degreeLevelLabels[record.degree_level]}
                        </Badge>
                        <span className="font-medium">{record.field_of_study}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {record.university_name}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>معدل: {record.gpa}</span>
                        <span>
                          {record.entrance_year} -{' '}
                          {record.graduation_year || 'در حال تحصیل'}
                        </span>
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
            <h3 className="font-medium">افزودن سابقه تحصیلی جدید</h3>

            {/* University Selector */}
            <Controller
              name="university_id"
              control={form.control}
              render={({ field, fieldState }) => (
                <UniversitySelector
                  value={selectedUniversity}
                  onChange={(uni) => {
                    setSelectedUniversity(uni);
                    field.onChange(uni?.id);
                  }}
                  error={fieldState.error?.message}
                />
              )}
            />

            {/* Degree Level */}
            <div className="space-y-2">
              <Label htmlFor="degree_level">مقطع تحصیلی *</Label>
              <Controller
                name="degree_level"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="degree_level">
                      <SelectValue placeholder="مقطع را انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DIPLOMA">دیپلم</SelectItem>
                      <SelectItem value="ASSOCIATE">کاردانی</SelectItem>
                      <SelectItem value="BACHELOR">کارشناسی</SelectItem>
                      <SelectItem value="MASTER">کارشناسی ارشد</SelectItem>
                      <SelectItem value="PHD">دکتری</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.degree_level && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.degree_level.message}
                </p>
              )}
            </div>

            {/* Field of Study */}
            <div className="space-y-2">
              <Label htmlFor="field_of_study">رشته تحصیلی *</Label>
              <Input
                id="field_of_study"
                {...form.register('field_of_study')}
                placeholder="مهندسی کامپیوتر"
              />
              {form.formState.errors.field_of_study && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.field_of_study.message}
                </p>
              )}
            </div>

            {/* GPA */}
            <div className="space-y-2">
              <Label htmlFor="gpa">معدل (از ۰ تا ۲۰) *</Label>
              <Input
                id="gpa"
                type="number"
                step="0.01"
                {...form.register('gpa', { valueAsNumber: true })}
                placeholder="18.50"
                dir="ltr"
              />
              {form.formState.errors.gpa && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.gpa.message}
                </p>
              )}
            </div>

            {/* Years */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entrance_year">سال ورود (شمسی) *</Label>
                <Input
                  id="entrance_year"
                  type="number"
                  {...form.register('entrance_year', { valueAsNumber: true })}
                  placeholder="1400"
                  dir="ltr"
                />
                {form.formState.errors.entrance_year && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.entrance_year.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="graduation_year">سال فارغ‌التحصیلی (شمسی)</Label>
                <Input
                  id="graduation_year"
                  type="number"
                  {...form.register('graduation_year', { valueAsNumber: true })}
                  placeholder="1404 (اختیاری)"
                  dir="ltr"
                />
                {form.formState.errors.graduation_year && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.graduation_year.message}
                  </p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  form.reset();
                  setSelectedUniversity(undefined);
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
            افزودن سابقه تحصیلی
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

export default EducationRecordsForm;
