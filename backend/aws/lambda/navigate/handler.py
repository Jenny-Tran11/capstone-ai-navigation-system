import json
import logging
import time
from typing import Any, Dict, Optional

from navigation_engine import (
    NavigationEngine,
    OsrmUpstreamError,
    RouteNotFoundError,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_engine: Optional[NavigationEngine] = None


def _get_engine() -> NavigationEngine:
    global _engine
    if _engine is None:
        _engine = NavigationEngine()
    return _engine


def _response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }


def _parse_float(params: Dict[str, str], key: str) -> float:
    raw = params.get(key)
    if raw is None or raw == "":
        raise ValueError(f"Missing required query parameter: {key}")
    return float(raw)


def _validate_coord(lat: float, lon: float) -> None:
    if not -90.0 <= lat <= 90.0:
        raise ValueError("start_lat or end_lat must be between -90 and 90")
    if not -180.0 <= lon <= 180.0:
        raise ValueError("start_lon or end_lon must be between -180 and 180")


def lambda_handler(event, context):
    """
    GET /navigate with query params:
      start_lat, start_lon, end_lat, end_lon
    """
    request_id = getattr(context, "aws_request_id", None) or "local"
    t_handler0 = time.perf_counter()

    try:
        params = event.get("queryStringParameters") or {}
        try:
            start_lat = _parse_float(params, "start_lat")
            start_lon = _parse_float(params, "start_lon")
            end_lat = _parse_float(params, "end_lat")
            end_lon = _parse_float(params, "end_lon")
        except ValueError as e:
            return _response(400, {"error": "bad_request", "message": str(e)})

        try:
            _validate_coord(start_lat, start_lon)
            _validate_coord(end_lat, end_lon)
        except ValueError as e:
            return _response(400, {"error": "bad_request", "message": str(e)})

        engine = _get_engine()
        t_osrm0 = time.perf_counter()
        try:
            instructions, distance_m, duration_s = engine.get_walking_instructions(
                start_lon, start_lat, end_lon, end_lat
            )
        except RouteNotFoundError as e:
            return _response(
                404,
                {
                    "error": "route_not_found",
                    "message": str(e),
                    "instructions": [],
                },
            )
        except OsrmUpstreamError as e:
            return _response(
                502,
                {"error": "upstream_error", "message": str(e)},
            )
        osrm_ms = (time.perf_counter() - t_osrm0) * 1000.0
        handler_ms = (time.perf_counter() - t_handler0) * 1000.0

        logger.info(
            json.dumps(
                {
                    "msg": "navigate_complete",
                    "request_id": request_id,
                    "osrm_ms": round(osrm_ms, 2),
                    "handler_total_ms": round(handler_ms, 2),
                    "step_count": len(instructions),
                }
            )
        )

        return _response(
            200,
            {
                "instructions": instructions,
                "distance_m": round(distance_m, 1),
                "duration_s": round(duration_s, 1),
            },
        )
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Unhandled error in navigate handler")
        return _response(
            500,
            {"error": "internal_error", "message": "Internal server error"},
        )
