# Mobile assets

## Optional on-device model (`model.tflite`)

Place a Roboflow-exported YOLOv8 TFLite weights file here as `model.tflite` if you enable on-device detection in `local-inference.ts`.

This file is **not** committed to git (large binary). Production APK builds use the cloud detect API via `EXPO_PUBLIC_DETECT_API_URL` instead.
