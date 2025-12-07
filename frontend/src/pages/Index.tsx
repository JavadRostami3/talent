import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from '@/hooks/use-toast';
import api from '@/services/api';
import type { RoundType } from '@/types/models';

interface Announcement {
  id: number;
  code: string;
  title: string;
  body: string;
  category: string;
  category_display: string;
  published_at: string | null;
  views_count: number;
  created_at: string;
}

const Index = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Registration form
  const [selectedRoundType, setSelectedRoundType] = useState<RoundType>('MA_TALENT');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationalId, setNationalId] = useState('');
  
  // Login form
  const [loginNationalId, setLoginNationalId] = useState('');
  const [trackingCode, setTrackingCode] = useState('');

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      // استفاده از endpoint عمومی برای اطلاعیه‌های منتشر شده
      const response = await api.get<{ results?: Announcement[] }>('/api/content/announcements/public/', {
        params: { ordering: '-published_at' },
        timeout: 3000 // Timeout after 3 seconds
      });
      // بررسی اینکه آیا pagination وجود دارد یا نه
      const announcements = response.data.results || (Array.isArray(response.data) ? response.data : []);
      setAnnouncements(announcements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      // Fallback: Use mock data for demonstration
      setAnnouncements([
        {
          id: 1,
          code: 'ANN-001',
          title: 'شروع ثبت‌نام دوره جدید',
          body: 'با سلام، به اطلاع می‌رساند ثبت‌نام برای دوره جدید استعداد درخشان آغاز شده است.',
          category: 'GENERAL',
          category_display: 'عمومی',
          published_at: new Date().toISOString(),
          views_count: 0,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          code: 'ANN-002',
          title: 'مهلت ارسال مدارک',
          body: 'مهلت ارسال مدارک تا تاریخ 1404/10/15 می‌باشد. لطفاً در ارسال مدارک کوشا باشید.',
          category: 'IMPORTANT',
          category_display: 'مهم',
          published_at: new Date().toISOString(),
          views_count: 0,
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'UNIVERSITY_ADMIN' || user.role === 'FACULTY_ADMIN' || user.role === 'SYSTEM_ADMIN' || user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        // هدایت به صفحه اصلی که به صورت هوشمند redirect می‌کند
        navigate('/');
      }
    } else {
      fetchAnnouncements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, navigate]);

  const handleRegister = async () => {
    if (!firstName || !lastName || !nationalId) {
      toast({
        title: 'خطا',
        description: 'لطفاً تمام فیلدها را پر کنید',
        variant: 'destructive',
      });
      return;
    }

    navigate('/register', { 
      state: { 
        roundType: selectedRoundType,
        firstName,
        lastName,
        nationalId
      } 
    });
  };

  const handleLogin = async () => {
    if (!loginNationalId || !trackingCode) {
      toast({
        title: 'خطا',
        description: 'لطفاً کد ملی و شماره پیگیری را وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    navigate('/login', {
      state: {
        nationalId: loginNationalId,
        trackingCode
      }
    });
  };

  const roundTypes: { value: RoundType; label: string }[] = [
    { value: 'MA_TALENT', label: 'استعداد درخشان کارشناسی ارشد' },
    { value: 'PHD_TALENT', label: 'استعداد درخشان دکتری' },
    { value: 'PHD_EXAM', label: 'آزمون دکتری' },
    { value: 'OLYMPIAD', label: 'المپیاد' },
  ];

  const roundTypeDescriptions = {
    MA_TALENT: 'ویژه دانشجویان ممتاز کارشناسی با معدل بالای 17 که بدون آزمون می‌توانند در مقطع کارشناسی ارشد ادامه تحصیل دهند.',
    PHD_TALENT: 'ویژه دانشجویان ممتاز کارشناسی ارشد با سوابق پژوهشی برتر که بدون آزمون می‌توانند وارد دوره دکتری شوند.',
    PHD_EXAM: 'پذیرش دانشجویان دکتری تخصصی از طریق شرکت در آزمون سراسری و احراز شرایط علمی.',
    OLYMPIAD: 'ویژه برندگان مدال‌های طلا، نقره و برنز المپیادهای علمی داخلی و بین‌المللی.',
  };

  // محتوای Accordion برای هر نوع ثبت‌نام
  const getRoundTypeContent = (type: RoundType) => {
    const contents = {
      MA_TALENT: [
        {
          title: 'شرایط پذیرش',
          content: 'برای ثبت‌نام در دوره کارشناسی ارشد استعداد درخشان، داوطلبان باید دارای شرایط زیر باشند:\n\n• معدل کل کارشناسی بالای 17\n• داشتن حداقل یک مقاله علمی پژوهشی یا شرکت در پروژه‌های تحقیقاتی\n• رتبه دانشگاهی بهتر از 50\n• ارائه مدارک مورد نیاز در مهلت مقرر'
        },
        {
          title: 'رشته‌های تحصیلی کارشناسی ارشد',
          content: 'رشته‌های متنوعی در مقطع کارشناسی ارشد برای دانشجویان استعداد درخشان وجود دارد. بعد از ثبت‌نام اولیه، می‌توانید از لیست رشته‌های موجود، رشته مورد نظر خود را انتخاب کنید.'
        },
        {
          title: 'نحوه ثبت‌نام',
          content: 'ثبت‌نام به صورت الکترونیکی انجام می‌شود:\n\n۱- ابتدا تمامی شرایط پذیرش را مطالعه کنید\n۲- با ثبت‌نام اولیه در سامانه، کد پیگیری خود را دریافت کنید\n۳- از قسمت ورود داوطلب با کد ملی و کد پیگیری وارد شوید\n۴- با ورود به بخش تکمیل پرونده، اطلاعات را تکمیل و مدارک را آپلود کنید\n۵- پس از تکمیل پرونده، آن را به صورت الکترونیکی ارسال کنید'
        },
        {
          title: 'تاریخ‌های مهم',
          content: '• شروع ثبت‌نام: از تاریخ 1404/09/15\n• پایان ثبت‌نام: تا تاریخ 1404/10/15\n• مهلت ارسال مدارک: تا تاریخ 1404/10/20\n• زمان برگزاری مصاحبه‌ها: از تاریخ 1404/11/01\n• اعلام نتایج نهایی: تا تاریخ 1404/11/30'
        }
      ],
      PHD_TALENT: [
        {
          title: 'شرایط پذیرش',
          content: 'برای ثبت‌نام در دوره دکتری استعداد درخشان، داوطلبان باید دارای شرایط زیر باشند:\n\n• معدل کل کارشناسی ارشد بالای 17\n• داشتن حداقل دو مقاله ISI یا معادل چهار مقاله ISC\n• ارائه رزومه پژوهشی قوی\n• تایید استاد راهنما (در صورت نیاز)'
        },
        {
          title: 'رشته‌های تحصیلی دوره دکتری',
          content: 'رشته‌های مختلفی در مقطع دکتری برای دانشجویان استعداد درخشان ارائه می‌شود. بعد از ثبت‌نام، می‌توانید از لیست رشته‌های موجود، رشته مورد نظر خود را انتخاب کنید.'
        },
        {
          title: 'نحوه ثبت‌نام',
          content: 'ثبت‌نام به صورت الکترونیکی انجام می‌شود:\n\n۱- مطالعه دقیق شرایط پذیرش و الزامات\n۲- ثبت‌نام اولیه در سامانه و دریافت کد پیگیری\n۳- ورود به سامانه با کد ملی و کد پیگیری\n۴- تکمیل اطلاعات و آپلود مدارک مورد نیاز\n۵- ارسال نهایی پرونده برای بررسی'
        },
        {
          title: 'نحوه تکمیل پرونده',
          content: 'برای تکمیل پرونده خود باید:\n\n• اطلاعات شخصی را به دقت وارد کنید\n• سوابق تحصیلی را ثبت کنید\n• سوابق پژوهشی و مقالات را اضافه کنید\n• مدارک مورد نیاز را آپلود کنید\n• در نهایت پرونده را ارسال کنید'
        },
        {
          title: 'تاریخ‌های مهم',
          content: '• شروع ثبت‌نام: از تاریخ 1404/09/20\n• پایان ثبت‌نام: تا تاریخ 1404/10/20\n• مهلت ارسال مدارک: تا تاریخ 1404/10/25\n• زمان برگزاری مصاحبه‌ها: از تاریخ 1404/11/10\n• اعلام نتایج نهایی: تا تاریخ 1404/12/10'
        }
      ],
      PHD_EXAM: [
        {
          title: 'شرایط پذیرش',
          content: 'برای ثبت‌نام در آزمون دکتری تخصصی، داوطلبان باید:\n\n• دارای مدرک کارشناسی ارشد معتبر باشند\n• در آزمون سراسری دکتری شرکت کرده باشند\n• حداقل نمره مورد نیاز را کسب کرده باشند\n• شرایط علمی و پژوهشی را احراز کرده باشند'
        },
        {
          title: 'نحوه پذیرش',
          content: 'پذیرش از طریق شرکت در آزمون سراسری دکتری انجام می‌شود. داوطلبان باید در آزمون شرکت کرده و پس از احراز شرایط، برای ثبت‌نام در رشته‌های مورد نظر اقدام کنند.'
        },
        {
          title: 'رشته‌های تحصیلی دوره دکتری',
          content: 'رشته‌های متنوعی در مقطع دکتری تخصصی ارائه می‌شود. بعد از احراز شرایط و شرکت در آزمون، می‌توانید رشته مورد نظر خود را انتخاب کنید.'
        },
        {
          title: 'نحوه ثبت‌نام',
          content: 'مراحل ثبت‌نام:\n\n۱- شرکت در آزمون سراسری دکتری\n۲- احراز شرایط و کسب حداقل نمره\n۳- ثبت‌نام اولیه در سامانه\n۴- تکمیل اطلاعات و ارسال مدارک\n۵- بررسی و تایید نهایی'
        },
        {
          title: 'تاریخ‌های مهم',
          content: '• تاریخ برگزاری آزمون: 1404/11/05\n• شروع ثبت‌نام: از تاریخ 1404/11/10\n• پایان ثبت‌نام: تا تاریخ 1404/11/25\n• مهلت ارسال مدارک: تا تاریخ 1404/11/30\n• اعلام نتایج: تا تاریخ 1404/12/20'
        }
      ],
      OLYMPIAD: [
        {
          title: 'شرایط پذیرش',
          content: 'برای ثبت‌نام در بخش المپیاد علمی، داوطلبان باید:\n\n• برنده مدال طلا، نقره یا برنز در المپیادهای علمی داخلی باشند\n• یا برنده مدال در المپیادهای علمی بین‌المللی باشند\n• مدارک مربوط به مدال را ارائه دهند\n• شرایط علمی مورد نیاز را احراز کرده باشند'
        },
        {
          title: 'رشته‌های تحصیلی',
          content: 'رشته‌های مرتبط با المپیاد علمی برای برندگان مدال ارائه می‌شود. پس از ثبت‌نام و تایید مدارک، می‌توانید رشته مورد نظر خود را انتخاب کنید.'
        },
        {
          title: 'نحوه ثبت‌نام',
          content: 'مراحل ثبت‌نام برای برندگان المپیاد:\n\n۱- مطالعه شرایط پذیرش\n۲- ثبت‌نام اولیه در سامانه\n۳- آپلود مدارک مدال و گواهی‌های مربوطه\n۴- تکمیل اطلاعات تحصیلی\n۵- ارسال پرونده برای بررسی'
        },
        {
          title: 'تاریخ‌های مهم',
          content: '• شروع ثبت‌نام: از تاریخ 1404/09/25\n• پایان ثبت‌نام: تا تاریخ 1404/10/25\n• مهلت ارسال مدارک: تا تاریخ 1404/10/30\n• زمان بررسی پرونده‌ها: از تاریخ 1404/11/05\n• اعلام نتایج: تا تاریخ 1404/11/25'
        }
      ]
    };
    return contents[type] || [];
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen lg:overflow-hidden">
      {/* Left Side - Registration & Login Forms */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-950 order-2 lg:order-1">
        <div className="min-h-full flex items-start justify-center p-3 sm:p-4 lg:p-6">
          <div className="w-full max-w-2xl space-y-6 sm:space-y-8 lg:space-y-10 pt-0 pb-4 sm:pb-6 lg:pb-8">
            {/* Logo and Title */}
            <div className="text-center space-y-2 sm:space-y-3 lg:space-y-4 pt-4 sm:pt-6 lg:pt-8">
              <div className="flex justify-center mb-2 sm:mb-3 lg:mb-4">
                <img 
                  src="/umz-logo.png" 
                  alt="دانشگاه مازندران" 
                  className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 object-contain"
                />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                سامانه ثبت‌نام و مصاحبه
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                دانشگاه مازندران
              </p>
            </div>

            {/* Registration Section */}
            <div className="space-y-4 sm:space-y-5 lg:space-y-6">
            {/* Round Type Selection - Simple Tabs */}
            <div className="mb-6 sm:mb-7">
              <div className="flex overflow-x-auto scrollbar-hide border-b border-slate-200 dark:border-slate-700 justify-between gap-2 sm:gap-4">
                {roundTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedRoundType(type.value)}
                    className={`pb-3 sm:pb-4 px-2 text-xs sm:text-sm transition-all relative text-center whitespace-nowrap ${
                      selectedRoundType === type.value
                        ? 'text-slate-900 dark:text-slate-100 font-semibold'
                        : 'text-slate-500 dark:text-slate-500'
                    }`}
                  >
                    {type.label}
                    {selectedRoundType === type.value && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 dark:bg-slate-100" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm text-slate-700 dark:text-slate-300">
                  نام
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="نام"
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm text-slate-700 dark:text-slate-300">
                  نام خانوادگی
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="نام خانوادگی"
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationalId" className="text-sm text-slate-700 dark:text-slate-300">
                کد ملی
              </Label>
              <Input
                id="nationalId"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="کد ملی 10 رقمی"
                maxLength={10}
                dir="ltr"
                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-full"
              />
            </div>

            {/* Description */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800 w-full">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed text-center">
                {roundTypeDescriptions[selectedRoundType]}
              </p>
            </div>

            <Button 
              onClick={handleRegister} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 sm:py-6 text-sm sm:text-base font-medium"
              size="lg"
            >
              ثبت‌نام
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-slate-950 text-slate-500">یا</span>
            </div>
          </div>

          {/* Login Section */}
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">ورود</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              اگر قبلاً ثبت‌نام کرده‌اید، با کد ملی و شماره پیگیری وارد شوید
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="loginNationalId" className="text-sm text-slate-700 dark:text-slate-300">
                  کد ملی
                </Label>
                <Input
                  id="loginNationalId"
                  value={loginNationalId}
                  onChange={(e) => setLoginNationalId(e.target.value)}
                  placeholder="کد ملی 10 رقمی"
                  maxLength={10}
                  dir="ltr"
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trackingCode" className="text-sm text-slate-700 dark:text-slate-300">
                  شماره پیگیری
                </Label>
                <Input
                  id="trackingCode"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="شماره پیگیری"
                  dir="ltr"
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
              </div>

              <Button 
                onClick={handleLogin} 
                variant="outline" 
                className="w-full border-slate-300 dark:border-slate-700 py-5 sm:py-6 text-sm sm:text-base"
              >
                ورود
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-4">
            <p className="text-xs text-slate-500">
              © 1404 دانشگاه مازندران - تمامی حقوق محفوظ است
            </p>
          </div>
          </div>
        </div>
      </div>

      {/* Right Side - Announcements & Information (Sticky) */}
      <div className="w-full lg:w-2/5 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-700 h-auto lg:h-screen order-1 lg:order-2 flex flex-col">
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Announcements Section */}
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-slate-800 dark:text-slate-100">اطلاعیه‌ها</h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-3 sm:mb-4">آخرین اخبار و اطلاعیه‌های سامانه</p>
            </div>

            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 lg:mb-8">
              {loading ? (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-xs sm:text-sm text-slate-500">در حال بارگذاری...</p>
                </div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-xs sm:text-sm text-slate-500">اطلاعیه‌ای موجود نیست</p>
                </div>
              ) : (
                announcements.map((announcement) => (
                  <Card key={announcement.id} className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-slate-800">
                    <CardContent className="p-3 sm:p-4">
                      <h3 className="font-semibold mb-1 sm:mb-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                        {announcement.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 sm:line-clamp-3 mb-1 sm:mb-2">
                        {announcement.body}
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500">
                        {announcement.published_at 
                          ? new Date(announcement.published_at).toLocaleDateString('fa-IR')
                          : new Date(announcement.created_at).toLocaleDateString('fa-IR')}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Registration Information Accordion */}
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-slate-800 dark:text-slate-100 text-center">
                {roundTypes.find(t => t.value === selectedRoundType)?.label}
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {getRoundTypeContent(selectedRoundType).map((item, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`item-${index}`} 
                    className="border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                  >
                    <AccordionTrigger className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 hover:no-underline py-2 sm:py-3 px-0 text-right">
                      {item.title}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line pb-2 sm:pb-3 pt-0 px-0 text-right">
                      {item.content}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
