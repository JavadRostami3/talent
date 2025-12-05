# سامانه ثبت‌نام و مصاحبه تحصیلات تکمیلی

## نسخه 0.1

سامانه جامع مدیریت فرآیند ثبت‌نام، بررسی مدارک و پذیرش دانشجویان تحصیلات تکمیلی شامل:
- استعداد درخشان کارشناسی ارشد
- استعداد درخشان دکتری  
- آزمون دکتری
- المپیاد علمی

## تکنولوژی‌ها

- **Backend Framework:** Django 5.0 + Django REST Framework
- **Database:** PostgreSQL
- **Authentication:** JWT (Simple JWT)
- **API Documentation:** drf-spectacular (Swagger)
- **Python Version:** 3.10+

## ویژگی‌های اصلی

### برای داوطلبان:
- ✅ ثبت‌نام اولیه با کد ملی
- ✅ ورود با کد ملی + کد پیگیری + کپچا
- ✅ تکمیل فرم‌های ۱، ۲ و ۳
- ✅ بارگذاری مدارک (عکس، کارت ملی، مدارک تحصیلی)
- ✅ ثبت سوابق تحصیلی و علمی
- ✅ پیگیری وضعیت پرونده
- ✅ مشاهده نتیجه پذیرش

### برای مدیران:
- ✅ مدیریت فراخوان‌ها
- ✅ بررسی و تایید پرونده‌ها
- ✅ مدیریت دانشگاه‌ها و دانشکده‌ها
- ✅ تعیین ضرایب دانشگاه
- ✅ امتیازدهی و رتبه‌بندی
- ✅ اعلام نتایج پذیرش
- ✅ گزارش‌گیری از پرونده‌ها

## ساختار پروژه

```
backend/
├── config/                 # تنظیمات Django
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── accounts/          # کاربران و پروفایل داوطلبان
│   ├── core/              # دانشگاه، دانشکده، گروه
│   ├── admissions/        # فراخوان‌ها و برنامه‌های تحصیلی
│   ├── applications/      # پرونده‌های ثبت‌نام
│   ├── documents/         # مدارک آپلودی
│   ├── workflow/          # گردش کار و بررسی فرم‌ها
│   ├── content/           # اطلاعیه‌ها و صفحات
│   └── api/               # Serializers و Views
├── media/                 # فایل‌های آپلودی
├── manage.py
└── requirements.txt
```

## نصب و راه‌اندازی

### 1. پیش‌نیازها

- Python 3.10 یا بالاتر
- PostgreSQL 13 یا بالاتر
- pip و virtualenv

### 2. کلون کردن پروژه

```bash
git clone <repository-url>
cd backend
```

### 3. ایجاد محیط مجازی

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 4. نصب وابستگی‌ها

```bash
pip install -r requirements.txt
```

### 5. تنظیمات پایگاه داده

یک دیتابیس PostgreSQL بسازید:

```sql
CREATE DATABASE talent_db;
CREATE USER talent_user WITH PASSWORD 'your_password';
ALTER ROLE talent_user SET client_encoding TO 'utf8';
ALTER ROLE talent_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE talent_user SET timezone TO 'Asia/Tehran';
GRANT ALL PRIVILEGES ON DATABASE talent_db TO talent_user;
```

### 6. فایل .env

فایل `.env.example` را کپی کرده و `.env` بنامید و مقادیر را تنظیم کنید:

```bash
cp .env.example .env
```

محتوای `.env`:

```env
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=talent_db
DB_USER=talent_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# JWT
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 7. اجرای Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 8. ایجاد سوپریوزر

```bash
python manage.py createsuperuser
```

### 9. جمع‌آوری فایل‌های استاتیک

```bash
python manage.py collectstatic --noinput
```

### 10. اجرای سرور

```bash
python manage.py runserver
```

سرور روی `http://localhost:8000` اجرا می‌شود.

## دسترسی به پنل‌ها

- **پنل ادمین Django:** http://localhost:8000/admin/
- **مستندات API (Swagger):** http://localhost:8000/api/docs/
- **Schema API:** http://localhost:8000/api/schema/

## API Endpoints (پیشنهادی)

### احراز هویت
```
POST /api/auth/register/      # ثبت‌نام اولیه
POST /api/auth/login/          # ورود به سامانه
POST /api/auth/refresh/        # تمدید توکن
```

