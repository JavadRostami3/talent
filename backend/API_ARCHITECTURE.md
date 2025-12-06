# معماری API و ساختار بک‌اند پروژه Talent

## نمای کلی معماری

پروژه Talent از معماری **ماژولار Django** با استفاده از **Django REST Framework** برای API استفاده می‌کند. ساختار به صورت تفکیک‌شده بین اپلیکیشن‌های دامنه (Domain Apps) و لایه API سازمان‌دهی شده است.

## ساختار پوشه‌بندی

```
backend/
├── config/                 # تنظیمات اصلی Django
│   ├── settings.py         # تنظیمات پروژه
│   ├── urls.py             # مسیریابی اصلی
│   └── wsgi.py/asgi.py     # Configuration برای deployment
│
├── apps/                   # اپلیکیشن‌های Django
│   ├── accounts/           # مدیریت کاربران و پروفایل
│   ├── core/               # داده‌های پایه (دانشگاه، دانشکده، گروه)
│   ├── admissions/         # فراخوان‌ها و برنامه‌های تحصیلی
│   ├── applications/       # درخواست‌های ثبت‌نام و انتخاب رشته
│   ├── documents/          # مدیریت مدارک
│   ├── workflow/           # گردش‌کار و فرآیند بررسی
│   ├── content/            # محتوا و اطلاعیه‌ها
│   │
│   └── api/                # لایه API مرکزی (ماژول کمکی)
│       ├── auth_views.py & auth_urls.py           # احراز هویت
│       ├── accounts_views.py & accounts_urls.py   # مدیریت کاربران
│       ├── applications_views.py & applications_urls.py  # مدیریت درخواست‌ها
│       ├── admin_views.py & admin_urls.py         # پنل‌های مدیریت
│       ├── research_views.py & research_urls.py   # سوابق پژوهشی
│       ├── content_views.py & content_urls.py     # محتوا و اطلاعیه
│       ├── core_views.py & core_urls.py           # API‌های داده پایه
│       └── *_serializers.py                       # Serializer‌ها
│
└── media/                  # فایل‌های آپلودشده
```

## فلسفه طراحی لایه API

### چرا ماژول `api` جداست؟

پروژه Talent از یک **لایه API متمرکز** استفاده می‌کند به دلایل زیر:

1. **تفکیک واضح منطق دامنه از منطق API**
   - مدل‌ها و منطق کسب‌وکار در اپلیکیشن‌های دامنه قرار دارند
   - View‌ها و Serializer‌های API در یک محل متمرکز

2. **سازگاری با معماری Clean Architecture**
   - اپلیکیشن‌های دامنه مستقل از جزئیات ارائه (REST API) هستند
   - امکان تغییر لایه API بدون تاثیر بر منطق دامنه

3. **تسهیل کار تیم**
   - توسعه‌دهندگان API می‌توانند روی پوشه `apps/api` کار کنند
   - توسعه‌دهندگان منطق کسب‌وکار روی اپلیکیشن‌های دامنه تمرکز دارند

### ساختار نام‌گذاری فایل‌ها

هر بخش عملکردی دارای دو فایل است:

- `{domain}_views.py`: شامل View‌های API (توابع یا کلاس‌ها)
- `{domain}_urls.py`: شامل مسیرهای URL مربوط به آن domain
- `{domain}_serializers.py`: شامل Serializer‌های مربوط به مدل‌های آن domain

**مثال:**
```python
# در applications_views.py
@api_view(['GET'])
def my_applications_list(request):
    # منطق لیست درخواست‌ها
    
# در applications_urls.py
urlpatterns = [
    path('applications/', my_applications_list, name='my-applications'),
]

# در applications_serializers.py
class ApplicationListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = [...]
```

## نقشه API Endpoints

### 1. Authentication (`/api/auth/`)
- `POST /api/auth/register/` - ثبت‌نام اولیه
- `POST /api/auth/login/` - ورود و دریافت JWT token
- `POST /api/auth/token/refresh/` - تمدید token

