import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, CheckCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PhdGuide = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin/dashboard')}>
          <ChevronRight className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">راهنمای بررسی پرونده‌های دکتری</h1>
          <p className="text-muted-foreground mt-2">
            راهنمای گام به گام بررسی پرونده‌های استعداد درخشان دکتری
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>مراحل بررسی</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 rounded-full p-2 mt-1">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">۱. بررسی مدرک کارشناسی ارشد</h3>
              <p className="text-sm text-muted-foreground">
                کنترل صحت مدرک، معدل، دانشگاه و رشته تحصیلی
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-primary/10 rounded-full p-2 mt-1">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">۲. بررسی سوابق پژوهشی</h3>
              <p className="text-sm text-muted-foreground">
                مقالات، کتب، پروژه‌های تحقیقاتی و سوابق علمی
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-primary/10 rounded-full p-2 mt-1">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">۳. محاسبه امتیاز</h3>
              <p className="text-sm text-muted-foreground">
                امتیازدهی براساس فرمول مصوب و ضرایب تعیین شده
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>مدارک مورد نیاز</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {[
              'مدرک کارشناسی ارشد',
              'ریز نمرات کارشناسی و کارشناسی ارشد',
              'گواهی رتبه',
              'رزومه علمی و پژوهشی',
              'کپی مقالات منتشر شده',
            ].map((item, index) => (
              <li key={index} className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={() => navigate('/admin/university/applications')}>
          مشاهده لیست پرونده‌ها
        </Button>
        <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
          بازگشت به داشبورد
        </Button>
      </div>
    </div>
  );
};

export default PhdGuide;
