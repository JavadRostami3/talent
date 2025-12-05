from django.contrib import admin
from .models import University, Faculty, Department, UniversityWeight


@admin.register(University)
class UniversityAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'code']
    list_editable = ['is_active']


@admin.register(Faculty)
class FacultyAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'code']
    list_editable = ['is_active']


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'faculty', 'code', 'is_active', 'created_at']
    list_filter = ['is_active', 'faculty']
    search_fields = ['name', 'code', 'faculty__name']
    list_editable = ['is_active']
    raw_id_fields = ['faculty']


@admin.register(UniversityWeight)
class UniversityWeightAdmin(admin.ModelAdmin):
    list_display = ['university', 'round', 'weight', 'created_at']
    list_filter = ['round']
    search_fields = ['university__name', 'round__title']
    raw_id_fields = ['university', 'round']
