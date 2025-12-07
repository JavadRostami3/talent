import { useState, useEffect } from 'react';
import { AuditLog, AuditLogFilters, AuditStats } from '@/types/audit';
import auditService from '@/services/auditService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Download,
  RefreshCw,
  Filter,
  Calendar,
  Eye,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import ChangeHistoryViewer from '@/components/audit/ChangeHistoryViewer';

export default function AuditLogsPage() {
  const { toast } = useToast();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    page_size: 20,
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsData, statsData] = await Promise.all([
        auditService.getAuditLogs(filters),
        auditService.getAuditStats(),
      ]);
      setLogs(logsData.results);
      setTotalPages(Math.ceil(logsData.count / (filters.page_size || 20)));
      setStats(statsData);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'بارگذاری داده‌ها با خطا مواجه شد',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'CSV' | 'PDF' | 'EXCEL') => {
    try {
      setExporting(true);
      const result = await auditService.exportAuditLogs({
        filters,
        format,
        include_changes: true,
      });

      // Download file
      const blob = await auditService.downloadAuditExport(result.file_url);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'موفق',
        description: 'فایل با موفقیت دانلود شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'صادرات فایل با خطا مواجه شد',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsDialogOpen(true);
  };

  const getActionBadge = (actionType: string) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-green-500',
      UPDATE: 'bg-blue-500',
      DELETE: 'bg-red-500',
      APPROVE: 'bg-green-600',
      REJECT: 'bg-red-600',
      SUBMIT: 'bg-purple-500',
      LOGIN: 'bg-gray-500',
      LOGOUT: 'bg-gray-400',
    };
    const labels: Record<string, string> = {
      CREATE: 'ایجاد',
      UPDATE: 'ویرایش',
      DELETE: 'حذف',
      APPROVE: 'تایید',
      REJECT: 'رد',
      SUBMIT: 'ارسال',
      VIEW: 'مشاهده',
      LOGIN: 'ورود',
      LOGOUT: 'خروج',
      EXPORT: 'صادرات',
    };
    return (
      <Badge className={colors[actionType] || 'bg-gray-500'}>
        {labels[actionType] || actionType}
      </Badge>
    );
  };

  const getResourceBadge = (resourceType: string) => {
    const labels: Record<string, string> = {
      APPLICATION: 'درخواست',
      DOCUMENT: 'مدرک',
      USER: 'کاربر',
      PROGRAM: 'برنامه',
      UNIVERSITY: 'دانشگاه',
      FACULTY: 'دانشکده',
      ANNOUNCEMENT: 'اطلاعیه',
      WORKFLOW: 'ورکفلو',
      NOTIFICATION: 'اعلان',
      REVIEW: 'بررسی',
      COMMENT: 'نظر',
      SETTINGS: 'تنظیمات',
    };
    return (
      <Badge variant="outline">{labels[resourceType] || resourceType}</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">لاگ‌های ممیزی</h1>
          <p className="text-muted-foreground mt-1">
            تاریخچه کامل فعالیت‌ها و تغییرات سیستم
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw
              className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`}
            />
            بروزرسانی
          </Button>
          <Select onValueChange={(value) => handleExport(value as any)}>
            <SelectTrigger className="w-40">
              <Download className="w-4 h-4 ml-2" />
              <SelectValue placeholder="صادرات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CSV">CSV</SelectItem>
              <SelectItem value="EXCEL">Excel</SelectItem>
              <SelectItem value="PDF">PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                کل لاگ‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_logs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                امروز
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {stats.today_logs}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                این هفته
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats.this_week_logs}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                این ماه
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {stats.this_month_logs}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={filters.search || ''}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value, page: 1 })
                }
                placeholder="جستجو..."
                className="pr-10"
              />
            </div>

            <Select
              value={filters.action_type || 'all'}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  action_type: value === 'all' ? undefined : (value as any),
                  page: 1,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="نوع عملیات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه عملیات‌ها</SelectItem>
                <SelectItem value="CREATE">ایجاد</SelectItem>
                <SelectItem value="UPDATE">ویرایش</SelectItem>
                <SelectItem value="DELETE">حذف</SelectItem>
                <SelectItem value="APPROVE">تایید</SelectItem>
                <SelectItem value="REJECT">رد</SelectItem>
                <SelectItem value="SUBMIT">ارسال</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.resource_type || 'all'}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  resource_type: value === 'all' ? undefined : (value as any),
                  page: 1,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="نوع منبع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه منابع</SelectItem>
                <SelectItem value="APPLICATION">درخواست</SelectItem>
                <SelectItem value="DOCUMENT">مدرک</SelectItem>
                <SelectItem value="USER">کاربر</SelectItem>
                <SelectItem value="WORKFLOW">ورکفلو</SelectItem>
                <SelectItem value="NOTIFICATION">اعلان</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setFilters({ page: 1, page_size: 20 });
                loadData();
              }}
            >
              <Filter className="w-4 h-4 ml-2" />
              پاک کردن فیلترها
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>لیست لاگ‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">در حال بارگذاری...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>هیچ لاگی یافت نشد</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>کاربر</TableHead>
                    <TableHead>عملیات</TableHead>
                    <TableHead>منبع</TableHead>
                    <TableHead>توضیحات</TableHead>
                    <TableHead>زمان</TableHead>
                    <TableHead className="text-left">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.user.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {log.user.role}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action_type)}</TableCell>
                      <TableCell>
                        {getResourceBadge(log.resource_type)}
                        {log.resource_id && (
                          <span className="text-sm text-muted-foreground mr-2">
                            #{log.resource_id}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.description}
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(log.timestamp), {
                          addSuffix: true,
                          locale: faIR,
                        })}
                      </TableCell>
                      <TableCell className="text-left">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(log)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  صفحه {page} از {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({ ...filters, page: page - 1 })}
                    disabled={page === 1}
                  >
                    قبلی
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({ ...filters, page: page + 1 })}
                    disabled={page === totalPages}
                  >
                    بعدی
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>جزئیات لاگ</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <ChangeHistoryViewer
              changes={[selectedLog]}
              resourceTitle={selectedLog.resource_title}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
