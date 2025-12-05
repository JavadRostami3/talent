"""
Serializers for applications app
"""
from rest_framework import serializers
from apps.applications.models import (
    Application, ApplicationChoice, ApplicationEducationRecord,
    ScientificRecord, RegistrationPayment
)
from apps.api.admissions_serializers import ProgramListSerializer
from apps.api.core_serializers import UniversitySerializer


class ApplicationEducationRecordSerializer(serializers.ModelSerializer):
    """Serializer for ApplicationEducationRecord model"""
    university = UniversitySerializer(read_only=True)
    university_id = serializers.IntegerField(write_only=True)
    degree_level_display = serializers.CharField(source='get_degree_level_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = ApplicationEducationRecord
        fields = [
            'id', 'application', 'degree_level', 'degree_level_display',
            'university', 'university_id', 'field_of_study', 'status', 'status_display',
            'total_units_passed', 'semester_count', 'gpa', 'class_size',
            'rank_status', 'start_date', 'end_date'
        ]
        read_only_fields = ['id']


class ScientificRecordSerializer(serializers.ModelSerializer):
    """Serializer for ScientificRecord model"""
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    
    class Meta:
        model = ScientificRecord
        fields = [
            'id', 'application', 'type', 'type_display', 'title',
            'journal_or_event', 'year', 'score', 'file'
        ]
        read_only_fields = ['id', 'score']


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
    scientific_records = ScientificRecordSerializer(many=True, read_only=True)
    
    class Meta:
        model = Application
        fields = [
            'id', 'applicant', 'applicant_name', 'applicant_national_id',
            'round', 'round_title', 'round_type', 'tracking_code',
            'status', 'status_display', 'university_of_study',
            'university_weight', 'rank_percentile_group', 'total_score',
            'score_calculated_at', 'final_review_status',
            'final_reviewed_by', 'final_reviewed_at',
            'admission_overall_status', 'admission_result_published_at',
            'created_at', 'updated_at',
            'choices', 'education_records', 'scientific_records'
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
