# Payment Gateway Integration Guide

این ماژول برای مدیریت پرداخت هزینه ثبت‌نام طراحی شده است.

## ویژگی‌ها

✅ **مدل کامل Payment**: ذخیره تمام اطلاعات پرداخت
✅ **مدل PaymentSetting**: تنظیم مبلغ و درگاه برای هر نوع فراخوان
✅ **پشتیبانی از درگاه‌های متعدد**: سامان، ملت، پارسیان، زرین‌پال، آیدی‌پی
✅ **Tracking System**: کد پیگیری یکتا برای هر پرداخت
✅ **Status Management**: مدیریت کامل وضعیت‌های مختلف پرداخت

## نحوه فعال‌سازی

### 1. اضافه کردن به INSTALLED_APPS

در فایل `config/settings.py`:

```python
INSTALLED_APPS = [
    # ...
    'apps.payments',
    # ...
]
```

### 2. اجرای Migration

```bash
python manage.py makemigrations payments
python manage.py migrate payments
```

### 3. تنظیمات درگاه پرداخت

در فایل `settings.py` تنظیمات درگاه مورد نظر را اضافه کنید:

```python
# Payment Gateway Settings
PAYMENT_GATEWAY = 'SAMAN'  # یا MELLAT, ZARINPAL, ...

# تنظیمات درگاه سامان
SAMAN_MERCHANT_ID = 'your-merchant-id'
SAMAN_TERMINAL_ID = 'your-terminal-id'
SAMAN_API_URL = 'https://sep.shaparak.ir/...'

# تنظیمات زرین‌پال
ZARINPAL_MERCHANT_ID = 'your-merchant-id'
ZARINPAL_CALLBACK_URL = 'http://yourdomain.com/api/payments/verify/'

# URL های بازگشت
PAYMENT_CALLBACK_URL = 'http://yourdomain.com/api/payments/callback/'
PAYMENT_SUCCESS_REDIRECT = 'http://yourdomain.com/payment/success/'
PAYMENT_FAILED_REDIRECT = 'http://yourdomain.com/payment/failed/'
```

## API Endpoints (پیشنهادی)

### 1. ایجاد پرداخت

```
POST /api/payments/create/
```

**Request Body:**
```json
{
  "application_id": 123,
  "gateway": "SAMAN"
}
```

**Response:**
```json
{
  "payment_id": 456,
  "tracking_code": "PAY-ABC123XYZ",
  "amount": 500000,
  "gateway_url": "https://sep.shaparak.ir/...",
  "token": "gateway-token"
}
```

### 2. تایید پرداخت (Callback)

```
POST /api/payments/verify/
```

### 3. وضعیت پرداخت

```
GET /api/payments/{tracking_code}/status/
```

### 4. لیست پرداخت‌های کاربر

```
GET /api/payments/my-payments/
```

## نمونه کد Integration

### ایجاد Serializer

```python
# apps/api/payment_serializers.py

from rest_framework import serializers
from apps.payments.models import Payment, PaymentSetting


class PaymentSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    gateway_display = serializers.CharField(source='get_gateway_display', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'tracking_code', 'application', 'amount',
            'status', 'status_display', 'gateway', 'gateway_display',
            'reference_number', 'transaction_id', 'paid_at',
            'description', 'created_at'
        ]
        read_only_fields = ['tracking_code', 'paid_at', 'created_at']


class CreatePaymentSerializer(serializers.Serializer):
    application_id = serializers.IntegerField(required=True)
    gateway = serializers.ChoiceField(
        choices=Payment.Gateway.choices,
        required=False
    )
```

### ایجاد View