### 2. Accounts (`/api/accounts/`)
- `GET /api/accounts/profile/` - دریافت پروفایل کاربر
- `PUT /api/accounts/profile/` - به‌روزرسانی پروفایل
- `POST /api/accounts/change-password/` - تغییر رمز عبور

### 3. Applications (`/api/applications/`)
- `GET /api/applications/` - لیست درخواست‌های من
- `GET /api/applications/{id}/` - جزئیات یک درخواست
- `POST /api/applications/` - ایجاد درخواست جدید
- `PUT /api/applications/{id}/` - به‌روزرسانی درخواست
- `POST /api/applications/{id}/submit/` - ثبت نهایی درخواست
- `GET/POST/DELETE /api/applications/{id}/choices/` - مدیریت انتخاب رشته
- `GET/POST/PUT/DELETE /api/applications/{id}/education/` - مدیریت سوابق تحصیلی

### 4. Research Records (`/api/research/`)
Unified API برای تمام انواع سوابق پژوهشی:
- `GET /api/research/articles/` - لیست مقالات
- `POST /api/research/articles/` - افزودن مقاله
- `GET /api/research/patents/` - لیست اختراعات
- `POST /api/research/patents/` - افزودن اختراع
- سایر endpointها برای: `books/`, `conferences/`, `festivals/`, `theses/`

### 5. Admin Endpoints (`/api/admin/`)

**مسئول دانشگاه:**
- `GET /api/admin/university/applications/` - لیست درخواست‌ها
- `GET /api/admin/university/applications/{id}/` - جزئیات درخواست
- `POST /api/admin/university/applications/{id}/review/` - بررسی و تایید/رد

**مسئول دانشکده:**
- `GET /api/admin/faculty/applications/` - لیست درخواست‌های تایید‌شده دانشگاه
- `GET /api/admin/faculty/applications/{id}/` - جزئیات برای بررسی دانشکده
- `POST /api/admin/faculty/education/{id}/score/` - امتیازدهی سوابق تحصیلی
- `POST /api/admin/faculty/research/{id}/review/` - بررسی سوابق پژوهشی

### 6. Core Data (`/api/core/`)
- `GET /api/core/universities/` - لیست دانشگاه‌ها
- `GET /api/core/faculties/` - لیست دانشکده‌ها
- `GET /api/core/departments/` - لیست گروه‌های آموزشی

### 7. Content (`/api/content/`)
- `GET /api/content/announcements/` - اطلاعیه‌های عمومی
- `GET /api/content/announcements/{id}/` - جزئیات یک اطلاعیه

### 8. Programs (`/api/programs/`)
- `GET /api/programs/` - لیست برنامه‌های تحصیلی قابل انتخاب
- `GET /api/programs/{id}/` - جزئیات یک برنامه

## استراتژی احراز هویت و مجوزها

### احراز هویت (Authentication)
پروژه از **JWT (JSON Web Token)** با استفاده از `rest_framework_simplejwt` استفاده می‌کند:

```python
# نمونه هدر احراز هویت
Authorization: Bearer <access_token>
```

### سیستم نقش‌ها (Roles)

مدل `User` دارای فیلد `role` با انتخاب‌های زیر است:

```python
class User(AbstractUser):
    class Role(models.TextChoices):
        APPLICANT = 'APPLICANT', 'داوطلب'
        UNIVERSITY_ADMIN = 'UNIVERSITY_ADMIN', 'مسئول دانشگاه'
        FACULTY_ADMIN = 'FACULTY_ADMIN', 'مسئول دانشکده'
        SUPER_ADMIN = 'SUPER_ADMIN', 'مدیر کل'
```

### کلاس‌های Permission سفارشی

در `apps/api/permissions.py`:

```python
class IsApplicant(BasePermission):
    """فقط داوطلبان دسترسی دارند"""
    
class IsUniversityAdmin(BasePermission):
    """فقط مسئول دانشگاه دسترسی دارد"""
    
class IsFacultyAdmin(BasePermission):
    """فقط مسئول دانشکده دسترسی دارد"""
```

