import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import jpeg from 'jpeg-js';
import { loadTensorflowModel, type TensorflowModel } from 'react-native-fast-tflite';
import type { DetectionResult } from './detection-api';

// ─── Config ───────────────────────────────────────────────────────────────────

const MODEL_INPUT_SIZE = 640;
const CONFIDENCE_THRESHOLD = 0.35;
const IOU_THRESHOLD = 0.45;

// Alphabetical order — matches Roboflow TFLite label map
const CLASSES = ['animal', 'bike', 'crosswalk', 'hazard-sign', 'person', 'stairs', 'vehicle'] as const;
const NUM_CLASSES = CLASSES.length; // 7  →  output rows = 4 + 7 = 11

// ─── Model singleton ──────────────────────────────────────────────────────────

let modelPromise: Promise<TensorflowModel> | null = null;

export function loadLocalModel(): Promise<TensorflowModel> {
  if (!modelPromise) {
    modelPromise = loadTensorflowModel(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('../../../assets/model.tflite'),
    ).catch((err) => {
      modelPromise = null;
      throw err;
    });
  }
  return modelPromise;
}

export function isLocalModelAvailable(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../../../assets/model.tflite');
    return true;
  } catch {
    return false;
  }
}

// ─── Image → Float32 tensor ───────────────────────────────────────────────────

async function imageUriToTensor(uri: string): Promise<Float32Array> {
  // 1. Resize to 640×640 using expo-image-manipulator (GPU-accelerated on device)
  const resized = await manipulateAsync(
    uri,
    [{ resize: { width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE } }],
    { base64: true, format: SaveFormat.JPEG },
  );

  // 2. Decode base64 → Uint8Array
  const b64 = resized.base64!;
  const binary = atob(b64);
  const jpegBytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) jpegBytes[i] = binary.charCodeAt(i);

  // 3. Decode JPEG → RGBA pixels via jpeg-js
  const { data: rgba } = jpeg.decode(jpegBytes.buffer as ArrayBuffer, { useTArray: true });

  // 4. RGBA → normalised RGB Float32 [640 * 640 * 3]
  const numPixels = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE;
  const tensor = new Float32Array(numPixels * 3);
  for (let i = 0; i < numPixels; i++) {
    tensor[i * 3]     = rgba[i * 4]     / 255; // R
    tensor[i * 3 + 1] = rgba[i * 4 + 1] / 255; // G
    tensor[i * 3 + 2] = rgba[i * 4 + 2] / 255; // B
  }
  return tensor;
}

// ─── YOLOv8 output decoder ────────────────────────────────────────────────────
// Roboflow YOLOv8n TFLite output shape: [1, 11, 8400]  (channels-first)
// Each of the 8400 columns: [cx, cy, w, h, cls0…cls6]
// cx/cy/w/h are in 0–640 pixel space.

type RawBox = { x1: number; y1: number; x2: number; y2: number; score: number; classIdx: number };

