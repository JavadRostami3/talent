import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, LogIn, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

const adminLoginSchema = z.object({
  nationalId: z
    .string()
    .length(10, 'کد ملی باید ۱۰ رقم باشد'),
  password: z
    .string()
    .min(1, 'رمز عبور الزامی است')
    .min(8, 'رمز عبور باید حداقل ۸ کاراکتر باشد'),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { adminLogin } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
  });

  const onSubmit = async (data: AdminLoginFormData) => {
    setLoading(true);
    try {
      const response = await adminLogin(data.nationalId, data.password);
      
      // Check if user is applicant (shouldn't happen but handle it)
      if (response.user.role === 'APPLICANT') {
        toast({
          title: 'خطا',
          description: 'دسترسی غیرمجاز. لطفاً از صفحه ورود دانشجویان استفاده کنید.',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }

      // Check staff status
      if (!response.user.is_staff) {
        toast({
          title: 'خطا',
          description: 'دسترسی محدود. لطفاً با پشتیبانی تماس بگیرید.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'خوش آمدید',
        description: `ورود موفق - ${response.user.full_name || response.user.first_name}`,
      });
      
      // Redirect based on role
      if (response.user.role === 'UNIVERSITY_ADMIN') {
        navigate('/admin/university/applications');
      } else if (response.user.role === 'FACULTY_ADMIN') {
        navigate('/admin/faculty/applications');
      } else if (response.user.role === 'SYSTEM_ADMIN' || response.user.role === 'SUPERADMIN') {
        navigate('/admin');
      } else {
        navigate('/admin');
      }
    } catch (error: any) {
      const errorMessage = error.message || 
        error.response?.data?.error || 
        error.response?.data?.detail || 
        'کد ملی یا رمز عبور اشتباه است';
      
      toast({
        title: 'خطا در ورود',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-lg border-slate-200 dark:border-slate-800">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center">
            <img 
              src="/umz-logo.png" 
              alt="دانشگاه مازندران" 
              className="h-20 w-20 object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              پنل مدیریت - دانشگاه مازندران
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              سامانه ثبت‌نام و مصاحبه - ورود همکاران و پرسنل
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="nationalId" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                کد ملی
              </label>
              <Input
                id="nationalId"
                {...register('nationalId')}
                placeholder="کد ملی ۱۰ رقمی"
                className="text-left"
                maxLength={10}
                dir="ltr"
                disabled={loading}
              />
              {errors.nationalId && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.nationalId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                رمز عبور
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="رمز عبور"
                  className="text-left pr-10"
                  dir="ltr"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 text-white dark:text-slate-900" 
              disabled={loading}
            >
              <LogIn className="ml-2 h-4 w-4" />
              {loading ? 'در حال ورود...' : 'ورود به پنل مدیریت'}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            <a 
              href="/login" 
              className="flex items-center justify-center text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
            >
              <ArrowRight className="ml-1 h-4 w-4" />
              بازگشت به صفحه ورود دانشجویان
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
