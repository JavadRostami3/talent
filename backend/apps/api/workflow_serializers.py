"""
Serializers for workflow app
"""
from rest_framework import serializers
from apps.workflow.models import FormReview, ApplicationWorkflowLog
from django.utils import timezone


class FormReviewSerializer(serializers.ModelSerializer):
    """Serializer for FormReview model - نمایش کامل"""
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    reviewer_name = serializers.CharField(source='reviewer.get_full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = FormReview
        fields = [
            'id', 'application', 'document_type', 'document_type_display',
            'status', 'status_display', 'comment', 'defects',
            'reviewer', 'reviewer_name', 'reviewed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'reviewed_at', 'created_at', 'updated_at']


class FormReviewCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer برای ایجاد/ویرایش بررسی مدارک توسط ادمین"""
    
    class Meta:
        model = FormReview
        fields = [
            'application', 'document_type', 'status', 'comment', 'defects'
        ]
    
    def validate(self, data):
        """اعتبارسنجی: اگر وضعیت APPROVED_WITH_DEFECT است، defects باید پر شود"""
        if data.get('status') == 'APPROVED_WITH_DEFECT' and not data.get('defects'):
            raise serializers.ValidationError({
                'defects': 'برای وضعیت "تایید شده با نقص" باید موارد نقص مشخص شود'
            })
        return data
    
    def create(self, validated_data):
        """ایجاد بررسی جدید"""
        # attach reviewer and reviewed_at
        validated_data['reviewer'] = self.context['request'].user
        validated_data['reviewed_at'] = timezone.now()
        # allow passing application via context from the view
        if 'application' in self.context and not validated_data.get('application'):
            validated_data['application'] = self.context['application']
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """به‌روزرسانی بررسی"""
        validated_data['reviewer'] = self.context['request'].user
        validated_data['reviewed_at'] = timezone.now()
        return super().update(instance, validated_data)


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
