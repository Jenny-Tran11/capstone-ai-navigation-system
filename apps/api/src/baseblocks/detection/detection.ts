import type { Detection } from '@baseline/types/detection';

export const detectionMapper = (data: Detection): Detection => ({
  detectionId: data?.detectionId,
  userId: data?.userId,
  sceneDescription: data?.sceneDescription,
  detections: data?.detections,
  imageKey: data?.imageKey,
  createdAt: data?.createdAt,
  updatedAt: data?.updatedAt,
});
