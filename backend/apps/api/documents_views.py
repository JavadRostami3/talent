"""
Applicant document upload/delete endpoints.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from apps.applications.models import Application
from apps.documents.models import ApplicationDocument
from .documents_serializers import ApplicationDocumentSerializer


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def applicant_documents(request, application_id):
    application = get_object_or_404(
        Application,
        id=application_id,
        applicant__user=request.user
    )

    if request.method == 'GET':
        documents = ApplicationDocument.objects.filter(
            application=application
        ).order_by('-uploaded_at')
        serializer = ApplicationDocumentSerializer(documents, many=True)
        return Response(serializer.data)

    data = request.data.copy()
    data['application'] = application.id
    serializer = ApplicationDocumentSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def applicant_document_delete(request, application_id, document_id):
    document = get_object_or_404(
        ApplicationDocument,
        id=document_id,
        application_id=application_id,
        application__applicant__user=request.user
    )
    document.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def document_delete(request, document_id):
    document = get_object_or_404(
        ApplicationDocument,
        id=document_id,
        application__applicant__user=request.user
    )
    document.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