### عمومی
```
GET /api/public/rounds/        # لیست فراخوان‌های فعال
GET /api/public/programs/      # لیست رشته‌ها
GET /api/public/announcements/ # اطلاعیه‌ها
GET /api/public/pages/{slug}/  # صفحات استاتیک
```

### داوطلب
```
GET /api/applicant/profile/              # مشاهده پروفایل
PUT /api/applicant/profile/              # ویرایش پروفایل
GET /api/applicant/applications/         # لیست درخواست‌ها
GET /api/applicant/applications/{id}/    # جزئیات درخواست
PUT /api/applicant/applications/{id}/    # ویرایش درخواست
POST /api/applicant/applications/{id}/submit/  # ارسال نهایی

# سوابق تحصیلی
GET/POST /api/applicant/applications/{id}/education-records/

# سوابق علمی  
GET/POST /api/applicant/applications/{id}/scientific-records/

# مدارک
GET/POST /api/applicant/applications/{id}/documents/

# وضعیت پذیرش
GET /api/applicant/applications/{id}/status/
```

### مدیریت
```
GET /api/admin/applications/              # لیست پرونده‌ها
GET /api/admin/applications/{id}/         # جزئیات پرونده
POST /api/admin/applications/{id}/review/ # بررسی پرونده
POST /api/admin/applications/{id}/final-decision/  # تصمیم نهایی

# گردش کار
GET/POST /api/admin/applications/{id}/workflow/
GET/POST /api/admin/applications/{id}/form-reviews/

# خروجی اکسل
GET /api/admin/export/applications/
```

## مدل‌های داده

### User (کاربران)
- کد ملی (USERNAME_FIELD)
- نام و نام خانوادگی
- نقش (APPLICANT, ADMIN, SUPERADMIN)
- موبایل، ایمیل

### Application (پرونده ثبت‌نام)
- داوطلب
- فراخوان
- کد پیگیری (یکتا)
- وضعیت
- امتیاز نهایی
- گروه رتبه
- وضعیت پذیرش

### ApplicationChoice (انتخاب رشته)
- پرونده
- برنامه تحصیلی
- اولویت
- وضعیت پذیرش

### ApplicationEducationRecord (سوابق تحصیلی)
- مقطع تحصیلی
- دانشگاه
- رشته
- معدل، رتبه کلاس

### ApplicationDocument (مدارک)
- نوع مدرک
- فایل
- وضعیت بررسی

### FormReview (بررسی فرم‌ها)
- شماره فرم (۱، ۲، ۳)
- وضعیت (کامل، ناقص، رد شده)
- نواقص

## امنیت

- ✅ احراز هویت با JWT
- ✅ سطوح دسترسی (Applicant, Admin, SuperAdmin)
- ✅ اعتبارسنجی داده‌ها
- ✅ محدودیت حجم فایل
- ✅ فرمت‌های مجاز برای آپلود

## توسعه

### اضافه کردن یک Model جدید

1. مدل را در `apps/<app_name>/models.py` تعریف کنید
2. Serializer را در `apps/api/<app_name>_serializers.py` بسازید
3. View/ViewSet را بنویسید
4. URL را در `config/urls.py` اضافه کنید
5. Migration بسازید و اجرا کنید

### تست API

از Swagger UI استفاده کنید:
http://localhost:8000/api/docs/

یا از curl/Postman:

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"national_id": "1234567890", "tracking_code": "ABC123"}'

# با استفاده از token
curl -X GET http://localhost:8000/api/applicant/profile/ \
  -H "Authorization: Bearer <your_access_token>"
```

## مشارکت

لطفاً قبل از هر تغییری:

1. یک branch جدید بسازید
2. تست‌ها را اجرا کنید
3. کد را format کنید
4. Pull Request ارسال کنید

## لایسنس

این پروژه تحت لایسنس MIT منتشر شده است.

## پشتیبانی

برای سوالات و مشکلات:
- Issue در GitHub باز کنید
- ایمیل: support@example.com

## نسخه‌ها

- **v0.1** - نسخه اولیه (دسامبر 2024)
  - پیاده‌سازی مدل‌ها
  - احراز هویت JWT
  - پنل ادمین Django
  - API اولیه
