import os, sys, json
sys.path.insert(0, '/var/www/talent/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings')
import django
django.setup()
from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth import get_user_model
from apps.accounts.models import AdminPermission
from apps.api import admin_views

User = get_user_model()
user = User.objects.filter(is_superuser=True).first()
if not user:
    user = User.objects.create(username='script_admin', email='script@example.com')
    user.is_staff = True
    user.is_superuser = True
    user.set_unusable_password()
    user.save()

# ensure AdminPermission exists
ap = None
try:
    ap = user.admin_permission
except Exception:
    ap = AdminPermission.objects.create(user=user, has_full_access=True, has_ma_talent_access=True)
    ap.save()

rf = APIRequestFactory()

req = rf.get('/api/admin/ma/program-admissions/')
force_authenticate(req, user=user)
resp_before = admin_views.ma_program_admissions(req)
data_before = getattr(resp_before, 'data', {})
print('=== BEFORE ===')
print(json.dumps(data_before, ensure_ascii=False, indent=2))

choice_to_accept = None
for prog in data_before.get('programs', []):
    for c in prog.get('prelim_accepted', []) + prog.get('prelim_waiting', []):
        if c.get('choice_admission_status') != 'ACCEPTED' and c.get('choice_id'):
            choice_to_accept = c
            break
    if choice_to_accept:
        break

if not choice_to_accept:
    print('No pending/waiting choice found to accept.')
    sys.exit(0)

choice_id = choice_to_accept['choice_id']
print('\nAccepting choice_id=', choice_id, 'for applicant', choice_to_accept['applicant']['first_name'])

post_req = rf.post(f'/api/admin/ma/choice/{choice_id}/accept/')
force_authenticate(post_req, user=user)
resp_accept = admin_views.ma_accept_choice(post_req, choice_id=choice_id)
print('Accept response status:', getattr(resp_accept, 'status_code', None))
print('Accept response data:', getattr(resp_accept, 'data', None))

req2 = rf.get('/api/admin/ma/program-admissions/')
force_authenticate(req2, user=user)
resp_after = admin_views.ma_program_admissions(req2)
data_after = getattr(resp_after, 'data', {})
print('\n=== AFTER ===')
print(json.dumps(data_after, ensure_ascii=False, indent=2))
