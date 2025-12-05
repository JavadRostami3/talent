from django.db import models


class TimeStampedModel(models.Model):
    """
    مدل پایه با فیلدهای تاریخ ایجاد و بروزرسانی
    """
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاریخ بروزرسانی")
    
    class Meta:
        abstract = True


class University(TimeStampedModel):
    """
    دانشگاه‌ها
    """
    name = models.CharField(max_length=255, unique=True, verbose_name="نام دانشگاه")
    code = models.CharField(max_length=50, blank=True, verbose_name="کد دانشگاه")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    
    class Meta:
        verbose_name = "دانشگاه"
        verbose_name_plural = "دانشگاه‌ها"
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Faculty(TimeStampedModel):
    """
    دانشکده‌ها
    """
    name = models.CharField(max_length=255, verbose_name="نام دانشکده")
    code = models.CharField(max_length=50, blank=True, verbose_name="کد دانشکده")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    
    class Meta:
        verbose_name = "دانشکده"
        verbose_name_plural = "دانشکده‌ها"
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Department(TimeStampedModel):
    """
    گروه‌های آموزشی
    """
    faculty = models.ForeignKey(
        Faculty,
        on_delete=models.CASCADE,
        related_name='departments',
        verbose_name="دانشکده"
    )
    name = models.CharField(max_length=255, verbose_name="نام گروه آموزشی")
    code = models.CharField(max_length=50, blank=True, verbose_name="کد گروه")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    
    class Meta:
        verbose_name = "گروه آموزشی"
        verbose_name_plural = "گروه‌های آموزشی"
        ordering = ['faculty', 'name']
    
    def __str__(self):
        return f"{self.faculty.name} - {self.name}"


class UniversityWeight(TimeStampedModel):
    """
    ضریب دانشگاه برای هر فراخوان
    """
    university = models.ForeignKey(
        University,
        on_delete=models.CASCADE,
        related_name='weights',
        verbose_name="دانشگاه"
    )
    round = models.ForeignKey(
        'admissions.AdmissionRound',
        on_delete=models.CASCADE,
        related_name='university_weights',
        verbose_name="فراخوان"
    )
    weight = models.FloatField(default=1.0, verbose_name="ضریب")
    
    class Meta:
        verbose_name = "ضریب دانشگاه"
        verbose_name_plural = "ضرایب دانشگاه‌ها"
        unique_together = ['university', 'round']
    
    def __str__(self):
        return f"{self.university.name} - {self.round.title} (ضریب: {self.weight})"
