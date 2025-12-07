"""
Fix existing admin users by setting is_staff=True
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Fix existing admin users by setting is_staff=True for UNIVERSITY_ADMIN, FACULTY_ADMIN, SUPERADMIN'

    def handle(self, *args, **options):
        # Find all admin users with is_staff=False
        admin_roles = ['UNIVERSITY_ADMIN', 'FACULTY_ADMIN', 'SUPERADMIN']
        users_to_fix = User.objects.filter(
            role__in=admin_roles,
            is_staff=False
        )
        
        count = users_to_fix.count()
        
        if count == 0:
            self.stdout.write(
                self.style.SUCCESS('✓ همه ادمین‌ها به درستی تنظیم شده‌اند!')
            )
            return
        
        # Update users
        updated = users_to_fix.update(is_staff=True)
        
        self.stdout.write(
            self.style.SUCCESS(f'✓ تعداد {updated} کاربر ادمین به روزرسانی شد!')
        )
        
        # Show updated users
        for user in User.objects.filter(role__in=admin_roles):
            self.stdout.write(
                f'  - {user.get_full_name()} ({user.national_id}) - Role: {user.role} - is_staff: {user.is_staff}'
            )
