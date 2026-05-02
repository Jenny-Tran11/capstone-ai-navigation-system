import useSWR from 'swr';
import { type Admin } from '@baseline/types/admin';
import { getAllAdmins } from '@baseline/client-api/admin';
import { getRequestHandler } from '@baseline/client-api/request-handler';

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
