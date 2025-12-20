"""
Serializers for applications app
"""
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers
from apps.applications.models import (
    Application,
    ApplicationChoice,
    ApplicationEducationRecord,
    EducationScoring,
    RegistrationPayment,
    ResearchArticle,
    Patent,
    FestivalAward,
    ConferenceArticle,
    Book,
    MastersThesis,
    OlympiadRecord,
    LanguageCertificate,
    Interview,
)
from apps.api.admissions_serializers import ProgramListSerializer
from apps.api.core_serializers import UniversitySerializer
from apps.documents.models import ApplicationDocument


class BaseEducationRecordSerializer(serializers.ModelSerializer):
    """Base Serializer برای سوابق تحصیلی"""
    university = UniversitySerializer(read_only=True)
    university_id = serializers.IntegerField(write_only=True)
    degree_level_display = serializers.CharField(source='get_degree_level_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = ApplicationEducationRecord
        fields = [
            'id', 'application', 'degree_level', 'degree_level_display',
            'university', 'university_id', 'field_of_study', 
            'status', 'status_display', 'gpa',
            'start_month', 'start_year', 'graduation_month', 'graduation_year',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MAEducationRecordSerializer(BaseEducationRecordSerializer):
    """
    Serializer برای سوابق تحصیلی ارشد
    فقط فیلدهای ضروری برای ارشد را نشان می‌دهد
    """
    class Meta(BaseEducationRecordSerializer.Meta):
        fields = BaseEducationRecordSerializer.Meta.fields + [
            'total_units_passed',  # تا پایان ترم 6
            'semester_count',
            'class_size',
            'rank_status',
        ]


class PhDEducationRecordSerializer(BaseEducationRecordSerializer):
    """
    Serializer برای سوابق تحصیلی دکتری
    شامل فیلدهای کارشناسی و ارشد
    """
    class Meta(BaseEducationRecordSerializer.Meta):
        # دکتری همان فیلدهای پایه را دارد
        # امتیازدهی در EducationScoring انجام می‌شود
        pass


class ApplicationEducationRecordSerializer(serializers.ModelSerializer):
    """
    Serializer پویا که بر اساس نوع فراخوان، فیلدهای مناسب را نشان می‌دهد
    """
    university = UniversitySerializer(read_only=True)
    university_id = serializers.IntegerField(write_only=True, required=False)
    degree_level_display = serializers.CharField(source='get_degree_level_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = ApplicationEducationRecord
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def to_representation(self, instance):
        """نمایش داده‌ها بر اساس نوع فراخوان"""
        # چک کردن نوع فراخوان
        if instance.application.round.type == 'MA_TALENT':
            serializer = MAEducationRecordSerializer(instance, context=self.context)
        else:  # PHD_TALENT or PHD_EXAM
            serializer = PhDEducationRecordSerializer(instance, context=self.context)
        
        return serializer.data


class ResearchArticleSerializer(serializers.ModelSerializer):
    """Serializer برای مقالات پژوهشی"""
    article_type_display = serializers.CharField(source='get_article_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = ResearchArticle
        fields = ['id', 'title_fa', 'title_en', 'journal_name', 'issn', 
                  'article_type', 'article_type_display', 'status', 'status_display',
                  'publish_date', 'authors', 'link', 'record_code', 'score']


class PatentSerializer(serializers.ModelSerializer):
    """Serializer برای ثبت اختراعات"""
    class Meta:
        model = Patent
        fields = ['id', 'title_fa', 'title_en', 'patent_number', 
                  'registration_date', 'inventors', 'score']


class FestivalAwardSerializer(serializers.ModelSerializer):
    """Serializer برای جوایز جشنواره"""
    class Meta:
        model = FestivalAward
        fields = ['id', 'festival_name', 'award_title', 'year', 
                  'description', 'score']


class ConferenceArticleSerializer(serializers.ModelSerializer):
    """Serializer برای مقالات کنفرانس"""
    conference_type_display = serializers.CharField(source='get_conference_type_display', read_only=True)
    
    class Meta:
        model = ConferenceArticle
        fields = ['id', 'title_fa', 'title_en', 'conference_name', 
                  'conference_type', 'conference_type_display', 'year', 
                  'authors', 'score']


class BookSerializer(serializers.ModelSerializer):
    """Serializer برای کتاب‌ها"""
    book_type_display = serializers.CharField(source='get_book_type_display', read_only=True)
    
    class Meta:
        model = Book
        fields = ['id', 'title_fa', 'title_en', 'book_type', 'book_type_display',
                  'publisher', 'isbn', 'publish_year', 'authors_or_translators', 'score']


class MastersThesisSerializer(serializers.ModelSerializer):
    """Serializer برای پایان‌نامه ارشد"""
    class Meta:
        model = MastersThesis
        fields = ['id', 'title_fa', 'title_en', 'grade', 'defense_date',
                  'main_supervisor', 'second_supervisor', 'advisor_1', 'advisor_2', 'score']


class OlympiadRecordSerializer(serializers.ModelSerializer):
    """Serializer برای سوابق المپیاد"""
    olympiad_type_display = serializers.CharField(source='get_olympiad_type_display', read_only=True)
    rank_level_display = serializers.CharField(source='get_rank_level_display', read_only=True)
    
    class Meta:
        model = OlympiadRecord
        fields = ['id', 'olympiad_type', 'olympiad_type_display', 'olympiad_name',
                  'year', 'rank_level', 'rank_level_display', 'rank_number']


class LanguageCertificateSerializer(serializers.ModelSerializer):
    """Serializer برای مدارک زبان"""
    language_display = serializers.CharField(source='get_language_display', read_only=True)
    certificate_type_display = serializers.CharField(source='get_certificate_type_display', read_only=True)
    
    class Meta:
        model = LanguageCertificate
        fields = ['id', 'language', 'language_display', 'certificate_type', 
                  'certificate_type_display', 'certificate_number', 'issue_date', 
                  'expiry_date', 'test_score']


class InterviewSerializer(serializers.ModelSerializer):
    """Serializer برای مصاحبه"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Interview
        fields = ['id', 'scheduled_date', 'location', 'status', 'status_display',
                  'experience_analysis_score', 'creativity_score', 
                  'personality_expression_score', 'documentation_score',
                  'speech_success_probability_score', 'lab_alignment_score',
                  'total_interview_score', 'interviewer_comment', 'conducted_at']


class ApplicationChoiceSerializer(serializers.ModelSerializer):
    """Serializer for ApplicationChoice model"""
    program = ProgramListSerializer(read_only=True)
    program_id = serializers.IntegerField(write_only=True)
    admission_status_display = serializers.CharField(source='get_admission_status_display', read_only=True)
    
    class Meta:
        model = ApplicationChoice
        fields = [
            'id', 'application', 'program', 'program_id', 'priority',
            'admission_status', 'admission_status_display',
            'admission_priority_result', 'admission_note'
        ]
        read_only_fields = ['id', 'admission_status', 'admission_priority_result', 'admission_note']


class AdminApplicationListSerializer(serializers.ModelSerializer):
    """
    Serializer برای نمایش لیست applications با اطلاعات کامل برای جدول ادمین
    """
    # اطلاعات داوطلب
    applicant = serializers.SerializerMethodField()
    
    # دانشکده/گروه آموزشی
    faculty_department = serializers.SerializerMethodField()
    
    # رشته انتخابی (اولویت اول)
    selected_program = serializers.SerializerMethodField()
    
    # دانشگاه محل تحصیل + ضریب
    university_info = serializers.SerializerMethodField()
    
    # وضعیت رتبه
    rank_status = serializers.SerializerMethodField()
    
    # نوع فراخوان
    round = serializers.SerializerMethodField()
    
    # وضعیت‌های مختلف
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    university_review_status_display = serializers.CharField(
        source='get_university_review_status_display',
        read_only=True
    )
    
    class Meta:
        model = Application
        fields = [
            'id',
            'tracking_code',
            'applicant',
            'round',
            'faculty_department',
            'selected_program',
            'university_info',
            'rank_status',
            'status',
            'status_display',
            'university_review_status',
            'university_review_status_display',
            'faculty_review_completed',
            'total_score',
            'created_at',
            'university_reviewed_at',
            'faculty_reviewed_at',
        ]
    
    def get_applicant(self, obj):
        """مشخصات داوطلب: نام کامل + کد ملی"""
        return {
            'full_name': obj.applicant.user.get_full_name(),
            'national_id': obj.applicant.user.national_id,
            'first_name': obj.applicant.user.first_name,
            'last_name': obj.applicant.user.last_name,
        }
    
    def get_faculty_department(self, obj):
        """دانشکده/گروه آموزشی از اولین انتخاب"""
        first_choice = obj.choices.select_related(
            'program__faculty',
            'program__department'
        ).order_by('priority').first()
        
        if not first_choice:
            return None

        try:
            program = first_choice.program
            faculty = program.faculty
            department = program.department
        except ObjectDoesNotExist:
            return None

        if not program or not faculty or not department:
            return None

        return {
            'faculty_id': faculty.id,
            'faculty_name': faculty.name,
            'department_id': department.id,
            'department_name': department.name,
        }
        return None
    
    def get_selected_program(self, obj):
        """رشته انتخابی با اولویت اول"""
        first_choice = obj.choices.select_related('program').order_by('priority').first()
        
        if not first_choice:
            return None

        try:
            program = first_choice.program
        except ObjectDoesNotExist:
            return None

        if not program:
            return None

        return {
            'program_id': program.id,
            'program_name': program.name,
            'program_code': program.code,
            'orientation': program.orientation,
            'priority': first_choice.priority,
        }
        return None
    
    def get_university_info(self, obj):
        """دانشگاه محل تحصیل + ضریب"""
        if not obj.university_of_study_id:
            return None

        try:
            university = obj.university_of_study
        except ObjectDoesNotExist:
            return None

        if not university:
            return None

        weight = 1.0
        if obj.university_weight_id:
            try:
                weight = obj.university_weight.weight
            except ObjectDoesNotExist:
                weight = 1.0

        return {
            'university_id': university.id,
            'university_name': university.name,
            'university_code': university.code,
            'weight': weight,
        }
        return None
    
    def get_rank_status(self, obj):
        """وضعیت رتبه: ۲۰٪ یا ۱۰٪"""
        if obj.rank_percentile_group:
            return {
                'group': obj.rank_percentile_group,
                'label': '20% برتر' if obj.rank_percentile_group == 'TOP_20' else '10% بعدی' if obj.rank_percentile_group == 'NEXT_10' else obj.rank_percentile_group
            }
        return None
    
    def get_round(self, obj):
        """اطلاعات فراخوان"""
        return {
            'id': obj.round.id,
            'title': obj.round.title,
            'round_type': obj.round.type,
            'year': obj.round.year,
        }

class ApplicationDocumentSimpleSerializer(serializers.ModelSerializer):
    """نمایش خلاصه مدرک با لینک فایل"""
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ApplicationDocument
        fields = [
            'id',
            'type',
            'type_display',
            'status',
            'status_display',
            'file_url',
            'uploaded_at',
            'reviewed_at',
        ]

    def get_file_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url


class ApplicationDetailSerializer(serializers.ModelSerializer):
    """
    Serializer برای نمایش جزئیات کامل application برای صفحه جزئیات
    """
    applicant = serializers.SerializerMethodField()
    applicant_name = serializers.CharField(source='applicant.user.get_full_name', read_only=True)
    applicant_national_id = serializers.CharField(source='applicant.user.national_id', read_only=True)
    round_title = serializers.CharField(source='round.title', read_only=True)
    round_type = serializers.CharField(source='round.type', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    choices = ApplicationChoiceSerializer(many=True, read_only=True)
    education_records = ApplicationEducationRecordSerializer(many=True, read_only=True)
    
    # سوابق تحقیقاتی (برای دکتری)
    research_articles = ResearchArticleSerializer(many=True, read_only=True)
    patents = PatentSerializer(many=True, read_only=True)
    festival_awards = FestivalAwardSerializer(many=True, read_only=True)
    conference_articles = ConferenceArticleSerializer(many=True, read_only=True)
    books = BookSerializer(many=True, read_only=True)
    masters_thesis = MastersThesisSerializer(read_only=True)
    
    # سوابق المپیاد و زبان
    olympiad_records = OlympiadRecordSerializer(many=True, read_only=True)
    language_certificates = LanguageCertificateSerializer(many=True, read_only=True)
    
    # مصاحبه
    interview = InterviewSerializer(read_only=True)
    
    class Meta:
        model = Application
        fields = [
            'id', 'applicant', 'applicant_name', 'applicant_national_id',
            'round', 'round_title', 'round_type', 'tracking_code',
            'status', 'status_display', 'university_of_study',
            'university_weight', 'rank_percentile_group', 'total_score',
            'score_calculated_at',
            'university_review_status', 'university_review_comment',
            'university_reviewed_by', 'university_reviewed_at',
            'faculty_review_completed', 'faculty_review_comment',
            'faculty_reviewed_by', 'faculty_reviewed_at',
            'admission_overall_status', 'admission_result_published_at',
            'created_at', 'updated_at',
            'choices', 'education_records',
            # سوابق تحقیقاتی
            'research_articles', 'patents', 'festival_awards', 'conference_articles',
            'books', 'masters_thesis',
            # سوابق المپیاد و زبان
            'olympiad_records', 'language_certificates',
            # مصاحبه
            'interview'
        ]
        read_only_fields = [
            'id', 'tracking_code', 'total_score', 'score_calculated_at',
            'created_at', 'updated_at'
        ]
    
    def get_applicant(self, obj):
        """اطلاعات کامل داوطلب"""
        return {
            'full_name': obj.applicant.user.get_full_name(),
            'national_id': obj.applicant.user.national_id,
            'first_name': obj.applicant.user.first_name,
            'last_name': obj.applicant.user.last_name,
            'user': {
                'id': obj.applicant.user.id,
                'national_id': obj.applicant.user.national_id,
                'first_name': obj.applicant.user.first_name,
                'last_name': obj.applicant.user.last_name,
                'father_name': obj.applicant.user.father_name,
                'email': obj.applicant.user.email,
                'mobile': obj.applicant.user.mobile,
                'gender': obj.applicant.user.gender,
                'birth_year': obj.applicant.user.birth_year,
                'birth_place': obj.applicant.user.birth_place,
            },
        }


class AdminApplicationDetailSerializer(ApplicationDetailSerializer):
    """جزئیات کامل برای پنل ادمین با مدارک و امتیازدهی"""
    documents = ApplicationDocumentSimpleSerializer(many=True, read_only=True)
    education_scoring = serializers.SerializerMethodField()

    class Meta(ApplicationDetailSerializer.Meta):
        fields = ApplicationDetailSerializer.Meta.fields + [
            'documents',
            'education_scoring',
        ]

    def get_education_scoring(self, obj):
        """خلاصه امتیازدهی تحصیلی در صورت وجود"""
        if hasattr(obj, 'education_scoring'):
            return {
                'total_score': obj.education_scoring.total_score,
                'bsc_gpa_university_score': obj.education_scoring.bsc_gpa_university_score,
                'msc_gpa_university_score': obj.education_scoring.msc_gpa_university_score,
            }
        return None


class ApplicantApplicationDetailSerializer(ApplicationDetailSerializer):
    """جزئیات پرونده برای داوطلب با مدارک"""
    documents = ApplicationDocumentSimpleSerializer(many=True, read_only=True)

    class Meta(ApplicationDetailSerializer.Meta):
        fields = ApplicationDetailSerializer.Meta.fields + [
            'documents',
        ]


class ProgramApplicantSerializer(serializers.Serializer):
    """رکورد داوطلبان واجد شرایط برای تخصیص نهایی"""
    application_id = serializers.IntegerField()
    tracking_code = serializers.CharField()
    applicant_name = serializers.CharField()
    national_id = serializers.CharField()
    priority = serializers.IntegerField()
    gpa = serializers.FloatField(required=False, allow_null=True)
    gpa_display = serializers.CharField()
    university_name = serializers.CharField(allow_blank=True)
    rank_status = serializers.CharField(allow_null=True)
    total_score = serializers.FloatField()
    education_score = serializers.FloatField(required=False, allow_null=True)
    admission_overall_status = serializers.CharField(allow_blank=True)
    status = serializers.CharField()


class ApplicantApplicationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for application listings"""
    applicant_name = serializers.CharField(source='applicant.user.get_full_name', read_only=True)
    applicant_national_id = serializers.CharField(source='applicant.user.national_id', read_only=True)
    round_title = serializers.CharField(source='round.title', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Application
        fields = [
            'id', 'tracking_code', 'applicant_name', 'applicant_national_id',
            'round_title', 'status', 'status_display', 'total_score',
            'rank_percentile_group', 'admission_overall_status', 'created_at'
        ]


class ApplicationCreateSerializer(serializers.Serializer):
    """Serializer for creating new application (registration)"""
    national_id = serializers.CharField(max_length=10)
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    mobile = serializers.CharField(max_length=15)
    email = serializers.EmailField()
    round_id = serializers.IntegerField()


class RegistrationPaymentSerializer(serializers.ModelSerializer):
    """Serializer for RegistrationPayment model"""
    application_tracking_code = serializers.CharField(
        source='application.tracking_code',
        read_only=True
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    verified_by_name = serializers.CharField(
        source='verified_by.get_full_name',
        read_only=True,
        allow_null=True
    )
    
    class Meta:
        model = RegistrationPayment
        fields = [
            'id', 'application', 'application_tracking_code',
            'amount', 'transaction_id', 'electronic_receipt',
            'status', 'status_display',
            'paid_at', 'verified_at', 'verified_by', 'verified_by_name',
            'confirmation_file', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'verified_at', 'verified_by'
        ]


class PaymentVerificationSerializer(serializers.Serializer):
    """Serializer for payment verification by admin"""
    status = serializers.ChoiceField(
        choices=[
            ('VERIFIED', 'تایید شده'),
            ('FAILED', 'ناموفق')
        ]
    )
