from django.db import models


class Visit(models.Model):
    """Stored encounter: raw transcript and clinician-editable SOAP note."""

    transcript = models.TextField()
    structured_note = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Visit {self.pk} @ {self.created_at:%Y-%m-%d %H:%M}"
