"""
Tests for the speak Lambda handler (mocked Polly).
"""

from __future__ import annotations

import base64
import importlib.util
import json
import sys
from pathlib import Path
from unittest.mock import patch

from botocore.exceptions import BotoCoreError, ClientError

_BACKEND_ROOT = Path(__file__).resolve().parents[1]
_SPEAK_LAMBDA = _BACKEND_ROOT / "aws" / "lambda" / "speak"

# Load speak handler as a distinct module (avoids clashing with navigate/handler.py)
sys.path.insert(0, str(_SPEAK_LAMBDA))
_spec = importlib.util.spec_from_file_location(
    "speak_lambda_handler",
    _SPEAK_LAMBDA / "handler.py",
)
assert _spec and _spec.loader
speak_handler = importlib.util.module_from_spec(_spec)
sys.modules["speak_lambda_handler"] = speak_handler
_spec.loader.exec_module(speak_handler)


class _FakeContext:
    aws_request_id = "test-request-id"


def _event(body_dict: dict | None) -> dict:
    if body_dict is None:
        return {"body": None}
    return {"body": json.dumps(body_dict)}


def test_lambda_handler_success_returns_base64_mp3():
    fake_audio = b"\xff\xfb\x90\x00fake-mp3"
    with patch.object(speak_handler, "synthesize", return_value=fake_audio):
        resp = speak_handler.lambda_handler(
            _event({"text": "Turn left at the corner."}),
            _FakeContext(),
        )

    assert resp["statusCode"] == 200
    assert resp["isBase64Encoded"] is True
    assert resp["headers"]["Content-Type"] == "audio/mpeg"
    decoded = base64.b64decode(resp["body"])
    assert decoded == fake_audio


def test_lambda_handler_missing_body_returns_400():
    resp = speak_handler.lambda_handler({"body": None}, _FakeContext())
    assert resp["statusCode"] == 400
    body = json.loads(resp["body"])
    assert body["error"] == "bad_request"


def test_lambda_handler_invalid_json_returns_400():
    resp = speak_handler.lambda_handler({"body": "not-json{"}, _FakeContext())
    assert resp["statusCode"] == 400
    body = json.loads(resp["body"])
    assert body["error"] == "bad_request"
    assert "Invalid JSON" in body["message"]


def test_lambda_handler_not_object_returns_400():
    resp = speak_handler.lambda_handler({"body": '"string"'}, _FakeContext())
    assert resp["statusCode"] == 400
    body = json.loads(resp["body"])
    assert body["error"] == "bad_request"


def test_lambda_handler_missing_text_field_returns_400():
    resp = speak_handler.lambda_handler(_event({}), _FakeContext())
    assert resp["statusCode"] == 400
    body = json.loads(resp["body"])
    assert "text" in body["message"].lower() or "Missing" in body["message"]


def test_lambda_handler_empty_text_returns_400():
    resp = speak_handler.lambda_handler(_event({"text": "   "}), _FakeContext())
    assert resp["statusCode"] == 400


def test_lambda_handler_text_not_string_returns_400():
    resp = speak_handler.lambda_handler(_event({"text": 123}), _FakeContext())
    assert resp["statusCode"] == 400


def test_lambda_handler_oversized_text_returns_400():
    long_text = "x" * (speak_handler.MAX_TEXT_LEN + 1)
    resp = speak_handler.lambda_handler(_event({"text": long_text}), _FakeContext())
    assert resp["statusCode"] == 400


def test_lambda_handler_polly_throttling_returns_429():
    err = ClientError(
        {"Error": {"Code": "ThrottlingException", "Message": "Slow down"}},
        "SynthesizeSpeech",
    )
    with patch.object(speak_handler, "synthesize", side_effect=err):
        resp = speak_handler.lambda_handler(
            _event({"text": "Hello"}),
            _FakeContext(),
        )
    assert resp["statusCode"] == 429
    body = json.loads(resp["body"])
    assert body["error"] == "throttled"


def test_lambda_handler_polly_client_error_returns_502():
    err = ClientError(
        {"Error": {"Code": "InvalidParameterValue", "Message": "Bad"}},
        "SynthesizeSpeech",
    )
    with patch.object(speak_handler, "synthesize", side_effect=err):
        resp = speak_handler.lambda_handler(
            _event({"text": "Hello"}),
            _FakeContext(),
        )
    assert resp["statusCode"] == 502
    body = json.loads(resp["body"])
    assert body["error"] == "upstream_error"


def test_lambda_handler_boto_core_error_returns_502():
    with patch.object(speak_handler, "synthesize", side_effect=BotoCoreError()):
        resp = speak_handler.lambda_handler(
            _event({"text": "Hello"}),
            _FakeContext(),
        )
    assert resp["statusCode"] == 502
    body = json.loads(resp["body"])
    assert body["error"] == "upstream_error"


def test_lambda_handler_unhandled_exception_returns_500():
    with patch.object(speak_handler, "synthesize", side_effect=RuntimeError("boom")):
        resp = speak_handler.lambda_handler(
            _event({"text": "Hello"}),
            _FakeContext(),
        )
    assert resp["statusCode"] == 500
    body = json.loads(resp["body"])
    assert body["error"] == "internal_error"


def test_base64_encoded_body_decoded():
    raw = json.dumps({"text": "Hi"})
    b64 = base64.b64encode(raw.encode("utf-8")).decode("ascii")
    fake_audio = b"audio"
    with patch.object(speak_handler, "synthesize", return_value=fake_audio):
        resp = speak_handler.lambda_handler(
            {"body": b64, "isBase64Encoded": True},
            _FakeContext(),
        )
    assert resp["statusCode"] == 200
    assert base64.b64decode(resp["body"]) == fake_audio
