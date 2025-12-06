import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, BarChart3, Download, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ReportsGuide = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin/dashboard')}>
          <ChevronRight className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">راهنمای گزارش‌گیری</h1>
          <p className="text-muted-foreground mt-2">
            نحوه دریافت گزارش‌ها و آمارهای مختلف از سیستم
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>انواع گزارش‌ها</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 rounded-full p-2 mt-1">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">گزارش آماری کلی</h3>
              <p className="text-sm text-muted-foreground">
                تعداد کل متقاضیان، تفکیک به رشته، دانشکده و وضعیت بررسی
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-primary/10 rounded-full p-2 mt-1">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">گزارش تفصیلی پرونده‌ها</h3>
              <p className="text-sm text-muted-foreground">
                لیست کامل پرونده‌ها با جزئیات و امتیازات
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-primary/10 rounded-full p-2 mt-1">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">خروجی Excel</h3>
              <p className="text-sm text-muted-foreground">
                دریافت فایل Excel برای پردازش‌های بیشتر
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">نحوه استفاده</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-blue-900">
            <li className="flex items-start gap-2">
              <span className="font-bold">۱.</span>
              <span>از منوی بالا به بخش مورد نظر بروید</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">۲.</span>
              <span>فیلترهای مورد نظر را اعمال کنید</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">۳.</span>
              <span>روی دکمه "دانلود Excel" کلیک کنید</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">۴.</span>
              <span>فایل به صورت خودکار دانلود می‌شود</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={() => navigate('/admin/university/applications')}>
          رفتن به لیست پرونده‌ها
        </Button>
        <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
          بازگشت به داشبورد
        </Button>
      </div>
    </div>
  );
};

export default ReportsGuide;
