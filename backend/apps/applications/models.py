import random
import string
from django.db import models
from django.utils import timezone
from apps.core.models import TimeStampedModel, University, UniversityWeight
from apps.admissions.models import AdmissionRound, Program
from apps.accounts.models import ApplicantProfile, User


def generate_tracking_code():
    """تولید کد پیگیری تصادفی"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))


class Application(TimeStampedModel):
    """
    پرونده درخواست ثبت‌نام داوطلب
    """
    class Status(models.TextChoices):
        # مراحل ثبت‌نام داوطلب
        NEW = "NEW", "ثبت‌نام اولیه"
        PROGRAM_SELECTED = "PROGRAM_SELECTED", "رشته انتخاب شد"
        PERSONAL_INFO_COMPLETED = "PERSONAL_INFO_COMPLETED", "اطلاعات شخصی تکمیل شد"
        IDENTITY_DOCS_UPLOADED = "IDENTITY_DOCS_UPLOADED", "مدارک شناسایی آپلود شد"
        EDU_INFO_COMPLETED = "EDU_INFO_COMPLETED", "اطلاعات تحصیلی تکمیل شد"
        EDU_DOCS_UPLOADED = "EDU_DOCS_UPLOADED", "مدارک تحصیلی آپلود شد"
        SUBMITTED = "SUBMITTED", "ارسال شده (منتظر بررسی)"
        
        # مراحل بررسی مسئول دانشگاه
        UNDER_UNIVERSITY_REVIEW = "UNDER_UNIVERSITY_REVIEW", "در حال بررسی توسط مسئول دانشگاه"
        APPROVED_BY_UNIVERSITY = "APPROVED_BY_UNIVERSITY", "تایید شده توسط مسئول دانشگاه"
        REJECTED_BY_UNIVERSITY = "REJECTED_BY_UNIVERSITY", "رد شده توسط مسئول دانشگاه"
        RETURNED_FOR_CORRECTION = "RETURNED_FOR_CORRECTION", "برگشت برای اصلاح نواقص"
        
        # مراحل بررسی مسئول دانشکده
        UNDER_FACULTY_REVIEW = "UNDER_FACULTY_REVIEW", "در حال بررسی توسط مسئول دانشکده"
        FACULTY_REVIEW_COMPLETED = "FACULTY_REVIEW_COMPLETED", "بررسی دانشکده تکمیل شد"
        
        # وضعیت نهایی
        COMPLETED = "COMPLETED", "تکمیل شده"
        
        # وضعیت‌های خاص
        INELIGIBLE = "INELIGIBLE", "فاقد شرایط"
        DELETED = "DELETED", "حذف شده"
    
    applicant = models.ForeignKey(
        ApplicantProfile,
        on_delete=models.CASCADE,
        related_name='applications',
        verbose_name="داوطلب"
    )
    round = models.ForeignKey(
        AdmissionRound,
        on_delete=models.PROTECT,
        related_name='applications',
        verbose_name="فراخوان"
    )
    tracking_code = models.CharField(
        max_length=20,
        unique=True,
        default=generate_tracking_code,
        verbose_name="کد پیگیری"
    )
    
    status = models.CharField(
        max_length=50,
        choices=Status.choices,
        default=Status.NEW,
        verbose_name="وضعیت"
    )
    
    university_of_study = models.ForeignKey(
        University,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='applications',
        verbose_name="دانشگاه محل تحصیل"
    )
    university_weight = models.ForeignKey(
        UniversityWeight,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='applications',
        verbose_name="ضریب دانشگاه"
    )
    
    rank_percentile_group = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="گروه رتبه"
    )
    
    total_score = models.FloatField(default=0, verbose_name="امتیاز نهایی")
    score_calculated_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="تاریخ محاسبه امتیاز"
    )
    
    # بررسی توسط مسئول دانشگاه
    class UniversityReviewStatus(models.TextChoices):
        PENDING = "PENDING", "در انتظار بررسی"
        APPROVED = "APPROVED", "تایید شده"
        APPROVED_WITH_DEFECT = "APPROVED_WITH_DEFECT", "تایید با نقص"
        REJECTED = "REJECTED", "رد شده"
    
    university_review_status = models.CharField(
        max_length=30,
        choices=UniversityReviewStatus.choices,
        default=UniversityReviewStatus.PENDING,
        verbose_name="وضعیت بررسی مسئول دانشگاه"
    )
    university_review_comment = models.TextField(
        blank=True,
        verbose_name="نظر مسئول دانشگاه"
    )
    university_reviewed_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='university_reviewed_applications',
        verbose_name="بررسی شده توسط مسئول دانشگاه"
    )
    university_reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="تاریخ بررسی مسئول دانشگاه"
    )
    
    # بررسی توسط مسئول دانشکده
    faculty_review_completed = models.BooleanField(
        default=False,
        verbose_name="بررسی دانشکده تکمیل شده"
    )
    faculty_review_comment = models.TextField(
        blank=True,
        verbose_name="نظر مسئول دانشکده"
    )
    faculty_reviewed_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='faculty_reviewed_applications',
        verbose_name="بررسی شده توسط مسئول دانشکده"
    )
    faculty_reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="تاریخ بررسی مسئول دانشکده"
    )
    
    # وضعیت نهایی پذیرش
    admission_overall_status = models.CharField(
        max_length=30,
        choices=[
            ("ADMITTED", "پذیرفته شده"),
            ("REJECTED", "پذیرفته نشده"),
            ("WAITING", "ذخیره"),
            ("CANCELED", "لغو شده"),
        ],
        blank=True,
        verbose_name="وضعیت نهایی پذیرش"
    )
    admission_result_published_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="تاریخ اعلام نتیجه"
    )
    
    class Meta:
        verbose_name = "درخواست ثبت‌نام"
        verbose_name_plural = "درخواست‌های ثبت‌نام"
        ordering = ['-created_at']
        unique_together = ['applicant', 'round']
    
    def __str__(self):
        return f"{self.applicant.user.get_full_name()} - {self.round.title} ({self.tracking_code})"
    
    def save(self, *args, **kwargs):
        # اطمینان از یکتا بودن کد پیگیری
        if not self.tracking_code:
            while True:
                code = generate_tracking_code()
                if not Application.objects.filter(tracking_code=code).exists():
                    self.tracking_code = code
                    break
        super().save(*args, **kwargs)


class ApplicationChoice(TimeStampedModel):
    """
    انتخاب‌های رشته/گرایش داوطلب
    """
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='choices',
        verbose_name="درخواست"
    )
    program = models.ForeignKey(
        Program,
        on_delete=models.PROTECT,
        related_name='application_choices',
        verbose_name="برنامه تحصیلی"
    )
    priority = models.PositiveIntegerField(verbose_name="اولویت انتخاب")
    
    admission_status = models.CharField(
        max_length=20,
        choices=[
            ("PENDING", "در انتظار"),
            ("ACCEPTED", "پذیرفته شده"),
            ("REJECTED", "پذیرفته نشده"),
            ("WAITING", "ذخیره"),
        ],
        default="PENDING",
        verbose_name="وضعیت پذیرش"
    )
    admission_priority_result = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="اولویت در نتیجه"
    )
    admission_note = models.TextField(blank=True, verbose_name="یادداشت")
    
    class Meta:
        verbose_name = "انتخاب رشته"
        verbose_name_plural = "انتخاب‌های رشته"
        ordering = ['application', 'priority']
        unique_together = ['application', 'priority']
    
    def __str__(self):
        return f"{self.application.tracking_code} - اولویت {self.priority}: {self.program.name}"


class ApplicationEducationRecord(TimeStampedModel):
    """
    سوابق تحصیلی داوطلب - مرحله 4: اطلاعات تحصیلی
    این اطلاعات برای استعداد درخشان ارشد در مرحله چهارم پر می‌شود
    """
    DEGREE_LEVEL_CHOICES = [
        ("BSC", "کارشناسی"),
        ("MSC", "کارشناسی ارشد"),
        ("PHD", "دکتری"),
    ]
    
    STATUS_CHOICES = [
        ("STUDYING", "در حال تحصیل"),
        ("GRADUATED", "فارغ‌التحصیل")
    ]
    
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='education_records',
        verbose_name="درخواست"
    )
    degree_level = models.CharField(
        max_length=10,
        choices=DEGREE_LEVEL_CHOICES,
        verbose_name="مقطع",
        default="BSC"
    )
    
    # وضعیت تحصیل
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        verbose_name="وضعیت تحصیل",
        help_text="آیا در حال تحصیل است یا فارغ‌التحصیل شده؟"
    )
    
    # دانشگاه (باید از لیست انتخاب شود)
    university = models.ForeignKey(
        University,
        on_delete=models.PROTECT,
        related_name='education_records',
        verbose_name="دانشگاه",
        help_text="از لیست دانشگاه‌ها انتخاب کنید (قابل جستجو)"
    )
    
    # رشته تحصیلی (باید از لیست انتخاب شود)
    field_of_study = models.CharField(
        max_length=255,
        verbose_name="رشته تحصیلی",
        help_text="از لیست رشته‌ها انتخاب کنید (قابل جستجو)"
    )
    
    # معدل
    gpa = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="معدل",
        help_text="معدل کل دوره تحصیلی"
    )
    
    # ماه و سال شروع دوره
    start_month = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="ماه شروع دوره",
        help_text="عدد بین 1 تا 12"
    )
    start_year = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="سال شروع دوره",
        help_text="مثال: 1398"
    )
    
    # ماه و سال اخذ مدرک (فقط برای فارغ‌التحصیلان)
    graduation_month = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="ماه اخذ مدرک",
        help_text="عدد بین 1 تا 12"
    )
    graduation_year = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="سال اخذ مدرک",
        help_text="مثال: 1402"
    )
    
    # فیلدهای اضافی برای ارشد (فقط برای استعداد درخشان ارشد)
    total_units_passed = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="تعداد واحد گذرانده",
        help_text="برای ارشد: تا پایان نیمسال ششم"
    )
    semester_count = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="تعداد نیمسال گذرانده",
        help_text="فقط برای استعداد درخشان ارشد"
    )
    class_size = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="تعداد دانشجو دوره",
        help_text="فقط برای استعداد درخشان ارشد"
    )
    rank_status = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="وضعیت رتبه",
        help_text="مثال: رتبه 2 از 30 درصد (دهمه اصلی) - فقط برای ارشد"
    )
    
    # ============================================
    # امتیازدهی توسط کارشناس (برای دکتری)
    # ============================================
    
    # امتیاز معدل (بر اساس جدول)
    gpa_score = models.FloatField(
        default=0,
        verbose_name="امتیاز معدل",
        help_text="بر اساس جدول امتیازدهی"
    )
    
    # امتیاز دانشگاه (بر اساس ضریب)
    university_score = models.FloatField(
        default=0,
        verbose_name="امتیاز دانشگاه",
        help_text="بر اساس ضریب دانشگاه"
    )
    
    # امتیاز طول مدت دوره
    duration_score = models.FloatField(
        default=0,
        verbose_name="امتیاز طول مدت دوره",
        help_text="کارشناسی: تا 3 امتیاز | ارشد: تا 3 امتیاز"
    )
    
    # امتیاز کل این مقطع تحصیلی
    total_score = models.FloatField(
        default=0,
        verbose_name="امتیاز کل",
        help_text="جمع امتیازهای این مقطع (معدل + دانشگاه + طول مدت)"
    )
    
    # بررسی توسط کارشناس
    reviewed_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reviewed_education_records',
        verbose_name="بررسی‌کننده"
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="تاریخ بررسی"
    )
    review_comment = models.TextField(
        blank=True,
        verbose_name="نظر کارشناس"
    )
    
    class Meta:
        verbose_name = "سابقه تحصیلی"
        verbose_name_plural = "سوابق تحصیلی"
        ordering = ['application', '-degree_level']
    
    def __str__(self):
        return f"{self.get_degree_level_display()} - {self.field_of_study} ({self.university.name})"


class EducationScoring(TimeStampedModel):
    """
    امتیازدهی کلی سوابق تحصیلی (دستی توسط کارشناس)
    
    این 6 امتیاز به صورت کاملاً دستی توسط کارشناس وارد می‌شود:
    1. معدل و کیفیت دانشگاه کارشناسی: تا 6 امتیاز
    2. معدل و کیفیت دانشگاه ارشد: تا 5 امتیاز
    3. طول مدت دوره کارشناسی: تا 3 امتیاز
    4. طول مدت دوره ارشد: تا 3 امتیاز
    5. برگزیدگان المپیادهای علمی: تا 5 امتیاز
    6. مدرک زبان معتبر: تا 8 امتیاز
    """
    application = models.OneToOneField(
        Application,
        on_delete=models.CASCADE,
        related_name='education_scoring',
        verbose_name="درخواست"
    )
    
    # 1. معدل و کیفیت دانشگاه کارشناسی (تا 6 امتیاز)
    bsc_gpa_university_score = models.FloatField(
        default=0,
        verbose_name="معدل و کیفیت دانشگاه کارشناسی",
        help_text="حداکثر 6 امتیاز - کارشناس به صورت دستی وارد می‌کند"
    )
    
    # 2. معدل و کیفیت دانشگاه ارشد (تا 5 امتیاز)
    msc_gpa_university_score = models.FloatField(
        default=0,
        verbose_name="معدل و کیفیت دانشگاه ارشد",
        help_text="حداکثر 5 امتیاز - کارشناس به صورت دستی وارد می‌کند"
    )
    
    # 3. طول مدت دوره کارشناسی (تا 3 امتیاز)
    bsc_duration_score = models.FloatField(
        default=0,
        verbose_name="طول مدت دوره کارشناسی",
        help_text="حداکثر 3 امتیاز - کارشناس به صورت دستی وارد می‌کند"
    )
    
    # 4. طول مدت دوره ارشد (تا 3 امتیاز)
    msc_duration_score = models.FloatField(
        default=0,
        verbose_name="طول مدت دوره ارشد",
        help_text="حداکثر 3 امتیاز - کارشناس به صورت دستی وارد می‌کند"
    )
    
    # 5. برگزیدگان المپیادهای علمی (تا 5 امتیاز)
    olympiad_score = models.FloatField(
        default=0,
        verbose_name="برگزیدگان المپیادهای علمی",
        help_text="حداکثر 5 امتیاز - کارشناس به صورت دستی وارد می‌کند"
    )
    
    # 6. مدرک زبان معتبر (تا 8 امتیاز)
    language_certificate_score = models.FloatField(
        default=0,
        verbose_name="مدرک زبان معتبر",
        help_text="حداکثر 8 امتیاز - کارشناس به صورت دستی وارد می‌کند"
    )
    
    # جمع کل امتیازات (محاسبه خودکار)
    total_score = models.FloatField(
        default=0,
        verbose_name="جمع کل امتیازات",
        help_text="جمع 6 امتیاز بالا (حداکثر 30 امتیاز)"
    )
    
    # اطلاعات بررسی
    scored_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='education_scorings',
        verbose_name="ثبت‌کننده امتیازها"
    )
    scored_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="تاریخ ثبت امتیازها"
    )
    comment = models.TextField(
        blank=True,
        verbose_name="توضیحات کارشناس"
    )
    
    class Meta:
        verbose_name = "امتیازدهی سوابق تحصیلی"
        verbose_name_plural = "امتیازدهی سوابق تحصیلی"
    
    def __str__(self):
        return f"امتیازدهی {self.application.tracking_code} - جمع: {self.total_score}"
    
    def calculate_total(self):
        """محاسبه خودکار جمع امتیازها"""
        self.total_score = (
            self.bsc_gpa_university_score +
            self.msc_gpa_university_score +
            self.bsc_duration_score +
            self.msc_duration_score +
            self.olympiad_score +
            self.language_certificate_score
        )
        return self.total_score
    
    def save(self, *args, **kwargs):
        """محاسبه جمع قبل از ذخیره"""
        self.calculate_total()
        super().save(*args, **kwargs)


class ScientificRecord(TimeStampedModel):
    """
    سوابق علمی داوطلب - برای استعداد درخشان ارشد (ساده)
    """
    class RecordType(models.TextChoices):
        ARTICLE = "ARTICLE", "مقاله"
        BOOK = "BOOK", "کتاب"
        CONFERENCE = "CONFERENCE", "مقاله کنفرانسی"
        PATENT = "PATENT", "اختراع"
        OTHER = "OTHER", "سایر"
    
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='scientific_records',
        verbose_name="درخواست"
    )
    type = models.CharField(
        max_length=20,
        choices=RecordType.choices,
        verbose_name="نوع"
    )
    title = models.CharField(max_length=255, verbose_name="عنوان")
    journal_or_event = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="ژورنال/رویداد"
    )
    year = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="سال"
    )
    score = models.FloatField(default=0, verbose_name="امتیاز")
    file = models.FileField(
        upload_to='scientific_records/',
        null=True,
        blank=True,
        verbose_name="فایل"
    )
    
    class Meta:
        verbose_name = "سابقه علمی"
        verbose_name_plural = "سوابق علمی"
        ordering = ['application', '-year']
    
    def __str__(self):
        return f"{self.get_type_display()}: {self.title}"


# ============================================
# مدل‌های سوابق پژوهشی برای دکتری
# ============================================

class ResearchArticle(TimeStampedModel):
    """
    مقالات علمی - پژوهشی و ترویجی (برای دکتری)
    
    دسته‌بندی امتیازات:
    1. مقالات علمی-پژوهشی + اختراع + جشنواره: حداکثر 40 امتیاز
    2. مقالات علمی-ترویجی: حداکثر 6 امتیاز
    3. مقالات کنفرانس: حداکثر 4 امتیاز
    """
    
    class ArticleType(models.TextChoices):
        RESEARCH_NATIONAL = "RESEARCH_NATIONAL", "علمی-پژوهشی (ملی)"
        RESEARCH_INTERNATIONAL = "RESEARCH_INTERNATIONAL", "علمی-پژوهشی (بین‌المللی)"
        PROMOTIONAL_NATIONAL = "PROMOTIONAL_NATIONAL", "علمی-ترویجی (ملی)"
        PROMOTIONAL_INTERNATIONAL = "PROMOTIONAL_INTERNATIONAL", "علمی-ترویجی (بین‌المللی)"
    
    class ArticleStatus(models.TextChoices):
        NOT_RELATED = "NOT_RELATED", "غیرمرتبط با پایان‌نامه"
        EXTRACTED_FROM_THESIS = "EXTRACTED_FROM_THESIS", "استخراج شده از پایان‌نامه"
    
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='research_articles',
        verbose_name="درخواست"
    )
    
    # عنوان مقاله
    title_fa = models.CharField(
        max_length=500,
        verbose_name="عنوان فارسی"
    )
    title_en = models.CharField(
        max_length=500,
        blank=True,
        verbose_name="عنوان انگلیسی"
    )
    
    # اطلاعات نشریه
    journal_name = models.CharField(
        max_length=300,
        verbose_name="عنوان نشریه"
    )
    issn = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="ISSN"
    )
    
    # نوع و وضعیت
    article_type = models.CharField(
        max_length=50,
        choices=ArticleType.choices,
        verbose_name="نوع نشریه"
    )
    status = models.CharField(
        max_length=30,
        choices=ArticleStatus.choices,
        verbose_name="وضعیت"
    )
    
    # تاریخ و لینک
    publish_date = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="تاریخ چاپ یا پذیرش"
    )
    link = models.URLField(
        max_length=500,
        blank=True,
        verbose_name="لینک مقاله"
    )
    
    # نویسندگان
    authors = models.TextField(
        verbose_name="نویسندگان",
        help_text="نام نویسندگان را با ویرگول جدا کنید"
    )
    
    # کد رکورد
    record_code = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="کد رکورد"
    )
    
    # فایل مقاله
    file = models.FileField(
        upload_to='phd/research_articles/',
        verbose_name="فایل مقاله و مدارک"
    )
    
    # امتیاز (توسط مسئول تعیین می‌شود)
    score = models.FloatField(
        default=0,
        verbose_name="امتیاز",
        help_text="امتیاز توسط مسئول بررسی تعیین می‌شود"
    )
    reviewed_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reviewed_research_articles',
        verbose_name="بررسی‌کننده"
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="تاریخ بررسی"
    )
    
    class Meta:
        verbose_name = "مقاله پژوهشی"
        verbose_name_plural = "مقالات پژوهشی"
        ordering = ['application', '-created_at']
    
    def __str__(self):
        return f"{self.title_fa} - {self.get_article_type_display()}"


class Patent(TimeStampedModel):
    """
    گواهی ثبت اختراع (برای دکتری)
    جزو گروه 40 امتیازی
    """
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='patents',
        verbose_name="درخواست"
    )
    
    title_fa = models.CharField(
        max_length=500,
        verbose_name="عنوان فارسی"
    )
    title_en = models.CharField(
        max_length=500,
        blank=True,
        verbose_name="عنوان انگلیسی"
    )
    
    patent_number = models.CharField(
        max_length=100,
        verbose_name="شماره ثبت اختراع"
    )
    
    registration_date = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="تاریخ ثبت"
    )
    
    inventors = models.TextField(
        verbose_name="مخترعان",
        help_text="نام مخترعان را با ویرگول جدا کنید"
    )
    
    file = models.FileField(
        upload_to='phd/patents/',
        verbose_name="فایل گواهی"
    )
    
    score = models.FloatField(
        default=0,
        verbose_name="امتیاز"
    )
    reviewed_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reviewed_patents',
        verbose_name="بررسی‌کننده"
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="تاریخ بررسی"
    )
    
    class Meta:
        verbose_name = "ثبت اختراع"
        verbose_name_plural = "ثبت اختراعات"
        ordering = ['application', '-created_at']
    
    def __str__(self):
        return f"{self.title_fa} - {self.patent_number}"


class FestivalAward(TimeStampedModel):
    """
    کسب مقام برگزیده در جشنواره‌های علمی معتبر (برای دکتری)
    جزو گروه 40 امتیازی
    """
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='festival_awards',
        verbose_name="درخواست"
    )
    
    festival_name = models.CharField(
        max_length=300,
        verbose_name="نام جشنواره"
    )
    
    award_title = models.CharField(
        max_length=300,
        verbose_name="عنوان جایزه/مقام"
    )
    
    year = models.PositiveIntegerField(
        verbose_name="سال"
    )
    
    description = models.TextField(
        blank=True,
        verbose_name="توضیحات"
    )
    
    file = models.FileField(
        upload_to='phd/festival_awards/',
        verbose_name="فایل گواهی"
    )
    
    score = models.FloatField(
        default=0,
        verbose_name="امتیاز"
    )
    reviewed_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reviewed_festival_awards',
        verbose_name="بررسی‌کننده"
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="تاریخ بررسی"
    )
    
    class Meta:
        verbose_name = "جایزه جشنواره"
        verbose_name_plural = "جوایز جشنواره"
        ordering = ['application', '-year']
    
    def __str__(self):
        return f"{self.festival_name} - {self.award_title} ({self.year})"


class ConferenceArticle(TimeStampedModel):
    """
    مقالات در کنفرانس‌های معتبر (برای دکتری)
    سقف امتیاز: 4
    """
    class ConferenceType(models.TextChoices):
        NATIONAL = "NATIONAL", "داخلی"
        INTERNATIONAL = "INTERNATIONAL", "خارجی"
    
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='conference_articles',
        verbose_name="درخواست"
    )
    
    title_fa = models.CharField(
        max_length=500,
        verbose_name="عنوان فارسی"
    )
    title_en = models.CharField(
        max_length=500,
        blank=True,
        verbose_name="عنوان انگلیسی"
    )
    
    conference_name = models.CharField(
        max_length=300,
        verbose_name="نام کنفرانس"
    )
    
    conference_type = models.CharField(
        max_length=20,
        choices=ConferenceType.choices,
        verbose_name="نوع کنفرانس"
    )
    
    year = models.PositiveIntegerField(
        verbose_name="سال"
    )
    
    authors = models.TextField(
        verbose_name="نویسندگان"
    )
    
    file = models.FileField(
        upload_to='phd/conference_articles/',
        verbose_name="فایل مقاله"
    )
    
    score = models.FloatField(
        default=0,
        verbose_name="امتیاز",
        help_text="حداکثر 4 امتیاز"
    )
    reviewed_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reviewed_conference_articles',
        verbose_name="بررسی‌کننده"
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="تاریخ بررسی"
    )
    
    class Meta:
        verbose_name = "مقاله کنفرانس"
        verbose_name_plural = "مقالات کنفرانس"
        ordering = ['application', '-year']
    
    def __str__(self):
        return f"{self.title_fa} - {self.conference_name}"


class Book(TimeStampedModel):
    """
    تألیف یا ترجمه کتاب مرتبط با رشته تحصیلی (برای دکتری)
    سقف امتیاز: 4
    """
    class BookType(models.TextChoices):
        AUTHORSHIP = "AUTHORSHIP", "تألیف"
        TRANSLATION = "TRANSLATION", "ترجمه"
    
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='books',
        verbose_name="درخواست"
    )
    
    title_fa = models.CharField(
        max_length=500,
        verbose_name="عنوان فارسی"
    )
    title_en = models.CharField(
        max_length=500,
        blank=True,
        verbose_name="عنوان انگلیسی"
    )
    
    book_type = models.CharField(
        max_length=20,
        choices=BookType.choices,
        verbose_name="نوع"
    )
    
    publisher = models.CharField(
        max_length=200,
        verbose_name="ناشر"
    )
    
    isbn = models.CharField(
        max_length=30,
        blank=True,
        verbose_name="ISBN"
    )
    
    publish_year = models.PositiveIntegerField(
        verbose_name="سال انتشار"
    )
    
    authors_or_translators = models.TextField(
        verbose_name="نویسندگان/مترجمان"
    )
    
    file = models.FileField(
        upload_to='phd/books/',
        verbose_name="فایل کتاب/مدارک"
    )
    
    score = models.FloatField(
        default=0,
        verbose_name="امتیاز",
        help_text="حداکثر 4 امتیاز"
    )
    reviewed_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reviewed_books',
        verbose_name="بررسی‌کننده"
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="تاریخ بررسی"
    )
    
    class Meta:
        verbose_name = "کتاب"
        verbose_name_plural = "کتاب‌ها"
        ordering = ['application', '-publish_year']
    
    def __str__(self):
        return f"{self.title_fa} - {self.get_book_type_display()}"


class MastersThesis(TimeStampedModel):
    """
    پایان‌نامه کارشناسی ارشد (برای دکتری)
    سقف امتیاز: 4
    """
    application = models.OneToOneField(
        Application,
        on_delete=models.CASCADE,
        related_name='masters_thesis',
        verbose_name="درخواست"
    )
    
    title_fa = models.CharField(
        max_length=500,
        verbose_name="عنوان فارسی"
    )
    title_en = models.CharField(
        max_length=500,
        blank=True,
        verbose_name="عنوان انگلیسی"
    )
    
    grade = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name="نمره پایان‌نامه"
    )
    
    defense_date = models.CharField(
        max_length=50,
        verbose_name="تاریخ دفاع"
    )
    
    # فایل صورت جلسه دفاع
    defense_minutes_file = models.FileField(
        upload_to='phd/thesis/defense_minutes/',
        verbose_name="فایل صورت جلسه دفاع"
    )
    
    # اساتید راهنما
    main_supervisor = models.CharField(
        max_length=200,
        verbose_name="استاد راهنمای اول"
    )
    second_supervisor = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="استاد راهنمای دوم"
    )
    
    # اساتید مشاور
    advisor_1 = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="استاد مشاور اول"
    )
    advisor_2 = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="استاد مشاور دوم"
    )
    
    score = models.FloatField(
        default=0,
        verbose_name="امتیاز کیفیت پایان‌نامه",
        help_text="حداکثر 4 امتیاز"
    )
    reviewed_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reviewed_theses',
        verbose_name="بررسی‌کننده"
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="تاریخ بررسی"
    )
    
    class Meta:
        verbose_name = "پایان‌نامه ارشد"
        verbose_name_plural = "پایان‌نامه‌های ارشد"
    
    def __str__(self):
        return f"پایان‌نامه: {self.title_fa}"
    
    def __str__(self):
        return f"{self.get_type_display()}: {self.title}"


class RegistrationPayment(TimeStampedModel):
    """
    پرداخت هزینه ثبت‌نام
    """
    class PaymentStatus(models.TextChoices):
        PENDING = "PENDING", "در انتظار"
        PAID = "PAID", "پرداخت شده"
        VERIFIED = "VERIFIED", "تایید شده"
        FAILED = "FAILED", "ناموفق"
    
    application = models.OneToOneField(
        Application,
        on_delete=models.CASCADE,
        related_name='payment',
        verbose_name="درخواست"
    )
    
    # اطلاعات پرداخت
    amount = models.PositiveIntegerField(
        verbose_name="مبلغ (ریال)"
    )
    transaction_id = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="شناسه تراکنش"
    )
    electronic_receipt = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="رسید الکترونیکی"
    )
    
    # وضعیت پرداخت
    status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        verbose_name="وضعیت پرداخت"
    )
    
    # تاریخ‌ها
    paid_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="تاریخ پرداخت"
    )
    verified_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="تاریخ تایید"
    )
    verified_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='verified_payments',
        verbose_name="تایید شده توسط"
    )
    
    # فایل تاییدیه
    confirmation_file = models.FileField(
        upload_to='payments/confirmations/',
        null=True,
        blank=True,
        verbose_name="فایل تاییدیه"
    )
    
    class Meta:
        verbose_name = "پرداخت هزینه ثبت‌نام"
        verbose_name_plural = "پرداخت‌های هزینه ثبت‌نام"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.application.tracking_code} - {self.get_status_display()}: {self.amount:,} ریال"


# ============================================
# مدل المپیاد (تا 5 امتیاز)
# ============================================

class OlympiadRecord(TimeStampedModel):
    """
    برگزیدگان المپیادهای علمی
    سقف امتیاز: 5
    """
    class OlympiadType(models.TextChoices):
        PHYSICS = "PHYSICS", "المپیاد فیزیک"
        CHEMISTRY = "CHEMISTRY", "المپیاد شیمی"
        MATHEMATICS = "MATHEMATICS", "المپیاد ریاضی"
        COMPUTER = "COMPUTER", "المپیاد کامپیوتر"
        BIOLOGY = "BIOLOGY", "المپیاد زیست‌شناسی"
        OTHER = "OTHER", "سایر المپیادها"
    
    class RankLevel(models.TextChoices):
        GOLD = "GOLD", "رتبه طلا"
        SILVER = "SILVER", "رتبه نقره"
        BRONZE = "BRONZE", "رتبه برنز"
        TOP_10 = "TOP_10", "10 نفر برتر"
        TOP_20 = "TOP_20", "20 نفر برتر"
        PARTICIPANT = "PARTICIPANT", "شرکت‌کننده"
    
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='olympiad_records',
        verbose_name="درخواست"
    )
    
    olympiad_type = models.CharField(
        max_length=20,
        choices=OlympiadType.choices,
        verbose_name="نوع المپیاد"
    )
    
    olympiad_name = models.CharField(
        max_length=300,
        verbose_name="نام دقیق المپیاد",
        help_text="مثال: المپیاد فیزیک کشور - مرحله کشوری"
    )
    
    year = models.PositiveIntegerField(
        verbose_name="سال برگزاری",
        help_text="سال شمسی"
    )
    
    rank_level = models.CharField(
        max_length=20,
        choices=RankLevel.choices,
        verbose_name="سطح رتبه"
    )
    
    rank_number = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="رتبه عددی",
        help_text="در صورت وجود"
    )
    
    # فایل مدرک المپیاد
    certificate_file = models.FileField(
        upload_to='olympiad_certificates/',
        verbose_name="فایل مدرک المپیاد"
    )
    
    # امتیازدهی
    score = models.FloatField(
        default=0,
        verbose_name="امتیاز",
        help_text="حداکثر 5 امتیاز"
    )
    
    reviewed_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reviewed_olympiad_records',
        verbose_name="بررسی‌کننده"
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="تاریخ بررسی"
    )
    review_comment = models.TextField(
        blank=True,
        verbose_name="نظر کارشناس"
    )
    
    class Meta:
        verbose_name = "رکورد المپیاد"
        verbose_name_plural = "رکوردهای المپیاد"
        ordering = ['application', '-year', 'rank_level']
    
    def __str__(self):
        return f"{self.get_olympiad_type_display()} - {self.year} - {self.get_rank_level_display()}"


# ============================================
# مدل مدرک زبان (تا 8 امتیاز)
# ============================================

class LanguageCertificate(TimeStampedModel):
    """
    مدرک زبان معتبر
    سقف امتیاز: 8
    """
    class LanguageType(models.TextChoices):
        ENGLISH = "ENGLISH", "انگلیسی"
        FRENCH = "FRENCH", "فرانسه"
        GERMAN = "GERMAN", "آلمانی"
        ARABIC = "ARABIC", "عربی"
        OTHER = "OTHER", "سایر زبان‌ها"
    
    class CertificateType(models.TextChoices):
        # انگلیسی
        TOEFL = "TOEFL", "تافل (TOEFL)"
        IELTS = "IELTS", "آیلتس (IELTS)"
        GRE = "GRE", "جی آر ای (GRE)"
        MSRT = "MSRT", "ام اس آر تی (MSRT)"
        EPT = "EPT", "EPT دانشگاه آزاد"
        
        # فرانسه
        DELF = "DELF", "DELF"
        DALF = "DALF", "DALF"
        TCF = "TCF", "TCF"
        
        # آلمانی
        GOETHE = "GOETHE", "گوته (Goethe)"
        TESTDAF = "TESTDAF", "TestDaF"
        
        # عربی
        ARABIC_TOAFL = "ARABIC_TOAFL", "تافل عربی"
        
        OTHER = "OTHER", "سایر مدارک"
    
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='language_certificates',
        verbose_name="درخواست"
    )
    
    language = models.CharField(
        max_length=20,
        choices=LanguageType.choices,
        verbose_name="زبان"
    )
    
    certificate_type = models.CharField(
        max_length=30,
        choices=CertificateType.choices,
        verbose_name="نوع مدرک"
    )
    
    certificate_number = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="شماره مدرک"
    )
    
    issue_date = models.CharField(
        max_length=50,
        verbose_name="تاریخ صدور"
    )
    
    expiry_date = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="تاریخ انقضا"
    )
    
    # نمره/امتیاز آزمون
    test_score = models.CharField(
        max_length=50,
        verbose_name="نمره آزمون",
        help_text="مثال: 7.5 برای IELTS یا 100 برای TOEFL"
    )
    
    # فایل مدرک
    certificate_file = models.FileField(
        upload_to='language_certificates/',
        verbose_name="فایل مدرک زبان"
    )
    
    # امتیازدهی
    score = models.FloatField(
        default=0,
        verbose_name="امتیاز",
        help_text="حداکثر 8 امتیاز بر اساس نمره آزمون"
    )
    
    reviewed_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reviewed_language_certificates',
        verbose_name="بررسی‌کننده"
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="تاریخ بررسی"
    )
    review_comment = models.TextField(
        blank=True,
        verbose_name="نظر کارشناس"
    )
    
    class Meta:
        verbose_name = "مدرک زبان"
        verbose_name_plural = "مدارک زبان"
        ordering = ['application', '-issue_date']
    
    def __str__(self):
        return f"{self.get_certificate_type_display()} - نمره: {self.test_score}"


# ============================================
# مدل مصاحبه (برای دکتری)
# ============================================

class Interview(TimeStampedModel):
    """
    مصاحبه داوطلب استعداد درخشان دکتری
    
    بر اساس تصویر ارسالی، امتیازدهی شامل:
    1. تشارک در تجربه و تحلیل مسائل علمی و پاسخگویی به سوالات (3 امتیاز)
    2. وسعت نظر، خلاقیت و کاربردی‌بودن (3 امتیاز)
    3. شخصیت، صحت و حجم بیان (3 امتیاز)
    4. نگارش و مدارک فراواحد مرتبط با رشته تحصیلی (3 امتیاز)
    5. برناسی فن بیان و احتمال موفق (3 امتیاز)
    6. همراستایی پژوهشی داوطلب با آزمایشگاه‌های علمی تخصصی گروه (15 امتیاز)
    
    جمع: 30 امتیاز
    """
    
    class InterviewStatus(models.TextChoices):
        PENDING = "PENDING", "در انتظار مصاحبه"
        SCHEDULED = "SCHEDULED", "زمان مصاحبه تعیین شده"
        COMPLETED = "COMPLETED", "مصاحبه انجام شده"
        ABSENT = "ABSENT", "غیبت در مصاحبه"
        CANCELLED = "CANCELLED", "لغو شده"
    
    application = models.OneToOneField(
        Application,
        on_delete=models.CASCADE,
        related_name='interview',
        verbose_name="درخواست"
    )
    
    # زمان‌بندی مصاحبه
    scheduled_date = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="تاریخ و زمان مصاحبه"
    )
    location = models.CharField(
        max_length=300,
        blank=True,
        verbose_name="محل برگزاری"
    )
    
    # وضعیت
    status = models.CharField(
        max_length=20,
        choices=InterviewStatus.choices,
        default=InterviewStatus.PENDING,
        verbose_name="وضعیت مصاحبه"
    )
    
    # ============================================
    # امتیازدهی مصاحبه (حداکثر 30 امتیاز)
    # ============================================
    
    # 1. تشارک در تجربه و تحلیل مسائل علمی
    experience_analysis_score = models.FloatField(
        default=0,
        verbose_name="تشارک در تجربه و تحلیل مسائل علمی",
        help_text="حداکثر 3 امتیاز"
    )
    
    # 2. وسعت نظر، خلاقیت و کاربردی‌بودن
    creativity_score = models.FloatField(
        default=0,
        verbose_name="وسعت نظر، خلاقیت و کاربردی‌بودن",
        help_text="حداکثر 3 امتیاز"
    )
    
    # 3. شخصیت، صحت و حجم بیان
    personality_expression_score = models.FloatField(
        default=0,
        verbose_name="شخصیت، صحت و حجم بیان",
        help_text="حداکثر 3 امتیاز"
    )
    
    # 4. نگارش و مدارک فراواحد مرتبط با رشته
    documentation_score = models.FloatField(
        default=0,
        verbose_name="نگارش و مدارک فراواحد مرتبط با رشته تحصیلی",
        help_text="حداکثر 3 امتیاز"
    )
    
    # 5. برناسی فن بیان و احتمال موفق
    speech_success_probability_score = models.FloatField(
        default=0,
        verbose_name="برناسی فن بیان و احتمال موفق",
        help_text="حداکثر 3 امتیاز"
    )
    
    # 6. همراستایی پژوهشی با آزمایشگاه‌های گروه
    lab_alignment_score = models.FloatField(
        default=0,
        verbose_name="همراستایی پژوهشی با آزمایشگاه‌های علمی گروه",
        help_text="حداکثر 15 امتیاز"
    )
    
    # جمع امتیاز مصاحبه
    total_interview_score = models.FloatField(
        default=0,
        verbose_name="جمع امتیاز مصاحبه",
        help_text="حداکثر 30 امتیاز"
    )
    
    # نظرات و توضیحات
    interviewer_comment = models.TextField(
        blank=True,
        verbose_name="نظر مصاحبه‌کننده"
    )
    
    # مصاحبه‌کنندگان (هیئت داوران)
    interviewers = models.ManyToManyField(
        User,
        related_name='conducted_interviews',
        verbose_name="مصاحبه‌کنندگان",
        blank=True
    )
    
    # تاریخ انجام مصاحبه
    conducted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="تاریخ انجام مصاحبه"
    )
    
    # ثبت‌کننده امتیازها
    scored_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='scored_interviews',
        verbose_name="ثبت‌کننده امتیازها"
    )
    scored_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="تاریخ ثبت امتیازها"
    )
    
    class Meta:
        verbose_name = "مصاحبه"
        verbose_name_plural = "مصاحبه‌ها"
        ordering = ['-scheduled_date']
    
    def __str__(self):
        return f"مصاحبه {self.application.tracking_code} - {self.get_status_display()}"
    
    def calculate_total_score(self):
        """محاسبه جمع امتیاز مصاحبه"""
        self.total_interview_score = (
            self.experience_analysis_score +
            self.creativity_score +
            self.personality_expression_score +
            self.documentation_score +
            self.speech_success_probability_score +
            self.lab_alignment_score
        )
        return self.total_interview_score
