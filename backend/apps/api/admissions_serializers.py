"""
Serializers for admissions app
"""
from rest_framework import serializers
from apps.admissions.models import AdmissionRound, Program
from apps.api.core_serializers import FacultySerializer, DepartmentSerializer


class AdmissionRoundSerializer(serializers.ModelSerializer):
    """Serializer for AdmissionRound model"""
    
    class Meta:
        model = AdmissionRound
        fields = [
            'id', 'title', 'year', 'type', 'description',
            'registration_start', 'registration_end',
            'documents_deadline', 'result_publish_date',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ProgramSerializer(serializers.ModelSerializer):
    """Serializer for Program model"""
    faculty = FacultySerializer(read_only=True)
    department = DepartmentSerializer(read_only=True)
    degree_level_display = serializers.CharField(source='get_degree_level_display', read_only=True)
    
    class Meta:
        model = Program
        fields = [
            'id', 'round', 'degree_level', 'degree_level_display',
            'faculty', 'department', 'code', 'name', 'orientation',
            'bachelor_related_field', 'capacity', 'is_active'
        ]
        read_only_fields = ['id']


class ProgramListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for program listings"""
    faculty_name = serializers.CharField(source='faculty.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    class Meta:
        model = Program
        fields = [
            'id', 'code', 'name', 'orientation',
            'degree_level', 'faculty_name', 'department_name', 'capacity'
        ]
