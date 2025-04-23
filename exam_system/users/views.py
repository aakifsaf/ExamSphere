from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.contrib.auth import get_user_model
from .serializers import UserSerializer
from exams.models import Submission
from django.db.models import Avg, Max, Min
import csv
from django.http import JsonResponse
from django.contrib.auth.models import User
import logging

logger = logging.getLogger(__name__)

User = get_user_model()

class StudentViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.filter(is_staff=False)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        student = self.get_object()
        is_active = request.data.get('is_active', None)
        
        if is_active is not None:
            student.is_active = is_active
            student.save()
            return Response({'status': 'student status updated'})
        return Response({'error': 'is_active field is required'}, 
                       status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def notify(self, request, pk=None):
        student = self.get_object()
        message = request.data.get('message')
        
        if not message:
            return Response({'error': 'message field is required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
            
        # Here you would implement the actual notification logic
        # For now, we'll just return success
        return Response({'status': 'notification sent'})

    @action(detail=True, methods=['get'])
    def exam_history(self, request, pk=None):
        student = self.get_object()
        submissions = Submission.objects.filter(user=student)
        
        history = []
        for submission in submissions:
            history.append({
                'exam_title': submission.exam.title,
                'score': submission.score,
                'time_taken': submission.time_taken,
                'submitted_date': submission.submitted_at,
                'total_questions': submission.total_questions
            })
            
        return Response(history) 
    
class StudentAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        try:
            student = User.objects.get(id=student_id)
            submissions = Submission.objects.filter(user=student)

            total_exams = submissions.count()
            average_score = submissions.aggregate(Avg('score'))['score__avg'] or 0
            highest_score = submissions.aggregate(Max('score'))['score__max'] or 0
            lowest_score = submissions.aggregate(Min('score'))['score__min'] or 0

            data = {
                'name': f"{student.first_name} {student.last_name}",
                'email': student.email,
                'totalExams': total_exams,
                'averageScore': round(average_score, 2),
                'highestScore': highest_score,
                'lowestScore': lowest_score,
            }

            return Response(data, status=200)
        except User.DoesNotExist:
            return Response({'error': 'Student not found'}, status=404)

class UploadStudentsCsvView(APIView):
    def post(self, request):
        if request.FILES.get('file'):
            csv_file = request.FILES['file']
            try:
                # ✅ Decode with UTF-8-SIG to handle BOM files
                decoded_file = csv_file.read().decode('utf-8-sig')
                lines = decoded_file.splitlines()

                # ✅ Properly pass lines to DictReader
                reader = csv.DictReader(lines)

                logger.info(f"CSV Headers: {reader.fieldnames}")
                for row in reader:
                    try:
                        username = row.get('Username', '').strip()
                        email = row.get('Email', '').strip()
                        password = row.get('Password', '').strip()

                        if not (username and email and password):
                            logger.warning(f"Incomplete row skipped: {row}")
                            continue

                        user = User.objects.create_user(
                            username=username,
                            email=email,
                            password=password,
                        )
                        logger.info(f"User created successfully: {user.username}")
                    except Exception as e:
                        logger.error(f"Error creating user for row {row}: {e}")
                return JsonResponse({'message': 'Students registered successfully.'}, status=201)

            except Exception as e:
                logger.error(f"Error processing CSV: {e}")
                return JsonResponse({'error': str(e)}, status=400)

        logger.warning("No file provided.")
        return JsonResponse({'error': 'No file provided.'}, status=400)