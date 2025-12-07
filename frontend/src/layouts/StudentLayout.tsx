import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, X, Home, User, FileText, GraduationCap, Upload, 
  Send, AlertCircle, CheckCircle, LogOut, Building, List
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
import { cn } from '@/lib/utils';
import api from '@/services/api';
import NotificationBell from '@/components/notifications/NotificationBell';

interface StudentProfile {
  id: number;
  national_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  mobile: string;
}

interface Application {
  tracking_code: string;
}

const StudentLayout = () => {
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchStudentProfile();
    fetchApplication();
  }, []);

  const fetchStudentProfile = async () => {
    try {
      const response = await api.get<StudentProfile>('/api/accounts/profile/');
      setStudentProfile(response.data);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'دریافت اطلاعات کاربری با خطا مواجه شد',
        variant: 'destructive',
      });
    }
  };

  const fetchApplication = async () => {
    try {
      const response = await api.get('/api/applicant/applications/');
      if (response.data.results && response.data.results.length > 0) {
        setApplication(response.data.results[0]);
      }
    } catch (error) {
      // Ignore error
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
    return location.pathname === path;
  };

  const menuItems = [
    {
      label: 'داشبورد',
      icon: Home,
      path: '/student',
    },
    {
      label: 'انتخاب رشته',
      icon: List,
      path: '/student/program-selection',
    },
    {
      label: 'اطلاعات شخصی',
      icon: User,
      path: '/student/personal-info',
    },
    {
      label: 'اطلاعات تحصیلی',
      icon: GraduationCap,
      path: '/student/education',
    },
    {
      label: 'مدارک شناسایی',
      icon: FileText,
      path: '/student/documents?category=identity',
    },
    {
      label: 'مدارک تحصیلی',
      icon: Upload,
      path: '/student/documents?category=education',
    },
    {
      label: 'ارسال برای بررسی',
      icon: Send,
      path: '/student/submit',
    },
    {
      label: 'نقص‌ها',
      icon: AlertCircle,
      path: '/student/deficiencies',
      badge: 'جدید',
    },
    {
      label: 'وضعیت پرونده',
      icon: CheckCircle,
      path: '/student/status',
    },
  ];

  if (!studentProfile) {
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

            {/* Notification Bell and User Menu */}
            <div className="flex items-center gap-2">
              <NotificationBell />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getInitials(studentProfile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-right">
                      <p className="text-sm font-medium">
                        {studentProfile.full_name}
                        {application?.tracking_code && (
                          <span className="text-xs text-muted-foreground mr-1">
                            ({application.tracking_code})
                          </span>
                        )}
                      </p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{studentProfile.full_name}</p>
                    <p className="text-xs text-muted-foreground">{studentProfile.email}</p>
                    {application?.tracking_code && (
                      <p className="text-xs text-muted-foreground mt-1">
                        کد پیگیری: {application.tracking_code}
                      </p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="ml-2 h-4 w-4" />
                    خروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 bg-white border-l border-gray-200 min-h-[calc(100vh-4rem)] sticky top-16">
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = isActivePath(item.path);
              return (
                <Button
                  key={item.path}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3 h-11',
                    isActive && 'bg-primary/10 text-primary hover:bg-primary/20'
                  )}
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="flex-1 text-right">{item.label}</span>
                  {item.badge && (
                    <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Sidebar */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
            <aside 
              className="absolute right-0 top-0 h-full w-64 bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg">منو</h2>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-md hover:bg-gray-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <nav className="p-4 space-y-1">
                {menuItems.map((item) => {
                  const isActive = isActivePath(item.path);
                  return (
                    <Button
                      key={item.path}
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start gap-3 h-11',
                        isActive && 'bg-primary/10 text-primary hover:bg-primary/20'
                      )}
                      onClick={() => {
                        navigate(item.path);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="flex-1 text-right">{item.label}</span>
                      {item.badge && (
                        <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Button>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
