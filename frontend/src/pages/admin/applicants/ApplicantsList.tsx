import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<ApplicationFilters>({});
  const navigate = useNavigate();
  const { adminProfile } = useOutletContext<{ adminProfile: AdminProfile }>() || {};

  const fetchApplications = async (filters: ApplicationFilters = {}) => {
    setLoading(true);
    try {
      const params: any = { round_type: roundType };
      
      // Apply filters
      if (filters.search) params.search = filters.search;
      if (filters.faculty_id) params.faculty_id = filters.faculty_id;
      if (filters.university_review_status) params.university_review_status = filters.university_review_status;
      if (filters.faculty_review_completed) params.faculty_review_completed = filters.faculty_review_completed;
      if (filters.rank_percentile_group) params.rank_percentile_group = filters.rank_percentile_group;
      if (filters.has_defect) params.has_defect = filters.has_defect;
      if (filters.status) params.status = filters.status;

      const response = await api.get<ApplicationListItem[]>('/api/core/applications/', { params });
      setApplications(response.data);
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

  const handleFilterChange = (filters: ApplicationFilters) => {
    setActiveFilters(filters);
    fetchApplications(filters);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-center text-3xl font-bold text-foreground mb-2">
          {title}
        </h1>
        <p className="text-center text-muted-foreground">
          {description}
        </p>
      </div>

      <AdvancedFilterPanel
        faculties={adminProfile?.faculties || []}
        onFilterChange={handleFilterChange}
        showFacultyFilter={true}
        showDepartmentFilter={false}
        showStatusFilters={true}
        roundType={roundType}
      />

      <Card className="mt-6">
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
            <ApplicationsTable
              applications={applications}
              onViewDetails={(id) => navigate(`/admin/applications/${id}`)}
              showScore={true}
              showStatus="both"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplicantsList;
