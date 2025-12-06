import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

interface Faculty {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
  faculty_id: number;
}

interface FilterPanelProps {
  faculties?: Faculty[];
  departments?: Department[];
  onFilterChange: (filters: ApplicationFilters) => void;
  showFacultyFilter?: boolean;
  showDepartmentFilter?: boolean;
  showStatusFilters?: boolean;
  roundType?: string;
}

export interface ApplicationFilters {
  round_type?: string;
  faculty_id?: string;
  department_id?: string;
  university_review_status?: string;
  faculty_review_completed?: string;
  status?: string;
  search?: string;
  rank_percentile_group?: string;
  has_defect?: string;
}

const AdvancedFilterPanel = ({
  faculties = [],
  departments = [],
  onFilterChange,
  showFacultyFilter = true,
  showDepartmentFilter = true,
  showStatusFilters = true,
  roundType,
}: FilterPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [filters, setFilters] = useState<ApplicationFilters>({
    round_type: roundType || 'ALL',
    faculty_id: 'ALL',
    department_id: 'ALL',
    university_review_status: 'ALL',
    faculty_review_completed: 'ALL',
    status: 'ALL',
    search: '',
    rank_percentile_group: 'ALL',
    has_defect: 'ALL',
  });

  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const handleFilterChange = (key: keyof ApplicationFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Count active filters
    const count = Object.entries(newFilters).filter(
      ([k, v]) => v && v !== 'ALL' && v !== ''
    ).length;
    setActiveFiltersCount(count);
  };

  const applyFilters = () => {
    // Convert 'ALL' to undefined for API
    const apiFilters: ApplicationFilters = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'ALL' && value !== '') {
        apiFilters[key as keyof ApplicationFilters] = value;
      }
    });
    onFilterChange(apiFilters);
  };

  const resetFilters = () => {
    const resetFilters: ApplicationFilters = {
      round_type: roundType || 'ALL',
      faculty_id: 'ALL',
      department_id: 'ALL',
      university_review_status: 'ALL',
      faculty_review_completed: 'ALL',
      status: 'ALL',
      search: '',
      rank_percentile_group: 'ALL',
      has_defect: 'ALL',
    };
    setFilters(resetFilters);
    setActiveFiltersCount(0);
    onFilterChange({});
  };

  const filteredDepartments = departments.filter(
    (dept) => filters.faculty_id === 'ALL' || dept.faculty_id.toString() === filters.faculty_id
  );

  return (
    <Card>
      <CardHeader 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle>فیلترهای پیشرفته</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount} فیلتر فعال</Badge>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Search */}
          <div>
            <Label htmlFor="search">جستجو</Label>
            <div className="relative mt-2">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="کد ملی، نام، نام خانوادگی، کد پیگیری..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                className="pr-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Faculty Filter */}
            {showFacultyFilter && faculties.length > 0 && (
              <div>
                <Label>دانشکده</Label>
                <Select
                  value={filters.faculty_id}
                  onValueChange={(value) => {
                    handleFilterChange('faculty_id', value);
                    // Reset department when faculty changes
                    if (value !== filters.faculty_id) {
                      handleFilterChange('department_id', 'ALL');
                    }
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">همه دانشکده‌ها</SelectItem>
                    {faculties.map((faculty) => (
                      <SelectItem key={faculty.id} value={faculty.id.toString()}>
                        {faculty.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Department Filter */}
            {showDepartmentFilter && departments.length > 0 && (
              <div>
                <Label>گروه آموزشی</Label>
                <Select
                  value={filters.department_id}
                  onValueChange={(value) => handleFilterChange('department_id', value)}
                  disabled={filters.faculty_id === 'ALL'}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">همه گروه‌ها</SelectItem>
                    {filteredDepartments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* University Review Status */}
            {showStatusFilters && (
              <div>
                <Label>وضعیت بررسی دانشگاه</Label>
                <Select
                  value={filters.university_review_status}
                  onValueChange={(value) => handleFilterChange('university_review_status', value)}
                >
                  <SelectTrigger className="mt-2">
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
            )}

            {/* Faculty Review Status */}
            {showStatusFilters && (
              <div>
                <Label>وضعیت بررسی دانشکده</Label>
                <Select
                  value={filters.faculty_review_completed}
                  onValueChange={(value) => handleFilterChange('faculty_review_completed', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">همه</SelectItem>
                    <SelectItem value="false">در انتظار بررسی</SelectItem>
                    <SelectItem value="true">بررسی شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Rank Percentile Group */}
            <div>
              <Label>وضعیت رتبه</Label>
              <Select
                value={filters.rank_percentile_group}
                onValueChange={(value) => handleFilterChange('rank_percentile_group', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">همه</SelectItem>
                  <SelectItem value="TOP_20">20% برتر</SelectItem>
                  <SelectItem value="NEXT_10">10% بعدی</SelectItem>
                  <SelectItem value="NONE">بدون رتبه</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Has Defect */}
            <div>
              <Label>وضعیت نقص</Label>
              <Select
                value={filters.has_defect}
                onValueChange={(value) => handleFilterChange('has_defect', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">همه</SelectItem>
                  <SelectItem value="true">دارای نقص</SelectItem>
                  <SelectItem value="false">بدون نقص</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={applyFilters} className="flex-1">
              <Search className="ml-2 h-4 w-4" />
              اعمال فیلترها
            </Button>
            <Button onClick={resetFilters} variant="outline">
              <X className="ml-2 h-4 w-4" />
              پاک کردن
            </Button>
          </div>

          {/* Active Filters Summary */}
          {activeFiltersCount > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">فیلترهای فعال:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => {
                  if (!value || value === 'ALL' || value === '') return null;
                  
                  let label = key;
                  const displayValue = value;
                  
                  // Convert keys to Persian
                  const keyLabels: Record<string, string> = {
                    search: 'جستجو',
                    faculty_id: 'دانشکده',
                    department_id: 'گروه',
                    university_review_status: 'وضعیت دانشگاه',
                    faculty_review_completed: 'وضعیت دانشکده',
                    rank_percentile_group: 'رتبه',
                    has_defect: 'نقص',
                  };
                  
                  label = keyLabels[key] || key;
                  
                  return (
                    <Badge key={key} variant="secondary" className="gap-1">
                      {label}: {displayValue}
                      <button
                        onClick={() => handleFilterChange(key as keyof ApplicationFilters, 'ALL')}
                        className="hover:bg-destructive/20 rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default AdvancedFilterPanel;
