from django.db import models
from apps.core.models import TimeStampedModel, Faculty, Department


class AdmissionRound(TimeStampedModel):
    """
    فراخوان‌های پذیرش
    """
    class RoundType(models.TextChoices):
        MA_TALENT = "MA_TALENT", "استعداد درخشان کارشناسی ارشد"
        PHD_TALENT = "PHD_TALENT", "استعداد درخشان دکتری"
        PHD_EXAM = "PHD_EXAM", "آزمون دکتری"
        OLYMPIAD = "OLYMPIAD", "المپیاد علمی"
    
    title = models.CharField(max_length=255, verbose_name="عنوان فراخوان")
    year = models.PositiveIntegerField(verbose_name="سال")
    type = models.CharField(
        max_length=20,
        choices=RoundType.choices,
        verbose_name="نوع فراخوان"
    )
    description = models.TextField(blank=True, verbose_name="توضیحات")
    
    registration_start = models.DateTimeField(verbose_name="شروع ثبت‌نام")
    registration_end = models.DateTimeField(verbose_name="پایان ثبت‌نام")
    documents_deadline = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="مهلت ارسال مدارک"
    )
    result_publish_date = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="تاریخ اعلام نتایج"
    )
    
    is_active = models.BooleanField(default=False, verbose_name="فعال")
    
    class Meta:
        verbose_name = "فراخوان پذیرش"
        verbose_name_plural = "فراخوان‌های پذیرش"
        ordering = ['-year', '-created_at']
        unique_together = ['year', 'type']
    
    def __str__(self):
        return f"{self.title} - {self.year}"


class Program(TimeStampedModel):
    """
    رشته‌ها و گرایش‌های قابل انتخاب در هر فراخوان
    """
    DEGREE_MA = "MA"
    DEGREE_PHD = "PHD"
    
    DEGREE_CHOICES = [
        (DEGREE_MA, "کارشناسی ارشد"),
        (DEGREE_PHD, "دکتری"),
    ]
    
    round = models.ForeignKey(
        AdmissionRound,
        on_delete=models.CASCADE,
        related_name='programs',
        verbose_name="فراخوان"
    )
    degree_level = models.CharField(
        max_length=10,
        choices=DEGREE_CHOICES,
        verbose_name="مقطع تحصیلی"
    )
    faculty = models.ForeignKey(
        Faculty,
        on_delete=models.PROTECT,
        related_name='programs',
        verbose_name="دانشکده"
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name='programs',
        verbose_name="گروه آموزشی"
    )
    
    code = models.CharField(max_length=20, verbose_name="کد رشته")
    name = models.CharField(max_length=255, verbose_name="نام رشته")
    orientation = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="گرایش"
    )
    bachelor_related_field = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="رشته مرتبط کارشناسی"
    )
    capacity = models.PositiveIntegerField(default=0, verbose_name="ظرفیت")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    
    class Meta:
        verbose_name = "برنامه تحصیلی"
        verbose_name_plural = "برنامه‌های تحصیلی"
        ordering = ['round', 'faculty', 'department', 'name']
    
    def __str__(self):
        orientation_str = f" - {self.orientation}" if self.orientation else ""
        return f"{self.name}{orientation_str} ({self.get_degree_level_display()})"
