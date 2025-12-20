import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import AuthLayout from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Check, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import api from '@/services/api';
import type { RegisterRequest, RegisterResponse, RoundType } from '@/types/models';

const registerSchema = z.object({
  national_id: z
    .string()
    .length(10, 'کد ملی باید ۱۰ رقم باشد'),
  first_name: z
    .string()
    .min(2, 'نام باید حداقل ۲ کاراکتر باشد')
    .regex(/^[\u0600-\u06FF\s]+$/, 'نام باید به فارسی باشد'),
  last_name: z
    .string()
    .min(2, 'نام خانوادگی باید حداقل ۲ کاراکتر باشد')
    .regex(/^[\u0600-\u06FF\s]+$/, 'نام خانوادگی باید به فارسی باشد'),
  mobile: z
    .string()
    .regex(/^09\d{9}$/, 'شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد'),
  email: z
    .string()
    .email('ایمیل نامعتبر است'),
  round_type: z.enum(['MA_TALENT', 'PHD_TALENT', 'PHD_EXAM', 'OLYMPIAD'] as const, {
    required_error: 'انتخاب نوع فراخوان الزامی است',
  }),
});

type RegisterFormData = z.infer<typeof registerSchema>;

const roundTypeLabels: Record<RoundType, string> = {
  MA_TALENT: 'استعداد درخشان کارشناسی ارشد',
  PHD_TALENT: 'استعداد درخشان دکتری',
  PHD_EXAM: 'آزمون دکتری',
  OLYMPIAD: 'المپیاد',
};

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get data from location state (from Index page)
  const preFilledData = location.state as {
    roundType?: RoundType;
    firstName?: string;
    lastName?: string;
    nationalId?: string;
  } | undefined;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      round_type: preFilledData?.roundType,
      first_name: preFilledData?.firstName || '',
      last_name: preFilledData?.lastName || '',
      national_id: preFilledData?.nationalId || '',
    },
  });

  // Set values if pre-filled from landing page
  useEffect(() => {
    if (preFilledData?.roundType) {
      setValue('round_type', preFilledData.roundType);
    }
  }, [preFilledData, setValue]);

  const selectedRoundType = watch('round_type');
  const selectedRoundLabel = selectedRoundType ? roundTypeLabels[selectedRoundType as RoundType] : undefined;

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      const response = await api.post<RegisterResponse>('/api/auth/register/', data as RegisterRequest, {
        timeout: 30000 // Timeout after 30 seconds
      });
      
      setTrackingCode(response.data.tracking_code);
      
      toast({
        title: 'ثبت‌نام موفق',
        description: 'لطفاً کد پیگیری خود را یادداشت کنید',
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle different error types
      const err = error as { response?: { status?: number; data?: Record<string, unknown> }; code?: string };
      if (!err.response || (err.response.status && err.response.status >= 500) || err.code === 'ECONNABORTED') {
        // Server error or timeout
        toast({
          title: 'خطا در اتصال به سرور',
          description: 'لطفا اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید',
          variant: 'destructive',
        });
      } else if (err.response?.status === 400) {
        // Validation error - show detailed field errors
        const errorData = err.response?.data;
        let errorMessage = '';
        
        if (typeof errorData === 'object') {
          // Extract field-specific errors
          Object.keys(errorData).forEach(key => {
            const fieldError = errorData[key];
            const message = Array.isArray(fieldError) ? fieldError[0] : fieldError;
            errorMessage += `${message}\n`;
          });
        } else {
          errorMessage = errorData?.error || errorData?.detail || 'اطلاعات وارد شده نامعتبر است';
        }
        
        toast({
          title: 'خطا در اعتبارسنجی',
          description: errorMessage.trim() || 'لطفا اطلاعات وارد شده را بررسی کنید',
          variant: 'destructive',
        });
      } else {
        // Other client errors
        const errData = err.response?.data as { error?: string; detail?: string } | undefined;
        toast({
          title: 'خطا در ثبت‌نام',
          description: errData?.error || errData?.detail || 'خطایی رخ داده است',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTrackingCode = () => {
    if (!trackingCode) return;

    try {
      navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      toast({
        title: 'کپی شد',
        description: 'کد پیگیری در کلیپ‌بورد کپی شد',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'خطا',
        description: 'کپی خودکار انجام نشد. دستی کپی کنید.',
        variant: 'destructive',
      });
    }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  // If registration successful, show tracking code
  if (trackingCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 sm:p-10">
        <div className="w-full max-w-lg space-y-8 bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10">
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              ثبت‌نام موفقیت‌آمیز بود!
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              کد پیگیری شما با موفقیت ایجاد شد
            </p>
          </div>

          <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
            <AlertDescription>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 text-center">
                این کد را در جای امن نگهداری کنید. برای ورود به سامانه به این کد نیاز دارید.
              </p>
              <div className="bg-white dark:bg-slate-900 border-2 border-green-300 dark:border-green-700 rounded-lg p-6 mb-4">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 text-center">کد پیگیری شما:</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 tracking-widest font-mono text-center select-all">
                  {trackingCode}
                </p>
              </div>
              <Button
                type="button"
                onClick={handleCopyTrackingCode}
                variant={copied ? 'default' : 'outline'}
                className="w-full mb-3"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    کپی شد
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    کپی کد پیگیری
                  </>
                )}
              </Button>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button onClick={handleGoToLogin} className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-base" size="lg">
              ورود به سامانه
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-xs text-center text-slate-500">
              با کلیک روی دکمه بالا، به صفحه ورود هدایت می‌شوید
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <AuthLayout
      title="تکمیل اطلاعات ثبت‌نام"
      subtitle={selectedRoundLabel || 'اطلاعات اولیه خود را وارد کنید'}
      helper="پس از ثبت‌نام، کد پیگیری برای ورود به سامانه به شما نمایش داده می‌شود."
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-medium mb-1">راهنمای سریع</p>
          <p>اطلاعات را با دقت وارد کنید. شماره موبایل و ایمیل برای اطلاع‌رسانی استفاده می‌شوند و کد پیگیری تنها راه ورود شما است.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-sm text-slate-700">
                نام <span className="text-red-500">*</span>
              </Label>
              <Input
                id="first_name"
                {...register('first_name')}
                placeholder="نام"
                className="bg-white border-slate-200"
              />
              {errors.first_name && (
                <p className="text-sm text-red-500">{errors.first_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-sm text-slate-700">
                نام خانوادگی <span className="text-red-500">*</span>
              </Label>
              <Input
                id="last_name"
                {...register('last_name')}
                placeholder="نام خانوادگی"
                className="bg-white border-slate-200"
              />
              {errors.last_name && (
                <p className="text-sm text-red-500">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="national_id" className="text-sm text-slate-700">
              کد ملی <span className="text-red-500">*</span>
            </Label>
            <Input
              id="national_id"
              {...register('national_id')}
              placeholder="کد ملی 10 رقمی"
              maxLength={10}
              dir="ltr"
              className="bg-white border-slate-200"
            />
            {errors.national_id && (
              <p className="text-sm text-red-500">{errors.national_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mobile" className="text-sm text-slate-700">
                شماره موبایل <span className="text-red-500">*</span>
              </Label>
              <Input
                id="mobile"
                {...register('mobile')}
                placeholder="09123456789"
                dir="ltr"
                maxLength={11}
                className="bg-white border-slate-200"
              />
              {errors.mobile && (
                <p className="text-sm text-red-500">{errors.mobile.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-slate-700">
                ایمیل <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="example@email.com"
                dir="ltr"
                className="bg-white border-slate-200"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="round_type" className="text-sm text-slate-700">
              نوع فراخوان <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedRoundType || undefined}
              onValueChange={(value) => setValue('round_type', value as RoundType, { shouldValidate: true })}
              disabled={!!preFilledData?.roundType}
            >
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue placeholder="نوع فراخوان را انتخاب کنید" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MA_TALENT">استعداد درخشان کارشناسی ارشد</SelectItem>
                <SelectItem value="PHD_TALENT">استعداد درخشان دکتری</SelectItem>
                <SelectItem value="PHD_EXAM">آزمون دکتری</SelectItem>
                <SelectItem value="OLYMPIAD">المپیاد</SelectItem>
              </SelectContent>
            </Select>
            {errors.round_type && (
              <p className="text-sm text-red-500">{errors.round_type.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base font-medium" 
            size="lg"
            disabled={loading}
          >
            {loading ? 'در حال ثبت‌نام...' : 'ثبت‌نام'}
          </Button>

          <div className="text-center">
            <p className="text-sm text-slate-600">
              قبلاً ثبت‌نام کرده‌اید؟{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                ورود به سامانه
              </Link>
            </p>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Register;
