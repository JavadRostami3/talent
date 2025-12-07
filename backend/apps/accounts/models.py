from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    """
    User Manager برای مدل User که از national_id استفاده می‌کند
    """
    def create_user(self, national_id, email=None, password=None, **extra_fields):
        if not national_id:
            raise ValueError('کد ملی باید وارد شود')
        
        email = self.normalize_email(email) if email else ''
        user = self.model(national_id=national_id, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, national_id, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'SUPERADMIN')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('سوپریوزر باید is_staff=True داشته باشد')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('سوپریوزر باید is_superuser=True داشته باشد')
        
        return self.create_user(national_id, email, password, **extra_fields)


class User(AbstractUser):
    """
    مدل سفارشی کاربر با استفاده از کد ملی به جای username
    """
    username = None
    
    objects = UserManager()
    
    class Roles(models.TextChoices):
        APPLICANT = "APPLICANT", "داوطلب"
        UNIVERSITY_ADMIN = "UNIVERSITY_ADMIN", "مسئول دانشگاه"
        FACULTY_ADMIN = "FACULTY_ADMIN", "مسئول دانشکده"
        SUPERADMIN = "SUPERADMIN", "سوپر ادمین"
    
    national_id = models.CharField(
        max_length=10,
        unique=True,
        verbose_name="کد ملی",
        db_index=True
    )
    first_name = models.CharField(max_length=100, verbose_name="نام")
    last_name = models.CharField(max_length=100, verbose_name="نام خانوادگی")
    father_name = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="نام پدر"
    )
    
    role = models.CharField(
        max_length=20,
        choices=Roles.choices,
        default=Roles.APPLICANT,
        verbose_name="نقش"
    )
    mobile = models.CharField(max_length=15, blank=True, verbose_name="موبایل")
    email = models.EmailField(blank=True, verbose_name="ایمیل")
    
    # اطلاعات شناسنامه‌ای
    birth_certificate_number = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="شماره شناسنامه"
    )
    birth_certificate_serial = models.CharField(
        max_length=30,
        blank=True,
        verbose_name="شماره سریال شناسنامه"
    )
    birth_certificate_issue_place = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="محل صدور شناسنامه"
    )
    
    # اطلاعات تولد
    class Gender(models.TextChoices):
        MALE = "MALE", "مرد"
        FEMALE = "FEMALE", "زن"
    
    gender = models.CharField(
        max_length=10,
        choices=Gender.choices,
        blank=True,
        verbose_name="جنسیت"
    )
    birth_year = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="سال تولد"
    )
    birth_place = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="محل تولد"
    )
    
    # وضعیت نظام وظیفه (فقط برای مردان)
    class MilitaryStatus(models.TextChoices):
        EXEMPT = "EXEMPT", "معافیت دائم"
        EDUCATIONAL_EXEMPT = "EDUCATIONAL_EXEMPT", "معافیت تحصیلی"
        SERVING = "SERVING", "در حال خدمت"
        COMPLETED = "COMPLETED", "پایان خدمت"
        MEDICAL_EXEMPT = "MEDICAL_EXEMPT", "معافیت پزشکی"
        INCLUDED = "INCLUDED", "مشمول"
    
    military_status = models.CharField(
        max_length=30,
        choices=MilitaryStatus.choices,
        blank=True,
        verbose_name="وضعیت نظام وظیفه",
        help_text="فقط برای مردان الزامی است"
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاریخ بروزرسانی")
    
    USERNAME_FIELD = 'national_id'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'mobile', 'email']
    
    class Meta:
        verbose_name = "کاربر"
        verbose_name_plural = "کاربران"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.national_id})"
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def save(self, *args, **kwargs):
        """
        خودکار تنظیم is_staff بر اساس role
        """
        # اگر نقش UNIVERSITY_ADMIN یا FACULTY_ADMIN یا SUPERADMIN است، باید is_staff=True باشد
        if self.role in ['UNIVERSITY_ADMIN', 'FACULTY_ADMIN', 'SUPERADMIN']:
            self.is_staff = True
        # اگر نقش APPLICANT است، باید is_staff=False باشد
        elif self.role == 'APPLICANT':
            self.is_staff = False
        
        super().save(*args, **kwargs)


