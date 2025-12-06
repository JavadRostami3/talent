from django.db import models
from apps.core.models import TimeStampedModel


class Announcement(TimeStampedModel):
    """
    اطلاعیه‌ها
    """
    class Category(models.TextChoices):
        GENERAL = "GENERAL", "عمومی"
        MA_TALENT = "MA_TALENT", "استعداد درخشان ارشد"
        PHD_TALENT = "PHD_TALENT", "استعداد درخشان دکتری"
        PHD_EXAM = "PHD_EXAM", "آزمون دکتری"
        OLYMPIAD = "OLYMPIAD", "المپیاد علمی"
    
    # کد یکتا برای هر اطلاعیه
    code = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        verbose_name="کد",
        help_text="کد یکتا برای شناسایی اطلاعیه"
    )
    
    title = models.CharField(max_length=500, verbose_name="عنوان مطلب")
    body = models.TextField(verbose_name="متن کامل")
    
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        verbose_name="گروه مطلب"
    )
    
    # ترتیب/اولویت نمایش
    priority = models.IntegerField(
        default=0,
        verbose_name="ترتیب",
        help_text="عدد بزرگتر = اولویت بیشتر در نمایش"
    )
    
    # فایل پیوست
    attachment = models.FileField(
        upload_to='announcements/attachments/%Y/%m/',
        null=True,
        blank=True,
        verbose_name="پیوست"
    )
    
    # وضعیت انتشار
    is_published = models.BooleanField(
        default=False,
        verbose_name="منتشر شده"
    )
    published_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="تاریخ انتشار"
    )
    
    # نویسنده
    author = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='announcements',
        verbose_name="نویسنده"
    )
    
    # شمارش بازدید
    views_count = models.PositiveIntegerField(
        default=0,
        verbose_name="تعداد بازدید"
    )
    
    class Meta:
        verbose_name = "اطلاعیه"
        verbose_name_plural = "اطلاعیه‌ها"
        ordering = ['-priority', '-published_at', '-created_at']
        indexes = [
            models.Index(fields=['-priority', '-published_at']),
            models.Index(fields=['category', 'is_published']),
        ]
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        # تولید کد یکتا اگر وجود نداشته باشد
        if not self.code:
            import random
            import string
            while True:
                code = ''.join(random.choices(string.digits, k=6))
                if not Announcement.objects.filter(code=code).exists():
                    self.code = code
                    break
        
        # تنظیم تاریخ انتشار اگر منتشر شد
        if self.is_published and not self.published_at:
            from django.utils import timezone
            self.published_at = timezone.now()
        
        super().save(*args, **kwargs)
    
    def increment_views(self):
        """افزایش تعداد بازدید"""
        self.views_count += 1
        self.save(update_fields=['views_count'])


class StaticPage(TimeStampedModel):
    """
    صفحات استاتیک مانند شرایط پذیرش، نحوه ثبت‌نام و ...
    """
    slug = models.SlugField(
        unique=True,
        verbose_name="شناسه URL",
        help_text="مثال: ma-conditions, phd-how-to-register"
    )
    title = models.CharField(max_length=255, verbose_name="عنوان")
    body = models.TextField(verbose_name="متن")
    category = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="دسته‌بندی"
    )
    is_published = models.BooleanField(
        default=True,
        verbose_name="منتشر شده"
    )
    meta_description = models.CharField(
        max_length=160,
        blank=True,
        verbose_name="توضیحات متا"
    )
    
    class Meta:
        verbose_name = "صفحه استاتیک"
        verbose_name_plural = "صفحات استاتیک"
        ordering = ['category', 'title']
    
    def __str__(self):
        return self.title


class AdminAnnouncement(TimeStampedModel):
    """
    اطلاعیه‌های مخصوص ادمین‌ها
    """
    class Priority(models.TextChoices):
        LOW = "LOW", "عادی"
        MEDIUM = "MEDIUM", "متوسط"
        HIGH = "HIGH", "مهم"
        URGENT = "URGENT", "فوری"
    
    title = models.CharField(max_length=255, verbose_name="عنوان")
    content = models.TextField(verbose_name="متن اطلاعیه")
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM,
        verbose_name="اولویت"
    )
    
    # نمایش برای چه کسانی
    for_university_admins = models.BooleanField(default=True, verbose_name="مسئولین دانشگاه")
    for_faculty_admins = models.BooleanField(default=True, verbose_name="مسئولین دانشکده")
    
    # محدودیت به نوع فراخوان خاص
    for_ma_talent = models.BooleanField(default=True, verbose_name="استعداد ارشد")
    for_phd_talent = models.BooleanField(default=True, verbose_name="استعداد دکتری")
    for_phd_exam = models.BooleanField(default=True, verbose_name="آزمون دکتری")
    for_olympiad = models.BooleanField(default=True, verbose_name="المپیاد")
    
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    expires_at = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ انقضا")
    
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_announcements',
        verbose_name="ایجادکننده"
    )
    
    class Meta:
        verbose_name = "اطلاعیه ادمین"
        verbose_name_plural = "اطلاعیه‌های ادمین"
        ordering = ['-priority', '-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.get_priority_display()})"
