import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, FileText, Clock, CheckCircle } from 'lucide-react';
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

interface Faculty {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
  faculty: number;
}

const FacultyAdminApplicationsList = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // فیلترها
  const [selectedRoundType, setSelectedRoundType] = useState<RoundType | 'ALL'>('ALL');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [reviewCompleted, setReviewCompleted] = useState<string>('false'); // false = در انتظار بررسی
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFaculties();
    fetchApplications();
  }, [selectedRoundType, selectedFaculty, selectedDepartment, reviewCompleted, searchQuery, currentPage]);

  useEffect(() => {
    // وقتی دانشکده عوض می‌شود، گروه‌های آموزشی آن را بارگذاری کن
    if (selectedFaculty !== 'ALL') {
      fetchDepartments(selectedFaculty);
    } else {
      setDepartments([]);
      setSelectedDepartment('ALL');
    }
  }, [selectedFaculty]);

  const fetchFaculties = async () => {
    try {
      const response = await api.get<Faculty[]>('/api/core/faculties/');
      setFaculties(response.data);
    } catch (error) {
      console.error('Error fetching faculties:', error);
    }
  };

  const fetchDepartments = async (facultyId: string) => {
    try {
      const response = await api.get<Department[]>(`/api/core/departments/`, {
        params: { faculty_id: facultyId },
      });
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

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
      if (selectedFaculty !== 'ALL') {
        params.faculty_id = selectedFaculty;
      }
      if (selectedDepartment !== 'ALL') {
        params.department_id = selectedDepartment;
      }
      if (reviewCompleted !== 'ALL') {
        params.faculty_review_completed = reviewCompleted;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await api.get<{
        results: ApplicationListItem[];
        count: number;
      }>('/api/admin/faculty/applications/', { params });

      setApplications(response.data.results);
      setTotalPages(Math.ceil(response.data.count / 20));
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = (applicationId: number) => {
    navigate(`/admin/faculty/applications/${applicationId}`);
  };

  const resetFilters = () => {
    setSelectedRoundType('ALL');
    setSelectedFaculty('ALL');
    setSelectedDepartment('ALL');
    setReviewCompleted('false');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const pendingCount = applications.filter((app) => !app.faculty_review_completed).length;
  const completedCount = applications.filter((app) => app.faculty_review_completed).length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">پنل مسئول دانشکده</h1>
        <p className="text-muted-foreground">بررسی و تصمیم‌گیری نهایی در مورد پذیرش دانشجویان</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              کل پرونده‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4" />
              در انتظار بررسی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              بررسی شده
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            فیلترها
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

            {/* Faculty Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">دانشکده</label>
              <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">همه</SelectItem>
                  {faculties.map((faculty) => (
                    <SelectItem key={faculty.id} value={faculty.id.toString()}>
                      {faculty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">گروه آموزشی</label>
              <Select
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
                disabled={selectedFaculty === 'ALL'}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">همه</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Review Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">وضعیت بررسی</label>
              <Select value={reviewCompleted} onValueChange={setReviewCompleted}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">همه</SelectItem>
                  <SelectItem value="false">در انتظار بررسی</SelectItem>
                  <SelectItem value="true">بررسی شده</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div>
              <label className="text-sm font-medium mb-2 block">جستجو</label>
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="کد ملی، نام..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9"
                />
              </div>
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

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>لیست پرونده‌ها</CardTitle>
          <CardDescription>{applications.length} پرونده یافت شد</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">در حال بارگذاری...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">پرونده‌ای یافت نشد</p>
            </div>
          ) : (
            <ApplicationsTable
              applications={applications}
              onViewDetails={handleReviewClick}
              showScore={true}
              showStatus="faculty"
            />
          )}

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
        </CardContent>
      </Card>
    </div>
  );
};

export default FacultyAdminApplicationsList;
