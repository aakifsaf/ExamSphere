from rest_framework import serializers
from django.contrib.auth import get_user_model
from exams.models import Submission

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    exam_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                 'is_active', 'exam_count']
        read_only_fields = ['id', 'username', 'email', 'exam_count']

    def get_exam_count(self, obj):
        return Submission.objects.filter(user=obj).count() 