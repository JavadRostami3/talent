# راهنمای دیپلوی پروژه روی سرور لینوکسی

## مشخصات سرور
- **IP:** 81.22.134.84
- **User:** root
- **OS:** Linux

---

## 🔧 مرحله 1: نصب پیش‌نیازها

### 1.1. اتصال به سرور
```bash
ssh root@81.22.134.84
```

### 1.2. به‌روزرسانی سیستم
```bash
apt update && apt upgrade -y
```

### 1.3. نصب Python و pip
```bash
apt install -y python3 python3-pip python3-venv
python3 --version  # باید 3.8+ باشد
```

### 1.4. نصب Node.js و npm (برای فرانت‌اند)
```bash
# نصب Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# بررسی نسخه
node --version  # باید v20.x باشد
npm --version
```

### 1.5. نصب Git
```bash
apt install -y git
```

### 1.6. نصب Nginx (وب سرور)
```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### 1.7. نصب Supervisor (برای مدیریت Django)
```bash
apt install -y supervisor
systemctl start supervisor
systemctl enable supervisor
```

---

## 📦 مرحله 2: کلون پروژه

### 2.1. رفتن به مسیر مناسب
```bash
cd /var/www
```

### 2.2. کلون پروژه از GitHub
```bash
git clone https://github.com/JavadRostami3/talent.git
cd talent
```

### 2.3. بررسی فایل‌ها
```bash
ls -la
# باید backend/ و frontend/ را ببینید
```

---

## 🐍 مرحله 3: راه‌اندازی Backend (Django)

### 3.1. رفتن به مسیر backend
```bash
cd /var/www/talent/backend
```

### 3.2. ایجاد محیط مجازی Python
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3.3. نصب وابستگی‌های Python
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3.4. ایجاد فایل .env
```bash
nano .env
```

محتوای فایل `.env`:
```env
DEBUG=False
SECRET_KEY=your-super-secret-key-change-this-in-production-$(openssl rand -base64 32)
ALLOWED_HOSTS=81.22.134.84,localhost,127.0.0.1,*

# Database (SQLite - در production بهتر است PostgreSQL استفاده کنید)
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

# CORS
CORS_ALLOWED_ORIGINS=http://81.22.134.84,http://81.22.134.84:3000
```

**نکته مهم:** استفاده از `*` در `ALLOWED_HOSTS` همه هاست‌ها را قبول می‌کند. در production بهتر است فقط IP و دامنه خاص را وارد کنید.

برای خروج: `Ctrl+X`, سپس `Y`, سپس `Enter`

### 3.5. اجرای Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 3.6. جمع‌آوری فایل‌های Static
```bash
python manage.py collectstatic --noinput
```

### 3.7. ساخت Superuser
```bash
python manage.py createsuperuser
```
- **کد ملی:** یک کد ملی 10 رقمی وارد کنید (مثلاً: `0123456789`)
- **رمز عبور:** یک رمز قوی وارد کنید
- **نام:** نام خود را وارد کنید
- **نام خانوادگی:** نام خانوادگی خود را وارد کنید

### 3.8. اصلاح کردن is_staff برای ادمین‌ها
```bash
python manage.py fix_admin_users
```

### 3.9. تست اجرای Backend
```bash
python manage.py runserver 0.0.0.0:8000
```

در مرورگر باز کنید: `http://81.22.134.84:8000/api/`

اگر کار کرد، با `Ctrl+C` متوقفش کنید.

---

## 🚀 مرحله 4: راه‌اندازی Backend با Gunicorn

### 4.1. نصب Gunicorn
```bash
source /var/www/talent/backend/venv/bin/activate
pip install gunicorn
```

