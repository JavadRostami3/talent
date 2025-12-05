from django.contrib import admin
from .models import (
    Application, ApplicationChoice, ApplicationEducationRecord, 
    ScientificRecord, RegistrationPayment,
    # مدل‌های دکتری
    ResearchArticle, Patent, FestivalAward, ConferenceArticle, 
    Book, MastersThesis, Interview,
    # مدل‌های المپیاد و زبان
    OlympiadRecord, LanguageCertificate,
    # امتیازدهی سوابق تحصیلی
    EducationScoring
)


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = [
        'tracking_code',
        'get_applicant_name',
        'round',
        'status',
        'total_score',
        'rank_percentile_group',
        'admission_overall_status',
        'created_at'
    ]
    list_filter = [
        'status',
        'round__type',
        'round__year',
        'admission_overall_status',
        'final_review_status'
    ]
    search_fields = [
        'tracking_code',
        'applicant__user__national_id',
        'applicant__user__first_name',
        'applicant__user__last_name'
    ]
    readonly_fields = ['tracking_code', 'created_at', 'updated_at', 'score_calculated_at']
    raw_id_fields = ['applicant', 'round', 'university_of_study', 'university_weight', 'final_reviewed_by']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('applicant', 'round', 'tracking_code', 'status')
        }),
        ('دانشگاه و امتیاز', {
            'fields': ('university_of_study', 'university_weight', 'total_score', 'score_calculated_at', 'rank_percentile_group')
        }),
        ('بررسی نهایی', {
            'fields': ('final_review_status', 'final_reviewed_by', 'final_reviewed_at')
        }),
        ('وضعیت پذیرش', {
            'fields': ('admission_overall_status', 'admission_result_published_at')
        }),
        ('تاریخ‌ها', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_applicant_name(self, obj):
        return obj.applicant.user.get_full_name()
    get_applicant_name.short_description = 'نام داوطلب'


@admin.register(ApplicationChoice)
class ApplicationChoiceAdmin(admin.ModelAdmin):
    list_display = [
        'application',
        'priority',
        'program',
        'admission_status',
        'admission_priority_result'
    ]
    list_filter = ['admission_status', 'program__degree_level', 'program__faculty']
    search_fields = [
        'application__tracking_code',
        'program__name',
        'program__code'
    ]
    raw_id_fields = ['application', 'program']


@admin.register(ApplicationEducationRecord)
class ApplicationEducationRecordAdmin(admin.ModelAdmin):
    list_display = [
        'application',
        'degree_level',
        'field_of_study',
        'university',
        'gpa',
        'gpa_score',
        'university_score',
        'duration_score',
        'total_score',
        'status'
    ]
    list_filter = ['degree_level', 'status', 'university']
    search_fields = [
        'application__tracking_code',
        'field_of_study',
        'university__name'
    ]
    readonly_fields = ['created_at', 'updated_at', 'reviewed_at']
    raw_id_fields = ['application', 'university', 'reviewed_by']
    
    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('application', 'degree_level', 'status')
        }),
        ('اطلاعات تحصیلی', {
            'fields': ('university', 'field_of_study', 'gpa', 'start_month', 'start_year', 'graduation_month', 'graduation_year')
        }),
        ('اطلاعات تکمیلی (برای ارشد)', {
            'fields': ('total_units_passed', 'semester_count', 'class_size', 'rank_status'),
            'classes': ('collapse',)
        }),
        ('امتیازدهی', {
            'fields': ('gpa_score', 'university_score', 'duration_score', 'total_score'),
            'description': 'کارشناسی: معدل+دانشگاه (تا 6) + طول مدت (تا 3) | ارشد: معدل+دانشگاه (تا 5) + طول مدت (تا 3)'
        }),
        ('بررسی', {
            'fields': ('reviewed_by', 'reviewed_at', 'review_comment')
        }),
        ('تاریخ‌ها', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ScientificRecord)
class ScientificRecordAdmin(admin.ModelAdmin):
    list_display = [
        'application',
        'type',
        'title',
        'journal_or_event',
        'year',
        'score'
    ]
    list_filter = ['type', 'year']
    search_fields = [
        'application__tracking_code',
        'title',
        'journal_or_event'
    ]
    raw_id_fields = ['application']


# ============================================
# Admin برای مدل‌های دکتری
# ============================================

