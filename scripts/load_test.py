import argparse
import base64
import json
import statistics
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import List

import requests


def send_request(url: str, api_key: str, image_b64: str) -> float:
    payload = {"image_base64": image_b64}
    start = time.perf_counter()
    resp = requests.post(
        url,
        headers={
            "Content-Type": "application/json",
            "x-api-key": api_key,
        },
        data=json.dumps(payload),
        timeout=30,
    )
    elapsed_ms = (time.perf_counter() - start) * 1000.0
    if resp.status_code != 200:
        raise RuntimeError(f"Non-200 response: {resp.status_code} {resp.text}")
    return elapsed_ms


def main() -> None:
    parser = argparse.ArgumentParser(description="Simple load test for /detect endpoint.")
    parser.add_argument("--url", required=True, help="Base URL of the API (e.g. https://abc123.execute-api.region.amazonaws.com/prod)")
    parser.add_argument("--api-key", required=True, help="API key for the Gateway usage plan")
    parser.add_argument("--image", required=True, help="Path to a test image file")
    parser.add_argument("--concurrency", type=int, default=5, help="Number of concurrent requests")
    parser.add_argument("--requests", type=int, default=20, help="Total number of requests to send")
    args = parser.parse_args()

    img_path = Path(args.image)
    if not img_path.is_file():
        raise SystemExit(f"Image not found: {img_path}")

    image_bytes = img_path.read_bytes()
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    url = args.url.rstrip("/") + "/detect"

    latencies: List[float] = []
    errors = 0

    with ThreadPoolExecutor(max_workers=args.concurrency) as executor:
        futures = [
            executor.submit(send_request, url, args.api_key, image_b64)
            for _ in range(args.requests)
        ]
        for fut in as_completed(futures):
            try:
                latencies.append(fut.result())
            except Exception as exc:
                errors += 1
                print(f"Request failed: {exc}")

    if not latencies:
        print("No successful requests.")
        return

    latencies.sort()
    p50 = statistics.median(latencies)
    p95 = latencies[int(len(latencies) * 0.95) - 1]

    print(f"Total requests: {args.requests}")
    print(f"Successful: {len(latencies)}  Errors: {errors}")
    print(f"p50 latency: {p50:.1f} ms")
    print(f"p95 latency: {p95:.1f} ms")


if __name__ == "__main__":
    main()

