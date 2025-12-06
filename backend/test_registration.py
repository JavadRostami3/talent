"""
اسکریپت تست ثبت‌نام با کدهای ملی معتبر
"""
import requests
import json

API_BASE_URL = "http://localhost:8000"

# کدهای ملی معتبر برای تست
valid_national_ids = [
    "0499370899",
    "0067749828",
    "0453986640",
]

# داده‌های تستی برای ثبت‌نام
test_data = {
    "national_id": valid_national_ids[0],
    "first_name": "علی",
    "last_name": "احمدی",
    "mobile": "09123456789",
    "email": "ali.ahmadi@test.com",
    "round_type": "MA_TALENT"
}

print("=" * 50)
print("تست ثبت‌نام داوطلب")
print("=" * 50)

try:
    response = requests.post(
        f"{API_BASE_URL}/api/auth/register/",
        json=test_data,
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"\nResponse:")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    
    if response.status_code in [200, 201]:
        print("\n✅ ثبت‌نام با موفقیت انجام شد!")
        tracking_code = response.json().get('tracking_code')
        print(f"\n📝 کد پیگیری: {tracking_code}")
        
        # تست لاگین
        print("\n" + "=" * 50)
        print("تست ورود به سامانه")
        print("=" * 50)
        
        login_data = {
            "national_id": test_data["national_id"],
            "tracking_code": tracking_code
        }
        
        login_response = requests.post(
            f"{API_BASE_URL}/api/auth/login/",
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"\nLogin Status Code: {login_response.status_code}")
        print(f"\nLogin Response:")
        print(json.dumps(login_response.json(), indent=2, ensure_ascii=False))
        
        if login_response.status_code == 200:
            print("\n✅ ورود با موفقیت انجام شد!")
        else:
            print("\n❌ خطا در ورود به سامانه")
    else:
        print("\n❌ خطا در ثبت‌نام")
        
except requests.exceptions.ConnectionError:
    print("\n❌ خطا: سرور در دسترس نیست. لطفا سرور Django را اجرا کنید:")
    print("   python manage.py runserver")
except Exception as e:
    print(f"\n❌ خطا: {str(e)}")

print("\n" + "=" * 50)
print("پایان تست")
print("=" * 50)
