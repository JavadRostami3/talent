from django.contrib import admin
from .models import ApplicationDocument


@admin.register(ApplicationDocument)
class ApplicationDocumentAdmin(admin.ModelAdmin):
    list_display = [
        'application',
        'type',
        'status',
        'uploaded_at',
        'reviewed_by',
        'reviewed_at'
    ]
    list_filter = ['type', 'status', 'uploaded_at']
    search_fields = [
        'application__tracking_code',
        'application__applicant__user__national_id',
        'application__applicant__user__first_name',
        'application__applicant__user__last_name'
    ]
    readonly_fields = ['uploaded_at', 'created_at', 'updated_at']
    raw_id_fields = ['application', 'reviewed_by']
    date_hierarchy = 'uploaded_at'
    
    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('application', 'type', 'file')
        }),
        ('وضعیت بررسی', {
            'fields': ('status', 'review_comment', 'reviewed_by', 'reviewed_at')
        }),
        ('تاریخ‌ها', {
            'fields': ('uploaded_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
