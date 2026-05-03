import type { ContactSubmission } from '@baseline/types/contact';

export const ContactMapper = (data: ContactSubmission): ContactSubmission => {
  const submission: ContactSubmission = {
    id: data?.id,
    name: data?.name,
    email: data?.email,
    message: data?.message,
    createdAt: data?.createdAt,
  };
  return submission;
};
