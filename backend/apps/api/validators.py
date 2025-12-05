"""
Custom validators for file uploads
"""
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


def validate_file_size(value, max_size_mb=5):
    """
    Validate file size
    Default max size: 5 MB
    """
    filesize = value.size
    max_size_bytes = max_size_mb * 1024 * 1024
    
    if filesize > max_size_bytes:
        raise ValidationError(
            _('حجم فایل نباید بیشتر از %(max_size)s مگابایت باشد'),
            params={'max_size': max_size_mb},
        )


def validate_image_file(value):
    """
    Validate image files (jpg, jpeg, png)
    """
    import os
    ext = os.path.splitext(value.name)[1].lower()
    valid_extensions = ['.jpg', '.jpeg', '.png']
    
    if ext not in valid_extensions:
        raise ValidationError(
            _('فرمت فایل باید JPG، JPEG یا PNG باشد')
        )
    
    validate_file_size(value, max_size_mb=2)


def validate_pdf_file(value):
    """
    Validate PDF files
    """
    import os
    ext = os.path.splitext(value.name)[1].lower()
    
    if ext != '.pdf':
        raise ValidationError(_('فرمت فایل باید PDF باشد'))
    
    validate_file_size(value, max_size_mb=10)


def validate_national_id(value):
    """
    Validate Iranian national ID (10 digits)
    """
    if not value.isdigit() or len(value) != 10:
        raise ValidationError(_('کد ملی باید 10 رقم باشد'))
    
    # Check algorithm
    check = int(value[9])
    s = sum([int(value[x]) * (10 - x) for x in range(9)]) % 11
    
    if (s < 2 and check == s) or (s >= 2 and check == 11 - s):
        return value
    
    raise ValidationError(_('کد ملی نامعتبر است'))


def validate_mobile_number(value):
    """
    Validate Iranian mobile number
    """
    if not value.isdigit():
        raise ValidationError(_('شماره موبایل باید فقط شامل اعداد باشد'))
    
    if len(value) != 11:
        raise ValidationError(_('شماره موبایل باید 11 رقم باشد'))
    
    if not value.startswith('09'):
        raise ValidationError(_('شماره موبایل باید با 09 شروع شود'))
