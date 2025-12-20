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
import logging
from django.core.exceptions import MultipleObjectsReturned

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
        print(f"Validation errors: {serializer.errors}")  # Debug log
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    print(f"Validated data: {data}")  # Debug log
    
    try:
        with transaction.atomic():
            # Find or create user
            user, user_created = User.objects.get_or_create(
                national_id=data['national_id'],
                defaults={
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'mobile': data['mobile'],
                    'email': data['email'],
                    'role': 'APPLICANT'
                }
            )
            
            # Update user info if already exists
            if not user_created:
                user.first_name = data['first_name']
                user.last_name = data['last_name']
                user.mobile = data['mobile']
                user.email = data['email']
                user.save()
            
            # Create or get applicant profile
            profile, _ = ApplicantProfile.objects.get_or_create(user=user)
            
            # Find active round (already validated in serializer)
            # If multiple rounds are active for the same type, pick the most recent one.
            try:
                round_obj = AdmissionRound.objects.get(
                    type=data['round_type'],
                    is_active=True
                )
            except MultipleObjectsReturned:
                logging.warning(
                    "Multiple active AdmissionRound found for type %s; selecting the most recent one",
                    data['round_type']
                )
                round_obj = AdmissionRound.objects.filter(
                    type=data['round_type'],
                    is_active=True
                ).order_by('-id').first()
                if not round_obj:
                    raise AdmissionRound.DoesNotExist("No active AdmissionRound found")
            
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
    ورود داوطلب یا مدیر به سامانه
    POST: national_id + (tracking_code OR password)
    Returns: access, refresh tokens
    """
    serializer = UserLoginSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    national_id = data['national_id']
    tracking_code = data.get('tracking_code')
    password = data.get('password')
    
    try:
        # Find user
        user = User.objects.get(national_id=national_id)
        
        # تشخیص نوع لاگین
        if password:
            # ورود مدیر با رمز عبور
            if not user.check_password(password):
                return Response(
                    {'error': 'رمز عبور نادرست است'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # بررسی نقش کاربر
            if user.role == 'APPLICANT':
                return Response(
                    {'error': 'دسترسی غیرمجاز. لطفاً از صفحه ورود دانشجویان استفاده کنید.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if not user.is_staff:
                return Response(
                    {'error': 'دسترسی محدود. لطفاً با پشتیبانی تماس بگیرید.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Generate tokens for admin
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'ورود موفقیت‌آمیز',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'national_id': user.national_id,
                    'full_name': user.get_full_name(),
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': user.role,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser
                }
            }, status=status.HTTP_200_OK)
            
        elif tracking_code:
            # ورود دانشجو با کد پیگیری
            profile = user.profile
            application = Application.objects.get(
                applicant=profile,
                tracking_code=tracking_code
            )
            
            # Generate tokens for applicant
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'ورود موفقیت‌آمیز',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'national_id': user.national_id,
                    'full_name': user.get_full_name(),
                    'role': user.role,
                    'round_type': application.round.type
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
