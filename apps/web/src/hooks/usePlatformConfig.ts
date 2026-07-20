import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface PlatformConfig {
  requireEmployeeLocation: boolean;
  brandTitle: string | null;
  brandAddress: string | null;
  brandIconUrl: string | null;
  brandSubtitleCompany: string | null;
  brandSubtitleAdmin: string | null;
  brandSubtitleReseller: string | null;
  brandSubtitleMarketer: string | null;
}

export function usePlatformConfig() {
  return useQuery({
    queryKey: ['platform-config'],
    queryFn: () => api.get<PlatformConfig>('/platform/config'),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
