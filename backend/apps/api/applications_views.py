"""
Views for applicant applications management
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone

from apps.applications.models import Application, ApplicationChoice, ApplicationEducationRecord
from apps.accounts.models import ApplicantProfile
from .applications_serializers import (
    ApplicantApplicationDetailSerializer,
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
            'choices__program__faculty',
            'choices__program__department',
            'education_records',
            'documents',
            # Research records
            'research_articles',
            'patents',
            'festival_awards',
            'conference_articles',
            'books',
            'masters_thesis',
            # Olympiad & language
            'olympiad_records',
            'language_certificates',
            # Interview
            'interview'
        ).order_by('-created_at')
        
        serializer = ApplicantApplicationDetailSerializer(applications, many=True, context={'request': request})
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
                'choices__program__faculty',
                'choices__program__department',
                'education_records',
                'documents',
                'research_articles',
                'patents',
                'festival_awards',
                'conference_articles',
                'books',
                'masters_thesis',
                'olympiad_records',
                'language_certificates',
                'interview'
            ),
            id=application_id,
            applicant=applicant
        )
        
        serializer = ApplicantApplicationDetailSerializer(application)
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
        
        # Check education documents - بسته به وضعیت تحصیلی
        bsc_record = application.education_records.filter(degree_level='BSC').first()
        if bsc_record:
            if bsc_record.status == 'GRADUATED':
                # فارغ‌التحصیل: باید مدرک + ریزنمرات داشته باشد
                required_docs = ['BSC_CERT', 'BSC_TRANSCRIPT']
                required_count = 2
            else:
                # درحال تحصیل: فقط ریزنمرات کافیست
                required_docs = ['BSC_TRANSCRIPT', 'ENROLLMENT_CERT']
                required_count = 1
            
            edu_docs = application.documents.filter(type__in=required_docs)
            if edu_docs.count() < required_count:
                if bsc_record.status == 'GRADUATED':
                    errors.append('مدارک تحصیلی کارشناسی کامل نیست (مدرک فراغت + ریزنمرات)')
                else:
                    errors.append('مدارک تحصیلی کارشناسی کامل نیست (ریزنمرات)')
        else:
            errors.append('اطلاعات تحصیلی کارشناسی الزامی است')
        
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
            choices_payload = request.data.get('choices')

            # Bulk create/replace
            if choices_payload is not None:
                if not isinstance(choices_payload, list):
                    return Response(
                        {'error': 'choices باید یک لیست باشد'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if len(choices_payload) > 3:
                    return Response(
                        {'error': 'حداکثر 3 انتخاب رشته مجاز است'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                program_ids = [c.get('program_id') for c in choices_payload if isinstance(c, dict)]
                priorities = [c.get('priority') for c in choices_payload if isinstance(c, dict)]
                if len(program_ids) != len(set(program_ids)):
                    return Response(
                        {'error': 'نمی‌توانید یک رشته را چند بار انتخاب کنید'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                if len(priorities) != len(set(priorities)):
                    return Response(
                        {'error': 'اولویت‌های تکراری مجاز نیست'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                created = []
                with transaction.atomic():
                    ApplicationChoice.objects.filter(application=application).delete()
                    for choice_data in choices_payload:
                        serializer = ApplicationChoiceSerializer(data=choice_data)
                        if not serializer.is_valid():
                            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                        serializer.save(application=application)
                        created.append(serializer.data)

                    if application.status == 'NEW':
                        application.status = 'PROGRAM_SELECTED'
                        application.save()

                return Response(created, status=status.HTTP_201_CREATED)

            # Single choice create
            if application.choices.count() >= 3:
                return Response(
                    {'error': 'حداکثر 3 انتخاب رشته مجاز است'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer = ApplicationChoiceSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(application=application)

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
            ApplicationChoice.objects.filter(application=application).delete()
            return Response({'message': 'همه انتخاب‌ها حذف شد'})
            
    except ApplicantProfile.DoesNotExist:
        return Response(
            {'error': 'پروفایل متقاضی یافت نشد'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def application_choice_detail(request, application_id, choice_id):
    """
    بروزرسانی یا حذف یک انتخاب رشته
    """
    try:
        applicant = ApplicantProfile.objects.get(user=request.user)
        application = get_object_or_404(Application, id=application_id, applicant=applicant)
        choice = get_object_or_404(ApplicationChoice, id=choice_id, application=application)

        if request.method == 'PATCH':
            new_priority = request.data.get('priority')
            if new_priority is None:
                return Response(
                    {'error': 'priority الزامی است'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                new_priority = int(new_priority)
            except (TypeError, ValueError):
                return Response(
                    {'error': 'priority نامعتبر است'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if new_priority < 1 or new_priority > 3:
                return Response(
                    {'error': 'اولویت باید بین 1 تا 3 باشد'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic():
                existing = ApplicationChoice.objects.filter(
                    application=application,
                    priority=new_priority
                ).exclude(id=choice.id).first()

                if existing:
                    existing.priority, choice.priority = choice.priority, new_priority
                    existing.save(update_fields=['priority'])
                    choice.save(update_fields=['priority'])
                else:
                    choice.priority = new_priority
                    choice.save(update_fields=['priority'])

            serializer = ApplicationChoiceSerializer(choice)
            return Response(serializer.data)

        # DELETE
        with transaction.atomic():
            choice.delete()
            remaining = list(ApplicationChoice.objects.filter(application=application).order_by('priority'))
            for index, item in enumerate(remaining, start=1):
                if item.priority != index:
                    ApplicationChoice.objects.filter(id=item.id).update(priority=index)

        return Response(status=status.HTTP_204_NO_CONTENT)

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
            def normalize_payload(payload):
                data = payload.copy()
                if 'university' in data and 'university_id' not in data:
                    data['university_id'] = data.pop('university')
                if 'application' not in data:
                    data['application'] = application.id
                return data

            records_payload = request.data
            if isinstance(records_payload, list):
                created = []
                with transaction.atomic():
                    for record_data in records_payload:
                        data = normalize_payload(record_data)
                        record_id = data.get('id')

                        if record_id:
                            record = ApplicationEducationRecord.objects.filter(
                                id=record_id,
                                application=application
                            ).first()
                            serializer = ApplicationEducationRecordSerializer(
                                record,
                                data=data,
                                partial=True
                            )
                        else:
                            existing = ApplicationEducationRecord.objects.filter(
                                application=application,
                                degree_level=data.get('degree_level')
                            ).first()
                            if existing:
                                serializer = ApplicationEducationRecordSerializer(
                                    existing,
                                    data=data,
                                    partial=True
                                )
                            else:
                                serializer = ApplicationEducationRecordSerializer(data=data)

                        if serializer.is_valid():
                            serializer.save(application=application)
                            created.append(serializer.data)
                        else:
                            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

                if application.status in ['NEW', 'PROGRAM_SELECTED', 'PERSONAL_INFO_COMPLETED', 'IDENTITY_DOCS_UPLOADED']:
                    application.status = 'EDU_INFO_COMPLETED'
                    application.save()

                return Response(created, status=status.HTTP_201_CREATED)

            data = normalize_payload(records_payload)
            serializer = ApplicationEducationRecordSerializer(data=data)
            if serializer.is_valid():
                serializer.save(application=application)

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


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def education_record_detail(request, application_id, record_id):
    """
    بروزرسانی یا حذف یک سابقه تحصیلی
    """
    try:
        applicant = ApplicantProfile.objects.get(user=request.user)
        application = get_object_or_404(Application, id=application_id, applicant=applicant)
        record = get_object_or_404(
            ApplicationEducationRecord,
            id=record_id,
            application=application
        )

        if request.method == 'PATCH':
            data = request.data.copy()
            if 'university' in data and 'university_id' not in data:
                data['university_id'] = data.pop('university')

            serializer = ApplicationEducationRecordSerializer(record, data=data, partial=True)
            if serializer.is_valid():
                serializer.save(application=application)

                if application.status in [
                    'NEW',
                    'PROGRAM_SELECTED',
                    'PERSONAL_INFO_COMPLETED',
                    'IDENTITY_DOCS_UPLOADED'
                ]:
                    application.status = 'EDU_INFO_COMPLETED'
                    application.save()

                return Response(serializer.data)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # DELETE
        record.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    except ApplicantProfile.DoesNotExist:
        return Response(
            {'error': 'پروفایل متقاضی یافت نشد'},
            status=status.HTTP_404_NOT_FOUND
        )
