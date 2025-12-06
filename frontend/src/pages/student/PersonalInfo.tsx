import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Save, ArrowRight } from 'lucide-react';
import api from '@/services/api';

interface PersonalInfoForm {
  first_name: string;
  last_name: string;
  father_name: string;
  birth_certificate_number: string;
  birth_certificate_serial: string;
  birth_certificate_issue_place: string;
  gender: string;
  birth_year: number;
  birth_place: string;
  phone: string;
  address: string;
  military_status?: string;
}

const PersonalInfo = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PersonalInfoForm>({
    first_name: '',
    last_name: '',
    father_name: '',
    birth_certificate_number: '',
    birth_certificate_serial: '',
    birth_certificate_issue_place: '',
    gender: '',
    birth_year: 1380,
    birth_place: '',
    phone: '',
    address: '',
    military_status: '',
  });

  useEffect(() => {
    if (user) {
      const userData = user as unknown as Record<string, string | number>;
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        father_name: user.father_name || '',
        birth_certificate_number: (userData.birth_certificate_number as string) || '',
        birth_certificate_serial: (userData.birth_certificate_serial as string) || '',
        birth_certificate_issue_place: (userData.birth_certificate_issue_place as string) || '',
        gender: user.gender || '',
        birth_year: (userData.birth_year as number) || 1380,
        birth_place: (userData.birth_place as string) || '',
        phone: (userData.phone as string) || '',
        address: (userData.address as string) || '',
        military_status: (userData.military_status as string) || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update user info
      const userResponse = await api.patch(`/api/accounts/users/${user?.id}/`, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        father_name: formData.father_name,
        birth_certificate_number: formData.birth_certificate_number,
        birth_certificate_serial: formData.birth_certificate_serial,
        birth_certificate_issue_place: formData.birth_certificate_issue_place,
        gender: formData.gender,
        birth_year: formData.birth_year,
        birth_place: formData.birth_place,
        military_status: formData.military_status,
      });

      // Update profile
      await api.patch(`/api/accounts/profiles/${user?.id}/`, {
        phone: formData.phone,
        address: formData.address,
      });

      // Update application status
      const appsResponse = await api.get('/api/applications/');
      if (appsResponse.data.length > 0) {
        const app = appsResponse.data[0];
        await api.patch(`/api/applications/${app.id}/update/`, {
          status: 'PERSONAL_INFO_COMPLETED',
        });
      }

      toast({
        title: 'موفق',
        description: 'اطلاعات شخصی با موفقیت ذخیره شد',
      });

      navigate('/student');
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'ذخیره اطلاعات با خطا مواجه شد',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const years = Array.from({ length: 71 }, (_, i) => 1320 + i);
  const showMilitaryStatus = formData.gender === 'MALE';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>اطلاعات شخصی</CardTitle>
          <CardDescription>
            لطفاً اطلاعات شناسایی و تماس خود را با دقت وارد نمایید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">نام *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">نام خانوادگی *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="father_name">نام پدر *</Label>
                <Input
                  id="father_name"
                  value={formData.father_name}
                  onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="national_id">کد ملی</Label>
                <Input
                  id="national_id"
                  value={user?.national_id}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            </div>

            {/* Birth Certificate */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birth_certificate_number">شماره شناسنامه *</Label>
                <Input
                  id="birth_certificate_number"
                  value={formData.birth_certificate_number}
                  onChange={(e) => setFormData({ ...formData, birth_certificate_number: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_certificate_serial">سریال شناسنامه *</Label>
                <Input
                  id="birth_certificate_serial"
                  value={formData.birth_certificate_serial}
                  onChange={(e) => setFormData({ ...formData, birth_certificate_serial: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_certificate_issue_place">محل صدور *</Label>
                <Input
                  id="birth_certificate_issue_place"
                  value={formData.birth_certificate_issue_place}
                  onChange={(e) => setFormData({ ...formData, birth_certificate_issue_place: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Gender & Birth */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>جنسیت *</Label>
                <RadioGroup
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="MALE" id="male" />
                    <Label htmlFor="male">مرد</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="FEMALE" id="female" />
                    <Label htmlFor="female">زن</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_year">سال تولد *</Label>
                <Select
                  value={formData.birth_year.toString()}
                  onValueChange={(value) => setFormData({ ...formData, birth_year: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_place">محل تولد *</Label>
                <Input
                  id="birth_place"
                  value={formData.birth_place}
                  onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Military Status (only for males) */}
            {showMilitaryStatus && (
              <div className="space-y-2">
                <Label htmlFor="military_status">وضعیت نظام وظیفه *</Label>
                <Select
                  value={formData.military_status}
                  onValueChange={(value) => setFormData({ ...formData, military_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERMANENT_EXEMPTION">معافیت دائم</SelectItem>
                    <SelectItem value="EDUCATIONAL_EXEMPTION">معافیت تحصیلی</SelectItem>
                    <SelectItem value="IN_SERVICE">در حال خدمت</SelectItem>
                    <SelectItem value="COMPLETED">پایان خدمت</SelectItem>
                    <SelectItem value="MEDICAL_EXEMPTION">معافیت پزشکی</SelectItem>
                    <SelectItem value="INCLUDED">مشمول</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mobile">موبایل</Label>
                <Input
                  id="mobile"
                  value={user?.mobile}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">ایمیل</Label>
                <Input
                  id="email"
                  value={user?.email}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">تلفن ثابت *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">نشانی محل سکونت دائم *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" onClick={() => navigate('/student')}>
                انصراف
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="ml-2 h-4 w-4" />
                {loading ? 'در حال ذخیره...' : 'ذخیره و ادامه'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalInfo;
