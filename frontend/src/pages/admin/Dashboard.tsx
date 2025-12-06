import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bell, FileText, GraduationCap, FlaskConical, 
  Trophy, BookOpen, ChevronLeft 
} from 'lucide-react';
import api from '@/services/api';
import StatisticsCards from '@/components/admin/StatisticsCards';

interface AdminProfile {
  full_name: string;
  role: string;
  role_display: string;
  accessible_round_types: string[];
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  created_at: string;
  is_important: boolean;
}

const AdminDashboard = () => {
  const { adminProfile } = useOutletContext<{ adminProfile: AdminProfile }>();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get('/api/admin/announcements/');
      setAnnouncements(response.data.announcements || []);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    }
  };

  const guideItems = [
    {
      title: 'نحوه بررسی پرونده‌های ارشد',
      description: 'راهنمای کامل بررسی و تایید پرونده‌های کارشناسی ارشد',
      icon: BookOpen,
      path: '/admin/guides/masters',
      show: adminProfile.accessible_round_types.includes('MA_TALENT'),
    },
    {
      title: 'نحوه بررسی پرونده‌های دکتری',
      description: 'راهنمای کامل بررسی و تایید پرونده‌های دکتری',
      icon: BookOpen,
      path: '/admin/guides/phd',
      show: adminProfile.accessible_round_types.includes('PHD_TALENT'),
    },
    {
      title: 'نحوه بررسی پرونده‌های مصاحبه دکتری',
      description: 'راهنمای ثبت نتایج مصاحبه و امتیازدهی',
      icon: BookOpen,
      path: '/admin/guides/interview',
      show: adminProfile.accessible_round_types.includes('PHD_EXAM'),
    },
    {
      title: 'نحوه بررسی پرونده‌های جذب هیئت علمی',
      description: 'راهنمای فرآیند جذب اعضای هیئت علمی',
      icon: BookOpen,
      path: '/admin/guides/faculty-recruitment',
      show: true,
    },
    {
      title: 'نحوه گزارش‌گیری',
      description: 'راهنمای دریافت گزارش‌ها و آمارهای مختلف',
      icon: FileText,
      path: '/admin/guides/reports',
      show: true,
    },
  ];

  const quickAccessItems = [
    {
      title: 'آزمون دکتری',
      description: 'مشاهده و بررسی پرونده‌های آزمون دکتری',
      icon: FlaskConical,
      path: '/admin/phd-exam',
      color: 'bg-blue-500',
      show: adminProfile.accessible_round_types.includes('PHD_EXAM'),
    },
    {
      title: 'استعداد ارشد',
      description: 'مشاهده و بررسی پرونده‌های استعداد درخشان ارشد',
      icon: GraduationCap,
      path: '/admin/talent/masters',
      color: 'bg-green-500',
      show: adminProfile.accessible_round_types.includes('MA_TALENT'),
    },
    {
      title: 'استعداد دکتری',
      description: 'مشاهده و بررسی پرونده‌های استعداد درخشان دکتری',
      icon: GraduationCap,
      path: '/admin/talent/phd',
      color: 'bg-purple-500',
      show: adminProfile.accessible_round_types.includes('PHD_TALENT'),
    },
    {
      title: 'المپیاد علمی',
      description: 'مشاهده و بررسی پرونده‌های المپیادی',
      icon: Trophy,
      path: '/admin/olympiad',
      color: 'bg-yellow-500',
      show: adminProfile.accessible_round_types.includes('OLYMPIAD'),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          خوش آمدید، {adminProfile.full_name}
        </h1>
        <p className="text-muted-foreground mt-2">
          شما به عنوان {adminProfile.role_display} وارد شده‌اید
        </p>
      </div>

      {/* Statistics Cards */}
      <StatisticsCards />

      {/* Announcements */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>اطلاعیه‌ها</CardTitle>
          </div>
          <CardDescription>آخرین اطلاعیه‌های سیستم</CardDescription>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              اطلاعیه‌ای وجود ندارد
            </p>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`p-4 rounded-lg border ${
                    announcement.is_important
                      ? 'border-orange-200 bg-orange-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">
                        {announcement.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {announcement.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(announcement.created_at).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                    {announcement.is_important && (
                      <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded">
                        مهم
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Access */}
      <div>
        <h2 className="text-xl font-bold mb-4">دسترسی سریع</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickAccessItems.filter(item => item.show).map((item) => (
            <Card
              key={item.path}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => navigate(item.path)}
            >
              <CardContent className="p-6">
                <div className={`${item.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {item.description}
                </p>
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  مشاهده
                  <ChevronLeft className="h-4 w-4 mr-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Guides */}
      <Card>
        <CardHeader>
          <CardTitle>راهنماها</CardTitle>
          <CardDescription>
            راهنماهای کامل برای استفاده از سیستم و بررسی پرونده‌ها
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {guideItems.filter(item => item.show).map((guide) => (
              <button
                key={guide.path}
                onClick={() => navigate(guide.path)}
                className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <guide.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-right">
                    <h3 className="font-semibold text-sm mb-1">
                      {guide.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {guide.description}
                    </p>
                  </div>
                </div>
                <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
