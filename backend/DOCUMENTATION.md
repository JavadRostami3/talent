# مستندات جامع سامانه ثبت‌نام تحصیلات تکمیلی

**تاریخ آخرین بروزرسانی:** 6 دسامبر 2025  
**نسخه:** 1.0 Final

---

## 📌 فهرست مطالب

1. [معرفی پروژه](#معرفی-پروژه)
2. [نصب و راه‌اندازی](#نصب-و-راه‌اندازی)
3. [معماری سیستم](#معماری-سیستم)
4. [API Documentation](#api-documentation)
5. [مدل‌های داده](#مدل‌های-داده)
6. [سیستم احراز هویت](#سیستم-احراز-هویت)
7. [سیستم دسترسی ادمین](#سیستم-دسترسی-ادمین)
8. [سیستم امتیازدهی و رتبه‌بندی](#سیستم-امتیازدهی-و-رتبه‌بندی)
9. [ماژول پرداخت](#ماژول-پرداخت)
10. [راهنمای توسعه](#راهنمای-توسعه)

---

## معرفی پروژه

سامانه جامع مدیریت فرآیند ثبت‌نام، بررسی مدارک و پذیرش دانشجویان تحصیلات تکمیلی شامل:

- ✅ استعداد درخشان کارشناسی ارشد
- ✅ استعداد درخشان دکتری  
- ✅ آزمون دکتری
- ✅ المپیاد علمی

### تکنولوژی‌ها

- **Backend Framework:** Django 5.0 + Django REST Framework
- **Database:** PostgreSQL
- **Authentication:** JWT (Simple JWT)
- **API Documentation:** drf-spectacular (Swagger)
- **Python Version:** 3.10+

### ویژگی‌های اصلی

#### برای داوطلبان:
- ثبت‌نام ساده با کد ملی
- ورود با کد ملی + کد پیگیری
- تکمیل پروفایل و اطلاعات تحصیلی
- انتخاب تا 3 رشته
- ثبت سوابق پژوهشی (اختیاری برای ارشد)
- بارگذاری مدارک
- پیگیری وضعیت پرونده

#### برای مدیران:
- مدیریت فراخوان‌ها
- بررسی و تایید مدارک
- امتیازدهی آموزشی (دستی توسط هیئت)
- امتیازدهی مصاحبه
- مشاهده امتیازات پژوهشی (محاسبه خودکار)
- محاسبه خودکار امتیاز نهایی
- اعلام نتایج پذیرش

---

## نصب و راه‌اندازی

### پیش‌نیازها

```bash
Python 3.10+
PostgreSQL 14+
pip
virtualenv (اختیاری)
```

### مراحل نصب

#### 1. کلون کردن پروژه

```bash
git clone https://github.com/JavadRostami3/talent.git
cd talent/backend
```

#### 2. ایجاد محیط مجازی

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

#### 3. نصب پکیج‌ها

```bash
pip install -r requirements.txt
```

#### 4. تنظیمات پایگاه داده

فایل `.env` ایجاد کنید:

```env
# Database
DB_NAME=talent_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# JWT
JWT_ACCESS_TOKEN_LIFETIME=60  # minutes
JWT_REFRESH_TOKEN_LIFETIME=1440  # minutes (24 hours)
```

#### 5. اجرای Migration

```bash
python manage.py makemigrations
python manage.py migrate
```

#### 6. ایجاد سوپریوزر

```bash
python manage.py createsuperuser
```

وارد کنید:
- کد ملی (10 رقم)
- نام
- نام خانوادگی
- موبایل (اختیاری)
- ایمیل (اختیاری)
- رمز عبور

#### 7. اجرای سرور

```bash
python manage.py runserver
```

سرور روی `http://localhost:8000` اجرا می‌شود.

---

## معماری سیستم

### ساختار پوشه‌ها

```
backend/
├── config/                 # تنظیمات Django
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── accounts/          # کاربران و پروفایل
│   ├── core/              # دانشگاه، دانشکده، گروه
│   ├── admissions/        # فراخوان‌ها و برنامه‌ها
│   ├── applications/      # درخواست‌ها و سوابق
│   ├── documents/         # مدارک
│   ├── workflow/          # گردش‌کار و بررسی مدارک
│   ├── content/           # اطلاعیه‌ها
│   ├── payments/          # پرداخت (اختیاری)
│   └── api/               # لایه API مرکزی
│       ├── auth_views.py & auth_urls.py
│       ├── accounts_views.py & accounts_urls.py
│       ├── applications_views.py & applications_urls.py
│       ├── admin_views.py & admin_urls.py
│       ├── research_views.py & research_urls.py
│       ├── content_views.py & content_urls.py
│       └── *_serializers.py
└── media/                  # فایل‌های آپلود
```

### فلسفه طراحی

- **لایه API متمرکز**: تفکیک واضح بین منطق دامنه و API
- **ماژولار**: هر app مسئولیت مشخصی دارد
- **Clean Architecture**: مدل‌ها مستقل از جزئیات ارائه هستند
- **RESTful**: API طبق استانداردهای REST طراحی شده

---

## API Documentation

### Base URL

```
http://localhost:8000/api/
```

### Authentication

تمام endpoint های محافظت‌شده نیاز به JWT Token دارند:

```http
Authorization: Bearer {access_token}
```

### Endpoints اصلی

#### 1. احراز هویت (`/api/auth/`)

```http
POST /api/auth/register/
POST /api/auth/login/
POST /api/auth/token/refresh/
```

**ثبت‌نام ساده (تغییر جدید):**
```json
POST /api/auth/register/
{
  "national_id": "1234567890",
  "round_type": "MA_TALENT",
  "first_name": "علی",        // اختیاری
  "last_name": "احمدی",       // اختیاری
  "mobile": "09123456789",    // اختیاری
  "email": "ali@example.com"  // اختیاری
}
```

**ورود:**
```json
POST /api/auth/login/
{
  "national_id": "1234567890",
  "tracking_code": "TRK-ABC123",
  "captcha": "5678"  // اختیاری
}
```

#### 2. پروفایل (`/api/accounts/`)

```http
GET    /api/accounts/profile/           # دریافت پروفایل
PATCH  /api/accounts/profile/update/    # ویرایش پروفایل
```

#### 3. درخواست‌های ثبت‌نام (`/api/applications/`)

```http
GET    /api/applications/                     # لیست درخواست‌ها
GET    /api/applications/{id}/                # جزئیات کامل
POST   /api/applications/{id}/choices/        # انتخاب رشته (حداکثر 3)
POST   /api/applications/{id}/submit/         # ثبت نهایی
GET    /api/applications/{id}/status/         # وضعیت پرونده
```

#### 4. سوابق پژوهشی (`/api/research/`)

```http
# مقالات مجله
POST   /api/research/articles/
GET    /api/research/articles/
PUT    /api/research/articles/{id}/
DELETE /api/research/articles/{id}/

# سایر سوابق
POST   /api/research/patents/
POST   /api/research/conferences/
POST   /api/research/books/
POST   /api/research/festivals/
POST   /api/research/thesis/
```

#### 5. مدارک (`/api/documents/`)

```http
POST   /api/documents/upload/
GET    /api/documents/
DELETE /api/documents/{id}/
```

#### 6. ادمین - بررسی درخواست‌ها (`/api/admin/`)

```http
# لیست درخواست‌ها
GET    /api/admin/university/applications/
GET    /api/admin/faculty/applications/

# بررسی توسط مسئول دانشگاه
POST   /api/admin/university/applications/{id}/review/

# بررسی توسط مسئول دانشکده
POST   /api/admin/faculty/applications/{id}/review/

# بررسی مدارک (جدید)
GET    /api/admin/applications/{id}/documents/
POST   /api/admin/applications/{id}/documents/
GET    /api/admin/applications/{id}/documents/status/
```

**نمونه بررسی مدارک:**
```json
POST /api/admin/applications/123/documents/
{
  "document_type": "IDENTITY_DOCS",  // یا EDUCATION_DOCS
  "status": "APPROVED",  // PENDING, APPROVED, APPROVED_WITH_DEFECT, REJECTED
  "comment": "مدارک شناسایی تایید شد",
  "defects": {}  // برای APPROVED_WITH_DEFECT
}
```

#### 7. اطلاعیه‌ها (`/api/content/`)

```http
# عمومی (بدون احراز هویت)
GET    /api/content/announcements/public/
GET    /api/content/announcements/latest/

# ادمین
GET    /api/content/announcements/
POST   /api/content/announcements/
PATCH  /api/content/announcements/{id}/
DELETE /api/content/announcements/{id}/
POST   /api/content/announcements/{id}/publish/
```

#### 8. دسترسی‌های ادمین (`/api/accounts/permissions/`)

```http
GET    /api/accounts/permissions/
POST   /api/accounts/permissions/
PATCH  /api/accounts/permissions/{id}/
DELETE /api/accounts/permissions/{id}/
```

---

## مدل‌های داده

### 1. User (کاربر)

```python
national_id         # کد ملی (unique, username)
first_name          # نام
last_name           # نام خانوادگی
father_name         # نام پدر
role                # نقش: APPLICANT, UNIVERSITY_ADMIN, FACULTY_ADMIN, SUPERADMIN
mobile              # موبایل
email               # ایمیل
gender              # جنسیت: MALE, FEMALE
birth_year          # سال تولد
military_status     # وضعیت نظام وظیفه (برای مردان)
```

### 2. Application (درخواست ثبت‌نام)

```python
tracking_code       # کد پیگیری (auto-generated)
applicant           # پروفایل داوطلب
round               # فراخوان
status              # وضعیت فرآیند
exam_rank           # رتبه آزمون دکتری (فقط PHD_EXAM)

# امتیازات
education_score     # امتیاز آموزشی (دستی)
research_score      # امتیاز پژوهشی (خودکار)
interview_score     # امتیاز مصاحبه (خودکار)
total_score         # جمع نهایی (خودکار)

# وضعیت‌های بررسی
university_review_status   # PENDING, APPROVED, REJECTED, ...
faculty_review_status      # PENDING, APPROVED, REJECTED, ...
admission_overall_status   # PENDING, ADMITTED, REJECTED, WAITLIST
```

### 3. انواع سوابق پژوهشی

```python
ResearchArticle     # مقالات مجله
Patent              # ثبت اختراع
ConferenceArticle   # مقالات کنفرانس
Book                # کتاب
FestivalAward       # جوایز جشنواره
MastersThesis       # پایان‌نامه ارشد
```

هر کدام دارای فیلدهای مخصوص و امتیاز خودکار هستند.

### 4. FormReview (بررسی مدارک)

```python
application         # درخواست
document_type       # IDENTITY_DOCS یا EDUCATION_DOCS
status              # PENDING, APPROVED, APPROVED_WITH_DEFECT, REJECTED
comment             # نظر بررسی‌کننده
defects             # موارد نقص (JSON)
reviewer            # بررسی‌کننده
reviewed_at         # زمان بررسی
```

### 5. Payment (پرداخت - اختیاری)

```python
tracking_code       # کد پیگیری (PAY-XXXXXX)
application         # درخواست
amount              # مبلغ (ریال)
status              # PENDING, PROCESSING, PAID, FAILED, ...
gateway             # SAMAN, MELLAT, ZARINPAL, ...
reference_number    # شماره پیگیری درگاه
transaction_id      # شماره تراکنش
paid_at             # زمان پرداخت
```

---

## سیستم احراز هویت

### نحوه کار

1. **ثبت‌نام ساده**: فقط کد ملی و نوع دوره الزامی است
2. **دریافت کد پیگیری**: سیستم یک tracking_code تولید می‌کند
3. **ورود**: با کد ملی + tracking_code
4. **JWT Token**: دریافت access_token و refresh_token
5. **تکمیل پروفایل**: بعد از ورود

### نمونه Flow

```javascript
// 1. ثبت‌نام
POST /api/auth/register/
{
  "national_id": "1234567890",
  "round_type": "MA_TALENT"
}

Response:
{
  "message": "ثبت‌نام با موفقیت انجام شد",
  "tracking_code": "TRK-ABC123",
  "application_id": 1
}

// 2. ورود
POST /api/auth/login/
{
  "national_id": "1234567890",
  "tracking_code": "TRK-ABC123"
}

Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJh...",
  "refresh": "eyJ0eXAiOiJKV1QiLC...",
  "user": {...}
}

// 3. استفاده از API
GET /api/accounts/profile/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJh...
```

---

## سیستم دسترسی ادمین

### انواع نقش‌ها

```python
APPLICANT         # داوطلب
UNIVERSITY_ADMIN  # مسئول دانشگاه
FACULTY_ADMIN     # مسئول دانشکده
SUPERADMIN        # سوپرادمین
```

### مدل AdminPermission

هر ادمین می‌تواند دسترسی‌های زیر داشته باشد:

```python
# دسترسی به نوع دوره‌ها
has_ma_talent_access: bool      # استعداد درخشان ارشد
has_phd_talent_access: bool     # استعداد درخشان دکتری
has_phd_exam_access: bool       # آزمون دکتری
has_olympiad_access: bool       # المپیاد

# دسترسی به دانشکده‌ها
faculties: ManyToMany           # خالی = همه دانشکده‌ها

# دسترسی به گروه‌ها
departments: ManyToMany         # خالی = همه گروه‌های دانشکده‌های انتخابی

# دسترسی کامل
has_full_access: bool           # برای سوپرادمین
```

### مدیریت دسترسی‌ها

```http
# ایجاد دسترسی برای ادمین
POST /api/accounts/permissions/
{
  "user": 2,
  "has_ma_talent_access": true,
  "has_phd_talent_access": false,
  "faculties": [1, 2],
  "departments": [],
  "has_full_access": false
}
```

---

## سیستم امتیازدهی و رتبه‌بندی

### فلسفه طراحی

سیستم امتیازدهی ترکیبی از **دستی** و **خودکار** است:

#### 1. امتیاز آموزشی (Education Score)
- **نحوه محاسبه:** دستی توسط هیئت علمی
- **دلیل:** نیاز به بررسی کیفی و نظر تخصصی
- **مدل:** `EducationScoring`
- **ورودی:** مسئول دانشگاه امتیاز را وارد می‌کند

#### 2. امتیاز پژوهشی (Research Score)
- **نحوه محاسبه:** خودکار
- **منبع:** جمع امتیاز تمام سوابق پژوهشی
- **متد:** `get_research_summary()`
- **شامل:** مقالات، پتنت، کتاب، کنفرانس، جوایز

#### 3. امتیاز مصاحبه (Interview Score)
- **نحوه محاسبه:** خودکار (جمع معیارها)
- **مدل:** `Interview` با معیارهای مختلف
- **فیلد:** `total_interview_score`

#### 4. جمع نهایی (Total Score)
- **نحوه محاسبه:** کاملاً خودکار
- **فرمول:** `education_score + research_score + interview_score`
- **متد:** `calculate_final_score()`

### کد نمونه

```python
def calculate_final_score(self):
    """محاسبه خودکار جمع امتیازات"""
    education_score = self.education_scoring.education_score
    research_score = self.get_research_summary()['total_score']
    interview_score = self.interview.total_interview_score
    
    self.total_score = education_score + research_score + interview_score
    self.save()
    return self.total_score
```

### جدول امتیازات

| بخش | نحوه محاسبه | مسئول | توضیحات |
|-----|-------------|-------|---------|
| آموزشی | دستی | هیئت علمی | بر اساس سوابق تحصیلی و معدل |
| پژوهشی | خودکار | سیستم | جمع امتیاز مقالات، پتنت، کتاب، ... |
| مصاحبه | خودکار | سیستم | جمع امتیاز معیارهای مصاحبه |
| **جمع کل** | **خودکار** | **سیستم** | **education + research + interview** |

---

## ماژول پرداخت

ماژول پرداخت **اختیاری** است و در صورت نیاز به دریافت هزینه ثبت‌نام می‌توان فعال کرد.

### فعال‌سازی

#### 1. اضافه کردن به INSTALLED_APPS

```python
# config/settings.py
INSTALLED_APPS = [
    # ...
    'apps.payments',
]
```

#### 2. اجرای Migration

```bash
python manage.py makemigrations payments
python manage.py migrate payments
```

#### 3. تنظیمات درگاه

```python
# settings.py
PAYMENT_GATEWAY = 'SAMAN'

SAMAN_MERCHANT_ID = 'your-merchant-id'
SAMAN_TERMINAL_ID = 'your-terminal-id'
```

### درگاه‌های پشتیبانی‌شده

- سامان (Saman)
- ملت (Mellat)
- پارسیان (Parsian)
- زرین‌پال (ZarinPal)
- آیدی‌پی (IDPay)

### API Endpoints (پیشنهادی)

```http
POST   /api/payments/create/              # ایجاد پرداخت
POST   /api/payments/verify/              # تایید پرداخت
GET    /api/payments/{tracking_code}/     # وضعیت پرداخت
GET    /api/payments/my-payments/         # لیست پرداخت‌ها
```

**توجه:** پیاده‌سازی اتصال به درگاه نیاز به کدنویسی اضافی دارد. راهنمای کامل در `apps/payments/README.md` موجود است.

---

## راهنمای توسعه

### اضافه کردن Endpoint جدید

#### 1. ایجاد View

```python
# apps/api/my_views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_endpoint(request):
    return Response({"message": "Hello"})
```

#### 2. ایجاد URL

```python
# apps/api/my_urls.py
from django.urls import path
from . import my_views

urlpatterns = [
    path('my-endpoint/', my_views.my_endpoint, name='my-endpoint'),
]
```

#### 3. اضافه به URL اصلی

```python
# config/urls.py
urlpatterns = [
    # ...
    path('api/my/', include('apps.api.my_urls')),
]
```

### اضافه کردن Validation

```python
# apps/api/validators.py
from rest_framework import serializers

def validate_something(value):
    if not condition:
        raise serializers.ValidationError("پیغام خطا")
    return value
```

### اضافه کردن Permission

```python
# apps/api/permissions.py
from rest_framework import permissions

class IsCustomRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'CUSTOM_ROLE'
```

### تست API

```bash
# با curl
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"national_id": "1234567890", "tracking_code": "TRK-ABC123"}'

# با httpie
http POST localhost:8000/api/auth/login/ \
  national_id=1234567890 \
  tracking_code=TRK-ABC123
```

---

## نکات مهم

### امنیت

1. **همیشه از HTTPS استفاده کنید** (در production)
2. **SECRET_KEY را در .env نگه دارید**
3. **DEBUG=False در production**
4. **مبلغ پرداخت را از سمت سرور محاسبه کنید**
5. **تمام ورودی‌های کاربر را validate کنید**

### Performance

1. **از select_related و prefetch_related استفاده کنید**
2. **Pagination برای لیست‌های بزرگ**
3. **Indexing روی فیلدهای جستجو**
4. **Cache برای query های پرتکرار**

### Best Practices

1. **کد تمیز و خوانا بنویسید**
2. **از docstring استفاده کنید**
3. **نام‌گذاری معنادار**
4. **DRY (Don't Repeat Yourself)**
5. **تست بنویسید**

---

## پشتیبانی

برای سوالات و مشکلات:

- **Issues:** https://github.com/JavadRostami3/talent/issues
- **Email:** rostamii1378@gmail.com

---

## تاریخچه تغییرات

### نسخه 1.0 (6 دسامبر 2025)

✅ **تکمیل شده:**
- ساده‌سازی ثبت‌نام اولیه (فقط کد ملی الزامی)
- فعال‌سازی مدل FormReview با 3 endpoint جدید
- ایجاد ماژول کامل پرداخت (اختیاری)
- رفع 11 مورد کاستی شناسایی‌شده
- مستندات جامع

✅ **ویژگی‌های اصلی:**
- احراز هویت با JWT
- سیستم دسترسی پیشرفته ادمین
- سیستم امتیازدهی ترکیبی (دستی + خودکار)
- بررسی مدارک دو مرحله‌ای
- گردش‌کار کامل از ثبت‌نام تا پذیرش
- API های RESTful کامل

---

**پایان مستندات** 🎉
