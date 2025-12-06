from django.contrib import admin
from .models import Payment, PaymentSetting


@admin.ModelAdmin
class PaymentAdmin(admin.ModelAdmin):
    """Admin interface for Payment model"""
    list_display = [
        'tracking_code', 'application', 'amount', 'status',
        'gateway', 'reference_number', 'paid_at', 'created_at'
    ]
    list_filter = ['status', 'gateway', 'created_at', 'paid_at']
    search_fields = [
        'tracking_code', 'reference_number', 'transaction_id',
        'application__tracking_code', 'application__applicant__user__national_id'
    ]
    readonly_fields = [
        'tracking_code', 'created_at', 'updated_at', 'paid_at'
    ]
    fieldsets = (
        ('اطلاعات پایه', {
            'fields': ('application', 'amount', 'status', 'gateway')
        }),
        ('اطلاعات پیگیری', {
            'fields': ('tracking_code', 'reference_number', 'transaction_id')
        }),
        ('اطلاعات پرداخت‌کننده', {
            'fields': ('payer_name', 'payer_mobile', 'payer_email', 'ip_address')
        }),
        ('توضیحات', {
            'fields': ('description', 'error_message', 'metadata')
        }),
        ('زمان', {
            'fields': ('paid_at', 'created_at', 'updated_at')
        }),
    )
    
    def has_delete_permission(self, request, obj=None):
        """محدود کردن حذف پرداخت‌های موفق"""
        if obj and obj.status == Payment.PaymentStatus.PAID:
            return False
        return super().has_delete_permission(request, obj)


@admin.register(PaymentSetting)
class PaymentSettingAdmin(admin.ModelAdmin):
    """Admin interface for PaymentSetting model"""
    list_display = [
        'round_type', 'amount', 'is_required', 'is_active',
        'gateway', 'created_at'
    ]
    list_filter = ['is_required', 'is_active', 'gateway']
    fieldsets = (
        ('تنظیمات پایه', {
            'fields': ('round_type', 'amount', 'is_required', 'is_active')
        }),
        ('تنظیمات درگاه', {
            'fields': ('gateway', 'description')
        }),
    )


admin.site.register(Payment, PaymentAdmin)
