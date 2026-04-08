import base64
import json
import logging
import time
from typing import Any, Dict, Optional, Tuple

from botocore.exceptions import BotoCoreError, ClientError

from polly_synthesizer import is_throttling_error, synthesize

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MAX_TEXT_LEN = 3000


def _json_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }


def _parse_body(event: Dict[str, Any]) -> Optional[str]:
    raw = event.get("body")
    if raw is None:
        return None
    if event.get("isBase64Encoded"):
        raw = base64.b64decode(raw).decode("utf-8")
    if not isinstance(raw, str):
        raw = str(raw)
    return raw


def _validate_text_field(payload: Dict[str, Any]) -> Tuple[Optional[str], Optional[str]]:
    if "text" not in payload:
        return None, "Missing required field: text"
    raw = payload["text"]
    if raw is None:
        return None, "text must be a non-empty string"
    if not isinstance(raw, str):
        return None, "text must be a string"
    text = raw.strip()
    if text == "":
        return None, "text must be a non-empty string"
    if len(text) > MAX_TEXT_LEN:
        return None, f"text must be at most {MAX_TEXT_LEN} characters"
    return text, None


def lambda_handler(event, context):
    """
    POST /speak with JSON body: {"text": "..."}
    Returns MP3 audio (base64-encoded for API Gateway) on success.
    """
    request_id = getattr(context, "aws_request_id", None) or "local"
    t0 = time.perf_counter()

    try:
        raw_body = _parse_body(event)
        if raw_body is None:
            return _json_response(
                400,
                {"error": "bad_request", "message": "Missing request body"},
            )
        try:
            payload = json.loads(raw_body)
        except json.JSONDecodeError as e:
            return _json_response(
                400,
                {"error": "bad_request", "message": f"Invalid JSON: {e}"},
            )

        if not isinstance(payload, dict):
            return _json_response(
                400,
                {"error": "bad_request", "message": "Body must be a JSON object"},
            )

        text, err = _validate_text_field(payload)
        if err:
            return _json_response(400, {"error": "bad_request", "message": err})

        assert text is not None
        text_len = len(text)

        try:
            audio_bytes = synthesize(text)
        except ClientError as e:
            if is_throttling_error(e):
                logger.warning(
                    json.dumps(
                        {
                            "msg": "polly_throttled",
                            "request_id": request_id,
                            "text_len": text_len,
                        }
                    )
                )
                return _json_response(
                    429,
                    {"error": "throttled", "message": "Polly rate limit exceeded"},
                )
            logger.warning(
                "Polly ClientError: %s",
                e.response.get("Error", {}),
            )
            return _json_response(
                502,
                {"error": "upstream_error", "message": "Polly synthesis failed"},
            )
        except BotoCoreError as e:
            logger.warning("Polly BotoCoreError: %s", e)
            return _json_response(
                502,
                {"error": "upstream_error", "message": "Polly synthesis failed"},
            )

        polly_ms = (time.perf_counter() - t0) * 1000.0
        logger.info(
            json.dumps(
                {
                    "msg": "speak_complete",
                    "request_id": request_id,
                    "text_len": text_len,
                    "polly_ms": round(polly_ms, 2),
                    "audio_bytes": len(audio_bytes),
                }
            )
        )

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "audio/mpeg",
                "Cache-Control": "no-store",
            },
            "body": base64.b64encode(audio_bytes).decode("ascii"),
            "isBase64Encoded": True,
        }
    except Exception:  # pragma: no cover - defensive
        logger.exception("Unhandled error in speak handler")
        return _json_response(
            500,
            {"error": "internal_error", "message": "Internal server error"},
        )
