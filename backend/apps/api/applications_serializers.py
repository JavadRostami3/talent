"""
Serializers for applications app
"""
from rest_framework import serializers
from apps.applications.models import (
    Application, ApplicationChoice, ApplicationEducationRecord,
    RegistrationPayment
)
from apps.api.admissions_serializers import ProgramListSerializer
from apps.api.core_serializers import UniversitySerializer


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


class ApplicationListSerializer(serializers.ModelSerializer):
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
        
        if first_choice:
            return {
                'faculty_id': first_choice.program.faculty.id,
                'faculty_name': first_choice.program.faculty.name,
                'department_id': first_choice.program.department.id,
                'department_name': first_choice.program.department.name,
            }
        return None
    
    def get_selected_program(self, obj):
        """رشته انتخابی با اولویت اول"""
        first_choice = obj.choices.select_related('program').order_by('priority').first()
        
        if first_choice:
            return {
                'program_id': first_choice.program.id,
                'program_name': first_choice.program.name,
                'program_code': first_choice.program.code,
                'orientation': first_choice.program.orientation,
                'priority': first_choice.priority,
            }
        return None
    
    def get_university_info(self, obj):
        """دانشگاه محل تحصیل + ضریب"""
        if obj.university_of_study:
            weight = obj.university_weight.weight if obj.university_weight else 1.0
            return {
                'university_id': obj.university_of_study.id,
                'university_name': obj.university_of_study.name,
                'university_code': obj.university_of_study.code,
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
    
    class Meta:
        model = Application
        fields = [
            'id', 'applicant', 'applicant_name', 'applicant_national_id',
            'round', 'round_title', 'round_type', 'tracking_code',
            'status', 'status_display', 'university_of_study',
            'university_weight', 'rank_percentile_group', 'total_score',
            'score_calculated_at',
            'university_review_status', 'university_reviewed_by', 'university_reviewed_at',
            'faculty_review_completed', 'faculty_reviewed_by', 'faculty_reviewed_at',
            'admission_overall_status', 'admission_result_published_at',
            'created_at', 'updated_at',
            'choices', 'education_records'
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
        }


class ApplicationListSerializer(serializers.ModelSerializer):
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
