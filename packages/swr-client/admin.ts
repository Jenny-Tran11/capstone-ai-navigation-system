import { getAllAdmins } from '@baseline/client-api/admin';
import { getRequestHandler } from '@baseline/client-api/request-handler';
import type { Admin } from '@baseline/types/admin';
import useSWR from 'swr';

export const useAdmins = () => {
  const { data, error, isLoading, mutate } = useSWR<Admin[], unknown>(
    'admin/list',
    () => getAllAdmins(getRequestHandler()),
  );

  return {
    admins: data,
    isLoading,
    error,
    mutateAdmins: mutate,
  };
};
