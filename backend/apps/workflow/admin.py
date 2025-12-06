from django.contrib import admin
from .models import FormReview, ApplicationWorkflowLog


@admin.register(FormReview)
class FormReviewAdmin(admin.ModelAdmin):
    list_display = [
        'application',
        'document_type',
        'status',
        'reviewer',
        'reviewed_at'
    ]
    list_filter = ['document_type', 'status', 'reviewed_at']
    search_fields = [
        'application__tracking_code',
        'application__applicant__user__national_id',
        'comment'
    ]
    readonly_fields = ['reviewed_at', 'created_at', 'updated_at']
    raw_id_fields = ['application', 'reviewer']
    date_hierarchy = 'reviewed_at'
    
    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('application', 'form_number')
        }),
        ('وضعیت بررسی', {
            'fields': ('status', 'comment', 'defects')
        }),
        ('بررسی‌کننده', {
            'fields': ('reviewer', 'reviewed_at')
        }),
        ('تاریخ‌ها', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ApplicationWorkflowLog)
class ApplicationWorkflowLogAdmin(admin.ModelAdmin):
    list_display = [
        'application',
        'step_type',
        'created_by',
        'created_at'
    ]
    list_filter = ['step_type', 'created_at']
    search_fields = [
        'application__tracking_code',
        'description'
    ]
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['application', 'created_by']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('application', 'step_type', 'description')
        }),
        ('ایجادکننده', {
            'fields': ('created_by', 'created_at')
        }),
        ('تاریخ بروزرسانی', {
            'fields': ('updated_at',),
            'classes': ('collapse',)
        }),
    )
