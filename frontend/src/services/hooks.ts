'use client';
import { useSyncExternalStore } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { incidentsRepository, replayRepository, sourcesRepository } from './repositories';
import { useUI } from '@/stores/ui-store';

/** false while the server renders and while React hydrates, true on every client render after. */
const subscribe = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

/**
 * The server renders every page in its "loading" state. The shared query cache can already hold
 * data by the time a page hydrates (the app shell fetches the same queries), which makes the first
 * client render differ from the server HTML and triggers React hydration error #418.
 * Reporting "still loading" for the hydration pass keeps both renders identical; real data appears
 * on the very next render.
 */
function hydrationSafe<T extends UseQueryResult<unknown, Error>>(query: T, hydrated: boolean): T {
  if (hydrated) return query;
  return {
    ...query,
    data: undefined,
    error: null,
    status: 'pending',
    fetchStatus: 'fetching',
    isPending: true,
    isLoading: true,
    isFetching: true,
    isSuccess: false,
    isError: false,
  } as T;
}

export const useIncidents = () => {
  const refresh = useUI((s) => s.refresh);
  const hydrated = useHydrated();
  return hydrationSafe(
    useQuery({
      queryKey: ['incidents'],
      queryFn: () => incidentsRepository.list(),
      refetchInterval: refresh !== 'manual' ? Number(refresh) * 1000 : false,
    }),
    hydrated,
  );
};
export const useEvidence = (id: string) => {
  const hydrated = useHydrated();
  return hydrationSafe(
    useQuery({
      queryKey: ['evidence', id],
      queryFn: () => incidentsRepository.evidence(id),
      enabled: !!id,
    }),
    hydrated,
  );
};
export const useSources = () => {
  const hydrated = useHydrated();
  return hydrationSafe(
    useQuery({ queryKey: ['sources'], queryFn: () => sourcesRepository.list() }),
    hydrated,
  );
};
export const useScenarios = () => {
  const hydrated = useHydrated();
  return hydrationSafe(
    useQuery({ queryKey: ['scenarios'], queryFn: () => replayRepository.listScenarios() }),
    hydrated,
  );
};
