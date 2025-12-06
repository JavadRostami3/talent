import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, LogIn } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { validateNationalId } from '@/utils/helpers';

const loginSchema = z.object({
  nationalId: z
    .string()
    .length(10, 'کد ملی باید ۱۰ رقم باشد')
    .refine((val) => validateNationalId(val), 'کد ملی نامعتبر است'),
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
      
      navigate('/student/dashboard');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary p-4 rounded-2xl">
              <GraduationCap className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">سامانه ثبت‌نام دانشجویان مستعد</CardTitle>
            <CardDescription className="text-base mt-2">دانشگاه علوم پزشکی</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="nationalId" className="text-sm font-medium text-foreground">
                کد ملی
              </label>
              <Input
                id="nationalId"
                {...register('nationalId')}
                placeholder="کد ملی ۱۰ رقمی"
                className="text-left"
                maxLength={10}
                dir="ltr"
              />
              {errors.nationalId && (
                <p className="text-sm text-destructive">{errors.nationalId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="trackingCode" className="text-sm font-medium text-foreground">
                کد پیگیری <span className="text-destructive">*</span>
              </label>
              <Input
                id="trackingCode"
                type="text"
                {...register('trackingCode')}
                placeholder="کد پیگیری ۱۰ رقمی دریافتی در ثبت‌نام"
                className="text-left"
                dir="ltr"
                maxLength={10}
              />
              {errors.trackingCode && (
                <p className="text-sm text-destructive">{errors.trackingCode.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              <LogIn className="ml-2 h-4 w-4" />
              {loading ? 'در حال ورود...' : 'ورود به سامانه'}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              ثبت‌نام نکرده‌اید؟{' '}
              <a href="/register" className="text-primary hover:underline font-medium">
                دریافت کد پیگیری
              </a>
            </p>
            
            <div className="pt-3 border-t border-border/50">
              <a 
                href="/admin/login" 
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ورود همکاران / پرسنل →
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
