"""
Notifications API Views - Mock endpoints for development
TODO: Implement real notification system
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_list(request):
    """
    لیست اعلان‌های کاربر (موقت - بدون داده)
    """
    # Mock response برای جلوگیری از خطا در frontend
    return Response({
        'count': 0,
        'next': None,
        'previous': None,
        'results': []
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_stats(request):
    """
    آمار اعلان‌های کاربر (موقت)
    """
    return Response({
        'total': 0,
        'unread': 0,
        'archived': 0
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, pk):
    """
    علامت‌گذاری اعلان به عنوان خوانده شده
    """
    return Response({'status': 'ok'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_read(request):
    """
    علامت‌گذاری همه اعلان‌ها به عنوان خوانده شده
    """
    return Response({'status': 'ok', 'message': 'همه اعلان‌ها خوانده شدند'})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notification(request, pk):
    """
    حذف اعلان
    """
    return Response(status=status.HTTP_204_NO_CONTENT)
