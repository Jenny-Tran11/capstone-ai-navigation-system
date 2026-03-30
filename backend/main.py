import argparse
import cv2
import sys
import time
import threading
from queue import PriorityQueue

# Import our custom modules
from vision_service import ObjectDetector
from voice_service import VoiceAssistant
from navigation_service import NavigationEngine
import config


PRIORITY_OBSTACLE = 1
PRIORITY_NAV = 2
PRIORITY_SENTINEL = 0


class NavigationApp:
    def __init__(self):
        print("Initializing System...")
        self.vision = ObjectDetector()
        self.voice = VoiceAssistant()
        self.nav_engine = NavigationEngine()

        self.tts_queue: PriorityQueue = PriorityQueue()
        self.sequence_counter = 0

        self.last_obstacle_time = 0.0
        self.last_obstacle_msg = None

        self._stop_event = threading.Event()
        self.nav_thread: threading.Thread | None = None

        self.tts_thread = threading.Thread(target=self._tts_worker, daemon=True)
        self.tts_thread.start()

    def _tts_worker(self):
        while True:
            priority, _, msg = self.tts_queue.get()
            if priority == PRIORITY_SENTINEL and msg is None:
                self.tts_queue.task_done()
                break
            try:
                self.voice.speak(msg)
            finally:
                self.tts_queue.task_done()

    def draw_overlay(self, image, detections):
        """
        Draws boxes on the image for the demo screen.
        """
        annotated = image.copy()
        for det in detections:
            x1, y1, x2, y2 = map(int, det['box'])
            label = f"{det['name']}"
            
            cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(annotated, label, (x1, y1-10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        return annotated

    def _next_seq(self) -> int:
        self.sequence_counter += 1
        return self.sequence_counter

    def _should_speak(self, message: str) -> bool:
        if not message:
            return False

        now = time.monotonic()

        if self.last_obstacle_msg == message:
            return False

        if now - self.last_obstacle_time < config.MIN_VOICE_INTERVAL_SEC:
            return False

        self.last_obstacle_time = now
        self.last_obstacle_msg = message
        return True

    def _navigation_worker(self, instructions: list[str]):
        for instruction in instructions:
            if self._stop_event.is_set():
                break
            self.tts_queue.put(
                (PRIORITY_NAV, self._next_seq(), instruction),
            )
            # Sleep between steps unless we're stopping
            for _ in range(config.NAV_STEP_INTERVAL_SEC):
                if self._stop_event.is_set():
                    break
                time.sleep(1)

    def run(self, video_source, start_location: str | None, end_location: str | None):
        if not self.vision.model:
            print("System Check Failed: Model not loaded.")
            return

        cap = cv2.VideoCapture(video_source)

        if not cap.isOpened():
            print(f"Error: Unable to open video source: {video_source}")
            return

        if isinstance(video_source, int):
            print(f"System Ready. Using webcam index {video_source}. Press 'q' to exit.")
        else:
            print(f"System Ready. Playing video file '{video_source}'. Press 'q' to exit.")

        # Set up navigation if start/end provided
        if start_location and end_location:
            start_coords = self.nav_engine.parse_location(start_location)
            end_coords = self.nav_engine.parse_location(end_location)

            if not start_coords or not end_coords:
                print("Could not resolve start or end location. Navigation disabled.")
            else:
                s_lon, s_lat = start_coords
                e_lon, e_lat = end_coords
                steps = self.nav_engine.get_walking_instructions(
                    s_lon, s_lat, e_lon, e_lat,
                )
                if steps:
                    summary = (
                        f"Route found with {len(steps)} steps. "
                        "Starting navigation."
                    )
                    self.tts_queue.put(
                        (PRIORITY_NAV, self._next_seq(), summary),
                    )
                    self.nav_thread = threading.Thread(
                        target=self._navigation_worker,
                        args=(steps,),
                        daemon=True,
                    )
                    self.nav_thread.start()
                else:
                    print("No navigation route available. Navigation disabled.")

        try:
            while True:
                start_time = time.perf_counter()
                ret, frame = cap.read()

                if not ret:
                    print("End of stream or cannot read frame.")
                    break

                h, w = frame.shape[:2]

                detections = self.vision.detect(frame)
                navigation_msg = self.vision.analyze_scene(detections, w, h)

                if self._should_speak(navigation_msg):
                    self.tts_queue.put(
                        (PRIORITY_OBSTACLE, self._next_seq(), navigation_msg),
                    )

                display_img = self.draw_overlay(frame, detections)

                elapsed = time.perf_counter() - start_time
                fps = 1.0 / elapsed if elapsed > 0 else 0.0

                cv2.putText(
                    display_img,
                    f"FPS: {fps:.1f}",
                    (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0, 255, 0),
                    2,
                )

                # Some environments (or OpenCV builds) do not support GUI windows.
                # Protect imshow/waitKey so the app can still run headless.
                try:
                    cv2.imshow(
                        "Navigation Demo - Webcam/Video (press 'q' to quit)",
                        display_img,
                    )
                    key = cv2.waitKey(1) & 0xFF
                    if key == ord("q") or key == 27:
                        break
                except cv2.error as e:
                    print(
                        "OpenCV GUI is not available in this environment. "
                        "Continuing without display window."
                    )
                    # Exit the loop; processing has already happened.
                    break
        finally:
            self._stop_event.set()
            cap.release()
            try:
                cv2.destroyAllWindows()
            except cv2.error:
                # Safe to ignore if GUI support is not available
                pass

            # Signal TTS thread to exit and wait briefly
            self.tts_queue.put((PRIORITY_SENTINEL, self._next_seq(), None))
            if self.nav_thread is not None:
                self.nav_thread.join(timeout=2.0)
            self.tts_thread.join(timeout=1.0)


def __main__():
    parser = argparse.ArgumentParser(
        description="Blind navigation demo with vision and navigation.",
    )
    parser.add_argument(
        "--video",
        help="Video file path or camera index (default: webcam from config).",
        default=None,
    )
    parser.add_argument(
        "--start",
        help="Start location as 'lon,lat' or free-form address.",
        default=None,
    )
    parser.add_argument(
        "--end",
        help="End location as 'lon,lat' or free-form address.",
        default=None,
    )

    args = parser.parse_args()

    # Determine video source
    if args.video is None:
        video_source: int | str = config.VIDEO_SOURCE_DEFAULT
    elif args.video.isdigit():
        video_source = int(args.video)
    else:
        video_source = args.video

    app = NavigationApp()
    app.run(video_source, args.start, args.end)


if __name__ == "__main__":
    __main__()