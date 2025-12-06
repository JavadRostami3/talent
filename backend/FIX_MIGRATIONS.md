# راهنمای رفع مشکلات Migrations و راه‌اندازی پروژه

## مشکلات شناسایی شده و راه‌حل‌ها

### ✅ مشکلات حل شده:

1. **فایل `add_announcements.py`**: اصلاح شد (فیلدهای صحیح استفاده می‌شود)
2. **Interface های فرانت**: هماهنگ شدند با مدل‌های بک‌اند
3. **API endpoints**: اصلاح شدند
4. **فولدرهای migrations**: ایجاد شدند برای همه اپ‌ها

### 📋 مراحل بعدی (باید خودتان انجام دهید):

## مرحله 1: ایجاد Migrations

```bash
cd backend
python manage.py makemigrations
```

این دستور باید migrations برای همه اپ‌ها ایجاد کند:
- accounts
- core
- admissions
- applications
- documents
- workflow
- content

## مرحله 2: اجرای Migrations

```bash
python manage.py migrate
```

این دستور جداول دیتابیس را ایجاد می‌کند.

## مرحله 3: ایجاد سوپریوزر (اختیاری)

```bash
python manage.py createsuperuser
```

## مرحله 4: اضافه کردن اطلاعیه‌های نمونه

```bash
python add_announcements.py
```

این دستور اطلاعیه‌های نمونه را به دیتابیس اضافه می‌کند.

## مرحله 5: راه‌اندازی سرور

```bash
python manage.py runserver
```

## مشکلات احتمالی و راه‌حل

### اگر "No changes detected" دریافت کردید:

1. بررسی کنید که فولدر `migrations` برای همه اپ‌ها وجود دارد
2. بررسی کنید که `__init__.py` در هر فولدر migrations وجود دارد
3. اگر دیتابیس قبلی دارید، ممکن است نیاز به حذف `db.sqlite3` باشد (اگر داده مهم ندارید):

```bash
# ⚠️ هشدار: این دستور تمام داده‌های دیتابیس را پاک می‌کند!
del db.sqlite3
python manage.py migrate
```

### اگر خطای "no such table" دریافت کردید:

این یعنی migrations اجرا نشده است. دستورات زیر را به ترتیب اجرا کنید:

```bash
python manage.py makemigrations
python manage.py migrate
```

### اگر خطای ForeignKey دریافت کردید:

ممکن است نیاز به اجرای migrations به ترتیب خاص باشد. ابتدا اپ‌های پایه را migrate کنید:

```bash
python manage.py migrate accounts
python manage.py migrate core
python manage.py migrate admissions
python manage.py migrate applications
python manage.py migrate documents
python manage.py migrate workflow
python manage.py migrate content
```

یا همه را با یک دستور:

```bash
python manage.py migrate
```

## بررسی وضعیت Migrations

برای بررسی اینکه کدام migrations اجرا شده:

```bash
python manage.py showmigrations
```

اگر برخی migrations اعمال نشده باشند، با `[ ]` مشخص می‌شوند.

## تغییرات انجام شده در کد

### Backend:

1. **`add_announcements.py`**: اصلاح شد تا از فیلدهای صحیح مدل استفاده کند
2. **فولدرهای migrations**: ایجاد شدند برای همه اپ‌ها

### Frontend:

1. **`frontend/src/pages/Index.tsx`**: 
   - Interface اصلاح شد (`body` به جای `content`, `is_published` به جای `is_active`)
   - استفاده از endpoint `/api/content/announcements/public/`

2. **`frontend/src/pages/Announcements.tsx`**: 
   - به API متصل شد
   - از endpoint عمومی استفاده می‌کند

## تست API

بعد از راه‌اندازی سرور، می‌توانید API را تست کنید:

```bash
# دریافت اطلاعیه‌های عمومی
curl http://localhost:8000/api/content/announcements/public/

# مستندات API (Swagger)
# باز کنید در مرورگر: http://localhost:8000/api/docs/
```

## نکات مهم

1. همیشه قبل از `migrate` ابتدا `makemigrations` را اجرا کنید
2. اگر دیتابیس را پاک می‌کنید، تمام داده‌ها از بین می‌روند
3. بعد از تغییرات در models، حتماً `makemigrations` و سپس `migrate` را اجرا کنید

