import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, Trash2, Plus } from 'lucide-react';
import applicationService from '@/services/applicationService';
import api from '@/services/api';
import type { 
  EducationRecord, 
  DegreeLevel, 
  EducationStatus,
  RankStatus,
  University 
} from '@/types/models';

const educationSchema = z.object({
  degree_level: z.enum(['BSC', 'MSC', 'PHD']),
  university_id: z.number().min(1, 'دانشگاه الزامی است'),
  field_of_study: z.string().min(2, 'رشته تحصیلی الزامی است'),
  gpa: z.number().min(0).max(20, 'معدل باید بین 0 تا 20 باشد'),
  status: z.enum(['STUDYING', 'GRADUATED']),
  total_units_passed: z.number().min(0).optional(),
  semester_count: z.number().min(0).optional(),
  class_size: z.number().min(0).optional(),
  rank_status: z.enum(['TOP_TEN_PERCENT', 'TOP_TWENTY_FIVE_PERCENT', 'OTHER']).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

type EducationFormData = z.infer<typeof educationSchema>;

interface EducationRecordsStepProps {
  applicationId: number;
  roundType: string;
  onComplete: () => void;
}

const EducationRecordsStep = ({ applicationId, roundType, onComplete }: EducationRecordsStepProps) => {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [universities, setUniversities] = useState<University[]>([]);
  const [existingRecords, setExistingRecords] = useState<EducationRecord[]>([]);
  const [editingDegree, setEditingDegree] = useState<DegreeLevel | null>(null);

  const isPhdRound = roundType === 'PHD_TALENT' || roundType === 'PHD_EXAM';
  const requiredDegrees: DegreeLevel[] = isPhdRound ? ['BSC', 'MSC'] : ['BSC'];

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<EducationFormData>({
    resolver: zodResolver(educationSchema),
  });

  const selectedStatus = watch('status');

  const formatDate = (year?: number, month?: number) => {
    if (!year) return undefined;
    if (!month) return `${year}`;
    return `${year}/${String(month).padStart(2, '0')}/01`;
  };

  const parseDate = (value?: string) => {
    if (!value) return {};
    const parts = value.split(/[\\/\\-]/).filter(Boolean);
    const year = parseInt(parts[0], 10);
    const month = parts[1] ? parseInt(parts[1], 10) : undefined;
    if (Number.isNaN(year)) return {};
    return { year, month };
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setFetchingData(true);
    try {
      // بارگذاری لیست دانشگاه‌ها
      const univResponse = await api.get('/api/core/universities/');
      setUniversities(univResponse.data.results || univResponse.data);

      // بارگذاری سوابق تحصیلی موجود
      const eduRecords = await applicationService.getEducationRecords(applicationId);
      setExistingRecords(eduRecords);
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری اطلاعات',
        variant: 'destructive',
      });
    } finally {
      setFetchingData(false);
    }
  };

  const startEditing = (degree: DegreeLevel) => {
    const existing = existingRecords.find(r => r.degree_level === degree);
    
    if (existing) {
      // پر کردن فرم با داده‌های موجود
      reset({
        degree_level: existing.degree_level,
        university_id: existing.university.id,
        field_of_study: existing.field_of_study,
        gpa: existing.gpa,
        status: existing.status,
        total_units_passed: existing.total_units_passed || undefined,
        semester_count: existing.semester_count || undefined,
        class_size: existing.class_size || undefined,
        rank_status: existing.rank_status || undefined,
        start_date: formatDate(existing.start_year, existing.start_month),
        end_date: formatDate(existing.graduation_year, existing.graduation_month),
      });
    } else {
      // فرم خالی برای سابقه جدید
      reset({
        degree_level: degree,
        university_id: 0,
        field_of_study: '',
        gpa: 0,
        status: 'GRADUATED',
      });
    }
    
    setEditingDegree(degree);
  };

  const cancelEditing = () => {
    setEditingDegree(null);
    reset();
  };

  const onSubmit = async (data: EducationFormData) => {
    setLoading(true);
    try {
      const existing = existingRecords.find(r => r.degree_level === data.degree_level);
      const startDate = parseDate(data.start_date);
      const endDate = parseDate(data.end_date);
      const payload = {
        ...data,
        start_year: startDate.year,
        start_month: startDate.month,
        graduation_year: endDate.year,
        graduation_month: endDate.month,
      };
      delete (payload as any).start_date;
      delete (payload as any).end_date;

      if (existing) {
        await applicationService.updateEducationRecord(applicationId, existing.id, payload);
      } else {
        await applicationService.createEducationRecord(applicationId, payload as any);
      }

      toast({
        title: 'موفق',
        description: 'سابقه تحصیلی ذخیره شد',
      });

      // بروزرسانی لیست
      await fetchData();
      setEditingDegree(null);
      reset();
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

  const handleDelete = async (recordId: number) => {
    if (!confirm('آیا از حذف این سابقه تحصیلی اطمینان دارید؟')) return;

    setLoading(true);
    try {
      await applicationService.deleteEducationRecord(applicationId, recordId);
      toast({
        title: 'موفق',
        description: 'سابقه تحصیلی حذف شد',
      });
      await fetchData();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: 'خطا در حذف سابقه تحصیلی',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    // بررسی کامل بودن سوابق الزامی
    const missingDegrees = requiredDegrees.filter(
      degree => !existingRecords.some(r => r.degree_level === degree)
    );

    if (missingDegrees.length > 0) {
      const degreeNames = missingDegrees.map(d => 
        d === 'BSC' ? 'کارشناسی' : 'کارشناسی ارشد'
      ).join(' و ');
      
      toast({
        title: 'ناقص',
        description: `لطفاً سابقه تحصیلی ${degreeNames} را تکمیل کنید`,
        variant: 'destructive',
      });
      return;
    }

    onComplete();
  };

  const getDegreeTitle = (degree: DegreeLevel): string => {
    switch (degree) {
      case 'BSC': return 'کارشناسی';
      case 'MSC': return 'کارشناسی ارشد';
      case 'PHD': return 'دکتری';
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
      {/* لیست سوابق موجود و دکمه‌های افزودن */}
      <div className="space-y-4">
        {requiredDegrees.map(degree => {
          const existing = existingRecords.find(r => r.degree_level === degree);
          const isEditing = editingDegree === degree;

          return (
            <Card key={degree} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{getDegreeTitle(degree)}</h3>
                {existing && !isEditing && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditing(degree)}
                    >
                      ویرایش
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(existing.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {!existing && !isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEditing(degree)}
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    افزودن
                  </Button>
                )}
              </div>

              {existing && !isEditing && (
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p><strong>دانشگاه:</strong> {existing.university.name}</p>
                  <p><strong>رشته:</strong> {existing.field_of_study}</p>
                  <p><strong>معدل:</strong> {existing.gpa}</p>
                  <p><strong>وضعیت:</strong> {existing.status === 'GRADUATED' ? 'فارغ‌التحصیل' : 'در حال تحصیل'}</p>
                </div>
              )}

              {isEditing && (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <input type="hidden" {...register('degree_level')} value={degree} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* دانشگاه */}
                    <div className="space-y-2">
                      <Label>دانشگاه <span className="text-red-500">*</span></Label>
                      <Select
                        onValueChange={(value) => setValue('university_id', parseInt(value))}
                        defaultValue={watch('university_id')?.toString()}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب دانشگاه" />
                        </SelectTrigger>
                        <SelectContent>
                          {universities.map(univ => (
                            <SelectItem key={univ.id} value={univ.id.toString()}>
                              {univ.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.university_id && (
                        <p className="text-sm text-red-600">{errors.university_id.message}</p>
                      )}
                    </div>

                    {/* رشته */}
                    <div className="space-y-2">
                      <Label>رشته تحصیلی <span className="text-red-500">*</span></Label>
                      <Input {...register('field_of_study')} placeholder="مهندسی کامپیوتر" disabled={loading} />
                      {errors.field_of_study && (
                        <p className="text-sm text-red-600">{errors.field_of_study.message}</p>
                      )}
                    </div>

                    {/* معدل */}
                    <div className="space-y-2">
                      <Label>معدل کل <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register('gpa', { valueAsNumber: true })}
                        placeholder="18.50"
                        disabled={loading}
                      />
                      {errors.gpa && (
                        <p className="text-sm text-red-600">{errors.gpa.message}</p>
                      )}
                    </div>

                    {/* وضعیت */}
                    <div className="space-y-2">
                      <Label>وضعیت تحصیلی <span className="text-red-500">*</span></Label>
                      <Select
                        onValueChange={(value: EducationStatus) => setValue('status', value)}
                        defaultValue={watch('status')}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STUDYING">در حال تحصیل</SelectItem>
                          <SelectItem value="GRADUATED">فارغ‌التحصیل</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* تعداد واحدهای گذرانده */}
                    <div className="space-y-2">
                      <Label>تعداد واحدهای گذرانده</Label>
                      <Input
                        type="number"
                        {...register('total_units_passed', { valueAsNumber: true })}
                        placeholder="140"
                        disabled={loading}
                      />
                    </div>

                    {/* تعداد ترم */}
                    <div className="space-y-2">
                      <Label>تعداد ترم</Label>
                      <Input
                        type="number"
                        {...register('semester_count', { valueAsNumber: true })}
                        placeholder="8"
                        disabled={loading}
                      />
                    </div>

                    {/* تعداد دانشجویان */}
                    <div className="space-y-2">
                      <Label>تعداد دانشجویان کلاس</Label>
                      <Input
                        type="number"
                        {...register('class_size', { valueAsNumber: true })}
                        placeholder="30"
                        disabled={loading}
                      />
                    </div>

                    {/* رتبه کلاسی */}
                    <div className="space-y-2">
                      <Label>رتبه کلاسی</Label>
                      <Select
                        onValueChange={(value: RankStatus) => setValue('rank_status', value)}
                        defaultValue={watch('rank_status')}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب کنید" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TOP_TEN_PERCENT">10٪ برتر</SelectItem>
                          <SelectItem value="TOP_TWENTY_FIVE_PERCENT">25٪ برتر</SelectItem>
                          <SelectItem value="OTHER">سایر</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* تاریخ شروع */}
                    <div className="space-y-2">
                      <Label>تاریخ شروع (شمسی)</Label>
                      <Input
                        {...register('start_date')}
                        placeholder="1399/09/01"
                        disabled={loading}
                      />
                    </div>

                    {/* تاریخ پایان */}
                    {selectedStatus === 'GRADUATED' && (
                      <div className="space-y-2">
                        <Label>تاریخ پایان (شمسی)</Label>
                        <Input
                          {...register('end_date')}
                          placeholder="1403/06/31"
                          disabled={loading}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 justify-end pt-2 border-t">
                    <Button type="button" variant="ghost" onClick={cancelEditing} disabled={loading}>
                      انصراف
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                      ذخیره
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          );
        })}
      </div>

      {/* دکمه تکمیل */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleComplete} size="lg" disabled={loading}>
          تایید و ادامه
        </Button>
      </div>
    </div>
  );
};

export default EducationRecordsStep;
