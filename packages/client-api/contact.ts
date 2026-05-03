import type { ContactSubmission } from '@baseline/types/contact';
import type { RequestHandler } from './request-handler';

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export const submitContact = async (
  requestHandler: RequestHandler,
  data: ContactFormData,
): Promise<ContactSubmission> => {
  const response = await requestHandler.request<ContactSubmission>({
    method: 'POST',
    url: `contact`,
    hasAuthentication: false,
    data,
  });
  if ('data' in response) {
    return response.data;
  }
  throw response;
};
