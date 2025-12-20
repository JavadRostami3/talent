import os
import sys
import django
import json

sys.path.insert(0, '/var/www/talent/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings')

django.setup()
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.api import admin_views

User = get_user_model()
user = User.objects.filter(is_superuser=True).first()
if not user:
    user = User.objects.create(username='script_admin', email='script@example.com')
    user.is_staff = True
    user.is_superuser = True
    user.set_unusable_password()
    user.save()

rf = APIRequestFactory()
req = rf.get('/api/admin/ma/program-admissions/')
force_authenticate(req, user=user)

resp = admin_views.ma_program_admissions(req)
out = getattr(resp, 'data', None)
print('STATUS:', getattr(resp, 'status_code', None))
print(json.dumps(out, ensure_ascii=False, default=str, indent=2))
