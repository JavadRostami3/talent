import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import api from '@/services/api';
import type { University } from '@/types/models';

interface UniversitySelectorProps {
  value?: University;
  onChange: (university: University | undefined) => void;
  error?: string;
}

const UniversitySelector = ({ value, onChange, error }: UniversitySelectorProps) => {
  const [universities, setUniversities] = useState<University[]>([]);
  const [searchTerm, setSearchTerm] = useState(value?.name || '');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      fetchUniversities();
    } else {
      setUniversities([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const fetchUniversities = async () => {
    setLoading(true);
    try {
      const response = await api.get<University[]>('/api/core/universities/', {
        params: { search: searchTerm },
      });
      setUniversities(response.data);
      setIsOpen(true);
    } catch (error) {
      console.error('Error fetching universities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (university: University) => {
    setSearchTerm(university.name);
    onChange(university);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchTerm('');
    onChange(undefined);
    setUniversities([]);
  };

  return (
    <div className="space-y-2 relative">
      <Label>دانشگاه *</Label>
      <div className="relative">
        <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.length >= 2 && setIsOpen(true)}
          placeholder="جستجوی دانشگاه..."
          className="pr-10"
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute left-2 top-1.5 h-7 px-2"
            onClick={handleClear}
          >
            ×
          </Button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && universities.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">در حال جستجو...</div>
          ) : (
            universities.map((university) => (
              <div
                key={university.id}
                className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                onClick={() => handleSelect(university)}
              >
                <p className="font-medium">{university.name}</p>
                {university.location && (
                  <p className="text-sm text-muted-foreground">{university.location}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

export default UniversitySelector;
