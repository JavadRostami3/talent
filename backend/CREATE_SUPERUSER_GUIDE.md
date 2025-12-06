# راهنمای ایجاد سوپریوزر

## مشکل

خطا:
```
TypeError: UserManager.create_superuser() missing 1 required positional argument: 'username'
```

## راه‌حل

مشکل رفع شد! حالا باید به روش زیر سوپریوزر ایجاد کنید:

## روش 1: استفاده از دستور createsuperuser (پیشنهادی)

```bash
python manage.py createsuperuser
```

سپس اطلاعات زیر را وارد کنید:

```
کد ملی: 7702231543          (10 رقم - بدون صفر اول)
نام: javad
نام خانوادگی: rostami
موبایل: 09372882573
ایمیل: rostamii1378@gmail.com
Password: [رمز عبور خود را وارد کنید]
Password (again): [رمز عبور را دوباره وارد کنید]
```

### توجهات مهم:

1. **کد ملی**: باید دقیقاً 10 رقم باشد (بدون خط تیره یا فاصله)
2. **ایمیل**: اختیاری است اما بهتر است وارد کنید
3. **موبایل**: اختیاری است اما بهتر است وارد کنید
4. **Password**: باید حداقل 8 کاراکتر باشد (معمولاً)

## روش 2: ایجاد از طریق Django Shell

اگر دستور createsuperuser کار نکرد، می‌توانید از Django shell استفاده کنید:

```bash
python manage.py shell
```

سپس در shell:

```python
from apps.accounts.models import User

# ایجاد سوپریوزر
user = User.objects.create_superuser(
    national_id='7702231543',
    first_name='javad',
    last_name='rostami',
    email='rostamii1378@gmail.com',
    mobile='09372882573',
    password='رمز_عبور_شما'
)

print(f"سوپریوزر ایجاد شد: {user.national_id}")
exit()
```

## روش 3: استفاده از اسکریپت Python

می‌توانید یک فایل Python ایجاد کنید:

```python
# create_superuser_script.py
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User

user = User.objects.create_superuser(
    national_id='7702231543',
    first_name='javad',
    last_name='rostami',
    email='rostamii1378@gmail.com',
    mobile='09372882573',
    password='YourPassword123!'
)

print(f"✅ سوپریوزر با کد ملی {user.national_id} ایجاد شد!")
```

سپس اجرا کنید:
```bash
python create_superuser_script.py
```

## بررسی موفقیت

بعد از ایجاد سوپریوزر، بررسی کنید:

```bash
python manage.py shell
```

```python
from apps.accounts.models import User

# بررسی سوپریوزر
superuser = User.objects.filter(is_superuser=True).first()
if superuser:
    print(f"✅ سوپریوزر پیدا شد: {superuser.get_full_name()} ({superuser.national_id})")
    print(f"   - Is staff: {superuser.is_staff}")
    print(f"   - Is superuser: {superuser.is_superuser}")
    print(f"   - Role: {superuser.role}")
else:
    print("❌ سوپریوزر پیدا نشد")

exit()
```

## مشکل احتمالی: کد ملی تکراری

اگر خطای "کد ملی تکراری" دریافت کردید:

1. بررسی کنید که آیا کاربری با این کد ملی وجود دارد:
   ```python
   from apps.accounts.models import User
   User.objects.filter(national_id='7702231543').exists()
   ```

2. اگر وجود دارد و می‌خواهید آن را به سوپریوزر تبدیل کنید:
   ```python
   user = User.objects.get(national_id='7702231543')
   user.is_superuser = True
   user.is_staff = True
   user.role = 'SUPERADMIN'
   user.set_password('رمز_عبور_جدید')
   user.save()
   ```

## ورود به پنل ادمین

بعد از ایجاد سوپریوزر:

1. سرور را راه‌اندازی کنید:
   ```bash
   python manage.py runserver
   ```

2. به آدرس زیر بروید:
   ```
   http://localhost:8000/admin/
   ```

3. با کد ملی و رمز عبور وارد شوید

## نکات مهم

- ✅ کد ملی باید دقیقاً 10 رقم باشد
- ✅ رمز عبور باید قوی باشد (حداقل 8 کاراکتر)
- ✅ برای امنیت بیشتر، از رمز عبور پیچیده استفاده کنید
- ✅ بعد از اولین ورود، حتماً رمز عبور را تغییر دهید