### 4.2. تست Gunicorn
```bash
cd /var/www/talent/backend
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

با `Ctrl+C` متوقفش کنید.

### 4.3. ایجاد فایل Supervisor برای Backend
```bash
nano /etc/supervisor/conf.d/django-talent.conf
```

محتوای فایل:
```ini
[program:django-talent]
directory=/var/www/talent/backend
command=/var/www/talent/backend/venv/bin/gunicorn config.wsgi:application --bind 127.0.0.1:8000 --workers 3 --timeout 120
user=root
autostart=true
autorestart=true
stderr_logfile=/var/log/django-talent.err.log
stdout_logfile=/var/log/django-talent.out.log
```

### 4.4. اعمال تغییرات Supervisor
```bash
supervisorctl reread
supervisorctl update
supervisorctl start django-talent
supervisorctl status
```

باید وضعیت `RUNNING` را ببینید.

---

## ⚛️ مرحله 5: راه‌اندازی Frontend (React + Vite)

### 5.1. رفتن به مسیر frontend
```bash
cd /var/www/talent/frontend
```

### 5.2. نصب وابستگی‌ها
```bash
npm install
```

اگر خطای مربوط به `bun.lockb` دیدید:
```bash
rm bun.lockb
npm install --legacy-peer-deps
```

### 5.3. ایجاد فایل .env
```bash
nano .env
```

محتوای فایل `.env`:
```env
VITE_API_BASE_URL=http://81.22.134.84/api
VITE_API_TIMEOUT=30000
```

### 5.4. بیلد گرفتن از فرانت
```bash
npm run build
```

این کار پوشه `dist/` ایجاد می‌کند که حاوی فایل‌های آماده برای production است.

### 5.5. بررسی فایل‌های بیلد شده
```bash
ls -la dist/
```

---

## 🌐 مرحله 6: پیکربندی Nginx

### 6.1. ساخت فایل کانفیگ Nginx
```bash
nano /etc/nginx/sites-available/talent
```

محتوای فایل:
```nginx
server {
    listen 80;
    server_name 81.22.134.84;

    # فرانت‌اند (React)
    location / {
        root /var/www/talent/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # بک‌اند (Django API)
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_connect_timeout 120s;
    }

    # ادمین پنل Django
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # فایل‌های استاتیک Django
    location /static/ {
        alias /var/www/talent/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # فایل‌های آپلود شده
    location /media/ {
        alias /var/www/talent/backend/media/;
        expires 7d;
    }

    # لاگ‌ها
    access_log /var/log/nginx/talent-access.log;
    error_log /var/log/nginx/talent-error.log;
}
```

### 6.2. فعال‌سازی سایت
```bash
ln -s /etc/nginx/sites-available/talent /etc/nginx/sites-enabled/
```

### 6.3. غیرفعال کردن سایت پیش‌فرض
```bash
rm /etc/nginx/sites-enabled/default
```

### 6.4. تست کانفیگ Nginx
```bash
nginx -t
```

اگر پیام `syntax is ok` دیدید، ادامه دهید.

### 6.5. ریستارت Nginx
```bash
systemctl restart nginx
systemctl status nginx
```

---

## 🎉 مرحله 7: تست نهایی

### 7.1. باز کردن در مرورگر
```
http://81.22.134.84
```

باید صفحه اصلی برنامه را ببینید.

### 7.2. تست API
```
http://81.22.134.84/api/
```

باید لیست APIها را ببینید.

### 7.3. تست پنل ادمین
```
http://81.22.134.84/admin/
```

با اطلاعات superuser وارد شوید.

---

## 🔥 مرحله 8: ایجاد داده‌های نمونه (اختیاری)

### 8.1. ایجاد فراخوان‌ها
```bash
cd /var/www/talent/backend
source venv/bin/activate
python create_test_rounds.py
```

### 8.2. ایجاد اطلاعیه‌ها
```bash
python add_announcements.py
```

---

## 🔒 مرحله 9: امنیت (بسیار مهم!)

### 9.1. تنظیم Firewall
```bash
apt install -y ufw
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

### 9.2. تغییر SECRET_KEY در Django
```bash
nano /var/www/talent/backend/.env
```

یک SECRET_KEY جدید تولید کنید:
```bash
python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

و در فایل `.env` جایگزین کنید.

### 9.3. غیرفعال کردن DEBUG
در فایل `/var/www/talent/backend/.env`:
```env
DEBUG=False
```

### 9.4. ریستارت سرویس‌ها
```bash
supervisorctl restart django-talent
systemctl restart nginx
```

---

## 🔄 مرحله 10: به‌روزرسانی پروژه (در آینده)

زمانی که کد جدیدی را push می‌کنید:

```bash
cd /var/www/talent

# 1. Pull کردن تغییرات
git pull origin main

# 2. به‌روزرسانی Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput

# 3. به‌روزرسانی Frontend
cd ../frontend
npm install
npm run build

# 4. ریستارت سرویس‌ها
supervisorctl restart django-talent
systemctl restart nginx
```

---

## 📊 مانیتورینگ و لاگ‌ها

### بررسی لاگ‌های Django
```bash
tail -f /var/log/django-talent.out.log
tail -f /var/log/django-talent.err.log
```

### بررسی لاگ‌های Nginx
```bash
tail -f /var/log/nginx/talent-access.log
tail -f /var/log/nginx/talent-error.log
```

### وضعیت سرویس‌ها
```bash
supervisorctl status django-talent
systemctl status nginx
```

---

## ⚠️ عیب‌یابی مشکلات رایج

### مشکل 1: DisallowedHost Error
اگر خطای زیر را دیدید:
```
DisallowedHost at /api/
Invalid HTTP_HOST header: '81.22.134.84:8000'. You may need to add '81.22.134.84' to ALLOWED_HOSTS.
```

**راه حل:**
1. فایل `/var/www/talent/backend/.env` را باز کنید:
   ```bash
   nano /var/www/talent/backend/.env
   ```

2. مطمئن شوید که `ALLOWED_HOSTS` به این صورت است:
   ```env
   ALLOWED_HOSTS=81.22.134.84,localhost,127.0.0.1,*
   ```

3. سرویس Django را ریستارت کنید:
   ```bash
   # اگر با runserver اجرا کرده‌اید، Ctrl+C بزنید و دوباره اجرا کنید
   # اگر با supervisor اجرا کرده‌اید:
   supervisorctl restart django-talent
   ```

### مشکل 2: Backend اجرا نمی‌شود
```bash
supervisorctl tail -f django-talent stderr
```

### مشکل 2: Frontend خطای 404 می‌دهد
```bash
# بررسی فایل‌های بیلد شده
ls -la /var/www/talent/frontend/dist/
nginx -t
systemctl restart nginx
```

### مشکل 3: CORS Error
در فایل `/var/www/talent/backend/.env`:
```env
CORS_ALLOWED_ORIGINS=http://81.22.134.84
```

سپس:
```bash
supervisorctl restart django-talent
```

### مشکل 4: Static files لود نمی‌شوند
```bash
cd /var/www/talent/backend
source venv/bin/activate
python manage.py collectstatic --noinput
systemctl restart nginx
```

---

## 🎯 چک‌لیست نهایی

- [ ] Python 3.8+ نصب شده
- [ ] Node.js 20.x نصب شده
- [ ] Git نصب شده
- [ ] Nginx نصب و اجرا شده
- [ ] Supervisor نصب و اجرا شده
- [ ] پروژه کلون شده در `/var/www/talent`
- [ ] Backend migrations اجرا شده
- [ ] Superuser ساخته شده
- [ ] Frontend build گرفته شده
- [ ] Nginx کانفیگ شده
- [ ] Firewall تنظیم شده
- [ ] DEBUG=False تنظیم شده
- [ ] SECRET_KEY تولید و تنظیم شده
- [ ] وب‌سایت در مرورگر باز می‌شود

---

## 📱 نکات مهم

1. **Backup**: قبل از هر تغییر، از دیتابیس و فایل‌ها backup بگیرید:
   ```bash
   cp /var/www/talent/backend/db.sqlite3 /root/backups/db-$(date +%Y%m%d).sqlite3
   ```

2. **SSL/HTTPS**: برای استفاده در production، حتماً SSL نصب کنید (با Let's Encrypt و Certbot)

3. **PostgreSQL**: برای production، بهتر است به جای SQLite از PostgreSQL استفاده کنید

4. **Environment Variables**: هرگز SECRET_KEY و اطلاعات حساس را commit نکنید

5. **Monitoring**: از ابزارهای مانیتورینگ مثل Sentry استفاده کنید

---

## ✅ پایان

پروژه شما باید روی `http://81.22.134.84` در دسترس باشد!

برای هرگونه مشکل، لاگ‌ها را بررسی کنید یا به من اطلاع دهید. 🚀
