"""
اسکریپت برای ایجاد فراخوان‌های تست
"""
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
        'description': 'فراخوان تستی برای استعداد درخشان کارشناسی ارشد'
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
        round_obj.registration_start = timezone.now()
        round_obj.registration_end = timezone.now() + timedelta(days=30)
        round_obj.save()
        print(f"🔄 {data['title']} به‌روزرسانی و فعال شد")

print("\n🎉 تمام فراخوان‌های تست آماده هستند!")

# نمایش فراخوان‌های فعال
active_rounds = AdmissionRound.objects.filter(is_active=True)
print(f"\n📊 تعداد فراخوان‌های فعال: {active_rounds.count()}")
for round_obj in active_rounds:
    print(f"   - {round_obj.title} ({round_obj.type})")

