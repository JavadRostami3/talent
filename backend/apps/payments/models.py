from django.db import models
from apps.core.models import TimeStampedModel
from apps.applications.models import Application


class Payment(TimeStampedModel):
    """
    مدل پرداخت برای هزینه ثبت‌نام
    
    این ماژول اختیاری است و در صورت نیاز به دریافت هزینه ثبت‌نام
    می‌توان آن را فعال و با درگاه بانکی متصل کرد.
    """
    
    class PaymentStatus(models.TextChoices):
        PENDING = "PENDING", "در انتظار پرداخت"
        PROCESSING = "PROCESSING", "در حال پردازش"
        PAID = "PAID", "پرداخت شده"
        FAILED = "FAILED", "ناموفق"
        CANCELLED = "CANCELLED", "لغو شده"
        REFUNDED = "REFUNDED", "برگشت داده شده"
    
    class Gateway(models.TextChoices):
        SAMAN = "SAMAN", "سامان"
        MELLAT = "MELLAT", "ملت"
        PARSIAN = "PARSIAN", "پارسیان"
        ZARINPAL = "ZARINPAL", "زرین‌پال"
        IDPAY = "IDPAY", "آیدی‌پی"
        OTHER = "OTHER", "سایر"
    
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='payments',
        verbose_name="درخواست"
    )
    
    amount = models.PositiveIntegerField(
        verbose_name="مبلغ (ریال)",
        help_text="مبلغ به ریال"
    )
    
    status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        verbose_name="وضعیت پرداخت"
    )
    
    gateway = models.CharField(
        max_length=20,
        choices=Gateway.choices,
        default=Gateway.SAMAN,
        verbose_name="درگاه پرداخت"
    )
    
    # شماره پیگیری از سمت درگاه
    reference_number = models.CharField(
        max_length=100,
        blank=True,
        unique=True,
        null=True,
        verbose_name="شماره پیگیری"
    )
    
    # شماره تراکنش بانک
    transaction_id = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="شماره تراکنش"
    )
    
    # کد پیگیری یکتا سیستم
    tracking_code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name="کد پیگیری سیستم"
    )
    
    # زمان پرداخت موفق
    paid_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="تاریخ پرداخت"
    )
    
    # توضیحات و پیام خطا
    description = models.TextField(
        blank=True,
        verbose_name="توضیحات"
    )
    
    error_message = models.TextField(
        blank=True,
        verbose_name="پیام خطا"
    )
    
    # اطلاعات پرداخت‌کننده
    payer_name = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="نام پرداخت‌کننده"
    )
    
    payer_mobile = models.CharField(
        max_length=15,
        blank=True,
        verbose_name="موبایل پرداخت‌کننده"
    )
    
    payer_email = models.EmailField(
        blank=True,
        verbose_name="ایمیل پرداخت‌کننده"
    )
    
    # IP Address
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name="آدرس IP"
    )
    
    # اطلاعات اضافی (JSON برای metadata)
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="اطلاعات اضافی"
    )
    
    class Meta:
        verbose_name = "پرداخت"
        verbose_name_plural = "پرداخت‌ها"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['application', 'status']),
            models.Index(fields=['tracking_code']),
            models.Index(fields=['reference_number']),
        ]
    
    def __str__(self):
        return f"{self.tracking_code} - {self.application.tracking_code}: {self.get_status_display()}"
    
    def save(self, *args, **kwargs):
        """تولید tracking_code اگر وجود ندارد"""
        if not self.tracking_code:
            import uuid
            self.tracking_code = f"PAY-{uuid.uuid4().hex[:12].upper()}"
        super().save(*args, **kwargs)
    
    def is_successful(self):
        """آیا پرداخت موفق بوده است؟"""
        return self.status == self.PaymentStatus.PAID
    
    def can_retry(self):
        """آیا امکان تلاش مجدد وجود دارد؟"""
        return self.status in [
            self.PaymentStatus.FAILED,
            self.PaymentStatus.CANCELLED
        ]


class PaymentSetting(TimeStampedModel):
    """
    تنظیمات پرداخت برای هر نوع فراخوان
    """
    
    from apps.admissions.models import AdmissionRound
    
    round_type = models.CharField(
        max_length=20,
        choices=AdmissionRound.RoundTypes.choices,
        unique=True,
        verbose_name="نوع فراخوان"
    )
    
    amount = models.PositiveIntegerField(
        verbose_name="مبلغ (ریال)",
        help_text="مبلغ ثبت‌نام به ریال"
    )
    
    is_required = models.BooleanField(
        default=True,
        verbose_name="پرداخت اجباری است؟",
        help_text="آیا پرداخت برای تکمیل ثبت‌نام الزامی است؟"
    )
    
    is_active = models.BooleanField(
        default=True,
        verbose_name="فعال"
    )
    
    gateway = models.CharField(
        max_length=20,
        choices=Payment.Gateway.choices,
        default=Payment.Gateway.SAMAN,
        verbose_name="درگاه پیش‌فرض"
    )
    
    description = models.TextField(
        blank=True,
        verbose_name="توضیحات"
    )
    
    class Meta:
        verbose_name = "تنظیمات پرداخت"
        verbose_name_plural = "تنظیمات پرداخت‌ها"
    
    def __str__(self):
        return f"{self.get_round_type_display()}: {self.amount:,} ریال"
