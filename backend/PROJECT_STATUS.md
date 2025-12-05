# ساختار کامل پروژه

## ✅ کامل شده

### 1. Models (مدل‌های داده)

#### apps/accounts/
- ✅ User (مدل سفارشی کاربر با کد ملی)
- ✅ ApplicantProfile (پروفایل داوطلب)

#### apps/core/
- ✅ University (دانشگاه‌ها)
- ✅ Faculty (دانشکده‌ها)
- ✅ Department (گروه‌های آموزشی)
- ✅ UniversityWeight (ضرایب دانشگاه‌ها)

#### apps/admissions/
- ✅ AdmissionRound (فراخوان‌های پذیرش)
- ✅ Program (رشته‌ها و گرایش‌ها)

#### apps/applications/
- ✅ Application (پرونده ثبت‌نام)
- ✅ ApplicationChoice (انتخاب‌های رشته)
- ✅ ApplicationEducationRecord (سوابق تحصیلی)
- ✅ ScientificRecord (سوابق علمی)

#### apps/documents/
- ✅ ApplicationDocument (مدارک آپلودی)

#### apps/workflow/
- ✅ FormReview (بررسی فرم‌ها)
- ✅ ApplicationWorkflowLog (گردش کار)

#### apps/content/
- ✅ Announcement (اطلاعیه‌ها)
- ✅ StaticPage (صفحات استاتیک)

### 2. Serializers

- ✅ accounts_serializers.py (User, Profile, Registration, Login)
- ✅ core_serializers.py (University, Faculty, Department)
- ✅ admissions_serializers.py (Round, Program)
- ✅ applications_serializers.py (Application, Choice, Records)
- ✅ documents_serializers.py (Document upload/review)
- ✅ workflow_serializers.py (FormReview, WorkflowLog)
- ✅ content_serializers.py (Announcement, StaticPage)

### 3. Authentication & Permissions

- ✅ JWT Authentication (SimpleJWT)
- ✅ Custom Permissions:
  - IsApplicant
  - IsAdmin
  - IsAdminOrReadOnly
  - IsOwnerOrAdmin
- ✅ Auth Views:
  - register_initial (ثبت‌نام اولیه)
  - login_applicant (ورود)
  - token_refresh (تمدید توکن)

### 4. Validators

- ✅ validate_file_size
- ✅ validate_image_file
- ✅ validate_pdf_file
- ✅ validate_national_id
- ✅ validate_mobile_number

### 5. Admin Panel

- ✅ تمام مدل‌ها در Django Admin قابل مدیریت هستند
- ✅ فیلترها و جستجوها
- ✅ Inline editing
- ✅ فارسی‌سازی

### 6. Settings & Configuration

- ✅ PostgreSQL Database
- ✅ JWT Configuration
- ✅ CORS Settings
- ✅ REST Framework Configuration
- ✅ API Documentation (drf-spectacular)
- ✅ Media & Static Files
- ✅ Security Settings

### 7. Documentation

- ✅ README.md کامل
- ✅ .env.example
- ✅ requirements.txt
- ✅ .gitignore

## 🚧 باید تکمیل شود

### API Views & Endpoints

برای تکمیل API، نیاز به ایجاد فایل‌های زیر است:

#### 1. Public API (`apps/api/public_views.py` & `public_urls.py`)
```python
# نمایش فراخوان‌های فعال
# نمایش رشته‌ها
# اطلاعیه‌ها
# صفحات استاتیک
```

#### 2. Applicant API (`apps/api/applicant_views.py` & `applicant_urls.py`)
```python
# مدیریت پروفایل
# مدیریت درخواست‌ها
# آپلود مدارک
# ثبت سوابق
# مشاهده وضعیت
```

#### 3. Admin API (`apps/api/admin_views.py` & `admin_urls.py`)
```python
# لیست و فیلتر پرونده‌ها
# بررسی پرونده‌ها
# تایید/رد فرم‌ها
# امتیازدهی
# خروجی اکسل
```

### Additional Features

- [ ] Pagination برای لیست‌ها
- [ ] Filtering پیشرفته
- [ ] Search در پرونده‌ها
- [ ] Export to Excel
- [ ] کپچا برای لاگین
- [ ] ارسال SMS/Email
- [ ] محاسبه امتیاز نهایی
- [ ] گزارش‌گیری

