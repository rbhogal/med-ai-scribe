"""Claude SOAP structuring."""

from __future__ import annotations

import os

import anthropic

SYSTEM_PROMPT = (
    "You are a clinical documentation assistant. Given a raw physician-patient "
    "conversation transcript, return a SOAP note in markdown with exactly four "
    "sections: Subjective, Objective, Assessment, Plan. Be concise and clinical. "
    "If a section has no information, write 'Not documented.' Return only the "
    "SOAP note, no preamble."
)

MODEL_ID = "claude-sonnet-4-20250514"


def structure_soap(transcript: str) -> str:
    """Turn a raw transcript into a markdown SOAP note."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set")

    client = anthropic.Anthropic(api_key=api_key)
    message = client.messages.create(
        model=MODEL_ID,
        max_tokens=8192,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": transcript}],
    )
    parts: list[str] = []
    for block in message.content:
        if block.type == "text":
            parts.append(block.text)
    return "".join(parts).strip()
