# بررسی آماده‌سازی ثبت‌نام

## ✅ مواردی که آماده هستند

### 1. API Endpoint
- ✅ `/api/auth/register/` وجود دارد
- ✅ در `backend/apps/api/auth_views.py` پیاده‌سازی شده
- ✅ Serializer در `backend/apps/api/accounts_serializers.py` وجود دارد

### 2. Frontend
- ✅ صفحه `Register.tsx` وجود دارد
- ✅ به endpoint صحیح متصل است: `/api/auth/register/`
- ✅ Validation ها وجود دارد

### 3. Models
- ✅ User model آماده است
- ✅ ApplicantProfile آماده است
- ✅ Application model آماده است

## ⚠️ مورد نیاز قبل از تست

برای اینکه ثبت‌نام کار کند، **باید یک فراخوان فعال در دیتابیس وجود داشته باشد!**

### چرا؟

API در خط 63-66 از `auth_views.py` بررسی می‌کند:
```python
round_obj = AdmissionRound.objects.get(
    type=data['round_type'],
    is_active=True
)
```

اگر فراخوان فعالی نباشد، خطا می‌دهد:
```
{'error': 'فراخوان فعالی برای این نوع یافت نشد'}
```

## راه‌حل: ایجاد فراخوان تست

### روش 1: از Django Admin

1. سرور را راه‌اندازی کنید:
   ```bash
   python manage.py runserver
   ```

2. به پنل ادمین بروید:
   ```
   http://localhost:8000/admin/
   ```

3. با سوپریوزر وارد شوید

4. به بخش "فراخوان‌های پذیرش" بروید

5. یک فراخوان جدید ایجاد کنید:
   - **عنوان**: "فراخوان استعداد درخشان ارشد 1404"
   - **سال**: 1404
   - **نوع فراخوان**: استعداد درخشان کارشناسی ارشد (MA_TALENT)
   - **شروع ثبت‌نام**: تاریخ امروز
   - **پایان ثبت‌نام**: تاریخ آینده
   - **فعال**: ✅ تیک بزنید

6. ذخیره کنید

### روش 2: از Django Shell

```bash
python manage.py shell
```

```python
from apps.admissions.models import AdmissionRound
from django.utils import timezone
from datetime import timedelta

# ایجاد فراخوان MA_TALENT
round_ma = AdmissionRound.objects.create(
    title="فراخوان استعداد درخشان ارشد 1404",
    year=1404,
    type='MA_TALENT',
    description='فراخوان تست',
    registration_start=timezone.now(),
    registration_end=timezone.now() + timedelta(days=30),
    is_active=True
)
print(f"✅ فراخوان MA_TALENT ایجاد شد: {round_ma.id}")

# ایجاد فراخوان PHD_TALENT
round_phd = AdmissionRound.objects.create(
    title="فراخوان استعداد درخشان دکتری 1404",
    year=1404,
    type='PHD_TALENT',
    description='فراخوان تست',
    registration_start=timezone.now(),
    registration_end=timezone.now() + timedelta(days=30),
    is_active=True
)
print(f"✅ فراخوان PHD_TALENT ایجاد شد: {round_phd.id}")

exit()
```

### روش 3: فایل Python

می‌توانید یک فایل `create_test_rounds.py` در پوشه backend ایجاد کنید:

```python
import os
import django
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.admissions.models import AdmissionRound

# ایجاد فراخوان‌های تست
rounds_data = [
    {
        'title': 'فراخوان استعداد درخشان ارشد 1404',
        'year': 1404,
        'type': 'MA_TALENT',
        'description': 'فراخوان تستی برای استعداد درخشان ارشد'
    },
    {
        'title': 'فراخوان استعداد درخشان دکتری 1404',
        'year': 1404,
        'type': 'PHD_TALENT',
        'description': 'فراخوان تستی برای استعداد درخشان دکتری'
    },
    {
        'title': 'فراخوان آزمون دکتری 1404',
        'year': 1404,
        'type': 'PHD_EXAM',
        'description': 'فراخوان تستی برای آزمون دکتری'
    },
    {
        'title': 'فراخوان المپیاد علمی 1404',
        'year': 1404,
        'type': 'OLYMPIAD',
        'description': 'فراخوان تستی برای المپیاد علمی'
    },
]

for data in rounds_data:
    round_obj, created = AdmissionRound.objects.get_or_create(
        year=data['year'],
        type=data['type'],
        defaults={
            **data,
            'registration_start': timezone.now(),
            'registration_end': timezone.now() + timedelta(days=30),
            'is_active': True
        }
    )
    if created:
        print(f"✅ {data['title']} ایجاد شد")
    else:
        round_obj.is_active = True
        round_obj.save()
        print(f"🔄 {data['title']} فعال شد")

print("\n🎉 تمام فراخوان‌های تست آماده هستند!")
```

سپس اجرا کنید:
```bash
python create_test_rounds.py
```

## بررسی آماده بودن

بعد از ایجاد فراخوان‌ها، بررسی کنید:

```bash
python manage.py shell
```

```python
from apps.admissions.models import AdmissionRound

# بررسی فراخوان‌های فعال
active_rounds = AdmissionRound.objects.filter(is_active=True)
print(f"تعداد فراخوان‌های فعال: {active_rounds.count()}")

for round_obj in active_rounds:
    print(f"✅ {round_obj.title} ({round_obj.type})")

exit()
```

## تست ثبت‌نام

بعد از ایجاد فراخوان‌ها:

1. **سرور بک‌اند را راه‌اندازی کنید:**
   ```bash
   python manage.py runserver
   ```

2. **فرانت را راه‌اندازی کنید** (در ترمینال دیگر):
   ```bash
   cd frontend
   npm run dev
   ```

3. **به صفحه ثبت‌نام بروید:**
   - http://localhost:8080/register

4. **فرم را پر کنید و ثبت‌نام کنید**

5. **بررسی کنید که در دیتابیس ذخیره شده:**
   ```bash
   python manage.py shell
   ```
   ```python
   from apps.accounts.models import User
   from apps.applications.models import Application
   
   # بررسی کاربران
   users = User.objects.all()
   print(f"تعداد کاربران: {users.count()}")
   
   # بررسی پرونده‌ها
   apps = Application.objects.all()
   print(f"تعداد پرونده‌ها: {apps.count()}")
   
   for app in apps:
       print(f"✅ پرونده: {app.tracking_code} - {app.applicant.user.get_full_name()}")
   
   exit()
   ```

## مشکلات احتمالی

### خطا: "فراخوان فعالی برای این نوع یافت نشد"
- ✅ راه‌حل: یک فراخوان فعال با `type` مورد نظر ایجاد کنید

### خطا: "کد ملی نامعتبر است"
- ✅ راه‌حل: از یک کد ملی معتبر 10 رقمی استفاده کنید

### خطا: CORS
- ✅ راه‌حل: بررسی کنید که CORS در settings.py درست تنظیم شده

## نتیجه

بعد از ایجاد فراخوان‌های تست، ثبت‌نام باید کار کند! ✅

