import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Filter, X, Search } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

interface ApplicationFiltersProps {
  faculties?: FilterOption[];
  departments?: FilterOption[];
  roundTypes?: FilterOption[];
  onFilterChange: (filters: ApplicationFilterValues) => void;
  initialFilters?: ApplicationFilterValues;
  showFacultyFilter?: boolean;
  showDepartmentFilter?: boolean;
  showRoundTypeFilter?: boolean;
  showScoreFilter?: boolean;
  showRankFilter?: boolean;
}

export interface ApplicationFilterValues {
  search?: string;
  faculty_id?: string;
  department_id?: string;
  round_type?: string;
  university_review_status?: string;
  faculty_review_completed?: string;
  rank_status?: string;
  min_score?: number;
  max_score?: number;
}

const AdvancedFilters = ({
  faculties = [],
  departments = [],
  roundTypes = [],
  onFilterChange,
  initialFilters = {},
  showFacultyFilter = true,
  showDepartmentFilter = true,
  showRoundTypeFilter = true,
  showScoreFilter = true,
  showRankFilter = true,
}: ApplicationFiltersProps) => {
  const [filters, setFilters] = useState<ApplicationFilterValues>(initialFilters);
  const [open, setOpen] = useState(false);

  const handleFilterChange = (key: keyof ApplicationFilterValues, value: string | number | boolean | string[]) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const applyFilters = () => {
    onFilterChange(filters);
    setOpen(false);
  };

  const resetFilters = () => {
    const emptyFilters: ApplicationFilterValues = {};
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined && v !== '').length;

  return (
    <div className="flex gap-2 items-center">
      {/* Quick Search */}
      <div className="flex-1 relative">
        <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="جستجو با کد ملی، نام، کد پیگیری..."
          value={filters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          className="pr-10"
        />
      </div>

      {/* Advanced Filters Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="gap-2 relative">
            <Filter className="h-4 w-4" />
            فیلترهای پیشرفته
            {activeFiltersCount > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -left-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>فیلترهای پیشرفته</SheetTitle>
            <SheetDescription>
              فیلترهای مورد نظر را اعمال کنید
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Round Type Filter */}
            {showRoundTypeFilter && roundTypes.length > 0 && (
              <div className="space-y-2">
                <Label>نوع فراخوان</Label>
                <Select value={filters.round_type || 'ALL'} onValueChange={(v) => handleFilterChange('round_type', v === 'ALL' ? undefined : v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">همه</SelectItem>
                    {roundTypes.map((rt) => (
                      <SelectItem key={rt.value} value={rt.value}>
                        {rt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Faculty Filter */}
            {showFacultyFilter && faculties.length > 0 && (
              <div className="space-y-2">
                <Label>دانشکده</Label>
                <Select value={filters.faculty_id || 'ALL'} onValueChange={(v) => handleFilterChange('faculty_id', v === 'ALL' ? undefined : v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">همه دانشکده‌ها</SelectItem>
                    {faculties.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Department Filter */}
            {showDepartmentFilter && departments.length > 0 && (
              <div className="space-y-2">
                <Label>گروه آموزشی</Label>
                <Select value={filters.department_id || 'ALL'} onValueChange={(v) => handleFilterChange('department_id', v === 'ALL' ? undefined : v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">همه گروه‌ها</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* University Review Status */}
            <div className="space-y-2">
              <Label>وضعیت بررسی دانشگاه</Label>
              <Select value={filters.university_review_status || 'ALL'} onValueChange={(v) => handleFilterChange('university_review_status', v === 'ALL' ? undefined : v)}>
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

            {/* Faculty Review Status */}
            <div className="space-y-2">
              <Label>وضعیت بررسی دانشکده</Label>
              <Select value={filters.faculty_review_completed || 'ALL'} onValueChange={(v) => handleFilterChange('faculty_review_completed', v === 'ALL' ? undefined : v)}>
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

            {/* Rank Status */}
            {showRankFilter && (
              <div className="space-y-2">
                <Label>وضعیت رتبه</Label>
                <Select value={filters.rank_status || 'ALL'} onValueChange={(v) => handleFilterChange('rank_status', v === 'ALL' ? undefined : v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">همه</SelectItem>
                    <SelectItem value="TOP_20">20% برتر</SelectItem>
                    <SelectItem value="NEXT_10">10% بعدی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Score Range */}
            {showScoreFilter && (
              <div className="space-y-4">
                <Label>بازه امتیاز</Label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="از"
                      value={filters.min_score || ''}
                      onChange={(e) => handleFilterChange('min_score', e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="تا"
                      value={filters.max_score || ''}
                      onChange={(e) => handleFilterChange('max_score', e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-8">
            <Button onClick={applyFilters} className="flex-1">
              اعمال فیلترها
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              <X className="h-4 w-4 ml-2" />
              پاک کردن
            </Button>
          </div>

          {/* Active Filters */}
          {activeFiltersCount > 0 && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">فیلترهای فعال:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => {
                  if (!value || value === '') return null;
                  return (
                    <Badge key={key} variant="secondary" className="gap-1">
                      {String(value)}
                      <button
                        onClick={() => handleFilterChange(key as keyof ApplicationFilterValues, undefined)}
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
        </SheetContent>
      </Sheet>

      {/* Apply Search */}
      <Button onClick={applyFilters}>
        <Search className="h-4 w-4 ml-2" />
        جستجو
      </Button>
    </div>
  );
};

export default AdvancedFilters;
