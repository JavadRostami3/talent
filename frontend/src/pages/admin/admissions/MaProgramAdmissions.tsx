import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// Define types for the data
interface Applicant {
  id: number;
  first_name: string;
  last_name: string;
  national_id: string;
  email: string;
  mobile: string;
}

interface TopChoice {
  priority: number;
  program_name: string;
  orientation: string;
}

interface Candidate {
  application_id: number;
  tracking_code: string;
  applicant: Applicant;
  bsc_gpa: number | null;
  education_score: number | null;
  total_score: number | null;
  choice_priority: number;
  choice_id?: number;
  choice_admission_status: string;
  top_three_choices: TopChoice[];
}

interface Program {
  program_id: number;
  program_name: string;
  program_code: string;
  orientation: string;
  faculty: { id: number; name: string };
  department: { id: number; name: string };
  capacity: number;
  prelim_accepted: Candidate[];
  prelim_waiting: Candidate[];
  candidates_count: number;
}

interface ApiResponse {
  round: { id: number; title: string };
  programs: Program[];
}

const MaProgramAdmissions: React.FC = () => {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/admin/ma/program-admissions/');
        setData(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const { toast } = useToast();

  const runAdmissions = async () => {
    try {
      setLoading(true);
      await api.post('/api/admin/ma/run-admissions/');
      toast({ title: 'موفق', description: 'اجرای پذیرش نهایی با موفقیت انجام شد' });
      const response = await api.get('/api/admin/ma/program-admissions/');
      setData(response.data);
    } catch (err: any) {
      toast({ title: 'خطا', description: 'اجرای پذیرش نهایی ناموفق بود' } as any);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalAcceptance = (applicationId: number, programId: number) => {
    console.log(`Final acceptance for application ${applicationId} in program ${programId}`);
    // kept for backward compatibility
  };

  const acceptChoice = async (choiceId?: number) => {
    if (!choiceId) return;
    try {
      setLoading(true);
      await api.post(`/api/admin/ma/choice/${choiceId}/accept/`);
      toast({ title: 'موفق', description: 'پذیرش ثبت شد' });
      const response = await api.get('/api/admin/ma/program-admissions/');
      setData(response.data);
    } catch (err: any) {
      toast({ title: 'خطا', description: 'ثبت پذیرش ناموفق بود' } as any);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (!data) {
    return <div className="p-4">No data available.</div>;
  }

  const renderCandidateRow = (candidate: Candidate, programId: number) => (
    <TableRow key={candidate.application_id}>
      <TableCell>
        <div className="font-medium">{`${candidate.applicant.first_name} ${candidate.applicant.last_name}`}</div>
        <div className="text-sm text-muted-foreground">{candidate.applicant.national_id}</div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {candidate.education_score !== undefined && candidate.education_score !== null
            ? `امتیاز تحصیلی: ${candidate.education_score.toFixed(2)}`
            : 'اطلاعات تحصیلی موجود نیست'}
        </div>
      </TableCell>
      <TableCell>{candidate.bsc_gpa?.toFixed(2) ?? 'N/A'}</TableCell>
      <TableCell>{candidate.total_score?.toFixed(2) ?? 'N/A'}</TableCell>
      <TableCell>
        <div>
          {candidate.top_three_choices.map(choice => (
            <div key={choice.priority}>
              {choice.priority}. {choice.program_name} ({choice.orientation})
            </div>
          ))}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={
          candidate.choice_admission_status === 'ACCEPTED' ? 'default' :
          candidate.choice_admission_status === 'WAITING' ? 'secondary' :
          'outline'
        }>
          {candidate.choice_admission_status}
        </Badge>
      </TableCell>
      <TableCell>
        <Button 
          size="sm" 
          onClick={() => acceptChoice((candidate as any).choice_id)}
          disabled={candidate.choice_admission_status === 'ACCEPTED'}
        >
          {candidate.choice_admission_status === 'ACCEPTED' ? 'Accepted' : 'Accept'}
        </Button>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>پذیرش نهایی کارشناسی ارشد - {data.round.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {data.programs.map(program => (
              <AccordionItem key={program.program_id} value={`program-${program.program_id}`}>
                <AccordionTrigger>
                  <div className="flex justify-between w-full pr-4">
                    <span>{program.program_name} ({program.orientation})</span>
                    <Badge>{`ظرفیت: ${program.capacity}`}</Badge>
                    <Badge variant="secondary">{`متقاضیان: ${program.candidates_count}`}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <h4 className="font-semibold mb-2">لیست پذیرفته شدگان اولیه</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>مشخصات کاربر</TableHead>
                        <TableHead>سوابق تحصیلی</TableHead>
                        <TableHead>معدل</TableHead>
                        <TableHead>امتیاز کل</TableHead>
                        <TableHead>اولویت‌های انتخابی</TableHead>
                        <TableHead>وضعیت</TableHead>
                        <TableHead>عملیات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {program.prelim_accepted.length > 0 ? (
                        program.prelim_accepted.map(c => renderCandidateRow(c, program.program_id))
                      ) : (
                        <TableRow><TableCell colSpan={7} className="text-center">هیچ متقاضی پذیرفته شده‌ای وجود ندارد.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>

                  {program.prelim_waiting.length > 0 && (
                    <>
                      <h4 className="font-semibold mt-6 mb-2">لیست انتظار</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                              <TableHead>مشخصات کاربر</TableHead>
                              <TableHead>سوابق تحصیلی</TableHead>
                              <TableHead>معدل</TableHead>
                              <TableHead>امتیاز کل</TableHead>
                              <TableHead>اولویت‌های انتخابی</TableHead>
                              <TableHead>وضعیت</TableHead>
                              <TableHead>عملیات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {program.prelim_waiting.map(c => renderCandidateRow(c, program.program_id))}
                        </TableBody>
                      </Table>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaProgramAdmissions;