import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, X, GripVertical, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import api from '@/services/api';
import type { Program, RoundType } from '@/types/models';

interface ProgramSelectorProps {
  applicationId: number;
  roundType: RoundType;
  onComplete: () => void;
  initialChoices?: SelectedProgram[];
}

interface SelectedProgram extends Program {
  priority: number;
}

const ProgramSelector = ({ 
  applicationId, 
  roundType, 
  onComplete,
  initialChoices = []
}: ProgramSelectorProps) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<SelectedProgram[]>(initialChoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchPrograms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundType]);

  const fetchPrograms = async () => {
    setSearching(true);
    try {
      const response = await api.get<Program[]>(`/api/core/programs/`, {
        params: { round_type: roundType, is_active: true }
      });
      setPrograms(response.data);
    } catch (error) {
      toast({
        title: 'خطا در دریافت لیست رشته‌ها',
        description: 'لطفاً دوباره تلاش کنید',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  const filteredPrograms = programs.filter((program) => {
    const searchLower = searchTerm.toLowerCase();
    const isAlreadySelected = selectedPrograms.some((sp) => sp.id === program.id);
    
    if (isAlreadySelected) return false;

    return (
      program.name.toLowerCase().includes(searchLower) ||
      program.code.toLowerCase().includes(searchLower) ||
      program.faculty_name?.toLowerCase().includes(searchLower) ||
      program.department_name?.toLowerCase().includes(searchLower)
    );
  });

  const handleAddProgram = (program: Program) => {
    if (selectedPrograms.length >= 3) {
      toast({
        title: 'حداکثر 3 رشته',
        description: 'شما می‌توانید حداکثر 3 رشته را انتخاب کنید',
        variant: 'destructive',
      });
      return;
    }

    const newProgram: SelectedProgram = {
      ...program,
      priority: selectedPrograms.length + 1,
    };

    setSelectedPrograms([...selectedPrograms, newProgram]);
    setSearchTerm('');
    
    toast({
      title: 'رشته اضافه شد',
      description: `${program.name} به اولویت ${newProgram.priority} اضافه شد`,
    });
  };

  const handleRemoveProgram = (programId: number) => {
    const filtered = selectedPrograms.filter((p) => p.id !== programId);
    // Re-assign priorities
    const reordered = filtered.map((p, index) => ({
      ...p,
      priority: index + 1,
    }));
    setSelectedPrograms(reordered);
  };

  const handleMoveProgramUp = (index: number) => {
    if (index === 0) return;
    
    const newPrograms = [...selectedPrograms];
    [newPrograms[index - 1], newPrograms[index]] = [newPrograms[index], newPrograms[index - 1]];
    
    // Re-assign priorities
    const reordered = newPrograms.map((p, i) => ({
      ...p,
      priority: i + 1,
    }));
    
    setSelectedPrograms(reordered);
  };

  const handleMoveProgramDown = (index: number) => {
    if (index === selectedPrograms.length - 1) return;
    
    const newPrograms = [...selectedPrograms];
    [newPrograms[index], newPrograms[index + 1]] = [newPrograms[index + 1], newPrograms[index]];
    
    // Re-assign priorities
    const reordered = newPrograms.map((p, i) => ({
      ...p,
      priority: i + 1,
    }));
    
    setSelectedPrograms(reordered);
  };

  const handleSubmit = async () => {
    if (selectedPrograms.length === 0) {
      toast({
        title: 'انتخاب رشته الزامی است',
        description: 'لطفاً حداقل یک رشته انتخاب کنید',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Delete existing choices
      await api.delete(`/api/applications/${applicationId}/choices/`);

      // Create new choices
      for (const program of selectedPrograms) {
        await api.post(`/api/applications/${applicationId}/choices/`, {
          program_id: program.id,
          priority: program.priority,
        });
      }

      toast({
        title: 'ذخیره موفق',
        description: 'رشته‌های انتخابی شما ثبت شد',
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: 'خطا در ذخیره',
        description: error.response?.data?.error || 'خطایی رخ داده است',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>انتخاب رشته‌های تحصیلی</CardTitle>
          <CardDescription>
            شما می‌توانید حداکثر 3 رشته را به ترتیب اولویت انتخاب کنید
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="جستجو در رشته‌ها (نام، کد، دانشکده، گروه)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* Search Results */}
          {searchTerm && (
            <div className="border rounded-lg max-h-60 overflow-y-auto">
              {searching ? (
                <div className="p-4 text-center text-muted-foreground">
                  در حال جستجو...
                </div>
              ) : filteredPrograms.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  رشته‌ای یافت نشد
                </div>
              ) : (
                <div className="divide-y">
                  {filteredPrograms.map((program) => (
                    <div
                      key={program.id}
                      className="p-3 hover:bg-accent cursor-pointer flex items-center justify-between"
                      onClick={() => handleAddProgram(program)}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{program.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {program.faculty_name} - {program.department_name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          کد: {program.code}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selected Programs */}
          <div className="space-y-3">
            <h3 className="font-medium">رشته‌های انتخاب شده ({selectedPrograms.length}/3)</h3>
            
            {selectedPrograms.length === 0 ? (
              <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                هنوز رشته‌ای انتخاب نشده است
              </div>
            ) : (
              <div className="space-y-2">
                {selectedPrograms.map((program, index) => (
                  <Card key={program.id} className="bg-accent/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {/* Priority Badge */}
                        <Badge variant="default" className="shrink-0">
                          اولویت {program.priority}
                        </Badge>

                        {/* Program Info */}
                        <div className="flex-1">
                          <p className="font-medium">{program.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {program.faculty_name} - {program.department_name}
                          </p>
                        </div>

                        {/* Move Buttons */}
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMoveProgramUp(index)}
                            disabled={index === 0}
                            className="h-6 px-2"
                          >
                            <GripVertical className="h-3 w-3 rotate-180" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMoveProgramDown(index)}
                            disabled={index === selectedPrograms.length - 1}
                            className="h-6 px-2"
                          >
                            <GripVertical className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Remove Button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveProgram(program.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSubmit}
              disabled={loading || selectedPrograms.length === 0}
              size="lg"
            >
              {loading ? 'در حال ذخیره...' : 'ذخیره و ادامه'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgramSelector;
