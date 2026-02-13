# AI-Assisted Navigation System for the Visually Impaired (Group 11)

## Project Overview

This repository contains the Proof of Concept (PoC) implementation for the Group 11 Capstone Project. The system utilizes computer vision models (YOLOv12) to detect obstacles in real-time and provides spatial audio feedback, alongside turn-by-turn routing instructions, to assist visually impaired users in navigating their environment safely.

### Current Features

- **Advanced Object Detection**: Integration of the YOLOv12 architecture to identify specific urban obstacles (Person, Car, Traffic Light, etc.).
- **Spatial Awareness Logic**: Custom algorithms that translate bounding box coordinates into natural language spatial descriptions (e.g., "Person on the left", "Car approaching").
- **Turn-by-Turn Navigation**: Integration with the OSRM (Open Source Routing Machine) API to fetch and parse walking directions into human-readable English instructions.
- **Cross-Platform Audio Feedback**: Native system TTS (macOS) and pyttsx3 (Windows) integration for seamless auditory guidance.

## Technical Stack

- **Language**: Python 3.9+
- **Computer Vision Framework**: Ultralytics (YOLO)
- **Image Processing**: OpenCV
- **Routing Engine**: OSRM API (Public Foot Profile)
- **Audio Engine**: System Native TTS (macOS) / pyttsx3 (Windows)
- **Networking/GUI**: requests, Tkinter

## Installation and Usage

Follow these steps to set up the prototype environment.

### 1. Prerequisite

Ensure Python 3.9 or higher is installed.

### 2. Environment Setup

It is recommended to run this project in a virtual environment.

**macOS / Linux:**

```bash
python3 -m venv venv
source venv/bin/activate

```

**Windows:**

```bash
python -m venv venv
.\venv\Scripts\activate

```

### 3. Install Dependencies

```bash
pip install ultralytics opencv-python pyttsx3 tk requests

```

### 4. Download Model Weights

Ensure the YOLO model weight file (e.g., yolov12n.pt) is placed in the project root directory. The script is configured to look for this file automatically.

### 5. Run the Application

```bash
python main.py

```

**Usage Instructions:**

1. The terminal will display "System Ready".
2. A file dialog window will open. Select a test image from your dataset.
3. The system will analyze the image, display detection results with bounding boxes, and play the corresponding audio guidance.
4. Close the image window or press any key to proceed to the next image.
5. (Optional) Run `python navigation_service.py` to test the standalone routing engine.

## Project Structure

The codebase is organized into modular services to facilitate future cloud migration.

- **config.py**: Central configuration file for model paths, confidence thresholds, and target class IDs.
- **main.py**: The entry point of the application, handling the GUI loop and user interaction.
- **vision_service.py**: Encapsulates the computer vision logic, including model loading, inference, and spatial analysis.
- **navigation_service.py**: Handles external API calls to OSRM and translates raw JSON routing data into natural English instructions.
- **voice_service.py**: Handles text-to-speech synthesis, including specific compatibility fixes for macOS.

## Roadmap: Migration to AWS Cloud

This local prototype serves as the logic verification step. The architecture is designed to be migrated to Amazon Web Services (AWS) in the next phase.

### Phase 1: Local Logic Validation (Completed)

- Validated YOLO inference accuracy on street view data.
- Refined the logic for converting visual data and routing data into spoken instructions.

### Phase 2: Cloud Deployment (Next Step)

The Python modules developed here will be mapped to AWS services:

1. **vision_service.py -> AWS EC2 / Lambda**:

- The object detection logic will be containerized (Docker) and deployed to an AWS EC2 instance (e.g., g4dn series) to handle heavy inference loads, or optimized for AWS Lambda for a serverless approach.

2. **navigation_service.py -> AWS Lambda**:

- The routing request and parsing logic will be hosted on Lambda as a lightweight microservice to offload computation from the mobile client.

3. **voice_service.py -> Amazon Polly**:

- The local TTS engine will be replaced by Amazon Polly APIs to generate high-quality, neural audio files that can be streamed to mobile devices.

4. **App Integration -> AWS API Gateway**:

- A REST API will be set up using AWS API Gateway to receive requests (images and GPS coordinates) from the mobile app and return the audio response.

### Phase 3: Mobile Client

- Development of a lightweight mobile application (React Native) that captures images, tracks location, and communicates with the AWS backend.
