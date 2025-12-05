"""
Serializers for core app
"""
from rest_framework import serializers
from apps.core.models import University, Faculty, Department, UniversityWeight


class UniversitySerializer(serializers.ModelSerializer):
    """Serializer for University model"""
    
    class Meta:
        model = University
        fields = ['id', 'name', 'code', 'is_active']


class FacultySerializer(serializers.ModelSerializer):
    """Serializer for Faculty model"""
    
    class Meta:
        model = Faculty
        fields = ['id', 'name', 'code', 'is_active']


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for Department model"""
    faculty = FacultySerializer(read_only=True)
    faculty_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'faculty', 'faculty_id', 'is_active']


class UniversityWeightSerializer(serializers.ModelSerializer):
    """Serializer for UniversityWeight model"""
    university = UniversitySerializer(read_only=True)
    
    class Meta:
        model = UniversityWeight
        fields = ['id', 'university', 'round', 'weight']