class AdminPermission(models.Model):
    """
    دسترسی‌های ادمین
    - مسئول دانشگاه: بررسی صحت و نقص پرونده‌ها
    - مسئول دانشکده: پذیرش یا عدم پذیرش دانشجویان
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='admin_permission',
        verbose_name="کاربر ادمین",
        limit_choices_to={'role__in': ['UNIVERSITY_ADMIN', 'FACULTY_ADMIN', 'SUPERADMIN']}
    )
    
    # دسترسی به انواع فراخوان‌ها
    has_ma_talent_access = models.BooleanField(
        default=False,
        verbose_name="دسترسی به استعداد درخشان ارشد"
    )
    has_phd_talent_access = models.BooleanField(
        default=False,
        verbose_name="دسترسی به استعداد درخشان دکتری"
    )
    has_phd_exam_access = models.BooleanField(
        default=False,
        verbose_name="دسترسی به آزمون دکتری"
    )
    has_olympiad_access = models.BooleanField(
        default=False,
        verbose_name="دسترسی به المپیاد علمی"
    )
    
    # دسترسی به دانشکده‌ها (فقط برای مسئول دانشکده)
    # اگر خالی باشد = دسترسی به همه دانشکده‌ها
    faculties = models.ManyToManyField(
        'core.Faculty',
        blank=True,
        related_name='admin_users',
        verbose_name="دانشکده‌های مجاز"
    )
    
    
    # دسترسی کامل (برای سوپر ادمین)
    has_full_access = models.BooleanField(
        default=False,
        verbose_name="دسترسی کامل به همه موارد"
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاریخ بروزرسانی")
    
    class Meta:
        verbose_name = "دسترسی ادمین"
        verbose_name_plural = "دسترسی‌های ادمین"
    
    def __str__(self):
        return f"دسترسی‌های {self.user.get_full_name()}"
    
    def is_university_admin(self):
        """آیا مسئول دانشگاه است؟"""
        return self.user.role == 'UNIVERSITY_ADMIN' or self.has_full_access
    
    def is_faculty_admin(self):
        """آیا مسئول دانشکده است؟"""
        return self.user.role == 'FACULTY_ADMIN' or self.has_full_access
    
    def has_access_to_round_type(self, round_type):
        """بررسی دسترسی به نوع فراخوان"""
        if self.has_full_access:
            return True
        
        access_map = {
            'MA_TALENT': self.has_ma_talent_access,
            'PHD_TALENT': self.has_phd_talent_access,
            'PHD_EXAM': self.has_phd_exam_access,
            'OLYMPIAD': self.has_olympiad_access,
        }
        
        return access_map.get(round_type, False)
    
    def has_access_to_faculty(self, faculty):
        """بررسی دسترسی به دانشکده (برای مسئول دانشکده)"""
        if self.has_full_access:
            return True
        
        # مسئول دانشگاه به همه دانشکده‌ها دسترسی دارد
        if self.is_university_admin():
            return True
        
        # مسئول دانشکده فقط به دانشکده‌های خودش دسترسی دارد
        if self.is_faculty_admin():
            # اگر هیچ دانشکده‌ای انتخاب نشده = دسترسی به همه
            if not self.faculties.exists():
                return True
            return self.faculties.filter(id=faculty.id).exists()
        
        return False
    
    def get_allowed_faculties(self):
        """دریافت لیست دانشکده‌های مجاز"""
        from apps.core.models import Faculty
        
        if self.has_full_access or self.is_university_admin():
            return Faculty.objects.filter(is_active=True)
        
        if self.is_faculty_admin():
            if not self.faculties.exists():
                return Faculty.objects.filter(is_active=True)
            return self.faculties.filter(is_active=True)
        
        return Faculty.objects.none()



class ApplicantProfile(models.Model):
    """
    پروفایل داوطلب - اطلاعات شخصی و تماس
    این اطلاعات در مرحله دوم ثبت‌نام (بعد از انتخاب رشته) تکمیل می‌شود
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile',
        verbose_name="کاربر"
    )
    
    # اطلاعات تماس (مرحله 2: اطلاعات شخصی)
    address = models.TextField(
        blank=True,
        verbose_name="نشانی محل سکونت دائم"
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="تلفن تماس"
    )
    
    # توجه: mobile و email در مدل User ذخیره می‌شوند
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاریخ بروزرسانی")
    
    class Meta:
        verbose_name = "پروفایل داوطلب"
        verbose_name_plural = "پروفایل‌های داوطلبان"
    
    def __str__(self):
        return f"پروفایل {self.user.get_full_name()}"
