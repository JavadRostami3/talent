import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { GraduationCap, Save, Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/services/api';

interface University {
  id: number;
  name: string;
  code: string;
}

interface EducationRecord {
  degree_level: 'BSC' | 'MSC' | 'PHD';
  status: 'STUDYING' | 'GRADUATED';
  university: number;
  field_of_study: string;
  gpa?: number;
  start_month?: number;
  start_year?: number;
  graduation_month?: number;
  graduation_year?: number;
  total_units_passed?: number;
  semester_count?: number;
  class_size?: number;
  rank_status?: string;
}

const EducationInfo = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roundType, setRoundType] = useState<string>('');
  const [universities, setUniversities] = useState<University[]>([]);
  const [openBachelorUniv, setOpenBachelorUniv] = useState(false);
  const [openMastersUniv, setOpenMastersUniv] = useState(false);
  
  const [bachelorData, setBachelorData] = useState<EducationRecord>({
    degree_level: 'BSC',
    status: 'GRADUATED',
    university: 0,
    field_of_study: '',
    gpa: undefined,
    start_month: undefined,
    start_year: undefined,
    graduation_month: undefined,
    graduation_year: undefined,
  });

  const [mastersData, setMastersData] = useState<EducationRecord>({
    degree_level: 'MSC',
    status: 'GRADUATED',
    university: 0,
    field_of_study: '',
    gpa: undefined,
    start_month: undefined,
    start_year: undefined,
    graduation_month: undefined,
    graduation_year: undefined,
    total_units_passed: undefined,
    semester_count: undefined,
    class_size: undefined,
    rank_status: '',
  });

  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      const [appResponse, univResponse] = await Promise.all([
        api.get('/api/applications/'),
        api.get('/api/public/universities/'),
      ]);
      
      const applications = Array.isArray(appResponse.data) ? appResponse.data : appResponse.data.results || [];
      const application = applications[0];
      if (!application) {
        throw new Error('Application not found');
      }
      setRoundType(application.round_type);
      setUniversities(univResponse.data);
      
      if (application.education_records && application.education_records.length > 0) {
        const bachelor = application.education_records.find((r: EducationRecord) => r.degree_level === 'BSC');
        const masters = application.education_records.find((r: EducationRecord) => r.degree_level === 'MSC');
        
        if (bachelor) {
          setBachelorData({
            ...bachelorData,
            status: bachelor.status || 'GRADUATED',
            university: bachelor.university?.id || 0,
            field_of_study: bachelor.field_of_study || '',
            gpa: bachelor.gpa || undefined,
            start_month: bachelor.start_month || undefined,
            start_year: bachelor.start_year || undefined,
            graduation_month: bachelor.graduation_month || undefined,
            graduation_year: bachelor.graduation_year || undefined,
          });
        }
        
        if (masters) {
          setMastersData({
            ...mastersData,
            status: masters.status || 'GRADUATED',
            university: masters.university?.id || 0,
            field_of_study: masters.field_of_study || '',
            gpa: masters.gpa || undefined,
            start_month: masters.start_month || undefined,
            start_year: masters.start_year || undefined,
            graduation_month: masters.graduation_month || undefined,
            graduation_year: masters.graduation_year || undefined,
            total_units_passed: masters.total_units_passed || undefined,
            semester_count: masters.semester_count || undefined,
            class_size: masters.class_size || undefined,
            rank_status: masters.rank_status || '',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'خطا',
        description: 'دریافت اطلاعات با خطا مواجه شد',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getUniversityName = (id: number) => {
    const univ = universities.find(u => u.id === id);
    return univ ? univ.name : 'انتخاب دانشگاه...';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bachelorData.university || !bachelorData.field_of_study) {
      toast({
        title: 'خطا',
        description: 'لطفاً اطلاعات کارشناسی را کامل کنید',
        variant: 'destructive',
      });
      return;
    }
    
    if (roundType === 'PHD_TALENT' && (!mastersData.university || !mastersData.field_of_study)) {
      toast({
        title: 'خطا',
        description: 'برای دکتری، تکمیل اطلاعات کارشناسی ارشد الزامی است',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setSaving(true);
      
      const appResponse = await api.get('/api/applications/');
      const applications = Array.isArray(appResponse.data) ? appResponse.data : appResponse.data.results || [];
      const applicationId = applications[0]?.id;
      
      if (!applicationId) {
        throw new Error('Application not found');
      }

      const educationRecords = [bachelorData];
      
      if (roundType === 'PHD_TALENT' || mastersData.university > 0) {
        educationRecords.push(mastersData);
      }

      await api.post(`/api/applications/${applicationId}/education-records/`, educationRecords);

      toast({
        title: 'موفق',
        description: 'اطلاعات تحصیلی با موفقیت ذخیره شد',
      });
      
      navigate('..');
    } catch (error: unknown) {
      console.error('Error saving:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'ذخیره با خطا مواجه شد'
        : 'ذخیره با خطا مواجه شد';
      toast({
        title: 'خطا',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const isPhdTalent = roundType === 'PHD_TALENT';
  const isMaTalent = roundType === 'MA_TALENT';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <GraduationCap className="h-8 w-8 text-primary" />
          اطلاعات تحصیلی
        </h1>
        <p className="text-muted-foreground mt-2">
          لطفاً اطلاعات تحصیلی خود را با دقت تکمیل نمایید
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* مقطع کارشناسی */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>مقطع کارشناسی</CardTitle>
            <CardDescription>اطلاعات دوره کارشناسی خود را وارد نمایید</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>وضعیت تحصیل *</Label>
                <Select
                  value={bachelorData.status}
                  onValueChange={(value: 'STUDYING' | 'GRADUATED') => 
                    setBachelorData({ ...bachelorData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDYING">در حال تحصیل</SelectItem>
                    <SelectItem value="GRADUATED">فارغ‌التحصیل</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>دانشگاه *</Label>
                <Popover open={openBachelorUniv} onOpenChange={setOpenBachelorUniv}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        'w-full justify-between',
                        !bachelorData.university && 'text-muted-foreground'
                      )}
                    >
                      {getUniversityName(bachelorData.university)}
                      <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="جستجوی دانشگاه..." />
                      <CommandEmpty>دانشگاهی یافت نشد</CommandEmpty>
                      <CommandGroup className="max-h-[200px] overflow-auto">
                        {universities.map((univ) => (
                          <CommandItem
                            key={univ.id}
                            value={univ.name}
                            onSelect={() => {
                              setBachelorData({ ...bachelorData, university: univ.id });
                              setOpenBachelorUniv(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'ml-2 h-4 w-4',
                                bachelorData.university === univ.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {univ.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>رشته تحصیلی *</Label>
                <Input
                  required
                  value={bachelorData.field_of_study}
                  onChange={(e) => setBachelorData({ ...bachelorData, field_of_study: e.target.value })}
                  placeholder="مثال: مهندسی کامپیوتر"
                />
              </div>

              <div className="space-y-2">
                <Label>معدل کل (از 20)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="20"
                  value={bachelorData.gpa || ''}
                  onChange={(e) => setBachelorData({ ...bachelorData, gpa: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="مثال: 17.50"
                />
              </div>

              <div className="space-y-2">
                <Label>ماه شروع دوره</Label>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={bachelorData.start_month || ''}
                  onChange={(e) => setBachelorData({ ...bachelorData, start_month: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="عدد بین 1 تا 12"
                />
              </div>

              <div className="space-y-2">
                <Label>سال شروع دوره (شمسی)</Label>
                <Input
                  type="number"
                  min="1350"
                  max="1405"
                  value={bachelorData.start_year || ''}
                  onChange={(e) => setBachelorData({ ...bachelorData, start_year: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="مثال: 1398"
                />
              </div>

              {bachelorData.status === 'GRADUATED' && (
                <>
                  <div className="space-y-2">
                    <Label>ماه فارغ‌التحصیلی</Label>
                    <Input
                      type="number"
                      min="1"
                      max="12"
                      value={bachelorData.graduation_month || ''}
                      onChange={(e) => setBachelorData({ ...bachelorData, graduation_month: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="عدد بین 1 تا 12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>سال فارغ‌التحصیلی (شمسی)</Label>
                    <Input
                      type="number"
                      min="1350"
                      max="1405"
                      value={bachelorData.graduation_year || ''}
                      onChange={(e) => setBachelorData({ ...bachelorData, graduation_year: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="مثال: 1402"
                    />
                  </div>
                </>
              )}
              
              {bachelorData.status === 'STUDYING' && isMaTalent && (
                <>
                  <div className="space-y-2">
                    <Label>تعداد واحد گذرانده (تا پایان نیمسال 6)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={bachelorData.total_units_passed || ''}
                      onChange={(e) => setBachelorData({ ...bachelorData, total_units_passed: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="مثال: 110"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>تعداد نیمسال گذرانده</Label>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={bachelorData.semester_count || ''}
                      onChange={(e) => setBachelorData({ ...bachelorData, semester_count: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="مثال: 6"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>تعداد دانشجو دوره</Label>
                    <Input
                      type="number"
                      min="1"
                      value={bachelorData.class_size || ''}
                      onChange={(e) => setBachelorData({ ...bachelorData, class_size: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="مثال: 30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>وضعیت رتبه</Label>
                    <Input
                      value={bachelorData.rank_status || ''}
                      onChange={(e) => setBachelorData({ ...bachelorData, rank_status: e.target.value })}
                      placeholder="مثال: رتبه 2 از 30 (دهمه اصلی)"
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* مقطع کارشناسی ارشد */}
        {(isPhdTalent || mastersData.university > 0) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                مقطع کارشناسی ارشد
                {isPhdTalent && <span className="text-red-500 mr-1">*</span>}
              </CardTitle>
              <CardDescription>
                {isPhdTalent ? 'برای دکتری الزامی است' : 'در صورتی که دارای مدرک ارشد هستید'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>وضعیت تحصیل {isPhdTalent && '*'}</Label>
                  <Select
                    value={mastersData.status}
                    onValueChange={(value: 'STUDYING' | 'GRADUATED') => 
                      setMastersData({ ...mastersData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDYING">در حال تحصیل</SelectItem>
                      <SelectItem value="GRADUATED">فارغ‌التحصیل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>دانشگاه {isPhdTalent && '*'}</Label>
                  <Popover open={openMastersUniv} onOpenChange={setOpenMastersUniv}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          'w-full justify-between',
                          !mastersData.university && 'text-muted-foreground'
                        )}
                      >
                        {getUniversityName(mastersData.university)}
                        <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="جستجوی دانشگاه..." />
                        <CommandEmpty>دانشگاهی یافت نشد</CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-auto">
                          {universities.map((univ) => (
                            <CommandItem
                              key={univ.id}
                              value={univ.name}
                              onSelect={() => {
                                setMastersData({ ...mastersData, university: univ.id });
                                setOpenMastersUniv(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'ml-2 h-4 w-4',
                                  mastersData.university === univ.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              {univ.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>رشته تحصیلی {isPhdTalent && '*'}</Label>
                  <Input
                    required={isPhdTalent}
                    value={mastersData.field_of_study}
                    onChange={(e) => setMastersData({ ...mastersData, field_of_study: e.target.value })}
                    placeholder="مثال: هوش مصنوعی"
                  />
                </div>

                <div className="space-y-2">
                  <Label>معدل کل (از 20)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="20"
                    value={mastersData.gpa || ''}
                    onChange={(e) => setMastersData({ ...mastersData, gpa: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="مثال: 18.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>ماه شروع دوره</Label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={mastersData.start_month || ''}
                    onChange={(e) => setMastersData({ ...mastersData, start_month: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="عدد بین 1 تا 12"
                  />
                </div>

                <div className="space-y-2">
                  <Label>سال شروع دوره (شمسی)</Label>
                  <Input
                    type="number"
                    min="1350"
                    max="1405"
                    value={mastersData.start_year || ''}
                    onChange={(e) => setMastersData({ ...mastersData, start_year: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="مثال: 1400"
                  />
                </div>

                {mastersData.status === 'GRADUATED' && (
                  <>
                    <div className="space-y-2">
                      <Label>ماه فارغ‌التحصیلی</Label>
                      <Input
                        type="number"
                        min="1"
                        max="12"
                        value={mastersData.graduation_month || ''}
                        onChange={(e) => setMastersData({ ...mastersData, graduation_month: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="عدد بین 1 تا 12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>سال فارغ‌التحصیلی (شمسی)</Label>
                      <Input
                        type="number"
                        min="1350"
                        max="1405"
                        value={mastersData.graduation_year || ''}
                        onChange={(e) => setMastersData({ ...mastersData, graduation_year: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="مثال: 1403"
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('..')}
            disabled={saving}
          >
            انصراف
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                در حال ذخیره...
              </>
            ) : (
              <>
                <Save className="ml-2 h-4 w-4" />
                ذخیره اطلاعات
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EducationInfo;
