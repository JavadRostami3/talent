import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';

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
  universities?: { id: number; name: string }[];
  onFilterChange: (filters: ApplicationFilters) => void;
  showFacultyFilter?: boolean;
  showDepartmentFilter?: boolean;
  showUniversityFilter?: boolean;
  roundType?: string;
}

export interface ApplicationFilters {
  round_type?: string;
  faculty_id?: string;
  university_id?: string;
  department_id?: string;
  search?: string;
  rank_percentile_group?: string;
}

const AdvancedFilterPanel = ({
  faculties = [],
  departments = [],
  universities = [],
  onFilterChange,
  showFacultyFilter = true,
  showDepartmentFilter = true,
  showUniversityFilter = false,
  roundType,
}: FilterPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [filters, setFilters] = useState<ApplicationFilters>({
    round_type: roundType || 'ALL',
    faculty_id: 'ALL',
    university_id: 'ALL',
    department_id: 'ALL',
    search: '',
    rank_percentile_group: 'ALL',
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

    // Apply immediately (convert ALL to undefined)
    const apiFilters: ApplicationFilters = {};
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v && v !== 'ALL' && v !== '') {
        apiFilters[k as keyof ApplicationFilters] = v;
      }
    });
    onFilterChange(apiFilters);
  };

  const resetFilters = () => {
    const resetFilters: ApplicationFilters = {
      round_type: roundType || 'ALL',
      faculty_id: 'ALL',
      university_id: 'ALL',
      department_id: 'ALL',
      search: '',
      rank_percentile_group: 'ALL',
    };
    setFilters(resetFilters);
    setActiveFiltersCount(0);
    onFilterChange({});
  };

  const safeDepartments = Array.isArray(departments) ? departments : [];
  const filteredDepartments = safeDepartments.filter(
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
                className="pr-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {/* University Filter */}
            {showUniversityFilter && (
              <div>
                <Label>دانشگاه</Label>
                <Select
                  value={filters.university_id}
                  onValueChange={(value) => handleFilterChange('university_id', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">همه دانشگاه‌ها</SelectItem>
                    {Array.isArray(universities) && universities.length === 0 && (
                      <SelectItem value="__EMPTY" disabled>
                        دانشگاهی ثبت نشده
                      </SelectItem>
                    )}
                    {Array.isArray(universities) && universities.map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* Faculty Filter */}
            {showFacultyFilter && (
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
                    <SelectValue placeholder="انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">همه دانشکده‌ها</SelectItem>
                    {faculties.length === 0 && (
                      <SelectItem value="__EMPTY" disabled>
                        دانشکده‌ای ثبت نشده
                      </SelectItem>
                    )}
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
            {showDepartmentFilter && (
              <div>
                <Label>گروه آموزشی</Label>
                <Select
                  value={filters.department_id}
                  onValueChange={(value) => handleFilterChange('department_id', value)}
                  disabled={false}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">همه گروه‌ها</SelectItem>
                    {filteredDepartments.length === 0 && (
                      <SelectItem value="__EMPTY" disabled>
                        گروهی برای این دانشکده نیست
                      </SelectItem>
                    )}
                    {filteredDepartments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
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

          </div>

          {/* Reset Button */}
          <div className="flex justify-start pt-2">
            <button
              type="button"
              className="text-sm text-destructive hover:underline"
              onClick={resetFilters}
            >
              پاک کردن فیلترها
            </button>
          </div>

          {/* Active Filters Summary */}
          {activeFiltersCount > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">فیلترهای فعال:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => {
                  if (!value || value === 'ALL' || value === '') return null;
                  
                  let label = key;
                  let displayValue: string | number = value as string;
                  // show human-friendly names for ids
                  if (key === 'faculty_id') {
                    const f = faculties.find((ff) => ff.id.toString() === value);
                    if (f) displayValue = f.name;
                  }
                  if (key === 'department_id') {
                    const d = departments.find((dd) => dd.id.toString() === value);
                    if (d) displayValue = d.name;
                  }
                  if (key === 'university_id') {
                    // @ts-ignore
                    const u = (universities || []).find((uu) => uu.id.toString() === value);
                    if (u) displayValue = u.name;
                  }
                  
                  // Convert keys to Persian
                  const keyLabels: Record<string, string> = {
                    search: 'جستجو',
                    university_id: 'دانشگاه',
                    faculty_id: 'دانشکده',
                    department_id: 'گروه',
                    rank_percentile_group: 'رتبه',
                  };
                  
                  label = keyLabels[key] || key;
                  
                  return (
                    <Badge key={key} variant="secondary" className="gap-1">
                      {label}: {displayValue}
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
