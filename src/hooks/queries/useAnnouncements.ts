import { useQuery } from '@tanstack/react-query';

import { announcementsApi } from '@/services/api';

export const announcementKeys = {
  all: ['announcements'] as const,
  lists: () => [...announcementKeys.all, 'list'] as const,
  latest: (limit: number) => [...announcementKeys.all, 'latest', limit] as const,
  details: () => [...announcementKeys.all, 'detail'] as const,
  detail: (id: string) => [...announcementKeys.details(), id] as const,
};

export function useLatestAnnouncements(limit: number = 1) {
  return useQuery({
    queryKey: announcementKeys.latest(limit),
    queryFn: () => announcementsApi.getLatest(limit),
  });
}

export function useAnnouncements() {
  return useQuery({
    queryKey: announcementKeys.lists(),
    queryFn: () => announcementsApi.getAll(),
  });
}

export function useAnnouncementById(id: string) {
  return useQuery({
    queryKey: announcementKeys.detail(id),
    queryFn: () => announcementsApi.getById(id),
    enabled: !!id,
  });
}