@admin.register(ResearchArticle)
class ResearchArticleAdmin(admin.ModelAdmin):
    list_display = [
        'get_tracking_code',
        'title_fa',
        'article_type',
        'journal_name',
        'status',
        'score',
        'reviewed_by'
    ]
    list_filter = ['article_type', 'status', 'reviewed_by', 'created_at']
    search_fields = [
        'application__tracking_code',
        'title_fa',
        'title_en',
        'journal_name',
        'authors'
    ]
    readonly_fields = ['created_at', 'updated_at', 'reviewed_at']
    raw_id_fields = ['application', 'reviewed_by']
    
    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('application', 'title_fa', 'title_en')
        }),
        ('اطلاعات نشریه', {
            'fields': ('journal_name', 'issn', 'article_type', 'status')
        }),
        ('جزئیات', {
            'fields': ('publish_date', 'link', 'authors', 'record_code')
        }),
        ('فایل', {
            'fields': ('file',)
        }),
        ('بررسی و امتیاز', {
            'fields': ('score', 'reviewed_by', 'reviewed_at')
        }),
        ('تاریخ‌ها', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_tracking_code(self, obj):
        return obj.application.tracking_code
    get_tracking_code.short_description = 'کد پیگیری'


@admin.register(Patent)
class PatentAdmin(admin.ModelAdmin):
    list_display = [
        'get_tracking_code',
        'title_fa',
        'patent_number',
        'registration_date',
        'score',
        'reviewed_by'
    ]
    list_filter = ['reviewed_by', 'created_at']
    search_fields = [
        'application__tracking_code',
        'title_fa',
        'title_en',
        'patent_number',
        'inventors'
    ]
    readonly_fields = ['created_at', 'updated_at', 'reviewed_at']
    raw_id_fields = ['application', 'reviewed_by']
    
    def get_tracking_code(self, obj):
        return obj.application.tracking_code
    get_tracking_code.short_description = 'کد پیگیری'


@admin.register(FestivalAward)
class FestivalAwardAdmin(admin.ModelAdmin):
    list_display = [
        'get_tracking_code',
        'festival_name',
        'award_title',
        'year',
        'score',
        'reviewed_by'
    ]
    list_filter = ['year', 'reviewed_by']
    search_fields = [
        'application__tracking_code',
        'festival_name',
        'award_title'
    ]
    readonly_fields = ['created_at', 'updated_at', 'reviewed_at']
    raw_id_fields = ['application', 'reviewed_by']
    
    def get_tracking_code(self, obj):
        return obj.application.tracking_code
    get_tracking_code.short_description = 'کد پیگیری'


@admin.register(ConferenceArticle)
class ConferenceArticleAdmin(admin.ModelAdmin):
    list_display = [
        'get_tracking_code',
        'title_fa',
        'conference_name',
        'conference_type',
        'year',
        'score',
        'reviewed_by'
    ]
    list_filter = ['conference_type', 'year', 'reviewed_by']
    search_fields = [
        'application__tracking_code',
        'title_fa',
        'title_en',
        'conference_name',
        'authors'
    ]
    readonly_fields = ['created_at', 'updated_at', 'reviewed_at']
    raw_id_fields = ['application', 'reviewed_by']
    
    def get_tracking_code(self, obj):
        return obj.application.tracking_code
    get_tracking_code.short_description = 'کد پیگیری'


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = [
        'get_tracking_code',
        'title_fa',
        'book_type',
        'publisher',
        'publish_year',
        'score',
        'reviewed_by'
    ]
    list_filter = ['book_type', 'publish_year', 'reviewed_by']
    search_fields = [
        'application__tracking_code',
        'title_fa',
        'title_en',
        'publisher',
        'isbn'
    ]
    readonly_fields = ['created_at', 'updated_at', 'reviewed_at']
    raw_id_fields = ['application', 'reviewed_by']
    
    def get_tracking_code(self, obj):
        return obj.application.tracking_code
    get_tracking_code.short_description = 'کد پیگیری'


@admin.register(MastersThesis)
class MastersThesisAdmin(admin.ModelAdmin):
    list_display = [
        'get_tracking_code',
        'title_fa',
        'grade',
        'defense_date',
        'score',
        'reviewed_by'
    ]
    list_filter = ['reviewed_by', 'created_at']
    search_fields = [
        'application__tracking_code',
        'title_fa',
        'title_en',
        'main_supervisor',
        'second_supervisor'
    ]
    readonly_fields = ['created_at', 'updated_at', 'reviewed_at']
    raw_id_fields = ['application', 'reviewed_by']
    
    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('application', 'title_fa', 'title_en')
        }),
        ('جزئیات پایان‌نامه', {
            'fields': ('grade', 'defense_date', 'defense_minutes_file')
        }),
        ('اساتید راهنما', {
            'fields': ('main_supervisor', 'second_supervisor')
        }),
        ('اساتید مشاور', {
            'fields': ('advisor_1', 'advisor_2')
        }),
        ('بررسی و امتیاز', {
            'fields': ('score', 'reviewed_by', 'reviewed_at')
        }),
        ('تاریخ‌ها', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_tracking_code(self, obj):
        return obj.application.tracking_code
    get_tracking_code.short_description = 'کد پیگیری'


@admin.register(RegistrationPayment)
class RegistrationPaymentAdmin(admin.ModelAdmin):
    list_display = [
        'get_tracking_code',
        'amount',
        'status',
        'transaction_id',
        'paid_at',
        'verified_at',
        'verified_by'
    ]
    list_filter = ['status', 'paid_at', 'verified_at']
    search_fields = [
        'application__tracking_code',
        'transaction_id',
        'electronic_receipt'
    ]
    readonly_fields = ['created_at', 'updated_at', 'paid_at']
    raw_id_fields = ['application', 'verified_by']
    date_hierarchy = 'paid_at'
    
    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('application', 'amount', 'status')
        }),
        ('اطلاعات پرداخت', {
            'fields': ('transaction_id', 'electronic_receipt', 'paid_at')
        }),
        ('تایید', {
            'fields': ('verified_by', 'verified_at', 'confirmation_file')
        }),
        ('تاریخ‌ها', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_tracking_code(self, obj):
        return obj.application.tracking_code
    get_tracking_code.short_description = 'کد پیگیری'

@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = [
        'get_tracking_code',
        'status',
        'scheduled_date',
        'total_interview_score',
        'conducted_at'
    ]
    list_filter = ['status', 'scheduled_date', 'conducted_at']
    search_fields = [
        'application__tracking_code',
        'application__applicant__user__first_name',
        'application__applicant__user__last_name',
        'location'
    ]
    readonly_fields = ['created_at', 'updated_at', 'total_interview_score']
    raw_id_fields = ['application', 'scored_by']
    filter_horizontal = ['interviewers']
    date_hierarchy = 'scheduled_date'
    
    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('application', 'status')
        }),
        ('زمان‌بندی', {
            'fields': ('scheduled_date', 'location', 'conducted_at')
        }),
        ('امتیازدهی مصاحبه', {
            'fields': (
                'experience_analysis_score',
                'creativity_score',
                'personality_expression_score',
                'documentation_score',
                'speech_success_probability_score',
                'lab_alignment_score',
                'total_interview_score',
            ),
            'description': 'جمع امتیازها حداکثر 30 است'
        }),
        ('نظرات', {
            'fields': ('interviewer_comment',)
        }),
        ('مصاحبه‌کنندگان', {
            'fields': ('interviewers', 'scored_by', 'scored_at')
        }),
        ('تاریخ‌ها', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_tracking_code(self, obj):
        return obj.application.tracking_code
    get_tracking_code.short_description = 'کد پیگیری'
    
    def save_model(self, request, obj, form, change):
        """محاسبه خودکار جمع امتیاز مصاحبه"""
        obj.calculate_total_score()
        super().save_model(request, obj, form, change)


@admin.register(OlympiadRecord)
class OlympiadRecordAdmin(admin.ModelAdmin):
    list_display = [
        'get_tracking_code',
        'olympiad_type',
        'olympiad_name',
        'year',
        'rank_level',
        'rank_number',
        'score',
        'reviewed_by'
    ]
    list_filter = ['olympiad_type', 'rank_level', 'year']
    search_fields = [
        'application__tracking_code',
        'olympiad_name',
        'application__applicant__user__national_id'
    ]
    readonly_fields = ['created_at', 'updated_at', 'reviewed_at']
    raw_id_fields = ['application', 'reviewed_by']
    
    fieldsets = (
        ('اطلاعات المپیاد', {
            'fields': ('application', 'olympiad_type', 'olympiad_name', 'year')
        }),
        ('رتبه', {
            'fields': ('rank_level', 'rank_number')
        }),
        ('مدرک', {
            'fields': ('certificate_file',)
        }),
        ('امتیازدهی', {
            'fields': ('score',),
            'description': 'حداکثر 5 امتیاز'
        }),
        ('بررسی', {
            'fields': ('reviewed_by', 'reviewed_at', 'review_comment')
        }),
        ('تاریخ‌ها', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_tracking_code(self, obj):
        return obj.application.tracking_code
    get_tracking_code.short_description = 'کد پیگیری'


@admin.register(LanguageCertificate)
class LanguageCertificateAdmin(admin.ModelAdmin):
    list_display = [
        'get_tracking_code',
        'language',
        'certificate_type',
        'test_score',
        'issue_date',
        'score',
        'reviewed_by'
    ]
    list_filter = ['language', 'certificate_type']
    search_fields = [
        'application__tracking_code',
        'certificate_number',
        'application__applicant__user__national_id'
    ]
    readonly_fields = ['created_at', 'updated_at', 'reviewed_at']
    raw_id_fields = ['application', 'reviewed_by']
    
    fieldsets = (
        ('اطلاعات مدرک', {
            'fields': ('application', 'language', 'certificate_type', 'certificate_number')
        }),
        ('نمره و تاریخ', {
            'fields': ('test_score', 'issue_date', 'expiry_date')
        }),
        ('فایل مدرک', {
            'fields': ('certificate_file',)
        }),
        ('امتیازدهی', {
            'fields': ('score',),
            'description': 'حداکثر 8 امتیاز بر اساس نمره آزمون'
        }),
        ('بررسی', {
            'fields': ('reviewed_by', 'reviewed_at', 'review_comment')
        }),
        ('تاریخ‌ها', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_tracking_code(self, obj):
        return obj.application.tracking_code
    get_tracking_code.short_description = 'کد پیگیری'
from django.contrib import admin
from django.utils import timezone


@admin.register(EducationScoring)
class EducationScoringAdmin(admin.ModelAdmin):
    """
    امتیازدهی دستی سوابق تحصیلی توسط کارشناس
    6 فیلد امتیاز که به صورت دستی پر می‌شود
    """
    list_display = [
        'get_tracking_code',
        'bsc_gpa_university_score',
        'msc_gpa_university_score',
        'bsc_duration_score',
        'msc_duration_score',
        'olympiad_score',
        'language_certificate_score',
        'total_score',
        'scored_by',
        'scored_at'
    ]
    search_fields = [
        'application__tracking_code',
        'application__applicant__user__national_id',
        'application__applicant__user__first_name',
        'application__applicant__user__last_name'
    ]
    readonly_fields = ['total_score', 'created_at', 'updated_at', 'scored_at']
    raw_id_fields = ['application', 'scored_by']
    
    fieldsets = (
        ('درخواست', {
            'fields': ('application',)
        }),
        ('امتیازدهی سوابق تحصیلی (دستی)', {
            'fields': (
                'bsc_gpa_university_score',
                'msc_gpa_university_score',
                'bsc_duration_score',
                'msc_duration_score',
                'olympiad_score',
                'language_certificate_score',
            ),
            'description': '''
            <strong>نحوه امتیازدهی:</strong><br>
            ۱. معدل و کیفیت دانشگاه کارشناسی: تا ۶ امتیاز<br>
            ۲. معدل و کیفیت دانشگاه ارشد: تا ۵ امتیاز<br>
            ۳. طول مدت دوره کارشناسی: تا ۳ امتیاز<br>
            ۴. طول مدت دوره ارشد: تا ۳ امتیاز<br>
            ۵. برگزیدگان المپیادهای علمی: تا ۵ امتیاز<br>
            ۶. مدرک زبان معتبر: تا ۸ امتیاز<br>
            <br>
            <strong>جمع کل: حداکثر ۳۰ امتیاز</strong>
            '''
        }),
        ('جمع امتیازات', {
            'fields': ('total_score',),
            'description': 'این فیلد به صورت خودکار محاسبه می‌شود'
        }),
        ('اطلاعات ثبت', {
            'fields': ('scored_by', 'scored_at', 'comment')
        }),
        ('تاریخ‌ها', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_tracking_code(self, obj):
        return obj.application.tracking_code
    get_tracking_code.short_description = 'کد پیگیری'
    
    def save_model(self, request, obj, form, change):
        """ثبت خودکار کارشناس و زمان"""
        if not change or not obj.scored_by:
            obj.scored_by = request.user
            obj.scored_at = timezone.now()
        super().save_model(request, obj, form, change)
