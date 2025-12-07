#!/bin/bash

# اسکریپت دیپلوی خودکار پروژه Talent
# استفاده: bash deploy.sh

set -e  # خروج در صورت بروز خطا

echo "🚀 شروع نصب و راه‌اندازی پروژه Talent..."
echo "================================================"

# رنگ‌ها برای خروجی
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# تابع برای چاپ پیام‌ها
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}➜ $1${NC}"
}

# بررسی root access
if [ "$EUID" -ne 0 ]; then 
    print_error "لطفاً این اسکریپت را با دسترسی root اجرا کنید"
    exit 1
fi

print_success "دسترسی root تایید شد"

# 1. به‌روزرسانی سیستم
print_info "به‌روزرسانی سیستم..."
apt update && apt upgrade -y
print_success "سیستم به‌روز شد"

# 2. نصب پیش‌نیازهای پایه
print_info "نصب پیش‌نیازهای پایه..."
apt install -y software-properties-common curl wget git nano ufw supervisor nginx
print_success "پیش‌نیازهای پایه نصب شد"

# 3. نصب Python
print_info "نصب Python 3..."
apt install -y python3 python3-pip python3-venv
PYTHON_VERSION=$(python3 --version)
print_success "Python نصب شد: $PYTHON_VERSION"

# 4. نصب Node.js
print_info "نصب Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_success "Node.js نصب شد: $NODE_VERSION (npm: $NPM_VERSION)"

# 5. تنظیم Firewall
print_info "تنظیم Firewall..."
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable
print_success "Firewall تنظیم شد"

# 6. ساخت مسیر پروژه
print_info "ساخت مسیر پروژه..."
mkdir -p /var/www
cd /var/www

# 7. کلون پروژه
if [ -d "talent" ]; then
    print_info "پروژه از قبل وجود دارد. در حال به‌روزرسانی..."
    cd talent
    git pull origin main
else
    print_info "در حال کلون کردن پروژه..."
    git clone https://github.com/JavadRostami3/talent.git
    cd talent
fi
print_success "پروژه آماده است"

# 8. راه‌اندازی Backend
print_info "راه‌اندازی Backend (Django)..."
cd /var/www/talent/backend

# ساخت محیط مجازی
if [ ! -d "venv" ]; then
    python3 -m venv venv
    print_success "محیط مجازی ساخته شد"
fi

# فعال‌سازی محیط مجازی و نصب وابستگی‌ها
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn
print_success "وابستگی‌های Python نصب شد"

# ایجاد فایل .env اگر وجود نداشت
if [ ! -f ".env" ]; then
    print_info "ایجاد فایل .env برای Backend..."
    SECRET_KEY=$(python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
    cat > .env << EOF
DEBUG=False
SECRET_KEY=$SECRET_KEY
ALLOWED_HOSTS=81.22.134.84,localhost,127.0.0.1

# Database
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

# CORS
CORS_ALLOWED_ORIGINS=http://81.22.134.84
EOF
    print_success "فایل .env ساخته شد"
else
    print_info "فایل .env از قبل وجود دارد"
fi

# اجرای migrations
print_info "اجرای migrations..."
python manage.py makemigrations
python manage.py migrate
print_success "Migrations اجرا شد"

# جمع‌آوری فایل‌های static
print_info "جمع‌آوری فایل‌های static..."
python manage.py collectstatic --noinput
print_success "فایل‌های static جمع‌آوری شد"

# 9. راه‌اندازی Frontend
print_info "راه‌اندازی Frontend (React)..."
cd /var/www/talent/frontend

# حذف lock file قدیمی
[ -f "bun.lockb" ] && rm bun.lockb

# نصب وابستگی‌ها
npm install --legacy-peer-deps
print_success "وابستگی‌های npm نصب شد"

# ایجاد فایل .env اگر وجود نداشت
if [ ! -f ".env" ]; then
    print_info "ایجاد فایل .env برای Frontend..."
    cat > .env << EOF
VITE_API_BASE_URL=http://81.22.134.84/api
VITE_API_TIMEOUT=30000
EOF
    print_success "فایل .env ساخته شد"
else
    print_info "فایل .env از قبل وجود دارد"
fi

# بیلد گرفتن
print_info "در حال build کردن Frontend..."
npm run build
print_success "Frontend build شد"

# 10. پیکربندی Supervisor
print_info "پیکربندی Supervisor..."
cat > /etc/supervisor/conf.d/django-talent.conf << EOF
[program:django-talent]
directory=/var/www/talent/backend
command=/var/www/talent/backend/venv/bin/gunicorn config.wsgi:application --bind 127.0.0.1:8000 --workers 3 --timeout 120
user=root
autostart=true
autorestart=true
stderr_logfile=/var/log/django-talent.err.log
stdout_logfile=/var/log/django-talent.out.log
EOF

supervisorctl reread
supervisorctl update
supervisorctl restart django-talent
print_success "Supervisor پیکربندی شد"

# 11. پیکربندی Nginx
print_info "پیکربندی Nginx..."
cat > /etc/nginx/sites-available/talent << 'EOF'
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
EOF

# فعال‌سازی سایت
ln -sf /etc/nginx/sites-available/talent /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# تست و ریستارت Nginx
nginx -t
systemctl restart nginx
systemctl enable nginx
print_success "Nginx پیکربندی شد"

# 12. بررسی وضعیت سرویس‌ها
print_info "بررسی وضعیت سرویس‌ها..."
supervisorctl status django-talent
systemctl status nginx --no-pager -l

echo ""
echo "================================================"
print_success "نصب و راه‌اندازی با موفقیت انجام شد! 🎉"
echo ""
echo "📍 لینک‌های دسترسی:"
echo "   • صفحه اصلی: http://81.22.134.84"
echo "   • API: http://81.22.134.84/api/"
echo "   • پنل ادمین: http://81.22.134.84/admin/"
echo ""
echo "⚠️  مراحل بعدی:"
echo "   1. ساخت superuser:"
echo "      cd /var/www/talent/backend"
echo "      source venv/bin/activate"
echo "      python manage.py createsuperuser"
echo ""
echo "   2. اصلاح is_staff برای ادمین‌ها:"
echo "      python manage.py fix_admin_users"
echo ""
echo "   3. ایجاد داده‌های نمونه (اختیاری):"
echo "      python create_test_rounds.py"
echo "      python add_announcements.py"
echo ""
echo "📊 بررسی لاگ‌ها:"
echo "   • Django: tail -f /var/log/django-talent.out.log"
echo "   • Nginx: tail -f /var/log/nginx/talent-access.log"
echo ""
print_success "موفق باشید! 🚀"
