"""
Views for applicant applications management
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone

from apps.applications.models import Application, ApplicationChoice, ApplicationEducationRecord
from apps.accounts.models import ApplicantProfile
from .applications_serializers import (
    ApplicationListSerializer,
    ApplicationDetailSerializer,
    ApplicationChoiceSerializer,
    ApplicationEducationRecordSerializer
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_applications_list(request):
    """
    لیست درخواست‌های کاربر فعلی
    """
    try:
        # Get applicant profile
        applicant = ApplicantProfile.objects.get(user=request.user)
        
        # Get all applications for this applicant
        applications = Application.objects.filter(
            applicant=applicant
        ).select_related(
            'round',
            'university_of_study'
        ).prefetch_related(
            'choices',
            'education_records',
            'documents'
        ).order_by('-created_at')
        
        serializer = ApplicationListSerializer(applications, many=True)
        return Response(serializer.data)
        
    except ApplicantProfile.DoesNotExist:
        return Response(
            {'error': 'پروفایل متقاضی یافت نشد'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def application_detail(request, application_id):
    """
    جزئیات یک درخواست خاص
    """
    try:
        applicant = ApplicantProfile.objects.get(user=request.user)
        
        application = get_object_or_404(
            Application.objects.select_related(
                'round',
                'university_of_study'
            ).prefetch_related(
                'choices__program',
                'education_records',
                'documents',
                'research_records'
            ),
            id=application_id,
            applicant=applicant
        )
        
        serializer = ApplicationDetailSerializer(application)
        return Response(serializer.data)
        
    except ApplicantProfile.DoesNotExist:
        return Response(
            {'error': 'پروفایل متقاضی یافت نشد'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_application(request, application_id):
    """
    بروزرسانی اطلاعات درخواست
    """
    try:
        applicant = ApplicantProfile.objects.get(user=request.user)
        application = get_object_or_404(Application, id=application_id, applicant=applicant)
        
        # Check if application is editable
        if application.status not in ['NEW', 'PROGRAM_SELECTED', 'PERSONAL_INFO_COMPLETED', 
                                       'IDENTITY_DOCS_UPLOADED', 'EDU_INFO_COMPLETED', 
                                       'EDU_DOCS_UPLOADED', 'RETURNED_FOR_CORRECTION']:
            return Response(
                {'error': 'امکان ویرایش این درخواست وجود ندارد'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update status if provided
        new_status = request.data.get('status')
        if new_status:
            application.status = new_status
            application.save()
        
        serializer = ApplicationDetailSerializer(application)
        return Response(serializer.data)
        
    except ApplicantProfile.DoesNotExist:
        return Response(
            {'error': 'پروفایل متقاضی یافت نشد'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_application(request, application_id):
    """
    ارسال نهایی درخواست برای بررسی
    """
    try:
        applicant = ApplicantProfile.objects.get(user=request.user)
        application = get_object_or_404(Application, id=application_id, applicant=applicant)
        
        # Validation checks
        errors = []
        
        # Check program choices
        if not application.choices.exists():
            errors.append('حداقل یک رشته باید انتخاب شود')
        
        # Check personal info
        user = request.user
        if not all([user.first_name, user.last_name, user.father_name, user.gender]):
            errors.append('اطلاعات شخصی کامل نیست')
        
        # Check identity documents
        identity_docs = application.documents.filter(
            type__in=['PERSONAL_PHOTO', 'NATIONAL_CARD', 'ID_CARD']
        )
        if identity_docs.count() < 3:
            errors.append('مدارک شناسایی کامل نیست')
        
        # Check education records
        if not application.education_records.filter(degree_level='BSC').exists():
            errors.append('اطلاعات تحصیلی کارشناسی الزامی است')
        
        # For PhD, check MSC record
        if application.round.type == 'PHD_TALENT':
            if not application.education_records.filter(degree_level='MSC').exists():
                errors.append('اطلاعات تحصیلی کارشناسی ارشد الزامی است')
        
        # Check education documents
        edu_docs = application.documents.filter(type__in=['BSC_CERT', 'BSC_TRANSCRIPT'])
        if edu_docs.count() < 2:
            errors.append('مدارک تحصیلی کارشناسی کامل نیست')
        
        if errors:
            return Response(
                {'errors': errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update application status
        application.status = 'SUBMITTED'
        application.submitted_at = timezone.now()
        application.save()
        
        serializer = ApplicationDetailSerializer(application)
        return Response({
            'message': 'درخواست با موفقیت ارسال شد',
            'application': serializer.data
        })
        
    except ApplicantProfile.DoesNotExist:
        return Response(
            {'error': 'پروفایل متقاضی یافت نشد'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def manage_choices(request, application_id):
    """
    مدیریت انتخاب رشته‌ها
    """
    try:
        applicant = ApplicantProfile.objects.get(user=request.user)
        application = get_object_or_404(Application, id=application_id, applicant=applicant)
        
        if request.method == 'GET':
            choices = application.choices.all()
            serializer = ApplicationChoiceSerializer(choices, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            # Add new choice
            serializer = ApplicationChoiceSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(application=application)
                
                # Update application status
                if application.status == 'NEW':
                    application.status = 'PROGRAM_SELECTED'
                    application.save()
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            choice_id = request.data.get('choice_id')
            if choice_id:
                ApplicationChoice.objects.filter(
                    id=choice_id,
                    application=application
                ).delete()
                return Response({'message': 'انتخاب حذف شد'})
            return Response(
                {'error': 'choice_id الزامی است'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except ApplicantProfile.DoesNotExist:
        return Response(
            {'error': 'پروفایل متقاضی یافت نشد'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_education(request, application_id):
    """
    مدیریت سوابق تحصیلی
    """
    try:
        applicant = ApplicantProfile.objects.get(user=request.user)
        application = get_object_or_404(Application, id=application_id, applicant=applicant)
        
        if request.method == 'GET':
            records = application.education_records.all()
            serializer = ApplicationEducationRecordSerializer(records, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            serializer = ApplicationEducationRecordSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(application=application)
                
                # Update application status
                if application.status in ['NEW', 'PROGRAM_SELECTED', 'PERSONAL_INFO_COMPLETED', 'IDENTITY_DOCS_UPLOADED']:
                    application.status = 'EDU_INFO_COMPLETED'
                    application.save()
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except ApplicantProfile.DoesNotExist:
        return Response(
            {'error': 'پروفایل متقاضی یافت نشد'},
            status=status.HTTP_404_NOT_FOUND
        )
