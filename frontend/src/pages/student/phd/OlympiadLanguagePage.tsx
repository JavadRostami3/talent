import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Trophy, Languages, Plus, Trash2, Upload, Save } from 'lucide-react';
import api from '@/services/api';
import type { Application } from '@/types/models';

interface OlympiadRecord {
  id?: number;
  olympiad_type: string;
  olympiad_name: string;
  year: number;
  rank_level: string;
  rank_number?: number;
  certificate_file?: File | string;
}

interface LanguageCertificate {
  id?: number;
  language: string;
  certificate_type: string;
  certificate_number?: string;
  issue_date: string;
  expiry_date?: string;
  test_score: string;
  certificate_file?: File | string;
}

const OlympiadLanguagePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [applicationId, setApplicationId] = useState<number | null>(null);
  
  const [olympiadRecords, setOlympiadRecords] = useState<OlympiadRecord[]>([]);
  const [languageCertificates, setLanguageCertificates] = useState<LanguageCertificate[]>([]);

  useEffect(() => {
    fetchApplication();
  }, []);

  const fetchApplication = async () => {
    try {
      const response = await api.get('/api/applications/');
      const applications = Array.isArray(response.data) ? response.data : [];
      if (applications.length > 0) {
        const app = applications[0];
        setApplicationId(app.id);
        
        // بارگذاری سوابق المپیاد و زبان اگر موجود باشند
        if (app.olympiad_records) {
          setOlympiadRecords(app.olympiad_records);
        }
        if (app.language_certificates) {
          setLanguageCertificates(app.language_certificates);
        }
      }
    } catch (error) {
      console.error('Error fetching application:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری اطلاعات',
        variant: 'destructive',
      });
    }
  };

  // المپیاد
  const addOlympiadRecord = () => {
    setOlympiadRecords([
      ...olympiadRecords,
      {
        olympiad_type: '',
        olympiad_name: '',
        year: new Date().getFullYear(),
        rank_level: '',
      },
    ]);
  };

  const removeOlympiadRecord = (index: number) => {
    setOlympiadRecords(olympiadRecords.filter((_, i) => i !== index));
  };

  const updateOlympiadRecord = (index: number, field: keyof OlympiadRecord, value: any) => {
    const updated = [...olympiadRecords];
    updated[index] = { ...updated[index], [field]: value };
    setOlympiadRecords(updated);
  };

  // زبان
  const addLanguageCertificate = () => {
    setLanguageCertificates([
      ...languageCertificates,
      {
        language: '',
        certificate_type: '',
        issue_date: '',
        test_score: '',
      },
    ]);
  };

  const removeLanguageCertificate = (index: number) => {
    setLanguageCertificates(languageCertificates.filter((_, i) => i !== index));
  };

  const updateLanguageCertificate = (index: number, field: keyof LanguageCertificate, value: any) => {
    const updated = [...languageCertificates];
    updated[index] = { ...updated[index], [field]: value };
    setLanguageCertificates(updated);
  };

  const handleFileUpload = (index: number, file: File, type: 'olympiad' | 'language') => {
    if (type === 'olympiad') {
      updateOlympiadRecord(index, 'certificate_file', file);
    } else {
      updateLanguageCertificate(index, 'certificate_file', file);
    }
  };

  const handleSubmit = async () => {
    if (!applicationId) {
      toast({
        title: 'خطا',
        description: 'شناسه درخواست یافت نشد',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // ارسال سوابق المپیاد
      for (const record of olympiadRecords) {
        const formData = new FormData();
        Object.entries(record).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === 'certificate_file' && value instanceof File) {
              formData.append(key, value);
            } else if (key !== 'certificate_file') {
              formData.append(key, value.toString());
            }
          }
        });

        if (record.id) {
          await api.put(`/api/applications/${applicationId}/olympiad-records/${record.id}/`, formData);
        } else {
          await api.post(`/api/applications/${applicationId}/olympiad-records/`, formData);
        }
      }

      // ارسال مدارک زبان
      for (const cert of languageCertificates) {
        const formData = new FormData();
        Object.entries(cert).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === 'certificate_file' && value instanceof File) {
              formData.append(key, value);
            } else if (key !== 'certificate_file') {
              formData.append(key, value.toString());
            }
          }
        });

        if (cert.id) {
          await api.put(`/api/applications/${applicationId}/language-certificates/${cert.id}/`, formData);
        } else {
          await api.post(`/api/applications/${applicationId}/language-certificates/`, formData);
        }
      }

      toast({
        title: 'موفق',
        description: 'اطلاعات با موفقیت ذخیره شد',
      });

      navigate('/phd/program-selection');
    } catch (error: any) {
      console.error('Error saving records:', error);
      toast({
        title: 'خطا',
        description: error.response?.data?.message || 'خطا در ذخیره اطلاعات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold mb-2">المپیاد و مدارک زبان</h1>
        <p className="text-muted-foreground">
          ثبت سوابق المپیادهای علمی و مدارک زبان معتبر
        </p>
      </div>

      {/* سوابق المپیاد */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            سوابق المپیاد علمی
          </CardTitle>
          <CardDescription>
            ثبت سوابق المپیادهای ملی و بین‌المللی (اختیاری)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {olympiadRecords.map((record, index) => (
            <Card key={index} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>نوع المپیاد</Label>
                  <Select
                    value={record.olympiad_type || ''}
                    onValueChange={(value) => updateOlympiadRecord(index, 'olympiad_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PHYSICS">المپیاد فیزیک</SelectItem>
                      <SelectItem value="CHEMISTRY">المپیاد شیمی</SelectItem>
                      <SelectItem value="MATHEMATICS">المپیاد ریاضی</SelectItem>
                      <SelectItem value="COMPUTER">المپیاد کامپیوتر</SelectItem>
                      <SelectItem value="BIOLOGY">المپیاد زیست‌شناسی</SelectItem>
                      <SelectItem value="OTHER">سایر المپیادها</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>نام دقیق المپیاد</Label>
                  <Input
                    value={record.olympiad_name}
                    onChange={(e) => updateOlympiadRecord(index, 'olympiad_name', e.target.value)}
                    placeholder="مثال: المپیاد فیزیک کشور - مرحله کشوری"
                  />
                </div>

                <div>
                  <Label>سال برگزاری (شمسی)</Label>
                  <Input
                    type="number"
                    value={record.year}
                    onChange={(e) => updateOlympiadRecord(index, 'year', parseInt(e.target.value))}
                    placeholder="1402"
                  />
                </div>

                <div>
                  <Label>سطح رتبه</Label>
                  <Select
                    value={record.rank_level || ''}
                    onValueChange={(value) => updateOlympiadRecord(index, 'rank_level', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GOLD">رتبه طلا</SelectItem>
                      <SelectItem value="SILVER">رتبه نقره</SelectItem>
                      <SelectItem value="BRONZE">رتبه برنز</SelectItem>
                      <SelectItem value="TOP_10">10 نفر برتر</SelectItem>
                      <SelectItem value="TOP_20">20 نفر برتر</SelectItem>
                      <SelectItem value="PARTICIPANT">شرکت‌کننده</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>رتبه عددی (اختیاری)</Label>
                  <Input
                    type="number"
                    value={record.rank_number || ''}
                    onChange={(e) => updateOlympiadRecord(index, 'rank_number', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="در صورت وجود"
                  />
                </div>

                <div>
                  <Label>فایل مدرک</Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(index, file, 'olympiad');
                    }}
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeOlympiadRecord(index)}
              >
                <Trash2 className="h-4 w-4 ml-2" />
                حذف
              </Button>
            </Card>
          ))}

          <Button type="button" variant="outline" onClick={addOlympiadRecord}>
            <Plus className="h-4 w-4 ml-2" />
            افزودن المپیاد
          </Button>
        </CardContent>
      </Card>

      {/* مدارک زبان */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            مدارک زبان
          </CardTitle>
          <CardDescription>
            ثبت مدارک آزمون‌های زبان معتبر (حداکثر ۸ امتیاز)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {languageCertificates.map((cert, index) => (
            <Card key={index} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>زبان</Label>
                  <Select
                    value={cert.language || ''}
                    onValueChange={(value) => updateLanguageCertificate(index, 'language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ENGLISH">انگلیسی</SelectItem>
                      <SelectItem value="FRENCH">فرانسه</SelectItem>
                      <SelectItem value="GERMAN">آلمانی</SelectItem>
                      <SelectItem value="ARABIC">عربی</SelectItem>
                      <SelectItem value="OTHER">سایر زبان‌ها</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>نوع مدرک</Label>
                  <Select
                    value={cert.certificate_type || ''}
                    onValueChange={(value) => updateLanguageCertificate(index, 'certificate_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TOEFL">تافل (TOEFL)</SelectItem>
                      <SelectItem value="IELTS">آیلتس (IELTS)</SelectItem>
                      <SelectItem value="GRE">جی آر ای (GRE)</SelectItem>
                      <SelectItem value="MSRT">ام اس آر تی (MSRT)</SelectItem>
                      <SelectItem value="EPT">EPT دانشگاه آزاد</SelectItem>
                      <SelectItem value="DELF">DELF</SelectItem>
                      <SelectItem value="DALF">DALF</SelectItem>
                      <SelectItem value="TCF">TCF</SelectItem>
                      <SelectItem value="GOETHE">گوته (Goethe)</SelectItem>
                      <SelectItem value="TESTDAF">TestDaF</SelectItem>
                      <SelectItem value="ARABIC_TOAFL">تافل عربی</SelectItem>
                      <SelectItem value="OTHER">سایر مدارک</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>نمره آزمون</Label>
                  <Input
                    value={cert.test_score}
                    onChange={(e) => updateLanguageCertificate(index, 'test_score', e.target.value)}
                    placeholder="مثال: 7.5 برای IELTS یا 100 برای TOEFL"
                  />
                </div>

                <div>
                  <Label>شماره مدرک (اختیاری)</Label>
                  <Input
                    value={cert.certificate_number || ''}
                    onChange={(e) => updateLanguageCertificate(index, 'certificate_number', e.target.value)}
                    placeholder="شماره مدرک"
                  />
                </div>

                <div>
                  <Label>تاریخ صدور</Label>
                  <Input
                    value={cert.issue_date}
                    onChange={(e) => updateLanguageCertificate(index, 'issue_date', e.target.value)}
                    placeholder="1402/05/15"
                  />
                </div>

                <div>
                  <Label>تاریخ انقضا (اختیاری)</Label>
                  <Input
                    value={cert.expiry_date || ''}
                    onChange={(e) => updateLanguageCertificate(index, 'expiry_date', e.target.value)}
                    placeholder="1404/05/15"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>فایل مدرک</Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(index, file, 'language');
                    }}
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeLanguageCertificate(index)}
              >
                <Trash2 className="h-4 w-4 ml-2" />
                حذف
              </Button>
            </Card>
          ))}

          <Button type="button" variant="outline" onClick={addLanguageCertificate}>
            <Plus className="h-4 w-4 ml-2" />
            افزودن مدرک زبان
          </Button>
        </CardContent>
      </Card>

      {/* دکمه‌های پایین */}
      <div className="flex gap-4">
        <Button onClick={handleSubmit} disabled={loading} className="flex-1">
          <Save className="ml-2 h-4 w-4" />
          {loading ? 'در حال ذخیره...' : 'ذخیره و ادامه'}
        </Button>
      </div>
    </div>
  );
};

export default OlympiadLanguagePage;
