import type { Detection, DetectionResult } from '@baseline/types/detection';
import type { RequestHandler } from './request-handler';

export const getAllDetections = async (requestHandler: RequestHandler): Promise<Detection[]> => {
  const response = await requestHandler.request<Detection[]>({
    method: 'GET',
    url: 'detection/admin/list',
    hasAuthentication: true,
  });
  if ('data' in response) return response.data;
  throw response;
};

export const getDetection = async (
  requestHandler: RequestHandler,
  detectionId: string,
): Promise<Detection> => {
  const response = await requestHandler.request<Detection>({
    method: 'GET',
    url: `detection/admin/${detectionId}`,
    hasAuthentication: true,
  });
  if ('data' in response) return response.data;
  throw response;
};

export const deleteDetection = async (
  requestHandler: RequestHandler,
  detectionId: string,
): Promise<boolean> => {
  const response = await requestHandler.request<boolean>({
    method: 'DELETE',
    url: `detection/admin/${detectionId}`,
    hasAuthentication: true,
  });
  if ('data' in response) return response.data;
  throw response;
};

export const saveDetection = async (
  requestHandler: RequestHandler,
  data: { sceneDescription: string; detections: DetectionResult[]; imageKey?: string },
): Promise<Detection> => {
  const response = await requestHandler.request<Detection>({
    method: 'POST',
    url: 'detection/user',
    hasAuthentication: true,
    data,
  });
  if ('data' in response) return response.data;
  throw response;
};

export const getMyDetections = async (requestHandler: RequestHandler): Promise<Detection[]> => {
  const response = await requestHandler.request<Detection[]>({
    method: 'GET',
    url: 'detection/user/my',
    hasAuthentication: true,
  });
  if ('data' in response) return response.data;
  throw response;
};
