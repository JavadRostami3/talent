import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import ApplicationsTable from '@/components/features/ApplicationsTable';
import api from '@/services/api';
import type { RoundType } from '@/types/models';

interface ApplicationListItem {
  id: number;
  tracking_code: string;
  applicant: {
    full_name: string;
    national_id: string;
    first_name: string;
    last_name: string;
  };
  round: {
    id: number;
    title: string;
    round_type: RoundType;
    year: number;
  };
  faculty_department: {
    faculty_id: number;
    faculty_name: string;
    department_id: number;
    department_name: string;
  } | null;
  selected_program: {
    program_id: number;
    program_name: string;
    program_code: string;
    orientation: string;
    priority: number;
  } | null;
  university_info: {
    university_id: number;
    university_name: string;
    university_code: string;
    weight: number;
  } | null;
  rank_status: {
    group: string;
    label: string;
  } | null;
  status: string;
  status_display: string;
  university_review_status: string;
  university_review_status_display: string;
  faculty_review_completed: boolean;
  total_score: number;
  created_at: string;
  university_reviewed_at?: string;
  faculty_reviewed_at?: string;
}

interface Statistics {
  total: number;
  submitted: number;
  under_review: number;
  approved: number;
  returned_for_correction: number;
  rejected: number;
  corrected_and_resubmitted: number;
}

const UniversityAdminApplicationsList = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // فیلترها
  const [selectedRoundType, setSelectedRoundType] = useState<RoundType | 'ALL'>('ALL');
  const [selectedReviewStatus, setSelectedReviewStatus] = useState<string>('ALL');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCorrected, setShowCorrected] = useState(false);

  const roundTypeLabels: Record<RoundType, string> = {
    MA_TALENT: 'استعداد ارشد',
    PHD_TALENT: 'استعداد دکتری',
    PHD_EXAM: 'آزمون دکتری',
    OLYMPIAD: 'المپیاد',
  };

  const reviewStatusLabels = {
    PENDING: 'در انتظار بررسی',
    APPROVED: 'تایید شده',
    APPROVED_WITH_DEFECT: 'تایید با نقص',
    REJECTED: 'رد شده',
  };

  const reviewStatusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    APPROVED: 'bg-green-100 text-green-800 border-green-300',
    APPROVED_WITH_DEFECT: 'bg-orange-100 text-orange-800 border-orange-300',
    REJECTED: 'bg-red-100 text-red-800 border-red-300',
  };

  useEffect(() => {
    fetchApplications();
    fetchStatistics();
  }, [selectedRoundType, selectedReviewStatus, selectedFaculty, searchQuery, showCorrected, currentPage]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        page_size: 20,
      };

      if (selectedRoundType !== 'ALL') {
        params.round_type = selectedRoundType;
      }
      if (selectedReviewStatus !== 'ALL') {
        params.university_review_status = selectedReviewStatus;
      }
      if (selectedFaculty !== 'ALL') {
        params.faculty_id = selectedFaculty;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      if (showCorrected) {
        params.is_corrected = 'true';
      }

      const response = await api.get<{
        results: ApplicationListItem[];
        count: number;
        next: string | null;
        previous: string | null;
      }>('/api/admin/university/applications/', { params });

      setApplications(response.data.results);
      setTotalPages(Math.ceil(response.data.count / 20));
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const params: any = {};
      if (selectedRoundType !== 'ALL') {
        params.round_type = selectedRoundType;
      }

      const response = await api.get<Statistics>('/api/admin/university/statistics/', { params });
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleReviewClick = (applicationId: number) => {
    navigate(`/admin/university/applications/${applicationId}`);
  };

  const resetFilters = () => {
    setSelectedRoundType('ALL');
    setSelectedReviewStatus('ALL');
    setSelectedFaculty('ALL');
    setSearchQuery('');
    setShowCorrected(false);
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          پنل مسئول دانشگاه
        </h1>
        <p className="text-muted-foreground">
          بررسی و تایید صحت مدارک پرونده‌های ثبت‌نام
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                کل پرونده‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                در انتظار
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{statistics.submitted}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <FileText className="h-4 w-4" />
                در حال بررسی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{statistics.under_review}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                تایید شده
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                برگشت داده شده
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {statistics.returned_for_correction}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <RefreshCw className="h-4 w-4" />
                ویرایش شده
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {statistics.corrected_and_resubmitted}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <XCircle className="h-4 w-4" />
                رد شده
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.rejected}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            فیلترها
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Round Type Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">نوع فراخوان</label>
              <Select value={selectedRoundType} onValueChange={(v: any) => setSelectedRoundType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">همه</SelectItem>
                  <SelectItem value="MA_TALENT">استعداد ارشد</SelectItem>
                  <SelectItem value="PHD_TALENT">استعداد دکتری</SelectItem>
                  <SelectItem value="PHD_EXAM">آزمون دکتری</SelectItem>
                  <SelectItem value="OLYMPIAD">المپیاد</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Review Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">وضعیت بررسی</label>
              <Select value={selectedReviewStatus} onValueChange={setSelectedReviewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">همه</SelectItem>
                  <SelectItem value="PENDING">در انتظار بررسی</SelectItem>
                  <SelectItem value="APPROVED">تایید شده</SelectItem>
                  <SelectItem value="APPROVED_WITH_DEFECT">تایید با نقص</SelectItem>
                  <SelectItem value="REJECTED">رد شده</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div>
              <label className="text-sm font-medium mb-2 block">جستجو</label>
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="کد ملی، نام، کد پیگیری..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9"
                />
              </div>
            </div>

            {/* Corrected Filter */}
            <div className="flex items-end">
              <Button
                variant={showCorrected ? 'default' : 'outline'}
                onClick={() => setShowCorrected(!showCorrected)}
                className="w-full"
              >
                <RefreshCw className="ml-2 h-4 w-4" />
                فقط ویرایش شده‌ها
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={resetFilters}>
              پاک کردن فیلترها
            </Button>
            <Button onClick={fetchApplications}>
              <Search className="ml-2 h-4 w-4" />
              اعمال فیلتر
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>لیست پرونده‌ها</CardTitle>
          <CardDescription>
            {applications.length} پرونده یافت شد
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">در حال بارگذاری...</p>
            </div>
          ) : (
            <>
              <ApplicationsTable
                applications={applications}
                onViewDetails={handleReviewClick}
                showScore={false}
                showStatus="university"
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    قبلی
                  </Button>
                  <span className="flex items-center px-4">
                    صفحه {currentPage} از {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    بعدی
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UniversityAdminApplicationsList;
