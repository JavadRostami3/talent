import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AuthLayout from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const loginSchema = z.object({
  nationalId: z
    .string()
    .length(10, 'کد ملی باید ۱۰ رقم باشد'),
  trackingCode: z
    .string()
    .min(1, 'کد پیگیری الزامی است')
    .length(10, 'کد پیگیری باید ۱۰ کاراکتر باشد'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const response = await login(data.nationalId, data.trackingCode);
      
      // Check if user is admin (shouldn't happen but handle it)
      if (response?.user?.role !== 'APPLICANT') {
        toast({
          title: 'خطا',
          description: 'لطفاً از صفحه ورود مدیران استفاده کنید',
          variant: 'destructive',
        });
        navigate('/admin/login');
        return;
      }

      toast({
        title: 'خوش آمدید',
        description: 'ورود با موفقیت انجام شد',
      });
      
      // هدایت به صفحه اصلی که به صورت هوشمند به پنل مناسب ریدایرکت می‌کند
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'خطا در ورود',
        description: error.response?.data?.error || error.response?.data?.detail || 'کد ملی یا کد پیگیری اشتباه است',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="ورود به سامانه"
      subtitle="ورود متقاضیان با کد ملی و کد پیگیری"
      helper="کد پیگیری را پس از ثبت‌نام دریافت کرده‌اید. در صورت فراموشی، مجدداً ثبت‌نام کنید."
      footer={
        <div className="text-center space-y-3">
          <p className="text-sm text-slate-600">
            ثبت‌نام نکرده‌اید؟{' '}
            <a href="/register" className="text-blue-600 hover:underline font-medium">
              دریافت کد پیگیری
            </a>
          </p>
          <a 
            href="/admin/login" 
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            ورود همکاران / پرسنل
          </a>
        </div>
      }
    >
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 mb-4">
        <p className="font-medium mb-1">ورود داوطلبان</p>
        <p>برای ورود، کد ملی و کد پیگیری ۱۰ رقمی دریافت‌شده در ثبت‌نام را وارد کنید.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="nationalId" className="text-sm text-slate-700">
            کد ملی
          </Label>
          <Input
            id="nationalId"
            {...register('nationalId')}
            placeholder="کد ملی ۱۰ رقمی"
            className="text-left bg-white border-slate-200"
            maxLength={10}
            dir="ltr"
          />
          {errors.nationalId && (
            <p className="text-sm text-red-500">{errors.nationalId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="trackingCode" className="text-sm text-slate-700">
            کد پیگیری <span className="text-red-500">*</span>
          </Label>
          <Input
            id="trackingCode"
            type="text"
            {...register('trackingCode')}
            placeholder="کد پیگیری ۱۰ رقمی دریافتی در ثبت‌نام"
            className="text-left bg-white border-slate-200"
            dir="ltr"
            maxLength={10}
          />
          {errors.trackingCode && (
            <p className="text-sm text-red-500">{errors.trackingCode.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-3" disabled={loading}>
          <LogIn className="ml-2 h-4 w-4" />
          {loading ? 'در حال ورود...' : 'ورود به سامانه'}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Login;
