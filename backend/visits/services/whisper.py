"""OpenAI Whisper transcription."""

from __future__ import annotations

import os
from typing import BinaryIO

from openai import OpenAI


def transcribe_audio(*, file: BinaryIO, filename: str) -> str:
    """
    Transcribe audio using OpenAI Whisper.

    `file` should be a binary file-like object (e.g. Django UploadedFile).
    """
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")

    file.seek(0)
    payload = (filename or "audio.webm", file.read())

    client = OpenAI(api_key=api_key)
    result = client.audio.transcriptions.create(
        model="whisper-1",
        file=payload,
    )
    return (result.text or "").strip()
