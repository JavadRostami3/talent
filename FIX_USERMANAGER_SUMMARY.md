# رفع مشکل ایجاد سوپریوزر

## مشکل

خطا:
```
TypeError: UserManager.create_superuser() missing 1 required positional argument: 'username'
```

## راه‌حل انجام شده

✅ **UserManager سفارشی اضافه شد** به `backend/apps/accounts/models.py`

این UserManager:
- از `national_id` به جای `username` استفاده می‌کند
- متد `create_user` را override می‌کند
- متد `create_superuser` را override می‌کند

## دستورات بعدی

### 1. ایجاد سوپریوزر

```bash
cd backend
python manage.py createsuperuser
```

سپس اطلاعات را وارد کنید:
- **کد ملی**: 7702231543 (10 رقم)
- **نام**: javad
- **نام خانوادگی**: rostami  
- **موبایل**: 09372882573
- **ایمیل**: rostamii1378@gmail.com
- **Password**: [رمز عبور خود]
- **Password (again)**: [تکرار رمز عبور]

### 2. اضافه کردن اطلاعیه‌های نمونه

```bash
python add_announcements.py
```

### 3. راه‌اندازی سرور

```bash
python manage.py runserver
```

## فایل‌های تغییر یافته

1. ✅ `backend/apps/accounts/models.py` - UserManager اضافه شد

## فایل‌های راهنما

1. ✅ `backend/CREATE_SUPERUSER_GUIDE.md` - راهنمای کامل ایجاد سوپریوزر

## نکات مهم

- ⚠️ کد ملی باید دقیقاً 10 رقم باشد (بدون صفر اول اضافی)
- ⚠️ رمز عبور باید حداقل 8 کاراکتر باشد
- ✅ بعد از ایجاد سوپریوزر، می‌توانید به `/admin/` وارد شوید

## اگر هنوز مشکل دارید

اگر `createsuperuser` کار نکرد، از Django shell استفاده کنید:

```bash
python manage.py shell
```

```python
from apps.accounts.models import User

user = User.objects.create_superuser(
    national_id='7702231543',
    first_name='javad',
    last_name='rostami',
    email='rostamii1378@gmail.com',
    mobile='09372882573',
    password='YourPassword123!'
)

print(f"✅ سوپریوزر ایجاد شد!")
exit()
```