## نحوه ادامه کار

### مرحله 1: اجرای پروژه

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# تنظیم .env
cp .env.example .env
# ویرایش .env و تنظیم دیتابیس

# Migration
python manage.py makemigrations
python manage.py migrate

# ایجاد سوپریوزر
python manage.py createsuperuser

# اجرای سرور
python manage.py runserver
```

### مرحله 2: تست Admin Panel

1. برو به http://localhost:8000/admin/
2. وارد شو با اکانت سوپریوزر
3. داده‌های تستی اضافه کن:
   - دانشگاه‌ها
   - دانشکده‌ها
   - فراخوان
   - رشته‌ها

### مرحله 3: تست API

1. برو به http://localhost:8000/api/docs/
2. تست کن:
   - POST /api/auth/register/
   - POST /api/auth/login/

### مرحله 4: پیاده‌سازی باقی APIها

با توجه به نیاز، Views و URLs بقیه بخش‌ها را بنویس.

## ساختار فایل‌ها

```
backend/
├── apps/
│   ├── accounts/
│   │   ├── models.py         ✅
│   │   ├── admin.py          ✅
│   │   └── apps.py           ✅
│   ├── core/
│   │   ├── models.py         ✅
│   │   ├── admin.py          ✅
│   │   └── apps.py           ✅
│   ├── admissions/
│   │   ├── models.py         ✅
│   │   ├── admin.py          ✅
│   │   └── apps.py           ✅
│   ├── applications/
│   │   ├── models.py         ✅
│   │   ├── admin.py          ✅
│   │   └── apps.py           ✅
│   ├── documents/
│   │   ├── models.py         ✅
│   │   ├── admin.py          ✅
│   │   └── apps.py           ✅
│   ├── workflow/
│   │   ├── models.py         ✅
│   │   ├── admin.py          ✅
│   │   └── apps.py           ✅
│   ├── content/
│   │   ├── models.py         ✅
│   │   ├── admin.py          ✅
│   │   └── apps.py           ✅
│   └── api/
│       ├── __init__.py       ✅
│       ├── permissions.py    ✅
│       ├── validators.py     ✅
│       ├── auth_views.py     ✅
│       ├── auth_urls.py      ✅
│       ├── accounts_serializers.py    ✅
│       ├── core_serializers.py        ✅
│       ├── admissions_serializers.py  ✅
│       ├── applications_serializers.py ✅
│       ├── documents_serializers.py   ✅
│       ├── workflow_serializers.py    ✅
│       ├── content_serializers.py     ✅
│       ├── public_views.py   ⏳ TODO
│       ├── public_urls.py    ⏳ TODO
│       ├── applicant_views.py ⏳ TODO
│       ├── applicant_urls.py ⏳ TODO
│       ├── admin_views.py    ⏳ TODO
│       └── admin_urls.py     ⏳ TODO
├── config/
│   ├── settings.py           ✅
│   ├── urls.py               ✅
│   └── wsgi.py               ✅
├── .env.example              ✅
├── .gitignore                ✅
├── requirements.txt          ✅
├── README.md                 ✅
└── manage.py                 ✅
```

## یادداشت‌های مهم

1. **Migration**: قبل از اجرا حتماً migrate کن
2. **Media Files**: پوشه media/ برای آپلودها لازمه
3. **PostgreSQL**: حتماً دیتابیس PostgreSQL راه‌اندازی کن
4. **CORS**: برای Frontend باید CORS_ALLOWED_ORIGINS تنظیم بشه
5. **JWT**: توکن‌ها expire می‌شن، از refresh استفاده کن

## نکات امنیتی

- در production حتماً DEBUG=False
- SECRET_KEY را تغییر بده
- از HTTPS استفاده کن
- محدودیت Rate Limiting اضافه کن
- Logging راه‌اندازی کن

## تست

```bash
# ساخت و اجرای تست‌ها
python manage.py test

# Coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report
```

## Deployment

برای deploy روی production:

1. تنظیمات محیط production
2. Gunicorn/uWSGI
3. Nginx
4. PostgreSQL
5. Redis (برای cache)
6. Celery (برای taskهای async)
7. Monitoring & Logging
