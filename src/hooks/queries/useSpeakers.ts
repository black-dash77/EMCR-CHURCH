import { useQuery } from '@tanstack/react-query';

import { speakersApi } from '@/services/api/speakers';

export const speakerKeys = {
  all: ['speakers'] as const,
  lists: () => [...speakerKeys.all, 'list'] as const,
  withCount: () => [...speakerKeys.all, 'withCount'] as const,
  details: () => [...speakerKeys.all, 'detail'] as const,
  detail: (id: string) => [...speakerKeys.details(), id] as const,
  withSermons: (id: string) => [...speakerKeys.detail(id), 'sermons'] as const,
};

export function useSpeakers() {
  return useQuery({
    queryKey: speakerKeys.lists(),
    queryFn: () => speakersApi.getAll(),
  });
}

export function useSpeakersWithCount() {
  return useQuery({
    queryKey: speakerKeys.withCount(),
    queryFn: () => speakersApi.getWithSermonCount(),
  });
}

export function useSpeakerWithSermons(id: string) {
  return useQuery({
    queryKey: speakerKeys.withSermons(id),
    queryFn: () => speakersApi.getWithSermons(id),
    enabled: !!id,
  });
}
