import json
from typing import Any, Dict

from vision_service_lambda import ObjectDetector, decode_image_from_base64


DETECTOR = ObjectDetector()


def _response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
        },
        "body": json.dumps(body),
    }


def lambda_handler(event, context):
    """
    Lambda handler for POST /detect.

    Expects a JSON body:
      { "image_base64": "<base64-encoded image>" }
    """
    try:
        if "body" not in event:
            return _response(400, {"error": "Missing request body."})

        # If invoked via API Gateway HTTP/REST API, body is a string.
        raw_body = event["body"]
        if event.get("isBase64Encoded"):
            import base64

            raw_body = base64.b64decode(raw_body).decode("utf-8")

        try:
            body = json.loads(raw_body)
        except json.JSONDecodeError:
            return _response(400, {"error": "Request body must be valid JSON."})

        image_b64 = body.get("image_base64")
        if not image_b64:
            return _response(400, {"error": "Field 'image_base64' is required."})

        if DETECTOR.model is None:
            return _response(500, {"error": "Model is not loaded."})

        img = decode_image_from_base64(image_b64)
        height, width = img.shape[:2]

        detections = DETECTOR.detect(img)
        description = DETECTOR.analyze_scene(detections, width, height)

        return _response(
            200,
            {
                "detections": detections,
                "scene_description": description,
            },
        )
    except Exception as exc:  # pragma: no cover - defensive
        # In production you may want to avoid returning raw errors.
        return _response(500, {"error": "Internal server error", "detail": str(exc)})

