import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, Filter, Eye, CheckCircle, XCircle, Clock, 
  AlertTriangle, FileText, Download, RefreshCw 
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import applicationService from '@/services/applicationService';
import type { Application, ApplicationStatus, UniversityReviewStatus } from '@/types/models';

const ApplicationsList = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // فیلترها
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<UniversityReviewStatus | ''>('');
  const [roundTypeFilter, setRoundTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    fetchApplications();
  }, [page, statusFilter, reviewStatusFilter, roundTypeFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const filters: any = {
        page,
        page_size: pageSize,
      };

      if (statusFilter) filters.status = statusFilter;
      if (reviewStatusFilter) filters.university_review_status = reviewStatusFilter;
      if (roundTypeFilter) filters.round_type = roundTypeFilter;
      if (searchTerm) filters.search = searchTerm;

      const response = await applicationService.getApplications(filters);
      setApplications(response.results);
      setTotalCount(response.count);
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری لیست درخواست‌ها',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchApplications();
  };

  const handleExport = async () => {
    try {
      const filters: any = {};
      if (statusFilter) filters.status = statusFilter;
      if (reviewStatusFilter) filters.university_review_status = reviewStatusFilter;
      if (roundTypeFilter) filters.round_type = roundTypeFilter;

      await applicationService.exportToExcel(filters);
      toast({
        title: 'موفق',
        description: 'فایل اکسل در حال دانلود است',
      });
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: 'خطا در دریافت فایل اکسل',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    const statusMap: Record<ApplicationStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      NEW: { label: 'جدید', variant: 'secondary' },
      DRAFT: { label: 'پیش‌نویس', variant: 'outline' },
      PROGRAM_SELECTED: { label: 'رشته انتخاب شده', variant: 'outline' },
      PERSONAL_INFO_COMPLETED: { label: 'اطلاعات شخصی', variant: 'outline' },
      IDENTITY_DOCS_UPLOADED: { label: 'مدارک شناسایی', variant: 'outline' },
      EDU_INFO_COMPLETED: { label: 'اطلاعات تحصیلی', variant: 'outline' },
      EDU_DOCS_UPLOADED: { label: 'مدارک تحصیلی', variant: 'outline' },
      SUBMITTED: { label: 'ثبت شده', variant: 'default' },
      UNDER_REVIEW: { label: 'در حال بررسی', variant: 'default' },
      UNDER_UNIVERSITY_REVIEW: { label: 'بررسی دانشگاه', variant: 'default' },
      APPROVED: { label: 'تایید شده', variant: 'default' },
      APPROVED_BY_UNIVERSITY: { label: 'تایید دانشگاه', variant: 'default' },
      REJECTED: { label: 'رد شده', variant: 'destructive' },
      REJECTED_BY_UNIVERSITY: { label: 'رد دانشگاه', variant: 'destructive' },
      RETURNED_FOR_CORRECTION: { label: 'برگشت برای اصلاح', variant: 'secondary' },
      PENDING_DOCUMENTS: { label: 'در انتظار مدارک', variant: 'secondary' },
      UNDER_FACULTY_REVIEW: { label: 'بررسی دانشکده', variant: 'default' },
      FACULTY_REVIEW_COMPLETED: { label: 'بررسی دانشکده تکمیل', variant: 'default' },
      COMPLETED: { label: 'تکمیل شده', variant: 'default' },
      INELIGIBLE: { label: 'غیرواجد شرایط', variant: 'destructive' },
      DELETED: { label: 'حذف شده', variant: 'destructive' },
    };

    const config = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getReviewStatusBadge = (status?: UniversityReviewStatus) => {
    if (!status) return <Badge variant="outline">نامشخص</Badge>;

    const statusMap: Record<UniversityReviewStatus, { label: string; icon: any; className: string }> = {
      PENDING: { label: 'در انتظار', icon: Clock, className: 'bg-yellow-100 text-yellow-800' },
      APPROVED: { label: 'تایید شده', icon: CheckCircle, className: 'bg-green-100 text-green-800' },
      APPROVED_WITH_DEFECT: { label: 'تایید با نقص', icon: AlertTriangle, className: 'bg-orange-100 text-orange-800' },
      REJECTED: { label: 'رد شده', icon: XCircle, className: 'bg-red-100 text-red-800' },
    };

    const config = statusMap[status];
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 ml-1" />
        {config.label}
      </Badge>
    );
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">بررسی درخواست‌ها</h1>
          <p className="text-muted-foreground">مدیریت و بررسی درخواست‌های ثبت‌نام</p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 ml-2" />
          دریافت اکسل
        </Button>
      </div>

      {/* فیلترها */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            فیلترها و جستجو
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* جستجو */}
            <div className="space-y-2">
              <label className="text-sm font-medium">جستجو</label>
              <div className="flex gap-2">
                <Input
                  placeholder="کد ملی، کد رهگیری، نام..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* فیلتر نوع فراخوان */}
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

            {/* فیلتر وضعیت */}
            <div className="space-y-2">
              <label className="text-sm font-medium">وضعیت کلی</label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ApplicationStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="همه" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">همه</SelectItem>
                  <SelectItem value="SUBMITTED">ثبت شده</SelectItem>
                  <SelectItem value="UNDER_UNIVERSITY_REVIEW">در حال بررسی</SelectItem>
                  <SelectItem value="APPROVED_BY_UNIVERSITY">تایید شده</SelectItem>
                  <SelectItem value="REJECTED_BY_UNIVERSITY">رد شده</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* فیلتر وضعیت بررسی */}
            <div className="space-y-2">
              <label className="text-sm font-medium">وضعیت بررسی</label>
              <Select value={reviewStatusFilter} onValueChange={(v) => setReviewStatusFilter(v as UniversityReviewStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="همه" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">همه</SelectItem>
                  <SelectItem value="PENDING">در انتظار</SelectItem>
                  <SelectItem value="APPROVED">تایید شده</SelectItem>
                  <SelectItem value="APPROVED_WITH_DEFECT">تایید با نقص</SelectItem>
                  <SelectItem value="REJECTED">رد شده</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {totalCount} درخواست یافت شد
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setReviewStatusFilter('');
                setRoundTypeFilter('');
                setPage(1);
              }}
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              پاک کردن فیلترها
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* جدول درخواست‌ها */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">درخواستی یافت نشد</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>کد رهگیری</TableHead>
                    <TableHead>متقاضی</TableHead>
                    <TableHead>نوع فراخوان</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>وضعیت بررسی</TableHead>
                    <TableHead>تاریخ ثبت</TableHead>
                    <TableHead className="text-left">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-mono">{app.tracking_code}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {app.applicant?.user.first_name} {app.applicant?.user.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {app.applicant?.user.national_id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {app.round?.title || app.round_type}
                      </TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell>{getReviewStatusBadge(app.university_review_status)}</TableCell>
                      <TableCell>
                        {new Date(app.created_at).toLocaleDateString('fa-IR')}
                      </TableCell>
                      <TableCell className="text-left">
                        <Button
                          size="sm"
                          onClick={() => navigate(`/admin/university/applications/${app.id}`)}
                        >
                          <Eye className="h-4 w-4 ml-2" />
                          بررسی
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    صفحه {page} از {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      قبلی
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      بعدی
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplicationsList;
