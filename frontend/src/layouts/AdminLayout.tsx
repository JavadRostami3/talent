import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, X, Home, GraduationCap, FlaskConical, Trophy, 
  HelpCircle, ChevronDown, LogOut, Settings, User,
  FileText, Mail, BarChart3, TrendingUp, UserCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import api from '@/services/api';
import NotificationBell from '@/components/notifications/NotificationBell';

interface AdminProfile {
  id: number;
  national_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  mobile: string;
  role: string;
  role_display: string;
  permissions: {
    has_full_access: boolean;
    has_ma_talent_access: boolean;
    has_phd_talent_access: boolean;
    has_phd_exam_access: boolean;
    has_olympiad_access: boolean;
  };
  accessible_round_types: string[];
  faculties: Array<{
    id: number;
    name: string;
    code: string;
  }>;
  has_all_faculties_access: boolean;
}

const AdminLayout = () => {
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [talentDropdownOpen, setTalentDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const response = await api.get<AdminProfile>('/api/admin/profile/');
      setAdminProfile(response.data);
    } catch (error) {
      // Fallback: ایجاد یک پروفایل موقت برای تست
      console.error('Admin profile API error:', error);
      setAdminProfile({
        id: 1,
        national_id: '0000000000',
        first_name: 'ادمین',
        last_name: 'سیستم',
        full_name: 'ادمین سیستم',
        email: 'admin@example.com',
        mobile: '09000000000',
        role: 'ADMIN',
        role_display: 'مدیر سیستم',
        permissions: {
          has_full_access: true,
          has_ma_talent_access: true,
          has_phd_talent_access: true,
          has_phd_exam_access: true,
          has_olympiad_access: true,
        },
        accessible_round_types: ['MA_TALENT', 'PHD_TALENT', 'PHD_EXAM', 'OLYMPIAD'],
        faculties: [],
        has_all_faculties_access: true,
      });
      
      toast({
        title: 'هشدار',
        description: 'از داده‌های موقت استفاده می‌شود - Backend را اجرا کنید',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    navigate('/login');
    toast({
      title: 'خروج موفق',
      description: 'با موفقیت از سیستم خارج شدید',
    });
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`;
    }
    return name.substring(0, 2);
  };

  const isActivePath = (path: string) => {
    return location.pathname.startsWith(path);
  };

  // Build menu items based on permissions
  const menuItems = [
    {
      label: 'صفحه اصلی',
      icon: Home,
      path: '/admin/dashboard',
      show: true,
    },
    {
      label: 'بررسی دانشگاه',
      icon: FileText,
      path: '/admin/university/applications',
      show: adminProfile?.role === 'UNIVERSITY_ADMIN' || adminProfile?.role === 'SYSTEM_ADMIN' || false,
    },
    {
      label: 'بررسی دانشکده',
      icon: GraduationCap,
      path: '/admin/faculty/applications',
      show: adminProfile?.role === 'FACULTY_ADMIN' || adminProfile?.role === 'SYSTEM_ADMIN' || false,
    },
    {
      label: 'گزارش‌ها',
      icon: BarChart3,
      path: '/admin/reports',
      show: true,
    },
    {
      label: 'تحلیل‌های پیشرفته',
      icon: TrendingUp,
      path: '/admin/analytics',
      show: true,
    },
    {
      label: 'ارسال ایمیل گروهی',
      icon: Mail,
      path: '/admin/bulk-email',
      show: adminProfile?.role === 'SYSTEM_ADMIN' || false,
    },
    {
      label: 'آزمون دکتری',
      icon: FlaskConical,
      path: '/admin/phd-exam',
      show: adminProfile?.accessible_round_types.includes('PHD_EXAM') || false,
    },
    {
      label: 'استعداد درخشان',
      icon: GraduationCap,
      path: '/admin/talent',
      show: 
        adminProfile?.accessible_round_types.includes('MA_TALENT') ||
        adminProfile?.accessible_round_types.includes('PHD_TALENT') ||
        false,
      subItems: [
        {
          label: 'کارشناسی ارشد',
          path: '/admin/talent/masters',
          show: adminProfile?.accessible_round_types.includes('MA_TALENT') || false,
        },
        {
          label: 'دکتری',
          path: '/admin/talent/phd',
          show: adminProfile?.accessible_round_types.includes('PHD_TALENT') || false,
        },
      ],
    },
    {
      label: 'المپیاد علمی',
      icon: Trophy,
      path: '/admin/olympiad',
      show: adminProfile?.accessible_round_types.includes('OLYMPIAD') || false,
    },
    {
      label: 'پشتیبانی',
      icon: HelpCircle,
      path: '/admin/support',
      show: true,
    },
  ];

  if (!adminProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              
              <div className="flex items-center gap-3">
                <img 
                  src="/umz-logo.png" 
                  alt="دانشگاه مازندران" 
                  className="h-12 w-12 object-contain"
                />
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-gray-900">سامانه ثبت‌نام و مصاحبه</h1>
                  <p className="text-xs text-gray-500">دانشگاه مازندران</p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {menuItems.filter(item => item.show).map((item) => {
                if (item.subItems) {
                  return (
                    <DropdownMenu key={item.label}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant={isActivePath(item.path) ? 'secondary' : 'ghost'}
                          className="gap-2"
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {item.subItems.filter(sub => sub.show).map((subItem) => (
                          <DropdownMenuItem
                            key={subItem.path}
                            onClick={() => navigate(subItem.path)}
                          >
                            {subItem.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }
                
                return (
                  <Button
                    key={item.path}
                    variant={isActivePath(item.path) ? 'secondary' : 'ghost'}
                    className="gap-2"
                    onClick={() => navigate(item.path)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>

            {/* Notification Bell and User Menu */}
            <div className="flex items-center gap-2">
              <NotificationBell />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <UserCircle2 className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-right">
                      <p className="text-sm font-medium">{adminProfile.full_name}</p>
                      <p className="text-xs text-muted-foreground">{adminProfile.role_display}</p>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-2">
                    <p className="text-sm font-medium">{adminProfile.full_name}</p>
                    <p className="text-xs text-muted-foreground">{adminProfile.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">{adminProfile.role_display}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                    <Settings className="ml-2 h-4 w-4" />
                    تنظیمات
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="ml-2 h-4 w-4" />
                    خروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-4 space-y-2">
              {menuItems.filter(item => item.show).map((item) => (
                <div key={item.label}>
                  {item.subItems ? (
                    <>
                      <button
                        onClick={() => setTalentDropdownOpen(!talentDropdownOpen)}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </div>
                        <ChevronDown 
                          className={`h-4 w-4 transition-transform ${talentDropdownOpen ? 'rotate-180' : ''}`} 
                        />
                      </button>
                      {talentDropdownOpen && (
                        <div className="mr-8 mt-2 space-y-1">
                          {item.subItems.filter(sub => sub.show).map((subItem) => (
                            <button
                              key={subItem.path}
                              onClick={() => {
                                navigate(subItem.path);
                                setMobileMenuOpen(false);
                              }}
                              className="w-full text-right p-2 rounded-md hover:bg-gray-100"
                            >
                              {subItem.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        navigate(item.path);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg ${
                        isActivePath(item.path) ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </button>
                  )}
                </div>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Outlet context={{ adminProfile }} />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} دانشگاه مازندران. تمامی حقوق محفوظ است.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AdminLayout;
