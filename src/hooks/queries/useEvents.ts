import { useQuery } from '@tanstack/react-query';

import { eventsApi } from '@/services/api/events';

export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  upcoming: (limit: number) => [...eventKeys.all, 'upcoming', limit] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
  byMonth: (year: number, month: number) => [...eventKeys.all, 'byMonth', year, month] as const,
};

export function useUpcomingEvents(limit: number = 5) {
  return useQuery({
    queryKey: eventKeys.upcoming(limit),
    queryFn: () => eventsApi.getUpcoming(limit),
  });
}

export function useEvents() {
  return useQuery({
    queryKey: eventKeys.lists(),
    queryFn: () => eventsApi.getAll(),
  });
}

export function useEventById(id: string) {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: () => eventsApi.getById(id),
    enabled: !!id,
  });
}

export function useEventsByMonth(year: number, month: number) {
  return useQuery({
    queryKey: eventKeys.byMonth(year, month),
    queryFn: () => eventsApi.getByMonth(year, month),
  });
}
