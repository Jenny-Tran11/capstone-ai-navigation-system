import type { BaseObject } from './base-object';

export interface DetectionResult {
  name: string;
  confidence: number;
  box: [number, number, number, number];
}

export interface Detection extends BaseObject {
  detectionId: string;
  userId: string;
  sceneDescription: string;
  detections: DetectionResult[];
  imageKey?: string;
}
