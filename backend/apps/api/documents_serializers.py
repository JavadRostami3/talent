"""
Serializers for documents app
"""
from rest_framework import serializers
from apps.documents.models import ApplicationDocument


class ApplicationDocumentSerializer(serializers.ModelSerializer):
    """Serializer for ApplicationDocument model"""
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = ApplicationDocument
        fields = [
            'id', 'application', 'type', 'type_display', 'file',
            'status', 'status_display', 'review_comment',
            'uploaded_at', 'reviewed_at', 'reviewed_by', 'reviewed_by_name'
        ]
        read_only_fields = [
            'id', 'uploaded_at', 'reviewed_at', 'reviewed_by',
            'status', 'review_comment'
        ]


class DocumentReviewSerializer(serializers.Serializer):
    """Serializer for document review"""
    status = serializers.ChoiceField(choices=ApplicationDocument.Status.choices)
    review_comment = serializers.CharField(required=False, allow_blank=True)
