import { useCallback } from 'react';
import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';

export interface UserProfile {
  userId: string;
  displayName?: string;
  avatarKey?: string;
  createdAt?: string;
  updatedAt?: string;
}

const fetcher = () =>
  apiClient.get<UserProfile>('/user-profile/user/me').then((r) => r.data);

export function useProfile() {
  const { data, error, mutate } = useSWR<UserProfile>(
    '/user-profile/user/me',
    fetcher,
  );

  const update = useCallback(
    async (fields: Pick<UserProfile, 'displayName'>) => {
      await apiClient.put('/user-profile/user/me', fields);
      await mutate();
    },
    [mutate],
  );

  return { profile: data, loading: !data && !error, error, update };
}
