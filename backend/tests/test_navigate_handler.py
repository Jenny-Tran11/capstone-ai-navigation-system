"""
Tests for the navigate Lambda handler and navigation_engine (mocked OSRM).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
import requests

# backend/
_BACKEND_ROOT = Path(__file__).resolve().parents[1]
_NAVIGATE_LAMBDA = _BACKEND_ROOT / "aws" / "lambda" / "navigate"

sys.path.insert(0, str(_BACKEND_ROOT))
sys.path.insert(0, str(_NAVIGATE_LAMBDA))

import handler  # noqa: E402
import navigation_engine  # noqa: E402
from navigation_service import NavigationEngine as LegacyNavigationEngine  # noqa: E402


def _minimal_osrm_ok_response() -> dict:
    return {
        "code": "Ok",
        "routes": [
            {
                "distance": 1500.0,
                "duration": 420.0,
                "legs": [
                    {
                        "steps": [
                            {
                                "maneuver": {"type": "depart", "modifier": "northeast"},
                                "name": "Northfields Avenue",
                                "distance": 12.5,
                            },
                            {
                                "maneuver": {"type": "turn", "modifier": "right"},
                                "name": "Ring Road",
                                "distance": 80.0,
                            },
                            {
                                "maneuver": {"type": "arrive", "modifier": ""},
                                "name": "",
                                "distance": 0,
                            },
                        ]
                    }
                ],
            }
        ],
    }


def _mock_response(status_code: int, json_data: dict | None = None) -> MagicMock:
    r = MagicMock()
    r.status_code = status_code
    if json_data is not None:
        r.json.return_value = json_data
    return r


class _FakeContext:
    aws_request_id = "test-request-id"


@pytest.fixture
def api_gateway_event():
    return {
        "queryStringParameters": {
            "start_lat": "-34.4054",
            "start_lon": "150.8784",
            "end_lat": "-34.41227",
            "end_lon": "150.89136",
        }
    }


def test_instructions_match_legacy_engine_for_same_osrm_payload():
    fixture = _minimal_osrm_ok_response()
    mock_get = MagicMock(
        return_value=_mock_response(200, fixture),
    )
    with patch.object(requests, "get", mock_get):
        legacy = LegacyNavigationEngine()
        legacy.base_url = "http://router.project-osrm.org/route/v1/foot/"
        legacy_out = legacy.get_walking_instructions(
            150.8784, -34.4054, 150.89136, -34.41227
        )

        nav = navigation_engine.NavigationEngine()
        nav_out, dist_m, dur_s = nav.get_walking_instructions(
            150.8784, -34.4054, 150.89136, -34.41227
        )

    assert nav_out == legacy_out
    assert dist_m == 1500.0
    assert dur_s == 420.0
    mock_get.assert_called()


def test_lambda_handler_success(api_gateway_event):
    fixture = _minimal_osrm_ok_response()
    with patch.object(
        navigation_engine.requests,
        "get",
        return_value=_mock_response(200, fixture),
    ):
        resp = handler.lambda_handler(api_gateway_event, _FakeContext())

    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert "instructions" in body
    assert len(body["instructions"]) == 3
    assert body["distance_m"] == 1500.0
    assert body["duration_s"] == 420.0


def test_lambda_handler_missing_param_returns_400():
    event = {
        "queryStringParameters": {
            "start_lat": "-34.4054",
            "start_lon": "150.8784",
            "end_lat": "-34.41227",
        }
    }
    resp = handler.lambda_handler(event, _FakeContext())
    assert resp["statusCode"] == 400
    body = json.loads(resp["body"])
    assert body["error"] == "bad_request"


def test_lambda_handler_invalid_coord_range():
    event = {
        "queryStringParameters": {
            "start_lat": "95.0",
            "start_lon": "150.8784",
            "end_lat": "-34.41227",
            "end_lon": "150.89136",
        }
    }
    resp = handler.lambda_handler(event, _FakeContext())
    assert resp["statusCode"] == 400


def test_lambda_handler_osrm_timeout_returns_502(api_gateway_event):
    with patch.object(
        navigation_engine.requests,
        "get",
        side_effect=requests.exceptions.Timeout("timed out"),
    ):
        resp = handler.lambda_handler(api_gateway_event, _FakeContext())
    assert resp["statusCode"] == 502
    body = json.loads(resp["body"])
    assert body["error"] == "upstream_error"


def test_lambda_handler_osrm_non_200_returns_502(api_gateway_event):
    with patch.object(
        navigation_engine.requests,
        "get",
        return_value=_mock_response(503, {}),
    ):
        resp = handler.lambda_handler(api_gateway_event, _FakeContext())
    assert resp["statusCode"] == 502


def test_lambda_handler_route_not_found_returns_404(api_gateway_event):
    fixture = {"code": "NoRoute", "message": "No route found"}
    with patch.object(
        navigation_engine.requests,
        "get",
        return_value=_mock_response(200, fixture),
    ):
        resp = handler.lambda_handler(api_gateway_event, _FakeContext())
    assert resp["statusCode"] == 404
    body = json.loads(resp["body"])
    assert body["error"] == "route_not_found"
    assert body["instructions"] == []


def test_lambda_handler_unhandled_exception_returns_500(api_gateway_event):
    with patch.object(
        navigation_engine.NavigationEngine,
        "get_walking_instructions",
        side_effect=RuntimeError("boom"),
    ):
        resp = handler.lambda_handler(api_gateway_event, _FakeContext())
    assert resp["statusCode"] == 500
    body = json.loads(resp["body"])
    assert body["error"] == "internal_error"
