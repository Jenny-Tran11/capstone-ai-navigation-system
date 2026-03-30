"""
Amazon Polly synthesis for Lambda (Neural engine, configurable voice).
"""

from __future__ import annotations

import os
from typing import Any, Optional

import boto3
from botocore.exceptions import BotoCoreError, ClientError

_polly_client: Optional[Any] = None

DEFAULT_VOICE_ID = "Olivia"
DEFAULT_ENGINE = "neural"
DEFAULT_OUTPUT_FORMAT = "mp3"


def _env(name: str, default: str) -> str:
    v = os.environ.get(name)
    return v if v is not None and v != "" else default


def get_polly_client() -> Any:
    global _polly_client
    if _polly_client is None:
        _polly_client = boto3.client("polly")
    return _polly_client


def synthesize(text: str, client: Optional[Any] = None) -> bytes:
    """
    Synthesize speech from plain text. Returns raw audio bytes (e.g. MP3).
    """
    polly = client if client is not None else get_polly_client()
    voice_id = _env("POLLY_VOICE_ID", DEFAULT_VOICE_ID)
    engine = _env("POLLY_ENGINE", DEFAULT_ENGINE)
    output_format = _env("POLLY_OUTPUT_FORMAT", DEFAULT_OUTPUT_FORMAT)

    response = polly.synthesize_speech(
        Engine=engine,
        OutputFormat=output_format,
        Text=text,
        TextType="text",
        VoiceId=voice_id,
    )
    stream = response["AudioStream"]
    return stream.read()


def is_throttling_error(exc: ClientError) -> bool:
    code = exc.response.get("Error", {}).get("Code", "")
    return code in ("ThrottlingException", "TooManyRequestsException")
