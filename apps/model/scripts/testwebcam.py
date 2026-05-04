import base64
import cv2
import requests

API_URL = "http://localhost:8080/detect"
API_KEY = ""

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    raise RuntimeError("Could not open webcam")

headers = {"X-API-Key": API_KEY} if API_KEY else {}

while True:
    ok, frame = cap.read()
    if not ok:
        break

    ok, buf = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
    if not ok:
        continue
    b64 = base64.b64encode(buf.tobytes()).decode("utf-8")

    try:
        r = requests.post(API_URL, json={"image_base64": b64}, headers=headers, timeout=10)
        data = r.json() if r.ok else {}
        detections = data.get("detections", [])
        scene = data.get("scene_description", "")

        # Draw label + bounding box
        for d in detections:
            name = d.get("name", "object")
            conf = float(d.get("confidence", 0))
            box = d.get("box", [0, 0, 0, 0])
            x1, y1, x2, y2 = [int(v) for v in box]

            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            label = f"{name} {conf:.2f}"
            cv2.putText(
                frame,
                label,
                (x1, max(20, y1 - 8)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 0),
                2,
                cv2.LINE_AA,
            )

        # Show scene description on top
        if scene:
            cv2.putText(
                frame,
                scene,
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (255, 255, 255),
                2,
                cv2.LINE_AA,
            )

        print(r.status_code, scene)

    except Exception as e:
        print("request failed:", e)

    cv2.imshow("Webcam labeled (press q to quit)", frame)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()