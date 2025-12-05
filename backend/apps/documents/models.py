from django.db import models
from django.core.validators import FileExtensionValidator
from apps.core.models import TimeStampedModel
from apps.applications.models import Application


def application_document_path(instance, filename):
    """تولید مسیر آپلود برای مدارک"""
    return f'applications/{instance.application.tracking_code}/documents/{instance.type}/{filename}'


class ApplicationDocument(TimeStampedModel):
    """
    مدارک آپلودی داوطلب
    
    مدارک شناسایی (مرحله 3):
    - PERSONAL_PHOTO: عکس پرسنلی
    - NATIONAL_CARD: تصویر کارت ملی
    - ID_CARD: تصویر شناسنامه
    
    مدارک تحصیلی (مرحله 5):
    - BSC_CERT: مدرک کارشناسی
    - EXCELLENCE_CERT: گواهی دانشجو ممتاز
    - TRANSCRIPT: ریزنمرات کارشناسی
    """
    class DocType(models.TextChoices):
        # مدارک شناسایی (مشترک برای همه)
        PERSONAL_PHOTO = "PERSONAL_PHOTO", "عکس پرسنلی"
        NATIONAL_CARD = "NATIONAL_CARD", "کارت ملی"
        ID_CARD = "ID_CARD", "شناسنامه"
        
        # مدارک تحصیلی کارشناسی
        BSC_CERT = "BSC_CERT", "مدرک کارشناسی"
        BSC_TRANSCRIPT = "BSC_TRANSCRIPT", "ریزنمرات کارشناسی"
        
        # مدارک تحصیلی کارشناسی ارشد
        MSC_CERT = "MSC_CERT", "مدرک کارشناسی ارشد"
        MSC_TRANSCRIPT = "MSC_TRANSCRIPT", "ریزنمرات کارشناسی ارشد"
        MSC_EXCELLENCE_CERT = "MSC_EXCELLENCE_CERT", "فرم رتبه ممتاز ارشد"
        
        # مدارک اضافی (برای ارشد)
        EXCELLENCE_CERT = "EXCELLENCE_CERT", "گواهی دانشجوی ممتاز"
        GRADUATION_CERT = "GRADUATION_CERT", "گواهی فارغ‌التحصیلی"
        ENROLLMENT_CERT = "ENROLLMENT_CERT", "گواهی اشتغال به تحصیل"
        
        # مدارک اضافی (برای دکتری)
        OLYMPIAD_CERT = "OLYMPIAD_CERT", "فرم کسب رتبه در المپیاد علمی"
        ENGLISH_TEST_CERT = "ENGLISH_TEST_CERT", "فرم کسب امتیاز از آزمون‌های زبان انگلیسی"
        
        # سایر
        OTHER = "OTHER", "سایر"
    
    class Status(models.TextChoices):
        UPLOADED = "UPLOADED", "آپلود شده"
        APPROVED = "APPROVED", "تایید شده"
        REJECTED = "REJECTED", "رد شده"
    
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name="درخواست"
    )
    type = models.CharField(
        max_length=30,
        choices=DocType.choices,
        verbose_name="نوع مدرک"
    )
    file = models.FileField(
        upload_to=application_document_path,
        validators=[
            FileExtensionValidator(
                allowed_extensions=['pdf', 'jpg', 'jpeg', 'png']
            )
        ],
        verbose_name="فایل"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.UPLOADED,
        verbose_name="وضعیت"
    )
    review_comment = models.TextField(
        blank=True,
        verbose_name="نظر بررسی‌کننده"
    )
    uploaded_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="تاریخ آپلود"
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="تاریخ بررسی"
    )
    reviewed_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reviewed_documents',
        verbose_name="بررسی‌کننده"
    )
    
    class Meta:
        verbose_name = "مدرک"
        verbose_name_plural = "مدارک"
        ordering = ['application', 'type', '-uploaded_at']
    
    def __str__(self):
        return f"{self.application.tracking_code} - {self.get_type_display()}"
