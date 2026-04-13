import anthropic
from openai import APIError as OpenAIAPIError
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Visit
from .serializers import StructuredNoteSerializer, TranscriptSerializer, VisitSerializer
from .services import claude, whisper


class TranscribeView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        upload = request.FILES.get("audio")
        if not upload:
            return Response(
                {"detail": "Missing file field 'audio'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            text = whisper.transcribe_audio(file=upload, filename=upload.name)
        except RuntimeError as e:
            return Response({"detail": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except OpenAIAPIError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response({"transcript": text})


class StructureView(APIView):
    parser_classes = (JSONParser,)

    def post(self, request):
        ser = TranscriptSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        transcript = ser.validated_data["transcript"]
        try:
            note = claude.structure_soap(transcript)
        except RuntimeError as e:
            return Response({"detail": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except anthropic.APIError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        out = StructuredNoteSerializer({"structured_note": note})
        return Response(out.data)


class VisitListCreateView(APIView):
    def get(self, request):
        visits = Visit.objects.all()
        return Response(VisitSerializer(visits, many=True).data)

    def post(self, request):
        ser = VisitSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data, status=status.HTTP_201_CREATED)