**استفاده در View:**
```python
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsApplicant])
def my_applications_list(request):
    # فقط کاربران احراز هویت‌شده با نقش داوطلب
    pass
```

## الگوهای طراحی استفاده‌شده

### 1. Function-Based Views (FBV)
اکثر endpoint‌ها از FBV استفاده می‌کنند:

```python
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_choices(request, application_id):
    if request.method == 'GET':
        # لیست انتخاب‌ها
    elif request.method == 'POST':
        # افزودن انتخاب جدید
```

**مزایا:**
- خوانایی بالا برای عملیات ساده
- کنترل دقیق منطق هر HTTP method

**نکته بهبود:** برای عملیات CRUD کامل، می‌توان به ViewSet‌ها مهاجرت کرد.

### 2. Serializer Strategy

**Serializer‌های جداگانه برای Read و Write:**

```python
# برای نمایش (Read) - شامل فیلدهای نمایشی و روابط تو در تو
class ApplicationDetailSerializer(serializers.ModelSerializer):
    choices = ApplicationChoiceSerializer(many=True, read_only=True)
    education_records = EducationRecordSerializer(many=True, read_only=True)
    
# برای ایجاد/ویرایش (Write) - فقط فیلدهای ورودی
class ApplicationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ['round', 'university_of_study']
```

این الگو از **بار اضافی در ورودی** و **under-fetching در خروجی** جلوگیری می‌کند.

### 3. Query Optimization

استفاده از `select_related` و `prefetch_related`:

```python
queryset = Application.objects.select_related(
    'applicant__user',
    'round',
).prefetch_related(
    'choices__program__faculty',
    'education_records'
)
```

**فواید:**
- کاهش تعداد query‌های دیتابیس (N+1 problem)
- بهبود سرعت پاسخ‌دهی API

## مدیریت Validation

### Validation در Serializer

```python
class ApplicationSubmitSerializer(serializers.Serializer):
    def validate(self, data):
        application = self.instance
        
        # بررسی وجود حداقل یک انتخاب رشته
        if not application.choices.exists():
            raise serializers.ValidationError("حداقل یک رشته باید انتخاب شود")
        
        # بررسی کامل بودن اطلاعات شخصی
        profile = application.applicant
        if not profile.first_name or not profile.last_name:
            raise serializers.ValidationError("اطلاعات شخصی ناقص است")
        
        return data
```

### Validation در Model

```python
class ApplicationChoice(models.Model):
    class Meta:
        unique_together = [
            ['application', 'priority'],  # یک اولویت در هر درخواست فقط یک بار
            ['application', 'program']     # یک برنامه در هر درخواست فقط یک بار
        ]
```

## Pagination و Filtering

### Pagination
پیش‌فرض: `PageNumberPagination` با سایز 20

```python
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
```

### Filtering در Admin Endpoints

```python
# فیلتر بر اساس query parameters
faculty_id = request.GET.get('faculty_id')
if faculty_id:
    queryset = queryset.filter(choices__program__faculty_id=faculty_id)

search = request.GET.get('search')
if search:
    queryset = queryset.filter(
        Q(applicant__user__national_id__icontains=search) |
        Q(applicant__user__first_name__icontains=search)
    )
```

## مدیریت خطاها

### استاندارد پاسخ خطا

```json
{
  "error": "پیام خطای فارسی قابل فهم برای کاربر",
  "detail": "جزئیات فنی (در حالت DEBUG)",
  "code": "error_code"
}
```

### استثناهای رایج

```python
# 404 - Not Found
return Response({'error': 'پرونده یافت نشد'}, status=status.HTTP_404_NOT_FOUND)

# 403 - Forbidden
return Response({'error': 'شما به این بخش دسترسی ندارید'}, status=status.HTTP_403_FORBIDDEN)

# 400 - Bad Request
return Response({'error': 'داده‌های ورودی نامعتبر'}, status=status.HTTP_400_BAD_REQUEST)
```

