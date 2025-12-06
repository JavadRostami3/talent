import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Award } from 'lucide-react';
import type { RoundType } from '@/types/models';

interface ApplicationTableItem {
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

interface ApplicationsTableProps {
  applications: ApplicationTableItem[];
  onViewDetails: (applicationId: number) => void;
  showScore?: boolean;
  showStatus?: 'university' | 'faculty' | 'both';
}

const ApplicationsTable = ({
  applications,
  onViewDetails,
  showScore = true,
  showStatus = 'both',
}: ApplicationsTableProps) => {
  const reviewStatusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    APPROVED: 'bg-green-100 text-green-800 border-green-300',
    APPROVED_WITH_DEFECT: 'bg-orange-100 text-orange-800 border-orange-300',
    REJECTED: 'bg-red-100 text-red-800 border-red-300',
  };

  const roundTypeLabels: Record<RoundType, string> = {
    MA_TALENT: 'استعداد ارشد',
    PHD_TALENT: 'استعداد دکتری',
    PHD_EXAM: 'آزمون دکتری',
    OLYMPIAD: 'المپیاد',
  };

  const rankStatusColors: Record<string, string> = {
    TOP_20: 'bg-blue-100 text-blue-800 border-blue-300',
    NEXT_10: 'bg-purple-100 text-purple-800 border-purple-300',
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-bold">ردیف</TableHead>
            <TableHead className="font-bold min-w-[200px]">مشخصات داوطلب</TableHead>
            <TableHead className="font-bold min-w-[180px]">دانشکده / گروه</TableHead>
            <TableHead className="font-bold min-w-[200px]">رشته انتخابی</TableHead>
            <TableHead className="font-bold min-w-[200px]">دانشگاه محل تحصیل</TableHead>
            <TableHead className="font-bold text-center">وضعیت رتبه</TableHead>
            {showScore && <TableHead className="font-bold text-center">امتیاز</TableHead>}
            {(showStatus === 'university' || showStatus === 'both') && (
              <TableHead className="font-bold text-center">وضعیت بررسی</TableHead>
            )}
            {showStatus === 'faculty' && (
              <TableHead className="font-bold text-center">وضعیت دانشکده</TableHead>
            )}
            <TableHead className="font-bold text-center">عملیات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showScore ? 9 : 8} className="text-center py-8 text-muted-foreground">
                پرونده‌ای یافت نشد
              </TableCell>
            </TableRow>
          ) : (
            applications.map((app, index) => (
              <TableRow key={app.id} className="hover:bg-muted/30">
                {/* ردیف */}
                <TableCell className="font-medium">{index + 1}</TableCell>

                {/* مشخصات داوطلب */}
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-semibold">{app.applicant.full_name}</div>
                    <div className="text-sm text-muted-foreground font-mono">
                      {app.applicant.national_id}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {roundTypeLabels[app.round.round_type]}
                    </Badge>
                  </div>
                </TableCell>

                {/* دانشکده/گروه */}
                <TableCell>
                  {app.faculty_department ? (
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{app.faculty_department.faculty_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {app.faculty_department.department_name}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>

                {/* رشته انتخابی */}
                <TableCell>
                  {app.selected_program ? (
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{app.selected_program.program_name}</div>
                      {app.selected_program.orientation && (
                        <div className="text-xs text-muted-foreground">
                          گرایش: {app.selected_program.orientation}
                        </div>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        اولویت {app.selected_program.priority}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>

                {/* دانشگاه + ضریب */}
                <TableCell>
                  {app.university_info ? (
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{app.university_info.university_name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">ضریب:</span>
                        <Badge variant="outline" className="text-xs">
                          {app.university_info.weight.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>

                {/* وضعیت رتبه */}
                <TableCell className="text-center">
                  {app.rank_status ? (
                    <Badge variant="outline" className={rankStatusColors[app.rank_status.group]}>
                      {app.rank_status.label}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>

                {/* امتیاز */}
                {showScore && (
                  <TableCell className="text-center">
                    {app.total_score > 0 ? (
                      <div className="flex items-center justify-center gap-1">
                        <Award className="h-4 w-4 text-yellow-600" />
                        <span className="font-bold text-yellow-700">{app.total_score.toFixed(2)}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                )}

                {/* وضعیت بررسی */}
                {(showStatus === 'university' || showStatus === 'both') && (
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={reviewStatusColors[app.university_review_status]}
                    >
                      {app.university_review_status_display}
                    </Badge>
                  </TableCell>
                )}

                {/* وضعیت دانشکده */}
                {showStatus === 'faculty' && (
                  <TableCell className="text-center">
                    {app.faculty_review_completed ? (
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        بررسی شده
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                        در انتظار
                      </Badge>
                    )}
                  </TableCell>
                )}

                {/* عملیات */}
                <TableCell className="text-center">
                  <Button size="sm" variant="outline" onClick={() => onViewDetails(app.id)}>
                    <Eye className="h-4 w-4 ml-1" />
                    مشاهده
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ApplicationsTable;
