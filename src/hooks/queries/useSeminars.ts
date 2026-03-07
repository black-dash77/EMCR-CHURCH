import { useQuery } from '@tanstack/react-query';

import { seminarsApi } from '@/services/api/seminars';

export const seminarKeys = {
  all: ['seminars'] as const,
  lists: () => [...seminarKeys.all, 'list'] as const,
  withCount: () => [...seminarKeys.all, 'withCount'] as const,
  details: () => [...seminarKeys.all, 'detail'] as const,
  detail: (id: string) => [...seminarKeys.details(), id] as const,
  withSermons: (id: string) => [...seminarKeys.detail(id), 'sermons'] as const,
};

export function useSeminars() {
  return useQuery({
    queryKey: seminarKeys.lists(),
    queryFn: () => seminarsApi.getAll(),
  });
}

export function useSeminarsWithCount() {
  return useQuery({
    queryKey: seminarKeys.withCount(),
    queryFn: () => seminarsApi.getWithSermonCount(),
  });
}

export function useSeminarWithSermons(id: string) {
  return useQuery({
    queryKey: seminarKeys.withSermons(id),
    queryFn: () => seminarsApi.getWithSermons(id),
    enabled: !!id,
  });
}
