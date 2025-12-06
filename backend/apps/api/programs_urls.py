"""
Programs API URLs - برای انتخاب رشته
"""
from django.urls import path
from apps.api import programs_views

urlpatterns = [
    path('programs/', programs_views.available_programs, name='available-programs'),
    path('programs/<int:pk>/', programs_views.program_detail, name='program-detail'),
]
