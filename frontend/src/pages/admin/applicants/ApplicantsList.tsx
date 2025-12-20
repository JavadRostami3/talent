import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Filter, RefreshCw, Folder, CheckSquare, Inbox, RotateCcw, Trash2, ListChecks, Star } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import ApplicationsTable from '@/components/features/ApplicationsTable';
import AdvancedFilterPanel, { ApplicationFilters } from '@/components/features/AdvancedFilterPanel';
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
  round: {
    id: number;
    title: string;
    round_type: RoundType;
    year: number;
  };
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

interface AdminProfile {
  faculties?: Array<{ id: number; name: string }>;
}

interface ApplicantsListProps {
  roundType: RoundType;
  title: string;
  description: string;
  showRankFilter?: boolean;
}

const ApplicantsList = ({ roundType, title, description, showRankFilter = false }: ApplicantsListProps) => {
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [faculties, setFaculties] = useState<{ id: number; name: string }[]>([]);
  const [universities, setUniversities] = useState<{ id: number; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: number; name: string; faculty_id: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<ApplicationFilters>({});
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>('all');
  const navigate = useNavigate();
  const { adminProfile } = useOutletContext<{ adminProfile: AdminProfile }>() || {};

  const fetchApplications = async (filters: ApplicationFilters = {}) => {
    setLoading(true);
    try {
      const params: any = { round_type: roundType };
      
      // Apply filters
      if (filters.search) params.search = filters.search;
      if (filters.faculty_id) params.faculty_id = filters.faculty_id;
      if (filters.university_id) params.university_id = filters.university_id;
      if (filters.rank_percentile_group) params.rank_percentile_group = filters.rank_percentile_group;
      if (filters.status) params.status = filters.status;
      if (filters.department_id) params.department_id = filters.department_id;

      // University admin list endpoint (paginated)
      const response = await api.get('/api/admin/university/applications/', { params });
      const data = response.data;
      const list = Array.isArray(data) ? data : data.results || [];
      setApplications(list as ApplicationListItem[]);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'دریافت لیست درخواست‌ها با خطا مواجه شد',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [roundType]);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [facResp, deptResp] = await Promise.all([
          api.get('/api/core/faculties/'),
          api.get('/api/core/departments/'),
        ]);
        // fetch universities for filtering
        const uniResp = await api.get('/api/core/universities/').catch(() => ({ data: [] }));
        const facData = Array.isArray(facResp.data) ? facResp.data : facResp.data?.results || [];
        const deptData = Array.isArray(deptResp.data) ? deptResp.data : deptResp.data?.results || [];
        const uniData = Array.isArray(uniResp.data) ? uniResp.data : uniResp.data?.results || [];
        setFaculties(facData);
        setDepartments(deptData);
        setUniversities(uniData);
      } catch (error) {
        setFaculties([]);
        setDepartments([]);
      }
    };
    loadMeta();
  }, []);

  const handleFilterChange = (filters: ApplicationFilters) => {
    setActiveQuickFilter('custom');
    setActiveFilters(filters);
    fetchApplications(filters);
  };

  const quickFilters = [
    { key: 'new', label: 'جدید', icon: Star, status: 'SUBMITTED' },
    { key: 'received', label: 'دریافت شده', icon: Inbox, status: 'UNDER_UNIVERSITY_REVIEW' },
    { key: 'reviewed', label: 'بررسی شده', icon: CheckSquare, status: 'APPROVED_BY_UNIVERSITY' },
    { key: 'returned', label: 'برگشت به داوطلب', icon: RotateCcw, status: 'RETURNED_FOR_CORRECTION' },
    { key: 'submitted', label: 'ارسال شده', icon: Folder, status: 'SUBMITTED' },
    { key: 'ineligible', label: 'فاقد شرایط', icon: ListChecks, status: 'INELIGIBLE' },
    { key: 'deleted', label: 'حذف شده', icon: Trash2, status: 'DELETED' },
    { key: 'all', label: 'تمام پرونده‌ها', icon: RefreshCw, status: '' },
  ];

  const handleQuickFilter = (filterKey: string, status?: string) => {
    setActiveQuickFilter(filterKey);
    const merged: ApplicationFilters = { ...activeFilters };
    if (status) {
      merged.status = status as any;
    } else {
      delete merged.status;
    }
    setActiveFilters(merged);
    fetchApplications(merged);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/talent/masters')}>
            پرونده‌های کارشناسی ارشد
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/talent/phd')}>
            پرونده‌های دکتری
          </Button>
        </div>
      </div>

      <div className="mb-4 p-4 border rounded-lg bg-muted/30">
        <p className="text-sm text-muted-foreground leading-6">
          پرونده‌های «دریافت شده» همان مواردی هستند که ارسال نهایی شده‌اند و باید توسط دانشکده بررسی شوند.
          «بررسی شده» شامل پرونده‌های تایید یا برگشت داده شده است. برای برگشت به داوطلب، وضعیت «برگشت به داوطلب» را انتخاب کنید.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
        {/* Sidebar quick filters */}
        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">دسته‌بندی پرونده‌ها</CardTitle>
            <CardDescription>فیلتر سریع بر اساس وضعیت</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickFilters.map((item) => {
              const Icon = item.icon;
              const isActive = activeQuickFilter === item.key;
              return (
                <Button
                  key={item.key}
                  variant={isActive ? 'default' : 'ghost'}
                  className="w-full justify-between"
                  onClick={() => handleQuickFilter(item.key, item.status)}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <Badge variant="secondary">فعال</Badge>}
                </Button>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <AdvancedFilterPanel
            faculties={faculties}
            departments={departments}
            universities={universities}
            onFilterChange={handleFilterChange}
            showFacultyFilter={true}
            showDepartmentFilter={true}
            showUniversityFilter={true}
            roundType={roundType}
          />

          <Card>
            <CardHeader>
              <CardTitle>لیست پرونده‌ها</CardTitle>
              <CardDescription>{applications.length} پرونده یافت شد</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
                  </div>
                </div>
              ) : applications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <Filter className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">درخواستی یافت نشد</h3>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <ApplicationsTable
                    applications={applications}
                    onViewDetails={(id) => navigate(`/admin/university/applications/${id}`)}
                    showScore={true}
                    showStatus="both"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ApplicantsList;
