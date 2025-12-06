from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from apps.core.models import University, UniversityWeight
from apps.admissions.models import AdmissionRound
from .core_serializers import UniversitySerializer, UniversityWeightSerializer
from .permissions import IsAdmin


class UniversityPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def universities_list(request):
    """
    لیست دانشگاه‌ها یا ایجاد دانشگاه جدید
    
    GET: همه کاربران می‌توانند لیست را ببینند
    POST: فقط ادمین می‌تواند دانشگاه جدید اضافه کند
    """
    if request.method == 'GET':
        # همه کاربران می‌توانند لیست دانشگاه‌ها را ببینند
        universities = University.objects.filter(is_active=True).order_by('name')
        
        # اگر round_type ارسال شده، ضرایب مربوطه را هم برگردان
        round_type = request.GET.get('round_type')
        round_id = request.GET.get('round_id')
        
        if round_id:
            # دانشگاه‌ها را به همراه ضریب در فراخوان خاص برگردان
            weights = UniversityWeight.objects.filter(
                round_id=round_id
            ).select_related('university')
            
            data = []
            for weight in weights:
                data.append({
                    'id': weight.university.id,
                    'name': weight.university.name,
                    'code': weight.university.code,
                    'weight': weight.weight,
                    'weight_id': weight.id,
                })
            
            # دانشگاه‌هایی که ضریب ندارند را هم اضافه کن
            universities_with_weight = [w.university.id for w in weights]
            universities_without = universities.exclude(id__in=universities_with_weight)
            
            for uni in universities_without:
                data.append({
                    'id': uni.id,
                    'name': uni.name,
                    'code': uni.code,
                    'weight': 1.0,
                    'weight_id': None,
                })
            
            return Response(sorted(data, key=lambda x: x['name']))
        else:
            # فقط لیست دانشگاه‌ها
            serializer = UniversitySerializer(universities, many=True)
            return Response(serializer.data)
    
    elif request.method == 'POST':
        # فقط ادمین می‌تواند دانشگاه اضافه کند
        if not request.user.role in ['ADMIN', 'SUPERADMIN', 'UNIVERSITY_ADMIN']:
            return Response(
                {'error': 'شما دسترسی به این عملیات ندارید'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = UniversitySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdmin])
def university_detail(request, pk):
    """
    جزئیات، ویرایش، یا حذف دانشگاه (فقط ادمین)
    """
    try:
        university = University.objects.get(pk=pk)
    except University.DoesNotExist:
        return Response(
            {'error': 'دانشگاه یافت نشد'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        serializer = UniversitySerializer(university)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = UniversitySerializer(university, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # نرم‌افزاری حذف کن (is_active = False)
        university.is_active = False
        university.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def university_weights_list(request):
    """
    لیست ضرایب دانشگاه‌ها یا ایجاد/بروزرسانی ضریب
    
    Query params:
    - round_id: شناسه فراخوان (اجباری برای GET)
    """
    if request.method == 'GET':
        round_id = request.GET.get('round_id')
        if not round_id:
            return Response(
                {'error': 'round_id الزامی است'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        weights = UniversityWeight.objects.filter(
            round_id=round_id
        ).select_related('university', 'round')
        
        serializer = UniversityWeightSerializer(weights, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        """
        ایجاد یا بروزرسانی ضریب دانشگاه
        
        Body:
        {
            "university_id": 1,
            "round_id": 1,
            "weight": 1.2
        }
        """
        university_id = request.data.get('university_id')
        round_id = request.data.get('round_id')
        weight = request.data.get('weight')
        
        if not all([university_id, round_id, weight]):
            return Response(
                {'error': 'university_id, round_id و weight الزامی هستند'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            university = University.objects.get(pk=university_id)
            round_obj = AdmissionRound.objects.get(pk=round_id)
        except (University.DoesNotExist, AdmissionRound.DoesNotExist):
            return Response(
                {'error': 'دانشگاه یا فراخوان یافت نشد'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # اگر ضریب وجود دارد، بروزرسانی کن وگرنه ایجاد کن
        weight_obj, created = UniversityWeight.objects.update_or_create(
            university=university,
            round=round_obj,
            defaults={'weight': weight}
        )
        
        serializer = UniversityWeightSerializer(weight_obj)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdmin])
def university_weight_detail(request, pk):
    """
    ویرایش یا حذف ضریب دانشگاه
    """
    try:
        weight = UniversityWeight.objects.get(pk=pk)
    except UniversityWeight.DoesNotExist:
        return Response(
            {'error': 'ضریب یافت نشد'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'PUT':
        serializer = UniversityWeightSerializer(weight, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        weight.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def bulk_update_weights(request):
    """
    بروزرسانی دسته‌جمعی ضرایب دانشگاه‌ها
    
    Body:
    {
        "round_id": 1,
        "weights": [
            {"university_id": 1, "weight": 1.2},
            {"university_id": 2, "weight": 1.0},
            ...
        ]
    }
    """
    round_id = request.data.get('round_id')
    weights_data = request.data.get('weights', [])
    
    if not round_id:
        return Response(
            {'error': 'round_id الزامی است'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        round_obj = AdmissionRound.objects.get(pk=round_id)
    except AdmissionRound.DoesNotExist:
        return Response(
            {'error': 'فراخوان یافت نشد'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    updated_count = 0
    created_count = 0
    
    for weight_data in weights_data:
        university_id = weight_data.get('university_id')
        weight_value = weight_data.get('weight')
        
        if not university_id or weight_value is None:
            continue
        
        try:
            university = University.objects.get(pk=university_id)
            weight_obj, created = UniversityWeight.objects.update_or_create(
                university=university,
                round=round_obj,
                defaults={'weight': weight_value}
            )
            
            if created:
                created_count += 1
            else:
                updated_count += 1
        except University.DoesNotExist:
            continue
    
    return Response({
        'message': f'{created_count} ضریب جدید ایجاد و {updated_count} ضریب بروزرسانی شد',
        'created': created_count,
        'updated': updated_count,
    })
