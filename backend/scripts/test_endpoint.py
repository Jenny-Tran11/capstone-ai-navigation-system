import argparse
import base64
import json
from pathlib import Path

import requests


def main() -> None:
    parser = argparse.ArgumentParser(description="Test the /detect Lambda endpoint.")
    parser.add_argument("--url", required=True, help="Base URL of the API (e.g. https://abc123.execute-api.region.amazonaws.com/prod)")
    parser.add_argument("--api-key", required=True, help="API key for the Gateway usage plan")
    parser.add_argument("--image", required=True, help="Path to a test image file")
    args = parser.parse_args()

    img_path = Path(args.image)
    if not img_path.is_file():
        raise SystemExit(f"Image not found: {img_path}")

    image_bytes = img_path.read_bytes()
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    payload = {"image_base64": image_b64}

    url = args.url.rstrip("/") + "/detect"
    resp = requests.post(
        url,
        headers={
            "Content-Type": "application/json",
            "x-api-key": args.api_key,
        },
        data=json.dumps(payload),
        timeout=30,
    )

    print("Status:", resp.status_code)
    try:
        print(json.dumps(resp.json(), indent=2))
    except Exception:
        print(resp.text)


if __name__ == "__main__":
    main()

