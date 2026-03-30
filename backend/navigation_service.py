import requests
from typing import Optional, Tuple

import config


class NavigationEngine:
    def __init__(self):
        # Base URL for OSRM public routing API
        self.base_url = "http://router.project-osrm.org/route/v1/foot/"

    def geocode_address(self, address: str) -> Optional[Tuple[float, float]]:
        """
        Resolves a human-readable address to (longitude, latitude) using
        the Nominatim (OpenStreetMap) geocoding API.
        """
        if not address:
            return None

        url = "https://nominatim.openstreetmap.org/search"
        params = {"q": address, "format": "json", "limit": 1}
        headers = {"User-Agent": config.NOMINATIM_USER_AGENT}

        try:
            response = requests.get(url, params=params, headers=headers, timeout=10)
        except Exception as e:
            print(f"Geocoding error: {e}")
            return None

        if response.status_code != 200:
            print(f"Geocoding failed with status {response.status_code}")
            return None

        try:
            results = response.json()
        except Exception as e:
            print(f"Geocoding JSON parse error: {e}")
            return None

        if not results:
            print("Geocoding returned no results.")
            return None

        first = results[0]
        try:
            lat = float(first["lat"])
            lon = float(first["lon"])
        except (KeyError, ValueError) as e:
            print(f"Geocoding result parse error: {e}")
            return None

        return lon, lat

    def parse_location(self, input_str: str) -> Optional[Tuple[float, float]]:
        """
        Parses a location string that may be either:
        - a pair of coordinates: 'lon,lat'
        - a free-form address, which is then geocoded.
        Returns (lon, lat) or None on failure.
        """
        if not input_str:
            return None

        # Try 'lon,lat' coordinates first
        parts = [p.strip() for p in input_str.split(",")]
        if len(parts) == 2:
            try:
                lon = float(parts[0])
                lat = float(parts[1])
                return lon, lat
            except ValueError:
                pass

        # Fallback to geocoding
        return self.geocode_address(input_str)

    def _parse_maneuver(self, maneuver, street_name):
        """
        Translates raw OSRM maneuver data into human-readable English.
        """
        m_type = maneuver.get("type", "")
        m_modifier = maneuver.get("modifier", "")
        
        # Handle empty street names gracefully
        street_str = f"onto {street_name}" if street_name else "ahead"

        if m_type == "depart":
            return f"Start your journey and head {m_modifier}" if m_modifier else "Start heading straight"
        elif m_type == "arrive":
            return "You will arrive at your destination"
        elif m_type == "turn":
            return f"Turn {m_modifier} {street_str}"
        elif m_type == "continue":
            return f"Continue {m_modifier} {street_str}"
        elif m_type == "fork":
            return f"At the fork, keep {m_modifier} {street_str}"
        else:
            # Fallback for other types like 'roundabout', 'merge', etc.
            return f"{m_type.replace('-', ' ').capitalize()} {m_modifier} {street_str}"

    def get_walking_instructions(self, start_lon, start_lat, end_lon, end_lat):
        """
        Fetches turn-by-turn walking instructions between two coordinates.
        """
        coords_string = f"{start_lon},{start_lat};{end_lon},{end_lat}"
        request_url = f"{self.base_url}{coords_string}?steps=true&overview=false"

        print("Requesting route from OSRM API...")
        
        try:
            response = requests.get(request_url)
            
            if response.status_code != 200:
                print(f"API Request Failed. Status Code: {response.status_code}")
                return []

            data = response.json()

            if data.get("code") != "Ok":
                print("Error: Route not found.")
                return []

            legs = data["routes"][0]["legs"][0]
            steps = legs.get("steps", [])

            instructions = []
            for step in steps:
                maneuver = step.get("maneuver", {})
                street_name = step.get("name", "")
                distance = step.get("distance", 0) # in meters
                
                # Convert raw data to spoken English
                instruction_text = self._parse_maneuver(maneuver, street_name)
                
                # Only add distance if it's significant (> 0) and not the final arrival step
                if distance > 0 and maneuver.get("type") != "arrive":
                    instructions.append(f"{instruction_text}, and walk {int(distance)} meters.")
                else:
                    instructions.append(f"{instruction_text}.")

            return instructions

        except Exception as e:
            print(f"Connection Error: {e}")
            return []

if __name__ == "__main__":
    nav = NavigationEngine()
    
    # Coordinates: UOW Library to North Wollongong Station
    uow_lon, uow_lat = 150.8784, -34.4054
    station_lon, station_lat = 150.89136, -34.41227

    print("Fetching route...\n")
    route_steps = nav.get_walking_instructions(uow_lon, uow_lat, station_lon, station_lat)

    if route_steps:
        print("--- Navigation Instructions ---")
        for i, step in enumerate(route_steps, 1):
            print(f"Step {i}: {step}")
        print("-------------------------------")
    else:
        print("Failed to generate route.")