import type { MobileRuntimeConfig } from '@baseline/types/app-config';
import type { RequestHandler } from './request-handler';

export const getAdminMobileConfig = async (
  requestHandler: RequestHandler,
): Promise<MobileRuntimeConfig> => {
  const response = await requestHandler.request<MobileRuntimeConfig>({
    method: 'GET',
    url: 'app-config/admin/mobile',
    hasAuthentication: true,
  });
  if ('data' in response) return response.data;
  throw response;
};

export const updateAdminMobileConfig = async (
  requestHandler: RequestHandler,
  data: Partial<MobileRuntimeConfig>,
): Promise<MobileRuntimeConfig> => {
  const response = await requestHandler.request<MobileRuntimeConfig>({
    method: 'PUT',
    url: 'app-config/admin/mobile',
    hasAuthentication: true,
    data,
  });
  if ('data' in response) return response.data;
  throw response;
};

export const checkAdminModelHealth = async (
  requestHandler: RequestHandler,
): Promise<{ status: string; model_loaded: boolean }> => {
  const response = await requestHandler.request<{
    status: string;
    model_loaded: boolean;
  }>({
    method: 'POST',
    url: 'app-config/admin/mobile/health',
    hasAuthentication: true,
  });
  if ('data' in response) return response.data;
  throw response;
};

export const runAdminModelTest = async (
  requestHandler: RequestHandler,
  data: {
    model: 'detect' | 'crossing';
    imageBase64?: string;
    imageUrl?: string;
  },
): Promise<unknown> => {
  const response = await requestHandler.request<unknown>({
    method: 'POST',
    url: 'app-config/admin/mobile/test',
    hasAuthentication: true,
    data,
  });
  if ('data' in response) return response.data;
  throw response;
};
