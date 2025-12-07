# Advanced Analytics API Endpoints

## Analytics Endpoint

### Get Advanced Analytics
```
GET /api/analytics/advanced/
```

**Query Parameters:**
- `time_range` (optional): Time range for data filtering
  - `7d`: Last 7 days
  - `30d`: Last 30 days (default)
  - `90d`: Last 3 months
  - `365d`: Current year

**Response Example:**
```json
{
  "applications_trend": [
    {
      "date": "1402/09/01",
      "count": 45,
      "accepted": 12,
      "rejected": 8,
      "pending": 25
    },
    {
      "date": "1402/09/02",
      "count": 52,
      "accepted": 15,
      "rejected": 10,
      "pending": 27
    }
  ],
  "status_distribution": [
    {"name": "در انتظار بررسی", "value": 125},
    {"name": "پذیرفته شده", "value": 78},
    {"name": "رد شده", "value": 45},
    {"name": "نیاز به اصلاح", "value": 32}
  ],
  "university_stats": [
    {
      "name": "دانشگاه تهران",
      "applications": 250,
      "acceptance_rate": 35.5
    },
    {
      "name": "دانشگاه شریف",
      "applications": 180,
      "acceptance_rate": 42.3
    }
  ],
  "program_stats": [
    {
      "name": "مهندسی کامپیوتر",
      "applications": 320
    },
    {
      "name": "مهندسی برق",
      "applications": 280
    }
  ],
  "monthly_comparison": [
    {
      "month": "فروردین",
      "current_year": 150,
      "previous_year": 120
    },
    {
      "month": "اردیبهشت",
      "current_year": 180,
      "previous_year": 145
    }
  ],
  "kpi_metrics": {
    "total_applications": 1250,
    "acceptance_rate": 38.5,
    "average_processing_time": 12,
    "active_users": 850,
    "growth_rate": 15.3
  }
}
```

## Implementation Notes

This endpoint should aggregate data from:
- `applications` table for application trends
- Application statuses for distribution
- University assignments for university stats
- Program selections for program stats
- Historical data for year-over-year comparison

### Backend Implementation Example (Django)

```python
# apps/api/analytics_views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q, Avg
from django.utils import timezone
from datetime import timedelta
from apps.applications.models import Application
from apps.admissions.models import University, Program

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def advanced_analytics(request):
    time_range = request.GET.get('time_range', '30d')
    
    # Calculate date range
    days_map = {'7d': 7, '30d': 30, '90d': 90, '365d': 365}
    days = days_map.get(time_range, 30)
    start_date = timezone.now() - timedelta(days=days)
    
    # Applications trend
    applications_trend = []
    for i in range(days):
        date = start_date + timedelta(days=i)
        day_apps = Application.objects.filter(
            created_at__date=date.date()
        )
        applications_trend.append({
            'date': date.strftime('%Y/%m/%d'),
            'count': day_apps.count(),
            'accepted': day_apps.filter(status='ACCEPTED').count(),
            'rejected': day_apps.filter(status='REJECTED').count(),
            'pending': day_apps.filter(status='PENDING').count(),
        })
    
    # Status distribution
    status_counts = Application.objects.filter(
        created_at__gte=start_date
    ).values('status').annotate(count=Count('id'))
    
    status_distribution = [
        {'name': get_status_display(item['status']), 'value': item['count']}
        for item in status_counts
    ]
    
    # University stats
    university_stats = University.objects.annotate(
        app_count=Count('applications', filter=Q(applications__created_at__gte=start_date)),
        accepted_count=Count('applications', filter=Q(
            applications__created_at__gte=start_date,
            applications__status='ACCEPTED'
        ))
    ).filter(app_count__gt=0).values('name', 'app_count', 'accepted_count')
    
    university_stats_data = [
        {
            'name': uni['name'],
            'applications': uni['app_count'],
            'acceptance_rate': (uni['accepted_count'] / uni['app_count'] * 100) if uni['app_count'] > 0 else 0
        }
        for uni in university_stats
    ]
    
    # Program stats
    program_stats = Program.objects.annotate(
        app_count=Count('applications', filter=Q(applications__created_at__gte=start_date))
    ).filter(app_count__gt=0).order_by('-app_count').values('name', 'app_count')[:10]
    
    program_stats_data = [
        {'name': prog['name'], 'applications': prog['app_count']}
        for prog in program_stats
    ]
    
    # KPI Metrics
    total_apps = Application.objects.filter(created_at__gte=start_date).count()
    accepted_apps = Application.objects.filter(
        created_at__gte=start_date, status='ACCEPTED'
    ).count()
    
    acceptance_rate = (accepted_apps / total_apps * 100) if total_apps > 0 else 0
    
    avg_processing = Application.objects.filter(
        created_at__gte=start_date, status__in=['ACCEPTED', 'REJECTED']
    ).annotate(
        processing_days=ExpressionWrapper(
            F('updated_at') - F('created_at'),
            output_field=DurationField()
        )
    ).aggregate(avg=Avg('processing_days'))
    
    active_users = User.objects.filter(last_login__gte=start_date).count()
    
    # Growth rate calculation
    previous_start = start_date - timedelta(days=days)
    previous_count = Application.objects.filter(
        created_at__gte=previous_start,
        created_at__lt=start_date
    ).count()
    
    growth_rate = ((total_apps - previous_count) / previous_count * 100) if previous_count > 0 else 0
    
    return Response({
        'applications_trend': applications_trend,
        'status_distribution': status_distribution,
        'university_stats': university_stats_data,
        'program_stats': program_stats_data,
        'monthly_comparison': [],  # Implement if needed
        'kpi_metrics': {
            'total_applications': total_apps,
            'acceptance_rate': round(acceptance_rate, 1),
            'average_processing_time': avg_processing['avg'].days if avg_processing['avg'] else 0,
            'active_users': active_users,
            'growth_rate': round(growth_rate, 1),
        }
    })
```

Add to `apps/api/admin_urls.py`:
```python
from .analytics_views import advanced_analytics

urlpatterns = [
    # ... existing routes ...
    path('analytics/advanced/', advanced_analytics, name='advanced-analytics'),
]
```
