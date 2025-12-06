"""
Serializers for accounts app
"""
from rest_framework import serializers
from apps.accounts.models import User, ApplicantProfile, AdminPermission


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    military_status_display = serializers.CharField(source='get_military_status_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'national_id', 'first_name', 'last_name', 'father_name',
            'email', 'mobile', 'role',
            # اطلاعات شناسنامه‌ای
            'birth_certificate_number', 'birth_certificate_serial',
            'birth_certificate_issue_place',
            'gender', 'gender_display', 'birth_year', 'birth_place',
            # وضعیت نظام وظیفه
            'military_status', 'military_status_display'
        ]
        # کد ملی پس از ثبت‌نام غیرقابل تغییر است
        read_only_fields = ['id', 'national_id', 'role']
    
    def validate(self, data):
        """اعتبارسنجی: اگر جنسیت مرد است، وضعیت نظام وظیفه الزامی است"""
        gender = data.get('gender', self.instance.gender if self.instance else None)
        military_status = data.get('military_status')
        
        if gender == 'MALE' and not military_status:
            raise serializers.ValidationError({
                'military_status': 'وضعیت نظام وظیفه برای مردان الزامی است'
            })
        
        return data


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer برای ویرایش محدود پروفایل کاربر"""
    
    class Meta:
        model = User
        fields = [
            'father_name',
            'birth_certificate_number', 'birth_certificate_serial',
            'birth_certificate_issue_place',
            'mobile',
            'birth_year', 'birth_place',
            'gender', 'military_status'
        ]
    
    def validate(self, data):
        """اعتبارسنجی: اگر جنسیت مرد است، وضعیت نظام وظیفه الزامی است"""
        gender = data.get('gender', self.instance.gender if self.instance else None)
        military_status = data.get('military_status', self.instance.military_status if self.instance else None)
        
        if gender == 'MALE' and not military_status:
            raise serializers.ValidationError({
                'military_status': 'وضعیت نظام وظیفه برای مردان الزامی است'
            })
        
        return data


class AdminPermissionSerializer(serializers.ModelSerializer):
    """Serializer for AdminPermission model"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    faculty_names = serializers.SerializerMethodField()
    department_names = serializers.SerializerMethodField()
    
    class Meta:
        model = AdminPermission
        fields = [
            'id', 'user', 'user_name',
            'has_ma_talent_access', 'has_phd_talent_access',
            'has_phd_exam_access', 'has_olympiad_access',
            'faculties', 'faculty_names',
            'departments', 'department_names',
            'has_full_access',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_faculty_names(self, obj):
        """لیست نام دانشکده‌ها"""
        if obj.has_full_access or not obj.faculties.exists():
            return ["همه دانشکده‌ها"]
        return [f.name for f in obj.faculties.all()]
    
    def get_department_names(self, obj):
        """لیست نام گروه‌های آموزشی"""
        if obj.has_full_access:
            return ["همه گروه‌ها"]
        if not obj.departments.exists():
            return ["همه گروه‌های دانشکده‌های انتخابی"]
        return [f"{d.faculty.name} - {d.name}" for d in obj.departments.select_related('faculty').all()]


class AdminPermissionCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating admin permissions"""
    
    class Meta:
        model = AdminPermission
        fields = [
            'user',
            'has_ma_talent_access', 'has_phd_talent_access',
            'has_phd_exam_access', 'has_olympiad_access',
            'faculties', 'departments', 'has_full_access'
        ]
    
    def validate_user(self, value):
        """اعتبارسنجی که کاربر باید ادمین باشد"""
        if value.role not in ['ADMIN', 'SUPERADMIN']:
            raise serializers.ValidationError("فقط کاربران با نقش ADMIN یا SUPERADMIN می‌توانند دسترسی داشته باشند")
        return value
    
    def validate(self, data):
        """اعتبارسنجی کلی"""
        # اگر دسترسی کامل داشته باشد، نیازی به انتخاب دانشکده/گروه نیست
        if data.get('has_full_access'):
            data['faculties'] = []
            data['departments'] = []
        
        # بررسی که گروه‌های انتخابی زیرمجموعه دانشکده‌های انتخابی باشند
        faculties = data.get('faculties', [])
        departments = data.get('departments', [])
        
        if faculties and departments:
            faculty_ids = [f.id for f in faculties]
            for dept in departments:
                if dept.faculty_id not in faculty_ids:
                    raise serializers.ValidationError(
                        f"گروه {dept.name} متعلق به دانشکده‌های انتخابی نیست"
                    )
        
        return data


class ApplicantProfileSerializer(serializers.ModelSerializer):
    """Serializer for ApplicantProfile model"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = ApplicantProfile
        fields = [
            'id', 'user',
            'address', 'phone',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ApplicantProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating ApplicantProfile"""
    
    class Meta:
        model = ApplicantProfile
        fields = [
            'address', 'phone'
        ]


class UserRegistrationSerializer(serializers.Serializer):
    """Serializer for simplified initial registration"""
    national_id = serializers.CharField(max_length=10, required=True)
    round_type = serializers.CharField(max_length=20, required=True)
    
    # اطلاعات اختیاری که می‌توان بعداً تکمیل کرد
    first_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    mobile = serializers.CharField(max_length=15, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    
    def validate_national_id(self, value):
        """Validate national ID format and checksum"""
        from apps.api.validators import validate_national_id
        
        # چک کردن فرمت و الگوریتم کد ملی
        validate_national_id(value)
        return value
    
    def validate_mobile(self, value):
        """Validate mobile number format"""
        if value:  # فقط اگر مقدار وارد شده باشد
            from apps.api.validators import validate_mobile_number
            validate_mobile_number(value)
        return value
    
    def validate_round_type(self, value):
        """Validate that an active round exists for this type"""
        from apps.admissions.models import AdmissionRound
        
        if not AdmissionRound.objects.filter(type=value, is_active=True).exists():
            raise serializers.ValidationError("فراخوان فعالی برای این نوع یافت نشد")
        
        return value


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    national_id = serializers.CharField(max_length=10, required=True)
    tracking_code = serializers.CharField(max_length=20, required=True)
    captcha = serializers.CharField(max_length=10, required=False)