## Testing Strategy (پیشنهادی)

### Test Structure
```
backend/
└── apps/
    └── api/
        └── tests/
            ├── test_auth.py
            ├── test_applications.py
            ├── test_admin_views.py
            └── fixtures.py
```

### نمونه تست

```python
from rest_framework.test import APITestCase

class ApplicationAPITestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            national_id='1234567890',
            password='test_pass'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_list_my_applications(self):
        response = self.client.get('/api/applications/')
        self.assertEqual(response.status_code, 200)
```

## بهینه‌سازی‌های اعمال‌شده

### 1. Database Indexes
```python
class Application(models.Model):
    status = models.CharField(max_length=50, db_index=True)  # فیلتر مکرر
    university_review_status = models.CharField(max_length=30, db_index=True)
    tracking_code = models.CharField(max_length=10, unique=True)  # جستجو مکرر
```

### 2. Related Names صحیح
```python
# در ApplicationChoice
application = models.ForeignKey(Application, related_name='choices')

# استفاده:
application.choices.all()  # ✅ صحیح
# application.program_choices.all()  # ❌ منسوخ شده
```

### 3. Prefetch برای جلوگیری از N+1
```python
applications = Application.objects.prefetch_related(
    'choices__program__faculty'  # بارگذاری تمام روابط یکجا
)
```

## نکات امنیتی

### 1. محدودیت دسترسی بر اساس مالکیت

```python
# هر داوطلب فقط به پرونده‌های خود دسترسی دارد
applicant = ApplicantProfile.objects.get(user=request.user)
application = get_object_or_404(Application, id=application_id, applicant=applicant)
```

### 2. Validation ورودی‌ها

```python
# فیلتر کردن HTML tags
from django.utils.html import escape
comment = escape(request.data.get('comment'))
```

### 3. Rate Limiting (پیشنهادی)

```python
# در settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',
        'user': '1000/day'
    }
}
```

## Migration و Database Changes

### بعد از تغییرات مدل:

```bash
# ایجاد migration
python manage.py makemigrations

# بررسی SQL
python manage.py sqlmigrate applications 0001

# اعمال migrations
python manage.py migrate
```

### نکات مهم:
- همیشه قبل از migration در production، backup بگیرید
- برای تغییرات breaking (مثل افزودن unique_together)، ابتدا data cleanup انجام دهید

## مستندات API

### Swagger UI
پروژه از `drf-spectacular` استفاده می‌کند:

- **Schema:** `GET /api/schema/`
- **Swagger UI:** `GET /api/docs/`

### تولید مستندات بروز

```bash
python manage.py spectacular --file schema.yml
```

## Deployment Checklist

قبل از deploy در production:

- [ ] `DEBUG=False` در تنظیمات
- [ ] `SECRET_KEY` را در `.env` تنظیم کنید (نه در کد)
- [ ] `ALLOWED_HOSTS` را به دامنه واقعی محدود کنید
- [ ] تنظیمات امنیتی SSL/HTTPS را فعال کنید
- [ ] از دیتابیس PostgreSQL به جای SQLite استفاده کنید
- [ ] Static files را با `collectstatic` جمع‌آوری کنید
- [ ] Nginx/Apache را برای سرو فایل‌های media تنظیم کنید
- [ ] Logging را برای محیط production پیکربندی کنید

## منابع اضافی

- [Django REST Framework Documentation](https://www.django-rest-framework.org/)
- [Django Best Practices](https://docs.djangoproject.com/en/stable/misc/design-philosophies/)
- [Two Scoops of Django](https://www.feldroy.com/books/two-scoops-of-django-3-x) - کتاب توصیه‌شده

---

**نگارش:** نسخه 1.0  
**تاریخ به‌روزرسانی:** دسامبر 2025  
**نگهدارنده:** تیم توسعه پروژه Talent
