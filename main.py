import cv2
import tkinter as tk
from tkinter import filedialog
import sys

# Import our custom modules
from vision_service import ObjectDetector
from voice_service import VoiceAssistant

class NavigationApp:
    def __init__(self):
        print("Initializing System...")
        self.vision = ObjectDetector()
        self.voice = VoiceAssistant()
        
        # Setup hidden tkinter window for file dialog
        self.root = tk.Tk()
        self.root.withdraw()

    def select_image(self):
        return filedialog.askopenfilename(
            title="Select Image (Blind Navigation Demo)",
            filetypes=[("Image files", "*.jpg *.jpeg *.png")]
        )

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

    def run(self):
        if not self.vision.model:
            print("System Check Failed: Model not loaded.")
            return

        print("System Ready. Please select an image.")

        while True:
            img_path = self.select_image()
            if not img_path:
                print("No selection. Exiting.")
                break

            # 1. Load Image
            frame = cv2.imread(img_path)
            if frame is None:
                continue
            
            h, w, _ = frame.shape

            # 2. Vision Processing
            detections = self.vision.detect(frame)
            navigation_msg = self.vision.analyze_scene(detections, w, h)

            # 3. Audio Feedback
            self.voice.speak(navigation_msg)

            # 4. Visual Feedback (Demo View)
            display_img = self.draw_overlay(frame, detections)
            cv2.imshow("Navigation Demo (Press any key for next)", display_img)
            
            # Wait for user input to proceed
            cv2.waitKey(0)
            cv2.destroyAllWindows()

if __name__ == "__main__":
    app = NavigationApp()
    app.run()