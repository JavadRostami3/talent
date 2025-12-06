import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import api from '@/services/api';
import type { Gender, MilitaryStatus } from '@/types/models';

const personalInfoSchema = z.object({
  father_name: z.string().min(2, 'نام پدر باید حداقل ۲ کاراکتر باشد'),
  birth_certificate_number: z.string().min(1, 'شماره شناسنامه الزامی است'),
  birth_certificate_serial: z.string().min(1, 'سریال شناسنامه الزامی است'),
  birth_certificate_location: z.string().min(2, 'محل صدور شناسنامه الزامی است'),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاریخ تولد باید به فرمت YYYY-MM-DD باشد'),
  gender: z.enum(['MALE', 'FEMALE'] as const, {
    required_error: 'انتخاب جنسیت الزامی است',
  }),
  military_status: z.enum([
    'EXEMPT',
    'EDUCATIONAL_EXEMPT',
    'SERVING',
    'COMPLETED',
    'MEDICAL_EXEMPT',
  ] as const).optional(),
});

type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;

interface PersonalInfoFormProps {
  userId: number;
  initialData?: Partial<PersonalInfoFormData>;
  onComplete: () => void;
  onBack: () => void;
}

const PersonalInfoForm = ({ userId, initialData, onComplete, onBack }: PersonalInfoFormProps) => {
  const form = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      father_name: initialData?.father_name || '',
      birth_certificate_number: initialData?.birth_certificate_number || '',
      birth_certificate_serial: initialData?.birth_certificate_serial || '',
      birth_certificate_location: initialData?.birth_certificate_location || '',
      birth_date: initialData?.birth_date || '',
      gender: initialData?.gender || undefined,
      military_status: initialData?.military_status || undefined,
    },
  });

  const selectedGender = form.watch('gender');

  const onSubmit = async (data: PersonalInfoFormData) => {
    try {
      // Update user profile
      await api.patch(`/api/accounts/users/${userId}/`, data);

      toast({
        title: 'ذخیره موفق',
        description: 'اطلاعات شخصی شما ثبت شد',
      });

      onComplete();
    } catch (error) {
      toast({
        title: 'خطا در ذخیره',
        description: error.response?.data?.error || 'خطایی رخ داده است',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>اطلاعات شخصی</CardTitle>
        <CardDescription>لطفاً اطلاعات تکمیلی خود را وارد کنید</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Father Name */}
          <div className="space-y-2">
            <Label htmlFor="father_name">نام پدر *</Label>
            <Input
              id="father_name"
              {...form.register('father_name')}
              placeholder="نام پدر"
            />
            {form.formState.errors.father_name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.father_name.message}
              </p>
            )}
          </div>

          {/* Birth Certificate Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birth_certificate_number">شماره شناسنامه *</Label>
              <Input
                id="birth_certificate_number"
                {...form.register('birth_certificate_number')}
                placeholder="1234567"
                dir="ltr"
              />
              {form.formState.errors.birth_certificate_number && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.birth_certificate_number.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_certificate_serial">سریال شناسنامه *</Label>
              <Input
                id="birth_certificate_serial"
                {...form.register('birth_certificate_serial')}
                placeholder="الف/۱۲"
                dir="ltr"
              />
              {form.formState.errors.birth_certificate_serial && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.birth_certificate_serial.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_certificate_location">محل صدور *</Label>
              <Input
                id="birth_certificate_location"
                {...form.register('birth_certificate_location')}
                placeholder="تهران"
              />
              {form.formState.errors.birth_certificate_location && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.birth_certificate_location.message}
                </p>
              )}
            </div>
          </div>

          {/* Birth Date */}
          <div className="space-y-2">
            <Label htmlFor="birth_date">تاریخ تولد (میلادی) *</Label>
            <Input
              id="birth_date"
              type="date"
              {...form.register('birth_date')}
              dir="ltr"
            />
            {form.formState.errors.birth_date && (
              <p className="text-sm text-destructive">
                {form.formState.errors.birth_date.message}
              </p>
            )}
          </div>

          {/* Gender */}
          <div className="space-y-3">
            <Label>جنسیت *</Label>
            <RadioGroup
              value={form.watch('gender')}
              onValueChange={(value) => form.setValue('gender', value as Gender)}
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="MALE" id="gender-male" />
                <Label htmlFor="gender-male" className="cursor-pointer">مرد</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="FEMALE" id="gender-female" />
                <Label htmlFor="gender-female" className="cursor-pointer">زن</Label>
              </div>
            </RadioGroup>
            {form.formState.errors.gender && (
              <p className="text-sm text-destructive">
                {form.formState.errors.gender.message}
              </p>
            )}
          </div>

          {/* Military Status (Only for males) */}
          {selectedGender === 'MALE' && (
            <div className="space-y-2">
              <Label htmlFor="military_status">وضعیت نظام وظیفه *</Label>
              <Select
                value={form.watch('military_status')}
                onValueChange={(value) =>
                  form.setValue('military_status', value as MilitaryStatus)
                }
              >
                <SelectTrigger id="military_status">
                  <SelectValue placeholder="وضعیت خود را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXEMPT">معاف</SelectItem>
                  <SelectItem value="EDUCATIONAL_EXEMPT">معافیت تحصیلی</SelectItem>
                  <SelectItem value="SERVING">در حال خدمت</SelectItem>
                  <SelectItem value="COMPLETED">پایان خدمت</SelectItem>
                  <SelectItem value="MEDICAL_EXEMPT">معافیت پزشکی</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.military_status && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.military_status.message}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-6">
            <Button type="button" variant="outline" onClick={onBack}>
              <ArrowRight className="ml-2 h-4 w-4" />
              مرحله قبل
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'در حال ذخیره...' : 'ذخیره و ادامه'}
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoForm;
