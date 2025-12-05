from django.contrib import admin
from .models import AdmissionRound, Program


@admin.register(AdmissionRound)
class AdmissionRoundAdmin(admin.ModelAdmin):
    list_display = ['title', 'year', 'type', 'is_active', 'registration_start', 'registration_end']
    list_filter = ['type', 'is_active', 'year']
    search_fields = ['title', 'description']
    list_editable = ['is_active']
    date_hierarchy = 'registration_start'
    
    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('title', 'year', 'type', 'description', 'is_active')
        }),
        ('تاریخ‌های مهم', {
            'fields': ('registration_start', 'registration_end', 'documents_deadline', 'result_publish_date')
        }),
    )


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ['name', 'orientation', 'degree_level', 'faculty', 'department', 'code', 'capacity', 'is_active', 'round']
    list_filter = ['degree_level', 'is_active', 'faculty', 'round']
    search_fields = ['name', 'code', 'orientation', 'bachelor_related_field']
    list_editable = ['is_active', 'capacity']
    raw_id_fields = ['round', 'faculty', 'department']
    
    fieldsets = (
        ('اطلاعات فراخوان', {
            'fields': ('round',)
        }),
        ('اطلاعات رشته', {
            'fields': ('degree_level', 'code', 'name', 'orientation', 'bachelor_related_field')
        }),
        ('سازمانی', {
            'fields': ('faculty', 'department')
        }),
        ('تنظیمات', {
            'fields': ('capacity', 'is_active')
        }),
    )
