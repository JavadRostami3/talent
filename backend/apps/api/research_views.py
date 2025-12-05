"""
Research Records API Views
API یکپارچه برای مدیریت سوابق پژوهشی
"""
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from apps.applications.models import (
    Application,
    ResearchArticle,
    Patent,
    FestivalAward,
    ConferenceArticle,
    Book,
    MastersThesis
)
from apps.api.research_serializers import (
    UnifiedResearchRecordSerializer,
    ResearchRecordCreateSerializer
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_research_records(request, application_id):
    """
    دریافت تمام سوابق پژوهشی یک درخواست به صورت یکپارچه
    
    GET /api/applications/{application_id}/research-records/
    
    Response:
    {
        "total_records": 10,
        "total_score": 35.5,
        "summary": {
            "articles": 5,
            "patents": 2,
            "awards": 1,
            "conferences": 1,
            "books": 1,
            "thesis": 0
        },
        "records": [
            {
                "id": 1,
                "type": "ARTICLE",
                "title_fa": "...",
                "score": 8,
                ...
            },
            ...
        ]
    }
    """
    application = get_object_or_404(
        Application,
        id=application_id,
        applicant__user=request.user
    )
    
    serializer = UnifiedResearchRecordSerializer(application)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_research_record(request, application_id):
    """
    ایجاد سابقه پژوهشی جدید
    
    POST /api/applications/{application_id}/research-records/
    
    Body:
    {
        "type": "ARTICLE",  // ARTICLE | PATENT | FESTIVAL_AWARD | CONFERENCE | BOOK | MASTERS_THESIS
        "data": {
            "title_fa": "عنوان فارسی",
            "journal_name": "نام ژورنال",
            ...
        }
    }
    """
    application = get_object_or_404(
        Application,
        id=application_id,
        applicant__user=request.user
    )
    
    # چک کردن اینکه فقط دکتری می‌تواند سوابق پژوهشی ثبت کند
    if application.round.type not in ['PHD_TALENT', 'PHD_EXAM']:
        return Response(
            {'error': 'فقط داوطلبان دکتری می‌توانند سوابق پژوهشی ثبت کنند'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = ResearchRecordCreateSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    record_type = serializer.validated_data['type']
    data = serializer.validated_data['data']
    
    # ایجاد رکورد بر اساس نوع
    try:
        if record_type == 'ARTICLE':
            record = ResearchArticle.objects.create(
                application=application,
                **data
            )
        elif record_type == 'PATENT':
            record = Patent.objects.create(
                application=application,
                **data
            )
        elif record_type == 'FESTIVAL_AWARD':
            record = FestivalAward.objects.create(
                application=application,
                **data
            )
        elif record_type == 'CONFERENCE':
            record = ConferenceArticle.objects.create(
                application=application,
                **data
            )
        elif record_type == 'BOOK':
            record = Book.objects.create(
                application=application,
                **data
            )
        elif record_type == 'MASTERS_THESIS':
            # چک کردن که قبلاً پایان‌نامه ثبت نکرده باشد
            if hasattr(application, 'masters_thesis'):
                return Response(
                    {'error': 'پایان‌نامه قبلاً ثبت شده است'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            record = MastersThesis.objects.create(
                application=application,
                **data
            )
        
        return Response(
            {
                'message': 'سابقه پژوهشی با موفقیت ثبت شد',
                'record_id': record.id,
                'type': record_type
            },
            status=status.HTTP_201_CREATED
        )
        
    except Exception as e:
        return Response(
            {'error': f'خطا در ثبت سابقه: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def manage_research_record(request, application_id, record_type, record_id):
    """
    ویرایش یا حذف سابقه پژوهشی
    
    PUT /api/applications/{application_id}/research-records/{record_type}/{record_id}/
    DELETE /api/applications/{application_id}/research-records/{record_type}/{record_id}/
    
    record_type: article | patent | award | conference | book | thesis
    """
    application = get_object_or_404(
        Application,
        id=application_id,
        applicant__user=request.user
    )
    
    # پیدا کردن رکورد بر اساس نوع
    model_map = {
        'article': ResearchArticle,
        'patent': Patent,
        'award': FestivalAward,
        'conference': ConferenceArticle,
        'book': Book,
        'thesis': MastersThesis,
    }
    
    if record_type not in model_map:
        return Response(
            {'error': 'نوع سابقه نامعتبر است'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    Model = model_map[record_type]
    record = get_object_or_404(Model, id=record_id, application=application)
    
    # حذف
    if request.method == 'DELETE':
        record.delete()
        return Response(
            {'message': 'سابقه پژوهشی با موفقیت حذف شد'},
            status=status.HTTP_200_OK
        )
    
    # ویرایش
    if request.method == 'PUT':
        # به‌روزرسانی فیلدها
        for key, value in request.data.items():
            if hasattr(record, key):
                setattr(record, key, value)
        
        record.save()
        
        return Response(
            {'message': 'سابقه پژوهشی با موفقیت به‌روزرسانی شد'},
            status=status.HTTP_200_OK
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_research_summary(request, application_id):
    """
    دریافت خلاصه آماری سوابق پژوهشی
    
    GET /api/applications/{application_id}/research-records/summary/
    
    Response:
    {
        "total_score": 35.5,
        "max_possible_score": 58,
        "completion_percentage": 61.2,
        "breakdown": {
            "articles_score": 20,
            "patents_score": 8,
            "awards_score": 5,
            "conferences_score": 1.5,
            "books_score": 1,
            "thesis_score": 0
        }
    }
    """
    application = get_object_or_404(
        Application,
        id=application_id,
        applicant__user=request.user
    )
    
    # محاسبه امتیازها
    articles_score = sum([a.score for a in application.research_articles.all()])
    patents_score = sum([p.score for p in application.patents.all()])
    awards_score = sum([f.score for f in application.festival_awards.all()])
    conferences_score = sum([c.score for c in application.conference_articles.all()])
    books_score = sum([b.score for b in application.books.all()])
    thesis_score = application.masters_thesis.score if hasattr(application, 'masters_thesis') else 0
    
    total_score = (
        articles_score +
        patents_score +
        awards_score +
        conferences_score +
        books_score +
        thesis_score
    )
    
    max_possible = 58  # حداکثر امتیاز سوابق پژوهشی
    completion_percentage = (total_score / max_possible * 100) if max_possible > 0 else 0
    
    return Response({
        'total_score': total_score,
        'max_possible_score': max_possible,
        'completion_percentage': round(completion_percentage, 1),
        'breakdown': {
            'articles_score': articles_score,
            'patents_score': patents_score,
            'awards_score': awards_score,
            'conferences_score': conferences_score,
            'books_score': books_score,
            'thesis_score': thesis_score,
        },
        'max_limits': {
            'articles': 40,  # مقالات پژوهشی + اختراعات + جشنواره
            'promotional_articles': 6,  # مقالات ترویجی
            'conferences': 4,
            'books': 4,
            'thesis': 4,
        }
    })
