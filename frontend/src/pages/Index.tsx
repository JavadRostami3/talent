import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import api from '@/services/api';
import type { RoundType } from '@/types/models';
import { Megaphone, ShieldCheck, Clock3, Users, FileCheck2 } from 'lucide-react';

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
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [selectedRoundType, setSelectedRoundType] = useState<RoundType>('MA_TALENT');

  const fetchAnnouncements = async () => {
    setLoadingAnnouncements(true);
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
      setLoadingAnnouncements(false);
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
  
  const goToRegister = () => {
    navigate('/register', { state: { roundType: selectedRoundType } });
  };

  const goToLogin = () => {
    navigate('/login');
  };

  const goToAnnouncements = () => {
    navigate('/announcements');
  };

  const roundTypes: { value: RoundType; label: string }[] = [
    { value: 'MA_TALENT', label: 'استعداد درخشان کارشناسی ارشد' },
    { value: 'PHD_TALENT', label: 'استعداد درخشان دکتری' },
    { value: 'PHD_EXAM', label: 'آزمون دکتری' },
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 h-16 lg:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/umz-logo.png"
              alt="دانشگاه مازندران"
              className="h-10 w-10 object-contain"
            />
            <div className="leading-tight">
              <p className="text-xs text-slate-500">دانشگاه مازندران</p>
              <p className="text-base lg:text-lg font-semibold text-slate-900">سامانه ثبت‌نام و مصاحبه</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={goToRegister} className="bg-blue-600 hover:bg-blue-700">
              ثبت‌نام
            </Button>
            <Button variant="outline" onClick={goToLogin} className="border-slate-300">
              ورود
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-8 lg:py-12 space-y-12">
        <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-blue-700 text-white p-6 lg:p-10 shadow-2xl shadow-blue-900/20 min-h-[320px] flex flex-col gap-6">
          <div className="flex flex-wrap gap-2 justify-start">
            {roundTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedRoundType(type.value)}
                className={`px-4 py-2 rounded-full border text-sm transition-all ${
                  selectedRoundType === type.value
                    ? 'bg-white text-blue-800 border-white'
                    : 'bg-white/10 text-white border-white/30 hover:bg-white/15'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20 w-max">
                <Megaphone className="h-4 w-4" />
                <span>اطلاع‌رسانی به‌روز فرآیندها</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold leading-[1.4]">
                {roundTypes.find((t) => t.value === selectedRoundType)?.label}
              </h1>
              <p className="text-base text-blue-100 leading-8">
                {roundTypeDescriptions[selectedRoundType]}
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-blue-100">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  احراز هویت ایمن
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-4 w-4" />
                  پیگیری مرحله‌به‌مرحله
                </span>
                <span className="inline-flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4" />
                  آپلود و بررسی مدارک
                </span>
              </div>
              <div>
                <Button size="lg" className="bg-white text-blue-800 hover:bg-slate-100 px-6" onClick={goToRegister}>
                  ثبت‌نام
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm space-y-3">
              <p className="text-sm text-blue-100">خلاصه شرایط</p>
              <div className="rounded-xl border border-white/25 bg-white/5 p-4 text-sm leading-7 text-white">
                {getRoundTypeContent(selectedRoundType)[0]?.content || 'جزئیات این مسیر به زودی اعلام می‌شود.'}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-xs text-blue-50">
                <div className="rounded-lg border border-white/20 p-3">
                  <p className="text-sm font-semibold text-white">۳ گام</p>
                  <p>ثبت، تکمیل، ارسال</p>
                </div>
                <div className="rounded-lg border border-white/20 p-3">
                  <p className="text-sm font-semibold text-white">اعلان‌ها</p>
                  <p>به‌روز و آنلاین</p>
                </div>
                <div className="rounded-lg border border-white/20 p-3">
                  <p className="text-sm font-semibold text-white">پشتیبانی</p>
                  <p>رفع نواقص</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="relative">
            <div className="bg-white border border-slate-200 shadow-xl shadow-slate-200/40 rounded-3xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">مرکز اطلاع‌رسانی</p>
                  <h3 className="text-lg font-semibold text-slate-900">آخرین تغییرات و پیام‌ها</h3>
                </div>
                <Button variant="outline" size="sm" className="border-slate-300" onClick={goToAnnouncements}>
                  مشاهده همه
                </Button>
              </div>

              <div className="space-y-3">
                {loadingAnnouncements ? (
                  <div className="space-y-2">
                    <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                    <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                  </div>
                ) : announcements.length === 0 ? (
                  <div className="text-sm text-slate-500 text-center py-6">
                    اطلاعیه‌ای موجود نیست
                  </div>
                ) : (
                  announcements.slice(0, 3).map((announcement) => (
                    <Card key={announcement.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-1">
                        <p className="text-xs text-slate-500">
                          {announcement.published_at 
                            ? new Date(announcement.published_at).toLocaleDateString('fa-IR')
                            : new Date(announcement.created_at).toLocaleDateString('fa-IR')}
                        </p>
                        <h4 className="text-sm font-semibold text-slate-900">{announcement.title}</h4>
                        <p className="text-xs text-slate-600 line-clamp-2">{announcement.body}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500 mb-1">گام‌ها</p>
                  <p className="text-lg font-bold text-slate-900">۳ مرحله‌ای</p>
                  <p className="text-[11px] text-slate-500">ثبت‌نام، تکمیل، ارسال</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500 mb-1">پشتیبانی</p>
                  <p className="text-lg font-bold text-slate-900">آنلاین</p>
                  <p className="text-[11px] text-slate-500">اعلان نواقص و پیام‌ها</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500 mb-1">مسیرها</p>
                  <p className="text-lg font-bold text-slate-900">۳ فراخوان</p>
                  <p className="text-[11px] text-slate-500">ارشد، دکتری</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-3">
              <p className="text-sm text-slate-500">معرفی مسیر انتخابی</p>
              <h3 className="text-lg font-semibold text-slate-900">
                {roundTypes.find((t) => t.value === selectedRoundType)?.label}
              </h3>
              <p className="text-sm text-slate-600 leading-7">
                {roundTypeDescriptions[selectedRoundType]}
              </p>
              <div className="text-xs text-slate-500">
                برای شروع ثبت‌نام یا ورود از دکمه‌های بالای صفحه استفاده کنید.
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500 mb-3">جزئیات مهم</p>
              <Accordion type="single" collapsible className="w-full">
                {getRoundTypeContent(selectedRoundType).map((item, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`item-${index}`} 
                    className="border-b border-slate-200 last:border-b-0"
                  >
                    <AccordionTrigger className="text-sm font-semibold text-slate-900 hover:no-underline py-2">
                      {item.title}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-slate-600 leading-relaxed whitespace-pre-line pb-3 pt-0">
                      {item.content}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">مراحل ثبت‌نام در یک نگاه</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: 'ثبت‌نام اولیه', desc: 'اطلاعات هویتی را وارد کنید و کد پیگیری دریافت کنید.', highlight: 'گام ۱' },
              { title: 'تکمیل پرونده', desc: 'مدارک را آپلود کرده و فرم‌های تحصیلی را تکمیل کنید.', highlight: 'گام ۲' },
              { title: 'ارسال و پیگیری', desc: 'نواقص را رفع کنید و وضعیت بررسی را آنلاین دنبال کنید.', highlight: 'گام ۳' },
            ].map((step, idx) => (
              <Card key={idx} className="border-slate-200">
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs text-blue-700">{step.highlight}</p>
                  <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                  <p className="text-sm text-slate-600 leading-6">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <div className="rounded-3xl bg-gradient-to-r from-blue-700 to-blue-500 text-white p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm text-blue-100">برای اقدام از دکمه‌های هدر استفاده کنید</p>
              <h3 className="text-2xl font-semibold">ثبت‌نام و ورود فقط از طریق هدر در دسترس است</h3>
            </div>
            <div className="text-sm text-blue-50">
              مسیر انتخابی: {roundTypes.find((t) => t.value === selectedRoundType)?.label}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
