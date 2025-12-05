from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, ApplicantProfile, AdminPermission


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['national_id', 'first_name', 'last_name', 'father_name', 'email', 'mobile', 'role', 'is_active']
    list_filter = ['role', 'is_active', 'is_staff', 'gender']
    search_fields = ['national_id', 'first_name', 'last_name', 'email', 'mobile', 'birth_certificate_number']
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {'fields': ('national_id', 'password')}),
        ('اطلاعات شخصی', {
            'fields': ('first_name', 'last_name', 'father_name', 'email', 'mobile')
        }),
        ('اطلاعات شناسنامه‌ای', {
            'fields': (
                'birth_certificate_number',
                'birth_certificate_serial',
                'birth_certificate_issue_place',
                'gender',
                'birth_year',
                'birth_place',
                'military_status'
            ),
            'classes': ('collapse',)
        }),
        ('دسترسی‌ها', {
            'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('تاریخ‌ها', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'national_id', 'first_name', 'last_name', 'father_name',
                'email', 'mobile', 'password1', 'password2', 'role'
            ),
        }),
    )


class AdminPermissionInline(admin.StackedInline):
    """Inline برای نمایش دسترسی‌های ادمین در صفحه User"""
    model = AdminPermission
    can_delete = False
    verbose_name = 'دسترسی‌های ادمین'
    verbose_name_plural = 'دسترسی‌های ادمین'
    filter_horizontal = ['faculties', 'departments']
    
    fieldsets = (
        ('دسترسی به انواع فراخوان', {
            'fields': (
                'has_ma_talent_access',
                'has_phd_talent_access',
                'has_phd_exam_access',
                'has_olympiad_access'
            )
        }),
        ('دسترسی به دانشکده و گروه', {
            'fields': ('faculties', 'departments'),
            'description': 'اگر هیچ موردی انتخاب نشود، دسترسی به همه موارد داده می‌شود'
        }),
        ('دسترسی کامل', {
            'fields': ('has_full_access',),
            'description': 'برای سوپرادمین - دسترسی به همه چیز'
        }),
    )


@admin.register(AdminPermission)
class AdminPermissionAdmin(admin.ModelAdmin):
    list_display = [
        'user',
        'has_ma_talent_access',
        'has_phd_talent_access',
        'has_phd_exam_access',
        'has_olympiad_access',
        'has_full_access',
        'get_faculties_count',
        'get_departments_count'
    ]
    list_filter = [
        'has_ma_talent_access',
        'has_phd_talent_access',
        'has_phd_exam_access',
        'has_olympiad_access',
        'has_full_access',
        'faculties',
    ]
    search_fields = ['user__national_id', 'user__first_name', 'user__last_name']
    filter_horizontal = ['faculties', 'departments']
    raw_id_fields = ['user']
    
    fieldsets = (
        ('کاربر', {
            'fields': ('user',)
        }),
        ('دسترسی به انواع فراخوان', {
            'fields': (
                'has_ma_talent_access',
                'has_phd_talent_access',
                'has_phd_exam_access',
                'has_olympiad_access'
            ),
            'description': 'مشخص کنید این ادمین به کدام نوع فراخوان دسترسی دارد'
        }),
        ('دانشکده‌های مجاز', {
            'fields': ('faculties',),
            'description': 'اگر خالی باشد، به همه دانشکده‌ها دسترسی دارد'
        }),
        ('گروه‌های آموزشی مجاز', {
            'fields': ('departments',),
            'description': 'اگر خالی باشد، به همه گروه‌های دانشکده‌های انتخابی دسترسی دارد'
        }),
        ('دسترسی ویژه', {
            'fields': ('has_full_access',),
            'description': 'دسترسی کامل به همه چیز (برای سوپرادمین)'
        }),
    )
    
    def get_faculties_count(self, obj):
        count = obj.faculties.count()
        return f"{count} دانشکده" if count > 0 else "همه دانشکده‌ها"
    get_faculties_count.short_description = "دانشکده‌ها"
    
    def get_departments_count(self, obj):
        count = obj.departments.count()
        return f"{count} گروه" if count > 0 else "همه گروه‌ها"
    get_departments_count.short_description = "گروه‌ها"


@admin.register(ApplicantProfile)
class ApplicantProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'phone', 'created_at']
    search_fields = ['user__national_id', 'user__first_name', 'user__last_name']
    list_filter = ['created_at']
    raw_id_fields = ['user']
    
    fieldsets = (
        ('کاربر', {
            'fields': ('user',)
        }),
        ('اطلاعات تماس', {
            'fields': ('address', 'phone')
        }),
        ('تاریخ‌ها', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ['created_at', 'updated_at']
