#!/bin/bash

# اسکریپت به‌روزرسانی سریع پروژه Talent
# استفاده: bash update.sh

set -e

echo "🔄 شروع به‌روزرسانی پروژه..."

# رنگ‌ها
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}➜ $1${NC}"
}

# 1. Pull کردن تغییرات
print_info "دریافت آخرین تغییرات از GitHub..."
cd /var/www/talent
git pull origin main
print_success "کد به‌روز شد"

# 2. به‌روزرسانی Backend
print_info "به‌روزرسانی Backend..."
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
print_success "Backend به‌روز شد"

# 3. به‌روزرسانی Frontend
print_info "به‌روزرسانی Frontend..."
cd ../frontend
npm install --legacy-peer-deps
npm run build
print_success "Frontend به‌روز شد"

# 4. ریستارت سرویس‌ها
print_info "ریستارت سرویس‌ها..."
supervisorctl restart django-talent
systemctl restart nginx
print_success "سرویس‌ها ریستارت شدند"

echo ""
print_success "به‌روزرسانی با موفقیت انجام شد! 🎉"
echo "وب‌سایت: http://81.22.134.84"
