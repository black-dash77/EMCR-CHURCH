import { useQuery } from '@tanstack/react-query';

import { sermonsApi } from '@/services/api/sermons';

export const sermonKeys = {
  all: ['sermons'] as const,
  lists: () => [...sermonKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...sermonKeys.lists(), filters] as const,
  latest: (limit: number) => [...sermonKeys.all, 'latest', limit] as const,
  details: () => [...sermonKeys.all, 'detail'] as const,
  detail: (id: string) => [...sermonKeys.details(), id] as const,
  bySpeaker: (speakerId: string) => [...sermonKeys.all, 'bySpeaker', speakerId] as const,
  bySeminar: (seminarId: string) => [...sermonKeys.all, 'bySeminar', seminarId] as const,
};

export function useLatestSermons(limit: number = 6) {
  return useQuery({
    queryKey: sermonKeys.latest(limit),
    queryFn: () => sermonsApi.getLatest(limit),
  });
}

export function useSermons() {
  return useQuery({
    queryKey: sermonKeys.lists(),
    queryFn: () => sermonsApi.getAll(),
  });
}

export function useSermonById(id: string) {
  return useQuery({
    queryKey: sermonKeys.detail(id),
    queryFn: () => sermonsApi.getById(id),
    enabled: !!id,
  });
}

export function useSermonWithProfile(id: string) {
  return useQuery({
    queryKey: [...sermonKeys.detail(id), 'profile'],
    queryFn: () => sermonsApi.getWithSpeakerProfile(id),
    enabled: !!id,
  });
}

export function useSermonsBySpeaker(speakerId: string) {
  return useQuery({
    queryKey: sermonKeys.bySpeaker(speakerId),
    queryFn: () => sermonsApi.getBySpeaker(speakerId),
    enabled: !!speakerId,
  });
}

export function useSermonsBySeminar(seminarId: string) {
  return useQuery({
    queryKey: sermonKeys.bySeminar(seminarId),
    queryFn: () => sermonsApi.getBySeminar(seminarId),
    enabled: !!seminarId,
  });
}
