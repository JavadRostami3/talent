from django.db import models
from apps.core.models import TimeStampedModel
from apps.applications.models import Application


class FormReview(TimeStampedModel):
    """
    وضعیت بررسی مدارک توسط ادمین
    برای استعداد درخشان ارشد دو بخش داریم:
    1. مدارک شناسایی (عکس، کارت ملی، شناسنامه)
    2. مدارک تحصیلی (مدرک کارشناسی، گواهی دانشجو ممتاز، ریزنمرات)
    """
    
    class DocumentType(models.TextChoices):
        IDENTITY_DOCS = "IDENTITY_DOCS", "مدارک شناسایی"
        EDUCATION_DOCS = "EDUCATION_DOCS", "مدارک تحصیلی"
    
    class ReviewStatus(models.TextChoices):
        PENDING = "PENDING", "در انتظار بررسی"
        APPROVED = "APPROVED", "تایید شده"
        APPROVED_WITH_DEFECT = "APPROVED_WITH_DEFECT", "تاییدشده با نقص"
        REJECTED = "REJECTED", "فرم تایید نشده"
    
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='form_reviews',
        verbose_name="درخواست"
    )
    
    document_type = models.CharField(
        max_length=30,
        choices=DocumentType.choices,
        verbose_name="نوع مدارک"
    )
    
    status = models.CharField(
        max_length=30,
        choices=ReviewStatus.choices,
        default=ReviewStatus.PENDING,
        verbose_name="وضعیت بررسی"
    )
    
    comment = models.TextField(
        blank=True,
        verbose_name="نظر بررسی‌کننده"
    )
    
    # موارد نقص (برای حالت APPROVED_WITH_DEFECT)
    defects = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="موارد نقص",
        help_text='مثال: {"personal_photo": true, "national_card": false}'
    )
    
    reviewer = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='document_reviews',
        verbose_name="بررسی‌کننده"
    )
    
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="تاریخ بررسی"
    )
    
    class Meta:
        verbose_name = "بررسی مدارک"
        verbose_name_plural = "بررسی‌های مدارک"
        ordering = ['application', 'document_type', '-created_at']
        unique_together = ['application', 'document_type']
    
    def __str__(self):
        return f"{self.application.tracking_code} - {self.get_document_type_display()}: {self.get_status_display()}"


class ApplicationWorkflowLog(TimeStampedModel):
    """
    لاگ گردش کار پرونده (تایم‌لاین)
    """
    class StepType(models.TextChoices):
        APPLICANT_SUBMITTED = "APPLICANT_SUBMITTED", "ارسال توسط داوطلب"
        INITIAL_CHECK = "INITIAL_CHECK", "بررسی اولیه"
        ELIGIBLE = "ELIGIBLE", "واجد شرایط"
        FACULTY_REVIEW = "FACULTY_REVIEW", "بررسی دانشکده"
        FINAL_REVIEW = "FINAL_REVIEW", "بررسی نهایی"
        RETURNED = "RETURNED", "برگشت داده شده"
        APPROVED = "APPROVED", "تایید شده"
        REJECTED = "REJECTED", "رد شده"
        OTHER = "OTHER", "سایر"
    
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='workflow_logs',
        verbose_name="درخواست"
    )
    step_type = models.CharField(
        max_length=30,
        choices=StepType.choices,
        verbose_name="نوع مرحله"
    )
    description = models.TextField(verbose_name="توضیحات")
    created_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='workflow_logs',
        verbose_name="ایجاد شده توسط"
    )
    
    class Meta:
        verbose_name = "لاگ گردش کار"
        verbose_name_plural = "لاگ‌های گردش کار"
        ordering = ['application', '-created_at']
    
    def __str__(self):
        return f"{self.application.tracking_code} - {self.get_step_type_display()}"
