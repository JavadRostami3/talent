import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import api from '@/services/api';
import type { Gender, MilitaryStatus, ProfileUpdateRequest } from '@/types/models';

const personalInfoSchema = z.object({
  father_name: z.string().min(2, 'نام پدر الزامی است'),
  mobile: z.string().regex(/^09\d{9}$/, 'شماره موبایل نامعتبر است'),
  birth_year: z.number().min(1300).max(1390, 'سال تولد نامعتبر است'),
  birth_place: z.string().min(2, 'محل تولد الزامی است'),
  gender: z.enum(['MALE', 'FEMALE']),
  military_status: z.enum(['EXEMPT', 'EDUCATIONAL_EXEMPT', 'SERVING', 'COMPLETED', 'MEDICAL_EXEMPT']).optional(),
}).refine((data) => {
  // اگر جنسیت مرد باشد، وضعیت نظام وظیفه الزامی است
  if (data.gender === 'MALE') {
    return !!data.military_status;
  }
  return true;
}, {
  message: 'برای مردان، وضعیت نظام وظیفه الزامی است',
  path: ['military_status'],
});

type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;

interface PersonalInfoStepProps {
  applicationId: number;
  onComplete: () => void;
}

const PersonalInfoStep = ({ applicationId, onComplete }: PersonalInfoStepProps) => {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
  });

  const selectedGender = watch('gender');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setFetchingData(true);
    try {
      const response = await api.get('/api/accounts/profile/');
      const profile = response.data;

      // پر کردن خودکار فیلدها
      if (profile.father_name) setValue('father_name', profile.father_name);
      if (profile.mobile) setValue('mobile', profile.mobile);
      if (profile.birth_year) setValue('birth_year', profile.birth_year);
      if (profile.birth_place) setValue('birth_place', profile.birth_place);
      if (profile.gender) setValue('gender', profile.gender);
      if (profile.military_status) setValue('military_status', profile.military_status);
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری اطلاعات پروفایل',
        variant: 'destructive',
      });
    } finally {
      setFetchingData(false);
    }
  };

  const onSubmit = async (data: PersonalInfoFormData) => {
    setLoading(true);
    try {
      await api.patch('/api/accounts/profile/update/', data as ProfileUpdateRequest);

      toast({
        title: 'موفق',
        description: 'اطلاعات شخصی با موفقیت ذخیره شد',
      });

      onComplete();
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

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* نام پدر */}
        <div className="space-y-2">
          <Label htmlFor="father_name">
            نام پدر <span className="text-red-500">*</span>
          </Label>
          <Input
            id="father_name"
            {...register('father_name')}
            placeholder="نام پدر"
            disabled={loading}
          />
          {errors.father_name && (
            <p className="text-sm text-red-600">{errors.father_name.message}</p>
          )}
        </div>

        {/* موبایل */}
        <div className="space-y-2">
          <Label htmlFor="mobile">
            شماره موبایل <span className="text-red-500">*</span>
          </Label>
          <Input
            id="mobile"
            {...register('mobile')}
            placeholder="09123456789"
            dir="ltr"
            className="text-left"
            disabled={loading}
          />
          {errors.mobile && (
            <p className="text-sm text-red-600">{errors.mobile.message}</p>
          )}
        </div>

        {/* سال تولد */}
        <div className="space-y-2">
          <Label htmlFor="birth_year">
            سال تولد (شمسی) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="birth_year"
            type="number"
            {...register('birth_year', { valueAsNumber: true })}
            placeholder="1375"
            min="1300"
            max="1390"
            disabled={loading}
          />
          {errors.birth_year && (
            <p className="text-sm text-red-600">{errors.birth_year.message}</p>
          )}
        </div>

        {/* محل تولد */}
        <div className="space-y-2">
          <Label htmlFor="birth_place">
            محل تولد <span className="text-red-500">*</span>
          </Label>
          <Input
            id="birth_place"
            {...register('birth_place')}
            placeholder="تهران"
            disabled={loading}
          />
          {errors.birth_place && (
            <p className="text-sm text-red-600">{errors.birth_place.message}</p>
          )}
        </div>

        {/* جنسیت */}
        <div className="space-y-2">
          <Label htmlFor="gender">
            جنسیت <span className="text-red-500">*</span>
          </Label>
          <Select
            onValueChange={(value: Gender) => setValue('gender', value)}
            defaultValue={watch('gender')}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">مرد</SelectItem>
              <SelectItem value="FEMALE">زن</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && (
            <p className="text-sm text-red-600">{errors.gender.message}</p>
          )}
        </div>

        {/* وضعیت نظام وظیفه (فقط برای مردان) */}
        {selectedGender === 'MALE' && (
          <div className="space-y-2">
            <Label htmlFor="military_status">
              وضعیت نظام وظیفه <span className="text-red-500">*</span>
            </Label>
            <Select
              onValueChange={(value: MilitaryStatus) => setValue('military_status', value)}
              defaultValue={watch('military_status')}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="انتخاب کنید" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXEMPT">معاف</SelectItem>
                <SelectItem value="EDUCATIONAL_EXEMPT">معافیت تحصیلی</SelectItem>
                <SelectItem value="SERVING">در حال خدمت</SelectItem>
                <SelectItem value="COMPLETED">پایان خدمت</SelectItem>
                <SelectItem value="MEDICAL_EXEMPT">معافیت پزشکی</SelectItem>
              </SelectContent>
            </Select>
            {errors.military_status && (
              <p className="text-sm text-red-600">{errors.military_status.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={loading} size="lg">
          {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          ذخیره و ادامه
        </Button>
      </div>

      {/* Help Text */}
      <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
        <p className="text-sm text-amber-900 dark:text-amber-100">
          ⚠️ <strong>توجه:</strong> فیلدهای نام، نام خانوادگی، کد ملی و ایمیل قابل ویرایش نیستند. 
          در صورت نیاز به تغییر این موارد، با پشتیبانی تماس بگیرید.
        </p>
      </div>
    </form>
  );
};

export default PersonalInfoStep;
