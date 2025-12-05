"""
Research Records API URLs
"""
from django.urls import path
from apps.api import research_views

urlpatterns = [
    # دریافت تمام سوابق پژوهشی به صورت یکپارچه
    path(
        'applications/<int:application_id>/research-records/',
        research_views.get_research_records,
        name='research-records-list'
    ),
    
    # ایجاد سابقه پژوهشی جدید
    path(
        'applications/<int:application_id>/research-records/create/',
        research_views.create_research_record,
        name='research-records-create'
    ),
    
    # خلاصه آماری سوابق پژوهشی
    path(
        'applications/<int:application_id>/research-records/summary/',
        research_views.get_research_summary,
        name='research-records-summary'
    ),
    
    # ویرایش/حذف سابقه پژوهشی
    path(
        'applications/<int:application_id>/research-records/<str:record_type>/<int:record_id>/',
        research_views.manage_research_record,
        name='research-records-manage'
    ),
]
