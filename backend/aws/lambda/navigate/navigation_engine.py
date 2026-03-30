"""
OSRM walking-route logic for Lambda (coordinates only; no geocoding).
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, Tuple

import requests

logger = logging.getLogger(__name__)


class RouteNotFoundError(Exception):
    """OSRM returned no route (code != Ok)."""


class OsrmUpstreamError(Exception):
    """OSRM HTTP failure, timeout, or invalid response."""


def _default_base_url() -> str:
    return os.environ.get(
        "OSRM_BASE_URL", "http://router.project-osrm.org/route/v1/foot/"
    )


def _timeout_sec() -> float:
    return float(os.environ.get("OSRM_TIMEOUT", "10"))


class NavigationEngine:
    def __init__(self) -> None:
        self.base_url = _default_base_url()
        if not self.base_url.endswith("/"):
            self.base_url += "/"

    def _parse_maneuver(self, maneuver: Dict[str, Any], street_name: str) -> str:
        m_type = maneuver.get("type", "")
        m_modifier = maneuver.get("modifier", "")
        street_str = f"onto {street_name}" if street_name else "ahead"

        if m_type == "depart":
            return (
                f"Start your journey and head {m_modifier}"
                if m_modifier
                else "Start heading straight"
            )
        if m_type == "arrive":
            return "You will arrive at your destination"
        if m_type == "turn":
            return f"Turn {m_modifier} {street_str}"
        if m_type == "continue":
            return f"Continue {m_modifier} {street_str}"
        if m_type == "fork":
            return f"At the fork, keep {m_modifier} {street_str}"
        return f"{m_type.replace('-', ' ').capitalize()} {m_modifier} {street_str}"

    def instructions_from_osrm_data(self, data: Dict[str, Any]) -> Tuple[List[str], float, float]:
        """Build instructions from parsed OSRM JSON (for tests and reuse)."""
        if data.get("code") != "Ok":
            raise RouteNotFoundError(data.get("message", "No route"))

        routes = data.get("routes") or []
        if not routes:
            raise RouteNotFoundError("Empty routes")

        route = routes[0]
        distance_m = float(route.get("distance", 0))
        duration_s = float(route.get("duration", 0))

        legs = route.get("legs") or []
        if not legs:
            raise OsrmUpstreamError("OSRM response missing legs")

        leg = legs[0]
        steps = leg.get("steps", [])

        instructions: List[str] = []
        for step in steps:
            maneuver = step.get("maneuver", {})
            street_name = step.get("name", "")
            distance = step.get("distance", 0)
            instruction_text = self._parse_maneuver(maneuver, street_name)
            if distance > 0 and maneuver.get("type") != "arrive":
                instructions.append(
                    f"{instruction_text}, and walk {int(distance)} meters."
                )
            else:
                instructions.append(f"{instruction_text}.")

        return instructions, distance_m, duration_s

    def get_walking_instructions(
        self, start_lon: float, start_lat: float, end_lon: float, end_lat: float
    ) -> Tuple[List[str], float, float]:
        """
        Fetch turn-by-turn walking instructions between two coordinates.

        Returns (instructions, distance_m, duration_s).

        Raises:
            RouteNotFoundError: OSRM could not find a route.
            OsrmUpstreamError: HTTP error, timeout, or malformed JSON.
        """
        coords_string = f"{start_lon},{start_lat};{end_lon},{end_lat}"
        request_url = f"{self.base_url}{coords_string}?steps=true&overview=false"
        timeout = _timeout_sec()

        logger.info("Requesting route from OSRM API")

        try:
            response = requests.get(request_url, timeout=timeout)
        except requests.exceptions.Timeout as e:
            logger.warning("OSRM request timed out: %s", e)
            raise OsrmUpstreamError("OSRM request timed out") from e
        except requests.exceptions.RequestException as e:
            logger.warning("OSRM request failed: %s", e)
            raise OsrmUpstreamError(f"OSRM request failed: {e}") from e

        if response.status_code != 200:
            logger.warning(
                "OSRM HTTP error status=%s body=%s",
                response.status_code,
                response.text[:500],
            )
            raise OsrmUpstreamError(
                f"OSRM returned status {response.status_code}"
            )

        try:
            data = response.json()
        except ValueError as e:
            logger.warning("OSRM JSON parse error: %s", e)
            raise OsrmUpstreamError("Invalid JSON from OSRM") from e

        return self.instructions_from_osrm_data(data)
