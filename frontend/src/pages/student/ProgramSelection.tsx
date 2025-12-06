import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { GraduationCap, Save, Loader2, Check, ChevronsUpDown, X, Building2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/services/api';

interface Faculty {
  id: number;
  name: string;
  code: string;
}

interface Department {
  id: number;
  name: string;
  code: string;
  faculty: number;
  faculty_name: string;
}

interface Program {
  id: number;
  name: string;
  code: string;
  orientation: string;
  degree_level: string;
  degree_level_display: string;
  faculty: Faculty;
  department: Department;
  capacity: number;
}

interface ApplicationChoice {
  id?: number;
  program_id: number;
  priority: number;
  program?: Program;
}

const ProgramSelection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [roundType, setRoundType] = useState<string>('');
  
  // Data
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]);
  
  // Filters
  const [selectedFaculty, setSelectedFaculty] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected programs
  const [choices, setChoices] = useState<ApplicationChoice[]>([
    { program_id: 0, priority: 1 },
    { program_id: 0, priority: 2 },
    { program_id: 0, priority: 3 },
  ]);
  
  // Popover states
  const [openPopovers, setOpenPopovers] = useState([false, false, false]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    filterPrograms();
  }, [programs, selectedFaculty, selectedDepartment, searchQuery]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Get application
      const appResponse = await api.get('/api/applications/');
      const application = appResponse.data.results[0];
      setApplicationId(application.id);
      setRoundType(application.round_type);
      
      // Get existing choices
      if (application.choices && application.choices.length > 0) {
        const existingChoices = application.choices.map((c: any) => ({
          id: c.id,
          program_id: c.program.id,
          priority: c.priority,
          program: c.program,
        }));
        
        // Fill remaining slots
        while (existingChoices.length < 3) {
          existingChoices.push({
            program_id: 0,
            priority: existingChoices.length + 1,
          });
        }
        
        setChoices(existingChoices);
      }
      
      // Fetch faculties, departments, programs
      const [facultiesRes, departmentsRes, programsRes] = await Promise.all([
        api.get('/api/core/faculties/'),
        api.get('/api/core/departments/'),
        api.get('/api/programs/', {
          params: { round_type: application.round_type }
        }),
      ]);
      
      setFaculties(facultiesRes.data.results || facultiesRes.data);
      setDepartments(departmentsRes.data.results || departmentsRes.data);
      setPrograms(programsRes.data);
      setFilteredPrograms(programsRes.data);
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

  const filterPrograms = () => {
    let filtered = [...programs];
    
    if (selectedFaculty) {
      filtered = filtered.filter(p => p.faculty.id.toString() === selectedFaculty);
    }
    
    if (selectedDepartment) {
      filtered = filtered.filter(p => p.department.id.toString() === selectedDepartment);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.orientation?.toLowerCase().includes(query) ||
        p.code.toLowerCase().includes(query)
      );
    }
    
    setFilteredPrograms(filtered);
  };

  const handleProgramSelect = (index: number, programId: number) => {
    const newChoices = [...choices];
    const program = programs.find(p => p.id === programId);
    
    newChoices[index] = {
      ...newChoices[index],
      program_id: programId,
      program: program,
    };
    
    setChoices(newChoices);
    
    // Close popover
    const newOpenPopovers = [...openPopovers];
    newOpenPopovers[index] = false;
    setOpenPopovers(newOpenPopovers);
  };

  const handleRemoveChoice = (index: number) => {
    const newChoices = [...choices];
    newChoices[index] = {
      program_id: 0,
      priority: index + 1,
    };
    setChoices(newChoices);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate at least one choice
    const validChoices = choices.filter(c => c.program_id > 0);
    if (validChoices.length === 0) {
      toast({
        title: 'خطا',
        description: 'لطفاً حداقل یک رشته انتخاب کنید',
        variant: 'destructive',
      });
      return;
    }
    
    // Check for duplicates
    const programIds = validChoices.map(c => c.program_id);
    const uniqueIds = new Set(programIds);
    if (programIds.length !== uniqueIds.size) {
      toast({
        title: 'خطا',
        description: 'نمی‌توانید یک رشته را چند بار انتخاب کنید',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setSaving(true);
      
      await api.post(`/api/applications/${applicationId}/choices/`, {
        choices: validChoices.map((c, idx) => ({
          program_id: c.program_id,
          priority: idx + 1,
        })),
      });
      
      toast({
        title: 'موفق',
        description: 'انتخاب رشته با موفقیت ذخیره شد',
      });
      
      navigate('/student');
    } catch (error: any) {
      console.error('Error saving choices:', error);
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'ذخیره انتخاب با خطا مواجه شد',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const availableDepartments = departments.filter(
    d => !selectedFaculty || d.faculty.toString() === selectedFaculty
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <GraduationCap className="h-8 w-8 text-primary" />
          انتخاب رشته
        </h1>
        <p className="text-muted-foreground mt-2">
          حداکثر 3 رشته با اولویت‌بندی انتخاب کنید
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>فیلتر رشته‌ها</CardTitle>
            <CardDescription>
              برای جستجوی بهتر از فیلترها استفاده کنید
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>دانشکده</Label>
                <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                  <SelectTrigger>
                    <SelectValue placeholder="همه دانشکده‌ها" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه دانشکده‌ها</SelectItem>
                    {faculties.map((f) => (
                      <SelectItem key={f.id} value={f.id.toString()}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>گروه آموزشی</Label>
                <Select 
                  value={selectedDepartment} 
                  onValueChange={setSelectedDepartment}
                  disabled={!selectedFaculty}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="همه گروه‌ها" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه گروه‌ها</SelectItem>
                    {availableDepartments.map((d) => (
                      <SelectItem key={d.id} value={d.id.toString()}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>جستجو</Label>
                <Input
                  placeholder="نام رشته یا کد..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="mt-4 text-sm text-muted-foreground">
              {filteredPrograms.length} رشته یافت شد
            </div>
          </CardContent>
        </Card>

        {/* Program Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>انتخاب رشته‌ها</CardTitle>
            <CardDescription>
              رشته‌های خود را به ترتیب اولویت انتخاب کنید
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {choices.map((choice, index) => (
              <div key={index} className="space-y-2">
                <Label>اولویت {index + 1}</Label>
                <div className="flex gap-2">
                  <Popover 
                    open={openPopovers[index]} 
                    onOpenChange={(open) => {
                      const newOpenPopovers = [...openPopovers];
                      newOpenPopovers[index] = open;
                      setOpenPopovers(newOpenPopovers);
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          'flex-1 justify-between',
                          !choice.program_id && 'text-muted-foreground'
                        )}
                      >
                        {choice.program ? (
                          <div className="flex items-center gap-2 flex-1 text-right">
                            <span className="truncate">{choice.program.name}</span>
                            {choice.program.orientation && (
                              <span className="text-xs text-muted-foreground">
                                - {choice.program.orientation}
                              </span>
                            )}
                          </div>
                        ) : (
                          'انتخاب رشته...'
                        )}
                        <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[500px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="جستجوی رشته..." />
                        <CommandEmpty>رشته‌ای یافت نشد</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-auto">
                          {filteredPrograms.map((program) => (
                            <CommandItem
                              key={program.id}
                              value={`${program.name} ${program.orientation} ${program.code}`}
                              onSelect={() => handleProgramSelect(index, program.id)}
                            >
                              <Check
                                className={cn(
                                  'ml-2 h-4 w-4',
                                  choice.program_id === program.id
                                    ? 'opacity-100'
                                    : 'opacity-0'
                                )}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{program.name}</span>
                                  {program.orientation && (
                                    <span className="text-xs text-muted-foreground">
                                      - {program.orientation}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {program.faculty.name}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {program.department.name}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    ظرفیت: {program.capacity}
                                  </Badge>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  
                  {choice.program_id > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveChoice(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {choice.program && (
                  <div className="text-sm text-muted-foreground pr-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>دانشکده: {choice.program.faculty.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>گروه: {choice.program.department.name}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/student')}
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
                ذخیره انتخاب
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProgramSelection;
