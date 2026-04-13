from rest_framework import serializers

from .models import Visit


class TranscriptSerializer(serializers.Serializer):
    transcript = serializers.CharField()


class StructuredNoteSerializer(serializers.Serializer):
    structured_note = serializers.CharField()


class VisitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visit
        fields = ("id", "transcript", "structured_note", "created_at")
        read_only_fields = ("id", "created_at")
