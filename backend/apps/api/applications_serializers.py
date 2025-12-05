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


class ApplicationSerializer(serializers.ModelSerializer):
    """Full serializer for Application model"""
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
