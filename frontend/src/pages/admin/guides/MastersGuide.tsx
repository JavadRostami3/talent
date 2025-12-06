import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  AlertCircle, 
  FileCheck, 
  Clock,
  BookOpen,
  ArrowRight
} from 'lucide-react';

const GuideCard = ({ 
  title, 
  children, 
  icon: Icon = BookOpen,
  variant = 'default' 
}: { 
  title: string; 
  children: React.ReactNode; 
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'success' | 'warning' | 'info'
}) => {
  const colors = {
    default: 'border-gray-200',
    success: 'border-green-200 bg-green-50/50',
    warning: 'border-orange-200 bg-orange-50/50',
    info: 'border-blue-200 bg-blue-50/50',
  };

  return (
    <Card className={colors[variant]}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

const MastersGuide = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">راهنمای بررسی پرونده‌های استعداد درخشان ارشد</h1>
        <p className="text-muted-foreground">
          مراحل و نکات مهم در بررسی و تایید پرونده‌های متقاضیان کارشناسی ارشد
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          لطفاً قبل از شروع بررسی پرونده‌ها، این راهنما را به دقت مطالعه فرمایید تا از یکنواختی فرآیند اطمینان حاصل شود.
        </AlertDescription>
      </Alert>

      {/* مراحل بررسی */}
      <GuideCard title="مراحل بررسی پرونده" icon={FileCheck}>
        <ol className="space-y-4">
          <li className="flex gap-3">
            <Badge className="rounded-full w-6 h-6 flex items-center justify-center shrink-0">1</Badge>
            <div>
              <h4 className="font-semibold mb-1">بررسی اطلاعات هویتی</h4>
              <ul className="text-sm text-muted-foreground space-y-1 mr-4">
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>مطابقت کد ملی با تصویر کارت ملی/شناسنامه</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>صحت نام و نام خانوادگی</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>بررسی تاریخ تولد و سن متقاضی</span>
                </li>
              </ul>
            </div>
          </li>

          <li className="flex gap-3">
            <Badge className="rounded-full w-6 h-6 flex items-center justify-center shrink-0">2</Badge>
            <div>
              <h4 className="font-semibold mb-1">بررسی مدارک تحصیلی</h4>
              <ul className="text-sm text-muted-foreground space-y-1 mr-4">
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>تصویر مدرک کارشناسی (واضح و خوانا)</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>ریز نمرات کارشناسی</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>معدل کل حداقل 16 یا بالاتر (طبق مقررات)</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>تطابق رشته تحصیلی با رشته انتخابی</span>
                </li>
              </ul>
            </div>
          </li>

          <li className="flex gap-3">
            <Badge className="rounded-full w-6 h-6 flex items-center justify-center shrink-0">3</Badge>
            <div>
              <h4 className="font-semibold mb-1">بررسی رتبه دانشگاهی</h4>
              <ul className="text-sm text-muted-foreground space-y-1 mr-4">
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>گواهی رتبه از دانشگاه محل تحصیل</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>20% برتر: حداکثر رتبه معادل یک پنجم تعداد فارغ‌التحصیلان</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>10% بعدی: رتبه بین 20% تا 30% برتر</span>
                </li>
              </ul>
            </div>
          </li>

          <li className="flex gap-3">
            <Badge className="rounded-full w-6 h-6 flex items-center justify-center shrink-0">4</Badge>
            <div>
              <h4 className="font-semibold mb-1">بررسی توصیه‌نامه‌ها</h4>
              <ul className="text-sm text-muted-foreground space-y-1 mr-4">
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>حداقل دو توصیه‌نامه از اساتید مرتبط</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>مهر و امضای استاد</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>تاریخ صدور (نباید قدیمی‌تر از 6 ماه باشد)</span>
                </li>
              </ul>
            </div>
          </li>
        </ol>
      </GuideCard>

      {/* نکات مهم */}
      <GuideCard title="نکات مهم" icon={AlertCircle} variant="warning">
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
            <span>همه مدارک باید واضح، خوانا و بدون خط‌خوردگی باشند</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
            <span>در صورت کوچکترین شک، پرونده را با نقص برگردانید</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
            <span>توضیحات نقص باید دقیق و راهنما باشد</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
            <span>زمان پاسخگویی به متقاضی: حداکثر 48 ساعت</span>
          </li>
        </ul>
      </GuideCard>

      {/* دلایل رد پرونده */}
      <GuideCard title="دلایل متداول رد پرونده" icon={AlertCircle} variant="info">
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-red-500 shrink-0">✗</span>
            <span>عدم تطابق اطلاعات هویتی با مدارک</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 shrink-0">✗</span>
            <span>معدل کمتر از حد مجاز</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 shrink-0">✗</span>
            <span>عدم احراز رتبه (خارج از 30% برتر)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 shrink-0">✗</span>
            <span>مدارک جعلی یا دستکاری شده</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 shrink-0">✗</span>
            <span>عدم تطابق رشته تحصیلی با رشته انتخابی</span>
          </li>
        </ul>
      </GuideCard>

      {/* زمان‌بندی */}
      <GuideCard title="زمان‌بندی بررسی" icon={Clock} variant="success">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
            <span>بررسی اولیه پرونده</span>
            <Badge>24 ساعت</Badge>
          </div>
          <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
            <span>پاسخ به پرونده‌های نقص‌دار</span>
            <Badge>48 ساعت</Badge>
          </div>
          <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
            <span>بررسی مجدد پرونده‌های اصلاح شده</span>
            <Badge>24 ساعت</Badge>
          </div>
        </div>
      </GuideCard>

      {/* پشتیبانی */}
      <Alert>
        <AlertDescription>
          <strong>نیاز به راهنمایی دارید؟</strong>
          <br />
          با واحد پشتیبانی از طریق تلفن داخلی 2500 یا ایمیل support@znu.ac.ir تماس بگیرید.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default MastersGuide;
