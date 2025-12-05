"""
Serializers for workflow app
"""
from rest_framework import serializers
from apps.workflow.models import FormReview, ApplicationWorkflowLog


class FormReviewSerializer(serializers.ModelSerializer):
    """Serializer for FormReview model"""
    form_number_display = serializers.CharField(source='get_form_number_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    reviewer_name = serializers.CharField(source='reviewer.get_full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = FormReview
        fields = [
            'id', 'application', 'form_number', 'form_number_display',
            'status', 'status_display', 'comment', 'defects',
            'reviewer', 'reviewer_name', 'reviewed_at'
        ]
        read_only_fields = ['id', 'reviewed_at']


class ApplicationWorkflowLogSerializer(serializers.ModelSerializer):
    """Serializer for ApplicationWorkflowLog model"""
    step_type_display = serializers.CharField(source='get_step_type_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = ApplicationWorkflowLog
        fields = [
            'id', 'application', 'step_type', 'step_type_display',
            'description', 'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