function decodeOutput(
  data: Float32Array,
  imgW: number,
  imgH: number,
): RawBox[] {
  const COLS = 8400;
  const ROWS = 4 + NUM_CLASSES; // 11

  // Handle both [11, 8400] and [8400, 11] orientations
  let buf = data;
  if (data.length === COLS * ROWS && data.length !== ROWS * COLS) {
    // ambiguous — assume channels-first [11, 8400]
  } else if (data.length === COLS * ROWS) {
    // could be either; default channels-first
  }

  // If output appears transposed ([8400, 11]), pivot it
  const isRowsFirst = data.length === COLS * ROWS &&
    // heuristic: first 4 values of a channels-first layout are cx/cy/w/h
    // and should be in 0–640 range; if they look like class scores (<1) assume transposed
    Math.max(data[0], data[1], data[2], data[3]) < 2;

  if (isRowsFirst) {
    buf = new Float32Array(ROWS * COLS);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        buf[r * COLS + c] = data[c * ROWS + r];
      }
    }
  }

  const boxes: RawBox[] = [];
  for (let c = 0; c < COLS; c++) {
    let bestScore = 0;
    let bestClass = 0;
    for (let k = 0; k < NUM_CLASSES; k++) {
      const s = buf[(4 + k) * COLS + c];
      if (s > bestScore) { bestScore = s; bestClass = k; }
    }
    if (bestScore < CONFIDENCE_THRESHOLD) continue;

    const cx = buf[0 * COLS + c];
    const cy = buf[1 * COLS + c];
    const w  = buf[2 * COLS + c];
    const h  = buf[3 * COLS + c];

    boxes.push({
      x1: Math.max(0, (cx - w / 2) / MODEL_INPUT_SIZE) * imgW,
      y1: Math.max(0, (cy - h / 2) / MODEL_INPUT_SIZE) * imgH,
      x2: Math.min(1, (cx + w / 2) / MODEL_INPUT_SIZE) * imgW,
      y2: Math.min(1, (cy + h / 2) / MODEL_INPUT_SIZE) * imgH,
      score: bestScore,
      classIdx: bestClass,
    });
  }

  return nms(boxes);
}

// ─── NMS ──────────────────────────────────────────────────────────────────────

function iou(a: RawBox, b: RawBox): number {
  const ix1 = Math.max(a.x1, b.x1), iy1 = Math.max(a.y1, b.y1);
  const ix2 = Math.min(a.x2, b.x2), iy2 = Math.min(a.y2, b.y2);
  const inter = Math.max(0, ix2 - ix1) * Math.max(0, iy2 - iy1);
  if (!inter) return 0;
  return inter / ((a.x2 - a.x1) * (a.y2 - a.y1) + (b.x2 - b.x1) * (b.y2 - b.y1) - inter);
}

function nms(boxes: RawBox[]): RawBox[] {
  boxes.sort((a, b) => b.score - a.score);
  const suppressed = new Uint8Array(boxes.length);
  const keep: RawBox[] = [];
  for (let i = 0; i < boxes.length; i++) {
    if (suppressed[i]) continue;
    keep.push(boxes[i]);
    for (let j = i + 1; j < boxes.length; j++) {
      if (!suppressed[j] && iou(boxes[i], boxes[j]) > IOU_THRESHOLD) suppressed[j] = 1;
    }
  }
  return keep;
}

// ─── Public ───────────────────────────────────────────────────────────────────

export async function runLocalInference(
  imageUri: string,
  imageWidth: number,
  imageHeight: number,
): Promise<DetectionResult[]> {
  const [model, tensor] = await Promise.all([
    loadLocalModel(),
    imageUriToTensor(imageUri),
  ]);

  const [output] = model.runSync([tensor]);
  const boxes = decodeOutput(output as unknown as Float32Array, imageWidth, imageHeight);

  const classifyObstacleType = (
    name: string,
  ): DetectionResult['obstacleType'] => {
    const n = name.toLowerCase();
    if (['person', 'bike', 'vehicle', 'animal'].includes(n)) return 'dynamic';
    if (['stairs', 'crosswalk'].includes(n)) return 'surface';
    if (['hazard-sign'].includes(n)) return 'static';
    return 'unknown';
  };

  const inferProximity = (
    box: [number, number, number, number],
  ): DetectionResult['proximity'] => {
    const area = Math.max(0, box[2] - box[0]) * Math.max(0, box[3] - box[1]);
    const ratio = area / Math.max(1, imageWidth * imageHeight);
    if (ratio >= 0.2) return 'very_near';
    if (ratio >= 0.1) return 'near';
    return 'far';
  };

  return boxes.map((b) => ({
    name: CLASSES[b.classIdx],
    confidence: b.score,
    box: [b.x1, b.y1, b.x2, b.y2],
    obstacleType: classifyObstacleType(CLASSES[b.classIdx]),
    proximity: inferProximity([b.x1, b.y1, b.x2, b.y2]),
  }));
}