```python
# apps/api/payment_views.py

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.payments.models import Payment, PaymentSetting
from apps.applications.models import Application


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment(request):
    """
    ایجاد پرداخت جدید و دریافت لینک پرداخت
    """
    application_id = request.data.get('application_id')
    
    try:
        application = Application.objects.get(
            id=application_id,
            applicant__user=request.user
        )
    except Application.DoesNotExist:
        return Response(
            {'error': 'درخواست یافت نشد'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # بررسی پرداخت قبلی
    existing_payment = Payment.objects.filter(
        application=application,
        status=Payment.PaymentStatus.PAID
    ).first()
    
    if existing_payment:
        return Response(
            {'error': 'پرداخت قبلاً انجام شده است'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # دریافت تنظیمات پرداخت
    try:
        payment_setting = PaymentSetting.objects.get(
            round_type=application.round.type,
            is_active=True
        )
    except PaymentSetting.DoesNotExist:
        return Response(
            {'error': 'تنظیمات پرداخت یافت نشد'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # ایجاد پرداخت
    payment = Payment.objects.create(
        application=application,
        amount=payment_setting.amount,
        gateway=request.data.get('gateway', payment_setting.gateway),
        payer_name=request.user.get_full_name(),
        payer_mobile=request.user.mobile,
        payer_email=request.user.email,
        ip_address=request.META.get('REMOTE_ADDR')
    )
    
    # اتصال به درگاه و دریافت لینک
    # TODO: پیاده‌سازی اتصال به درگاه
    gateway_url = _get_payment_gateway_url(payment)
    
    return Response({
        'payment_id': payment.id,
        'tracking_code': payment.tracking_code,
        'amount': payment.amount,
        'gateway_url': gateway_url
    }, status=status.HTTP_201_CREATED)


def _get_payment_gateway_url(payment):
    """
    اتصال به API درگاه و دریافت URL پرداخت
    این تابع باید بر اساس درگاه انتخابی پیاده‌سازی شود
    """
    # TODO: Implement gateway integration
    return "https://gateway.example.com/pay"
```

### اضافه کردن URL

```python
# apps/api/payment_urls.py

from django.urls import path
from . import payment_views

urlpatterns = [
    path('create/', payment_views.create_payment, name='create-payment'),
    path('verify/', payment_views.verify_payment, name='verify-payment'),
    path('<str:tracking_code>/status/', payment_views.payment_status, name='payment-status'),
    path('my-payments/', payment_views.my_payments, name='my-payments'),
]
```

## کتابخانه‌های پیشنهادی

برای اتصال به درگاه‌های بانکی می‌توانید از این پکیج‌ها استفاده کنید:

```bash
pip install django-payment  # پکیج عمومی
pip install suds-jurko  # برای SOAP APIs
pip install zeep  # برای SOAP APIs (جدیدتر)
```

## نکات امنیتی

1. ✅ همیشه مبلغ پرداخت را از سمت سرور بخوانید (نه از request کاربر)
2. ✅ IP کاربر را ذخیره کنید
3. ✅ از HTTPS استفاده کنید
4. ✅ تمام callback ها را verify کنید
5. ✅ پرداخت‌های موفق را قابل حذف نکنید

## TODO List

- [ ] پیاده‌سازی اتصال به درگاه سامان
- [ ] پیاده‌سازی اتصال به زرین‌پال
- [ ] ایجاد API endpoints کامل
- [ ] تست کامل فرآیند پرداخت
- [ ] پیاده‌سازی webhook برای notification های درگاه
- [ ] افزودن لاگ برای تمام تراکنش‌ها
- [ ] پیاده‌سازی refund (برگشت وجه)

## مثال استفاده

```python
# در کد application
from apps.payments.models import Payment, PaymentSetting

# بررسی نیاز به پرداخت
payment_setting = PaymentSetting.objects.filter(
    round_type=application.round.type,
    is_active=True,
    is_required=True
).first()

if payment_setting:
    # پرداخت الزامی است
    has_paid = Payment.objects.filter(
        application=application,
        status=Payment.PaymentStatus.PAID
    ).exists()
    
    if not has_paid:
        return {"error": "لطفاً ابتدا هزینه ثبت‌نام را پرداخت کنید"}
```
