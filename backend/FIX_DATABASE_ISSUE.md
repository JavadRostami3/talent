# راهنمای رفع مشکل InconsistentMigrationHistory

## مشکل

خطا:
```
InconsistentMigrationHistory: Migration admin.0001_initial is applied before its dependency accounts.0001_initial
```

**علت:** دیتابیس قدیمی با migrations ناسازگار وجود دارد.

## راه‌حل: پاک کردن دیتابیس و شروع مجدد

### ⚠️ هشدار
این راه‌حل **تمام داده‌های موجود در دیتابیس را پاک می‌کند**. اگر داده مهم دارید، ابتدا بکاپ بگیرید.

## مراحل

### مرحله 1: توقف سرور (اگر در حال اجرا است)
Ctrl+C در ترمینالی که سرور در حال اجرا است.

### مرحله 2: پاک کردن دیتابیس

```bash
cd backend
del db.sqlite3
```

یا در PowerShell:
```powershell
Remove-Item db.sqlite3
```

### مرحله 3: اجرای Migrations از نو

```bash
python manage.py migrate
```

این دستور باید تمام جداول را از نو ایجاد کند.

### مرحله 4: بررسی وضعیت

```bash
python manage.py showmigrations
```

باید همه migrations با علامت `[X]` (اجرا شده) نمایش داده شوند.

### مرحله 5: ایجاد سوپریوزر

```bash
python manage.py createsuperuser
```

### مرحله 6: اضافه کردن اطلاعیه‌های نمونه

```bash
python add_announcements.py
```

### مرحله 7: راه‌اندازی سرور

```bash
python manage.py runserver
```

## اگر هنوز مشکل دارید

### راه‌حل جایگزین: Fake migrations

اگر نمی‌خواهید دیتابیس را پاک کنید، می‌توانید migration history را اصلاح کنید:

```bash
# 1. حذف migration history از جدول django_migrations
python manage.py shell
```

در shell:
```python
from django.db import connection
cursor = connection.cursor()
cursor.execute("DELETE FROM django_migrations WHERE app = 'accounts'")
cursor.execute("DELETE FROM django_migrations WHERE app = 'admin'")
exit()
```

سپس:
```bash
python manage.py migrate --fake-initial
```

⚠️ **توجه:** این روش پیچیده‌تر است و ممکن است مشکلات دیگری ایجاد کند. توصیه می‌شود از روش پاک کردن دیتابیس استفاده کنید.

## دستورات کامل (Copy-Paste)

```bash
cd backend
del db.sqlite3
python manage.py migrate
python manage.py createsuperuser
python add_announcements.py
python manage.py runserver
```

## بررسی موفقیت

بعد از اجرای دستورات، بررسی کنید:

1. **دیتابیس ایجاد شده:**
   ```bash
   dir db.sqlite3
   ```

2. **تعداد جداول:**
   ```bash
   python manage.py dbshell
   .tables
   .exit
   ```

3. **API کار می‌کند:**
   - باز کنید: http://localhost:8000/api/docs/
   - یا: http://localhost:8000/api/content/announcements/public/

## اگر خطاهای دیگری دریافت کردید

لطفاً خطای کامل را ارسال کنید تا بتوانم کمک بیشتری کنم.

