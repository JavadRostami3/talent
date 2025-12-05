"""
Unified Serializers for Research Records
تجمیع تمام سوابق پژوهشی در یک API واحد
"""
from rest_framework import serializers
from apps.applications.models import (
    Application,
    ResearchArticle,
    Patent,
    FestivalAward,
    ConferenceArticle,
    Book,
    MastersThesis
)


class UnifiedResearchRecordSerializer(serializers.Serializer):
    """
    Serializer یکپارچه برای نمایش تمام سوابق پژوهشی
    
    این Serializer تمام انواع سوابق پژوهشی (مقالات، کتاب‌ها، اختراعات و...)
    را در یک لیست واحد برمی‌گرداند.
    
    فرانت‌اند نیازی ندارد بداند این‌ها در جداول جداگانه هستند.
    """
    
    def to_representation(self, instance):
        """
        تبدیل تمام سوابق پژوهشی به یک فرمت مشترک
        
        instance: Application object
        """
        records = []
        
        # 1. مقالات پژوهشی و ترویجی
        for article in instance.research_articles.all():
            records.append({
                'id': article.id,
                'type': 'ARTICLE',
                'article_type': article.get_article_type_display(),
                'article_type_code': article.article_type,
                'title_fa': article.title_fa,
                'title_en': article.title_en,
                'journal_name': article.journal_name,
                'doi': article.doi,
                'publish_year': article.publish_year,
                'status': article.get_status_display(),
                'status_code': article.status,
                'authors': article.authors,
                'score': article.score,
                'file': article.file.url if article.file else None,
                'reviewed_by': article.reviewed_by.get_full_name() if article.reviewed_by else None,
                'reviewed_at': article.reviewed_at,
                'created_at': article.created_at,
            })
        
        # 2. اختراعات
        for patent in instance.patents.all():
            records.append({
                'id': patent.id,
                'type': 'PATENT',
                'title_fa': patent.title_fa,
                'title_en': patent.title_en,
                'patent_number': patent.patent_number,
                'registration_date': patent.registration_date,
                'inventors': patent.inventors,
                'description': patent.description,
                'score': patent.score,
                'file': patent.file.url if patent.file else None,
                'reviewed_by': patent.reviewed_by.get_full_name() if patent.reviewed_by else None,
                'reviewed_at': patent.reviewed_at,
                'created_at': patent.created_at,
            })
        
        # 3. جوایز جشنواره‌ها
        for award in instance.festival_awards.all():
            records.append({
                'id': award.id,
                'type': 'FESTIVAL_AWARD',
                'award_type': award.get_award_type_display(),
                'award_type_code': award.award_type,
                'festival_name': award.festival_name,
                'year': award.year,
                'rank': award.get_rank_display() if award.rank else None,
                'project_title': award.project_title,
                'description': award.description,
                'score': award.score,
                'file': award.file.url if award.file else None,
                'reviewed_by': award.reviewed_by.get_full_name() if award.reviewed_by else None,
                'reviewed_at': award.reviewed_at,
                'created_at': award.created_at,
            })
        
        # 4. مقالات کنفرانس
        for conf in instance.conference_articles.all():
            records.append({
                'id': conf.id,
                'type': 'CONFERENCE',
                'title_fa': conf.title_fa,
                'title_en': conf.title_en,
                'conference_name': conf.conference_name,
                'conference_location': conf.conference_location,
                'conference_date': conf.conference_date,
                'authors': conf.authors,
                'score': conf.score,
                'file': conf.file.url if conf.file else None,
                'reviewed_by': conf.reviewed_by.get_full_name() if conf.reviewed_by else None,
                'reviewed_at': conf.reviewed_at,
                'created_at': conf.created_at,
            })
        
        # 5. کتاب‌ها (تألیف یا ترجمه)
        for book in instance.books.all():
            records.append({
                'id': book.id,
                'type': 'BOOK',
                'book_type': book.get_book_type_display(),
                'book_type_code': book.book_type,
                'title_fa': book.title_fa,
                'title_en': book.title_en,
                'publisher': book.publisher,
                'isbn': book.isbn,
                'publish_year': book.publish_year,
                'authors_or_translators': book.authors_or_translators,
                'score': book.score,
                'file': book.file.url if book.file else None,
                'reviewed_by': book.reviewed_by.get_full_name() if book.reviewed_by else None,
                'reviewed_at': book.reviewed_at,
                'created_at': book.created_at,
            })
        
        # 6. پایان‌نامه ارشد (برای دکتری)
        if hasattr(instance, 'masters_thesis'):
            thesis = instance.masters_thesis
            records.append({
                'id': thesis.id,
                'type': 'MASTERS_THESIS',
                'title_fa': thesis.title_fa,
                'title_en': thesis.title_en,
                'grade': float(thesis.grade),
                'defense_date': thesis.defense_date,
                'main_supervisor': thesis.main_supervisor,
                'second_supervisor': thesis.second_supervisor,
                'advisor_1': thesis.advisor_1,
                'advisor_2': thesis.advisor_2,
                'score': thesis.score,
                'file': thesis.defense_minutes_file.url if thesis.defense_minutes_file else None,
                'reviewed_by': thesis.reviewed_by.get_full_name() if thesis.reviewed_by else None,
                'reviewed_at': thesis.reviewed_at,
                'created_at': thesis.created_at,
            })
        
        # مرتب‌سازی بر اساس تاریخ ایجاد (جدیدترین اول)
        records.sort(key=lambda x: x['created_at'], reverse=True)
        
        # محاسبه آمار کلی
        total_score = sum(r['score'] for r in records)
        
        return {
            'total_records': len(records),
            'total_score': total_score,
            'records': records,
            'summary': {
                'articles': len([r for r in records if r['type'] == 'ARTICLE']),
                'patents': len([r for r in records if r['type'] == 'PATENT']),
                'awards': len([r for r in records if r['type'] == 'FESTIVAL_AWARD']),
                'conferences': len([r for r in records if r['type'] == 'CONFERENCE']),
                'books': len([r for r in records if r['type'] == 'BOOK']),
                'thesis': 1 if any(r['type'] == 'MASTERS_THESIS' for r in records) else 0,
            }
        }


