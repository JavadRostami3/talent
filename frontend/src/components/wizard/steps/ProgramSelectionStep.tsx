import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, Search, Plus, Trash2, GripVertical, CheckCircle2, AlertCircle } from 'lucide-react';
import applicationService from '@/services/applicationService';
import api from '@/services/api';
import type { Program, Choice, Faculty, DegreeLevel } from '@/types/models';

interface ProgramSelectionStepProps {
  applicationId: number;
  onComplete: () => void;
}

const ProgramSelectionStep = ({ applicationId, onComplete }: ProgramSelectionStepProps) => {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]);
  const [choices, setChoices] = useState<Choice[]>([]);

  // فیلترها
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<number | ''>('');
  const [selectedDegree, setSelectedDegree] = useState<DegreeLevel | ''>('');

  const MAX_CHOICES = 3;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedFaculty, selectedDegree, programs]);

  const fetchData = async () => {
    setFetchingData(true);
    try {
      // بارگذاری دانشکده‌ها
      const facResponse = await api.get('/api/core/faculties/');
      setFaculties(facResponse.data.results || facResponse.data);

      // بارگذاری برنامه‌ها
      const progResponse = await api.get('/api/programs/');
      setPrograms(progResponse.data.results || progResponse.data);

      // بارگذاری انتخاب‌های موجود
      const choicesData = await applicationService.getChoices(applicationId);
      setChoices(choicesData.sort((a, b) => a.priority - b.priority));
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری اطلاعات',
        variant: 'destructive',
      });
    } finally {
      setFetchingData(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...programs];

    // فیلتر جستجو (نام رشته یا دانشکده)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(term) ||
          p.code?.toLowerCase().includes(term) ||
          p.orientation?.toLowerCase().includes(term) ||
          (typeof p.department === 'object' && p.department.name.toLowerCase().includes(term)) ||
          (typeof p.faculty === 'object' && p.faculty.name.toLowerCase().includes(term))
      );
    }

    // فیلتر دانشکده
    if (selectedFaculty) {
      filtered = filtered.filter(p => {
        if (typeof p.faculty === 'number') {
          return p.faculty === selectedFaculty;
        }
        return p.faculty.id === selectedFaculty;
      });
    }

    // فیلتر مقطع
    if (selectedDegree) {
      filtered = filtered.filter(p => p.degree_level === selectedDegree);
    }

    // حذف برنامه‌های قبلاً انتخاب شده
    const selectedProgramIds = choices.map(c => c.program.id);
    filtered = filtered.filter(p => !selectedProgramIds.includes(p.id));

    setFilteredPrograms(filtered);
  };

  const handleAddChoice = async (program: Program) => {
    if (choices.length >= MAX_CHOICES) {
      toast({
        title: 'خطا',
        description: `حداکثر ${MAX_CHOICES} رشته می‌توانید انتخاب کنید`,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const priority = choices.length + 1;
      await applicationService.createChoice(applicationId, {
        program_id: program.id,
        priority,
      });

      toast({
        title: 'موفق',
        description: 'رشته به انتخاب‌های شما اضافه شد',
      });

      await fetchData();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در افزودن رشته',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveChoice = async (choiceId: number) => {
    if (!confirm('آیا از حذف این انتخاب اطمینان دارید؟')) return;

    setLoading(true);
    try {
      await applicationService.deleteChoice(applicationId, choiceId);

      toast({
        title: 'موفق',
        description: 'رشته از انتخاب‌های شما حذف شد',
      });

      await fetchData();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: 'خطا در حذف رشته',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReorderChoice = async (choiceId: number, newPriority: number) => {
    setLoading(true);
    try {
      await applicationService.updateChoice(applicationId, choiceId, newPriority);

      toast({
        title: 'موفق',
        description: 'ترتیب انتخاب‌ها به‌روزرسانی شد',
      });

      await fetchData();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: 'خطا در تغییر ترتیب',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    if (choices.length === 0) {
      toast({
        title: 'ناقص',
        description: 'لطفاً حداقل یک رشته انتخاب کنید',
        variant: 'destructive',
      });
      return;
    }

    onComplete();
  };

  const getDegreeLabel = (degree: DegreeLevel): string => {
    switch (degree) {
      case 'BSC': return 'کارشناسی';
      case 'MSC': return 'کارشناسی ارشد';
      case 'PHD': return 'دکتری';
    }
  };

  const getAdmissionStatusBadge = (status: string | null) => {
    if (!status) return null;

    const variants: Record<string, { label: string; color: string }> = {
      PENDING: { label: 'در حال بررسی', color: 'bg-yellow-100 text-yellow-800' },
      ACCEPTED: { label: 'پذیرفته شده', color: 'bg-green-100 text-green-800' },
      REJECTED: { label: 'رد شده', color: 'bg-red-100 text-red-800' },
      RESERVED: { label: 'رزرو', color: 'bg-blue-100 text-blue-800' },
    };

    const info = variants[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

    return (
      <Badge className={info.color}>
        {info.label}
      </Badge>
    );
  };

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* انتخاب‌های فعلی */}
      {choices.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">انتخاب‌های شما</h3>
          <div className="space-y-3">
            {choices.map((choice, index) => (
              <Card key={choice.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 mt-1">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {choice.priority}
                    </div>
                    <div className="flex flex-col gap-1">
                      {index > 0 && (
                        <button
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          onClick={() => handleReorderChoice(choice.id, choice.priority - 1)}
                          disabled={loading}
                          title="انتقال به بالا"
                        >
                          ▲
                        </button>
                      )}
                      {index < choices.length - 1 && (
                        <button
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          onClick={() => handleReorderChoice(choice.id, choice.priority + 1)}
                          disabled={loading}
                          title="انتقال به پایین"
                        >
                          ▼
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{choice.program.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {getDegreeLabel(choice.program.degree_level)}
                        </p>
                        {typeof choice.program.faculty === 'object' && (
                          <p className="text-xs text-muted-foreground">
                            دانشکده {choice.program.faculty.name}
                          </p>
                        )}
                        {typeof choice.program.department === 'object' && (
                          <p className="text-xs text-muted-foreground">
                            گروه {choice.program.department.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getAdmissionStatusBadge(choice.admission_status)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveChoice(choice.id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {choices.length < MAX_CHOICES && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                می‌توانید {MAX_CHOICES - choices.length} رشته دیگر انتخاب کنید
              </p>
            </div>
          )}
        </div>
      )}

      {/* جستجو و فیلترها */}
      {choices.length < MAX_CHOICES && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            {choices.length === 0 ? 'انتخاب رشته' : 'افزودن رشته جدید'}
          </h3>

          <Card className="p-4 space-y-4">
            {/* جستجو */}
            <div className="space-y-2">
              <Label>جستجو</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="نام رشته، دانشکده یا گروه آموزشی..."
                  className="pr-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* فیلتر دانشکده */}
              <div className="space-y-2">
                <Label>دانشکده</Label>
                <Select
                  value={selectedFaculty.toString()}
                  onValueChange={(value) => setSelectedFaculty(value ? parseInt(value) : '')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="همه دانشکده‌ها" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">همه دانشکده‌ها</SelectItem>
                    {faculties.map((fac) => (
                      <SelectItem key={fac.id} value={fac.id.toString()}>
                        {fac.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* فیلتر مقطع */}
              <div className="space-y-2">
                <Label>مقطع</Label>
                <Select
                  value={selectedDegree}
                  onValueChange={(value: DegreeLevel | '') => setSelectedDegree(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="همه مقاطع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">همه مقاطع</SelectItem>
                    <SelectItem value="BSC">کارشناسی</SelectItem>
                    <SelectItem value="MSC">کارشناسی ارشد</SelectItem>
                    <SelectItem value="PHD">دکتری</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* لیست رشته‌ها */}
          <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
            {filteredPrograms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {programs.length === 0
                  ? 'هیچ برنامه‌ای یافت نشد'
                  : 'نتیجه‌ای برای فیلترهای انتخابی یافت نشد'}
              </div>
            ) : (
              filteredPrograms.slice(0, 50).map(program => (
                <Card key={program.id} className="p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold">{program.name}</h4>
                      {program.orientation && (
                        <p className="text-sm text-muted-foreground">
                          {program.orientation}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {typeof program.faculty === 'object' ? program.faculty.name : '—'}
                        {typeof program.department === 'object' ? ` - ${program.department.name}` : ''}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{getDegreeLabel(program.degree_level)}</Badge>
                        {program.capacity && (
                          <Badge variant="outline">ظرفیت: {program.capacity}</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddChoice(program)}
                      disabled={loading}
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      انتخاب
                    </Button>
                  </div>
                </Card>
              ))
            )}
            {filteredPrograms.length > 50 && (
              <p className="text-sm text-center text-muted-foreground">
                {filteredPrograms.length - 50} رشته دیگر موجود است. لطفاً فیلترهای بیشتری اعمال کنید.
              </p>
            )}
          </div>
        </div>
      )}

      {/* راهنما */}
      <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
        <p className="text-sm text-amber-900 dark:text-amber-100">
          <strong>توجه:</strong>
        </p>
        <ul className="text-sm text-amber-900 dark:text-amber-100 list-disc list-inside mt-2 space-y-1">
          <li>حداکثر {MAX_CHOICES} رشته می‌توانید انتخاب کنید</li>
          <li>ترتیب انتخاب‌ها (اولویت) مهم است</li>
          <li>می‌توانید با استفاده از دکمه‌های ▲ و ▼ ترتیب را تغییر دهید</li>
          <li>پس از تکمیل ثبت‌نام، امکان تغییر انتخاب‌ها وجود ندارد</li>
        </ul>
      </div>

      {/* دکمه تکمیل */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleComplete} size="lg" disabled={loading}>
          {choices.length > 0 ? (
            <>
              <CheckCircle2 className="ml-2 h-5 w-5" />
              تکمیل ثبت‌نام
            </>
          ) : (
            <>
              <AlertCircle className="ml-2 h-5 w-5" />
              حداقل یک رشته انتخاب کنید
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProgramSelectionStep;
