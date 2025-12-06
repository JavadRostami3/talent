import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Download, FileSpreadsheet, FileText, Filter,
  Calendar, TrendingUp, Users, Award, CheckCircle, XCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import applicationService from '@/services/applicationService';
import type { ApplicationStatus } from '@/types/models';

const ReportsPage = () => {
  const [loading, setLoading] = useState(false);
  
  // فیلترها
  const [roundTypeFilter, setRoundTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  const handleExportExcel = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (roundTypeFilter) filters.round_type = roundTypeFilter;
      if (statusFilter) filters.status = statusFilter;
      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;
      if (facultyFilter) filters.faculty = facultyFilter;
      if (departmentFilter) filters.department = departmentFilter;

      await applicationService.exportToExcel(filters);
      
      toast({
        title: 'موفق',
        description: 'فایل اکسل در حال دانلود است',
      });
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در دریافت گزارش',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    {
      id: 'all_applications',
      title: 'گزارش کامل درخواست‌ها',
      description: 'تمام درخواست‌ها با جزئیات کامل',
      icon: FileSpreadsheet,
      color: 'bg-blue-500',
    },
    {
      id: 'approved',
      title: 'گزارش پذیرفته‌شدگان',
      description: 'لیست متقاضیان تایید شده',
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      id: 'rejected',
      title: 'گزارش رد شدگان',
      description: 'لیست متقاضیان رد شده با دلایل',
      icon: XCircle,
      color: 'bg-red-500',
    },
    {
      id: 'pending',
      title: 'گزارش در انتظار بررسی',
      description: 'پرونده‌های نیازمند اقدام',
      icon: Calendar,
      color: 'bg-yellow-500',
    },
    {
      id: 'scores',
      title: 'گزارش امتیازات',
      description: 'توزیع نمرات و رتبه‌بندی',
      icon: Award,
      color: 'bg-purple-500',
    },
    {
      id: 'statistics',
      title: 'گزارش آماری',
      description: 'نمودارها و تحلیل‌های آماری',
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  const quickReports = [
    {
      title: 'گزارش امروز',
      description: 'درخواست‌های ثبت شده امروز',
      action: () => {
        const today = new Date().toISOString().split('T')[0];
        setDateFrom(today);
        setDateTo(today);
        handleExportExcel();
      },
    },
    {
      title: 'گزارش هفته جاری',
      description: 'درخواست‌های هفته جاری',
      action: () => {
        const today = new Date();
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        setDateFrom(weekStart.toISOString().split('T')[0]);
        setDateTo(new Date().toISOString().split('T')[0]);
        handleExportExcel();
      },
    },
    {
      title: 'گزارش ماه جاری',
      description: 'درخواست‌های ماه جاری',
      action: () => {
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        setDateFrom(monthStart.toISOString().split('T')[0]);
        setDateTo(new Date().toISOString().split('T')[0]);
        handleExportExcel();
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">گزارش‌ها و آمار</h1>
        <p className="text-muted-foreground">دریافت گزارش‌های تفصیلی و آمار درخواست‌ها</p>
      </div>

      {/* Quick Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">گزارش‌های سریع</CardTitle>
          <CardDescription>دسترسی سریع به گزارش‌های پرکاربرد</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickReports.map((report, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="h-auto flex-col items-start p-4 text-right"
                onClick={report.action}
                disabled={loading}
              >
                <Calendar className="h-5 w-5 mb-2 text-primary" />
                <div>
                  <p className="font-semibold mb-1">{report.title}</p>
                  <p className="text-xs text-muted-foreground">{report.description}</p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            فیلترهای پیشرفته
          </CardTitle>
          <CardDescription>سفارشی‌سازی گزارش با فیلترهای دلخواه</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Round Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">نوع فراخوان</label>
              <Select value={roundTypeFilter} onValueChange={setRoundTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="همه" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">همه</SelectItem>
                  <SelectItem value="MA_TALENT">استعداد ارشد</SelectItem>
                  <SelectItem value="PHD_TALENT">استعداد دکتری</SelectItem>
                  <SelectItem value="PHD_EXAM">آزمون دکتری</SelectItem>
                  <SelectItem value="OLYMPIAD">المپیاد</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">وضعیت</label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ApplicationStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="همه" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">همه</SelectItem>
                  <SelectItem value="SUBMITTED">ثبت شده</SelectItem>
                  <SelectItem value="UNDER_REVIEW">در حال بررسی</SelectItem>
                  <SelectItem value="APPROVED">تایید شده</SelectItem>
                  <SelectItem value="REJECTED">رد شده</SelectItem>
                  <SelectItem value="COMPLETED">تکمیل شده</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <label className="text-sm font-medium">از تاریخ</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <label className="text-sm font-medium">تا تاریخ</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            {/* Faculty */}
            <div className="space-y-2">
              <label className="text-sm font-medium">دانشکده</label>
              <Input
                placeholder="نام دانشکده"
                value={facultyFilter}
                onChange={(e) => setFacultyFilter(e.target.value)}
              />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <label className="text-sm font-medium">گروه آموزشی</label>
              <Input
                placeholder="نام گروه"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          <div className="flex gap-4">
            <Button onClick={handleExportExcel} disabled={loading}>
              <Download className="h-4 w-4 ml-2" />
              {loading ? 'در حال دریافت...' : 'دریافت گزارش Excel'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setRoundTypeFilter('');
                setStatusFilter('');
                setDateFrom('');
                setDateTo('');
                setFacultyFilter('');
                setDepartmentFilter('');
              }}
            >
              پاک کردن فیلترها
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Types */}
      <div>
        <h2 className="text-xl font-bold mb-4">انواع گزارش</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className={`${report.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <report.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">{report.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // Set specific filters based on report type
                    if (report.id === 'approved') {
                      setStatusFilter('APPROVED');
                    } else if (report.id === 'rejected') {
                      setStatusFilter('REJECTED');
                    } else if (report.id === 'pending') {
                      setStatusFilter('UNDER_REVIEW');
                    }
                    handleExportExcel();
                  }}
                  disabled={loading}
                >
                  <Download className="h-4 w-4 ml-2" />
                  دریافت
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Statistics Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            خلاصه آماری
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-blue-600">-</p>
              <p className="text-sm text-muted-foreground">کل درخواست‌ها</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-green-600">-</p>
              <p className="text-sm text-muted-foreground">تایید شده</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <XCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
              <p className="text-2xl font-bold text-red-600">-</p>
              <p className="text-sm text-muted-foreground">رد شده</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
              <p className="text-2xl font-bold text-yellow-600">-</p>
              <p className="text-sm text-muted-foreground">در انتظار</p>
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-4">
            برای مشاهده آمار به‌روز، از بخش داشبورد استفاده کنید
          </p>
        </CardContent>
      </Card>

      {/* Export Formats Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">فرمت‌های خروجی</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              <span><strong>Excel (.xlsx):</strong> شامل تمام فیلدها با قابلیت فیلتر و مرتب‌سازی</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span><strong>CSV:</strong> فرمت متنی برای استفاده در سایر نرم‌افزارها</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