class ResearchRecordCreateSerializer(serializers.Serializer):
    """
    Serializer برای ایجاد سابقه پژوهشی جدید
    فرانت یک type می‌فرستد و بر اساس آن، به Serializer مناسب هدایت می‌شود
    """
    type = serializers.ChoiceField(
        choices=[
            ('ARTICLE', 'مقاله'),
            ('PATENT', 'اختراع'),
            ('FESTIVAL_AWARD', 'جایزه جشنواره'),
            ('CONFERENCE', 'مقاله کنفرانس'),
            ('BOOK', 'کتاب'),
            ('MASTERS_THESIS', 'پایان‌نامه ارشد'),
        ],
        required=True
    )
    data = serializers.JSONField(required=True)
    
    def validate(self, attrs):
        """اعتبارسنجی بر اساس نوع سابقه"""
        record_type = attrs['type']
        data = attrs['data']
        
        # اعتبارسنجی فیلدهای ضروری بر اساس نوع
        required_fields = {
            'ARTICLE': ['title_fa', 'journal_name', 'publish_year', 'article_type'],
            'PATENT': ['title_fa', 'patent_number', 'registration_date'],
            'FESTIVAL_AWARD': ['festival_name', 'year', 'award_type'],
            'CONFERENCE': ['title_fa', 'conference_name', 'conference_date'],
            'BOOK': ['title_fa', 'publisher', 'publish_year', 'book_type'],
            'MASTERS_THESIS': ['title_fa', 'grade', 'defense_date', 'main_supervisor'],
        }
        
        missing_fields = []
        for field in required_fields.get(record_type, []):
            if field not in data or not data[field]:
                missing_fields.append(field)
        
        if missing_fields:
            raise serializers.ValidationError({
                'data': f"فیلدهای ضروری وارد نشده: {', '.join(missing_fields)}"
            })
        
        return attrs
