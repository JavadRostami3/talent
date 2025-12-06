"""
Authentication views and viewsets
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db import transaction

from apps.accounts.models import ApplicantProfile
from apps.admissions.models import AdmissionRound
from apps.applications.models import Application
from apps.workflow.models import ApplicationWorkflowLog
from apps.api.accounts_serializers import UserLoginSerializer, UserRegistrationSerializer

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def register_initial(request):
    """
    ثبت‌نام اولیه داوطلب
    POST: national_id, first_name, last_name, mobile, email, round_type
    Returns: tracking_code, application_id
    """
    serializer = UserRegistrationSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    
    try:
        with transaction.atomic():
            # Find or create user with minimal required info
            user_defaults = {
                'first_name': data.get('first_name', ''),
                'last_name': data.get('last_name', ''),
                'mobile': data.get('mobile', ''),
                'email': data.get('email', ''),
                'role': 'APPLICANT'
            }
            
            user, user_created = User.objects.get_or_create(
                national_id=data['national_id'],
                defaults=user_defaults
            )
            
            # Update user info if provided and user already exists
            if not user_created:
                if data.get('first_name'):
                    user.first_name = data['first_name']
                if data.get('last_name'):
                    user.last_name = data['last_name']
                if data.get('mobile'):
                    user.mobile = data['mobile']
                if data.get('email'):
                    user.email = data['email']
                user.save()
            
            # Create or get applicant profile
            profile, _ = ApplicantProfile.objects.get_or_create(user=user)
            
            # Find active round (already validated in serializer)
            round_obj = AdmissionRound.objects.get(
                type=data['round_type'],
                is_active=True
            )
            
            # Create or get application
            application, app_created = Application.objects.get_or_create(
                applicant=profile,
                round=round_obj,
                defaults={'status': 'NEW'}
            )
            
            # Create workflow log if new
            if app_created:
                ApplicationWorkflowLog.objects.create(
                    application=application,
                    step_type='APPLICANT_SUBMITTED',
                    description='ثبت‌نام اولیه انجام شد',
                    created_by=user
                )
            
            return Response({
                'message': 'ثبت‌نام با موفقیت انجام شد',
                'tracking_code': application.tracking_code,
                'application_id': application.id,
                'user_created': user_created,
                'application_created': app_created
            }, status=status.HTTP_201_CREATED if app_created else status.HTTP_200_OK)
            
    except Exception as e:
        return Response(
            {'error': f'خطا در ثبت‌نام: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def login_applicant(request):
    """
    ورود داوطلب به سامانه
    POST: national_id, tracking_code, captcha (optional)
    Returns: access, refresh tokens
    """
    serializer = UserLoginSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    
    try:
        # Find user
        user = User.objects.get(national_id=data['national_id'])
        
        # Find application with tracking code
        profile = user.profile
        application = Application.objects.get(
            applicant=profile,
            tracking_code=data['tracking_code']
        )
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'ورود موفقیت‌آمیز',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'national_id': user.national_id,
                'full_name': user.get_full_name(),
                'role': user.role
            },
            'application_id': application.id,
            'tracking_code': application.tracking_code
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response(
            {'error': 'کاربری با این کد ملی یافت نشد'},
            status=status.HTTP_404_NOT_FOUND
        )
    except ApplicantProfile.DoesNotExist:
        return Response(
            {'error': 'پروفایل داوطلب یافت نشد'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Application.DoesNotExist:
        return Response(
            {'error': 'کد پیگیری نامعتبر است'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'خطا در ورود: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
