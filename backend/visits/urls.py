from django.urls import path

from . import views

urlpatterns = [
    path("transcribe/", views.TranscribeView.as_view(), name="transcribe"),
    path("structure/", views.StructureView.as_view(), name="structure"),
    path("visits/", views.VisitListCreateView.as_view(), name="visit-list-create"),
]
